/**
 * Acería v2 · estrategias de referencia (conservadora, equilibrada, agresiva) y corrida de sensibilidad.
 * Sirven para validar el motor: las tres enfrentan exactamente el mismo mercado y ninguna debe ganar siempre por diseño.
 */
import { createSteel, runSteel, applySteel, cashOf, overdueTotal, balanceSheet, liquidityOptions, type SteelCommand, type SteelState } from "./engine";
import { BASE, STEEL, type Scenario } from "./params";

export type StrategyId = "conservadora" | "equilibrada" | "agresiva";
export const STRATEGIES: readonly StrategyId[] = ["conservadora", "equilibrada", "agresiva"];

/** Plan de decisiones por día (determinista). */
export function plan(templateId: string, k: StrategyId): { day: number; cmd: SteelCommand }[] {
  if (templateId === "aceria_compacta_v2") {
    if (k === "conservadora") return [];
    const out: { day: number; cmd: SteelCommand }[] = [
      { day: 45, cmd: { type: "add_contract", id: "e:bajio", client: "Desarrollos Industriales del Bajío", product: "varilla", tpd: 8, price: 14_600, dso: 60, startInDays: 30, beta: 1.3 } },
    ];
    if (k === "equilibrada") out.push({ day: 46, cmd: { type: "term_loan", id: "e:credito", amount: 3_000_000, rate: 0.17, months: 18, purpose: "capital de trabajo del contrato nuevo" } });
    if (k === "agresiva") {
      out.push(
        { day: 46, cmd: { type: "term_loan", id: "a:credito", amount: 6_000_000, rate: 0.19, months: 24, purpose: "capital de trabajo y tercer turno" } },
        { day: 60, cmd: { type: "set_shifts", id: "a:turno3", shifts: 3 } },
        { day: 60, cmd: { type: "maquila_capacity", id: "a:maquila", tpd: 30 } },
        { day: 75, cmd: { type: "add_contract", id: "a:relaminadora", client: "Aceros del Bajío (relaminadora)", product: "palanquilla", tpd: 20, price: 11_900, dso: 30, startInDays: 15, beta: 1.8 } },
      );
    }
    return out;
  }
  if (k === "conservadora") return [];
  if (k === "equilibrada") return [{ day: 75, cmd: { type: "expand_yard", id: "e:patio", capex: 12_000_000, share: 0.55, crew: 8 } }];
  return [
    // Horno de 38 t (55 M) más ampliación de la subestación y del colector de humos (20 M); el banco financia 50 M.
    { day: 45, cmd: { type: "add_furnace", id: "a:horno3", cost: 75_000_000, leadDays: 180, financed: 50_000_000, rate: 0.13, months: 60, utilities: 550_000 } },
    // El volumen extra solo lo absorbe un distribuidor: precio de mayoreo, 60 días y paga tarde.
    { day: 200, cmd: { type: "add_contract", id: "a:vivienda", client: "Vivienda del Norte (distribuidor)", product: "varilla", tpd: 50, price: 14_100, dso: 60, startInDays: 40, payDelay: 10, beta: 2 } },
  ];
}

export interface RunResult {
  templateId: string; strategy: StrategyId; scenario: string;
  revenue: number; ebitda: number; margin: number; net: number; taxesPaid: number; freeCash: number;
  cashMin: number; cashEnd: number; debtEnd: number; overdueDays: number; overdueMax: number; equityEnd: number; ownerIn: number;
  /** Valor para el dueño: utilidad neta menos el costo del capital adicional aportado. */
  value: number; rejected: string[]; actions: string[]; state: SteelState;
}

/** Orden en que un director razonable usa las alternativas de liquidez (lo más barato y reversible primero). */
const MANAGE_ORDER = ["convenio", "plazo", "factoraje", "credito", "capex", "aportacion", "remate"];

export function runStrategy(templateId: string, k: StrategyId, scenario: Scenario = BASE, days = 720, seed = "metis", manage = true): RunResult {
  const s = createSteel(templateId, seed, scenario);
  const steps = plan(templateId, k);
  const rejected: string[] = [];
  const actions: string[] = [];
  let cashMin = cashOf(s), overdueDays = 0, overdueMax = 0;
  const equity0 = balanceSheet(s).equity;
  for (let d = 0; d < days; d++) {
    for (const x of steps.filter((y) => y.day === d)) { const r = applySteel(s, x.cmd); if (!r.ok) rejected.push(`${x.cmd.id}: ${r.reason}`); }
    // Gestión de liquidez: cada lunes con alerta o crisis se usa la primera alternativa disponible.
    if (manage && d % 7 === 0 && s.liquidity !== "sana") {
      const opts = liquidityOptions(s, k).filter((o) => o.available && o.cash > 0);
      const pick = MANAGE_ORDER.map((id) => opts.find((o) => o.id === id)).find(Boolean);
      if (pick) { const r = applySteel(s, pick.cmd); if (r.ok) actions.push(`día ${d}: ${pick.label}`); }
    }
    runSteel(s, 1);
    cashMin = Math.min(cashMin, cashOf(s));
    const od = overdueTotal(s);
    if (od > 0) overdueDays++;
    overdueMax = Math.max(overdueMax, od);
  }
  const ms = s.months;
  const sum = (f: (m: (typeof ms)[number]) => number) => ms.reduce((a, m) => a + f(m), 0);
  const revenue = sum((m) => m.revenue), ebitda = sum((m) => m.ebitda), net = sum((m) => m.net);
  const ownerIn = s.equity;
  // Valor para el dueño: utilidad neta del periodo (incluye intereses pagados y el rendimiento de la caja que no se
  // invirtió) menos el costo del capital adicional que el dueño tuvo que aportar. Así, inmovilizar dinero en clientes
  // a 60 días o en un horno solo crea valor si rinde más que dejarlo en el banco y que el costo de la deuda.
  const value = net - Math.round(ownerIn * STEEL.costOfEquity.value * (days / 360));
  return {
    templateId, strategy: k, scenario: scenario.id, revenue, ebitda, margin: revenue ? ebitda / revenue : 0, net,
    taxesPaid: -sum((m) => m.cashTaxes), freeCash: sum((m) => m.freeCashFlow), cashMin, cashEnd: cashOf(s), debtEnd: ms[ms.length - 1]?.debt ?? 0,
    overdueDays, overdueMax, equityEnd: balanceSheet(s).equity - equity0, ownerIn, value, rejected, actions, state: s,
  };
}

/** Malla de sensibilidad: cada factor se mueve solo hacia su extremo razonable, más combinaciones adversas y favorables. */
export const SENSITIVITY: readonly Scenario[] = [
  BASE,
  { ...BASE, id: "precio-6", price: 0.94 },
  { ...BASE, id: "precio+5", price: 1.05 },
  { ...BASE, id: "chatarra+10", scrap: 1.1 },
  { ...BASE, id: "chatarra-8", scrap: 0.92 },
  { ...BASE, id: "energia+20", energy: 1.2 },
  { ...BASE, id: "rendimiento-2", yieldMelt: -0.02 },
  { ...BASE, id: "demanda-15", demand: 0.85 },
  { ...BASE, id: "demanda+8", demand: 1.08 },
  { ...BASE, id: "cobranza+20d", payDelay: 20 },
  { ...BASE, id: "mantenimiento-recortado", maintenance: 0.7 },
  { ...BASE, id: "estres-acero", steelShock: { from: 10, to: 18, mult: 0.94 } },
  { ...BASE, id: "tormenta", price: 0.96, scrap: 1.06, energy: 1.1, demand: 0.9, payDelay: 15 },
  { ...BASE, id: "bonanza", price: 1.04, scrap: 0.95, demand: 1.05 },
];

/**
 * Rangos de margen de la miniacería integrada. El 13–14 % es el caso base acordado. El 10–11 % no se obtiene bajando
 * el margen a mano: aparece cuando se combinan condiciones de mercado y de operación que ocurren en la industria.
 */
export const MARGIN_SCENARIOS: readonly { scenario: Scenario; why: string }[] = [
  { scenario: BASE, why: "Base: chatarra preparada a $6,700 por tonelada con 35 % del patio propio, energía a $2.20 por kWh, varilla a $14,800–14,950, rendimiento de fusión 90 %, mantenimiento normal." },
  {
    scenario: { ...BASE, id: "margen-10-11", price: 0.99, scrap: 1.03, energy: 1.06, maintenance: 1.1 },
    why: "Diferencial apretado: la varilla importada presiona el precio 1 %, la chatarra preparada sube 3 % por la demanda de exportación, la tarifa de CFE sube 6 % y el mantenimiento cuesta 10 % más por la edad de los hornos. Ninguna variable sale de su rango normal; juntas restan cerca de tres puntos de margen.",
  },
];
