import { describe, it, expect } from "vitest";
import { fmtM } from "./engine";
import { runStrategy, STRATEGIES, SENSITIVITY, MARGIN_SCENARIOS, type RunResult } from "./strategies";

const grid: Record<string, Record<string, RunResult[]>> = {};
const get = (id: string) => (grid[id] ??= Object.fromEntries(SENSITIVITY.map((sc) => [sc.id, STRATEGIES.map((k) => runStrategy(id, k, sc))])));

describe("acería v2 · sensibilidad económica", () => {
  for (const id of ["aceria_compacta_v2", "miniaceria_integrada_v2"]) {
    it(`${id}: ninguna estrategia gana en todos los escenarios (valor económico y riesgo)`, () => {
      const g = get(id);
      const winners = new Map<string, number>();
      const rows: string[] = [];
      for (const [sc, rs] of Object.entries(g)) {
        const best = [...rs].sort((a, b) => b.value - a.value)[0].strategy;
        winners.set(best, (winners.get(best) ?? 0) + 1);
        rows.push(`${sc.padEnd(24)} ${rs.map((r) => `${r.strategy}: EVA ${fmtM(r.value)} · EBITDA ${(r.margin * 100).toFixed(1)}% · ${r.overdueDays} d con vencidos`).join(" | ")} → ${best}`);
      }
      console.log(rows.join("\n"));
      // Al menos dos estrategias distintas ganan algún escenario.
      expect(winners.size).toBeGreaterThanOrEqual(2);
      // La agresiva crea más valor en bonanza, pero carga más riesgo: en algún escenario adverso es la peor.
      const worstSomewhere = Object.values(g).some((rs) => [...rs].sort((a, b) => a.value - b.value)[0].strategy === "agresiva");
      expect(worstSomewhere).toBe(true);
      // La agresiva acumula más días con adeudos vencidos que la conservadora en el conjunto de escenarios.
      const od = (i: number) => Object.values(g).reduce((a, rs) => a + rs[i].overdueDays, 0);
      expect(od(2)).toBeGreaterThan(od(0));
      // Ninguna estrategia gana más de dos tercios de los escenarios.
      for (const n of winners.values()) expect(n).toBeLessThanOrEqual(Math.ceil((SENSITIVITY.length * 2) / 3));
    }, 240_000);
  }

  it("cada factor mueve el resultado en la dirección esperada", () => {
    const g = get("miniaceria_integrada_v2");
    const eb = (sc: string) => g[sc][0].ebitda;
    expect(eb("precio+5")).toBeGreaterThan(eb("base"));
    expect(eb("precio-6")).toBeLessThan(eb("base"));
    expect(eb("chatarra+10")).toBeLessThan(eb("base"));
    expect(eb("chatarra-8")).toBeGreaterThan(eb("base"));
    expect(eb("energia+20")).toBeLessThan(eb("base"));
    expect(eb("rendimiento-2")).toBeLessThan(eb("base"));
    expect(eb("demanda-15")).toBeLessThan(eb("base"));
    expect(g["cobranza+20d"][0].cashMin).toBeLessThan(g.base[0].cashMin);
  }, 240_000);

  it("márgenes de la integrada: 13–14 % en el caso base y 10–11 % con diferencial apretado", () => {
    const [base, tight] = MARGIN_SCENARIOS.map(({ scenario }) => runStrategy("miniaceria_integrada_v2", "conservadora", scenario));
    expect(base.margin).toBeGreaterThan(0.13); expect(base.margin).toBeLessThan(0.14);
    expect(tight.margin).toBeGreaterThan(0.10); expect(tight.margin).toBeLessThan(0.11);
    const c = runStrategy("aceria_compacta_v2", "conservadora");
    expect(c.margin).toBeGreaterThan(0.03); expect(c.margin).toBeLessThan(0.07);
  }, 120_000);
});
