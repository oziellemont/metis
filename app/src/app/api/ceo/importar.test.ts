/** POST /api/ceo/importar · adenda v3.2 §3.4 contra una base simulada en memoria. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { replay } from "@/lib/ceo/replay";
import { xpOf } from "@/lib/ceo/engine";
import type { Golden } from "@/lib/ceo/golden/play";
import type { CeoState } from "@/lib/ceo/types";

const golden = (id: string): CeoState => {
  const g: Golden = JSON.parse(readFileSync(join(__dirname, "../../../lib/ceo/golden/data", `${id}.json`), "utf8"));
  const st = replay(g.actions).state;
  const last = g.actions[g.actions.length - 1].at;
  return JSON.parse(JSON.stringify({ ...st, savedAt: last, lastActiveAt: Math.max(st.lastActiveAt, last) }));
};

let user: { id: string; email: string } | null = null;
let logMissing = false;
let failPlayersUpsert = false;
const db = { players: new Map<string, Record<string, unknown>>(), career_imports: new Map<string, Record<string, unknown>>() };

function table(name: "players" | "career_imports") {
  const m = db[name];
  const key = name === "players" ? "user_id" : "import_id";
  const missing = name === "career_imports" && logMissing ? { code: "42P01", message: "relation ceo.career_imports does not exist" } : null;
  return {
    select: () => ({ eq: (_c: string, v: string) => ({ maybeSingle: async () => (missing ? { data: null, error: missing } : { data: m.get(v) ?? null, error: null }) }) }),
    insert: async (row: Record<string, unknown>) => {
      if (missing) return { error: missing };
      if (m.has(row[key] as string)) return { error: { code: "23505", message: "duplicate" } };
      m.set(row[key] as string, row); return { error: null };
    },
    upsert: async (row: Record<string, unknown>) => {
      if (failPlayersUpsert) return { error: { code: "XX", message: "red" } };
      m.set(row[key] as string, { ...(m.get(row[key] as string) ?? {}), ...row }); return { error: null };
    },
    delete: () => ({ eq: async (_c: string, v: string) => { m.delete(v); return { error: null }; } }),
  };
}
vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }),
  supabaseCeoAdmin: () => ({ from: (t: "players" | "career_imports") => table(t) }),
}));
const { POST } = await import("./importar/route");
const call = async (body: unknown) => { const r = await POST(new Request("http://x/api/ceo/importar", { method: "POST", body: JSON.stringify(body) })); return { status: r.status, json: (await r.json()) as Record<string, unknown> }; };

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const ID1 = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";

beforeEach(() => { user = null; logMissing = false; failPlayersUpsert = false; db.players.clear(); db.career_imports.clear(); });

describe("POST /api/ceo/importar", () => {
  it("sin sesión: 401 y no escribe nada", async () => {
    const r = await call({ importId: ID1, mode: "vacia", state: golden("cumbre-vencidos") });
    expect(r.status).toBe(401);
    expect(db.players.size + db.career_imports.size).toBe(0);
  });

  it("nube vacía: importa una sola vez, sin perder XP, en la fila del usuario de la sesión", async () => {
    user = { id: A, email: "a@x.mx" };
    const s = golden("cumbre-vencidos");
    const r = await call({ importId: ID1, mode: "vacia", state: { ...s, user_id: B } });
    expect(r.status).toBe(200);
    expect(r.json.repeated).toBe(false);
    const row = db.players.get(A)!;
    expect(row.user_id).toBe(A);
    expect(db.players.has(B)).toBe(false);
    expect(row.xp).toBe(xpOf(s, Date.now() + (s.clockOffset || 0)));
    const st = row.state as CeoState;
    expect(st.origin).toMatchObject({ importId: ID1, legacyCompanyId: "cumbre", companyVariantId: "cumbre", localSavedAt: s.savedAt });
    expect(Object.keys(st.decisions)).toEqual(Object.keys(s.decisions));
    expect(db.career_imports.get(ID1)).toMatchObject({ user_id: A, mode: "vacia", replaced_state: null });
  });

  it("doble clic o recarga con el mismo importId: no duplica ni vuelve a escribir", async () => {
    user = { id: A, email: "a@x.mx" };
    const s = golden("cumbre-vencidos");
    await call({ importId: ID1, mode: "vacia", state: s });
    const first = JSON.stringify(db.players.get(A));
    const [r1, r2] = await Promise.all([call({ importId: ID1, mode: "vacia", state: s }), call({ importId: ID1.toUpperCase(), mode: "vacia", state: s })]);
    expect(r1.json).toMatchObject({ ok: true, repeated: true });
    expect(r2.json).toMatchObject({ ok: true, repeated: true });
    expect(db.career_imports.size).toBe(1);
    expect(JSON.stringify(db.players.get(A))).toBe(first);
  });

  it("la cuenta ya tiene carrera: «vacia» se rechaza (409) y la nube queda igual", async () => {
    user = { id: A, email: "a@x.mx" };
    const cloud = golden("forja-azar");
    db.players.set(A, { user_id: A, state: cloud, xp: 5 });
    const r = await call({ importId: ID1, mode: "vacia", state: golden("cumbre-vencidos") });
    expect(r.status).toBe(409);
    expect(r.json.error).toBe("nube_ocupada");
    expect((db.players.get(A)!.state as CeoState).company).toBe("forja");
    expect(db.career_imports.size).toBe(0);
  });

  it("«reemplazar» por elección explícita: la carrera de la cuenta queda respaldada completa", async () => {
    user = { id: A, email: "a@x.mx" };
    const cloud = golden("forja-azar");
    db.players.set(A, { user_id: A, state: cloud });
    const r = await call({ importId: ID2, mode: "reemplazar", state: golden("cumbre-vencidos") });
    expect(r.status).toBe(200);
    expect((db.players.get(A)!.state as CeoState).company).toBe("cumbre");
    const log = db.career_imports.get(ID2)!;
    expect(log.mode).toBe("reemplazar");
    expect((log.replaced_state as CeoState).company).toBe("forja");
    expect((log.replaced_state as CeoState).decisions).toEqual(cloud.decisions);
  });

  it("sin la tabla de respaldo (migración 0017 sin aplicar): nunca reemplaza; con nube vacía sí importa", async () => {
    user = { id: A, email: "a@x.mx" };
    logMissing = true;
    db.players.set(A, { user_id: A, state: golden("forja-azar") });
    const r = await call({ importId: ID1, mode: "reemplazar", state: golden("cumbre-vencidos") });
    expect(r.status).toBe(503);
    expect((db.players.get(A)!.state as CeoState).company).toBe("forja");
    db.players.clear();
    const ok = await call({ importId: ID1, mode: "vacia", state: golden("cumbre-vencidos") });
    expect(ok.status).toBe(200);
    // Y repetirlo se reconoce por la marca dentro de la carrera.
    expect((await call({ importId: ID1, mode: "vacia", state: golden("cumbre-vencidos") })).json).toMatchObject({ ok: true, repeated: true });
  });

  it("falla al guardar la carrera: se deshace la bitácora (sin estado parcial) y se puede reintentar", async () => {
    user = { id: A, email: "a@x.mx" };
    failPlayersUpsert = true;
    const r = await call({ importId: ID1, mode: "vacia", state: golden("cumbre-vencidos") });
    expect(r.status).toBe(500);
    expect(db.career_imports.size).toBe(0);
    expect(db.players.size).toBe(0);
    failPlayersUpsert = false;
    expect((await call({ importId: ID1, mode: "vacia", state: golden("cumbre-vencidos") })).status).toBe(200);
  });

  it("un importId de otra persona no le da acceso a nada", async () => {
    user = { id: A, email: "a@x.mx" };
    await call({ importId: ID1, mode: "vacia", state: golden("cumbre-vencidos") });
    user = { id: B, email: "b@x.mx" };
    const r = await call({ importId: ID1, mode: "vacia", state: golden("forja-azar") });
    expect(r.status).toBe(409);
    expect(r.json.error).toBe("import_id_ajeno");
    expect(r.json.state).toBeUndefined();
    expect(db.players.has(B)).toBe(false);
  });

  it("partida inválida o datos mal formados: se rechaza sin tocar nada", async () => {
    user = { id: A, email: "a@x.mx" };
    expect((await call({ importId: "x", mode: "vacia", state: golden("cumbre-vencidos") })).json.error).toBe("import_id_invalido");
    expect((await call({ importId: ID1, mode: "fusionar", state: golden("cumbre-vencidos") })).json.error).toBe("modo_invalido");
    const r = await call({ importId: ID1, mode: "vacia", state: { ...golden("cumbre-vencidos"), company: "inventada" } });
    expect(r.status).toBe(422);
    expect(db.players.size + db.career_imports.size).toBe(0);
  });
});
