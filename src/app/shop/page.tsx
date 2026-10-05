"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import QuickAddButton from "@/components/product/QuickAddButton";
import { products } from "@/data/products";
import { useRouter, useSearchParams } from "next/navigation";
export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goals = ["ALL", "BUILD", "ENDURE", "RECOVER", "NOURISH"];

  const goalFromUrl = searchParams.get("goal")?.toUpperCase();

  const activeGoal =
    goalFromUrl && goals.includes(goalFromUrl)
      ? goalFromUrl
      : "ALL";

  function handleGoalChange(goal: string) {
    if (goal === "ALL") {
      router.push("/shop");
    } else {
      router.push(`/shop?goal=${goal}`);
    }
  }

  const filteredProducts =
    activeGoal === "ALL"
      ? products
      : products.filter((product) =>
          product.goal.includes(activeGoal)
      );
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

          <div className="mt-10 flex flex-wrap gap-3">
            {goals.map((goal) => {
              const isActive = activeGoal === goal;

              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleGoalChange(goal)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
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
            <p className="text-sm text-[#20201D]/45">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto" : "productos"}
            </p>

            {activeGoal !== "ALL" && (
              <p className="text-xs font-bold tracking-[0.16em] text-[#68705A]">
                OBJETIVO · {activeGoal}
              </p>
            )}
          </div>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group"
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

                    {/* Elemento decorativo */}
                    <div className="absolute h-56 w-56 rounded-full border border-[#20201D]/5" />
                    <div className="absolute h-72 w-72 rounded-full border border-[#20201D]/5" />

                    {/* Producto provisional */}
                    <div className="relative flex h-52 w-40 items-center justify-center rounded-[1.4rem] border border-[#20201D]/10 bg-[#E8E0D0] shadow-[0_18px_40px_rgba(32,32,29,0.08)] transition duration-500 group-hover:-translate-y-3 group-hover:rotate-[-1deg] group-hover:shadow-[0_25px_50px_rgba(32,32,29,0.14)]">

                      <div className="px-5 text-center">
                        <p className="text-[9px] font-semibold tracking-[0.3em] text-[#68705A]">
                          ORIGEN
                        </p>

                        <div className="mx-auto my-4 h-px w-8 bg-[#20201D]/20" />

                        <p className="text-xs font-bold tracking-[0.15em] text-[#20201D]">
                          {product.category}
                        </p>

                        <p className="mt-3 text-[9px] tracking-[0.12em] text-[#20201D]/40">
                          PERFORMANCE NUTRITION
                        </p>
                      </div>

                    </div>

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
                    <h2 className="mt-2 text-xl font-bold tracking-tight transition-opacity hover:opacity-60">
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