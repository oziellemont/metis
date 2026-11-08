/**
 * mêtis CEO · Growth Engine · parámetros por familia y empresas emergentes de arranque (v1).
 * Montos en pesos (se convierten a centavos al instanciar). Todos los nombres son ficticios.
 * Las cifras de operación son supuestos de simulación calibrados para que la empresa de llegada sea viable y
 * tenga un cuello de botella visible; no son datos de mercado.
 */
import type { FamilyParams } from "./types";

export const FAMILIES: Readonly<Record<string, FamilyParams>> = Object.freeze({
  restaurante: {
    family: "restaurante",
    resources: ["cocina", "servicio", "loza", "mesas"],
    unit: { one: "pedido", many: "pedidos" },
    price: 260,
    cogsPct: 0.34,
    varPct: 0.04,
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
    varPct: 0.05,
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

export interface StaffSeed { roleId: string; name: string; siteId: string | null; salary?: number; yearsBefore?: number }
export interface Template {
  id: string;
  family: "restaurante" | "manufactura";
  name: string;
  region: string;
  /** Mes calendario del día 0 (1–12): define cuándo se paga el aguinaldo. */
  startMonth: number;
  cash: number;
  companyFixed: number;
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
    region: "NL",
    startMonth: 3,
    cash: 420000,
    // Contador externo, sistemas y terminal, seguros, mantenimiento, publicidad local y la dirección general.
    companyFixed: 78000,
    sites: [{ id: "centro", name: "Sucursal Centro", rent: 45000, utilities: 30000, assets: { mesas: 14 }, shifts: 1, demandBase: 100 }],
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
    region: "NL",
    startMonth: 3,
    cash: 1300000,
    companyFixed: 70000,
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
