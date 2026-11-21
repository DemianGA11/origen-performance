import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function load(path, imports, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, ...globals, require(name) { assert.ok(Object.hasOwn(imports, name), `Unexpected import ${name}`); return imports[name]; } });
  return exports;
}
const ownerA = '00000000-0000-4000-8000-000000000001';
const ownerB = '00000000-0000-4000-8000-000000000002';
function route({ user = { id: ownerA }, authError = null, dbError = null, throws = false } = {}) {
  const calls = [];
  let owner;
  const orders = [{ id: 'order-a', user_id: ownerA }, { id: 'order-b', user_id: ownerB }, { id: 'guest', user_id: null }];
  const exports = load('../src/app/api/account/orders/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200, headers: options?.headers }) } },
    '@/lib/supabase-server': { async createSupabaseServerClient() { if (throws) throw new Error('private failure'); return { auth: { async getUser() { return { data: { user }, error: authError }; } } }; } },
    '@/lib/supabase-admin': { supabaseAdmin: { from(table) { calls.push(table); return {
      select(fields) { calls.push(fields); return this; },
      eq(column, value) { assert.equal(column, 'user_id'); owner = value; return this; },
      order(column, options) { assert.equal(column, 'created_at'); assert.equal(options.ascending, false); return this; },
      async limit(count) { assert.equal(count, 50); return { data: orders.filter(order => order.user_id === owner), error: dbError }; },
    }; } } },
  });
  return { get: exports.GET, calls, owner: () => owner };
}
test('history requires verified Auth and never queries orders for a guest or failed Auth', async () => {
  for (const options of [{ user: null }, { authError: { message: 'invalid session' } }]) {
    const app = route(options);
    assert.equal((await app.get()).status, 401);
    assert.equal(app.calls.length, 0);
  }
});
test('history uses only server owner; ignores arbitrary caller owner and order IDs', async () => {
  const app = route();
  const response = await app.get({ nextUrl: new URL(`https://fixture.invalid/api/account/orders?user_id=${ownerB}&order_id=order-b`) });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.orders.map(order => order.id), ['order-a']);
  assert.equal(app.owner(), ownerA);
  assert.equal(response.headers['Cache-Control'], 'private, no-store');
  assert.ok(app.calls[1].includes('order_items(product_name, quantity)'));
  assert.ok(!/customer_email|shipping|stripe_session|customer_phone/.test(app.calls[1]));
});
test('a second user sees their own order only; guest orders are never matched by email', async () => {
  const app = route({ user: { id: ownerB, email: 'same@example.invalid' } });
  assert.deepEqual((await app.get()).body.orders.map(order => order.id), ['order-b']);
});
test('query failures produce a safe error and private no-store response', async () => {
  for (const options of [{ dbError: { message: 'private database failure' } }, { throws: true }]) {
    const response = await route(options).get();
    assert.equal(response.status, 503);
    assert.equal(response.body.orders, undefined);
    assert.ok(!JSON.stringify(response.body).includes('private'));
    assert.equal(response.headers['Cache-Control'], 'private, no-store');
  }
});
function nodes(node) { return Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : []; }
function text(node) { return Array.isArray(node) ? node.map(text).join('') : node?.props ? text(node.props.children) : String(node ?? ''); }
function history(responses) {
  const states = [];
  const cleanups = [];
  let cursor = 0;
  let deps;
  let effect;
  let fetchCount = 0;
  const component = load('../src/components/account/OrderHistory.tsx', {
    'react/jsx-runtime': jsx,
    react: {
      useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], update => { states[index] = typeof update === 'function' ? update(states[index]) : update; }]; },
      useEffect(callback, nextDeps) { if (!deps || nextDeps.some((value, index) => value !== deps[index])) { deps = nextDeps; effect = callback; } },
    },
  }, { AbortController, async fetch(path, options) { assert.equal(path, '/api/account/orders'); assert.equal(options.cache, 'no-store'); assert.ok(options.signal); const response = responses[fetchCount++]; if (response instanceof Error) throw response; return { ok: response.ok ?? true, async json() { return response; } }; } }).default;
  return {
    render() { cursor = 0; return component(); },
    async settle() { if (effect) { cleanups.push(effect()); effect = null; } for (let i = 0; i < 8; i++) await Promise.resolve(); },
    close() { cleanups.forEach(cleanup => cleanup()); },
  };
}
test('history renders loading followed by empty state without historical guest attribution', async () => {
  const app = history([{ orders: [] }]);
  assert.ok(text(app.render()).includes('Cargando'));
  await app.settle();
  const output = text(app.render());
  assert.ok(output.includes('no tienes pedidos'));
  assert.ok(output.includes('no se asignan por correo'));
  app.close();
});
test('history renders products, total, date and independent payment/preparation labels', async () => {
  const app = history([{ orders: [{ id: 'fixture-order', created_at: '2026-11-20T12:00:00Z', total_amount: 3900, currency: 'mxn', payment_status: 'paid', order_status: 'pending', order_items: [{ product_name: 'Fixture honey', quantity: 1 }] }] }]);
  app.render(); await app.settle();
  const output = text(app.render());
  for (const expected of ['fixture-order', 'Fixture honey', '39.00 MXN', 'Pago: Pagado', 'Pedido: Pendiente de preparaci\u00f3n']) assert.ok(output.includes(expected), expected);
  assert.ok(nodes(app.render()).some(node => node.type === 'time' && node.props.dateTime === '2026-11-20T12:00:00Z'));
  app.close();
});
test('history supports safe error and retry without showing stale orders', async () => {
  const app = history([{ ok: false }, { orders: [] }]);
  app.render(); await app.settle();
  const error = app.render();
  assert.ok(nodes(error).some(node => node.props.role === 'alert'));
  nodes(error).find(node => node.type === 'button').props.onClick();
  assert.ok(text(app.render()).includes('Cargando'));
  await app.settle();
  assert.ok(text(app.render()).includes('no tienes pedidos'));
  app.close();
});
