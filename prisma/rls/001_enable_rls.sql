-- ════════════════════════════════════════════════════════════════════
-- RLS (Row Level Security) — aislamiento multi-tenant a nivel de motor.
-- Se aplica DESPUÉS de cada `prisma migrate`. Idempotente.
-- Política: una fila solo es visible/escribible si su tenantId coincide con
-- la variable de sesión `app.current_tenant` (seteada por la app en cada tx).
-- `current_setting(..., true)` => si no está seteada, devuelve NULL => 0 filas
-- (fail-closed).
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t text;
  -- Solo tablas con columna tenantId. Las tablas de unión (user_role,
  -- role_permission) NO la tienen: su acceso pasa por user/role (ya con RLS),
  -- por lo que un join nunca devuelve filas de otro tenant.
  tenant_tables text[] := ARRAY[
    'user','role','customer','contact','opportunity',
    'product','warehouse','stock_item','stock_movement',
    'sales_order','sales_order_line','invoice',
    'receivable','payment','payment_promise',
    'outbox_event','audit_log',
    -- Fase 2/3
    'supplier','purchase_order','purchase_order_line','goods_receipt',
    'payable','supplier_payment','document','automation_rule','alert','approval',
    'asset','work_order','checklist_item','maintenance_plan'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);
    -- NULLIF(...,'') => si el GUC está sin definir (NULL) o vacío ('') tras una
    -- transacción previa, el resultado es NULL => 0 filas (fail-closed), evitando
    -- además el error 22P02 al castear '' a uuid.
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
        USING ("tenantId" = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
        WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant', true), '')::uuid);
    $f$, t);
  END LOOP;
END $$;

-- Nota: 'tenant' y 'permission' son tablas globales (sin tenantId) y NO llevan
-- política de aislamiento. El acceso a 'tenant' se restringe en la capa de app.
