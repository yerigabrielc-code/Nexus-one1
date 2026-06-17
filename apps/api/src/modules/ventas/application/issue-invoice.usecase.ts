import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EventTypes } from '@nexus/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { FISCAL_PROVIDER, type FiscalProviderPort } from '../../fiscal/domain/fiscal.port';
import {
  INVOICE_REPOSITORY,
  SALES_ORDER_REPOSITORY,
  type InvoiceRepositoryPort,
  type SalesOrderRepositoryPort,
} from '../domain/ventas.ports';

const PAYMENT_TERM_DAYS = 30;

/**
 * Emite la factura de un pedido confirmado:
 *  1) pide el e-NCF al motor fiscal (DGII),
 *  2) persiste la factura con datos fiscales,
 *  3) marca el pedido como INVOICED,
 *  4) emite ventas.invoice.issued (Cobros crea la CxC; Inventario descuenta).
 * Todo en una sola transacción (consistencia + Outbox).
 */
@Injectable()
export class IssueInvoiceUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(SALES_ORDER_REPOSITORY) private readonly orders: SalesOrderRepositoryPort,
    @Inject(INVOICE_REPOSITORY) private readonly invoices: InvoiceRepositoryPort,
    @Inject(FISCAL_PROVIDER) private readonly fiscal: FiscalProviderPort,
  ) {}

  execute(orderId: string) {
    return withTenant(this.prisma, async (tx) => {
      const order = await this.orders.findForInvoicing(tx, orderId);
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (!['CONFIRMED', 'RESERVED'].includes(order.status)) {
        throw new BadRequestException(`El pedido no se puede facturar en estado ${order.status}`);
      }

      const customer = await tx.customer.findFirst({
        where: { id: order.customerId },
        select: { taxId: true, taxIdType: true },
      });

      const lines = await tx.salesOrderLine.findMany({
        where: { salesOrderId: orderId },
        select: { productId: true, quantity: true },
      });

      const fiscalResult = await this.fiscal.issue(tx, {
        invoiceId: orderId,
        customerTaxId: customer?.taxId ?? null,
        customerTaxIdType: (customer?.taxIdType as any) ?? 'NONE',
        subtotal: order.subtotal,
        taxTotal: order.taxTotal,
        total: order.total,
      });

      const invoiceId = randomUUID();
      const number = await this.invoices.nextNumber(tx);
      const dueDate = new Date(Date.now() + PAYMENT_TERM_DAYS * 86_400_000);

      await this.invoices.save(tx, {
        id: invoiceId,
        number,
        salesOrderId: orderId,
        customerId: order.customerId,
        subtotal: order.subtotal,
        taxTotal: order.taxTotal,
        total: order.total,
        currency: order.currency,
        dueDate,
        ...fiscalResult,
      });

      await this.orders.setStatus(tx, orderId, 'INVOICED');

      await this.outbox.emit(tx, {
        eventType: EventTypes.InvoiceIssued,
        aggregateType: 'Invoice',
        aggregateId: invoiceId,
        payload: {
          invoiceId,
          customerId: order.customerId,
          total: order.total,
          dueDate: dueDate.toISOString(),
          ncf: fiscalResult.ncf,
          lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity.toString() })),
        },
      });

      return { invoiceId, number, ncf: fiscalResult.ncf, fiscalStatus: fiscalResult.fiscalStatus };
    });
  }
}
