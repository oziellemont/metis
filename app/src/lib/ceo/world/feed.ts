/**
 * World Events · lectura de fuentes oficiales (solo servidor).
 *
 *  1. GDACS (ONU y Comisión Europea): lista de ciclones y sismos de los últimos 14 días.
 *  2. Prefiltro por distancia a las sedes de las plantillas con exposición (no se piden geometrías lejanas).
 *  3. Geometría oficial de cada acontecimiento cercano: zonas de viento (ciclones) o de intensidad (sismos).
 *  4. Corroboración: NHC (ciclones del Atlántico y Pacífico) y USGS (sismos). Si no hay corroboración se sigue con GDACS.
 *  5. Cruce con la exposición de cada plantilla: solo sale un candidato si alguna sede queda en zona naranja o roja.
 *
 * Caché de 10 minutos en memoria. Cualquier fuente caída devuelve una lista vacía (el juego sigue igual).
 */
import { GDACS_LIST, NHC_URL, USGS_URL, getJson, nhcFor, parseEqGeometry, parseFlGeometry, parseGdacsList, parseNhc, parseTcGeometry, parseUsgs, usgsFor, type GdacsEvent, type ZoneLayer } from "./connectors";
import { exposedTemplates, exposureOf } from "./exposure";
import { haversineKm } from "./geo";
import { PREFILTER_KM, candidateFor } from "./match";
import type { Family, WorldCandidate } from "./types";

export const FEED_TTL_MS = 10 * 60_000;
export const FEED_DAYS = 14;

export interface FeedEvent { ev: GdacsEvent; layers: ZoneLayer[]; also?: { name: string; url: string } }
export interface Feed { at: number; ok: boolean; events: FeedEvent[]; sources: { gdacs: boolean; nhc: boolean; usgs: boolean } }

let cache: Feed | null = null;
let inflight: Promise<Feed> | null = null;

/** ¿El acontecimiento está lo bastante cerca de alguna sede de alguna plantilla como para pedir su geometría? */
export function nearAnySite(ev: GdacsEvent, templates: readonly string[] = exposedTemplates()): boolean {
  const km = PREFILTER_KM[ev.type];
  return templates.some((t) => exposureOf(t)?.sites.some((s) => s.points.some((p) => haversineKm(ev.lat, ev.lon, p.lat, p.lon) <= km + s.radiusKm)));
}

const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Lee y arma el tablero de acontecimientos (con caché). `fetcher` se puede sustituir en pruebas. */
export async function loadFeed(now = Date.now(), fetcher: (url: string) => Promise<unknown | null> = (u) => getJson(u)): Promise<Feed> {
  if (cache && now - cache.at < FEED_TTL_MS) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const list = await fetcher(GDACS_LIST(ymd(now - FEED_DAYS * 86_400_000)));
    const all = list ? parseGdacsList(list) : [];
    const near = all.filter((e) => nearAnySite(e));
    const needTc = near.some((e) => e.type === "TC"), needEq = near.some((e) => e.type === "EQ");
    const [nhcRaw, usgsRaw] = await Promise.all([needTc ? fetcher(NHC_URL) : null, needEq ? fetcher(USGS_URL) : null]);
    const storms = nhcRaw ? parseNhc(nhcRaw) : [], quakes = usgsRaw ? parseUsgs(usgsRaw) : [];
    const events: FeedEvent[] = [];
    for (const ev of near.slice(0, 8)) {
      const g = ev.geometryUrl ? await fetcher(ev.geometryUrl) : null;
      if (!g) continue;
      const layers = ev.type === "TC" ? parseTcGeometry(g, ev.to) : ev.type === "FL" ? parseFlGeometry(g) : parseEqGeometry(g);
      let also: FeedEvent["also"];
      if (ev.type === "TC") { const st = nhcFor(ev, storms); if (st?.advisory) also = { name: "Centro Nacional de Huracanes (NOAA)", url: st.advisory }; }
      else if (ev.type === "EQ") { const q = usgsFor(ev, quakes); if (q?.url) also = { name: "Servicio Geológico de EUA (USGS)", url: q.url }; }
      events.push({ ev, layers, ...(also ? { also } : {}) });
    }
    const feed: Feed = { at: now, ok: !!list, events, sources: { gdacs: !!list, nhc: !!nhcRaw, usgs: !!usgsRaw } };
    // Si GDACS no respondió, se reintenta en 1 minuto en lugar de 10.
    cache = list ? feed : { ...feed, at: now - FEED_TTL_MS + 60_000 };
    return feed;
  })().finally(() => { inflight = null; });
  return inflight;
}

/** Solo para pruebas. */
export const resetFeedCache = () => { cache = null; inflight = null; };

/**
 * Candidatos para una plantilla, respetando familias apagadas (interruptor global) y silenciadas (jugador).
 * `tracked`: acontecimientos con episodio abierto en la partida (se devuelven aunque ya no haya zona, para cerrarlos).
 */
export function candidatesFor(feed: Feed, templateId: string, opts: { off?: readonly Family[]; tracked?: readonly string[] } = {}): WorldCandidate[] {
  if (!exposureOf(templateId)) return [];
  const out: WorldCandidate[] = [];
  for (const fe of feed.events) {
    const id = `${fe.ev.type.toLowerCase()}${fe.ev.eventId}`;
    const c = candidateFor(templateId, fe.ev, fe.layers, { tracked: opts.tracked?.includes(id), ...(fe.also ? { also: fe.also } : {}) });
    if (!c || opts.off?.includes(c.family)) continue;
    out.push(c);
  }
  return out.sort((a, b) => b.rev - a.rev || b.observedAt - a.observedAt);
}
