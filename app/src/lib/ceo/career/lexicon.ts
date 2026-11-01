/**
 * mêtis CEO · vocabulario por especialidad (carrera continua).
 *
 * Los paquetes aprobados nacieron con una rama concreta: Cumbre hace botanas, Forja estampa y suelda, Brasa sirve
 * cortes con meseros. Cuando el jugador elige otra especialidad (Lácteos, Arneses eléctricos, Comida rápida…), los
 * textos tienen que decir exactamente eso: el producto, la máquina, el insumo, el oficio escaso, la materia prima.
 *
 *  - Cada especialidad trae una tabla de cambios de frase o palabra completa (respeta mayúsculas). Se aplica ANTES
 *    del cambio de nombre de la empresa (ver template.ts) y solo cuando el jugador tiene empresa propia.
 *  - La especialidad original del paquete (Botanas y snacks, Estampado y soldadura, Casual dining) no cambia nada.
 *  - Sin especialidad elegida, Alimentos usa un vocabulario genérico de alimentos (nunca «botanas»); Autopartes y
 *    Restaurantes se quedan con su versión original, que ya es general para la industria.
 *  - Ids, efectos, números y reglas no se tocan. Las palabras clave de los casos se cambian igual que el texto, así
 *    lo que el jugador lee y lo que pregunta coinciden.
 */

/** Industria (etiqueta del catálogo) de cada paquete. La prueba la compara con taxonomy.ts. */
export const PACK_INDUSTRY: Record<string, string> = { cumbre: "Alimentos y bebidas", forja: "Autopartes", brasa: "Restaurantes", kubit: "Software y SaaS" };
/** Especialidad con la que se escribió cada paquete: con ella no se cambia nada. */
export const PACK_ORIGINAL_SPECIALTY: Record<string, string> = { cumbre: "Botanas y snacks", forja: "Estampado y soldadura", brasa: "Casual dining", kubit: "SaaS B2B" };

export type LexRule = [from: string, to: string];

// ───────────────────────────────────────────── Alimentos y bebidas (paquete Cumbre)
interface FoodLex {
  /** Pitch: «Empresa familiar regiomontana de …». */
  giro: string;
  /** Forma corta: «Empresa familiar de …», «En …, la meta de la industria». */
  corto: string;
  /** Categoría en el anaquel de la cadena. */
  categoria: string;
  /** Empresa ficticia del caso real del día 1. */
  rival: string;
  /** Frase del fundador: «As\u00ed entré yo hace 38 años: …». */
  manos: string;
  /** «Las papas premium» → con artículo y género correctos. */
  las: string;
  /** «nuestras papas». */
  nuestras: string;
  /** Máquina de la línea 2 (masculino: «el …»). */
  maquina: string;
  /** Lo que quema a Toño. */
  caliente: string;
  /** Descripción de la línea premium de Diego. */
  premium: string;
  /** Insumo contaminado del caso del alérgeno (masculino). */
  insumoLargo: string;
  insumo: string;
  /** Producto retirado (nombre propio). */
  marca: string;
  /** Unidades del lote (plural). */
  empaque: string;
}

const FOOD: Record<string, FoodLex> = {
  "": {
    giro: "alimentos empacados", corto: "alimentos", categoria: "Abarrotes", rival: "Alimentos La Sierrita", manos: "con las manos en la masa",
    las: "Los productos", nuestras: "nuestros productos", maquina: "horno", caliente: "aceite caliente",
    premium: "una línea premium con ingredientes naturales, sin conservadores y empaque kraft",
    insumoLargo: "saborizante", insumo: "saborizante", marca: "Sabrositos", empaque: "paquetes",
  },
  "Panadería y galletas": {
    giro: "pan y galletas", corto: "panadería y galletas", categoria: "Galletas", rival: "Panificadora La Sierrita", manos: "con las manos en la masa",
    las: "Las galletas", nuestras: "nuestras galletas", maquina: "horno", caliente: "manteca caliente",
    premium: "galletas premium de avena con chocolate amargo, mantequilla real y empaque kraft",
    insumoLargo: "relleno de chocolate", insumo: "relleno", marca: "Doraditas", empaque: "paquetes",
  },
  "Lácteos": {
    giro: "lácteos: leche, yogur y quesos", corto: "lácteos", categoria: "Lácteos", rival: "Lácteos La Sierrita", manos: "con las manos en la leche",
    las: "Los yogures", nuestras: "nuestros yogures", maquina: "pasteurizador", caliente: "agua hirviendo",
    premium: "yogur griego premium con miel de la sierra, sin azúcar añadida y envase de vidrio",
    insumoLargo: "saborizante de fresa", insumo: "saborizante", marca: "Yogurín", empaque: "piezas",
  },
  "Bebidas no alcohólicas": {
    giro: "bebidas: jugos, aguas frescas y refrescos", corto: "bebidas", categoria: "Bebidas", rival: "Bebidas La Sierrita", manos: "con las manos en el jarabe",
    las: "Los jugos", nuestras: "nuestros jugos", maquina: "pasteurizador", caliente: "jarabe hirviendo",
    premium: "jugos premium prensados en frío, sin azúcar añadida y botella de vidrio",
    insumoLargo: "concentrado de frutas", insumo: "concentrado", marca: "Frutalia", empaque: "botellas",
  },
  "Salsas y condimentos": {
    giro: "salsas y condimentos", corto: "salsas", categoria: "Salsas y condimentos", rival: "Salsas La Sierrita", manos: "con las manos en el molcajete",
    las: "Las salsas", nuestras: "nuestras salsas", maquina: "cocedor", caliente: "salsa hirviendo",
    premium: "salsas premium de chile de árbol tatemado, sal de mar y frasco de vidrio",
    insumoLargo: "chile molido", insumo: "chile molido", marca: "Salsa Brava", empaque: "frascos",
  },
  "Alimentos congelados": {
    giro: "alimentos congelados: comidas listas y empanizados", corto: "congelados", categoria: "Congelados", rival: "Congelados La Sierrita", manos: "con las manos en la masa",
    las: "Los platillos", nuestras: "nuestros platillos", maquina: "freidor", caliente: "aceite caliente",
    premium: "platillos congelados premium de receta casera, sin conservadores y empaque kraft",
    insumoLargo: "empanizador", insumo: "empanizador", marca: "Taquitos Listos", empaque: "cajas",
  },
  "Café": {
    giro: "café tostado y molido", corto: "café", categoria: "Café", rival: "Café La Sierrita", manos: "con las manos en el costal de café",
    las: "Los cafés", nuestras: "nuestros cafés", maquina: "tostador", caliente: "agua hirviendo",
    premium: "café premium de origen Chiapas, tueste medio y bolsa con válvula",
    insumoLargo: "saborizante de vainilla", insumo: "saborizante", marca: "Tueste Norte", empaque: "bolsas",
  },
};

const foodRules = (x: FoodLex): LexRule[] => [
  ["Empresa familiar regiomontana de botanas y cacahuates", `Empresa familiar regiomontana de ${x.giro}`],
  ["Empresa familiar de botanas", `Empresa familiar de ${x.corto}`],
  ["En botanas, la meta", `En ${x.corto}, la meta`],
  ["Botanas La Sierrita", x.rival],
  ["una botanera familiar", `una empresa familiar de ${x.corto}`],
  ["con las manos en el cacahuate", x.manos],
  ["Compradora de categoría Botanas", `Compradora de categoría ${x.categoria}`],
  ["papas premium con chile de árbol, sal de mar y empaque kraft", x.premium],
  ["Las papas premium", `${x.las} premium`],
  ["nuestras papas rotan mejor que las de ellos", `${x.nuestras} rotan mejor que ${x.las.startsWith("Los") ? "los" : "las"} de ellos`],
  ["nuestras papas", x.nuestras],
  ["una charola caliente", "una pieza caliente del equipo"],
  ["El tostador", `El ${x.maquina}`],
  ["el tostador", `el ${x.maquina}`],
  ["aceite caliente", x.caliente],
  ["sazonador de chile", x.insumoLargo],
  ["sazonador", x.insumo],
  ["Picositas", x.marca],
  ["bolsas", x.empaque],
];

// ───────────────────────────────────────────── Autopartes (paquete Forja)
interface PartsLex {
  piezas: string;
  /** Oficio escaso: plural, singular y nombre del oficio («escuela de …»). */
  oficioPl: string; oficio: string; arte: string;
  /** Herramienta que se gasta (masculino). */
  herr: string; Herr: string; afilado: string;
  /** Defecto (femenino). */
  defecto: string; Defecto: string;
  enPieza: string; piezasPl: string;
  /** Materia prima del contrato. */
  mat: string; bajaMat: string; filaMat: string;
  equipos: string; equipoGrande: string; equipoNuevo: string;
}
const PARTS: Record<string, PartsLex> = {
  "Inyección de plástico automotriz": {
    piezas: "piezas de plástico inyectado (tableros, rejillas y fascias)",
    oficioPl: "técnicos de moldeo", oficio: "técnico de moldeo", arte: "moldeo",
    herr: "molde", Herr: "Molde", afilado: "recién pulido",
    defecto: "rebaba", Defecto: "La rebaba", enPieza: "en la rejilla frontal", piezasPl: "rejillas",
    mat: "resina", bajaMat: "la baja de la resina", filaMat: "Resina que nosotros compramos (proveedor local)",
    equipos: "inyectoras y moldes", equipoGrande: "inyectora de 1,200 toneladas", equipoNuevo: "una inyectora nueva",
  },
  "Arneses eléctricos": {
    piezas: "arneses eléctricos",
    oficioPl: "técnicos de ensamble", oficio: "técnico de ensamble", arte: "ensamble",
    herr: "aplicador", Herr: "Aplicador", afilado: "recién calibrado",
    defecto: "falla de engarce", Defecto: "La falla de engarce", enPieza: "en el arnés del tablero", piezasPl: "arneses",
    mat: "cobre", bajaMat: "la baja del cobre", filaMat: "Cobre que nosotros compramos (cable local)",
    equipos: "máquinas de corte y engarce", equipoGrande: "línea automatizada de corte y engarce", equipoNuevo: "una línea nueva",
  },
  "Frenos y suspensión": {
    piezas: "componentes de frenos y suspensión",
    oficioPl: "maquinistas CNC", oficio: "maquinista CNC", arte: "maquinado CNC",
    herr: "herramental", Herr: "Herramental", afilado: "recién afilado",
    defecto: "rebaba", Defecto: "La rebaba", enPieza: "en el soporte de suspensión", piezasPl: "soportes",
    mat: "acero", bajaMat: "la baja del acero", filaMat: "Acero que nosotros compramos (barra local)",
    equipos: "centros de maquinado y herramental", equipoGrande: "línea de maquinado automatizada", equipoNuevo: "una línea nueva",
  },
  "Interiores": {
    piezas: "interiores automotrices (asientos, paneles de puerta y consolas)",
    oficioPl: "costureros industriales", oficio: "costurero industrial", arte: "costura industrial",
    herr: "molde", Herr: "Molde", afilado: "recién ajustado",
    defecto: "costura chueca", Defecto: "La costura chueca", enPieza: "en el panel de puerta", piezasPl: "paneles",
    mat: "resina", bajaMat: "la baja de la resina", filaMat: "Resina y tela que nosotros compramos (proveedor local)",
    equipos: "máquinas de costura y moldeo", equipoGrande: "línea de moldeo de espuma", equipoNuevo: "una línea nueva",
  },
};
const partsRules = (x: PartsLex): LexRule[] => [
  ["piezas estampadas y soldadas", x.piezas],
  ["soldadores", x.oficioPl],
  ["soldador", x.oficio],
  ["soldadura", x.arte],
  ["recién afilado", x.afilado],
  ["Troquel", x.Herr],
  ["troquel", x.herr],
  ["La rebaba", x.Defecto],
  ["rebaba", x.defecto],
  ["en el soporte de suspensión", x.enPieza],
  ["soportes", x.piezasPl],
  ["Acero que nosotros compramos (lámina local)", x.filaMat],
  ["la baja del acero", x.bajaMat],
  ["índice de acero", `índice de ${x.mat}`],
  ["cláusula de acero", `cláusula de ${x.mat}`],
  ["prensas y herramental", x.equipos],
  ["prensa de 1,200 toneladas", x.equipoGrande],
  ["una prensa nueva", x.equipoNuevo],
];

// ───────────────────────────────────────────── Restaurantes (paquete Brasa)
const PITCH_BRASA = "Cadena de restaurantes de cortes y cocina mexicana a la brasa";
const COST_BRASA = "En restaurantes de cortes ronda";
const waiters = (sg: string, pl: string): LexRule[] => [["meseros", pl], ["mesero", sg], ["Meseros", pl[0].toUpperCase() + pl.slice(1)]];
const RESTAURANT: Record<string, LexRule[]> = {
  "Restaurante de especialidad": [
    [PITCH_BRASA, "Cadena de restaurantes de especialidad: cortes finos y cocina mexicana de autor"],
    [COST_BRASA, "En restaurantes de especialidad ronda"],
  ],
  "Comida rápida": [
    [PITCH_BRASA, "Cadena de comida rápida de hamburguesas y tacos al carbón"],
    [COST_BRASA, "En comida rápida ronda"],
    ...waiters("cajero", "cajeros"),
    ["el arrachera", "la hamburguesa"],
    ["hacer arrachera", "hacer hamburguesas"],
    ["arrachera", "hamburguesa"],
  ],
  "Cocinas ocultas": [
    [PITCH_BRASA, "Cadena de cocinas ocultas y mostradores de cortes y cocina mexicana para entrega"],
    [COST_BRASA, "En cocinas ocultas ronda"],
    ...waiters("repartidor", "repartidores"),
  ],
};

// ───────────────────────────────────────────── Software y SaaS (paquete Kúbit)
const saas = (giro: string, plataforma: string): LexRule[] => [
  ["software de cobranza para empresas medianas", giro],
  ["plataforma de cobranza", plataforma],
];
const SOFTWARE: Record<string, LexRule[]> = {
  "Software vertical": saas("software de gestión hecho a la medida de una sola industria (constructoras medianas)", "plataforma de gestión para constructoras"),
  "Software industrial": saas("software de mantenimiento y producción para plantas medianas", "plataforma de mantenimiento y producción"),
  "HRTech": saas("software de nómina y recursos humanos para empresas medianas", "plataforma de nómina y recursos humanos"),
  "MarTech": saas("software de marketing y ventas digitales para empresas medianas", "plataforma de marketing y ventas"),
};

/** Especialidades que este módulo sabe escribir, por paquete (además de la original). */
export function lexSpecialties(packId: string): string[] {
  if (packId === "cumbre") return Object.keys(FOOD).filter(Boolean);
  if (packId === "forja") return Object.keys(PARTS);
  if (packId === "brasa") return Object.keys(RESTAURANT);
  if (packId === "kubit") return Object.keys(SOFTWARE);
  return [];
}

/** Especialidad válida para el paquete (o undefined). */
export function cleanSpecialty(packId: string, specialty: unknown): string | undefined {
  if (typeof specialty !== "string") return undefined;
  return specialty === PACK_ORIGINAL_SPECIALTY[packId] || lexSpecialties(packId).includes(specialty) ? specialty : undefined;
}

const L = "\\p{L}\\p{N}";
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COMPILED = new Map<string, [RegExp, string][]>();

/** Tabla de cambios de una empresa con esta especialidad (vacía si el paquete ya habla de ella). */
export function lexRules(packId: string, specialty: string | undefined): [RegExp, string][] {
  const sp = cleanSpecialty(packId, specialty);
  const key = `${packId}|${sp ?? ""}`;
  const hit = COMPILED.get(key);
  if (hit) return hit;
  let raw: LexRule[] = [];
  if (sp !== PACK_ORIGINAL_SPECIALTY[packId]) {
    if (packId === "cumbre") raw = foodRules(FOOD[sp ?? ""]);
    else if (packId === "forja" && sp) raw = partsRules(PARTS[sp]);
    else if (packId === "brasa" && sp) raw = RESTAURANT[sp];
    else if (packId === "kubit" && sp) raw = SOFTWARE[sp];
  }
  const out = raw.map(([f, t]) => [new RegExp(`(?<![${L}])${esc(f)}(?![${L}])`, "gu"), t] as [RegExp, string]);
  COMPILED.set(key, out);
  return out;
}

/** Aplica el vocabulario de la especialidad a un texto. */
export function lexText(text: string, packId: string, specialty: string | undefined): string {
  let t = text;
  for (const [re, to] of lexRules(packId, specialty)) t = t.replace(re, () => to);
  return t;
}

/** Etiqueta de industria que ve el jugador: la especialidad si la eligió; si no, la industria. */
export function industryLabelFor(packId: string, specialty: string | undefined): string | undefined {
  const ind = PACK_INDUSTRY[packId];
  if (!ind) return undefined;
  return cleanSpecialty(packId, specialty) ?? ind;
}
/** Etiqueta larga para los casos: «Alimentos y bebidas · Lácteos». */
export function industryLongFor(packId: string, specialty: string | undefined): string | undefined {
  const ind = PACK_INDUSTRY[packId];
  if (!ind) return undefined;
  const sp = cleanSpecialty(packId, specialty);
  return sp ? `${ind} · ${sp}` : ind;
}
