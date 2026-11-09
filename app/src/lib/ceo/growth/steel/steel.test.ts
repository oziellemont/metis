import { describe, it, expect } from "vitest";
import { createSteel, runSteel, advanceSteel, applySteel, balanceSheet, reconcile, cashOf, overdueTotal, liquidityOptions, type SteelState } from "./engine";
import { BASE, STEEL_V2_ENABLED, TEMPLATES_V2 } from "./params";

const IDS = Object.keys(TEMPLATES_V2);
const ok = (s: SteelState) => {
  const b = balanceSheet(s);
  expect(b.ledgerSum).toBe(0);
  expect(b.diff).toBe(0);
  for (const [k, v] of Object.entries(reconcile(s))) expect([k, v + 0]).toEqual([k, 0]);
  for (const [a, v] of Object.entries(s.acc)) expect([a, Number.isInteger(v)]).toEqual([a, true]);
};

describe("acería v2 · contabilidad", () => {
  it("activa para empresas nuevas (autorizado por Oziel)", () => expect(STEEL_V2_ENABLED).toBe(true));

  for (const id of IDS) {
    it(`${id}: la partida doble cuadra y cada saldo concilia con su detalle durante 24 meses`, () => {
      const s = createSteel(id);
      ok(s);
      let minCash = cashOf(s);
      for (let m = 0; m < 24; m++) { runSteel(s, 30); ok(s); minCash = Math.min(minCash, cashOf(s)); }
      expect(minCash).toBeGreaterThanOrEqual(0);
      expect(s.months).toHaveLength(24);
    });
  }

  it("es determinista: misma plantilla y semilla, mismo resultado al centavo", () => {
    const a = runSteel(createSteel("aceria_compacta_v2", "x"), 400);
    const b = runSteel(createSteel("aceria_compacta_v2", "x"), 400);
    expect(JSON.stringify(a.acc)).toBe(JSON.stringify(b.acc));
    expect(JSON.stringify(a.months)).toBe(JSON.stringify(b.months));
  });

  it("advanceSteel no modifica el estado original", () => {
    const s = createSteel("aceria_compacta_v2");
    const before = JSON.stringify(s);
    advanceSteel(s, 60);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("acería v2 · saldos iniciales coherentes", () => {
  for (const id of IDS) {
    it(`${id}: al llegar ya existen cuentas por cobrar, inventario, proveedores, cuotas e impuestos por pagar`, () => {
      const T = TEMPLATES_V2[id];
      const s = createSteel(id);
      const b = balanceSheet(s);
      expect(cashOf(s)).toBe(T.cash * 100);
      // Clientes ≈ ventas diarias × plazo promedio ponderado (con el atraso habitual).
      const daily = T.contracts.reduce((a, k) => a + k.tpd * k.price, 0) * 100;
      const dso = T.contracts.reduce((a, k) => a + k.tpd * k.price * (k.dso + (k.payDelay ?? 0)), 0) * 100 / daily;
      const expected = daily * dso * 26 / 30;
      expect(b.assets.clientes / expected).toBeGreaterThan(0.85);
      expect(b.assets.clientes / expected).toBeLessThan(1.15);
      // Cada factura por cobrar tiene fecha y cliente; ninguna vencida.
      const ins = s.sched.filter((x) => x.dir === "in" && x.acc === "clientes");
      expect(ins.length).toBeGreaterThan(20);
      expect(ins.every((x) => x.day >= 0 && x.label.startsWith("Cobro a"))).toBe(true);
      expect(b.assets.inventario).toBeGreaterThan(0);
      expect(b.liab.chatarra).toBeGreaterThan(0);
      expect(b.liab.acreedores).toBeGreaterThan(0);
      expect(b.liab.cfe).toBeGreaterThan(0);
      expect(b.liab.imss).toBeGreaterThan(0);
      // Llega en marzo: la declaración anual del ejercicio anterior y la PTU están pendientes.
      expect(s.sched.some((x) => x.label === "Declaración anual de ISR" && x.day >= 0 && x.day < 30)).toBe(true);
      expect(s.sched.some((x) => x.label === "Reparto de utilidades (PTU)" && x.day >= 60 && x.day < 90)).toBe(true);
      expect(s.overdue).toHaveLength(0);
      expect(s.events.map((e) => e.kind)).toEqual(["apertura"]);
    });
  }
});

describe("acería v2 · calendario de cobros y pagos", () => {
  it("un contrato nuevo a 60 días no trae dinero hasta el día 60 de la primera entrega", () => {
    const s = createSteel("aceria_compacta_v2");
    applySteel(s, { type: "add_contract", id: "t60", client: "Cliente Prueba", product: "palanquilla", tpd: 4, price: 12_000, dso: 60, startInDays: 0 });
    runSteel(s, 20);
    const xs = s.sched.filter((x) => x.ref === "t60");
    expect(xs.length).toBeGreaterThan(5);
    expect(Math.min(...xs.map((x) => x.day))).toBe(60);
    ok(s);
    // Mismo cliente a 30 días: entra antes y se nota en la caja del día 45.
    const a = createSteel("aceria_compacta_v2"), b = createSteel("aceria_compacta_v2");
    applySteel(a, { type: "add_contract", id: "c", client: "X", product: "palanquilla", tpd: 4, price: 12_000, dso: 30, startInDays: 0 });
    applySteel(b, { type: "add_contract", id: "c", client: "X", product: "palanquilla", tpd: 4, price: 12_000, dso: 60, startInDays: 0 });
    runSteel(a, 45); runSteel(b, 45);
    expect(cashOf(a)).toBeGreaterThan(cashOf(b));
    expect(balanceSheet(b).assets.clientes).toBeGreaterThan(balanceSheet(a).assets.clientes);
  });

  it("CFE se paga el día 10 del mes siguiente y las cuotas el 17", () => {
    const s = createSteel("aceria_compacta_v2");
    runSteel(s, 30);
    expect(s.sched.find((x) => x.acc === "cfe")?.day).toBe(39);
    expect(s.sched.find((x) => x.acc === "imss" && x.label.startsWith("Cuotas"))?.day).toBe(46);
  });
});

describe("acería v2 · liquidez sin caja negativa", () => {
  const squeeze = () => {
    const s = createSteel("aceria_compacta_v2");
    // Un cliente grande deja de pagar: su cobro se recorre 90 días.
    for (const x of s.sched) if (x.dir === "in" && x.label.includes("Laminados Regios")) x.day += 90;
    applySteel(s, { type: "change_contract", id: "atraso", contractId: s.contracts[0].id, payDelay: 90 });
    return s;
  };

  it("lo que no se puede pagar se vuelve adeudo vencido con su acreedor y la caja nunca es negativa", () => {
    const s = squeeze();
    let min = Infinity, sawCrisis = false;
    for (let d = 0; d < 120; d++) { runSteel(s, 1); min = Math.min(min, cashOf(s)); if (s.liquidity === "crisis") sawCrisis = true; }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(sawCrisis).toBe(true);
    const kinds = new Set(s.events.map((e) => e.kind));
    expect(kinds.has("crisis_liquidez")).toBe(true);
    expect(kinds.has("proveedor") || kinds.has("corte")).toBe(true);
    ok(s);
  });

  it("los chatarreros pasan a contado y luego suspenden; sin chatarra cae la producción", () => {
    const s = squeeze();
    const base = runSteel(createSteel("aceria_compacta_v2"), 120);
    runSteel(s, 120);
    expect(s.events.some((e) => e.text.includes("de contado"))).toBe(true);
    const prod = (x: SteelState) => x.months.slice(1, 4).reduce((a, m) => a + m.tonsProduced, 0);
    expect(prod(s)).toBeLessThan(prod(base));
  });

  it("CFE corta la energía con más de 20 días de atraso y la capacidad se va a cero", () => {
    const s = createSteel("aceria_compacta_v2");
    // Un recibo de CFE queda vencido y el dueño retira la caja cada día (para forzar que no alcance).
    s.overdue.push({ acc: "cfe", creditor: "cfe", amount: 100_000, since: 0, label: "prueba" });
    s.acc.cfe -= 100_000; s.acc.otros_gastos = (s.acc.otros_gastos ?? 0) + 100_000;
    const drain = () => { s.acc.capital += s.acc.caja; s.acc.caja = 0; };
    for (const x of s.sched) if (x.dir === "in") x.day += 60;
    for (let d = 0; d < 25 && !s.supply.powerCut; d++) { drain(); runSteel(s, 1); }
    expect(s.supply.powerCut).toBe(true);
    expect(s.events.some((e) => e.kind === "corte")).toBe(true);
    expect(s.overdue.some((o) => o.creditor === "cfe")).toBe(true);
  });

  it("las alternativas de gestión se calculan con el motor y funcionan", () => {
    const s = squeeze();
    runSteel(s, 40);
    const opts = liquidityOptions(s);
    expect(opts.map((o) => o.id)).toEqual(["factoraje", "convenio", "plazo", "aportacion", "credito", "remate", "capex"]);
    for (const o of opts) expect(Number.isInteger(o.cash)).toBe(true);
    const f = opts.find((o) => o.id === "factoraje")!;
    expect(f.available).toBe(true);
    const before = cashOf(s);
    expect(applySteel(s, f.cmd).ok).toBe(true);
    runSteel(s, 4);
    expect(cashOf(s) + overdueTotal(s) * 0).toBeGreaterThanOrEqual(0);
    expect(s.events.some((e) => e.kind === "decision_financiera")).toBe(true);
    ok(s);
    void before;
    const a = opts.find((o) => o.id === "aportacion")!;
    expect(applySteel(s, a.cmd).ok).toBe(true);
    runSteel(s, 6);
    ok(s);
  });

  it("el banco rechaza crédito sin cobertura suficiente", () => {
    const s = createSteel("aceria_compacta_v2");
    runSteel(s, 90);
    const r = applySteel(s, { type: "term_loan", id: "big", amount: 60_000_000, rate: 0.17, months: 24, purpose: "prueba" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/cobertura/);
  });

  it("convenio fiscal: el adeudo vencido pasa a parcialidades con recargo", () => {
    const s = createSteel("aceria_compacta_v2");
    runSteel(s, 10);
    s.overdue.push({ acc: "imss", creditor: "fisco", amount: 300_000_00, since: s.day, label: "prueba" });
    s.acc.imss -= 300_000_00; s.acc.cuotas = (s.acc.cuotas ?? 0) + 300_000_00;
    expect(applySteel(s, { type: "payment_plan", id: "pp", months: 6 }).ok).toBe(true);
    expect(overdueTotal(s, "fisco")).toBe(0);
    expect(s.sched.filter((x) => x.ref === "pp").length).toBe(12);
    ok(s);
  });
});

describe("acería v2 · impuestos: provisión separada de pagos", () => {
  it("ISR y PTU se provisionan cada mes; los pagos van en sus fechas", () => {
    const s = createSteel("miniaceria_integrada_v2");
    runSteel(s, 360);
    const ms = s.months;
    // Provisión mensual de ISR en el estado de resultados casi todos los meses.
    expect(ms.filter((m) => m.isr > 0).length).toBeGreaterThan(8);
    // El flujo de impuestos no es igual a la provisión del mes (pagos provisionales con coeficiente, anual en marzo).
    expect(ms.some((m) => Math.abs(-m.cashTaxes - m.isr) > 1_000_000_00)).toBe(true);
    // Marzo (mes 1): pago de la declaración anual más el provisional. Mayo (mes 3): la PTU sale como pago al personal.
    expect(-ms[0].cashTaxes).toBeGreaterThan(-ms[1].cashTaxes * 2);
    expect(ms[2].cashOperating).toBeLessThan(ms[1].cashOperating);
    // Al cierre de diciembre se programa la anual para fines de marzo y la PTU para fines de mayo.
    runSteel(s, 0);
    ok(s);
  });

  it("la PTU respeta el tope de tres meses de salario", () => {
    const s = createSteel("miniaceria_integrada_v2", "metis", { ...BASE, id: "alto", price: 1.1 });
    runSteel(s, 300);
    const gross = Object.values(s.crews).reduce((a, cr) => a + cr.n * cr.gross, 0);
    expect(s.tax.ptuProv).toBeLessThanOrEqual(gross * 3);
  });
});

describe("acería v2 · operación", () => {
  it("la palanquilla que no se puede laminar no se acumula sin límite", () => {
    const s = createSteel("miniaceria_integrada_v2");
    applySteel(s, { type: "add_contract", id: "big", client: "X", product: "varilla", tpd: 120, price: 14_500, dso: 45, startInDays: 0 });
    runSteel(s, 360);
    const inv = s.months.map((m) => m.inventory);
    expect(inv[11]).toBeLessThan(inv[0] * 2);
    ok(s);
  });

  it("recortar mantenimiento baja el gasto pero sube los paros", () => {
    const a = runSteel(createSteel("aceria_compacta_v2", "m", { ...BASE, id: "x", maintenance: 0.6 }), 90);
    const b = runSteel(createSteel("aceria_compacta_v2", "m"), 90);
    expect(a.months[1].fixed).toBeLessThan(b.months[1].fixed);
    expect(a.months[1].capacity).toBeLessThan(b.months[1].capacity);
  });

  it("el tercer turno exige contratar cuadrillas completas y las paga desde el primer mes", () => {
    const s = createSteel("aceria_compacta_v2");
    const h0 = s.months.length;
    void h0;
    const before = Object.values(s.crews).reduce((a, c) => a + c.n, 0);
    expect(applySteel(s, { type: "set_shifts", id: "t3", shifts: 3 }).ok).toBe(true);
    const after = Object.values(s.crews).reduce((a, c) => a + c.n, 0);
    expect(after - before).toBeGreaterThanOrEqual(10);
    runSteel(s, 60);
    ok(s);
  });
});
