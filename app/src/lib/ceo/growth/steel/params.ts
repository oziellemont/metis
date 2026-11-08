/**
 * mêtis CEO · Acería v2 · parámetros, mercado, escenarios y empresas de arranque.
 *
 * Módulo separado del motor v1: no cambia ninguna partida existente. Cada supuesto trae su valor, su rango razonable y
 * su base. Todo se expresa en pesos aquí y se convierte a centavos enteros en el motor.
 * Referencia independiente: docs/golive/aceria/modelo_propuesto.py (mismos supuestos de costo por tonelada).
 */

export interface Param { value: number; range: [number, number]; basis: string }
const P = (value: number, range: [number, number], basis: string): Param => ({ value, range, basis });

export const STEEL = Object.freeze({
  scrapDelivered: P(6700, [5800, 7500], "Chatarra mixta cortada y clasificada puesta en planta, Monterrey (menudeo de $4 a $5/kg; mayoreo preparado más caro)."),
  yieldMelt: P(0.9, [0.88, 0.93], "Rendimiento metálico de fusión en horno de inducción: escoria, óxido y tierra de la chatarra."),
  yieldCast: P(0.975, [0.96, 0.985], "Rendimiento de colada continua: despuntes y cortes de palanquilla."),
  yieldRoll: P(0.96, [0.94, 0.97], "Rendimiento de laminación: cascarilla y despuntes."),
  alloys: P(450, [350, 600], "Silicomanganeso y ferrosilicio para varilla grado 42, por tonelada de palanquilla."),
  kwhPerLiquidTon: P(625, [550, 700], "Consumo de fusión por tonelada de acero líquido en inducción."),
  kwhPrice: P(2.2, [1.8, 2.6], "Tarifa GDMTH todo incluido: energía de $0.90 a $1.50/kWh más demanda, distribución y horario punta."),
  refractories: P(520, [400, 700], "Revestimiento del crisol, cucharas, oxígeno y consumibles por tonelada de palanquilla."),
  maquilaFee: P(2100, [1800, 2500], "Tarifa de un laminador tercero por convertir palanquilla en varilla."),
  freightToMill: P(250, [180, 350], "Flete de palanquilla al laminador de maquila (por tonelada enviada)."),
  ownRolling: P(680, [550, 850], "Costo variable del laminador propio: gas de recalentamiento, rodillos y energía del tren."),
  freightBillet: P(0.008, [0.005, 0.012], "Flete de palanquilla a clientes, fracción de la venta."),
  freightRebar: P(0.02, [0.015, 0.03], "Flete de varilla a obra o distribuidor, fracción de la venta."),
  employerLoad: P(0.28, [0.25, 0.32], "Cuotas IMSS, INFONAVIT, retiro e impuesto sobre nómina sobre el sueldo bruto."),
  christmasBonus: P(0.05, [0.045, 0.06], "Provisión de aguinaldo (15 días) y prima vacacional sobre el sueldo bruto."),
  isr: P(0.3, [0.3, 0.3], "ISR de personas morales."),
  ptu: P(0.1, [0.1, 0.1], "Participación de los trabajadores en las utilidades; tope de tres meses de salario por trabajador (reforma 2021)."),
  lateTax: P(0.0147, [0.0147, 0.0147], "Recargos mensuales por contribuciones pagadas tarde."),
  penaltyShort: P(0.03, [0.02, 0.05], "Penalización contractual sobre lo no entregado cuando el cumplimiento del mes baja de 95 %."),
  costOfEquity: P(0.15, [0.12, 0.18], "Rendimiento mínimo que exige el dueño a su capital (para medir valor económico)."),
});

/** Términos de pago (días). Proveedor de chatarra casi de contado; consumibles y maquila a 30; CFE el día 10 del mes siguiente. */
export const TERMS = Object.freeze({ scrap: 7, ownScrap: 1, consumables: 30, maquila: 30, freight: 15 });
/** Días que tarda la producción en convertirse en entrega facturada. */
export const LEAD = Object.freeze({ billet: 1, rebarOwn: 3, rebarMaquila: 7 });
/** Días de producción: lunes a sábado (26 de cada 30). */
export const isProductionDay = (day: number) => ![6, 13, 20, 27].includes(((day % 30) + 30) % 30);

/** Ciclo de mercado publicado (igual para todas las partidas). Índices sobre el precio base. */
export function marketIndex(month: number): { scrap: number; steel: number } {
  if (month < 0) return { scrap: 1, steel: 1 };
  const m = month + 1;
  const scrap = m >= 7 && m <= 10 ? 1.1 : m > 10 ? 1.03 : 1;
  const steel = m >= 8 && m <= 12 ? 1.03 : m >= 13 && m <= 18 ? 0.96 : 1;
  return { scrap, steel };
}

/** Escenario: multiplicadores y ajustes desde el día 0 (la historia previa a tu llegada no cambia). */
export interface Scenario {
  id: string;
  price: number; scrap: number; energy: number; yieldMelt: number; demand: number; payDelay: number; maintenance: number;
  /** Choque adicional al precio del acero en un rango de meses (1-indexado). */
  steelShock?: { from: number; to: number; mult: number };
}
export const BASE: Scenario = Object.freeze({ id: "base", price: 1, scrap: 1, energy: 1, yieldMelt: 0, demand: 1, payDelay: 0, maintenance: 1 });
export const STRESS: Scenario = Object.freeze({ ...BASE, id: "estres", steelShock: { from: 10, to: 18, mult: 0.94 } });

export type Product = "palanquilla" | "varilla";
export interface CrewSeed { id: string; label: string; n: number; gross: number }
export interface ContractSeed { id: string; client: string; product: Product; tpd: number; price: number; dso: number; payDelay?: number }
export interface FixedSeed { id: string; label: string; amount: number }
export interface SteelTemplate {
  id: string; name: string; kind: "compacta" | "integrada"; startMonth: number;
  summary: string;
  plant: { furnaces: number; tPerFurnaceShift: number; shifts: number; casterTpd: number; rollingTpd: number; maquilaTpd: number; ownScrapShare: number; scrapDays: number };
  crews: CrewSeed[];
  fixed: FixedSeed[];
  rent: number; siteUtilities: number; sustainingCapex: number;
  /** Activos de la planta: valor en libros al llegar y meses de vida que le quedan. */
  assets: { label: string; book: number; months: number }[];
  contracts: ContractSeed[];
  cash: number;
  debt?: { lender: string; amount: number; rate: number; months: number };
  bankRate: number; ownerCapacity: number;
  /** Coeficiente de utilidad del ejercicio anterior (pagos provisionales de ISR). */
  taxCoefficient: number;
  people: Record<string, string>;
}

export const TEMPLATES_V2: Readonly<Record<string, SteelTemplate>> = Object.freeze({
  aceria_compacta_v2: {
    id: "aceria_compacta_v2", name: "Aceros Huasteca", kind: "compacta", startMonth: 3,
    summary: "Una acería compacta en Santa Catarina: 36 personas, dos hornos de inducción a dos turnos y una máquina de colada continua. Funde chatarra, cuela palanquilla y vende la mayor parte a relaminadoras; la varilla la lamina un tercero por maquila.",
    plant: { furnaces: 2, tPerFurnaceShift: 13.5, shifts: 2, casterTpd: 70, rollingTpd: 0, maquilaTpd: 20, ownScrapShare: 0, scrapDays: 12 },
    crews: [
      { id: "horno", label: "Operadores de horno", n: 12, gross: 13500 },
      { id: "colada", label: "Operadores de colada", n: 6, gross: 13500 },
      { id: "patio", label: "Patio, báscula y grúa", n: 4, gross: 11500 },
      { id: "mantenimiento", label: "Mantenimiento eléctrico y mecánico", n: 4, gross: 17000 },
      { id: "calidad", label: "Metalurgia y laboratorio", n: 2, gross: 22000 },
      { id: "mandos", label: "Supervisores y maestro fundidor", n: 4, gross: 24000 },
      { id: "admin", label: "Administración, compras y ventas", n: 4, gross: 16500 },
    ],
    fixed: [
      { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 75000 },
      { id: "contador", label: "Contabilidad, auditoría y asesoría fiscal", amount: 15000 },
      { id: "sistemas", label: "ERP, básculas y comunicaciones", amount: 10000 },
      { id: "seguros", label: "Seguros de planta, hornos y mercancía", amount: 35000 },
      { id: "mantenimiento", label: "Bobinas, subestación y mantenimiento mayor", amount: 50000 },
      { id: "seguridad", label: "Seguridad industrial, EPP y cumplimiento ambiental", amount: 30000 },
      { id: "laboratorio", label: "Espectrómetro, patrones y análisis externos", amount: 15000 },
    ],
    rent: 120000, siteUtilities: 260000, sustainingCapex: 150000,
    assets: [{ label: "Hornos, colada continua, subestación y nave", book: 42000000, months: 120 }],
    contracts: [
      { id: "k_regios", client: "Laminados Regios", product: "palanquilla", tpd: 22, price: 12300, dso: 30 },
      { id: "k_topo", client: "Relaminadora Topo Chico", product: "palanquilla", tpd: 12, price: 12200, dso: 30 },
      { id: "k_cumbres", client: "Constructora Cumbres del Norte", product: "varilla", tpd: 8, price: 14900, dso: 45, payDelay: 5 },
    ],
    cash: 3500000, bankRate: 0.17, ownerCapacity: 4000000, taxCoefficient: 0.012,
    people: { maestro: "Don Fermín Elizondo", metalurgista: "Ing. Paula Treviño", supervisor: "Rogelio Cantú", mantenimiento: "Ramiro Benítez", patio: "Beto Cavazos", admin: "Lucía Sáenz", dueno: "Don Ignacio Huerta", maquila: "Laminadora de Apodaca", chatarrero: "Chatarras del Norte" },
  },
  miniaceria_integrada_v2: {
    id: "miniaceria_integrada_v2", name: "Grupo Acerero Huasteca", kind: "integrada", startMonth: 3,
    summary: "Una miniacería integrada: 152 personas, fusión a tres turnos con dos hornos grandes de inducción, colada continua de tres líneas, laminador propio de 220 toneladas al día en Santa Catarina y un patio de chatarra en Saltillo. Compró el laminador con un crédito que todavía paga.",
    plant: { furnaces: 2, tPerFurnaceShift: 38, shifts: 3, casterTpd: 260, rollingTpd: 220, maquilaTpd: 0, ownScrapShare: 0.35, scrapDays: 12 },
    crews: [
      { id: "horno", label: "Fusión (horno y cuchara)", n: 30, gross: 15000 },
      { id: "colada", label: "Colada continua", n: 18, gross: 15000 },
      { id: "laminacion", label: "Laminación y recalentamiento", n: 36, gross: 15000 },
      { id: "patio", label: "Patio de chatarra de Saltillo", n: 16, gross: 12500 },
      { id: "mantenimiento", label: "Mantenimiento", n: 18, gross: 20000 },
      { id: "calidad", label: "Metalurgia, laboratorio y calidad", n: 8, gross: 21000 },
      { id: "mandos", label: "Gerencia, jefes y supervisores de turno", n: 12, gross: 36000 },
      { id: "admin", label: "Administración, comercial, logística y seguridad", n: 14, gross: 19000 },
    ],
    fixed: [
      { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 180000 },
      { id: "contador", label: "Auditoría externa y asesoría fiscal", amount: 60000 },
      { id: "sistemas", label: "ERP, básculas y comunicaciones", amount: 70000 },
      { id: "seguros", label: "Seguros de planta, laminador y mercancía", amount: 260000 },
      { id: "mantenimiento", label: "Bobinas, rodillos, subestación y mantenimiento mayor", amount: 620000 },
      { id: "seguridad", label: "Seguridad industrial, EPP y cumplimiento ambiental", amount: 210000 },
      { id: "laboratorio", label: "Laboratorio, certificación y análisis externos", amount: 90000 },
      { id: "comercial", label: "Gastos comerciales y de distribución", amount: 160000 },
    ],
    rent: 300000, siteUtilities: 1450000, sustainingCapex: 1200000,
    assets: [{ label: "Hornos, colada continua, laminador, subestación y naves", book: 348000000, months: 120 }],
    contracts: [
      { id: "k_dan", client: "Distribuidora de Aceros del Norte", product: "varilla", tpd: 70, price: 14800, dso: 45 },
      { id: "k_cumbres", client: "Constructora Cumbres del Norte", product: "varilla", tpd: 45, price: 14950, dso: 60, payDelay: 5 },
      { id: "k_desierto", client: "Estructuras del Desierto", product: "varilla", tpd: 45, price: 14900, dso: 45 },
      { id: "k_regios", client: "Laminados Regios", product: "palanquilla", tpd: 30, price: 12300, dso: 30 },
    ],
    cash: 25000000, debt: { lender: "Banco Regional del Norte", amount: 60000000, rate: 0.13, months: 60 },
    bankRate: 0.14, ownerCapacity: 20000000, taxCoefficient: 0.07,
    people: { maestro: "Don Fermín Elizondo", metalurgista: "Ing. Paula Treviño", supervisor: "Rogelio Cantú", mantenimiento: "Ramiro Benítez", patio: "Arnulfo Aguirre", admin: "Lucía Sáenz", gerente: "Ing. Alfonso Garza", procesos: "Ing. Sofía Lozano", calidadChatarra: "Ing. Olga Narro", dueno: "Consejo de administración", maquila: "Laminadora de Apodaca", chatarrero: "Chatarras del Norte" },
  },
});

/** Activación para jugadores: apagada hasta la comparación final y la prueba completa del recorrido. */
export const STEEL_V2_ENABLED = false;
