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
import { exposureOf, type CurrencyFlow, type DebtLine, type TradeLine } from "./exposure";
import type { Facts, Kind } from "./types";

export const MACRO_RULES_VERSION = 2;

// ───────────────────────────────────────────────────────────── umbrales de un movimiento «material» (B7)
/** Tipo de cambio: 3 % o más contra 20 publicaciones atrás (unas cuatro semanas hábiles). */
export const FX_MIN = 0.03;
/** TIIE de fondeo: un cuarto de punto o más contra 20 publicaciones atrás (una decisión de Banxico). */
export const RATE_MIN = 0.25;
/** Publicaciones hacia atrás para comparar. */
export const LOOKBACK_PUBS = 20;
/** Margen mínimo (puntos) para que un refinanciamiento a tasa fija valga la comisión. */
export const REFI_MIN_PTS = 0.25;

/** Revisión mayor de un movimiento del tipo de cambio: 1 (3–5 %), 2 (5–8 %), 3 (8 % o más). */
export const fxRev = (ch: number) => (Math.abs(ch) >= 0.08 ? 3 : Math.abs(ch) >= 0.05 ? 2 : Math.abs(ch) >= FX_MIN ? 1 : 0);
/** Revisión mayor de un movimiento de la tasa: 1 (¼ a ½ punto), 2 (½ a 1), 3 (1 punto o más). */
export const rateRev = (pts: number) => (Math.abs(pts) >= 1 ? 3 : Math.abs(pts) >= 0.5 ? 2 : Math.abs(pts) >= RATE_MIN - 1e-9 ? 1 : 0);

/** Parte en moneda extranjera sin cubrir de una lista de flujos (0 a 1). */
export const openShare = (fs: readonly CurrencyFlow[]) => fs.filter((f) => f.currency !== "MXN").reduce((a, f) => a + f.share * (1 - Math.max(0, Math.min(1, f.hedged))), 0);

// ───────────────────────────────────────────────────────────── medidas comerciales con regla aprobada (B6)
/**
 * Reglas aprobadas para medidas comerciales. Una medida solo abre caso si su regla existe, la fracción arancelaria
 * coincide con lo que la empresa compra o vende, y tiene fecha de vigencia. Lo demás es informativo (radar).
 *  - mx_import_competencia: México cambia el arancel de importación de un producto que la empresa VENDE en México
 *    (efecto indirecto: el producto importado que compite cuesta más o menos). Hipótesis H1 versionada en econ.ts.
 *  - mx_import_insumo: México grava un insumo que la empresa IMPORTA como importador de registro (costo directo).
 */
export const TRADE_RULES = ["mx_import_competencia", "mx_import_insumo", "us_232_acero"] as const;
export type TradeRule = (typeof TRADE_RULES)[number];
export interface TradeMatch { rule: TradeRule; what: string }

/**
 * Medidas de EE. UU. verificadas (Federal Register) para acero mexicano. Solo estas abren caso; lo demás va al radar.
 *  - us_232_acero: Sección 232 sobre artículos de acero (incluye palanquilla 7207, varilla 7214 y alambrón 7213).
 * El arancel lo paga el IMPORTADOR DE REGISTRO en EE. UU. A un exportador mexicano que vende DAP o FCA le llega de
 * forma indirecta (el comprador pide descuento o compra menos); solo si vende DDP lo paga él directamente.
 */
export interface UsMeasure { id: string; rule: "us_232_acero"; doc: string; url: string; title: string; signed: string; effective: string; from: number; to: number; hs: string[]; note: string }
export const US_MEASURES: readonly UsMeasure[] = Object.freeze([
  { id: "fr202502833", rule: "us_232_acero", doc: "Proclamación 10896 · FR 2025-02833", url: "https://www.federalregister.gov/documents/2025/02/18/2025-02833/adjusting-imports-of-steel-into-the-united-states", title: "EE. UU. elimina el acuerdo con México: 25 % a su acero", signed: "2025-02-10", effective: "2025-03-12", from: 0, to: 0.25, hs: ["7206", "7207", "7208", "7213", "7214", "7215", "7216"], note: "Los acuerdos alternativos con México dejan de surtir efecto a las 12:01 a. m. del 12 de marzo de 2025." },
  { id: "fr202510524", rule: "us_232_acero", doc: "Proclamación 10947 · FR 2025-10524", url: "https://www.federalregister.gov/documents/2025/06/09/2025-10524/adjusting-imports-of-aluminum-and-steel-into-the-united-states", title: "EE. UU. sube de 25 % a 50 % el arancel al acero", signed: "2025-06-03", effective: "2025-06-04", from: 0.25, to: 0.5, hs: ["7206", "7207", "7208", "7213", "7214", "7215", "7216"], note: "Artículos de acero de las fracciones 7206.10 a 7216.50, entre otras." },
  { id: "fr202606960", rule: "us_232_acero", doc: "Proclamación 11021 · FR 2026-06960", url: "https://www.federalregister.gov/documents/2026/04/09/2026-06960/strengthening-actions-taken-to-adjust-imports-of-aluminum-steel-and-copper-into-the-united-states", title: "EE. UU. mantiene 50 % al acero y lo cobra sobre el valor completo", signed: "2026-04-02", effective: "2026-04-06", from: 0.5, to: 0.5, hs: ["7206", "7207", "7208", "7213", "7214", "7215", "7216"], note: "Sin cambio de tasa para artículos de acero: no abre caso (solo radar)." },
  { id: "fr202611314", rule: "us_232_acero", doc: "Proclamación 11032 · FR 2026-11314", url: "https://www.federalregister.gov/documents/2026/06/04/2026-11314/further-adjusting-the-tariff-regimes-for-imports-of-aluminum-steel-and-copper-into-the-united-states", title: "EE. UU. ajusta derivados y contenido T-MEC; el acero sigue en 50 %", signed: "2026-06-01", effective: "2026-06-08", from: 0.5, to: 0.5, hs: ["7206", "7207", "7208", "7213", "7214", "7215", "7216"], note: "Cambia derivados y contenido regional; no cambia el 50 % de los artículos de acero." },
]);
/** Días después de entrar en vigor en que una medida de EE. UU. todavía cuenta como acontecimiento nuevo. */
export const US_RECENT_DAYS = 120;
/** Arancel vigente de EE. UU. para el acero mexicano en una fecha (ISO), según la tabla verificada. */
export function usSteelRateAt(dateIso: string): { rate: number; measure: UsMeasure | null } {
  const t = Date.parse(dateIso);
  let out: { rate: number; measure: UsMeasure | null } = { rate: 0, measure: null };
  for (const m of US_MEASURES) if (Date.parse(m.effective) <= t) out = { rate: m.to, measure: m };
  return out;
}

/** Hipótesis H4 (versionada en ECON_RULES_VERSION): cómo le llega a un exportador un arancel que paga su comprador. */
export const US_INEVITABLE_VOL = 0.4;
export const US_PASS = 0.4;
export const US_VOL_KEEP = 1.2;
/**
 * Incidencia de un cambio de arancel en EE. UU. sobre una línea de exportación (sin estado del motor).
 *  - DDP (la empresa es importadora de registro): cargo directo = valor aduanero × cambio del arancel.
 *  - DAP, FCA y demás (el comprador es importador): nada directo. El comprador compra menos (parte inevitable:
 *    US_INEVITABLE_VOL × cambio) y, si el precio no se comparte, compra todavía menos (US_VOL_KEEP × cambio).
 */
export function usIncidence(importerOfRecord: boolean, delta: number): { payer: "empresa" | "comprador"; direct: number; inevitableVol: number; keepVol: number; shareDiscount: number } {
  const d = Math.max(-0.5, Math.min(0.5, delta));
  if (importerOfRecord) return { payer: "empresa", direct: d, inevitableVol: Math.max(0, US_INEVITABLE_VOL * d), keepVol: 0, shareDiscount: 0 };
  return { payer: "comprador", direct: 0, inevitableVol: Math.max(0, US_INEVITABLE_VOL * d), keepVol: Math.max(0, US_VOL_KEEP * d), shareDiscount: Math.max(0, US_PASS * d) };
}

/** Regla que aplica a una medida mexicana de importación (fracciones de 4 dígitos) para una plantilla. */
export function tradeMatch(templateId: string, chapters: readonly string[]): TradeMatch | null {
  const x = exposureOf(templateId);
  if (!x) return null;
  const has = (hs: readonly string[] | undefined) => !!hs?.some((h) => chapters.some((c) => h.startsWith(c) || c.startsWith(h)));
  const prod = (x.products ?? []).find((p) => p.market === "México" && has(p.hs));
  if (prod) return { rule: "mx_import_competencia", what: prod.what };
  const line = x.trade.find((t) => t.destination === "México" && t.importerOfRecord && t.hs && has([t.hs]));
  if (line) return { rule: "mx_import_insumo", what: line.what };
  return null;
}

/**
 * ¿Un dato económico o una medida comercial toca a esta empresa? Sin exposición no hay caso (B7, B9):
 *  - Tipo de cambio: solo con compras o ventas en dólares sin cubrir y un movimiento de 3 % o más.
 *  - Tasa: la deuda fija no cambia. Una BAJADA de un cuarto de punto o más abre una oportunidad de refinanciar a quien
 *    tiene crédito a tasa fija. Una subida no le cobra nada a nadie (no hay deuda variable en las plantillas actuales).
 *  - Arancel: regla aprobada que coincide con la exposición, con fecha de vigencia.
 */
export function factsExposed(templateId: string, kind: Kind, facts: Facts | undefined, observedAt = Infinity): boolean {
  const x = exposureOf(templateId);
  if (!x || !facts) return false;
  if (kind === "tipo_cambio") return facts.t === "fx" && facts.from > 0 && Math.abs(facts.to / facts.from - 1) >= FX_MIN - 1e-9 && openShare([...x.buys, ...x.sells]) > 0;
  if (kind === "tasa") return facts.t === "tasa" && facts.to - facts.from <= -RATE_MIN + 1e-9 && x.debt.some((d) => d.kind === "fija" && d.currency === "MXN");
  if (kind === "arancel") {
    if (facts.t !== "arancel" || !facts.effective || !facts.rule || !facts.hs?.length || facts.from === facts.to) return false;
    if (Date.parse(facts.effective) > observedAt) return false; // anunciada, todavía no vigente: no hay caso
    // Medida de EE. UU.: posible solo si el perfil registra exportación de esa categoría a EE. UU. La exposición real
    // (un contrato de exportación vigente) la confirma la partida al abrir el episodio (growth/session.ts).
    if (facts.rule === "us_232_acero") return usExportLine(templateId, facts.hs) !== null;
    return tradeMatch(templateId, facts.hs)?.rule === facts.rule;
  }
  return false;
}

/** Línea de exportación a EE. UU. del perfil (registrada o la que abriría un contrato de exportación). */
export function usExportLine(templateId: string, chapters: readonly string[]) {
  const p = exposureOf(templateId)?.profile;
  if (!p) return null;
  const has = (hs: readonly string[]) => hs.some((h) => chapters.some((c) => h.startsWith(c) || c.startsWith(h)));
  const line = p.lines.find((l) => l.flow === "exportacion" && l.destination === "EE. UU." && has(l.hs));
  if (line) return { what: line.what, incoterm: line.incoterm, importerOfRecord: line.importerOfRecord, counterpart: line.counterpart, clientTag: null as string | null };
  const k = p.exportContracts;
  if (k && k.destination === "EE. UU." && has(k.hs)) return { what: k.what, incoterm: k.incoterm, importerOfRecord: k.importerOfRecord, counterpart: k.counterpart, clientTag: k.clientTag };
  return null;
}

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
