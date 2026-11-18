import type { Product } from "../data/products";

/** Display-only matching: never changes prices, availability or catalog order. */
export function normalizeCatalogSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function filterCatalogProducts<T extends Pick<Product, "name" | "goal">>(
  products: readonly T[], query: string, activeGoal: string,
): T[] {
  const tokens = normalizeCatalogSearch(query).split(" ").filter(Boolean);
  return products.filter((product) => {
    const matchesGoal = activeGoal === "ALL" || product.goal.includes(activeGoal);
    const name = normalizeCatalogSearch(product.name);
    return matchesGoal && tokens.every((token) => name.includes(token));
  });
}
