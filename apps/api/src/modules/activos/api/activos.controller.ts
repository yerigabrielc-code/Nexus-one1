import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { CreateAssetUseCase } from '../application/create-asset.usecase';
import { CreateWorkOrderUseCase } from '../application/create-work-order.usecase';
import { CompleteWorkOrderUseCase } from '../application/complete-work-order.usecase';
import { ActivosQueries } from '../application/activos.queries';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ActivosController {
  constructor(
    private readonly createAsset: CreateAssetUseCase,
    private readonly createWO: CreateWorkOrderUseCase,
    private readonly completeWO: CompleteWorkOrderUseCase,
    private readonly queries: ActivosQueries,
  ) {}

  @Get('assets')
  @RequirePermissions('asset:manage')
  listAssets() {
    return this.queries.listAssets();
  }

  @Get('work-orders')
  @RequirePermissions('asset:manage')
  listWorkOrders() {
    return this.queries.listWorkOrders();
  }

  @Post('assets')
  @RequirePermissions('asset:manage')
  asset(@Body() body: any) {
    return this.createAsset.execute(body);
  }

  @Post('work-orders')
  @RequirePermissions('asset:manage')
  workOrder(@Body() body: any) {
    return this.createWO.execute(body);
  }

  @Post('work-orders/:id/complete')
  @RequirePermissions('asset:manage')
  complete(@Param('id') id: string) {
    return this.completeWO.execute(id);
  }
}
