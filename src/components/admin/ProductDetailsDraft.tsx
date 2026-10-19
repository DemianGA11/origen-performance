"use client";

import { useState } from "react";
import { unchangedField } from "@/lib/product-details-draft";
import { CommercialGoalsEditor, NutritionEditor, TextListEditor } from "./ProductDetailsEditors";

export type ProductDetailsInitialData = {
  goal?: unknown;
  allergens?: unknown;
  warnings?: unknown;
  verified_reasons?: unknown;
  nutrition?: unknown;
  verified?: boolean;
};

/** Local-only workspace. Intentionally not wired to production forms or RPCs.
 * Mount with key={product.id} when integrating to isolate drafts per product.
 */
export default function ProductDetailsDraft({ initialData }: { initialData: ProductDetailsInitialData }) {
  const [fields, setFields] = useState(() => ({
    goal: unchangedField(initialData.goal),
    allergens: unchangedField(initialData.allergens),
    warnings: unchangedField(initialData.warnings),
    verified_reasons: unchangedField(initialData.verified_reasons),
    nutrition: unchangedField(initialData.nutrition),
  }));

  return <section aria-label="Edición de producto en preparación" className="space-y-5 rounded-3xl bg-[#FAF8F2] p-6 text-[#20201D]">
    <h2 className="text-2xl font-bold">Edición en preparación · sin guardado</h2>
    <p className="text-sm text-[#68705A]">Borrador temporal. Ningún cambio se envía a Supabase. Se pierde al salir o recargar; los botones actuales de guardar productos no guardan estos campos.</p>
    <CommercialGoalsEditor field={fields.goal} onChange={(goal) => setFields((current) => ({ ...current, goal }))} />
    {([ ["allergens", "Alérgenos"], ["warnings", "Advertencias"], ["verified_reasons", "Criterios de verificación"] ] as const).map(([key, label]) =>
      <TextListEditor key={key} label={label} field={fields[key]} onChange={(value) => setFields((current) => ({ ...current, [key]: value }))} />)}
    <NutritionEditor field={fields.nutrition} onChange={(nutrition) => setFields((current) => ({ ...current, nutrition }))} />
    <p className="text-sm">Indicador verified actual (solo lectura): {initialData.verified === true ? "Sí" : initialData.verified === false ? "No" : "Sin dato"}. Editar criterios no modifica este indicador.</p>
  </section>;
}
