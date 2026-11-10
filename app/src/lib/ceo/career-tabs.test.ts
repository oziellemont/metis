import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { CAREER_TABS, careerHrefOfProfileHash, careerTabOfHash } from "../../components/ceo/career-tabs";

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
  it("la dirección anterior de Perfil manda a Carrera y conserva el ancla", () => {
    expect(careerHrefOfProfileHash("")).toBe("/ceo/carrera#perfil");
    expect(careerHrefOfProfileHash("#experiencia")).toBe("/ceo/carrera#experiencia");
    expect(careerHrefOfProfileHash("#liderazgo")).toBe("/ceo/carrera#liderazgo");
    expect(careerHrefOfProfileHash("#otra")).toBe("/ceo/carrera#perfil");
    expect(existsSync("src/app/ceo/perfil/page.tsx")).toBe(true);
    expect(readFileSync("src/app/ceo/perfil/page.tsx", "utf8")).toContain("<ProfileRedirect />");
  });
  it("Perfil ya no está en el menú y la barra del celular tiene cinco lugares", () => {
    const shell = read("CeoShell.tsx");
    expect(shell).not.toMatch(/href: "\/ceo\/perfil"/);
    expect(shell).toContain("grid grid-cols-5");
    expect((shell.match(/^\s*\{ href: "\/ceo/gm) ?? []).length).toBe(5);
  });
  it("ninguna pantalla enlaza a la dirección anterior de Perfil", () => {
    for (const f of ["CeoAcademy.tsx", "Experience.tsx", "Today.tsx", "Career.tsx", "Profile.tsx", "CeoSettings.tsx", "ProfileFlow.tsx"]) {
      expect(read(f), f).not.toMatch(/["'`]\/ceo\/perfil/);
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
