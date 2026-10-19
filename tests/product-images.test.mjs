import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// Only source and allowlisted mocks: no Next startup, environment or network.
function load(path, imports = {}, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
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

const imageHelpers = load("../src/lib/product-images.ts");
const placeholder = load("../src/components/product/ProductImagePlaceholder.tsx", { "react/jsx-runtime": jsx });
function MockImage({ src, alt }) {
  assert.equal(typeof src, "string");
  assert.ok(src.trim().length > 0, "next/image must never receive an empty source");
  return jsx.jsx("img", { src, alt });
}
const common = {
  "react/jsx-runtime": jsx,
  "next/image": { default: MockImage },
  "@/lib/product-images": imageHelpers,
  "./ProductImagePlaceholder": placeholder,
};
const visual = load("../src/components/product/ProductVisual.tsx", common);
const product = { id: 101, name: "Producto de prueba", category: "NUTRITION", price: 100, verified: true };

function gallery(images) {
  const state = [];
  let cursor = 0;
  let currentProduct = { ...product, images };
  const { default: Gallery } = load("../src/components/product/ProductGallery.tsx", {
    ...common,
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
      },
      useEffect() {},
    },
    "react-dom": { createPortal: (element) => element },
  }, { document: { body: {} } });
  return {
    render(nextImages) {
      if (nextImages !== undefined) currentProduct = { ...currentProduct, images: nextImages };
      cursor = 0;
      return Gallery({ product: currentProduct });
    },
  };
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const children = element.props?.children;
  return [element, ...(Array.isArray(children) ? children : [children]).flatMap(nodes)];
}
function click(tree, label) {
  const button = nodes(tree).find((node) => node.type === "button" && node.props["aria-label"] === label);
  assert.ok(button, `Missing button: ${label}`);
  button.props.onClick();
}
function html(tree) { return renderToStaticMarkup(tree); }

test("normalizes missing, empty and invalid image entries without changing valid order", () => {
  for (const value of [undefined, null, [], "wrong", ["", "  ", null, 12]]) {
    assert.equal(imageHelpers.getProductImages(value).length, 0);
  }
  assert.deepEqual(Array.from(imageHelpers.getProductImages([" /first.webp ", "", "/second.webp"])), ["/first.webp", "/second.webp"]);
});

for (const images of [[], ["/one.webp"], ["/one.webp", "/two.webp", "/three.webp"]]) {
  test(`ProductVisual with ${images.length} images`, () => {
    const markup = html(jsx.jsx(visual.default, { product: { ...product, images } }));
    assert.equal(markup.includes("<img"), images.length > 0);
    if (!images.length) {
      assert.ok(markup.includes("ORIGEN"));
      assert.ok(markup.includes("fotografía no disponible"));
    } else assert.ok(markup.includes('src="/one.webp"'));
  });

  test(`ProductGallery with ${images.length} images has correct controls and counter`, () => {
    const tree = gallery(images).render();
    const markup = html(tree);
    const buttons = nodes(tree).filter((node) => node.type === "button");
    assert.ok(!markup.includes("1 / 0"));
    if (!images.length) {
      assert.equal(buttons.length, 0);
      assert.ok(!markup.includes("<img"));
      assert.ok(markup.includes("Fotografía próximamente"));
    } else {
      assert.ok(markup.includes(`1 / ${images.length}`));
      assert.equal(buttons.filter((node) => node.props["aria-pressed"] !== undefined).length, images.length > 1 ? images.length : 0);
    }
  });
}

test("multiple images preserve thumbnails, wrapping navigation, zoom and closing", () => {
  const view = gallery(["/one.webp", "/two.webp", "/three.webp"]);
  click(view.render(), `Ver imagen 3 de ${product.name}`);
  assert.ok(html(view.render()).includes("3 / 3"));
  click(view.render(), "Imagen siguiente");
  assert.ok(html(view.render()).includes("1 / 3"));
  click(view.render(), "Imagen anterior");
  click(view.render(), `Ampliar fotografía de ${product.name}`);
  const enlarged = html(view.render());
  assert.ok(enlarged.includes('role="dialog"'));
  assert.ok(enlarged.includes('src="/three.webp"'));
  click(view.render(), "Cerrar imagen ampliada");
  assert.ok(!html(view.render()).includes('role="dialog"'));
});

test("single image still opens zoom without navigation arrows", () => {
  const view = gallery(["/one.webp"]);
  click(view.render(), `Ampliar fotografía de ${product.name}`);
  const markup = html(view.render());
  assert.ok(markup.includes('role="dialog"'));
  assert.ok(markup.includes("1 / 1"));
  assert.ok(!markup.includes('aria-label="Imagen siguiente"'));
});

test("shrinking or clearing an open gallery never leaves an undefined image or invalid counter", () => {
  const view = gallery(["/one.webp", "/two.webp", "/three.webp"]);
  click(view.render(), `Ver imagen 3 de ${product.name}`);
  click(view.render(), `Ampliar fotografía de ${product.name}`);
  assert.ok(html(view.render(["/one.webp"])).includes("1 / 1"));
  const empty = html(view.render([]));
  assert.ok(!empty.includes("<img"));
  assert.ok(!empty.includes('role="dialog"'));
  assert.ok(!empty.includes("1 / 0"));
});

test("legacy products without images and blank entries render the shared placeholder", () => {
  assert.ok(html(jsx.jsx(visual.default, { product })).includes("Fotografía próximamente"));
  assert.ok(html(gallery(["", " ", undefined]).render()).includes("Fotografía próximamente"));
});

test("cart uses the shared visual for products with and without photos", () => {
  const { default: Cart } = load("../src/app/cart/page.tsx", {
    "react/jsx-runtime": jsx,
    "next/link": { default: ({ children, href }) => jsx.jsx("a", { href, children }) },
    "@/components/Navbar": { default: () => null },
    "@/components/product/ProductVisual": visual,
    "@/context/CartContext": { useCart: () => ({
      items: [{ product: { ...product, images: [] }, quantity: 1 }, { product: { ...product, id: 102, images: ["/one.webp"] }, quantity: 1 }],
      subtotal: 200, removeFromCart() {}, updateQuantity() {},
    }) },
  });
  const markup = html(jsx.jsx(Cart, {}));
  assert.ok(markup.includes("Fotografía próximamente"));
  assert.ok(markup.includes('src="/one.webp"'));
});
