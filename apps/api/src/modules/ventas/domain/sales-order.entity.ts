import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

export interface OrderLineInput {
  productId: string;
  quantity: Prisma.Decimal.Value;
  unitPrice: Prisma.Decimal.Value;
  taxRate?: Prisma.Decimal.Value; // ITBIS RD por defecto 0.18
}

export interface OrderLine {
  id: string;
  productId: string;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
}

export class SalesOrder {
  private constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly lines: OrderLine[],
    public readonly subtotal: Prisma.Decimal,
    public readonly taxTotal: Prisma.Decimal,
    public readonly total: Prisma.Decimal,
    public readonly currency: string,
  ) {}

  static create(input: {
    customerId: string;
    lines: OrderLineInput[];
    currency?: string;
  }): SalesOrder {
    if (!input.customerId) throw new DomainError('El cliente es obligatorio');
    if (!input.lines?.length) throw new DomainError('El pedido debe tener al menos una línea');

    let subtotal = D(0);
    let taxTotal = D(0);

    const lines: OrderLine[] = input.lines.map((l) => {
      const quantity = D(l.quantity);
      const unitPrice = D(l.unitPrice);
      const taxRate = D(l.taxRate ?? '0.18'); // ITBIS estándar RD
      if (quantity.lte(0)) throw new DomainError('La cantidad debe ser > 0');
      if (unitPrice.lt(0)) throw new DomainError('El precio no puede ser negativo');

      const lineTotal = quantity.times(unitPrice);
      subtotal = subtotal.plus(lineTotal);
      taxTotal = taxTotal.plus(lineTotal.times(taxRate));

      return { id: randomUUID(), productId: l.productId, quantity, unitPrice, taxRate, lineTotal };
    });

    const total = subtotal.plus(taxTotal);
    return new SalesOrder(randomUUID(), input.customerId, lines, subtotal, taxTotal, total, input.currency ?? 'DOP');
  }
}

export class DomainError extends Error {}
