import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { GetExecutiveDashboardUseCase } from '../application/get-executive-dashboard.usecase';
import { GetSalesSummaryUseCase } from '../application/get-sales-summary.usecase';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnaliticaController {
  constructor(
    private readonly executive: GetExecutiveDashboardUseCase,
    private readonly sales: GetSalesSummaryUseCase,
  ) {}

  @Get('executive')
  @RequirePermissions('analytics:read')
  getExecutive() {
    return this.executive.execute();
  }

  @Get('sales')
  @RequirePermissions('analytics:read')
  getSales() {
    return this.sales.execute();
  }
}
