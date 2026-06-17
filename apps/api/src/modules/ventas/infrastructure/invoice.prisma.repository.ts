import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';
import type { InvoiceData, InvoiceRepositoryPort } from '../domain/ventas.ports';

@Injectable()
export class InvoicePrismaRepository implements InvoiceRepositoryPort {
  async nextNumber(tx: Tx): Promise<string> {
    const tenantId = currentTenantId()!;
    const count = await tx.invoice.count({ where: { tenantId } });
    return `INV-${(count + 1).toString().padStart(6, '0')}`;
  }

  async save(tx: Tx, d: InvoiceData): Promise<void> {
    const tenantId = currentTenantId()!;
    await tx.invoice.create({
      data: {
        id: d.id,
        tenantId,
        number: d.number,
        salesOrderId: d.salesOrderId,
        customerId: d.customerId,
        status: 'ISSUED',
        issueDate: new Date(),
        dueDate: d.dueDate,
        subtotal: d.subtotal,
        taxTotal: d.taxTotal,
        total: d.total,
        currency: d.currency,
        ncfType: d.ncfType,
        ncf: d.ncf,
        fiscalStatus: d.fiscalStatus,
        fiscalTrackId: d.fiscalTrackId,
        fiscalSecurityCode: d.fiscalSecurityCode,
      },
    });
  }
}
