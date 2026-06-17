import { z } from 'zod';

// DTOs compartidos entre API y SDK/web (validación con Zod).

export const CreateCustomerSchema = z.object({
  code: z.string().min(1).max(40),
  legalName: z.string().min(1).max(200),
  tradeName: z.string().max(200).optional(),
  taxIdType: z.enum(['RNC', 'CEDULA', 'NONE']).default('NONE'),
  taxId: z.string().max(20).optional(),
  type: z.enum(['PROSPECT', 'CUSTOMER']).default('PROSPECT'),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
});
export type CreateCustomerDto = z.infer<typeof CreateCustomerSchema>;

export const LoginSchema = z.object({
  tenantSlug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginSchema>;
