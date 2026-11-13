/**
 * MÊTIS 2.0 · Registro corto (entrega 2.1) y práctica por academia para «Mi progreso» (entrega 3.6).
 *
 * Lógica pura, sin React ni navegador.
 *
 * Tres cosas:
 *  1) los temas prioritarios: agruparlos por academia, marcar y desmarcar, y saber si ya son cinco;
 *  2) la empresa del caso: quien se registra ya no crea ni nombra una empresa. Sus primeros casos ocurren en una
 *     empresa que pertenece al caso, elegida por la industria que declaró (o la primera del catálogo);
 *  3) el conteo de práctica por academia: lecciones terminadas y decisiones tomadas. Es actividad, no dominio:
 *     nada de esto acredita, sube niveles ni alimenta el CV.
 */
import { ACADEMIES, MIN_PRIORITY_TOPICS, TOPICS, checkTopics, topicAcademy, topicById, type Academy, type AcademyId, type Topic } from "./academias";
import { skillsOfTrack, tagOf, tagOfItem } from "./clasificacion";
import { COMPANIES, FIRST_COMPANY, companyById } from "../companies";
import { companyForIndustry } from "../profile";
import { buildSetup, newCompanyId, suggestionForPack, type SetupInput } from "../career/setup";

// ───────────────────────────────────────────── temas prioritarios

/** Los temas del catálogo, agrupados por la academia de su primera habilidad y en el orden del catálogo. */
export function topicsByAcademy(): { academy: Academy; topics: Topic[] }[] {
  return ACADEMIES.map((academy) => ({ academy, topics: TOPICS.filter((t) => topicAcademy(t) === academy.id) })).filter((g) => g.topics.length > 0);
}

/** Marca o desmarca un tema. Ignora identificadores que no están en el catálogo. */
export function toggleTopic(ids: readonly string[], id: string): string[] {
  if (!topicById(id)) return [...ids];
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

/** ¿Ya hay al menos cinco temas válidos? */
export const topicsReady = (ids: readonly string[]): boolean => checkTopics([...ids]).ok;

/** Texto del contador de temas. */
export function topicsCountText(ids: readonly string[]): string {
  const { valid, missing } = checkTopics([...ids]);
  if (!valid.length) return `Elige al menos ${MIN_PRIORITY_TOPICS}`;
  if (missing > 0) return `Llevas ${valid.length}. ${missing === 1 ? "Falta 1" : `Faltan ${missing}`}`;
  return `Llevas ${valid.length} temas`;
}

/** Nombres de los temas elegidos, en el orden del catálogo. */
export const topicNames = (ids: readonly string[]): string[] => TOPICS.filter((t) => ids.includes(t.id)).map((t) => t.name);

// ───────────────────────────────────────────── temas → rutas de Academy

/** Rutas de Academy que trabajan alguna habilidad de los temas elegidos. */
export function priorityTracks(topicIds: readonly string[], tracks: readonly string[]): Set<string> {
  const skills = new Set(topicIds.flatMap((id) => topicById(id)?.skills ?? []));
  return new Set(tracks.filter((t) => skillsOfTrack(t).some((s) => skills.has(s))));
}

/** Pone primero las rutas de los temas elegidos, sin cambiar el orden dentro de cada grupo ni quitar ninguna. */
export function orderByPriority<T extends { id: string }>(tracks: readonly T[], prio: ReadonlySet<string>): T[] {
  return [...tracks.filter((t) => prio.has(t.id)), ...tracks.filter((t) => !prio.has(t.id))];
}

// ───────────────────────────────────────────── la empresa del caso

/**
 * Empresa en la que ocurren los primeros casos de quien se registra. La elige MÊTIS, no la persona: la de la industria
 * declarada si existe en el catálogo; si no, la primera. Lleva el nombre propio del caso.
 * `setup` es null solo si el catálogo no permite armarla; en ese caso la partida empieza con la empresa tal cual.
 */
export function caseCompanyFor(industry: string | undefined, rand?: () => number): { packId: string; setup: SetupInput | null } {
  const packId = companyForIndustry(industry, COMPANIES.map((c) => c.id)) ?? FIRST_COMPANY;
  const setup = buildSetup({ ...suggestionForPack(packId), displayName: companyById(packId).name }, newCompanyId(rand));
  return { packId, setup };
}

// ───────────────────────────────────────────── práctica por academia

export interface AcademyPractice {
  academy: AcademyId;
  name: string;
  blurb: string;
  /** Lecciones de Academy terminadas, de las que pertenecen a esta academia. */
  lessonsDone: number;
  lessonsTotal: number;
  /** Decisiones tomadas en casos y dilemas de esta academia. */
  decisions: number;
}

/**
 * Cuenta lo practicado por academia con la clasificación del contenido (entrega 1.2).
 * Lo que no esté clasificado no se cuenta. Es un conteo de actividad: no dice nada del dominio.
 */
export function practiceByAcademy(input: {
  lessonIds: readonly string[];
  lessonsDone: Readonly<Record<string, number>>;
  company: string;
  decidedItemIds: readonly string[];
  dilemmaIds: readonly string[];
}): AcademyPractice[] {
  const rows = new Map<AcademyId, AcademyPractice>(ACADEMIES.map((a) => [a.id, { academy: a.id, name: a.name, blurb: a.blurb, lessonsDone: 0, lessonsTotal: 0, decisions: 0 }]));
  for (const id of new Set(input.lessonIds)) {
    const row = rows.get(tagOf("leccion", id)?.academy as AcademyId);
    if (!row) continue;
    row.lessonsTotal += 1;
    if (input.lessonsDone[id]) row.lessonsDone += 1;
  }
  for (const id of new Set(input.decidedItemIds)) { const row = rows.get(tagOfItem(input.company, id)?.academy as AcademyId); if (row) row.decisions += 1; }
  for (const id of new Set(input.dilemmaIds)) { const row = rows.get(tagOf("dilema", id)?.academy as AcademyId); if (row) row.decisions += 1; }
  return [...rows.values()];
}
