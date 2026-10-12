
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RegistroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      setMessage(
        "Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la cuenta."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2EBDD] px-6 py-20 text-[#20201D]">
      <div className="mx-auto max-w-md rounded-3xl bg-[#FAF8F2] p-8 shadow-sm">
        <Link href="/" className="text-sm font-bold tracking-[0.2em]">
          ORIGEN PERFORMANCE
        </Link>

        <h1 className="mt-10 text-3xl font-bold">Crear cuenta</h1>
        <p className="mt-3 text-sm text-[#20201D]/60">
          Comienza tu experiencia con ORIGEN PERFORMANCE.
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              required
              maxLength={120}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-[#68705A]">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#68705A] px-6 py-4 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <span className="font-semibold text-[#68705A]">
            <Link
                href="/login"
                className="font-semibold text-[#68705A] hover:underline"
                >
                Iniciar sesión
            </Link>
          </span>
        </p>
      </div>
    </main>
  );
}
