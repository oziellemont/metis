import { CEO_URL } from "@/lib/site";
/**
 * mêtis CEO · cron de correos.
 * Para cada jugador decide qué toca mandar (reglas en lib/ceo/schedule) y lo envía con Resend.
 * Cada aviso se anota en ceo.players.sent → nunca sale dos veces (y Resend recibe una Idempotency-Key).
 *
 *   ?dry=1   no envía ni anota; solo lista lo que mandaría
 *   ?plan=1  corrida diaria (plan Hobby de Vercel): además programa en Resend los asuntos de las
 *            próximas 24 h a su hora exacta y el resumen de la mañana.
 *
 * Frecuencia ideal: cada 15 min (cron-job.org gratis, o Vercel Pro) → los recordatorios de
 * "está por vencer" y "cuida tu racha" llegan a su hora. Con solo la corrida diaria llegan
 * los asuntos (programados) y el resumen, pero no esos dos recordatorios.
 *
 * Seguridad: `Authorization: Bearer $CRON_SECRET`.
 */
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCeoAdmin } from "@/lib/supabase/server";
import { cancelMail, sendMail } from "@/lib/email";
import { migrate, nowOf, packOf } from "@/lib/ceo/engine";
import { schedKey, unscheduleAll } from "@/lib/ceo/cadence";
import { currentPause } from "@/lib/ceo/pausetime";
import { jobsFor, type Sent } from "@/lib/ceo/schedule";
import { renderJob } from "@/lib/ceo/mailer";
import { ceoWhatsappText, fromHeader, sendWhatsapp } from "@/lib/ceo/notify";
import type { CeoState } from "@/lib/ceo/types";
import { worldJobs } from "@/lib/ceo/world/notify";
import { worldEmail } from "@/lib/ceo/emails";
import { pushFor, pushKey, sendPush, vapidKeys, type PushJob, type PushSub, type SecretStore } from "@/lib/ceo/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  // La corrida diaria de Vercel (user-agent vercel-cron) siempre planea el día.
  const plan = req.nextUrl.searchParams.get("plan") === "1" || (req.headers.get("user-agent") ?? "").includes("vercel-cron");
  const sb = supabaseCeoAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase no configurado (SUPABASE_SERVICE_ROLE_KEY)" }, { status: 503 });

  const appUrl = process.env.CEO_APP_URL ?? (process.env.CEO_MOVED !== "0" ? CEO_URL : "https://metisalign.app");
  const real = Date.now();
  const { data: players, error } = await sb.from("players").select("user_id, name, email, phone, notify_email, notify_whatsapp, state, sent").limit(2000);
  if (error) return NextResponse.json({ error: error.message, hint: error.code === "42703" ? "Falta correr la migración 0014_ceo_correos.sql" : undefined }, { status: 500 });

  const out: { user: string; key: string; subject: string; at?: string; ok: boolean; error?: string }[] = [];
  // Avisos al celular (Web Push, gratis): suscripciones de todos los jugadores en una sola consulta.
  const subs = new Map<string, PushSub[]>();
  const keys = await vapidKeys(sb as unknown as SecretStore);
  if (keys) {
    const { data: rows } = await sb.from("push_subscriptions").select("user_id, endpoint, p256dh, auth").limit(5000);
    for (const r of rows ?? []) subs.set(r.user_id, [...(subs.get(r.user_id) ?? []), { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }]);
  }
  for (const p of players ?? []) {
    if (Date.now() - real > 50_000) break; // margen antes del límite de 60 s; lo que falte sale en la siguiente corrida
    const s: CeoState = migrate(p.state);
    if (!s.startedAt) continue;
    const sent: Sent = { ...((p.sent as Sent) ?? {}) };
    // 1.2: en pausa no se manda nada y se cancela lo programado (al reanudar se vuelve a programar una vez).
    if (currentPause(s, nowOf(s, real))) {
      const u = unscheduleAll(sent, real);
      if (u.changed && !dry) {
        for (const id of u.ids) await cancelMail(id);
        await sb.from("players").update({ sent: u.sent }).eq("user_id", p.user_id);
      }
      continue;
    }
    const jobs = jobsFor(s, sent, real, { plan });
    const wjobs = worldJobs(s, sent, nowOf(s, real));
    let changed = false;
    // Celular (Web Push): mismas reglas que el correo pero con su propia bitácora («push:<clave>»), así un correo
    // programado para más tarde no impide que el aviso al celular salga cuando el asunto ya llegó.
    const mine = subs.get(p.user_id) ?? [];
    if (mine.length) {
      const psent: Sent = { welcome: 1 };
      for (const [k, v] of Object.entries(sent)) if (k.startsWith("push:")) psent[k.slice(5)] = v as Sent[string];
      const company = packOf(s).short;
      const pjobs = [...worldJobs(s, psent, nowOf(s, real)).map((w) => ({ ...w, kind: "world" as const })), ...jobsFor(s, psent, real, {})] as PushJob[];
      for (const j of pjobs) {
        const msg = pushFor(j, company);
        if (!msg) continue;
        let ok = false;
        for (const sub of mine) {
          const r = dry ? { ok: true, gone: false } : await sendPush(sub, msg, keys);
          if (r.ok) ok = true;
          else if (r.gone && !dry) await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        out.push({ user: p.user_id, key: pushKey(j.key), subject: msg.title, ok });
        if (ok && !dry) { sent[pushKey(j.key)] = real; changed = true; }
      }
    }
    if (!jobs.length && !wjobs.length) { if (changed) await sb.from("players").update({ sent }).eq("user_id", p.user_id); continue; }
    const to = (p.email as string | null) || s.settings.email || "";
    // World Events: un correo por acontecimiento y revisión, solo con el caso abierto y la preferencia activada.
    for (const w of wjobs) {
      if (!to || !p.notify_email) { if (!dry) { sent[w.key] = real; changed = true; } continue; }
      const m = worldEmail({ pack: packOf(s), name: p.name ?? "", appUrl, event: w.world.name, label: w.world.label, source: w.world.source.name, sourceUrl: w.world.source.url, assets: w.world.assets, subjectLine: w.subject, daysLeft: w.world.daysLeft, forecast: w.world.status === "pronostico", official: !!w.world.facts });
      const r = dry ? { ok: true, error: undefined as string | undefined } : await sendMail({ to, from: fromHeader(m), subject: m.subject, html: m.html, text: m.text, idempotencyKey: `ceo:${p.user_id}:${w.key}`, tags: [{ name: "app", value: "ceo" }, { name: "tipo", value: "mundo" }] });
      out.push({ user: p.user_id, key: w.key, subject: m.subject, ok: r.ok, error: r.error });
      if (r.ok && !dry) { sent[w.key] = real; changed = true; }
    }
    for (const job of jobs) {
      const at = "at" in job && job.at ? new Date(job.at).toISOString() : undefined;
      // Sin correo o con avisos apagados: se anota como resuelto para no reintentar (la bienvenida espera a que haya correo).
      if (!to || !p.notify_email) {
        if (job.kind !== "welcome" && !dry) { sent[job.key] = real; changed = true; }
        continue;
      }
      const m = renderJob(job, s, p.name ?? "", appUrl, real);
      const r = dry ? { ok: true, error: undefined as string | undefined } : await sendMail({
        to, from: fromHeader(m), subject: m.subject, html: m.html, text: m.text, scheduledAt: at,
        idempotencyKey: `ceo:${p.user_id}:${job.key}`, tags: [{ name: "app", value: "ceo" }, { name: "tipo", value: job.kind }],
      });
      out.push({ user: p.user_id, key: job.key, subject: m.subject, at, ok: r.ok, error: r.error });
      if (r.ok && !dry) { sent[job.key] = real; if (at && "id" in r && r.id) sent[schedKey(job.key)] = `${r.id}|${at}`; changed = true; }
      // WhatsApp EN PAUSA: no se envía nada salvo que CEO_WHATSAPP_ENABLED=1 (no configurado). Solo para asuntos que llegan ya, no para los programados.
      if (job.kind === "case" && !at && process.env.CEO_WHATSAPP_ENABLED === "1" && p.notify_whatsapp && p.phone && !dry) await sendWhatsapp(p.phone, ceoWhatsappText({ appUrl, entry: job.entry, pack: packOf(s) }));
    }
    if (changed) await sb.from("players").update({ sent, last_notified_at: new Date(real).toISOString() }).eq("user_id", p.user_id);
  }
  return NextResponse.json({ ok: true, dry, plan, players: players?.length ?? 0, sent: out });
}
