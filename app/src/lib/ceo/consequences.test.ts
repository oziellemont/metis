/**
 * Consecuencias diferidas reales (v6): la cadena de mantenimiento de la envasadora en Cumbre.
 *
 * Lo que se prueba:
 *  1. Solo llega en periodos v6: las temporadas (v5) y los periodos continuos v4 no cambian.
 *  2. Caminos distintos llevan a problemas distintos (no el mismo castigo con otro nombre).
 *  3. La consecuencia es incierta pero estable: el azar sale del periodo, la misma partida se reproduce igual,
 *     y la frecuencia coincide con lo que el caso le dice al jugador («entre 3 y 4 de cada 10»).
 *  4. Causalidad: nada llega antes de la decisión que lo causa, y la pantalla lo conecta con esa decisión.
 *  5. El historial no se reinterpreta: un periodo cerrado sin este asunto no lo cuenta como vencido.
 */
import { describe, expect, it } from "vitest";
import { DAY, decide, entries, inRoll, newState, rollOf, seasonItems, setupCompany } from "./engine";
import { continuityOf } from "./continuity";
import { evidenceOf } from "./mastery";
import { companyById } from "./companies";
import { MANTENIMIENTO } from "./companies/cumbre-mantenimiento";
import { LEGACY_CONTINUOUS_RULES_VERSION } from "./rules";
import type { CeoState } from "./types";

const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
const CHAIN = MANTENIMIENTO.map((i) => i.id);
const own = (start: number, rulesVersion?: number): CeoState =>
  setupCompany({ ...newState(), name: "Oziel", alias: "oziel", startedAt: start }, { companyId: CID, sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: "Casa Norte" }, start, rulesVersion);
/** Busca un inicio de periodo cuyo azar cumpla la condición (el azar es estable por periodo). */
function startWhere(ok: (s: CeoState) => boolean): CeoState {
  for (let k = 0; k < 500; k++) { const s = own(T0 + k * 3_600_000); if (ok(s)) return s; }
  throw new Error("sin inicio que cumpla");
}
const late = (s: CeoState) => (s.startedAt ?? 0) + 30 * DAY;
/** Decide un asunto en cuanto llega (falla si no llegó: así se prueba que el camino sí existe). */
function play(s: CeoState, id: string, opt: string): CeoState {
  const e = entries(s, late(s)).find((x) => x.item.id === id);
  if (!e) throw new Error(`${id} no llegó`);
  return decide(s, id, opt, e.arrivesAt + 60_000);
}
/** Qué asuntos de la cadena le llegan (cuando todo lo demás ya pasó). */
const chainOf = (s: CeoState, now = late(s)) => entries(s, now).filter((e) => CHAIN.includes(e.item.id)).map((e) => e.item.id).sort();

describe("Consecuencias diferidas · versiones", () => {
  it("la decisión de mantenimiento llega en periodos v6 y no en v4 ni en temporadas", () => {
    expect(seasonItems(own(T0)).some((i) => i.id === "d2-mantenimiento")).toBe(true);
    expect(seasonItems(own(T0, LEGACY_CONTINUOUS_RULES_VERSION)).some((i) => CHAIN.includes(i.id))).toBe(false);
    const season: CeoState = { ...newState(), name: "Oziel", alias: "oziel", company: "cumbre", startedAt: T0, rulesVersion: 5 };
    expect(seasonItems(season).some((i) => CHAIN.includes(i.id))).toBe(false);
  });
  it("todas las consecuencias de la cadena llegan después de su detonador y nunca el mismo día", () => {
    const by = new Map(MANTENIMIENTO.map((i) => [i.id, i]));
    for (const it of MANTENIMIENTO) if (it.trigger) expect(by.get(it.trigger.item)!.day, it.id).toBeLessThan(it.day);
  });
});

describe("Consecuencias diferidas · caminos distintos, problemas distintos", () => {
  it("hacer el mantenimiento ahora: el problema es recuperar la producción con la gente (sin falla ni reclamo)", () => {
    const s = play(own(T0), "d2-mantenimiento", "a");
    expect(chainOf(s)).toEqual(["c-mant-sabados", "d2-mantenimiento"]);
    expect(companyById("cumbre").items.find((i) => i.id === "c-mant-sabados")!.areas).toContain("personas");
  });
  it("posponer y que falle: falla → parche → reclamo del cliente → inversión correctiva más cara", () => {
    let s = startWhere((x) => inRoll(x, "d2-mantenimiento", [0, 0.4]) && inRoll(x, "c-mant-falla", [0, 0.7]));
    s = play(s, "d2-mantenimiento", "b");
    const falla = entries(s, late(s)).find((x) => x.item.id === "c-mant-falla")!;
    expect(chainOf(s, falla.arrivesAt + 60_000)).toEqual(["c-mant-falla", "d2-mantenimiento"]);
    s = play(s, "c-mant-falla", "b");
    s = play(s, "c-mant-queja", "a");
    expect(chainOf(s)).toEqual(["c-mant-falla", "c-mant-inversion", "c-mant-queja", "d2-mantenimiento"]);
    // la inversión correctiva cuesta más que el mantenimiento que se pospuso
    const inv = companyById("cumbre").items.find((i) => i.id === "c-mant-inversion")!;
    expect(inv.data!.rows.find((r) => r[0].startsWith("Reconstrucción"))![1]).toMatch(/\$5\.2 M/);
  });
  it("posponer y que falle, pero arreglar de fondo: no hay reclamo ni inversión", () => {
    let s = startWhere((x) => inRoll(x, "d2-mantenimiento", [0, 0.4]));
    s = play(play(s, "d2-mantenimiento", "b"), "c-mant-falla", "a");
    expect(chainOf(s)).toEqual(["c-mant-falla", "d2-mantenimiento"]);
  });
  it("posponer y que el parche aguante: la cadena se detiene (la consecuencia es incierta)", () => {
    let s = startWhere((x) => inRoll(x, "d2-mantenimiento", [0, 0.4]) && inRoll(x, "c-mant-falla", [0.7, 1]));
    s = play(play(s, "d2-mantenimiento", "b"), "c-mant-falla", "b");
    expect(chainOf(s)).toEqual(["c-mant-falla", "d2-mantenimiento"]);
  });
  it("posponer y que no falle: otro problema (rendimiento, merma y horas extra), no la falla", () => {
    const s = play(startWhere((x) => inRoll(x, "d2-mantenimiento", [0.4, 1])), "d2-mantenimiento", "b");
    expect(chainOf(s)).toEqual(["c-mant-rendimiento", "d2-mantenimiento"]);
  });
  it("no decidir equivale a posponer, y no atender la falla equivale a parcharla: la cadena sigue", () => {
    const s = startWhere((x) => inRoll(x, "d2-mantenimiento", [0, 0.4]) && inRoll(x, "c-mant-falla", [0, 0.7]));
    expect(chainOf(s)).toEqual(["c-mant-falla", "c-mant-inversion", "c-mant-queja", "d2-mantenimiento"]);
    const quiet = startWhere((x) => inRoll(x, "d2-mantenimiento", [0, 0.4]) && inRoll(x, "c-mant-falla", [0.7, 1]));
    expect(chainOf(quiet)).toEqual(["c-mant-falla", "d2-mantenimiento"]);
  });
  it("arreglo parcial: a veces aparece lo que no se revisó (el dosificador); a veces nada", () => {
    const hit = play(startWhere((x) => inRoll(x, "d2-mantenimiento", [0, 0.35])), "d2-mantenimiento", "c");
    expect(chainOf(hit)).toEqual(["c-mant-dosificador", "d2-mantenimiento"]);
    const miss = play(startWhere((x) => inRoll(x, "d2-mantenimiento", [0.35, 1])), "d2-mantenimiento", "c");
    expect(chainOf(miss)).toEqual(["d2-mantenimiento"]);
  });
  it("los cuatro caminos de la primera decisión terminan en conjuntos de problemas distintos", () => {
    const s0 = startWhere((x) => inRoll(x, "d2-mantenimiento", [0, 0.35]));
    const paths = ["a", "b", "c"].map((o) => chainOf(play(s0, "d2-mantenimiento", o)).join("|"));
    expect(new Set(paths).size).toBe(3);
  });
});

describe("Consecuencias diferidas · incertidumbre honesta y estable", () => {
  it("el azar es estable: el mismo periodo da el mismo resultado; no depende del nombre ni de la hora de decidir", () => {
    const a = own(T0), b = { ...own(T0), name: "Otra persona", alias: "otra" };
    expect(rollOf(a, "d2-mantenimiento")).toBe(rollOf(b, "d2-mantenimiento"));
    const early = play(a, "d2-mantenimiento", "b");
    const e = entries(a, late(a)).find((x) => x.item.id === "d2-mantenimiento")!;
    const later = decide(a, "d2-mantenimiento", "b", e.arrivesAt + 3 * 3_600_000);
    expect(chainOf(early)).toEqual(chainOf(later));
  });
  it("la frecuencia de falla coincide con lo que el caso le dice al jugador (entre 3 y 4 de cada 10)", () => {
    const N = 400;
    let fails = 0;
    for (let k = 0; k < N; k++) if (inRoll({ startedAt: T0 + k * 7_919_000 }, "d2-mantenimiento", [0, 0.4])) fails++;
    expect(fails / N).toBeGreaterThan(0.3);
    expect(fails / N).toBeLessThan(0.5);
    const d2 = companyById("cumbre").items.find((i) => i.id === "d2-mantenimiento")!;
    expect(JSON.stringify(d2.data)).toMatch(/entre 3 y 4 de cada 10/);
    expect(JSON.stringify(d2.data)).toMatch(/no certezas/);
  });
});

describe("Consecuencias diferidas · causalidad visible e historial intacto", () => {
  it("la falla llega después de la decisión y la pantalla la conecta con lo que decidiste", () => {
    let s = startWhere((x) => inRoll(x, "d2-mantenimiento", [0, 0.4]));
    const d = entries(s, late(s)).find((x) => x.item.id === "d2-mantenimiento")!;
    s = decide(s, "d2-mantenimiento", "b", d.arrivesAt + 60_000);
    const f = entries(s, late(s)).find((x) => x.item.id === "c-mant-falla")!;
    expect(f.arrivesAt).toBeGreaterThan(d.arrivesAt + 60_000);
    const links = continuityOf(s, "c-mant-falla", f.arrivesAt + 60_000).links;
    expect(links[0].kind).toBe("detonador");
    expect(links[0].text).toMatch(/Mantenimiento mayor de la envasadora/);
  });
  it("un periodo cerrado con reglas anteriores no cuenta la cadena como vencida", () => {
    const s = own(T0);
    const closed: CeoState = { ...s, career: [{ company: "cumbre", tier: 0, rulesVersion: 4, startedAt: T0 - 40 * DAY, endedAt: T0 - 10 * DAY, kpis: companyById("cumbre").kpiStart, health: 60, answered: 1, passed: true, xp: 0, decisions: {} }] };
    const ev = evidenceOf({ ...closed, startedAt: null }).filter((e) => e.run === 0 && e.kind === "expired");
    const v6: CeoState = { ...closed, career: [{ ...closed.career[0], rulesVersion: 6 }] };
    const ev6 = evidenceOf({ ...v6, startedAt: null }).filter((e) => e.run === 0 && e.kind === "expired");
    expect(ev6.length - ev.length).toBe(1); // solo d2-mantenimiento (las consecuencias nunca cuentan como vencidas)
  });
});
