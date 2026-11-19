import { connection } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  mapDatabaseProduct,
  type DatabaseProduct,
} from "@/lib/product-mapper";

export async function getShopProducts() {
  // Read current catalog data at request time, not at deployment/prerender time.
  await connection();
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, category, packaging, images, description, long_description, price, verified, goal, size, ingredients, verified_reasons, allergens, warnings, nutrition, is_active, stock"
    )
    .order("id")
    .returns<DatabaseProduct[]>();

  if (error) {
    console.error("Error al consultar productos:", error);
    throw new Error("No se pudo cargar el catálogo.");
  }

  return (data ?? []).map(mapDatabaseProduct);
}
