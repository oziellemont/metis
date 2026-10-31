/**
 * mêtis CEO · plantillas de correo (HTML compatible con Gmail, Outlook y Apple Mail).
 *
 * Dos tipos:
 *  - "Del personaje": el asunto llega como si te escribiera alguien de la empresa que diriges
 *    (remitente con su nombre, diseño sobrio de correo real). Es lo que vuelve inmersiva la experiencia.
 *  - "De mêtis CEO": bienvenida, resumen del día, racha y cierre de temporada (con la marca).
 * Todas llevan una franja discreta «Simulación · mêtis CEO» para que nadie lo confunda con un correo real.
 *
 * Sin dependencias de Next ni de "@/": se puede renderizar desde scripts (vista previa).
 */
import { avatarHex, firstName as firstOfCast, personOf } from "./cast";
import { CUMBRE } from "./companies/cumbre";
import type { CastId, CompanyPack, Entry, KpiKey, Kpis } from "./types";

export const INK = "#171A3A", INDIGO = "#4F3FE0", SLATE = "#475569", MUTED = "#94A3B8", CANVAS = "#F6F7FC", LINE = "#E8EAF4";
const AMBER = "#F5A524", CORAL = "#F2545B", WA = "#075E54";
const FONT = "Poppins,'Segoe UI',Helvetica,Arial,sans-serif";
const LOGO = "https://www.metisalign.mx/brand/logo-horizontal-2000.png";

export interface Mailable { subject: string; html: string; text: string; fromName: string; preheader: string }

export const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rich = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, `<b style="color:${INK}">$1</b>`).replace(/\n/g, "<br>");
export const plain = (t: string) => t.replace(/\*\*(.+?)\*\*/g, "$1");
const firstOf = (name: string) => (name || "").trim().split(/\s+/)[0] || "";
const base = (u: string) => u.replace(/\/$/, "");
export const senderName = (pk: CompanyPack, id: CastId) => `${personOf(pk, id).name} · ${pk.name}`;
const packIn = (i: { pack?: CompanyPack }) => i.pack ?? CUMBRE;
const KPI_ORDER: KpiKey[] = ["caja", "margen", "equipo", "clientes", "consejo"];
export const BRAND_SENDER = "mêtis CEO";

// ────────────────────────────────────────────── piezas
function avatar(pk: CompanyPack, id: CastId, size = 40) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="${size}" height="${size}" align="center" valign="middle" bgcolor="${avatarHex(pk, id)}" style="width:${size}px;height:${size}px;border-radius:${size / 2}px;font-family:${FONT};font-size:${Math.round(size * 0.36)}px;font-weight:600;color:#ffffff">${esc(personOf(pk, id).initials)}</td></tr></table>`;
}
function button(label: string, url: string, color = INDIGO) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${color}" style="border-radius:12px">
    <a href="${url}" target="_blank" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${label}</a>
  </td></tr></table>`;
}
function p(t: string, extra = "") {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:24px;color:${SLATE};${extra}">${t}</p>`;
}
function senderRow(pk: CompanyPack, id: CastId, right = "") {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="48" valign="middle">${avatar(pk, id)}</td>
    <td valign="middle" style="padding-left:10px;font-family:${FONT}"><div style="font-size:15px;font-weight:600;color:${INK}">${esc(personOf(pk, id).name)}</div><div style="font-size:12px;color:${MUTED}">${esc(personOf(pk, id).role)}</div></td>
    ${right ? `<td valign="middle" align="right" style="font-family:${FONT};font-size:12px;color:${MUTED};white-space:nowrap">${right}</td>` : ""}
  </tr></table>`;
}
function chip(label: string, bg: string, fg: string) {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${bg};color:${fg};font-family:${FONT};font-size:11px;font-weight:600">${label}</span>`;
}

interface Shell { pack: CompanyPack; preheader: string; title: string; body: string; appUrl: string; brand?: boolean; footer?: string; accent?: string }
/** Marco común. `brand`: logo de mêtis arriba (correos del producto). Sin `brand`: parece correo de la empresa. */
function shell(o: Shell) {
  const top = o.brand
    ? `<a href="${base(o.appUrl)}" target="_blank" style="text-decoration:none"><img src="${LOGO}" width="104" height="30" alt="mêtis" style="display:inline-block;border:0;width:104px;height:30px;vertical-align:middle"></a><span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:6px;background:${INK};color:#fff;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1px;vertical-align:middle">CEO</span>`
    : `<span style="font-family:${FONT};font-size:12px;font-weight:600;color:${SLATE}">${esc(o.pack.name)}</span><span style="font-family:${FONT};font-size:12px;color:${MUTED}"> · correo interno</span>`;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${CANVAS};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(o.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px">
  <tr><td style="padding:0 6px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle">${top}</td>
    <td valign="middle" align="right"><span style="display:inline-block;padding:3px 9px;border-radius:999px;border:1px solid ${LINE};background:#fff;font-family:${FONT};font-size:10px;font-weight:600;letter-spacing:.5px;color:${MUTED}">SIMULACIÓN · mêtis CEO</span></td>
  </tr></table></td></tr>
  <tr><td bgcolor="#ffffff" style="border-radius:20px;border:1px solid ${LINE};overflow:hidden">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:${o.accent ?? INDIGO}">&nbsp;</td></tr>
      <tr><td style="padding:26px 28px 28px">${o.body}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:16px 10px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED}">
    ${o.footer ? `${o.footer}<br><br>` : ""}
    <b style="color:${SLATE}">mêtis CEO</b> · Entrena como CEO dirigiendo una empresa simulada. ${esc(o.pack.name)} y sus personajes son ficticios.<br>
    <a href="${base(o.appUrl)}/ajustes" style="color:${MUTED};text-decoration:underline">Cambiar mis avisos</a> · <a href="${base(o.appUrl)}" style="color:${MUTED};text-decoration:underline">metis.ceo</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

// ────────────────────────────────────────────── 1 · Bienvenida (nombramiento)
export function welcomeEmail(i: { pack?: CompanyPack; name: string; appUrl: string; windowStart: number; windowEnd: number; continuous?: boolean }): Mailable {
  const pk = packIn(i);
  const first = firstOf(i.name) || "Director";
  const subject = `${first}, tu nombramiento como Director General de ${pk.name}`;
  const preheader = "A partir de mañana la silla es tuya. Esto es lo que sigue.";
  const steps = [
    ["1", "Tu equipo te escribe", `Entre las ${i.windowStart}:00 y las ${i.windowEnd}:00 te llegan de 2 a 4 asuntos al día: correos, WhatsApps, reportes y juntas.`],
    ["2", "Todo tiene plazo", "Si no respondes a tiempo, alguien decide por ti. Y lo que decides regresa días después."],
    i.continuous
      ? ["3", "El consejo te evalúa cada periodo", `Al cierre de cada periodo revisa todos tus rubros. Sigues al frente de ${esc(pk.name)}: lo que construyes se queda.`]
      : ["3", "Aprueba todos los rubros", "Si al cierre todos tus indicadores pasan la línea, asciendes a otra empresa de otro giro (y más exigente)."],
    ["4", "Aprende en el camino", "Cada asunto se conecta con una lección corta de mêtis Academy."],
  ].map(([ic, t, d]) => `<tr><td width="34" valign="top" style="padding:8px 0"><div style="width:22px;height:22px;border-radius:11px;background:#EEEBFD;color:${INDIGO};font-family:${FONT};font-size:12px;font-weight:700;line-height:22px;text-align:center">${ic}</div></td><td style="padding:8px 0;font-family:${FONT}"><div style="font-size:14px;font-weight:600;color:${INK}">${t}</div><div style="font-size:13px;line-height:20px;color:${SLATE}">${d}</div></td></tr>`).join("");
  const chair = pk.roles.chair;
  const letter = pk.welcome.split(/\n+/).filter(Boolean);
  const body = `
    ${senderRow(pk, chair)}
    <div style="height:18px"></div>
    <div style="font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${INK};margin:0 0 14px">Querido ${esc(first)}:</div>
    ${letter.map((t) => p(rich(t))).join("")}
    ${p(esc(pk.pitch), `font-size:13px;line-height:21px;color:${MUTED}`)}
    ${p(`— ${esc(firstOfCast(pk, chair))}`, `font-style:italic`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 22px;background:${CANVAS};border-radius:14px"><tr><td style="padding:14px 18px">
      <div style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1px;color:${INDIGO};margin:0 0 4px">CÓMO FUNCIONA</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}</table>
    </td></tr></table>
    ${button("Entrar a mi oficina", base(i.appUrl))}`;
  const html = shell({ pack: pk, preheader, title: subject, body, appUrl: i.appUrl, brand: true });
  const text = `Querido ${first}:\n\n${letter.map(plain).join("\n\n")}\n— ${firstOfCast(pk, chair)}\n\nCómo funciona: tu equipo te escribe entre las ${i.windowStart}:00 y las ${i.windowEnd}:00; todo tiene plazo; ${i.continuous ? "el consejo te evalúa cada periodo" : "aprueba todos los rubros para ascender a otra empresa"}; aprende en mêtis Academy.\n\nEntrar: ${base(i.appUrl)}`;
  return { subject, html, text, fromName: senderName(pk, chair), preheader };
}

// ────────────────────────────────────────────── 2 · Asunto nuevo (del personaje)
const CH_LABEL = { email: "Correo", whatsapp: "WhatsApp", reporte: "Reporte", junta: "Junta", llamada: "Llamada perdida" } as const;

export function caseEmail(i: { pack?: CompanyPack; name: string; appUrl: string; entry: Entry; streak: number; tz?: string }): Mailable {
  const pk = packIn(i);
  const { item } = i.entry;
  const who = firstOfCast(pk, item.from);
  const link = `${base(i.appUrl)}/caso/${item.id}`;
  const hrs = item.deadlineH ?? 24;
  const subject =
    item.channel === "email" ? item.subject
    : item.channel === "whatsapp" ? `WhatsApp · ${who}: ${plain(item.preview).slice(0, 70)}${item.preview.length > 70 ? "…" : ""}`
    : item.channel === "llamada" ? `Llamada perdida de ${who} · te dejó un mensaje de voz`
    : item.channel === "junta" ? `Junta:  ${item.subject}`
    : `Reporte: ${item.subject}`;
  const preheader = plain(item.preview);
  const deadline = `<div style="margin:18px 0 0">${chip(`Responde en las próximas ${hrs} h`, "#FEF3DF", "#9A6408")}</div>`;
  let content = "";
  if (item.channel === "email") {
    content = `
      <div style="font-family:${FONT};font-size:20px;line-height:28px;font-weight:600;color:${INK};margin:18px 0 6px">${esc(item.subject)}</div>
      <div style="font-family:${FONT};font-size:12px;color:${MUTED};margin:0 0 16px">Para: ${esc(i.name || "Dirección General")} &lt;direccion@${pk.domain}&gt;</div>
      ${item.body.map((t) => p(rich(t))).join("")}`;
  } else if (item.channel === "whatsapp") {
    const bubbles = item.body.slice(0, 6).map((t) => `<tr><td style="padding:3px 0"><span style="display:inline-block;max-width:88%;padding:9px 13px;border-radius:4px 14px 14px 14px;background:#ffffff;font-family:${FONT};font-size:15px;line-height:22px;color:${INK};box-shadow:0 1px 1px rgba(0,0,0,.08)">${rich(t)}</span></td></tr>`).join("");
    content = `
      <div style="height:16px"></div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:16px;overflow:hidden">
        <tr><td bgcolor="${WA}" style="padding:10px 14px;font-family:${FONT};font-size:13px;font-weight:600;color:#fff">WhatsApp · ${esc(personOf(pk, item.from).name)}</td></tr>
        <tr><td bgcolor="#ECE5DD" style="padding:14px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${bubbles}</table></td></tr>
      </table>`;
  } else if (item.channel === "llamada") {
    content = `
      <div style="height:16px"></div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDE7E8;border-radius:14px"><tr><td style="padding:14px 16px;font-family:${FONT}">
        <div style="font-size:13px;font-weight:600;color:${CORAL}">Llamada perdida · mensaje de voz</div>
        <div style="font-size:15px;line-height:23px;color:${INK};margin-top:8px;font-style:italic">«${rich(item.body.slice(0, 2).join(" "))}${item.body.length > 2 ? " …" : ""}»</div>
      </td></tr></table>`;
  } else if (item.channel === "junta") {
    const lines = (item.lines ?? []).slice(0, 4).map((l) => `<tr><td style="padding:6px 0;font-family:${FONT};font-size:14px;line-height:21px;color:${SLATE}"><b style="color:${INK}">${esc(firstOfCast(pk, l.who))}:</b> ${rich(l.text)}</td></tr>`).join("");
    content = `
      <div style="font-family:${FONT};font-size:20px;line-height:28px;font-weight:600;color:${INK};margin:18px 0 10px">${esc(item.subject)}</div>
      ${item.body.slice(0, 1).map((t) => p(rich(t))).join("")}
      ${lines ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid ${AMBER};padding-left:12px;margin:0 0 4px">${lines}</table>` : ""}
      ${p(`<span style="color:${MUTED}">La junta sigue en la app…</span>`, "font-size:13px")}`;
  } else {
    content = `
      <div style="font-family:${FONT};font-size:20px;line-height:28px;font-weight:600;color:${INK};margin:18px 0 10px">${esc(item.subject)}</div>
      ${item.body.slice(0, 3).map((t) => p(rich(t))).join("")}
      ${item.data ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${LINE};border-radius:12px;margin:4px 0 6px">
        <tr><td colspan="2" style="padding:10px 14px 4px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1px;color:${MUTED}">${esc(item.data.title.toUpperCase())}</td></tr>
        ${item.data.rows.slice(0, 5).map(([k, v]) => `<tr><td style="padding:6px 14px;font-family:${FONT};font-size:13px;color:${SLATE};border-top:1px solid ${LINE}">${esc(k)}</td><td align="right" style="padding:6px 14px;font-family:${FONT};font-size:13px;font-weight:600;color:${INK};border-top:1px solid ${LINE}">${esc(v)}</td></tr>`).join("")}
      </table>` : ""}`;
  }
  const body = `
    ${senderRow(pk, item.from, CH_LABEL[item.channel])}
    ${content}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;background:${CANVAS};border-radius:14px"><tr><td style="padding:14px 16px;font-family:${FONT}">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:${INDIGO}">TU DECISIÓN</div>
      <div style="font-size:15px;line-height:22px;font-weight:600;color:${INK};margin:4px 0 12px">${rich(item.ask)}</div>
      ${button(item.channel === "email" ? "Responder" : "Abrir y decidir", link)}
    </td></tr></table>
    ${deadline}`;
  const footer = i.streak > 0 ? `Llevas ${i.streak} ${i.streak === 1 ? "día" : "días"} de racha.` : "";
  const html = shell({ pack: pk, preheader, title: subject, body, appUrl: i.appUrl, footer });
  const text = `${personOf(pk, item.from).name} (${personOf(pk, item.from).role}) · ${CH_LABEL[item.channel]}\n\n${item.body.map(plain).join("\n\n")}\n\n${plain(item.ask)}\nResponder: ${link}\n\nTienes ${hrs} h para responder.`;
  return { subject, html, text, fromName: senderName(pk, item.from), preheader };
}

// ────────────────────────────────────────────── 3 · Recordatorio: el asunto está por vencer (de tu asistente)
export function reminderEmail(i: { pack?: CompanyPack; name: string; appUrl: string; entry: Entry; hoursLeft: number }): Mailable {
  const pk = packIn(i);
  const { item } = i.entry;
  const who = personOf(pk, item.from).name;
  const first = firstOf(i.name);
  const left = i.hoursLeft <= 1 ? "menos de una hora" : `${Math.round(i.hoursLeft)} horas`;
  const subject = `${firstOfCast(pk, item.from)} sigue esperando tu respuesta`;
  const preheader = `Te quedan ${left}. Si no respondes, se decide sin ti.`;
  const body = `
    ${senderRow(pk, pk.roles.assistant)}
    <div style="height:18px"></div>
    ${p(`${first ? esc(first) + ", " : ""}perdón que insista. <b style="color:${INK}">${esc(who)}</b> sigue esperando tu respuesta sobre:`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid ${LINE};border-radius:14px"><tr><td style="padding:14px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="46" valign="top">${avatar(pk, item.from, 36)}</td><td style="font-family:${FONT}">
        <div style="font-size:14px;font-weight:600;color:${INK}">${esc(item.subject)}</div>
        <div style="font-size:13px;line-height:20px;color:${SLATE};margin-top:2px">${rich(item.preview)}</div>
      </td></tr></table>
    </td></tr></table>
    ${p(`Te quedan <b style="color:${CORAL}">${left}</b>. Si no contestas, alguien va a decidir por ti… y ya sabes cómo se pone esto cuando eso pasa.`)}
    ${button("Atenderlo ahora", `${base(i.appUrl)}/caso/${item.id}`, CORAL)}
    <div style="height:10px"></div>
    ${p(`— ${esc(firstOfCast(pk, pk.roles.assistant))}`, "font-style:italic;margin:10px 0 0")}`;
  const html = shell({ pack: pk, preheader, title: subject, body, appUrl: i.appUrl, accent: CORAL });
  const text = `${who} sigue esperando tu respuesta sobre: ${item.subject}.\nTe quedan ${left}.\n\nAtender: ${base(i.appUrl)}/caso/${item.id}\n— ${firstOfCast(pk, pk.roles.assistant)}`;
  return { subject, html, text, fromName: senderName(pk, pk.roles.assistant), preheader };
}

// ────────────────────────────────────────────── 4 · Resumen de la mañana (tu día en la empresa)
export interface DigestInput {
  pack?: CompanyPack; name: string; appUrl: string; day: number; seasonDays: number;
  kpis: Kpis; kpiDelta: Kpis; health: number; streak: number; xp: number; level: string;
  pending: Entry[]; expiredYesterday: Entry[]; decidedYesterday: number; todayCount: number; firstAt?: string; passLine?: number;
}

export function digestEmail(i: DigestInput): Mailable {
  const pk = packIn(i);
  const first = firstOf(i.name) || "Director";
  const subject = i.pending.length
    ? `Día ${i.day}: tienes ${i.pending.length} ${i.pending.length === 1 ? "asunto pendiente" : "asuntos pendientes"} en ${pk.short}`
    : `Día ${i.day} en ${pk.short}: hoy te esperan ${i.todayCount} ${i.todayCount === 1 ? "asunto" : "asuntos"}`;
  const preheader = `Salud de tu empresa: ${i.health}/100 · ${i.streak > 0 ? `${i.streak} días de racha` : "Enciende tu racha hoy"}`;
  const line = i.passLine ?? 60;
  const kpiRows = KPI_ORDER.map((k) => {
    const label = esc(pk.kpiLabel[k]);
    const v = i.kpis[k], d = i.kpiDelta[k];
    const col = v >= line ? INDIGO : "#A9A3F7";
    return `<tr>
      <td width="96" style="padding:5px 0;font-family:${FONT};font-size:13px;color:${SLATE}">${label}</td>
      <td style="padding:5px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF0F7;border-radius:6px"><tr><td width="${v}%" height="8" bgcolor="${col}" style="height:8px;border-radius:6px;font-size:0;line-height:0">&nbsp;</td><td style="font-size:0;line-height:0">&nbsp;</td></tr></table></td>
      <td width="34" align="right" style="padding:5px 0;font-family:${FONT};font-size:13px;font-weight:600;color:${INK}">${v}</td>
      <td width="38" align="right" style="padding:5px 0;font-family:${FONT};font-size:12px;font-weight:600;color:${d > 0 ? INDIGO : d < 0 ? INK : MUTED}">${d > 0 ? `+${d}` : d < 0 ? d : "·"}</td>
    </tr>`;
  }).join("");
  const pend = i.pending.slice(0, 4).map((e) => `<tr><td style="padding:8px 0;border-top:1px solid ${LINE}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="42" valign="top">${avatar(pk, e.item.from, 32)}</td>
      <td style="font-family:${FONT}"><a href="${base(i.appUrl)}/caso/${e.item.id}" style="font-size:14px;font-weight:600;color:${INK};text-decoration:none">${esc(e.item.subject)}</a><div style="font-size:12px;color:${MUTED}">${esc(personOf(pk, e.item.from).name)}</div></td>
    </tr></table></td></tr>`).join("");
  const expired = i.expiredYesterday.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;background:#FDE7E8;border-radius:12px"><tr><td style="padding:12px 14px;font-family:${FONT};font-size:13px;line-height:20px;color:${INK}">Ayer se ${i.expiredYesterday.length === 1 ? "venció un asunto" : `vencieron ${i.expiredYesterday.length} asuntos`} sin tu respuesta: <b>${i.expiredYesterday.map((e) => esc(e.item.subject)).join("</b>, <b>")}</b>. Alguien decidió por ti.</td></tr></table>`
    : "";
  const body = `
    <div style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1px;color:${INDIGO}">${esc(pk.name.toUpperCase())} · DÍA ${i.day} DE ${i.seasonDays}</div>
    <div style="font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${INK};margin:6px 0 16px">Buenos días, ${esc(first)}.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px"><tr>
      <td width="33%" align="center" style="padding:12px 4px;background:${CANVAS};border-radius:12px;font-family:${FONT}"><div style="font-size:22px;font-weight:700;color:${INK}">${i.health}</div><div style="font-size:11px;color:${MUTED}">Salud /100</div></td>
      <td width="8"></td>
      <td width="33%" align="center" style="padding:12px 4px;background:${i.streak > 0 ? "#FEF3DF" : CANVAS};border-radius:12px;font-family:${FONT}"><div style="font-size:22px;font-weight:700;color:${INK}">${i.streak}</div><div style="font-size:11px;color:${MUTED}">días de racha</div></td>
      <td width="8"></td>
      <td width="33%" align="center" style="padding:12px 4px;background:${CANVAS};border-radius:12px;font-family:${FONT}"><div style="font-size:22px;font-weight:700;color:${INK}">${i.xp}</div><div style="font-size:11px;color:${MUTED}">XP · ${esc(i.level)}</div></td>
    </tr></table>
    ${expired}
    <div style="font-family:${FONT};font-size:14px;font-weight:600;color:${INK};margin:0 0 6px">Tu empresa hoy</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px">${kpiRows}</table>
    <div style="font-family:${FONT};font-size:11px;color:${MUTED};margin:0 0 18px">Cambio desde que llegaste. Para ascender, cada rubro debe cerrar en ${line} o más.</div>
    ${pend ? `<div style="font-family:${FONT};font-size:14px;font-weight:600;color:${INK};margin:0 0 4px">Esperando tu decisión</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px">${pend}</table>` : ""}
    ${p(i.todayCount ? `Hoy te van a escribir <b style="color:${INK}">${i.todayCount} ${i.todayCount === 1 ? "persona" : "personas"}</b>${i.firstAt ? `; el primer asunto llega cerca de las <b style="color:${INK}">${esc(i.firstAt)}</b>` : ""}. Te aviso por aquí en cuanto lleguen.` : "Hoy no hay asuntos nuevos en tu agenda. Buen día para ponerte al corriente o tomar una lección.")}
    ${button(i.pending.length ? "Atender pendientes" : "Ir a mi oficina", base(i.appUrl))}`;
  const html = shell({ pack: pk, preheader, title: subject, body, appUrl: i.appUrl, brand: true });
  const text = `Buenos días, ${first}. Día ${i.day} de ${i.seasonDays} en ${pk.name}.\nSalud: ${i.health}/100 · Racha: ${i.streak} · XP: ${i.xp}\nPendientes: ${i.pending.length}. Hoy llegan ${i.todayCount} asuntos.\n\n${base(i.appUrl)}`;
  return { subject, html, text, fromName: BRAND_SENDER, preheader };
}

// ────────────────────────────────────────────── 5 · Racha en riesgo (tarde)
export function streakEmail(i: { pack?: CompanyPack; name: string; appUrl: string; streak: number; pending: number; lessonTitle?: string; lessonId?: string }): Mailable {
  const pk = packIn(i);
  const first = firstOf(i.name) || "Director";
  const subject = `${first}, tu racha de ${i.streak} ${i.streak === 1 ? "día" : "días"} se apaga hoy`;
  const preheader = "Con una sola decisión o una lección de 4 minutos la mantienes viva.";
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:6px 0 14px">
      <div style="font-family:${FONT};font-size:40px;line-height:44px;font-weight:700;color:${INK}">${i.streak}</div>
      <div style="font-family:${FONT};font-size:13px;color:${MUTED}">${i.streak === 1 ? "día de racha" : "días de racha"}</div>
    </td></tr></table>
    <div style="font-family:${FONT};font-size:20px;line-height:28px;font-weight:600;color:${INK};text-align:center;margin:0 0 10px">No la dejes caer, ${esc(first)}.</div>
    ${p(`Hoy todavía no tomas ninguna decisión. ${i.pending ? `Tienes <b style="color:${INK}">${i.pending} ${i.pending === 1 ? "asunto esperando" : "asuntos esperando"}</b> en tu bandeja.` : "Tu bandeja está al día, pero una lección corta también cuenta."}`, "text-align:center")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:6px 0 4px">
      ${button(i.pending ? "Tomar una decisión" : "Tomar una lección de 4 min", i.pending ? base(i.appUrl) : `${base(i.appUrl)}/academy${i.lessonId ? `/${i.lessonId}` : ""}`, AMBER)}
    </td></tr></table>
    ${i.pending && i.lessonTitle ? p(`O toma la lección <a href="${base(i.appUrl)}/academy/${i.lessonId}" style="color:${INDIGO}">«${esc(i.lessonTitle)}»</a> (4 min).`, "text-align:center;font-size:13px;margin:14px 0 0") : ""}`;
  const html = shell({ pack: pk, preheader, title: subject, body, appUrl: i.appUrl, brand: true, accent: AMBER });
  const text = `Tu racha de ${i.streak} días se apaga hoy. Una decisión o una lección la mantienen viva.\n${base(i.appUrl)}`;
  return { subject, html, text, fromName: BRAND_SENDER, preheader };
}

// ────────────────────────────────────────────── 6 · Te extrañamos (inactividad, de Paty)
export function nudgeEmail(i: { pack?: CompanyPack; name: string; appUrl: string; days: number; pending: Entry[] }): Mailable {
  const pk = packIn(i);
  const first = firstOf(i.name);
  const names = [...new Set(i.pending.map((e) => firstOfCast(pk, e.item.from)))].slice(0, 3);
  const subject = `${first ? first + ", " : ""}en la oficina preguntan por ti`;
  const preheader = `${names.join(", ")} ${names.length === 1 ? "te está" : "te están"} esperando.`;
  const body = `
    ${senderRow(pk, pk.roles.assistant)}
    <div style="height:18px"></div>
    ${p(`${first ? esc(first) + ", " : ""}llevas ${i.days} días sin pasar por la oficina y ya empiezan los rumores.`)}
    ${i.pending.length ? p(`Tienes <b style="color:${INK}">${i.pending.length} ${i.pending.length === 1 ? "asunto" : "asuntos"}</b> en tu escritorio${names.length ? `: ${names.map((n) => `<b style="color:${INK}">${esc(n)}</b>`).join(", ")} ${names.length === 1 ? "espera" : "esperan"} tu respuesta` : ""}.`) : ""}
    ${p(`${esc(personOf(pk, pk.roles.chair).name)} me preguntó ayer si todo estaba bien. Le dije que sí. No me hagas quedar mal.`)}
    ${button("Volver a la oficina", base(i.appUrl))}
    ${p(`— ${esc(firstOfCast(pk, pk.roles.assistant))}`, "font-style:italic;margin:16px 0 0")}`;
  const html = shell({ pack: pk, preheader, title: subject, body, appUrl: i.appUrl });
  const text = `Llevas ${i.days} días sin pasar por la oficina. Tienes ${i.pending.length} asuntos esperando.\n${base(i.appUrl)}\n— ${firstOfCast(pk, pk.roles.assistant)}`;
  return { subject, html, text, fromName: senderName(pk, pk.roles.assistant), preheader };
}

// ────────────────────────────────────────────── 7 · Cierre de temporada
export function seasonEmail(i: { pack?: CompanyPack; name: string; appUrl: string; health: number; xp: number; level: string; archetype: string; archetypeText: string; decisions: number; bestStreak: number; passed?: boolean; passLine?: number; kpis?: Kpis; continuous?: boolean }): Mailable {
  const pk = packIn(i);
  const first = firstOf(i.name) || "Director";
  const subject = i.continuous ? `${first}, el consejo de ${pk.short} revisó tu periodo` : i.passed === undefined ? `${first}, cerraste tu temporada en ${pk.short}` : i.passed ? `${first}, aprobaste ${pk.short}: te espera otra empresa` : `${first}, el consejo de ${pk.short} pide otra vuelta`;
  const preheader = `Tu estilo de dirección: ${i.archetype}. Mira cómo quedó tu empresa.`;
  const stat = (v: string, l: string) => `<td width="25%" align="center" style="padding:12px 4px;background:${CANVAS};border-radius:12px;font-family:${FONT}"><div style="font-size:20px;font-weight:700;color:${INK}">${v}</div><div style="font-size:11px;color:${MUTED}">${l}</div></td>`;
  const body = `
    ${senderRow(pk, pk.roles.board)}
    <div style="height:18px"></div>
    <div style="font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${INK};margin:0 0 12px">${esc(first)}, el consejo revisó tu gestión.</div>
    ${p(i.continuous ? (i.passed ? `Todos los rubros cerraron en la línea o arriba. Sigues al frente de ${esc(pk.name)} y el siguiente periodo arranca con lo que construiste.` : `Algunos rubros quedaron por debajo de ${i.passLine ?? 60}. Sigues al frente de ${esc(pk.name)}: el siguiente periodo es para corregirlos.`) : i.passed ? `Aprobaste todos los rubros. Hay otra empresa, de otro giro, que necesita a alguien como tú. Va a ser más exigente.` : i.passed === false ? `Algunos rubros quedaron por debajo de ${i.passLine ?? 60}. Puedes volver a dirigir ${esc(pk.name)} y probar otros caminos.` : "No todo salió como querías. Así es esto. Lo importante es que ahora sabes cómo decides cuando la presión es real.")}
    ${i.kpis ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">${KPI_ORDER.map((k) => { const v = i.kpis![k]; const ok = v >= (i.passLine ?? 60); return `<tr><td style="padding:4px 0;font-family:${FONT};font-size:13px;color:${SLATE}">${esc(pk.kpiLabel[k])}</td><td align="right" style="padding:4px 0;font-family:${FONT};font-size:13px;font-weight:600;color:${ok ? INDIGO : CORAL}">${v} · ${ok ? "en línea" : "bajo línea"}</td></tr>`; }).join("")}</table>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;background:${INK};border-radius:16px"><tr><td style="padding:18px 20px;font-family:${FONT}">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#A9A3F7">TU ESTILO DE DIRECCIÓN</div>
      <div style="font-size:24px;font-weight:700;color:#fff;margin:4px 0 6px">${esc(i.archetype)}</div>
      <div style="font-size:14px;line-height:21px;color:#D6D8EC">${esc(i.archetypeText)}</div>
    </td></tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr>
      ${stat(`${i.health}`, "Salud /100")}<td width="6"></td>${stat(`${i.decisions}`, "decisiones")}<td width="6"></td>${stat(`${i.bestStreak}`, "mejor racha")}<td width="6"></td>${stat(`${i.xp}`, esc(i.level))}
    </tr></table>
    ${button(i.passed === undefined ? "Ver mi perfil completo" : "Ver mi carrera", `${base(i.appUrl)}/${i.passed === undefined ? "perfil" : "carrera"}`)}
    ${p(`— ${esc(personOf(pk, pk.roles.board).name)}, ${esc(personOf(pk, pk.roles.board).role.toLowerCase())}`, "font-style:italic;margin:16px 0 0")}`;
  const html = shell({ pack: pk, preheader, title: subject, body, appUrl: i.appUrl, brand: true, accent: INDIGO });
  const text = `${i.passed ? "Aprobaste " + pk.name + ". " : ""}Cerraste tu temporada. Estilo: ${i.archetype}. Salud ${i.health}/100, ${i.decisions} decisiones, ${i.xp} XP.\n${base(i.appUrl)}/perfil`;
  return { subject, html, text, fromName: senderName(pk, pk.roles.board), preheader };
}
