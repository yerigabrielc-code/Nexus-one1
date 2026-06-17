import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

/**
 * Handler de 'compras.goods.received'. Crea la Cuenta por Pagar al proveedor.
 * Idempotente por purchaseOrderId.
 */
@Injectable()
export class CreatePayableFromReceiptUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(
    payload: { purchaseOrderId: string; supplierId: string; total: string; dueDate: string },
    tenantId: string,
  ) {
    return withTenant(
      this.prisma,
      async (tx) => {
        const exists = await tx.payable.findFirst({
          where: { purchaseOrderId: payload.purchaseOrderId },
          select: { id: true },
        });
        if (exists) return;
        const amount = new Prisma.Decimal(payload.total);
        await tx.payable.create({
          data: {
            tenantId,
            supplierId: payload.supplierId,
            purchaseOrderId: payload.purchaseOrderId,
            amount,
            paidAmount: new Prisma.Decimal(0),
            balance: amount,
            dueDate: new Date(payload.dueDate),
            status: 'OPEN',
          },
        });
      },
      tenantId,
    );
  }
}
