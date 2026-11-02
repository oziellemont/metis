import { describe, expect, it } from "vitest";
import { COMPANIES, companyById } from "../companies";
import { EPISODES } from "../episodes/catalog";
import { brandedEpisode, packOf } from "../engine";
import { brandPack } from "./template";
import { newCompanyProfile } from "./identity";
import { industryOf } from "./taxonomy";
import { previewPack } from "./setup";
import { PACK_INDUSTRY, PACK_ORIGINAL_SPECIALTY, cleanSpecialty, industryLabelFor, lexSpecialties, lexText } from "./lexicon";
import type { CeoState } from "../types";

const ID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const BRAND = { name: "Sigma Alimentos", short: "Sigma" };
const INDUSTRY_OF: Record<string, [string, string]> = { cumbre: ["manufactura", "alimentos_bebidas"], forja: ["manufactura", "autopartes"], brasa: ["restaurantes_alimentos", "restaurantes"], kubit: ["tecnologia_informacion", "software_saas"], puntomadero: ["comercio", "retail"] };

function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === "string") { if (!/^[a-z0-9_-]+$/.test(x)) out.push(x); }
  else if (Array.isArray(x)) x.forEach((y) => strings(y, out));
  else if (x && typeof x === "object") Object.values(x).forEach((y) => strings(y, out));
  return out;
}
/** Palabras que delatan la rama original del paquete. Ninguna puede verse con otra especialidad. */
const ORIGINAL_WORDS: Record<string, RegExp> = {
  cumbre: /botan|cacahuate|\bpapas\b|picositas|sazonador|charola/i,
  forja: /soldad|troquel|estampad|\bprensas?\b|lámina/i,
  brasa: /de cortes y cocina mexicana a la brasa|restaurantes de cortes/i,
  kubit: /cobranza/i,
  puntomadero: /ferreter/i,
};
const EXTRA: Record<string, RegExp> = { "Comida rápida": /mesero|arrachera/i, "Cocinas ocultas": /mesero/i };

const allSpecialties = (packId: string) => industryOf(...INDUSTRY_OF[packId])!.specialties;

describe("vocabulario por especialidad", () => {
  it("cada especialidad del catálogo de las industrias jugables tiene vocabulario (o es la original)", () => {
    for (const pk of COMPANIES) {
      const ind = industryOf(...INDUSTRY_OF[pk.id])!;
      expect(ind.label).toBe(PACK_INDUSTRY[pk.id]);
      expect(ind.contentPackId).toBe(pk.id);
      for (const sp of ind.specialties) expect(sp === PACK_ORIGINAL_SPECIALTY[pk.id] || lexSpecialties(pk.id).includes(sp), `${pk.id} · ${sp}`).toBe(true);
    }
  });

  for (const pk of COMPANIES) {
    for (const sp of allSpecialties(pk.id)) {
      if (sp === PACK_ORIGINAL_SPECIALTY[pk.id]) continue;
      it(`${pk.id} · ${sp}: el paquete y sus casos no hablan de la rama original`, () => {
        const b = brandPack(pk, { ...BRAND, specialty: sp });
        const bad = strings(b).filter((t) => ORIGINAL_WORDS[pk.id].test(t) || (EXTRA[sp]?.test(t) ?? false));
        expect(bad, bad.slice(0, 3).join("\n")).toEqual([]);
        expect(b.industry).toBe(sp);
        // ids, efectos y números intactos
        expect(b.items.map((i) => [i.id, i.from, i.options.map((o) => [o.id, o.effects, o.score])])).toEqual(pk.items.map((i) => [i.id, i.from, i.options.map((o) => [o.id, o.effects, o.score])]));
        expect(b.kpiStart).toEqual(pk.kpiStart);
      });
    }
  }

  it("Alimentos sin especialidad: genérico, nunca «botanas»", () => {
    const b = brandPack(companyById("cumbre"), BRAND);
    expect(strings(b).filter((t) => ORIGINAL_WORDS.cumbre.test(t))).toEqual([]);
    expect(b.industry).toBe("Alimentos y bebidas");
    expect(b.pitch).toContain("Empresa familiar regiomontana de alimentos empacados");
  });

  it("la especialidad original no cambia los textos (solo el nombre)", () => {
    const pk = companyById("cumbre");
    const b = brandPack(pk, { ...BRAND, specialty: "Botanas y snacks" });
    expect(b.pitch).toContain("botanas y cacahuates");
    expect(b.industry).toBe("Botanas y snacks");
    expect(brandPack(companyById("forja"), BRAND).pitch).toContain("estampadas y soldadas");
  });

  it("Lácteos: la carta dice lácteos, la cadena compra Lácteos y el yogur premium", () => {
    const b = brandPack(companyById("cumbre"), { ...BRAND, specialty: "Lácteos" });
    expect(b.pitch.startsWith("Empresa familiar regiomontana de lácteos: leche, yogur y quesos.")).toBe(true);
    expect(b.tagline).toBe("Empresa familiar de lácteos. El fundador te deja su silla.");
    const all = strings(b).join("\n");
    expect(all).toContain("Compradora de categoría Lácteos");
    expect(all).toContain("yogur griego premium");
    expect(all).toContain("El pasteurizador de la línea 2");
    expect(all).toContain("nuestros yogures rotan mejor que los de ellos");
  });

  it("la carta de nombramiento usa la especialidad elegida, aun antes de escribir el nombre", () => {
    const sel = { sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida" as const, specialty: "Lácteos" };
    expect(previewPack(sel)!.pitch).toContain("lácteos");
    expect(previewPack({ ...sel, displayName: "Sigma Alimentos" })!.pitch).not.toMatch(/botan/i);
    expect(previewPack({ ...sel, specialty: "Café" })!.pitch).toContain("café tostado");
    expect(previewPack({ ...sel, specialty: "Inventada" })!.pitch).toContain("alimentos empacados");
  });

  it("casos: con Lácteos el alérgeno es del saborizante, el producto cambia y las palabras clave siguen funcionando", () => {
    const profile = newCompanyProfile({ companyId: ID, sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: BRAND.name, specialty: "Lácteos", at: 1 }, 2)!;
    for (const spec of Object.values(EPISODES)) {
      const b = brandedEpisode(spec, { companyProfile: profile });
      const bad = strings(b).filter((t) => /botan|picositas|sazonador|\bpapas\b/i.test(t));
      expect(bad, `${spec.id}: ${bad.slice(0, 2).join(" | ")}`).toEqual([]);
      expect(b.industry).toBe("Alimentos y bebidas · Lácteos");
      expect(b.rules).toBe(spec.rules);
      expect(Object.keys(b.nodes)).toEqual(Object.keys(spec.nodes));
    }
    const al = brandedEpisode(EPISODES["alergeno"] ?? Object.values(EPISODES).find((e) => e.title === "Lote L-2291")!, { companyProfile: profile });
    expect(al.subject).toBe("Posible alérgeno no declarado en Yogurín");
    const alcance = al.facts.facts.find((f) => f.id === "alcance")!;
    expect(alcance.keywords).toContain("piezas");
    expect(alcance.answer).toContain("18,000 piezas");
  });

  it("autopartes · arneses: técnicos de ensamble, aplicador y cobre", () => {
    const b = brandPack(companyById("forja"), { ...BRAND, specialty: "Arneses eléctricos" });
    const all = strings(b).join("\n");
    expect(b.pitch).toContain("Proveedor Tier 1 de arneses eléctricos");
    expect(all).toContain("Fuga de técnicos de ensamble");
    expect(all).toContain("el aplicador estaba gastado");
    expect(all).toContain("cláusula de cobre");
  });

  it("restaurantes · comida rápida: cajeros y hamburguesa", () => {
    const b = brandPack(companyById("brasa"), { ...BRAND, specialty: "Comida rápida" });
    expect(b.pitch).toContain("Cadena de comida rápida");
    expect(strings(b).join("\n")).toContain("Rotación de cajeros");
  });

  it("estado guardado: la empresa del jugador lleva su especialidad a todos los textos", () => {
    const profile = newCompanyProfile({ companyId: ID, sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: BRAND.name, specialty: "Salsas y condimentos", at: 1 }, 2)!;
    const pk = packOf({ company: "cumbre", companyProfile: profile } as Pick<CeoState, "company" | "companyProfile">);
    expect(pk.industry).toBe("Salsas y condimentos");
    expect(pk.pitch).toContain("salsas y condimentos");
    expect(pk.name).toBe("Sigma Alimentos");
  });

  it("especialidades inválidas se ignoran; textos sin coincidencias no cambian", () => {
    expect(cleanSpecialty("cumbre", "Arneses eléctricos")).toBeUndefined();
    expect(cleanSpecialty("cumbre", 4)).toBeUndefined();
    expect(industryLabelFor("cumbre", "Arneses eléctricos")).toBe("Alimentos y bebidas");
    expect(lexText("Hola equipo", "cumbre", "Lácteos")).toBe("Hola equipo");
    expect(lexText("Papas y botanas", "otro", "Lácteos")).toBe("Papas y botanas");
  });
});
