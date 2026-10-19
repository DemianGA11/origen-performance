import Image from "next/image";
import type { Product } from "@/data/products";
import { getProductImages } from "@/lib/product-images";
import ProductImagePlaceholder from "./ProductImagePlaceholder";

type ProductVisualProps = {
  product: Product;
};

export default function ProductVisual({
  product,
}: ProductVisualProps) {
  const mainImage = getProductImages(product.images)[0];

  return (
    <div className="relative h-full w-full overflow-hidden">

      {mainImage ? <Image
        src={mainImage}
        alt={`Presentación de ${product.name} de ORIGEN PERFORMANCE`}
        fill
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
        className="object-contain transition-transform duration-500 group-hover:scale-105"
      /> : <ProductImagePlaceholder name={product.name} />}

    </div>
  );
}
