import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { COMPANIES } from "./companies";
import {
  EDITORIAL_APPROVER, EDITORIAL_REVIEW, EDITORIAL_STATUSES, RED_LINES, auditItem, countBy, dominates, inventory, isRedLine, netOf, pearson, scoreAudit,
} from "./editorial";
import { approvalPacket, itemsCsv, population, reportMarkdown } from "./editorial-report";
import { SHADOW_RULES, compare, shadowVerdictOf } from "./shadow-verdict";
import { decide, kpis, newState, verdictOf } from "./engine";
import { replay } from "./replay";
import { SPECS, record, snapshotOf, type Golden } from "./golden/play";
import type { CeoState, CompanyPack, Item } from "./types";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
const all = inventory();

describe("0.6 inventario editorial", () => {
  it("clasifica los 69 asuntos, cada uno con un estado válido y un motivo", () => {
    expect(all).toHaveLength(69);
    expect(all.length).toBe(COMPANIES.reduce((a, c) => a + c.items.length, 0));
    for (const a of all) {
      expect(EDITORIAL_STATUSES).toContain(a.status);
      expect(a.reason.length).toBeGreaterThan(20);
    }
    const c = countBy(all);
    expect(Object.values(c).reduce((x, y) => x + y, 0)).toBe(69);
  });

  it("reproduce el hallazgo C1 de la auditoría (score alto = más rentable)", () => {
    const s = Object.fromEntries(scoreAudit().map((x) => [x.company, x]));
    expect(s.cumbre.byScore[3].meanNet).toBe(4);
    expect(s.cumbre.byScore[0].meanNet).toBe(-5.27);
    expect(s.forja.byScore[3].meanNet).toBe(0.88);
    expect(s.forja.byScore[0].meanNet).toBe(-6.2);
    for (const x of Object.values(s)) expect(x.correlation).toBeGreaterThan(0.3);
  });

  it("toda línea roja apunta a un asunto y opción que existen, y el asunto queda en restrictedEthics", () => {
    for (const [id, rs] of Object.entries(RED_LINES)) {
      const a = all.find((x) => x.id === id);
      expect(a, id).toBeTruthy();
      for (const r of rs) {
        expect(a!.options.some((o) => o.id === r.option), `${id}/${r.option}`).toBe(true);
        expect(isRedLine(id, r.option)).toBe(true);
      }
      expect(a!.status).toBe("restrictedEthics");
    }
    expect(isRedLine("d1-bienvenida", "a")).toBe(false);
  });

  it("los asuntos con área ética nunca se marcan para reescribir por «respuesta obvia»", () => {
    for (const a of all.filter((x) => x.areas.includes("etica"))) expect(a.status).toBe("restrictedEthics");
  });

  it("nadie queda «revisado» sin la aprobación de Oziel", () => {
    for (const [id, r] of Object.entries(EDITORIAL_REVIEW)) {
      expect(all.some((a) => a.id === id)).toBe(true);
      expect(r.approvedBy).toBe(EDITORIAL_APPROVER);
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(all.filter((a) => a.reviewed).length).toBe(Object.keys(EDITORIAL_REVIEW).length);
  });

  it("dominancia y balance neto", () => {
    expect(dominates({ caja: 2, equipo: 1 }, { caja: 1 })).toBe(true);
    expect(dominates({ caja: 1 }, { caja: 1 })).toBe(false);
    expect(dominates({ caja: 3, equipo: -1 }, { caja: 1 })).toBe(false);
    expect(netOf({ caja: 3, equipo: -1, consejo: 2 })).toBe(4);
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(pearson([1, 1], [2, 3])).toBe(0);
  });

  it("clasificador con casos sintéticos: dominante → needsRewrite; dilema parejo → approved", () => {
    const pack = COMPANIES[0];
    const base = pack.items.find((i) => i.id === "d1-bienvenida")!;
    const mk = (opts: [number, Record<string, number>][]): Item => ({
      ...base, id: "x", areas: ["estrategia"],
      options: opts.map(([score, effects], i) => ({ ...base.options[0], id: "abc"[i], score: score as 0 | 1 | 2 | 3, effects })),
    });
    const dom = auditItem(pack as CompanyPack, mk([[3, { caja: 2, equipo: 1 }], [1, { caja: 1 }], [0, { equipo: -1 }]]));
    expect(dom.dominantOption).toBe("a");
    expect(dom.status).toBe("needsRewrite");
    const fair = auditItem(pack, mk([[3, { caja: -2, equipo: 3 }], [2, { caja: 3, equipo: -2 }], [1, { clientes: 2, consejo: -1 }]]));
    expect(fair.findings).not.toContain("obvia");
    expect(fair.status).toBe("approved");
    const leg = auditItem(pack, mk([[3, { caja: -1, equipo: 3 }], [1, { caja: 3, equipo: -2 }]]));
    expect(leg.status).toBe("legacy");
  });

  it("es de solo lectura: el contenido no cambia al auditar", () => {
    const before = JSON.stringify(COMPANIES.map((c) => c.items));
    inventory(); scoreAudit(); itemsCsv(all);
    expect(JSON.stringify(COMPANIES.map((c) => c.items))).toBe(before);
  });

  it("el CSV publicado en docs/editorial está al día con el contenido", () => {
    const committed = readFileSync(join(__dirname, "..", "..", "..", "..", "docs", "editorial", "inventario-0.6.csv"), "utf8");
    expect(committed).toBe(itemsCsv());
  });

  it("el CSV trae una fila por asunto", () => {
    const csv = itemsCsv(all).trim().split("\n");
    expect(csv).toHaveLength(70);
    expect(csv[0]).toContain("estado");
  });
});

describe("0.6 veredicto sombra", () => {
  const play = (company: string, strategy: "best" | "worst" | "lazy" | "score", seed = "t") => {
    const g = record({ id: seed, description: "", start: T0, name: "Prueba", company, settings: { tz: "America/Monterrey" }, seed, seasons: [{ strategy, change: "smart", advance: false }] });
    const at = g.checkpoints[g.checkpoints.length - 1].at;
    return { state: replay(g.actions).state, at };
  };

  it("no modifica el estado ni el veredicto actual", () => {
    const { state, at } = play("cumbre", "best");
    const snap = JSON.stringify(state);
    const v0 = verdictOf(state, at);
    const sv = shadowVerdictOf(state, at);
    expect(JSON.stringify(state)).toBe(snap);
    expect(verdictOf(state, at)).toEqual(v0);
    expect(sv.current.passed).toBe(v0.passed);
  });

  it("el jugador cuidadoso aprueba en ambos; el de peor balance en Cumbre reprueba en ambos", () => {
    const good = play("cumbre", "best");
    expect(shadowVerdictOf(good.state, good.at).passed).toBe(true);
    expect(verdictOf(good.state, good.at).passed).toBe(true);
    const bad = play("cumbre", "worst");
    expect(shadowVerdictOf(bad.state, bad.at).passed).toBe(false);
    expect(verdictOf(bad.state, bad.at).passed).toBe(false);
  });

  it("elegir una línea roja reprueba en sombra aunque los números alcancen", () => {
    const { state, at } = play("cumbre", "best");
    const red = Object.values(state.decisions).length && state.decisions["d6-gastos"];
    expect(red).toBeTruthy();
    const s2 = { ...state, decisions: { ...state.decisions, "d6-gastos": { ...state.decisions["d6-gastos"], option: "b" } } };
    const sv = shadowVerdictOf(s2, at);
    expect(sv.redLines).toContain("d6-gastos/b");
    expect(sv.reasons).toContain("linea_roja");
    expect(sv.passed).toBe(false);
  });

  it("con muy pocas respuestas el resultado es «sin evidencia», no reprobado por vencer", () => {
    let s: CeoState = { ...newState(), company: "brasa", name: "X", startedAt: T0, lastActiveAt: T0, savedAt: T0 };
    s = decide(s, "gb-d1-carta", "a", T0 + 3_600_000);
    const sv = shadowVerdictOf(s, T0 + 30 * 86_400_000);
    expect(sv.answered).toBeLessThan(SHADOW_RULES.minEvidence);
    if (!sv.reasons.length) expect(sv.outcome).toBe("sin_evidencia");
    expect(kpis(s, T0)).toBeTruthy();
  });

  it("comparación: matriz y coincidencias cuadran con el total", () => {
    const pop = population(1, ["brasa"]).slice(0, 6);
    const c = compare(pop.map((p) => p.verdict));
    expect(c.games).toBe(6);
    const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
    expect(sum(c.matrix.aprobo) + sum(c.matrix.reprobo)).toBe(6);
    expect(sum(c.shadow)).toBe(6);
    expect(c.agreement).toBeGreaterThanOrEqual(0);
    expect(c.agreement).toBeLessThanOrEqual(1);
  }, 60_000);

  it("las 10 partidas doradas dan la misma foto antes y después de calcular el veredicto sombra", () => {
    for (const spec of SPECS) {
      const g: Golden = JSON.parse(readFileSync(join(__dirname, "golden", "data", `${spec.id}.json`), "utf8"));
      const last = g.checkpoints[g.checkpoints.length - 1];
      const { state } = replay(g.actions.slice(0, last.after));
      shadowVerdictOf(state, last.at);
      expect(JSON.parse(JSON.stringify(snapshotOf(state, last.at))), spec.id).toEqual(last.snapshot);
    }
  });
});

/**
 * Regenera el reporte revisable. NO corre en la suite normal:
 *   EDITORIAL_REPORT=1 npx vitest run src/lib/ceo/editorial.test.ts
 */
it("el paquete de aprobación incluye los 69 asuntos con su formato de respuesta y está al día", () => {
  const md = approvalPacket();
  expect((md.match(/^### /gm) ?? []).length).toBe(69);
  expect((md.match(/^Respuesta: `/gm) ?? []).length).toBe(69);
  expect(md).not.toMatch(/undefined|NaN/);
  expect(readFileSync(join(__dirname, "..", "..", "..", "..", "docs", "editorial", "aprobacion-casos.md"), "utf8")).toBe(md);
});

it.runIf(process.env.EDITORIAL_REPORT === "1")("genera docs/editorial (reporte + CSV)", () => {
  const dir = join(__dirname, "..", "..", "..", "..", "docs", "editorial");
  mkdirSync(dir, { recursive: true });
  const pop = population(2);
  writeFileSync(join(dir, "inventario-0.6.md"), reportMarkdown(pop));
  writeFileSync(join(dir, "inventario-0.6.csv"), itemsCsv());
  writeFileSync(join(dir, "aprobacion-casos.md"), approvalPacket());
}, 300_000);
