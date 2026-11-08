/**
 * mêtis CEO · Growth Engine · modelos de negocio por línea (motor multimodelo).
 *
 * El motor es uno solo; lo que cambia entre un restaurante, un taller de estampado o una acería es su PERFIL:
 *  - cómo se vende (`mode`): al mostrador (llega la gente: demanda diaria por sede) o por contrato (clientes con
 *    volumen diario comprometido, atrasos y penalizaciones);
 *  - qué limita la capacidad (activo por turno: prensas, hornos…; y la gente que lo opera);
 *  - la semana de trabajo, las palabras (sucursal o planta, pedidos, piezas o toneladas), los puestos que resuelven
 *    cada cuello de botella, el equipo y la inversión para abrir otra sede, y las zonas donde tiene sentido crecer.
 * Las cifras de las líneas existentes son idénticas a las de antes (restaurante y estampado): no cambia ninguna partida.
 * Una línea nueva se agrega aquí, en families.ts (parámetros y plantillas) y en catalog.ts (sus puestos).
 */
import { FAMILIES } from "./families";
import type { Family, FamilyParams } from "./types";

export type LineId = "restaurante" | "estampado" | "aceria";
export type SaleMode = "mostrador" | "contratos";

export interface ZoneOffer { zone: string; why: string; rent: number; utilities: number; capex: number; demandBase: number; client?: { client: string; unitsPerDay: number; price: number } }

export interface LineProfile {
  id: LineId;
  family: Family;
  /** Nombre del giro para la pantalla. */
  label: string;
  mode: SaleMode;
  /** Siete días con demanda que varía por día (restaurante) o de lunes a sábado (planta). */
  week: "siete" | "lunes_sabado";
  site: { one: string; One: string; many: string; Many: string };
  unit: { one: string; many: string; Many: string };
  labels: { cogs: string; served: string; lost: string; lostCompare: string; committed: string };
  /** Activo que limita la capacidad por turno (prensa, horno). Sin él, el sitio vende al mostrador (mesas). */
  asset?: { resource: string; one: string; many: string };
  /** Puestos que, si faltan en un sitio, bajan la capacidad o suben el desperdicio. */
  maintenanceRole?: string;
  qualityRole?: string;
  /** Qué falta cuando un sitio nuevo no puede abrir. */
  missingStaff: string;
  /** Puesto que resuelve el cuello de botella de cada recurso (los activos no se resuelven contratando). */
  roleFor: Readonly<Record<string, { roleId: string; n: number }>>;
  /** Recurso → puesto que lo aporta, para encontrar la gente de más; y desde cuántas personas sobra una. */
  slackRole: Readonly<Record<string, string>>;
  slackMin: Readonly<Record<string, number>>;
  /** Cómo se nombra el límite en los casos («la gente en línea», «cocina»). */
  limitText: (resource: string) => string;
  bottleneck: Readonly<Record<string, string>>;
  /** Expansión: zonas posibles (en orden de atractivo), equipo de arranque y la sede tipo. */
  zones: readonly ZoneOffer[];
  team: readonly string[];
  openSite: { years: number; buildDays: number; assets: Record<string, number>; maturityDays: number; preopening: number };
}

const BOTTLENECK_COMMON = { demanda: "La demanda", supervision: "Supervisión", mantenimiento: "Mantenimiento", calidad: "Calidad", operacion: "Operadores" };

export const REST_ZONES: readonly ZoneOffer[] = Object.freeze([
  { zone: "cumbres", why: "Zona residencial que crece: escuelas y plazas nuevas, poca parrilla cerca.", rent: 52000, utilities: 22000, capex: 260000, demandBase: 95 },
  { zone: "san_nicolas", why: "Zona universitaria y familiar con mucho tráfico entre semana.", rent: 42000, utilities: 22000, capex: 240000, demandBase: 95 },
  { zone: "san_pedro", why: "El ticket y el tráfico más altos de la ciudad, con la renta más cara.", rent: 75000, utilities: 26000, capex: 320000, demandBase: 115 },
  { zone: "santa_catarina", why: "Zona industrial en crecimiento: comidas de negocio entre semana.", rent: 38000, utilities: 21000, capex: 230000, demandBase: 80 },
  { zone: "guadalupe", why: "Renta baja y oficinas cerca; los fines de semana vende menos.", rent: 40000, utilities: 22000, capex: 230000, demandBase: 80 },
  { zone: "escobedo", why: "La renta más baja; la demanda todavía se está formando.", rent: 35000, utilities: 20000, capex: 220000, demandBase: 72 },
]);
export const PLANT_ZONES: readonly ZoneOffer[] = Object.freeze([
  { zone: "saltillo", why: "Junto al clúster de armadoras de Ramos Arizpe: un cliente pide surtido local.", rent: 65000, utilities: 80000, capex: 1900000, demandBase: 0, client: { client: "Carrocerías del Desierto", unitsPerDay: 3000, price: 9.8 } },
  { zone: "escobedo", why: "Sobre la salida a Laredo: un cliente de arneses quiere entregas diarias.", rent: 70000, utilities: 80000, capex: 1900000, demandBase: 0, client: { client: "Arneses del Norte", unitsPerDay: 2600, price: 9.9 } },
  { zone: "santa_catarina", why: "Parque industrial con mano de obra disponible y un cliente de suspensiones.", rent: 75000, utilities: 85000, capex: 1900000, demandBase: 0, client: { client: "Suspensiones Huasteca", unitsPerDay: 3000, price: 9.7 } },
]);
/** Acería: la inversión es un horno de inducción con su colada continua, subestación eléctrica y nave. */
export const STEEL_ZONES: readonly ZoneOffer[] = Object.freeze([
  { zone: "escobedo", why: "Junto a los centros de acopio de chatarra del norte: material más barato y un distribuidor de acero que pide surtido.", rent: 95000, utilities: 140000, capex: 7800000, demandBase: 0, client: { client: "Distribuidora de Aceros del Norte", unitsPerDay: 5, price: 17600 } },
  { zone: "saltillo", why: "Cerca de las armadoras y de un fabricante de estructuras que quiere un proveedor local.", rent: 85000, utilities: 135000, capex: 7800000, demandBase: 0, client: { client: "Estructuras del Desierto", unitsPerDay: 5, price: 17900 } },
  { zone: "apodaca", why: "Parque industrial con subestación disponible y un cliente de forja.", rent: 105000, utilities: 150000, capex: 7800000, demandBase: 0, client: { client: "Forjas de Apodaca", unitsPerDay: 4, price: 18300 } },
]);

export const LINES: Readonly<Record<LineId, LineProfile>> = Object.freeze({
  restaurante: {
    id: "restaurante", family: "restaurante", label: "Restaurante", mode: "mostrador", week: "siete",
    site: { one: "sucursal", One: "Sucursal", many: "sucursales", Many: "Sucursales" },
    unit: { one: "pedido", many: "pedidos", Many: "Pedidos" },
    labels: { cogs: "Insumos", served: "Pedidos atendidos", lost: "Pedidos perdidos", lostCompare: "Pedidos no atendidos", committed: "Pedidos al día" },
    missingStaff: "cocina o servicio",
    roleFor: { cocina: { roleId: "cocinero", n: 1 }, servicio: { roleId: "mesero", n: 1 }, loza: { roleId: "lavaloza", n: 1 } },
    slackRole: { cocina: "cocinero", servicio: "mesero" },
    slackMin: { cocinero: 2, mesero: 2 },
    limitText: (r) => r,
    bottleneck: { ...BOTTLENECK_COMMON, cocina: "Cocina", servicio: "Servicio en sala", loza: "Lavado de loza", mesas: "Mesas" },
    zones: REST_ZONES,
    team: ["gerente_sucursal", "cocinero", "cocinero", "ayudante_cocina", "mesero", "mesero", "lavaloza"],
    openSite: { years: 8, buildDays: 45, assets: { mesas: 14 }, maturityDays: 150, preopening: 55000 },
  },
  estampado: {
    id: "estampado", family: "manufactura", label: "Estampado automotriz", mode: "contratos", week: "lunes_sabado",
    site: { one: "planta", One: "Planta", many: "plantas", Many: "Plantas" },
    unit: { one: "pieza", many: "piezas", Many: "Piezas" },
    labels: { cogs: "Material", served: "Piezas entregadas", lost: "Piezas no entregadas", lostCompare: "Piezas no entregadas", committed: "Piezas al día comprometidas por contrato" },
    asset: { resource: "prensa", one: "prensa", many: "prensas" },
    maintenanceRole: "tecnico_mantenimiento", qualityRole: "inspector_calidad",
    missingStaff: "supervisor u operadores",
    roleFor: { operacion: { roleId: "operador", n: 2 } },
    slackRole: { operacion: "operador" },
    slackMin: { operador: 3 },
    limitText: (r) => (r === "operacion" ? "la gente en línea" : r),
    bottleneck: { ...BOTTLENECK_COMMON, prensa: "Prensas" },
    zones: PLANT_ZONES,
    team: ["supervisor_produccion", "operador", "operador", "operador", "operador", "operador", "tecnico_mantenimiento", "inspector_calidad"],
    openSite: { years: 10, buildDays: 60, assets: { prensa: 2 }, maturityDays: 0, preopening: 120000 },
  },
  aceria: {
    id: "aceria", family: "manufactura", label: "Acería", mode: "contratos", week: "lunes_sabado",
    site: { one: "planta", One: "Planta", many: "plantas", Many: "Plantas" },
    unit: { one: "tonelada", many: "toneladas", Many: "Toneladas" },
    labels: { cogs: "Chatarra y aleaciones", served: "Toneladas entregadas", lost: "Toneladas no entregadas", lostCompare: "Toneladas no entregadas", committed: "Toneladas al día comprometidas por contrato" },
    asset: { resource: "horno", one: "horno", many: "hornos" },
    maintenanceRole: "tecnico_mantenimiento", qualityRole: "metalurgista",
    missingStaff: "supervisor u operadores de horno",
    roleFor: { operacion: { roleId: "operador_aceria", n: 2 } },
    slackRole: { operacion: "operador_aceria" },
    slackMin: { operador_aceria: 3 },
    limitText: (r) => (r === "operacion" ? "la gente en piso de colada" : r === "horno" ? "el tiempo de horno" : r),
    bottleneck: { ...BOTTLENECK_COMMON, operacion: "Operadores de horno", horno: "Hornos" },
    zones: STEEL_ZONES,
    team: ["supervisor_produccion", "operador_aceria", "operador_aceria", "operador_aceria", "operador_aceria", "operador_aceria", "tecnico_mantenimiento", "metalurgista"],
    openSite: { years: 15, buildDays: 90, assets: { horno: 1 }, maturityDays: 0, preopening: 260000 },
  },
});

/** Línea por omisión de cada familia (partidas guardadas antes del motor multimodelo). */
export const DEFAULT_LINE: Readonly<Record<Family, LineId>> = Object.freeze({ restaurante: "restaurante", manufactura: "estampado" });

export const isLine = (v: unknown): v is LineId => typeof v === "string" && v in LINES;
/** Línea de un estado o de una plantilla. */
export const lineIdOf = (x: { family: Family; line?: string }): LineId => (isLine(x.line) ? x.line : DEFAULT_LINE[x.family]);
export const profileOf = (x: { family: Family; line?: string }): LineProfile => LINES[lineIdOf(x)];
/** Parámetros económicos de la línea (precio, material, variables, cobranza, desperdicio, capacidad por turno). */
export const paramsOf = (x: { family: Family; line?: string }): FamilyParams => FAMILIES[lineIdOf(x)] ?? FAMILIES[x.family];
