/**
 * MÊTIS 2.0 · Repositorio Académico · contrato de una experiencia inmersiva.
 *
 * Una experiencia NO es un cuestionario: es un recorrido de nodos (mensaje, documentos, decisión,
 * señalar sobre un documento, dato nuevo, respuesta escrita, cierre) con ramas y consecuencias,
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
  /** Importe con signo, tal como se muestra. */
  amount: number;
  suma?: { ids: string[]; signs: (1 | -1)[] };
  /** Explicación que aparece al tocar el renglón (solo en modo aprender). */
  nota?: { text: string; origen: Origen };
}

export interface Documento {
  id: string;
  letter: string;
  title: string;
  unit: string;
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
export interface NodoExplorar extends NodoBase { kind: "explorar"; prompt: string; docs: string[]; next: string }
export interface NodoDecision extends NodoBase { kind: "decision"; from: string; text: string; options: Opcion[] }
/** Se responde tocando un renglón de un documento; equivocarse enseña y permite reintentar. */
export interface NodoSenalar extends NodoBase { kind: "senalar"; from: string | null; text: string; prompt: string; docs: string[]; correct: string; right: string; wrong: Record<string, string>; fallback: string; next: string }
export interface NodoDato extends NodoBase { kind: "dato"; title: string; items: string[]; calc?: string; next: string }
/** Respuesta escrita. No se califica ni premia la extensión; queda guardada para recuperarla. */
export interface NodoRedactar extends NodoBase { kind: "redactar"; from: string; /** Lo que pide el personaje, con sus palabras. */ ask: string; prompt: string; reference: string; ideas: string[]; next: string }
export interface NodoCierre extends NodoBase { kind: "cierre"; text: string }

export type Nodo = NodoMensaje | NodoExplorar | NodoDecision | NodoSenalar | NodoDato | NodoRedactar | NodoCierre;

export interface Teoria { id: string; title: string; text: string; origen: Origen }

/** Tarea de la variante: una cifra que la persona calcula y escribe. Sin opciones ni pistas. */
export interface Tarea { id: string; criterion: string; prompt: string; answer: number; weight: number; calc: string; origen: Origen }

export interface Variante {
  id: string;
  title: string;
  setting: string;
  question: string;
  docs: Documento[];
  tasks: Tarea[];
  /** Regla provisional, sin calibrar. */
  passAt: number;
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

export interface Paso { node: string; choice?: string; misses?: string[]; solved?: boolean }

export interface Recorrido {
  v: 1;
  exp: string;
  ver: number;
  phase: "aprender" | "demostrar" | "fin";
  at: string;
  trail: Paso[];
  /** Renglones consultados y veces que se abrió la teoría. */
  opened: string[];
  theory: number;
  /** null = prefirió no escribir. undefined = todavía no llega. */
  reply?: string | null;
  answers: Record<string, number | null>;
  result: ResultadoVariante | null;
}

export interface ResultadoVariante {
  items: { id: string; criterion: string; ok: boolean; weight: number; given: number | null }[];
  score: number;
  pass: boolean;
}

export type Accion =
  | { t: "abrir"; row: string }
  | { t: "teoria" }
  | { t: "avanzar" }
  | { t: "elegir"; option: string }
  | { t: "senalar"; row: string }
  | { t: "redactar"; text: string | null }
  | { t: "comprobar" }
  | { t: "responder"; task: string; value: number | null }
  | { t: "entregar" };
