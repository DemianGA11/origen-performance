export type DraftField = {
  intent: "unchanged" | "set" | "clear";
  value: unknown;
};

export type NutritionDraft = {
  [key: string]: unknown;
  servingSize: string;
  servingsPerContainer: string;
  items: { [key: string]: unknown; label: string; amount: string }[];
};

export const commercialGoals = ["BUILD", "ENDURE", "RECOVER", "NOURISH"] as const;

export function unchangedField(value: unknown): DraftField {
  return { intent: "unchanged", value };
}

export function editField(value: unknown): DraftField {
  return { intent: "set", value };
}

export function clearField(value: null | []): DraftField {
  return { intent: "clear", value };
}

export function isTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isNutritionDraft(value: unknown): value is NutritionDraft {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return typeof data.servingSize === "string" &&
    typeof data.servingsPerContainer === "string" && Array.isArray(data.items) &&
    data.items.every((row) => row && typeof row === "object" &&
      typeof row.label === "string" && typeof row.amount === "string");
}

export function validateTextList(value: unknown): string[] {
  if (value == null) return [];
  if (!isTextList(value)) return ["Estructura no reconocida. El dato original se conserva."];
  const errors: string[] = [];
  if (value.length > 50) errors.push("Máximo 50 elementos.");
  if (value.some((item) => !item.trim() || item.length > 500)) {
    errors.push("Cada elemento debe contener entre 1 y 500 caracteres.");
  }
  return errors;
}

export function validateNutrition(value: unknown): string[] {
  if (value == null) return [];
  if (!isNutritionDraft(value)) return ["Estructura nutrimental no reconocida. El dato original se conserva."];
  const errors: string[] = [];
  if (![value.servingSize, value.servingsPerContainer].every((text) => text.trim() && text.length <= 200)) {
    errors.push("Completa porción y porciones por envase (máximo 200 caracteres cada una).");
  }
  if (value.items.length === 0 || value.items.length > 50) errors.push("Incluye entre 1 y 50 nutrimentos.");
  if (value.items.some((row) => !row.label.trim() || !row.amount.trim() || row.label.length > 200 || row.amount.length > 200)) {
    errors.push("Cada nutrimento requiere nombre y cantidad con unidad (máximo 200 caracteres).");
  }
  return errors;
}

export function moveNutritionRow(value: NutritionDraft, from: number, to: number): NutritionDraft {
  if (from < 0 || to < 0 || from >= value.items.length || to >= value.items.length) return value;
  const items = [...value.items];
  const [row] = items.splice(from, 1);
  items.splice(to, 0, row);
  return { ...value, items };
}
