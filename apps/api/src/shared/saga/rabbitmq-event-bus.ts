import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as amqp from 'amqplib';
import { EventTypes } from '@nexus/contracts';
import { SagaDispatcher } from './saga.dispatcher';

const EXCHANGE = 'nexus.events';
const SAGA_QUEUE = 'nexus.saga';
const AUDIT_QUEUE = 'nexus.audit';
const RELAY_MS = 1000;

const SAGA_KEYS = [
  EventTypes.OrderConfirmed,
  EventTypes.InvoiceIssued,
  EventTypes.GoodsReceived,
  EventTypes.StockReservationFailed,
];

/**
 * RUTA DE PRODUCCIÓN (gated por RABBITMQ_ENABLED=true).
 *  - RELAY: lee outbox (rol BYPASSRLS) y publica al exchange topic; marca processedAt.
 *  - CONSUMER saga: enruta los eventos de negocio a los handlers (SagaDispatcher.handle).
 *  - CONSUMER audit: persiste todos los eventos en audit_log.
 * Entrega at-least-once: los handlers deben ser idempotentes (TODO: dedupe por eventId
 * + DLQ para venenos; aquí nack(no-requeue) para no bloquear la cola).
 */
@Injectable()
export class RabbitMqEventBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('RabbitMqEventBus');
  private conn?: any; // amqp.Connection | amqp.ChannelModel según versión
  private channel?: amqp.Channel;
  private relayPrisma?: PrismaClient;
  private timer?: NodeJS.Timeout;

  constructor(private readonly dispatcher: SagaDispatcher) {}

  async onModuleInit() {
    if (process.env.RABBITMQ_ENABLED !== 'true') return;

    this.relayPrisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_RELAY_URL ?? process.env.DATABASE_MIGRATION_URL } },
    });
    this.conn = await amqp.connect(process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672');
    const channel = await this.conn.createChannel();
    this.channel = channel;
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    // Consumer de saga
    await channel.assertQueue(SAGA_QUEUE, { durable: true });
    for (const k of SAGA_KEYS) await channel.bindQueue(SAGA_QUEUE, EXCHANGE, k);
    await channel.consume(SAGA_QUEUE, (msg: amqp.ConsumeMessage | null) => this.onSaga(msg));

    // Consumer de auditoría (todos los eventos)
    await channel.assertQueue(AUDIT_QUEUE, { durable: true });
    await channel.bindQueue(AUDIT_QUEUE, EXCHANGE, '#');
    await channel.consume(AUDIT_QUEUE, (msg: amqp.ConsumeMessage | null) => this.onAudit(msg));

    this.timer = setInterval(() => void this.relayTick(), RELAY_MS);
    this.logger.log('RabbitMQ event bus activo (relay + consumers saga/audit).');
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.channel?.close().catch(() => {});
    await this.conn?.close().catch(() => {});
    await this.relayPrisma?.$disconnect();
  }

  /** RELAY: outbox -> exchange. */
  private async relayTick() {
    try {
      const pending = await this.relayPrisma!.outboxEvent.findMany({
        where: { processedAt: null },
        orderBy: { occurredAt: 'asc' },
        take: 50,
      });
      for (const ev of pending) {
        this.channel!.publish(EXCHANGE, ev.eventType, Buffer.from(JSON.stringify(ev.payload)), {
          messageId: ev.id,
          persistent: true,
        });
        await this.relayPrisma!.outboxEvent.update({
          where: { id: ev.id },
          data: { processedAt: new Date(), attempts: { increment: 1 } },
        });
      }
      if (pending.length) this.logger.log(`Relay publicó ${pending.length} evento(s).`);
    } catch (err) {
      this.logger.error(`relay error: ${(err as Error).message}`);
    }
  }

  private async onSaga(msg: amqp.ConsumeMessage | null) {
    if (!msg) return;
    try {
      const env = JSON.parse(msg.content.toString());
      await this.dispatcher.handle(env.eventType, env.payload, env.tenantId);
      this.channel!.ack(msg);
    } catch (err) {
      this.logger.error(`saga handler error: ${(err as Error).message}`);
      this.channel!.nack(msg, false, false); // -> DLQ en producción
    }
  }

  private async onAudit(msg: amqp.ConsumeMessage | null) {
    if (!msg) return;
    try {
      const env = JSON.parse(msg.content.toString());
      // relayPrisma es BYPASSRLS: puede insertar audit_log de cualquier tenant.
      await this.relayPrisma!.auditLog.create({
        data: {
          tenantId: env.tenantId,
          actorUserId: env.actor?.userId ?? null,
          action: env.eventType,
          entityType: env.aggregateType,
          entityId: env.aggregateId,
          after: env.payload,
        },
      });
      this.channel!.ack(msg);
    } catch (err) {
      this.logger.error(`audit error: ${(err as Error).message}`);
      this.channel!.nack(msg, false, false);
    }
  }
}
