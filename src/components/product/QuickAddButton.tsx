"use client";

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

  function handleAdd() {
    addToCart(product, 1);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1000);
  }

  return (
    <button
      onClick={handleAdd}
      aria-label={`Agregar ${product.name} al carrito`}
      title="Agregar al carrito"
      className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-semibold transition ${
        added
          ? "bg-[#68705A] text-white"
          : "border border-[#20201D]/20 hover:bg-[#20201D] hover:text-white"
      }`}
    >
      {added ? "✓" : "+"}
    </button>
  );
}