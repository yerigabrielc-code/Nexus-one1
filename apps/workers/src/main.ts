/**
 * Worker del Walking Skeleton. Dos responsabilidades (en producción serían
 * deployables separados):
 *
 *  1) RELAY DE OUTBOX: barre outbox_event pendientes y los publica a RabbitMQ
 *     (entrega at-least-once). Marca processedAt al confirmar.
 *  2) CONSUMIDOR: escucha el exchange de dominio y, ante 'comercial.customer.created',
 *     escribe un registro en audit_log (idempotente por eventId).
 *
 * Cierra el lazo: API (tx: customer + outbox) -> relay -> RabbitMQ -> consumer -> audit_log.
 */
import { PrismaClient } from '@prisma/client';
import amqp from 'amqplib';

const EXCHANGE = 'nexus.events';
const QUEUE = 'nexus.audit';
const POLL_MS = 1000;

// Conexión del CONSUMIDOR: rol de app (RLS activa); setea tenant por transacción.
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
// Conexión del RELAY: rol BYPASSRLS; lee outbox de TODOS los tenants.
const relayPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_RELAY_URL ?? process.env.DATABASE_MIGRATION_URL } },
});

async function setTenant(tx: any, tenantId: string) {
  await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
}

async function startRelay(channel: amqp.Channel) {
  setInterval(async () => {
    try {
      // El relay corre con BYPASSRLS, por eso ve eventos de todos los tenants.
      const pending = await relayPrisma.outboxEvent.findMany({
        where: { processedAt: null },
        orderBy: { occurredAt: 'asc' },
        take: 50,
      });
      for (const ev of pending) {
        channel.publish(EXCHANGE, ev.eventType, Buffer.from(JSON.stringify(ev.payload)), {
          messageId: ev.id,
          persistent: true,
        });
        await relayPrisma.outboxEvent.update({
          where: { id: ev.id },
          data: { processedAt: new Date(), attempts: { increment: 1 } },
        });
      }
      if (pending.length) console.log(`📤 Relay publicó ${pending.length} evento(s)`);
    } catch (err) {
      console.error('Relay error:', err);
    }
  }, POLL_MS);
}

async function startConsumer(channel: amqp.Channel) {
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, 'comercial.customer.created');
  await channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const envelope = JSON.parse(msg.content.toString());
      const tenantId: string = envelope.tenantId;
      const payload = envelope.payload;

      await prisma.$transaction(async (tx) => {
        await setTenant(tx, tenantId);
        await tx.auditLog.create({
          data: {
            tenantId,
            actorUserId: envelope.actor?.userId ?? null,
            action: 'customer.created',
            entityType: 'Customer',
            entityId: payload.customerId,
            after: payload,
          },
        });
      });
      console.log(`📥 audit_log <- cliente ${payload.code} (tenant ${tenantId})`);
      channel.ack(msg);
    } catch (err) {
      console.error('Consumer error:', err);
      channel.nack(msg, false, false); // a DLQ en producción
    }
  });
}

async function main() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL ?? 'amqp://nexus:nexus@localhost:5672');
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  await startConsumer(channel);
  await startRelay(channel);
  console.log('⚙️  Worker Nexus One iniciado (relay + consumer).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
