/**
 * World Events · episodios congelados dentro de la partida (GrowthLog.world).
 *
 *  - Abrir: se congela lo que se sabía (fuente, estado, zonas por sede, hora real y día simulado del periodo abierto).
 *    Deduplicación por empresa + acontecimiento + revisión mayor. Un mismo acontecimiento abre a lo más UN episodio por
 *    empresa; una revisión mayor (naranja → roja) actualiza el episodio solo si aún no se decide. Máximo un episodio
 *    externo sin resolver a la vez.
 *  - Cerrar (pronósticos reales): se congela lo observado al terminar el fenómeno. Ese día llega el impacto simulado.
 *  - Ejercicio hipotético: el desenlace va guionado desde el inicio (solo modo prueba).
 *
 * Todo es puro y determinista: la partida se reproduce igual con el diario de jugadas.
 */
import { exposureOf } from "./exposure";
import { revOf, topZone } from "./match";
import { FAMILIES, FORECAST_WINDOW, MAX_EPISODES, OBSERVED_WINDOW, ZONES, zoneRank, type Family, type Kind, type SourceRef, type WorldEpisode, type Zone } from "./types";

export const WORLD_CASE_PREFIX = "w:";
export const caseIdOf = (ep: Pick<WorldEpisode, "id">) => `${WORLD_CASE_PREFIX}${ep.id}`;
export const isWorldCaseId = (id: string) => id.startsWith(WORLD_CASE_PREFIX) && id.length > 2 && id.length <= 40;
export const episodeIdOfCase = (caseId: string) => caseId.slice(WORLD_CASE_PREFIX.length);
/** Plazo máximo para registrar el cierre observado de un pronóstico real. */
export const END_LIMIT = 30;

/** Lo que entra por el diario para abrir un episodio (ya validado). */
export interface WorldOpenInput {
  src: WorldEpisode["src"]; ev: string; rev: number; family: Family; kind: Kind; mode: WorldEpisode["mode"];
  name: string; status: WorldEpisode["status"]; severity: string; source: SourceRef; also?: SourceRef; observedAt: number;
  sites: Record<string, Zone>; script?: WorldEpisode["script"];
}

// ─────────────────────────────────────────────────────────────── validación (diario y partida guardada)
const str = (x: unknown, max: number): x is string => typeof x === "string" && x.length > 0 && x.length <= max;
const url = (x: unknown): x is string => str(x, 300) && /^https:\/\//.test(x);
const src = (x: unknown): SourceRef | null => {
  const r = x as Record<string, unknown> | null;
  return r && typeof r === "object" && str(r.name, 80) && url(r.url) ? { name: r.name, url: r.url } : null;
};
export function cleanZones(x: unknown): Record<string, Zone> | null {
  if (!x || typeof x !== "object" || Array.isArray(x)) return null;
  const out: Record<string, Zone> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>).slice(0, 12)) if (/^[a-z_]{1,20}$/.test(k) && (ZONES as readonly string[]).includes(v as string)) out[k] = v as Zone;
  return out;
}

export function cleanWorldInput(x: unknown): WorldOpenInput | null {
  const r = x as Record<string, unknown> | null;
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  if (r.src !== "gdacs" && r.src !== "ejercicio") return null;
  if (!str(r.ev, 24) || !/^[a-z0-9]+$/.test(r.ev)) return null;
  if (typeof r.rev !== "number" || !Number.isInteger(r.rev) || r.rev < 0 || r.rev > 9) return null;
  if (!(FAMILIES as readonly string[]).includes(r.family as string) || (r.kind !== "ciclon" && r.kind !== "sismo")) return null;
  const mode = r.src === "ejercicio" ? "ejercicio" : "real";
  if (r.mode !== mode || (r.status !== "pronostico" && r.status !== "observado")) return null;
  const source = src(r.source);
  const sites = cleanZones(r.sites);
  if (!str(r.name, 80) || !source || !sites || typeof r.observedAt !== "number" || !Number.isFinite(r.observedAt)) return null;
  const out: WorldOpenInput = { src: r.src, ev: r.ev, rev: r.rev, family: r.family as Family, kind: r.kind, mode, name: r.name, status: r.status, severity: typeof r.severity === "string" ? r.severity.slice(0, 120) : "", source, observedAt: Math.round(r.observedAt), sites };
  const also = src(r.also);
  if (also) out.also = also;
  if (mode === "ejercicio") {
    const sc = r.script as Record<string, unknown> | undefined;
    const ss = cleanZones(sc?.sites);
    if (!sc || typeof sc.inDays !== "number" || !Number.isInteger(sc.inDays) || sc.inDays < 1 || sc.inDays > FORECAST_WINDOW || !ss) return null;
    out.script = { inDays: sc.inDays, sites: ss };
  }
  return out;
}

/** Episodios guardados en la partida: solo los bien formados, sin repetidos, en orden de día. */
export function sanitizeWorld(raw: unknown, templateId: string): WorldEpisode[] | undefined {
  if (!Array.isArray(raw) || !exposureOf(templateId)) return undefined;
  const out: WorldEpisode[] = [];
  let lastDay = -1;
  for (const x of raw.slice(-MAX_EPISODES)) {
    const r = x as Record<string, unknown>;
    const inp = cleanWorldInput(r);
    if (!inp || !str(r.id, 30) || typeof r.day !== "number" || !Number.isInteger(r.day) || r.day < lastDay || typeof r.at !== "number") continue;
    if (out.some((e) => e.id === r.id)) continue;
    const ep: WorldEpisode = { ...inp, id: r.id, day: r.day, at: Math.round(r.at), sites: onlySites(templateId, inp.sites) };
    const end = r.end as Record<string, unknown> | undefined;
    const es = cleanZones(end?.sites);
    if (end && es && typeof end.day === "number" && Number.isInteger(end.day) && end.day >= ep.day && typeof end.at === "number") ep.end = { day: end.day, at: Math.round(end.at), sites: onlySites(templateId, es) };
    if (ep.script) ep.script = { ...ep.script, sites: onlySites(templateId, ep.script.sites) };
    out.push(ep);
    lastDay = ep.day;
  }
  return out;
}
/** Solo sedes que existen en la exposición de la plantilla. */
function onlySites(templateId: string, z: Record<string, Zone>): Record<string, Zone> {
  const ids = new Set(exposureOf(templateId)?.sites.map((s) => s.id) ?? []);
  return Object.fromEntries(Object.entries(z).filter(([k]) => ids.has(k)));
}

// ─────────────────────────────────────────────────────────────── calendario del episodio
/** Sedes con lo que realmente pasó (null si todavía no se sabe o si nunca se confirmó). */
export function outcomeOf(ep: WorldEpisode): Record<string, Zone> | null {
  if (ep.status === "observado") return ep.sites;
  if (ep.script) return ep.script.sites;
  return ep.end && ep.end.day <= ep.day + END_LIMIT ? ep.end.sites : null;
}
/** Día simulado en que llega el impacto (null si no hay impacto que aplicar). */
export function impactDayOf(ep: WorldEpisode): number | null {
  if (ep.status === "observado") return ep.day;
  if (ep.script) return ep.day + ep.script.inDays;
  return ep.end && ep.end.day <= ep.day + END_LIMIT ? ep.end.day : null;
}
/** ¿Llegó a alguna sede con fuerza (naranja o roja)? */
export const hitOf = (ep: WorldEpisode): boolean => { const o = outcomeOf(ep); return !!o && zoneRank(topZone(o)) >= zoneRank("naranja"); };
/** Último día en que se puede decidir. */
export function deadlineOf(ep: WorldEpisode): number {
  const win = ep.day + (ep.status === "observado" ? OBSERVED_WINDOW : FORECAST_WINDOW);
  const imp = impactDayOf(ep);
  return ep.status === "pronostico" && imp !== null ? Math.min(win, imp) : win;
}
const decidedIn = (decisions: readonly { caseId: string }[], ep: WorldEpisode) => decisions.some((d) => d.caseId === caseIdOf(ep));
/** Episodio cuyo caso espera decisión hoy (el más antiguo). */
export function openEpisode(world: readonly WorldEpisode[] | undefined, decisions: readonly { caseId: string }[], day: number): WorldEpisode | null {
  return (world ?? []).find((ep) => day >= ep.day && day < deadlineOf(ep) && !decidedIn(decisions, ep)) ?? null;
}
/** ¿Sigue sin resolverse? (caso abierto, o pronóstico cuyo desenlace aún no se conoce dentro de su ventana). */
export function unresolved(ep: WorldEpisode, decisions: readonly { caseId: string }[], day: number): boolean {
  if (day < deadlineOf(ep) && !decidedIn(decisions, ep)) return true;
  const imp = impactDayOf(ep);
  if (imp !== null) return day < imp;
  return ep.status === "pronostico" && !ep.script && day < ep.day + FORECAST_WINDOW;
}

// ─────────────────────────────────────────────────────────────── abrir, actualizar y cerrar
export interface WorldLogLike { templateId: string; decisions: readonly { caseId: string; day: number }[]; world?: WorldEpisode[] }
export interface WorldPrefs { worldEvents?: boolean; worldMute?: readonly Family[] }

/** Abre (o actualiza antes de decidir) un episodio. Devuelve la lista nueva, o null si no procede. */
export function openWorld(log: WorldLogLike, inp: WorldOpenInput, day: number, at: number, prefs: WorldPrefs): WorldEpisode[] | null {
  const x = exposureOf(log.templateId);
  if (!x) return null;
  if (inp.mode === "real" && (prefs.worldEvents !== true || prefs.worldMute?.includes(inp.family))) return null;
  const sites = onlySites(log.templateId, inp.sites);
  const rev = revOf(sites);
  if (rev < 2) return null; // sin una sede en zona naranja o roja no hay caso
  const world = log.world ?? [];
  const lastDay = Math.max(log.decisions.at(-1)?.day ?? 0, world.at(-1)?.day ?? 0);
  const d = Math.max(Math.floor(day), lastDay);
  const same = world.find((e) => e.src === inp.src && e.ev === inp.ev);
  if (same) {
    if (rev <= same.rev || decidedIn(log.decisions, same) || d >= deadlineOf(same)) return null; // misma revisión o ya decidido: nada nuevo
    return world.map((e) => (e === same ? { ...e, rev, sites, status: inp.status, severity: inp.severity, observedAt: inp.observedAt, ...(inp.also ? { also: inp.also } : {}) } : e));
  }
  if (world.some((e) => unresolved(e, log.decisions, d))) return null; // máximo uno sin resolver
  const id = inp.src === "ejercicio" ? `x${inp.ev}` : inp.ev;
  const ep: WorldEpisode = { id, src: inp.src, ev: inp.ev, rev, family: inp.family, kind: inp.kind, mode: inp.mode, name: inp.name, status: inp.status, severity: inp.severity, source: inp.source, ...(inp.also ? { also: inp.also } : {}), observedAt: inp.observedAt, at: Math.round(at), day: d, sites, ...(inp.script ? { script: { inDays: inp.script.inDays, sites: onlySites(log.templateId, inp.script.sites) } } : {}) };
  return [...world, ep].slice(-MAX_EPISODES);
}

/** Cierra un pronóstico real con lo observado. Una sola vez, dentro del plazo. */
export function endWorld(log: WorldLogLike, id: string, observed: Record<string, Zone>, day: number, at: number): WorldEpisode[] | null {
  const world = log.world ?? [];
  const ep = world.find((e) => e.id === id);
  if (!ep || ep.status !== "pronostico" || ep.script || ep.end) return null;
  const d = Math.floor(day);
  if (d < ep.day || d > ep.day + END_LIMIT) return null;
  return world.map((e) => (e === ep ? { ...e, end: { day: d, at: Math.round(at), sites: onlySites(log.templateId, observed) } } : e));
}

// ─────────────────────────────────────────────────────────────── línea de tiempo para reconstruir
export interface Step<D> { day: number; ord: number; i: number; d?: D; ep?: WorldEpisode }
/**
 * Decisiones e impactos externos en orden. Un acontecimiento ya observado (sismo) llega antes de las decisiones de ese
 * día; el desenlace de un pronóstico llega después (si se decidió ese mismo día, la preparación ya cuenta).
 */
export function timeline<D extends { day: number }>(decisions: readonly D[], world: readonly WorldEpisode[] | undefined, target: number): Step<D>[] {
  const out: Step<D>[] = decisions.map((d, i) => ({ day: d.day, ord: 1, i, d }));
  (world ?? []).forEach((ep, i) => { const day = impactDayOf(ep); if (day !== null && hitOf(ep)) out.push({ day, ord: ep.status === "observado" ? 0 : 2, i, ep }); });
  return out.filter((x) => x.day <= target).sort((a, b) => a.day - b.day || a.ord - b.ord || a.i - b.i);
}
/** Firma del registro externo (para cachés). */
export const worldSig = (world: readonly WorldEpisode[] | undefined) => (world ?? []).map((e) => `${e.id}.${e.rev}@${e.day}${e.end ? `>${e.end.day}` : ""}`).join(",");

/** Sedes expuestas (naranja o roja) en lo que se sabía al decidir. */
export const exposedSites = (z: Record<string, Zone>): string[] => Object.entries(z).filter(([, v]) => zoneRank(v) >= zoneRank("naranja")).map(([k]) => k);

/** Impacto externo aplicado en la reconstrucción (se muestra aparte de las decisiones propias). */
export interface ExternalHit { id: string; day: number; text: string; mode: WorldEpisode["mode"]; commands: string[] }
/** Lo que la interfaz necesita para etiquetar el caso externo. */
export interface WorldView { assets: string[]; id: string; mode: WorldEpisode["mode"]; label: string; name: string; status: WorldEpisode["status"]; source: SourceRef; also?: SourceRef; deadline: number; daysLeft: number; family: Family }
export function worldViewOf(ep: WorldEpisode, day: number, templateId: string): WorldView {
  const deadline = deadlineOf(ep);
  return {
    id: ep.id, mode: ep.mode, name: ep.name, status: ep.status, source: ep.source, ...(ep.also ? { also: ep.also } : {}), family: ep.family, deadline, daysLeft: Math.max(0, deadline - day),
    assets: (exposureOf(templateId)?.sites ?? []).filter((x) => zoneRank(ep.sites[x.id] ?? "ninguna") >= zoneRank("naranja")).map((x) => `${x.label} (zona ${ep.sites[x.id]})`),
    label: ep.mode === "ejercicio" ? "Ejercicio hipotético · No es un acontecimiento real" : "Evento real · Simulación de impacto en tu empresa",
  };
}
/** Día de la última decisión del ritmo normal (los casos externos no consumen el turno de casos propios). */
export const regularLastDay = (decisions: readonly { caseId: string; day: number }[]): number => {
  for (let i = decisions.length - 1; i >= 0; i--) if (!decisions[i].caseId.startsWith(WORLD_CASE_PREFIX)) return decisions[i].day;
  return -Infinity;
};
