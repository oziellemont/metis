import { describe, expect, it } from "vitest";
import { traffic, attainment, totalWeight, isWeightValid, invalidMonths, weightedAttainment, weightFor } from "./scoring";
import type { ScorecardItem } from "./types";

const t = { min: 92, sat: 95, out: 98 };

describe("semáforo incremental (↑)", () => {
  it("clasifica por niveles", () => {
    expect(traffic(98.5, t, "up")).toBe("outstanding");
    expect(traffic(98, t, "up")).toBe("outstanding");
    expect(traffic(96.1, t, "up")).toBe("satisfactory");
    expect(traffic(93, t, "up")).toBe("minimum");
    expect(traffic(91.9, t, "up")).toBe("below");
    expect(traffic(null, t, "up")).toBe("pending");
  });
});

describe("semáforo decremental (↓)", () => {
  const d = { min: 6.2, sat: 5.8, out: 5.4 };
  it("invierte la lógica", () => {
    expect(traffic(5.3, d, "down")).toBe("outstanding");
    expect(traffic(5.8, d, "down")).toBe("satisfactory");
    expect(traffic(5.9, d, "down")).toBe("minimum");
    expect(traffic(6.3, d, "down")).toBe("below");
  });
});

describe("cumplimiento", () => {
  it("100% en satisfactorio, acotado a 120", () => {
    expect(attainment(95, t, "up")).toBe(100);
    expect(attainment(190, t, "up")).toBe(120);
    expect(attainment(5.8, { min: 6.2, sat: 5.8, out: 5.4 }, "down")).toBe(100);
    expect(attainment(2.9, { min: 4, sat: 3.5, out: 3 }, "down")).toBe(120);
  });
});

function item(id: string, weight: number, monthly?: Partial<Record<number, number>>): ScorecardItem {
  return { id, scorecardId: "s", elementScopeId: id, responsibility: "owner", weight, monthlyWeights: monthly, targets: t, period: "monthly" };
}

describe("ponderación", () => {
  it("suma 100 y valida", () => {
    const items = [item("a", 25), item("b", 20), item("c", 20), item("d", 20), item("e", 15)];
    expect(totalWeight(items, 1)).toBe(100);
    expect(isWeightValid(items, 1)).toBe(true);
    expect(invalidMonths(items)).toEqual([]);
  });
  it("detecta meses con peso distinto", () => {
    const items = [item("a", 50, { 3: 60 }), item("b", 50)];
    expect(weightFor(items[0], 3)).toBe(60);
    expect(isWeightValid(items, 3)).toBe(false);
    expect(invalidMonths(items)).toEqual([3]);
  });
});

describe("cumplimiento ponderado", () => {
  it("re-normaliza entre los cargados", () => {
    const r = weightedAttainment([
      { item: item("a", 50), value: 95, traffic: "satisfactory", attainment: 100, weight: 50 },
      { item: item("b", 50), value: null, traffic: "pending", attainment: null, weight: 50 },
    ]);
    expect(r.value).toBe(100);
    expect(r.loaded).toBe(1);
    expect(r.total).toBe(2);
  });
  it("pondera correctamente", () => {
    const r = weightedAttainment([
      { item: item("a", 75), value: 0, traffic: "below", attainment: 80, weight: 75 },
      { item: item("b", 25), value: 0, traffic: "outstanding", attainment: 120, weight: 25 },
    ]);
    expect(r.value).toBe(90);
  });
});
