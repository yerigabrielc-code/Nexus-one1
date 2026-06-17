import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { buildAging } from '../../cobros/domain/aging';

/**
 * Estado de cuenta consolidado de un cliente: facturas + cuentas por cobrar + aging.
 * Base reutilizable por el portal externo (cuando se exponga con auth de cliente).
 */
@Injectable()
export class GetCustomerStatementUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(customerId: string) {
    return withTenant(this.prisma, async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: customerId },
        select: { id: true, legalName: true, code: true },
      });
      if (!customer) throw new NotFoundException('Cliente no encontrado');

      const [invoices, receivables] = await Promise.all([
        tx.invoice.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          select: { number: true, ncf: true, total: true, status: true, issueDate: true, dueDate: true },
          take: 100,
        }),
        tx.receivable.findMany({
          where: { customerId, status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] } },
          select: { dueDate: true, balance: true },
        }),
      ]);

      return {
        customer,
        aging: buildAging(receivables),
        invoices: invoices.map((i) => ({ ...i, total: i.total.toString() })),
      };
    });
  }
}
