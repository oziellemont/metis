import { describe, expect, it } from "vitest";
import { isContinuous, newState, packOf } from "../engine";
import { replay, type GameAction } from "../replay";
import { buildSetup } from "./setup";
import { requirementsFor } from "../journey";
import { seasonEmail, welcomeEmail } from "../emails";
import { renderJob } from "../mailer";

const T0 = Date.UTC(2026, 10, 2, 15, 0, 0);
const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const setup = buildSetup({ sectorId: "restaurantes_alimentos", industryId: "restaurantes", archetype: "establecida", displayName: "Fogón Regio" }, CID)!;
// Igual que CeoProvider.start: primero «start», luego «setupCompany» en el mismo instante.
const actions: GameAction[] = [
  { type: "start", at: T0, name: "Oziel Leal", company: "brasa", settings: { tz: "America/Monterrey" }, rulesVersion: 3, tier: 0, journey: true },
  { type: "setupCompany", at: T0, ...setup },
];

describe("onboarding nuevo · de punta a punta", () => {
  it("el diario reproduce la empresa creada en el onboarding", () => {
    const { state, rejected } = replay(actions);
    expect(rejected).toEqual([]);
    expect(isContinuous(state)).toBe(true);
    expect(state.company).toBe("brasa");
    expect(state.companyProfile).toMatchObject({ companyId: CID, displayName: "Fogón Regio", shortName: "Fogón Regio", userRole: "appointed_ceo" });
    expect(packOf(state).name).toBe("Fogón Regio");
  });

  it("renombrar después se reproduce y conserva el id", () => {
    const { state, rejected } = replay([...actions, { type: "renameCompany", at: T0 + 60_000, displayName: "Fogón del Norte", shortName: "Fogón" }]);
    expect(rejected).toEqual([]);
    expect(state.companyProfile).toMatchObject({ companyId: CID, displayName: "Fogón del Norte", shortName: "Fogón" });
  });

  it("los requisitos del Journey hablan de periodos, no de empresas", () => {
    const s = replay(actions).state;
    const labels = requirementsFor(1, s, T0).map((r) => r.label);
    expect(labels).toContain("Periodos aprobados");
    expect(requirementsFor(1, { ...newState(), startedAt: T0 }, T0).map((r) => r.label)).toContain("Empresas aprobadas");
  });

  it("los correos no prometen otra empresa en la carrera continua", () => {
    const s = replay(actions).state;
    const w = renderJob({ kind: "welcome" } as never, s, "Oziel Leal", "https://www.metis.ceo", T0);
    expect(w.subject).toContain("Fogón Regio");
    expect(w.text).not.toMatch(/otra empresa/);
    expect(w.text).toMatch(/cada periodo/);
    const old = welcomeEmail({ name: "Oziel", appUrl: "x", windowStart: 8, windowEnd: 19 });
    expect(old.text).toMatch(/otra empresa/);
    for (const passed of [true, false]) {
      const m = seasonEmail({ pack: packOf(s), name: "Oziel", appUrl: "x", health: 70, xp: 100, level: "x", archetype: "a", archetypeText: "b", decisions: 10, bestStreak: 3, passed, passLine: 60, continuous: true });
      expect(`${m.subject} ${m.html}`).not.toMatch(/otra empresa/);
      expect(m.html).toContain("Fogón Regio");
    }
  });
});
