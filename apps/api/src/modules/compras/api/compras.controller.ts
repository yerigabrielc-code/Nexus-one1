import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { CreateSupplierUseCase } from '../application/create-supplier.usecase';
import { CreatePurchaseOrderUseCase } from '../application/create-purchase-order.usecase';
import { ApprovePurchaseOrderUseCase } from '../application/approve-purchase-order.usecase';
import { ReceivePurchaseOrderUseCase } from '../application/receive-purchase-order.usecase';
import { ComprasQueries } from '../application/compras.queries';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComprasController {
  constructor(
    private readonly createSupplier: CreateSupplierUseCase,
    private readonly createPO: CreatePurchaseOrderUseCase,
    private readonly approvePO: ApprovePurchaseOrderUseCase,
    private readonly receivePO: ReceivePurchaseOrderUseCase,
    private readonly queries: ComprasQueries,
  ) {}

  @Get('suppliers')
  @RequirePermissions('purchase:create')
  listSuppliers() {
    return this.queries.listSuppliers();
  }

  @Get('purchase-orders')
  @RequirePermissions('purchase:create')
  listPurchaseOrders() {
    return this.queries.listPurchaseOrders();
  }

  @Post('suppliers')
  @RequirePermissions('purchase:create')
  supplier(@Body() body: any) {
    return this.createSupplier.execute(body);
  }

  @Post('purchase-orders')
  @RequirePermissions('purchase:create')
  create(@Body() body: any) {
    return this.createPO.execute(body);
  }

  @Post('purchase-orders/:id/approve')
  @RequirePermissions('purchase:approve')
  approve(@Param('id') id: string) {
    return this.approvePO.execute(id);
  }

  @Post('purchase-orders/:id/receive')
  @RequirePermissions('purchase:create')
  receive(@Param('id') id: string) {
    return this.receivePO.execute(id);
  }
}
