/**
 * mêtis CEO · Growth Engine · costo laboral México (parámetros versionados).
 *
 * Todo en CENTAVOS enteros para que las identidades contables cierren exactas.
 * Cada parámetro declara fuente, fecha y confianza. Lo que no es dato oficial se marca como supuesto de simulación.
 * Para cambiar un valor se agrega una versión nueva; las partidas guardan la versión con que se crearon.
 *
 * Modelo (simplificado y documentado):
 *  - Salario bruto mensual = 30 días de salario diario.
 *  - Salario base de cotización (SBC) = salario × factor de integración (aguinaldo 15 días + prima vacacional 25 % de 12 días).
 *  - Cuotas patronales IMSS + INFONAVIT + retiro/cesantía: una tasa sobre SBC por banda de salario (en veces el salario mínimo).
 *    Es una aproximación por bandas; la cifra exacta se determina con el SUA del IMSS por trabajador.
 *  - Impuesto sobre nómina (estatal) sobre el salario bruto, según el estado de la empresa.
 *  - Aguinaldo y prima vacacional se provisionan cada mes y se pagan en diciembre (o en el finiquito).
 */

export interface Sourced<T> { value: T; source: string; asOf: string; confidence: "oficial" | "referencial" | "supuesto" }

export interface LaborParams {
  version: number;
  country: "MX";
  minWageDaily: Sourced<number>;
  umaDaily: Sourced<number>;
  aguinaldoDays: Sourced<number>;
  vacationDays: Sourced<number>;
  vacationPremium: Sourced<number>;
  /** Tasa patronal sobre SBC por banda (hasta N salarios mínimos). Supuesto agregado por bandas. */
  employerRate: Sourced<readonly { upToMinWages: number; rate: number }[]>;
  /** Impuesto sobre nómina por estado. */
  payrollTax: Sourced<Readonly<Record<string, number>>>;
  /** Días de pago de cuotas: el IMSS se entera a más tardar el día 17 del mes siguiente. */
  employerDuePayDay: Sourced<number>;
  /** Indemnización por despido injustificado: 90 días + 20 días por año (LFT arts. 48 y 50). */
  severance: Sourced<{ baseDays: number; daysPerYear: number }>;
}

export const LABOR_MX: Readonly<Record<number, LaborParams>> = Object.freeze({
  1: Object.freeze<LaborParams>({
    version: 1,
    country: "MX",
    minWageDaily: { value: 315.04, source: "CONASAMI, salario mínimo general vigente desde el 1 de enero de 2026 (DOF dic-2025)", asOf: "2026-01-01", confidence: "oficial" },
    umaDaily: { value: 117.31, source: "INEGI, UMA 2026 (3.69 % sobre 113.14); confirmar contra la publicación del DOF", asOf: "2026-02-01", confidence: "referencial" },
    aguinaldoDays: { value: 15, source: "Ley Federal del Trabajo, art. 87 (mínimo legal)", asOf: "2026-01-01", confidence: "oficial" },
    vacationDays: { value: 12, source: "LFT art. 76 (primer año, reforma 2023)", asOf: "2026-01-01", confidence: "oficial" },
    vacationPremium: { value: 0.25, source: "LFT art. 80 (mínimo legal)", asOf: "2026-01-01", confidence: "oficial" },
    employerRate: {
      value: [
        { upToMinWages: 1.5, rate: 0.27 },
        { upToMinWages: 3, rate: 0.29 },
        { upToMinWages: 6, rate: 0.3 },
        { upToMinWages: Infinity, rate: 0.26 },
      ],
      source: "Supuesto de simulación por bandas: cuotas IMSS (enfermedad, invalidez, riesgo clase II, guarderías), INFONAVIT 5 %, retiro 2 % y cesantía escalonada 2026. Contrastar con SUA por puesto antes del piloto.",
      asOf: "2026-11-01",
      confidence: "supuesto",
    },
    payrollTax: { value: { NL: 0.03, CDMX: 0.04, JAL: 0.02, GTO: 0.03, QRO: 0.03, COAH: 0.03 }, source: "Leyes de hacienda estatales (tasas generales); verificar sobretasas vigentes", asOf: "2026-01-01", confidence: "referencial" },
    employerDuePayDay: { value: 17, source: "Ley del Seguro Social, art. 39 (pago a más tardar el día 17 del mes siguiente)", asOf: "2026-01-01", confidence: "oficial" },
    severance: { value: { baseDays: 90, daysPerYear: 20 }, source: "LFT arts. 48 y 50 (indemnización constitucional y 20 días por año)", asOf: "2026-01-01", confidence: "oficial" },
  }),
});
export const LABOR_VERSION = 1;
export const laborOf = (v = LABOR_VERSION): LaborParams => LABOR_MX[v] ?? LABOR_MX[LABOR_VERSION];

/** Factor de integración del SBC (aguinaldo + prima vacacional sobre 365 días). */
export function integrationFactor(L: LaborParams): number {
  return 1 + (L.aguinaldoDays.value + L.vacationDays.value * L.vacationPremium.value) / 365;
}

export function employerRateFor(monthlyGrossCents: number, L: LaborParams): number {
  const daily = monthlyGrossCents / 100 / 30;
  const times = daily / L.minWageDaily.value;
  return (L.employerRate.value.find((b) => times <= b.upToMinWages) ?? L.employerRate.value.at(-1)!).rate;
}

export interface MonthlyCost {
  /** Salario bruto (se paga en el mes). */
  gross: number;
  /** Cuotas patronales (se pagan el mes siguiente). */
  employer: number;
  /** Impuesto estatal sobre nómina (se paga el mes siguiente). */
  payrollTax: number;
  /** Provisión de aguinaldo y prima vacacional (se paga en diciembre o en el finiquito). */
  provision: number;
  /** Costo total devengado del mes. */
  total: number;
}

/** Costo mensual de una persona por `fraction` del mes (0–1), en centavos. */
export function monthlyCost(monthlyGrossCents: number, state: string, L: LaborParams, fraction = 1): MonthlyCost {
  const gross = Math.round(monthlyGrossCents * fraction);
  const sbc = gross * integrationFactor(L);
  const employer = Math.round(sbc * employerRateFor(monthlyGrossCents, L));
  const payrollTax = Math.round(gross * (L.payrollTax.value[state] ?? 0.03));
  const provision = Math.round((gross / 30) * (L.aguinaldoDays.value + L.vacationDays.value * L.vacationPremium.value) / 12);
  return { gross, employer, payrollTax, provision, total: gross + employer + payrollTax + provision };
}

/** Carga sobre el salario (costo total / bruto − 1) para mostrar «cuesta X % más que su sueldo». */
export function burdenOf(monthlyGrossCents: number, state: string, L = laborOf()): number {
  const c = monthlyCost(monthlyGrossCents, state, L);
  return c.total / c.gross - 1;
}

/** Indemnización por despido injustificado (sin el finiquito, que es la provisión acumulada), en centavos. */
export function severanceOf(monthlyGrossCents: number, yearsWorked: number, L: LaborParams): number {
  const dailyIntegrated = (monthlyGrossCents / 30) * integrationFactor(L);
  return Math.round(dailyIntegrated * (L.severance.value.baseDays + L.severance.value.daysPerYear * yearsWorked));
}

export const pesos = (p: number) => Math.round(p * 100);
