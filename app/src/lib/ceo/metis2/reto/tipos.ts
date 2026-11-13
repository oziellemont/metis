/**
 * MÊTIS 2.0 · Executive Challenge · contrato de un reto integrador.
 *
 * Un reto NO es una lista de preguntas: es una sola historia de empresa en actos y escenas.
 * Cada escena trae una situación, personas y documentos; sus pasos (decidir, calcular, clasificar,
 * ordenar, armar, señalar, escribir) producen respuestas de los personajes y dejan marcas que cambian
 * lo que pasa en escenas posteriores. Los documentos se consultan siempre; no hay tutor ni explicación
 * de conceptos durante el reto. Si se pide ayuda, el intento queda marcado como asistido.
 *
 * Cada paso observa una sola habilidad del catálogo y da de 0 a `points` puntos. Por habilidad,
 * la escala del reto va de 0 a 4. Lo escrito no se califica solo: queda en espera de revisión.
 *
 * Política: «no_registra». Nada llega al registro de evidencias, al dominio, a los niveles ni al perfil.
 * Los umbrales de aprobación son candidatos para calibrar y NO están habilitados.
 */
import type { Campo, Documento, Grupo, Linea, Origen, RutaTipo } from "../experiencias/tipos";

export type { Campo, Documento, Grupo, Linea, Origen, RutaTipo };

/** Marca que deja una decisión. Las escenas posteriores la leen para cambiar textos o mostrar pasos. */
export interface Cond { flag: string; is: string }
/** Texto que cambia según una marca: se usa el primero que coincide; si ninguno, `text`. */
export interface Texto { text: string; alt?: { when: Cond; text: string }[] }

export interface OpcionReto {
  id: string;
  text: string;
  tipo: RutaTipo;
  /** Puntos que da esta ruta a la habilidad del paso (de 0 a `points`). */
  score: number;
  /** Lo que responden los personajes. Es la consecuencia: no dice si fue correcto. */
  reply: Linea[];
  /** Explicación que se muestra solo en el informe final. */
  nota: string;
  sets?: Record<string, string>;
  origen: Origen;
}

interface PasoBase {
  id: string;
  /** Habilidad del catálogo que observa el paso. null: paso narrativo, sin puntos. */
  skill: string | null;
  points: number;
  from: string | null;
  text: Texto;
  /** Solo aparece si se cumple la marca. Los pasos condicionados no dan puntos. */
  when?: Cond;
  origen: Origen;
  /** Requisito de seguridad: si no se cumple, no se compensa con puntos de otras áreas. */
  salvaguarda?: "inocuidad" | "etica" | "control_bancario";
}
export interface PasoDecision extends PasoBase { kind: "decision"; options: OpcionReto[] }
/** `lee: true` cuando la habilidad es leer la cifra en el documento (por ejemplo, la capacidad menor). */
export interface CifraReto { id: string; label: string; answer: number; unit: "$" | "%" | ""; calc: string; points: number; lee?: true }
/** Cifras por escribir, sin pistas. Cada cifra da sus puntos si es exacta. */
export interface PasoCifras extends PasoBase { kind: "cifras"; fields: CifraReto[] }
/** Tarjetas a grupos. Puntos proporcionales a las tarjetas bien puestas, redondeados hacia abajo. */
export interface PasoClasificar extends PasoBase { kind: "clasificar"; groups: Grupo[]; items: { id: string; text: string; group: string; why: string }[] }
/** Secuencia con subir y bajar. `points` si el orden es el de referencia. */
export interface PasoOrdenar extends PasoBase { kind: "ordenar"; cards: { id: string; text: string }[]; order: string[]; why: string }
/** Armar algo eligiendo una pieza por casilla (una meta, un encargo). Un punto por casilla correcta. */
export interface Casilla { id: string; label: string; choices: { id: string; text: string }[]; answer: string; why: string }
export interface PasoArmar extends PasoBase { kind: "armar"; slots: Casilla[]; result: string }
/** Escribir. No se califica solo: sus puntos quedan en espera de revisión de una persona. */
export interface PasoEscribir extends PasoBase { kind: "escribir"; fields: Campo[]; reference: string; ideas: string[] }
/** Dato nuevo o mensaje: no se responde, se lee. */
export interface PasoDato extends PasoBase { kind: "dato"; items: string[] }

export type PasoReto = PasoDecision | PasoCifras | PasoClasificar | PasoOrdenar | PasoArmar | PasoEscribir | PasoDato;

export interface Escena {
  id: string;
  act: number;
  title: string;
  /** Habilidades que el paquete asigna a la escena (ids del catálogo). La síntesis no tiene. */
  skills: string[];
  /** Personas presentes y documentos que conviene tener a la mano. */
  people: string[];
  docs: string[];
  intro: Texto;
  steps: PasoReto[];
  origen: Origen;
}

export interface Acto { id: string; title: string; text: string }

export interface Reto {
  id: string;
  editorialId: string;
  slug: string;
  version: number;
  packageVersion: string;
  title: string;
  /** Correo de entrada, tal como viene en el paquete. */
  invitation: string;
  role: string;
  company: string;
  characters: { id: string; name: string; role: string }[];
  /** Sala de documentos. `from`: escena desde la que aparece (los D01 a D07 están desde el inicio). */
  docs: (Documento & { from?: string })[];
  acts: Acto[];
  scenes: Escena[];
  /** Escala por habilidad y umbrales candidatos. Los umbrales NO se aplican. */
  scale: { max: number; levels: string[] };
  thresholds: { candidates: number[]; enabled: false };
  /** Observación que sustenta 3 o 4 puntos, por habilidad (texto del paquete). */
  criteria: Record<string, string>;
  evidencePolicy: "no_registra";
  qa: { estado: "importado" | "probado" | "revisado" | "publicado" | "validado"; importedAt: string; editorialReviewedAt: string | null; publishedAt: string | null };
  conversionNotes: string[];
}

// ───────────────────────────────────────────── intento

/** decision: id de la opción; ordenar: secuencia; cifras, clasificar, armar y escribir: campo → valor (las cifras, como texto de dígitos). */
export type RespuestaReto = string | string[] | Record<string, string>;

export interface Intento {
  v: 1;
  reto: string;
  ver: number;
  phase: "inicio" | "reto" | "fin";
  /** Paso actual dentro del camino visible (las marcas deciden qué pasos aparecen). */
  at: string | null;
  answers: Record<string, RespuestaReto>;
  flags: Record<string, string>;
  /** Documentos abiertos (ids), en orden. */
  opened: string[];
  /** Pidió ayuda conceptual: el intento pasa a práctica asistida y no sirve como prueba independiente. */
  assisted: boolean;
  /** Veces que se retomó después de salir. */
  resumes: number;
  startedAt: string | null;
  endedAt: string | null;
}

export type AccionReto =
  | { t: "empezar"; now: string }
  | { t: "retomar" }
  | { t: "abrir"; doc: string }
  | { t: "ayuda" }
  | { t: "responder"; step: string; value: RespuestaReto }
  | { t: "avanzar" }
  | { t: "terminar"; now: string };

export interface Observacion {
  skill: string;
  academy: string;
  /** Puntos que se comprueban solos, sobre `auto`. `pending`: puntos de lo escrito, en espera. */
  got: number;
  auto: number;
  pending: number;
  max: number;
  /** De qué pasos salen los puntos. */
  from: { step: string; got: number; points: number; auto: boolean }[];
}

export interface Informe {
  observations: Observacion[];
  byAcademy: { academy: string; got: number; auto: number; pending: number; max: number }[];
  got: number;
  auto: number;
  pending: number;
  max: number;
  /** Requisitos de seguridad que no se cumplieron. No se compensan con otras áreas. */
  safeguards: { kind: NonNullable<PasoBase["salvaguarda"]>; step: string; ok: boolean }[];
  /** Nunca hay veredicto: los umbrales no están habilitados. */
  verdict: null;
  assisted: boolean;
}
