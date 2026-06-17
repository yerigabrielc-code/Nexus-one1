import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';

@Injectable()
export class ListCustomersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  // La RLS garantiza que solo se devuelven clientes del tenant en contexto.
  execute() {
    return withTenant(this.prisma, (tx) =>
      tx.customer.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, legalName: true, type: true, createdAt: true },
        take: 100,
      }),
    );
  }
}
