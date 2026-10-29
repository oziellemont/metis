import { describe, expect, it } from "vitest";
import { CADENCE_POLICY_VERSION, VACATIONS_PER_SEASON, VACATION_MAX_DAYS, cadenceStatus, canPause, canQuiet, lighterGoal, markReturnSeen, pauseCareer, quietUntil, resumeCareer, returnDue, returnSummary, schedKey, startQuietDay, unscheduleAll } from "./cadence";
import { DAY, H, decide, entries, kpis, localMidnight, migrate, newState, pinArrived, seasonDay, streakOf, xpOf } from "./engine";
import { masteryOf } from "./mastery";
import { relationsOf } from "./relations";
import { applyAction, replay, type GameAction } from "./replay";
import { applyEvents, sanitizeAction } from "./journal";
import { jobsFor, type Sent } from "./schedule";
import { mergeCadence, mergeStates } from "./sync";
import { localHour } from "./schedule";
import type { CeoState } from "./types";

const T = Date.UTC(2026, 9, 1, 14); // 8:00 en Monterrey
const run = (over: Partial<CeoState> = {}): CeoState => {
  const s = newState();
  return { ...s, name: "Ana Torres", alias: "Ana T.", company: "cumbre", startedAt: T, savedAt: T, lastActiveAt: T, ...over, settings: { ...s.settings, email: "ana@x.mx", ...(over.settings ?? {}) } };
};
const pendingAt = (s: CeoState, t: number) => entries(s, t).filter((e) => e.status === "pendiente");
const statusMap = (s: CeoState, t: number) => Object.fromEntries(entries(s, t).map((e) => [e.item.id, e.status]));
/** Primer momento en que hay algo pendiente. */
function firstPending(s: CeoState) {
  for (let t = T; t < T + 3 * DAY; t += 5 * 60_000) { const p = pendingAt(s, t); if (p.length) return { t, e: p[0] }; }
  throw new Error("sin pendientes");
}

describe("vacaciones: plazos congelados y reanudación exacta (§8.3)", () => {
  it("pausar a mitad de un caso conserva exactamente su tiempo restante", () => {
    const s0 = run();
    const { t, e } = firstPending(s0);
    const at = t + 20 * 60_000;
    const left = entries(s0, at).find((x) => x.item.id === e.item.id)!.deadline - at;
    const p = pauseCareer(pinArrived(s0, at), at);
    expect(cadenceStatus(p, at)).toBe("vacation_paused");
    // Durante la pausa (aunque pasen semanas) el caso sigue pendiente y con el mismo tiempo restante.
    for (const d of [1, 7, 30, 59]) {
      const now = at + d * DAY;
      const x = entries(p, now).find((y) => y.item.id === e.item.id)!;
      expect(x.status).toBe("pendiente");
      expect(x.deadline - now).toBe(left);
    }
    const back = at + 12 * DAY + 3 * H;
    const r = resumeCareer(p, back);
    expect(cadenceStatus(r, back)).toBe("active");
    const x = entries(r, back).find((y) => y.item.id === e.item.id)!;
    expect(x.deadline - back).toBe(left);
    // Y se puede decidir al volver.
    const d = decide(r, e.item.id, e.item.options[0].id, back + 60_000);
    expect(d.decisions[e.item.id]).toBeTruthy();
  });

  it("nada llega durante la pausa y, al volver, lo futuro llega una sola vez, dentro de tu horario", () => {
    const s0 = run();
    const at = T + DAY + 10 * H; // día 2, 18:00 locales
    const p = pauseCareer(pinArrived(s0, at), at);
    const before = statusMap(p, at);
    const during = statusMap(p, at + 9 * DAY);
    expect(during).toEqual(before);
    const back = at + 9 * DAY + 2 * H;
    const r = resumeCareer(p, back);
    const es = entries(r, back + 40 * DAY);
    const ids = es.map((e) => e.item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of es) {
      if (before[e.item.id] !== "futuro") continue;
      expect(e.arrivesAt).toBeGreaterThan(back);
      const h = localHour(e.arrivesAt, r.settings.tz);
      expect(h).toBeGreaterThanOrEqual(r.settings.windowStart);
      expect(h).toBeLessThan(r.settings.windowEnd);
    }
    // Lo que estaba programado se recorrió días completos (misma hora del día).
    const raw = entries(s0, back + 40 * DAY);
    for (const e of es) {
      const o = raw.find((x) => x.item.id === e.item.id)!;
      if (before[e.item.id] === "futuro" && !e.item.trigger) expect((e.arrivesAt - o.arrivesAt) % DAY).toBe(0);
    }
  });

  it("no hay vencimientos, KPI negativos, pérdida de relaciones ni XP por estar ausente", () => {
    const s0 = run();
    const at = T + 30 * 60_000;
    const p = pauseCareer(pinArrived(s0, at), at);
    const later = at + 45 * DAY;
    expect(entries(p, later).filter((e) => e.status === "vencido")).toHaveLength(0);
    expect(kpis(p, later)).toEqual(kpis(p, at));
    expect(relationsOf(p, later)).toEqual(relationsOf(p, at));
    expect(xpOf(p, later)).toBe(xpOf(p, at));
    const m0 = masteryOf(p, at), m1 = masteryOf(p, later);
    expect(m1).toEqual(m0);
    // Sin pausa, en cambio, el mismo tiempo sí habría vencido asuntos.
    expect(entries(s0, later).filter((e) => e.status === "vencido").length).toBeGreaterThan(0);
  });

  it("de vacaciones no se puede jugar; reanudar y ajustes sí", () => {
    const s0 = run();
    const { t, e } = firstPending(s0);
    const p = applyAction(s0, { type: "pause", at: t, until: null }).state;
    expect(applyAction(p, { type: "decide", at: t + H, item: e.item.id, option: e.item.options[0].id }).applied).toBe(false);
    expect(applyAction(p, { type: "lesson", at: t + H, id: "l1" }).applied).toBe(false);
    expect(applyAction(p, { type: "settings", at: t + H, patch: { windowStart: 9 } }).applied).toBe(true);
    const r = applyAction(p, { type: "resume", at: t + 2 * H });
    expect(r.applied).toBe(true);
    expect(applyAction(r.state, { type: "decide", at: t + 3 * H, item: e.item.id, option: e.item.options[0].id }).applied).toBe(true);
  });

  it("el día de la temporada se congela durante la pausa y no retrocede al volver", () => {
    const s0 = run();
    const at = T + 2 * DAY + 2 * H; // día 3
    const p = pauseCareer(s0, at);
    expect(seasonDay(p, at)).toBe(3);
    expect(seasonDay(p, at + 10 * DAY)).toBe(3);
    const r = resumeCareer(p, at + 10 * DAY + H);
    expect(seasonDay(r, at + 10 * DAY + H)).toBe(3);
    expect(seasonDay(r, at + 11 * DAY + H)).toBe(4);
  });
});

describe("transiciones idempotentes y límites", () => {
  it("pausar dos veces o reanudar dos veces no cambia nada", () => {
    const s0 = run();
    const p = pauseCareer(s0, T + H);
    expect(pauseCareer(p, T + 2 * H)).toBe(p);
    const r = resumeCareer(p, T + 5 * H);
    expect(resumeCareer(r, T + 6 * H)).toBe(r);
    expect(resumeCareer(s0, T + H)).toBe(s0);
    expect(r.cadence).toEqual({ policyVersion: CADENCE_POLICY_VERSION, pauses: [{ kind: "vacation", from: T + H, to: T + 5 * H, plannedResumeAt: null }] });
    // Repetir la acción en el diario: la segunda no procede.
    const { rejected } = replay([{ type: "pause", at: T + H, until: null }, { type: "pause", at: T + H, until: null }, { type: "resume", at: T + 2 * H }, { type: "resume", at: T + 2 * H }], s0);
    expect(rejected).toEqual([1, 3]);
  });

  it("fecha de regreso razonable y máximo de vacaciones por empresa", () => {
    const s0 = run();
    expect(canPause(s0, T, T + (VACATION_MAX_DAYS + 1) * DAY)).toEqual({ ok: false, reason: "fecha_invalida" });
    expect(canPause(s0, T, T - 1)).toEqual({ ok: false, reason: "fecha_invalida" });
    expect(canPause(s0, T, T + 10 * DAY).ok).toBe(true);
    let s = s0;
    for (let i = 0; i < VACATIONS_PER_SEASON; i++) s = resumeCareer(pauseCareer(s, T + i * 2 * H), T + i * 2 * H + H);
    expect(canPause(s, T + 10 * H)).toEqual({ ok: false, reason: "limite" });
    expect(pauseCareer(s, T + 10 * H)).toBe(s);
    expect(canPause(newState(), T)).toEqual({ ok: false, reason: "sin_empresa" });
  });

  it("la fecha prevista no reactiva en silencio: sigues en pausa hasta pulsar «Reanudar ahora»", () => {
    const p = pauseCareer(run(), T + H, T + 3 * DAY);
    expect(cadenceStatus(p, T + 10 * DAY)).toBe("vacation_paused");
  });

  it("el diario limpia las acciones de ritmo", () => {
    expect(sanitizeAction({ type: "pause", at: 10, until: null })).toEqual({ type: "pause", at: 10, until: null });
    expect(sanitizeAction({ type: "pause", at: 10 })).toEqual({ type: "pause", at: 10, until: null });
    expect(sanitizeAction({ type: "pause", at: 10, until: 5 })).toBeNull();
    expect(sanitizeAction({ type: "resume", at: 10, extra: 1 })).toEqual({ type: "resume", at: 10 });
    expect(sanitizeAction({ type: "quiet", at: 10, until: 20 })).toEqual({ type: "quiet", at: 10, until: 20 });
    expect(sanitizeAction({ type: "quiet", at: 10 })).toBeNull();
  });

  it("migrate descarta pausas dañadas y cierra una abierta que no es la última", () => {
    const m = migrate({ ...run(), cadence: { pauses: [{ kind: "vacation", from: 100, to: null }, { kind: "quiet", from: 50, to: 80 }, { kind: "x", from: 1, to: 2 }, { kind: "quiet", from: 300, to: null }, { kind: "vacation", from: 200, to: 250 }] } });
    expect(m.cadence!.pauses).toEqual([{ kind: "quiet", from: 50, to: 80 }, { kind: "vacation", from: 100, to: 200 }, { kind: "vacation", from: 200, to: 250 }]);
    expect(migrate({ ...run(), cadence: "roto" }).cadence).toBeUndefined();
  });
});

describe("avisos: el cron no manda nada en pausa (§8.3)", () => {
  it("una corrida tardía o duplicada en pausa no genera vencimientos ni avisos", () => {
    const s0 = run();
    const at = T + 30 * 60_000;
    const p = pauseCareer(pinArrived(s0, at), at);
    for (const d of [0.5, 1, 2, 3, 10, 30]) {
      const real = at + d * DAY;
      expect(jobsFor(p, {}, real)).toEqual([]);
      expect(jobsFor(p, {}, real, { plan: true })).toEqual([]);
      expect(entries(p, real).some((e) => e.status === "vencido")).toBe(false);
    }
    // Sin pausa, a la misma hora sí habría avisos.
    expect(jobsFor(s0, {}, at + DAY + 2 * H, { plan: true }).length).toBeGreaterThan(0);
  });

  it("al reanudar, cada asunto se avisa una sola vez", () => {
    const s0 = run();
    const at = T + 30 * 60_000;
    const p = pauseCareer(pinArrived(s0, at), at);
    const back = at + 5 * DAY;
    const r = resumeCareer(p, back);
    const sent: Sent = {};
    const keys: string[] = [];
    for (let t = back; t < back + 3 * DAY; t += 15 * 60_000) for (const j of jobsFor(r, sent, t)) { keys.push(j.key); sent[j.key] = t; }
    const cases = keys.filter((k) => k.startsWith("case:"));
    expect(cases.length).toBeGreaterThan(0);
    expect(new Set(cases).size).toBe(cases.length);
  });

  it("al pausar se cancelan los correos programados y se liberan para reprogramarse una vez", () => {
    const real = T;
    const sent: Sent = { "case:a": T - 10, [schedKey("case:a")]: `id-a|${new Date(T + H).toISOString()}`, "case:b": T - 20, [schedKey("case:b")]: `id-b|${new Date(T - H).toISOString()}`, welcome: 1 };
    const u = unscheduleAll(sent, real);
    expect(u.ids).toEqual(["id-a"]);
    expect(u.sent).toEqual({ "case:b": T - 20, welcome: 1 });
    // Segunda corrida: nada más que hacer.
    const again = unscheduleAll(u.sent, real + 15 * 60_000);
    expect(again).toEqual({ ids: [], sent: u.sent, changed: false });
  });
});

describe("zona horaria y conexión", () => {
  it("reanudar en otra zona horaria no resta horas ni duplica eventos", () => {
    const s0 = run();
    const { t, e } = firstPending(s0);
    const p = pauseCareer(pinArrived(s0, t), t);
    const left = entries(p, t).find((x) => x.item.id === e.item.id)!.deadline - t;
    // De viaje: cambia su zona durante la pausa y reanuda en Madrid.
    const moved = applyAction(p, { type: "settings", at: t + 3 * DAY, patch: { tz: "Europe/Madrid" } }).state;
    const back = t + 8 * DAY;
    const r = resumeCareer(moved, back);
    const x = entries(r, back).find((y) => y.item.id === e.item.id)!;
    expect(x.deadline - back).toBe(left);
    const ids = entries(r, back + 60 * DAY).map((y) => y.item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(entries(r, back).filter((y) => y.status === "vencido")).toHaveLength(0);
  });

  it("sin conexión no es abandono: lo jugado offline antes de pausar entra tarde y sin castigo", () => {
    const s0 = run();
    const { t, e } = firstPending(s0);
    const acts: GameAction[] = [
      { type: "decide", at: t + 60_000, item: e.item.id, option: e.item.options[0].id },
      { type: "pause", at: t + H, until: null },
      { type: "resume", at: t + 6 * DAY },
    ];
    const live = replay(acts, s0).state;
    // El servidor recibe el lote días después (el dispositivo estuvo sin red).
    const late = applyEvents(s0, acts.map((a, i) => ({ eventId: `00000000-0000-4000-8000-00000000000${i}`, seq: i + 1, action: a })), t + 9 * DAY);
    expect(late.rejected).toBe(0);
    expect(late.state.decisions).toEqual(live.decisions);
    expect(late.state.cadence).toEqual(live.cadence);
    // Y la falta de conexión por sí sola no pausa ni marca nada.
    expect(cadenceStatus(s0, t + 9 * DAY)).toBe("active");
  });

  it("dos dispositivos: uno viejo no quita la pausa; el que reanuda manda", () => {
    const s0 = run();
    const p = { ...pauseCareer(s0, T + H), savedAt: T + H };
    const old = { ...s0, savedAt: T + 2 * H }; // otro dispositivo guardó después, sin saber de la pausa
    const m = mergeStates(old, p)!;
    expect(cadenceStatus(m.state, T + 3 * H)).toBe("vacation_paused");
    const r = { ...resumeCareer(p, T + 5 * H), savedAt: T + 5 * H };
    const m2 = mergeStates(p, r)!;
    expect(cadenceStatus(m2.state, T + 6 * H)).toBe("active");
    expect(mergeCadence(p.cadence, r.cadence)!.pauses).toEqual(r.cadence!.pauses);
  });
});

describe("rachas neutrales y regreso sin culpa (§8.3)", () => {
  it("la pausa no inventa racha ni la rompe", () => {
    let s = run({ settings: { ...newState().settings, intensivo: true } });
    // Tres días seguidos con lección.
    for (let d = 0; d < 3; d++) s = applyAction(s, { type: "lesson", at: T + d * DAY + H, id: `l${d}` }).state;
    expect(streakOf(s, T + 2 * DAY + 2 * H).days).toBe(3);
    const at = T + 2 * DAY + 3 * H;
    s = pauseCareer(s, at);
    const during = streakOf(s, at + 10 * DAY);
    expect(during.days).toBe(3); // no suma por estar ausente
    expect(during.atRisk).toBe(false);
    s = resumeCareer(s, at + 10 * DAY);
    s = applyAction(s, { type: "lesson", at: at + 10 * DAY + H, id: "l9" }).state;
    const st = streakOf(s, at + 10 * DAY + 2 * H);
    expect(st.days).toBe(4); // sigue donde estaba
    expect(st.best).toBe(4);
    expect(st.week.some((d) => d.paused)).toBe(true);
  });

  it("quien vuelve tras 30 días de vacaciones ve la bienvenida, el resumen y la opción de un ritmo más ligero", () => {
    const s0 = run();
    const { t, e } = firstPending(s0);
    let s = decide(pinArrived(s0, t), e.item.id, e.item.options[0].id, t + 60_000);
    s = pauseCareer(pinArrived(s, t + H), t + H);
    expect(returnDue(s, t + 20 * DAY)).toBeNull(); // durante la pausa va la pantalla de descanso
    const back = t + 30 * DAY;
    s = resumeCareer(s, back);
    expect(returnDue(s, back + 60_000)).toBe("vacaciones");
    const sum = returnSummary(s, back + 60_000);
    expect(sum.decided).toBe(1);
    expect(sum.last[0].subject).toBe(e.item.subject);
    expect(sum.waiting.every((w) => w.leftMs > 0)).toBe(true);
    expect(sum.health).toBeGreaterThan(0);
    expect(lighterGoal(2)).toBe(1);
    expect(lighterGoal(1)).toBe(1);
    expect(lighterGoal(3)).toBe(2);
    // Una vez vista, no se repite.
    s = markReturnSeen(s, back + 2 * 60_000);
    expect(returnDue(s, back + 3 * 60_000)).toBeNull();
    // Sin dominio en 0: lo que demostraste antes de irte sigue igual al volver.
    expect(masteryOf(s, back + 60_000)).toEqual(masteryOf(s, t + H));
  });

  it("tras 7+ días sin entrar (sin pausa) también se recibe con calma", () => {
    const s0 = run();
    expect(returnDue(s0, T + 3 * DAY)).toBeNull();
    expect(returnDue(s0, T + 8 * DAY)).toBe("ausencia");
    expect(returnDue(markReturnSeen(s0, T + 8 * DAY), T + 8 * DAY + H)).toBeNull();
  });
});

describe("día tranquilo (distinto de vacaciones)", () => {
  it("hasta la medianoche: no llegan asuntos nuevos, los plazos se detienen y puedes seguir jugando", () => {
    const s0 = run();
    const { t, e } = firstPending(s0);
    const q = startQuietDay(pinArrived(s0, t), t);
    expect(cadenceStatus(q, t + H)).toBe("quiet_day");
    const end = quietUntil(t, q.settings.tz);
    expect(end).toBe(localMidnight(t, q.settings.tz) + DAY);
    const x0 = entries(q, t).find((y) => y.item.id === e.item.id)!;
    const x1 = entries(q, end - 60_000).find((y) => y.item.id === e.item.id)!;
    expect(x1.deadline).toBe(x0.deadline); // el reloj del caso no corre durante el día tranquilo
    const raw = entries(pinArrived(s0, t), t).find((y) => y.item.id === e.item.id)!;
    expect(x0.deadline - raw.deadline).toBe(end - t); // se recorre exactamente lo que dura el día tranquilo
    const before = statusMap(q, t);
    expect(statusMap(q, end - 60_000)).toEqual(before); // nada nuevo llegó
    expect(jobsFor(q, {}, t + 2 * H)).toEqual([]);
    // Se puede decidir (no es vacaciones).
    expect(applyAction(q, { type: "decide", at: t + H, item: e.item.id, option: e.item.options[0].id }).applied).toBe(true);
    // Al día siguiente vuelve el ritmo normal.
    expect(cadenceStatus(q, end + 1)).toBe("active");
  });

  it("un día tranquilo nunca vence decisiones ocultas y no se encadena", () => {
    const s0 = run();
    const { t } = firstPending(s0);
    const q = startQuietDay(pinArrived(s0, t), t);
    const end = quietUntil(t, q.settings.tz);
    expect(entries(q, end - 1).some((e) => e.status === "vencido")).toBe(false);
    expect(canQuiet(q, end + H)).toEqual({ ok: false, reason: "reciente" });
    expect(startQuietDay(q, t + H)).toBe(q);
    expect(canQuiet(q, t + 8 * DAY).ok).toBe(true);
  });

  it("vacaciones durante un día tranquilo: el día tranquilo termina donde empieza la pausa", () => {
    const s0 = run();
    const q = startQuietDay(s0, T + H);
    const p = pauseCareer(q, T + 2 * H);
    expect(p.cadence!.pauses[0].to).toBe(T + 2 * H);
    expect(cadenceStatus(p, T + 3 * H)).toBe("vacation_paused");
  });
});
