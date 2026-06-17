# Despliegue gratuito: Vercel + Supabase + GitHub

> Arquitectura objetivo (todo en planes gratuitos):
> - **GitHub** → repositorio + disparador de despliegues.
> - **Supabase** → PostgreSQL gestionado (+ Storage opcional para Documental).
> - **Vercel** → 2 proyectos: **web** (Next.js) y **api** (NestJS serverless).
>
> RabbitMQ, Redis y el rol `BYPASSRLS` **no se usan** aquí (no encajan en serverless/Supabase).

---

## ✅ Adaptaciones ya implementadas en el código
Vercel es serverless y Supabase no da `BYPASSRLS`. Estas 3 piezas ya están en el repo y verificadas:

1. **Saga síncrona por tenant** (`SAGA_MODE=sync`): tras cada request, un interceptor **drena el Outbox del tenant actual en la misma petición** con el rol de app (la RLS lo limita a ese tenant → sin `BYPASSRLS`, sin relay, sin RabbitMQ). *(Verificado: venta → stock descontado + CxC creada + Outbox en 0.)*
2. **Entrypoint serverless**: `apps/api/api/index.ts` (Nest sobre Express, cacheado) + `apps/api/vercel.json` (rewrites a la función). Prisma con `binaryTargets=["native","rhel-openssl-3.0.x"]` para el runtime de Vercel.
3. **Cookies cross-site**: flag `COOKIE_CROSS_SITE=true` → `SameSite=None; Secure` (web y api en `*.vercel.app` distintos). Con dominio propio `app.tu.com`+`api.tu.com` puedes dejarlo en `false` (Lax).

---

## Paso 1 — Subir a GitHub
```bash
cd nexus-one
git init && git add . && git commit -m "Nexus One"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/nexus-one.git
git push -u origin main
```
(Asegúrate de que `.gitignore` excluye `node_modules`, `.env*`, `.next`, `dist` — ya está.)

---

## Paso 2 — Supabase (PostgreSQL)
1. Crea un proyecto en https://supabase.com (free). Guarda la contraseña de la base.
2. En **Project Settings → Database** copia las dos cadenas:
   - **Connection pooling** (Transaction, puerto **6543**) → para el runtime serverless.
   - **Direct connection** (puerto **5432**) → para migraciones.
3. En **SQL Editor**, crea el rol de aplicación (sin BYPASSRLS) y dale permisos:
   ```sql
   create role nexus_app with login password 'PON_UNA_CLAVE' nobypassrls;
   grant usage on schema public to nexus_app;
   grant select, insert, update, delete on all tables in schema public to nexus_app;
   alter default privileges in schema public
     grant select, insert, update, delete on tables to nexus_app;
   grant usage, select on all sequences in schema public to nexus_app;
   alter default privileges in schema public grant usage, select on sequences to nexus_app;
   ```
   > No se crea `nexus_relay`: con la saga síncrona no hace falta `BYPASSRLS`.
4. **Migraciones + RLS + seed** (desde tu máquina, apuntando a Supabase por la conexión **directa**):
   ```powershell
   $env:DATABASE_MIGRATION_URL="postgresql://postgres:CLAVE@db.<proj>.supabase.co:5432/postgres"
   pnpm -C prisma exec prisma migrate deploy
   node prisma/scripts/apply-rls.mjs
   pnpm dlx tsx prisma/seed.ts
   ```

### Cadenas de conexión resultantes
- **DATABASE_URL** (runtime, pooled):
  `postgresql://nexus_app:CLAVE@<proj>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
- **DATABASE_MIGRATION_URL** (directa): la del puerto 5432 con rol `postgres`.

---

## Paso 3 — Desplegar el API en Vercel
1. En Vercel → **Add New Project** → importa el repo de GitHub.
2. **Root Directory:** `apps/api`. Framework: *Other*.
   - **Install Command:** `pnpm install --no-frozen-lockfile`
   - **Build Command:** `pnpm --filter @nexus/contracts build && pnpm --filter @nexus/prisma exec prisma generate && pnpm --filter @nexus/api build`
3. **Environment Variables:**
   | Clave | Valor |
   |---|---|
   | `DATABASE_URL` | cadena pooled (6543, `nexus_app`, `?pgbouncer=true&connection_limit=1`) |
   | `DATABASE_MIGRATION_URL` | cadena directa (5432, `postgres`) |
   | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | `openssl rand -hex 32` (uno cada uno) |
   | `WEB_ORIGIN` | URL del proyecto web (p. ej. `https://nexus-web.vercel.app`) |
   | `RABBITMQ_ENABLED` | `false` |
   | `SAGA_MODE` | `sync` |
   | `COOKIE_CROSS_SITE` | `true` |
   | `NODE_ENV` | `production` |
4. Deploy. La API queda en `https://nexus-api.vercel.app/api/v1`.

---

## Paso 4 — Desplegar el Web en Vercel
1. **Add New Project** → mismo repo. **Root Directory:** `apps/web`.
2. Framework: **Next.js** (autodetectado).
3. **Environment Variable:**
   - `NEXT_PUBLIC_API_URL` = `https://nexus-api.vercel.app/api/v1`
4. Deploy. El frontend queda en `https://nexus-web.vercel.app`.
5. Vuelve al proyecto **api** y confirma que `WEB_ORIGIN` apunta a esta URL del web. Redeploy si lo cambiaste.

---

## Paso 5 — CI/CD automático
Vercel redepliega ambos proyectos en cada `git push` a `main`. Las **migraciones** se ejecutan manualmente (Paso 2.4) o vía un GitHub Action al hacer push (puedo dejarlo listo).

---

## Costos (planes free)
| Servicio | Free tier |
|---|---|
| Vercel (web + api Hobby) | 100 GB-h / mes, suficiente para arrancar |
| Supabase | 500 MB DB, 2 proyectos activos, gratis |
| GitHub | repos ilimitados |

## Límites a tener en cuenta
- **Cold starts** del API serverless (primer request lento).
- **Conexiones**: usar siempre la cadena *pooled* + `connection_limit=1` (serverless abre muchas conexiones).
- **Saga síncrona**: la reserva/descuento de stock y CxC/CxP ocurren dentro del request (un poco más lento, pero consistente). Sin RabbitMQ no hay reproceso asíncrono ni auditoría por bus (la auditoría se puede escribir en el mismo request).
- **Facturación DGII**: sigue simulada; la integración real es trabajo aparte.
- Para `Storage` de Documental usa **Supabase Storage** (free) en lugar de S3.
