import { describe, expect, it } from "vitest";
import { LESSONS } from "./lessons";
import { COMPANIES } from "./companies";
import { CUMBRE } from "./companies/cumbre";
import { DAY, H, KPI_KEYS, advance, arrivalOf, decide, dominates, entries, kpis, levelOf, localMidnight, migrate, newState, nextCompanyOf, pinArrived, profileOf, rulesOf, scaled, seasonDoneOf, skipToNext, streakOf, verdictOf, xpOf, KPI_START } from "./engine";
import type { CeoState, ChangeMove, CompanyPack, LeverId } from "./types";
import { LEVERS, canUse, leverById, simulate } from "./change";
import { closeChange, entryRipples, playLever, relationsOf, ripplesOf, startChange } from "./relations";
import { casesDoneOf, changeKpiEffect, changeOpen, episodeEntries, isContinuous, nextArrivalOf, openSeasonEpisode, packOf, renameCompany, setupCompany, switchCompany, RULES_VERSION } from "./engine";
import { CONTINUOUS_RULES_VERSION } from "./rules";
import { boardReviewOf, companyStageOf, reportDueOf, seasonEpisodesOf, seasonItems } from "./engine";
import { stageTrack } from "./career/stages";
import { bankArchetypeOf, isBankId } from "./cases/bank";
import { bankMonthOf, chosenOptions } from "./engine";
import { evidenceOf } from "./mastery";
import { validateImport } from "./import";
import { closePeriod } from "./business/report";
import { EPISODES, actEpisode } from "./episodes/catalog";
import { applyEpisode, strategiesFor, type EpisodeAction } from "./episodes/engine";
import type { EpisodeRun } from "./episodes/contracts";

/** Jugador estratégico: en cada paso elige la palanca que más acerca a la meta por semana usada. */
function greedyPlan(pack: CompanyPack, rel0: Record<string, number>): ChangeMove[] {
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
  const score = (m: ChangeMove[]) => { const r = simulate(pack.change, pack, { rel0, moves: m }); return r.adopted * 100 + Object.values(r.values).reduce((x, y) => x + y, 0) / 10 + r.credibility / 5; };
  const moves: ChangeMove[] = [];
  for (;;) {
    const sim = simulate(pack.change, pack, { rel0, moves });
    if (sim.done) break;
    let best: ChangeMove | null = null, bs = -Infinity;
    const base = score(moves);
    for (const c of cands) { if (!canUse(sim, c.lever, c.targets)) continue; const v = (score([...moves, c]) - base) / leverById(c.lever).weeks; if (v > bs) { bs = v; best = c; } }
    if (!best) break;
    moves.push(best);
  }
  return moves;
}

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0); // 5-oct-2026 09:00 en Monterrey (UTC−6)
const started = (over: Partial<CeoState> = {}): CeoState => ({ ...newState(), name: "Oziel", alias: "oziel", startedAt: T0, ...over });

const ITEMS = CUMBRE.items;

describe.each(COMPANIES.map((c) => [c.name, c] as const))("contenido · %s", (_n, pack) => {
  it("ids únicos, remitente e involucrados en el elenco, 2–4 opciones, lección existente y detonadores válidos", () => {
    const ids = new Set<string>();
    const ITEMS = pack.items;
    for (const it of ITEMS) {
      expect(ids.has(it.id), it.id).toBe(false); ids.add(it.id);
      expect(pack.cast[it.from], `${it.id} from ${it.from}`).toBeTruthy();
      for (const w of it.involves ?? []) expect(pack.cast[w], `${it.id} involves ${w}`).toBeTruthy();
      for (const l of it.lines ?? []) expect(pack.cast[l.who], `${it.id} line ${l.who}`).toBeTruthy();
      expect(it.options.length).toBeGreaterThanOrEqual(2);
      expect(it.options.length).toBeLessThanOrEqual(4);
      if (it.lesson) expect(LESSONS.some((l) => l.id === it.lesson)).toBe(true);
      if (it.trigger) {
        const src = ITEMS.find((x) => x.id === it.trigger!.item)!;
        expect(src).toBeTruthy();
        for (const o of it.trigger.options) expect(o === "__expired" || src.options.some((x) => x.id === o)).toBe(true);
      }
    }
  });
  it("elenco, relaciones y roles coherentes", () => {
    for (const [id, p] of Object.entries(pack.cast)) {
      expect(p.id).toBe(id);
      if (p.reportsTo && p.reportsTo !== "ceo") expect(pack.cast[p.reportsTo], `${id} reporta a ${p.reportsTo}`).toBeTruthy();
    }
    for (const t of pack.ties) { expect(pack.cast[t.a], t.a).toBeTruthy(); expect(pack.cast[t.b], t.b).toBeTruthy(); }
    for (const r of Object.values(pack.roles)) expect(pack.cast[r], r).toBeTruthy();
    expect(pack.glossary.length).toBeGreaterThanOrEqual(5);
  });
  it("ninguna opción es obviamente mejor: ninguna domina a otra en todos los rubros", () => {
    const bad: string[] = [];
    for (const it of pack.items) for (const a of it.options) for (const b of it.options) if (a !== b && dominates(a.effects, b.effects)) bad.push(`${it.id}: ${a.id} domina a ${b.id}`);
    expect(bad).toEqual([]);
  });
  it("cada opción tiene costo y beneficio (nada es gratis)", () => {
    const bad: string[] = [];
    for (const it of pack.items) for (const o of it.options) {
      const v = Object.values(o.effects);
      if (!(v.some((x) => (x ?? 0) > 0) && v.some((x) => (x ?? 0) < 0))) bad.push(`${it.id}/${o.id}`);
    }
    expect(bad).toEqual([]);
  });
  it("cada decisión afecta a personas del caso: toda opción mueve a alguien y las opciones no mueven igual", () => {
    const bad: string[] = [];
    for (const it of pack.items) {
      const inCase = new Set([it.from, ...(it.involves ?? []), ...(it.lines ?? []).map((l) => l.who)]);
      for (const o of it.options) {
        const st = o.stance ?? {};
        if (!Object.keys(st).length) bad.push(`${it.id}/${o.id} sin postura`);
        for (const [id, v] of Object.entries(st)) {
          if (!pack.cast[id]) bad.push(`${it.id}/${o.id}: ${id} no existe`);
          if (Math.abs(v) > 2) bad.push(`${it.id}/${o.id}: ${id}=${v}`);
          if (!inCase.has(id)) bad.push(`${it.id}/${o.id}: ${id} no está en el caso`);
        }
      }
      const sig = it.options.map((o) => JSON.stringify(Object.entries(o.stance ?? {}).sort()));
      if (new Set(sig).size !== sig.length) bad.push(`${it.id}: dos opciones mueven igual a la gente`);
    }
    expect(bad).toEqual([]);
  });
  it("proyecto de cambio: personas del elenco, palancas válidas, al menos un formador de opinión", () => {
    const ch = pack.change;
    expect(ch.stakeholders.length).toBeGreaterThanOrEqual(8);
    expect(ch.stakeholders.some((x) => x.leader)).toBe(true);
    for (const st of ch.stakeholders) {
      expect(pack.cast[st.id], st.id).toBeTruthy();
      for (const l of [...st.likes, ...(st.dislikes ?? [])]) expect(LEVERS.some((x) => x.id === l), `${st.id}:${l}`).toBe(true);
    }
  });
  it("proyecto de cambio: quien escucha y usa la red lo logra; quien solo da discursos, no", () => {
    const rel0 = {};
    const smart = greedyPlan(pack, rel0);
    expect(simulate(pack.change, pack, { rel0, moves: smart }).ok).toBe(true);
    const speeches = (["townhall", "ejemplo", "townhall", "incentivos", "townhall", "incentivos", "avance", "townhall", "avance", "incentivos"] as LeverId[]).map((lever) => ({ lever, targets: [], at: 0 }));
    expect(simulate(pack.change, pack, { rel0, moves: speeches }).ok).toBe(false);
    // con las relaciones rotas, el mismo plan ya no alcanza
    const cold = Object.fromEntries(pack.change.stakeholders.map((x) => [x.id, 30]));
    expect(simulate(pack.change, pack, { rel0: cold, moves: smart }).adopted).toBeLessThan(simulate(pack.change, pack, { rel0, moves: smart }).adopted);
  });
  it("una temporada se siente como días reales de CEO: 2–3 decisiones base por día", () => {
    for (let d = 1; d <= pack.season.days; d++) {
      const n = pack.items.filter((i) => i.day === d && !i.trigger).length;
      expect(n, `día ${d}`).toBeGreaterThanOrEqual(1);
      expect(n, `día ${d}`).toBeLessThanOrEqual(4);
    }
  });
});

describe("llegadas", () => {
  it("el primer mensaje llega casi de inmediato y los del día 2 dentro de la ventana", () => {
    const s = started();
    const first = ITEMS.find((i) => i.day === 1 && i.slot === 1)!;
    expect(arrivalOf(s, first) - T0).toBeLessThan(60_000);
    const mid2 = localMidnight(T0, s.settings.tz) + DAY;
    for (const it of ITEMS.filter((i) => i.day === 2 && !i.trigger)) {
      const a = arrivalOf(s, it);
      expect(a).toBeGreaterThanOrEqual(mid2 + 8 * H);
      expect(a).toBeLessThan(mid2 + 19 * H);
    }
  });
  it("cambiar el horario no mueve lo que ya llegó", () => {
    let s = started();
    const it = ITEMS[0];
    s = pinArrived(s, T0 + 5 * 60_000);
    const before = arrivalOf(s, it);
    s = { ...s, settings: { ...s.settings, windowStart: 12 } };
    expect(arrivalOf(s, it)).toBe(before);
  });
});

describe("decisiones y consecuencias", () => {
  it("decidir mueve los indicadores y da XP", () => {
    let s = started();
    const now = T0 + 60_000;
    s = decide(s, "d1-bienvenida", "a", now);
    const k = kpis(s, now);
    expect(k.equipo).toBe(CUMBRE.kpiStart.equipo + 5);
    expect(xpOf(s, now)).toBeGreaterThan(0);
  });
  it("no se puede decidir algo que no ha llegado", () => {
    const s = started();
    expect(decide(s, "d7-sucesion", "a", T0 + 1000)).toBe(s);
  });
  it("una consecuencia sólo aparece si se eligió la opción que la detona", () => {
    const now = T0 + 3 * H;
    let good = started(); good = decide(good, "d1-hector", "a", now);
    let bad = started(); bad = decide(bad, "d1-hector", "c", now);
    const later = T0 + 3 * DAY;
    expect(entries(good, later).some((e) => e.item.id === "c-hector-aliado")).toBe(true);
    expect(entries(good, later).some((e) => e.item.id === "c-hector-renuncia")).toBe(false);
    expect(entries(bad, later).some((e) => e.item.id === "c-hector-renuncia")).toBe(true);
  });
  it("si no respondes a tiempo, vence y detona la consecuencia de «no respondiste»", () => {
    const s = started();
    const later = T0 + 3 * DAY;
    const e = entries(s, later).find((x) => x.item.id === "d1-hector")!;
    expect(e.status).toBe("vencido");
    expect(entries(s, later).some((x) => x.item.id === "c-hector-renuncia")).toBe(true);
  });
});

describe("racha, nivel y perfil", () => {
  it("cuenta días seguidos y avisa si está en riesgo", () => {
    const s = started({ lessons: { a: T0, b: T0 + DAY, c: T0 + 2 * DAY } });
    expect(streakOf(s, T0 + 2 * DAY + H).days).toBe(3);
    const r = streakOf(s, T0 + 3 * DAY + H);
    expect(r.days).toBe(3);
    expect(r.atRisk).toBe(true);
    expect(streakOf(s, T0 + 5 * DAY).days).toBe(0);
  });
  it("niveles", () => {
    expect(levelOf(0).name).toBe("Gerente");
    expect(levelOf(400).name).toBe("Director General");
    expect(levelOf(5000).pct).toBe(100);
  });
  it("el perfil refleja el estilo de las decisiones", () => {
    let s = started();
    s = decide(s, "d1-bienvenida", "a", T0 + 60_000);
    const p = profileOf(s, T0 + 60_000);
    expect(p.axes.find((a) => a.key === "estilo")!.value).toBeGreaterThan(0);
  });
  it("modo prueba: adelantar el reloj trae el siguiente mensaje", () => {
    let s = started();
    s = decide(s, "d1-bienvenida", "a", T0 + 60_000);
    s = skipToNext(s, T0 + 60_000);
    expect(s.clockOffset).toBeGreaterThan(0);
  });
});

type Picker = (os: { id: string; effects: Record<string, number | undefined> }[], s: CeoState, t: number, itemId: string) => string;
/** Juega la temporada: cierra los asuntos y luego el reto de cambio ("smart" = plan estratégico, "skip" = lo presenta sin hacer nada, "open" = lo deja abierto). */
/**
 * Casos ejecutivos (reglas v3): el jugador cuidadoso busca el cierre que más suma a la empresa; el descuidado, el que menos.
 * Búsqueda exhaustiva por estrategias (con sus parámetros por omisión) desde la partida real.
 */
const playEpisode = (s0: CeoState, id: string, t0: number, sign: 1 | -1): { s: CeoState; t: number } => {
  const spec = EPISODES[id];
  let s = openSeasonEpisode(s0, id, t0);
  s = actEpisode(s, id, { type: "begin", at: t0 + 1 }).state;
  let bestSeq: string[] = [], bestV = -1e9;
  const dfs = (run: EpisodeRun, seq: string[], at: number) => {
    if (run.phase === "closed") { const v = sign * run.outcome!.kpi.reduce((a, k) => a + k.delta, 0); if (v > bestV) { bestV = v; bestSeq = seq; } return; }
    if (seq.length > 8) return;
    for (const st of strategiesFor(spec, run)) {
      const r = applyEpisode(spec, run, { type: "decide", at, strategy: st.id } as EpisodeAction);
      if (!r.error) dfs(r.run, [...seq, st.id], at + 1);
    }
  };
  dfs(s.episodes![id], [], t0 + 2);
  let t = t0 + 2;
  for (const st of bestSeq) s = actEpisode(s, id, { type: "decide", at: t++, strategy: st } as EpisodeAction).state;
  return { s, t };
};
const finish = (s0: CeoState, pick: Picker, change: "smart" | "skip" | "open" = "smart") => {
  let s = s0;
  let t = T0;
  for (let i = 0; i < 400 && !casesDoneOf(s, t); i++) {
    const p = entries(s, t).find((e) => e.status === "pendiente");
    if (p) { s = decide(s, p.item.id, pick(p.item.options as never, s, t, p.item.id), t); t += 60_000; continue; }
    const ep = episodeEntries(s, t).find((e) => e.status === "pendiente");
    if (ep) { ({ s, t } = playEpisode(s, ep.spec.id, t, pick === worst ? -1 : 1)); t += 60_000; continue; }
    const nx = nextArrivalOf(s, t);
    t = nx !== null ? nx + 1000 : t + H;
  }
  if (change === "open") return { s, t };
  s = startChange(s, t);
  if (change === "smart") for (const m of greedyPlan(packOf(s), s.change!.rel0)) s = playLever(s, m.lever, m.targets, t);
  s = closeChange(s, t);
  return { s, t };
};
// jugador cuidadoso: elige la opción que deja mejor su rubro más débil
const careful = (s: CeoState, t: number, itemId: string, ids: string[]) => {
  const line = rulesOf(s.tier).passLine;
  let pick = ids[0], bv = -1e9;
  for (const o of ids) { const k = kpis(decide(s, itemId, o, t), t); const v = Math.min(...KPI_KEYS.map((x) => k[x] - line)) * 10 + KPI_KEYS.reduce((a, x) => a + k[x], 0) / 50; if (v > bv) { bv = v; pick = o; } }
  return pick;
};
const best: Picker = (os, s, t, itemId) => careful(s, t, itemId, os.map((o) => o.id));
const worst: Picker = (os) => os.slice().sort((a, b) => sum(a.effects) - sum(b.effects))[0].id;
const sum = (e: Record<string, number | undefined>) => Object.values(e).reduce<number>((a, x) => a + (x ?? 0), 0);


describe("carrera multiempresa", () => {
  it("migra un avance v1 sin perder nada (queda en Botanas Cumbre, nivel 0)", () => {
    const v1 = { v: 1, name: "Oziel", alias: "oziel", startedAt: T0, decisions: { "d1-bienvenida": { option: "a", at: T0 + 1000 } }, pinned: {}, read: {}, lessons: { x: T0 }, settings: { tz: "America/Monterrey" }, lastActiveAt: T0, clockOffset: 0, savedAt: T0 };
    const s = migrate(v1);
    expect(s.v).toBe(2);
    expect(s.company).toBe("cumbre");
    expect(s.tier).toBe(0);
    expect(s.career).toEqual([]);
    expect(s.decisions["d1-bienvenida"].option).toBe("a");
    expect(s.settings.windowStart).toBe(8);
  });
  it("la exigencia sube con cada nivel", () => {
    expect(rulesOf(0).passLine).toBeLessThan(rulesOf(2).passLine);
    expect(rulesOf(3).deadline).toBeLessThan(rulesOf(0).deadline);
    expect(scaled({ caja: -10, equipo: 10 }, 0)).toEqual({ caja: -10, equipo: 10 });
    const s3 = scaled({ caja: -10, equipo: 10 }, 3);
    expect(s3.caja!).toBeLessThan(-10);
    expect(s3.equipo!).toBeLessThan(10);
  });
  it.each(COMPANIES.map((c) => [c.id] as const))("%s: se puede aprobar con buenas decisiones y reprobar con malas", (id) => {
    const good = finish(started({ company: id }), best);
    expect(rulesOf(0).passLine).toBe(50);
    expect(seasonDoneOf(good.s, good.t)).toBe(true);
    const vg = verdictOf(good.s, good.t);
    expect(vg.passed, JSON.stringify(vg.kpis)).toBe(true);
    const bad = finish(started({ company: id }), worst, "skip");
    expect(verdictOf(bad.s, bad.t).passed).toBe(false);
  });
  it("al aprobar asciende a otra empresa (de otro giro) y sube la exigencia; al reprobar repite", () => {
    const good = finish(started({ company: "cumbre" }), best);
    const up = advance(good.s, good.t);
    expect(up.company).not.toBe("cumbre");
    expect(up.tier).toBe(1);
    expect(up.career).toHaveLength(1);
    expect(up.career[0].passed).toBe(true);
    expect(Object.keys(up.decisions)).toHaveLength(0);
    expect(xpOf(up, good.t)).toBeGreaterThanOrEqual(xpOf(good.s, good.t) - 1);
    const bad = finish(started({ company: "cumbre" }), worst);
    const again = advance(bad.s, bad.t);
    expect(again.company).toBe("cumbre");
    expect(again.tier).toBe(0);
    expect(again.career[0].passed).toBe(false);
  });
  it("no se puede ascender a media temporada", () => {
    const s = started();
    expect(advance(s, T0 + H)).toBe(s);
  });
  it("después de aprobar todo, sigue el modo Legendario", () => {
    const s = started({ company: "brasa", career: COMPANIES.filter((c) => c.id === "cumbre").map((c) => ({ company: c.id, tier: 0, startedAt: T0, endedAt: T0, kpis: { ...KPI_START }, health: 70, answered: 100, passed: true, xp: 0, decisions: {} })) });
    expect(nextCompanyOf(s).legendary).toBe(false);
    const all = { ...s, career: COMPANIES.filter((c) => c.id !== "brasa").map((c) => ({ ...s.career[0], company: c.id })) };
    expect(nextCompanyOf(all).legendary).toBe(true);
    expect(KPI_KEYS.length).toBe(5);
  });
});

describe("relaciones y proyecto de cambio", () => {
  it("una decisión se propaga por el mapa: aliados, rivales e influidos", () => {
    // En Cumbre, Lucía y Héctor están en tensión; Lucía y Carla son aliadas.
    const r = ripplesOf(CUMBRE, { lucia: 2 });
    const by = Object.fromEntries(r.map((x) => [x.id, x]));
    expect(by.lucia.delta).toBeGreaterThan(0);
    expect(by.carla.delta).toBeGreaterThan(0);
    expect(by.carla.kind).toBe("alianza");
    expect(by.hector.delta).toBeLessThan(0);
    expect(by.hector.kind).toBe("tension");
  });
  it("dejar vencer un asunto enfría la relación con quien te escribió", () => {
    const it = CUMBRE.items[1];
    const r = entryRipples(CUMBRE, { status: "vencido", item: it });
    expect(r.find((x) => x.id === it.from)!.delta).toBeLessThan(0);
  });
  it("tus decisiones cambian tus relaciones y con ellas el arranque del proyecto", () => {
    let s = started();
    const hector = CUMBRE.items.find((i) => i.id === "d1-hector")!;
    const t = arrivalOf(s, hector) + 60_000;
    const good = decide(s, "d1-hector", "a", t);
    const bad = decide(s, "d1-hector", "c", t);
    expect(relationsOf(good, t).hector).toBeGreaterThan(relationsOf(bad, t).hector);
    // el reto final se abre hasta cerrar los asuntos
    expect(changeOpen(s, T0 + H)).toBe(false);
    const done = finish(good, best, "open");
    expect(changeOpen(done.s, done.t)).toBe(true);
    const d3 = done.t;
    const g = startChange(done.s, d3);
    const b = startChange(finish(bad, best, "open").s, d3);
    s = playLever(g, "entrevista", ["hector"], d3);
    expect(s.change!.moves.length).toBe(1);
    // no se puede pasar del tiempo
    let x = s; for (let i = 0; i < 40; i++) x = playLever(x, "piloto", ["lucia", "ana"], d3);
    const used = x.change!.moves.reduce((a, m) => a + leverById(m.lever).weeks, 0);
    expect(used).toBeLessThanOrEqual(x.change!.weeks!);
  });
  it("el nivel no cierra (ni hay veredicto) hasta presentar el cambio; el resultado pega en los rubros", () => {
    const done = finish(started(), best, "open");
    expect(changeOpen(done.s, done.t)).toBe(true);
    expect(seasonDoneOf(done.s, done.t)).toBe(false);
    expect(advance(done.s, done.t)).toBe(done.s);
    const before = kpis(done.s, done.t);
    const s1 = closeChange(startChange(done.s, done.t), done.t);
    expect(seasonDoneOf(s1, done.t)).toBe(true);
    expect(Object.values(changeKpiEffect(s1)).some((v) => (v ?? 0) < 0)).toBe(true);
    expect(kpis(s1, done.t).consejo).toBeLessThan(before.consejo);
  });
});

// ───────────────────────────────────────────── carrera continua (P0-B2)
describe("carrera continua · identidad y reglas v4", () => {
  const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
  const SETUP = { companyId: CID, sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: "Casa Norte Alimentos" };
  const own = () => setupCompany(started(), SETUP, T0);

  it("crear la empresa: modo continua, reglas v4, paquete de la industria y textos con su nombre", () => {
    const s = own();
    expect(s.careerMode).toBe("continua");
    expect(s.rulesVersion).toBe(CONTINUOUS_RULES_VERSION);
    expect(s.company).toBe("cumbre");
    expect(s.companyProfile?.displayName).toBe("Casa Norte Alimentos");
    expect(packOf(s).name).toBe("Casa Norte Alimentos");
    expect(JSON.stringify(packOf(s).items)).not.toMatch(/Cumbre/);
    // la v4 no es la versión por omisión: las temporadas siguen en v3
    expect(RULES_VERSION).toBe(3);
    expect(newState().rulesVersion).toBe(3);
  });

  it("solo se crea una vez, antes de decidir, y con una combinación jugable", () => {
    const s = own();
    expect(setupCompany(s, { ...SETUP, displayName: "Otra" }, T0 + 1)).toBe(s);
    const decided = decide(started(), "d1-bienvenida", "a", T0 + 60_000);
    expect(setupCompany(decided, SETUP, T0 + 120_000)).toBe(decided);
    const st = started();
    expect(setupCompany(st, { ...SETUP, industryId: "autopartes", archetype: "pyme" }, T0)).toBe(st);
    expect(setupCompany(st, { ...SETUP, archetype: "startup" }, T0)).toBe(st);
    expect(setupCompany(st, { ...SETUP, sectorId: "tecnologia_informacion", industryId: "software_saas", archetype: "pyme" }, T0)).toBe(st);
    expect(setupCompany(st, { ...SETUP, sectorId: "transporte_almacenamiento", industryId: "logistica_distribucion" }, T0)).toBe(st);
  });

  it("al cerrar el periodo sigue en LA MISMA empresa, apruebe o no; la exigencia sigue a la etapa (P1-B)", () => {
    const good = finish(own(), best);
    expect(seasonDoneOf(good.s, good.t)).toBe(true);
    const next = advance(good.s, good.t);
    expect(next.company).toBe("cumbre");
    expect(next.companyProfile?.companyId).toBe(CID);
    // el primer mes es la llegada: siempre pasa a «Estabilizar» y la exigencia sube un nivel
    expect(next.companyProfile?.stage).toBe("estabilizar");
    expect(next.tier).toBe(1);
    expect(next.rulesVersion).toBe(CONTINUOUS_RULES_VERSION);
    expect(next.career).toHaveLength(1);
    expect(next.decisions).toEqual({});
    // aunque el cliente mande la versión de temporadas, el periodo nuevo sigue en v4
    expect(advance(good.s, good.t, 3).rulesVersion).toBe(CONTINUOUS_RULES_VERSION);
    const bad = finish(own(), worst, "skip");
    const again = advance(bad.s, bad.t);
    expect(again.company).toBe("cumbre");
    expect(again.tier).toBe(1);
  });

  it("P0-D: el mes siguiente no se cierra hasta firmar el reporte del anterior", () => {
    const good = finish(own(), best);
    const m1 = advance(good.s, good.t);
    expect(reportDueOf(m1)).toBe(1);
    const again = finish(m1, best);
    expect(seasonDoneOf(again.s, again.t)).toBe(true);
    expect(advance(again.s, again.t)).toBe(again.s);
    const signed = closePeriod(again.s, 1, again.t);
    const m2 = advance(signed, again.t);
    expect(m2.career).toHaveLength(2);
    expect(reportDueOf(m2)).toBe(2);
  });

  it("P1-B: el mes 2 no repite la carta de llegada ni los casos ejecutivos ya cerrados", () => {
    const m1 = finish(own(), best);
    const ep1 = episodeEntries(m1.s, m1.t).filter((e) => e.status === "cerrado").map((e) => e.spec.id);
    expect(ep1.length).toBeGreaterThan(0);
    const m2 = closePeriod(advance(m1.s, m1.t), 1, m1.t);
    const ids = seasonItems(m2).map((i) => i.id);
    expect(ids).not.toContain("d1-bienvenida");
    expect(ids).not.toContain("d1-hector");
    expect(ids).not.toContain("c-hector-aliado");
    // SuperNorte ya se jugó como caso ejecutivo: no vuelve, ni el asunto que sustituía
    expect(ids).not.toContain("d2-supernorte");
    for (const id of ep1) expect(seasonEpisodesOf(m2).some((x) => x.spec.id === id)).toBe(false);
    // toda consecuencia del mes tiene su detonador en el mismo mes
    for (const it of seasonItems(m2)) if (it.trigger) expect(ids).toContain(it.trigger.item);
    expect(seasonItems(m2).filter((i) => !i.trigger).length).toBeGreaterThanOrEqual(10);
  });

  it("P1-C: desde el mes 2 llegan casos del banco; se deciden, cuentan y no se repiten", () => {
    const m1 = finish(own(), best);
    const s2 = closePeriod(advance(m1.s, m1.t), 1, m1.t);
    const bank2 = seasonItems(s2).filter((i) => isBankId(i.id));
    expect(bank2).toHaveLength(3);
    expect(bankMonthOf(s2)?.picks.map((p) => p.id)).toEqual(bank2.map((i) => i.id));
    // el primer mes (tomar el mando) no trae casos del banco
    expect(seasonItems(own()).some((i) => isBankId(i.id))).toBe(false);
    // con el nombre de la empresa del jugador, nunca el del paquete
    expect(JSON.stringify(bank2)).not.toMatch(/Cumbre/);
    const m2 = finish(s2, best);
    for (const it of bank2) expect(m2.s.decisions[it.id], it.id).toBeDefined();
    const s3 = closePeriod(advance(m2.s, m2.t), 2, m2.t);
    const chosen = chosenOptions(s3).map((o) => o.id);
    expect(chosen.length).toBeGreaterThan(0);
    expect(evidenceOf(s3).filter((e) => e.kind === "decision" && e.run === 1).length).toBeGreaterThanOrEqual(bank2.length);
    const ids3 = seasonItems(s3).filter((i) => isBankId(i.id)).map((i) => i.id);
    expect(ids3.length).toBeGreaterThanOrEqual(3);
    for (const id of ids3) expect(bank2.map((i) => i.id)).not.toContain(id);
    // dilemas distintos, no solo otro giro del mismo
    const arch = (id: string) => bankArchetypeOf(id);
    for (const id of ids3) expect(bank2.map((i) => arch(i.id))).not.toContain(arch(id));
    // la copia en la nube acepta las decisiones del banco
    const v = validateImport(JSON.parse(JSON.stringify(s3)), s3.savedAt + 1000);
    expect(v.ok).toBe(true);
  });

  it("P1-B: revisión del consejo sin game over; la etapa avanza solo con meses mínimos y aprobación", () => {
    const m1 = finish(own(), best);
    expect(boardReviewOf(m1.s, m1.t)).toMatchObject({ stage: 0, next: 1, advances: true });
    const s2 = closePeriod(advance(m1.s, m1.t), 1, m1.t);
    expect(companyStageOf(s2)).toEqual({ idx: 1, months: 0 });
    // un mes reprobado: sigue en la misma empresa y la misma etapa, sin bajar la exigencia
    const bad = finish(s2, worst, "skip");
    expect(verdictOf(bad.s, bad.t).passed).toBe(false);
    expect(boardReviewOf(bad.s, bad.t)?.advances).toBe(false);
    const s3 = advance(bad.s, bad.t);
    expect(s3.companyProfile?.companyId).toBe(CID);
    expect(s3.companyProfile?.stage).toBe("estabilizar");
    expect(s3.tier).toBe(1);
    expect(s3.startedAt).not.toBeNull();
  });

  it("P1-B: etapas puras: 1 mes de llegada, luego meses mínimos y aprobación", () => {
    const P = { passed: true }, F = { passed: false };
    expect(stageTrack([])).toEqual({ idx: 0, months: 0 });
    expect(stageTrack([F])).toEqual({ idx: 1, months: 0 });
    expect(stageTrack([F, P])).toEqual({ idx: 1, months: 1 });
    expect(stageTrack([F, P, P])).toEqual({ idx: 2, months: 0 });
    expect(stageTrack([F, P, F])).toEqual({ idx: 1, months: 2 });
    expect(stageTrack([F, P, F, P])).toEqual({ idx: 2, months: 0 });
    expect(stageTrack(Array(40).fill(P)).idx).toBe(5);
    // temporadas: siempre etapa 0
    expect(companyStageOf(newState())).toEqual({ idx: 0, months: 0 });
  });

  it("no se cambia de empresa en la carrera continua", () => {
    const s = own();
    expect(switchCompany(s, "forja", T0 + 1)).toBe(s);
  });

  it("renombrar conserva el id, el periodo y las decisiones", () => {
    const s = decide(own(), "d1-bienvenida", "a", T0 + 60_000);
    const r = renameCompany(s, "Norteña de Alimentos", undefined, T0 + 120_000);
    expect(r.companyProfile).toMatchObject({ companyId: CID, displayName: "Norteña de Alimentos", shortName: "Norteña", renamedAt: T0 + 120_000 });
    expect(r.decisions).toEqual(s.decisions);
    expect(r.startedAt).toBe(s.startedAt);
    expect(packOf(r).name).toBe("Norteña de Alimentos");
    expect(renameCompany(s, "{x}", undefined, T0)).toBe(s);
    expect(renameCompany(started(), "Algo", undefined, T0).companyProfile).toBeUndefined();
  });

  it("migrate: conserva la identidad, repara lo accesorio y vuelve a temporadas si la identidad no sirve", () => {
    const s = own();
    const m = migrate(JSON.parse(JSON.stringify(s)));
    expect(m.companyProfile).toEqual(s.companyProfile);
    expect(m.careerMode).toBe("continua");
    // el paquete manda: si alguien cambió company a mano, se corrige al de su empresa
    expect(migrate({ ...JSON.parse(JSON.stringify(s)), company: "forja" }).company).toBe("cumbre");
    const broken = migrate({ ...JSON.parse(JSON.stringify(s)), companyProfile: { companyId: "x" } });
    expect(broken.companyProfile).toBeUndefined();
    expect(broken.careerMode).toBeUndefined();
    expect(migrate({ ...started(), careerMode: "otro" }).careerMode).toBeUndefined();
    expect(migrate({ ...started(), settings: { ...started().settings, displayCurrency: "EUR" } }).settings.displayCurrency).toBeUndefined();
    expect(migrate({ ...started(), settings: { ...started().settings, displayCurrency: "USD" } }).settings.displayCurrency).toBe("USD");
    // una partida de hoy no cambia
    const legacy = started();
    expect(migrate(JSON.parse(JSON.stringify(legacy))).careerMode).toBeUndefined();
    expect(isContinuous(legacy)).toBe(false);
  });
});
