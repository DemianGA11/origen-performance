import Link from "next/link";
import Navbar from "@/components/Navbar";
import QuickAddButton from "@/components/product/QuickAddButton";
import { products } from "@/data/products";

export default function ShopPage() {
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

          <div className="mb-10 flex flex-col gap-5 border-b border-[#20201D]/10 pb-6 md:flex-row md:items-center md:justify-between">

            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-[#20201D] px-5 py-2 text-sm font-semibold text-white">
                Todos
              </button>

              <button className="rounded-full border border-[#20201D]/15 px-5 py-2 text-sm font-semibold">
                Build
              </button>

              <button className="rounded-full border border-[#20201D]/15 px-5 py-2 text-sm font-semibold">
                Endure
              </button>

              <button className="rounded-full border border-[#20201D]/15 px-5 py-2 text-sm font-semibold">
                Recover
              </button>

              <button className="rounded-full border border-[#20201D]/15 px-5 py-2 text-sm font-semibold">
                Nourish
              </button>
            </div>

            <p className="text-sm text-[#20201D]/50">
              {products.length} productos
            </p>

          </div>

          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <article key={product.id} className="group">

                <Link href={`/products/${product.id}`}>
                  <div className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-3xl bg-[#F2EBDD]">

                    {product.verified && (
                      <span className="absolute left-4 top-4 rounded-full bg-[#68705A] px-3 py-2 text-[10px] font-bold tracking-[0.15em] text-white">
                        ✓ VERIFIED
                      </span>
                    )}

                    <div className="flex h-48 w-36 items-center justify-center rounded-2xl border border-[#20201D]/10 bg-[#E8E0D0] shadow-sm transition duration-300 group-hover:-translate-y-2 group-hover:shadow-lg">
                      <span className="px-4 text-center text-xs font-bold tracking-[0.15em]">
                        ORIGEN
                        <br />
                        {product.category}
                      </span>
                    </div>

                  </div>
                </Link>

                <div className="pt-5">
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#68705A]">
                    {product.category}
                  </p>

                  <Link href={`/products/${product.id}`}>
                    <h2 className="mt-2 text-xl font-bold transition-opacity hover:opacity-60">
                      {product.name}
                    </h2>
                  </Link>

                  <p className="mt-2 min-h-12 text-sm leading-6 text-[#20201D]/55">
                    {product.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <p className="font-semibold">
                      ${product.price} MXN
                    </p>

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