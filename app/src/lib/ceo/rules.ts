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
  /** Rúbrica (desde v8): una opción de score 2 defendible se evalúa como criterio sólido con costo reconocido. */
  judgment?: { defensibleScore2: boolean };
  /**
   * Tipo de carrera (desde v4). Sin dato = «temporadas»: al aprobar, `advance()` te lleva a otra empresa.
   * «continua»: una sola empresa persistente; cerrar un periodo nunca cambia de empresa ni sube la exigencia.
   */
  career?: "temporadas" | "continua";
  /**
   * Motor y veredicto V5 (desde v5). Sin este bloque = motor y veredicto anteriores (cinco indicadores ≥ línea).
   *  - cashFlow: al cierre, el margen se convierte en caja: cada `perPoints` puntos de margen sobre la línea suman
   *    1 de caja (y por debajo restan), entre `min` y `max`. Un negocio rentable genera efectivo. `base` (desde v6):
   *    caja que genera la operación en un mes normal, antes del margen (sin dato = 0).
   *  - verdict: resultado del negocio con límites críticos (insolvencia, consejo, línea roja), objetivos del consejo,
   *    piso por indicador y salud promedio; más el criterio: proporción mínima de asuntos bien razonados.
   *  - mandateMargin: en la rúbrica, los indicadores que el consejo encargó (y la caja) se consideran «en riesgo»
   *    desde esta distancia a la línea.
   */
  v5?: {
    cashFlow: { perPoints: number; min: number; max: number; base?: number };
    verdict: { insolvency: number; boardLost: number; floorBelowLine: number; healthAboveLine: number; minJudgment: number };
    mandateMargin: number;
  };
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

/**
 * Versión 5 · motor y veredicto V5 (temporadas nuevas). Igual que v3 en exigencia, XP, crisis y casos ejecutivos.
 * Cambia cómo se decide aprobar, con base en la simulación de 12 estrategias × 6 empresas (docs/editorial):
 *  - Ya no basta tener los cinco indicadores ≥ línea, ni un indicador en 49 reprueba una empresa sana.
 *    Se exige: caja sin insolvencia, consejo que te sostiene, ninguna línea roja, los dos objetivos que el consejo
 *    te encargó ≥ línea, ningún indicador por debajo del piso, salud promedio con holgura…
 *  - …y criterio: al menos el 60 % de los asuntos bien razonados según la rúbrica contextual (vencidos cuentan en
 *    contra). Al azar ya no se aprueba por suerte; elegir solo por números o por «la opción más larga» tampoco.
 *  - El margen genera caja al cierre (antes, una empresa rentable podía quedarse sin caja sin ningún efecto del margen).
 * Las temporadas que empezaron con v3 siguen con v3 hasta terminar; la carrera continua sigue en v4.
 */
const V5: RuleSet = Object.freeze({
  ...V3,
  version: 5,
  v5: Object.freeze({
    cashFlow: Object.freeze({ perPoints: 3, min: -5, max: 6 }),
    verdict: Object.freeze({ insolvency: 40, boardLost: 40, floorBelowLine: 10, healthAboveLine: 12, minJudgment: 0.6 }),
    mandateMargin: 12,
  }),
}) as RuleSet;

/**
 * Versión 6 · motor y veredicto V5 en la carrera continua. Igual que v5 en todo (veredicto por encargo del consejo,
 * salud y criterio; flujo de caja al cierre; alertas), con la carrera continua de v4 (una sola empresa que persiste).
 * Solo la usan los periodos que EMPIEZAN después de publicarse: el periodo en curso conserva la versión con que
 * empezó (v4) y los periodos cerrados se siguen leyendo con la suya. Nada se recalifica.
 * Tres ajustes sobre v5, calibrados con la simulación de carrera continua (docs/editorial/simulacion-temporadas.json):
 *  - La línea del consejo se queda en 50 en todas las etapas (la exigencia de la etapa sigue subiendo: los golpes pegan
 *    más fuerte, las buenas noticias rinden menos y los plazos se acortan). Con la línea subiendo cada etapa, un buen
 *    director reprobaba al tercer mes aunque decidiera igual de bien.
 *  - Cada mes arranca del tablero de la empresa, pero llegan los casos del banco y varios cuestan caja. Aquí la operación
 *    genera 2 de caja al mes y el margen suma 1 más por cada 2 puntos sobre la línea (entre −5 y +10).
 *  - Salud promedio con 8 puntos de holgura sobre la línea (v5 pide 12).
 * Lo demás no cambia: insolvencia, consejo, línea roja, encargo del consejo, piso y 60 % de criterio.
 */
const V6: RuleSet = Object.freeze({
  ...V5,
  version: 6,
  career: "continua",
  tier: Object.freeze({ ...V5.tier, passPerTier: 0 }),
  v5: Object.freeze({
    cashFlow: Object.freeze({ perPoints: 2, min: -5, max: 10, base: 2 }),
    verdict: Object.freeze({ insolvency: 40, boardLost: 40, floorBelowLine: 10, healthAboveLine: 8, minJudgment: 0.6 }),
    mandateMargin: 12,
  }),
}) as RuleSet;

/**
 * Versión 7 · auditoría ética del veredicto continuo. Igual que v6 en todos los números (no se movió ningún umbral);
 * lo único que cambia es qué opciones cuentan como línea roja: engañar al cliente sobre lo que se le entrega,
 * represalias contra quien denuncia, explicaciones falsas al equipo sobre su nómina, mantener una fecha que solo se
 * cumple haciendo trampa y ocultar un error atribuyéndolo a otro (ver RED_LINES y BANK_RED_LINES en editorial.ts,
 * marcadas `since: 7`). Hallazgo: la estrategia «solo números» aprobaba 76.7 % de los meses en v6 eligiendo varias
 * de esas opciones. Los periodos v6 conservan su calificación.
 */
const V7: RuleSet = Object.freeze({ ...V6, version: 7 }) as RuleSet;

/**
 * Versión 8 · coherencia y aprendizaje (ciclo 3). Mismos umbrales que v6/v7 (no se movió ninguno). Cambia:
 *  - Causalidad: un beneficio que depende de que la contraparte acepte o de cobrar llega cuando responde, no al
 *    decidir (`Option.pending`, revisiones `since: 8` de los asuntos).
 *  - Rúbrica: una opción con score 2 que es defendible (no cruza línea roja, ninguna otra la domina y su balance
 *    esperado queda dentro de la banda editorial de la mejor) se evalúa como criterio sólido con costo reconocido.
 *    Así MÊTIS no enseña que hay una sola respuesta que adivinar.
 *  - Omisión: en asuntos éticos donde dejar vencer equivale a la conducta de la línea roja, vencer también cuenta.
 *  - Dosificador: avisar y reponer todo, o avisar y medir antes de reponer, son ambas respuestas sólidas.
 *  - Cadena profunda de Forja (inventario → faltante → cliente → consejo).
 * Los periodos v4–v7 conservan su calificación: nada se recalifica.
 */
const V8: RuleSet = Object.freeze({ ...V7, version: 8, judgment: Object.freeze({ defensibleScore2: true }) }) as RuleSet;

/** Reglas de todas las partidas guardadas antes de que existiera `rulesVersion`. */
export const LEGACY_RULES_VERSION = 1;
/** Versión con la que empiezan las temporadas nuevas. */
export const RULES_VERSION = 5;
/** Versión con la que empiezan los periodos de la carrera continua (desde v6: veredicto V5). */
export const CONTINUOUS_RULES_VERSION = 8;
/**
 * Versión de los periodos continuos registrados SIN versión explícita (jugadas anteriores a v6). Así, al reproducir
 * el diario de una carrera, un cierre o una empresa creada antes de v6 sigue abriendo periodos v4: nada cambia en
 * retrospectiva.
 */
export const LEGACY_CONTINUOUS_RULES_VERSION = 4;

/** Todas las versiones publicadas. Las pruebas pueden registrar una versión simulada. */
export const RULESETS: Record<number, RuleSet> = { 1: V1, 2: V2, 3: V3, 4: V4, 5: V5, 6: V6, 7: V7, 8: V8 };
/** Versión de la ronda de coherencia (activa desde nov-2026: es la versión continua vigente). */
export const COHERENCE_RULES_VERSION = 8;

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
