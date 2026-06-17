import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

/** Lecturas de Inventario (dropdowns/listas). RLS-scoped. */
@Injectable()
export class InventoryQueries {
  constructor(private readonly prisma: PrismaService) {}

  listProducts() {
    return withTenant(this.prisma, (tx) =>
      tx.product.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, sku: true, name: true, basePrice: true },
        take: 200,
      }),
    );
  }

  listWarehouses() {
    return withTenant(this.prisma, (tx) =>
      tx.warehouse.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true },
        take: 100,
      }),
    );
  }
}
