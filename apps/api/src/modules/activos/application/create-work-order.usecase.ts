import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';

export interface CreateWorkOrderInput {
  assetId: string;
  type: 'PREVENTIVE' | 'CORRECTIVE';
  description?: string;
  scheduledAt?: string;
  assignedToUserId?: string;
  checklist?: string[];
}

@Injectable()
export class CreateWorkOrderUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: CreateWorkOrderInput) {
    return withTenant(this.prisma, async (tx) => {
      const tenantId = currentTenantId()!;
      const asset = await tx.asset.findFirst({ where: { id: input.assetId }, select: { id: true } });
      if (!asset) throw new NotFoundException('Activo no encontrado');
      if (!['PREVENTIVE', 'CORRECTIVE'].includes(input.type)) throw new BadRequestException('Tipo inválido');

      const count = await tx.workOrder.count({ where: { tenantId } });
      const number = `WO-${(count + 1).toString().padStart(6, '0')}`;

      const wo = await tx.workOrder.create({
        data: {
          tenantId,
          number,
          assetId: input.assetId,
          type: input.type,
          status: 'OPEN',
          description: input.description ?? null,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          assignedToUserId: input.assignedToUserId ?? null,
          checklist: {
            create: (input.checklist ?? []).map((d) => ({ tenantId, description: d })),
          },
        },
      });
      // El activo pasa a mantenimiento.
      await tx.asset.update({ where: { id: input.assetId }, data: { status: 'IN_MAINTENANCE' } });
      return { id: wo.id, number };
    });
  }
}
