
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  // 1. Verificar la identidad del usuario.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }
  

  // 2. Consultar su rol en la base de datos.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  
  // 3. Bloquear a cualquier usuario que no sea administrador.
  if (profileError || profile?.role !== "admin") {
    redirect("/cuenta");
  }
  
  // 4. Consultar los indicadores de pedidos pagados.
  const [
    { count: pendingCount, error: pendingError },
    { count: processingCount, error: processingError },
    { count: shippedCount, error: shippedError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .eq("order_status", "pending"),

    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .eq("order_status", "processing"),

    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .eq("order_status", "shipped"),
  ]);

  const countersError =
    pendingError || processingError || shippedError;
  
  // Consultar el número total de productos registrados.
  const {
    count: productsCount,
    error: productsError,
  } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  // Consultar el número de cuentas de clientes.
  const {
    count: customersCount,
    error: customersError,
  } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");

  return (
    <main className="min-h-screen bg-[#F2EBDD] px-6 py-16 text-[#20201D]">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-bold tracking-[0.2em]"
        >
          ORIGEN PERFORMANCE
        </Link>

        <div className="mt-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#68705A]">
            Administración
          </p>

          <h1 className="mt-4 text-4xl font-bold">
            Panel administrativo
          </h1>

          <p className="mt-4 text-[#20201D]/60">
            Bienvenido, {profile.full_name || "Administrador"}.
            Desde aquí podrás gestionar las operaciones de ORIGEN PERFORMANCE.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          
        
        <Link
            href="/admin/pedidos"
            className="group block rounded-3xl bg-[#FAF8F2] p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
            <h2 className="text-xl font-semibold">
                Pedidos
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#20201D]/60">
                Consulta las compras realizadas y administra su estado.
            </p>

            {countersError ? (
                <p className="mt-6 text-sm text-red-700">
                No se pudieron cargar los indicadores.
                </p>
            ) : (
                <div className="mt-7 grid grid-cols-3 gap-3 border-t border-[#20201D]/10 pt-6">
                <div>
                    <p className="text-3xl font-bold text-[#20201D]">
                    {pendingCount ?? 0}
                    </p>
                    <p className="mt-2 text-xs text-[#20201D]/60">
                    Pendientes
                    </p>
                </div>

                <div>
                    <p className="text-3xl font-bold text-[#B76D4B]">
                    {processingCount ?? 0}
                    </p>
                    <p className="mt-2 text-xs text-[#20201D]/60">
                    En preparación
                    </p>
                </div>

                <div>
                    <p className="text-3xl font-bold text-[#68705A]">
                    {shippedCount ?? 0}
                    </p>
                    <p className="mt-2 text-xs text-[#20201D]/60">
                    Enviados
                    </p>
                </div>
                </div>
            )}

            <p className="mt-8 text-sm font-semibold text-[#68705A] transition group-hover:translate-x-1">
                Ver pedidos →
            </p>
        </Link>
        <Link
            href="/admin/clientes"
            className="group block rounded-3xl bg-[#FAF8F2] p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
            <h2 className="text-xl font-semibold">
                Clientes
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#20201D]/60">
                Consulta las cuentas registradas en la tienda.
            </p>

            <div className="mt-7 border-t border-[#20201D]/10 pt-6">
                {customersError ? (
                <p className="text-sm text-red-700">
                    No se pudo cargar el número de clientes.
                </p>
                ) : (
                <>
                    <p className="text-4xl font-bold text-[#68705A]">
                    {customersCount ?? 0}
                    </p>

                    <p className="mt-2 text-xs text-[#20201D]/60">
                    Clientes registrados
                    </p>
                </>
                )}
            </div>

            <p className="mt-8 text-sm font-semibold text-[#68705A] transition group-hover:translate-x-1">
                Ver clientes →
            </p>
        </Link> 
        <Link
        href="/admin/productos"
        className="group block rounded-3xl bg-[#FAF8F2] p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
        <h2 className="text-xl font-semibold">
            Productos
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#20201D]/60">
            Consulta el catálogo, los precios y las existencias de productos.
        </p>

        
        <div className="mt-7 border-t border-[#20201D]/10 pt-6">
            {productsError ? (
                <p className="text-sm text-red-700">
                No se pudo cargar el número de productos.
                </p>
        ) : (
            <>
                <p className="text-4xl font-bold text-[#68705A]">
                    {productsCount ?? 0}
                </p>

                <p className="mt-2 text-xs text-[#20201D]/60">
                    Productos registrados
                </p>
            </>
            )}
        </div>


        <p className="mt-8 text-sm font-semibold text-[#68705A] transition group-hover:translate-x-1">
            Ver productos →
        </p>
        </Link>

        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex rounded-full border border-[#20201D]/20 px-6 py-3 text-sm font-semibold transition hover:bg-[#20201D]/5"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
