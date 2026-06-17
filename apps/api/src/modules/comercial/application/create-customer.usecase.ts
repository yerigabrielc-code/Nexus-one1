import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { EventTypes, type CreateCustomerDto } from '@nexus/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { withTenant } from '../../../shared/prisma/tenant-runner';
import { OutboxService } from '../../../shared/outbox/outbox.service';
import { Customer } from '../domain/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepositoryPort,
} from '../domain/customer.repository.port';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(CUSTOMER_REPOSITORY) private readonly repo: CustomerRepositoryPort,
  ) {}

  async execute(dto: CreateCustomerDto) {
    // El cambio de estado y el evento ocurren en UNA transacción (Outbox + RLS).
    return withTenant(this.prisma, async (tx) => {
      if (await this.repo.existsByCode(tx, dto.code)) {
        throw new ConflictException(`Ya existe un cliente con el código ${dto.code}`);
      }

      const customer = Customer.create({
        code: dto.code,
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        taxIdType: dto.taxIdType,
        taxId: dto.taxId,
        type: dto.type,
        email: dto.email,
        phone: dto.phone,
      });

      await this.repo.save(tx, customer);

      await this.outbox.emit(tx, {
        eventType: EventTypes.CustomerCreated,
        aggregateType: 'Customer',
        aggregateId: customer.props.id,
        payload: {
          customerId: customer.props.id,
          code: customer.props.code,
          legalName: customer.props.legalName,
          type: customer.props.type,
        },
      });

      return { id: customer.props.id, code: customer.props.code };
    });
  }
}
