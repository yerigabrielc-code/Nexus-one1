import { Module } from '@nestjs/common';
import { InventarioController } from './api/inventario.controller';
import { CreateProductUseCase } from './application/create-product.usecase';
import { CreateWarehouseUseCase } from './application/create-warehouse.usecase';
import { RegisterInboundUseCase } from './application/register-inbound.usecase';
import { IssueOutboundUseCase } from './application/issue-outbound.usecase';
import { ReserveStockUseCase } from './application/reserve-stock.usecase';
import { GetKardexUseCase } from './application/get-kardex.usecase';
import { InventoryQueries } from './application/inventory.queries';
import { PRODUCT_REPOSITORY, STOCK_REPOSITORY } from './domain/inventory.ports';
import { ProductPrismaRepository } from './infrastructure/product.prisma.repository';
import { StockPrismaRepository } from './infrastructure/stock.prisma.repository';

@Module({
  controllers: [InventarioController],
  providers: [
    CreateProductUseCase,
    CreateWarehouseUseCase,
    RegisterInboundUseCase,
    IssueOutboundUseCase,
    ReserveStockUseCase,
    GetKardexUseCase,
    InventoryQueries,
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
    { provide: STOCK_REPOSITORY, useClass: StockPrismaRepository },
  ],
  exports: [IssueOutboundUseCase, ReserveStockUseCase, RegisterInboundUseCase],
})
export class InventarioModule {}
