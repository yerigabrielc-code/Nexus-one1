# Despliegue de Nexus One

## Servicios que necesita el sistema
| Servicio | Uso | Notas |
|---|---|---|
| PostgreSQL 16 | Datos + **RLS multi-tenant** | Requiere crear roles `nexus_app` (NOBYPASSRLS) y **`nexus_relay` (BYPASSRLS)** |
| RabbitMQ | Bus de eventos (ruta de producción) | Plan free de CloudAMQP sirve |
| Redis | Cache/sesiones (opcional en MVP) | |
| API (NestJS) | Backend, puerto 3001 | Always-on (corre relay + consumers) |
| Web (Next.js) | Frontend PWA, puerto 3000 | |

> ⚠️ **Restricción clave:** la seguridad multi-tenant usa RLS con `FORCE ROW LEVEL SECURITY` + un rol **`BYPASSRLS`** dedicado para el relay del Outbox. Crear un rol `BYPASSRLS` exige privilegios de **superusuario** en Postgres. Los Postgres gestionados gratuitos (Neon, Supabase, Render PG) **no otorgan `BYPASSRLS`** a roles creados por el usuario. Por eso, para el camino 100% gratuito y sin cambios, conviene **Postgres autogestionado** (en una VM o contenedor que tú controlas).

---

## Opción A — 100% gratis y completa (recomendada): VM Always Free + Docker Compose
**Oracle Cloud Free Tier** ofrece una VM ARM Ampere (hasta 4 vCPU / 24 GB RAM) **gratis para siempre**, suficiente para todo el stack en un solo host.

1. Crea la VM (Ubuntu 22.04) en Oracle Cloud (o Google Cloud `e2-micro` Always Free, o cualquier VPS).
2. Instala Docker + Docker Compose.
3. Clona el repo y configura el entorno:
   ```bash
   cp .env.production.example .env.production
   # edita secretos: contraseñas, JWT (openssl rand -hex 32), dominios
   ```
4. Levanta todo:
   ```bash
   docker compose -f infra/docker/docker-compose.prod.yml --env-file .env.production up -d --build
   ```
   El `docker-entrypoint.sh` del API aplica migraciones + RLS automáticamente (y seed si `SEED_ON_START=true`).
5. Pon **Caddy** o **Nginx** delante para HTTPS gratis (Let's Encrypt) y enruta:
   - `tudominio.com` → web (3000)
   - `api.tudominio.com` → api (3001)

**Ventaja:** Postgres es tuyo → `BYPASSRLS` funciona sin cambios. Costo: US$0.

---

## Opción B — Managed gratis (más cómodo, con 1 ajuste)
- **Web:** Vercel (free) — importa `apps/web`, define `NEXT_PUBLIC_API_URL`.
- **API:** Render / Fly.io / Koyeb (free) — imagen `apps/api/Dockerfile`.
- **RabbitMQ:** CloudAMQP plan *Little Lemur* (free).
- **Redis:** Upstash (free).
- **PostgreSQL:** aquí está el ajuste. En Neon/Supabase no hay `BYPASSRLS`. Dos salidas:
  1. **Postgres en la misma VM/contenedor** (como Opción A) aunque el resto sea managed; o
  2. **Adaptar el relay**: hacerlo leer el Outbox *por tenant* (sin BYPASSRLS) — cambio acotado en `RabbitMqEventBus`/`SagaDispatcher`. (Puedo implementarlo si eliges esta vía.)

---

## Checklist previo al despliegue
- [ ] Secretos JWT nuevos (`openssl rand -hex 32` x2), contraseñas fuertes de DB/RabbitMQ.
- [ ] Dominio (o subdominios) con HTTPS. **Importante para cookies:** web y API deben compartir dominio raíz (ej. `app.tudominio.com` + `api.tudominio.com`) para que la cookie `SameSite=Lax` se envíe. Si van en dominios distintos (vercel.app + render.com), hay que cambiar las cookies a `SameSite=None; Secure` (ajuste de 1 línea en `auth.controller.ts`).
- [ ] `WEB_ORIGIN` = origen del frontend (CORS con credenciales).
- [ ] `NEXT_PUBLIC_API_URL` = URL pública del API (se hornea en el build del web).
- [ ] `SEED_ON_START=false` en producción real (o sembrar solo una vez).
- [ ] Cambiar contraseña del admin demo tras el primer login.

## Pendientes recomendados antes de clientes reales
- Integración fiscal **real** con la DGII (firma XML + envío e-CF); hoy el proveedor simula `ACCEPTED`.
- Rotación/revocación de refresh tokens (store en Redis) y rate-limiting.
- Backups automáticos de Postgres (PITR) y almacenamiento S3 real para Documental.
- Observabilidad (OpenTelemetry → Grafana) y DLQ para el consumer de RabbitMQ.
