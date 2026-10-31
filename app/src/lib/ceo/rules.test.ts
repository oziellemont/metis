/**
 * 0.4 · reglas versionadas por temporada.
 * Aceptación: reproducción v2 idéntica y las partidas doradas siguen pasando, aun si existe una versión nueva.
 */
import { afterEach, describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LEGACY_RULES_VERSION, RULES_VERSION, RULESETS, isRulesVersion, knownRules, ruleSet, tierRules, type RuleSet } from "./rules";
import {
  CRISIS_XP, DEFAULT_DEADLINE_H, XP, advance, careerRulesVersionOf, crisisXp, entries, migrate, newState, rulesFor, rulesOf,
  rulesVersionOf, scaled, seasonDoneOf, switchCompany, verdictOf, xpOf,
} from "./engine";
import { applyAction, replay, type GameAction } from "./replay";
import { snapshotOf, type Golden } from "./golden/play";
import { markLegacy } from "./import";
import { recordCrisis } from "./crisis";
import type { CeoState } from "./types";

const DIR = join(__dirname, "golden", "data");
const GOLDENS: Golden[] = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));
const last = (g: Golden) => g.checkpoints[g.checkpoints.length - 1];
const byId = (id: string) => GOLDENS.find((g) => g.id === id)!;

/** Una versión 7 simulada y mucho más dura: si algo legacy la usara por error, los números cambiarían. */
const V2: RuleSet = {
  ...RULESETS[1], version: 7,
  tier: { ...RULESETS[1].tier, hitPerTier: 0.5, passBase: 58, passPerTier: 5, passMax: 75, deadlinePerTier: 0.3 },
  minAnswered: 0.95, defaultDeadlineH: 12,
  xp: { decision: 1, perPoint: 1, onTime: 1, lesson: 1, dilemma: 1, dilemmaPoint: 1 },
  crisisXp: { contenida: 1, danos: 1, rebaso: 1 },
};
const withV2 = () => { RULESETS[7] = V2; };
afterEach(() => { delete RULESETS[7]; });

describe("versión 1 = reglas legacy exactas", () => {
  it("la tabla de exigencia por nivel es la misma de siempre", () => {
    const expected = [
      [1, 1, 1, 50, "Director debutante"], [1.08, 0.97, 0.9, 52, "Director con oficio"], [1.16, 0.94, 0.8, 54, "Director probado"],
      [1.24, 0.91, 0.7, 56, "Director de alto riesgo"], [1.32, 0.88, 0.6, 58, "Director de crisis"], [1.4, 0.85, 0.5, 60, "Legendario"],
      [1.48, 0.85, 0.5, 60, "Legendario+"],
    ];
    expected.forEach(([hit, gain, deadline, passLine, name], t) => {
      const r = tierRules(t, 1);
      expect(r.hit).toBeCloseTo(hit as number, 10);
      expect(r.gain).toBeCloseTo(gain as number, 10);
      expect(r.deadline).toBeCloseTo(deadline as number, 10);
      expect({ passLine: r.passLine, name: r.name, minAnswered: r.minAnswered }).toEqual({ passLine, name, minAnswered: 0.8 });
    });
    expect(tierRules(-3, 1).tier).toBe(0);
    expect(tierRules(99, 1).tier).toBe(6);
  });
  it("XP, crisis y plazos legacy no cambian", () => {
    expect(ruleSet(1).xp).toEqual({ decision: 20, perPoint: 10, onTime: 5, lesson: 30, dilemma: 10, dilemmaPoint: 5 });
    expect(ruleSet(1).crisisXp).toEqual({ contenida: 60, danos: 30, rebaso: 10 });
    expect([ruleSet(1).defaultDeadlineH, ruleSet(1).minDeadlineH]).toEqual([24, 3]);
    // Las constantes públicas siguen diciendo lo mismo para los textos de la app.
    expect([XP, CRISIS_XP, DEFAULT_DEADLINE_H]).toEqual([ruleSet(RULES_VERSION).xp, ruleSet(RULES_VERSION).crisisXp, 24]);
    expect(rulesOf(2)).toEqual(tierRules(2, RULES_VERSION));
  });
  it("la versión 1 está congelada (nadie puede editarla por accidente)", () => {
    expect(Object.isFrozen(RULESETS[1])).toBe(true);
    expect(Object.isFrozen(RULESETS[1].xp)).toBe(true);
    expect(Object.isFrozen(RULESETS[1].tier)).toBe(true);
    expect(LEGACY_RULES_VERSION).toBe(1);
  });
});

describe("resolver la versión", () => {
  it("sin versión o con basura = legacy (nunca las reglas actuales)", () => {
    for (const v of [undefined, null, 0, -1, 1.5, NaN]) expect(ruleSet(v as number).version).toBe(LEGACY_RULES_VERSION);
    expect(isRulesVersion("2")).toBe(false);
    expect(knownRules(1)).toBe(true);
    expect(knownRules(7)).toBe(false);
  });
  it("una versión de una app más nueva usa la más alta conocida que no la supera", () => {
    expect(ruleSet(9).version).toBe(3);
    withV2();
    expect(ruleSet(9).version).toBe(7);
    expect(ruleSet(7).version).toBe(7);
    expect(ruleSet(5).version).toBe(3);
    expect(ruleSet(1).version).toBe(1);
  });
});

describe("guardar y leer", () => {
  it("una partida nueva nace con las reglas vigentes", () => {
    expect(newState().rulesVersion).toBe(RULES_VERSION);
  });
  it("lo guardado sin versión se lee como legacy; lo que trae versión la conserva", () => {
    const { rulesVersion: _, ...old } = newState();
    expect(migrate(old).rulesVersion).toBe(1);
    expect(migrate({ ...old, rulesVersion: "x" }).rulesVersion).toBe(1);
    expect(migrate({ ...old, rulesVersion: 2 }).rulesVersion).toBe(2);
    expect(migrate(JSON.parse(JSON.stringify({ ...newState(), rulesVersion: 3 }))).rulesVersion).toBe(3);
  });
  it("la marca de importación registra la versión real de la partida", () => {
    const s = migrate({ ...replay(byId("forja-azar").actions).state, rulesVersion: undefined });
    expect(markLegacy(s, "11111111-1111-4111-8111-111111111111", Date.now()).origin?.rulesVersion).toBe(1);
  });
});

describe("partidas doradas legacy", () => {
  it.each(GOLDENS.map((g) => [g.id, g] as const))("%s se reproduce con reglas v1 y cada empresa cerrada lo registra", (_id, g) => {
    const { state } = replay(g.actions);
    expect(rulesVersionOf(state)).toBe(1);
    for (const r of state.career) expect(r.rulesVersion).toBe(1);
  });
  it.each(GOLDENS.map((g) => [g.id, g] as const))("%s da el mismo resultado aunque exista una versión 7 más dura", (_id, g) => {
    withV2();
    let s = newState();
    let i = 0;
    for (const cp of g.checkpoints) {
      for (; i < cp.after; i++) s = applyAction(s, g.actions[i]).state;
      expect(snapshotOf(s, cp.at)).toEqual(cp.snapshot);
    }
  });
  it("y sí cambiaría si la partida se hubiera iniciado con la versión 7 (la versión de verdad se consulta)", () => {
    withV2();
    const g = byId("cumbre-peor");
    const [start, ...rest] = g.actions as GameAction[];
    // Fotografía justo antes del primer «advance» (después, la acción grabada sin versión vuelve a legacy, como debe).
    const cut = g.actions.findIndex((x) => x.type === "advance");
    const cp = g.checkpoints.filter((c) => c.after <= cut).at(-1)!;
    const v2 = replay([{ ...start, rulesVersion: 7 } as GameAction, ...rest.slice(0, cp.after - 1)]);
    expect(rulesVersionOf(v2.state)).toBe(7);
    const snap = snapshotOf(v2.state, cp.at);
    expect(snap.xp).not.toBe(cp.snapshot.xp);
    expect(snap.timing).not.toEqual(cp.snapshot.timing); // plazos de 12 h en vez de 24 h
  });
});

describe("una temporada no cambia de reglas en caliente", () => {
  const midSeason = (): { s: CeoState; at: number } => {
    const g = byId("repite-y-asciende");
    return { s: replay(g.actions).state, at: last(g).at };
  };
  it("registrar una versión nueva no mueve indicadores, plazos, XP ni veredicto de la temporada en curso", () => {
    const { s, at } = midSeason();
    const before = { snap: snapshotOf(s, at), verdict: verdictOf(s, at), deadlines: entries(s, at).map((e) => e.deadline) };
    withV2();
    expect({ snap: snapshotOf(s, at), verdict: verdictOf(s, at), deadlines: entries(s, at).map((e) => e.deadline) }).toEqual(before);
  });
  it("al pasar a la siguiente empresa, la cerrada conserva su versión y la nueva toma la vigente", () => {
    withV2();
    const g = byId("forja-azar");
    const done = replay(g.actions.filter((a) => a.type !== "advance")).state;
    const at = last(g).at;
    expect(seasonDoneOf(done, at)).toBe(true);
    const xpBefore = xpOf(done, at);
    const next = advance(done, at, 7);
    expect(next.career.at(-1)!.rulesVersion).toBe(1);
    expect(rulesVersionOf(next)).toBe(7);
    expect(rulesFor(next).passLine).toBe(tierRules(next.tier, 7).passLine);
    // El XP ya ganado no se recalcula con las reglas nuevas: lecciones y dilemas siguen valuándose con la versión de la carrera.
    expect(careerRulesVersionOf(next)).toBe(1);
    expect(xpOf(next, at)).toBe(xpBefore);
  });
  it("cambiar de empresa antes de decidir conserva las reglas de la temporada", () => {
    withV2();
    const s = { ...newState(), rulesVersion: 1, name: "Ana", startedAt: Date.UTC(2026, 9, 5, 15) };
    const t = switchCompany(s, "forja", s.startedAt + 1000);
    expect(t.company).toBe("forja");
    expect(rulesVersionOf(t)).toBe(1);
  });
  it("la crisis guarda la versión con que se jugó y se valúa con ella", () => {
    withV2();
    const T = Date.UTC(2026, 9, 5, 15);
    const s1 = recordCrisis({ ...newState(), rulesVersion: 1, name: "A", startedAt: T }, { rating: "contenida", picks: {} }, T + 1);
    const s2 = recordCrisis({ ...newState(), rulesVersion: 7, name: "B", startedAt: T }, { rating: "contenida", picks: {} }, T + 1);
    expect(s1.crises![0].rulesVersion).toBe(1);
    expect(crisisXp(s1)).toBe(60);
    expect(crisisXp(s2)).toBe(1);
    const { rulesVersion: _, ...old } = s1.crises![0];
    expect(crisisXp({ ...s1, crises: [old] })).toBe(60);
  });
  it("scaled sin versión usa legacy", () => {
    withV2();
    expect(scaled({ caja: -10, margen: 10 }, 3)).toEqual(scaled({ caja: -10, margen: 10 }, 3, 1));
    expect(scaled({ caja: -10 }, 3, 7)).not.toEqual(scaled({ caja: -10 }, 3, 1));
  });
});
