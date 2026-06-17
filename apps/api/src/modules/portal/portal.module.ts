import { Module } from '@nestjs/common';
import { PortalController } from './api/portal.controller';
import { GetCustomerStatementUseCase } from './application/get-customer-statement.usecase';

@Module({
  controllers: [PortalController],
  providers: [GetCustomerStatementUseCase],
})
export class PortalModule {}
