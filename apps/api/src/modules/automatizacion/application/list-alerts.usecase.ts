import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

@Injectable()
export class ListAlertsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute() {
    return withTenant(this.prisma, (tx) =>
      tx.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, type: true, message: true, isRead: true, createdAt: true },
      }),
    );
  }
}
