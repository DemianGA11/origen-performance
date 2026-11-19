
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Account = {
  name: string;
  email: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setAccount({
        name: user.user_metadata?.full_name || "Cliente ORIGEN",
        email: user.email || "",
      });

      setLoading(false);
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("No se pudo cerrar la sesión. Intenta nuevamente.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F2EBDD]">
        <p>Preparando tu cuenta...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2EBDD] px-4 pb-16 pt-32 text-[#20201D] sm:px-6">
      <Navbar />
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm font-bold tracking-[0.2em]"
        >
          ORIGEN PERFORMANCE
        </Link>

        <div className="mt-10 rounded-3xl bg-[#FAF8F2] p-5 shadow-sm sm:p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#68705A]">
            Mi cuenta
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            Hola, {account?.name}
          </h1>

          <p className="mt-3 text-[#20201D]/60">
            Bienvenido a tu espacio personal de ORIGEN.
          </p>

          <div className="mt-10 border-t border-[#20201D]/10 pt-8">
            <h2 className="text-xl font-semibold">
              Información personal
            </h2>

            <p className="mt-5 text-sm text-[#20201D]/60">
              Nombre
            </p>
            <p className="mt-1 break-words font-medium">{account?.name}</p>

            <p className="mt-5 text-sm text-[#20201D]/60">
              Correo electrónico
            </p>
            <p className="mt-1 break-words font-medium">{account?.email}</p>
          </div>

          <div className="mt-10 border-t border-[#20201D]/10 pt-8">
            <h2 className="text-xl font-semibold">
              Mis pedidos
            </h2>

            <p className="mt-3 text-sm text-[#20201D]/60">
              Próximamente podrás consultar aquí tus compras y su estado.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-10 rounded-full border border-[#20201D]/20 px-6 py-3 text-sm font-semibold transition hover:bg-[#20201D]/5"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
