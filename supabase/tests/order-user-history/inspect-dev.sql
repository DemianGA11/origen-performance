\set ON_ERROR_STOP on
-- Read-only metadata. Use only the operator-verified Dev connection.
BEGIN READ ONLY;
SELECT current_user, current_database(), current_setting('server_version') AS version;
SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE (table_schema='public' AND table_name IN ('orders','order_items'))
   OR (table_schema='auth' AND table_name='users' AND column_name='id')
ORDER BY table_schema, table_name, ordinal_position;
SELECT w.name, p.oid::regprocedure AS signature, pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef, has_function_privilege('service_role',p.oid,'EXECUTE') AS service_execute,
       pg_get_functiondef(p.oid) AS definition
FROM (VALUES ('reserve_inventory_for_order'),('link_stripe_session_to_order'),
             ('confirm_stripe_order'),('expire_stripe_order')) w(name)
LEFT JOIN pg_namespace n ON n.nspname='public'
LEFT JOIN pg_proc p ON p.pronamespace=n.oid AND p.proname=w.name
ORDER BY w.name, p.oid;
-- Look beyond public and enumerate ALL overloads, not just expected signatures.
SELECT n.nspname AS schema_name, p.proname,
       p.oid::regprocedure AS actual_signature,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       p.prokind, pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE p.proname IN ('reserve_inventory_for_order','link_stripe_session_to_order',
                    'confirm_stripe_order','expire_stripe_order')
ORDER BY n.nspname,p.proname,p.oid;
-- Expected by the CURRENT application; missing values do not block structural Dev testing.
SELECT expected_signature, to_regprocedure(expected_signature) AS exact_match
FROM (VALUES ('public.reserve_inventory_for_order(uuid,jsonb)'),
             ('public.link_stripe_session_to_order(uuid,text,timestamp with time zone)'),
             ('public.confirm_stripe_order(uuid,text,integer,text,jsonb)'),
             ('public.expire_stripe_order(uuid,text)')) v(expected_signature);
SELECT t.tgname, pg_get_triggerdef(t.oid), pg_get_functiondef(t.tgfoid)
FROM pg_trigger t WHERE t.tgrelid='public.orders'::regclass AND NOT t.tgisinternal;
SELECT evtname, evtevent, evtenabled, evttags, evtfoid::regprocedure
FROM pg_event_trigger;
SELECT policyname, tablename, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('orders','order_items');
SELECT r.rolname, c.oid::regclass AS relation,
       has_table_privilege(r.oid,c.oid,'SELECT') AS can_select,
       has_table_privilege(r.oid,c.oid,'INSERT') AS can_insert,
       has_table_privilege(r.oid,c.oid,'UPDATE') AS can_update
FROM pg_roles r CROSS JOIN pg_class c
WHERE r.rolname IN ('anon','authenticated','service_role')
  AND c.oid IN ('public.orders'::regclass,'public.order_items'::regclass);
SELECT pg_has_role(current_user,'service_role','SET') AS can_set_service,
       pg_has_role(current_user,'authenticated','SET') AS can_set_authenticated;
ROLLBACK;
