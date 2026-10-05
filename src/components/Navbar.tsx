"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  function isActive(path: string) {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  }

  const navigation = [
    {
      name: "Inicio",
      href: "/",
    },
    {
      name: "Shop",
      href: "/shop",
    },
    {
      name: "Origen Profile",
      href: "/profile",
    },
  ];

  return (
    <header className="absolute left-0 top-0 z-50 w-full">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-8">

        {/* LOGO */}
        <Link
          href="/"
          className="group"
          aria-label="Volver al inicio"
        >
          <p className="text-lg font-bold tracking-[0.18em] transition-opacity group-hover:opacity-60">
            ORIGEN
          </p>

          <p className="text-[9px] font-semibold tracking-[0.35em] text-[#68705A]">
            PERFORMANCE
          </p>
        </Link>

        {/* NAVEGACIÓN */}
        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-2 text-sm font-medium transition ${
                  active
                    ? "text-[#20201D]"
                    : "text-[#20201D]/55 hover:text-[#20201D]"
                }`}
              >
                {item.name}

                {active && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#68705A]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* CARRITO */}
        <Link
          href="/cart"
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            isActive("/cart")
              ? "bg-[#68705A] text-white"
              : "bg-[#20201D] text-[#FAF8F2] hover:opacity-80"
          }`}
        >
          Carrito

          {totalItems > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F2EBDD] px-1.5 text-xs font-bold text-[#20201D]">
              {totalItems}
            </span>
          )}
        </Link>

      </nav>
    </header>
  );
}