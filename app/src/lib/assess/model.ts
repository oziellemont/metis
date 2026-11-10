/**
 * MÊTIS Assess v1 · vacante, respuestas, puntaje por competencia y recomendaciones para revisión humana.
 *
 * Principios:
 *  - El puntaje sale SOLO de las consecuencias que calculó el motor para cada opción (catalog.ts). Ninguna IA califica.
 *  - Mismo criterio para todos: misma empresa, mismos casos, misma escala (0 = peor opción disponible del caso
 *    en esa competencia, 100 = mejor). Una competencia solo se reporta con al menos dos casos que la midan.
 *  - El razonamiento escrito y el tiempo NO suben ni bajan el puntaje: se muestran como evidencia y generan alertas
 *    para que una persona revise. Nada aquí recomienda contratar o descartar.
 */
import { createHash, randomBytes } from "node:crypto";
import { COMPETENCIES, COMPETENCY_IDS, INDUSTRIES, isCompetency, isIndustry, caseOutcomes, measurable, metricOf, ASSESS_VALIDATED, type Competency, type Industry, type CaseOutcome } from "./catalog";

// ───────────────────────────────────────────────────────── vacante
export type Weights = Partial<Record<Competency, 1 | 2 | 3>>;
export interface VacancyInput { title: string; industry: Industry; weights: Weights }
export interface Vacancy extends VacancyInput { id: string; mode: "piloto"; createdAt: string }

export const MAX_CANDIDATES = 30;
export const MIN_REASONING = 40;
export const FAST_MS = 25_000;
export const MAX_REASONING = 1200;

export function cleanVacancy(x: unknown): { ok: true; v: VacancyInput } | { ok: false; error: string } {
  const o = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  if (title.length < 3) return { ok: false, error: "Escribe el nombre de la vacante (mínimo 3 letras)." };
  if (!isIndustry(o.industry)) return { ok: false, error: "Elige retail o acero." };
  const raw = (typeof o.weights === "object" && o.weights !== null ? o.weights : {}) as Record<string, unknown>;
  const weights: Weights = {};
  const can = measurable(o.industry);
  for (const [k, v] of Object.entries(raw)) {
    if (!isCompetency(k) || !(v === 1 || v === 2 || v === 3)) continue;
    if (!can.includes(k)) return { ok: false, error: `«${COMPETENCIES[k].label}» no se puede medir con suficientes casos en esta industria.` };
    weights[k] = v;
  }
  if (Object.keys(weights).length < 2) return { ok: false, error: "Elige al menos dos competencias para la vacante." };
  return { ok: true, v: { title, industry: o.industry, weights } };
}

// ───────────────────────────────────────────────────────── invitaciones
/** Enlace único por candidato. En la base solo se guarda la huella (sha-256), nunca el enlace. */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: tokenHash(token) };
}
export const tokenHash = (token: string) => createHash("sha256").update(`assess|${token}`).digest("hex");
export const isTokenShape = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9_-]{32}$/.test(t);

export function cleanCandidate(x: unknown): { ok: true; label: string; email: string | null } | { ok: false; error: string } {
  const o = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
  const label = typeof o.label === "string" ? o.label.trim().replace(/\s+/g, " ").slice(0, 60) : "";
  if (label.length < 2) return { ok: false, error: "Escribe el nombre o una clave para identificar al candidato." };
  const e = typeof o.email === "string" ? o.email.trim().toLowerCase().slice(0, 120) : "";
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, error: "El correo no parece válido." };
  return { ok: true, label, email: e || null };
}

// ───────────────────────────────────────────────────────── respuestas
export interface Answer { caseId: string; optionId: string; reasoning: string; ms: number }

export function cleanAnswer(ind: Industry, x: unknown): { ok: true; a: Answer } | { ok: false; error: string } {
  const o = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
  const c = caseOutcomes(ind).find((k) => k.caseId === o.caseId);
  if (!c) return { ok: false, error: "Caso desconocido." };
  const opt = c.options.find((k) => k.optionId === o.optionId);
  if (!opt) return { ok: false, error: "Opción desconocida." };
  if (!opt.available) return { ok: false, error: opt.reason ?? "Esa opción no se puede elegir." };
  const reasoning = typeof o.reasoning === "string" ? o.reasoning.trim().slice(0, MAX_REASONING) : "";
  if (reasoning.length < 10) return { ok: false, error: "Explica en una o dos frases por qué eliges esa opción." };
  const ms = typeof o.ms === "number" && Number.isFinite(o.ms) ? Math.max(0, Math.min(7_200_000, Math.round(o.ms))) : 0;
  return { ok: true, a: { caseId: c.caseId, optionId: opt.optionId, reasoning, ms } };
}

// ───────────────────────────────────────────────────────── puntaje
/** 0..100: dónde quedó la opción elegida entre las opciones disponibles del caso, en esa competencia. */
export function optionScore(c: CaseOutcome, optionId: string, k: Competency): number | null {
  if (!c.measures.includes(k)) return null;
  const live = c.options.filter((o) => o.available && o.metrics);
  const me = live.find((o) => o.optionId === optionId);
  if (!me) return null;
  const vals = live.map((o) => o.metrics![metricOf(k)]);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi === lo) return null;
  return Math.round(((me.metrics![metricOf(k)] - lo) / (hi - lo)) * 100);
}

export interface CompScore { k: Competency; label: string; score: number | null; n: number; weight: number }
export interface Evidence { caseId: string; subject: string; area: string; optionId: string; optionLabel: string; reasoning: string; ms: number; scores: Partial<Record<Competency, number>>; best: Partial<Record<Competency, string>> }
export interface Flag { kind: "incompleto" | "rapido" | "breve" | "evidencia"; text: string }
export interface Report {
  pilot: true; validated: boolean;
  answered: number; total: number; complete: boolean;
  comps: CompScore[]; overall: number | null; band: "solida" | "mixta" | "limitada" | "insuficiente";
  strengths: string[]; probe: string[]; flags: Flag[]; evidence: Evidence[];
}

export const BAND_LABEL: Readonly<Record<Report["band"], string>> = Object.freeze({
  solida: "Evidencia consistente a favor",
  mixta: "Evidencia mixta",
  limitada: "Evidencia de áreas a desarrollar",
  insuficiente: "Evidencia insuficiente",
});

export function scoreCandidate(ind: Industry, weights: Weights, answers: readonly Answer[]): Report {
  const outs = caseOutcomes(ind);
  const total = INDUSTRIES[ind].caseIds.length;
  const byCase = new Map(answers.map((a) => [a.caseId, a]));
  const evidence: Evidence[] = [];
  const acc = new Map<Competency, number[]>();
  for (const c of outs) {
    const a = byCase.get(c.caseId);
    if (!a) continue;
    const scores: Partial<Record<Competency, number>> = {};
    const best: Partial<Record<Competency, string>> = {};
    for (const k of COMPETENCY_IDS) {
      const s = optionScore(c, a.optionId, k);
      if (s === null) continue;
      scores[k] = s;
      (acc.get(k) ?? acc.set(k, []).get(k)!).push(s);
      const live = c.options.filter((o) => o.available && o.metrics);
      best[k] = live.reduce((x, y) => (y.metrics![metricOf(k)] > x.metrics![metricOf(k)] ? y : x)).label;
    }
    const opt = c.options.find((o) => o.optionId === a.optionId);
    evidence.push({ caseId: c.caseId, subject: c.subject, area: c.area, optionId: a.optionId, optionLabel: opt?.label ?? a.optionId, reasoning: a.reasoning, ms: a.ms, scores, best });
  }
  const comps: CompScore[] = COMPETENCY_IDS.filter((k) => weights[k]).map((k) => {
    const xs = acc.get(k) ?? [];
    return { k, label: COMPETENCIES[k].label, n: xs.length, weight: weights[k]!, score: xs.length >= 2 ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null };
  });
  const scored = comps.filter((c) => c.score !== null);
  const wsum = scored.reduce((a, c) => a + c.weight, 0);
  const answered = evidence.length;
  const complete = answered === total;
  const overall = complete && wsum > 0 && scored.length >= 2 ? Math.round(scored.reduce((a, c) => a + c.score! * c.weight, 0) / wsum) : null;
  const band: Report["band"] = overall === null ? "insuficiente" : overall >= 70 ? "solida" : overall >= 45 ? "mixta" : "limitada";

  const flags: Flag[] = [];
  if (!complete) flags.push({ kind: "incompleto", text: `Respondió ${answered} de ${total} casos: el resultado no es comparable hasta que termine.` });
  const fast = evidence.filter((e) => e.ms > 0 && e.ms < FAST_MS);
  if (fast.length >= 2) flags.push({ kind: "rapido", text: `Respondió ${fast.length} casos en menos de ${FAST_MS / 1000} segundos: puede no haber leído el caso completo.` });
  const brief = evidence.filter((e) => e.reasoning.length < MIN_REASONING);
  if (brief.length >= 2) flags.push({ kind: "breve", text: `En ${brief.length} casos el razonamiento es muy breve: hay poca evidencia de cómo pensó la decisión.` });
  for (const c of comps) if (c.score === null) flags.push({ kind: "evidencia", text: `«${c.label}»: solo ${c.n} caso${c.n === 1 ? "" : "s"} con diferencias medibles; no se reporta puntaje.` });

  const strengths = scored.filter((c) => c.score! >= 70).map((c) => `${c.label}: eligió opciones que el motor muestra entre las mejores en ${c.n} casos (${c.score} de 100).`);
  const probe: string[] = [];
  for (const c of scored.filter((x) => x.score! < 50)) {
    const worst = evidence.filter((e) => e.scores[c.k] !== undefined).sort((a, b) => a.scores[c.k]! - b.scores[c.k]!)[0];
    if (worst) probe.push(`${c.label} (${c.score} de 100). Pregunta por «${worst.subject}»: eligió «${worst.optionLabel}»; en esta competencia rendía más «${worst.best[c.k]}». Escucha qué riesgo estaba priorizando.`);
  }
  return { pilot: true, validated: ASSESS_VALIDATED, answered, total, complete, comps, overall, band, strengths, probe, flags, evidence };
}

/** Tabla comparativa: orden por puntaje global solo entre candidatos que terminaron; los demás al final. */
export function compare<T extends { report: Report }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => (b.report.overall ?? -1) - (a.report.overall ?? -1));
}
