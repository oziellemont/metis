import { describe, expect, it } from "vitest";
import { entries, packOf } from "./engine";
import { playSeason, classicStart } from "./season-sim";
import { decisionLesson } from "./learning";
import { situationRubric } from "./rubric";
import type { Item, Kpis, Option } from "./types";

const K = (p: Partial<Kpis> = {}): Kpis => ({ caja: 70, margen: 70, equipo: 70, clientes: 70, consejo: 70, ...p });
const opt = (id: string, score: 0 | 1 | 2 | 3, effects: Partial<Kpis>, extra: Partial<Option> = {}): Option => ({ id, text: id, reply: [], outcome: "", effects, style: {}, score, ...extra });
const item = (options: Option[], extra: Partial<Item> = {}): Item => ({ id: "t", day: 1, slot: 1, channel: "email", from: "a", subject: "", preview: "", body: [], ask: "", options,
  expired: { reply: [], outcome: "", effects: {} }, bitacora: { title: "", text: "", nota: "" }, areas: ["finanzas"], ...extra });
const ctx = (it: Item, chosen: string, board: Kpis) => ({ item: it, chosen: it.options.find((o) => o.id === chosen)!, effects: Object.fromEntries(it.options.map((o) => [o.id, o.effects])), board, line: 50, label: (k: string) => k, name: (w: string) => w });
const COMPANY_IDS = ["cumbre", "brasa", "forja", "kubit", "puntomadero", "vertice"];

describe("rúbrica contextual: solo lo que la situación pide", () => {
  it("sin partes en conflicto, «Negocia» no se evalúa (y no resta)", () => {
    const it0 = item([opt("a", 3, { caja: -5 }), opt("b", 1, { margen: -5 })]);
    const r = situationRubric(ctx(it0, "a", K()));
    expect(r.dims.map((d) => d.dim)).not.toContain("negocia");
    expect(r.skipped.find((s) => s.dim === "negocia")?.why).toMatch(/no había partes/i);
  });
  it("con partes opuestas, «Negocia» sí se evalúa y se dice quiénes", () => {
    const it0 = item([opt("a", 3, {}, { stance: { ana: 2, beto: -2 } }), opt("b", 2, {}, { stance: { ana: 0, beto: 0 } })], { areas: ["personas"] });
    const r = situationRubric(ctx(it0, "b", K()));
    const n = r.dims.find((d) => d.dim === "negocia")!;
    expect(n.why).toMatch(/ana.*beto|beto.*ana/);
  });
  it("sin indicadores en riesgo, «Prioriza» no se evalúa", () => {
    const it0 = item([opt("a", 3, { caja: -5 }), opt("b", 2, { margen: -5 })]);
    expect(situationRubric(ctx(it0, "a", K())).dims.map((d) => d.dim)).not.toContain("prioriza");
  });
  it("no invertir con la caja cerca de la línea no se castiga: cuenta como anticipar y priorizar", () => {
    const it0 = item([opt("invertir", 3, { caja: -10, clientes: 6 }), opt("esperar", 2, { clientes: -2 })]);
    const r = situationRubric(ctx(it0, "esperar", K({ caja: 54 })));
    expect(r.dims.find((d) => d.dim === "prioriza")!.level).toBe(2);
    expect(r.dims.find((d) => d.dim === "anticipa")!.level).toBe(2);
    expect(r.dims.find((d) => d.dim === "prioriza")!.why).toMatch(/caja estaba en 54/);
  });
  it("gastar justo lo que está en riesgo, habiendo alternativa defendible, baja «Prioriza»", () => {
    const it0 = item([opt("invertir", 3, { caja: -10, clientes: 6 }), opt("esperar", 2, { clientes: -2 })]);
    expect(situationRubric(ctx(it0, "invertir", K({ caja: 54 }))).dims.find((d) => d.dim === "prioriza")!.level).toBe(0);
  });
  it("es ex ante: el mismo caso con otro tablero cambia lo que se evalúa", () => {
    const it0 = item([opt("a", 3, { caja: -10 }), opt("b", 2, {})]);
    expect(situationRubric(ctx(it0, "a", K())).dims.length).toBeLessThan(situationRubric(ctx(it0, "a", K({ caja: 55 }))).dims.length);
  });
});

describe("rúbrica contextual en temporadas reales", () => {
  for (const c of COMPANY_IDS) {
    it(`${c}: evalúa solo lo relevante, explica por qué y responde qué tan fundamentada estuvo`, () => {
      const counts: number[] = [];
      for (const strat of ["azar", "mejor_score", "peor_score", "criterio_contextual"]) {
        const r = playSeason(classicStart(c), strat, `${c}|rubrica|${strat}`);
        const pack = packOf(r.state);
        for (const e of entries(r.state, r.at)) {
          const l = decisionLesson(r.state, e, pack, r.at);
          if (!l) continue;
          if (e.status === "vencido") { expect(l.rubric).toBeNull(); continue; }
          const rb = l.rubric!;
          counts.push(rb.dims.length);
          expect(rb.dims.length + rb.skipped.length).toBe(6);
          expect(rb.dims.map((d) => d.dim)).toContain("analiza");
          for (const d of [...rb.dims, ...rb.skipped]) expect(d.why.length).toBeGreaterThan(20);
          expect(rb.summary).toMatch(/^Con la información que tenías al decidir/);
          expect(rb.summary).not.toMatch(/correcta|incorrecta|equivocad|libro/i);
        }
      }
      // No todo se evalúa siempre: en promedio se omite al menos una dimensión.
      expect(counts.reduce((a, b) => a + b, 0) / counts.length).toBeLessThan(5.5);
    });
  }
  it("separa estrategias: el mejor puntaje sale mayormente bien fundamentado y el peor, poco", () => {
    const share = (strat: string, band: string) => { let n = 0, t = 0;
      for (const c of COMPANY_IDS) { const r = playSeason(classicStart(c), strat, `${c}|sep`); const pack = packOf(r.state);
        for (const e of entries(r.state, r.at).filter((x) => x.status === "decidido")) { t++; if (decisionLesson(r.state, e, pack, r.at)!.rubric!.band === band) n++; } }
      return n / t; };
    expect(share("mejor_score", "bien")).toBeGreaterThan(0.8);
    expect(share("peor_score", "poco")).toBeGreaterThan(0.6);
  });
});
