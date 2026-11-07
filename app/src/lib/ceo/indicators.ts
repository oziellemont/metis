/**
 * mêtis CEO · Registro de movimientos de los indicadores (auditoría de indicadores, fase A).
 *
 * Una sola función de lectura para Hoy, Mi empresa y el resultado de cada decisión: qué movió cada indicador, cuándo
 * y desde qué caso. Se deriva de `timeline` (mismo orden y mismo redondeo que `kpis()`), así que nunca diverge del
 * tablero. Es PURA y de solo lectura: no cambia indicadores, XP ni veredicto.
 *
 * También la salud de la empresa (barra madre): promedio de los cinco, con la misma escala y las mismas zonas que
 * usa el consejo (piso, línea, salud mínima).
 */
import { KPI_KEYS, KPI_LABEL, healthOf, rulesFor, rulesVersionOf, ruleSet } from "./engine";
import { SEASON_OBJECTIVES } from "./objectives";
import { timeline, type EventKind, type TimelineEvent } from "./season-report";
import type { CeoState, KpiKey, Kpis } from "./types";

export type Zone = "critica" | "riesgo" | "observacion" | "sana";
export const ZONE_LABEL: Record<Zone, string> = { critica: "Crítica", riesgo: "En riesgo", observacion: "En observación", sana: "Sana" };

/** De dónde viene un movimiento (para no culpar a la última decisión de todo). */
export const SOURCE_LABEL: Record<EventKind, string> = {
  llegada: "Lo que ya había pasado al llegar el asunto",
  decision: "Tu decisión",
  vencido: "Asunto que venció sin respuesta",
  caso: "Cierre de un caso ejecutivo",
  cambio: "Proyecto de cambio",
  flujo: "Operación del mes (cierre)",
};

export interface Movement {
  kind: EventKind;
  id: string;
  label: string;
  /** Cambio real en el indicador (después del tope 0–100). */
  delta: number;
  before: number;
  after: number;
  at: number | null;
  href: string | null;
  /** Qué ocurrió (texto del caso), si existe. */
  what: string | null;
}

export interface IndicatorDetail {
  kpi: KpiKey;
  label: string;
  hint: string;
  value: number;
  start: number;
  zone: Zone;
  /** Si es uno de los dos objetivos del consejo (o caja, que siempre se vigila). */
  mandate: boolean;
  line: number;
  floor: number;
  last: Movement | null;
  /** Hasta tres causas que más lo bajaron y tres que más lo subieron este mes. */
  down: Movement[];
  up: Movement[];
  history: Movement[];
  /** Movimientos que todavía esperan una respuesta (acuerdos pendientes): no cuentan aún. */
  pending: { id: string; label: string; who: string; what: string; respondsAt: number; href: string }[];
}

/** Umbrales del consejo de la partida (los mismos que usa el veredicto). */
export function thresholdsOf(s: CeoState) {
  const line = rulesFor(s).passLine;
  const R5 = ruleSet(rulesVersionOf(s)).v5;
  const floor = R5 ? line - R5.verdict.floorBelowLine : line;
  const healthMin = R5 ? line + R5.verdict.healthAboveLine : line;
  return { line, floor, healthMin, insolvency: R5?.verdict.insolvency ?? null };
}

/** Zona de un indicador: crítica (debajo del piso), riesgo (debajo de la línea), observación (a menos de 8), sana. */
export function zoneOf(value: number, line: number, floor: number, mandate = false): Zone {
  if (value < floor) return "critica";
  if (value < line) return mandate ? "critica" : "riesgo";
  if (value < line + (mandate ? 12 : 8)) return "observacion";
  return "sana";
}

const textOf = (e: TimelineEvent): string | null => {
  if (e.kind === "decision") return e.entry?.agreement?.resolved ? `${e.option?.outcome ?? ""} ${e.entry.agreement.text}`.trim() : e.option?.outcome ?? null;
  if (e.kind === "vencido") return e.entry?.item.expired.outcome ?? null;
  if (e.kind === "llegada") return e.entry?.item.arrival?.text ?? null;
  if (e.kind === "flujo") return "Lo que el negocio genera en un mes normal, más la parte del mes de los cambios de precio y costo que registraste.";
  return null;
};

function movementsOf(events: TimelineEvent[], k: KpiKey): Movement[] {
  return events
    .map((e) => ({ kind: e.kind, id: e.id, label: e.label, delta: e.after[k] - e.before[k], before: e.before[k], after: e.after[k], at: e.at, href: e.href, what: textOf(e) }))
    .filter((m) => m.delta !== 0);
}

/** Detalle de un indicador: estado, último movimiento, principales causas, historial y pendientes. */
export function indicatorDetail(s: CeoState, now: number, k: KpiKey, labels?: Partial<Record<KpiKey, string>>, hints?: Partial<Record<KpiKey, string>>): IndicatorDetail {
  const tl = timeline(s, now);
  const th = thresholdsOf(s);
  const mandate = k === "caja" || (SEASON_OBJECTIVES[s.company]?.kpis ?? []).includes(k);
  const history = movementsOf(tl.events, k);
  const byImpact = (sign: 1 | -1) => history.filter((m) => Math.sign(m.delta) === sign).sort((a, b) => sign * (b.delta - a.delta)).slice(0, 3);
  const pending = tl.events
    .filter((e) => e.kind === "decision" && e.entry?.agreement && !e.entry.agreement.resolved)
    .map((e) => ({ id: e.id, label: e.label, who: e.entry!.agreement!.who, what: e.entry!.agreement!.what, respondsAt: e.entry!.agreement!.respondsAt, href: e.href ?? `/ceo/caso/${e.id}` }));
  return {
    kpi: k,
    label: labels?.[k] ?? KPI_LABEL[k],
    hint: hints?.[k] ?? "",
    value: tl.end[k],
    start: tl.start[k],
    zone: zoneOf(tl.end[k], th.line, th.floor, mandate),
    mandate,
    line: th.line,
    floor: th.floor,
    last: history.at(-1) ?? null,
    down: byImpact(-1),
    up: byImpact(1),
    history,
    pending,
  };
}

export interface HealthState {
  value: number;
  start: number;
  min: number;
  zone: Zone;
  /** Cuánto falta (o sobra) frente a la salud mínima del consejo. */
  cushion: number;
  /** Indicador que más jala la salud hacia abajo. */
  weakest: KpiKey;
}

/** Salud de la empresa (barra madre): promedio de los cinco, con la salud mínima del consejo como línea. */
export function healthState(k: Kpis, start: Kpis, th: { line: number; floor: number; healthMin: number }): HealthState {
  const value = healthOf(k);
  const zone: Zone = value < th.line ? "critica" : value < th.healthMin ? "riesgo" : value < th.healthMin + 6 ? "observacion" : "sana";
  const weakest = KPI_KEYS.reduce((a, b) => (k[b] - th.line < k[a] - th.line ? b : a));
  return { value, start: healthOf(start), min: th.healthMin, zone, cushion: value - th.healthMin, weakest };
}

export interface DecisionChange {
  /** Indicadores que esta decisión movió, con el valor antes y después (en la escala de Hoy). */
  rows: { kpi: KpiKey; before: number; after: number; delta: number; wasted: number }[];
  health: { before: number; after: number };
}

/**
 * Antes → después de una decisión o vencimiento concreto, leído del mismo registro de movimientos que alimenta Hoy.
 * Null si el asunto todavía no aplica efectos.
 */
export function decisionChange(s: CeoState, now: number, itemId: string, source: "asunto" | "caso" = "asunto"): DecisionChange | null {
  const e = timeline(s, now).events.find((x) => (source === "caso" ? x.kind === "caso" : x.kind === "decision" || x.kind === "vencido") && x.id === itemId);
  if (!e) return null;
  const rows = KPI_KEYS.filter((k) => (e.eff[k] ?? 0) !== 0).map((k) => ({ kpi: k, before: e.before[k], after: e.after[k], delta: e.after[k] - e.before[k], wasted: e.wasted[k] ?? 0 }));
  return { rows, health: { before: healthOf(e.before), after: healthOf(e.after) } };
}
