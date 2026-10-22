/**
 * mêtis CEO · motor del simulador. Lógica pura (sin React ni navegador) para usarla
 * igual en la app, en el cron que agenda correos/WhatsApp y en las pruebas.
 */
import type { Axis, CeoState, Entry, Item, KpiKey, Kpis, Option, Settings } from "./types";
import { ITEMS, SEASON_DAYS } from "./cases";

export const H = 3_600_000;
export const DAY = 24 * H;
export const DEFAULT_DEADLINE_H = 24;

export const KPI_START: Kpis = { caja: 58, margen: 52, equipo: 55, clientes: 62, consejo: 60 };
export const KPI_LABEL: Record<KpiKey, string> = { caja: "Caja", margen: "Margen", equipo: "Equipo", clientes: "Clientes", consejo: "Consejo" };
export const KPI_HINT: Record<KpiKey, string> = {
  caja: "Semanas de operación cubiertas con el efectivo y las líneas disponibles.",
  margen: "Rentabilidad operativa: lo que queda de cada peso vendido.",
  equipo: "Clima, confianza y talento clave que se queda.",
  clientes: "Lealtad y salud de las cuentas que pagan la nómina.",
  consejo: "Confianza del consejo y de la familia fundadora en tu dirección.",
};

export const DEFAULT_SETTINGS: Settings = {
  tz: "America/Monterrey", windowStart: 8, windowEnd: 19, email: "", phone: "",
  notifyEmail: true, notifyWhatsapp: false, intensivo: false,
};

export function newState(): CeoState {
  return { v: 1, name: "", alias: "", startedAt: null, settings: { ...DEFAULT_SETTINGS }, decisions: {}, pinned: {}, read: {}, lessons: {}, lastActiveAt: 0, clockOffset: 0, savedAt: 0 };
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

const SLOTS_PER_DAY: Record<number, number> = {};
for (const it of ITEMS) SLOTS_PER_DAY[it.day] = Math.max(SLOTS_PER_DAY[it.day] ?? 0, it.slot);

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
  const n = SLOTS_PER_DAY[it.day] || 1;
  const part = span / n;
  return Math.round(base + ws * H + part * (it.slot - 1) + part * (0.1 + rand01(seed) * 0.8));
}

/** Qué eligió el jugador en un mensaje: id de opción, "__expired" o null si sigue abierto / no ha llegado. */
export function resolution(s: CeoState, itemId: string, now: number): string | null {
  const d = s.decisions[itemId];
  if (d) return d.option;
  const it = ITEMS.find((x) => x.id === itemId);
  if (!it || !isActive(s, it, now)) return null;
  const at = arrivalOf(s, it);
  return now >= at + (it.deadlineH ?? DEFAULT_DEADLINE_H) * H ? "__expired" : null;
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
  for (const it of ITEMS) {
    if (!isActive(s, it, now)) continue;
    let arrivesAt = arrivalOf(s, it);
    // Una consecuencia nunca llega antes de que se haya resuelto lo que la detona.
    if (it.trigger) {
      const t = s.decisions[it.trigger.item];
      if (t) arrivesAt = Math.max(arrivesAt, t.at + 2 * 60_000);
    }
    const deadline = arrivesAt + (it.deadlineH ?? DEFAULT_DEADLINE_H) * H;
    const decision = s.decisions[it.id];
    const status = decision ? "decidido" : now < arrivesAt ? "futuro" : now >= deadline ? "vencido" : "pendiente";
    out.push({ item: it, arrivesAt, deadline, status, decision, option: decision ? it.options.find((o) => o.id === decision.option) : undefined });
  }
  return out.sort((a, b) => a.arrivesAt - b.arrivesAt);
}

// ───────────────────────────────────────────── indicadores, XP, perfil
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function kpis(s: CeoState, now = nowOf(s)): Kpis {
  const k = { ...KPI_START };
  for (const e of entries(s, now)) {
    const eff = e.status === "decidido" ? e.option?.effects : e.status === "vencido" ? e.item.expired.effects : undefined;
    if (eff) for (const key of Object.keys(eff) as KpiKey[]) k[key] = clamp(k[key] + (eff[key] ?? 0));
  }
  return k;
}
export const healthOf = (k: Kpis) => Math.round((k.caja + k.margen + k.equipo + k.clientes + k.consejo) / 5);

export const XP = { decision: 20, perPoint: 10, onTime: 5, lesson: 30 };
export function xpOf(s: CeoState, now = nowOf(s)): number {
  let xp = 0;
  for (const e of entries(s, now)) {
    if (e.status !== "decidido" || !e.option || !e.decision) continue;
    xp += XP.decision + e.option.score * XP.perPoint;
    if (e.decision.at - e.arrivesAt <= (e.deadline - e.arrivesAt) / 2) xp += XP.onTime;
  }
  return xp + Object.keys(s.lessons).length * XP.lesson;
}

export const LEVELS = [
  { min: 0, name: "Gerente", short: "Gerente" },
  { min: 150, name: "Director de área", short: "Director" },
  { min: 400, name: "Director General", short: "Dir. General" },
  { min: 750, name: "CEO", short: "CEO" },
  { min: 1050, name: "CEO de consejo", short: "CEO ★" },
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
  Object.values(s.lessons).forEach((t) => days.add(dayKey(t, tz)));
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
  for (const e of entries(s, now)) {
    if (!e.option) continue;
    for (const a of Object.keys(e.option.style) as Axis[]) { sum[a] += e.option.style[a] ?? 0; cnt[a]++; }
  }
  const axes = AXES.map((a) => ({ ...a, value: cnt[a.key] ? Math.round((sum[a.key] / cnt[a.key]) * 50) : 0, n: cnt[a.key] }));
  return { axes, archetype: archetypeOf(axes), decisions: Object.keys(s.decisions).length };
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
  const base = ITEMS.filter((i) => !i.trigger).length;
  const baseDone = es.filter((e) => !e.item.trigger && e.status !== "futuro" && e.status !== "pendiente").length;
  return [
    { id: "primera", name: "Primera decisión", text: "Tomaste tu primera decisión como CEO.", on: decided >= 1 },
    { id: "racha3", name: "Tres al hilo", text: "3 días seguidos al frente.", on: st.best >= 3 },
    { id: "racha7", name: "Semana completa", text: "7 días seguidos al frente.", on: st.best >= 7 },
    { id: "puntual", name: "Nada se cae", text: "5 decisiones sin dejar vencer ningún asunto.", on: decided >= 5 && expired === 0 },
    { id: "gente", name: "Arquitecto social", text: "Llevaste el indicador de Equipo a 70 o más.", on: k.equipo >= 70 },
    { id: "caja", name: "Guardián de la caja", text: "Llevaste la Caja a 70 o más.", on: k.caja >= 70 },
    { id: "lector", name: "Teoría en mano", text: "Completaste 5 lecciones de mêtis Academy.", on: Object.keys(s.lessons).length >= 5 },
    { id: "temporada", name: "Primeros 90 días", text: "Cerraste la temporada completa.", on: baseDone >= base },
  ];
}

// ───────────────────────────────────────────── acciones
export function decide(s: CeoState, itemId: string, optionId: string, now = nowOf(s)): CeoState {
  const e = entries(s, now).find((x) => x.item.id === itemId);
  if (!e || e.status !== "pendiente") return s;
  if (!e.item.options.some((o: Option) => o.id === optionId)) return s;
  return { ...s, decisions: { ...s.decisions, [itemId]: { option: optionId, at: now } }, lastActiveAt: now };
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
  return Math.min(Math.max(d, 1), SEASON_DAYS);
}

/** Mensajes que llegan entre `from` y `to` (para que el cron agende correo y WhatsApp). */
export function arrivalsBetween(s: CeoState, from: number, to: number): Entry[] {
  return entries(s, to).filter((e) => e.arrivesAt >= from && e.arrivesAt < to && !e.decision);
}
