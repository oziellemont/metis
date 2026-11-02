import { describe, expect, it } from "vitest";
import { COMPANIES, LEGACY_ROTATION, companyById } from "./index";
import { PUNTOMADERO } from "./puntomadero";
import { CASE_TAGS } from "./tags";
import { withBank, PACK_CONTEXT, PACK_ROLES } from "../cases/bank";
import { isPlayableCombo } from "../career/taxonomy";
import { lexText } from "../career/lexicon";
import { catalogCompanyById, isPlayable } from "../catalog";
import { SEASON_OBJECTIVES } from "../shadow-verdict";
import { profileFor } from "../business/profiles";

describe("Punto Madero · retail (P1-F)", () => {
  it("es jugable: registrada, en el catálogo y en la taxonomía (solo establecida)", () => {
    expect(COMPANIES.map((c) => c.id)).toContain("puntomadero");
    expect(companyById("puntomadero")).toBe(PUNTOMADERO);
    expect(isPlayable("puntomadero")).toBe(true);
    expect(catalogCompanyById("puntomadero")?.provisional).toBe(true);
    expect(isPlayableCombo("comercio", "retail", "establecida")).toBe(true);
    expect(isPlayableCombo("comercio", "retail", "pyme")).toBe(false);
    expect(isPlayableCombo("comercio", "retail", "startup")).toBe(false);
  });

  it("no entra a la rotación del modo por temporadas (las partidas grabadas no cambian)", () => {
    expect(LEGACY_ROTATION.map((c) => c.id)).toEqual(["cumbre", "forja", "brasa"]);
  });

  it("17 asuntos propios en 7 días, todos etiquetados, más el banco de casos con su elenco", () => {
    expect(PUNTOMADERO.items).toHaveLength(17);
    expect(new Set(PUNTOMADERO.items.map((i) => i.day))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    for (const i of PUNTOMADERO.items) { expect(i.id.startsWith("pm-")).toBe(true); expect(CASE_TAGS[i.id], i.id).toBeTruthy(); }
    expect(PACK_CONTEXT.puntomadero).toBe("retail");
    for (const who of Object.values(PACK_ROLES.puntomadero)) expect(PUNTOMADERO.cast[who], who).toBeTruthy();
    const full = withBank(PUNTOMADERO);
    expect(full.items.length).toBeGreaterThan(PUNTOMADERO.items.length + 40);
    for (const it of full.items) expect(it.body.join(" "), it.id).not.toMatch(/\{[a-z_]+\}/);
  });

  it("cada consecuencia apunta a un asunto de Punto Madero y a una opción real", () => {
    const ids = new Map(PUNTOMADERO.items.map((i) => [i.id, new Set(i.options.map((o) => o.id))]));
    for (const i of PUNTOMADERO.items.filter((x) => x.trigger)) {
      expect(ids.has(i.trigger!.item), i.id).toBe(true);
      for (const o of i.trigger!.options) if (o !== "__expired") expect(ids.get(i.trigger!.item)!.has(o), `${i.id}:${o}`).toBe(true);
    }
  });

  it("tiene objetivo de temporada, métricas de tienda y habla de tiendas, no de fábricas, cocinas ni software", () => {
    expect(SEASON_OBJECTIVES.puntomadero.kpis).toEqual(["margen", "clientes"]);
    const p = profileFor(undefined, "puntomadero");
    expect(p.id).toBe("retail");
    expect(p.metrics.map((m) => m.id)).toContain("mismas_tiendas");
    expect(p.metrics.map((m) => `${m.id} ${m.label}`).join(" ")).not.toMatch(/mrr|churn|ppm|oee|merma/i);
    const text = JSON.stringify(PUNTOMADERO.items);
    expect(text).not.toMatch(/armadora|soldad|mesero|botana|suscrip|churn/i);
  });

  it("con otra especialidad de retail, el giro cambia (Moda y accesorios ya no dice ferretería)", () => {
    expect(lexText(PUNTOMADERO.pitch, "puntomadero", "Moda y accesorios")).toMatch(/moda y accesorios/);
    expect(lexText(PUNTOMADERO.pitch, "puntomadero", "Moda y accesorios")).not.toMatch(/ferreter/i);
    expect(lexText(PUNTOMADERO.pitch, "puntomadero", "Hogar y ferretería")).toBe(PUNTOMADERO.pitch);
  });
});
