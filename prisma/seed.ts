// Seed de desarrollo: 2 tenants (para probar aislamiento), roles plantilla,
// permisos base y un usuario admin por tenant.
// Corre con el rol DUEÑO; setea app.current_tenant por tenant para respetar RLS.
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { hash as argon2 } from '@node-rs/argon2';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_MIGRATION_URL } },
});

const PERMISSIONS = [
  { key: 'customer:read', module: 'comercial' },
  { key: 'customer:create', module: 'comercial' },
  { key: 'customer:update', module: 'comercial' },
  { key: 'product:read', module: 'inventario' },
  { key: 'product:create', module: 'inventario' },
  { key: 'stock:move', module: 'inventario' },
  { key: 'order:create', module: 'ventas' },
  { key: 'invoice:create', module: 'ventas' },
  { key: 'receivable:read', module: 'cobros' },
  { key: 'payment:register', module: 'cobros' },
  { key: 'analytics:read', module: 'analitica' },
  // Fase 2/3
  { key: 'purchase:create', module: 'compras' },
  { key: 'purchase:approve', module: 'compras' },
  { key: 'payable:read', module: 'pagos' },
  { key: 'payable:pay', module: 'pagos' },
  { key: 'asset:manage', module: 'activos' },
  { key: 'document:read', module: 'documental' },
  { key: 'document:manage', module: 'documental' },
  { key: 'automation:manage', module: 'automatizacion' },
  { key: 'alert:read', module: 'automatizacion' },
  { key: 'approval:request', module: 'automatizacion' },
  { key: 'approval:decide', module: 'automatizacion' },
];

const ROLE_TEMPLATES: Record<string, string[]> = {
  'Super Admin': PERMISSIONS.map((p) => p.key),
  'Gerente General': PERMISSIONS.map((p) => p.key),
  Ventas: ['customer:read', 'customer:create', 'customer:update', 'product:read', 'order:create', 'invoice:create'],
  Inventario: ['product:read', 'product:create', 'stock:move'],
  Compras: ['purchase:create', 'product:read', 'payable:read'],
  Pagos: ['payable:read', 'payable:pay'],
  Mantenimiento: ['asset:manage', 'document:read'],
  Cobros: ['customer:read', 'receivable:read', 'payment:register', 'alert:read'],
  Consulta: ['customer:read', 'product:read', 'receivable:read', 'analytics:read', 'payable:read'],
};

async function main() {
  const pwHash = await argon2('Nexus123*'); // hash argon2id reutilizable para los admins demo

  // Permisos globales
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: { id: randomUUID(), ...p },
    });
  }
  const allPerms = await prisma.permission.findMany();
  const permByKey = new Map(allPerms.map((p) => [p.key, p.id]));

  for (const [slug, name, email] of [
    ['acme-do', 'ACME Distribuidora SRL', 'admin@acme.do'],
    ['ferreteria-caribe', 'Ferretería Caribe SRL', 'admin@caribe.do'],
  ] as const) {
    const tenant = await prisma.tenant.upsert({
      where: { slug },
      update: {},
      create: {
        id: randomUUID(),
        slug,
        name,
        countryCode: 'DO',
        currency: 'DOP',
        tier: 'PROFESSIONAL',
      },
    });

    // RLS: operar como este tenant
    await prisma.$executeRawUnsafe(`SET app.current_tenant = '${tenant.id}'`);

    let adminRoleId = '';
    for (const [roleName, permKeys] of Object.entries(ROLE_TEMPLATES)) {
      const role = await prisma.role.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
        update: {},
        create: {
          id: randomUUID(),
          tenantId: tenant.id,
          name: roleName,
          isSystem: true,
        },
      });
      if (roleName === 'Super Admin') adminRoleId = role.id; // id real (re-ejecutable)
      for (const key of permKeys) {
        const permissionId = permByKey.get(key)!;
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId } },
          update: {},
          create: { roleId: role.id, permissionId },
        });
      }
    }

    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      update: { passwordHash: pwHash }, // re-hash a argon2 en usuarios existentes
      create: {
        id: randomUUID(),
        tenantId: tenant.id,
        email,
        fullName: 'Administrador',
        passwordHash: pwHash,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRoleId } },
      update: {},
      create: { userId: user.id, roleId: adminRoleId },
    });

    console.log(`✅ Tenant '${slug}' listo. Admin: ${email} / Nexus123*`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
