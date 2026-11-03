/**
 * mêtis CEO · Rúbrica de criterio ejecutivo (eje A), separada del resultado del negocio (eje B).
 *
 * Eje A — calidad del criterio: cómo razonaste con la información que tenías EN ESE MOMENTO.
 * Eje B — resultado del negocio: caja, margen, equipo, clientes y consejo al cierre (motor y veredicto).
 *
 * La rúbrica califica la decisión ex ante (con lo visible al decidir), nunca por cómo salió después.
 * Seis dimensiones, 0–2 cada una. Las cinco primeras las define el autor del caso (contenido nuevo) o se derivan del
 * puntaje editorial (contenido actual). La sexta, «prioriza», es contextual: depende del tablero cuando decides.
 * Leer el tablero ES criterio ejecutivo: elegir un camino defendible que hunde el indicador que ya está en riesgo,
 * habiendo otro igual de defendible que no lo hace, no es buen criterio aunque el argumento sea impecable.
 */
import type { KpiKey, Kpis } from "./types";

/** Mismo orden que el motor (se define aquí para no depender de él). */
const KPI_KEYS: KpiKey[] = ["caja", "margen", "equipo", "clientes", "consejo"];

export type JudgmentDim = "analiza" | "consulta" | "anticipa" | "negocia" | "ejecuta" | "prioriza";
export const JUDGMENT_DIMS: JudgmentDim[] = ["analiza", "consulta", "anticipa", "negocia", "ejecuta", "prioriza"];

export const JUDGMENT_LABEL: Record<JudgmentDim, { name: string; question: string; levels: [string, string, string] }> = {
  analiza: { name: "Analiza", question: "¿Usa los datos del caso y distingue el problema real del síntoma?", levels: ["Decide sin mirar los datos o ataca el síntoma.", "Usa parte de la información.", "Usa la información clave y nombra el problema de fondo."] },
  consulta: { name: "Consulta", question: "¿Involucra a quien sabe o a quien vive la consecuencia, sin delegar la decisión?", levels: ["Decide solo cuando había a quién preguntar, o delega la decisión.", "Consulta tarde o a medias.", "Consulta a quien importa y aun así decide."] },
  anticipa: { name: "Anticipa", question: "¿Reconoce lo que cuesta y lo que puede salir mal?", levels: ["Actúa como si no hubiera costo.", "Reconoce el costo principal.", "Reconoce costos y riesgos, y deja una salida si falla."] },
  negocia: { name: "Negocia", question: "¿Busca un acuerdo que proteja los intereses de fondo de las partes?", levels: ["Impone o cede todo.", "Concede algo a cambio de algo.", "Encuentra un intercambio que cuida lo esencial de ambos lados."] },
  ejecuta: { name: "Ejecuta", question: "¿La decisión se puede llevar a cabo: responsable, fecha, medida?", levels: ["Intención sin forma.", "Tiene forma pero le falta responsable o medida.", "Responsable, plazo y forma de medir."] },
  prioriza: { name: "Prioriza", question: "¿Protege la restricción crítica del momento (lo que el tablero dice que está en riesgo)?", levels: ["Gasta justo lo que ya está en riesgo, habiendo alternativa.", "Neutral frente al tablero.", "Cuida o repone lo que está en riesgo."] },
};

/** Evaluación autoral de una opción (las 5 dimensiones no contextuales, 0–2). */
export type AuthoredJudgment = Partial<Record<Exclude<JudgmentDim, "prioriza">, 0 | 1 | 2>>;

export const JUDGMENT_RULES = Object.freeze({
  version: 1,
  /** Un indicador está «en riesgo» si queda a menos de esto de la línea. */
  riskMargin: 8,
  /** Un indicador está «al tope» desde aquí (sumarle casi no cuenta). */
  saturation: 95,
});

/** Para contenido existente: del puntaje editorial (0–3) a las 5 dimensiones autorales (aprox. lineal). */
export function authoredFromScore(score: number): AuthoredJudgment {
  const v = (score >= 3 ? 2 : score >= 2 ? 1 : score >= 1 ? 1 : 0) as 0 | 1 | 2;
  const hi = (score >= 3 ? 2 : score >= 1 ? 1 : 0) as 0 | 1 | 2;
  return { analiza: hi, consulta: v, anticipa: hi, negocia: v, ejecuta: v };
}

export interface ContextOption { id: string; score: number; effects: Partial<Kpis> }

/** Dimensión contextual: qué hace la opción con lo que el tablero dice que está en riesgo, frente a las alternativas. */
/**
 * `mandate` (reglas V5): indicadores que el consejo encargó (y la caja). Para esos, «en riesgo» empieza antes
 * (`mandateMargin`): leer el tablero incluye saber qué te pidieron cuidar.
 */
export function prioritizes(o: ContextOption, all: ContextOption[], board: Kpis, line: number, mandate: KpiKey[] = [], mandateMargin = 0): 0 | 1 | 2 {
  const R = JUDGMENT_RULES;
  const margin = (k: KpiKey) => (mandate.includes(k) ? Math.max(R.riskMargin, mandateMargin) : R.riskMargin);
  const atRisk = (k: KpiKey, x: ContextOption) => (x.effects[k] ?? 0) < 0 && board[k] + (x.effects[k] ?? 0) < line + margin(k);
  const hurts = KPI_KEYS.filter((k) => atRisk(k, o));
  const defensible = all.filter((x) => x !== o && x.score >= 2);
  if (hurts.length && defensible.some((x) => !KPI_KEYS.some((k) => atRisk(k, x)))) return 0;
  const repairs = KPI_KEYS.some((k) => (o.effects[k] ?? 0) > 0 && board[k] < line + margin(k));
  const pos = KPI_KEYS.reduce((a, k) => a + Math.max(0, o.effects[k] ?? 0), 0);
  const wasted = KPI_KEYS.reduce((a, k) => a + (board[k] >= R.saturation ? Math.max(0, o.effects[k] ?? 0) : 0), 0);
  if (repairs && !hurts.length) return 2;
  if (pos > 0 && wasted * 2 >= pos && defensible.some((x) => KPI_KEYS.some((k) => (x.effects[k] ?? 0) > 0 && board[k] < R.saturation - 10))) return 0;
  return 1;
}

export interface JudgmentResult {
  dims: Record<JudgmentDim, 0 | 1 | 2>;
  /** Total 0–12. */
  total: number;
  /** Nivel 0–3 comparable con el puntaje histórico (para XP y la escala de la retro). */
  level: 0 | 1 | 2 | 3;
}

export function judge(authored: AuthoredJudgment, prioriza: 0 | 1 | 2): JudgmentResult {
  const dims = { analiza: authored.analiza ?? 0, consulta: authored.consulta ?? 0, anticipa: authored.anticipa ?? 0, negocia: authored.negocia ?? 0, ejecuta: authored.ejecuta ?? 0, prioriza };
  const total = JUDGMENT_DIMS.reduce((a, d) => a + dims[d], 0);
  let level = (total >= 10 ? 3 : total >= 7 ? 2 : total >= 4 ? 1 : 0) as 0 | 1 | 2 | 3;
  // Un argumento impecable que gasta justo lo que el tablero dice que está en riesgo no es criterio de nivel 3.
  if (prioriza === 0 && level > 2) level = 2;
  return { dims, total, level };
}

/** Criterio contextual de una opción del contenido actual (sin evaluación autoral detallada). */
export function contextualJudgment(o: ContextOption, all: ContextOption[], board: Kpis, line: number, authored?: AuthoredJudgment): JudgmentResult {
  return judge(authored ?? authoredFromScore(o.score), prioritizes(o, all, board, line));
}
