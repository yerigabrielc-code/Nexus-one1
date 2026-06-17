import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { buildAging } from '../domain/aging';

/** Aging Report: saldos por antigüedad (read model sobre receivable). */
@Injectable()
export class GetAgingUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute() {
    return withTenant(this.prisma, async (tx) => {
      const rows = await tx.receivable.findMany({
        where: { status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] } },
        select: { dueDate: true, balance: true },
      });
      return buildAging(rows);
    });
  }
}
