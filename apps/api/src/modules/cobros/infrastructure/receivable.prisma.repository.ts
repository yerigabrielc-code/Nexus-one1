import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Tx } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';
import type { ReceivableRecord, ReceivableRepositoryPort } from '../domain/cobros.ports';

@Injectable()
export class ReceivablePrismaRepository implements ReceivableRepositoryPort {
  async createFromInvoice(
    tx: Tx,
    data: { invoiceId: string; customerId: string; amount: string; dueDate: Date },
  ): Promise<void> {
    const tenantId = currentTenantId()!;
    const amount = new Prisma.Decimal(data.amount);
    // Idempotente: si ya existe la CxC de esa factura, no duplica.
    const exists = await tx.receivable.findUnique({ where: { invoiceId: data.invoiceId } });
    if (exists) return;
    await tx.receivable.create({
      data: {
        tenantId,
        invoiceId: data.invoiceId,
        customerId: data.customerId,
        amount,
        paidAmount: new Prisma.Decimal(0),
        balance: amount,
        dueDate: data.dueDate,
        status: 'OPEN',
      },
    });
  }

  async getById(tx: Tx, id: string): Promise<ReceivableRecord | null> {
    const r = await tx.receivable.findFirst({
      where: { id },
      select: { id: true, customerId: true, amount: true, paidAmount: true, balance: true, status: true },
    });
    return r ?? null;
  }

  async applyPayment(
    tx: Tx,
    id: string,
    data: { paidAmount: Prisma.Decimal; balance: Prisma.Decimal; status: string },
  ): Promise<void> {
    await tx.receivable.update({
      where: { id },
      data: { paidAmount: data.paidAmount, balance: data.balance, status: data.status as any },
    });
  }
}
