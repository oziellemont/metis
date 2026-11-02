import { describe, expect, it } from "vitest";
import { effectOf, entries, packOf } from "./engine";
import { playSeason, classicStart } from "./season-sim";
import { decisionLesson } from "./learning";
import type { KpiKey } from "./types";

const BANNED = /\b(correcta|incorrecta|equivocad[oa]|la mejor opción|la respuesta buena)\b/i;
const COMPANIES = ["cumbre", "forja", "brasa", "kubit", "puntomadero", "vertice"];

describe("lo que deja cada decisión (aprendizaje)", () => {
  for (const c of COMPANIES) {
    it(`${c}: cada asunto cerrado explica ganancias, costos, riesgo, principio y alternativa sin calificar`, () => {
      for (const strat of ["azar", "mejor_score", "peor_score", "contesta_la_mitad"]) {
        const r = playSeason(classicStart(c), strat, `${c}|aprende|${strat}`);
        const pack = packOf(r.state);
        const closed = entries(r.state, r.at).filter((e) => e.status === "decidido" || e.status === "vencido");
        expect(closed.length).toBeGreaterThan(0);
        for (const e of closed) {
          const l = decisionLesson(r.state, e, pack, r.at)!;
          expect(l).not.toBeNull();
          expect(l.principle).toBe(e.item.bitacora.nota);
          // Lo ganado y lo sacrificado coinciden con el efecto oficial del motor.
          const eff = effectOf(r.state, e);
          for (const k of Object.keys(eff) as KpiKey[]) {
            const d = eff[k] ?? 0;
            if (d > 0) expect(l.gained.join(" ")).toContain(`${pack.kpiLabel[k]} +${d}`);
            if (d < 0) expect(l.sacrificed.join(" ")).toContain(`${pack.kpiLabel[k]} ${d}`);
          }
          const all = [...l.gained, ...l.sacrificed, ...l.risks, l.nextTime ?? ""].join(" ");
          expect(all).not.toMatch(BANNED);
          // La alternativa nunca repite la opción elegida.
          if (e.option && l.nextTime) expect(l.nextTime).not.toContain(e.option.text.trim());
          if (l.nextTime) expect(l.nextTime).not.toMatch(/««|»»/);
          if (e.status === "vencido") expect(l.sacrificed.join(" ")).toMatch(/iniciativa/);
        }
      }
    });
  }

  it("casi siempre ofrece una alternativa defendible para comparar", () => {
    let total = 0, withAlt = 0;
    for (const c of COMPANIES) {
      const r = playSeason(classicStart(c), "azar", `${c}|alt`);
      for (const e of entries(r.state, r.at).filter((x) => x.status === "decidido")) {
        total++;
        if (decisionLesson(r.state, e, packOf(r.state), r.at)?.nextTime) withAlt++;
      }
    }
    expect(withAlt / total).toBeGreaterThan(0.7);
  });

  it("un asunto que no se ha cerrado no tiene lección", () => {
    const s = classicStart("cumbre")();
    const e = entries(s, s.startedAt ?? Date.now())[0];
    if (e) expect(decisionLesson(s, { ...e, status: "pendiente" }, packOf(s))).toBeNull();
  });
});
