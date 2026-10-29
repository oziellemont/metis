/**
 * mêtis CEO · aritmética de pausas (1.2, adenda v3.2 §5). Lógica pura, sin dependencias del motor.
 *
 * Una pausa es un periodo [from, to) en hora real. Vacaciones: `to` = null mientras sigue abierta.
 * Día tranquilo: `to` = medianoche local, fijado al empezar. El motor usa estas funciones para:
 *
 *  - Plazos: el tiempo de un asunto solo corre fuera de las pausas. Un caso con 5 h restantes al pausar
 *    tiene exactamente 5 h al reanudar (la pausa abierta cuenta hasta «ahora», así que nunca vence).
 *  - Llegadas: lo que aún no llegaba se recorre días completos (lo que dure la pausa, redondeado hacia
 *    arriba). Así sigue cayendo dentro de tu horario, nada llega durante la pausa y nada llega de golpe al volver.
 *  - Puntualidad (XP, solo reglas legacy v1): se mide en tiempo activo, para que pausar no quite el bono.
 *
 * Sin pausas, todas las funciones son la identidad: las partidas doradas no cambian.
 */
import type { CeoState, PausePeriod } from "./types";

const DAY = 86_400_000;

export interface Span { from: number; to: number; open: boolean; kind: PausePeriod["kind"] }

/** Pausas efectivas a la hora `now` (la abierta llega hasta `now`), ordenadas. `since`: ignora las que terminaron antes. */
export function spansOf(pauses: PausePeriod[] | undefined, now: number, since = -Infinity): Span[] {
  if (!pauses?.length) return [];
  const out: Span[] = [];
  for (const p of pauses) {
    if (!p || p.from > now) continue;
    const open = p.to === null;
    const to = open ? Math.max(p.from, now) : (p.to as number);
    if (to <= p.from && !open) continue;
    if (to <= since && !(open && p.from >= since)) continue;
    out.push({ from: p.from, to, open, kind: p.kind });
  }
  return out.sort((a, b) => a.from - b.from);
}

/** Pausas que tocan la temporada en curso. */
export const runSpans = (s: Pick<CeoState, "cadence" | "startedAt">, now: number) => spansOf(s.cadence?.pauses, now, s.startedAt ?? 0);

/**
 * Días completos que se recorre lo que llega después de que empezó una pausa.
 *  - Vacaciones cerradas: lo que duraron, redondeado hacia abajo. Así el día en que vuelves sigue su curso
 *    normal (lo que caía en las horas «sobrantes» llega al reanudar, ver shiftArrival).
 *  - Vacaciones abiertas: un día más, para que nada llegue mientras duren.
 *  - Día tranquilo: el calendario de la empresa se recorre un día completo (lo de hoy pasa a mañana).
 */
export function shiftDaysOf(sp: Span): number {
  const dur = sp.to - sp.from;
  if (sp.kind === "quiet") return Math.ceil(dur / DAY);
  return sp.open ? Math.floor(dur / DAY) + 1 : Math.floor(dur / DAY);
}

/**
 * Hora de llegada de algo que todavía no había llegado, recorrida por las pausas.
 * Si aun así cae dentro de la pausa, llega justo al reanudar (vacaciones: estás ahí porque pulsaste
 * «Reanudar») o al inicio de tu horario del día siguiente (día tranquilo).
 */
export function shiftArrival(spans: Span[], t: number, windowStartH = 8): number {
  let out = t;
  for (const sp of spans) {
    if (out < sp.from) continue;
    out += shiftDaysOf(sp) * DAY;
    if (!sp.open && out < sp.to) out = sp.kind === "quiet" ? sp.to + windowStartH * 3_600_000 : sp.to + 60_000;
  }
  return out;
}

/** Plazo: el instante en que se juntan `ms` de tiempo activo desde `start`, saltando las pausas. */
export function extendDeadline(spans: Span[], start: number, ms: number): number {
  let cur = start, rem = ms;
  for (const sp of spans) {
    if (sp.to <= cur) continue;
    const ps = Math.max(sp.from, cur);
    if (cur + rem <= ps) break;
    rem -= ps - cur;
    cur = sp.to;
  }
  return cur + rem;
}

/** Tiempo activo (fuera de pausas) entre `a` y `b`. */
export function activeMs(spans: Span[], a: number, b: number): number {
  if (b <= a) return b - a;
  let paused = 0;
  for (const sp of spans) paused += Math.max(0, Math.min(b, sp.to) - Math.max(a, sp.from));
  return b - a - paused;
}

/** ¿Está de vacaciones (pausa abierta) en `now`? */
export const onVacation = (s: Pick<CeoState, "cadence">, now: number) =>
  !!s.cadence?.pauses?.some((p) => p.kind === "vacation" && p.to === null && p.from <= now);

/** La pausa vigente en `now` (vacaciones abiertas o día tranquilo que no ha terminado). */
export function currentPause(s: Pick<CeoState, "cadence">, now: number): PausePeriod | null {
  const ps = s.cadence?.pauses ?? [];
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    if (p.from <= now && (p.to === null || now < p.to)) return p;
  }
  return null;
}

/** Limpia `cadence` al leer un estado guardado. Devuelve null si no sirve. */
export function sanitizeCadence(raw: unknown): CeoState["cadence"] | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.pauses)) return null;
  const ok = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x > 0;
  const pauses: PausePeriod[] = [];
  for (const p of r.pauses.slice(-200) as Record<string, unknown>[]) {
    if (!p || (p.kind !== "vacation" && p.kind !== "quiet") || !ok(p.from)) continue;
    if (p.to !== null && !(ok(p.to) && p.to >= p.from)) continue;
    if (p.kind === "quiet" && p.to === null) continue;
    pauses.push({ kind: p.kind, from: p.from, to: p.to as number | null, ...(p.plannedResumeAt === null || ok(p.plannedResumeAt) ? { plannedResumeAt: p.plannedResumeAt as number | null } : {}) });
  }
  pauses.sort((a, b) => a.from - b.from);
  // Solo puede haber una pausa abierta: la última. Las demás abiertas (datos dañados) se cierran donde empieza la siguiente.
  for (let i = 0; i < pauses.length - 1; i++) if (pauses[i].to === null || (pauses[i].to as number) > pauses[i + 1].from) pauses[i] = { ...pauses[i], to: pauses[i + 1].from };
  return { policyVersion: 1, pauses, ...(ok(r.welcomeSeenAt) ? { welcomeSeenAt: r.welcomeSeenAt } : {}) };
}
