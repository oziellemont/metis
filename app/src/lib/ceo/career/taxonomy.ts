/**
 * mêtis CEO · Carrera continua · Taxonomía sector → industria (P0-B1).
 *
 * Fuente: documento estratégico P0 §3.1, ajuste de Oziel (sectores con lógica SCIAN, 7 industrias foco) y Atlas §8.2 (`sector_catalog`, `industry_catalog`).
 * Reglas:
 *  - Datos puros, sin React. La UI nunca mantiene listas propias: todo sale de aquí.
 *  - Ids estables (minúsculas y guion bajo). Cambiar una etiqueta no cambia el id.
 *  - Una industria solo es jugable si tiene paquete de contenido aprobado, perfil de métricas y al menos un tipo
 *    de empresa soportado. Todo lo demás se muestra con COMING_SOON_LABEL y se bloquea.
 *  - El tipo de empresa (PYME / startup / establecida) es una dimensión aparte, nunca parte de la industria.
 *  - La búsqueda por sinónimo SUGIERE una pareja sector/industria; no la selecciona sola.
 *  - Lo usa el onboarding de la carrera continua (P0-B3, components/ceo/CompanySetup.tsx), abierto para todos.
 */
import { COMING_SOON_LABEL } from "../catalog";
import { isCompany } from "../companies";

export const TAXONOMY_VERSION = 2;

export const ARCHETYPES = [
  { id: "pyme", label: "PYME", appointedBy: "Te nombran los dueños.", hint: "Negocio local o regional, estructura ligera, recursos ajustados." },
  { id: "startup", label: "Startup en operación", appointedBy: "Te contratan los fundadores y los inversionistas.", hint: "Ya tiene producto, equipo y clientes; busca escala o rentabilidad." },
  { id: "establecida", label: "Establecida", appointedBy: "Te nombra el consejo.", hint: "Mediana, con operación predecible y mandos formales. No es gigante." },
] as const;
export type CompanyArchetype = (typeof ARCHETYPES)[number]["id"];
/**
 * Tipos que se ofrecen al crear una empresa: solo startup y establecida (decisión de Oziel, nov-2026). La PYME sigue
 * siendo válida para las empresas ya creadas (se leen, se reproducen y se juegan igual), pero ya no se ofrece.
 */
export const OFFERED_TYPES = ["startup", "establecida"] as const;
export const isArchetype = (v: unknown): v is CompanyArchetype => ARCHETYPES.some((a) => a.id === v);

/** Familias operativas: plantillas compartidas de métricas y casos (doc P0 §3.1 punto 7). */
export type OperatingFamily = "produccion" | "comercio" | "tecnologia" | "logistica" | "hospitalidad" | "servicios" | "capital" | "proyectos" | "financiero" | "salud";

export interface IndustrySeed {
  id: string;
  label: string;
  aliases?: string[];
  /** Paquete de contenido con casos aprobados (cumbre, forja, brasa…). Sin paquete = no jugable. */
  pack?: string;
  /** Tipos con contenido aprobado para esta industria (el motor los acepta; incluye los de empresas ya creadas). */
  archetypes?: CompanyArchetype[];
  /** Tipos que se OFRECEN al crear una empresa nueva (startup o establecida). Sin dato: los de `archetypes` que se ofrecen. */
  offer?: CompanyArchetype[];
  /** Perfil de métricas propio de la industria (no se muestran KPI de inventario en SaaS, etc.). */
  metric?: string;
  /** Industria del foco de lanzamiento (decisión de Oziel). */
  focus?: boolean;
  /** Ramas concretas dentro de la industria (botanas, arneses, 3PL…). Dan color a nombres y casos; no son otra industria. */
  specialties?: string[];
}
export interface SectorSeed {
  id: string;
  label: string;
  family: OperatingFamily;
  focus: boolean;
  industries: IndustrySeed[];
}

export type Availability = "available" | "coming_soon";
export interface Industry {
  id: string;
  sectorId: string;
  label: string;
  family: OperatingFamily;
  aliases: string[];
  contentPackId?: string;
  metricProfileId?: string;
  supportedArchetypes: CompanyArchetype[];
  /** Tipos que se ofrecen hoy al crear una empresa (subconjunto de `supportedArchetypes`, solo startup/establecida). */
  offeredArchetypes: CompanyArchetype[];
  availability: Availability;
  focus: boolean;
  specialties: string[];
}
export interface Sector {
  id: string;
  label: string;
  family: OperatingFamily;
  focus: boolean;
  availability: Availability;
  industries: Industry[];
}

/* Catálogo v2 (31-oct-2026): sectores alineados a la lógica del SCIAN (INEGI) por decisión de Oziel.
   Manufactura es SECTOR; Alimentos y bebidas, Autopartes y Manufactura industrial general son industrias dentro de él.
   Restaurantes pertenece a «servicios de preparación de alimentos», no a manufactura. Las ramas finas viven en `specialties`. */
const SECTOR_DATA: SectorSeed[] = [
  { id: "manufactura", label: "Manufactura", family: "produccion", focus: true, industries: [
    { id: "alimentos_bebidas", label: "Alimentos y bebidas", aliases: ["alimentos", "bebidas", "snacks", "botanas", "lacteos", "panaderia", "refrescos", "consumo masivo", "food"], pack: "cumbre", archetypes: ["pyme", "establecida"], offer: ["establecida"], metric: "alimentos", focus: true, specialties: ["Botanas y snacks", "Panadería y galletas", "Lácteos", "Bebidas no alcohólicas", "Salsas y condimentos", "Alimentos congelados", "Café"] },
    { id: "autopartes", label: "Autopartes", aliases: ["autopartes", "auto parts", "tier 1", "proveedor automotriz", "automotriz"], pack: "forja", archetypes: ["establecida"], metric: "autopartes", focus: true, specialties: ["Estampado y soldadura", "Inyección de plástico automotriz", "Arneses eléctricos", "Frenos y suspensión", "Interiores"] },
    { id: "manufactura_general", label: "Manufactura industrial general", aliases: ["manufactura", "fabrica", "planta", "industrial", "maquila", "metalmecanica", "plasticos", "empaques"], metric: "manufactura", focus: true, specialties: ["Metalmecánica", "Plásticos y empaques", "Maquinaria y equipo", "Manufactura por contrato", "Muebles y mobiliario"] },
    { id: "electronica", label: "Electrónica y componentes", aliases: ["electronica", "semiconductores"] },
    { id: "quimica_farmaceutica", label: "Química y farmacéutica", aliases: ["quimica", "farmaceutica", "laboratorio farmaceutico"] },
    { id: "textil_confeccion", label: "Textil, confección y calzado", aliases: ["textil", "ropa", "calzado", "moda"] },
    { id: "cuidado_personal", label: "Cosméticos y cuidado personal", aliases: ["cosmeticos", "higiene"] },
    { id: "equipo_medico", label: "Equipo y dispositivos médicos", aliases: ["medtech", "dispositivos medicos"] },
    { id: "aeroespacial", label: "Componentes aeroespaciales", aliases: ["aeroespacial", "aviacion"] },
  ] },
  { id: "restaurantes_alimentos", label: "Restaurantes y servicios de alimentos", family: "hospitalidad", focus: true, industries: [
    { id: "restaurantes", label: "Restaurantes", aliases: ["restaurante", "comida", "food service", "cadena de restaurantes", "casual dining"], pack: "brasa", archetypes: ["establecida"], metric: "restaurantes", focus: true, specialties: ["Casual dining", "Comida rápida", "Restaurante de especialidad", "Cocinas ocultas"] },
    { id: "cafeterias", label: "Cafeterías", aliases: ["cafeteria", "coffee shop", "cafe"] },
    { id: "catering", label: "Catering y comedores industriales", aliases: ["catering", "comedor industrial"] },
  ] },
  { id: "tecnologia_informacion", label: "Tecnología e información", family: "tecnologia", focus: true, industries: [
    { id: "software_saas", label: "Software y SaaS", aliases: ["saas", "software", "b2b", "software as a service", "plataforma", "startup de software"], pack: "kubit", archetypes: ["startup", "establecida"], offer: ["startup"], metric: "saas", focus: true, specialties: ["SaaS B2B", "Software vertical", "Software industrial", "HRTech", "MarTech"] },
    { id: "inteligencia_artificial", label: "Inteligencia artificial aplicada", aliases: ["ia", "ai", "machine learning"] },
    { id: "ciberseguridad", label: "Ciberseguridad", aliases: ["cyber", "seguridad informatica"] },
    { id: "aplicaciones_consumo", label: "Aplicaciones de consumo", aliases: ["app", "apps", "b2c"] },
    { id: "datos_cloud", label: "Datos, nube e infraestructura digital", aliases: ["cloud", "nube", "centros de datos", "data"] },
    { id: "telecom", label: "Telecomunicaciones", aliases: ["telecom", "fibra", "internet"] },
    { id: "medios_digitales", label: "Medios y contenidos digitales", aliases: ["medios", "streaming", "contenidos"] },
  ] },
  { id: "comercio", label: "Comercio", family: "comercio", focus: true, industries: [
    { id: "retail", label: "Retail", aliases: ["retail", "tiendas", "sucursales", "minorista", "omnicanal", "ecommerce", "e-commerce", "tienda en linea"], pack: "puntomadero", archetypes: ["establecida"], metric: "retail", focus: true, specialties: ["Tiendas especializadas", "Moda y accesorios", "Hogar y ferretería", "Electrónica de consumo", "E-commerce DTC", "Omnicanal"] },
    { id: "mayoreo", label: "Comercio al por mayor (B2B)", aliases: ["mayoreo", "mayorista", "distribuidor"] },
    { id: "supermercados", label: "Supermercados y conveniencia", aliases: ["super", "abarrotes", "conveniencia", "minisuper"] },
    { id: "farmacias", label: "Farmacias", aliases: ["farmacia"] },
    { id: "marketplaces", label: "Marketplaces", aliases: ["marketplace"] },
    { id: "agencias_automotrices", label: "Agencias y refacciones automotrices", aliases: ["agencia de autos", "refacciones"] },
  ] },
  { id: "transporte_almacenamiento", label: "Transporte y almacenamiento", family: "logistica", focus: true, industries: [
    { id: "logistica_distribucion", label: "Logística y distribución", aliases: ["logistica", "distribucion", "3pl", "4pl", "cedis", "almacen", "bodega", "operador logistico", "ultima milla", "fulfillment", "transporte de carga", "fletes"], pack: "vertice", archetypes: ["establecida"], metric: "logistica", focus: true, specialties: ["Operador 3PL", "Transporte terrestre de carga", "Almacenes y CEDIS", "Última milla", "Cadena fría", "Fulfillment de e-commerce"] },
    { id: "comercio_exterior", label: "Logística internacional y aduanas", aliases: ["aduanas", "comercio exterior", "agente aduanal"] },
    { id: "transporte_pasajeros", label: "Transporte de pasajeros y movilidad", aliases: ["movilidad", "flotillas", "autobuses"] },
    { id: "maritimo_aereo", label: "Transporte marítimo, aéreo y ferroviario", aliases: ["maritimo", "carga aerea", "ferroviario"] },
  ] },
  { id: "agro", label: "Agricultura y agroindustria", family: "produccion", focus: false, industries: [
    { id: "agricultura", label: "Agricultura y horticultura", aliases: ["agricultura", "invernaderos"] },
    { id: "ganaderia", label: "Ganadería y avicultura", aliases: ["ganaderia", "avicola"] },
    { id: "agroexportacion", label: "Agroexportación", aliases: ["agroexportacion", "exportacion agricola"] },
  ] },
  { id: "mineria", label: "Minería, metales y materiales", family: "capital", focus: false, industries: [
    { id: "mineria_metalica", label: "Minería", aliases: ["mineria", "mina"] },
    { id: "acero", label: "Siderurgia y acero", aliases: ["acero", "acerera"] },
    { id: "cemento", label: "Cemento y materiales de construcción", aliases: ["cemento", "concreto", "cementera"] },
  ] },
  { id: "energia", label: "Energía y servicios públicos", family: "capital", focus: false, industries: [
    { id: "electricidad", label: "Generación y suministro eléctrico", aliases: ["solar", "eolica", "energia", "paneles"] },
    { id: "petroleo_gas", label: "Petróleo y gas", aliases: ["oil and gas", "petroleo", "gas natural"] },
    { id: "agua", label: "Agua y saneamiento", aliases: ["agua", "tratamiento de agua"] },
  ] },
  { id: "construccion", label: "Construcción e infraestructura", family: "proyectos", focus: false, industries: [
    { id: "edificacion", label: "Construcción residencial y comercial", aliases: ["constructora", "vivienda"] },
    { id: "infraestructura", label: "Obra civil e infraestructura", aliases: ["carreteras", "obra publica"] },
  ] },
  { id: "inmobiliario", label: "Servicios inmobiliarios", family: "proyectos", focus: false, industries: [
    { id: "desarrollo_inmobiliario", label: "Desarrollo inmobiliario", aliases: ["desarrolladora", "inmobiliaria"] },
    { id: "parques_industriales", label: "Parques industriales y naves", aliases: ["naves industriales"] },
  ] },
  { id: "finanzas", label: "Servicios financieros y seguros", family: "financiero", focus: false, industries: [
    { id: "banca", label: "Banca y crédito", aliases: ["banco", "credito", "neobanco", "fintech"] },
    { id: "pagos", label: "Pagos y fintech", aliases: ["fintech", "pagos", "payments", "remesas"] },
    { id: "seguros", label: "Seguros", aliases: ["aseguradora", "insurtech"] },
  ] },
  { id: "servicios_profesionales", label: "Servicios profesionales", family: "servicios", focus: false, industries: [
    { id: "consultoria", label: "Consultoría", aliases: ["consultoria", "consultora"] },
    { id: "legal_contable", label: "Servicios legales y contables", aliases: ["despacho", "contabilidad", "auditoria"] },
    { id: "agencias_marketing", label: "Agencias de marketing y publicidad", aliases: ["agencia", "publicidad"] },
    { id: "talento_bpo", label: "Reclutamiento y outsourcing", aliases: ["headhunter", "reclutamiento", "bpo"] },
  ] },
  { id: "salud", label: "Salud", family: "salud", focus: false, industries: [
    { id: "hospitales", label: "Hospitales y clínicas", aliases: ["hospital", "clinica"] },
    { id: "laboratorios", label: "Laboratorios de diagnóstico", aliases: ["laboratorio clinico"] },
    { id: "telemedicina", label: "Telemedicina", aliases: ["healthtech"] },
  ] },
  { id: "educacion", label: "Educación", family: "servicios", focus: false, industries: [
    { id: "escuelas", label: "Escuelas y universidades", aliases: ["escuela", "universidad", "colegio"] },
    { id: "capacitacion", label: "Capacitación y educación en línea", aliases: ["edtech", "capacitacion"] },
  ] },
  { id: "alojamiento_turismo", label: "Alojamiento y turismo", family: "hospitalidad", focus: false, industries: [
    { id: "hoteleria", label: "Hotelería", aliases: ["hotel", "hoteles"] },
    { id: "agencias_viajes", label: "Agencias y operadores de viajes", aliases: ["viajes", "turismo"] },
  ] },
  { id: "esparcimiento", label: "Esparcimiento, deporte y bienestar", family: "servicios", focus: false, industries: [
    { id: "gimnasios", label: "Gimnasios y bienestar", aliases: ["gimnasio", "gym", "fitness"] },
    { id: "entretenimiento", label: "Entretenimiento en vivo y eventos", aliases: ["eventos", "conciertos"] },
  ] },
  { id: "ambiental", label: "Servicios ambientales y reciclaje", family: "servicios", focus: false, industries: [
    { id: "residuos", label: "Residuos y reciclaje", aliases: ["reciclaje", "residuos"] },
  ] },
];

const toIndustry = (s: SectorSeed, i: IndustrySeed): Industry => {
  const supported = i.pack && isCompany(i.pack) && i.metric ? (i.archetypes ?? []) : [];
  return {
    id: i.id, sectorId: s.id, label: i.label, family: s.family, aliases: i.aliases ?? [],
    contentPackId: i.pack, metricProfileId: i.metric, supportedArchetypes: supported,
    offeredArchetypes: supported.filter((a) => (OFFERED_TYPES as readonly string[]).includes(a) && (!i.offer || i.offer.includes(a))),
    availability: supported.length ? "available" : "coming_soon", focus: !!i.focus, specialties: i.specialties ?? [],
  };
};

export const SECTORS: Sector[] = SECTOR_DATA.map((s) => {
  const industries = s.industries.map((i) => toIndustry(s, i));
  return { id: s.id, label: s.label, family: s.family, focus: s.focus, industries, availability: industries.some((i) => i.availability === "available") ? "available" : "coming_soon" };
});

const SECTOR_BY_ID: Record<string, Sector> = Object.fromEntries(SECTORS.map((s) => [s.id, s]));
const INDUSTRY_BY_KEY: Record<string, Industry> = Object.fromEntries(SECTORS.flatMap((s) => s.industries.map((i) => [`${s.id}/${i.id}`, i])));

export const sectorById = (id: string | undefined | null): Sector | undefined => (id ? SECTOR_BY_ID[id] : undefined);
export const industryOf = (sectorId: string | undefined | null, industryId: string | undefined | null): Industry | undefined =>
  sectorId && industryId ? INDUSTRY_BY_KEY[`${sectorId}/${industryId}`] : undefined;

/** Industrias del segundo desplegable: solo las del sector elegido. Sin sector, lista vacía (campo deshabilitado). */
export const industriesOf = (sectorId: string | undefined | null): Industry[] => sectorById(sectorId)?.industries ?? [];

export const INDUSTRY_PLACEHOLDER = "Primero elige un sector";
export const availabilityLabel = (a: Availability): string | null => (a === "coming_soon" ? COMING_SOON_LABEL : null);

/** Al cambiar de sector se limpia la industria si ya no pertenece (nunca queda una pareja inválida). */
export function changeSector(sel: { sectorId?: string; industryId?: string }, sectorId: string | undefined): { sectorId?: string; industryId?: string } {
  if (!sectorById(sectorId)) return {};
  const keep = sel.industryId && industryOf(sectorId, sel.industryId) ? sel.industryId : undefined;
  return { sectorId, ...(keep && sectorId === sel.sectorId ? { industryId: keep } : {}) };
}

/** Pareja sector/industria/tipo con contenido real: única puerta para entrar a una simulación. */
export function isPlayableCombo(sectorId: string | undefined, industryId: string | undefined, archetype?: string): boolean {
  const ind = industryOf(sectorId, industryId);
  if (!ind || ind.availability !== "available") return false;
  return archetype === undefined ? true : isArchetype(archetype) && ind.supportedArchetypes.includes(archetype);
}

/** ¿Se ofrece hoy esta combinación al crear una empresa nueva? (Más estricto que isPlayableCombo.) */
export function isOfferedCombo(sectorId: string | undefined, industryId: string | undefined, archetype: string | undefined): boolean {
  const ind = industryOf(sectorId, industryId);
  return !!ind && ind.availability === "available" && isArchetype(archetype) && ind.offeredArchetypes.includes(archetype);
}

/** Estado de un tipo de empresa dentro de una industria (para la tarjeta del paso 3). */
export const archetypeAvailability = (sectorId: string | undefined, industryId: string | undefined, archetype: CompanyArchetype): Availability =>
  isPlayableCombo(sectorId, industryId, archetype) ? "available" : "coming_soon";

/** Normaliza para buscar: minúsculas, sin acentos, sin signos. */
export const norm = (t: string): string => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export interface Suggestion { sectorId: string; industryId: string; label: string; sectorLabel: string; availability: Availability; matched: string }

/**
 * Búsqueda por sinónimo o nombre (ES/EN). Devuelve sugerencias ordenadas: primero coincidencia exacta de alias,
 * luego jugables, luego foco. No modifica ninguna selección: la UI ofrece «Usar» y el usuario confirma.
 */
export function searchIndustries(q: string, limit = 6): Suggestion[] {
  const n = norm(q);
  if (n.length < 2) return [];
  const out: (Suggestion & { score: number })[] = [];
  for (const s of SECTORS) for (const i of s.industries) {
    const terms = [i.label, ...i.aliases];
    let best = 0; let matched = "";
    for (const t of terms) {
      const nt = norm(t);
      const sc = nt === n ? 4 : nt.startsWith(n) ? 3 : nt.split(" ").some((w) => w.startsWith(n)) ? 2 : nt.includes(n) ? 1 : 0;
      if (sc > best) { best = sc; matched = t; }
    }
    if (!best && norm(s.label).split(" ").some((w) => w.startsWith(n))) { best = 0.5; matched = s.label; }
    if (best) out.push({ sectorId: s.id, industryId: i.id, label: i.label, sectorLabel: s.label, availability: i.availability, matched, score: best + (i.availability === "available" ? 0.3 : 0) + (i.focus ? 0.1 : 0) });
  }
  return out.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "es")).slice(0, limit).map(({ score: _s, ...r }) => r);
}

/** Industrias del foco de lanzamiento (jugables o no) — guía para escribir contenido. */
export const focusIndustries = (): Industry[] => SECTORS.flatMap((s) => s.industries.filter((i) => i.focus));
