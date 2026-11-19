import type { Product } from "@/data/products";
import { getCartLimit } from "@/lib/product-availability";

type StockCartItem = { product: Product; quantity: number; stockAdjusted?: boolean };

/** Refresh stock and images without changing the existing price quotation. */
export function syncCartStock<T extends StockCartItem>(items: T[], products: Product[]): T[] {
  const catalog = new Map(products.map((product) => [product.id, product]));
  let changed = false;
  const next = items.map((item) => {
    const current = catalog.get(item.product.id);
    const product = { ...item.product, images: current?.images ?? [], isActive: current?.isActive ?? false, stock: current?.stock ?? 0 };
    const limit = getCartLimit(product);
    // Retain unavailable lines so the buyer can see and remove them.
    const quantity = limit > 0 ? Math.min(item.quantity, limit) : item.quantity;
    const stockAdjusted = item.stockAdjusted || quantity !== item.quantity;
    if (quantity === item.quantity && product.isActive === item.product.isActive && product.stock === item.product.stock && JSON.stringify(product.images) === JSON.stringify(item.product.images)) return item;
    changed = true;
    return { ...item, product, quantity, stockAdjusted };
  });
  return changed ? next : items;
}
