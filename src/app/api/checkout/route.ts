import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { products } from "@/data/products";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createHash } from "node:crypto";
export const runtime = "nodejs";

type CheckoutItem = {
  productId: number;
  quantity: number;
};

export async function POST(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key");

    if (
    !idempotencyKey ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idempotencyKey
    )
    ) {
    return NextResponse.json(
        { error: "Identificador de compra no válido." },
        { status: 400 }
    );
    }
    const body = await request.json();
    const customer = body.customer;
    const shipping = body.shipping;

    function isValidText(value: unknown, maxLength: number): value is string {
    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim().length <= maxLength
    );
    }

    const validCustomer =
    customer &&
    isValidText(customer.firstName, 80) &&
    isValidText(customer.lastName, 80) &&
    typeof customer.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) &&
    customer.email.length <= 254 &&
    typeof customer.phone === "string" &&
    /^\d{10}$/.test(customer.phone);

    const validShipping =
    shipping &&
    isValidText(shipping.address, 250) &&
    isValidText(shipping.city, 100) &&
    isValidText(shipping.state, 100) &&
    typeof shipping.postalCode === "string" &&
    /^\d{5}$/.test(shipping.postalCode);

    if (!validCustomer || !validShipping) {
    return NextResponse.json(
        { error: "Los datos del cliente o envío no son válidos." },
        { status: 400 }
    );
    }
    const items: CheckoutItem[] = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío." },
        { status: 400 }
      );
    }
    const productIds = items.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
        return NextResponse.json(
            { error: "El carrito contiene productos duplicados." },
            { status: 400 }
        );
    }

    const lineItems = items.map((item) => {
      const product = products.find(
        (p) => p.id === item.productId
      );

      if (!product) {
        throw new Error("Producto no válido.");
      }

      if (
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20
      ) {
        throw new Error("Cantidad no válida.");
      }

      // No permitir vender productos cuya formulación
      // todavía no está definida.
      if (product.id === 6) {
        throw new Error(
          "Pre-Performance todavía no está disponible para compra."
        );
      }

      return {
        price_data: {
          currency: "mxn",
          product_data: {
            name: product.name,
            metadata: {
                origen_product_id: String(product.id),
            },
        },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      };
    });
    const totalAmount = lineItems.reduce(
        (total, item) =>
            total + item.price_data.unit_amount * item.quantity,
        0
    );
    const checkoutFingerprint = createHash("sha256")
    .update(
        JSON.stringify({
        items: items
            .map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            }))
            .sort((a, b) => a.productId - b.productId),

        customer: {
            firstName: customer.firstName.trim(),
            lastName: customer.lastName.trim(),
            email: customer.email.trim().toLowerCase(),
            phone: customer.phone,
        },

        shipping: {
            address: shipping.address.trim(),
            city: shipping.city.trim(),
            state: shipping.state.trim(),
            postalCode: shipping.postalCode,
        },

        totalAmount,
        currency: "mxn",
        })
    )
    .digest("hex");
    const { data: existingOrder, error: existingOrderError } =
    await supabaseAdmin
        .from("orders")
        .select("id, stripe_session_id, payment_status, checkout_fingerprint")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

    if (existingOrderError) {
    console.error(
        "Error al buscar un pedido existente:",
        existingOrderError
    );

    return NextResponse.json(
        { error: "No se pudo verificar el intento de compra." },
        { status: 500 }
    );
    }

    if (existingOrder) {
        if (!existingOrder.stripe_session_id) {
            const recoveredSession = await stripe.checkout.sessions.create(
                {
                mode: "payment",
                metadata: {
                    source: "origen-performance",
                    order_id: existingOrder.id,
                },
                line_items: lineItems,
                success_url: `${request.nextUrl.origin}/checkout/resultado?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${request.nextUrl.origin}/checkout?stripe=cancel`,
                },
                {
                idempotencyKey: idempotencyKey,
                }
            );

            if (
                recoveredSession.status !== "open" ||
                !recoveredSession.url ||
                recoveredSession.metadata?.order_id !== existingOrder.id
                ) {
                return NextResponse.json(
                    {
                    error:
                        "La sesión de pago ya terminó, expiró o no corresponde al pedido.",
                    },
                    { status: 409 }
                );
            }

            const { data: linkedOrder, error: linkError } = await supabaseAdmin
                .from("orders")
                .update({
                stripe_session_id: recoveredSession.id,
                })
                .eq("id", existingOrder.id)
                .is("stripe_session_id", null)
                .select("id")
                .maybeSingle();

            if (linkError || !linkedOrder) {
                console.error("No se pudo vincular la sesión recuperada:", linkError);

                return NextResponse.json(
                { error: "No se pudo recuperar el pedido de forma segura." },
                { status: 409 }
                );
            }

            return NextResponse.json({
                url: recoveredSession.url,
                sessionId: recoveredSession.id,
            });
        }

        const existingSession = await stripe.checkout.sessions.retrieve(
            existingOrder.stripe_session_id
        );

        if (
            existingSession.status === "open" &&
            existingSession.url &&
            existingSession.metadata?.order_id === existingOrder.id
        ) {
            return NextResponse.json({
                url: existingSession.url,
                sessionId: existingSession.id,
            });
        }

        return NextResponse.json(
            {
            error: "Esta sesión de pago ya terminó o expiró.",
            },
            { status: 409 }
        );
    }
    const { data: pendingOrder, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
        idempotency_key: idempotencyKey,
        checkout_fingerprint: checkoutFingerprint,
        customer_email: customer.email.trim().toLowerCase(),
        customer_name: `${customer.firstName.trim()} ${customer.lastName.trim()}`,
        customer_phone: customer.phone,
        shipping_address: shipping.address.trim(),
        shipping_city: shipping.city.trim(),
        shipping_state: shipping.state.trim(),
        shipping_postal_code: shipping.postalCode,
        total_amount: totalAmount,
        currency: "mxn",
        payment_status: "pending",
        order_status: "pending",
    })
    .select("id")
    .single();

    if (orderError || !pendingOrder) {
        if (orderError?.code === "23505") {
            return NextResponse.json(
            {
                error:
                "Este intento de compra ya está siendo procesado. Inténtalo nuevamente en unos segundos.",
            },
            { status: 409 }
            );
        }

        console.error("Error al crear pedido pendiente:", orderError);

        return NextResponse.json(
            { error: "No se pudo preparar el pedido." },
            { status: 500 }
        );
    }
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        metadata: {
            source: "origen-performance",
            order_id: pendingOrder.id,
        },
      
      line_items: lineItems,
      success_url: `${request.nextUrl.origin}/checkout/resultado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/checkout?stripe=cancel`,
    }, {
    idempotencyKey: idempotencyKey,
    });
    const { data: linkedOrder, error: sessionError } = await supabaseAdmin
        .from("orders")
        .update({
            stripe_session_id: session.id,
        })
        .eq("id", pendingOrder.id)
        .is("stripe_session_id", null)
        .eq("payment_status", "pending")
        .select("id")
        .maybeSingle();

        if (sessionError || !linkedOrder) {
        console.error(
            "Error al vincular Stripe con el pedido:",
            sessionError
        );

        return NextResponse.json(
            { error: "No se pudo vincular el pedido con Stripe." },
            { status: 500 }
        );
    }
    return NextResponse.json({
        url: session.url,
        sessionId: session.id,
    });
  } catch (error) {
    console.error("Error al crear sesión de Stripe:", error);

    return NextResponse.json(
      { error: "No se pudo iniciar el pago." },
      { status: 400 }
    );
  }
}