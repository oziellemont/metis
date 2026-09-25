import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const hasSupabaseServer = Boolean(URL && ANON);

/** Cliente con la sesión del usuario (cookies). Para Server Components, Route Handlers y Server Actions. */
export async function supabaseServer() {
  if (!hasSupabaseServer) return null;
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (all) => { try { all.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* en Server Components no se puede escribir */ } },
    },
  });
}

/**
 * Cliente administrativo (service role). Salta RLS: úsalo SÓLO en el servidor
 * para tareas de sistema (cron de recordatorios, aceptar invitaciones).
 */
export function supabaseAdmin() {
  if (!URL || !SERVICE) return null;
  return createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: "metis" } });
}
