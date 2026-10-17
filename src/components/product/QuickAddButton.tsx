"use client";

import { useState } from "react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { getProductAvailability } from "@/lib/product-availability";

type QuickAddButtonProps = {
  product: Product;
};

export default function QuickAddButton({
  product,
}: QuickAddButtonProps) {
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();
  const availability = getProductAvailability(product);

  function handleAdd() {
    if (!availability.canPurchase) return;
    addToCart(product, 1);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1000);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={!availability.canPurchase}
      aria-label={availability.canPurchase ? `Agregar ${product.name} al carrito` : `${product.name}: ${availability.label}`}
      title={availability.canPurchase ? "Agregar al carrito" : availability.label}
      className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        added
          ? "bg-[#68705A] text-white"
          : "border border-[#20201D]/20 hover:bg-[#20201D] hover:text-white"
      }`}
    >
      {!availability.canPurchase ? availability.label : added ? "✓" : "+"}
    </button>
  );
}
