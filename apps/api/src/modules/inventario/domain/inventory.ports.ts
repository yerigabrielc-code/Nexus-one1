import type { Prisma } from '@prisma/client';
import type { Tx } from '../../../shared/prisma/tenant-runner';
import type { Product } from './product.entity';

export interface ProductRepositoryPort {
  existsBySku(tx: Tx, sku: string): Promise<boolean>;
  save(tx: Tx, product: Product): Promise<void>;
}

export interface StockSnapshot {
  id: string | null;
  onHand: Prisma.Decimal;
  reserved: Prisma.Decimal;
  avgCost: Prisma.Decimal;
}

export interface StockRepositoryPort {
  /** Saldo agregado por producto+almacén (read model). */
  getStock(tx: Tx, productId: string, warehouseId: string): Promise<StockSnapshot>;
  upsertStock(
    tx: Tx,
    productId: string,
    warehouseId: string,
    data: { onHand: Prisma.Decimal; reserved: Prisma.Decimal; avgCost: Prisma.Decimal },
  ): Promise<void>;
  /** Inserta una línea de kardex (append-only). */
  appendMovement(
    tx: Tx,
    m: {
      productId: string;
      warehouseId: string;
      type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RESERVATION' | 'RELEASE';
      quantity: Prisma.Decimal;
      unitCost: Prisma.Decimal;
      balanceAfter: Prisma.Decimal;
      refType?: string;
      refId?: string;
    },
  ): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
