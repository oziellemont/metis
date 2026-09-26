import type { Direction, Result, ScorecardItem, Targets, Traffic } from "./types";

/**
 * Semáforo METIS.
 * Incremental (up):   real ≥ sob → outstanding · ≥ sat → satisfactory · ≥ min → minimum · else below
 * Decremental (down): la misma lógica invertida (real ≤ meta).
 */
export function traffic(value: number | null | undefined, t: Targets, dir: Direction): Traffic {
  if (value === null || value === undefined || Number.isNaN(value)) return "pending";
  const ge = (a: number, b: number) => (dir === "up" ? a >= b : a <= b);
  if (ge(value, t.out)) return "outstanding";
  if (ge(value, t.sat)) return "satisfactory";
  if (ge(value, t.min)) return "minimum";
  return "below";
}

/**
 * Cumplimiento de un elemento como % contra la meta satisfactoria (100% = satisfactorio),
 * acotado entre 0 y 120 para no premiar desproporcionadamente.
 */
export function attainment(value: number | null | undefined, t: Targets, dir: Direction): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  let pct: number;
  if (dir === "up") {
    pct = t.sat === 0 ? (value >= 0 ? 100 : 0) : (value / t.sat) * 100;
  } else {
    // decremental: si real == sat → 100; si real es menor (mejor) sube; si mayor (peor) baja
    pct = value === 0 ? 120 : (t.sat / value) * 100;
  }
  return Math.max(0, Math.min(120, Math.round(pct * 10) / 10));
}

/** Peso efectivo de un item para un mes (usa el mensual si existe). */
export function weightFor(item: ScorecardItem, month: number): number {
  const w = item.monthlyWeights?.[month];
  return typeof w === "number" ? w : item.weight;
}

/** Suma de ponderaciones de un scorecard para un mes. Debe ser exactamente 100. */
export function totalWeight(items: ScorecardItem[], month: number): number {
  return Math.round(items.reduce((s, i) => s + weightFor(i, month), 0) * 100) / 100;
}

export function isWeightValid(items: ScorecardItem[], month: number): boolean {
  return Math.abs(totalWeight(items, month) - 100) < 0.001;
}

/** Valida los 12 meses; regresa los meses que no suman 100. */
export function invalidMonths(items: ScorecardItem[]): number[] {
  const bad: number[] = [];
  for (let m = 1; m <= 12; m++) if (!isWeightValid(items, m)) bad.push(m);
  return bad;
}

export interface ItemEvaluation {
  item: ScorecardItem;
  value: number | null;
  traffic: Traffic;
  attainment: number | null;
  weight: number;
}

/**
 * Cumplimiento ponderado del scorecard en un mes.
 * Sólo cuenta los elementos con dato; re-normaliza el peso entre los cargados para
 * que un dato pendiente no castigue a la persona antes del cierre.
 */
export function weightedAttainment(
  evals: ItemEvaluation[],
): { value: number | null; loaded: number; total: number } {
  const loaded = evals.filter((e) => e.attainment !== null);
  const wSum = loaded.reduce((s, e) => s + e.weight, 0);
  if (loaded.length === 0 || wSum === 0) return { value: null, loaded: 0, total: evals.length };
  const v = loaded.reduce((s, e) => s + (e.attainment as number) * (e.weight / wSum), 0);
  return { value: Math.round(v * 10) / 10, loaded: loaded.length, total: evals.length };
}

/** Busca el resultado de un elemento-alcance para un periodo. */
export function findResult(results: Result[], elementScopeId: string, year: number, month: number) {
  return results.find((r) => r.elementScopeId === elementScopeId && r.year === year && r.month === month) ?? null;
}

/**
 * Propagación DR → CV: al guardar un resultado, todos los items (de cualquier scorecard)
 * que apunten al mismo elementScopeId lo leen. Esta función devuelve los ids de los items
 * afectados; la persistencia real está en el store.
 */
export function affectedItems(items: ScorecardItem[], elementScopeId: string): ScorecardItem[] {
  return items.filter((i) => i.elementScopeId === elementScopeId);
}

export const TRAFFIC_ORDER: Traffic[] = ["outstanding", "satisfactory", "minimum", "below", "pending"];
