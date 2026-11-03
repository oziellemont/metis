/**
 * mêtis CEO · Simulador reproducible de temporadas (rediseño «criterio vs. resultados»).
 *
 * Juega temporadas completas con la lógica real del motor (asuntos, consecuencias, casos ejecutivos y reto final) y
 * con estrategias de jugador deterministas (semilla fija). Sirve para responder, con números que cualquiera puede
 * reproducir: ¿se puede aprobar cada industria jugando con criterio?, ¿se aprueba al azar?, ¿qué pasa si eliges siempre
 * lo que el feedback felicita?
 *
 * No cambia nada del juego: solo llama a las funciones públicas del motor.
 */
import { LEVERS, canUse, leverById, simulate } from "./change";
import { H, KPI_KEYS, casesDoneOf, decide, entries, episodeEntries, kpis, newState, nextArrivalOf, openSeasonEpisode, packOf, rulesFor, verdictOf } from "./engine";
import { EPISODES, actEpisode } from "./episodes/catalog";
import { applyEpisode, strategiesFor, type EpisodeAction } from "./episodes/engine";
import type { EpisodeRun } from "./episodes/contracts";
import { closeChange, playLever, startChange } from "./relations";
import type { CeoState, ChangeMove, CompanyPack, KpiKey, Kpis, Option } from "./types";
import { contextualJudgment } from "./judgment";
import { SEASON_OBJECTIVES } from "./shadow-verdict";

/** Lunes 5-oct-2026, 09:00 en Monterrey. Mismo arranque que las partidas doradas. */
export const SIM_T0 = Date.UTC(2026, 9, 5, 15, 0, 0);

/** Generador pseudoaleatorio con semilla (mulberry32): mismas semillas, mismas partidas. */
export function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const net = (o: Option) => KPI_KEYS.reduce((a, k) => a + (o.effects[k] ?? 0), 0);
export interface PickCtx { s: CeoState; t: number; itemId: string; r: () => number }
export type Picker = (os: Option[], c: PickCtx) => string | null;

/** Jugador que mira el tablero: entre las opciones defendibles (criterio ≥ 2), la que deja mejor su indicador más débil. */
function balanced(os: Option[], c: PickCtx): string {
  const line = rulesFor(c.s).passLine;
  const pool = os.filter((o) => o.score >= 2);
  let pick = (pool[0] ?? os[0]).id, bv = -1e9;
  for (const o of pool.length ? pool : os) {
    const k = kpis(decide(c.s, c.itemId, o.id, c.t), c.t);
    const v = Math.min(...KPI_KEYS.map((x) => k[x] - line)) * 10 + KPI_KEYS.reduce((a, x) => a + k[x], 0) / 50;
    if (v > bv) { bv = v; pick = o.id; }
  }
  return pick;
}

/** Criterio contextual (rúbrica nueva): el nivel de criterio más alto considerando el tablero; desempata el texto (no los números). */
function contextual(os: Option[], c: PickCtx): string {
  const k = kpis(c.s, c.t), line = rulesFor(c.s).passLine;
  const js = os.map((o) => contextualJudgment(o, os, k, line));
  let best = 0;
  const key = (i: number) => js[i].level * 100 + js[i].dims.prioriza * 10 + os[i].score;
  for (let i = 1; i < os.length; i++) if (key(i) > key(best)) best = i;
  return os[best].id;
}
/**
 * Criterio y tablero: entre las opciones con criterio contextual ≥ 2 (bien razonadas leyendo el tablero), la que deja
 * mejor los indicadores que el consejo encargó y la caja. Es lo que haría un director que razona bien Y cuida su encargo.
 */
function judgedBalanced(os: Option[], c: PickCtx): string {
  const k0 = kpis(c.s, c.t), line = rulesFor(c.s).passLine;
  const pool = os.filter((o) => contextualJudgment(o, os, k0, line).level >= 2);
  const focus = [...new Set<KpiKey>(["caja", ...(SEASON_OBJECTIVES[c.s.company]?.kpis ?? [])])];
  let pick = (pool[0] ?? os[0]).id, bv = -1e9;
  for (const o of pool.length ? pool : os) {
    const k = kpis(decide(c.s, c.itemId, o.id, c.t), c.t);
    const v = Math.min(...focus.map((x) => k[x] - line)) * 10 + Math.min(...KPI_KEYS.map((x) => k[x] - line)) * 3 + KPI_KEYS.reduce((a, x) => a + Math.min(k[x], 90), 0) / 50;
    if (v > bv) { bv = v; pick = o.id; }
  }
  return pick;
}
/** Varios caminos: al azar entre las opciones con criterio contextual ≥ 2 (prueba que no hay una sola ruta). */
function contextualMix(os: Option[], c: PickCtx): string {
  const k = kpis(c.s, c.t), line = rulesFor(c.s).passLine;
  const pool = os.filter((o) => contextualJudgment(o, os, k, line).level >= 2);
  const p = pool.length ? pool : os;
  return p[Math.floor(c.r() * p.length)].id;
}

/** Las nueve estrategias de la auditoría + el «director equilibrado» (criterio y tablero a la vez). */
export const STRATEGIES: Record<string, { label: string; pick: Picker; reps: number }> = {
  mas_larga: { label: "Siempre la opción más larga", pick: (os) => os.slice().sort((a, b) => b.text.length - a.text.length)[0].id, reps: 1 },
  mas_corta: { label: "Siempre la opción más corta", pick: (os) => os.slice().sort((a, b) => a.text.length - b.text.length)[0].id, reps: 1 },
  azar: { label: "Al azar", pick: (os, c) => os[Math.floor(c.r() * os.length)].id, reps: 40 },
  mejor_score: { label: "Siempre la que el feedback felicita (criterio más alto)", pick: (os) => os.slice().sort((a, b) => b.score - a.score || net(b) - net(a))[0].id, reps: 1 },
  peor_score: { label: "Siempre la de criterio más bajo", pick: (os) => os.slice().sort((a, b) => a.score - b.score || net(a) - net(b))[0].id, reps: 1 },
  mejor_efecto: { label: "Solo números: la de mejor efecto neto", pick: (os) => os.slice().sort((a, b) => net(b) - net(a))[0].id, reps: 1 },
  siempre_A: { label: "Siempre la primera opción", pick: (os) => os[0].id, reps: 1 },
  no_contesta: { label: "No contesta nada", pick: () => null, reps: 1 },
  contesta_la_mitad: { label: "Contesta la mitad (al azar)", pick: (os, c) => (c.r() < 0.5 ? null : os[Math.floor(c.r() * os.length)].id), reps: 40 },
  director_equilibrado: { label: "Director equilibrado: opciones defendibles cuidando el indicador más débil", pick: (os, c) => balanced(os, c), reps: 1 },
  criterio_contextual: { label: "Criterio contextual (rúbrica nueva): lo mejor razonado leyendo el tablero", pick: (os, c) => contextual(os, c), reps: 1 },
  criterio_y_tablero: { label: "Criterio y tablero: bien razonada y cuidando el encargo del consejo y la caja", pick: (os, c) => judgedBalanced(os, c), reps: 1 },
  criterio_variado: { label: "Caminos variados: cualquier opción con criterio contextual alto, al azar", pick: (os, c) => contextualMix(os, c), reps: 40 },
};

/** Plan del proyecto de cambio: la palanca que más acerca a la meta por semana usada (igual que las pruebas del motor). */
export function greedyPlan(pack: CompanyPack, rel0: Record<string, number>, weeks?: number): ChangeMove[] {
  const ids = pack.change.stakeholders.map((x) => x.id);
  const cands: ChangeMove[] = [];
  for (const l of LEVERS) {
    if (l.targets === 0) cands.push({ lever: l.id, targets: [], at: 0 });
    else if (l.targets === 1) ids.forEach((i) => cands.push({ lever: l.id, targets: [i], at: 0 }));
    else for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      if (l.targets === 2) cands.push({ lever: l.id, targets: [ids[a], ids[b]], at: 0 });
      else for (let c = b + 1; c < ids.length; c++) cands.push({ lever: l.id, targets: [ids[a], ids[b], ids[c]], at: 0 });
    }
  }
  const score = (m: ChangeMove[]) => { const r = simulate(pack.change, pack, { rel0, moves: m, weeks }); return r.adopted * 100 + Object.values(r.values).reduce((x, y) => x + y, 0) / 10 + r.credibility / 5; };
  const moves: ChangeMove[] = [];
  for (;;) {
    const sim = simulate(pack.change, pack, { rel0, moves, weeks });
    if (sim.done) break;
    let best: ChangeMove | null = null, bs = -Infinity;
    const base = score(moves);
    for (const c of cands) { if (!canUse(sim, c.lever, c.targets)) continue; const v = (score([...moves, c]) - base) / leverById(c.lever).weeks; if (v > bs) { bs = v; best = c; } }
    if (!best) break;
    moves.push(best);
  }
  return moves;
}

type EpisodePolicy = "mejor_efecto" | "peor_efecto" | "primera" | "azar";
const episodePolicyOf = (name: string): EpisodePolicy => (name === "mejor_efecto" || name === "director_equilibrado" || name === "mejor_score" || name.startsWith("criterio") ? "mejor_efecto" : name === "peor_score" ? "peor_efecto" : name === "azar" || name === "contesta_la_mitad" || name === "criterio_variado" ? "azar" : "primera");

/** Juega un caso ejecutivo completo con una política simple (búsqueda exhaustiva para «mejor/peor efecto»). */
function playEpisode(s0: CeoState, id: string, t0: number, policy: EpisodePolicy, r: () => number): { s: CeoState; t: number } {
  const spec = EPISODES[id];
  let s = openSeasonEpisode(s0, id, t0);
  s = actEpisode(s, id, { type: "begin", at: t0 + 1 }).state;
  let seq: string[] = [];
  if (policy === "mejor_efecto" || policy === "peor_efecto") {
    const sign = policy === "mejor_efecto" ? 1 : -1;
    let bestV = -1e9;
    const dfs = (run: EpisodeRun, path: string[], at: number) => {
      if (run.phase === "closed") { const v = sign * run.outcome!.kpi.reduce((a, k) => a + k.delta, 0); if (v > bestV) { bestV = v; seq = path; } return; }
      if (path.length > 8) return;
      for (const st of strategiesFor(spec, run)) { const x = applyEpisode(spec, run, { type: "decide", at, strategy: st.id } as EpisodeAction); if (!x.error) dfs(x.run, [...path, st.id], at + 1); }
    };
    dfs(s.episodes![id], [], t0 + 2);
  }
  let t = t0 + 2;
  if (seq.length) for (const st of seq) s = actEpisode(s, id, { type: "decide", at: t++, strategy: st } as EpisodeAction).state;
  else for (let i = 0; i < 10 && s.episodes![id].phase !== "closed"; i++) {
    const sts = strategiesFor(spec, s.episodes![id]);
    const st = policy === "azar" ? sts[Math.floor(r() * sts.length)] : sts[0];
    s = actEpisode(s, id, { type: "decide", at: t++, strategy: st.id } as EpisodeAction).state;
  }
  return { s, t };
}

export interface SeasonResult {
  passed: boolean;
  kpis: Kpis;
  min: number;
  health: number;
  decided: number;
  expired: number;
  episodes: number;
  changeOk: boolean | null;
  /** Estado final (para diagnósticos y veredictos alternativos). */
  state: CeoState;
  at: number;
}

/** Juega una temporada completa. `make` crea el estado inicial (temporada clásica o empresa propia). */
export function playSeason(make: () => CeoState, name: string, seed: string): SeasonResult {
  const st = STRATEGIES[name];
  const r = rng(seed);
  let s = make();
  let t = s.startedAt ?? SIM_T0;
  const silent = name === "no_contesta";
  for (let i = 0; i < 800 && !casesDoneOf(s, t); i++) {
    const p = entries(s, t).find((e) => e.status === "pendiente");
    if (p) {
      const o = st.pick(p.item.options, { s, t, itemId: p.item.id, r });
      if (o) { s = decide(s, p.item.id, o, t); t += 60_000; continue; }
    }
    const ep = !silent && episodeEntries(s, t).find((e) => e.status === "pendiente");
    if (ep) { ({ s, t } = playEpisode(s, ep.spec.id, t, episodePolicyOf(name), r)); t += 60_000; continue; }
    const nx = nextArrivalOf(s, t);
    const pend = entries(s, t).filter((e) => e.status === "pendiente").map((e) => e.deadline);
    const next = Math.min(nx !== null && nx > t ? nx + 1000 : Infinity, pend.length ? Math.min(...pend) + 1000 : Infinity);
    t = Number.isFinite(next) ? next : t + 6 * H;
  }
  let changeOk: boolean | null = null;
  if (!silent && casesDoneOf(s, t)) {
    s = startChange(s, t);
    if (s.change) { for (const m of greedyPlan(packOf(s), s.change.rel0, s.change.weeks)) s = playLever(s, m.lever, m.targets, t); s = closeChange(s, t); }
    const sim = s.change ? simulate(packOf(s).change, packOf(s), s.change) : null;
    changeOk = sim ? sim.ok : null;
  }
  const v = verdictOf(s, t);
  const es = entries(s, t);
  return {
    passed: v.passed, kpis: v.kpis, min: Math.min(...KPI_KEYS.map((x) => v.kpis[x])), health: v.health,
    decided: es.filter((e) => e.status === "decidido").length, expired: es.filter((e) => e.status === "vencido").length,
    episodes: episodeEntries(s, t).filter((e) => e.status === "cerrado").length, changeOk, state: s, at: t,
  };
}

/** Temporada clásica de una empresa (igual que la auditoría). */
export const classicStart = (company: string) => (): CeoState => ({ ...newState(), name: "QA", alias: "qa", startedAt: SIM_T0, savedAt: SIM_T0, lastActiveAt: SIM_T0, company });
