/**
 * Middleware: mêtis CEO exige sesión y tiene su propia entrada (/entrar). Supabase simulado.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

let currentUser: { id: string } | null = null;
let memberships: unknown[] = [];
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: currentUser } }) },
    schema: () => ({ from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ limit: async () => ({ data: memberships }) }) }) }) }) }),
  }),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://pruebas.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-de-prueba";
const { middleware } = await import("./middleware");

const call = (url: string) => middleware(new NextRequest(url, { headers: { host: new URL(url).host } }));
const loc = (r: Response) => { const l = r.headers.get("location"); return l ? new URL(l).pathname + new URL(l).search : null; };
const rewrittenTo = (r: Response) => { const h = r.headers.get("x-middleware-rewrite"); return h ? new URL(h).pathname : null; };

beforeEach(() => { currentUser = null; memberships = []; delete process.env.CEO_REQUIRE_LOGIN; });

describe("metis.ceo sin sesión", () => {
  it("la landing sigue pública", async () => {
    const r = await call("https://metis.ceo/");
    expect(rewrittenTo(r)).toBe("/simulador");
    expect(loc(r)).toBeNull();
  });
  it("legales y /entrar son públicos", async () => {
    expect(rewrittenTo(await call("https://metis.ceo/privacidad"))).toBe("/legal/privacidad");
    const r = await call("https://metis.ceo/entrar");
    expect(loc(r)).toBeNull();
  });
  it("el simulador manda a /entrar recordando a dónde iba", async () => {
    expect(loc(await call("https://metis.ceo/bandeja"))).toBe("/entrar?next=%2Fbandeja");
    expect(loc(await call("https://metis.ceo/ceo"))).toBe("/entrar");
    expect(loc(await call("https://metis.ceo/empezar"))).toBe("/entrar?next=%2Fempezar");
    expect(loc(await call("https://metis.ceo/caso/c1?x=1"))).toBe("/entrar?next=%2Fcaso%2Fc1%3Fx%3D1");
  });
  it("la entrada de Align no se usa en metis.ceo", async () => {
    expect(loc(await call("https://metis.ceo/login"))).toBe("/entrar");
    expect(loc(await call("https://metis.ceo/login?next=/ceo/bandeja"))).toBe("/entrar?next=%2Fceo%2Fbandeja");
    expect(loc(await call("https://metis.ceo/login?next=https://malo.com"))).toBe("/entrar");
  });
  it("interruptor de emergencia CEO_REQUIRE_LOGIN=0 deja jugar sin cuenta", async () => {
    process.env.CEO_REQUIRE_LOGIN = "0";
    const r = await call("https://metis.ceo/bandeja");
    expect(loc(r)).toBeNull();
    expect(rewrittenTo(r)).toBe("/ceo/bandeja");
  });
});

describe("metis.ceo con sesión", () => {
  beforeEach(() => { currentUser = { id: "u1" }; });
  it("entra al simulador (reescrito a /ceo) sin pedir empresa de Align", async () => {
    const r = await call("https://metis.ceo/bandeja");
    expect(loc(r)).toBeNull();
    expect(rewrittenTo(r)).toBe("/ceo/bandeja");
  });
  it("/entrar lo manda a su carrera o al destino seguro", async () => {
    expect(loc(await call("https://metis.ceo/entrar"))).toBe("/ceo");
    expect(loc(await call("https://metis.ceo/entrar?next=/ceo/ranking"))).toBe("/ceo/ranking");
    expect(loc(await call("https://metis.ceo/entrar?next=//malo.com"))).toBe("/ceo");
  });
  it("puede abrir la pantalla de contraseña nueva", async () => {
    expect(loc(await call("https://metis.ceo/entrar/nueva-clave"))).toBeNull();
  });
});

describe("enlaces que regresan a la raíz", () => {
  it("en metis.ceo el código va al callback y luego a /ceo", async () => {
    expect(loc(await call("https://metis.ceo/?code=abc"))).toBe("/auth/callback?code=abc&next=%2Fceo");
  });
  it("en Align sigue yendo a /unirme", async () => {
    expect(loc(await call("https://app.metis.mx/?code=abc"))).toBe("/auth/callback?code=abc&next=%2Funirme");
  });
});

describe("mêtis Align no cambia", () => {
  it("sin sesión, su app manda a /login de Align", async () => {
    expect(loc(await call("https://app.metis.mx/inicio"))).toBe("/login?next=%2Finicio");
  });
  it("con sesión pero sin empresa, a /unirme", async () => {
    currentUser = { id: "u1" };
    expect(loc(await call("https://app.metis.mx/inicio"))).toBe("/unirme");
  });
  it("con empresa, pasa", async () => {
    currentUser = { id: "u1" }; memberships = [{ tenant_id: "t" }];
    expect(loc(await call("https://app.metis.mx/inicio"))).toBeNull();
  });
  it("/ceo en el dominio de Align también exige sesión y usa la entrada de CEO", async () => {
    expect(loc(await call("https://app.metis.mx/ceo/bandeja"))).toBe("/entrar?next=%2Fceo%2Fbandeja");
  });
});
