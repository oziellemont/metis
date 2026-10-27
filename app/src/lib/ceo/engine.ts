/**
 * mêtis CEO · motor del simulador. Lógica pura (sin React ni navegador) para usarla
 * igual en la app, en el cron que agenda correos/WhatsApp y en las pruebas.
 */
import type { Axis, CareerRun, CeoState, CompanyPack, Decision, Entry, Item, KpiKey, Kpis, Option, Settings, Written } from "./types";
import { COMPANIES, FIRST_COMPANY, companyById } from "./companies";
import { DILEMMAS, dilemmaById, type Dilemma } from "./dilemmas";
import { changeEffect, simulate, type ChangeSim } from "./change";
import { sanitizeDiagnostic, sanitizeProfile } from "./profile";

export const H = 3_600_000;
export const DAY = 24 * H;
export const DEFAULT_DEADLINE_H = 24;

export const KPI_KEYS: KpiKey[] = ["caja", "margen", "equipo", "clientes", "consejo"];
/** Valores de la primera empresa (compatibilidad). Cada empresa trae los suyos en `kpiStart`. */
export const KPI_START: Kpis = { caja: 58, margen: 52, equipo: 55, clientes: 62, consejo: 60 };
export const KPI_LABEL: Record<KpiKey, string> = { caja: "Caja", margen: "Margen", equipo: "Equipo", clientes: "Clientes", consejo: "Consejo" };

// ───────────────────────────────────────────── empresa actual y exigencia
export const packOf = (s: Pick<CeoState, "company">): CompanyPack => companyById(s.company);

/**
 * Exigencia por nivel (tier). Cada empresa que apruebas sube un nivel; el modo Legendario suma 1 más.
 * Calibrado con simulaciones: en el nivel 0 un jugador cuidadoso aprueba con margen y uno al azar casi nunca.
 *  - los golpes pegan más fuerte y las buenas noticias rinden menos,
 *  - los plazos se acortan,
 *  - la línea de aprobación de cada rubro sube (el consejo exige más).
 */
export function rulesOf(tier: number) {
  const t = Math.max(0, Math.min(tier, 6));
  return {
    tier: t,
    hit: 1 + 0.08 * t,
    gain: Math.max(0.85, 1 - 0.03 * t),
    deadline: Math.max(0.5, 1 - 0.1 * t),
    passLine: Math.min(60, 50 + 2 * t),
    minAnswered: 0.8,
    name: ["Director debutante", "Director con oficio", "Director probado", "Director de alto riesgo", "Director de crisis", "Legendario", "Legendario+"][t],
  };
}
export function scaled(eff: Partial<Kpis> | undefined, tier: number): Partial<Kpis> {
  if (!eff) return {};
  const r = rulesOf(tier);
  const out: Partial<Kpis> = {};
  for (const k of Object.keys(eff) as KpiKey[]) {
    const v = eff[k] ?? 0;
    out[k] = v < 0 ? Math.round(v * r.hit) : Math.round(v * r.gain);
  }
  return out;
}
const deadlineOf = (s: CeoState, it: Item) => Math.max(3, Math.round((it.deadlineH ?? DEFAULT_DEADLINE_H) * rulesOf(s.tier).deadline));

export const DEFAULT_SETTINGS: Settings = {
  tz: "America/Monterrey", windowStart: 8, windowEnd: 19, email: "", phone: "",
  notifyEmail: true, notifyWhatsapp: false, intensivo: false,
};

export function newState(): CeoState {
  return { v: 2, name: "", alias: "", company: FIRST_COMPANY, tier: 0, career: [], startedAt: null, settings: { ...DEFAULT_SETTINGS }, decisions: {}, pinned: {}, read: {}, lessons: {}, lastActiveAt: 0, clockOffset: 0, savedAt: 0 };
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
  // Executive Journey: si viene dañado, se descarta (se vuelve a inscribir sin perder el piso fundador).
  const j = out.journey as unknown;
  if (j !== undefined && (!j || typeof j !== "object" || typeof (j as { stage?: unknown }).stage !== "number" || !Array.isArray((j as { appointments?: unknown }).appointments))) delete out.journey;
  // Perfil profesional (V33): opcional. Si falta, todo funciona igual; si viene dañado, se limpia o se descarta.
  if (out.profile !== undefined) { const p = sanitizeProfile(out.profile); if (p) out.profile = p; else delete out.profile; }
  if (out.diagnostic !== undefined) { const d = sanitizeDiagnostic(out.diagnostic); if (d) out.diagnostic = d; else delete out.diagnostic; }
  if (out.startTier !== undefined && (typeof out.startTier !== "number" || out.startTier < 0 || out.startTier > 1)) delete out.startTier;
  if (out.profileNudge !== undefined) { const n = out.profileNudge as unknown as Record<string, unknown>; if (!n || typeof n.dismissed !== "number" || typeof n.until !== "number") delete out.profileNudge; }
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

/** Hora de llegada de un mensaje (determinista para cada jugador). */
export function arrivalOf(s: CeoState, it: Item): number {
  if (s.pinned[it.id]) return s.pinned[it.id];
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
  const it = packOf(s).items.find((x) => x.id === itemId);
  if (!it || !isActive(s, it, now)) return null;
  const at = arrivalOf(s, it);
  return now >= at + deadlineOf(s, it) * H ? "__expired" : null;
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
  for (const it of packOf(s).items) {
    if (!isActive(s, it, now)) continue;
    let arrivesAt = arrivalOf(s, it);
    // Una consecuencia nunca llega antes de que se haya resuelto lo que la detona.
    if (it.trigger) {
      const t = s.decisions[it.trigger.item];
      if (t) arrivesAt = Math.max(arrivesAt, t.at + 2 * 60_000);
    }
    const deadline = arrivesAt + deadlineOf(s, it) * H;
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
  const eff = e.status === "decidido" ? e.option?.effects : e.status === "vencido" ? e.item.expired.effects : undefined;
  return scaled(eff, s.tier);
}
export function kpis(s: CeoState, now = nowOf(s)): Kpis {
  const k = { ...packOf(s).kpiStart };
  const es = entries(s, now);
  for (const e of es) {
    const eff = effectOf(s, e);
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
  const base = packOf(s).items.filter((i) => !i.trigger);
  return { done: base.filter((i) => done.has(i.id)).length, total: base.length };
}
/** Lo que el proyecto de cambio suma a los indicadores (cuando lo presentas al consejo o se acaban las semanas). */
export function changeKpiEffect(s: CeoState): Partial<Kpis> {
  if (!s.startedAt) return {};
  const sim = changeSimOf(s);
  return sim?.done ? scaled(changeEffect(sim), s.tier) : {};
}
export const healthOf = (k: Kpis) => Math.round((k.caja + k.margen + k.equipo + k.clientes + k.consejo) / 5);

export const XP = { decision: 20, perPoint: 10, onTime: 5, lesson: 30, dilemma: 10, dilemmaPoint: 5 };
/** XP de los dilemas de personas (viajan entre empresas). */
export function dilemmaXp(s: CeoState): number {
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
/** XP de las decisiones de la empresa actual (sin lecciones). */
export function runXp(s: CeoState, now = nowOf(s)): number {
  let xp = 0;
  for (const e of entries(s, now)) {
    if (e.status !== "decidido" || !e.option || !e.decision) continue;
    xp += XP.decision + e.option.score * XP.perPoint;
    if (e.decision.at - e.arrivesAt <= (e.deadline - e.arrivesAt) / 2) xp += XP.onTime;
  }
  return xp;
}
/** XP total de la carrera: empresas anteriores + la actual + lecciones. */
export function xpOf(s: CeoState, now = nowOf(s)): number {
  const past = (s.career ?? []).reduce((a, r) => a + (r.xp || 0), 0);
  return past + runXp(s, now) + Object.keys(s.lessons).length * XP.lesson + dilemmaXp(s);
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
  const today = dayKey(now, tz);
  const doneToday = days.has(today);
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
function lastDays(days: Set<string>, now: number, tz: string) {
  const out: { key: string; label: string; on: boolean; today: boolean }[] = [];
  const L = ["D", "L", "M", "M", "J", "V", "S"];
  for (let i = 6; i >= 0; i--) {
    const t = now - i * DAY;
    const key = dayKey(t, tz);
    out.push({ key, label: L[new Date(key + "T12:00:00Z").getUTCDay()], on: days.has(key), today: i === 0 });
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
  return changed ? { ...s, pinned } : s;
}

/** Modo prueba: adelanta el reloj hasta el siguiente mensaje. */
export function skipToNext(s: CeoState, real = Date.now()): CeoState {
  const now = nowOf(s, real);
  const next = entries(s, now).find((e) => e.status === "futuro");
  if (!next) return s;
  return { ...s, clockOffset: (s.clockOffset || 0) + (next.arrivesAt - now) + 1000 };
}

export function seasonDay(s: CeoState, now = nowOf(s)): number {
  if (!s.startedAt) return 0;
  const d = Math.floor((localMidnight(now, s.settings.tz) - localMidnight(s.startedAt, s.settings.tz)) / DAY) + 1;
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
  const base = packOf(s).items.filter((i) => !i.trigger);
  const done = (id: string) => es.some((e) => e.item.id === id && (e.status === "decidido" || e.status === "vencido"));
  return base.every((i) => done(i.id)) && !es.some((e) => e.status === "pendiente" || (e.status === "futuro" && !e.item.trigger));
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
  const r = rulesOf(s.tier);
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
    company: s.company, tier: s.tier, startedAt: s.startedAt ?? now, endedAt: now, kpis: v.kpis, health: v.health,
    answered: Math.round(v.answered * 100), passed: v.passed, xp: runXp(s, now), decisions: s.decisions as Record<string, Decision>,
    change: (() => { const sim = changeSimOf(s); return { adopted: sim?.adopted ?? 0, weeks: sim?.weeksUsed ?? 0, ok: !!sim?.ok }; })(),
  };
}
const fresh = (s: CeoState, company: string, tier: number, now: number, legendary?: boolean): CeoState => ({
  ...s, company, tier, legendary: legendary ?? s.legendary, startedAt: now, decisions: {}, pinned: {}, read: {}, change: undefined, lastActiveAt: now, savedAt: now,
});

/** Cierra la empresa actual y pasa a la siguiente (si aprobaste) o la repite (si no). */
export function advance(s: CeoState, now = nowOf(s)): CeoState {
  if (!seasonDoneOf(s, now)) return s;
  const run = closeRun(s, now);
  const career = [...(s.career ?? []), run];
  const after = { ...s, career };
  if (!run.passed) return fresh(after, s.company, s.tier, now);
  const next = nextCompanyOf(after);
  const passedCount = career.filter((r) => r.passed).length;
  const legendary = next.legendary || !!s.legendary;
  return fresh(after, next.id, passedCount + (legendary ? 1 : 0), now, legendary);
}

/** Cambiar de empresa a media temporada (solo antes de la primera decisión). */
export function switchCompany(s: CeoState, company: string, now = nowOf(s)): CeoState {
  if (Object.keys(s.decisions).length || !COMPANIES.some((c) => c.id === company)) return s;
  return fresh(s, company, s.tier, now);
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
