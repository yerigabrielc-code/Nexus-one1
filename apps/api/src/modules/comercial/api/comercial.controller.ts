import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateCustomerSchema, type CreateCustomerDto } from '@nexus/contracts';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { ZodValidationPipe } from '../../../shared/validation/zod.pipe';
import { CreateCustomerUseCase } from '../application/create-customer.usecase';
import { ListCustomersUseCase } from '../application/list-customers.usecase';

@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComercialController {
  constructor(
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly listCustomers: ListCustomersUseCase,
  ) {}

  @Post()
  @RequirePermissions('customer:create')
  create(@Body(new ZodValidationPipe(CreateCustomerSchema)) dto: CreateCustomerDto) {
    return this.createCustomer.execute(dto);
  }

  @Get()
  @RequirePermissions('customer:read')
  list() {
    return this.listCustomers.execute();
  }
}
