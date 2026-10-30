/**
 * Evaluación de la IA de episodios (P0-D). Lógica pura: corre EXACTAMENTE la misma tubería que producción
 * (`runInterpret`, `runAdapt`, `runFact`, `runAdvisor` de `ai.ts`) con la llamada real inyectada (`Model`) y mide.
 * La usa la ruta `api/ceo/episodio/evaluar` (con permiso de gasto) y las pruebas (modelo falso).
 *
 * Dos conjuntos que nunca se mezclan:
 *  - «dev»: `eval-set.ts` + `eval-dev-ronda2.ts` + `eval-dev-ronda3.ts` + `eval-dev-ronda4.ts` (lo que se usó para
 *    ajustar los prompts, incluidas las validaciones de las rondas 2 a 4).
 *  - «val» (`eval-validacion.ts`): validación final de la ronda 5, frases nuevas que no se usaron para ajustar nada.
 *
 * Mide, por conjunto:
 *  - texto libre: acierto (incluye preguntar cuando es ambigua y no comprometer nada si no responde a la decisión),
 *    consistencia en N corridas, inválidas, decisiones ambiguas comprometidas (meta 0), tono (con cita), y la
 *    adaptación real: la segunda llamada reescribe la respuesta del motor; se mide si pasó la regla de fidelidad,
 *    si retoma palabras del jugador y un auditor revisa que no cambie el desenlace ni agregue hechos;
 *  - hechos: acierto, datos equivocados mostrados e inventados (meta 0);
 *  - colaborador: pasa la validación automática (con su reintento) Y un auditor confirma que no recomienda, no
 *    inventa y sí responde.
 * Además corre conversaciones guion completas (demostración adaptativa) con el motor real y la misma tubería.
 */
import { clarified, decideFrom, interpretLocal, runAdapt, runAdvisor, runFact, runInterpret, sameAsAuthored, type AdvisorReject, type Call, type Interpretation, type Msg } from "./ai";
import { EPISODES } from "./catalog";
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { advisorAnswer, applyEpisode, nodeOf, norm, sayOf, startEpisode } from "./engine";
import { ADVISOR_SET, FACT_SET, INTERPRET_SET } from "./eval-set";
import { DEV2_ADVISOR, DEV2_DEMOS, DEV2_FACTS, DEV2_INTERPRET } from "./eval-dev-ronda2";
import { DEV3_ADVISOR, DEV3_FACTS, DEV3_INTERPRET } from "./eval-dev-ronda3";
import { DEV4_ADVISOR, DEV4_FACTS, DEV4_INTERPRET } from "./eval-dev-ronda4";
import { ADVISOR_VALIDATION, DEMO_SCRIPTS, FACT_VALIDATION, VALIDATION_SET, type ValItem } from "./eval-validacion";
import { runAt } from "./eval-harness";

export type { Msg };
export type Model = (messages: Msg[], maxTokens: number, temperature: number) => Promise<{ content: string; cost: number } | null>;

export const EVAL_REPEATS = 3;
/** En desarrollo cada respuesta se corre menos veces (el conjunto ya es grande y cuida el tope de gasto). */
export const DEV_REPEATS = 2;
export const repeatsOf = (set: EvalSetId) => (set === "val" ? EVAL_REPEATS : DEV_REPEATS);
export const EVAL_BUDGET_USD = 0.5;
/** En desarrollo se adapta una de cada N respuestas (en validación, todas). */
export const DEV_ADAPT_EVERY = 3;
export type EvalSetId = "dev" | "val";

// ───────────────────────────────────────────── conjuntos unificados
const INTERPRET: Record<EvalSetId, ValItem[]> = {
  dev: [...INTERPRET_SET.map((x) => ({ ep: x.ep, node: x.node, kind: "clara" as const, expect: x.expect, text: x.text })), ...DEV2_INTERPRET, ...DEV3_INTERPRET, ...DEV4_INTERPRET],
  val: VALIDATION_SET,
};
type FactItem = { ep: string; q: string; accept: string[]; kind: string };
const FACTS: Record<EvalSetId, FactItem[]> = {
  dev: [...FACT_SET.map((f) => ({ ep: f.ep, q: f.q, accept: [f.expect], kind: f.expect === "ninguno" ? "ajena" : f.expect.startsWith("?") ? "inexistente" : "dato" })), ...DEV2_FACTS, ...DEV3_FACTS, ...DEV4_FACTS],
  val: FACT_VALIDATION,
};
const ADVISORS: Record<EvalSetId, { ep: string; advisor: string; q: string; kind: string }[]> = {
  dev: [...ADVISOR_SET.map((a) => ({ ...a, kind: "normal" })), ...DEV2_ADVISOR, ...DEV3_ADVISOR, ...DEV4_ADVISOR],
  val: ADVISOR_VALIDATION,
};
/** Guiones: los de validación se muestran; los de la ronda 2 quedan como desarrollo (no se corren por defecto). */
export const DEMOS = DEMO_SCRIPTS;
export const DEV_DEMOS = DEV2_DEMOS;
export const evalItem = (set: EvalSetId, i: number) => INTERPRET[set][i];
export const evalSizes = (set: EvalSetId) => ({ interpret: INTERPRET[set].length, facts: FACTS[set].length, advisor: ADVISORS[set].length });

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
export const EVAL_JOBS: EvalJob[] = [...jobsOf("val"), ...DEMOS.map((_, i) => ({ kind: "demo" as const, i })), ...jobsOf("dev")];
/** Índices de EVAL_JOBS que corre cada botón de la pantalla. */
export const EVAL_SCOPES: Record<"validacion" | "desarrollo", number[]> = {
  validacion: EVAL_JOBS.flatMap((j, k) => (j.kind === "demo" || j.set === "val" ? [k] : [])),
  desarrollo: EVAL_JOBS.flatMap((j, k) => (j.kind !== "demo" && j.set === "dev" ? [k] : [])),
};

/** Lo que se observó en una corrida de texto libre. */
export interface InterpretRun { status: string; strategy: string | null; options?: string[]; extras?: string; tone?: number; toneEvidence?: string; guard?: string; clarify?: string }
/** La adaptación (segunda llamada) sobre la lectura que se habría usado. */
export interface AdaptRun { ok: boolean; reply?: string; authored: string; echoes?: boolean; same?: boolean; audit?: AdaptAudit | null }
export interface AdaptAudit { fiel: boolean; agrega: boolean; responde_al_jugador: boolean; motivo: string }
export interface AdvisorAudit { recomienda: boolean; inventa: boolean; responde: boolean; motivo: string }
export interface DemoStep { node: string; stage: string; said: string[]; text: string; status: string; strategy: string; options?: string[]; clarify?: string; guard?: string; extras?: string; tone?: number; toneEvidence?: string; reply: string[]; authored: string[]; adapted: boolean; trust: number }
export interface DemoResult { id: string; title: string; ep: string; steps: DemoStep[]; closed: boolean; headline?: string; trust: number; path: string[]; expected: string[] }

export interface JobResult {
  kind: EvalJob["kind"]; set?: EvalSetId; i: number; key: string;
  runs?: (InterpretRun | null)[];
  adapt?: AdaptRun | null;
  quality?: number[];
  got?: string; raw?: string;
  answer?: string | null; audit?: AdvisorAudit | null; rejects?: AdvisorReject[];
  demo?: DemoResult;
  calls: number; cost: number;
}

/** Convierte el modelo inyectado en la `Call` de producción y cuenta llamadas y costo. */
function meter(model: Model) {
  const m = { calls: 0, cost: 0, last: "" };
  const call: Call = async (msgs, max, temp) => {
    const r = await model(msgs, max, temp);
    m.calls++; m.cost += r?.cost ?? 0; m.last = r?.content ?? "";
    return r?.content ?? null;
  };
  return { m, call };
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

function observe(it: Interpretation | null): InterpretRun | null {
  if (!it) return null;
  return {
    status: it.status, strategy: it.strategy,
    ...(it.options ? { options: it.options } : {}), ...(it.extras ? { extras: it.extras } : {}), ...(it.clarify ? { clarify: it.clarify } : {}),
    ...(it.tone !== undefined ? { tone: it.tone } : {}), ...(it.toneEvidence ? { toneEvidence: it.toneEvidence } : {}), ...(it.guard ? { guard: it.guard } : {}),
  };
}

export function adaptAuditMessages(spec: EpisodeSpec, player: string, authored: string, reply: string): Msg[] {
  return [
    { role: "system", content: [
      "Eres auditor de calidad de un simulador ejecutivo. Comparas la respuesta autorizada de un personaje con una versión reescrita para reaccionar a lo que escribió el jugador.",
      "fiel=true si la versión reescrita conserva el mismo desenlace, las mismas decisiones y consecuencias, y todas las cifras de la autorizada (puede cambiar la redacción y el tono).",
      "agrega=true si añade un hecho, cifra, promesa, condición, fecha o pregunta que no está en la autorizada ni en lo que dijo el jugador (reaccionar con emoción o retomar palabras del jugador NO es agregar).",
      "responde_al_jugador=true si se nota que reacciona a algo concreto que escribió el jugador.",
      'Responde SOLO con JSON: {"fiel":true,"agrega":false,"responde_al_jugador":true,"motivo":"<máx. 120 caracteres>"}',
    ].join("\n") },
    { role: "user", content: `Caso: ${spec.title}.\n\nJugador: ${player}\n\nAutorizada:\n${authored}\n\nReescrita:\n${reply}` },
  ];
}
export function parseAdaptAudit(raw: string): AdaptAudit | null {
  try {
    const j = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as Record<string, unknown>;
    if (typeof j.fiel !== "boolean" || typeof j.agrega !== "boolean" || typeof j.responde_al_jugador !== "boolean") return null;
    return { fiel: j.fiel, agrega: j.agrega, responde_al_jugador: j.responde_al_jugador, motivo: String(j.motivo ?? "").slice(0, 160) };
  } catch { return null; }
}

async function interpretJob(set: EvalSetId, i: number, model: Model): Promise<JobResult> {
  const it = INTERPRET[set][i];
  const spec = EPISODES[it.ep];
  const run = runAt(spec, it.node, it.expect ?? it.options)!;
  const { m, call } = meter(model);
  const runs: (InterpretRun | null)[] = [], quality: number[] = [], parsed: (Interpretation | null)[] = [];
  for (let k = 0; k < repeatsOf(set); k++) {
    const p = await runInterpret(spec, run, it.text, call);
    parsed.push(p);
    runs.push(observe(p));
    if (p && p.status !== "fuera") quality.push(p.quality);
  }
  // Adaptación: sobre la lectura que se habría usado (la más frecuente), si comprometió una decisión.
  const labels = runs.map(label);
  const top = mode(labels);
  const used = parsed[labels.indexOf(top)] ?? null;
  let adapt: AdaptRun | null = null;
  // En validación se adapta cada respuesta; en desarrollo, una de cada tres (cuida el tope de gasto).
  if (used && committed(observe(used)) && (set === "val" || i % DEV_ADAPT_EVERY === 0)) {
    const out = await runAdapt(spec, run, it.text, used, call);
    const base = out?.basis ?? "";
    adapt = { ok: !!out, authored: base, ...(out ? { reply: out.reply.join("\n"), echoes: echoesPlayer(it.text, out.reply.join(" "), base), same: sameAsAuthored(out.reply, base.split("\n")) } : {}) };
    // El auditor de la adaptación corre solo en validación (en desarrollo basta la regla del motor; cuida el tope de gasto).
    if (out && set === "val") {
      const raw = await call(adaptAuditMessages(spec, it.text, base, out.reply.join("\n")), 80, 0);
      adapt.audit = raw ? parseAdaptAudit(raw) : null;
    }
  }
  return { kind: "interpret", set, i, key: `${it.ep}/${it.node}`, runs, adapt, quality, calls: m.calls, cost: m.cost };
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
  const { m, call } = meter(model);
  const p = await runFact(spec, f.q, call);
  const got = !p ? "invalida" : "factId" in p ? p.factId : "unknownId" in p ? `?${p.unknownId}` : "ninguno";
  return { kind: "fact", set, i, key: f.ep, got, raw: m.last.slice(0, 80), calls: m.calls, cost: m.cost };
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
  const { m, call } = meter(model);
  const rejects: AdvisorReject[] = [];
  const answer = await runAdvisor(spec, brief, authored, a.q, call, (r) => rejects.push(r));
  let audit: AdvisorAudit | null = null;
  if (answer) {
    const knows = [...spec.facts.facts.filter((f) => brief.knows.includes(f.id) || f.critical).map((f) => f.answer), authored];
    const raw = await call(auditMessages(spec, brief.id, knows, a.q, answer), 80, 0);
    audit = raw ? parseAudit(raw) : null;
  }
  return { kind: "advisor", set, i, key: `${a.ep}/${a.advisor}`, answer, audit, ...(rejects.length ? { rejects } : {}), calls: m.calls, cost: m.cost };
}

// ───────────────────────────────────────────── demostración: conversaciones completas
async function demoJob(i: number, model: Model, scripts = DEMOS): Promise<JobResult> {
  const d = scripts[i];
  const spec = EPISODES[d.ep];
  // Sin azar: así la diferencia entre guiones sale solo de lo que escribió el jugador.
  let run: EpisodeRun = { ...startEpisode(spec, 0, { runId: `demo-${d.id}` }), flags: [] };
  run = applyEpisode(spec, run, { type: "begin", at: 1 }).run;
  const steps: DemoStep[] = [];
  const { m, call } = meter(model);
  for (const s of d.steps) {
    const node = nodeOf(spec, run);
    if (!node || run.phase !== "deciding") break;
    // Paso 1, igual que la pantalla: interpretar (respaldo sin IA si la respuesta no es válida).
    const first = (await runInterpret(spec, run, s.text, call)) ?? interpretLocal(spec, run, s.text);
    let it = first;
    if (it && (it.status === "ambigua" || !it.strategy)) {
      // El jugador aclara eligiendo; queda registrada la pregunta que vio.
      const pick = s.pick && it.options?.includes(s.pick) ? s.pick : s.pick ?? it.options?.[0];
      it = pick ? clarified(spec, run, it, pick) : null;
    }
    if (!it?.strategy) break;
    // Paso 2: ya confirmada, la IA adapta la respuesta real del motor; el motor la vuelve a validar.
    const adapted = await runAdapt(spec, run, s.text, it, call);
    const said = sayOf(spec, run);
    const a = decideFrom(adapted ? { ...it, ...adapted } : it, s.text, 2 + run.turns.length);
    if (!a) break;
    const out = applyEpisode(spec, run, a);
    if (out.error) break;
    run = out.run;
    const t = run.turns[run.turns.length - 1];
    steps.push({
      node: node.id, stage: node.stage, said, text: s.text, status: first?.status ?? "respaldo", strategy: t.strategy,
      ...(first?.status === "ambigua" ? { options: first.options, clarify: first.clarify, ...(first.guard ? { guard: first.guard } : {}) } : {}),
      ...(t.interpretation?.extras ? { extras: t.interpretation.extras } : {}),
      ...(t.interpretation?.tone ? { tone: t.interpretation.tone, ...(it.toneEvidence ? { toneEvidence: it.toneEvidence } : {}) } : {}),
      reply: t.reply, authored: t.interpretation?.authored ?? t.reply, adapted: !!t.interpretation?.adapted, trust: run.trust,
    });
  }
  const demo: DemoResult = { id: d.id, title: d.title, ep: d.ep, steps, closed: run.phase === "closed", ...(run.outcome ? { headline: run.outcome.headline } : {}), trust: run.trust, path: steps.map((s) => `${s.node}:${s.strategy}`), expected: d.steps.map((s) => s.expect) };
  return { kind: "demo", i, key: d.id, demo, calls: m.calls, cost: m.cost };
}

/** Corre un guion de desarrollo (ronda 2); no forma parte de la validación. */
export const runDevDemo = (i: number, model: Model) => demoJob(i, model, DEV_DEMOS);
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
    /**
     * Adaptación real (segunda llamada): `adapted` = pasó la regla de fidelidad del motor (si no, se muestra la del
     * autor); `faithful` = el auditor confirma mismo desenlace y nada agregado; `echoes` = retoma palabras del jugador.
     * Tono: `hit` acierta en frases marcadas; `falsePositive` = frases neutras a las que se les puso tono.
     */
    adaptive: { replies: number; adapted: number; same: number; faithful: number; audited: number; echoes: number; reacts: number; tone: { total: number; hit: number; neutral: number; falsePositive: number }; extras: { total: number; hit: number } };
    byNode: Record<string, number>;
    misses: { key: string; kind: string; expect: string; got: string | null; text: string }[];
    samples: { key: string; text: string; authored: string; reply: string; audit?: string }[];
    adaptMisses: { key: string; text: string; authored: string; reply: string; motivo: string }[];
  };
  facts: { total: number; accuracy: number; wrongFact: number; inventedShown: number; inventedRejected: number; byKind: Record<string, { total: number; accuracy: number }>; misses: { q: string; expect: string; got: string }[] };
  advisor: { total: number; valid: number; quality: number; recommends: number; invents: number; byKind: Record<string, { total: number; quality: number }>; misses: { key: string; q: string; answer: string | null; motivo: string }[]; samples: { key: string; q: string; answer: string }[]; rejects: Record<string, number> };
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
  const ad = { replies: 0, adapted: 0, same: 0, faithful: 0, audited: 0, echoes: 0, reacts: 0, tone: { total: 0, hit: 0, neutral: 0, falsePositive: 0 }, extras: { total: 0, hit: 0 } };
  const misses: SetReport["interpret"]["misses"] = [], samples: SetReport["interpret"]["samples"] = [], adaptMisses: SetReport["interpret"]["adaptMisses"] = [];
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
    const A = r.adapt;
    if (A) {
      ad.replies++;
      if (A.ok) {
        ad.adapted++;
        if (A.echoes) ad.echoes++;
        if (A.same) ad.same++;
        if (A.audit) {
          ad.audited++;
          const fiel = A.audit.fiel && !A.audit.agrega;
          if (fiel) ad.faithful++; else adaptMisses.push({ key: r.key, text: it.text, authored: A.authored, reply: A.reply ?? "", motivo: A.audit.motivo });
          if (A.audit.responde_al_jugador) ad.reacts++;
        }
        if (samples.length < 14 && (r.i % 4 === 0 || it.tone)) samples.push({ key: r.key, text: it.text, authored: A.authored, reply: A.reply ?? "", ...(A.audit ? { audit: A.audit.motivo } : {}) });
      }
    }
    if (it.tone) { ad.tone.total++; if (used?.tone === it.tone) ad.tone.hit++; }
    else if (used && used.status !== "fuera") { ad.tone.neutral++; if (used.tone) ad.tone.falsePositive++; }
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
    if (!ok && r.got !== "ninguno" && r.got !== "invalida") wrong++;
    // El modelo devolvió un id que no existe: se rechaza y nunca llega al jugador.
    let rawId = "";
    try { rawId = String((JSON.parse(r.raw ?? "") as { id?: unknown }).id ?? ""); } catch { /* sin JSON */ }
    if (rawId && norm(rawId) !== "ninguno" && r.got === "invalida") invRej++;
  }
  const av = rs.filter((r) => r.kind === "advisor");
  const aByKind: Record<string, { t: number; h: number }> = {};
  let aValid = 0, aQual = 0, rec = 0, inv = 0;
  const aMiss: SetReport["advisor"]["misses"] = [], aSamples: SetReport["advisor"]["samples"] = [];
  const aRej: Record<string, number> = {};
  for (const r of av) {
    const a = ADVISORS[set][r.i];
    const good = !!r.answer && !!r.audit && !r.audit.recomienda && !r.audit.inventa && r.audit.responde;
    if (r.answer) aValid++;
    for (const x of r.rejects ?? []) aRej[x.reason] = (aRej[x.reason] ?? 0) + 1;
    const why = (r.rejects ?? []).map((x) => `${x.reason}: ${x.detail}`).join(" · ");
    if (good) aQual++; else aMiss.push({ key: r.key, q: a.q, answer: r.answer ?? null, motivo: r.answer ? (r.audit?.motivo || "sin auditoría") : `no pasó la validación automática (${why || "sin detalle"}); se usaría el texto del autor` });
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
      byNode: Object.fromEntries(Object.entries(byNode).map(([k, v]) => [k, pct(v.h, v.t)])), misses, samples, adaptMisses,
    },
    // inventedShown es 0 por construcción: el texto del dato siempre sale del banco y un id inexistente se rechaza.
    facts: { total: fx.length, accuracy: pct(fHit, fx.length), wrongFact: wrong, inventedShown: 0, inventedRejected: invRej, byKind: fin(fByKind), misses: fMiss },
    advisor: {
      total: av.length, valid: pct(aValid, av.length), quality: pct(aQual, av.length), recommends: rec, invents: inv,
      byKind: Object.fromEntries(Object.entries(aByKind).map(([k, v]) => [k, { total: v.t, quality: pct(v.h, v.t) }])), misses: aMiss, samples: aSamples, rejects: aRej,
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

/** Metas de Oziel (ronda 2, vigentes en la ronda 3). Se juzgan sobre el conjunto de validación final. */
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
