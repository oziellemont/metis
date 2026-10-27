import { describe, expect, it } from "vitest";
import { DILEMMAS, THEMES, bestOf } from "./dilemmas";
import { LESSONS, lessonById, rankOf, TRACKS, trackOf } from "./lessons";
import { answerDilemma, dilemmaOfDay, newState, xpOf } from "./engine";

describe("dilemas de personas", () => {
  it("ids únicos, 4 opciones y una sola mejor respuesta", () => {
    expect(new Set(DILEMMAS.map((d) => d.id)).size).toBe(DILEMMAS.length);
    for (const d of DILEMMAS) {
      expect(d.options.length).toBe(4);
      expect(d.options.filter((o) => o.score === bestOf(d)).length).toBe(1);
      expect(THEMES[d.theme]).toBeTruthy();
      if (d.lesson) expect(lessonById(d.lesson)).toBeTruthy();
    }
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
