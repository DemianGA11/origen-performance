-- Assertions execute inside the transaction opened by reversible-prefix.sql.
GRANT SELECT ON pg_temp.order_history_probe TO service_role;
SET LOCAL ROLE service_role;
INSERT INTO public.orders(id,total_amount,user_id,customer_email)
SELECT a_id,100,user_a,'order-history-probe@example.invalid' FROM pg_temp.order_history_probe
UNION ALL SELECT b_id,100,user_b,'order-history-probe@example.invalid' FROM pg_temp.order_history_probe;
-- Legacy guest INSERT shape remains valid, without supplying user_id.
INSERT INTO public.orders(id,total_amount,customer_email)
SELECT guest_id,100,'order-history-probe@example.invalid' FROM pg_temp.order_history_probe;
UPDATE public.orders SET customer_name='FICTITIOUS ORDER HISTORY PROBE'
WHERE id=(SELECT a_id FROM pg_temp.order_history_probe);
DO $assert_rows$
DECLARE change record; error_message text;
BEGIN
 IF (SELECT count(*) FROM public.orders WHERE user_id=(SELECT user_a FROM pg_temp.order_history_probe)) <> 1
 OR (SELECT count(*) FROM public.orders WHERE user_id=(SELECT user_b FROM pg_temp.order_history_probe)) <> 1
 OR EXISTS (SELECT 1 FROM public.orders WHERE id IN (SELECT guest_id FROM pg_temp.order_history_probe UNION ALL SELECT historical_id FROM pg_temp.order_history_probe) AND user_id IS NOT NULL) THEN
   RAISE EXCEPTION 'FAIL_OWNER_GUEST_OR_HISTORICAL_ROWS'; END IF;
 FOR change IN
   SELECT historical_id AS id,user_a AS new_owner FROM pg_temp.order_history_probe
   UNION ALL SELECT a_id,user_b FROM pg_temp.order_history_probe
   UNION ALL SELECT a_id,NULL::uuid FROM pg_temp.order_history_probe
 LOOP
   BEGIN
     UPDATE public.orders SET user_id=change.new_owner WHERE id=change.id;
     RAISE EXCEPTION 'FAIL_EXPECTED_OWNER_IMMUTABILITY';
   EXCEPTION WHEN SQLSTATE '23514' THEN
     GET STACKED DIAGNOSTICS error_message=MESSAGE_TEXT;
     IF error_message IS DISTINCT FROM 'ORDER_OWNER_IMMUTABLE' THEN
       RAISE EXCEPTION 'FAIL_UNEXPECTED_OWNER_REJECTION: %',error_message; END IF;
   END;
 END LOOP;
 RAISE NOTICE 'PASS: A/B ownership predicates, same-email separation, guest/historical NULL, existing UPDATE and immutable owner';
END;
$assert_rows$;
RESET ROLE;

DO $assert_fk$
DECLARE missing_user uuid:=gen_random_uuid(); rejected_constraint text;
BEGIN
 IF EXISTS (SELECT 1 FROM auth.users WHERE id=missing_user) THEN RAISE EXCEPTION 'FAIL_RANDOM_FIXTURE_COLLISION'; END IF;
 BEGIN
   INSERT INTO public.orders(id,total_amount,user_id) VALUES(gen_random_uuid(),100,missing_user);
   RAISE EXCEPTION 'FAIL_EXPECTED_FOREIGN_KEY_REJECTION';
 EXCEPTION WHEN SQLSTATE '23503' THEN
   GET STACKED DIAGNOSTICS rejected_constraint=CONSTRAINT_NAME;
   IF rejected_constraint IS DISTINCT FROM 'orders_user_id_fkey' THEN
     RAISE EXCEPTION 'FAIL_UNEXPECTED_FOREIGN_KEY: %',rejected_constraint; END IF;
 END;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.orders'::regclass
                AND conname='orders_user_id_fkey' AND confdeltype='r') THEN
   RAISE EXCEPTION 'FAIL_ACCOUNT_DELETION_MUST_BE_RESTRICTED'; END IF;
 RAISE NOTICE 'PASS: FK rejects unknown users; account deletion is structurally RESTRICT';
END;
$assert_fk$;

-- Test this trigger specifically without granting any access on real tables.
CREATE TEMP TABLE order_history_guard_probe(user_id uuid) ON COMMIT DROP;
CREATE TRIGGER owner_guard_probe BEFORE INSERT ON pg_temp.order_history_guard_probe
FOR EACH ROW EXECUTE FUNCTION public.guard_order_user_association();
GRANT INSERT ON pg_temp.order_history_guard_probe TO authenticated;
SET LOCAL ROLE authenticated;
DO $assert_ordinary$
DECLARE error_message text;
BEGIN
 BEGIN
   INSERT INTO pg_temp.order_history_guard_probe(user_id) VALUES(gen_random_uuid());
   RAISE EXCEPTION 'FAIL_EXPECTED_SERVER_ONLY_OWNER';
 EXCEPTION WHEN SQLSTATE '42501' THEN
   GET STACKED DIAGNOSTICS error_message=MESSAGE_TEXT;
   IF error_message IS DISTINCT FROM 'ORDER_OWNER_SERVER_ONLY' THEN
     RAISE EXCEPTION 'FAIL_UNEXPECTED_PERMISSION_REJECTION: %',error_message; END IF;
 END;
 RAISE NOTICE 'PASS: exact server-only owner trigger rejection; SET ROLE is not a real Auth login test';
END;
$assert_ordinary$;
RESET ROLE;
ROLLBACK;

-- Verify after actual ROLLBACK, in the same persistent psql connection.
SELECT md5(jsonb_build_object(
 'orders',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id),'[]') FROM public.orders x),
 'items',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id),'[]') FROM public.order_items x),
 'reservations',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id),'[]') FROM public.inventory_reservations x),
 'products',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id),'[]') FROM public.products x)
)::text)=:'probe_before_rows' AS probe_rows_restored \gset
SELECT md5(coalesce(string_agg(pg_get_functiondef(p.oid)||p.proowner::text||coalesce(p.proacl::text,''),'|' ORDER BY p.oid),''))=:'probe_before_rpcs' AS probe_rpcs_restored
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('reserve_inventory_for_order','link_stripe_session_to_order','confirm_stripe_order','expire_stripe_order') \gset
SELECT NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.orders'::regclass AND attname='user_id' AND NOT attisdropped)
 AND to_regprocedure('public.guard_order_user_association()') IS NULL
 AND to_regclass('public.orders_user_created_at_idx') IS NULL
 AND NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.orders'::regclass AND conname='orders_user_id_fkey')
 AND NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.orders'::regclass AND tgname='orders_user_association_guard') AS probe_schema_restored \gset
\if :probe_rows_restored
\else
  \echo FAIL: data snapshot differs; investigate concurrent Dev activity
  \quit 3
\endif
\if :probe_rpcs_restored
\else
  \echo FAIL: existing RPC definition/owner/ACL changed
  \quit 3
\endif
\if :probe_schema_restored
\else
  \echo FAIL: migration objects remain after rollback
  \quit 3
\endif
\echo PASS: STRUCTURAL ONLY; migration and fixtures rolled back; data and existing RPC restored; financial RPC not executed
