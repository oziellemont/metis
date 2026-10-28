/** APIs de perfil e interés: exigen sesión, validan contra el catálogo y escriben solo la fila propia. */
import { beforeEach, describe, expect, it, vi } from "vitest";

let user: { id: string } | null = null;
const writes: { table: string; op: string; row: Record<string, unknown> }[] = [];
vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: async () => ({
    auth: { getUser: async () => ({ data: { user } }) },
    schema: () => ({
      from: (table: string) => ({
        upsert: async (row: Record<string, unknown>) => { writes.push({ table, op: "upsert", row }); return { error: null }; },
        delete: () => ({ match: async (row: Record<string, unknown>) => { writes.push({ table, op: "delete", row }); return { error: null }; } }),
      }),
    }),
  }),
}));
const perfil = await import("./perfil/route");
const interes = await import("./interes/route");
const post = (h: (r: Request) => Promise<Response>, body: unknown) => h(new Request("http://x/api", { method: "POST", body: JSON.stringify(body) }));
const okProfile = { homeIndustryId: "consumo", homeCompanyVariantId: "cumbre", dailyDecisionGoal: 3, userId: "otro-usuario" };

beforeEach(() => { user = null; writes.length = 0; });

describe("POST /api/ceo/perfil", () => {
  it("sin sesión: 401 y no escribe", async () => {
    const r = await post(perfil.POST, okProfile);
    expect(r.status).toBe(401);
    expect(writes).toEqual([]);
  });
  it("guarda en la fila del usuario de la sesión, ignorando cualquier id del cuerpo", async () => {
    user = { id: "u-real" };
    const r = await post(perfil.POST, okProfile);
    expect(r.status).toBe(200);
    expect(writes).toHaveLength(1);
    expect(writes[0].row.user_id).toBe("u-real");
    expect(writes[0].row.home_company_variant_id).toBe("cumbre");
    expect(writes[0].row.daily_decision_goal).toBe(3);
    expect(writes[0].row).not.toHaveProperty("userId");
  });
  it("rechaza una empresa «Próximamente»", async () => {
    user = { id: "u" };
    const r = await post(perfil.POST, { ...okProfile, homeCompanyVariantId: "casademaiz" });
    expect(r.status).toBe(400);
    expect(await r.json()).toMatchObject({ error: "no_jugable" });
    expect(writes).toEqual([]);
  });
});

describe("POST /api/ceo/interes", () => {
  it("sin sesión: 401", async () => {
    expect((await post(interes.POST, { industryId: "salud" })).status).toBe(401);
  });
  it("marca y quita interés en industrias o empresas «Próximamente»", async () => {
    user = { id: "u" };
    expect((await post(interes.POST, { industryId: "salud" })).status).toBe(200);
    expect((await post(interes.POST, { industryId: "consumo", companyId: "sierraysal" })).status).toBe(200);
    expect((await post(interes.POST, { industryId: "salud", on: false })).status).toBe(200);
    expect(writes.map((w) => [w.op, w.row.industry_id, w.row.company_id, w.row.user_id])).toEqual([["upsert", "salud", "", "u"], ["upsert", "consumo", "sierraysal", "u"], ["delete", "salud", "", "u"]]);
  });
  it("no acepta jugables, ids inventados ni empresas de otra industria", async () => {
    user = { id: "u" };
    expect((await post(interes.POST, { industryId: "consumo" })).status).toBe(400);
    expect((await post(interes.POST, { industryId: "consumo", companyId: "cumbre" })).status).toBe(400);
    expect((await post(interes.POST, { industryId: "inventada" })).status).toBe(400);
    expect((await post(interes.POST, { industryId: "salud", companyId: "kubit" })).status).toBe(400);
    expect(writes).toEqual([]);
  });
});
