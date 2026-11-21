\set ON_ERROR_STOP on
-- REVIEW THIS FILE. Existing Auth test users are read-only parents, not modified.
-- Never run on Production. No login/authenticity assertion is made by SET ROLE.
-- Informational inventory only: absent Stripe RPC do NOT block this structural probe.
SELECT w.name, count(p.oid) AS public_overload_count,
       CASE WHEN count(p.oid)=0 THEN 'MISSING: structural probe may continue; financial validation unavailable'
            ELSE 'PRESENT: preserved only, not executed' END AS scope
FROM (VALUES ('reserve_inventory_for_order'),('link_stripe_session_to_order'),
             ('confirm_stripe_order'),('expire_stripe_order')) w(name)
LEFT JOIN pg_namespace n ON n.nspname='public'
LEFT JOIN pg_proc p ON p.pronamespace=n.oid AND p.proname=w.name
GROUP BY w.name ORDER BY w.name;
SELECT md5(jsonb_build_object(
 'orders',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id),'[]') FROM public.orders x),
 'items',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id),'[]') FROM public.order_items x),
 'reservations',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id),'[]') FROM public.inventory_reservations x),
 'products',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.id),'[]') FROM public.products x)
)::text) AS probe_before_rows \gset
SELECT md5(coalesce(string_agg(pg_get_functiondef(p.oid)||p.proowner::text||coalesce(p.proacl::text,''),'|' ORDER BY p.oid),'')) AS probe_before_rpcs
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('reserve_inventory_for_order','link_stripe_session_to_order','confirm_stripe_order','expire_stripe_order') \gset

BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
SET LOCAL idle_in_transaction_session_timeout='2min';
CREATE TEMP TABLE order_history_probe ON COMMIT DROP AS SELECT
 :'probe_user_a'::uuid AS user_a, :'probe_user_b'::uuid AS user_b,
 gen_random_uuid() AS historical_id, gen_random_uuid() AS a_id,
 gen_random_uuid() AS b_id, gen_random_uuid() AS guest_id;
DO $probe_preflight$
BEGIN
 IF current_user <> 'postgres' OR current_setting('server_version_num')::int NOT BETWEEN 170000 AND 179999 THEN
   RAISE EXCEPTION 'PROBE_REQUIRES_POSTGRES_17_AND_POSTGRES_ROLE'; END IF;
 IF (SELECT user_a=user_b FROM pg_temp.order_history_probe)
 OR (SELECT count(*) FROM auth.users u WHERE u.id IN (SELECT user_a FROM pg_temp.order_history_probe UNION ALL SELECT user_b FROM pg_temp.order_history_probe)) <> 2 THEN
   RAISE EXCEPTION 'PROBE_REQUIRES_TWO_EXISTING_DISTINCT_FICTITIOUS_DEV_USERS'; END IF;
 IF NOT pg_has_role(current_user,'service_role','SET') OR NOT pg_has_role(current_user,'authenticated','SET') THEN
   RAISE EXCEPTION 'PROBE_REQUIRED_SET_ROLE_NOT_AVAILABLE'; END IF;
 IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.orders'::regclass AND attname='user_id' AND NOT attisdropped) THEN
   RAISE EXCEPTION 'PROBE_REQUIRES_UNINSTALLED_MIGRATION'; END IF;
 -- Fail closed on orders triggers not covered by the reviewed Dev migrations.
 IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.orders'::regclass AND NOT tgisinternal
            AND tgname <> 'orders_payment_provider_immutable')
 OR EXISTS (SELECT 1 FROM pg_rewrite WHERE ev_class='public.orders'::regclass AND rulename <> '_RETURN') THEN
   RAISE EXCEPTION 'PROBE_REVIEW_UNEXPECTED_ORDER_TRIGGER_OR_RULE'; END IF;
 IF EXISTS (
   SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
   WHERE t.tgrelid='public.orders'::regclass AND t.tgname='orders_payment_provider_immutable'
   AND (p.oid IS DISTINCT FROM to_regprocedure('public.prevent_order_payment_provider_change()')
        OR p.prosecdef OR p.proowner <> 'postgres'::regrole::oid
        OR t.tgtype <> 19 OR t.tgenabled <> 'O'
        OR t.tgattr::text IS DISTINCT FROM (SELECT attnum::text FROM pg_attribute WHERE attrelid='public.orders'::regclass AND attname='payment_provider' AND NOT attisdropped)
        OR regexp_replace(p.prosrc,'\s','','g') IS DISTINCT FROM
           'BEGINIFOLD.payment_providerISDISTINCTFROMNEW.payment_providerTHENRAISEEXCEPTION''ORDER_PAYMENT_PROVIDER_IMMUTABLE''USINGERRCODE=''42501'';ENDIF;RETURNNEW;END;')
 ) THEN RAISE EXCEPTION 'PROBE_PROVIDER_GUARD_DIFFERS_FROM_REVIEWED_DEV'; END IF;
END;
$probe_preflight$;
-- This own historical fixture exists BEFORE the new column; no real order is used.
INSERT INTO public.orders(id,total_amount,checkout_fingerprint)
SELECT historical_id,100,'ORDER_HISTORY_REVERSIBLE_PROBE' FROM pg_temp.order_history_probe;
