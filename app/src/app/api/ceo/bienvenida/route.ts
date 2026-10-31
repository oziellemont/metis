import { CEO_URL } from "@/lib/site";
/**
 * mêtis CEO · correo de bienvenida (carta de Ramiro).
 * Lo llama la app la primera vez que el jugador guarda su avance con la cuenta conectada.
 * Sale una sola vez por jugador (clave "welcome" en ceo.players.sent).
 */
import { NextResponse } from "next/server";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email";
import { isContinuous, migrate, packOf } from "@/lib/ceo/engine";
import { welcomeEmail } from "@/lib/ceo/emails";
import { fromHeader } from "@/lib/ceo/notify";
import type { Sent } from "@/lib/ceo/schedule";

export const dynamic = "force-dynamic";

export async function POST() {
  const sb = await supabaseServer();
  const admin = supabaseCeoAdmin();
  if (!sb || !admin) return NextResponse.json({ ok: false, error: "Supabase no configurado" }, { status: 503 });
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return NextResponse.json({ ok: false, error: "Inicia sesión primero." }, { status: 401 });

  const { data: p, error } = await admin.from("players").select("name, email, notify_email, state, sent").eq("user_id", u.user.id).maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!p) return NextResponse.json({ ok: false, error: "Todavía no hay avance guardado." }, { status: 409 });
  const sent: Sent = { ...((p.sent as Sent) ?? {}) };
  if (sent.welcome) return NextResponse.json({ ok: true, already: true });
  const to = p.email || u.user.email;
  if (!to || !p.notify_email) return NextResponse.json({ ok: true, skipped: true });

  const s = migrate(p.state);
  const settings = s.settings;
  const appUrl = process.env.CEO_APP_URL ?? (process.env.CEO_MOVED !== "0" ? CEO_URL : "https://metisalign.app");
  const m = welcomeEmail({ pack: packOf(s), name: p.name ?? "", appUrl, windowStart: settings.windowStart, windowEnd: settings.windowEnd, continuous: isContinuous(s) });
  const r = await sendMail({
    to, from: fromHeader(m), subject: m.subject, html: m.html, text: m.text,
    idempotencyKey: `ceo:${u.user.id}:welcome`, tags: [{ name: "app", value: "ceo" }, { name: "tipo", value: "welcome" }],
  });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  sent.welcome = Date.now();
  await admin.from("players").update({ sent }).eq("user_id", u.user.id);
  return NextResponse.json({ ok: true });
}
