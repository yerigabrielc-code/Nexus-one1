import type { Prisma } from '@prisma/client';
import type { Tx } from '../../../shared/prisma/tenant-runner';

export interface ReceivableRecord {
  id: string;
  customerId: string;
  amount: Prisma.Decimal;
  paidAmount: Prisma.Decimal;
  balance: Prisma.Decimal;
  status: string;
}

export interface ReceivableRepositoryPort {
  createFromInvoice(
    tx: Tx,
    data: { invoiceId: string; customerId: string; amount: string; dueDate: Date },
  ): Promise<void>;
  getById(tx: Tx, id: string): Promise<ReceivableRecord | null>;
  applyPayment(
    tx: Tx,
    id: string,
    data: { paidAmount: Prisma.Decimal; balance: Prisma.Decimal; status: string },
  ): Promise<void>;
}

export const RECEIVABLE_REPOSITORY = Symbol('RECEIVABLE_REPOSITORY');
