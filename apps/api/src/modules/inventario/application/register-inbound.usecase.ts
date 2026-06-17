import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { applyInbound } from '../domain/costing';
import { STOCK_REPOSITORY, type StockRepositoryPort } from '../domain/inventory.ports';

export interface InboundInput {
  productId: string;
  warehouseId: string;
  quantity: string;
  unitCost: string;
  refType?: string;
  refId?: string;
}

/** Entrada de inventario (compra/recepción/ajuste +) con recosteo promedio. */
@Injectable()
export class RegisterInboundUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(STOCK_REPOSITORY) private readonly stock: StockRepositoryPort,
  ) {}

  execute(input: InboundInput) {
    return withTenant(this.prisma, async (tx) => {
      const snap = await this.stock.getStock(tx, input.productId, input.warehouseId);
      const { onHand, avgCost } = applyInbound(snap, input.quantity, input.unitCost);

      await this.stock.upsertStock(tx, input.productId, input.warehouseId, {
        onHand,
        reserved: snap.reserved,
        avgCost,
      });
      await this.stock.appendMovement(tx, {
        productId: input.productId,
        warehouseId: input.warehouseId,
        type: 'IN',
        quantity: new Prisma.Decimal(input.quantity),
        unitCost: new Prisma.Decimal(input.unitCost),
        balanceAfter: onHand,
        refType: input.refType,
        refId: input.refId,
      });

      await this.outbox.emit(tx, {
        eventType: 'inventario.stock.movement_registered',
        aggregateType: 'StockItem',
        aggregateId: input.productId,
        payload: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          type: 'IN',
          onHand: onHand.toString(),
          avgCost: avgCost.toString(),
        },
      });

      return { onHand: onHand.toString(), avgCost: avgCost.toString() };
    });
  }
}
