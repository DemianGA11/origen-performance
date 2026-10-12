
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    estado?: string;
  }>;
};

export default async function AdminOrdersPage({
  searchParams,
}: Props) {
  const { estado } = await searchParams;

  const estadosPermitidos = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "expired",
  ];

  const estadoSeleccionado =
    estado && estadosPermitidos.includes(estado)
      ? estado
      : "todos";
  const supabase = await createSupabaseServerClient();

  // Verificar que el usuario esté autenticado.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Verificar que tenga permisos administrativos.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/cuenta");
  }

  
  // Preparar la consulta de pedidos.
  let ordersQuery = supabase
    .from("orders")
    .select(
      "id, customer_name, customer_email, total_amount, currency, payment_status, order_status, created_at"
    );

  // Aplicar el filtro únicamente si se seleccionó un estado.
  if (estadoSeleccionado !== "todos") {
    ordersQuery = ordersQuery.eq(
      "order_status",
      estadoSeleccionado
    );
  }

  // Obtener los últimos 50 pedidos que coincidan con el filtro.
  const { data: orders, error: ordersError } = await ordersQuery
    .order("created_at", { ascending: false })
    .limit(50);
    // Contadores generales de pedidos.
    // Se consultan independientemente del filtro seleccionado.
    const [
    { count: pendingCount },
    { count: processingCount },
    { count: shippedCount },
    ] = await Promise.all([
    supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("order_status", "pending")
        .eq("payment_status", "paid"),

    supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("order_status", "processing")
        .eq("payment_status", "paid"),

    supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("order_status", "shipped")
        .eq("payment_status", "paid"),
    ]);


  const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);

  return (
    <main className="min-h-screen bg-[#F2EBDD] px-6 py-16 text-[#20201D]">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-[#68705A] hover:underline"
        >
          ← Volver al panel
        </Link>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#68705A]">
            Administración
          </p>

          <h1 className="mt-4 text-4xl font-bold">
            Pedidos
          </h1>

          <p className="mt-3 text-[#20201D]/60">
            Consulta las compras registradas en ORIGEN PERFORMANCE.
          </p>
        </div>
        
    {/* RESUMEN DE PEDIDOS */}
    <div className="mt-10 grid gap-5 md:grid-cols-3">
        <Link
            href="/admin/pedidos?estado=pending"
            className="rounded-3xl bg-[#FAF8F2] p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
            <p className="text-sm font-medium text-[#20201D]/60">
            Pendientes de preparación
            </p>

            <p className="mt-4 text-4xl font-bold text-[#20201D]">
            {pendingCount ?? 0}
            </p>

            <p className="mt-4 text-xs font-semibold text-[#68705A]">
            Ver pedidos pendientes →
            </p>
        </Link>

        <Link
            href="/admin/pedidos?estado=processing"
            className="rounded-3xl bg-[#FAF8F2] p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
            <p className="text-sm font-medium text-[#20201D]/60">
            En preparación
            </p>

            <p className="mt-4 text-4xl font-bold text-[#B76D4B]">
            {processingCount ?? 0}
            </p>

            <p className="mt-4 text-xs font-semibold text-[#68705A]">
            Ver pedidos en preparación →
            </p>
        </Link>

        <Link
            href="/admin/pedidos?estado=shipped"
            className="rounded-3xl bg-[#FAF8F2] p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
            <p className="text-sm font-medium text-[#20201D]/60">
            Pedidos enviados
            </p>

            <p className="mt-4 text-4xl font-bold text-[#68705A]">
            {shippedCount ?? 0}
            </p>

            <p className="mt-4 text-xs font-semibold text-[#68705A]">
            Ver pedidos enviados →
            </p>
        </Link>
    </div>

        <div className="mt-8 flex flex-wrap gap-3">
            {[
                { label: "Todos", value: "todos" },
                { label: "Pendientes", value: "pending" },
                { label: "En preparación", value: "processing" },
                { label: "Enviados", value: "shipped" },
                { label: "Entregados", value: "delivered" },
                { label: "Cancelados", value: "cancelled" },
                { label: "Expirados", value: "expired" },
            ].map((filter) => {
                const active = estadoSeleccionado === filter.value;

                return (
                <Link
                    key={filter.value}
                    href={
                    filter.value === "todos"
                        ? "/admin/pedidos"
                        : `/admin/pedidos?estado=${filter.value}`
                    }
                    className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                    active
                        ? "border-[#68705A] bg-[#68705A] text-white"
                        : "border-[#68705A]/30 text-[#68705A] hover:border-[#68705A] hover:bg-[#68705A]/10"
                    }`}
                >
                    {filter.label}
                </Link>
                );
            })}
        </div>

        {ordersError ? (
          <div className="mt-10 rounded-2xl bg-white p-6">
            <p className="font-semibold text-red-700">
              No se pudieron cargar los pedidos.
            </p>
            <p className="mt-2 text-sm text-[#20201D]/60">
              Revisa los permisos de Supabase y la terminal de Next.js.
            </p>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-[#FAF8F2] p-8">
            <p className="font-semibold">
              Todavía no hay pedidos registrados.
            </p>
          </div>
        ) : (
          <div className="mt-10 overflow-x-auto rounded-3xl bg-[#FAF8F2] shadow-sm">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-[#20201D]/10">
                <tr>
                  <th className="p-5">Fecha</th>
                  <th className="p-5">Cliente</th>
                  <th className="p-5">Total</th>
                  <th className="p-5">Pago</th>
                  <th className="p-5">Pedido</th>
                  <th className="p-5">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#20201D]/10 last:border-0"
                  >
                    <td className="p-5">
                      {new Date(order.created_at).toLocaleDateString(
                        "es-MX",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </td>

                    <td className="p-5">
                      <p className="font-semibold">
                        {order.customer_name || "Sin nombre"}
                      </p>
                      <p className="mt-1 text-xs text-[#20201D]/60">
                        {order.customer_email || "Sin correo"}
                      </p>
                    </td>

                    <td className="p-5 font-semibold">
                      {formatMoney(
                        order.total_amount,
                        order.currency || "MXN"
                      )}
                    </td>

                    <td className="p-5">
                        <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                            order.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : order.payment_status === "expired" ||
                                    order.payment_status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                        >
                            {({
                            paid: "Pagado",
                            unpaid: "Sin pagar",
                            pending: "Pendiente",
                            expired: "Expirado",
                            failed: "Fallido",
                            refunded: "Reembolsado",
                            } as Record<string, string>)[order.payment_status] ||
                            order.payment_status}
                        </span>
                    </td>

                    <td className="p-5">
                        <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                            order.order_status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : order.order_status === "shipped"
                                ? "bg-blue-100 text-blue-800"
                                : order.order_status === "processing"
                                    ? "bg-amber-100 text-amber-800"
                                    : order.order_status === "cancelled" ||
                                        order.order_status === "expired"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-[#68705A]/10 text-[#68705A]"
                            }`}
                        >
                            {({
                            pending: "Pendiente",
                            processing: "En preparación",
                            shipped: "Enviado",
                            delivered: "Entregado",
                            cancelled: "Cancelado",
                            expired: "Expirado",
                            } as Record<string, string>)[order.order_status] ||
                            order.order_status}
                        </span>
                    </td>
                    <td className="p-5">
                        <Link
                            href={`/admin/pedidos/${order.id}`}
                            className="inline-flex whitespace-nowrap rounded-full border border-[#68705A] px-4 py-2 text-xs font-semibold text-[#68705A] transition hover:bg-[#68705A] hover:text-white"
                        >
                            Ver detalle →
                        </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
