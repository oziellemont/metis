import { describe, expect, it } from "vitest";
import { KPI_KEYS, kpis } from "./engine";
import { playSeason, classicStart } from "./season-sim";
import { alertsOf, decisionBalance, seasonDiagnosis, timeline } from "./season-report";
import { contextualJudgment, judge, prioritizes } from "./judgment";
import { candidateVerdictOfKpis } from "./verdict-candidate";
import type { Kpis } from "./types";

const K = (o: Partial<Kpis> = {}): Kpis => ({ caja: 60, margen: 60, equipo: 60, clientes: 60, consejo: 60, ...o });

describe("balance por decisión", () => {
  it("separa beneficios, costos, riesgos y puntos desperdiciados", () => {
    const b = decisionBalance({ effects: { equipo: 6, caja: -4 }, stance: { ana: -2 } }, K({ equipo: 98, caja: 53 }), 50, { ana: "Ana" });
    expect(b.benefits.map((x) => x.kpi)).toEqual(["equipo"]);
    expect(b.costs.map((x) => x.kpi)).toEqual(["caja"]);
    expect(b.wasted).toEqual([{ kpi: "equipo", points: 4 }]);
    expect(b.risks.join(" ")).toMatch(/Caja queda en 49, por debajo/);
    expect(b.risks.join(" ")).toMatch(/Ana/);
  });
});

describe("alertas de tendencia", () => {
  const ev = (eff: Partial<Kpis>, before: Kpis) => { const after = { ...before }; for (const k of Object.keys(eff) as (keyof Kpis)[]) after[k] = Math.max(0, Math.min(100, before[k] + (eff[k] ?? 0))); return { kind: "decision" as const, id: `x${Math.random()}`, label: "x", eff, wasted: {}, before, after }; };
  it("avisa cuando varias decisiones seguidas van bajando el mismo indicador cerca de la línea", () => {
    let k = K({ caja: 70 }); const events = [];
    for (const d of [-3, -4, -3, -3]) { const e = ev({ caja: d, equipo: 2 }, k); events.push(e); k = e.after; }
    const a = alertsOf({ start: K({ caja: 70 }), events, end: k }, 50);
    expect(a.find((x) => x.kpi === "caja")?.kind).toBe("tendencia");
  });
  it("escala a riesgo y a crítico según la distancia a la línea", () => {
    expect(alertsOf({ start: K(), events: [], end: K({ margen: 53 }) }, 50).find((x) => x.kpi === "margen")?.level).toBe("riesgo");
    expect(alertsOf({ start: K(), events: [], end: K({ margen: 47 }) }, 50).find((x) => x.kpi === "margen")?.level).toBe("critico");
  });
  it("sin desgaste no hay alertas (no es ruido)", () => {
    expect(alertsOf({ start: K(), events: [], end: K() }, 50)).toEqual([]);
  });
});

describe("rúbrica de criterio (eje A) separada del resultado (eje B)", () => {
  it("leer el tablero es criterio: gastar lo que ya está en riesgo, habiendo alternativa defendible, baja «prioriza»", () => {
    const os = [{ id: "a", score: 3, effects: { caja: -4, equipo: 5 } }, { id: "b", score: 3, effects: { margen: 3, clientes: -2 } }];
    expect(prioritizes(os[0], os, K({ caja: 52 }), 50)).toBe(0);
    expect(prioritizes(os[1], os, K({ caja: 52 }), 50)).toBe(1);
    expect(prioritizes(os[0], os, K({ caja: 80 }), 50)).toBe(1);
  });
  it("reponer lo que está en riesgo sube «prioriza»", () => {
    const os = [{ id: "a", score: 2, effects: { caja: 3, equipo: -2 } }, { id: "b", score: 3, effects: { equipo: 4, caja: -1 } }];
    expect(prioritizes(os[0], os, K({ caja: 52 }), 50)).toBe(2);
  });
  it("el nivel 0–3 sale de seis dimensiones, no de los indicadores", () => {
    expect(judge({ analiza: 2, consulta: 2, anticipa: 2, negocia: 2, ejecuta: 2 }, 2).level).toBe(3);
    expect(judge({ analiza: 0, consulta: 0, anticipa: 1, negocia: 0, ejecuta: 1 }, 1).level).toBe(0);
    const same = { id: "a", score: 3, effects: { caja: -4 } };
    expect(contextualJudgment(same, [same], K({ caja: 90 }), 50).level).toBe(3);
  });
  it("un 3 editorial que hunde lo que está en riesgo, con alternativa defendible, baja a nivel 2", () => {
    const os = [{ id: "a", score: 3, effects: { caja: -4, equipo: 5 } }, { id: "b", score: 3, effects: { margen: 3, clientes: -2 } }];
    expect(contextualJudgment(os[0], os, K({ caja: 52 }), 50).level).toBe(2);
    expect(contextualJudgment(os[1], os, K({ caja: 52 }), 50).level).toBe(3);
  });
});

describe("veredicto candidato (no activo)", () => {
  it("un indicador ligeramente bajo NO reprueba si la empresa está sana y cumple sus objetivos", () => {
    expect(candidateVerdictOfKpis(K({ caja: 66, equipo: 47, margen: 64, clientes: 66, consejo: 68 }), "brasa", 50).passed).toBe(true);
  });
  it("los límites críticos no se compensan con otros indicadores altos", () => {
    const v = candidateVerdictOfKpis(K({ caja: 38, equipo: 100, consejo: 95 }), "cumbre", 50);
    expect(v.passed).toBe(false);
    expect(v.reasons).toContain("insolvencia");
    expect(v.why[0]).toMatch(/insolvencia/);
  });
  it("fallar un objetivo de temporada reprueba y lo explica", () => {
    const v = candidateVerdictOfKpis(K({ margen: 48, equipo: 70, consejo: 70 }), "cumbre", 50);
    expect(v.reasons).toEqual(["objetivo"]);
    expect(v.why.join(" ")).toMatch(/Margen era uno de tus dos objetivos/);
  });
});

describe("diagnóstico de temporada sobre partidas reales", () => {
  it("la historia reconstruye exactamente los indicadores finales del motor", () => {
    for (const c of ["cumbre", "forja", "kubit"]) {
      const r = playSeason(classicStart(c), "azar", `${c}|tl`);
      const tl = timeline(r.state, r.at);
      expect(tl.end).toEqual(kpis(r.state, r.at));
    }
  });
  it("una temporada reprobada se explica con decisiones concretas y separa criterio de resultado", () => {
    // Temporada con reglas V3 (las que conservan las partidas que empezaron antes de V5).
    const r = playSeason(() => ({ ...classicStart("cumbre")(), rulesVersion: 3 }), "mejor_score", "cumbre|diag");
    const d = seasonDiagnosis(r.state, r.at);
    expect(d.result.passed).toBe(false);
    expect(d.result.failed).toContain("caja");
    expect(d.judgment.level).toBe("alto");
    expect(d.quadrant).toBe("criterio_sin_resultado");
    const caja = d.stories.find((s) => s.kpi === "caja")!;
    expect(caja.worst.length).toBeGreaterThan(0);
    expect(d.summary.join(" ")).toMatch(/Caja bajó de 60/);
    expect(d.patterns.some((p) => p.id === "satura_equipo")).toBe(true);
  });
  it("cada indicador suma sus fuentes (decisiones, vencidos, casos, cambio) al cambio total", () => {
    const r = playSeason(classicStart("forja"), "contesta_la_mitad", "forja|src");
    const d = seasonDiagnosis(r.state, r.at);
    for (const s of d.stories) expect(Object.values(s.bySource).reduce((a, x) => a + x, 0)).toBe(s.end - s.start);
    expect(KPI_KEYS.length).toBe(d.stories.length);
  });
});
