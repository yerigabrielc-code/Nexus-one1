// Dominio puro: sin Prisma, sin Nest. Solo reglas de negocio (invariantes).
import { randomUUID } from 'node:crypto';

export type CustomerType = 'PROSPECT' | 'CUSTOMER';
export type TaxIdType = 'RNC' | 'CEDULA' | 'NONE';

export interface CustomerProps {
  id: string;
  code: string;
  legalName: string;
  tradeName?: string;
  taxIdType: TaxIdType;
  taxId?: string;
  type: CustomerType;
  email?: string;
  phone?: string;
}

export class Customer {
  private constructor(public readonly props: CustomerProps) {}

  static create(input: Omit<CustomerProps, 'id'>): Customer {
    if (!input.code?.trim()) throw new DomainError('El código del cliente es obligatorio');
    if (!input.legalName?.trim()) throw new DomainError('La razón social es obligatoria');

    // Regla RD/DGII: si se declara RNC/Cédula, debe venir el número.
    if (input.taxIdType !== 'NONE' && !input.taxId?.trim()) {
      throw new DomainError(`Debe indicar el número de ${input.taxIdType}`);
    }
    // RNC = 9 dígitos; Cédula = 11 dígitos (validación de longitud básica).
    if (input.taxId) {
      const digits = input.taxId.replace(/\D/g, '');
      if (input.taxIdType === 'RNC' && digits.length !== 9) {
        throw new DomainError('El RNC debe tener 9 dígitos');
      }
      if (input.taxIdType === 'CEDULA' && digits.length !== 11) {
        throw new DomainError('La Cédula debe tener 11 dígitos');
      }
    }

    return new Customer({ id: randomUUID(), ...input });
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
