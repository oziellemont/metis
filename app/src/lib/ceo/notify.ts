/**
 * mêtis CEO · avisos fuera de la app (correo y WhatsApp).
 * La idea: que se sienta como el cargo. El correo llega "de" la persona que te escribe
 * (p. ej. "Lucía Treviño · Botanas Cumbre") y el WhatsApp con su voz.
 * Sin credenciales todo corre en modo prueba (se registra en consola, no se envía).
 */
import { CAST, COMPANY, firstName } from "./cast";
import type { Entry } from "./types";
import { DEFAULT_EMAIL_FROM } from "@/lib/site";

const INK = "#171A3A", INDIGO = "#4F3FE0", SLATE = "#475569", MUTED = "#94A3B8", CANVAS = "#F6F7FC";
const FONT = "Poppins,'Segoe UI',Helvetica,Arial,sans-serif";
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const plain = (t: string) => t.replace(/\*\*(.+?)\*\*/g, "$1");

/** Dirección verificada del remitente (de EMAIL_FROM o la de mêtis). */
function senderAddress() {
  const raw = process.env.CEO_EMAIL_FROM ?? process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;
  const m = raw.match(/<([^>]+)>/);
  return m ? m[1] : raw.trim();
}

export function ceoEmail(input: { name: string; appUrl: string; entry: Entry; streak: number }) {
  const { item } = input.entry;
  const who = CAST[item.from];
  const link = `${input.appUrl.replace(/\/$/, "")}/caso/${item.id}`;
  const first = (input.name || "").split(" ")[0] || "";
  const subject = item.channel === "email" ? item.subject : item.channel === "whatsapp" ? `WhatsApp de ${firstName(item.from)}: ${plain(item.preview).slice(0, 60)}…` : `${firstName(item.from)}: ${item.subject}`;
  const body = item.channel === "email" ? item.body : [item.preview];
  const paras = body.slice(0, 3).map((p) => `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:24px;color:${INK}">${esc(p)}</p>`).join("");
  const more = item.channel === "email" && body.length > 3 ? `<p style="margin:0 0 14px;font-family:${FONT};font-size:14px;color:${MUTED}">…</p>` : "";
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#fff;border-radius:16px">
  <tr><td style="padding:22px 26px 6px;font-family:${FONT};font-size:12px;color:${MUTED}">${COMPANY.name} · Para: ${esc(first || "Dirección General")}</td></tr>
  <tr><td style="padding:0 26px 4px;font-family:${FONT};font-size:14px;color:${SLATE}"><b style="color:${INK}">${esc(who.name)}</b> · ${esc(who.role)}</td></tr>
  <tr><td style="padding:16px 26px 4px">${paras}${more}</td></tr>
  <tr><td style="padding:4px 26px 24px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${INDIGO}" style="border-radius:12px">
      <a href="${link}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;font-weight:600;color:#fff;text-decoration:none">${item.channel === "email" ? "Responder" : "Abrir y decidir"}</a>
    </td></tr></table>
  </td></tr>
</table>
<p style="margin:14px 0 0;font-family:${FONT};font-size:11px;color:${MUTED}">mêtis CEO · ${input.streak > 0 ? `🔥 ${input.streak} días de racha · ` : ""}Este asunto vence en ${item.deadlineH ?? 24} h. Cambia tus avisos en Ajustes.</p>
</td></tr></table></body></html>`;
  const text = `${who.name} (${who.role})\n\n${body.map(plain).join("\n\n")}\n\nResponder: ${link}`;
  return { subject, html, text, from: `${who.name} · ${COMPANY.name} <${senderAddress()}>` };
}

export function ceoWhatsappText(input: { appUrl: string; entry: Entry }) {
  const { item } = input.entry;
  const who = CAST[item.from];
  const link = `${input.appUrl.replace(/\/$/, "")}/caso/${item.id}`;
  return `*${who.name}* · ${COMPANY.name}\n${plain(item.preview)}\n\nResponder: ${link}`;
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
 * Nota: WhatsApp exige plantillas aprobadas para iniciar conversación; con el sandbox de Twilio
 * se puede probar de inmediato.
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
