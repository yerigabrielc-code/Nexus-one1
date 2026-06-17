import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

export interface POLineInput {
  productId: string;
  quantity: Prisma.Decimal.Value;
  unitCost: Prisma.Decimal.Value;
  taxRate?: Prisma.Decimal.Value;
}

export interface POLine {
  id: string;
  productId: string;
  quantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
}

export class PurchaseOrder {
  private constructor(
    public readonly id: string,
    public readonly supplierId: string,
    public readonly warehouseId: string,
    public readonly lines: POLine[],
    public readonly subtotal: Prisma.Decimal,
    public readonly taxTotal: Prisma.Decimal,
    public readonly total: Prisma.Decimal,
    public readonly currency: string,
  ) {}

  static create(input: {
    supplierId: string;
    warehouseId: string;
    lines: POLineInput[];
    currency?: string;
  }): PurchaseOrder {
    if (!input.supplierId) throw new DomainError('El proveedor es obligatorio');
    if (!input.warehouseId) throw new DomainError('El almacén destino es obligatorio');
    if (!input.lines?.length) throw new DomainError('La orden debe tener al menos una línea');

    let subtotal = D(0);
    let taxTotal = D(0);
    const lines: POLine[] = input.lines.map((l) => {
      const quantity = D(l.quantity);
      const unitCost = D(l.unitCost);
      const taxRate = D(l.taxRate ?? '0.18');
      if (quantity.lte(0)) throw new DomainError('La cantidad debe ser > 0');
      if (unitCost.lt(0)) throw new DomainError('El costo no puede ser negativo');
      const lineTotal = quantity.times(unitCost);
      subtotal = subtotal.plus(lineTotal);
      taxTotal = taxTotal.plus(lineTotal.times(taxRate));
      return { id: randomUUID(), productId: l.productId, quantity, unitCost, taxRate, lineTotal };
    });

    return new PurchaseOrder(
      randomUUID(),
      input.supplierId,
      input.warehouseId,
      lines,
      subtotal,
      taxTotal,
      subtotal.plus(taxTotal),
      input.currency ?? 'DOP',
    );
  }
}

export class DomainError extends Error {}
