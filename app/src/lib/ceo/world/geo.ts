/**
 * World Events · geometría mínima (sin dependencias): distancia, punto en polígono y muestreo de una sede con radio.
 * Coordenadas GeoJSON: [longitud, latitud].
 */
export type Pos = [number, number];
export type Ring = Pos[];
export type PolygonCoords = Ring[];
export interface Geometry { type: string; coordinates: unknown }

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Distancia en km entre dos puntos (lat, lon). */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Punto a `km` de distancia con rumbo `bearing` (grados). */
export function offset(lat: number, lon: number, km: number, bearing: number): { lat: number; lon: number } {
  const d = km / R, b = rad(bearing), p1 = rad(lat), l1 = rad(lon);
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
  const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return { lat: (p2 * 180) / Math.PI, lon: (((l2 * 180) / Math.PI + 540) % 360) - 180 };
}

function inRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(lon: number, lat: number, poly: PolygonCoords): boolean {
  if (!poly.length || !inRing(lon, lat, poly[0])) return false;
  for (let k = 1; k < poly.length; k++) if (inRing(lon, lat, poly[k])) return false; // hueco
  return true;
}

const isPos = (x: unknown): x is Pos => Array.isArray(x) && x.length >= 2 && typeof x[0] === "number" && typeof x[1] === "number";
const isRing = (x: unknown): x is Ring => Array.isArray(x) && x.length >= 3 && x.every(isPos);
const isPoly = (x: unknown): x is PolygonCoords => Array.isArray(x) && x.length > 0 && x.every(isRing);

/** ¿El punto cae dentro de un Polygon o MultiPolygon? Otras geometrías: no. */
export function pointInGeometry(lat: number, lon: number, g: Geometry | null | undefined): boolean {
  if (!g) return false;
  if (g.type === "Polygon" && isPoly(g.coordinates)) return inPolygon(lon, lat, g.coordinates);
  if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) return (g.coordinates as unknown[]).some((p) => isPoly(p) && inPolygon(lon, lat, p));
  return false;
}

/** Puntos que representan una sede con radio: el centro y 8 puntos en el borde. */
export function samplePoints(lat: number, lon: number, radiusKm: number): { lat: number; lon: number }[] {
  const out = [{ lat, lon }];
  if (radiusKm > 0) for (let b = 0; b < 360; b += 45) out.push(offset(lat, lon, radiusKm, b));
  return out;
}

/** ¿Alguna parte de la sede (centro o borde) cae dentro de la geometría? */
export function siteTouches(site: { lat: number; lon: number; radiusKm: number }, g: Geometry | null | undefined): boolean {
  return samplePoints(site.lat, site.lon, site.radiusKm).some((p) => pointInGeometry(p.lat, p.lon, g));
}
