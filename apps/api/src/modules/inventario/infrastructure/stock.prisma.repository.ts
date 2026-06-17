import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Tx } from '../../../shared/prisma/tenant-runner';
import { currentTenantId, currentUserId } from '../../../shared/tenant/tenant-context';
import type { StockRepositoryPort, StockSnapshot } from '../domain/inventory.ports';

@Injectable()
export class StockPrismaRepository implements StockRepositoryPort {
  async getStock(tx: Tx, productId: string, warehouseId: string): Promise<StockSnapshot> {
    const tenantId = currentTenantId()!;
    const item = await tx.stockItem.findUnique({
      where: { tenantId_productId_warehouseId: { tenantId, productId, warehouseId } },
    });
    return {
      id: item?.id ?? null,
      onHand: item?.onHand ?? new Prisma.Decimal(0),
      reserved: item?.reserved ?? new Prisma.Decimal(0),
      avgCost: item?.avgCost ?? new Prisma.Decimal(0),
    };
  }

  async upsertStock(
    tx: Tx,
    productId: string,
    warehouseId: string,
    data: { onHand: Prisma.Decimal; reserved: Prisma.Decimal; avgCost: Prisma.Decimal },
  ): Promise<void> {
    const tenantId = currentTenantId()!;
    await tx.stockItem.upsert({
      where: { tenantId_productId_warehouseId: { tenantId, productId, warehouseId } },
      create: { tenantId, productId, warehouseId, ...data },
      update: { onHand: data.onHand, reserved: data.reserved, avgCost: data.avgCost },
    });
  }

  async appendMovement(
    tx: Tx,
    m: {
      productId: string;
      warehouseId: string;
      type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RESERVATION' | 'RELEASE';
      quantity: Prisma.Decimal;
      unitCost: Prisma.Decimal;
      balanceAfter: Prisma.Decimal;
      refType?: string;
      refId?: string;
    },
  ): Promise<void> {
    const tenantId = currentTenantId()!;
    await tx.stockMovement.create({
      data: {
        tenantId,
        productId: m.productId,
        warehouseId: m.warehouseId,
        type: m.type,
        quantity: m.quantity,
        unitCost: m.unitCost,
        balanceAfter: m.balanceAfter,
        refType: m.refType ?? null,
        refId: m.refId ?? null,
        createdByUserId: currentUserId()!,
      },
    });
  }
}
