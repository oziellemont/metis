import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { MENU, SIMULATOR_MENU, menuColumns, menuFor } from "./menu";

const comp = (f: string) => readFileSync(`src/components/ceo/${f}`, "utf8");

describe("MÊTIS 2.0 · 3.6 · menú nuevo", () => {
  it("el menú es Hoy, Bandeja, Academy, Mi progreso y Mi perfil, en ese orden", () => {
    expect(MENU.map((m) => m.label)).toEqual(["Hoy", "Bandeja", "Academy", "Mi progreso", "Mi perfil"]);
    expect(MENU.map((m) => m.href)).toEqual(["/ceo", "/ceo/bandeja", "/ceo/academy", "/ceo/progreso", "/ceo/perfil"]);
    expect(menuFor(false)).toEqual([...MENU]);
    expect(menuFor(undefined)).toEqual([...MENU]);
    expect(menuColumns(false)).toBe(5);
    expect(menuColumns(undefined)).toBe(5);
  });

  it("Empresa y Carrera no están en el menú, ni tampoco Personas, Ranking o el piloto", () => {
    const hrefs = MENU.map((m) => m.href).join(" ");
    for (const out of ["/ceo/empresa", "/ceo/carrera", "/ceo/personas", "/ceo/ranking", "/ceo/piloto"]) expect(hrefs, out).not.toContain(out);
    expect(readFileSync("src/lib/ceo/metis2/menu.ts", "utf8")).not.toMatch(/piloto|personas|ranking/i);
  });

  it("con el simulador encendido vuelven Empresa y Carrera, después de Bandeja, y nada más cambia", () => {
    const on = menuFor(true);
    expect(on.map((m) => m.label)).toEqual(["Hoy", "Bandeja", "Empresa", "Carrera", "Academy", "Mi progreso", "Mi perfil"]);
    expect(SIMULATOR_MENU.map((m) => m.href)).toEqual(["/ceo/empresa", "/ceo/carrera"]);
    expect(menuColumns(true)).toBe(7);
    expect(new Set(on.map((m) => m.href)).size).toBe(on.length);
    // Solo Bandeja lleva el contador de pendientes.
    expect(on.filter((m) => m.badge).map((m) => m.href)).toEqual(["/ceo/bandeja"]);
    // Con siete lugares, los nombres largos tienen su versión corta para el celular.
    for (const m of on) expect((m.short ?? m.label).length, m.label).toBeLessThanOrEqual(8);
  });

  it("cada lugar del menú tiene su página, y las del simulador siguen existiendo aunque no se vean", () => {
    for (const m of menuFor(true)) {
      const dir = m.href === "/ceo" ? "src/app/ceo/page.tsx" : `src/app${m.href}/page.tsx`;
      expect(existsSync(dir), m.href).toBe(true);
    }
  });

  it("la pantalla principal arma el menú con el interruptor de Ajustes y no con una lista propia", () => {
    const shell = comp("CeoShell.tsx");
    expect(shell).toContain('from "@/lib/ceo/metis2/menu"');
    expect(shell).toContain("c.s.settings.simulador === true");
    expect(shell).toContain("menuFor(sim)");
    expect(shell).not.toMatch(/^\s*\{ href: "\/ceo/m);
    expect(shell).toContain('"grid-cols-5"');
    expect(shell).toContain('"grid-cols-7"');
    // Sin el simulador a la vista, el encabezado no habla del día de la empresa.
    expect(shell).toContain("Tus casos ocurren en");
  });

  it("Ajustes trae el interruptor, se guarda al tocarlo y dice que solo cambia el menú", () => {
    const st = comp("CeoSettings.tsx");
    expect(st).toContain("Mostrar el simulador de empresas");
    expect(st).toContain('data-testid="mostrar-simulador"');
    expect(st).toContain("c.updateSettings({ simulador: on })");
    expect(st).toMatch(/solo cambia el menú/);
    // Cambiar el nombre de la empresa es cosa del simulador: aparece solo con él encendido.
    expect(st).toContain("{sim && <RenameCompany />}");
  });
});

describe("MÊTIS 2.0 · 3.6 · Mi progreso", () => {
  const pg = comp("Progress.tsx");
  it("es una página propia que muestra constancia, práctica por academia y temas", () => {
    expect(readFileSync("src/app/ceo/progreso/page.tsx", "utf8")).toContain("<Progress />");
    for (const id of ["mi-progreso", "progreso-totales", "progreso-constancia", "progreso-academias", "progreso-temas"]) expect(pg, id).toContain(`data-testid="${id}"`);
    expect(pg).toContain("practiceByAcademy(");
    expect(pg).toContain("decidedOf(c.s)");
    expect(pg).toContain("weekGoalText(");
  });
  it("dice sin rodeos que cuenta actividad y no acredita dominio ni niveles", () => {
    expect(pg).toContain("Esto cuenta actividad");
    expect(pg).toContain("No acredita dominio ni sube niveles");
    expect(pg).toContain('"/ceo/perfil#liderazgo"');
    // No toma nada del motor de dominio ni de la ruta de niveles.
    expect(pg).not.toMatch(/c\.mastery|masteryOf|@\/lib\/ceo\/mastery|rutaDe|nivelDe/);
  });
});

describe("MÊTIS 2.0 · 2.1 · registro corto, sin empresa", () => {
  const ob = comp("Onboarding.tsx");
  it("ya no pide crear, elegir ni nombrar una empresa", () => {
    expect(ob).not.toContain("CompanySetup");
    expect(ob).not.toMatch(/ArchetypeStep|IndustryStep|NameStep|LetterStep|TierChoice/);
    expect(ob).not.toMatch(/Crear mi empresa|nombramiento|Tú eliges la industria|Empezar en \{/i);
    expect(ob).toContain("caseCompanyFor(profile?.industry)");
    expect(ob).toContain('data-testid="registro-empresa-del-caso"');
    expect(ob).toContain("no tienes que crearla ni administrarla");
  });
  it("tiene siete pasos: nombre, experiencia, temas, ritmo, diagnóstico, avisos y primera semana", () => {
    expect(ob).toContain("const STEPS = 7;");
    for (const id of ["registro-nombre", "registro-experiencia", "registro-temas", "registro-ritmo", "registro-diagnostico", "registro-avisos", "registro-semana"]) expect(ob, id).toContain(`data-testid="${id}"`);
    for (let i = 0; i < 7; i++) expect(ob, `paso ${i}`).toContain(`step === ${i} && (`);
    expect(ob).not.toContain("step === 7");
  });
  it("pide al menos cinco temas antes de seguir y guarda temas, días y meta al terminar", () => {
    expect(ob).toContain("<TopicsPicker dark");
    expect(ob).toContain("disabled={!topicsReady(topics)}");
    expect(ob).toContain("if (!topicsReady(topics)) { setStep(2); return; }");
    expect(ob).toContain("entryProfile(profile, topics, days, Date.now())");
    expect(ob).toContain("PRACTICE_DAYS.map(");
    expect(ob).toContain("weeklyProjection(goal, days)");
    // La exigencia ya no se ofrece en el registro: todos empiezan igual.
    expect(ob).toContain("tier: 0");
  });
  it("el diagnóstico sigue siendo opcional y saltarlo no detiene el registro", () => {
    expect(ob).toContain('later="Ahora no, continuar"');
    expect(ob).toContain('track("diagnostico_saltado"');
    expect(ob).toContain("<StartingPoint entry ");
  });
  it("quien ya tenía cuenta completa lo mismo desde Mi perfil", () => {
    const pp = comp("PracticePlan.tsx");
    expect(pp).toContain("<TopicsPicker ");
    expect(pp).toContain("c.saveProfile(entryProfile(");
    expect(pp).toContain("Elegir mis temas");
    expect(pp).toContain("PRACTICE_DAYS.map(");
  });
});
