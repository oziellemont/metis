/**
 * mêtis CEO · ritmo: vacaciones, día tranquilo y regreso sin culpa (1.2, adenda v3.2 §5).
 *
 * Dos cosas distintas, en UI y en código:
 *  - Vacaciones (`vacation_paused`): pausa explícita y abierta del mundo. Plazos congelados, nada nuevo
 *    llega, no salen avisos, no se puede jugar. Termina SOLO cuando el jugador pulsa «Reanudar ahora»
 *    (nunca se reactiva en silencio, aunque haya pasado la fecha de regreso prevista).
 *  - Día tranquilo (`quiet_day`): hasta la medianoche local. Puedes seguir jugando lo que ya tienes, pero
 *    no llegan asuntos nuevos, los plazos se detienen y no salen avisos. Es el flujo de «posponer»: un día
 *    tranquilo nunca vence decisiones a escondidas.
 *
 * Cómo se congela el tiempo: ver pausetime.ts (plazos en tiempo activo; llegadas recorridas días completos).
 * Las pausas viven en `CeoState.cadence` (JSON de la partida): no hace falta ninguna columna nueva.
 *
 * Límites (para que el descanso no se use para escalar en el ranking):
 *  - Pausar no da XP ni días de racha; los días en pausa son neutros (ni suman ni rompen).
 *  - Hasta VACATIONS_PER_SEASON vacaciones por empresa y fecha de regreso a no más de VACATION_MAX_DAYS.
 *  - Un día tranquilo cada QUIET_EVERY_DAYS días.
 *  - Mientras estás de vacaciones el motor rechaza jugadas (decidir, lecciones, dilemas, cambio, crisis…).
 */
import { DAY, H, entries, healthOf, kpis, localMidnight, nowOf, packOf, seasonDoneOf, streakOf } from "./engine";
import { currentPause } from "./pausetime";
import type { Cadence, CadenceStatus, CeoState, PausePeriod } from "./types";
import type { Sent } from "./schedule";

export const CADENCE_POLICY_VERSION = 1 as const;
export const VACATION_MAX_DAYS = 60;
export const VACATIONS_PER_SEASON = 3;
export const QUIET_EVERY_DAYS = 7;
/** A partir de cuánto tiempo fuera se muestra la pantalla de regreso. */
export const RETURN_AFTER_VACATION = 3 * DAY;
export const RETURN_AFTER_ABSENCE = 7 * DAY;

export const PAUSE_CONFIRM = "Tu empresa quedará en pausa. No perderás tu progreso ni se vencerán decisiones mientras descansas.";
export const QUIET_TEXT = "Hoy no llegan asuntos nuevos y tus plazos se detienen hasta mañana. Puedes seguir con lo que ya tienes, sin prisa.";

export function cadenceStatus(s: CeoState, now = nowOf(s)): CadenceStatus {
  const p = currentPause(s, now);
  return !p ? "active" : p.kind === "vacation" ? "vacation_paused" : "quiet_day";
}

const cadenceOf = (s: CeoState): Cadence => s.cadence ?? { policyVersion: CADENCE_POLICY_VERSION, pauses: [] };
const withPauses = (s: CeoState, pauses: PausePeriod[]): CeoState => ({ ...s, cadence: { ...cadenceOf(s), policyVersion: CADENCE_POLICY_VERSION, pauses } });
const seasonPauses = (s: CeoState) => (s.cadence?.pauses ?? []).filter((p) => p.from >= (s.startedAt ?? 0));

export type CanPause = { ok: true } | { ok: false; reason: "sin_empresa" | "ya_en_pausa" | "temporada_cerrada" | "limite" | "fecha_invalida" };
export function canPause(s: CeoState, now = nowOf(s), plannedResumeAt: number | null = null): CanPause {
  if (!s.startedAt) return { ok: false, reason: "sin_empresa" };
  if (cadenceStatus(s, now) === "vacation_paused") return { ok: false, reason: "ya_en_pausa" };
  if (seasonDoneOf(s, now)) return { ok: false, reason: "temporada_cerrada" };
  if (seasonPauses(s).filter((p) => p.kind === "vacation").length >= VACATIONS_PER_SEASON) return { ok: false, reason: "limite" };
  if (plannedResumeAt !== null && !(plannedResumeAt > now && plannedResumeAt <= now + VACATION_MAX_DAYS * DAY)) return { ok: false, reason: "fecha_invalida" };
  return { ok: true };
}

/**
 * Pausar la carrera (vacaciones). Idempotente: si ya estás en pausa, no cambia nada.
 * Si estabas en un día tranquilo, ese día termina donde empieza la pausa.
 */
export function pauseCareer(s: CeoState, now = nowOf(s), plannedResumeAt: number | null = null): CeoState {
  if (!canPause(s, now, plannedResumeAt).ok) return s;
  const pauses = (s.cadence?.pauses ?? []).map((p) => (p.kind === "quiet" && p.from <= now && (p.to ?? now) > now ? { ...p, to: now } : p));
  return withPauses(s, [...pauses, { kind: "vacation", from: now, to: null, plannedResumeAt }]);
}

/** Reanudar. Cierra las vacaciones (o termina antes el día tranquilo). Idempotente. */
export function resumeCareer(s: CeoState, now = nowOf(s)): CeoState {
  const cur = currentPause(s, now);
  if (!cur) return s;
  const pauses = (s.cadence?.pauses ?? []).map((p) => (p === cur ? { ...p, to: Math.max(p.from, now) } : p));
  return { ...withPauses(s, pauses), lastActiveAt: now };
}

export type CanQuiet = { ok: true; until: number } | { ok: false; reason: "sin_empresa" | "ya_en_pausa" | "reciente" | "temporada_cerrada" };
/** Medianoche local siguiente: ahí termina un día tranquilo. */
export const quietUntil = (now: number, tz: string) => localMidnight(now, tz) + DAY;
export function canQuiet(s: CeoState, now = nowOf(s)): CanQuiet {
  if (!s.startedAt) return { ok: false, reason: "sin_empresa" };
  if (cadenceStatus(s, now) !== "active") return { ok: false, reason: "ya_en_pausa" };
  if (seasonDoneOf(s, now)) return { ok: false, reason: "temporada_cerrada" };
  if ((s.cadence?.pauses ?? []).some((p) => p.kind === "quiet" && now - p.from < QUIET_EVERY_DAYS * DAY)) return { ok: false, reason: "reciente" };
  return { ok: true, until: quietUntil(now, s.settings.tz) };
}
/**
 * Día tranquilo hasta `until` (la medianoche local; la calcula el dispositivo con su zona y el servidor
 * solo comprueba que sea razonable). Idempotente.
 */
export function startQuietDay(s: CeoState, now = nowOf(s), until?: number): CeoState {
  const c = canQuiet(s, now);
  if (!c.ok) return s;
  const to = until ?? c.until;
  if (!(to > now && to <= now + DAY + 2 * H)) return s;
  return withPauses(s, [...(s.cadence?.pauses ?? []), { kind: "quiet", from: now, to }]);
}

// ───────────────────────────────────────────── regreso
/** Última vacación ya cerrada (si hay). */
export function lastVacation(s: CeoState): PausePeriod | null {
  const v = (s.cadence?.pauses ?? []).filter((p) => p.kind === "vacation" && p.to !== null);
  return v.length ? v[v.length - 1] : null;
}

/**
 * ¿Toca la pantalla «Qué bueno tenerte de vuelta»? Tras unas vacaciones de 3+ días, o tras 7+ días
 * sin entrar (sin pausa). Una sola vez por regreso. Durante una pausa, nunca (ahí va la de descanso).
 */
export function returnDue(s: CeoState, now = nowOf(s)): "vacaciones" | "ausencia" | null {
  if (!s.startedAt || cadenceStatus(s, now) === "vacation_paused") return null;
  const seen = s.cadence?.welcomeSeenAt ?? 0;
  const v = lastVacation(s);
  if (v && (v.to as number) > seen && (v.to as number) - v.from >= RETURN_AFTER_VACATION && now - (v.to as number) < DAY) return "vacaciones";
  const last = s.lastActiveAt || s.startedAt;
  if (last > seen && now - last >= RETURN_AFTER_ABSENCE && !seasonDoneOf(s, now)) return "ausencia";
  return null;
}
export function markReturnSeen(s: CeoState, now = nowOf(s)): CeoState {
  return { ...s, cadence: { ...cadenceOf(s), welcomeSeenAt: now }, lastActiveAt: Math.max(s.lastActiveAt || 0, now) };
}

export interface ReturnSummary {
  company: string;
  decided: number;
  pending: number;
  health: number;
  streakBest: number;
  /** Últimas decisiones que tomaste (hechos reales, ya aceptados). */
  last: { subject: string; choice: string; at: number }[];
  /** Lo que te espera, con su tiempo restante. */
  waiting: { id: string; subject: string; leftMs: number }[];
}
/** Repasar dónde me quedé: solo hechos que ya ocurrieron. Nada inventado sobre la ausencia. */
export function returnSummary(s: CeoState, now = nowOf(s)): ReturnSummary {
  const es = entries(s, now);
  const decided = es.filter((e) => e.status === "decidido").sort((a, b) => b.decision!.at - a.decision!.at);
  const pending = es.filter((e) => e.status === "pendiente").sort((a, b) => a.deadline - b.deadline);
  return {
    company: packOf(s).name,
    decided: decided.length,
    pending: pending.length,
    health: healthOf(kpis(s, now)),
    streakBest: streakOf(s, now).best,
    last: decided.slice(0, 3).map((e) => ({ subject: e.item.subject, choice: e.option?.text ?? "", at: e.decision!.at })),
    waiting: pending.slice(0, 3).map((e) => ({ id: e.item.id, subject: e.item.subject, leftMs: e.deadline - now })),
  };
}
/** Ritmo más ligero sugerido al volver: una decisión menos al día (mínimo 1). */
export const lighterGoal = (goal: number): 1 | 2 | 3 => (Math.max(1, Math.min(3, goal - 1)) as 1 | 2 | 3);

// ───────────────────────────────────────────── avisos ya programados
/** Clave en `sent` donde se guarda un correo programado en Resend: `sched:<clave>` = `<id>|<ISO>`. */
export const schedKey = (key: string) => `sched:${key}`;
/**
 * Al pausar (o en cada corrida del cron con el jugador en pausa): qué correos programados hay que
 * cancelar y cómo queda `sent`. Se borra también la clave del aviso, para que al reanudar se
 * programe UNA vez a su nueva hora. Idempotente.
 */
export function unscheduleAll(sent: Sent, real: number): { ids: string[]; sent: Sent; changed: boolean } {
  const out: Sent = { ...sent };
  const ids: string[] = [];
  let changed = false;
  for (const [k, v] of Object.entries(sent)) {
    if (!k.startsWith("sched:")) continue;
    const [id, iso] = String(v).split("|");
    const at = Date.parse(iso ?? "");
    delete out[k];
    changed = true;
    if (Number.isFinite(at) && at > real) {
      if (id) ids.push(id);
      delete out[k.slice(6)];
    }
  }
  return { ids, sent: out, changed };
}
