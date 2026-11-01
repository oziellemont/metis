/**
 * mêtis CEO · identidad de la empresa en la carrera continua (P0-B2).
 *
 * El jugador es CEO NOMBRADO (nunca fundador) de UNA empresa persistente. La empresa se elige por
 * sector → industria → tipo y lleva un nombre propio. `companyId` no cambia al renombrar: todo lo que
 * cuelgue de la empresa (periodos, reportes, memoria) se ata a ese id, no al nombre.
 *
 * Lógica pura y opcional: si `CeoState.companyProfile` no existe, todo funciona como hoy (temporadas).
 */
import { industryOf, isArchetype, isPlayableCombo, sectorById, type CompanyArchetype } from "./taxonomy";
import { companyById, isCompany } from "../companies";

/** Trayectoria ilustrativa del doc P0 §4 (no es una escalera obligatoria ni se compra con dinero). */
export const COMPANY_STAGES = [
  { id: "tomar_el_mando", label: "Tomar el mando" },
  { id: "estabilizar", label: "Estabilizar" },
  { id: "construir_capacidad", label: "Construir capacidad" },
  { id: "acelerar", label: "Acelerar con criterio" },
  { id: "escalar", label: "Escalar" },
  { id: "gobernar", label: "Gobernar la complejidad" },
] as const;
export type CompanyStage = (typeof COMPANY_STAGES)[number]["id"];
export const isStage = (v: unknown): v is CompanyStage => COMPANY_STAGES.some((s) => s.id === v);

export type Currency = "MXN" | "USD";

/** Exposición ficticia de la empresa: sirve para cruzar eventos externos (clima, aranceles, divisas) con ella. */
export interface CompanyExposure {
  baseCity: string;
  sites: { kind: "planta" | "almacen" | "sucursal" | "oficina" | "centro_distribucion"; city: string }[];
  suppliers: { what: string; region: string }[];
  buyCurrencies: Currency[];
  sellCurrencies: Currency[];
}

export interface CompanyProfile {
  /** uuid; no cambia al renombrar. */
  companyId: string;
  sectorId: string;
  industryId: string;
  archetype: CompanyArchetype;
  /** Nombre que eligió el jugador (2–40 caracteres). */
  displayName: string;
  /** Nombre corto para textos («en Casa Norte»). Se deriva y se puede editar. */
  shortName: string;
  /** Paquete de casos que da contenido a la empresa (el jugador nunca ve este id). */
  contentPackId: string;
  metricProfileId: string;
  /** Rama dentro de la industria (botanas, arneses, 3PL…). Solo da color; no cambia la industria. */
  specialty?: string;
  stage: CompanyStage;
  userRole: "appointed_ceo";
  appointedAt: number;
  renamedAt?: number;
  /** Moneda base de la simulación. La pantalla puede mostrar USD (ver `fx`), sin recalcular nada. */
  currency: "MXN";
  exposure: CompanyExposure;
  /** Versión de la taxonomía con que se creó (para leerla igual si el catálogo cambia). */
  taxonomyVersion: number;
}

// ───────────────────────────────────────────── nombre
export const NAME_MIN = 2;
export const NAME_MAX = 40;
/** Llaves y signos de plantilla nunca entran en un nombre (no deben poder inyectar variables). */
const FORBIDDEN = /[{}<>\\\u0000-\u001f\u007f]/;

export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (t.length < NAME_MIN || t.length > NAME_MAX || FORBIDDEN.test(t)) return null;
  if (!/[\p{L}\p{N}]/u.test(t)) return null;
  return t;
}

const LEGAL = /\s*,?\s*(s\.?\s*a\.?\s*p\.?\s*i\.?|s\.?\s*a\.?\s*b\.?|s\.?\s*a\.?|s\.?\s*de\s*r\.?\s*l\.?|s\.?\s*c\.?)(\s*de\s*c\.?\s*v\.?)?\.?$/i;
const GENERIC_LEAD = new Set(["grupo", "corporativo", "corporacion", "corporación", "industrias", "comercializadora", "compania", "compañía", "empresas"]);

const CONNECTORS = new Set(["de", "del", "la", "las", "los", "el", "y", "e", "&"]);

/** «Grupo Casa Norte Alimentos S.A. de C.V.» → «Casa Norte». Si no hay nada que quitar, el mismo nombre. */
export function shortNameOf(displayName: string): string {
  let t = displayName.replace(LEGAL, "").trim();
  const w = t.split(" ");
  if (w.length > 1 && GENERIC_LEAD.has(w[0].toLowerCase())) w.shift();
  const cut = w.length > 2 ? w.slice(0, 2) : w;
  while (cut.length > 1 && CONNECTORS.has(cut[cut.length - 1].toLowerCase())) cut.pop();
  t = cut.join(" ");
  return cleanName(t) ?? displayName;
}

/** Dominio ficticio del correo interno a partir del nombre («Casa Norte» → casanorte.mx). */
export function domainOf(name: string): string {
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24);
  return `${slug || "empresa"}.mx`;
}

// ───────────────────────────────────────────── exposición por paquete
/** Exposición inicial de cada paquete (ficticia y plausible). El jugador no la edita en P0. */
const PACK_EXPOSURE: Record<string, CompanyExposure> = {
  cumbre: {
    baseCity: "Monterrey, N.L.",
    sites: [{ kind: "planta", city: "Monterrey, N.L." }, { kind: "centro_distribucion", city: "Saltillo, Coah." }],
    suppliers: [{ what: "Papa y maíz", region: "Chihuahua y Sinaloa" }, { what: "Aceite vegetal", region: "Jalisco" }, { what: "Película de empaque", region: "Texas, EE. UU." }],
    buyCurrencies: ["MXN", "USD"],
    sellCurrencies: ["MXN"],
  },
  forja: {
    baseCity: "Ramos Arizpe, Coah.",
    sites: [{ kind: "planta", city: "Ramos Arizpe, Coah." }],
    suppliers: [{ what: "Acero en rollo", region: "Coahuila y Texas, EE. UU." }, { what: "Herramentales", region: "Michigan, EE. UU." }],
    buyCurrencies: ["USD", "MXN"],
    sellCurrencies: ["USD"],
  },
  brasa: {
    baseCity: "Guadalajara, Jal.",
    sites: [{ kind: "sucursal", city: "Guadalajara, Jal." }, { kind: "sucursal", city: "León, Gto." }, { kind: "sucursal", city: "Ciudad de México" }, { kind: "almacen", city: "Zapopan, Jal." }],
    suppliers: [{ what: "Carne de res", region: "Sonora y Jalisco" }, { what: "Abarrotes y desechables", region: "Jalisco" }],
    buyCurrencies: ["MXN"],
    sellCurrencies: ["MXN"],
  },
  kubit: {
    baseCity: "Monterrey, N.L.",
    sites: [{ kind: "oficina", city: "Monterrey, N.L." }],
    suppliers: [{ what: "Nube e infraestructura", region: "Virginia, EE. UU." }, { what: "Centro de datos de respaldo", region: "Nuevo León" }],
    buyCurrencies: ["USD", "MXN"],
    sellCurrencies: ["MXN"],
  },
};
export const exposureOfPack = (packId: string): CompanyExposure => {
  const e = PACK_EXPOSURE[packId];
  if (e) return structuredClone(e);
  const city = isCompany(packId) ? companyById(packId).city : "Monterrey, N.L.";
  return { baseCity: city, sites: [], suppliers: [], buyCurrencies: ["MXN"], sellCurrencies: ["MXN"] };
};

// ───────────────────────────────────────────── crear, renombrar y limpiar
export interface NewCompanyInput {
  companyId: string;
  sectorId: string;
  industryId: string;
  archetype: string;
  displayName: string;
  shortName?: string;
  specialty?: string;
  at: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isCompanyId = (x: unknown): x is string => typeof x === "string" && UUID.test(x);

/**
 * Crea la identidad. Única puerta: la combinación sector/industria/tipo debe ser jugable (con casos aprobados).
 * Devuelve null si algo no cuadra; nunca crea una empresa a medias.
 */
export function newCompanyProfile(i: NewCompanyInput, taxonomyVersion: number): CompanyProfile | null {
  if (!isCompanyId(i.companyId) || !isArchetype(i.archetype) || !isPlayableCombo(i.sectorId, i.industryId, i.archetype)) return null;
  if (typeof i.at !== "number" || !Number.isFinite(i.at) || i.at <= 0) return null;
  const displayName = cleanName(i.displayName);
  if (!displayName) return null;
  const shortName = i.shortName === undefined ? shortNameOf(displayName) : cleanName(i.shortName);
  if (!shortName) return null;
  const ind = industryOf(i.sectorId, i.industryId)!;
  const specialty = typeof i.specialty === "string" && ind.specialties.includes(i.specialty) ? i.specialty : undefined;
  return {
    companyId: i.companyId.toLowerCase(),
    sectorId: i.sectorId,
    industryId: i.industryId,
    archetype: i.archetype,
    displayName,
    shortName,
    contentPackId: ind.contentPackId!,
    metricProfileId: ind.metricProfileId!,
    ...(specialty ? { specialty } : {}),
    stage: "tomar_el_mando",
    userRole: "appointed_ceo",
    appointedAt: Math.round(i.at),
    currency: "MXN",
    exposure: exposureOfPack(ind.contentPackId!),
    taxonomyVersion,
  };
}

/** Renombra sin tocar el id ni nada más. Devuelve el mismo objeto si el nombre no es válido o no cambia. */
export function renameProfile(p: CompanyProfile, displayName: unknown, shortName: unknown, at: number): CompanyProfile {
  const name = cleanName(displayName);
  if (!name) return p;
  const short = shortName === undefined || shortName === null || shortName === "" ? shortNameOf(name) : cleanName(shortName);
  if (!short) return p;
  if (name === p.displayName && short === p.shortName) return p;
  return { ...p, displayName: name, shortName: short, renamedAt: Math.round(at) };
}

const isCur = (x: unknown): x is Currency => x === "MXN" || x === "USD";
const SITE_KINDS = new Set(["planta", "almacen", "sucursal", "oficina", "centro_distribucion"]);
const shortStr = (x: unknown, max = 80): x is string => typeof x === "string" && x.trim().length > 0 && x.length <= max && !FORBIDDEN.test(x);

function sanitizeExposure(x: unknown, packId: string): CompanyExposure {
  const base = exposureOfPack(packId);
  if (!x || typeof x !== "object" || Array.isArray(x)) return base;
  const r = x as Record<string, unknown>;
  const sites = Array.isArray(r.sites) ? r.sites.filter((s): s is CompanyExposure["sites"][number] => !!s && typeof s === "object" && SITE_KINDS.has((s as { kind?: string }).kind ?? "") && shortStr((s as { city?: unknown }).city)).slice(0, 20) : base.sites;
  const suppliers = Array.isArray(r.suppliers) ? r.suppliers.filter((s): s is CompanyExposure["suppliers"][number] => !!s && typeof s === "object" && shortStr((s as { what?: unknown }).what) && shortStr((s as { region?: unknown }).region)).slice(0, 20) : base.suppliers;
  const curs = (v: unknown, d: Currency[]) => (Array.isArray(v) && v.length && v.every(isCur) ? [...new Set(v)] : d);
  return {
    baseCity: shortStr(r.baseCity) ? r.baseCity : base.baseCity,
    sites: sites.map((s) => ({ kind: s.kind, city: s.city })),
    suppliers: suppliers.map((s) => ({ what: s.what, region: s.region })),
    buyCurrencies: curs(r.buyCurrencies, base.buyCurrencies),
    sellCurrencies: curs(r.sellCurrencies, base.sellCurrencies),
  };
}

/**
 * Lee una identidad guardada. Exige lo esencial (id, combinación existente, paquete real, nombre válido);
 * lo accesorio (etapa, exposición, nombre corto) se repara. Devuelve null si no se puede confiar en ella.
 * Ojo: no exige que la combinación siga «disponible» hoy: una empresa ya creada se sigue leyendo.
 */
export function sanitizeCompanyProfile(raw: unknown): CompanyProfile | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (!isCompanyId(r.companyId) || typeof r.sectorId !== "string" || typeof r.industryId !== "string" || !isArchetype(r.archetype)) return null;
  if (!sectorById(r.sectorId) || !industryOf(r.sectorId, r.industryId)) return null;
  if (typeof r.contentPackId !== "string" || !isCompany(r.contentPackId)) return null;
  const displayName = cleanName(r.displayName);
  if (!displayName || typeof r.appointedAt !== "number" || !Number.isFinite(r.appointedAt) || r.appointedAt <= 0) return null;
  const ind = industryOf(r.sectorId, r.industryId)!;
  const shortName = cleanName(r.shortName) ?? shortNameOf(displayName);
  const specialty = typeof r.specialty === "string" && ind.specialties.includes(r.specialty) ? r.specialty : undefined;
  return {
    companyId: r.companyId.toLowerCase(),
    sectorId: r.sectorId,
    industryId: r.industryId,
    archetype: r.archetype,
    displayName,
    shortName,
    contentPackId: r.contentPackId,
    metricProfileId: typeof r.metricProfileId === "string" && r.metricProfileId ? r.metricProfileId : ind.metricProfileId ?? "general",
    ...(specialty ? { specialty } : {}),
    stage: isStage(r.stage) ? r.stage : "tomar_el_mando",
    userRole: "appointed_ceo",
    appointedAt: Math.round(r.appointedAt),
    ...(typeof r.renamedAt === "number" && Number.isFinite(r.renamedAt) && r.renamedAt > 0 ? { renamedAt: Math.round(r.renamedAt) } : {}),
    currency: "MXN",
    exposure: sanitizeExposure(r.exposure, r.contentPackId),
    taxonomyVersion: typeof r.taxonomyVersion === "number" && Number.isInteger(r.taxonomyVersion) && r.taxonomyVersion >= 1 ? r.taxonomyVersion : 1,
  };
}
