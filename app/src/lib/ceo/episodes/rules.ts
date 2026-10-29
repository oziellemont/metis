/**
 * mêtis CEO · cierre de un episodio (Simulation Engine del episodio).
 *
 * El cierre genérico junta lo que ya decidió el jugador: compromisos y riesgos de las estrategias elegidas,
 * evidencia de aprendizaje, seguimientos que aplican y eventos canónicos. NO mueve indicadores.
 *
 * Cada caso puede registrar reglas económicas propias (`registerRules`). Solo ellas pueden proponer cambios
 * de KPI, y cada cambio debe traer su porqué (fórmula o condición). Sin reglas registradas → sin cambios.
 */
import type { CanonicalEvent, Commitment, EpisodeOutcome, EpisodeRun, EpisodeSpec, KpiChange, LearningEvidence, Risk } from "./contracts";
import { holds, render } from "./engine";

export const DAY_MS = 86_400_000;

export interface RulesResult {
  headline: string;
  agreement: [string, string][];
  economics: [string, string][];
  kpi: KpiChange[];
  commitments?: Commitment[];
  risks?: Risk[];
  luck?: string | null;
  data?: Record<string, number | string>;
}
export type EpisodeRules = (spec: EpisodeSpec, run: EpisodeRun) => RulesResult;

/** Términos derivados (p. ej. qué tan justificable es la oferta para la compradora). Se recalculan tras cada decisión. */
export type DeriveFn = (run: Pick<EpisodeRun, "flags" | "terms" | "trust">) => Record<string, number>;

const REGISTRY: Record<string, EpisodeRules> = {};
const DERIVE: Record<string, DeriveFn> = {};
export function registerRules(id: string, fn: EpisodeRules, derive?: DeriveFn) { REGISTRY[id] = fn; if (derive) DERIVE[id] = derive; }
export function deriveTerms(spec: EpisodeSpec, run: Pick<EpisodeRun, "flags" | "terms" | "trust">): Record<string, number> {
  const d = DERIVE[spec.rules];
  return d ? { ...run.terms, ...d(run) } : run.terms;
}
export const rulesFor = (id: string): EpisodeRules | undefined => REGISTRY[id];

/** Límite por cierre: ningún episodio mueve un indicador más de ±10 (los KPI viven en 0–100). */
export const KPI_CAP = 10;

function uniq<T extends { id: string }>(xs: T[]): T[] {
  const seen = new Set<string>();
  return xs.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

export function closeOutcome(spec: EpisodeSpec, run: EpisodeRun, at: number): EpisodeOutcome {
  const cause = (node?: string, strategy?: string) => ({ episode: spec.id, version: spec.version, ...(node ? { node } : {}), ...(strategy ? { strategy } : {}) });
  const chosen = run.turns.map((t) => ({ t, st: spec.nodes[t.node]?.strategies.find((s) => s.id === t.strategy) })).filter((x) => x.st);

  const evidence: LearningEvidence[] = [];
  for (const { t, st } of chosen) {
    for (const e of st!.evidence) {
      if (!holds(run, e.when)) continue;
      evidence.push({ dim: e.dim, level: e.level, basis: e.basis, node: t.node, at: t.at, reliability: t.interpretation ? "ia_provisional" : "autor" });
    }
  }

  const custom = rulesFor(spec.rules)?.(spec, run);
  const commitments = uniq([...chosen.flatMap(({ st }) => st!.commitments ?? []), ...(custom?.commitments ?? [])]);
  const risks = uniq([...chosen.flatMap(({ st }) => st!.risks ?? []), ...(custom?.risks ?? [])]);
  const kpi = (custom?.kpi ?? []).map((k) => ({ ...k, delta: Math.max(-KPI_CAP, Math.min(KPI_CAP, Math.round(k.delta))) })).filter((k) => k.delta !== 0);

  const followUps = spec.followUps.filter((f) => holds(run, f.when)).map((f) => ({ id: f.id, at: at + f.afterDays * DAY_MS, from: f.from, subject: f.subject, text: render(spec, run, f.text) }));

  const events: CanonicalEvent[] = [
    ...(custom ? [{ id: `${run.runId}:acuerdo`, kind: "acuerdo" as const, text: custom.headline, cause: cause(), at, rule: spec.rules, ...(custom.data ? { data: custom.data } : {}) }] : []),
    ...commitments.map((c) => ({ id: `${run.runId}:c:${c.id}`, kind: "compromiso" as const, text: c.text, cause: cause(), at, rule: "estrategia elegida", data: { owner: c.owner } })),
    ...risks.map((r) => ({ id: `${run.runId}:r:${r.id}`, kind: "riesgo" as const, text: r.text, cause: cause(), at, rule: "estrategia elegida" })),
    { id: `${run.runId}:rel`, kind: "relacion" as const, text: `Confianza con ${spec.counterpart ?? spec.from}: ${run.trust}`, cause: cause(), at, rule: "suma de confianza de las estrategias (−3…+3)", data: { trust: run.trust } },
    ...kpi.map((k) => ({ id: `${run.runId}:k:${k.key}`, kind: "kpi" as const, text: `${k.key} ${k.delta > 0 ? "+" : ""}${k.delta}`, cause: cause(), at, rule: k.why, data: { delta: k.delta } })),
    ...followUps.map((f) => ({ id: `${run.runId}:f:${f.id}`, kind: "seguimiento" as const, text: f.subject, cause: cause(), at, activatesAt: f.at, rule: "condición del seguimiento" })),
  ];

  const obligations = (spec.obligations ?? []).map((o) => ({ id: o.id, text: o.text, met: holds(run, o.met) }));
  for (const o of obligations) events.push({ id: `${run.runId}:o:${o.id}`, kind: "compromiso", text: `${o.met ? "Cumplida" : "Incumplida"}: ${o.text}`, cause: cause(), at, rule: "obligación no negociable", data: { met: o.met ? 1 : 0 } });

  return {
    headline: custom?.headline ?? "Caso cerrado.",
    agreement: custom?.agreement ?? [],
    economics: custom?.economics ?? [],
    commitments, risks, kpi, events, evidence, followUps,
    luck: custom?.luck ?? null,
    ...(obligations.length ? { obligations } : {}),
  };
}

/** Promedio por dimensión de la rúbrica (para el cierre y, después, para el Mastery Engine). */
export function rubricSummary(ev: LearningEvidence[]): { dim: LearningEvidence["dim"]; level: number; n: number }[] {
  const by = new Map<string, { sum: number; n: number }>();
  for (const e of ev) { const b = by.get(e.dim) ?? { sum: 0, n: 0 }; b.sum += e.level; b.n += 1; by.set(e.dim, b); }
  return [...by.entries()].map(([dim, b]) => ({ dim: dim as LearningEvidence["dim"], level: Math.round((b.sum / b.n) * 10) / 10, n: b.n }));
}
