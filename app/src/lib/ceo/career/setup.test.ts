import { describe, expect, it } from "vitest";
import { appointedByOf, buildSetup, canContinue, defaultArchetype, effectiveShort, nameExample, newCompanyId, previewPack, selectionForPack } from "./setup";
import { isCompanyId, newCompanyProfile } from "./identity";
import { TAXONOMY_VERSION } from "./taxonomy";

const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const OK = { sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida" as const, displayName: "Casa Norte Alimentos" };

describe("onboarding de carrera continua · lógica pura", () => {
  it("preselecciona la industria jugable de un paquete", () => {
    expect(selectionForPack("cumbre")).toEqual({ sectorId: "manufactura", industryId: "alimentos_bebidas" });
    expect(selectionForPack("forja")).toEqual({ sectorId: "manufactura", industryId: "autopartes" });
    expect(selectionForPack("brasa")).toEqual({ sectorId: "restaurantes_alimentos", industryId: "restaurantes" });
    expect(selectionForPack("nada")).toEqual({});
    expect(selectionForPack(undefined)).toEqual({});
  });

  it("tipo por omisión: el primero con casos aprobados", () => {
    expect(defaultArchetype("manufactura", "alimentos_bebidas")).toBe("establecida");
    expect(defaultArchetype("tecnologia_informacion", "software_saas")).toBeUndefined();
  });

  it("solo deja avanzar con combinaciones jugables", () => {
    expect(canContinue("industria", {})).toBe(false);
    expect(canContinue("industria", { sectorId: "tecnologia_informacion", industryId: "software_saas" })).toBe(false);
    expect(canContinue("industria", OK)).toBe(true);
    expect(canContinue("tipo", { ...OK, archetype: "pyme" })).toBe(true);
    expect(canContinue("tipo", { ...OK, archetype: "startup" })).toBe(false);
    expect(canContinue("tipo", OK)).toBe(true);
    expect(canContinue("nombre", { ...OK, displayName: "x" })).toBe(false);
    expect(canContinue("nombre", { ...OK, displayName: "Mi {empresa}" })).toBe(false);
    expect(canContinue("nombre", { ...OK, shortName: "<b>" })).toBe(false);
    expect(canContinue("nombre", OK)).toBe(true);
  });

  it("nombre corto: el escrito o el calculado", () => {
    expect(effectiveShort("Grupo Casa Norte Alimentos S.A. de C.V.", "")).toBe("Casa Norte");
    expect(effectiveShort("Casa Norte Alimentos", "CN")).toBe("CN");
    expect(effectiveShort("", undefined)).toBeNull();
    expect(effectiveShort("Casa Norte", "{x}")).toBeNull();
  });

  it("arma la entrada de setupCompany y el motor la acepta", () => {
    const inp = buildSetup({ ...OK, specialty: "Botanas y snacks" }, CID)!;
    expect(inp).toEqual({ companyId: CID, ...OK, specialty: "Botanas y snacks" });
    expect(newCompanyProfile({ ...inp, at: 1 }, TAXONOMY_VERSION)?.shortName).toBe("Casa Norte");
    expect(buildSetup({ ...OK, specialty: "Inventada" }, CID)?.specialty).toBeUndefined();
    expect(buildSetup({ ...OK, shortName: "  Norte " }, CID)?.shortName).toBe("Norte");
    expect(buildSetup(OK, "no-es-uuid")).toBeNull();
    expect(buildSetup({ ...OK, archetype: "startup" }, CID)).toBeNull();
  });

  it("id de empresa: siempre un uuid válido, también sin crypto.randomUUID", () => {
    expect(isCompanyId(newCompanyId())).toBe(true);
    const g = globalThis as { crypto?: unknown };
    const saved = g.crypto;
    try {
      Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });
      let x = 0;
      const id = newCompanyId(() => ((x = (x * 9301 + 49297) % 233280) / 233280));
      expect(isCompanyId(id)).toBe(true);
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: saved, configurable: true });
    }
  });

  it("la carta de nombramiento lleva el nombre elegido y nunca el del paquete", () => {
    const pk = previewPack({ ...OK, displayName: "Alimentos Sierra Norte" })!;
    expect(pk.name).toBe("Alimentos Sierra Norte");
    expect(`${pk.welcome} ${pk.pitch}`).not.toMatch(/Cumbre/);
    expect(previewPack({ sectorId: "manufactura", industryId: "autopartes" })?.id).toBe("forja");
    expect(previewPack({})).toBeNull();
    const br = previewPack({ sectorId: "restaurantes_alimentos", industryId: "restaurantes", displayName: "Fogón Regio" })!;
    expect(JSON.stringify([br.welcome, br.pitch, br.facts])).not.toMatch(/\bBrasa\b/);
  });

  it("textos de apoyo", () => {
    expect(nameExample("forja")).toBe("Metalúrgica Valle Alto");
    expect(nameExample(undefined)).toBe("Grupo Horizonte");
    expect(appointedByOf("establecida")).toBe("Te nombra el consejo.");
    expect(appointedByOf(undefined)).toBe("Te nombra el consejo.");
  });
});
