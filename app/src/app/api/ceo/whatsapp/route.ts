/**
 * /api/ceo/whatsapp · registro, verificación (OTP), consentimiento, canal y revocación del WhatsApp del jugador.
 *   GET                                        estado: disponible, número (enmascarado), verificado, consentimiento, canal
 *   POST { action: "codigo", phone }           manda un código de 6 dígitos por WhatsApp (plantilla de autenticación)
 *   POST { action: "verificar", code }         verifica el número
 *   POST { action: "consentir" }               consentimiento explícito y separado (exige número verificado)
 *   POST { action: "canal", channel }          email | whatsapp | ambos (whatsapp/ambos exigen consentimiento vigente)
 *   POST { action: "revocar" }                 revoca el consentimiento y regresa al correo
 * Seguridad: exige sesión (el usuario sale de Supabase, nunca del cuerpo). Solo funciona con el interruptor «whatsapp»
 * prendido para el jugador y con su número en CEO_WHATSAPP_ALLOWLIST (prueba controlada). Revocar funciona siempre.
 * No toca la partida (ceo.players.state).
 */
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCeoAdmin, supabaseServer } from "@/lib/supabase/server";
import { flagsFor } from "@/lib/ceo/flags-server";
import { OTP_MAX_ATTEMPTS, OTP_RESEND_MS, OTP_TTL_MS, WA_CHANNELS, WA_TEMPLATES, allowlisted, channelOf, e164, waActive, waOtpPayload, type WaChannel } from "@/lib/ceo/whatsapp";
import { otpCode, otpHash, sameHash, waConfigured, waLog, waSend } from "@/lib/ceo/whatsapp-server";

export const dynamic = "force-dynamic";

const COLS = "wa_phone, wa_verified_at, wa_consent_at, wa_revoked_at, wa_channel";
const mask = (p?: string | null) => (p ? p.replace(/\d(?=\d{4})/g, "•") : null);
const err = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

async function who() {
  const sb = await supabaseServer();
  const admin = supabaseCeoAdmin();
  if (!sb || !admin) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ? { uid: data.user.id, admin } : null;
}

export async function GET() {
  const w = await who();
  if (!w) return err("sin_sesion", 401);
  const flags = await flagsFor(w.uid);
  const { data, error } = await w.admin.from("players").select(COLS).eq("user_id", w.uid).maybeSingle();
  if (error) return NextResponse.json({ ok: true, available: false, reason: error.code === "42703" ? "falta_migracion_0021" : "sin_datos" });
  const p = (data ?? {}) as { wa_phone?: string | null; wa_verified_at?: string | null; wa_consent_at?: string | null; wa_revoked_at?: string | null; wa_channel?: string | null };
  return NextResponse.json({
    ok: true, available: flags.whatsapp, live: waConfigured(),
    phone: mask(p.wa_phone), verified: !!p.wa_verified_at, consent: waActive({ ...p, wa_channel: "ambos" }),
    consentAt: p.wa_consent_at ?? null, revokedAt: p.wa_revoked_at ?? null, channel: channelOf(p),
    allowlisted: p.wa_phone ? allowlisted(p.wa_phone, process.env.CEO_WHATSAPP_ALLOWLIST) : null,
  });
}

export async function POST(req: NextRequest) {
  const w = await who();
  if (!w) return err("sin_sesion", 401);
  const body = (await req.json().catch(() => ({}))) as { action?: string; phone?: string; code?: string; channel?: string };
  const now = new Date();
  const { admin, uid } = w;

  // Revocar siempre funciona (aunque el interruptor esté apagado).
  if (body.action === "revocar") {
    const { error } = await admin.from("players").update({ wa_revoked_at: now.toISOString(), wa_channel: "email" }).eq("user_id", uid);
    return error ? err("no_guardado", 500) : NextResponse.json({ ok: true, channel: "email", consent: false });
  }

  const flags = await flagsFor(uid);
  if (!flags.whatsapp) return err("no_disponible", 403);
  const { data: p } = await admin.from("players").select(COLS).eq("user_id", uid).maybeSingle();
  if (!p) return err("sin_partida", 409);

  if (body.action === "codigo") {
    const phone = e164(body.phone ?? "");
    if (!phone) return err("numero_invalido");
    if (!allowlisted(phone, process.env.CEO_WHATSAPP_ALLOWLIST)) return err("numero_no_autorizado", 403);
    const { data: prev } = await admin.from("wa_otp").select("sent_at").eq("user_id", uid).maybeSingle();
    if (prev && now.getTime() - Date.parse(prev.sent_at) < OTP_RESEND_MS) return err("espera_un_minuto", 429);
    const code = otpCode();
    const up = await admin.from("wa_otp").upsert({ user_id: uid, phone, code_hash: otpHash(uid, phone, code), attempts: 0, sent_at: now.toISOString(), expires_at: new Date(now.getTime() + OTP_TTL_MS).toISOString() });
    if (up.error) return err("no_guardado", 500);
    const r = await waSend(waOtpPayload(phone, code));
    await waLog(admin, { user_id: uid, phone, kind: "codigo", template: WA_TEMPLATES.codigo, r });
    if (!r.ok) return err("no_enviado", 502);
    // En modo prueba (sin credenciales de Meta) y fuera de producción se devuelve el código para poder probar el flujo.
    return NextResponse.json({ ok: true, sent: true, dryRun: !!r.dryRun, ...(r.dryRun && process.env.VERCEL_ENV !== "production" ? { devCode: code } : {}) });
  }

  if (body.action === "verificar") {
    const { data: o } = await admin.from("wa_otp").select("phone, code_hash, attempts, expires_at").eq("user_id", uid).maybeSingle();
    if (!o) return err("sin_codigo", 409);
    if (Date.parse(o.expires_at) < now.getTime()) return err("codigo_vencido", 410);
    if (o.attempts >= OTP_MAX_ATTEMPTS) return err("demasiados_intentos", 429);
    const code = String(body.code ?? "").replace(/\D/g, "");
    if (!sameHash(otpHash(uid, o.phone, code), o.code_hash)) {
      await admin.from("wa_otp").update({ attempts: o.attempts + 1 }).eq("user_id", uid);
      return err("codigo_incorrecto");
    }
    // Número nuevo: el consentimiento anterior no se hereda.
    const changed = p.wa_phone && p.wa_phone !== o.phone;
    await admin.from("players").update({ wa_phone: o.phone, wa_verified_at: now.toISOString(), ...(changed ? { wa_consent_at: null, wa_channel: "email" } : {}) }).eq("user_id", uid);
    await admin.from("wa_otp").delete().eq("user_id", uid);
    return NextResponse.json({ ok: true, verified: true, phone: mask(o.phone) });
  }

  if (body.action === "consentir") {
    if (!p.wa_verified_at || !p.wa_phone) return err("verifica_tu_numero", 409);
    const { error } = await admin.from("players").update({ wa_consent_at: now.toISOString(), wa_revoked_at: null }).eq("user_id", uid);
    return error ? err("no_guardado", 500) : NextResponse.json({ ok: true, consent: true, consentAt: now.toISOString() });
  }

  if (body.action === "canal") {
    const ch = body.channel as WaChannel;
    if (!(WA_CHANNELS as readonly string[]).includes(ch)) return err("canal_invalido");
    if (ch !== "email" && !waActive({ ...p, wa_channel: ch })) return err("activa_whatsapp_primero", 409);
    const { error } = await admin.from("players").update({ wa_channel: ch }).eq("user_id", uid);
    return error ? err("no_guardado", 500) : NextResponse.json({ ok: true, channel: ch });
  }

  return err("accion_invalida");
}
