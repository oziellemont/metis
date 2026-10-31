/**
 * mêtis CEO · motor del simulador. Lógica pura (sin React ni navegador) para usarla
 * igual en la app, en el cron que agenda correos/WhatsApp y en las pruebas.
 */
import type { Axis, CareerRun, CeoState, CrisisRating, CompanyPack, Decision, Entry, Item, KpiKey, Kpis, Option, Settings, Written } from "./types";
import { COMPANIES, FIRST_COMPANY, companyById } from "./companies";
import { DILEMMAS, dilemmaById, type Dilemma } from "./dilemmas";
import { changeEffect, simulate, type ChangeSim } from "./change";
import { sanitizeDiagnostic, sanitizeProfile } from "./profile";
import { CONTINUOUS_RULES_VERSION, LEGACY_RULES_VERSION, RULES_VERSION, isRulesVersion, ruleSet, tierRules } from "./rules";
import { newCompanyProfile, renameProfile, sanitizeCompanyProfile, type NewCompanyInput } from "./career/identity";
import { isDisplayCurrency } from "./career/money";
import { TAXONOMY_VERSION } from "./career/taxonomy";
import { brandDeep, brandPack, brandText, type Brand } from "./career/template";
import { industryLongFor } from "./career/lexicon";
import { ASSUMPTIONS_VERSION, sanitizeBusiness } from "./business/model";
import { sanitizeEpisodes } from "./episodes/engine";
import { EPISODES, SEASON_EPISODES, openEpisode as openEpisodeRaw } from "./episodes/catalog";
import type { EpisodeRun, EpisodeSpec } from "./episodes/contracts";
import { activeMs, extendDeadline, onVacation, runSpans, sanitizeCadence, shiftArrival, shiftDaysOf, spansOf, type Span } from "./pausetime";

export { LEGACY_RULES_VERSION, RULES_VERSION, ruleSet };

export const H = 3_600_000;
export const DAY = 24 * H;
export const DEFAULT_DEADLINE_H = ruleSet(RULES_VERSION).defaultDeadlineH;

export const KPI_KEYS: KpiKey[] = ["caja", "margen", "equipo", "clientes", "consejo"];
/** Valores de la primera empresa (compatibilidad). Cada empresa trae los suyos en `kpiStart`. */
export const KPI_START: Kpis = { caja: 58, margen: 52, equipo: 55, clientes: 62, consejo: 60 };
export const KPI_LABEL: Record<KpiKey, string> = { caja: "Caja", margen: "Margen", equipo: "Equipo", clientes: "Clientes", consejo: "Consejo" };

// ───────────────────────────────────────────── empresa actual y exigencia
/** Marca del jugador (carrera continua) o null si juega las temporadas de siempre. */
export const brandOf = (s: Pick<CeoState, "companyProfile">): Brand | null => {
  const p = s.companyProfile;
  return p ? { name: p.displayName, short: p.shortName, city: p.exposure?.baseCity, ...(p.specialty ? { specialty: p.specialty } : {}) } : null;
};
/** Paquete de la empresa actual. Con identidad propia, sus textos llevan el nombre que eligió el jugador. */
export const packOf = (s: Pick<CeoState, "company"> & Partial<Pick<CeoState, "companyProfile">>): CompanyPack => brandPack(companyById(s.company), brandOf(s));
/** Episodio con el nombre de la empresa del jugador (copia; ids, términos y reglas intactos). */
export function brandedEpisode(spec: EpisodeSpec, s: Pick<CeoState, "companyProfile">): EpisodeSpec {
  return brandedEpisodeFor(spec, brandOf(s));
}
/** Igual, con la marca directa (rutas del servidor: el cliente manda nombre y especialidad). */
export function brandedEpisodeFor(spec: EpisodeSpec, b: Brand | null): EpisodeSpec {
  if (!b) return spec;
  const pk = companyById(spec.company);
  return { ...brandDeep(spec, (t) => brandText(t, pk, b)), id: spec.id, company: spec.company, rules: spec.rules, industry: industryLongFor(spec.company, b.specialty) ?? spec.industry };
}
/** Cierre de un caso (guardado con los textos originales) con el nombre y la especialidad del jugador. */
export function brandedOutcome<T>(o: T, company: string, s: Pick<CeoState, "companyProfile">): T {
  const b = brandOf(s);
  if (!b) return o;
  const pk = companyById(company);
  return brandDeep(o, (t) => brandText(t, pk, b));
}
/** ¿Juega la carrera continua (una empresa persistente con identidad propia)? */
export const isContinuous = (s: Pick<CeoState, "careerMode" | "companyProfile">): boolean => s.careerMode === "continua" && !!s.companyProfile;

/**
 * Exigencia por nivel (tier). Cada empresa que apruebas sube un nivel; el modo Legendario suma 1 más.
 * Calibrado con simulaciones: en el nivel 0 un jugador cuidadoso aprueba con margen y uno al azar casi nunca.
 *  - los golpes pegan más fuerte y las buenas noticias rinden menos,
 *  - los plazos se acortan,
 *  - la línea de aprobación de cada rubro sube (el consejo exige más).
 */
export function rulesOf(tier: number, version: number = RULES_VERSION) {
  return tierRules(tier, version);
}
/** Versión de reglas de una temporada guardada (sin versión = legacy, nunca la actual). */
export const rulesVersionOf = (s: Pick<CeoState, "rulesVersion">): number => (isRulesVersion(s.rulesVersion) ? s.rulesVersion : LEGACY_RULES_VERSION);
/** Exigencia de la temporada en curso, con las reglas con que empezó. */
export const rulesFor = (s: Pick<CeoState, "tier" | "rulesVersion">) => tierRules(s.tier, rulesVersionOf(s));
/**
 * Versión con que se valúa el XP que viaja entre empresas (lecciones y dilemas): la de la primera
 * temporada de la carrera. Así subir la versión no cambia en retrospectiva el XP ya ganado.
 */
export const careerRulesVersionOf = (s: Pick<CeoState, "career" | "rulesVersion">): number => {
  const first = (s.career ?? [])[0];
  return first ? (isRulesVersion(first.rulesVersion) ? first.rulesVersion : LEGACY_RULES_VERSION) : rulesVersionOf(s);
};
/** Tabla de XP de la temporada en curso. */
export const xpTableOf = (s: Pick<CeoState, "rulesVersion">) => ruleSet(rulesVersionOf(s)).xp;
export function scaled(eff: Partial<Kpis> | undefined, tier: number, version: number = LEGACY_RULES_VERSION): Partial<Kpis> {
  if (!eff) return {};
  const r = tierRules(tier, version);
  const out: Partial<Kpis> = {};
  for (const k of Object.keys(eff) as KpiKey[]) {
    const v = eff[k] ?? 0;
    out[k] = v < 0 ? Math.round(v * r.hit) : Math.round(v * r.gain);
  }
  return out;
}
const deadlineOf = (s: CeoState, it: Item) => {
  const R = ruleSet(rulesVersionOf(s));
  return Math.max(R.minDeadlineH, Math.round((it.deadlineH ?? R.defaultDeadlineH) * rulesFor(s).deadline));
};

export const DEFAULT_SETTINGS: Settings = {
  tz: "America/Monterrey", windowStart: 8, windowEnd: 19, email: "", phone: "",
  notifyEmail: true, notifyWhatsapp: false, intensivo: false,
};

export function newState(): CeoState {
  return { v: 2, name: "", alias: "", company: FIRST_COMPANY, tier: 0, rulesVersion: RULES_VERSION, career: [], startedAt: null, settings: { ...DEFAULT_SETTINGS }, decisions: {}, pinned: {}, read: {}, lessons: {}, lastActiveAt: 0, clockOffset: 0, savedAt: 0 };
}

/** Alias público a partir del nombre («Oziel Leal» → «Oziel L.»). Forma parte de la semilla de llegadas. */
export const aliasOf = (name: string) => {
  const p = name.trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0] || "CEO";
};

/** Lee un estado guardado (v1 o v2) sin perder avance: v1 = Botanas Cumbre, nivel 0. */
export function migrate(raw: unknown): CeoState {
  const base = newState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<CeoState> & { v?: number };
  const out: CeoState = { ...base, ...r, v: 2, settings: { ...base.settings, ...(r.settings ?? {}) } } as CeoState;
  if (!r.v || r.v < 2 || !r.company) { out.company = FIRST_COMPANY; out.tier = r.tier ?? 0; out.career = r.career ?? []; }
  if (!COMPANIES.some((c) => c.id === out.company)) out.company = FIRST_COMPANY;
  out.career = Array.isArray(out.career) ? out.career : [];
  out.tier = typeof out.tier === "number" ? out.tier : 0;
  // Reglas: lo guardado sin versión se jugó con las reglas legacy (v1); nunca se le asignan las actuales.
  out.rulesVersion = isRulesVersion(r.rulesVersion) ? r.rulesVersion : LEGACY_RULES_VERSION;
  // Executive Journey: si viene dañado, se descarta (se vuelve a inscribir sin perder el piso fundador).
  const j = out.journey as unknown;
  if (j !== undefined && (!j || typeof j !== "object" || typeof (j as { stage?: unknown }).stage !== "number" || !Array.isArray((j as { appointments?: unknown }).appointments))) delete out.journey;
  // Perfil profesional (V33): opcional. Si falta, todo funciona igual; si viene dañado, se limpia o se descarta.
  if (out.profile !== undefined) { const p = sanitizeProfile(out.profile); if (p) out.profile = p; else delete out.profile; }
  if (out.diagnostic !== undefined) { const d = sanitizeDiagnostic(out.diagnostic); if (d) out.diagnostic = d; else delete out.diagnostic; }
  if (out.startTier !== undefined && (typeof out.startTier !== "number" || out.startTier < 0 || out.startTier > 1)) delete out.startTier;
  if (out.crises !== undefined && (!Array.isArray(out.crises) || out.crises.some((c) => !c || typeof c.company !== "string" || typeof c.startedAt !== "number" || !(c.rating in CRISIS_XP)))) delete out.crises;
  if (out.profileNudge !== undefined) { const n = out.profileNudge as unknown as Record<string, unknown>; if (!n || typeof n.dismissed !== "number" || typeof n.until !== "number") delete out.profileNudge; }
  if (out.cadence !== undefined) { const c = sanitizeCadence(out.cadence); if (c) out.cadence = c; else delete out.cadence; }
  if (out.episodes !== undefined) { const e = sanitizeEpisodes(out.episodes); if (e) out.episodes = e; else delete out.episodes; }
  // Carrera continua (P0-B2): identidad opcional. Sin identidad válida, la partida vuelve a «temporadas».
  if (out.companyProfile !== undefined) { const p = sanitizeCompanyProfile(out.companyProfile); if (p) out.companyProfile = p; else delete out.companyProfile; }
  if (out.careerMode !== undefined && out.careerMode !== "temporadas" && out.careerMode !== "continua") delete out.careerMode;
  if (out.careerMode === "continua" && !out.companyProfile) delete out.careerMode;
  if (out.careerMode === "continua" && out.companyProfile) out.company = out.companyProfile.contentPackId;
  if (out.settings.displayCurrency !== undefined && !isDisplayCurrency(out.settings.displayCurrency)) delete out.settings.displayCurrency;
  if (out.business !== undefined) { const b = sanitizeBusiness(out.business); if (b) out.business = b; else delete out.business; }
  return out;
}

// ───────────────────────────────────────────── tiempo y zona horaria
/** Diferencia (min) entre la hora local de `tz` y UTC en el instante `ts`. */
export function tzOffsetMin(tz: string, ts: number): number {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return Math.round((asUtc - Math.floor(ts / 1000) * 1000) / 60000);
  } catch { return -360; }
}
/** Medianoche local (en `tz`) del día que contiene `ts`. */
export function localMidnight(ts: number, tz: string): number {
  const off = tzOffsetMin(tz, ts) * 60000;
  const local = ts + off;
  return local - (((local % DAY) + DAY) % DAY) - off;
}
export function dayKey(ts: number, tz: string): string {
  return new Date(ts + tzOffsetMin(tz, ts) * 60000).toISOString().slice(0, 10);
}
export const nowOf = (s: CeoState, real = Date.now()) => real + (s.clockOffset || 0);

/** Pseudo-aleatorio estable 0…1 a partir de un texto (FNV-1a). */
export function rand01(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return ((h >>> 0) % 100000) / 100000;
}

const SLOTS: Record<string, Record<number, number>> = {};
function slotsOf(p: CompanyPack) {
  if (!SLOTS[p.id]) {
    const m: Record<number, number> = {};
    for (const it of p.items) m[it.day] = Math.max(m[it.day] ?? 0, it.slot);
    SLOTS[p.id] = m;
  }
  return SLOTS[p.id];
}

/**
 * Hora de llegada de un mensaje (determinista para cada jugador).
 * `spans`: pausas de la temporada (1.2). Lo que aún no llegaba se recorre días completos; lo ya recibido no se mueve.
 */
export function arrivalOf(s: CeoState, it: Item, spans: Span[] = []): number {
  if (s.pinned[it.id]) return s.pinned[it.id];
  return spans.length ? shiftArrival(spans, rawArrival(s, it), s.settings.windowStart) : rawArrival(s, it);
}
function rawArrival(s: CeoState, it: Item): number {
  const start = s.startedAt ?? 0;
  const seed = `${s.alias || s.name}|${it.id}|${start}`;
  if (it.day === 1) {
    // Primer día: el primer mensaje llega casi de inmediato; los demás, a lo largo de la siguiente hora.
    return start + (it.slot === 1 ? 15_000 : Math.round((20 + rand01(seed) * 40) * 60_000 * (it.slot - 1)));
  }
  const { windowStart: ws, windowEnd: we, tz } = s.settings;
  const base = localMidnight(start, tz) + (it.day - 1) * DAY;
  if (s.settings.intensivo) return base + ws * H + (it.slot - 1) * 5 * 60_000;
  const span = Math.max(1, we - ws) * H;
  const n = slotsOf(packOf(s))[it.day] || 1;
  const part = span / n;
  return Math.round(base + ws * H + part * (it.slot - 1) + part * (0.1 + rand01(seed) * 0.8));
}

/** Qué eligió el jugador en un mensaje: id de opción, "__expired" o null si sigue abierto / no ha llegado. */
export function resolution(s: CeoState, itemId: string, now: number): string | null {
  const d = s.decisions[itemId];
  if (d) return d.option;
  const it = seasonItems(s).find((x) => x.id === itemId);
  if (!it || !isActive(s, it, now)) return null;
  const spans = runSpans(s, now);
  const at = arrivalOf(s, it, spans);
  return now >= extendDeadline(spans, at, deadlineOf(s, it) * H) ? "__expired" : null;
}

// ───────────────────────────────────────────── casos ejecutivos en la temporada (reglas v3+)
/** Casos ejecutivos que llegan en esta temporada (vacío con reglas anteriores a v3 o si la empresa no tiene). */
export function seasonEpisodesOf(s: Pick<CeoState, "company" | "rulesVersion">): { spec: EpisodeSpec; day: number; slot: number; replaces?: string }[] {
  if (!ruleSet(rulesVersionOf(s)).episodes) return [];
  return (SEASON_EPISODES[s.company] ?? []).flatMap((x) => {
    const spec = EPISODES[x.episode];
    return spec && spec.approval === "aprobado" && spec.company === s.company ? [{ spec, day: x.day, slot: x.slot, replaces: x.replaces }] : [];
  });
}
/** Asuntos de la temporada: los del paquete menos los que sustituye un caso ejecutivo. */
export function seasonItems(s: Pick<CeoState, "company" | "rulesVersion">): Item[] {
  const items = packOf(s).items;
  const gone = new Set(seasonEpisodesOf(s).map((x) => x.replaces).filter(Boolean));
  return gone.size ? items.filter((i) => !gone.has(i.id)) : items;
}
/** Clave de llegada fijada de un caso ejecutivo (en `pinned`, junto a los asuntos). */
export const episodePinKey = (id: string) => `ep:${id}`;

export interface EpisodeEntry {
  spec: EpisodeSpec;
  arrivesAt: number;
  /** futuro: no ha llegado · pendiente: llegó y no lo has cerrado · cerrado: ya cuenta para la temporada. */
  status: "futuro" | "pendiente" | "cerrado";
  /** Partida de esta temporada (si ya lo abriste). */
  run?: EpisodeRun;
}
/** La partida de un episodio solo cuenta para la temporada en curso si empezó en ella. */
export function seasonRunOf(s: CeoState, id: string): EpisodeRun | undefined {
  const r = s.episodes?.[id];
  return r && s.startedAt && r.startedAt >= s.startedAt ? r : undefined;
}
export function episodeEntries(s: CeoState, now = nowOf(s)): EpisodeEntry[] {
  if (!s.startedAt) return [];
  const eps = seasonEpisodesOf(s);
  if (!eps.length) return [];
  const spans = runSpans(s, now);
  return eps.map(({ spec, day, slot }) => {
    const key = episodePinKey(spec.id);
    const pseudo = { id: key, day, slot } as Item;
    const arrivesAt = arrivalOf(s, pseudo, spans);
    const run = seasonRunOf(s, spec.id);
    const closed = !!run && run.phase === "closed" && (run.closedAt ?? Infinity) <= now;
    const status: EpisodeEntry["status"] = closed ? "cerrado" : now < arrivesAt && !run ? "futuro" : "pendiente";
    return { spec, arrivesAt, status, run };
  }).sort((a, b) => a.arrivesAt - b.arrivesAt);
}
/** ¿Este caso ejecutivo se puede abrir ahora en la temporada (ya llegó)? */
export function episodeAvailable(s: CeoState, id: string, now = nowOf(s)): boolean {
  const e = episodeEntries(s, now).find((x) => x.spec.id === id);
  return !!e && e.status !== "futuro";
}
/**
 * Abre un caso ejecutivo respetando la temporada: si el caso es parte de ella, solo cuando ya llegó.
 * Fuera de la temporada (reglas anteriores o modo prueba) se abre como práctica: no cuenta para indicadores ni XP.
 */
export function openSeasonEpisode(s: CeoState, id: string, at: number, mode?: "estandar" | "flexible"): CeoState {
  const inSeason = seasonEpisodesOf(s).some((x) => x.spec.id === id);
  if (inSeason && !episodeAvailable(s, id, at)) return s;
  return openEpisodeRaw(s, id, at, mode);
}
/** Casos ejecutivos que ya pagaste en esta misma empresa (temporadas anteriores). */
function paidEpisodesOf(s: CeoState): Set<string> {
  const out = new Set<string>();
  for (const r of s.career ?? []) if (r.company === s.company) (r.episodes ?? []).forEach((id) => out.add(id));
  return out;
}
/** XP que da en la temporada un caso ejecutivo cerrado (0 si no cuenta o si ya lo pagaste en esta empresa). */
export function episodeSeasonXp(s: CeoState, e: EpisodeEntry, paid: Set<string> | null = null): number {
  const R = ruleSet(rulesVersionOf(s));
  if (!R.episodes || e.status !== "cerrado" || !e.run) return 0;
  if (R.participation?.oncePerCompany && (paid ?? paidEpisodesOf(s)).has(e.spec.id)) return 0;
  return e.run.turns.length * R.episodes.xpDecision + R.episodes.xpClose;
}
/** Efecto en indicadores de un caso ejecutivo cerrado, ajustado a tu nivel de exigencia (como un asunto). */
export function episodeEffectOf(s: CeoState, e: EpisodeEntry): Partial<Kpis> {
  if (e.status !== "cerrado" || !e.run?.outcome) return {};
  const eff: Partial<Kpis> = {};
  for (const k of e.run.outcome.kpi) if (KPI_KEYS.includes(k.key)) eff[k.key] = (eff[k.key] ?? 0) + k.delta;
  return scaled(eff, s.tier, rulesVersionOf(s));
}

/** ¿Este mensaje existe para este jugador? (Las consecuencias sólo llegan si se cumplió su detonador.) */
export function isActive(s: CeoState, it: Item, now: number): boolean {
  if (!it.trigger) return true;
  const r = resolution(s, it.trigger.item, now);
  return r !== null && it.trigger.options.includes(r);
}

export function entries(s: CeoState, now = nowOf(s)): Entry[] {
  if (!s.startedAt) return [];
  const out: Entry[] = [];
  // Pausas (vacaciones / día tranquilo): el plazo solo corre en tiempo activo. Sin pausas, todo queda igual.
  const spans = runSpans(s, now);
  for (const it of seasonItems(s)) {
    if (!isActive(s, it, now)) continue;
    let arrivesAt = arrivalOf(s, it, spans);
    // Una consecuencia nunca llega antes de que se haya resuelto lo que la detona.
    if (it.trigger) {
      const t = s.decisions[it.trigger.item];
      if (t) arrivesAt = Math.max(arrivesAt, s.pinned[it.id] || !spans.length ? t.at + 2 * 60_000 : shiftArrival(spans.filter((x) => x.to > t.at), t.at + 2 * 60_000, s.settings.windowStart));
    }
    const deadline = spans.length ? extendDeadline(spans, arrivesAt, deadlineOf(s, it) * H) : arrivesAt + deadlineOf(s, it) * H;
    const decision = s.decisions[it.id];
    const status = decision ? "decidido" : now < arrivesAt ? "futuro" : now >= deadline ? "vencido" : "pendiente";
    out.push({ item: it, arrivesAt, deadline, status, decision, option: decision ? it.options.find((o) => o.id === decision.option) : undefined });
  }
  return out.sort((a, b) => a.arrivesAt - b.arrivesAt);
}

// ───────────────────────────────────────────── indicadores, XP, perfil
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Efecto real (ya ajustado a tu nivel de exigencia) de lo que pasó en un asunto. */
export function effectOf(s: CeoState, e: Entry): Partial<Kpis> {
  const v = rulesVersionOf(s);
  if (e.status === "vencido") {
    // Con reglas de participación, el vencimiento tiene su consecuencia en la empresa, pero el nivel de
    // exigencia ya no la amplifica: no se apilan castigos sobre una ausencia.
    return scaled(e.item.expired.effects, ruleSet(v).participation ? 0 : s.tier, v);
  }
  return scaled(e.status === "decidido" ? e.option?.effects : undefined, s.tier, v);
}
export function kpis(s: CeoState, now = nowOf(s)): Kpis {
  const k = { ...packOf(s).kpiStart };
  const es = entries(s, now);
  for (const e of es) {
    const eff = effectOf(s, e);
    for (const key of Object.keys(eff) as KpiKey[]) k[key] = clamp(k[key] + (eff[key] ?? 0));
  }
  for (const e of episodeEntries(s, now)) {
    const eff = episodeEffectOf(s, e);
    for (const key of Object.keys(eff) as KpiKey[]) k[key] = clamp(k[key] + (eff[key] ?? 0));
  }
  const ce = changeKpiEffect(s);
  for (const key of Object.keys(ce) as KpiKey[]) k[key] = clamp(k[key] + (ce[key] ?? 0));
  return k;
}

// ───────────────────────────── proyecto de cambio
/** ¿Ya se abrió el reto final (proyecto de cambio)? Se abre al cerrar todos los asuntos de la temporada. */
export function changeOpen(s: CeoState, now = nowOf(s)): boolean {
  return casesDoneOf(s, now);
}
/** Simulación del proyecto de la empresa actual (null si no ha arrancado). */
export function changeSimOf(s: CeoState): ChangeSim | null {
  if (!s.change || s.change.company !== s.company) return null;
  const pack = packOf(s);
  return simulate(pack.change, pack, s.change);
}
/** Asuntos base cerrados (decididos o vencidos) sobre el total. */
export function casesProgress(s: CeoState, now = nowOf(s), es = entries(s, now)): { done: number; total: number } {
  const done = new Set(es.filter((e) => e.status === "decidido" || e.status === "vencido").map((e) => e.item.id));
  const base = seasonItems(s).filter((i) => !i.trigger);
  const eps = episodeEntries(s, now);
  return { done: base.filter((i) => done.has(i.id)).length + eps.filter((e) => e.status === "cerrado").length, total: base.length + eps.length };
}
/** Lo que el proyecto de cambio suma a los indicadores (cuando lo presentas al consejo o se acaban las semanas). */
export function changeKpiEffect(s: CeoState): Partial<Kpis> {
  if (!s.startedAt) return {};
  const sim = changeSimOf(s);
  return sim?.done ? scaled(changeEffect(sim), s.tier, rulesVersionOf(s)) : {};
}
export const healthOf = (k: Kpis) => Math.round((k.caja + k.margen + k.equipo + k.clientes + k.consejo) / 5);

/** Tabla de XP de las reglas actuales (para textos; el cálculo usa la versión de cada temporada). */
export const XP = ruleSet(RULES_VERSION).xp;
/** XP de cada Boardroom Crisis según cómo terminó (ver crisis.ts), con las reglas actuales. */
export const CRISIS_XP: Record<CrisisRating, number> = ruleSet(RULES_VERSION).crisisXp;
/** Cada crisis se valúa con las reglas de la temporada en que se jugó (sin versión = legacy). */
export const crisisPoints = (rating: CrisisRating, version?: number) => ruleSet(isRulesVersion(version) ? version : LEGACY_RULES_VERSION).crisisXp[rating] ?? 0;
/**
 * XP que pagó cada crisis registrada (mismo orden que `s.crises`). Con reglas de participación,
 * la crisis de una empresa paga una sola vez: repetir la empresa no la vuelve a pagar.
 */
export function crisisXpList(s: Pick<CeoState, "crises">): number[] {
  const seen = new Set<string>();
  return (s.crises ?? []).map((c) => {
    const once = !!ruleSet(isRulesVersion(c.rulesVersion) ? c.rulesVersion : LEGACY_RULES_VERSION).participation?.oncePerCompany;
    const dup = once && seen.has(c.company);
    seen.add(c.company);
    return dup ? 0 : crisisPoints(c.rating, c.rulesVersion);
  });
}
/** XP que paga (o pagaría) la crisis de la temporada en curso con ese desenlace. */
export function crisisPayNow(s: Pick<CeoState, "crises" | "company" | "startedAt" | "rulesVersion">, rating: CrisisRating): number {
  const v = rulesVersionOf(s);
  const once = !!ruleSet(v).participation?.oncePerCompany;
  if (once && (s.crises ?? []).some((c) => c.company === s.company && c.startedAt !== s.startedAt)) return 0;
  return crisisPoints(rating, v);
}
export function crisisXp(s: CeoState): number {
  return crisisXpList(s).reduce((a, x) => a + x, 0);
}
/** XP de los dilemas de personas (viajan entre empresas). */
export function dilemmaXp(s: CeoState): number {
  const XP = ruleSet(careerRulesVersionOf(s)).xp;
  let xp = 0;
  for (const [id, d] of Object.entries(s.dilemmas ?? {})) {
    const o = dilemmaById(id)?.options[d.option];
    if (o) xp += XP.dilemma + o.score * XP.dilemmaPoint;
  }
  return xp;
}
/** Rango de carrera (0 = Gerente) según tu XP. */
export const rankFor = (s: CeoState, now = nowOf(s)) => levelOf(xpOf(s, now)).i;
/** Dilemas que ya se abrieron para tu rango. */
export function dilemmasOpen(s: CeoState, now = nowOf(s)): Dilemma[] {
  const r = rankFor(s, now);
  return DILEMMAS.filter((d) => d.min <= r);
}
/** El dilema del día: uno que no has respondido, elegido igual para todo el día (o el que respondiste hoy). */
export function dilemmaOfDay(s: CeoState, now = nowOf(s)): { d: Dilemma; done: boolean } | null {
  const tz = s.settings.tz;
  const today = dayKey(now, tz);
  const answered = s.dilemmas ?? {};
  const todays = Object.entries(answered).find(([, v]) => dayKey(v.at, tz) === today);
  if (todays) { const d = dilemmaById(todays[0]); if (d) return { d, done: true }; }
  const pool = dilemmasOpen(s, now).filter((d) => !answered[d.id]);
  if (!pool.length) return null;
  // Variedad: prioriza temas que has visto menos.
  const seen: Record<string, number> = {};
  Object.keys(answered).forEach((id) => { const t = dilemmaById(id)?.theme; if (t) seen[t] = (seen[t] ?? 0) + 1; });
  const minSeen = Math.min(...pool.map((d) => seen[d.theme] ?? 0));
  const fresh = pool.filter((d) => (seen[d.theme] ?? 0) === minSeen);
  return { d: fresh[Math.floor(rand01(`${today}:${s.startedAt ?? 0}`) * fresh.length)], done: false };
}
export function answerDilemma(s: CeoState, id: string, option: number, now = nowOf(s)): CeoState {
  const d = dilemmaById(id);
  if (!d || !d.options[option] || s.dilemmas?.[id]) return s;
  if (d.min > rankFor(s, now)) return s;
  return { ...s, dilemmas: { ...(s.dilemmas ?? {}), [id]: { option, at: now } }, lastActiveAt: now };
}
/** Asuntos de esta empresa que ya pagaron XP en una temporada anterior (para no pagarlos dos veces). */
function paidItemsOf(s: CeoState): Set<string> {
  const out = new Set<string>();
  for (const r of s.career ?? []) if (r.company === s.company) Object.keys(r.decisions ?? {}).forEach((id) => out.add(id));
  return out;
}
/**
 * XP de un asunto de la temporada en curso.
 *  - Legacy (v1): 20 + 10 × puntaje + 5 si respondiste en la primera mitad del plazo.
 *  - Participación (v2+): XP fijo por resolverlo, igual para cualquier opción y sin bono por rapidez;
 *    un asunto que ya pagaste en esta misma empresa no vuelve a pagar.
 * Un asunto vencido nunca da XP (no hubo participación), pero tampoco quita.
 */
export function entryXp(s: CeoState, e: Entry, spans: Span[] = [], paid: Set<string> | null = null): number {
  if (e.status !== "decidido" || !e.option || !e.decision) return 0;
  const R = ruleSet(rulesVersionOf(s));
  const XP = R.xp;
  if (R.participation) {
    if (R.participation.oncePerCompany && (paid ?? paidItemsOf(s)).has(e.item.id)) return 0;
    return XP.decision;
  }
  return XP.decision + e.option.score * XP.perPoint + (onTimeOf(e, spans) ? XP.onTime : 0);
}
/** Bono por terminar la empresa (reglas de participación): una vez por empresa, sin importar el veredicto. */
export function finishXp(s: CeoState, now = nowOf(s)): number {
  const P = ruleSet(rulesVersionOf(s)).participation;
  if (!P || !s.startedAt || !seasonDoneOf(s, now)) return 0;
  const paidBefore = (s.career ?? []).some((r) => r.company === s.company);
  return P.oncePerCompany && paidBefore ? 0 : P.finish;
}
/** XP de la empresa actual: asuntos + bono de cierre (sin lecciones, dilemas ni crisis). */
export function runXp(s: CeoState, now = nowOf(s)): number {
  const spans = runSpans(s, now);
  const paid = ruleSet(rulesVersionOf(s)).participation?.oncePerCompany ? paidItemsOf(s) : null;
  let xp = 0;
  for (const e of entries(s, now)) xp += entryXp(s, e, spans, paid);
  const paidEp = paidEpisodesOf(s);
  for (const e of episodeEntries(s, now)) xp += episodeSeasonXp(s, e, paidEp);
  return xp + finishXp(s, now);
}
/** ¿Se decidió en la primera mitad del plazo? Solo cuenta para XP con reglas legacy. Se mide en tiempo activo. */
export function onTimeOf(e: Entry, spans: Span[] = []): boolean {
  if (!e.decision) return false;
  if (!spans.length) return e.decision.at - e.arrivesAt <= (e.deadline - e.arrivesAt) / 2;
  return activeMs(spans, e.arrivesAt, e.decision.at) <= activeMs(spans, e.arrivesAt, e.deadline) / 2;
}
/**
 * XP de las lecciones (valuadas con la versión de la carrera). Con reglas de participación hay un tope
 * diario: como mucho `lessonsPerDay` lecciones pagan XP en un mismo día (zona horaria del jugador).
 */
export function lessonXp(s: CeoState): number {
  const R = ruleSet(careerRulesVersionOf(s));
  const ats = Object.values(s.lessons ?? {});
  const cap = R.participation?.lessonsPerDay;
  if (!cap) return ats.length * R.xp.lesson;
  const perDay = new Map<string, number>();
  for (const at of ats) { const k = dayKey(at, s.settings.tz); perDay.set(k, (perDay.get(k) ?? 0) + 1); }
  let n = 0;
  perDay.forEach((c) => { n += Math.min(c, cap); });
  return n * R.xp.lesson;
}
/** XP que daría completar una lección nueva ahora (0 si ya llegaste al tope del día). */
export function nextLessonXp(s: CeoState, now = nowOf(s)): number {
  const R = ruleSet(careerRulesVersionOf(s));
  const cap = R.participation?.lessonsPerDay;
  if (!cap) return R.xp.lesson;
  const today = dayKey(now, s.settings.tz);
  const done = Object.values(s.lessons ?? {}).filter((at) => dayKey(at, s.settings.tz) === today).length;
  return done >= cap ? 0 : R.xp.lesson;
}
/** XP total de la carrera: empresas anteriores + la actual + lecciones. */
export function xpOf(s: CeoState, now = nowOf(s)): number {
  const past = (s.career ?? []).reduce((a, r) => a + (r.xp || 0), 0);
  return past + runXp(s, now) + lessonXp(s) + dilemmaXp(s) + crisisXp(s);
}

export const LEVELS = [
  { min: 0, name: "Gerente", short: "Gerente" },
  { min: 150, name: "Director de área", short: "Director" },
  { min: 400, name: "Director General", short: "Dir. General" },
  { min: 750, name: "CEO", short: "CEO" },
  { min: 1050, name: "CEO de consejo", short: "CEO+" },
];
export function levelOf(xp: number) {
  let i = 0;
  LEVELS.forEach((l, j) => { if (xp >= l.min) i = j; });
  const next = LEVELS[i + 1];
  return { i, ...LEVELS[i], next, pct: next ? Math.round(((xp - LEVELS[i].min) / (next.min - LEVELS[i].min)) * 100) : 100 };
}

/** Días seguidos (en la zona del jugador) con al menos una decisión o lección. */
export function streakOf(s: CeoState, now = nowOf(s)) {
  const tz = s.settings.tz;
  const days = new Set<string>();
  Object.values(s.decisions).forEach((d) => days.add(dayKey(d.at, tz)));
  (s.career ?? []).forEach((r) => Object.values(r.decisions ?? {}).forEach((d) => days.add(dayKey(d.at, tz))));
  Object.values(s.lessons).forEach((t) => days.add(dayKey(t, tz)));
  Object.values(s.dilemmas ?? {}).forEach((d) => days.add(dayKey(d.at, tz)));
  Object.values(s.episodes ?? {}).forEach((r) => r.turns.forEach((t) => days.add(dayKey(t.at, tz))));
  const today = dayKey(now, tz);
  const doneToday = days.has(today);
  const paused = pausedDays(s, now);
  if (paused.size) return pausedStreak(days, paused, now, tz);
  let n = 0;
  let cursor = doneToday ? now : now - DAY;
  while (days.has(dayKey(cursor, tz))) { n++; cursor -= DAY; }
  let best = 0, run = 0;
  [...days].sort().forEach((d, i, arr) => {
    run = i > 0 && Date.parse(d) - Date.parse(arr[i - 1]) === DAY ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return { days: n, doneToday, atRisk: n > 0 && !doneToday, best, week: lastDays(days, now, tz) };
}
/** Días (en tu zona) que tocó alguna pausa de toda la carrera: cuentan como neutros para la racha. */
function pausedDays(s: CeoState, now: number): Set<string> {
  const out = new Set<string>();
  for (const sp of spansOf(s.cadence?.pauses, now)) {
    for (let t = sp.from; t < sp.to; t += DAY) out.add(dayKey(t, s.settings.tz));
    if (sp.to > sp.from) out.add(dayKey(sp.to - 1, s.settings.tz));
    if (sp.open) out.add(dayKey(now, s.settings.tz));
  }
  return out;
}
/** Racha con pausas: un día en pausa sin actividad ni suma ni rompe (adenda §5.3: pausas neutrales). */
function pausedStreak(days: Set<string>, paused: Set<string>, now: number, tz: string) {
  const today = dayKey(now, tz);
  const doneToday = days.has(today);
  let n = 0;
  let cursor = doneToday ? now : now - DAY;
  for (let guard = 0; guard < 4000; guard++) {
    const k = dayKey(cursor, tz);
    if (days.has(k)) n++;
    else if (!paused.has(k)) break;
    cursor -= DAY;
  }
  const all = [...new Set([...days, ...paused])].sort();
  let best = 0, run = 0;
  all.forEach((d, i, arr) => {
    const next = i > 0 && Date.parse(d) - Date.parse(arr[i - 1]) === DAY;
    run = (next ? run : 0) + (days.has(d) ? 1 : 0);
    best = Math.max(best, run);
  });
  const atRisk = n > 0 && !doneToday && !paused.has(today);
  return { days: n, doneToday, atRisk, best, week: lastDays(days, now, tz, paused) };
}
function lastDays(days: Set<string>, now: number, tz: string, paused?: Set<string>) {
  const out: { key: string; label: string; on: boolean; today: boolean; paused?: boolean }[] = [];
  const L = ["D", "L", "M", "M", "J", "V", "S"];
  for (let i = 6; i >= 0; i--) {
    const t = now - i * DAY;
    const key = dayKey(t, tz);
    out.push({ key, label: L[new Date(key + "T12:00:00Z").getUTCDay()], on: days.has(key), today: i === 0, ...(paused?.has(key) && !days.has(key) ? { paused: true } : {}) });
  }
  return out;
}

export const AXES: { key: Axis; left: string; right: string }[] = [
  { key: "horizonte", left: "Corto plazo", right: "Largo plazo" },
  { key: "riesgo", left: "Prudente", right: "Audaz" },
  { key: "foco", left: "Números", right: "Personas" },
  { key: "estilo", left: "Decides solo", right: "Involucras" },
  { key: "conflicto", left: "Evitas", right: "Encaras" },
];
/** Perfil de −100 a 100 por eje (promedio de las decisiones tomadas). */
export function profileOf(s: CeoState, now = nowOf(s)) {
  const sum: Record<Axis, number> = { horizonte: 0, riesgo: 0, foco: 0, estilo: 0, conflicto: 0 };
  const cnt: Record<Axis, number> = { horizonte: 0, riesgo: 0, foco: 0, estilo: 0, conflicto: 0 };
  const chosen = chosenOptions(s, now);
  for (const o of chosen) {
    for (const a of Object.keys(o.style) as Axis[]) { sum[a] += o.style[a] ?? 0; cnt[a]++; }
  }
  const axes = AXES.map((a) => ({ ...a, value: cnt[a.key] ? Math.round((sum[a.key] / cnt[a.key]) * 50) : 0, n: cnt[a.key] }));
  return { axes, archetype: archetypeOf(axes), decisions: chosen.length };
}
/** Todas las opciones que has elegido en tu carrera (empresas anteriores + actual). */
export function chosenOptions(s: CeoState, now = nowOf(s)): Option[] {
  const out: Option[] = [];
  for (const r of s.career ?? []) {
    const p = companyById(r.company);
    for (const [id, d] of Object.entries(r.decisions ?? {})) {
      const o = p.items.find((i) => i.id === id)?.options.find((x) => x.id === d.option);
      if (o) out.push(o);
    }
  }
  for (const e of entries(s, now)) if (e.option) out.push(e.option);
  return out;
}
function archetypeOf(axes: { key: Axis; value: number; n: number }[]) {
  const v = Object.fromEntries(axes.map((a) => [a.key, a.value])) as Record<Axis, number>;
  if (axes.every((a) => a.n === 0)) return { name: "Por descubrir", text: "Toma tus primeras decisiones y aquí aparecerá cómo diriges." };
  if (v.foco > 25 && v.estilo > 25) return { name: "Arquitecto social", text: "Diriges a través de la gente: involucras, desarrollas y construyes confianza antes de exigir resultados." };
  if (v.horizonte > 25 && v.riesgo > 25) return { name: "Constructor visionario", text: "Apuestas por el largo plazo y te atreves a mover el tablero, aun cuando el trimestre duela." };
  if (v.riesgo < -25 && v.foco < -10) return { name: "Guardián del capital", text: "Proteges la caja y el margen. Tu reto: que la prudencia no se vuelva parálisis." };
  if (v.conflicto > 25 && v.estilo < 0) return { name: "Ejecutor directo", text: "Encaras rápido y decides con firmeza. Cuida que la velocidad no deje a tu equipo afuera." };
  if (v.conflicto < -20) return { name: "Pacificador", text: "Cuidas la armonía. Recuerda: la confianza no elimina el conflicto, lo vuelve útil." };
  if (v.estilo > 25) return { name: "Integrador", text: "Sumas voces antes de decidir. Tu reto es cerrar a tiempo." };
  return { name: "Estratega equilibrado", text: "Balanceas números y personas, corto y largo plazo. Sigue afilando tus no negociables." };
}

export interface Badge { id: string; name: string; text: string; on: boolean }
export function badgesOf(s: CeoState, now = nowOf(s)): Badge[] {
  const es = entries(s, now);
  const decided = es.filter((e) => e.status === "decidido").length;
  const expired = es.filter((e) => e.status === "vencido").length;
  const k = kpis(s, now);
  const st = streakOf(s, now);
  const passed = (s.career ?? []).filter((r) => r.passed);
  const industries = new Set(passed.map((r) => companyById(r.company).industry));
  const allGreen = (s.career ?? []).some((r) => KPI_KEYS.every((x) => r.kpis[x] >= 70));
  return [
    { id: "primera", name: "Primera decisión", text: "Tomaste tu primera decisión como CEO.", on: decided >= 1 },
    { id: "racha3", name: "Tres al hilo", text: "3 días seguidos al frente.", on: st.best >= 3 },
    { id: "racha7", name: "Semana completa", text: "7 días seguidos al frente.", on: st.best >= 7 },
    { id: "puntual", name: "Nada se cae", text: "5 decisiones sin dejar vencer ningún asunto.", on: decided >= 5 && expired === 0 },
    { id: "gente", name: "Arquitecto social", text: "Llevaste el indicador de Equipo a 70 o más.", on: k.equipo >= 70 },
    { id: "caja", name: "Guardián de la caja", text: "Llevaste la Caja a 70 o más.", on: k.caja >= 70 },
    { id: "lector", name: "Teoría en mano", text: "Completaste 5 lecciones de mêtis Academy.", on: Object.keys(s.lessons).length >= 5 },
    { id: "ascenso", name: "Ascenso", text: "Aprobaste tu primera empresa en todos los rubros.", on: passed.length >= 1 },
    { id: "multigiro", name: "Multigiro", text: "Aprobaste empresas de 3 industrias distintas.", on: industries.size >= 3 },
    { id: "impecable", name: "Impecable", text: "Cerraste una empresa con todos los rubros en 70 o más.", on: allGreen },
    { id: "legendario", name: "Legendario", text: "Aprobaste una empresa en modo Legendario.", on: (s.career ?? []).some((r) => r.passed && r.tier >= 2 && s.legendary) },
  ];
}

// ───────────────────────────────────────────── acciones
export function decide(s: CeoState, itemId: string, optionId: string, now = nowOf(s), written?: Written): CeoState {
  const e = entries(s, now).find((x) => x.item.id === itemId);
  if (!e || e.status !== "pendiente") return s;
  if (!e.item.options.some((o: Option) => o.id === optionId)) return s;
  const w = written && typeof written.text === "string" && written.text.trim() ? { written: { text: written.text.trim().slice(0, 1200), quality: Math.max(0, Math.min(3, Math.round(written.quality))) as Written["quality"], feedback: String(written.feedback ?? "").slice(0, 280) } } : {};
  return { ...s, decisions: { ...s.decisions, [itemId]: { option: optionId, at: now, ...w } }, lastActiveAt: now };
}

/** Congela la hora de llegada de lo que ya llegó (para que cambiar el horario no mueva el pasado). */
export function pinArrived(s: CeoState, now = nowOf(s)): CeoState {
  let changed = false;
  const pinned = { ...s.pinned };
  for (const e of entries(s, now)) if (e.status !== "futuro" && !pinned[e.item.id]) { pinned[e.item.id] = e.arrivesAt; changed = true; }
  for (const e of episodeEntries(s, now)) { const k = episodePinKey(e.spec.id); if (e.status !== "futuro" && !pinned[k]) { pinned[k] = e.arrivesAt; changed = true; } }
  return changed ? { ...s, pinned } : s;
}

/** Hora del siguiente asunto o caso ejecutivo que aún no llega (null si ya no queda nada por llegar). */
export function nextArrivalOf(s: CeoState, now = nowOf(s)): number | null {
  const ts = [...entries(s, now).filter((e) => e.status === "futuro").map((e) => e.arrivesAt), ...episodeEntries(s, now).filter((e) => e.status === "futuro").map((e) => e.arrivesAt)];
  return ts.length ? Math.min(...ts) : null;
}
/** Modo prueba: adelanta el reloj hasta el siguiente mensaje. */
export function skipToNext(s: CeoState, real = Date.now()): CeoState {
  const now = nowOf(s, real);
  const at = nextArrivalOf(s, now);
  if (at === null) return s;
  return { ...s, clockOffset: (s.clockOffset || 0) + (at - now) + 1000 };
}

export function seasonDay(s: CeoState, now = nowOf(s)): number {
  if (!s.startedAt) return 0;
  const raw = (t: number) => Math.floor((localMidnight(t, s.settings.tz) - localMidnight(s.startedAt!, s.settings.tz)) / DAY) + 1;
  let d = raw(now);
  // Pausas: el calendario de la empresa se recorre los días que duraron; durante una pausa, el día se congela.
  const spans = runSpans(s, now);
  if (spans.length) {
    const shiftBefore = (t: number) => spans.filter((x) => !x.open && x.to <= t).reduce((a, x) => a + shiftDaysOf(x), 0);
    const inside = spans.find((x) => x.open || now < x.to);
    d = inside ? raw(inside.from) - shiftBefore(inside.from) : Math.max(raw(now) - shiftBefore(now), raw(spans[spans.length - 1].from) - shiftBefore(spans[spans.length - 1].from));
  }
  return Math.min(Math.max(d, 1), packOf(s).season.days);
}

/** Mensajes que llegan entre `from` y `to` (para que el cron agende correo y WhatsApp). */
export function arrivalsBetween(s: CeoState, from: number, to: number): Entry[] {
  return entries(s, to).filter((e) => e.arrivesAt >= from && e.arrivesAt < to && !e.decision);
}

// ───────────────────────────────────────────── carrera: cierre, veredicto y ascenso
/** ¿Ya se resolvió todo lo de esta empresa? */
/** ¿Ya cerraste todos los asuntos? (base decididos o vencidos y nada pendiente). Abre el reto final. */
export function casesDoneOf(s: CeoState, now = nowOf(s)): boolean {
  if (!s.startedAt) return false;
  const es = entries(s, now);
  const base = seasonItems(s).filter((i) => !i.trigger);
  const done = (id: string) => es.some((e) => e.item.id === id && (e.status === "decidido" || e.status === "vencido"));
  // Reglas v3+: los casos ejecutivos no vencen; el reto final espera a que los cierres.
  const epsOk = !ruleSet(rulesVersionOf(s)).episodes?.required || episodeEntries(s, now).every((e) => e.status === "cerrado");
  return epsOk && base.every((i) => done(i.id)) && !es.some((e) => e.status === "pendiente" || (e.status === "futuro" && !e.item.trigger));
}
/** Fin del nivel: cerraste los asuntos Y el reto final (proyecto de cambio). Hasta entonces no hay veredicto. */
export function seasonDoneOf(s: CeoState, now = nowOf(s)): boolean {
  return casesDoneOf(s, now) && !!changeSimOf(s)?.done;
}

export interface Verdict {
  kpis: Kpis;
  health: number;
  passLine: number;
  /** Rubros aprobados (≥ línea). */
  approved: Record<KpiKey, boolean>;
  allApproved: boolean;
  answered: number;
  answeredOk: boolean;
  passed: boolean;
}
export function verdictOf(s: CeoState, now = nowOf(s)): Verdict {
  const k = kpis(s, now);
  const r = rulesFor(s);
  const es = entries(s, now).filter((e) => e.status === "decidido" || e.status === "vencido");
  const answered = es.length ? es.filter((e) => e.status === "decidido").length / es.length : 0;
  const approved = Object.fromEntries(KPI_KEYS.map((x) => [x, k[x] >= r.passLine])) as Record<KpiKey, boolean>;
  const allApproved = KPI_KEYS.every((x) => approved[x]);
  const answeredOk = answered >= r.minAnswered;
  return { kpis: k, health: healthOf(k), passLine: r.passLine, approved, allApproved, answered, answeredOk, passed: allApproved && answeredOk };
}

/** Siguiente empresa: aleatoria entre las que no has aprobado (estable por jugador). */
export function nextCompanyOf(s: CeoState): { id: string; legendary: boolean } {
  const passed = new Set((s.career ?? []).filter((r) => r.passed).map((r) => r.company));
  passed.add(s.company);
  const left = COMPANIES.filter((c) => !passed.has(c.id));
  const pool = left.length ? left : COMPANIES.filter((c) => c.id !== s.company);
  const pick = pool[Math.floor(rand01(`${s.alias || s.name}|${(s.career ?? []).length}|next`) * pool.length)] ?? COMPANIES[0];
  return { id: pick.id, legendary: !left.length };
}

function closeRun(s: CeoState, now: number): CareerRun {
  const v = verdictOf(s, now);
  return {
    company: s.company, tier: s.tier, rulesVersion: rulesVersionOf(s), startedAt: s.startedAt ?? now, endedAt: now, kpis: v.kpis, health: v.health,
    answered: Math.round(v.answered * 100), passed: v.passed, xp: runXp(s, now), decisions: s.decisions as Record<string, Decision>,
    ...(() => { const ep = episodeEntries(s, now).filter((e) => e.status === "cerrado").map((e) => e.spec.id); return ep.length ? { episodes: ep } : {}; })(),
    change: (() => { const sim = changeSimOf(s); return { adopted: sim?.adopted ?? 0, weeks: sim?.weeksUsed ?? 0, ok: !!sim?.ok }; })(),
  };
}
/** Temporada nueva. `rulesVersion` se congela aquí: la nueva temporada usa las reglas vigentes. */
const fresh = (s: CeoState, company: string, tier: number, now: number, legendary?: boolean, rulesVersion: number = RULES_VERSION): CeoState => ({
  ...s, company, tier, rulesVersion, legendary: legendary ?? s.legendary, startedAt: now, decisions: {}, pinned: {}, read: {}, change: undefined, lastActiveAt: now, savedAt: now,
});

/**
 * Cierra la empresa actual y pasa a la siguiente (si aprobaste) o la repite (si no).
 * Carrera continua: cierra el periodo y sigue en LA MISMA empresa, con la misma exigencia (no hay «siguiente empresa»).
 */
export function advance(s: CeoState, now = nowOf(s), rulesVersion: number = RULES_VERSION): CeoState {
  if (!seasonDoneOf(s, now)) return s;
  const run = closeRun(s, now);
  const career = [...(s.career ?? []), run];
  const after = { ...s, career };
  if (isContinuous(s)) {
    const v = ruleSet(rulesVersion).career === "continua" ? rulesVersion : CONTINUOUS_RULES_VERSION;
    return fresh(after, s.company, s.tier, now, undefined, v);
  }
  if (!run.passed) return fresh(after, s.company, s.tier, now, undefined, rulesVersion);
  const next = nextCompanyOf(after);
  const passedCount = career.filter((r) => r.passed).length;
  const legendary = next.legendary || !!s.legendary;
  return fresh(after, next.id, passedCount + (legendary ? 1 : 0), now, legendary, rulesVersion);
}

/** Cambiar de empresa a media temporada (solo antes de la primera decisión). */
export function switchCompany(s: CeoState, company: string, now = nowOf(s)): CeoState {
  // En la carrera continua la empresa es persistente: no se cambia (las rotaciones serán misiones aparte).
  if (isContinuous(s) || Object.keys(s.decisions).length || !COMPANIES.some((c) => c.id === company)) return s;
  // Cambiar antes de decidir es la misma temporada recién iniciada: conserva sus reglas.
  return fresh(s, company, s.tier, now, undefined, rulesVersionOf(s));
}

/**
 * Crea la empresa del jugador y empieza la carrera continua (P0-B2).
 * Solo antes de la primera decisión del periodo (igual que cambiar de empresa) y solo una vez: después se renombra.
 * La combinación sector/industria/tipo debe tener casos aprobados. El periodo nuevo usa las reglas v4.
 */
export function setupCompany(s: CeoState, input: Omit<NewCompanyInput, "at">, now = nowOf(s)): CeoState {
  if (s.companyProfile || Object.keys(s.decisions).length) return s;
  const profile = newCompanyProfile({ ...input, at: now }, TAXONOMY_VERSION);
  if (!profile) return s;
  // Los supuestos del negocio se congelan al crear la empresa (como las reglas de una temporada).
  return { ...fresh(s, profile.contentPackId, s.tier, now, undefined, CONTINUOUS_RULES_VERSION), careerMode: "continua", companyProfile: profile, business: { assumptionsVersion: ASSUMPTIONS_VERSION, allocations: [] } };
}
/** Cambia el nombre de la empresa. Conserva `companyId`, decisiones, periodo y todo lo demás. */
export function renameCompany(s: CeoState, displayName: string, shortName: string | undefined, now = nowOf(s)): CeoState {
  if (!s.companyProfile) return s;
  const p = renameProfile(s.companyProfile, displayName, shortName, now);
  return p === s.companyProfile ? s : { ...s, companyProfile: p, lastActiveAt: now };
}

/** Opción A domina a B si es igual o mejor en todos los rubros y mejor en al menos uno. */
export function dominates(a: Partial<Kpis>, b: Partial<Kpis>): boolean {
  let better = false;
  for (const k of KPI_KEYS) {
    const x = a[k] ?? 0, y = b[k] ?? 0;
    if (x < y) return false;
    if (x > y) better = true;
  }
  return better;
}
