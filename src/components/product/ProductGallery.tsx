"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/data/products";
import { getProductImages } from "@/lib/product-images";
import ProductImagePlaceholder from "./ProductImagePlaceholder";

type ProductGalleryProps = {
  product: Product;
};

export default function ProductGallery({
  product,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

    const images = getProductImages(product.images);
    const visibleIndex = Math.min(activeIndex, Math.max(0, images.length - 1));
    const mainImage = images[visibleIndex];

    function nextImage() {
    if (images.length > 1) setActiveIndex((visibleIndex + 1) % images.length);
    }

    function previousImage() {
    if (images.length > 1) setActiveIndex((visibleIndex - 1 + images.length) % images.length);
    }
    useEffect(() => {
        if (!isZoomOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
            setIsZoomOpen(false);
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
        }, [isZoomOpen]);
  return (
  <div className="w-full">
    <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-[#F2EBDD]">

      {/* Imagen principal */}
      {mainImage ? <button
        type="button"
        onClick={() => setIsZoomOpen(true)}
        aria-label={`Ampliar fotografía de ${product.name}`}
        className="absolute inset-0 z-0 cursor-zoom-in"
        >
        <Image
            src={mainImage}
            alt={`Presentación de ${product.name}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading={visibleIndex === 0 ? "eager" : "lazy"}
            className="object-contain"
        />
        </button> : <ProductImagePlaceholder name={product.name} />}

      {/* Etiqueta ORIGEN VERIFIED */}
      {product.verified && (
        <span className="absolute left-5 top-5 z-10 rounded-full bg-[#68705A] px-4 py-2 text-[10px] font-bold tracking-[0.15em] text-white">
          ✓ ORIGEN VERIFIED
        </span>
      )}

      {/* Flechas de navegación */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={previousImage}
            aria-label="Imagen anterior"
            className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-sm transition hover:bg-white"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={nextImage}
            aria-label="Imagen siguiente"
            className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-sm transition hover:bg-white"
          >
            ›
          </button>
        </>
      )}

            {/* Contador de imágenes */}
      {mainImage && <span className="absolute bottom-5 right-5 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#20201D]">
        {visibleIndex + 1} / {images.length}
      </span>}

    </div>

    {/* Miniaturas de la galería */}
    {images.length > 1 && (
      <div className="mt-4 grid grid-cols-3 gap-3">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Ver imagen ${index + 1} de ${product.name}`}
            aria-pressed={visibleIndex === index}
            className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition duration-200 ${
              visibleIndex === index
                ? "border-[#68705A] shadow-md"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <Image
              src={image}
              alt={`Miniatura ${index + 1} de ${product.name}`}
              fill
              sizes="(max-width: 640px) 30vw, 160px"
              className="object-cover"
            />

            {/* Indicador de imagen seleccionada */}
            {visibleIndex === index && (
              <span className="absolute bottom-0 left-0 h-1 w-full bg-[#68705A]" />
            )}
          </button>
        ))}
      </div>
    )}
    {/* Visor de imágenes ampliadas */}
    {isZoomOpen && mainImage && createPortal(
    <div
        role="dialog"
        aria-modal="true"
        aria-label={`Galería ampliada de ${product.name}`}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#20201D]/95 p-4"
    >
        {/* Cerrar visor */}
        <button
        type="button"
        onClick={() => setIsZoomOpen(false)}
        aria-label="Cerrar imagen ampliada"
        className="absolute right-5 top-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/25"
        >
        ×
        </button>

        {/* Imagen ampliada */}
        <div className="relative h-[85vh] w-full max-w-5xl">
        <Image
            src={mainImage}
            alt={`${product.name} - Imagen ampliada ${visibleIndex + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
        />
        </div>

        {/* Navegación */}
        {images.length > 1 && (
        <>
            <button
            type="button"
            onClick={previousImage}
            aria-label="Imagen anterior"
            className="absolute left-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white transition hover:bg-white/25 md:left-8"
            >
            ‹
            </button>

            <button
            type="button"
            onClick={nextImage}
            aria-label="Imagen siguiente"
            className="absolute right-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white transition hover:bg-white/25 md:right-8"
            >
            ›
            </button>
        </>
        )}

        {/* Contador */}
        <span className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white">
        {visibleIndex + 1} / {images.length}
        </span>
    </div>,
    document.body
    )}
  </div>
);
}
