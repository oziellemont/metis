import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DILEMMA_SNOOZE, dilemmaPromptDue, snoozeKey, specialTasks } from "./today";

const base = { changeOpen: false, changeStarted: false, changeDone: false, changeTitle: "Plan de cambio", boardOpen: false };

describe("ventana del dilema", () => {
  it("sale si no está contestado y no hay espera", () => {
    expect(dilemmaPromptDue(false, null, 1000)).toBe(true);
    expect(dilemmaPromptDue(false, undefined, 1000)).toBe(true);
  });
  it("no sale si ya se contestó", () => {
    expect(dilemmaPromptDue(true, null, 1000)).toBe(false);
  });
  it("recordar más tarde la oculta unas dos horas y luego vuelve", () => {
    const now = 1_000_000;
    const until = now + DILEMMA_SNOOZE;
    expect(DILEMMA_SNOOZE).toBe(2 * 60 * 60 * 1000);
    expect(dilemmaPromptDue(false, until, now + 60_000)).toBe(false);
    expect(dilemmaPromptDue(false, until, until)).toBe(true);
    expect(dilemmaPromptDue(true, until, until + 1)).toBe(false);
  });
  it("la espera es por dilema", () => {
    expect(snoozeKey("a")).not.toBe(snoozeKey("b"));
    expect(snoozeKey("a").startsWith("metis-ceo-v1:")).toBe(true);
  });
});

describe("asuntos especiales en Esperando tu decisión", () => {
  it("sin reto ni junta no hay nada", () => {
    expect(specialTasks(base)).toEqual([]);
  });
  it("el reto final aparece como un asunto más", () => {
    const [t] = specialTasks({ ...base, changeOpen: true });
    expect(t.id).toBe("cambio");
    expect(t.href).toBe("/ceo/cambio");
    expect(t.subject).toContain("Plan de cambio");
    expect(t.label).toBe("El consejo espera tu plan");
    expect(specialTasks({ ...base, changeOpen: true, changeStarted: true })[0].label).toBe("En curso");
  });
  it("el reto terminado desaparece", () => {
    expect(specialTasks({ ...base, changeOpen: true, changeStarted: true, changeDone: true })).toEqual([]);
  });
  it("la junta aparece cuando está abierta", () => {
    const list = specialTasks({ ...base, changeOpen: true, boardOpen: true });
    expect(list.map((t) => t.id)).toEqual(["cambio", "junta"]);
  });
});

describe("Hoy es sencillo", () => {
  const src = readFileSync(join(__dirname, "../../components/ceo/Today.tsx"), "utf8");
  it("no pinta tarjetas propias de dilema ni reto final", () => {
    expect(src).not.toMatch(/<DilemmaCard/);
    expect(src).not.toMatch(/<ChangeCard/);
    expect(src).toMatch(/<DilemmaPrompt/);
  });
});
