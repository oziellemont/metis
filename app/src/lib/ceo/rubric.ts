/**
 * mêtis CEO · Rúbrica contextual (lectura): qué se evalúa en ESTA situación, por qué, y qué tan fundamentada
 * estuvo la decisión con la información disponible al decidir.
 *
 * Principios:
 *  - Solo se evalúan las dimensiones que la situación de verdad pide. Si no había partes en conflicto, «Negocia» no
 *    cuenta; si ningún indicador estaba en riesgo, «Prioriza» no cuenta. Lo que no aplica no resta.
 *  - Es ex ante: usa el tablero ANTES de decidir, nunca cómo salió después.
 *  - Cuidar el recurso que está en riesgo (por ejemplo, no invertir con la caja cerca de la línea) es criterio, no timidez.
 *  - No cambia puntajes, XP ni veredictos: explica.
 */
import { KPI_KEYS } from "./engine";
import { JUDGMENT_LABEL, JUDGMENT_RULES, authoredFromScore, prioritizes, type ContextOption, type JudgmentDim } from "./judgment";
import type { Item, KpiKey, Kpis, Option } from "./types";

export type Level = 0 | 1 | 2;
export interface RubricDim { dim: JudgmentDim; name: string; why: string; level: Level; note: string }
export interface SkippedDim { dim: JudgmentDim; name: string; why: string }
export type Grounding = "bien" | "parcial" | "poco";
export interface SituationRubric {
  dims: RubricDim[];
  skipped: SkippedDim[];
  /** 0–1: promedio solo de las dimensiones que aplican. */
  grounding: number;
  band: Grounding;
  bandLabel: string;
  /** Respuesta a «¿qué tan bien fundamentada estuvo la decisión con la información disponible?». */
  summary: string;
}

export const GROUNDING_LABEL: Record<Grounding, string> = { bien: "Bien fundamentada", parcial: "Fundamentada en parte", poco: "Poco fundamentada" };

const listEs = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
const clampL = (n: number): Level => (n <= 0 ? 0 : n >= 2 ? 2 : 1);

export interface RubricCtx {
  item: Item;
  chosen: Option;
  /** Efectos (ya escalados) de cada opción, por id. */
  effects: Record<string, Partial<Kpis>>;
  board: Kpis;
  line: number;
  label: (k: KpiKey) => string;
  name: (id: string) => string;
}

/**
 * Partes con intereses de verdad opuestos: una persona a la que algún camino le importa mucho a favor (+2)
 * y otra a la que ese mismo camino le cuesta mucho (−2). Simpatías leves no convierten un caso en negociación.
 */
function conflictParties(it: Item): string[] {
  const set = new Set<string>();
  for (const o of it.options) {
    const st = Object.entries(o.stance ?? {});
    const pos = st.filter(([, v]) => v >= 2).map(([w]) => w), neg = st.filter(([, v]) => v <= -2).map(([w]) => w);
    if (pos.length && neg.length) [...pos, ...neg].forEach((w) => set.add(w));
  }
  return [...set];
}

export function situationRubric(ctx: RubricCtx): SituationRubric {
  const { item: it, chosen: o, effects, board, line, label, name } = ctx;
  const R = JUDGMENT_RULES;
  const authored = authoredFromScore(o.score);
  const all: ContextOption[] = it.options.map((x) => ({ id: x.id, score: x.score, effects: effects[x.id] ?? {} }));
  const me = all.find((x) => x.id === o.id)!;
  const eff = me.effects;
  const dims: RubricDim[] = [];
  const skipped: SkippedDim[] = [];
  const push = (dim: JudgmentDim, why: string, level: Level) => dims.push({ dim, name: JUDGMENT_LABEL[dim].name, why, level, note: JUDGMENT_LABEL[dim].levels[level] });
  const skip = (dim: JudgmentDim, why: string) => skipped.push({ dim, name: JUDGMENT_LABEL[dim].name, why });

  // Lo que el tablero decía al decidir.
  const atRisk = KPI_KEYS.filter((k) => board[k] < line + R.riskMargin).sort((a, b) => board[a] - board[b]);
  const wouldBreak = KPI_KEYS.filter((k) => all.some((x) => (x.effects[k] ?? 0) < 0 && board[k] + (x.effects[k] ?? 0) < line));
  const saturated = KPI_KEYS.filter((k) => board[k] >= R.saturation);
  const hurtsAtRisk = atRisk.filter((k) => (eff[k] ?? 0) < 0);
  const protectsRisk = atRisk.length > 0 && hurtsAtRisk.length === 0;
  const riskWhy = atRisk.length ? `${listEs(atRisk.map((k) => `${label(k)} estaba en ${board[k]}`))}, cerca de la línea de ${line}.` : "";

  // Analiza: siempre aplica; con datos en el caso, se nombra la fuente.
  push("analiza", it.data ? `El caso traía información para decidir («${it.data.title}»).` : "Había que distinguir el problema de fondo de su síntoma.", authored.analiza ?? 0);

  // Anticipa: aplica si alguna opción tenía costo. Cuidar lo que está en riesgo cuenta como anticipar.
  const costly = all.some((x) => KPI_KEYS.some((k) => (x.effects[k] ?? 0) < 0));
  if (costly) {
    let a = authored.anticipa ?? 0;
    const others = all.filter((x) => x !== me && x.score > o.score);
    if (protectsRisk && others.some((x) => atRisk.some((k) => (x.effects[k] ?? 0) < 0 && board[k] + (x.effects[k] ?? 0) < line))) a = 2;
    push("anticipa", atRisk.length ? `Cada camino tenía un costo y ${riskWhy}` : "Cada camino tenía un costo que había que reconocer.", clampL(a));
  } else skip("anticipa", "Ningún camino tenía un costo visible en los indicadores.");

  // Consulta: aplica si había personas afectadas o una junta con varias voces.
  const people = [...new Set([...(it.involves ?? []), ...(it.lines ?? []).map((l) => l.who)])].filter((w) => w !== "yo" && w !== it.from);
  const estilos = it.options.map((x) => x.style.estilo ?? 0);
  const consultChoice = Math.max(...estilos) - Math.min(...estilos) >= 2;
  if (consultChoice && (people.length > 0 || it.channel === "junta")) {
    const st = o.style.estilo ?? 0;
    const lv = clampL((authored.consulta ?? 0) + (st >= 2 ? 1 : 0) - (st <= -2 ? 1 : 0));
    const who = people.slice(0, 3).map(name);
    push("consulta", who.length ? `La decisión tocaba a ${listEs(who)}.` : "La decisión afectaba a personas de tu equipo.", lv);
  } else skip("consulta", "Consultar no era lo que distinguía a los caminos: era una decisión tuya con la información a la mano.");

  // Negocia: solo si había partes con intereses opuestos o el caso es de negociación.
  const parties = conflictParties(it);
  if (it.areas.includes("negociacion") || parties.length >= 2) {
    const st = Object.entries(o.stance ?? {});
    const imposes = st.some(([, v]) => v <= -2);
    const both = parties.length >= 2 && parties.every((w) => (o.stance?.[w] ?? 0) >= 0);
    const altBetter = all.some((x) => x !== me && x.score >= 2 && !Object.values(it.options.find((y) => y.id === x.id)?.stance ?? {}).some((v) => v <= -2));
    let n = authored.negocia ?? 0;
    if (imposes && altBetter) n = 0; else if (both && n >= 1) n = 2;
    push("negocia", parties.length >= 2 ? `${listEs(parties.slice(0, 3).map(name))} querían cosas distintas.` : "El caso se resolvía con un acuerdo entre partes.", clampL(n));
  } else skip("negocia", "No había partes con intereses en conflicto que acordar.");

  // Ejecuta: aplica cuando la decisión hay que llevarla a cabo (operación, alineación, estrategia).
  if (it.areas.some((a) => a === "operacion" || a === "alineacion")) push("ejecuta", "La decisión había que llevarla a cabo: responsables, plazos y forma de medir.", authored.ejecuta ?? 0);
  else skip("ejecuta", "Era sobre todo una postura o una conversación, no un plan que ejecutar.");

  // Prioriza: solo si el tablero tenía una restricción (cerca de la línea, al tope o a punto de romperse).
  const riskInPlay = atRisk.some((k) => all.some((x) => (x.effects[k] ?? 0) < 0)) || wouldBreak.length > 0;
  const satInPlay = saturated.some((k) => (eff[k] ?? 0) > 0);
  if (riskInPlay || satInPlay) {
    const why = atRisk.length ? riskWhy : wouldBreak.length ? `Algún camino dejaba ${listEs(wouldBreak.map((k) => label(k).toLowerCase()))} por debajo de la línea de ${line}.` : `${listEs(saturated.map((k) => label(k)))} ya estaba al tope: sumarle casi no contaba.`;
    let pz = prioritizes(me, all, board, line);
    // Proteger lo que está en riesgo cuando otro camino lo gastaba es priorizar, no ser tímido.
    if (pz === 1 && protectsRisk && all.some((x) => x !== me && atRisk.some((k) => (x.effects[k] ?? 0) < 0))) pz = 2;
    push("prioriza", why, pz);
  } else skip("prioriza", "Ningún camino ponía en juego un indicador en riesgo: no había una restricción urgente que proteger.");

  const grounding = dims.reduce((a, d) => a + d.level, 0) / (dims.length * 2);
  const band: Grounding = grounding >= 0.75 ? "bien" : grounding >= 0.45 ? "parcial" : "poco";
  const strong = dims.filter((d) => d.level === 2).map((d) => d.name.toLowerCase());
  const weak = dims.filter((d) => d.level === 0).map((d) => d.name.toLowerCase());
  const summary = [
    `Con la información que tenías al decidir, la decisión estuvo ${GROUNDING_LABEL[band].toLowerCase()}.`,
    strong.length ? `Lo más sólido: ${listEs(strong)}.` : "",
    weak.length ? `Lo que faltó: ${listEs(weak)}.` : "",
    `Se evaluó solo lo que esta situación pedía (${dims.length} de 6).`,
  ].filter(Boolean).join(" ");
  return { dims, skipped, grounding, band, bandLabel: GROUNDING_LABEL[band], summary };
}
