import { describe, expect, it } from "vitest";
import { classicStart, playSeason } from "./season-sim";
import { leadershipOf, LEADERSHIP_MIN_EVIDENCE } from "./leadership";
import { entries, kpis, newState } from "./engine";

const COS = ["cumbre", "forja", "brasa", "kubit", "puntomadero", "vertice"];
const memo = new Map<string, ReturnType<typeof playSeason>>();
const run = (c: string, st: string) => { const k = `${c}|${st}`; if (!memo.has(k)) memo.set(k, playSeason(classicStart(c), st, `${c}|${st}|lid`)); return memo.get(k)!; };
const T = 60_000;
const TYPOLOGY = /\b(MBTI|INTJ|ENTJ|ENFP|ISTJ|DISC|eneagrama|introvertid|extrovertid)/i;

describe("Mi liderazgo", () => {
  it("sin decisiones no inventa: todo es «sin evidencia» o preliminar", () => {
    const s = { ...newState(), name: "QA", alias: "qa", startedAt: Date.UTC(2026, 9, 5, 15), company: "cumbre" };
    const L = leadershipOf(s, s.startedAt);
    expect(L.decisions).toBe(0);
    for (const c of L.competencies) expect(c.band).toBe("sin_evidencia");
    expect(L.summary.preferencias).toMatch(/pocas decisiones/);
  }, T);

  it("separa las tres capas: preferencias no usan palabras de calidad, resultados avisan que no prueban criterio", () => {
    for (const c of COS) for (const st of ["azar", "criterio_y_tablero", "peor_score"]) {
      const r = run(c, st);
      const L = leadershipOf(r.state, r.at);
      const prefText = [L.summary.preferencias, ...L.preferences.map((p) => p.text)].join(" ");
      expect(prefText).not.toMatch(/fortaleza|reforzar|bien razonad|correct|mejor|peor|aprob/i);
      expect(L.summary.resultados).toMatch(/no prueba por sí solo/);
      expect(JSON.stringify(L)).not.toMatch(TYPOLOGY);
    }
  }, T);

  it("las competencias solo cuentan situaciones donde aplicaban, con ejemplos reales de la partida", () => {
    for (const c of COS) {
      const r = run(c, "azar");
      const L = leadershipOf(r.state, r.at);
      const ids = new Set(entries(r.state, r.at).filter((e) => e.status === "decidido").map((e) => e.item.id));
      const total = L.competencies.reduce((a, x) => a + x.n, 0);
      // cada decisión aporta menos de las 6 dimensiones (la rúbrica omite las que no aplican)
      expect(total).toBeLessThan(L.decisions * 6);
      expect(L.competencies.find((x) => x.dim === "analiza")!.n).toBe(L.decisions);
      for (const x of L.competencies) {
        if (x.best) expect(ids.has(x.best.item)).toBe(true);
        if (x.weakest) expect(ids.has(x.weakest.item)).toBe(true);
        if (x.n > 0 && x.n < LEADERSHIP_MIN_EVIDENCE) expect(x.band).toBe("preliminar");
      }
    }
  }, T);

  it("distingue criterio: quien razona bien tiene más fortalezas que quien elige lo peor razonado", () => {
    for (const c of COS) {
      const g = run(c, "criterio_y_tablero"), b = run(c, "peor_score");
      const good = leadershipOf(g.state, g.at);
      const bad = leadershipOf(b.state, b.at);
      const sc = (L: typeof good) => L.competencies.filter((x) => x.score !== null).reduce((a, x) => a + x.score!, 0);
      expect(sc(good), c).toBeGreaterThan(sc(bad));
      expect(good.competencies.filter((x) => x.band === "fortaleza").length, c).toBeGreaterThan(bad.competencies.filter((x) => x.band === "fortaleza").length);
    }
  }, T);

  it("los resultados son los indicadores reales contra el arranque", () => {
    const r = run("kubit", "azar");
    const L = leadershipOf(r.state, r.at);
    const k = kpis(r.state, r.at);
    for (const x of L.results) { expect(x.now).toBe(k[x.kpi]); expect(x.delta).toBe(x.now - x.start); }
  }, T);
});
