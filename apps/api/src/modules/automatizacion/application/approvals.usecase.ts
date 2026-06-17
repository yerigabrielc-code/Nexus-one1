import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { currentTenantId, currentUserId } from '../../../shared/tenant/tenant-context';

/** Solicita una aprobación (flujo de aprobación genérico por entidad). */
@Injectable()
export class CreateApprovalUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: { entityType: string; entityId: string; note?: string }) {
    return withTenant(this.prisma, async (tx) => {
      const a = await tx.approval.create({
        data: {
          tenantId: currentTenantId()!,
          entityType: input.entityType,
          entityId: input.entityId,
          status: 'PENDING',
          requestedByUserId: currentUserId()!,
          note: input.note ?? null,
        },
      });
      return { id: a.id, status: a.status };
    });
  }
}

/** Decide (aprueba/rechaza) una aprobación pendiente. */
@Injectable()
export class DecideApprovalUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: { approvalId: string; decision: 'APPROVED' | 'REJECTED'; note?: string }) {
    return withTenant(this.prisma, async (tx) => {
      const a = await tx.approval.findFirst({ where: { id: input.approvalId }, select: { id: true } });
      if (!a) throw new NotFoundException('Aprobación no encontrada');
      await tx.approval.update({
        where: { id: input.approvalId },
        data: { status: input.decision, decidedByUserId: currentUserId()!, note: input.note ?? undefined },
      });
      return { id: input.approvalId, status: input.decision };
    });
  }
}
