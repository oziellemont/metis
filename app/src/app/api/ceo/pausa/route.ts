/**
 * POST /api/ceo/pausa → al pausar (vacaciones o día tranquilo), cancela en Resend los correos que el cron
 * ya había programado y los libera para reprogramarse una sola vez al reanudar (1.2, adenda §5).
 * - Exige sesión: el usuario sale de Supabase, nunca del cuerpo.
 * - Solo actúa si la partida guardada está de verdad en pausa (lo decide el motor, no el navegador).
 * - Idempotente: una segunda llamada no encuentra nada que cancelar.
 */
import { NextResponse } from "next/server";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { cancelMail } from "@/lib/email";
import { migrate, nowOf } from "@/lib/ceo/engine";
import { unscheduleAll } from "@/lib/ceo/cadence";
import { currentPause } from "@/lib/ceo/pausetime";
import type { Sent } from "@/lib/ceo/schedule";

export const dynamic = "force-dynamic";

export async function POST() {
  const sb = await supabaseServer();
  const admin = supabaseCeoAdmin();
  if (!sb || !admin) return NextResponse.json({ ok: false, error: "sin_backend" }, { status: 503 });
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return NextResponse.json({ ok: false, error: "sin_sesion" }, { status: 401 });
  const { data: p, error } = await admin.from("players").select("state, sent").eq("user_id", uid).maybeSingle();
  if (error || !p) return NextResponse.json({ ok: false, error: "sin_partida" }, { status: 409 });
  const real = Date.now();
  const s = migrate(p.state);
  if (!currentPause(s, nowOf(s, real))) return NextResponse.json({ ok: true, paused: false, cancelled: 0 });
  const u = unscheduleAll({ ...((p.sent as Sent) ?? {}) }, real);
  for (const id of u.ids) await cancelMail(id);
  if (u.changed) await admin.from("players").update({ sent: u.sent }).eq("user_id", uid);
  return NextResponse.json({ ok: true, paused: true, cancelled: u.ids.length });
}
