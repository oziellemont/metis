/**
 * MÊTIS 2.0 · Repositorio Académico · contrato de una experiencia inmersiva.
 *
 * Una experiencia NO es un cuestionario: es un recorrido de nodos (mensaje, documentos, decisión,
 * señalar sobre un documento, clasificar tarjetas, ordenar un flujo, calcular con apoyo, dato nuevo,
 * respuesta escrita, cierre) con ramas y consecuencias,
 * más una variante independiente (otra situación, otras cifras, sin apoyo) para comprobar.
 *
 * Toda pieza lleva su origen, para que la revisión editorial sepa qué mirar:
 *   «fuente»     el texto viene tal cual del paquete editorial;
 *   «adaptado»   el paquete describe la pieza y SuperNinja la redactó para volverla jugable;
 *   «conversion» la pieza no está en el paquete: se añadió al convertir.
 *
 * Política de evidencia de este lote: «no_registra». Nada de lo que ocurre aquí llega al registro
 * de evidencias, al cálculo de dominio, a los niveles ni al perfil.
 */
import type { AcademyId, Demand } from "../academias";

export type Origen = "fuente" | "adaptado" | "conversion";

/** Renglón de un documento. Si es total, `suma` dice de qué renglones sale (para recalcularlo en pruebas). */
export interface Renglon {
  id: string;
  label: string;
  /** Importe con signo, tal como se muestra. Los renglones de texto no llevan importe. */
  amount?: number;
  /** Columnas adicionales (texto o cifras ya escritas), en el orden de `cols` del documento. */
  cells?: string[];
  /** Renglón de resultado: se muestra resaltado. */
  strong?: boolean;
  suma?: { ids: string[]; signs: (1 | -1)[] };
  /** Explicación que aparece al tocar el renglón (solo en modo aprender). */
  nota?: { text: string; origen: Origen };
}

export interface Documento {
  id: string;
  letter: string;
  title: string;
  unit: string;
  /** Encabezados cuando los renglones traen `cells`: el primero nombra la columna del rótulo. */
  cols?: string[];
  /** «tabla» alinea las columnas; «ficha» apila cada dato bajo su rótulo (textos largos). Por omisión: tabla hasta dos columnas de datos. */
  layout?: "tabla" | "ficha";
  rows: Renglon[];
  foot?: string;
}

export interface Personaje { id: string; name: string; role: string }

export type RutaTipo = "defendible" | "riesgosa" | "concepto_erroneo";

export interface Linea { who: string | null; text: string }

export interface Opcion {
  id: string;
  text: string;
  tipo: RutaTipo;
  /** Lo que ocurre después de elegir. */
  consequence: Linea[];
  feedback: string;
  /** Rama: a qué nodo lleva esta ruta. */
  next: string;
  origen: Origen;
}

interface NodoBase { id: string; moment: number; origen: Origen }

export interface NodoMensaje extends NodoBase { kind: "mensaje"; from: string; channel: string; text: string; role: string; attachments: string[]; next: string }
export interface NodoExplorar extends NodoBase { kind: "explorar"; title: string; prompt: string; docs: string[]; next: string }
export interface NodoDecision extends NodoBase { kind: "decision"; from: string; text: string; options: Opcion[] }
/** Se responde tocando un renglón de un documento; equivocarse enseña y permite reintentar. */
export interface NodoSenalar extends NodoBase { kind: "senalar"; from: string | null; text: string; prompt: string; docs: string[]; /** Uno o varios renglones: hay que encontrarlos todos. */ correct: string | string[]; right: string; wrong: Record<string, string>; fallback: string; next: string }
export interface NodoDato extends NodoBase { kind: "dato"; title: string; items: string[]; calc?: string; next: string }
/** Respuesta escrita. No se califica ni premia la extensión; queda guardada para recuperarla. */
export interface NodoRedactar extends NodoBase { kind: "redactar"; from: string; /** Lo que pide el personaje, con sus palabras. */ ask: string; prompt: string; /** Varios campos cortos en vez de un solo texto. */ fields?: Campo[]; reference: string; ideas: string[]; next: string }
export interface Campo { id: string; label: string }
export interface Grupo { id: string; label: string }
/** Tarjeta que se asigna a un grupo. `group` admite varios cuando más de una lectura es razonable. */
export interface Tarjeta { id: string; text: string; group: string | string[]; why: string }
/** Asignar tarjetas a grupos tocando (sin arrastrar). Equivocarse enseña y permite corregir. */
export interface NodoClasificar extends NodoBase { kind: "clasificar"; from: string | null; text: string; prompt: string; docs: string[]; groups: Grupo[]; items: Tarjeta[]; right: string; next: string }
/** Poner tarjetas en secuencia con botones de subir y bajar. `strict: false` acepta cualquier orden y muestra el de referencia. */
export interface NodoOrdenar extends NodoBase { kind: "ordenar"; from: string | null; text: string; prompt: string; cards: { id: string; text: string }[]; order: string[]; accept?: string[][]; strict: boolean; hints: { first: string; then: string; text: string }[]; right: string; fallback: string; next: string }
export interface CampoCifra { id: string; label: string; answer: number; unit: "$" | "%" | ""; hint: string; calc: string }
/** Escribir cifras con apoyo (pista por campo y calculadora). */
export interface NodoCalcular extends NodoBase { kind: "calcular"; from: string | null; text: string; prompt: string; docs: string[]; fields: CampoCifra[]; right: string; next: string }
export interface NodoCierre extends NodoBase { kind: "cierre"; text: string }

export type Nodo = NodoMensaje | NodoExplorar | NodoDecision | NodoSenalar | NodoDato | NodoRedactar | NodoClasificar | NodoOrdenar | NodoCalcular | NodoCierre;

export interface Teoria { id: string; title: string; text: string; origen: Origen }

/**
 * Tareas de la variante, sin pistas ni apoyo. Ninguna es de opción múltiple:
 *   «cifra» se calcula y se escribe; «clasificar» asigna tarjetas a grupos; «ordenar» arma una secuencia;
 *   «senalar» toca renglones del documento; «texto» se redacta.
 * Lo escrito NO se califica de forma automática: su peso queda «en espera de revisión de una persona».
 */
interface TareaBase { id: string; criterion: string; prompt: string; weight: number; origen: Origen }
export interface TareaCifra extends TareaBase { kind: "cifra"; answer: number; unit?: "$" | "%" | ""; calc: string }
export interface TareaClasificar extends TareaBase { kind: "clasificar"; groups: Grupo[]; items: { id: string; text: string; group: string | string[] }[]; calc: string }
export interface TareaOrdenar extends TareaBase { kind: "ordenar"; cards: { id: string; text: string }[]; order: string[]; accept?: string[][]; calc: string }
export interface TareaSenalar extends TareaBase { kind: "senalar"; doc: string; correct: string[]; calc: string }
export interface TareaTexto extends TareaBase { kind: "texto"; fields?: Campo[]; reference: string; ideas: string[] }
export type Tarea = TareaCifra | TareaClasificar | TareaOrdenar | TareaSenalar | TareaTexto;
/** Respuesta a una tarea: cifra, asignaciones o campos de texto (objeto), u orden o renglones (lista). */
export type Respuesta = number | null | Record<string, string> | string[];

export interface Variante {
  id: string;
  title: string;
  setting: string;
  question: string;
  /** Lo que se anuncia al terminar la práctica, antes de entrar. */
  intro: string;
  docs: Documento[];
  tasks: Tarea[];
  /** Se ofrece una calculadora aritmética neutra (suma, resta, multiplica, divide). No explica conceptos. */
  calculator?: boolean;
}

export type EstadoQA = "importado" | "probado" | "revisado" | "publicado" | "validado";

export interface Experiencia {
  /** Identificador estable de la plataforma. */
  id: string;
  /** Identificador editorial del paquete (temporal; no sustituye al estable). */
  editorialId: string;
  slug: string;
  version: number;
  packageVersion: string;
  title: string;
  academy: AcademyId;
  skills: { primary: string; secondary: string[] };
  level: Demand;
  sourceIds: string[];
  provenance: "creacion_original";
  minutes: [number, number];
  objectives: string[];
  characters: Personaje[];
  docs: Documento[];
  start: string;
  nodes: Nodo[];
  moments: string[];
  theory: Teoria;
  calculations: string[];
  variant: Variante;
  evidencePolicy: "no_registra";
  qa: { estado: EstadoQA; importedAt: string; editorialReviewedAt: string | null; publishedAt: string | null };
  /** Decisiones de conversión que la revisión editorial debe confirmar. */
  conversionNotes: string[];
}

// ───────────────────────────────────────────── recorrido

export interface Paso {
  node: string; choice?: string; misses?: string[]; solved?: boolean;
  /** senalar con varios renglones: los ya encontrados. */
  found?: string[];
  /** clasificar: tarjeta → grupo. ordenar: secuencia actual. calcular: campo → cifra. */
  assign?: Record<string, string>; order?: string[]; values?: Record<string, number | null>;
  /** Veces que pidió revisar y si al final pidió ver la solución. */
  checks?: number; revealed?: boolean;
}

export interface Recorrido {
  v: 2;
  exp: string;
  ver: number;
  phase: "aprender" | "demostrar" | "fin";
  at: string;
  trail: Paso[];
  /** Renglones consultados y veces que se abrió la teoría. */
  opened: string[];
  theory: number;
  /** Por nodo de redacción: null = prefirió no escribir; sin entrada = todavía no llega. Un solo texto usa el campo «texto». */
  replies: Record<string, Record<string, string> | null>;
  answers: Record<string, Respuesta>;
  /** Lo calcula el servidor al entregar; en el navegador solo se muestra. Al leer lo guardado se pide de nuevo con el sello. */
  result: ResultadoVariante | null;
  /** Sello cifrado de la entrega, emitido por el servidor. Sin sello, una comprobación no está entregada. */
  sello?: string | null;
}

export interface ResultadoVariante {
  /** `auto: false` = texto en espera de revisión humana (no suma). `got` = puntos obtenidos, con crédito parcial. */
  items: { id: string; criterion: string; auto: boolean; ok: boolean; got: number; weight: number; given: Respuesta }[];
  /** Puntos obtenidos sobre `auto` (lo que se califica solo). `pending` = puntos que esperan revisión. */
  score: number;
  auto: number;
  pending: number;
  /**
   * Nunca hay veredicto: la regla provisional de 70 de 100 se retiró (directiva de prioridades, 14 de noviembre de 2026)
   * y ningún umbral está aprobado. Se informa lo obtenido, no si «pasó».
   */
  pass: null;
}

// ───────────────────────────────────────────── lo que recibe el navegador

/**
 * Lo que la pantalla necesita de cada tarea de la comprobación, sin su clave:
 * ni la cifra correcta, ni el grupo de cada tarjeta, ni el orden de referencia, ni los renglones que hay que señalar,
 * ni el cálculo, ni la respuesta de referencia. La clave se queda en el servidor, que es quien califica.
 */
export type TareaPublica =
  | Omit<TareaCifra, "answer" | "calc">
  | (Omit<TareaClasificar, "items" | "calc"> & { items: { id: string; text: string }[] })
  | Omit<TareaOrdenar, "order" | "accept" | "calc">
  | Omit<TareaSenalar, "correct" | "calc">
  | Omit<TareaTexto, "reference" | "ideas">;

export interface VariantePublica { id: string; title: string; setting: string; question: string; intro: string; docs: Documento[]; tasks: TareaPublica[]; calculator?: boolean }

/**
 * La experiencia tal como llega al navegador: la práctica guiada completa (ahí las explicaciones son deliberadas,
 * porque es donde se aprende) y la comprobación sin claves. Las notas de conversión llegan solo después de entregar.
 */
export type ExperienciaPublica = Omit<Experiencia, "variant" | "conversionNotes"> & { variant: VariantePublica };

/**
 * Lo que el servidor devuelve al entregar la comprobación: el resultado que él calculó, la variante ya con su clave
 * (para mostrar qué se esperaba en cada tarea), las notas de conversión y el sello de la entrega.
 */
export interface Entrega { result: ResultadoVariante; variant: Variante; notes: string[]; sello: string }

export type Accion =
  | { t: "abrir"; row: string }
  | { t: "teoria" }
  | { t: "avanzar" }
  | { t: "elegir"; option: string }
  | { t: "senalar"; row: string }
  | { t: "redactar"; text: string | null; fields?: Record<string, string> }
  | { t: "asignar"; item: string; group: string }
  | { t: "mover"; card: string; dir: -1 | 1 }
  | { t: "cifra"; field: string; value: number | null }
  | { t: "revisar" }
  | { t: "revelar" }
  | { t: "comprobar" }
  | { t: "responder"; task: string; value: Respuesta }
  /** El servidor calificó la entrega: el navegador solo guarda lo que recibió. */
  | { t: "entregado"; result: ResultadoVariante; sello: string };
