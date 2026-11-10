/**
 * mêtis CEO · cómo se leen los números de la empresa en pantalla (P0-C).
 * Funciones puras: formato por unidad, variaciones contra el mes anterior y una línea de lectura.
 * Nada de esto cambia la simulación; solo la presenta.
 */
import { formatMoney, toDisplay, type DisplayCurrency } from "../career/money";
import type { Business } from "./index";
import type { MetricUnit, OpsMetricDef } from "./profiles";
import type { PeriodState } from "./model";

const nf = (v: number, d: number) => v.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
const minus = (s: string) => s.replace(/^-/, "−");

/** «Mes 0 · llegada», «Mes 2», «Mes 3 · en curso». */
export function periodLabel(p: PeriodState): string {
  if (p.status === "llegada") return "Llegada";
  return p.status === "en_curso" ? `Mes ${p.period} · en curso` : `Mes ${p.period}`;
}

/** Valor de una métrica de operación con su unidad. */
export function formatMetric(v: number, unit: MetricUnit, cur: DisplayCurrency = "MXN"): string {
  switch (unit) {
    case "%": return minus(`${nf(v, 1)} %`);
    case "dias": return `${nf(v, 0)} días`;
    case "ppm": return `${nf(v, 0)} ppm`;
    case "mxn": return `$${nf(v, 0)}`;
    case "meses": return `${nf(v, 1)} meses`;
    case "M": return formatMoney(v, cur);
  }
}

export type Tone = "good" | "bad" | "flat";
export interface Change { text: string; tone: Tone }

/** Variación de una métrica contra el mes anterior, con color según si «más» es mejor o peor. */
export function metricChange(m: Pick<OpsMetricDef, "unit" | "better">, now: number, prev: number, cur: DisplayCurrency = "MXN"): Change {
  const d = now - prev;
  const eps = m.unit === "%" || m.unit === "meses" ? 0.05 : m.unit === "M" ? 0.005 : 0.5;
  if (Math.abs(d) < eps) return { text: "sin cambio", tone: "flat" };
  const sign = d > 0 ? "+" : "−";
  const a = Math.abs(d);
  const text = m.unit === "%" ? `${sign}${nf(a, 1)} pts`
    : m.unit === "M" ? `${sign}${formatMoney(a, cur)}`
    : m.unit === "mxn" ? `${sign}$${nf(a, 0)}`
    : m.unit === "meses" ? `${sign}${nf(a, 1)}`
    : `${sign}${nf(a, 0)}`;
  const up = d > 0;
  return { text, tone: up === (m.better === "up") ? "good" : "bad" };
}

/** Variación porcentual de dinero (ventas, clientes): «+1.2 %». */
export function pctChange(now: number, prev: number): Change {
  if (!prev) return { text: "—", tone: "flat" };
  const r = (now / prev - 1) * 100;
  if (Math.abs(r) < 0.05) return { text: "sin cambio", tone: "flat" };
  return { text: `${r > 0 ? "+" : "−"}${nf(Math.abs(r), 1)} %`, tone: r > 0 ? "good" : "bad" };
}

/** Distancia a la meta de una métrica: «en meta» o «faltan 3 pts». */
export function metricVsTarget(m: Pick<OpsMetricDef, "unit" | "better" | "target">, v: number, cur: DisplayCurrency = "MXN"): Change | null {
  if (m.target === undefined) return null;
  const ok = m.better === "up" ? v >= m.target : v <= m.target;
  if (ok) return { text: "en meta", tone: "good" };
  return { text: `meta ${formatMetric(m.target, m.unit, cur)}`, tone: "bad" };
}

/** Meses de pista legibles. */
export function runwayText(p: PeriodState): string {
  if (p.runwayMonths === null) return "La operación genera caja";
  if (p.runwayMonths >= 24) return "Más de 24 meses de pista";
  return `${nf(p.runwayMonths, 1)} meses de pista`;
}

/** Una lectura de dos o tres frases del último mes cerrado (o tu llegada), sin adjetivos de más. */
export function narrative(b: Business, cur: DisplayCurrency = "MXN"): string {
  const c = b.closed;
  const first = c.status === "llegada";
  const parts: string[] = [];
  parts.push(first
    ? `Al llegar, la empresa vende ${formatMoney(c.revenue, cur)} al mes con margen bruto de ${nf(c.grossMargin * 100, 0)} %.`
    : `En el mes ${c.period} vendiste ${formatMoney(c.revenue, cur)}, ${vsTarget(c)} de la meta.`);
  parts.push(c.ebitda >= 0
    ? `El EBITDA fue de ${formatMoney(c.ebitda, cur)}.`
    : `El EBITDA fue negativo: ${formatMoney(c.ebitda, cur)}.`);
  parts.push(c.runwayMonths === null
    ? `La caja cerró en ${formatMoney(c.cashEnd, cur)} y la operación no la consume.`
    : `La caja cerró en ${formatMoney(c.cashEnd, cur)}: alcanza para ${nf(c.runwayMonths, 1)} meses al ritmo actual.`);
  if (first) parts.push("Cada periodo que cierres suma un mes a esta historia.");
  return parts.join(" ");
}

function vsTarget(p: PeriodState): string {
  const r = (p.revenue / p.revenueTarget - 1) * 100;
  if (Math.abs(r) < 0.5) return "en línea";
  return `${nf(Math.abs(r), 1)} % ${r > 0 ? "arriba" : "abajo"}`;
}

// ───────────────────────────────────────────── estados que cuadran a simple vista
/**
 * Estado de resultados y flujo de un mes, ya en la moneda de pantalla y redondeados a la MISMA precisión.
 * Los totales (EBITDA, caja al cierre) son los reales redondeados; la diferencia de redondeo se absorbe en el
 * renglón «Otros gastos» / «Salidas», así la suma de lo que se ve siempre da el total que se ve.
 */
export interface Statement {
  digits: number;
  revenue: number; cogs: number; gross: number; payroll: number; marketing: number; other: number; ebitda: number;
  cashBegin: number; inflows: number; outflows: number; cashEnd: number;
}
export function statementDigits(p: Pick<PeriodState, "revenue" | "cashEnd">, cur: DisplayCurrency = "MXN"): number {
  const a = Math.max(Math.abs(toDisplay(p.revenue, cur)), Math.abs(toDisplay(p.cashEnd, cur)));
  return a >= 1000 ? 0 : a >= 1 ? 1 : 2;
}
export function statementOf(p: PeriodState, cur: DisplayCurrency = "MXN", digits = statementDigits(p, cur)): Statement {
  const f = 10 ** digits;
  const r = (v: number) => Math.round(toDisplay(v, cur) * f) / f;
  const fix = (v: number) => Math.round(v * f) / f;
  const revenue = r(p.revenue), cogs = r(p.revenue - p.grossProfit), gross = fix(revenue - cogs);
  const payroll = r(p.payroll), marketing = r(p.marketing), ebitda = r(p.ebitda);
  const other = fix(gross - payroll - marketing - ebitda);
  const cashBegin = r(p.cashBegin), inflows = r(p.inflows), cashEnd = r(p.cashEnd);
  const outflows = fix(cashBegin + inflows - cashEnd);
  return { digits, revenue, cogs, gross, payroll, marketing, other, ebitda, cashBegin, inflows, outflows, cashEnd };
}
/** Cifra ya convertida y redondeada: «$15.5 M MXN», «−$0.2 M USD». */
export function moneyAt(v: number, cur: DisplayCurrency, digits: number): string {
  const n = Math.abs(v).toLocaleString("es-MX", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${v < 0 && Math.abs(v) >= 0.5 / 10 ** digits ? "−" : ""}$${n} M ${cur}`;
}
/** Etapa de un mes con nombre claro: lo que había al llegar, un mes ya cerrado o la proyección del mes en curso. */
export type PeriodStage = "historico" | "cierre" | "proyeccion";
export const STAGE_LABEL: Record<PeriodStage, string> = { historico: "Histórico", cierre: "Cierre definitivo", proyeccion: "Proyección" };
export const stageOf = (p: Pick<PeriodState, "status">): PeriodStage => (p.status === "llegada" ? "historico" : p.status === "en_curso" ? "proyeccion" : "cierre");
/** «Al llegar», «Mes 2», «Mes 3». */
export const monthName = (p: Pick<PeriodState, "status" | "period">) => (p.status === "llegada" ? "Al llegar" : `Mes ${p.period}`);

// ───────────────────────────────────────────── tabla ejecutiva de operación
export type OpsStatus = "meta" | "cerca" | "fuera" | "sin_meta";
export const OPS_STATUS_LABEL: Record<OpsStatus, string> = { meta: "En meta", cerca: "Cerca", fuera: "Fuera de meta", sin_meta: "Sin meta" };
export interface OpsRow {
  def: OpsMetricDef;
  value: number;
  /** Valor al llegar. */
  start: number;
  /** Mes cerrado anterior (para la tendencia). */
  prev: number | null;
  status: OpsStatus;
  /** Distancia relativa a la meta (0 = en meta). */
  gap: number;
  /** Prioridad: distancia × peso si la mueve un índice que vigila el consejo. */
  impact: number;
  top: boolean;
}
/** Cerca = a 5 % o menos de la meta. */
export const OPS_NEAR = 0.05;
/**
 * KPI operativos del mes en curso (proyección con lo que llevas decidido), ordenados por impacto real: primero los más lejos de su meta (con más
 * peso si los mueve un índice que el consejo vigila), luego los que ya están en meta y al final los que no tienen meta.
 * Los dos de mayor impacto se marcan para que no todo se lea igual de urgente.
 */
export function opsRowsOf(b: Business, focus: readonly string[] = []): OpsRow[] {
  const { periods } = b;
  const cur = b.now;
  const i = periods.indexOf(cur);
  const prevP = i > 0 ? periods[i - 1] : null;
  const rows: OpsRow[] = b.profile.metrics.map((def) => {
    const value = cur.opsMetrics[def.id], start = periods[0].opsMetrics[def.id], prev = prevP ? prevP.opsMetrics[def.id] : null;
    if (def.target === undefined) return { def, value, start, prev, status: "sin_meta", gap: 0, impact: -1, top: false };
    const met = def.better === "up" ? value >= def.target : value <= def.target;
    const gap = met ? 0 : Math.abs(def.target - value) / Math.max(Math.abs(def.target), 1);
    const w = def.driver && focus.includes(def.driver.kpi) ? 1.5 : 1;
    return { def, value, start, prev, status: met ? "meta" : gap <= OPS_NEAR ? "cerca" : "fuera", gap, impact: gap * w, top: false };
  });
  rows.sort((a, b) => b.impact - a.impact);
  rows.filter((r) => r.status === "fuera" || r.status === "cerca").slice(0, 2).forEach((r) => { r.top = true; });
  return rows;
}
/** «0 de 5 KPI en meta». */
export function opsScore(rows: OpsRow[]): { met: number; total: number } {
  const withTarget = rows.filter((r) => r.status !== "sin_meta");
  return { met: withTarget.filter((r) => r.status === "meta").length, total: withTarget.length };
}
