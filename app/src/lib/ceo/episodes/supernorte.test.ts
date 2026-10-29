import { describe, expect, it } from "vitest";
import type { EpisodeRun } from "./contracts";
import { advisorAnswer, applyEpisode, matchFact, startEpisode, strategiesFor, type EpisodeAction } from "./engine";
import { SN, SUPERNORTE, deriveSuperNorte, economicsSuperNorte } from "./supernorte";
import { allEnds, lintEpisode } from "./validate";

const T0 = 5_000_000;

/** Arranca con memoria/azar controlados (sin depender de la semilla). */
function start(flags: string[] = []): EpisodeRun {
  const r = startEpisode(SUPERNORTE, T0, { runId: "prueba" });
  const base = { ...r, flags: [...flags] };
  return { ...base, terms: { ...base.terms, ...deriveSuperNorte(base) } };
}
type Step = EpisodeAction extends infer A ? (A extends EpisodeAction ? Omit<A, "at"> : never) : never;
function play(run: EpisodeRun, steps: Step[]): EpisodeRun {
  let r = run;
  steps.forEach((s, i) => {
    const out = applyEpisode(SUPERNORTE, r, { ...s, at: T0 + 1000 * (i + 1) } as EpisodeAction);
    if (out.error) throw new Error(`${(s as { strategy?: string }).strategy ?? s.type}: ${out.error}`);
    r = out.run;
  });
  return r;
}
const d = (strategy: string, params?: Record<string, number>) => ({ type: "decide" as const, strategy, ...(params ? { params } : {}) });

/** Ruta 1: aceptar todo de entrada (ruta corta, cede sin contrapartida). */
const RUTA_ACEPTA = [{ type: "begin" as const }, d("aceptar"), d("linea"), d("pagar"), d("formalizar"), d("tablero")];
/** Ruta 2: explorar intereses, paquete, contrapartida, revisión, formalizar y plan. */
const RUTA_EXPLORA = [
  { type: "fact" as const, factId: "plazo" }, { type: "fact" as const, factId: "metas" }, { type: "advisor" as const, id: "hector" },
  { type: "begin" as const }, d("explorar"), d("paquete", { descuento: 1.5, promo: 1.5, plazo: 60 }), d("contrapartida"), d("revision"), d("formalizar"), d("tablero"),
];

describe("SuperNorte · grafo editorial", () => {
  it("pasa la validación: todas las rutas tienen de 3 a 6 decisiones y cierran", () => {
    expect(lintEpisode(SUPERNORTE)).toEqual([]);
    const lens = new Set(allEnds(SUPERNORTE).map((e) => e.length));
    expect([...lens].every((l) => l >= 4 && l <= 6)).toBe(true);
  }, 60_000);

  it("el piloto tiene las etapas pedidas: postura, propuesta, objeción, defensa, cierre y plan", () => {
    const stages = new Set(Object.values(SUPERNORTE.nodes).map((n) => n.stage));
    for (const s of ["Postura", "Propuesta", "Objeción", "Defensa", "Cierre", "Plan"]) expect(stages).toContain(s);
    expect(SUPERNORTE.approval).toBe("borrador");
  });
});

describe("SuperNorte · preparación", () => {
  it("las consultas responden solo con hechos del banco; lo que no existe se dice así", () => {
    const m1 = matchFact(SUPERNORTE, "¿cuánto nos cuesta pasar a 90 días de plazo?");
    expect(m1?.kind === "fact" && m1.fact.id).toBe("plazo");
    const m2 = matchFact(SUPERNORTE, "¿qué ofreció la regional exactamente?");
    expect(m2?.kind).toBe("unknown");
    expect(matchFact(SUPERNORTE, "¿quién ganó el partido de futbol ayer?")).toBeNull();
    const r = play(start(), [{ type: "fact", factId: "rotacion" }]);
    expect(r.queries[0].answer).toBe(SUPERNORTE.facts.facts.find((f) => f.id === "rotacion")!.answer);
  });

  it("una pregunta sin dato no gasta la consulta", () => {
    const r0 = start();
    const bad = applyEpisode(SUPERNORTE, r0, { type: "fact", at: T0 + 1, text: "¿quién ganó el partido de futbol ayer?" });
    expect(bad.error).toBeTruthy();
    expect(bad.run.queries.length).toBe(0);
  });

  it("los colaboradores opinan sin dictar la respuesta (no repiten ninguna opción)", () => {
    const options = Object.values(SUPERNORTE.nodes).flatMap((n) => n.strategies.map((s) => s.text.toLowerCase()));
    for (const a of SUPERNORTE.advisors) for (const fl of [[], ["comio"]]) {
      const txt = advisorAnswer(SUPERNORTE, start(fl), a).toLowerCase();
      for (const o of options) expect(txt.includes(o)).toBe(false);
      expect(txt).not.toMatch(/elige|escoge|la opción/);
    }
  });

  it("Héctor recuerda si comiste con él (memoria de la temporada)", () => {
    const h = SUPERNORTE.advisors.find((a) => a.id === "hector")!;
    expect(advisorAnswer(SUPERNORTE, start(["comio"]), h)).toMatch(/comida/);
    expect(advisorAnswer(SUPERNORTE, start(), h)).not.toMatch(/comida/);
    const r = startEpisode(SUPERNORTE, T0, { decisions: { "d1-hector": { option: "a" } }, runId: "x" });
    expect(r.flags).toContain("comio");
  });

  it("el azar (capacidad de la regional) es reproducible por partida", () => {
    const a = startEpisode(SUPERNORTE, T0, { runId: "misma" }).flags;
    const b = startEpisode(SUPERNORTE, T0 + 99, { runId: "misma" }).flags;
    expect(a).toEqual(b);
  });
});

describe("SuperNorte · rutas divergentes", () => {
  it("ruta corta (aceptar): 5 decisiones, acuerdo caro, riesgos de caja y de precedente", () => {
    const r = play(start(), RUTA_ACEPTA);
    expect(r.phase).toBe("closed");
    expect(r.turns.map((t) => t.node)).toEqual(["d1", "d2b", "d3b", "d5", "d6"]);
    const o = r.outcome!;
    expect(o.headline).toMatch(/Acuerdo con SuperNorte/);
    expect(o.followUps.map((f) => f.id).sort()).toEqual(["sn-caja", "sn-precedente"]);
    expect(o.kpi.find((k) => k.key === "margen")!.delta).toBeLessThan(0);
    expect(o.kpi.find((k) => k.key === "consejo")?.delta).toBe(-2);
    expect(o.evidence.find((e) => e.dim === "negociacion")!.level).toBe(0);
  });

  it("ruta larga (explorar): 6 decisiones, acuerdo con contrapartidas, seguimiento con tablero", () => {
    const r = play(start(), RUTA_EXPLORA);
    expect(r.phase).toBe("closed");
    expect(r.turns.length).toBe(6);
    expect(r.terms.estado).toBe(2);
    const o = r.outcome!;
    expect(o.followUps.map((f) => f.id).sort()).toEqual(["sn-caja", "sn-revision", "sn-sellout"]);
    expect(o.followUps.find((f) => f.id === "sn-sellout")!.text.join(" ")).toMatch(/tablero/);
    expect(o.commitments.map((c) => c.id)).toEqual(expect.arrayContaining(["sn-anaquel", "sn-tablero", "sn-responsable"]));
    expect(o.kpi.find((k) => k.key === "consejo")).toBeUndefined();
  });

  it("dos jugadores en rutas distintas reciben seguimientos coherentes con lo que hicieron", () => {
    const a = play(start(), RUTA_ACEPTA).outcome!;
    const b = play(start(), RUTA_EXPLORA).outcome!;
    expect(a.headline).not.toBe(b.headline);
    expect(a.followUps.some((f) => f.id === "sn-sellout")).toBe(false);
    expect(b.followUps.some((f) => f.id === "sn-precedente")).toBe(false);
    expect(a.followUps.find((f) => f.id === "sn-caja")!.text.join(" ")).toMatch(/90 días/);
    expect(b.followUps.find((f) => f.id === "sn-caja")!.text.join(" ")).toMatch(/75 días/);
  });

  it("sin acuerdo: pierde el frente en 140 tiendas y llega el aviso de reasignación", () => {
    const r = play(start(), [{ type: "begin" }, d("firme"), d("nada"), d("sostener"), d("defender"), d("no_firmar")]);
    expect(r.terms.estado).toBe(0);
    expect(r.outcome!.followUps.map((f) => f.id)).toEqual(["sn-anaquel"]);
    expect(r.outcome!.kpi.find((k) => k.key === "clientes")!.delta).toBe(-6);
  });

  it("si la regional sí tiene capacidad, Sofía se endurece y el cierre lo explica como factor externo", () => {
    const base = play(start(), RUTA_EXPLORA);
    const luck = play(start(["regional_capaz"]), RUTA_EXPLORA);
    expect(luck.terms.need).toBe(base.terms.need + 1);
    expect(luck.outcome!.luck).toMatch(/Fuera de tu control/);
  });

  it("la opción diplomática no se premia sola: firmar con 3.1% de margen deja evidencia baja", () => {
    const r = play(start(), RUTA_ACEPTA);
    const neg = r.outcome!.evidence.filter((e) => e.dim === "negociacion").map((e) => e.level);
    expect(Math.max(...neg)).toBeLessThanOrEqual(2);
  });
});

describe("SuperNorte · consecuencias y economía", () => {
  it("no hay cambios de KPI ni desenlace antes del cierre", () => {
    const r = play(start(), RUTA_EXPLORA.slice(0, 7));
    expect(r.phase).toBe("deciding");
    expect(r.outcome).toBeNull();
    expect(r.xp).toBeNull();
  });

  it("números declarados: 1 pt = $1.27 M; 30 días ≈ $10.4 M de caja al 12%", () => {
    const base = start();
    const run = { ...base, terms: { ...base.terms, descuento: 4, plazo: 90 } };
    const x = economicsSuperNorte(run);
    expect(x.estado).toBe(2);
    expect(x.costoDesc).toBeCloseTo(4 * SN.rate, 1);
    expect(x.wc).toBeCloseTo(10.4, 1);
    expect(x.financing).toBeCloseTo(1.3, 1);
    expect(x.net).toBeCloseTo(-6.3, 1);
    expect(x.marginAfter).toBeCloseTo(3.1, 5);
  });

  it("los KPI se recortan a ±10 y cada uno explica su regla", () => {
    const r = play(start(), [{ type: "begin" }, d("firme"), d("nada"), d("sostener"), d("defender"), d("no_firmar")]);
    for (const k of r.outcome!.kpi) {
      expect(Math.abs(k.delta)).toBeLessThanOrEqual(10);
      expect(k.why.length).toBeGreaterThan(10);
    }
  });

  it("XP: 20 por decisión + 40 al cerrar, una sola vez", () => {
    const r = play(start(), RUTA_EXPLORA);
    expect(r.xp).toBe(6 * 20 + 40);
    const again = applyEpisode(SUPERNORTE, r, { type: "decide", at: T0 + 99_000, strategy: "tablero" });
    expect(again.error).toBeTruthy();
    expect(again.run.xp).toBe(r.xp);
  });

  it("formalizar solo aparece cuando Sofía puede aceptar", () => {
    const r = play(start(), [{ type: "begin" }, d("firme"), d("nada"), d("sostener"), d("defender")]);
    expect(r.node).toBe("d5");
    const ids = strategiesFor(SUPERNORTE, r).map((s) => s.id);
    expect(ids).not.toContain("formalizar");
    expect(ids).toContain("no_firmar");
  });
});
