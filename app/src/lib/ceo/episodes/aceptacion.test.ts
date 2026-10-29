/**
 * P0-D · Los 15 chequeos de la adenda v3.3 (§10 de arquitectura-p0.md), corridos sobre los TRES pilotos.
 * Cada `it` lleva el número del chequeo. El 7 (IA) se completa con la evaluación con gasto; el 15 con capturas.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BRIEFING_MS, MAX_DECISIONS, MIN_DECISIONS, type EpisodeRun, type EpisodeSpec } from "./contracts";
import { advisorAnswer, applyEpisode, briefingLeftMs, criticalFacts, pickRun, replayEpisode, sanitizeRun, startEpisode, strategiesFor, type EpisodeAction } from "./engine";
import { EPISODES } from "./catalog";
import { interpretLocal, parseAdvisor } from "./ai";
import { allEnds, lintEpisode } from "./validate";
import { lessonById } from "../lessons";

const T0 = 9_000_000;
const SPECS = Object.values(EPISODES);
const ends = new Map(SPECS.map((s) => [s.id, allEnds(s)]));
const fresh = (s: EpisodeSpec) => ({ ...startEpisode(s, T0, { runId: "acept" }), flags: [] as string[] });
const ok = (s: EpisodeSpec, r: EpisodeRun, a: EpisodeAction) => { const o = applyEpisode(s, r, a); if (o.error) throw new Error(o.error); return o.run; };
/** Dos cierres con desenlaces distintos (acuerdo distinto) para el chequeo 11. */
function contrasting(s: EpisodeSpec) {
  const all = ends.get(s.id)!.filter((e) => e.run.phase === "closed");
  const a = all[0];
  const b = all.find(
    (e) =>
      e.run.turns[0].strategy !== a.run.turns[0].strategy &&
      e.run.outcome!.headline !== a.run.outcome!.headline &&
      JSON.stringify(e.run.outcome!.kpi) !== JSON.stringify(a.run.outcome!.kpi),
  )!;
  return [a.run, b.run] as const;
}

describe.each(SPECS.map((s) => [s.id, s] as const))("Chequeos de aceptación · %s", (_id, spec) => {
  it("1 · toda ruta tiene de 3 a 6 decisiones y cierra", () => {
    expect(lintEpisode(spec)).toEqual([]);
    for (const e of ends.get(spec.id)!) {
      expect(e.run.phase).toBe("closed");
      expect(e.length).toBeGreaterThanOrEqual(MIN_DECISIONS);
      expect(e.length).toBeLessThanOrEqual(MAX_DECISIONS);
    }
  }, 60_000);

  it("2 · 2 consultas de datos; la tercera se rechaza; los datos críticos no gastan", () => {
    const facts = spec.facts.facts.filter((f) => !f.critical);
    let r = fresh(spec);
    r = ok(spec, r, { type: "fact", at: T0 + 1, factId: facts[0].id });
    r = ok(spec, r, { type: "fact", at: T0 + 2, factId: facts[1].id });
    expect(applyEpisode(spec, r, { type: "fact", at: T0 + 3, factId: facts[2].id }).error).toBeTruthy();
    for (const c of criticalFacts(spec)) expect(applyEpisode(spec, fresh(spec), { type: "fact", at: T0 + 1, factId: c.id }).run.queries).toHaveLength(0);
  });

  it("3 · un solo colaborador por caso; su voz no dicta la opción", () => {
    const a = spec.advisors[0];
    const r = ok(spec, fresh(spec), { type: "advisor", at: T0 + 1, id: a.id });
    expect(applyEpisode(spec, r, { type: "advisor", at: T0 + 2, id: spec.advisors[1].id }).error).toBeTruthy();
    const authored = advisorAnswer(spec, fresh(spec), a);
    const opts = Object.values(spec.nodes).flatMap((n) => n.strategies.map((s) => s.text.toLowerCase()));
    for (const o of opts) if (o.length > 40) expect(authored.toLowerCase()).not.toContain(o.slice(0, 40));
    expect(parseAdvisor(spec, a, authored, JSON.stringify({ answer: "Elige la opción correcta, la respuesta correcta es la primera sin duda." }))).toBeNull();
  });

  it("4 · al vencer los 180 s se bloquean las consultas, no la decisión", () => {
    const late = T0 + BRIEFING_MS + 1;
    const r = fresh(spec);
    expect(briefingLeftMs(r, late)).toBe(0);
    expect(applyEpisode(spec, r, { type: "fact", at: late, factId: spec.facts.facts.find((f) => !f.critical)!.id }).error).toBeTruthy();
    const d = ok(spec, r, { type: "begin", at: late + 5 });
    expect(strategiesFor(spec, d).length).toBeGreaterThanOrEqual(2);
  });

  it("5 · se puede empezar a decidir en el segundo 0, sin consultar", () => {
    const r = ok(spec, fresh(spec), { type: "begin", at: T0 });
    expect(r.phase).toBe("deciding");
    expect(r.node).toBe(spec.start);
  });

  it("6 · pausar detiene el reloj; recargar reconstruye la partida", () => {
    let r = ok(spec, fresh(spec), { type: "pause", at: T0 + 30_000 });
    expect(briefingLeftMs(r, T0 + 3_600_000)).toBe(BRIEFING_MS - 30_000);
    r = ok(spec, r, { type: "resume", at: T0 + 3_600_000 });
    expect(sanitizeRun(JSON.parse(JSON.stringify(r)))).toEqual(r);
  });

  it("7 · texto libre: el respaldo sin IA nunca elige algo fuera de lo disponible (la IA se mide con su evaluación)", () => {
    const r = ok(spec, fresh(spec), { type: "begin", at: T0 });
    const st = strategiesFor(spec, r)[0];
    const got = interpretLocal(spec, r, st.text);
    expect(got?.strategy).toBe(st.id);
    expect(interpretLocal(spec, r, "zzz qqq www sin relación alguna")).toBeNull();
  });

  it("8 · los personajes recuerdan lo que pasó (las respuestas cambian según la ruta)", () => {
    const replies = new Set(ends.get(spec.id)!.map((e) => e.run.turns.map((t) => t.reply.join(" ")).join("|")));
    expect(replies.size).toBeGreaterThan(5);
    // y la temporada: si hay memoria previa, algún texto cambia con ella
    if (spec.history?.length) {
      const h = spec.history[0];
      const withMem = startEpisode(spec, T0, { runId: "m", decisions: { [h.item]: { option: h.options[0] } } as never });
      expect(withMem.flags).toContain(h.flag);
    }
  });

  it("9 · ninguna decisión intermedia mueve KPI; el cierre explica cada cambio y respeta el tope", () => {
    for (const e of ends.get(spec.id)!.slice(0, 200)) {
      for (const k of e.run.outcome!.kpi) {
        expect(k.why.length).toBeGreaterThan(10);
        expect(Math.abs(k.delta)).toBeLessThanOrEqual(10);
      }
    }
    const r = ok(spec, ok(spec, fresh(spec), { type: "begin", at: T0 }), { type: "decide", at: T0 + 1, strategy: strategiesFor(spec, ok(spec, fresh(spec), { type: "begin", at: T0 }))[0].id });
    expect(r.outcome).toBeNull();
  }, 60_000);

  it("10 · enseña un concepto: concepto, lección existente y evidencia por dimensión", () => {
    expect(spec.concept.title.length).toBeGreaterThan(5);
    expect(lessonById(spec.lesson)).toBeTruthy();
    const e = ends.get(spec.id)![0].run.outcome!;
    expect(e.evidence.length).toBeGreaterThan(0);
  });

  it("11 · dos rutas coherentes: acuerdos y consecuencias distintos", () => {
    const [a, b] = contrasting(spec);
    expect(a.outcome!.headline).not.toBe(b.outcome!.headline);
    expect(JSON.stringify(a.outcome!.kpi)).not.toBe(JSON.stringify(b.outcome!.kpi));
  });

  it("12 · la empresa recuerda: los seguimientos llegan con fecha según lo que hiciste", () => {
    const withF = ends.get(spec.id)!.filter((e) => e.run.outcome!.followUps.length);
    expect(withF.length).toBeGreaterThan(0);
    for (const e of withF.slice(0, 50)) for (const f of e.run.outcome!.followUps) expect(f.at).toBeGreaterThan(e.run.closedAt!);
    const ids = new Set(ends.get(spec.id)!.map((e) => e.run.outcome!.followUps.map((f) => f.id).sort().join(",")));
    expect(ids.size).toBeGreaterThan(1);
  });

  it("13 · Academy contextual: la lección se ofrece al cerrar, nunca antes", () => {
    const view = readFileSync(new URL("../../../components/ceo/EpisodeView.tsx", import.meta.url), "utf8");
    const links = [...view.matchAll(/\/ceo\/academy\//g)].map((m) => m.index!);
    const closeAt = view.indexOf("function Close(");
    expect(links.length).toBeGreaterThan(0);
    for (const i of links) expect(i).toBeGreaterThan(closeAt);
    expect(spec.briefing.message.join(" ")).not.toMatch(/academy|lecci[oó]n/i);
  });

  it("14 · no se pierde progreso: sincronizar conserva la copia con más avance y el diario reproduce la partida", () => {
    const e = ends.get(spec.id)!.find((x) => x.length >= 4)!;
    const base = { ...startEpisode(spec, 0, { runId: "validar" }), flags: e.run.flags.filter((f) => (spec.chance ?? []).some((c) => c.flag === f) || (spec.history ?? []).some((h) => h.flag === f)) };
    const rep = replayEpisode(spec, base, e.actions);
    expect(rep.rejected).toEqual([]);
    expect(rep.run.outcome!.headline).toBe(e.run.outcome!.headline);
    const half = replayEpisode(spec, base, e.actions.slice(0, 2)).run;
    expect(pickRun(half, rep.run)).toBe(rep.run);
    expect(pickRun(rep.run, half)).toBe(rep.run);
  });
});

describe("Chequeo 15 · móvil y escritorio", () => {
  it("las pantallas de caso usan el recorrido por pasos a pantalla completa (las capturas van en el reporte)", () => {
    const shell = readFileSync(new URL("../../../components/ceo/CeoShell.tsx", import.meta.url), "utf8");
    expect(shell).toContain('path.startsWith("/ceo/episodio/")');
    const view = readFileSync(new URL("../../../components/ceo/EpisodeView.tsx", import.meta.url), "utf8");
    expect(view).toContain("<Stage");
  });
});
