/**
 * GET /api/ceo/mundo?t=<plantilla>&tracked=<ev1,ev2> → acontecimientos reales con sedes expuestas para esa plantilla.
 *
 * Fuentes oficiales (GDACS, corroborado con NHC y USGS), caché de 10 minutos en el servidor. Sin exposición no hay
 * candidato. Respeta el interruptor world_events (en producción) y el apagado por familia (value.off).
 * La preferencia del jugador y la deduplicación se aplican en la partida (engine.openWorldEvent).
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { flagsFor, globalFlagRows } from "@/lib/ceo/flags-server";
import { appEnvOf, worldFamiliesOff, worldVisible } from "@/lib/ceo/flags";
import { candidatesFor, loadFeed } from "@/lib/ceo/world/feed";
import { exposureOf } from "@/lib/ceo/world/exposure";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const t = (u.searchParams.get("t") ?? "").slice(0, 60);
  const tracked = (u.searchParams.get("tracked") ?? "").split(",").filter((x) => /^[a-z0-9]{1,24}$/.test(x)).slice(0, 5);
  try {
    const sb = await supabaseServer();
    const user = sb ? (await sb.auth.getUser()).data.user ?? null : null;
    if (!user) return NextResponse.json({ on: false, candidates: [], reason: "sin sesión" }, { status: 401 });
    const f = await flagsFor(user.id);
    const on = worldVisible(appEnvOf(process.env.VERCEL_ENV, process.env.NODE_ENV), f.world_events === true);
    if (!on) return NextResponse.json({ on: false, candidates: [] });
    if (!exposureOf(t)) return NextResponse.json({ on: true, candidates: [], reason: "plantilla sin sedes registradas" });
    const off = worldFamiliesOff(await globalFlagRows());
    const feed = await loadFeed();
    return NextResponse.json(
      { on: true, off, at: feed.at, sources: feed.sources, candidates: candidatesFor(feed, t, { off, tracked }) },
      { headers: { "cache-control": "private, max-age=120" } },
    );
  } catch {
    return NextResponse.json({ on: false, candidates: [], reason: "fuente no disponible" });
  }
}
