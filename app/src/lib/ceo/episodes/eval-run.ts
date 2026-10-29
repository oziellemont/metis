/**
 * Evaluación de la IA de episodios (P0-D). Lógica pura: arma las llamadas y mide; la llamada real al modelo
 * se inyecta (`Model`). La usa la ruta `api/ceo/episodio/evaluar` (con permiso de gasto) y las pruebas (modelo falso).
 *
 * Mide, sobre el conjunto de `eval-set.ts`:
 *  - texto libre: acierto de la estrategia, consistencia (misma respuesta → misma estrategia en N corridas),
 *    tasa de respuestas inválidas (que caerían al respaldo) y calidad promedio;
 *  - hechos: acierto del id (o «no existe» / «ninguno»);
 *  - colaborador: % de respuestas que pasan la validación (sin cifras nuevas ni recomendar opción).
 */
import { advisorMessages, factMessages, interpretMessages, parseAdvisor, parseFact, parseInterpretation } from "./ai";
import { EPISODES } from "./catalog";
import { advisorAnswer, nodeOf, sayOf, startEpisode } from "./engine";
import { ADVISOR_SET, FACT_SET, INTERPRET_SET } from "./eval-set";
import { runAt } from "./eval-harness";

export type Msg = { role: "system" | "user"; content: string };
export type Model = (messages: Msg[], maxTokens: number, temperature: number) => Promise<{ content: string; cost: number } | null>;

export const EVAL_REPEATS = 3;
export const EVAL_BUDGET_USD = 0.5;

/** Un trabajo = una unidad que se puede correr en un lote. */
export type EvalJob = { kind: "interpret"; i: number } | { kind: "fact"; i: number } | { kind: "advisor"; i: number };
export const EVAL_JOBS: EvalJob[] = [
  ...INTERPRET_SET.map((_, i) => ({ kind: "interpret" as const, i })),
  ...FACT_SET.map((_, i) => ({ kind: "fact" as const, i })),
  ...ADVISOR_SET.map((_, i) => ({ kind: "advisor" as const, i })),
];

export interface JobResult {
  kind: EvalJob["kind"]; i: number; key: string; expect?: string;
  /** Lo que eligió en cada corrida (null = respuesta inválida → respaldo). */
  got: (string | null)[];
  quality?: number[];
  cost: number;
}

async function interpretJob(i: number, model: Model): Promise<JobResult> {
  const it = INTERPRET_SET[i];
  const spec = EPISODES[it.ep];
  const run = runAt(spec, it.node, it.expect)!;
  const msgs = interpretMessages(spec, run, nodeOf(spec, run)!, sayOf(spec, run), it.text);
  const got: (string | null)[] = [], quality: number[] = [];
  let cost = 0;
  for (let k = 0; k < EVAL_REPEATS; k++) {
    const r = await model(msgs, 200, 0.1);
    cost += r?.cost ?? 0;
    const p = r ? parseInterpretation(spec, run, r.content) : null;
    got.push(p?.strategy ?? null);
    if (p) quality.push(p.quality);
  }
  return { kind: "interpret", i, key: `${it.ep}/${it.node}`, expect: it.expect, got, quality, cost };
}

async function factJob(i: number, model: Model): Promise<JobResult> {
  const f = FACT_SET[i];
  const spec = EPISODES[f.ep];
  const r = await model(factMessages(spec, f.q), 40, 0.1);
  const p = r ? parseFact(spec, r.content) : null;
  const got = p ? ("factId" in p ? p.factId : `?${p.unknownId}`) : "ninguno";
  return { kind: "fact", i, key: f.ep, expect: f.expect, got: [got], cost: r?.cost ?? 0 };
}

async function advisorJob(i: number, model: Model): Promise<JobResult> {
  const a = ADVISOR_SET[i];
  const spec = EPISODES[a.ep];
  const brief = spec.advisors.find((x) => x.id === a.advisor)!;
  const authored = advisorAnswer(spec, startEpisode(spec, 0, { runId: "eval" }), brief);
  const r = await model(advisorMessages(spec, brief, authored, a.q), 220, 0.5);
  const ok = r ? parseAdvisor(spec, brief, authored, r.content) : null;
  return { kind: "advisor", i, key: `${a.ep}/${a.advisor}`, got: [ok ? "valida" : null], cost: r?.cost ?? 0 };
}

export function runJob(job: EvalJob, model: Model): Promise<JobResult> {
  if (job.kind === "interpret") return interpretJob(job.i, model);
  if (job.kind === "fact") return factJob(job.i, model);
  return advisorJob(job.i, model);
}

export interface EvalReport {
  interpret: { total: number; accuracy: number; consistency: number; invalid: number; quality: number; byNode: Record<string, number>; misses: { key: string; expect: string; got: string | null; text: string }[] };
  facts: { total: number; accuracy: number; misses: { q: string; expect: string; got: string | null }[] };
  advisor: { total: number; valid: number };
  calls: number; cost: number;
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
/** La estrategia más frecuente entre corridas (la que se habría usado). */
const mode = (xs: (string | null)[]) => { const c = new Map<string | null, number>(); for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1); return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null; };

export function summarize(results: JobResult[]): EvalReport {
  const ip = results.filter((r) => r.kind === "interpret");
  const byNode: Record<string, { t: number; h: number }> = {};
  let hit = 0, consistent = 0, invalid = 0, runs = 0, qSum = 0, qN = 0;
  const misses: EvalReport["interpret"]["misses"] = [];
  for (const r of ip) {
    const m = mode(r.got);
    const n = (byNode[r.key] ??= { t: 0, h: 0 });
    n.t++;
    if (m === r.expect) { hit++; n.h++; } else misses.push({ key: r.key, expect: r.expect!, got: m, text: INTERPRET_SET[r.i].text });
    if (r.got.every((g) => g === r.got[0])) consistent++;
    invalid += r.got.filter((g) => g === null).length; runs += r.got.length;
    for (const q of r.quality ?? []) { qSum += q; qN++; }
  }
  const fx = results.filter((r) => r.kind === "fact");
  const fHit = fx.filter((r) => r.got[0] === r.expect).length;
  const ad = results.filter((r) => r.kind === "advisor");
  return {
    interpret: {
      total: ip.length, accuracy: pct(hit, ip.length), consistency: pct(consistent, ip.length), invalid: pct(invalid, runs),
      quality: qN ? Math.round((qSum / qN) * 100) / 100 : 0,
      byNode: Object.fromEntries(Object.entries(byNode).map(([k, v]) => [k, pct(v.h, v.t)])), misses,
    },
    facts: { total: fx.length, accuracy: pct(fHit, fx.length), misses: fx.filter((r) => r.got[0] !== r.expect).map((r) => ({ q: FACT_SET[r.i].q, expect: r.expect!, got: r.got[0] })) },
    advisor: { total: ad.length, valid: pct(ad.filter((r) => r.got[0]).length, ad.length) },
    calls: ip.length * EVAL_REPEATS + fx.length + ad.length,
    cost: Math.round(results.reduce((a, r) => a + r.cost, 0) * 1e6) / 1e6,
  };
}

/** Umbrales para aprobar la IA (propuesta; los confirma Oziel). */
export const EVAL_TARGETS = { accuracy: 80, consistency: 90, invalid: 5, facts: 85, advisor: 85 } as const;
export function passes(r: EvalReport): Record<keyof typeof EVAL_TARGETS, boolean> {
  return {
    accuracy: r.interpret.accuracy >= EVAL_TARGETS.accuracy,
    consistency: r.interpret.consistency >= EVAL_TARGETS.consistency,
    invalid: r.interpret.invalid <= EVAL_TARGETS.invalid,
    facts: r.facts.accuracy >= EVAL_TARGETS.facts,
    advisor: r.advisor.valid >= EVAL_TARGETS.advisor,
  };
}
