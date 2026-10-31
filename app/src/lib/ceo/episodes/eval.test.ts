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
  it("no repite ninguna frase del desarrollo (rondas 1 a 6) ni de los prompts, y cada caso es alcanzable", async () => {
    const { VALIDATION_SET, FACT_VALIDATION, ADVISOR_VALIDATION, DEMO_SCRIPTS } = await import("./eval-validacion");
    const D2 = await import("./eval-dev-ronda2");
    const D3 = await import("./eval-dev-ronda3");
    const D4 = await import("./eval-dev-ronda4");
    const D5 = await import("./eval-dev-ronda5");
    const D6 = await import("./eval-dev-ronda6");
    const dev = new Set([...D6.DEV6_INTERPRET.map((x) => x.text), ...D6.DEV6_FACTS.map((x) => x.q), ...D6.DEV6_ADVISOR.map((x) => x.q), ...D6.DEV6_DEMOS.flatMap((d) => d.steps.map((s) => s.text)),...D5.DEV5_INTERPRET.map((x) => x.text), ...D5.DEV5_FACTS.map((x) => x.q), ...D5.DEV5_ADVISOR.map((x) => x.q), ...D5.DEV5_DEMOS.flatMap((d) => d.steps.map((s) => s.text)),...D4.DEV4_INTERPRET.map((x) => x.text), ...D4.DEV4_FACTS.map((x) => x.q), ...D4.DEV4_ADVISOR.map((x) => x.q), ...D4.DEV4_DEMOS.flatMap((d) => d.steps.map((s) => s.text)),
      ...D3.DEV3_INTERPRET.map((x) => x.text), ...D3.DEV3_FACTS.map((x) => x.q), ...D3.DEV3_ADVISOR.map((x) => x.q), ...D3.DEV3_DEMOS.flatMap((d) => d.steps.map((s) => s.text)),...INTERPRET_SET.map((x) => x.text), ...FACT_SET.map((x) => x.q), ...ADVISOR_SET.map((x) => x.q),
      ...D2.DEV2_INTERPRET.map((x) => x.text), ...D2.DEV2_FACTS.map((x) => x.q), ...D2.DEV2_ADVISOR.map((x) => x.q), ...D2.DEV2_DEMOS.flatMap((d) => d.steps.map((s) => s.text))]);
    for (const v of VALIDATION_SET) expect(dev.has(v.text), v.text).toBe(false);
    for (const f of FACT_VALIDATION) expect(dev.has(f.q), f.q).toBe(false);
    for (const a of ADVISOR_VALIDATION) expect(dev.has(a.q), a.q).toBe(false);
    for (const d of DEMO_SCRIPTS) for (const s of d.steps) expect(dev.has(s.text), s.text).toBe(false);
    // ninguna frase de validación aparece en los prompts (no se usaron para ajustar)
    const ai = await import("fs").then((fs) => fs.readFileSync(new URL("./ai.ts", import.meta.url), "utf8"));
    for (const v of [...VALIDATION_SET.map((x) => x.text), ...FACT_VALIDATION.map((x) => x.q), ...ADVISOR_VALIDATION.map((x) => x.q)]) expect(ai.includes(v.slice(0, 30)), v).toBe(false);
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
    expect(kinds("ambigua")).toBeGreaterThanOrEqual(15);
    expect(kinds("parcial")).toBeGreaterThanOrEqual(10);
    expect(kinds("fuera")).toBeGreaterThanOrEqual(5);
    // tono en ambos sentidos, en los tres casos
    expect(VALIDATION_SET.filter((v) => v.tone === 1).length).toBeGreaterThanOrEqual(5);
    expect(VALIDATION_SET.filter((v) => v.tone === -1).length).toBeGreaterThanOrEqual(5);
    for (const f of FACT_VALIDATION) {
      const spec = EPISODES[f.ep];
      for (const id of f.accept) expect(id === "ninguno" || (id.startsWith("?") ? spec.facts.unknowns.some((u) => u.id === id.slice(1)) : spec.facts.facts.some((x) => x.id === id && !x.critical)), id).toBe(true);
    }
    expect(FACT_VALIDATION.length).toBeGreaterThanOrEqual(28);
    for (const a of ADVISOR_VALIDATION) expect(EPISODES[a.ep].advisors.map((x) => x.id)).toContain(a.advisor);
    expect(ADVISOR_VALIDATION.length).toBeGreaterThanOrEqual(36);
    for (const d of DEMO_SCRIPTS) expect(EPISODES[d.ep]).toBeDefined();
  }, 60_000);
});

describe("P0-D · evaluación con IA (con modelo falso, sin gasto)", () => {
  /** Modelo «perfecto»: lee el texto del jugador y devuelve lo esperado en el formato de la ronda 3 (dos pasos). */
  async function perfectModel() {
    const { VALIDATION_SET, FACT_VALIDATION, DEMO_SCRIPTS } = await import("./eval-validacion");
    const D2 = await import("./eval-dev-ronda2");
    const D3 = await import("./eval-dev-ronda3");
    const D4 = await import("./eval-dev-ronda4");
    const D5 = await import("./eval-dev-ronda5");
    const D6 = await import("./eval-dev-ronda6");
    const items = [...D3.DEV3_INTERPRET, ...D4.DEV4_INTERPRET, ...D5.DEV5_INTERPRET, ...D6.DEV6_INTERPRET, ...INTERPRET_SET.map((x) => ({ ...x, kind: "clara" as const, options: undefined as string[] | undefined, tone: undefined as number | undefined })), ...VALIDATION_SET, ...D2.DEV2_INTERPRET,
      ...DEMO_SCRIPTS.flatMap((d) => d.steps.map((s) => ({ ep: d.ep, node: "", text: s.text, expect: s.expect, kind: s.ambigua ? "ambigua" as const : "clara" as const, options: s.ambigua ? [s.expect, "parcial"] : undefined, tone: s.tone })))];
    const facts = [...FACT_SET.map((f) => ({ q: f.q, id: f.expect })), ...FACT_VALIDATION.map((f) => ({ q: f.q, id: f.accept[0] })), ...D2.DEV2_FACTS.map((f) => ({ q: f.q, id: f.accept[0] })), ...D3.DEV3_FACTS.map((f) => ({ q: f.q, id: f.accept[0] })), ...D4.DEV4_FACTS.map((f) => ({ q: f.q, id: f.accept[0] })), ...D5.DEV5_FACTS.map((f) => ({ q: f.q, id: f.accept[0] })), ...D6.DEV6_FACTS.map((f) => ({ q: f.q, id: f.accept[0] }))];
    const model: import("./eval-run").Model = async (msgs) => {
      const sys = msgs[0].content, u = msgs[1].content;
      if (sys.startsWith("Eres auditor")) return { content: JSON.stringify({ recomienda: false, inventa: false, responde: true, fiel: true, agrega: false, responde_al_jugador: true, motivo: "" }), cost: 0.00003 };
      if (sys.startsWith("Escribes la reacción")) {
        const player = u.match(/<jugador>\n([\s\S]*?)\n<\/jugador>/)?.[1] ?? "";
        const authored = u.split("Respuesta autorizada (una línea por renglón):\n")[1]?.split("\n") ?? [];
        const word = player.split(/\s+/).map((w) => w.replace(/[^\p{L}]/gu, "")).find((w) => w.length >= 7 && !/consentido|junior|genio/i.test(w)) ?? "eso";
        return { content: JSON.stringify({ reply: [`Sobre lo de ${word}: ${authored[0]}`, ...authored.slice(1)] }), cost: 0.0001 };
      }
      const ip = sys.startsWith("Eres el intérprete") ? items.find((it) => u.includes(`<jugador>\n${it.text}\n`)) : undefined;
      if (ip) {
        const ev = ip.tone ? ip.text.split(/\s+/).slice(0, 4).join(" ") : "";
        if (ip.kind === "ambigua") return { content: JSON.stringify({ encaje: "varias", strategy: null, options: ip.options, clarify: "¿Cuál de las dos lecturas es la tuya?", tone: ip.tone ?? 0, tone_evidence: ev, quality: 1, feedback: "" }), cost: 0.0002 };
        if (ip.kind === "fuera") return { content: JSON.stringify({ encaje: "ninguna", strategy: null, quality: 0, feedback: "" }), cost: 0.0002 };
        return { content: JSON.stringify({ encaje: ip.kind === "parcial" ? "una_mas_extras" : "una", strategy: ip.expect, rival: null, quality: 2, feedback: "Bien.", tone: ip.tone ?? 0, tone_evidence: ev, ...(ip.kind === "parcial" ? { extras: "algo propio" } : {}) }), cost: 0.0002 };
      }
      const f = sys.startsWith("Clasificas") ? facts.find((x) => u.includes(`<jugador>\n${x.q}`)) : undefined;
      if (f) return { content: JSON.stringify({ pide: "x", id: f.id }), cost: 0.00005 };
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
      expect(set.interpret.misses).toEqual([]);
      expect(set.interpret.accuracy).toBe(100);
      expect(set.interpret.consistency).toBe(100);
      expect(set.interpret.ambiguousCommitted + set.interpret.offTopicCommitted).toBe(0);
      expect(set.facts.accuracy).toBe(100);
      expect(set.advisor.quality).toBe(100);
      expect(Object.values(passes(set)).every(Boolean)).toBe(true);
      // la reacción adaptada (segunda llamada, sobre la respuesta real del motor) pasa la regla de fidelidad
      expect(set.interpret.adaptive.adapted).toBe(set.interpret.adaptive.replies);
      expect(set.interpret.adaptive.echoes).toBeGreaterThan(set.interpret.adaptive.adapted * 0.8);
    }
    expect(rep.dev!.interpret.total).toBeGreaterThan(INTERPRET_SET.length); // rondas 4 y 5 + lo difícil de antes
    expect(rep.val!.interpret.adaptive.faithful).toBe(rep.val!.interpret.adaptive.audited);
    expect(rep.val!.interpret.adaptive.tone.hit).toBe(rep.val!.interpret.adaptive.tone.total);
    expect(rep.val!.interpret.adaptive.tone.falsePositive).toBe(0);
    expect(rep.val!.interpret.adaptive.extras.hit).toBe(rep.val!.interpret.adaptive.extras.total);
    expect(rep.dev!.interpret.total).toBeLessThan(rep.calls);
    // demo: mismas decisiones en Diego, distinto tono → distinta confianza y distinto final
    const [suave, duro, ale] = rep.demos;
    expect(suave.path.map((p) => p.split(":")[1]).slice(0, 4)).toEqual(duro.path.map((p) => p.split(":")[1]).slice(0, 4));
    expect(suave.trust).toBeGreaterThan(duro.trust);
    expect(suave.steps.some((s) => s.node === "p5")).toBe(false);
    expect(duro.steps.some((s) => s.node === "p5")).toBe(true);
    expect(duro.steps.filter((s) => s.tone === -1).length).toBe(3);
    expect(suave.closed && duro.closed && ale.closed).toBe(true);
    expect(ale.steps[0].status).toBe("ambigua");
    expect(ale.path.map((p) => p.split(":")[1])).toEqual(ale.expected);
    // con dos pasos, también la respuesta tras aclarar se adapta a lo que escribió
    expect(ale.steps.every((s) => s.adapted)).toBe(true);
  }, 120_000);

  it("ambigua comprometida o basura cuentan en contra", async () => {
    const { EVAL_JOBS, runJob, summarize, passes } = await import("./eval-run");
    const junk: import("./eval-run").Model = async () => ({ content: "no sé", cost: 0 });
    const bad = summarize(await Promise.all(EVAL_JOBS.slice(0, 20).map((j) => runJob(j, junk))));
    expect(bad.val!.interpret.invalid).toBe(100);
    expect(passes(bad.val!).accuracy).toBe(false);
    // un modelo que siempre decide (nunca pregunta ni ve rival) compromete las ambiguas
    const { VALIDATION_SET } = await import("./eval-validacion");
    const eager: import("./eval-run").Model = async (msgs) => {
      const u = msgs[1].content;
      const id = u.match(/\n(\w+)\) /)?.[1] ?? "x";
      return { content: JSON.stringify({ encaje: "una", strategy: id, rival: null, quality: 2, feedback: "x" }), cost: 0 };
    };
    const idx = EVAL_JOBS.map((j, k) => (j.kind === "interpret" && j.set === "val" && VALIDATION_SET[j.i].kind === "ambigua" ? k : -1)).filter((k) => k >= 0);
    const rep = summarize(await Promise.all(idx.map((k) => runJob(EVAL_JOBS[k], eager))));
    // la regla de «pospone» atrapa algunas aunque el modelo no pregunte; las demás cuentan en contra
    expect(rep.val!.interpret.ambiguousCommitted).toBeGreaterThan(0);
    expect(passes(rep.val!).ambiguousCommitted).toBe(false);
  }, 60_000);

  it("desarrollo barato: una pasada, rondas 5 y 6 completas, de lo anterior solo lo difícil y los fallos históricos", async () => {
    const { DEV_REPEATS, EVAL_REPEATS, repeatsOf, DEV_HISTORIC_MISSES, evalTexts, evalSizes } = await import("./eval-run");
    const { DEV4_INTERPRET } = await import("./eval-dev-ronda4");
    const { DEV5_INTERPRET, DEV5_FACTS, DEV5_ADVISOR } = await import("./eval-dev-ronda5");
    const { DEV6_INTERPRET, DEV6_FACTS, DEV6_ADVISOR } = await import("./eval-dev-ronda6");
    const { DEV3_INTERPRET } = await import("./eval-dev-ronda3");
    expect(DEV_REPEATS).toBe(1);
    expect(repeatsOf("dev")).toBe(1);
    expect(repeatsOf("val")).toBe(EVAL_REPEATS);
    const dev = new Set(evalTexts("dev"));
    for (const t of DEV_HISTORIC_MISSES) expect(dev.has(t), t).toBe(true);
    for (const x of [...DEV5_INTERPRET, ...DEV6_INTERPRET]) expect(dev.has(x.text)).toBe(true);
    for (const x of [...DEV5_FACTS, ...DEV6_FACTS, ...DEV5_ADVISOR, ...DEV6_ADVISOR]) expect(dev.has(x.q)).toBe(true);
    for (const x of [...DEV3_INTERPRET, ...DEV4_INTERPRET].filter((y) => y.kind === "ambigua")) expect(dev.has(x.text)).toBe(true);
    const recent = DEV5_INTERPRET.concat(DEV6_INTERPRET);
    expect([...DEV3_INTERPRET, ...DEV4_INTERPRET].filter((y) => y.kind === "clara" && !DEV_HISTORIC_MISSES.includes(y.text)).some((y) => dev.has(y.text) && !recent.some((z) => z.text === y.text))).toBe(false);
    expect(evalSizes("dev").interpret).toBeLessThan(400);
  });

  it("los costos estimados de las dos corridas (validación + demos; desarrollo) caben juntos el mismo día en el tope diario de $1.50", async () => {
    const { EVAL_JOBS, repeatsOf, EVAL_BUDGET_USD, DEV_ADAPT_EVERY, evalItem, evalSizes } = await import("./eval-run");
    const { costOf, approxTokens, DEFAULT_MODEL, CAPS } = await import("../written");
    const est = { dev: 0, val: 0 };
    for (const set of ["dev", "val"] as const) {
      for (let i = 0; i < evalSizes(set).interpret; i++) {
        const it = evalItem(set, i);
        const spec = EPISODES[it.ep]; const run = runAt(spec, it.node, it.expect ?? it.options)!;
        const m = interpretMessages(spec, run, nodeOf(spec, run)!, sayOf(spec, run), it.text);
        // salida real ~150 tokens (estimación conservadora: 200); + adaptación (~1,100 de entrada, 220 de salida) + auditor en validación
        est[set] += repeatsOf(set) * costOf(DEFAULT_MODEL, approxTokens(m.map((x) => x.content).join("\n")) + 20, 200);
        if (set === "val" || i % DEV_ADAPT_EVERY === 0) est[set] += costOf(DEFAULT_MODEL, 1100, 220) + (set === "val" ? costOf(DEFAULT_MODEL, 500, 60) : 0);
      }
      est[set] += EVAL_JOBS.filter((j) => j.kind === "fact" && j.set === set).length * 0.0003 + EVAL_JOBS.filter((j) => j.kind === "advisor" && j.set === set).length * 0.0008;
    }
    est.val += EVAL_JOBS.filter((j) => j.kind === "demo").length * 0.006;
    console.info(`[eval] costo estimado: validación $${est.val.toFixed(3)} · desarrollo $${est.dev.toFixed(3)}`);
    expect(est.val).toBeLessThan(EVAL_BUDGET_USD);
    expect(est.dev).toBeLessThan(EVAL_BUDGET_USD);
    expect(est.val + est.dev).toBeLessThan(EVAL_BUDGET_USD);
    expect(EVAL_BUDGET_USD).toBeLessThanOrEqual(CAPS.dailyUsd);
  }, 60_000);
});
