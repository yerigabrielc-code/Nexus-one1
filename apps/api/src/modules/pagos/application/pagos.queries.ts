import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

@Injectable()
export class PagosQueries {
  constructor(private readonly prisma: PrismaService) {}

  async listPayables() {
    return withTenant(this.prisma, async (tx) => {
      const rows = await tx.payable.findMany({
        orderBy: { dueDate: 'asc' },
        select: { id: true, supplierId: true, amount: true, balance: true, status: true, dueDate: true },
        take: 200,
      });
      return rows.map((r) => ({ ...r, amount: r.amount.toString(), balance: r.balance.toString() }));
    });
  }
}
