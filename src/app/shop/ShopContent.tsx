"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import QuickAddButton from "@/components/product/QuickAddButton";
import type { Product } from "@/data/products";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { filterCatalogProducts } from "@/lib/catalog-filters";
import ProductVisual from "@/components/product/ProductVisual";
export default function ShopContent({
  products,
}: {
  products: Product[];
}) {
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  const goals = ["ALL", "BUILD", "ENDURE", "RECOVER", "NOURISH"];

  const goalFromUrl = searchParams.get("goal")?.toUpperCase();

  const activeGoal =
    goalFromUrl && goals.includes(goalFromUrl)
      ? goalFromUrl
      : "ALL";

  function handleGoalChange(goal: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (goal === "ALL") params.delete("goal");
    else params.set("goal", goal);
    const suffix = params.toString();
    // Next syncs useSearchParams with native history, without an RSC request.
    window.history.pushState(null, "", suffix ? `/shop?${suffix}` : "/shop");
  }

  function clearSearch() {
    setQuery("");
    searchInput.current?.focus();
  }

  function resetFilters() {
    clearSearch();
    handleGoalChange("ALL");
  }

  const filteredProducts = filterCatalogProducts(products, query, activeGoal);
  return (
    <main className="min-h-screen bg-[#FAF8F2] text-[#20201D]">
      <Navbar />

      <section className="bg-[#F2EBDD] px-6 pb-16 pt-40">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-[#68705A]">
            ORIGEN SHOP
          </p>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">
            Nutrición seleccionada con un propósito.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#20201D]/60">
            Explora productos seleccionados por formulación, ingredientes,
            transparencia y utilidad dentro de un contexto real.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">

          <div role="search" aria-label="Buscar productos" className="rounded-3xl border border-[#20201D]/10 bg-[#F2EBDD] p-5 sm:p-7">
            <label htmlFor="catalog-search" className="block text-sm font-semibold text-[#20201D]">
              Buscar productos
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                ref={searchInput}
                id="catalog-search"
                type="search"
                name="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={120}
                placeholder="Nombre del producto"
                aria-describedby="catalog-search-help"
                className="min-w-0 flex-1 rounded-2xl border border-[#20201D]/20 bg-[#FAF8F2] px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#68705A]"
              />
              {query.length > 0 && (
                <button type="button" onClick={clearSearch}
                  className="rounded-full border border-[#20201D]/20 px-5 py-3 text-sm font-semibold transition hover:bg-[#FAF8F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68705A]">
                  Limpiar búsqueda
                </button>
              )}
            </div>
            <p id="catalog-search-help" className="mt-3 text-sm text-[#20201D]/60">
              Busca por nombre y combina la búsqueda con los objetivos.
            </p>
          </div>

          <div role="group" aria-label="Filtrar por objetivo" className="mt-6 flex flex-wrap gap-3">
            {goals.map((goal) => {
              const isActive = activeGoal === goal;

              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleGoalChange(goal)}
                  aria-pressed={isActive}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68705A] ${
                    isActive
                      ? "bg-[#20201D] text-[#FAF8F2]"
                      : "border border-[#20201D]/15 text-[#20201D]/55 hover:border-[#20201D] hover:text-[#20201D]"
                  }`}
                >
                  {goal === "ALL" ? "Todos" : goal}
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-between border-b border-[#20201D]/10 pb-4">
            <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-[#20201D]/60">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto" : "productos"}
            </p>

            {activeGoal !== "ALL" && (
              <p className="text-xs font-bold tracking-[0.16em] text-[#68705A]">
                OBJETIVO · {activeGoal}
              </p>
            )}
          </div>
          {(query.length > 0 || activeGoal !== "ALL") && (
            <button type="button" onClick={resetFilters}
              className="my-5 rounded-full border border-[#20201D]/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-[#F2EBDD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68705A]">
              Restablecer filtros
            </button>
          )}
          {filteredProducts.length === 0 && (
            <div className="rounded-3xl border border-[#20201D]/10 bg-[#F2EBDD] px-6 py-12 text-center">
              <h2 className="text-2xl font-bold">No encontramos productos.</h2>
              <p className="mt-3 text-[#20201D]/60">Prueba otro nombre o restablece la búsqueda y los objetivos.</p>
              <button type="button" onClick={resetFilters}
                className="mt-6 rounded-full bg-[#20201D] px-6 py-3 font-semibold text-[#FAF8F2] transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68705A]">
                Ver todos los productos
              </button>
            </div>
          )}
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group min-w-0"
              >
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[2rem] border border-[#20201D]/5 bg-[#F2EBDD] transition duration-300 group-hover:border-[#20201D]/10 group-hover:shadow-lg">

                    {/* Verified */}
                    {product.verified && (
                      <span className="absolute left-5 top-5 z-10 rounded-full bg-[#68705A] px-3 py-2 text-[9px] font-bold tracking-[0.16em] text-white">
                        ✓ ORIGEN VERIFIED
                      </span>
                    )}

                    {/* Número de producto */}
                    <span className="absolute right-5 top-5 text-[10px] font-semibold tracking-[0.15em] text-[#20201D]/30">
                      {String(product.id).padStart(2, "0")}
                    </span>

                    {/* Producto provisional */}
                    {/* Representación visual según el envase */}
                    <ProductVisual product={product} />

                    {/* Ver producto */}
                    <span className="absolute bottom-5 right-5 translate-y-2 text-xs font-semibold text-[#20201D]/0 transition duration-300 group-hover:translate-y-0 group-hover:text-[#20201D]/50">
                      Ver producto →
                    </span>

                  </div>
                </Link>

                <div className="pt-5">

                  {/* Categoría */}
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#68705A]">
                    {product.category}
                  </p>

                  {/* Nombre */}
                  <Link href={`/products/${product.id}`}>
                    <h2 className="mt-2 break-words text-xl font-bold tracking-tight transition-opacity hover:opacity-60">
                      {product.name}
                    </h2>
                  </Link>

                  {/* Descripción */}
                  <p className="mt-2 min-h-12 text-sm leading-6 text-[#20201D]/55">
                    {product.description}
                  </p>

                  {/* Objetivos */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.goal.map((goal) => (
                      <span
                        key={goal}
                        className="rounded-full border border-[#68705A]/20 bg-[#68705A]/5 px-3 py-1 text-[9px] font-bold tracking-[0.12em] text-[#68705A]"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>

                  {/* Precio + Quick Add */}
                  <div className="mt-5 flex items-center justify-between border-t border-[#20201D]/10 pt-4">
                    <div>
                      <p className="text-[9px] font-semibold tracking-[0.15em] text-[#20201D]/35">
                        PRECIO
                      </p>

                      <p className="mt-1 font-bold">
                        ${product.price} MXN
                      </p>
                    </div>

                    <QuickAddButton product={product} />
                  </div>

                </div>
              </article>
          ))}
          </div>
          
        </div>
      </section>
    </main>
  );
}
