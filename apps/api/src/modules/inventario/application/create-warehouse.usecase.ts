import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';

@Injectable()
export class CreateWarehouseUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: { code: string; name: string }) {
    return withTenant(this.prisma, async (tx) => {
      const exists = await tx.warehouse.findFirst({ where: { code: input.code }, select: { id: true } });
      if (exists) throw new ConflictException(`Ya existe un almacén con código ${input.code}`);
      const wh = await tx.warehouse.create({
        data: { tenantId: currentTenantId()!, code: input.code, name: input.name },
      });
      return { id: wh.id, code: wh.code };
    });
  }
}
