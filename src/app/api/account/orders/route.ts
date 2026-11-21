import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const client = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Inicia sesión para consultar tus pedidos." }, { status: 401, headers });
    }

    // No caller-supplied owner/order IDs. Never query by email or include contact data.
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, created_at, total_amount, currency, payment_status, order_status, order_items(product_name, quantity)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: "No se pudieron consultar tus pedidos. Intenta nuevamente." }, { status: 503, headers });
    }
    return NextResponse.json({ orders: data ?? [] }, { headers });
  } catch {
    return NextResponse.json({ error: "No se pudieron consultar tus pedidos. Intenta nuevamente." }, { status: 503, headers });
  }
}
