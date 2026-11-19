
"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";

type NavigationLink = { name: string; href: string };

function MobileMenu({ links }: { links: NavigationLink[] }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <div className="md:hidden" onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <button ref={toggle} type="button" aria-expanded={open} aria-controls={menuId}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((current) => !current)}
        className="min-h-11 rounded-full border border-[#20201D]/20 px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#68705A]">
        {open ? "Cerrar" : "Menú"}
      </button>
      {open && <div id={menuId} aria-label="Navegación móvil" className="absolute left-0 top-full w-full border-y border-[#20201D]/10 bg-[#FAF8F2] p-4 shadow-lg">
        <ul className="mx-auto grid max-w-7xl gap-1">
          {links.map((link) => <li key={link.href}>
            <Link href={link.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#F2EBDD] focus-visible:outline-2 focus-visible:outline-[#68705A]">{link.name}</Link>
          </li>)}
        </ul>
      </div>}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (active) {
        setIsLoggedIn(Boolean(user));
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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
      <nav aria-label="Navegación principal" className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 md:py-7 lg:px-8">

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

        {/* CUENTA Y CARRITO */}
        <div className="flex items-center gap-3">

          <Link
            href={isLoggedIn ? "/cuenta" : "/login"}
            className={`hidden rounded-full border px-4 py-2.5 md:inline-flex text-sm font-semibold transition ${
              isActive("/cuenta") || isActive("/login")
                ? "border-[#68705A] bg-[#68705A]/10 text-[#68705A]"
                : "border-[#20201D]/20 text-[#20201D] hover:border-[#68705A]"
            }`}
          >
            {isLoggedIn ? "Mi cuenta" : "Iniciar sesión"}
          </Link>

          <Link
            href="/cart"
            className={`flex min-h-11 items-center gap-2 rounded-full px-3 py-2.5 sm:px-5 text-sm font-semibold transition ${
              isActive("/cart")
                ? "bg-[#68705A] text-white"
                : "bg-[#20201D] text-[#FAF8F2] hover:opacity-80"
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 sm:hidden"><path d="M3 3h2l2 13h12l2-9H6M9 21h.01M18 21h.01" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="sr-only sm:not-sr-only">Carrito</span>

            {totalItems > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F2EBDD] px-1.5 text-xs font-bold text-[#20201D]">
                {totalItems}
              </span>
            )}
          </Link>

          <MobileMenu key={pathname} links={[
            ...navigation,
            { name: isLoggedIn ? "Mi cuenta" : "Iniciar sesión", href: isLoggedIn ? "/cuenta" : "/login" },
            { name: "Carrito", href: "/cart" },
          ]} />
        </div>
      </nav>
    </header>
  );
}
