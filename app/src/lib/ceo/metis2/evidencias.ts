/**
 * MÊTIS 2.0 · Registro de evidencias (entrega 1.3).
 *
 * Una evidencia es lo que queda guardado cada vez que la persona responde una actividad evaluable. Es la única
 * materia prima del cálculo de dominio (`dominio.ts`): puntos, rachas, lecciones leídas y actividades completadas
 * no entran aquí.
 *
 * El registro no se reescribe. Solo se agrega al final. Si una evidencia resulta inválida (por ejemplo, una rúbrica
 * con error), se anula con una anotación que también se agrega; la evidencia original se conserva.
 *
 * Cada evidencia guarda los siete grupos de datos que pide la adenda:
 *   1. habilidad principal y secundarias      `skills`
 *   2. dificultad                             `level`
 *   3. evidencia observable                   `observable`, `seconds`
 *   4. calidad del razonamiento               `reasoning`
 *   5. transferencia a otros contextos        `context`, `transfer`
 *   6. resultado y retroalimentación          `result`, `feedback`
 *   7. fecha, versión de rúbrica y confianza  `at`, `rubric`, `confidence`
 * Además guarda si hubo ayuda (`aided`) y si es la primera vez que la persona ve la actividad (`activity.attempt`).
 *
 * Este archivo no depende de la base de datos.
 */
import { DEMANDS, FORMATS, formatById, skillById, type AcademyId, type Demand, type FormatId } from "./academias";

export const EVIDENCE_VERSION = 1;

/** De dónde sale la evidencia. */
export type EvidenceSource = "diagnostico" | "practica" | "repaso" | "reingreso";
export const EVIDENCE_SOURCES: EvidenceSource[] = ["diagnostico", "practica", "repaso", "reingreso"];

export interface Evidence {
  v: typeof EVIDENCE_VERSION;
  /** Identificador único de la evidencia. */
  id: string;
  /** Fecha y hora de la respuesta (milisegundos). */
  at: number;
  source: EvidenceSource;
  activity: {
    id: string;
    /** Versión del contenido con la que se respondió. */
    version: string;
    format: FormatId;
    /**
     * Situación a la que pertenece. Dos redacciones de la misma situación comparten grupo: responder la segunda
     * después de ver la primera es repetir, no demostrar otra vez.
     */
    group: string;
    /** 1 = primera vez que la persona ve esta situación. */
    attempt: number;
  };
  /** Habilidades evaluadas (de una a tres). La primera es la principal. */
  skills: string[];
  /** Dificultad: exigencia de la actividad (1 Reconocer … 6 Dirigir y profundizar). */
  level: Demand;
  /** Industria o contexto del caso. Sirve para comprobar transferencia. */
  context: string;
  /** La actividad se presentó como prueba de transferencia: un principio conocido en un contexto nuevo. */
  transfer: boolean;
  /** Qué hizo la persona, en palabras: opción elegida, términos acordados o resumen de su respuesta. */
  observable: string;
  /** Segundos que tardó en responder, si se midió. */
  seconds?: number;
  /** Resultado de la respuesta, de 0 a 1, según la rúbrica. */
  result: number;
  /** Calidad del razonamiento, de 0 a 1. `null` si la actividad no lo evaluó (por ejemplo, solo se eligió una opción). */
  reasoning: number | null;
  /** Hubo ayuda: pista, teoría abierta durante la respuesta o acompañamiento del tutor. */
  aided: boolean;
  /** Retroalimentación que recibió la persona: referencia y versión. */
  feedback: { ref: string; version: string };
  /** Versión de la rúbrica con la que se calificó. */
  rubric: string;
  /** Qué tan confiable es la calificación, de 0 a 1 (una regla fija vale 1; una lectura automática de texto, menos). */
  confidence: number;
}

/** Anotación que deja sin efecto una evidencia sin borrarla. */
export interface Annulment { id: string; at: number; reason: string }

export interface EvidenceLog {
  v: typeof EVIDENCE_VERSION;
  items: readonly Evidence[];
  annulled: readonly Annulment[];
}

export const emptyLog = (): EvidenceLog => Object.freeze({ v: EVIDENCE_VERSION, items: Object.freeze([]), annulled: Object.freeze([]) });

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const isText = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;
const isUnit = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1;
const FORMAT_IDS = FORMATS.map((f) => f.id);

/** Problemas de una evidencia. Lista vacía = válida. */
export function checkEvidence(e: unknown): string[] {
  if (!isObj(e)) return ["La evidencia no es un objeto."];
  const out: string[] = [];
  if (e.v !== EVIDENCE_VERSION) out.push("Versión de evidencia desconocida.");
  if (!isText(e.id)) out.push("Falta el identificador.");
  if (typeof e.at !== "number" || !Number.isFinite(e.at) || e.at <= 0) out.push("Falta la fecha.");
  if (!EVIDENCE_SOURCES.includes(e.source as EvidenceSource)) out.push("Origen desconocido.");

  const a = e.activity;
  if (!isObj(a)) out.push("Falta la actividad.");
  else {
    if (!isText(a.id)) out.push("Falta el identificador de la actividad.");
    if (!isText(a.version)) out.push("Falta la versión del contenido.");
    if (!isText(a.group)) out.push("Falta el grupo de la actividad.");
    if (!Number.isInteger(a.attempt) || (a.attempt as number) < 1) out.push("El intento debe ser 1 o mayor.");
    if (!FORMAT_IDS.includes(a.format as FormatId)) out.push("Formato desconocido.");
    else if (!formatById(a.format as FormatId)!.evidence) out.push("Este formato es teoría y no puede dejar evidencia.");
  }

  const skills = e.skills;
  if (!Array.isArray(skills) || skills.length < 1 || skills.length > 3) out.push("Debe haber de una a tres habilidades.");
  else {
    if (new Set(skills).size !== skills.length) out.push("Hay habilidades repetidas.");
    const academies = new Set<string>();
    for (const s of skills) {
      const def = typeof s === "string" ? skillById(s) : undefined;
      if (!def) out.push(`Habilidad desconocida: ${String(s)}.`);
      else academies.add(def.academy);
    }
    if (academies.size > 3) out.push("Una actividad toca como máximo tres academias.");
  }

  if (!DEMANDS.includes(e.level as Demand)) out.push("La dificultad debe ser un nivel de 1 a 6.");
  if (!isText(e.context)) out.push("Falta el contexto.");
  if (typeof e.transfer !== "boolean") out.push("Falta indicar si es prueba de transferencia.");
  if (!isText(e.observable)) out.push("Falta la evidencia observable.");
  if (e.seconds !== undefined && (typeof e.seconds !== "number" || !Number.isFinite(e.seconds) || e.seconds < 0)) out.push("Los segundos no son válidos.");
  if (!isUnit(e.result)) out.push("El resultado debe estar entre 0 y 1.");
  if (e.reasoning !== null && !isUnit(e.reasoning)) out.push("La calidad del razonamiento debe estar entre 0 y 1, o quedar sin evaluar.");
  if (typeof e.aided !== "boolean") out.push("Falta indicar si hubo ayuda.");
  if (!isObj(e.feedback) || !isText(e.feedback.ref) || !isText(e.feedback.version)) out.push("Falta la retroalimentación con su versión.");
  if (!isText(e.rubric)) out.push("Falta la versión de la rúbrica.");
  if (!isUnit(e.confidence)) out.push("La confianza debe estar entre 0 y 1.");
  return out;
}

/** Datos para crear una evidencia. El grupo, el intento, la transferencia, la ayuda y la confianza tienen valor por omisión. */
export type EvidenceInput = Omit<Evidence, "v" | "activity" | "transfer" | "aided" | "confidence"> & {
  activity: Omit<Evidence["activity"], "group" | "attempt"> & { group?: string; attempt?: number };
  transfer?: boolean;
  aided?: boolean;
  confidence?: number;
};

function freezeEvidence(e: Evidence): Evidence {
  Object.freeze(e.activity);
  Object.freeze(e.skills);
  Object.freeze(e.feedback);
  return Object.freeze(e);
}

/** Crea una evidencia válida y cerrada a cambios. Falla con la lista de problemas si algo falta. */
export function newEvidence(input: EvidenceInput): Evidence {
  const e: Evidence = {
    v: EVIDENCE_VERSION,
    id: input.id,
    at: input.at,
    source: input.source,
    activity: { id: input.activity.id, version: input.activity.version, format: input.activity.format, group: input.activity.group ?? input.activity.id, attempt: input.activity.attempt ?? 1 },
    skills: [...input.skills],
    level: input.level,
    context: input.context,
    transfer: input.transfer ?? false,
    observable: input.observable,
    ...(input.seconds !== undefined ? { seconds: input.seconds } : {}),
    result: input.result,
    reasoning: input.reasoning,
    aided: input.aided ?? false,
    feedback: { ref: input.feedback.ref, version: input.feedback.version },
    rubric: input.rubric,
    confidence: input.confidence ?? 1,
  };
  const problems = checkEvidence(e);
  if (problems.length) throw new Error(`Evidencia inválida: ${problems.join(" ")}`);
  return freezeEvidence(e);
}

/** Agrega una evidencia al final. No modifica el registro recibido: devuelve uno nuevo. */
export function appendEvidence(log: EvidenceLog, e: Evidence): EvidenceLog {
  const problems = checkEvidence(e);
  if (problems.length) throw new Error(`Evidencia inválida: ${problems.join(" ")}`);
  if (log.items.some((x) => x.id === e.id)) throw new Error(`Ya existe una evidencia con el identificador ${e.id}.`);
  const copy = freezeEvidence({ ...e, activity: { ...e.activity }, skills: [...e.skills], feedback: { ...e.feedback } });
  return Object.freeze({ v: EVIDENCE_VERSION, items: Object.freeze([...log.items, copy]), annulled: log.annulled });
}

/** Deja sin efecto una evidencia. La evidencia se conserva en el registro, con la razón de la anulación. */
export function annulEvidence(log: EvidenceLog, a: Annulment): EvidenceLog {
  if (!isText(a.reason)) throw new Error("La anulación necesita una razón.");
  if (!log.items.some((x) => x.id === a.id)) throw new Error(`No existe la evidencia ${a.id}.`);
  if (log.annulled.some((x) => x.id === a.id)) throw new Error(`La evidencia ${a.id} ya estaba anulada.`);
  return Object.freeze({ v: EVIDENCE_VERSION, items: log.items, annulled: Object.freeze([...log.annulled, Object.freeze({ id: a.id, at: a.at, reason: a.reason })]) });
}

/** Evidencias vigentes (sin las anuladas), de la más antigua a la más reciente. */
export function activeEvidence(log: EvidenceLog): Evidence[] {
  const out = new Set(log.annulled.map((a) => a.id));
  return log.items.filter((e) => !out.has(e.id)).sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Academias que toca una evidencia; la primera es la de la habilidad principal. */
export function academiesOf(e: Pick<Evidence, "skills">): AcademyId[] {
  const out: AcademyId[] = [];
  for (const s of e.skills) {
    const a = skillById(s)?.academy;
    if (a && !out.includes(a)) out.push(a);
  }
  return out;
}

/**
 * Lee un registro guardado. Conserva las evidencias válidas y cuenta las que tuvo que dejar fuera, para que quien
 * lo use pueda avisar en lugar de fallar.
 */
export function readLog(raw: unknown): { log: EvidenceLog; dropped: number } {
  let log = emptyLog();
  let dropped = 0;
  if (!isObj(raw)) return { log, dropped };
  for (const e of Array.isArray(raw.items) ? raw.items : []) {
    try { log = appendEvidence(log, e as Evidence); } catch { dropped++; }
  }
  for (const a of Array.isArray(raw.annulled) ? raw.annulled : []) {
    try { log = annulEvidence(log, a as Annulment); } catch { dropped++; }
  }
  return { log, dropped };
}
