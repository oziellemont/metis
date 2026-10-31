import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const today = readFileSync("src/components/ceo/Today.tsx", "utf8");
const shell = readFileSync("src/components/ceo/CeoShell.tsx", "utf8");
const inbox = readFileSync("src/components/ceo/InboxView.tsx", "utf8");

describe("Hoy · una sola experiencia", () => {
  it("el menú ya no tiene el recuadro morado; empresa y día quedan como texto", () => {
    expect(shell).not.toMatch(/bg-gradient-to-br from-\[#141735\]/);
    expect(shell).not.toContain("JourneyMini");
    expect(shell).toContain("c.pack.name");
    expect(shell).toMatch(/Día \{c\.day\}/);
  });
  it("el progreso (racha, XP y Executive Journey) vive dentro de la franja de bienvenida", () => {
    expect(today).toContain('aria-label="Tu progreso"');
    for (const x of ["c.streak.week", "c.xp", "Executive Journey", "j.met", "j.total", "Siguiente nombramiento", "/ceo/carrera"]) expect(today).toContain(x);
  });
  it("orden: bienvenida, decisiones, estado de la empresa (con acceso a Empresa), aprendizaje", () => {
    const i = (t: string) => today.indexOf(t);
    expect(i("Tu progreso")).toBeLessThan(i("Esperando tu decisión"));
    expect(i("Esperando tu decisión")).toBeLessThan(i("Tu empresa hoy"));
    expect(i("Tu empresa hoy")).toBeLessThan(i("mêtis Academy · {nextLesson.minutes}"));
    expect(today).toContain('href="/ceo/empresa"');
  });
  it("no se muestra la hora de llegada del siguiente asunto (se conserva la sorpresa)", () => {
    for (const src of [today, inbox]) {
      expect(src).not.toMatch(/clock\(c\.nextArrival\)/);
      expect(src).not.toMatch(/until\(c\.nextArrival/);
    }
    expect(today).toContain("Durante el día llegarán más asuntos.");
  });
});
