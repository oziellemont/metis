import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DAY, newState, reportDueOf, setupCompany } from "../engine";
import { companyById } from "../companies";
import type { CareerRun, CeoState, Kpis } from "../types";
import { businessOf, simulate, PROFILES } from "./index";
import { allocate, closePeriod, dueReportOf, presenterOf, proposalOf, reportOf } from "./report";
import { applyAction, replay, type GameAction } from "../replay";
import { applyEvents, sanitizeAction, sanitizeEvents } from "../journal";
import { pauseCareer } from "../cadence";
import { packOf } from "../engine";
import { formatMoney } from "../career/money";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const W = 7 * DAY;
const own = (): CeoState => {
  const s = setupCompany({ ...newState(), name: "Oziel", alias: "oziel", startedAt: T0 }, { companyId: CID, sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: "Casa Norte Alimentos" }, T0);
  if (!s.companyProfile) throw new Error("sin empresa");
  return s;
};
/** Cierra un mes «a mano» (como lo haría advance) con el cambio de índices `k`. */
const closeMonth = (s: CeoState, k: Partial<Kpis> = {}): CeoState => {
  const i = (s.career ?? []).length;
  const base = companyById(s.company).kpiStart;
  const run: CareerRun = { company: s.company, tier: 0, rulesVersion: 4, startedAt: T0 + i * W, endedAt: T0 + (i + 1) * W, kpis: { ...base, ...k }, health: 60, answered: 100, passed: true, xp: 100, decisions: {} };
  return { ...s, career: [...(s.career ?? []), run], startedAt: T0 + (i + 1) * W, decisions: {}, pinned: {}, read: {} };
};
const at = (n: number) => T0 + n * W + 3600_000;

describe("P0-D · reporte pendiente y cierre por avance", () => {
  it("sin meses cerrados no hay reporte; al cerrar el mes 1, su reporte queda pendiente", () => {
    const s = own();
    expect(reportDueOf(s)).toBeNull();
    expect(dueReportOf(s)).toBeNull();
    const m1 = closeMonth(s);
    expect(reportDueOf(m1)).toBe(1);
    expect(dueReportOf(m1)?.period).toBe(1);
  });

  it("las temporadas (sin empresa propia) no tienen reporte", () => {
    const s = { ...newState(), startedAt: T0, career: [] };
    expect(reportDueOf(s)).toBeNull();
    expect(reportOf(s, 1)).toBeNull();
  });

  it("firmar el reporte lo marca revisado una sola vez y no admite otro mes", () => {
    const m1 = closeMonth(own());
    expect(closePeriod(m1, 2, at(1))).toBe(m1);
    const signed = closePeriod(m1, 1, at(1));
    expect(signed.business?.reviewed).toEqual([1]);
    expect(reportDueOf(signed)).toBeNull();
    expect(closePeriod(signed, 1, at(1) + 1)).toBe(signed);
  });

  it("presenta la dirección de Finanzas del elenco", () => {
    const pk = packOf(own());
    expect(pk.cast[presenterOf(pk)].role).toMatch(/Finanzas/);
  });
});

describe("P0-D · el reporte compara mes anterior, meta y real con números del motor", () => {
  it("mes 1: real, meta y anterior salen de businessOf; el «por qué» no inventa cifras", () => {
    const m1 = closeMonth(own(), { caja: -2 });
    const r = reportOf(m1, 1)!;
    const b = businessOf(m1)!;
    expect(r.actual).toEqual(b.periods[1]);
    expect(r.prev).toEqual(b.periods[0]);
    expect(r.actual.revenueTarget).toBe(b.periods[1].revenueTarget);
    expect(r.why.length).toBeGreaterThan(0);
    expect(r.why.length).toBeLessThanOrEqual(3);
    // el «por qué» cita los días de cobro del motor
    expect(r.why.join(" ")).toContain(Math.round(b.periods[1].dso).toString());
  });

  it("propone marketing si quedaste abajo de la meta, con tres opciones y la proyección de cada una", () => {
    // Clientes a la baja: ventas abajo de la meta.
    const m1 = closeMonth(own(), { clientes: -10 });
    const r = reportOf(m1, 1)!;
    expect(r.actual.revenue).toBeLessThan(r.actual.revenueTarget);
    expect(r.proposal?.kind).toBe("marketing");
    const [a, b, c] = r.proposal!.options;
    expect([a.id, b.id, c.id]).toEqual(["a", "b", "c"]);
    expect(b.allocation!.amount).toBeCloseTo(a.allocation!.amount / 2, 2);
    expect(c.allocation).toBeNull();
    // gastar más deja menos caja al horizonte, y vende más
    expect(a.projection.cash).toBeLessThan(c.projection.cash);
    expect(a.projection.revenue).toBeGreaterThan(c.projection.revenue);
  });

  it("es determinista: el mismo estado da el mismo reporte", () => {
    const m1 = closeMonth(own(), { clientes: -10 });
    expect(reportOf(m1, 1)).toEqual(reportOf(m1, 1));
  });
});

describe("P0-D · decisión de caja con efecto diferido", () => {
  const signedWith = (opt: "a" | "b" | "c") => {
    const m1 = closeMonth(own(), { clientes: -10 });
    return closePeriod(allocate(m1, 1, opt, at(1)), 1, at(1));
  };

  it("aprobar crea UNA asignación del mes; repetir o aprobar otro mes no hace nada", () => {
    const m1 = closeMonth(own(), { clientes: -10 });
    const a = allocate(m1, 1, "a", at(1));
    expect(a.business!.allocations).toHaveLength(1);
    expect(a.business!.allocations[0]).toMatchObject({ id: "m1", period: 1, lever: "marketing" });
    expect(allocate(a, 1, "b", at(1) + 1)).toBe(a);
    expect(allocate(m1, 2, "a", at(1))).toBe(m1);
    expect(allocate(m1, 1, "c", at(1))).toBe(m1);
    // ya firmado: no se puede aprobar después
    const signed = closePeriod(m1, 1, at(1));
    expect(allocate(signed, 1, "a", at(1))).toBe(signed);
  });

  it("la inversión baja la caja de forma coherente y el efecto en ventas llega con su retraso", () => {
    const yes = signedWith("a"), no = signedWith("c");
    const amount = yes.business!.allocations[0].amount;
    // mes 2 (se paga) y mes 3 (empieza a vender)
    const y2 = closeMonth(closePeriod(closeMonth(yes), 2, at(2)));
    const n2 = closeMonth(closePeriod(closeMonth(no), 2, at(2)));
    const by = businessOf(y2)!.periods, bn = businessOf(n2)!.periods;
    // mes 2: sale el gasto, la venta todavía no llega
    expect(by[2].marketing - bn[2].marketing).toBeCloseTo(amount, 3);
    expect(by[2].revenue).toBe(bn[2].revenue);
    expect(bn[2].cashEnd - by[2].cashEnd).toBeCloseTo(amount, 2);
    // mes 3: la venta responde
    expect(by[3].revenue).toBeGreaterThan(bn[3].revenue);
    // identidad de caja en cada mes
    for (const p of by) expect(p.cashEnd).toBeCloseTo(p.cashBegin + p.inflows - p.outflows, 6);
  });

  it("el reporte del mes 2 explica que el gasto salió y la venta todavía no llega", () => {
    const y = closeMonth(signedWith("a"));
    const r = reportOf(y, 2)!;
    const amount = y.business!.allocations[0].amount;
    expect(r.why.join(" ")).toMatch(/el gasto de la campaña ya salió/i);
    expect(r.why.join(" ")).toContain(formatMoney(amount, "MXN"));
    expect(r.proposal).toBeNull(); // con una campaña corriendo, este mes basta con «Enterado»
    const y3 = closeMonth(closePeriod(y, 2, at(2)));
    expect(reportOf(y3, 3)!.why.join(" ")).toMatch(/la campaña ya vende/i);
  });

  it("el motor y la proyección del reporte coinciden: decidir no cambia meses ya cerrados", () => {
    const m1 = closeMonth(own(), { clientes: -10 });
    const before = businessOf(m1)!.periods.slice(0, 2);
    const after = businessOf(allocate(m1, 1, "a", at(1)))!.periods.slice(0, 2);
    expect(after).toEqual(before);
  });

  it("con caja corta no se propone gastar", () => {
    const m1 = closeMonth(own());
    const thin = { ...m1, business: { ...m1.business!, allocations: [{ id: "x", period: 0, lever: "capex" as const, amount: 1e4 }] } };
    expect(proposalOf(thin, 1)).toBeNull();
  });
});

describe("P0-D · vacaciones y reconstrucción desde el diario", () => {
  it("de vacaciones, el negocio no se mueve y no se puede decidir", () => {
    const m1 = closeMonth(own(), { clientes: -10 });
    const paused = pauseCareer(m1, at(1), null);
    const b1 = businessOf(paused, at(1) + DAY);
    const b2 = businessOf(paused, at(1) + 60 * DAY);
    expect(b2).toEqual(b1);
    expect(applyAction(paused, { type: "allocate", at: at(1) + DAY, period: 1, option: "a" }).applied).toBe(false);
    expect(applyAction(paused, { type: "closePeriod", at: at(1) + DAY, period: 1 }).applied).toBe(false);
  });

  it("reconstruir desde el diario da el mismo negocio; las acciones repetidas se rechazan", () => {
    const m1 = closeMonth(own(), { clientes: -10 });
    const actions: GameAction[] = [
      { type: "allocate", at: at(1), period: 1, option: "a" },
      { type: "allocate", at: at(1) + 1, period: 1, option: "b" },
      { type: "closePeriod", at: at(1) + 2, period: 1 },
      { type: "closePeriod", at: at(1) + 3, period: 1 },
    ];
    const { state, rejected } = replay(actions, m1);
    expect(rejected).toEqual([1, 3]);
    const direct = closePeriod(allocate(m1, 1, "a", at(1)), 1, at(1) + 2);
    expect(businessOf(state)).toEqual(businessOf(direct));
    expect(state.business).toEqual(direct.business);
  });

  it("el servidor valida y aplica las acciones nuevas igual que el dispositivo", () => {
    const m1 = closeMonth(own(), { clientes: -10 });
    const raw = [
      { eventId: "11111111-1111-4111-8111-111111111111", seq: 1, action: { type: "allocate", at: at(1), period: 1, option: "a", amount: 999 } },
      { eventId: "22222222-2222-4222-8222-222222222222", seq: 2, action: { type: "closePeriod", at: at(1) + 1, period: 1 } },
      { eventId: "33333333-3333-4333-8333-333333333333", seq: 3, action: { type: "allocate", at: at(1) + 2, period: 1, option: "z" } },
    ];
    const { events, dropped } = sanitizeEvents(raw);
    expect(dropped).toBe(1);
    // el monto lo decide el motor, nunca el dispositivo
    expect(events[0].action).toEqual({ type: "allocate", at: at(1), period: 1, option: "a" });
    const r = applyEvents(m1, events, at(1) + 10);
    expect(r.rejected).toBe(0);
    expect(r.state.business).toEqual(closePeriod(allocate(m1, 1, "a", at(1)), 1, at(1) + 1).business);
  });

  it("sanitizeAction rechaza meses y opciones inválidas", () => {
    for (const bad of [{ type: "allocate", at: 1, period: 0, option: "a" }, { type: "allocate", at: 1, period: 1.5, option: "a" }, { type: "allocate", at: 1, period: 1, option: "c" }, { type: "closePeriod", at: 1 }, { type: "closePeriod", at: 1, period: -1 }]) expect(sanitizeAction(bad)).toBeNull();
    expect(sanitizeAction({ type: "closePeriod", at: 5, period: 2, x: 1 })).toEqual({ type: "closePeriod", at: 5, period: 2 });
  });
});

describe("P0-D · pantallas", () => {
  it("Hoy, Bandeja y el menú avisan del reporte pendiente; Carrera pide revisarlo antes de cerrar", () => {
    const today = readFileSync("src/components/ceo/Today.tsx", "utf8");
    const inbox = readFileSync("src/components/ceo/InboxView.tsx", "utf8");
    const shell = readFileSync("src/components/ceo/CeoShell.tsx", "utf8");
    const career = readFileSync("src/components/ceo/Career.tsx", "utf8");
    expect(today).toMatch(/c\.reportDue/);
    expect(inbox).toMatch(/c\.reportDue/);
    expect(shell).toMatch(/c\.reportDue/);
    expect(career).toMatch(/reportFirst/);
  });

  it("los perfiles del motor siguen cumpliendo la identidad de caja con la asignación de P0-D", () => {
    const p = PROFILES.alimentos;
    const ps = simulate(p, [{ kpiDelta: {}, status: "cerrado" }, { kpiDelta: {}, status: "cerrado" }, { kpiDelta: {}, status: "cerrado" }], { seed: CID, archetype: "establecida", allocations: [{ id: "m1", period: 1, lever: "marketing", amount: 0.5, months: 3 }] });
    for (const x of ps) expect(x.cashEnd).toBeCloseTo(x.cashBegin + x.inflows - x.outflows, 6);
  });
});
