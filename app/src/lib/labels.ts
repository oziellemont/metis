/**
 * Etiquetas visibles en la interfaz. Un solo lugar para cambiar vocabulario.
 * Siglas propuestas (ver docs/decisiones.md):
 *   Owner       · dueño del resultado, captura el dato   (metodología: FCE / IPE)
 *   Contributor · participa sin capturar                   (metodología: FCI / IPI)
 */
import type { Direction, ElementType, Period, Responsibility, ScorecardStatus, Traffic, Unit } from "./domain/types";

export const RESP: Record<Responsibility, { code: string; plural: string; name: string; help: string }> = {
  owner: { code: "Owner", plural: "Owners", name: "Owner", help: "Dueño del resultado en este alcance. Carga el dato cada periodo." },
  contributor: { code: "Contributor", plural: "Contributors", name: "Contributor", help: "Participa en el resultado sin ser dueño. Su scorecard se actualiza cuando el Owner carga." },
};

export const TYPE: Record<ElementType, string> = { kpi: "KPI", project: "PROY" };

export const DIR: Record<Direction, { arrow: string; short: string; long: string }> = {
  up: { arrow: "↑", short: "Incr.", long: "Incremental · más es mejor" },
  down: { arrow: "↓", short: "Decr.", long: "Decremental · menos es mejor" },
};

export const PERIOD: Record<Period, string> = {
  monthly: "Mensual",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  annual: "Anual",
};

export const STATUS: Record<ScorecardStatus, { label: string; tone: string }> = {
  draft: { label: "Borrador", tone: "bg-slate-100 text-slate-700" },
  submitted: { label: "Enviado a jefe", tone: "bg-sky-soft text-sky" },
  approved: { label: "Aprobado", tone: "bg-mint-soft text-sob" },
  changes_requested: { label: "Ajustes solicitados", tone: "bg-amber-soft text-amber" },
  rejected: { label: "Denegado", tone: "bg-coral-soft text-coral" },
};

export const TRAFFIC: Record<Traffic, { label: string; bg: string; text: string; dot: string }> = {
  outstanding: { label: "Sobresaliente", bg: "bg-mint-soft", text: "text-sob", dot: "bg-sob" },
  satisfactory: { label: "Satisfactorio", bg: "bg-mint-soft", text: "text-sat", dot: "bg-sat" },
  minimum: { label: "Mínimo", bg: "bg-amber-soft", text: "text-amber", dot: "bg-min" },
  below: { label: "Bajo mínimo", bg: "bg-coral-soft", text: "text-coral", dot: "bg-bajo" },
  pending: { label: "Sin dato", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-300" },
};

export const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** Formato rápido por símbolo (cuando no se tiene a la mano el catálogo de unidades). */
export function fmtValue(v: number | null | undefined, unit: string): string {
  if (v === null || v === undefined) return "—";
  if (unit === "$") return "$" + (v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : v.toLocaleString("es-MX"));
  if (unit === "%") return v.toLocaleString("es-MX", { maximumFractionDigits: 1 }) + "%";
  return v.toLocaleString("es-MX", { maximumFractionDigits: 1 }) + (unit && unit !== "#" ? " " + unit : "");
}

/** Formato con la definición del catálogo de unidades: símbolo, posición (prefijo/sufijo) y decimales. */
export function fmtWithUnit(v: number | null | undefined, u: Unit | undefined, fallbackSymbol = ""): string {
  if (v === null || v === undefined) return "—";
  if (!u) return fmtValue(v, fallbackSymbol);
  const abs = Math.abs(v);
  const compact = u.position === "prefix" && abs >= 1_000_000;
  const num = compact
    ? (v / 1_000_000).toLocaleString("es-MX", { maximumFractionDigits: 1 }) + "M"
    : v.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: u.decimals });
  if (u.symbol === "#") return num;
  if (u.position === "prefix") return `${u.symbol}${u.symbol.length > 1 ? " " : ""}${num}`;
  return `${num}${u.symbol === "%" ? "" : " "}${u.symbol}`;
}
