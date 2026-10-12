"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { Product } from "@/data/products";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  removePurchasedItems: (
    purchasedItems: { productId: number; quantity: number }[]
  ) => void;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => {
    const loadCart = () => {
      const storedCart = localStorage.getItem("origen-cart");

      if (storedCart) {
        try {
          const parsedCart = JSON.parse(storedCart);
          setItems(parsedCart);
        } catch {
          localStorage.removeItem("origen-cart");
        }
      }

      setHasLoaded(true);
    };

    const timeoutId = window.setTimeout(loadCart, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);
  useEffect(() => {
    if (!hasLoaded) return;

    localStorage.setItem(
      "origen-cart",
      JSON.stringify(items)
    );
  }, [items, hasLoaded]);

  function addToCart(product: Product, quantity = 1) {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          product,
          quantity,
        },
      ];
    });
  }

  function removeFromCart(productId: number) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.product.id !== productId
      )
    );
  }

  function updateQuantity(
    productId: number,
    quantity: number
  ) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }
    function removePurchasedItems(
    purchasedItems: { productId: number; quantity: number }[]
  ) {
    setItems((currentItems) =>
      currentItems
        .map((item) => {
          const purchased = purchasedItems.find(
            (p) => p.productId === item.product.id
          );

          if (!purchased) return item;

          return {
            ...item,
            quantity: Math.max(0, item.quantity - purchased.quantity),
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
        value={{
          items,
          addToCart,
          removeFromCart,
          updateQuantity,
          clearCart,
          removePurchasedItems,
          totalItems,
          subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart debe utilizarse dentro de CartProvider"
    );
  }

  return context;
}