/**
 * Acería v2 · la empresa dentro de la partida.
 *
 * Igual que el motor de crecimiento: en la partida solo se guarda el REGISTRO (plantilla, semilla y decisiones con su
 * día). El estado se reconstruye siempre igual con el motor determinista: crear la empresa, avanzar hasta el día de
 * cada decisión, aplicar la opción con sus comandos, y avanzar hasta hoy.
 *
 * Ritmo: llega un caso cada `CADENCE` días (el selector adaptable elige cuál). Si hay pagos vencidos, el caso de
 * liquidez llega de inmediato. Si la liquidez está en alerta, se ofrece en el siguiente turno.
 */
import { advanceSteel, applySteel, cashOf, createSteel, debtOf, overdueTotal, MONTH, fmt, type SteelState } from "./engine";
import { STEEL_CASES, caseById as steelCaseById, decideSteel, liquidityCase, nextCase, optionCheck, rank, type LogEntry, type SCase } from "./cases";
import { TEMPLATES_V2 } from "./params";
import type { KpiKey, Kpis } from "../../types";
import { caseIdOf, episodeIdOfCase, isWorldCaseId, openEpisode, regularLastDay, timeline, worldSig, worldViewOf, type ExternalHit, type WorldView } from "../../world/episodes";
import { steelImpact, steelWorldCase } from "../../world/cases";
import type { WorldEpisode } from "../../world/types";

export const STEEL_CADENCE = 12;
export const isSteelTemplate = (id: string | undefined | null): boolean => !!id && !!TEMPLATES_V2[id];

export interface SteelDecision { caseId: string; key: string; optionId: string; day: number; source?: "motor" | "ia" }

/** El caso existe (o es un caso de liquidez, que se arma con el estado del día). */
export const isSteelCaseId = (id: string) => /^liq@\d+$/.test(id) || isWorldCaseId(id) || !!steelCaseById(id);

// ───────────────────────────────────────────────────────── reconstrucción
/** `external`: impactos simulados de acontecimientos reales (o ejercicios) que llegaron con fuerza a una sede. */
export interface SteelRebuilt { state: SteelState; log: LogEntry[]; rejected: number; external: ExternalHit[] }
const CACHE = new Map<string, { day: number; r: SteelRebuilt }>();
const CACHE_MAX = 12;
const keyOf = (templateId: string, seed: string, ds: readonly SteelDecision[], world?: readonly WorldEpisode[]) => `${templateId}|${seed}|${ds.map((d) => `${d.caseId}:${d.optionId}@${d.day}`).join(",")}|${worldSig(world)}`;

function resolveCase(s: SteelState, caseId: string, world?: readonly WorldEpisode[]): SCase | null {
  if (caseId.startsWith("liq@")) { const c = liquidityCase(s); return c ? { ...c, id: caseId } : null; }
  if (isWorldCaseId(caseId)) { const ep = world?.find((e) => e.id === episodeIdOfCase(caseId)); return ep ? steelWorldCase(s, ep) : null; }
  return steelCaseById(caseId) ?? null;
}

/** Estado de la acería en el día `day`. Las decisiones que ya no proceden se descartan y se cuentan. */
export function steelAt(templateId: string, seed: string, decisions: readonly SteelDecision[], day: number, world?: readonly WorldEpisode[]): SteelRebuilt {
  const key = keyOf(templateId, seed, decisions, world);
  const target = Math.max(0, Math.floor(day));
  const hit = CACHE.get(key);
  if (hit && hit.day === target) return hit.r;
  const steps = timeline(decisions, world, target);
  const lastStep = steps.at(-1)?.day ?? -1;
  let r: SteelRebuilt;
  if (hit && hit.day < target && hit.day >= lastStep) {
    r = { state: advanceSteel(hit.r.state, target - hit.r.state.day), log: hit.r.log, rejected: hit.r.rejected, external: hit.r.external };
  } else {
    let s = createSteel(templateId, seed);
    const log: LogEntry[] = [];
    const external: ExternalHit[] = [];
    const chosen = new Map<string, string>();
    let rejected = 0;
    for (const st of steps) {
      if (st.day > s.day) s = advanceSteel(s, st.day - s.day);
      if (st.ep) {
        const imp = steelImpact(s, st.ep, chosen.get(st.ep.id) ?? null);
        const done: string[] = [];
        for (const cmd of imp.commands) if (applySteel(s, cmd).ok) done.push(`${cmd.type}:${cmd.id}`);
        s.events.push({ day: s.day, kind: "mundo", text: imp.text, ref: caseIdOf(st.ep) });
        external.push({ id: st.ep.id, day: s.day, text: imp.text, mode: st.ep.mode, commands: done, ...(imp.parts ? { parts: imp.parts } : {}), ...(st.ep.rv ? { rv: st.ep.rv } : {}) });
        continue;
      }
      const d = st.d!;
      const c = resolveCase(s, d.caseId, world);
      const res = c ? decideSteel(s, c, d.optionId, log, d.source ?? "motor") : { ok: false };
      if (!res.ok) rejected++;
      else if (isWorldCaseId(d.caseId)) chosen.set(episodeIdOfCase(d.caseId), d.optionId);
    }
    if (target > s.day) s = advanceSteel(s, target - s.day);
    r = { state: s, log, rejected, external };
  }
  CACHE.delete(key);
  CACHE.set(key, { day: target, r });
  while (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
  return r;
}

// ───────────────────────────────────────────────────────── casos pendientes
export interface SteelOptionView { id: string; label: string; detail: string; stance: string; ok: boolean; reason?: string; blocked: boolean }
export interface SteelPending { c: SCase; subject: string; from: string; body: string[]; data: [string, string][]; lesson: string; options: SteelOptionView[]; why: string; source: "motor" | "ia"; world?: WorldView }

function viewOf(s: SteelState, c: SCase, why: string, source: "motor" | "ia", world?: WorldView): SteelPending {
  const people = TEMPLATES_V2[s.templateId].people;
  return {
    c, subject: c.subject, from: people[c.from] ?? c.from, body: c.body(s), data: c.data ? c.data(s) : [], lesson: c.lesson, why, source, ...(world ? { world } : {}),
    options: c.options.map((o) => { const chk = optionCheck(s, o); return { id: o.id, label: o.label, detail: o.detail(s), stance: o.stance, ok: chk.ok, reason: chk.reason, blocked: !!o.blocked }; }),
  };
}

/** El caso que hoy espera decisión (uno a la vez), o null. Un acontecimiento externo con sedes expuestas va primero. */
export function steelPending(templateId: string, seed: string, decisions: readonly SteelDecision[], day: number, aiPick?: string, world?: readonly WorldEpisode[]): SteelPending | null {
  const { state: s, log } = steelAt(templateId, seed, decisions, day, world);
  const ep = openEpisode(world, decisions, s.day);
  if (ep) return viewOf(s, steelWorldCase(s, ep), "acontecimiento externo con sedes expuestas", "motor", worldViewOf(ep, s.day, templateId));
  const last = regularLastDay(decisions);
  const due = s.day - last >= STEEL_CADENCE;
  // Pagos vencidos: el caso de liquidez no espera turno (salvo que se acabe de decidir uno hoy).
  if (!due && !(s.liquidity === "crisis" && last < s.day)) return null;
  const n = nextCase(s, log, aiPick);
  return n ? viewOf(s, n.c, n.why, n.source) : null;
}

/** Decide el caso pendiente. Devuelve la lista nueva, o la misma con la razón si no procede. */
export function steelDecide(templateId: string, seed: string, decisions: readonly SteelDecision[], day: number, caseId: string, optionId: string, source: "motor" | "ia" = "motor", world?: readonly WorldEpisode[]): { decisions: SteelDecision[]; ok: boolean; reason?: string } {
  const same = [...decisions];
  if (decisions.length && day < decisions.at(-1)!.day) return { decisions: same, ok: false, reason: "No se puede decidir en el pasado." };
  const p = steelPending(templateId, seed, decisions, day, undefined, world);
  if (!p || p.c.id !== caseId) return { decisions: same, ok: false, reason: "Ese caso no está esperando decisión hoy." };
  const s = advanceSteel(steelAt(templateId, seed, decisions, day, world).state, 0);
  const res = decideSteel(s, p.c, optionId, [], source);
  if (!res.ok) return { decisions: same, ok: false, reason: res.reason };
  return { decisions: [...decisions, { caseId, key: `${caseId}@${day}`, optionId, day: Math.floor(day), ...(source === "ia" ? { source } : {}) }], ok: true };
}

/** Casos que el selector consideraría hoy, en su orden (para la IA: solo puede elegir de esta lista). */
export function steelEligibleIds(templateId: string, seed: string, decisions: readonly SteelDecision[], day: number, world?: readonly WorldEpisode[]): string[] {
  const { state, log } = steelAt(templateId, seed, decisions, day, world);
  return rank(state, log).map((x) => x.c.id);
}

// ───────────────────────────────────────────────────────── puente a los 5 indicadores
interface SteelBase { cash: number; outflows: number; ebitdaPct: number; ebitda: number }
const BASES = new Map<string, SteelBase>();
function baseOf(templateId: string): SteelBase {
  const hit = BASES.get(templateId);
  if (hit) return hit;
  const s0 = createSteel(templateId, "base");
  const s = advanceSteel(s0, 12 * MONTH);
  const ms = s.months;
  const sum = (f: (m: SteelState["months"][number]) => number) => ms.reduce((a, m) => a + f(m), 0);
  const b: SteelBase = {
    cash: cashOf(s0),
    outflows: Math.round(sum((m) => m.revenue - m.ebitda) / ms.length),
    ebitdaPct: sum((m) => m.ebitda) / Math.max(1, sum((m) => m.revenue)),
    ebitda: Math.round(sum((m) => m.ebitda) / ms.length),
  };
  BASES.set(templateId, b);
  return b;
}
export interface SteelCause { kpi: KpiKey; points: number; text: string }
const CAP = 30;
const r1 = (x: number) => Math.round(x * 10) / 10;

/** Mismas reglas que el puente del motor de crecimiento: 1 punto de caja = 5 % de un mes de pagos; 1 de margen = 0.5 pts. */
export function steelBridge(s: SteelState): { delta: Kpis; causes: SteelCause[] } {
  const B = baseOf(s.templateId);
  const causes: SteelCause[] = [];
  const add = (kpi: KpiKey, p: number, text: string) => { const x = r1(p); if (Math.abs(x) >= 0.5) causes.push({ kpi, points: x, text }); };
  const pt = B.outflows * 0.05;
  const od = overdueTotal(s), debt = debtOf(s);
  add("caja", (cashOf(s) - B.cash) / pt, `Caja de $${fmt(cashOf(s))} contra $${fmt(B.cash)} al llegar (1 punto = $${fmt(pt)}, 5 % de un mes de pagos).`);
  if (od) add("caja", (-od * 1.5) / pt, `Pagos vencidos por $${fmt(od)}: es caja que ya no es tuya, y con recargo.`);
  const baseDebt = TEMPLATES_V2[s.templateId].debt ? Math.round(TEMPLATES_V2[s.templateId].debt!.amount * 100) : 0;
  if (debt > baseDebt) add("caja", -(debt - baseDebt) / pt, `Deuda nueva por $${fmt(debt - baseDebt)} desde tu llegada.`);
  const ms = s.months.slice(-3);
  if (ms.length) {
    const rev = ms.reduce((a, m) => a + m.revenue, 0), eb = ms.reduce((a, m) => a + m.ebitda, 0);
    const pct = rev > 0 ? eb / rev : B.ebitdaPct;
    add("margen", (pct - B.ebitdaPct) / 0.005, `Margen EBITDA de ${(pct * 100).toFixed(1)} % en los últimos ${ms.length === 1 ? "mes" : `${ms.length} meses`} contra ${(B.ebitdaPct * 100).toFixed(1)} % de la operación sin cambios.`);
  }
  add("equipo", (s.relations.staff - 0.8) * 20, `Clima con el personal ${Math.round(s.relations.staff * 100)}/100.`);
  add("equipo", (s.safety - 0.8) * 25, `Cultura de seguridad ${Math.round(s.safety * 100)}/100.`);
  if (overdueTotal(s, "personal")) add("equipo", -6, `Sueldos atrasados por $${fmt(overdueTotal(s, "personal"))}.`);
  const recent = s.events.filter((e) => e.day > s.day - 90);
  const inc = recent.filter((e) => e.kind === "seguridad").length;
  if (inc) add("equipo", -4 * inc, `${inc === 1 ? "Un incidente" : `${inc} incidentes`} de seguridad en 90 días.`);
  add("clientes", (s.relations.clients - 0.8) * 25, `Relación con clientes ${Math.round(s.relations.clients * 100)}/100 (entregas completas y calidad).`);
  const last = s.months.at(-1);
  if (last && last.tonsDemand > 0 && last.tonsShort > 0) add("clientes", -(last.tonsShort / last.tonsDemand) * 50, `${((100 * last.tonsShort) / last.tonsDemand).toFixed(1)} % de lo pedido el último mes no se entregó.`);
  const lost = recent.filter((e) => e.kind === "cancelacion").length;
  if (lost) add("clientes", -5 * lost, `${lost === 1 ? "Un cliente canceló" : `${lost} clientes cancelaron`} su contrato.`);
  add("consejo", (s.relations.owner - 0.8) * 25, `Confianza del dueño ${Math.round(s.relations.owner * 100)}/100.`);
  add("consejo", (s.relations.bank - 0.8) * 10, `Relación con el banco ${Math.round(s.relations.bank * 100)}/100.`);
  if (od) add("consejo", -Math.min(8, (od / B.outflows) * 10), `Adeudos vencidos por $${fmt(od)}.`);
  if (s.liquidity === "crisis") add("consejo", -3, "La empresa está en crisis de liquidez.");
  if (ms.length && B.ebitda > 0) { const avg = ms.reduce((a, m) => a + m.ebitda, 0) / ms.length; add("consejo", Math.max(-5, Math.min(5, ((avg - B.ebitda) / B.ebitda) * 5)), `EBITDA mensual promedio de $${fmt(avg)} contra $${fmt(B.ebitda)} de la operación sin cambios.`); }
  const delta = { caja: 0, margen: 0, equipo: 0, clientes: 0, consejo: 0 } as Kpis;
  for (const c of causes) delta[c.kpi] += c.points;
  for (const k of Object.keys(delta) as KpiKey[]) delta[k] = Math.round(Math.max(-CAP, Math.min(CAP, delta[k])));
  return { delta, causes };
}

export const STEEL_CASE_COUNT = STEEL_CASES.length;
