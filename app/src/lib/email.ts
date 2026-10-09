import { DEFAULT_EMAIL_FROM } from "@/lib/site";
/**
 * Envío de correo transaccional vía Resend (https://resend.com) usando fetch, sin SDK.
 * Sin RESEND_API_KEY los correos se registran en consola (modo demo / desarrollo).
 */
export interface MailAttachment { filename: string; content: string; contentType?: string }
/** `content` va en texto plano; se codifica en base64 al enviar. */
export interface Mail { to: string; subject: string; html: string; text?: string; attachments?: MailAttachment[] }

const KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;

export const hasEmail = Boolean(KEY);

export async function sendMail(m: Mail): Promise<{ ok: boolean; id?: string; error?: string; dryRun?: boolean }> {
  if (!KEY) {
    console.info(`[email:dry-run] → ${m.to} · ${m.subject}`);
    return { ok: true, dryRun: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [m.to], subject: m.subject, html: m.html, text: m.text,
      ...(m.attachments?.length ? { attachments: m.attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content, "utf8").toString("base64"), ...(a.contentType ? { content_type: a.contentType } : {}) })) } : {}),
    }),
  });
  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  const j = (await res.json()) as { id?: string };
  return { ok: true, id: j.id };
}

/** Envía en lotes pequeños para respetar límites del proveedor. */
export async function sendMany(mails: Mail[], batch = 10) {
  const results: Awaited<ReturnType<typeof sendMail>>[] = [];
  for (let i = 0; i < mails.length; i += batch) {
    results.push(...(await Promise.all(mails.slice(i, i + batch).map(sendMail))));
  }
  return results;
}
