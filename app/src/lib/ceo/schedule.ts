/**
 * mêtis CEO · reglas de los avisos por correo. Lógica pura (sin red): decide QUÉ mandar a un jugador
 * en un momento dado. El cron la llama y se encarga de enviar.
 *
 * Es idempotente: cada aviso tiene una clave y se anota en `sent` (columna ceo.players.sent).
 * Si el cron corre cada 15 min, cada aviso sale una sola vez y a su hora.
 *
 *  case:<id>     asunto nuevo (del personaje), al llegar. Con `plan`, se programa en Resend a su hora exacta.
 *  rem:<id>      recordatorio de Paty cuando un asunto está por vencer
 *  digest:<día>  resumen de la mañana (desde el día 2)
 *  streak:<día>  racha en riesgo (al final de tu horario)
 *  nudge:<día>   «en la oficina preguntan por ti» (2+ días sin entrar)
 *  season        cierre de temporada
 *  welcome       bienvenida (si no salió al conectar la cuenta)
 *
 * En pausa (vacaciones o día tranquilo, ver cadence.ts) no se manda nada; el cron además cancela lo que
 * ya estaba programado en Resend y lo vuelve a programar una sola vez, a su nueva hora, al reanudar.
 */
import { STAGES, stageOf } from "./journey";
import { DAY, H, casesDoneOf, dayKey, entries, healthOf, kpis, levelOf, localMidnight, packOf, profileOf, rulesFor, seasonDay, seasonDoneOf, streakOf, verdictOf, xpOf } from "./engine";
import { LESSONS, rankOf } from "./lessons";
import type { CeoState, Entry, Kpis } from "./types";
import { currentPause } from "./pausetime";

export type Sent = Record<string, number | string>;
export type Job =
  | { key: string; kind: "case"; entry: Entry; at?: number }
  | { key: string; kind: "reminder"; entry: Entry; hoursLeft: number }
  | { key: string; kind: "welcome" }
  | { key: string; kind: "digest"; data: Digest; at?: number }
  | { key: string; kind: "streak"; streak: number; pending: number; lessonId?: string; lessonTitle?: string }
  | { key: string; kind: "nudge"; days: number; pending: Entry[] }
  | { key: string; kind: "season"; health: number; xp: number; level: string; archetype: string; archetypeText: string; decisions: number; bestStreak: number; passed: boolean; passLine: number; kpis: Kpis };

export interface Digest {
  day: number; seasonDays: number; kpis: Kpis; kpiDelta: Kpis; health: number; streak: number; xp: number; level: string;
  pending: Entry[]; expiredYesterday: Entry[]; decidedYesterday: number; todayCount: number; firstAt?: string; passLine: number;
}

const LOOKBACK = 6 * H;       // no mandar asuntos que llegaron hace más de 6 h
const REMIND_LEFT = 3 * H;    // recordatorio cuando faltan ≤ 3 h

export function localHour(ts: number, tz: string) {
  return (ts - localMidnight(ts, tz)) / H;
}
export function clockLabel(ts: number, tz: string) {
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(new Date(ts));
}

/**
 * @param real   hora real del servidor
 * @param plan   corrida diaria (plan Hobby): programa en Resend los asuntos de las próximas 24 h y manda el resumen sin importar la hora
 */
export function jobsFor(s: CeoState, sent: Sent, real: number, opts: { plan?: boolean } = {}): Job[] {
  if (!s.startedAt) return [];
  const now = real + (s.clockOffset || 0);          // el reloj del jugador (modo prueba puede ir adelantado)
  // 1.2: de vacaciones o en día tranquilo no sale ningún aviso (ni casos, ni racha, ni resumen, ni inactividad).
  if (currentPause(s, now)) return [];
  const { tz, windowStart, windowEnd } = s.settings;
  const h = localHour(now, tz);
  const today = dayKey(now, tz);
  const es = entries(s, now);
  const pending = es.filter((e) => e.status === "pendiente");
  const pack = packOf(s);
  const seasonDone = seasonDoneOf(s, now);
  const casesDone = casesDoneOf(s, now);
  const jobs: Job[] = [];
  const inWindow = h >= windowStart && h < windowEnd + 1;

  // 0 · bienvenida (respaldo: normalmente sale al conectar la cuenta)
  if (!sent.welcome && real - s.startedAt < 3 * DAY) jobs.push({ key: "welcome", kind: "welcome" });

  // 1 · asuntos que ya llegaron
  for (const e of pending) {
    const key = `case:${e.item.id}`;
    if (!sent[key] && e.arrivesAt >= now - LOOKBACK) jobs.push({ key, kind: "case", entry: e });
  }
  // 1b · corrida diaria: programar lo que llega en las próximas 24 h (solo lo que ya se sabe a qué hora llega)
  if (opts.plan) {
    const ahead = entries(s, now + DAY).filter((e) => e.arrivesAt > now && e.arrivesAt <= now + DAY && !e.decision);
    for (const e of ahead) {
      if (e.item.trigger && !s.decisions[e.item.trigger.item] && !e.item.trigger.options.includes("__expired")) continue;
      const key = `case:${e.item.id}`;
      if (!sent[key]) jobs.push({ key, kind: "case", entry: { ...e, status: "pendiente" }, at: e.arrivesAt - (s.clockOffset || 0) });
    }
  }

  // 2 · recordatorios de lo que está por vencer
  const nextStart = localMidnight(now, tz) + (h >= windowStart ? DAY : 0) + windowStart * H;
  for (const e of pending) {
    const key = `rem:${e.item.id}`;
    if (sent[key]) continue;
    const left = e.deadline - now;
    const span = e.deadline - e.arrivesAt;
    if (span < 5 * H || now - e.arrivesAt < H) continue; // plazos muy cortos o recién llegado: no molestar
    const lastCall = left <= REMIND_LEFT && inWindow;
    const beforeNight = h >= windowEnd - 1 && h < windowEnd + 1 && e.deadline < nextStart + 2 * H; // vence de noche o temprano
    if (left > 0 && (lastCall || beforeNight)) jobs.push({ key, kind: "reminder", entry: e, hoursLeft: left / H });
  }

  // 3 · resumen de la mañana (desde el día 2)
  const day = seasonDay(s, now);
  const startedToday = dayKey(s.startedAt, tz) === today;
  const digestKey = `digest:${today}`;
  const morning = h >= windowStart - 1 && h < windowStart + 3;
  if (!sent[digestKey] && !startedToday && !casesDone && (morning || opts.plan)) {
    const k = kpis(s, now);
    const xp = xpOf(s, now);
    const yStart = localMidnight(now, tz) - DAY, yEnd = localMidnight(now, tz);
    const todayEnd = yEnd + DAY;
    const todays = entries(s, todayEnd).filter((e) => e.arrivesAt >= yEnd && e.arrivesAt < todayEnd && e.arrivesAt > now - H);
    // En la corrida diaria se programa para 1 h antes de que empiece tu horario (o ya, si esa hora pasó).
    const digestAt = localMidnight(now, tz) + (windowStart - 1) * H - (s.clockOffset || 0);
    jobs.push({
      key: digestKey, kind: "digest", ...(opts.plan && !morning && digestAt > real + 5 * 60_000 ? { at: digestAt } : {}),
      data: {
        day, seasonDays: pack.season.days, kpis: k, passLine: rulesFor(s).passLine,
        kpiDelta: Object.fromEntries((Object.keys(k) as (keyof Kpis)[]).map((x) => [x, k[x] - pack.kpiStart[x]])) as unknown as Kpis,
        health: healthOf(k), streak: streakOf(s, now).days, xp, level: STAGES[stageOf(s)].name,
        pending, expiredYesterday: es.filter((e) => e.status === "vencido" && e.deadline >= yStart && e.deadline < yEnd),
        decidedYesterday: Object.values(s.decisions).filter((d) => d.at >= yStart && d.at < yEnd).length,
        todayCount: todays.length, firstAt: todays[0] ? clockLabel(todays[0].arrivesAt - (s.clockOffset || 0), tz) : undefined,
      },
    });
  }

  // 4 · racha en riesgo (última hora de tu horario)
  const st = streakOf(s, now);
  const streakKey = `streak:${today}`;
  if (!sent[streakKey] && st.atRisk && st.days >= 1 && h >= windowEnd - 1 && h < windowEnd + 1.5) {
    const rk = levelOf(xpOf(s, now)).i;
    const lesson = LESSONS.find((l) => !s.lessons[l.id] && rankOf(l) <= rk);
    jobs.push({ key: streakKey, kind: "streak", streak: st.days, pending: pending.length, lessonId: lesson?.id, lessonTitle: lesson?.title });
  }

  // 5 · inactividad: 2+ días sin entrar y con pendientes (máximo cada 3 días)
  const idle = now - (s.lastActiveAt || s.startedAt);
  const lastNudge = Math.max(0, ...Object.entries(sent).filter(([k]) => k.startsWith("nudge:")).map(([, v]) => Number(v) || 0));
  const nudges = Object.keys(sent).filter((k) => k.startsWith("nudge:")).length;
  if (idle >= 2 * DAY && pending.length && nudges < 3 && real - lastNudge >= 3 * DAY && h >= windowStart + 2 && h < windowEnd - 2 && !sent[`nudge:${today}`]) {
    jobs.push({ key: `nudge:${today}`, kind: "nudge", days: Math.floor(idle / DAY), pending });
  }

  // 6 · cierre de temporada
  // (una clave por empresa y vuelta: así cada empresa de la carrera tiene su propio cierre)
  const seasonKey = (s.career ?? []).length ? `season:${s.company}:${(s.career ?? []).length}` : "season";
  if (seasonDone && !sent[seasonKey]) {
    const k = kpis(s, now), xp = xpOf(s, now), pr = profileOf(s, now), v = verdictOf(s, now);
    jobs.push({ key: seasonKey, kind: "season", health: healthOf(k), xp, level: STAGES[stageOf(s)].name, archetype: pr.archetype.name, archetypeText: pr.archetype.text, decisions: pr.decisions, bestStreak: st.best, passed: v.passed, passLine: v.passLine, kpis: k });
  }

  // Si ya hay un asunto nuevo o un resumen, el recordatorio de racha sobra (no saturar).
  const hasMain = jobs.some((j) => j.kind === "case" && !j.at) || jobs.some((j) => j.kind === "digest");
  return hasMain ? jobs.filter((j) => j.kind !== "streak" && j.kind !== "nudge") : jobs;
}
