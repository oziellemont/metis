/**
 * mêtis CEO · Veredicto CANDIDATO v1 (rediseño «criterio vs. resultados»). NO está activo.
 *
 * El veredicto vigente (`verdictOf`) exige los cinco indicadores ≥ línea: un solo indicador en 49 reprueba toda la
 * temporada, aunque el resto esté en 90 y la empresa esté sana. Y no distingue entre «la caja está en zona de
 * insolvencia» y «el equipo quedó en 48». Esta propuesta separa lo no negociable de lo compensable:
 *
 *  1. Límites críticos (no compensables): caja en insolvencia, consejo que ya no te sostiene, línea roja cruzada.
 *  2. Objetivos de temporada: los dos indicadores que el consejo te encargó al contratarte deben cerrar ≥ línea.
 *  3. Piso: ningún indicador muy por debajo de la línea (no se vale sacrificar uno por completo).
 *  4. Salud integral: el promedio de los cinco sobre la línea con holgura.
 *
 * Solo mide el RESULTADO DEL NEGOCIO (eje B). El criterio (eje A) se reporta por separado (`judgment.ts`).
 * Para activarla haría falta una versión nueva de reglas (V5) con aprobación editorial; las publicadas no se tocan.
 */
import { KPI_KEYS, KPI_LABEL, entries, healthOf, kpis, rulesFor } from "./engine";
import { isRedLine } from "./editorial";
import { SEASON_OBJECTIVES } from "./shadow-verdict";
import type { CeoState, KpiKey, Kpis } from "./types";

export const CANDIDATE_VERDICT = Object.freeze({
  version: 1,
  /** Caja por debajo de esto = insolvencia. */
  insolvency: 40,
  /** Consejo por debajo de esto = te retiran el apoyo. */
  boardLost: 40,
  /** Piso de cualquier indicador, relativo a la línea. */
  floorBelowLine: 10,
  /** Salud mínima, relativa a la línea (promedio de los cinco). */
  healthAboveLine: 12,
});

export type CandidateReason = "insolvencia" | "consejo_perdido" | "linea_roja" | "objetivo" | "piso" | "salud";
export interface CandidateVerdict {
  version: number;
  passed: boolean;
  reasons: CandidateReason[];
  /** Explicación en lenguaje llano, una por razón. */
  why: string[];
  line: number;
  health: number;
  objectives: { kpi: KpiKey; value: number; ok: boolean }[];
}

export function candidateVerdictOfKpis(k: Kpis, company: string, line: number, redLines: string[] = []): CandidateVerdict {
  const C = CANDIDATE_VERDICT;
  const reasons: CandidateReason[] = [];
  const why: string[] = [];
  if (k.caja < C.insolvency) { reasons.push("insolvencia"); why.push(`La caja cerró en ${k.caja}: zona de insolvencia (menos de ${C.insolvency}). Ningún otro indicador compensa quedarse sin dinero.`); }
  if (k.consejo < C.boardLost) { reasons.push("consejo_perdido"); why.push(`El consejo cerró en ${k.consejo}: ya no te sostiene (menos de ${C.boardLost}).`); }
  if (redLines.length) { reasons.push("linea_roja"); why.push(`Cruzaste una línea roja (${redLines.join(", ")}): seguridad, fraude, represalia u ocultar un riesgo al cliente.`); }
  const objs = (SEASON_OBJECTIVES[company]?.kpis ?? []).map((x) => ({ kpi: x, value: k[x], ok: k[x] >= line }));
  for (const o of objs.filter((x) => !x.ok)) why.push(`${KPI_LABEL[o.kpi]} era uno de tus dos objetivos de temporada y cerró en ${o.value} (línea ${line}).`);
  if (objs.some((o) => !o.ok)) reasons.push("objetivo");
  const floor = line - C.floorBelowLine;
  const under = KPI_KEYS.filter((x) => k[x] < floor);
  if (under.length) { reasons.push("piso"); why.push(`${under.map((x) => `${KPI_LABEL[x]} (${k[x]})`).join(", ")} quedó por debajo del piso de ${floor}: sacrificaste un indicador por completo.`); }
  const health = healthOf(k);
  if (health < line + C.healthAboveLine) { reasons.push("salud"); why.push(`La salud promedio de la empresa cerró en ${health}; se pide ${line + C.healthAboveLine} o más.`); }
  return { version: C.version, passed: reasons.length === 0, reasons, why, line, health, objectives: objs };
}

export function candidateVerdictOf(s: CeoState, now: number): CandidateVerdict {
  const red = entries(s, now).filter((e) => e.status === "decidido" && e.decision && isRedLine(e.item.id, e.decision.option)).map((e) => `${e.item.id}/${e.decision!.option}`);
  return candidateVerdictOfKpis(kpis(s, now), s.company, rulesFor(s).passLine, red);
}
