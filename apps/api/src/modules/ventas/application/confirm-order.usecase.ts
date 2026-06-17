import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventTypes } from '@nexus/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { SALES_ORDER_REPOSITORY, type SalesOrderRepositoryPort } from '../domain/ventas.ports';

/**
 * Confirma el pedido y emite ventas.order.confirmed con sus líneas, para que
 * Inventario reserve stock (saga vía eventos, sin acoplar los módulos).
 */
@Injectable()
export class ConfirmOrderUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(SALES_ORDER_REPOSITORY) private readonly repo: SalesOrderRepositoryPort,
  ) {}

  execute(orderId: string) {
    return withTenant(this.prisma, async (tx) => {
      const order = await tx.salesOrder.findFirst({
        where: { id: orderId },
        include: { lines: { select: { productId: true, quantity: true } } },
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');

      await this.repo.setStatus(tx, orderId, 'CONFIRMED');

      await this.outbox.emit(tx, {
        eventType: EventTypes.OrderConfirmed,
        aggregateType: 'SalesOrder',
        aggregateId: orderId,
        payload: {
          orderId,
          customerId: order.customerId,
          lines: order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity.toString() })),
        },
      });

      return { id: orderId, status: 'CONFIRMED' };
    });
  }
}
