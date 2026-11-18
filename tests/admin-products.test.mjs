import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function loadPage(kind, options = {}) {
  const file = kind === 'create' ? 'nuevo/page.tsx' : '[id]/editar/page.tsx';
  const source = readFileSync(new URL(`../src/app/admin/productos/${file}`, import.meta.url), 'utf8');
  const calls = [];
  const paths = [];
  const client = {
    auth: { async getUser() { return { data: { user: options.loggedOut ? null : { id: 'admin-fixture' } } }; } },
    from(table) { assert.equal(table, 'profiles'); return { select() { return this; }, eq() { return this; }, async single() { return { data: { role: options.role ?? 'admin' } }; } }; },
    async rpc(name, args) { calls.push({ name, args }); return { error: options.failRpc === name ? { message: 'fixture failure' } : null }; },
  };
  const imports = {
    'react/jsx-runtime': jsx,
    'next/link': { default: 'a' },
    'next/navigation': { redirect(path) { throw new Error(`redirect:${path}`); }, notFound() { throw new Error('notFound'); } },
    'next/cache': { revalidatePath(path) { paths.push(path); } },
    '@/lib/supabase-server': { async createSupabaseServerClient() { return client; } },
  };
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code + `\nexports.action = ${kind === 'create' ? 'createProduct' : 'updateProduct'};`, {
    exports, console: { error() {} }, require(name) { assert.ok(name in imports, `Unexpected dependency ${name}`); return imports[name]; },
  });
  return { action: exports.action, calls, paths };
}
function form(overrides = {}) {
  const values = { productId: '8', name: 'Producto de demostración', category: 'NUTRITION', packaging: 'jar', price: '39.00', size: '100 g', description: 'Descripción', longDescription: 'Detalle', ingredients: 'Miel\n\n Sal ', ...overrides };
  return { get(name) { return values[name] ?? null; } };
}
test('creation uses existing individual RPC arguments, never stock, status or JSONB', async () => {
  const app = loadPage('create');
  await assert.rejects(app.action(form()), /redirect:\/admin\/productos$/);
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].name, 'admin_create_product');
  assert.deepEqual(Object.keys(app.calls[0].args).sort(), ['p_category', 'p_description', 'p_name', 'p_packaging', 'p_price', 'p_size']);
  assert.equal(app.calls[0].args.p_price, 39);
  assert.ok(app.paths.includes('/shop'));
});
test('editing calls existing info and details RPCs without inventory writes', async () => {
  const app = loadPage('edit');
  await assert.rejects(app.action(form()), /redirect:\/admin\/productos\/8$/);
  assert.deepEqual(app.calls.map(call => call.name), ['admin_update_product_info', 'admin_update_product_details']);
  assert.equal(app.calls[0].args.p_product_id, 8);
  assert.deepEqual(Array.from(app.calls[1].args.p_ingredients), ['Miel', 'Sal']);
  assert.ok(app.paths.includes('/products/8'));
});
for (const kind of ['create', 'edit']) {
  test(`${kind}: unauthenticated and non-admin calls cannot write`, async () => {
    for (const options of [{ loggedOut: true }, { role: 'customer' }]) {
      const app = loadPage(kind, options);
      await assert.rejects(app.action(form()), /redirect:\/login|administrador/);
      assert.equal(app.calls.length, 0);
    }
  });
  test(`${kind}: invalid input is rejected before RPC`, async () => {
    for (const invalid of [{ name: '' }, { name: 'x'.repeat(151) }, { price: 'NaN' }, { price: '-1' }, { price: '100000000' }, { packaging: 'invalid' }]) {
      const app = loadPage(kind);
      await assert.rejects(app.action(form(invalid)), /datos/);
      assert.equal(app.calls.length, 0);
    }
  });
}
test('basic edit failure does not proceed to details; details failure is explicitly partial', async () => {
  const first = loadPage('edit', { failRpc: 'admin_update_product_info' });
  await assert.rejects(first.action(form()), /No se pudo actualizar/);
  assert.equal(first.calls.length, 1);
  const second = loadPage('edit', { failRpc: 'admin_update_product_details' });
  await assert.rejects(second.action(form()), /información básica/);
  assert.equal(second.calls.length, 2);
  assert.equal(second.paths.length, 0);
});
test('storage image allowlist is deployment-specific, HTTPS and bucket-scoped', () => {
  const source = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, URL, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.supabase.co' } } });
  const pattern = exports.default.images.remotePatterns[0];
  assert.equal(pattern.hostname, 'fixture.supabase.co');
  assert.equal(pattern.protocol, 'https');
  assert.equal(pattern.pathname, '/storage/v1/object/public/product-images/**');
  assert.equal(pattern.search, '');
});

test('image upload uses public product-images bucket and individual RPC arguments', async () => {
  const source = readFileSync(new URL('../src/app/admin/productos/[id]/ImageUploader.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const calls = [];
  const exports = {};
  const client = {
    storage: { from(bucket) { assert.equal(bucket, 'product-images'); return {
      async upload(path, _file, options) { calls.push({ path, options }); return { error: null }; },
      getPublicUrl(path) { return { data: { publicUrl: `https://fixture.invalid/${path}` } }; },
    }; } },
    async rpc(name, args) { calls.push({ name, args }); return { error: null }; },
  };
  const imports = { 'react/jsx-runtime': jsx, react: { useState(initial) { return [initial, () => {}]; } }, '@/lib/supabase': { supabase: client } };
  vm.runInNewContext(code, { exports, crypto: { randomUUID: () => 'fixture-image' }, console: { error() {} }, require(name) { assert.ok(name in imports); return imports[name]; } });
  const tree = exports.default({ productId: 8, initialImages: [] });
  function find(node) {
    if (Array.isArray(node)) return node.map(find).find(Boolean);
    if (!node?.props) return null;
    return node.type === 'input' ? node : find(node.props.children);
  }
  const input = find(tree);
  await input.props.onChange({ target: { files: [{ type: 'image/svg+xml', size: 20 }], value: 'fixture' } });
  assert.equal(calls.length, 0);
  await input.props.onChange({ target: { files: [{ type: 'image/png', size: 6 * 1024 * 1024 }], value: 'fixture' } });
  assert.equal(calls.length, 0);
  await input.props.onChange({ target: { files: [{ type: 'image/png', size: 1024 }], value: 'fixture' } });
  assert.equal(calls[0].path, '8/fixture-image.png');
  assert.equal(calls[0].options.upsert, false);
  assert.equal(calls[1].name, 'admin_update_product_images');
  assert.equal(calls[1].args.p_product_id, 8);
  assert.deepEqual(Array.from(calls[1].args.p_images), ['https://fixture.invalid/8/fixture-image.png']);
});

test('products without uploaded images render a placeholder in catalog and gallery', () => {
  for (const file of ['ProductVisual.tsx', 'ProductGallery.tsx']) {
    const source = readFileSync(new URL(`../src/components/product/${file}`, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const exports = {};
    const imports = { 'react/jsx-runtime': jsx, 'next/image': { default: 'image' }, react: { useState: initial => [initial, () => {}], useEffect() {} }, 'react-dom': { createPortal() { throw new Error('Unexpected portal'); } } };
    vm.runInNewContext(code, { exports, require(name) { assert.ok(name in imports); return imports[name]; } });
    const result = exports.default({ product: { images: [] } });
    assert.equal(result.type, 'div');
    assert.equal(result.props.children, 'Fotografía pendiente');
  }
});
