import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

@Injectable()
export class ComprasQueries {
  constructor(private readonly prisma: PrismaService) {}

  listSuppliers() {
    return withTenant(this.prisma, (tx) =>
      tx.supplier.findMany({
        where: { deletedAt: null },
        orderBy: { legalName: 'asc' },
        select: { id: true, code: true, legalName: true },
        take: 200,
      }),
    );
  }

  async listPurchaseOrders() {
    return withTenant(this.prisma, async (tx) => {
      const rows = await tx.purchaseOrder.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, number: true, status: true, total: true, supplierId: true },
        take: 100,
      });
      return rows.map((r) => ({ ...r, total: r.total.toString() }));
    });
  }
}
