/**
 * Growth Engine · pruebas de aceptación de la adenda (§16.1 integridad y §16.2 realismo), fase 1.
 */
import { describe, expect, it } from "vitest";
import { activePeople, advance, apply, capacityNow, createCompany, headcount, peopleByRole } from "./engine";
import { ROLES_V1, roleById } from "./catalog";
import { burdenOf, laborOf, monthlyCost, pesos } from "./labor";
import type { GrowthState } from "./types";

const noRot = (s: GrowthState) => { s.attrition = false; return s; };
const cashSum = (s: GrowthState) => s.ledger.filter((e) => e.type === "caja").reduce((a, e) => a + e.amount, 0);

describe("costo laboral", () => {
  it("ningún salario del catálogo queda debajo del mínimo 2026 y cada rol declara fuente y confianza", () => {
    const L = laborOf();
    for (const r of ROLES_V1) {
      expect(r.salary.min * 100).toBeGreaterThanOrEqual(pesos(L.minWageDaily.value * 30));
      expect(r.salary.min).toBeLessThanOrEqual(r.salary.mid);
      expect(r.salary.mid).toBeLessThanOrEqual(r.salary.max);
      expect(r.salarySource.length).toBeGreaterThan(20);
    }
    expect(L.minWageDaily.value).toBe(315.04);
    expect(L.minWageDaily.confidence).toBe("oficial");
  });

  it("un operador, un gerente y un ingeniero no cuestan lo mismo; la carga patronal es plausible (25–45 %)", () => {
    const costs = ["operador", "gerente_planta", "ingeniero_procesos"].map((id) => monthlyCost(pesos(roleById(id)!.salary.mid), "NL", laborOf()).total);
    expect(new Set(costs).size).toBe(3);
    for (const id of ["mesero", "cocinero", "gerente_sucursal", "operador", "director_operaciones"]) {
      const b = burdenOf(pesos(roleById(id)!.salary.mid), "NL");
      expect(b).toBeGreaterThan(0.25);
      expect(b).toBeLessThan(0.45);
    }
  });
});

describe("integridad contable", () => {
  for (const tpl of ["restaurante_emergente", "manufactura_emergente"]) {
    it(`${tpl}: caja final = inicial + cobros − pagos, mes por mes, y el libro concilia con el saldo`, () => {
      let s = createCompany(tpl, "id");
      const start = s.cash;
      apply(s, { type: "hire", id: "h1", roleId: tpl.startsWith("rest") ? "cocinero" : "operador", siteId: s.sites[0].id });
      s = advance(s, 360);
      for (const m of s.months) expect(m.cashEnd).toBe(m.cashBegin + m.inflows - m.outflows);
      expect(s.cash).toBe(start + cashSum(s));
      for (let i = 1; i < s.months.length; i++) expect(s.months[i].cashBegin).toBe(s.months[i - 1].cashEnd);
    }, 30_000);
  }

  it("contratar no mueve caja ni gasto el día de la decisión; la nómina aparece una sola vez por mes", () => {
    const s0 = noRot(createCompany("restaurante_emergente", "x"));
    const s = advance(s0, 5);
    const before = { cash: s.cash, n: s.ledger.length };
    apply(s, { type: "hire", id: "h1", roleId: "cocinero", siteId: "centro" });
    expect(s.cash).toBe(before.cash);
    expect(s.ledger.length).toBe(before.n);
    const later = advance(s, 120);
    for (const m of [0, 1, 2, 3]) {
      expect(later.ledger.filter((e) => e.type === "devengo" && e.account === "nomina" && e.month === m).length).toBe(1);
      expect(later.ledger.filter((e) => e.type === "caja" && e.account === "nomina" && e.month === m).length).toBe(1);
    }
    // El costo de entrada se registra una vez, cuando la persona llega.
    expect(later.ledger.filter((e) => e.account === "contratacion" && e.ref === "h1").length).toBe(2);
  });

  it("aplicar la misma decisión dos veces (reintento, refresco) no duplica personas ni pagos", () => {
    const s = createCompany("restaurante_emergente", "x");
    apply(s, { type: "hire", id: "h1", roleId: "cocinero", siteId: "centro" });
    apply(s, { type: "hire", id: "h1", roleId: "cocinero", siteId: "centro" });
    expect(s.vacancies.length).toBe(1);
    const o = { type: "open_site" as const, id: "sur", name: "Sucursal Sur", rent: 50000, utilities: 30000, deposit: 100000, capex: 1200000, years: 8, buildDays: 60, assets: { mesas: 14 }, demandBase: 90, maturityDays: 180, preopening: 80000 };
    apply(s, o); const c = s.cash; apply(s, o);
    expect(s.cash).toBe(c);
    expect(s.sites.length).toBe(2);
  });

  it("es determinista: misma semilla y decisiones dan el mismo resultado", () => {
    const run = () => { const s = createCompany("manufactura_emergente", "det"); apply(s, { type: "hire", id: "h", roleId: "operador", siteId: "planta" }); return advance(s, 200); };
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });

  it("una inversión consume caja al pagarse y el resultado solo reconoce depreciación", () => {
    const s = noRot(createCompany("manufactura_emergente", "inv"));
    const before = s.cash;
    apply(s, { type: "add_asset", id: "prensa4", siteId: "planta", label: "Prensa de 200 t", resource: "prensa", units: 1, cost: 1800000, years: 10, leadDays: 45 });
    expect(before - s.cash).toBe(pesos(1800000));
    const later = advance(s, 90);
    const dep = later.ledger.filter((e) => e.type === "devengo" && e.account === "depreciacion");
    expect(dep.reduce((a, e) => a + e.amount, 0)).toBe(-Math.round(pesos(1800000) / 120) * dep.length);
    expect(later.ledger.some((e) => e.type === "devengo" && e.account === "inversion")).toBe(false);
  });

  it("el aguinaldo se reconoce cada mes como gasto y se paga una vez en diciembre", () => {
    const s = advance(noRot(createCompany("restaurante_emergente", "ag")), 360);
    const pays = s.ledger.filter((e) => e.type === "caja" && e.account === "aguinaldo");
    expect(pays.length).toBe(1);
    expect(pays[0].month).toBe(9); // llegada en marzo: diciembre es el mes 10
    expect(s.months.every((m) => m.provision > 0)).toBe(true);
  });

  it("las ventas a crédito suben ingresos antes que caja (manufactura cobra a 45 días)", () => {
    const s = noRot(createCompany("manufactura_emergente", "cr"));
    apply(s, { type: "add_contract", id: "nuevo", client: "Sistemas de Frenado", unitsPerDay: 400, price: 11, startInDays: 0 });
    const later = advance(s, 60);
    const m = later.months[0];
    expect(m.receivables).toBeGreaterThan(m.revenue);
  });
});

describe("realismo operativo", () => {
  it("contratar no genera ventas instantáneas: la persona llega después y empieza con productividad parcial", () => {
    const base = noRot(createCompany("restaurante_emergente", "r"));
    const hired = noRot(createCompany("restaurante_emergente", "r"));
    apply(hired, { type: "hire", id: "h1", roleId: "cocinero", siteId: "centro" });
    const a = advance(base, 10), b = advance(hired, 10);
    expect(b.ledger.filter((e) => e.account === "ventas").reduce((x, e) => x + e.amount, 0)).toBe(a.ledger.filter((e) => e.account === "ventas").reduce((x, e) => x + e.amount, 0));
    const c = advance(hired, 13);
    const p = c.people.find((x) => x.ref === "h1")!;
    expect(p.startDay).toBe(12);
  });

  it("más capacidad no vende más allá de la demanda, y el cuello de botella se mueve a servicio o mesas", () => {
    let s = noRot(createCompany("restaurante_emergente", "cap"));
    expect(capacityNow(s)[0].bottleneck).toBe("cocina");
    for (let i = 0; i < 3; i++) apply(s, { type: "hire", id: `c${i}`, roleId: "cocinero", siteId: "centro" });
    s = advance(s, 120);
    const k = capacityNow(s)[0];
    expect(k.bottleneck).not.toBe("cocina");
    expect(k.cap.cocina).toBeGreaterThan(k.perDay);
    const m = s.months.at(-1)!;
    expect(m.served).toBeLessThanOrEqual(m.demand);
    expect(m.served).toBeLessThanOrEqual(m.capacity);
  });

  it("contratar un cocinero: la nómina sube antes que las ventas; el mes de llegada empeora el resultado", () => {
    const base = advance(noRot(createCompany("restaurante_emergente", "c")), 60);
    const s = noRot(createCompany("restaurante_emergente", "c"));
    apply(s, { type: "hire", id: "h1", roleId: "cocinero", siteId: "centro" });
    const h = advance(s, 60);
    expect(h.months[0].payroll).toBeGreaterThan(base.months[0].payroll);
    expect(h.months[0].revenue - base.months[0].revenue).toBeLessThan(h.months[0].payroll + h.months[0].hiring - base.months[0].payroll);
    // A partir del segundo mes sí atiende más pedidos (había venta perdida en horas pico).
    expect(h.months[1].served).toBeGreaterThan(base.months[1].served);
  });

  it("una sucursal sin personal mínimo no abre ni produce", () => {
    const s = noRot(createCompany("restaurante_emergente", "suc"));
    apply(s, { type: "open_site", id: "sur", name: "Sucursal Sur", rent: 50000, utilities: 30000, deposit: 100000, capex: 1200000, years: 8, buildDays: 45, assets: { mesas: 12 }, demandBase: 90, maturityDays: 180, preopening: 80000 });
    const later = advance(s, 120);
    const sur = later.sites.find((x) => x.ref === "sur")!;
    expect(sur.status).toBe("preapertura");
    expect(later.events.some((e) => e.kind === "sin_personal" && e.siteId === sur.id)).toBe(true);
    // Pero la renta sí corre desde la firma.
    expect(later.ledger.filter((e) => e.type === "caja" && e.account === "renta" && e.ref === sur.id).length).toBe(4);
  });

  it("una sucursal con equipo abre, tarda en madurar y puede presionar la caja antes de vender", () => {
    const s = noRot(createCompany("restaurante_emergente", "sur2"));
    const sid = () => s.sites.find((x) => x.ref === "sur")!.id;
    apply(s, { type: "open_site", id: "sur", name: "Sucursal Sur", rent: 50000, utilities: 30000, deposit: 100000, capex: 250000, years: 8, buildDays: 45, assets: { mesas: 12 }, demandBase: 90, maturityDays: 180, preopening: 60000, demandFactor: 0.9 });
    for (const [i, r] of ["gerente_sucursal", "cocinero", "cocinero", "cocinero", "mesero", "mesero", "mesero", "lavaloza"].entries()) apply(s, { type: "hire", id: `s${i}`, roleId: r, siteId: sid() });
    const later = advance(s, 240);
    const sur = later.sites.find((x) => x.ref === "sur")!;
    expect(sur.status).toBe("operando");
    expect(sur.openedDay!).toBeGreaterThanOrEqual(45);
    const minCash = Math.min(...later.months.map((m) => m.cashEnd));
    expect(minCash).toBeLessThan(createCompany("restaurante_emergente").cash);
    expect(later.months.at(-1)!.sites).toBe(2);
  });

  it("manufactura: sin supervisor el segundo turno no arranca; con supervisor sí aumenta la capacidad", () => {
    const s = noRot(createCompany("manufactura_emergente", "t"));
    apply(s, { type: "set_shifts", id: "t2", siteId: "planta", shifts: 2 });
    const a = advance(s, 30);
    expect(capacityNow(a)[0].cap.prensa).toBe(3 * 1800);
    apply(a, { type: "hire", id: "sup2", roleId: "supervisor_produccion", siteId: "planta" });
    const b = advance(a, 40);
    expect(capacityNow(b)[0].cap.prensa).toBe(2 * 3 * 1800);
  });

  it("manufactura: operadores nuevos generan más desperdicio mientras aprenden", () => {
    const s = noRot(createCompany("manufactura_emergente", "sc"));
    apply(s, { type: "add_contract", id: "big", client: "Armadora del Bajío", unitsPerDay: 2500, price: 9.5, startInDays: 20 });
    apply(s, { type: "set_shifts", id: "t2", siteId: "planta", shifts: 2 });
    apply(s, { type: "hire", id: "sup", roleId: "supervisor_produccion", siteId: "planta" });
    for (let i = 0; i < 5; i++) apply(s, { type: "hire", id: `op${i}`, roleId: "operador", siteId: "planta" });
    const later = advance(s, 120);
    const [m2, m4] = [later.months[1], later.months[3]];
    expect(m2.scrap / Math.max(1, m2.served)).toBeGreaterThan(m4.scrap / Math.max(1, m4.served));
  });

  it("un director de operaciones no se contrata en un taller de 15 personas", () => {
    const s = createCompany("manufactura_emergente");
    expect(headcount(s)).toBeLessThan(20);
    expect(apply(s, { type: "hire", id: "coo", roleId: "director_operaciones", siteId: null }).ok).toBe(false);
    expect(apply(s, { type: "hire", id: "x", roleId: "cocinero", siteId: "planta" }).ok).toBe(false);
  });

  it("despedir tiene costo de salida y deja rastro en la historia", () => {
    const s = noRot(createCompany("restaurante_emergente", "d"));
    const p = peopleByRole(s, "mesero")[0];
    const c = s.cash;
    apply(s, { type: "terminate", id: "baja1", personId: p.id });
    expect(s.cash).toBeLessThan(c);
    expect(s.events.some((e) => e.kind === "baja" && e.personId === p.id)).toBe(true);
    expect(activePeople(s).some((x) => x.id === p.id)).toBe(false);
  });

  it("no crecer es viable: la empresa de llegada sin decisiones no quiebra en un año", () => {
    for (const tpl of ["restaurante_emergente", "manufactura_emergente"]) for (const seed of ["a", "b", "c"]) {
      const s = advance(createCompany(tpl, seed), 360);
      expect(Math.min(...s.months.map((m) => m.cashEnd))).toBeGreaterThan(0);
      expect(s.months.slice(-3).reduce((a, m) => a + m.operating, 0)).toBeGreaterThan(0);
    }
  }, 60_000);
});
