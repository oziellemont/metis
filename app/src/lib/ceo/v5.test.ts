/**
 * Motor V5: reglas nuevas para las temporadas que empiezan desde ahora.
 * Lo que se prueba:
 *  1. V1–V4 no cambian, y las partidas que empezaron con ellas siguen con sus reglas.
 *  2. El flujo de caja solo se aplica al cierre (con el proyecto de cambio terminado).
 *  3. Matriz de estrategias × 6 empresas: al azar ya no se aprueba por suerte; razonar bien Y cuidar el
 *     encargo del consejo aprueba en todas; elegir solo por la opción «más larga» o «siempre A» no aprueba.
 */
import { describe, expect, it } from "vitest";
import { cashFlowOf, kpis, newState, verdictOf } from "./engine";
import { RULESETS, RULES_VERSION, CONTINUOUS_RULES_VERSION, ruleSet } from "./rules";
const COMPANY_IDS = ["cumbre", "forja", "brasa", "kubit", "puntomadero", "vertice"];
import { STRATEGIES, classicStart, playSeason } from "./season-sim";
import { SEASON_OBJECTIVES } from "./objectives";
import { alertsAt, seasonDiagnosis } from "./season-report";

const COS = [...COMPANY_IDS];
const v3Start = (c: string) => () => ({ ...classicStart(c)(), rulesVersion: 3 });

function rate(company: string, strat: string, reps = STRATEGIES[strat].reps, make = classicStart(company)) {
  let ok = 0;
  for (let i = 0; i < reps; i++) if (playSeason(make, strat, `${company}|${strat}|${i}`).passed) ok++;
  return ok / reps;
}

describe("V5 · versiones", () => {
  it("las temporadas nuevas empiezan con v5; los periodos continuos nuevos, con v7 (V5 en la carrera continua + auditoría ética)", () => {
    expect(RULES_VERSION).toBe(5);
    expect(newState().rulesVersion).toBe(5);
    expect(CONTINUOUS_RULES_VERSION).toBe(7);
  }, 60_000);
  it("V1–V4 siguen congeladas y sin reglas V5", () => {
    for (const v of [1, 2, 3, 4]) {
      expect(Object.isFrozen(RULESETS[v])).toBe(true);
      expect(RULESETS[v].v5).toBeUndefined();
    }
    expect(Object.isFrozen(RULESETS[5])).toBe(true);
  }, 60_000);
  it("v5 conserva exigencia, XP, crisis y casos ejecutivos de v3", () => {
    const { version: _a, v5: _b, ...rest5 } = ruleSet(5);
    const { version: _c, ...rest3 } = ruleSet(3);
    expect(rest5).toEqual(rest3);
  }, 60_000);
  it("cada empresa tiene dos objetivos de temporada", () => {
    for (const c of COS) expect(SEASON_OBJECTIVES[c]?.kpis.length, c).toBe(2);
  }, 60_000);
  it("una temporada v3 en curso no cambia: mismo veredicto que antes y sin flujo de caja", () => {
    const r = playSeason(v3Start("cumbre"), "mejor_score", "v3|cumbre");
    const v = verdictOf(r.state, r.at);
    expect(v.v5).toBeUndefined();
    expect(v.passed).toBe(v.allApproved && v.answeredOk);
    expect(cashFlowOf(r.state, kpis(r.state, r.at))).toBe(0);
  }, 60_000);
});

describe("V5 · flujo de caja", () => {
  it("solo se aplica al cierre y depende del margen", () => {
    const r = playSeason(classicStart("cumbre"), "criterio_y_tablero", "cf|cumbre");
    const s = r.state;
    expect(s.change?.closedAt).toBeTruthy();
    const k = kpis(s, r.at);
    const cf = cashFlowOf(s, k);
    expect(cf).toBe(Math.max(-5, Math.min(6, Math.round((k.margen - 50) / 3))));
    // sin cierre, no hay flujo
    const open = { ...s, change: undefined };
    expect(cashFlowOf(open, k)).toBe(0);
  }, 60_000);
});

describe("V5 · matriz de estrategias × empresas", () => {
  // Calculada una vez (≈ 40 temporadas por estrategia aleatoria).
  const M: Record<string, Record<string, number>> = {};
  const strats = ["azar", "contesta_la_mitad", "mas_larga", "siempre_A", "peor_score", "director_equilibrado", "criterio_y_tablero"];
  for (const st of strats) { M[st] = {}; for (const c of COS) M[st][c] = rate(c, st, Math.min(STRATEGIES[st].reps, 30)); }

  it("al azar ya no se aprueba por suerte (≤ 25 % en cada empresa; antes 33–47 % en kubit y puntomadero)", () => {
    for (const c of COS) expect(M.azar[c], c).toBeLessThanOrEqual(0.25);
    expect(COS.reduce((a, c) => a + M.azar[c], 0) / COS.length).toBeLessThanOrEqual(0.12);
  }, 60_000);
  it("contestar la mitad (≤ 10 %), la opción más larga, siempre A o la de peor criterio no aprueban", () => {
    for (const c of COS) {
      expect(M.contesta_la_mitad[c], c).toBeLessThanOrEqual(0.1);
      expect(M.peor_score[c], c).toBe(0);
    }
    const lazy = COS.filter((c) => M.mas_larga[c] > 0 || M.siempre_A[c] > 0);
    expect(lazy.length, lazy.join(",")).toBeLessThanOrEqual(1);
  }, 60_000);
  it("razonar bien y cuidar el encargo aprueba en todas las empresas", () => {
    for (const c of COS) {
      expect(M.criterio_y_tablero[c], c).toBe(1);
      expect(M.director_equilibrado[c], c).toBe(1);
    }
  }, 60_000);
  it("hay más de un camino: caminos variados con buen criterio aprueban en la mayoría de las empresas", () => {
    const ok = COS.filter((c) => rate(c, "criterio_variado", 8) >= 0.5);
    expect(ok.length).toBeGreaterThanOrEqual(4);
  }, 120_000);
});

describe("V5 · explicación", () => {
  it("una temporada reprobada explica por qué, en concreto, y el diagnóstico usa las mismas razones", () => {
    const r = playSeason(classicStart("forja"), "mejor_score", "why|forja");
    const v = verdictOf(r.state, r.at);
    expect(v.passed).toBe(false);
    expect(v.v5!.reasons.length).toBeGreaterThan(0);
    expect(v.v5!.why.length).toBeGreaterThan(0);
    const d = seasonDiagnosis(r.state, r.at);
    expect(d.summary[0]).toContain(v.v5!.why[0]);
  }, 60_000);
  it("las alertas distinguen un objetivo del consejo de un indicador que no es objetivo", () => {
    const r = playSeason(classicStart("kubit"), "azar", "alert|kubit|3");
    for (const a of alertsAt(r.state, r.at).filter((x) => x.kind === "bajo_la_linea")) {
      expect(a.text).toMatch(/objetivos que te encargó|piso|insolvencia|No es uno de tus objetivos/);
    }
  }, 60_000);
  it("aprobar describe el encargo, la salud y el criterio", () => {
    const r = playSeason(classicStart("vertice"), "criterio_y_tablero", "ok|vertice");
    const d = seasonDiagnosis(r.state, r.at);
    expect(d.result.passed).toBe(true);
    expect(d.summary[0]).toMatch(/consejo te encargó/);
    expect(d.quadrant).toBe("criterio_y_resultado");
  }, 60_000);
});
