/**
 * Retail v2 · la cadena de conveniencia dentro de la partida.
 *
 * En la partida solo se guarda el REGISTRO (plantilla, semilla y decisiones con su día). El estado se reconstruye
 * siempre igual con el motor determinista. Llega un caso cada `RETAIL_CADENCE` días (el selector adaptable elige
 * cuál); con pagos vencidos, el caso de liquidez llega de inmediato.
 */
import { advanceRetail, applyRetail, cashOf, createRetail, debtOf, overdueTotal, MONTH, fmt, type RetailState } from "./engine";
import { RETAIL_CASES, caseById as retailCaseById, decideRetail, liquidityCase, nextCase, optionCheck, rank, type LogEntry, type RCase } from "./cases";
import { TEMPLATES_RETAIL } from "./params";
import type { KpiKey, Kpis } from "../../types";
import { caseIdOf, episodeIdOfCase, isWorldCaseId, openEpisode, regularLastDay, timeline, worldSig, worldViewOf, type ExternalHit, type WorldView } from "../../world/episodes";
import { retailImpact, retailWorldCase } from "../../world/cases";
import type { WorldEpisode } from "../../world/types";

export const RETAIL_CADENCE = 12;
export const isRetailTemplate = (id: string | undefined | null): boolean => !!id && !!TEMPLATES_RETAIL[id];

export interface RetailDecision { caseId: string; key: string; optionId: string; day: number; source?: "motor" | "ia" }

export const isRetailCaseId = (id: string) => /^liq@\d+$/.test(id) || isWorldCaseId(id) || !!retailCaseById(id);

// ───────────────────────────────────────────────────────── reconstrucción
/** `external`: impactos simulados de acontecimientos reales (o ejercicios) que llegaron con fuerza a una sede. */
export interface RetailRebuilt { state: RetailState; log: LogEntry[]; rejected: number; external: ExternalHit[] }
const CACHE = new Map<string, { day: number; r: RetailRebuilt }>();
const CACHE_MAX = 12;
const keyOf = (templateId: string, seed: string, ds: readonly RetailDecision[], world?: readonly WorldEpisode[]) => `${templateId}|${seed}|${ds.map((d) => `${d.caseId}:${d.optionId}@${d.day}`).join(",")}|${worldSig(world)}`;
const cloneR = (r: RetailRebuilt): RetailRebuilt => ({ state: r.state, log: r.log, rejected: r.rejected, external: r.external });

function resolveCase(s: RetailState, caseId: string, world?: readonly WorldEpisode[]): RCase | null {
  if (caseId.startsWith("liq@")) { const c = liquidityCase(s); return c ? { ...c, id: caseId } : null; }
  if (isWorldCaseId(caseId)) { const ep = world?.find((e) => e.id === episodeIdOfCase(caseId)); return ep ? retailWorldCase(s, ep) : null; }
  return retailCaseById(caseId) ?? null;
}

/** Estado de la cadena en el día `day`, con las decisiones y los episodios externos congelados (`world`). */
export function retailAt(templateId: string, seed: string, decisions: readonly RetailDecision[], day: number, world?: readonly WorldEpisode[]): RetailRebuilt {
  const key = keyOf(templateId, seed, decisions, world);
  const target = Math.max(0, Math.floor(day));
  const hit = CACHE.get(key);
  if (hit && hit.day === target) return hit.r;
  const steps = timeline(decisions, world, target);
  const lastStep = steps.at(-1)?.day ?? -1;
  let r: RetailRebuilt;
  if (hit && hit.day < target && hit.day >= lastStep) {
    r = { ...cloneR(hit.r), state: advanceRetail(hit.r.state, target - hit.r.state.day) };
  } else {
    let s = createRetail(templateId, seed);
    const log: LogEntry[] = [];
    const external: ExternalHit[] = [];
    const chosen = new Map<string, string>();
    let rejected = 0;
    for (const st of steps) {
      if (st.day > s.day) s = advanceRetail(s, st.day - s.day);
      if (st.ep) {
        const imp = retailImpact(s, st.ep, chosen.get(st.ep.id) ?? null);
        const done: string[] = [];
        for (const cmd of imp.commands) if (applyRetail(s, cmd).ok) done.push(`${cmd.type}:${cmd.id}`);
        s.events.push({ day: s.day, kind: "mundo", text: imp.text, ref: caseIdOf(st.ep) });
        external.push({ id: st.ep.id, day: s.day, text: imp.text, mode: st.ep.mode, commands: done, ...(imp.parts ? { parts: imp.parts } : {}), ...(st.ep.rv ? { rv: st.ep.rv } : {}) });
        continue;
      }
      const d = st.d!;
      const c = resolveCase(s, d.caseId, world);
      const res = c ? decideRetail(s, c, d.optionId, log, d.source ?? "motor") : { ok: false };
      if (!res.ok) rejected++;
      else if (isWorldCaseId(d.caseId)) chosen.set(episodeIdOfCase(d.caseId), d.optionId);
    }
    if (target > s.day) s = advanceRetail(s, target - s.day);
    r = { state: s, log, rejected, external };
  }
  CACHE.delete(key);
  CACHE.set(key, { day: target, r });
  while (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
  return r;
}

// ───────────────────────────────────────────────────────── casos pendientes
export interface RetailOptionView { id: string; label: string; detail: string; stance: string; ok: boolean; reason?: string; blocked: boolean }
export interface RetailPending { c: RCase; subject: string; from: string; body: string[]; data: [string, string][]; lesson: string; options: RetailOptionView[]; why: string; source: "motor" | "ia"; world?: WorldView }

function viewOf(s: RetailState, c: RCase, why: string, source: "motor" | "ia", world?: WorldView): RetailPending {
  const people = TEMPLATES_RETAIL[s.templateId].people;
  return {
    c, subject: c.subject, from: people[c.from] ?? c.from, body: c.body(s), data: c.data ? c.data(s) : [], lesson: c.lesson, why, source, ...(world ? { world } : {}),
    options: c.options.map((o) => { const chk = optionCheck(s, o); return { id: o.id, label: o.label, detail: o.blocked ? "" : o.detail(s), stance: o.stance, ok: chk.ok, reason: chk.reason, blocked: !!o.blocked }; }),
  };
}

/** El caso que hoy espera decisión. Un acontecimiento externo con sedes expuestas va primero y no espera turno. */
export function retailPending(templateId: string, seed: string, decisions: readonly RetailDecision[], day: number, aiPick?: string, world?: readonly WorldEpisode[]): RetailPending | null {
  const { state: s, log } = retailAt(templateId, seed, decisions, day, world);
  const ep = openEpisode(world, decisions, s.day);
  if (ep) return viewOf(s, retailWorldCase(s, ep), "acontecimiento externo con sedes expuestas", "motor", worldViewOf(ep, s.day, templateId));
  const last = regularLastDay(decisions);
  const due = s.day - last >= RETAIL_CADENCE;
  if (!due && !(s.liquidity === "crisis" && last < s.day)) return null;
  const n = nextCase(s, log, aiPick);
  return n ? viewOf(s, n.c, n.why, n.source) : null;
}

export function retailDecide(templateId: string, seed: string, decisions: readonly RetailDecision[], day: number, caseId: string, optionId: string, source: "motor" | "ia" = "motor", world?: readonly WorldEpisode[]): { decisions: RetailDecision[]; ok: boolean; reason?: string } {
  const same = [...decisions];
  if (decisions.length && day < decisions.at(-1)!.day) return { decisions: same, ok: false, reason: "No se puede decidir en el pasado." };
  const p = retailPending(templateId, seed, decisions, day, undefined, world);
  if (!p || p.c.id !== caseId) return { decisions: same, ok: false, reason: "Ese caso no está esperando decisión hoy." };
  const s = advanceRetail(retailAt(templateId, seed, decisions, day, world).state, 0);
  const res = decideRetail(s, p.c, optionId, [], source);
  if (!res.ok) return { decisions: same, ok: false, reason: res.reason };
  return { decisions: [...decisions, { caseId, key: `${caseId}@${day}`, optionId, day: Math.floor(day), ...(source === "ia" ? { source } : {}) }], ok: true };
}

export function retailEligibleIds(templateId: string, seed: string, decisions: readonly RetailDecision[], day: number, world?: readonly WorldEpisode[]): string[] {
  const { state, log } = retailAt(templateId, seed, decisions, day, world);
  return rank(state, log).map((x) => x.c.id);
}

// ───────────────────────────────────────────────────────── puente a los 5 indicadores
interface RetailBase { cash: number; outflows: number; ebitdaPct: number; ebitda: number }
const BASES = new Map<string, RetailBase>();
function baseOf(templateId: string): RetailBase {
  const hit = BASES.get(templateId);
  if (hit) return hit;
  const s0 = createRetail(templateId, "base");
  const s = advanceRetail(s0, 12 * MONTH);
  const ms = s.months;
  const sum = (f: (m: RetailState["months"][number]) => number) => ms.reduce((a, m) => a + f(m), 0);
  const b: RetailBase = {
    cash: cashOf(s0),
    outflows: Math.round(sum((m) => m.revenue - m.ebitda) / ms.length),
    ebitdaPct: sum((m) => m.ebitda) / Math.max(1, sum((m) => m.revenue)),
    ebitda: Math.round(sum((m) => m.ebitda) / ms.length),
  };
  BASES.set(templateId, b);
  return b;
}
export interface RetailCause { kpi: KpiKey; points: number; text: string }
const CAP = 30;
const r1 = (x: number) => Math.round(x * 10) / 10;

/** Mismas reglas que la acería: 1 punto de caja = 5 % de un mes de pagos; 1 punto de margen = 0.5 pp de EBITDA. */
export function retailBridge(s: RetailState): { delta: Kpis; causes: RetailCause[] } {
  const B = baseOf(s.templateId);
  const causes: RetailCause[] = [];
  const add = (kpi: KpiKey, p: number, text: string) => { const x = r1(p); if (Math.abs(x) >= 0.5) causes.push({ kpi, points: x, text }); };
  const pt = B.outflows * 0.05;
  const od = overdueTotal(s), debt = debtOf(s);
  add("caja", (cashOf(s) - B.cash) / pt, `Caja de $${fmt(cashOf(s))} contra $${fmt(B.cash)} al llegar (1 punto = $${fmt(pt)}, 5 % de un mes de pagos).`);
  if (od) add("caja", (-od * 1.5) / pt, `Pagos vencidos por $${fmt(od)}: es caja que ya no es tuya, y con recargo.`);
  const T = TEMPLATES_RETAIL[s.templateId];
  const baseDebt = T.debt ? Math.round(T.debt.amount * 100) : 0;
  if (debt > baseDebt) add("caja", -(debt - baseDebt) / pt, `Deuda nueva por $${fmt(debt - baseDebt)} desde tu llegada.`);
  const ms = s.months.slice(-3);
  if (ms.length) {
    const rev = ms.reduce((a, m) => a + m.revenue, 0), eb = ms.reduce((a, m) => a + m.ebitda, 0);
    const pct = rev > 0 ? eb / rev : B.ebitdaPct;
    add("margen", (pct - B.ebitdaPct) / 0.005, `Margen EBITDA de ${(pct * 100).toFixed(1)} % en los últimos ${ms.length === 1 ? "mes" : `${ms.length} meses`} contra ${(B.ebitdaPct * 100).toFixed(1)} % de la operación sin cambios.`);
  }
  add("equipo", (s.relations.staff - 0.8) * 20, `Clima con el personal ${Math.round(s.relations.staff * 100)}/100.`);
  add("equipo", (s.safety - 0.8) * 25, `Cultura de seguridad ${Math.round(s.safety * 100)}/100.`);
  add("equipo", (s.staffing - 0.95) * 60, `${Math.round(s.staffing * 100)} % de los puestos de tienda cubiertos.`);
  if (overdueTotal(s, "personal")) add("equipo", -6, `Sueldos atrasados por $${fmt(overdueTotal(s, "personal"))}.`);
  const recent = s.events.filter((e) => e.day > s.day - 90);
  const inc = recent.filter((e) => e.kind === "seguridad").length;
  if (inc) add("equipo", -4 * inc, `${inc === 1 ? "Un incidente" : `${inc} incidentes`} de seguridad con lesionados en 90 días.`);
  add("clientes", (s.relations.clients - 0.8) * 25, `Relación con clientes ${Math.round(s.relations.clients * 100)}/100 (anaquel lleno y buena atención).`);
  const last = s.months.at(-1);
  if (last && last.fill < 0.97) add("clientes", -(0.97 - last.fill) * 100, `El último mes se vendió ${Math.round(last.fill * 100)} % de lo que pedían los clientes: faltó mercancía.`);
  add("consejo", (s.relations.owner - 0.8) * 25, `Confianza del consejo ${Math.round(s.relations.owner * 100)}/100.`);
  add("consejo", (s.relations.bank - 0.8) * 10, `Relación con el banco ${Math.round(s.relations.bank * 100)}/100.`);
  if (od) add("consejo", -Math.min(8, (od / B.outflows) * 10), `Adeudos vencidos por $${fmt(od)}.`);
  if (s.liquidity === "crisis") add("consejo", -3, "La empresa está en crisis de liquidez.");
  if (ms.length && B.ebitda > 0) { const avg = ms.reduce((a, m) => a + m.ebitda, 0) / ms.length; add("consejo", Math.max(-5, Math.min(5, ((avg - B.ebitda) / B.ebitda) * 5)), `EBITDA mensual promedio de $${fmt(avg)} contra $${fmt(B.ebitda)} de la operación sin cambios.`); }
  const delta = { caja: 0, margen: 0, equipo: 0, clientes: 0, consejo: 0 } as Kpis;
  for (const c of causes) delta[c.kpi] += c.points;
  for (const k of Object.keys(delta) as KpiKey[]) delta[k] = Math.round(Math.max(-CAP, Math.min(CAP, delta[k])));
  return { delta, causes };
}

export const RETAIL_CASE_COUNT = RETAIL_CASES.length;
