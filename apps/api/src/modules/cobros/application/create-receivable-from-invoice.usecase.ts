import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { RECEIVABLE_REPOSITORY, type ReceivableRepositoryPort } from '../domain/cobros.ports';

/**
 * Handler de 'ventas.invoice.issued'. Crea la Cuenta por Cobrar.
 * Se invoca desde el consumidor de eventos (worker) o en proceso. Idempotente
 * por la unicidad de receivable.invoiceId.
 */
@Injectable()
export class CreateReceivableFromInvoiceUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(RECEIVABLE_REPOSITORY) private readonly repo: ReceivableRepositoryPort,
  ) {}

  execute(
    payload: { invoiceId: string; customerId: string; total: string; dueDate: string },
    tenantId: string,
  ) {
    return withTenant(
      this.prisma,
      (tx) =>
        this.repo.createFromInvoice(tx, {
          invoiceId: payload.invoiceId,
          customerId: payload.customerId,
          amount: payload.total,
          dueDate: new Date(payload.dueDate),
        }),
      tenantId,
    );
  }
}
