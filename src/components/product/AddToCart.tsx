"use client";

import { getCartLimit, getAvailabilityLabel, canPurchaseProduct } from "@/lib/product-availability";

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

  const { addToCart, items = [] } = useCart();
  const inCart = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, getCartLimit(product) - inCart);
  const available = canPurchaseProduct(product);
  const selectedQuantity = Math.min(quantity, Math.max(1, remaining));

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.max(1, Math.min(remaining, current + 1)));
}

  function handleAddToCart() {
    if (!available || remaining === 0) return;
    addToCart(product, selectedQuantity);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  return (
    <div className="mt-8">
      <p role="status" className="mb-4 text-sm font-semibold text-[#68705A]">{getAvailabilityLabel(product)}</p>
      {available && inCart > 0 && <p className="mb-4 text-sm text-[#20201D]/65">Ya tienes {inCart} unidades en el carrito.</p>}
      <div className="flex flex-wrap gap-3">

        <div className="flex items-center rounded-full border border-[#20201D]/15">
          <button
            onClick={decreaseQuantity}
            disabled={selectedQuantity <= 1}
            className="px-5 py-4 text-lg"
            aria-label="Disminuir cantidad"
          >
            −
          </button>

          <span className="min-w-8 text-center font-semibold">
            {selectedQuantity}
          </span>

          <button
            onClick={increaseQuantity}
            disabled={!available || remaining === 0 || selectedQuantity >= remaining}
            className="px-5 py-4 text-lg"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!available || remaining === 0}
          className={`flex-1 rounded-full px-8 py-4 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            added
              ? "bg-[#68705A] text-white"
              : "bg-[#20201D] text-[#FAF8F2] hover:scale-[1.01]"
          }`}
        >
          {!available ? "No disponible para compra" : remaining === 0 ? "Cantidad máxima en tu carrito" : added ? "✓ Agregado al carrito" : "Agregar al carrito"}
        </button>

      </div>
    </div>
  );
}