/**
 * Rediseño de progresión · consistencia entre pantallas.
 * Hoy, Carrera y Perfil leen la MISMA trayectoria (c.trajectory = trajectoryOf). Ninguna pantalla, correo ni la
 * página pública muestra la escalera de títulos corporativos, «siguiente nombramiento» ni requisitos para ascender.
 * La constancia (XP y racha) se muestra aparte y nunca como requisito.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");
const BANNED = /Emerging Leader|Functional Manager|Business Unit Director|Chief Operating Officer|Global CEO|Executive Journey|Executive Arena|siguiente nombramiento|para ascender|asciendes|Stage \{|Recibir nombramiento|Junta de nombramiento|Competent \(40\)|no define tu etapa/i;
/** Comentarios fuera: solo se revisa lo que ve el jugador. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

describe("progresión · una sola fuente y sin escalera de títulos", () => {
  it("Hoy, Carrera y Perfil derivan cargo y capítulo de c.trajectory", () => {
    for (const f of ["Today.tsx", "Career.tsx", "Profile.tsx"]) {
      const src = read("components", "ceo", f);
      expect(src, f).toContain("c.trajectory");
      expect(src, f).not.toMatch(/c\.journey|journeyOf|from "@\/lib\/ceo\/journey"/);
      expect(src, f).not.toMatch(/COMPANY_STAGES\.find\(\(x\) => x\.id === c\.s\.companyProfile/);
    }
    expect(read("components", "ceo", "Career.tsx")).toContain("<Trajectory t={t}");
    expect(read("components", "ceo", "Profile.tsx")).toContain("t.appointment.title");
    expect(read("components", "ceo", "Today.tsx")).toContain("t.appointment.title");
  });

  it("ninguna pantalla de la app, correo ni la página pública muestra la escalera anterior", () => {
    const dir = join(root, "components", "ceo");
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".tsx"))) expect(code(read("components", "ceo", f)), f).not.toMatch(BANNED);
    for (const f of ["emails.ts", "today.ts", "schedule.ts", "player-row.ts", "import.ts"]) expect(code(read("lib", "ceo", f)), f).not.toMatch(BANNED);
    const land = join(root, "components", "site", "ceo-landing");
    for (const f of readdirSync(land).filter((x) => /\.tsx?$/.test(x) && !x.includes(".test."))) expect(code(read("components", "site", "ceo-landing", f)), f).not.toMatch(BANNED);
  });

  it("los correos, el renglón de jugadores y la importación usan el cargo y el capítulo, no la etapa del Journey", () => {
    for (const f of ["schedule.ts", "player-row.ts", "import.ts"]) {
      const src = read("lib", "ceo", f);
      expect(src, f).toContain("mandateLabelOf(s)");
      expect(src, f).not.toMatch(/STAGES\[/);
    }
  });

  it("la constancia se muestra aparte y se dice que no es requisito", () => {
    const today = read("components", "ceo", "Today.tsx"), profile = read("components", "ceo", "Profile.tsx");
    expect(today).toContain('aria-label="Constancia"');
    expect(profile).toMatch(/Constancia · tu hábito, no un requisito/);
    expect(profile).toMatch(/No abren cargos, capítulos ni competencias/);
  });

  it("Perfil conserva Mi liderazgo (preferencias, competencias y resultados por separado) y no duplica la trayectoria", () => {
    const profile = read("components", "ceo", "Profile.tsx");
    for (const id of ["mi-liderazgo", "liderazgo-preferencias", "liderazgo-competencias", "liderazgo-resultados"]) expect(profile).toContain(id);
    expect(profile).not.toMatch(/t\.milestones|t\.reviews|t\.evolution|<Trajectory\b/);
    expect(profile).not.toMatch(/countAtLeast\(/);
  });

  it("la trayectoria no lee XP, racha, lecciones ni el antiguo Journey (fuente)", () => {
    const src = code(read("lib", "ceo", "trajectory.ts"));
    expect(src).not.toMatch(/xpOf|streakOf|\.lessons\b|\.journey\b|\.xp\b/);
  });
});
