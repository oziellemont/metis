/**
 * mêtis CEO · Growth Engine · lo que ve el jugador en «Mi empresa» y en «Hoy» (fase 2).
 * Puro: recibe el estado del motor y devuelve textos y cifras ya formateados. Ninguna cifra se inventa aquí.
 */
import { roleById } from "./catalog";
import { activePeople, capacityNow, headcount } from "./engine";
import { debtTotal, overdueTotal, MONTH } from "./core";
import { fmt } from "./finance";
import { project13 } from "./liquidity";
import { caseById } from "./cases";
import type { Decision } from "./chains";
import type { GrowthState, MonthSummary } from "./types";
import { profileOf } from "./models";

const money = (cents: number) => `${cents < 0 ? "−" : ""}$${fmt(Math.abs(cents))}`;
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;

export interface TeamView {
  headcount: number;
  vacancies: number;
  payroll: number;
  byRole: { roleId: string; title: string; count: number; site: string }[];
  vacancyList: { title: string; site: string; inDays: number }[];
  note: string;
}
export function teamOf(g: GrowthState): TeamView {
  const siteName = (id: string | null) => (id ? g.sites.find((x) => x.id === id)?.name ?? id : "Oficina");
  const map = new Map<string, { roleId: string; title: string; count: number; site: string }>();
  for (const p of activePeople(g)) {
    const k = `${p.roleId}|${p.siteId}`;
    const r = roleById(p.roleId);
    const cur = map.get(k) ?? { roleId: p.roleId, title: r?.title ?? p.roleId, count: 0, site: siteName(p.siteId) };
    cur.count++;
    map.set(k, cur);
  }
  const payroll = activePeople(g).reduce((a, p) => a + p.salary, 0);
  const last = g.months.at(-1);
  return {
    headcount: headcount(g),
    vacancies: g.vacancies.length,
    payroll,
    byRole: [...map.values()].sort((a, b) => a.site.localeCompare(b.site) || b.count - a.count),
    vacancyList: g.vacancies.map((v) => ({ title: roleById(v.roleId)?.title ?? v.roleId, site: siteName(v.siteId), inDays: Math.max(0, v.fillDay - g.day) })),
    note: last ? `Costo total de la gente el mes pasado (sueldos, cuotas, ISN, aguinaldo y vacaciones provisionados): ${money(last.payroll + last.employer + last.payrollTax + last.provision + last.coverage)}.` : "Todavía no cierra el primer mes.",
  };
}

export interface SiteView { name: string; status: string; capacity: string; bottleneck: string | null; rent: string; note: string }
export function sitesOf(g: GrowthState): SiteView[] {
  const caps = new Map(capacityNow(g).map((c) => [c.site, c]));
  const unit = profileOf(g).unit.many;
  return g.sites.filter((x) => x.status !== "cerrada").map((x) => {
    const c = caps.get(x.name);
    const status = x.status === "operando" ? (x.openedDay !== undefined && x.openedDay > 0 && g.day - x.openedDay < x.maturityDays ? "Operando · madurando" : "Operando") : x.status === "en_obra" ? "En obra" : x.status === "preapertura" ? "Preapertura" : x.status;
    const free = x.rentFreeUntil && x.rentFreeUntil > g.day ? ` (sin renta hasta el día ${x.rentFreeUntil})` : "";
    return {
      name: x.name,
      status,
      capacity: c ? `${c.perDay.toLocaleString("en-US")} ${unit} al día` : x.buildDoneDay !== undefined ? `Abre en unos ${Math.max(0, x.buildDoneDay - g.day)} días` : "—",
      bottleneck: c?.bottleneck ?? null,
      rent: `${money(x.rent)} al mes${free}`,
      note: x.status === "operando" && x.openedDay !== undefined && x.openedDay > 0 ? `Abrió el día ${x.openedDay}; la demanda madura en unos ${Math.round(x.maturityDays / 30)} meses.` : "",
    };
  });
}

export interface ResultsView {
  month: number | null;
  rows: [string, string][];
  cash: string;
  overdue: string | null;
  debt: string | null;
  liquidity: { status: GrowthState["liquidity"]["status"]; text: string };
  history: { month: number; revenue: number; ebitda: number; cash: number }[];
}
export function resultsOf(g: GrowthState): ResultsView {
  const m: MonthSummary | undefined = g.months.at(-1);
  const p = project13(g);
  const od = overdueTotal(g), debt = debtTotal(g);
  const status = g.liquidity.status;
  const text = status === "sana"
    ? `La proyección de 13 semanas no muestra faltantes (mínimo neto ${money(p.minNet)}).`
    : `La proyección muestra un faltante de ${money(Math.abs(Math.min(0, p.minNet)))} ${p.shortWeek !== null ? `en la semana ${p.shortWeek + 1}` : "ya"}. Es una situación a decidir, no un préstamo automático.`;
  return {
    month: m?.month ?? null,
    rows: m ? [
      ["Ventas", money(m.revenue)],
      ["Costo de ventas", money(-m.cogs)],
      ["Nómina y prestaciones", money(-(m.payroll + m.employer + m.payrollTax + m.provision + m.coverage))],
      ["Renta y servicios", money(-(m.rent + m.utilities))],
      ["Otros gastos", money(-(m.variable + m.fixed + m.hiring + m.severance + m.preopening + m.penalties))],
      ["EBITDA", `${money(m.ebitda)} (${pct(m.revenue ? m.ebitda / m.revenue : 0)})`],
      ["Flujo de caja del mes", money(m.cashEnd - m.cashBegin)],
    ] : [],
    cash: money(g.cash),
    overdue: od ? money(od) : null,
    debt: debt ? money(debt) : null,
    liquidity: { status, text },
    history: g.months.map((x) => ({ month: x.month, revenue: x.revenue, ebitda: x.ebitda, cash: x.cashEnd })),
  };
}

export interface MilestoneView { day: number; text: string; kind: "decision" | "evento" }
export function milestonesOf(g: GrowthState, decisions: readonly Decision[], limit = 12): MilestoneView[] {
  const KEEP = new Set(["incorporacion", "renuncia", "baja", "obra", "obra_terminada", "apertura", "activo", "turno", "contrato", "crisis_liquidez", "liquidez_resuelta", "decision_financiera", "rechazo", "recorte", "incumplimiento", "cancelacion"]);
  const out: MilestoneView[] = [
    ...decisions.map((d) => {
      const c = caseById(d.caseId);
      const o = c?.options.find((x) => x.id === d.optionId);
      return { day: d.day, text: `Decidiste: ${o?.text ?? d.optionId}${c ? ` («${c.subject}»)` : ""}.`, kind: "decision" as const };
    }),
    ...g.events.filter((e) => KEEP.has(e.kind) && e.day > 0).map((e) => ({ day: e.day, text: e.text, kind: "evento" as const })),
  ];
  return out.sort((a, b) => b.day - a.day || (a.kind === "decision" ? -1 : 1)).slice(0, limit);
}

/** Una línea para «Hoy»: lo más urgente del motor (crisis, caso pendiente, o el pulso del mes). */
export function todayLineOf(g: GrowthState, pending: number): string {
  if (g.liquidity.status === "crisis") return `Liquidez en crisis: la proyección muestra un faltante de ${money(g.liquidity.gap)}. Revisa tus opciones en Mi empresa.`;
  if (pending) return pending === 1 ? "Tienes un caso de crecimiento esperando tu decisión." : `Tienes ${pending} casos de crecimiento esperando tu decisión.`;
  const m = g.months.at(-1);
  if (!m) return `Día ${g.day} de tu empresa: ${headcount(g)} personas, caja de ${money(g.cash)}.`;
  return `Mes ${m.month}: ventas de ${money(m.revenue)}, EBITDA de ${money(m.ebitda)} y ${headcount(g)} personas.`;
}

/** Fila comparativa para la demostración antes/después. */
export interface Compare { label: string; before: string; after: string; delta: string; tone: "good" | "bad" | "flat" }
export function compareStates(a: GrowthState, b: GrowthState): Compare[] {
  const ma = a.months.at(-1), mb = b.months.at(-1);
  const row = (label: string, x: number, y: number, f: (n: number) => string, better: "up" | "down" = "up"): Compare => {
    const d = y - x;
    return { label, before: f(x), after: f(y), delta: d === 0 ? "—" : `${d > 0 ? "+" : "−"}${f(Math.abs(d)).replace(/^−/, "")}`, tone: d === 0 ? "flat" : (d > 0) === (better === "up") ? "good" : "bad" };
  };
  const n = (x: number) => x.toLocaleString("en-US");
  const out: Compare[] = [
    row("Personas", headcount(a), headcount(b), n),
    row("Sedes operando", a.sites.filter((x) => x.status === "operando").length, b.sites.filter((x) => x.status === "operando").length, n),
    row("Nómina bruta mensual", activePeople(a).reduce((s, p) => s + p.salary, 0), activePeople(b).reduce((s, p) => s + p.salary, 0), money, "down"),
    row("Caja", a.cash, b.cash, money),
    row("Pagos vencidos", overdueTotal(a), overdueTotal(b), money, "down"),
  ];
  if (ma && mb) out.push(
    row("Ventas del último mes", ma.revenue, mb.revenue, money),
    row("EBITDA del último mes", ma.ebitda, mb.ebitda, money),
    ...(profileOf(a).mode === "contratos" ? [
      row(profileOf(a).labels.committed, a.contracts.reduce((s, c) => s + c.unitsPerDay, 0), b.contracts.reduce((s, c) => s + c.unitsPerDay, 0), n),
      row("Penalizaciones pagadas (acumulado)", a.months.reduce((s, m) => s + m.penalties, 0), b.months.reduce((s, m) => s + m.penalties, 0), money, "down"),
    ] : []),
    row(profileOf(a).labels.lostCompare, ma.lost + Math.max(0, ma.demand - ma.served - ma.lost), mb.lost + Math.max(0, mb.demand - mb.served - mb.lost), n, "down"),
  );
  return out;
}
export const monthsOf = (days: number) => Math.round(days / MONTH);
