/**
 * Evaluación de la IA de episodios (P0-D). Lógica pura: arma las llamadas y mide; la llamada real al modelo
 * se inyecta (`Model`). La usa la ruta `api/ceo/episodio/evaluar` (con permiso de gasto) y las pruebas (modelo falso).
 *
 * Dos conjuntos que nunca se mezclan:
 *  - «dev» (`eval-set.ts`): el que se usó para ajustar los prompts.
 *  - «val» (`eval-validacion.ts`): validación final, frases nuevas que no se usaron para ajustar nada.
 *
 * Mide, por conjunto:
 *  - texto libre: acierto (incluye preguntar cuando es ambigua y no comprometer nada si no responde a la decisión),
 *    consistencia en N corridas, inválidas, decisiones ambiguas comprometidas (meta 0), y adaptación: reacción adaptada
 *    válida, retoma palabras del jugador, tono detectado, propuestas propias reconocidas;
 *  - hechos: acierto, datos equivocados mostrados (un dato real distinto al que pidió) e inventados (meta 0);
 *  - colaborador: pasa la validación automática Y un auditor (otra llamada) confirma que no recomienda opción,
 *    no inventa información y sí responde.
 * Además corre conversaciones guion completas (demostración adaptativa) con el motor real.
 */
import { advisorMessages, decideFrom, factMessages, interpretLocal, interpretMessages, parseAdvisor, parseFact, parseInterpretation, EPISODE_AI_MAX_TOKENS, type Interpretation } from "./ai";
import { EPISODES } from "./catalog";
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { advisorAnswer, applyEpisode, nodeOf, norm, sayOf, startEpisode, strategiesFor } from "./engine";
import { ADVISOR_SET, FACT_SET, INTERPRET_SET } from "./eval-set";
import { ADVISOR_VALIDATION, DEMO_SCRIPTS, FACT_VALIDATION, VALIDATION_SET, type ValItem } from "./eval-validacion";
import { runAt } from "./eval-harness";

export type Msg = { role: "system" | "user"; content: string };
export type Model = (messages: Msg[], maxTokens: number, temperature: number) => Promise<{ content: string; cost: number } | null>;

export const EVAL_REPEATS = 3;
export const EVAL_BUDGET_USD = 0.5;
export type EvalSetId = "dev" | "val";

// ───────────────────────────────────────────── conjuntos unificados
const INTERPRET: Record<EvalSetId, ValItem[]> = {
  dev: INTERPRET_SET.map((x) => ({ ep: x.ep, node: x.node, kind: "clara" as const, expect: x.expect, text: x.text })),
  val: VALIDATION_SET,
};
const FACTS: Record<EvalSetId, { ep: string; q: string; accept: string[]; kind: string }[]> = {
  dev: FACT_SET.map((f) => ({ ep: f.ep, q: f.q, accept: [f.expect], kind: f.expect === "ninguno" ? "ajena" : f.expect.startsWith("?") ? "inexistente" : "dato" })),
  val: FACT_VALIDATION,
};
const ADVISORS: Record<EvalSetId, { ep: string; advisor: string; q: string; kind: string }[]> = {
  dev: ADVISOR_SET.map((a) => ({ ...a, kind: "normal" })),
  val: ADVISOR_VALIDATION,
};
export const evalItem = (set: EvalSetId, i: number) => INTERPRET[set][i];

/** Un trabajo = una unidad que se puede correr en un lote. */
export type EvalJob =
  | { kind: "interpret"; set: EvalSetId; i: number }
  | { kind: "fact"; set: EvalSetId; i: number }
  | { kind: "advisor"; set: EvalSetId; i: number }
  | { kind: "demo"; i: number };
const jobsOf = (set: EvalSetId): EvalJob[] => [
  ...INTERPRET[set].map((_, i) => ({ kind: "interpret" as const, set, i })),
  ...FACTS[set].map((_, i) => ({ kind: "fact" as const, set, i })),
  ...ADVISORS[set].map((_, i) => ({ kind: "advisor" as const, set, i })),
];
export const EVAL_JOBS: EvalJob[] = [...jobsOf("val"), ...DEMO_SCRIPTS.map((_, i) => ({ kind: "demo" as const, i })), ...jobsOf("dev")];
/** Índices de EVAL_JOBS que corre cada botón de la pantalla. */
export const EVAL_SCOPES: Record<"validacion" | "desarrollo", number[]> = {
  validacion: EVAL_JOBS.flatMap((j, k) => (j.kind === "demo" || j.set === "val" ? [k] : [])),
  desarrollo: EVAL_JOBS.flatMap((j, k) => (j.kind !== "demo" && j.set === "dev" ? [k] : [])),
};

/** Lo que se observó en una corrida de texto libre. */
export interface InterpretRun { status: string; strategy: string | null; options?: string[]; extras?: string; tone?: number; adapted: boolean; echoes?: boolean; reply?: string; authored?: string; clarify?: string }
export interface AdvisorAudit { recomienda: boolean; inventa: boolean; responde: boolean; motivo: string }
export interface DemoStep { node: string; stage: string; said: string[]; text: string; status: string; strategy: string; options?: string[]; clarify?: string; extras?: string; tone?: number; reply: string[]; authored: string[]; adapted: boolean; trust: number }
export interface DemoResult { id: string; title: string; ep: string; steps: DemoStep[]; closed: boolean; headline?: string; trust: number; path: string[] }

export interface JobResult {
  kind: EvalJob["kind"]; set?: EvalSetId; i: number; key: string;
  runs?: (InterpretRun | null)[];
  quality?: number[];
  got?: string; raw?: string;
  answer?: string | null; audit?: AdvisorAudit | null;
  demo?: DemoResult;
  calls: number; cost: number;
}

// ───────────────────────────────────────────── texto libre
const STOP = new Set("porque cuando sobre entre hasta desde donde quiero tenemos vamos hacer todos todas nuestro nuestra antes despues tambien ademas mismo misma ahora quiere puede pueden seguir solo".split(" "));
const contentWords = (s: string) => new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOP.has(w)));
/** ¿La reacción adaptada retoma algo concreto del jugador (una palabra suya que no estaba en la respuesta del autor)? */
export function echoesPlayer(player: string, reply: string, authored: string): boolean {
  const p = contentWords(player), a = contentWords(authored);
  for (const w of contentWords(reply)) if (p.has(w) && !a.has(w)) return true;
  return false;
}

function observe(it: Interpretation | null, text: string): InterpretRun | null {
  if (!it) return null;
  return {
    status: it.status, strategy: it.strategy,
    ...(it.options ? { options: it.options } : {}), ...(it.extras ? { extras: it.extras } : {}), ...(it.clarify ? { clarify: it.clarify } : {}),
    ...(it.tone !== undefined ? { tone: it.tone } : {}),
    adapted: !!it.reply,
    ...(it.reply ? { reply: it.reply.join(" "), authored: it.basis, echoes: echoesPlayer(text, it.reply.join(" "), it.basis ?? "") } : {}),
  };
}

async function interpretJob(set: EvalSetId, i: number, model: Model): Promise<JobResult> {
  const it = INTERPRET[set][i];
  const spec = EPISODES[it.ep];
  const run = runAt(spec, it.node, it.expect ?? it.options)!;
  const msgs = interpretMessages(spec, run, nodeOf(spec, run)!, sayOf(spec, run), it.text);
  const runs: (InterpretRun | null)[] = [], quality: number[] = [];
  let cost = 0;
  for (let k = 0; k < EVAL_REPEATS; k++) {
    const r = await model(msgs, EPISODE_AI_MAX_TOKENS.interpret, 0.1);
    cost += r?.cost ?? 0;
    const p = r ? parseInterpretation(spec, run, r.content) : null;
    runs.push(observe(p, it.text));
    if (p && p.status !== "fuera") quality.push(p.quality);
  }
  return { kind: "interpret", set, i, key: `${it.ep}/${it.node}`, runs, quality, calls: EVAL_REPEATS, cost };
}

/** Clase de una corrida para medir consistencia y acierto. */
const label = (r: InterpretRun | null) => (!r ? null : r.status === "ambigua" ? "?ambigua" : r.status === "fuera" ? "fuera" : r.strategy);
const committed = (r: InterpretRun | null) => !!r && (r.status === "clara" || r.status === "parcial") && !!r.strategy;
/** Acierto según el tipo de frase. */
export function correct(it: ValItem, r: InterpretRun | null): boolean {
  if (!r) return false;
  if (it.kind === "ambigua") return r.status === "ambigua";
  if (it.kind === "fuera") return r.status === "fuera";
  return committed(r) && r.strategy === it.expect;
}

// ───────────────────────────────────────────── hechos
async function factJob(set: EvalSetId, i: number, model: Model): Promise<JobResult> {
  const f = FACTS[set][i];
  const spec = EPISODES[f.ep];
  const r = await model(factMessages(spec, f.q), EPISODE_AI_MAX_TOKENS.fact, 0.1);
  const p = r ? parseFact(spec, r.content) : null;
  const got = p ? ("factId" in p ? p.factId : `?${p.unknownId}`) : "ninguno";
  return { kind: "fact", set, i, key: f.ep, got, raw: (r?.content ?? "").slice(0, 80), calls: 1, cost: r?.cost ?? 0 };
}

// ───────────────────────────────────────────── colaborador (+ auditor)
export function auditMessages(spec: EpisodeSpec, advisor: string, knows: string[], question: string, answer: string): Msg[] {
  const options = Object.values(spec.nodes).flatMap((n) => n.strategies.map((s) => `- ${s.text}`)).join("\n");
  return [
    { role: "system", content: [
      "Eres auditor de calidad de un simulador ejecutivo. Revisas la respuesta de un colaborador (personaje) a una pregunta del jugador.",
      "recomienda=true si le dice al jugador qué opción elegir o qué hacer en concreto (aunque sea indirecto: «yo haría…», «lo mejor es…», «deberías…», «sí, avisa»). Explicar riesgos, costos, obligaciones o intereses de su área NO es recomendar.",
      "inventa=true si afirma un hecho, cifra, nombre o dato que no esté en «Lo que sabe» (opiniones y sentimientos propios sí se permiten; decir que no sabe algo también).",
      "responde=true si contesta la pregunta o explica con naturalidad que no lo sabe.",
      'Responde SOLO con JSON: {"recomienda":false,"inventa":false,"responde":true,"motivo":"<máx. 120 caracteres>"}',
    ].join("\n") },
    { role: "user", content: `Caso: ${spec.title}. Colaborador: ${advisor}.\n\nLo que sabe:\n${knows.map((k) => `- ${k}`).join("\n")}\n\nOpciones del caso (no debe recomendar ninguna):\n${options}\n\nPregunta: ${question}\n\nRespuesta: ${answer}` },
  ];
}
export function parseAudit(raw: string): AdvisorAudit | null {
  try {
    const j = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as Record<string, unknown>;
    if (typeof j.recomienda !== "boolean" || typeof j.inventa !== "boolean" || typeof j.responde !== "boolean") return null;
    return { recomienda: j.recomienda, inventa: j.inventa, responde: j.responde, motivo: String(j.motivo ?? "").slice(0, 160) };
  } catch { return null; }
}
async function advisorJob(set: EvalSetId, i: number, model: Model): Promise<JobResult> {
  const a = ADVISORS[set][i];
  const spec = EPISODES[a.ep];
  const brief = spec.advisors.find((x) => x.id === a.advisor)!;
  const authored = advisorAnswer(spec, startEpisode(spec, 0, { runId: "eval" }), brief);
  const r = await model(advisorMessages(spec, brief, authored, a.q), EPISODE_AI_MAX_TOKENS.advisor, 0.5);
  const answer = r ? parseAdvisor(spec, brief, authored, r.content) : null;
  let cost = r?.cost ?? 0, calls = 1, audit: AdvisorAudit | null = null;
  if (answer) {
    const knows = [...spec.facts.facts.filter((f) => brief.knows.includes(f.id) || f.critical).map((f) => f.answer), authored];
    const j = await model(auditMessages(spec, brief.id, knows, a.q, answer), 80, 0);
    cost += j?.cost ?? 0; calls++;
    audit = j ? parseAudit(j.content) : null;
  }
  return { kind: "advisor", set, i, key: `${a.ep}/${a.advisor}`, answer, audit, calls, cost };
}

// ───────────────────────────────────────────── demostración: conversaciones completas
async function demoJob(i: number, model: Model): Promise<JobResult> {
  const d = DEMO_SCRIPTS[i];
  const spec = EPISODES[d.ep];
  // Sin azar: así la diferencia entre guiones sale solo de lo que escribió el jugador.
  let run: EpisodeRun = { ...startEpisode(spec, 0, { runId: `demo-${d.id}` }), flags: [] };
  run = applyEpisode(spec, run, { type: "begin", at: 1 }).run;
  const steps: DemoStep[] = [];
  let cost = 0, calls = 0;
  for (const s of d.steps) {
    const node = nodeOf(spec, run);
    if (!node || run.phase !== "deciding") break;
    const r = await model(interpretMessages(spec, run, node, sayOf(spec, run), s.text), EPISODE_AI_MAX_TOKENS.interpret, 0.1);
    cost += r?.cost ?? 0; calls++;
    let it = (r ? parseInterpretation(spec, run, r.content) : null) ?? interpretLocal(spec, run, s.text);
    const first = it;
    if (it && (it.status === "ambigua" || !it.strategy)) {
      // El jugador aclara eligiendo; queda registrada la pregunta que vio.
      const pick = s.pick && strategiesFor(spec, run).some((x) => x.id === s.pick) ? s.pick : it.options?.[0];
      if (!pick) break;
      it = { strategy: pick, status: "clara", quality: it.quality, feedback: it.feedback };
    }
    if (!it?.strategy) break;
    const said = sayOf(spec, run);
    const a = decideFrom(it, s.text, 2 + run.turns.length);
    if (!a) break;
    const out = applyEpisode(spec, run, a);
    if (out.error) break;
    run = out.run;
    const t = run.turns[run.turns.length - 1];
    steps.push({
      node: node.id, stage: node.stage, said, text: s.text, status: first?.status ?? "respaldo", strategy: t.strategy,
      ...(first?.status === "ambigua" ? { options: first.options, clarify: first.clarify } : {}),
      ...(t.interpretation?.extras ? { extras: t.interpretation.extras } : {}),
      ...(t.interpretation?.tone ? { tone: t.interpretation.tone } : {}),
      reply: t.reply, authored: t.interpretation?.authored ?? t.reply, adapted: !!t.interpretation?.adapted, trust: run.trust,
    });
  }
  const demo: DemoResult = { id: d.id, title: d.title, ep: d.ep, steps, closed: run.phase === "closed", ...(run.outcome ? { headline: run.outcome.headline } : {}), trust: run.trust, path: steps.map((s) => `${s.node}:${s.strategy}`) };
  return { kind: "demo", i, key: d.id, demo, calls, cost };
}

export function runJob(job: EvalJob, model: Model): Promise<JobResult> {
  if (job.kind === "demo") return demoJob(job.i, model);
  if (job.kind === "interpret") return interpretJob(job.set, job.i, model);
  if (job.kind === "fact") return factJob(job.set, job.i, model);
  return advisorJob(job.set, job.i, model);
}

// ───────────────────────────────────────────── reporte
export interface SetReport {
  interpret: {
    total: number; accuracy: number; consistency: number; invalid: number; quality: number;
    byKind: Record<string, { total: number; accuracy: number }>;
    /** Frases ambiguas o fuera de tema que comprometieron una decisión en alguna corrida (meta 0). */
    ambiguousCommitted: number; offTopicCommitted: number;
    /** Frases claras en las que preguntó de más (no compromete nada, pero estorba). */
    overAsked: number;
    adaptive: { replies: number; adapted: number; echoes: number; tone: { total: number; hit: number }; extras: { total: number; hit: number } };
    byNode: Record<string, number>;
    misses: { key: string; kind: string; expect: string; got: string | null; text: string }[];
    samples: { key: string; text: string; authored: string; reply: string }[];
  };
  facts: { total: number; accuracy: number; wrongFact: number; inventedShown: number; inventedRejected: number; byKind: Record<string, { total: number; accuracy: number }>; misses: { q: string; expect: string; got: string }[] };
  advisor: { total: number; valid: number; quality: number; recommends: number; invents: number; byKind: Record<string, { total: number; quality: number }>; misses: { key: string; q: string; answer: string | null; motivo: string }[]; samples: { key: string; q: string; answer: string }[] };
}
export interface EvalReport { dev: SetReport | null; val: SetReport | null; demos: DemoResult[]; calls: number; cost: number }

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
/** Lo más frecuente entre corridas (lo que se habría usado). */
function mode<T>(xs: T[]): T | null { const c = new Map<T, number>(); for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1); return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null; }
const tally = (m: Record<string, { t: number; h: number }>, k: string, ok: boolean) => { const v = (m[k] ??= { t: 0, h: 0 }); v.t++; if (ok) v.h++; };
const fin = (m: Record<string, { t: number; h: number }>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { total: v.t, accuracy: pct(v.h, v.t) }]));

function summarizeSet(set: EvalSetId, results: JobResult[]): SetReport | null {
  const rs = results.filter((r) => r.set === set);
  if (!rs.length) return null;
  const ip = rs.filter((r) => r.kind === "interpret");
  const byNode: Record<string, { t: number; h: number }> = {}, byKind: Record<string, { t: number; h: number }> = {};
  let hit = 0, consistent = 0, invalid = 0, runs = 0, qSum = 0, qN = 0, ambC = 0, offC = 0, over = 0;
  const ad = { replies: 0, adapted: 0, echoes: 0, tone: { total: 0, hit: 0 }, extras: { total: 0, hit: 0 } };
  const misses: SetReport["interpret"]["misses"] = [], samples: SetReport["interpret"]["samples"] = [];
  for (const r of ip) {
    const it = INTERPRET[set][r.i];
    const rr = r.runs ?? [];
    const labels = rr.map(label);
    const m = mode(labels);
    const used = rr.find((x) => label(x) === m) ?? null;
    const ok = correct(it, used);
    if (ok) hit++; else misses.push({ key: r.key, kind: it.kind, expect: it.kind === "ambigua" ? `preguntar (${it.options?.join(" / ")})` : it.kind === "fuera" ? "no comprometer" : it.expect!, got: m, text: it.text });
    tally(byNode, r.key, ok); tally(byKind, it.kind, ok);
    if (labels.every((g) => g === labels[0])) consistent++;
    invalid += rr.filter((x) => x === null).length; runs += rr.length;
    for (const q of r.quality ?? []) { qSum += q; qN++; }
    // Lo grave: comprometer algo que había que preguntar o que no respondía a la decisión (en cualquier corrida).
    if (it.kind === "ambigua" && rr.some(committed)) ambC++;
    if (it.kind === "fuera" && rr.some(committed)) offC++;
    if ((it.kind === "clara" || it.kind === "parcial") && used?.status === "ambigua") over++;
    if (used && committed(used)) {
      ad.replies++;
      if (used.adapted) { ad.adapted++; if (used.echoes) ad.echoes++; if (samples.length < 12 && r.i % 3 === 0) samples.push({ key: r.key, text: it.text, authored: used.authored ?? "", reply: used.reply ?? "" }); }
    }
    if (it.tone) { ad.tone.total++; if (used?.tone === it.tone) ad.tone.hit++; }
    if (it.kind === "parcial") { ad.extras.total++; if (used?.status === "parcial" && used.extras) ad.extras.hit++; }
  }
  const fx = rs.filter((r) => r.kind === "fact");
  const fByKind: Record<string, { t: number; h: number }> = {};
  let fHit = 0, wrong = 0, invRej = 0;
  const fMiss: SetReport["facts"]["misses"] = [];
  for (const r of fx) {
    const f = FACTS[set][r.i];
    const ok = f.accept.includes(r.got!);
    if (ok) fHit++; else fMiss.push({ q: f.q, expect: f.accept.join(" o "), got: r.got! });
    tally(fByKind, f.kind, ok);
    // Dato real equivocado: el jugador vería un dato que no pidió (no inventado, pero desinforma).
    if (!ok && r.got !== "ninguno") wrong++;
    // El modelo devolvió un id que no existe: se rechaza y nunca llega al jugador.
    let rawId = "";
    try { rawId = String((JSON.parse(r.raw ?? "") as { id?: unknown }).id ?? ""); } catch { /* sin JSON */ }
    if (rawId && rawId !== "ninguno" && r.got === "ninguno") invRej++;
  }
  const av = rs.filter((r) => r.kind === "advisor");
  const aByKind: Record<string, { t: number; h: number }> = {};
  let aValid = 0, aQual = 0, rec = 0, inv = 0;
  const aMiss: SetReport["advisor"]["misses"] = [], aSamples: SetReport["advisor"]["samples"] = [];
  for (const r of av) {
    const a = ADVISORS[set][r.i];
    const good = !!r.answer && !!r.audit && !r.audit.recomienda && !r.audit.inventa && r.audit.responde;
    if (r.answer) aValid++;
    if (good) aQual++; else aMiss.push({ key: r.key, q: a.q, answer: r.answer ?? null, motivo: r.answer ? (r.audit?.motivo || "sin auditoría") : "no pasó la validación automática (se usaría el texto del autor)" });
    if (r.audit?.recomienda) rec++;
    if (r.audit?.inventa) inv++;
    tally(aByKind, a.kind, good);
    if (good && r.answer && aSamples.length < 9 && r.i % 3 !== 0) aSamples.push({ key: r.key, q: a.q, answer: r.answer });
  }
  return {
    interpret: {
      total: ip.length, accuracy: pct(hit, ip.length), consistency: pct(consistent, ip.length), invalid: pct(invalid, runs),
      quality: qN ? Math.round((qSum / qN) * 100) / 100 : 0, byKind: fin(byKind),
      ambiguousCommitted: ambC, offTopicCommitted: offC, overAsked: over, adaptive: ad,
      byNode: Object.fromEntries(Object.entries(byNode).map(([k, v]) => [k, pct(v.h, v.t)])), misses, samples,
    },
    // inventedShown es 0 por construcción: el texto del dato siempre sale del banco y un id inexistente se rechaza.
    facts: { total: fx.length, accuracy: pct(fHit, fx.length), wrongFact: wrong, inventedShown: 0, inventedRejected: invRej, byKind: fin(fByKind), misses: fMiss },
    advisor: {
      total: av.length, valid: pct(aValid, av.length), quality: pct(aQual, av.length), recommends: rec, invents: inv,
      byKind: Object.fromEntries(Object.entries(aByKind).map(([k, v]) => [k, { total: v.t, quality: pct(v.h, v.t) }])), misses: aMiss, samples: aSamples,
    },
  };
}

export function summarize(results: JobResult[]): EvalReport {
  return {
    dev: summarizeSet("dev", results),
    val: summarizeSet("val", results),
    demos: results.filter((r) => r.kind === "demo" && r.demo).sort((a, b) => a.i - b.i).map((r) => r.demo!),
    calls: results.reduce((a, r) => a + r.calls, 0),
    cost: Math.round(results.reduce((a, r) => a + r.cost, 0) * 1e6) / 1e6,
  };
}

/** Metas de Oziel (ronda 2). Se juzgan sobre el conjunto de validación final. */
export const EVAL_TARGETS = { accuracy: 95, consistency: 95, invalid: 2, facts: 95, factWrong: 0, inventedShown: 0, advisor: 95, ambiguousCommitted: 0 } as const;
export function passes(r: SetReport): Record<keyof typeof EVAL_TARGETS, boolean> {
  return {
    accuracy: r.interpret.accuracy >= EVAL_TARGETS.accuracy,
    consistency: r.interpret.consistency >= EVAL_TARGETS.consistency,
    invalid: r.interpret.invalid <= EVAL_TARGETS.invalid,
    facts: r.facts.accuracy >= EVAL_TARGETS.facts,
    factWrong: r.facts.wrongFact <= EVAL_TARGETS.factWrong,
    inventedShown: r.facts.inventedShown <= EVAL_TARGETS.inventedShown,
    advisor: r.advisor.quality >= EVAL_TARGETS.advisor,
    ambiguousCommitted: r.interpret.ambiguousCommitted + r.interpret.offTopicCommitted <= EVAL_TARGETS.ambiguousCommitted,
  };
}
