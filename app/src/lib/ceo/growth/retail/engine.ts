/**
 * mêtis CEO · Retail v2 · motor económico determinista de una cadena de tiendas de conveniencia (módulo separado).
 *
 * Mismos principios que el motor de la acería v2:
 *  1. Partida doble en centavos enteros: cada movimiento es un asiento balanceado; el balance cuadra al centavo y los
 *     saldos de caja, cuentas por cobrar, inventario, proveedores y deuda se concilian contra su detalle (pruebas).
 *  2. Saldos iniciales coherentes: la cadena opera 14 meses ANTES de tu llegada con el mismo motor, así que al llegar ya
 *     hay inventario por categoría, proveedores por pagar a su plazo, ingresos comerciales por cobrar, cuotas, ISR y PTU.
 *  3. La venta es diaria y casi toda de contado: el efectivo entra el mismo día, la tarjeta al día siguiente con su
 *     comisión. Los proveedores se pagan a su plazo (capital de trabajo negativo, típico del formato).
 *  4. Sin caja negativa: lo que vence y no se puede pagar se vuelve adeudo vencido con su acreedor, y cada acreedor
 *     reacciona (proveedores de contado o sin surtir, corte de luz, recargos fiscales, clima laboral).
 *  5. Impuestos: provisión contable (ISR y PTU devengados) separada de los pagos (provisionales, anual y PTU en mayo).
 *  6. Las cifras salen del motor y de constantes con su base. La IA no calcula ni modifica efectos.
 */
import { RETAIL as K, CATEGORIES, SEASON, BASE, TEMPLATES_RETAIL, type CatId, type Scenario, type RetailTemplate } from "./params";

export const RETAIL_MODEL_VERSION = 1;
export const CASH_YIELD = 0.07;
export const MONTH = 30;
const PRE_DAYS = 420;
const c = (pesos: number) => Math.round(pesos * 100);
export const fmt = (cents: number) => Math.round(cents / 100).toLocaleString("en-US");
export const fmtM = (cents: number) => `${(cents / 1e8).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`;

// ───────────────────────────────────────────────────────── tipos
export type Creditor = "personal" | "cfe" | "fisco" | "banco" | "proveedores" | "acreedores";
export const CREDITOR_LABEL: Readonly<Record<Creditor, string>> = Object.freeze({ personal: "sueldos del personal", cfe: "energía eléctrica (CFE)", fisco: "IMSS, SAT y nómina estatal", banco: "pagos del crédito", proveedores: "proveedores de mercancía", acreedores: "rentas, servicios y fletes" });
const PRIORITY: readonly Creditor[] = ["personal", "cfe", "fisco", "banco", "proveedores", "acreedores"];
export type CashCat = "operacion" | "inversion" | "financiamiento" | "impuestos";

export interface Cohort { n: number; openDay: number; ref?: string }
export interface Group {
  id: string; label: string; cohorts: Cohort[]; tickets: number; ticket: number; rent: number; energy: number; other: number;
  staff: number; leaderGross: number; staffGross: number; nightShift: boolean;
}
export interface Sched { day: number; dir: "in" | "out"; acc: string; creditor?: Creditor; amount: number; label: string; ref?: string }
export interface Overdue { acc: string; creditor: Creditor; amount: number; since: number; label: string }
export interface RLoan { id: string; lender: string; balance: number; rate: number; monthsLeft: number; startDay: number; ref: string }
export interface Crew { label: string; n: number; gross: number }
export type ModKey = "demand" | "ticket" | "margin" | "shrink" | "turnover" | "energy" | "commercial" | "services" | "staffing" | "logistics" | "invDays" | "share" | "robbery";
export interface Mod { key: ModKey; group?: string; cat?: CatId; add?: number; mult?: number; from?: number; until: number; ref: string }
export interface REvent { day: number; kind: string; text: string; ref?: string }
export type Liquidity = "sana" | "alerta" | "crisis";

export interface RetailMonth {
  month: number;
  revenue: number; commercial: number; services: number; cogs: number; shrink: number; cardFees: number; gross: number;
  payroll: number; rent: number; energy: number; storeOther: number; logistics: number; fixed: number; other: number;
  ebitda: number; depreciation: number; impairment: number; operating: number; financial: number; pretax: number; ptu: number; isr: number; net: number;
  cashOperating: number; cashInvesting: number; cashFinancing: number; cashTaxes: number; freeCashFlow: number;
  cashEnd: number; receivables: number; inventory: number; payables: number; overdue: number; debt: number; taxPayable: number; equity: number;
  stores: number; ticketsPerStore: number; ticket: number; lostSales: number; fill: number; staffing: number; robberies: number; sameStore: number;
  liquidity: Liquidity; headcount: number;
}

export interface RetailState {
  v: 2; modelVersion: number; templateId: string; seed: string; day: number; scenario: Scenario;
  groups: Group[];
  crews: Record<string, Crew>;
  fixed: { id: string; label: string; amount: number }[];
  cedis: { rent: number; energy: number; capacityStores: number };
  sustainingCapex: number;
  inv: Record<CatId, number>;
  acc: Record<string, number>;
  pl: Record<string, Record<string, number>>;
  cashCat: Record<string, Record<CashCat, number>>;
  cfeUnbilled: number;
  sched: Sched[];
  overdue: Overdue[];
  loans: RLoan[];
  tax: { year: number; revenue: number; taxable: number; isrProv: number; ptuProv: number; ppPaid: number; coef: number; lossCarry: number; closed: boolean };
  relations: { staff: number; suppliers: number; bank: number; owner: number; clients: number };
  supply: { cashOnly: boolean; stopped: boolean; servicesStopped: boolean; powerCut: boolean; extraDays: number; extraUntil: number; extraCost: number };
  /** Índices: precio de venta (inflación de enero), sueldos de mercado (salario mínimo) y lo que paga la cadena sobre ese mercado. */
  index: { price: number; marketWage: number; payPremium: number; rent: number };
  /** Fracción de puestos de tienda cubiertos (vacantes por rotación). */
  staffing: number;
  mods: Mod[];
  flags: Record<string, string | number | boolean>;
  safety: number;
  equity: number;
  events: REvent[];
  months: RetailMonth[];
  cur: { sales: number; tickets: number; storeDays: number; lost: number; planned: number; cashBegin: number; cashSum: number; robberies: number; matureTickets: number; matureDays: number };
  applied: string[];
  nextId: number;
  liquidity: Liquidity;
  pending: { day: number; cmd: RetailCommand }[];
}

// ───────────────────────────────────────────────────────── contabilidad
const PL = new Set(["ventas", "ingresos_comerciales", "ingresos_servicios", "costo_ventas", "merma", "comisiones_tarjeta", "nomina", "cuotas", "aguinaldo", "contratacion", "indemnizaciones", "renta", "energia", "gastos_tienda", "fletes", "fijos", "otros_gastos", "otros_ingresos", "deterioro", "depreciacion", "intereses", "recargos", "comisiones", "rendimientos", "ptu", "isr"]);
const EBITDA_ACC = ["ventas", "ingresos_comerciales", "ingresos_servicios", "costo_ventas", "merma", "comisiones_tarjeta", "nomina", "cuotas", "aguinaldo", "contratacion", "indemnizaciones", "renta", "energia", "gastos_tienda", "fletes", "fijos", "otros_gastos", "otros_ingresos"];
const FIN_ACC = ["intereses", "recargos", "comisiones", "rendimientos"];
const LIAB = ["proveedores", "acreedores", "activo_por_pagar", "cfe", "imss", "aguinaldo_pp", "isr_pp", "ptu_pp", "deuda"];
export const monthOf = (d: number) => Math.floor(d / MONTH);
export const calOf = (s: RetailState, d: number) => { const t = TEMPLATES_RETAIL[s.templateId].startMonth - 1 + monthOf(d); return { month: (((t % 12) + 12) % 12) + 1, year: Math.floor(t / 12) }; };

function tx(s: RetailState, lines: [string, number][], cat?: CashCat) {
  let sum = 0;
  for (const [a, v] of lines) {
    if (!Number.isInteger(v)) throw new Error(`Asiento con centavos no enteros en ${a}: ${v}`);
    sum += v;
  }
  if (sum !== 0) throw new Error(`Asiento descuadrado: ${JSON.stringify(lines)}`);
  const m = String(monthOf(s.day));
  for (const [a, v] of lines) {
    if (!v) continue;
    s.acc[a] = (s.acc[a] ?? 0) + v;
    if (PL.has(a)) { const p = (s.pl[m] ??= {}); p[a] = (p[a] ?? 0) + v; }
    if (a === "caja") { const k = (s.cashCat[m] ??= { operacion: 0, inversion: 0, financiamiento: 0, impuestos: 0 }); k[cat ?? "operacion"] += v; }
  }
}
const bal = (s: RetailState, a: string) => s.acc[a] ?? 0;
export const cashOf = (s: RetailState) => bal(s, "caja");

function schedule(s: RetailState, day: number, dir: "in" | "out", acc: string, amount: number, label: string, creditor?: Creditor, ref?: string) {
  if (amount <= 0) return;
  const hit = s.sched.find((x) => x.day === day && x.dir === dir && x.acc === acc && x.ref === ref && x.label === label);
  if (hit) { hit.amount += amount; return; }
  s.sched.push({ day, dir, acc, creditor, amount, label, ref });
}

const CAT_OF: Record<string, CashCat> = { deuda: "financiamiento", deuda_por_recibir: "financiamiento", aportacion_por_recibir: "financiamiento", capital: "financiamiento", activo_por_pagar: "inversion", isr_pp: "impuestos", imss: "operacion", ptu_pp: "operacion" };

function payLiability(s: RetailState, acc: string, creditor: Creditor, amount: number, label: string): number {
  if (amount <= 0) return 0;
  const paid = Math.min(amount, Math.max(0, cashOf(s)));
  if (paid) tx(s, [[acc, paid], ["caja", -paid]], CAT_OF[acc] ?? (creditor === "fisco" ? "impuestos" : "operacion"));
  const left = amount - paid;
  if (left > 0) {
    const hit = s.overdue.find((o) => o.acc === acc && o.creditor === creditor && o.since === s.day);
    if (hit) hit.amount += left; else s.overdue.push({ acc, creditor, amount: left, since: s.day, label });
  }
  return paid;
}
function payDownOverdue(s: RetailState) {
  if (cashOf(s) <= 0 || !s.overdue.length) return;
  const order = [...s.overdue].sort((a, b) => PRIORITY.indexOf(a.creditor) - PRIORITY.indexOf(b.creditor) || a.since - b.since);
  for (const o of order) {
    const x = Math.min(o.amount, cashOf(s));
    if (x <= 0) break;
    tx(s, [[o.acc, x], ["caja", -x]], CAT_OF[o.acc] ?? (o.creditor === "fisco" ? "impuestos" : "operacion"));
    o.amount -= x;
  }
  s.overdue = s.overdue.filter((o) => o.amount > 0);
}
export const overdueTotal = (s: RetailState, cr?: Creditor) => s.overdue.filter((o) => !cr || o.creditor === cr).reduce((a, o) => a + o.amount, 0);
const oldest = (s: RetailState, cr: Creditor) => { const xs = s.overdue.filter((o) => o.creditor === cr); return xs.length ? s.day - Math.min(...xs.map((o) => o.since)) : 0; };
export const debtOf = (s: RetailState) => s.loans.reduce((a, l) => a + l.balance, 0);
function event(s: RetailState, kind: string, text: string, ref?: string) { if (s.day >= 0) s.events.push({ day: s.day, kind, text, ref }); }
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export function hash01(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h / 0x100000000;
}

// ───────────────────────────────────────────────────────── parámetros vivos
function modded(s: RetailState, key: ModKey, base: number, group?: string, cat?: CatId): number {
  let v = base;
  for (const m of s.mods) {
    if (m.key !== key || s.day >= m.until || s.day < (m.from ?? -Infinity)) continue;
    // Un modificador de plaza aplica también a las aperturas y separaciones de esa plaza ("mty+…", "mty:24h").
    if (m.group && m.group !== group && m.group !== group?.split(/[+:]/)[0]) continue;
    if (m.cat && m.cat !== cat) continue;
    if (m.mult !== undefined) v *= m.mult;
    if (m.add !== undefined) v += m.add;
  }
  return v;
}
const scen = (s: RetailState) => (s.day >= 0 ? s.scenario : BASE);
/** Tiendas abiertas hoy en un grupo (o en toda la cadena). */
export const storesOpen = (s: RetailState, g?: Group): number => (g ? g.cohorts.filter((k) => k.openDay <= s.day).reduce((a, k) => a + k.n, 0) : s.groups.reduce((a, x) => a + storesOpen(s, x), 0));
/** Curva de maduración: una tienda nueva vende `rampStart` de una madura y llega al 100 % en `rampMonths`. */
export const rampOf = (age: number) => (age < 0 ? 0 : Math.min(1, K.rampStart.value + ((1 - K.rampStart.value) * age) / (K.rampMonths.value * MONTH)));
const seasonOf = (s: RetailState) => SEASON[calOf(s, s.day).month - 1];
/** Ventas que la tienda pierde por puestos vacantes: con 95 % cubierto no pierde nada; abajo, cae rápido. */
const staffingFactor = (s: RetailState) => Math.min(1, 0.55 + (0.45 * s.staffing) / 0.95);
export const storeHeadcount = (s: RetailState) => s.groups.reduce((a, g) => a + storesOpen(s, g) * (1 + g.staff), 0);
export const headcountOf = (s: RetailState) => storeHeadcount(s) + Object.values(s.crews).reduce((a, cr) => a + cr.n, 0);
function shares(s: RetailState): Record<CatId, number> {
  const raw = Object.fromEntries(CATEGORIES.map((k) => [k.id, Math.max(0.01, modded(s, "share", k.share, undefined, k.id))])) as Record<CatId, number>;
  const t = Object.values(raw).reduce((a, x) => a + x, 0);
  for (const k of CATEGORIES) raw[k.id] /= t;
  return raw;
}
export const marginOf = (s: RetailState, cat: CatId) => modded(s, "margin", CATEGORIES.find((k) => k.id === cat)!.margin, undefined, cat);

// ───────────────────────────────────────────────────────── arranque
export function createRetail(templateId: string, seed = "metis", scenario: Scenario = BASE): RetailState {
  const T: RetailTemplate | undefined = TEMPLATES_RETAIL[templateId];
  if (!T) throw new Error(`Plantilla de retail desconocida: ${templateId}`);
  const s: RetailState = {
    v: 2, modelVersion: RETAIL_MODEL_VERSION, templateId, seed, day: -PRE_DAYS, scenario,
    groups: T.groups.map((g) => ({ id: g.id, label: g.label, cohorts: [{ n: g.n, openDay: -g.ageMonths * MONTH }], tickets: g.tickets, ticket: c(g.ticket), rent: c(g.rent), energy: c(g.energy), other: c(g.other), staff: g.staff, leaderGross: c(g.leaderGross), staffGross: c(g.staffGross), nightShift: g.nightShift })),
    crews: Object.fromEntries(T.crews.map((x) => [x.id, { label: x.label, n: x.n, gross: c(x.gross) }])),
    fixed: T.fixed.map((f) => ({ ...f, amount: c(f.amount) })),
    cedis: { rent: c(T.cedis.rent), energy: c(T.cedis.energy), capacityStores: T.cedis.capacityStores },
    sustainingCapex: c(T.sustainingCapex),
    inv: { bebidas: 0, cerveza: 0, tabaco: 0, abarrotes: 0, comida: 0 },
    acc: {}, pl: {}, cashCat: {}, cfeUnbilled: 0, sched: [], overdue: [], loans: [],
    tax: { year: -1, revenue: 0, taxable: 0, isrProv: 0, ptuProv: 0, ppPaid: 0, coef: T.taxCoefficient, lossCarry: 0, closed: false },
    relations: { staff: 0.8, suppliers: 0.8, bank: 0.8, owner: 0.8, clients: 0.8 },
    supply: { cashOnly: false, stopped: false, servicesStopped: false, powerCut: false, extraDays: 0, extraUntil: 0, extraCost: 0 },
    index: { price: 1, marketWage: 1, payPremium: 0, rent: 1 },
    staffing: 0.95,
    mods: [], flags: {}, safety: 0.8, equity: 0, events: [], months: [],
    cur: { sales: 0, tickets: 0, storeDays: 0, lost: 0, planned: 0, cashBegin: 0, cashSum: 0, robberies: 0, matureTickets: 0, matureDays: 0 },
    applied: [], nextId: 1, liquidity: "sana", pending: [],
  };
  const book = c(T.assets.reduce((a, x) => a + x.book, 0));
  const monthlySales = s.groups.reduce((a, g) => a + g.cohorts[0].n * g.tickets * g.ticket * MONTH, 0);
  const startCash = Math.round(monthlySales * 0.6);
  tx(s, [["activo_fijo", book], ["caja", startCash], ["capital", -(book + startCash)]], "financiamiento");
  // Inventario inicial: los días de cada categoría sobre el costo de su venta.
  const sh = shares(s);
  for (const k of CATEGORIES) {
    const v = Math.round((monthlySales / MONTH) * sh[k.id] * (1 - k.margin) * k.invDays);
    s.inv[k.id] = v;
    tx(s, [["inventario", v], ["capital", -v]], "financiamiento");
  }
  if (T.debt) {
    const preMonths = PRE_DAYS / MONTH;
    const amount = Math.round((c(T.debt.amount) * (T.debt.months + preMonths)) / T.debt.months);
    const loan: RLoan = { id: "deuda_cadena", lender: T.debt.lender, balance: amount, rate: T.debt.rate, monthsLeft: T.debt.months + preMonths, startDay: -PRE_DAYS, ref: "plantilla" };
    s.loans.push(loan);
    tx(s, [["caja", loan.balance], ["deuda", -loan.balance]], "financiamiento");
  }
  for (let i = 0; i < PRE_DAYS; i++) step(s);
  const diff = cashOf(s) - c(T.cash);
  tx(s, [["capital", diff], ["caja", -diff]], "financiamiento");
  s.cashCat = {}; s.events = []; s.months = []; s.pl = Object.fromEntries(Object.entries(s.pl).filter(([k]) => Number(k) >= 0));
  if (s.overdue.length) throw new Error("La historia previa dejó adeudos vencidos: revisar la plantilla.");
  s.cur.cashBegin = cashOf(s);
  s.equity = 0;
  s.relations = { staff: 0.8, suppliers: 0.8, bank: 0.8, owner: 0.8, clients: 0.8 };
  s.staffing = 0.95; s.safety = 0.8; s.liquidity = "sana";
  s.events.push({ day: 0, kind: "apertura", text: T.summary });
  return s;
}

// ───────────────────────────────────────────────────────── un día
function step(s: RetailState) {
  const d = s.day;
  if (s.pending.length) { const due = s.pending.filter((x) => x.day <= d); if (due.length) { s.pending = s.pending.filter((x) => x.day > d); for (const x of due) applyInner(s, x.cmd); } }
  for (const g of s.groups) for (const k of g.cohorts) if (k.openDay === d && d >= 0) event(s, "apertura_tienda", `Abren ${k.n} tienda${k.n > 1 ? "s" : ""} en ${g.label}. Arrancan vendiendo cerca de ${Math.round(K.rampStart.value * 100)} % de una tienda madura.`, k.ref);
  const today = s.sched.filter((x) => x.day === d);
  if (today.length) s.sched = s.sched.filter((x) => x.day !== d);
  for (const x of today.filter((y) => y.dir === "in")) tx(s, [["caja", x.amount], [x.acc, -x.amount]], CAT_OF[x.acc] ?? "operacion");
  payDownOverdue(s);
  for (const x of today.filter((y) => y.dir === "out").sort((a, b) => PRIORITY.indexOf(a.creditor!) - PRIORITY.indexOf(b.creditor!))) payLiability(s, x.acc, x.creditor!, x.amount, x.label);
  consequences(s);
  operate(s);
  s.cur.cashSum += Math.max(0, cashOf(s));
  if ((d + 1) % MONTH === 0) closeMonth(s);
  s.day++;
}

function operate(s: RetailState) {
  const sc = scen(s);
  const season = seasonOf(s);
  const staffF = staffingFactor(s);
  const clientsF = 0.9 + 0.125 * s.relations.clients;
  const cut = s.supply.powerCut ? 0.6 : 1;
  const servicesCut = s.supply.servicesStopped ? 0.95 : 1;
  const m1 = monthOf(s.day) + 1;
  let planned = 0, tickets = 0, storeDays = 0;
  for (const g of s.groups) {
    const comp = sc.competitor && s.day >= 0 && m1 >= sc.competitor.fromMonth && sc.competitor.group === g.id.split("+")[0] ? 1 - sc.competitor.hit : 1;
    const night = g.nightShift ? 1 : 0.83;
    const perStore = g.tickets * season * sc.demand * modded(s, "demand", 1, g.id) * staffF * clientsF * comp * night * cut * servicesCut;
    let n = 0, eq = 0;
    // Tiendas abiertas después de tu llegada: el escenario puede hacer que sus ubicaciones vendan menos de lo planeado.
    for (const k of g.cohorts) { if (k.openDay > s.day) continue; n += k.n; eq += k.n * rampOf(s.day - k.openDay) * (k.openDay >= 0 && s.day >= 0 ? sc.ramp ?? 1 : 1); }
    if (!n) continue;
    // Canibalización: abrir más tiendas en la misma zona le quita clientes a las que ya estaban (un tercio del aumento).
    const base0 = g.cohorts.filter((k) => k.openDay < 0).reduce((a, k) => a + k.n, 0);
    const cannibal = base0 > 0 && n > base0 ? 1 - (0.33 * (n - base0)) / n : 1;
    const t = perStore * eq * cannibal;
    const tk = g.ticket * s.index.price * sc.ticket * modded(s, "ticket", 1, g.id);
    planned += t * tk; tickets += t; storeDays += n;
    if (g.cohorts.every((k) => k.openDay > s.day || s.day - k.openDay >= K.rampMonths.value * MONTH)) { s.cur.matureTickets += perStore * n / (season * sc.demand); s.cur.matureDays += n; }
  }
  if (!storeDays) return;
  const sh = shares(s);
  let sales = 0, cogs = 0, shrink = 0, viaCedis = 0;
  for (const k of CATEGORIES) {
    const want = planned * sh[k.id];
    const mg = marginOf(s, k.id);
    const cost = want * (1 - mg) * sc.costs;
    const stock = s.inv[k.id];
    // Sin mercancía no hay venta: si el inventario no alcanza, se vende lo que hay (y el resto se pierde).
    const frac = cost > 0 ? Math.min(1, stock / cost) : 1;
    const soldV = Math.round(want * frac);
    const cogsV = Math.min(stock, Math.round(cost * frac));
    const shr = Math.min(stock - cogsV, Math.round(soldV * k.shrink * sc.shrink * modded(s, "shrink", 1, undefined, k.id)));
    s.inv[k.id] = stock - cogsV - shr;
    sales += soldV; cogs += cogsV; shrink += shr;
    if (k.viaCedis) viaCedis += soldV;
  }
  s.cur.lost += Math.max(0, Math.round(planned) - sales);
  s.cur.planned += Math.round(planned);
  s.cur.sales += sales; s.cur.tickets += tickets; s.cur.storeDays += storeDays;
  const card = Math.round(sales * K.cardShare.value);
  const fee = Math.round(card * K.cardFee.value);
  tx(s, [["caja", sales - card], ["clientes", card - fee], ["comisiones_tarjeta", fee], ["ventas", -sales]]);
  schedule(s, s.day + 1, "in", "clientes", card - fee, "Depósito de ventas con tarjeta");
  tx(s, [["costo_ventas", cogs], ["merma", shrink], ["inventario", -(cogs + shrink)]]);
  // Ingresos comerciales de proveedores: se devengan con la venta y se cobran 45 días después del cierre del mes.
  const ci = Math.round(sales * modded(s, "commercial", K.commercialIncome.value));
  if (ci > 0) { tx(s, [["clientes", ci], ["ingresos_comerciales", -ci]]); schedule(s, (monthOf(s.day) + 1) * MONTH + 44, "in", "clientes", ci, "Cobro de ingresos comerciales a proveedores"); }
  // Servicios (recibos, recargas, depósitos): la comisión neta entra con el efectivo del día.
  const sv = s.supply.servicesStopped ? 0 : Math.round(storeDays * modded(s, "services", K.serviceTx.value) * c(K.serviceFee.value) * cut);
  if (sv > 0) tx(s, [["caja", sv], ["ingresos_servicios", -sv]]);
  // Distribución del CEDIS a tienda: arriba de su capacidad cuesta 35 % más (turnos extra, rutas partidas).
  const over = storesOpen(s) > s.cedis.capacityStores ? 1.35 : 1;
  const fr = Math.round(viaCedis * modded(s, "logistics", K.logistics.value) * over);
  if (fr > 0) { tx(s, [["fletes", fr], ["acreedores", -fr]]); schedule(s, s.day + 15, "out", "acreedores", fr, "Diésel, casetas y mantenimiento de la flotilla", "acreedores"); }
  purchase(s, planned, sh);
}

/** Reposición diaria por categoría hasta los días objetivo, con el plazo de cada proveedor. */
function purchase(s: RetailState, planned: number, sh: Record<CatId, number>) {
  const sc = scen(s);
  for (const k of CATEGORIES) {
    // Con adeudos viejos se detiene el CEDIS (abarrotes, tabaco, comida); embotelladoras y cerveceras siguen surtiendo de contado.
    if (s.supply.stopped && k.viaCedis) continue;
    const daily = planned * sh[k.id] * (1 - marginOf(s, k.id)) * sc.costs;
    const target = daily * modded(s, "invDays", k.invDays, undefined, k.id);
    let buy = Math.round(Math.max(0, target - s.inv[k.id]));
    if (buy <= 0) continue;
    if (s.supply.extraCost) buy = Math.round(buy * (1 + s.supply.extraCost));
    if (s.supply.cashOnly) {
      buy = Math.min(buy, Math.max(0, cashOf(s)));
      if (buy > 0) tx(s, [["inventario", buy], ["caja", -buy]]);
    } else {
      tx(s, [["inventario", buy], ["proveedores", -buy]]);
      schedule(s, s.day + k.terms + s.supply.extraDays, "out", "proveedores", buy, `Pago a ${k.supplier.toLowerCase()}`, "proveedores");
    }
    s.inv[k.id] += buy;
  }
}

// ───────────────────────────────────────────────────────── consecuencias de los adeudos
function consequences(s: RetailState) {
  const R = s.relations, S = s.supply;
  const prov = overdueTotal(s, "proveedores");
  if (prov) {
    if (!S.cashOnly) { S.cashOnly = true; event(s, "proveedor", "Los proveedores de mercancía dejan de dar crédito mientras haya saldo vencido: se surte de contado o no se surte."); }
    if (oldest(s, "proveedores") > 10 && !S.stopped) { S.stopped = true; event(s, "proveedor", "Los proveedores de abarrotes, cigarros y comida dejan de surtir al CEDIS por adeudos de más de diez días; embotelladoras y cerveceras solo entregan de contado. Los anaqueles se empiezan a vaciar."); }
    R.suppliers = clamp(R.suppliers - 0.004);
  } else {
    if (S.stopped) { S.stopped = false; event(s, "proveedor", "Se liquidan los adeudos con proveedores: vuelve el surtido, todavía de contado."); }
    if (S.cashOnly && s.flags.cashOnlySince === undefined) s.flags.cashOnlySince = s.day;
    if (S.cashOnly && s.day - Number(s.flags.cashOnlySince) >= 45) { S.cashOnly = false; delete s.flags.cashOnlySince; event(s, "proveedor", "Tras mes y medio al corriente, los proveedores restablecen el crédito."); }
    R.suppliers = clamp(R.suppliers + 0.001);
  }
  if (prov) delete s.flags.cashOnlySince;
  const acr = overdueTotal(s, "acreedores");
  const was = S.servicesStopped;
  S.servicesStopped = acr > 0 && oldest(s, "acreedores") > 20;
  if (S.servicesStopped && !was) event(s, "proveedor", "El traslado de valores, el mantenimiento de refrigeración y los agregadores de pago de servicios suspenden por adeudos de más de 20 días: sin servicios en tienda baja el tráfico.");
  const cfe = overdueTotal(s, "cfe");
  const wasCut = S.powerCut;
  S.powerCut = cfe > 0 && oldest(s, "cfe") > 20;
  if (S.powerCut && !wasCut) event(s, "corte", "CFE empieza a cortar la luz de tiendas por falta de pago. Sin refrigeración se pierde producto y muchas tiendas operan a medias.");
  if (!S.powerCut && wasCut) { const fee = c(4_000) * storesOpen(s) / 10; const f = Math.round(fee); tx(s, [["otros_gastos", f], ["acreedores", -f]]); schedule(s, s.day + 1, "out", "acreedores", f, "Reconexiones de CFE", "acreedores"); event(s, "corte", "Se paga a CFE y se reconectan las tiendas, con cargo por reconexión."); }
  if (S.powerCut) for (const k of CATEGORIES) if (k.id === "comida" || k.id === "bebidas") { const loss = Math.round(s.inv[k.id] * (k.id === "comida" ? 0.05 : 0.005)); if (loss > 0) { s.inv[k.id] -= loss; tx(s, [["merma", loss], ["inventario", -loss]]); } }
  const fisco = overdueTotal(s, "fisco");
  if (fisco) {
    const r = Math.round((fisco * K.lateTax.value) / MONTH);
    if (r > 0) { tx(s, [["recargos", r], ["imss", -r]]); addOverdue(s, "imss", "fisco", r, "Recargos por pagos fiscales vencidos"); }
    if (oldest(s, "fisco") === 45) event(s, "fisco", "El IMSS y el SAT emiten requerimientos de pago. La opinión de cumplimiento sale negativa: ningún banco presta así.");
  }
  if (overdueTotal(s, "personal")) { R.staff = clamp(R.staff - 0.02); if (oldest(s, "personal") === 3) event(s, "personal", "La nómina no se pagó completa. En las tiendas empiezan las faltas y las renuncias; hay turnos sin cubrir."); }
  else R.staff = clamp(R.staff + 0.002);
  const bank = overdueTotal(s, "banco");
  if (bank) { R.bank = clamp(R.bank - 0.01); const r = Math.round((bank * 0.26) / 360); if (r > 0) { tx(s, [["intereses", r], ["deuda", -r]]); addOverdue(s, "deuda", "banco", r, "Moratorios del crédito"); } }
  else if (!fisco) R.bank = clamp(R.bank + 0.0005);
  if (S.extraDays && s.day >= S.extraUntil) { S.extraDays = 0; S.extraCost = 0; }
  s.mods = s.mods.filter((m) => m.until > s.day);
}
function addOverdue(s: RetailState, acc: string, creditor: Creditor, amount: number, label: string) {
  const hit = s.overdue.find((o) => o.acc === acc && o.creditor === creditor);
  if (hit) hit.amount += amount; else s.overdue.push({ acc, creditor, amount, since: s.day, label });
}

// ───────────────────────────────────────────────────────── cierre de mes
/** Sueldo bruto mensual del personal de tienda (con la prima de los turnos de noche). */
export function storePayroll(s: RetailState): number {
  const w = s.index.marketWage * (1 + s.index.payPremium);
  let gross = 0;
  for (const g of s.groups) {
    const n = storesOpen(s, g);
    // Turno nocturno: dos personas de noche con prima (jornada de 7 horas pagada como de 8, LFT): 15 % sobre su sueldo.
    const night = g.nightShift ? 2 * g.staffGross * 0.15 : 0;
    const staff = g.nightShift ? g.staff : g.staff - 2;
    gross += Math.round(n * (g.leaderGross + staff * g.staffGross + night) * w * s.staffing / 0.95);
  }
  return gross;
}
const officePayroll = (s: RetailState) => Object.values(s.crews).reduce((a, cr) => a + cr.n * cr.gross, 0);

function closeMonth(s: RetailState) {
  const m = monthOf(s.day);
  const cal = calOf(s, s.day);
  const sc = scen(s);
  const next17 = (m + 1) * MONTH + 16;
  const T = TEMPLATES_RETAIL[s.templateId];
  // Nómina: sueldos hoy; cuotas e ISN el 17 del mes siguiente; aguinaldo y prima provisionados y pagados en diciembre.
  const gross = storePayroll(s) + officePayroll(s);
  const load = Math.round(gross * K.employerLoad.value), xmas = Math.round(gross * K.christmasBonus.value);
  tx(s, [["nomina", gross], ["acreedores_nomina", -gross]]);
  payLiability(s, "acreedores_nomina", "personal", gross, "Sueldos del mes");
  tx(s, [["cuotas", load], ["imss", -load]]);
  schedule(s, next17, "out", "imss", load, "Cuotas IMSS, INFONAVIT y nómina estatal", "fisco");
  tx(s, [["aguinaldo", xmas], ["aguinaldo_pp", -xmas]]);
  if (cal.month === 12) { const due = -bal(s, "aguinaldo_pp") - s.overdue.filter((o) => o.acc === "aguinaldo_pp").reduce((a, o) => a + o.amount, 0); if (due > 0) payLiability(s, "aguinaldo_pp", "personal", due, "Aguinaldo y prima vacacional"); }
  // Rotación: cada salida se repone con reclutamiento, alta, uniforme y capacitación.
  const turnover = modded(s, "turnover", K.turnover.value) * (1 + 2.5 * Math.max(0, 0.95 - s.staffing)) * (1.4 - 0.5 * s.relations.staff) * (s.index.payPremium > 0 ? 1 - Math.min(0.4, s.index.payPremium * 5) : 1);
  const hires = Math.round(storeHeadcount(s) * turnover);
  const hc = Math.round(hires * c(K.hireCost.value) * s.index.marketWage);
  if (hc > 0) { tx(s, [["contratacion", hc], ["acreedores", -hc]]); schedule(s, s.day + 15, "out", "acreedores", hc, "Reclutamiento, altas y capacitación por rotación", "acreedores"); }
  // Puestos cubiertos: se acercan a un objetivo que depende del clima laboral y de la rotación.
  const target = clamp(modded(s, "staffing", 0.97 - 1.2 * Math.max(0, turnover - K.turnover.value) - 0.15 * Math.max(0, 0.8 - s.relations.staff)), 0.6, 0.99);
  s.staffing = clamp(s.staffing + 0.5 * (target - s.staffing), 0.6, 0.99);
  // Rentas, servicios de tienda, CEDIS y gastos fijos.
  const sumStores = (f: (g: Group) => number) => s.groups.reduce((a, g) => a + storesOpen(s, g) * f(g), 0);
  const rent = Math.round(sumStores((g) => g.rent) * s.index.rent * sc.rent) + s.cedis.rent;
  tx(s, [["renta", rent], ["acreedores", -rent]]); schedule(s, s.day + 1, "out", "acreedores", rent, "Rentas de tiendas y CEDIS", "acreedores");
  const hot = [6, 7, 8, 9].includes(cal.month) ? 1.25 : [5, 10].includes(cal.month) ? 1.1 : 0.9;
  const energy = Math.round(sumStores((g) => g.energy) * hot * sc.energy * modded(s, "energy", 1)) + s.cedis.energy;
  tx(s, [["energia", energy], ["cfe", -energy]]);
  s.cfeUnbilled = 0;
  schedule(s, (m + 1) * MONTH + 9, "out", "cfe", energy, "Recibos de CFE de tiendas y CEDIS", "cfe");
  const other = Math.round(sumStores((g) => g.other) * s.index.price);
  tx(s, [["gastos_tienda", other], ["acreedores", -other]]); schedule(s, s.day + 1, "out", "acreedores", other, "Agua, limpieza, bolsas, papelería y mantenimiento menor de tiendas", "acreedores");
  const fixed = s.fixed.reduce((a, f) => a + f.amount, 0);
  tx(s, [["fijos", fixed], ["acreedores", -fixed]]); schedule(s, s.day + 1, "out", "acreedores", fixed, "Gastos fijos del corporativo", "acreedores");
  // Asaltos: deterministas por semilla y mes. Suben con cultura de seguridad baja, efectivo en tienda y turno de noche.
  robberies(s, m);
  // Depreciación (línea recta) y capex de mantenimiento proporcional a las tiendas abiertas.
  const life = T.assets[0].months;
  const depAmt = Math.max(0, Math.min(bal(s, "activo_fijo"), Math.round(depreciationBase(s) / life)));
  if (depAmt) tx(s, [["depreciacion", depAmt], ["activo_fijo", -depAmt]]);
  const base = T.groups.reduce((a, g) => a + g.n, 0);
  if (s.sustainingCapex && s.flags.capexPausedSince === undefined) capex(s, Math.round((s.sustainingCapex * storesOpen(s)) / base), 1, "Inversión de mantenimiento (refrigeración, equipo y remodelaciones menores)");
  // Créditos: intereses y abono lineal a capital.
  for (const l of s.loans) {
    if (l.balance <= 0 || s.day < l.startDay + MONTH - 1) continue;
    const interest = Math.round((l.balance * (l.rate + (s.day >= 0 && l.ref !== "plantilla" ? sc.rate : 0))) / 12);
    const principal = l.monthsLeft > 0 ? Math.round(l.balance / l.monthsLeft) : l.balance;
    tx(s, [["intereses", interest], ["deuda", -interest]]);
    payLiability(s, "deuda", "banco", interest + principal, `Pago del crédito con ${l.lender}`);
    l.balance -= principal; l.monthsLeft = Math.max(0, l.monthsLeft - 1);
  }
  const yieldCash = Math.round(((s.cur.cashSum / MONTH) * CASH_YIELD) / 12);
  if (yieldCash > 0) tx(s, [["caja", yieldCash], ["rendimientos", -yieldCash]], "financiamiento");
  // Clientes: con anaquel vacío o tiendas a medias, la relación se deteriora.
  const fill = s.cur.planned > 0 ? s.cur.sales / s.cur.planned : 1;
  if (s.day >= 0) {
    if (fill < 0.97) { s.relations.clients = clamp(s.relations.clients - (0.97 - fill) * 1.5); if (fill < 0.9) event(s, "desabasto", `Faltó mercancía: se vendió ${Math.round(fill * 100)} % de lo que pedían los clientes. Quien no encuentra su refresco cruza la calle.`); }
    else s.relations.clients = clamp(s.relations.clients + (s.staffing >= 0.93 ? 0.01 : -0.005));
  }
  taxes(s, cal);
  if (s.day >= 0) s.months.push(summary(s, m, fill));
  updateLiquidity(s);
  // Enero (al llegar a fin de diciembre): sube el salario mínimo, la inflación mueve precios y rentas.
  if (cal.month === 12 && s.day >= 0) {
    const w = K.wageIncrease.value * sc.wage;
    s.index.marketWage *= 1 + w; s.index.price *= 1.045; s.index.rent *= 1.045;
    event(s, "salario_minimo", `Enero: el salario mínimo sube ${Math.round(w * 100)} % y con él los sueldos de tienda. Precios y rentas suben cerca de 4.5 %.`);
  }
  s.cur = { sales: 0, tickets: 0, storeDays: 0, lost: 0, planned: 0, cashBegin: cashOf(s), cashSum: 0, robberies: 0, matureTickets: 0, matureDays: 0 };
}

function robberies(s: RetailState, m: number) {
  if (s.day < 0) { s.cur.robberies = 0; return; }
  let n = 0;
  for (const g of s.groups) {
    const open = storesOpen(s, g);
    const p = modded(s, "robbery", 0.03, g.id) * (0.4 + 3 * (1 - s.safety)) * (g.nightShift ? 1 : 0.55);
    n += Math.floor(open * p * (0.6 + 0.8 * hash01(`${s.seed}|asalto|${g.id}|${m}`)));
  }
  s.cur.robberies = n;
  if (!n) return;
  // Pérdida promedio por asalto: efectivo de caja (la tienda deposita en buzón), mercancía y daños.
  const loss = n * c(14_000);
  tx(s, [["otros_gastos", loss], ["acreedores", -loss]]);
  schedule(s, s.day + 1, "out", "acreedores", loss, "Pérdidas por asaltos (efectivo, mercancía y daños)", "acreedores");
  s.relations.staff = clamp(s.relations.staff - 0.004 * n);
  // Un asalto con lesionados: raro, pero más probable con cultura de seguridad baja.
  if (hash01(`${s.seed}|lesion|${m}`) < (1 - s.safety) * 0.25) {
    const cost = c(450_000);
    tx(s, [["otros_gastos", cost], ["acreedores", -cost]]); schedule(s, s.day + 15, "out", "acreedores", cost, "Atención médica, apoyo a la familia y cierre temporal", "acreedores");
    s.relations.staff = clamp(s.relations.staff - 0.08);
    s.flags.lesionados = Number(s.flags.lesionados ?? 0) + 1;
    event(s, "seguridad", "Un asalto nocturno deja a una cajera lesionada. La tienda cierra dos días; el personal de la zona pide no quedarse solo de noche.");
  }
  event(s, "asaltos", `${n} asalto${n > 1 ? "s" : ""} en tiendas este mes.`);
}

function capex(s: RetailState, amount: number, inDays: number, label: string, ref?: string, parts: [number, number][] = [[1, inDays]]) {
  if (amount <= 0) return;
  tx(s, [["activo_fijo", amount], ["activo_por_pagar", -amount]]);
  let left = amount;
  parts.forEach(([share, d], i) => { const x = i === parts.length - 1 ? left : Math.round(amount * share); left -= x; schedule(s, s.day + d, "out", "activo_por_pagar", x, label, "acreedores", ref); });
  s.flags.depBase = depreciationBase(s) + amount;
}
function depreciationBase(s: RetailState): number {
  return Number(s.flags.depBase ?? c(TEMPLATES_RETAIL[s.templateId].assets.reduce((a, x) => a + x.book, 0)));
}

function plOf(s: RetailState, m: number, a: string) { return s.pl[String(m)]?.[a] ?? 0; }
function taxes(s: RetailState, cal: { month: number; year: number }) {
  const t = s.tax;
  if (t.year !== cal.year) { t.year = cal.year; t.revenue = 0; t.taxable = 0; t.isrProv = 0; t.ptuProv = 0; t.ppPaid = 0; t.closed = false; }
  const m = monthOf(s.day);
  t.revenue += -plOf(s, m, "ventas") - plOf(s, m, "ingresos_comerciales") - plOf(s, m, "ingresos_servicios");
  const pre = -Object.keys(s.pl[String(m)] ?? {}).filter((a) => a !== "isr" && a !== "ptu").reduce((a, k) => a + plOf(s, m, k), 0);
  t.taxable += pre;
  const gross = storePayroll(s) + officePayroll(s);
  const ptuTarget = Math.min(Math.round(Math.max(0, t.taxable) * K.ptu.value), gross * 3);
  const ptuDelta = ptuTarget - t.ptuProv;
  if (ptuDelta) tx(s, [["ptu", ptuDelta], ["ptu_pp", -ptuDelta]]);
  t.ptuProv = ptuTarget;
  const base = Math.max(0, t.taxable - ptuTarget - t.lossCarry);
  const isrTarget = Math.round(base * K.isr.value);
  const isrDelta = isrTarget - t.isrProv;
  if (isrDelta) tx(s, [["isr", isrDelta], ["isr_pp", -isrDelta]]);
  t.isrProv = isrTarget;
  const pp = Math.max(0, Math.round(t.coef * t.revenue * K.isr.value) - t.ppPaid);
  if (pp > 0 && cal.month !== 12) { t.ppPaid += pp; schedule(s, (m + 1) * MONTH + 16, "out", "isr_pp", pp, "Pago provisional de ISR", "fisco"); }
  if (cal.month === 12) {
    const pp12 = Math.max(0, Math.round(t.coef * t.revenue * K.isr.value) - t.ppPaid); t.ppPaid += pp12;
    if (pp12 > 0) schedule(s, (m + 1) * MONTH + 16, "out", "isr_pp", pp12, "Pago provisional de ISR (diciembre)", "fisco");
    const annual = t.isrProv - t.ppPaid;
    if (annual > 0) schedule(s, (m + 3) * MONTH + 29, "out", "isr_pp", annual, "Declaración anual de ISR", "fisco");
    else if (annual < 0) schedule(s, (m + 5) * MONTH + 29, "in", "isr_pp", -annual, "Devolución de saldo a favor de ISR");
    if (t.ptuProv > 0) schedule(s, (m + 5) * MONTH + 29, "out", "ptu_pp", t.ptuProv, "Reparto de utilidades (PTU)", "personal");
    const fiscal = t.taxable - ptuTarget;
    t.coef = t.revenue > 0 ? Math.max(0, fiscal) / t.revenue : 0;
    t.lossCarry = Math.max(0, t.lossCarry - Math.max(0, fiscal)) + Math.max(0, -fiscal);
    t.closed = true;
  }
}

/** Tickets diarios de referencia de una tienda madura (plantilla), para medir venta a tiendas iguales. */
function refTickets(s: RetailState): number {
  const T = TEMPLATES_RETAIL[s.templateId];
  const n = T.groups.reduce((a, g) => a + g.n, 0);
  return T.groups.reduce((a, g) => a + g.n * g.tickets, 0) / n;
}

function summary(s: RetailState, m: number, fill: number): RetailMonth {
  const g = (a: string) => plOf(s, m, a);
  const revenue = -g("ventas"), commercial = -g("ingresos_comerciales"), services = -g("ingresos_servicios");
  const ebitda = -EBITDA_ACC.reduce((a, k) => a + g(k), 0);
  const depreciation = g("depreciacion"), impairment = g("deterioro");
  const financial = FIN_ACC.reduce((a, k) => a + g(k), 0);
  const operating = ebitda - depreciation - impairment;
  const pretax = operating - financial;
  const ptu = g("ptu"), isr = g("isr");
  const k = s.cashCat[String(m)] ?? { operacion: 0, inversion: 0, financiamiento: 0, impuestos: 0 };
  const payables = -LIAB.filter((a) => a !== "deuda" && a !== "isr_pp" && a !== "ptu_pp").reduce((a, x) => a + bal(s, x), 0);
  const assets = ["caja", "clientes", "inventario", "activo_fijo", "deuda_por_recibir", "aportacion_por_recibir"].reduce((a, x) => a + bal(s, x), 0);
  const liabilities = -LIAB.reduce((a, x) => a + bal(s, x), 0) - bal(s, "acreedores_nomina");
  const cur = s.cur;
  return {
    month: m + 1, revenue, commercial, services, cogs: g("costo_ventas"), shrink: g("merma"), cardFees: g("comisiones_tarjeta"),
    gross: revenue + commercial + services - g("costo_ventas") - g("merma") - g("comisiones_tarjeta"),
    payroll: g("nomina") + g("cuotas") + g("aguinaldo") + g("contratacion") + g("indemnizaciones"), rent: g("renta"), energy: g("energia"), storeOther: g("gastos_tienda"), logistics: g("fletes"), fixed: g("fijos"),
    other: g("otros_gastos") + g("otros_ingresos"),
    ebitda, depreciation, impairment, operating, financial, pretax, ptu, isr, net: pretax - ptu - isr,
    cashOperating: k.operacion, cashInvesting: k.inversion, cashFinancing: k.financiamiento, cashTaxes: k.impuestos, freeCashFlow: k.operacion + k.inversion + k.impuestos,
    cashEnd: cashOf(s), receivables: bal(s, "clientes"), inventory: bal(s, "inventario"), payables, overdue: overdueTotal(s), debt: -bal(s, "deuda"), taxPayable: -(bal(s, "isr_pp") + bal(s, "ptu_pp")), equity: assets - liabilities,
    stores: storesOpen(s), ticketsPerStore: cur.storeDays ? Math.round(cur.tickets / cur.storeDays) : 0, ticket: cur.tickets ? Math.round(cur.sales / cur.tickets) : 0,
    lostSales: cur.lost, fill: Math.round(fill * 1000) / 1000, staffing: Math.round(s.staffing * 1000) / 1000, robberies: cur.robberies,
    sameStore: cur.matureDays ? Math.round((1000 * cur.matureTickets) / cur.matureDays / refTickets(s)) / 1000 - 1 : 0,
    liquidity: s.liquidity, headcount: headcountOf(s),
  };
}

function updateLiquidity(s: RetailState) {
  const prev = s.liquidity;
  const ins = s.sched.filter((x) => x.dir === "in" && x.day <= s.day + 30).reduce((a, x) => a + x.amount, 0);
  const outs = s.sched.filter((x) => x.dir === "out" && x.day <= s.day + 30).reduce((a, x) => a + x.amount, 0);
  // La venta de los próximos 30 días también entra (efectivo el mismo día, tarjeta al siguiente): se estima con la del mes que cierra, al 85 %.
  const cashSales = Math.round(s.cur.sales * 0.85);
  const payroll = storePayroll(s) + officePayroll(s);
  const next: Liquidity = s.overdue.length ? "crisis" : cashOf(s) + ins + cashSales - outs - payroll * 1.3 < 0 ? "alerta" : "sana";
  if (next !== prev && s.day >= 0) {
    if (next === "alerta") event(s, "alerta_liquidez", `Lo que vence en los próximos 30 días (unos $${fmt(outs + payroll)}) no cabe en la caja más lo que se espera vender y cobrar. Hay tiempo para actuar.`);
    if (next === "crisis") event(s, "crisis_liquidez", `Hay $${fmt(overdueTotal(s))} vencidos con ${[...new Set(s.overdue.map((o) => CREDITOR_LABEL[o.creditor]))].join(", ")}. Cada acreedor reacciona distinto: hay que decidir cómo cubrirlo.`);
    if (next === "sana") event(s, "liquidez_resuelta", "Lo que vence en 30 días ya cabe en la caja y la venta esperada: la liquidez vuelve a estar bajo control.");
  }
  s.liquidity = next;
}

// ───────────────────────────────────────────────────────── API pública
export const cloneRetail = (s: RetailState): RetailState => JSON.parse(JSON.stringify(s));
export function advanceRetail(s0: RetailState, days: number): RetailState { const s = cloneRetail(s0); for (let i = 0; i < days; i++) step(s); return s; }
export function runRetail(s: RetailState, days: number): RetailState { for (let i = 0; i < days; i++) step(s); return s; }

export function balanceSheet(s: RetailState) {
  const A = (a: string) => bal(s, a);
  const assets = { caja: A("caja"), clientes: A("clientes"), inventario: A("inventario"), activo_fijo: A("activo_fijo"), por_recibir: A("deuda_por_recibir") + A("aportacion_por_recibir"), isr_a_favor: Math.max(0, A("isr_pp")) };
  const liab = { proveedores: -A("proveedores"), acreedores: -A("acreedores") - A("acreedores_nomina") - A("activo_por_pagar"), cfe: -A("cfe"), imss: -A("imss"), aguinaldo: -A("aguinaldo_pp"), isr: Math.max(0, -A("isr_pp")), ptu: -A("ptu_pp"), deuda: -A("deuda") };
  const equity = -Object.entries(s.acc).filter(([a]) => a === "capital" || PL.has(a)).reduce((x, [, v]) => x + v, 0);
  const sumA = Object.values(assets).reduce((a, x) => a + x, 0), sumL = Object.values(liab).reduce((a, x) => a + x, 0);
  const total = Object.values(s.acc).reduce((a, x) => a + x, 0);
  return { assets, liab, equity, sumA, sumL, diff: sumA - sumL - equity, ledgerSum: total };
}

export function reconcile(s: RetailState): Record<string, number> {
  const sched = (acc: string, dir: "in" | "out") => s.sched.filter((x) => x.acc === acc && x.dir === dir).reduce((a, x) => a + x.amount, 0);
  const od = (acc: string) => s.overdue.filter((o) => o.acc === acc).reduce((a, o) => a + o.amount, 0);
  return {
    clientes: bal(s, "clientes") - sched("clientes", "in"),
    inventario: bal(s, "inventario") - Object.values(s.inv).reduce((a, x) => a + x, 0),
    proveedores: -bal(s, "proveedores") - sched("proveedores", "out") - od("proveedores"),
    acreedores: -bal(s, "acreedores") - sched("acreedores", "out") - od("acreedores"),
    activo_por_pagar: -bal(s, "activo_por_pagar") - sched("activo_por_pagar", "out") - od("activo_por_pagar"),
    isr: -bal(s, "isr_pp") - sched("isr_pp", "out") + sched("isr_pp", "in") - od("isr_pp") - (s.tax.closed ? 0 : s.tax.isrProv - s.tax.ppPaid),
    ptu: -bal(s, "ptu_pp") - sched("ptu_pp", "out") - od("ptu_pp") - (s.tax.closed ? 0 : s.tax.ptuProv),
    nomina: -bal(s, "acreedores_nomina") - od("acreedores_nomina"),
    cfe: -bal(s, "cfe") - sched("cfe", "out") - od("cfe") - s.cfeUnbilled,
    imss: -bal(s, "imss") - sched("imss", "out") - od("imss"),
    deuda: -bal(s, "deuda") - s.loans.reduce((a, l) => a + l.balance, 0) - od("deuda"),
    por_recibir: bal(s, "deuda_por_recibir") + bal(s, "aportacion_por_recibir") - sched("deuda_por_recibir", "in") - sched("aportacion_por_recibir", "in"),
  };
}

// ───────────────────────────────────────────────────────── decisiones
export type RetailCommand =
  | { type: "open_stores"; id: string; group: string; n: number; capexPerStore: number; leadDays: number; financed?: number; rate?: number; months?: number; rent?: number; ticketsMult?: number }
  | { type: "close_stores"; id: string; group: string; n: number; leaseMonths: number }
  | { type: "hire"; id: string; crew: string; n: number }
  | { type: "fire"; id: string; crew: string; n: number }
  | { type: "pay_premium"; id: string; premium: number }
  | { type: "night_shift"; id: string; group: string; on: boolean; stores?: number }
  | { type: "group_staff"; id: string; group: string; staff: number }
  | { type: "cedis_capacity"; id: string; stores: number; rent?: number; energy?: number }
  | { type: "term_loan"; id: string; amount: number; rate: number; months: number; purpose: string }
  | { type: "refinance"; id: string; rate: number; months: number; fee: number }
  | { type: "owner_equity"; id: string; amount: number }
  | { type: "supplier_terms"; id: string; extraDays: number; cost: number }
  | { type: "payment_plan"; id: string; months: number }
  | { type: "pause_capex"; id: string; on: boolean }
  | { type: "one_off"; id: string; label: string; amount: number; capex?: boolean; payInDays: number; account?: "otros_gastos" | "otros_ingresos" }
  | { type: "modify"; id: string; key: ModKey; group?: string; cat?: CatId; add?: number; mult?: number; days: number; inDays?: number }
  | { type: "safety"; id: string; delta: number }
  | { type: "flag"; id: string; key: string; value: string | number | boolean }
  | { type: "relation"; id: string; key: keyof RetailState["relations"]; delta: number }
  | { type: "later"; id: string; inDays: number; cmd: RetailCommand }
  | { type: "add_fixed"; id: string; label: string; amount: number }
  | { type: "remove_fixed"; id: string; fixedId: string }
  | { type: "dividend"; id: string; amount: number }
  | { type: "prepay_debt"; id: string; amount: number };

export interface RetailResult { ok: boolean; reason?: string }
const SEVERANCE_MONTHS = 3.5;

export function bankQuote(s: RetailState, amount: number, rate: number, months: number): { ok: boolean; reason?: string; payment: number } {
  const last = s.months.slice(-3);
  const e = last.length ? last.reduce((a, x) => a + x.ebitda, 0) / last.length : estimatedEbitda(s);
  const existing = s.loans.reduce((a, l) => a + (l.balance > 0 ? Math.round(l.balance / Math.max(1, l.monthsLeft)) + Math.round((l.balance * l.rate) / 12) : 0), 0);
  const payment = Math.round(c(amount) / months + (c(amount) * rate) / 12);
  if (oldest(s, "fisco") > 30) return { ok: false, reason: "Con adeudos fiscales de más de un mes la opinión de cumplimiento es negativa: el banco no puede prestar.", payment };
  if (s.relations.bank < 0.5) return { ok: false, reason: "El historial reciente de pagos con el banco impide un crédito nuevo.", payment };
  if (e <= 0) return { ok: false, reason: "Sin EBITDA positivo no hay capacidad de pago demostrable.", payment };
  if (existing + payment > e * 0.75) return { ok: false, reason: `El servicio de deuda quedaría en $${fmt(existing + payment)} al mes contra un EBITDA de $${fmt(Math.round(e))}: el banco pide cobertura de al menos 1.3 veces.`, payment };
  const debtAfter = debtOf(s) + c(amount);
  if (debtAfter > e * 12 * 3) return { ok: false, reason: `La deuda total quedaría en ${(debtAfter / (e * 12)).toFixed(1)} veces el EBITDA anual: el banco pone el tope en 3 veces.`, payment };
  return { ok: true, payment };
}
function estimatedEbitda(s: RetailState) { return Math.round(-Object.entries(s.pl).slice(-3).reduce((a, [, p]) => a + EBITDA_ACC.reduce((x, k) => x + (p[k] ?? 0), 0), 0) / 3); }

export function applyRetail(s: RetailState, cmd: RetailCommand): RetailResult {
  if (s.applied.includes(cmd.id)) return { ok: true, reason: "ya aplicada" };
  const r = applyInner(s, cmd);
  if (r.ok) s.applied.push(cmd.id);
  return r;
}

function addLoan(s: RetailState, id: string, lender: string, amount: number, rate: number, months: number, inDays: number, ref: string) {
  s.loans.push({ id, lender, balance: amount, rate, monthsLeft: months, startDay: s.day + inDays, ref });
  tx(s, [["deuda_por_recibir", amount], ["deuda", -amount]]);
  schedule(s, s.day + inDays, "in", "deuda_por_recibir", amount, `Dispersión del crédito (${lender})`, undefined, ref);
  const fee = Math.round(amount * 0.015);
  tx(s, [["comisiones", fee], ["acreedores", -fee]]); schedule(s, s.day + inDays, "out", "acreedores", fee, "Comisión de apertura del crédito", "acreedores");
}
const groupOf = (s: RetailState, id: string) => s.groups.find((g) => g.id === id);
const lender = (s: RetailState) => TEMPLATES_RETAIL[s.templateId].people.banco ?? "Banco";

function applyInner(s: RetailState, cmd: RetailCommand): RetailResult {
  switch (cmd.type) {
    case "open_stores": {
      const g = groupOf(s, cmd.group);
      if (!g) return { ok: false, reason: "Esa región no existe." };
      const cost = c(cmd.capexPerStore) * cmd.n, fin = c(cmd.financed ?? 0);
      if (cashOf(s) + fin < cost * 0.4) return { ok: false, reason: `El anticipo de las obras (40 %) es de $${fmt(Math.round(cost * 0.4))}; la caja y el crédito no alcanzan.` };
      if (fin) { const q = bankQuote(s, cmd.financed!, cmd.rate ?? TEMPLATES_RETAIL[s.templateId].bankRate, cmd.months ?? 60); if (!q.ok) return { ok: false, reason: q.reason }; addLoan(s, `l${s.nextId++}`, lender(s), fin, cmd.rate ?? TEMPLATES_RETAIL[s.templateId].bankRate, cmd.months ?? 60, 10, cmd.id); }
      capex(s, cost, 0, `Obra y equipamiento de ${cmd.n} tiendas nuevas`, cmd.id, [[0.4, 15], [0.6, cmd.leadDays]]);
      // Las tiendas nuevas se agregan como un grupo propio cuando su ubicación es distinta (renta o tráfico distintos).
      if (cmd.rent !== undefined || cmd.ticketsMult !== undefined) {
        const id = `${g.id}+${cmd.id}`;
        s.groups.push({ ...g, id, label: `${g.label} (aperturas)`, cohorts: [{ n: cmd.n, openDay: s.day + cmd.leadDays, ref: cmd.id }], rent: cmd.rent !== undefined ? c(cmd.rent) : g.rent, tickets: Math.round(g.tickets * (cmd.ticketsMult ?? 1)) });
      } else g.cohorts.push({ n: cmd.n, openDay: s.day + cmd.leadDays, ref: cmd.id });
      const hc = Math.round(cmd.n * (1 + g.staff) * c(K.hireCost.value) * s.index.marketWage);
      tx(s, [["contratacion", hc], ["acreedores", -hc]]); schedule(s, s.day + cmd.leadDays, "out", "acreedores", hc, "Reclutamiento y capacitación del personal de tiendas nuevas", "acreedores", cmd.id);
      event(s, "inversion", `Se aprueban ${cmd.n} tiendas nuevas en ${g.label}: $${fmt(cost)} de inversión; abren en ${cmd.leadDays} días.`, cmd.id);
      return { ok: true };
    }
    case "close_stores": {
      const g = groupOf(s, cmd.group);
      if (!g) return { ok: false, reason: "Esa región no existe." };
      const open = storesOpen(s, g);
      if (open < cmd.n) return { ok: false, reason: `Solo hay ${open} tiendas abiertas en ${g.label}.` };
      let left = cmd.n;
      for (const k of [...g.cohorts].sort((a, b) => b.openDay - a.openDay)) { if (k.openDay > s.day) continue; const x = Math.min(left, k.n); k.n -= x; left -= x; if (!left) break; }
      g.cohorts = g.cohorts.filter((k) => k.n > 0);
      const sev = Math.round(cmd.n * (g.leaderGross + g.staff * g.staffGross) * s.index.marketWage * SEVERANCE_MONTHS);
      tx(s, [["indemnizaciones", sev], ["acreedores_nomina", -sev]]);
      payLiability(s, "acreedores_nomina", "personal", sev, "Liquidaciones del personal de tiendas cerradas");
      const lease = Math.round(cmd.n * g.rent * s.index.rent * cmd.leaseMonths);
      tx(s, [["otros_gastos", lease], ["acreedores", -lease]]); schedule(s, s.day + 30, "out", "acreedores", lease, "Penalización por terminar contratos de arrendamiento", "acreedores", cmd.id);
      // Se da de baja el valor en libros de las adecuaciones (lo que se rescata de equipo se reubica en otras tiendas).
      const total = s.groups.reduce((a, x) => a + storesOpen(s, x), 0) + cmd.n;
      const wo = Math.min(bal(s, "activo_fijo"), Math.round((bal(s, "activo_fijo") / total) * cmd.n * 0.5));
      if (wo > 0) { tx(s, [["deterioro", wo], ["activo_fijo", -wo]]); s.flags.depBase = Math.max(0, depreciationBase(s) - wo); }
      s.relations.staff = clamp(s.relations.staff - 0.01 * Math.min(5, cmd.n / 3));
      event(s, "cierre", `Se cierran ${cmd.n} tiendas en ${g.label}: $${fmt(sev)} de liquidaciones y $${fmt(lease)} por terminar las rentas.`, cmd.id);
      return { ok: true };
    }
    case "hire": {
      const cr = s.crews[cmd.crew];
      if (!cr) return { ok: false, reason: "Esa área no existe." };
      cr.n += cmd.n;
      const cost = Math.round(cmd.n * cr.gross * 0.6);
      tx(s, [["contratacion", cost], ["acreedores", -cost]]); schedule(s, s.day + 15, "out", "acreedores", cost, "Reclutamiento y capacitación", "acreedores");
      return { ok: true };
    }
    case "fire": {
      const cr = s.crews[cmd.crew];
      if (!cr || cr.n < cmd.n) return { ok: false, reason: "No hay tantas personas en esa área." };
      cr.n -= cmd.n;
      const sev = Math.round(cmd.n * cr.gross * SEVERANCE_MONTHS);
      tx(s, [["indemnizaciones", sev], ["acreedores_nomina", -sev]]);
      payLiability(s, "acreedores_nomina", "personal", sev, "Indemnizaciones y finiquitos");
      s.relations.staff = clamp(s.relations.staff - 0.03 * Math.min(4, cmd.n / 10));
      event(s, "baja", `Salen ${cmd.n} personas de ${cr.label.toLowerCase()}: $${fmt(sev)} de indemnización.`, cmd.id);
      return { ok: true };
    }
    case "pay_premium":
      s.index.payPremium = Math.max(0, cmd.premium);
      s.relations.staff = clamp(s.relations.staff + cmd.premium * 1.5);
      return { ok: true };
    case "night_shift": {
      const g = groupOf(s, cmd.group);
      if (!g) return { ok: false, reason: "Esa región no existe." };
      if (cmd.stores && cmd.stores < storesOpen(s, g)) {
        // Solo un subconjunto de tiendas cambia de horario: se separa como grupo propio.
        let left = cmd.stores;
        const moved: Cohort[] = [];
        for (const k of g.cohorts) { if (!left) break; if (k.openDay > s.day) continue; const x = Math.min(left, k.n); k.n -= x; left -= x; moved.push({ n: x, openDay: k.openDay, ref: k.ref }); }
        g.cohorts = g.cohorts.filter((k) => k.n > 0);
        s.groups.push({ ...g, id: `${g.id}:${cmd.on ? "24h" : "noche"}`, label: `${g.label} (${cmd.on ? "24 horas" : "cierran de noche"})`, cohorts: moved, nightShift: cmd.on });
      } else g.nightShift = cmd.on;
      event(s, "horario", cmd.on ? `Vuelven a abrir las 24 horas tiendas de ${g.label}.` : `${cmd.stores ?? storesOpen(s, g)} tiendas de ${g.label} cierran de medianoche a 6 de la mañana.`, cmd.id);
      return { ok: true };
    }
    case "group_staff": {
      const g = groupOf(s, cmd.group);
      if (!g) return { ok: false, reason: "Esa región no existe." };
      g.staff = Math.max(3, cmd.staff);
      return { ok: true };
    }
    case "cedis_capacity":
      s.cedis.capacityStores = cmd.stores;
      if (cmd.rent) s.cedis.rent += c(cmd.rent);
      if (cmd.energy) s.cedis.energy += c(cmd.energy);
      return { ok: true };
    case "term_loan": {
      const q = bankQuote(s, cmd.amount, cmd.rate, cmd.months);
      if (!q.ok) { event(s, "rechazo", `El banco dice que no: ${q.reason}`, cmd.id); return { ok: false, reason: q.reason }; }
      addLoan(s, `l${s.nextId++}`, lender(s), c(cmd.amount), cmd.rate, cmd.months, 10, cmd.id);
      event(s, "credito", `El banco aprueba $${cmd.amount.toLocaleString("en-US")} a ${cmd.months} meses (${(cmd.rate * 100).toFixed(1)} % anual) para ${cmd.purpose}. Llega en diez días.`, cmd.id);
      return { ok: true };
    }
    case "refinance": {
      const loan = s.loans.find((l) => l.ref === "plantilla" && l.balance > 0);
      if (!loan) return { ok: false, reason: "No hay crédito que refinanciar." };
      if (s.relations.bank < 0.6 || s.overdue.length) return { ok: false, reason: "Con atrasos o mala relación, el banco no refinancia." };
      loan.rate = cmd.rate; loan.monthsLeft = cmd.months;
      const fee = c(cmd.fee);
      tx(s, [["comisiones", fee], ["acreedores", -fee]]); schedule(s, s.day + 5, "out", "acreedores", fee, "Comisión y gastos del refinanciamiento", "acreedores", cmd.id);
      event(s, "credito", `Se refinancia el crédito: ${(cmd.rate * 100).toFixed(1)} % anual a ${cmd.months} meses.`, cmd.id);
      return { ok: true };
    }
    case "owner_equity": {
      const T = TEMPLATES_RETAIL[s.templateId];
      const room = c(T.ownerCapacity) - s.equity;
      if (room <= 0) return { ok: false, reason: "Los accionistas ya aportaron lo que estaban dispuestos a poner." };
      if (s.relations.owner < 0.4) return { ok: false, reason: "La confianza del consejo está demasiado baja para pedir más capital." };
      const x = Math.min(c(cmd.amount), room);
      s.equity += x;
      tx(s, [["aportacion_por_recibir", x], ["capital", -x]]);
      schedule(s, s.day + 10, "in", "aportacion_por_recibir", x, "Aportación de capital de los accionistas", undefined, cmd.id);
      s.relations.owner = clamp(s.relations.owner - (s.overdue.length ? 0.25 : 0.12));
      event(s, "decision_financiera", `Los accionistas aportan $${fmt(x)}. Llega en diez días; en la próxima sesión querrán ver cómo se evita repetirlo.`, cmd.id);
      return { ok: true };
    }
    case "supplier_terms": {
      if (oldest(s, "proveedores") > 0) return { ok: false, reason: "Con saldo vencido, los proveedores no negocian plazo: primero hay que ponerse al corriente." };
      if (s.supply.extraDays) return { ok: false, reason: "Ya hay un convenio de plazo vigente." };
      for (const x of s.sched) if (x.acc === "proveedores" && x.dir === "out") x.day += cmd.extraDays;
      s.supply.extraDays = cmd.extraDays; s.supply.extraUntil = s.day + 120; s.supply.extraCost = cmd.cost;
      s.relations.suppliers = clamp(s.relations.suppliers - 0.06);
      event(s, "decision_financiera", `Los proveedores aceptan ${cmd.extraDays} días más de plazo durante cuatro meses a cambio de ${(cmd.cost * 100).toFixed(1)} % más en sus precios.`, cmd.id);
      return { ok: true };
    }
    case "payment_plan": {
      const due = overdueTotal(s, "fisco");
      if (!due) return { ok: false, reason: "No hay adeudos fiscales vencidos." };
      const byAcc = new Map<string, number>();
      for (const o of s.overdue.filter((x) => x.creditor === "fisco")) byAcc.set(o.acc, (byAcc.get(o.acc) ?? 0) + o.amount);
      s.overdue = s.overdue.filter((o) => o.creditor !== "fisco");
      for (const [acc, amt] of byAcc) {
        let left = amt;
        for (let i = 1; i <= cmd.months; i++) { const part = i === cmd.months ? left : Math.round(amt / cmd.months); left -= part; schedule(s, s.day + i * MONTH, "out", acc, part, `Parcialidad ${i} de ${cmd.months} del convenio fiscal`, "fisco", cmd.id); }
      }
      for (let i = 1; i <= cmd.months; i++) {
        const extra = Math.round((due * 0.0126 * (cmd.months - i + 1)) / cmd.months);
        tx(s, [["recargos", extra], ["imss", -extra]]);
        schedule(s, s.day + i * MONTH, "out", "imss", extra, `Recargos de la parcialidad ${i} del convenio fiscal`, "fisco", cmd.id);
      }
      event(s, "decision_financiera", `Se firma convenio de pago en ${cmd.months} parcialidades con recargo de 1.26 % mensual.`, cmd.id);
      return { ok: true };
    }
    case "pause_capex":
      if (cmd.on) { s.flags.capexPausedSince = s.day; s.mods.push({ key: "demand", mult: 0.985, from: s.day + 60, until: Number.MAX_SAFE_INTEGER, ref: `${cmd.id}:desgaste` }); }
      else { delete s.flags.capexPausedSince; s.mods = s.mods.filter((m) => !m.ref.endsWith(":desgaste")); }
      event(s, "decision", cmd.on ? "Se pospone la inversión de mantenimiento. Después de dos meses los refrigeradores fallan más y las tiendas se ven descuidadas." : "Se reanuda la inversión de mantenimiento.", cmd.id);
      return { ok: true };
    case "one_off": {
      const amt = c(cmd.amount);
      if (amt <= 0) return { ok: true };
      if (cmd.account === "otros_ingresos") { tx(s, [["clientes", amt], ["otros_ingresos", -amt]]); schedule(s, s.day + cmd.payInDays, "in", "clientes", amt, cmd.label, undefined, cmd.id); return { ok: true }; }
      if (cmd.capex) { capex(s, amt, cmd.payInDays, cmd.label, cmd.id); return { ok: true }; }
      tx(s, [["otros_gastos", amt], ["acreedores", -amt]]);
      schedule(s, s.day + cmd.payInDays, "out", "acreedores", amt, cmd.label, "acreedores", cmd.id);
      return { ok: true };
    }
    case "modify":
      s.mods.push({ key: cmd.key, group: cmd.group, cat: cmd.cat, add: cmd.add, mult: cmd.mult, from: s.day + (cmd.inDays ?? 0), until: s.day + (cmd.inDays ?? 0) + cmd.days, ref: cmd.id });
      return { ok: true };
    case "safety": s.safety = clamp(s.safety + cmd.delta, 0.2, 0.98); return { ok: true };
    case "flag": s.flags[cmd.key] = cmd.value; return { ok: true };
    case "relation": s.relations[cmd.key] = clamp(s.relations[cmd.key] + cmd.delta); return { ok: true };
    case "later": s.pending.push({ day: s.day + Math.max(1, cmd.inDays), cmd: cmd.cmd }); return { ok: true };
    case "add_fixed": s.fixed.push({ id: cmd.id, label: cmd.label, amount: c(cmd.amount) }); return { ok: true };
    case "remove_fixed": s.fixed = s.fixed.filter((f) => f.id !== cmd.fixedId); return { ok: true };
    case "dividend": {
      const x = c(cmd.amount);
      const reserve = (storePayroll(s) + officePayroll(s)) * 2;
      if (s.overdue.length) return { ok: false, reason: "Con adeudos vencidos no se pueden repartir dividendos." };
      if (cashOf(s) - x < reserve) return { ok: false, reason: `Después del dividendo la caja quedaría por debajo de dos nóminas ($${fmt(reserve)}).` };
      tx(s, [["capital", x], ["caja", -x]], "financiamiento");
      s.relations.owner = clamp(s.relations.owner + 0.1);
      event(s, "dividendo", `Se reparten $${fmt(x)} de dividendos a los accionistas.`, cmd.id);
      return { ok: true };
    }
    case "prepay_debt": {
      const loan = [...s.loans].filter((l) => l.balance > 0).sort((a, b) => b.rate - a.rate)[0];
      if (!loan) return { ok: false, reason: "No hay créditos por pagar." };
      const x = Math.min(c(cmd.amount), loan.balance, Math.max(0, cashOf(s)));
      if (x <= 0) return { ok: false, reason: "No hay caja para prepagar." };
      tx(s, [["deuda", x], ["caja", -x]], "financiamiento");
      loan.balance -= x;
      s.relations.bank = clamp(s.relations.bank + 0.05);
      event(s, "credito", `Se prepagan $${fmt(x)} del crédito con ${loan.lender}.`, cmd.id);
      return { ok: true };
    }
  }
}

// ───────────────────────────────────────────────────────── alternativas ante falta de caja
export interface LiquidityOption { id: string; label: string; cash: number; cost: string; inDays: number; cmd: RetailCommand; available: boolean; reason?: string }
export function liquidityOptions(s: RetailState, tag = "liq"): LiquidityOption[] {
  const T = TEMPLATES_RETAIL[s.templateId];
  const id = (k: string) => `${tag}:${k}:${s.day}`;
  const out: LiquidityOption[] = [];
  const provOut = s.sched.filter((x) => x.acc === "proveedores" && x.dir === "out" && x.day <= s.day + 15).reduce((a, x) => a + x.amount, 0);
  out.push({ id: "plazo", label: "Negociar 15 días más de plazo con los proveedores de mercancía", cash: provOut, cost: "1 % más en el precio de lo que se compre durante cuatro meses", inDays: 0, cmd: { type: "supplier_terms", id: id("plazo"), extraDays: 15, cost: 0.01 }, available: oldest(s, "proveedores") === 0 && !s.supply.extraDays && provOut > 0, reason: oldest(s, "proveedores") > 0 ? "Con saldo vencido no negocian plazo." : s.supply.extraDays ? "Ya hay un convenio vigente." : undefined });
  const fisco = overdueTotal(s, "fisco");
  out.push({ id: "convenio", label: "Convenio de pago en parcialidades con IMSS y SAT", cash: fisco, cost: "recargo de 1.26 % mensual", inDays: 0, cmd: { type: "payment_plan", id: id("convenio"), months: 6 }, available: fisco > 0, reason: fisco ? undefined : "No hay adeudos fiscales vencidos." });
  const inv = Object.values(s.inv).reduce((a, x) => a + x, 0);
  const invCut = s.mods.some((m) => m.key === "invDays" && m.ref.includes(":inventario:") && m.until > s.day);
  out.push({ id: "inventario", label: "Bajar 25 % los días de inventario de abarrotes durante tres meses", cash: Math.round(s.inv.abarrotes * 0.25), cost: "más faltantes en anaquel: se pierde algo de venta", inDays: 20, cmd: { type: "modify", id: id("inventario"), key: "invDays", cat: "abarrotes", mult: 0.75, days: 90 }, available: inv > 0 && s.inv.abarrotes > 0 && !invCut, reason: invCut ? "Ya hay un recorte de inventario vigente: recortar más vacía los anaqueles." : undefined });
  const loanAmt = 60_000_000;
  const q = bankQuote(s, loanAmt, T.bankRate, 24);
  out.push({ id: "credito", label: `Crédito de capital de trabajo por $${loanAmt.toLocaleString("en-US")} a 24 meses`, cash: c(loanAmt) - Math.round(c(loanAmt) * 0.015), cost: `pago de $${fmt(q.payment)} al mes`, inDays: 10, cmd: { type: "term_loan", id: id("credito"), amount: loanAmt, rate: T.bankRate, months: 24, purpose: "capital de trabajo" }, available: q.ok, reason: q.reason });
  out.push({ id: "capex", label: "Posponer la inversión de mantenimiento de tiendas", cash: s.sustainingCapex, cost: "después de dos meses los equipos fallan más y la venta baja un poco", inDays: 30, cmd: { type: "pause_capex", id: id("capex"), on: true }, available: s.flags.capexPausedSince === undefined && s.sustainingCapex > 0, reason: s.flags.capexPausedSince !== undefined ? "Ya está pospuesta." : undefined });
  const room = Math.max(0, c(T.ownerCapacity) - s.equity);
  const ask = Math.min(room, Math.max(c(10_000_000), Math.round(room / 2)));
  out.push({ id: "aportacion", label: "Pedir una aportación de capital a los accionistas", cash: ask, cost: "baja la confianza del consejo; su capital exige rendimiento", inDays: 10, cmd: { type: "owner_equity", id: id("aportacion"), amount: Math.round(ask / 100) }, available: room > 0 && s.relations.owner >= 0.4, reason: room <= 0 ? "Ya aportaron lo que estaban dispuestos a poner." : s.relations.owner < 0.4 ? "La confianza del consejo está demasiado baja." : undefined });
  return out;
}

export function investedCapital(s: RetailState): number {
  const A = (a: string) => bal(s, a);
  const opLiab = -(A("proveedores") + A("acreedores") + A("cfe") + A("imss") + A("aguinaldo_pp") + A("activo_por_pagar") + A("acreedores_nomina"));
  return A("activo_fijo") + A("clientes") + A("inventario") + Math.max(0, A("caja")) - opLiab;
}
