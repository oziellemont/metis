/** POST /api/ceo/partida (0.5, sombra) contra una base simulada en memoria que imita ceo.journal_commit. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { replay, type GameAction } from "@/lib/ceo/replay";
import { migrate, xpOf } from "@/lib/ceo/engine";
import { memoryKV } from "@/lib/ceo/import";
import { flushOnce, logAction, pendingCount } from "@/lib/ceo/journal-client";
import { careerStartOf, serverXpOf } from "@/lib/ceo/journal";
import type { Golden } from "@/lib/ceo/golden/play";
import type { CeoState } from "@/lib/ceo/types";

const golden = (id: string): Golden => JSON.parse(readFileSync(join(__dirname, "../../../lib/ceo/golden/data", `${id}.json`), "utf8"));

let user: { id: string; email: string } | null = null;
let journalOn = true;
let tablesMissing = false;
/** Para simular otro dispositivo que guarda justo entre la lectura y el guardado. */
let beforeCommit: (() => Promise<unknown>) | null = null;
let conflicts = 0;
type Run = { run_id: string; user_id: string; version: number; state: CeoState; server_xp: number; client_xp: number | null; base_kind: string; base_xp: number; events_accepted: number; events_rejected: number; events_flagged: number };
const db = { runs: new Map<string, Run>(), events: new Map<string, Record<string, unknown>>() };
const missing = { code: "42P01", message: "no existe" };

vi.mock("@/lib/ceo/flags-server", () => ({ flagsFor: async () => ({ ai: false, ai_shadow: false, events: false, game_journal: journalOn, replay_shadow: false }) }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }),
  supabaseCeoAdmin: () => ({
    from: (t: string) => ({
      select: () => ({
        eq: (_c: string, v: string) => ({
          maybeSingle: async () => (tablesMissing ? { data: null, error: missing } : { data: db.runs.get(v) ? JSON.parse(JSON.stringify(db.runs.get(v))) : null, error: null }),
          in: async (_c2: string, ids: string[]) => ({ data: ids.filter((i) => db.events.has(`${v}|${i}`)).map((i) => ({ event_id: i })), error: null }),
        }),
      }),
      _t: t,
    }),
    rpc: async (_fn: string, p: Record<string, unknown>) => {
      if (tablesMissing) return { data: null, error: missing };
      if (beforeCommit) { const f = beforeCommit; beforeCommit = null; await f(); }
      const evs = p.p_events as { eventId: string; accepted: boolean; note: string | null }[];
      const ok = evs.filter((e) => e.accepted).length, bad = evs.length - ok, flag = evs.filter((e) => (e.note ?? "").includes("reloj_adelantado")).length;
      const cur = db.runs.get(p.p_run as string);
      if (p.p_version === 0) {
        if (cur) { conflicts++; return { data: "conflicto", error: null }; }
        db.runs.set(p.p_run as string, { run_id: p.p_run as string, user_id: p.p_user as string, version: 1, state: p.p_state as CeoState, server_xp: p.p_server_xp as number, client_xp: p.p_client_xp as number | null, base_kind: p.p_base_kind as string, base_xp: p.p_base_xp as number, events_accepted: ok, events_rejected: bad, events_flagged: flag });
      } else {
        if (!cur || cur.version !== p.p_version || cur.user_id !== p.p_user) { conflicts++; return { data: "conflicto", error: null }; }
        db.runs.set(cur.run_id, { ...cur, version: cur.version + 1, state: p.p_state as CeoState, server_xp: p.p_server_xp as number, client_xp: (p.p_client_xp as number | null) ?? cur.client_xp, events_accepted: cur.events_accepted + ok, events_rejected: cur.events_rejected + bad, events_flagged: cur.events_flagged + flag });
      }
      for (const e of evs) { const k = `${p.p_user}|${e.eventId}`; if (!db.events.has(k)) db.events.set(k, { ...e, run_id: p.p_run }); }
      return { data: "ok", error: null };
    },
  }),
}));
const { POST } = await import("./partida/route");
const call = async (body: unknown) => { const r = await POST(new Request("http://x/api/ceo/partida", { method: "POST", body: JSON.stringify(body) })); return { status: r.status, json: (await r.json()) as Record<string, unknown> }; };

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
let n = 0;
const id = () => { n++; return `11111111-1111-4111-8111-${n.toString(16).padStart(12, "0")}`; };
const evs = (actions: GameAction[], from = 1) => actions.map((action, i) => ({ eventId: id(), seq: from + i, action }));
const onlyRun = () => { expect(db.runs.size).toBe(1); return [...db.runs.values()][0]; };

beforeEach(() => { conflicts = 0; user = null; journalOn = true; tablesMissing = false; beforeCommit = null; db.runs.clear(); db.events.clear(); });

describe("POST /api/ceo/partida", () => {
  const g = golden("cumbre-mejor");
  const career = g.actions[0].at;

  it("sin sesión: 401 y no guarda nada", async () => {
    expect((await call({ career, events: evs(g.actions.slice(0, 3)) })).status).toBe(401);
    expect(db.runs.size + db.events.size).toBe(0);
  });
  it("interruptor apagado: responde journal:false y no guarda nada (apagado seguro)", async () => {
    user = { id: A, email: "a@x.mx" }; journalOn = false;
    expect((await call({ career, events: evs(g.actions) })).json).toEqual({ ok: true, journal: false });
    expect(db.runs.size + db.events.size).toBe(0);
  });
  it("sin la migración 0018: no falla, responde journal:false", async () => {
    user = { id: A, email: "a@x.mx" }; tablesMissing = true;
    expect((await call({ career, events: evs(g.actions.slice(0, 2)) })).json).toMatchObject({ ok: true, journal: false, reason: "sin_tabla" });
  });
  it("partida completa en lotes: el servidor llega al mismo estado y XP que el navegador", async () => {
    user = { id: A, email: "a@x.mx" };
    const all = evs(g.actions);
    for (let i = 0; i < all.length; i += 20) {
      const r = await call({ career, events: all.slice(i, i + 20) });
      expect(r.status).toBe(200);
      expect(r.json.rejected).toBe(0);
    }
    const run = onlyRun();
    const client = replay(g.actions).state;
    const at = g.checkpoints[g.checkpoints.length - 1].at;
    expect(xpOf(migrate(run.state), at)).toBe(xpOf(client, at));
    expect(run).toMatchObject({ user_id: A, base_kind: "inicio", base_xp: 0, events_accepted: g.actions.length, events_rejected: 0 });
    expect(db.events.size).toBe(g.actions.length);
  });
  it("reintentos y doble envío: nada se aplica dos veces", async () => {
    user = { id: A, email: "a@x.mx" };
    const batch = evs(g.actions.slice(0, 15));
    await call({ career, events: batch });
    const first = JSON.stringify(onlyRun().state);
    const [r1, r2] = await Promise.all([call({ career, events: batch }), call({ career, events: batch })]);
    expect(r1.json).toMatchObject({ ok: true, duplicates: 15, accepted: 0 });
    expect(r2.json).toMatchObject({ ok: true, duplicates: 15, accepted: 0 });
    expect(JSON.stringify(onlyRun().state)).toBe(first);
    expect(onlyRun().events_accepted).toBe(15);
    expect(db.events.size).toBe(15);
  });
  it("dos dispositivos guardan a la vez: se relee, se reintenta y no se pierde ninguna jugada", async () => {
    user = { id: A, email: "a@x.mx" };
    await call({ career, events: evs(g.actions.slice(0, 10)) });
    const phone = evs(g.actions.slice(10, 14), 100);
    const laptop = evs(g.actions.slice(14, 18), 200);
    // El teléfono guarda justo después de que la laptop leyó (la versión de la laptop queda vieja).
    beforeCommit = () => call({ career, events: phone });
    const r = await call({ career, events: laptop });
    expect(r.json.ok).toBe(true);
    expect(conflicts).toBe(1); // hubo choque real y se resolvió releyendo
    const run = onlyRun();
    expect(run.events_accepted + run.events_rejected).toBe(18);
    expect(db.events.size).toBe(18);
    const expected = replay(g.actions.slice(0, 18)).state;
    expect(Object.keys(migrate(run.state).decisions).sort()).toEqual(Object.keys(expected.decisions).sort());
  });
  it("una jugada que ya no procede (el otro dispositivo decidió primero) queda rechazada sin tocar el estado", async () => {
    user = { id: A, email: "a@x.mx" };
    const i = g.actions.findIndex((a) => a.type === "decide");
    await call({ career, events: evs(g.actions.slice(0, i + 1)) });
    const before = JSON.stringify(onlyRun().state);
    const r = await call({ career, events: evs([g.actions[i]], 50) });
    expect(r.json).toMatchObject({ accepted: 0, rejected: 1 });
    expect(JSON.stringify(onlyRun().state)).toBe(before);
  });
  it("cada usuario tiene su carrera: B no puede escribir en la de A aunque mande el mismo inicio", async () => {
    user = { id: A, email: "a@x.mx" };
    await call({ career, events: evs(g.actions.slice(0, 5)) });
    user = { id: B, email: "b@x.mx" };
    expect((await call({ career, events: evs(g.actions.slice(5, 8)) })).json).toMatchObject({ need: "base" });
    expect(db.runs.size).toBe(1);
    await call({ career, events: evs(g.actions.slice(0, 2), 500) });
    expect(db.runs.size).toBe(2);
    expect([...db.runs.values()].map((r) => r.user_id).sort()).toEqual([A, B]);
  });
  it("carrera desconocida a medias: pide punto de partida; con él queda como «continuación» sin correo ni teléfono", async () => {
    user = { id: A, email: "a@x.mx" };
    const f = golden("forja-azar");
    const s = replay(f.actions).state;
    const withContact = { ...s, settings: { ...s.settings, email: "a@x.mx", phone: "+528100000000" } };
    const c = careerStartOf(s)!;
    expect((await call({ career: c, events: [] })).json).toMatchObject({ need: "base" });
    expect((await call({ career: c + 1, events: [], base: withContact })).status).toBe(422);
    const r = await call({ career: c, events: [], base: withContact, clientXp: 99999 });
    expect(r.status).toBe(200);
    const run = onlyRun();
    expect(run.base_kind).toBe("continuacion");
    expect(run.base_xp).toBe(serverXpOf(s, Date.now()));
    expect(run.client_xp).toBe(99999);
    expect(JSON.stringify(run.state)).not.toMatch(/a@x\.mx|528100000000/);
  });
  it("el usuario sale de la sesión, no del cuerpo", async () => {
    user = { id: A, email: "a@x.mx" };
    await call({ career, user_id: B, events: evs(g.actions.slice(0, 3)) });
    expect(onlyRun().user_id).toBe(A);
  });
  it("entrada inválida: 400", async () => {
    user = { id: A, email: "a@x.mx" };
    expect((await call({ events: [] })).status).toBe(400);
    const r = await POST(new Request("http://x/api/ceo/partida", { method: "POST", body: "{no" }));
    expect(r.status).toBe(400);
  });
});

describe("cola del navegador contra la ruta", () => {
  const g = golden("brasa-peor");
  const fetchFn = async (_u: string, init: { body: string }) => { const r = await POST(new Request("http://x/api/ceo/partida", { method: "POST", body: init.body })); return { status: r.status, json: () => r.json() }; };

  it("anota cada jugada, envía en lotes y vacía la cola; el servidor coincide con el navegador", async () => {
    user = { id: A, email: "a@x.mx" };
    const kv = memoryKV();
    let s = replay([]).state;
    for (const a of g.actions) { s = replay([a], s).state; logAction(kv, A, s, a); }
    expect(pendingCount(kv, A)).toBe(g.actions.length);
    for (let i = 0; i < 20 && pendingCount(kv, A); i++) await flushOnce(kv, A, s, xpOf(s), fetchFn);
    expect(pendingCount(kv, A)).toBe(0);
    const run = onlyRun();
    const at = g.checkpoints[g.checkpoints.length - 1].at;
    expect(xpOf(migrate(run.state), at)).toBe(xpOf(s, at));
  });
  it("si la carrera ya venía de antes, manda el estado como punto de partida y sigue", async () => {
    user = { id: A, email: "a@x.mx" };
    const kv = memoryKV();
    const half = Math.floor(g.actions.length / 2);
    let s = replay(g.actions.slice(0, half)).state;
    for (const a of g.actions.slice(half)) { s = replay([a], s).state; logAction(kv, A, s, a); }
    expect(await flushOnce(kv, A, s, xpOf(s), fetchFn)).toBe("enviado");
    expect(pendingCount(kv, A)).toBe(0);
    expect(onlyRun().base_kind).toBe("continuacion");
    // Siguiente jugada ya entra al diario normal.
    logAction(kv, A, s, { type: "lesson", at: (s.lastActiveAt || 0) + 1000, id: "personas" });
    expect(await flushOnce(kv, A, s, xpOf(s), fetchFn)).toBe("enviado");
    expect(onlyRun().events_accepted + onlyRun().events_rejected).toBe(1);
  });
  it("interruptor apagado: la cola se vacía y deja de anotar en ese dispositivo", async () => {
    user = { id: A, email: "a@x.mx" }; journalOn = false;
    const kv = memoryKV();
    const s = replay(g.actions.slice(0, 1)).state;
    logAction(kv, A, s, g.actions[0]);
    expect(await flushOnce(kv, A, s, 0, fetchFn)).toBe("apagado");
    expect(pendingCount(kv, A)).toBe(0);
    expect(db.runs.size).toBe(0);
  });
  it("sin red: la cola espera intacta", async () => {
    const kv = memoryKV();
    const s = replay(g.actions.slice(0, 1)).state;
    logAction(kv, A, s, g.actions[0]);
    expect(await flushOnce(kv, A, s, 0, async () => { throw new Error("offline"); })).toBe("reintentar");
    expect(pendingCount(kv, A)).toBe(1);
  });
});
