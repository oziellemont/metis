/**
 * Correo de invitación a un portal de METIS. Mismo diseño que las demás plantillas.
 * Lógica pura (se prueba sin servidor).
 */
const INK = "#171A3A", INDIGO = "#4F3FE0", SLATE = "#475569", MUTED = "#94A3B8", CANVAS = "#F6F7FC";
const FONT = "Poppins,'Segoe UI',Helvetica,Arial,sans-serif";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export function invitationEmail(input: { tenantName: string; inviterName?: string | null; role?: string | null; appUrl: string; token: string; email: string; alreadyMember?: boolean }) {
  const base = input.appUrl.replace(/\/$/, "");
  const link = input.alreadyMember ? `${base}/login?next=%2Finicio` : `${base}/login?inv=${encodeURIComponent(input.token)}`;
  const who = (input.inviterName || "").trim();
  const subject = who ? `${who} te invitó a ${input.tenantName} en METIS` : `Te invitaron a ${input.tenantName} en METIS`;
  const roleLine = input.role ? ` como <strong style="color:${INK}">${esc(input.role)}</strong>` : "";

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
  <tr><td style="padding:0 4px 18px"><a href="${base}"><img src="${base}/brand/logo-horizontal-2000.png" width="120" height="35" alt="mêtis" style="display:block;border:0;width:120px;height:35px"></a></td></tr>
  <tr><td bgcolor="#ffffff" style="border-radius:20px;border:1px solid #E8EAF4;overflow:hidden">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${INDIGO};background-image:linear-gradient(90deg,#6D5DF6,#4F3FE0,#2B1F8A)">&nbsp;</td></tr>
      <tr><td style="padding:32px 32px 30px">
        <div style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${INDIGO}">Invitación · ${esc(input.tenantName)}</div>
        <div style="font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${INK};padding:6px 0 12px">${esc(subject)}</div>
        <div style="font-family:${FONT};font-size:15px;line-height:24px;color:${SLATE};padding:0 0 22px">Vas a entrar al espacio de <strong style="color:${INK}">${esc(input.tenantName)}</strong>${roleLine}. Ahí verás tus objetivos, tu scorecard y los compromisos de tu equipo. ${input.alreadyMember ? `Tu acceso ya está activo: inicia sesión con <strong style="color:${INK}">${esc(input.email)}</strong> y elige ${esc(input.tenantName)} en el selector de empresa.` : `Inicia sesión con este mismo correo (<strong style="color:${INK}">${esc(input.email)}</strong>) y la invitación se aplica sola.`}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${INDIGO}" style="border-radius:12px">
          <a href="${link}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${input.alreadyMember ? "Entrar a METIS" : "Aceptar invitación"}</a>
        </td></tr></table>
        <div style="font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};padding:22px 0 0">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="${link}" style="color:${INDIGO};word-break:break-all">${link}</a></div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED}">La invitación vence en 14 días. Si no esperabas este correo, puedes ignorarlo.</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${subject}\n\nVas a entrar al espacio de ${input.tenantName}. Inicia sesión con ${input.email}${input.alreadyMember ? "" : " y la invitación se aplica sola"}.\n\n${input.alreadyMember ? "Entrar" : "Aceptar invitación"}: ${link}\n\nLa invitación vence en 14 días.`;
  return { subject, html, text, link };
}
