import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// Source evaluation accepts only the mocks below; no app, services or env files.
function load(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    assert.ok(Object.hasOwn(imports, name), `Forbidden import: ${name}`);
    return imports[name];
  } }, { timeout: 1000 });
  return exports;
}
const draft = load("../src/lib/product-details-draft.ts");
const editors = load("../src/components/admin/ProductDetailsEditors.tsx", {
  "react/jsx-runtime": jsx, react: { useId: () => "test-id" }, "@/lib/product-details-draft": draft,
});
const normalize = (value) => JSON.parse(JSON.stringify(value));
const nutrition = {
  servingSize: "30 g", servingsPerContainer: "30", source: "Etiqueta original",
  items: [{ label: "Proteína", amount: "24 g", reference: "A" }, { label: "Energía", amount: "120 kcal" }],
};
function nodes(element) {
  if (Array.isArray(element)) return element.flatMap(nodes);
  if (!element || typeof element !== "object") return [];
  const children = element.props?.children;
  return [element, ...(Array.isArray(children) ? children : [children]).flatMap(nodes)];
}
function editor(name, value, label = "Alérgenos") {
  let field = draft.unchangedField(value);
  let calls = 0;
  return {
    get field() { return field; }, get calls() { return calls; },
    render() { return editors[name]({ field, label, onChange: (next) => { field = next; calls++; } }); },
    click(text) {
      const button = nodes(this.render()).find((node) => node.type === "button" && renderToStaticMarkup(node).replace(/<[^>]*>/g, "") === text);
      assert.ok(button, `Button: ${text}`);
      assert.ok(!button.props.disabled);
      button.props.onClick();
    },
    input(id, value) {
      const input = nodes(this.render()).find((node) => node.type === "input" && node.props.id === id);
      assert.ok(input, `Input: ${id}`);
      input.props.onChange({ target: { value } });
    },
  };
}

test("absence, unchanged data, edited values and explicit deletion remain distinct", () => {
  assert.equal(draft.unchangedField(undefined).value, undefined);
  assert.equal(draft.unchangedField(null).intent, "unchanged");
  assert.equal(draft.editField([]).intent, "set");
  assert.equal(draft.clearField([]).intent, "clear");
  assert.equal(draft.clearField(null).value, null);
});

test("goals preserve unknown values when toggling supported choices", () => {
  const view = editor("CommercialGoalsEditor", ["CUSTOM", "BUILD"]);
  assert.ok(renderToStaticMarkup(view.render()).includes("Valores desconocidos conservados: CUSTOM"));
  const checkboxes = nodes(view.render()).filter((node) => node.type === "input");
  checkboxes[0].props.onChange();
  assert.deepEqual(normalize(view.field.value), ["CUSTOM"]);
  nodes(view.render()).filter((node) => node.type === "input")[1].props.onChange();
  assert.deepEqual(normalize(view.field.value), ["CUSTOM", "ENDURE"]);
});

test("removing the last goal marks explicit deletion", () => {
  const view = editor("CommercialGoalsEditor", ["BUILD"]);
  nodes(view.render()).find((node) => node.type === "input").props.onChange();
  assert.equal(view.field.intent, "clear");
});

test("unrecognized goals are locked and preserved until explicit clearing", () => {
  const original = { future: ["BUILD"] };
  const view = editor("CommercialGoalsEditor", original);
  assert.ok(nodes(view.render()).filter((node) => node.type === "input").every((node) => node.props.disabled));
  assert.equal(view.field.value, original);
  view.click("Eliminar todos los objetivos del borrador");
  assert.equal(view.field.intent, "clear");
});

for (const label of ["Alérgenos", "Advertencias", "Criterios de verificación"]) {
  test(`${label}: add, edit and remove without changing original data`, () => {
    const original = ["Existente"];
    const view = editor("TextListEditor", original, label);
    view.render();
    assert.equal(view.calls, 0);
    view.click(`Agregar elemento a ${label.toLowerCase()}`);
    view.input("test-id-1", "Nuevo");
    assert.deepEqual(normalize(view.field.value), ["Existente", "Nuevo"]);
    view.click("Eliminar elemento 1");
    view.click("Eliminar elemento 1");
    assert.equal(view.field.intent, "clear");
    assert.deepEqual(original, ["Existente"]);
  });
}

test("text list validation rejects empty entries, oversized entries and malformed data", () => {
  assert.equal(draft.validateTextList(undefined).length, 0);
  for (const value of [[" "], ["x".repeat(501)], Array(51).fill("x"), { unexpected: true }]) {
    assert.ok(draft.validateTextList(value).length > 0);
  }
  const view = editor("TextListEditor", { unexpected: true });
  assert.ok(renderToStaticMarkup(view.render()).includes("El dato original se conserva"));
  assert.equal(view.calls, 0);
});

test("nutrition validation preserves textual units and rejects incomplete or malformed data", () => {
  assert.equal(draft.validateNutrition(nutrition).length, 0);
  assert.equal(draft.validateNutrition(null).length, 0);
  for (const value of [{}, { ...nutrition, servingSize: "" }, { ...nutrition, servingsPerContainer: "x".repeat(201) }, { ...nutrition, items: [] }, { ...nutrition, items: [{ label: "", amount: "24 g" }] }]) {
    assert.ok(draft.validateNutrition(value).length > 0);
  }
});

test("nutrition edits, row reordering and removal retain additional metadata", () => {
  const original = structuredClone(nutrition);
  const view = editor("NutritionEditor", original);
  view.input("test-id-servingSize", "40 g");
  view.input("test-id-0-amount", "25 g");
  view.click("Bajar nutrimento 1");
  assert.equal(view.field.value.items[1].reference, "A");
  view.click("Subir nutrimento 2");
  view.click("Eliminar nutrimento 2");
  assert.equal(view.field.value.source, "Etiqueta original");
  assert.equal(view.field.value.items[0].amount, "25 g");
  assert.deepEqual(original, nutrition);
  view.click("Agregar nutrimento");
  assert.ok(draft.validateNutrition(view.field.value).length > 0);
});

test("nutrition starts absent and clearing requires an explicit action", () => {
  const view = editor("NutritionEditor", undefined);
  assert.equal(view.field.intent, "unchanged");
  view.click("Agregar información nutrimental");
  assert.equal(view.field.intent, "set");
  view.click("Eliminar explícitamente la información nutrimental");
  assert.equal(view.field.intent, "clear");
  assert.equal(view.field.value, null);
});

test("unknown nutrition stays intact and cannot be silently converted by editing", () => {
  const original = { porcion: "10 g", nutrients: [1, 2] };
  const view = editor("NutritionEditor", original);
  const tree = view.render();
  assert.ok(renderToStaticMarkup(tree).includes("Estructura nutrimental no reconocida"));
  assert.equal(nodes(tree).filter((node) => node.type === "input").length, 0);
  assert.equal(view.field.value, original);
  assert.equal(view.calls, 0);
});

test("row moves at boundaries are no-ops", () => {
  assert.equal(draft.moveNutritionRow(nutrition, 0, -1), nutrition);
  assert.equal(draft.moveNutritionRow(nutrition, 1, 2), nutrition);
});

test("local workspace labels unsaved fields and keeps verified read-only", () => {
  const states = [];
  const { default: Workspace } = load("../src/components/admin/ProductDetailsDraft.tsx", {
    "react/jsx-runtime": jsx,
    "@/lib/product-details-draft": draft,
    "./ProductDetailsEditors": editors,
    react: { useState: (initial) => {
      const value = typeof initial === "function" ? initial() : initial;
      states.push(value);
      return [value, () => {}];
    } },
  });
  const tree = Workspace({ initialData: { goal: ["BUILD", "UNKNOWN"], nutrition, verified: true } });
  const markup = renderToStaticMarkup(tree);
  assert.ok(markup.includes("sin guardado"));
  assert.ok(markup.includes("solo lectura"));
  assert.ok(!markup.includes("<form"));
  assert.equal(states[0].nutrition.value, nutrition);
  assert.equal(states[0].allergens.value, undefined);
  assert.equal(states[0].nutrition.intent, "unchanged");
  assert.equal(states[0].verified, undefined);
});
