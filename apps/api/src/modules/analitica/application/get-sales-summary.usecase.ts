import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

/** Resumen comercial: facturas por estado + últimas facturas emitidas. */
@Injectable()
export class GetSalesSummaryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute() {
    return withTenant(this.prisma, async (tx) => {
      const byStatus = await tx.invoice.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { total: true },
      });

      const recent = await tx.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { number: true, ncf: true, total: true, status: true, issueDate: true },
      });

      return {
        byStatus: byStatus.map((g) => ({
          status: g.status,
          count: g._count._all,
          total: (g._sum.total ?? 0).toString(),
        })),
        recent: recent.map((r) => ({ ...r, total: r.total.toString() })),
      };
    });
  }
}
