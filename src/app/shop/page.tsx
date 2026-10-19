
import { Suspense } from "react";
import ShopContent from "./ShopContent";
import { getShopProducts } from "@/lib/get-shop-products";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getShopProducts();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF8F2] px-6 pt-32">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm text-[#20201D]/50">
              Cargando productos...
            </p>
          </div>
        </main>
      }
    >
      <ShopContent products={products} />
    </Suspense>
  );
}
