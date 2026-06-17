import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

/**
 * Dashboard ejecutivo: KPIs en tiempo real. Hoy son agregaciones en vivo
 * (read model lógico); cuando el volumen lo exija se materializan en tablas
 * de proyección alimentadas por eventos (CQRS).
 */
@Injectable()
export class GetExecutiveDashboardUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute() {
    return withTenant(this.prisma, async (tx) => {
      const [sales, outstanding, customers, products, orders] = await Promise.all([
        tx.invoice.aggregate({
          _sum: { total: true },
          where: { status: { in: ['ISSUED', 'PARTIALLY_PAID', 'PAID'] } },
        }),
        tx.receivable.aggregate({
          _sum: { balance: true },
          where: { status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] } },
        }),
        tx.customer.count({ where: { deletedAt: null } }),
        tx.product.count({ where: { deletedAt: null } }),
        tx.salesOrder.count(),
      ]);

      return {
        salesTotal: (sales._sum.total ?? 0).toString(),
        receivableOutstanding: (outstanding._sum.balance ?? 0).toString(),
        customersCount: customers,
        productsCount: products,
        ordersCount: orders,
      };
    });
  }
}
