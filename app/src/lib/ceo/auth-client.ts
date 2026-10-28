"use client";
/**
 * mêtis CEO · entrada desde el navegador. Usa el mismo Supabase Auth que mêtis Align
 * (una persona = un usuario), pero con su propia pantalla, textos y destinos.
 * Métodos: Google y correo con contraseña. Recuperación de contraseña por correo.
 */
import { supabaseBrowser } from "@/lib/supabase/client";
import { CEO_FIRST_DAY, CEO_HOME, CEO_NEW_PASSWORD_PATH, ceoAuthMessage, ceoSafeNext } from "./auth-routes";

export type AuthResult = { ok: true; session: boolean } | { ok: false; error: string };

const callback = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
const noBackend: AuthResult = { ok: false, error: "El acceso no está disponible en este momento. Intenta más tarde." };

export async function ceoSignInWithGoogle(next?: string | null): Promise<AuthResult> {
  const sb = supabaseBrowser();
  if (!sb) return noBackend;
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback(ceoSafeNext(next)), queryParams: { prompt: "select_account" } },
  });
  return error ? { ok: false, error: ceoAuthMessage(error.message) } : { ok: true, session: false };
}

export async function ceoSignInWithPassword(email: string, password: string): Promise<AuthResult> {
  const sb = supabaseBrowser();
  if (!sb) return noBackend;
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  return error ? { ok: false, error: ceoAuthMessage(error.message) } : { ok: true, session: true };
}

/**
 * Crear cuenta. Si Supabase pide confirmar el correo, `session` llega en false y se muestra «Revisa tu correo».
 * Supabase no avisa si el correo ya existía (para no revelar cuentas): en ese caso tampoco hay sesión ni identidades.
 */
export async function ceoSignUp(name: string, email: string, password: string, next?: string | null): Promise<AuthResult> {
  const sb = supabaseBrowser();
  if (!sb) return noBackend;
  const { data, error } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: callback(ceoSafeNext(next, CEO_FIRST_DAY)), data: { full_name: name.trim(), app: "ceo" } },
  });
  if (error) return { ok: false, error: ceoAuthMessage(error.message) };
  return { ok: true, session: Boolean(data.session) };
}

export async function ceoSendPasswordReset(email: string): Promise<AuthResult> {
  const sb = supabaseBrowser();
  if (!sb) return noBackend;
  const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: callback(CEO_NEW_PASSWORD_PATH) });
  // Mismo mensaje exista o no la cuenta; solo se reportan límites o fallas de red.
  if (error && /rate|security|too many|network|fetch/i.test(error.message)) return { ok: false, error: ceoAuthMessage(error.message) };
  return { ok: true, session: false };
}

export async function ceoUpdatePassword(password: string): Promise<AuthResult> {
  const sb = supabaseBrowser();
  if (!sb) return noBackend;
  const { error } = await sb.auth.updateUser({ password });
  return error ? { ok: false, error: ceoAuthMessage(error.message) } : { ok: true, session: true };
}

export async function ceoHasSession(): Promise<boolean> {
  const sb = supabaseBrowser();
  if (!sb) return false;
  const { data } = await sb.auth.getUser();
  return Boolean(data.user);
}

export async function ceoSignOut(): Promise<void> {
  const sb = supabaseBrowser();
  if (sb) await sb.auth.signOut();
}

export { CEO_HOME };
