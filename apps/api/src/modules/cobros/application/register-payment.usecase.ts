import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventTypes } from '@nexus/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { currentTenantId, currentUserId } from '../../../shared/tenant/tenant-context';
import { RECEIVABLE_REPOSITORY, type ReceivableRepositoryPort } from '../domain/cobros.ports';

@Injectable()
export class RegisterPaymentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(RECEIVABLE_REPOSITORY) private readonly repo: ReceivableRepositoryPort,
  ) {}

  execute(input: { receivableId: string; amount: string; method: string }) {
    return withTenant(this.prisma, async (tx) => {
      const r = await this.repo.getById(tx, input.receivableId);
      if (!r) throw new NotFoundException('Cuenta por cobrar no encontrada');

      const amount = new Prisma.Decimal(input.amount);
      const newPaid = r.paidAmount.plus(amount);
      const rawBalance = r.amount.minus(newPaid);
      const balance = Prisma.Decimal.max(rawBalance, new Prisma.Decimal(0));
      const status = rawBalance.lte(0) ? 'PAID' : 'PARTIALLY_PAID';

      await tx.payment.create({
        data: {
          tenantId: currentTenantId()!,
          receivableId: r.id,
          amount,
          method: input.method,
          registeredByUserId: currentUserId()!,
        },
      });
      await this.repo.applyPayment(tx, r.id, { paidAmount: newPaid, balance, status });

      await this.outbox.emit(tx, {
        eventType: EventTypes.PaymentRegistered,
        aggregateType: 'Receivable',
        aggregateId: r.id,
        payload: { receivableId: r.id, amount: amount.toString(), balance: balance.toString(), status },
      });

      return { receivableId: r.id, balance: balance.toString(), status };
    });
  }
}
