# Nexus One — Walking Skeleton (Sprint 0)

> **The Business Operating System** — SaaS multi-tenant para PYMES de LATAM.
> Este repositorio contiene el **esqueleto vertical end-to-end** que valida la
> arquitectura antes de construir los módulos de negocio.

## ¿Qué valida este skeleton?

El bucle completo de la arquitectura con UNA feature real (crear cliente):

```
Login multi-tenant (JWT + RBAC)
   └─> POST /customers  (use case Clean Architecture)
         └─> withTenant() abre tx + SET app.current_tenant  (RLS)
               ├─> guarda Customer
               └─> escribe OutboxEvent  (misma transacción = patrón Outbox)
   Worker relay (BYPASSRLS) ──> publica a RabbitMQ
   Worker consumer ──> escribe en audit_log (con contexto de tenant)
```

Decisiones fundacionales materializadas: **multi-tenancy con RLS** (ADR-001),
**monolito modular por bounded context** (ADR-002), **Transactional Outbox**
(ADR-003), país fiscal #1 **República Dominicana (DGII / e-NCF, Ley 32-23)**.

## Prerrequisitos

- **Node.js >= 20** y **pnpm 9** — _no instalados en esta máquina; instálalos primero._
- **Docker Desktop** (Postgres + Redis + RabbitMQ).

```powershell
# Instalar Node + pnpm (Windows)
winget install OpenJS.NodeJS.LTS
npm install -g pnpm
```

## Puesta en marcha

```powershell
# 1. Variables de entorno
Copy-Item .env.example .env

# 2. Infra (Postgres con roles app/relay, Redis, RabbitMQ)
pnpm infra:up

# 3. Dependencias
pnpm install

# 4. Base de datos: generar cliente, migrar, aplicar RLS, sembrar
pnpm db:generate
pnpm db:migrate
pnpm db:rls
pnpm db:seed

# 5. Levantar API y workers (en terminales separadas)
pnpm --filter @nexus/api dev
pnpm --filter @nexus/workers dev
```

## Probar el slice

```powershell
# Login (tenant sembrado)
$body = @{ tenantSlug="acme-do"; email="admin@acme.do"; password="Nexus123*" } | ConvertTo-Json
$res  = Invoke-RestMethod -Uri http://localhost:3001/api/v1/auth/login -Method Post -Body $body -ContentType "application/json"

# Crear cliente (RNC de 9 dígitos, regla de dominio DGII)
$cust = @{ code="CLI-001"; legalName="Cliente Demo SRL"; taxIdType="RNC"; taxId="131123456"; type="CUSTOMER" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/api/v1/customers -Method Post -Body $cust `
  -ContentType "application/json" -Headers @{ Authorization = "Bearer $($res.accessToken)" }
```

El worker mostrará en consola la publicación del evento y la escritura en `audit_log`.
RabbitMQ admin: http://localhost:15672 (nexus / nexus).

## Gate de seguridad (CI)

```powershell
pnpm test:isolation   # falla si un tenant puede ver datos de otro (RLS)
```

## Estructura

```
apps/
  api/        NestJS — auth, tenant interceptor, RBAC, módulo Comercial (slice)
  workers/    relay de Outbox + consumidor que escribe audit_log
packages/
  contracts/  DTOs (Zod) + contrato de eventos de dominio
prisma/       schema multi-tenant + RLS + seed
infra/        docker-compose + roles de DB (app sin BYPASSRLS, relay con BYPASSRLS)
```

## Capas por módulo (Clean Architecture)

```
modules/comercial/
  domain/          customer.entity.ts (invariantes), repository.port.ts  ← TS puro
  application/     create-customer.usecase.ts, list-customers.usecase.ts
  infrastructure/  customer.prisma.repository.ts
  api/             comercial.controller.ts
```

## Notas de seguridad pendientes (antes de producción)

- Reemplazar `sha256` por **argon2id** en hashing de contraseñas.
- Rotación + revocación de refresh tokens (almacén en Redis).
- DLQ real para el consumidor de RabbitMQ.
- Particionado de `stock_movement`, `outbox_event`, `audit_log` por `(tenantId, fecha)`.
```

<!-- auto-deploy test 2026-06-17T17:41:55.4063535-04:00 -->
