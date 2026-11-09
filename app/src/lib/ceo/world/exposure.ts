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
export const EXPOSURE_VERSION = 2;

export type SiteKind = "tiendas" | "cedis" | "planta" | "patio";
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
}
export interface CurrencyFlow { what: string; currency: "MXN" | "USD"; share: number; hedged: number }
export interface DebtLine { ref: string; kind: "fija" | "variable"; currency: "MXN" | "USD"; index?: "TIIE" | "SOFR" }
export interface TradeLine { what: string; hs?: string; origin: string; destination: string; importerOfRecord: boolean }
/** Productos que la empresa vende, con su fracción arancelaria (4 dígitos) y mercado. */
export interface ProductLine { what: string; hs: string[]; market: "México" | "EE. UU." }
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
  },
  aceria_compacta_v2: {
    v: EXPOSURE_VERSION, engine: "steel",
    sites: [{ id: "planta", label: "Acería de Santa Catarina", kind: "planta", points: [{ lat: 25.6733, lon: -100.4583 }], radiusKm: 3 }],
    buys: [{ what: "Chatarra nacional", currency: "MXN", share: 0.85, hedged: 0 }, { what: "Refractarios y consumibles importados", currency: "USD", share: 0.04, hedged: 0 }],
    sells: [{ what: "Palanquilla a relaminadoras nacionales", currency: "MXN", share: 1, hedged: 0 }],
    debt: [],
    trade: [{ what: "Refractarios", hs: "6902", origin: "EE. UU.", destination: "México", importerOfRecord: false }],
    products: [{ what: "Palanquilla de acero", hs: ["7207"], market: "México" }],
  },
  miniaceria_integrada_v2: {
    v: EXPOSURE_VERSION, engine: "steel",
    sites: [
      { id: "planta", label: "Acería y laminador de Santa Catarina", kind: "planta", points: [{ lat: 25.6733, lon: -100.4583 }], radiusKm: 3 },
      { id: "patio", label: "Patio de chatarra de Saltillo", kind: "patio", points: [{ lat: 25.4520, lon: -100.9480 }], radiusKm: 3, crews: ["patio"] },
    ],
    buys: [{ what: "Chatarra nacional", currency: "MXN", share: 0.8, hedged: 0 }, { what: "Refractarios y consumibles importados", currency: "USD", share: 0.05, hedged: 0 }],
    sells: [{ what: "Varilla y palanquilla en el mercado nacional", currency: "MXN", share: 1, hedged: 0 }],
    debt: [{ ref: "plantilla", kind: "fija", currency: "MXN" }],
    trade: [{ what: "Refractarios", hs: "6902", origin: "EE. UU.", destination: "México", importerOfRecord: false }],
    products: [{ what: "Varilla corrugada", hs: ["7214", "7213"], market: "México" }, { what: "Palanquilla de acero", hs: ["7207"], market: "México" }],
  },
} satisfies Record<string, Exposure>);

export const exposureOf = (templateId: string | null | undefined): Exposure | null => (templateId && EXPOSURE[templateId]) || null;
export const siteOf = (templateId: string, siteId: string): Site | undefined => exposureOf(templateId)?.sites.find((s) => s.id === siteId);
/** Plantillas con exposición (las únicas que pueden recibir acontecimientos reales). */
export const exposedTemplates = (): string[] => Object.keys(EXPOSURE);
