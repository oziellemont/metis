/**
 * mêtis CEO · Balance por decisión, alertas de tendencia y diagnóstico de temporada (rediseño «criterio vs. resultados»).
 *
 * Funciones PURAS y de solo lectura sobre una partida. No cambian indicadores, XP ni veredicto: explican.
 *  - `timeline`: la historia de los indicadores decisión por decisión (mismo orden y mismo redondeo que `kpis()`).
 *  - `decisionBalance`: qué ganaste, qué pagaste y qué riesgo quedó abierto en cada decisión.
 *  - `alertsAt`: avisos cuando una estrategia va desgastando un indicador (antes de que sea tarde).
 *  - `seasonDiagnosis`: al cierre, qué patrones de decisión explican el resultado, separado de la calidad del criterio.
 */
import { KPI_KEYS, KPI_LABEL, cashFlowOf, changeKpiEffect, effectOf, entries, episodeEffectOf, episodeEntries, packOf, rulesFor, verdictOf } from "./engine";
import { rulesVersionOf, ruleSet } from "./engine";
import { SEASON_OBJECTIVES } from "./objectives";
import type { Axis, CeoState, Entry, KpiKey, Kpis, Option } from "./types";

export type EventKind = "decision" | "vencido" | "caso" | "cambio" | "flujo";
export interface TimelineEvent {
  kind: EventKind;
  id: string;
  label: string;
  /** Efecto ya ajustado al nivel de exigencia. */
  eff: Partial<Kpis>;
  /** Puntos que no contaron porque el indicador ya estaba en 0 o en 100. */
  wasted: Partial<Kpis>;
  before: Kpis;
  after: Kpis;
  option?: Option;
  entry?: Entry;
  /** Cuándo se aplicó (tiempo de juego). Null en el ajuste de cierre. */
  at: number | null;
  /** Dónde ver el origen (caso, episodio, proyecto de cambio). */
  href: string | null;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const KPI_NAME = (k: KpiKey) => KPI_LABEL[k].toLowerCase();

/** Historia de indicadores. El último `after` coincide exactamente con `kpis(s, now)`. */
export function timeline(s: CeoState, now: number): { start: Kpis; events: TimelineEvent[]; end: Kpis } {
  const start = { ...packOf(s).kpiStart };
  let k = { ...start };
  const events: TimelineEvent[] = [];
  const push = (kind: EventKind, id: string, label: string, eff: Partial<Kpis>, extra: Partial<TimelineEvent> = {}) => {
    if (!Object.keys(eff).length && kind !== "decision") return;
    const before = { ...k };
    const wasted: Partial<Kpis> = {};
    for (const key of Object.keys(eff) as KpiKey[]) {
      const raw = k[key] + (eff[key] ?? 0);
      k[key] = clamp(raw);
      const lost = Math.round(raw) - k[key];
      if (lost) wasted[key] = lost;
    }
    events.push({ kind, id, label, eff, wasted, before, after: { ...k }, at: null, href: null, ...extra });
  };
  for (const e of entries(s, now)) {
    if (e.status !== "decidido" && e.status !== "vencido") continue;
    const at = e.status === "decidido" ? e.agreement?.resolved ? Math.max(e.decision!.at, e.agreement.respondsAt) : e.decision!.at : e.deadline;
    push(e.status === "decidido" ? "decision" : "vencido", e.item.id, e.item.subject, effectOf(s, e), { option: e.option, entry: e, at, href: `/ceo/caso/${e.item.id}` });
  }
  for (const e of episodeEntries(s, now)) push("caso", e.spec.id, e.spec.title ?? e.spec.id, episodeEffectOf(s, e), { at: e.run?.closedAt ?? null, href: `/ceo/episodio/${e.spec.id}` });
  push("cambio", "cambio", "Proyecto de cambio", changeKpiEffect(s), { at: s.change?.closedAt ?? s.change?.moves.at(-1)?.at ?? null, href: "/ceo/cambio" });
  // Reglas V5: al cierre, el margen se convierte en caja (0 en reglas anteriores o si no ha cerrado).
  const cf = cashFlowOf(s, k);
  if (cf) push("flujo", "flujo", "Flujo de caja del año", { caja: cf });
  return { start, events, end: k };
}

// ───────────────────────────────────────────── balance por decisión
export interface DecisionBalance {
  benefits: { kpi: KpiKey; delta: number; text: string }[];
  costs: { kpi: KpiKey; delta: number; text: string }[];
  /** Riesgos que quedan abiertos (indicador cerca de la línea, relaciones dañadas, lo que el caso advierte). */
  risks: string[];
  /** Puntos desperdiciados por saturación (p. ej., equipo ya en 100). */
  wasted: { kpi: KpiKey; points: number }[];
}

/** Lo que una opción gana, cuesta y deja en riesgo, dado el tablero de ese momento. Sirve antes (vista previa) y después. */
export function decisionBalance(o: Pick<Option, "effects" | "stance">, before: Kpis, line: number, names: Record<string, string> = {}, authoredRisks: string[] = []): DecisionBalance {
  const benefits: DecisionBalance["benefits"] = [];
  const costs: DecisionBalance["costs"] = [];
  const wasted: DecisionBalance["wasted"] = [];
  const risks = [...authoredRisks];
  for (const key of KPI_KEYS) {
    const d = o.effects[key] ?? 0;
    if (!d) continue;
    const after = clamp(before[key] + d);
    if (d > 0) {
      const lost = before[key] + d - after;
      benefits.push({ kpi: key, delta: d, text: `${KPI_LABEL[key]} +${d}` });
      if (lost > 0) wasted.push({ kpi: key, points: lost });
    } else {
      costs.push({ kpi: key, delta: d, text: `${KPI_LABEL[key]} ${d}` });
      if (after < line) risks.push(`${KPI_LABEL[key]} queda en ${after}, por debajo de la línea de ${line}.`);
      else if (after < line + 5) risks.push(`${KPI_LABEL[key]} queda en ${after}, a ${after - line} puntos de la línea.`);
    }
  }
  for (const [who, v] of Object.entries(o.stance ?? {})) if (v <= -2) risks.push(`La relación con ${names[who] ?? who} se daña (${v}); puede cobrártela después.`);
  return { benefits, costs, risks, wasted };
}

// ───────────────────────────────────────────── alertas de tendencia
export type AlertLevel = "aviso" | "riesgo" | "critico";
export interface TrendAlert {
  kpi: KpiKey;
  level: AlertLevel;
  kind: "tendencia" | "desgaste" | "zona_de_riesgo" | "bajo_la_linea" | "saturacion";
  text: string;
  /** Decisiones que más contribuyeron (ids de asunto). */
  causes: string[];
}

export const ALERT_RULES = Object.freeze({
  version: 1,
  /** Ventana de decisiones recientes que tocan el indicador. */
  window: 4,
  /** Cuántas de esa ventana deben haberlo bajado para hablar de tendencia. */
  negatives: 3,
  /** La tendencia solo se avisa si el indicador está a menos de esto de la línea. */
  trendMargin: 12,
  /** Zona de riesgo: a menos de esto de la línea. */
  riskMargin: 5,
  /** Desgaste acumulado desde el arranque que amerita aviso aunque el indicador siga sano. */
  drain: 12,
  /** Puntos desperdiciados por saturación que ameritan aviso. */
  saturation: 6,
});

/** Avisos con lo que ha pasado hasta `now`. */
export function alertsAt(s: CeoState, now: number): TrendAlert[] {
  const tl = timeline(s, now);
  const line = rulesFor(s).passLine;
  const out = alertsOf(tl, line);
  const R5 = ruleSet(rulesVersionOf(s)).v5;
  if (!R5) return out;
  // V5: debajo de la línea solo reprueba si es un objetivo del consejo, si cae bajo el piso o en insolvencia.
  const objectives = SEASON_OBJECTIVES[s.company]?.kpis ?? [];
  const floor = line - R5.verdict.floorBelowLine;
  return out.map((a) => {
    if (a.kind !== "bajo_la_linea") return a;
    const v = tl.end[a.kpi];
    if (a.kpi === "caja" && v < R5.verdict.insolvency) return { ...a, text: `${KPI_LABEL.caja} está en ${v}: zona de insolvencia (menos de ${R5.verdict.insolvency}). Si cierras así, no apruebas aunque lo demás esté bien.` };
    if (objectives.includes(a.kpi)) return { ...a, text: `${KPI_LABEL[a.kpi]} está en ${v}, debajo de la línea de ${line}, y es uno de los objetivos que te encargó el consejo. Si cierras así, no apruebas.` };
    if (v < floor) return { ...a, text: `${KPI_LABEL[a.kpi]} está en ${v}, debajo del piso de ${floor}. Si cierras así, no apruebas: no se puede sacrificar un indicador por completo.` };
    return { ...a, level: "riesgo" as const, text: `${KPI_LABEL[a.kpi]} está en ${v}, debajo de la línea de ${line}. No es uno de tus objetivos, pero si baja de ${floor} reprueba y además pesa en la salud de la empresa.` };
  });
}

export function alertsOf(tl: ReturnType<typeof timeline>, line: number): TrendAlert[] {
  const out: TrendAlert[] = [];
  const R = ALERT_RULES;
  for (const k of KPI_KEYS) {
    const v = tl.end[k];
    const touching = tl.events.filter((e) => (e.eff[k] ?? 0) !== 0);
    const recent = touching.slice(-R.window);
    const neg = recent.filter((e) => (e.eff[k] ?? 0) < 0);
    const causes = touching.filter((e) => (e.eff[k] ?? 0) < 0).sort((a, b) => (a.eff[k] ?? 0) - (b.eff[k] ?? 0)).slice(0, 3).map((e) => e.id);
    const drop = tl.start[k] - v;
    if (v < line) out.push({ kpi: k, level: "critico", kind: "bajo_la_linea", text: `${KPI_LABEL[k]} está en ${v}, por debajo de la línea de ${line}. Si cierras así, este indicador no aprueba.`, causes });
    else if (v < line + R.riskMargin) out.push({ kpi: k, level: "riesgo", kind: "zona_de_riesgo", text: `${KPI_LABEL[k]} está en ${v}: a ${v - line} puntos de la línea. Una decisión más que lo cueste y queda abajo.`, causes });
    else if (neg.length >= R.negatives && v < line + R.trendMargin) out.push({ kpi: k, level: "aviso", kind: "tendencia", text: `${neg.length} de tus últimas ${recent.length} decisiones que tocan ${KPI_NAME(k)} lo bajaron. Va en ${v}; a este ritmo cruza la línea antes de cerrar.`, causes: neg.map((e) => e.id) });
    else if (drop >= R.drain) out.push({ kpi: k, level: "aviso", kind: "desgaste", text: `${KPI_LABEL[k]} ha bajado ${drop} puntos desde que llegaste (de ${tl.start[k]} a ${v}). Ningún costo aislado fue grave; la suma sí.`, causes });
    const lost = tl.events.reduce((a, e) => a + Math.max(0, e.wasted[k] ?? 0), 0);
    if (lost >= R.saturation) out.push({ kpi: k, level: "aviso", kind: "saturacion", text: `${KPI_LABEL[k]} ya está al tope: ${lost} puntos de lo que sumaste ahí no contaron. Lo que inviertas en ${KPI_NAME(k)} rinde más en otro indicador.`, causes: [] });
  }
  return out;
}

// ───────────────────────────────────────────── diagnóstico de temporada
export interface KpiStory {
  kpi: KpiKey;
  start: number;
  end: number;
  passed: boolean;
  bySource: Record<EventKind, number>;
  wasted: number;
  worst: { id: string; label: string; delta: number }[];
  best: { id: string; label: string; delta: number }[];
}
export interface Pattern { id: string; text: string; count: number; of: number }
export interface SeasonDiagnosis {
  /** B · resultado del negocio (veredicto vigente). */
  result: { passed: boolean; kpis: Kpis; line: number; failed: KpiKey[] };
  /** A · calidad del criterio (promedio de criterio de lo que decidiste, 0–3), independiente del resultado. */
  judgment: { average: number; decided: number; expired: number; level: "alto" | "medio" | "bajo" };
  /** Cuadrante criterio × resultado, con el mensaje que corresponde. */
  quadrant: "criterio_y_resultado" | "criterio_sin_resultado" | "resultado_sin_criterio" | "ni_criterio_ni_resultado";
  stories: KpiStory[];
  patterns: Pattern[];
  /** Explicación en lenguaje llano (3 a 6 frases). */
  summary: string[];
}

const AXIS_TEXT: Record<Axis, [string, string]> = {
  horizonte: ["resolver lo inmediato", "apostar al largo plazo"],
  riesgo: ["proteger lo que ya tienes", "tomar riesgos"],
  foco: ["cuidar los números", "cuidar a las personas"],
  estilo: ["decidir tú solo", "construir con otros"],
  conflicto: ["evitar el choque", "enfrentar el conflicto"],
};

export function seasonDiagnosis(s: CeoState, now: number): SeasonDiagnosis {
  const tl = timeline(s, now);
  const v = verdictOf(s, now);
  const line = v.passLine;
  const failed = KPI_KEYS.filter((k) => v.kpis[k] < line);
  const decisions = tl.events.filter((e) => e.kind === "decision");
  const expired = tl.events.filter((e) => e.kind === "vencido").length;
  const avg = decisions.length ? decisions.reduce((a, e) => a + (e.option?.score ?? 0), 0) / decisions.length : 0;
  const judgment = { average: Math.round(avg * 100) / 100, decided: decisions.length, expired, level: (avg >= 2.4 && expired <= 2 ? "alto" : avg >= 1.8 ? "medio" : "bajo") as "alto" | "medio" | "bajo" };

  const stories: KpiStory[] = KPI_KEYS.map((k) => {
    const bySource: Record<EventKind, number> = { decision: 0, vencido: 0, caso: 0, cambio: 0, flujo: 0 };
    let wasted = 0;
    for (const e of tl.events) { bySource[e.kind] += e.after[k] - e.before[k]; wasted += Math.max(0, e.wasted[k] ?? 0); }
    const touched = tl.events.filter((e) => (e.eff[k] ?? 0) !== 0).map((e) => ({ id: e.id, label: e.label, delta: e.eff[k] ?? 0 }));
    return {
      kpi: k, start: tl.start[k], end: tl.end[k], passed: tl.end[k] >= line, bySource, wasted,
      worst: touched.filter((x) => x.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3),
      best: touched.filter((x) => x.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3),
    };
  });

  const patterns: Pattern[] = [];
  const n = decisions.length;
  for (const k of KPI_KEYS) {
    const spent = decisions.filter((e) => (e.eff[k] ?? 0) < 0).length;
    const gained = decisions.filter((e) => (e.eff[k] ?? 0) > 0).length;
    if (n && spent >= Math.max(4, n * 0.4) && gained <= spent / 3) patterns.push({ id: `gasta_${k}`, text: `En ${spent} de ${n} decisiones elegiste caminos que cuestan ${KPI_NAME(k)} y casi nunca uno que lo repusiera (${gained}).`, count: spent, of: n });
  }
  const highButCostly = decisions.filter((e) => (e.option?.score ?? 0) >= 3 && failed.some((k) => (e.eff[k] ?? 0) < 0));
  if (failed.length && highButCostly.length >= 3) patterns.push({ id: "criterio_con_costo", text: `${highButCostly.length} decisiones bien razonadas tenían un costo en ${failed.map(KPI_NAME).join(" y ")} que no compensaste después. El criterio era bueno; la suma de costos, no.`, count: highButCostly.length, of: n });
  const lostPts = stories.filter((x) => x.wasted >= ALERT_RULES.saturation);
  for (const x of lostPts) patterns.push({ id: `satura_${x.kpi}`, text: `${KPI_LABEL[x.kpi]} llegó al tope y ${x.wasted} puntos que le sumaste no contaron: esa inversión pudo ir a ${failed.length ? failed.map(KPI_NAME).join(" o ") : "otro indicador"}.`, count: x.wasted, of: 0 });
  if (expired >= 3) patterns.push({ id: "vencidos", text: `Dejaste vencer ${expired} asuntos. No responder también decide, y casi siempre mal.`, count: expired, of: n + expired });
  const axes = Object.keys(AXIS_TEXT) as Axis[];
  for (const a of axes) {
    const xs = decisions.map((e) => e.option?.style?.[a] ?? 0).filter((x) => x !== 0);
    if (xs.length < 5) continue;
    const m = xs.reduce((p, q) => p + q, 0) / xs.length;
    if (Math.abs(m) >= 1) patterns.push({ id: `estilo_${a}`, text: `Tu estilo se cargó a ${AXIS_TEXT[a][m > 0 ? 1 : 0]} (${xs.length} decisiones). Es una fortaleza hasta que la situación pide lo contrario.`, count: xs.length, of: n });
  }

  const passed = v.passed;
  // V5: el criterio es la proporción de asuntos bien razonados que exige el veredicto.
  const good = v.v5 ? v.v5.judgment.ratio >= v.v5.judgment.min : judgment.level !== "bajo";
  // Eje B (resultado del negocio): en V5 es la parte de negocio del veredicto, separada del criterio.
  const biz = v.v5 ? v.v5.business : passed;
  const quadrant: SeasonDiagnosis["quadrant"] = good && biz ? "criterio_y_resultado" : good ? "criterio_sin_resultado" : biz ? "resultado_sin_criterio" : "ni_criterio_ni_resultado";
  const summary: string[] = [];
  if (v.v5) summary.push(passed ? `Aprobaste: cumpliste lo que el consejo te encargó, la empresa cerró sana y ${v.v5.judgment.good} de ${v.v5.judgment.total} asuntos estuvieron bien razonados.` : `No aprobaste. ${v.v5.why.join(" ")}`);
  else summary.push(passed ? `Aprobaste: los cinco indicadores cerraron en ${line} o más.` : `No aprobaste: ${failed.map((k) => `${KPI_NAME(k)} cerró en ${v.kpis[k]}`).join(", ")} (la línea es ${line}).`);
  for (const st of stories.filter((x) => !x.passed)) {
    const src = (Object.entries(st.bySource) as [EventKind, number][]).filter(([, d]) => d < 0).sort((a, b) => a[1] - b[1]).map(([kind, d]) => `${({ decision: "tus decisiones", vencido: "lo que dejaste vencer", caso: "los casos ejecutivos", cambio: "el proyecto de cambio", flujo: "el flujo de caja" } as const)[kind]} (${d})`);
    summary.push(`${KPI_LABEL[st.kpi]} bajó de ${st.start} a ${st.end} por ${src.join(", ") || "costos repartidos"}. Lo que más pesó: ${st.worst.map((w) => `«${w.label}» (${w.delta})`).join(", ") || "ninguna decisión aislada"}.`);
  }
  for (const p of patterns.slice(0, 3)) summary.push(p.text);
  summary.push(({
    criterio_y_resultado: "Tu criterio fue sólido y el negocio lo reflejó.",
    criterio_sin_resultado: "Tu criterio fue sólido, pero el resultado no alcanzó: buenas decisiones también tienen costos, y aquí se acumularon sin compensarse. Eso se aprende; no es lo mismo que decidir mal.",
    resultado_sin_criterio: "El negocio cerró bien, pero con decisiones poco razonadas: esta vez el resultado acompañó; no siempre lo hará.",
    ni_criterio_ni_resultado: "Ni el razonamiento ni el resultado alcanzaron: revisa los asuntos que más pesaron y qué alternativa defendible tenías.",
  } as const)[quadrant]);
  return { result: { passed, kpis: v.kpis, line, failed }, judgment, quadrant, stories, patterns, summary };
}
