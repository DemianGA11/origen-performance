"use client";

import { canPurchaseProduct } from "@/lib/product-availability";

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

  const { addToCart } = useCart();
  const available = canPurchaseProduct(product);

  function handleAdd() {
    if (!available) return;
    addToCart(product, 1);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1000);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={!available}
      aria-label={`Agregar ${product.name} al carrito`}
      title={available ? "Agregar al carrito" : "No disponible para compra"}
      className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        added
          ? "bg-[#68705A] text-white"
          : "border border-[#20201D]/20 hover:bg-[#20201D] hover:text-white"
      }`}
    >
      {!available ? "No disponible" : added ? "✓" : "+"}
    </button>
  );
}