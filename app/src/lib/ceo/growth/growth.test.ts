/**
 * Growth Engine · pruebas de aceptación de la adenda (§16.1 integridad y §16.2 realismo), fase 1.
 */
import { describe, expect, it } from "vitest";
import { activePeople, advance, apply, capacityNow, createCompany, headcount, peopleByRole } from "./engine";
import { ROLES_V1, roleById } from "./catalog";
import { burdenOf, laborOf, minWage, monthlyCost, pesos, REGIONS, regionOf, terminationOf, vacationDays } from "./labor";
import type { GrowthState } from "./types";

const noRot = (s: GrowthState) => { s.attrition = false; return s; };
const cashSum = (s: GrowthState) => s.ledger.filter((e) => e.type === "caja").reduce((a, e) => a + e.amount, 0);

describe("costo laboral", () => {
  it("ningún salario del catálogo queda debajo del mínimo 2026 y cada rol declara fuente y confianza", () => {
    const L = laborOf();
    for (const r of ROLES_V1) {
      expect(r.salary.min * 100).toBeGreaterThanOrEqual(pesos(minWage(L, REGIONS.MTY) * 30));
      expect(r.salary.min).toBeLessThanOrEqual(r.salary.mid);
      expect(r.salary.mid).toBeLessThanOrEqual(r.salary.max);
      expect(r.salarySource.length).toBeGreaterThan(20);
    }
    expect(L.minWageDaily.value.general).toBe(315.04);
    expect(L.minWageDaily.confidence).toBe("oficial");
  });

  it("un operador, un gerente y un ingeniero no cuestan lo mismo; la carga patronal es plausible (25–45 %)", () => {
    const costs = ["operador", "gerente_planta", "ingeniero_procesos"].map((id) => monthlyCost(pesos(roleById(id)!.salary.mid), REGIONS.MTY, laborOf()).total);
    expect(new Set(costs).size).toBe(3);
    for (const id of ["mesero", "cocinero", "gerente_sucursal", "operador", "director_operaciones"]) {
      const b = burdenOf(pesos(roleById(id)!.salary.mid), REGIONS.MTY);
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
    const o = { type: "open_site" as const, id: "sur", name: "Sucursal Sur", rent: 50000, utilities: 30000, deposit: 100000, capex: 250000, years: 8, buildDays: 60, assets: { mesas: 14 }, demandBase: 90, maturityDays: 180, preopening: 80000 };
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
    apply(s, { type: "add_asset", id: "prensa4", siteId: "planta", label: "Prensa de 200 t", resource: "prensa", units: 1, cost: 900000, years: 10, leadDays: 45 });
    expect(before - s.cash).toBe(pesos(900000));
    const later = advance(s, 90);
    const dep = later.ledger.filter((e) => e.type === "devengo" && e.account === "depreciacion");
    expect(dep.reduce((a, e) => a + e.amount, 0)).toBe(-Math.round(pesos(900000) / 120) * dep.length);
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
    apply(s, { type: "open_site", id: "sur", name: "Sucursal Sur", rent: 50000, utilities: 30000, deposit: 100000, capex: 250000, years: 8, buildDays: 45, assets: { mesas: 12 }, demandBase: 90, maturityDays: 180, preopening: 80000 });
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

describe("regiones y terminaciones (fase 2)", () => {
  it("el piloto es Monterrey; otra región cambia salarios y nómina estatal sin tocar el motor", () => {
    expect(REGIONS.MTY.enabled).toBe(true);
    expect(Object.values(REGIONS).filter((r) => r.enabled).map((r) => r.id)).toEqual(["MTY"]);
    const s = createCompany("restaurante_emergente", "r");
    expect(s.region).toBe("MTY");
    const gross = pesos(12500);
    const mty = monthlyCost(gross, REGIONS.MTY, laborOf());
    const cdmx = monthlyCost(gross, REGIONS.CDMX, laborOf());
    expect(cdmx.payrollTax).toBeGreaterThan(mty.payrollTax);
    expect(regionOf("XX").id).toBe("MTY");
  });

  it("la tabla de vacaciones sigue la reforma: 12, 14, 16, 18, 20 y luego +2 cada cinco años", () => {
    const L = laborOf();
    expect([0, 1, 2, 3, 4, 5, 9, 10, 15].map((y) => vacationDays(y, L))).toEqual([12, 14, 16, 18, 20, 22, 22, 24, 26]);
  });

  it("cada causa de terminación tiene su propio cálculo", () => {
    const L = laborOf(), r = REGIONS.MTY, gross = pesos(15000), prov = pesos(2000);
    const of = (k: Parameters<typeof terminationOf>[0], years = 3, refuse = false) => terminationOf(k, gross, years, prov, 4, L, r, refuse);
    const ren = of("renuncia"), just = of("despido_justificado"), unj = of("despido_injustificado"), unjR = of("despido_injustificado", 3, true), mut = of("mutuo_acuerdo"), prob = of("periodo_prueba", 0.05);
    // Renuncia con menos de 15 años: solo finiquito (proporcionales y vacaciones), sin prima de antigüedad.
    expect(ren.seniority).toBe(0); expect(ren.constitutional).toBe(0);
    expect(ren.total).toBe(prov + Math.round((gross / 30) * 4));
    // Rescisión justificada: prima de antigüedad, sin 90 días.
    expect(just.seniority).toBeGreaterThan(0); expect(just.constitutional).toBe(0);
    // Despido injustificado: 90 días + prima; los 20 días por año solo si el patrón se niega a reinstalar.
    expect(unj.constitutional).toBeGreaterThan(0); expect(unj.twentyDays).toBe(0);
    expect(unjR.twentyDays).toBeGreaterThan(0);
    // Mutuo acuerdo: gratificación negociada, menor que la liquidación de ley.
    expect(mut.gratification).toBeGreaterThan(0);
    expect(mut.total).toBeLessThan(unj.total);
    // Periodo de prueba: sin indemnización.
    expect(prob.constitutional + prob.seniority + prob.gratification).toBe(0);
    expect(new Set([ren.total, just.total, unj.total, unjR.total, mut.total]).size).toBe(5);
  });

  it("la prima de antigüedad respeta el tope de dos salarios mínimos", () => {
    const L = laborOf(), r = REGIONS.MTY;
    const high = terminationOf("despido_justificado", pesos(60000), 2, 0, 0, L, r);
    expect(high.seniority).toBe(Math.round(2 * minWage(L, r) * 100 * 12 * 2));
  });

  it("despedir sin causa cuesta más que una renuncia y la causa queda registrada", () => {
    const base = noRot(createCompany("restaurante_emergente", "t"));
    const a = advance(base, 10), b = advance(base, 10);
    const cook = peopleByRole(a, "cocinero")[0];
    apply(a, { type: "terminate", id: "t1", personId: cook.id, kind: "despido_injustificado" });
    apply(b, { type: "terminate", id: "t1", personId: cook.id, kind: "mutuo_acuerdo" });
    expect(a.cash).toBeLessThan(b.cash);
    expect(a.people.find((p) => p.id === cook.id)!.leftReason).toBe("despido_injustificado");
  });
});

describe("margen de arranque recalibrado", () => {
  it("Grupo Brasa tiene un margen operativo de restaurante (EBITDA 6–14 %) que sale de líneas explícitas", () => {
    const s = advance(noRot(createCompany("restaurante_emergente", "m")), 90);
    const m = s.months[1];
    const pct = m.ebitda / m.revenue;
    expect(pct).toBeGreaterThan(0.06);
    expect(pct).toBeLessThan(0.14);
    expect(m.coverage).toBeGreaterThan(0);
    expect(s.fixedLines.length).toBeGreaterThanOrEqual(6);
  });
});

describe("liquidez (fase 2)", () => {
  const branch = (s: GrowthState, id = "o1") => apply(s, { type: "open_site", id, name: "Sucursal Cumbres", rent: 55000, utilities: 24000, deposit: 110000, capex: 200000, years: 8, buildDays: 45, assets: { mesas: 14 }, demandBase: 95, maturityDays: 150, preopening: 60000 });

  it("la caja nunca es negativa: lo que no alcanza queda como adeudo vencido con su acreedor", () => {
    let s = createCompany("restaurante_emergente", "liq");
    branch(s);
    apply(s, { type: "hire", id: "h1", roleId: "gerente_sucursal", siteId: s.sites[1].id });
    s = advance(s, 360);
    for (const m of s.months) expect(m.cashEnd).toBeGreaterThanOrEqual(0);
    expect(s.cash).toBeGreaterThanOrEqual(0);
    expect(s.overdue.length).toBeGreaterThan(0);
    expect(s.months.at(-1)!.overdue).toBeGreaterThan(0);
    // Y el libro sigue cuadrando.
    for (const m of s.months) expect(m.cashEnd).toBe(m.cashBegin + m.inflows - m.outflows);
  }, 30_000);

  it("la proyección de 13 semanas avisa antes de que falte dinero (alerta antes que crisis)", () => {
    let s = createCompany("restaurante_emergente", "liq");
    branch(s);
    apply(s, { type: "hire", id: "h1", roleId: "gerente_sucursal", siteId: s.sites[1].id });
    s = advance(s, 240);
    const alert = s.events.find((e) => e.kind === "alerta_liquidez");
    const crisis = s.events.find((e) => e.kind === "crisis_liquidez");
    expect(alert).toBeTruthy();
    expect(crisis).toBeTruthy();
    expect(alert!.day).toBeLessThan(crisis!.day);
  }, 30_000);

  it("un atraso tiene consecuencias por acreedor: proveedores a contado, recargos del fisco, clima laboral", () => {
    let s = createCompany("restaurante_emergente", "liq");
    branch(s);
    apply(s, { type: "hire", id: "h1", roleId: "gerente_sucursal", siteId: s.sites[1].id });
    s = advance(s, 330);
    expect(s.events.some((e) => e.kind === "proveedor" && /contado/.test(e.text))).toBe(true);
    expect(s.relations.staff).toBeLessThan(0.8);
    expect(s.ledger.some((e) => e.account === "recargos" || e.account === "moratorios")).toBe(true);
  }, 30_000);

  it("no hay préstamo automático: sin decisión, la caja no recibe financiamiento", () => {
    let s = createCompany("restaurante_emergente", "liq");
    branch(s);
    s = advance(s, 200);
    expect(s.loans.length).toBe(0);
    expect(s.ledger.some((e) => e.account === "prestamo" || e.account === "aportacion")).toBe(false);
  }, 30_000);

  it("el banco revisa condiciones y puede decir que no; con historial y resultado positivo, presta con costo", () => {
    const fresh = createCompany("restaurante_emergente", "bank");
    const r1 = apply(fresh, { type: "bank_loan", id: "b1", amount: 300000, months: 12 });
    expect(r1.ok).toBe(false); expect(r1.refused).toBe(true);
    expect(fresh.events.some((e) => e.kind === "rechazo")).toBe(true);
    const s = advance(noRot(createCompany("restaurante_emergente", "bank")), 95);
    const ok = apply(s, { type: "bank_loan", id: "b2", amount: 200000, months: 12 });
    expect(ok.ok).toBe(true);
    const later = advance(s, 60);
    expect(later.loans[0].balance).toBeLessThan(later.loans[0].principal);
    expect(later.ledger.some((e) => e.account === "intereses")).toBe(true);
    expect(later.ledger.some((e) => e.account === "comisiones")).toBe(true);
  }, 30_000);

  it("pedir más de lo que permite la capacidad de pago se rechaza con la cifra que sí alcanza", () => {
    const s = advance(noRot(createCompany("restaurante_emergente", "bank")), 95);
    const r = apply(s, { type: "bank_loan", id: "b3", amount: 5_000_000, months: 12 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/capacidad de pago alcanza/);
  });

  it("negociar con proveedores recorre pagos y cuesta sobreprecio; el factoraje solo existe si hay cuentas por cobrar", () => {
    const s = advance(noRot(createCompany("restaurante_emergente", "prov")), 20);
    const before = s.scheduled.filter((x) => x.account === "proveedores").map((x) => x.day);
    const r = apply(s, { type: "negotiate_suppliers", id: "n1", extraDays: 15 });
    if (r.ok) {
      expect(s.scheduled.filter((x) => x.account === "proveedores").map((x) => x.day)).toEqual(before.map((d) => d + 15));
      expect(s.supplierTerms.priceUp).toBeGreaterThan(0);
    } else expect(r.refused).toBe(true);
    expect(apply(s, { type: "collect_receivables", id: "f1", mode: "factoraje" }).ok).toBe(false);
    const m = advance(noRot(createCompany("manufactura_emergente", "fac")), 20);
    const cashBefore = m.cash;
    expect(apply(m, { type: "collect_receivables", id: "f2", mode: "factoraje" }).ok).toBe(true);
    const m2 = advance(m, 4);
    expect(m2.cash).toBeGreaterThan(cashBefore);
    expect(m2.ledger.some((e) => e.account === "factoraje")).toBe(true);
  });

  it("aportación del dueño: llega días después, desgasta su confianza y tiene límite", () => {
    const s = createCompany("restaurante_emergente", "own2");
    const r = apply(s, { type: "owner_equity", id: "eq1", amount: 200000 });
    if (r.ok) {
      expect(s.relations.owner).toBeLessThan(0.8);
      expect(s.scheduled.some((x) => x.account === "aportacion")).toBe(true);
      const r2 = apply(s, { type: "owner_equity", id: "eq2", amount: 900000 });
      if (r2.ok) expect(s.equity).toBeLessThanOrEqual(500000 * 100);
    } else expect(r.refused).toBe(true);
  });

  it("recortar tiene efecto diferido; tu sueldo no se recorta como gasto", () => {
    const s = noRot(createCompany("restaurante_emergente", "cut"));
    expect(apply(s, { type: "cut_costs", id: "c0", lines: ["direccion"] }).ok).toBe(false);
    expect(apply(s, { type: "cut_costs", id: "c1", lines: ["marketing"] }).ok).toBe(true);
    const later = advance(s, 90);
    expect(later.sites[0].demandFactor).toBeLessThan(1);
  });

  it("posponer una sucursal en obra recorre sus pagos con penalidad; la renta sigue corriendo", () => {
    const s = noRot(createCompany("restaurante_emergente", "def"));
    branch(s);
    const site = s.sites[1];
    const pre = s.scheduled.find((x) => x.ref === "o1")!.day;
    expect(apply(s, { type: "defer_site", id: "d1", siteId: site.id, days: 60 }).ok).toBe(true);
    expect(s.scheduled.find((x) => x.ref === "o1" && x.account === "preapertura")!.day).toBe(pre + 60);
    const later = advance(s, 60);
    expect(later.ledger.some((e) => e.account === "renta" && e.ref === site.id)).toBe(true);
  });

  it("abrir sucursal exige tener el pago inicial en caja", () => {
    const s = createCompany("restaurante_emergente", "cap");
    s.cash = 100000_00;
    const r = apply(s, { type: "open_site", id: "x", name: "X", rent: 1, utilities: 1, deposit: 110000, capex: 200000, years: 8, buildDays: 30, assets: { mesas: 10 }, demandBase: 50, maturityDays: 90, preopening: 1 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/caja tiene/);
  });
});
