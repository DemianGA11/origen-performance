
import type { Product } from "@/data/products";

export type DatabaseProduct = {
  id: number;
  name: string;
  category: string;
  packaging: Product["packaging"];
  images: string[];
  description: string;
  long_description: string;
  price: number;
  verified: boolean;
  goal: string[];
  size: string;
  ingredients: string[];
  verified_reasons: string[];
  allergens: string[];
  warnings: string[];
  nutrition: Product["nutrition"];
  is_active: boolean;
  stock: number;
};

export function mapDatabaseProduct(
  product: DatabaseProduct
): Product {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    packaging: product.packaging,
    images: product.images,
    description: product.description,
    longDescription: product.long_description,
    price: Number(product.price),
    is_active: product.is_active,
    stock: product.stock,
    verified: product.verified,
    goal: product.goal,
    size: product.size,
    ingredients: product.ingredients,
    verifiedReasons: product.verified_reasons,
    allergens: product.allergens,
    warnings: product.warnings,
    nutrition: product.nutrition,
  };
}
