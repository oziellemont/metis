import { describe, expect, it } from "vitest";
import { COMPANIES } from "./companies";
import { withBank } from "./cases/bank";
import { DILEMMAS } from "./dilemmas";
import { RED_LINES } from "./editorial";
import { PREDICTABILITY_RULES as P, checkCase, dilemmaCase, itemCase, replyContradictions, report, type PlainCase } from "./predictability";
import { SAMPLE_CASES, SAMPLE_DILEMMAS, sampleItem } from "./redesign/sample";
import { JUDGMENT_DIMS, judge } from "./judgment";

const bankCases = () => COMPANIES.flatMap((p) => withBank(p).items.map((i) => itemCase(i, p.id, (RED_LINES[i.id] ?? []).map((r) => r.option))));
const sampleCases = (): PlainCase[] => SAMPLE_CASES.map((c) => itemCase(sampleItem(c), c.company));
const sampleDilemmas = (): PlainCase[] => SAMPLE_DILEMMAS.map(dilemmaCase);

describe("detector de respuestas predecibles", () => {
  it("detecta la trampa clásica: la opción larga y con palabras de manual es la única buena", () => {
    const c = checkCase({ id: "x", source: "t", options: [
      { id: "a", text: "Ignorarlo.", score: 0 },
      { id: "b", text: "Escuchar a todos en privado, acordar un plan por etapas con fecha y meta medible, y revisar juntos.", score: 3 },
      { id: "c", text: "Regañarlo frente a todos.", score: 0 },
    ] });
    expect(c.flags).toEqual(expect.arrayContaining(["largo", "desbalance_largo", "manual", "caricatura", "pocas_razonables", "mejor_unica"]));
  });
  it("un caso balanceado pasa limpio", () => {
    const c = checkCase({ id: "y", source: "t", options: [
      { id: "a", text: "Subir 4 % en cortes de res y empujar el cerdo.", score: 3, effects: { margen: 3, clientes: -2 } },
      { id: "b", text: "Cambiar de proveedor tras una prueba ciega con clientes.", score: 3, effects: { margen: 2, caja: -2 } },
      { id: "c", text: "Absorber un trimestre y renegociar por volumen anual.", score: 2, effects: { clientes: 2, margen: -3 } },
    ] });
    expect(c.flags).toEqual([]);
  });
});

describe("contenido actual: línea base (no debe empeorar)", () => {
  // Línea base medida el 2-nov-2026 antes del rediseño. Si el banco mejora, se bajan estos topes.
  it("casos del banco y dilemas: los indicadores de predictibilidad no empeoran", () => {
    const b = report(bankCases());
    const d = report(DILEMMAS.map(dilemmaCase));
    expect(b.longestBestRate).toBeLessThanOrEqual(0.97);
    expect(b.medianLengthRatio).toBeLessThanOrEqual(1.7);
    // Dilemas: la versión 1 medía 0.98; la versión 2 tiene sus propios criterios estrictos (abajo).
    expect(d.longestBestRate).toBeLessThanOrEqual(P.maxLongestBestRate);
    expect(replyContradictions(COMPANIES.flatMap((p) => withBank(p).items))).toEqual([]);
  });
});

describe("dilemas versión 2 (en producción): mismos criterios estrictos que la muestra", () => {
  const cases = () => DILEMMAS.map(dilemmaCase);
  it("la longitud no delata la respuesta y no hay posición favorita", () => {
    const r = report(cases());
    expect(r.lengthLift).toBeLessThanOrEqual(P.maxLengthLift);
    expect(r.shortestBestRate - r.topChance).toBeLessThanOrEqual(P.maxLengthLift);
    for (const share of r.topPositionShare) expect(share).toBeLessThanOrEqual(P.maxPositionShare);
    expect(r.markersBestRate).toBeLessThanOrEqual(P.maxMarkersBestRate);
  });
  it("opciones de largo parecido, sin caricaturas, al menos dos razonables y ninguna dominante", () => {
    for (const c of cases()) {
      const k = checkCase(c);
      expect(k.lengthRatio, c.id).toBeLessThanOrEqual(P.maxLengthRatio);
      expect(k.caricatures, c.id).toEqual([]);
      expect(k.reasonable, c.id).toBeGreaterThanOrEqual(P.minReasonable);
      expect(k.dominant, c.id).toBeNull();
    }
  });
  it("«la más larga es la mejor» por debajo del umbral y la peor no es siempre la más corta", () => {
    const r = report(cases());
    expect(r.longestBestRate).toBeLessThanOrEqual(P.maxLongestBestRate);
    expect(r.shortestWorstRate).toBeLessThanOrEqual(0.5);
  });
});

describe("muestra rediseñada: criterios estrictos", () => {
  const all = () => [...sampleCases(), ...sampleDilemmas()];
  it("elegir la más larga no da ventaja sobre el azar (ni elegir la más corta)", () => {
    for (const r of [report(sampleCases()), report(sampleDilemmas()), report(all())]) {
      expect(r.lengthLift).toBeLessThanOrEqual(P.maxLengthLift);
      expect(r.shortestBestRate - r.topChance).toBeLessThanOrEqual(P.maxLengthLift);
    }
  });
  it(`con una sola mejor respuesta, «la más larga es la mejor» < ${P.maxLongestBestRate * 100} %`, () => {
    expect(report(all()).uniqueLongestBestRate).toBeLessThan(P.maxLongestBestRate);
  });
  it("opciones de largo parecido en cada caso (más larga ≤ 1.3 × la más corta)", () => {
    for (const c of all()) expect(checkCase(c).lengthRatio, c.id).toBeLessThanOrEqual(P.maxLengthRatio);
  });
  it("ninguna posición concentra las mejores respuestas", () => {
    const r = report(all());
    for (const share of r.topPositionShare) expect(share).toBeLessThanOrEqual(P.maxPositionShare);
  });
  it("tampoco hay atajo para descartar: la peor no es siempre la más corta ni cae siempre en el mismo lugar", () => {
    const r = report(all());
    expect(r.shortestWorstRate).toBeLessThanOrEqual(0.5);
    for (const share of r.worstPositionShare) expect(share).toBeLessThanOrEqual(P.maxPositionShare);
  });
  it("la que «suena a manual» no es la mejor más que el umbral", () => {
    expect(report(all()).markersBestRate).toBeLessThanOrEqual(P.maxMarkersBestRate);
  });
  it("sin caricaturas, al menos dos alternativas razonables y ninguna opción dominante", () => {
    for (const c of all()) {
      const k = checkCase(c);
      expect(k.caricatures, c.id).toEqual([]);
      expect(k.reasonable, c.id).toBeGreaterThanOrEqual(P.minReasonable);
      expect(k.dominant, c.id).toBeNull();
    }
  });
  it("cada opción tiene beneficio y costo en indicadores, y su balance escrito", () => {
    for (const c of SAMPLE_CASES) for (const o of c.options) {
      const v = Object.values(o.effects);
      expect(v.some((x) => (x ?? 0) > 0), `${c.id}/${o.id}`).toBe(true);
      expect(v.some((x) => (x ?? 0) < 0), `${c.id}/${o.id}`).toBe(true);
      expect(o.benefits.length && o.costs.length && o.risks.length, `${c.id}/${o.id}`).toBeTruthy();
    }
  });
  it("la mejor en criterio no es siempre la de mejor efecto neto en números (criterio ≠ resultado)", () => {
    const net = (e: Record<string, number | undefined>) => Object.values(e).reduce<number>((a, x) => a + (x ?? 0), 0);
    let aligned = 0;
    for (const c of SAMPLE_CASES) {
      const top = Math.max(...c.options.map((o) => net(o.effects)));
      const maxScore = Math.max(...c.options.map((o) => o.score));
      if (c.options.filter((o) => net(o.effects) === top).every((o) => o.score === maxScore)) aligned++;
    }
    expect(aligned / SAMPLE_CASES.length).toBeLessThan(0.75);
  });
  it("el puntaje editorial coincide con la rúbrica (5 dimensiones autorales + prioriza neutral)", () => {
    for (const c of SAMPLE_CASES) for (const o of c.options) {
      const j = judge(o.judgment, 1);
      expect(JUDGMENT_DIMS.every((d) => j.dims[d] >= 0 && j.dims[d] <= 2)).toBe(true);
      expect(Math.abs(j.level - o.score), `${c.id}/${o.id}: rúbrica ${j.level} vs puntaje ${o.score}`).toBeLessThanOrEqual(1);
    }
  });
  it("lo que contesta cada personaje es coherente con su relación (0 contradicciones)", () => {
    expect(replyContradictions(SAMPLE_CASES.map(sampleItem))).toEqual([]);
  });
  it("cada dilema tiene al menos dos respuestas de criterio alto y cada opción dice qué cuesta", () => {
    for (const d of SAMPLE_DILEMMAS) {
      expect(d.options.filter((o) => o.score >= 3).length, d.id).toBeGreaterThanOrEqual(2);
      for (const o of d.options) expect(o.cost.length, d.id).toBeGreaterThan(10);
    }
  });
});

/** Reporte para revisión: SIM_REPORT=1 npx vitest run src/lib/ceo/predictability.test.ts → docs/editorial/predictibilidad.json */
it.runIf(process.env.SIM_REPORT === "1")("genera docs/editorial/predictibilidad.json", async () => {
  const { mkdirSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const strip = (r: ReturnType<typeof report>) => { const { checks, ...rest } = r; return { ...rest, flags: checks.reduce<Record<string, number>>((a, c) => { c.flags.forEach((f) => (a[f] = (a[f] ?? 0) + 1)); return a; }, {}) }; };
  const out = {
    reglas: P,
    banco: strip(report(bankCases())),
    dilemas: strip(report(DILEMMAS.map(dilemmaCase))),
    contradicciones: replyContradictions(COMPANIES.flatMap((p) => withBank(p).items)).length,
    muestraCasos: strip(report(sampleCases())),
    muestraDilemas: strip(report(sampleDilemmas())),
    muestraContradicciones: replyContradictions(SAMPLE_CASES.map(sampleItem)).length,
    originales: strip(report(SAMPLE_CASES.map((c) => bankCases().find((b) => b.id === c.original)!))),
    originalesDilemas: strip(report(SAMPLE_DILEMMAS.map((d) => dilemmaCase(DILEMMAS.find((x) => x.id === d.original)!)))),
    porCaso: [...sampleCases(), ...sampleDilemmas()].map((c) => checkCase(c)),
  };
  const dir = join(process.cwd(), "..", "docs", "editorial");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "predictibilidad.json"), JSON.stringify(out, null, 1));
});
