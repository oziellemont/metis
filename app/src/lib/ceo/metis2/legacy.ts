/**
 * MÊTIS 2.0 · Fase 0 · inventario del contenido del simulador de empresas.
 *
 * El rediseño hacia aprendizaje ejecutivo NO borra nada de lo construido: rutas de Academy, lecciones, conceptos,
 * dilemas, casos de cada empresa, banco de decisiones, episodios, crisis y casos de crecimiento se conservan con
 * sus identificadores, porque las partidas guardadas y el historial apuntan a ellos.
 *
 * Esta función junta esos identificadores. `legacy-ids.json` guarda la lista tal como estaba al empezar el rediseño
 * y `legacy.test.ts` exige que ninguno desaparezca. Agregar contenido está permitido; quitar o renombrar, no.
 */
import { LESSONS, TRACKS } from "../lessons";
import { CONCEPTS } from "../concepts";
import { ALL_DILEMMAS } from "../dilemmas";
import { COMPANIES } from "../companies";
import { ARCHETYPES } from "../cases/archetypes";
import { CONTEXTS } from "../cases/contexts";
import { EPISODES } from "../episodes/catalog";
import { GROWTH_CASES } from "../growth/cases";
import { STEPS as CRISIS_STEPS } from "../crisis";
import { LEVERS } from "../change";
import { DIAGNOSTIC } from "../profile";
import { COMPETENCY_IDS } from "../mastery";

export type LegacyKind =
  | "rutas" | "lecciones" | "conceptos" | "dilemas" | "empresas" | "casos" | "arquetipos" | "contextos"
  | "episodios" | "crecimiento" | "crisis" | "palancas" | "diagnostico" | "competencias";

export type LegacyInventory = Record<LegacyKind, string[]>;

/** Solo ordena. No quita repetidos a propósito: si un identificador se repite, la prueba debe verlo. */
const sorted = (ids: Iterable<string>) => [...ids].sort();

/** Identificadores de todo el contenido del simulador, por tipo y en orden alfabético. */
export function legacyInventory(): LegacyInventory {
  return {
    rutas: sorted(TRACKS.map((t) => t.id)),
    lecciones: sorted(LESSONS.map((l) => l.id)),
    conceptos: sorted(Object.keys(CONCEPTS)),
    dilemas: sorted(ALL_DILEMMAS.map((d) => d.id)),
    empresas: sorted(COMPANIES.map((c) => c.id)),
    casos: sorted(COMPANIES.flatMap((c) => c.items.map((i) => `${c.id}:${i.id}`))),
    arquetipos: sorted(ARCHETYPES.map((a) => a.id)),
    contextos: sorted(Object.keys(CONTEXTS)),
    episodios: sorted(Object.keys(EPISODES)),
    crecimiento: sorted(GROWTH_CASES.map((c) => c.id)),
    crisis: sorted(CRISIS_STEPS.map((s) => s.id)),
    palancas: sorted(LEVERS.map((l) => l.id)),
    diagnostico: sorted(DIAGNOSTIC.map((d) => d.id)),
    competencias: sorted(COMPETENCY_IDS),
  };
}

/** Identificadores que estaban en `before` y ya no están en `now`, por tipo. Vacío = no se perdió nada. */
export function missingFrom(before: Partial<LegacyInventory>, now: LegacyInventory): Partial<Record<LegacyKind, string[]>> {
  const out: Partial<Record<LegacyKind, string[]>> = {};
  for (const kind of Object.keys(before) as LegacyKind[]) {
    const have = new Set(now[kind] ?? []);
    const gone = (before[kind] ?? []).filter((id) => !have.has(id));
    if (gone.length) out[kind] = gone;
  }
  return out;
}
