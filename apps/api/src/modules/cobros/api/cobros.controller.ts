import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { RegisterPaymentUseCase } from '../application/register-payment.usecase';
import { CreatePromiseUseCase } from '../application/create-promise.usecase';
import { GetAgingUseCase } from '../application/get-aging.usecase';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CobrosController {
  constructor(
    private readonly registerPayment: RegisterPaymentUseCase,
    private readonly createPromise: CreatePromiseUseCase,
    private readonly getAging: GetAgingUseCase,
  ) {}

  @Post('payments')
  @RequirePermissions('payment:register')
  payment(@Body() body: any) {
    return this.registerPayment.execute(body);
  }

  @Post('promises')
  @RequirePermissions('payment:register')
  promise(@Body() body: any) {
    return this.createPromise.execute(body);
  }

  @Get('reports/aging')
  @RequirePermissions('receivable:read')
  aging() {
    return this.getAging.execute();
  }
}
