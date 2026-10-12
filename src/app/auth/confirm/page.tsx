
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ConfirmPage() {
  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  useEffect(() => {
    let active = true;

    async function checkConfirmation() {
      try {
        // Supabase procesa los tokens de la URL
        // y recupera la sesión del usuario.
        const { data, error } = await supabase.auth.getSession();

        if (!active) return;

        if (error || !data.session) {
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        if (active) setStatus("error");
      }
    }

    checkConfirmation();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2EBDD] px-6 text-[#20201D]">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF8F2] p-10 text-center shadow-sm">
        <Link
          href="/"
          className="text-sm font-bold tracking-[0.2em]"
        >
          ORIGEN PERFORMANCE
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          {status === "loading"
            ? "Verificando tu cuenta..."
            : status === "success"
              ? "¡Correo confirmado!"
              : "No pudimos verificar tu cuenta"}
        </h1>

        <p className="mt-4 text-sm leading-7 text-[#20201D]/60">
          {status === "loading"
            ? "Estamos comprobando la confirmación de tu correo electrónico."
            : status === "success"
              ? "Tu cuenta está lista. Ya puedes continuar con ORIGEN PERFORMANCE."
              : "El enlace puede haber expirado o no contiene una sesión válida. Intenta iniciar sesión o solicita un nuevo correo de confirmación."}
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex rounded-full bg-[#68705A] px-8 py-4 font-semibold text-white"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
