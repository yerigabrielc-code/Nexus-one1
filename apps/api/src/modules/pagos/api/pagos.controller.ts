import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { RegisterDisbursementUseCase } from '../application/register-disbursement.usecase';
import { GetCashflowUseCase } from '../application/get-cashflow.usecase';
import { PagosQueries } from '../application/pagos.queries';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PagosController {
  constructor(
    private readonly disbursement: RegisterDisbursementUseCase,
    private readonly cashflow: GetCashflowUseCase,
    private readonly queries: PagosQueries,
  ) {}

  @Get('payables')
  @RequirePermissions('payable:read')
  listPayables() {
    return this.queries.listPayables();
  }

  @Post('disbursements')
  @RequirePermissions('payable:pay')
  pay(@Body() body: any) {
    return this.disbursement.execute(body);
  }

  @Get('reports/cashflow')
  @RequirePermissions('payable:read')
  getCashflow() {
    return this.cashflow.execute();
  }
}
