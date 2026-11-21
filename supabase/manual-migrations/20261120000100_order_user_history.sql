-- REVIEW ONLY. Manual execution requires explicit approval and a verified target.
-- Not in supabase/migrations: no automatic install or deployment hook.
-- Run as postgres, whole file, with psql -X -v ON_ERROR_STOP=1.
-- Additive association only. Never backfill historical guests by email.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $preflight$
DECLARE
    expected record;
BEGIN
    IF CURRENT_USER <> 'postgres' THEN
        RAISE EXCEPTION 'ORDER_HISTORY_REQUIRES_POSTGRES';
    END IF;
    IF to_regclass('public.orders') IS NULL
       OR to_regclass('public.order_items') IS NULL
       OR to_regclass('auth.users') IS NULL THEN
        RAISE EXCEPTION 'ORDER_HISTORY_REQUIRED_TABLE_MISSING';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        WHERE c.oid = 'public.orders'::regclass
          AND c.relkind = 'r' AND c.relrowsecurity
          AND c.relowner = (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'postgres')
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_class
        WHERE oid = 'public.order_items'::regclass AND relrowsecurity
    ) THEN
        RAISE EXCEPTION 'ORDER_HISTORY_REVIEW_OWNER_OR_RLS';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
       OR NOT has_table_privilege(CURRENT_USER, 'auth.users', 'REFERENCES') THEN
        RAISE EXCEPTION 'ORDER_HISTORY_REQUIRED_ROLE_OR_REFERENCE_PRIVILEGE_MISSING';
    END IF;
    FOR expected IN SELECT * FROM (VALUES
        ('public.orders', 'id', 'uuid'),
        ('public.orders', 'total_amount', 'integer'),
        ('public.orders', 'currency', 'text'),
        ('public.orders', 'payment_status', 'text'),
        ('public.orders', 'order_status', 'text'),
        ('public.orders', 'created_at', 'timestamp with time zone'),
        ('public.order_items', 'order_id', 'uuid'),
        ('public.order_items', 'product_name', 'text'),
        ('public.order_items', 'quantity', 'integer'),
        ('auth.users', 'id', 'uuid')
    ) AS v(table_name, column_name, type_name) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_attribute a
            WHERE a.attrelid = expected.table_name::regclass
              AND a.attname = expected.column_name AND NOT a.attisdropped
              AND a.atttypid = expected.type_name::regtype
        ) THEN
            RAISE EXCEPTION 'ORDER_HISTORY_SCHEMA_MISMATCH: %.%', expected.table_name, expected.column_name;
        END IF;
    END LOOP;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_attribute
               WHERE attrelid = 'public.orders'::regclass AND attname = 'user_id' AND NOT attisdropped)
       OR to_regprocedure('public.guard_order_user_association()') IS NOT NULL
       OR to_regclass('public.orders_user_created_at_idx') IS NOT NULL
       OR EXISTS (SELECT 1 FROM pg_catalog.pg_constraint WHERE conrelid = 'public.orders'::regclass AND conname = 'orders_user_id_fkey')
       OR EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid = 'public.orders'::regclass AND tgname = 'orders_user_association_guard') THEN
        RAISE EXCEPTION 'ORDER_HISTORY_OBJECT_COLLISION_REVIEW_BEFORE_RETRY';
    END IF;
END;
$preflight$;

-- No DEFAULT and no UPDATE: every existing order remains unassociated.
ALTER TABLE public.orders ADD COLUMN user_id uuid;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
CREATE INDEX orders_user_created_at_idx
    ON public.orders (user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Existing RLS, table ACL and financial RPC are unchanged.
-- Prevent ordinary writes from claiming an owner; prevent all reassignment,
-- including NULL -> user on a historical guest and clearing an assigned owner.
CREATE FUNCTION public.guard_order_user_association()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $guard$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.user_id IS NOT NULL AND CURRENT_USER NOT IN ('postgres', 'service_role') THEN
            RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ORDER_OWNER_SERVER_ONLY';
        END IF;
    ELSIF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'ORDER_OWNER_IMMUTABLE';
    END IF;
    RETURN NEW;
END;
$guard$;
REVOKE ALL ON FUNCTION public.guard_order_user_association() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_order_user_association() FROM anon, authenticated, service_role;

CREATE TRIGGER orders_user_association_guard
BEFORE INSERT OR UPDATE OF user_id ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_user_association();

DO $postflight$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute
        WHERE attrelid = 'public.orders'::regclass AND attname = 'user_id'
          AND atttypid = 'uuid'::regtype AND NOT attnotnull AND NOT atthasdef
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint
        WHERE conrelid = 'public.orders'::regclass AND conname = 'orders_user_id_fkey'
          AND confrelid = 'auth.users'::regclass AND confdeltype = 'r' AND convalidated
    ) OR EXISTS (SELECT 1 FROM public.orders WHERE user_id IS NOT NULL) THEN
        RAISE EXCEPTION 'ORDER_HISTORY_POSTFLIGHT_FAILED';
    END IF;
    RAISE NOTICE 'PASS: nullable owner association added; existing orders remain NULL; no public read/write grants added';
END;
$postflight$;
COMMIT;
