import { isPreviewEnvironment } from "@/lib/preview-runtime";

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (isPreviewEnvironment()) return NextResponse.json({ error: "PREVIEW_OPERATION_BLOCKED" }, { status: 403 });
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId || !/^cs_(?:test|live)_[A-Za-z0-9_]+$/.test(sessionId)) {
    return NextResponse.json(
      { error: "Sesión de pago no válida." },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.id !== sessionId || session.mode !== "payment" || session.metadata?.source !== "origen-performance") {
      return NextResponse.json({ error: "Sesion de pago no valida." }, { status: 404 });
    }

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
        console.error("Error al consultar el pedido:");

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
          console.error("Error al verificar productos:");

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
      livemode: session.livemode,
      paid,
      orderConfirmed,
      orderId,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch {
    console.error("Error al verificar el pago:");

    return NextResponse.json(
      { error: "No se pudo verificar el pago." },
      { status: 500 }
    );
  }
}
