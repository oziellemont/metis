/**
 * mêtis CEO · Executive Journey.
 *
 * Tu cargo. Seis etapas profesionales y, después, The Executive Arena. Cada ascenso es un
 * NOMBRAMIENTO: se gana cumpliendo tres tipos de requisito a la vez:
 *  - Simulador: empresas aprobadas y retos superados.
 *  - Mastery: dominio demostrado en las 8 competencias (ver mastery.ts).
 *  - Constancia: un mínimo de XP. Es solo un piso: el XP por sí solo nunca asciende a nadie.
 *
 * Usuarios que ya jugaban antes del Journey: al inscribirse (`enrollJourney`) se congela su rango
 * anterior. Nunca quedan por debajo de su equivalente, y ese rango queda como distinción de la
 * temporada fundadora. Del siguiente ascenso en adelante aplican las reglas nuevas para todos.
 *
 * Lógica pura y determinista. El estado del Journey es opcional en `CeoState` (`journey`), así que
 * las partidas existentes y las partidas doradas no cambian.
 */
import type { CareerRun, CeoState, JourneyState } from "./types";
import { LEVELS, levelOf, nowOf, xpOf } from "./engine";
import { COMPETENCY_IDS, countAtLeast, masteryOf, weakestFirst, type Competency, type Mastery } from "./mastery";
import { companyById } from "./companies";

export const STAGES = [
  { id: "emerging", name: "Emerging Leader", es: "Líder emergente" },
  { id: "functional", name: "Functional Manager", es: "Gerente funcional" },
  { id: "bu", name: "Business Unit Director", es: "Director de unidad de negocio" },
  { id: "coo", name: "Chief Operating Officer", es: "Director de operaciones" },
  { id: "ceo", name: "Chief Executive Officer", es: "Director General" },
  { id: "global", name: "Global CEO", es: "CEO global" },
] as const;
export const LAST_STAGE = STAGES.length - 1;
export type StageId = (typeof STAGES)[number]["id"];

// ───────────────────────────────────────────── requisitos de cada nombramiento
export interface StageRule {
  /** Empresas aprobadas (en total, a lo largo de la carrera). */
  passed?: number;
  /** Proyectos de cambio logrados. */
  changeOk?: number;
  /** Empresas aprobadas con exigencia alta (tier ≥ 2). */
  highTier?: number;
  /** Junta ante el Consejo superada. */
  board?: boolean;
  /** Empresa aprobada en modo Legendario o empresa internacional. */
  legendary?: boolean;
  /** Al menos `n` competencias con `min` o más. */
  atLeast?: { n: number; min: number }[];
  /** Competencias específicas con un mínimo. */
  specific?: Partial<Record<Competency, number>>;
  /** XP mínimo (constancia). */
  xp?: number;
}
/** Requisitos para LLEGAR a cada etapa (índice = etapa destino). La 0 es el punto de partida. */
export const STAGE_RULES: StageRule[] = [
  {},
  { passed: 1, atLeast: [{ n: 2, min: 40 }], xp: 100 },
  { passed: 2, changeOk: 1, atLeast: [{ n: 4, min: 40 }], specific: { personas: 55 }, xp: 300 },
  { passed: 3, highTier: 1, atLeast: [{ n: 6, min: 40 }], specific: { ejecucion: 60, finanzas: 60 }, xp: 600 },
  { passed: 4, board: true, atLeast: [{ n: 8, min: 55 }, { n: 3, min: 70 }], xp: 1000 },
  { legendary: true, atLeast: [{ n: 8, min: 65 }, { n: 2, min: 85 }], xp: 1600 },
];
const HIGH_TIER = 2;

/** Rango anterior (por XP) → etapa mínima garantizada. Gerente, Director de área, Director General, CEO, CEO de consejo. */
export const LEGACY_FLOOR = [0, 1, 2, 4, 4] as const;

// ───────────────────────────────────────────── hechos de la carrera
/** Una empresa aprobada en modo Legendario: su exigencia lleva el +1 extra del modo. */
function legendaryRuns(career: CareerRun[], startTier = 0): CareerRun[] {
  let passedBefore = 0;
  const out: CareerRun[] = [];
  for (const r of career) {
    // Antes del primer ascenso, la exigencia elegida al empezar (perfil V33) no cuenta como Legendario.
    const expected = passedBefore === 0 ? passedBefore + startTier : passedBefore;
    if (r.passed && (r.tier > expected || companyById(r.company).international)) out.push(r);
    if (r.passed) passedBefore++;
  }
  return out;
}
export function careerFacts(s: CeoState) {
  const career = s.career ?? [];
  const passed = career.filter((r) => r.passed);
  return {
    passed: passed.length,
    changeOk: career.filter((r) => r.change?.ok).length,
    highTier: passed.filter((r) => r.tier >= HIGH_TIER).length,
    legendary: legendaryRuns(career, s.startTier ?? 0).length,
    board: !!s.journey?.board?.passed,
  };
}

export type ReqGroup = "empresas" | "retos" | "competencias" | "constancia";
export interface Requirement {
  id: string;
  group: ReqGroup;
  label: string;
  have: number;
  need: number;
  ok: boolean;
  /** Competencia(s) que faltan, para orientar la práctica. */
  missing?: Competency[];
  /** Dónde se cumple este requisito dentro de la app. */
  href?: string;
}

export function requirementsFor(target: number, s: CeoState, now = nowOf(s), m: Mastery = masteryOf(s, now)): Requirement[] {
  const rule = STAGE_RULES[target];
  if (!rule) return [];
  const f = careerFacts(s);
  const out: Requirement[] = [];
  const cont = s.careerMode === "continua" && !!s.companyProfile;
  if (rule.passed) out.push({ id: "passed", group: "empresas", label: cont ? "Periodos aprobados" : "Empresas aprobadas", have: f.passed, need: rule.passed, ok: f.passed >= rule.passed });
  if (rule.changeOk) out.push({ id: "change", group: "retos", label: "Reto de cambio logrado", have: f.changeOk, need: rule.changeOk, ok: f.changeOk >= rule.changeOk });
  if (rule.highTier) out.push({ id: "highTier", group: "retos", label: cont ? "Periodo aprobado con exigencia alta" : "Empresa aprobada con exigencia alta", have: f.highTier, need: rule.highTier, ok: f.highTier >= rule.highTier });
  if (rule.board) out.push({ id: "board", group: "retos", label: "Junta ante el Consejo", have: f.board ? 1 : 0, need: 1, ok: f.board, href: "/ceo/junta" });
  if (rule.legendary) out.push({ id: "legendary", group: "retos", label: "Empresa internacional o modo Legendario", have: Math.min(1, f.legendary), need: 1, ok: f.legendary >= 1 });
  for (const a of rule.atLeast ?? []) {
    const have = countAtLeast(m, a.min);
    const missing = have >= a.n ? [] : weakestFirst(m).filter((c) => m[c].value < a.min).slice(0, a.n - have);
    out.push({ id: `atLeast-${a.min}`, group: "competencias", label: a.n === COMPETENCY_IDS.length ? `Las 8 competencias en ${a.min} o más` : `${a.n} competencias en ${a.min} o más`, have: Math.min(have, a.n), need: a.n, ok: have >= a.n, missing });
  }
  for (const [c, min] of Object.entries(rule.specific ?? {}) as [Competency, number][]) {
    out.push({ id: `skill-${c}`, group: "competencias", label: `${m[c].name} en ${min} o más`, have: m[c].value, need: min, ok: m[c].value >= min, missing: m[c].value >= min ? [] : [c] });
  }
  if (rule.xp) { const xp = xpOf(s, now); out.push({ id: "xp", group: "constancia", label: "Constancia", have: xp, need: rule.xp, ok: xp >= rule.xp }); }
  return out;
}

// ───────────────────────────────────────────── etapa actual y siguiente nombramiento
/** Etapa del rango anterior (por XP) para quien jugaba antes del Journey. */
export const legacyStageOf = (rank: number) => LEGACY_FLOOR[Math.max(0, Math.min(rank, LEGACY_FLOOR.length - 1))];

/** Etapa actual (0 = Emerging Leader). Solo cambia con un nombramiento; nunca baja del piso fundador. */
export function stageOf(s: CeoState): number {
  const j = s.journey;
  if (!j) return 0;
  return Math.max(0, Math.min(LAST_STAGE, Math.max(j.stage, j.founder ? legacyStageOf(j.founder.rank) : 0)));
}

export interface JourneyView {
  stage: number;
  name: string;
  es: string;
  /** Siguiente etapa (o null si ya eres Global CEO). */
  next: { stage: number; name: string; es: string } | null;
  requirements: Requirement[];
  met: number;
  total: number;
  /** ¿Ya puedes ir a la junta de nombramiento? */
  ready: boolean;
  /** Competencia que más te está frenando (para la tarjeta de enfoque de la Academy). */
  focus: Competency | null;
  arena: boolean;
  founder: JourneyState["founder"] | null;
}
export function journeyOf(s: CeoState, now = nowOf(s), m: Mastery = masteryOf(s, now)): JourneyView {
  const stage = stageOf(s);
  const st = STAGES[stage];
  const nx = stage < LAST_STAGE ? stage + 1 : null;
  const requirements = nx === null ? [] : requirementsFor(nx, s, now, m);
  const met = requirements.filter((r) => r.ok).length;
  const blocking = requirements.filter((r) => !r.ok && r.missing?.length).flatMap((r) => r.missing!);
  const focus = blocking.length ? blocking.slice().sort((a, b) => m[a].value - m[b].value)[0] : null;
  return {
    stage, name: st.name, es: st.es,
    next: nx === null ? null : { stage: nx, name: STAGES[nx].name, es: STAGES[nx].es },
    requirements, met, total: requirements.length, ready: nx !== null && requirements.length > 0 && met === requirements.length,
    focus, arena: stage === LAST_STAGE, founder: s.journey?.founder ?? null,
  };
}

// ───────────────────────────────────────────── acciones
/**
 * Inscribe al jugador en el Journey (una sola vez). Si ya jugaba, congela su rango anterior como
 * distinción fundadora y como piso de etapa. Un jugador nuevo empieza como Emerging Leader.
 */
export function enrollJourney(s: CeoState, now = nowOf(s)): CeoState {
  if (s.journey) return s;
  const xp = xpOf(s, now);
  const played = (s.career ?? []).length > 0 || Object.keys(s.decisions ?? {}).length > 0 || Object.keys(s.lessons ?? {}).length > 0 || Object.keys(s.dilemmas ?? {}).length > 0;
  const rank = levelOf(xp).i;
  const founder = played && rank > 0 ? { rank, name: LEVELS[rank].name, xp, at: now } : undefined;
  const stage = founder ? legacyStageOf(rank) : 0;
  return { ...s, journey: { stage, enrolledAt: now, appointments: stage > 0 ? [{ stage, at: now, legacy: true }] : [], ...(founder ? { founder } : {}) } };
}

/** Nombramiento: si cumples todo lo de la siguiente etapa, asciendes UNA etapa. Si no, no cambia nada. */
export function appoint(s: CeoState, now = nowOf(s)): CeoState {
  const e = enrollJourney(s, now);
  const v = journeyOf(e, now);
  if (!v.ready || !v.next) return s;
  const j = e.journey!;
  return { ...e, journey: { ...j, stage: v.next.stage, appointments: [...j.appointments, { stage: v.next.stage, at: now }] } };
}

/** Resultado de la Junta ante el Consejo (ver board.ts). Una vez superada, queda superada. */
export function recordBoard(s: CeoState, passed: boolean, now = nowOf(s)): CeoState {
  const e = enrollJourney(s, now);
  if (e.journey!.board?.passed) return e;
  return { ...e, journey: { ...e.journey!, board: { passed, at: now } } };
}
