
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
type StockEditorProps = {
  productId: number;
  initialStock: number;
};

export default function StockEditor({
  productId,
  initialStock,
}: StockEditorProps) {
  const router = useRouter();
  const [stock, setStock] = useState(String(initialStock));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    setMessage("");
    setError("");

    const parsedStock = Number(stock);

    if (
      stock.trim() === "" ||
      !Number.isSafeInteger(parsedStock) ||
      parsedStock < 0
    ) {
      setError("Introduce un número entero igual o mayor que cero.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.rpc(
        "admin_update_product_stock",
        {
          p_product_id: productId,
          p_stock: parsedStock,
        }
      );

      if (updateError) {
        throw updateError;
      }

      setMessage("Existencias actualizadas correctamente.");
      router.refresh();
    } catch {
      setError("No se pudieron actualizar las existencias.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 rounded-3xl bg-[#FAF8F2] p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#20201D]">
        Administrar existencias
      </h2>

      <p className="mt-2 text-sm text-[#68705A]">
        Modifica la cantidad registrada en el inventario.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="product-stock"
            className="mb-2 block text-sm font-medium"
          >
            Unidades disponibles
          </label>

          <input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            disabled={saving}
            className="w-40 rounded-xl border border-[#DDD8CC] bg-white px-4 py-3 outline-none focus:border-[#68705A]"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-[#20201D] px-6 py-3 font-semibold text-white transition hover:bg-[#68705A] disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar existencias"}
        </button>
      </div>

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
