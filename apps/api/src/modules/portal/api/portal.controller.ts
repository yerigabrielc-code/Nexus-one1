import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { GetCustomerStatementUseCase } from '../application/get-customer-statement.usecase';

@Controller('portal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PortalController {
  constructor(private readonly statement: GetCustomerStatementUseCase) {}

  @Get('customers/:id/statement')
  @RequirePermissions('customer:read')
  getStatement(@Param('id') id: string) {
    return this.statement.execute(id);
  }
}
