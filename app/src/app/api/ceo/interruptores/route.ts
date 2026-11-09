/**
 * GET /api/ceo/interruptores → interruptores de producto que el navegador necesita conocer (solo lectura).
 *  - growth_engine (empresa emergente). Prendido salvo que ceo.flags lo apague.
 *  - world_events (acontecimientos reales) y world_off (familias apagadas por el equipo). Apagado por omisión.
 * Si la base no responde, todo apagado.
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { flagsFor, globalFlagRows } from "@/lib/ceo/flags-server";
import { worldFamiliesOff } from "@/lib/ceo/flags";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = await supabaseServer();
    const user = sb ? (await sb.auth.getUser()).data.user ?? null : null;
    const f = await flagsFor(user?.id ?? null);
    return NextResponse.json({ growth_engine: f.growth_engine === true, world_events: f.world_events === true, world_off: worldFamiliesOff(await globalFlagRows()) });
  } catch {
    return NextResponse.json({ growth_engine: false, world_events: false, world_off: [] });
  }
}
