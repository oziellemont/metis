/**
 * mêtis CEO · Growth Engine · puente a los 5 indicadores (fase 2).
 *
 * Una sola fuente económica: el dinero sale del motor (libro mayor, meses cerrados). Este puente solo traduce
 * esos números a puntos de 0 a 100 con las MISMAS reglas de la economía v10 (rules.ts):
 *  - 1 punto de Caja   = `cashPct` (5 %) de lo que la empresa paga en un mes.
 *  - 1 punto de Margen = `marginPct` (0.5 pts) de margen sobre la venta.
 * La base es la propia empresa del motor sin decisiones (misma plantilla, semilla fija), no el perfil de P0-C.
 * Equipo, Clientes y Consejo salen de hechos del motor (renuncias, faltas de personal, pedidos perdidos,
 * incumplimientos, adeudos, relación con el dueño y el banco) más el efecto editorial pequeño de cada caso.
 * Cada punto trae su causa en texto, con cifras del motor; la IA nunca pone números aquí.
 */
import { advance, createCompany } from "./engine";
import { overdueTotal, debtTotal, MONTH } from "./core";
import { fmt } from "./finance";
import type { GrowthState, MonthSummary } from "./types";
import type { KpiKey, Kpis } from "../types";

/** Constantes de la economía v10 (mismo valor que rules.ts V10.economy; se prueban iguales). */
export const BRIDGE = Object.freeze({
  cashPct: 0.05,
  marginPct: 0.005,
  /** Lo vencido pesa más que la caja: es dinero que ya no es tuyo y deja huella con el acreedor. */
  overdueWeight: 1.5,
  /** Tope de movimiento por indicador (puntos) para que un solo mes no borre el tablero. */
  cap: 30,
  /** Meses que promedia el margen (uno solo es muy ruidoso en restaurante). */
  marginMonths: 3,
});

export interface Baseline {
  templateId: string;
  cash: number;
  /** Salidas de caja de un mes típico (centavos). */
  outflows: number;
  ebitdaPct: number;
  /** EBITDA mensual promedio (centavos). */
  ebitda: number;
  lostPct: number;
  /** Renuncias por persona por día (rotación normal de la industria en el motor). */
  quitRate: number;
  headcount: number;
}

const BASE = new Map<string, Baseline>();
/** Base de la plantilla: la misma empresa sin decisiones, 12 meses (memorizada). */
export function baselineOf(templateId: string): Baseline {
  const hit = BASE.get(templateId);
  if (hit) return hit;
  const g0 = createCompany(templateId, "base");
  const g = advance(g0, 12 * MONTH);
  const ms = g.months;
  const sum = (f: (m: MonthSummary) => number) => ms.reduce((a, m) => a + f(m), 0);
  const quits = g.events.filter((e) => e.kind === "renuncia").length;
  const hc = g0.people.length;
  const out: Baseline = {
    templateId,
    cash: g0.cash,
    outflows: Math.round(sum((m) => m.outflows) / ms.length),
    ebitdaPct: sum((m) => m.ebitda) / Math.max(1, sum((m) => m.revenue)),
    ebitda: Math.round(sum((m) => m.ebitda) / ms.length),
    lostPct: sum((m) => m.lost) / Math.max(1, sum((m) => m.demand)),
    quitRate: quits / Math.max(1, hc) / (12 * MONTH),
    headcount: hc,
  };
  BASE.set(templateId, out);
  return out;
}

export interface Cause { kpi: KpiKey; points: number; text: string }
export interface Bridge { delta: Kpis; causes: Cause[]; baseline: Baseline }

const r1 = (x: number) => Math.round(x * 10) / 10;
const capped = (x: number) => Math.max(-BRIDGE.cap, Math.min(BRIDGE.cap, x));

/**
 * Puntos de cada indicador respecto al arranque (`kpiStart` del paquete). Es un NIVEL, no un flujo: describe cómo
 * está la empresa hoy; por eso se suma igual en cada periodo.
 * `editorial` = suma de los efectos editoriales de los casos decididos (solo Equipo, Clientes, Consejo).
 */
export function kpiBridge(g: GrowthState, editorial: Partial<Record<KpiKey, number>> = {}): Bridge {
  const B = baselineOf(g.templateId);
  const causes: Cause[] = [];
  const add = (kpi: KpiKey, points: number, text: string) => { const p = r1(points); if (Math.abs(p) >= 0.5) causes.push({ kpi, points: p, text }); };
  const cashPt = B.outflows * BRIDGE.cashPct;

  // Caja: lo disponible menos lo vencido (pesado) y la deuda, contra la caja con la que arrancó.
  const od = overdueTotal(g), debt = debtTotal(g);
  add("caja", (g.cash - B.cash) / cashPt, `Caja de $${fmt(g.cash)} contra $${fmt(B.cash)} al llegar (1 punto = $${fmt(cashPt)}, 5 % de un mes de pagos).`);
  if (od) add("caja", (-od * BRIDGE.overdueWeight) / cashPt, `Pagos vencidos por $${fmt(od)}: cuentan como caja que ya no es tuya, y con recargo.`);
  if (debt) add("caja", -debt / cashPt, `Deuda bancaria pendiente de $${fmt(debt)}.`);

  // Margen: EBITDA sobre ventas de los últimos meses cerrados contra el de la base.
  const ms = g.months.slice(-BRIDGE.marginMonths);
  if (ms.length) {
    const rev = ms.reduce((a, m) => a + m.revenue, 0), eb = ms.reduce((a, m) => a + m.ebitda, 0);
    const pct = rev > 0 ? eb / rev : B.ebitdaPct;
    add("margen", (pct - B.ebitdaPct) / BRIDGE.marginPct, `Margen EBITDA de ${(pct * 100).toFixed(1)} % en ${ms.length === 1 ? "el último mes" : `los últimos ${ms.length} meses`} contra ${(B.ebitdaPct * 100).toFixed(1)} % de la operación base (1 punto = 0.5 pts).`);
  }

  // Equipo: clima (relación con el personal), rotación por encima de lo normal, puestos sin cubrir.
  const since = g.day - 90;
  const recent = g.events.filter((e) => e.day > since);
  const hc = Math.max(1, g.people.filter((p) => p.leftDay === undefined || p.leftDay > g.day).length);
  const quits = recent.filter((e) => e.kind === "renuncia").length;
  const expected = B.quitRate * hc * Math.min(90, g.day + 1);
  add("equipo", (g.relations.staff - 0.8) * 20, `Clima con el personal ${Math.round(g.relations.staff * 100)}/100 (pagos puntuales, cargas de trabajo, recortes).`);
  if (quits > expected + 0.5) add("equipo", -2 * (quits - expected), `${quits} renuncias en 90 días, cuando lo normal para ${hc} personas son unas ${expected.toFixed(1)}.`);
  const short = recent.filter((e) => e.kind === "sin_personal").length;
  if (short) add("equipo", -1.5 * short, `${short} ${short === 1 ? "vez" : "veces"} sin el personal mínimo para operar en 90 días.`);
  if (overdueTotal(g, "personal")) add("equipo", -6, `Sueldos atrasados por $${fmt(overdueTotal(g, "personal"))}.`);

  // Clientes: relación (entregas a tiempo), pedidos perdidos por falta de capacidad, reputación de las sedes.
  add("clientes", (g.relations.clients - 0.8) * 25, `Relación con clientes ${Math.round(g.relations.clients * 100)}/100 (entregas completas y a tiempo).`);
  const last = g.months.at(-1);
  if (last && last.demand > 0) {
    const lost = last.lost / last.demand;
    add("clientes", -(lost - B.lostPct) * 50, `${(lost * 100).toFixed(1)} % de la demanda del último mes no se atendió (base: ${(B.lostPct * 100).toFixed(1)} %).`);
  }
  const open = g.sites.filter((x) => x.status === "operando");
  if (open.length) { const rep = open.reduce((a, x) => a + x.reputation, 0) / open.length; add("clientes", (rep - 1) * 20, `Reputación promedio de las sedes ${rep.toFixed(2)} (1.00 = la de arranque).`); }
  const lostDeals = recent.filter((e) => e.kind === "cancelacion").length, misses = recent.filter((e) => e.kind === "incumplimiento").length;
  if (lostDeals) add("clientes", -5 * lostDeals, `${lostDeals === 1 ? "Un cliente canceló" : `${lostDeals} clientes cancelaron`} su contrato por incumplimiento.`);
  if (misses) add("clientes", -1 * misses, `${misses} ${misses === 1 ? "mes" : "meses"} con penalización por entregas incompletas.`);

  // Consejo: confianza del dueño y del banco, adeudos y crisis de liquidez, y si el negocio crece en EBITDA.
  add("consejo", (g.relations.owner - 0.8) * 25, `Confianza del dueño en tu gestión ${Math.round(g.relations.owner * 100)}/100.`);
  add("consejo", (g.relations.bank - 0.8) * 10, `Relación con el banco ${Math.round(g.relations.bank * 100)}/100.`);
  if (od) add("consejo", -Math.min(8, (od / B.outflows) * 10), `Hay adeudos vencidos por $${fmt(od)}: el consejo pregunta por qué no se anticipó.`);
  if (g.liquidity.status === "crisis") add("consejo", -3, "La proyección de 13 semanas está en crisis de liquidez.");
  if (ms.length) {
    const avg = ms.reduce((a, m) => a + m.ebitda, 0) / ms.length;
    const baseAbs = B.ebitda;
    if (baseAbs > 0) add("consejo", Math.max(-5, Math.min(5, ((avg - baseAbs) / baseAbs) * 5)), `EBITDA mensual promedio de $${fmt(avg)} contra unos $${fmt(baseAbs)} de la base.`);
  }

  for (const k of ["equipo", "clientes", "consejo"] as const) if (editorial[k]) add(k, editorial[k]!, "Efecto de cómo se tomaron las decisiones de crecimiento con tu gente, tus clientes y tu consejo.");

  const delta = { caja: 0, margen: 0, equipo: 0, clientes: 0, consejo: 0 } as Kpis;
  for (const c of causes) delta[c.kpi] += c.points;
  for (const k of Object.keys(delta) as KpiKey[]) delta[k] = Math.round(capped(delta[k]));
  return { delta, causes, baseline: B };
}
