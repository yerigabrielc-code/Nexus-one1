import { Module } from '@nestjs/common';
import { PagosController } from './api/pagos.controller';
import { CreatePayableFromReceiptUseCase } from './application/create-payable-from-receipt.usecase';
import { RegisterDisbursementUseCase } from './application/register-disbursement.usecase';
import { GetCashflowUseCase } from './application/get-cashflow.usecase';
import { PagosQueries } from './application/pagos.queries';

@Module({
  controllers: [PagosController],
  providers: [CreatePayableFromReceiptUseCase, RegisterDisbursementUseCase, GetCashflowUseCase, PagosQueries],
  exports: [CreatePayableFromReceiptUseCase],
})
export class PagosModule {}
