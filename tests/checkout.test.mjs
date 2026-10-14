import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Evaluate only the handler with allowlisted mocks. Real clients, environment
// files, Next.js startup and network APIs are never loaded into this sandbox.
const source = readFileSync(new URL("../src/app/api/checkout/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const attemptId = "12345678-1234-4234-8234-123456789abc";

function setup({ catalog, catalogError = null, reservationError = null } = {}) {
  const product = { id: 101, name: "Producto nuevo de Supabase", price: 123.45, is_active: true, stock: 10 };
  const rows = catalog ?? [product];
  const calls = { inserts: [], rpc: [], sessions: [], retrieves: [], queries: [] };
  let order = null;
  let reservations = [];
  const session = {
    id: "cs_test_mock", url: "https://checkout.invalid/mock", status: "open",
    metadata: { order_id: "order-mock" }, expires_at: 2000000000,
  };
  const supabaseAdmin = {
    from(table) {
      let inserted;
      const query = {
        select() { return query; },
        in(column, ids) { calls.queries.push({ table, column, ids }); return query; },
        eq() { return query; },
        returns() { return Promise.resolve({ data: rows, error: catalogError }); },
        maybeSingle() { return Promise.resolve({ data: order, error: null }); },
        insert(values) { inserted = values; calls.inserts.push(values); return query; },
        single() {
          order = { ...inserted, id: "order-mock", stripe_session_id: null };
          return Promise.resolve({ data: { id: order.id }, error: null });
        },
        then(resolve, reject) {
          assert.equal(table, "inventory_reservations");
          return Promise.resolve({ data: reservations, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
    async rpc(name, args) {
      calls.rpc.push({ name, args });
      if (name === "reserve_inventory_for_order") {
        if (reservationError) return { error: reservationError };
        reservations = args.p_items.map((item) => ({ ...item, status: "reserved", expires_at: "2099-01-01T00:00:00Z" }));
      } else if (name === "link_stripe_session_to_order") {
        order.stripe_session_id = args.p_stripe_session_id;
      } else {
        throw new Error(`Unexpected RPC: ${name}`);
      }
      return { error: null };
    },
  };
  const stripe = { checkout: { sessions: {
    async create(args, options) { calls.sessions.push({ args, options }); return session; },
    async retrieve(id) { calls.retrieves.push(id); return session; },
  } } };
  const imports = {
    "next/server": { NextResponse: { json: (body, options) => ({ status: options?.status ?? 200, body }) } },
    "@/lib/supabase-admin": { supabaseAdmin },
    "@/lib/stripe": { stripe },
    // Historical fixture reproduces the old six-product allowlist without
    // importing the actual catalog. No new ID exists here.
    "@/data/products": { products: [1, 2, 3, 4, 5, 6].map((id) => ({ id })) },
    "node:crypto": { createHash },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Forbidden import: ${name}`);
      return imports[name];
    },
    console: { error() {} },
  }, { timeout: 1000 });
  async function checkout(items = [{ productId: rows[0]?.id ?? 101, quantity: 2 }]) {
    return exports.POST({
      headers: { get: () => attemptId }, nextUrl: { origin: "https://shop.invalid" },
      json: async () => ({
        items,
        customer: { firstName: "Cliente", lastName: "Prueba", email: "cliente@example.invalid", phone: "5512345678" },
        shipping: { address: "Direccion simulada", city: "Ciudad", state: "Estado", postalCode: "12345" },
      }),
    });
  }
  return { checkout, calls, product };
}

test("a new Supabase product prepares checkout using only database name and price", async () => {
  const { checkout, calls } = setup();
  const response = await checkout([{ productId: 101, quantity: 2, price: 1, name: "Manipulado" }]);
  assert.equal(response.status, 200);
  assert.equal(response.body.sessionId, "cs_test_mock");
  assert.deepEqual(Array.from(calls.queries[0].ids), [101]);
  const line = calls.sessions[0].args.line_items[0];
  assert.equal(line.price_data.product_data.name, "Producto nuevo de Supabase");
  assert.equal(line.price_data.product_data.metadata.origen_product_id, "101");
  assert.equal(line.price_data.unit_amount, 12345);
  assert.equal(line.price_data.currency, "mxn");
  assert.equal(line.quantity, 2);
  assert.equal(calls.inserts[0].total_amount, 24690);
  assert.equal(calls.sessions[0].options.idempotencyKey, attemptId);
  assert.deepEqual(calls.rpc.map((call) => call.name), ["reserve_inventory_for_order", "link_stripe_session_to_order"]);
  assert.equal(calls.rpc[0].args.p_items[0].product_id, 101);
  assert.equal(calls.rpc[0].args.p_items[0].quantity, 2);
});

test("existing IDs also use Supabase name and price", async () => {
  const { checkout, calls } = setup({ catalog: [{ id: 1, name: "Nombre actualizado", price: 19.99, is_active: true, stock: 2 }] });
  assert.equal((await checkout()).status, 200);
  assert.equal(calls.sessions[0].args.line_items[0].price_data.product_data.name, "Nombre actualizado");
  assert.equal(calls.sessions[0].args.line_items[0].price_data.unit_amount, 1999);
});

for (const [label, changes, status] of [
  ["inactive", { is_active: false }, 409],
  ["insufficient stock", { stock: 1 }, 409],
  ["invalid stock", { stock: 1.5 }, 409],
  ["zero price", { price: 0 }, 400],
  ["negative price", { price: -10 }, 400],
  ["nonfinite price", { price: Infinity }, 400],
  ["unsafe price", { price: Number.MAX_SAFE_INTEGER }, 400],
  ["Pre-Performance even when active and stocked", { id: 6 }, 400],
]) {
  test(`rejects ${label} before creating orders or reserving inventory`, async () => {
    const base = setup().product;
    const { checkout, calls } = setup({ catalog: [{ ...base, ...changes }] });
    assert.equal((await checkout()).status, status);
    assert.equal(calls.inserts.length, 0);
    assert.equal(calls.rpc.length, 0);
    assert.equal(calls.sessions.length, 0);
  });
}

for (const quantity of [0, -1, 1.5, 21]) {
  test(`rejects quantity ${quantity}`, async () => {
    const { checkout, calls } = setup();
    assert.equal((await checkout([{ productId: 101, quantity }])).status, 400);
    assert.equal(calls.inserts.length, 0);
    assert.equal(calls.rpc.length, 0);
    assert.equal(calls.sessions.length, 0);
  });
}

test("rejects missing products and catalog errors without side effects", async () => {
  for (const [options, status] of [[{ catalog: [] }, 400], [{ catalogError: { message: "Mock failure" } }, 500]]) {
    const { checkout, calls } = setup(options);
    assert.equal((await checkout()).status, status);
    assert.equal(calls.inserts.length, 0);
    assert.equal(calls.rpc.length, 0);
    assert.equal(calls.sessions.length, 0);
  }
});

test("rejects duplicate products before querying Supabase", async () => {
  const { checkout, calls } = setup();
  assert.equal((await checkout([{ productId: 101, quantity: 1 }, { productId: 101, quantity: 1 }])).status, 400);
  assert.equal(calls.queries.length, 0);
  assert.equal(calls.inserts.length, 0);
});

test("reservation failure prevents Stripe session creation", async () => {
  const { checkout, calls } = setup({ reservationError: { message: "Mock conflict" } });
  assert.equal((await checkout()).status, 409);
  assert.equal(calls.inserts.length, 1);
  assert.equal(calls.rpc.length, 1);
  assert.equal(calls.sessions.length, 0);
});

test("repeating the same attempt reuses the session without a second order or reservation", async () => {
  const { checkout, calls } = setup();
  assert.equal((await checkout()).status, 200);
  assert.equal((await checkout()).status, 200);
  assert.equal(calls.inserts.length, 1);
  assert.equal(calls.sessions.length, 1);
  assert.equal(calls.rpc.length, 2);
  assert.deepEqual(calls.retrieves, ["cs_test_mock"]);
});

test("changing an existing attempt remains a conflict", async () => {
  const { checkout, calls } = setup();
  assert.equal((await checkout()).status, 200);
  assert.equal((await checkout([{ productId: 101, quantity: 3 }])).status, 409);
  assert.equal(calls.inserts.length, 1);
  assert.equal(calls.sessions.length, 1);
});
