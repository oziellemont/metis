// Solo servidor (usa la llave de servicio).
/**
 * Lee los interruptores desde Supabase (solo servidor). Si algo falla, todo apagado.
 * Caché de 60 s para los globales: prender/apagar tarda como máximo un minuto en aplicar.
 */
import { supabaseCeoAdmin } from "@/lib/supabase/server";
import { ALL_OFF, resolveFlags, type Flags, type GlobalFlagRow } from "./flags";

let cache: { at: number; rows: GlobalFlagRow[] | null } | null = null;

export async function globalFlagRows(): Promise<GlobalFlagRow[] | null> {
  if (cache && Date.now() - cache.at < 60_000) return cache.rows;
  const sb = supabaseCeoAdmin();
  if (!sb) return null;
  const { data, error } = await sb.from("flags").select("key, enabled, value");
  const rows = error ? null : ((data ?? []) as GlobalFlagRow[]);
  cache = { at: Date.now(), rows };
  return rows;
}

export async function flagsFor(userId?: string | null): Promise<Flags> {
  try {
    const global = await globalFlagRows();
    if (!global) return { ...ALL_OFF };
    let player: unknown = {};
    let aiConsent = false;
    if (userId) {
      const sb = supabaseCeoAdmin();
      const { data } = (await sb?.from("players").select("flags, ai_consent").eq("user_id", userId).maybeSingle()) ?? { data: null };
      player = data?.flags ?? {};
      aiConsent = data?.ai_consent === true;
    }
    return resolveFlags({ global, player, aiConsent, aiEnvEnabled: process.env.CEO_AI_ENABLED === "1" });
  } catch {
    return { ...ALL_OFF };
  }
}
