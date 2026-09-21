import { products } from "@/data/products";
import Link from "next/link";
export default function FeaturedProducts() {
  return (
    <section id="shop" className="bg-[#F2EBDD] px-6 py-24">
      <div className="mx-auto max-w-7xl">

        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-[#68705A]">
              ORIGEN VERIFIED
            </p>

            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Productos destacados.
            </h2>
          </div>

          <Link
            href="/shop"
            className="text-left text-sm font-semibold"
          >
            Ver todos →
            </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <article key={product.id} className="group">

              <div className="relative mb-5 flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-[#FAF8F2]">

                {product.verified && (
                  <span className="absolute left-4 top-4 rounded-full bg-[#68705A] px-3 py-2 text-[10px] font-bold tracking-[0.15em] text-white">
                    ✓ VERIFIED
                  </span>
                )}

                <div className="flex h-44 w-32 items-center justify-center rounded-2xl border border-[#20201D]/10 bg-[#E8E0D0] transition duration-300 group-hover:-translate-y-2">
                  <span className="px-4 text-center text-xs font-bold tracking-[0.15em]">
                    ORIGEN
                    <br />
                    {product.category}
                  </span>
                </div>

              </div>

              <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-[#68705A]">
                {product.category}
              </p>

              <h3 className="text-xl font-bold">
                {product.name}
              </h3>

              <p className="mt-2 min-h-12 text-sm leading-6 text-[#20201D]/60">
                {product.description}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <p className="font-semibold">
                  ${product.price} MXN
                </p>

                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#20201D]/20 transition hover:bg-[#20201D] hover:text-white">
                  +
                </button>
              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  );
}