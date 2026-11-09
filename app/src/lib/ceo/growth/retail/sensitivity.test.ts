import { describe, it, expect } from "vitest";
import { fmtM } from "./engine";
import { runStrategy, STRATEGIES, SENSITIVITY, type RunResult } from "./strategies";

const ID = "conveniencia_regional_v2";
let grid: Record<string, RunResult[]> | null = null;
const get = () => (grid ??= Object.fromEntries(SENSITIVITY.map((sc) => [sc.id, STRATEGIES.map((k) => runStrategy(ID, k, sc))])));

describe("retail v2 · sensibilidad económica", () => {
  it("ninguna estrategia gana en todos los escenarios (valor económico y riesgo)", () => {
    const g = get();
    const winners = new Map<string, number>();
    const rows: string[] = [];
    for (const [sc, rs] of Object.entries(g)) {
      const best = [...rs].sort((a, b) => b.value - a.value)[0].strategy;
      winners.set(best, (winners.get(best) ?? 0) + 1);
      rows.push(`${sc.padEnd(18)} ${rs.map((r) => `${r.strategy}: valor ${fmtM(r.value)} · EBITDA ${(r.margin * 100).toFixed(1)}% · ${r.overdueDays} d con vencidos`).join(" | ")} → ${best}`);
    }
    console.log(rows.join("\n"));
    expect(winners.size).toBeGreaterThanOrEqual(2);
    // La agresiva gana en bonanza pero en algún escenario adverso es la peor.
    expect(Object.values(g).some((rs) => [...rs].sort((a, b) => a.value - b.value)[0].strategy === "agresiva")).toBe(true);
    const od = (i: number) => Object.values(g).reduce((a, rs) => a + rs[i].overdueDays, 0);
    expect(od(2)).toBeGreaterThan(od(0));
    for (const n of winners.values()) expect(n).toBeLessThanOrEqual(Math.ceil((SENSITIVITY.length * 2) / 3));
  }, 240_000);

  it("cada factor mueve el resultado en la dirección esperada", () => {
    const g = get();
    const eb = (sc: string) => g[sc][0].ebitda;
    expect(eb("demanda+6")).toBeGreaterThan(eb("base"));
    expect(eb("demanda-8")).toBeLessThan(eb("base"));
    expect(eb("costo+3")).toBeLessThan(eb("base"));
    expect(eb("merma+50")).toBeLessThan(eb("base"));
    expect(eb("salarios+80")).toBeLessThan(eb("base"));
    expect(eb("energia+25")).toBeLessThan(eb("base"));
    expect(eb("competidor")).toBeLessThan(eb("base"));
    expect(g["tasa+4"][2].net).toBeLessThan(g.base[2].net);
    expect(g["aperturas-lentas"][2].value).toBeLessThan(g.base[2].value);
  }, 240_000);
});
