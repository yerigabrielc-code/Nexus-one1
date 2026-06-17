import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { CreateProductUseCase } from '../application/create-product.usecase';
import { CreateWarehouseUseCase } from '../application/create-warehouse.usecase';
import { RegisterInboundUseCase } from '../application/register-inbound.usecase';
import { IssueOutboundUseCase } from '../application/issue-outbound.usecase';
import { ReserveStockUseCase } from '../application/reserve-stock.usecase';
import { GetKardexUseCase } from '../application/get-kardex.usecase';
import { InventoryQueries } from '../application/inventory.queries';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventarioController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly createWarehouse: CreateWarehouseUseCase,
    private readonly inbound: RegisterInboundUseCase,
    private readonly outbound: IssueOutboundUseCase,
    private readonly reserve: ReserveStockUseCase,
    private readonly kardex: GetKardexUseCase,
    private readonly queries: InventoryQueries,
  ) {}

  @Get('products')
  @RequirePermissions('product:read')
  listProducts() {
    return this.queries.listProducts();
  }

  @Get('warehouses')
  @RequirePermissions('product:read')
  listWarehouses() {
    return this.queries.listWarehouses();
  }

  @Post('products')
  @RequirePermissions('product:create')
  product(@Body() body: any) {
    return this.createProduct.execute(body);
  }

  @Post('warehouses')
  @RequirePermissions('product:create')
  warehouse(@Body() body: { code: string; name: string }) {
    return this.createWarehouse.execute(body);
  }

  @Post('stock/inbound')
  @RequirePermissions('stock:move')
  registerInbound(@Body() body: any) {
    return this.inbound.execute(body);
  }

  @Post('stock/outbound')
  @RequirePermissions('stock:move')
  issueOutbound(@Body() body: any) {
    return this.outbound.execute(body);
  }

  @Post('stock/reserve')
  @RequirePermissions('stock:move')
  reserveStock(@Body() body: any) {
    return this.reserve.execute(body);
  }

  @Get('products/:id/kardex')
  @RequirePermissions('product:read')
  getKardex(@Param('id') id: string) {
    return this.kardex.execute(id);
  }
}
