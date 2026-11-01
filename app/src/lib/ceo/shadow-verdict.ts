/**
 * mêtis CEO · 0.6 Veredicto SOMBRA.
 *
 * Corre en paralelo al veredicto actual (`verdictOf`) y NO lo reemplaza: nadie lo ve, no se guarda en la
 * carrera, no cambia XP, ascensos ni partidas doradas. Sirve para medir, sobre muchas partidas
 * reproducibles, qué pasaría con una regla multidimensional antes de someterla a aprobación editorial.
 *
 * Propuesta v0 (umbrales configurables, NO validados):
 *  1. Límites críticos no compensables: caja en zona de insolvencia, consejo que ya no te sostiene,
 *     o haber elegido una opción que cruza una línea roja (seguridad, fraude, represalia, ocultar al cliente).
 *  2. Objetivos de temporada: dos indicadores clave por empresa, según su historia.
 *  3. Desempeño integral: salud promedio sobre la línea, en lugar de exigir los cinco por separado.
 *  4. Dejar vencer asuntos no reprueba por sí solo: con pocas respuestas el resultado es «sin evidencia suficiente».
 */
import { KPI_KEYS, entries, healthOf, kpis, nowOf, rulesFor, verdictOf } from "./engine";
import { isRedLine } from "./editorial";
import type { CeoState, KpiKey, Kpis } from "./types";

export const SHADOW_VERDICT_VERSION = 0;

export const SHADOW_RULES = Object.freeze({
  /** Caja por debajo de esto = insolvencia efectiva. */
  insolvency: 30,
  /** Consejo por debajo de esto = el consejo ya no te sostiene. */
  boardLost: 30,
  /** Salud integral mínima, relativa a la línea de aprobación del nivel. */
  healthMargin: 0,
  /** Holgura de los objetivos de temporada frente a la línea del nivel. */
  objectiveMargin: 0,
  /** Por debajo de esta proporción de respuestas no hay evidencia suficiente para un veredicto. */
  minEvidence: 0.5,
});

/** Objetivos de temporada por empresa (propuesta editorial: lo que el consejo te pidió al contratarte). */
export const SEASON_OBJECTIVES: Record<string, { kpis: KpiKey[]; text: string }> = {
  cumbre: { kpis: ["margen", "equipo"], text: "Recuperar margen sin romper la planta." },
  forja: { kpis: ["clientes", "caja"], text: "Cumplir a la armadora y generar caja para el fondo." },
  brasa: { kpis: ["margen", "clientes"], text: "Defender el margen frente a las apps sin perder clientes." },
  kubit: { kpis: ["caja", "clientes"], text: "Alargar la caja hasta la siguiente ronda sin perder a los clientes que quieren el producto." },
};

export type ShadowOutcome = "aprobado" | "reprobado" | "sin_evidencia";
export type ShadowReason = "insolvencia" | "consejo_perdido" | "linea_roja" | "objetivo" | "salud";
export interface ShadowVerdict {
  version: number;
  outcome: ShadowOutcome;
  passed: boolean;
  reasons: ShadowReason[];
  health: number;
  line: number;
  objectives: { kpi: KpiKey; value: number; ok: boolean }[];
  redLines: string[];
  answered: number;
  /** El veredicto actual para comparar (no se modifica). */
  current: { passed: boolean; allApproved: boolean; answeredOk: boolean };
}

export function shadowVerdictOf(s: CeoState, now = nowOf(s)): ShadowVerdict {
  const k: Kpis = kpis(s, now);
  const cur = verdictOf(s, now);
  const line = rulesFor(s).passLine;
  const es = entries(s, now);
  const redLines = es
    .filter((e) => e.status === "decidido" && e.decision && isRedLine(e.item.id, e.decision.option))
    .map((e) => `${e.item.id}/${e.decision!.option}`);
  const obj = SEASON_OBJECTIVES[s.company] ?? { kpis: [] as KpiKey[] };
  const objectives = obj.kpis.map((x) => ({ kpi: x, value: k[x], ok: k[x] >= line + SHADOW_RULES.objectiveMargin }));
  const health = healthOf(k);

  const reasons: ShadowReason[] = [];
  if (k.caja < SHADOW_RULES.insolvency) reasons.push("insolvencia");
  if (k.consejo < SHADOW_RULES.boardLost) reasons.push("consejo_perdido");
  if (redLines.length) reasons.push("linea_roja");
  if (objectives.some((o) => !o.ok)) reasons.push("objetivo");
  if (health < line + SHADOW_RULES.healthMargin) reasons.push("salud");

  const critical = reasons.some((r) => r === "insolvencia" || r === "consejo_perdido" || r === "linea_roja");
  const outcome: ShadowOutcome = critical || reasons.length ? "reprobado" : cur.answered < SHADOW_RULES.minEvidence ? "sin_evidencia" : "aprobado";
  return {
    version: SHADOW_VERDICT_VERSION, outcome, passed: outcome === "aprobado", reasons, health, line, objectives, redLines,
    answered: cur.answered, current: { passed: cur.passed, allApproved: cur.allApproved, answeredOk: cur.answeredOk },
  };
}

/** Comparación entre ambos veredictos sobre un conjunto de partidas. */
export interface ShadowComparison {
  games: number;
  current: { passed: number };
  shadow: Record<ShadowOutcome, number>;
  /** Filas = actual (aprobó/reprobó); columnas = sombra. */
  matrix: Record<"aprobo" | "reprobo", Record<ShadowOutcome, number>>;
  reasons: Record<ShadowReason, number>;
  agreement: number;
}
export function compare(verdicts: ShadowVerdict[]): ShadowComparison {
  const zero = (): Record<ShadowOutcome, number> => ({ aprobado: 0, reprobado: 0, sin_evidencia: 0 });
  const out: ShadowComparison = {
    games: verdicts.length, current: { passed: 0 }, shadow: zero(), matrix: { aprobo: zero(), reprobo: zero() },
    reasons: { insolvencia: 0, consejo_perdido: 0, linea_roja: 0, objetivo: 0, salud: 0 }, agreement: 0,
  };
  let same = 0;
  for (const v of verdicts) {
    if (v.current.passed) out.current.passed++;
    out.shadow[v.outcome]++;
    out.matrix[v.current.passed ? "aprobo" : "reprobo"][v.outcome]++;
    for (const r of v.reasons) out.reasons[r]++;
    if (v.current.passed === v.passed) same++;
  }
  out.agreement = verdicts.length ? Math.round((same / verdicts.length) * 1000) / 1000 : 0;
  return out;
}

export { KPI_KEYS };
