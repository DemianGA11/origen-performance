/** Keep the stored image order; ignore empty or unsafe sources. */
export function getProductImages(product: { images?: unknown }): string[] {
  if (!Array.isArray(product.images)) return [];
  return product.images.flatMap((value: unknown) => {
    if (typeof value !== "string") return [];
    const src = value.trim();
    if (/^\/products\/[^\s\\]+$/.test(src)) return [src];
    try {
      const url = new URL(src);
      return url.protocol === "https:" && !url.username && !url.password ? [src] : [];
    } catch {
      return [];
    }
  });
}
