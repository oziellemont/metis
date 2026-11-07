/**
 * mêtis CEO · economía real (reglas v10).
 *
 * Caja y Margen dejan de ser índices editoriales: se mueven por HECHOS con monto y fecha (types.ts `Fact`), convertidos
 * con las anclas de cada empresa, que salen de su perfil de negocio (business/profiles.ts):
 *  - 1 punto de Caja   = `cashPct` (5 %) de lo que la empresa paga en un mes. 20 puntos = un mes de operación.
 *  - 1 punto de Margen = `marginPct` (0.5 %) de la venta anual: medio punto porcentual de margen operativo.
 *
 * Reglas de causalidad que viven aquí (las demás, en el contenido y sus pruebas):
 *  - Un hecho, una cuenta: un descuento mueve el Margen; la Caja lo recibe en la operación del mes (1/12 del monto
 *    anual). Un pago mueve la Caja, y el Margen solo si es gasto del periodo. Una inversión mueve la Caja; el Margen,
 *    solo su depreciación anual. Capital de trabajo: solo Caja. Financiamiento: Caja, y sus intereses al Margen.
 *  - Materialidad con acumulación: los montos se acumulan por cuenta en el periodo y solo se redondea el acumulado.
 *    Un hecho chico no mueve el indicador; diez hechos chicos sí terminan por moverlo.
 *  - Autoridad: concesiones recurrentes mayores al 20 % del resultado operativo anual, o inversiones mayores al 2 %
 *    de la venta anual, son decisiones de consejo. Tomarlas sin él es un evento de gobierno que mueve el Consejo.
 *  - Operación del mes: al cierre, la caja recibe lo que el negocio genera en un mes normal (margen bruto menos nómina y
 *    gastos, menos la inversión de mantenimiento) más los cambios de precio y costo registrados en el periodo.
 *
 * Los montos del contenido están escritos para la empresa establecida (como sus textos); una empresa de otro tamaño
 * los recibe escalados con el mismo factor que sus textos (career/size.ts), así el caso y el tablero cuentan lo mismo.
 * Funciones puras, sin dependencias del motor.
 */
import type { Fact, KpiKey, Kpis } from "./types";
import type { CompanyArchetype } from "./career/taxonomy";
import { profileFor, type Baseline } from "./business/profiles";
import type { RuleSet } from "./rules";

export type Economy = NonNullable<RuleSet["economy"]>;

export interface Anchors {
  /** Millones de pesos que vale 1 punto de Caja. */
  cashPt: number;
  /** Millones de pesos al año que vale 1 punto de Margen. */
  marginPt: number;
  /** Venta anual (M). */
  sales: number;
  /** Resultado operativo anual antes de depreciación (M). */
  ebitda: number;
  /** Lo que genera la operación en un mes normal, después de su inversión de mantenimiento (M; negativo = quema). */
  monthlyCash: number;
  /** Lo que la empresa paga en un mes (M). */
  outflows: number;
  /** Factor de tamaño de los montos del contenido (1 = establecida). */
  size: number;
}

/** Números de un mes normal de un perfil. */
export function monthOf(b: Baseline) {
  const gross = b.revenue * b.grossMargin;
  const opex = b.headcount * b.costPerHead + b.marketing + b.otherFixed + b.otherVar * b.revenue;
  const ebitda = gross - opex;
  const capex = b.capexPct * b.revenue;
  return { revenue: b.revenue, ebitda, capex, cash: ebitda - capex, outflows: b.revenue - ebitda + capex };
}

const MEMO = new Map<string, Anchors>();
/** Anclas de una empresa (paquete × tipo de empresa) con las constantes de una versión de reglas. */
export function anchorsFor(packId: string, archetype: CompanyArchetype | undefined, E: Economy, metricProfileId?: string): Anchors {
  const key = `${packId}|${archetype ?? ""}|${metricProfileId ?? ""}|${E.cashPct}|${E.marginPct}`;
  const hit = MEMO.get(key);
  if (hit) return hit;
  const p = profileFor(metricProfileId, packId);
  const b = p.baselines[archetype ?? "establecida"] ?? p.baselines.establecida;
  const m = monthOf(b);
  // El factor de tamaño es el mismo que usan los textos (career/size.ts): ventas del tipo / ventas de la establecida.
  const base = profileFor(undefined, packId).baselines;
  const size = !archetype || archetype === "establecida" ? 1 : base[archetype].revenue / base.establecida.revenue;
  const out: Anchors = {
    cashPt: m.outflows * E.cashPct,
    marginPt: m.revenue * 12 * E.marginPct,
    sales: m.revenue * 12,
    ebitda: m.ebitda * 12,
    monthlyCash: m.cash,
    outflows: m.outflows,
    size,
  };
  MEMO.set(key, out);
  return out;
}

/** Lo que un hecho mueve, en millones: caja (de una vez), resultado anual y su parte mensual de caja (recurrente). */
export interface Money { cash: number; margin: number; monthly: number }
export const NO_MONEY: Money = Object.freeze({ cash: 0, margin: 0, monthly: 0 });

/** Contabilidad de un hecho (montos ya escalados al tamaño de la empresa). */
export function moneyOf(f: Fact, A: Anchors, E: Economy): Money {
  const x = f.amount * A.size;
  switch (f.kind) {
    case "cobro":
    case "capital_trabajo":
      return { cash: x, margin: 0, monthly: 0 };
    case "pago":
      return { cash: x, margin: f.expense ? x : 0, monthly: 0 };
    case "precio":
    case "costo":
      return { cash: 0, margin: x, monthly: x / 12 };
    case "inversion":
      return { cash: x, margin: x / Math.max(1, f.years ?? E.depreciationYears), monthly: 0 };
    case "financiamiento":
      return { cash: x, margin: -Math.abs(x) * (f.rate ?? 0), monthly: 0 };
  }
}

export function sumMoney(fs: readonly Fact[] | undefined, A: Anchors, E: Economy): Money {
  const out = { cash: 0, margin: 0, monthly: 0 };
  for (const f of fs ?? []) { const m = moneyOf(f, A, E); out.cash += m.cash; out.margin += m.margin; out.monthly += m.monthly; }
  return out;
}

/** Redondeo simétrico (−0.5 → −1), igual para subidas y bajadas. */
export const roundHalf = (x: number): number => Math.sign(x) * Math.floor(Math.abs(x) + 0.5 + 1e-9);

/** Puntos de un monto suelto (vista previa y rúbrica; el tablero usa el acumulado del periodo). */
export function pointsOf(m: Pick<Money, "cash" | "margin">, A: Anchors): Partial<Kpis> {
  const out: Partial<Kpis> = {};
  const c = roundHalf(m.cash / A.cashPt), g = roundHalf(m.margin / A.marginPt);
  if (c) out.caja = c;
  if (g) out.margen = g;
  return out;
}

/**
 * ¿Rebasa la autoridad del director? Concesión recurrente neta (precio y costo que decide él) mayor al 20 % del
 * resultado operativo anual, o inversión mayor al 2 % de la venta anual. En una empresa que todavía no genera
 * resultado (startup), la base de la concesión es el 5 % de su venta anual.
 */
export function beyondAuthority(fs: readonly Fact[] | undefined, A: Anchors, E: Economy): boolean {
  if (!fs?.length) return false;
  const concessionBase = Math.max(A.ebitda, 0.05 * A.sales) * E.authority.concession;
  // Neto de lo que el director concede (un aumento de precio con su costo no es concesión; lo que decide otro, tampoco).
  const concession = -fs.filter((f) => (f.kind === "precio" || f.kind === "costo") && !f.external).reduce((a, f) => a + f.amount * A.size, 0);
  const invest = -fs.filter((f) => f.kind === "inversion" && f.amount < 0).reduce((a, f) => a + f.amount * A.size, 0);
  return concession > concessionBase + 1e-9 || invest > E.authority.investment * A.sales + 1e-9;
}

/**
 * Acumulador del periodo: cada hecho suma sus millones a la cuenta y mueve la diferencia de puntos del acumulado
 * redondeado. Así la suma de los movimientos es exactamente el redondeo del total (sin doble conteo ni puntos perdidos).
 */
export class Ledger {
  private cash = 0;
  private margin = 0;
  /** Parte mensual de caja de los cambios de precio y costo registrados (llega con la operación del mes). */
  monthly = 0;
  constructor(readonly A: Anchors) {}
  /** Registra dinero y devuelve los puntos que mueve ahora. */
  add(m: Money): Partial<Kpis> {
    const out: Partial<Kpis> = {};
    const c0 = roundHalf(this.cash / this.A.cashPt), g0 = roundHalf(this.margin / this.A.marginPt);
    this.cash += m.cash; this.margin += m.margin; this.monthly += m.monthly;
    const dc = roundHalf(this.cash / this.A.cashPt) - c0, dg = roundHalf(this.margin / this.A.marginPt) - g0;
    if (dc) out.caja = dc;
    if (dg) out.margen = dg;
    return out;
  }
  /** Millones acumulados (para pruebas y para mostrar). */
  totals() { return { cash: this.cash, margin: this.margin, monthly: this.monthly }; }
}

const KEYS: KpiKey[] = ["caja", "margen", "equipo", "clientes", "consejo"];
/** Suma de efectos (sin claves en cero). */
export function plus(a: Partial<Kpis>, b: Partial<Kpis> | undefined): Partial<Kpis> {
  if (!b) return a;
  const out: Partial<Kpis> = { ...a };
  for (const k of KEYS) if (b[k]) { const v = (out[k] ?? 0) + (b[k] ?? 0); if (v) out[k] = v; else delete out[k]; }
  return out;
}
/** Efectos sin Caja ni Margen (en v10 esas dos cuentas solo se mueven por hechos). */
export function nonMoney(e: Partial<Kpis> | undefined): Partial<Kpis> {
  const out: Partial<Kpis> = {};
  for (const k of ["equipo", "clientes", "consejo"] as const) if (e?.[k]) out[k] = e[k];
  return out;
}

/** Monto legible para el jugador: «$5.1 M», «$80 M al año». */
export function moneyText(m: number, recurring = false): string {
  const v = Math.abs(m);
  const n = v >= 10 ? Math.round(v).toLocaleString("en-US") : v >= 1 ? String(Math.round(v * 10) / 10) : `${Math.round(v * 1000).toLocaleString("en-US")} mil`;
  return `$${n}${v >= 1 ? " M" : ""}${recurring ? " al año" : ""}`;
}
