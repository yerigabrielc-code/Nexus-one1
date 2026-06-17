import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';

export interface CreateAlertInput {
  type: string;
  message: string;
  entityType?: string;
  entityId?: string;
  targetUserId?: string;
}

/** Crea una alerta/notificación. Lo usan otros módulos y la saga (ej. reserva fallida). */
@Injectable()
export class CreateAlertUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: CreateAlertInput, tenantId?: string) {
    return withTenant(
      this.prisma,
      (tx) =>
        tx.alert.create({
          data: {
            tenantId: tenantId ?? currentTenantId()!,
            type: input.type,
            message: input.message,
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            targetUserId: input.targetUserId ?? null,
          },
        }),
      tenantId,
    );
  }
}
