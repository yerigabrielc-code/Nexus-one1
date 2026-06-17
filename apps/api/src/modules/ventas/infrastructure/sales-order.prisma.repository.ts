import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';
import type { SalesOrder } from '../domain/sales-order.entity';
import type { SalesOrderRepositoryPort } from '../domain/ventas.ports';

@Injectable()
export class SalesOrderPrismaRepository implements SalesOrderRepositoryPort {
  async nextNumber(tx: Tx): Promise<string> {
    const tenantId = currentTenantId()!;
    const count = await tx.salesOrder.count({ where: { tenantId } });
    return `SO-${(count + 1).toString().padStart(6, '0')}`;
  }

  async save(tx: Tx, order: SalesOrder, number: string): Promise<void> {
    const tenantId = currentTenantId()!;
    await tx.salesOrder.create({
      data: {
        id: order.id,
        tenantId,
        number,
        customerId: order.customerId,
        status: 'DRAFT',
        subtotal: order.subtotal,
        taxTotal: order.taxTotal,
        total: order.total,
        currency: order.currency,
        lines: {
          create: order.lines.map((l) => ({
            id: l.id,
            tenantId,
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            lineTotal: l.lineTotal,
          })),
        },
      },
    });
  }

  async setStatus(
    tx: Tx,
    orderId: string,
    status: 'CONFIRMED' | 'RESERVED' | 'INVOICED' | 'CANCELLED',
  ): Promise<void> {
    await tx.salesOrder.update({ where: { id: orderId }, data: { status } });
  }

  async findForInvoicing(tx: Tx, orderId: string) {
    const o = await tx.salesOrder.findFirst({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customerId: true,
        subtotal: true,
        taxTotal: true,
        total: true,
        currency: true,
      },
    });
    if (!o) return null;
    return {
      id: o.id,
      status: o.status,
      customerId: o.customerId,
      subtotal: o.subtotal.toString(),
      taxTotal: o.taxTotal.toString(),
      total: o.total.toString(),
      currency: o.currency,
    };
  }
}
