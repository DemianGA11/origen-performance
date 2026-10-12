
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";

type PaymentResult = {
  paid: boolean;
  orderConfirmed: boolean;
  orderId: string | null;
  status: string;
  paymentStatus: string;
  amountTotal: number | null;
  currency: string | null;
};

function CheckoutResultContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { removePurchasedItems } = useCart();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let active = true;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    async function verifyPayment() {
      try {
        const response = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(sessionId!)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("No se pudo consultar el estado del pedido.");
        }

        const data: PaymentResult = await response.json();

        if (!active) return;

        setResult(data);
        setError("");
        setLoading(false);

        if (data.paid && data.orderConfirmed && data.orderId) {
          const snapshotKey = `origen-session-${sessionId}`;
          const processedKey = `origen-processed-${sessionId}`;

          const snapshot = sessionStorage.getItem(snapshotKey);
          const alreadyProcessed = sessionStorage.getItem(processedKey);

          if (snapshot && !alreadyProcessed) {
            try {
              const purchasedItems = JSON.parse(snapshot);

              if (
                Array.isArray(purchasedItems) &&
                purchasedItems.every(
                  (item) =>
                    Number.isSafeInteger(item.productId) &&
                    Number.isSafeInteger(item.quantity) &&
                    item.quantity > 0
                )
              ) {
                removePurchasedItems(purchasedItems);

                sessionStorage.setItem(processedKey, "true");
                sessionStorage.removeItem(snapshotKey);
              }
            } catch (error) {
              console.error(
                "No se pudo actualizar el carrito después del pago:",
                error
              );
            }
          }

          return;
        }

        // Stripe confirmó el pago, pero Supabase todavía puede
        // estar procesando el webhook.
        if (data.paid && !data.orderConfirmed && attempts < 10) {
          attempts += 1;
          retryTimeout = setTimeout(verifyPayment, 2000);
        }
      } catch {
        if (!active) return;

        setLoading(false);
        setError(
          "No pudimos verificar el pedido en este momento. " +
            "No realices otro pago; puedes volver a consultar esta página."
        );
      }
    }

    verifyPayment();

    return () => {
      active = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [sessionId, removePurchasedItems]);

  const orderConfirmed =
    result?.paid === true && result.orderConfirmed === true;

  const paymentPendingRegistration =
    result?.paid === true && !result.orderConfirmed;

  const amount =
    result?.amountTotal != null
      ? (result.amountTotal / 100).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  return (
    <main className="min-h-screen bg-[#F2EBDD] text-[#20201D]">
      <Navbar />

      <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-32">
        <div className="w-full rounded-[2rem] bg-[#FAF8F2] p-8 text-center shadow-sm md:p-14">
          <p className="text-xs font-bold tracking-[0.2em] text-[#68705A]">
            ORIGEN PERFORMANCE · STRIPE
          </p>

          <h1 className="mt-5 text-4xl font-bold md:text-5xl">
            {loading
              ? "Verificando tu compra..."
              : orderConfirmed
                ? "¡Compra confirmada!"
                : paymentPendingRegistration
                  ? "Pago recibido."
                  : "Pago no confirmado."}
          </h1>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-[#20201D]/60">
            {loading
              ? "Estamos verificando el pago y el registro de tu pedido."
              : !sessionId
                ? "No encontramos una sesión de pago para verificar."
                : error
                  ? error
                  : orderConfirmed
                    ? "Tu pago y los productos de tu pedido se registraron correctamente. Esta compra se realizó en el entorno de pruebas; no hubo ningún cobro real."
                    : paymentPendingRegistration
                      ? "Stripe confirmó el pago. Estamos esperando que termine el registro del pedido. No es necesario volver a pagar."
                      : "Stripe todavía no confirma este pago."}
          </p>

          {result?.paid && amount !== null && (
            <p className="mt-8 text-2xl font-bold">
              ${amount} {result.currency?.toUpperCase() ?? "MXN"}
            </p>
          )}

          {orderConfirmed && result?.orderId && (
            <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-[#68705A]/20 bg-[#F2EBDD] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#68705A]">
                Número de pedido
              </p>
              <p className="mt-2 break-all font-mono text-sm">
                {result.orderId}
              </p>
            </div>
          )}

          <div className="mt-10">
            <Link
              href="/shop"
              className="inline-flex rounded-full bg-[#20201D] px-8 py-4 font-semibold text-[#FAF8F2] transition hover:opacity-80"
            >
              Volver a la tienda
            </Link>
          </div>

          <p className="mt-8 text-xs text-[#20201D]/40">
            Entorno de pruebas de ORIGEN PERFORMANCE.
            No se realizaron cargos reales.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F2EBDD] text-[#20201D]">
          <Navbar />
          <section className="flex min-h-screen items-center justify-center px-6">
            <p className="text-lg font-semibold">
              Preparando la verificación del pedido...
            </p>
          </section>
        </main>
      }
    >
      <CheckoutResultContent />
    </Suspense>
  );
}
