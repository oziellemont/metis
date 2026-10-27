/**
 * mêtis CEO · diagnóstico (solo lectura, sin costo).
 * Responde qué entorno es, a qué proyecto de Supabase apunta y qué interruptores ve.
 * Nunca muestra llaves. En producción exige ?token=<CRON_SECRET>.
 */
import { NextResponse } from "next/server";
import { SUPABASE_SERVICE, SUPABASE_URL } from "@/lib/supabase/env";
import { supabaseCeoAdmin } from "@/lib/supabase/server";
import { appEnvOf } from "@/lib/ceo/flags";
import { flagsFor, globalFlagRows } from "@/lib/ceo/flags-server";

export const dynamic = "force-dynamic";

const PROJECTS: Record<string, string> = { vaacxucxccneyvpnbdwe: "metis-pruebas", izmbbckhslvdzunpvvqi: "producción" };

export async function GET(req: Request) {
  const env = appEnvOf(process.env.VERCEL_ENV, process.env.NODE_ENV);
  if (env === "production") {
    const token = new URL(req.url).searchParams.get("token");
    if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ env }, { status: 401 });
  }
  let ref = "";
  try { ref = new URL(SUPABASE_URL).hostname.split(".")[0]; } catch { /* sin URL */ }
  const rows = await globalFlagRows();
  let errorTablas: string | null = null;
  if (rows === null) {
    const sb = supabaseCeoAdmin();
    const r = sb ? await sb.from("flags").select("key").limit(1) : null;
    errorTablas = r?.error ? `${r.error.code ?? ""} ${r.error.message}`.trim().slice(0, 200) : sb ? null : "sin cliente";
  }
  const llave = SUPABASE_SERVICE.startsWith("sb_secret_") ? "sb_secret" : SUPABASE_SERVICE.startsWith("eyJ") ? "jwt" : SUPABASE_SERVICE ? "otro" : "ninguna";
  return NextResponse.json({
    env,
    supabase: { proyecto: PROJECTS[ref] ?? (ref ? "otro" : "sin configurar"), llaveServicio: llave },
    errorTablas,
    tablasFase0: rows !== null,
    interruptores: await flagsFor(null),
    openai: { llave: Boolean((process.env.OPENAI_API_KEY ?? "").trim()), candadoEntorno: process.env.CEO_AI_ENABLED === "1" },
  });
}
