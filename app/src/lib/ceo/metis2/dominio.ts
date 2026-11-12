/**
 * MÊTIS 2.0 · Cálculo de dominio (entrega 1.4).
 *
 * Toma el registro de evidencias (`evidencias.ts`) y estima, para cada habilidad, qué tan demostrada está. De ahí
 * salen las seis barras de academia y la barra general hacia el siguiente nivel. Hoy, Perfil y Academy deben usar
 * este mismo cálculo.
 *
 * Tres cosas separadas:
 *   1. Nivel general de la persona: 1, 2, 3… sin etapa final. Se guarda aparte y solo sube cuando se cumplen los
 *      criterios de `levelProgress`.
 *   2. Dominio de cada habilidad: grado interno de 0 a 5, con confianza y vigencia.
 *   3. Progreso hacia el siguiente nivel: criterios públicos, no un promedio de barras.
 *
 * Lo que NO entra en el cálculo: puntos, rachas, lecciones leídas, tiempo de uso, número de actividades completadas,
 * antigüedad de la cuenta ni lo que la persona declara saber. La única entrada son evidencias evaluadas.
 *
 * Lo que sí pesa: resultado, calidad del razonamiento, dificultad, transferencia a otros contextos, consistencia en
 * el tiempo y respuestas sin ayuda.
 *
 * Todo es determinista y no depende de la base de datos: el mismo registro da siempre el mismo resultado.
 */
import { ACADEMIES, SKILLS, academyById, skillById, tramoOf, type AcademyId, type Demand, type MasteryStage, type Skill } from "./academias";
import { academiesOf, activeEvidence, type Evidence, type EvidenceLog } from "./evidencias";

/**
 * Versión de las reglas.
 *  1 · Primera versión.
 *  2 · La rapidez de una respuesta deja de ser motivo para descartarla (instrucción de Oziel, 12 nov 2026).
 */
export const MASTERY_RULES_VERSION = 2;
const DAY = 86_400_000;

/**
 * Reglas del cálculo. Son públicas y tienen versión: si cambian, cambia `MASTERY_RULES_VERSION`.
 * Los números son un punto de partida razonado; se ajustan cuando haya datos reales de uso.
 */
export const RULES = Object.freeze({
  /** Acierto: resultado de 70 % o más y, si se evaluó el razonamiento, razonamiento de 50 % o más. */
  pass: 0.7,
  reasoningFloor: 0.5,
  /** Volver a responder la misma situación solo cuenta si pasaron estos días sin verla (repaso espaciado). */
  spacingDays: 7,
  /** Una calificación con confianza menor que esto no cuenta ni a favor ni en contra. */
  minConfidence: 0.5,
  /** Respuestas recientes sin ayuda que se revisan para ver si el desempeño se sostiene. */
  recent: 5,
  /** Grado 3 · Demostrado. `recentFails`: fallos tolerados entre las respuestas recientes. */
  demonstrated: Object.freeze({ passes: 3, situations: 3, mainPasses: 2, recentFails: 2, reasoningFrom: 3 as Demand, reasoning: 0.6 }),
  /** Grado 4 · Consistente. */
  consistent: Object.freeze({ spanDays: 7, contexts: 2, recentFails: 1 }),
  /** Grado 5 · Transferible. */
  transferable: Object.freeze({ contexts: 3 }),
  /** Días sin evidencia nueva antes de sugerir repaso, según el grado. Al doble, se pide revalidar. */
  reviewDays: Object.freeze([14, 14, 14, 30, 60, 120] as const),
  /** Evidencia (ponderada) con la que la confianza llega al máximo. */
  confidenceFull: 6,
  /** Paso de nivel. */
  level: Object.freeze({
    /** Parte de las habilidades de cada academia que debe estar demostrada. */
    academyShare: 0.6,
    /** Academias que debe cruzar el reto integrador. */
    integratorAcademies: 2,
    /** Peso de cada criterio en la barra general. */
    weights: Object.freeze({ cobertura: 0.5, evidencia: 0.3, integrador: 0.2 }),
  }),
});

// ───────────────────────────────────────────── qué evidencias cuentan

/** Acierto según las reglas. */
export const isPass = (e: Pick<Evidence, "result" | "reasoning">) => e.result >= RULES.pass && (e.reasoning === null || e.reasoning >= RULES.reasoningFloor);

export type IgnoredWhy = "repetida" | "calificacion_dudosa";
export interface Screened { counted: Evidence[]; ignored: { id: string; why: IgnoredWhy }[] }

/**
 * Protección contra repeticiones y atajos. Recorre las evidencias vigentes en orden de fecha y deja fuera:
 *  - «repetida»: la misma situación (mismo grupo) vista hace menos de `spacingDays` días;
 *  - «calificacion_dudosa»: respuestas cuya calificación tiene confianza menor que `minConfidence`.
 * Una situación vista, cuente o no, reinicia la espera: no sirve mirar la respuesta y contestar de nuevo.
 *
 * El tiempo de respuesta se guarda en la evidencia como dato, pero no descarta nada: responder rápido no significa
 * responder sin comprender.
 */
export function screen(log: EvidenceLog): Screened {
  const counted: Evidence[] = [];
  const ignored: Screened["ignored"] = [];
  const lastSeen = new Map<string, number>();
  for (const e of activeEvidence(log)) {
    const seen = lastSeen.get(e.activity.group);
    lastSeen.set(e.activity.group, e.at);
    if (seen !== undefined && e.at - seen < RULES.spacingDays * DAY) { ignored.push({ id: e.id, why: "repetida" }); continue; }
    if (e.confidence < RULES.minConfidence) { ignored.push({ id: e.id, why: "calificacion_dudosa" }); continue; }
    counted.push(e);
  }
  return { counted, ignored };
}

// ───────────────────────────────────────────── tiempo y pausas

export interface Pause { from: number; to: number }

/** Días transcurridos entre dos fechas, sin contar los periodos de pausa. La ausencia en pausa no envejece nada. */
export function activeDays(from: number, to: number, pauses: readonly Pause[] = []): number {
  if (to <= from) return 0;
  let paused = 0;
  for (const p of pauses) paused += Math.max(0, Math.min(to, p.to) - Math.max(from, p.from));
  return Math.max(0, to - from - paused) / DAY;
}

// ───────────────────────────────────────────── dominio por habilidad

export type Freshness = "sin_evidencia" | "vigente" | "repaso" | "revalidar";
export type ConfidenceLabel = "baja" | "media" | "alta";
export const confidenceLabel = (c: number): ConfidenceLabel => (c >= 0.67 ? "alta" : c >= 0.34 ? "media" : "baja");

export interface SkillEstimate {
  skill: string;
  /** Grado interno de dominio, de 0 a 5, frente a la exigencia del nivel pedido. */
  stage: MasteryStage;
  /** Qué tan firme es la estimación, de 0 a 1. */
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  freshness: Freshness;
  /** Fecha de la última evidencia que cuenta. */
  lastAt?: number;
  /** Días activos desde la última evidencia. */
  days?: number;
  coverage: {
    /** Evidencias que cuentan de esta habilidad, de cualquier nivel. */
    any: number;
    /** Evidencias que cuentan en la exigencia del nivel. */
    atLevel: number;
    /** Aciertos sin ayuda en la exigencia del nivel. */
    passes: number;
    /** Aciertos en los que esta era la habilidad principal. */
    mainPasses: number;
    /** Situaciones distintas con acierto. */
    situations: number;
    /** Contextos (industrias) distintos con acierto. */
    contexts: number;
    /** Aciertos en pruebas de transferencia. */
    transfer: number;
    /** Aciertos con razonamiento evaluado y suficiente. */
    reasoned: number;
    /** Parte de las respuestas recientes sin ayuda que fueron acierto (0 a 1). Es informativa. */
    recentRate: number;
  };
  /** Qué falta para el siguiente grado, en palabras. Vacío si ya está en el grado más alto. */
  missing: string[];
}

export interface EstimateOptions {
  /** Fecha actual (milisegundos). */
  now: number;
  /** Solo cuentan para la exigencia del nivel las evidencias desde esta fecha (niveles 7 en adelante). */
  since?: number;
  pauses?: readonly Pause[];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const falta = (n: number, one: string, many: string) => `${n === 1 ? "Falta" : "Faltan"} ${plural(n, one, many)}`;

/** Estimación de una habilidad frente a la exigencia `demand`, a partir de evidencias ya filtradas con `screen`. */
export function estimateSkill(counted: readonly Evidence[], skillId: string, demand: Demand, opts: EstimateOptions): SkillEstimate {
  const R = RULES;
  const mine = counted.filter((e) => e.skills.includes(skillId));
  const atLevel = mine.filter((e) => e.level >= demand && (opts.since === undefined || e.at >= opts.since));
  const unaided = atLevel.filter((e) => !e.aided);
  const passes = unaided.filter(isPass);
  const mainPasses = passes.filter((e) => e.skills[0] === skillId).length;
  const situations = new Set(passes.map((e) => e.activity.group)).size;
  const contexts = new Set(passes.map((e) => e.context)).size;
  const transfer = passes.filter((e) => e.transfer).length;
  const reasoned = passes.filter((e) => e.reasoning !== null && e.reasoning >= R.demonstrated.reasoning).length;
  const cross = passes.filter((e) => academiesOf(e).length >= 2).length;
  // Fallar un reto más difícil que el nivel no cuenta en contra: solo se juzgan los aciertos y los fallos del nivel.
  const recent = unaided.filter((e) => isPass(e) || e.level === demand).slice(-R.recent);
  const recentFails = recent.length - recent.filter(isPass).length;
  const recentRate = recent.length ? (recent.length - recentFails) / recent.length : 0;
  const spanDays = passes.length ? (passes[passes.length - 1].at - passes[0].at) / DAY : 0;
  const needsReasoning = demand >= R.demonstrated.reasoningFrom;

  const missing3: string[] = [];
  if (passes.length < R.demonstrated.passes) missing3.push(`${falta(R.demonstrated.passes - passes.length, "acierto", "aciertos")} sin ayuda en la exigencia de este nivel.`);
  if (situations < R.demonstrated.situations) missing3.push(`${falta(R.demonstrated.situations - situations, "situación distinta", "situaciones distintas")}.`);
  if (mainPasses < R.demonstrated.mainPasses) missing3.push(`${falta(R.demonstrated.mainPasses - mainPasses, "acierto", "aciertos")} en actividades donde esta sea la habilidad principal.`);
  if (recentFails > R.demonstrated.recentFails) missing3.push("Las respuestas recientes todavía no son consistentes.");
  if (needsReasoning && reasoned < 1) missing3.push("Falta al menos un acierto en el que se haya evaluado el razonamiento.");
  const demonstrated = missing3.length === 0;

  const missing4: string[] = [];
  if (spanDays < R.consistent.spanDays) missing4.push(`Falta sostenerlo en el tiempo: aciertos separados por al menos ${R.consistent.spanDays} días.`);
  if (contexts < R.consistent.contexts) missing4.push("Falta un acierto en otro contexto o industria.");
  if (recentFails > R.consistent.recentFails) missing4.push("Las respuestas recientes deben ser casi todas aciertos.");
  const consistent = demonstrated && missing4.length === 0;

  const missing5: string[] = [];
  if (contexts < R.transferable.contexts) missing5.push(`Faltan aciertos en ${plural(R.transferable.contexts - contexts, "contexto más", "contextos más")}.`);
  if (transfer < 1) missing5.push("Falta un acierto en una prueba de transferencia.");
  if (cross < 1) missing5.push("Falta un acierto dentro de una actividad que cruce academias.");
  const transferable = consistent && missing5.length === 0;

  let stage: MasteryStage;
  let missing: string[];
  if (mine.length === 0) { stage = 0; missing = ["Todavía no hay respuestas evaluadas de esta habilidad."]; }
  else if (transferable) { stage = 5; missing = []; }
  else if (consistent) { stage = 4; missing = missing5; }
  else if (demonstrated) { stage = 3; missing = missing4; }
  else if (passes.length >= 1) { stage = 2; missing = missing3; }
  else { stage = 1; missing = ["Falta un primer acierto sin ayuda en la exigencia de este nivel."]; }

  const last = mine.length ? mine[mine.length - 1].at : undefined;
  const days = last === undefined ? undefined : activeDays(last, opts.now, opts.pauses);
  const interval = R.reviewDays[stage];
  const freshness: Freshness = days === undefined ? "sin_evidencia" : days <= interval ? "vigente" : days <= 2 * interval ? "repaso" : "revalidar";

  const weight = atLevel.reduce((n, e) => n + (e.skills[0] === skillId ? 1 : 0.5) * (e.aided ? 0.5 : 1) * e.confidence, 0);
  const aging = freshness === "vigente" ? 1 : freshness === "repaso" ? 0.85 : 0.6;
  const confidence = mine.length === 0 ? 0 : Math.round(Math.min(1, weight / R.confidenceFull) * aging * 100) / 100;

  return {
    skill: skillId, stage, confidence, confidenceLabel: confidenceLabel(confidence), freshness,
    ...(last !== undefined ? { lastAt: last, days } : {}),
    coverage: { any: mine.length, atLevel: atLevel.length, passes: passes.length, mainPasses, situations, contexts, transfer, reasoned, recentRate: Math.round(recentRate * 100) / 100 },
    missing,
  };
}

// ───────────────────────────────────────────── academias y nivel

export type AcademyLabel = "sin_evidencia" | "parcial" | "suficiente";
export const ACADEMY_LABEL_TEXT: Record<AcademyLabel, string> = { sin_evidencia: "Sin evidencia suficiente", parcial: "Evidencia parcial", suficiente: "Evidencia suficiente" };

export interface AcademyProgress {
  academy: AcademyId;
  /** Habilidades de la academia que se exigen en el nivel. */
  skills: number;
  demonstrated: number;
  developing: number;
  /** Habilidades que todavía no llegan a «En desarrollo». */
  pending: number;
  /** Habilidades demostradas que hacen falta para cubrir la academia. */
  needed: number;
  /** Avance hacia los objetivos de dominio del nivel, de 0 a 1. */
  bar: number;
  label: AcademyLabel;
  /** Hay habilidades demostradas que conviene repasar. */
  review: boolean;
  /** Cumple la cobertura mínima del nivel. */
  covered: boolean;
}

export type CriterionId = "cobertura" | "evidencia" | "integrador";
export interface Criterion {
  id: CriterionId;
  /** El criterio, en palabras. Es el mismo texto para todas las personas. */
  text: string;
  met: boolean;
  /** Avance del criterio, de 0 a 1. */
  progress: number;
  /** Qué falta, en palabras. Vacío si ya se cumple. */
  missing: string;
}

export interface LevelProgress {
  rules: typeof MASTERY_RULES_VERSION;
  level: number;
  demand: Demand;
  skills: SkillEstimate[];
  academies: AcademyProgress[];
  criteria: Criterion[];
  /** Barra general hacia el siguiente nivel, de 0 a 1. Solo llega a 1 con los tres criterios cumplidos. */
  bar: number;
  /** Se cumplen los tres criterios: la persona puede pasar al siguiente nivel. */
  ready: boolean;
  /** Evidencias que no contaron y por qué. */
  ignored: Screened["ignored"];
}

export interface LevelState {
  /** Nivel general: 1, 2, 3… sin tope. */
  level: number;
  /** Fecha en que se llegó a ese nivel. */
  since: number;
}

/**
 * Puntos de una habilidad para la barra de su academia: demostrada 1, en desarrollo 0.5. Haber respondido sin
 * ningún acierto sin ayuda no mueve la barra: participar no es avanzar.
 */
const barPoints = (stage: MasteryStage) => (stage >= 3 ? 1 : stage === 2 ? 0.5 : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

function academyProgress(academy: AcademyId, estimates: SkillEstimate[]): AcademyProgress {
  const demonstrated = estimates.filter((e) => e.stage >= 3).length;
  const developing = estimates.filter((e) => e.stage === 2).length;
  const needed = Math.ceil(estimates.length * RULES.level.academyShare);
  const covered = estimates.length > 0 && demonstrated >= needed;
  const label: AcademyLabel = covered ? "suficiente" : demonstrated + developing > 0 ? "parcial" : "sin_evidencia";
  return {
    academy, skills: estimates.length, demonstrated, developing, pending: estimates.length - demonstrated - developing, needed,
    bar: estimates.length ? round2(estimates.reduce((n, e) => n + barPoints(e.stage), 0) / estimates.length) : 0,
    label, review: estimates.some((e) => e.stage >= 3 && e.freshness !== "vigente"), covered,
  };
}

/** Reto integrador que cuenta para el nivel: formato integrador, acierto sin ayuda, exigencia del nivel y al menos dos academias. */
export function integratorFor(counted: readonly Evidence[], demand: Demand, since?: number): Evidence | undefined {
  return counted.find((e) => e.activity.format === "integrador" && !e.aided && isPass(e) && e.level >= demand && (since === undefined || e.at >= since) && academiesOf(e).length >= RULES.level.integratorAcademies);
}

/** Habilidades que se exigen en un nivel. */
const skillsOfLevel = (demand: Demand): Skill[] => SKILLS.filter((s) => s.from <= demand);

export interface ProgressOptions { now: number; pauses?: readonly Pause[] }

/**
 * Progreso de la persona en su nivel: dominio de cada habilidad exigida, las seis barras y la barra general con
 * sus tres criterios. Del nivel 7 en adelante la exigencia es la del tramo 6 y solo cuenta evidencia nueva, es
 * decir, obtenida desde que se llegó al nivel.
 */
export function levelProgress(log: EvidenceLog, state: LevelState, opts: ProgressOptions): LevelProgress {
  const level = Math.max(1, Math.floor(state.level));
  const demand = tramoOf(level).n;
  const since = level > 6 ? state.since : undefined;
  const { counted, ignored } = screen(log);
  const skills = skillsOfLevel(demand).map((s) => estimateSkill(counted, s.id, demand, { now: opts.now, since, pauses: opts.pauses }));
  const academies = ACADEMIES.map((a) => academyProgress(a.id, skills.filter((e) => skillById(e.skill)!.academy === a.id)));
  const L = RULES.level;

  // 1 · Cobertura mínima en las seis academias. Una academia muy avanzada no compensa a otra rezagada.
  const uncovered = academies.filter((a) => !a.covered);
  const cobertura: Criterion = {
    id: "cobertura",
    text: `Cobertura mínima: en cada una de las seis academias, al menos ${Math.round(L.academyShare * 100)} % de sus habilidades del nivel demostradas.`,
    met: uncovered.length === 0,
    progress: round2(academies.reduce((n, a) => n + Math.min(1, a.needed ? a.demonstrated / a.needed : 0), 0) / academies.length),
    missing: uncovered.length ? `Falta cobertura en ${uncovered.map((a) => `${academyById(a.academy).name} (${a.demonstrated} de ${a.needed})`).join(", ")}.` : "",
  };

  // 2 · Evidencia suficiente: ninguna habilidad del nivel sin al menos un acierto sin ayuda.
  const below = skills.filter((e) => e.stage < 2);
  const evidencia: Criterion = {
    id: "evidencia",
    text: "Evidencia suficiente: todas las habilidades del nivel con al menos un acierto sin ayuda en la exigencia del nivel.",
    met: below.length === 0,
    progress: round2(skills.length ? (skills.length - below.length) / skills.length : 0),
    missing: below.length ? `${plural(below.length, "habilidad todavía no tiene", "habilidades todavía no tienen")} un acierto sin ayuda en este nivel.` : "",
  };

  // 3 · Reto integrador apropiado al nivel.
  const integrator = integratorFor(counted, demand, since);
  const integrador: Criterion = {
    id: "integrador",
    text: `Reto integrador: un reto del nivel que cruce al menos ${L.integratorAcademies} academias, resuelto sin ayuda.`,
    met: !!integrator,
    progress: integrator ? 1 : 0,
    missing: integrator ? "" : "Falta resolver sin ayuda un reto integrador de este nivel.",
  };

  const criteria = [cobertura, evidencia, integrador];
  const ready = criteria.every((c) => c.met);
  const raw = criteria.reduce((n, c) => n + L.weights[c.id] * c.progress, 0);
  // La barra solo se llena con los tres criterios cumplidos; si falta alguno, se queda un paso antes.
  const bar = ready ? 1 : Math.min(0.99, round2(raw));
  return { rules: MASTERY_RULES_VERSION, level, demand, skills, academies, criteria, bar, ready, ignored };
}

/**
 * Nivel que corresponde después de revisar las evidencias. Sube un nivel a la vez y solo si se cumplen los tres
 * criterios. Aquí nunca baja: la ausencia o un mal día no quitan el nivel alcanzado.
 */
export function nextLevelState(log: EvidenceLog, state: LevelState, opts: ProgressOptions): LevelState {
  return levelProgress(log, state, opts).ready ? { level: Math.max(1, Math.floor(state.level)) + 1, since: opts.now } : state;
}

// ───────────────────────────────────────────── estados para el perfil y el CV

/**
 * - «respaldado»: demostrada con evaluaciones en algún nivel;
 * - «en_desarrollo»: hay evidencias, todavía insuficientes;
 * - «declarado»: la persona dice tenerla y no hay evaluaciones que la respalden;
 * - «sin_evidencia»: ni declarada ni evaluada.
 * Lo declarado nunca sube el dominio.
 */
export type SkillStatus = "sin_evidencia" | "declarado" | "en_desarrollo" | "respaldado";
export const SKILL_STATUS_TEXT: Record<SkillStatus, string> = { sin_evidencia: "Sin evidencia", declarado: "Declarado", en_desarrollo: "En desarrollo", respaldado: "Respaldado por evaluaciones" };

export interface SkillStanding {
  skill: string;
  status: SkillStatus;
  declared: boolean;
  /** Nivel más alto en el que la habilidad está demostrada. */
  provenLevel?: Demand;
  /** Estimación en ese nivel o, si no hay ninguno demostrado, en el primero en que se exige. */
  estimate: SkillEstimate;
}

export function skillStanding(log: EvidenceLog, skillId: string, opts: ProgressOptions & { declared?: readonly string[] }): SkillStanding {
  const def = skillById(skillId);
  if (!def) throw new Error(`Habilidad desconocida: ${skillId}.`);
  const { counted } = screen(log);
  const declared = !!opts.declared?.includes(skillId);
  for (let d = 6; d >= def.from; d--) {
    const estimate = estimateSkill(counted, skillId, d as Demand, opts);
    if (estimate.stage >= 3) return { skill: skillId, status: "respaldado", declared, provenLevel: d as Demand, estimate };
  }
  const estimate = estimateSkill(counted, skillId, def.from, opts);
  const status: SkillStatus = estimate.coverage.any > 0 ? "en_desarrollo" : declared ? "declarado" : "sin_evidencia";
  return { skill: skillId, status, declared, estimate };
}

/** Estado de todas las habilidades del catálogo. */
export const allStandings = (log: EvidenceLog, opts: ProgressOptions & { declared?: readonly string[] }): SkillStanding[] => SKILLS.map((s) => skillStanding(log, s.id, opts));
