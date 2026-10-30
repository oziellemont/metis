/**
 * mêtis CEO · Executive Decision Episodes (adenda v3.3) · contratos versionados.
 *
 * Un episodio es UN caso ejecutivo completo dentro de una sola tarjeta: briefing (hasta 2 consultas de
 * hechos + 1 consulta a un colaborador, ventana de 180 s), y luego 3 a 6 decisiones sustantivas conectadas.
 *
 * Separación de responsabilidades (adenda §5):
 *  - Narrativa: EpisodeSpec / EpisodeNode / Strategy deciden qué rutas existen (contenido autorado y versionado).
 *  - Simulación: las reglas económicas del caso (episodes/<caso>.ts) calculan acuerdos, riesgos y efectos en KPI
 *    SOLO al cerrar y SOLO con fórmulas declaradas. Ninguna respuesta suelta mueve indicadores.
 *  - Aprendizaje: LearningEvidence guarda la rúbrica por decisión, separada de XP y del resultado del negocio.
 *  - IA conversacional: interpreta texto libre y da voz a personajes; jamás crea hechos ni cifras. Todo lo que
 *    devuelve se valida contra estos contratos (episodes/ai.ts) y, si falla, se usa el contenido autorado.
 *
 * Todo es serializable (JSON) para poder guardarlo en la partida y, más adelante, en tablas de Supabase.
 */
import type { Area, CastId, Channel, KpiKey } from "../types";

export const EPISODE_CONTRACT_VERSION = 1 as const;

/** Ventana de preparación (adenda §3.3). Solo cuenta para las consultas; nunca elige por ti. */
export const BRIEFING_MS = 180_000;
export const MAX_FACT_QUERIES = 2;
export const MAX_ADVISOR_CONSULTS = 1;
export const MIN_DECISIONS = 3;
export const MAX_DECISIONS = 6;

/** Rúbrica de razonamiento (adenda §7). Nunca premia por sonar diplomático: cada nivel exige una base observable. */
export const RUBRIC = ["problema", "informacion", "riesgos", "alternativas", "consecuencias", "negociacion", "coherencia", "ejecucion", "adaptacion"] as const;
export type RubricDim = (typeof RUBRIC)[number];
export const RUBRIC_LABEL: Record<RubricDim, string> = {
  problema: "Identificación del problema",
  informacion: "Uso de la información",
  riesgos: "Reconocimiento de riesgos",
  alternativas: "Evaluación de alternativas",
  consecuencias: "Comprensión de consecuencias",
  negociacion: "Negociación",
  coherencia: "Coherencia del argumento",
  ejecucion: "Plan de ejecución",
  adaptacion: "Adaptación",
};

// ───────────────────────────────────────────── condiciones y textos con memoria
/**
 * Condición sobre la memoria del episodio. Cada cadena es una bandera (`escucha`) o una comparación con un
 * término o la confianza (`plazo>60`, `descuento>=3`, `trust<0`). `all`: todas; `any`: al menos una; `none`: ninguna.
 */
export interface Cond { all?: string[]; any?: string[]; none?: string[] }
/**
 * Texto con variantes: se usa la primera cuya condición se cumple. Admite marcadores `{t:clave}` que se
 * sustituyen por el término acordado con su unidad (así los personajes recuerdan lo pactado).
 */
export interface Variant { when?: Cond; text: string[] }

// ───────────────────────────────────────────── briefing
/** Hecho verificable del caso (FactBank). La IA solo puede citar estos textos. */
export interface Fact {
  id: string;
  /** Pregunta sugerida que ve el jugador. */
  label: string;
  /** Palabras que reconocen la pregunta escrita (sin acentos, minúsculas). */
  keywords: string[];
  answer: string;
  /** Quién lo sabe (o «datos»: sistema de la empresa). */
  source: CastId | "datos";
  /** Indispensable por seguridad o ley: se muestra siempre y no consume consulta (adenda §3.3). */
  critical?: boolean;
}
/** Dato que el caso declara inexistente: pedirlo no lo crea (se responde con honestidad). */
export interface Unknown { id: string; keywords: string[]; answer: string }
export interface FactBank { version: number; facts: Fact[]; unknowns: Unknown[]; /** Respuesta cuando la pregunta no corresponde a nada. */ missing: string }

/** Perspectiva de un colaborador (AdvisorBrief). Enriquece el criterio; no revela «la respuesta». */
export interface AdvisorBrief {
  id: CastId;
  /** Su función y lo que realmente sabe. */
  role: string;
  personality: string;
  interests: string;
  relations: string;
  /** Hechos a los que tiene acceso (ids del FactBank). */
  knows: string[];
  /** Respuesta autorada (también es el respaldo si la IA falla). Puede variar con la historia del jugador. */
  view: Variant[];
}

// ───────────────────────────────────────────── decisiones
/** Parámetro ajustable de una propuesta (descuento, plazo, inversión…), siempre con límites. */
export interface ParamSpec { key: string; label: string; min: number; max: number; step: number; default: number; unit: string; hint?: string }
export interface Evidence { dim: RubricDim; level: 0 | 1 | 2 | 3; basis: string }
/** Evidencia que solo cuenta si, después de aplicar los términos, se cumple `when`. */
export interface EvidenceRule extends Evidence { when?: Cond }
export interface Commitment { id: string; text: string; owner: CastId | "ceo" }
export interface Risk { id: string; text: string; owner?: CastId | "ceo" }
export interface Branch { when?: Cond; to: string }

/** Estrategia admisible de una decisión. El texto libre siempre se acerca a una de estas. */
export interface Strategy {
  id: string;
  text: string;
  /** Solo se ofrece si se cumple (p. ej. ceder lo último solo si aún hay diferencia). */
  requires?: Cond;
  /** Términos fijos que establece y parámetros que el jugador puede ajustar. */
  set?: Record<string, number>;
  params?: ParamSpec[];
  flags?: string[];
  /** Cambio de confianza con el interlocutor (−2…+2). No es un KPI. */
  trust?: number;
  /** Respuesta del personaje (con memoria). */
  reply: Variant[];
  /** Siguiente nodo (o «close»): primera rama cuya condición se cumple. */
  next: Branch[];
  evidence: EvidenceRule[];
  commitments?: Commitment[];
  risks?: Risk[];
}

export interface RevealBlock { when?: Cond; title: string; rows: [string, string][]; note?: string }

/** Decisión sustantiva (EpisodeNode). */
export interface EpisodeNode {
  id: string;
  /** Etapa visible (Postura, Propuesta, Objeción…). */
  stage: string;
  who: CastId;
  channel: Channel;
  say: Variant[];
  /** Información nueva que aparece en este punto. */
  reveal?: RevealBlock[];
  ask: string;
  strategies: Strategy[];
  /** Acepta respuesta escrita (la IA la acerca a una estrategia; si falla, se elige a mano). */
  freeText: boolean;
}

/**
 * Obligación no negociable (seguridad, salud o ley). No es una opción más: el cierre dice si se cumplió o no,
 * con base en lo que el jugador hizo (`met`), y las reglas del caso cargan la consecuencia.
 */
export interface Obligation { id: string; text: string; met: Cond }

/** Seguimiento que llega después como nueva notificación (grafo de consecuencias, nivel 2). */
export interface FollowUpSpec { id: string; when?: Cond; afterDays: number; from: CastId; subject: string; text: Variant[] }

/** Identidad completa del caso (EpisodeSpec). */
export interface EpisodeSpec {
  contract: typeof EPISODE_CONTRACT_VERSION;
  id: string;
  /** Versión editorial (semver). Una partida guarda la versión con que se jugó. */
  version: string;
  /** borrador = solo vista previa; aprobado = Oziel lo autorizó para jugadores. */
  approval: "borrador" | "aprobado";
  company: string;
  industry: string;
  title: string;
  subject: string;
  from: CastId;
  /** Con quién se mide la confianza del caso (si no, con quien escribe). */
  counterpart?: CastId;
  channel: Channel;
  areas: Area[];
  cast: CastId[];
  /** Lección de Academy y concepto que enseña. */
  lesson: string;
  concept: { title: string; text: string; nota: string };
  /** Minutos estimados (para la meta diaria). */
  minutes: number;
  briefing: { message: string[]; context: { title: string; rows: [string, string][]; note?: string } };
  facts: FactBank;
  advisors: AdvisorBrief[];
  /** Banderas iniciales a partir de la temporada (p. ej. si ya comiste con Héctor). */
  history?: { flag: string; item: string; options: string[] }[];
  /** Factores fuera de tu control, reproducibles por partida (distinguir suerte de razonamiento). */
  chance?: { flag: string; p: number; label: string }[];
  /** Obligaciones no negociables del caso (crisis operativa o ética). Se muestran desde el inicio. */
  obligations?: Obligation[];
  /** Cifras que se recalculan en vivo mientras ajustas términos (clave del término y etiqueta). */
  preview?: { key: string; label: string }[];
  /** Cómo se escriben los términos en los textos. */
  terms: Record<string, { label: string; unit: string; initial: number; decimals?: number }>;
  start: string;
  nodes: Record<string, EpisodeNode>;
  followUps: FollowUpSpec[];
  /** Id de las reglas económicas que calculan el cierre (episodes/rules). */
  rules: string;
}

// ───────────────────────────────────────────── partida
export interface QueryTurn { at: number; text: string; factId: string | null; answer: string; via: "sugerida" | "libre" | "ia" }
export interface AdvisorTurn { at: number; id: CastId; question?: string; answer: string; via: "autor" | "ia" }

/** Una decisión comprometida (DecisionTurn). */
export interface DecisionTurn {
  at: number;
  node: string;
  stage: string;
  /** Lo que hizo el jugador: elegir, ajustar términos o escribir. */
  /** Lo que te dijeron en ese punto (para releer el hilo tal como lo viste). Opcional por compatibilidad. */
  said?: string[];
  input: { kind: "opcion" | "terminos" | "texto"; text?: string };
  strategy: string;
  terms?: Record<string, number>;
  /** Interpretación validada del texto libre (si hubo). */
  interpretation?: {
    quality: 0 | 1 | 2 | 3;
    feedback: string;
    /** clara: coincide con una estrategia; parcial: agrega algo que el caso no modela (extras). */
    status?: "clara" | "parcial";
    extras?: string;
    /** Tono hacia el interlocutor (±1 de confianza). */
    tone?: -1 | 1;
    /** La reacción mostrada fue adaptada a sus palabras; `authored` guarda la del autor (consecuencias idénticas). */
    adapted?: boolean;
    authored?: string[];
  };
  reply: string[];
}

/** Hecho persistente que deja el episodio en la empresa (CanonicalEvent). */
export interface CanonicalEvent {
  id: string;
  kind: "acuerdo" | "compromiso" | "riesgo" | "relacion" | "kpi" | "seguimiento";
  text: string;
  /** Causa: episodio, versión y (si aplica) decisión. */
  cause: { episode: string; version: string; node?: string; strategy?: string };
  at: number;
  /** Para seguimientos: cuándo se activa. */
  activatesAt?: number;
  /** Regla que lo justifica (fórmula o condición). */
  rule: string;
  data?: Record<string, number | string>;
}

export interface LearningEvidence extends Evidence { node: string; at: number; reliability: "autor" | "ia_provisional" }

export interface KpiChange { key: KpiKey; delta: number; why: string }

export interface EpisodeOutcome {
  /** Una frase con el resultado. */
  headline: string;
  agreement: [string, string][];
  economics: [string, string][];
  commitments: Commitment[];
  risks: Risk[];
  kpi: KpiChange[];
  events: CanonicalEvent[];
  evidence: LearningEvidence[];
  followUps: { id: string; at: number; from: CastId; subject: string; text: string[] }[];
  /** Separar razonamiento de suerte (adenda §7). */
  luck: string | null;
  /** Obligaciones no negociables y si se cumplieron. */
  obligations?: { id: string; text: string; met: boolean }[];
}

/** Estado de un episodio de un jugador (EpisodeRun). Vive en la partida y viaja con la sincronización. */
export interface EpisodeRun {
  contract: typeof EPISODE_CONTRACT_VERSION;
  episode: string;
  version: string;
  runId: string;
  startedAt: number;
  updatedAt: number;
  phase: "briefing" | "deciding" | "closed";
  paused: boolean;
  node: string | null;
  flags: string[];
  terms: Record<string, number>;
  trust: number;
  briefing: { mode: "estandar" | "flexible"; activeMs: number; resumedAt: number | null; endedAt: number | null };
  queries: QueryTurn[];
  advisor: AdvisorTurn | null;
  turns: DecisionTurn[];
  closedAt: number | null;
  outcome: EpisodeOutcome | null;
  /** XP del episodio: se fija una sola vez al cerrar (idempotente). */
  xp: number | null;
}
