// Solo servidor.
/**
 * mêtis CEO · envío por WhatsApp Business Cloud API (Meta) y bitácora.
 * Variables (Vercel):
 *   WHATSAPP_TOKEN              token permanente de un usuario de sistema (permiso whatsapp_business_messaging)
 *   WHATSAPP_PHONE_NUMBER_ID    id del número emisor (no el número)
 *   WHATSAPP_VERIFY_TOKEN       texto libre para verificar el webhook
 *   WHATSAPP_APP_SECRET         secreto de la app (firma X-Hub-Signature-256 del webhook)
 *   CEO_WHATSAPP_ALLOWLIST      números autorizados para la prueba controlada (coma); vacío = nadie; «*» = todos
 *   WHATSAPP_TEMPLATE_CASE / _REMINDER / _OTP / _LANG   (opcional) nombres de plantilla
 * Sin WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID todo corre en modo prueba: se registra, no se envía.
 * Nada de aquí lanza: un error de WhatsApp se devuelve y se registra, nunca toca la partida.
 */
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { supabaseCeoAdmin } from "@/lib/supabase/server";
import { e164 } from "./whatsapp";

type SupabaseClient = NonNullable<ReturnType<typeof supabaseCeoAdmin>>;

const GRAPH = "https://graph.facebook.com/v21.0";

export const waConfigured = () => Boolean((process.env.WHATSAPP_TOKEN ?? "").trim() && (process.env.WHATSAPP_PHONE_NUMBER_ID ?? "").trim());

export interface WaSendResult { ok: boolean; dryRun?: boolean; wamid?: string; error?: string }

/** Manda un mensaje (cuerpo ya armado con waPayload / waOtpPayload). Tiempo máximo 8 s. */
export async function waSend(payload: Record<string, unknown>): Promise<WaSendResult> {
  if (!waConfigured()) {
    console.info(`[whatsapp:dry-run] → ${String(payload.to ?? "").replace(/\d(?=\d{4})/g, "•")} · ${(payload.template as { name?: string })?.name ?? "texto"}`);
    return { ok: true, dryRun: true };
  }
  try {
    const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    const j = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { code?: number; message?: string } };
    if (!res.ok) return { ok: false, error: `${res.status} ${j.error?.code ?? ""} ${j.error?.message ?? ""}`.trim().slice(0, 300) };
    return { ok: true, wamid: j.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 300) };
  }
}

/** Registra un envío en la bitácora. Nunca lanza. Devuelve false si la clave ya existía (no duplicar). */
export async function waLog(sb: SupabaseClient, row: { user_id: string; phone: string; kind: string; job_key?: string | null; template: string; r: WaSendResult }): Promise<boolean> {
  try {
    const { error } = await sb.from("wa_messages").insert({
      user_id: row.user_id, phone: e164(row.phone), kind: row.kind, job_key: row.job_key ?? null, template: row.template,
      wamid: row.r.wamid ?? null, status: row.r.dryRun ? "dry_run" : row.r.ok ? "sent" : "error", error: row.r.error ?? null,
    });
    return !error || error.code !== "23505";
  } catch { return true; }
}

/** Reserva la clave antes de enviar (índice único por jugador y clave): si ya existe, no se manda. */
export async function waReserve(sb: SupabaseClient, userId: string, phone: string, kind: string, jobKey: string, template: string): Promise<number | null> {
  try {
    const { data, error } = await sb.from("wa_messages").insert({ user_id: userId, phone: e164(phone), kind, job_key: jobKey, template, status: "queued" }).select("id").single();
    if (error) return null;
    return (data as { id: number }).id;
  } catch { return null; }
}
export async function waFinish(sb: SupabaseClient, id: number, r: WaSendResult) {
  try {
    await sb.from("wa_messages").update({ wamid: r.wamid ?? null, status: r.dryRun ? "dry_run" : r.ok ? "sent" : "error", error: r.error ?? null, updated_at: new Date().toISOString() }).eq("id", id);
  } catch { /* la bitácora nunca rompe el envío */ }
}

// ─── OTP
export const otpCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
export const otpHash = (userId: string, phone: string, code: string) =>
  createHash("sha256").update(`${process.env.WHATSAPP_APP_SECRET ?? process.env.CRON_SECRET ?? "metis"}|${userId}|${e164(phone)}|${code}`).digest("hex");
export function sameHash(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Firma del webhook (X-Hub-Signature-256). Sin WHATSAPP_APP_SECRET no se acepta nada en producción. */
export function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return process.env.VERCEL_ENV !== "production";
  if (!header?.startsWith("sha256=")) return false;
  const want = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  return sameHash(want, header);
}
