
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId || !sessionId.startsWith("cs_test_")) {
    return NextResponse.json(
      { error: "Sesión de pago no válida." },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid =
      session.status === "complete" &&
      session.payment_status === "paid";

    let orderConfirmed = false;
    let orderId: string | null = null;

    if (paid && session.metadata?.source === "origen-performance") {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status, total_amount, currency")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (error) {
        console.error("Error al consultar el pedido:", error);

        return NextResponse.json(
          { error: "No se pudo verificar el pedido." },
          { status: 500 }
        );
      }

      if (
        order &&
        order.id === session.metadata?.order_id &&
        order.payment_status === "paid" &&
        order.total_amount === session.amount_total &&
        order.currency.toLowerCase() ===
          (session.currency ?? "").toLowerCase()
      ) {
        const { data: orderItems, error: itemsError } =
          await supabaseAdmin
            .from("order_items")
            .select("quantity, unit_price")
            .eq("order_id", order.id);

        if (itemsError) {
          console.error("Error al verificar productos:", itemsError);

          return NextResponse.json(
            { error: "No se pudieron verificar los productos." },
            { status: 500 }
          );
        }

        const itemsTotal = (orderItems ?? []).reduce(
          (total, item) => total + item.quantity * item.unit_price,
          0
        );

        if (
          orderItems &&
          orderItems.length > 0 &&
          itemsTotal === order.total_amount
        ) {
          orderConfirmed = true;
          orderId = order.id;
        }
      }
    }

    return NextResponse.json({
      paid,
      orderConfirmed,
      orderId,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    console.error("Error al verificar el pago:", error);

    return NextResponse.json(
      { error: "No se pudo verificar el pago." },
      { status: 500 }
    );
  }
}
