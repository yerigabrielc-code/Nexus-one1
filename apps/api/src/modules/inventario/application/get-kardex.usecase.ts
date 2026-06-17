import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

/** Kardex: movimientos append-only de un producto (RLS-scoped). */
@Injectable()
export class GetKardexUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(productId: string) {
    return withTenant(this.prisma, (tx) =>
      tx.stockMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'asc' },
        select: {
          createdAt: true,
          type: true,
          quantity: true,
          unitCost: true,
          balanceAfter: true,
          refType: true,
          refId: true,
        },
        take: 500,
      }),
    );
  }
}
