
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import OrderStatusControl from "@/components/admin/OrderStatusControl";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();

  // Comprobar identidad.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Comprobar permisos administrativos.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/cuenta");
  }

  const { id } = await params;

  // Consultar el pedido y sus productos.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      total_amount,
      currency,
      payment_status,
      order_status,
      created_at,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      order_items (
        id,
        product_name,
        quantity,
        unit_price
      )
    `)
    .eq("id", id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: (order.currency || "MXN").toUpperCase(),
    }).format(amount / 100);

  return (
    <main className="min-h-screen bg-[#F2EBDD] px-6 py-16 text-[#20201D]">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/pedidos"
          className="text-sm font-semibold text-[#68705A] hover:underline"
        >
          ← Volver a pedidos
        </Link>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#68705A]">
            Administración / Pedidos
          </p>

          <h1 className="mt-4 text-4xl font-bold">
            Detalle del pedido
          </h1>

          <p className="mt-3 break-all text-sm text-[#20201D]/60">
            Referencia: {order.id}
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl bg-[#FAF8F2] p-8">
            <h2 className="text-xl font-semibold">Cliente</h2>

            <p className="mt-5 font-semibold">
              {order.customer_name || "Sin nombre"}
            </p>

            <p className="mt-2 text-sm">
              {order.customer_email || "Sin correo"}
            </p>

            <p className="mt-2 text-sm">
              {order.customer_phone || "Sin teléfono"}
            </p>
          </section>

          <section className="rounded-3xl bg-[#FAF8F2] p-8">
            <h2 className="text-xl font-semibold">Estado</h2>

            <p className="mt-5 text-sm">
              <span className="font-semibold">Pago:</span>{" "}
              {order.payment_status}
            </p>

            <p className="mt-3 text-sm">
              <span className="font-semibold">Pedido:</span>{" "}
              {order.order_status}
            </p>

            <p className="mt-3 text-sm">
              <span className="font-semibold">Fecha:</span>{" "}
              {new Date(order.created_at).toLocaleString("es-MX")}
            </p>
            <OrderStatusControl
                orderId={order.id}
                currentStatus={order.order_status}
                paymentStatus={order.payment_status}
            />
          </section>
        </div>

        <section className="mt-6 rounded-3xl bg-[#FAF8F2] p-8">
          <h2 className="text-xl font-semibold">
            Productos comprados
          </h2>

          <div className="mt-6 divide-y divide-[#20201D]/10">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 py-5"
              >
                <div>
                  <p className="font-semibold">
                    {item.product_name}
                  </p>

                  <p className="mt-1 text-sm text-[#20201D]/60">
                    Cantidad: {item.quantity}
                  </p>

                  <p className="mt-1 text-sm text-[#20201D]/60">
                    Precio unitario: {formatMoney(item.unit_price)}
                  </p>
                </div>

                <p className="font-semibold">
                  {formatMoney(item.unit_price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between border-t border-[#20201D]/10 pt-6">
            <span className="text-lg font-semibold">
              Total
            </span>

            <span className="text-xl font-bold">
              {formatMoney(order.total_amount)}
            </span>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-[#FAF8F2] p-8">
          <h2 className="text-xl font-semibold">
            Dirección de envío
          </h2>

          <p className="mt-5 text-sm leading-7">
            {[
              order.shipping_address,
              order.shipping_city,
              order.shipping_state,
              order.shipping_postal_code,
            ]
              .filter(Boolean)
              .join(", ") || "Sin dirección registrada"}
          </p>
        </section>
      </div>
    </main>
  );
}
