"use client";

import { useState } from "react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

type AddToCartProps = {
  product: Product;
};

export default function AddToCart({
  product,
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => current + 1);
}

  function handleAddToCart() {
    addToCart(product, quantity);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  return (
    <div className="mt-8">
      <div className="flex gap-3">

        <div className="flex items-center rounded-full border border-[#20201D]/15">
          <button
            onClick={decreaseQuantity}
            className="px-5 py-4 text-lg"
            aria-label="Disminuir cantidad"
          >
            −
          </button>

          <span className="min-w-8 text-center font-semibold">
            {quantity}
          </span>

          <button
            onClick={increaseQuantity}
            className="px-5 py-4 text-lg"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          className={`flex-1 rounded-full px-8 py-4 font-semibold transition ${
            added
              ? "bg-[#68705A] text-white"
              : "bg-[#20201D] text-[#FAF8F2] hover:scale-[1.01]"
          }`}
        >
          {added ? "✓ Agregado al carrito" : "Agregar al carrito"}
        </button>

      </div>
    </div>
  );
}