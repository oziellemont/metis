/**
 * mêtis CEO · cron de avisos.
 * Revisa a cada jugador: si desde el último aviso le llegó un asunto nuevo (según su horario),
 * le manda el correo "de" la persona que le escribe y, si lo activó, el WhatsApp.
 * Seguridad: `Authorization: Bearer $CRON_SECRET`. Prueba: ?dry=1 (no envía, solo lista).
 *
 * Frecuencia ideal: cada 15 min. En el plan Hobby de Vercel solo hay cron diario; para avisos
 * a la hora exacta usar Vercel Pro o un cron externo (cron-job.org) que llame esta URL.
 */
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCeoAdmin } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email";
import { arrivalsBetween, newState, streakOf } from "@/lib/ceo/engine";
import { ceoEmail, ceoWhatsappText, sendWhatsapp } from "@/lib/ceo/notify";
import type { CeoState } from "@/lib/ceo/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_LOOKBACK = 6 * 3_600_000; // si el cron estuvo apagado, no mandar avisos viejos

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const sb = supabaseCeoAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase no configurado (SUPABASE_SERVICE_ROLE_KEY)" }, { status: 503 });

  const appUrl = process.env.CEO_APP_URL ?? "https://metisalign.app";
  const now = Date.now();
  const { data: players, error } = await sb.from("players").select("user_id, name, email, phone, notify_email, notify_whatsapp, state, last_notified_at").limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const out: { user: string; item: string; email?: boolean; whatsapp?: boolean }[] = [];
  for (const p of players ?? []) {
    const s = { ...newState(), ...(p.state as CeoState) };
    if (!s.startedAt) continue;
    const from = Math.max(p.last_notified_at ? Date.parse(p.last_notified_at) : s.startedAt, now - MAX_LOOKBACK);
    // El reloj del jugador puede ir adelantado (modo prueba): los avisos usan su reloj.
    const off = s.clockOffset || 0;
    const fresh = arrivalsBetween(s, from + off, now + off).filter((e) => e.status === "pendiente");
    if (!fresh.length) continue;
    const streak = streakOf(s, now + off).days;
    for (const e of fresh) {
      const row = { user: p.user_id, item: e.item.id } as (typeof out)[number];
      if (p.notify_email && p.email) {
        const m = ceoEmail({ name: p.name, appUrl, entry: e, streak });
        row.email = dry ? true : (await sendMail({ to: p.email, ...m })).ok;
      }
      if (p.notify_whatsapp && p.phone) {
        row.whatsapp = dry ? true : (await sendWhatsapp(p.phone, ceoWhatsappText({ appUrl, entry: e }))).ok;
      }
      out.push(row);
    }
    if (!dry) await sb.from("players").update({ last_notified_at: new Date(now).toISOString() }).eq("user_id", p.user_id);
  }
  return NextResponse.json({ ok: true, dry, players: players?.length ?? 0, sent: out });
}
