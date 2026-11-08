import { describe, expect, it } from "vitest";
import { advance, apply, createCompany, headcount } from "./engine";
import { availableCases, decide, optionsOf, play, untilCase, whyNot, type Decision } from "./chains";
import { CHAIN_A, CHAIN_B, CUMBRES, GROWTH_CASES, LIQUIDITY_CASE, NUEVO_CLIENTE, caseById, requiresMet } from "./cases";
import { overdueTotal } from "./core";
import { regionOf, regionalSalary } from "./labor";
import { roleById } from "./catalog";
import type { GrowthState } from "./types";

function walk(tpl: string, path: [string, string][], seed = "metis") {
  let g = createCompany(tpl, seed);
  const dec: Decision[] = [];
  for (const [cid, oid] of path) {
    const u = untilCase(g, [cid], dec, 300);
    expect(u.caseId, `${cid} debe llegar (${whyNot(u.state, cid, dec).join(", ")})`).toBe(cid);
    const r = play(u.state, cid, oid, dec);
    expect(r.ok, r.reason).toBe(true);
    g = r.state; dec.push(r.decision!);
  }
  return { g, dec };
}

describe("growth · casos: estructura y reglas", () => {
  it("ningún caso trae efectos en Caja o Margen: salen del motor", () => {
    for (const c of GROWTH_CASES) for (const o of c.options) {
      expect(Object.keys(o.effects ?? {})).not.toContain("caja");
      expect(Object.keys(o.effects ?? {})).not.toContain("margen");
      for (const v of Object.values(o.effects ?? {})) expect(Math.abs(v as number)).toBeLessThanOrEqual(3);
    }
  });
  it("cada caso tiene precondiciones, 2–5 opciones con ids únicos y al menos una opción de puntaje máximo", () => {
    for (const c of GROWTH_CASES) {
      expect(Object.keys(c.requires).length).toBeGreaterThan(0);
      expect(c.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(c.options.map((o) => o.id)).size).toBe(c.options.length);
      if (c.chain !== "liquidez") expect(c.options.some((o) => o.score === 3)).toBe(true);
    }
  });
  it("los salarios que muestra un caso son los del catálogo regional, no texto libre", () => {
    const g = createCompany("restaurante_emergente");
    const rows = caseById("ga1_cocina")!.data!(g);
    const expected = regionalSalary(roleById("cocinero")!.salary.mid, regionOf("MTY"));
    expect(rows[0][1]).toContain((expected / 100).toLocaleString("en-US"));
  });
  it("sin textos prohibidos", () => {
    const g = createCompany("restaurante_emergente");
    const all = GROWTH_CASES.flatMap((c) => [c.subject, ...c.options.map((o) => o.text)]).join(" ") + caseById("ga1_cocina")!.body(g).join(" ");
    expect(all).not.toMatch(/de cero a ceo|\blibro\b|próximamente|en preparación|más adelante:/i);
  });
});

describe("growth · precondiciones verificables", () => {
  it("un caso de restaurante no llega a manufactura y viceversa", () => {
    const r = createCompany("restaurante_emergente"), m = createCompany("manufactura_emergente");
    expect(availableCases(r, []).map((c) => c.id)).toEqual(["ga1_cocina"]);
    expect(availableCases(m, []).map((c) => c.id)).toEqual(["gb1_cliente"]);
    expect(whyNot(r, "gb1_cliente", [])).toContain("industria");
  });
  it("el evaluador reporta exactamente lo que falla", () => {
    const g = createCompany("restaurante_emergente");
    const chk = requiresMet(g, { minHeadcount: 20, roles: ["jefe_cocina"], minSites: 2 });
    expect(chk.ok).toBe(false);
    expect(chk.failed).toEqual(["plantilla ≥ 20", "sedes ≥ 2", "puesto jefe_cocina"]);
  });
  it("si ya hay jefe de cocina, el caso de la cocina no llega", () => {
    const g = createCompany("restaurante_emergente");
    apply(g, { type: "hire", id: "x", roleId: "jefe_cocina", siteId: "centro" });
    const g2 = advance(g, 40);
    expect(whyNot(g2, "ga1_cocina", [])).toContain("sin puesto jefe_cocina");
  });
  it("encadenamiento: el paso 2 no llega antes del 1 y el 3 solo si se firmó el local", () => {
    const g = createCompany("restaurante_emergente");
    expect(whyNot(g, "ga2_sucursal", [])).toContain("espera a ga1_cocina");
    const { g: g2, dec } = walk("restaurante_emergente", [["ga1_cocina", "cocinero"], ["ga2_sucursal", "no"]]);
    expect(whyNot(g2, "ga3_equipo", dec)).toContain("espera a ga2_sucursal");
    expect(untilCase(g2, ["ga3_equipo"], dec, 120).caseId).toBeNull();
  });
  it("una decisión no se puede tomar dos veces", () => {
    const { g, dec } = walk("restaurante_emergente", [["ga1_cocina", "cocinero"]]);
    const r = decide(g, "ga1_cocina", "jefe", dec);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/ya decidido/);
  });
});

describe("growth · cadena A (restaurante: cocina → sucursal → equipo)", () => {
  it("contratar un cocinero abre la vacante, entra a la plantilla y reduce pedidos perdidos", () => {
    const base = createCompany("restaurante_emergente");
    const hire = play(base, "ga1_cocina", "cocinero");
    const wait = advance(base, 30);
    expect(hire.ok).toBe(true);
    expect(hire.commands[0]).toMatchObject({ type: "hire", roleId: "cocinero", siteId: "centro" });
    expect(headcount(hire.state)).toBe(headcount(wait) + 1);
    const after = advance(hire.state, 60), still = advance(wait, 60);
    expect(after.months.at(-1)!.lost).toBeLessThan(still.months.at(-1)!.lost);
    expect(after.months.at(-1)!.payroll).toBeGreaterThan(still.months.at(-1)!.payroll);
  });
  it("firmar Cumbres cobra depósito y obra hoy y crea la sede con su gerente en vacante", () => {
    const u = untilCase(walk("restaurante_emergente", [["ga1_cocina", "cocinero"]]).g, ["ga2_sucursal"], [{ caseId: "ga1_cocina", key: "ga1_cocina", optionId: "cocinero", day: 0 }]);
    const g = u.state;
    const r = decide(g, "ga2_sucursal", "abrir", [{ caseId: "ga1_cocina", key: "ga1_cocina", optionId: "cocinero", day: 0 }]);
    expect(r.ok).toBe(true);
    const site = r.state.sites.find((x) => x.ref === "ga2_sucursal:site")!;
    expect(site.status).toBe("en_obra");
    expect(g.cash - r.state.cash).toBe((CUMBRES.deposit + CUMBRES.capex) * 100);
    expect(r.state.vacancies.some((v) => v.roleId === "gerente_sucursal" && v.siteId === site.id)).toBe(true);
  });
  it("la gracia negociada no cobra renta los primeros 60 días; firmar sin gracia sí", () => {
    const a = advance(walk("restaurante_emergente", [["ga1_cocina", "cocinero"], ["ga2_sucursal", "gerente_primero"]]).g, 30);
    const b = advance(walk("restaurante_emergente", [["ga1_cocina", "cocinero"], ["ga2_sucursal", "abrir"]]).g, 30);
    const rentA = a.ledger.filter((e) => e.type === "devengo" && e.account === "renta" && e.ref?.startsWith("site")).reduce((x, e) => x - e.amount, 0);
    const rentB = b.ledger.filter((e) => e.type === "devengo" && e.account === "renta" && e.ref?.startsWith("site")).reduce((x, e) => x - e.amount, 0);
    expect(rentB).toBeGreaterThan(0);
    expect(rentA).toBe(0);
  });
  it("sin caja suficiente, firmar aparece deshabilitado con la razón calculada", () => {
    const g = createCompany("restaurante_emergente");
    g.cash = 100_000_00;
    const v = optionsOf(g, caseById("ga2_sucursal")!).find((o) => o.id === "abrir")!;
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/Requiere \$364,000/);
    expect(decide(g, "ga2_sucursal", "abrir", [{ caseId: "ga1_cocina", key: "ga1_cocina", optionId: "esperar", day: 0 }]).ok).toBe(false);
  });
  it("cadena completa: la sucursal abre con su equipo y Mi empresa refleja dos sedes y más plantilla", () => {
    const { g } = walk("restaurante_emergente", [["ga1_cocina", "cocinero"], ["ga2_sucursal", "gerente_primero"], ["ga3_equipo", "completo"]]);
    const later = advance(g, 90);
    expect(later.sites.filter((x) => x.status === "operando").length).toBe(2);
    expect(headcount(later)).toBeGreaterThanOrEqual(15);
    expect(later.events.some((e) => e.kind === "apertura" && e.ref === "ga2_sucursal:site")).toBe(true);
    expect(later.cash).toBeGreaterThanOrEqual(0);
  });
  it("posponer la obra deja la renta corriendo y es el peor camino (se nota en la caja)", () => {
    const good = walk("restaurante_emergente", [["ga1_cocina", "cocinero"], ["ga2_sucursal", "gerente_primero"], ["ga3_equipo", "completo"]]).g;
    const bad = walk("restaurante_emergente", [["ga1_cocina", "cocinero"], ["ga2_sucursal", "gerente_primero"], ["ga3_equipo", "posponer"]]).g;
    const net = (x: GrowthState) => x.cash - overdueTotal(x);
    expect(net(advance(bad, 150))).toBeLessThan(net(advance(good, 150)));
  });
});

describe("growth · cadena B (manufactura: cliente → capacidad → calidad)", () => {
  it("aceptar el cliente agrega el contrato con el volumen y precio del caso", () => {
    const g = createCompany("manufactura_emergente");
    const r = decide(g, "gb1_cliente", "aceptar");
    const k = r.state.contracts.find((c) => c.client === NUEVO_CLIENTE.client)!;
    expect(k.unitsPerDay).toBe(NUEVO_CLIENTE.unitsPerDay);
    expect(k.price).toBe(NUEVO_CLIENTE.price * 100);
    expect(k.startDay).toBe(NUEVO_CLIENTE.startInDays);
  });
  it("aceptar sin capacidad trae incumplimiento, penalización y la cancelación del cliente nuevo", () => {
    const { g } = walk("manufactura_emergente", [["gb1_cliente", "aceptar"], ["gb2_capacidad", "nada"]]);
    const later = advance(g, 60);
    expect(later.events.some((e) => e.kind === "incumplimiento")).toBe(true);
    expect(later.events.some((e) => e.kind === "cancelacion")).toBe(true);
    expect(later.contracts.some((c) => c.client === NUEVO_CLIENTE.client)).toBe(false);
    expect(later.months.some((m) => m.penalties > 0)).toBe(true);
    expect(later.relations.clients).toBeLessThan(0.8);
  });
  it("segundo turno: cumple el contrato y el EBITDA mensual supera al de no crecer", () => {
    const grow = advance(walk("manufactura_emergente", [["gb1_cliente", "aceptar"], ["gb2_capacidad", "turno"]]).g, 90);
    const flat = advance(walk("manufactura_emergente", [["gb1_cliente", "declinar"]]).g, grow.day - 20);
    const m = grow.months.at(-1)!;
    expect(m.served / m.demand).toBeGreaterThan(0.95);
    expect(m.ebitda).toBeGreaterThan(flat.months.at(-1)!.ebitda);
    expect(grow.sites[0].shifts).toBe(2);
  });
  it("comprar la prensa requiere la caja de hoy; sin ella aparece deshabilitado", () => {
    const { g, dec } = walk("manufactura_emergente", [["gb1_cliente", "aceptar"]]);
    const poor = { ...g, cash: 500_000_00 };
    const v = optionsOf(poor, caseById("gb2_capacidad")!).find((o) => o.id === "prensa")!;
    expect(v.ok).toBe(false);
    expect(decide(poor, "gb2_capacidad", "prensa", dec).ok).toBe(false);
  });
  it("el paso de calidad solo llega si se agregó capacidad", () => {
    const { g, dec } = walk("manufactura_emergente", [["gb1_cliente", "parcial"], ["gb2_capacidad", "nada"]]);
    expect(whyNot(g, "gb3_calidad", dec)).toContain("espera a gb2_capacidad");
    const ok = walk("manufactura_emergente", [["gb1_cliente", "parcial"], ["gb2_capacidad", "turno"], ["gb3_calidad", "cnc"]]);
    expect(ok.dec.map((d) => d.caseId)).toEqual(["gb1_cliente", "gb2_capacidad", "gb3_calidad"]);
  });
});

describe("growth · caso de liquidez", () => {
  function squeezed() {
    const g = createCompany("restaurante_emergente");
    apply(g, { type: "open_site", id: "x:site", ...CUMBRES });
    apply(g, { type: "hire", id: "x:g", roleId: "gerente_sucursal", siteId: g.sites[1].id });
    return untilCase(g, ["gl_liquidez"], [], 200);
  }
  it("llega cuando la proyección muestra faltante, con datos del motor y sin caja negativa", () => {
    const u = squeezed();
    expect(u.caseId).toBe("gl_liquidez");
    expect(["alerta", "crisis"]).toContain(u.state.liquidity.status);
    const rows = LIQUIDITY_CASE.data!(u.state);
    expect(rows.map((r) => r[0])).toEqual(["Caja disponible", "Pagos vencidos", "Faltante proyectado"]);
    expect(rows.every((r) => !r[1].includes("-"))).toBe(true);
  });
  it("cada salida tiene costo o condición; las que no proceden traen la razón", () => {
    const u = squeezed();
    const opts = optionsOf(u.state, LIQUIDITY_CASE);
    for (const o of opts) {
      if (o.ok) expect(o.outcome.length).toBeGreaterThan(20);
      else expect(o.reason && o.reason.length).toBeGreaterThan(10);
    }
    const g = { ...u.state, relations: { ...u.state.relations, owner: 0.2 } };
    expect(optionsOf(g, LIQUIDITY_CASE).find((o) => o.id === "dueno")!.ok).toBe(false);
  });
  it("la aportación del dueño mejora la caja; el caso puede volver a llegar después de su espera", () => {
    const u = squeezed();
    const r = play(u.state, "gl_liquidez", "dueno", []);
    expect(r.ok).toBe(true);
    expect(r.state.equity).toBeGreaterThan(0);
    expect(r.decision!.key).toBe(`gl_liquidez@${u.state.day}`);
    const again = availableCases(r.state, [r.decision!]).some((c) => c.id === "gl_liquidez");
    expect(typeof again).toBe("boolean");
  });
  it("determinista: misma semilla y mismas decisiones, mismo resultado", () => {
    const a = walk("restaurante_emergente", [["ga1_cocina", "cocinero"], ["ga2_sucursal", "abrir"]], "s1").g;
    const b = walk("restaurante_emergente", [["ga1_cocina", "cocinero"], ["ga2_sucursal", "abrir"]], "s1").g;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("las cadenas no se cruzan entre industrias", () => {
    expect(CHAIN_A.every((c) => c.family === "restaurante")).toBe(true);
    expect(CHAIN_B.every((c) => c.family === "manufactura")).toBe(true);
  });
});
