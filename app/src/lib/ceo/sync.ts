/**
 * mêtis CEO · sincronización entre dispositivos (PR 1.1, adenda v3.2).
 *
 * Problema que resuelve: la misma cuenta abierta en dos dispositivos. Antes, el que guardaba al último
 * pisaba la nube aunque tuviera una copia vieja. Ahora:
 *  1. Antes de subir, se compara el `savedAt` de la partida en la nube con el último que este dispositivo vio.
 *     Si otro dispositivo escribió en medio, primero se baja y se mezcla; nunca se pisa a ciegas.
 *  2. Al volver a la pestaña (o cada cierto tiempo) se revisa si la nube cambió y se trae.
 *  3. La mezcla es conservadora: si ambas copias son la misma temporada (misma empresa, mismo inicio,
 *     misma carrera), se unen decisiones, lecturas, lecciones y dilemas (la primera respuesta a un asunto
 *     es la que vale, como en el juego). Si son temporadas distintas, gana la copia más reciente completa.
 *  4. Las preferencias (meta diaria, minutos, horario) viajan en la partida; si la nube solo las tiene en
 *     columnas (perfil de onboarding), se rellenan sin pisar lo que el jugador ya eligió.
 *
 * Lógica pura: sin React, sin navegador, sin Supabase.
 */
import type { CeoState, Decision } from "./types";
import { isDailyGoal, isSessionMinutes } from "./onboarding";

export const SYNC_VERSION = 1;
/** Cada cuánto se revisa la nube con la pestaña abierta y visible (ms). */
export const SYNC_POLL_MS = 60_000;

/** ¿Las dos copias son la misma temporada? (si no, no se mezclan: gana la más reciente). */
export function sameRun(a: CeoState, b: CeoState): boolean {
  return Boolean(a.startedAt) && a.startedAt === b.startedAt && a.company === b.company && (a.career?.length ?? 0) === (b.career?.length ?? 0);
}

/** La copia más reciente por `savedAt`. Empate: la local (no hay nada nuevo que traer). */
export function newest(local: CeoState | null, cloud: CeoState | null): "local" | "cloud" | null {
  if (!local?.startedAt && !cloud?.startedAt) return null;
  if (!cloud?.startedAt) return "local";
  if (!local?.startedAt) return "cloud";
  return (cloud.savedAt || 0) > (local.savedAt || 0) ? "cloud" : "local";
}

/** Une dos mapas id → valor quedándose, en choque, con el de fecha más temprana (la primera respuesta vale). */
function unionEarliest<T>(a: Record<string, T> | undefined, b: Record<string, T> | undefined, at: (v: T) => number): Record<string, T> {
  const out: Record<string, T> = { ...(a ?? {}) };
  for (const [k, v] of Object.entries(b ?? {})) if (!(k in out) || at(v) < at(out[k])) out[k] = v;
  return out;
}
const num = (v: number) => v;

export interface MergeResult { state: CeoState; how: "igual" | "local" | "nube" | "mezcla" }

/**
 * Mezcla la copia de este dispositivo con la de la nube.
 * - Sin nube: la local. Sin local: la nube.
 * - Temporadas distintas: la más reciente entera.
 * - Misma temporada: base = la más reciente (preferencias, cambio, crisis…), más la unión de lo jugado en ambas.
 */
export function mergeStates(local: CeoState | null, cloud: CeoState | null): MergeResult | null {
  const w = newest(local, cloud);
  if (!w) return null;
  if (!cloud?.startedAt) return { state: local!, how: "local" };
  if (!local?.startedAt) return { state: cloud, how: "nube" };
  if (!sameRun(local, cloud)) return w === "cloud" ? { state: cloud, how: "nube" } : { state: local, how: "local" };
  const base = w === "cloud" ? cloud : local;
  const decisions = unionEarliest<Decision>(local.decisions, cloud.decisions, (d) => d.at);
  const read = unionEarliest(local.read, cloud.read, num);
  const lessons = unionEarliest(local.lessons, cloud.lessons, num);
  const pinned = unionEarliest(local.pinned, cloud.pinned, num);
  const dilemmas = unionEarliest(local.dilemmas, cloud.dilemmas, (d) => d.at);
  // Comparación sin depender del orden de las llaves.
  const same = (x: Record<string, unknown> | undefined, y: Record<string, unknown> | undefined) => {
    const a = x ?? {}, b = y ?? {};
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => k in b && JSON.stringify(a[k]) === JSON.stringify(b[k]));
  };
  const untouched = same(decisions, base.decisions) && same(read, base.read) && same(lessons, base.lessons) && same(pinned, base.pinned) && same(dilemmas, base.dilemmas);
  if (untouched) return { state: base, how: base === local ? (local.savedAt === cloud.savedAt ? "igual" : "local") : "nube" };
  const state: CeoState = {
    ...base,
    decisions, read, lessons, pinned,
    ...(Object.keys(dilemmas).length ? { dilemmas } : {}),
    lastActiveAt: Math.max(local.lastActiveAt || 0, cloud.lastActiveAt || 0),
    savedAt: Math.max(local.savedAt || 0, cloud.savedAt || 0) + 1,
  };
  return { state, how: "mezcla" };
}

/** Columnas de preferencias de `ceo.players` (migración 0016) que pueden rellenar la partida. */
export interface ServerPrefs { daily_decision_goal?: number | null; preferred_session_minutes?: number | null }

/** Rellena meta y minutos desde las columnas si la partida no los trae. Nunca pisa lo que ya eligió el jugador. */
export function withServerPrefs(s: CeoState, row: ServerPrefs | null | undefined): CeoState {
  if (!row || !s.startedAt) return s;
  const patch: Partial<CeoState["settings"]> = {};
  if (!isDailyGoal(s.settings.dailyGoal) && isDailyGoal(row.daily_decision_goal)) patch.dailyGoal = row.daily_decision_goal;
  if (!isSessionMinutes(s.settings.sessionMinutes) && isSessionMinutes(row.preferred_session_minutes)) patch.sessionMinutes = row.preferred_session_minutes;
  return Object.keys(patch).length ? { ...s, settings: { ...s.settings, ...patch } } : s;
}

/**
 * Antes de subir: ¿la nube sigue como la dejamos? Se compara el `savedAt` de la partida en la nube
 * (no la fecha de la fila, que también cambian el perfil o el correo) con el último que este dispositivo
 * escribió o leyó.
 * - `escribir`: nadie más escribió (o no hay partida en la nube todavía).
 * - `traer`: otro dispositivo guardó otra copia desde entonces; hay que bajar, mezclar y luego subir la mezcla.
 */
export function planSave(lastSynced: number, cloudSavedAt: number | null | undefined): "escribir" | "traer" {
  if (typeof cloudSavedAt !== "number" || !Number.isFinite(cloudSavedAt)) return "escribir";
  // Distinto (no solo mayor): el reloj del otro dispositivo puede ir atrasado.
  return cloudSavedAt !== lastSynced ? "traer" : "escribir";
}
