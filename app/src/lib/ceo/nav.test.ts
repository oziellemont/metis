import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("menú de MÊTIS CEO", () => {
  it("la pestaña Personas está oculta, pero su página sigue existiendo", () => {
    const shell = readFileSync("src/components/ceo/CeoShell.tsx", "utf8");
    expect(shell).not.toMatch(/href: "\/ceo\/personas"/);
    expect(existsSync("src/app/ceo/personas/page.tsx")).toBe(true);
  });
  it("Ranking está oculto del menú (escritorio y móvil) y de toda la app; su página sigue existiendo", () => {
    const shell = readFileSync("src/components/ceo/CeoShell.tsx", "utf8");
    expect(shell).not.toMatch(/href: "\/ceo\/ranking"/);
    expect(shell).not.toMatch(/href="\/ceo\/ranking"/);
    for (const f of ["Today.tsx", "Career.tsx", "Profile.tsx", "CeoSettings.tsx", "ImportPrompt.tsx", "ProfileFlow.tsx"]) {
      expect(readFileSync(`src/components/ceo/${f}`, "utf8"), f).not.toMatch(/\/ceo\/ranking|\branking\b/i);
    }
    expect(existsSync("src/app/ceo/ranking/page.tsx")).toBe(true);
  });
});
