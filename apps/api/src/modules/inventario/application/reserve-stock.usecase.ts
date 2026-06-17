import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventTypes } from '@nexus/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { STOCK_REPOSITORY, type StockRepositoryPort } from '../domain/inventory.ports';

export interface ReserveInput {
  productId: string;
  warehouseId: string;
  quantity: string;
  orderId: string;
}

/**
 * Reserva stock para un pedido (reacción a ventas.order.confirmed).
 * Emite stock.reserved o stock.reservation_failed. No descuenta onHand;
 * solo incrementa 'reserved'. El descuento real ocurre al facturar (salida).
 */
@Injectable()
export class ReserveStockUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(STOCK_REPOSITORY) private readonly stock: StockRepositoryPort,
  ) {}

  execute(input: ReserveInput) {
    return withTenant(this.prisma, async (tx) => {
      const snap = await this.stock.getStock(tx, input.productId, input.warehouseId);
      const qty = new Prisma.Decimal(input.quantity);
      const available = snap.onHand.minus(snap.reserved);

      if (available.lt(qty)) {
        await this.outbox.emit(tx, {
          eventType: EventTypes.StockReservationFailed,
          aggregateType: 'SalesOrder',
          aggregateId: input.orderId,
          payload: {
            orderId: input.orderId,
            productId: input.productId,
            requested: qty.toString(),
            available: available.toString(),
          },
        });
        return { reserved: false, available: available.toString() };
      }

      const newReserved = snap.reserved.plus(qty);
      await this.stock.upsertStock(tx, input.productId, input.warehouseId, {
        onHand: snap.onHand,
        reserved: newReserved,
        avgCost: snap.avgCost,
      });
      await this.stock.appendMovement(tx, {
        productId: input.productId,
        warehouseId: input.warehouseId,
        type: 'RESERVATION',
        quantity: qty,
        unitCost: snap.avgCost,
        balanceAfter: snap.onHand,
        refType: 'SalesOrder',
        refId: input.orderId,
      });
      await this.outbox.emit(tx, {
        eventType: EventTypes.StockReserved,
        aggregateType: 'SalesOrder',
        aggregateId: input.orderId,
        payload: { orderId: input.orderId, productId: input.productId, quantity: qty.toString() },
      });

      return { reserved: true };
    });
  }
}
