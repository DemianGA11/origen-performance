import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import AddToCart from "@/components/product/AddToCart";
import ProductGallery from "@/components/product/ProductGallery";
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

          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex flex-wrap items-center gap-2 text-sm"
          >
            <Link
              href="/"
              className="text-[#20201D]/45 transition hover:text-[#20201D]"
            >
              Inicio
            </Link>

            <span className="text-[#20201D]/25">/</span>

            <Link
              href="/shop"
              className="text-[#20201D]/45 transition hover:text-[#20201D]"
            >
              Shop
            </Link>

            <span className="text-[#20201D]/25">/</span>

            <span className="font-semibold text-[#20201D]">
              {product.name}
            </span>
          </nav>

          <div className="grid gap-14 lg:grid-cols-2">

            {/* VISUAL DEL PRODUCTO */}

            {/* GALERÍA DEL PRODUCTO */}
            <ProductGallery product={product} />

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

              <AddToCart product={product} />

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