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

/** Reglas de todas las partidas guardadas antes de que existiera `rulesVersion`. */
export const LEGACY_RULES_VERSION = 1;
/** Versión con la que empiezan las temporadas nuevas. */
export const RULES_VERSION = 1;

/** Todas las versiones publicadas. Las pruebas pueden registrar una versión simulada. */
export const RULESETS: Record<number, RuleSet> = { 1: V1 };

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
