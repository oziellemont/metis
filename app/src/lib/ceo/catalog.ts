/**
 * mêtis CEO · catálogo editorial de industrias y empresas (adenda v3.2 §6).
 *
 * Reglas:
 *  - El estado de cada industria y empresa viene de aquí (`available` / `coming_soon` / `retired`), nunca del frontend.
 *  - Sin límites fijos: una industria puede tener 3, 4 o más empresas; el catálogo puede crecer.
 *  - Solo es jugable una empresa `available` cuyo paquete existe en `companies/` (ver catalog.test.ts).
 *  - Los ids (`companyVariantId`) nunca dependen del nombre: si un nombre cambia por marcas, el id se queda.
 *  - Nombres marcados `provisional`: tentativos, sin revisión de marcas (IMPI). No afirmar que existen ni que están libres.
 *
 * Datos puros, sin React. Versión: CATALOG_VERSION (súbela al cambiar estados o ids).
 */
import { isCompany } from "./companies";

export const CATALOG_VERSION = 3;

export type CatalogStatus = "available" | "coming_soon" | "retired";

/** Única etiqueta permitida para lo no jugable (excepción aprobada por Oziel, 28-oct-2026). Sin fechas. */
export const COMING_SOON_LABEL = "Próximamente";

export interface CatalogCompany {
  /** = companyVariantId. Estable. Para las fundacionales coincide con el id del paquete jugable. */
  id: string;
  industryId: string;
  name: string;
  /** Ramo concreto («Botanas y snacks»). */
  line: string;
  /** Dos líneas de identidad. */
  identity: string;
  /** Tensión inicial (distinta entre empresas de una misma industria). */
  tension: string;
  status: CatalogStatus;
  /** Variante fundacional ya jugada por usuarios (Cumbre, Forja, Brasa): sus partidas conservan reglas y versión. */
  foundational?: boolean;
  /** Nombre tentativo, pendiente de revisión de marcas antes de publicar como jugable. */
  provisional?: boolean;
}

export interface CatalogIndustry {
  id: string;
  name: string;
  /** Una frase humana sobre los retos que enfrentarás. */
  challenge: string;
  status: CatalogStatus;
  companies: CatalogCompany[];
}

type C = Omit<CatalogCompany, "industryId">;
const ind = (id: string, name: string, challenge: string, companies: C[]): CatalogIndustry => {
  const list = companies.map((c) => ({ ...c, industryId: id }));
  const status: CatalogStatus = list.some((c) => c.status === "available") ? "available" : list.some((c) => c.status === "coming_soon") ? "coming_soon" : "retired";
  return { id, name, challenge, status, companies: list };
};

export const INDUSTRY_CATALOG: CatalogIndustry[] = [
  ind("consumo", "Alimentos y consumo masivo", "Precios contra margen, cadenas que aprietan y una marca que tiene que seguir siendo querida.", [
    { id: "cumbre", name: "Botanas Cumbre", line: "Botanas y snacks", identity: "Empresa familiar de Monterrey, 70 años en el anaquel. El fundador preside el consejo y su hijo quiere su lugar.", tension: "La cadena más grande pide 6% de descuento y el margen ya no aguanta.", status: "available", foundational: true },
    { id: "sierraysal", name: "Sierra y Sal", line: "Salsas y condimentos", identity: "Marca regional que creció en mercados y hoy quiere llegar a todo el país. Socios jóvenes, poco orden.", tension: "Un inversionista ofrece capital a cambio de vender en tiendas de descuento.", status: "coming_soon", provisional: true },
    { id: "casademaiz", name: "Casa de Maíz", line: "Tortillas y harinas", identity: "Molino con cuatro generaciones y una red de tortillerías aliadas. Orgullo artesanal, costos industriales.", tension: "Sube el maíz y las tortillerías amenazan con irse con la competencia.", status: "coming_soon", provisional: true },
  ]),
  ind("manufactura", "Manufactura y autopartes", "Calidad, plazos de entrega y clientes globales que no perdonan una falla.", [
    { id: "forja", name: "Forja Norte", line: "Autopartes forjadas", identity: "Proveedor de primer nivel para armadoras. Planta exigente, sindicato con historia y un cliente que pesa demasiado.", tension: "La armadora principal exige bajar precio o se lleva el contrato.", status: "available", foundational: true },
    { id: "arriaga", name: "Componentes Arriaga", line: "Componentes eléctricos", identity: "Fábrica mediana que vive de pocos clientes grandes. Ingenieros brillantes, procesos de hace veinte años.", tension: "Una auditoría de calidad encuentra fallas justo antes de renovar contrato.", status: "coming_soon", provisional: true },
    { id: "delroble", name: "Autopartes del Roble", line: "Refacciones de repuesto", identity: "Vende al mercado de reposición en todo México. Distribuidores fieles y una red de crédito difícil de cobrar.", tension: "La cartera vencida crece y el banco revisa la línea de crédito.", status: "coming_soon", provisional: true },
  ]),
  ind("restaurantes", "Restaurantes y hospitalidad", "Rotación de personal, experiencia del cliente y márgenes que se van en cada plato.", [
    { id: "brasa", name: "Grupo Brasa", line: "Cadena de restaurantes", identity: "Asadores en varias ciudades, marca querida y una expansión que salió más cara de lo previsto.", tension: "Dos sucursales nuevas pierden dinero y el consejo quiere respuestas.", status: "available", foundational: true },
    { id: "barral", name: "Casa Barral", line: "Restaurantes de autor", identity: "Tres restaurantes con fama y un chef fundador que no delega. Reservas llenas, números en rojo.", tension: "El chef quiere abrir en otra ciudad; las finanzas dicen que no.", status: "coming_soon", provisional: true },
    { id: "mesadepiedra", name: "Mesa de Piedra", line: "Comida casual en franquicia", identity: "Franquicia joven con cuarenta locales. Crecimiento rápido, estándares que se diluyen.", tension: "Un franquiciatario grande amenaza con demandar por la nueva cuota.", status: "coming_soon", provisional: true },
  ]),
  ind("retail", "Comercio y tiendas", "Inventario, ubicación y competir por cada peso del cliente.", [
    { id: "alba", name: "Tiendas Alba", line: "Tiendas de conveniencia", identity: "Dos mil tiendas y una guerra por cada esquina. Franquiciatarios con voz propia.", tension: "Un franquiciatario influyente encabeza una protesta por las nuevas comisiones.", status: "coming_soon", provisional: true },
    { id: "saenz", name: "Almacenes Sáenz", line: "Tiendas departamentales", identity: "Tienda departamental tradicional que pierde clientes jóvenes frente al comercio en línea.", tension: "Cerrar las tiendas del centro o invertir en renovarlas.", status: "coming_soon", provisional: true },
    { id: "puntomadero", name: "Punto Madero", line: "Ferreterías y hogar", identity: "Sesenta ferreterías y tiendas para el hogar en el noreste, con familia y fondo en el consejo y clientes de toda la vida.", tension: "Mundo Casa abre a tres cuadras, el margen baja y un cliente de obra pesa el 18% de la venta.", status: "available", provisional: true },
  ]),
  ind("tecnologia", "Tecnología y software", "Crecer rápido sin quemar la caja ni al equipo.", [
    { id: "kubit", name: "Kúbit", line: "Software para empresas", identity: "Empresa de software con producto querido, 14 meses de caja y un fondo de inversión impaciente en el consejo.", tension: "Un cliente vale el 22% de los ingresos y pide descuento y desarrollos a la medida.", status: "available", provisional: true },
    { id: "farosistemas", name: "Faro Sistemas", line: "Servicios de tecnología", identity: "Consultora rentable que vive de proyectos. Buen talento, poca recurrencia.", tension: "Su mejor equipo recibe ofertas de una empresa extranjera.", status: "coming_soon", provisional: true },
    { id: "cauce", name: "Cauce Digital", line: "Pagos en línea", identity: "Plataforma de pagos para comercios pequeños. Crece rápido y opera en un sector regulado.", tension: "Un incidente de seguridad obliga a decidir qué y cuándo comunicar.", status: "coming_soon", provisional: true },
  ]),
  ind("salud", "Hospitales y servicios de salud", "Calidad médica, aseguradoras que presionan y decisiones con personas de por medio.", [
    { id: "sanrafael", name: "Hospital San Rafael", line: "Hospital privado", identity: "Hospital con prestigio y médicos que también son accionistas. La inflación médica no da tregua.", tension: "La aseguradora más grande exige tarifas más bajas o retira a sus pacientes.", status: "coming_soon", provisional: true },
    { id: "santaemilia", name: "Hospital Santa Emilia", line: "Hospital de especialidades", identity: "Hospital regional que quiere ser referencia en cardiología. Inversión fuerte, ocupación baja.", tension: "El equipo nuevo llegó, pero los especialistas no quieren mudarse.", status: "coming_soon", provisional: true },
    { id: "montalvo", name: "Clínicas Montalvo", line: "Red de clínicas", identity: "Clínicas de atención primaria a bajo costo. Mucho volumen, poco margen.", tension: "Una queja viral pone en duda la calidad de la atención.", status: "coming_soon", provisional: true },
  ]),
  ind("materiales", "Materiales y construcción", "Ciclos de demanda, costos de energía y obras que no esperan.", [
    { id: "roca", name: "Grupo Roca", line: "Cemento y concreto", identity: "Productor regional que depende de la autoconstrucción. Plantas grandes, demanda que cae.", tension: "La demanda baja justo cuando vence el crédito de la planta nueva.", status: "coming_soon", provisional: true },
    { id: "calizanorte", name: "Caliza Norte", line: "Cal y agregados", identity: "Empresa minera mediana con buena reserva y vecinos que ya no la quieren cerca.", tension: "La comunidad bloquea el acceso a la cantera.", status: "coming_soon", provisional: true },
    { id: "tamayo", name: "Materiales Tamayo", line: "Distribución de materiales", identity: "Distribuidor con patios en cinco ciudades. Crédito a constructores y márgenes delgados.", tension: "Un constructor grande quiebra y debe tres meses de material.", status: "coming_soon", provisional: true },
  ]),
  ind("agro", "Agroindustria y exportación", "Clima, fronteras y precios internacionales que cambian cada semana.", [
    { id: "verde", name: "Verde Michoacán", line: "Aguacate de exportación", identity: "Empacadora que exporta a Estados Unidos. Huertas aliadas y presiones que no salen en el balance.", tension: "Una inspección en frontera detiene embarques en plena temporada.", status: "coming_soon", provisional: true },
    { id: "solano", name: "Huertos Solano", line: "Berries", identity: "Productor joven que creció con un solo comprador extranjero. Mucha mano de obra temporal.", tension: "El comprador exige certificaciones laborales en seis semanas.", status: "coming_soon", provisional: true },
    { id: "delllano", name: "Campos del Llano", line: "Granos y forrajes", identity: "Agroindustria familiar del norte. Tierra propia, agua cada vez más escasa.", tension: "La sequía obliga a decidir qué cultivos sostener.", status: "coming_soon", provisional: true },
  ]),
];

const COMPANY_BY_ID: Record<string, CatalogCompany> = Object.fromEntries(INDUSTRY_CATALOG.flatMap((i) => i.companies).map((c) => [c.id, c]));
const INDUSTRY_BY_ID: Record<string, CatalogIndustry> = Object.fromEntries(INDUSTRY_CATALOG.map((i) => [i.id, i]));

export const industryById = (id: string | null | undefined): CatalogIndustry | null => INDUSTRY_BY_ID[id ?? ""] ?? null;
export const catalogCompanyById = (id: string | null | undefined): CatalogCompany | null => COMPANY_BY_ID[id ?? ""] ?? null;

/** Industrias que se muestran en el selector (las retiradas no aparecen). Disponibles primero. */
export function visibleIndustries(): CatalogIndustry[] {
  const rank: Record<CatalogStatus, number> = { available: 0, coming_soon: 1, retired: 2 };
  return INDUSTRY_CATALOG.filter((i) => i.status !== "retired").sort((a, b) => rank[a.status] - rank[b.status]);
}

/** Empresas visibles de una industria (sin retiradas). Disponibles primero. */
export function visibleCompanies(industryId: string): CatalogCompany[] {
  const i = industryById(industryId);
  if (!i) return [];
  return i.companies.filter((c) => c.status !== "retired").sort((a, b) => (a.status === b.status ? 0 : a.status === "available" ? -1 : 1));
}

/** ¿Se puede jugar? Debe estar disponible en el catálogo Y tener paquete construido. */
export function isPlayable(companyVariantId: string | null | undefined): boolean {
  const c = catalogCompanyById(companyVariantId);
  return Boolean(c && c.status === "available" && isCompany(c.id));
}

export type HomeCheck = { ok: true } | { ok: false; reason: "industria_desconocida" | "empresa_desconocida" | "no_pertenece" | "no_jugable" };

/** Valida el par industria–empresa de casa (lo usa el servidor antes de guardar el perfil). */
export function validateHome(industryId: string | null | undefined, companyVariantId: string | null | undefined): HomeCheck {
  const i = industryById(industryId);
  if (!i) return { ok: false, reason: "industria_desconocida" };
  const c = catalogCompanyById(companyVariantId);
  if (!c) return { ok: false, reason: "empresa_desconocida" };
  if (c.industryId !== i.id) return { ok: false, reason: "no_pertenece" };
  if (!isPlayable(c.id)) return { ok: false, reason: "no_jugable" };
  return { ok: true };
}

/** Etiqueta honesta de disponibilidad para la interfaz. */
export function statusLabel(s: CatalogStatus): string | null {
  return s === "coming_soon" ? COMING_SOON_LABEL : null;
}
