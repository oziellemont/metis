/**
 * World Events · conectores (solo servidor para la red; los parsers son puros y se prueban con datos de ejemplo).
 *
 *  - GDACS (JRC / ONU): lista de eventos y geometrías oficiales (zonas de viento de ciclones, intensidad de sismos).
 *    Fuente principal: https://www.gdacs.org/gdacsapi/ · uso libre con atribución.
 *  - NOAA/NHC: tormentas activas del Atlántico y Pacífico (corroboración y enlace al aviso oficial).
 *  - USGS: sismos de magnitud 4.5+ de la última semana (corroboración y enlace).
 *  - Banxico SIE: opcional (BANXICO_TOKEN). Solo consulta; ninguna regla mueve dinero sin flujo fechado.
 *
 * Si un conector falla, el juego sigue con sus casos normales: se devuelve una lista vacía.
 */
import { haversineKm, type Geometry } from "./geo";
import type { Zone } from "./types";

export interface GdacsEvent {
  type: "TC" | "EQ";
  eventId: number;
  episodeId: number;
  name: string;
  alert: "Green" | "Orange" | "Red";
  current: boolean;
  country: string;
  from: string;
  to: string;
  modified: string;
  lat: number;
  lon: number;
  severity: string;
  report: string;
  geometryUrl: string;
}

/** Capa de zona de una geometría GDACS: zona, si es pronóstico y su fecha. */
export interface ZoneLayer { zone: Exclude<Zone, "ninguna">; forecast: boolean; date: string; geometry: Geometry }

const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : NaN);

/** Lista de eventos de GDACS (GeoJSON de geteventlist). Ignora lo que no tenga forma conocida. */
export function parseGdacsList(json: unknown): GdacsEvent[] {
  const feats = (json as { features?: unknown[] })?.features;
  if (!Array.isArray(feats)) return [];
  const out: GdacsEvent[] = [];
  for (const f of feats) {
    const p = (f as { properties?: Record<string, unknown> })?.properties;
    const g = (f as { geometry?: { type?: string; coordinates?: unknown } })?.geometry;
    if (!p || (p.eventtype !== "TC" && p.eventtype !== "EQ")) continue;
    const c = g?.type === "Point" && Array.isArray(g.coordinates) ? (g.coordinates as number[]) : [];
    const eventId = n(p.eventid), episodeId = n(p.episodeid), lon = n(c[0]), lat = n(c[1]);
    if (![eventId, episodeId, lat, lon].every(Number.isFinite)) continue;
    const url = (p.url ?? {}) as Record<string, unknown>;
    const alert = p.alertlevel === "Red" || p.alertlevel === "Orange" ? p.alertlevel : "Green";
    out.push({
      type: p.eventtype, eventId, episodeId, name: s(p.eventname) || s(p.name), alert,
      current: p.iscurrent === true || p.iscurrent === "true", country: s(p.country), from: s(p.fromdate), to: s(p.todate), modified: s(p.datemodified),
      lat, lon, severity: s((p.severitydata as Record<string, unknown> | undefined)?.severitytext), report: s(url.report), geometryUrl: s(url.geometry),
    });
  }
  return out;
}

const TC_ZONE: Record<string, Exclude<Zone, "ninguna">> = { Poly_Red: "roja", Poly_Orange: "naranja", Poly_Green: "verde" };

/**
 * Zonas de un ciclón (getgeometry de GDACS). Las capas «60/90/120 km/h» cubren toda la trayectoria (observada y
 * pronosticada); las capas con fecha son la posición de cada aviso. Una capa con fecha posterior al último dato
 * observado (`to`) es pronóstico. El cono de incertidumbre NO es zona de daño y se ignora.
 */
export function parseTcGeometry(json: unknown, observedTo: string): ZoneLayer[] {
  const feats = (json as { features?: unknown[] })?.features;
  if (!Array.isArray(feats)) return [];
  const cutoff = Date.parse(observedTo + (observedTo.endsWith("Z") ? "" : "Z"));
  const out: ZoneLayer[] = [];
  for (const f of feats) {
    const p = (f as { properties?: Record<string, unknown> })?.properties ?? {};
    const g = (f as { geometry?: Geometry })?.geometry;
    const zone = TC_ZONE[s(p.Class)];
    if (!zone || !g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) continue;
    const label = s(p.polygonlabel);
    const whole = /km\/h/.test(label);
    const date = s(p.polygondate);
    const t = Date.parse(date + (date.endsWith("Z") ? "" : "Z"));
    out.push({ zone, forecast: whole ? true : Number.isFinite(t) && Number.isFinite(cutoff) && t > cutoff, date, geometry: g });
  }
  return out;
}

/**
 * Zonas de un sismo (ShakeMap en GDACS): intensidad 7+ roja (daño moderado a fuerte), 6–6.5 naranja (daño ligero),
 * 5–5.5 verde (se siente fuerte). Todo es observado.
 */
export function parseEqGeometry(json: unknown): ZoneLayer[] {
  const feats = (json as { features?: unknown[] })?.features;
  if (!Array.isArray(feats)) return [];
  const out: ZoneLayer[] = [];
  for (const f of feats) {
    const p = (f as { properties?: Record<string, unknown> })?.properties ?? {};
    const g = (f as { geometry?: Geometry })?.geometry;
    if (!/^Poly_SMPInt_/.test(s(p.Class)) || !g) continue;
    const mmi = Number(s(p.polygonlabel).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(mmi) || mmi < 5) continue;
    out.push({ zone: mmi >= 7 ? "roja" : mmi >= 6 ? "naranja" : "verde", forecast: false, date: "", geometry: g });
  }
  return out;
}

export interface NhcStorm { id: string; name: string; classification: string; lat: number; lon: number; advisory: string; updated: string }
export function parseNhc(json: unknown): NhcStorm[] {
  const list = (json as { activeStorms?: unknown[] })?.activeStorms;
  if (!Array.isArray(list)) return [];
  return list.flatMap((x) => {
    const r = x as Record<string, unknown>;
    const lat = n(r.latitudeNumeric), lon = n(r.longitudeNumeric);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !s(r.name)) return [];
    return [{ id: s(r.id), name: s(r.name), classification: s(r.classification), lat, lon, advisory: s((r.publicAdvisory as Record<string, unknown> | undefined)?.url) || "https://www.nhc.noaa.gov/", updated: s(r.lastUpdate) }];
  });
}

export interface UsgsQuake { id: string; mag: number; place: string; time: number; lat: number; lon: number; url: string }
export function parseUsgs(json: unknown): UsgsQuake[] {
  const feats = (json as { features?: unknown[] })?.features;
  if (!Array.isArray(feats)) return [];
  return feats.flatMap((f) => {
    const p = (f as { properties?: Record<string, unknown> })?.properties ?? {};
    const c = ((f as { geometry?: { coordinates?: unknown } })?.geometry?.coordinates ?? []) as number[];
    const lat = n(c[1]), lon = n(c[0]), mag = n(p.mag), time = n(p.time);
    if (![lat, lon, mag, time].every(Number.isFinite)) return [];
    return [{ id: s((f as { id?: unknown }).id), mag, place: s(p.place), time, lat, lon, url: s(p.url) }];
  });
}

/** Tormenta del NHC que corresponde a un ciclón de GDACS (mismo nombre, o a menos de 300 km). */
export function nhcFor(ev: GdacsEvent, storms: NhcStorm[]): NhcStorm | null {
  const base = ev.name.toUpperCase().replace(/-\d+$/, "");
  return storms.find((x) => x.name.toUpperCase() === base) ?? storms.find((x) => haversineKm(ev.lat, ev.lon, x.lat, x.lon) < 300) ?? null;
}
/** Sismo del USGS que corresponde a uno de GDACS (±3 min y a menos de 100 km). */
export function usgsFor(ev: GdacsEvent, quakes: UsgsQuake[]): UsgsQuake | null {
  const t = Date.parse(ev.from + (ev.from.endsWith("Z") ? "" : "Z"));
  return quakes.find((q) => Math.abs(q.time - t) < 180_000 && haversineKm(ev.lat, ev.lon, q.lat, q.lon) < 100) ?? null;
}

// ─────────────────────────────────────────────────────────────── red (solo servidor)
export const GDACS_LIST = (fromDate: string) => `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC;EQ&fromdate=${fromDate}`;
export const NHC_URL = "https://www.nhc.noaa.gov/CurrentStorms.json";
export const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";
export const BANXICO_URL = (serie: string) => `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${serie}/datos/oportuno`;

/** GET con límite de tiempo. Cualquier error → null (el juego sigue). */
export async function getJson(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<unknown | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), init.timeoutMs ?? 8000);
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal, headers: { accept: "application/json", "user-agent": "metis-ceo/1 (world-events)", ...(init.headers ?? {}) } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Banxico (opcional): último dato de una serie. Sin BANXICO_TOKEN no consulta nada. */
export async function banxicoLatest(serie: string, token = process.env.BANXICO_TOKEN): Promise<{ date: string; value: number } | null> {
  if (!token) return null;
  const j = (await getJson(BANXICO_URL(serie), { headers: { "Bmx-Token": token } })) as { bmx?: { series?: { datos?: { fecha: string; dato: string }[] }[] } } | null;
  const d = j?.bmx?.series?.[0]?.datos?.at(-1);
  const v = d ? Number(d.dato.replace(/,/g, "")) : NaN;
  return d && Number.isFinite(v) ? { date: d.fecha, value: v } : null;
}
