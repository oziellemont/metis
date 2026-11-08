/**
 * mêtis CEO · Growth Engine · tipos (núcleo aislado, fase 1).
 * Dinero en CENTAVOS enteros dentro del estado; los catálogos se escriben en pesos y se convierten al usarlos.
 * Tiempo: días simulados (1 mes = 30 días). El día 0 es la llegada del director. Nada depende del reloj real.
 */

export type Family = "restaurante" | "manufactura";
export type Func = "produccion" | "servicio" | "operaciones" | "ventas" | "finanzas" | "rh" | "calidad" | "mantenimiento" | "logistica" | "direccion";
export type Level = "operativo" | "especialista" | "supervisor" | "gerente" | "director";

export interface RoleDef {
  id: string;
  family: Family;
  title: string;
  func: Func;
  level: Level;
  /** Salario bruto mensual en pesos. */
  salary: { min: number; mid: number; max: number };
  /** Reclutamiento, alta, uniforme o equipo personal y capacitación inicial (pesos, una vez). */
  hireCost: number;
  /** Días para cubrir la vacante. */
  fillDays: number;
  /** Días para llegar a productividad plena y productividad del primer día (0–1). */
  rampDays: number;
  rampStart: number;
  /** Capacidad que aporta a productividad plena (unidades por día de cada recurso de su sitio). */
  provides?: Record<string, number>;
  /** Personas que puede supervisar. */
  span?: number;
  /** Rotación anual esperada (0.6 = 60 %). */
  attrition: number;
  /** Desperdicio extra de una persona en curva de aprendizaje (manufactura). */
  rampScrap?: number;
  /** Plantilla a partir de la cual el puesto tiene sentido. */
  minHeadcount?: number;
  /** Puesto de la empresa, no de un sitio. */
  companyLevel?: boolean;
  salarySource: string;
  confidence: "oficial" | "referencial" | "supuesto";
}

export interface FamilyParams {
  family: Family;
  /** Recursos que limitan lo que un sitio puede atender. Si alguno vale 0, el sitio no puede operar. */
  resources: readonly string[];
  /** Unidad de venta (pedido, pieza) para los textos. */
  unit: { one: string; many: string };
  /** Precio por unidad (pesos). En manufactura, cada contrato trae el suyo. */
  price: number;
  /** IVA incluido en el precio al público (0.16 en restaurante: el menú se publica con IVA). La venta se registra neta. */
  vatInPrice?: number;
  /** Costo de ventas: % del precio (restaurante) o costo de material por pieza producida (manufactura, pesos). */
  cogsPct?: number;
  materialPerUnit?: number;
  /**
   * Gastos variables explícitos (v2): cada línea es un % de la venta o un monto por unidad, con su supuesto.
   * Ejemplos: comisión de terminal sobre la parte cobrada con tarjeta, comisión de plataformas de reparto sobre la
   * parte de pedidos a domicilio, gas por pedido, energía por pieza, fletes.
   */
  variableLines: readonly VariableLine[];
  /** Cobertura de descansos y vacaciones del personal operativo (fracción de su sueldo pagada a eventuales). 0 = no aplica. */
  restCoverage: number;
  /** Días de cobro y de pago a proveedores. */
  dso: number;
  supplierDays: number;
  /** Desperdicio base (manufactura). */
  scrap?: number;
  /** Rol que dirige un sitio; sin él el sitio no abre. */
  leadRole: string;
  /** Cuántas personas coordina el director general directamente cuando no hay mandos. */
  baseSpan: number;
  /** Capacidad de máquina por turno y unidad de activo (manufactura). */
  perShift?: Record<string, number>;
  /** Roles que deben existir por turno (manufactura: un supervisor por turno). */
  shiftRole?: string;
  /** Días durante los que una demanda insatisfecha se puede atender después (backlog). 0 = se pierde (restaurante). */
  backlogDays: number;
}

export interface VariableLine { id: string; label: string; pctOfSales?: number; perUnit?: number; basis: string }
export interface FixedLine { id: string; label: string; amount: number; basis: string }

export interface Person {
  id: string;
  roleId: string;
  name: string;
  siteId: string | null;
  /** Salario bruto mensual (centavos). */
  salary: number;
  hiredDay: number;
  startDay: number;
  leftDay?: number;
  leftReason?: import("./labor").TerminationKind;
  /** Persona que ya estaba antes de tu llegada. */
  founding?: boolean;
  /** Decisión que la trajo. */
  ref?: string;
  /** Provisión de aguinaldo y prima vacacional acumulada y no pagada (centavos). */
  provision: number;
  daysThisMonth: number;
}

export interface Vacancy { id: string; roleId: string; siteId: string | null; openedDay: number; fillDay: number; salary: number; ref: string }

export type SiteStatus = "en_obra" | "preapertura" | "operando" | "cerrada";
export interface Site {
  id: string;
  name: string;
  status: SiteStatus;
  /** Capacidad que aportan los activos: unidades/día (restaurante: mesas) o por turno (manufactura). */
  assets: Record<string, number>;
  shifts: number;
  /** Renta mensual (centavos). */
  rent: number;
  /** Servicios fijos del sitio por mes (centavos). */
  utilities: number;
  /** Demanda madura en unidades por día (restaurante). */
  demandBase: number;
  /** Escenario: qué tanto se cumple la demanda proyectada (1 = la proyección; lo decide la semilla). */
  demandFactor: number;
  /** Días hasta que la demanda madura. */
  maturityDays: number;
  reputation: number;
  backlog: number;
  buildDoneDay?: number;
  openedDay?: number;
  /** Gracia negociada con el arrendador: no se paga renta antes de este día. */
  rentFreeUntil?: number;
  ref?: string;
  /** Zona del mapa de operaciones (geo.ts). Sin dato: se ubica por nombre. */
  zone?: string;
}

export interface Asset { id: string; siteId: string; label: string; resource: string; units: number; cost: number; years: number; activeDay: number; active: boolean; ref: string }

/** `siteId`: planta que surte el contrato. Sin dato (o si esa planta no opera): la planta principal. */
export interface Contract { id: string; client: string; unitsPerDay: number; price: number; startDay: number; ref?: string; siteId?: string }

export type EntryType = "devengo" | "caja";
export interface Entry { id: string; type: EntryType; account: string; month: number; amount: number; ref?: string; text: string }

export interface Scheduled { id: string; day: number; account: string; amount: number; ref?: string; text: string }

export type EventKind = "vacante" | "incorporacion" | "renuncia" | "baja" | "obra" | "obra_terminada" | "apertura" | "activo" | "turno" | "contrato" | "aguinaldo" | "sin_personal"
  | "alerta_liquidez" | "crisis_liquidez" | "liquidez_resuelta" | "vencido" | "decision_financiera" | "rechazo" | "recorte" | "proveedor" | "incumplimiento" | "cancelacion";

/** A quién se le debe. Cada acreedor reacciona distinto a un atraso. */
export type Creditor = "personal" | "fisco" | "arrendador" | "proveedores" | "banco" | "otros";
/** Obligación que llegó a su fecha y no se pudo pagar completa: no es caja negativa, es una deuda vencida con consecuencias. */
export interface Overdue { id: string; account: string; creditor: Creditor; amount: number; since: number; text: string; ref?: string }
export interface Loan { id: string; lender: string; principal: number; balance: number; rate: number; months: number; payment: number; startDay: number; ref: string }
/** Relaciones que reaccionan a cómo administras la liquidez (0–1). Alimentan Equipo, Clientes y Consejo. */
export interface Relations { staff: number; suppliers: number; bank: number; owner: number; clients: number; landlord: number }
export interface Liquidity { status: "sana" | "alerta" | "crisis"; since: number; shortWeek: number | null; gap: number }
export interface GEvent { day: number; kind: EventKind; text: string; ref?: string; personId?: string; siteId?: string }

export interface MonthSummary {
  month: number;
  revenue: number; cogs: number; variable: number; payroll: number; employer: number; payrollTax: number; provision: number;
  coverage: number; rent: number; utilities: number; fixed: number; hiring: number; severance: number; preopening: number; penalties: number; depreciation: number;
  ebitda: number; operating: number;
  /** Intereses, comisiones, factoraje, recargos y moratorios (debajo del EBITDA). */
  financial: number;
  cashBegin: number; inflows: number; outflows: number; cashEnd: number;
  receivables: number; payables: number; overdue: number; debt: number;
  demand: number; served: number; lost: number; capacity: number; scrap: number;
  headcount: number; sites: number;
  bottleneck: string | null;
  /** Resultado por sede (contribución antes de gastos de la empresa). */
  bySite?: SiteMonth[];
}

/** Lo que vendió y gastó una sede en un mes (centavos). Los gastos de la empresa (dirección, contador…) no se reparten. */
export interface SiteMonth { siteId: string; revenue: number; cogs: number; variable: number; people: number; rent: number; utilities: number; contribution: number; demand: number; served: number; lost: number; capacity: number; headcount: number }
export interface SiteAcc { revenue: number; cogs: number; variable: number; demand: number; served: number; lost: number; capacity: number }

export interface GrowthState {
  modelVersion: number;
  laborVersion: number;
  catalogVersion: number;
  family: Family;
  templateId: string;
  region: string;
  seed: string;
  day: number;
  cash: number;
  /** Gastos fijos de la empresa por mes (centavos), por línea explícita (contador, sistemas, seguros, dirección…). */
  fixedLines: FixedLine[];
  people: Person[];
  vacancies: Vacancy[];
  sites: Site[];
  assets: Asset[];
  contracts: Contract[];
  scheduled: Scheduled[];
  ledger: Entry[];
  events: GEvent[];
  months: MonthSummary[];
  /** Decisiones ya aplicadas (idempotencia). */
  applied: string[];
  /** Acumuladores del mes en curso (operación). */
  cur: { demand: number; served: number; lost: number; capacity: number; scrap: number; bottlenecks: Record<string, number>; cashBegin: number; bySite?: Record<string, SiteAcc> };
  attrition: boolean;
  nextId: number;
  // ── Liquidez (fase 2)
  overdue: Overdue[];
  loans: Loan[];
  relations: Relations;
  liquidity: Liquidity;
  /**
   * Condiciones con proveedores: días extra negociados (y hasta cuándo, con el sobreprecio pactado), «solo de contado»
   * tras un atraso (y desde cuándo se puede levantar) y suspensión de surtido mientras haya adeudo viejo.
   */
  supplierTerms: { extraDays: number; extraUntil: number; priceUp: number; cashOnly: boolean; cashOnlyUntil: number; suspended: boolean };
  /** Aportaciones de capital recibidas del dueño (centavos). */
  equity: number;
  /** Recortes vigentes (id de línea fija → día del recorte) para aplicar sus efectos diferidos. */
  cuts: Record<string, number>;
  /** Copia en proyección: no genera alertas (evita recursión). */
  projecting?: boolean;
}

export type Command =
  | { type: "hire"; id: string; roleId: string; siteId: string | null; salary?: number }
  | { type: "terminate"; id: string; personId: string; reason?: string; kind?: import("./labor").TerminationKind; refusesReinstatement?: boolean }
  | { type: "open_site"; id: string; name: string; zone?: string; shifts?: number; rent: number; utilities: number; deposit: number; capex: number; years: number; buildDays: number; assets: Record<string, number>; demandBase: number; maturityDays: number; preopening: number; demandFactor?: number; rentFreeDays?: number }
  | { type: "add_asset"; id: string; siteId: string; label: string; resource: string; units: number; cost: number; years: number; leadDays: number }
  | { type: "set_shifts"; id: string; siteId: string; shifts: number }
  | { type: "add_contract"; id: string; client: string; unitsPerDay: number; price: number; startInDays: number; siteId?: string }
  // ── Decisiones de liquidez: cada una tiene condiciones, costo y puede ser rechazada.
  | { type: "bank_loan"; id: string; amount: number; months: number; preapproved?: boolean }
  | { type: "negotiate_suppliers"; id: string; extraDays: number }
  | { type: "collect_receivables"; id: string; mode: "cobranza" | "factoraje" }
  | { type: "defer_site"; id: string; siteId: string; days: number }
  | { type: "cancel_site"; id: string; siteId: string }
  | { type: "owner_equity"; id: string; amount: number; preapproved?: boolean }
  | { type: "transfer"; id: string; personId: string; siteId: string }
  | { type: "cut_costs"; id: string; lines: string[] };
