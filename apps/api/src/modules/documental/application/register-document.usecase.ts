import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { currentTenantId, currentUserId } from '../../../shared/tenant/tenant-context';

export interface RegisterDocumentInput {
  name: string;
  mimeType: string;
  sizeBytes?: number;
  storageKey: string;
  entityType?: string;
  entityId?: string;
  groupId?: string; // si se envía, crea una NUEVA VERSIÓN del documento existente
}

/**
 * Registra metadatos de un documento (el archivo ya está en S3-compatible).
 * Si llega groupId, incrementa la versión; si no, inicia un grupo nuevo en v1.
 */
@Injectable()
export class RegisterDocumentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: RegisterDocumentInput) {
    return withTenant(this.prisma, async (tx) => {
      const tenantId = currentTenantId()!;
      let groupId = input.groupId ?? randomUUID();
      let version = 1;
      if (input.groupId) {
        const last = await tx.document.findFirst({
          where: { groupId: input.groupId },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        version = (last?.version ?? 0) + 1;
      }

      const doc = await tx.document.create({
        data: {
          tenantId,
          groupId,
          name: input.name,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes ?? 0,
          storageKey: input.storageKey,
          version,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          uploadedByUserId: currentUserId()!,
        },
      });
      return { id: doc.id, groupId, version };
    });
  }
}
