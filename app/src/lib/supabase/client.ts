import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON);

export function supabaseBrowser() {
  if (!hasSupabase) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
}

/** Guarda un lead del Índice de Alineación. En modo demo (sin credenciales) lo deja en localStorage. */
export async function saveLead(lead: Record<string, unknown>): Promise<{ ok: boolean; mode: "supabase" | "local" }> {
  const sb = supabaseBrowser();
  if (sb) {
    const { error } = await sb.from("leads").insert(lead);
    if (!error) return { ok: true, mode: "supabase" };
    console.error(error);
  }
  try {
    const prev = JSON.parse(localStorage.getItem("metis-leads") ?? "[]");
    localStorage.setItem("metis-leads", JSON.stringify([...prev, { ...lead, at: new Date().toISOString() }]));
  } catch { /* ignore */ }
  return { ok: true, mode: "local" };
}
