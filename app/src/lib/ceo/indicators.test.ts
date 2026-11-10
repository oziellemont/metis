import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { KPI_KEYS, cashFlowOf, healthOf, kpis, scaled } from "./engine";
import { playCareer, playSeason, ownStart } from "./season-sim";
import { timeline } from "./season-report";
import { decisionChange, healthState, indicatorDetail, thresholdsOf, zoneOf } from "./indicators";
import { CONTINUOUS_RULES_VERSION, PROPOSED_RULES_VERSION, RULESETS, ruleSet, tierRules } from "./rules";
import { sanitizeEvents } from "./journal";

const src = (f: string) => readFileSync(`src/components/ceo/${f}`, "utf8");
const BANNED = /de cero a ceo|\blibro\b|próximamente|en preparación|más adelante:/i;

describe("registro de movimientos (fase A)", () => {
  const r = playSeason(ownStart("cumbre"), "criterio_y_tablero", "led");
  const s = r.state, t = r.at;
  const tl = timeline(s, t);

  it("cuadra exacto con el tablero: el último valor de cada indicador es el de kpis()", () => {
    expect(tl.end).toEqual(kpis(s, t));
    for (const k of KPI_KEYS) {
      const d = indicatorDetail(s, t, k);
      expect(d.value).toBe(kpis(s, t)[k]);
      // La suma de los movimientos explica todo el cambio desde el inicio: nada se mueve sin causa.
      expect(d.start + d.history.reduce((a, m) => a + m.delta, 0)).toBe(d.value);
    }
  });
  it("cada movimiento tiene origen, fecha y enlace (salvo el ajuste de cierre)", () => {
    for (const e of tl.events) {
      if (e.kind === "flujo") { expect(e.href).toBeNull(); continue; }
      expect(e.href).toMatch(/^\/ceo\//);
      if (e.kind !== "cambio" || s.change) expect(typeof e.at).toBe("number");
    }
  });
  it("las causas principales están ordenadas por impacto y son a lo más tres", () => {
    for (const k of KPI_KEYS) {
      const d = indicatorDetail(s, t, k);
      expect(d.down.length).toBeLessThanOrEqual(3);
      expect(d.up.length).toBeLessThanOrEqual(3);
      for (let i = 1; i < d.down.length; i++) expect(d.down[i - 1].delta).toBeLessThanOrEqual(d.down[i].delta);
      for (let i = 1; i < d.up.length; i++) expect(d.up[i - 1].delta).toBeGreaterThanOrEqual(d.up[i].delta);
      expect(d.down.every((m) => m.delta < 0) && d.up.every((m) => m.delta > 0)).toBe(true);
    }
  });
  it("el antes → después de una decisión es el mismo que guarda el registro", () => {
    const e = tl.events.find((x) => x.kind === "decision" && Object.keys(x.eff).length)!;
    const ch = decisionChange(s, t, e.id)!;
    for (const row of ch.rows) { expect(row.before).toBe(e.before[row.kpi]); expect(row.after).toBe(e.after[row.kpi]); }
    expect(ch.health).toEqual({ before: healthOf(e.before), after: healthOf(e.after) });
    expect(decisionChange(s, t, "no-existe")).toBeNull();
  });
});

describe("salud de la empresa (barra madre)", () => {
  it("es el promedio de los cinco y su línea es la salud mínima del consejo", () => {
    const s = ownStart("forja")();
    const th = thresholdsOf(s);
    expect(th).toMatchObject({ line: 50, floor: 40, healthMin: 58 });
    const k = { caja: 70, margen: 60, equipo: 50, clientes: 40, consejo: 80 };
    const h = healthState(k, k, th);
    expect(h.value).toBe(healthOf(k));
    expect(h.min).toBe(58);
    expect(h.cushion).toBe(h.value - 58);
    expect(h.weakest).toBe("clientes");
  });
  it("zonas: crítica bajo el piso, riesgo bajo la línea, observación cerca, sana arriba", () => {
    expect(zoneOf(35, 50, 40)).toBe("critica");
    expect(zoneOf(45, 50, 40)).toBe("riesgo");
    expect(zoneOf(45, 50, 40, true)).toBe("critica");
    expect(zoneOf(54, 50, 40)).toBe("observacion");
    expect(zoneOf(70, 50, 40)).toBe("sana");
  });
});

describe("reglas v9: definidas, nunca activas (v10 las incluye)", () => {
  it("existe v9 pero las partidas nuevas nacen en v10", () => {
    expect(PROPOSED_RULES_VERSION).toBe(9);
    expect(RULESETS[9].version).toBe(9);
    expect(CONTINUOUS_RULES_VERSION).toBe(10);
    expect(ownStart("cumbre")().rulesVersion).toBe(10);
  });
  it("sin multiplicador de exigencia: el mismo efecto vale igual en cualquier etapa", () => {
    for (let tier = 0; tier <= 6; tier++) {
      expect(tierRules(tier, 9)).toMatchObject({ hit: 1, gain: 1 });
      expect(scaled({ caja: -5, equipo: 4 }, tier, 9)).toEqual({ caja: -5, equipo: 4 });
    }
    expect(tierRules(3, 8).hit).toBeGreaterThan(1);
  });
  it("sin caja fabricada desde el margen al cierre", () => {
    const r = playSeason(ownStart("cumbre", 9), "criterio_y_tablero", "v9");
    expect(r.state.rulesVersion).toBe(9);
    expect(cashFlowOf(r.state, { ...r.kpis, margen: 90 })).toBe(0);
    expect(timeline(r.state, r.at).events.some((e) => e.kind === "flujo")).toBe(false);
  });
  it("v8 queda igual: mismos umbrales y el flujo de caja sigue existiendo para sus periodos", () => {
    expect(ruleSet(8).v5!.cashFlow).toEqual({ perPoints: 2, min: -5, max: 10, base: 2 });
    expect(ruleSet(9).v5!.verdict).toEqual(ruleSet(8).v5!.verdict);
    expect(ruleSet(9).judgment).toEqual(ruleSet(8).judgment);
  });
  it("el servidor no deja que un cliente pida v9: recibe la vigente", () => {
    const { events } = sanitizeEvents([
      { eventId: "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b", seq: 1, action: { type: "advance", at: 1000, rulesVersion: 9 } },
      { eventId: "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5c", seq: 2, action: { type: "setupCompany", at: 1000, companyId: "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b", sectorId: "manufactura", industryId: "autopartes", archetype: "establecida", displayName: "QA", rulesVersion: 9 } },
    ]);
    expect(events).toHaveLength(2);
    for (const e of events) expect((e.action as { rulesVersion?: number }).rulesVersion).toBe(CONTINUOUS_RULES_VERSION);
  });
  it("una carrera v9 de varios meses corre de punta a punta", () => {
    const c = playCareer("vertice", "director_equilibrado", 2, "v9", 9);
    expect(c.months.length).toBeGreaterThan(0);
    expect(c.state.rulesVersion).toBe(9);
  });
});

describe("pantallas: barras con detalle en Hoy, Mi empresa y el resultado", () => {
  const today = src("Today.tsx"), company = src("empresa/ResumenTab.tsx"), board = src("KpiBoard.tsx"), caseView = src("CaseView.tsx");
  it("Hoy: salud en grande y tablero clicable en «Tu empresa hoy»", () => {
    // Centro de mando: la salud en grande abre el panel lateral, con el mismo tablero clicable.
    expect(today).toContain("<KpiBoard hero />");
    expect(board).toContain("function HealthHero");
    expect(today.indexOf("Tu empresa hoy")).toBeLessThan(today.indexOf("<KpiBoard hero />"));
  });
  it("Mi empresa abre el mismo detalle, en ventana centrada", () => {
    expect(company).toContain('<KpiBoard hero detail="centro" />');
  });
  it("el panel explica estado, último movimiento, causas, pendientes, historial y qué puedes hacer", () => {
    for (const x of ["Salud de la empresa", "Último movimiento", "Por qué está así", "Pendiente de respuesta", "Historial", "Qué puedes hacer"]) expect(board).toContain(x);
    expect(board).toContain("<DetailDialog");
    for (const x of ['role="dialog"', 'aria-modal="true"', '"Escape"']) expect(src("DetailDialog.tsx")).toContain(x);
  });
  it("el resultado de una decisión usa barras antes → después, no etiquetas sueltas", () => {
    expect(caseView).toContain("<ResultBars");
    expect(caseView).not.toMatch(/effects\[k\]/);
  });
  it("sin textos prohibidos", () => {
    for (const s of [board, readFileSync("src/lib/ceo/indicators.ts", "utf8")]) expect(s).not.toMatch(BANNED);
  });
});
