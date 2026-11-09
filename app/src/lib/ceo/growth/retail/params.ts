/**
 * mêtis CEO · Retail v2 (cadena de tiendas de conveniencia) · parámetros, mercado, escenarios y empresa de arranque.
 *
 * Solo existe la versión consolidada: una cadena regional de tiendas de conveniencia abiertas 24 horas, con su CEDIS y
 * su flotilla, del tipo de las cadenas nacionales de conveniencia pero más chica. Cada supuesto trae su valor, su rango
 * razonable y su base. Todo se expresa en pesos aquí y se convierte a centavos enteros en el motor.
 *
 * Referencias públicas usadas para calibrar órdenes de magnitud (no se copian cifras de ninguna empresa):
 *  - Reporte trimestral de FEMSA 2T26 (OXXO México): margen bruto 44.8 %, margen de operación 10.0 %, EBITDA ajustado
 *    15.3 % con NIIF 16 (sin renta), cerca de $38,600 de venta por tienda al día, ticket promedio cerca de $64.
 *  - Tamaño del mercado: unas 24,700 tiendas OXXO, unas 2,000 de 7-Eleven, 1,160 de Círculo K y 700 de Kiosko.
 * Una cadena regional sin la escala de compras ni los ingresos de servicios financieros de la líder vende menos por
 * tienda y tiene menos margen bruto; con la renta dentro del EBITDA (sin NIIF 16) su margen razonable es de 8 a 11 %.
 */

export interface Param { value: number; range: [number, number]; basis: string }
const P = (value: number, range: [number, number], basis: string): Param => ({ value, range, basis });

export const RETAIL = Object.freeze({
  ticket: P(62, [55, 70], "Ticket promedio de una tienda de conveniencia regional (la líder nacional reporta cerca de $64)."),
  ticketsMature: P(540, [420, 650], "Tickets al día de una tienda madura de la cadena (la líder nacional ronda 600)."),
  rampStart: P(0.55, [0.45, 0.65], "Venta de una tienda nueva en su primer mes, como fracción de una madura."),
  rampMonths: P(18, [12, 24], "Meses que tarda una tienda nueva en llegar a su venta madura."),
  commercialIncome: P(0.035, [0.025, 0.05], "Ingresos comerciales de proveedores (exhibición, bonificaciones por volumen, fondos de mercadotecnia) como fracción de la venta."),
  serviceTx: P(70, [40, 110], "Transacciones diarias de servicios por tienda: pago de recibos, recargas, depósitos y remesas."),
  serviceFee: P(9, [7, 12], "Comisión neta que recibe la tienda por transacción de servicios."),
  cardShare: P(0.45, [0.35, 0.6], "Fracción de la venta que se paga con tarjeta."),
  cardFee: P(0.015, [0.012, 0.02], "Comisión del adquirente por venta con tarjeta."),
  employerLoad: P(0.28, [0.25, 0.32], "Cuotas IMSS, INFONAVIT, retiro e impuesto sobre nómina sobre el sueldo bruto."),
  christmasBonus: P(0.05, [0.045, 0.06], "Provisión de aguinaldo (15 días) y prima vacacional sobre el sueldo bruto."),
  wageIncrease: P(0.1, [0.06, 0.14], "Aumento de enero al personal de tienda, que gana cerca del salario mínimo (2024: 20 %; 2025: 12 %; 2026: 13 %)."),
  turnover: P(0.08, [0.05, 0.12], "Rotación mensual del personal de tienda (las cadenas de conveniencia rotan más de 90 % al año)."),
  hireCost: P(4500, [3000, 7000], "Reclutamiento, alta, uniforme y capacitación de un empleado de tienda."),
  logistics: P(0.022, [0.018, 0.03], "Costo variable de distribución del CEDIS a tienda (diésel, casetas, mantenimiento de flotilla) sobre la venta surtida por CEDIS."),
  storeCapex: P(3_200_000, [2_600_000, 4_000_000], "Inversión de una tienda nueva: adecuación del local, refrigeración, mobiliario, cámaras y sistemas."),
  isr: P(0.3, [0.3, 0.3], "ISR de personas morales."),
  ptu: P(0.1, [0.1, 0.1], "Participación de los trabajadores en las utilidades; tope de tres meses de salario por trabajador (reforma 2021)."),
  lateTax: P(0.0147, [0.0147, 0.0147], "Recargos mensuales por contribuciones pagadas tarde."),
  costOfEquity: P(0.15, [0.12, 0.18], "Rendimiento mínimo que exige el accionista a su capital (para medir valor económico)."),
});

/** Categorías de mercancía: participación en la venta, margen sobre venta, merma, días de inventario, plazo del proveedor y si llega por CEDIS. */
export type CatId = "bebidas" | "cerveza" | "tabaco" | "abarrotes" | "comida";
export interface Category { id: CatId; label: string; share: number; margin: number; shrink: number; invDays: number; terms: number; viaCedis: boolean; supplier: string }
export const CATEGORIES: readonly Category[] = Object.freeze([
  { id: "bebidas", label: "Refrescos, agua y bebidas", share: 0.38, margin: 0.3, shrink: 0.006, invDays: 9, terms: 21, viaCedis: false, supplier: "Embotelladoras" },
  { id: "cerveza", label: "Cerveza", share: 0.14, margin: 0.22, shrink: 0.008, invDays: 8, terms: 30, viaCedis: false, supplier: "Cerveceras" },
  { id: "tabaco", label: "Cigarros", share: 0.1, margin: 0.09, shrink: 0.012, invDays: 7, terms: 15, viaCedis: true, supplier: "Tabacaleras" },
  { id: "abarrotes", label: "Botanas, dulces, abarrotes y cuidado personal", share: 0.26, margin: 0.33, shrink: 0.012, invDays: 24, terms: 45, viaCedis: true, supplier: "Proveedores del CEDIS" },
  { id: "comida", label: "Comida preparada, café y perecederos", share: 0.12, margin: 0.5, shrink: 0.06, invDays: 3, terms: 15, viaCedis: true, supplier: "Proveedores de comida y lácteos" },
]);

/** Estacionalidad de Monterrey y Saltillo (mes calendario 1–12): el calor de verano vende bebida; enero y febrero bajan. */
export const SEASON: readonly number[] = [0.92, 0.93, 0.99, 1.02, 1.08, 1.11, 1.12, 1.1, 1.02, 0.98, 0.96, 1.03];

/** Escenario: multiplicadores y ajustes desde el día 0 (la historia previa a tu llegada no cambia). */
export interface Scenario {
  id: string;
  demand: number; ticket: number; costs: number; shrink: number; wage: number; energy: number; rent: number; rate: number; payDelay: number;
  /** Competidor nacional que abre cerca de un grupo de tiendas a partir de un mes (1-indexado): recorta tickets. */
  competitor?: { fromMonth: number; group: string; hit: number };
  /** Multiplicador de la venta inicial de las tiendas nuevas (ubicaciones que tardan más en madurar). */
  ramp?: number;
}
export const BASE: Scenario = Object.freeze({ id: "base", demand: 1, ticket: 1, costs: 1, shrink: 1, wage: 1, energy: 1, rent: 1, rate: 0, payDelay: 0 });

export interface StoreGroupSeed { id: string; label: string; n: number; ageMonths: number; tickets: number; ticket: number; rent: number; energy: number; other: number; staff: number; leaderGross: number; staffGross: number; nightShift: boolean }
export interface FixedSeed { id: string; label: string; amount: number }
export interface CrewSeed { id: string; label: string; n: number; gross: number }
export interface RetailTemplate {
  id: string; name: string; startMonth: number; summary: string;
  groups: StoreGroupSeed[];
  /** Personal fuera de tienda: CEDIS, flotilla, supervisión y corporativo. */
  crews: CrewSeed[];
  fixed: FixedSeed[];
  cedis: { rent: number; energy: number; capacityStores: number };
  assets: { label: string; book: number; months: number }[];
  sustainingCapex: number;
  cash: number;
  debt?: { lender: string; amount: number; rate: number; months: number };
  bankRate: number; ownerCapacity: number; taxCoefficient: number;
  people: Record<string, string>;
}

export const TEMPLATES_RETAIL: Readonly<Record<string, RetailTemplate>> = Object.freeze({
  conveniencia_regional_v2: {
    id: "conveniencia_regional_v2", name: "Tiendas Al Paso", startMonth: 3,
    summary: "Una cadena regional de 340 tiendas de conveniencia abiertas las 24 horas en Monterrey, Saltillo y las carreteras del noreste, con un CEDIS en Apodaca y su propia flotilla. Cerca de 2,400 personas. Compite cuadra por cuadra con las cadenas nacionales; su fuerza es la ubicación y la comida preparada.",
    groups: [
      { id: "mty", label: "Monterrey metropolitano", n: 205, ageMonths: 60, tickets: 560, ticket: 61, rent: 27_000, energy: 21_000, other: 11_500, staff: 5, leaderGross: 13_500, staffGross: 9_800, nightShift: true },
      { id: "saltillo", label: "Saltillo y Ramos Arizpe", n: 61, ageMonths: 48, tickets: 500, ticket: 60, rent: 22_000, energy: 20_000, other: 10_500, staff: 5, leaderGross: 13_000, staffGross: 9_500, nightShift: true },
      { id: "rezagadas", label: "Tiendas de bajo tráfico (Saltillo y periferia)", n: 14, ageMonths: 40, tickets: 215, ticket: 50, rent: 26_000, energy: 20_000, other: 10_500, staff: 5, leaderGross: 13_000, staffGross: 9_500, nightShift: true },
      { id: "carretera", label: "Carreteras y gasolineras", n: 32, ageMonths: 48, tickets: 430, ticket: 82, rent: 30_000, energy: 24_000, other: 13_000, staff: 5, leaderGross: 14_000, staffGross: 10_200, nightShift: true },
      { id: "nuevas", label: "Aperturas del último año", n: 28, ageMonths: 6, tickets: 540, ticket: 61, rent: 29_000, energy: 21_000, other: 11_500, staff: 5, leaderGross: 13_500, staffGross: 9_800, nightShift: true },
    ],
    crews: [
      { id: "cedis", label: "CEDIS: recibo, surtido y embarque", n: 120, gross: 12_000 },
      { id: "flotilla", label: "Operadores de reparto", n: 48, gross: 15_500 },
      { id: "supervision", label: "Supervisores de distrito", n: 28, gross: 27_000 },
      { id: "corporativo", label: "Corporativo: compras, finanzas, sistemas, expansión y personas", n: 95, gross: 31_000 },
    ],
    fixed: [
      { id: "direccion", label: "Dirección general y comité (con carga social)", amount: 1_100_000 },
      { id: "sistemas", label: "Punto de venta, ERP, telecomunicaciones de tiendas y centro de datos", amount: 2_300_000 },
      { id: "seguros", label: "Seguros de tiendas, mercancía, flotilla y valores", amount: 1_050_000 },
      { id: "valores", label: "Traslado de valores y recolección de efectivo", amount: 1_750_000 },
      { id: "seguridad", label: "Monitoreo de cámaras, alarmas y seguridad", amount: 1_200_000 },
      { id: "mercadotecnia", label: "Mercadotecnia y programa de lealtad", amount: 2_300_000 },
      { id: "auditoria", label: "Auditoría externa, asesoría fiscal y legal", amount: 450_000 },
      { id: "mantenimiento", label: "Mantenimiento de refrigeración, equipos y tiendas", amount: 2_600_000 },
    ],
    cedis: { rent: 1_150_000, energy: 650_000, capacityStores: 400 },
    assets: [{ label: "Tiendas (adecuaciones, refrigeración, mobiliario), CEDIS y flotilla", book: 760_000_000, months: 96 }],
    sustainingCapex: 3_400_000,
    cash: 110_000_000,
    debt: { lender: "Banco Regional del Norte", amount: 180_000_000, rate: 0.125, months: 48 },
    bankRate: 0.135, ownerCapacity: 80_000_000, taxCoefficient: 0.055,
    people: {
      consejo: "Esteban Garza", fondo: "Inés Treviño", finanzas: "Claudia Leal", operaciones: "Octavio Ríos", clientes: "Mónica Saldívar",
      compras: "Diego Villarreal", personas: "Lorena Cantú", tienda: "Jesús «Chuy» Elizondo", supervisor: "Karla Mendoza", asistente: "Paty Aguirre",
      cedis: "Ing. Rubén Salinas", expansion: "Arq. Daniela Montemayor", seguridad: "Lic. Mauricio Villegas",
      refresquera: "Embotelladora del Norte", cervecera: "Cervecería Regional", banco: "Banco Regional del Norte",
    },
  },
});

/** Interruptor para jugadores: apagado hasta que se autorice. Con false, Retail sigue por el camino de siempre. */
export const RETAIL_V2_ENABLED = false;
