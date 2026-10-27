/**
 * PARTIDAS DORADAS · red de seguridad de mêtis CEO.
 *
 * Cada archivo de `data/` es una partida completa grabada (acciones con su hora) y fotografías
 * del resultado en varios momentos: indicadores, relaciones, XP, nivel, estados de cada asunto,
 * proyecto de cambio, veredicto, racha, perfil, insignias, dilemas, lecciones y carrera.
 *
 * Si un cambio de código altera CUALQUIERA de esos resultados, esta prueba falla.
 * Un cambio intencional de reglas exige regenerar los archivos (ver record.test.ts) y explicarlo en el PR.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { applyAction, replay } from "../replay";
import { migrate, newState } from "../engine";
import { snapshotOf, type Golden } from "./play";

const DIR = join(__dirname, "data");
const GOLDENS: Golden[] = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));

describe("partidas doradas", () => {
  it("hay al menos 10 partidas y cubren las 3 empresas, aprobar, reprobar, vencidos y ascensos", () => {
    expect(GOLDENS.length).toBeGreaterThanOrEqual(10);
    const finals = GOLDENS.map((g) => g.checkpoints[g.checkpoints.length - 1].snapshot);
    const runs = finals.flatMap((f) => f.career);
    for (const c of ["cumbre", "forja", "brasa"]) expect(runs.some((r) => r.company === c), c).toBe(true);
    expect(runs.some((r) => r.passed)).toBe(true);
    expect(runs.some((r) => !r.passed)).toBe(true);
    expect(runs.some((r) => r.tier >= 2)).toBe(true);
    expect(GOLDENS.some((g) => g.checkpoints.some((c) => Object.values(c.snapshot.statuses).includes("vencido")))).toBe(true);
  });

  describe.each(GOLDENS.map((g) => [g.id, g] as const))("%s", (_id, g) => {
    it("todas las acciones grabadas siguen siendo válidas", () => {
      expect(replay(g.actions).rejected).toEqual([]);
    });
    it("cada fotografía coincide exactamente con lo grabado", () => {
      let s = newState();
      let i = 0;
      for (const cp of g.checkpoints) {
        for (; i < cp.after; i++) s = applyAction(s, g.actions[i]).state;
        expect(snapshotOf(s, cp.at), `${g.id} tras ${cp.after} acciones`).toEqual(cp.snapshot);
      }
    });
    it("guardar y volver a leer el avance (JSON + migrate) no cambia nada", () => {
      const { state } = replay(g.actions);
      const last = g.checkpoints[g.checkpoints.length - 1];
      const roundTrip = migrate(JSON.parse(JSON.stringify(state)));
      expect(snapshotOf(roundTrip, last.at)).toEqual(last.snapshot);
    });
  });
});
