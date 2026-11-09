import { describe, it, expect } from "vitest";
import { createRetail, runRetail, advanceRetail, applyRetail, balanceSheet, reconcile, cashOf, overdueTotal, storesOpen, type RetailState } from "./engine";
import { RETAIL_V2_ENABLED, TEMPLATES_RETAIL } from "./params";

const ID = "conveniencia_regional_v2";
const ok = (s: RetailState) => {
  const b = balanceSheet(s);
  expect(b.ledgerSum).toBe(0);
  expect(b.diff).toBe(0);
  for (const [k, v] of Object.entries(reconcile(s))) expect([k, v + 0]).toEqual([k, 0]);
  for (const [a, v] of Object.entries(s.acc)) expect([a, Number.isInteger(v)]).toEqual([a, true]);
};

describe("retail v2 · contabilidad", () => {
  it("encendido: autorizado para empresas nuevas", () => expect(RETAIL_V2_ENABLED).toBe(true));

  it("la partida doble cuadra y cada saldo concilia durante 24 meses, sin quedarse sin caja", () => {
    const s = createRetail(ID);
    ok(s);
    let minCash = cashOf(s);
    for (let m = 0; m < 24; m++) { runRetail(s, 30); ok(s); minCash = Math.min(minCash, cashOf(s)); }
    expect(minCash).toBeGreaterThan(0);
    expect(s.months).toHaveLength(24);
    expect(overdueTotal(s)).toBe(0);
  });

  it("márgenes de una cadena de conveniencia: bruto 32–36 %, EBITDA 9–11.5 % en el primer año", () => {
    const s = runRetail(createRetail(ID), 360);
    const sum = (f: (m: RetailState["months"][number]) => number) => s.months.reduce((a, m) => a + f(m), 0);
    const rev = sum((m) => m.revenue);
    expect(sum((m) => m.gross) / rev).toBeGreaterThan(0.32);
    expect(sum((m) => m.gross) / rev).toBeLessThan(0.36);
    expect(sum((m) => m.ebitda) / rev).toBeGreaterThan(0.09);
    expect(sum((m) => m.ebitda) / rev).toBeLessThan(0.115);
    const m = s.months.at(-1)!;
    expect(m.ticketsPerStore).toBeGreaterThan(450);
    expect(m.ticketsPerStore).toBeLessThan(650);
  });

  it("es determinista y advanceRetail no modifica el estado original", () => {
    const a = runRetail(createRetail(ID, "x"), 400), b = runRetail(createRetail(ID, "x"), 400);
    expect(JSON.stringify(a.acc)).toBe(JSON.stringify(b.acc));
    expect(JSON.stringify(a.months)).toBe(JSON.stringify(b.months));
    const s = createRetail(ID);
    const before = JSON.stringify(s);
    advanceRetail(s, 60);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("saldos iniciales coherentes: caja de la plantilla, inventario, proveedores y deuda", () => {
    const T = TEMPLATES_RETAIL[ID];
    const s = createRetail(ID);
    const b = balanceSheet(s);
    expect(cashOf(s)).toBe(T.cash * 100);
    expect(b.assets.inventario).toBeGreaterThan(0);
    expect(storesOpen(s)).toBe(T.groups.reduce((a, g) => a + g.n, 0));
    expect(s.sched.some((x) => x.acc === "proveedores" && x.dir === "out")).toBe(true);
    expect(s.loans[0].balance).toBeGreaterThan(0);
  });
});

describe("retail v2 · consecuencias de no pagar", () => {
  it("sin caja: proveedores de contado, luego el CEDIS deja de surtir y la venta cae; el balance sigue cuadrando", () => {
    const s = runRetail(createRetail(ID), 30);
    // Se retiran 400 M de caja (dividendo forzado) para provocar impagos.
    s.acc.caja -= 400_000_000_00; s.acc.capital = (s.acc.capital ?? 0) + 400_000_000_00;
    runRetail(s, 60);
    expect(overdueTotal(s)).toBeGreaterThan(0);
    expect(s.supply.cashOnly).toBe(true);
    expect(s.liquidity).toBe("crisis");
    expect(s.months.at(-1)!.fill).toBeLessThan(0.97);
    expect(s.events.some((e) => e.kind === "proveedor")).toBe(true);
    const b = balanceSheet(s);
    expect(b.ledgerSum).toBe(0);
    expect(b.diff).toBe(0);
  });
});

describe("retail v2 · comandos", () => {
  it("abrir tiendas: invierte, contrata y abren con venta de arranque; cerrar paga liquidaciones y renta", () => {
    const s = runRetail(createRetail(ID), 30);
    const n0 = storesOpen(s);
    expect(applyRetail(s, { type: "open_stores", id: "t:o", group: "mty", n: 10, capexPerStore: 3_200_000, leadDays: 60, rent: 30_000 }).ok).toBe(true);
    runRetail(s, 61);
    expect(storesOpen(s)).toBe(n0 + 10);
    expect(applyRetail(s, { type: "close_stores", id: "t:c", group: "rezagadas", n: 14, leaseMonths: 4 }).ok).toBe(true);
    expect(storesOpen(s)).toBe(n0 - 4);
    runRetail(s, 60);
    ok(s);
    expect(s.months.some((m) => m.impairment > 0)).toBe(true);
  });

  it("idempotencia: el mismo comando no se aplica dos veces", () => {
    const s = runRetail(createRetail(ID), 30);
    const n = s.loans.length;
    applyRetail(s, { type: "term_loan", id: "t:l", amount: 20_000_000, rate: 0.135, months: 24, purpose: "prueba" });
    applyRetail(s, { type: "term_loan", id: "t:l", amount: 20_000_000, rate: 0.135, months: 24, purpose: "prueba" });
    expect(s.loans.length).toBe(n + 1);
  });

  it("el banco aplica cobertura y tope de deuda", () => {
    const s = runRetail(createRetail(ID), 60);
    const r = applyRetail(s, { type: "term_loan", id: "t:big", amount: 2_000_000_000, rate: 0.135, months: 60, purpose: "prueba" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/cobertura|veces el EBITDA/);
  });
});
