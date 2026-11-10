/**
 * World Events · Business Exposure Graph (mínimo versionado) por plantilla del Growth Engine.
 *
 * Cada empresa ficticia tiene sedes con coordenadas, a qué parte del motor corresponden (plazas de tiendas, cuadrillas,
 * planta), monedas de sus flujos, tipo de su deuda y comercio exterior. Sin exposición no hay caso: si una plantilla
 * no está aquí, ningún acontecimiento real la toca.
 *
 * Las coordenadas son de las ciudades donde opera la empresa ficticia (centro aproximado del área), no de una
 * dirección real. El radio cubre el área de operación.
 */
export const EXPOSURE_VERSION = 3;

export type SiteKind = "tiendas" | "cedis" | "planta" | "patio" | "bodega";
export interface Site {
  id: string;
  label: string;
  kind: SiteKind;
  /** Uno o más puntos (una red de tiendas en carretera tiene varios). */
  points: { lat: number; lon: number }[];
  radiusKm: number;
  /** Retail: plazas del motor en esta sede. */
  groups?: string[];
  /** Personal del motor que trabaja en esta sede. */
  crews?: string[];
  /** Acería · sede de distribución: parte de las entregas que sale de aquí (0 a 1) y valor del producto en existencia (pesos). */
  salesShare?: number;
  stockValue?: number;
}
export interface CurrencyFlow { what: string; currency: "MXN" | "USD"; share: number; hedged: number }
export interface DebtLine { ref: string; kind: "fija" | "variable"; currency: "MXN" | "USD"; index?: "TIIE" | "SOFR" }
export interface TradeLine { what: string; hs?: string; origin: string; destination: string; importerOfRecord: boolean }
/** Productos que la empresa vende, con su fracción arancelaria (4 dígitos) y mercado. */
export interface ProductLine { what: string; hs: string[]; market: "México" | "EE. UU." }
/** Quién paga el arancel según el término de entrega pactado (Incoterms 2020). */
export type Incoterm = "EXW" | "FCA" | "FOB" | "CIF" | "DAP" | "DDP";
/**
 * Línea del perfil de comercio exterior. `share` es la parte de las compras (importación) o de las ventas (exportación)
 * que pasa por esta línea. `importerOfRecord` dice si la empresa es quien despacha y paga el arancel en el destino.
 * Con DAP, FCA, FOB o CIF lo paga el comprador; con DDP lo paga el vendedor.
 */
export interface MarketLine { flow: "importacion" | "exportacion"; what: string; hs: string[]; origin: string; destination: string; share: number; incoterm: Incoterm; importerOfRecord: boolean; counterpart: string }
/**
 * Perfil de comercio exterior registrado por empresa: porcentajes de importación y exportación, países, categorías de
 * producto (fracciones de 4 dígitos) y quién paga el arancel. La exportación que nace de una decisión (un contrato con
 * un comprador extranjero) se suma con `exportContracts`: su porcentaje sale del motor, no de esta tabla.
 */
export interface TradeProfile {
  /** Parte de las compras que se importa (directa o a través de un distribuidor). */
  importShare: number;
  /** Parte de las ventas que se exporta en la plantilla inicial. */
  exportShare: number;
  categories: { what: string; hs: string[] }[];
  lines: MarketLine[];
  /** Contratos de exportación que puede abrir una decisión: cómo se reconocen y en qué términos se pactan. */
  exportContracts?: { clientTag: string; what: string; hs: string[]; destination: string; incoterm: Incoterm; importerOfRecord: boolean; counterpart: string };
}
export interface Exposure {
  v: number;
  engine: "retail" | "steel";
  sites: Site[];
  /** Flujos por moneda (compras y ventas). */
  buys: CurrencyFlow[];
  sells: CurrencyFlow[];
  debt: DebtLine[];
  trade: TradeLine[];
  /** Lo que vende (para medidas comerciales sobre productos que compiten con importaciones o que se exportan). */
  products?: ProductLine[];
  profile: TradeProfile;
}

const MTY = { lat: 25.6866, lon: -100.3161 };

export const EXPOSURE: Readonly<Record<string, Exposure>> = Object.freeze({
  conveniencia_regional_v2: {
    v: EXPOSURE_VERSION, engine: "retail",
    sites: [
      { id: "mty", label: "Tiendas de Monterrey metropolitano", kind: "tiendas", points: [MTY], radiusKm: 22, groups: ["mty", "nuevas"] },
      { id: "saltillo", label: "Tiendas de Saltillo y Ramos Arizpe", kind: "tiendas", points: [{ lat: 25.4383, lon: -100.9737 }], radiusKm: 14, groups: ["saltillo", "rezagadas"] },
      { id: "carretera", label: "Tiendas en carreteras y gasolineras del noreste", kind: "tiendas", points: [{ lat: 26.5052, lon: -100.1818 }, { lat: 25.5925, lon: -99.9930 }, { lat: 26.9080, lon: -101.4215 }, { lat: 25.4231, lon: -100.1567 }], radiusKm: 35, groups: ["carretera"] },
      { id: "cedis", label: "CEDIS de Apodaca y flotilla", kind: "cedis", points: [{ lat: 25.7818, lon: -100.1886 }], radiusKm: 4, crews: ["cedis", "flotilla"] },
    ],
    buys: [{ what: "Mercancía nacional (bebidas, cerveza, tabaco, abarrotes)", currency: "MXN", share: 1, hedged: 0 }],
    sells: [{ what: "Venta al público", currency: "MXN", share: 1, hedged: 0 }],
    debt: [{ ref: "plantilla", kind: "fija", currency: "MXN" }],
    trade: [],
    profile: {
      importShare: 0.06, exportShare: 0,
      categories: [{ what: "Bebidas, cerveza, tabaco, abarrotes y comida preparada (reventa)", hs: ["2202", "2203", "2402", "1905", "2106"] }],
      lines: [{ flow: "importacion", what: "Abarrotes y cuidado personal de origen importado", hs: ["1905", "3305", "3401"], origin: "Varios", destination: "México", share: 0.06, incoterm: "DDP", importerOfRecord: false, counterpart: "Distribuidores nacionales (ellos importan y pagan el arancel)" }],
    },
  },
  aceria_compacta_v2: {
    v: EXPOSURE_VERSION, engine: "steel",
    sites: [{ id: "planta", label: "Acería de Santa Catarina", kind: "planta", points: [{ lat: 25.6733, lon: -100.4583 }], radiusKm: 3 }],
    buys: [{ what: "Chatarra nacional", currency: "MXN", share: 0.85, hedged: 0 }, { what: "Refractarios y consumibles importados", currency: "USD", share: 0.04, hedged: 0 }],
    sells: [{ what: "Palanquilla a relaminadoras nacionales", currency: "MXN", share: 1, hedged: 0 }],
    debt: [],
    trade: [{ what: "Refractarios", hs: "6902", origin: "EE. UU.", destination: "México", importerOfRecord: false }],
    products: [{ what: "Palanquilla de acero", hs: ["7207"], market: "México" }],
    profile: {
      importShare: 0.04, exportShare: 0,
      categories: [{ what: "Palanquilla de acero", hs: ["7207"] }],
      lines: [{ flow: "importacion", what: "Refractarios y consumibles", hs: ["6902", "3801"], origin: "EE. UU.", destination: "México", share: 0.04, incoterm: "DDP", importerOfRecord: false, counterpart: "Distribuidor nacional (él importa y paga el arancel)" }],
      exportContracts: { clientTag: "(exportación)", what: "Palanquilla de acero", hs: ["7207"], destination: "EE. UU.", incoterm: "DAP", importerOfRecord: false, counterpart: "Comprador de Houston (importador de registro en EE. UU.)" },
    },
  },
  miniaceria_integrada_v2: {
    v: EXPOSURE_VERSION, engine: "steel",
    sites: [
      { id: "planta", label: "Acería y laminador de Santa Catarina", kind: "planta", points: [{ lat: 25.6733, lon: -100.4583 }], radiusKm: 3 },
      { id: "patio", label: "Patio de chatarra de Saltillo", kind: "patio", points: [{ lat: 25.4520, lon: -100.9480 }], radiusKm: 3, crews: ["patio"] },
      // Desde v3. Planta de corte y doblado con bodega que surte la varilla de obra del sureste (12 % de las entregas).
      { id: "campeche", label: "Planta de corte y doblado de Campeche (surte al sureste)", kind: "bodega", points: [{ lat: 19.8301, lon: -90.5349 }], radiusKm: 6, salesShare: 0.12, stockValue: 9_000_000 },
    ],
    buys: [{ what: "Chatarra nacional", currency: "MXN", share: 0.8, hedged: 0 }, { what: "Refractarios y consumibles importados", currency: "USD", share: 0.05, hedged: 0 }],
    sells: [{ what: "Varilla y palanquilla en el mercado nacional", currency: "MXN", share: 1, hedged: 0 }],
    debt: [{ ref: "plantilla", kind: "fija", currency: "MXN" }],
    trade: [{ what: "Refractarios", hs: "6902", origin: "EE. UU.", destination: "México", importerOfRecord: false }],
    products: [{ what: "Varilla corrugada", hs: ["7214", "7213"], market: "México" }, { what: "Palanquilla de acero", hs: ["7207"], market: "México" }],
    profile: {
      importShare: 0.05, exportShare: 0,
      categories: [{ what: "Varilla corrugada y alambrón", hs: ["7214", "7213"] }, { what: "Palanquilla de acero", hs: ["7207"] }],
      lines: [{ flow: "importacion", what: "Refractarios y consumibles", hs: ["6902", "3801"], origin: "EE. UU.", destination: "México", share: 0.05, incoterm: "DDP", importerOfRecord: false, counterpart: "Distribuidor nacional (él importa y paga el arancel)" }],
      exportContracts: { clientTag: "(exportación)", what: "Palanquilla de acero", hs: ["7207"], destination: "EE. UU.", incoterm: "DAP", importerOfRecord: false, counterpart: "Comprador de Houston (importador de registro en EE. UU.)" },
    },
  },
} satisfies Record<string, Exposure>);

export const exposureOf = (templateId: string | null | undefined): Exposure | null => (templateId && EXPOSURE[templateId]) || null;
export const siteOf = (templateId: string, siteId: string): Site | undefined => exposureOf(templateId)?.sites.find((s) => s.id === siteId);
/** Plantillas con exposición (las únicas que pueden recibir acontecimientos reales). */
export const exposedTemplates = (): string[] => Object.keys(EXPOSURE);
