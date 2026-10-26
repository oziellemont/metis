/**
 * mêtis CEO · envío de avisos fuera de la app (correo y WhatsApp).
 * Las plantillas viven en ./emails; las reglas de "qué toca mandar y cuándo" en ./schedule.
 * Sin credenciales todo corre en modo prueba (se registra en consola, no se envía).
 */
import { CAST, COMPANY } from "./cast";
import type { Entry } from "./types";
import type { Mailable } from "./emails";
import { DEFAULT_EMAIL_FROM } from "@/lib/site";
import { plain } from "./emails";

/** Dirección verificada en Resend (por defecto la de mêtis: recordatorios@metisalign.mx). */
export function senderAddress() {
  const raw = process.env.CEO_EMAIL_FROM ?? process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;
  const m = raw.match(/<([^>]+)>/);
  return m ? m[1] : raw.trim();
}
/** "Lucía Treviño · Botanas Cumbre <recordatorios@metisalign.mx>" — sin caracteres que rompan el encabezado. */
export function fromHeader(m: Pick<Mailable, "fromName">) {
  return `${m.fromName.replace(/[<>"]/g, "")} <${senderAddress()}>`;
}

export function ceoWhatsappText(input: { appUrl: string; entry: Entry }) {
  const { item } = input.entry;
  const who = CAST[item.from];
  return `*${who.name}* · ${COMPANY.name}\n${plain(item.preview)}\n\nResponder: ${input.appUrl.replace(/\/$/, "")}/caso/${item.id}`;
}

/** Normaliza a formato internacional (+52…). Si son 10 dígitos, asume México. */
export function e164(phone: string) {
  const d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.length === 10) return `+52${d}`;
  return d ? `+${d}` : "";
}

/**
 * WhatsApp vía Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM = "whatsapp:+1…").
 * WhatsApp exige plantillas aprobadas para iniciar conversación; con el sandbox de Twilio se prueba de inmediato.
 */
export async function sendWhatsapp(to: string, body: string): Promise<{ ok: boolean; dryRun?: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_WHATSAPP_FROM;
  const num = e164(to);
  if (!num) return { ok: false, error: "sin teléfono" };
  if (!sid || !token || !from) {
    console.info(`[whatsapp:dry-run] → ${num} · ${body.split("\n")[0]}`);
    return { ok: true, dryRun: true };
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: from, To: `whatsapp:${num}`, Body: body }),
  });
  return res.ok ? { ok: true } : { ok: false, error: `${res.status} ${await res.text()}` };
}
