import { Module } from '@nestjs/common';
import { ComprasController } from './api/compras.controller';
import { CreateSupplierUseCase } from './application/create-supplier.usecase';
import { CreatePurchaseOrderUseCase } from './application/create-purchase-order.usecase';
import { ApprovePurchaseOrderUseCase } from './application/approve-purchase-order.usecase';
import { ReceivePurchaseOrderUseCase } from './application/receive-purchase-order.usecase';
import { ComprasQueries } from './application/compras.queries';

@Module({
  controllers: [ComprasController],
  providers: [
    CreateSupplierUseCase,
    CreatePurchaseOrderUseCase,
    ApprovePurchaseOrderUseCase,
    ReceivePurchaseOrderUseCase,
    ComprasQueries,
  ],
})
export class ComprasModule {}
