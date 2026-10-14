
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function createProduct(formData: FormData) {
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

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const packaging = String(formData.get("packaging") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();
  const price = Number(formData.get("price"));

  const validPackaging = [
    "jar",
    "pouch",
    "sachet",
    "bottle",
    "bar",
  ];

  if (
    !name ||
    !category ||
    !validPackaging.includes(packaging) ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    throw new Error("Revisa los datos del producto.");
  }

  const { error } = await supabase.rpc(
    "admin_create_product",
    {
      p_name: name,
      p_category: category,
      p_packaging: packaging,
      p_price: price,
      p_description: description,
      p_size: size,
    }
  );

  if (error) {
    console.error("Error al crear producto:", error);
    throw new Error("No se pudo registrar el producto.");
  }

  revalidatePath("/admin/productos");
  revalidatePath("/shop");
  revalidatePath("/");

  redirect("/admin/productos");
}

export default async function NuevoProductoPage() {
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

  const inputClass =
    "w-full rounded-xl border border-[#DDD8CC] bg-white px-4 py-3 text-[#20201D] outline-none transition focus:border-[#68705A]";

  const labelClass =
    "mb-2 block text-sm font-medium text-[#20201D]";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/admin/productos"
        className="text-sm text-[#68705A] hover:underline"
      >
        ← Volver a productos
      </Link>

      <div className="mt-8 mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68705A]">
          Administración / Productos
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-[#20201D]">
          Agregar producto
        </h1>

        <p className="mt-2 text-[#68705A]">
          Registra un nuevo producto en el catálogo de
          ORIGEN PERFORMANCE.
        </p>
      </div>

      <form
        action={createProduct}
        className="space-y-6 rounded-2xl border border-[#DDD8CC] bg-[#FAF8F2] p-6 shadow-sm sm:p-8"
      >
        <div>
          <label htmlFor="name" className={labelClass}>
            Nombre del producto *
          </label>

          <input
            id="name"
            name="name"
            type="text"
            placeholder="Ej. Proteína Vegetal"
            required
            maxLength={150}
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
              placeholder="Ej. NUTRITION"
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
              step="0.01"
              placeholder="499.00"
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
              defaultValue="jar"
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
              placeholder="Ej. 500 g"
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
            rows={4}
            placeholder="Describe brevemente el producto..."
            className={inputClass}
          />
        </div>

        <div className="rounded-xl bg-[#F2EBDD] p-4">
          <p className="text-sm font-semibold text-[#20201D]">
            Disponibilidad inicial
          </p>

          <p className="mt-2 text-sm text-[#68705A]">
            El producto se registrará como inactivo y con
            0 unidades en inventario. Podrás modificar
            estos valores desde su página de administración.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href="/admin/productos"
            className="rounded-full border border-[#DDD8CC] px-6 py-3 text-center text-sm font-semibold text-[#20201D] transition hover:bg-[#F2EBDD]"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="rounded-full bg-[#20201D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#68705A]"
          >
            Guardar producto
          </button>
        </div>
      </form>
    </main>
  );
}
