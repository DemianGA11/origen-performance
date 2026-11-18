import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function load(path, imports, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) { assert.ok(name in imports, `Unexpected import: ${name}`); return imports[name]; }, ...globals });
  return exports;
}
const filters = load('../src/lib/catalog-filters.ts', {});
const products = Object.freeze([
  Object.freeze({ id: 7, name: 'ORIGEN Raw Honey Fuel', goal: Object.freeze(['ENDURE']), price: 39, stock: 4 }),
  Object.freeze({ id: 2, name: 'Proteína de Café', goal: Object.freeze(['BUILD', 'NOURISH']), price: 99, stock: 2 }),
  Object.freeze({ id: 3, name: 'Recuperación Cítrica', goal: Object.freeze(['RECOVER']), price: 45, stock: 0 }),
]);
const ids = rows => Array.from(rows, product => product.id);
test('case, accents and unnecessary whitespace are ignored', () => {
  assert.deepEqual(ids(filters.filterCatalogProducts(products, '  PROTEINA   cafe  ', 'ALL')), [2]);
});
test('all search words must match the name', () => {
  assert.deepEqual(ids(filters.filterCatalogProducts(products, 'fuel honey', 'ALL')), [7]);
  assert.deepEqual(ids(filters.filterCatalogProducts(products, 'fuel cafe', 'ALL')), []);
});
test('empty search preserves product order, references, prices and stock', () => {
  const rows = filters.filterCatalogProducts(products, '   ', 'ALL');
  assert.deepEqual(ids(rows), [7, 2, 3]);
  rows.forEach((row, index) => assert.equal(row, products[index]));
});
test('goal and search are combined with AND', () => {
  assert.deepEqual(ids(filters.filterCatalogProducts(products, 'cafe', 'BUILD')), [2]);
  assert.deepEqual(ids(filters.filterCatalogProducts(products, 'cafe', 'ENDURE')), []);
  assert.deepEqual(ids(filters.filterCatalogProducts(products, '', 'RECOVER')), [3]);
});
test('no matches and empty catalog return empty results', () => {
  assert.deepEqual(ids(filters.filterCatalogProducts(products, 'inexistente', 'ALL')), []);
  assert.deepEqual(ids(filters.filterCatalogProducts([], '', 'ALL')), []);
});
function harness(initialUrl = '/shop') {
  let url = new URL(initialUrl, 'https://example.invalid');
  const states = [];
  let cursor = 0;
  let focusCount = 0;
  const ref = { current: { focus() { focusCount++; } } };
  const component = load('../src/app/shop/ShopContent.tsx', {
    'react/jsx-runtime': jsx,
    react: { useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; }, useRef() { return ref; } },
    'next/navigation': { useSearchParams: () => url.searchParams },
    'next/link': { default: 'a' },
    '@/components/Navbar': { default: 'navbar' },
    '@/components/product/QuickAddButton': { default: 'quick-add' },
    '@/components/product/ProductVisual': { default: 'product-visual' },
    '@/lib/catalog-filters': filters,
  }, { URLSearchParams, window: { history: { pushState(_state, _title, nextUrl) { url = new URL(nextUrl, url); } } } }).default;
  function nodes(node, result = []) {
    if (Array.isArray(node)) node.forEach(child => nodes(child, result));
    else if (node && typeof node === 'object' && node.props) { result.push(node); nodes(node.props.children, result); }
    return result;
  }
  function render() { cursor = 0; return nodes(component({ products })); }
  const text = node => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : String(node ?? '');
  return { render, input: tree => tree.find(node => node.props.id === 'catalog-search'), button: (tree, label) => tree.find(node => node.type === 'button' && text(node) === label), shown: tree => tree.filter(node => node.type === 'product-visual').map(node => node.props.product.id), url: () => url, focusCount: () => focusCount };
}
test('search updates immediately and combines with goal controls', () => {
  const app = harness();
  app.input(app.render()).props.onChange({ target: { value: 'cafe' } });
  assert.deepEqual(app.shown(app.render()), [2]);
  app.button(app.render(), 'ENDURE').props.onClick();
  assert.deepEqual(app.shown(app.render()), []);
  assert.equal(app.input(app.render()).props.value, 'cafe');
});
test('clear search retains goal and restores keyboard focus', () => {
  const app = harness('/shop?goal=BUILD');
  app.input(app.render()).props.onChange({ target: { value: 'no match' } });
  const clear = app.render().find(node => node.type === 'button' && String(node.props.children).startsWith('Limpiar'));
  clear.props.onClick();
  assert.deepEqual(app.shown(app.render()), [2]);
  assert.equal(app.focusCount(), 1);
  assert.equal(app.url().searchParams.get('goal'), 'BUILD');
});
test('empty results provide reset restoring all products and preserving unrelated URL parameters', () => {
  const app = harness('/shop?goal=BUILD&campaign=fixture');
  app.input(app.render()).props.onChange({ target: { value: 'absent' } });
  assert.ok(app.render().some(node => node.type === 'h2' && node.props.children === 'No encontramos productos.'));
  app.button(app.render(), 'Ver todos los productos').props.onClick();
  assert.deepEqual(app.shown(app.render()), [7, 2, 3]);
  assert.equal(app.input(app.render()).props.value, '');
  assert.equal(app.url().searchParams.get('goal'), null);
  assert.equal(app.url().searchParams.get('campaign'), 'fixture');
});
test('label, live result count, pressed goals and native buttons expose accessible controls', () => {
  const app = harness('/shop?goal=build');
  const tree = app.render();
  assert.ok(tree.some(node => node.type === 'label' && node.props.htmlFor === 'catalog-search'));
  assert.equal(app.input(tree).props['aria-describedby'], 'catalog-search-help');
  assert.ok(tree.some(node => node.props.role === 'status' && node.props['aria-live'] === 'polite'));
  assert.equal(app.button(tree, 'BUILD').props['aria-pressed'], true);
  tree.filter(node => node.type === 'button').forEach(node => assert.equal(node.props.type, 'button'));
});
test('invalid bookmarked goal falls back to all products', () => {
  const app = harness('/shop?goal=invalid');
  assert.deepEqual(app.shown(app.render()), [7, 2, 3]);
});
