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
import { adaptiveOrder } from "./learning";
import { TEMPLATES } from "./families";
import type { GrowthState } from "./types";
import type { KpiKey, Kpis } from "../types";
import { isSteelCaseId, isSteelTemplate, steelAt, steelBridge, steelDecide, steelPending } from "./steel/session";
import { isRetailCaseId, isRetailTemplate, retailAt, retailBridge, retailDecide, retailPending } from "./retail/session";
import { endWorld, hitOf, isWorldCaseId, openWorld, sanitizeWorld, type WorldOpenInput, type WorldPrefs } from "../world/episodes";
import { REASONABLE, REASONABLE_V2, referenceOption } from "../world/cases";
import { exportContractOf } from "../world/econ";
import type { ReplayEpisode, WorldEpisode, Zone } from "../world/types";

/** Plantillas con motor contable propio (acería v2 y cadena de conveniencia): registro con decisiones por caso del selector. */
const isOwnEngine = (id: string) => isSteelTemplate(id) || isRetailTemplate(id);

export const GROWTH_LOG_VERSION = 1;

export { GROWTH_ARCHETYPE, GROWTH_COMBOS, growthTemplateFor } from "./combos";

export interface GrowthLog {
  v: number;
  templateId: string;
  seed: string;
  decisions: Decision[];
  /** World Events: episodios externos congelados (solo motores propios con exposición). */
  world?: WorldEpisode[];
}

export function newGrowthLog(templateId: string, seed: string): GrowthLog | null {
  return TEMPLATES[templateId] || isOwnEngine(templateId) ? { v: GROWTH_LOG_VERSION, templateId, seed: String(seed).slice(0, 80), decisions: [] } : null;
}

export function sanitizeGrowthLog(raw: unknown): GrowthLog | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.templateId !== "string" || !(TEMPLATES[r.templateId] || isOwnEngine(r.templateId)) || typeof r.seed !== "string" || !r.seed) return null;
  const decisions: Decision[] = [];
  let lastDay = -1;
  const steel = isSteelTemplate(r.templateId), retail = isRetailTemplate(r.templateId), own = steel || retail;
  for (const d of Array.isArray(r.decisions) ? r.decisions : []) {
    const x = d as Record<string, unknown>;
    if (!x || typeof x.caseId !== "string" || !(steel ? isSteelCaseId(x.caseId) : retail ? isRetailCaseId(x.caseId) : caseById(x.caseId)) || typeof x.optionId !== "string" || typeof x.key !== "string") continue;
    if (typeof x.day !== "number" || !Number.isInteger(x.day) || x.day < 0 || x.day < lastDay) continue;
    decisions.push({ caseId: x.caseId, key: x.key, optionId: x.optionId, day: x.day, ...(own && x.source === "ia" ? { source: "ia" as const } : {}) });
    lastDay = x.day;
  }
  const out: GrowthLog = { v: GROWTH_LOG_VERSION, templateId: r.templateId, seed: r.seed.slice(0, 80), decisions };
  const world = own ? sanitizeWorld(r.world, r.templateId) : undefined;
  if (world?.length) out.world = world;
  return out;
}

// ───────────────────────────────────────────── reconstrucción (con caché incremental)
const logKey = (l: GrowthLog) => `${l.templateId}|${l.seed}|${l.decisions.map((d) => `${d.key}:${d.optionId}@${d.day}`).join(",")}`;
const CACHE = new Map<string, { day: number; g: GrowthState; rejected: number }>();
const CACHE_MAX = 6;

export interface Rebuilt { state: GrowthState; rejected: number }

/** Estado del motor en el día `day` para este registro. Las decisiones que ya no proceden se descartan (y se cuentan). */
export function growthAt(log: GrowthLog, day: number): Rebuilt {
  if (isSteelTemplate(log.templateId)) throw new Error("La acería v2 se reconstruye con steelOf (growth/steel/session.ts).");
  if (isRetailTemplate(log.templateId)) throw new Error("La cadena de conveniencia se reconstruye con retailOf (growth/retail/session.ts).");
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
  if (isOwnEngine(log.templateId)) return {};
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
  if (isOwnEngine(log.templateId)) return [];
  const g = growthAt(log, day).state;
  // Capa adaptativa: mismo conjunto de casos, en el orden que más le sirve al jugador (learning.ts).
  return adaptiveOrder(availableCases(g, log.decisions), log.decisions).map((c) => ({ case: c, options: optionsOf(g, c) }));
}

/** Decide un caso hoy. Devuelve el registro nuevo, o el mismo si no procede (con la razón). */
export function decideGrowth(log: GrowthLog, day: number, caseId: string, optionId: string): { log: GrowthLog; ok: boolean; reason?: string } {
  if (isSteelTemplate(log.templateId)) {
    const r = steelDecide(log.templateId, log.seed, log.decisions, day, caseId, optionId, "motor", log.world);
    return r.ok ? { log: { ...log, decisions: r.decisions }, ok: true } : { log, ok: false, reason: r.reason };
  }
  if (isRetailTemplate(log.templateId)) {
    const r = retailDecide(log.templateId, log.seed, log.decisions, day, caseId, optionId, "motor", log.world);
    return r.ok ? { log: { ...log, decisions: r.decisions }, ok: true } : { log, ok: false, reason: r.reason };
  }
  if (log.decisions.length && day < log.decisions.at(-1)!.day) return { log, ok: false, reason: "No se puede decidir en el pasado." };
  const g = growthAt(log, day).state;
  const r = decide(g, caseId, optionId, log.decisions);
  if (!r.ok) return { log, ok: false, reason: r.reason };
  return { log: { ...log, decisions: [...log.decisions, r.decision!] }, ok: true };
}

// ───────────────────────────────────────────────────────── acería v2 (motor propio) y funciones comunes
/** ¿El registro es de una acería v2? (motor contable propio en growth/steel). */
export const isSteelLog = (log: GrowthLog | undefined | null): boolean => !!log && isSteelTemplate(log.templateId);
/** Estado de la acería v2 hoy (solo para registros de acería v2). */
export const steelOf = (log: GrowthLog, day: number) => steelAt(log.templateId, log.seed, log.decisions, day, log.world);
/** Caso de la acería v2 que espera decisión hoy, o null. */
export const steelPendingOf = (log: GrowthLog, day: number) => steelPending(log.templateId, log.seed, log.decisions, day, undefined, log.world);
/** ¿El registro es de la cadena de conveniencia (Retail v2, motor contable propio en growth/retail)? */
export const isRetailLog = (log: GrowthLog | undefined | null): boolean => !!log && isRetailTemplate(log.templateId);
/** Estado de la cadena de conveniencia hoy (solo para registros de Retail v2). */
export const retailOf = (log: GrowthLog, day: number) => retailAt(log.templateId, log.seed, log.decisions, day, log.world);
/** Caso de la cadena de conveniencia que espera decisión hoy, o null. */
export const retailPendingOf = (log: GrowthLog, day: number) => retailPending(log.templateId, log.seed, log.decisions, day, undefined, log.world);
/** Cuántas decisiones esperan hoy (cualquier motor). */
export function growthPendingCount(log: GrowthLog, day: number): number {
  if (isRetailLog(log)) return retailPendingOf(log, day) ? 1 : 0;
  return isSteelLog(log) ? (steelPendingOf(log, day) ? 1 : 0) : pendingGrowth(log, day).length;
}
/** Puntos de los 5 indicadores (cualquier motor). Sin castigo por haber estado expuesto a un acontecimiento externo. */
export function growthDelta(log: GrowthLog, day: number): Kpis {
  if (isRetailLog(log) || isSteelLog(log)) return ownDelta(log, day);
  return growthBridge(log, day).delta;
}

// ───────────────────────────────────────────────────────── World Events · justicia en los indicadores
const bridgeOf = (log: GrowthLog, day: number): Kpis => (isRetailLog(log) ? retailBridge(retailOf(log, day).state).delta : steelBridge(steelOf(log, day).state).delta);
/**
 * Lo que el acontecimiento le habría hecho a cualquiera con una preparación razonable (impacto externo) se separa de
 * lo que se debe a la decisión del jugador:
 *   indicadores = real − (con acontecimiento y preparación razonable − sin acontecimiento).
 * Con una opción razonable el resultado es el mismo que sin acontecimiento (ni premio ni castigo por la exposición);
 * con una opción arriesgada cuenta la diferencia contra el protocolo estándar.
 */
export function ownDelta(log: GrowthLog, day: number): Kpis {
  const real = bridgeOf(log, day);
  if (!log.world?.length) return real;
  const ext = externalOf(log, day);
  const out = { ...real };
  for (const k of Object.keys(out) as KpiKey[]) out[k] = Math.round(Math.max(-30, Math.min(30, real[k] - ext[k])));
  return out;
}
/**
 * Efecto externo (puntos por indicador).
 * Reglas v1 (episodios sin `rv`): el acontecimiento con preparación razonable, exactamente como antes.
 * Reglas v2 (`rv` ≥ 2, clima y arancel de EE. UU.): sólo la parte inevitable cuenta como externa; lo que el jugador
 * mitiga, lo que le cuesta y las consecuencias futuras son suyas. Si la amenaza no llegó, una preparación razonable
 * no se castiga (su costo se trata como externo, igual que en v1).
 */
export function externalOf(log: GrowthLog, day: number): Kpis {
  const zero = { caja: 0, margen: 0, equipo: 0, clientes: 0, consejo: 0 } as Kpis;
  if (!log.world?.length) return zero;
  const inev = new Set(log.world.filter(usesInevitable).map((e) => e.id));
  const fair = log.decisions.flatMap((d) => {
    if (!isWorldCaseId(d.caseId)) return [d];
    const ep = log.world!.find((e) => `w:${e.id}` === d.caseId);
    if (!ep) return [d];
    if (inev.has(ep.id)) return [];
    const ok = ((ep.rv ?? 1) >= 2 ? REASONABLE_V2 : REASONABLE).has(d.optionId);
    return [ok ? d : { ...d, optionId: referenceOption(ep) }];
  });
  const world = inev.size ? log.world.map((e) => (inev.has(e.id) ? ({ ...e, only: "inevitable" } as ReplayEpisode) : e)) : log.world;
  const none: GrowthLog = { ...log, decisions: log.decisions.filter((d) => !isWorldCaseId(d.caseId)), world: undefined };
  const withRef = bridgeOf({ ...log, decisions: fair, world }, day), without = bridgeOf(none, day);
  for (const k of Object.keys(zero) as KpiKey[]) zero[k] = withRef[k] - without[k];
  return zero;
}
/** Episodios v2 que llegaron con fuerza y cuyas reglas separan lo inevitable de lo evitable. */
export const usesInevitable = (ep: WorldEpisode): boolean => (ep.rv ?? 1) >= 2 && hitOf(ep) && (!ep.facts || ep.facts.rule === "us_232_acero");

/** Abre (o actualiza antes de decidir) un episodio externo en el registro. null si no procede. */
export function openWorldLog(log: GrowthLog, inp: WorldOpenInput, day: number, at: number, prefs: WorldPrefs): GrowthLog | null {
  if (!isOwnEngine(log.templateId)) return null;
  // Arancel de EE. UU. a la exportación: solo si la partida tiene hoy un contrato de exportación vigente (quien no
  // exporta no recibe el caso, aunque su plantilla podría exportar).
  if (inp.facts?.rule === "us_232_acero" && (!isSteelLog(log) || !exportContractOf(steelOf(log, Math.floor(day)).state))) return null;
  const world = openWorld(log, inp, day, at, prefs);
  return world ? { ...log, world } : null;
}
/** Cierra un pronóstico real con lo observado. null si no procede. */
export function endWorldLog(log: GrowthLog, id: string, observed: Record<string, Zone>, day: number, at: number): GrowthLog | null {
  if (!isOwnEngine(log.templateId)) return null;
  const world = endWorld(log, id, observed, day, at);
  return world ? { ...log, world } : null;
}
