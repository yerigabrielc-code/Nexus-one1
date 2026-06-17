import type { Tx } from '../../../shared/prisma/tenant-runner';
import type { SalesOrder } from './sales-order.entity';

export interface SalesOrderRepositoryPort {
  nextNumber(tx: Tx): Promise<string>;
  save(tx: Tx, order: SalesOrder, number: string): Promise<void>;
  setStatus(tx: Tx, orderId: string, status: 'CONFIRMED' | 'RESERVED' | 'INVOICED' | 'CANCELLED'): Promise<void>;
  findForInvoicing(
    tx: Tx,
    orderId: string,
  ): Promise<{
    id: string;
    status: string;
    customerId: string;
    subtotal: string;
    taxTotal: string;
    total: string;
    currency: string;
  } | null>;
}

export interface InvoiceData {
  id: string;
  number: string;
  salesOrderId: string;
  customerId: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  currency: string;
  dueDate: Date;
  ncfType: string;
  ncf: string;
  fiscalStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  fiscalTrackId: string;
  fiscalSecurityCode: string;
}

export interface InvoiceRepositoryPort {
  nextNumber(tx: Tx): Promise<string>;
  save(tx: Tx, data: InvoiceData): Promise<void>;
}

export const SALES_ORDER_REPOSITORY = Symbol('SALES_ORDER_REPOSITORY');
export const INVOICE_REPOSITORY = Symbol('INVOICE_REPOSITORY');
