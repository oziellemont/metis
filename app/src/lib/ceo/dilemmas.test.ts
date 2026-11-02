import { describe, expect, it } from "vitest";
import { ALL_DILEMMAS, DILEMMAS, THEMES, answeredAs, bestOf, dilemmaById } from "./dilemmas";
import { DILEMMAS_V1 } from "./dilemmas-v1";
import { LESSONS, lessonById, rankOf, TRACKS, trackOf } from "./lessons";
import { answerDilemma, dilemmaOfDay, newState, xpOf } from "./engine";

describe("dilemas de personas", () => {
  it("ids únicos, 4 opciones, al menos dos respuestas de criterio alto y cada opción dice qué cuesta", () => {
    expect(new Set(ALL_DILEMMAS.map((d) => d.id)).size).toBe(ALL_DILEMMAS.length);
    for (const d of DILEMMAS) {
      expect(d.options.length).toBe(4);
      expect(d.options.filter((o) => o.score === bestOf(d)).length, d.id).toBeGreaterThanOrEqual(2);
      for (const o of d.options) expect((o.cost ?? "").length, d.id).toBeGreaterThan(10);
      expect(THEMES[d.theme]).toBeTruthy();
      if (d.lesson) expect(lessonById(d.lesson)).toBeTruthy();
    }
  });
  it("la versión 2 sustituye uno a uno a la versión 1, con el mismo tema y rango", () => {
    expect(DILEMMAS.length).toBe(DILEMMAS_V1.length);
    for (const d of DILEMMAS) {
      const old = DILEMMAS_V1.find((x) => x.id === d.replaces)!;
      expect(old, d.id).toBeTruthy();
      expect([old.theme, old.min], d.id).toEqual([d.theme, d.min]);
    }
  });
  it("las respuestas históricas (versión 1) se siguen calificando igual y no se repite la situación", () => {
    const s = { ...newState(), startedAt: 1, name: "X" };
    const now = Date.UTC(2026, 0, 10, 18);
    const s1 = { ...s, dilemmas: { n1: { option: 1, at: now - 86_400_000 } } };
    expect(dilemmaById("n1")!.options[1].score).toBe(3);
    expect(xpOf(s1, now)).toBeGreaterThan(xpOf(s, now));
    expect(answeredAs(s1.dilemmas, dilemmaById("n1-v2")!)).toEqual({ d: dilemmaById("n1"), option: 1 });
    expect(answerDilemma(s1, "n1-v2", 0, now)).toBe(s1);
    for (let k = 0; k < 30; k++) expect(dilemmaOfDay(s1, now + k * 86_400_000)?.d.id).not.toBe("n1-v2");
  });
  it("todos los temas tienen casos", () => {
    for (const t of Object.keys(THEMES)) expect(DILEMMAS.some((d) => d.theme === t)).toBe(true);
  });
  it("dilema del día: estable, responde una vez y da XP", () => {
    const s = { ...newState(), startedAt: 1, name: "X" };
    const now = Date.UTC(2026, 0, 10, 18);
    const a = dilemmaOfDay(s, now)!;
    expect(a.d.min).toBe(0);
    expect(dilemmaOfDay(s, now + 3600_000)!.d.id).toBe(a.d.id);
    const s2 = answerDilemma(s, a.d.id, 0, now);
    expect(answerDilemma(s2, a.d.id, 1, now)).toBe(s2);
    expect(xpOf(s2, now)).toBeGreaterThan(xpOf(s, now));
    expect(dilemmaOfDay(s2, now)!.done).toBe(true);
  });
  it("no deja responder casos de un rango superior", () => {
    const s = { ...newState(), startedAt: 1 };
    const hard = DILEMMAS.find((d) => d.min >= 2)!;
    expect(answerDilemma(s, hard.id, 0)).toBe(s);
  });
});

describe("academy por niveles", () => {
  it("cada lección pertenece a un tema y el nivel 1 está abierto al inicio en los temas base", () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) expect(TRACKS.some((t) => t.id === trackOf(l).track)).toBe(true);
    expect(rankOf(lessonById("personas")!)).toBe(0);
    expect(rankOf(lessonById("personas-2")!)).toBe(1);
    expect(rankOf(lessonById("personas-3")!)).toBe(2);
  });
});
