/**
 * mêtis CEO · reporte mensual y decisión de caja (P0-D). Lógica pura, sin React.
 *
 * Reglas (plan P0-A §4.3 y §6.3):
 *  - El tiempo del negocio avanza por cierre: un mes se cierra al atender sus casos (advance) y se firma al revisar
 *    su reporte (closePeriod). Sin firmar el reporte, el siguiente mes no se cierra.
 *  - El reporte compara mes anterior, meta y real, y explica con números del motor. No inventa saldos.
 *  - La decisión del reporte crea, a lo más, una asignación por mes (id fijo `m{mes}`): nunca se aplica dos veces.
 *  - Una asignación decidida al cerrar el mes P se paga desde P+1 y su efecto llega con el retraso de los supuestos.
 */
import { personOf } from "../cast";
import { formatMoney, type DisplayCurrency } from "../career/money";
import { companyById } from "../companies";
import { closedRunsOf, isContinuous, packOf, reportDueOf } from "../engine";
import type { CastId, CeoState, CompanyPack } from "../types";
import { businessOf, type Business } from "./index";
import { assumptionsOf, simulate, type Allocation, type PeriodInput, type PeriodState } from "./model";

export type ReportChoice = "a" | "b" | "c";
export interface ReportOption {
  id: ReportChoice;
  label: string;
  /** Lo que cuesta y cuándo llega el efecto, en palabras. */
  detail: string;
  /** La asignación que crea (null = guardar la caja). */
  allocation: Allocation | null;
  /** Proyección con supuestos fijos y sin otros cambios: ventas y caja al cierre del mes `horizon`. */
  projection: { revenue: number; cash: number };
}
export interface Proposal {
  kind: "marketing" | "capex";
  title: string;
  why: string;
  horizon: number;
  options: ReportOption[];
}
export interface MonthReport {
  period: number;
  presenter: CastId;
  prev: PeriodState;
  actual: PeriodState;
  /** Por qué: 1 a 3 frases hechas solo con números. */
  why: string[];
  /** Qué está en juego. */
  stake: string;
  /** Decisión del mes. Null = no hay decisión grande: basta con «Enterado». */
  proposal: Proposal | null;
  /** Lo que ya decidiste en este reporte (si ya lo firmaste). */
  decided: Allocation | null;
  reviewed: boolean;
  /** Lección corta de Academy relacionada. */
  lesson: string;
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const nf = (v: number, d = 1) => v.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Quién presenta el reporte: la dirección de Finanzas del comité (o quien habla por el consejo). */
export function presenterOf(pk: CompanyPack): CastId {
  const fin = Object.values(pk.cast).find((p) => p.group === "comite" && /finanzas/i.test(p.role));
  return fin?.id ?? pk.roles.board;
}

/** Entradas del motor hasta el mes `upTo` (solo meses cerrados) más `extra` meses tranquilos para proyectar. */
function inputsFor(s: CeoState, upTo: number, extra = 0): PeriodInput[] {
  const base = companyById(s.companyProfile!.contentPackId).kpiStart;
  const closed = closedRunsOf(s).slice(0, upTo).map((r) => {
    const d: Record<string, number> = {};
    for (const k of Object.keys(base) as (keyof typeof base)[]) { const v = r.kpis[k] - base[k]; if (v) d[k] = v; }
    return { kpiDelta: d, status: "cerrado" as const };
  });
  return [...closed, ...Array.from({ length: extra }, () => ({ kpiDelta: {}, status: "cerrado" as const }))];
}
function sim(s: CeoState, upTo: number, extra: number, allocations: Allocation[]): PeriodState[] {
  const p = s.companyProfile!;
  return simulate(businessOf(s)!.profile, inputsFor(s, upTo, extra), { seed: p.companyId, archetype: p.archetype, assumptionsVersion: s.business?.assumptionsVersion, allocations });
}

/** Propuesta de caja para el reporte del mes `period`, o null si este mes basta con «Enterado». Determinista. */
export function proposalOf(s: CeoState, period: number, b: Business = businessOf(s)!, cur: DisplayCurrency = s.settings.displayCurrency ?? "MXN"): Proposal | null {
  const money = (v: number) => formatMoney(v, cur);
  const A = assumptionsOf(s.business?.assumptionsVersion);
  const allocs = s.business?.allocations ?? [];
  const m = b.periods[period];
  if (!m) return null;
  // Una inversión de crecimiento todavía corriendo: este mes se observa, no se apila otra.
  if (allocs.some((a) => a.lever === "marketing" && period <= a.period + 1 + A.marketingLag + (a.months ?? A.marketingMonths) - 1)) return null;
  if (allocs.some((a) => a.lever === "capex" && period - a.period <= A.capexLag)) return null;
  // Caja corta: no se propone gastar.
  if (m.cashEnd <= 0 || (m.runwayMonths !== null && m.runwayMonths < 6)) return null;
  const below = m.revenue < m.revenueTarget * 0.995;
  const kind: Proposal["kind"] = below ? "marketing" : "capex";
  const months = A.marketingMonths;
  const full = kind === "marketing"
    ? r2(Math.min(m.revenue * 0.06, (m.cashEnd * 0.3) / months))
    : r2(Math.min(m.revenue * 0.5, m.cashEnd * 0.3));
  if (full < 0.02) return null;
  const half = r2(full / 2);
  const horizon = kind === "marketing" ? period + 1 + A.marketingLag + 1 : period + A.capexLag + 1;
  const extra = horizon - period;
  const mk = (amount: number): Allocation => (kind === "marketing" ? { id: `m${period}`, period, lever: "marketing", amount, months } : { id: `m${period}`, period, lever: "capex", amount });
  const proj = (a: Allocation | null) => { const ps = sim(s, period, extra, a ? [...allocs, a] : allocs); const e = ps[ps.length - 1]; return { revenue: e.revenue, cash: e.cashEnd }; };
  const first = period + 1, sells = period + 1 + A.marketingLag;
  const opt = (id: ReportChoice, amount: number | null): ReportOption => {
    const a = amount === null ? null : mk(amount);
    const detail = amount === null
      ? "No gastas de más. La caja queda disponible y las ventas siguen su ritmo."
      : kind === "marketing"
        ? `${money(amount)} al mes durante ${months} meses (${money(r2(amount * months))} en total). Se paga desde el mes ${first}; la venta empieza a responder en el mes ${sells}.`
        : `${money(amount)} una sola vez, en el mes ${first}. El margen mejora a partir del mes ${period + A.capexLag}.`;
    const label = id === "c" ? "Guardar la caja" : id === "a" ? (kind === "marketing" ? "Aprobar la campaña completa" : "Aprobar la inversión") : "Aprobar la mitad";
    return { id, label, detail, allocation: a, projection: proj(a) };
  };
  return kind === "marketing"
    ? { kind, horizon, title: "Subir el marketing para alcanzar la meta", why: `Las ventas quedaron ${nf(Math.abs((m.revenue / m.revenueTarget - 1) * 100))} % abajo de la meta. Finanzas propone una campaña de ${months} meses.`, options: [opt("a", full), opt("b", half), opt("c", null)] }
    : { kind, horizon, title: "Invertir en eficiencia de la operación", why: "Las ventas van en meta. Finanzas propone invertir en la operación para mejorar el margen.", options: [opt("a", full), opt("b", half), opt("c", null)] };
}

/** Frases del «por qué», solo con números del motor (sin adjetivos de más). */
function whyOf(s: CeoState, period: number, b: Business, cur: DisplayCurrency): string[] {
  const money = (v: number) => formatMoney(v, cur);
  const A = assumptionsOf(s.business?.assumptionsVersion);
  const m = b.periods[period], p = b.periods[period - 1];
  const out: string[] = [];
  const allocs = s.business?.allocations ?? [];
  // Efecto de cada inversión anterior, contra el mismo negocio sin ella.
  for (const a of allocs) {
    if (a.period >= period) continue;
    if (a.lever === "marketing") {
      const sells = a.period + 1 + A.marketingLag;
      const last = sells + (a.months ?? A.marketingMonths) - 1;
      if (period < a.period + 1 || period > last) continue;
      const without = sim(s, period, 0, allocs.filter((x) => x.id !== a.id))[period];
      if (period < sells) out.push(`El gasto de la campaña ya salió (${money(a.amount)} este mes) y la venta todavía no llega: empieza a responder en el mes ${sells}.`);
      else out.push(`La campaña ya vende: sin ella, las ventas del mes habrían sido ${money(without.revenue)} en lugar de ${money(m.revenue)}.`);
    } else if (a.lever === "capex" && period >= a.period + 1 && period <= a.period + A.capexLag + 1) {
      if (period === a.period + 1) out.push(`La inversión en la operación salió de la caja este mes (${money(a.amount)}).`);
      else if (period - a.period >= A.capexLag) out.push(`La inversión en la operación ya se nota en el margen bruto: ${nf(m.grossMargin * 100)} %.`);
    }
  }
  if (Math.abs(m.dso - p.dso) >= 0.5) out.push(m.dso > p.dso ? `Cobraste más lento: los días de cobro pasaron de ${nf(p.dso, 0)} a ${nf(m.dso, 0)} y eso retuvo caja en clientes.` : `Cobraste más rápido: los días de cobro bajaron de ${nf(p.dso, 0)} a ${nf(m.dso, 0)} y eso liberó caja.`);
  else if (m.workingCapital > 0.01) out.push(`Las ventas crecieron y cobras a ${nf(m.dso, 0)} días: ${money(m.workingCapital)} se quedaron en cuentas por cobrar.`);
  const gm = (m.grossMargin - p.grossMargin) * 100;
  if (Math.abs(gm) >= 0.1) out.push(`El margen bruto ${gm > 0 ? "subió" : "bajó"} ${nf(Math.abs(gm))} pts, a ${nf(m.grossMargin * 100)} %.`);
  else if (out.length < 2) out.push(`El margen bruto aguanta en ${nf(m.grossMargin * 100)} %.`);
  return out.slice(0, 3);
}

/** Reporte del mes `period` (1 = primer mes cerrado). Null fuera de la carrera continua o si el mes no existe. */
export function reportOf(s: CeoState, period: number, cur: DisplayCurrency = s.settings.displayCurrency ?? "MXN"): MonthReport | null {
  if (!isContinuous(s)) return null;
  const b = businessOf(s);
  if (!b || !Number.isInteger(period) || period < 1 || period > closedRunsOf(s).length) return null;
  const pk = packOf(s);
  const reviewed = (s.business?.reviewed ?? []).includes(period);
  const decided = (s.business?.allocations ?? []).find((a) => a.id === `m${period}`) ?? null;
  const proposal = reviewed ? null : proposalOf(s, period, b, cur);
  const m = b.periods[period];
  const stake = reviewed
    ? (decided ? (decided.lever === "marketing" ? "Tu apuesta de crecimiento del trimestre: el gasto sale primero y la venta llega después." : "Tu inversión en la operación: la caja sale primero y el margen mejora después.") : "Decidiste no comprometer caja nueva este mes.")
    : proposal
    ? (proposal.kind === "marketing" ? "Tu propuesta de crecimiento para el trimestre: cuánto gastar hoy para vender más después." : "Cuánto de la caja de hoy pones en la operación para ganar margen después.")
    : m.runwayMonths !== null && m.runwayMonths < 6 ? "Cuidar la caja: al ritmo actual, alcanza para pocos meses." : "Sostener el ritmo. Este mes no hay una decisión grande de caja.";
  return {
    period, presenter: presenterOf(pk), prev: b.periods[period - 1], actual: m, why: whyOf(s, period, b, cur), stake, proposal, decided, reviewed,
    lesson: m.runwayMonths !== null && m.runwayMonths < 6 ? "finanzas-2" : "finanzas",
  };
}

/** El reporte pendiente (si lo hay). */
export const dueReportOf = (s: CeoState): MonthReport | null => { const p = reportDueOf(s); return p === null ? null : reportOf(s, p); };

// ───────────────────────────────────────────── acciones (las replica el servidor)
/** Aprueba una opción de la propuesta del reporte pendiente. Solo una asignación por mes; solo opciones ofrecidas. */
export function allocate(s: CeoState, period: number, option: ReportChoice, now: number): CeoState {
  if (reportDueOf(s) !== period || option === "c") return s;
  const log = s.business;
  if (!log || log.allocations.some((a) => a.id === `m${period}`)) return s;
  const a = proposalOf(s, period)?.options.find((o) => o.id === option)?.allocation;
  if (!a) return s;
  return { ...s, business: { ...log, allocations: [...log.allocations, a] }, lastActiveAt: now };
}
/** Firma el reporte del mes: queda revisado y el siguiente mes ya puede cerrarse. */
export function closePeriod(s: CeoState, period: number, now: number): CeoState {
  if (reportDueOf(s) !== period || !s.business) return s;
  return { ...s, business: { ...s.business, reviewed: [...(s.business.reviewed ?? []), period].sort((x, y) => x - y) }, lastActiveAt: now };
}

/** Nombre corto de quien presenta (para textos). */
export const presenterName = (pk: CompanyPack) => personOf(pk, presenterOf(pk));
