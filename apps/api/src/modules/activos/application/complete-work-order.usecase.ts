import { Injectable, NotFoundException } from '@nestjs/common';
import { EventTypes } from '@nexus/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';

@Injectable()
export class CompleteWorkOrderUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  execute(workOrderId: string) {
    return withTenant(this.prisma, async (tx) => {
      const wo = await tx.workOrder.findFirst({ where: { id: workOrderId }, select: { id: true, assetId: true } });
      if (!wo) throw new NotFoundException('Orden de trabajo no encontrada');

      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: 'DONE', completedAt: new Date() },
      });
      await tx.asset.update({ where: { id: wo.assetId }, data: { status: 'ACTIVE' } });

      await this.outbox.emit(tx, {
        eventType: EventTypes.WorkOrderCompleted,
        aggregateType: 'WorkOrder',
        aggregateId: workOrderId,
        payload: { workOrderId, assetId: wo.assetId },
      });

      return { id: workOrderId, status: 'DONE' };
    });
  }
}
