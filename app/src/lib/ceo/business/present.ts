/**
 * mêtis CEO · cómo se leen los números de la empresa en pantalla (P0-C).
 * Funciones puras: formato por unidad, variaciones contra el mes anterior y una línea de lectura.
 * Nada de esto cambia la simulación; solo la presenta.
 */
import { formatMoney, type DisplayCurrency } from "../career/money";
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
