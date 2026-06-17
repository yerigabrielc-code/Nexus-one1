import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

@Injectable()
export class ApprovePurchaseOrderUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(orderId: string) {
    return withTenant(this.prisma, async (tx) => {
      const po = await tx.purchaseOrder.findFirst({ where: { id: orderId }, select: { status: true } });
      if (!po) throw new NotFoundException('Orden de compra no encontrada');
      if (po.status !== 'DRAFT') throw new BadRequestException(`No se puede aprobar en estado ${po.status}`);
      await tx.purchaseOrder.update({ where: { id: orderId }, data: { status: 'APPROVED' } });
      return { id: orderId, status: 'APPROVED' };
    });
  }
}
