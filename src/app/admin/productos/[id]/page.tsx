
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import StockEditor from "./StockEditor";
import StatusEditor from "./StatusEditor";
import ImageUploader from "./ImageUploader";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductoDetallePage({
  params,
}: PageProps) {
  const supabase = await createSupabaseServerClient();

  // 1. Verificar que el usuario haya iniciado sesión.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Verificar que tenga permisos de administrador.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/cuenta");
  }

  // 3. Obtener y validar el identificador del producto.
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    notFound();
  }

  // 4. Consultar el producto en Supabase.
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(
      "id, name, category, description, price, stock, is_active, size, images"
    )
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    throw new Error("No se pudo consultar el producto.");
  }

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F2EBDD] px-6 py-12 text-[#20201D]">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/productos"
          className="text-sm font-semibold text-[#68705A] hover:underline"
        >
          ← Volver a productos
        </Link>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#68705A]">
            Administración / Productos
          </p>

          
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold">
              {product.name}
            </h1>

            <Link
              href={`/admin/productos/${product.id}/editar`}
              className="inline-flex items-center justify-center rounded-full
                bg-[#20201D] px-6 py-3 text-sm font-semibold
                text-[#FAF8F2] transition-colors hover:bg-[#68705A]"
            >
              Editar información
            </Link>
          </div>

          <p className="mt-3 text-[#20201D]/60">
            Información registrada en Supabase.
          </p>

        </div>

        <div className="mt-8 rounded-3xl bg-[#FAF8F2] p-8 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#68705A]">ID</p>
              <p className="mt-1 font-semibold">{product.id}</p>
            </div>

            <div>
              <p className="text-sm text-[#68705A]">Categoría</p>
              <p className="mt-1 font-semibold">{product.category}</p>
            </div>

            <div>
              <p className="text-sm text-[#68705A]">Precio</p>
              <p className="mt-1 text-2xl font-bold">
                ${Number(product.price).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-[#68705A]">Existencias</p>
              <p className="mt-1 text-2xl font-bold">{product.stock}</p>
            </div>

            <div>
              <p className="text-sm text-[#68705A]">Presentación</p>
              <p className="mt-1 font-semibold">{product.size}</p>
            </div>

            <div>
              <p className="text-sm text-[#68705A]">Estado</p>
              <p className="mt-1 font-semibold">
                {product.is_active ? "Activo" : "Inactivo"}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-[#20201D]/10 pt-6">
            <p className="text-sm text-[#68705A]">Descripción</p>
            <p className="mt-2 leading-7">{product.description}</p>
          </div>
        </div>
        
        <ImageUploader
          productId={product.id}
          initialImages={product.images ?? []}
        />

        <StockEditor
        productId={product.id}
        initialStock={product.stock}
        />
        
        <StatusEditor
        productId={product.id}
        initialIsActive={product.is_active}
        />

        <p className="mt-6 text-sm text-[#68705A]">
          Los cambios de inventario y disponibilidad se guardan en Supabase
          y se utilizan para validar las compras en Stripe Checkout.
        </p>

      </div>
    </main>
  );
}
