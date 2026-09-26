/**
 * Recordatorios de cierre de mes.
 * Lógica pura (sin red, sin BD) para decidir a quién avisar y con qué texto.
 * La usa el cron de Vercel (/api/cron/recordatorios) y la pantalla de Notificaciones (vista previa).
 */
import type { Element, ElementScope, ReminderSettings, Result, User } from "./types";

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: true,
  days: [25, 1, 3],
  hour: 9,
  timezone: "America/Monterrey",
  escalateToManager: true,
  channels: { email: true, whatsapp: false },
};

export interface PendingLoad {
  elementScopeId: string;
  elementName: string;
  scopeName: string;
  unit: string;
}

export interface ReminderMessage {
  to: { userId: string; email: string; name: string };
  kind: "owner" | "manager";
  /** Mes al que se refiere el cierre (1..12) y su año */
  period: { year: number; month: number };
  pending: PendingLoad[];
  /** Sólo para kind = manager: pendientes agrupados por colaborador */
  team?: { userId: string; name: string; pending: PendingLoad[] }[];
  subject: string;
  html: string;
  text: string;
}

export const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/**
 * Periodo a cerrar según el día del mes en que corre el recordatorio:
 * - del 1 al 15 se recuerda el mes ANTERIOR (cierre de mes en curso)
 * - del 16 en adelante se recuerda el mes ACTUAL (preaviso: "prepara tu cierre")
 */
export function periodFor(now: Date): { year: number; month: number; phase: "preaviso" | "cierre" } {
  const d = now.getDate();
  if (d <= 15) {
    const m = now.getMonth(); // 0..11 → mes anterior en 1..12
    return m === 0 ? { year: now.getFullYear() - 1, month: 12, phase: "cierre" } : { year: now.getFullYear(), month: m, phase: "cierre" };
  }
  return { year: now.getFullYear(), month: now.getMonth() + 1, phase: "preaviso" };
}

/** ¿Toca enviar hoy? Compara el día local del tenant con la configuración. */
export function shouldSendToday(settings: ReminderSettings, now: Date): boolean {
  if (!settings.enabled) return false;
  const local = new Date(now.toLocaleString("en-US", { timeZone: settings.timezone || "America/Monterrey" }));
  return settings.days.includes(local.getDate()) && local.getHours() === settings.hour;
}

/** Elementos-alcance del DR sin dato para el periodo. */
export function pendingFor(
  userId: string,
  period: { year: number; month: number },
  elementScopes: ElementScope[],
  elements: Element[],
  results: Result[],
  scopeName: (scopeId: string) => string,
): PendingLoad[] {
  return elementScopes
    .filter((es) => es.ownerUserId === userId)
    .filter((es) => !results.some((r) => r.elementScopeId === es.id && r.year === period.year && r.month === period.month && r.value !== null))
    .map((es) => {
      const el = elements.find((e) => e.id === es.elementId);
      return { elementScopeId: es.id, elementName: el?.name ?? "Elemento", scopeName: scopeName(es.scopeId), unit: el?.unit ?? "" };
    });
}

/**
 * Construye la lista de correos a enviar para una empresa.
 * Un correo por DR con pendientes; opcionalmente uno por jefe con el resumen de su equipo.
 */
export function buildReminders(input: {
  tenantName: string;
  appUrl: string;
  settings: ReminderSettings;
  users: User[];
  elementScopes: ElementScope[];
  elements: Element[];
  results: Result[];
  scopeName: (scopeId: string) => string;
  now: Date;
}): ReminderMessage[] {
  const { tenantName, appUrl, settings, users, elementScopes, elements, results, scopeName, now } = input;
  const p = periodFor(now);
  const out: ReminderMessage[] = [];
  const byUser = new Map<string, PendingLoad[]>();

  for (const u of users) {
    const pend = pendingFor(u.id, p, elementScopes, elements, results, scopeName);
    if (pend.length === 0 || !u.email) continue;
    byUser.set(u.id, pend);
    out.push(render({ to: { userId: u.id, email: u.email, name: u.name }, kind: "owner", period: p, pending: pend, tenantName, appUrl, phase: p.phase }));
  }

  if (settings.escalateToManager) {
    for (const boss of users) {
      const team = users.filter((u) => u.managerId === boss.id && byUser.has(u.id)).map((u) => ({ userId: u.id, name: u.name, pending: byUser.get(u.id)! }));
      if (team.length === 0 || !boss.email) continue;
      out.push(render({ to: { userId: boss.id, email: boss.email, name: boss.name }, kind: "manager", period: p, pending: [], team, tenantName, appUrl, phase: p.phase }));
    }
  }
  return out;
}

function render(m: Omit<ReminderMessage, "subject" | "html" | "text"> & { tenantName: string; appUrl: string; phase: "preaviso" | "cierre" }): ReminderMessage {
  const mes = `${MONTHS_ES[m.period.month - 1]} ${m.period.year}`;
  const first = m.to.name.split(" ")[0];
  const link = `${m.appUrl.replace(/\/$/, "")}/carga`;
  const base = m.appUrl.replace(/\/$/, "");
  // Logo horizontal a color (PNG: los clientes de correo no renderizan SVG). 2000px de ancho → se muestra a 120px para retina.
  const brand = `<div style="font-family:Poppins,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#171A3A"><a href="${base}" style="display:inline-block;margin-bottom:20px"><img src="${base}/brand/logo-horizontal-2000.png" width="120" height="35" alt="mêtis" style="display:block;border:0;height:35px;width:120px"></a>`;
  const btn = (label: string) => `<a href="${link}" style="display:inline-block;background:#4F3FE0;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;margin-top:16px">${label}</a>`;
  const footer = `<p style="color:#94A3B8;font-size:12px;margin-top:32px">${m.tenantName} · mêtis · Recibes este correo porque eres responsable de indicadores en tu scorecard.</p></div>`;

  if (m.kind === "owner") {
    const n = m.pending.length;
    const subject = m.phase === "cierre"
      ? `Cierre de ${mes}: te faltan ${n} dato${n > 1 ? "s" : ""} en METIS`
      : `Prepara tu cierre de ${mes} en METIS (${n} indicador${n > 1 ? "es" : ""})`;
    const list = m.pending.map((p) => `<li style="margin:4px 0"><strong>${p.elementName}</strong> · ${p.scopeName}</li>`).join("");
    const html = `${brand}<p style="font-size:20px;font-weight:600;margin:0 0 8px">Hola ${first},</p>
<p>${m.phase === "cierre" ? `Estamos cerrando <strong>${mes}</strong> y aún no tenemos tu dato en:` : `Se acerca el cierre de <strong>${mes}</strong>. Estos indicadores esperan tu dato:`}</p>
<ul style="padding-left:18px">${list}</ul>
<p>Al cargarlo, tu scorecard y el de las personas vinculadas (CV) se actualizan en el momento.</p>
${btn("Cargar mis resultados")}${footer}`;
    const text = `Hola ${first},\n\n${m.phase === "cierre" ? `Estamos cerrando ${mes} y aún no tenemos tu dato en:` : `Se acerca el cierre de ${mes}. Estos indicadores esperan tu dato:`}\n${m.pending.map((p) => `- ${p.elementName} · ${p.scopeName}`).join("\n")}\n\nCarga aquí: ${link}\n\n${m.tenantName} · METIS`;
    return { ...m, subject, html, text };
  }

  const total = m.team!.reduce((a, t) => a + t.pending.length, 0);
  const subject = `Tu equipo trae ${total} dato${total > 1 ? "s" : ""} pendiente${total > 1 ? "s" : ""} para ${mes}`;
  const list = m.team!.map((t) => `<li style="margin:6px 0"><strong>${t.name}</strong> · ${t.pending.length} pendiente${t.pending.length > 1 ? "s" : ""}<br/><span style="color:#64748B;font-size:13px">${t.pending.map((p) => p.elementName).join(", ")}</span></li>`).join("");
  const html = `${brand}<p style="font-size:20px;font-weight:600;margin:0 0 8px">Hola ${first},</p>
<p>Resumen de tu equipo para el cierre de <strong>${mes}</strong>:</p>
<ul style="padding-left:18px">${list}</ul>
<p>Un recordatorio tuyo en la WTW suele bastar. Si alguien ya no es dueño de ese indicador, cámbialo en Alcances.</p>
${btn("Ver a mi equipo")}${footer}`;
  const text = `Hola ${first},\n\nResumen de tu equipo para el cierre de ${mes}:\n${m.team!.map((t) => `- ${t.name}: ${t.pending.length} pendiente(s) (${t.pending.map((p) => p.elementName).join(", ")})`).join("\n")}\n\n${link.replace("/carga", "/equipo")}\n\n${m.tenantName} · METIS`;
  return { ...m, subject, html, text };
}
