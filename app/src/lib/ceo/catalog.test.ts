import { describe, expect, it } from "vitest";
import { COMPANIES } from "./companies";
import { CATALOG_VERSION, COMING_SOON_LABEL, INDUSTRY_CATALOG, catalogCompanyById, industryById, isPlayable, statusLabel, validateHome, visibleCompanies, visibleIndustries } from "./catalog";

const all = INDUSTRY_CATALOG.flatMap((i) => i.companies);

describe("catálogo de industrias", () => {
  it("tiene versión y 8 industrias iniciales con 3 empresas cada una (sin límite fijo en el código)", () => {
    expect(CATALOG_VERSION).toBeGreaterThanOrEqual(1);
    expect(INDUSTRY_CATALOG).toHaveLength(8);
    for (const i of INDUSTRY_CATALOG) expect(i.companies.length).toBeGreaterThanOrEqual(3);
  });

  it("ids únicos y estables (minúsculas, sin espacios)", () => {
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(INDUSTRY_CATALOG.map((i) => i.id)).size).toBe(INDUSTRY_CATALOG.length);
    for (const id of [...ids, ...INDUSTRY_CATALOG.map((i) => i.id)]) expect(id).toMatch(/^[a-z]+$/);
  });

  it("solo son jugables las fundacionales y Kúbit, y coinciden con los paquetes construidos", () => {
    const playable = all.filter((c) => isPlayable(c.id)).map((c) => c.id).sort();
    expect(playable).toEqual(["brasa", "cumbre", "forja", "kubit"]);
    expect(playable).toEqual(COMPANIES.map((c) => c.id).sort());
    for (const c of all.filter((x) => x.foundational)) expect(c.status).toBe("available");
  });

  it("ninguna empresa disponible carece de paquete (no se presenta como jugable lo que no existe)", () => {
    for (const c of all.filter((x) => x.status === "available")) expect(COMPANIES.some((p) => p.id === c.id)).toBe(true);
  });

  it("los nombres de paquete y catálogo coinciden para las fundacionales", () => {
    for (const p of COMPANIES) expect(catalogCompanyById(p.id)?.name).toBe(p.name);
  });

  it("las no jugables son tentativas (pendientes de revisión de marcas)", () => {
    for (const c of all.filter((x) => !x.foundational)) expect(c.provisional).toBe(true);
  });

  it("cada empresa tiene identidad y tensión propias, distintas dentro de su industria", () => {
    for (const i of INDUSTRY_CATALOG) {
      const t = i.companies.map((c) => c.tension);
      expect(new Set(t).size).toBe(t.length);
      for (const c of i.companies) { expect(c.identity.length).toBeGreaterThan(30); expect(c.tension.length).toBeGreaterThan(20); expect(c.line.length).toBeGreaterThan(3); }
    }
  });

  it("el estado de la industria se deriva de sus empresas", () => {
    expect(industryById("consumo")?.status).toBe("available");
    expect(industryById("salud")?.status).toBe("coming_soon");
    expect(industryById("nada")).toBeNull();
  });

  it("el selector muestra disponibles primero y oculta retiradas", () => {
    const v = visibleIndustries();
    expect(v.slice(0, 3).map((i) => i.id).sort()).toEqual(["consumo", "manufactura", "restaurantes"]);
    expect(v.every((i) => i.status !== "retired")).toBe(true);
    expect(visibleCompanies("consumo")[0].id).toBe("cumbre");
    expect(visibleCompanies("nada")).toEqual([]);
  });

  it("etiqueta honesta: «Próximamente», sin fechas", () => {
    expect(statusLabel("coming_soon")).toBe(COMING_SOON_LABEL);
    expect(COMING_SOON_LABEL).toBe("Próximamente");
    expect(statusLabel("available")).toBeNull();
  });
});

describe("validación del par industria–empresa (servidor)", () => {
  it("acepta solo empresas jugables de esa industria", () => {
    expect(validateHome("consumo", "cumbre")).toEqual({ ok: true });
    expect(validateHome("manufactura", "forja")).toEqual({ ok: true });
    expect(validateHome("consumo", "forja")).toEqual({ ok: false, reason: "no_pertenece" });
    expect(validateHome("consumo", "sierraysal")).toEqual({ ok: false, reason: "no_jugable" });
    expect(validateHome("salud", "sanrafael")).toEqual({ ok: false, reason: "no_jugable" });
    expect(validateHome("x", "cumbre")).toEqual({ ok: false, reason: "industria_desconocida" });
    expect(validateHome("consumo", "x")).toEqual({ ok: false, reason: "empresa_desconocida" });
    expect(validateHome(null, null).ok).toBe(false);
  });
});
