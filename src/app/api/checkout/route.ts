import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

type CheckoutCatalogProduct = {
  id: number;
  name: string;
  price: number;
  is_active: boolean;
  stock: number;
};

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
    
    // Supabase es la fuente del catálogo disponible para checkout.
    const { data: catalogProducts, error: catalogError } =
      await supabaseAdmin
        .from("products")
        .select("id, name, price, is_active, stock")
        .in("id", productIds)
        .returns<CheckoutCatalogProduct[]>();

    if (catalogError) {
      console.error(
        "Error al consultar el catálogo de Supabase:",
        catalogError
      );

      return NextResponse.json(
        { error: "No se pudo consultar el catálogo." },
        { status: 500 }
      );
    }

    if (!catalogProducts || catalogProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no existen en el catálogo." },
        { status: 400 }
      );
    }
    
    // Validar precio, disponibilidad y existencias antes de preparar el pago.
    
    
    for (const catalogProduct of catalogProducts) {
    const priceInCents = Math.round(
        Number(catalogProduct.price) * 100
    );

    if (
        !Number.isSafeInteger(priceInCents) ||
        priceInCents <= 0
    ) {
        return NextResponse.json(
        { error: "El producto tiene un precio no válido." },
        { status: 400 }
        );
    }

    if (!catalogProduct.is_active) {
        return NextResponse.json(
        {
            error: `${catalogProduct.name} no está disponible para compra.`,
        },
        { status: 409 }
        );
    }

    const requestedItem = items.find(
        (item) => item.productId === catalogProduct.id
    );

    if (
        !requestedItem ||
        !Number.isSafeInteger(requestedItem.quantity) ||
        requestedItem.quantity < 1 ||
        requestedItem.quantity > 20
    ) {
        return NextResponse.json(
        { error: "Cantidad no válida." },
        { status: 400 }
        );
    }

    if (
        !Number.isSafeInteger(catalogProduct.stock) ||
        catalogProduct.stock < requestedItem.quantity
    ) {
        return NextResponse.json(
        {
            error: `No hay suficientes existencias de ${catalogProduct.name}.`,
        },
        { status: 409 }
        );
    }
    }



    const lineItems = items.map((item) => {
    const catalogProduct = catalogProducts.find(
        (p) => p.id === item.productId
    );

    if (!catalogProduct) {
        throw new Error("Producto no encontrado en Supabase.");
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
      if (catalogProduct.id === 6) {
        throw new Error(
          "Pre-Performance todavía no está disponible para compra."
        );
      }

      return {
        price_data: {
          currency: "mxn",
          
            product_data: {
            name: catalogProduct.name,
            metadata: {
                origen_product_id: String(catalogProduct.id),
            },
            },

          
    unit_amount: Math.round(Number(catalogProduct.price) * 100),

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
    const reservationItems = items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
    }));
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
        if (
            existingOrder.checkout_fingerprint !== checkoutFingerprint
        ) {
            return NextResponse.json(
                {
                    error:
                        "Este intento de pago corresponde a un carrito o datos de compra diferentes.",
                },
                { status: 409 }
            );
        }
        const { data: existingReservations, error: reservationsError } =
  await supabaseAdmin
    .from("inventory_reservations")
    .select("product_id, quantity, status, expires_at")
    .eq("order_id", existingOrder.id);

if (reservationsError) {
  console.error(
    "Error al consultar las reservas:",
    reservationsError
  );

  return NextResponse.json(
    { error: "No se pudo verificar el inventario reservado." },
    { status: 500 }
  );
}

        const reservationsMatch =
        existingReservations?.length === reservationItems.length &&
        reservationItems.every((item) =>
            existingReservations.some(
            (reservation) =>
                reservation.product_id === item.product_id &&
                reservation.quantity === item.quantity &&
                reservation.status === "reserved" &&
                new Date(reservation.expires_at).getTime() > Date.now()
            )
        );

        if (!reservationsMatch) {
        return NextResponse.json(
            {
            error:
                "Este pedido no tiene una reserva de inventario válida. Inicia un nuevo intento de compra.",
            },
            { status: 409 }
        );
        }
        if (!existingOrder.stripe_session_id) {
            const recoveredSession = await stripe.checkout.sessions.create(
                {
                mode: "payment",
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
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
    const { error: reservationError } = await supabaseAdmin.rpc(
        "reserve_inventory_for_order",
        {
            p_order_id: pendingOrder.id,
            p_items: reservationItems,
        }
        );

        if (reservationError) {
        console.error(
            "Error al reservar inventario:",
            reservationError
        );

        return NextResponse.json(
            {
            error:
                "No se pudo reservar el inventario. Verifica la disponibilidad de los productos.",
            },
            { status: 409 }
        );
    }
    let stripeSessionCreated = false;
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
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
    stripeSessionCreated = true;
    
    const { error: sessionError } = await supabaseAdmin.rpc(
        "link_stripe_session_to_order",
        {
            p_order_id: pendingOrder.id,
            p_stripe_session_id: session.id,
            p_expires_at: new Date(
            session.expires_at * 1000
            ).toISOString(),
        }
        );


        if (sessionError) {
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
