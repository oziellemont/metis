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

export type CastId = "ramiro" | "lucia" | "hector" | "mariana" | "diego" | "paty" | "javier" | "roberto" | "sofia" | "ana" | "carla";

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
  /** Qué tan alineada está con los principios del libro (0–3). Sólo se traduce en XP, nunca en «correcto». */
  score: 0 | 1 | 2 | 3;
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

export interface Decision { option: string; at: number }

export interface CeoState {
  v: 1;
  name: string;
  alias: string;
  startedAt: number | null;
  settings: Settings;
  decisions: Record<string, Decision>;
  /** Hora de llegada congelada la primera vez que se vio (cambiar ajustes no mueve lo ya recibido). */
  pinned: Record<string, number>;
  read: Record<string, number>;
  lessons: Record<string, number>;
  lastActiveAt: number;
  /** Adelanto de reloj del modo prueba (ms). */
  clockOffset: number;
  savedAt: number;
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
