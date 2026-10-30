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
      expect(parseInterpretation(spec, run, JSON.stringify({ status: "clara", strategy: it.expect, quality: 2, feedback: "Bien." }))?.strategy).toBe(it.expect);
      expect(parseInterpretation(spec, run, JSON.stringify({ status: "clara", strategy: "inventada", quality: 2, feedback: "x" }))).toBeNull();
    }
  }, 60_000);
});

describe("P0-D · respaldo sin IA (gratis, en cada corrida)", () => {
  it("palabras clave: nunca elige una estrategia que no está disponible y su acierto queda medido", () => {
    const s = score(INTERPRET_SET, (it) => {
      const run = runAt(EPISODES[it.ep], it.node, it.expect)!;
      const r = interpretLocal(EPISODES[it.ep], run, it.text);
      if (r?.strategy) expect(strategiesFor(EPISODES[it.ep], run).map((x) => x.id)).toContain(r.strategy);
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

describe("P0-D · conjunto de validación final (separado del de desarrollo)", () => {
  it("no repite ninguna frase del conjunto de desarrollo y cada caso es alcanzable", async () => {
    const { VALIDATION_SET, FACT_VALIDATION, ADVISOR_VALIDATION, DEMO_SCRIPTS } = await import("./eval-validacion");
    const dev = new Set([...INTERPRET_SET.map((x) => x.text), ...FACT_SET.map((x) => x.q), ...ADVISOR_SET.map((x) => x.q)]);
    for (const v of VALIDATION_SET) expect(dev.has(v.text), v.text).toBe(false);
    for (const f of FACT_VALIDATION) expect(dev.has(f.q), f.q).toBe(false);
    for (const a of ADVISOR_VALIDATION) expect(dev.has(a.q), a.q).toBe(false);
    // ninguna frase de validación aparece en los prompts (no se usaron para ajustar)
    const ai = await import("fs").then((fs) => fs.readFileSync(new URL("./ai.ts", import.meta.url), "utf8"));
    for (const v of VALIDATION_SET) expect(ai.includes(v.text.slice(0, 30)), v.text).toBe(false);
    for (const v of VALIDATION_SET) {
      const spec = EPISODES[v.ep];
      const run = runAt(spec, v.node, v.expect ?? v.options);
      expect(run, `${v.ep}/${v.node}`).not.toBeNull();
      const ids = strategiesFor(spec, run!).map((s) => s.id);
      if (v.kind === "clara" || v.kind === "parcial") expect(ids).toContain(v.expect);
      if (v.kind === "ambigua") { expect(v.options!.length).toBeGreaterThanOrEqual(2); for (const o of v.options!) expect(ids).toContain(o); }
      if (v.kind === "fuera") expect(v.expect).toBeUndefined();
    }
    const kinds = (k: string) => VALIDATION_SET.filter((v) => v.kind === k).length;
    expect(VALIDATION_SET.length).toBeGreaterThanOrEqual(90);
    expect(kinds("ambigua")).toBeGreaterThanOrEqual(10);
    expect(kinds("parcial")).toBeGreaterThanOrEqual(10);
    expect(kinds("fuera")).toBeGreaterThanOrEqual(4);
    for (const f of FACT_VALIDATION) {
      const spec = EPISODES[f.ep];
      for (const id of f.accept) expect(id === "ninguno" || (id.startsWith("?") ? spec.facts.unknowns.some((u) => u.id === id.slice(1)) : spec.facts.facts.some((x) => x.id === id && !x.critical)), id).toBe(true);
    }
    for (const a of ADVISOR_VALIDATION) expect(EPISODES[a.ep].advisors.map((x) => x.id)).toContain(a.advisor);
    expect(ADVISOR_VALIDATION.length).toBeGreaterThanOrEqual(27);
    for (const d of DEMO_SCRIPTS) expect(EPISODES[d.ep]).toBeDefined();
  }, 60_000);
});

describe("P0-D · evaluación con IA (con modelo falso, sin gasto)", () => {
  /** Modelo «perfecto»: lee el texto del jugador y devuelve lo esperado en el formato nuevo, con reacción adaptada. */
  async function perfectModel() {
    const { VALIDATION_SET, FACT_VALIDATION, DEMO_SCRIPTS } = await import("./eval-validacion");
    const items = [...INTERPRET_SET.map((x) => ({ ...x, kind: "clara" as const, options: undefined as string[] | undefined, tone: undefined as number | undefined })), ...VALIDATION_SET,
      ...DEMO_SCRIPTS.flatMap((d) => d.steps.map((s) => ({ ep: d.ep, node: "", text: s.text, expect: s.expect, kind: s.ambigua ? "ambigua" as const : "clara" as const, options: s.ambigua ? [s.expect, "parcial"] : undefined, tone: s.tone })))];
    const facts = [...FACT_SET.map((f) => ({ q: f.q, id: f.expect })), ...FACT_VALIDATION.map((f) => ({ q: f.q, id: f.accept[0] }))];
    const model: import("./eval-run").Model = async (msgs) => {
      const sys = msgs[0].content, u = msgs[1].content;
      if (sys.startsWith("Eres auditor")) return { content: JSON.stringify({ recomienda: false, inventa: false, responde: true, motivo: "" }), cost: 0.00003 };
      const ip = items.find((it) => u.includes(`<jugador>\n${it.text}\n`));
      if (ip) {
        if (ip.kind === "ambigua") return { content: JSON.stringify({ status: "ambigua", strategy: null, options: ip.options, clarify: "¿Cuál de las dos lecturas es la tuya?", quality: 1, feedback: "" }), cost: 0.0002 };
        if (ip.kind === "fuera") return { content: JSON.stringify({ status: "fuera", strategy: null, quality: 0, feedback: "" }), cost: 0.0002 };
        const line = u.split("\n").find((l) => l.startsWith(`${ip.expect}) `));
        const auth = u.split("\n")[u.split("\n").indexOf(line!) + 1]?.replace(/^\s*respuesta autorizada: /, "") ?? "";
        const word = ip.text.split(/\s+/).find((w) => w.length >= 7) ?? "";
        return { content: JSON.stringify({ status: ip.kind, strategy: ip.expect, quality: 2, feedback: "Bien.", tone: ip.tone ?? 0, ...(ip.kind === "parcial" ? { extras: "algo propio" } : {}), reply: `Sobre lo de ${word.replace(/[^\p{L}]/gu, "")}: ${auth}` }), cost: 0.0002 };
      }
      const f = facts.find((x) => u.includes(`<jugador>\n${x.q}`));
      if (f) return { content: JSON.stringify({ id: f.id }), cost: 0.00005 };
      return { content: JSON.stringify({ answer: "Desde mi lado, lo que más me importa es que la decisión se sostenga con lo que sabemos; lo demás no lo sé." }), cost: 0.0001 };
    };
    return model;
  }

  it("un modelo perfecto pasa todas las metas en ambos conjuntos; la demo recorre los casos completos", async () => {
    const { EVAL_JOBS, runJob, summarize, passes, EVAL_REPEATS } = await import("./eval-run");
    const model = await perfectModel();
    const all = [];
    for (const j of EVAL_JOBS) all.push(await runJob(j, model));
    const rep = summarize(all);
    for (const set of [rep.dev!, rep.val!]) {
      expect(set.interpret.accuracy).toBe(100);
      expect(set.interpret.consistency).toBe(100);
      expect(set.interpret.ambiguousCommitted + set.interpret.offTopicCommitted).toBe(0);
      expect(set.facts.accuracy).toBe(100);
      expect(set.advisor.quality).toBe(100);
      expect(Object.values(passes(set)).every(Boolean)).toBe(true);
      // la reacción adaptada (que conserva las cifras del autor) pasa la validación y retoma palabras del jugador
      expect(set.interpret.adaptive.adapted).toBe(set.interpret.adaptive.replies);
      expect(set.interpret.adaptive.echoes).toBeGreaterThan(set.interpret.adaptive.adapted * 0.8);
    }
    expect(rep.val!.interpret.adaptive.tone.hit).toBe(rep.val!.interpret.adaptive.tone.total);
    expect(rep.val!.interpret.adaptive.extras.hit).toBe(rep.val!.interpret.adaptive.extras.total);
    expect(rep.dev!.interpret.total * EVAL_REPEATS).toBeLessThan(rep.calls);
    // demo: mismas decisiones en Diego, distinto tono → distinta confianza y distinto final
    const [suave, duro, ale] = rep.demos;
    expect(suave.path.map((p) => p.split(":")[1]).slice(0, 4)).toEqual(duro.path.map((p) => p.split(":")[1]).slice(0, 4));
    expect(suave.trust).toBeGreaterThan(duro.trust);
    expect(suave.steps.some((s) => s.node === "p5")).toBe(false);
    expect(duro.steps.some((s) => s.node === "p5")).toBe(true);
    expect(suave.closed && duro.closed && ale.closed).toBe(true);
    expect(ale.steps[0].status).toBe("ambigua");
    // tras aclarar, se usa la respuesta del autor (no hubo reacción a sus palabras que validar); las demás se adaptan
    expect(ale.steps[0].adapted).toBe(false);
    expect(ale.steps.slice(1).every((s) => s.adapted)).toBe(true);
  }, 120_000);

  it("ambigua comprometida o basura cuentan en contra", async () => {
    const { EVAL_JOBS, runJob, summarize, passes } = await import("./eval-run");
    const junk: import("./eval-run").Model = async () => ({ content: "no sé", cost: 0 });
    const bad = summarize(await Promise.all(EVAL_JOBS.slice(0, 20).map((j) => runJob(j, junk))));
    expect(bad.val!.interpret.invalid).toBe(100);
    expect(passes(bad.val!).accuracy).toBe(false);
    // un modelo que siempre decide (nunca pregunta) compromete las ambiguas
    const { VALIDATION_SET } = await import("./eval-validacion");
    const eager: import("./eval-run").Model = async (msgs) => {
      const u = msgs[1].content;
      const id = u.match(/\n(\w+)\) /)?.[1] ?? "x";
      return { content: JSON.stringify({ status: "clara", strategy: id, quality: 2, feedback: "x" }), cost: 0 };
    };
    const idx = EVAL_JOBS.map((j, k) => (j.kind === "interpret" && j.set === "val" && VALIDATION_SET[j.i].kind === "ambigua" ? k : -1)).filter((k) => k >= 0);
    const rep = summarize(await Promise.all(idx.map((k) => runJob(EVAL_JOBS[k], eager))));
    expect(rep.val!.interpret.ambiguousCommitted).toBe(idx.length);
    expect(passes(rep.val!).ambiguousCommitted).toBe(false);
  }, 60_000);

  it("el costo estimado de toda la evaluación (ambos conjuntos + demo + auditor) cabe en el tope de $0.50", async () => {
    const { EVAL_JOBS, EVAL_REPEATS, EVAL_BUDGET_USD } = await import("./eval-run");
    const { VALIDATION_SET } = await import("./eval-validacion");
    const { EPISODE_AI_MAX_TOKENS } = await import("./ai");
    const { costOf, approxTokens, DEFAULT_MODEL } = await import("../written");
    let est = 0;
    for (const it of [...INTERPRET_SET, ...VALIDATION_SET]) {
      const spec = EPISODES[it.ep]; const run = runAt(spec, it.node, it.expect ?? (it as { options?: string[] }).options)!;
      const m = interpretMessages(spec, run, nodeOf(spec, run)!, sayOf(spec, run), it.text);
      // salida real ~180 tokens (estimación conservadora: 250)
      est += EVAL_REPEATS * costOf(DEFAULT_MODEL, approxTokens(m.map((x) => x.content).join("\n")) + 20, Math.min(250, EPISODE_AI_MAX_TOKENS.interpret));
    }
    est += EVAL_JOBS.filter((j) => j.kind === "fact" || j.kind === "advisor").length * 0.0006 + EVAL_JOBS.filter((j) => j.kind === "demo").length * 0.004;
    console.info(`[eval] costo estimado de toda la evaluación: $${est.toFixed(3)}`);
    expect(est).toBeLessThan(EVAL_BUDGET_USD);
  }, 60_000);
});
