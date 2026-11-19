import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function load(file, imports = {}, extra = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, ...extra, require(name) { assert.ok(Object.hasOwn(imports, name), `Unexpected import ${name}`); return imports[name]; } });
  return exports;
}
const availability = load('lib/product-availability.ts');
const stock = load('lib/cart-stock.ts', { '@/lib/product-availability': availability });
const product = { id: 7, name: 'Honey', images: [], isActive: true, stock: 4, price: 39 };
function context() {
  const states = [];
  let cursor = 0;
  const react = { createContext: () => ({ Provider: 'provider' }), useEffect() {}, useCallback: fn => fn, useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], update => { states[index] = typeof update === 'function' ? update(states[index]) : update; }]; } };
  const cartContext = load('context/CartContext.tsx', { react, 'react/jsx-runtime': jsx, '@/lib/product-availability': availability, '@/lib/cart-stock': stock });
  return () => { cursor = 0; return cartContext.CartProvider({ children: null }).props.value; };
}
function nodes(node) { return Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : []; }
test('repeated additions account for existing quantity and never exceed four units', () => {
  const render = context();
  for (let i = 0; i < 8; i++) render().addToCart(product, 1);
  assert.equal(render().items[0].quantity, 4);
  assert.equal(render().totalItems, 4);
});
test('cart increment clamps to stock and rejects fractional, negative or nonfinite quantities', () => {
  const render = context();
  render().addToCart(product, 2);
  render().updateQuantity(7, 5);
  assert.equal(render().items[0].quantity, 4);
  for (const quantity of [1.5, -1, NaN, Infinity]) render().updateQuantity(7, quantity);
  assert.equal(render().items[0].quantity, 4);
  render().updateQuantity(7, 0);
  assert.equal(render().items.length, 0);
});
test('inventory refresh updates context, lowers excessive quantity, flags adjustment and preserves quote', () => {
  const render = context();
  render().addToCart(product, 4);
  render().syncProducts([{ ...product, stock: 2, price: 99 }]);
  assert.equal(render().items[0].quantity, 2);
  assert.equal(render().items[0].product.stock, 2);
  assert.equal(render().items[0].product.price, 39);
  assert.equal(render().items[0].stockAdjusted, true);
  render().updateQuantity(7, 10);
  assert.equal(render().items[0].quantity, 2);
});
test('inactive, missing and conceptual stock never becomes purchasable through refresh', () => {
  for (const catalog of [[], [{ ...product, isActive: false }], [{ ...product, stock: 0 }]]) {
    const render = context();
    render().addToCart(product);
    render().syncProducts(catalog);
    assert.equal(availability.canPurchaseProduct(render().items[0].product), false);
  }
  const render = context();
  for (const id of [6, 8, 9, 10]) render().addToCart({ ...product, id, isActive: false, stock: 0 });
  assert.equal(render().items.length, 0);
});
test('unchanged catalog preserves cart reference and does not mutate inputs', () => {
  const item = Object.freeze({ product: Object.freeze(product), quantity: 2 });
  const items = [item];
  assert.equal(stock.syncCartStock(items, [product]), items);
});
test('low stock labels use observed stock only', () => {
  assert.equal(availability.getAvailabilityLabel(product), 'Quedan 4 unidades');
  assert.equal(availability.getAvailabilityLabel({ ...product, stock: 5 }), 'Quedan 5 unidades');
  assert.equal(availability.getAvailabilityLabel({ ...product, stock: 6 }), 'Disponible');
  assert.equal(availability.getAvailabilityLabel({ ...product, stock: 0 }), 'No disponible para compra');
  assert.equal(availability.getAvailabilityLabel({ ...product, isActive: false }), 'No disponible para compra');
});
test('product and quick-add controls disable further additions when all stock is already in cart', () => {
  for (const file of ['AddToCart.tsx', 'QuickAddButton.tsx']) {
    let called = false;
    const component = load(`components/product/${file}`, { 'react/jsx-runtime': jsx, react: { useState: initial => [initial, () => {}] }, '@/lib/product-availability': availability, '@/context/CartContext': { useCart: () => ({ items: [{ product, quantity: 4 }], addToCart() { called = true; } }) } });
    const buttons = nodes(component.default({ product })).filter(node => node.type === 'button');
    const add = buttons.at(-1);
    assert.equal(add.props.disabled, true);
    add.props.onClick();
    assert.equal(called, false);
  }
});
test('product quantity selection considers units already in cart', () => {
  let added = 0;
  const component = load('components/product/AddToCart.tsx', { 'react/jsx-runtime': jsx, react: { useState: initial => [initial === 1 ? 3 : initial, () => {}] }, '@/lib/product-availability': availability, '@/context/CartContext': { useCart: () => ({ items: [{ product, quantity: 3 }], addToCart(_product, quantity) { added = quantity; } }) } }, { setTimeout() {} });
  nodes(component.default({ product })).filter(node => node.type === 'button').at(-1).props.onClick();
  assert.equal(added, 1);
});
