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
 * Sin tipologías de personalidad. Función pura, de solo lectura.
 *
 * Certeza proporcional a la evidencia (calibración de competencias):
 *  - «Tendencia observada»: hay señales, pero pocas o de pocas situaciones distintas. Es lo normal en un primer periodo.
 *  - «Fortaleza consistente»: lo hiciste bien muchas veces, en situaciones de varias áreas Y en más de un periodo.
 *  - «Área por desarrollar»: la misma dificultad se observó varias veces, en situaciones distintas.
 *  - «En desarrollo»: evidencia suficiente, sin patrón claro hacia ninguno de los dos lados.
 * Las competencias usan TODOS tus periodos cerrados más el actual, así que la lectura cambia con el tiempo; además se
 * compara el periodo en curso con los anteriores. Preferencias y resultados siguen siendo solo de la empresa actual.
 */
import { AXES, KPI_KEYS, entries, kpis, packOf, rulesFor, rulesVersionOf, scaled } from "./engine";
import { JUDGMENT_DIMS, JUDGMENT_LABEL, type JudgmentDim } from "./judgment";
import { situationRubric } from "./rubric";
import { timeline } from "./season-report";
import type { Axis, CeoState, KpiKey } from "./types";

/** Mínimo de decisiones para leer una preferencia de estilo. */
export const LEADERSHIP_MIN_EVIDENCE = 3;
/**
 * Umbrales de certeza de las competencias. Con un solo periodo (~14 decisiones) nadie llega a «fortaleza»: hace falta
 * repetirlo en situaciones distintas y en más de un periodo.
 */
export const LEADERSHIP_EVIDENCE = Object.freeze({
  /** Para dejar de ser «tendencia»: situaciones mínimas, áreas distintas (finanzas, personas, clientes…) y periodos. */
  minN: 6,
  minAreas: 3,
  minPeriods: 2,
  /** Fortaleza consistente: situaciones, áreas, periodos con evidencia, nivel promedio y tope de tropiezos. */
  strongN: 10, strongAreas: 4, strongPeriods: 2, strongScore: 0.75, strongMaxMiss: 0.15,
  /** Área por desarrollar: tropiezos (nivel 0) repetidos, en áreas distintas, con nivel promedio bajo. */
  weakMisses: 3, weakAreas: 2, weakScore: 0.5,
  /** Cambio entre el periodo en curso y los anteriores: situaciones mínimas en cada lado y diferencia mínima. */
  trendN: 3, trendDelta: 0.15,
});

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
  band: "fortaleza" | "en_desarrollo" | "por_desarrollar" | "tendencia" | "sin_evidencia";
  bandLabel: string;
  /** Diversidad de la evidencia: áreas distintas, periodos con situaciones y tropiezos (nivel 0). */
  areas: number;
  periods: number;
  misses: number;
  /** En «tendencia»: hacia dónde apunta lo poco que hay. */
  lean?: "favorable" | "mixta" | "desfavorable";
  /** Explicación en una frase de por qué tiene esa lectura (cuánta evidencia y de qué tipo). */
  why: string;
  /** Versión muy corta de «why» (para la gráfica: se ve al tocar la barra). */
  brief: string;
  /** Periodo en curso contra los anteriores (null si no hay suficiente evidencia en ambos). */
  change: "mejora" | "baja" | "estable" | null;
  best?: { item: string; subject: string; note: string };
  weakest?: { item: string; subject: string; note: string };
}
export interface Leadership {
  decisions: number;
  /** Periodos (cerrados + el actual) cuyas decisiones alimentan las competencias. */
  periods: number;
  /** Decisiones de todos esos periodos (las competencias se leen sobre estas). */
  decisionsAll: number;
  expired: number;
  preferences: Preference[];
  competencies: CompetencyEvidence[];
  results: { kpi: KpiKey; start: number; now: number; delta: number }[];
  /** Frases de resumen, cada una de su capa (nunca mezcla estilo con calidad). */
  summary: { preferencias: string; competencias: string; resultados: string };
}

export const BAND_LABEL: Record<CompetencyEvidence["band"], string> = {
  fortaleza: "Fortaleza consistente",
  en_desarrollo: "En desarrollo",
  por_desarrollar: "Área por desarrollar",
  tendencia: "Tendencia observada",
  sin_evidencia: "Aún sin situaciones",
};

/** Periodos cerrados (los más recientes) que alimentan las competencias, además del periodo en curso. */
export const LEADERSHIP_WINDOW = 6;

type Ex = { lv: number; item: string; subject: string; note: string };
type Acc = { sum: number; n: number; misses: number; areas: Set<string>; periods: Set<number>; cur: { sum: number; n: number }; past: { sum: number; n: number }; best?: Ex; worst?: Ex };

/**
 * Estado de un periodo cerrado, reconstruido de su registro (decisiones, empresa, nivel y reglas con que se jugó)
 * para volver a leer sus decisiones con la rúbrica (los últimos LEADERSHIP_WINDOW). Solo lectura: nunca se guarda ni cambia el veredicto de ese periodo.
 */
function pastStates(s: CeoState): { s: CeoState; at: number }[] {
  const career = s.career ?? [];
  // Ventana móvil: los últimos periodos cerrados. Así lo que hacías hace mucho deja de pesar y el perfil evoluciona.
  return career.map((r, i) => ({ r, i })).slice(-LEADERSHIP_WINDOW).map(({ r, i }) => ({
    s: { ...s, company: r.company, tier: r.tier, rulesVersion: r.rulesVersion, startedAt: r.startedAt, decisions: r.decisions ?? {}, pinned: {}, episodes: {}, change: undefined, career: career.slice(0, i) } as CeoState,
    at: r.endedAt,
  }));
}

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

  // 2 · competencias: rúbrica contextual de cada decisión (de todos tus periodos), con el tablero que tenías al decidir
  const acc: Record<JudgmentDim, Acc> = Object.fromEntries(JUDGMENT_DIMS.map((d) => [d, { sum: 0, n: 0, misses: 0, areas: new Set<string>(), periods: new Set<number>(), cur: { sum: 0, n: 0 }, past: { sum: 0, n: 0 } }])) as never;
  const periods = [...pastStates(s), { s, at: now }];
  let decisionsAll = 0, withEvidence = 0;
  periods.forEach((p, idx) => {
    const current = idx === periods.length - 1;
    let ps: CeoState, es2: ReturnType<typeof entries>, tl: ReturnType<typeof timeline>;
    try {
      ps = p.s; es2 = current ? es : entries(ps, p.at); tl = timeline(ps, p.at);
    } catch { return; }
    const pk = packOf(ps);
    const line = rulesFor(ps).passLine, v = rulesVersionOf(ps);
    const label = (k: KpiKey) => pk.kpiLabel[k];
    const name = (id: string) => pk.cast[id]?.name ?? id;
    const dec = es2.filter((e) => e.status === "decidido" && e.option);
    if (dec.length) withEvidence++;
    decisionsAll += dec.length;
    for (const e of dec) {
      const ev = tl.events.find((x) => x.kind === "decision" && x.id === e.item.id);
      if (!ev) continue;
      const r = situationRubric({ item: e.item, chosen: e.option!, effects: Object.fromEntries(e.item.options.map((o) => [o.id, scaled(o.effects, ps.tier, v)])), board: ev.before, line, label, name });
      for (const d of r.dims) {
        const a = acc[d.dim];
        a.sum += d.level; a.n++;
        if (d.level === 0) a.misses++;
        for (const ar of e.item.areas) a.areas.add(ar);
        a.periods.add(idx);
        const side = current ? a.cur : a.past;
        side.sum += d.level; side.n++;
        // Los ejemplos que se muestran son del periodo en curso (se pueden abrir); los anteriores solo cuentan.
        if (current) {
          const ex = { lv: d.level, item: e.item.id, subject: e.item.subject, note: d.note };
          if (!a.best || d.level > a.best.lv) a.best = ex;
          if (!a.worst || d.level < a.worst.lv) a.worst = ex;
        }
      }
    }
  });
  const E = LEADERSHIP_EVIDENCE;
  const sit = (n: number) => `${n} ${n === 1 ? "situación" : "situaciones"}`;
  const ar = (n: number) => `${n} ${n === 1 ? "área" : "áreas"}`;
  const per = (n: number) => `${n} ${n === 1 ? "periodo" : "periodos"}`;
  const competencies: CompetencyEvidence[] = JUDGMENT_DIMS.map((d) => {
    const a = acc[d];
    const score = a.n ? a.sum / a.n / 2 : null;
    const areas = a.areas.size, nP = a.periods.size;
    const enough = a.n >= E.minN && areas >= E.minAreas && nP >= E.minPeriods;
    const strong = score !== null && a.n >= E.strongN && areas >= E.strongAreas && nP >= E.strongPeriods && score >= E.strongScore && a.misses / a.n <= E.strongMaxMiss;
    const weak = score !== null && a.misses >= E.weakMisses && areas >= E.weakAreas && score < E.weakScore;
    const band: CompetencyEvidence["band"] = !a.n ? "sin_evidencia" : weak ? "por_desarrollar" : strong ? "fortaleza" : enough ? "en_desarrollo" : "tendencia";
    const lean: CompetencyEvidence["lean"] = band !== "tendencia" ? undefined : score! >= 0.7 ? "favorable" : score! < 0.45 ? "desfavorable" : "mixta";
    const base = `${sit(a.n)} de ${ar(areas)}${nP > 1 ? ` en ${per(nP)}` : ""}`;
    const why = band === "sin_evidencia" ? "Ninguna de tus decisiones ha pedido esta competencia todavía."
      : band === "fortaleza" ? `Lo hiciste bien de forma repetida: ${base}, con pocos tropiezos.`
      : band === "por_desarrollar" ? `La misma dificultad apareció ${a.misses} veces en situaciones distintas (${base}).`
      : band === "en_desarrollo" ? `${base}: hay evidencia suficiente, sin un patrón claro todavía.${score! >= E.strongScore && nP < E.strongPeriods ? " Para considerarla consistente falta verla en otro periodo." : ""}`
      : `${nP < E.minPeriods && a.n >= E.minN ? `${base[0].toUpperCase()}${base.slice(1)}, todas de un solo periodo` : `Solo ${base}`}: ${lean === "favorable" ? "apunta a bien" : lean === "desfavorable" ? "apunta a que cuesta" : "señales mezcladas"}, pero aún no alcanza para afirmarlo.`;
    const brief = band === "sin_evidencia" ? "Aún no te tocó una situación que la pida."
      : band === "fortaleza" ? `Bien de forma repetida: ${sit(a.n)} de ${ar(areas)}.`
      : band === "por_desarrollar" ? `Tropezaste ${a.misses} veces en situaciones distintas.`
      : band === "en_desarrollo" ? `${sit(a.n)[0].toUpperCase()}${sit(a.n).slice(1)}; aún sin patrón claro.`
      : `Solo ${sit(a.n)}: ${lean === "favorable" ? "apunta a bien" : lean === "desfavorable" ? "apunta a que cuesta" : "señales mezcladas"}.`;
    const change: CompetencyEvidence["change"] = a.cur.n >= E.trendN && a.past.n >= E.trendN
      ? (() => { const dlt = a.cur.sum / a.cur.n / 2 - a.past.sum / a.past.n / 2; return dlt >= E.trendDelta ? "mejora" : dlt <= -E.trendDelta ? "baja" : "estable"; })()
      : null;
    const strip = (x?: Ex) => (x ? { item: x.item, subject: x.subject, note: x.note } : undefined);
    return {
      dim: d, name: JUDGMENT_LABEL[d].name, question: JUDGMENT_LABEL[d].question, n: a.n, score, band, bandLabel: BAND_LABEL[band],
      areas, periods: nP, misses: a.misses, ...(lean ? { lean } : {}), why, brief, change,
      best: a.best && a.best.lv >= 2 ? strip(a.best) : undefined,
      weakest: a.worst && a.worst.lv === 0 ? strip(a.worst) : undefined,
    };
  });

  // 3 · resultados
  const k = kpis(s, now);
  const results = KPI_KEYS.map((x) => ({ kpi: x, start: pack.kpiStart[x], now: k[x], delta: k[x] - pack.kpiStart[x] }));

  const label = (k: KpiKey) => pack.kpiLabel[k];
  const strong = competencies.filter((c) => c.band === "fortaleza").map((c) => c.name.toLowerCase());
  const weak = competencies.filter((c) => c.band === "por_desarrollar").map((c) => c.name.toLowerCase());
  const leaning = competencies.filter((c) => c.band === "tendencia" && c.lean === "favorable").map((c) => c.name.toLowerCase());
  const marked = preferences.filter((p) => p.n >= LEADERSHIP_MIN_EVIDENCE && Math.abs(p.value) >= 15);
  const up = results.filter((r) => r.delta > 0).map((r) => label(r.kpi).toLowerCase());
  const down = results.filter((r) => r.delta < 0).map((r) => label(r.kpi).toLowerCase());
  const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
  return {
    decisions: decided.length,
    periods: withEvidence,
    decisionsAll,
    expired,
    preferences,
    competencies,
    results,
    summary: {
      preferencias: decided.length < LEADERSHIP_MIN_EVIDENCE ? "Todavía hay pocas decisiones para leer tus preferencias." : marked.length ? `Tus decisiones se inclinan hacia ${list(marked.map((p) => `«${p.value > 0 ? p.right : p.left}»`))}. Es estilo, no calificación.` : "No muestras una inclinación marcada: ajustas tu estilo según la situación.",
      competencias: !competencies.some((c) => c.n) ? "Aún no hay situaciones evaluadas." : `${strong.length ? `Fortaleza consistente en ${list(strong)}.` : `Todavía no hay fortalezas consistentes: para afirmarlo hace falta verlo en muchas situaciones distintas y en más de un periodo.${leaning.length ? ` Tendencia favorable en ${list(leaning)}.` : ""}`}${weak.length ? ` Área por desarrollar: ${list(weak)}.` : ""} Cada dimensión se mide solo donde la situación la pedía.`,
      resultados: `Desde que llegaste: ${up.length ? `subieron ${list(up)}` : "ningún indicador subió"}${down.length ? `; bajaron ${list(down)}` : ""}. El resultado se reporta aparte: no prueba por sí solo buen o mal criterio.`,
    },
  };
}
