import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const today = readFileSync("src/components/ceo/Today.tsx", "utf8");
const shell = readFileSync("src/components/ceo/CeoShell.tsx", "utf8");
const inbox = readFileSync("src/components/ceo/InboxView.tsx", "utf8");

describe("Hoy · una sola experiencia", () => {
  it("centro de mando: riel de íconos, Hoy a todo el ancho con el fondo mêtis y el logo sin la etiqueta «CEO»", () => {
    expect(shell).toContain('const home = path === "/ceo"');
    expect(shell).toContain("from-[#0F1130] via-[#1A1650] to-[#2B1F8A]");
    expect(shell).toContain("hover:bg-white/10 hover:text-white");
    expect(today).toContain("btn bg-white text-ink hover:bg-white/90");
    expect(today).toContain("Misión del consejo");
    expect(today).toContain('"Explorar Academy"');
  });
  it("ninguna pantalla pone la etiqueta «CEO» junto al logo", () => {
    for (const f of ["CeoShell.tsx", "Stage.tsx", "Onboarding.tsx", "Experience.tsx", "ImportPrompt.tsx", "auth/CeoAuth.tsx"]) {
      expect(readFileSync(`src/components/ceo/${f}`, "utf8"), f).not.toMatch(/>CEO<\/span>/);
    }
  });
  it("el menú ya no tiene el recuadro morado; empresa y día quedan como texto", () => {
    expect(shell).not.toMatch(/bg-gradient-to-br from-\[#141735\]/);
    expect(shell).not.toContain("JourneyMini");
    expect(shell).toContain("c.pack.name");
    expect(shell).toMatch(/Día \{c\.day\}/);
  });
  it("la franja de bienvenida resume el mandato (de la trayectoria) y deja la constancia aparte y secundaria", () => {
    expect(today).toContain('aria-label="Tu mandato"');
    for (const x of ["c.trajectory", "t.appointment.title", "t.chapter.label", "t.moment.text", "headlineOf(t)", "/ceo/carrera", 'aria-label="Constancia"', "c.xp", "c.streak.week.map", "d.on"]) expect(today).toContain(x);
    // Centro de mando: la constancia va arriba, chica y aparte; el mandato vive en el panel de la empresa.
    expect(today.indexOf('aria-label="Constancia"')).toBeLessThan(today.indexOf("{greeting}"));
    expect(today.indexOf("<KpiBoard hero />")).toBeLessThan(today.indexOf("t.moment.text"));
    for (const x of ["Executive Journey", "j.met", "j.total", "Siguiente nombramiento", "Stage {", "c.journey", "Emerging Leader"]) expect(today).not.toContain(x);
  });
  it("orden: bienvenida, decisiones, estado de la empresa (con acceso a Empresa), mandato, aprendizaje", () => {
    const i = (t: string) => today.indexOf(t);
    expect(i("{greeting}")).toBeLessThan(i("Esperando tu decisión"));
    expect(i("Esperando tu decisión")).toBeLessThan(i("Tu empresa hoy"));
    expect(i("Tu empresa hoy")).toBeLessThan(i("Tu mandato"));
    expect(i("Tu mandato")).toBeLessThan(i("mêtis Academy · {nextLesson.minutes}"));
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
