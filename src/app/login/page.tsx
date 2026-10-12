
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmed = searchParams.get("confirmed") === "true";

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2EBDD] px-6 py-16 text-[#20201D]">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF8F2] p-8 shadow-sm md:p-10">
        <Link
          href="/"
          className="text-sm font-bold tracking-[0.2em]"
        >
          ORIGEN PERFORMANCE
        </Link>

        <h1 className="mt-10 text-3xl font-bold">
          Iniciar sesión
        </h1>

        <p className="mt-3 text-sm text-[#20201D]/60">
          Accede a tu cuenta de ORIGEN PERFORMANCE.
        </p>

        {confirmed && (
          <p className="mt-6 rounded-xl bg-[#68705A]/10 p-4 text-sm text-[#68705A]">
            Tu correo fue confirmado. Ya puedes iniciar sesión.
          </p>
        )}

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none focus:border-[#68705A]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none focus:border-[#68705A]"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#68705A] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Iniciando sesión..." : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm">
          ¿Todavía no tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-semibold text-[#68705A] hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F2EBDD]">
          <p>Preparando inicio de sesión...</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
