"use client";
/**
 * Acceso al círculo de la empresa.
 *
 * Flujo real (con Supabase):
 *   1. /login → magic link o Google → Supabase crea auth.user + metis.profiles (trigger).
 *   2. /unirme → el usuario captura el CÓDIGO de su empresa (o llega con ?inv=token de una invitación).
 *   3. RPC `metis.join_with_code(code)` o `metis.accept_invitation(token)` crea la membership
 *      → desde ese momento RLS le muestra sólo los datos de SU empresa.
 *   4. Si el correo ya tenía invitación pendiente, se acepta sola al iniciar sesión.
 *
 * Flujo demo (sin credenciales): simula los mismos pasos con localStorage.
 */
import { supabaseBrowser, hasSupabase } from "./supabase/client";
import { demoData } from "./demo/seed";

export const SESSION_KEY = "metis-session-v1";

export interface DemoSession { email: string; tenantId?: string; tenantName?: string; joinedVia?: "code" | "invitation"; }

export function getDemoSession(): DemoSession | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
}
export function setDemoSession(s: DemoSession | null) {
  if (!s) localStorage.removeItem(SESSION_KEY); else localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

/** Paso 1 · Iniciar sesión con correo (magic link). */
export async function signInWithEmail(email: string, next = "/unirme"): Promise<{ ok: boolean; mode: "supabase" | "demo"; error?: string }> {
  const sb = supabaseBrowser();
  if (sb) {
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    return error ? { ok: false, mode: "supabase", error: error.message } : { ok: true, mode: "supabase" };
  }
  setDemoSession({ email });
  return { ok: true, mode: "demo" };
}

export async function signInWithGoogle(next = "/unirme") {
  const sb = supabaseBrowser();
  if (!sb) { setDemoSession({ email: "tu.correo@empresa.com" }); return { ok: true, mode: "demo" as const }; }
  const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
  return error ? { ok: false, mode: "supabase" as const, error: error.message } : { ok: true, mode: "supabase" as const };
}

/** Paso 2 · Unirme a una empresa con su código. */
export async function joinWithCode(code: string): Promise<{ ok: boolean; tenantName?: string; error?: string }> {
  const clean = code.trim().toUpperCase();
  const sb = supabaseBrowser();
  if (sb) {
    const { data, error } = await sb.schema("metis").rpc("join_with_code", { p_code: clean });
    if (error) return { ok: false, error: friendly(error.message) };
    const row = Array.isArray(data) ? data[0] : data;
    return { ok: true, tenantName: (row as { tenant_name?: string } | null)?.tenant_name };
  }
  // demo
  if (clean !== (demoData.tenant.joinCode ?? "").toUpperCase()) return { ok: false, error: "Ese código no corresponde a ninguna empresa. Pídeselo a tu administrador." };
  const s = getDemoSession() ?? { email: "" };
  setDemoSession({ ...s, tenantId: demoData.tenant.id, tenantName: demoData.tenant.name, joinedVia: "code" });
  return { ok: true, tenantName: demoData.tenant.name };
}

/** Paso 2 (alternativo) · Aceptar invitación por token. */
export async function acceptInvitation(token: string): Promise<{ ok: boolean; tenantName?: string; error?: string }> {
  const sb = supabaseBrowser();
  if (sb) {
    const { data, error } = await sb.schema("metis").rpc("accept_invitation", { p_token: token });
    if (error) return { ok: false, error: friendly(error.message) };
    const row = Array.isArray(data) ? data[0] : data;
    return { ok: true, tenantName: (row as { tenant_name?: string } | null)?.tenant_name };
  }
  const inv = demoData.invitations.find((i) => i.id === token && i.status === "pending");
  if (!inv) return { ok: false, error: "La invitación no existe o ya fue usada." };
  const s = getDemoSession() ?? { email: inv.email };
  setDemoSession({ ...s, email: s.email || inv.email, tenantId: demoData.tenant.id, tenantName: demoData.tenant.name, joinedVia: "invitation" });
  return { ok: true, tenantName: demoData.tenant.name };
}

/** ¿El usuario ya pertenece a alguna empresa? Devuelve el tenant o null. */
export async function myTenant(): Promise<{ id: string; name: string } | null> {
  const sb = supabaseBrowser();
  if (sb) {
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return null;
    const { data } = await sb.schema("metis").from("memberships").select("tenant_id, tenants:tenants(name)").eq("user_id", u.user.id).eq("active", true).limit(1).maybeSingle();
    if (!data) return null;
    const t = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;
    return { id: data.tenant_id, name: (t as { name?: string } | null)?.name ?? "" };
  }
  const s = getDemoSession();
  return s?.tenantId ? { id: s.tenantId, name: s.tenantName ?? "" } : null;
}

export async function signOut() {
  const sb = supabaseBrowser();
  if (sb) await sb.auth.signOut();
  setDemoSession(null);
}

export { hasSupabase };

function friendly(msg: string) {
  if (/invalid_code/i.test(msg)) return "Ese código no corresponde a ninguna empresa. Pídeselo a tu administrador.";
  if (/invalid_invitation/i.test(msg)) return "La invitación no existe, venció o ya fue usada.";
  if (/email_mismatch/i.test(msg)) return "La invitación fue enviada a otro correo. Inicia sesión con el correo invitado.";
  if (/not_authenticated/i.test(msg)) return "Inicia sesión primero.";
  return msg;
}
