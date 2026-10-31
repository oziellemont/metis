/**
 * mêtis CEO · moneda de la carrera continua (P0-B2).
 *
 * La simulación calcula TODO en pesos (MXN), la moneda base de la empresa. El jugador puede ver
 * las cifras en dólares (USD) con un tipo de cambio de REFERENCIA fijo y versionado:
 *  - no es una cotización en vivo; la pantalla lo dice («tipo de cambio de referencia»),
 *  - cambiar la vista nunca recalcula la empresa ni sus resultados,
 *  - para cambiar el tipo de cambio se agrega una versión nueva; una publicada no se edita.
 */
export type DisplayCurrency = "MXN" | "USD";
export const isDisplayCurrency = (x: unknown): x is DisplayCurrency => x === "MXN" || x === "USD";

export interface FxAssumption { version: number; usd_mxn: number; label: string }

/** Supuestos de tipo de cambio publicados. Congelados: no editar; agregar versiones nuevas. */
export const FX_ASSUMPTIONS: Readonly<Record<number, FxAssumption>> = Object.freeze({
  1: Object.freeze({ version: 1, usd_mxn: 18.5, label: "Tipo de cambio de referencia" }),
});
export const FX_VERSION = 1;
export const FX_NOTE = "Tipo de cambio de referencia fijo del simulador. No es una cotización en vivo.";

export function fxOf(version: number = FX_VERSION): FxAssumption {
  return FX_ASSUMPTIONS[version] ?? FX_ASSUMPTIONS[FX_VERSION];
}

/** Monto en millones de pesos → la moneda que el jugador quiere ver (en millones). Solo pantalla. */
export function toDisplay(mxnMillions: number, cur: DisplayCurrency, fxVersion: number = FX_VERSION): number {
  return cur === "USD" ? mxnMillions / fxOf(fxVersion).usd_mxn : mxnMillions;
}

/**
 * Formato corto en millones: «$4.0 M MXN», «−$0.2 M USD», «$3.25 M MXN» (dos decimales bajo 10 M si hace falta).
 * El signo menos es tipográfico (−), como en el resto del simulador.
 */
export function formatMoney(mxnMillions: number, cur: DisplayCurrency = "MXN", fxVersion: number = FX_VERSION): string {
  const v = toDisplay(mxnMillions, cur, fxVersion);
  const a = Math.abs(v);
  const digits = a >= 100 ? 0 : a >= 10 ? 1 : Math.round(a * 10) === a * 10 ? 1 : 2;
  const n = a.toLocaleString("es-MX", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${v < 0 ? "−" : ""}$${n} M ${cur}`;
}
