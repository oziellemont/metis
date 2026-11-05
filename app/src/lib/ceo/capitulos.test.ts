/**
 * Capítulos de la empresa (carrera continua): lo que habla de tu llegada solo llega al tomar el mando; en los
 * capítulos siguientes regresan las decisiones que tomaste y llegan los temas propios de cada etapa.
 */
import { describe, expect, it } from "vitest";
import { companyStageOf, newState, seasonEpisodesOf, seasonItems, setupCompany } from "./engine";
import { EPISODES, SEASON_EPISODES } from "./episodes/catalog";
import { companyById, COMPANIES } from "./companies";
import { CASE_TAGS } from "./companies/tags";
import { caseConceptOf } from "./concepts";
import { archetypeById } from "./cases/archetypes";
import { isBankId, bankArchetypeOf } from "./cases/bank";
import type { CareerRun, CeoState } from "./types";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const WEEK = 7 * 86_400_000;

function own(industryId: string, sectorId: string): CeoState {
  const s = setupCompany({ ...newState(), name: "Oziel", alias: "oziel", startedAt: T0 }, { companyId: CID, sectorId, industryId, archetype: "establecida", displayName: "Sigma" }, T0);
  if (!s.companyProfile) throw new Error(`no se pudo crear ${industryId}`);
  return s;
}
function withRuns(s: CeoState, decisions: Record<string, string>[]): CeoState {
  const base = companyById(s.company).kpiStart;
  const career: CareerRun[] = decisions.map((d, i) => ({
    company: s.company, tier: 0, rulesVersion: s.rulesVersion, startedAt: T0 + i * WEEK, endedAt: T0 + (i + 1) * WEEK,
    kpis: base, health: 60, answered: 100, passed: true, xp: 100,
    decisions: Object.fromEntries(Object.entries(d).map(([k, o]) => [k, { option: o, at: T0 + i * WEEK }])),
  }));
  return { ...s, career, startedAt: T0 + decisions.length * WEEK };
}

const ARRIVAL = ["d5-consejo", "d7-sucesion", "c-ana-brilla", "fn-d7-consejo", "kb-d7-consejo", "pm-d7-consejo", "vl-d7-consejo", "gb-d7-consejo"];

describe("capítulos · lo de la llegada se queda en «Tomar el mando»", () => {
  it("cada asunto de llegada está marcado solo para el primer capítulo", () => {
    const all = COMPANIES.flatMap((p) => p.items);
    for (const id of ARRIVAL) expect(all.find((i) => i.id === id)?.stages, id).toEqual([0, 0]);
  });
  it("al tomar el mando llega el consejo de debut; en «Estabilizar» ya no", () => {
    const s0 = own("alimentos_bebidas", "manufactura");
    expect(companyStageOf(s0).idx).toBe(0);
    expect(seasonItems(s0).map((i) => i.id)).toContain("d5-consejo");
    const s1 = withRuns(s0, [{}]);
    expect(companyStageOf(s1).idx).toBe(1);
    const ids = seasonItems(s1).map((i) => i.id);
    for (const id of ["d5-consejo", "d7-sucesion", "c-ana-brilla"]) expect(ids, id).not.toContain(id);
  });
});

describe("capítulos · las decisiones del mes anterior regresan", () => {
  it("si aceptaste todo con SuperNorte… con el sindicato: el bono por merma regresa a la mesa", () => {
    const s0 = own("alimentos_bebidas", "manufactura");
    expect(seasonItems(s0).map((i) => i.id)).not.toContain("c-s-merma");
    const a = seasonItems(withRuns(s0, [{ "d4-sindicato": "a" }])).map((i) => i.id);
    expect(a).toContain("c-s-merma");
    expect(a).not.toContain("c-s-revision");
    const c = seasonItems(withRuns(s0, [{ "d4-sindicato": "c" }])).map((i) => i.id);
    expect(c).toContain("c-s-revision");
    expect(c).not.toContain("c-s-merma");
    // sin la decisión de origen no hay seguimiento
    expect(seasonItems(withRuns(s0, [{}])).some((i) => i.id.startsWith("c-s-"))).toBe(false);
  });
  it("Aurora Motors: lo que diste el mes pasado cambia lo que te piden hoy", () => {
    const s0 = own("autopartes", "manufactura");
    expect(s0.company).toBe("forja");
    expect(seasonItems(withRuns(s0, [{ "fn-d2-precio": "a" }])).map((i) => i.id)).toContain("fn-s-precio-mas");
    expect(seasonItems(withRuns(s0, [{ "fn-d2-precio": "c" }])).map((i) => i.id)).toContain("fn-s-precio-rfq");
  });
  it("cada seguimiento tiene etiqueta, concepto y dos rutas excluyentes por decisión de origen", () => {
    const all = COMPANIES.flatMap((p) => p.items).filter((i) => i.recall);
    expect(all.length).toBeGreaterThanOrEqual(12);
    const byOrigin = new Map<string, string[][]>();
    for (const it of all) {
      expect(CASE_TAGS[it.id], it.id).toBeTruthy();
      expect(caseConceptOf(it.id), it.id).toBeTruthy();
      expect(it.stages, it.id).toBeTruthy();
      byOrigin.set(it.recall!.item, [...(byOrigin.get(it.recall!.item) ?? []), it.recall!.options]);
    }
    for (const [origin, sets] of byOrigin) {
      const flat = sets.flat();
      expect(new Set(flat).size, origin).toBe(flat.length);
    }
  });
});

describe("capítulos · el banco trae los temas de cada etapa", () => {
  const TEMAS: Record<number, string[]> = { 2: ["mando", "sucesor"], 3: ["inversion", "capital"], 4: ["region", "alianza", "adquisicion"], 5: ["regulador", "prensa", "deuda"] };
  for (const [ind, sector] of [["alimentos_bebidas", "manufactura"], ["autopartes", "manufactura"], ["software_saas", "tecnologia"]] as const) {
    it(`${ind}: cada capítulo trae al menos un tema propio`, () => {
      let s: CeoState;
      try { s = own(ind, sector); } catch { return; }
      const runs: Record<string, string>[] = [];
      for (let m = 0; m < 14; m++) {
        const st = withRuns(s, runs);
        const idx = companyStageOf(st).idx;
        if (TEMAS[idx]) {
          const arch = seasonItems(st).filter((i) => isBankId(i.id)).map((i) => bankArchetypeOf(i.id)!);
          if (companyStageOf(st).months === 0) expect(arch.some((a) => TEMAS[idx].includes(a)), `${ind} etapa ${idx}: ${arch}`).toBe(true);
          for (const a of arch) { const x = archetypeById(a)!; expect(x.minStage <= idx && idx <= x.maxStage, `${a} en ${idx}`).toBe(true); }
        }
        runs.push({});
      }
    });
  }
});

describe("capítulos · un caso largo de varias decisiones por capítulo", () => {
  /** Meses cerrados (aprobados) para llegar a cada capítulo: 0, 1, 3, 6, 9, 13 (STAGE_MONTHS). */
  const MONTHS = [0, 1, 3, 6, 9, 13];
  const at = (s: CeoState, stage: number) => withRuns(s, Array.from({ length: MONTHS[stage] }, () => ({})));
  const CASES: [string, string, string, [number, number]][] = [
    ["autopartes", "manufactura", "aurora", [1, 2]],
    ["software_saas", "tecnologia_informacion", "brecha", [2, 4]],
    ["restaurantes", "restaurantes_alimentos", "franquicia", [2, 3]],
    ["retail", "comercio", "refinanciar", [3, 5]],
    ["alimentos_bebidas", "manufactura", "socio", [3, 4]],
    ["logistica_distribucion", "transporte_almacenamiento", "transbajio", [4, 5]],
    ["autopartes", "manufactura", "electrico", [3, 5]],
    ["software_saas", "tecnologia_informacion", "precios", [1, 1]],
    ["software_saas", "tecnologia_informacion", "seriec", [5, 5]],
    ["logistica_distribucion", "transporte_almacenamiento", "carretera", [1, 3]],
    ["restaurantes", "restaurantes_alimentos", "cdmx", [1, 1]],
    ["restaurantes", "restaurantes_alimentos", "sucesion", [4, 5]],
    ["retail", "comercio", "mundocasa", [1, 1]],
    ["retail", "comercio", "enlinea", [2, 2]],
  ];
  it.each(CASES)("%s: «%s» llega solo en los capítulos que le tocan", (ind, sec, ep, [a, b]) => {
    const s0 = own(ind, sec);
    for (let st = 0; st <= 5; st++) {
      const s = at(s0, st);
      expect(companyStageOf(s).idx, `${ep} etapa`).toBe(st);
      const has = seasonEpisodesOf(s).some((x) => x.spec.id === ep);
      expect(has, `${ep} en capítulo ${st}`).toBe(st >= a && st <= b);
    }
  });
  it("cada caso largo tiene de 3 a 6 decisiones y es de su empresa", () => {
    for (const [, , ep] of CASES) {
      const spec = EPISODES[ep];
      expect(spec.approval).toBe("aprobado");
      expect(Object.keys(spec.nodes).length).toBeGreaterThanOrEqual(3);
      expect(Object.values(SEASON_EPISODES).flat().some((x) => x.episode === ep && x.stages)).toBe(true);
    }
  });
});
