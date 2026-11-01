/**
 * mêtis CEO · perfiles de negocio (P0-C).
 *
 * Un perfil por familia de métricas (alimentos, autopartes, restaurantes, SaaS) × tipo de empresa (PYME, startup,
 * establecida). Define la línea base de un mes y las métricas de operación que tienen sentido en ESA industria:
 * merma y OTIF en alimentos, OEE y PPM en autopartes, ticket y prime cost en restaurantes, churn y NRR en SaaS.
 * Nunca hay KPI de inventario en SaaS ni MRR en alimentos (lo verifica una prueba).
 *
 * Cifras en millones de pesos (MXN) por mes, salvo donde se indica. La establecida coincide con la ficha del
 * paquete (Cumbre $410 M al año, 240 personas; Forja $2,300 M, 1,100; Brasa $980 M, 1,450). La PYME de alimentos
 * es el ejemplo del plan P0-A §4.4 (ventas 4.00, margen 34%, nómina 1.05, caja 6.00).
 *
 * «Margen bruto» = ventas menos insumos y materiales. La nómina va aparte (renglón propio), como en el plan.
 */
import type { CompanyArchetype } from "../career/taxonomy";
import type { KpiKey } from "../types";

export interface Baseline {
  /** Ventas del mes de tu llegada. */
  revenue: number;
  /** Margen bruto (0–1). */
  grossMargin: number;
  headcount: number;
  /** Costo mensual por persona (sueldo y prestaciones), en millones. */
  costPerHead: number;
  marketing: number;
  /** Otros gastos: parte fija + parte variable (proporción de las ventas). */
  otherFixed: number;
  otherVar: number;
  /** Efectivo al cierre del mes de tu llegada. */
  cash: number;
  /** Días de cobro (cuentas por cobrar). */
  dso: number;
  /** Inversión de mantenimiento como proporción de las ventas. */
  capexPct: number;
  /** Crecimiento mensual de base y la meta de crecimiento del presupuesto. */
  growth: number;
  targetGrowth: number;
  clients: number;
}

export type MetricUnit = "%" | "dias" | "ppm" | "mxn" | "meses" | "M";
export interface OpsMetricDef {
  id: string;
  label: string;
  unit: MetricUnit;
  /** Valor de base por tipo de empresa (si falta un tipo, usa `establecida`). */
  base: Partial<Record<CompanyArchetype, number>> & { establecida: number };
  /** Meta de la industria (sin meta: solo se muestra la tendencia). */
  target?: number;
  better: "up" | "down";
  /** Se calcula de las ventas del periodo (p. ej. MRR = ventas × proporción recurrente), no se acumula. */
  fromRevenue?: number;
  /** Índice de salud que la mueve y cuánto por punto de cambio en el periodo. */
  driver?: { kpi: KpiKey; k: number };
  /** Variación natural por periodo (± unidades), sembrada por empresa y periodo. */
  noise: number;
  min: number;
  max: number;
  hint: string;
}

export interface BusinessProfile {
  id: string;
  /** Cómo se llaman los clientes en esta industria. */
  clientsLabel: string;
  clientsHint: string;
  baselines: Record<CompanyArchetype, Baseline>;
  metrics: OpsMetricDef[];
}

const pct = (id: string, label: string, base: OpsMetricDef["base"], target: number, better: OpsMetricDef["better"], driver: OpsMetricDef["driver"], noise: number, hint: string, max = 100): OpsMetricDef =>
  ({ id, label, unit: "%", base, target, better, driver, noise, min: 0, max, hint });

export const PROFILES: Record<string, BusinessProfile> = {
  alimentos: {
    id: "alimentos",
    clientsLabel: "Clientes activos",
    clientsHint: "Cadenas, mayoristas y distribuidores que te compraron en el mes.",
    baselines: {
      establecida: { revenue: 34.2, grossMargin: 0.38, headcount: 240, costPerHead: 0.026, marketing: 0.75, otherFixed: 2.6, otherVar: 0.035, cash: 50, dso: 60, capexPct: 0.015, growth: 0.004, targetGrowth: 0.008, clients: 120 },
      pyme: { revenue: 4.0, grossMargin: 0.34, headcount: 45, costPerHead: 1.05 / 45, marketing: 0.05, otherFixed: 0.15, otherVar: 0, cash: 6.0, dso: 40, capexPct: 0, growth: 0.01, targetGrowth: 0.02, clients: 38 },
      startup: { revenue: 1.2, grossMargin: 0.42, headcount: 22, costPerHead: 0.03, marketing: 0.25, otherFixed: 0.2, otherVar: 0.02, cash: 14, dso: 30, capexPct: 0.01, growth: 0.05, targetGrowth: 0.07, clients: 60 },
    },
    metrics: [
      pct("merma", "Merma", { establecida: 3.1, pyme: 3.6, startup: 4.0 }, 2.5, "down", { kpi: "equipo", k: -0.03 }, 0.08, "Producto que se pierde en el proceso."),
      pct("otif", "Entregas completas y a tiempo (OTIF)", { establecida: 91, pyme: 88, startup: 85 }, 97, "up", { kpi: "clientes", k: 0.15 }, 0.4, "Pedidos que llegan completos y en la fecha pactada."),
      { id: "dias_inventario", label: "Días de inventario", unit: "dias", base: { establecida: 32, pyme: 28, startup: 24 }, target: 25, better: "down", driver: { kpi: "caja", k: -0.25 }, noise: 0.6, min: 5, max: 90, hint: "Cuántos días de venta tienes en bodega. Más días = más caja atrapada." },
      pct("rotacion", "Rotación de planta (anual)", { establecida: 34, pyme: 30, startup: 25 }, 20, "down", { kpi: "equipo", k: -0.6 }, 0.8, "Personas de planta que se van en un año."),
      pct("concentracion", "Ventas en el cliente principal", { establecida: 31, pyme: 35, startup: 28 }, 25, "down", { kpi: "clientes", k: -0.1 }, 0.3, "Qué tanto dependes de una sola cadena."),
    ],
  },
  autopartes: {
    id: "autopartes",
    clientsLabel: "Clientes (armadoras y Tier 1)",
    clientsHint: "Armadoras y proveedores a los que les entregas piezas.",
    baselines: {
      establecida: { revenue: 191.7, grossMargin: 0.48, headcount: 1100, costPerHead: 0.032, marketing: 0.3, otherFixed: 20, otherVar: 0.075, cash: 40, dso: 45, capexPct: 0.02, growth: 0.003, targetGrowth: 0.006, clients: 4 },
      pyme: { revenue: 12, grossMargin: 0.42, headcount: 110, costPerHead: 0.022, marketing: 0.05, otherFixed: 1.4, otherVar: 0.06, cash: 8, dso: 60, capexPct: 0.02, growth: 0.004, targetGrowth: 0.008, clients: 6 },
      startup: { revenue: 3, grossMargin: 0.45, headcount: 40, costPerHead: 0.035, marketing: 0.1, otherFixed: 0.5, otherVar: 0.05, cash: 25, dso: 60, capexPct: 0.04, growth: 0.04, targetGrowth: 0.06, clients: 3 },
    },
    metrics: [
      pct("oee", "OEE de la planta", { establecida: 61, pyme: 58, startup: 55 }, 85, "up", { kpi: "equipo", k: 0.25 }, 0.6, "Disponibilidad × desempeño × calidad. Clase mundial: 85%."),
      { id: "ppm", label: "PPM con el cliente", unit: "ppm", base: { establecida: 410, pyme: 480, startup: 520 }, target: 50, better: "down", driver: { kpi: "clientes", k: -6 }, noise: 12, min: 0, max: 5000, hint: "Piezas defectuosas por millón que llegan al cliente." },
      pct("entregas", "Entregas a tiempo", { establecida: 93, pyme: 90, startup: 88 }, 98, "up", { kpi: "clientes", k: 0.12 }, 0.4, "Embarques que llegan en la ventana pactada."),
      pct("rotacion", "Rotación de personal (anual)", { establecida: 38, pyme: 32, startup: 28 }, 15, "down", { kpi: "equipo", k: -0.6 }, 0.8, "Personas que se van en un año."),
      pct("concentracion", "Ventas en el cliente principal", { establecida: 72, pyme: 60, startup: 80 }, 50, "down", { kpi: "clientes", k: -0.05 }, 0.2, "Qué tanto dependes de una sola armadora."),
    ],
  },
  restaurantes: {
    id: "restaurantes",
    clientsLabel: "Comensales al mes",
    clientsHint: "Tickets atendidos en el mes, en sucursal y por apps.",
    baselines: {
      establecida: { revenue: 81.7, grossMargin: 0.67, headcount: 1450, costPerHead: 0.0175, marketing: 1.6, otherFixed: 8, otherVar: 0.17, cash: 30, dso: 3, capexPct: 0.025, growth: 0.002, targetGrowth: 0.006, clients: 194500 },
      pyme: { revenue: 3.2, grossMargin: 0.66, headcount: 70, costPerHead: 0.012, marketing: 0.06, otherFixed: 0.45, otherVar: 0.17, cash: 2.5, dso: 2, capexPct: 0.02, growth: 0.004, targetGrowth: 0.01, clients: 9000 },
      startup: { revenue: 2.0, grossMargin: 0.64, headcount: 55, costPerHead: 0.015, marketing: 0.3, otherFixed: 0.3, otherVar: 0.2, cash: 12, dso: 5, capexPct: 0.03, growth: 0.05, targetGrowth: 0.07, clients: 10000 },
    },
    metrics: [
      { id: "ticket", label: "Ticket promedio", unit: "mxn", base: { establecida: 420, pyme: 355, startup: 200 }, target: 450, better: "up", driver: { kpi: "margen", k: 1 }, noise: 3, min: 50, max: 5000, hint: "Lo que gasta en promedio cada comensal." },
      pct("mismas_tiendas", "Venta en mismas sucursales (anual)", { establecida: 0.8, pyme: 1.5, startup: 6 }, 4.5, "up", { kpi: "clientes", k: 0.15 }, 0.3, "Crecimiento de las sucursales con más de un año abiertas.", 50),
      pct("prime_cost", "Prime cost", { establecida: 64, pyme: 62, startup: 66 }, 60, "down", { kpi: "margen", k: -0.12 }, 0.3, "Comida + nómina sobre la venta. Sano: menos de 60%."),
      pct("food_cost", "Food cost", { establecida: 33, pyme: 34, startup: 36 }, 31, "down", { kpi: "margen", k: -0.07 }, 0.2, "Ingredientes sobre la venta."),
      pct("apps", "Venta por apps de entrega", { establecida: 27, pyme: 20, startup: 45 }, 20, "down", { kpi: "clientes", k: -0.1 }, 0.3, "Parte de la venta que paga comisión a las apps."),
      pct("rotacion", "Rotación de personal (anual)", { establecida: 92, pyme: 80, startup: 100 }, 60, "down", { kpi: "equipo", k: -0.9 }, 1.2, "Personas que se van en un año.", 300),
    ],
  },
  saas: {
    id: "saas",
    clientsLabel: "Clientes con suscripción",
    clientsHint: "Empresas que pagan una suscripción activa.",
    baselines: {
      establecida: { revenue: 25, grossMargin: 0.78, headcount: 180, costPerHead: 0.06, marketing: 3.5, otherFixed: 3, otherVar: 0.05, cash: 60, dso: 45, capexPct: 0.01, growth: 0.012, targetGrowth: 0.02, clients: 900 },
      pyme: { revenue: 1.5, grossMargin: 0.75, headcount: 18, costPerHead: 0.05, marketing: 0.15, otherFixed: 0.2, otherVar: 0.04, cash: 4, dso: 30, capexPct: 0.005, growth: 0.015, targetGrowth: 0.025, clients: 120 },
      startup: { revenue: 2.5, grossMargin: 0.75, headcount: 45, costPerHead: 0.065, marketing: 0.8, otherFixed: 0.6, otherVar: 0, cash: 60, dso: 30, capexPct: 0.005, growth: 0.06, targetGrowth: 0.08, clients: 300 },
    },
    metrics: [
      { id: "mrr", label: "Ingreso recurrente mensual (MRR)", unit: "M", base: { establecida: 24, pyme: 1.4, startup: 2.4 }, better: "up", fromRevenue: 0.96, noise: 0, min: 0, max: 1e6, hint: "Suscripciones activas por mes." },
      pct("churn", "Cancelaciones (churn mensual)", { establecida: 1.6, pyme: 2.2, startup: 2.8 }, 1.5, "down", { kpi: "clientes", k: -0.03 }, 0.05, "Clientes que cancelan en el mes."),
      pct("nrr", "Retención neta de ingresos (NRR)", { establecida: 104, pyme: 100, startup: 98 }, 110, "up", { kpi: "clientes", k: 0.2 }, 0.4, "Lo que hoy pagan los clientes de hace un año.", 200),
      { id: "cac_payback", label: "Recuperación del costo de adquisición", unit: "meses", base: { establecida: 14, pyme: 12, startup: 18 }, target: 12, better: "down", driver: { kpi: "margen", k: -0.1 }, noise: 0.3, min: 1, max: 60, hint: "Meses para recuperar lo que cuesta conseguir un cliente." },
    ],
  },
};

/** Perfil por paquete (para empresas sin `metricProfileId` reconocido). */
const BY_PACK: Record<string, string> = { cumbre: "alimentos", forja: "autopartes", brasa: "restaurantes", kubit: "saas" };
export function profileFor(metricProfileId: string | undefined, packId: string): BusinessProfile {
  return PROFILES[metricProfileId ?? ""] ?? PROFILES[BY_PACK[packId] ?? "alimentos"] ?? PROFILES.alimentos;
}
export const metricBase = (m: OpsMetricDef, a: CompanyArchetype): number => m.base[a] ?? m.base.establecida;
