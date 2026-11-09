/**
 * World Events · cruce del acontecimiento con la exposición de cada empresa.
 *
 * Regla de oro: sin exposición no hay caso. Una sede está expuesta solo si alguna parte de su área cae dentro de una
 * zona oficial (vientos de 90 km/h o más en ciclones; intensidad 6 o más en sismos). La zona verde (vientos de 60 km/h,
 * sismo que se siente fuerte) es solo informativa y no abre caso. El cono de incertidumbre nunca cuenta como daño.
 */
import { siteTouches } from "./geo";
import { exposureOf } from "./exposure";
import type { GdacsEvent, ZoneLayer } from "./connectors";
import { maxZone, zoneRank, type Urgency, type WorldCandidate, type Zone } from "./types";

export interface SiteZones { sites: Record<string, Zone>; observed: Record<string, Zone> }

/** Zona de cada sede de la plantilla: con todo lo que se sabe (observado + pronóstico) y solo con lo observado. */
export function zonesFor(templateId: string, layers: readonly ZoneLayer[]): SiteZones {
  const x = exposureOf(templateId);
  const sites: Record<string, Zone> = {}, observed: Record<string, Zone> = {};
  for (const site of x?.sites ?? []) {
    let all: Zone = "ninguna", obs: Zone = "ninguna";
    for (const l of layers) {
      if (zoneRank(l.zone) <= zoneRank(all) && (l.forecast || zoneRank(l.zone) <= zoneRank(obs))) continue;
      if (!site.points.some((p) => siteTouches({ ...p, radiusKm: site.radiusKm }, l.geometry))) continue;
      all = maxZone(all, l.zone);
      if (!l.forecast) obs = maxZone(obs, l.zone);
    }
    sites[site.id] = all;
    observed[site.id] = obs;
  }
  return { sites, observed };
}

/** La zona más alta entre las sedes. */
export const topZone = (z: Record<string, Zone>): Zone => Object.values(z).reduce<Zone>((a, b) => maxZone(a, b), "ninguna");
/** Revisión mayor para esta empresa: 2 = naranja, 3 = roja (0 = sin exposición que abra caso). */
export const revOf = (z: Record<string, Zone>): number => { const t = topZone(z); return t === "roja" ? 3 : t === "naranja" ? 2 : 0; };

/** Urgente: una sede dentro de zona roja. Importante: zona naranja. (La verde no llega como caso.) */
export const urgencyOf = (z: Record<string, Zone>): Urgency => (topZone(z) === "roja" ? "urgente" : topZone(z) === "naranja" ? "importante" : "informativa");

/** Distancia máxima (km) del centro del acontecimiento a una sede para siquiera pedir su geometría. */
export const PREFILTER_KM = { TC: 1500, EQ: 500 } as const;

/**
 * Candidato para una plantilla. null si ninguna sede queda en zona naranja o roja (y no se está siguiendo un episodio
 * abierto de ese mismo acontecimiento: en ese caso se devuelve igual, para poder cerrarlo con lo observado).
 */
export function candidateFor(templateId: string, ev: GdacsEvent, layers: readonly ZoneLayer[], opts: { tracked?: boolean; also?: { name: string; url: string } } = {}): WorldCandidate | null {
  const z = zonesFor(templateId, layers);
  const rev = revOf(z.sites);
  if (!rev && !opts.tracked) return null;
  const ended = !ev.current;
  const kind = ev.type === "TC" ? "ciclon" : "sismo";
  const observedOnly = kind === "sismo" || ended;
  return {
    src: "gdacs", ev: `${ev.type.toLowerCase()}${ev.eventId}`, rev, family: kind === "ciclon" ? "clima" : "sismo", kind,
    name: kind === "ciclon" ? `Ciclón tropical ${ev.name}` : `Sismo${ev.country ? ` en ${ev.country}` : ""}`,
    status: observedOnly ? "observado" : "pronostico",
    severity: ev.severity,
    source: { name: "GDACS (ONU y Comisión Europea)", url: ev.report || "https://www.gdacs.org/" },
    ...(opts.also ? { also: opts.also } : {}),
    observedAt: Date.parse(ev.modified + (ev.modified.endsWith("Z") ? "" : "Z")) || 0,
    sites: observedOnly ? z.observed : z.sites,
    observed: z.observed,
    ended,
    urgency: urgencyOf(observedOnly ? z.observed : z.sites),
  };
}
