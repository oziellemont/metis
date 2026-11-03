/**
 * mêtis CEO · Lo que deja cada decisión (sistema de aprendizaje).
 *
 * Función PURA y de solo lectura: explica una decisión ya tomada, no la califica ni cambia nada.
 *  - Ganaste / Sacrificaste: indicadores y relaciones, en piezas cortas.
 *  - Riesgo pendiente: el tablero de ese momento (debajo o cerca de la línea, puntos que no contaron, relaciones dañadas).
 *  - Lo que aprendiste: un concepto concreto de dirección aplicado a este caso (ver `concepts.ts`).
 *  - Otro camino posible: cualquier otra opción del caso (no solo las «recomendadas»), con lo que habría favorecido,
 *    lo que habría costado, cuándo tendría sentido y qué habría pasado. Nunca se presenta como «la correcta».
 *
 * Los efectos oficiales siguen saliendo de las reglas del motor (`effectOf`); aquí solo se leen.
 */
import { KPI_KEYS, nowOf, rulesFor, rulesVersionOf, scaled } from "./engine";
import { firstName } from "./cast";
import { CONCEPT_LESSON, caseConceptOf } from "./concepts";
import { displayOptions } from "./option-order";
import { timeline } from "./season-report";
import type { CeoState, CompanyPack, Entry, KpiKey, Kpis, Option } from "./types";

export interface LessonChip { text: string; kind: "kpi" | "persona" | "otro" }
export interface OtherPath {
  /** Texto de la opción tal como se mostró. */
  option: string;
  /** Frase breve: «Habrías favorecido X, a costa de Y.» */
  tradeoff: string;
  /** Cuándo tendría más sentido ese camino (derivado del tablero, no de un juicio). */
  whenSense: string | null;
  /** Qué habría pasado en la empresa (el desenlace escrito para esa opción). */
  outcome: string;
}
export interface DecisionLesson {
  gained: LessonChip[];
  sacrificed: LessonChip[];
  /** El primero es el más importante; el resto se ve al profundizar. */
  risks: string[];
  learned: { name: string | null; applied: string; definition: string | null; lesson: string | null };
  /** Nota de dirección del caso (se conserva para la bitácora y como respaldo del concepto). */
  principle: string;
  otherPath: OtherPath | null;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const listEs = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
/** Qué necesitarías hacer si ese indicador queda bajo (lenguaje de negocio, no de juego). */
const NEED: Record<KpiKey, string> = {
  caja: "recuperar liquidez antes de comprometer más efectivo",
  margen: "recuperar rentabilidad antes de absorber otro costo",
  equipo: "reconstruir la confianza de tu gente antes de pedirle otro esfuerzo",
  clientes: "recuperar a tus clientes antes de arriesgar otra relación comercial",
  consejo: "recuperar la confianza del consejo antes de pedirle otra decisión difícil",
};
/** Diferencia mínima (en puntos) para decir que otro camino «habría favorecido» o «habría costado» algo. */
const DIFF = 2;

export function decisionLesson(s: CeoState, e: Entry, pack: CompanyPack, now: number = nowOf(s)): DecisionLesson | null {
  if (e.status !== "decidido" && e.status !== "vencido") return null;
  const it = e.item;
  const ev = timeline(s, now).events.find((x) => (x.kind === "decision" || x.kind === "vencido") && x.id === it.id);
  if (!ev) return null;
  const line = rulesFor(s).passLine;
  const label = (k: KpiKey) => pack.kpiLabel[k];
  const name = (id: string) => firstName(pack, id);
  const before: Kpis = ev.before;
  const eff = ev.eff;
  const o = e.status === "decidido" ? e.option : undefined;

  const gained: LessonChip[] = [];
  const sacrificed: LessonChip[] = [];
  const below: string[] = [], near: string[] = [], other: string[] = [];
  for (const k of KPI_KEYS) {
    const d = eff[k] ?? 0;
    if (!d) continue;
    const after = clamp(before[k] + d);
    if (d > 0) {
      gained.push({ text: `${label(k)} +${d}`, kind: "kpi" });
      const lost = before[k] + d - after;
      if (lost > 0) other.push(`${label(k)} ya estaba en ${before[k]}: ${lost} de esos puntos no contaron.`);
    } else {
      sacrificed.push({ text: `${label(k)} ${d}`, kind: "kpi" });
      if (after < line) below.push(`${label(k)} quedó en ${after}, por debajo de la línea de ${line}. Necesitarás ${NEED[k]}.`);
      else if (after < line + 5) near.push(`${label(k)} quedó en ${after}, a ${after - line} ${after - line === 1 ? "punto" : "puntos"} de la línea. Otra decisión que lo use podría dejarlo debajo.`);
    }
  }
  for (const [who, v] of Object.entries(o?.stance ?? {})) {
    if (!pack.cast[who] || !v) continue;
    if (v >= 1) gained.push({ text: `Confianza de ${name(who)}`, kind: "persona" });
    else {
      sacrificed.push({ text: `Relación con ${name(who)}`, kind: "persona" });
      if (v <= -2) other.push(`${name(who)} lo tomó mal y puede cobrártelo en un asunto posterior.`);
    }
  }
  if (e.status === "vencido") sacrificed.push({ text: "La iniciativa: otros decidieron por ti", kind: "otro" });

  const cc = caseConceptOf(it.id);
  const learned = cc ? { name: cc.def.name, applied: cc.applied, definition: cc.def.definition, lesson: CONCEPT_LESSON[cc.concept] ?? it.lesson ?? null } : { name: null, applied: it.bitacora.nota, definition: null, lesson: it.lesson ?? null };
  return { gained, sacrificed, risks: [...below, ...near, ...other], learned, principle: it.bitacora.nota, otherPath: otherPathOf(s, e, eff, before, line, label) };
}

/**
 * Otro camino posible: se elige entre TODAS las demás opciones del caso (incluidas las menos recomendables),
 * prefiriendo la que más protegía el indicador que tu decisión dejó más expuesto y, si no hay uno, la más distinta.
 * Explica intercambios; no dice cuál era mejor.
 */
function otherPathOf(s: CeoState, e: Entry, eff: Partial<Kpis>, before: Kpis, line: number, label: (k: KpiKey) => string): OtherPath | null {
  const v = rulesVersionOf(s);
  const chosen = e.status === "decidido" ? e.option?.id : undefined;
  const pool = displayOptions(e.item).filter((x) => x.id !== chosen);
  if (!pool.length) return null;
  const effOf = (x: Option) => scaled(x.effects, s.tier, v);
  const paid = KPI_KEYS.filter((k) => (eff[k] ?? 0) < 0).sort((a, b) => (before[a] + (eff[a] ?? 0)) - (before[b] + (eff[b] ?? 0)));
  const exposed = paid[0];
  const scored = pool.map((x, i) => {
    const a = effOf(x);
    const better: KpiKey[] = [], worse: KpiKey[] = [];
    let dist = 0;
    for (const k of KPI_KEYS) {
      const d = (a[k] ?? 0) - (eff[k] ?? 0);
      dist += Math.abs(d);
      if (d >= DIFF) better.push(k); else if (d <= -DIFF) worse.push(k);
    }
    return { x, i, a, better, worse, dist, protects: exposed ? (a[exposed] ?? 0) - (eff[exposed] ?? 0) : 0 };
  });
  scored.sort((p, q) => q.protects - p.protects || q.dist - p.dist || p.i - q.i);
  const r = scored[0];
  const low = (ks: KpiKey[]) => listEs(ks.map((k) => label(k).toLowerCase()));
  const tradeoff = r.better.length && r.worse.length ? `Habrías favorecido ${low(r.better)}, a costa de ${low(r.worse)}.`
    : r.better.length ? `Habrías favorecido ${low(r.better)} sin pagar más en otro indicador; el costo habría estado en otra parte, como el riesgo o las relaciones.`
    : r.worse.length ? `Habrías pagado más en ${low(r.worse)}; lo que habría cambiado es cómo y con quién se resolvía el asunto.`
    : "Los números habrían quedado parecidos; la diferencia está en cómo se resuelve el asunto y en cómo lo toma la gente.";
  // Cuándo tendría sentido: si favorece un indicador, tendría más peso cuando ese indicador es la restricción.
  const k = r.better.slice().sort((a, b) => before[a] - before[b])[0];
  const tight = k !== undefined && before[k] + (eff[k] ?? 0) < line + 8;
  const whenSense = k === undefined ? null
    : tight ? `Con ${label(k).toLowerCase()} en ${clamp(before[k] + (eff[k] ?? 0))}, este camino merecía considerarse.`
    : `Tendría más sentido en un momento en que ${label(k).toLowerCase()} fuera tu restricción principal.`;
  const t = r.x.text.trim();
  return { option: t, tradeoff, whenSense, outcome: r.x.outcome };
}
