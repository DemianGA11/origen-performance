import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// Only local source and explicitly allowed mocks are evaluated. No app startup,
// environment files, Supabase/Stripe clients or network globals are available.
function load(relativePath, imports = {}, globals = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Forbidden import: ${name}`);
      return imports[name];
    },
    ...globals,
  }, { timeout: 1000 });
  return exports;
}

const availabilityModule = load("../src/lib/product-availability.ts");
const { getProductAvailability } = availabilityModule;
const { mapDatabaseProduct } = load("../src/lib/product-mapper.ts");
const base = { id: 101, name: "Producto simulado", is_active: true, stock: 5 };

test("mapper preserves Supabase activity and stock, including false and zero", () => {
  for (const row of [base, { ...base, is_active: false, stock: 0 }]) {
    const mapped = mapDatabaseProduct({ ...row, price: "123.45" });
    assert.equal(mapped.is_active, row.is_active);
    assert.equal(mapped.stock, row.stock);
    assert.equal(mapped.price, 123.45);
  }
});

for (const [label, changes, canPurchase, text] of [
  ["active and stocked", {}, true, "Disponible"],
  ["sold out", { stock: 0 }, false, "Agotado"],
  ["inactive", { is_active: false }, false, "No disponible"],
  ["inactive and empty", { is_active: false, stock: 0 }, false, "No disponible"],
  ["Pre-Performance", { id: 6 }, false, "No disponible"],
  ["legacy cart fields", { is_active: undefined, stock: undefined }, false, "No disponible"],
  ["missing stock", { stock: undefined }, false, "No disponible"],
  ["invalid stock", { stock: NaN }, false, "No disponible"],
  ["negative stock", { stock: -1 }, false, "No disponible"],
  ["fractional stock", { stock: 0.5 }, false, "No disponible"],
]) {
  test(`availability: ${label}`, () => {
    const result = getProductAvailability({ ...base, ...changes });
    assert.equal(result.canPurchase, canPurchase);
    assert.equal(result.label, text);
  });
}

function buttonsIn(element) {
  if (!element || typeof element !== "object") return [];
  const children = element.props?.children;
  return [
    ...(element.type === "button" ? [element] : []),
    ...(Array.isArray(children) ? children : [children]).flatMap(buttonsIn),
  ];
}

for (const component of ["QuickAddButton", "AddToCart"]) {
  for (const [state, changes, unavailableText] of [
    ["available", {}, null],
    ["sold out", { stock: 0 }, "Agotado"],
    ["inactive", { is_active: false }, "No disponible"],
    ["restricted", { id: 6 }, "No disponible"],
    ["legacy", { is_active: undefined, stock: undefined }, "No disponible"],
  ]) {
    test(`${component}: ${state} renders the state and guards adding to cart`, () => {
      const additions = [];
      const { default: Component } = load(`../src/components/product/${component}.tsx`, {
        react: { useState: (initial) => [initial, () => {}] },
        "react/jsx-runtime": jsxRuntime,
        "@/context/CartContext": { useCart: () => ({ addToCart: (...args) => additions.push(args) }) },
        "@/lib/product-availability": availabilityModule,
      }, { setTimeout: () => 0 });
      const product = { ...base, ...changes };
      const element = Component({ product });
      const buttons = buttonsIn(element);
      const addButton = buttons.at(-1);
      assert.equal(addButton.props.disabled, Boolean(unavailableText));
      if (unavailableText) {
        assert.ok(renderToStaticMarkup(element).includes(unavailableText));
        assert.ok(buttons.every((button) => button.props.disabled));
      }
      // Direct invocation also verifies the handler guard, independently of HTML.
      addButton.props.onClick();
      assert.equal(additions.length, unavailableText ? 0 : 1);
      if (!unavailableText) {
        assert.equal(additions[0][0], product);
        assert.equal(additions[0][1], 1);
      }
    });
  }
}

test("CartProvider still loads legacy cart products without deleting or changing quantities", () => {
  const legacy = [{ product: { id: 1, name: "Anterior", price: 449 }, quantity: 3 }];
  const writes = [];
  let loadedItems;
  const { CartProvider } = load("../src/context/CartContext.tsx", {
    react: {
      createContext: () => ({ Provider: "mock-provider" }),
      useContext: () => {},
      useEffect: (effect) => effect(),
      useState: (initial) => [initial, (value) => { if (Array.isArray(initial)) loadedItems = value; }],
    },
    "react/jsx-runtime": jsxRuntime,
  }, {
    localStorage: {
      getItem: () => JSON.stringify(legacy),
      setItem: (...args) => writes.push(args),
      removeItem: (...args) => writes.push(args),
    },
    window: { setTimeout: (callback) => { callback(); return 0; }, clearTimeout() {} },
  });
  CartProvider({ children: null });
  assert.deepEqual(JSON.parse(JSON.stringify(loadedItems)), legacy);
  assert.equal(writes.length, 0);
});
