import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Handlers only, allowlisted SDK doubles: no environment files, network or SQL.
function load(path, imports, env = {}) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, process: { env }, console: { error() {}, log() {} },
    require(name) { assert.ok(Object.hasOwn(imports, name), name); return imports[name]; } });
  return exports;
}
const session = (changes = {}) => ({ id: "cs_live_sanitized_1", mode: "payment", status: "complete",
  payment_status: "paid", livemode: true, metadata: { source: "origen-performance", order_id: "order-fixture" },
  amount_total: 100, currency: "mxn", ...changes });
const common = {
  "@/lib/preview-runtime": { isPreviewEnvironment: () => false },
  "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
};
function statusSetup(s = session()) {
  const calls = [];
  const handler = load("../src/app/api/checkout/status/route.ts", { ...common,
    "@/lib/stripe": { stripe: { checkout: { sessions: { async retrieve(id) { calls.push(id); return s; } } } } },
    "@/lib/supabase-admin": { supabaseAdmin: { from(table) {
      return { select() { return this; }, eq() {
        if (table === "orders") return { async maybeSingle() { return { data: { id: "order-fixture", payment_status: "paid", total_amount: 100, currency: "mxn" }, error: null }; } };
        return Promise.resolve({ data: [{ quantity: 1, unit_price: 100 }], error: null });
      } };
    } } },
  });
  return { calls, get: (id = s.id) => handler.GET({ nextUrl: { searchParams: new URLSearchParams({ session_id: id }) } }) };
}
for (const live of [true, false]) {
  test(`status accepts ${live ? "Live" : "Test"} and reports actual session mode`, async () => {
    const r = await statusSetup(session({ id: live ? "cs_live_sanitized" : "cs_test_sanitized", livemode: live })).get();
    assert.equal(r.status, 200); assert.equal(r.body.livemode, live);
    assert.equal(r.body.paid, true); assert.equal(r.body.orderConfirmed, true);
  });
}
test("malformed session IDs reject before calling Stripe", async () => {
  const s = statusSetup(); assert.equal((await s.get("not_a_session")).status, 400); assert.equal(s.calls.length, 0);
});
test("other-source sessions cannot produce an ORIGEN result", async () => {
  assert.equal((await statusSetup(session({ metadata: { source: "other" } })).get()).status, 404);
});
test("a pending session never confirms an order", async () => {
  const r = await statusSetup(session({ status: "open", payment_status: "unpaid" })).get();
  assert.equal(r.body.paid, false); assert.equal(r.body.orderConfirmed, false);
});
function webhookSetup({ s = session(), signatureValid = true, eventMode = s.livemode, eventType = "checkout.session.completed" } = {}) {
  const calls = [];
  const stripe = { webhooks: { constructEvent() {
    if (!signatureValid) throw Error("DO_NOT_LOG_SIGNATURE_OR_PAYLOAD");
    return { type: eventType, livemode: eventMode, data: { object: s } };
  } }, checkout: { sessions: { async listLineItems() { return { has_more: false, data: [{
    price: { product: { metadata: { origen_product_id: "7" } } }, quantity: 1,
    description: "FICTITIOUS", currency: "mxn", amount_total: 100,
  }] }; } } } };
  const handler = load("../src/app/api/webhooks/stripe/route.ts", { ...common,
    stripe: {}, "@/lib/stripe": { stripe }, "@/lib/supabase-admin": { supabaseAdmin: {
      async rpc(name, args) { calls.push({ name, args }); return { error: null }; },
    } },
  }, { STRIPE_WEBHOOK_SECRET: "FAKE_SIGNING_SECRET_ONLY" });
  return { calls, post: () => handler.POST({ headers: { get: () => "FAKE_SIGNATURE" }, text: async () => "fixture" }) };
}
test("invalid webhook signature cannot reach confirmation", async () => {
  const w = webhookSetup({ signatureValid: false });
  assert.equal((await w.post()).status, 400); assert.equal(w.calls.length, 0);
});
for (const [label, changes] of [
  ["unpaid", { s: session({ payment_status: "unpaid" }) }],
  ["incomplete", { s: session({ status: "open" }) }],
  ["non-payment", { s: session({ mode: "setup" }) }],
  ["mode mismatch", { eventMode: false }],
]) {
  test(`${label} webhook cannot confirm`, async () => {
    const w = webhookSetup(changes); assert.equal((await w.post()).status, 200); assert.equal(w.calls.length, 0);
  });
}
test("paid Live webhook and its duplicate forward identical identifiers and terms to the idempotent RPC", async () => {
  const w = webhookSetup(); await w.post(); await w.post();
  assert.equal(w.calls.length, 2); assert.equal(w.calls[0].name, "confirm_stripe_order");
  assert.equal(w.calls[0].args.p_order_id, "order-fixture"); assert.equal(w.calls[0].args.p_stripe_session_id, "cs_live_sanitized_1");
  assert.equal(w.calls[0].args.p_total_amount, 100);
  assert.equal(JSON.stringify(w.calls[0]), JSON.stringify(w.calls[1]));
  // Does not execute PostgreSQL or prove installed RPC idempotency.
});
test("expiry still uses the original expiry RPC", async () => {
  const w = webhookSetup({ eventType: "checkout.session.expired", s: session({ status: "expired", payment_status: "unpaid" }) });
  assert.equal((await w.post()).status, 200); assert.equal(w.calls[0].name, "expire_stripe_order");
});
test("checkout UI permits both session modes, restricts the redirect and exposes only Stripe", () => {
  const source = readFileSync(new URL("../src/app/checkout/page.tsx", import.meta.url), "utf8");
  assert.ok(source.includes("test|live")); assert.ok(source.includes('https://checkout.stripe.com'));
  assert.doesNotMatch(source, /Mercado Pago|mercadopago|Transferencia bancaria|Esta tienda no procesar/);
  const result = readFileSync(new URL("../src/app/checkout/resultado/page.tsx", import.meta.url), "utf8");
  assert.ok(result.includes("result.livemode"));
});
test("Production Stripe initialization requires a Live server key, while Test remains available outside Production", () => {
  let constructed = 0;
  const imports = { "server-only": {}, "./preview-runtime": { isPreviewEnvironment: () => false },
    stripe: { default: class { constructor() { constructed += 1; } } } };
  assert.throws(() => load("../src/lib/stripe.ts", imports, { VERCEL_ENV: "production", STRIPE_SECRET_KEY: "sk_test_FAKE" }), /requiere una clave Live/);
  assert.equal(constructed, 0);
  load("../src/lib/stripe.ts", imports, { VERCEL_ENV: "production", STRIPE_SECRET_KEY: "sk_live_FAKE" });
  load("../src/lib/stripe.ts", imports, { STRIPE_SECRET_KEY: "sk_test_FAKE" });
  assert.equal(constructed, 2);
});
