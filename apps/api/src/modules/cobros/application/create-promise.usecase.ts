import { Injectable } from '@nestjs/common';
import { EventTypes } from '@nexus/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { currentTenantId, currentUserId } from '../../../shared/tenant/tenant-context';

/** Promesa de pago (gestión de cobranza en campo). Dispara recordatorios vía Automatización. */
@Injectable()
export class CreatePromiseUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  execute(input: { receivableId: string; promisedAmount: string; promisedDate: string; note?: string }) {
    return withTenant(this.prisma, async (tx) => {
      const promise = await tx.paymentPromise.create({
        data: {
          tenantId: currentTenantId()!,
          receivableId: input.receivableId,
          promisedAmount: input.promisedAmount,
          promisedDate: new Date(input.promisedDate),
          note: input.note ?? null,
          createdByUserId: currentUserId()!,
        },
      });

      await this.outbox.emit(tx, {
        eventType: EventTypes.PromiseCreated,
        aggregateType: 'PaymentPromise',
        aggregateId: promise.id,
        payload: {
          promiseId: promise.id,
          receivableId: input.receivableId,
          promisedDate: input.promisedDate,
        },
      });

      return { id: promise.id };
    });
  }
}
