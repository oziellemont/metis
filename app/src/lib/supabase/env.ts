/**
 * Normaliza la URL del proyecto Supabase.
 * En el dashboard la URL aparece como `https://xxx.supabase.co/rest/v1/`; si se pega así en Vercel,
 * supabase-js construye `…/rest/v1/rest/v1/tabla` y PostgREST responde PGRST125 "Invalid path".
 * Aquí dejamos sólo el origen: `https://xxx.supabase.co`.
 */
export function normalizeSupabaseUrl(raw: string | undefined | null): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  try {
    return new URL(s).origin;
  } catch {
    return s.replace(/\/(rest|auth|storage|realtime|functions)\/v1\/?$/i, "").replace(/\/+$/, "");
  }
}

export const SUPABASE_URL = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
export const SUPABASE_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
