import type { Product } from "@/data/products";

/** Estado orientativo de interfaz; el servidor valida la compra definitiva. */
export function getProductAvailability(
  product: Pick<Product, "id" | "is_active" | "stock">
): { canPurchase: boolean; label: string } {
  if (product.id === 6 || product.is_active !== true) {
    return { canPurchase: false, label: "No disponible" };
  }

  if (typeof product.stock !== "number" || !Number.isSafeInteger(product.stock) || product.stock < 0) {
    return { canPurchase: false, label: "No disponible" };
  }

  if (product.stock === 0) {
    return { canPurchase: false, label: "Agotado" };
  }

  return { canPurchase: true, label: "Disponible" };
}
