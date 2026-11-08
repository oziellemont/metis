/**
 * mêtis CEO · Growth Engine · aprendizaje de cada decisión e inteligencia adaptativa.
 *
 * 1. `growthLesson`: después de decidir, el jugador ve qué ganó, qué sacrificó, qué otro camino había y el principio
 *    que enseña el caso. Todo sale del motor (impacto en caja, costo mensual, personas, sedes) y del caso (puntaje de
 *    cada opción, efectos editoriales); nada se inventa aquí.
 * 2. `competencyProfile`: desempeño por competencia (personas, finanzas, operación…) con el puntaje de las opciones
 *    elegidas. Lo usa la capa adaptativa y puede alimentar el reporte.
 * 3. `adaptiveOrder`: ordena los casos que hoy pueden llegar. Primero lo urgente (liquidez), luego lo que entrena la
 *    competencia más débil del jugador; si va bien, los casos de mayor presión. Determinista: mismo estado y mismas
 *    decisiones, mismo orden. Solo ordena: nunca crea ni quita un caso (las precondiciones las decide el motor).
 */
import { caseById, tagsOf, type CaseTags, type GCase } from "./cases";
import type { Decision } from "./chains";
import type { Impact } from "./ops";
import { money } from "./ops";
import type { GrowthState } from "./types";
import type { Area, KpiKey } from "../types";

export const AREA_LABEL: Readonly<Record<Area, string>> = Object.freeze({
  personas: "Personas", estrategia: "Estrategia", finanzas: "Finanzas", clientes: "Clientes", operacion: "Operación",
  cultura: "Cultura", etica: "Ética", comunicacion: "Comunicación", negociacion: "Negociación", alineacion: "Alineación",
});
export const FUNCION_LABEL: Readonly<Record<CaseTags["funcion"], string>> = Object.freeze({
  direccion_general: "Dirección general", finanzas: "Finanzas", operaciones: "Operaciones", personas: "Personas", comercial: "Comercial",
});
export const INDUSTRY_LABEL: Readonly<Record<string, string>> = Object.freeze({
  todas: "Todas las industrias", restaurante: "Restaurantes", manufactura: "Manufactura", estampado: "Manufactura · estampado", aceria: "Manufactura · acería",
});
const KPI_LABEL: Partial<Record<KpiKey, string>> = { equipo: "Equipo", clientes: "Clientes", consejo: "Consejo" };

export interface GrowthLesson {
  /** Qué tan sólida fue la decisión: «solida» (puntaje máximo), «aceptable» o «riesgosa». */
  verdict: "solida" | "aceptable" | "riesgosa";
  gained: string[];
  sacrificed: string[];
  /** La mejor alternativa que no se eligió (si la había) y lo que habría cambiado. */
  otherPath: string | null;
  principle: string;
  tags: { industria: string; funcion: string; competencias: string[] };
}

/** Lo que ganas y lo que sacrificas con una opción: impacto del motor + efectos editoriales. */
function ledgerOf(i: Impact | null, effects: Partial<Record<KpiKey, number>>): { gained: string[]; sacrificed: string[] } {
  const gained: string[] = [], sacrificed: string[] = [];
  if (i) {
    if (i.now >= 100_00) gained.push(`${money(i.now)} más en caja en las próximas semanas`);
    else if (i.now <= -100_00) sacrificed.push(`${money(-i.now)} de caja en las próximas semanas`);
    if (i.monthly >= 100_00) sacrificed.push(`${money(i.monthly)} más de costo fijo al mes`);
    else if (i.monthly <= -100_00) gained.push(`${money(-i.monthly)} menos de costo fijo al mes`);
    if (i.people > 0) gained.push(`${i.people} ${i.people === 1 ? "persona más" : "personas más"} en la operación`);
    else if (i.people < 0) sacrificed.push(`${-i.people} ${i.people === -1 ? "persona menos" : "personas menos"}`);
    if (i.sites > 0) gained.push(`${i.sites} sede nueva en camino`);
  }
  for (const [k, v] of Object.entries(effects) as [KpiKey, number][]) {
    const l = KPI_LABEL[k];
    if (!l || !v) continue;
    (v > 0 ? gained : sacrificed).push(`${l} ${v > 0 ? "+" : ""}${v}`);
  }
  return { gained, sacrificed };
}

/**
 * Aprendizaje de una decisión. `impactOf(optionId)` es el impacto calculado por el motor ANTES de decidir (ops.ts);
 * se recibe como función para no recalcular lo que la pantalla ya tiene.
 */
export function growthLesson(g: GrowthState, c: GCase, optionId: string, impactOf: (optionId: string) => Impact | null): GrowthLesson | null {
  const o = c.options.find((x) => x.id === optionId);
  if (!o) return null;
  const mine = ledgerOf(impactOf(o.id), o.effects ?? {});
  const avail = (x: GCase["options"][number]) => (x.available ? x.available(g).ok : true);
  const best = c.options.filter((x) => x.id !== o.id && avail(x)).sort((a, b) => b.score - a.score)[0];
  const text = (x: GCase["options"][number]) => (x.textOf ? x.textOf(g) : x.text);
  let otherPath: string | null = null;
  if (best && (best.score > o.score || o.score < 3)) {
    const alt = ledgerOf(impactOf(best.id), best.effects ?? {});
    const what = [...alt.gained.slice(0, 2), ...alt.sacrificed.slice(0, 1).map((x) => `a cambio de ${x}`)].join(", ");
    otherPath = `${text(best)}${what ? `: ${what}` : ""}. ${best.outcome(g)}`.trim();
  }
  const t = tagsOf(c);
  return {
    verdict: o.score === 3 ? "solida" : o.score === 2 ? "aceptable" : "riesgosa",
    gained: mine.gained.length ? mine.gained : ["Sin costo hoy"],
    sacrificed: mine.sacrificed,
    otherPath,
    principle: c.lesson,
    tags: { industria: INDUSTRY_LABEL[t.industria] ?? t.industria, funcion: FUNCION_LABEL[t.funcion], competencias: t.competencias.map((a) => AREA_LABEL[a]) },
  };
}

// ───────────────────────────────────────────────── desempeño por competencia
export interface CompetencyScore { area: Area; decisions: number; avg: number }
/** Promedio (0–3) del puntaje de las opciones elegidas, por competencia que pone a prueba cada caso. */
export function competencyProfile(decisions: readonly Decision[]): CompetencyScore[] {
  const acc = new Map<Area, { n: number; sum: number }>();
  for (const d of decisions) {
    const c = caseById(d.caseId);
    const o = c?.options.find((x) => x.id === d.optionId);
    if (!c || !o) continue;
    for (const a of c.tags.competencias) {
      const cur = acc.get(a) ?? { n: 0, sum: 0 };
      cur.n++; cur.sum += o.score;
      acc.set(a, cur);
    }
  }
  return [...acc.entries()].map(([area, x]) => ({ area, decisions: x.n, avg: x.sum / x.n })).sort((a, b) => a.avg - b.avg || a.area.localeCompare(b.area));
}

/** Nivel del jugador en el motor: «aprendiendo» (promedio < 2), «solido» (2–2.6) o «experto» (≥ 2.6), con al menos 3 decisiones. */
export function playerLevel(decisions: readonly Decision[]): "nuevo" | "aprendiendo" | "solido" | "experto" {
  const scored = decisions.map((d) => caseById(d.caseId)?.options.find((x) => x.id === d.optionId)?.score).filter((x): x is 0 | 1 | 2 | 3 => x !== undefined);
  if (scored.length < 3) return "nuevo";
  const avg = scored.reduce((a: number, b) => a + b, 0) / scored.length;
  return avg >= 2.6 ? "experto" : avg >= 2 ? "solido" : "aprendiendo";
}

// ───────────────────────────────────────────────── capa adaptativa
/** Presión de un caso: crecer (abrir, cliente nuevo) presiona más que ajustar. Sirve para retar al jugador que va bien. */
const PRESSURE: Readonly<Record<GCase["chain"], number>> = Object.freeze({ liquidez: 3, A: 2, B: 2, C: 2, operacion: 1, finanzas: 1 });

/**
 * Orden adaptativo de los casos disponibles (estable y determinista).
 *  1. Liquidez primero (si existe, es lo urgente).
 *  2. Arranque financiero y casos de cadena en su orden (una historia no se rompe).
 *  3. Los demás: primero los que entrenan la competencia más débil del jugador; si el jugador es experto, primero
 *     los de mayor presión. Empates: el orden original del catálogo.
 */
export function adaptiveOrder(cases: readonly GCase[], decisions: readonly Decision[]): GCase[] {
  const prof = competencyProfile(decisions);
  const weak = new Map(prof.map((p, i) => [p.area, prof.length - i]));
  const level = playerLevel(decisions);
  const rank = (c: GCase): number => {
    if (c.chain === "liquidez") return 1e6;
    if (c.chain === "finanzas" || c.chain === "A" || c.chain === "B" || c.chain === "C") return 1e5 - c.step;
    if (level === "nuevo") return 0;
    const need = Math.max(0, ...c.tags.competencias.map((a) => weak.get(a) ?? 0));
    return level === "experto" ? PRESSURE[c.chain] * 100 + need : need * 100 + PRESSURE[c.chain];
  };
  return cases.map((c, i) => ({ c, i, r: rank(c) })).sort((a, b) => b.r - a.r || a.i - b.i).map((x) => x.c);
}

/** Una línea para el jugador sobre cómo va y qué le conviene entrenar (para el panel). */
export function coachLine(decisions: readonly Decision[]): string | null {
  const level = playerLevel(decisions);
  if (level === "nuevo") return null;
  const prof = competencyProfile(decisions);
  const weakest = prof[0];
  if (level === "experto") return "Tus decisiones van sólidas: llegarán primero los casos de más presión.";
  return weakest ? `Lo que más te conviene entrenar ahora: ${AREA_LABEL[weakest.area].toLowerCase()}. Los casos que lo ponen a prueba llegarán primero.` : null;
}
