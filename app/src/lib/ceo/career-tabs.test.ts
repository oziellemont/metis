import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { CAREER_TABS, careerHrefOfProfileHash, careerTabOfHash } from "../../components/ceo/career-tabs";
import { MENU, menuFor } from "./metis2/menu";

const read = (f: string) => readFileSync(`src/components/ceo/${f}`, "utf8");

describe("Carrera · Mi carrera y Mi perfil en una sola pantalla", () => {
  it("tiene dos vistas y abre Mi carrera si no hay ancla", () => {
    expect(CAREER_TABS.map((t) => t.label)).toEqual(["Mi carrera", "Mi perfil"]);
    expect(careerTabOfHash("")).toBe("carrera");
    expect(careerTabOfHash("#otra")).toBe("carrera");
  });
  it("las anclas de perfil, experiencia y liderazgo abren Mi perfil", () => {
    for (const h of ["#perfil", "#experiencia", "#liderazgo", "perfil"]) expect(careerTabOfHash(h)).toBe("perfil");
  });
  it("las anclas de Perfil siguen teniendo su equivalente dentro de Carrera", () => {
    expect(careerHrefOfProfileHash("")).toBe("/ceo/carrera#perfil");
    expect(careerHrefOfProfileHash("#experiencia")).toBe("/ceo/carrera#experiencia");
    expect(careerHrefOfProfileHash("#liderazgo")).toBe("/ceo/carrera#liderazgo");
    expect(careerHrefOfProfileHash("#otra")).toBe("/ceo/carrera#perfil");
  });
  it("Mi perfil es una página propia (MÊTIS 2.0, 3.6): ya no manda a Carrera", () => {
    expect(existsSync("src/app/ceo/perfil/page.tsx")).toBe(true);
    const page = readFileSync("src/app/ceo/perfil/page.tsx", "utf8");
    expect(page).toContain("<ProfilePage />");
    expect(page).not.toContain("ProfileRedirect");
    const pp = read("ProfilePage.tsx");
    expect(pp).toContain("<Profile ");
    expect(pp).toContain("<PracticePlan />");
    expect(pp).toContain("career={sim}");
    for (const a of ["temas", "experiencia", "liderazgo"]) expect(pp, a).toContain(`"${a}"`);
    expect(read("PracticePlan.tsx")).toContain('id="temas"');
    expect(read("Profile.tsx")).toContain('id="experiencia"');
    expect(read("Profile.tsx")).toContain('id="liderazgo"');
  });
  it("Mi perfil está en el menú; la barra del celular tiene cinco lugares, o siete con el simulador", () => {
    const shell = read("CeoShell.tsx");
    expect(MENU.map((m) => m.href)).toContain("/ceo/perfil");
    expect(MENU.length).toBe(5);
    expect(menuFor(true).length).toBe(7);
    expect(shell).toContain("menuFor(sim)");
    expect(shell).toContain('"grid-cols-5"');
    expect(shell).toContain('"grid-cols-7"');
  });
  it("las pantallas enlazan a Mi perfil por su dirección propia, no por la de Carrera", () => {
    expect(read("Experience.tsx")).toContain('"/ceo/perfil#experiencia"');
    expect(read("CeoAcademy.tsx")).toContain('"/ceo/perfil#experiencia"');
    for (const f of ["CeoAcademy.tsx", "Experience.tsx", "Progress.tsx", "PracticePlan.tsx", "CeoSettings.tsx"]) {
      expect(read(f), f).not.toMatch(/["'`]\/ceo\/carrera#(perfil|experiencia|liderazgo)/);
    }
  });
  it("Carrera y Empresa usan el mismo selector tipo pill", () => {
    expect(read("CareerHub.tsx")).toContain("<PillTabs");
    expect(read("CompanyView.tsx")).toContain("<PillTabs");
    expect(read("CareerHub.tsx")).toContain("<Career />");
    expect(read("CareerHub.tsx")).toContain("<Profile ");
    expect(readFileSync("src/app/ceo/carrera/page.tsx", "utf8")).toContain("<CareerHub />");
  });
});
