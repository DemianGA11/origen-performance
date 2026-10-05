"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { items, subtotal, totalItems, clearCart } = useCart();
  const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        postalCode: "",
        city: "",
        state: "",
    });
    const [checkoutStep, setCheckoutStep] = useState<
        "shipping" | "payment" | "review" | "confirmed"
    >("shipping");
    const [paymentMethod, setPaymentMethod] = useState<
        "card" | "transfer" | null
    >(null);

    //const [orderNumber, setOrderNumber] = useState("");
    const [confirmedOrder, setConfirmedOrder] = useState<{
        orderNumber: string;
        total: number;
        itemCount: number;
        paymentMethod: "card" | "transfer";
    } | null>(null);
    function handleChange(
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
        ...previous,
        [name]: value,
    }));
    }
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
    );

    const isPostalCodeValid = /^\d{5}$/.test(
        formData.postalCode
    );

    const phoneDigits = formData.phone.replace(/\D/g, "");

    const isPhoneValid = phoneDigits.length === 10;

    const isFormComplete =
        formData.firstName.trim() !== "" &&
        formData.lastName.trim() !== "" &&
        isEmailValid &&
        isPhoneValid &&
        formData.address.trim() !== "" &&
        isPostalCodeValid &&
        formData.city.trim() !== "" &&
        formData.state.trim() !== "";
    if (checkoutStep === "confirmed" && confirmedOrder) {
        return (
            <main className="min-h-screen bg-[#F2EBDD] text-[#20201D]">
            <Navbar />

            <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-32">
                <div className="w-full rounded-[2rem] bg-[#FAF8F2] p-8 text-center shadow-sm md:p-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#68705A] text-2xl font-bold text-white">
                    ✓
                </div>

                <p className="mt-8 text-xs font-bold tracking-[0.2em] text-[#68705A]">
                    PEDIDO CONFIRMADO
                </p>

                <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
                    Gracias por tu pedido.
                </h1>

                <p className="mx-auto mt-5 max-w-xl leading-7 text-[#20201D]/55">
                    Tu pedido de demostración ha sido registrado correctamente.
                    No se realizó ningún cobro real.
                </p>

                <div className="mx-auto mt-10 max-w-lg rounded-3xl bg-[#F2EBDD] p-7 text-left">
                    <div className="flex items-center justify-between gap-5 border-b border-[#20201D]/10 pb-5">
                    <span className="text-sm text-[#20201D]/50">
                        Número de pedido
                    </span>

                    <span className="font-bold">
                        {confirmedOrder.orderNumber}
                    </span>
                    </div>

                    <div className="flex items-center justify-between gap-5 border-b border-[#20201D]/10 py-5">
                    <span className="text-sm text-[#20201D]/50">
                        Productos
                    </span>

                    <span className="font-semibold">
                        {confirmedOrder.itemCount}
                    </span>
                    </div>

                    <div className="flex items-center justify-between gap-5 border-b border-[#20201D]/10 py-5">
                    <span className="text-sm text-[#20201D]/50">
                        Método
                    </span>

                    <span className="text-right font-semibold">
                        {confirmedOrder.paymentMethod === "card"
                        ? "Tarjeta · Simulación"
                        : "Transferencia · Simulación"}
                    </span>
                    </div>

                    <div className="flex items-center justify-between gap-5 pt-5">
                    <span className="font-semibold">
                        Total
                    </span>

                    <span className="text-xl font-bold">
                        ${confirmedOrder.total.toLocaleString("es-MX")} MXN
                    </span>
                    </div>
                </div>

                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                    href="/"
                    className="rounded-full bg-[#20201D] px-7 py-3.5 font-semibold text-[#FAF8F2] transition hover:opacity-80"
                    >
                    Volver a ORIGEN
                    </Link>

                    <Link
                    href="/shop"
                    className="rounded-full border border-[#20201D]/15 px-7 py-3.5 font-semibold transition hover:border-[#20201D]"
                    >
                    Seguir explorando
                    </Link>
                </div>

                <p className="mt-8 text-xs text-[#20201D]/35">
                    ORIGEN PERFORMANCE · Checkout de demostración
                </p>
                </div>
            </section>
            </main>
        );
    }
  if (items.length === 0 && checkoutStep !== "confirmed") {
    return (
      <main className="min-h-screen bg-[#F2EBDD] text-[#20201D]">
        <Navbar />

        <section className="mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-28 lg:px-8">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#68705A]">
              CHECKOUT
            </p>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Tu carrito está vacío.
            </h1>

            <p className="mt-5 max-w-xl text-[#20201D]/60">
              Agrega algún producto antes de continuar con tu pedido.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex rounded-full bg-[#20201D] px-7 py-3 font-semibold text-[#FAF8F2] transition hover:opacity-80"
            >
              Explorar productos →
            </Link>
          </div>
        </section>
      </main>
    );
  }
    function handleConfirmOrder() {
        if (!paymentMethod) return;

        const randomCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        const newOrderNumber = `ORG-${randomCode}`;


        setConfirmedOrder({
            orderNumber: newOrderNumber,
            total: subtotal,
            itemCount: totalItems,
            paymentMethod,
        });

        setCheckoutStep("confirmed");
        clearCart();
    }
  return (
    <main className="min-h-screen bg-[#F2EBDD] text-[#20201D]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-40 lg:px-8">
        <Link
          href="/cart"
          className="text-sm font-semibold text-[#20201D]/50 transition hover:text-[#20201D]"
        >
          ← Volver al carrito
        </Link>

        <div className="mt-10">
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#68705A]">
            CHECKOUT
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Finaliza tu pedido.
          </h1>

          <p className="mt-4 max-w-2xl text-[#20201D]/60">
            Revisa tu pedido antes de continuar con tus datos de envío.
          </p>
        </div>
        {checkoutStep === "shipping" ? (
        <div className="rounded-3xl border border-[#20201D]/10 bg-[#FAF8F2] p-8 md:p-10">
        <div>
            <p className="text-sm font-bold tracking-[0.18em]">
            INFORMACIÓN DE CONTACTO
            </p>

            <p className="mt-2 text-sm text-[#20201D]/50">
            Usaremos estos datos únicamente para procesar tu pedido.
            </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div>
            <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-semibold"
            >
                Nombre
            </label>

            <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Nombre"
                autoComplete="given-name"
                className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none transition focus:border-[#68705A]"
            />
            </div>

            <div>
            <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-semibold"
            >
                Apellidos
            </label>

            <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Apellidos"
                autoComplete="family-name"
                className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none transition focus:border-[#68705A]"
            />
            </div>

            <div>
            <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
            >
                Correo electrónico
            </label>

            <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nombre@correo.com"
                autoComplete="email"
                className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none transition focus:border-[#68705A]"
            />
            </div>

            <div>
            <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold"
            >
                Teléfono
            </label>

            <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="444 123 4567"
                autoComplete="tel"
                className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none transition focus:border-[#68705A]"
            />
            </div>
        </div>

        <div className="my-10 border-t border-[#20201D]/10" />

        <div>
            <p className="text-sm font-bold tracking-[0.18em]">
            DIRECCIÓN DE ENVÍO
            </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
            <label
                htmlFor="address"
                className="mb-2 block text-sm font-semibold"
            >
                Calle y número
            </label>

            <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                placeholder="Av. Ejemplo 123"
                autoComplete="street-address"
                className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none transition focus:border-[#68705A]"
            />
            </div>

            <div>
            <label
                htmlFor="postalCode"
                className="mb-2 block text-sm font-semibold"
            >
                Código postal
            </label>

            <input
                id="postalCode"
                name="postalCode"
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="78000"
                autoComplete="postal-code"
                className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none transition focus:border-[#68705A]"
            />
            </div>

            <div>
            <label
                htmlFor="city"
                className="mb-2 block text-sm font-semibold"
            >
                Ciudad
            </label>

            <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="San Luis Potosí"
                autoComplete="address-level2"
                className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none transition focus:border-[#68705A]"
            />
            </div>

            <div className="md:col-span-2">
            <label
                htmlFor="state"
                className="mb-2 block text-sm font-semibold"
            >
                Estado
            </label>

            <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                autoComplete="address-level1"
                className="w-full rounded-xl border border-[#20201D]/15 bg-white px-4 py-3 outline-none transition focus:border-[#68705A]"
            >
                <option value="">Selecciona un estado</option>
                <option value="San Luis Potosí">San Luis Potosí</option>
                <option value="Aguascalientes">Aguascalientes</option>
                <option value="Guanajuato">Guanajuato</option>
                <option value="Jalisco">Jalisco</option>
                <option value="Nuevo León">Nuevo León</option>
                <option value="Querétaro">Querétaro</option>
                <option value="Zacatecas">Zacatecas</option>
                <option value="Otro">Otro</option>
            </select>
            </div>
        </div>

        <button
            type="button"
            onClick={() => setCheckoutStep("payment")}
            disabled={!isFormComplete}
            className={`mt-10 w-full rounded-full px-7 py-4 font-semibold transition ${
                isFormComplete
                ? "bg-[#20201D] text-[#FAF8F2] hover:opacity-80"
                : "cursor-not-allowed bg-[#20201D]/10 text-[#20201D]/30"
            }`}
            >
            Continuar al pago →
        </button>

        <p className="mt-4 text-center text-xs text-[#20201D]/40">
            No se realizará ningún cobro real en este prototipo.
        </p>
        </div>
        ) : checkoutStep === "payment" ? (
            <div className="rounded-3xl border border-[#20201D]/10 bg-[#FAF8F2] p-8 md:p-10">

                <button
                type="button"
                onClick={() => setCheckoutStep("shipping")}
                className="mb-8 text-sm font-semibold text-[#20201D]/50 transition hover:text-[#20201D]"
                >
                ← Editar información
                </button>

                <p className="text-sm font-bold tracking-[0.18em]">
                MÉTODO DE PAGO
                </p>

                <p className="mt-2 text-sm text-[#20201D]/50">
                Selecciona cómo deseas simular el pago de este pedido.
                </p>

                <div className="mt-8 space-y-4">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`w-full rounded-2xl border p-5 text-left transition ${
                        paymentMethod === "card"
                            ? "border-[#20201D] bg-[#20201D] text-[#FAF8F2]"
                            : "border-[#20201D]/10 hover:border-[#68705A]"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">Tarjeta</p>

                            <p
                            className={`mt-1 text-sm ${
                                paymentMethod === "card"
                                ? "text-[#FAF8F2]/55"
                                : "text-[#20201D]/50"
                            }`}
                            >
                            Pago simulado para fines de demostración.
                            </p>
                        </div>

                        <span className="text-sm font-semibold">
                            {paymentMethod === "card" ? "Seleccionado" : ""}
                        </span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPaymentMethod("transfer")}
                        className={`w-full rounded-2xl border p-5 text-left transition ${
                        paymentMethod === "transfer"
                            ? "border-[#20201D] bg-[#20201D] text-[#FAF8F2]"
                            : "border-[#20201D]/10 hover:border-[#68705A]"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">Transferencia bancaria</p>

                            <p
                            className={`mt-1 text-sm ${
                                paymentMethod === "transfer"
                                ? "text-[#FAF8F2]/55"
                                : "text-[#20201D]/50"
                            }`}
                            >
                            Simulación de transferencia SPEI.
                            </p>
                        </div>

                        <span className="text-sm font-semibold">
                            {paymentMethod === "transfer" ? "Seleccionado" : ""}
                        </span>
                        </div>
                    </button>
                    </div>

                <div className="mt-8 rounded-2xl bg-[#F2EBDD] p-5">
                <p className="text-sm font-semibold">
                    Prototipo académico
                </p>

                <p className="mt-2 text-sm leading-6 text-[#20201D]/55">
                    Esta tienda no procesará ningún pago real. No introduzcas
                    información bancaria o datos reales de tarjetas.
                </p>
                </div>

                <button
                    type="button"
                    onClick={() => setCheckoutStep("review")}
                    disabled={!paymentMethod}
                    className={`mt-8 w-full rounded-full px-7 py-4 font-semibold transition ${
                        paymentMethod
                        ? "bg-[#20201D] text-[#FAF8F2] hover:opacity-80"
                        : "cursor-not-allowed bg-[#20201D]/10 text-[#20201D]/30"
                    }`}
                    >
                    Revisar pedido →
                </button>

              </div>

        ) : (
        <div className="rounded-3xl border border-[#20201D]/10 bg-[#FAF8F2] p-8 md:p-10">

            <button
            type="button"
            onClick={() => setCheckoutStep("payment")}
            className="mb-8 text-sm font-semibold text-[#20201D]/50 transition hover:text-[#20201D]"
            >
            ← Volver al pago
            </button>

            <p className="text-sm font-bold tracking-[0.18em]">
            REVISIÓN DEL PEDIDO
            </p>

            <h2 className="mt-3 text-3xl font-bold">
            Todo listo.
            </h2>

            <p className="mt-3 text-[#20201D]/55">
            Revisa la información antes de confirmar tu pedido.
            </p>

            <div className="mt-8 rounded-2xl bg-[#F2EBDD] p-6">
            <p className="text-xs font-bold tracking-[0.16em] text-[#68705A]">
                CONTACTO
            </p>

            <p className="mt-3 font-semibold">
                {formData.firstName} {formData.lastName}
            </p>

            <p className="mt-1 text-sm text-[#20201D]/55">
                {formData.email}
            </p>

            <p className="mt-1 text-sm text-[#20201D]/55">
                {formData.phone}
            </p>
            </div>

            <div className="mt-4 rounded-2xl bg-[#F2EBDD] p-6">
            <p className="text-xs font-bold tracking-[0.16em] text-[#68705A]">
                ENVÍO
            </p>

            <p className="mt-3 font-semibold">
                {formData.address}
            </p>

            <p className="mt-1 text-sm text-[#20201D]/55">
                {formData.city}, {formData.state}
            </p>

            <p className="mt-1 text-sm text-[#20201D]/55">
                C.P. {formData.postalCode}
            </p>
            </div>

            <div className="mt-4 rounded-2xl bg-[#F2EBDD] p-6">
            <p className="text-xs font-bold tracking-[0.16em] text-[#68705A]">
                MÉTODO DE PAGO
            </p>

            <p className="mt-3 font-semibold">
                {paymentMethod === "card"
                ? "Tarjeta — simulación"
                : "Transferencia bancaria — simulación"}
            </p>
            </div>

            <button
            type="button"
            onClick={handleConfirmOrder}
            className="mt-8 w-full rounded-full bg-[#68705A] px-7 py-4 font-semibold text-white transition hover:opacity-80"
            >
            Confirmar pedido →
            </button>

            <p className="mt-4 text-center text-xs text-[#20201D]/40">
            Esta acción es únicamente una simulación académica.
            </p>
        </div>
        )}
            
      </section>
    </main>
  );
}