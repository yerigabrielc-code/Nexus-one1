import { Module } from '@nestjs/common';
import { CobrosController } from './api/cobros.controller';
import { CreateReceivableFromInvoiceUseCase } from './application/create-receivable-from-invoice.usecase';
import { RegisterPaymentUseCase } from './application/register-payment.usecase';
import { CreatePromiseUseCase } from './application/create-promise.usecase';
import { GetAgingUseCase } from './application/get-aging.usecase';
import { RECEIVABLE_REPOSITORY } from './domain/cobros.ports';
import { ReceivablePrismaRepository } from './infrastructure/receivable.prisma.repository';

@Module({
  controllers: [CobrosController],
  providers: [
    CreateReceivableFromInvoiceUseCase,
    RegisterPaymentUseCase,
    CreatePromiseUseCase,
    GetAgingUseCase,
    { provide: RECEIVABLE_REPOSITORY, useClass: ReceivablePrismaRepository },
  ],
  exports: [CreateReceivableFromInvoiceUseCase],
})
export class CobrosModule {}
