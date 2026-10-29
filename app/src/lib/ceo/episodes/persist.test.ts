import { describe, expect, it } from "vitest";
import { migrate, newState } from "../engine";
import { mergeStates } from "../sync";
import { replay, type GameAction } from "../replay";
import { sanitizeAction } from "../journal";
import type { CeoState } from "../types";
import { actEpisode, openEpisode, restartEpisode } from "./catalog";

const T = Date.UTC(2026, 9, 1, 14);
const base = (over: Partial<CeoState> = {}): CeoState => {
  const s = newState();
  return { ...s, name: "Ana", alias: "Ana", company: "cumbre", startedAt: T, savedAt: T, lastActiveAt: T, ...over };
};
const step = (s: CeoState, act: Parameters<typeof actEpisode>[2]) => {
  const r = actEpisode(s, "supernorte", act);
  if (r.error) throw new Error(r.error);
  return r.state;
};

describe("episodios · persistencia en la partida", () => {
  it("abrir guarda la partida con memoria de la temporada; reabrir no la reinicia", () => {
    const s0 = base({ decisions: { "d1-hector": { option: "a", at: T - 1 } as never } });
    const s1 = openEpisode(s0, "supernorte", T + 1);
    expect(s1.episodes?.supernorte.phase).toBe("briefing");
    expect(s1.episodes?.supernorte.flags).toContain("comio");
    const s2 = step(s1, { type: "fact", at: T + 2, factId: "margen" });
    expect(openEpisode(s2, "supernorte", T + 3)).toBe(s2);
    expect(openEpisode(s2, "no-existe", T + 3)).toBe(s2);
  });

  it("migrate conserva partidas válidas y descarta las dañadas sin romper la carrera", () => {
    const s = step(openEpisode(base(), "supernorte", T + 1), { type: "begin", at: T + 2 });
    const back = migrate(JSON.parse(JSON.stringify(s)));
    expect(back.episodes?.supernorte.phase).toBe("deciding");
    const bad = migrate({ ...JSON.parse(JSON.stringify(s)), episodes: { supernorte: { contract: 99 }, otro: "x" } });
    expect(bad.episodes).toBeUndefined();
    expect(bad.name).toBe("Ana");
    expect(migrate({ ...base() }).episodes).toBeUndefined();
  });

  it("dos dispositivos: se conserva la copia del episodio con más avance", () => {
    const opened = openEpisode(base(), "supernorte", T + 1);
    const phone = { ...step(step(opened, { type: "begin", at: T + 2 }), { type: "decide", at: T + 3, strategy: "explorar" }), savedAt: T + 3 };
    const laptop = { ...step(opened, { type: "fact", at: T + 5, factId: "plazo" }), savedAt: T + 9 };
    const m = mergeStates(laptop, phone)!;
    expect(m.state.episodes?.supernorte.turns.length).toBe(1);
    const m2 = mergeStates(phone, laptop)!;
    expect(m2.state.episodes?.supernorte.turns.length).toBe(1);
  });

  it("reiniciar en modo prueba crea otra partida y al sincronizar gana la nueva", () => {
    const old = { ...step(step(openEpisode(base(), "supernorte", T + 1), { type: "begin", at: T + 2 }), { type: "decide", at: T + 3, strategy: "explorar" }), savedAt: T + 3 };
    const fresh = { ...restartEpisode(old, "supernorte", T + 50), savedAt: T + 50 };
    expect(fresh.episodes?.supernorte.turns.length).toBe(0);
    expect(mergeStates(fresh, old)!.state.episodes?.supernorte.runId).toBe(fresh.episodes?.supernorte.runId);
    expect(mergeStates(old, fresh)!.state.episodes?.supernorte.runId).toBe(fresh.episodes?.supernorte.runId);
  });

  it("el reproductor reconstruye el mismo episodio desde el diario", () => {
    const actions: GameAction[] = [
      { type: "start", at: T, name: "Ana", company: "cumbre" },
      { type: "episodeOpen", at: T + 10, id: "supernorte" },
      { type: "episode", at: T + 20, id: "supernorte", act: { type: "fact", at: T + 20, factId: "metas" } },
      { type: "episode", at: T + 30, id: "supernorte", act: { type: "begin", at: T + 30 } },
      { type: "episode", at: T + 40, id: "supernorte", act: { type: "decide", at: T + 40, strategy: "explorar" } },
      { type: "episode", at: T + 50, id: "supernorte", act: { type: "decide", at: T + 50, strategy: "paquete", params: { descuento: 1.5, promo: 1.5, plazo: 60 } } },
    ];
    const cleaned = actions.map((a) => sanitizeAction(JSON.parse(JSON.stringify(a))));
    expect(cleaned.every(Boolean)).toBe(true);
    const r = replay(cleaned as GameAction[]);
    expect(r.rejected).toEqual([]);
    expect(r.state.episodes?.supernorte.turns.map((t) => t.strategy)).toEqual(["explorar", "paquete"]);
    expect(r.state.episodes?.supernorte.terms.descuento).toBe(1.5);
  });

  it("el diario rechaza pasos de episodio mal formados", () => {
    expect(sanitizeAction({ type: "episode", at: T, id: "supernorte", act: { type: "hackear", at: T } })).toBeNull();
    expect(sanitizeAction({ type: "episode", at: T, id: "supernorte", act: { type: "decide", at: T } })).toBeNull();
    expect(sanitizeAction({ type: "episodeOpen", at: T })).toBeNull();
  });

  it("de vacaciones no se avanza el episodio", () => {
    const actions: GameAction[] = [
      { type: "start", at: T, name: "Ana", company: "cumbre" },
      { type: "episodeOpen", at: T + 10, id: "supernorte" },
      { type: "pause", at: T + 20, until: null },
      { type: "episode", at: T + 30, id: "supernorte", act: { type: "begin", at: T + 30 } },
    ];
    const r = replay(actions);
    expect(r.rejected).toEqual([3]);
    expect(r.state.episodes?.supernorte.phase).toBe("briefing");
  });
});
