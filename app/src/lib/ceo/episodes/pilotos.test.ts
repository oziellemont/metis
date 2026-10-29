import { describe, expect, it } from "vitest";
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { applyEpisode, matchFact, startEpisode, strategiesFor, type EpisodeAction } from "./engine";
import { DIEGO, deriveDiego } from "./diego";
import { ALERGENO, AL, deriveAlergeno, economicsAlergeno, reaccionOcurre } from "./alergeno";
import { EPISODES } from "./catalog";
import { allEnds, lintEpisode } from "./validate";

const T0 = 7_000_000;
type Step = EpisodeAction extends infer A ? (A extends EpisodeAction ? Omit<A, "at"> : never) : never;
const d = (strategy: string, params?: Record<string, number>) => ({ type: "decide" as const, strategy, ...(params ? { params } : {}) });
const B = { type: "begin" as const };

function start(spec: EpisodeSpec, flags: string[], derive: (r: EpisodeRun) => Record<string, number>): EpisodeRun {
  const r = startEpisode(spec, T0, { runId: "prueba" });
  const base = { ...r, flags: [...flags] };
  return { ...base, terms: { ...base.terms, ...derive(base) } };
}
function play(spec: EpisodeSpec, run: EpisodeRun, steps: Step[]): EpisodeRun {
  let r = run;
  steps.forEach((s, i) => {
    const out = applyEpisode(spec, r, { ...s, at: T0 + 1000 * (i + 1) } as EpisodeAction);
    if (out.error) throw new Error(`${(s as { strategy?: string }).strategy ?? s.type}: ${out.error}`);
    r = out.run;
  });
  return r;
}
const kpi = (r: EpisodeRun, key: string) => r.outcome!.kpi.filter((k) => k.key === key).reduce((a, k) => a + k.delta, 0);

describe("P0-C · catálogo", () => {
  it("los dos pilotos están registrados como borrador, junto a SuperNorte", () => {
    expect(Object.keys(EPISODES).sort()).toEqual(["alergeno", "diego", "supernorte"]);
    expect(DIEGO.approval).toBe("borrador");
    expect(ALERGENO.approval).toBe("borrador");
  });
  it("pasan la validación editorial: todas las rutas tienen de 3 a 6 decisiones", () => {
    for (const s of [DIEGO, ALERGENO]) {
      expect(lintEpisode(s)).toEqual([]);
      const lens = new Set(allEnds(s).map((e) => e.length));
      expect([...lens].every((l) => l >= 3 && l <= 6)).toBe(true);
    }
  }, 60_000);
});

describe("Personas · La conversación con Diego", () => {
  const BIEN = [{ type: "fact" as const, factId: "patron" }, { type: "advisor" as const, id: "paty" }, B, d("ramiro_primero"), d("hechos"), d("validar"), d("acuerdo_claro", { seguimiento: 6 })];
  const MAL = [B, d("pedir_hector"), d("juicio"), d("confrontar_padre"), d("sin_acuerdo"), d("ceder")];

  it("la contraparte es Diego y la relación del caso es con él", () => {
    expect(DIEGO.counterpart).toBe("diego");
    expect(DIEGO.from).toBe("mariana");
  });

  it("preparar, abrir con hechos y cerrar un acuerdo con fecha: acuerdo válido, equipo y consejo suben", () => {
    const r = play(DIEGO, start(DIEGO, [], deriveDiego), BIEN);
    expect(r.phase).toBe("closed");
    expect(r.terms.acuerdo).toBe(1);
    expect(r.terms.seguimiento).toBe(6);
    expect(kpi(r, "equipo")).toBeGreaterThanOrEqual(2);
    expect(kpi(r, "consejo")).toBe(1);
    expect(r.outcome!.commitments.map((c) => c.id)).toContain("dg-propuestas");
    expect(r.outcome!.followUps.map((f) => f.id)).toContain("dg-1a1");
    expect(r.outcome!.events.some((e) => e.kind === "relacion")).toBe(true);
  });

  it("juzgar, confrontar y ceder ante Don Ramiro: sin acuerdo, el patrón se repite", () => {
    const r = play(DIEGO, start(DIEGO, [], deriveDiego), MAL);
    expect(r.phase).toBe("closed");
    expect(r.terms.acuerdo).toBe(0);
    expect(r.trust).toBeLessThan(0);
    expect(kpi(r, "equipo")).toBe(-2);
    expect(kpi(r, "consejo")).toBe(-2);
    expect(r.outcome!.risks.map((x) => x.id)).toContain("dg-patron");
    expect(r.outcome!.followUps.map((f) => f.id)).toContain("dg-repite");
  });

  it("si alguien ya le contó a Don Ramiro (azar), llama aunque la plática salga bien; y se separa como suerte", () => {
    const r = play(DIEGO, start(DIEGO, ["ramiro_enterado"], deriveDiego), [B, d("pronto"), d("hechos"), d("validar"), d("acuerdo_plan"), d("sostener")]);
    expect(r.turns.map((t) => t.node)).toContain("p5");
    expect(r.outcome!.luck).toMatch(/Fuera de tu control/);
    expect(kpi(r, "consejo")).toBe(1);
  });

  it("avisarle antes a Don Ramiro evita la llamada", () => {
    const r = play(DIEGO, start(DIEGO, ["ramiro_enterado"], deriveDiego), BIEN);
    expect(r.turns.map((t) => t.node)).not.toContain("p5");
  });

  it("el dato de sucesión no existe y se dice así", () => {
    expect(matchFact(DIEGO, "¿Don Ramiro lo ve como sucesor?")?.kind).toBe("unknown");
  });

  it("el XP se otorga una sola vez al cerrar", () => {
    const r = play(DIEGO, start(DIEGO, [], deriveDiego), BIEN);
    expect(r.xp).toBe(20 * 4 + 40);
    const again = applyEpisode(DIEGO, r, { type: "decide", strategy: "sostener", at: T0 + 99_000 });
    expect(again.error).toBeTruthy();
  });
});

describe("Crisis · Lote L-2291 (obligaciones no negociables)", () => {
  const BIEN = [B, d("retiro_total"), d("avisar_hoy"), d("alerta"), d("reclamar"), d("auditoria")];
  const MAL = [B, d("esperar_lab"), d("avisar_lab"), d("minimizar"), d("seguir_esperando")];

  it("tiene tres obligaciones y sus datos críticos se muestran siempre (no se consumen como consulta)", () => {
    expect(ALERGENO.obligations!.map((o) => o.id)).toEqual(["retiro", "autoridad", "alergicos"]);
    const crit = ALERGENO.facts.facts.filter((f) => f.critical).map((f) => f.id);
    expect(crit).toEqual(expect.arrayContaining(["obligacion", "riesgo"]));
    const r = start(ALERGENO, [], deriveAlergeno);
    const out = applyEpisode(ALERGENO, r, { type: "fact", factId: "obligacion", at: T0 + 1 });
    expect(out.run.queries.length).toBe(0);
  });

  it("cumplir las tres: obligaciones cumplidas, clientes suben, el consejo no castiga; el reclamo recupera la mitad", () => {
    const r = play(ALERGENO, start(ALERGENO, [], deriveAlergeno), BIEN);
    expect(r.outcome!.obligations!.every((o) => o.met)).toBe(true);
    expect(kpi(r, "clientes")).toBe(2);
    expect(kpi(r, "consejo")).toBe(0);
    const x = economicsAlergeno(r);
    expect(x.costo).toBe(AL.retiroTotal);
    expect(x.neto).toBe(0.8);
    expect(kpi(r, "caja")).toBe(-2);
    expect(r.outcome!.events.filter((e) => e.rule === "obligación no negociable").length).toBe(3);
  });

  it("esperar, avisar tarde y minimizar: las tres incumplidas y el consejo carga −9 (tope ±10)", () => {
    const r = play(ALERGENO, start(ALERGENO, [], deriveAlergeno), MAL);
    expect(r.outcome!.obligations!.filter((o) => !o.met).length).toBe(3);
    expect(kpi(r, "consejo")).toBe(-9);
    expect(kpi(r, "clientes")).toBe(-6);
    expect(r.outcome!.risks.map((x) => x.id)).toEqual(expect.arrayContaining(["al-autoridad", "al-confianza"]));
  });

  it("recortar el retiro para ahorrar rompe la obligación de retirar todo", () => {
    const r = play(ALERGENO, start(ALERGENO, [], deriveAlergeno), [B, d("retiro_total"), d("avisar_hoy"), d("alerta"), d("recortar"), d("auditoria")]);
    expect(r.outcome!.obligations!.find((o) => o.id === "retiro")!.met).toBe(false);
    expect(r.terms.cumplidas).toBe(2);
  });

  it("«no avisar» solo aparece si ya se retiró el producto; ampliar solo si no", () => {
    const tras = (first: string) => play(ALERGENO, start(ALERGENO, [], deriveAlergeno), [B, d(first)]);
    expect(strategiesFor(ALERGENO, tras("retiro_total")).map((s) => s.id)).toContain("no_avisar");
    expect(strategiesFor(ALERGENO, tras("esperar_lab")).map((s) => s.id)).not.toContain("no_avisar");
    const a4 = play(ALERGENO, start(ALERGENO, [], deriveAlergeno), [B, d("parcial"), d("avisar_hoy"), d("alerta")]);
    expect(strategiesFor(ALERGENO, a4).map((s) => s.id)).toEqual(expect.arrayContaining(["ampliar", "seguir_esperando"]));
  });

  it("la reacción alérgica (azar) solo cuenta si el producto siguió en anaquel", () => {
    const retiro = play(ALERGENO, start(ALERGENO, ["reaccion"], deriveAlergeno), BIEN);
    expect(reaccionOcurre(retiro)).toBe(false);
    expect(retiro.outcome!.luck).toMatch(/evitó la reacción/);
    const espera = play(ALERGENO, start(ALERGENO, ["reaccion"], deriveAlergeno), MAL);
    expect(reaccionOcurre(espera)).toBe(true);
    expect(kpi(espera, "clientes")).toBe(-8);
  });

  it("el XP se otorga una sola vez al cerrar", () => {
    const r = play(ALERGENO, start(ALERGENO, [], deriveAlergeno), BIEN);
    expect(r.xp).toBe(20 * 5 + 40);
  });
});
