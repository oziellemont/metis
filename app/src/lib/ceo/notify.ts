/**
 * mêtis CEO · envío de avisos fuera de la app (correo).
 * Las plantillas viven en ./emails; las reglas de "qué toca mandar y cuándo" en ./schedule.
 * Sin credenciales todo corre en modo prueba (se registra en consola, no se envía).
 */
import type { Mailable } from "./emails";
import { DEFAULT_EMAIL_FROM } from "@/lib/site";

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

/**
 * WhatsApp vive en ./whatsapp (lógica) y ./whatsapp-server (Meta Cloud API). El envío por Twilio que estaba aquí se
 * retiró: mandaba con solo marcar una casilla, sin verificar el número ni pedir consentimiento.
 */
export { e164 } from "./whatsapp";
