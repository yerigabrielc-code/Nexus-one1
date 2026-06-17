import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { SalesOrder, type OrderLineInput } from '../domain/sales-order.entity';
import { SALES_ORDER_REPOSITORY, type SalesOrderRepositoryPort } from '../domain/ventas.ports';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SALES_ORDER_REPOSITORY) private readonly repo: SalesOrderRepositoryPort,
  ) {}

  execute(input: { customerId: string; lines: OrderLineInput[]; currency?: string }) {
    return withTenant(this.prisma, async (tx) => {
      const order = SalesOrder.create(input);
      const number = await this.repo.nextNumber(tx);
      await this.repo.save(tx, order, number);
      return { id: order.id, number, total: order.total.toString() };
    });
  }
}
