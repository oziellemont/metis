/**
 * Casos ejecutivos en la carrera normal (reglas v3).
 * Llegan a la temporada de Botanas Cumbre, se abren solo cuando llegan, mueven indicadores y XP al cerrarse
 * (una vez por empresa) y el reto final espera a que los cierres. Las temporadas v2 no cambian.
 */
import { describe, expect, it } from "vitest";
import {
  advance, casesDoneOf, casesProgress, entries, episodeEntries, episodeSeasonXp, kpis, newState, nextArrivalOf, openSeasonEpisode,
  pinArrived, runXp, seasonEpisodesOf, seasonItems, streakOf, xpOf,
} from "../engine";
import { replay, type GameAction } from "../replay";
import { closeChange, startChange } from "../relations";
import { RULES_VERSION, ruleSet } from "../rules";
import type { CeoState } from "../types";
import { EPISODES, SEASON_EPISODES, actEpisode } from "./catalog";
import { strategiesFor, type EpisodeAction } from "./engine";

const T = Date.UTC(2026, 9, 5, 15);
const H = 3_600_000;
const DAY = 24 * H;
const started = (over: Partial<CeoState> = {}): CeoState => ({ ...newState(), name: "Ana Torres", alias: "Ana T.", company: "cumbre", startedAt: T, savedAt: T, lastActiveAt: T, ...over });

/** Juega un caso de principio a fin con la primera estrategia disponible en cada paso. */
function finish(s: CeoState, id: string, at: number): { state: CeoState; at: number } {
  let t = at;
  let n = openSeasonEpisode(s, id, t);
  if (n === s) throw new Error(`no se abrió ${id}`);
  const act = (a: Omit<EpisodeAction, "at">) => {
    t += 1000;
    const r = actEpisode(n, id, { ...a, at: t } as EpisodeAction);
    if (r.error) throw new Error(`${id}: ${r.error}`);
    n = r.state;
  };
  act({ type: "begin" });
  for (let i = 0; i < 10 && n.episodes![id].phase !== "closed"; i++) {
    const st = strategiesFor(EPISODES[id], n.episodes![id])[0];
    act({ type: "decide", strategy: st.id } as Omit<EpisodeAction, "at">);
  }
  expect(n.episodes![id].phase).toBe("closed");
  return { state: n, at: t };
}
const arrivalOf = (s: CeoState, id: string) => episodeEntries(s, s.startedAt!).find((e) => e.spec.id === id)!.arrivesAt;

describe("casos ejecutivos · publicados", () => {
  it("los tres están aprobados, son de Botanas Cumbre y tienen día de llegada", () => {
    expect(RULES_VERSION).toBe(3);
    expect(ruleSet(3).episodes).toEqual({ xpDecision: 20, xpClose: 40, required: true });
    expect(ruleSet(2).episodes).toBeUndefined();
    for (const x of SEASON_EPISODES.cumbre) {
      expect(EPISODES[x.episode].approval).toBe("aprobado");
      expect(EPISODES[x.episode].company).toBe("cumbre");
    }
    expect(SEASON_EPISODES.cumbre.map((x) => x.episode)).toEqual(["supernorte", "diego", "alergeno"]);
  });
  it("temporada nueva (v3): SuperNorte sustituye al asunto de una decisión; los otros asuntos siguen", () => {
    const s = started();
    expect(seasonEpisodesOf(s).map((x) => x.spec.id)).toEqual(["supernorte", "diego", "alergeno"]);
    const ids = seasonItems(s).map((i) => i.id);
    expect(ids).not.toContain("d2-supernorte");
    expect(ids).toContain("d3-diego");
    expect(entries(s, T + 9 * DAY).some((e) => e.item.id === "d2-supernorte")).toBe(false);
  });
  it("temporadas que empezaron con v2 (o legacy) no cambian: sin casos y con el asunto de SuperNorte", () => {
    for (const v of [1, 2]) {
      const s = started({ rulesVersion: v });
      expect(seasonEpisodesOf(s)).toEqual([]);
      expect(episodeEntries(s, T + 9 * DAY)).toEqual([]);
      expect(seasonItems(s).some((i) => i.id === "d2-supernorte")).toBe(true);
    }
  });
  it("otras empresas no reciben casos (todavía no hay casos ejecutivos para ellas)", () => {
    expect(seasonEpisodesOf(started({ company: "forja" }))).toEqual([]);
    expect(seasonEpisodesOf(started({ company: "brasa" }))).toEqual([]);
  });
});

describe("casos ejecutivos · llegada", () => {
  it("llegan en su día, en orden, y cuentan como siguiente llegada", () => {
    const s = started();
    const es = episodeEntries(s, T);
    expect(es.map((e) => e.spec.id)).toEqual(["supernorte", "diego", "alergeno"]);
    expect(es.every((e) => e.status === "futuro")).toBe(true);
    const sn = arrivalOf(s, "supernorte");
    expect(sn).toBeGreaterThan(T + 12 * H);
    expect(sn).toBeLessThan(T + 2 * DAY + 12 * H);
    expect(episodeEntries(s, sn).find((e) => e.spec.id === "supernorte")!.status).toBe("pendiente");
    // La siguiente llegada considera también los casos.
    const before = nextArrivalOf(s, sn - 1000);
    expect(before).toBe(sn);
  });
  it("no se puede abrir antes de que llegue (ni reproduciendo acciones)", () => {
    const s = started();
    const sn = arrivalOf(s, "supernorte");
    expect(openSeasonEpisode(s, "supernorte", sn - 1000)).toBe(s);
    expect(openSeasonEpisode(s, "supernorte", sn + 1000).episodes?.supernorte.phase).toBe("briefing");
  });
  it("la llegada queda fijada al llegar (cambiar el horario no la mueve)", () => {
    const s = started();
    const sn = arrivalOf(s, "supernorte");
    const p = pinArrived(s, sn + 1000);
    expect(p.pinned["ep:supernorte"]).toBe(sn);
    const moved = { ...p, settings: { ...p.settings, windowStart: p.settings.windowStart + 2 } };
    expect(episodeEntries(moved, sn + 1000).find((e) => e.spec.id === "supernorte")!.arrivesAt).toBe(sn);
  });
  it("no vencen: un caso pendiente sigue pendiente días después", () => {
    const s = started();
    expect(episodeEntries(s, T + 30 * DAY).every((e) => e.status === "pendiente")).toBe(true);
  });
});

describe("casos ejecutivos · efecto en la temporada", () => {
  it("al cerrar: indicadores y XP de la temporada se mueven exactamente con el resultado del caso", () => {
    const s = started();
    const sn = arrivalOf(s, "supernorte");
    const k0 = kpis(s, sn + 1000), xp0 = runXp(s, sn + 1000);
    const { state, at } = finish(s, "supernorte", sn + 1000);
    const run = state.episodes!.supernorte;
    const e = episodeEntries(state, at).find((x) => x.spec.id === "supernorte")!;
    expect(e.status).toBe("cerrado");
    const k1 = kpis(state, at);
    for (const ch of run.outcome!.kpi) expect(k1[ch.key] - k0[ch.key]).toBe(Math.max(0 - k0[ch.key], Math.min(100 - k0[ch.key], ch.delta)));
    expect(runXp(state, at) - xp0).toBe(run.turns.length * 20 + 40);
    expect(episodeSeasonXp(state, e)).toBe(run.xp);
  });
  it("mientras está abierto (sin cerrar) no mueve nada", () => {
    const s = started();
    const sn = arrivalOf(s, "supernorte");
    const o = openSeasonEpisode(s, "supernorte", sn + 1000);
    expect(kpis(o, sn + 2000)).toEqual(kpis(s, sn + 2000));
    expect(runXp(o, sn + 2000)).toBe(runXp(s, sn + 2000));
  });
  it("con reglas v2, el mismo caso jugado como práctica no mueve la temporada", () => {
    const s = started({ rulesVersion: 2 });
    const { state, at } = finish(s, "supernorte", T + 1000);
    expect(kpis(state, at)).toEqual(kpis(s, at));
    expect(runXp(state, at)).toBe(runXp(s, at));
  });
  it("una partida de otra temporada (p. ej. la vista previa) no cuenta y no impide jugarlo de nuevo", () => {
    const old = finish(started({ rulesVersion: 2, startedAt: T - 10 * DAY }), "supernorte", T - 9 * DAY).state;
    const s = { ...old, rulesVersion: 3, startedAt: T, decisions: {}, pinned: {} };
    expect(episodeEntries(s, T + 9 * DAY).find((e) => e.spec.id === "supernorte")!.status).toBe("pendiente");
    const sn = arrivalOf(s, "supernorte");
    const again = openSeasonEpisode(s, "supernorte", sn + 1000);
    expect(again.episodes!.supernorte.startedAt).toBe(sn + 1000);
    expect(again.episodes!.supernorte.phase).toBe("briefing");
  });
  it("cuentan en el avance de casos y en la racha", () => {
    const s = started();
    const sn = arrivalOf(s, "supernorte");
    const p0 = casesProgress(s, sn + 1000);
    const { state, at } = finish(s, "supernorte", sn + 1000);
    const p1 = casesProgress(state, at);
    expect(p1.total).toBe(p0.total);
    expect(p1.done).toBe(p0.done + 1);
    expect(streakOf(state, at).doneToday).toBe(true);
  });
});

describe("casos ejecutivos · cierre de temporada", () => {
  /** Temporada v3 con todos los asuntos base decididos o vencidos (sin jugar casos). */
  function allItemsDone(): { s: CeoState; at: number } {
    const at = T + 20 * DAY;
    return { s: started(), at };
  }
  it("el reto final no se abre hasta cerrar los casos que ya llegaron", () => {
    const { s, at } = allItemsDone();
    expect(casesDoneOf(s, at)).toBe(false);
    let n = s, t = at;
    for (const id of ["supernorte", "diego", "alergeno"]) ({ state: n, at: t } = finish(n, id, t + 1000));
    expect(casesDoneOf(n, t)).toBe(true);
  });
  it("con v2, todo vencido basta para abrir el reto (como antes)", () => {
    expect(casesDoneOf(started({ rulesVersion: 2 }), T + 20 * DAY)).toBe(true);
  });
  it("la empresa cerrada guarda sus casos y no los vuelve a pagar si la repites", () => {
    const { s, at } = allItemsDone();
    let n = s, t = at;
    for (const id of ["supernorte", "diego", "alergeno"]) ({ state: n, at: t } = finish(n, id, t + 1000));
    const epXp = ["supernorte", "diego", "alergeno"].reduce((a, id) => a + n.episodes![id].turns.length * 20 + 40, 0);
    // Cerrar el reto final con un proyecto terminado por tiempo.
    const closed = closeChange(startChange(n, t + 500), t + 1000);
    expect(closed.change?.closedAt).toBe(t + 1000);
    const total = xpOf(closed, t + 2000);
    const next = advance(closed, t + 2000);
    expect(next).not.toBe(closed);
    const run = next.career.at(-1)!;
    expect(run.episodes?.sort()).toEqual(["alergeno", "diego", "supernorte"]);
    expect(run.xp).toBeGreaterThanOrEqual(epXp);
    expect(xpOf(next, t + 2000)).toBe(total);
    if (next.company === "cumbre") {
      // Repetir Cumbre: los casos vuelven a llegar, se juegan desde cero y no pagan XP otra vez.
      const sn = arrivalOf(next, "supernorte");
      const r = finish(next, "supernorte", sn + 1000);
      const e = episodeEntries(r.state, r.at).find((x) => x.spec.id === "supernorte")!;
      expect(e.status).toBe("cerrado");
      expect(episodeSeasonXp(r.state, e)).toBe(0);
    }
  });
});

describe("casos ejecutivos · reproducción en el servidor", () => {
  it("reproducir las acciones da el mismo estado, indicadores y XP; abrir antes de tiempo se rechaza", () => {
    const s = started();
    const sn = arrivalOf(s, "supernorte");
    const acts: GameAction[] = [{ type: "start", at: T, name: "Ana Torres", company: "cumbre", rulesVersion: 3 }];
    acts.push({ type: "episodeOpen", at: sn - 5000, id: "supernorte" });
    const early = replay(acts);
    expect(early.state.episodes?.supernorte).toBeUndefined();
    acts.pop();
    acts.push({ type: "episodeOpen", at: sn + 1000, id: "supernorte" });
    let t = sn + 1000;
    const local = { s: replay(acts).state };
    const push = (act: Omit<EpisodeAction, "at">) => { t += 1000; const a = { ...act, at: t } as EpisodeAction; acts.push({ type: "episode", at: t, id: "supernorte", act: a }); local.s = actEpisode(local.s, "supernorte", a).state; };
    push({ type: "begin" });
    for (let i = 0; i < 10 && local.s.episodes!.supernorte.phase !== "closed"; i++) push({ type: "decide", strategy: strategiesFor(EPISODES.supernorte, local.s.episodes!.supernorte)[0].id } as Omit<EpisodeAction, "at">);
    const r = replay(acts).state;
    expect(r.episodes!.supernorte.phase).toBe("closed");
    expect(kpis(r, t)).toEqual(kpis(local.s, t));
    expect(xpOf(r, t)).toBe(xpOf(local.s, t));
  });
});
