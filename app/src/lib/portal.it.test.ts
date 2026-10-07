/**
 * Prueba de integración del portal por cliente (aislamiento + persistencia real).
 * Corre contra un Postgres con las migraciones + seed y PostgREST delante (simula Supabase).
 * Se salta si no está METIS_IT_URL. Variables:
 *   METIS_IT_URL=http://localhost:54321  METIS_IT_JWT_SECRET=…
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadTenant, loadTenantList, toDb } from "./portal-data";
import { newId } from "./store-core";

const URL_ = process.env.METIS_IT_URL ?? "";
const SECRET = process.env.METIS_IT_JWT_SECRET ?? "";
const ANDES = "23d64e76-1c9a-5973-be28-0115e8623be6";
const U = {
  oziel: "aaaaaaaa-0000-4000-8000-000000000001",
  dueno: "bbbbbbbb-0000-4000-8000-000000000002",
  mariana: "037872f2-ba90-5a71-935d-47a00d9e7857",
  diego: "2f185954-c243-5222-8d69-37ce2d5c6871",
};
const ES_MARIANA = "48715e57-3a6a-5814-aea9-74a4c365f4f5";
const ES_DIEGO = "ab64ed01-023c-5b6d-938f-267c46359d08";

function jwt(payload: Record<string, unknown>) {
  const b = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const body = `${b({ alg: "HS256", typ: "JWT" })}.${b({ exp: Math.floor(Date.now() / 1000) + 3600, ...payload })}`;
  return `${body}.${createHmac("sha256", SECRET).update(body).digest("base64url")}`;
}
function as(userId: string): SupabaseClient {
  const anon = jwt({ role: "anon" });
  return createClient(URL_, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Node 20 no trae WebSocket nativo; la prueba no usa Realtime.
    realtime: { transport: class { constructor() { /* noop */ } } as never },
    global: { headers: { Authorization: `Bearer ${jwt({ sub: userId, role: "authenticated" })}` } },
  });
}

describe.skipIf(!URL_ || !SECRET)("portal por cliente · integración", () => {
  let acme = "";
  const ids = { obj: newId(), lae: newId(), el: newId(), es: newId(), sc: newId(), item: newId(), res: newId() };

  beforeAll(async () => {
    const r = await as(U.oziel).schema("metis").rpc("create_tenant", { p_name: `Aceros Monterrey ${Date.now()}`, p_plan: "crece", p_owner_email: "dueno@aceros.mx", p_add_me: true });
    expect(r.error).toBeNull();
    acme = (Array.isArray(r.data) ? r.data[0] : r.data).tenant_id;
  });

  it("cada usuario sólo ve SUS empresas", async () => {
    const mine = await loadTenantList(as(U.dueno), U.dueno);
    expect(mine.map((t) => t.id)).toContain(acme);
    expect(mine.map((t) => t.id)).not.toContain(ANDES);
    expect(mine.find((t) => t.id === acme)?.role).toBe("owner");

    const mariana = await loadTenantList(as(U.mariana), U.mariana);
    expect(mariana.map((t) => t.id)).toEqual([ANDES]);

    const oziel = await loadTenantList(as(U.oziel), U.oziel);
    expect(oziel.map((t) => t.id)).toContain(acme);
  });

  it("un cliente no puede abrir ni leer el portal de otro", async () => {
    await expect(loadTenant(as(U.dueno), ANDES)).rejects.toThrow(/acceso/);
    const db = as(U.dueno).schema("metis");
    for (const t of ["results", "elements", "scorecards", "memberships", "objectives", "invitations"]) {
      const r = await db.from(t).select("id").eq("tenant_id", ANDES);
      expect(r.data ?? [], t).toHaveLength(0);
    }
    const prof = await db.from("profiles").select("id").eq("id", U.mariana);
    expect(prof.data ?? []).toHaveLength(0);
  });

  it("el portal nuevo trae su estructura base", async () => {
    const d = await loadTenant(as(U.dueno), acme);
    expect(d.tenant.joinCode).toBeTruthy();
    expect(d.scopeTypes.map((s) => s.name)).toContain("Planta");
    expect(d.scopes).toHaveLength(1);
    expect(d.units.length).toBeGreaterThan(3);
    expect(d.users.map((u) => u.id).sort()).toEqual([U.oziel, U.dueno].sort());
  });

  it("lo que guarda un usuario queda en la base y lo ven sus compañeros", async () => {
    const db = as(U.dueno).schema("metis");
    const d = await loadTenant(as(U.dueno), acme);
    const unit = d.units.find((u) => u.symbol === "%")!;
    const ok = async (p: PromiseLike<{ error: { message: string } | null }>) => { const r = await p; expect(r.error?.message ?? null).toBeNull(); };

    await ok(db.from("objectives").upsert(toDb.objective(acme, { id: ids.obj, name: "Duplicar exportaciones", horizon: "2028" })));
    await ok(db.from("laes").upsert(toDb.lae(acme, { id: ids.lae, objectiveId: ids.obj, name: "Mercados nuevos", color: "#4F3FE0" })));
    await ok(db.from("elements").upsert(toDb.element(acme, { id: ids.el, type: "kpi", name: "Ventas export", formula: "", unit: "%", unitId: unit.id, direction: "up", laeId: ids.lae, allowedScopeTypeIds: [] })));
    await ok(db.from("element_scopes").upsert(toDb.elementScope(acme, { id: ids.es, elementId: ids.el, scopeId: d.scopes[0].id, ownerUserId: U.dueno })));
    await ok(db.from("scorecards").insert(toDb.scorecard(acme, { id: ids.sc, userId: U.dueno, year: 2026, status: "draft", approverId: "", history: [] })));
    await ok(db.from("scorecard_events").insert(toDb.event(acme, ids.sc, U.dueno, null, "draft")));
    await ok(db.from("scorecard_items").insert(toDb.item(acme, { id: ids.item, scorecardId: ids.sc, elementScopeId: ids.es, responsibility: "owner", weight: 100, monthlyWeights: { 12: 50 }, targets: { min: 80, sat: 90, out: 100 }, period: "monthly" })));
    await ok(db.from("results").upsert(toDb.result(acme, { id: ids.res, elementScopeId: ids.es, year: 2026, month: 9, value: 93.5, log: "Buen mes", loadedBy: U.dueno }), { onConflict: "element_scope_id,year,month" }));
    // segunda captura del mismo mes = actualización (no duplica)
    await ok(db.from("results").upsert(toDb.result(acme, { id: newId(), elementScopeId: ids.es, year: 2026, month: 9, value: 95, loadedBy: U.dueno }), { onConflict: "element_scope_id,year,month" }));
    await ok(db.from("tenants").update({ settings: { reminders: { enabled: false, days: [1], hour: 8, timezone: "America/Monterrey", escalateToManager: false, channels: { email: true, whatsapp: false } } } }).eq("id", acme));

    // Otro miembro (Oziel, consultor) abre el mismo portal y ve todo
    const seen = await loadTenant(as(U.oziel), acme);
    expect(seen.objectives.map((o) => o.name)).toContain("Duplicar exportaciones");
    expect(seen.elementScopes.find((x) => x.id === ids.es)?.ownerUserId).toBe(U.dueno);
    const res = seen.results.filter((r) => r.elementScopeId === ids.es);
    expect(res).toHaveLength(1);
    expect(res[0].value).toBe(95);
    const item = seen.scorecardItems.find((i) => i.id === ids.item)!;
    expect(item.monthlyWeights).toEqual({ 12: 50 });
    expect(item.targets).toEqual({ min: 80, sat: 90, out: 100 });
    expect(seen.scorecards.find((s) => s.id === ids.sc)?.history.map((h) => h.action)).toEqual(["draft"]);
    expect(seen.tenant.reminders?.enabled).toBe(false);
    // y Andes no ve nada de esto
    const andes = await loadTenant(as(U.mariana), ANDES);
    expect(andes.objectives.map((o) => o.name)).not.toContain("Duplicar exportaciones");
  });

  it("candados: no se pueden mezclar datos entre empresas", async () => {
    const db = as(U.dueno).schema("metis");
    const intoAndes = await db.from("results").insert(toDb.result(ANDES, { id: newId(), elementScopeId: ES_MARIANA, year: 2026, month: 1, value: 1 }));
    expect(intoAndes.error).not.toBeNull();
    const d = await loadTenant(as(U.dueno), acme);
    const drFromAndes = await db.from("element_scopes").insert(toDb.elementScope(acme, { id: newId(), elementId: ids.el, scopeId: d.scopes[0].id, ownerUserId: U.mariana }));
    expect(drFromAndes.error?.message).toMatch(/cross_tenant|row-level/);
    const moveOut = await db.from("results").update({ tenant_id: ANDES }).eq("element_scope_id", ids.es).select("id");
    expect(moveOut.error).not.toBeNull();
    const still = await db.from("results").select("tenant_id").eq("element_scope_id", ids.es);
    expect(still.data?.map((r) => r.tenant_id)).toEqual([acme]);
    const consola = await db.rpc("platform_tenants");
    expect(consola.error?.message).toMatch(/forbidden/);
  });

  it("permisos dentro de la empresa: el DR captura lo suyo, no lo ajeno", async () => {
    const db = as(U.mariana).schema("metis");
    const mine = await db.from("results").upsert(toDb.result(ANDES, { id: newId(), elementScopeId: ES_MARIANA, year: 2026, month: 10, value: 96.1, loadedBy: U.mariana }), { onConflict: "element_scope_id,year,month" });
    expect(mine.error).toBeNull();
    const other = await db.from("results").upsert(toDb.result(ANDES, { id: newId(), elementScopeId: ES_DIEGO, year: 2026, month: 10, value: 1, loadedBy: U.mariana }), { onConflict: "element_scope_id,year,month" });
    expect(other.error).not.toBeNull();
    const regen = await db.rpc("regenerate_join_code", { p_tenant: ANDES });
    expect(regen.error?.message).toMatch(/forbidden/);
    // Diego (compañero) ve el dato que capturó Mariana
    const seen = await loadTenant(as(U.diego), ANDES);
    expect(seen.results.find((r) => r.elementScopeId === ES_MARIANA && r.month === 10)?.value).toBe(96.1);
  });

  it("invitaciones y código por empresa", async () => {
    const db = as(U.dueno).schema("metis");
    const inv = { id: newId(), email: "Nuevo@Aceros.mx", role: "manager" as const, managerId: U.dueno, title: "Gerente de Planta", status: "pending" as const, createdAt: "", token: "t" + newId().replace(/-/g, "") };
    const r = await db.from("invitations").insert(toDb.invitation(acme, inv, U.dueno));
    expect(r.error).toBeNull();
    const code = await db.rpc("regenerate_join_code", { p_tenant: acme });
    expect(code.error).toBeNull();
    expect(String(code.data)).toMatch(/-/);
    const d = await loadTenant(as(U.oziel), acme);
    expect(d.invitations[0].email).toBe("nuevo@aceros.mx");
    expect(d.invitations[0].role).toBe("manager");
    expect(d.tenant.joinCode).toBe(code.data);
  });
});
