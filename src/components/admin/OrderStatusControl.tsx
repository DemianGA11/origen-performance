
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  paymentStatus: string;
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

export default function OrderStatusControl({
  orderId,
  currentStatus,
  paymentStatus,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const nextStatuses: Record<string, OrderStatus[]> = {
    pending: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
  };

  const availableStatuses =
    paymentStatus === "paid"
      ? nextStatuses[currentStatus] || []
      : [];

  async function updateStatus(newStatus: OrderStatus) {
    const confirmed = window.confirm(
      `¿Confirmas cambiar el pedido a "${statusLabels[newStatus]}"?`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase.rpc(
        "admin_update_order_status",
        {
          p_order_id: orderId,
          p_new_status: newStatus,
        }
      );

      if (updateError) {
        throw updateError;
      }

      setSuccess("Estado actualizado correctamente.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el pedido."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 border-t border-[#20201D]/10 pt-6">
      <h3 className="text-sm font-semibold">
        Gestionar pedido
      </h3>

      <p className="mt-2 text-sm text-[#20201D]/60">
        Estado actual: {statusLabels[currentStatus] || currentStatus}
      </p>

      {availableStatuses.length === 0 ? (
        <p className="mt-4 text-sm text-[#20201D]/60">
          Este pedido no tiene cambios de estado disponibles.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {availableStatuses.map((status) => (
            <button
              key={status}
              type="button"
              disabled={loading}
              onClick={() => updateStatus(status)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                status === "cancelled"
                  ? "border border-red-300 text-red-700 hover:bg-red-50"
                  : "bg-[#68705A] text-white hover:opacity-90"
              }`}
            >
              {loading
                ? "Actualizando..."
                : status === "cancelled"
                  ? "Cancelar pedido"
                  : `Marcar como ${statusLabels[status]}`}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="mt-4 text-sm text-[#68705A]">
          {success}
        </p>
      )}
    </div>
  );
}
