
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type StatusEditorProps = {
  productId: number;
  initialIsActive: boolean;
};

export default function StatusEditor({
  productId,
  initialIsActive,
}: StatusEditorProps) {
  const router = useRouter();

  const [isActive, setIsActive] = useState(initialIsActive);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleStatusChange() {
    setMessage("");
    setError("");
    setSaving(true);

    const newStatus = !isActive;

    try {
      const { error: updateError } = await supabase.rpc(
        "admin_update_product_status",
        {
          p_product_id: productId,
          p_is_active: newStatus,
        }
      );

      if (updateError) {
        throw updateError;
      }

      setIsActive(newStatus);
      setMessage(
        newStatus
          ? "Producto activado correctamente."
          : "Producto desactivado correctamente."
      );

      router.refresh();
    } catch {
      setError("No se pudo actualizar el estado del producto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 rounded-3xl bg-[#FAF8F2] p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#20201D]">
        Estado del producto
      </h2>

      <p className="mt-2 text-sm text-[#68705A]">
        Controla si el producto está marcado como activo
        en la base de datos.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            isActive
              ? "bg-green-100 text-green-800"
              : "bg-[#F2EBDD] text-[#68705A]"
          }`}
        >
          {isActive ? "Activo" : "Inactivo"}
        </span>

        <button
          type="button"
          onClick={handleStatusChange}
          disabled={saving || productId === 6}
          className="rounded-full bg-[#20201D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#68705A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Guardando..."
            : isActive
              ? "Desactivar producto"
              : "Activar producto"}
        </button>
      </div>

      {productId === 6 && (
        <p className="mt-4 text-sm text-[#B76D4B]">
          Pre-Performance permanece inactivo porque su
          formulación todavía está pendiente de definir.
        </p>
      )}

      {message && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
