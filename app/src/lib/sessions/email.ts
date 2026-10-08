/**
 * Correo diario de compromisos: a cada persona con compromisos que vencen hoy o ya vencidos.
 * Mismo diseño que las demás plantillas de METIS. Lógica pura (se prueba sin servidor).
 */
const INK = "#171A3A", INDIGO = "#4F3FE0", SLATE = "#475569", MUTED = "#94A3B8", CANVAS = "#F6F7FC", CORAL = "#F2545B";
const FONT = "Poppins,'Segoe UI',Helvetica,Arial,sans-serif";

export interface DueItem { title: string; dueDate: string | null; late: boolean; support: boolean }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const shortDate = (d: string | null) => {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return `${day} ${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][m - 1]}${y ? "" : ""}`;
};

/** ¿Se manda hoy? Lunes a viernes, en la zona horaria de la empresa. */
export function isWorkday(now: Date, tz = "America/Monterrey"): boolean {
  const d = new Date(now.toLocaleString("en-US", { timeZone: tz })).getDay();
  return d >= 1 && d <= 5;
}

export function commitmentReminderEmail(input: { name: string; tenantName: string; appUrl: string; items: DueItem[] }) {
  const base = input.appUrl.replace(/\/$/, "");
  const link = `${base}/compromisos`;
  const first = (input.name || "").split(" ")[0] || "Hola";
  const late = input.items.filter((i) => i.late).length;
  const subject = late
    ? `${first}, tienes ${late} compromiso${late > 1 ? "s" : ""} vencido${late > 1 ? "s" : ""}`
    : `${first}, hoy vence${input.items.length > 1 ? "n" : ""} ${input.items.length} compromiso${input.items.length > 1 ? "s" : ""}`;

  const rows = input.items.map((i) => `<tr>
      <td width="18" valign="top" style="padding:8px 0"><div style="width:12px;height:12px;border-radius:4px;border:2px solid ${i.late ? CORAL : "#CBD5E1"}"></div></td>
      <td style="padding:8px 0;font-family:${FONT};font-size:14px;line-height:20px;color:${INK}">${i.support ? "Apoyo: " : ""}${esc(i.title)}</td>
      <td align="right" style="padding:8px 0;font-family:${FONT};font-size:12px;color:${i.late ? CORAL : MUTED};white-space:nowrap">${i.late ? `Venció ${shortDate(i.dueDate)}` : "Hoy"}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
  <tr><td style="padding:0 4px 18px"><a href="${base}"><img src="${base}/brand/logo-horizontal-2000.png" width="120" height="35" alt="mêtis" style="display:block;border:0;width:120px;height:35px"></a></td></tr>
  <tr><td bgcolor="#ffffff" style="border-radius:20px;border:1px solid #E8EAF4;overflow:hidden">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${INDIGO};background-image:linear-gradient(90deg,#6D5DF6,#4F3FE0,#2B1F8A)">&nbsp;</td></tr>
      <tr><td style="padding:32px 32px 30px">
        <div style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${INDIGO}">Compromisos · ${esc(input.tenantName)}</div>
        <div style="font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${INK};padding:6px 0 12px">${esc(subject)}</div>
        <div style="font-family:${FONT};font-size:15px;line-height:24px;color:${SLATE};padding:0 0 14px">Se revisarán en la siguiente sesión de tu equipo. Si ya lo hiciste, márcalo como cumplido; si no se va a poder, avísalo y marca «no cumplido».</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EEF0F7;margin:0 0 20px">${rows}</table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${INDIGO}" style="border-radius:12px">
          <a href="${link}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">Ver mis compromisos</a>
        </td></tr></table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED}">Recibes este aviso de lunes a viernes solo cuando tienes compromisos que vencen hoy o ya vencieron.</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${subject}\n\n${input.items.map((i) => `- ${i.support ? "Apoyo: " : ""}${i.title} (${i.late ? `venció ${shortDate(i.dueDate)}` : "hoy"})`).join("\n")}\n\nVer mis compromisos: ${link}`;
  return { subject, html, text };
}
