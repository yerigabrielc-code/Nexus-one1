import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { currentTenantId } from '../tenant/tenant-context';

export type Tx = Prisma.TransactionClient;

/**
 * Ejecuta `fn` dentro de una transacción que setea `app.current_tenant`,
 * activando la política RLS para TODAS las queries de esa transacción.
 * Fail-closed: sin tenant en contexto, no se ejecuta nada.
 *
 * NOTA: el tenantId proviene del contexto (JWT), nunca del input del usuario;
 * por eso es seguro interpolarlo, pero igual validamos formato UUID.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function withTenant<T>(
  prisma: PrismaService,
  fn: (tx: Tx) => Promise<T>,
  tenantIdOverride?: string,
): Promise<T> {
  const tenantId = tenantIdOverride ?? currentTenantId();
  if (!tenantId || !UUID.test(tenantId)) {
    throw new ForbiddenException('No hay tenant válido en el contexto');
  }
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
    return fn(tx);
  });
}
