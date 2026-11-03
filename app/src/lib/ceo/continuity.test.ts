/**
 * Continuidad: «lo que viene de antes» recuerda decisiones anteriores SIN inventar consecuencias.
 * Cada frase debe poder auditarse contra los datos de la partida: el asunto citado se resolvió antes, la postura
 * citada es la de la opción elegida, el cambio de indicador es el efecto real que sumó el motor.
 */
import { describe, expect, it } from "vitest";
import { classicStart, playSeason } from "./season-sim";
import { continuityOf } from "./continuity";
import { effectOf, entries, packOf } from "./engine";
import { stanceOf } from "./relations";

const COS = ["cumbre", "forja", "brasa", "kubit", "puntomadero", "vertice"];
const STRATS = ["azar", "criterio_y_tablero", "peor_score", "contesta_la_mitad"];

describe("continuidad de la empresa", () => {
  const runs = COS.flatMap((c) => STRATS.map((st) => ({ c, st, r: playSeason(classicStart(c), st, `${c}|${st}|cont`) })));

  it("solo cita asuntos resueltos ANTES de que llegara este, y con datos reales de la partida", () => {
    let checked = 0;
    for (const { r } of runs) {
      const es = entries(r.state, r.at);
      const byId = new Map(es.map((e) => [e.item.id, e]));
      for (const e of es) {
        for (const l of continuityOf(r.state, e.item.id, r.at).links) {
          const src = byId.get(l.from)!;
          expect(src, l.from).toBeTruthy();
          expect(src.status === "decidido" || src.status === "vencido").toBe(true);
          expect(src.decision ? src.decision.at : src.deadline).toBeLessThanOrEqual(e.arrivesAt);
          expect(l.from).not.toBe(e.item.id);
          expect(l.text).toContain(src.item.subject);
          if (l.kind === "detonador") {
            expect(e.item.trigger?.item).toBe(l.from);
            expect(l.text).toContain(src.status === "vencido" ? src.item.expired.outcome : src.option!.outcome);
          }
          if (l.kind === "persona") {
            const st = src.status === "vencido" ? -1 : stanceOf(src.option!)[l.who!];
            expect(st).toBe(l.facts.stance);
            expect(st).not.toBe(0);
            if (src.status === "vencido") expect(src.item.from).toBe(l.who);
          }
          if (l.kind === "indicador") {
            const d = effectOf(r.state, src)[l.kpi!] ?? 0;
            expect(d).toBe(l.facts.delta);
            expect(l.text).toContain(`${d > 0 ? "+" : "−"}${Math.abs(d)}`);
            expect(e.item.options.some((o) => (o.effects[l.kpi!] ?? 0) !== 0)).toBe(true);
          }
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(300);
  });

  it("no repite el mismo asunto anterior dos veces y muestra como mucho 3 recuerdos", () => {
    for (const { r } of runs) for (const e of entries(r.state, r.at)) {
      const ls = continuityOf(r.state, e.item.id, r.at).links;
      expect(ls.length).toBeLessThanOrEqual(3);
      expect(new Set(ls.map((l) => l.from)).size).toBe(ls.length);
    }
  });

  it("la empresa recuerda: la mayoría de los asuntos después del primer día trae algo de antes", () => {
    for (const { c, st, r } of runs) {
      const es = entries(r.state, r.at).filter((e) => e.item.day > 1 && e.status !== "futuro");
      const w = es.filter((e) => continuityOf(r.state, e.item.id, r.at).links.length > 0).length;
      expect(w / es.length, `${c} ${st}`).toBeGreaterThanOrEqual(0.6);
    }
  });

  it("una consecuencia que llegó por tu decisión siempre lo dice primero", () => {
    for (const { r } of runs) for (const e of entries(r.state, r.at).filter((x) => x.item.trigger && x.status !== "futuro")) {
      expect(continuityOf(r.state, e.item.id, r.at).links[0]?.kind).toBe("detonador");
    }
  });

  it("un asunto que no ha llegado no tiene recuerdos, y el texto usa los nombres reales del elenco", () => {
    const { r } = runs[0];
    const pack = packOf(r.state);
    for (const e of entries(r.state, r.at)) for (const l of continuityOf(r.state, e.item.id, r.at).links.filter((x) => x.who)) expect(l.text.startsWith(pack.cast[l.who!].name)).toBe(true);
    const first = entries(r.state, r.state.startedAt!)[0];
    expect(continuityOf(r.state, first.item.id, r.state.startedAt!).links).toEqual([]);
  });
});
