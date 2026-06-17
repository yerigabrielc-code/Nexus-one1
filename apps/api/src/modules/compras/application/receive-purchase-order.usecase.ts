import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventTypes } from '@nexus/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { currentTenantId, currentUserId } from '../../../shared/tenant/tenant-context';

const PAYMENT_TERM_DAYS = 30;

/**
 * Recibe una OC aprobada: registra la recepción y emite compras.goods.received.
 * La saga reacciona: Inventario hace la ENTRADA (recosteo) y Pagos crea la CxP.
 */
@Injectable()
export class ReceivePurchaseOrderUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  execute(orderId: string) {
    return withTenant(this.prisma, async (tx) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id: orderId },
        include: { lines: { select: { productId: true, quantity: true, unitCost: true } } },
      });
      if (!po) throw new NotFoundException('Orden de compra no encontrada');
      if (po.status !== 'APPROVED') throw new BadRequestException(`No se puede recibir en estado ${po.status}`);

      const tenantId = currentTenantId()!;
      const count = await tx.goodsReceipt.count({ where: { tenantId } });
      const number = `GR-${(count + 1).toString().padStart(6, '0')}`;

      await tx.goodsReceipt.create({
        data: { tenantId, number, purchaseOrderId: orderId, receivedByUserId: currentUserId()! },
      });
      await tx.purchaseOrder.update({ where: { id: orderId }, data: { status: 'RECEIVED' } });

      const dueDate = new Date(Date.now() + PAYMENT_TERM_DAYS * 86_400_000);
      await this.outbox.emit(tx, {
        eventType: EventTypes.GoodsReceived,
        aggregateType: 'GoodsReceipt',
        aggregateId: orderId,
        payload: {
          purchaseOrderId: orderId,
          supplierId: po.supplierId,
          warehouseId: po.warehouseId,
          total: po.total.toString(),
          dueDate: dueDate.toISOString(),
          lines: po.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity.toString(),
            unitCost: l.unitCost.toString(),
          })),
        },
      });

      return { id: orderId, status: 'RECEIVED', receipt: number };
    });
  }
}
