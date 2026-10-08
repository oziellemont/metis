import { describe, expect, it } from "vitest";
import { MODULES, PASS_PCT } from "./content";
import { allDone, completedCount, gradeQuiz, isUnlocked, nextModule, recordAttempt, shouldRemindAcademy, shuffledOrder, type ProgressMap } from "./progress";
import { academyReminderEmail } from "./email";

const passAll = (): ProgressMap => Object.fromEntries(MODULES.map((m) => [m.id, { moduleId: m.id, bestScore: 100, attempts: 1, passedAt: "2026-01-01" }]));

describe("contenido", () => {
  it("cada quiz tiene exactamente una respuesta correcta y explicación en cada opción", () => {
    for (const m of MODULES) {
      expect(m.quiz.length).toBeGreaterThanOrEqual(4);
      for (const q of m.quiz) {
        expect(q.options.filter((o) => o.correct).length).toBe(1);
        q.options.forEach((o) => expect(o.why.length).toBeGreaterThan(10));
      }
      for (const b of m.blocks) if (b.kind === "check") expect(b.options.filter((o) => o.correct).length).toBe(1);
    }
  });
  it("ids únicos y módulos cortos", () => {
    expect(new Set(MODULES.map((m) => m.id)).size).toBe(MODULES.length);
    MODULES.forEach((m) => expect(m.minutes).toBeLessThanOrEqual(8));
  });
});

describe("calificación", () => {
  const quiz = MODULES[0].quiz;
  const right = quiz.map((q) => q.options.findIndex((o) => o.correct));
  const wrong = quiz.map((q) => q.options.findIndex((o) => !o.correct));
  it("todo bien → 100 y aprueba", () => expect(gradeQuiz(quiz, right)).toMatchObject({ pct: 100, passed: true }));
  it("todo mal → 0 y reprueba", () => expect(gradeQuiz(quiz, wrong).passed).toBe(false));
  it(`aprueba con ${PASS_PCT}% (4 de 5)`, () => {
    const a = [...right]; a[0] = wrong[0];
    expect(gradeQuiz(quiz, a)).toMatchObject({ correct: 4, pct: 80, passed: true });
    a[1] = wrong[1];
    expect(gradeQuiz(quiz, a).passed).toBe(false);
  });
});

describe("progreso", () => {
  it("se desbloquea en orden", () => {
    const p: ProgressMap = {};
    expect(isUnlocked(p, MODULES[0].id)).toBe(true);
    expect(isUnlocked(p, MODULES[1].id)).toBe(false);
    p[MODULES[0].id] = recordAttempt(undefined, MODULES[0].id, 80, true);
    expect(isUnlocked(p, MODULES[1].id)).toBe(true);
    expect(nextModule(p)?.id).toBe(MODULES[1].id);
    expect(completedCount(p)).toBe(1);
  });
  it("conserva la mejor calificación y la primera aprobación", () => {
    const a = recordAttempt(undefined, "x", 60, false);
    expect(a.passedAt).toBeNull();
    const b = recordAttempt(a, "x", 100, true, new Date("2026-02-01"));
    const c = recordAttempt(b, "x", 40, false);
    expect(c).toMatchObject({ bestScore: 100, attempts: 3, passedAt: "2026-02-01T00:00:00.000Z" });
  });
  it("todo aprobado", () => { expect(allDone(passAll())).toBe(true); expect(nextModule(passAll())).toBeNull(); });
  it("barajado estable y completo", () => {
    expect(shuffledOrder(4, 3)).toEqual(shuffledOrder(4, 3));
    expect([...shuffledOrder(4, 7)].sort()).toEqual([0, 1, 2, 3]);
  });
});

describe("recordatorios", () => {
  const now = new Date("2026-03-10T15:00:00Z");
  it("no recuerda si ya terminó", () => expect(shouldRemindAcademy(true, null, now)).toBe(false));
  it("primer recordatorio inmediato", () => expect(shouldRemindAcademy(false, null, now)).toBe(true));
  it("cada 2 días", () => {
    expect(shouldRemindAcademy(false, new Date("2026-03-09T15:00:00Z"), now)).toBe(false);
    expect(shouldRemindAcademy(false, new Date("2026-03-08T15:05:00Z"), now)).toBe(true);
  });
  it("el correo lista avance y enlace", () => {
    const p: ProgressMap = { [MODULES[0].id]: { moduleId: MODULES[0].id, bestScore: 100, attempts: 1, passedAt: "x" } };
    const m = academyReminderEmail({ name: "Ana López", tenantName: "Grupo Andes", appUrl: "https://www.metisalign.mx/", progress: p });
    expect(m.subject).toContain(`${MODULES.length - 1} módulos`);
    expect(m.html).toContain("https://www.metisalign.mx/academy");
    expect(m.html).toContain(`1 de ${MODULES.length}`);
    expect(m.text).toContain("[x] 1.");
  });
});
