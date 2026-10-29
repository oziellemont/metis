import { describe, expect, it } from "vitest";
import { interpretLocal, interpretMessages, parseInterpretation } from "./ai";
import { EPISODES } from "./catalog";
import { matchFact, nodeOf, sayOf, strategiesFor } from "./engine";
import { FACT_SET, INTERPRET_SET, ADVISOR_SET } from "./eval-set";
import { pct, runAt, score } from "./eval-harness";

describe("P0-D · conjunto de evaluación", () => {
  it("cubre los 18 nodos de los tres pilotos con 10 respuestas cada uno, y cada estrategia esperada existe en ese punto", () => {
    const nodes = Object.values(EPISODES).flatMap((s) => Object.keys(s.nodes).map((n) => `${s.id}/${n}`));
    expect(nodes).toHaveLength(18);
    for (const k of nodes) expect(INTERPRET_SET.filter((i) => `${i.ep}/${i.node}` === k).length, k).toBe(10);
    for (const it of INTERPRET_SET) {
      const spec = EPISODES[it.ep];
      const run = runAt(spec, it.node, it.expect);
      expect(run, `${it.ep}/${it.node}:${it.expect}`).not.toBeNull();
      expect(strategiesFor(spec, run!).map((s) => s.id)).toContain(it.expect);
      expect(it.text.length).toBeGreaterThanOrEqual(15);
    }
    for (const a of ADVISOR_SET) expect(EPISODES[a.ep].advisors.map((x) => x.id)).toContain(a.advisor);
  }, 60_000);

  it("los prompts de texto libre solo ofrecen las estrategias disponibles y llevan el texto como dato", () => {
    for (const it of INTERPRET_SET.filter((_, i) => i % 10 === 0)) {
      const spec = EPISODES[it.ep];
      const run = runAt(spec, it.node, it.expect)!;
      const m = interpretMessages(spec, run, nodeOf(spec, run)!, sayOf(spec, run), it.text);
      for (const st of strategiesFor(spec, run)) expect(m[1].content).toContain(`${st.id})`);
      expect(m[1].content).toContain(`<jugador>\n${it.text}`);
      // una salida válida de la IA con la esperada pasa la validación si la esperada está disponible
      expect(parseInterpretation(spec, run, JSON.stringify({ strategy: it.expect, quality: 2, feedback: "Bien." }))?.strategy).toBe(it.expect);
      expect(parseInterpretation(spec, run, JSON.stringify({ strategy: "inventada", quality: 2, feedback: "x" }))).toBeNull();
    }
  }, 60_000);
});

describe("P0-D · respaldo sin IA (gratis, en cada corrida)", () => {
  it("palabras clave: nunca elige una estrategia que no está disponible y su acierto queda medido", () => {
    const s = score(INTERPRET_SET, (it) => {
      const run = runAt(EPISODES[it.ep], it.node, it.expect)!;
      const r = interpretLocal(EPISODES[it.ep], run, it.text);
      if (r) expect(strategiesFor(EPISODES[it.ep], run).map((x) => x.id)).toContain(r.strategy);
      return r?.strategy ?? null;
    });
    // El respaldo es una ayuda: la pantalla pide confirmar. Piso mínimo para detectar regresiones.
    expect(pct(s.hit, s.total)).toBeGreaterThanOrEqual(45);
    console.info(`[eval] respaldo sin IA: ${s.hit}/${s.total} (${pct(s.hit, s.total)}%), eligió algo en ${pct(s.chose, s.total)}%`);
  }, 60_000);

  it("consulta de hechos por palabras clave: acierta los datos y reconoce lo que no existe", () => {
    let hit = 0;
    for (const f of FACT_SET) {
      const m = matchFact(EPISODES[f.ep], f.q);
      const got = !m ? "ninguno" : m.kind === "fact" ? m.fact.id : `?${m.id}`;
      if (got === f.expect) hit++;
    }
    expect(pct(hit, FACT_SET.length)).toBeGreaterThanOrEqual(60);
    console.info(`[eval] hechos sin IA: ${hit}/${FACT_SET.length}`);
  });
});

describe("P0-D · evaluación con IA (con modelo falso, sin gasto)", () => {
  it("un modelo perfecto pasa todas las metas; uno que responde basura cae al respaldo y no pasa", async () => {
    const { EVAL_JOBS, runJob, summarize, passes, EVAL_REPEATS } = await import("./eval-run");
    const { FACT_SET: FS, INTERPRET_SET: IS } = await import("./eval-set");
    // Modelo «perfecto»: lee el texto del jugador y devuelve lo esperado según el conjunto.
    const perfect: import("./eval-run").Model = async (msgs) => {
      const u = msgs[1].content;
      const ip = IS.find((it) => u.includes(`<jugador>\n${it.text}`));
      if (ip) return { content: JSON.stringify({ strategy: ip.expect, quality: 2, feedback: "Bien." }), cost: 0.0001 };
      const f = FS.find((x) => u.includes(`<jugador>\n${x.q}`));
      if (f) return { content: JSON.stringify({ id: f.expect }), cost: 0.00005 };
      return { content: JSON.stringify({ answer: "Desde mi lado, lo que más me importa es que la decisión se sostenga con los datos que tenemos." }), cost: 0.0001 };
    };
    const all = [];
    for (const j of EVAL_JOBS) all.push(await runJob(j, perfect));
    const rep = summarize(all);
    expect(rep.interpret.accuracy).toBe(100);
    expect(rep.interpret.consistency).toBe(100);
    expect(rep.facts.accuracy).toBe(100);
    expect(rep.advisor.valid).toBe(100);
    expect(rep.calls).toBe(IS.length * EVAL_REPEATS + FS.length + 8);
    expect(rep.cost).toBeGreaterThan(0);
    expect(Object.values(passes(rep)).every(Boolean)).toBe(true);

    const junk: import("./eval-run").Model = async () => ({ content: "no sé", cost: 0 });
    const bad = summarize(await Promise.all(EVAL_JOBS.slice(0, 20).map((j) => runJob(j, junk))));
    expect(bad.interpret.invalid).toBe(100);
    expect(passes(bad).accuracy).toBe(false);
  }, 60_000);

  it("el costo estimado de toda la evaluación está muy por debajo del tope de $0.50", async () => {
    const { EVAL_JOBS, EVAL_REPEATS, EVAL_BUDGET_USD } = await import("./eval-run");
    const { costOf, approxTokens, DEFAULT_MODEL } = await import("../written");
    let est = 0;
    for (const it of INTERPRET_SET) {
      const spec = EPISODES[it.ep]; const run = runAt(spec, it.node, it.expect)!;
      const m = interpretMessages(spec, run, nodeOf(spec, run)!, sayOf(spec, run), it.text);
      est += EVAL_REPEATS * costOf(DEFAULT_MODEL, approxTokens(m.map((x) => x.content).join("\n")) + 20, 200);
    }
    est += (EVAL_JOBS.length - INTERPRET_SET.length) * 0.0005;
    console.info(`[eval] costo máximo estimado: $${est.toFixed(3)}`);
    expect(est).toBeLessThan(EVAL_BUDGET_USD);
  });
});
