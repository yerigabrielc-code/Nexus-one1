import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { Product } from '../domain/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepositoryPort } from '../domain/inventory.ports';

export interface CreateProductInput {
  sku: string;
  name: string;
  unit?: string;
  costingMethod?: 'AVERAGE' | 'FIFO';
  basePrice?: string;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PRODUCT_REPOSITORY) private readonly repo: ProductRepositoryPort,
  ) {}

  execute(input: CreateProductInput) {
    return withTenant(this.prisma, async (tx) => {
      if (await this.repo.existsBySku(tx, input.sku)) {
        throw new ConflictException(`Ya existe un producto con SKU ${input.sku}`);
      }
      const product = Product.create(input);
      await this.repo.save(tx, product);
      return { id: product.props.id, sku: product.props.sku };
    });
  }
}
