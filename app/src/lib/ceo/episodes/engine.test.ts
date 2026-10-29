import { describe, expect, it } from "vitest";
import { BRIEFING_MS, MAX_DECISIONS, MIN_DECISIONS, type EpisodeSpec } from "./contracts";
import { applyEpisode, briefingLeftMs, episodeXp, holds, matchFact, pickRun, queriesLeft, render, replayEpisode, sanitizeRun, startEpisode, strategiesFor, type EpisodeAction } from "./engine";
import { registerRules } from "./rules";
import { allPaths, lintEpisode } from "./validate";

/** Caso mínimo de prueba: 3 decisiones, una rama que se reúne y un parámetro. */
const SPEC: EpisodeSpec = {
  contract: 1, id: "prueba", version: "0.0.1", approval: "borrador", company: "cumbre", industry: "alimentos",
  title: "Prueba", subject: "Prueba", from: "sofia", channel: "email", areas: ["negociacion"], cast: ["sofia", "lucia"],
  lesson: "negociacion", concept: { title: "C", text: "T", nota: "N" }, minutes: 6,
  briefing: { message: ["Hola"], context: { title: "Datos", rows: [["Ventas", "$1"]] } },
  facts: {
    version: 1, missing: "No hay un dato que responda eso.",
    facts: [
      { id: "margen", label: "¿Margen?", keywords: ["margen", "rentabilidad"], answer: "El margen es 7.1%.", source: "lucia" },
      { id: "rotacion", label: "¿Rotación?", keywords: ["rotacion", "rotan"], answer: "1.4 veces.", source: "datos" },
      { id: "caja", label: "¿Caja?", keywords: ["caja", "capital"], answer: "$10 M.", source: "lucia" },
      { id: "seguridad", label: "Seguridad", keywords: ["seguridad"], answer: "Siempre visible.", source: "datos", critical: true },
    ],
    unknowns: [{ id: "regional", keywords: ["regional", "competidor"], answer: "No sabemos la capacidad de la regional." }],
  },
  advisors: [{ id: "lucia", role: "Finanzas", personality: "directa", interests: "margen", relations: "", knows: ["margen", "caja"], view: [{ when: { all: ["comio"] }, text: ["Ya que hablaste con Héctor, cuida la caja."] }, { text: ["Cuida la caja."] }] }],
  history: [{ flag: "comio", item: "d1-hector", options: ["a"] }],
  terms: { descuento: { label: "Descuento", unit: "pts", initial: 0 }, plazo: { label: "Plazo", unit: "días", initial: 60 } },
  start: "n1",
  nodes: {
    n1: { id: "n1", stage: "Postura", who: "sofia", channel: "email", say: [{ text: ["¿Qué propone?"] }], ask: "¿Cómo abres?", freeText: true, strategies: [
      { id: "datos", text: "Pedir datos", flags: ["escucha"], trust: 1, reply: [{ text: ["Bien."] }], next: [{ to: "n2" }], evidence: [{ dim: "informacion", level: 3, basis: "pidió datos" }] },
      { id: "acepta", text: "Aceptar todo", set: { descuento: 4, plazo: 90 }, trust: 1, reply: [{ text: ["Gracias."] }], next: [{ to: "n3" }], evidence: [{ dim: "negociacion", level: 0, basis: "cedió todo" }] },
    ] },
    n2: { id: "n2", stage: "Propuesta", who: "sofia", channel: "email", say: [{ text: ["Le escucho."] }], ask: "¿Qué ofreces?", freeText: true, strategies: [
      { id: "oferta", text: "Ofrecer", params: [{ key: "descuento", label: "Descuento", min: 0, max: 4, step: 0.5, default: 1.5, unit: "pts" }], reply: [{ text: ["Ofrece {t:descuento}."] }], next: [{ to: "n3" }], evidence: [{ dim: "alternativas", level: 2, basis: "propuso", when: { all: ["descuento<=2"] } }, { dim: "alternativas", level: 1, basis: "cedió de más", when: { all: ["descuento>2"] } }] },
    ] },
    n3: { id: "n3", stage: "Cierre", who: "sofia", channel: "email", say: [{ when: { all: ["descuento>=4"] }, text: ["Con los {t:descuento} cerramos."] }, { text: ["Cerramos con {t:descuento} y {t:plazo}."] }], ask: "¿Cierras?", freeText: false, strategies: [
      { id: "firmar", text: "Firmar", reply: [{ text: ["Firmado."] }], next: [{ to: "n4" }], evidence: [], commitments: [{ id: "c1", text: "Revisión trimestral", owner: "hector" }] },
      { id: "extra", text: "Ceder un punto más", requires: { all: ["descuento<4"] }, set: { descuento: 4 }, reply: [{ text: ["Ok."] }], next: [{ to: "n4" }], evidence: [] },
    ] },
    n4: { id: "n4", stage: "Plan", who: "lucia", channel: "whatsapp", say: [{ text: ["¿Quién lo da seguimiento?"] }], ask: "¿Quién?", freeText: false, strategies: [
      { id: "hector", text: "Héctor", reply: [{ text: ["Va."] }], next: [{ to: "close" }], evidence: [{ dim: "ejecucion", level: 3, basis: "dueño claro" }], risks: [{ id: "r1", text: "Cumplir volumen" }] },
      { id: "nadie", text: "Lo veo yo después", reply: [{ text: ["Ok…"] }], next: [{ to: "close" }], evidence: [{ dim: "ejecucion", level: 0, basis: "sin dueño" }] },
    ] },
  },
  followUps: [{ id: "f1", when: { all: ["descuento>=4"] }, afterDays: 7, from: "lucia", subject: "Caja", text: [{ text: ["Los {t:descuento} ya pegan."] }] }],
  rules: "prueba",
};
registerRules("prueba", (_spec, run) => ({ headline: `Acuerdo a ${run.terms.descuento} pts`, agreement: [["Descuento", String(run.terms.descuento)]], economics: [], kpi: run.terms.descuento >= 4 ? [{ key: "margen", delta: -40, why: "4 pts × $127 M" }] : [] }));

const T0 = 1_000_000;
const act = (run: ReturnType<typeof startEpisode>, a: EpisodeAction) => { const r = applyEpisode(SPEC, run, a); return r; };

describe("episodios · briefing", () => {
  it("arranca en preparación con 180 s, 2 consultas y memoria previa de la temporada", () => {
    const r = startEpisode(SPEC, T0, { decisions: { "d1-hector": { option: "a" } } });
    expect(r.phase).toBe("briefing");
    expect(briefingLeftMs(r, T0)).toBe(BRIEFING_MS);
    expect(queriesLeft(r)).toBe(2);
    expect(r.flags).toContain("comio");
  });

  it("solo responde con hechos del FactBank; la tercera consulta se rechaza", () => {
    let r = startEpisode(SPEC, T0);
    r = act(r, { type: "fact", at: T0 + 1000, factId: "margen" }).run;
    r = act(r, { type: "fact", at: T0 + 2000, text: "¿cómo rotan nuestras papas?" }).run;
    expect(r.queries.map((q) => q.answer)).toEqual(["El margen es 7.1%.", "1.4 veces."]);
    const third = act(r, { type: "fact", at: T0 + 3000, factId: "caja" });
    expect(third.error).toMatch(/dos consultas/);
    expect(third.run.queries).toHaveLength(2);
  });

  it("una pregunta sin dato no consume consulta; un dato inexistente se reconoce sin inventar", () => {
    let r = startEpisode(SPEC, T0);
    const miss = act(r, { type: "fact", at: T0 + 1, text: "¿qué opina el clima de Marte?" });
    expect(miss.error).toBe(SPEC.facts.missing);
    expect(queriesLeft(miss.run)).toBe(2);
    r = act(r, { type: "fact", at: T0 + 2, text: "¿cuánta capacidad tiene la marca regional?" }).run;
    expect(r.queries[0].answer).toMatch(/No sabemos/);
    expect(r.queries[0].answer).not.toMatch(/\d/);
  });

  it("los hechos críticos no se consultan (siempre visibles) y no gastan consulta", () => {
    const r = startEpisode(SPEC, T0);
    expect(act(r, { type: "fact", at: T0, factId: "seguridad" }).error).toBeTruthy();
    expect(matchFact(SPEC, "seguridad")).toBeNull();
  });

  it("no repite la misma consulta", () => {
    let r = startEpisode(SPEC, T0);
    r = act(r, { type: "fact", at: T0, factId: "margen" }).run;
    expect(act(r, { type: "fact", at: T0 + 1, text: "margen" }).error).toMatch(/Ya consultaste/);
  });

  it("al vencer la ventana se bloquean consultas, no la decisión, y nada se elige solo", () => {
    let r = startEpisode(SPEC, T0);
    const late = T0 + BRIEFING_MS + 1;
    expect(briefingLeftMs(r, late)).toBe(0);
    expect(act(r, { type: "fact", at: late, factId: "margen" }).error).toMatch(/terminó/);
    expect(act(r, { type: "advisor", at: late, id: "lucia" }).error).toMatch(/terminó/);
    expect(r.turns).toHaveLength(0);
    r = act(r, { type: "begin", at: late + 60_000 }).run;
    r = act(r, { type: "decide", at: late + 61_000, strategy: "datos" }).run;
    expect(r.turns).toHaveLength(1);
  });

  it("pausar detiene el reloj; reanudar lo retoma donde iba", () => {
    let r = startEpisode(SPEC, T0);
    r = act(r, { type: "pause", at: T0 + 60_000 }).run;
    expect(briefingLeftMs(r, T0 + 10 * 60_000)).toBe(BRIEFING_MS - 60_000);
    expect(act(r, { type: "fact", at: T0 + 61_000, factId: "margen" }).error).toMatch(/Reanuda/);
    r = act(r, { type: "resume", at: T0 + 3_600_000 }).run;
    expect(briefingLeftMs(r, T0 + 3_600_000 + 30_000)).toBe(BRIEFING_MS - 90_000);
  });

  it("modo flexible: sin reloj", () => {
    let r = startEpisode(SPEC, T0);
    r = act(r, { type: "flexible", at: T0 + 1 }).run;
    expect(briefingLeftMs(r, T0 + 99 * BRIEFING_MS)).toBe(Infinity);
    expect(act(r, { type: "fact", at: T0 + 99 * BRIEFING_MS, factId: "margen" }).error).toBeUndefined();
  });

  it("puede empezar a decidir en el segundo 0, sin consultar nada", () => {
    const r = act(startEpisode(SPEC, T0), { type: "begin", at: T0 }).run;
    expect(r.phase).toBe("deciding");
    expect(r.node).toBe("n1");
  });

  it("colaborador: uno por caso, con memoria; la respuesta de la IA se guarda si viene, si no la autorada", () => {
    let r = startEpisode(SPEC, T0, { decisions: { "d1-hector": { option: "a" } } });
    r = act(r, { type: "advisor", at: T0 + 1, id: "lucia" }).run;
    expect(r.advisor?.answer).toMatch(/Héctor/);
    expect(r.advisor?.via).toBe("autor");
    expect(act(r, { type: "advisor", at: T0 + 2, id: "lucia" }).error).toMatch(/Ya consultaste/);
    const r2 = act(startEpisode(SPEC, T0), { type: "advisor", at: T0 + 1, id: "lucia", answer: "Voz de IA" }).run;
    expect(r2.advisor?.via).toBe("ia");
    expect(act(startEpisode(SPEC, T0), { type: "advisor", at: T0, id: "ramiro" }).error).toBeTruthy();
  });
});

describe("episodios · decisiones y cierre", () => {
  const play = (actions: EpisodeAction[]) => replayEpisode(SPEC, startEpisode(SPEC, T0, { runId: "r" }), actions);

  it("ninguna decisión intermedia mueve KPI; el cierre los calcula con su porqué y con tope", () => {
    const { run } = play([{ type: "begin", at: T0 }, { type: "decide", at: T0 + 1, strategy: "acepta" }]);
    expect(run.phase).toBe("deciding");
    expect(run.outcome).toBeNull();
    const mid = applyEpisode(SPEC, run, { type: "decide", at: T0 + 2, strategy: "firmar" }).run;
    expect(mid.phase).toBe("deciding");
    expect(mid.outcome).toBeNull();
    const done = applyEpisode(SPEC, mid, { type: "decide", at: T0 + 3, strategy: "nadie" }).run;
    expect(done.phase).toBe("closed");
    expect(done.outcome?.kpi).toEqual([{ key: "margen", delta: -10, why: "4 pts × $127 M" }]);
  });

  it("los parámetros se recortan a sus límites y los personajes citan lo pactado", () => {
    const { run } = play([{ type: "begin", at: T0 }, { type: "decide", at: T0 + 1, strategy: "datos" }, { type: "decide", at: T0 + 2, strategy: "oferta", params: { descuento: 9.3 } }]);
    expect(run.terms.descuento).toBe(4);
    expect(run.turns[1].reply).toEqual(["Ofrece 4 pts."]);
    const { run: r2 } = play([{ type: "begin", at: T0 }, { type: "decide", at: T0 + 1, strategy: "datos" }, { type: "decide", at: T0 + 2, strategy: "oferta", params: { descuento: 1.3 } }]);
    expect(r2.terms.descuento).toBe(1.5);
  });

  it("las estrategias condicionadas solo aparecen cuando aplican", () => {
    const { run } = play([{ type: "begin", at: T0 }, { type: "decide", at: T0 + 1, strategy: "acepta" }]);
    expect(strategiesFor(SPEC, run).map((s) => s.id)).toEqual(["firmar"]);
    expect(applyEpisode(SPEC, run, { type: "decide", at: T0 + 2, strategy: "extra" }).error).toBeTruthy();
  });

  it("dos rutas producen acuerdos, evidencia y seguimientos distintos y coherentes", () => {
    const a = play([{ type: "begin", at: T0 }, { type: "decide", at: T0 + 1, strategy: "acepta" }, { type: "decide", at: T0 + 2, strategy: "firmar" }, { type: "decide", at: T0 + 3, strategy: "nadie" }]).run;
    const b = play([{ type: "begin", at: T0 }, { type: "decide", at: T0 + 1, strategy: "datos" }, { type: "decide", at: T0 + 2, strategy: "oferta", params: { descuento: 1.5 } }, { type: "decide", at: T0 + 3, strategy: "firmar" }, { type: "decide", at: T0 + 4, strategy: "hector" }]).run;
    expect(a.outcome?.headline).toBe("Acuerdo a 4 pts");
    expect(b.outcome?.headline).toBe("Acuerdo a 1.5 pts");
    expect(a.outcome?.followUps.map((f) => f.id)).toEqual(["f1"]);
    expect(a.outcome?.followUps[0].text).toEqual(["Los 4 pts ya pegan."]);
    expect(b.outcome?.followUps).toEqual([]);
    expect(a.outcome?.evidence.map((e) => [e.dim, e.level])).toEqual([["negociacion", 0], ["ejecucion", 0]]);
    expect(b.outcome?.evidence.map((e) => [e.dim, e.level])).toEqual([["informacion", 3], ["alternativas", 2], ["ejecucion", 3]]);
    expect(b.outcome?.commitments.map((c) => c.owner)).toEqual(["hector"]);
    expect(b.outcome?.risks.map((r) => r.id)).toEqual(["r1"]);
    expect(b.outcome?.events.some((e) => e.kind === "seguimiento")).toBe(false);
    expect(a.outcome?.events.find((e) => e.kind === "seguimiento")?.activatesAt).toBe(T0 + 3 + 7 * 86_400_000);
  });

  it("XP: una sola vez al cerrar; reaplicar no duplica ni reabre", () => {
    const actions: EpisodeAction[] = [{ type: "begin", at: T0 }, { type: "decide", at: T0 + 1, strategy: "acepta" }, { type: "decide", at: T0 + 2, strategy: "firmar" }, { type: "decide", at: T0 + 3, strategy: "hector" }];
    const { run } = play(actions);
    expect(run.xp).toBe(episodeXp(run));
    expect(run.xp).toBe(3 * 20 + 40);
    const again = replayEpisode(SPEC, run, actions);
    expect(again.rejected).toEqual([0, 1, 2, 3]);
    expect(again.run.xp).toBe(run.xp);
  });

  it("no se puede decidir en pausa ni antes de empezar", () => {
    let r = startEpisode(SPEC, T0);
    expect(applyEpisode(SPEC, r, { type: "decide", at: T0, strategy: "datos" }).error).toMatch(/empieza/);
    r = applyEpisode(SPEC, r, { type: "begin", at: T0 }).run;
    r = applyEpisode(SPEC, r, { type: "pause", at: T0 + 1 }).run;
    expect(applyEpisode(SPEC, r, { type: "decide", at: T0 + 2, strategy: "datos" }).error).toMatch(/Reanuda/);
  });

  it("guarda el texto libre y su interpretación validada", () => {
    const { run } = play([{ type: "begin", at: T0 }, { type: "decide", at: T0 + 1, strategy: "datos", text: "Antes de responder quiero ver la rotación por tienda.", interpretation: { quality: 3, feedback: "Bien." } }]);
    expect(run.turns[0].input).toEqual({ kind: "texto", text: "Antes de responder quiero ver la rotación por tienda." });
    expect(run.turns[0].interpretation?.quality).toBe(3);
  });

  it("render y condiciones: banderas, comparaciones y confianza", () => {
    const r = { flags: ["x"], terms: { plazo: 60, descuento: 2 }, trust: -1 };
    expect(holds(r, { all: ["x", "plazo=60", "descuento<3", "trust<0"] })).toBe(true);
    expect(holds(r, { none: ["x"] })).toBe(false);
    expect(holds(r, { any: ["y", "plazo>=90"] })).toBe(false);
    expect(render(SPEC, r, [{ text: ["{t:plazo} y {t:descuento}"] }])).toEqual(["60 días y 2 pts"]);
  });
});

describe("episodios · persistencia", () => {
  it("una partida guardada se reconstruye igual (recargar no pierde nada)", () => {
    let r = startEpisode(SPEC, T0);
    r = applyEpisode(SPEC, r, { type: "fact", at: T0 + 1, factId: "margen" }).run;
    r = applyEpisode(SPEC, r, { type: "begin", at: T0 + 2 }).run;
    const back = sanitizeRun(JSON.parse(JSON.stringify(r)));
    expect(back).toEqual(r);
    expect(sanitizeRun({ basura: 1 })).toBeNull();
  });

  it("al sincronizar dos dispositivos se conserva la copia con más avance", () => {
    const a = startEpisode(SPEC, T0, { runId: "r" });
    const b = applyEpisode(SPEC, applyEpisode(SPEC, a, { type: "begin", at: T0 + 1 }).run, { type: "decide", at: T0 + 2, strategy: "datos" }).run;
    const aLater = { ...applyEpisode(SPEC, a, { type: "fact", at: T0 + 99, factId: "margen" }).run };
    expect(pickRun(aLater, b)).toBe(b);
    expect(pickRun(b, aLater)).toBe(b);
    expect(pickRun(undefined, a)).toBe(a);
  });
});

describe("episodios · validación del grafo", () => {
  it("todas las rutas tienen entre 3 y 6 decisiones", () => {
    const paths = allPaths(SPEC);
    expect(paths.length).toBeGreaterThan(1);
    for (const p of paths) { expect(p.length).toBeGreaterThanOrEqual(MIN_DECISIONS); expect(p.length).toBeLessThanOrEqual(MAX_DECISIONS); }
    expect(lintEpisode(SPEC)).toEqual([]);
  });

  it("el validador detecta rutas cortas, ramas rotas y estrategias imposibles", () => {
    const broken: EpisodeSpec = JSON.parse(JSON.stringify(SPEC));
    broken.nodes.n3.strategies[0].next = [{ to: "close" }];
    broken.nodes.n2.strategies[0].next = [{ to: "nada" }];
    broken.nodes.n1.strategies[0].requires = { all: ["imposible"] };
    const bad = lintEpisode(broken);
    expect(bad.some((b) => b.includes("menos de 3"))).toBe(true);
    expect(bad.some((b) => b.includes("inexistente nada"))).toBe(true);
    expect(bad.some((b) => b.includes("n1.datos: estrategia que nunca"))).toBe(true);
  });
});
