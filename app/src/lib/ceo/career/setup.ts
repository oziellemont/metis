/**
 * mêtis CEO · Carrera continua · lógica pura del onboarding nuevo (P0-B3).
 * Tipo de empresa (startup o establecida) → sector e industria (solo las que tienen casos para ese tipo) → nombre →
 * carta de nombramiento.
 * Sin React: la pantalla solo pinta lo que sale de aquí.
 */
import { companyById } from "../companies";
import type { CompanyPack } from "../types";
import { brandPack } from "./template";
import { cleanName, exposureOfPack, isCompanyId, newCompanyProfile, shortNameOf } from "./identity";
import { ARCHETYPES, SECTORS, TAXONOMY_VERSION, industryOf, isOfferedCombo, isPlayableCombo, searchIndustries, OFFERED_TYPES, type CompanyArchetype, type Industry, type Sector, type Suggestion } from "./taxonomy";

export interface SetupSelection {
  sectorId?: string;
  industryId?: string;
  archetype?: CompanyArchetype;
  displayName?: string;
  shortName?: string;
  specialty?: string;
}

/** Industria jugable que usa un paquete (para preseleccionar según la experiencia declarada). */
export function selectionForPack(packId: string | undefined): SetupSelection {
  if (!packId) return {};
  for (const s of SECTORS) for (const i of s.industries) if (i.contentPackId === packId && i.availability === "available") return { sectorId: s.id, industryId: i.id };
  return {};
}

/** Tipo sugerido para una industria: la establecida si se ofrece; si no, la startup. */
export function defaultArchetype(sectorId: string | undefined, industryId: string | undefined): CompanyArchetype | undefined {
  return (["establecida", "startup"] as const).find((a) => isOfferedCombo(sectorId, industryId, a));
}

// ───────────────────────────────────────────── primero el tipo, luego la industria
/** Tipos que se ofrecen al crear una empresa (ver OFFERED_TYPES en taxonomy.ts). */
export const OFFERED_ARCHETYPES: readonly CompanyArchetype[] = OFFERED_TYPES;
export const isOfferedArchetype = (a: unknown): a is CompanyArchetype => OFFERED_ARCHETYPES.includes(a as CompanyArchetype);
/** Tipo con el que arranca el onboarding: el que tiene más industrias con casos. */
export const DEFAULT_TYPE: CompanyArchetype = "establecida";

/** Industrias con casos aprobados para este tipo (las únicas que se muestran al elegirlo). */
export const industriesForType = (a: CompanyArchetype | undefined): Industry[] =>
  a ? SECTORS.flatMap((s) => s.industries.filter((i) => isOfferedCombo(s.id, i.id, a))) : [];
/** Sectores con al menos una industria para este tipo, cada uno solo con esas industrias. */
export const sectorsForType = (a: CompanyArchetype | undefined): Sector[] =>
  SECTORS.map((s) => ({ ...s, industries: s.industries.filter((i) => !!a && isOfferedCombo(s.id, i.id, a)) })).filter((s) => s.industries.length > 0);
/** ¿Este tipo ya tiene al menos una industria con casos? */
export const typeOpen = (a: CompanyArchetype | undefined): boolean => isOfferedArchetype(a) && industriesForType(a).length > 0;
/** Búsqueda por giro, solo entre las industrias del tipo elegido. */
export const searchForType = (q: string, a: CompanyArchetype | undefined, limit = 6): Suggestion[] =>
  searchIndustries(q, 40).filter((h) => !!a && isOfferedCombo(h.sectorId, h.industryId, a)).slice(0, limit);

/** Cambiar de tipo: conserva la industria si también existe para el nuevo tipo; si no, la limpia. */
export function changeType(sel: SetupSelection, a: CompanyArchetype): SetupSelection {
  if (!isOfferedArchetype(a)) return sel;
  if (isOfferedCombo(sel.sectorId, sel.industryId, a)) return { ...sel, archetype: a };
  const { sectorId: _s, industryId: _i, specialty: _e, ...rest } = sel;
  return { ...rest, archetype: a };
}
/** Sugerencia por experiencia declarada: la industria de ese paquete con un tipo que sí la tiene. */
export function suggestionForPack(packId: string | undefined): SetupSelection {
  const s = selectionForPack(packId);
  const archetype = defaultArchetype(s.sectorId, s.industryId);
  return archetype ? { ...s, archetype } : {};
}
/** Preselección por experiencia declarada: solo si esa industria existe para el tipo elegido. */
export function selectionForPackAndType(packId: string | undefined, a: CompanyArchetype | undefined): SetupSelection {
  const s = selectionForPack(packId);
  return a && isOfferedCombo(s.sectorId, s.industryId, a) ? s : {};
}

/** Nombres de ejemplo por paquete (solo de placeholder; nunca se usan solos). */
const NAME_EXAMPLES: Record<string, string> = { cumbre: "Alimentos Sierra Norte", forja: "Metalúrgica Valle Alto", brasa: "Fogón Regio", kubit: "Nube Regia Software", puntomadero: "Ferretera del Norte", vertice: "Transportes Cerro Alto" };
export const nameExample = (packId: string | undefined): string => (packId && NAME_EXAMPLES[packId]) || "Grupo Horizonte";

/** Nombre corto que se usará: el escrito (si es válido) o el calculado del nombre completo. */
export function effectiveShort(displayName: string | undefined, shortName: string | undefined): string | null {
  const name = cleanName(displayName);
  if (!name) return null;
  const typed = shortName?.trim() ? cleanName(shortName) : undefined;
  if (typed === null) return null;
  return typed ?? shortNameOf(name);
}

export type SetupStep = "tipo" | "industria" | "nombre";
/** ¿Se puede pasar al siguiente paso con lo elegido? Orden: tipo → industria → nombre. */
export function canContinue(step: SetupStep, sel: SetupSelection): boolean {
  if (step === "tipo") return typeOpen(sel.archetype);
  if (step === "industria") return canContinue("tipo", sel) && isOfferedCombo(sel.sectorId, sel.industryId, sel.archetype);
  return canContinue("industria", sel) && !!effectiveShort(sel.displayName, sel.shortName);
}

/** Id nuevo de empresa (uuid v4). Usa crypto.randomUUID si existe; si no, getRandomValues. */
export function newCompanyId(rand: () => number = Math.random): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) {
    const id = c.randomUUID();
    if (isCompanyId(id)) return id;
  }
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(rand() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export interface SetupInput { companyId: string; sectorId: string; industryId: string; archetype: CompanyArchetype; displayName: string; shortName?: string; specialty?: string }

/** Lo que se manda a `setupCompany`. Null si algo no cuadra (misma validación que el motor). */
export function buildSetup(sel: SetupSelection, companyId: string): SetupInput | null {
  if (!canContinue("nombre", sel)) return null;
  const displayName = cleanName(sel.displayName)!;
  const short = sel.shortName?.trim() ? cleanName(sel.shortName)! : undefined;
  const ind = industryOf(sel.sectorId, sel.industryId)!;
  const specialty = sel.specialty && ind.specialties.includes(sel.specialty) ? sel.specialty : undefined;
  const out: SetupInput = { companyId, sectorId: sel.sectorId!, industryId: sel.industryId!, archetype: sel.archetype!, displayName, ...(short ? { shortName: short } : {}), ...(specialty ? { specialty } : {}) };
  return newCompanyProfile({ ...out, at: 1 }, TAXONOMY_VERSION) ? out : null;
}

/** Paquete de la industria con el nombre y la especialidad elegidos (para la carta de nombramiento). */
export function previewPack(sel: SetupSelection): CompanyPack | null {
  const ind = industryOf(sel.sectorId, sel.industryId);
  if (!ind?.contentPackId) return null;
  const pk = companyById(ind.contentPackId);
  const name = cleanName(sel.displayName);
  const short = effectiveShort(sel.displayName, sel.shortName);
  const specialty = sel.specialty && ind.specialties.includes(sel.specialty) ? sel.specialty : undefined;
  // Sin nombre todavía se muestra igual con el vocabulario de la especialidad elegida.
  return brandPack(pk, { name: name && short ? name : pk.name, short: name && short ? short : pk.short, city: exposureOfPack(pk.id).baseCity, ...(specialty ? { specialty } : {}) });
}

/** Quién te nombra, según el tipo de empresa (nunca eres fundador). */
export const appointedByOf = (a: CompanyArchetype | undefined): string => ARCHETYPES.find((x) => x.id === a)?.appointedBy ?? "Te nombra el consejo.";
