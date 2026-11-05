/**
 * mêtis CEO · motor del simulador. Lógica pura (sin React ni navegador) para usarla
 * igual en la app, en el cron que agenda correos/WhatsApp y en las pruebas.
 */
import type { AgreementState, Axis, CareerRun, CeoState, CrisisRating, CompanyPack, Decision, Entry, Item, KpiKey, Kpis, Option, PriorCondition, Settings, Written } from "./types";
import { COMPANIES, FIRST_COMPANY, LEGACY_ROTATION, companyById } from "./companies";
import { DILEMMAS, dilemmaById, sameSituation, type Dilemma } from "./dilemmas";
import { changeEffect, simulate, type ChangeSim } from "./change";
import { sanitizeDiagnostic, sanitizeProfile } from "./profile";
import { CONTINUOUS_RULES_VERSION, LEGACY_CONTINUOUS_RULES_VERSION, LEGACY_RULES_VERSION, RULES_VERSION, isRulesVersion, ruleSet, tierRules } from "./rules";
import { newCompanyProfile, renameProfile, sanitizeCompanyProfile, type NewCompanyInput } from "./career/identity";
import { isDisplayCurrency } from "./career/money";
import { TAXONOMY_VERSION, type CompanyArchetype } from "./career/taxonomy";
import { sizedPack } from "./career/size";
import { LAST_COMPANY_STAGE, closesStage, stageIdOf, stageTrack } from "./career/stages";
import { compatibleItems, episodeFits } from "./companies/tags";
import { BANK_DAYS, bankMonth, isBankId, withBank, type BankMonth } from "./cases/bank";
import { brandDeep, brandPack, brandText, type Brand } from "./career/template";
import { industryLongFor } from "./career/lexicon";
import { ASSUMPTIONS_VERSION, sanitizeBusiness } from "./business/model";
import { sanitizeEpisodes } from "./episodes/engine";
import { EPISODES, SEASON_EPISODES, openEpisode as openEpisodeRaw } from "./episodes/catalog";
import { authoredFromScore, judge, prioritizes, type ContextOption } from "./judgment";
import { SEASON_OBJECTIVES } from "./objectives";
import { expectedEffects, isDefensibleOption, isOmissionRedLine, isRedLine } from "./editorial";
import { acceptsWith, addEffects, itemAtVersion, presentIn } from "./versioned";
import type { AuthoredJudgment } from "./judgment";
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
export const packOf = (s: Pick<CeoState, "company"> & Partial<Pick<CeoState, "companyProfile">>): CompanyPack =>
  brandPack(sizedPack(s.companyProfile ? withBank(companyById(s.company)) : companyById(s.company), companyTypeOf(s)), brandOf(s));
/** Tipo de empresa del jugador (carrera continua). Sin empresa propia, undefined: las temporadas usan el paquete tal cual. */
export const companyTypeOf = (s: Partial<Pick<CeoState, "companyProfile">>): CompanyArchetype | undefined => s.companyProfile?.archetype;
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

type StageInput = Partial<Pick<CeoState, "careerMode" | "companyProfile" | "career">>;
/**
 * Etapa de la empresa (P1-B): índice en COMPANY_STAGES y meses que lleva en ella. Se deriva de los meses cerrados
 * (determinista); fuera de la carrera continua siempre es 0. Ver career/stages.ts.
 */
export function companyStageOf(s: StageInput): { idx: number; months: number } {
  if (s.careerMode !== "continua" || !s.companyProfile) return { idx: 0, months: 0 };
  return stageTrack(closedRunsOf({ companyProfile: s.companyProfile, career: s.career ?? [] }));
}
/** Casos ejecutivos que ya cerraste en un mes anterior de tu empresa: en la carrera continua no se repiten. */
function playedEpisodesOf(s: StageInput): Set<string> {
  if (s.careerMode !== "continua" || !s.companyProfile) return new Set();
  return new Set(closedRunsOf({ companyProfile: s.companyProfile, career: s.career ?? [] }).flatMap((r) => r.episodes ?? []));
}

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
export function seasonEpisodesOf(s: Pick<CeoState, "company" | "rulesVersion"> & StageInput, all = false): { spec: EpisodeSpec; day: number; slot: number; replaces?: string }[] {
  if (!ruleSet(rulesVersionOf(s)).episodes) return [];
  const a = companyTypeOf(s);
  // Carrera continua (P1-B): un caso ejecutivo llega una sola vez en la vida de tu empresa.
  const played = all ? new Set<string>() : playedEpisodesOf(s);
  return (SEASON_EPISODES[s.company] ?? []).flatMap((x) => {
    if (played.has(x.episode)) return [];
    // Auditoría (P1-A): un caso que no es compatible con el tipo de empresa no se muestra.
    if (!episodeFits(x.episode, a)) return [];
    const spec = EPISODES[x.episode];
    return spec && spec.approval === "aprobado" && spec.company === s.company ? [{ spec, day: x.day, slot: x.slot, replaces: x.replaces }] : [];
  });
}
/** Reglas v8: si dejar vencer equivale a la línea roja, el vencimiento lo dice con todas sus letras. */
const OMISSION_NOTE = " Sin tu decisión, alguien hizo justo lo que es línea roja: cuenta como si lo hubieras decidido tú.";
function withOmissionNote(it: Item, v: number): Item {
  if (!isOmissionRedLine(it.id, v) || it.expired.outcome.includes(OMISSION_NOTE.trim())) return it;
  return { ...it, expired: { ...it.expired, outcome: it.expired.outcome + OMISSION_NOTE } };
}
/**
 * Asuntos de la temporada: los del paquete menos los que sustituye un caso ejecutivo. En la carrera continua, solo
 * los compatibles con el tipo de empresa, y sin las consecuencias cuyo detonador no se muestra (auditoría P1-A).
 */
export function seasonItems(s: Pick<CeoState, "company" | "rulesVersion"> & StageInput): Item[] {
  const pack = packOf(s);
  const v = rulesVersionOf(s);
  // Asuntos nuevos (con `since`) solo en periodos de esa versión: un periodo que ya empezó no cambia.
  // Revisiones por versión (v8+): mismo id, el asunto se presenta como lo define la versión del periodo.
  let items = compatibleItems(pack.items.filter((i) => !isBankId(i.id) && presentIn(i, v)).map((i) => withOmissionNote(itemAtVersion(i, v), v)), companyTypeOf(s));
  // Carrera continua (P1-B): la carta de llegada y lo del primer día solo tienen sentido al tomar el mando.
  if (companyStageOf(s).idx > 0) {
    const first = new Set(items.filter((i) => i.day <= 1).map((i) => i.id));
    items = items.filter((i) => !first.has(i.id) && !(i.trigger && first.has(i.trigger.item)));
  }
  // Lo que sustituye un caso ejecutivo no vuelve, aunque ese caso ya se haya jugado en un mes anterior.
  const gone = new Set<string>(seasonEpisodesOf(s, true).map((x) => x.replaces).filter((x): x is string => !!x));
  // Banco de casos (P1-C): desde «Estabilizar» llegan casos nuevos cada mes, y lo que ya viviste dos veces cede su lugar.
  const bank = bankMonthOf(s);
  for (const id of bank?.stale ?? []) gone.add(id);
  if (gone.size) {
    // Si un caso ejecutivo (o uno del banco) reemplaza a un detonador, sus consecuencias tampoco se muestran:
    // nunca llegaría una consecuencia sin la decisión que la causa.
    const kept = items.filter((i) => !gone.has(i.id));
    const ids = new Set(kept.map((i) => i.id));
    items = kept.filter((i) => !i.trigger || ids.has(i.trigger.item));
  }
  if (!bank?.picks.length) return items;
  const byId = new Map(pack.items.map((i) => [i.id, i]));
  const slots = slotsOf(pack);
  const extra = bank.picks.flatMap((p, k) => {
    const it = byId.get(p.id);
    if (!it) return [];
    const day = BANK_DAYS[k % BANK_DAYS.length];
    return [{ ...it, day, slot: 1 + (k % Math.max(1, slots[day] ?? 1)) }];
  });
  return [...items, ...extra];
}
/**
 * Casos del banco del mes en curso (carrera continua) o null. Se reconstruye de los meses cerrados de tu empresa:
 * primero lo que no has vivido y, entre eso, lo de las áreas donde has decidido más flojo. Ver cases/bank.ts.
 */
const BANK_MEMO = new WeakMap<object, Map<string, BankMonth>>();
const NO_CAREER: CareerRun[] = [];
export function bankMonthOf(s: Pick<CeoState, "company"> & StageInput): BankMonth | null {
  if (s.careerMode !== "continua" || !s.companyProfile) return null;
  const p = s.companyProfile;
  const career = s.career ?? NO_CAREER;
  // Se consulta muchas veces por pantalla: se recuerda por carrera (los meses cerrados no cambian).
  const key = `${s.company}|${p.companyId}|${p.contentPackId}|${p.appointedAt}`;
  let memo = BANK_MEMO.get(career);
  if (!memo) { memo = new Map(); BANK_MEMO.set(career, memo); }
  const hit = memo.get(key);
  if (hit) return hit;
  const runs = closedRunsOf({ companyProfile: p, career });
  const out = bankMonth(s.company, runs, (k) => stageTrack(runs.slice(0, k)).idx, withBank(companyById(s.company)).items, p.companyId);
  memo.set(key, out);
  return out;
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
  if (it.trigger.roll && !inRoll(s, it.trigger.item, it.trigger.roll)) return false;
  const r = resolution(s, it.trigger.item, now);
  return r !== null && it.trigger.options.includes(r);
}
/**
 * Azar estable (0…1) de un detonador en este periodo. No depende del nombre ni de la hora a la que decidas:
 * solo de cuándo empezó el periodo y de qué asunto se trata. Así la misma partida siempre se reproduce igual.
 */
export const rollOf = (s: Pick<CeoState, "startedAt">, itemId: string): number => rand01(`${s.startedAt ?? 0}|${itemId}|azar`);
export const inRoll = (s: Pick<CeoState, "startedAt">, itemId: string, [from, to]: [number, number]): boolean => {
  const r = rollOf(s, itemId);
  return r >= from && r < to;
};

export function entries(s: CeoState, now = nowOf(s)): Entry[] {
  if (!s.startedAt) return [];
  const out: Entry[] = [];
  // Pausas (vacaciones / día tranquilo): el plazo solo corre en tiempo activo. Sin pausas, todo queda igual.
  const spans = runSpans(s, now);
  const seen = new Map<string, Entry>();
  for (const it0 of seasonItems(s)) {
    // Cadena (v8+): si el detonador ya se calculó aquí, su estado real (con llegada encadenada) decide si esto existe.
    const tPrev = it0.after?.length && it0.trigger ? seen.get(it0.trigger.item) : undefined;
    if (tPrev) {
      if (it0.trigger!.roll && !inRoll(s, it0.trigger!.item, it0.trigger!.roll)) continue;
      const r = tPrev.status === "decidido" ? tPrev.decision!.option : tPrev.status === "vencido" ? "__expired" : null;
      if (r === null || !it0.trigger!.options.includes(r)) continue;
    } else if (it0.after?.length && it0.trigger && !seen.has(it0.trigger.item)) continue;
    else if (!isActive(s, it0, now)) continue;
    let arrivesAt = arrivalOf(s, it0, spans);
    // Una consecuencia nunca llega antes de que se haya resuelto lo que la detona.
    if (it0.trigger) {
      const t = s.decisions[it0.trigger.item];
      if (t) arrivesAt = Math.max(arrivesAt, s.pinned[it0.id] || !spans.length ? t.at + 2 * 60_000 : shiftArrival(spans.filter((x) => x.to > t.at), t.at + 2 * 60_000, s.settings.windowStart));
    }
    // Acuerdo (v8+): lo que depende de la respuesta de la contraparte llega después de esa respuesta.
    const tAgr = it0.trigger ? seen.get(it0.trigger.item)?.agreement : undefined;
    if (tAgr && !s.pinned[it0.id]) arrivesAt = Math.max(arrivesAt, tAgr.respondsAt + 2 * 60_000);
    // Cadena (v8+): espera a que se resuelva lo anterior de la cadena que sí llegó (y a la respuesta de su acuerdo).
    let waiting = false;
    for (const id of it0.after ?? []) {
      const p = seen.get(id);
      if (!p) continue;
      const at = resolvedAt(p);
      if (at === null) { waiting = true; break; }
      if (!s.pinned[it0.id]) arrivesAt = Math.max(arrivesAt, Math.max(at, p.agreement?.respondsAt ?? 0) + 2 * 60_000);
    }
    if (waiting) continue;
    // Cadena (v8+): lo que decidiste antes (resuelto antes de que esto llegara) cambia información y opciones.
    const it = withVariants(it0, seen, arrivesAt);
    const deadline = spans.length ? extendDeadline(spans, arrivesAt, deadlineOf(s, it) * H) : arrivesAt + deadlineOf(s, it) * H;
    const decision = s.decisions[it.id];
    const status = decision ? "decidido" : now < arrivesAt ? "futuro" : now >= deadline ? "vencido" : "pendiente";
    const option = decision ? it.options.find((o) => o.id === decision.option) : undefined;
    const agreement = decision && option?.pending ? agreementOf(s, it, option, decision.at, now) : undefined;
    const entry: Entry = { item: it, arrivesAt, deadline, status, decision, option, ...(agreement ? { agreement } : {}) };
    seen.set(it.id, entry);
    out.push(entry);
  }
  return out.sort((a, b) => a.arrivesAt - b.arrivesAt);
}

/**
 * Acuerdo pendiente (v8+): la contraparte responde `days` días reales después de tu decisión y, a más tardar, al
 * empezar el último día del periodo (antes de que pueda cerrarse). Acepta según el azar estable del asunto.
 */
export function agreementOf(s: CeoState, it: Item, o: Option, at: number, now: number): AgreementState {
  const p = o.pending!;
  const last = Math.max(...packOf(s).items.map((i) => i.day));
  const bound = localMidnight(s.startedAt ?? 0, s.settings.tz) + (last - 1) * DAY + s.settings.windowStart * H;
  const respondsAt = Math.max(at, Math.min(at + p.days * DAY, bound));
  const accepted = acceptsWith(rollOf(s, it.id), o);
  const r = accepted ? p.yes : p.no;
  return { who: p.who, what: p.what, respondsAt, resolved: now >= respondsAt, accepted, text: r.text, effects: r.effects };
}

/** Momento en que se resolvió un asunto (decisión o vencimiento); null si sigue abierto. */
const resolvedAt = (e: Entry): number | null => (e.status === "decidido" ? e.decision!.at : e.status === "vencido" ? e.deadline : null);

/** ¿Se cumple la condición? Solo cuenta lo resuelto antes de `before` (nada cambia después de que el asunto llegó). */
function priorMet(c: PriorCondition, seen: Map<string, Entry>, before: number): boolean {
  const p = seen.get(c.item);
  if (!p) return false;
  const at = resolvedAt(p);
  if (at === null || at > before) return false;
  const r = p.status === "vencido" ? "__expired" : p.decision!.option;
  if (!c.options.includes(r)) return false;
  return c.accepted === undefined || (!!p.agreement && p.agreement.respondsAt <= before && p.agreement.accepted === c.accepted);
}
function withVariants(it: Item, seen: Map<string, Entry>, before: number): Item {
  if (!it.variants?.length) return it;
  let out = it;
  for (const v of it.variants) {
    if (!v.when.every((c) => priorMet(c, seen, before))) continue;
    out = { ...out, ...v.patch };
    if (v.rows?.length && out.data) out = { ...out, data: { ...out.data, rows: [...out.data.rows, ...v.rows] } };
  }
  return out;
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
  const now = scaled(e.status === "decidido" ? e.option?.effects : undefined, s.tier, v);
  // Acuerdo (v8+): lo que depende de la contraparte solo suma cuando responde.
  return e.status === "decidido" && e.agreement?.resolved ? addEffects(now, scaled(e.agreement.effects, s.tier, v)) : now;
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
  const cf = cashFlowOf(s, k);
  if (cf) k.caja = clamp(k.caja + cf);
  return k;
}

/**
 * Reglas V5: al cierre (cuando el proyecto de cambio terminó), el margen se convierte en caja.
 * Recibe los indicadores ANTES de este paso. 0 si las reglas no son V5 o la temporada no ha cerrado.
 */
export function cashFlowOf(s: CeoState, before: Kpis): number {
  const R = ruleSet(rulesVersionOf(s)).v5;
  if (!R || !changeSimOf(s)?.done) return 0;
  const line = rulesFor(s).passLine;
  return Math.max(R.cashFlow.min, Math.min(R.cashFlow.max, (R.cashFlow.base ?? 0) + Math.round((before.margen - line) / R.cashFlow.perPoints)));
}

/** Indicadores que el consejo encargó (y la caja): la rúbrica V5 los considera en riesgo antes. */
export function mandateOf(s: Pick<CeoState, "company" | "rulesVersion">): { kpis: KpiKey[]; margin: number } {
  const R = ruleSet(rulesVersionOf(s)).v5;
  if (!R) return { kpis: [], margin: 0 };
  return { kpis: [...new Set<KpiKey>(["caja", ...(SEASON_OBJECTIVES[s.company]?.kpis ?? [])])], margin: R.mandateMargin };
}

/**
 * Evaluación autoral de una opción. Hasta v7, se deriva del score. Desde v8, una opción de score 2 defendible (sin
 * línea roja, no dominada y con balance esperado dentro de la banda editorial de la mejor) usa la información clave
 * y reconoce su costo: suma 6 y llega a «bien razonado» salvo que gaste lo que el tablero dice que está en riesgo.
 */
export function authoredFor(item: Pick<Item, "id" | "options">, optionId: string, v: number): AuthoredJudgment {
  const o = item.options.find((x) => x.id === optionId);
  const score = o?.score ?? 0;
  // v8: cruzar una línea roja nunca cuenta como bien razonado, aunque la opción ayude al tablero.
  if (ruleSet(v).judgment && isRedLine(item.id, optionId, v)) return authoredFromScore(0);
  if (score === 2 && ruleSet(v).judgment?.defensibleScore2 && isDefensibleOption(item, optionId, v)) {
    return { analiza: 2, consulta: 1, anticipa: 1, negocia: 1, ejecuta: 1 };
  }
  return authoredFromScore(score);
}

/** Criterio de la temporada (V5): asuntos bien razonados (nivel ≥ 2 de la rúbrica contextual) sobre asuntos cerrados. */
export function judgmentShareOf(s: CeoState, now = nowOf(s)): { good: number; total: number; ratio: number } {
  const k = { ...packOf(s).kpiStart };
  const line = rulesFor(s).passLine, v = rulesVersionOf(s), m = mandateOf(s);
  let good = 0, total = 0;
  for (const e of entries(s, now)) {
    if (e.status !== "decidido" && e.status !== "vencido") continue;
    total++;
    if (e.status === "decidido" && e.option) {
      const os: ContextOption[] = e.item.options.map((o) => ({ id: o.id, score: o.score, effects: scaled(expectedEffects(o), s.tier, v) }));
      const me = os.find((o) => o.id === e.option!.id);
      if (me && judge(authoredFor(e.item, me.id, v), prioritizes(me, os, k, line, m.kpis, m.margin)).level >= 2) good++;
    }
    const eff = effectOf(s, e);
    for (const key of Object.keys(eff) as KpiKey[]) k[key] = clamp(k[key] + (eff[key] ?? 0));
  }
  return { good, total, ratio: total ? good / total : 0 };
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
  const pool = dilemmasOpen(s, now).filter((d) => !sameSituation(d.id).some((id) => answered[id]));
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
  if (!d || !d.options[option] || sameSituation(id).some((x) => s.dilemmas?.[x])) return s;
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
    const p = withBank(companyById(r.company));
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
    { id: "ascenso", name: "Primer cierre aprobado", text: "El consejo aprobó por primera vez tu cierre en todos los rubros.", on: passed.length >= 1 },
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
  // Cadena (v8+): un eslabón que ya está en camino (`after`) también se espera; no existe en periodos anteriores.
  return epsOk && base.every((i) => done(i.id)) && !es.some((e) => e.status === "pendiente" || (e.status === "futuro" && (!e.item.trigger || !!e.item.after?.length)));
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
  /** Veredicto V5 (solo temporadas con reglas v5): resultado del negocio + criterio, con razones en lenguaje llano. */
  v5?: VerdictV5;
}
export type V5Reason = "insolvencia" | "consejo_perdido" | "linea_roja" | "objetivo" | "piso" | "salud" | "criterio";
export interface VerdictV5 {
  reasons: V5Reason[];
  why: string[];
  objectives: { kpi: KpiKey; value: number; ok: boolean }[];
  objectiveText: string;
  floor: number;
  healthMin: number;
  judgment: { good: number; total: number; ratio: number; min: number };
  cashFlow: number;
  business: boolean;
}
export function verdictOf(s: CeoState, now = nowOf(s)): Verdict {
  const k = kpis(s, now);
  const r = rulesFor(s);
  const es = entries(s, now).filter((e) => e.status === "decidido" || e.status === "vencido");
  const answered = es.length ? es.filter((e) => e.status === "decidido").length / es.length : 0;
  const approved = Object.fromEntries(KPI_KEYS.map((x) => [x, k[x] >= r.passLine])) as Record<KpiKey, boolean>;
  const allApproved = KPI_KEYS.every((x) => approved[x]);
  const answeredOk = answered >= r.minAnswered;
  const R5 = ruleSet(rulesVersionOf(s)).v5;
  if (!R5) return { kpis: k, health: healthOf(k), passLine: r.passLine, approved, allApproved, answered, answeredOk, passed: allApproved && answeredOk };
  const v5 = verdictV5(s, now, k, r.passLine, R5);
  return { kpis: k, health: healthOf(k), passLine: r.passLine, approved, allApproved, answered, answeredOk, passed: v5.reasons.length === 0, v5 };
}

function verdictV5(s: CeoState, now: number, k: Kpis, line: number, R5: NonNullable<ReturnType<typeof ruleSet>["v5"]>): VerdictV5 {
  const C = R5.verdict;
  const reasons: V5Reason[] = [];
  const why: string[] = [];
  const L = KPI_LABEL;
  if (k.caja < C.insolvency) { reasons.push("insolvencia"); why.push(`La caja cerró en ${k.caja}: zona de insolvencia (menos de ${C.insolvency}). Ningún otro indicador compensa quedarse sin dinero.`); }
  if (k.consejo < C.boardLost) { reasons.push("consejo_perdido"); why.push(`El consejo cerró en ${k.consejo}: ya no te sostiene (menos de ${C.boardLost}).`); }
  const red = redLineEntries(s, now);
  if (red.length) { reasons.push("linea_roja"); why.push(`Cruzaste una línea roja en «${red[0].item.subject}»: seguridad, fraude, represalia, engañar u ocultarle un riesgo al cliente no se compensan con resultados.`); }
  const obj = SEASON_OBJECTIVES[s.company];
  const objectives = (obj?.kpis ?? []).map((x) => ({ kpi: x, value: k[x], ok: k[x] >= line }));
  for (const o of objectives.filter((x) => !x.ok)) why.push(`${L[o.kpi]} era uno de los dos objetivos que te encargó el consejo y cerró en ${o.value} (línea ${line}).`);
  if (objectives.some((o) => !o.ok)) reasons.push("objetivo");
  const floor = line - C.floorBelowLine;
  const under = KPI_KEYS.filter((x) => k[x] < floor && !(x === "caja" && k.caja < C.insolvency) && !(x === "consejo" && k.consejo < C.boardLost));
  if (under.length) { reasons.push("piso"); why.push(`${under.map((x) => `${L[x]} (${k[x]})`).join(", ")} quedó por debajo del piso de ${floor}: sacrificaste un indicador por completo.`); }
  const health = healthOf(k), healthMin = line + C.healthAboveLine;
  if (health < healthMin) { reasons.push("salud"); why.push(`La salud promedio de la empresa cerró en ${health}; se pide ${healthMin} o más.`); }
  const business = reasons.length === 0;
  const j = judgmentShareOf(s, now);
  if (j.ratio < C.minJudgment) { reasons.push("criterio"); why.push(`${j.good} de ${j.total} asuntos estuvieron bien razonados (${Math.round(j.ratio * 100)} %); se pide al menos ${Math.round(C.minJudgment * 100)} %. Los que dejaste vencer cuentan como no razonados.`); }
  return { reasons, why, objectives, objectiveText: obj?.text ?? "", floor, healthMin, judgment: { ...j, min: C.minJudgment }, cashFlow: cashFlowOf(s, k), business };
}

/**
 * Asuntos donde cruzaste una línea roja: por decisión (siempre) o, desde v8, por omisión cuando dejar vencer equivale
 * a la conducta (sin tu decisión alguien la ejecutó en tu nombre).
 */
export function redLineEntries(s: CeoState, now = nowOf(s)): Entry[] {
  const v = rulesVersionOf(s);
  return entries(s, now).filter((e) =>
    (e.status === "decidido" && e.decision && isRedLine(e.item.id, e.decision.option, v)) ||
    (e.status === "vencido" && isOmissionRedLine(e.item.id, v)));
}

/** Siguiente empresa: aleatoria entre las que no has aprobado (estable por jugador). */
export function nextCompanyOf(s: CeoState): { id: string; legendary: boolean } {
  const passed = new Set((s.career ?? []).filter((r) => r.passed).map((r) => r.company));
  passed.add(s.company);
  const left = LEGACY_ROTATION.filter((c) => !passed.has(c.id));
  const pool = left.length ? left : LEGACY_ROTATION.filter((c) => c.id !== s.company);
  const pick = pool[Math.floor(rand01(`${s.alias || s.name}|${(s.career ?? []).length}|next`) * pool.length)] ?? LEGACY_ROTATION[0];
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
  // Carrera continua (P0-D): el mes se cierra cuando atendiste sus casos Y revisaste el reporte del mes anterior.
  if (reportDueOf(s) !== null) return s;
  const run = closeRun(s, now);
  const career = [...(s.career ?? []), run];
  const after = { ...s, career };
  if (isContinuous(s)) {
    // El periodo nuevo usa la versión continua que manda quien cierra (la app manda la vigente). Si no manda una
    // versión continua (jugadas registradas antes de v6), sigue en v4: reproducir el diario nunca cambia el pasado.
    const v = ruleSet(rulesVersion).career === "continua" ? rulesVersion : LEGACY_CONTINUOUS_RULES_VERSION;
    // Revisión del consejo (P1-B): sin despido ni game over. Si aprueba y ya cumpliste los meses, la empresa pasa
    // de etapa; la exigencia sigue a la etapa y nunca baja.
    const st = companyStageOf(after);
    const profile = { ...s.companyProfile!, stage: stageIdOf(st.idx) };
    return { ...fresh(after, s.company, Math.max(s.tier, st.idx), now, undefined, v), companyProfile: profile };
  }
  if (!run.passed) return fresh(after, s.company, s.tier, now, undefined, rulesVersion);
  const next = nextCompanyOf(after);
  const passedCount = career.filter((r) => r.passed).length;
  const legendary = next.legendary || !!s.legendary;
  return fresh(after, next.id, passedCount + (legendary ? 1 : 0), now, legendary, rulesVersion);
}

/** Periodos cerrados de la empresa actual (carrera continua). Cada uno es un mes del negocio. */
export function closedRunsOf(s: Pick<CeoState, "companyProfile" | "career">) {
  const p = s.companyProfile;
  if (!p) return [];
  return (s.career ?? []).filter((r) => r.company === p.contentPackId && r.startedAt >= p.appointedAt);
}
export interface BoardReview {
  /** Etapa en curso y la que sigue (null en la última). */
  stage: number;
  next: number | null;
  /** Meses que lleva en la etapa (sin contar el mes en curso) y mínimos para salir de ella. */
  months: number;
  /** ¿Cerrar el mes en curso, con el veredicto de hoy, pasa a la siguiente etapa? */
  advances: boolean;
  passed: boolean;
}
/** Revisión del consejo del mes en curso (carrera continua). Null en temporadas. */
export function boardReviewOf(s: CeoState, now = nowOf(s)): BoardReview | null {
  if (!isContinuous(s)) return null;
  const st = companyStageOf(s);
  const passed = verdictOf(s, now).passed;
  return { stage: st.idx, next: st.idx < LAST_COMPANY_STAGE ? st.idx + 1 : null, months: st.months, passed, advances: closesStage(st.idx, st.months, passed) };
}

/** Mes cuyo reporte espera tu revisión (el último cerrado), o null. Solo carrera continua. */
export function reportDueOf(s: CeoState): number | null {
  if (!isContinuous(s)) return null;
  const p = closedRunsOf(s).length;
  return p >= 1 && !(s.business?.reviewed ?? []).includes(p) ? p : null;
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
 * La combinación sector/industria/tipo debe tener casos aprobados. El periodo nuevo usa las reglas continuas vigentes
 * (v6); una jugada registrada sin versión (anterior a v6) abre v4.
 */
export function setupCompany(s: CeoState, input: Omit<NewCompanyInput, "at">, now = nowOf(s), rulesVersion: number = CONTINUOUS_RULES_VERSION): CeoState {
  if (s.companyProfile || Object.keys(s.decisions).length) return s;
  const profile = newCompanyProfile({ ...input, at: now }, TAXONOMY_VERSION);
  if (!profile) return s;
  // Los supuestos del negocio se congelan al crear la empresa (como las reglas de una temporada).
  const v = ruleSet(rulesVersion).career === "continua" ? rulesVersion : LEGACY_CONTINUOUS_RULES_VERSION;
  return { ...fresh(s, profile.contentPackId, s.tier, now, undefined, v), careerMode: "continua", companyProfile: profile, business: { assumptionsVersion: ASSUMPTIONS_VERSION, allocations: [] } };
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
