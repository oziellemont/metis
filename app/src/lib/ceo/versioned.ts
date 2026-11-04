/**
 * mêtis CEO · contenido versionado (reglas v8+).
 *
 * Un asunto puede tener revisiones por versión de reglas (`Item.revisions`): un periodo jugado con esa versión o
 * posterior lo ve con la revisión encima; un periodo anterior lo sigue viendo exactamente como lo jugó. Así se
 * corrigen causalidad, puntajes o aprendizajes sin recalificar ninguna partida.
 *
 * Funciones puras, sin dependencias del motor.
 */
import type { Item, Kpis, KpiKey, Option } from "./types";

/** ¿El asunto existe en periodos de esta versión? (`since` ≤ v < `until`). */
export const presentIn = (it: Pick<Item, "since" | "until">, v: number): boolean =>
  !(it.since && v < it.since) && !(it.until && v >= it.until);

/** El asunto tal como se presenta en periodos de esta versión (revisiones aplicadas en orden). */
export function itemAtVersion(it: Item, v: number): Item {
  if (!it.revisions?.length) return it;
  let out = it;
  for (const r of it.revisions) if (v >= r.since) out = { ...out, ...r.patch };
  return out;
}

const KEYS: KpiKey[] = ["caja", "margen", "equipo", "clientes", "consejo"];

/** Suma de dos efectos parciales (para combinar lo inmediato con la respuesta de un acuerdo). */
export function addEffects(a: Partial<Kpis>, b: Partial<Kpis> | undefined): Partial<Kpis> {
  if (!b) return a;
  const out: Partial<Kpis> = { ...a };
  for (const k of KEYS) if (b[k]) out[k] = (out[k] ?? 0) + (b[k] ?? 0);
  return out;
}

/** ¿La contraparte acepta? Azar estable del asunto en [1 − p, 1) (el mismo azar que sus consecuencias inciertas). */
export const acceptsWith = (roll: number, o: Pick<Option, "pending">): boolean => !!o.pending && roll >= 1 - o.pending.p;
