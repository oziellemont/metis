import { describe, expect, it } from "vitest";
import { arrivalOf, newState } from "./engine";
import { applyAction, replay, type GameAction } from "./replay";
import { CUMBRE } from "./companies/cumbre";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
const start: GameAction = { type: "start", at: T0, name: "Oziel Leal", company: "cumbre", settings: { tz: "America/Monterrey" } };

describe("reproductor de acciones", () => {
  it("arranca igual que la app (alias «Oziel L.», misma semilla de llegadas)", () => {
    const { state } = replay([start]);
    expect(state.alias).toBe("Oziel L.");
    expect(state.startedAt).toBe(T0);
    expect(state.company).toBe("cumbre");
  });
  it("rechaza decidir algo que todavía no llega", () => {
    const late = CUMBRE.items.find((i) => i.day === 3)!;
    const { rejected } = replay([start, { type: "decide", at: T0 + 60_000, item: late.id, option: late.options[0].id }]);
    expect(rejected).toEqual([1]);
  });
  it("rechaza una opción que no existe y decidir dos veces el mismo asunto", () => {
    const s = replay([start]).state;
    const first = CUMBRE.items.find((i) => i.day === 1 && i.slot === 1)!;
    const at = arrivalOf(s, first) + 60_000;
    const r = replay([start,
      { type: "decide", at, item: first.id, option: "zzz" },
      { type: "decide", at, item: first.id, option: first.options[0].id },
      { type: "decide", at: at + 1000, item: first.id, option: first.options[1].id },
    ]);
    expect(r.rejected).toEqual([1, 3]);
    expect(r.state.decisions[first.id].option).toBe(first.options[0].id);
  });
  it("rechaza ascender a media temporada y lecciones repetidas", () => {
    const r = replay([start, { type: "advance", at: T0 + 3600_000 }, { type: "lesson", at: T0 + 1, id: "mentalidad" }, { type: "lesson", at: T0 + 2, id: "mentalidad" }]);
    expect(r.rejected).toEqual([1, 3]);
  });
  it("es puro: aplicar una acción no modifica el estado anterior", () => {
    const s0 = newState();
    const copy = JSON.stringify(s0);
    applyAction(s0, start);
    expect(JSON.stringify(s0)).toBe(copy);
  });
});
