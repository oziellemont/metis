import { describe, expect, it } from "vitest";
import { COMPANIES, LEGACY_ROTATION, companyById } from "./index";
import { KUBIT } from "./kubit";
import { CASE_TAGS } from "./tags";
import { withBank, PACK_CONTEXT, PACK_ROLES } from "../cases/bank";
import { isPlayableCombo } from "../career/taxonomy";
import { catalogCompanyById, isPlayable } from "../catalog";
import { SEASON_OBJECTIVES } from "../shadow-verdict";

describe("Kúbit · software (P1-E)", () => {
  it("es jugable: registrada, en el catálogo y en la taxonomía (solo establecida)", () => {
    expect(COMPANIES.map((c) => c.id)).toContain("kubit");
    expect(companyById("kubit")).toBe(KUBIT);
    expect(isPlayable("kubit")).toBe(true);
    expect(catalogCompanyById("kubit")?.provisional).toBe(true);
    expect(isPlayableCombo("tecnologia_informacion", "software_saas", "establecida")).toBe(true);
    expect(isPlayableCombo("tecnologia_informacion", "software_saas", "startup")).toBe(false);
    expect(isPlayableCombo("tecnologia_informacion", "software_saas", "pyme")).toBe(false);
  });

  it("no entra a la rotación del modo por temporadas (las partidas grabadas no cambian)", () => {
    expect(LEGACY_ROTATION.map((c) => c.id)).toEqual(["cumbre", "forja", "brasa"]);
  });

  it("17 asuntos propios en 7 días, todos etiquetados, más el banco de casos con su elenco", () => {
    expect(KUBIT.items).toHaveLength(17);
    expect(new Set(KUBIT.items.map((i) => i.day))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    for (const i of KUBIT.items) { expect(i.id.startsWith("kb-")).toBe(true); expect(CASE_TAGS[i.id], i.id).toBeTruthy(); }
    expect(PACK_CONTEXT.kubit).toBe("software_saas");
    for (const who of Object.values(PACK_ROLES.kubit)) expect(KUBIT.cast[who], who).toBeTruthy();
    const full = withBank(KUBIT);
    expect(full.items.length).toBeGreaterThan(KUBIT.items.length + 40);
    for (const it of full.items) expect(it.body.join(" "), it.id).not.toMatch(/\{[a-z_]+\}/);
  });

  it("cada consecuencia apunta a un asunto de Kúbit y a una opción real", () => {
    const ids = new Map(KUBIT.items.map((i) => [i.id, new Set(i.options.map((o) => o.id))]));
    for (const i of KUBIT.items.filter((x) => x.trigger)) {
      expect(ids.has(i.trigger!.item), i.id).toBe(true);
      for (const o of i.trigger!.options) if (o !== "__expired") expect(ids.get(i.trigger!.item)!.has(o), `${i.id}:${o}`).toBe(true);
    }
  });

  it("tiene objetivo de temporada y habla de software, no de fábricas ni cocinas", () => {
    expect(SEASON_OBJECTIVES.kubit.kpis).toEqual(["caja", "clientes"]);
    const text = JSON.stringify(KUBIT.items);
    expect(text).not.toMatch(/armadora|soldad|mesero|botana/i);
  });
});
