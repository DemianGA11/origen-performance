import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function load(file, imports = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, URL, console, ...globals, require(name) { assert.ok(Object.hasOwn(imports, name), `Unexpected import ${name}`); return imports[name]; } });
  return exports;
}
const images = load('lib/product-images.ts');
const availability = load('lib/product-availability.ts');
const mapper = load('lib/product-mapper.ts', { '@/lib/product-images': images });
const url = 'https://fixture.supabase.co/storage/v1/object/public/product-images/8/main.png';
const row = { id: 8, name: 'Conceptual product', images: [url], price: 39, is_active: false, stock: 0, goal: [], category: 'FOOD' };
const product = mapper.mapDatabaseProduct(row);
const react = { useState: value => [value, () => {}], useEffect() {} };
const visual = load('components/product/ProductVisual.tsx', { '@/lib/product-images': images, 'react/jsx-runtime': jsx, 'next/image': { default: 'image' } });
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  return node?.props ? [node, ...nodes(node.props.children)] : [];
}
function imports(extra = {}) { return { 'react/jsx-runtime': jsx, 'next/link': { default: 'a' }, '@/components/Navbar': { default: 'nav' }, '@/components/product/ProductVisual': { default: visual.default }, '@/components/product/QuickAddButton': { default: 'quick-add' }, '@/lib/product-availability': availability, react, ...extra }; }

test('image normalization preserves main image order, supports old local and new Storage URLs', () => {
  assert.deepEqual(Array.from(images.getProductImages({ images: [' ', null, 'javascript:alert(1)', url, '/products/whey/principal.webp'] })), [url, '/products/whey/principal.webp']);
  for (const value of [null, undefined, [], 'invalid', ['http://unsafe.invalid/image'], ['//unsafe.invalid/image']]) {
    assert.equal(images.getProductImages({ images: value }).length, 0);
  }
});
test('mapper keeps new product images and the real inactive/stock values', () => {
  assert.equal(product.images[0], url);
  assert.equal(product.isActive, false);
  assert.equal(product.stock, 0);
  assert.equal(product.price, 39);
});
test('ProductVisual and gallery choose the same first valid source; placeholder only without a source', () => {
  const gallery = load('components/product/ProductGallery.tsx', { ...imports(), '@/lib/product-images': images, 'next/image': { default: 'image' }, 'react-dom': { createPortal() { throw new Error('Unexpected portal'); } } });
  for (const component of [visual.default, gallery.default]) {
    const tree = component({ product: { ...product, images: ['', url, '/products/whey/principal.webp'] } });
    assert.equal(nodes(tree).find(node => node.type === 'image').props.src, url);
    const empty = component({ product: { ...product, images: [] } });
    assert.equal(empty.props.children, 'Fotograf\u00eda pendiente');
  }
});
test('catalog loading waits for request time before querying fresh images', async () => {
  const calls = [];
  const query = { select(fields) { assert.ok(fields.includes('images')); return this; }, order() { return this; }, returns() { calls.push('query'); return { data: [row], error: null }; } };
  const reader = load('lib/get-shop-products.ts', { 'next/server': { async connection() { calls.push('request'); } }, '@/lib/supabase-admin': { supabaseAdmin: { from(table) { assert.equal(table, 'products'); assert.deepEqual(calls, ['request']); return query; } } }, '@/lib/product-mapper': mapper });
  assert.equal((await reader.getShopProducts())[0].images[0], url);
  assert.deepEqual(calls, ['request', 'query']);
});
test('Home and Shop pass the current product to the shared image component', async () => {
  const home = load('components/FeaturedProducts.tsx', imports({ '@/lib/get-shop-products': { async getShopProducts() { return [product]; } } }));
  const shop = load('app/shop/ShopContent.tsx', imports({ react: { ...react, useRef: () => ({ current: null }) }, 'next/navigation': { useSearchParams: () => new URLSearchParams() }, '@/lib/catalog-filters': { filterCatalogProducts: products => products } }));
  for (const tree of [await home.default(), shop.default({ products: [product] })]) {
    const imageComponent = nodes(tree).find(node => node.type === visual.default);
    assert.equal(imageComponent.props.product.images[0], url);
  }
});
test('cart replaces stale localStorage image with current catalog image and blocks conceptual checkout', () => {
  const stored = { ...product, price: 35, images: [], isActive: true, stock: 5 };
  const cart = load('app/cart/CartContent.tsx', imports({ '@/context/CartContext': { useCart: () => ({ items: [{ product: stored, quantity: 1 }], subtotal: 35 }) } }));
  const tree = cart.default({ products: [product] });
  const current = nodes(tree).find(node => node.type === visual.default).props.product;
  assert.equal(current.images[0], url);
  assert.equal(current.price, 35);
  assert.equal(current.isActive, false);
  assert.ok(!nodes(tree).some(node => node.props.href === '/checkout'));
  assert.ok(nodes(tree).some(node => node.props.role === 'alert'));
  const active = cart.default({ products: [{ ...product, isActive: true, stock: 2 }] });
  assert.ok(nodes(active).some(node => node.props.href === '/checkout'));
});
test('inactive, stock zero, legacy unknown availability and product 6 cannot be added by either control', () => {
  for (const fixture of [product, { ...product, isActive: true }, { ...product, isActive: undefined, stock: undefined }, { ...product, id: 6, isActive: true, stock: 2 }]) {
    for (const file of ['QuickAddButton.tsx', 'AddToCart.tsx']) {
      let calls = 0;
      const component = load(`components/product/${file}`, imports({ '@/context/CartContext': { useCart: () => ({ addToCart() { calls++; } }) } }));
      const buttons = nodes(component.default({ product: fixture })).filter(node => node.type === 'button');
      const add = buttons.at(-1);
      assert.equal(add.props.disabled, true);
      add.props.onClick();
      assert.equal(calls, 0);
    }
  }
  assert.equal(availability.canPurchaseProduct({ ...product, isActive: true, stock: 2 }), true);
});
test('CartContext refuses conceptual additions and refreshes images when an available item is added again', () => {
  const state = [];
  let cursor = 0;
  const contextReact = { ...react, createContext: () => ({ Provider: 'provider' }), useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], update => { state[index] = typeof update === 'function' ? update(state[index]) : update; }]; } };
  const context = load('context/CartContext.tsx', { 'react/jsx-runtime': jsx, react: contextReact, '@/lib/product-availability': availability });
  const render = () => { cursor = 0; return context.CartProvider({ children: null }).props.value; };
  render().addToCart(product);
  assert.equal(render().items.length, 0);
  const active = { ...product, isActive: true, stock: 3 };
  render().addToCart(active);
  render().addToCart({ ...active, images: ['/products/whey/principal.webp'] });
  assert.equal(render().items.length, 1);
  assert.equal(render().items[0].product.images[0], '/products/whey/principal.webp');
});
