/**
 * GATE DE SEGURIDAD (debe correr en CI antes de cada merge).
 * Verifica que la RLS impide que un tenant lea/escriba datos de otro.
 * Si este test falla, el pipeline DEBE bloquear el merge.
 *
 * Requisitos: DB levantada + migraciones + RLS aplicada (`pnpm db:rls`).
 * Usa el rol de APLICACIÓN (DATABASE_URL, sin BYPASSRLS).
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const TENANT_A = randomUUID();
const TENANT_B = randomUUID();

// Ejecuta una función con el tenant seteado (replica withTenant del API).
async function asTenant<T>(tenantId: string, fn: (tx: any) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
    return fn(tx);
  });
}

// El alta de tenant (tabla global) la hace un cliente owner por separado.
const owner = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_MIGRATION_URL } },
});

beforeAll(async () => {
  for (const [id, slug] of [
    [TENANT_A, `iso-a-${id_suffix()}`],
    [TENANT_B, `iso-b-${id_suffix()}`],
  ] as const) {
    await owner.tenant.create({
      data: { id, name: `ISO ${id}`, slug, countryCode: 'DO', currency: 'DOP' },
    });
  }
});

afterAll(async () => {
  // Borrar customers con contexto de tenant (RLS) antes que el tenant (FK Restrict).
  for (const t of [TENANT_A, TENANT_B]) {
    await asTenant(t, (tx) => tx.customer.deleteMany());
  }
  await owner.tenant.deleteMany({ where: { id: { in: [TENANT_A, TENANT_B] } } });
  await prisma.$disconnect();
  await owner.$disconnect();
});

function id_suffix() {
  return Math.random().toString(36).slice(2, 8);
}

describe('Aislamiento multi-tenant (RLS)', () => {
  it('un tenant NO puede leer Customers de otro tenant', async () => {
    await asTenant(TENANT_A, (tx) =>
      tx.customer.create({
        data: { tenantId: TENANT_A, code: 'C-001', legalName: 'Cliente de A', type: 'CUSTOMER' },
      }),
    );

    const seenByA = await asTenant<any[]>(TENANT_A, (tx) => tx.customer.findMany());
    const seenByB = await asTenant<any[]>(TENANT_B, (tx) => tx.customer.findMany());

    expect(seenByA.length).toBeGreaterThanOrEqual(1);
    expect(seenByB.find((c: any) => c.code === 'C-001')).toBeUndefined();
  });

  it('sin tenant en contexto, no se ve ninguna fila (fail-closed)', async () => {
    // Sin SET app.current_tenant -> current_setting devuelve NULL -> 0 filas.
    const rows = await prisma.customer.findMany();
    expect(rows).toHaveLength(0);
  });

  it('un tenant NO puede insertar filas con el tenantId de otro (WITH CHECK)', async () => {
    await expect(
      asTenant(TENANT_B, (tx) =>
        tx.customer.create({
          data: { tenantId: TENANT_A, code: 'HACK', legalName: 'Inyección', type: 'CUSTOMER' },
        }),
      ),
    ).rejects.toThrow();
  });
});
