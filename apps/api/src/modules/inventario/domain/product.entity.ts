import { randomUUID } from 'node:crypto';

export type CostingMethod = 'AVERAGE' | 'FIFO';

export interface ProductProps {
  id: string;
  sku: string;
  name: string;
  unit: string;
  costingMethod: CostingMethod;
  trackLots: boolean;
  trackSerials: boolean;
  basePrice: string; // Decimal serializado
}

export class Product {
  private constructor(public readonly props: ProductProps) {}

  static create(input: {
    sku: string;
    name: string;
    unit?: string;
    costingMethod?: CostingMethod;
    trackLots?: boolean;
    trackSerials?: boolean;
    basePrice?: string;
  }): Product {
    if (!input.sku?.trim()) throw new DomainError('El SKU es obligatorio');
    if (!input.name?.trim()) throw new DomainError('El nombre del producto es obligatorio');
    return new Product({
      id: randomUUID(),
      sku: input.sku.trim(),
      name: input.name.trim(),
      unit: input.unit ?? 'UND',
      costingMethod: input.costingMethod ?? 'AVERAGE',
      trackLots: input.trackLots ?? false,
      trackSerials: input.trackSerials ?? false,
      basePrice: input.basePrice ?? '0',
    });
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
