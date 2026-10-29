/**
 * mêtis CEO · 0.6 Inventario editorial de los asuntos actuales.
 *
 * Clasificador PURO y de solo lectura: no cambia ningún texto, efecto, score ni resultado.
 * Etiqueta cada asunto como:
 *  - `restrictedEthics`: obligación ética o de seguridad. Puede tener una respuesta clara y está bien;
 *    las opciones que cruzan una línea roja se marcan una por una y no se presentan como trade-off válido.
 *  - `needsRewrite`: la respuesta es obvia por los números (una opción gana en todo, o la de score más alto
 *    también es claramente la más rentable). Enseña a adivinar la preferencia del autor.
 *  - `legacy`: se puede seguir jugando como contenido histórico, pero no cumple el contrato v3
 *    (p. ej. la de score más alto sigue siendo la más rentable, aunque por poco).
 *  - `approved`: pasa todas las pruebas automáticas. Es una PROPUESTA: la aprobación real la firman
 *    dos revisores humanos en `EDITORIAL_REVIEW`.
 *
 * Todas las cuentas usan los efectos tal como están escritos (nivel 0, sin multiplicadores).
 */
import { COMPANIES } from "./companies";
import type { CompanyPack, Item, KpiKey, Kpis, Option } from "./types";

export const EDITORIAL_VERSION = 1;
export type EditorialStatus = "legacy" | "approved" | "needsRewrite" | "restrictedEthics";
export const EDITORIAL_STATUSES: EditorialStatus[] = ["approved", "legacy", "needsRewrite", "restrictedEthics"];

const KEYS: KpiKey[] = ["caja", "margen", "equipo", "clientes", "consejo"];

/** Umbrales del clasificador (propuesta editorial, ajustables y versionados). */
export const EDITORIAL_THRESHOLDS = Object.freeze({
  /** Ventaja neta mínima de la opción de score más alto sobre la segunda para llamarla «obvia». */
  obviousGap: 3,
  /** Dos opciones son «defendibles» si su balance neto está a esta distancia o menos de la mejor. */
  defensibleBand: 2,
});

/**
 * Opciones que cruzan una línea roja (seguridad, fraude, ocultar información al cliente, represalia
 * contra quien denuncia, inocuidad). Se analizan como consecuencia, nunca como alternativa legítima.
 * Lista editorial: la revisión humana puede agregar o quitar.
 */
export const RED_LINES: Record<string, { option: string; why: string }[]> = {
  "d3-planta": [{ option: "b", why: "Seguir operando un equipo con riesgo de accidente ya identificado." }],
  "d6-gastos": [{ option: "b", why: "Encubrir un fraude comprobado a cambio de ventas." }],
  "fn-d3-ppap": [{ option: "b", why: "Saltarse la firma de Calidad y entregar sin declarar la capacidad real." }],
  "fn-c-laura": [{ option: "b", why: "Mantener oculto al cliente un riesgo de calidad conocido." }],
  "fn-d6-denuncia": [{ option: "b", why: "Mover a quienes denunciaron acoso: represalia contra denunciantes." }],
  "gb-d3-brote": [{ option: "b", why: "Seguir abiertos tras un brote de intoxicación sin dar la cara." }],
};

/** Revisión humana (dos firmas). Vacía hasta que el equipo editorial revise; manda sobre la propuesta. */
export interface HumanReview { status: EditorialStatus; reviewers: [string, string]; date: string; note?: string }
export const EDITORIAL_REVIEW: Record<string, HumanReview> = {};

export type Finding =
  | "dominante"          // una opción gana o empata en los 5 indicadores frente a todas las demás
  | "score_paga"         // la de score más alto es también la de mejor balance neto
  | "obvia"              // …y por una ventaja de obviousGap o más
  | "castigo_moralista"  // la de score 0 es la de peor balance neto
  | "sin_costo"          // una opción no tiene ningún efecto negativo
  | "una_sola_defendible" // solo una opción queda cerca de la mejor
  | "vencer_peor"        // no responder castiga más que la peor opción
  | "linea_roja";        // al menos una opción cruza una línea roja

export const FINDING_TEXT: Record<Finding, string> = {
  dominante: "Una opción gana o empata en los cinco indicadores frente a todas las demás.",
  score_paga: "La opción con score más alto también es la de mejor balance de indicadores.",
  obvia: "La opción con score más alto gana por una ventaja clara: se adivina la preferencia del autor.",
  castigo_moralista: "La opción con score 0 es la que peor le va a la empresa.",
  sin_costo: "Hay una opción sin ningún costo visible.",
  una_sola_defendible: "Solo una opción queda cerca de la mejor; las demás no son defendibles por números.",
  vencer_peor: "No responder castiga más que cualquier opción.",
  linea_roja: "Una opción cruza una línea roja (se analiza, no se presenta como alternativa legítima).",
};

export interface OptionAudit { id: string; score: number; net: number; negatives: number; redLine?: string }
export interface ItemAudit {
  company: string;
  id: string;
  day: number;
  subject: string;
  consequence: boolean;
  areas: string[];
  options: OptionAudit[];
  expiredNet: number;
  /** Ventaja neta de la opción de score más alto sobre la mejor de las demás (negativa si otra gana). */
  topScoreGap: number;
  /** Opción que domina a todas (si existe). */
  dominantOption: string | null;
  defensible: number;
  findings: Finding[];
  suggested: EditorialStatus;
  status: EditorialStatus;
  reviewed: boolean;
  reason: string;
}

export const netOf = (e: Partial<Kpis>) => KEYS.reduce((a, k) => a + (e[k] ?? 0), 0);
const negativesOf = (e: Partial<Kpis>) => KEYS.filter((k) => (e[k] ?? 0) < 0).length;

/** ¿`a` gana o empata en todos los indicadores y gana en al menos uno? */
export function dominates(a: Partial<Kpis>, b: Partial<Kpis>): boolean {
  let strict = false;
  for (const k of KEYS) {
    const x = a[k] ?? 0, y = b[k] ?? 0;
    if (x < y) return false;
    if (x > y) strict = true;
  }
  return strict;
}

function dominantOf(opts: Option[]): string | null {
  for (const o of opts) if (opts.every((p) => p === o || dominates(o.effects, p.effects))) return o.id;
  return null;
}

export function auditItem(pack: CompanyPack, item: Item): ItemAudit {
  const t = EDITORIAL_THRESHOLDS;
  const red = RED_LINES[item.id] ?? [];
  const options: OptionAudit[] = item.options.map((o) => ({
    id: o.id, score: o.score, net: netOf(o.effects), negatives: negativesOf(o.effects),
    ...(red.find((r) => r.option === o.id) ? { redLine: red.find((r) => r.option === o.id)!.why } : {}),
  }));
  const maxScore = Math.max(...options.map((o) => o.score));
  const tops = options.filter((o) => o.score === maxScore);
  const top = tops.slice().sort((a, b) => b.net - a.net)[0];
  const others = options.filter((o) => o.score !== maxScore);
  const topScoreGap = others.length ? top.net - Math.max(...others.map((o) => o.net)) : 0;
  const bestNet = Math.max(...options.map((o) => o.net));
  const minNet = Math.min(...options.map((o) => o.net));
  const legit = options.filter((o) => !o.redLine);
  const defensible = legit.filter((o) => bestNet - o.net <= t.defensibleBand).length;
  const dominantOption = dominantOf(item.options);
  const expiredNet = netOf(item.expired.effects);

  const f: Finding[] = [];
  if (dominantOption) f.push("dominante");
  if (others.length && topScoreGap > 0) f.push("score_paga");
  if (others.length && topScoreGap >= t.obviousGap) f.push("obvia");
  const zeros = options.filter((o) => o.score === 0);
  if (zeros.length && zeros.some((o) => o.net === minNet) && minNet < bestNet) f.push("castigo_moralista");
  if (options.some((o) => o.negatives === 0)) f.push("sin_costo");
  if (defensible < 2) f.push("una_sola_defendible");
  if (expiredNet < minNet) f.push("vencer_peor");
  if (red.length) f.push("linea_roja");

  const ethics = item.areas.includes("etica") || red.length > 0;
  let suggested: EditorialStatus, reason: string;
  if (ethics) {
    suggested = "restrictedEthics";
    reason = red.length
      ? "Obligación ética o de seguridad. Es válido que tenga una respuesta clara; la opción que cruza la línea roja debe mostrarse como consecuencia, no como alternativa."
      : "Tema de ética o seguridad sin opción de línea roja. Revisar que el feedback no sea sermón.";
  } else if (f.includes("dominante") || f.includes("obvia")) {
    suggested = "needsRewrite";
    reason = f.includes("dominante")
      ? "Una opción gana en todo: no hay dilema. Reescribir para que al menos dos estrategias sean defendibles."
      : "La opción con score más alto es claramente la más rentable: se aprende a adivinar al autor.";
  } else if (f.includes("score_paga") || f.includes("una_sola_defendible")) {
    suggested = "legacy";
    reason = f.includes("score_paga")
      ? "Jugable como contenido histórico, pero la opción preferida por el autor sigue siendo la que más conviene."
      : "Jugable como contenido histórico, pero solo una opción es defendible con los números.";
  } else {
    suggested = "approved";
    reason = "Pasa las pruebas automáticas: hay al menos dos estrategias defendibles y el score no decide el resultado. Falta la firma humana.";
  }
  const review = EDITORIAL_REVIEW[item.id];
  return {
    company: pack.id, id: item.id, day: item.day, subject: item.subject, consequence: !!item.trigger, areas: item.areas,
    options, expiredNet, topScoreGap, dominantOption, defensible, findings: f, suggested,
    status: review?.status ?? suggested, reviewed: !!review, reason: review?.note ?? reason,
  };
}

export function inventory(packs: CompanyPack[] = COMPANIES): ItemAudit[] {
  return packs.flatMap((p) => p.items.map((i) => auditItem(p, i)));
}

/** Auditoría de `score` frente a efectos (hallazgo C1): balance neto promedio por score y empresa. */
export interface ScoreAudit { company: string; byScore: Record<number, { n: number; meanNet: number }>; correlation: number }
const round2 = (x: number) => Math.round(x * 100) / 100;
export function scoreAudit(packs: CompanyPack[] = COMPANIES): ScoreAudit[] {
  return packs.map((p) => {
    const opts = p.items.flatMap((i) => i.options);
    const byScore: ScoreAudit["byScore"] = {};
    for (const sc of [0, 1, 2, 3]) {
      const xs = opts.filter((o) => o.score === sc).map((o) => netOf(o.effects));
      byScore[sc] = { n: xs.length, meanNet: xs.length ? round2(xs.reduce((a, b) => a + b, 0) / xs.length) : 0 };
    }
    return { company: p.id, byScore, correlation: round2(pearson(opts.map((o) => o.score), opts.map((o) => netOf(o.effects)))) };
  });
}
export function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

export function countBy(audits: ItemAudit[]): Record<EditorialStatus, number> {
  const out = Object.fromEntries(EDITORIAL_STATUSES.map((s) => [s, 0])) as Record<EditorialStatus, number>;
  for (const a of audits) out[a.status]++;
  return out;
}

/** ¿Esta opción cruza una línea roja? (para el veredicto sombra). */
export const isRedLine = (itemId: string, optionId: string) => (RED_LINES[itemId] ?? []).some((r) => r.option === optionId);
