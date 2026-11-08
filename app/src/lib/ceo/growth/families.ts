/**
 * mêtis CEO · Growth Engine · parámetros por familia y empresas emergentes de arranque (v1).
 * Montos en pesos (se convierten a centavos al instanciar). Todos los nombres son ficticios.
 * Las cifras de operación son supuestos de simulación calibrados para que la empresa de llegada sea viable y
 * tenga un cuello de botella visible; no son datos de mercado.
 */
import type { FamilyParams, FixedLine } from "./types";

export const FAMILIES: Readonly<Record<string, FamilyParams>> = Object.freeze({
  restaurante: {
    family: "restaurante",
    resources: ["cocina", "servicio", "loza", "mesas"],
    unit: { one: "pedido", many: "pedidos" },
    // Ticket promedio por pedido con IVA (menú publicado). La venta neta es 260 / 1.16 ≈ $224.
    price: 260,
    vatInPrice: 0.16,
    // Insumos de cocina sobre la venta neta (food cost típico de parrilla casual 30–34 %).
    cogsPct: 0.32,
    variableLines: [
      { id: "merma", label: "Merma y producto descartado", pctOfSales: 0.015, basis: "Supuesto: 1.5 % de la venta (porciones fuera de estándar, caducidad)." },
      { id: "terminal", label: "Comisión de terminal bancaria", pctOfSales: 0.0158, basis: "Supuesto: 70 % de la venta con tarjeta × 2.25 % de comisión con IVA." },
      { id: "reparto", label: "Comisión de plataformas de reparto", pctOfSales: 0.0264, basis: "Supuesto: 12 % de los pedidos por plataforma × 22 % de comisión." },
      { id: "gas", label: "Gas LP de cocina", perUnit: 7.5, basis: "Supuesto: $7.50 por pedido (parrilla y freidoras)." },
      { id: "desechables", label: "Empaques y desechables", perUnit: 3, basis: "Supuesto: $3 por pedido promedio (empaque de reparto y servilletas)." },
      { id: "limpieza", label: "Limpieza y reposición menor", pctOfSales: 0.008, basis: "Supuesto: 0.8 % de la venta (químicos, utensilios, loza rota)." },
    ],
    // Se abre 7 días y cada persona operativa descansa uno (1/6 de su jornada pagada) más vacaciones (~4 %):
    // esas jornadas se cubren con eventuales o tiempo extra.
    restCoverage: 0.2,
    dso: 0,
    supplierDays: 15,
    leadRole: "gerente_sucursal",
    baseSpan: 10,
    backlogDays: 0,
  },
  manufactura: {
    family: "manufactura",
    resources: ["prensa", "operacion"],
    unit: { one: "pieza", many: "piezas" },
    price: 10,
    materialPerUnit: 4.2,
    variableLines: [
      { id: "energia", label: "Energía de prensas", perUnit: 0.22, basis: "Supuesto: $0.22 por pieza buena (tarifa industrial GDMTH promedio)." },
      { id: "herramental", label: "Afilado y consumibles de troquel", perUnit: 0.12, basis: "Supuesto: $0.12 por pieza." },
      { id: "fletes", label: "Fletes a clientes", pctOfSales: 0.015, basis: "Supuesto: 1.5 % de la venta (entregas locales en el área metropolitana)." },
    ],
    // Se trabaja de lunes a sábado: solo se cubren vacaciones e incapacidades.
    restCoverage: 0.03,
    dso: 45,
    supplierDays: 30,
    scrap: 0.03,
    leadRole: "supervisor_produccion",
    shiftRole: "supervisor_produccion",
    baseSpan: 10,
    perShift: { prensa: 1800 },
    backlogDays: 5,
  },
});

/** Rotaciones de mesa por día (comida y cena). */
export const TABLE_TURNS = 8;
/** Demanda por día de la semana (lunes…domingo); promedio 1. */
export const WEEKDAY: readonly number[] = [0.8, 0.85, 0.9, 1.0, 1.15, 1.3, 1.0];
/** Manufactura trabaja de lunes a sábado. */
export const WORKDAY: readonly boolean[] = [true, true, true, true, true, true, false];

/**
 * Gastos fijos explícitos de cada empresa (pesos al mes). Reemplazan al antiguo «companyFixed» de una sola cifra:
 * el margen sale de sumar líneas defendibles, no de ajustar un porcentaje final.
 * La dirección general es tu sueldo como director designado (bruto + carga); el dueño no cobra sueldo en operación.
 */
const BRASA_FIXED: FixedLine[] = [
  { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 42000, basis: "Supuesto: $32,000 brutos + 30 % de carga; empresa de una sucursal." },
  { id: "contador", label: "Contador externo y nómina", amount: 7500, basis: "Supuesto: despacho local, contabilidad electrónica y timbrado de nómina." },
  { id: "sistemas", label: "Punto de venta, inventarios y software", amount: 3200, basis: "Supuesto: licencias mensuales." },
  { id: "seguros", label: "Seguro del local y responsabilidad civil", amount: 2800, basis: "Supuesto: prima anual prorrateada." },
  { id: "mantenimiento", label: "Mantenimiento preventivo de cocina", amount: 6500, basis: "Supuesto: campanas, refrigeración, fumigación." },
  { id: "marketing", label: "Publicidad local y redes", amount: 9000, basis: "Supuesto: pauta digital y material del local." },
  { id: "permisos", label: "Licencias, protección civil y derechos", amount: 1800, basis: "Supuesto: prorrateo anual." },
];
const FORJA_FIXED: FixedLine[] = [
  { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 58000, basis: "Supuesto: $45,000 brutos + 30 % de carga; taller de 16 personas." },
  { id: "contador", label: "Contador externo y auditoría fiscal", amount: 9000, basis: "Supuesto: despacho local." },
  { id: "sistemas", label: "ERP, CAD y comunicaciones", amount: 6000, basis: "Supuesto: licencias mensuales." },
  { id: "seguros", label: "Seguro de planta, equipo y mercancía", amount: 9500, basis: "Supuesto: prima anual prorrateada." },
  { id: "mantenimiento", label: "Refacciones y mantenimiento mayor de prensas", amount: 18000, basis: "Supuesto: programa anual prorrateado." },
  { id: "seguridad", label: "Vigilancia, EPP y seguridad industrial", amount: 8500, basis: "Supuesto: guardia nocturna y equipo de protección." },
];

export interface StaffSeed { roleId: string; name: string; siteId: string | null; salary?: number; yearsBefore?: number }
export interface Template {
  id: string;
  family: "restaurante" | "manufactura";
  name: string;
  /** Región de `REGIONS` (labor.ts). Los salarios del catálogo se ajustan con su índice. */
  region: string;
  /** Mes calendario del día 0 (1–12): define cuándo se paga el aguinaldo. */
  startMonth: number;
  cash: number;
  fixedLines: FixedLine[];
  /**
   * Cuánto podría aportar el dueño en una emergencia (pesos), si la relación lo permite. Supuesto de la historia:
   * no es un cheque en blanco; aportar tiene condiciones y deja huella en la relación con el consejo.
   */
  ownerCapacity: number;
  /** Tasa anual de un crédito PyME para esta empresa (supuesto referencial, con comisión de apertura). */
  bankRate: number;
  sites: { id: string; name: string; rent: number; utilities: number; assets: Record<string, number>; shifts: number; demandBase: number }[];
  staff: StaffSeed[];
  contracts?: { id: string; client: string; unitsPerDay: number; price: number }[];
  summary: string;
}

export const TEMPLATES: Readonly<Record<string, Template>> = Object.freeze({
  restaurante_emergente: {
    id: "restaurante_emergente",
    family: "restaurante",
    name: "Grupo Brasa",
    region: "MTY",
    startMonth: 3,
    cash: 420000,
    fixedLines: BRASA_FIXED,
    ownerCapacity: 500000,
    bankRate: 0.24,
    // Servicios del local: luz (incluye refrigeración y campanas), agua y drenaje, internet y teléfono. El gas va por pedido.
    sites: [{ id: "centro", name: "Sucursal Centro", rent: 45000, utilities: 24000, assets: { mesas: 14 }, shifts: 1, demandBase: 100 }],
    staff: [
      { roleId: "gerente_sucursal", name: "Mariana Treviño", siteId: "centro", yearsBefore: 3 },
      { roleId: "cocinero", name: "Raúl Garza", siteId: "centro", yearsBefore: 2 },
      { roleId: "cocinero", name: "Lupita Ochoa", siteId: "centro", yearsBefore: 1 },
      { roleId: "cocinero", name: "Iván Salinas", siteId: "centro" },
      { roleId: "ayudante_cocina", name: "Diego Cantú", siteId: "centro" },
      { roleId: "mesero", name: "Paola Rdz.", siteId: "centro", yearsBefore: 1 },
      { roleId: "mesero", name: "Kevin Leal", siteId: "centro" },
      { roleId: "mesero", name: "Sofía Montes", siteId: "centro" },
      { roleId: "lavaloza", name: "Don Chuy Villarreal", siteId: "centro", yearsBefore: 4 },
    ],
    summary: "Un restaurante con una sucursal, nueve personas y unos 85 pedidos al día. La demanda en horas pico ya supera lo que la cocina puede sacar.",
  },
  manufactura_emergente: {
    id: "manufactura_emergente",
    family: "manufactura",
    name: "Troqueles Forja",
    region: "MTY",
    startMonth: 3,
    cash: 1300000,
    fixedLines: FORJA_FIXED,
    ownerCapacity: 1500000,
    bankRate: 0.2,
    sites: [{ id: "planta", name: "Planta Apodaca", rent: 60000, utilities: 90000, assets: { prensa: 3 }, shifts: 1, demandBase: 0 }],
    staff: [
      { roleId: "supervisor_produccion", name: "Arturo Elizondo", siteId: "planta", yearsBefore: 5 },
      ...["Juan Pérez", "Rocío Saldaña", "Luis Ibarra", "Marisol Cavazos", "Pedro Tamez", "Ana Zúñiga", "Hugo Garza", "Lety Rangel"].map((name) => ({ roleId: "operador", name, siteId: "planta" })),
      { roleId: "operador_cnc", name: "Nacho Villarreal", siteId: "planta", yearsBefore: 4 },
      { roleId: "operador_cnc", name: "Brenda Sáenz", siteId: "planta", yearsBefore: 2 },
      { roleId: "tecnico_mantenimiento", name: "Memo Leal", siteId: "planta", yearsBefore: 3 },
      { roleId: "inspector_calidad", name: "Karla Benavides", siteId: "planta", yearsBefore: 1 },
      { roleId: "almacenista", name: "Toño Guajardo", siteId: "planta" },
      { roleId: "auxiliar_administrativo", name: "Claudia Mier", siteId: null, yearsBefore: 2 },
    ],
    contracts: [
      { id: "c_aceros", client: "Ensambles del Norte", unitsPerDay: 3000, price: 10 },
      { id: "c_frenos", client: "Frenos Apodaca", unitsPerDay: 1800, price: 10 },
    ],
    summary: "Un taller de estampado con quince personas, tres prensas y un turno. Dos clientes compran unas 4,800 piezas al día.",
  },
});
