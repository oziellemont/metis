/**
 * Simulación reproducible de temporadas (rediseño «criterio vs. resultados»).
 *
 * Pruebas rápidas (siempre): reproducibilidad y viabilidad mínima con el veredicto candidato.
 * Reporte completo (bajo demanda): las 12 estrategias × 6 industrias, con veredicto vigente y candidato:
 *   SIM_REPORT=1 npx vitest run src/lib/ceo/season-sim.test.ts
 * escribe docs/editorial/simulacion-temporadas.json.
 */
import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COMPANIES } from "./companies";
import { KPI_KEYS, entries } from "./engine";
import { STRATEGIES, classicStart, playSeason } from "./season-sim";
import { candidateVerdictOf } from "./verdict-candidate";
import { seasonDiagnosis, timeline } from "./season-report";

describe("simulación reproducible", () => {
  it("misma semilla, misma temporada", () => {
    const a = playSeason(classicStart("kubit"), "azar", "kubit|azar|7");
    const b = playSeason(classicStart("kubit"), "azar", "kubit|azar|7");
    expect(a.kpis).toEqual(b.kpis);
    expect(a.state.decisions).toEqual(b.state.decisions);
  });
  it.each(COMPANIES.map((p) => p.id))("%s: hay un camino razonable que aprueba con el veredicto candidato y no contestar reprueba", (c) => {
    const good = playSeason(classicStart(c), "director_equilibrado", `${c}|director_equilibrado|0`);
    const v = candidateVerdictOf(good.state, good.at);
    expect(v.reasons, JSON.stringify(good.kpis)).toEqual([]);
    const d = seasonDiagnosis(good.state, good.at);
    expect(d.judgment.level).not.toBe("bajo");
    const silent = playSeason(classicStart(c), "no_contesta", `${c}|no_contesta|0`);
    expect(candidateVerdictOf(silent.state, silent.at).passed).toBe(false);
    expect(silent.passed).toBe(false);
  }, 60_000);
});

const r1 = (x: number) => Math.round(x * 10) / 10;
it.runIf(process.env.SIM_REPORT === "1")("genera docs/editorial/simulacion-temporadas.json", () => {
  const out: Record<string, unknown> = { generated: "rediseño criterio-vs-resultados", seeds: "`${empresa}|${estrategia}|${i}`", companies: {} as Record<string, unknown> };
  for (const p of COMPANIES) {
    const row: Record<string, unknown> = {};
    for (const [name, st] of Object.entries(STRATEGIES)) {
      const reps = st.reps > 1 ? 30 : 1;
      const rs = Array.from({ length: reps }, (_x, i) => playSeason(classicStart(p.id), name, `${p.id}|${name}|${i}`));
      const cv = rs.map((r) => candidateVerdictOf(r.state, r.at));
      const dg = rs.map((r) => seasonDiagnosis(r.state, r.at));
      const tl = rs.map((r) => timeline(r.state, r.at));
      const reasons: Record<string, number> = {};
      cv.forEach((v) => v.reasons.forEach((x) => (reasons[x] = (reasons[x] ?? 0) + 1)));
      const avgK = Object.fromEntries(KPI_KEYS.map((k) => [k, r1(rs.reduce((a, r) => a + r.kpis[k], 0) / reps)]));
      const wasted = r1(tl.reduce((a, t) => a + t.events.reduce((b, e) => b + KPI_KEYS.reduce((c, k) => c + Math.max(0, e.wasted[k] ?? 0), 0), 0), 0) / reps);
      const cajaCost = r1(rs.reduce((a, r) => a + entries(r.state, r.at).filter((e) => e.status === "decidido" && (e.option?.score ?? 0) >= 3).reduce((b, e) => b + Math.min(0, e.option!.effects.caja ?? 0), 0), 0) / reps);
      row[name] = {
        label: st.label, reps,
        actual: r1((100 * rs.filter((r) => r.passed).length) / reps),
        candidato: r1((100 * cv.filter((v) => v.passed).length) / reps),
        criterio: r1(dg.reduce((a, d) => a + d.judgment.average, 0) / reps),
        nivelCriterio: dg[0].judgment.level,
        cuadrante: dg[0].quadrant,
        kpis: avgK, reasons, puntosDesperdiciados: wasted, cajaPagadaPorOpcionesDe3: cajaCost,
        diagnostico: dg[0].summary,
      };
    }
    (out.companies as Record<string, unknown>)[p.id] = row;
  }
  const dir = join(process.cwd(), "..", "docs", "editorial");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "simulacion-temporadas.json"), JSON.stringify(out, null, 1));
}, 1_800_000);
