/**
 * GET /api/ceo/interruptores → interruptores de producto que el navegador necesita conocer (solo lectura).
 * Hoy: growth_engine (empresa emergente). Sin sesión o si la base no responde, todo apagado.
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { flagsFor } from "@/lib/ceo/flags-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = await supabaseServer();
    const user = sb ? (await sb.auth.getUser()).data.user ?? null : null;
    const f = await flagsFor(user?.id ?? null);
    return NextResponse.json({ growth_engine: f.growth_engine === true });
  } catch {
    return NextResponse.json({ growth_engine: false });
  }
}
