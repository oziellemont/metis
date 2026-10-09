/**
 * Revisiones Verticales (RV) · 1 a 1 del jefe directo con cada reporte · lógica pura (se prueba sin servidor).
 *
 * Reglas acordadas con Oziel:
 *  - Cada 6 semanas (default) o bimestral (8 semanas), contadas desde la última RV cerrada.
 *  - Horario por defecto: martes a jueves, entre 10:00 y 13:00 (hora de la empresa), 30 minutos.
 *  - Nunca dos RV a la misma hora para la misma persona; se reparten en bloques de 30 min.
 *  - Recordatorios: 3 días antes, 1 día antes y el mismo día (si cae en fin de semana, el día hábil anterior).
 *    Si ya pasó la fecha y no se ha cerrado: un recordatorio diario (L-V) hasta que el jefe la cierre en mêtis.
 *  - Solo el jefe (o un admin) reagenda.
 */
import type { RvSettings, Session, User } from "../domain/types";

export const DEFAULT_RV: RvSettings = { enabled: false, cadenceWeeks: 6 };
export const RV_CADENCES = [
  { weeks: 6, label: "Cada 6 semanas" },
  { weeks: 8, label: "Bimestral (cada 8 semanas)" },
] as const;
export const RV_MINUTES = 30;
export const RV_DAYS = [2, 3, 4]; // martes, miércoles, jueves
export const RV_SLOTS = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"]; // la última termina 13:00
/** Días mínimos entre hoy y la primera RV (para que alcance a salir el aviso de 3 días). */
export const RV_MIN_LEAD_DAYS = 4;

const DAY = 86_400_000;

// ------------------------------------------------------------ zona horaria ---
export interface LocalParts { y: number; m: number; d: number; h: number; min: number; dow: number }

/** Fecha/hora «de pared» de `date` en la zona `tz`. */
export function localParts(date: Date, tz: string): LocalParts {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23", weekday: "short" });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(date)) p[x.type] = x.value;
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute, dow };
}

/** Instante UTC que corresponde a y-m-d h:min en la zona `tz`. */
export function zonedDate(y: number, m: number, d: number, h: number, min: number, tz: string): Date {
  const want = Date.UTC(y, m - 1, d, h, min);
  let t = want;
  for (let i = 0; i < 3; i++) {
    const p = localParts(new Date(t), tz);
    const got = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
    if (got === want) break;
    t += want - got;
  }
  return new Date(t);
}

/** Número de día (días desde 1970) de la fecha local; sirve para restar días sin líos de horario. */
export function localDayNumber(date: Date, tz: string): number {
  const p = localParts(date, tz);
  return Math.round(Date.UTC(p.y, p.m - 1, p.d) / DAY);
}
const dowOfDayNumber = (n: number) => new Date(n * DAY).getUTCDay();
const isWeekend = (n: number) => { const w = dowOfDayNumber(n); return w === 0 || w === 6; };

// ----------------------------------------------------------------- parejas ---
export interface RvPair { leaderId: string; participantId: string }

/** Cada jefe con cada uno de sus reportes directos (solo personas activas en la empresa). */
export function rvPairs(users: Pick<User, "id" | "managerId">[]): RvPair[] {
  const ids = new Set(users.map((u) => u.id));
  return users
    .filter((u) => u.managerId && u.managerId !== u.id && ids.has(u.managerId))
    .map((u) => ({ leaderId: u.managerId as string, participantId: u.id }));
}

type RvLike = Pick<Session, "kind" | "leaderId" | "participantId" | "status" | "scheduledAt" | "closedAt">;
const isRv = (s: Pick<Session, "kind">) => s.kind === "rv";

/** RV abierta (agendada, en curso o por cerrar) de la pareja. */
export function openRvOf<T extends RvLike>(sessions: T[], p: RvPair): T | undefined {
  return sessions.find((s) => isRv(s) && s.leaderId === p.leaderId && s.participantId === p.participantId && s.status !== "closed");
}
/** Última RV cerrada de la pareja. */
export function lastClosedRvOf<T extends RvLike>(sessions: T[], p: RvPair): T | undefined {
  return sessions
    .filter((s) => isRv(s) && s.leaderId === p.leaderId && s.participantId === p.participantId && s.status === "closed")
    .sort((a, b) => (a.closedAt ?? a.scheduledAt).localeCompare(b.closedAt ?? b.scheduledAt))
    .pop();
}

// ------------------------------------------------------------------ agenda ---
export interface PlannedRv extends RvPair { at: Date; first: boolean }

/**
 * Agenda las RV que faltan. Una pareja necesita RV si no tiene una abierta.
 * Fecha más temprana: la última cerrada + cadencia (o, si nunca han tenido, en ~1 semana).
 * Luego toma el primer bloque libre mar–jue 10:00–12:30 donde ni el jefe ni el colaborador
 * tengan otra sesión de mêtis a menos de 30 min.
 */
export function planRvs(input: {
  users: Pick<User, "id" | "managerId">[];
  sessions: (RvLike & { participantId?: string | null })[];
  now: Date;
  cadenceWeeks: number;
  tz: string;
}): PlannedRv[] {
  const { now, tz } = input;
  const cadence = [6, 8].includes(input.cadenceWeeks) ? input.cadenceWeeks : DEFAULT_RV.cadenceWeeks;
  // ocupado: cualquier sesión no cerrada en la que la persona participa (como líder, participante o equipo)
  const busy = new Map<string, number[]>();
  const mark = (uid: string, t: number) => busy.set(uid, [...(busy.get(uid) ?? []), t]);
  for (const s of input.sessions) {
    if (s.status === "closed") continue;
    const t = new Date(s.scheduledAt).getTime();
    mark(s.leaderId, t);
    if (s.participantId) mark(s.participantId, t);
  }
  const free = (uid: string, t: number) => !(busy.get(uid) ?? []).some((b) => Math.abs(b - t) < RV_MINUTES * 60_000);

  const todayN = localDayNumber(now, tz);
  const out: PlannedRv[] = [];
  // primero las parejas que ya tienen historial (su fecha está más «amarrada»), luego las nuevas
  const pairs = rvPairs(input.users).filter((p) => !openRvOf(input.sessions, p))
    .sort((a, b) => Number(!lastClosedRvOf(input.sessions, a)) - Number(!lastClosedRvOf(input.sessions, b)));
  for (const p of pairs) {
    const last = lastClosedRvOf(input.sessions, p);
    const minN = todayN + RV_MIN_LEAD_DAYS;
    const dueN = last ? localDayNumber(new Date(last.closedAt ?? last.scheduledAt), tz) + cadence * 7 : minN;
    let n = Math.max(minN, dueN);
    let found: Date | null = null;
    for (let k = 0; k < 90 && !found; k++, n++) {
      if (!RV_DAYS.includes(dowOfDayNumber(n))) continue;
      const day = new Date(n * DAY);
      for (const hm of RV_SLOTS) {
        const [h, mi] = hm.split(":").map(Number);
        const at = zonedDate(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), h, mi, tz);
        if (free(p.leaderId, at.getTime()) && free(p.participantId, at.getTime())) { found = at; break; }
      }
    }
    if (!found) continue;
    mark(p.leaderId, found.getTime());
    mark(p.participantId, found.getTime());
    out.push({ ...p, at: found, first: !last });
  }
  return out;
}

// ----------------------------------------------------------- recordatorios ---
export type RvStage = "d3" | "d1" | "d0" | "late";

/** Día hábil en o antes del día `n`. */
const workdayOnOrBefore = (n: number) => { let x = n; while (isWeekend(x)) x--; return x; };

/**
 * ¿Qué recordatorio toca hoy para una RV no cerrada?
 * d3 = 3 días antes · d1 = 1 día antes · d0 = el mismo día · late = ya pasó y sigue sin cierre (L-V).
 * Si el día del aviso cae en fin de semana, se manda el día hábil anterior.
 */
export function rvStage(scheduledAt: string | Date, now: Date, tz: string): { stage: RvStage; daysLate: number } | null {
  const ses = localDayNumber(new Date(scheduledAt), tz);
  const today = localDayNumber(now, tz);
  if (today === ses) return { stage: "d0", daysLate: 0 };
  if (today > ses) return isWeekend(today) ? null : { stage: "late", daysLate: today - ses };
  if (today === workdayOnOrBefore(ses - 1)) return { stage: "d1", daysLate: 0 };
  if (today === workdayOnOrBefore(ses - 3)) return { stage: "d3", daysLate: 0 };
  return null;
}

// -------------------------------------------------------------- etiquetas ---
const DOW_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MON_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «martes 13 de octubre · 10:30» en la zona de la empresa. */
export function rvWhenLabel(at: string | Date, tz: string): string {
  const p = localParts(new Date(at), tz);
  return `${DOW_LONG[p.dow]} ${p.d} de ${MON_LONG[p.m - 1]} · ${String(p.h).padStart(2, "0")}:${String(p.min).padStart(2, "0")}`;
}

// ------------------------------------------------------- invitación (.ics) ---
const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const enc = new TextEncoder();
const bytes = (s: string) => enc.encode(s).length;
/** Las líneas de un .ics no deben pasar de 75 octetos: se doblan con un espacio al inicio. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (bytes(cur + ch) > 73) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}

export interface RvInvite {
  sessionId: string;
  start: Date;
  minutes?: number;
  title: string;
  description: string;
  location?: string;
  url: string;
  organizer: { name: string; email: string };
  attendees: { name: string; email: string }[];
  /** Debe crecer cada vez que cambia la sesión, para que el calendario la actualice. */
  sequence: number;
  cancel?: boolean;
}

/** Invitación de calendario estándar: Outlook, Google Calendar y Apple la aceptan sin conectar nada. */
export function rvIcs(e: RvInvite): string {
  const end = new Date(e.start.getTime() + (e.minutes ?? RV_MINUTES) * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//metis//revision vertical//ES",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `METHOD:${e.cancel ? "CANCEL" : "REQUEST"}`,
    "BEGIN:VEVENT",
    `UID:rv-${e.sessionId}@metisalign.mx`,
    `SEQUENCE:${e.sequence}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(e.start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(`${e.description}\n\n${e.url}`)}`,
    ...(e.location ? [`LOCATION:${icsText(e.location)}`] : []),
    `URL:${e.url}`,
    `ORGANIZER;CN=${icsText(e.organizer.name)}:mailto:${e.organizer.email}`,
    ...e.attendees.map((a) => `ATTENDEE;CN=${icsText(a.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a.email}`),
    `STATUS:${e.cancel ? "CANCELLED" : "CONFIRMED"}`,
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-PT15M",
    `DESCRIPTION:${icsText(e.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Liga «Agregar a Google Calendar» (respaldo por si el correo no muestra la invitación). */
export function googleCalendarUrl(e: Pick<RvInvite, "start" | "minutes" | "title" | "description" | "location" | "url">): string {
  const end = new Date(e.start.getTime() + (e.minutes ?? RV_MINUTES) * 60_000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${icsDate(e.start)}/${icsDate(end)}`,
    details: `${e.description}\n\n${e.url}`,
    ...(e.location ? { location: e.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Número de versión creciente para el .ics (minutos desde 2025). */
export function icsSequence(now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - Date.UTC(2025, 0, 1)) / 60_000));
}
