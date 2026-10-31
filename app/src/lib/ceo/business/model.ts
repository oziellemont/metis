/**
 * mêtis CEO · motor de negocio mínimo (P0-C). Lógica pura, sin React.
 *
 * Reglas (plan P0-A §4.3):
 *  - Se guarda lo mínimo y se reconstruye todo: la línea base sale del perfil × tipo de empresa; cada mes cerrado
 *    suma los efectos de lo que pasó en él (índices de salud del periodo y asignaciones de caja).
 *  - Identidad de caja en cada mes: cashEnd = cashBegin + inflows − outflows. Lo verifica una prueba.
 *  - Determinista: la variación natural viene de una semilla `companyId|periodo|métrica`. Mismo estado, mismo resultado.
 *  - Índice ≠ dinero: un índice (0–100) es salud; los números están en millones de MXN. Los índices MUEVEN los números
 *    con coeficientes explícitos (ASSUMPTIONS), pero nunca se muestran como lo mismo.
 *  - Supuestos versionados y congelados: para cambiar un coeficiente se agrega una versión nueva.
 */
import type { CompanyArchetype } from "../career/taxonomy";
import type { KpiKey, Kpis } from "../types";
import { metricBase, type Baseline, type BusinessProfile } from "./profiles";


// ───────────────────────────────────────────── supuestos v1
export interface Assumptions {
  version: number;
  /** Puntos de margen bruto por punto de cambio del índice Margen en el mes (0.001 = 0.1 pp). */
  marginPerPoint: number;
  /** Tope de desviación del margen bruto contra la base (± proporción). */
  marginBand: number;
  /** Crecimiento mensual extra por punto de cambio del índice Clientes. */
  growthPerClientPoint: number;
  /** Días de cobro que bajan por punto de cambio del índice Caja (cobranza y plazos). */
  dsoPerCashPoint: number;
  /** Variación natural de la demanda (± crecimiento mensual). */
  demandNoise: number;
  /** Marketing: crecimiento extra = elasticidad × (marketing adicional / ventas), con retraso y duración (plan §4.4: +0.20 sobre 4.08 → ≈ +3%). */
  marketingElasticity: number; marketingLag: number; marketingMonths: number;
  /** Internacional: crecimiento extra por peso invertido sobre ventas, con más retraso. */
  intlElasticity: number; intlLag: number;
  /** Capex: margen bruto extra por cada peso invertido sobre las ventas del mes, a partir de `capexLag`. */
  capexMarginPerRevenue: number; capexLag: number;
  /** Deuda: interés mensual. */
  debtRate: number;
}
export const ASSUMPTIONS: Readonly<Record<number, Assumptions>> = Object.freeze({
  1: Object.freeze({
    version: 1,
    marginPerPoint: 0.001, marginBand: 0.08,
    growthPerClientPoint: 0.0005,
    dsoPerCashPoint: 0.3,
    demandNoise: 0.003,
    marketingElasticity: 0.6, marketingLag: 1, marketingMonths: 3,
    intlElasticity: 0.4, intlLag: 2,
    capexMarginPerRevenue: 0.01, capexLag: 2,
    debtRate: 0.01,
  }),
});
export const ASSUMPTIONS_VERSION = 1;
export const assumptionsOf = (v: number = ASSUMPTIONS_VERSION): Assumptions => ASSUMPTIONS[v] ?? ASSUMPTIONS[ASSUMPTIONS_VERSION];

// ───────────────────────────────────────────── asignaciones de caja (las escribe P0-D)
export const LEVERS = ["contratar", "marketing", "internacional", "capex", "reserva", "deuda"] as const;
export type Lever = (typeof LEVERS)[number];
export interface Allocation {
  id: string;
  /** Mes en que se decidió (el efecto empieza en el siguiente). */
  period: number;
  lever: Lever;
  /** Millones de MXN, ADICIONALES a la base: por mes (contratar, marketing, internacional) o único (capex, deuda, reserva). */
  amount: number;
  months?: number;
}
export interface BusinessLog { assumptionsVersion: number; allocations: Allocation[] }

// ───────────────────────────────────────────── resultado
export type PeriodStatus = "llegada" | "cerrado" | "en_curso";
export interface PeriodState {
  period: number;
  status: PeriodStatus;
  revenue: number; revenueTarget: number; growth: number;
  grossMargin: number; grossProfit: number;
  payroll: number; marketing: number; otherOpex: number; ebitda: number;
  /** Cambio de cuentas por cobrar del mes (positivo = caja atrapada en clientes). */
  workingCapital: number; receivables: number; dso: number;
  capex: number; interest: number; debt: number;
  cashBegin: number; inflows: number; outflows: number; cashEnd: number;
  /** Meses de pista al consumo del mes; null si el mes no consumió caja. */
  runwayMonths: number | null;
  clients: number; headcount: number;
  opsMetrics: Record<string, number>;
  /** Cambio de los índices de salud durante el mes (lo que movió los números). */
  kpiDelta: Partial<Record<KpiKey, number>>;
}

/** Lo que pasó en un mes: cuánto se movieron los índices de salud. */
export interface PeriodInput { kpiDelta: Partial<Kpis>; status: "cerrado" | "en_curso" }

export interface SimOptions { seed: string; archetype: CompanyArchetype; assumptionsVersion?: number; allocations?: Allocation[]; noise?: boolean }

// FNV-1a → [−1, 1]
function jitter(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return (h / 0xffffffff) * 2 - 1;
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r4 = (v: number) => Math.round(v * 10000) / 10000;

/** Asignaciones activas en un mes: [monto mensual, meses desde que empezó el efecto]. */
function active(allocs: Allocation[], lever: Lever, period: number, lag = 1, months?: number): { amount: number; since: number }[] {
  return allocs.filter((a) => a.lever === lever).flatMap((a) => {
    const start = a.period + lag;
    const len = a.months ?? months ?? 1;
    const since = period - start;
    return since >= 0 && since < len ? [{ amount: a.amount, since }] : [];
  });
}

/**
 * Simula la empresa mes por mes. Mes 0 = tu llegada (la línea base). Después, un mes por cada entrada.
 * Puro y determinista.
 */
export function simulate(profile: BusinessProfile, inputs: PeriodInput[], o: SimOptions): PeriodState[] {
  const A = assumptionsOf(o.assumptionsVersion);
  const B: Baseline = profile.baselines[o.archetype];
  const allocs = (o.allocations ?? []).filter((a) => a.amount > 0 && Number.isFinite(a.amount));
  const noise = o.noise !== false;
  const out: PeriodState[] = [];

  // Mes 0: así recibes la empresa (cuentas por cobrar estables, sin cambio de capital de trabajo).
  const ar0 = (B.revenue * B.dso) / 30;
  const payroll0 = B.headcount * B.costPerHead;
  const other0 = B.otherFixed + B.otherVar * B.revenue;
  const gp0 = B.revenue * B.grossMargin;
  const capex0 = B.capexPct * B.revenue;
  const in0 = B.revenue, outf0 = B.revenue - gp0 + payroll0 + B.marketing + other0 + capex0;
  const ops0: Record<string, number> = {};
  for (const m of profile.metrics) ops0[m.id] = m.fromRevenue ? r4(B.revenue * m.fromRevenue) : metricBase(m, o.archetype);
  out.push({
    period: 0, status: "llegada", revenue: B.revenue, revenueTarget: B.revenue, growth: 0,
    grossMargin: B.grossMargin, grossProfit: r4(gp0), payroll: r4(payroll0), marketing: B.marketing, otherOpex: r4(other0), ebitda: r4(gp0 - payroll0 - B.marketing - other0),
    workingCapital: 0, receivables: r4(ar0), dso: B.dso, capex: r4(capex0), interest: 0, debt: 0,
    cashBegin: r4(B.cash - (in0 - outf0)), inflows: r4(in0), outflows: r4(outf0), cashEnd: B.cash,
    runwayMonths: in0 - outf0 < 0 ? r4(B.cash / (outf0 - in0)) : null,
    clients: B.clients, headcount: B.headcount, opsMetrics: ops0, kpiDelta: {},
  });

  let gmShift = 0; // desviación acumulada del margen bruto por el índice Margen
  inputs.forEach((inp, i) => {
    const p = i + 1;
    const prev = out[i];
    const d = inp.kpiDelta;
    const n = (k: string) => (noise ? jitter(`${o.seed}|${p}|${k}`) : 0);

    // Crecimiento: base + clientes + marketing e internacional con retraso + demanda.
    // Una asignación decidida al cerrar el mes P se paga desde P+1 y vende desde P+1+retraso.
    const mk = active(allocs, "marketing", p, 1 + A.marketingLag, A.marketingMonths).reduce((s, x) => s + x.amount, 0);
    const intl = active(allocs, "internacional", p, 1 + A.intlLag, 12).reduce((s, x) => s + x.amount, 0);
    const growth = B.growth + (d.clientes ?? 0) * A.growthPerClientPoint + (mk / prev.revenue) * A.marketingElasticity + (intl / prev.revenue) * A.intlElasticity + n("demanda") * A.demandNoise;
    const revenue = prev.revenue * (1 + growth);

    // Margen bruto: el índice Margen lo mueve dentro de una banda; el capex lo mejora a partir de su retraso.
    gmShift = clamp(gmShift + (d.margen ?? 0) * A.marginPerPoint, -A.marginBand, A.marginBand);
    const capexDone = allocs.filter((a) => a.lever === "capex" && p - a.period >= A.capexLag).reduce((s, a) => s + a.amount, 0);
    const grossMargin = clamp(B.grossMargin + gmShift + (capexDone / B.revenue) * A.capexMarginPerRevenue, 0.05, 0.95);
    const grossProfit = revenue * grossMargin;

    // Gastos.
    const hires = active(allocs, "contratar", p, 1, 120).reduce((s, x) => s + x.amount, 0);
    const payroll = B.headcount * B.costPerHead + hires;
    const headcount = Math.round(B.headcount + hires / B.costPerHead);
    const marketing = B.marketing + active(allocs, "marketing", p, 1, A.marketingMonths).reduce((s, x) => s + x.amount, 0) + active(allocs, "internacional", p, 1, 12).reduce((s, x) => s + x.amount, 0);
    const otherOpex = B.otherFixed + B.otherVar * revenue;
    const ebitda = grossProfit - payroll - marketing - otherOpex;

    // Capital de trabajo: los días de cobro bajan si el índice Caja sube (cobranza, plazos), y viceversa.
    const dso = clamp(prev.dso - (d.caja ?? 0) * A.dsoPerCashPoint, 1, 150);
    const receivables = (revenue * dso) / 30;
    const workingCapital = receivables - prev.receivables;

    // Inversión, deuda.
    const capex = B.capexPct * revenue + allocs.filter((a) => a.lever === "capex" && a.period + 1 === p).reduce((s, a) => s + a.amount, 0);
    const newDebt = allocs.filter((a) => a.lever === "deuda" && a.period + 1 === p).reduce((s, a) => s + a.amount, 0);
    const debt = prev.debt + newDebt;
    const interest = prev.debt * A.debtRate;

    // Caja: cobranza (+ deuda nueva) contra todo lo que sale. cashEnd = cashBegin + inflows − outflows.
    const inflows = revenue - workingCapital + newDebt;
    const outflows = revenue - grossProfit + payroll + marketing + otherOpex + capex + interest;
    const cashBegin = prev.cashEnd;
    const cashEnd = cashBegin + inflows - outflows;
    const burn = outflows - inflows;

    const ops: Record<string, number> = {};
    for (const m of profile.metrics) {
      if (m.fromRevenue) { ops[m.id] = r4(revenue * m.fromRevenue); continue; }
      const drive = m.driver ? (d[m.driver.kpi] ?? 0) * m.driver.k : 0;
      ops[m.id] = r4(clamp(prev.opsMetrics[m.id] + drive + n(m.id) * m.noise, m.min, m.max));
    }

    out.push({
      period: p, status: inp.status, revenue: r4(revenue), revenueTarget: r4(B.revenue * (1 + B.targetGrowth) ** p), growth: r4(growth),
      grossMargin: r4(grossMargin), grossProfit: r4(grossProfit), payroll: r4(payroll), marketing: r4(marketing), otherOpex: r4(otherOpex), ebitda: r4(ebitda),
      workingCapital: r4(workingCapital), receivables: r4(receivables), dso: r4(dso), capex: r4(capex), interest: r4(interest), debt: r4(debt),
      cashBegin: r4(cashBegin), inflows: r4(inflows), outflows: r4(outflows), cashEnd: r4(cashBegin + r4(inflows) - r4(outflows)),
      runwayMonths: burn > 0 ? r4(Math.max(0, cashEnd) / burn) : null,
      clients: Math.max(0, Math.round(prev.clients * (1 + growth))), headcount, opsMetrics: ops, kpiDelta: d,
    });
  });
  return out;
}

/** Limpia el registro de negocio guardado. Null si no sirve. */
export function sanitizeBusiness(raw: unknown): BusinessLog | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const v = typeof r.assumptionsVersion === "number" && Number.isInteger(r.assumptionsVersion) && r.assumptionsVersion > 0 ? r.assumptionsVersion : ASSUMPTIONS_VERSION;
  const allocations: Allocation[] = [];
  const seen = new Set<string>();
  for (const a of Array.isArray(r.allocations) ? r.allocations : []) {
    const x = a as Record<string, unknown>;
    if (!x || typeof x.id !== "string" || !x.id || x.id.length > 64 || seen.has(x.id)) continue;
    if (typeof x.period !== "number" || !Number.isInteger(x.period) || x.period < 0 || x.period > 600) continue;
    if (!LEVERS.includes(x.lever as never) || typeof x.amount !== "number" || !Number.isFinite(x.amount) || x.amount <= 0 || x.amount > 1e5) continue;
    const months = typeof x.months === "number" && Number.isInteger(x.months) && x.months > 0 && x.months <= 120 ? x.months : undefined;
    seen.add(x.id);
    allocations.push({ id: x.id, period: x.period, lever: x.lever as Allocation["lever"], amount: x.amount, ...(months ? { months } : {}) });
  }
  return { assumptionsVersion: v, allocations };
}
