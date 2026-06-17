import { Module } from '@nestjs/common';
import { ComercialController } from './api/comercial.controller';
import { CreateCustomerUseCase } from './application/create-customer.usecase';
import { ListCustomersUseCase } from './application/list-customers.usecase';
import { CUSTOMER_REPOSITORY } from './domain/customer.repository.port';
import { CustomerPrismaRepository } from './infrastructure/customer.prisma.repository';

@Module({
  controllers: [ComercialController],
  providers: [
    CreateCustomerUseCase,
    ListCustomersUseCase,
    { provide: CUSTOMER_REPOSITORY, useClass: CustomerPrismaRepository },
  ],
})
export class ComercialModule {}
