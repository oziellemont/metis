/**
 * mêtis CEO · Growth Engine · costo laboral México (parámetros versionados y regiones configurables).
 *
 * Todo en CENTAVOS enteros para que las identidades contables cierren exactas.
 * Cada parámetro declara fuente, fecha y confianza. Lo que no es dato oficial se marca como supuesto de simulación.
 * Para cambiar un valor se agrega una versión nueva; las partidas guardan la versión con que se crearon.
 *
 * Regiones: el catálogo de puestos está escrito para Monterrey (índice 1). Otra región aplica su índice salarial, su zona
 * de salario mínimo y el impuesto sobre nómina de su estado. Agregar CDMX o Guadalajara = agregar o habilitar una fila
 * de REGIONS (con su fuente); el motor no cambia. En el piloto solo Monterrey está habilitada.
 *
 * Modelo (simplificado y documentado):
 *  - Salario bruto mensual = 30 días de salario diario.
 *  - Salario base de cotización (SBC) = salario × factor de integración (aguinaldo + prima vacacional del año que corre).
 *  - Cuotas patronales IMSS + INFONAVIT + retiro/cesantía: tasa sobre SBC por banda de salario (en veces el mínimo).
 *    Aproximación por bandas; la cifra exacta se determina con el SUA del IMSS por trabajador.
 *  - Impuesto sobre nómina (estatal) sobre el salario bruto.
 *  - Aguinaldo y prima vacacional se provisionan cada mes y se pagan en diciembre (o en el finiquito).
 *  - Terminación: cada causa tiene su propio cálculo (ver `terminationOf`); no hay una fórmula única.
 */

export interface Sourced<T> { value: T; source: string; asOf: string; confidence: "oficial" | "referencial" | "supuesto" }

export interface Region {
  id: string;
  label: string;
  state: string;
  minWageZone: "general" | "zlfn";
  /** Multiplicador sobre los salarios del catálogo (Monterrey = 1). */
  salaryIndex: Sourced<number>;
  /** Solo las regiones habilitadas se ofrecen. */
  enabled: boolean;
}

export const REGIONS: Readonly<Record<string, Region>> = Object.freeze({
  MTY: { id: "MTY", label: "Monterrey y área metropolitana", state: "NL", minWageZone: "general", salaryIndex: { value: 1, source: "Base del catálogo v1", asOf: "2026-11-01", confidence: "supuesto" }, enabled: true },
  CDMX: { id: "CDMX", label: "Ciudad de México y zona metropolitana", state: "CDMX", minWageZone: "general", salaryIndex: { value: 1.08, source: "Supuesto por calibrar con Observatorio Laboral (ingreso por ocupación y entidad)", asOf: "2026-11-01", confidence: "supuesto" }, enabled: false },
  GDL: { id: "GDL", label: "Guadalajara y zona metropolitana", state: "JAL", minWageZone: "general", salaryIndex: { value: 0.94, source: "Supuesto por calibrar con Observatorio Laboral (ingreso por ocupación y entidad)", asOf: "2026-11-01", confidence: "supuesto" }, enabled: false },
});
export const regionOf = (id: string): Region => REGIONS[id] ?? REGIONS.MTY;

export interface LaborParams {
  version: number;
  country: "MX";
  minWageDaily: Sourced<{ general: number; zlfn: number }>;
  umaDaily: Sourced<number>;
  aguinaldoDays: Sourced<number>;
  vacationPremium: Sourced<number>;
  /** Días de vacaciones por años cumplidos (LFT art. 76 reformado). */
  vacationTable: Sourced<readonly { fromYear: number; days: number }[]>;
  employerRate: Sourced<readonly { upToMinWages: number; rate: number }[]>;
  payrollTax: Sourced<Readonly<Record<string, number>>>;
  employerDuePayDay: Sourced<number>;
  /** Recargos por pago extemporáneo de cuotas (mensual). */
  lateRate: Sourced<number>;
  /** Indemnización constitucional (días de SDI), 20 días por año (solo si procede) y prima de antigüedad. */
  severance: Sourced<{ constitutionalDays: number; daysPerYearRefusal: number; seniorityDaysPerYear: number; seniorityCapMinWages: number; seniorityVoluntaryYears: number; probationDays: number }>;
  /** Gratificación habitual de un convenio de terminación por mutuo acuerdo, como fracción de la liquidación de ley. */
  mutualShare: Sourced<number>;
}

export const LABOR_MX: Readonly<Record<number, LaborParams>> = Object.freeze({
  1: Object.freeze<LaborParams>({
    version: 1,
    country: "MX",
    minWageDaily: { value: { general: 315.04, zlfn: 440.87 }, source: "CONASAMI, salarios mínimos vigentes desde el 1 de enero de 2026 (DOF dic-2025)", asOf: "2026-01-01", confidence: "oficial" },
    umaDaily: { value: 117.31, source: "INEGI, UMA 2026 (+3.69 %); confirmar contra la publicación del DOF", asOf: "2026-02-01", confidence: "referencial" },
    aguinaldoDays: { value: 15, source: "Ley Federal del Trabajo, art. 87 (mínimo legal)", asOf: "2026-01-01", confidence: "oficial" },
    vacationPremium: { value: 0.25, source: "LFT art. 80 (mínimo legal)", asOf: "2026-01-01", confidence: "oficial" },
    vacationTable: { value: [{ fromYear: 0, days: 12 }, { fromYear: 1, days: 14 }, { fromYear: 2, days: 16 }, { fromYear: 3, days: 18 }, { fromYear: 4, days: 20 }, { fromYear: 5, days: 22 }, { fromYear: 10, days: 24 }, { fromYear: 15, days: 26 }, { fromYear: 20, days: 28 }], source: "LFT art. 76 (reforma 2023): 12 días el primer año, +2 por año hasta 20, después +2 cada cinco años", asOf: "2026-01-01", confidence: "oficial" },
    employerRate: {
      value: [{ upToMinWages: 1.5, rate: 0.27 }, { upToMinWages: 3, rate: 0.29 }, { upToMinWages: 6, rate: 0.3 }, { upToMinWages: Infinity, rate: 0.26 }],
      source: "Supuesto de simulación por bandas: cuotas IMSS (enfermedad, invalidez, riesgo clase II, guarderías), INFONAVIT 5 %, retiro 2 % y cesantía escalonada 2026. Contrastar con SUA por puesto antes del piloto.",
      asOf: "2026-11-01", confidence: "supuesto",
    },
    payrollTax: { value: { NL: 0.03, CDMX: 0.04, JAL: 0.02, GTO: 0.03, QRO: 0.03, COAH: 0.03 }, source: "Leyes de hacienda estatales (tasas generales); verificar sobretasas vigentes", asOf: "2026-01-01", confidence: "referencial" },
    employerDuePayDay: { value: 17, source: "Ley del Seguro Social, art. 39 (pago a más tardar el día 17 del mes siguiente)", asOf: "2026-01-01", confidence: "oficial" },
    lateRate: { value: 0.0147, source: "Ley de Ingresos de la Federación: tasa de recargos por mora 1.47 % mensual; confirmar la de 2026", asOf: "2026-01-01", confidence: "referencial" },
    severance: {
      value: { constitutionalDays: 90, daysPerYearRefusal: 20, seniorityDaysPerYear: 12, seniorityCapMinWages: 2, seniorityVoluntaryYears: 15, probationDays: 30 },
      source: "LFT arts. 48–50 (indemnización y 20 días por año cuando el patrón no reinstala), 162 y 486 (prima de antigüedad, tope de dos salarios mínimos; en renuncia solo con 15 años), 39-A (periodo de prueba)",
      asOf: "2026-01-01", confidence: "oficial",
    },
    mutualShare: { value: 0.75, source: "Supuesto de simulación: proporción típica negociada en convenios ante el Centro de Conciliación", asOf: "2026-11-01", confidence: "supuesto" },
  }),
});
export const LABOR_VERSION = 1;
export const laborOf = (v = LABOR_VERSION): LaborParams => LABOR_MX[v] ?? LABOR_MX[LABOR_VERSION];
export const minWage = (L: LaborParams, r: Region) => L.minWageDaily.value[r.minWageZone];

export function vacationDays(years: number, L: LaborParams): number {
  let d = 12;
  for (const row of L.vacationTable.value) if (years >= row.fromYear) d = row.days;
  return d;
}
export function integrationFactor(L: LaborParams, years = 0): number {
  return 1 + (L.aguinaldoDays.value + vacationDays(years, L) * L.vacationPremium.value) / 365;
}
export function employerRateFor(monthlyGrossCents: number, L: LaborParams, r: Region): number {
  const times = monthlyGrossCents / 100 / 30 / minWage(L, r);
  return (L.employerRate.value.find((b) => times <= b.upToMinWages) ?? L.employerRate.value.at(-1)!).rate;
}

export interface MonthlyCost { gross: number; employer: number; payrollTax: number; provision: number; total: number }

/** Costo mensual de una persona por `fraction` del mes (0–1), en centavos. */
export function monthlyCost(monthlyGrossCents: number, region: Region, L: LaborParams, fraction = 1, years = 0): MonthlyCost {
  const gross = Math.round(monthlyGrossCents * fraction);
  const sbc = gross * integrationFactor(L, years);
  const employer = Math.round(sbc * employerRateFor(monthlyGrossCents, L, region));
  const payrollTax = Math.round(gross * (L.payrollTax.value[region.state] ?? 0.03));
  const provision = Math.round(((gross / 30) * (L.aguinaldoDays.value + vacationDays(years, L) * L.vacationPremium.value)) / 12);
  return { gross, employer, payrollTax, provision, total: gross + employer + payrollTax + provision };
}

export function burdenOf(monthlyGrossCents: number, region: Region = REGIONS.MTY, L = laborOf()): number {
  const c = monthlyCost(monthlyGrossCents, region, L);
  return c.total / c.gross - 1;
}

/** Salario de un puesto en una región (centavos), redondeado a $50. */
export const regionalSalary = (pesosMid: number, r: Region) => Math.round((pesosMid * r.salaryIndex.value) / 50) * 50 * 100;

export type TerminationKind = "renuncia" | "despido_justificado" | "despido_injustificado" | "mutuo_acuerdo" | "periodo_prueba";
export const TERMINATION_LABEL: Record<TerminationKind, string> = {
  renuncia: "Renuncia voluntaria",
  despido_justificado: "Rescisión con causa justificada (art. 47)",
  despido_injustificado: "Despido sin causa justificada",
  mutuo_acuerdo: "Terminación por mutuo acuerdo (convenio)",
  periodo_prueba: "Terminación en periodo de prueba",
};

export interface Termination {
  kind: TerminationKind;
  /** Pagos del finiquito: aguinaldo y prima proporcionales (ya provisionados) + vacaciones pendientes. */
  provisionPaid: number;
  vacations: number;
  seniority: number;
  constitutional: number;
  twentyDays: number;
  gratification: number;
  /** Lo que es gasto nuevo (no estaba provisionado). */
  newExpense: number;
  total: number;
  lines: { label: string; amount: number }[];
}

/**
 * Pagos de una terminación según su causa (centavos). `provision` es el aguinaldo y la prima ya provisionados y no pagados.
 * `vacDaysPending` son días de vacaciones generados y no gozados. `refusesReinstatement`: el patrón se niega a reinstalar
 * (procede la indemnización de 20 días por año, arts. 49 y 50); por omisión no aplica.
 */
export function terminationOf(kind: TerminationKind, monthlyGrossCents: number, years: number, provision: number, vacDaysPending: number, L: LaborParams, r: Region, refusesReinstatement = false): Termination {
  const S = L.severance.value;
  const daily = monthlyGrossCents / 30;
  const sdi = daily * integrationFactor(L, years);
  const vacations = Math.round(daily * vacDaysPending);
  const seniorityBase = Math.min(daily, S.seniorityCapMinWages * minWage(L, r) * 100);
  const seniorityFull = Math.round(seniorityBase * S.seniorityDaysPerYear * years);
  let seniority = 0, constitutional = 0, twentyDays = 0, gratification = 0;
  if (kind === "renuncia") seniority = years >= S.seniorityVoluntaryYears ? seniorityFull : 0;
  if (kind === "despido_justificado") seniority = seniorityFull;
  if (kind === "despido_injustificado") {
    seniority = seniorityFull;
    constitutional = Math.round(sdi * S.constitutionalDays);
    if (refusesReinstatement) twentyDays = Math.round(sdi * S.daysPerYearRefusal * years);
  }
  if (kind === "mutuo_acuerdo") gratification = Math.round((sdi * S.constitutionalDays + seniorityFull) * L.mutualShare.value);
  const lines = [
    { label: "Aguinaldo y prima vacacional proporcionales", amount: provision },
    { label: "Vacaciones pendientes", amount: vacations },
    { label: "Prima de antigüedad (12 días por año, tope legal)", amount: seniority },
    { label: "Indemnización constitucional (90 días)", amount: constitutional },
    { label: "Indemnización de 20 días por año", amount: twentyDays },
    { label: "Gratificación de convenio", amount: gratification },
  ].filter((x) => x.amount > 0);
  const newExpense = vacations + seniority + constitutional + twentyDays + gratification;
  return { kind, provisionPaid: provision, vacations, seniority, constitutional, twentyDays, gratification, newExpense, total: provision + newExpense, lines };
}

export const pesos = (p: number) => Math.round(p * 100);
