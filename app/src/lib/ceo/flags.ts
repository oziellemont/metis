/**
 * mêtis CEO · interruptores (feature flags) y entorno.
 *
 * Reglas:
 *  - Todo lo nuevo arranca APAGADO. Si la base no responde, todo queda apagado.
 *  - Un interruptor de jugador (ceo.players.flags) solo puede APAGAR algo global
 *    o prenderlo si el global lo permite en modo "por jugador" (value.perPlayer).
 *  - La IA, además, exige consentimiento del jugador y la llave de entorno
 *    CEO_AI_ENABLED=1 (doble candado: base + Vercel).
 *  - Esta función es pura: no lee red ni reloj, para poder probarla.
 */

export const FLAG_KEYS = ["ai", "ai_shadow", "events", "game_journal", "replay_shadow", "episodes", "carrera_continua"] as const;
export type FlagKey = (typeof FLAG_KEYS)[number];
export type Flags = Record<FlagKey, boolean>;

export interface GlobalFlagRow { key: string; enabled: boolean; value?: unknown }

export type AppEnv = "production" | "preview" | "development";

export const ALL_OFF: Flags = Object.freeze(Object.fromEntries(FLAG_KEYS.map((k) => [k, false])) as Flags) as Flags;

/** Entorno actual. En Vercel: VERCEL_ENV (servidor) o NEXT_PUBLIC_VERCEL_ENV (navegador). */
export function appEnvOf(vercelEnv?: string | null, nodeEnv?: string | null): AppEnv {
  const v = (vercelEnv ?? "").trim().toLowerCase();
  if (v === "production" || v === "preview" || v === "development") return v;
  return (nodeEnv ?? "").trim().toLowerCase() === "production" ? "production" : "development";
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

export interface ResolveInput {
  global?: GlobalFlagRow[] | null;
  player?: unknown;              // ceo.players.flags (jsonb)
  aiConsent?: boolean;
  aiEnvEnabled?: boolean;        // CEO_AI_ENABLED === "1"
}

export function resolveFlags({ global, player, aiConsent = false, aiEnvEnabled = false }: ResolveInput): Flags {
  const out: Flags = { ...ALL_OFF };
  const p = isObj(player) ? player : {};
  for (const row of global ?? []) {
    if (!row || !(FLAG_KEYS as readonly string[]).includes(row.key)) continue;
    const k = row.key as FlagKey;
    const perPlayer = isObj(row.value) && row.value.perPlayer === true;
    const mine = p[k];
    if (row.enabled === true) out[k] = mine !== false;          // global prendido: el jugador puede salirse
    else if (perPlayer) out[k] = mine === true;                  // global "solo invitados": el jugador debe estar prendido
  }
  if (!aiEnvEnabled || !aiConsent) { out.ai = false; out.ai_shadow = out.ai_shadow && aiEnvEnabled; }
  return out;
}

/**
 * Herramientas de prueba (adelantar el reloj).
 *  - Preview y desarrollo: siempre visibles.
 *  - Producción: según NEXT_PUBLIC_CEO_TEST_TOOLS. Por defecto "visible" (como hoy),
 *    para no cambiar nada a los jugadores sin aprobación. "oculto" las esconde salvo
 *    que el jugador abra la app con ?prueba=1 (se recuerda en ese dispositivo).
 */
export function testToolsVisible(env: AppEnv, setting: string | undefined | null, unlocked: boolean): boolean {
  if (env !== "production") return true;
  const s = (setting ?? "").trim().toLowerCase();
  if (s === "oculto" || s === "hidden") return unlocked;
  return true;
}
