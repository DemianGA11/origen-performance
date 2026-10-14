
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function updateProduct(formData: FormData) {
  "use server";

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("No tienes permisos de administrador.");
  }

  const productId = Number(formData.get("productId"));
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const packaging = String(formData.get("packaging") ?? "");
  const price = Number(formData.get("price"));
  const size = String(formData.get("size") ?? "").trim();
  const description = String(
    formData.get("description") ?? ""
  ).trim();

  
    const longDescription = String(
    formData.get("longDescription") ?? ""
    ).trim();

    const ingredients = String(
    formData.get("ingredients") ?? ""
    )
    .split("\n")
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient.length > 0);


  const validPackaging = [
    "jar",
    "pouch",
    "sachet",
    "bottle",
    "bar",
  ];

  if (
    !Number.isSafeInteger(productId) ||
    productId <= 0 ||
    !name ||
    name.length > 150 ||
    !category ||
    !validPackaging.includes(packaging) ||
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 99999999.99
  ) {
    throw new Error("Los datos del producto no son válidos.");
  }

  const { error } = await supabase.rpc(
    "admin_update_product_info",
    {
      p_product_id: productId,
      p_name: name,
      p_category: category,
      p_packaging: packaging,
      p_price: price,
      p_description: description,
      p_size: size,
    }
  );

  if (error) {
    console.error("Error al actualizar producto:", error);
    throw new Error("No se pudo actualizar el producto.");
  }

  
    const { error: detailsError } = await supabase.rpc(
    "admin_update_product_details",
    {
        p_product_id: productId,
        p_long_description: longDescription,
        p_ingredients: ingredients,
    }
    );

    if (detailsError) {
    console.error(
        "Error al actualizar detalles del producto:",
        detailsError
    );

    throw new Error(
        "Se actualizó la información básica, pero no se pudieron guardar los detalles del producto."
    );
    }


  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath(`/admin/productos/${productId}/editar`);
  revalidatePath("/shop");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/");

  redirect(`/admin/productos/${productId}`);
}

export default async function EditarProductoPage({
  params,
}: PageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/cuenta");
  }

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    notFound();
  }

  const { data: product, error } = await supabase
    .from("products")
    .select(
        "id, name, category, packaging, price, size, description, long_description, ingredients"
    )
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo consultar el producto.");
  }

  if (!product) {
    notFound();
  }

  const inputClass =
    "w-full rounded-xl border border-[#DDD8CC] bg-white px-4 py-3 text-[#20201D] outline-none transition focus:border-[#68705A]";

  const labelClass =
    "mb-2 block text-sm font-medium text-[#20201D]";

  return (
    <main className="min-h-screen bg-[#F2EBDD] px-6 py-12 text-[#20201D]">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/admin/productos/${product.id}`}
          className="text-sm font-semibold text-[#68705A] hover:underline"
        >
          ← Volver al producto
        </Link>

        <div className="mt-10 mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68705A]">
            Administración / Productos
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Editar información
          </h1>

          <p className="mt-2 text-[#68705A]">
            Actualiza los datos comerciales de {product.name}.
          </p>
        </div>

        <form
          action={updateProduct}
          className="space-y-6 rounded-2xl border border-[#DDD8CC] bg-[#FAF8F2] p-6 shadow-sm sm:p-8"
        >
          <input
            type="hidden"
            name="productId"
            value={product.id}
          />

          <div>
            <label htmlFor="name" className={labelClass}>
              Nombre del producto *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={product.name}
              maxLength={150}
              required
              className={inputClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className={labelClass}>
                Categoría *
              </label>
              <input
                id="category"
                name="category"
                type="text"
                defaultValue={product.category}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="price" className={labelClass}>
                Precio (MXN) *
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0.01"
                max="99999999.99"
                step="0.01"
                defaultValue={Number(product.price)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="packaging" className={labelClass}>
                Tipo de presentación *
              </label>
              <select
                id="packaging"
                name="packaging"
                defaultValue={product.packaging}
                required
                className={inputClass}
              >
                <option value="jar">Bote / Frasco</option>
                <option value="pouch">Bolsa</option>
                <option value="sachet">Sobre</option>
                <option value="bottle">Botella</option>
                <option value="bar">Barra</option>
              </select>
            </div>

            <div>
              <label htmlFor="size" className={labelClass}>
                Contenido / Tamaño
              </label>
              <input
                id="size"
                name="size"
                type="text"
                defaultValue={product.size ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Descripción breve
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={product.description ?? ""}
              className={inputClass}
            />
          </div>

          
            <div>
                <label htmlFor="longDescription" className={labelClass}>
                    Descripción larga
                </label>

                <textarea
                    id="longDescription"
                    name="longDescription"
                    rows={6}
                    defaultValue={product.long_description ?? ""}
                    placeholder="Explica los ingredientes, características y usos del producto..."
                    className={inputClass}
                />

                <p className="mt-2 text-xs text-[#68705A]">
                    Esta descripción aparecerá en la ficha detallada del producto.
                </p>
            </div>

            
            <div>
                <label htmlFor="ingredients" className={labelClass}>
                    Ingredientes
                </label>

                <textarea
                    id="ingredients"
                    name="ingredients"
                    rows={5}
                    defaultValue={(product.ingredients ?? []).join("\n")}
                    placeholder={"Ejemplo:\nMiel de abeja (100 %)"}
                    className={inputClass}
                />

                <p className="mt-2 text-xs text-[#68705A]">
                    Escribe un ingrediente por línea. El sistema los guardará
                    como una lista en Supabase.
                </p>
            </div>


            <div className="rounded-xl bg-[#F2EBDD] p-4">
                <p className="text-sm font-semibold">
                    Información del inventario
                </p>
                <p className="mt-2 text-sm text-[#68705A]">
                    Este formulario no modifica las existencias ni
                    el estado del producto. Puedes administrarlos
                    desde su página de detalles.
                </p>
            </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link
              href={`/admin/productos/${product.id}`}
              className="rounded-full border border-[#DDD8CC] px-6 py-3 text-center text-sm font-semibold transition hover:bg-[#F2EBDD]"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="rounded-full bg-[#20201D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#68705A]"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
