
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Configuración del webhook incompleta." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Firma de Stripe no válida:", error);

    return NextResponse.json(
      { error: "Firma del webhook no válida." },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (
        session.metadata?.source === "origen-performance" &&
        session.payment_status === "paid"
      ) {
        const orderId = session.metadata?.order_id;

        if (!orderId || session.amount_total === null || !session.currency) {
          throw new Error("La sesión no contiene datos válidos del pedido.");
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          {
            limit: 100,
            expand: ["data.price.product"],
          }
        );

        if (lineItems.has_more || lineItems.data.length === 0) {
          throw new Error("La lista de productos está incompleta.");
        }

        const orderItems = lineItems.data.map((item) => {
          const stripeProduct = item.price?.product;

          const productId =
            stripeProduct &&
            typeof stripeProduct !== "string" &&
            !stripeProduct.deleted
              ? Number(stripeProduct.metadata.origen_product_id)
              : NaN;

          const quantity = item.quantity ?? 0;
          const productName = item.description;

          if (
            !Number.isSafeInteger(productId) ||
            productId <= 0 ||
            !Number.isSafeInteger(quantity) ||
            quantity <= 0 ||
            !productName ||
            item.currency?.toLowerCase() !== session.currency?.toLowerCase() ||
            item.amount_total % quantity !== 0
          ) {
            throw new Error(
              `Producto inválido en la sesión ${session.id}.`
            );
          }

          return {
            product_id: productId,
            product_name: productName,
            quantity,
            unit_price: item.amount_total / quantity,
          };
        });

        const { error } = await supabaseAdmin.rpc(
          "confirm_stripe_order",
          {
            p_order_id: orderId,
            p_stripe_session_id: session.id,
            p_total_amount: session.amount_total,
            p_currency: session.currency,
            p_items: orderItems,
          }
        );

        if (error) {
          console.error("Error al confirmar el pedido:", error);
          throw new Error("No se pudo confirmar el pedido en Supabase.");
        }

        console.log(
          "Pedido confirmado transaccionalmente:",
          session.id
        );
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;

      if (session.metadata?.source === "origen-performance") {
        const orderId = session.metadata?.order_id;

        if (!orderId) {
          throw new Error("Sesión expirada sin identificador de pedido.");
        }

        const { error } = await supabaseAdmin.rpc(
          "expire_stripe_order",
        {
          p_order_id: orderId,
          p_stripe_session_id: session.id,
        }
      );

        if (error) {
          console.error("Error al expirar el pedido:", error);
          throw new Error("No se pudo actualizar el pedido expirado.");
        }

        console.log("Sesión expirada procesada:", session.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error al procesar el webhook de Stripe:", error);

    return NextResponse.json(
      { error: "No se pudo procesar el evento de Stripe." },
      { status: 500 }
    );
  }
}
