import { describe, expect, it } from "vitest";
import { DEFAULT_TYPE, OFFERED_ARCHETYPES, appointedByOf, buildSetup, canContinue, changeType, defaultArchetype, industriesForType, searchForType, sectorsForType, selectionForPackAndType, suggestionForPack, typeOpen, effectiveShort, nameExample, newCompanyId, previewPack, selectionForPack } from "./setup";
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

  it("tipo sugerido por industria: la establecida si se ofrece; si no, la startup", () => {
    expect(defaultArchetype("manufactura", "alimentos_bebidas")).toBe("establecida");
    expect(defaultArchetype("tecnologia_informacion", "software_saas")).toBe("startup");
    expect(defaultArchetype("comercio", "retail")).toBe("establecida");
    expect(defaultArchetype("transporte_almacenamiento", "logistica_distribucion")).toBe("establecida");
    expect(defaultArchetype("comercio", "farmacias")).toBeUndefined();
  });

  it("solo deja avanzar con combinaciones jugables", () => {
    // Primero el tipo (solo startup o establecida), después una industria de ese tipo.
    expect(canContinue("tipo", {})).toBe(false);
    expect(canContinue("tipo", { archetype: "pyme" })).toBe(false);
    expect(canContinue("tipo", { archetype: "startup" })).toBe(true);
    expect(canContinue("tipo", { archetype: "establecida" })).toBe(true);
    expect(canContinue("industria", {})).toBe(false);
    expect(canContinue("industria", { sectorId: "comercio", industryId: "retail" })).toBe(false);
    expect(canContinue("industria", { archetype: "establecida", sectorId: "comercio", industryId: "farmacias" })).toBe(false);
    expect(canContinue("industria", { archetype: "establecida", sectorId: "transporte_almacenamiento", industryId: "logistica_distribucion" })).toBe(true);
    expect(canContinue("industria", { archetype: "startup", sectorId: "transporte_almacenamiento", industryId: "logistica_distribucion" })).toBe(false);
    expect(canContinue("industria", { archetype: "establecida", sectorId: "comercio", industryId: "retail" })).toBe(true);
    expect(canContinue("industria", { archetype: "startup", sectorId: "comercio", industryId: "retail" })).toBe(false);
    expect(canContinue("industria", { archetype: "startup", sectorId: "tecnologia_informacion", industryId: "software_saas" })).toBe(true);
    expect(canContinue("industria", { archetype: "establecida", sectorId: "tecnologia_informacion", industryId: "software_saas" })).toBe(false);
    expect(canContinue("industria", OK)).toBe(true);
    expect(canContinue("industria", { ...OK, archetype: "pyme" })).toBe(false);
    expect(canContinue("industria", { ...OK, archetype: "startup" })).toBe(false);
    expect(canContinue("nombre", { ...OK, displayName: "x" })).toBe(false);
    expect(canContinue("nombre", { ...OK, displayName: "Mi {empresa}" })).toBe(false);
    expect(canContinue("nombre", { ...OK, shortName: "<b>" })).toBe(false);
    expect(canContinue("nombre", OK)).toBe(true);
  });

  it("solo dos tipos al empezar: startup y establecida; cada uno muestra solo sus industrias", () => {
    expect(OFFERED_ARCHETYPES).toEqual(["startup", "establecida"]);
    expect(DEFAULT_TYPE).toBe("establecida");
    expect(typeOpen("startup")).toBe(true);
    expect(typeOpen("establecida")).toBe(true);
    expect(typeOpen("pyme")).toBe(false);
    expect(industriesForType("startup").map((i) => i.id)).toEqual(["software_saas"]);
    expect(industriesForType("establecida").map((i) => i.id).sort()).toEqual(["alimentos_bebidas", "autopartes", "logistica_distribucion", "restaurantes", "retail"]);
    expect(industriesForType("pyme")).toEqual([]);
    expect(industriesForType(undefined)).toEqual([]);
    // Los sectores solo traen las industrias del tipo; ninguno queda vacío.
    expect(sectorsForType("startup").map((s) => s.id)).toEqual(["tecnologia_informacion"]);
    for (const a of OFFERED_ARCHETYPES) for (const s of sectorsForType(a)) {
      expect(s.industries.length, s.id).toBeGreaterThan(0);
      for (const i of s.industries) expect(industriesForType(a).some((x) => x.id === i.id && x.sectorId === s.id)).toBe(true);
    }
    expect(sectorsForType("establecida").map((s) => s.id)).not.toContain("tecnologia_informacion");
  });

  it("la búsqueda por giro solo propone industrias del tipo elegido", () => {
    expect(searchForType("software", "startup").map((h) => h.industryId)).toContain("software_saas");
    expect(searchForType("software", "establecida")).toEqual([]);
    expect(searchForType("ferreteria", "establecida").length + searchForType("tiendas", "establecida").length).toBeGreaterThan(0);
    expect(searchForType("tiendas", "startup")).toEqual([]);
    expect(searchForType("autopartes", "establecida").map((h) => h.industryId)).toContain("autopartes");
  });

  it("cambiar de tipo conserva la industria solo si existe para el nuevo tipo", () => {
    const est = { archetype: "establecida" as const, sectorId: "comercio", industryId: "retail", specialty: "Omnicanal" };
    expect(changeType(est, "establecida")).toEqual(est);
    expect(changeType(est, "startup")).toEqual({ archetype: "startup" });
    expect(changeType(est, "pyme")).toBe(est);
    const st = { archetype: "startup" as const, sectorId: "tecnologia_informacion", industryId: "software_saas", displayName: "Nube" };
    expect(changeType(st, "establecida")).toEqual({ archetype: "establecida", displayName: "Nube" });
  });

  it("la experiencia declarada sugiere industria y tipo coherentes", () => {
    expect(selectionForPackAndType("cumbre", "establecida")).toEqual({ sectorId: "manufactura", industryId: "alimentos_bebidas" });
    expect(selectionForPackAndType("cumbre", "startup")).toEqual({});
    expect(suggestionForPack("kubit")).toEqual({ sectorId: "tecnologia_informacion", industryId: "software_saas", archetype: "startup" });
    expect(suggestionForPack("puntomadero")).toEqual({ sectorId: "comercio", industryId: "retail", archetype: "establecida" });
    expect(suggestionForPack("nada")).toEqual({});
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
