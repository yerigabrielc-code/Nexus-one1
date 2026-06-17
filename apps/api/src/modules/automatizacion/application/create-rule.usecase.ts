import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';

@Injectable()
export class CreateRuleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(input: { name: string; eventType: string; condition?: unknown; action: unknown }) {
    return withTenant(this.prisma, async (tx) => {
      const r = await tx.automationRule.create({
        data: {
          tenantId: currentTenantId()!,
          name: input.name,
          eventType: input.eventType,
          condition: (input.condition as any) ?? undefined,
          action: input.action as any,
        },
      });
      return { id: r.id };
    });
  }
}
