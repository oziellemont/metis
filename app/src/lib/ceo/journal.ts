/**
 * mêtis CEO · diario de jugadas (Fase 0.5, modo sombra).
 *
 * Cada acción del jugador viaja al servidor como un evento con id único. El servidor vuelve a jugar
 * la partida con el mismo motor (replay.ts) y guarda:
 *  - el evento (aceptado o rechazado y por qué) en ceo.game_events,
 *  - el estado que él calcula y su XP en ceo.game_runs.
 * El jugador no ve nada distinto: si el diario falla o está apagado, la partida sigue igual.
 *
 * Reglas:
 *  - El usuario lo da la sesión (servidor), nunca el cuerpo de la petición.
 *  - Un mismo evento (eventId) nunca se aplica dos veces (reintentos, doble clic, dos pestañas).
 *  - Dos dispositivos: los eventos se aplican en orden de llegada; uno que ya no procede (p. ej. decidir
 *    algo que el otro dispositivo ya decidió) se guarda como rechazado y NO toca el estado.
 *  - La carrera se identifica con `run_id`, derivado de usuario + inicio de la carrera.
 *
 * Lógica pura (sin red ni base): se usa en la ruta /api/ceo/partida y en las pruebas.
 */
import { applyAction, type GameAction } from "./replay";
import { H, migrate, newState, xpOf } from "./engine";
import type { CeoState } from "./types";

export const JOURNAL_MAX_EVENTS = 50;
export const JOURNAL_MAX_BYTES = 256 * 1024;
/** Tolerancia de reloj: un evento con hora más adelantada que esto respecto del servidor se marca. */
export const CLOCK_SLACK_MS = 10 * 60 * 1000;

export interface JournalEvent { eventId: string; seq: number; action: GameAction }
export interface EventResult { eventId: string; seq: number; action: GameAction; accepted: boolean; note: string | null; at: number }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (x: unknown): x is string => typeof x === "string" && UUID.test(x);

/** Inicio de la carrera (primera empresa). Identifica la carrera aunque se juegue en varios dispositivos. */
export const careerStartOf = (s: Pick<CeoState, "career" | "startedAt">): number | null => (s.career ?? [])[0]?.startedAt ?? s.startedAt ?? null;

/** UUID (formato v5) a partir de 32+ caracteres hexadecimales de un hash. */
export function uuidFromHex(hex: string): string {
  const h = hex.toLowerCase().replace(/[^0-9a-f]/g, "").padEnd(32, "0").slice(0, 32).split("");
  h[12] = "5";
  h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  const s = h.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
/** Texto que se pasa por SHA-256 para obtener el run_id. */
export const runSeed = (userId: string, careerStartedAt: number) => `metis-ceo-run|${userId}|${Math.round(careerStartedAt)}`;

// ───────────────────────────────────────────── limpiar lo que llega del navegador
const num = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const str = (x: unknown, max = 80): x is string => typeof x === "string" && x.length > 0 && x.length <= max;
const SETTINGS_KEYS = ["tz", "windowStart", "windowEnd", "notifyEmail", "notifyWhatsapp", "intensivo"] as const;
function cleanSettings(x: unknown): Record<string, unknown> | undefined {
  if (!x || typeof x !== "object" || Array.isArray(x)) return undefined;
  const r = x as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of SETTINGS_KEYS) {
    const v = r[k];
    if (k === "tz" ? str(v, 64) : k === "windowStart" || k === "windowEnd" ? num(v) && v >= 0 && v <= 24 : typeof v === "boolean") out[k] = v;
  }
  if (r.dailyGoal === 1 || r.dailyGoal === 2 || r.dailyGoal === 3) out.dailyGoal = r.dailyGoal;
  if (r.sessionMinutes === 3 || r.sessionMinutes === 5 || r.sessionMinutes === 8 || r.sessionMinutes === 12) out.sessionMinutes = r.sessionMinutes;
  return out; // correo y teléfono nunca entran al diario
}
function cleanPicks(x: unknown): Record<string, string> | null {
  if (!x || typeof x !== "object" || Array.isArray(x)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>).slice(0, 10)) if (str(k, 40) && str(v, 40)) out[k] = v;
  return out;
}

/** Acepta solo acciones conocidas con campos válidos. Devuelve una copia limpia o null. */
export function sanitizeAction(raw: unknown): GameAction | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const a = raw as Record<string, unknown>;
  if (!num(a.at) || a.at <= 0) return null;
  const at = Math.round(a.at);
  switch (a.type) {
    case "start": {
      if (typeof a.name !== "string" || a.name.length > 80 || !str(a.company, 40)) return null;
      const out: GameAction = { type: "start", at, name: a.name, company: a.company, settings: cleanSettings(a.settings) };
      if (num(a.rulesVersion) && Number.isInteger(a.rulesVersion) && a.rulesVersion >= 1) out.rulesVersion = a.rulesVersion;
      if (num(a.tier)) out.tier = a.tier;
      if (a.journey === true) out.journey = true;
      return out;
    }
    case "decide": {
      if (!str(a.item, 60) || !str(a.option, 60)) return null;
      const out: GameAction = { type: "decide", at, item: a.item, option: a.option };
      const w = a.written as Record<string, unknown> | undefined;
      if (w && typeof w === "object" && typeof w.text === "string" && num(w.quality)) out.written = { text: w.text.slice(0, 1200), quality: Math.max(0, Math.min(3, Math.round(w.quality))) as 0 | 1 | 2 | 3, feedback: String(w.feedback ?? "").slice(0, 280) };
      return out;
    }
    case "dilemma": return str(a.id, 60) && num(a.option) && Number.isInteger(a.option) && a.option >= 0 && a.option < 10 ? { type: "dilemma", at, id: a.id, option: a.option } : null;
    case "lesson": return str(a.id, 60) ? { type: "lesson", at, id: a.id } : null;
    case "settings": {
      const patch = cleanSettings(a.patch);
      if (!patch) return null;
      const out: GameAction = { type: "settings", at, patch };
      if (typeof a.name === "string" && a.name.length <= 80) out.name = a.name;
      if (typeof a.alias === "string" && a.alias.length <= 24) out.alias = a.alias;
      return out;
    }
    case "changeStart": return { type: "changeStart", at };
    case "changeClose": return { type: "changeClose", at };
    case "lever": return str(a.lever, 30) && Array.isArray(a.targets) && a.targets.length <= 3 && a.targets.every((t) => str(t, 30)) ? { type: "lever", at, lever: a.lever as never, targets: a.targets as never } : null;
    case "advance": return { type: "advance", at, ...(num(a.rulesVersion) && Number.isInteger(a.rulesVersion) && a.rulesVersion >= 1 ? { rulesVersion: a.rulesVersion } : {}) };
    case "switch": return str(a.company, 40) ? { type: "switch", at, company: a.company } : null;
    case "crisis": { const picks = cleanPicks(a.picks); return picks && num(a.from) ? { type: "crisis", at, from: Math.round(a.from), picks } : null; }
    case "appoint": return { type: "appoint", at };
    case "board": return typeof a.passed === "boolean" ? { type: "board", at, passed: a.passed } : null;
    case "pause": return a.until === null || a.until === undefined ? { type: "pause", at, until: null } : num(a.until) && a.until > at ? { type: "pause", at, until: Math.round(a.until) } : null;
    case "resume": return { type: "resume", at };
    case "quiet": return num(a.until) && a.until > at ? { type: "quiet", at, until: Math.round(a.until) } : null;
    default: return null;
  }
}

/** Limpia un lote. Lo inválido se descarta (no se aplica ni se guarda). Ordena por `seq` del dispositivo. */
export function sanitizeEvents(raw: unknown): { events: JournalEvent[]; dropped: number } {
  if (!Array.isArray(raw)) return { events: [], dropped: 0 };
  const seen = new Set<string>();
  const events: JournalEvent[] = [];
  let dropped = 0;
  for (const e of raw.slice(0, JOURNAL_MAX_EVENTS)) {
    const r = (e ?? {}) as Record<string, unknown>;
    const action = sanitizeAction(r.action);
    const id = typeof r.eventId === "string" ? r.eventId.toLowerCase() : "";
    if (!action || !isUuid(id) || !num(r.seq) || seen.has(id)) { dropped++; continue; }
    seen.add(id);
    events.push({ eventId: id, seq: Math.round(r.seq), action });
  }
  dropped += Math.max(0, raw.length - JOURNAL_MAX_EVENTS);
  events.sort((a, b) => a.seq - b.seq);
  return { events, dropped };
}

// ───────────────────────────────────────────── aplicar en el servidor
/**
 * Aplica eventos nuevos sobre el estado que el servidor ya tenía. Lo rechazado no cambia el estado.
 * `flagged`: eventos con hora adelantada respecto del servidor (p. ej. reloj de prueba).
 */
export function applyEvents(state: CeoState, events: JournalEvent[], serverNow: number): { state: CeoState; results: EventResult[]; rejected: number; flagged: number } {
  let s = state;
  let rejected = 0, flagged = 0;
  const results: EventResult[] = [];
  for (const e of events) {
    const ahead = e.action.at > serverNow + CLOCK_SLACK_MS;
    let accepted = false;
    let note: string | null = null;
    if (e.action.type === "start" && s.startedAt) note = "carrera_ya_iniciada";
    else {
      const r = applyAction(s, e.action);
      accepted = r.applied;
      if (accepted) s = r.state; else note = "no_procede";
    }
    if (ahead) { flagged++; note = note ? `${note};reloj_adelantado` : "reloj_adelantado"; }
    if (!accepted) rejected++;
    results.push({ eventId: e.eventId, seq: e.seq, action: e.action, accepted, note, at: e.action.at });
  }
  return { state: s, results, rejected, flagged };
}

/** XP según el servidor. Se mide al momento más tardío entre la hora del servidor y la última jugada. */
export function serverXpOf(s: CeoState, serverNow: number): number {
  return xpOf(s, Math.max(serverNow, s.lastActiveAt || 0, s.savedAt || 0));
}

/** ¿El punto de partida es una carrera recién empezada (nada que valga XP) o una que ya traía avance? */
export function baseKindOf(s: CeoState): "inicio" | "continuacion" {
  const empty = !Object.keys(s.decisions ?? {}).length && !(s.career ?? []).length && !Object.keys(s.lessons ?? {}).length && !Object.keys(s.dilemmas ?? {}).length && !(s.crises ?? []).length && !s.change;
  return empty ? "inicio" : "continuacion";
}

export type BaseCheck = { ok: true; state: CeoState; kind: "inicio" | "continuacion"; xp: number } | { ok: false; error: "base_invalida" | "base_ajena" };
/** Punto de partida que manda el dispositivo cuando el servidor todavía no conoce esa carrera. */
export function checkBase(raw: unknown, careerStartedAt: number, serverNow: number): BaseCheck {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "base_invalida" };
  let size = 0;
  try { size = JSON.stringify(raw).length; } catch { return { ok: false, error: "base_invalida" }; }
  if (size > JOURNAL_MAX_BYTES) return { ok: false, error: "base_invalida" };
  const s = migrate(raw);
  if (!s.startedAt) return { ok: false, error: "base_invalida" };
  if (careerStartOf(s) !== careerStartedAt) return { ok: false, error: "base_ajena" };
  const kind = baseKindOf(s);
  return { ok: true, state: s, kind, xp: kind === "inicio" ? 0 : serverXpOf(s, serverNow) };
}

/** Carrera nueva sin punto de partida: solo si el primer evento es su «start». */
export function startsCareer(events: JournalEvent[], careerStartedAt: number): boolean {
  const a = events[0]?.action;
  return !!a && a.type === "start" && a.at === careerStartedAt;
}
export const emptyBase = (): CeoState => newState();

// ───────────────────────────────────────────── cola en el dispositivo
export interface QueuedEvent extends JournalEvent { career: number }
export interface JournalQueue { device: string; next: number; items: QueuedEvent[] }
export const JOURNAL_QUEUE_MAX = 400;
export const journalKey = (uid: string) => `metis-ceo-v2:${uid}:diario`;

export function readQueue(raw: string | null, newId: () => string): JournalQueue {
  try {
    const q = raw ? (JSON.parse(raw) as JournalQueue) : null;
    if (q && typeof q.device === "string" && Array.isArray(q.items) && num(q.next)) return q;
  } catch { /* se rehace */ }
  return { device: newId(), next: 1, items: [] };
}

/** Agrega una acción a la cola. Ignora una repetición idéntica consecutiva. Si se llena, descarta lo más viejo. */
export function enqueue(q: JournalQueue, action: GameAction, career: number, newId: () => string): JournalQueue {
  const last = q.items[q.items.length - 1];
  if (last && last.career === career && JSON.stringify(last.action) === JSON.stringify(action)) return q;
  const items = [...q.items, { eventId: newId(), seq: q.next, action, career }];
  return { ...q, next: q.next + 1, items: items.slice(-JOURNAL_QUEUE_MAX) };
}

/** Siguiente lote a enviar: los más viejos de una misma carrera. */
export function nextBatch(q: JournalQueue): { career: number; events: JournalEvent[] } | null {
  const first = q.items[0];
  if (!first) return null;
  const events = q.items.filter((i) => i.career === first.career).slice(0, JOURNAL_MAX_EVENTS).map(({ eventId, seq, action }) => ({ eventId, seq, action }));
  return { career: first.career, events };
}
/** Quita de la cola lo ya entregado (o descartado). */
export const ack = (q: JournalQueue, ids: string[]): JournalQueue => { const set = new Set(ids); return { ...q, items: q.items.filter((i) => !set.has(i.eventId)) }; };
export const dropCareer = (q: JournalQueue, career: number): JournalQueue => ({ ...q, items: q.items.filter((i) => i.career !== career) });

/** Tiempo máximo que puede durar una sesión de crisis (para validar `from`). */
export const CRISIS_MAX_MS = 2 * H;
