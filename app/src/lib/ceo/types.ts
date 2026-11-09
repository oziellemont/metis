import type { CompanyProfile } from "./career/identity";
import type { DisplayCurrency } from "./career/money";
import type { BusinessLog } from "./business/model";
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
  /**
   * Acuerdo pendiente (reglas v8+): el beneficio depende de que la contraparte acepte o de que el dinero se cobre.
   * `effects` es solo lo que pasa al decidir; la respuesta llega después y suma `yes` o `no` (azar estable por
   * periodo). La probabilidad es una estimación del caso, no un dato empírico.
   */
  pending?: PendingAgreement;
  /**
   * Hechos económicos (reglas v10+): lo que esta opción paga, cobra, firma o compromete, con monto y fecha. En v10 la
   * Caja y el Margen solo se mueven por hechos; `effects` conserva Equipo, Clientes y Consejo, y el motor agrega a
   * `effects` la conversión de los hechos (para la vista previa y la rúbrica). Ver economy.ts.
   */
  facts?: Fact[];
  /** Reglas v10+: la decisión pasó por el consejo (o el consejo la pidió). Sin esto, rebasar la autoridad mueve el Consejo. */
  board?: boolean;
}

/** Tipo de hecho económico (propuesta de economía real, sección 5.2). */
export type FactKind = "cobro" | "pago" | "precio" | "costo" | "inversion" | "capital_trabajo" | "financiamiento";

/**
 * Un hecho con monto (millones de pesos, empresa establecida; el motor lo escala al tamaño de la empresa) y fecha.
 * Signo: positivo entra o mejora el resultado; negativo sale o lo empeora.
 *  - cobro / capital_trabajo / financiamiento: caja (el financiamiento además carga intereses al margen con `rate`).
 *  - pago: caja; y margen solo si `expense` (gasto del periodo).
 *  - precio / costo: monto ANUAL; margen desde que ocurre, y la caja lo recibe en la operación del mes (1/12).
 *  - inversion: caja cuando se paga; margen solo la depreciación anual (monto / `years`, 5 por omisión).
 */
export interface Fact {
  kind: FactKind;
  amount: number;
  /** Qué pasó, en una línea (se muestra al jugador). */
  text: string;
  /** Días reales hasta que ocurre (como un acuerdo: si el periodo cierra antes, ocurre al empezar el último día). */
  days?: number;
  expense?: boolean;
  years?: number;
  /** Interés anual del financiamiento (0.12 = 12 %). */
  rate?: number;
  /** Lo decide otro (un cliente que se va, volumen que se pierde): no es una concesión del director (autoridad). */
  external?: boolean;
}

export interface PendingAgreement {
  /** Quién responde (nombre o grupo, tal como se muestra: «Greg (Aurora)», «Clientes anuales»). */
  who: string;
  /** Qué se espera que acepte, en una línea («Que Aurora mueva dos días su programa»). */
  what: string;
  /** Probabilidad estimada de que acepte (0–1, ficticia del caso). */
  p: number;
  /**
   * Días reales hasta la respuesta (1 día real ≈ 4 de la empresa). Si el periodo cierra antes, se resuelve al cierre.
   * Se acepta si el azar estable del asunto (el mismo que decide sus consecuencias inciertas) cae en [1 − p, 1): así
   * un acuerdo y una consecuencia del mismo asunto pueden ser caminos excluyentes y coherentes.
   */
  days: number;
  yes: { text: string; effects: Partial<Kpis>; facts?: Fact[] };
  no: { text: string; effects: Partial<Kpis>; facts?: Fact[] };
}

export interface ItemVariant {
  when: PriorCondition[];
  patch: Partial<Pick<Item, "subject" | "preview" | "body" | "lines" | "data" | "ask" | "options" | "expired" | "bitacora" | "involves">>;
  rows?: [string, string][];
}

/** Condición sobre una decisión anterior (para variantes de un asunto encadenado). */
export interface PriorCondition {
  item: string;
  /** Opciones elegidas en `item` («__expired» = venció). */
  options: string[];
  /** Si la opción tenía acuerdo pendiente: solo si la contraparte aceptó (true) o no (false). */
  accepted?: boolean;
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
  expired: { reply: string[]; outcome: string; effects: Partial<Kpis>; facts?: Fact[] };
  /**
   * Reglas v10+: hecho del caso que ya ocurrió antes de que decidas (un brote, un alza de costo). Se registra al llegar
   * el asunto, elijas lo que elijas; cada opción solo mueve su diferencia.
   */
  arrival?: { text: string; facts?: Fact[]; effects?: Partial<Kpis> };
  /** Lección de mêtis Academy CEO con la teoría detrás. */
  lesson?: string;
  bitacora: { title: string; text: string; nota: string };
  areas: Area[];
  /** Consecuencia que regresa: sólo llega si en `item` elegiste alguna de `options` ("__expired" = no respondiste). */
  trigger?: {
    item: string;
    options: string[];
    /**
     * Consecuencia incierta: solo llega si el azar del jugador para ese detonador cae en [desde, hasta).
     * El azar es estable (sale de la fecha de inicio del periodo y del id del detonador), así que una partida se
     * reproduce igual; dos consecuencias del mismo detonador con rangos complementarios son caminos excluyentes.
     */
    roll?: [number, number];
  };
  /** Solo llega en periodos jugados con esta versión de reglas o posterior (los periodos anteriores no cambian). */
  since?: number;
  /**
   * Revisiones por versión de reglas: en periodos con versión ≥ `since` el asunto se presenta con `patch` encima
   * (mismo id, así que sus consecuencias y la continuidad no se rompen). Los periodos anteriores no cambian.
   */
  revisions?: { since: number; patch: Partial<Omit<Item, "id" | "revisions" | "since" | "until" | "day" | "slot" | "variants">>; note: string }[];
  /** Deja de llegar en periodos con esta versión de reglas o posterior (lo sustituye otro asunto). */
  until?: number;
  /**
   * Carrera continua: capítulos de la empresa (índices de COMPANY_STAGES, desde y hasta) en que llega. Sin dato, en
   * cualquiera. [0, 0] = solo al tomar el mando (lo que habla de tu llegada: «tu primer consejo», «tus 90 días»).
   */
  stages?: [number, number];
  /**
   * Carrera continua: seguimiento de una decisión de un mes anterior. Solo llega si la última vez que decidiste
   * `item` en tu empresa elegiste alguna de `options`.
   */
  recall?: { item: string; options: string[] };
  /**
   * Cadena (v8+): si alguno de estos asuntos llegó en tu periodo, este no llega hasta que lo resuelvas (decidido o
   * vencido) y nunca antes. Deben ir antes en la lista del paquete.
   */
  after?: string[];
  /**
   * Cadena (v8+): lo que decidiste antes cambia la información, las opciones o el mensaje. Se aplican, en orden,
   * todas las variantes cuyas condiciones se cumplan; `rows` se agrega al bloque de datos. Solo dependen de asuntos
   * que ya se resolvieron antes de que este llegara (la cadena va por `trigger`).
   */
  variants?: ItemVariant[];
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
  /** Moneda en que el jugador quiere VER las cifras (solo pantalla; la simulación siempre es en MXN). */
  displayCurrency?: DisplayCurrency;
  /** World Events: «Acontecimientos reales en mi carrera» (opt-in; apagado si no existe). */
  worldEvents?: boolean;
  /** Familias que el jugador no quiere recibir (clima, sismo, macro). */
  worldMute?: import("./world/types").Family[];
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
  /** Identidad de la empresa propia (carrera continua). Distingue dos empresas del mismo paquete. */
  companyId?: string;
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
  /**
   * Carrera continua (P0-B2): sin dato = «temporadas» (todas las partidas actuales).
   * «continua» = una sola empresa persistente; `advance()` nunca cambia de empresa.
   */
  careerMode?: "temporadas" | "continua";
  /** Identidad de la empresa del jugador (carrera continua). Opcional; ver career/identity.ts. */
  companyProfile?: CompanyProfile;
  /** Negocio (P0-C): versión de supuestos y asignaciones de caja. Los números se reconstruyen con businessOf(). */
  business?: BusinessLog;
  /**
   * Empresa emergente con motor de crecimiento (Growth Engine, fase 2; detrás del interruptor growth_engine).
   * Solo se guarda el registro (plantilla, semilla, decisiones); el estado se reconstruye. Ver growth/session.ts.
   */
  growth?: import("./growth/session").GrowthLog;
  /** Paso del periodo en curso a la economía real (v10): respaldo completo y marca para no repetirlo. Ver econ-migration.ts. */
  econMigration?: EconMigration;
  /**
   * Empresas guardadas (piloto Growth Engine): al abrir una empresa emergente, la empresa en curso se guarda completa
   * aquí, con el reloj detenido, y se puede volver a ella. Ver career/shelf.ts.
   */
  shelf?: ShelvedCompany[];
  /** Inicio de la carrera, fijado la primera vez que se guarda una empresa (el diario lo usa como identidad). */
  careerStart?: number;
}

/** Campos que pertenecen a UNA empresa (lo demás —XP, lecciones, dilemas, carrera cerrada— es de la persona). */
export const COMPANY_SLICE_KEYS = ["company", "tier", "rulesVersion", "legendary", "startedAt", "decisions", "pinned", "read", "change", "careerMode", "companyProfile", "business", "growth", "econMigration", "cadence", "episodes"] as const;
export type CompanySlice = Pick<CeoState, (typeof COMPANY_SLICE_KEYS)[number]>;
export interface ShelvedCompany {
  /** companyId de la identidad, o «pack:<id>» para una empresa de temporadas. */
  id: string;
  name: string;
  /** Cuándo se guardó (hora del juego). Al volver, ese lapso cuenta como pausa: nada vence ni llega mientras tanto. */
  parkedAt: number;
  /** XP del periodo en curso al guardarla (sigue sumando a tu total mientras está guardada). */
  xp: number;
  state: CompanySlice;
}

/** Registro del paso a v10 de un periodo que ya estaba en curso. */
export interface EconMigration {
  /** Cuándo se hizo (hora real). */
  at: number;
  /** Versión de reglas que tenía el periodo. */
  from: number;
  /** Inicio del periodo que se pasó (para saber si sigue siendo el periodo en curso). */
  startedAt: number;
  /** Respaldo completo de la partida antes del cambio (JSON, sin este registro). */
  backup?: string;
  /** Si se revirtió: cuándo. Un periodo revertido no se vuelve a pasar solo. */
  reverted?: number;
}

/** Estado de ritmo del jugador. Se deriva de `cadence.pauses` a una hora dada (ver cadence.ts). */
export type CadenceStatus = "active" | "quiet_day" | "vacation_paused";
/**
 * Un periodo de pausa en hora real. Vacaciones: `to` = null mientras dura (se cierra al reanudar).
 * Día tranquilo: `to` = medianoche local, fijada al empezar (o antes, si vuelves ese mismo día).
 */
export interface PausePeriod {
  kind: "vacation" | "quiet"; from: number; to: number | null; plannedResumeAt?: number | null;
  /** Lapso en que la empresa estuvo guardada (otra empresa en curso). Congela como unas vacaciones, pero no cuenta en el límite. */
  shelf?: true;
}
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
  /** Acuerdo pendiente de la opción elegida (v8+): cuándo responde la contraparte y qué responde. */
  agreement?: AgreementState;
}
export interface AgreementState {
  who: string;
  what: string;
  respondsAt: number;
  /** Ya respondió (antes de esto, su efecto no cuenta y su respuesta no se muestra). */
  resolved: boolean;
  accepted: boolean;
  text: string;
  effects: Partial<Kpis>;
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
