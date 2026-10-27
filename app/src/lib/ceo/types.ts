import type { InitialDiagnostic, ProfessionalProfile, ProfileNudge } from "./profile";
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
}

/** Respuesta escrita (evaluada con IA): tu texto, la calidad 0–3 y la nota del mentor. */
export interface Written { text: string; quality: 0 | 1 | 2 | 3; feedback: string }
export interface Decision { option: string; at: number; written?: Written }

/** Una empresa ya jugada (queda en tu carrera). */
export interface CareerRun {
  company: string;
  tier: number;
  startedAt: number;
  endedAt: number;
  kpis: Kpis;
  health: number;
  /** % de asuntos base respondidos (no vencidos). */
  answered: number;
  passed: boolean;
  xp: number;
  decisions: Record<string, Decision>;
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
}

export type CrisisRating = "contenida" | "danos" | "rebaso";
export interface CrisisRun { company: string; startedAt: number; tier: number; at: number; rating: CrisisRating; picks: Record<string, string> }

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
