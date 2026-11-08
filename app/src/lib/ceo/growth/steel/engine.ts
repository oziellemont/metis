/**
 * mêtis CEO · Acería v2 · motor económico determinista (módulo separado; no toca las partidas v1).
 *
 * Principios:
 *  1. Partida doble en centavos enteros: cada movimiento es un asiento balanceado. El balance cuadra al centavo y los
 *     saldos de caja, clientes, inventario, proveedores y deuda se concilian contra su detalle (pruebas).
 *  2. Saldos iniciales coherentes: la empresa opera 14 meses ANTES de tu llegada (enero del año anterior a febrero),
 *     con el mismo motor. Así al llegar ya existen cuentas por cobrar por factura, inventario de chatarra y producto,
 *     proveedores por pagar, cuotas del mes anterior, la declaración anual de ISR (marzo) y la PTU (mayo) pendientes.
 *  3. Cobros por factura: cada venta se cobra según el plazo de SU contrato (30, 45 o 60 días) más el atraso habitual
 *     de ese cliente y del escenario. Cada compra se paga según el plazo de su proveedor.
 *  4. Sin caja negativa: lo que vence y no se puede pagar se vuelve adeudo vencido con su acreedor, y cada acreedor
 *     reacciona con consecuencias operativas (chatarra solo de contado o suspendida, corte de energía, maquila detenida,
 *     recargos fiscales, clima laboral). La salida la decide el director con comandos de gestión.
 *  5. Impuestos: la provisión contable (ISR y PTU devengados cada mes) está separada de los pagos efectivos (pagos
 *     provisionales con coeficiente de utilidad el día 17, declaración anual en marzo y PTU en mayo).
 *  6. Las cifras salen del motor y de constantes con su base. La IA no calcula ni modifica efectos.
 */
import { STEEL as K, TERMS, BASE, TEMPLATES_V2, isProductionDay, marketIndex, type Product, type Scenario, type SteelTemplate } from "./params";

export const STEEL_MODEL_VERSION = 1;
export const MONTH = 30;
const PRE_DAYS = 420;
const c = (pesos: number) => Math.round(pesos * 100);
export const fmtM = (cents: number) => `${(cents / 1e8).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`;
export const fmt = (cents: number) => Math.round(cents / 100).toLocaleString("en-US");

// ───────────────────────────────────────────────────────── tipos
export type Creditor = "personal" | "cfe" | "fisco" | "banco" | "chatarra" | "acreedores";
export const CREDITOR_LABEL: Readonly<Record<Creditor, string>> = Object.freeze({ personal: "sueldos del personal", cfe: "energía eléctrica (CFE)", fisco: "IMSS, SAT y nómina estatal", banco: "pagos del crédito", chatarra: "proveedores de chatarra", acreedores: "consumibles, maquila y fletes" });
const PRIORITY: readonly Creditor[] = ["personal", "cfe", "fisco", "banco", "chatarra", "acreedores"];
export type CashCat = "operacion" | "inversion" | "financiamiento" | "impuestos";

/** `beta`: sensibilidad del cliente al ciclo. 1 = contrato de obra (precio y volumen siguen al mercado); 1.5 a 2 = distribuidor
 *  o relaminadora que compra al precio del día y recorta más fuerte su volumen cuando el mercado baja. */
export interface SContract { id: string; client: string; product: Product; tpd: number; price: number; dso: number; payDelay: number; startDay: number; ref?: string; backlog: number; beta?: number }
export interface Sched { day: number; dir: "in" | "out"; acc: string; creditor?: Creditor; amount: number; label: string; ref?: string }
export interface Overdue { acc: string; creditor: Creditor; amount: number; since: number; label: string }
export interface SLoan { id: string; lender: string; balance: number; rate: number; monthsLeft: number; startDay: number; ref: string }
export interface Crew { label: string; n: number; gross: number; perShift: number; ramp: { n: number; since: number }[] }
export interface Mod { key: "scrapPrice" | "yieldMelt" | "energy" | "availability" | "maquilaFee" | "demand" | "safety"; add?: number; mult?: number; until: number; ref: string }
export interface SEvent { day: number; kind: string; text: string; ref?: string }
export type Liquidity = "sana" | "alerta" | "crisis";

export interface SteelMonth {
  month: number;
  revenue: number; cogs: number; gross: number; payroll: number; rent: number; services: number; fixed: number; freight: number; penalties: number; other: number;
  ebitda: number; depreciation: number; operating: number; financial: number; pretax: number; ptu: number; isr: number; net: number;
  cashOperating: number; cashInvesting: number; cashFinancing: number; cashTaxes: number; freeCashFlow: number;
  cashEnd: number; receivables: number; inventory: number; payables: number; overdue: number; debt: number; taxPayable: number; equity: number;
  tonsDemand: number; tonsSold: number; tonsShort: number; tonsProduced: number; capacity: number; utilization: number;
  liquidity: Liquidity; headcount: number;
}

export interface SteelState {
  v: 2; modelVersion: number; templateId: string; seed: string; day: number; scenario: Scenario;
  plant: SteelTemplate["plant"] & { availability: number; templateShifts: number; rollingActive: boolean };
  crews: Record<string, Crew>;
  fixed: { id: string; label: string; amount: number }[];
  rent: number; siteUtilities: number; sustainingCapex: number;
  contracts: SContract[];
  inv: { scrapT: number; scrapV: number; billetT: number; billetV: number; rebarT: number; rebarV: number };
  acc: Record<string, number>;
  pl: Record<string, Record<string, number>>;
  cashCat: Record<string, Record<CashCat, number>>;
  cfeUnbilled: number;
  sched: Sched[];
  overdue: Overdue[];
  loans: SLoan[];
  tax: { year: number; revenue: number; taxable: number; isrProv: number; ptuProv: number; ppPaid: number; coef: number; lossCarry: number; closed: boolean };
  relations: { staff: number; suppliers: number; bank: number; owner: number; clients: number };
  supply: { scrapCashOnly: boolean; scrapStopped: boolean; consumablesStopped: boolean; powerCut: boolean; scrapExtraDays: number; scrapExtraUntil: number; scrapPriceUp: number };
  mods: Mod[];
  flags: Record<string, string | number | boolean>;
  safety: number;
  equity: number;
  events: SEvent[];
  months: SteelMonth[];
  cur: { demand: number; sold: number; short: number; produced: number; capacity: number; cashBegin: number; lowFillPrev: boolean };
  applied: string[];
  nextId: number;
  liquidity: Liquidity;
}

// ───────────────────────────────────────────────────────── contabilidad
/** Cuentas de resultados (todo lo demás es balance). */
const PL = new Set(["ventas", "costo_ventas", "nomina", "cuotas", "aguinaldo", "renta", "servicios", "fijos", "fletes", "penalizaciones", "otros_gastos", "contratacion", "indemnizaciones", "depreciacion", "intereses", "recargos", "factoraje", "comisiones", "ptu", "isr", "otros_ingresos"]);
const EBITDA_ACC = ["ventas", "costo_ventas", "nomina", "cuotas", "aguinaldo", "renta", "servicios", "fijos", "fletes", "penalizaciones", "otros_gastos", "contratacion", "indemnizaciones", "otros_ingresos"];
const FIN_ACC = ["intereses", "recargos", "factoraje", "comisiones"];
const LIAB = ["chatarra", "acreedores", "activo_por_pagar", "cfe", "imss", "aguinaldo_pp", "isr_pp", "ptu_pp", "deuda"];
export const monthOf = (d: number) => Math.floor(d / MONTH);
const calOf = (s: SteelState, d: number) => { const t = TEMPLATES_V2[s.templateId].startMonth - 1 + monthOf(d); return { month: (((t % 12) + 12) % 12) + 1, year: Math.floor(t / 12) }; };

function tx(s: SteelState, lines: [string, number][], cat?: CashCat) {
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
const bal = (s: SteelState, a: string) => s.acc[a] ?? 0;
export const cashOf = (s: SteelState) => bal(s, "caja");

function schedule(s: SteelState, day: number, dir: "in" | "out", acc: string, amount: number, label: string, creditor?: Creditor, ref?: string) {
  if (amount <= 0) return;
  const hit = s.sched.find((x) => x.day === day && x.dir === dir && x.acc === acc && x.ref === ref && x.label === label);
  if (hit) { hit.amount += amount; return; }
  s.sched.push({ day, dir, acc, creditor, amount, label, ref });
}

const CAT_OF: Record<string, CashCat> = { deuda: "financiamiento", deuda_por_recibir: "financiamiento", aportacion_por_recibir: "financiamiento", capital: "financiamiento", activo_por_pagar: "inversion", isr_pp: "impuestos", imss: "operacion", ptu_pp: "operacion" };

/** Paga una obligación ya registrada como pasivo. Lo que no alcanza queda vencido con su acreedor. */
function payLiability(s: SteelState, acc: string, creditor: Creditor, amount: number, label: string): number {
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
function payDownOverdue(s: SteelState) {
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
export const overdueTotal = (s: SteelState, cr?: Creditor) => s.overdue.filter((o) => !cr || o.creditor === cr).reduce((a, o) => a + o.amount, 0);
const oldest = (s: SteelState, cr: Creditor) => { const xs = s.overdue.filter((o) => o.creditor === cr); return xs.length ? s.day - Math.min(...xs.map((o) => o.since)) : 0; };
export const debtOf = (s: SteelState) => s.loans.reduce((a, l) => a + l.balance, 0);

function event(s: SteelState, kind: string, text: string, ref?: string) { if (s.day >= 0) s.events.push({ day: s.day, kind, text, ref }); }

// ───────────────────────────────────────────────────────── parámetros vivos (escenario y modificadores de casos)
function modded(s: SteelState, key: Mod["key"], base: number): number {
  let v = base;
  for (const m of s.mods) if (m.key === key && s.day < m.until) { if (m.mult !== undefined) v *= m.mult; if (m.add !== undefined) v += m.add; }
  return v;
}
const scen = (s: SteelState) => (s.day >= 0 ? s.scenario : BASE);
export function prices(s: SteelState) {
  const mi = marketIndex(monthOf(s.day));
  const sc = scen(s);
  const shock = sc.steelShock && monthOf(s.day) + 1 >= sc.steelShock.from && monthOf(s.day) + 1 <= sc.steelShock.to ? sc.steelShock.mult : 1;
  return {
    steel: mi.steel * sc.price * shock,
    scrap: modded(s, "scrapPrice", K.scrapDelivered.value * mi.scrap * sc.scrap) * (1 + s.supply.scrapPriceUp),
    // El precio a recolectores es más pegajoso que el de la chatarra preparada: se mueve la mitad que el mercado.
    ownScrap: TEMPLATE_OWN_SCRAP * (1 + 0.5 * (mi.scrap * sc.scrap - 1)),
    kwh: modded(s, "energy", K.kwhPrice.value * sc.energy),
    yieldMelt: Math.max(0.8, modded(s, "yieldMelt", K.yieldMelt.value + sc.yieldMelt)),
    maquila: modded(s, "maquilaFee", K.maquilaFee.value),
    demand: modded(s, "demand", sc.demand),
  };
}
/** Costo de la chatarra del patio propio (compra directa a recolectores + corte). */
export const TEMPLATE_OWN_SCRAP = 5900;

// ───────────────────────────────────────────────────────── arranque
export function createSteel(templateId: string, seed = "metis", scenario: Scenario = BASE): SteelState {
  const T = TEMPLATES_V2[templateId];
  if (!T) throw new Error(`Plantilla de acería desconocida: ${templateId}`);
  const s: SteelState = {
    v: 2, modelVersion: STEEL_MODEL_VERSION, templateId, seed, day: -PRE_DAYS, scenario,
    plant: { ...T.plant, availability: 1, templateShifts: T.plant.shifts, rollingActive: T.plant.rollingTpd > 0 },
    crews: Object.fromEntries(T.crews.map((x) => [x.id, { label: x.label, n: x.n, gross: c(x.gross), perShift: ["horno", "colada", "laminacion"].includes(x.id) ? x.n / T.plant.shifts : 0, ramp: [] }])),
    fixed: T.fixed.map((f) => ({ ...f, amount: c(f.amount) })),
    rent: c(T.rent), siteUtilities: c(T.siteUtilities), sustainingCapex: c(T.sustainingCapex),
    contracts: T.contracts.map((k) => ({ id: k.id, client: k.client, product: k.product, tpd: k.tpd, price: c(k.price), dso: k.dso, payDelay: k.payDelay ?? 0, startDay: -10000, backlog: 0 })),
    inv: { scrapT: 0, scrapV: 0, billetT: 0, billetV: 0, rebarT: 0, rebarV: 0 },
    acc: {}, pl: {}, cashCat: {}, cfeUnbilled: 0, sched: [], overdue: [], loans: [],
    tax: { year: -1, revenue: 0, taxable: 0, isrProv: 0, ptuProv: 0, ppPaid: 0, coef: T.taxCoefficient, lossCarry: 0, closed: false },
    relations: { staff: 0.8, suppliers: 0.8, bank: 0.8, owner: 0.8, clients: 0.8 },
    supply: { scrapCashOnly: false, scrapStopped: false, consumablesStopped: false, powerCut: false, scrapExtraDays: 0, scrapExtraUntil: 0, scrapPriceUp: 0 },
    mods: [], flags: {}, safety: 0.8, equity: 0, events: [], months: [],
    cur: { demand: 0, sold: 0, short: 0, produced: 0, capacity: 0, cashBegin: 0, lowFillPrev: false },
    applied: [], nextId: 1, liquidity: "sana",
  };
  // Capital inicial: activos fijos y una caja de arranque para operar la historia previa.
  const book = c(T.assets.reduce((a, x) => a + x.book, 0));
  // Caja de arranque holgada para operar la historia previa sin atrasos (tres meses de venta); al llegar se ajusta a la plantilla.
  const startCash = Math.round(3 * MONTH * s.contracts.reduce((a, k) => a + k.tpd * k.price, 0));
  tx(s, [["activo_fijo", book], ["caja", startCash], ["capital", -(book + startCash)]], "financiamiento");
  // Inventario de chatarra inicial: los días de patio que se acostumbran.
  const dailyBillet = s.contracts.reduce((a, k) => a + (k.product === "palanquilla" ? k.tpd : k.tpd / K.yieldRoll.value), 0);
  const scrapT = dailyBillet * scrapPerBillet(K.yieldMelt.value) * T.plant.scrapDays;
  const scrapV = Math.round(scrapT * c(K.scrapDelivered.value));
  s.inv.scrapT = scrapT; s.inv.scrapV = scrapV;
  tx(s, [["inventario", scrapV], ["capital", -scrapV]], "financiamiento");
  if (T.debt) {
    // El crédito del laminador se tomó antes: se reconstruye para que al llegar quede el saldo y el plazo de la plantilla.
    const preMonths = PRE_DAYS / MONTH;
    const amount = c(T.debt.amount) * (T.debt.months + preMonths) / T.debt.months;
    const loan: SLoan = { id: "deuda_laminador", lender: T.debt.lender, balance: Math.round(amount), rate: T.debt.rate, monthsLeft: T.debt.months + preMonths, startDay: -PRE_DAYS, ref: "plantilla" };
    s.loans.push(loan);
    tx(s, [["caja", loan.balance], ["deuda", -loan.balance]], "financiamiento");
  }
  // Historia previa: el mismo motor, sin decisiones y con mercado base.
  for (let i = 0; i < PRE_DAYS; i++) step(s);
  // Al llegar, la caja es la de la plantilla: la diferencia se la llevó (o la puso) el dueño antes de tu llegada.
  const diff = cashOf(s) - c(T.cash);
  tx(s, [["capital", diff], ["caja", -diff]], "financiamiento");
  s.cashCat = {}; s.events = []; s.months = []; s.pl = Object.fromEntries(Object.entries(s.pl).filter(([k]) => Number(k) >= 0));
  if (s.overdue.length) throw new Error("La historia previa dejó adeudos vencidos: revisar la plantilla.");
  s.cur.cashBegin = cashOf(s);
  s.equity = 0;
  s.relations = { staff: 0.8, suppliers: 0.8, bank: 0.8, owner: 0.8, clients: 0.8 };
  s.supply = { scrapCashOnly: false, scrapStopped: false, consumablesStopped: false, powerCut: false, scrapExtraDays: 0, scrapExtraUntil: 0, scrapPriceUp: 0 };
  s.safety = 0.8; s.cur.lowFillPrev = false; s.liquidity = "sana";
  s.events.push({ day: 0, kind: "apertura", text: T.summary });
  return s;
}
export const scrapPerBillet = (yieldMelt: number) => 1 / (yieldMelt * K.yieldCast.value);

// ───────────────────────────────────────────────────────── capacidad
function crewEff(s: SteelState, id: string): number {
  const cr = s.crews[id];
  if (!cr) return 0;
  let n = cr.n;
  for (const r of cr.ramp) { const age = s.day - r.since; if (age < 45) n -= r.n * (1 - (0.6 + (0.4 * age) / 45)); }
  return n;
}
const crewFactor = (s: SteelState, id: string) => { const cr = s.crews[id]; if (!cr || !cr.perShift) return 1; return Math.min(1, crewEff(s, id) / (cr.perShift * s.plant.shifts)); };

export interface Capacity { melt: number; caster: number; billet: number; rollingOwn: number; maquila: number; limit: string }
export function capacity(s: SteelState): Capacity {
  const P = s.plant;
  const sc = scen(s);
  // Paros no programados: 2 % base; si el mantenimiento se recorta (escenario < 1) los paros suben.
  const downtime = 0.02 + 0.06 * Math.max(0, 1 - sc.maintenance);
  const capexGap = s.flags.capexPausedSince !== undefined && s.day - Number(s.flags.capexPausedSince) > 60 ? Math.min(0.08, (s.day - Number(s.flags.capexPausedSince) - 60) / 30 * 0.01) : 0;
  let avail = modded(s, "availability", P.availability) * (1 - downtime - capexGap);
  if (s.supply.consumablesStopped) avail *= 0.6;
  if (s.supply.powerCut) avail = 0;
  if (overdueTotal(s, "personal")) avail *= 0.88;
  avail *= 0.85 + 0.15 * s.relations.staff;
  const melt = P.furnaces * P.tPerFurnaceShift * P.shifts * avail * crewFactor(s, "horno");
  const caster = (P.casterTpd / P.templateShifts) * P.shifts * avail * crewFactor(s, "colada");
  const billet = Math.min(melt, caster);
  const rollingOwn = P.rollingActive ? P.rollingTpd * (s.supply.powerCut ? 0 : 1) * crewFactor(s, "laminacion") * Math.min(1, avail / 0.98) : 0;
  const maquila = s.supply.consumablesStopped ? 0 : P.maquilaTpd;
  return { melt, caster, billet, rollingOwn, maquila, limit: s.supply.powerCut ? "corte de energía" : melt <= caster ? "hornos" : "colada" };
}

// ───────────────────────────────────────────────────────── un día
function step(s: SteelState) {
  const d = s.day;
  activateAssets(s);
  // 1. Cobros y pagos del día: primero entra el dinero, luego se paga por prioridad.
  const today = s.sched.filter((x) => x.day === d);
  if (today.length) s.sched = s.sched.filter((x) => x.day !== d);
  for (const x of today.filter((y) => y.dir === "in")) tx(s, [["caja", x.amount], [x.acc, -x.amount]], CAT_OF[x.acc] ?? "operacion");
  payDownOverdue(s);
  for (const x of today.filter((y) => y.dir === "out").sort((a, b) => PRIORITY.indexOf(a.creditor!) - PRIORITY.indexOf(b.creditor!))) payLiability(s, x.acc, x.creditor!, x.amount, x.label);
  consequences(s);
  // 2. Operación.
  if (isProductionDay(d)) operate(s);
  // 3. Cierre de mes.
  if ((d + 1) % MONTH === 0) closeMonth(s);
  s.day++;
}

function operate(s: SteelState) {
  const px = prices(s);
  const cap = capacity(s);
  const live = s.contracts.filter((k) => k.startDay <= s.day);
  const want = (k: SContract) => k.tpd * dem(k, px) + k.backlog;
  const rebarDemand = live.filter((k) => k.product === "varilla").reduce((a, k) => a + want(k), 0);
  const billetDemand = live.filter((k) => k.product === "palanquilla").reduce((a, k) => a + want(k), 0);
  s.cur.demand += live.reduce((a, k) => a + k.tpd * dem(k, px), 0);
  s.cur.capacity += cap.billet;
  const spb = scrapPerBillet(px.yieldMelt);
  // Compras de chatarra para mantener los días de patio objetivo.
  const needBilletDaily = live.reduce((a, k) => a + (k.product === "palanquilla" ? k.tpd * dem(k, px) : 0), 0) + Math.min(cap.rollingOwn + cap.maquila, rebarDemand) / K.yieldRoll.value;
  const targetScrap = Math.min(needBilletDaily, cap.billet || needBilletDaily) * spb * s.plant.scrapDays;
  let buy = Math.max(0, targetScrap - s.inv.scrapT);
  if (buy > 0) {
    const own = buy * s.plant.ownScrapShare;
    let ext = buy - own;
    if (s.supply.scrapStopped) ext = 0;
    const ownV = Math.round(own * c(px.ownScrap));
    let extV = Math.round(ext * c(px.scrap));
    if (s.supply.scrapCashOnly && extV > 0) {
      // Solo de contado: se compra lo que alcance con la caja del día.
      const can = Math.max(0, cashOf(s) - ownV);
      if (extV > can) { ext = can / c(px.scrap); extV = Math.round(ext * c(px.scrap)); }
      if (extV > 0) tx(s, [["inventario", extV], ["caja", -extV]]);
    } else if (extV > 0) {
      tx(s, [["inventario", extV], ["chatarra", -extV]]);
      schedule(s, s.day + TERMS.scrap + s.supply.scrapExtraDays, "out", "chatarra", extV, "Pago a proveedores de chatarra", "chatarra");
    }
    if (ownV > 0) { tx(s, [["inventario", ownV], ["chatarra", -ownV]]); schedule(s, s.day + TERMS.ownScrap, "out", "chatarra", ownV, "Compra del patio a recolectores", "chatarra"); }
    s.inv.scrapT += own + ext; s.inv.scrapV += ownV + extV;
  }
  // Producción de palanquilla: pedidos + lo que se lamina + reponer inventario de producto.
  // Solo se cuela la palanquilla que se puede vender o laminar: la capacidad de laminación (propia + maquila) limita.
  const targetRebar = 3 * Math.max(0, rebarDemand - live.filter((k) => k.product === "varilla").reduce((a, k) => a + k.backlog, 0));
  const rebarPlan = Math.min(cap.rollingOwn + cap.maquila, Math.max(0, rebarDemand + (targetRebar - s.inv.rebarT) * 0.5));
  const billetForRoll = rebarPlan / K.yieldRoll.value;
  const targetBillet = 2 * billetDemand + billetForRoll;
  const billetNeed = Math.max(0, billetDemand + billetForRoll + (targetBillet - s.inv.billetT) * 0.5);
  const fromScrap = s.inv.scrapT / spb;
  const produce = Math.max(0, Math.min(cap.billet, billetNeed, fromScrap));
  if (produce > 0) {
    const scrapUse = produce * spb;
    const scrapCost = takeAvg(s, "scrap", scrapUse);
    const alloys = Math.round(produce * c(K.alloys.value));
    const refr = Math.round(produce * c(K.refractories.value));
    const energy = Math.round((produce / K.yieldCast.value) * K.kwhPerLiquidTon.value * c(px.kwh));
    tx(s, [["inventario", alloys + refr + energy], ["acreedores", -(alloys + refr)], ["cfe", -energy]]);
    s.cfeUnbilled += energy;
    schedule(s, s.day + TERMS.consumables, "out", "acreedores", alloys + refr, "Ferroaleaciones y refractarios", "acreedores");
    s.inv.billetT += produce; s.inv.billetV += scrapCost + alloys + refr + energy;
    s.cur.produced += produce;
  }
  // Laminación: propia primero, maquila después.
  const rebarWant = rebarPlan;
  const reserveForBillet = Math.min(s.inv.billetT, billetDemand);
  const rollable = Math.max(0, (s.inv.billetT - reserveForBillet) * K.yieldRoll.value);
  let rolledOwn = Math.min(cap.rollingOwn, rebarWant, rollable);
  let rolledMaq = Math.min(cap.maquila, rebarWant - rolledOwn, rollable - rolledOwn);
  rolledOwn = Math.max(0, rolledOwn); rolledMaq = Math.max(0, rolledMaq);
  const rolled = rolledOwn + rolledMaq;
  if (rolled > 0) {
    const billetUse = rolled / K.yieldRoll.value;
    const billetCost = takeAvg(s, "billet", billetUse);
    const own = Math.round(rolledOwn * c(K.ownRolling.value));
    const maq = Math.round(rolledMaq * c(px.maquila) + (rolledMaq / K.yieldRoll.value) * c(K.freightToMill.value));
    if (own + maq) { tx(s, [["inventario", own + maq], ["acreedores", -(own + maq)]]); schedule(s, s.day + TERMS.maquila, "out", "acreedores", own + maq, rolledMaq ? "Maquila de laminación y fletes al laminador" : "Gas de recalentamiento y rodillos", "acreedores"); }
    s.inv.rebarT += rolled; s.inv.rebarV += billetCost + own + maq;
  }
  // Entregas y facturas por contrato.
  deliver(s, live, "varilla", px);
  deliver(s, live, "palanquilla", px);
}

/** Demanda diaria del contrato: el ciclo pega más a los clientes de beta alta (con piso de 30 %). */
const dem = (k: SContract, px: { demand: number; steel: number }) => {
  const b = k.beta ?? 1;
  // Desviación de demanda amplificada por la beta; además, si el precio cae, el cliente de beta alta compra menos volumen.
  return Math.max(0.3, 1 + (px.demand - 1) * b + (px.steel - 1) * 2 * (b - 1));
};

function takeAvg(s: SteelState, kind: "scrap" | "billet" | "rebar", t: number): number {
  const T = kind === "scrap" ? "scrapT" : kind === "billet" ? "billetT" : "rebarT";
  const V = kind === "scrap" ? "scrapV" : kind === "billet" ? "billetV" : "rebarV";
  const stockT = s.inv[T], stockV = s.inv[V];
  if (t <= 0 || stockT <= 0) return 0;
  const take = Math.min(t, stockT);
  const v = take >= stockT - 1e-9 ? stockV : Math.round((stockV * take) / stockT);
  s.inv[T] = stockT - take; s.inv[V] = stockV - v;
  if (s.inv[T] < 1e-9) { s.inv[T] = 0; }
  return v;
}

function deliver(s: SteelState, live: SContract[], product: Product, px: ReturnType<typeof prices>) {
  const ks = live.filter((k) => k.product === product);
  if (!ks.length) return;
  const T = product === "varilla" ? "rebar" : "billet";
  const stock = s.inv[product === "varilla" ? "rebarT" : "billetT"];
  const wants = ks.map((k) => k.tpd * dem(k, px) + k.backlog);
  const total = wants.reduce((a, x) => a + x, 0);
  const ship = Math.min(stock, total);
  const share = total > 0 ? ship / total : 0;
  const cogs = takeAvg(s, T, ship);
  let rev = 0;
  ks.forEach((k, i) => {
    const t = wants[i] * share;
    const today = k.tpd * dem(k, px);
    const short = wants[i] - t;
    // Lo que no se entrega queda pendiente hasta tres días; después se pierde (y cuenta para penalización).
    const keep = Math.min(short, today * 3);
    s.cur.short += Math.max(0, short - keep) ;
    k.backlog = keep;
    s.cur.sold += t;
    const amount = Math.round(t * k.price * (1 + (px.steel - 1) * (k.beta ?? 1)));
    if (amount <= 0) return;
    rev += amount;
    tx(s, [["clientes", amount], ["ventas", -amount]]);
    const late = k.payDelay + (s.day >= 0 ? s.scenario.payDelay : 0);
    schedule(s, s.day + k.dso + late, "in", "clientes", amount, `Cobro a ${k.client}`, undefined, k.id);
    const fr = Math.round(amount * (product === "varilla" ? K.freightRebar.value : K.freightBillet.value));
    tx(s, [["fletes", fr], ["acreedores", -fr]]);
    schedule(s, s.day + TERMS.freight, "out", "acreedores", fr, "Fletes a clientes", "acreedores");
  });
  if (cogs) tx(s, [["costo_ventas", cogs], ["inventario", -cogs]]);
  void rev;
}

// ───────────────────────────────────────────────────────── consecuencias de los adeudos
function consequences(s: SteelState) {
  const R = s.relations, S = s.supply;
  const chat = overdueTotal(s, "chatarra");
  if (chat) {
    if (!S.scrapCashOnly) { S.scrapCashOnly = true; event(s, "proveedor", "Chatarras del Norte deja de dar crédito mientras haya saldo vencido: la chatarra se compra de contado o no llega."); }
    if (oldest(s, "chatarra") > 10 && !S.scrapStopped) { S.scrapStopped = true; event(s, "proveedor", "Los chatarreros suspenden las entregas por adeudos de más de diez días. Los hornos funden lo que quede en el patio."); }
    R.suppliers = clamp(R.suppliers - 0.004);
  } else {
    if (S.scrapStopped) { S.scrapStopped = false; event(s, "proveedor", "Se liquidan los adeudos de chatarra: vuelven las entregas, todavía de contado."); }
    if (S.scrapCashOnly && !s.overdue.length && s.flags.scrapCashOnlySince === undefined) s.flags.scrapCashOnlySince = s.day;
    if (S.scrapCashOnly && s.flags.scrapCashOnlySince !== undefined && s.day - Number(s.flags.scrapCashOnlySince) >= 45) { S.scrapCashOnly = false; delete s.flags.scrapCashOnlySince; event(s, "proveedor", "Tras mes y medio al corriente, los chatarreros restablecen el crédito de siete días."); }
    R.suppliers = clamp(R.suppliers + 0.001);
  }
  if (chat) delete s.flags.scrapCashOnlySince;
  const acr = overdueTotal(s, "acreedores");
  const wasStopped = S.consumablesStopped;
  S.consumablesStopped = acr > 0 && oldest(s, "acreedores") > 15;
  if (S.consumablesStopped && !wasStopped) event(s, "proveedor", "Proveedores de ferroaleaciones y refractario, y el laminador de maquila, suspenden servicio por adeudos de más de 15 días: la planta trabaja a medias y la varilla de maquila se detiene.");
  const cfe = overdueTotal(s, "cfe");
  const wasCut = S.powerCut;
  S.powerCut = cfe > 0 && oldest(s, "cfe") > 20;
  if (S.powerCut && !wasCut) event(s, "corte", "CFE corta el suministro de media tensión por falta de pago. Sin energía no hay fusión ni laminación.");
  if (!S.powerCut && wasCut) { const fee = c(25000); tx(s, [["otros_gastos", fee], ["acreedores", -fee]]); schedule(s, s.day + 1, "out", "acreedores", fee, "Reconexión de CFE", "acreedores"); event(s, "corte", "Se paga a CFE y se reconecta el suministro, con cargo por reconexión."); }
  const fisco = overdueTotal(s, "fisco");
  if (fisco) {
    const r = Math.round((fisco * K.lateTax.value) / MONTH);
    if (r > 0) { tx(s, [["recargos", r], ["imss", -r]]); addOverdue(s, "imss", "fisco", r, "Recargos por pagos fiscales vencidos"); }
    if (oldest(s, "fisco") === 45) event(s, "fisco", "El IMSS y el SAT emiten requerimientos de pago. La opinión de cumplimiento sale negativa: ningún banco presta así.");
  }
  if (overdueTotal(s, "personal")) { R.staff = clamp(R.staff - 0.02); if (oldest(s, "personal") === 3) event(s, "personal", "La nómina no se pagó completa. El sindicato pide reunión; la productividad cae y empiezan las renuncias de operadores con experiencia."); }
  else R.staff = clamp(R.staff + 0.002);
  const bank = overdueTotal(s, "banco");
  if (bank) { R.bank = clamp(R.bank - 0.01); const r = Math.round((bank * 0.26) / 360); if (r > 0) { tx(s, [["intereses", r], ["deuda", -r]]); addOverdue(s, "deuda", "banco", r, "Moratorios del crédito"); } }
  else if (!fisco) R.bank = clamp(R.bank + 0.0005);
  if (S.scrapExtraDays && s.day >= S.scrapExtraUntil) { S.scrapExtraDays = 0; S.scrapPriceUp = 0; }
  s.mods = s.mods.filter((m) => m.until > s.day);
}
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

// ───────────────────────────────────────────────────────── cierre de mes
function closeMonth(s: SteelState) {
  const m = monthOf(s.day);
  const cal = calOf(s, s.day);
  const next17 = (m + 1) * MONTH + 16;
  // Nómina: sueldos se pagan hoy; cuotas e ISN el 17 del mes siguiente; aguinaldo y prima se provisionan y se pagan en diciembre.
  let gross = 0;
  for (const cr of Object.values(s.crews)) gross += cr.n * cr.gross;
  const load = Math.round(gross * K.employerLoad.value), xmas = Math.round(gross * K.christmasBonus.value);
  tx(s, [["nomina", gross], ["acreedores_nomina", -gross]]);
  payLiability(s, "acreedores_nomina", "personal", gross, "Sueldos del mes");
  tx(s, [["cuotas", load], ["imss", -load]]);
  schedule(s, next17, "out", "imss", load, "Cuotas IMSS, INFONAVIT y nómina estatal", "fisco");
  tx(s, [["aguinaldo", xmas], ["aguinaldo_pp", -xmas]]);
  if (cal.month === 12) { const due = -bal(s, "aguinaldo_pp") - s.overdue.filter((o) => o.acc === "aguinaldo_pp").reduce((a, o) => a + o.amount, 0); if (due > 0) payLiability(s, "aguinaldo_pp", "personal", due, "Aguinaldo y prima vacacional"); }
  // Renta, gastos fijos (mantenimiento según escenario), servicios de planta y energía.
  const maint = scen(s).maintenance;
  tx(s, [["renta", s.rent], ["acreedores", -s.rent]]); schedule(s, s.day + 1, "out", "acreedores", s.rent, "Renta de planta", "acreedores");
  let fixed = 0;
  for (const f of s.fixed) fixed += f.id === "mantenimiento" ? Math.round(f.amount * maint) : f.amount;
  tx(s, [["fijos", fixed], ["acreedores", -fixed]]); schedule(s, s.day + 1, "out", "acreedores", fixed, "Gastos fijos de la empresa", "acreedores");
  tx(s, [["servicios", s.siteUtilities], ["cfe", -s.siteUtilities]]);
  const bill = s.cfeUnbilled + s.siteUtilities; s.cfeUnbilled = 0;
  schedule(s, (m + 1) * MONTH + 9, "out", "cfe", bill, "Recibo de CFE (energía, demanda y servicios de planta)", "cfe");
  // Depreciación y capex de mantenimiento.
  // Depreciación en línea recta sobre la base depreciable (activos de la plantilla + inversiones posteriores).
  const life = TEMPLATES_V2[s.templateId].assets[0].months;
  const depAmt = Math.max(0, Math.min(bal(s, "activo_fijo"), Math.round(depreciationBase(s) / life)));
  if (depAmt) tx(s, [["depreciacion", depAmt], ["activo_fijo", -depAmt]]);
  if (s.sustainingCapex && s.flags.capexPausedSince === undefined) capex(s, s.sustainingCapex, 1, "Inversión de mantenimiento (refacciones mayores)");
  // Créditos: intereses y abono lineal a capital.
  for (const l of s.loans) {
    if (l.balance <= 0 || s.day < l.startDay + MONTH - 1) continue;
    const interest = Math.round((l.balance * l.rate) / 12);
    const principal = l.monthsLeft > 0 ? Math.round(l.balance / l.monthsLeft) : l.balance;
    tx(s, [["intereses", interest], ["deuda", -interest]]);
    payLiability(s, "deuda", "banco", interest + principal, `Pago del crédito con ${l.lender}`);
    l.balance -= principal; l.monthsLeft = Math.max(0, l.monthsLeft - 1);
  }
  // Penalizaciones por entregas incompletas y cancelación del contrato más reciente.
  const fill = s.cur.demand > 0 ? (s.cur.demand - s.cur.short) / s.cur.demand : 1;
  if (fill < 0.95 && s.day >= 0) {
    const live = s.contracts.filter((k) => k.startDay <= s.day);
    const avg = live.length ? live.reduce((a, k) => a + k.price * k.tpd, 0) / live.reduce((a, k) => a + k.tpd, 0) : 0;
    const pen = Math.min(Math.round(s.cur.short * avg * K.penaltyShort.value), s.sched.filter((x) => x.dir === "in" && x.acc === "clientes").reduce((a, x) => a + x.amount, 0));
    if (pen > 0) { tx(s, [["penalizaciones", pen], ["clientes", -pen]]); reduceReceivables(s, pen); event(s, "incumplimiento", `Se entregó el ${Math.round(fill * 100)} % de lo comprometido. Los clientes descuentan $${fmt(pen)} de penalización de sus pagos.`); }
    s.relations.clients = clamp(s.relations.clients - (0.95 - fill));
    if (s.cur.lowFillPrev && fill < 0.85 && live.length > 1) {
      const newest = [...live].sort((a, b) => b.startDay - a.startDay)[0];
      s.contracts = s.contracts.filter((k) => k !== newest);
      event(s, "cancelacion", `${newest.client} cancela su contrato después de dos meses de entregas incompletas.`, newest.ref);
    }
  } else s.relations.clients = clamp(s.relations.clients + 0.02);
  s.cur.lowFillPrev = fill < 0.85;
  // Seguridad: incidente determinista si la cultura de seguridad se deteriora.
  if (s.day >= 0 && hash01(`${s.seed}|seg|${m}`) < (1 - s.safety) * 0.12) {
    const cost = c(TEMPLATES_V2[s.templateId].kind === "integrada" ? 1_200_000 : 350_000);
    s.flags.incidentes = Number(s.flags.incidentes ?? 0) + 1;
    tx(s, [["otros_gastos", cost], ["acreedores", -cost]]); schedule(s, s.day + 15, "out", "acreedores", cost, "Atención del incidente, paro y reparación", "acreedores");
    s.mods.push({ key: "availability", mult: 0.85, until: s.day + 10, ref: `incidente${m}` });
    s.relations.staff = clamp(s.relations.staff - 0.1);
    event(s, "seguridad", "Incidente en piso de colada: un operador lesionado y diez días de operación reducida mientras se investiga. La STPS revisa la planta.");
  }
  // Impuestos: provisión contable (devengado) separada de pagos (provisionales, anual y PTU).
  taxes(s, cal);
  // Capital de trabajo y resumen.
  if (s.day >= 0) s.months.push(summary(s, m));
  updateLiquidity(s);
  s.cur = { demand: 0, sold: 0, short: 0, produced: 0, capacity: 0, cashBegin: cashOf(s), lowFillPrev: s.cur.lowFillPrev };
}
/** Inversión: entra al activo fijo y se paga como inversión (no como operación). */
function capex(s: SteelState, amount: number, inDays: number, label: string, ref?: string, parts: [number, number][] = [[1, inDays]]) {
  tx(s, [["activo_fijo", amount], ["activo_por_pagar", -amount]]);
  let left = amount;
  parts.forEach(([share, d], i) => { const x = i === parts.length - 1 ? left : Math.round(amount * share); left -= x; schedule(s, s.day + d, "out", "activo_por_pagar", x, label, "acreedores", ref); });
  s.flags.depBase = depreciationBase(s) + amount;
}
function addOverdue(s: SteelState, acc: string, creditor: Creditor, amount: number, label: string) {
  const hit = s.overdue.find((o) => o.acc === acc && o.creditor === creditor);
  if (hit) hit.amount += amount; else s.overdue.push({ acc, creditor, amount, since: s.day, label });
}
function depreciationBase(s: SteelState): number {
  const T = TEMPLATES_V2[s.templateId];
  return Number(s.flags.depBase ?? c(T.assets.reduce((a, x) => a + x.book, 0)));
}
function reduceReceivables(s: SteelState, amount: number) {
  let left = amount;
  for (const x of [...s.sched].filter((y) => y.dir === "in" && y.acc === "clientes").sort((a, b) => a.day - b.day)) { if (left <= 0) break; const t = Math.min(left, x.amount); x.amount -= t; left -= t; }
  s.sched = s.sched.filter((x) => x.amount > 0);
}
export function hash01(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h / 0x100000000;
}

function plOf(s: SteelState, m: number, a: string) { return s.pl[String(m)]?.[a] ?? 0; }
function taxes(s: SteelState, cal: { month: number; year: number }) {
  const t = s.tax;
  if (t.year !== cal.year) { t.year = cal.year; t.revenue = 0; t.taxable = 0; t.isrProv = 0; t.ptuProv = 0; t.ppPaid = 0; t.closed = false; }
  const m = monthOf(s.day);
  t.revenue += -plOf(s, m, "ventas");
  // Utilidad fiscal del mes: resultado antes de ISR y PTU (supuesto: deducciones fiscales = contables).
  const pre = -Object.keys(s.pl[String(m)] ?? {}).filter((a) => a !== "isr" && a !== "ptu").reduce((a, k) => a + plOf(s, m, k), 0);
  t.taxable += pre;
  // La PTU pagada es deducible: la base de ISR es la utilidad menos la PTU y menos las pérdidas de años anteriores.
  // PTU: 10 % de la utilidad, con tope de tres meses de salario por trabajador (reforma 2021).
  const gross = Object.values(s.crews).reduce((a, cr) => a + cr.n * cr.gross, 0);
  const ptuTarget = Math.min(Math.round(Math.max(0, t.taxable) * K.ptu.value), gross * 3);
  const ptuDelta = ptuTarget - t.ptuProv;
  if (ptuDelta) tx(s, [["ptu", ptuDelta], ["ptu_pp", -ptuDelta]]);
  t.ptuProv = ptuTarget;
  const base = Math.max(0, t.taxable - ptuTarget - t.lossCarry);
  const isrTarget = Math.round(base * K.isr.value);
  const isrDelta = isrTarget - t.isrProv;
  if (isrDelta) tx(s, [["isr", isrDelta], ["isr_pp", -isrDelta]]);
  t.isrProv = isrTarget;
  // Pago provisional (día 17 del mes siguiente): coeficiente de utilidad × ingresos acumulados × 30 % − pagos previos.
  const pp = Math.max(0, Math.round(t.coef * t.revenue * K.isr.value) - t.ppPaid);
  if (pp > 0 && cal.month !== 12) { t.ppPaid += pp; schedule(s, (m + 1) * MONTH + 16, "out", "isr_pp", pp, "Pago provisional de ISR", "fisco"); }
  if (cal.month === 12) {
    // Cierre del ejercicio: declaración anual a fines de marzo, PTU a fines de mayo, nuevo coeficiente.
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

function summary(s: SteelState, m: number): SteelMonth {
  const g = (a: string) => plOf(s, m, a);
  const revenue = -g("ventas");
  const ebitda = -EBITDA_ACC.reduce((a, k) => a + g(k), 0);
  const depreciation = g("depreciacion");
  const financial = FIN_ACC.reduce((a, k) => a + g(k), 0);
  const operating = ebitda - depreciation;
  const pretax = operating - financial;
  const ptu = g("ptu"), isr = g("isr");
  const k = s.cashCat[String(m)] ?? { operacion: 0, inversion: 0, financiamiento: 0, impuestos: 0 };
  const payables = -LIAB.filter((a) => a !== "deuda" && a !== "isr_pp" && a !== "ptu_pp").reduce((a, x) => a + bal(s, x), 0);
  const assets = ["caja", "clientes", "inventario", "activo_fijo", "deuda_por_recibir", "aportacion_por_recibir"].reduce((a, x) => a + bal(s, x), 0);
  const liabilities = -LIAB.reduce((a, x) => a + bal(s, x), 0) - bal(s, "acreedores_nomina");
  return {
    month: m + 1, revenue, cogs: g("costo_ventas"), gross: revenue - g("costo_ventas"),
    payroll: g("nomina") + g("cuotas") + g("aguinaldo"), rent: g("renta"), services: g("servicios"), fixed: g("fijos"), freight: g("fletes"), penalties: g("penalizaciones"),
    other: g("otros_gastos") + g("contratacion") + g("indemnizaciones") + g("otros_ingresos"),
    ebitda, depreciation, operating, financial, pretax, ptu, isr, net: pretax - ptu - isr,
    cashOperating: k.operacion, cashInvesting: k.inversion, cashFinancing: k.financiamiento, cashTaxes: k.impuestos, freeCashFlow: k.operacion + k.inversion + k.impuestos,
    cashEnd: cashOf(s), receivables: bal(s, "clientes"), inventory: bal(s, "inventario"), payables, overdue: overdueTotal(s), debt: -bal(s, "deuda"), taxPayable: -(bal(s, "isr_pp") + bal(s, "ptu_pp")), equity: assets - liabilities,
    tonsDemand: Math.round(s.cur.demand), tonsSold: Math.round(s.cur.sold), tonsShort: Math.round(s.cur.short), tonsProduced: Math.round(s.cur.produced), capacity: Math.round(s.cur.capacity),
    utilization: s.cur.capacity > 0 ? Math.round((1000 * s.cur.produced) / s.cur.capacity) / 1000 : 0,
    liquidity: s.liquidity, headcount: headcountOf(s),
  };
}
export const headcountOf = (s: SteelState) => Object.values(s.crews).reduce((a, cr) => a + cr.n, 0);

/** Liquidez barata y determinista: crisis si hay vencidos; alerta si lo comprometido a 30 días no cabe en caja + cobros. */
function updateLiquidity(s: SteelState) {
  const prev = s.liquidity;
  const ins = s.sched.filter((x) => x.dir === "in" && x.day <= s.day + 30).reduce((a, x) => a + x.amount, 0);
  const outs = s.sched.filter((x) => x.dir === "out" && x.day <= s.day + 30).reduce((a, x) => a + x.amount, 0);
  const payroll = Object.values(s.crews).reduce((a, cr) => a + cr.n * cr.gross, 0);
  const next: Liquidity = s.overdue.length ? "crisis" : cashOf(s) + ins - outs - payroll < 0 ? "alerta" : "sana";
  if (next !== prev && s.day >= 0) {
    if (next === "alerta") event(s, "alerta_liquidez", `Lo que vence en los próximos 30 días (unos $${fmt(outs + payroll)}) no cabe en la caja más lo que se cobra en ese plazo. Hay tiempo para actuar.`);
    if (next === "crisis") event(s, "crisis_liquidez", `Hay $${fmt(overdueTotal(s))} vencidos con ${[...new Set(s.overdue.map((o) => CREDITOR_LABEL[o.creditor]))].join(", ")}. Cada acreedor reacciona distinto: hay que decidir cómo cubrirlo.`);
    if (next === "sana") event(s, "liquidez_resuelta", "Lo que vence en 30 días ya cabe en la caja y los cobros: la liquidez vuelve a estar bajo control.");
  }
  s.liquidity = next;
}

// ───────────────────────────────────────────────────────── API pública
export const cloneSteel = (s: SteelState): SteelState => JSON.parse(JSON.stringify(s), (_k, v) => (v === null ? null : v));
export function advanceSteel(s0: SteelState, days: number): SteelState {
  const s = cloneSteel(s0);
  for (let i = 0; i < days; i++) step(s);
  return s;
}
/** Avanza sin copiar (para simulaciones largas). */
export function runSteel(s: SteelState, days: number): SteelState { for (let i = 0; i < days; i++) step(s); return s; }

/** Balance: suma de todas las cuentas = 0 (partida doble). Devuelve las piezas para mostrar y probar. */
export function balanceSheet(s: SteelState) {
  const A = (a: string) => bal(s, a);
  const assets = { caja: A("caja"), clientes: A("clientes"), inventario: A("inventario"), activo_fijo: A("activo_fijo"), por_recibir: A("deuda_por_recibir") + A("aportacion_por_recibir"), isr_a_favor: Math.max(0, A("isr_pp")) };
  const liab = { chatarra: -A("chatarra"), acreedores: -A("acreedores") - A("acreedores_nomina") - A("activo_por_pagar"), cfe: -A("cfe"), imss: -A("imss"), aguinaldo: -A("aguinaldo_pp"), isr: Math.max(0, -A("isr_pp")), ptu: -A("ptu_pp"), deuda: -A("deuda") };
  const equity = -Object.entries(s.acc).filter(([a]) => a === "capital" || PL.has(a)).reduce((x, [, v]) => x + v, 0);
  const sumA = Object.values(assets).reduce((a, x) => a + x, 0), sumL = Object.values(liab).reduce((a, x) => a + x, 0);
  const total = Object.values(s.acc).reduce((a, x) => a + x, 0);
  return { assets, liab, equity, sumA, sumL, diff: sumA - sumL - equity, ledgerSum: total };
}

/** Conciliación: cada saldo de balance contra su detalle (facturas por cobrar, pagos programados, vencidos, inventario, préstamos). */
export function reconcile(s: SteelState): Record<string, number> {
  const sched = (acc: string, dir: "in" | "out") => s.sched.filter((x) => x.acc === acc && x.dir === dir).reduce((a, x) => a + x.amount, 0);
  const od = (acc: string) => s.overdue.filter((o) => o.acc === acc).reduce((a, o) => a + o.amount, 0);
  return {
    clientes: bal(s, "clientes") - sched("clientes", "in"),
    inventario: bal(s, "inventario") - (s.inv.scrapV + s.inv.billetV + s.inv.rebarV),
    chatarra: -bal(s, "chatarra") - sched("chatarra", "out") - od("chatarra"),
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
export type SteelCommand =
  | { type: "add_contract"; id: string; client: string; product: Product; tpd: number; price: number; dso: number; startInDays: number; payDelay?: number; beta?: number }
  | { type: "change_contract"; id: string; contractId: string; price?: number; tpd?: number; dso?: number; payDelay?: number }
  | { type: "drop_contract"; id: string; contractId: string }
  | { type: "hire"; id: string; crew: string; n: number; gross?: number }
  | { type: "fire"; id: string; crew: string; n: number }
  | { type: "set_shifts"; id: string; shifts: number }
  | { type: "add_furnace"; id: string; cost: number; tPerShift?: number; leadDays: number; financed?: number; rate?: number; months?: number; utilities: number }
  | { type: "expand_yard"; id: string; capex: number; share: number; crew: number }
  | { type: "buy_rolling_mill"; id: string; capex: number; tpd: number; crew: number; leadDays: number; financed: number; rate: number; months: number; utilities: number }
  | { type: "term_loan"; id: string; amount: number; rate: number; months: number; purpose: string }
  | { type: "factoring"; id: string; days: number }
  | { type: "owner_equity"; id: string; amount: number }
  | { type: "supplier_terms"; id: string; extraDays: number }
  | { type: "sell_stock"; id: string; product: "chatarra" | "palanquilla"; tons: number }
  | { type: "payment_plan"; id: string; months: number }
  | { type: "pause_capex"; id: string; on: boolean }
  | { type: "one_off"; id: string; label: string; amount: number; capex?: boolean; payInDays: number; account?: "otros_gastos" | "otros_ingresos" }
  | { type: "modify"; id: string; key: Mod["key"]; add?: number; mult?: number; days: number }
  | { type: "maquila_capacity"; id: string; tpd: number }
  | { type: "safety"; id: string; delta: number }
  | { type: "downtime"; id: string; days: number }
  | { type: "flag"; id: string; key: string; value: string | number | boolean }
  | { type: "relation"; id: string; key: keyof SteelState["relations"]; delta: number };

export interface SteelResult { ok: boolean; reason?: string }
const SEVERANCE_MONTHS = 4.2;

/** Cotización del banco para un crédito: cobertura del servicio de deuda con el EBITDA de los últimos tres meses. */
export function bankQuote(s: SteelState, amount: number, rate: number, months: number): { ok: boolean; reason?: string; payment: number } {
  const last = s.months.slice(-3);
  const e = last.length ? last.reduce((a, x) => a + x.ebitda, 0) / last.length : estimatedEbitda(s);
  const existing = s.loans.reduce((a, l) => a + (l.balance > 0 ? Math.round(l.balance / Math.max(1, l.monthsLeft)) + Math.round((l.balance * l.rate) / 12) : 0), 0);
  const payment = Math.round(c(amount) / months + (c(amount) * rate) / 12);
  if (oldest(s, "fisco") > 30) return { ok: false, reason: "Con adeudos fiscales de más de un mes la opinión de cumplimiento es negativa: el banco no puede prestar.", payment };
  if (s.relations.bank < 0.5) return { ok: false, reason: "El historial reciente de pagos con el banco impide un crédito nuevo.", payment };
  if (e <= 0) return { ok: false, reason: "Sin EBITDA positivo no hay capacidad de pago demostrable.", payment };
  if ((existing + payment) > e * 0.75) return { ok: false, reason: `El servicio de deuda quedaría en $${fmt(existing + payment)} al mes contra un EBITDA de $${fmt(Math.round(e))}: el banco pide cobertura de al menos 1.3 veces.`, payment };
  return { ok: true, payment };
}
function estimatedEbitda(s: SteelState) { return Math.round(-Object.entries(s.pl).slice(-3).reduce((a, [, p]) => a + EBITDA_ACC.reduce((x, k) => x + (p[k] ?? 0), 0), 0) / 3); }

export function applySteel(s: SteelState, cmd: SteelCommand): SteelResult {
  if (s.applied.includes(cmd.id)) return { ok: true, reason: "ya aplicada" };
  const r = applyInner(s, cmd);
  if (r.ok) s.applied.push(cmd.id);
  return r;
}

function addLoan(s: SteelState, id: string, lender: string, amount: number, rate: number, months: number, inDays: number, ref: string) {
  const loan: SLoan = { id, lender, balance: amount, rate, monthsLeft: months, startDay: s.day + inDays, ref };
  s.loans.push(loan);
  tx(s, [["deuda_por_recibir", amount], ["deuda", -amount]]);
  schedule(s, s.day + inDays, "in", "deuda_por_recibir", amount, `Dispersión del crédito (${lender})`, undefined, ref);
  const fee = Math.round(amount * 0.015);
  tx(s, [["comisiones", fee], ["acreedores", -fee]]); schedule(s, s.day + inDays, "out", "acreedores", fee, "Comisión de apertura del crédito", "acreedores");
}

function hireCost(s: SteelState, crew: string, n: number) {
  const cr = s.crews[crew];
  const cost = Math.round(n * cr.gross * 0.6);
  tx(s, [["contratacion", cost], ["acreedores", -cost]]); schedule(s, s.day + 15, "out", "acreedores", cost, "Reclutamiento, alta, EPP y capacitación", "acreedores");
}

function applyInner(s: SteelState, cmd: SteelCommand): SteelResult {
  switch (cmd.type) {
    case "add_contract":
      s.contracts.push({ id: cmd.id, client: cmd.client, product: cmd.product, tpd: cmd.tpd, price: c(cmd.price), dso: cmd.dso, payDelay: cmd.payDelay ?? 0, startDay: s.day + cmd.startInDays, ref: cmd.id, backlog: 0, beta: cmd.beta });
      event(s, "contrato", `Se firma con ${cmd.client}: ${cmd.tpd} t diarias de ${cmd.product} a $${cmd.price.toLocaleString("en-US")} por tonelada, pago a ${cmd.dso} días, desde dentro de ${cmd.startInDays} días.`, cmd.id);
      return { ok: true };
    case "change_contract": {
      const k = s.contracts.find((x) => x.id === cmd.contractId);
      if (!k) return { ok: false, reason: "Ese contrato ya no existe." };
      if (cmd.price !== undefined) k.price = c(cmd.price);
      if (cmd.tpd !== undefined) k.tpd = cmd.tpd;
      if (cmd.dso !== undefined) k.dso = cmd.dso;
      if (cmd.payDelay !== undefined) k.payDelay = cmd.payDelay;
      return { ok: true };
    }
    case "drop_contract": {
      const k = s.contracts.find((x) => x.id === cmd.contractId);
      if (!k) return { ok: false, reason: "Ese contrato ya no existe." };
      s.contracts = s.contracts.filter((x) => x !== k);
      event(s, "contrato", `Termina la relación con ${k.client}.`, cmd.id);
      return { ok: true };
    }
    case "hire": {
      const cr = s.crews[cmd.crew];
      if (!cr) return { ok: false, reason: "Esa cuadrilla no existe en la planta." };
      // Curva de aprendizaje: la gente nueva rinde 60 % al entrar y llega al 100 % en 45 días.
      cr.n += cmd.n; cr.ramp.push({ n: cmd.n, since: s.day });
      cr.ramp = cr.ramp.filter((r) => s.day - r.since < 45);
      hireCost(s, cmd.crew, cmd.n);
      return { ok: true };
    }
    case "fire": {
      const cr = s.crews[cmd.crew];
      if (!cr || cr.n < cmd.n) return { ok: false, reason: "No hay tantas personas en esa cuadrilla." };
      cr.n -= cmd.n;
      const sev = Math.round(cmd.n * cr.gross * SEVERANCE_MONTHS);
      tx(s, [["indemnizaciones", sev], ["acreedores_nomina", -sev]]);
      payLiability(s, "acreedores_nomina", "personal", sev, "Indemnizaciones y finiquitos");
      s.relations.staff = clamp(s.relations.staff - 0.05 * Math.min(4, cmd.n / 4));
      event(s, "baja", `Salen ${cmd.n} personas de ${cr.label.toLowerCase()}: se pagan $${fmt(sev)} de indemnización y finiquito.`, cmd.id);
      return { ok: true };
    }
    case "set_shifts": {
      const to = Math.max(1, Math.min(3, Math.round(cmd.shifts)));
      const from = s.plant.shifts;
      if (to === from) return { ok: false, reason: `La planta ya opera a ${to} turnos.` };
      const crews = ["horno", "colada", ...(s.plant.rollingActive ? ["laminacion"] : [])];
      const sup = s.crews.mandos, mant = s.crews.mantenimiento;
      if (to > from) {
        for (const id of crews) { const cr = s.crews[id]; const n = Math.round(cr.perShift * (to - from)); applyInner(s, { type: "hire", id: `${cmd.id}:${id}`, crew: id, n }); }
        applyInner(s, { type: "hire", id: `${cmd.id}:m`, crew: "mandos", n: to - from });
        applyInner(s, { type: "hire", id: `${cmd.id}:t`, crew: "mantenimiento", n: to - from });
        s.siteUtilities += Math.round(s.siteUtilities * 0.12 * (to - from));
      } else {
        for (const id of crews) { const cr = s.crews[id]; const n = Math.min(cr.n, Math.round(cr.perShift * (from - to))); applyInner(s, { type: "fire", id: `${cmd.id}:${id}`, crew: id, n }); }
        if (sup.n > 2) applyInner(s, { type: "fire", id: `${cmd.id}:m`, crew: "mandos", n: Math.min(sup.n - 2, from - to) });
        if (mant.n > 2) applyInner(s, { type: "fire", id: `${cmd.id}:t`, crew: "mantenimiento", n: Math.min(mant.n - 2, from - to) });
        s.siteUtilities = Math.round(s.siteUtilities / (1 + 0.12 * (from - to)));
      }
      s.plant.shifts = to;
      event(s, "turno", `La planta pasa a ${to} turno${to > 1 ? "s" : ""}.`, cmd.id);
      return { ok: true };
    }
    case "add_furnace": {
      const cost = c(cmd.cost), fin = c(cmd.financed ?? 0);
      if (cashOf(s) + fin < cost * 0.3) return { ok: false, reason: `El anticipo del horno (30 %) es de $${fmt(Math.round(cost * 0.3))}; la caja y el crédito no alcanzan.` };
      if (fin) { const q = bankQuote(s, cmd.financed!, cmd.rate ?? 0.13, cmd.months ?? 60); if (!q.ok) return { ok: false, reason: q.reason }; addLoan(s, `l${s.nextId++}`, "Banco Regional del Norte", fin, cmd.rate ?? 0.13, cmd.months ?? 60, 10, cmd.id); }
      capex(s, cost, 0, "Horno de inducción (anticipo y liquidación)", cmd.id, [[0.3, 10], [0.7, cmd.leadDays]]);
      s.flags[`horno:${cmd.id}`] = s.day + cmd.leadDays;
      pendingFurnace(s, cmd, s.day + cmd.leadDays);
      event(s, "inversion", `Se ordena un horno de inducción: $${fmt(cost)}, llega en ${cmd.leadDays} días.`, cmd.id);
      return { ok: true };
    }
    case "expand_yard": {
      const cost = c(cmd.capex);
      if (cashOf(s) < cost * 0.5) return { ok: false, reason: `La ampliación pide $${fmt(Math.round(cost * 0.5))} de anticipo; la caja tiene $${fmt(cashOf(s))}.` };
      capex(s, cost, 0, "Prensa-cizalla y báscula del patio", cmd.id, [[0.5, 5], [0.5, 60]]);
      s.flags.yardShareAt = s.day + 60; s.flags.yardShare = cmd.share;
      applyInner(s, { type: "hire", id: `${cmd.id}:p`, crew: "patio", n: cmd.crew });
      event(s, "inversion", `Se amplía el patio de chatarra: en dos meses la chatarra propia sube a ${Math.round(cmd.share * 100)} % de la carga.`, cmd.id);
      return { ok: true };
    }
    case "buy_rolling_mill": {
      const cost = c(cmd.capex), fin = c(cmd.financed);
      const q = bankQuote(s, cmd.financed, cmd.rate, cmd.months);
      if (fin && !q.ok) return { ok: false, reason: q.reason };
      if (cashOf(s) + fin < cost * 0.35) return { ok: false, reason: "El enganche del laminador no cabe en la caja." };
      if (fin) addLoan(s, `l${s.nextId++}`, "Banco Regional del Norte", fin, cmd.rate, cmd.months, 15, cmd.id);
      capex(s, cost, 0, "Laminador (enganche y liquidación)", cmd.id, [[0.35, 15], [0.65, cmd.leadDays]]);
      s.flags.millAt = s.day + cmd.leadDays; s.flags.millTpd = cmd.tpd; s.flags.millCrew = cmd.crew; s.flags.millUtil = cmd.utilities;
      event(s, "inversion", `Se compra un laminador de ${cmd.tpd} t diarias: arranca en ${cmd.leadDays} días.`, cmd.id);
      return { ok: true };
    }
    case "term_loan": {
      const q = bankQuote(s, cmd.amount, cmd.rate, cmd.months);
      if (!q.ok) { event(s, "rechazo", `El banco dice que no: ${q.reason}`, cmd.id); return { ok: false, reason: q.reason }; }
      addLoan(s, `l${s.nextId++}`, "Banco Regional del Norte", c(cmd.amount), cmd.rate, cmd.months, 10, cmd.id);
      event(s, "credito", `El banco aprueba $${cmd.amount.toLocaleString("en-US")} a ${cmd.months} meses (${Math.round(cmd.rate * 100)} % anual) para ${cmd.purpose}. Llega en diez días.`, cmd.id);
      return { ok: true };
    }
    case "factoring": {
      if (s.relations.bank < 0.4) return { ok: false, reason: "La financiera revisa el buró y no opera con atrasos bancarios." };
      const xs = s.sched.filter((x) => x.dir === "in" && x.acc === "clientes" && x.day > s.day && x.day <= s.day + cmd.days);
      const face = xs.reduce((a, x) => a + x.amount, 0);
      if (!face) return { ok: false, reason: "No hay facturas por cobrar en ese plazo." };
      const cost = Math.round(xs.reduce((a, x) => a + (x.amount * 0.22 * (x.day - s.day)) / 360, 0) + face * 0.01);
      s.sched = s.sched.filter((x) => !xs.includes(x));
      tx(s, [["factoraje", cost], ["clientes", -cost]]);
      schedule(s, s.day + 3, "in", "clientes", face - cost, "Factoraje: anticipo de facturas", undefined, cmd.id);
      event(s, "decision_financiera", `Se ceden facturas por $${fmt(face)}: entran $${fmt(face - cost)} en tres días con un descuento de $${fmt(cost)}.`, cmd.id);
      return { ok: true };
    }
    case "owner_equity": {
      const T = TEMPLATES_V2[s.templateId];
      const room = c(T.ownerCapacity) - s.equity;
      if (room <= 0) return { ok: false, reason: "El dueño ya aportó lo que estaba dispuesto a poner." };
      if (s.relations.owner < 0.4) return { ok: false, reason: "La confianza del dueño está demasiado baja para pedirle más dinero." };
      const x = Math.min(c(cmd.amount), room);
      s.equity += x;
      tx(s, [["aportacion_por_recibir", x], ["capital", -x]]);
      schedule(s, s.day + 5, "in", "aportacion_por_recibir", x, "Aportación de capital del dueño", undefined, cmd.id);
      s.relations.owner = clamp(s.relations.owner - (s.overdue.length ? 0.25 : 0.12));
      event(s, "decision_financiera", `El dueño aporta $${fmt(x)}. Llega en cinco días; en la próxima sesión querrá ver cómo se evita repetirlo.`, cmd.id);
      return { ok: true };
    }
    case "supplier_terms": {
      if (oldest(s, "chatarra") > 0) return { ok: false, reason: "Con saldo vencido, los chatarreros no negocian plazo: primero hay que ponerse al corriente." };
      if (s.supply.scrapExtraDays) return { ok: false, reason: "Ya hay un convenio de plazo vigente." };
      for (const x of s.sched) if (x.acc === "chatarra" && x.dir === "out") x.day += cmd.extraDays;
      s.supply.scrapExtraDays = cmd.extraDays; s.supply.scrapExtraUntil = s.day + 90; s.supply.scrapPriceUp = 0.01 * (cmd.extraDays / 7);
      s.relations.suppliers = clamp(s.relations.suppliers - 0.06);
      event(s, "decision_financiera", `Los chatarreros aceptan ${cmd.extraDays} días más durante tres meses con un sobreprecio de ${(s.supply.scrapPriceUp * 100).toFixed(1)} %.`, cmd.id);
      return { ok: true };
    }
    case "sell_stock": {
      const px = prices(s);
      if (cmd.product === "chatarra") {
        const t = Math.min(cmd.tons, s.inv.scrapT);
        if (t <= 0) return { ok: false, reason: "No hay chatarra en patio." };
        const cost = takeAvg(s, "scrap", t);
        const rev = Math.round(t * c(px.scrap) * 0.9);
        tx(s, [["clientes", rev], ["otros_ingresos", -rev], ["otros_gastos", cost], ["inventario", -cost]]);
        schedule(s, s.day + 2, "in", "clientes", rev, "Venta de chatarra a otra acería", undefined, cmd.id);
      } else {
        const t = Math.min(cmd.tons, s.inv.billetT);
        if (t <= 0) return { ok: false, reason: "No hay palanquilla en inventario." };
        const cost = takeAvg(s, "billet", t);
        const rev = Math.round(t * c(11_400) * px.steel);
        tx(s, [["clientes", rev], ["ventas", -rev], ["costo_ventas", cost], ["inventario", -cost]]);
        schedule(s, s.day + 3, "in", "clientes", rev, "Venta de palanquilla al contado (precio de remate)", undefined, cmd.id);
      }
      event(s, "decision_financiera", `Se venden ${Math.round(cmd.tons)} t de ${cmd.product} de inventario para hacer caja.`, cmd.id);
      return { ok: true };
    }
    case "payment_plan": {
      const due = overdueTotal(s, "fisco");
      if (!due) return { ok: false, reason: "No hay adeudos fiscales vencidos." };
      const byAcc = new Map<string, number>();
      for (const o of s.overdue.filter((x) => x.creditor === "fisco")) byAcc.set(o.acc, (byAcc.get(o.acc) ?? 0) + o.amount);
      s.overdue = s.overdue.filter((o) => o.creditor !== "fisco");
      // Las parcialidades llevan recargo mensual; el adeudo deja de estar vencido y la opinión de cumplimiento se regulariza.
      for (const [acc, amt] of byAcc) {
        let left = amt;
        for (let i = 1; i <= cmd.months; i++) {
          const part = i === cmd.months ? left : Math.round(amt / cmd.months); left -= part;
          schedule(s, s.day + i * MONTH, "out", acc, part, `Parcialidad ${i} de ${cmd.months} del convenio fiscal`, "fisco", cmd.id);
        }
      }
      for (let i = 1; i <= cmd.months; i++) {
        const extra = Math.round(due * 0.0126 * (cmd.months - i + 1) / cmd.months);
        tx(s, [["recargos", extra], ["imss", -extra]]);
        schedule(s, s.day + i * MONTH, "out", "imss", extra, `Recargos de la parcialidad ${i} del convenio fiscal`, "fisco", cmd.id);
      }
      event(s, "decision_financiera", `Se firma convenio de pago en ${cmd.months} parcialidades con recargo de 1.26 % mensual.`, cmd.id);
      return { ok: true };
    }
    case "pause_capex":
      if (cmd.on) s.flags.capexPausedSince = s.day; else delete s.flags.capexPausedSince;
      event(s, "decision", cmd.on ? "Se pospone la inversión de mantenimiento. Después de dos meses, la disponibilidad de los equipos empieza a bajar." : "Se reanuda la inversión de mantenimiento.", cmd.id);
      return { ok: true };
    case "one_off": {
      const amt = c(cmd.amount);
      if (cmd.account === "otros_ingresos") { tx(s, [["clientes", amt], ["otros_ingresos", -amt]]); schedule(s, s.day + cmd.payInDays, "in", "clientes", amt, cmd.label, undefined, cmd.id); return { ok: true }; }
      if (cmd.capex) { capex(s, amt, cmd.payInDays, cmd.label, cmd.id); return { ok: true }; }
      tx(s, [["otros_gastos", amt], ["acreedores", -amt]]);
      schedule(s, s.day + cmd.payInDays, "out", "acreedores", amt, cmd.label, "acreedores", cmd.id);
      return { ok: true };
    }
    case "modify":
      s.mods.push({ key: cmd.key, add: cmd.add, mult: cmd.mult, until: s.day + cmd.days, ref: cmd.id });
      return { ok: true };
    case "maquila_capacity": s.plant.maquilaTpd = cmd.tpd; return { ok: true };
    case "safety": s.safety = clamp(s.safety + cmd.delta, 0.2, 0.98); return { ok: true };
    case "downtime": s.mods.push({ key: "availability", mult: 0, until: s.day + cmd.days, ref: cmd.id }); return { ok: true };
    case "flag": s.flags[cmd.key] = cmd.value; return { ok: true };
    case "relation": s.relations[cmd.key] = clamp(s.relations[cmd.key] + cmd.delta); return { ok: true };
  }
}

/** Horno nuevo: se agrega a la capacidad el día que llega (se revisa en `tick` de activos). */
function pendingFurnace(s: SteelState, cmd: Extract<SteelCommand, { type: "add_furnace" }>, day: number) {
  const list = (s.flags.furnaces as string | undefined) ? JSON.parse(String(s.flags.furnaces)) : [];
  list.push({ day, t: cmd.tPerShift ?? s.plant.tPerFurnaceShift, util: cmd.utilities, ref: cmd.id });
  s.flags.furnaces = JSON.stringify(list);
}

/** Activos que entran en operación (horno, laminador, patio). Se llama al inicio de cada día. */
export function activateAssets(s: SteelState) {
  if (s.flags.furnaces) {
    const list: { day: number; t: number; util: number; ref: string; done?: boolean }[] = JSON.parse(String(s.flags.furnaces));
    let changed = false;
    for (const f of list) if (!f.done && s.day >= f.day) {
      f.done = true; changed = true;
      s.plant.tPerFurnaceShift = (s.plant.tPerFurnaceShift * s.plant.furnaces + f.t) / (s.plant.furnaces + 1);
      s.plant.furnaces += 1;
      s.plant.casterTpd = Math.max(s.plant.casterTpd, s.plant.furnaces * s.plant.tPerFurnaceShift * s.plant.templateShifts * 1.05);
      s.siteUtilities += c(f.util);
      const add = Math.round(s.crews.horno.perShift / (s.plant.furnaces - 1));
      s.crews.horno.perShift += add;
      applyInner(s, { type: "hire", id: `${f.ref}:h`, crew: "horno", n: add * s.plant.shifts });
      event(s, "activo", "Ya opera el horno nuevo.", f.ref);
    }
    if (changed) s.flags.furnaces = JSON.stringify(list);
  }
  if (s.flags.millAt !== undefined && s.day >= Number(s.flags.millAt) && !s.plant.rollingActive) {
    s.plant.rollingActive = true; s.plant.rollingTpd = Number(s.flags.millTpd); s.plant.maquilaTpd = 0;
    const n = Number(s.flags.millCrew);
    s.crews.laminacion ??= { label: "Laminación y recalentamiento", n: 0, gross: c(15000), perShift: n / s.plant.shifts, ramp: [] };
    applyInner(s, { type: "hire", id: "laminador:crew", crew: "laminacion", n });
    s.siteUtilities += c(Number(s.flags.millUtil));
    event(s, "activo", "Arranca el laminador propio: la varilla ya no depende de la maquila.");
  }
  if (s.flags.yardShareAt !== undefined && s.day >= Number(s.flags.yardShareAt)) {
    // La chatarra de recolector es más barata pero trae más tierra, humedad y piezas sin clasificar: el rendimiento de
    // fusión baja cerca de un punto por cada 25 puntos de chatarra propia adicional, y la báscula y la cizalla tienen costo fijo.
    const extra = Math.max(0, Number(s.flags.yardShare) - s.plant.ownScrapShare);
    s.plant.ownScrapShare = Number(s.flags.yardShare); delete s.flags.yardShareAt;
    s.mods.push({ key: "yieldMelt", add: -0.05 * extra, until: Number.MAX_SAFE_INTEGER, ref: "patio" });
    s.fixed.push({ id: "patio", label: "Operación de la prensa-cizalla y báscula", amount: c(180_000) });
    event(s, "activo", "El patio ampliado ya procesa chatarra propia. Es más barata, pero trae más tierra: el rendimiento de fusión baja un poco.");
  }
}

// ───────────────────────────────────────────────────────── alternativas de gestión ante falta de caja
export interface LiquidityOption { id: string; label: string; cash: number; cost: string; inDays: number; cmd: SteelCommand; available: boolean; reason?: string }
/**
 * Alternativas concretas cuando la caja no alcanza. Todas se calculan con el motor (no las inventa la IA): cuánto dinero
 * liberan, en cuántos días y qué cuestan. Las que no están disponibles traen la razón.
 */
export function liquidityOptions(s: SteelState, tag = "liq"): LiquidityOption[] {
  const T = TEMPLATES_V2[s.templateId];
  const id = (k: string) => `${tag}:${k}:${s.day}`;
  const out: LiquidityOption[] = [];
  const fact = s.sched.filter((x) => x.dir === "in" && x.acc === "clientes" && x.day > s.day && x.day <= s.day + 45);
  const face = fact.reduce((a, x) => a + x.amount, 0);
  const fcost = Math.round(fact.reduce((a, x) => a + (x.amount * 0.22 * (x.day - s.day)) / 360, 0) + face * 0.01);
  out.push({ id: "factoraje", label: "Ceder facturas a una financiera (factoraje)", cash: face - fcost, cost: `descuento de $${fmt(fcost)}`, inDays: 3, cmd: { type: "factoring", id: id("factoraje"), days: 45 }, available: face > 0 && s.relations.bank >= 0.4, reason: !face ? "No hay facturas por cobrar a 45 días." : s.relations.bank < 0.4 ? "La financiera no opera con atrasos bancarios." : undefined });
  const fisco = overdueTotal(s, "fisco");
  out.push({ id: "convenio", label: "Convenio de pago en parcialidades con IMSS y SAT", cash: fisco, cost: "recargo de 1.26 % mensual", inDays: 0, cmd: { type: "payment_plan", id: id("convenio"), months: 6 }, available: fisco > 0, reason: fisco ? undefined : "No hay adeudos fiscales vencidos." });
  const scrapOut = s.sched.filter((x) => x.acc === "chatarra" && x.dir === "out").reduce((a, x) => a + x.amount, 0);
  out.push({ id: "plazo", label: "Negociar 7 días más de plazo con los chatarreros", cash: scrapOut, cost: "sobreprecio de 1 % en la chatarra por tres meses", inDays: 0, cmd: { type: "supplier_terms", id: id("plazo"), extraDays: 7 }, available: oldest(s, "chatarra") === 0 && !s.supply.scrapExtraDays && scrapOut > 0, reason: oldest(s, "chatarra") > 0 ? "Con saldo vencido no negocian plazo." : s.supply.scrapExtraDays ? "Ya hay un convenio vigente." : undefined });
  const room = Math.max(0, c(T.ownerCapacity) - s.equity);
  const ask = Math.min(room, Math.max(c(500_000), Math.round(room / 2)));
  out.push({ id: "aportacion", label: "Pedir una aportación de capital al dueño", cash: ask, cost: "baja la confianza del dueño; su capital exige rendimiento", inDays: 5, cmd: { type: "owner_equity", id: id("aportacion"), amount: Math.round(ask / 100) }, available: room > 0 && s.relations.owner >= 0.4, reason: room <= 0 ? "El dueño ya aportó lo que estaba dispuesto a poner." : s.relations.owner < 0.4 ? "La confianza del dueño está demasiado baja." : undefined });
  const loanAmt = T.kind === "integrada" ? 20_000_000 : 3_000_000;
  const q = bankQuote(s, loanAmt, T.bankRate, 18);
  out.push({ id: "credito", label: `Crédito de capital de trabajo por $${loanAmt.toLocaleString("en-US")} a 18 meses`, cash: c(loanAmt) - Math.round(c(loanAmt) * 0.015), cost: `pago de $${fmt(q.payment)} al mes`, inDays: 10, cmd: { type: "term_loan", id: id("credito"), amount: loanAmt, rate: T.bankRate, months: 18, purpose: "capital de trabajo" }, available: q.ok, reason: q.reason });
  const scrapSell = Math.max(0, s.inv.scrapT * 0.5);
  out.push({ id: "remate", label: "Vender la mitad de la chatarra del patio a otra acería", cash: Math.round(scrapSell * c(prices(s).scrap) * 0.9), cost: "se vende 10 % abajo y luego falta carga para los hornos", inDays: 2, cmd: { type: "sell_stock", id: id("remate"), product: "chatarra", tons: Math.floor(scrapSell) }, available: scrapSell > 1 });
  out.push({ id: "capex", label: "Posponer la inversión de mantenimiento", cash: s.sustainingCapex, cost: "después de dos meses baja la disponibilidad de los equipos", inDays: 30, cmd: { type: "pause_capex", id: id("capex"), on: true }, available: s.flags.capexPausedSince === undefined && s.sustainingCapex > 0, reason: s.flags.capexPausedSince !== undefined ? "Ya está pospuesta." : undefined });
  return out;
}

/** Capital invertido (activo fijo + capital de trabajo operativo) para medir valor económico. */
export function investedCapital(s: SteelState): number {
  const A = (a: string) => bal(s, a);
  const opLiab = -(A("chatarra") + A("acreedores") + A("cfe") + A("imss") + A("aguinaldo_pp") + A("activo_por_pagar") + A("acreedores_nomina"));
  return A("activo_fijo") + A("clientes") + A("inventario") + Math.max(0, A("caja")) - opLiab;
}
