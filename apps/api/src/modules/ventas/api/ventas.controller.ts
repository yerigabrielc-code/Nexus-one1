import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { CreateOrderUseCase } from '../application/create-order.usecase';
import { ConfirmOrderUseCase } from '../application/confirm-order.usecase';
import { IssueInvoiceUseCase } from '../application/issue-invoice.usecase';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VentasController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly confirmOrder: ConfirmOrderUseCase,
    private readonly issueInvoice: IssueInvoiceUseCase,
  ) {}

  @Post()
  @RequirePermissions('order:create')
  create(@Body() body: any) {
    return this.createOrder.execute(body);
  }

  @Post(':id/confirm')
  @RequirePermissions('order:create')
  confirm(@Param('id') id: string) {
    return this.confirmOrder.execute(id);
  }

  @Post(':id/invoice')
  @RequirePermissions('invoice:create')
  invoice(@Param('id') id: string) {
    return this.issueInvoice.execute(id);
  }
}
