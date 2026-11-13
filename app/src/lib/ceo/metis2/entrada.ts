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
import { QUESTIONS, companyForIndustry, type PracticeDays, type ProfessionalProfile } from "../profile";
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

/** Academias a las que pertenecen los temas elegidos. */
export const topicAcademies = (topicIds: readonly string[]): Set<AcademyId> =>
  new Set(topicIds.map((id) => topicById(id)).filter((t): t is Topic => !!t).map((t) => topicAcademy(t)));

/**
 * Perfil que se guarda al terminar el registro: lo que la persona respondió (o nada, si lo dejó para después) más
 * sus temas y sus días por semana. Si no respondió las preguntas de experiencia, `answeredAt` queda en 0 para que
 * se las sigamos ofreciendo; los temas y los días se guardan igual.
 */
export function entryProfile(p: ProfessionalProfile | undefined, topicIds: readonly string[], days: PracticeDays | undefined, now: number, source: ProfessionalProfile["source"] = "onboarding"): ProfessionalProfile {
  const base: ProfessionalProfile = p ?? { v: 1, skipped: [...QUESTIONS], source, answeredAt: 0, updatedAt: now };
  const { topics: _t, days: _d, ...rest } = base;
  void _t; void _d;
  const valid = checkTopics([...topicIds]).valid;
  return { ...rest, updatedAt: now, ...(valid.length ? { topics: valid } : {}), ...(days ? { days } : {}) };
}

// ───────────────────────────────────────────── la empresa del caso

/**
 * Empresa en la que ocurren los primeros casos de quien se registra. La elige MÊTIS, no la persona: la de la industria
 * declarada si existe en el catálogo; si no, la primera. Lleva el nombre propio del caso.
 * `setup` es null solo si el catálogo no permite armarla; en ese caso la partida empieza con la empresa tal cual.
 */
export const casePackId = (industry: string | undefined): string => companyForIndustry(industry, COMPANIES.map((c) => c.id)) ?? FIRST_COMPANY;

export function caseCompanyFor(industry: string | undefined, rand?: () => number): { packId: string; setup: SetupInput | null } {
  const packId = casePackId(industry);
  const pack = companyById(packId);
  const setup = buildSetup({ ...suggestionForPack(packId), displayName: pack.name, shortName: pack.short }, newCompanyId(rand));
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
  /** Decisiones tomadas, cada una con la empresa del caso en la que ocurrió. */
  decided: readonly { company: string; id: string }[];
  dilemmaIds: readonly string[];
}): AcademyPractice[] {
  const rows = new Map<AcademyId, AcademyPractice>(ACADEMIES.map((a) => [a.id, { academy: a.id, name: a.name, blurb: a.blurb, lessonsDone: 0, lessonsTotal: 0, decisions: 0 }]));
  for (const id of new Set(input.lessonIds)) {
    const row = rows.get(tagOf("leccion", id)?.academy as AcademyId);
    if (!row) continue;
    row.lessonsTotal += 1;
    if (input.lessonsDone[id]) row.lessonsDone += 1;
  }
  const seen = new Set<string>();
  for (const d of input.decided) {
    const key = `${d.company}:${d.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const row = rows.get(tagOfItem(d.company, d.id)?.academy as AcademyId);
    if (row) row.decisions += 1;
  }
  for (const id of new Set(input.dilemmaIds)) { const row = rows.get(tagOf("dilema", id)?.academy as AcademyId); if (row) row.decisions += 1; }
  return [...rows.values()];
}

/** Lo mínimo de una partida para saber qué se decidió y en qué empresa del caso. */
export interface DecidedSource {
  company: string;
  decisions: Readonly<Record<string, unknown>>;
  career?: readonly { company: string; decisions: Readonly<Record<string, unknown>> }[];
  shelf?: readonly { state: { company: string; decisions: Readonly<Record<string, unknown>> } }[];
}

/** Todas las decisiones tomadas: las de la empresa en curso, las de empresas ya cerradas y las de empresas guardadas. */
export function decidedOf(s: DecidedSource): { company: string; id: string }[] {
  const out: { company: string; id: string }[] = [];
  const add = (company: string, decisions: Readonly<Record<string, unknown>> | undefined) => { for (const id of Object.keys(decisions ?? {})) out.push({ company, id }); };
  add(s.company, s.decisions);
  for (const run of s.career ?? []) add(run.company, run.decisions);
  for (const sh of s.shelf ?? []) add(sh.state.company, sh.state.decisions);
  return out;
}

/** Totales de la práctica: lecciones terminadas y decisiones que pertenecen a una academia. */
export function practiceTotals(rows: readonly AcademyPractice[]): { lessonsDone: number; lessonsTotal: number; decisions: number } {
  return rows.reduce((t, r) => ({ lessonsDone: t.lessonsDone + r.lessonsDone, lessonsTotal: t.lessonsTotal + r.lessonsTotal, decisions: t.decisions + r.decisions }), { lessonsDone: 0, lessonsTotal: 0, decisions: 0 });
}

/** Texto de la meta de días frente a los últimos siete días. */
export function weekGoalText(daysOn: number, goal: PracticeDays | undefined): string {
  const n = Math.max(0, Math.min(7, Math.round(daysOn)));
  const did = `Practicaste ${n} de los últimos 7 días`;
  if (!goal) return `${did}.`;
  return goal === 7 ? `${did}. Tu meta es practicar todos los días.` : `${did}. Tu meta es practicar ${goal} días por semana.`;
}
