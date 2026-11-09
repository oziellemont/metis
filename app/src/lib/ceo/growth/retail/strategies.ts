/**
 * Retail v2 · estrategias de referencia (conservadora, equilibrada, agresiva) y malla de sensibilidad.
 * Sirven para validar el motor: las tres enfrentan exactamente el mismo mercado y ninguna debe ganar siempre por diseño.
 */
import { createRetail, runRetail, applyRetail, cashOf, overdueTotal, liquidityOptions, MONTH, type RetailCommand, type RetailState } from "./engine";
import { BASE, RETAIL, type Scenario } from "./params";

export type StrategyId = "conservadora" | "equilibrada" | "agresiva";
export const STRATEGIES: readonly StrategyId[] = ["conservadora", "equilibrada", "agresiva"];

/** Plan de decisiones por día (determinista). */
export function plan(_templateId: string, k: StrategyId): { day: number; cmd: RetailCommand }[] {
  if (k === "conservadora") return [
    // Cuidar lo que hay: prima de 3 % al personal de tienda para bajar la rotación y prepago de deuda cara.
    { day: 20, cmd: { type: "pay_premium", id: "c:prima", premium: 0.03 } },
    { day: 200, cmd: { type: "prepay_debt", id: "c:prepago", amount: 60_000_000 } },
  ];
  if (k === "equilibrada") return [
    { day: 20, cmd: { type: "pay_premium", id: "e:prima", premium: 0.03 } },
    // 30 tiendas en zonas de crecimiento de Monterrey, con caja propia, en dos tandas.
    { day: 40, cmd: { type: "open_stores", id: "e:ola1", group: "mty", n: 15, capexPerStore: RETAIL.storeCapex.value, leadDays: 120, rent: 30_000 } },
    { day: 220, cmd: { type: "open_stores", id: "e:ola2", group: "saltillo", n: 15, capexPerStore: RETAIL.storeCapex.value, leadDays: 120, rent: 25_000 } },
  ];
  return [
    // 80 tiendas en un año, la mitad financiada, y una ampliación del CEDIS cuando la red pase de 400 tiendas.
    { day: 30, cmd: { type: "open_stores", id: "a:ola1", group: "mty", n: 40, capexPerStore: RETAIL.storeCapex.value, leadDays: 120, financed: 70_000_000, months: 60, rent: 31_000, ticketsMult: 0.95 } },
    { day: 150, cmd: { type: "open_stores", id: "a:ola2", group: "carretera", n: 20, capexPerStore: RETAIL.storeCapex.value * 1.2, leadDays: 150, rent: 32_000 } },
    { day: 200, cmd: { type: "open_stores", id: "a:ola3", group: "saltillo", n: 20, capexPerStore: RETAIL.storeCapex.value, leadDays: 120, financed: 40_000_000, months: 60, rent: 25_000, ticketsMult: 0.95 } },
    { day: 260, cmd: { type: "one_off", id: "a:cedis", label: "Ampliación del CEDIS (racks, andenes y refrigeración)", amount: 45_000_000, capex: true, payInDays: 60 } },
    { day: 320, cmd: { type: "cedis_capacity", id: "a:cedis:on", stores: 520, rent: 250_000, energy: 150_000 } },
  ];
}

export interface RunResult {
  templateId: string; strategy: StrategyId; scenario: string;
  revenue: number; ebitda: number; margin: number; net: number; taxesPaid: number; freeCash: number;
  cashMin: number; cashEnd: number; debtEnd: number; overdueDays: number; overdueMax: number; ownerIn: number; stores: number;
  /** Valor económico: utilidad neta menos el costo del capital adicional invertido (tiendas, CEDIS, capital de trabajo) y aportado. */
  value: number; rejected: string[]; actions: string[]; state: RetailState;
}

const MANAGE_ORDER = ["convenio", "plazo", "inventario", "credito", "capex", "aportacion"];

/** Capital operativo sin caja: activo fijo + clientes + inventario − pasivos de operación. */
function opCapital(s: RetailState): number {
  const A = (a: string) => s.acc[a] ?? 0;
  return A("activo_fijo") + A("clientes") + A("inventario") + (A("proveedores") + A("acreedores") + A("cfe") + A("imss") + A("aguinaldo_pp") + A("activo_por_pagar") + A("acreedores_nomina"));
}

export function runStrategy(templateId: string, k: StrategyId, scenario: Scenario = BASE, days = 720, seed = "metis", manage = true): RunResult {
  const s = createRetail(templateId, seed, scenario);
  const steps = plan(templateId, k);
  const rejected: string[] = [], actions: string[] = [];
  let cashMin = cashOf(s), overdueDays = 0, overdueMax = 0;
  const cap0 = opCapital(s);
  let capCharge = 0;
  for (let d = 0; d < days; d++) {
    for (const x of steps.filter((y) => y.day === d)) { const r = applyRetail(s, x.cmd); if (!r.ok) rejected.push(`${x.cmd.id}: ${r.reason}`); }
    if (manage && d % 7 === 0 && s.liquidity !== "sana") {
      const opts = liquidityOptions(s, k).filter((o) => o.available && o.cash > 0);
      const pick = MANAGE_ORDER.map((id) => opts.find((o) => o.id === id)).find(Boolean);
      if (pick) { const r = applyRetail(s, pick.cmd); if (r.ok) actions.push(`día ${d}: ${pick.label}`); }
    }
    runRetail(s, 1);
    // Cargo diario por el capital adicional que la estrategia mantiene invertido (costo de oportunidad del accionista).
    capCharge += (Math.max(0, opCapital(s) - cap0) * RETAIL.costOfEquity.value) / 360;
    cashMin = Math.min(cashMin, cashOf(s));
    const od = overdueTotal(s);
    if (od > 0) overdueDays++;
    overdueMax = Math.max(overdueMax, od);
  }
  const ms = s.months;
  const sum = (f: (m: (typeof ms)[number]) => number) => ms.reduce((a, m) => a + f(m), 0);
  const revenue = sum((m) => m.revenue), ebitda = sum((m) => m.ebitda), net = sum((m) => m.net);
  const value = Math.round(net - capCharge - s.equity * RETAIL.costOfEquity.value * (days / 360) + continuation(s));
  return {
    templateId, strategy: k, scenario: scenario.id, revenue, ebitda, margin: revenue ? ebitda / revenue : 0, net,
    taxesPaid: -sum((m) => m.cashTaxes), freeCash: sum((m) => m.freeCashFlow), cashMin, cashEnd: cashOf(s), debtEnd: ms.at(-1)?.debt ?? 0,
    overdueDays, overdueMax, ownerIn: s.equity, stores: ms.at(-1)?.stores ?? 0, value, rejected, actions, state: s,
  };
}

/**
 * Valor de continuación de las tiendas que abrieron y aún no maduran: lo que les falta de venta para llegar a madurez,
 * por su margen de contribución (aprox. 15 % de la venta) durante 18 meses, después de impuestos. Sin esto, cualquier
 * expansión parecería mala solo porque el horizonte se corta antes de que las tiendas maduren.
 */
function continuation(s: RetailState): number {
  let v = 0;
  for (const g of s.groups) for (const k of g.cohorts) {
    if (k.openDay < 0 || k.openDay > s.day) continue;
    const age = s.day - k.openDay;
    const ramp = Math.min(1, RETAIL.rampStart.value + ((1 - RETAIL.rampStart.value) * age) / (RETAIL.rampMonths.value * MONTH));
    const gap = Math.max(0, 1 - ramp);
    v += k.n * gap * g.tickets * (g.ticket / 100) * 100 * MONTH * 18 * 0.15 * 0.7 * (s.scenario.ramp ?? 1) * s.scenario.demand;
  }
  return Math.round(v);
}

export const SENSITIVITY: readonly Scenario[] = [
  BASE,
  { ...BASE, id: "demanda-8", demand: 0.92 },
  { ...BASE, id: "demanda+6", demand: 1.06 },
  { ...BASE, id: "costo+3", costs: 1.03 },
  { ...BASE, id: "merma+50", shrink: 1.5 },
  { ...BASE, id: "salarios+80", wage: 1.8 },
  { ...BASE, id: "energia+25", energy: 1.25 },
  { ...BASE, id: "tasa+4", rate: 0.04 },
  { ...BASE, id: "competidor", competitor: { fromMonth: 6, group: "mty", hit: 0.12 } },
  { ...BASE, id: "aperturas-lentas", ramp: 0.75 },
  { ...BASE, id: "tormenta", demand: 0.93, costs: 1.02, wage: 1.4, rate: 0.03, ramp: 0.8 },
  { ...BASE, id: "bonanza", demand: 1.05, ticket: 1.02, ramp: 1.1 },
];
