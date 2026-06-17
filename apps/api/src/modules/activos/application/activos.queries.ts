import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

@Injectable()
export class ActivosQueries {
  constructor(private readonly prisma: PrismaService) {}

  listAssets() {
    return withTenant(this.prisma, (tx) =>
      tx.asset.findMany({
        where: { deletedAt: null },
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true, status: true },
        take: 200,
      }),
    );
  }

  listWorkOrders() {
    return withTenant(this.prisma, (tx) =>
      tx.workOrder.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, number: true, type: true, status: true, assetId: true },
        take: 100,
      }),
    );
  }
}
