import { isBankId } from "../cases/bank";
import { describe, expect, it } from "vitest";
import { COMPANIES } from ".";
import { CASE_TAGS, EPISODE_TAGS, caseCast, caseKpis, caseStages, compatibleItems } from "./tags";
import { EPISODES, SEASON_EPISODES } from "../episodes/catalog";
import { ARCHETYPES, SECTORS, isPlayableCombo, type CompanyArchetype } from "../career/taxonomy";
import { DAY, decide, entries, newState, packOf, seasonEpisodesOf, seasonItems, setupCompany } from "../engine";
import type { CeoState } from "../types";

const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
const own = (sectorId: string, industryId: string, archetype: CompanyArchetype): CeoState =>
  setupCompany({ ...newState(), name: "Oziel", alias: "oziel", startedAt: T0 }, { companyId: CID, sectorId, industryId, archetype, displayName: "Casa Norte" }, T0);

/** Todas las combinaciones jugables del catálogo (sector × industria × tipo). */
const COMBOS = SECTORS.flatMap((s) => s.industries.flatMap((i) => ARCHETYPES.filter((a) => isPlayableCombo(s.id, i.id, a.id)).map((a) => [`${i.label} · ${a.label}`, s.id, i.id, a.id] as const)));

describe("auditoría de casos · etiquetas", () => {
  it("cada asunto de cada paquete tiene etiqueta y no hay etiquetas huérfanas", () => {
    const ids = COMPANIES.flatMap((c) => c.items.map((i) => i.id));
    expect(ids.filter((id) => !CASE_TAGS[id])).toEqual([]);
    expect(Object.keys(CASE_TAGS).filter((id) => !ids.includes(id))).toEqual([]);
    expect(ids).toHaveLength(86);
  });
  it("cada caso ejecutivo de una temporada tiene etiqueta", () => {
    const eps = Object.values(SEASON_EPISODES).flat().map((x) => x.episode);
    expect(eps.filter((e) => !EPISODE_TAGS[e])).toEqual([]);
    expect(Object.keys(EPISODE_TAGS).filter((e) => !EPISODES[e])).toEqual([]);
  });
  it("todo caso sirve al menos para la establecida (el contenido aprobado de hoy) y lo que no aplica a otro tipo dice por qué", () => {
    for (const [id, t] of Object.entries({ ...CASE_TAGS, ...EPISODE_TAGS })) {
      expect(t.archetypes, id).toContain("establecida");
      if (t.archetypes.length < 2) expect(t.note, id).toBeTruthy();
    }
  });
  it("la clasificación: universal 27, de familia 39, del paquete 23 (con 3 casos ejecutivos; P0-A §5.1 más Kúbit y Punto Madero)", () => {
    const n = (scope: string) => Object.values(CASE_TAGS).filter((t) => t.scope === scope).length;
    expect([n("universal"), n("familia"), n("paquete") + Object.keys(EPISODE_TAGS).length]).toEqual([27, 39, 23]);
    const by = (pack: string, scope: string) => COMPANIES.find((c) => c.id === pack)!.items.filter((i) => CASE_TAGS[i.id].scope === scope).length;
    expect([by("cumbre", "universal"), by("forja", "universal"), by("brasa", "universal")]).toEqual([10, 5, 2]);
    expect([by("cumbre", "familia"), by("forja", "familia"), by("brasa", "familia")]).toEqual([6, 8, 9]);
  });
  it("una consecuencia es compatible solo donde su detonador también lo es", () => {
    for (const c of COMPANIES) for (const it of c.items) if (it.trigger) {
      for (const a of CASE_TAGS[it.id].archetypes) expect(CASE_TAGS[it.trigger.item].archetypes, `${it.id} (${a})`).toContain(a);
    }
  });
  it("etiquetas derivadas: etapa, KPI y personajes de cada caso", () => {
    for (const c of COMPANIES) for (const it of c.items) {
      expect(caseStages(it).length, it.id).toBeGreaterThan(0);
      expect(caseKpis(it).length, it.id).toBeGreaterThan(0);
      for (const w of caseCast(it)) expect(c.cast[w], `${it.id} ${w}`).toBeTruthy();
    }
  });
});

describe("auditoría de casos · orden causal", () => {
  it("cada detonador existe en el mismo paquete, no es otra consecuencia circular y llega antes o el mismo día", () => {
    for (const c of COMPANIES) for (const it of c.items) if (it.trigger) {
      const t = c.items.find((x) => x.id === it.trigger!.item);
      expect(t, `${c.id}/${it.id}`).toBeTruthy();
      expect(t!.day, it.id).toBeLessThanOrEqual(it.day);
      for (const o of it.trigger.options) expect(o === "__expired" || t!.options.some((x) => x.id === o), `${it.id} → ${o}`).toBe(true);
    }
  });
  it("en una PYME, la consecuencia llega después de la decisión que la detona", () => {
    const s0 = own("manufactura", "alimentos_bebidas", "pyme");
    const late = T0 + 20 * DAY;
    const pend = (s: CeoState, id: string) => entries(s, late).find((e) => e.item.id === id)!;
    const t = pend(s0, "d3-diego").arrivesAt + 60_000;
    const s1 = decide(s0, "d3-diego", "b", t);
    const c = entries(s1, late).find((e) => e.item.id === "c-piloto")!;
    expect(c).toBeTruthy();
    expect(c.arrivesAt).toBeGreaterThanOrEqual(t + 2 * 60_000);
    // con otra opción, la consecuencia no existe
    expect(entries(decide(s0, "d3-diego", "c", t), late).some((e) => e.item.id === "c-piloto")).toBe(false);
  });
});

describe.each(COMBOS)("auditoría de casos · %s", (_n, sectorId, industryId, archetype) => {
  const s = own(sectorId, industryId, archetype);
  const items = seasonItems(s);
  it("se crea la empresa y ningún caso incompatible se muestra", () => {
    expect(s.companyProfile?.archetype).toBe(archetype);
    for (const it of items) expect(CASE_TAGS[it.id].archetypes, it.id).toContain(archetype);
    for (const e of seasonEpisodesOf(s)) expect(EPISODE_TAGS[e.spec.id].archetypes, e.spec.id).toContain(archetype);
    for (const e of entries(s, T0 + 30 * DAY)) expect(CASE_TAGS[e.item.id].archetypes, e.item.id).toContain(archetype);
  });
  it("toda consecuencia que se muestra tiene su detonador en la misma temporada", () => {
    const ids = new Set(items.map((i) => i.id));
    for (const it of items) if (it.trigger) expect(ids.has(it.trigger.item), it.id).toBe(true);
  });
  it("hay suficientes casos para un mes (al menos 10 asuntos base)", () => {
    expect(items.filter((i) => !i.trigger).length + seasonEpisodesOf(s).length).toBeGreaterThanOrEqual(10);
  });
});

describe("auditoría de casos · combinaciones", () => {
  it("jugables hoy: alimentos (PYME y establecida), autopartes, restaurantes, software y retail (establecida)", () => {
    expect(COMBOS.map(([, , i, a]) => `${i}/${a}`).sort()).toEqual(["alimentos_bebidas/establecida", "alimentos_bebidas/pyme", "autopartes/establecida", "restaurantes/establecida", "retail/establecida", "software_saas/establecida"]);
  });
  it("una industria solo ofrece un tipo si TODOS sus casos base caben (sin huecos en la temporada)", () => {
    for (const [, sectorId, industryId, a] of COMBOS) {
      const pk = packOf(own(sectorId, industryId, a));
      const base = pk.items.filter((i) => !i.trigger && !isBankId(i.id));
      expect(compatibleItems(base, a).length, `${industryId}/${a}`).toBe(base.length);
    }
  });
  it("PYME de autopartes y de restaurantes siguen cerradas: sus casos hablan de una empresa grande", () => {
    expect(isPlayableCombo("manufactura", "autopartes", "pyme")).toBe(false);
    expect(isPlayableCombo("restaurantes_alimentos", "restaurantes", "pyme")).toBe(false);
    for (const pk of ["forja", "brasa"]) {
      const items = COMPANIES.find((c) => c.id === pk)!.items;
      expect(compatibleItems(items, "pyme"), pk).toEqual([]);
    }
  });
  it("sin empresa propia (temporadas) el filtro no cambia nada", () => {
    for (const c of COMPANIES) expect(compatibleItems(c.items, undefined)).toBe(c.items);
    const s = { ...newState(), startedAt: T0 };
    expect(seasonItems(s).some((i) => i.id === "d2-supernorte")).toBe(false);
    expect(seasonEpisodesOf(s).map((x) => x.spec.id)).toEqual(["supernorte", "diego", "alergeno"]);
  });
  it("PYME de alimentos: sin casos ejecutivos (sus montos aún no escalan) y vuelve el asunto de SuperNorte", () => {
    const s = own("manufactura", "alimentos_bebidas", "pyme");
    expect(seasonEpisodesOf(s)).toEqual([]);
    const ids = seasonItems(s).map((i) => i.id);
    expect(ids).toContain("d2-supernorte");
    expect(ids).toHaveLength(20);
  });
});
