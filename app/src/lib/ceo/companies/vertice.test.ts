import { describe, expect, it } from "vitest";
import { COMPANIES, LEGACY_ROTATION, companyById } from "./index";
import { VERTICE } from "./vertice";
import { CASE_TAGS } from "./tags";
import { withBank, PACK_CONTEXT, PACK_ROLES } from "../cases/bank";
import { isPlayableCombo } from "../career/taxonomy";
import { lexText } from "../career/lexicon";
import { catalogCompanyById, isPlayable } from "../catalog";
import { SEASON_OBJECTIVES } from "../shadow-verdict";
import { profileFor } from "../business/profiles";

describe("Vértice Logística · logística (P1-H)", () => {
  it("es jugable: registrada, en el catálogo y en la taxonomía (solo establecida)", () => {
    expect(COMPANIES.map((c) => c.id)).toContain("vertice");
    expect(companyById("vertice")).toBe(VERTICE);
    expect(isPlayable("vertice")).toBe(true);
    expect(catalogCompanyById("vertice")?.provisional).toBe(true);
    expect(isPlayableCombo("transporte_almacenamiento", "logistica_distribucion", "establecida")).toBe(true);
    expect(isPlayableCombo("transporte_almacenamiento", "logistica_distribucion", "pyme")).toBe(false);
    expect(isPlayableCombo("transporte_almacenamiento", "logistica_distribucion", "startup")).toBe(false);
  });

  it("no entra a la rotación del modo por temporadas (las partidas grabadas no cambian)", () => {
    expect(LEGACY_ROTATION.map((c) => c.id)).toEqual(["cumbre", "forja", "brasa"]);
  });

  it("17 asuntos propios en 7 días, todos etiquetados, más el banco de casos con su elenco", () => {
    expect(VERTICE.items).toHaveLength(17);
    expect(new Set(VERTICE.items.map((i) => i.day))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    for (const i of VERTICE.items) { expect(i.id.startsWith("vl-")).toBe(true); expect(CASE_TAGS[i.id], i.id).toBeTruthy(); }
    expect(PACK_CONTEXT.vertice).toBe("logistica_distribucion");
    for (const who of Object.values(PACK_ROLES.vertice)) expect(VERTICE.cast[who], who).toBeTruthy();
    const full = withBank(VERTICE);
    expect(full.items.length).toBeGreaterThan(VERTICE.items.length + 40);
    for (const it of full.items) expect(it.body.join(" "), it.id).not.toMatch(/\{[a-z_]+\}/);
  });

  it("cada consecuencia apunta a un asunto de Vértice y a una opción real", () => {
    const ids = new Map(VERTICE.items.map((i) => [i.id, new Set(i.options.map((o) => o.id))]));
    for (const i of VERTICE.items.filter((x) => x.trigger)) {
      expect(ids.has(i.trigger!.item), i.id).toBe(true);
      for (const o of i.trigger!.options) if (o !== "__expired") expect(ids.get(i.trigger!.item)!.has(o), `${i.id}:${o}`).toBe(true);
    }
  });

  it("tiene objetivo de temporada, métricas de flota y habla de camiones y CEDIS, no de tiendas, fábricas ni software", () => {
    expect(SEASON_OBJECTIVES.vertice.kpis).toEqual(["margen", "clientes"]);
    const p = profileFor(undefined, "vertice");
    expect(p.id).toBe("logistica");
    expect(p.metrics.map((m) => m.id)).toEqual(expect.arrayContaining(["otif", "ocupacion", "km_vacio"]));
    expect(p.metrics.map((m) => `${m.id} ${m.label}`).join(" ")).not.toMatch(/mrr|churn|ppm|oee|merma|ticket/i);
    const text = JSON.stringify(VERTICE.items);
    expect(text).not.toMatch(/armadora|soldad|mesero|botana|suscrip|churn|ferreter/i);
    expect(text).toMatch(/tractocami|CEDIS/);
  });

  it("con otra especialidad de logística, el giro cambia (Cadena fría ya no dice operador integral)", () => {
    expect(lexText(VERTICE.pitch, "vertice", "Cadena fría")).toMatch(/cadena fría/);
    expect(lexText(VERTICE.pitch, "vertice", "Cadena fría")).not.toMatch(/operador logístico integral/i);
    expect(lexText(VERTICE.tagline, "vertice", "Última milla")).toMatch(/entregas a domicilio/);
    expect(lexText(VERTICE.pitch, "vertice", "Operador 3PL")).toBe(VERTICE.pitch);
  });
});
