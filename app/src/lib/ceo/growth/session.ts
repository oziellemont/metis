/**
 * mêtis CEO · Growth Engine · la empresa emergente dentro de la partida (fase 2).
 *
 * Lo único que se guarda en la partida es el REGISTRO (`GrowthLog`): plantilla, semilla y decisiones con su día.
 * El estado del motor se reconstruye siempre igual: crear la empresa, avanzar hasta el día de cada decisión,
 * decidir, y avanzar hasta hoy. Así no hay dos fuentes de verdad y el diario de jugadas reproduce la partida.
 *
 * El día del motor lo pone la partida (engine.ts · growthDayOf): 30 días por periodo cerrado y la parte
 * proporcional del periodo en curso, que ya respeta pausas y vacaciones (seasonDay). Sin jugar, no avanza.
 */
import { advance, createCompany } from "./engine";
import { availableCases, decide, optionsOf, type Decision, type OptionView } from "./chains";
import { caseById, type GCase } from "./cases";
import { kpiBridge, type Bridge } from "./bridge";
import { TEMPLATES } from "./families";
import type { GrowthState } from "./types";
import type { KpiKey } from "../types";

export const GROWTH_LOG_VERSION = 1;

export { GROWTH_ARCHETYPE, GROWTH_COMBOS, growthTemplateFor } from "./combos";

export interface GrowthLog {
  v: number;
  templateId: string;
  seed: string;
  decisions: Decision[];
}

export function newGrowthLog(templateId: string, seed: string): GrowthLog | null {
  return TEMPLATES[templateId] ? { v: GROWTH_LOG_VERSION, templateId, seed: String(seed).slice(0, 80), decisions: [] } : null;
}

export function sanitizeGrowthLog(raw: unknown): GrowthLog | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.templateId !== "string" || !TEMPLATES[r.templateId] || typeof r.seed !== "string" || !r.seed) return null;
  const decisions: Decision[] = [];
  let lastDay = -1;
  for (const d of Array.isArray(r.decisions) ? r.decisions : []) {
    const x = d as Record<string, unknown>;
    if (!x || typeof x.caseId !== "string" || !caseById(x.caseId) || typeof x.optionId !== "string" || typeof x.key !== "string") continue;
    if (typeof x.day !== "number" || !Number.isInteger(x.day) || x.day < 0 || x.day < lastDay) continue;
    decisions.push({ caseId: x.caseId, key: x.key, optionId: x.optionId, day: x.day });
    lastDay = x.day;
  }
  return { v: GROWTH_LOG_VERSION, templateId: r.templateId, seed: r.seed.slice(0, 80), decisions };
}

// ───────────────────────────────────────────── reconstrucción (con caché incremental)
const logKey = (l: GrowthLog) => `${l.templateId}|${l.seed}|${l.decisions.map((d) => `${d.key}:${d.optionId}@${d.day}`).join(",")}`;
const CACHE = new Map<string, { day: number; g: GrowthState; rejected: number }>();
const CACHE_MAX = 6;

export interface Rebuilt { state: GrowthState; rejected: number }

/** Estado del motor en el día `day` para este registro. Las decisiones que ya no proceden se descartan (y se cuentan). */
export function growthAt(log: GrowthLog, day: number): Rebuilt {
  const key = logKey(log);
  const target = Math.max(0, Math.floor(day));
  const hit = CACHE.get(key);
  const lastDecision = log.decisions.at(-1)?.day ?? -1;
  if (hit && hit.day === target) return { state: hit.g, rejected: hit.rejected };
  let g: GrowthState, rejected = 0;
  if (hit && hit.day < target && hit.day >= lastDecision) {
    g = advance(hit.g, target - hit.day);
    rejected = hit.rejected;
  } else {
    g = createCompany(log.templateId, log.seed);
    const done: Decision[] = [];
    for (const d of log.decisions) {
      if (d.day > target) break;
      if (d.day > g.day) g = advance(g, d.day - g.day);
      const r = decide(g, d.caseId, d.optionId, done);
      if (!r.ok) { rejected++; continue; }
      g = r.state;
      done.push(r.decision!);
    }
    if (target > g.day) g = advance(g, target - g.day);
  }
  CACHE.delete(key);
  CACHE.set(key, { day: target, g, rejected });
  while (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
  return { state: g, rejected };
}

/** Efectos editoriales acumulados de las decisiones (solo Equipo, Clientes y Consejo). */
export function editorialOf(log: GrowthLog): Partial<Record<KpiKey, number>> {
  const out: Partial<Record<KpiKey, number>> = {};
  for (const d of log.decisions) {
    const o = caseById(d.caseId)?.options.find((x) => x.id === d.optionId);
    for (const [k, v] of Object.entries(o?.effects ?? {}) as [KpiKey, number][]) if (k !== "caja" && k !== "margen") out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

export function growthBridge(log: GrowthLog, day: number): Bridge {
  return kpiBridge(growthAt(log, day).state, editorialOf(log));
}

/** Casos de crecimiento que hoy esperan decisión, con sus opciones calculadas por el motor. */
export function pendingGrowth(log: GrowthLog, day: number): { case: GCase; options: OptionView[] }[] {
  const g = growthAt(log, day).state;
  return availableCases(g, log.decisions).map((c) => ({ case: c, options: optionsOf(g, c) }));
}

/** Decide un caso hoy. Devuelve el registro nuevo, o el mismo si no procede (con la razón). */
export function decideGrowth(log: GrowthLog, day: number, caseId: string, optionId: string): { log: GrowthLog; ok: boolean; reason?: string } {
  if (log.decisions.length && day < log.decisions.at(-1)!.day) return { log, ok: false, reason: "No se puede decidir en el pasado." };
  const g = growthAt(log, day).state;
  const r = decide(g, caseId, optionId, log.decisions);
  if (!r.ok) return { log, ok: false, reason: r.reason };
  return { log: { ...log, decisions: [...log.decisions, r.decision!] }, ok: true };
}
