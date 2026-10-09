/**
 * Correos de la Revisión Vertical (1 a 1). Mismo diseño que las demás plantillas de mêtis.
 *  - rvInviteEmail: se manda al agendar o reagendar, con la invitación de calendario (.ics) adjunta.
 *  - rvReminderEmail: 3 días antes, 1 día antes, el mismo día y, si no se ha cerrado, diario.
 *    · Al jefe: la guía 1 a 1 de 5 pasos + el scorecard del colaborador.
 *    · Al colaborador: cómo prepararse.
 * Lógica pura (se prueba sin servidor).
 */
import type { Traffic } from "../domain/types";
import { RV_GUIDE, RV_GUIDE_NOTE, RV_PREP } from "./guide";
import type { RvStage } from "./rv";

const INK = "#171A3A", INDIGO = "#4F3FE0", SLATE = "#475569", MUTED = "#94A3B8", CANVAS = "#F6F7FC", CORAL = "#F2545B", MINT = "#12B886";
const FONT = "Poppins,'Segoe UI',Helvetica,Arial,sans-serif";
const DOT: Record<Traffic, string> = { outstanding: "#0E9F6E", satisfactory: "#12B886", minimum: "#F5A524", below: CORAL, pending: "#CBD5E1" };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const first = (name: string) => (name || "").trim().split(/\s+/)[0] || "Hola";

export interface RvKpi { name: string; scope?: string; value: string; target: string; traffic: Traffic }
export interface RvPerson { name: string; email?: string; title?: string }
export interface RvEmailBase {
  tenantName: string;
  appUrl: string;
  sessionId: string;
  whenLabel: string; // «martes 13 de octubre · 10:30»
  location?: string;
  leader: RvPerson;
  participant: RvPerson;
}

function layout(o: { base: string; eyebrow: string; title: string; intro: string; body: string; cta: { href: string; label: string }; secondary?: { href: string; label: string }; foot: string }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
  <tr><td style="padding:0 4px 18px"><a href="${o.base}"><img src="${o.base}/brand/logo-horizontal-2000.png" width="120" height="35" alt="mêtis" style="display:block;border:0;width:120px;height:35px"></a></td></tr>
  <tr><td bgcolor="#ffffff" style="border-radius:20px;border:1px solid #E8EAF4;overflow:hidden">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${INDIGO};background-image:linear-gradient(90deg,#6D5DF6,#4F3FE0,#2B1F8A)">&nbsp;</td></tr>
      <tr><td style="padding:32px 32px 30px">
        <div style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${INDIGO}">${o.eyebrow}</div>
        <div style="font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${INK};padding:6px 0 12px">${esc(o.title)}</div>
        <div style="font-family:${FONT};font-size:15px;line-height:24px;color:${SLATE};padding:0 0 18px">${o.intro}</div>
        ${o.body}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px"><tr><td bgcolor="${INDIGO}" style="border-radius:12px">
          <a href="${o.cta.href}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${esc(o.cta.label)}</a>
        </td>${o.secondary ? `<td style="padding-left:14px"><a href="${o.secondary.href}" target="_blank" style="font-family:${FONT};font-size:14px;color:${INDIGO};text-decoration:none">${esc(o.secondary.label)}</a></td>` : ""}</tr></table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED}">${o.foot}</td></tr>
</table></td></tr></table></body></html>`;
}

function whenBox(e: RvEmailBase) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CANVAS};border-radius:14px;margin:0 0 20px"><tr><td style="padding:14px 18px;font-family:${FONT}">
    <div style="font-size:12px;color:${MUTED}">Revisión Vertical · 30 min</div>
    <div style="font-size:16px;font-weight:600;color:${INK};padding-top:2px">${esc(e.whenLabel)}</div>
    <div style="font-size:13px;color:${SLATE};padding-top:2px">${esc(e.leader.name)} y ${esc(e.participant.name)}${e.location ? ` · ${esc(e.location)}` : ""}</div>
  </td></tr></table>`;
}

const sectionTitle = (t: string) => `<div style="font-family:${FONT};font-size:13px;font-weight:600;color:${INK};padding:4px 0 8px">${t}</div>`;

function guideHtml() {
  const rows = RV_GUIDE.map((g, i) => `<tr>
    <td width="34" valign="top" style="padding:8px 0"><div style="width:26px;height:26px;line-height:26px;border-radius:13px;background:#EEEBFF;color:${INDIGO};font-family:${FONT};font-size:13px;font-weight:600;text-align:center">${i + 1}</div></td>
    <td style="padding:8px 0;font-family:${FONT}">
      <div style="font-size:14px;font-weight:600;color:${INK}">${esc(g.label)} <span style="font-weight:400;color:${MUTED}">· ${g.minutes} min</span></div>
      <div style="font-size:13px;line-height:20px;color:${SLATE};padding-top:2px">${esc(g.example)}</div>
    </td></tr>`).join("");
  return `${sectionTitle("Guía para tu 1 a 1 (30 min)")}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
  <div style="font-family:${FONT};font-size:12px;line-height:18px;color:${SLATE};background:#FFF8E6;border-radius:10px;padding:10px 12px;margin-top:8px">💡 ${esc(RV_GUIDE_NOTE)}</div>`;
}

function scorecardHtml(name: string, attainment: number | null, kpis: RvKpi[]) {
  const head = `${sectionTitle(`Scorecard de ${esc(first(name))}${attainment === null ? "" : ` · <span style="color:${attainment >= 100 ? MINT : attainment < 90 ? CORAL : "#B7791F"}">${attainment}% de cumplimiento</span>`}`)}`;
  if (!kpis.length) return `${head}<div style="font-family:${FONT};font-size:13px;color:${MUTED};padding-bottom:6px">Aún no tiene scorecard este año.</div>`;
  const shown = kpis.slice(0, 8);
  const rows = shown.map((k) => `<tr>
    <td width="16" style="padding:7px 0"><div style="width:10px;height:10px;border-radius:5px;background:${DOT[k.traffic]}"></div></td>
    <td style="padding:7px 0;font-family:${FONT};font-size:13px;color:${INK}">${esc(k.name)}${k.scope ? `<span style="color:${MUTED}"> · ${esc(k.scope)}</span>` : ""}</td>
    <td align="right" style="padding:7px 0;font-family:${FONT};font-size:13px;font-weight:600;color:${INK};white-space:nowrap">${esc(k.value)}</td>
    <td align="right" style="padding:7px 0 7px 10px;font-family:${FONT};font-size:12px;color:${MUTED};white-space:nowrap">meta ${esc(k.target)}</td>
  </tr>`).join("");
  const more = kpis.length > shown.length ? `<div style="font-family:${FONT};font-size:12px;color:${MUTED};padding-top:4px">y ${kpis.length - shown.length} más en mêtis.</div>` : "";
  return `${head}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EEF0F7;margin-bottom:18px">${rows}</table>${more}`;
}

function listHtml(title: string, items: string[]) {
  return `${sectionTitle(title)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items.map((t) => `<tr>
    <td width="20" valign="top" style="padding:6px 0;font-family:${FONT};font-size:14px;color:${INDIGO}">✓</td>
    <td style="padding:6px 0;font-family:${FONT};font-size:14px;line-height:21px;color:${SLATE}">${esc(t)}</td></tr>`).join("")}</table>`;
}

function commitmentsHtml(title: string, items: { title: string; late: boolean }[]) {
  if (!items.length) return "";
  return `${sectionTitle(title)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px">${items.slice(0, 6).map((c) => `<tr>
    <td width="18" valign="top" style="padding:6px 0"><div style="width:11px;height:11px;border-radius:3px;border:2px solid ${c.late ? CORAL : "#CBD5E1"}"></div></td>
    <td style="padding:6px 0;font-family:${FONT};font-size:13px;color:${INK}">${esc(c.title)}${c.late ? ` <span style="color:${CORAL}">· vencido</span>` : ""}</td></tr>`).join("")}</table>`;
}

// ---------------------------------------------------------------- invitación ---
export function rvInviteEmail(e: RvEmailBase & { to: "leader" | "participant"; rescheduled?: boolean; googleUrl: string }) {
  const base = e.appUrl.replace(/\/$/, "");
  const link = `${base}/sesiones/${e.sessionId}`;
  const other = e.to === "leader" ? e.participant : e.leader;
  const me = e.to === "leader" ? e.leader : e.participant;
  const subject = e.rescheduled
    ? `Cambió tu Revisión Vertical con ${first(other.name)}: ${e.whenLabel}`
    : `Revisión Vertical con ${first(other.name)} · ${e.whenLabel}`;
  const intro = e.rescheduled
    ? `${esc(first(me.name))}, ${e.to === "leader" ? "moviste" : `${esc(first(e.leader.name))} movió`} la Revisión Vertical a una nueva fecha. La invitación adjunta actualiza tu calendario.`
    : e.to === "leader"
      ? `${esc(first(me.name))}, mêtis agendó tu 1 a 1 con <strong>${esc(other.name)}</strong>. La invitación viene adjunta: ábrela y acéptala para que quede en tu Outlook o Google Calendar. Si no te queda el horario, cámbialo en mêtis y le llega la actualización a los dos.`
      : `${esc(first(me.name))}, tienes tu 1 a 1 con <strong>${esc(other.name)}</strong>. La invitación viene adjunta: ábrela y acéptala para que quede en tu Outlook o Google Calendar. Te recordaremos unos días antes para que llegues preparado.`;
  const html = layout({
    base, eyebrow: `Revisión Vertical · ${esc(e.tenantName)}`, title: subject, intro,
    body: whenBox(e) + (e.to === "participant" ? listHtml("Para prepararte", RV_PREP) : ""),
    cta: { href: link, label: "Ver en mêtis" }, secondary: { href: e.googleUrl, label: "Agregar a Google Calendar" },
    foot: "La Revisión Vertical es tu conversación 1 a 1 de desarrollo con tu jefe directo, cada 6 a 8 semanas. Solo el jefe puede cambiar la fecha.",
  });
  const text = `${subject}\n\n${e.whenLabel} · 30 min · ${e.leader.name} y ${e.participant.name}${e.location ? ` · ${e.location}` : ""}\n\nVer en mêtis: ${link}\nAgregar a Google Calendar: ${e.googleUrl}`;
  return { subject, html, text };
}

// ------------------------------------------------------------- recordatorio ---
const WHEN: Record<RvStage, string> = { d3: "en 3 días", d1: "mañana", d0: "hoy", late: "" };

export function rvReminderEmail(e: RvEmailBase & {
  to: "leader" | "participant";
  stage: RvStage;
  daysLate?: number;
  /** Para el jefe: scorecard del colaborador. */
  attainment?: number | null;
  kpis?: RvKpi[];
  /** Compromisos abiertos del colaborador (de 1 a 1 anteriores o de cualquier sesión). */
  openCommitments?: { title: string; late: boolean }[];
}) {
  const base = e.appUrl.replace(/\/$/, "");
  const link = `${base}/sesiones/${e.sessionId}`;
  const leader = e.to === "leader";
  const other = leader ? e.participant : e.leader;
  const me = leader ? e.leader : e.participant;
  const late = e.stage === "late";
  const subject = late
    ? leader
      ? `Pendiente: cierra en mêtis tu 1 a 1 con ${first(other.name)}`
      : `Tu 1 a 1 con ${first(other.name)} sigue sin cerrarse`
    : `${e.stage === "d0" ? "Hoy" : e.stage === "d1" ? "Mañana" : "En 3 días"}: tu 1 a 1 con ${first(other.name)}`;

  let intro: string, body: string, cta: { href: string; label: string };
  if (late) {
    const d = e.daysLate ?? 1;
    intro = leader
      ? `${esc(first(me.name))}, la Revisión Vertical con <strong>${esc(other.name)}</strong> era hace ${d} día${d === 1 ? "" : "s"} y aún no está cerrada en mêtis. Si ya la tuvieron, captura los compromisos y ciérrala; si no, cámbiala de fecha. Te seguiremos recordando hasta que quede cerrada.`
      : `${esc(first(me.name))}, tu Revisión Vertical con <strong>${esc(other.name)}</strong> era hace ${d} día${d === 1 ? "" : "s"} y aún no está cerrada. Si no se ha hecho, pídele a ${esc(first(other.name))} una nueva fecha.`;
    body = whenBox(e) + (leader ? guideHtml() : "");
    cta = { href: link, label: leader ? "Cerrar la sesión en mêtis" : "Ver la sesión" };
  } else if (leader) {
    intro = `${esc(first(me.name))}, ${WHEN[e.stage]} tienes tu Revisión Vertical con <strong>${esc(other.name)}</strong>. ${e.stage === "d3" ? "Dale una mirada a su scorecard y a la guía para llegar preparado." : e.stage === "d1" ? "Aquí está la guía y cómo viene su scorecard." : "Abre mêtis durante la sesión y, al terminar, captura los compromisos y ciérrala."}`;
    body = whenBox(e) + scorecardHtml(other.name, e.attainment ?? null, e.kpis ?? []) + commitmentsHtml(`Compromisos abiertos de ${esc(first(other.name))}`, e.openCommitments ?? []) + guideHtml();
    cta = { href: link, label: e.stage === "d0" ? "Abrir la sesión" : "Preparar la sesión" };
  } else {
    intro = `${esc(first(me.name))}, ${WHEN[e.stage]} tienes tu Revisión Vertical con <strong>${esc(other.name)}</strong>. Es tu espacio: tú pones la agenda.`;
    body = whenBox(e) + listHtml("Para prepararte", RV_PREP) + commitmentsHtml("Tus compromisos abiertos", e.openCommitments ?? []);
    cta = { href: link, label: "Ver mi sesión" };
  }
  const html = layout({
    base, eyebrow: `Revisión Vertical · ${esc(e.tenantName)}`, title: subject, intro, body, cta,
    foot: late
      ? "Este aviso se repite cada día hábil hasta que la sesión se cierre en mêtis."
      : "Recibes este aviso 3 días antes, 1 día antes y el mismo día de tu Revisión Vertical.",
  });
  const text = [
    subject, "", `${e.whenLabel} · 30 min · ${e.leader.name} y ${e.participant.name}`,
    ...(leader ? ["", "Guía 1 a 1:", ...RV_GUIDE.map((g, i) => `${i + 1}. ${g.label} (${g.minutes} min): ${g.example}`)] : ["", "Para prepararte:", ...RV_PREP.map((p) => `- ${p}`)]),
    "", `${cta.label}: ${link}`,
  ].join("\n");
  return { subject, html, text };
}
