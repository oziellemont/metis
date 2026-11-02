import { describe, expect, it } from "vitest";
import { cleanName, domainOf, newCompanyProfile, renameProfile, sanitizeCompanyProfile, shortNameOf, COMPANY_STAGES } from "./identity";
import { formatMoney, fxOf, toDisplay, FX_ASSUMPTIONS, FX_VERSION, isDisplayCurrency } from "./money";
import { TAXONOMY_VERSION } from "./taxonomy";

const ID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const base = { companyId: ID, sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: "Casa Norte Alimentos", at: 1_800_000_000_000 };

describe("identidad de la empresa", () => {
  it("crea una empresa jugable: CEO nombrado, MXN, etapa inicial, paquete y métrica de la industria", () => {
    const p = newCompanyProfile(base, TAXONOMY_VERSION)!;
    expect(p).toMatchObject({ companyId: ID, sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: "Casa Norte Alimentos", shortName: "Casa Norte", contentPackId: "cumbre", metricProfileId: "alimentos", stage: "tomar_el_mando", userRole: "appointed_ceo", currency: "MXN", taxonomyVersion: TAXONOMY_VERSION });
    expect(p.exposure.baseCity).toBe("Monterrey, N.L.");
    expect(p.exposure.buyCurrencies).toContain("USD");
  });

  it("los cuatro paquetes de hoy crean empresa; lo que no tiene casos, no", () => {
    expect(newCompanyProfile({ ...base, industryId: "autopartes", displayName: "Troqueles del Bajío" }, 2)?.contentPackId).toBe("forja");
    expect(newCompanyProfile({ ...base, sectorId: "restaurantes_alimentos", industryId: "restaurantes", displayName: "Fogón 33" }, 2)?.contentPackId).toBe("brasa");
    expect(newCompanyProfile({ ...base, archetype: "pyme" }, 2)?.contentPackId).toBe("cumbre");
    expect(newCompanyProfile({ ...base, industryId: "autopartes", archetype: "pyme" }, 2)).toBeNull();
    expect(newCompanyProfile({ ...base, archetype: "startup" }, 2)).toBeNull();
    expect(newCompanyProfile({ ...base, sectorId: "tecnologia_informacion", industryId: "software_saas", displayName: "Nube Regia" }, 2)?.contentPackId).toBe("kubit");
    expect(newCompanyProfile({ ...base, sectorId: "tecnologia_informacion", industryId: "software_saas", archetype: "startup" }, 2)?.contentPackId).toBe("kubit");
    expect(newCompanyProfile({ ...base, sectorId: "tecnologia_informacion", industryId: "software_saas", archetype: "pyme" }, 2)).toBeNull();
    expect(newCompanyProfile({ ...base, sectorId: "comercio", industryId: "retail", displayName: "Ferretera del Norte" }, 2)?.contentPackId).toBe("puntomadero");
    expect(newCompanyProfile({ ...base, sectorId: "comercio", industryId: "retail", archetype: "pyme" }, 2)).toBeNull();
    expect(newCompanyProfile({ ...base, sectorId: "transporte_almacenamiento", industryId: "logistica_distribucion", displayName: "Fletes del Norte" }, 2)?.contentPackId).toBe("vertice");
    expect(newCompanyProfile({ ...base, sectorId: "transporte_almacenamiento", industryId: "logistica_distribucion", archetype: "startup" }, 2)).toBeNull();
    expect(newCompanyProfile({ ...base, sectorId: "comercio", industryId: "farmacias" }, 2)).toBeNull();
    expect(newCompanyProfile({ ...base, sectorId: "restaurantes_alimentos" }, 2)).toBeNull();
    expect(newCompanyProfile({ ...base, archetype: "fundador" }, 2)).toBeNull();
    expect(newCompanyProfile({ ...base, companyId: "no-uuid" }, 2)).toBeNull();
  });

  it("nombre: 2–40 caracteres, sin llaves ni signos de plantilla, espacios normalizados", () => {
    expect(cleanName("  Casa   Norte ")).toBe("Casa Norte");
    for (const bad of ["A", "x".repeat(41), "{company_name}", "Casa <b>", "   ", "--", 42, null]) expect(cleanName(bad)).toBeNull();
    expect(newCompanyProfile({ ...base, displayName: "{company_short}" }, 2)).toBeNull();
  });

  it("nombre corto derivado: quita razón social y prefijos genéricos", () => {
    expect(shortNameOf("Grupo Casa Norte Alimentos S.A. de C.V.")).toBe("Casa Norte");
    expect(shortNameOf("Nexo Labs")).toBe("Nexo Labs");
    expect(shortNameOf("Fogón")).toBe("Fogón");
    expect(shortNameOf("Norteña de Alimentos")).toBe("Norteña");
    expect(domainOf("Fogón 33")).toBe("fogon33.mx");
  });

  it("especialidad: solo si pertenece a la industria", () => {
    expect(newCompanyProfile({ ...base, specialty: "Botanas y snacks" }, 2)?.specialty).toBe("Botanas y snacks");
    expect(newCompanyProfile({ ...base, specialty: "Arneses eléctricos" }, 2)?.specialty).toBeUndefined();
  });

  it("renombrar conserva el id y todo lo demás; un nombre inválido no cambia nada", () => {
    const p = newCompanyProfile(base, 2)!;
    const r = renameProfile(p, "Norteña de Alimentos", undefined, base.at + 10);
    expect(r.companyId).toBe(p.companyId);
    expect(r).toMatchObject({ displayName: "Norteña de Alimentos", shortName: "Norteña", renamedAt: base.at + 10, contentPackId: "cumbre", appointedAt: p.appointedAt });
    expect(renameProfile(p, "Norteña de Alimentos", "Norteña", 1).shortName).toBe("Norteña");
    expect(renameProfile(p, "{x}", undefined, 1)).toBe(p);
    expect(renameProfile(p, p.displayName, p.shortName, 1)).toBe(p);
  });

  it("limpiar lo guardado: repara lo accesorio y descarta lo que no es confiable", () => {
    const p = newCompanyProfile(base, 2)!;
    expect(sanitizeCompanyProfile(JSON.parse(JSON.stringify(p)))).toEqual(p);
    const repaired = sanitizeCompanyProfile({ ...p, stage: "marte", shortName: "", exposure: { baseCity: "", sites: [{ kind: "nave", city: "X" }], buyCurrencies: ["EUR"] }, userRole: "founder", currency: "USD" })!;
    expect(repaired.stage).toBe("tomar_el_mando");
    expect(repaired.shortName).toBe("Casa Norte");
    expect(repaired.userRole).toBe("appointed_ceo");
    expect(repaired.currency).toBe("MXN");
    expect(repaired.exposure.baseCity).toBe("Monterrey, N.L.");
    expect(repaired.exposure.sites).toEqual([]);
    expect(repaired.exposure.buyCurrencies).toEqual(["MXN", "USD"]);
    for (const bad of [null, [], "x", { ...p, companyId: "1" }, { ...p, industryId: "nada" }, { ...p, contentPackId: "otro" }, { ...p, displayName: "{a}" }, { ...p, appointedAt: -1 }]) expect(sanitizeCompanyProfile(bad)).toBeNull();
  });

  it("las etapas son la trayectoria del doc P0, empezando por tomar el mando", () => {
    expect(COMPANY_STAGES.map((s) => s.id)).toEqual(["tomar_el_mando", "estabilizar", "construir_capacidad", "acelerar", "escalar", "gobernar"]);
  });
});

describe("moneda de pantalla", () => {
  it("MXN es la base; USD usa un tipo de cambio de referencia fijo y versionado", () => {
    expect(fxOf().version).toBe(FX_VERSION);
    expect(Object.isFrozen(FX_ASSUMPTIONS[1])).toBe(true);
    expect(toDisplay(18.5, "USD")).toBeCloseTo(1);
    expect(toDisplay(4, "MXN")).toBe(4);
    expect(fxOf(99)).toBe(fxOf(FX_VERSION));
    expect(isDisplayCurrency("USD")).toBe(true);
    expect(isDisplayCurrency("EUR")).toBe(false);
  });
  it("formato corto en millones", () => {
    expect(formatMoney(4)).toBe("$4.0 M MXN");
    expect(formatMoney(-0.06)).toBe("−$0.06 M MXN");
    expect(formatMoney(6.07)).toBe("$6.07 M MXN");
    expect(formatMoney(410)).toBe("$410 M MXN");
    expect(formatMoney(37, "USD")).toBe("$2.0 M USD");
  });
});
