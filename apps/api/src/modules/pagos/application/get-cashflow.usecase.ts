import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

/** Flujo de caja (egresos): CxP por vencer agrupadas por ventana de pago. */
@Injectable()
export class GetCashflowUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute() {
    return withTenant(this.prisma, async (tx) => {
      const rows = await tx.payable.findMany({
        where: { status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] } },
        select: { dueDate: true, balance: true },
      });
      const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
      const b = { overdue: D(0), d0_7: D(0), d8_30: D(0), d30_plus: D(0), total: D(0) };
      const now = Date.now();
      for (const r of rows) {
        const days = Math.floor((r.dueDate.getTime() - now) / 86_400_000);
        b.total = b.total.plus(r.balance);
        if (days < 0) b.overdue = b.overdue.plus(r.balance);
        else if (days <= 7) b.d0_7 = b.d0_7.plus(r.balance);
        else if (days <= 30) b.d8_30 = b.d8_30.plus(r.balance);
        else b.d30_plus = b.d30_plus.plus(r.balance);
      }
      return {
        overdue: b.overdue.toString(),
        next7: b.d0_7.toString(),
        next30: b.d8_30.toString(),
        beyond30: b.d30_plus.toString(),
        total: b.total.toString(),
      };
    });
  }
}
