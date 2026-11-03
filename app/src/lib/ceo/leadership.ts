/**
 * mêtis CEO · «Mi liderazgo»: lectura de tu liderazgo basada en evidencia de conducta.
 *
 * Tres capas que NO se mezclan:
 *  1. Preferencias: hacia dónde tiendes (corto/largo plazo, prudente/audaz, números/personas, solo/involucras,
 *     evitas/encaras). Es estilo, no calificación: ninguna preferencia es mejor que otra. Se muestra con cuántas
 *     decisiones la sostienen y qué tan consistente es.
 *  2. Competencias: las seis dimensiones de la rúbrica contextual (analiza, consulta, anticipa, negocia, ejecuta,
 *     prioriza), medidas SOLO en las situaciones que las pedían, con ejemplos concretos (asunto y decisión).
 *  3. Resultados: cómo quedó la empresa (indicadores contra el arranque). Un buen resultado no prueba buen criterio
 *     ni al revés; por eso se reportan aparte.
 * Sin tipologías de personalidad. Lectura preliminar si hay poca evidencia. Función pura, de solo lectura.
 */
import { AXES, KPI_KEYS, entries, kpis, packOf, rulesFor, rulesVersionOf, scaled } from "./engine";
import { JUDGMENT_DIMS, JUDGMENT_LABEL, type JudgmentDim } from "./judgment";
import { situationRubric } from "./rubric";
import { timeline } from "./season-report";
import type { Axis, CeoState, KpiKey } from "./types";

/** Mínimo de situaciones para dar una lectura (debajo es «preliminar»). */
export const LEADERSHIP_MIN_EVIDENCE = 3;

export interface Preference {
  axis: Axis;
  left: string;
  right: string;
  /** −100…100 (promedio de las decisiones que tocan el eje). */
  value: number;
  n: number;
  /** 0–1: proporción de decisiones que van hacia el mismo lado que el promedio. */
  consistency: number;
  text: string;
}
export interface CompetencyEvidence {
  dim: JudgmentDim;
  name: string;
  question: string;
  /** Situaciones donde esta dimensión aplicaba. */
  n: number;
  /** 0–1 (promedio de nivel 0–2 / 2). null si no hubo situaciones. */
  score: number | null;
  band: "fortaleza" | "en_desarrollo" | "por_reforzar" | "preliminar" | "sin_evidencia";
  bandLabel: string;
  best?: { item: string; subject: string; note: string };
  weakest?: { item: string; subject: string; note: string };
}
export interface Leadership {
  decisions: number;
  expired: number;
  preferences: Preference[];
  competencies: CompetencyEvidence[];
  results: { kpi: KpiKey; start: number; now: number; delta: number }[];
  /** Frases de resumen, cada una de su capa (nunca mezcla estilo con calidad). */
  summary: { preferencias: string; competencias: string; resultados: string };
}

const BAND_LABEL: Record<CompetencyEvidence["band"], string> = {
  fortaleza: "Fortaleza demostrada",
  en_desarrollo: "En desarrollo",
  por_reforzar: "Por reforzar",
  preliminar: "Lectura preliminar",
  sin_evidencia: "Aún sin situaciones",
};

export function leadershipOf(s: CeoState, now: number): Leadership {
  const pack = packOf(s);
  const es = entries(s, now);
  const decided = es.filter((e) => e.status === "decidido" && e.option);
  const expired = es.filter((e) => e.status === "vencido").length;

  // 1 · preferencias (solo decisiones de esta empresa, para que la evidencia sea auditable aquí mismo)
  const preferences: Preference[] = AXES.map((a) => {
    const xs = decided.map((e) => e.option!.style[a.key] ?? 0).filter((x) => x !== 0);
    const m = xs.length ? xs.reduce((p, q) => p + q, 0) / xs.length : 0;
    const value = Math.round(m * 50);
    const consistency = xs.length ? xs.filter((x) => Math.sign(x) === Math.sign(m || 1)).length / xs.length : 0;
    const side = value >= 15 ? a.right : value <= -15 ? a.left : null;
    const text = xs.length < LEADERSHIP_MIN_EVIDENCE
      ? `Aún hay pocas decisiones que toquen este eje (${xs.length}).`
      : side
        ? `Tiendes hacia «${side}» (${xs.length} decisiones; ${Math.round(consistency * 100)} % hacia el mismo lado). ${consistency < 0.7 ? "Cambias según la situación." : "Es un patrón estable: útil hasta que la situación pide lo contrario."}`
        : `Sin inclinación marcada: decides según el caso (${xs.length} decisiones).`;
    return { axis: a.key, left: a.left, right: a.right, value, n: xs.length, consistency, text };
  });

  // 2 · competencias: rúbrica contextual de cada decisión, con el tablero que tenías al decidir
  const tl = timeline(s, now);
  const line = rulesFor(s).passLine, v = rulesVersionOf(s);
  const label = (k: KpiKey) => pack.kpiLabel[k];
  const name = (id: string) => pack.cast[id]?.name ?? id;
  const acc: Record<JudgmentDim, { sum: number; n: number; best?: { lv: number; item: string; subject: string; note: string }; worst?: { lv: number; item: string; subject: string; note: string } }> =
    Object.fromEntries(JUDGMENT_DIMS.map((d) => [d, { sum: 0, n: 0 }])) as never;
  for (const e of decided) {
    const ev = tl.events.find((x) => x.kind === "decision" && x.id === e.item.id);
    if (!ev) continue;
    const r = situationRubric({ item: e.item, chosen: e.option!, effects: Object.fromEntries(e.item.options.map((o) => [o.id, scaled(o.effects, s.tier, v)])), board: ev.before, line, label, name });
    for (const d of r.dims) {
      const a = acc[d.dim];
      a.sum += d.level; a.n++;
      const ex = { lv: d.level, item: e.item.id, subject: e.item.subject, note: d.note };
      if (!a.best || d.level > a.best.lv) a.best = ex;
      if (!a.worst || d.level < a.worst.lv) a.worst = ex;
    }
  }
  const competencies: CompetencyEvidence[] = JUDGMENT_DIMS.map((d) => {
    const a = acc[d];
    const score = a.n ? a.sum / a.n / 2 : null;
    const band: CompetencyEvidence["band"] = !a.n ? "sin_evidencia" : a.n < LEADERSHIP_MIN_EVIDENCE ? "preliminar" : score! >= 0.75 ? "fortaleza" : score! >= 0.45 ? "en_desarrollo" : "por_reforzar";
    const strip = (x?: { lv: number; item: string; subject: string; note: string }) => (x ? { item: x.item, subject: x.subject, note: x.note } : undefined);
    return {
      dim: d, name: JUDGMENT_LABEL[d].name, question: JUDGMENT_LABEL[d].question, n: a.n, score, band, bandLabel: BAND_LABEL[band],
      best: a.best && a.best.lv >= 2 ? strip(a.best) : undefined,
      weakest: a.worst && a.worst.lv === 0 ? strip(a.worst) : undefined,
    };
  });

  // 3 · resultados
  const k = kpis(s, now);
  const results = KPI_KEYS.map((x) => ({ kpi: x, start: pack.kpiStart[x], now: k[x], delta: k[x] - pack.kpiStart[x] }));

  const strong = competencies.filter((c) => c.band === "fortaleza").map((c) => c.name.toLowerCase());
  const weak = competencies.filter((c) => c.band === "por_reforzar").map((c) => c.name.toLowerCase());
  const marked = preferences.filter((p) => p.n >= LEADERSHIP_MIN_EVIDENCE && Math.abs(p.value) >= 15);
  const up = results.filter((r) => r.delta > 0).map((r) => label(r.kpi).toLowerCase());
  const down = results.filter((r) => r.delta < 0).map((r) => label(r.kpi).toLowerCase());
  const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
  return {
    decisions: decided.length,
    expired,
    preferences,
    competencies,
    results,
    summary: {
      preferencias: decided.length < LEADERSHIP_MIN_EVIDENCE ? "Todavía hay pocas decisiones para leer tus preferencias." : marked.length ? `Tus decisiones se inclinan hacia ${list(marked.map((p) => `«${p.value > 0 ? p.right : p.left}»`))}. Es estilo, no calificación.` : "No muestras una inclinación marcada: ajustas tu estilo según la situación.",
      competencias: !competencies.some((c) => c.n) ? "Aún no hay situaciones evaluadas." : `${strong.length ? `Fortaleza demostrada en ${list(strong)}.` : "Todavía ninguna dimensión llega a fortaleza."}${weak.length ? ` Por reforzar: ${list(weak)}.` : ""} Cada dimensión se mide solo donde la situación la pedía.`,
      resultados: `Desde que llegaste: ${up.length ? `subieron ${list(up)}` : "ningún indicador subió"}${down.length ? `; bajaron ${list(down)}` : ""}. El resultado se reporta aparte: no prueba por sí solo buen o mal criterio.`,
    },
  };
}
