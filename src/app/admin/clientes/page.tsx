
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const supabase = await createSupabaseServerClient();

  // Verificar que el usuario esté autenticado.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Verificar que sea administrador.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/cuenta");
  }

  // Consultar los perfiles registrados.
  const { data: clients, error: clientsError } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

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
            Clientes
          </h1>

          <p className="mt-3 text-[#20201D]/60">
            Consulta los perfiles registrados en ORIGEN PERFORMANCE.
          </p>
        </div>

        {clientsError ? (
          <div className="mt-10 rounded-2xl bg-[#FAF8F2] p-8">
            <p className="font-semibold text-red-700">
              No se pudieron cargar los perfiles.
            </p>
          </div>
        ) : (
          <div className="mt-10 rounded-3xl bg-[#FAF8F2] p-8 shadow-sm">
            <p className="text-sm text-[#20201D]/60">
              Perfiles mostrados
            </p>

            <p className="mt-2 text-4xl font-bold">
              {clients?.length ?? 0}
            </p>

            <p className="mt-5 text-sm text-[#68705A]">
              {clients?.length
                ? "Los perfiles se consultaron correctamente."
                : "Todavía no hay perfiles registrados."}
            </p>
            
            {clients && clients.length > 0 && (
                <div className="mt-8 overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="border-b border-[#20201D]/10">
                        <tr>
                        <th className="p-4">Nombre</th>
                        <th className="p-4">Tipo de cuenta</th>
                        <th className="p-4">Fecha de registro</th>
                        </tr>
                    </thead>

                    <tbody>
                        {clients.map((client) => (
                        <tr
                            key={client.id}
                            className="border-b border-[#20201D]/10 last:border-0"
                        >
                            <td className="p-4 font-semibold">
                            {client.full_name || "Sin nombre"}
                            </td>

                            <td className="p-4">
                            <span
                                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                                client.role === "admin"
                                    ? "bg-[#68705A]/15 text-[#68705A]"
                                    : "bg-[#20201D]/5 text-[#20201D]/70"
                                }`}
                            >
                                {client.role === "admin"
                                ? "Administrador"
                                : client.role === "customer"
                                    ? "Cliente"
                                    : client.role}
                            </span>
                            </td>

                            <td className="p-4 text-[#20201D]/70">
                            {new Date(client.created_at).toLocaleDateString(
                                "es-MX",
                                {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                }
                            )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            )}

          </div>
        )}
      </div>
    </main>
  );
}
