import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function harness(pathname = '/shop') {
  const states = [];
  let cursor = 0;
  let focusCount = 0;
  const source = readFileSync(new URL('../src/components/Navbar.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  const imports = {
    'react/jsx-runtime': jsx,
    react: { useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], update => { states[index] = typeof update === 'function' ? update(states[index]) : update; }]; }, useEffect() {}, useId: () => 'mobile-nav-fixture', useRef: () => ({ current: { focus() { focusCount++; } } }) },
    'next/link': { default: 'a' },
    'next/navigation': { usePathname: () => pathname },
    '@/context/CartContext': { useCart: () => ({ totalItems: 4 }) },
    '@/lib/supabase': { supabase: { auth: { getUser() { throw new Error('Effects must not access real authentication in this test'); } } } },
  };
  vm.runInNewContext(code + '\nexports.MobileMenu = MobileMenu;', { exports, require(name) { assert.ok(Object.hasOwn(imports, name), name); return imports[name]; } });
  const links = [{ name: 'Inicio', href: '/' }, { name: 'Shop', href: '/shop' }, { name: 'Mi cuenta', href: '/cuenta' }, { name: 'Carrito', href: '/cart' }];
  return {
    menu() { cursor = 0; return exports.MobileMenu({ links }); },
    navbar() { cursor = 0; return exports.default(); },
    setPathname(value) { pathname = value; },
    mobileType: exports.MobileMenu,
    focusCount: () => focusCount,
  };
}
function nodes(node) { return Array.isArray(node) ? node.flatMap(nodes) : node?.props ? [node, ...nodes(node.props.children)] : []; }
const toggle = tree => nodes(tree).find(node => node.type === 'button');
test('mobile disclosure is closed initially and opens/closes with its native keyboard-accessible button', () => {
  const app = harness();
  assert.equal(toggle(app.menu()).props.type, 'button');
  assert.equal(toggle(app.menu()).props['aria-expanded'], false);
  assert.equal(nodes(app.menu()).filter(node => node.type === 'a').length, 0);
  toggle(app.menu()).props.onClick();
  assert.equal(toggle(app.menu()).props['aria-expanded'], true);
  assert.ok(nodes(app.menu()).some(node => node.props.id === toggle(app.menu()).props['aria-controls']));
  toggle(app.menu()).props.onClick();
  assert.equal(toggle(app.menu()).props['aria-expanded'], false);
});
test('all required mobile destinations exist and navigating closes the menu', () => {
  const app = harness();
  toggle(app.menu()).props.onClick();
  const links = nodes(app.menu()).filter(node => node.type === 'a');
  assert.deepEqual(links.map(link => link.props.href), ['/', '/shop', '/cuenta', '/cart']);
  links[1].props.onClick();
  assert.equal(toggle(app.menu()).props['aria-expanded'], false);
});
test('Escape closes an open menu and returns focus to its toggle', () => {
  const app = harness();
  toggle(app.menu()).props.onClick();
  app.menu().props.onKeyDown({ key: 'Escape' });
  assert.equal(toggle(app.menu()).props['aria-expanded'], false);
  assert.equal(app.focusCount(), 1);
});
test('navbar retains accessible cart and account links and remounts mobile state on route changes', () => {
  const app = harness('/shop');
  const first = app.navbar();
  const links = nodes(first).filter(node => node.type === 'a');
  assert.ok(links.some(link => link.props.href === '/cart'));
  assert.ok(links.some(link => link.props.href === '/login'));
  const mobile = nodes(first).find(node => node.type === app.mobileType);
  assert.equal(mobile.key, '/shop');
  assert.ok(mobile.props.links.some(link => link.href === '/profile'));
  app.setPathname('/cart');
  assert.equal(nodes(app.navbar()).find(node => node.type === app.mobileType).key, '/cart');
});
