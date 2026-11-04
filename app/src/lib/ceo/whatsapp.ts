/**
 * mêtis CEO · WhatsApp real (Meta WhatsApp Business Cloud API). Lógica pura: sin red ni reloj propio.
 *
 * Candados (todos deben estar abiertos para mandar un solo mensaje):
 *  1. Interruptor «whatsapp» (ceo.flags) prendido para el jugador. Arranca APAGADO.
 *  2. El número está en la lista autorizada CEO_WHATSAPP_ALLOWLIST (vacía = nadie; «*» = todos).
 *  3. El jugador verificó su número con un código (OTP) que le llegó por WhatsApp.
 *  4. Dio un consentimiento explícito y separado, y no lo ha revocado (en la app o escribiendo BAJA).
 *  5. Eligió WhatsApp o ambos como canal.
 *  6. No está en pausa (vacaciones o día tranquilo) y es su horario.
 * El campo viejo `notify_whatsapp` (onboarding) NO abre nada: nunca se le escribe a quien no activó el canal aquí.
 *
 * Los avisos reutilizan las mismas reglas del correo (schedule.jobsFor) con claves propias `wa:<clave>`:
 * cada asunto sale una sola vez por WhatsApp aunque el correo ya haya salido o esté programado.
 * Un error de WhatsApp nunca toca la partida: solo se registra.
 */
import { personOf } from "./cast";
import { jobsFor, localHour, type Job, type Sent } from "./schedule";
import { currentPause } from "./pausetime";
import type { CeoState, CompanyPack } from "./types";

export type WaChannel = "email" | "whatsapp" | "ambos";
export const WA_CHANNELS: readonly WaChannel[] = ["email", "whatsapp", "ambos"];

export interface WaPlayer {
  wa_phone?: string | null;
  wa_verified_at?: string | null;
  wa_consent_at?: string | null;
  wa_revoked_at?: string | null;
  wa_channel?: string | null;
}

/** Normaliza a E.164 (+52…). Diez dígitos se asumen de México. */
export function e164(phone: string) {
  const d = (phone ?? "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return /^\+\d{8,15}$/.test(d) ? d : "";
  if (d.length === 10) return `+52${d}`;
  return /^\d{8,15}$/.test(d) ? `+${d}` : "";
}

/** Lista autorizada: vacía o sin definir = nadie (prueba controlada); «*» = cualquiera. */
export function allowlisted(phone: string, allowlist: string | undefined | null): boolean {
  const raw = (allowlist ?? "").trim();
  if (!raw) return false;
  if (raw === "*") return true;
  const n = e164(phone);
  return !!n && raw.split(/[,\s;]+/).map(e164).filter(Boolean).includes(n);
}

export const channelOf = (p: WaPlayer): WaChannel => (WA_CHANNELS as readonly string[]).includes(p.wa_channel ?? "") ? (p.wa_channel as WaChannel) : "email";

/** El canal está activo de verdad (verificado + consentimiento vigente + canal elegido). */
export function waActive(p: WaPlayer): boolean {
  if (!p.wa_phone || !p.wa_verified_at || !p.wa_consent_at) return false;
  if (p.wa_revoked_at && Date.parse(p.wa_revoked_at) >= Date.parse(p.wa_consent_at)) return false;
  return channelOf(p) !== "email";
}

/** ¿Se le puede escribir por WhatsApp a este jugador? (candados 1 a 5). */
export function waEligible(p: WaPlayer, flagOn: boolean, allowlist: string | undefined | null): boolean {
  return flagOn && waActive(p) && allowlisted(p.wa_phone ?? "", allowlist);
}

/** ¿El correo de asuntos y recordatorios sigue saliendo? Solo se apaga si WhatsApp está activo y eligió «solo WhatsApp». */
export function emailForCases(p: WaPlayer, eligible: boolean): boolean {
  return !(eligible && channelOf(p) === "whatsapp");
}

/** Clave de envío por WhatsApp (separada de la del correo). */
export const waKey = (k: string) => `wa:${k}`;

/**
 * Avisos que tocan por WhatsApp ahora: los mismos asuntos y recordatorios que el correo, con claves `wa:`.
 * Sin programados (WhatsApp no se agenda), sin bienvenida, resumen ni cierre (esos van solo por correo).
 * Respeta pausa y horario del jugador.
 */
export function waJobsFor(s: CeoState, sent: Sent, real: number): Job[] {
  if (!s.startedAt) return [];
  const now = real + (s.clockOffset || 0);
  if (currentPause(s, now)) return [];
  const { tz, windowStart, windowEnd } = s.settings;
  const h = localHour(now, tz);
  if (!(h >= windowStart && h < windowEnd)) return [];
  const view: Sent = { welcome: 1 };
  for (const [k, v] of Object.entries(sent)) if (k.startsWith("wa:")) view[k.slice(3)] = v;
  return jobsFor(s, view, real).filter((j) => (j.kind === "case" && !j.at) || j.kind === "reminder").map((j) => ({ ...j, key: waKey(j.key) }));
}

// ─── Plantillas (deben estar aprobadas en Meta con estos nombres y estas variables)
export const WA_TEMPLATES = {
  asunto: process.env.WHATSAPP_TEMPLATE_CASE ?? "metis_asunto",
  recordatorio: process.env.WHATSAPP_TEMPLATE_REMINDER ?? "metis_recordatorio",
  codigo: process.env.WHATSAPP_TEMPLATE_OTP ?? "metis_codigo",
} as const;
export const WA_LANG = process.env.WHATSAPP_TEMPLATE_LANG ?? "es_MX";

/** Meta no acepta saltos de línea, tabuladores ni más de 4 espacios seguidos en una variable; máximo razonable 300. */
export function waParam(t: string, max = 300): string {
  const s = (t ?? "").replace(/<[^>]+>/g, "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export interface WaTemplateMsg {
  template: string;
  /** Variables del cuerpo, en orden. */
  body: string[];
  /** Sufijo del botón de enlace (la parte variable de la URL aprobada: https://www.metis.ceo/caso/{{1}}). */
  button?: string;
  /** Vista previa en texto plano (registro y pruebas). */
  preview: string;
}

/**
 * Asunto nuevo. Plantilla «metis_asunto» (categoría utilidad):
 *   Simulación MÊTIS · {{1}}, {{2}} de {{3}}, te escribió: «{{4}}». Es un mensaje de tu equipo dentro de la simulación.
 *   [Botón: Abrir el asunto → https://www.metis.ceo/caso/{{1}}]
 */
export function waCaseMsg(pack: CompanyPack, job: Extract<Job, { kind: "case" }>, appUrl: string): WaTemplateMsg {
  const it = job.entry.item;
  const who = personOf(pack, it.from);
  const body = [waParam(who.name, 60), waParam(who.role || "tu equipo", 80), waParam(pack.name, 80), waParam(it.preview || it.subject, 220)];
  return { template: WA_TEMPLATES.asunto, body, button: it.id, preview: `Simulación MÊTIS · ${body[0]}, ${body[1]} de ${body[2]}, te escribió: «${body[3]}». Es un mensaje de tu equipo dentro de la simulación. ${appUrl.replace(/\/$/, "")}/caso/${it.id}` };
}

/**
 * Por vencer. Plantilla «metis_recordatorio» (utilidad):
 *   Simulación MÊTIS · {{1}} ({{2}}) sigue esperando tu decisión sobre «{{3}}». Te quedan {{4}}.
 *   [Botón: Decidir ahora → https://www.metis.ceo/caso/{{1}}]
 */
export function waReminderMsg(pack: CompanyPack, job: Extract<Job, { kind: "reminder" }>, appUrl: string): WaTemplateMsg {
  const it = job.entry.item;
  const who = personOf(pack, it.from);
  const left = job.hoursLeft >= 1 ? `${Math.floor(job.hoursLeft)} h` : `${Math.max(1, Math.round(job.hoursLeft * 60))} min`;
  const body = [waParam(who.name, 60), waParam(who.role || "tu equipo", 80), waParam(it.subject, 160), left];
  return { template: WA_TEMPLATES.recordatorio, body, button: it.id, preview: `Simulación MÊTIS · ${body[0]} (${body[1]}) sigue esperando tu decisión sobre «${body[2]}». Te quedan ${left}. ${appUrl.replace(/\/$/, "")}/caso/${it.id}` };
}

export function waMsgFor(pack: CompanyPack, job: Job, appUrl: string): WaTemplateMsg | null {
  if (job.kind === "case") return waCaseMsg(pack, job, appUrl);
  if (job.kind === "reminder") return waReminderMsg(pack, job, appUrl);
  return null;
}

/** Cuerpo para la Cloud API (POST /{phone-number-id}/messages). */
export function waPayload(to: string, m: WaTemplateMsg) {
  const components: unknown[] = [{ type: "body", parameters: m.body.map((text) => ({ type: "text", text })) }];
  if (m.button) components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: m.button }] });
  return { messaging_product: "whatsapp", recipient_type: "individual", to: e164(to).replace(/^\+/, ""), type: "template", template: { name: m.template, language: { code: WA_LANG }, components } };
}

/** Código de verificación. Plantilla de autenticación «metis_codigo» (texto fijo de Meta + botón «copiar código»). */
export function waOtpPayload(to: string, code: string) {
  return {
    messaging_product: "whatsapp", recipient_type: "individual", to: e164(to).replace(/^\+/, ""), type: "template",
    template: { name: WA_TEMPLATES.codigo, language: { code: WA_LANG }, components: [
      { type: "body", parameters: [{ type: "text", text: code }] },
      { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
    ] },
  };
}

// ─── Código de verificación (OTP)
export const OTP_TTL_MS = 10 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_MS = 60_000;

// ─── Webhook (estados de entrega y bajas)
export type WaStatus = "sent" | "delivered" | "read" | "failed";
export interface WaWebhookEvent { kind: "status"; wamid: string; status: WaStatus; at: number; error?: string }
export interface WaInbound { kind: "inbound"; from: string; text: string; at: number }
const STOP = /^\s*(baja|stop|alto|cancelar|unsubscribe|detener)\s*[.!]*\s*$/i;
export const isStop = (t: string) => STOP.test(t ?? "");

/** Extrae estados y mensajes entrantes del cuerpo del webhook de Meta. Tolerante: lo que no entiende lo ignora. */
export function parseWebhook(body: unknown): (WaWebhookEvent | WaInbound)[] {
  const out: (WaWebhookEvent | WaInbound)[] = [];
  const entries = (body as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return out;
  for (const e of entries) {
    const changes = (e as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const c of changes) {
      const v = (c as { value?: Record<string, unknown> })?.value ?? {};
      for (const st of (Array.isArray(v.statuses) ? v.statuses : []) as Record<string, unknown>[]) {
        const status = String(st.status ?? "");
        if (!["sent", "delivered", "read", "failed"].includes(status) || typeof st.id !== "string") continue;
        const errs = Array.isArray(st.errors) ? (st.errors as Record<string, unknown>[]) : [];
        out.push({ kind: "status", wamid: st.id, status: status as WaStatus, at: Number(st.timestamp ?? 0) * 1000, ...(errs.length ? { error: `${errs[0].code ?? ""} ${errs[0].title ?? errs[0].message ?? ""}`.trim() } : {}) });
      }
      for (const m of (Array.isArray(v.messages) ? v.messages : []) as Record<string, unknown>[]) {
        const text = (m.text as { body?: string } | undefined)?.body ?? (m.button as { text?: string } | undefined)?.text ?? "";
        if (typeof m.from === "string") out.push({ kind: "inbound", from: e164(`+${m.from}`), text, at: Number(m.timestamp ?? 0) * 1000 });
      }
    }
  }
  return out;
}

/** Orden de los estados: un «delivered» que llega tarde no regresa un «read» a «delivered». */
export const STATUS_RANK: Record<string, number> = { queued: 0, dry_run: 0, sent: 1, delivered: 2, read: 3, failed: 4, error: 4 };

// ─── Costo estimado (Meta, México, desde el 1-oct-2026; utilidad y autenticación por mensaje entregado)
export const WA_PRICE_USD = { utility: 0.0085, authentication: 0.0085, marketing: 0.0397 } as const;
/**
 * Costo mensual estimado en USD. `perUserMonth`: avisos de utilidad por usuario al mes (asuntos + recordatorios);
 * `otpShare`: fracción de usuarios que verifica (o re-verifica) su número en el mes.
 */
export function waMonthlyCost(activeUsers: number, perUserMonth: number, otpShare = 0.1): { messages: number; usd: number } {
  const utility = activeUsers * perUserMonth;
  const otp = Math.ceil(activeUsers * otpShare);
  const usd = utility * WA_PRICE_USD.utility + otp * WA_PRICE_USD.authentication;
  return { messages: utility + otp, usd: Math.round(usd * 100) / 100 };
}
