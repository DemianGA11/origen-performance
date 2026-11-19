import type { Product } from "@/data/products";

/** Preliminary UI guard only; checkout still validates the database. */
export function canPurchaseProduct(product: Product): boolean {
  return product.id !== 6 && product.isActive === true &&
    Number.isSafeInteger(product.stock) && (product.stock ?? 0) > 0;
}
