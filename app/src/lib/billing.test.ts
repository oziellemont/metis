import { describe, expect, it } from "vitest";
import { monthlyEstimate, tierFor, MIN_SEATS } from "./billing";

describe("cobro por scorecard", () => {
  it("aplica el mínimo de colaboradores", () => {
    const e = monthlyEstimate(4);
    expect(e.charged).toBe(MIN_SEATS);
    expect(e.amount).toBe(MIN_SEATS * 189);
  });
  it("elige el escalón por número de scorecards", () => {
    expect(tierFor(60).id).toBe("arranca");
    expect(tierFor(61).id).toBe("crece");
    expect(tierFor(301).id).toBe("escala");
    expect(tierFor(2000).id).toBe("corporativo");
    expect(monthlyEstimate(2000).amount).toBeNull();
  });
  it("aplica descuento de Cliente Fundador", () => {
    expect(monthlyEstimate(100, 20).amount).toBe(Math.round(100 * 159 * 0.8));
  });
});
