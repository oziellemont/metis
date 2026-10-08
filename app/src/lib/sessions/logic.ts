/**
 * Sesiones WTW / WTM y compromisos · lógica pura (sin React) para poder probarla.
 *
 * Reglas del método:
 *  - El equipo natural de un líder = las personas que le reportan directo.
 *  - En cada WTW se revisan los compromisos de la sesión anterior: ¿se cerró o no?
 *  - Un compromiso «vencido» es uno abierto cuya fecha ya pasó (no se guarda, se calcula).
 *  - Los compromisos capturados en una sesión quedan como borrador hasta que el líder la aprueba.
 */
import type { Commitment, Session, SessionKind, User } from "../domain/types";

export type CommitmentState = "open" | "late" | "done" | "missed" | "cancelled";

const DAY = 86_400_000;

/** YYYY-MM-DD en hora local. */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** "2026-10-09" → Date local a medianoche. */
export function parseDate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
/** Lunes de la semana de `d` (00:00). */
export function mondayOf(d: Date): Date {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // 0 = lunes
  return new Date(x.getTime() - dow * DAY);
}
/** Número de semana ISO. */
export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / DAY + 1) / 7);
}

export function teamOf(users: User[], leaderId: string): User[] {
  return users.filter((u) => u.managerId === leaderId && u.id !== leaderId);
}

export function commitmentState(c: Pick<Commitment, "status" | "dueDate">, today: Date): CommitmentState {
  if (c.status !== "open") return c.status;
  if (c.dueDate && parseDate(c.dueDate).getTime() < startOfDay(today).getTime()) return "late";
  return "open";
}

/** Sesiones del líder ordenadas por fecha (más antigua primero). */
export function sessionsOf(sessions: Session[], leaderId: string): Session[] {
  return sessions.filter((s) => s.leaderId === leaderId).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

/** La sesión inmediata anterior del mismo líder (de cualquier tipo). */
export function previousSession(sessions: Session[], session: Session): Session | undefined {
  const list = sessionsOf(sessions, session.leaderId).filter((s) => s.id !== session.id && s.scheduledAt < session.scheduledAt);
  return list[list.length - 1];
}

/**
 * Lo que se revisa en la sesión: compromisos de sesiones anteriores del mismo líder
 * que siguen abiertos o que se resolvieron después de la sesión anterior.
 */
export function commitmentsToReview(sessions: Session[], commitments: Commitment[], session: Session): Commitment[] {
  const earlier = new Set(sessionsOf(sessions, session.leaderId).filter((s) => s.id !== session.id && s.scheduledAt < session.scheduledAt).map((s) => s.id));
  const prev = previousSession(sessions, session);
  const since = prev?.scheduledAt ?? "";
  return commitments
    .filter((c) => c.approved && c.sessionId && earlier.has(c.sessionId))
    .filter((c) => c.status === "open" || (c.doneAt ?? "") >= since)
    .sort(byDue);
}

/** Compromisos nacidos en esta sesión (borradores o aprobados). */
export function commitmentsOfSession(commitments: Commitment[], sessionId: string): Commitment[] {
  return commitments.filter((c) => c.sessionId === sessionId).sort(byDue);
}

export function byDue(a: Pick<Commitment, "dueDate" | "createdAt">, b: Pick<Commitment, "dueDate" | "createdAt">): number {
  const da = a.dueDate ?? "9999", db = b.dueDate ?? "9999";
  return da === db ? (a.createdAt ?? "").localeCompare(b.createdAt ?? "") : da.localeCompare(db);
}

export interface Compliance { done: number; missed: number; total: number; pct: number | null }

/**
 * Cumplimiento: de los compromisos (no apoyos) aprobados que vencían en el rango,
 * cuántos se cumplieron. Los abiertos con fecha pasada cuentan como no cumplidos; los cancelados no cuentan.
 */
export function compliance(commitments: Commitment[], opts: { from: Date; to: Date; today: Date; ownerIds?: string[] }): Compliance {
  const from = startOfDay(opts.from).getTime(), to = startOfDay(opts.to).getTime();
  const owners = opts.ownerIds ? new Set(opts.ownerIds) : null;
  let done = 0, missed = 0;
  for (const c of commitments) {
    if (c.kind !== "commitment" || !c.approved || !c.dueDate) continue;
    if (owners && !owners.has(c.ownerId)) continue;
    const due = parseDate(c.dueDate).getTime();
    if (due < from || due > to) continue;
    const st = commitmentState(c, opts.today);
    if (st === "done") done++;
    else if (st === "missed" || st === "late") missed++;
  }
  const total = done + missed;
  return { done, missed, total, pct: total ? Math.round((done / total) * 100) : null };
}

/** Mes que cierra una WTM: si se hace en los primeros 10 días, es el mes anterior. */
export function wtmPeriod(scheduledAt: string): { year: number; month: number } {
  const d = new Date(scheduledAt);
  if (d.getDate() <= 10) {
    const p = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    return { year: p.getFullYear(), month: p.getMonth() + 1 };
  }
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** Fecha sugerida para la siguiente sesión: WTW el próximo lunes; WTM el primer día hábil del mes siguiente. Hora por defecto 9:00. */
export function suggestDate(kind: SessionKind, now: Date, hour = 9): Date {
  if (kind === "wtw") {
    const m = mondayOf(now);
    const next = new Date(m.getTime() + 7 * DAY);
    next.setHours(hour, 0, 0, 0);
    return next;
  }
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1, hour);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

/** Fecha de vencimiento sugerida para un compromiso nuevo: el día antes de la siguiente WTW (viernes). */
export function defaultDue(now: Date): string {
  const fri = new Date(mondayOf(now).getTime() + 4 * DAY);
  if (fri.getTime() < startOfDay(now).getTime() + DAY) fri.setDate(fri.getDate() + 7);
  return isoDate(fri);
}

export type Bucket = "late" | "today" | "week" | "later" | "nodate" | "closed";
export function bucketOf(c: Commitment, today: Date): Bucket {
  const st = commitmentState(c, today);
  if (st === "late") return "late";
  if (st !== "open") return "closed";
  if (!c.dueDate) return "nodate";
  const due = parseDate(c.dueDate).getTime(), t = startOfDay(today).getTime();
  if (due === t) return "today";
  const sunday = mondayOf(today).getTime() + 6 * DAY;
  return due <= sunday ? "week" : "later";
}

/** Texto corto para una fecha de vencimiento: «hoy», «mañana», «vie 9 oct», «hace 3 días». */
export function dueLabel(due: string | null | undefined, today: Date): string {
  if (!due) return "Sin fecha";
  const diff = Math.round((parseDate(due).getTime() - startOfDay(today).getTime()) / DAY);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff < 0) return `Hace ${-diff} días`;
  const d = parseDate(due);
  return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
}
const DOW = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function sessionTitle(s: Pick<Session, "kind" | "scheduledAt" | "periodMonth">): string {
  const d = new Date(s.scheduledAt);
  if (s.kind === "wtm") {
    const m = s.periodMonth ?? wtmPeriod(s.scheduledAt).month;
    return `WTM · Cierre de ${MONTHS_LONG[m - 1]}`;
  }
  return `WTW · Semana ${isoWeek(d)}`;
}
export function sessionDateLabel(iso: string): string {
  const d = new Date(iso);
  return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Cambio de estado de un compromiso con su fecha de cierre. */
export function withStatus(c: Commitment, status: Commitment["status"], now = new Date()): Commitment {
  return { ...c, status, doneAt: status === "open" ? null : now.toISOString() };
}

/** Al aprobar una sesión: todos sus borradores pasan a tareas reales. */
export function approveDrafts(commitments: Commitment[], sessionId: string): Commitment[] {
  return commitments.map((c) => (c.sessionId === sessionId && !c.approved ? { ...c, approved: true } : c));
}

/** Tareas de una persona: compromisos donde es responsable (aprobados) y apoyos que le pidieron. */
export function tasksOf(commitments: Commitment[], userId: string): Commitment[] {
  return commitments.filter((c) => c.approved && c.ownerId === userId).sort(byDue);
}
