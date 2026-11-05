/**
 * Motor V7: la auditoría ética. Mismos números que V6; solo cambian las líneas roja que cuentan desde v7.
 * Lo que se prueba:
 *  1. Versiones: las líneas rojas «desde v7» no cuentan en periodos v6 ni antes (el historial no se reinterpreta).
 *  2. Nadie aprueba de forma sistemática con conductas antiéticas, inseguras o irresponsables: las estrategias que
 *     solo miran el número (aunque cuiden el piso) reprueban la mayoría de los meses, y por línea roja.
 *  3. Las estrategias razonables siguen aprobando, incluida «personas primero con piso» en las seis empresas.
 *  4. Todo con semillas y horas de inicio que NO se usaron para calibrar (otra muestra de consecuencias inciertas).
 */
import { describe, expect, it } from "vitest";
import { DAY, H, verdictOf } from "./engine";
import { BANK_RED_LINES, RED_LINES, isRedLine } from "./editorial";
import { CONTINUOUS_RULES_VERSION, ruleSet } from "./rules";
import { SIM_T0, playCareer } from "./season-sim";

const COS = ["cumbre", "forja", "brasa", "kubit", "puntomadero", "vertice"];
const MONTHS = 3;
const T = 240_000;
/** Hora de inicio y prefijo de semilla que no se usaron para calibrar ni en el diagnóstico. */
const T0 = SIM_T0 + 41 * DAY + 5 * H;
const memo = new Map<string, ReturnType<typeof playCareer>>();
const career = (c: string, st: string) => {
  const k = `${c}|${st}`;
  if (!memo.has(k)) memo.set(k, playCareer(c, st, MONTHS, `v7-holdout|${c}|${st}`, 7, T0));
  return memo.get(k)!;
};
const months = (st: string) => COS.flatMap((c) => career(c, st).months);
const passRate = (st: string) => { const ms = months(st); return ms.filter((m) => m.passed).length / ms.length; };
const reasons = (st: string) => {
  const out: Record<string, number> = {};
  for (const m of months(st)) if (!m.passed) for (const r of verdictOf(m.state, m.at).v5?.reasons ?? []) out[r] = (out[r] ?? 0) + 1;
  return out;
};

describe("V7 · versiones", () => {
  it("v7 sigue publicada (sus periodos no cambian) y tiene los mismos números que v6; la carrera vigente ya es v8", () => {
    expect(CONTINUOUS_RULES_VERSION).toBe(8);
    const { version: _a, ...r6 } = ruleSet(6) as unknown as Record<string, unknown>;
    const { version: _b, ...r7 } = ruleSet(7) as unknown as Record<string, unknown>;
    expect(r7).toEqual(r6);
  });
  it("las líneas rojas desde v7 no cuentan en v6 ni antes; las de siempre cuentan en todas", () => {
    expect(isRedLine("kb-d3-demo", "b", 7)).toBe(true);
    expect(isRedLine("kb-d3-demo", "b", 6)).toBe(false);
    expect(isRedLine("c-mant-dosificador", "b", 7)).toBe(true);
    expect(isRedLine("c-mant-dosificador", "b", 6)).toBe(false);
    expect(isRedLine("bk-forja-meta-1", "b", 7)).toBe(true);
    expect(isRedLine("bk-forja-meta-1", "b", 6)).toBe(false);
    const always = Object.entries(RED_LINES).flatMap(([id, rs]) => rs.filter((r) => !r.since).map((r) => [id, r.option] as const));
    expect(always.length).toBeGreaterThan(0);
    for (const [id, o] of always) { expect(isRedLine(id, o, 6), id).toBe(true); expect(isRedLine(id, o, 4), id).toBe(true); }
    for (const rs of Object.values(BANK_RED_LINES)) for (const r of rs) expect(r.since).toBe(7);
  });
});

describe("V7 · nadie aprueba sistemáticamente cruzando líneas (semillas y horas nuevas)", () => {
  it("«mejor efecto» y «números con piso» reprueban la mayoría de los meses, sobre todo por línea roja", () => {
    for (const st of ["mejor_efecto", "numeros_con_piso"]) {
      expect(passRate(st), st).toBeLessThan(0.5);
      const r = reasons(st);
      expect(r.linea_roja ?? 0, st).toBeGreaterThan(0);
    }
  }, T);
  it("«ética flexible» (números primero, sin cruzar líneas) nunca reprueba por línea roja", () => {
    expect(reasons("etica_flexible").linea_roja ?? 0).toBe(0);
  }, T);
});

describe("V7 · los caminos razonables siguen abiertos (semillas y horas nuevas)", () => {
  it("criterio y tablero ≥ 80 %; cuida caja ≥ 70 %", () => {
    expect(passRate("criterio_y_tablero")).toBeGreaterThanOrEqual(0.8);
    expect(passRate("cuida_caja")).toBeGreaterThanOrEqual(0.7);
  }, T);
  it("personas primero con piso ≥ 70 % y aprueba al menos un mes en cada empresa", () => {
    expect(passRate("personas_con_piso")).toBeGreaterThanOrEqual(0.7);
    for (const c of COS) expect(career(c, "personas_con_piso").months.some((m) => m.passed), c).toBe(true);
  }, T);
  it("«segunda mejor» sigue sin aprobar: elegir de forma sistemática la opción defendible pero no la mejor no basta", () => {
    expect(passRate("segunda_mejor")).toBeLessThan(0.2);
  }, T);
});
