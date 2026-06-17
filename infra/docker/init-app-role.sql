-- Crea el rol de APLICACIÓN, deliberadamente SIN BYPASSRLS.
-- Aunque una query olvide filtrar por tenant, Postgres (RLS) lo bloquea.
-- El rol 'nexus_owner' (dueño) corre migraciones y aplica políticas RLS.

CREATE ROLE nexus_app WITH LOGIN PASSWORD 'nexus_app' NOBYPASSRLS;

GRANT CONNECT ON DATABASE nexus TO nexus_app;
GRANT USAGE ON SCHEMA public TO nexus_app;

-- Permisos sobre tablas existentes y futuras (creadas por nexus_owner vía Prisma).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_app;
ALTER DEFAULT PRIVILEGES FOR ROLE nexus_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexus_app;
ALTER DEFAULT PRIVILEGES FOR ROLE nexus_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO nexus_app;

-- Rol del RELAY de Outbox: necesita leer eventos de TODOS los tenants para
-- publicarlos. Por eso lleva BYPASSRLS. Se usa EXCLUSIVAMENTE por el worker relay
-- y solo debe tocar outbox_event (privilegio mínimo).
CREATE ROLE nexus_relay WITH LOGIN PASSWORD 'nexus_relay' BYPASSRLS;
GRANT CONNECT ON DATABASE nexus TO nexus_relay;
GRANT USAGE ON SCHEMA public TO nexus_relay;
-- (en producción: restringir a SELECT/UPDATE solo sobre outbox_event)
ALTER DEFAULT PRIVILEGES FOR ROLE nexus_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexus_relay;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_relay;
