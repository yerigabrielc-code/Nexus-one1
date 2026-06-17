import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';
import { PurchaseOrder, type POLineInput } from '../domain/purchase-order.entity';

@Injectable()
export class CreatePurchaseOrderUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: { supplierId: string; warehouseId: string; lines: POLineInput[]; currency?: string }) {
    return withTenant(this.prisma, async (tx) => {
      const po = PurchaseOrder.create(input);
      const tenantId = currentTenantId()!;
      const count = await tx.purchaseOrder.count({ where: { tenantId } });
      const number = `PO-${(count + 1).toString().padStart(6, '0')}`;

      await tx.purchaseOrder.create({
        data: {
          id: po.id,
          tenantId,
          number,
          supplierId: po.supplierId,
          warehouseId: po.warehouseId,
          status: 'DRAFT',
          subtotal: po.subtotal,
          taxTotal: po.taxTotal,
          total: po.total,
          currency: po.currency,
          lines: {
            create: po.lines.map((l) => ({
              id: l.id,
              tenantId,
              productId: l.productId,
              quantity: l.quantity,
              unitCost: l.unitCost,
              taxRate: l.taxRate,
              lineTotal: l.lineTotal,
            })),
          },
        },
      });
      return { id: po.id, number, total: po.total.toString() };
    });
  }
}
