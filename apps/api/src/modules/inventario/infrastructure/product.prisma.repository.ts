import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';
import type { Product } from '../domain/product.entity';
import type { ProductRepositoryPort } from '../domain/inventory.ports';

@Injectable()
export class ProductPrismaRepository implements ProductRepositoryPort {
  async existsBySku(tx: Tx, sku: string): Promise<boolean> {
    const found = await tx.product.findFirst({ where: { sku, deletedAt: null }, select: { id: true } });
    return found !== null;
  }

  async save(tx: Tx, product: Product): Promise<void> {
    const tenantId = currentTenantId()!;
    const p = product.props;
    await tx.product.create({
      data: {
        id: p.id,
        tenantId,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        costingMethod: p.costingMethod,
        trackLots: p.trackLots,
        trackSerials: p.trackSerials,
        basePrice: p.basePrice,
      },
    });
  }
}
