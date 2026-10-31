/**
 * 0.5 · diario de jugadas en sombra.
 * Aceptación (adenda v3.2): dos dispositivos y duplicados no corrompen estado; el interruptor apaga seguro.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { replay, type GameAction } from "./replay";
import { kpis, newState, xpOf } from "./engine";
import { snapshotOf, type Golden } from "./golden/play";
import {
  ack, applyEvents, baseKindOf, careerStartOf, checkBase, dropCareer, enqueue, isUuid, nextBatch, readQueue, sanitizeAction,
  sanitizeEvents, serverXpOf, startsCareer, uuidFromHex, JOURNAL_MAX_EVENTS, type JournalEvent,
} from "./journal";
import { crisisAccess, playCrisis, STEPS } from "./crisis";
import { companyById } from "./companies";

const DIR = join(__dirname, "golden", "data");
const GOLDENS: Golden[] = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));
const byId = (id: string) => GOLDENS.find((g) => g.id === id)!;
let n = 0;
const id = () => { n++; return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`; };
const asEvents = (actions: GameAction[]): JournalEvent[] => actions.map((action, i) => ({ eventId: id(), seq: i + 1, action }));
const FAR = Date.UTC(2030, 0, 1);

describe("limpiar lo que llega del navegador", () => {
  it("acepta cada tipo de jugada de las partidas doradas tal cual", () => {
    for (const g of GOLDENS) for (const a of g.actions) expect(sanitizeAction(JSON.parse(JSON.stringify(a)))).toEqual(JSON.parse(JSON.stringify(a)));
  });
  it("rechaza tipos desconocidos, horas inválidas y campos raros", () => {
    for (const bad of [null, [], "x", { type: "hack", at: 1 }, { type: "decide", at: -1, item: "a", option: "b" }, { type: "decide", at: 1, item: "", option: "b" },
      { type: "dilemma", at: 1, id: "x", option: 1.5 }, { type: "lever", at: 1, lever: "x", targets: ["a", "b", "c", "d"] }, { type: "board", at: 1, passed: "si" },
      { type: "crisis", at: 1, picks: {} }]) expect(sanitizeAction(bad)).toBeNull();
  });
  it("el correo y el teléfono nunca entran al diario", () => {
    const a = sanitizeAction({ type: "settings", at: 5, patch: { email: "a@x.mx", phone: "+52", windowStart: 7, tz: "America/Monterrey", evil: 1 } });
    expect(a).toEqual({ type: "settings", at: 5, patch: { windowStart: 7, tz: "America/Monterrey" } });
    const s = sanitizeAction({ type: "start", at: 5, name: "Ana", company: "cumbre", settings: { email: "a@x.mx", phone: "1" } });
    expect(JSON.stringify(s)).not.toMatch(/a@x\.mx|phone/);
  });
  it("lote: descarta ids inválidos y repetidos, ordena por seq y respeta el tope", () => {
    const a = { type: "lesson", at: 9, id: "personas" };
    const { events, dropped } = sanitizeEvents([
      { eventId: "no-uuid", seq: 1, action: a },
      { eventId: "00000000-0000-4000-8000-0000000000AA", seq: 3, action: a },
      { eventId: "00000000-0000-4000-8000-0000000000aa", seq: 4, action: a },
      { eventId: "00000000-0000-4000-8000-0000000000bb", seq: 2, action: a },
    ]);
    expect(events.map((e) => e.seq)).toEqual([2, 3]);
    expect(events[1].eventId).toBe("00000000-0000-4000-8000-0000000000aa");
    expect(dropped).toBe(2);
    const many = Array.from({ length: JOURNAL_MAX_EVENTS + 5 }, (_, i) => ({ eventId: id(), seq: i, action: a }));
    expect(sanitizeEvents(many)).toMatchObject({ dropped: 5 });
    expect(sanitizeEvents("x")).toEqual({ events: [], dropped: 0 });
  });
  it("run_id: UUID estable", () => {
    const u = uuidFromHex("a".repeat(64));
    expect(isUuid(u)).toBe(true);
    expect(u).toBe(uuidFromHex("a".repeat(64)));
    expect(u[14]).toBe("5");
  });
});

describe("el servidor reproduce la partida igual que el navegador", () => {
  it.each(GOLDENS.map((g) => [g.id, g] as const))("%s: mismo estado y mismo XP", (_id, g) => {
    const out = applyEvents(newState(), asEvents(g.actions), FAR);
    const client = replay(g.actions).state;
    const last = g.checkpoints[g.checkpoints.length - 1];
    expect(out.rejected).toBe(0);
    expect(snapshotOf(out.state, last.at)).toEqual(last.snapshot);
    expect(xpOf(out.state, last.at)).toBe(xpOf(client, last.at));
  });
  it("en lotes de cualquier tamaño da lo mismo", () => {
    const g = byId("carrera-legendaria");
    const evs = asEvents(g.actions);
    let s = newState();
    for (let i = 0; i < evs.length; i += 7) s = applyEvents(s, evs.slice(i, i + 7), FAR).state;
    expect(s).toEqual(applyEvents(newState(), evs, FAR).state);
  });
});

describe("duplicados y dos dispositivos", () => {
  const g = byId("cumbre-mejor");
  const start = g.actions[0];
  const base = () => applyEvents(newState(), asEvents([start]), FAR).state;

  it("una jugada repetida no suma dos veces ni cambia el estado", () => {
    const decide = g.actions.find((a) => a.type === "decide")!;
    const once = applyEvents(base(), asEvents([decide]), FAR);
    const twice = applyEvents(once.state, asEvents([decide]), FAR);
    expect(twice.rejected).toBe(1);
    expect(twice.results[0]).toMatchObject({ accepted: false, note: "no_procede" });
    expect(twice.state).toBe(once.state);
  });
  it("dos dispositivos deciden el mismo asunto distinto: gana el que llegó primero y el otro queda rechazado", () => {
    const d = g.actions.find((a) => a.type === "decide") as Extract<GameAction, { type: "decide" }>;
    const s0 = base();
    const item = d.item;
    const alt = companyById(s0.company).items.find((i) => i.id === item)!.options.find((o) => o.id !== d.option)!.id;
    const out = applyEvents(s0, asEvents([d, { ...d, option: alt, at: d.at + 5000 }]), FAR);
    expect(out.results.map((r) => r.accepted)).toEqual([true, false]);
    expect(out.state.decisions[item].option).toBe(d.option);
  });
  it("jugadas intercaladas de dos dispositivos (sin choques) dan el mismo resultado que en uno", () => {
    const evs = asEvents(g.actions);
    const a = evs.filter((_, i) => i % 2 === 0), b = evs.filter((_, i) => i % 2 === 1);
    let s = newState();
    for (let i = 0; i < Math.max(a.length, b.length); i++) s = applyEvents(s, [a[i], b[i]].filter(Boolean), FAR).state;
    const last = g.checkpoints[g.checkpoints.length - 1];
    expect(snapshotOf(s, last.at)).toEqual(last.snapshot);
  });
  it("un «start» sobre una carrera ya iniciada se rechaza y no la borra", () => {
    const s = applyEvents(newState(), asEvents(g.actions.slice(0, 10)), FAR).state;
    const out = applyEvents(s, asEvents([{ ...start, at: start.at + 1 }]), FAR);
    expect(out.results[0]).toMatchObject({ accepted: false, note: "carrera_ya_iniciada" });
    expect(out.state).toBe(s);
  });
  it("una jugada con hora adelantada (reloj de prueba) se aplica pero queda marcada", () => {
    const s = base();
    const out = applyEvents(s, asEvents([{ type: "lesson", at: start.at + 1000, id: "personas" }]), start.at - 3600_000);
    expect(out.flagged).toBe(1);
    expect(out.results[0].note).toBe("reloj_adelantado");
  });
});

describe("punto de partida de una carrera que el servidor no conoce", () => {
  const g = byId("forja-azar");
  const s = replay(g.actions).state;
  it("valida que sea la misma carrera y guarda su XP inicial aparte", () => {
    const career = careerStartOf(s)!;
    const ok = checkBase(JSON.parse(JSON.stringify(s)), career, FAR);
    expect(ok).toMatchObject({ ok: true, kind: "continuacion" });
    if (ok.ok) expect(ok.xp).toBe(serverXpOf(s, FAR));
    expect(checkBase(s, career + 1, FAR)).toEqual({ ok: false, error: "base_ajena" });
    expect(checkBase(newState(), career, FAR)).toEqual({ ok: false, error: "base_invalida" });
    expect(checkBase("x", career, FAR)).toEqual({ ok: false, error: "base_invalida" });
  });
  it("una carrera recién empezada cuenta como «inicio» (XP base 0)", () => {
    const fresh = replay(g.actions.slice(0, 1)).state;
    expect(baseKindOf(fresh)).toBe("inicio");
    expect(checkBase(fresh, careerStartOf(fresh)!, FAR)).toMatchObject({ ok: true, kind: "inicio", xp: 0 });
  });
  it("sin punto de partida solo se acepta si el lote empieza con el «start» de esa carrera", () => {
    const evs = asEvents(g.actions.slice(0, 3));
    expect(startsCareer(evs, g.actions[0].at)).toBe(true);
    expect(startsCareer(evs.slice(1), g.actions[0].at)).toBe(false);
    expect(startsCareer(evs, g.actions[0].at + 1)).toBe(false);
  });
});

describe("jugadas nuevas en el reproductor", () => {
  const T = Date.UTC(2026, 9, 5, 15);
  it("start con nivel inicial y Journey, como el onboarding", () => {
    const { state } = replay([{ type: "start", at: T, name: "Ana", company: "cumbre", tier: 5, journey: true, rulesVersion: 1 }]);
    expect(state).toMatchObject({ tier: 1, startTier: 1, journey: { stage: 0, enrolledAt: T, appointments: [] } });
  });
  it("crisis: el servidor calcula el resultado con el tablero del momento en que empezó (no confía en el que manda el navegador)", () => {
    const g = byId("cumbre-mejor");
    const s = replay(g.actions.slice(0, g.actions.findIndex((a) => a.type === "changeStart"))).state;
    const from = (s.startedAt ?? 0) + 3 * 86400_000;
    expect(crisisAccess(s, from).open).toBe(true);
    const picks = Object.fromEntries(STEPS.map((st) => [st.id, st.options[0].id]));
    const expected = playCrisis(kpis(s, from), s.tier, picks).rating;
    const { state, rejected } = replay([{ type: "crisis", at: from + 60_000, from, picks, rating: "contenida" }], s);
    expect(rejected).toEqual([]);
    expect(state.crises![0].rating).toBe(expected);
    // Repetirla no hace nada; incompleta o con horas absurdas tampoco.
    expect(replay([{ type: "crisis", at: from + 90_000, from, picks }], state).rejected).toEqual([0]);
    expect(replay([{ type: "crisis", at: from + 60_000, from, picks: { [STEPS[0].id]: STEPS[0].options[0].id } }], s).rejected).toEqual([0]);
    expect(replay([{ type: "crisis", at: from + 3 * 3600_000, from, picks }], s).rejected).toEqual([0]);
    expect(replay([{ type: "crisis", at: from - 1, from, picks }], s).rejected).toEqual([0]);
  });
  it("settings también puede cambiar nombre y alias", () => {
    const s = replay([{ type: "start", at: T, name: "Ana", company: "cumbre" }]).state;
    const { state } = replay([{ type: "settings", at: T + 1, patch: {}, alias: "Ana T." }], s);
    expect(state.alias).toBe("Ana T.");
  });
});

describe("cola del dispositivo", () => {
  const a: GameAction = { type: "lesson", at: 1, id: "x" };
  it("numera, ignora repeticiones idénticas seguidas y no crece sin límite", () => {
    let q = readQueue(null, id);
    q = enqueue(q, a, 10, id);
    q = enqueue(q, a, 10, id);
    q = enqueue(q, { ...a, at: 2 }, 10, id);
    expect(q.items.map((i) => i.seq)).toEqual([1, 2]);
    for (let i = 0; i < 500; i++) q = enqueue(q, { ...a, at: 10 + i }, 10, id);
    expect(q.items.length).toBe(400);
    expect(q.items[q.items.length - 1].seq).toBe(502);
  });
  it("lotes por carrera, confirmar y descartar", () => {
    let q = readQueue("basura", id);
    q = enqueue(q, a, 1, id); q = enqueue(q, { ...a, at: 2 }, 2, id); q = enqueue(q, { ...a, at: 3 }, 1, id);
    const b = nextBatch(q)!;
    expect(b.career).toBe(1);
    expect(b.events.length).toBe(2);
    q = ack(q, b.events.map((e) => e.eventId));
    expect(nextBatch(q)!.career).toBe(2);
    expect(nextBatch(dropCareer(q, 2))).toBeNull();
  });
});

describe("carrera continua en el diario (P0-B2)", () => {
  const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
  const setup = { type: "setupCompany", at: 2_000, companyId: CID, sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida", displayName: "Casa Norte Alimentos" };

  it("limpia crear y renombrar empresa; rechaza lo inválido", () => {
    expect(sanitizeAction({ ...setup, evil: 1, specialty: "Botanas y snacks" })).toEqual({ ...setup, specialty: "Botanas y snacks" });
    expect(sanitizeAction({ type: "renameCompany", at: 3, displayName: "Norteña", shortName: "", x: 1 })).toEqual({ type: "renameCompany", at: 3, displayName: "Norteña" });
    for (const bad of [{ ...setup, companyId: "x" }, { ...setup, displayName: "x".repeat(41) }, { ...setup, sectorId: "" }, { type: "renameCompany", at: 3 }]) expect(sanitizeAction(bad)).toBeNull();
    expect(sanitizeAction({ type: "settings", at: 5, patch: { displayCurrency: "USD" } })).toEqual({ type: "settings", at: 5, patch: { displayCurrency: "USD" } });
    expect(sanitizeAction({ type: "settings", at: 5, patch: { displayCurrency: "EUR" } })).toEqual({ type: "settings", at: 5, patch: {} });
  });

  it("el servidor reproduce crear, decidir y renombrar igual que el navegador", () => {
    const actions = [
      { type: "start", at: 1_000, name: "Oziel Leal", company: "cumbre", rulesVersion: 3 },
      setup,
      { type: "decide", at: 3_000_000, item: "d1-bienvenida", option: "a" },
      { type: "renameCompany", at: 3_100_000, displayName: "Norteña de Alimentos" },
    ].map((a) => sanitizeAction(a)!) as GameAction[];
    const { state, rejected } = replay(actions);
    expect(rejected).toEqual([]);
    expect(state.careerMode).toBe("continua");
    expect(state.rulesVersion).toBe(4);
    expect(state.companyProfile).toMatchObject({ companyId: CID, displayName: "Norteña de Alimentos", appointedAt: 2_000 });
    expect(state.decisions["d1-bienvenida"].option).toBe("a");
    // crear dos veces o cambiar de empresa en la carrera continua se rechaza
    const twice = replay([...actions, { ...setup, at: 3_200_000 } as GameAction, { type: "switch", at: 3_300_000, company: "forja" }]);
    expect(twice.rejected).toEqual([4, 5]);
  });
});
