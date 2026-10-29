/**
 * Partidas doradas · jugadores automáticos que GRABAN partidas completas como listas de acciones.
 * Solo se usan para (re)generar los archivos de `golden/*.json`. Las pruebas no vuelven a «jugar»:
 * reproducen las acciones grabadas y comparan el resultado con lo esperado.
 */
import { COMPANIES } from "../companies";
import { LESSONS } from "../lessons";
import { canUse, leverById, simulate, LEVERS } from "../change";
import {
  H, KPI_KEYS, badgesOf, casesDoneOf, casesProgress, changeSimOf, dayKey, decide, dilemmaOfDay, entries, healthOf, kpis,
  levelOf, newState, packOf, profileOf, rand01, rulesFor, seasonDay, seasonDoneOf, streakOf, verdictOf, xpOf,
} from "../engine";
import { relationsOf } from "../relations";
import { applyAction, type GameAction } from "../replay";
import type { CeoState, ChangeMove, CompanyPack, Option, Settings } from "../types";

/** `score` = siempre la preferida por el autor; `mixed` = la preferida ~60 % de las veces (solo para poblaciones del veredicto sombra). */
export type Strategy = "best" | "worst" | "random" | "lazy" | "score" | "mixed";
export type ChangePlan = "smart" | "skip" | "partial";

export interface SeasonPlan { strategy: Strategy; change: ChangePlan; dilemmas?: boolean; lessons?: number; settingsMidway?: boolean; advance?: boolean }
export interface GoldenSpec {
  id: string;
  description: string;
  start: number;
  name: string;
  company: string;
  settings?: Partial<Settings>;
  seasons: SeasonPlan[];
  switchTo?: string;
  /** Deja la última temporada a medias (después de N decisiones) para fotografiar un estado intermedio. */
  stopAfter?: number;
  seed: string;
}

/** Fotografía de todo lo que el jugador ve y lo que se guarda en su carrera. */
export function snapshotOf(s: CeoState, t: number) {
  const k = kpis(s, t);
  const xp = xpOf(s, t);
  const sim = changeSimOf(s);
  const done = seasonDoneOf(s, t);
  const v = verdictOf(s, t);
  const st = streakOf(s, t);
  const p = profileOf(s, t);
  return {
    company: s.company, tier: s.tier, legendary: !!s.legendary, seasonDay: seasonDay(s, t),
    kpis: k, health: healthOf(k), xp, level: levelOf(xp).i,
    relations: relationsOf(s, t),
    progress: casesProgress(s, t),
    statuses: Object.fromEntries(entries(s, t).map((e) => [e.item.id, e.status])),
    /** Hora de llegada y plazo de cada asunto (relativos al inicio de la temporada, en segundos). */
    timing: Object.fromEntries(entries(s, t).map((e) => [e.item.id, [Math.round((e.arrivesAt - (s.startedAt ?? 0)) / 1000), Math.round((e.deadline - e.arrivesAt) / 1000)]])),
    decisions: Object.fromEntries(Object.entries(s.decisions).map(([id, d]) => [id, d.option])),
    change: sim ? { adopted: sim.adopted, share: Math.round(sim.share * 1000) / 1000, weeksUsed: sim.weeksUsed, credibility: sim.credibility, done: sim.done, ok: sim.ok } : null,
    verdict: done ? { passed: v.passed, passLine: v.passLine, answered: Math.round(v.answered * 1000) / 1000, approved: v.approved } : null,
    streak: { days: st.days, best: st.best },
    profile: { archetype: p.archetype.name, axes: Object.fromEntries(p.axes.map((a) => [a.key, a.value])) },
    badges: badgesOf(s, t).filter((b) => b.on).map((b) => b.id),
    dilemmas: Object.fromEntries(Object.entries(s.dilemmas ?? {}).map(([id, d]) => [id, d.option])),
    lessons: Object.keys(s.lessons).sort(),
    career: (s.career ?? []).map((r) => ({ company: r.company, tier: r.tier, passed: r.passed, health: r.health, answered: r.answered, xp: r.xp, kpis: r.kpis, change: r.change })),
  };
}
export type Snapshot = ReturnType<typeof snapshotOf>;

// ───────────────────────────── estrategias de decisión
function careful(s: CeoState, t: number, itemId: string, opts: Option[]) {
  const line = rulesFor(s).passLine;
  let pick = opts[0].id, bv = -1e9;
  for (const o of opts) {
    const k = kpis(decide(s, itemId, o.id, t), t);
    const v = Math.min(...KPI_KEYS.map((x) => k[x] - line)) * 10 + KPI_KEYS.reduce((a, x) => a + k[x], 0) / 50;
    if (v > bv) { bv = v; pick = o.id; }
  }
  return pick;
}
const sum = (e: Partial<Record<string, number>>) => Object.values(e).reduce<number>((a, x) => a + (x ?? 0), 0);
function pick(st: Strategy, s: CeoState, t: number, itemId: string, opts: Option[], seed: string): string | null {
  if (st === "best") return careful(s, t, itemId, opts);
  if (st === "worst") return opts.slice().sort((a, b) => sum(a.effects) - sum(b.effects))[0].id;
  if (st === "score" || (st === "mixed" && rand01(`${seed}|mix|${itemId}`) < 0.6)) return opts.slice().sort((a, b) => b.score - a.score)[0].id;
  if (st === "lazy") return rand01(`${seed}|lazy|${itemId}`) < 0.4 ? null : opts[0].id; // deja vencer ~40 %
  return opts[Math.floor(rand01(`${seed}|${itemId}`) * opts.length)].id;
}

/** Plan del proyecto de cambio: en cada paso, la palanca que más acerca a la meta por semana usada. */
function greedyPlan(pack: CompanyPack, rel0: Record<string, number>, weeks: number | undefined, limit = Infinity): ChangeMove[] {
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
  while (moves.length < limit) {
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

// ───────────────────────────── grabadora
export interface Golden { id: string; description: string; actions: GameAction[]; checkpoints: { after: number; at: number; snapshot: Snapshot }[] }

export function record(spec: GoldenSpec): Golden {
  const actions: GameAction[] = [];
  const checkpoints: Golden["checkpoints"] = [];
  let s: CeoState | null = null;
  const act = (a: GameAction) => {
    const r = applyAction(s!, a);
    if (!r.applied) throw new Error(`${spec.id}: acción rechazada al grabar ${JSON.stringify(a)}`);
    actions.push(a); s = r.state;
  };
  const shot = (t: number) => checkpoints.push({ after: actions.length, at: t, snapshot: snapshotOf(s!, t) });

  s = newState();
  act({ type: "start", at: spec.start, name: spec.name, company: spec.company, settings: spec.settings });
  let t = spec.start;
  if (spec.switchTo) { t += 30_000; act({ type: "switch", at: t, company: spec.switchTo }); }

  let lessonIdx = 0;
  spec.seasons.forEach((plan, si) => {
    const last = si === spec.seasons.length - 1;
    let day = dayKey(t, s!.settings.tz);
    let decided = 0;
    let settingsDone = false;
    const dailyExtras = () => {
      if (plan.dilemmas) { const dd = dilemmaOfDay(s!, t); if (dd && !dd.done) { const opts = dd.d.options.map((o, i) => ({ i, sc: o.score })); const o = plan.strategy === "best" ? opts.sort((a, b) => b.sc - a.sc)[0].i : Math.floor(rand01(`${spec.seed}|dil|${dd.d.id}`) * opts.length); t += 20_000; act({ type: "dilemma", at: t, id: dd.d.id, option: o }); } }
      for (let i = 0; i < (plan.lessons ?? 0) && lessonIdx < LESSONS.length; i++) { t += 20_000; act({ type: "lesson", at: t, id: LESSONS[lessonIdx++].id }); }
    };
    dailyExtras();
    for (let guard = 0; guard < 600 && !casesDoneOf(s!, t); guard++) {
      const dk = dayKey(t, s!.settings.tz);
      if (dk !== day) { shot(t); day = dk; dailyExtras(); }
      if (plan.settingsMidway && !settingsDone && seasonDay(s!, t) >= 3) {
        settingsDone = true; t += 10_000;
        act({ type: "settings", at: t, patch: { windowStart: 7, windowEnd: 20 } });
      }
      const p = entries(s!, t).find((e) => e.status === "pendiente" && !(plan.strategy === "lazy" && rand01(`${spec.seed}|lazy|${e.item.id}`) < 0.4));
      if (p) {
        const o = pick(plan.strategy, s!, t, p.item.id, p.item.options, spec.seed);
        if (o) { act({ type: "decide", at: t, item: p.item.id, option: o }); decided++; t += 60_000; }
        if (last && spec.stopAfter && decided >= spec.stopAfter) { shot(t); return; }
        continue;
      }
      const nx = entries(s!, t).find((e) => e.status === "futuro");
      const pend = entries(s!, t).find((e) => e.status === "pendiente");
      t = nx ? nx.arrivesAt + 1000 : pend ? pend.deadline + 1000 : t + H;
    }
    shot(t);
    t += 60_000; act({ type: "changeStart", at: t });
    if (plan.change !== "skip") {
      const moves = greedyPlan(packOf(s!), s!.change!.rel0, s!.change!.weeks, plan.change === "partial" ? 2 : Infinity);
      for (const m of moves) { t += 30_000; act({ type: "lever", at: t, lever: m.lever, targets: m.targets }); }
    }
    t += 60_000; act({ type: "changeClose", at: t });
    shot(t);
    if (plan.advance !== false) { t += 60_000; act({ type: "advance", at: t }); shot(t); }
  });
  return { id: spec.id, description: spec.description, actions, checkpoints };
}

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0); // lunes 5-oct-2026, 09:00 en Monterrey
const MTY = { tz: "America/Monterrey" };

/** Catálogo de partidas doradas. Cubre las 3 empresas, estrategias opuestas, vencimientos, ascenso, repetición y modo Legendario. */
export const SPECS: GoldenSpec[] = [
  { id: "cumbre-mejor", description: "Botanas Cumbre jugando con cuidado, dilemas diarios, lecciones y plan de cambio estratégico; asciende.", start: T0, name: "Ana Torres", company: "cumbre", settings: MTY, seed: "g1",
    seasons: [{ strategy: "best", change: "smart", dilemmas: true, lessons: 1 }] },
  { id: "cumbre-peor", description: "Botanas Cumbre eligiendo siempre lo de menor efecto y sin plan de cambio; reprueba y repite.", start: T0, name: "Beto", company: "cumbre", settings: MTY, seed: "g2",
    seasons: [{ strategy: "worst", change: "skip" }] },
  { id: "cumbre-vencidos", description: "Deja vencer ~40 % de los asuntos (detona consecuencias de «no respondiste»), cambia su horario a media temporada.", start: T0 + 2 * H, name: "Carla Ruiz", company: "cumbre", settings: MTY, seed: "g3",
    seasons: [{ strategy: "lazy", change: "partial", settingsMidway: true, dilemmas: true }] },
  { id: "forja-mejor", description: "Forja (empezando por cambio de empresa antes de decidir) jugando con cuidado.", start: T0, name: "Diego", company: "cumbre", switchTo: "forja", settings: MTY, seed: "g4",
    seasons: [{ strategy: "best", change: "smart", lessons: 2 }] },
  { id: "forja-azar", description: "Forja con elecciones al azar (semilla fija) y plan de cambio parcial.", start: T0, name: "Elena", company: "forja", settings: MTY, seed: "g5",
    seasons: [{ strategy: "random", change: "partial", dilemmas: true }] },
  { id: "brasa-mejor", description: "Brasa jugando con cuidado y modo intensivo (todo el día llega de golpe).", start: T0, name: "Fer", company: "brasa", settings: { ...MTY, intensivo: true }, seed: "g6",
    seasons: [{ strategy: "best", change: "smart", dilemmas: true }] },
  { id: "brasa-peor", description: "Brasa con las peores elecciones.", start: T0, name: "Gaby", company: "brasa", settings: MTY, seed: "g7",
    seasons: [{ strategy: "worst", change: "skip" }] },
  { id: "carrera-legendaria", description: "Carrera larga con el jugador cuidadoso: aprueba Cumbre (nivel 0) y Forja (nivel 1); en Brasa nivel 2 reprueba por Caja 53 < 54 y repite con el mismo resultado (hallazgo de balance registrado en F0-1).", start: T0, name: "Hugo Leal", company: "cumbre", settings: MTY, seed: "g8",
    seasons: [
      { strategy: "best", change: "smart", dilemmas: true, lessons: 1 },
      { strategy: "best", change: "smart", dilemmas: true, lessons: 1 },
      { strategy: "best", change: "smart", dilemmas: true, lessons: 1 },
      { strategy: "best", change: "smart", dilemmas: true },
    ] },
  { id: "repite-y-asciende", description: "Reprueba Cumbre, repite y la segunda vez aprueba; luego deja la siguiente empresa a medias.", start: T0, name: "Iris", company: "cumbre", settings: MTY, seed: "g9",
    seasons: [{ strategy: "worst", change: "skip" }, { strategy: "best", change: "smart" }, { strategy: "random", change: "smart" }], stopAfter: 5 },
  { id: "otra-zona", description: "Jugadora en Ciudad de México con ventana 6–22 h (husos y ventanas distintas).", start: Date.UTC(2026, 9, 7, 22, 30, 0), name: "Julia", company: "forja", settings: { tz: "America/Mexico_City", windowStart: 6, windowEnd: 22 }, seed: "g10",
    seasons: [{ strategy: "best", change: "smart", dilemmas: true }] },
];

export { COMPANIES };
