import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { CreateRuleUseCase } from '../application/create-rule.usecase';
import { ListAlertsUseCase } from '../application/list-alerts.usecase';
import { CreateApprovalUseCase, DecideApprovalUseCase } from '../application/approvals.usecase';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AutomatizacionController {
  constructor(
    private readonly createRule: CreateRuleUseCase,
    private readonly listAlerts: ListAlertsUseCase,
    private readonly createApproval: CreateApprovalUseCase,
    private readonly decideApproval: DecideApprovalUseCase,
  ) {}

  @Post('automation/rules')
  @RequirePermissions('automation:manage')
  rule(@Body() body: any) {
    return this.createRule.execute(body);
  }

  @Get('alerts')
  @RequirePermissions('alert:read')
  alerts() {
    return this.listAlerts.execute();
  }

  @Post('approvals')
  @RequirePermissions('approval:request')
  approval(@Body() body: any) {
    return this.createApproval.execute(body);
  }

  @Post('approvals/:id/decide')
  @RequirePermissions('approval:decide')
  decide(@Param('id') id: string, @Body() body: { decision: 'APPROVED' | 'REJECTED'; note?: string }) {
    return this.decideApproval.execute({ approvalId: id, ...body });
  }
}
