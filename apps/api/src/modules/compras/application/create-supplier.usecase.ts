import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';

@Injectable()
export class CreateSupplierUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: { code: string; legalName: string; taxIdType?: string; taxId?: string; email?: string; phone?: string }) {
    return withTenant(this.prisma, async (tx) => {
      const exists = await tx.supplier.findFirst({ where: { code: input.code }, select: { id: true } });
      if (exists) throw new ConflictException(`Ya existe un proveedor con código ${input.code}`);
      const s = await tx.supplier.create({
        data: {
          tenantId: currentTenantId()!,
          code: input.code,
          legalName: input.legalName,
          taxIdType: (input.taxIdType as any) ?? 'NONE',
          taxId: input.taxId ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
        },
      });
      return { id: s.id, code: s.code };
    });
  }
}
