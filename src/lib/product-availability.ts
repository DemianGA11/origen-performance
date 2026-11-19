import type { Product } from "@/data/products";

/** Preliminary UI guard only; checkout still validates the database. */
export function canPurchaseProduct(product: Product): boolean {
  return product.id !== 6 && product.isActive === true &&
    Number.isSafeInteger(product.stock) && (product.stock ?? 0) > 0;
}

export function getCartLimit(product: Product): number {
  return canPurchaseProduct(product) ? Math.min(product.stock ?? 0, 20) : 0;
}

export function getAvailabilityLabel(product: Product): string {
  if (!canPurchaseProduct(product)) return "No disponible para compra";
  return (product.stock ?? 0) <= 5 ? `Quedan ${product.stock} unidades` : "Disponible";
}
