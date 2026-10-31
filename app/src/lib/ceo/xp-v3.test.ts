/**
 * 1.3 · El vencimiento deja de contar como dominio 0 y el XP pasa a ser por participación en temporadas nuevas.
 * Aceptación (adenda v3.2): ningún score histórico se pierde; sin recompensa por rapidez.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LEGACY_RULES_VERSION, RULES_VERSION, RULESETS, ruleSet } from "./rules";
import {
  DAY, H, advance, crisisPayNow, crisisXp, decide, effectOf, entries, entryXp, finishXp, lessonXp, migrate, newState, nextLessonXp,
  rulesVersionOf, runXp, seasonDoneOf, verdictOf, xpOf,
} from "./engine";
import { evidenceOf, masteryOf } from "./mastery";
import { applyAction, replay, type GameAction } from "./replay";
import { snapshotOf, type Golden } from "./golden/play";
import { recordCrisis } from "./crisis";
import { LESSONS } from "./lessons";
import type { CeoState } from "./types";

const DIR = join(__dirname, "golden", "data");
const GOLDENS: Golden[] = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));
const byId = (id: string) => GOLDENS.find((g) => g.id === id)!;
const lastOf = (g: Golden) => g.checkpoints[g.checkpoints.length - 1];
/** Dominio de cada partida dorada ANTES de 1.3 (con el vencido como calidad 0). */
const BEFORE: Record<string, Record<string, number>> = JSON.parse(readFileSync(join(__dirname, "golden", "mastery-antes-1.3.json"), "utf8"));

/** Reproduce una partida dorada, pero iniciada con las reglas nuevas (v2). */
function replayV2(g: Golden, upTo = g.actions.length): CeoState {
  const acts = g.actions.slice(0, upTo).map((a) => (a.type === "start" || a.type === "advance" ? { ...a, rulesVersion: 2 } : a)) as GameAction[];
  return replay(acts).state;
}
const T = Date.UTC(2026, 9, 5, 15);
const started = (over: Partial<CeoState> = {}): CeoState => ({ ...newState(), name: "Ana Torres", alias: "Ana T.", company: "cumbre", startedAt: T, savedAt: T, lastActiveAt: T, ...over });

describe("reglas v2 («XP v3») para temporadas nuevas", () => {
  it("las temporadas nuevas empiezan con v2; lo guardado sin versión sigue en v1", () => {
    // Desde P0 la vigente es v3 (v2 + casos ejecutivos); v2 sigue publicada para las temporadas que empezaron con ella.
    expect(RULES_VERSION).toBe(3);
    expect(newState().rulesVersion).toBe(3);
    const { rulesVersion: _, ...old } = newState();
    expect(rulesVersionOf(migrate(old))).toBe(LEGACY_RULES_VERSION);
  });
  it("v2 está congelada y v1 no cambió", () => {
    expect(Object.isFrozen(RULESETS[2])).toBe(true);
    expect(Object.isFrozen(RULESETS[2].xp)).toBe(true);
    expect(ruleSet(1).xp).toEqual({ decision: 20, perPoint: 10, onTime: 5, lesson: 30, dilemma: 10, dilemmaPoint: 5 });
    expect(ruleSet(1).participation).toBeUndefined();
  });
  it("tabla de participación: mismas proporciones que la auditoría 6.2, en la escala de siempre", () => {
    const R = ruleSet(2);
    expect(R.xp).toEqual({ decision: 20, perPoint: 0, onTime: 0, lesson: 30, dilemma: 20, dilemmaPoint: 0 });
    expect(R.crisisXp).toEqual({ contenida: 60, danos: 60, rebaso: 60 });
    expect(R.participation).toEqual({ finish: 100, oncePerCompany: true, lessonsPerDay: 5 });
    // 10 · 15 · 10 · 30 · 50 de la auditoría, ×2.
    expect([R.xp.decision, R.xp.lesson, R.xp.dilemma, R.crisisXp.danos, R.participation!.finish].map((x) => x / 2)).toEqual([10, 15, 10, 30, 50]);
  });
});

describe("ningún score histórico se pierde", () => {
  it.each(GOLDENS.map((g) => [g.id, g] as const))("%s: la partida legacy da exactamente el mismo resultado", (_id, g) => {
    let s = newState();
    let i = 0;
    for (const cp of g.checkpoints) {
      for (; i < cp.after; i++) s = applyAction(s, g.actions[i]).state;
      expect(snapshotOf(s, cp.at)).toEqual(cp.snapshot);
    }
  });
  it.each(GOLDENS.map((g) => [g.id, g] as const))("%s: ninguna competencia baja al dejar de contar los vencidos", (_id, g) => {
    const m = masteryOf(replay(g.actions).state, lastOf(g).at);
    for (const [c, v] of Object.entries(BEFORE[g.id])) expect(m[c as keyof typeof m].value).toBeGreaterThanOrEqual(v);
  });
  it("el XP de empresas ya cerradas se respeta tal cual, aunque la siguiente use v2", () => {
    const g = byId("forja-azar");
    const done = replay(g.actions.filter((a) => a.type !== "advance")).state;
    const at = lastOf(g).at;
    expect(seasonDoneOf(done, at)).toBe(true);
    const before = xpOf(done, at);
    const next = advance(done, at, 2);
    expect(next.career.at(-1)!.rulesVersion).toBe(1);
    expect(rulesVersionOf(next)).toBe(2);
    expect(xpOf(next, at)).toBe(before);
    // Las lecciones y dilemas ya ganados siguen valuándose con la versión de la carrera (v1).
    expect(lessonXp({ ...next, lessons: { a: at } })).toBe(30);
  });
});

describe("vencimiento: ausencia de evidencia, no dominio 0 (C2)", () => {
  it("cumbre-vencidos: los vencidos ya no bajan el dominio y la calidad sale solo de lo decidido", () => {
    const g = byId("cumbre-vencidos");
    const s = replay(g.actions).state;
    const at = lastOf(g).at;
    const ev = evidenceOf(s, at);
    expect(ev.some((e) => e.kind === "expired")).toBe(true);
    const m = masteryOf(s, at);
    let rose = 0;
    for (const [c, v] of Object.entries(BEFORE[g.id])) if (m[c as keyof typeof m].value > v) rose++;
    expect(rose).toBeGreaterThan(0);
    // `n` y `quality` solo cuentan decisiones y dilemas.
    for (const x of Object.values(m)) {
      const mine = ev.filter((e) => e.kind !== "expired" && e.competencies.includes(x.id));
      expect(x.n).toBe(mine.length);
    }
  });
  it("dejar vencer un asunto da lo mismo en dominio que no haberlo visto", () => {
    const s = started({ rulesVersion: 2 });
    const es = entries(s, T + 3 * DAY);
    const expired = es.filter((e) => e.status === "vencido");
    expect(expired.length).toBeGreaterThan(0);
    // Mismo estado, pero el reloj justo antes de que llegara el primer asunto: sin evidencia alguna.
    const empty = masteryOf(s, T);
    const after = masteryOf(s, T + 3 * DAY);
    for (const c of Object.keys(empty) as (keyof typeof empty)[]) expect(after[c].value).toBe(empty[c].value);
  });
  it("v2: el vencimiento tiene su consecuencia en la empresa, sin multiplicar por exigencia", () => {
    const hard = started({ rulesVersion: 2, tier: 6 });
    const e = entries(hard, T + 3 * DAY).find((x) => x.status === "vencido")!;
    expect(effectOf(hard, e)).toEqual(effectOf({ ...hard, tier: 0 }, e));
    const legacy = { ...hard, rulesVersion: 1 };
    const neg = Object.values(e.item.expired.effects).some((v) => (v ?? 0) < -1);
    if (neg) expect(effectOf(legacy, e)).not.toEqual(effectOf({ ...legacy, tier: 0 }, e));
  });
  it("v2: dejar vencer asuntos no reprueba por sí solo; v1 sí exigía el 80 %", () => {
    expect(ruleSet(2).minAnswered).toBe(0);
    const s = started({ rulesVersion: 2 });
    const v = verdictOf(s, T + 30 * DAY);
    expect(v.answered).toBe(0);
    expect(v.answeredOk).toBe(true);
    expect(verdictOf({ ...s, rulesVersion: 1 }, T + 30 * DAY).answeredOk).toBe(false);
  });
  it("un vencido no da ni quita XP", () => {
    const s = started({ rulesVersion: 2 });
    const at = T + 3 * DAY;
    for (const e of entries(s, at).filter((x) => x.status === "vencido")) expect(entryXp(s, e)).toBe(0);
    expect(runXp(s, at)).toBe(0);
  });
});

describe("XP por participación, sin recompensa por rapidez", () => {
  const firstPending = (s: CeoState) => {
    for (let t = T; t < T + 3 * DAY; t += 5 * 60_000) { const p = entries(s, t).find((e) => e.status === "pendiente"); if (p) return { t, e: p }; }
    throw new Error("sin pendientes");
  };
  it("v2: cualquier opción da el mismo XP", () => {
    const s = started({ rulesVersion: 2 });
    const { t, e } = firstPending(s);
    const xps = e.item.options.map((o) => runXp(decide(s, e.item.id, o.id, t + 60_000), t + 60_000));
    expect(new Set(xps).size).toBe(1);
    expect(xps[0]).toBe(20);
  });
  it("v2: decidir al primer minuto o al último da el mismo XP; en v1 el rápido ganaba +5", () => {
    for (const v of [1, 2]) {
      const s = started({ rulesVersion: v });
      const { t, e } = firstPending(s);
      const fast = decide(s, e.item.id, e.item.options[0].id, t + 60_000);
      const slow = decide(s, e.item.id, e.item.options[0].id, e.deadline - 60_000);
      const diff = runXp(fast, e.deadline) - runXp(slow, e.deadline);
      expect(diff).toBe(v === 1 ? 5 : 0);
    }
  });
  it("todas las partidas doradas con v2: el XP de asuntos es 20 × decididos, sin importar estrategia", () => {
    for (const g of GOLDENS) {
      const firstAdvance = g.actions.findIndex((a) => a.type === "advance");
      const cut = firstAdvance < 0 ? g.actions.length : firstAdvance;
      const s = replayV2(g, cut);
      const at = g.checkpoints.filter((c) => c.after <= cut).at(-1)!.at;
      const decided = entries(s, at).filter((e) => e.status === "decidido").length;
      expect(runXp(s, at) - finishXp(s, at)).toBe(20 * decided);
    }
  });
  it("la mejor y la peor partida reciben el mismo XP si participan igual", () => {
    const best = byId("cumbre-mejor"), worst = byId("cumbre-peor");
    const cut = (g: Golden) => g.actions.findIndex((a) => a.type === "advance");
    const a = replayV2(best, cut(best)), b = replayV2(worst, cut(worst));
    const at = (g: Golden) => g.checkpoints.filter((c) => c.after <= cut(g)).at(-1)!.at;
    expect(runXp(a, at(best))).toBe(runXp(b, at(worst)));
  });
  it("terminar la empresa da el bono de cierre una sola vez, apruebes o no", () => {
    const g = byId("cumbre-peor");
    const cut = g.actions.findIndex((a) => a.type === "advance");
    const s = replayV2(g, cut);
    const at = g.checkpoints.filter((c) => c.after <= cut).at(-1)!.at;
    expect(seasonDoneOf(s, at)).toBe(true);
    expect(verdictOf(s, at).passed).toBe(false);
    expect(finishXp(s, at)).toBe(100);
    // Repetir la misma empresa: ni los asuntos ya pagados ni el cierre vuelven a dar XP.
    const again = advance(s, at + 1000, 2);
    expect(again.company).toBe(s.company);
    const xp0 = xpOf(again, at + 1000);
    expect(xp0).toBe(xpOf(s, at));
    const e = entries(again, again.startedAt! + 2 * DAY).find((x) => x.status === "pendiente" || x.status === "vencido");
    if (e && e.status === "pendiente") {
      const d = decide(again, e.item.id, e.item.options[0].id, again.startedAt! + 2 * DAY);
      expect(entryXp(d, entries(d, again.startedAt! + 2 * DAY).find((x) => x.item.id === e.item.id)!)).toBe(0);
    }
  });
  it("repetir la empresa en v2 no vuelve a pagar asuntos (idempotencia por empresa)", () => {
    const g = byId("repite-y-asciende");
    const firstAdvance = g.actions.findIndex((a) => a.type === "advance");
    const s1 = replayV2(g, firstAdvance + 1);
    const prev = s1.career.at(-1)!;
    expect(prev.company).toBe(s1.company); // repitió
    const paid = new Set(Object.keys(prev.decisions));
    const end = replayV2(g);
    const at = lastOf(g).at;
    for (const e of entries(end, at).filter((x) => x.status === "decidido")) {
      expect(entryXp(end, e)).toBe(paid.has(e.item.id) ? 0 : 20);
    }
  });
  it("la crisis paga lo mismo con cualquier desenlace y una vez por empresa", () => {
    const s = started({ rulesVersion: 2 });
    for (const r of ["contenida", "danos", "rebaso"] as const) expect(crisisPayNow(s, r)).toBe(60);
    const once = recordCrisis(s, { rating: "rebaso", picks: {} }, T + 3 * DAY);
    expect(crisisXp(once)).toBe(60);
    // Segunda temporada de la misma empresa: la crisis ya se pagó.
    const later = { ...once, startedAt: T + 40 * DAY };
    expect(crisisPayNow(later, "contenida")).toBe(0);
    const twice = recordCrisis(later, { rating: "contenida", picks: {} }, T + 43 * DAY);
    expect(crisisXp(twice)).toBe(60);
    // Legacy: cada crisis paga según su desenlace, como siempre.
    const v1 = started({ rulesVersion: 1 });
    expect(crisisXp(recordCrisis(v1, { rating: "danos", picks: {} }, T + 3 * DAY))).toBe(30);
  });
  it("lecciones: tope diario de 5 con XP en carreras v2; en legacy no hay tope", () => {
    const ids = LESSONS.slice(0, 8).map((l) => l.id);
    const sameDay = Object.fromEntries(ids.map((id, i) => [id, T + i * 60_000]));
    const v2 = started({ rulesVersion: 2, lessons: sameDay });
    expect(lessonXp(v2)).toBe(5 * 30);
    expect(nextLessonXp(v2, T + H)).toBe(0);
    expect(nextLessonXp(v2, T + DAY)).toBe(30);
    const spread = Object.fromEntries(ids.map((id, i) => [id, T + i * DAY]));
    expect(lessonXp({ ...v2, lessons: spread })).toBe(8 * 30);
    expect(lessonXp({ ...v2, rulesVersion: 1, lessons: sameDay })).toBe(8 * 30);
  });
  it("dilemas: mismo XP para cualquier opción en carreras v2", () => {
    const g = byId("cumbre-mejor");
    const s = replayV2(g);
    const n = Object.keys(s.dilemmas ?? {}).length;
    expect(n).toBeGreaterThan(0);
    const at = lastOf(g).at;
    const lessons = lessonXp(s);
    const crisis = crisisXp(s);
    const past = s.career.reduce((a, r) => a + r.xp, 0);
    expect(xpOf(s, at) - past - runXp(s, at) - lessons - crisis).toBe(20 * n);
  });
  it("el XP por participación es parejo: rangos, etapas y ranking siguen en la misma escala", () => {
    for (const id of ["cumbre-mejor", "cumbre-peor", "forja-mejor", "brasa-peor"]) {
      const g = byId(id);
      const legacy = lastOf(g).snapshot.xp;
      const v2 = xpOf(replayV2(g), lastOf(g).at);
      expect(v2 / legacy).toBeGreaterThan(0.6);
      expect(v2 / legacy).toBeLessThan(1.6);
    }
  });
});
