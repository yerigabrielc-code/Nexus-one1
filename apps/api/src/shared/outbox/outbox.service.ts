import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { DomainEventEnvelope } from '@nexus/contracts';
import type { Tx } from '../prisma/tenant-runner';
import { currentStore } from '../tenant/tenant-context';

/**
 * Patrón Transactional Outbox (ADR-003): el evento se persiste en la MISMA
 * transacción que el cambio de estado. El relay (worker) lo publica luego.
 * Esto elimina la inconsistencia "guardé pero no publiqué".
 */
@Injectable()
export class OutboxService {
  async emit(
    tx: Tx,
    params: {
      eventType: string;
      aggregateType: string;
      aggregateId: string;
      payload: Record<string, unknown>;
      correlationId?: string;
      eventVersion?: number;
    },
  ): Promise<void> {
    const store = currentStore();
    const tenantId = store?.tenantId;
    if (!tenantId) throw new Error('OutboxService.emit requiere tenant en contexto');

    const envelope: Omit<DomainEventEnvelope, 'payload'> = {
      eventId: randomUUID(),
      eventType: params.eventType,
      eventVersion: params.eventVersion ?? 1,
      occurredAt: new Date().toISOString(),
      tenantId,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      correlationId: params.correlationId,
      actor: store?.userId ? { userId: store.userId } : undefined,
    };

    await tx.outboxEvent.create({
      data: {
        id: envelope.eventId,
        tenantId,
        eventType: envelope.eventType,
        eventVersion: envelope.eventVersion,
        aggregateType: envelope.aggregateType,
        aggregateId: envelope.aggregateId,
        correlationId: envelope.correlationId ?? null,
        payload: { ...envelope, payload: params.payload } as object,
      },
    });
  }
}
