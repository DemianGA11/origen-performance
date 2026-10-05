import { products } from "@/data/products";
import QuickAddButton from "@/components/product/QuickAddButton";
import Link from "next/link";

export default function FeaturedProducts() {
  return (
    <section id="shop" className="bg-[#F2EBDD] px-6 py-24">
      <div className="mx-auto max-w-7xl">

        {/* Encabezado */}
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-[#68705A]">
              ORIGEN VERIFIED
            </p>

            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Productos destacados.
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-[#20201D]/55">
              Nutrición seleccionada por formulación, transparencia y propósito.
            </p>
          </div>

          <Link
            href="/shop"
            className="text-left text-sm font-semibold transition-opacity hover:opacity-60"
          >
            Ver todos →
          </Link>
        </div>

        {/* Productos */}
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group"
            >

              {/* Visual del producto */}
              <Link href={`/products/${product.id}`} className="block">
                <div className="relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-[2rem] border border-[#20201D]/5 bg-[#FAF8F2] transition duration-300 group-hover:border-[#20201D]/10 group-hover:shadow-lg">

                  {/* Verified */}
                  {product.verified && (
                    <span className="absolute left-5 top-5 z-10 rounded-full bg-[#68705A] px-3 py-2 text-[9px] font-bold tracking-[0.16em] text-white">
                      ✓ ORIGEN VERIFIED
                    </span>
                  )}

                  {/* Número */}
                  <span className="absolute right-5 top-5 text-[10px] font-semibold tracking-[0.15em] text-[#20201D]/30">
                    {String(product.id).padStart(2, "0")}
                  </span>

                  {/* Círculos decorativos */}
                  <div className="absolute h-44 w-44 rounded-full border border-[#20201D]/5" />
                  <div className="absolute h-56 w-56 rounded-full border border-[#20201D]/5" />

                  {/* Packaging provisional */}
                  <div className="relative flex h-44 w-32 items-center justify-center rounded-[1.3rem] border border-[#20201D]/10 bg-[#E8E0D0] shadow-[0_15px_35px_rgba(32,32,29,0.08)] transition duration-500 group-hover:-translate-y-2 group-hover:rotate-[-1deg] group-hover:shadow-[0_22px_45px_rgba(32,32,29,0.13)]">

                    <div className="px-4 text-center">
                      <p className="text-[8px] font-semibold tracking-[0.3em] text-[#68705A]">
                        ORIGEN
                      </p>

                      <div className="mx-auto my-3 h-px w-7 bg-[#20201D]/20" />

                      <p className="text-[10px] font-bold tracking-[0.14em] text-[#20201D]">
                        {product.category}
                      </p>

                      <p className="mt-3 text-[8px] tracking-[0.1em] text-[#20201D]/40">
                        PERFORMANCE NUTRITION
                      </p>
                    </div>

                  </div>

                  {/* Hover */}
                  <span className="absolute bottom-5 right-5 translate-y-2 text-xs font-semibold text-[#20201D]/0 transition duration-300 group-hover:translate-y-0 group-hover:text-[#20201D]/50">
                    Ver producto →
                  </span>

                </div>
              </Link>

              {/* Información */}
              <div className="pt-5">

                <p className="text-[10px] font-bold tracking-[0.2em] text-[#68705A]">
                  {product.category}
                </p>

                <Link href={`/products/${product.id}`}>
                  <h3 className="mt-2 text-xl font-bold tracking-tight transition-opacity hover:opacity-60">
                    {product.name}
                  </h3>
                </Link>

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

                {/* Precio */}
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
  );
}