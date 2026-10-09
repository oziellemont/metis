/** Pide al servidor que mande (o reenvíe) el correo de una invitación. */
export type SendState = { state: "sending" | "sent" | "manual" | "error"; msg?: string };

export async function sendInvitationEmail(id: string): Promise<SendState> {
  try {
    const r = await fetch("/api/invitaciones/enviar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const j = await r.json().catch(() => ({}));
    if (j.ok) return { state: "sent", msg: `Correo enviado a ${j.to}.` };
    if (j.notConfigured) return { state: "manual", msg: j.error };
    return { state: "error", msg: j.error ?? "No se pudo enviar el correo." };
  } catch {
    return { state: "error", msg: "No se pudo enviar el correo. Revisa tu conexión." };
  }
}
