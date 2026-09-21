import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { products } from "@/data/products";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;

  const product = products.find(
    (item) => item.id === Number(id)
  );

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#FAF8F2] text-[#20201D]">
      <Navbar />

      <section className="px-6 pb-24 pt-36">
        <div className="mx-auto max-w-7xl">

          <Link
            href="/shop"
            className="mb-10 inline-block text-sm font-semibold text-[#20201D]/50 transition hover:text-[#20201D]"
          >
            ← Volver a la tienda
          </Link>

          <div className="grid gap-14 lg:grid-cols-2">

            {/* VISUAL DEL PRODUCTO */}

            <div className="flex min-h-[550px] items-center justify-center rounded-[2.5rem] bg-[#F2EBDD] p-10">
              <div className="relative flex h-[360px] w-[250px] items-center justify-center rounded-[2rem] border border-[#20201D]/10 bg-[#E8E0D0] shadow-xl">

                {product.verified && (
                  <span className="absolute -right-5 top-7 rounded-full bg-[#68705A] px-4 py-2 text-[10px] font-bold tracking-[0.15em] text-white">
                    ✓ ORIGEN VERIFIED
                  </span>
                )}

                <div className="text-center">
                  <p className="text-2xl font-bold tracking-[0.15em]">
                    ORIGEN
                  </p>

                  <p className="mt-2 text-xs font-semibold tracking-[0.25em] text-[#68705A]">
                    {product.category}
                  </p>

                  <div className="mx-auto my-8 h-px w-16 bg-[#20201D]/20" />

                  <p className="px-6 text-sm font-semibold">
                    {product.name}
                  </p>
                </div>

              </div>
            </div>

            {/* INFORMACIÓN */}

            <div className="flex flex-col justify-center">

              <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#68705A]">
                {product.category}
              </p>

              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                {product.name}
              </h1>

              <p className="mt-4 text-sm font-medium text-[#20201D]/50">
                {product.size}
              </p>

              <p className="mt-7 max-w-xl text-lg leading-8 text-[#20201D]/65">
                {product.longDescription}
              </p>

              <p className="mt-8 text-3xl font-bold">
                ${product.price} MXN
              </p>

              <div className="mt-8 flex gap-3">

                <div className="flex items-center rounded-full border border-[#20201D]/15">
                  <button className="px-5 py-4 text-lg">
                    −
                  </button>

                  <span className="min-w-8 text-center font-semibold">
                    1
                  </span>

                  <button className="px-5 py-4 text-lg">
                    +
                  </button>
                </div>

                <button className="flex-1 rounded-full bg-[#20201D] px-8 py-4 font-semibold text-[#FAF8F2] transition hover:scale-[1.01]">
                  Agregar al carrito
                </button>

              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#20201D]/10 pt-7">

                <div>
                  <p className="text-xs text-[#20201D]/40">
                    ENVÍO
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    México
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#20201D]/40">
                    SELECCIÓN
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Verificada
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#20201D]/40">
                    PAGO
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Seguro
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ORIGEN VERIFIED */}

      <section className="bg-[#20201D] px-6 py-24 text-[#FAF8F2]">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">

          <div>
            <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-[#B9C0A5]">
              ORIGEN VERIFIED
            </p>

            <h2 className="max-w-lg text-4xl font-bold tracking-tight md:text-5xl">
              ¿Por qué está en Origen?
            </h2>

            <p className="mt-6 max-w-xl leading-7 text-[#FAF8F2]/60">
              Evaluamos los productos bajo criterios de ingredientes,
              procedencia, formulación, transparencia y propósito.
            </p>
          </div>

          <div className="space-y-4">
            {product.verifiedReasons.map((reason, index) => (
              <div
                key={reason}
                className="flex gap-5 rounded-2xl border border-white/10 p-5"
              >
                <span className="text-sm font-bold text-[#B9C0A5]">
                  0{index + 1}
                </span>

                <p className="font-medium">
                  {reason}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* INGREDIENTES */}

      <section className="bg-[#F2EBDD] px-6 py-24">
        <div className="mx-auto max-w-7xl">

          <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-[#68705A]">
            TRANSPARENCIA
          </p>

          <h2 className="text-4xl font-bold">
            Lo que contiene.
          </h2>

          <div className="mt-10 max-w-2xl divide-y divide-[#20201D]/10 border-y border-[#20201D]/10">

            {product.ingredients.map((ingredient) => (
              <div
                key={ingredient}
                className="flex items-center justify-between py-5"
              >
                <span className="font-medium">
                  {ingredient}
                </span>

                <span className="text-[#68705A]">
                  ✓
                </span>
              </div>
            ))}

          </div>

        </div>
      </section>

    </main>
  );
}