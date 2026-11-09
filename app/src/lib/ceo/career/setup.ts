/**
 * mêtis CEO · Carrera continua · lógica pura del onboarding nuevo (P0-B3).
 * Tipo de empresa (startup o establecida) → sector e industria (solo las que tienen casos para ese tipo) → nombre →
 * carta de nombramiento.
 * Sin React: la pantalla solo pinta lo que sale de aquí.
 */
import { companyById } from "../companies";
import type { CompanyPack } from "../types";
import { brandPack } from "./template";
import { GROWTH_ARCHETYPE, GROWTH_ARCHETYPES, growthTemplateFor } from "../growth/combos";
import { TEMPLATES } from "../growth/families";
import { TEMPLATES_V2 } from "../growth/steel/params";
import { TEMPLATES_RETAIL } from "../growth/retail/params";
import { profileOf } from "../growth/models";
import { cleanName, exposureOfPack, isCompanyId, newCompanyProfile, shortNameOf } from "./identity";
import { ARCHETYPES, SECTORS, TAXONOMY_VERSION, industryOf, isOfferedCombo, isPlayableCombo, searchIndustries, OFFERED_TYPES, type CompanyArchetype, type Industry, type Sector, type Suggestion } from "./taxonomy";

export interface SetupSelection {
  sectorId?: string;
  industryId?: string;
  archetype?: CompanyArchetype;
  displayName?: string;
  shortName?: string;
  specialty?: string;
  /** Empresa emergente (Growth Engine, detrás de su interruptor). Tipo interno «pyme». */
  growth?: boolean;
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

// ───────────────────────────────────────────── empresa emergente (Growth Engine, detrás del interruptor)
/**
 * Con el interruptor growth_engine, el primer paso ofrece dos tarjetas que usan el mismo motor vivo:
 *  - «StartUp» (tipo interno pyme): una empresa chiquita que creces desde cero (solo industrias piloto).
 *  - «Empresa consolidada» (establecida): en las industrias piloto, el mismo motor con muchas más personas y sedes;
 *    en el resto, la establecida de siempre.
 * `sel.growth` marca que el interruptor está encendido; si la industria tiene motor lo decide `growthTemplateFor`.
 */
export const GROWTH_CHOICES = Object.freeze([
  { id: "emergente", label: "StartUp", hint: "Crece una empresa pequeña desde cero.", detail: "Una sede, pocas personas y caja justa.", appointedBy: "Te nombra el dueño." },
  { id: "consolidada", label: "Empresa consolidada", hint: "Dirige una empresa con varias sedes y mucha gente.", detail: "Estructura formal y un consejo que revisa cada mes.", appointedBy: "Te nombra el consejo." },
] as const);
export type GrowthChoice = (typeof GROWTH_CHOICES)[number]["id"];
export const choiceOf = (sel: SetupSelection): GrowthChoice | null =>
  sel.growth && sel.archetype === GROWTH_ARCHETYPE ? "emergente" : sel.archetype === "establecida" ? "consolidada" : null;
/** Industrias con StartUp jugable (las dos del piloto). */
export const growthIndustries = (): Industry[] => SECTORS.flatMap((s) => s.industries.filter((i) => !!growthTemplateFor(s.id, i.id) && isPlayableCombo(s.id, i.id)));
/** Plantilla del motor que se usaría con esta selección (null si va por el camino de siempre). */
export const templateOfSel = (sel: SetupSelection): string | null =>
  sel.growth && (GROWTH_ARCHETYPES as readonly string[]).includes(sel.archetype ?? "") ? growthTemplateFor(sel.sectorId, sel.industryId, sel.archetype) : null;
/** Elegir tarjeta: conserva la industria si también existe en la otra opción. */
export function changeChoice(sel: SetupSelection, c: GrowthChoice): SetupSelection {
  const { growth: _g, ...rest } = sel;
  if (c === "consolidada") return { ...changeType(rest, "establecida"), growth: true };
  const keep = !!growthTemplateFor(sel.sectorId, sel.industryId);
  const { sectorId: _s, industryId: _i, specialty: _e, ...bare } = rest;
  return { ...(keep ? rest : bare), archetype: GROWTH_ARCHETYPE, growth: true };
}
/** Resumen de la empresa que vas a dirigir (de la plantilla del motor; cifras reales del modelo). */
export const growthSummaryOf = (sel: SetupSelection): string | null => {
  const t = templateOfSel(sel);
  return t ? TEMPLATES[t]?.summary ?? TEMPLATES_V2[t]?.summary ?? TEMPLATES_RETAIL[t]?.summary ?? null : null;
};
/** Datos de la carta de nombramiento (de la plantilla del motor, nunca inventados). */
export function growthFactsOf(sel: SetupSelection): [string, string][] | null {
  const id = templateOfSel(sel);
  const S = id ? TEMPLATES_V2[id] : null;
  if (S) {
    const m = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
    return [
      ["Personas", String(S.crews.reduce((a, x) => a + x.n, 0))],
      ["Planta", S.kind === "integrada" ? "Fusión, colada y laminación" : "Fusión y colada"],
      ["Caja al llegar", m(S.cash)],
      ["Renta mensual", m(S.rent)],
    ];
  }
  const R = id ? TEMPLATES_RETAIL[id] : null;
  if (R) {
    const m = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
    const stores = R.groups.reduce((a, g) => a + g.n, 0);
    const people = R.groups.reduce((a, g) => a + g.n * (1 + g.staff), 0) + R.crews.reduce((a, x) => a + x.n, 0);
    return [
      ["Personas", people.toLocaleString("en-US")],
      ["Tiendas", `${stores} · 24 horas`],
      ["Caja al llegar", m(R.cash)],
      ["Deuda", R.debt ? m(R.debt.amount) : "$0"],
    ];
  }
  const T = id ? TEMPLATES[id] : null;
  if (!T) return null;
  const site = T.sites[0];
  const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  const rent = T.sites.reduce((a, x) => a + x.rent, 0);
  return [
    ["Personas", String(T.staff.length)],
    [profileOf(T).site.Many, T.sites.length === 1 ? `1 · ${site.name}` : String(T.sites.length)],
    ["Caja al llegar", money(T.cash)],
    ["Renta mensual", money(rent)],
  ];
}
const isStartup = (sel: SetupSelection) => !!sel.growth && sel.archetype === GROWTH_ARCHETYPE;
const comboOk = (sel: SetupSelection) =>
  isStartup(sel) ? !!growthTemplateFor(sel.sectorId, sel.industryId) && isPlayableCombo(sel.sectorId, sel.industryId) : isOfferedCombo(sel.sectorId, sel.industryId, sel.archetype);
/** Sectores para la selección (la StartUp solo trae las industrias piloto). */
export const sectorsForSel = (sel: SetupSelection): Sector[] =>
  isStartup(sel) ? SECTORS.map((s) => ({ ...s, industries: s.industries.filter((i) => !!growthTemplateFor(s.id, i.id)) })).filter((s) => s.industries.length > 0) : sectorsForType(sel.archetype);
export const searchForSel = (q: string, sel: SetupSelection, limit = 6): Suggestion[] =>
  isStartup(sel) ? searchIndustries(q, 40).filter((h) => !!growthTemplateFor(h.sectorId, h.industryId)).slice(0, limit) : searchForType(q, sel.archetype, limit);

export type SetupStep = "tipo" | "industria" | "nombre";
/** ¿Se puede pasar al siguiente paso con lo elegido? Orden: tipo → industria → nombre. */
export function canContinue(step: SetupStep, sel: SetupSelection): boolean {
  if (step === "tipo") return isStartup(sel) || typeOpen(sel.archetype);
  if (step === "industria") return canContinue("tipo", sel) && comboOk(sel);
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

export interface SetupInput { companyId: string; sectorId: string; industryId: string; archetype: CompanyArchetype; displayName: string; shortName?: string; specialty?: string; growth?: boolean }

/** Lo que se manda a `setupCompany`. Null si algo no cuadra (misma validación que el motor). */
export function buildSetup(sel: SetupSelection, companyId: string): SetupInput | null {
  if (!canContinue("nombre", sel)) return null;
  const displayName = cleanName(sel.displayName)!;
  const short = sel.shortName?.trim() ? cleanName(sel.shortName)! : undefined;
  const ind = industryOf(sel.sectorId, sel.industryId)!;
  const specialty = sel.specialty && ind.specialties.includes(sel.specialty) ? sel.specialty : undefined;
  const out: SetupInput = { companyId, sectorId: sel.sectorId!, industryId: sel.industryId!, archetype: sel.archetype!, displayName, ...(short ? { shortName: short } : {}), ...(specialty ? { specialty } : {}), ...(templateOfSel(sel) ? { growth: true } : {}) };
  return newCompanyProfile({ ...out, at: 1 }, TAXONOMY_VERSION) ? out : null;
}

/** Paquete de la industria con el nombre y la especialidad elegidos (para la carta de nombramiento). */
export function previewPack(sel: SetupSelection): CompanyPack | null {
  const ind = industryOf(sel.sectorId, sel.industryId);
  if (!ind?.contentPackId) return null;
  const pk = companyById(ind.contentPackId);
  const name = cleanName(sel.displayName);
  const short = effectiveShort(sel.displayName, sel.shortName);
  const specialty = sel.specialty && ind.specialties.includes(sel.specialty) ? sel.specialty : ind.defaultSpecialty;
  // Sin nombre todavía se muestra igual con el vocabulario de la especialidad elegida.
  return brandPack(pk, { name: name && short ? name : pk.name, short: name && short ? short : pk.short, city: exposureOfPack(pk.id).baseCity, ...(specialty ? { specialty } : {}) });
}

/** Quién te nombra, según el tipo de empresa (nunca eres fundador). */
export const appointedByOf = (a: CompanyArchetype | undefined): string => ARCHETYPES.find((x) => x.id === a)?.appointedBy ?? "Te nombra el consejo.";
