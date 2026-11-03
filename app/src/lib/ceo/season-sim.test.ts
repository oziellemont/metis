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
import { KPI_KEYS, entries, verdictOf } from "./engine";
import { HOLDOUT, STRATEGIES, classicStart, playCareer, playSeason } from "./season-sim";
import { CONTINUOUS_RULES_VERSION, LEGACY_CONTINUOUS_RULES_VERSION } from "./rules";
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

/**
 * Reporte V6 (bajo demanda): veredicto VIGENTE de temporadas (v5) con las estrategias de calibración y las de control
 * (holdout, que no se usaron para ajustar nada), y la carrera continua con v6 (5 meses) frente a v4.
 *   SIM_REPORT=1 npx vitest run src/lib/ceo/season-sim.test.ts -t "V6"
 * escribe docs/editorial/simulacion-v6.json y docs/editorial/simulacion-v6.md.
 */
it.runIf(process.env.SIM_REPORT === "1")("genera el reporte V6 (temporadas v5 + holdout + carrera continua v6)", () => {
  const MONTHS = 5;
  const reps = (name: string) => (STRATEGIES[name].reps > 1 ? (name === "azar" || name === "criterio_variado" || name === "contesta_la_mitad" ? 10 : 6) : 1);
  const hold = new Set<string>(HOLDOUT);
  const names = Object.keys(STRATEGIES);
  const season: Record<string, Record<string, { pass: number; reasons: Record<string, number> }>> = {};
  const career: Record<string, Record<string, Record<string, { months: number[]; reasons: Record<string, number> }>>> = { v6: {}, v4: {} };
  for (const name of names) {
    season[name] = {};
    for (const v of ["v6", "v4"] as const) career[v][name] = {};
    for (const p of COMPANIES) {
      const n = reps(name);
      let pass = 0; const rsn: Record<string, number> = {};
      for (let i = 0; i < n; i++) {
        const r = playSeason(classicStart(p.id), name, `${p.id}|${name}|${i}`);
        if (r.passed) pass++;
        verdictOf(r.state, r.at).v5?.reasons.forEach((x) => (rsn[x] = (rsn[x] ?? 0) + 1));
      }
      season[name][p.id] = { pass: r1((100 * pass) / n), reasons: rsn };
      for (const [v, rv] of [["v6", 6], ["v4", LEGACY_CONTINUOUS_RULES_VERSION]] as const) {
        const pm = Array(MONTHS).fill(0); const cr: Record<string, number> = {};
        for (let i = 0; i < n; i++) {
          playCareer(p.id, name, MONTHS, `${p.id}|${name}|${i}`, rv).months.forEach((m, k) => {
            if (m.passed) pm[k]++;
            const vv = verdictOf(m.state, m.at);
            if (vv.v5) vv.v5.reasons.forEach((x) => (cr[x] = (cr[x] ?? 0) + 1));
            else if (!vv.passed) KPI_KEYS.filter((x) => !vv.approved[x]).forEach((x) => (cr[`${x}<línea`] = (cr[`${x}<línea`] ?? 0) + 1));
          });
        }
        career[v][name][p.id] = { months: pm.map((x) => r1((100 * x) / n)), reasons: cr };
      }
    }
  }
  const avg = (xs: number[]) => r1(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length));
  const out = {
    generated: "Motor V6 · carrera continua (v6) y temporadas (v5), con estrategias de control",
    seeds: "`${empresa}|${estrategia}|${i}`; cada mes de carrera usa `${semilla}|m${mes}`",
    months: MONTHS,
    holdout: [...HOLDOUT],
    note: "Las estrategias de control (holdout) NO se usaron para calibrar v5 ni v6: sirven para comprobar que el veredicto no está ajustado a una sola ruta.",
    strategies: Object.fromEntries(names.map((n) => [n, { label: STRATEGIES[n].label, holdout: hold.has(n), reps: reps(n) }])),
    temporadaV5: season,
    carrera: career,
  };
  const dir = join(process.cwd(), "..", "docs", "editorial");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "simulacion-v6.json"), JSON.stringify(out, null, 1));
  const ids = COMPANIES.map((p) => p.id);
  const L: string[] = [];
  L.push("# Simulación del motor · V6 (carrera continua) y V5 (temporadas)", "");
  L.push("Generado con `SIM_REPORT=1 npx vitest run src/lib/ceo/season-sim.test.ts -t V6`. Semillas fijas: el resultado es reproducible.", "");
  L.push("**Estrategias de control (holdout):** " + [...HOLDOUT].map((n) => `\`${n}\``).join(", ") + ". No se usaron para ajustar ninguna regla. Aprobar las seis empresas con una estrategia conocida no prueba nada; por eso se reportan aparte.", "");
  L.push("## 1 · Temporadas (veredicto vigente v5) · % de temporadas aprobadas", "");
  L.push(`| Estrategia | Control | ${ids.join(" | ")} | Promedio |`, `|---|---|${ids.map(() => "---").join("|")}|---|`);
  for (const n of names) L.push(`| ${STRATEGIES[n].label} | ${hold.has(n) ? "sí" : ""} | ${ids.map((c) => season[n][c].pass).join(" | ")} | ${avg(ids.map((c) => season[n][c].pass))} |`);
  for (const v of ["v6", "v4"] as const) {
    L.push("", `## ${v === "v6" ? "2" : "3"} · Carrera continua con ${v} · % de meses aprobados (meses 1–${MONTHS} por empresa)`, "");
    if (v === "v4") L.push("Referencia: reglas con que siguen los periodos que empezaron antes de v6 (no se recalifican).", "");
    L.push(`| Estrategia | Control | ${ids.join(" | ")} | Promedio |`, `|---|---|${ids.map(() => "---").join("|")}|---|`);
    for (const n of names) L.push(`| ${STRATEGIES[n].label} | ${hold.has(n) ? "sí" : ""} | ${ids.map((c) => career[v][n][c].months.join("/")).join(" | ")} | ${avg(ids.flatMap((c) => career[v][n][c].months))} |`);
  }
  writeFileSync(join(dir, "simulacion-v6.md"), L.join("\n") + "\n");
}, 3_600_000);
