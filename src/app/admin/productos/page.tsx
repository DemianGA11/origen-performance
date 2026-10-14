
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminProductosPage() {
  const supabase = await createSupabaseServerClient();

  // Verificar que el usuario haya iniciado sesión.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar permisos de administrador.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/cuenta");
  }

  // Obtener el catálogo directamente desde Supabase.
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, category, price, stock, is_active")
    .order("id", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar los productos.");
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/admin"
        className="text-sm text-[#68705A] hover:underline"
      >
        ← Volver al panel
      </Link>

      
      <div className="mt-8 mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#20201D]">
            Productos
          </h1>

          <p className="mt-2 text-[#68705A]">
            Administra el catálogo de ORIGEN PERFORMANCE.
          </p>
        </div>

        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center justify-center rounded-full bg-[#20201D] px-6 py-3 text-sm font-semibold text-[#FAF8F2] transition-colors hover:bg-[#68705A]"
        >
          + Agregar producto
        </Link>
      </div>


      <div className="mb-6 rounded-xl border border-[#DDD8CC] bg-white p-5">
        <p className="text-sm text-[#68705A]">
          Productos registrados
        </p>

        <p className="mt-1 text-3xl font-semibold text-[#20201D]">
          {products?.length ?? 0}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#DDD8CC] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#DDD8CC] bg-[#F2EBDD]">
            <tr>
              <th className="px-5 py-4 font-semibold">Producto</th>
              <th className="px-5 py-4 font-semibold">Categoría</th>
              <th className="px-5 py-4 font-semibold">Precio</th>
              <th className="px-5 py-4 font-semibold">Stock</th>
              <th className="px-5 py-4 font-semibold">Estado</th>
              <th className="px-5 py-4 font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {(products ?? []).map((product) => (
              <tr
                key={product.id}
                className="border-b border-[#EEEAE1] last:border-b-0"
              >
                <td className="px-5 py-4 font-medium text-[#20201D]">
                  {product.name}
                </td>

                <td className="px-5 py-4 text-[#68705A]">
                  {product.category}
                </td>

                <td className="px-5 py-4">
                  ${Number(product.price).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>

                <td className="px-5 py-4">{product.stock}</td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      product.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-[#F2EBDD] text-[#68705A]"
                    }`}
                  >
                    {product.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                
                <td className="px-5 py-4">
                <Link
                    href={`/admin/productos/${product.id}`}
                    className="font-semibold text-[#68705A] hover:underline"
                >
                    Ver detalles →
                </Link>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 text-sm text-[#68705A]">
        Los productos y precios se obtienen de Supabase.
        La disponibilidad de compra depende del estado del producto
        y de sus existencias.
      </p>
    </main>
  );
}
