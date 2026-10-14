
"use client";

import { useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";

type ImageUploaderProps = {
  productId: number;
  initialImages: string[];
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function ImageUploader({
  productId,
  initialImages,
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    const extension = allowedTypes[file.type];

    if (!extension) {
      setError("Selecciona una imagen JPG, PNG o WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("La imagen no puede superar los 5 MB.");
      event.target.value = "";
      return;
    }

    if (images.length >= 10) {
      setError("Puedes registrar como máximo 10 imágenes.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    const filePath = `${productId}/${crypto.randomUUID()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const updatedImages = [...images, data.publicUrl];

      const { error: databaseError } = await supabase.rpc(
        "admin_update_product_images",
        {
          p_product_id: productId,
          p_images: updatedImages,
        }
      );

      if (databaseError) {
        // Si falla el registro, intentar retirar
        // la imagen que acabamos de subir.
        const { error: cleanupError } = await supabase.storage
          .from("product-images")
          .remove([filePath]);

        if (cleanupError) {
          console.error(
            "No se pudo limpiar la imagen subida:",
            cleanupError
          );
        }

        throw new Error(databaseError.message);
      }

      setImages(updatedImages);
      setMessage("Imagen guardada correctamente.");
    } catch (uploadError) {
      console.error("Error al subir imagen:", uploadError);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }
  
    async function setMainImage(index: number) {
        if (uploading || index === 0) return;

        setError("");
        setMessage("");
        setUploading(true);

        const updatedImages = [...images];

        const [selectedImage] = updatedImages.splice(index, 1);
        updatedImages.unshift(selectedImage);

        try {
            const { error: updateError } = await supabase.rpc(
            "admin_update_product_images",
            {
                p_product_id: productId,
                p_images: updatedImages,
            }
            );

            if (updateError) {
            throw new Error(updateError.message);
            }

            setImages(updatedImages);
            setMessage("Imagen principal actualizada correctamente.");
        } catch (updateError) {
            console.error(
            "Error al cambiar imagen principal:",
            updateError
            );

            setError(
            updateError instanceof Error
                ? updateError.message
                : "No se pudo cambiar la imagen principal."
            );
        } finally {
            setUploading(false);
        }
    }

    
    async function removeImage(index: number) {
        if (uploading) return;

        const imageUrl = images[index];

        if (!imageUrl) return;

        const confirmed = window.confirm(
            "¿Seguro que deseas eliminar esta fotografía del producto?"
        );

        if (!confirmed) return;

        setError("");
        setMessage("");
        setUploading(true);

        const updatedImages = images.filter(
            (_, imageIndex) => imageIndex !== index
        );

        try {
            // Primero retirar la imagen del catálogo.
            const { error: updateError } = await supabase.rpc(
            "admin_update_product_images",
            {
                p_product_id: productId,
                p_images: updatedImages,
            }
            );

            if (updateError) {
            throw new Error(updateError.message);
            }

            setImages(updatedImages);

            // Si es una imagen local, solo retirarla del catálogo.
            if (imageUrl.startsWith("/products/")) {
            setMessage("Imagen retirada del catálogo correctamente.");
            return;
            }

            // Identificar archivos del bucket product-images.
            const { data } = supabase.storage
            .from("product-images")
            .getPublicUrl("");

            const storagePrefix = data.publicUrl.endsWith("/")
            ? data.publicUrl
            : `${data.publicUrl}/`;

            if (!imageUrl.startsWith(storagePrefix)) {
            setMessage(
                "Imagen retirada del catálogo. La URL externa no fue eliminada."
            );
            return;
            }

            const filePath = imageUrl.slice(storagePrefix.length);

            // Si otra posición aún utiliza la misma URL,
            // no debemos eliminar su archivo.
            if (updatedImages.includes(imageUrl)) {
                setMessage("Imagen retirada del catálogo correctamente.");
                return;
            }
            
            // Comprobar si otro producto utiliza esta fotografía.
            const { data: usedElsewhere, error: usageError } =
            await supabase.rpc("admin_image_used_elsewhere", {
                p_product_id: productId,
                p_image_url: imageUrl,
            });

            // Si no podemos verificarlo, conservamos el archivo.
            if (usageError || usedElsewhere === null) {
                console.error(
                    "No se pudo verificar el uso de la imagen:",
                    usageError
                );

                setMessage(
                    "La fotografía se retiró del catálogo, pero conservamos " +
                    "el archivo porque no pudimos verificar si otro producto lo utiliza."
                );
                return;
            }

            // Si otro producto la utiliza, no borrar de Storage.
            if (usedElsewhere) {
                setMessage(
                    "Fotografía retirada de este producto. " +
                    "El archivo se conserva porque otro producto lo utiliza."
                );
                return;
            }

            const { error: deleteError } = await supabase.storage
            .from("product-images")
            .remove([filePath]);

            if (deleteError) {
            console.error("Error al borrar el archivo:", deleteError);

            setMessage(
                "Imagen retirada del catálogo, pero no se pudo borrar el archivo de Storage."
            );
            return;
            }

            setMessage("Imagen eliminada correctamente.");
        } catch (removeError) {
            console.error("Error al eliminar imagen:", removeError);

            setError(
            removeError instanceof Error
                ? removeError.message
                : "No se pudo eliminar la fotografía."
            );
        } finally {
            setUploading(false);
        }
    }


  return (
    <section className="mt-8 rounded-3xl bg-[#FAF8F2] p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-[#20201D]">
        Fotografías del producto
      </h2>

      <p className="mt-2 text-sm text-[#68705A]">
        Agrega imágenes al catálogo. Puedes guardar hasta 10.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {images.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className="overflow-hidden rounded-xl border border-[#DDD8CC] bg-white"
          >
            {/* La imagen puede proceder de public/ o Supabase Storage. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`Fotografía ${index + 1} del producto`}
              className="aspect-square w-full object-contain"
            />

            
            
        <div className="flex flex-col items-center gap-2 p-3 text-center">
            {index === 0 ? (
                <p className="text-xs font-semibold text-[#68705A]">
                    Imagen principal
                </p>
            ) : (
              <button
                type="button"
                onClick={() => setMainImage(index)}
                disabled={uploading}
                className="rounded-full border border-[#68705A] px-3 py-2 text-xs font-medium text-[#68705A] transition hover:bg-[#68705A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Establecer como principal
              </button>
        )}

            <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={uploading}
                className="rounded-full border border-red-700 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
                Eliminar fotografía
            </button>
        </div>


          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-[#DDD8CC] p-8 text-center text-sm text-[#68705A]">
          Este producto todavía no tiene fotografías.
        </div>
      )}

      <div className="mt-6">
        <label
          htmlFor="productImage"
          className="mb-2 block text-sm font-medium text-[#20201D]"
        >
          Seleccionar imagen
        </label>

        <input
          id="productImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={uploading || images.length >= 10}
          className="block w-full text-sm text-[#68705A] file:mr-4 file:rounded-full file:border-0 file:bg-[#20201D] file:px-5 file:py-3 file:font-semibold file:text-white disabled:opacity-50"
        />
      </div>

      {uploading && (
        <p role="status" className="mt-4 text-sm text-[#68705A]">
          Subiendo imagen...
        </p>
      )}

      {message && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs text-[#68705A]">
        Formatos permitidos: JPG, PNG y WebP. Máximo 5 MB por imagen.
      </p>
    </section>
  );
}
