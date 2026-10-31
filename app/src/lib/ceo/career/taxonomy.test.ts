import { describe, expect, it } from "vitest";
import { COMPANIES } from "../companies";
import { COMING_SOON_LABEL } from "../catalog";
import {
  ARCHETYPES, INDUSTRY_PLACEHOLDER, SECTORS, TAXONOMY_VERSION, archetypeAvailability, availabilityLabel, changeSector, focusIndustries,
  industriesOf, industryOf, isArchetype, isPlayableCombo, norm, searchIndustries, sectorById,
} from "./taxonomy";

const all = SECTORS.flatMap((s) => s.industries);

describe("taxonomía sector → industria", () => {
  it("v2: sectores con lógica SCIAN, cada uno con industrias", () => {
    expect(TAXONOMY_VERSION).toBe(2);
    expect(SECTORS.length).toBeGreaterThanOrEqual(15);
    for (const s of SECTORS) expect(s.industries.length).toBeGreaterThanOrEqual(1);
  });

  it("las 7 industrias foco quedan en el mismo nivel y en su sector correcto (ajuste de Oziel)", () => {
    const f = Object.fromEntries(focusIndustries().map((i) => [i.id, i.sectorId]));
    expect(f).toEqual({
      alimentos_bebidas: "manufactura", autopartes: "manufactura", manufactura_general: "manufactura",
      restaurantes: "restaurantes_alimentos", software_saas: "tecnologia_informacion", retail: "comercio", logistica_distribucion: "transporte_almacenamiento",
    });
  });

  it("sin duplicidades conceptuales: Manufactura es sector, no industria; Restaurantes no está en Manufactura", () => {
    expect(sectorById("manufactura")?.label).toBe("Manufactura");
    expect(all.some((i) => i.label === "Manufactura")).toBe(false);
    expect(industryOf("manufactura", "restaurantes")).toBeUndefined();
    const labels = all.map((i) => norm(i.label));
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("las ramas finas (botanas, 3PL…) son especialidades de una industria, no industrias aparte", () => {
    expect(industryOf("manufactura", "alimentos_bebidas")?.specialties).toContain("Botanas y snacks");
    expect(industryOf("transporte_almacenamiento", "logistica_distribucion")?.specialties).toContain("Operador 3PL");
    expect(all.some((i) => i.id === "botanas_y_snacks")).toBe(false);
  });

  it("ids estables: minúsculas y guion bajo, únicos por sector y globalmente", () => {
    const sids = SECTORS.map((s) => s.id);
    expect(new Set(sids).size).toBe(sids.length);
    const iids = all.map((i) => i.id);
    expect(new Set(iids).size).toBe(iids.length);
    for (const id of [...sids, ...iids]) expect(id).toMatch(/^[a-z0-9_]+$/);
  });

  it("cada industria pertenece a su sector (no hay parejas cruzadas)", () => {
    for (const s of SECTORS) for (const i of s.industries) {
      expect(i.sectorId).toBe(s.id);
      expect(industryOf(s.id, i.id)).toBe(i);
    }
    expect(industryOf("tecnologia_informacion", "alimentos_bebidas")).toBeUndefined();
  });

  it("los tres tipos de empresa existen y el usuario siempre es nombrado (nunca fundador)", () => {
    expect(ARCHETYPES.map((a) => a.id)).toEqual(["pyme", "startup", "establecida"]);
    for (const a of ARCHETYPES) expect(a.appointedBy.toLowerCase()).not.toMatch(/fund(as|aste|ar)\b/);
    expect(isArchetype("startup")).toBe(true);
    expect(isArchetype("fundador")).toBe(false);
  });
});

describe("desplegables dependientes", () => {
  it("sin sector, la industria queda vacía y deshabilitada", () => {
    expect(industriesOf(undefined)).toEqual([]);
    expect(industriesOf("no-existe")).toEqual([]);
    expect(INDUSTRY_PLACEHOLDER).toBe("Primero elige un sector");
  });

  it("con sector, solo aparecen sus industrias", () => {
    const list = industriesOf("manufactura");
    expect(list.map((i) => i.id).slice(0, 3)).toEqual(["alimentos_bebidas", "autopartes", "manufactura_general"]);
    expect(list.every((i) => i.sectorId === "manufactura")).toBe(true);
  });

  it("cambiar el sector limpia la industria anterior", () => {
    const sel = { sectorId: "manufactura", industryId: "alimentos_bebidas" };
    expect(changeSector(sel, "comercio")).toEqual({ sectorId: "comercio" });
    expect(changeSector(sel, "manufactura")).toEqual(sel);
    expect(changeSector(sel, "inventado")).toEqual({});
  });
});

describe("disponibilidad: «Próximamente» bloquea", () => {
  it("solo es jugable lo que tiene paquete existente, métricas y un tipo soportado", () => {
    const playable = all.filter((i) => i.availability === "available");
    expect(playable.map((i) => i.contentPackId).sort()).toEqual(["brasa", "cumbre", "forja"]);
    for (const i of playable) {
      expect(COMPANIES.some((c) => c.id === i.contentPackId)).toBe(true);
      expect(i.metricProfileId).toBeTruthy();
      expect(i.supportedArchetypes.length).toBeGreaterThan(0);
    }
  });

  it("una combinación sin contenido no pasa", () => {
    expect(isPlayableCombo("tecnologia_informacion", "software_saas")).toBe(false);
    expect(isPlayableCombo("tecnologia_informacion", "software_saas", "startup")).toBe(false);
    expect(isPlayableCombo("manufactura", "alimentos_bebidas", "establecida")).toBe(true);
    expect(isPlayableCombo("manufactura", "alimentos_bebidas", "startup")).toBe(false);
    expect(isPlayableCombo("manufactura", "electronica", "establecida")).toBe(false);
    expect(isPlayableCombo(undefined, undefined)).toBe(false);
    expect(archetypeAvailability("manufactura", "alimentos_bebidas", "startup")).toBe("coming_soon");
  });

  it("la etiqueta de lo no jugable es la única aprobada, sin fecha", () => {
    expect(availabilityLabel("coming_soon")).toBe(COMING_SOON_LABEL);
    expect(availabilityLabel("available")).toBeNull();
  });

  it("los sectores con alguna industria jugable se marcan disponibles", () => {
    expect(sectorById("manufactura")?.availability).toBe("available");
    expect(sectorById("restaurantes_alimentos")?.availability).toBe("available");
    expect(sectorById("comercio")?.availability).toBe("coming_soon");
    expect(sectorById("mineria")?.availability).toBe("coming_soon");
  });
});

describe("búsqueda por sinónimos", () => {
  it("normaliza acentos y mayúsculas", () => {
    expect(norm("  Panadería  Industrial ")).toBe("panaderia industrial");
  });

  it("«SaaS» sugiere Tecnología e información → Software y SaaS", () => {
    const [top] = searchIndustries("SaaS");
    expect(top).toMatchObject({ sectorId: "tecnologia_informacion", industryId: "software_saas" });
  });

  it("«autopartes» sugiere Manufactura → Autopartes", () => {
    const [top] = searchIndustries("autopartes");
    expect(top).toMatchObject({ sectorId: "manufactura", industryId: "autopartes", availability: "available" });
  });

  it("«fintech» trae varias opciones de Finanzas, no una sola selección", () => {
    const r = searchIndustries("fintech");
    expect(r.length).toBeGreaterThan(1);
    expect(r.every((x) => x.sectorId === "finanzas")).toBe(true);
  });

  it("«snacks» y «restaurante» encuentran las combinaciones jugables", () => {
    expect(searchIndustries("snacks")[0]).toMatchObject({ industryId: "alimentos_bebidas", availability: "available" });
    expect(searchIndustries("3pl")[0]).toMatchObject({ sectorId: "transporte_almacenamiento", industryId: "logistica_distribucion" });
    expect(searchIndustries("restaurante")[0]).toMatchObject({ industryId: "restaurantes", availability: "available" });
  });

  it("la búsqueda no selecciona nada (función pura) y textos cortos no devuelven ruido", () => {
    expect(searchIndustries("a")).toEqual([]);
    expect(searchIndustries("zzzz")).toEqual([]);
  });
});
