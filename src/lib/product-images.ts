/** Tolerates missing image data in older carts and ignores empty entries. */
export function getProductImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return images
    .filter((image): image is string => typeof image === "string")
    .map((image) => image.trim())
    .filter((image) => image.length > 0);
}
