/**
 * mêtis CEO · Growth Engine · motor determinista (fase 1, aislado: no se usa todavía en la app).
 *
 * Reglas de causalidad (adenda §12):
 *  1. Contratar abre una vacante: no mueve caja ni gasto. El costo de entrada se registra cuando la persona se incorpora.
 *  2. La nómina se devenga al cierre del mes por los días trabajados y se paga ese día; cuotas patronales e impuesto
 *     sobre nómina se pagan el día 17 del mes siguiente; aguinaldo y prima se provisionan y se pagan en diciembre o en
 *     el finiquito. Cada concepto se registra UNA vez como gasto y UNA vez como pago.
 *  3. Una inversión mueve la caja cuando se paga; el resultado solo reconoce su depreciación mensual.
 *  4. La capacidad no es venta: lo vendido es el mínimo entre demanda y el cuello de botella de cada día.
 *  5. Una venta a crédito es ingreso del mes y caja hasta el cobro (DSO de la familia).
 *  6. Las decisiones se aplican una vez (`applied`); el avance por días es puro y determinista (semilla).
 * Dinero en centavos enteros. El libro tiene dos tipos de asiento: devengo (resultado) y caja (efectivo).
 */
import { roleById } from "./catalog";
import { FAMILIES, TABLE_TURNS, TEMPLATES, WEEKDAY, WORKDAY } from "./families";
import { LABOR_VERSION, laborOf, minWage, monthlyCost, pesos, regionalSalary, regionOf, terminationOf, vacationDays, type TerminationKind } from "./labor";
import type { Command, Entry, EntryType, GrowthState, MonthSummary, Person, Site } from "./types";

export const GROWTH_MODEL_VERSION = 2;
export const CATALOG_VERSION = 1;
const MONTH = 30;

// ─────────────────────────────────────────────── utilidades
function hash01(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h / 0x100000000;
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const monthOf = (day: number) => Math.floor(day / MONTH);
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const fam = (s: GrowthState) => FAMILIES[s.family];

function post(s: GrowthState, type: EntryType, account: string, amount: number, text: string, ref?: string, day = s.day) {
  if (!amount) return;
  const month = monthOf(day);
  const hit = s.ledger.find((e) => e.type === type && e.account === account && e.month === month && e.ref === ref);
  if (hit) { hit.amount += amount; return; }
  s.ledger.push({ id: `e${s.nextId++}`, type, account, month, amount, ref, text });
}
const cashMove = (s: GrowthState, account: string, amount: number, text: string, ref?: string) => { s.cash += amount; post(s, "caja", account, amount, text, ref); };
function schedule(s: GrowthState, day: number, account: string, amount: number, text: string, ref?: string) {
  if (!amount) return;
  const hit = s.scheduled.find((x) => x.day === day && x.account === account && x.ref === ref);
  if (hit) { hit.amount += amount; return; }
  s.scheduled.push({ id: `s${s.nextId++}`, day, account, amount, ref, text });
}

const active = (p: Person, day: number) => p.startDay <= day && (p.leftDay === undefined || p.leftDay > day);
export const activePeople = (s: GrowthState, day = s.day) => s.people.filter((p) => active(p, day));
export const headcount = (s: GrowthState, day = s.day) => activePeople(s, day).length;
function productivity(p: Person, day: number): number {
  const r = roleById(p.roleId)!;
  if (!active(p, day)) return 0;
  return Math.min(1, r.rampStart + ((1 - r.rampStart) * (day - p.startDay)) / r.rampDays);
}

// ─────────────────────────────────────────────── arranque
export function createCompany(templateId: keyof typeof TEMPLATES | string, seed = "metis"): GrowthState {
  const T = TEMPLATES[templateId];
  if (!T) throw new Error(`Plantilla desconocida: ${templateId}`);
  const L = laborOf();
  const s: GrowthState = {
    modelVersion: GROWTH_MODEL_VERSION, laborVersion: LABOR_VERSION, catalogVersion: CATALOG_VERSION,
    family: T.family, templateId: T.id, region: T.region, seed, day: 0,
    cash: pesos(T.cash), fixedLines: T.fixedLines.map((x) => ({ ...x, amount: pesos(x.amount) })),
    people: [], vacancies: [], assets: [], contracts: [], scheduled: [], ledger: [], events: [], months: [], applied: [],
    sites: T.sites.map((x) => ({ id: x.id, name: x.name, status: "operando", assets: { ...x.assets }, shifts: x.shifts, rent: pesos(x.rent), utilities: pesos(x.utilities), demandBase: x.demandBase, demandFactor: 1, maturityDays: 0, reputation: 1, backlog: 0, openedDay: -3650 })),
    cur: { demand: 0, served: 0, lost: 0, capacity: 0, scrap: 0, bottlenecks: {}, cashBegin: pesos(T.cash) },
    attrition: true, nextId: 1,
  };
  const region = regionOf(T.region);
  for (const st of T.staff) {
    const r = roleById(st.roleId)!;
    const salary = regionalSalary(st.salary ?? r.salary.mid, region);
    const start = -Math.round((st.yearsBefore ?? 0.5) * 365);
    // Provisión de aguinaldo acumulada desde enero hasta el mes de llegada.
    const prov = monthlyCost(salary, region, L, 1, (st.yearsBefore ?? 0.5)).provision * (T.startMonth - 1);
    s.people.push({ id: `p${s.nextId++}`, roleId: st.roleId, name: st.name, siteId: st.siteId, salary, hiredDay: start, startDay: start, founding: true, provision: prov, daysThisMonth: 0 });
  }
  for (const c of T.contracts ?? []) s.contracts.push({ id: c.id, client: c.client, unitsPerDay: c.unitsPerDay, price: pesos(c.price), startDay: -3650 });
  // Lo que ya venía en curso: cuotas del mes anterior, cobros y pagos a proveedores pendientes.
  const run = operateDay(s, 0, true);
  const prevPayroll = activePeople(s, 0).reduce((a, p) => { const c = monthlyCost(p.salary, region, L, 1, yearsOf(p, 0)); return a + c.employer + c.payrollTax; }, 0);
  schedule(s, 16, "cuotas", -prevPayroll, "Cuotas y nómina estatal del mes anterior a tu llegada");
  const F = fam(s);
  for (let d = -Math.max(F.dso, F.supplierDays); d < 0; d++) {
    const w = dayFactor(s, d);
    if (d + F.dso >= 0 && F.dso > 0) schedule(s, d + F.dso, "cobro", Math.round(run.revenue * w), "Cobro de ventas anteriores a tu llegada");
    if (d + F.supplierDays >= 0) schedule(s, d + F.supplierDays, "proveedores", -Math.round(run.cogs * w), "Pago a proveedores de compras anteriores");
  }
  s.events.push({ day: 0, kind: "apertura", text: T.summary });
  return s;
}

/** Años de servicio cumplidos (fracción) de una persona en un día. */
export const yearsOf = (p: Person, day: number) => Math.max(0, (day - p.startDay) / 365);

/** Gasto variable de un día según las líneas explícitas de la familia. */
function variableOf(s: GrowthState, revenue: number, units: number): number {
  return fam(s).variableLines.reduce((a, l) => a + Math.round(revenue * (l.pctOfSales ?? 0) + units * pesos(l.perUnit ?? 0)), 0);
}

function dayFactor(s: GrowthState, day: number): number {
  const wd = ((day % 7) + 7) % 7;
  return s.family === "restaurante" ? WEEKDAY[wd] : WORKDAY[wd] ? 1 : 0;
}

// ─────────────────────────────────────────────── operación de un día
interface DayRun { revenue: number; cogs: number; variable: number; demand: number; served: number; lost: number; capacity: number; scrap: number; bottleneck: string | null }

function siteCapacity(s: GrowthState, site: Site, day: number): { cap: Record<string, number>; produce: number; bottleneck: string; scrapRate: number } {
  const F = fam(s);
  const staff = s.people.filter((p) => p.siteId === site.id && active(p, day));
  const cap: Record<string, number> = {};
  let rampScrap = 0, ops = 0;
  for (const p of staff) {
    const r = roleById(p.roleId)!;
    const k = productivity(p, day);
    for (const [res, u] of Object.entries(r.provides ?? {})) cap[res] = (cap[res] ?? 0) + u * k;
    if (r.rampScrap && r.provides?.operacion) { rampScrap += r.rampScrap * (1 - k) * r.provides.operacion; ops += r.provides.operacion * k; }
  }
  const hasLead = staff.some((p) => p.roleId === F.leadRole);
  let coord = hasLead ? 1 : 0.85;
  if (s.family === "restaurante") {
    cap.mesas = (site.assets.mesas ?? 0) * TABLE_TURNS;
    if (!cap.loza) cap.loza = 50; // sin lavaloza, la cocina lava: alcanza para poco
    const lead = roleById(F.leadRole)!;
    if (staff.length - 1 > (lead.span ?? 12)) coord *= 0.92;
  } else {
    const sup = staff.filter((p) => p.roleId === F.shiftRole).length;
    const shifts = Math.min(site.shifts, sup);
    cap.prensa = (site.assets.prensa ?? 0) * (F.perShift!.prensa) * shifts;
    // Operadores reparten su jornada entre turnos; sin supervisor ningún turno arranca.
    if (shifts === 0) cap.operacion = 0;
    if (!staff.some((p) => p.roleId === "tecnico_mantenimiento")) coord *= 0.88;
  }
  for (const r of F.resources) cap[r] = Math.floor((cap[r] ?? 0) * coord);
  let bottleneck = F.resources[0], produce = Infinity;
  for (const r of F.resources) if (cap[r] < produce) { produce = cap[r]; bottleneck = r; }
  const quality = staff.some((p) => p.roleId === "inspector_calidad") ? 0 : 0.02;
  const scrapRate = (F.scrap ?? 0) + quality + (ops > 0 ? rampScrap / Math.max(1, ops) : 0);
  return { cap, produce: Math.max(0, produce), bottleneck, scrapRate };
}

function operateDay(s: GrowthState, day: number, dry = false): DayRun {
  const F = fam(s);
  const out: DayRun = { revenue: 0, cogs: 0, variable: 0, demand: 0, served: 0, lost: 0, capacity: 0, scrap: 0, bottleneck: null };
  const w = dry ? 1 : dayFactor(s, day);
  if (w === 0) return out;
  let worst = 0;
  for (const site of s.sites) {
    if (site.status !== "operando") continue;
    const { produce, bottleneck, scrapRate } = siteCapacity(s, site, day);
    if (s.family === "restaurante") {
      const maturity = site.maturityDays > 0 ? 0.45 + 0.55 * clamp((day - (site.openedDay ?? day)) / site.maturityDays, 0, 1) : 1;
      const demand = site.demandBase * site.demandFactor * maturity * site.reputation * w;
      const served = Math.min(demand, produce);
      const lost = demand - served;
      if (!dry) site.reputation = clamp(site.reputation + (demand > 0 && lost / demand > 0.08 ? -0.0006 : 0.0003), 0.85, 1.03);
      out.demand += demand; out.served += served; out.lost += lost; out.capacity += produce;
      const rev = Math.round((served * pesos(F.price)) / (1 + (F.vatInPrice ?? 0)));
      out.revenue += rev; out.cogs += Math.round(rev * F.cogsPct!); out.variable += variableOf(s, rev, served);
      if (lost > worst) { worst = lost; out.bottleneck = `${site.name}: ${bottleneck}`; }
    } else {
      const contracts = s.contracts.filter((c) => c.startDay <= day);
      const daily = contracts.reduce((a, c) => a + c.unitsPerDay, 0);
      const price = daily ? contracts.reduce((a, c) => a + c.unitsPerDay * c.price, 0) / daily : 0;
      const need = daily + site.backlog;
      const good = Math.min(need, produce * (1 - scrapRate));
      const produced = scrapRate < 1 ? good / (1 - scrapRate) : 0;
      const short = need - good;
      if (!dry) site.backlog = Math.min(short, daily * F.backlogDays);
      const lost = dry ? 0 : short - site.backlog;
      out.demand += daily; out.served += good; out.lost += lost; out.capacity += produce; out.scrap += produced - good;
      const rev = Math.round(good * price);
      out.revenue += rev; out.cogs += Math.round(produced * pesos(F.materialPerUnit!)); out.variable += variableOf(s, rev, good);
      if (short > worst) { worst = short; out.bottleneck = `${site.name}: ${bottleneck}`; }
    }
  }
  return out;
}

// ─────────────────────────────────────────────── decisiones
export interface ApplyResult { ok: boolean; reason?: string }

export function apply(s: GrowthState, cmd: Command): ApplyResult {
  if (s.applied.includes(cmd.id)) return { ok: true, reason: "ya aplicada" };
  const L = laborOf(s.laborVersion);
  switch (cmd.type) {
    case "hire": {
      const r = roleById(cmd.roleId);
      if (!r || r.family !== s.family) return { ok: false, reason: "Ese puesto no existe en esta industria." };
      if (r.minHeadcount && headcount(s) < r.minHeadcount) return { ok: false, reason: `Con ${headcount(s)} personas todavía no hace falta un ${r.title.toLowerCase()}.` };
      if (!r.companyLevel && cmd.siteId && !s.sites.some((x) => x.id === cmd.siteId && x.status !== "cerrada")) return { ok: false, reason: "Esa ubicación no existe." };
      const salary = cmd.salary !== undefined ? pesos(cmd.salary) : regionalSalary(r.salary.mid, regionOf(s.region));
      if (salary < pesos(minWage(L, regionOf(s.region)) * 30)) return { ok: false, reason: "El salario queda debajo del mínimo legal." };
      s.vacancies.push({ id: `v${s.nextId++}`, roleId: r.id, siteId: r.companyLevel ? null : cmd.siteId, openedDay: s.day, fillDay: s.day + r.fillDays, salary, ref: cmd.id });
      s.events.push({ day: s.day, kind: "vacante", text: `Se abre la vacante de ${r.title.toLowerCase()}. Cubrirla toma unas ${Math.round(r.fillDays / 7)} semanas.`, ref: cmd.id });
      break;
    }
    case "terminate": {
      const p = s.people.find((x) => x.id === cmd.personId && active(x, s.day));
      if (!p) return { ok: false, reason: "Esa persona no está en la plantilla." };
      leave(s, p, cmd.kind ?? "despido_injustificado", cmd.id, cmd.refusesReinstatement);
      break;
    }
    case "open_site": {
      const id = `site${s.nextId++}`;
      s.sites.push({ id, name: cmd.name, status: "en_obra", assets: {}, shifts: 1, rent: pesos(cmd.rent), utilities: pesos(cmd.utilities), demandBase: cmd.demandBase, demandFactor: cmd.demandFactor ?? 0.75 + 0.4 * hash01(`${s.seed}|${cmd.id}|demanda`), maturityDays: cmd.maturityDays, reputation: 1, backlog: 0, buildDoneDay: s.day + cmd.buildDays, ref: cmd.id });
      cashMove(s, "deposito", -pesos(cmd.deposit), `Depósito en garantía de ${cmd.name}`, cmd.id);
      cashMove(s, "inversion", -pesos(cmd.capex), `Acondicionamiento y equipo de ${cmd.name}`, cmd.id);
      for (const [res, units] of Object.entries(cmd.assets)) s.assets.push({ id: `a${s.nextId++}`, siteId: id, label: `Equipo de ${cmd.name}`, resource: res, units, cost: Math.round(pesos(cmd.capex) / Object.keys(cmd.assets).length), years: cmd.years, activeDay: s.day + cmd.buildDays, active: false, ref: cmd.id });
      schedule(s, s.day + cmd.buildDays, "preapertura", -pesos(cmd.preopening), `Preapertura de ${cmd.name}: capacitación, insumos iniciales y lanzamiento`, cmd.id);
      s.events.push({ day: s.day, kind: "obra", text: `Se firma el local de ${cmd.name}. La obra tarda unas ${Math.round(cmd.buildDays / 7)} semanas; la renta corre desde hoy.`, siteId: id, ref: cmd.id });
      break;
    }
    case "add_asset": {
      const site = s.sites.find((x) => x.id === cmd.siteId);
      if (!site) return { ok: false, reason: "Esa ubicación no existe." };
      cashMove(s, "inversion", -pesos(cmd.cost), `Compra: ${cmd.label}`, cmd.id);
      s.assets.push({ id: `a${s.nextId++}`, siteId: site.id, label: cmd.label, resource: cmd.resource, units: cmd.units, cost: pesos(cmd.cost), years: cmd.years, activeDay: s.day + cmd.leadDays, active: false, ref: cmd.id });
      break;
    }
    case "set_shifts": {
      const site = s.sites.find((x) => x.id === cmd.siteId);
      if (!site) return { ok: false, reason: "Esa ubicación no existe." };
      site.shifts = clamp(Math.round(cmd.shifts), 1, 3);
      s.events.push({ day: s.day, kind: "turno", text: `${site.name} pasa a ${site.shifts} turno${site.shifts > 1 ? "s" : ""}. Cada turno necesita su supervisor.`, siteId: site.id, ref: cmd.id });
      break;
    }
    case "add_contract": {
      s.contracts.push({ id: cmd.id, client: cmd.client, unitsPerDay: cmd.unitsPerDay, price: pesos(cmd.price), startDay: s.day + cmd.startInDays, ref: cmd.id });
      s.events.push({ day: s.day, kind: "contrato", text: `Se firma con ${cmd.client}: ${cmd.unitsPerDay.toLocaleString("en-US")} ${fam(s).unit.many} al día desde dentro de ${cmd.startInDays} días.`, ref: cmd.id });
      break;
    }
  }
  s.applied.push(cmd.id);
  return { ok: true };
}

function leave(s: GrowthState, p: Person, kind: TerminationKind, ref?: string, refusesReinstatement = false) {
  const L = laborOf(s.laborVersion);
  const r = roleById(p.roleId)!;
  const years = yearsOf(p, s.day);
  p.leftDay = s.day; p.leftReason = kind;
  // Vacaciones generadas en el año de servicio en curso y no gozadas (el motor no programa vacaciones: se cubren con eventuales).
  const vacPending = Math.round(vacationDays(Math.floor(years), L) * (years - Math.floor(years)) * 10) / 10;
  const t = terminationOf(kind, p.salary, years, p.provision, vacPending, L, regionOf(s.region), refusesReinstatement);
  // Lo trabajado del mes se devenga y se paga en el cierre (ya cuenta en daysThisMonth). Aquí: finiquito y, si procede, indemnización.
  if (t.provisionPaid) cashMove(s, "finiquito", -t.provisionPaid, `Finiquito de ${p.name} (aguinaldo y prima proporcionales)`, ref ?? p.id);
  p.provision = 0;
  if (t.newExpense) {
    post(s, "devengo", "indemnizacion", -t.newExpense, `Terminación de ${p.name}: vacaciones, prima de antigüedad e indemnización que procedan`, ref ?? p.id);
    cashMove(s, "indemnizacion", -t.newExpense, `Terminación de ${p.name}`, ref ?? p.id);
  }
  const quit = kind === "renuncia";
  s.events.push({ day: s.day, kind: quit ? "renuncia" : "baja", text: quit ? `${p.name} (${r.title.toLowerCase()}) renuncia.` : `Termina la relación laboral con ${p.name} (${r.title.toLowerCase()}): ${t.total ? `se pagan $${Math.round(t.total / 100).toLocaleString("en-US")}` : "sin pagos adicionales"}.`, personId: p.id, siteId: p.siteId ?? undefined, ref });
  // Rotación rutinaria: el responsable repone los puestos operativos (con su costo y su tiempo).
  if (quit && r.level === "operativo") s.vacancies.push({ id: `v${s.nextId++}`, roleId: r.id, siteId: p.siteId, openedDay: s.day, fillDay: s.day + r.fillDays, salary: p.salary, ref: `reposicion:${p.id}` });
  return t;
}

// ─────────────────────────────────────────────── avance del tiempo
const NAMES = ["Alejandra", "Bruno", "Carmen", "Daniel", "Elena", "Fernando", "Gabriela", "Héctor", "Irene", "Jorge", "Karen", "Lorenzo", "Mónica", "Néstor", "Olga", "Pablo", "Rebeca", "Samuel", "Tania", "Ulises", "Valeria", "Xavier", "Yolanda", "Zacarías"];
const SURN = ["Garza", "Treviño", "Cantú", "Villarreal", "Salinas", "Elizondo", "Rodríguez", "Martínez", "Leal", "Benavides", "Saldaña", "Cavazos"];

function step(s: GrowthState) {
  const d = s.day;
  const L = laborOf(s.laborVersion);
  // 1. Pagos y cobros programados para hoy.
  for (const x of s.scheduled.filter((y) => y.day === d)) {
    if (x.account === "preapertura") post(s, "devengo", "preapertura", x.amount, x.text, x.ref);
    cashMove(s, x.account, x.amount, x.text, x.ref);
  }
  s.scheduled = s.scheduled.filter((y) => y.day !== d);
  // 2. Vacantes que se cubren hoy.
  for (const v of s.vacancies.filter((y) => y.fillDay === d)) {
    const r = roleById(v.roleId)!;
    const name = `${NAMES[Math.floor(hash01(`${s.seed}|${v.id}|n`) * NAMES.length)]} ${SURN[Math.floor(hash01(`${s.seed}|${v.id}|a`) * SURN.length)]}`;
    const p: Person = { id: `p${s.nextId++}`, roleId: r.id, name, siteId: v.siteId, salary: v.salary, hiredDay: v.openedDay, startDay: d, ref: v.ref, provision: 0, daysThisMonth: 0 };
    s.people.push(p);
    post(s, "devengo", "contratacion", -pesos(r.hireCost), `Reclutamiento, alta y capacitación de ${name}`, v.ref);
    cashMove(s, "contratacion", -pesos(r.hireCost), `Reclutamiento, alta y capacitación de ${name}`, v.ref);
    if (!v.ref.startsWith("reposicion:")) s.events.push({ day: d, kind: "incorporacion", text: `${name} se incorpora como ${r.title.toLowerCase()}. Llega al ${Math.round(r.rampStart * 100)} % de su ritmo y tarda unas ${Math.round(r.rampDays / 7)} semanas en dar el 100 %.`, personId: p.id, siteId: v.siteId ?? undefined, ref: v.ref });
  }
  s.vacancies = s.vacancies.filter((y) => y.fillDay !== d);
  // 3. Obras, activos y aperturas.
  for (const a of s.assets) if (!a.active && a.activeDay <= d) {
    a.active = true;
    const site = s.sites.find((x) => x.id === a.siteId)!;
    site.assets[a.resource] = (site.assets[a.resource] ?? 0) + a.units;
    s.events.push({ day: d, kind: "activo", text: `Ya opera: ${a.label}.`, siteId: site.id, ref: a.ref });
  }
  for (const site of s.sites) {
    if (site.status === "en_obra" && site.buildDoneDay !== undefined && d >= site.buildDoneDay) { site.status = "preapertura"; s.events.push({ day: d, kind: "obra_terminada", text: `Termina la obra de ${site.name}.`, siteId: site.id, ref: site.ref }); }
    if (site.status === "preapertura") {
      const { cap } = siteCapacity(s, site, d);
      const F = fam(s);
      const lead = s.people.some((p) => p.siteId === site.id && p.roleId === F.leadRole && active(p, d));
      const ready = lead && F.resources.every((r) => cap[r] > 0);
      if (ready) { site.status = "operando"; site.openedDay = d; s.events.push({ day: d, kind: "apertura", text: `Abre ${site.name}. La demanda tarda meses en madurar.`, siteId: site.id, ref: site.ref }); }
      else if (!s.events.some((e) => e.kind === "sin_personal" && e.siteId === site.id)) s.events.push({ day: d, kind: "sin_personal", text: `${site.name} está lista pero no puede abrir: falta personal mínimo (${lead ? "cocina o servicio" : "un responsable"}).`, siteId: site.id, ref: site.ref });
    }
  }
  // 4. Rotación (determinista por persona y día).
  if (s.attrition) for (const p of activePeople(s, d)) {
    if (p.founding && p.roleId === fam(s).leadRole) continue;
    const r = roleById(p.roleId)!;
    if (hash01(`${s.seed}|${p.id}|${d}|rot`) < r.attrition / 365) leave(s, p, "renuncia");
  }
  // 5. Operación del día.
  const run = operateDay(s, d);
  const c = s.cur;
  c.demand += run.demand; c.served += run.served; c.lost += run.lost; c.capacity += run.capacity; c.scrap += run.scrap;
  if (run.bottleneck && run.lost > 0) c.bottlenecks[run.bottleneck] = (c.bottlenecks[run.bottleneck] ?? 0) + run.lost;
  post(s, "devengo", "ventas", run.revenue, "Ventas");
  post(s, "devengo", "costo_ventas", -run.cogs, "Costo de ventas");
  post(s, "devengo", "variables", -run.variable, "Gastos variables");
  const F = fam(s);
  if (F.dso === 0) cashMove(s, "cobro", run.revenue, "Ventas cobradas"); else schedule(s, d + F.dso, "cobro", run.revenue, "Cobro a clientes");
  schedule(s, d + F.supplierDays, "proveedores", -run.cogs, "Pago a proveedores");
  cashMove(s, "variables", -run.variable, "Gastos variables");
  for (const p of activePeople(s, d)) p.daysThisMonth++;
  // 6. Cierre de mes.
  if ((d + 1) % MONTH === 0) closeMonth(s, L);
  s.day++;
}

function closeMonth(s: GrowthState, L: ReturnType<typeof laborOf>) {
  const d = s.day, m = monthOf(d);
  const F = fam(s);
  let employer = 0, isn = 0, coverage = 0;
  for (const p of s.people) {
    if (!p.daysThisMonth) continue;
    const c = monthlyCost(p.salary, regionOf(s.region), L, p.daysThisMonth / MONTH, yearsOf(p, d));
    if (F.restCoverage && roleById(p.roleId)!.level === "operativo") coverage += Math.round(c.gross * F.restCoverage);
    post(s, "devengo", "nomina", -c.gross, "Sueldos"); cashMove(s, "nomina", -c.gross, "Pago de sueldos");
    post(s, "devengo", "cuotas", -c.employer, "Cuotas patronales IMSS, INFONAVIT y retiro"); employer += c.employer;
    post(s, "devengo", "isn", -c.payrollTax, "Impuesto sobre nómina"); isn += c.payrollTax;
    post(s, "devengo", "provision", -c.provision, "Provisión de aguinaldo y prima vacacional");
    if (p.leftDay !== undefined) cashMove(s, "finiquito", -c.provision, `Finiquito de ${p.name}: parte del mes`, p.id); else p.provision += c.provision;
    p.daysThisMonth = 0;
  }
  if (coverage) { post(s, "devengo", "cobertura", -coverage, "Cobertura de descansos y vacaciones (eventuales)"); cashMove(s, "cobertura", -coverage, "Pago a eventuales por descansos y vacaciones"); }
  schedule(s, (m + 1) * MONTH + 16, "cuotas", -employer, "Pago de cuotas patronales del mes anterior");
  schedule(s, (m + 1) * MONTH + 16, "isn", -isn, "Pago del impuesto sobre nómina del mes anterior");
  for (const site of s.sites) {
    if (site.status === "cerrada") continue;
    post(s, "devengo", "renta", -site.rent, `Renta de ${site.name}`, site.id); cashMove(s, "renta", -site.rent, `Renta de ${site.name}`, site.id);
    if (site.status === "operando") { post(s, "devengo", "servicios", -site.utilities, `Servicios de ${site.name}`, site.id); cashMove(s, "servicios", -site.utilities, `Servicios de ${site.name}`, site.id); }
  }
  for (const f of s.fixedLines) { post(s, "devengo", "fijos", -f.amount, f.label, f.id); cashMove(s, "fijos", -f.amount, f.label, f.id); }
  for (const a of s.assets) if (a.active) post(s, "devengo", "depreciacion", -Math.round(a.cost / (a.years * 12)), "Depreciación de equipo", a.ref);
  // Aguinaldo y prima: se pagan en diciembre.
  const cal = ((TEMPLATES[s.templateId].startMonth - 1 + m) % 12) + 1;
  if (cal === 12) {
    const due = s.people.filter((p) => active(p, d)).reduce((a, p) => a + p.provision, 0);
    cashMove(s, "aguinaldo", -due, "Pago de aguinaldo y prima vacacional");
    for (const p of s.people) if (active(p, d)) p.provision = 0;
    s.events.push({ day: d, kind: "aguinaldo", text: "Se paga el aguinaldo: la caja lo resiente aunque el gasto ya estaba en los meses anteriores." });
  }
  s.months.push(summarize(s, m));
  s.cur = { demand: 0, served: 0, lost: 0, capacity: 0, scrap: 0, bottlenecks: {}, cashBegin: s.cash };
}

function summarize(s: GrowthState, m: number): MonthSummary {
  const acc = (type: EntryType, account: string) => s.ledger.filter((e) => e.type === type && e.month === m && e.account === account).reduce((a, e) => a + e.amount, 0);
  const cashE = s.ledger.filter((e) => e.type === "caja" && e.month === m);
  const inflows = cashE.filter((e) => e.amount > 0).reduce((a, e) => a + e.amount, 0);
  const outflows = -cashE.filter((e) => e.amount < 0).reduce((a, e) => a + e.amount, 0);
  const g = (k: string) => -acc("devengo", k);
  const revenue = acc("devengo", "ventas");
  const ebitda = revenue - ["costo_ventas", "variables", "nomina", "cobertura", "cuotas", "isn", "provision", "renta", "servicios", "fijos", "contratacion", "indemnizacion", "preapertura"].reduce((a, k) => a + g(k), 0);
  const top = Object.entries(s.cur.bottlenecks).sort((a, b) => b[1] - a[1])[0];
  return {
    month: m + 1, revenue, cogs: g("costo_ventas"), variable: g("variables"), payroll: g("nomina"), employer: g("cuotas"), payrollTax: g("isn"), provision: g("provision"),
    coverage: g("cobertura"), rent: g("renta"), utilities: g("servicios"), fixed: g("fijos"), hiring: g("contratacion"), severance: g("indemnizacion"), preopening: g("preapertura"), depreciation: g("depreciacion"),
    ebitda, operating: ebitda - g("depreciacion"),
    cashBegin: s.cur.cashBegin, inflows, outflows, cashEnd: s.cash,
    receivables: s.scheduled.filter((x) => x.account === "cobro").reduce((a, x) => a + x.amount, 0),
    payables: -s.scheduled.filter((x) => x.amount < 0).reduce((a, x) => a + x.amount, 0),
    demand: Math.round(s.cur.demand), served: Math.round(s.cur.served), lost: Math.round(s.cur.lost), capacity: Math.round(s.cur.capacity), scrap: Math.round(s.cur.scrap),
    headcount: headcount(s), sites: s.sites.filter((x) => x.status === "operando").length,
    bottleneck: top ? top[0] : null,
  };
}

/** Avanza `days` días simulados. Puro sobre una copia: no modifica el estado recibido. */
export function advance(s0: GrowthState, days: number): GrowthState {
  const s = clone(s0);
  for (let i = 0; i < days; i++) step(s);
  return s;
}

// ─────────────────────────────────────────────── consultas
export function capacityNow(s: GrowthState) {
  return s.sites.filter((x) => x.status === "operando").map((site) => {
    const c = siteCapacity(s, site, s.day);
    return { site: site.name, cap: c.cap, bottleneck: c.bottleneck, perDay: Math.round(c.produce) };
  });
}

/** Persona con ese rol más reciente en un sitio (útil para pruebas y para narrativas). */
export const peopleByRole = (s: GrowthState, roleId: string) => activePeople(s).filter((p) => p.roleId === roleId);

export type { Entry };
