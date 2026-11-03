/**
 * Motor V6: el veredicto V5 en la carrera continua, con transición controlada.
 * Lo que se prueba:
 *  1. Transición: los periodos continuos que empezaron con v4 siguen en v4; los periodos cerrados no cambian;
 *     reproducir un diario de antes de v6 sigue abriendo periodos v4; los periodos nuevos abren con v6.
 *  2. Reglas conocidas antes de empezar: cada periodo v6 tiene su encargo (dos objetivos) y sus reglas desde el día 1.
 *  3. Matriz de estrategias × 6 empresas × varios meses (incluye estrategias de control que no se usaron para calibrar).
 *  4. Forja: el objetivo de caja se puede cumplir con decisiones razonables, y la exigencia no se ablandó.
 */
import { describe, expect, it } from "vitest";
import { advance, closedRunsOf, kpis, reportDueOf, rulesFor, verdictOf } from "./engine";
import { CONTINUOUS_RULES_VERSION, LEGACY_CONTINUOUS_RULES_VERSION, RULESETS, ruleSet } from "./rules";
import { HOLDOUT, ownStart, playCareer } from "./season-sim";
import { replay, type GameAction } from "./replay";
import { sanitizeAction } from "./journal";
import { SEASON_OBJECTIVES } from "./objectives";
import { closePeriod } from "./business/report";

const COS = ["cumbre", "forja", "brasa", "kubit", "puntomadero", "vertice"];
const MONTHS = 3;
const T = 120_000;
const memo = new Map<string, ReturnType<typeof playCareer>>();
const career = (c: string, st: string, v = CONTINUOUS_RULES_VERSION, i = 0) => {
  const k = `${c}|${st}|${v}|${i}`;
  if (!memo.has(k)) memo.set(k, playCareer(c, st, MONTHS, `${c}|${st}|${i}`, v));
  return memo.get(k)!;
};
const passRate = (st: string, v = CONTINUOUS_RULES_VERSION) => {
  let ok = 0, n = 0;
  for (const c of COS) for (const m of career(c, st, v).months) { n++; if (m.passed) ok++; }
  return ok / n;
};

describe("V6 · versiones y transición controlada", () => {
  it("v6 es la carrera continua con veredicto V5; v1–v5 no cambian", () => {
    const r6 = ruleSet(6);
    expect(CONTINUOUS_RULES_VERSION).toBe(6);
    expect(LEGACY_CONTINUOUS_RULES_VERSION).toBe(4);
    expect(r6.career).toBe("continua");
    expect(r6.v5).toBeDefined();
    expect(Object.isFrozen(RULESETS[6])).toBe(true);
    for (const v of [1, 2, 3, 4, 5]) expect(Object.isFrozen(RULESETS[v])).toBe(true);
    // v4 (los periodos que ya empezaron) sigue sin veredicto V5
    expect(ruleSet(4).v5).toBeUndefined();
    expect(ruleSet(4).career).toBe("continua");
  });

  it("un periodo que empezó con v4 sigue en v4 hasta cerrarse (mismo veredicto que antes, sin flujo de caja)", () => {
    const r = career("cumbre", "criterio_y_tablero", LEGACY_CONTINUOUS_RULES_VERSION);
    const m = r.months[0];
    expect(m.state.rulesVersion).toBe(4);
    const v = verdictOf(m.state, m.at);
    expect(v.v5).toBeUndefined();
    expect(v.passed).toBe(v.allApproved && v.answeredOk);
  }, T);

  it("cerrar un periodo v4 con la app nueva abre el siguiente con v6; el cerrado conserva su versión y su resultado", () => {
    const r = career("brasa", "criterio_y_tablero", LEGACY_CONTINUOUS_RULES_VERSION);
    const m = r.months[0];
    const before = verdictOf(m.state, m.at);
    const next = advance(m.state, m.at, CONTINUOUS_RULES_VERSION);
    expect(next.rulesVersion).toBe(6);
    const closed = closedRunsOf(next);
    expect(closed).toHaveLength(1);
    expect(closed[0].rulesVersion).toBe(4);
    expect(closed[0].passed).toBe(before.passed);
    expect(closed[0].kpis).toEqual(before.kpis);
    // y nada de lo que ya pasó se vuelve a calcular con v6
    expect(verdictOf(m.state, m.at)).toEqual(before);
  }, T);

  it("reproducir un diario de antes de v6 (sin versión continua) sigue abriendo periodos v4", () => {
    const r = career("kubit", "criterio_y_tablero", LEGACY_CONTINUOUS_RULES_VERSION);
    const m = r.months[0];
    expect(advance(m.state, m.at).rulesVersion).toBe(4);
    expect(advance(m.state, m.at, 5).rulesVersion).toBe(4);
    expect(advance(m.state, m.at, 3).rulesVersion).toBe(4);
    // crear la empresa sin versión en el diario (anterior a v6) abre v4; con versión, la respeta
    const base = { type: "start", at: Date.UTC(2026, 9, 5, 15), name: "QA", company: "cumbre" } as GameAction;
    const setup = { type: "setupCompany", at: Date.UTC(2026, 9, 5, 15, 1), companyId: "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b", sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: "Casa Norte" } as GameAction;
    expect(replay([base, setup]).state.rulesVersion).toBe(4);
    expect(replay([base, { ...setup, rulesVersion: 6 } as GameAction]).state.rulesVersion).toBe(6);
    // el diario conserva la versión al sanear
    expect((sanitizeAction({ ...setup, rulesVersion: 6 }) as { rulesVersion?: number }).rulesVersion).toBe(6);
  }, T);

  it("los periodos nuevos de una empresa nueva empiezan y siguen con v6", () => {
    expect(ownStart("forja")().rulesVersion).toBe(6);
    const r = career("forja", "criterio_y_tablero");
    for (const m of r.months) expect(m.state.rulesVersion).toBe(6);
    for (const run of closedRunsOf(r.state)) expect(run.rulesVersion).toBe(6);
  }, T);
});

describe("V6 · las reglas se conocen antes de empezar el periodo", () => {
  it("desde el primer minuto del periodo el veredicto ya dice el encargo, los objetivos y los umbrales", () => {
    for (const c of COS) {
      const s = ownStart(c)();
      const v = verdictOf(s, s.startedAt!);
      expect(v.v5, c).toBeDefined();
      expect(v.v5!.objectiveText).toBe(SEASON_OBJECTIVES[c].text);
      expect(v.v5!.objectives.map((o) => o.kpi)).toEqual(SEASON_OBJECTIVES[c].kpis);
      expect(v.v5!.healthMin).toBe(rulesFor(s).passLine + ruleSet(6).v5!.verdict.healthAboveLine);
    }
  });
  it("la línea del consejo no sube con la etapa (50 en todos los meses); la exigencia de la etapa sí", () => {
    const r = career("vertice", "criterio_y_tablero");
    for (const m of r.months) expect(rulesFor(m.state).passLine).toBe(50);
    expect(r.months[MONTHS - 1].state.tier).toBeGreaterThanOrEqual(r.months[0].state.tier);
  }, T);
});

describe("V6 · matriz de estrategias en la carrera continua (3 meses × 6 empresas)", () => {
  it("razonar bien y cuidar el encargo aprueba la mayoría de los meses", () => {
    expect(passRate("criterio_y_tablero")).toBeGreaterThanOrEqual(0.8);
    expect(passRate("director_equilibrado")).toBeGreaterThanOrEqual(0.8);
  }, 600_000);
  it("control (no calibradas): un director bueno que cuida la caja aprueba la mayoría; solo personas, segunda mejor o la más larga no", () => {
    expect(HOLDOUT).toContain("cuida_caja");
    expect(passRate("cuida_caja")).toBeGreaterThanOrEqual(0.7);
    expect(passRate("personas_primero")).toBeLessThan(0.5);
    expect(passRate("segunda_mejor")).toBe(0);
    expect(passRate("mas_larga")).toBeLessThanOrEqual(0.1);
  }, 600_000);
  it("al azar no se aprueba por suerte", () => {
    let ok = 0, n = 0;
    for (const c of COS) for (let i = 0; i < 3; i++) for (const m of career(c, "azar", CONTINUOUS_RULES_VERSION, i).months) { n++; if (m.passed) ok++; }
    expect(ok / n).toBeLessThanOrEqual(0.1);
  }, 600_000);
});

describe("V6 · Forja: la exigencia se mantiene y el objetivo de caja es alcanzable", () => {
  it("el encargo de Forja sigue pidiendo caja y armadora en la línea", () => {
    expect(SEASON_OBJECTIVES.forja.kpis).toEqual(["clientes", "caja"]);
    expect(SEASON_OBJECTIVES.forja.text).toMatch(/caja/);
  });
  it("con decisiones razonables (dos estrategias distintas) Forja cierra con caja en la línea", () => {
    for (const st of ["criterio_y_tablero", "director_equilibrado", "cuida_caja"]) {
      const m = career("forja", st).months[0];
      const v = verdictOf(m.state, m.at);
      expect(v.kpis.caja, st).toBeGreaterThanOrEqual(v.passLine);
      expect(v.passed, `${st}: ${v.v5?.reasons}`).toBe(true);
    }
  }, 600_000);
  it("solo números sin criterio no pasa Forja: cruza una línea roja o pierde el encargo", () => {
    const m = career("forja", "mejor_efecto").months[0];
    const v = verdictOf(m.state, m.at);
    expect(v.passed).toBe(false);
    expect(v.v5!.reasons.some((x) => x === "linea_roja" || x === "objetivo")).toBe(true);
  }, 600_000);
});

describe("V6 · el reporte del mes se firma antes del siguiente cierre (como en v4)", () => {
  it("advance espera el reporte firmado", () => {
    const r = career("cumbre", "criterio_y_tablero");
    const m = r.months[0];
    const next = advance(m.state, m.at, CONTINUOUS_RULES_VERSION);
    expect(reportDueOf(next)).toBe(1);
    const signed = closePeriod(next, 1, m.at);
    expect(reportDueOf(signed)).toBeNull();
    expect(kpis(signed, m.at)).toBeDefined();
  }, T);
});
