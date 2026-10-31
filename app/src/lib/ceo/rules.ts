/**
 * mêtis CEO · reglas versionadas (Fase 0.4).
 *
 * Cada temporada guarda con qué versión de reglas empezó (`CeoState.rulesVersion`, y cada
 * `CareerRun` cerrada la conserva). Así, si mañana se recalibra la dificultad o el XP:
 *  - una temporada en curso NO cambia de reglas en caliente,
 *  - las empresas ya cerradas se siguen leyendo con las reglas con que se jugaron,
 *  - las partidas doradas legacy se reproducen idénticas.
 *
 * Para cambiar reglas: se agrega una versión nueva a RULESETS y se sube RULES_VERSION.
 * Nunca se edita una versión publicada.
 */
import type { CrisisRating } from "./types";

export interface XpTable { decision: number; perPoint: number; onTime: number; lesson: number; dilemma: number; dilemmaPoint: number }

export interface RuleSet {
  version: number;
  /** Fórmula de exigencia por nivel (tier). */
  tier: {
    max: number;
    hitPerTier: number;
    gainPerTier: number; gainFloor: number;
    deadlinePerTier: number; deadlineFloor: number;
    passBase: number; passPerTier: number; passMax: number;
    names: string[];
  };
  /** Proporción mínima de asuntos respondidos para aprobar. */
  minAnswered: number;
  /** Plazo por omisión de un asunto (horas) y plazo mínimo tras escalar por nivel. */
  defaultDeadlineH: number;
  minDeadlineH: number;
  xp: XpTable;
  crisisXp: Record<CrisisRating, number>;
  /**
   * XP por participación (desde v2). Sin este bloque = reglas legacy.
   *  - finish: bono por terminar una empresa (el veredicto se comunica aparte).
   *  - oncePerCompany: el mismo asunto, la misma crisis o el mismo cierre no vuelven a dar XP si repites la empresa.
   */
  participation?: { finish: number; oncePerCompany: boolean; lessonsPerDay: number };
  /**
   * Casos ejecutivos en la temporada (desde v3). Sin este bloque, los episodios no llegan a la temporada
   * y, si se juegan, son práctica (no mueven indicadores ni XP).
   *  - xpDecision / xpClose: XP del episodio en la temporada (por decisión comprometida y por cerrarlo).
   *  - required: el reto final no se abre hasta cerrar los casos ejecutivos que ya llegaron.
   */
  episodes?: { xpDecision: number; xpClose: number; required: boolean };
  /**
   * Tipo de carrera (desde v4). Sin dato = «temporadas»: al aprobar, `advance()` te lleva a otra empresa.
   * «continua»: una sola empresa persistente; cerrar un periodo nunca cambia de empresa ni sube la exigencia.
   */
  career?: "temporadas" | "continua";
}

/** Versión 1 · reglas legacy (v2 del simulador, octubre 2026). Congeladas: no editar. */
const V1: RuleSet = Object.freeze({
  version: 1,
  tier: Object.freeze({
    max: 6,
    hitPerTier: 0.08,
    gainPerTier: 0.03, gainFloor: 0.85,
    deadlinePerTier: 0.1, deadlineFloor: 0.5,
    passBase: 50, passPerTier: 2, passMax: 60,
    names: Object.freeze(["Director debutante", "Director con oficio", "Director probado", "Director de alto riesgo", "Director de crisis", "Legendario", "Legendario+"]) as string[],
  }),
  minAnswered: 0.8,
  defaultDeadlineH: 24,
  minDeadlineH: 3,
  xp: Object.freeze({ decision: 20, perPoint: 10, onTime: 5, lesson: 30, dilemma: 10, dilemmaPoint: 5 }),
  crisisXp: Object.freeze({ contenida: 60, danos: 30, rebaso: 10 }),
}) as RuleSet;

/**
 * Versión 2 · «XP v3» por participación y vencimiento sin castigos apilados (Fase 1.3).
 *  - XP por participar, no por elegir «la buena». Proporciones de la auditoría (6.2: asunto 10, lección 15,
 *    dilema 10, reto integrador 30, empresa terminada 50) ×2, para quedar en la MISMA escala que el XP legacy
 *    (20 por decisión, 30 por lección, 60 por crisis): rangos, etapas y ranking no cambian de umbral y nadie
 *    queda con dos escalas mezcladas.
 *  - Sin bono por rapidez: decidir antes no es decidir mejor.
 *  - Idempotente: repetir la misma empresa no vuelve a pagar los mismos asuntos, su crisis ni su cierre;
 *    y como mucho `lessonsPerDay` lecciones pagan XP en un mismo día.
 *  - Dejar vencer asuntos tiene consecuencias en la empresa, pero no reprueba por sí solo (minAnswered 0).
 *  - La exigencia por nivel (tier) no cambia aquí; dificultad por complejidad llega con DecisionSpec (1.4).
 * Valores iniciales configurables y no validados; se recalibran con una versión nueva, nunca editando esta.
 */
const V2: RuleSet = Object.freeze({
  version: 2,
  tier: V1.tier,
  minAnswered: 0,
  defaultDeadlineH: 24,
  minDeadlineH: 3,
  xp: Object.freeze({ decision: 20, perPoint: 0, onTime: 0, lesson: 30, dilemma: 20, dilemmaPoint: 0 }),
  crisisXp: Object.freeze({ contenida: 60, danos: 60, rebaso: 60 }),
  participation: Object.freeze({ finish: 100, oncePerCompany: true, lessonsPerDay: 5 }),
}) as RuleSet;

/**
 * Versión 3 · casos ejecutivos en la carrera normal (P0 aprobado).
 *  - Igual que v2 en exigencia, XP de asuntos, crisis, lecciones y cierre.
 *  - En Botanas Cumbre llegan tres casos ejecutivos (SuperNorte sustituye al asunto de una decisión del día 2;
 *    Diego y el lote L-2291 se suman). Al cerrarlos, su efecto en indicadores se aplica a la temporada
 *    (con la misma exigencia por nivel que los asuntos) y dan el XP de su diseño: 20 por decisión + 40 al cerrar
 *    (100–160 por caso, unos 7 minutos de juego, igual que EPISODE_XP). Una vez por empresa, igual que los asuntos.
 *  - Los casos ejecutivos no vencen; el reto final se abre cuando los cierras.
 * Las temporadas que empezaron con v2 siguen con v2 hasta terminar.
 */
const V3: RuleSet = Object.freeze({
  ...V2,
  version: 3,
  episodes: Object.freeze({ xpDecision: 20, xpClose: 40, required: true }),
}) as RuleSet;

/**
 * Versión 4 · carrera continua (P0-B2, esqueleto). Igual que v3 en exigencia, XP, crisis y casos ejecutivos;
 * cambia solo el tipo de carrera: la empresa es tuya y persiste. No es la versión por omisión: la usan solo
 * las partidas en modo «continua» (detrás del interruptor carrera_continua). Las temporadas siguen en v3.
 */
const V4: RuleSet = Object.freeze({
  ...V3,
  version: 4,
  career: "continua",
}) as RuleSet;

/** Reglas de todas las partidas guardadas antes de que existiera `rulesVersion`. */
export const LEGACY_RULES_VERSION = 1;
/** Versión con la que empiezan las temporadas nuevas. */
export const RULES_VERSION = 3;
/** Versión con la que empiezan los periodos de la carrera continua. */
export const CONTINUOUS_RULES_VERSION = 4;

/** Todas las versiones publicadas. Las pruebas pueden registrar una versión simulada. */
export const RULESETS: Record<number, RuleSet> = { 1: V1, 2: V2, 3: V3, 4: V4 };

export const isRulesVersion = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1;
/** ¿Este código conoce esa versión? (una partida guardada por una versión más nueva de la app no lo sería). */
export const knownRules = (v: unknown): boolean => isRulesVersion(v) && !!RULESETS[v];

/**
 * Reglas de una versión. Sin versión = legacy (nunca la actual: así lo viejo no cambia).
 * Una versión desconocida y mayor (guardada por una app más nueva) usa la más alta conocida que no la supere.
 */
export function ruleSet(version?: number | null): RuleSet {
  if (!isRulesVersion(version)) return RULESETS[LEGACY_RULES_VERSION];
  if (RULESETS[version]) return RULESETS[version];
  const lower = Object.keys(RULESETS).map(Number).filter((k) => k <= version).sort((a, b) => b - a)[0];
  return RULESETS[lower ?? LEGACY_RULES_VERSION];
}

/** Exigencia de un nivel con las reglas de una versión. */
export function tierRules(tier: number, version?: number | null) {
  const R = ruleSet(version);
  const T = R.tier;
  const t = Math.max(0, Math.min(tier, T.max));
  return {
    tier: t,
    hit: 1 + T.hitPerTier * t,
    gain: Math.max(T.gainFloor, 1 - T.gainPerTier * t),
    deadline: Math.max(T.deadlineFloor, 1 - T.deadlinePerTier * t),
    passLine: Math.min(T.passMax, T.passBase + T.passPerTier * t),
    minAnswered: R.minAnswered,
    name: T.names[t],
    version: R.version,
  };
}
