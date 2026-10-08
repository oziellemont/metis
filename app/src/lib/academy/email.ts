/**
 * Metis Academy · correo de recordatorio (mismo diseño que las plantillas de Supabase Auth).
 */
import { MODULES, TOTAL_MINUTES } from "./content";
import type { ProgressMap } from "./progress";

const INK = "#171A3A", INDIGO = "#4F3FE0", SLATE = "#475569", MUTED = "#94A3B8", CANVAS = "#F6F7FC", MINT = "#14C98E";
const FONT = "Poppins,'Segoe UI',Helvetica,Arial,sans-serif";

export function academyReminderEmail(input: { name: string; tenantName: string; appUrl: string; progress: ProgressMap }) {
  const base = input.appUrl.replace(/\/$/, "");
  const link = `${base}/academy`;
  const first = (input.name || "").split(" ")[0] || "Hola";
  const done = MODULES.filter((m) => input.progress[m.id]?.passedAt).length;
  const left = MODULES.filter((m) => !input.progress[m.id]?.passedAt);
  const minutesLeft = left.reduce((a, m) => a + m.minutes, 0);
  const pct = Math.round((done / MODULES.length) * 100);

  const subject = done === 0
    ? `${first}, tu acceso a METIS empieza en Metis Academy (${TOTAL_MINUTES} min)`
    : `Te faltan ${left.length} módulo${left.length > 1 ? "s" : ""} de Metis Academy para desbloquear METIS`;

  const rows = MODULES.map((m) => {
    const ok = Boolean(input.progress[m.id]?.passedAt);
    return `<tr>
      <td width="28" valign="top" style="padding:7px 0"><div style="width:20px;height:20px;line-height:20px;border-radius:10px;text-align:center;font-family:${FONT};font-size:11px;font-weight:600;${ok ? `background:${MINT};color:#fff` : `background:#EEEBFD;color:${INDIGO}`}">${ok ? "&#10003;" : m.n}</div></td>
      <td style="padding:7px 0;font-family:${FONT};font-size:14px;line-height:20px;color:${ok ? MUTED : INK};${ok ? "text-decoration:line-through" : ""}">${m.title}</td>
      <td align="right" style="padding:7px 0;font-family:${FONT};font-size:12px;color:${MUTED};white-space:nowrap">${ok ? "Listo" : `${m.minutes} min`}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${CANVAS}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Te faltan unos ${minutesLeft} minutos para desbloquear tu acceso.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
  <tr><td style="padding:0 4px 18px"><a href="${base}"><img src="${base}/brand/logo-horizontal-2000.png" width="120" height="35" alt="mêtis" style="display:block;border:0;width:120px;height:35px"></a></td></tr>
  <tr><td bgcolor="#ffffff" style="border-radius:20px;border:1px solid #E8EAF4;overflow:hidden">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${INDIGO};background-image:linear-gradient(90deg,#6D5DF6,#4F3FE0,#2B1F8A)">&nbsp;</td></tr>
      <tr><td style="padding:32px 32px 30px">
        <div style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${INDIGO}">Metis Academy</div>
        <div style="font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${INK};padding:6px 0 12px">Hola ${first}, te faltan unos ${minutesLeft} minutos</div>
        <div style="font-family:${FONT};font-size:15px;line-height:24px;color:${SLATE};padding:0 0 18px">Antes de usar METIS en <strong>${input.tenantName}</strong>, todos pasamos por Metis Academy: lecturas cortas sobre alineación estratégica, equipos y liderazgo, más un tour por la plataforma. Al terminar se desbloquea tu acceso completo.</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-family:${FONT};font-size:12px;color:${MUTED};padding:0 0 6px">Tu avance</td>
          <td align="right" style="font-family:${FONT};font-size:12px;font-weight:600;color:${INK};padding:0 0 6px">${done} de ${MODULES.length}</td>
        </tr><tr><td colspan="2" style="padding:0 0 14px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF0F7;border-radius:6px"><tr>
            ${pct > 0 ? `<td width="${pct}%" height="8" style="height:8px;font-size:0;line-height:8px;background:${INDIGO};border-radius:6px">&nbsp;</td>` : ""}<td height="8" style="height:8px;font-size:0;line-height:8px">&nbsp;</td>
          </tr></table>
        </td></tr></table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EEF0F7;margin:0 0 20px">${rows}</table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${INDIGO}" style="border-radius:12px">
          <a href="${link}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${done === 0 ? "Empezar Metis Academy" : "Continuar donde me quedé"}</a>
        </td></tr></table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED}">Te enviaremos este recordatorio cada 2 días hasta que completes los módulos. Tu avance se guarda: puedes retomarlo en cualquier momento.</td></tr>
  <tr><td style="padding:14px 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED}"><strong style="color:${SLATE}">mêtis</strong> · ${input.tenantName} · <a href="${base}" style="color:${MUTED}">metisalign.mx</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = `Hola ${first},\n\nPara usar METIS en ${input.tenantName} primero completa Metis Academy (te faltan unos ${minutesLeft} min).\n\n${MODULES.map((m) => `${input.progress[m.id]?.passedAt ? "[x]" : "[ ]"} ${m.n}. ${m.title}`).join("\n")}\n\nContinúa aquí: ${link}\n\nmêtis`;
  return { subject, html, text };
}
