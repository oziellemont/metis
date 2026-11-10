/**
 * MÊTIS Assess v1 · catálogo de casos y consecuencias calculadas por el motor.
 *
 * Reglas:
 *  - Solo dos industrias, las mejor desarrolladas del motor: cadena de conveniencia y acería. No se abren otras.
 *  - Todos los candidatos de una industria enfrentan EXACTAMENTE la misma empresa, el mismo día y los mismos casos
 *    (semilla fija). Cada caso se evalúa desde la misma foto: una decisión no cambia el caso siguiente, para comparar
 *    a todos con el mismo criterio.
 *  - Las consecuencias de cada opción las calcula el motor de MÊTIS (los mismos comandos del simulador), nunca una IA.
 *  - Es un módulo aparte de MÊTIS CEO: solo LEE los motores; no toca partidas, jugadores ni avisos.
 */
import { createRetail, runRetail, advanceRetail, applyRetail, cashOf as rCash, balanceSheet as rBS, type RetailState } from "@/lib/ceo/growth/retail/engine";
import { RETAIL_CASES, AREA_LABEL as R_AREA, optionCheck as rCheck, type RCase } from "@/lib/ceo/growth/retail/cases";
import { TEMPLATES_RETAIL } from "@/lib/ceo/growth/retail/params";
import { createSteel, runSteel, advanceSteel, applySteel, cashOf as sCash, balanceSheet as sBS, type SteelState } from "@/lib/ceo/growth/steel/engine";
import { STEEL_CASES, AREA_LABEL as S_AREA, optionCheck as sCheck, type SCase } from "@/lib/ceo/growth/steel/cases";
import { TEMPLATES_V2 } from "@/lib/ceo/growth/steel/params";

export const ASSESS_VERSION = 1;
/** Mientras sea false, todo resultado se marca como piloto y no debe usarse para decidir contrataciones. */
export const ASSESS_VALIDATED = false;
export const PILOT_NOTICE = "Piloto en validación. No usar para decidir contrataciones: los resultados solo apoyan una revisión humana.";

export type Industry = "retail" | "acero";
export const INDUSTRY_IDS: readonly Industry[] = ["retail", "acero"];
export const isIndustry = (x: unknown): x is Industry => x === "retail" || x === "acero";

export type Competency = "finanzas" | "liquidez" | "personas" | "relaciones" | "estrategia";
export const COMPETENCY_IDS: readonly Competency[] = ["finanzas", "liquidez", "personas", "relaciones", "estrategia"];
export const isCompetency = (x: unknown): x is Competency => typeof x === "string" && (COMPETENCY_IDS as readonly string[]).includes(x);

/** Las mismas cinco competencias y la misma forma de medirlas en las dos industrias. */
export const COMPETENCIES: Readonly<Record<Competency, { label: string; how: string }>> = Object.freeze({
  finanzas: { label: "Criterio financiero", how: "Patrimonio de la empresa seis meses después de la decisión, comparado con las otras alternativas del mismo caso." },
  liquidez: { label: "Cuidado de la caja", how: "Caja más baja durante los seis meses siguientes: quien protege la liquidez evita quedarse sin dinero para operar." },
  personas: { label: "Personas y seguridad", how: "Índice de seguridad y clima laboral seis meses después, más el efecto directo que la regla del motor asigna a la opción. Las opciones que ponen en riesgo a la gente están bloqueadas." },
  relaciones: { label: "Clientes y proveedores", how: "Relación con clientes y proveedores seis meses después, más el efecto directo que la regla del motor asigna a la opción." },
  estrategia: { label: "Visión de largo plazo", how: "Patrimonio doce meses después: separa lo que se ve bien hoy de lo que conviene en el año." },
});

/** Qué competencias puede medir cada área (igual criterio en ambas industrias). Solo cuentan si las opciones de verdad difieren. */
const AREA_COMP: Readonly<Record<string, readonly Competency[]>> = Object.freeze({
  operacion: ["finanzas", "liquidez", "estrategia"],
  abasto: ["finanzas", "relaciones", "estrategia"],
  chatarra: ["finanzas", "liquidez", "relaciones"],
  personal: ["personas", "finanzas", "estrategia"],
  seguridad: ["personas", "finanzas", "liquidez"],
  comercial: ["relaciones", "finanzas", "estrategia", "liquidez"],
  clientes: ["relaciones", "liquidez", "finanzas"],
  calidad: ["relaciones", "finanzas", "estrategia"],
  energia: ["finanzas", "liquidez", "estrategia"],
  expansion: ["estrategia", "liquidez", "finanzas"],
  capacidad: ["estrategia", "liquidez", "relaciones", "finanzas"],
  finanzas: ["liquidez", "finanzas", "estrategia"],
  estrategia: ["estrategia", "finanzas", "relaciones"],
});

export interface IndustryDef { id: Industry; label: string; company: string; summary: string; templateId: string; seed: string; day: number; caseIds: readonly string[] }
export const INDUSTRIES: Readonly<Record<Industry, IndustryDef>> = Object.freeze({
  retail: {
    id: "retail", label: "Retail · cadena de conveniencia", templateId: "conveniencia_regional_v2", seed: "assess-v1", day: 150,
    company: TEMPLATES_RETAIL.conveniencia_regional_v2.name, summary: TEMPLATES_RETAIL.conveniencia_regional_v2.summary,
    caseIds: ["op_frio", "ab_refresquera", "pe_rotacion", "se_noche", "co_comida", "ex_aperturas", "fi_refinancia", "es_competidor"],
  },
  acero: {
    id: "acero", label: "Acero · acería compacta", templateId: "aceria_compacta_v2", seed: "assess-v1", day: 150,
    company: TEMPLATES_V2.aceria_compacta_v2.name, summary: TEMPLATES_V2.aceria_compacta_v2.summary,
    caseIds: ["op_refractario", "op_predictivo", "ch_alza", "cl_60dias", "ca_reclamo", "en_punta", "se_casi", "cap_pedidos"],
  },
});

// ───────────────────────────────────────────────────────── vista del candidato
export interface OptionView { id: string; label: string; detail: string; blocked?: string; unavailable?: string }
export interface CaseView { id: string; area: string; subject: string; body: string[]; data: [string, string][]; options: OptionView[] }

/** Orden estable de opciones (el mismo para todos, distinto del orden en que se escribieron). */
function rand01(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return ((h >>> 0) % 100000) / 100000;
}
const shuffle = <T extends { id: string }>(caseId: string, xs: T[]) => [...xs].sort((a, b) => rand01(`assess|${caseId}|${a.id}`) - rand01(`assess|${caseId}|${b.id}`));

// ───────────────────────────────────────────────────────── consecuencias por opción
export interface Metrics { equity6: number; minCash6: number; people6: number; relations6: number; equity12: number; safety6: number; staff6: number }
export interface OptionOutcome { optionId: string; label: string; stance: "prudente" | "equilibrada" | "arriesgada"; available: boolean; reason?: string; metrics: Metrics | null }
export interface CaseOutcome { caseId: string; subject: string; area: string; lesson: string; measures: Competency[]; options: OptionOutcome[] }

const METRIC_OF: Readonly<Record<Competency, keyof Metrics>> = Object.freeze({ finanzas: "equity6", liquidez: "minCash6", personas: "people6", relaciones: "relations6", estrategia: "equity12" });
export const metricOf = (k: Competency) => METRIC_OF[k];

/** Diferencia mínima para decir que las opciones de un caso SÍ difieren en esa competencia. */
function threshold(k: Competency, base: Metrics): number {
  if (k === "finanzas" || k === "estrategia") return Math.max(10_000_00, Math.abs(base.equity6) * 0.0015);
  if (k === "liquidez") return Math.max(50_000_00, Math.abs(base.minCash6) * 0.01);
  return 0.004;
}

interface Engine<S, C> {
  snapshot: () => S;
  cases: readonly C[];
  caseOf: (c: C) => RCase | SCase;
  check: (s: S, o: RCase["options"][number] | SCase["options"][number]) => { ok: boolean; reason?: string };
  apply: (s: S, c: C, optionId: string) => { ok: boolean; reason?: string };
  advance: (s: S, days: number) => S;
  read: (s: S) => { equity: number; cash: number; safety: number; staff: number; clients: number; suppliers: number };
  area: (c: C) => string;
}

const retailEngine = (def: IndustryDef): Engine<RetailState, RCase> => ({
  snapshot: () => runRetail(createRetail(def.templateId, def.seed), def.day),
  cases: RETAIL_CASES,
  caseOf: (c) => c,
  check: (s, o) => rCheck(s, o as RCase["options"][number]),
  apply: (s, c, optionId) => {
    const o = c.options.find((x) => x.id === optionId);
    if (!o) return { ok: false, reason: "Opción desconocida." };
    for (const cmd of o.commands(s, `assess:${c.id}`)) { const r = applyRetail(s, cmd); if (!r.ok) return r; }
    return { ok: true };
  },
  advance: (s, d) => advanceRetail(s, d),
  read: (s) => ({ equity: rBS(s).equity, cash: rCash(s), safety: s.safety, staff: s.relations.staff, clients: s.relations.clients, suppliers: s.relations.suppliers }),
  area: (c) => R_AREA[c.area],
});

const steelEngine = (def: IndustryDef): Engine<SteelState, SCase> => ({
  snapshot: () => runSteel(createSteel(def.templateId, def.seed), def.day),
  cases: STEEL_CASES,
  caseOf: (c) => c,
  check: (s, o) => sCheck(s, o as SCase["options"][number]),
  apply: (s, c, optionId) => {
    const o = c.options.find((x) => x.id === optionId);
    if (!o) return { ok: false, reason: "Opción desconocida." };
    for (const cmd of o.commands(s, `assess:${c.id}`)) { const r = applySteel(s, cmd); if (!r.ok) return r; }
    return { ok: true };
  },
  advance: (s, d) => advanceSteel(s, d),
  read: (s) => ({ equity: sBS(s).equity, cash: sCash(s), safety: s.safety, staff: s.relations.staff, clients: s.relations.clients, suppliers: s.relations.suppliers }),
  area: (c) => S_AREA[c.area],
});

/**
 * Efecto directo que la regla del motor declara para la opción (comandos «safety» y «relation», incluidos los diferidos).
 * Los índices del motor tienen tope (1.0): sin esto, dos opciones distintas se verían iguales cuando el índice ya está arriba.
 */
type Cmd = { type: string; delta?: number; key?: string; cmd?: Cmd };
export function declaredDeltas(cmds: readonly Cmd[]): { people: number; relations: number } {
  let people = 0, relations = 0;
  const walk = (c: Cmd) => {
    if (c.type === "later" && c.cmd) return walk(c.cmd);
    if (c.type === "safety") people += c.delta ?? 0;
    if (c.type === "relation" && c.key === "staff") people += c.delta ?? 0;
    if (c.type === "relation" && (c.key === "clients" || c.key === "suppliers")) relations += c.delta ?? 0;
  };
  cmds.forEach(walk);
  return { people, relations };
}

function runOption<S, C>(e: Engine<S, C>, snap: S, c: C | null, optionId: string | null): Metrics | null {
  let s = e.advance(snap, 0);
  let d = { people: 0, relations: 0 };
  if (c && optionId) {
    const o = (e.caseOf(c).options as { id: string; commands: (s: never, k: string) => Cmd[] }[]).find((x) => x.id === optionId);
    if (o) d = declaredDeltas(o.commands(s as never, "assess:d"));
    const r = e.apply(s, c, optionId); if (!r.ok) return null;
  }
  let minCash = Infinity;
  let at6: ReturnType<Engine<S, C>["read"]> | null = null;
  for (let m = 1; m <= 12; m++) {
    s = e.advance(s, 30);
    const r = e.read(s);
    if (m <= 6) minCash = Math.min(minCash, r.cash);
    if (m === 6) at6 = r;
  }
  const end = e.read(s);
  const a = at6!;
  return { equity6: a.equity, minCash6: minCash, people6: a.safety + a.staff + d.people, relations6: a.clients + a.suppliers + d.relations, equity12: end.equity, safety6: a.safety, staff6: a.staff };
}

interface Built { def: IndustryDef; views: CaseView[]; outcomes: CaseOutcome[]; base: Metrics }
const memo = new Map<Industry, Built>();

function buildWith<S, C extends { id: string; area: string }>(def: IndustryDef, e: Engine<S, C>): Built {
  const snap = e.snapshot();
  const base = runOption(e, snap, null, null)!;
  const views: CaseView[] = [];
  const outcomes: CaseOutcome[] = [];
  for (const id of def.caseIds) {
    const c = e.cases.find((x) => x.id === id);
    if (!c) throw new Error(`Assess: el caso ${id} no existe en ${def.id}`);
    const rc = e.caseOf(c);
    const options: OptionOutcome[] = rc.options.map((o) => {
      const chk = e.check(snap, o);
      const metrics = chk.ok ? runOption(e, snap, c, o.id) : null;
      return { optionId: o.id, label: o.label, stance: o.stance, available: chk.ok && !!metrics, reason: chk.ok ? (metrics ? undefined : "El motor no pudo aplicar la opción.") : chk.reason, metrics };
    });
    const live = options.filter((o) => o.available && o.metrics);
    // Mismo criterio en ambas industrias: el área define qué se mide; todo caso de seguridad mide además «personas».
    const declared = [...new Set([...(AREA_COMP[c.area] ?? []), ...(rc.safety ? (["personas"] as const) : [])])];
    const measures = declared.filter((k) => {
      const vals = live.map((o) => o.metrics![METRIC_OF[k]]);
      return vals.length >= 2 && Math.max(...vals) - Math.min(...vals) >= threshold(k, base);
    });
    outcomes.push({ caseId: c.id, subject: rc.subject, area: e.area(c), lesson: rc.lesson, measures, options });
    const s = snap as unknown as never;
    views.push({
      id: c.id, area: e.area(c), subject: rc.subject,
      body: (rc.body as (x: never) => string[])(s),
      data: rc.data ? (rc.data as (x: never) => [string, string][])(s) : [],
      options: shuffle(c.id, rc.options.map((o): OptionView => {
        const out = options.find((x) => x.optionId === o.id)!;
        if (o.blocked) return { id: o.id, label: o.label, detail: "", blocked: o.blocked };
        return { id: o.id, label: o.label, detail: (o.detail as (x: never) => string)(s), ...(out.available ? {} : { unavailable: out.reason ?? "No disponible." }) };
      })),
    });
  }
  return { def, views, outcomes, base };
}

export function industryData(ind: Industry): Built {
  const hit = memo.get(ind);
  if (hit) return hit;
  const def = INDUSTRIES[ind];
  const b = ind === "retail" ? buildWith(def, retailEngine(def)) : buildWith(def, steelEngine(def));
  memo.set(ind, b);
  return b;
}

export const caseViews = (ind: Industry): CaseView[] => industryData(ind).views;
export const caseOutcomes = (ind: Industry): CaseOutcome[] => industryData(ind).outcomes;
/** Competencias que esta industria mide con al menos dos casos. Solo esas se pueden pedir en una vacante. */
export const MIN_CASES_PER_COMP = 2;
export const measurable = (ind: Industry): Competency[] => COMPETENCY_IDS.filter((k) => caseOutcomes(ind).filter((c) => c.measures.includes(k)).length >= MIN_CASES_PER_COMP);
export const outcomeOf = (ind: Industry, caseId: string) => caseOutcomes(ind).find((c) => c.caseId === caseId) ?? null;
