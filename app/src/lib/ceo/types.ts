import type { InitialDiagnostic, ProfessionalProfile, ProfileNudge } from "./profile";
import type { EpisodeRun } from "./episodes/contracts";
/**
 * mêtis CEO · tipos del simulador (metisalign.app).
 * Todo lo de esta carpeta es independiente de mêtis (alineación): no importa nada de store/academy.
 */

export type KpiKey = "caja" | "margen" | "equipo" | "clientes" | "consejo";
export type Kpis = Record<KpiKey, number>;

/** Ejes del perfil de decisión (cada opción suma de −2 a +2). */
export type Axis = "horizonte" | "riesgo" | "foco" | "estilo" | "conflicto";

export type Channel = "email" | "whatsapp" | "reporte" | "junta" | "llamada";
export type Area = "personas" | "estrategia" | "finanzas" | "clientes" | "operacion" | "cultura" | "etica" | "comunicacion" | "negociacion" | "alineacion";

/** Id de un personaje dentro de su empresa (cada paquete trae su elenco). */
export type CastId = string;

export interface Option {
  id: string;
  /** Lo que haces (1.ª persona, corto). */
  text: string;
  /** Cómo te responden (burbujas / párrafos). */
  reply: string[];
  /** Qué cambió en la empresa, en una línea. */
  outcome: string;
  effects: Partial<Kpis>;
  style: Partial<Record<Axis, number>>;
  /** Qué tan alineada está con los principios de dirección de mêtis (0–3). Sólo se traduce en XP, nunca en «correcto». */
  score: 0 | 1 | 2 | 3;
  /** Cómo le cae a cada persona del caso (−2 … +2). Se propaga por el mapa: aliados, rivales e influidos. */
  stance?: Record<CastId, number>;
}

export interface DataBlock { title: string; rows: [string, string][]; note?: string }

export interface Item {
  id: string;
  /** Día de la temporada en que llega (1…N). */
  day: number;
  /** Orden dentro del día. */
  slot: number;
  channel: Channel;
  from: CastId;
  subject: string;
  preview: string;
  /** Mensaje en voz del personaje (cada string = párrafo o burbuja de WhatsApp). */
  body: string[];
  /** Junta: quién dice qué. */
  lines?: { who: CastId; text: string }[];
  data?: DataBlock;
  ask: string;
  options: Option[];
  /** Si no respondes a tiempo. */
  expired: { reply: string[]; outcome: string; effects: Partial<Kpis> };
  /** Lección de mêtis Academy CEO con la teoría detrás. */
  lesson?: string;
  bitacora: { title: string; text: string; nota: string };
  areas: Area[];
  /** Consecuencia que regresa: sólo llega si en `item` elegiste alguna de `options` ("__expired" = no respondiste). */
  trigger?: { item: string; options: string[] };
  deadlineH?: number;
  /** Otras personas que se ven afectadas (se resaltan en el mapa de relaciones). */
  involves?: CastId[];
  /** «Lo que pasó en la vida real»: un caso parecido en otra empresa (nombres ficticios). */
  real?: { company: string; title: string; text: string };
}

export interface Settings {
  tz: string;
  /** Ventana de llegada de mensajes (hora local, 24 h). */
  windowStart: number;
  windowEnd: number;
  email: string;
  phone: string;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  /** Todo el día llega de golpe (para probar o para quien juega en un solo rato). */
  intensivo: boolean;
  /** Meta diaria de decisiones elegida en el onboarding v3.2 (1, 2 o 3). Opcional: quien empezó antes no la tiene. */
  dailyGoal?: 1 | 2 | 3;
  /** Minutos aproximados por sesión (3, 5, 8 o 12). Opcional. */
  sessionMinutes?: 3 | 5 | 8 | 12;
}

/** Respuesta escrita (evaluada con IA): tu texto, la calidad 0–3 y la nota del mentor. */
export interface Written { text: string; quality: 0 | 1 | 2 | 3; feedback: string }
export interface Decision { option: string; at: number; written?: Written }

/** Una empresa ya jugada (queda en tu carrera). */
export interface CareerRun {
  company: string;
  tier: number;
  /** Versión de reglas con que se jugó esa empresa (sin dato = legacy v1). */
  rulesVersion?: number;
  startedAt: number;
  endedAt: number;
  kpis: Kpis;
  health: number;
  /** % de asuntos base respondidos (no vencidos). */
  answered: number;
  passed: boolean;
  xp: number;
  decisions: Record<string, Decision>;
  /** Casos ejecutivos que cerraste en esa empresa (reglas v3+). */
  episodes?: string[];
  lessons?: string[];
  /** Resultado del proyecto de cambio de esa empresa. */
  change?: { adopted: number; weeks: number; ok: boolean };
}

// ───────────────────────────── proyecto de cambio
/** Palancas de cambio. */
export type LeverId = "ejemplo" | "entrevista" | "townhall" | "capacitacion" | "piloto" | "avance" | "coalicion" | "reconocer" | "incentivos";

export interface ChangeMove { lever: LeverId; targets: CastId[]; at: number }

export interface ChangeState {
  company: string;
  /** Relación con cada persona al arrancar (congelada: lo que hiciste antes ya cuenta). */
  rel0: Record<CastId, number>;
  moves: ChangeMove[];
  /** Semanas disponibles (dependen de la exigencia). */
  weeks?: number;
  closedAt?: number;
}

export interface Stakeholder {
  id: CastId;
  /** Disposición inicial (0–40). */
  start: number;
  /** Palancas que le mueven más / que le caen mal (se descubren con una entrevista). */
  likes: LeverId[];
  dislikes?: LeverId[];
  /** Lo que confiesa en la entrevista. */
  secret: string;
  /** Formador de opinión: lo que haga arrastra a otros. */
  leader?: boolean;
}

export interface ChangeDef {
  title: string;
  /** En una línea: qué cambia. */
  what: string;
  /** Por qué el consejo lo pidió. */
  why: string;
  stakeholders: Stakeholder[];
}

export interface CeoState {
  v: 2;
  name: string;
  alias: string;
  /** Empresa que diriges ahora (id del paquete). */
  company: string;
  /** Exigencia de esta empresa: 0 = primera; sube con cada ascenso (+2 en modo Legendario). */
  tier: number;
  /** Versión de reglas de la temporada en curso. Se congela al empezar cada empresa; sin dato = legacy v1. */
  rulesVersion?: number;
  legendary?: boolean;
  /** Empresas que ya cerraste (aprobadas o no). */
  career: CareerRun[];
  startedAt: number | null;
  settings: Settings;
  /** Decisiones de la empresa actual. */
  decisions: Record<string, Decision>;
  /** Hora de llegada congelada la primera vez que se vio (cambiar ajustes no mueve lo ya recibido). */
  pinned: Record<string, number>;
  read: Record<string, number>;
  lessons: Record<string, number>;
  /** Dilemas de personas respondidos (id → opción elegida y cuándo). Viajan contigo entre empresas. */
  dilemmas?: Record<string, { option: number; at: number }>;
  lastActiveAt: number;
  /** Proyecto de cambio de la empresa actual. */
  change?: ChangeState;
  /** Adelanto de reloj del modo prueba (ms). */
  clockOffset: number;
  savedAt: number;
  /** Executive Journey (opcional: si falta, el jugador aún no se inscribe; ver journey.ts). */
  journey?: JourneyState;
  /** Experiencia declarada (V33). Opcional; NUNCA entra a dominio, etapa, XP ni ranking (ver profile.ts). */
  profile?: ProfessionalProfile;
  /** Diagnóstico inicial opcional de 3 decisiones (lectura de confianza baja, separada del dominio). */
  diagnostic?: InitialDiagnostic;
  /** Aviso «Cuéntanos tu experiencia» para jugadores que empezaron antes del perfil. */
  profileNudge?: ProfileNudge;
  /** Exigencia extra que el jugador ELIGIÓ para su primera empresa (0 o 1). No cuenta como Legendario. */
  startTier?: number;
  /** Boardroom Crisis jugadas (una por empresa; ver crisis.ts). No tocan los KPI de la temporada. */
  crises?: CrisisRun[];
  /** Procedencia: carrera traída del navegador a la cuenta (adenda v3.2 §3). La escribe el servidor al importar. */
  origin?: CareerOrigin;
  /** Ritmo (1.2, adenda §5): vacaciones y días tranquilos. Sin dato = siempre activo. Ver cadence.ts. */
  cadence?: Cadence;
  /** Executive Decision Episodes (adenda v3.3): una partida por episodio. Su XP vive en la partida y aún no suma al ranking. */
  episodes?: Record<string, EpisodeRun>;
}

/** Estado de ritmo del jugador. Se deriva de `cadence.pauses` a una hora dada (ver cadence.ts). */
export type CadenceStatus = "active" | "quiet_day" | "vacation_paused";
/**
 * Un periodo de pausa en hora real. Vacaciones: `to` = null mientras dura (se cierra al reanudar).
 * Día tranquilo: `to` = medianoche local, fijada al empezar (o antes, si vuelves ese mismo día).
 */
export interface PausePeriod { kind: "vacation" | "quiet"; from: number; to: number | null; plannedResumeAt?: number | null }
export interface Cadence {
  policyVersion: 1;
  pauses: PausePeriod[];
  /** Última vez que viste la pantalla de regreso (para no repetirla). */
  welcomeSeenAt?: number;
}

/** De dónde viene una carrera importada. No cambia la historia jugada; solo la etiqueta como progreso anterior. */
export interface CareerOrigin {
  kind: "importada_navegador";
  importId: string;
  importedAt: number;
  /** savedAt de la copia local que se importó (para no volver a preguntar por la misma). */
  localSavedAt: number;
  /** Empresa fundacional en la que se jugó (cumbre, forja o brasa). */
  legacyCompanyId: string;
  /** Variante fundacional del catálogo v3.2 a la que corresponde (mismo id en las fundacionales). */
  companyVariantId: string;
  rulesVersion: number;
  catalogMigrationVersion: number;
}

export type CrisisRating = "contenida" | "danos" | "rebaso";
export interface CrisisRun { company: string; startedAt: number; tier: number; rulesVersion?: number; at: number; rating: CrisisRating; picks: Record<string, string> }

/** Executive Journey: tu cargo. Cambia solo con nombramientos (ver journey.ts). */
export interface JourneyState {
  /** Etapa obtenida por nombramiento (0 = Emerging Leader … 5 = Global CEO). */
  stage: number;
  enrolledAt: number;
  /** Historial de nombramientos. `legacy` = reconocido al inscribirse por su rango anterior. */
  appointments: { stage: number; at: number; legacy?: boolean }[];
  /** Rango que tenía antes del Journey (distinción de la temporada fundadora). */
  founder?: { rank: number; name: string; xp: number; at: number };
  /** Junta ante el Consejo (requisito para Chief Executive Officer). */
  board?: { passed: boolean; at: number };
}

export type EntryStatus = "futuro" | "pendiente" | "decidido" | "vencido";

export interface Entry {
  item: Item;
  arrivesAt: number;
  deadline: number;
  status: EntryStatus;
  decision?: Decision;
  option?: Option;
}

// ───────────────────────────────────────────── paquetes de empresa
export interface Person {
  id: CastId;
  name: string;
  role: string;
  initials: string;
  /** A quién le reporta (id) o "ceo" si te reporta a ti. Sin valor = actor externo o del consejo. */
  reportsTo?: CastId | "ceo";
  /** Grupo en el mapa: consejo, comité (te reportan), equipo, externos. */
  group: "consejo" | "comite" | "equipo" | "externo";
  /** Lo que le importa (se ve en el mapa). */
  cares?: string;
}

/** Relación entre dos personas en el mapa. */
export interface Tie {
  a: CastId;
  b: CastId;
  kind: "alianza" | "tension" | "influye";
  note: string;
}

export interface CompanyPack {
  id: string;
  name: string;
  /** Nombre corto para textos («en Cumbre»). */
  short: string;
  industry: string;
  city: string;
  tagline: string;
  pitch: string;
  facts: [string, string][];
  /** Dominio ficticio del correo interno. */
  domain: string;
  season: { name: string; days: number };
  /** 1 = la más accesible … 3 = la más exigente. */
  difficulty: 1 | 2 | 3;
  /** Empresa internacional (cuenta para Global CEO). */
  international?: boolean;
  kpiStart: Kpis;
  /** Cómo se llaman los 5 indicadores en esta industria (internamente siempre son los mismos). */
  kpiLabel: Record<KpiKey, string>;
  kpiHint: Record<KpiKey, string>;
  cast: Record<CastId, Person>;
  ties: Tie[];
  /** Quién te escribe los recordatorios (asistente), quién habla por el consejo y quién preside. */
  roles: { assistant: CastId; board: CastId; chair: CastId };
  /** Carta de nombramiento (onboarding). */
  welcome: string;
  glossary: { term: string; def: string }[];
  items: Item[];
  /** Proyecto de cambio de la temporada (inspirado en simuladores de gestión del cambio). */
  change: ChangeDef;
}
