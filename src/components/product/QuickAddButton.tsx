"use client";

import { getCartLimit, getAvailabilityLabel, canPurchaseProduct } from "@/lib/product-availability";

import { useState } from "react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

type QuickAddButtonProps = {
  product: Product;
};

export default function QuickAddButton({
  product,
}: QuickAddButtonProps) {
  const [added, setAdded] = useState(false);

  const { addToCart, items = [] } = useCart();
  const inCart = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, getCartLimit(product) - inCart);
  const available = canPurchaseProduct(product);

  function handleAdd() {
    if (!available || remaining === 0) return;
    addToCart(product, 1);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1000);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={!available || remaining === 0}
      aria-label={remaining === 0 && available ? `Alcanzaste la cantidad máxima de ${product.name}` : `Agregar ${product.name} al carrito`}
      title={available ? remaining === 0 ? "Cantidad máxima en tu carrito" : getAvailabilityLabel(product) : "No disponible para compra"}
      className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        added
          ? "bg-[#68705A] text-white"
          : "border border-[#20201D]/20 hover:bg-[#20201D] hover:text-white"
      }`}
    >
      {!available ? "No disponible" : remaining === 0 ? "En tu carrito" : added ? "✓" : "+"}
    </button>
  );
}