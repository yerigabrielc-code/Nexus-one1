import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

@Injectable()
export class ListDocumentsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(filter: { entityType?: string; entityId?: string }) {
    return withTenant(this.prisma, (tx) =>
      tx.document.findMany({
        where: {
          deletedAt: null,
          ...(filter.entityType ? { entityType: filter.entityType } : {}),
          ...(filter.entityId ? { entityId: filter.entityId } : {}),
        },
        orderBy: [{ groupId: 'asc' }, { version: 'desc' }],
        select: { id: true, name: true, mimeType: true, version: true, groupId: true, createdAt: true },
        take: 200,
      }),
    );
  }
}
