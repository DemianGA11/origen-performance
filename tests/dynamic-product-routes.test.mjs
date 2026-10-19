import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

// Inspect source syntax only: importing these pages could load real clients.
for (const route of ["../src/app/page.tsx", "../src/app/shop/page.tsx", "../src/app/products/[id]/page.tsx"]) {
  test(`${route} exports a statically analyzable force-dynamic configuration`, () => {
    const source = ts.createSourceFile(route, readFileSync(new URL(route, import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const declarations = source.statements
      .filter((statement) => ts.isVariableStatement(statement) && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
      .flatMap((statement) => statement.declarationList.declarations)
      .filter((declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === "dynamic");

    assert.equal(declarations.length, 1);
    const value = declarations[0].initializer;
    assert.ok(value && ts.isStringLiteral(value), "Next.js requires a literal route configuration");
    assert.equal(value.text, "force-dynamic");
  });
}
