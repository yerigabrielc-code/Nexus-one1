import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { applyOutbound } from '../domain/costing';
import { STOCK_REPOSITORY, type StockRepositoryPort } from '../domain/inventory.ports';

export interface OutboundInput {
  productId: string;
  warehouseId: string;
  quantity: string;
  refType?: string;
  refId?: string;
  /** Si venía de una reserva previa, libera 'reserved' al salir. */
  fromReservation?: boolean;
}

/** Salida de inventario (facturación/despacho/ajuste -). Descuenta al costo promedio. */
@Injectable()
export class IssueOutboundUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(STOCK_REPOSITORY) private readonly stock: StockRepositoryPort,
  ) {}

  execute(input: OutboundInput) {
    return withTenant(this.prisma, async (tx) => {
      const snap = await this.stock.getStock(tx, input.productId, input.warehouseId);
      const qty = new Prisma.Decimal(input.quantity);
      const { onHand, avgCost, unitCost } = applyOutbound(snap, qty);

      const newReserved = input.fromReservation
        ? Prisma.Decimal.max(snap.reserved.minus(qty), new Prisma.Decimal(0))
        : snap.reserved;

      await this.stock.upsertStock(tx, input.productId, input.warehouseId, {
        onHand,
        reserved: newReserved,
        avgCost,
      });
      await this.stock.appendMovement(tx, {
        productId: input.productId,
        warehouseId: input.warehouseId,
        type: 'OUT',
        quantity: qty,
        unitCost,
        balanceAfter: onHand,
        refType: input.refType,
        refId: input.refId,
      });

      return { onHand: onHand.toString(), cogs: unitCost.times(qty).toString() };
    });
  }
}
