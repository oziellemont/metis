import { describe, expect, it } from "vitest";
import { mergeStates, newest, planSave, sameRun, withServerPrefs } from "./sync";
import { decide, entries, newState } from "./engine";
import { replay } from "./replay";
import { record, SPECS } from "./golden/play";
import type { CeoState } from "./types";

const T = Date.UTC(2026, 9, 1, 14);
const H = 3_600_000;
const run = (over: Partial<CeoState> = {}): CeoState => {
  const s = newState();
  return { ...s, name: "Ana", alias: "Ana", company: "cumbre", startedAt: T, savedAt: T, lastActiveAt: T, settings: { ...s.settings, intensivo: true, windowStart: 0, windowEnd: 23 }, ...over };
};
/** Contesta el primer asunto pendiente (A) y devuelve la partida con savedAt movido. */
const answer = (s: CeoState, at: number, pick = 0): CeoState => {
  const e = entries(s, at).find((x) => x.status === "pendiente");
  if (!e) return s;
  const n = decide(s, e.item.id, e.item.options[pick].id, at);
  return { ...n, savedAt: at };
};

describe("sameRun y newest", () => {
  it("misma temporada = misma empresa, mismo inicio y misma carrera", () => {
    expect(sameRun(run(), run())).toBe(true);
    expect(sameRun(run(), run({ company: "forja" }))).toBe(false);
    expect(sameRun(run(), run({ startedAt: T + 1 }))).toBe(false);
    expect(sameRun(run({ startedAt: null }), run({ startedAt: null }))).toBe(false);
  });
  it("la más reciente por savedAt; empate se queda la local", () => {
    expect(newest(run({ savedAt: 5 }), run({ savedAt: 9 }))).toBe("cloud");
    expect(newest(run({ savedAt: 9 }), run({ savedAt: 9 }))).toBe("local");
    expect(newest(null, run())).toBe("cloud");
    expect(newest(run(), null)).toBe("local");
    expect(newest(null, null)).toBeNull();
  });
});

describe("mergeStates: misma cuenta en dos dispositivos", () => {
  it("sin nube se queda la local; sin local, la nube", () => {
    const a = run();
    expect(mergeStates(a, null)?.state).toBe(a);
    expect(mergeStates(null, a)?.state).toBe(a);
    expect(mergeStates(null, null)).toBeNull();
  });
  it("copias idénticas: nada cambia", () => {
    const a = answer(run(), T + H);
    expect(mergeStates(a, a)?.how).toBe("igual");
  });
  it("lo jugado en el celular y en la computadora se une, sin perder nada", () => {
    const base = run();
    const phone = answer(base, T + H, 0);
    const laptop = { ...answer(base, T + 2 * H, 1), lessons: { l1: T + 2 * H }, read: { x: T + 2 * H } };
    const m = mergeStates(phone, laptop)!;
    expect(m.how).toBe("mezcla");
    expect(m.state.lessons.l1).toBe(T + 2 * H);
    expect(m.state.read.x).toBe(T + 2 * H);
    expect(m.state.savedAt).toBeGreaterThan(Math.max(phone.savedAt, laptop.savedAt));
  });
  it("si los dos contestaron el mismo asunto, vale la primera respuesta (como en el juego)", () => {
    const base = run();
    const phone = answer(base, T + H, 0);
    const laptop = answer(base, T + 3 * H, 1);
    const id = Object.keys(phone.decisions)[0];
    expect(Object.keys(laptop.decisions)[0]).toBe(id);
    const m = mergeStates(laptop, phone)!;
    expect(m.state.decisions[id]).toEqual(phone.decisions[id]);
  });
  it("temporadas distintas no se mezclan: gana la más reciente completa", () => {
    const old = answer(run(), T + H);
    const nueva = run({ company: "forja", startedAt: T + 5 * H, savedAt: T + 5 * H, career: [{ company: "cumbre", tier: 0, startedAt: T, endedAt: T + 4 * H } as CeoState["career"][number]] });
    expect(mergeStates(old, nueva)?.state).toBe(nueva);
    expect(mergeStates(nueva, old)?.state).toBe(nueva);
  });
  it("la mezcla es simétrica en lo jugado", () => {
    const base = run();
    const a = { ...answer(base, T + H), lessons: { a: T + H } };
    const b = { ...base, lessons: { b: T + 2 * H }, savedAt: T + 2 * H };
    const x = mergeStates(a, b)!.state, y = mergeStates(b, a)!.state;
    expect(x.decisions).toEqual(y.decisions);
    expect(x.lessons).toEqual(y.lessons);
  });
  it("partidas doradas: mezclar una copia consigo misma o con una anterior no cambia el resultado", () => {
    for (const spec of SPECS.slice(0, 3)) {
      const g = record(spec);
      const full = replay(g.actions).state;
      const half = replay(g.actions.slice(0, Math.floor(g.actions.length / 2))).state;
      const m = mergeStates({ ...half, savedAt: 1 }, { ...full, savedAt: 2 })!;
      expect(m.state.decisions).toEqual(full.decisions);
      expect(m.state.company).toBe(full.company);
      expect(m.state.career.length).toBe(full.career.length);
    }
  });
});

describe("preferencias desde el servidor", () => {
  it("rellena meta y minutos si la partida no los trae", () => {
    const s = withServerPrefs(run(), { daily_decision_goal: 3, preferred_session_minutes: 8 });
    expect(s.settings.dailyGoal).toBe(3);
    expect(s.settings.sessionMinutes).toBe(8);
  });
  it("nunca pisa lo que el jugador ya eligió ni acepta valores raros", () => {
    const mine = run({ settings: { ...run().settings, dailyGoal: 1, sessionMinutes: 3 } });
    expect(withServerPrefs(mine, { daily_decision_goal: 3, preferred_session_minutes: 12 })).toBe(mine);
    const s = run();
    expect(withServerPrefs(s, { daily_decision_goal: 9, preferred_session_minutes: 4 })).toBe(s);
    expect(withServerPrefs(s, null)).toBe(s);
    expect(withServerPrefs(run({ startedAt: null }), { daily_decision_goal: 2 }).settings.dailyGoal).toBeUndefined();
  });
});

describe("planSave: no pisar la nube a ciegas", () => {
  it("si nadie escribió desde la última vez, escribe; si otro dispositivo guardó, primero trae", () => {
    expect(planSave(100, 100)).toBe("escribir");
    expect(planSave(100, null)).toBe("escribir");
    expect(planSave(100, 150)).toBe("traer");
    expect(planSave(100, 90)).toBe("traer");
  });
});

describe("mezcla sin falsos cambios", () => {
  it("mismo contenido con llaves en otro orden no cuenta como mezcla", () => {
    const a = run({ lessons: { x: 1, y: 2 }, savedAt: 5 });
    const b = run({ lessons: { y: 2, x: 1 }, savedAt: 9 });
    expect(mergeStates(a, b)?.how).toBe("nube");
  });
});
