\set ON_ERROR_STOP on
-- READ ONLY. Run only with separate authorization and a verified Production target.
-- Never include the migration or the reversible Dev fixtures in this connection.
BEGIN READ ONLY;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
SELECT current_user,current_database(),current_setting('server_version') AS version;

-- Missing expected signatures: stop publication and inspect overloads below.
SELECT v.signature, to_regprocedure(v.signature) AS exact_match
FROM (VALUES ('public.reserve_inventory_for_order(uuid,jsonb)'),
             ('public.link_stripe_session_to_order(uuid,text,timestamp with time zone)'),
             ('public.confirm_stripe_order(uuid,text,integer,text,jsonb)'),
             ('public.expire_stripe_order(uuid,text)')) v(signature);

SELECT n.nspname AS schema_name,p.oid::regprocedure AS actual_signature,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_get_userbyid(p.proowner) AS owner,p.prosecdef,p.proconfig,p.proacl,
       has_function_privilege('service_role',p.oid,'EXECUTE') AS service_execute,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE p.proname IN ('reserve_inventory_for_order','link_stripe_session_to_order',
                    'confirm_stripe_order','expire_stripe_order')
ORDER BY n.nspname,p.proname,p.oid;

SELECT n.nspname,c.relname,a.attname,format_type(a.atttypid,a.atttypmod) AS type,
       a.attnotnull,pg_get_expr(d.adbin,d.adrelid) AS default_expression
FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
WHERE a.attnum>0 AND NOT a.attisdropped
  AND ((n.nspname='public' AND c.relname IN ('orders','order_items','inventory_reservations','products'))
       OR (n.nspname='auth' AND c.relname='users' AND a.attname='id'))
ORDER BY n.nspname,c.relname,a.attnum;

SELECT c.oid::regclass AS relation,pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity,c.relforcerowsecurity,c.relacl,
       has_table_privilege('service_role',c.oid,'SELECT') AS service_select,
       has_table_privilege('service_role',c.oid,'INSERT') AS service_insert,
       has_table_privilege('service_role',c.oid,'UPDATE') AS service_update
FROM pg_class c WHERE c.oid IN ('public.orders'::regclass,'public.order_items'::regclass,
  'public.inventory_reservations'::regclass,'public.products'::regclass);

-- Column-level effective privileges matter for SECURITY INVOKER confirmation.
SELECT a.attrelid::regclass AS relation,a.attname,
       has_column_privilege('service_role',a.attrelid,a.attnum,'SELECT') AS service_select,
       has_column_privilege('service_role',a.attrelid,a.attnum,'INSERT') AS service_insert,
       has_column_privilege('service_role',a.attrelid,a.attnum,'UPDATE') AS service_update
FROM pg_attribute a WHERE a.attnum>0 AND NOT a.attisdropped
 AND a.attrelid IN ('public.orders'::regclass,'public.order_items'::regclass,
                   'public.inventory_reservations'::regclass,'public.products'::regclass)
ORDER BY a.attrelid,a.attnum;
SELECT rolname,rolsuper,rolbypassrls FROM pg_roles
WHERE rolname IN ('postgres','service_role','anon','authenticated');
SELECT has_schema_privilege('service_role','public','USAGE') AS service_public_usage;
SELECT has_table_privilege(current_user,'auth.users','REFERENCES') AS operator_can_add_auth_fk;
SELECT r.rolname,c.oid::regclass AS relation,
       has_table_privilege(r.oid,c.oid,'SELECT') AS table_select,
       has_table_privilege(r.oid,c.oid,'INSERT') AS table_insert,
       has_table_privilege(r.oid,c.oid,'UPDATE') AS table_update,
       has_any_column_privilege(r.oid,c.oid,'SELECT') AS column_select,
       has_any_column_privilege(r.oid,c.oid,'INSERT') AS column_insert,
       has_any_column_privilege(r.oid,c.oid,'UPDATE') AS column_update
FROM pg_roles r CROSS JOIN pg_class c
WHERE r.rolname IN ('anon','authenticated','service_role')
 AND c.oid IN ('public.orders'::regclass,'public.order_items'::regclass);

SELECT policyname,tablename,roles,cmd,qual,with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('orders','order_items','inventory_reservations','products');
SELECT t.tgrelid::regclass AS relation,t.tgname,pg_get_triggerdef(t.oid),pg_get_functiondef(t.tgfoid)
FROM pg_trigger t WHERE NOT t.tgisinternal AND t.tgrelid IN ('public.orders'::regclass,
 'public.order_items'::regclass,'public.inventory_reservations'::regclass,'public.products'::regclass);
SELECT ev_class::regclass,rulename,pg_get_ruledef(oid) FROM pg_rewrite
WHERE ev_class='public.orders'::regclass AND rulename<>'_RETURN';
SELECT evtname,evtevent,evtenabled,evttags,evtfoid::regprocedure FROM pg_event_trigger;
SELECT conrelid::regclass,conname,pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid IN ('public.orders'::regclass,'public.order_items'::regclass,'auth.users'::regclass)
 AND contype IN ('p','u','f');
-- pg_depend alone does not enumerate all tables referenced inside PL/pgSQL text.
-- Review the returned function bodies: no SELECT * INSERT shape assumptions,
-- user_id assignments, destructive or incompatible triggers may be assumed safe.
ROLLBACK;
