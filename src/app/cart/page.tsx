"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
  } = useCart();

  return (
    <main className="min-h-screen bg-[#FAF8F2] text-[#20201D]">
      <Navbar />

      <section className="px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl">

          <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-[#68705A]">
            TU CARRITO
          </p>

          <h1 className="text-5xl font-bold tracking-tight">
            Tu selección.
          </h1>

          {items.length === 0 ? (
            <div className="mt-16 rounded-3xl bg-[#F2EBDD] p-12 text-center">

              <p className="text-xl font-semibold">
                Tu carrito está vacío.
              </p>

              <p className="mt-3 text-[#20201D]/55">
                Explora nuestra selección y encuentra productos
                que tengan sentido para tus objetivos.
              </p>

              <Link
                href="/shop"
                className="mt-7 inline-block rounded-full bg-[#20201D] px-7 py-3 font-semibold text-white"
              >
                Explorar productos
              </Link>

            </div>
          ) : (
            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">

              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.product.id}
                    className="flex gap-5 rounded-3xl border border-[#20201D]/10 bg-white p-5"
                  >

                    <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#F2EBDD]">
                      <span className="text-center text-[9px] font-bold tracking-[0.12em]">
                        ORIGEN
                        <br />
                        {item.product.category}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between">

                      <div className="flex justify-between gap-4">

                        <div>
                          <p className="text-xs font-semibold text-[#68705A]">
                            {item.product.category}
                          </p>

                          <h2 className="mt-1 font-bold">
                            {item.product.name}
                          </h2>

                          <p className="mt-1 text-sm text-[#20201D]/45">
                            {item.product.size}
                          </p>
                        </div>

                        <p className="font-semibold">
                          $
                          {item.product.price *
                            item.quantity}{" "}
                          MXN
                        </p>

                      </div>

                      <div className="mt-5 flex items-center justify-between">

                        <div className="flex items-center rounded-full border border-[#20201D]/15">

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1
                              )
                            }
                            className="px-4 py-2"
                          >
                            −
                          </button>

                          <span className="min-w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1
                              )
                            }
                            className="px-4 py-2"
                          >
                            +
                          </button>

                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(item.product.id)
                          }
                          className="text-sm text-[#20201D]/45 underline"
                        >
                          Eliminar
                        </button>

                      </div>

                    </div>
                  </article>
                ))}
              </div>

              <aside className="h-fit rounded-3xl bg-[#F2EBDD] p-7">

                <h2 className="text-xl font-bold">
                  Resumen
                </h2>

                <div className="mt-7 flex justify-between text-sm">
                  <span className="text-[#20201D]/55">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    ${subtotal} MXN
                  </span>
                </div>

                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-[#20201D]/55">
                    Envío
                  </span>

                  <span>
                    Calculado al finalizar
                  </span>
                </div>

                <div className="my-6 border-t border-[#20201D]/10" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${subtotal} MXN</span>
                </div>

                <button className="mt-7 w-full rounded-full bg-[#20201D] px-6 py-4 font-semibold text-white">
                  Continuar al checkout →
                </button>

              </aside>

            </div>
          )}

        </div>
      </section>
    </main>
  );
}