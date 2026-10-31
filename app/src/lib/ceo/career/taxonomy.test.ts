import { describe, expect, it } from "vitest";
import { COMPANIES } from "../companies";
import { COMING_SOON_LABEL } from "../catalog";
import {
  ARCHETYPES, INDUSTRY_PLACEHOLDER, SECTORS, TAXONOMY_VERSION, archetypeAvailability, availabilityLabel, changeSector, focusIndustries,
  industriesOf, industryOf, isArchetype, isPlayableCombo, norm, searchIndustries, sectorById,
} from "./taxonomy";

const all = SECTORS.flatMap((s) => s.industries);

describe("taxonomía sector → industria", () => {
  it("tiene versión, 21 sectores y más de 200 industrias", () => {
    expect(TAXONOMY_VERSION).toBeGreaterThanOrEqual(1);
    expect(SECTORS).toHaveLength(21);
    expect(all.length).toBeGreaterThan(200);
    for (const s of SECTORS) expect(s.industries.length).toBeGreaterThanOrEqual(9);
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
    expect(industryOf("tecnologia", "botanas_y_snacks")).toBeUndefined();
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
    const list = industriesOf("alimentos");
    expect(list.length).toBe(12);
    expect(list.every((i) => i.sectorId === "alimentos")).toBe(true);
  });

  it("cambiar el sector limpia la industria anterior", () => {
    const sel = { sectorId: "alimentos", industryId: "botanas_y_snacks" };
    expect(changeSector(sel, "tecnologia")).toEqual({ sectorId: "tecnologia" });
    expect(changeSector(sel, "alimentos")).toEqual(sel);
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
    expect(isPlayableCombo("tecnologia", "software_empresarial_b2b")).toBe(false);
    expect(isPlayableCombo("tecnologia", "software_empresarial_b2b", "startup")).toBe(false);
    expect(isPlayableCombo("alimentos", "botanas_y_snacks", "establecida")).toBe(true);
    expect(isPlayableCombo("alimentos", "botanas_y_snacks", "startup")).toBe(false);
    expect(isPlayableCombo("alimentos", "lacteos", "establecida")).toBe(false);
    expect(isPlayableCombo(undefined, undefined)).toBe(false);
    expect(archetypeAvailability("alimentos", "botanas_y_snacks", "startup")).toBe("coming_soon");
  });

  it("la etiqueta de lo no jugable es la única aprobada, sin fecha", () => {
    expect(availabilityLabel("coming_soon")).toBe(COMING_SOON_LABEL);
    expect(availabilityLabel("available")).toBeNull();
  });

  it("los sectores con alguna industria jugable se marcan disponibles", () => {
    expect(sectorById("alimentos")?.availability).toBe("available");
    expect(sectorById("automotriz")?.availability).toBe("available");
    expect(sectorById("turismo")?.availability).toBe("available");
    expect(sectorById("mineria")?.availability).toBe("coming_soon");
  });
});

describe("búsqueda por sinónimos", () => {
  it("normaliza acentos y mayúsculas", () => {
    expect(norm("  Panadería  Industrial ")).toBe("panaderia industrial");
  });

  it("«SaaS» sugiere Tecnología → Software empresarial B2B", () => {
    const [top] = searchIndustries("SaaS");
    expect(top).toMatchObject({ sectorId: "tecnologia", industryId: "software_empresarial_b2b" });
  });

  it("«autopartes» sugiere Automotriz → Fabricación de autopartes (aunque se busque desde otro sector)", () => {
    const [top] = searchIndustries("autopartes");
    expect(top).toMatchObject({ sectorId: "automotriz", industryId: "fabricacion_de_autopartes", availability: "available" });
  });

  it("«fintech» trae varias opciones de Finanzas, no una sola selección", () => {
    const r = searchIndustries("fintech");
    expect(r.length).toBeGreaterThan(1);
    expect(r.every((x) => x.sectorId === "finanzas")).toBe(true);
  });

  it("«snacks» y «restaurante» encuentran las combinaciones jugables", () => {
    expect(searchIndustries("snacks")[0]).toMatchObject({ industryId: "botanas_y_snacks", availability: "available" });
    expect(searchIndustries("restaurante")[0]).toMatchObject({ industryId: "restaurantes", availability: "available" });
  });

  it("la búsqueda no selecciona nada (función pura) y textos cortos no devuelven ruido", () => {
    expect(searchIndustries("a")).toEqual([]);
    expect(searchIndustries("zzzz")).toEqual([]);
  });
});

describe("foco de lanzamiento (decisión de Oziel)", () => {
  it("incluye Alimentos, Software, Manufactura, Retail, Logística, Autopartes y Restaurantes", () => {
    const f = focusIndustries();
    const sectors = new Set(f.map((i) => i.sectorId));
    for (const s of ["alimentos", "tecnologia", "manufactura", "retail", "logistica"]) expect(sectors.has(s)).toBe(true);
    expect(f.some((i) => i.id === "fabricacion_de_autopartes")).toBe(true);
    expect(f.some((i) => i.id === "restaurantes")).toBe(true);
    expect(f.some((i) => i.sectorId === "mineria")).toBe(false);
  });
});
