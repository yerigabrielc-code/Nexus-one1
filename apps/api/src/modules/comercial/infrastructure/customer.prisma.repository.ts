import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';
import type { Customer } from '../domain/customer.entity';
import type { CustomerRepositoryPort } from '../domain/customer.repository.port';

@Injectable()
export class CustomerPrismaRepository implements CustomerRepositoryPort {
  async existsByCode(tx: Tx, code: string): Promise<boolean> {
    const found = await tx.customer.findFirst({
      where: { code, deletedAt: null },
      select: { id: true },
    });
    return found !== null;
  }

  async save(tx: Tx, customer: Customer): Promise<void> {
    const tenantId = currentTenantId()!;
    const p = customer.props;
    await tx.customer.create({
      data: {
        id: p.id,
        tenantId,
        code: p.code,
        legalName: p.legalName,
        tradeName: p.tradeName ?? null,
        taxIdType: p.taxIdType,
        taxId: p.taxId ?? null,
        type: p.type,
        email: p.email ?? null,
        phone: p.phone ?? null,
      },
    });
  }
}
