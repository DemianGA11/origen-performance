"use client";

import { useId } from "react";
import {
  commercialGoals, clearField, editField, isNutritionDraft, isTextList,
  moveNutritionRow, validateNutrition, validateTextList,
  type DraftField,
} from "@/lib/product-details-draft";

type EditorProps = { field: DraftField; onChange: (field: DraftField) => void };
const inputClass = "w-full rounded-xl border border-[#DDD8CC] bg-white px-4 py-3 text-[#20201D]";
const buttonClass = "rounded-full border border-[#68705A]/40 px-4 py-2 text-sm font-semibold text-[#68705A] disabled:opacity-40";

function Feedback({ errors }: { errors: string[] }) {
  return <div aria-live="polite">{errors.map((error) => <p key={error} className="mt-2 text-sm text-red-700">{error}</p>)}</div>;
}

function DraftStatus({ field }: { field: DraftField }) {
  return <p className="mt-2 text-xs text-[#68705A]">{field.intent === "clear" ? "Eliminación explícita en el borrador." : field.intent === "set" ? "Modificado solo en este borrador." : field.value == null ? "Sin datos; sin cambios." : "Dato original; sin cambios."}</p>;
}

export function CommercialGoalsEditor({ field, onChange }: EditorProps) {
  const supported = field.value == null || isTextList(field.value);
  const values = isTextList(field.value) ? field.value : [];
  const unknown = values.filter((value) => !commercialGoals.some((goal) => goal === value));
  return <fieldset className="space-y-3 rounded-2xl border border-[#DDD8CC] p-5">
    <legend className="px-2 font-semibold">Objetivos comerciales</legend>
    {!supported && <p role="alert">Estructura no reconocida. Se conserva; elimina explícitamente el dato para empezar de nuevo.</p>}
    {unknown.length > 0 && <p role="status" className="text-sm text-[#68705A]">Valores desconocidos conservados: {unknown.join(", ")}. No se eliminarán al seleccionar otros objetivos.</p>}
    <div className="flex flex-wrap gap-4">{commercialGoals.map((goal) => <label key={goal} className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={values.includes(goal)} disabled={!supported} onChange={() => {
        const next = values.includes(goal) ? values.filter((value) => value !== goal) : [...values, goal];
        onChange(next.length === 0 ? clearField([]) : editField(next));
      }} />{goal}
    </label>)}</div>
    <button type="button" className={buttonClass} onClick={() => onChange(clearField([]))}>Eliminar todos los objetivos del borrador</button>
    <DraftStatus field={field} />
  </fieldset>;
}

export function TextListEditor({ field, onChange, label }: EditorProps & { label: string }) {
  const id = useId();
  const supported = field.value == null || isTextList(field.value);
  const values = isTextList(field.value) ? field.value : [];
  return <fieldset className="space-y-3 rounded-2xl border border-[#DDD8CC] p-5">
    <legend className="px-2 font-semibold">{label}</legend>
    {values.map((value, index) => <div key={index} className="flex flex-wrap items-end gap-2">
      <label htmlFor={`${id}-${index}`} className="min-w-0 flex-1 text-sm">{label}: elemento {index + 1}
        <input id={`${id}-${index}`} className={inputClass} value={value} maxLength={500} onChange={(event) => onChange(editField(values.map((item, position) => position === index ? event.target.value : item)))} />
      </label>
      <button type="button" className={buttonClass} onClick={() => onChange(values.length === 1 ? clearField([]) : editField(values.filter((_, position) => position !== index)))}>Eliminar elemento {index + 1}</button>
    </div>)}
    <button type="button" className={buttonClass} disabled={!supported || values.length >= 50} onClick={() => onChange(editField([...values, ""]))}>Agregar elemento a {label.toLowerCase()}</button>
    <button type="button" className={buttonClass} onClick={() => onChange(clearField([]))}>Eliminar todos los elementos de {label.toLowerCase()}</button>
    <Feedback errors={validateTextList(field.value)} />
    <DraftStatus field={field} />
  </fieldset>;
}

export function NutritionEditor({ field, onChange }: EditorProps) {
  const id = useId();
  const nutrition = isNutritionDraft(field.value) ? field.value : null;
  return <fieldset className="space-y-4 rounded-2xl border border-[#DDD8CC] p-5">
    <legend className="px-2 font-semibold">Información nutrimental</legend>
    <p className="text-sm text-[#68705A]">Las cantidades conservan sus unidades, por ejemplo: 24 g o 120 kcal. Las propiedades adicionales existentes se conservan.</p>
    {field.value == null && <button type="button" className={buttonClass} onClick={() => onChange(editField({ servingSize: "", servingsPerContainer: "", items: [] }))}>Agregar información nutrimental</button>}
    {nutrition && <>
      <div className="grid gap-4 sm:grid-cols-2">{(["servingSize", "servingsPerContainer"] as const).map((key) => <label key={key} htmlFor={`${id}-${key}`} className="text-sm">
        {key === "servingSize" ? "Tamaño de porción" : "Porciones por envase"}
        <input id={`${id}-${key}`} className={inputClass} value={nutrition[key]} maxLength={200} onChange={(event) => onChange(editField({ ...nutrition, [key]: event.target.value }))} />
      </label>)}</div>
      {nutrition.items.map((row, index) => <div key={index} className="space-y-2 rounded-xl bg-[#F2EBDD] p-4">
        <div className="grid gap-3 sm:grid-cols-2">{(["label", "amount"] as const).map((key) => <label key={key} htmlFor={`${id}-${index}-${key}`} className="text-sm">
          {key === "label" ? "Nutrimento" : "Cantidad por porción"} {index + 1}
          <input id={`${id}-${index}-${key}`} className={inputClass} value={row[key]} maxLength={200} onChange={(event) => onChange(editField({ ...nutrition, items: nutrition.items.map((item, position) => position === index ? { ...item, [key]: event.target.value } : item) }))} />
        </label>)}</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass} disabled={index === 0} onClick={() => onChange(editField(moveNutritionRow(nutrition, index, index - 1)))}>Subir nutrimento {index + 1}</button>
          <button type="button" className={buttonClass} disabled={index === nutrition.items.length - 1} onClick={() => onChange(editField(moveNutritionRow(nutrition, index, index + 1)))}>Bajar nutrimento {index + 1}</button>
          <button type="button" className={buttonClass} onClick={() => onChange(editField({ ...nutrition, items: nutrition.items.filter((_, position) => position !== index) }))}>Eliminar nutrimento {index + 1}</button>
        </div>
      </div>)}
      <button type="button" className={buttonClass} disabled={nutrition.items.length >= 50} onClick={() => onChange(editField({ ...nutrition, items: [...nutrition.items, { label: "", amount: "" }] }))}>Agregar nutrimento</button>
    </>}
    <button type="button" className={buttonClass} onClick={() => onChange(clearField(null))}>Eliminar explícitamente la información nutrimental</button>
    <Feedback errors={validateNutrition(field.value)} />
    <DraftStatus field={field} />
  </fieldset>;
}
