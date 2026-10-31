import { describe, expect, it } from "vitest";
import { migrate, newState, setupCompany } from "../engine";
import { companyById } from "../companies";
import type { CareerRun, CeoState, Kpis } from "../types";
import { ARCHETYPES } from "../career/taxonomy";
import { ASSUMPTIONS, ASSUMPTIONS_VERSION, PROFILES, businessOf, closedRunsOf, sanitizeBusiness, simulate, type Allocation, type PeriodInput } from "./index";
import { formatMoney } from "../career/money";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const quiet = (n: number): PeriodInput[] => Array.from({ length: n }, () => ({ kpiDelta: {}, status: "cerrado" as const }));
// Las industrias de enfoque hoy solo se crean como «establecida»; el tipo se fuerza después para probar la escala.
const own = (archetype = "establecida", industryId = "alimentos_bebidas", sectorId = "manufactura"): CeoState => {
  const s = setupCompany({ ...newState(), name: "Oziel", alias: "oziel", startedAt: T0 }, { companyId: CID, sectorId, industryId, archetype: "establecida", displayName: "Sigma Alimentos" }, T0);
  if (!s.companyProfile) throw new Error(`no se pudo crear ${industryId}`);
  return { ...s, companyProfile: { ...s.companyProfile, archetype: archetype as never } };
};
const run = (s: CeoState, k: Partial<Kpis>, i: number): CareerRun => {
  const base = companyById(s.company).kpiStart;
  return { company: s.company, tier: 0, rulesVersion: 4, startedAt: T0 + i * 7 * 86_400_000, endedAt: T0 + (i + 1) * 7 * 86_400_000, kpis: { ...base, ...k }, health: 60, answered: 100, passed: true, xp: 100, decisions: {} };
};

describe("motor de negocio · identidad de caja y determinismo", () => {
  for (const p of Object.values(PROFILES)) for (const a of ARCHETYPES) {
    it(`${p.id} · ${a.id}: cashEnd = cashBegin + inflows − outflows en cada mes, y cada mes empieza donde terminó el anterior`, () => {
      const ins: PeriodInput[] = [{ kpiDelta: { caja: 4, margen: -3 }, status: "cerrado" }, { kpiDelta: { clientes: 6, equipo: -5 }, status: "cerrado" }, { kpiDelta: { caja: -8 }, status: "en_curso" }];
      const allocs: Allocation[] = [{ id: "m", period: 1, lever: "marketing", amount: p.baselines[a.id].revenue * 0.05, months: 3 }, { id: "c", period: 2, lever: "capex", amount: 1 }, { id: "d", period: 1, lever: "deuda", amount: 2 }];
      const ps = simulate(p, ins, { seed: CID, archetype: a.id, allocations: allocs });
      expect(ps).toHaveLength(4);
      ps.forEach((x, i) => {
        expect(x.cashEnd).toBeCloseTo(x.cashBegin + x.inflows - x.outflows, 6);
        if (i > 0) expect(x.cashBegin).toBe(ps[i - 1].cashEnd);
        expect(x.ebitda).toBeCloseTo(x.grossProfit - x.payroll - x.marketing - x.otherOpex, 3);
        expect(Number.isFinite(x.revenue) && x.revenue > 0).toBe(true);
      });
      expect(ps[0].cashEnd).toBe(p.baselines[a.id].cash);
    });
  }

  it("determinista: el mismo estado da el mismo resultado; otra empresa varía distinto", () => {
    const p = PROFILES.alimentos;
    const a = simulate(p, quiet(4), { seed: CID, archetype: "pyme" });
    expect(simulate(p, quiet(4), { seed: CID, archetype: "pyme" })).toEqual(a);
    expect(simulate(p, quiet(4), { seed: "otra", archetype: "pyme" })).not.toEqual(a);
  });

  it("supuestos versionados y congelados", () => {
    expect(Object.isFrozen(ASSUMPTIONS)).toBe(true);
    expect(Object.isFrozen(ASSUMPTIONS[ASSUMPTIONS_VERSION])).toBe(true);
  });
});

describe("motor de negocio · ejemplo del plan (PYME de alimentos, P0-A §4.4)", () => {
  const p = PROFILES.alimentos;
  const exact = { seed: CID, archetype: "pyme" as const, noise: false };

  it("mes 1: ventas 4.04, EBITDA 0.12 y la caja sube poco", () => {
    const [m0, m1] = simulate(p, quiet(1), exact);
    expect(m0.revenue).toBe(4);
    expect(m0.cashEnd).toBe(6);
    expect(m1.revenue).toBeCloseTo(4.04, 2);
    expect(m1.ebitda).toBeCloseTo(0.12, 2);
    expect(m1.cashEnd).toBeGreaterThan(6);
    expect(m1.cashEnd).toBeLessThan(6.15);
  });

  it("el marketing sale de la caja el mes siguiente y vende un mes después (retraso de 1)", () => {
    const mk: Allocation = { id: "mk", period: 1, lever: "marketing", amount: 0.2, months: 3 };
    const base = simulate(p, quiet(3), exact);
    const withMk = simulate(p, quiet(3), { ...exact, allocations: [mk] });
    // mes 2: ya se paga, todavía no vende → EBITDA negativo y menos caja que sin marketing
    expect(withMk[2].marketing).toBeCloseTo(0.25, 6);
    expect(withMk[2].revenue).toBe(base[2].revenue);
    expect(withMk[2].ebitda).toBeLessThan(0);
    expect(withMk[2].cashEnd).toBeLessThan(base[2].cashEnd);
    // mes 3: la venta crece más que sin marketing (≈ 4%)
    expect(withMk[3].growth).toBeGreaterThan(base[3].growth + 0.02);
    expect(withMk[3].revenue).toBeGreaterThan(base[3].revenue);
  });

  it("una inversión baja el efectivo y la deuda lo sube; la pista se calcula sobre el consumo", () => {
    const capex = simulate(p, quiet(2), { ...exact, allocations: [{ id: "c", period: 1, lever: "capex", amount: 1.5 }] });
    const base = simulate(p, quiet(2), exact);
    expect(capex[2].cashEnd).toBeCloseTo(base[2].cashEnd - 1.5, 3);
    expect(capex[2].runwayMonths).not.toBeNull();
    const debt = simulate(p, quiet(2), { ...exact, allocations: [{ id: "d", period: 1, lever: "deuda", amount: 3 }] });
    expect(debt[2].cashEnd).toBeCloseTo(base[2].cashEnd + 3, 3);
    expect(debt[2].debt).toBe(3);
  });
});

describe("motor de negocio · índices y dinero", () => {
  const p = PROFILES.alimentos;
  it("el índice Caja sube → se cobra antes → más efectivo; baja → menos. Nunca se suman al dinero", () => {
    const up = simulate(p, [{ kpiDelta: { caja: 10 }, status: "cerrado" }], { seed: CID, archetype: "establecida", noise: false });
    const down = simulate(p, [{ kpiDelta: { caja: -10 }, status: "cerrado" }], { seed: CID, archetype: "establecida", noise: false });
    const flat = simulate(p, quiet(1), { seed: CID, archetype: "establecida", noise: false });
    expect(up[1].cashEnd).toBeGreaterThan(flat[1].cashEnd);
    expect(down[1].cashEnd).toBeLessThan(flat[1].cashEnd);
    expect(up[1].dso).toBeLessThan(flat[1].dso);
    // 10 puntos de índice no son 10 millones
    expect(Math.abs(up[1].cashEnd - flat[1].cashEnd - 10)).toBeGreaterThan(1);
  });
  it("Margen mueve el margen bruto dentro de una banda; Clientes, el crecimiento", () => {
    const m = simulate(p, [{ kpiDelta: { margen: 500 }, status: "cerrado" }], { seed: CID, archetype: "establecida", noise: false });
    expect(m[1].grossMargin).toBeCloseTo(p.baselines.establecida.grossMargin + ASSUMPTIONS[1].marginBand, 6);
    const c = simulate(p, [{ kpiDelta: { clientes: 10 }, status: "cerrado" }], { seed: CID, archetype: "establecida", noise: false });
    expect(c[1].revenue).toBeGreaterThan(simulate(p, quiet(1), { seed: CID, archetype: "establecida", noise: false })[1].revenue);
  });
});

describe("motor de negocio · métricas por industria", () => {
  it("4 a 6 métricas de operación por industria, con metas; sin inventario en SaaS ni MRR en alimentos", () => {
    for (const p of Object.values(PROFILES)) {
      expect(p.metrics.length, p.id).toBeGreaterThanOrEqual(4);
      expect(p.metrics.length, p.id).toBeLessThanOrEqual(6);
      expect(new Set(p.metrics.map((m) => m.id)).size).toBe(p.metrics.length);
    }
    const ids = (id: string) => PROFILES[id].metrics.map((m) => `${m.id} ${m.label}`.toLowerCase()).join(" | ");
    expect(ids("saas")).not.toMatch(/inventario|merma|otif/);
    expect(ids("alimentos")).not.toMatch(/mrr|churn|suscrip/);
    expect(ids("autopartes")).not.toMatch(/mrr|ticket/);
    expect(ids("restaurantes")).not.toMatch(/mrr|ppm|oee/);
  });
  it("las cifras de la establecida coinciden con la ficha del paquete", () => {
    expect(PROFILES.alimentos.baselines.establecida.revenue * 12).toBeCloseTo(410, -1);
    expect(PROFILES.alimentos.baselines.establecida.headcount).toBe(240);
    expect(PROFILES.autopartes.baselines.establecida.revenue * 12).toBeCloseTo(2300, -1);
    expect(PROFILES.restaurantes.baselines.establecida.revenue * 12).toBeCloseTo(980, -1);
    expect(PROFILES.restaurantes.baselines.establecida.headcount).toBe(1450);
  });
});

describe("businessOf · reconstrucción desde el estado", () => {
  it("fuera de la carrera continua no hay negocio", () => {
    expect(businessOf({ ...newState(), startedAt: T0 })).toBeNull();
  });

  it("empresa nueva: mes de llegada + mes en curso; supuestos congelados al crearla", () => {
    const s = own();
    expect(s.business).toEqual({ assumptionsVersion: ASSUMPTIONS_VERSION, allocations: [] });
    const b = businessOf(s, T0)!;
    expect(b.profile.id).toBe("alimentos");
    expect(b.periods.map((p) => p.status)).toEqual(["llegada", "en_curso"]);
    expect(b.closed.period).toBe(0);
    expect(b.now.period).toBe(1);
  });

  it("cada periodo cerrado es un mes; los periodos de otras empresas no cuentan; reconstruir da lo mismo", () => {
    const s0 = own("pyme");
    const s = { ...s0, career: [{ ...run(s0, {}, -3), company: "forja" }, run(s0, { caja: 66, clientes: 70 }, 0), run(s0, { caja: 55 }, 1)] };
    expect(closedRunsOf(s)).toHaveLength(2);
    const b = businessOf(s, T0)!;
    expect(b.periods.map((p) => p.status)).toEqual(["llegada", "cerrado", "cerrado", "en_curso"]);
    expect(b.periods[1].kpiDelta.caja).toBe(66 - companyById("cumbre").kpiStart.caja);
    expect(businessOf(migrate(JSON.parse(JSON.stringify(s))), T0)).toEqual(b);
  });

  it("el tipo de empresa cambia la escala; la industria, las métricas", () => {
    const pyme = businessOf(own("pyme"), T0)!;
    const est = businessOf(own("establecida"), T0)!;
    expect(est.closed.revenue).toBeGreaterThan(pyme.closed.revenue * 5);
    const fz = businessOf(own("establecida", "autopartes"), T0)!;
    expect(Object.keys(fz.closed.opsMetrics)).toContain("oee");
    expect(Object.keys(est.closed.opsMetrics)).toContain("merma");
  });

  it("migrate limpia el registro: asignaciones dañadas o repetidas se descartan", () => {
    expect(sanitizeBusiness(null)).toBeNull();
    const b = sanitizeBusiness({ assumptionsVersion: "x", allocations: [{ id: "a", period: 1, lever: "marketing", amount: 0.2, months: 3 }, { id: "a", period: 1, lever: "marketing", amount: 0.2 }, { id: "b", period: 1, lever: "magia", amount: 1 }, { id: "c", period: -1, lever: "capex", amount: 1 }, { id: "d", period: 1, lever: "capex", amount: -5 }] })!;
    expect(b.assumptionsVersion).toBe(ASSUMPTIONS_VERSION);
    expect(b.allocations).toEqual([{ id: "a", period: 1, lever: "marketing", amount: 0.2, months: 3 }]);
    const s = migrate({ ...own(), business: "basura" });
    expect(s.business).toBeUndefined();
  });

  it("formato de dinero: MXN y USD sin recalcular", () => {
    const b = businessOf(own("pyme"), T0)!;
    expect(formatMoney(b.closed.cashEnd)).toBe("$6.0 M MXN");
    expect(formatMoney(b.closed.cashEnd, "USD")).toBe("$0.32 M USD");
  });
});
