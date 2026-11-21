"use client";

import { useEffect, useState } from "react";

type CustomerOrder = {
  id: string;
  created_at: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_items: { product_name: string; quantity: number }[];
};

type HistoryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; orders: CustomerOrder[] };

const paymentLabels: Record<string, string> = { paid: "Pagado", pending: "Pendiente de pago", failed: "Pago no completado", expired: "Expirado" };
const orderLabels: Record<string, string> = { pending: "Pendiente de preparación", processing: "En preparación", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado", expired: "Expirado" };

export default function OrderHistory() {
  const [state, setState] = useState<HistoryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/account/orders", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("History unavailable");
        const body = await response.json();
        if (!Array.isArray(body.orders)) throw new Error("Invalid history");
        if (!controller.signal.aborted) setState({ status: "ready", orders: body.orders });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  if (state.status === "loading") return <p role="status" className="mt-3 text-sm text-[#20201D]/65">Cargando tus pedidos...</p>;
  if (state.status === "error") return <div className="mt-3">
    <p role="alert" className="text-sm text-[#B76D4B]">No pudimos cargar tus pedidos. Comprueba tu sesión e intenta nuevamente.</p>
    <button type="button" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }} className="mt-4 min-h-11 rounded-full border border-[#20201D]/20 px-5 py-2 text-sm font-semibold">Reintentar</button>
  </div>;

  return <div className="mt-4">
    <p className="text-sm text-[#20201D]/65">Solo aparecen compras iniciadas con tu sesión después de habilitar el historial. Las compras anteriores o de invitado no se asignan por correo.</p>
    {state.orders.length === 0 ? <p className="mt-5 text-sm">Todavía no tienes pedidos asociados a esta cuenta.</p> : <>
      <p className="mt-3 text-xs text-[#20201D]/60">Tus últimos 50 pedidos como máximo. Pago y preparación se muestran por separado.</p>
      <ul className="mt-5 space-y-5">
        {state.orders.map((order) => <li key={order.id} className="rounded-2xl border border-[#20201D]/10 p-4 sm:p-5">
          <h3 className="break-all text-sm font-semibold">Pedido {order.id}</h3>
          <p className="mt-2 text-sm text-[#20201D]/65"><time dateTime={order.created_at}>{new Date(order.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</time></p>
          <ul className="mt-3 space-y-1 text-sm">{(order.order_items ?? []).map((item, index) => <li key={index}>{item.product_name} × {item.quantity}</li>)}</ul>
          {(order.order_items ?? []).length === 0 && <p className="mt-3 text-sm text-[#20201D]/65">Este pedido todavía no tiene partidas confirmadas.</p>}
          <p className="mt-3 font-semibold">Total: {(order.total_amount / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency.toUpperCase()}</p>
          <p className="mt-2 text-sm">Pago: {paymentLabels[order.payment_status] ?? order.payment_status}</p>
          <p className="mt-1 text-sm">Pedido: {orderLabels[order.order_status] ?? order.order_status}</p>
        </li>)}
      </ul>
    </>}
  </div>;
}
