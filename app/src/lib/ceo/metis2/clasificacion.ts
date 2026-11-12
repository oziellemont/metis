/**
 * MÊTIS 2.0 · Clasificación del contenido existente (entrega 1.2).
 *
 * Dice, para cada pieza del simulador, qué academia la gobierna, qué habilidades trabaja y desde qué nivel conviene.
 * No cambia el contenido ni sus identificadores: solo lo etiqueta con el catálogo nuevo (`academias.ts`).
 *
 * Reglas (documento de rediseño): una academia principal, hasta dos secundarias, de una a tres habilidades y un nivel.
 * Este archivo no carga el contenido del simulador; por eso se puede usar desde cualquier pantalla sin costo.
 */
import { formatById, skillById, type AcademyId, type Demand, type FormatId } from "./academias";
import { ARQUETIPOS, CASOS, COMPETENCIAS, CONCEPTOS, CRECIMIENTO, CRISIS, DIAGNOSTICO, DILEMAS, EPISODIOS, LECCIONES, PALANCA, RUTAS, type Row } from "./clasificacion-datos";

export const CLASSIFICATION_VERSION = 1;

/** Tipos de pieza que se clasifican. Empresas e industrias no llevan habilidad: son el contexto de los casos. */
export type ContentKind = "leccion" | "concepto" | "dilema" | "caso" | "banco" | "episodio" | "crecimiento" | "crisis" | "diagnostico" | "palanca";

export const CONTENT_KINDS: { id: ContentKind; name: string; what: string; format: FormatId }[] = [
  { id: "leccion", name: "Lecciones de Academy", what: "Teoría breve con preguntas de comprensión.", format: "leccion" },
  { id: "concepto", name: "Conceptos", what: "Definiciones de la biblioteca.", format: "leccion" },
  { id: "diagnostico", name: "Diagnóstico inicial", what: "Tres casos cortos al entrar.", format: "flash" },
  { id: "dilema", name: "Dilemas de personas", what: "Situaciones cortas con una persona del equipo.", format: "flash" },
  { id: "caso", name: "Casos de las seis empresas", what: "Mensajes, juntas y reportes con decisión y consecuencias.", format: "aplicado" },
  { id: "banco", name: "Banco de decisiones", what: "Situaciones escritas para siete industrias.", format: "aplicado" },
  { id: "episodio", name: "Casos conversacionales", what: "Se consulta, se conversa, se negocia y se justifica.", format: "inmersivo" },
  { id: "palanca", name: "Simulador de cambio", what: "Nueve palancas para mover a una organización hacia un cambio.", format: "inmersivo" },
  { id: "crecimiento", name: "Casos de crecimiento", what: "Cadenas de decisiones con números que se mueven.", format: "encadenado" },
  { id: "crisis", name: "Crisis de caja", what: "Tres decisiones seguidas contra reloj.", format: "encadenado" },
];
export const kindById = (id: ContentKind) => CONTENT_KINDS.find((k) => k.id === id)!;
/** Las lecciones y los conceptos son teoría: no pueden dar evidencia de dominio. */
export const givesEvidence = (kind: ContentKind) => formatById(kindById(kind).format).evidence;

/** Etiqueta de una pieza. */
export interface Tag {
  /** Habilidades que trabaja; la primera es la principal. */
  skills: string[];
  /** Academia de la habilidad principal. */
  academy: AcademyId;
  /** Otras academias que toca (cero, una o dos). */
  secondary: AcademyId[];
  /** Exigencia: 1 Reconocer … 6 Dirigir y profundizar. */
  level: Demand;
}

const ROW = /^([a-z]{3}\.[a-z_]+(?: [a-z]{3}\.[a-z_]+){0,2}) @([1-6])$/;

/** Convierte un renglón de las tablas en una etiqueta. Falla con un mensaje claro si el renglón está mal escrito. */
export function parseTag(row: string): Tag {
  const m = ROW.exec(row);
  if (!m) throw new Error(`Clasificación mal escrita: «${row}»`);
  const skills = m[1].split(" ");
  const academies: AcademyId[] = [];
  for (const id of skills) {
    const s = skillById(id);
    if (!s) throw new Error(`Habilidad desconocida en la clasificación: «${id}»`);
    if (!academies.includes(s.academy)) academies.push(s.academy);
  }
  return { skills, academy: academies[0], secondary: academies.slice(1), level: Number(m[2]) as Demand };
}

const TABLES: Record<Exclude<ContentKind, "palanca" | "dilema">, Row> = {
  leccion: LECCIONES, concepto: CONCEPTOS, caso: CASOS, banco: ARQUETIPOS, episodio: EPISODIOS, crecimiento: CRECIMIENTO, crisis: CRISIS, diagnostico: DIAGNOSTICO,
};

/** Un dilema y su versión 2 son la misma situación. */
export const dilemmaBase = (id: string) => id.replace(/-v2$/, "");

const BANK_ID = /^bk-[a-z]+-([a-z]+)-[1-3]$/;

/** Renglón de una pieza, o undefined si no está clasificada. */
function rowOf(kind: ContentKind, id: string): string | undefined {
  if (kind === "palanca") return PALANCA;
  if (kind === "dilema") return DILEMAS[dilemmaBase(id)];
  return TABLES[kind][id];
}

const CACHE = new Map<string, Tag | null>();

/**
 * Etiqueta de una pieza por su tipo e identificador de siempre.
 * Casos de empresa: «empresa:caso». Banco: el identificador del arquetipo.
 */
export function tagOf(kind: ContentKind, id: string): Tag | undefined {
  const key = `${kind}|${id}`;
  if (!CACHE.has(key)) {
    const row = rowOf(kind, id);
    CACHE.set(key, row ? parseTag(row) : null);
  }
  return CACHE.get(key) ?? undefined;
}

/**
 * Etiqueta de un asunto tal como aparece en una partida: caso de empresa («d2-supernorte» en «cumbre») o caso del
 * banco («bk-cumbre-retiro-2»).
 */
export function tagOfItem(companyId: string, itemId: string): Tag | undefined {
  const bank = BANK_ID.exec(itemId);
  return bank ? tagOf("banco", bank[1]) : tagOf("caso", `${companyId}:${itemId}`);
}

/** Identificadores clasificados de un tipo (los dilemas, por situación; las palancas no se listan aquí). */
export function classifiedIds(kind: Exclude<ContentKind, "palanca">): string[] {
  return Object.keys(kind === "dilema" ? DILEMAS : TABLES[kind]);
}

/** Habilidades del catálogo nuevo a las que corresponde un tema de Academy de antes. */
export const skillsOfTrack = (track: string): string[] => RUTAS[track] ?? [];
export const TRACK_IDS = Object.keys(RUTAS);

/** Academia en la que cae una de las ocho competencias del cálculo anterior. Solo para mostrar historial. */
export const academyOfCompetency = (competency: string): AcademyId | undefined => COMPETENCIAS[competency] as AcademyId | undefined;
export const OLD_COMPETENCY_IDS = Object.keys(COMPETENCIAS);
