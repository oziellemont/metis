/**
 * World Events · fuentes económicas, comerciales y de noticias oficiales (gratuitas, sin token).
 *
 *  1. DOF · indicadores (SIDOF, Secretaría de Gobernación): el Diario Oficial publica cada día hábil lo que informa el
 *     Banco de México: tipo de cambio FIX (código 158) y TIIE de fondeo (175). Se compara contra 20 publicaciones atrás.
 *  2. DOF · notas del día: decretos, acuerdos y avisos. Se clasifican por título y dependencia (comercio exterior,
 *     energía y combustibles, impuestos, trabajo, otros). Las medidas arancelarias se leen completas para sacar
 *     fracciones (HS), arancel y fecha de vigencia.
 *  3. Federal Register (gobierno de EE. UU.): medidas comerciales que mencionan a México (antidumping, aranceles).
 *  4. Opcional: GDELT (radar de noticias del mundo). Límite de una consulta cada 5 s: se consulta como mucho una vez
 *     por hora y solo si WORLD_GDELT=1. Las noticias del radar son SIEMPRE informativas: un medio no prueba vigencia.
 *
 * Todo lo que llega aquí pasa por las reglas de macro.ts: sin exposición no hay caso. Lo que no tiene regla aprobada
 * se muestra como «radar» (informativo, sin efecto en la empresa).
 */
import { getJson } from "./connectors";
import { exposureOf } from "./exposure";
import { FX_MIN, LOOKBACK_PUBS, RATE_MIN, US_MEASURES, US_RECENT_DAYS, factsExposed, fxRev, rateRev, tradeMatch, usExportLine } from "./macro";
import type { Facts, Family, WorldCandidate } from "./types";

export const SIDOF = "https://sidof.segob.gob.mx/dof/sidof";
export const DOF_SERIES = (cod: number, from: string, to: string) => `${SIDOF}/indicadores/${cod}/${from}/${to}`;
export const DOF_NOTES = (day: string) => `${SIDOF}/notas/${day}`;
export const DOF_NOTE = (cod: number) => `${SIDOF}/notas/nota/${cod}`;
/** Enlace público a la nota en el DOF. */
export const DOF_LINK = (cod: number) => `https://www.dof.gob.mx/nota_detalle.php?codigo=${cod}`;
export const FR_URL = (since: string) =>
  `https://www.federalregister.gov/api/v1/documents.json?per_page=40&order=newest&conditions%5Bterm%5D=Mexico+%28tariff+OR+antidumping+OR+duty%29&conditions%5Bpublication_date%5D%5Bgte%5D=${since}&fields%5B%5D=title&fields%5B%5D=html_url&fields%5B%5D=publication_date&fields%5B%5D=type&fields%5B%5D=effective_on&fields%5B%5D=document_number`;
export const GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc?query=(bloqueo%20OR%20huelga%20OR%20apag%C3%B3n%20OR%20arancel%20OR%20aduana)%20sourcecountry:mexico%20sourcelang:spanish&mode=artlist&format=json&maxrecords=25&timespan=2d&sort=datedesc";
export const FIX = 158;
export const FONDEO = 175;

// ───────────────────────────────────────────────────────────── fechas
/** «dd-mm-aaaa» (formato del DOF) → «aaaa-mm-dd». */
export const isoOf = (dmy: string) => { const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };
/** Fecha (ms) → «dd-mm-aaaa» en hora de la Ciudad de México. */
export const dmyOf = (ms: number) => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Mexico_City", day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(new Date(ms));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}-${g("month")}-${g("year")}`;
};

// ───────────────────────────────────────────────────────────── indicadores
export interface Point { date: string; value: number }
/** Serie del DOF (ListaIndicadores) ordenada por fecha; ignora renglones mal formados y repetidos. */
export function parseDofSeries(json: unknown, cod: number): Point[] {
  const list = (json as { ListaIndicadores?: unknown[] })?.ListaIndicadores;
  if (!Array.isArray(list)) return [];
  const out = new Map<string, number>();
  for (const r of list as Record<string, unknown>[]) {
    if (r?.codTipoIndicador !== cod || typeof r.fecha !== "string" || typeof r.valor !== "string") continue;
    const date = isoOf(r.fecha), value = Number(r.valor.replace("%", "").trim());
    if (date && Number.isFinite(value) && value > 0) out.set(date, value);
  }
  return [...out.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}

export interface Move { kind: "tipo_cambio" | "tasa"; ev: string; rev: number; facts: Facts; name: string; severity: string }
/** Movimiento material del FIX (≥ 3 %) o de la TIIE de fondeo (≥ ¼ punto) contra 20 publicaciones atrás. */
export function moveOf(kind: "tipo_cambio" | "tasa", pts: readonly Point[]): Move | null {
  if (pts.length < LOOKBACK_PUBS + 1) return null;
  const last = pts[pts.length - 1], prev = pts[pts.length - 1 - LOOKBACK_PUBS];
  if (kind === "tipo_cambio") {
    const ch = last.value / prev.value - 1;
    if (Math.abs(ch) < FX_MIN) return null;
    const rev = fxRev(ch);
    // Un mismo movimiento conserva su id mientras siga en la misma dirección y mes; una revisión mayor lo actualiza.
    return { kind, ev: `fx${ch > 0 ? "u" : "d"}${last.date.slice(0, 7).replace("-", "")}`, rev, facts: { t: "fx", from: prev.value, to: last.value, since: prev.date, until: last.date },
      name: `${ch > 0 ? "El dólar sube" : "El peso se fortalece"} ${(Math.abs(ch) * 100).toFixed(1)} % en cuatro semanas`, severity: `FIX ${prev.value.toFixed(4)} → ${last.value.toFixed(4)} pesos por dólar` };
  }
  const d = Math.round((last.value - prev.value) * 100) / 100;
  if (Math.abs(d) < RATE_MIN - 1e-9) return null;
  return { kind, ev: `ta${d > 0 ? "u" : "d"}${last.date.slice(0, 7).replace("-", "")}`, rev: rateRev(d), facts: { t: "tasa", from: prev.value, to: last.value, since: prev.date, until: last.date },
    name: `${d > 0 ? "Sube" : "Baja"} la tasa de interés ${Math.abs(d).toFixed(2)} puntos`, severity: `TIIE de fondeo ${prev.value.toFixed(2)} % → ${last.value.toFixed(2)} %` };
}

// ───────────────────────────────────────────────────────────── notas del DOF
export interface DofNote { cod: number; date: string; title: string; org: string }
export function parseDofNotes(json: unknown): DofNote[] {
  const j = json as Record<string, unknown> | null;
  if (!j || typeof j !== "object") return [];
  const out: DofNote[] = [];
  for (const k of ["NotasMatutinas", "NotasVespertinas", "NotasExtraordinarias"]) {
    const list = j[k];
    if (!Array.isArray(list)) continue;
    for (const n of list as Record<string, unknown>[]) {
      if (typeof n?.codNota !== "number" || typeof n.titulo !== "string" || !n.titulo.trim() || typeof n.codOrgaDos !== "string") continue;
      out.push({ cod: n.codNota, date: isoOf(String(n.fecha ?? "")), title: n.titulo.trim().replace(/\s+/g, " "), org: n.codOrgaDos.trim() });
    }
  }
  return out;
}

export type NewsCat = "comercio" | "energia" | "impuestos" | "trabajo" | "seguridad" | "infraestructura" | "economia";
export const NEWS_FAMILY: Readonly<Record<NewsCat, Family>> = Object.freeze({ comercio: "comercio", energia: "gobierno", impuestos: "gobierno", trabajo: "gobierno", seguridad: "noticias", infraestructura: "noticias", economia: "macro" });
export const NEWS_LABEL: Readonly<Record<NewsCat, string>> = Object.freeze({ comercio: "Comercio exterior", energia: "Energía y combustibles", impuestos: "Impuestos", trabajo: "Trabajo y salarios", seguridad: "Seguridad y conflictos", infraestructura: "Infraestructura y logística", economia: "Economía" });

const RX: [NewsCat, RegExp][] = [
  ["comercio", /arancel|fracciones arancelarias|impuestos generales de importaci|comercio exterior|cupo|antidumping|cuota compensatoria|pr[aá]cticas desleales|importaci[oó]n|exportaci[oó]n|aduan|tratado de libre comercio|t-mec|tariff|duty|countervailing|less[- ]than[- ]fair|section 232|section 301/i],
  ["energia", /gasolina|di[eé]sel|combustible|ieps .*combustible|tarifa.*el[eé]ctric|energ[ií]a el[eé]ctrica|comisi[oó]n nacional de energ|cfe\b|gas natural|electricidad/i],
  ["impuestos", /miscel[aá]nea fiscal|impuesto|isr\b|iva\b|ieps|est[ií]mulo fiscal|c[oó]digo fiscal|69-b/i],
  ["trabajo", /salario m[ií]nimo|salarios m[ií]nimos|jornada|ley federal del trabajo|reparto de utilidades|seguro social.*cuota|contrato ley/i],
  ["seguridad", /bloqueo|huelga|paro nacional|conflicto|guerra|ataque|sanci[oó]n|emergencia/i],
  ["infraestructura", /puerto|portuari|aduana|carretera|ferrocarril|aeropuerto|recinto/i],
];
/** Categoría de una publicación por título y dependencia. null = no interesa a las empresas (nombramientos, convenios…). */
export function classify(title: string, org = ""): NewsCat | null {
  if (/^aviso ref:|^\s*$/i.test(title) || /convocatoria|convenio (espec[ií]fico|de coordinaci)|fe de erratas|manual (general )?de organizaci|estatuto org[aá]nico|c[oó]digo de conducta|sentencia|acuerdo (general )?del (pleno|consejo general)|designa|d[ií]as inh[aá]biles|calendario/i.test(title)) return null;
  // Lo que el DOF publica a diario del Banco de México (FIX, TIIE) ya entra como indicador, no como noticia.
  if (/BANCO DE MEXICO/i.test(org) && /tipo de cambio|tasas? de inter[eé]s|equivalencia/i.test(title)) return null;
  for (const [cat, rx] of RX) if (rx.test(title)) return cat;
  if (/SECRETARIA DE ECONOMIA/i.test(org) && /decreto|acuerdo|resoluci[oó]n|norma oficial/i.test(title)) return "comercio";
  return null;
}

// ───────────────────────────────────────────────────────────── medidas arancelarias (lectura de la nota completa)
const stripHtml = (html: string) => html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ").replace(/[ \t\r]+/g, " ").replace(/\n\s*\n+/g, "\n");
export interface TariffRow { hs: string; rate: number }
export interface TariffNote { effective?: string; rows: TariffRow[] }
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
/**
 * Lee un decreto de la Tarifa (TIGIE): renglones «7214.20.01 · descripción · Kg · 35 · Ex.» y la fecha de vigencia
 * («entrará en vigor el primero de enero de 2026», «…el 15 de enero de 2026», «…al día siguiente de su publicación»).
 */
export function parseTariffNote(html: string, published: string): TariffNote {
  const t = stripHtml(html);
  const rows: TariffRow[] = [];
  const rx = /(\d{4})\.\d{2}\.\d{2}\n[^\n]{1,400}\n(?:Kg|Pza|L|M2|M3|Par|Kit|Jgo|Cbza|Lote|Kwh|Gr|Ton)\n(\d{1,3}|Ex\.)\n/g;
  for (let m = rx.exec(t); m; m = rx.exec(t)) rows.push({ hs: m[1], rate: m[2] === "Ex." ? 0 : Number(m[2]) / 100 });
  let effective: string | undefined;
  const v = /entrar[aá] en vigor (?:el |a partir del )?(primero|\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (\d{4})/i.exec(t);
  if (v) { const d = v[1].toLowerCase() === "primero" ? 1 : Number(v[1]); effective = `${v[3]}-${String(MONTHS.indexOf(v[2].toLowerCase()) + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }
  else if (/entrar[aá] en vigor (?:al|el) d[ií]a (?:h[aá]bil )?siguiente/i.test(t) && published) { const d = new Date(Date.parse(published) + 86_400_000); effective = d.toISOString().slice(0, 10); }
  return { ...(effective ? { effective } : {}), rows };
}
/** Arancel nuevo para un grupo de fracciones (el más común entre sus renglones). null si no aparece. */
export function rateFor(rows: readonly TariffRow[], chapters: readonly string[]): number | null {
  const hit = rows.filter((r) => chapters.includes(r.hs));
  if (!hit.length) return null;
  const count = new Map<number, number>();
  for (const r of hit) count.set(r.rate, (count.get(r.rate) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// ───────────────────────────────────────────────────────────── Federal Register
export interface FrDoc { id: string; date: string; title: string; url: string; type: string; effective?: string }
export function parseFr(json: unknown): FrDoc[] {
  const res = (json as { results?: unknown[] })?.results;
  if (!Array.isArray(res)) return [];
  return (res as Record<string, unknown>[]).filter((r) => typeof r?.document_number === "string" && typeof r.title === "string" && typeof r.html_url === "string" && /^https:\/\//.test(r.html_url as string))
    .map((r) => ({ id: r.document_number as string, date: String(r.publication_date ?? ""), title: (r.title as string).replace(/\s+/g, " "), url: r.html_url as string, type: String(r.type ?? ""), ...(typeof r.effective_on === "string" ? { effective: r.effective_on } : {}) }))
    .filter((d) => /mexico/i.test(d.title));
}

// ───────────────────────────────────────────────────────────── GDELT (opcional)
export interface GdeltArt { url: string; title: string; domain: string; seen: string }
export function parseGdelt(json: unknown): GdeltArt[] {
  const arts = (json as { articles?: unknown[] })?.articles;
  if (!Array.isArray(arts)) return [];
  return (arts as Record<string, unknown>[]).filter((a) => typeof a?.url === "string" && /^https:\/\//.test(a.url as string) && typeof a.title === "string")
    .map((a) => ({ url: a.url as string, title: (a.title as string).replace(/\s+/g, " ").slice(0, 200), domain: String(a.domain ?? ""), seen: String(a.seendate ?? "") }));
}

// ───────────────────────────────────────────────────────────── tablero económico (con caché)
export interface RadarItem { id: string; cat: NewsCat; family: Family; title: string; org: string; date: string; source: { name: string; url: string } }
export interface TariffMeasure { id: string; cod: number; title: string; date: string; effective?: string; rows: TariffRow[]; url: string }
export interface EconFeed { at: number; ok: boolean; fx: Point[]; rate: Point[]; moves: Move[]; tariffs: TariffMeasure[]; radar: RadarItem[]; sources: { dof: boolean; fr: boolean; gdelt: boolean } }

export const ECON_TTL_MS = 60 * 60_000;
/** Días de notas del DOF que se revisan (los hábiles caen solos: sin notas, lista vacía). */
export const DOF_DAYS = 7;
let cache: EconFeed | null = null;
let inflight: Promise<EconFeed> | null = null;
let gdeltAt = 0;

export async function loadEconFeed(now = Date.now(), fetcher: (url: string) => Promise<unknown | null> = (u) => getJson(u, { timeoutMs: 8000 }), opts: { gdelt?: boolean } = {}): Promise<EconFeed> {
  if (cache && now - cache.at < ECON_TTL_MS) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const from = dmyOf(now - 75 * 86_400_000), to = dmyOf(now);
    const [fxRaw, rateRaw, frRaw] = await Promise.all([fetcher(DOF_SERIES(FIX, from, to)), fetcher(DOF_SERIES(FONDEO, from, to)), fetcher(FR_URL(new Date(now - 30 * 86_400_000).toISOString().slice(0, 10)))]);
    const fx = fxRaw ? parseDofSeries(fxRaw, FIX) : [], rate = rateRaw ? parseDofSeries(rateRaw, FONDEO) : [];
    const moves = [moveOf("tipo_cambio", fx), moveOf("tasa", rate)].filter((m): m is Move => !!m);
    const notes: DofNote[] = [];
    for (let i = 0; i < DOF_DAYS; i++) { const raw = await fetcher(DOF_NOTES(dmyOf(now - i * 86_400_000))); if (raw) notes.push(...parseDofNotes(raw)); }
    const radar: RadarItem[] = [];
    const tariffs: TariffMeasure[] = [];
    for (const n of notes) {
      const cat = classify(n.title, n.org);
      if (!cat) continue;
      radar.push({ id: `dof${n.cod}`, cat, family: NEWS_FAMILY[cat], title: n.title, org: n.org, date: n.date, source: { name: "Diario Oficial de la Federación", url: DOF_LINK(n.cod) } });
      if (cat === "comercio" && /fracciones arancelarias|tarifa de la ley de los impuestos generales/i.test(n.title) && tariffs.length < 3) {
        const raw = (await fetcher(DOF_NOTE(n.cod))) as { Nota?: { cadenaContenido?: string } } | null;
        const html = raw?.Nota?.cadenaContenido;
        if (typeof html === "string") { const p = parseTariffNote(html, n.date); tariffs.push({ id: `ar${n.cod}`, cod: n.cod, title: n.title, date: n.date, ...(p.effective ? { effective: p.effective } : {}), rows: p.rows, url: DOF_LINK(n.cod) }); }
      }
    }
    const fr = frRaw ? parseFr(frRaw) : [];
    for (const d of fr.slice(0, 10)) radar.push({ id: `fr${d.id.replace(/\D/g, "")}`, cat: "comercio", family: "comercio", title: d.title, org: "Gobierno de EE. UU. (Federal Register)", date: d.date, source: { name: "Federal Register (EE. UU.)", url: d.url } });
    let gdelt = false;
    if (opts.gdelt && now - gdeltAt >= ECON_TTL_MS) {
      gdeltAt = now;
      const g = await fetcher(GDELT_URL);
      if (g) {
        gdelt = true;
        for (const a of parseGdelt(g).slice(0, 10)) { const cat = classify(a.title) ?? "seguridad"; radar.push({ id: `gd${hash(a.url)}`, cat, family: NEWS_FAMILY[cat], title: a.title, org: a.domain, date: a.seen.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"), source: { name: `Medio: ${a.domain || "GDELT"}`, url: a.url } }); }
      }
    }
    const feed: EconFeed = { at: now, ok: !!fxRaw || !!rateRaw, fx, rate, moves, tariffs, radar: radar.slice(0, 40), sources: { dof: !!fxRaw || notes.length > 0, fr: !!frRaw, gdelt } };
    cache = feed.ok ? feed : { ...feed, at: now - ECON_TTL_MS + 5 * 60_000 };
    return feed;
  })().finally(() => { inflight = null; });
  return inflight;
}
export const resetEconCache = () => { cache = null; inflight = null; gdeltAt = 0; };
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h.toString(36); };

// ─────────────────────────────────────────────────────────────── candidatos por plantilla
/**
 * Arancel vigente verificado por fracción (4 dígitos), para saber «de cuánto a cuánto» cambia con un decreto nuevo (el
 * decreto solo publica la tasa nueva). Fuente: DOF 29-12-2025, nota 5777376 (vigente desde el 1-1-2026), tasa más común
 * de las fracciones de ese capítulo. Sin tasa verificada no hay caso: la medida queda en el radar.
 */
export const TARIFF_BASE_VERSION = 1;
export const TARIFF_BASE: Readonly<Record<string, { rate: number; source: string }>> = Object.freeze({
  "7213": { rate: 0.35, source: "DOF 29-12-2025 (5777376)" },
  "7214": { rate: 0.35, source: "DOF 29-12-2025 (5777376)" },
});
/** Arancel verificado de un grupo de fracciones (null si falta alguna). */
export function baseRateFor(chapters: readonly string[]): number | null {
  const r = chapters.map((c) => TARIFF_BASE[c]?.rate);
  if (!r.length || r.some((x) => x === undefined)) return null;
  const count = new Map<number, number>();
  for (const x of r as number[]) count.set(x, (count.get(x) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
const tariffRev = (d: number) => (Math.abs(d) >= 0.15 ? 3 : Math.abs(d) >= 0.05 ? 2 : 1);

/** Candidatos económicos y comerciales para una plantilla (solo los que tocan su exposición). */
export function econCandidatesFor(feed: EconFeed, templateId: string, opts: { off?: readonly Family[]; now?: number } = {}): WorldCandidate[] {
  const x = exposureOf(templateId);
  if (!x) return [];
  const now = opts.now ?? feed.at;
  const out: WorldCandidate[] = [];
  const base = { observed: {}, sites: {}, ended: false, status: "observado" as const };
  if (!opts.off?.includes("macro")) for (const m of feed.moves) {
    if (!factsExposed(templateId, m.kind, m.facts, now)) continue;
    out.push({ ...base, src: "dof", ev: m.ev, rev: m.rev, family: "macro", kind: m.kind, name: m.name, severity: m.severity, facts: m.facts,
      source: { name: "Banco de México vía Diario Oficial de la Federación", url: "https://www.dof.gob.mx/indicadores.php" },
      observedAt: Date.parse(`${m.facts.until}T12:00:00Z`) || now, urgency: m.rev >= 3 ? "urgente" : "importante" });
  }
  if (!opts.off?.includes("comercio")) for (const t of feed.tariffs) {
    if (!t.effective || Date.parse(t.effective) > now) continue; // anunciada, todavía no vigente: radar
    const groups = [...(x.products ?? []).filter((p) => p.market === "México").map((p) => p.hs), ...x.trade.filter((l) => l.destination === "México" && l.importerOfRecord && l.hs).map((l) => [l.hs as string])];
    for (const hs of groups) {
      const to = rateFor(t.rows, hs), from = baseRateFor(hs);
      if (to === null || from === null || Math.abs(to - from) < 0.005) continue;
      const m = tradeMatch(templateId, hs);
      if (!m) continue;
      const facts: Facts = { t: "arancel", from, to, since: t.date, until: t.effective, effective: t.effective, rule: m.rule, hs: hs.filter((h) => t.rows.some((r) => r.hs === h)) };
      if (!factsExposed(templateId, "arancel", facts, now)) continue;
      out.push({ ...base, src: "dof", ev: t.id, rev: tariffRev(to - from), family: "comercio", kind: "arancel", name: `${to > from ? "Sube" : "Baja"} el arancel de importación: ${m.what.toLowerCase()}`.slice(0, 80),
        severity: `Arancel ${Math.round(from * 100)} % → ${Math.round(to * 100)} % (fracciones ${facts.hs!.join(", ")})`, facts, source: { name: "Diario Oficial de la Federación", url: t.url },
        observedAt: Date.parse(`${t.effective}T12:00:00Z`) || now, urgency: "importante" });
      break; // una medida = un caso por empresa
    }
  }
  // Medidas de EE. UU. verificadas en el Federal Register: solo el cambio de tasa vigente más reciente, y solo si entró
  // en vigor hace menos de US_RECENT_DAYS. Lo que ya regía antes es el entorno de la partida, no un acontecimiento nuevo.
  const lastUs = [...US_MEASURES].filter((m) => m.from !== m.to && Date.parse(`${m.effective}T12:00:00Z`) <= now).at(-1);
  if (!opts.off?.includes("comercio") && lastUs) for (const m of [lastUs]) {
    const eff = Date.parse(`${m.effective}T12:00:00Z`);
    if (now - eff > US_RECENT_DAYS * 86_400_000) continue;
    const line = usExportLine(templateId, m.hs);
    if (!line) continue;
    const facts: Facts = { t: "arancel", from: m.from, to: m.to, since: m.signed, until: m.effective, effective: m.effective, rule: m.rule, hs: m.hs.filter((h) => exposureOf(templateId)?.profile.exportContracts?.hs.includes(h) || x.profile.lines.some((l) => l.flow === "exportacion" && l.hs.includes(h))) };
    if (!facts.hs!.length || !factsExposed(templateId, "arancel", facts, now)) continue;
    out.push({ ...base, src: "fr", ev: m.id, rev: tariffRev(m.to - m.from), family: "comercio", kind: "arancel", name: m.title.slice(0, 80),
      severity: `Arancel de EE. UU. ${Math.round(m.from * 100)} % → ${Math.round(m.to * 100)} % (${m.doc})`, facts, source: { name: "Federal Register (Gobierno de EE. UU.)", url: m.url },
      observedAt: eff, urgency: "importante" });
  }
  return out.sort((a, b) => b.rev - a.rev || b.observedAt - a.observedAt);
}

/** Radar informativo (sin efecto en la empresa) filtrado por familias apagadas. */
export const radarFor = (feed: EconFeed, off: readonly Family[] = []) => feed.radar.filter((r) => !off.includes(r.family));
