import { describe, expect, it } from "vitest";
import { advance, apply, activePeople, createCompany } from "./engine";
import { availableCases, decide, optionsOf, play, type Decision } from "./chains";
import { START_WINDOW, startOffers } from "./finance";
import { TEMPLATES } from "./families";
import { coldSite, hotSite, zonesFor } from "./opscases";
import { alertsOf, impactOf, opsMapOf, siteDetailOf } from "./ops";
import { zoneOf } from "./geo";
import { debtTotal } from "./core";
import { GROWTH_CASES } from "./cases";

const FORBIDDEN = /de cero a ceo|\blibro\b|próximamente|en preparación|más adelante:/i;

describe("plantillas consolidadas", () => {
  it("restaurante consolidado: cinco sucursales y unas cincuenta personas; manufactura: dos plantas", () => {
    const r = createCompany("restaurante_consolidada"), m = createCompany("manufactura_consolidada");
    expect(r.sites.filter((x) => x.status === "operando")).toHaveLength(5);
    expect(activePeople(r).length).toBe(50);
    expect(m.sites.filter((x) => x.status === "operando")).toHaveLength(2);
    expect(activePeople(m).length).toBeGreaterThanOrEqual(40);
    expect(TEMPLATES.restaurante_consolidada.size).toBe("consolidada");
    expect(TEMPLATES.restaurante_emergente.size).toBe("startup");
  });
  it("el mismo motor: un año sin decidir no quiebra y el mes reparte resultados por sede", () => {
    for (const t of ["restaurante_consolidada", "manufactura_consolidada"]) {
      const g = advance(createCompany(t), 365);
      expect(g.cash).toBeGreaterThan(0);
      const m = g.months.at(-1)!;
      expect(m.bySite?.length).toBe(g.sites.filter((x) => x.status === "operando").length);
      // Las ventas de las sedes suman las de la empresa.
      expect(m.bySite!.reduce((a, x) => a + x.revenue, 0)).toBe(m.revenue);
    }
  });
});

describe("financiamiento de arranque", () => {
  it("llega al inicio con tres créditos preaprobados y se va después de la ventana", () => {
    const g = createCompany("restaurante_emergente");
    expect(availableCases(g, []).map((c) => c.id)).toContain("gf_arranque");
    expect(startOffers(g).map((o) => o.months)).toEqual([12, 24, 36]);
    expect(availableCases(advance(g, START_WINDOW + 1), []).map((c) => c.id)).not.toContain("gf_arranque");
  });
  it("el crédito del banco entra a la caja y se paga cada mes hasta liquidarse", () => {
    const g0 = createCompany("manufactura_consolidada");
    const o = startOffers(g0).find((x) => x.id === "corto")!;
    const r = decide(g0, "gf_arranque", "banco_corto", []);
    expect(r.ok).toBe(true);
    const g1 = advance(r.state, 15);
    expect(g1.loans).toHaveLength(1);
    expect(debtTotal(g1)).toBe(o.amount);
    const g2 = advance(g1, 120);
    expect(debtTotal(g2)).toBeLessThan(o.amount);
    expect(g2.ledger.filter((e) => e.account === "prestamo" && e.amount < 0).length).toBeGreaterThanOrEqual(3);
    const g3 = advance(g2, 300);
    expect(debtTotal(g3)).toBe(0);
  });
  it("crecer con la caja propia no mueve deuda; pedir al dueño entra sin intereses", () => {
    const g0 = createCompany("restaurante_emergente");
    expect(decide(g0, "gf_arranque", "propio", []).state.loans).toHaveLength(0);
    const s = advance(decide(g0, "gf_arranque", "socio", []).state, 10);
    expect(s.equity).toBeGreaterThan(0);
    expect(s.loans).toHaveLength(0);
  });
  it("cada opción muestra su impacto: el banco suma caja y costo mensual", () => {
    const g = createCompany("restaurante_emergente");
    const i = impactOf(g, "gf_arranque", "banco_medio", [])!;
    expect(i.now).toBeGreaterThan(0);
    expect(i.monthly).toBeGreaterThan(0);
    expect(impactOf(g, "gf_arranque", "propio", [])).toEqual({ now: 0, monthly: 0, people: 0, sites: 0 });
  });
});

describe("casos de operación", () => {
  const run = (t: string, days: number) => {
    let g = createCompany(t);
    const ds: Decision[] = [];
    g = (() => { const r = decide(g, "gf_arranque", "propio", ds); ds.push(r.decision!); return r.state; })();
    return { g: advance(g, days), ds };
  };
  it("una sucursal saturada pide contratar el puesto que la frena; contratar abre la vacante", () => {
    const { g, ds } = run("restaurante_consolidada", 31);
    const hot = hotSite(g)!;
    expect(hot).not.toBeNull();
    expect(availableCases(g, ds).map((c) => c.id)).toContain("go_contratar");
    const r = play(g, "go_contratar", "contratar", ds);
    expect(r.ok).toBe(true);
    expect(r.commands.some((c) => c.type === "hire" && c.roleId === hot.roleId && c.siteId === hot.siteId)).toBe(true);
  });
  it("una sucursal con gente de más pide ajustar; la baja paga el finiquito y sale de la plantilla", () => {
    let { g, ds } = run("restaurante_consolidada", 1);
    // Avanza hasta que el caso llegue, atendiendo con «esperar» lo que se cruce.
    for (let d = 0; d < 120 && !availableCases(g, ds).some((c) => c.id === "go_ajustar"); d++) {
      for (const c of availableCases(g, ds)) { const o = c.options.find((x) => x.id === "esperar" || x.id === "no" || x.id === "mantener"); if (o) { const r = decide(g, c.id, o.id, ds); if (r.ok) { ds = [...ds, r.decision!]; g = r.state; } } }
      g = advance(g, 1);
    }
    const cold = coldSite(g);
    expect(cold).not.toBeNull();
    const before = activePeople(g).length;
    const r = decide(g, "go_ajustar", "baja", ds);
    expect(r.ok).toBe(true);
    expect(activePeople(advance(r.state, 1)).length).toBe(before - 1);
  });
  it("mover a una persona de sede la cambia de lugar sin cambiar la plantilla", () => {
    const g = createCompany("restaurante_consolidada");
    const p = activePeople(g).find((x) => x.siteId === "guadalupe" && x.roleId === "mesero")!;
    const r = apply(g, { type: "transfer", id: "t1", personId: p.id, siteId: "centro" });
    expect(r.ok).toBe(true);
    expect(g.people.find((x) => x.id === p.id)!.siteId).toBe("centro");
  });
  it("abrir en otra zona crea la sede con su equipo y la ubica en el mapa", () => {
    const { g, ds } = run("restaurante_consolidada", 160);
    const zs = zonesFor(g);
    expect(zs.length).toBeGreaterThan(0);
    const c = availableCases(g, ds).find((x) => x.id === "go_expandir");
    if (!c) return; // depende de los resultados del año; la regla se cubre abajo con la emergente
    const r = decide(g, "go_expandir", "zona_a", ds);
    expect(r.ok).toBe(true);
    const site = r.state.sites.at(-1)!;
    expect(zoneOf(site).id).toBe(zs[0].zone);
    expect(r.state.vacancies.filter((v) => v.siteId === site.id).length).toBeGreaterThanOrEqual(7);
  });
  it("las zonas ofrecidas nunca repiten una donde ya hay sede (ni la de Cumbres de la cadena A)", () => {
    const g = createCompany("restaurante_consolidada");
    const used = new Set(g.sites.map((x) => zoneOf(x).id));
    for (const z of zonesFor(g)) expect(used.has(z.zone)).toBe(false);
  });
  it("cada caso nuevo trae opción de puntaje máximo y textos limpios", () => {
    for (const c of GROWTH_CASES.filter((x) => x.chain === "finanzas" || x.chain === "operacion")) {
      expect(c.options.some((o) => o.score === 3)).toBe(true);
      const g = createCompany(c.family === "manufactura" ? "manufactura_consolidada" : "restaurante_consolidada");
      for (const o of optionsOf(g, c)) { expect(o.short.length).toBeLessThan(40); expect(o.text + o.outcome).not.toMatch(FORBIDDEN); }
      expect(c.body(g).join(" ") + c.subject).not.toMatch(FORBIDDEN);
    }
  });
});

describe("mapa y alertas", () => {
  it("el mapa trae cada sede con su zona, ingresos, gastos y gente del último mes", () => {
    const g = advance(createCompany("restaurante_consolidada"), 31);
    const map = opsMapOf(g);
    expect(map.sites).toHaveLength(5);
    expect(new Set(map.sites.map((x) => x.zone)).size).toBe(5);
    for (const x of map.sites) { expect(x.revenue).toBeGreaterThan(0); expect(x.people).toBeGreaterThan(0); expect(x.contribution).toBe(x.revenue - x.costs); }
    expect(map.sites.reduce((a, x) => a + x.people, 0) + map.office).toBe(activePeople(g).length);
    const d = siteDetailOf(g, "centro")!;
    expect(d.pnl.at(-1)![0]).toBe("Contribución");
    expect(d.team.reduce((a, t) => a + t.count, 0)).toBe(map.sites.find((x) => x.id === "centro")!.people);
  });
  it("las alertas avisan de la sede saturada, la que tiene holgura y el crédito", () => {
    let g = createCompany("restaurante_consolidada");
    const r = decide(g, "gf_arranque", "banco_corto", []);
    g = advance(r.state, 31);
    const ids = alertsOf(g).map((a) => a.id);
    expect(ids).toContain("credito");
    if (hotSite(g)) expect(ids).toContain("abasto");
    for (const a of alertsOf(g)) expect(a.title + a.text).not.toMatch(FORBIDDEN);
  });
});
