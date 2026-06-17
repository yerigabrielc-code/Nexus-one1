import { Module } from '@nestjs/common';
import { VentasController } from './api/ventas.controller';
import { CreateOrderUseCase } from './application/create-order.usecase';
import { ConfirmOrderUseCase } from './application/confirm-order.usecase';
import { IssueInvoiceUseCase } from './application/issue-invoice.usecase';
import { SALES_ORDER_REPOSITORY, INVOICE_REPOSITORY } from './domain/ventas.ports';
import { SalesOrderPrismaRepository } from './infrastructure/sales-order.prisma.repository';
import { InvoicePrismaRepository } from './infrastructure/invoice.prisma.repository';

@Module({
  controllers: [VentasController],
  providers: [
    CreateOrderUseCase,
    ConfirmOrderUseCase,
    IssueInvoiceUseCase,
    { provide: SALES_ORDER_REPOSITORY, useClass: SalesOrderPrismaRepository },
    { provide: INVOICE_REPOSITORY, useClass: InvoicePrismaRepository },
  ],
})
export class VentasModule {}
