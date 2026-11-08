/**
 * mêtis CEO · Growth Engine · proyección de caja a 13 semanas y estado de liquidez.
 *
 * La proyección corre el mismo motor sobre una copia (sin rotación aleatoria ni decisiones nuevas) y mide, semana por
 * semana, la posición neta: caja menos obligaciones vencidas. Así el problema se ve ANTES de que ocurra:
 *  - «alerta»: la proyección muestra que en alguna de las próximas 13 semanas no alcanzará para pagar lo que vence.
 *  - «crisis»: ya hay obligaciones vencidas sin pagar.
 * Cada cambio de estado deja un evento; la crisis es una situación ejecutiva que el director debe resolver con las
 * decisiones de finance.ts (no hay préstamo automático).
 */
import { CREDITOR_LABEL, clone, overdueTotal } from "./core";
import { advance } from "./engine";
import type { Creditor, GrowthState } from "./types";

export interface WeekProjection { week: number; day: number; cash: number; overdue: number; net: number }
export interface Projection { weeks: WeekProjection[]; minNet: number; shortWeek: number | null; peakShort: number; byCreditor: Partial<Record<Creditor, number>> }

/** Proyecta 13 semanas sin modificar el estado. */
export function project13(s: GrowthState, weeks = 13): Projection {
  let p = clone(s);
  p.projecting = true;
  p.attrition = false;
  const out: WeekProjection[] = [];
  for (let w = 1; w <= weeks; w++) {
    p = advance(p, 7);
    const od = overdueTotal(p);
    out.push({ week: w, day: p.day, cash: p.cash, overdue: od, net: p.cash - od });
  }
  // Umbral de materialidad: un faltante menor a $15,000 o al 2 % de las salidas del último mes no dispara alerta.
  const outflows = s.months.at(-1)?.outflows ?? 0;
  const material = Math.max(15_000_00, Math.round(outflows * 0.02));
  const short = out.find((x) => x.overdue - overdueTotal(s) > material);
  const by: Partial<Record<Creditor, number>> = {};
  for (const o of p.overdue) by[o.creditor] = (by[o.creditor] ?? 0) + o.amount;
  const base = overdueTotal(s);
  return { weeks: out, minNet: Math.min(...out.map((x) => x.net)), shortWeek: short ? short.week : null, peakShort: Math.max(0, ...out.map((x) => x.overdue - base)), byCreditor: by };
}

const fmt = (c: number) => Math.round(c / 100).toLocaleString("en-US");

/** Recalcula el estado de liquidez. `force` se usa tras una decisión (la proyección cambia en ese momento). */
export function updateLiquidity(s: GrowthState, force: boolean) {
  if (s.projecting) return;
  const L = s.liquidity;
  const now = overdueTotal(s);
  const pr = project13(s);
  const prev = L.status;
  L.shortWeek = pr.shortWeek;
  L.gap = Math.max(pr.peakShort, now);
  const next: typeof L.status = now > 0 ? "crisis" : pr.shortWeek !== null ? "alerta" : "sana";
  if (next !== prev) {
    L.status = next; L.since = s.day;
    const who = Object.entries(pr.byCreditor).sort((a, b) => b[1] - a[1]).map(([c]) => CREDITOR_LABEL[c as Creditor]).slice(0, 2).join(" y ");
    if (next === "alerta") s.events.push({ day: s.day, kind: "alerta_liquidez", text: `La proyección de caja muestra que ${pr.shortWeek === 1 ? "esta misma semana" : `en unas ${pr.shortWeek} semanas`} no alcanzará para pagar ${who || "lo que vence"}: faltarían unos $${fmt(pr.peakShort)}. Hay tiempo para actuar.` });
    if (next === "crisis") s.events.push({ day: s.day, kind: "crisis_liquidez", text: `Hay $${fmt(now)} de pagos vencidos (${s.overdue.map((o) => CREDITOR_LABEL[o.creditor]).filter((x, i, a) => a.indexOf(x) === i).join(", ")}). Cada día de atraso tiene consecuencias: hay que decidir cómo cubrirlo.` });
    if (next === "sana" && prev !== "sana") s.events.push({ day: s.day, kind: "liquidez_resuelta", text: "La proyección de 13 semanas ya no muestra faltantes: la liquidez vuelve a estar bajo control." });
  }
  void force;
}
