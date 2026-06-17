import type { Tx } from '../../../shared/prisma/tenant-runner';
import type { Customer } from './customer.entity';

// Puerto (interface) del repositorio — el dominio define el contrato,
// la infraestructura lo implementa (inversión de dependencias / SOLID).
export interface CustomerRepositoryPort {
  existsByCode(tx: Tx, code: string): Promise<boolean>;
  save(tx: Tx, customer: Customer): Promise<void>;
}

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');
