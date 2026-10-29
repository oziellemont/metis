import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");

describe("pantallas de decisión paso a paso", () => {
  it("el caso del día y el episodio usan el escenario métis por pasos", () => {
    const caso = read("components", "ceo", "CaseView.tsx");
    const ep = read("components", "ceo", "EpisodeView.tsx");
    expect(caso).toMatch(/<Stage\b/);
    expect(ep).toMatch(/<Stage\b/);
    expect(caso).toContain('"El caso", "Contexto", "Decides", "Resultado", "Aprendes"');
    expect(ep).toContain('"El caso", "Investiga", "Decides", "Cierre", "Aprendes"');
  });

  it("el escenario usa el mismo fondo métis del onboarding", () => {
    const stage = read("components", "ceo", "Stage.tsx");
    const onb = read("components", "ceo", "Onboarding.tsx");
    const bg = "from-[#0F1130] via-[#1A1650] to-[#2B1F8A]";
    expect(stage).toContain(bg);
    expect(onb).toContain(bg);
  });

  it("caso y episodio se muestran a pantalla completa, sin el menú de la plataforma", () => {
    const shell = read("components", "ceo", "CeoShell.tsx");
    expect(shell).toContain('path.startsWith("/ceo/caso/")');
    expect(shell).toContain('path.startsWith("/ceo/episodio/")');
  });

  it("ninguna pantalla del juego dice «no hay vuelta atrás» ni algo parecido", () => {
    const dir = join(root, "components", "ceo");
    const banned = /vuelta atr[aá]s|marcha atr[aá]s|no hay retorno|ya no podr[aá]s|no se puede deshacer|no podr[aá]s cambiar/i;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".tsx"))) {
      expect(read("components", "ceo", f), f).not.toMatch(banned);
    }
  });
});
