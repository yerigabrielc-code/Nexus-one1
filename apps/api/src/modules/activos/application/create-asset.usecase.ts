import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';

@Injectable()
export class CreateAssetUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: { code: string; name: string; category?: string; location?: string }) {
    return withTenant(this.prisma, async (tx) => {
      const exists = await tx.asset.findFirst({ where: { code: input.code }, select: { id: true } });
      if (exists) throw new ConflictException(`Ya existe un activo con código ${input.code}`);
      const a = await tx.asset.create({
        data: {
          tenantId: currentTenantId()!,
          code: input.code,
          name: input.name,
          category: input.category ?? null,
          location: input.location ?? null,
        },
      });
      return { id: a.id, code: a.code };
    });
  }
}
