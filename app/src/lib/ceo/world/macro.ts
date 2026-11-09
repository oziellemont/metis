/**
 * World Events · reglas macroeconómicas y de comercio exterior (B7 y B6), puras y versionadas.
 *
 * Estas reglas deciden SI un dato real puede mover dinero en la empresa ficticia y CUÁNTO, siempre a partir de un flujo
 * fechado que ya existe en el motor. Si no hay flujo, contrato, moneda o vigencia, el efecto es cero: se informa, no se cobra.
 *  - Tasa de interés: solo cambia lo que paga la deuda VARIABLE ligada a ese índice. La deuda a tasa fija no cambia.
 *  - Tipo de cambio: solo cambia lo que está realmente en moneda extranjera, descontando la parte cubierta. Compras y
 *    ventas en dólares se compensan (exposición neta), para no contar la devaluación dos veces.
 *  - Arancel: solo con fecha de vigencia ya cumplida, fracción arancelaria (HS), origen y destino que coinciden, y solo si
 *    la empresa es el importador que lo paga. Un anuncio no cobra nada.
 */
import type { CurrencyFlow, DebtLine, TradeLine } from "./exposure";

export const MACRO_RULES_VERSION = 1;

export interface LoanLike { ref: string; balance: number; rate: number }

/** Cambio en el interés mensual (en las mismas unidades que `balance`) por un movimiento de la tasa de referencia. */
export function rateShock(loans: readonly LoanLike[], debt: readonly DebtLine[], index: "TIIE" | "SOFR", deltaPts: number): { monthly: number; affected: string[] } {
  let monthly = 0;
  const affected: string[] = [];
  for (const l of loans) {
    const line = debt.find((d) => d.ref === l.ref);
    if (!line || line.kind !== "variable" || line.index !== index) continue; // fija o sin índice: no cambia
    monthly += (l.balance * deltaPts) / 12;
    affected.push(l.ref);
  }
  return { monthly: Math.round(monthly), affected };
}

/**
 * Efecto mensual (en pesos) de un cambio en el tipo de cambio USD/MXN, de `from` a `to`.
 * `monthlyBase` es el total mensual de compras y de ventas en pesos al tipo anterior.
 */
export function fxImpact(buys: readonly CurrencyFlow[], sells: readonly CurrencyFlow[], monthlyBase: { buys: number; sells: number }, from: number, to: number): { cost: number; revenue: number; net: number } {
  if (!(from > 0) || !(to > 0)) return { cost: 0, revenue: 0, net: 0 };
  const ch = to / from - 1;
  const open = (fs: readonly CurrencyFlow[]) => fs.filter((f) => f.currency !== "MXN").reduce((a, f) => a + f.share * (1 - Math.max(0, Math.min(1, f.hedged))), 0);
  const cost = Math.round(monthlyBase.buys * open(buys) * ch);
  const revenue = Math.round(monthlyBase.sells * open(sells) * ch);
  return { cost, revenue, net: revenue - cost };
}

export interface TariffMeasure {
  /** Fecha de vigencia (ISO). Sin fecha: es un anuncio y no cobra. */
  effectiveDate?: string;
  hs?: string;
  origin?: string;
  destination?: string;
  /** Tasa adicional (0.10 = 10 %). */
  rate: number;
}

/**
 * Costo aduanero directo de una medida para una línea de comercio de la empresa (valor aduanero mensual en pesos).
 * Devuelve 0 si falta vigencia, HS, origen o destino, si aún no es vigente, si no coincide, o si el arancel lo paga otro.
 */
export function tariffCharge(m: TariffMeasure, line: TradeLine, customsValue: number, today: string): { charge: number; reason: string } {
  if (!m.effectiveDate || !m.hs || !m.origin || !m.destination) return { charge: 0, reason: "Medida sin vigencia, fracción arancelaria u origen y destino válidos: no se cobra." };
  if (Date.parse(today) < Date.parse(m.effectiveDate)) return { charge: 0, reason: "Medida anunciada, todavía no vigente." };
  if (!line.hs || !line.hs.startsWith(m.hs) || line.origin !== m.origin || line.destination !== m.destination) return { charge: 0, reason: "La medida no aplica a esta mercancía o ruta." };
  if (!line.importerOfRecord) return { charge: 0, reason: "El arancel lo paga el importador, no esta empresa: el efecto sería indirecto (precio o volumen) y requiere una hipótesis aprobada." };
  return { charge: Math.round(customsValue * m.rate), reason: "Medida vigente para esta mercancía, origen y destino; la empresa es el importador." };
}
