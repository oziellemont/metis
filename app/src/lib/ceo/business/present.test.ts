import { describe, expect, it } from "vitest";
import { newState, setupCompany } from "../engine";
import { companyById } from "../companies";
import type { CareerRun, CeoState, Kpis } from "../types";
import { PROFILES, businessOf, simulate } from "./index";
import { formatMetric, metricChange, metricVsTarget, narrative, pctChange, periodLabel, runwayText } from "./present";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
const own = (): CeoState => setupCompany({ ...newState(), name: "Oziel", alias: "oziel", startedAt: T0 }, { companyId: "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b", sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: "Lácteos del Norte", specialty: "Lácteos" } as never, T0);
const run = (s: CeoState, k: Partial<Kpis>, i: number): CareerRun => ({ company: s.company, tier: 0, rulesVersion: 4, startedAt: T0 + i * 7 * 86_400_000, endedAt: T0 + (i + 1) * 7 * 86_400_000, kpis: { ...companyById(s.company).kpiStart, ...k }, health: 60, answered: 100, passed: true, xp: 100, decisions: {} });

describe("presentación de los números", () => {
  it("formatos por unidad, con signo menos tipográfico", () => {
    expect(formatMetric(96.4, "%")).toBe("96.4 %");
    expect(formatMetric(32, "dias")).toBe("32 días");
    expect(formatMetric(410, "ppm")).toBe("410 ppm");
    expect(formatMetric(420, "mxn")).toBe("$420");
    expect(formatMetric(24, "M", "MXN")).toBe("$24.0 M MXN");
    expect(formatMetric(-1.5, "%")).toBe("−1.5 %");
  });

  it("la variación se pinta según si más es mejor o peor", () => {
    expect(metricChange({ unit: "%", better: "down" }, 3.2, 3.6)).toEqual({ text: "−0.4 pts", tone: "good" });
    expect(metricChange({ unit: "%", better: "up" }, 3.2, 3.6).tone).toBe("bad");
    expect(metricChange({ unit: "ppm", better: "down" }, 400, 400.2).tone).toBe("flat");
    expect(pctChange(4.04, 4)).toEqual({ text: "+1.0 %", tone: "good" });
    expect(pctChange(1, 0).text).toBe("—");
  });

  it("meta: en meta o cuál es", () => {
    expect(metricVsTarget({ unit: "%", better: "up", target: 95 }, 96)).toEqual({ text: "en meta", tone: "good" });
    expect(metricVsTarget({ unit: "dias", better: "down", target: 25 }, 32)!.text).toBe("meta 25 días");
    expect(metricVsTarget({ unit: "M", better: "up" }, 1)).toBeNull();
  });

  it("etiquetas de mes y pista", () => {
    const ps = simulate(PROFILES.alimentos, [{ kpiDelta: {}, status: "cerrado" }, { kpiDelta: {}, status: "en_curso" }], { seed: "x", archetype: "pyme" });
    expect(ps.map(periodLabel)).toEqual(["Llegada", "Mes 1", "Mes 2 · en curso"]);
    expect(runwayText({ ...ps[1], runwayMonths: null })).toBe("La operación genera caja");
    expect(runwayText({ ...ps[1], runwayMonths: 4.25 })).toBe("4.3 meses de pista");
    expect(runwayText({ ...ps[1], runwayMonths: 40 })).toBe("Más de 24 meses de pista");
  });

  it("la lectura cambia de la llegada al primer mes cerrado y respeta la moneda", () => {
    const s = own();
    const a = narrative(businessOf(s, T0)!);
    expect(a).toMatch(/^Al llegar, la empresa vende \$\d/);
    expect(a).toContain("MXN");
    const s2 = { ...s, career: [run(s, { caja: 60 }, 0)] };
    const b = narrative(businessOf(s2, T0)!, "USD");
    expect(b).toMatch(/^En el mes 1 vendiste/);
    expect(b).toContain("USD");
    expect(b).not.toContain("MXN");
  });
});
