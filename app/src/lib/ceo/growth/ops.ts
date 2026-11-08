/**
 * mêtis CEO · Growth Engine · mapa de operaciones, alertas y el impacto de cada opción.
 * Puro: todo sale del estado del motor (nada se inventa aquí). Lo usan «Mi empresa», «Hoy» y la hoja de decisión.
 */
import { roleById } from "./catalog";
import { activePeople, capacityNow } from "./engine";
import { debtTotal, overdueTotal } from "./core";
import { fmt } from "./finance";
import { zoneOf, ZONES } from "./geo";
import { decide, type Decision } from "./chains";
import { coldSite, hotSite } from "./opscases";
import { profileOf } from "./models";
import type { GrowthState, SiteMonth } from "./types";

export const money = (cents: number) => `${cents < 0 ? "−" : ""}$${fmt(Math.abs(cents))}`;
/** Cifra corta para chips y el mapa: $1.2M, $85k. */
export function short(cents: number): string {
  const p = Math.abs(cents) / 100, sign = cents < 0 ? "−" : "";
  if (p >= 1_000_000) return `${sign}$${(p / 1_000_000).toFixed(p >= 10_000_000 ? 0 : 1)}M`;
  if (p >= 1_000) return `${sign}$${Math.round(p / 1_000)}k`;
  return `${sign}$${Math.round(p)}`;
}

export type Tone = "ok" | "hot" | "cold" | "new" | "build";
export interface MapSite {
  id: string; name: string; zone: string; x: number; y: number; far: boolean;
  status: string; tone: Tone;
  revenue: number; costs: number; contribution: number; people: number;
  use: number | null; lostPct: number | null;
  unit: string;
}
const unitOf = (g: GrowthState) => profileOf(g).unit.many;
const lastBySite = (g: GrowthState) => new Map((g.months.at(-1)?.bySite ?? []).map((m) => [m.siteId, m]));
const costsOf = (m: SiteMonth) => m.cogs + m.variable + m.people + m.rent + m.utilities;

export function opsMapOf(g: GrowthState): { sites: MapSite[]; office: number; month: number | null } {
  const last = lastBySite(g);
  const people = activePeople(g);
  const hot = hotSite(g)?.siteId, cold = coldSite(g)?.siteId;
  const sites = g.sites.filter((x) => x.status !== "cerrada").map((x): MapSite => {
    const z = zoneOf(x), m = last.get(x.id);
    const young = x.status === "operando" && x.openedDay !== undefined && x.openedDay > 0 && g.day - x.openedDay < Math.max(60, x.maturityDays);
    const tone: Tone = x.status !== "operando" ? "build" : x.id === hot ? "hot" : x.id === cold ? "cold" : young ? "new" : "ok";
    const status = x.status === "en_obra" ? "En obra" : x.status === "preapertura" ? "Preapertura" : tone === "hot" ? "No da abasto" : tone === "cold" ? "Con holgura" : tone === "new" ? "Madurando" : "Operando";
    return {
      id: x.id, name: x.name, zone: z.label, x: z.x, y: z.y, far: !!z.far, status, tone,
      revenue: m?.revenue ?? 0, costs: m ? costsOf(m) : 0, contribution: m?.contribution ?? 0,
      people: people.filter((p) => p.siteId === x.id).length,
      use: m && m.capacity > 0 ? Math.min(1, m.served / m.capacity) : null,
      lostPct: m && m.demand > 0 ? m.lost / m.demand : null,
      unit: unitOf(g),
    };
  });
  return { sites, office: people.filter((p) => !p.siteId).length, month: g.months.at(-1)?.month ?? null };
}

export interface SiteDetail {
  name: string; zone: string; status: string;
  pnl: [string, string][];
  ops: [string, string][];
  team: { title: string; count: number }[];
  vacancies: { title: string; inDays: number }[];
}
export function siteDetailOf(g: GrowthState, siteId: string): SiteDetail | null {
  const x = g.sites.find((s) => s.id === siteId);
  if (!x) return null;
  const m = lastBySite(g).get(siteId);
  const cap = capacityNow(g).find((c) => c.id === siteId);
  const unit = unitOf(g);
  const byRole = new Map<string, number>();
  for (const p of activePeople(g).filter((p) => p.siteId === siteId)) byRole.set(p.roleId, (byRole.get(p.roleId) ?? 0) + 1);
  const n = (v: number) => Math.round(v).toLocaleString("en-US");
  const days = 30;
  return {
    name: x.name, zone: zoneOf(x).label,
    status: x.status === "operando" ? "Operando" : x.status === "en_obra" ? `En obra · abre en unos ${Math.max(0, (x.buildDoneDay ?? g.day) - g.day)} días` : x.status === "preapertura" ? "Preapertura" : "Cerrada",
    pnl: m ? [
      ["Ventas", money(m.revenue)],
      [profileOf(g).labels.cogs, money(-m.cogs)],
      ["Gente", money(-m.people)],
      ["Renta y servicios", money(-(m.rent + m.utilities))],
      ["Otros variables", money(-m.variable)],
      ["Contribución", money(m.contribution)],
    ] : [],
    ops: [
      ...(cap ? [["Capacidad", `${n(cap.perDay)} ${unit} al día`] as [string, string]] : []),
      ...(m && m.capacity > 0 ? [["Uso de la capacidad", `${Math.round((m.served / m.capacity) * 100)} %`] as [string, string]] : []),
      ...(m ? [[profileOf(g).labels.served, `${n(m.served / days)} al día`] as [string, string]] : []),
      ...(m && m.lost > 0 ? [[profileOf(g).labels.lost, `${n(m.lost / days)} al día`] as [string, string]] : []),
      ...(cap ? [["Cuello de botella", profileOf(g).bottleneck[cap.bottleneck] ?? BOTTLENECK[cap.bottleneck] ?? cap.bottleneck] as [string, string]] : []),
      ["Renta", `${money(x.rent)} al mes`],
      ...(x.shifts > 1 ? [["Turnos", String(x.shifts)] as [string, string]] : []),
    ],
    team: [...byRole.entries()].map(([r, count]) => ({ title: roleById(r)?.title ?? r, count })).sort((a, b) => b.count - a.count),
    vacancies: g.vacancies.filter((v) => v.siteId === siteId).map((v) => ({ title: roleById(v.roleId)?.title ?? v.roleId, inDays: Math.max(0, v.fillDay - g.day) })),
  };
}
const BOTTLENECK: Record<string, string> = { cocina: "Cocina", servicio: "Servicio en sala", loza: "Lavado de loza", mesas: "Mesas", demanda: "La demanda", operacion: "Operadores", prensa: "Prensas", supervision: "Supervisión", mantenimiento: "Mantenimiento", calidad: "Calidad" };

// ───────────────────────────────────────────────────────────── alertas
export interface Alert { id: string; tone: "bad" | "warn" | "good"; title: string; text: string }
/** Lo que el director debería saber hoy de su empresa, de lo más urgente a lo menos. Máximo cuatro. */
export function alertsOf(g: GrowthState): Alert[] {
  const out: Alert[] = [];
  const m = g.months.at(-1), prev = g.months.at(-2);
  if (g.liquidity.status === "crisis") out.push({ id: "liquidez", tone: "bad", title: "Liquidez en crisis", text: `Faltan ${money(g.liquidity.gap)} en las próximas semanas.` });
  else if (g.liquidity.status === "alerta") out.push({ id: "liquidez", tone: "warn", title: "La caja se aprieta", text: `La proyección de 13 semanas muestra un faltante de ${money(g.liquidity.gap)}.` });
  const od = overdueTotal(g);
  if (od > 0) out.push({ id: "vencidos", tone: "bad", title: "Pagos vencidos", text: `Debes ${money(od)} fuera de plazo.` });
  const hot = hotSite(g);
  if (hot) out.push({ id: "abasto", tone: "warn", title: `${g.sites.find((x) => x.id === hot.siteId)?.name} no da abasto`, text: `Se perdió el ${Math.round(hot.lostPct * 100)} % de la demanda. Falta ${(roleById(hot.roleId)?.title ?? hot.roleId).toLowerCase()}.` });
  const cold = coldSite(g);
  if (cold) out.push({ id: "holgura", tone: "warn", title: `${g.sites.find((x) => x.id === cold.siteId)?.name} tiene holgura`, text: `Usa el ${Math.round(cold.usePct * 100)} % de su capacidad.` });
  const loans = g.loans.filter((l) => l.balance > 0);
  if (loans.length) out.push({ id: "credito", tone: "good", title: "Crédito al corriente", text: `Pagas ${money(loans.reduce((a, l) => a + l.payment, 0))} al mes. Saldo de ${money(debtTotal(g))}.` });
  if (m && m.ebitda < 0) out.push({ id: "ebitda", tone: "bad", title: "El mes cerró en pérdida", text: `EBITDA de ${money(m.ebitda)} con ventas de ${money(m.revenue)}.` });
  else if (m && prev && prev.revenue > 0 && m.revenue > prev.revenue * 1.04) out.push({ id: "ventas", tone: "good", title: "Las ventas crecen", text: `${money(m.revenue)} en el mes, ${Math.round((m.revenue / prev.revenue - 1) * 100)} % más que el anterior.` });
  const order = { bad: 0, warn: 1, good: 2 } as const;
  return out.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 4);
}

// ───────────────────────────────────────────────────────────── impacto de una opción
export interface Impact { now: number; monthly: number; people: number; sites: number }
const pending = (g: GrowthState, days: number) => g.scheduled.filter((x) => x.day <= g.day + days).reduce((a, x) => a + x.amount, 0);
const monthlyRun = (g: GrowthState) =>
  [...activePeople(g), ...g.vacancies].reduce((a, p) => a + p.salary, 0) +
  g.sites.filter((x) => x.status !== "cerrada").reduce((a, x) => a + x.rent + x.utilities, 0) +
  g.loans.filter((l) => l.balance > 0).reduce((a, l) => a + l.payment, 0);
/** Lo que cambia con la opción: caja en las próximas semanas, costo mensual, personas y sedes. */
export function impactOf(g: GrowthState, caseId: string, optionId: string, decisions: readonly Decision[]): Impact | null {
  const r = decide(g, caseId, optionId, decisions);
  if (!r.ok) return null;
  const a = g, b = r.state;
  return {
    now: b.cash + pending(b, 45) - (a.cash + pending(a, 45)),
    monthly: monthlyRun(b) - monthlyRun(a),
    people: activePeople(b).length + b.vacancies.length - activePeople(a).length - a.vacancies.length,
    sites: b.sites.filter((x) => x.status !== "cerrada").length - a.sites.filter((x) => x.status !== "cerrada").length,
  };
}

export { ZONES };
