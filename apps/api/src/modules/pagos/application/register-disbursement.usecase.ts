import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventTypes } from '@nexus/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { currentTenantId, currentUserId } from '../../../shared/tenant/tenant-context';

@Injectable()
export class RegisterDisbursementUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  execute(input: { payableId: string; amount: string; method: string }) {
    return withTenant(this.prisma, async (tx) => {
      const p = await tx.payable.findFirst({ where: { id: input.payableId } });
      if (!p) throw new NotFoundException('Cuenta por pagar no encontrada');

      const amount = new Prisma.Decimal(input.amount);
      const newPaid = p.paidAmount.plus(amount);
      const rawBalance = p.amount.minus(newPaid);
      const balance = Prisma.Decimal.max(rawBalance, new Prisma.Decimal(0));
      const status = rawBalance.lte(0) ? 'PAID' : 'PARTIALLY_PAID';

      await tx.supplierPayment.create({
        data: {
          tenantId: currentTenantId()!,
          payableId: p.id,
          amount,
          method: input.method,
          registeredByUserId: currentUserId()!,
        },
      });
      await tx.payable.update({ where: { id: p.id }, data: { paidAmount: newPaid, balance, status } });

      await this.outbox.emit(tx, {
        eventType: EventTypes.DisbursementRegistered,
        aggregateType: 'Payable',
        aggregateId: p.id,
        payload: { payableId: p.id, amount: amount.toString(), balance: balance.toString(), status },
      });

      return { payableId: p.id, balance: balance.toString(), status };
    });
  }
}
