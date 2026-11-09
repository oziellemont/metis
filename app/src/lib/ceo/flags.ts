/**
 * mêtis CEO · interruptores (feature flags) y entorno.
 *
 * Reglas:
 *  - Todo lo nuevo arranca APAGADO (salvo DEFAULT_ON, ya autorizado). Si la base no responde, todo queda apagado.
 *  - Un interruptor de jugador (ceo.players.flags) solo puede APAGAR algo global
 *    o prenderlo si el global lo permite en modo "por jugador" (value.perPlayer).
 *  - La IA, además, exige consentimiento del jugador y la llave de entorno
 *    CEO_AI_ENABLED=1 (doble candado: base + Vercel).
 *  - Esta función es pura: no lee red ni reloj, para poder probarla.
 */

export const FLAG_KEYS = ["ai", "ai_shadow", "events", "game_journal", "replay_shadow", "episodes", "carrera_continua", "growth_engine", "world_events"] as const;
export type FlagKey = (typeof FLAG_KEYS)[number];
export type Flags = Record<FlagKey, boolean>;

export interface GlobalFlagRow { key: string; enabled: boolean; value?: unknown }

export type AppEnv = "production" | "preview" | "development";

/**
 * Interruptores que nacen PRENDIDOS cuando la base responde pero aún no tiene su fila (lanzamiento autorizado).
 * Interruptor de emergencia: una fila con enabled = false los apaga en ≤ 60 s (ver docs/sql/growth_respaldo_y_apagado.sql);
 * quitar la llave de esta lista los apaga con el siguiente despliegue. Si la base no responde, siguen apagados.
 */
export const DEFAULT_ON: readonly FlagKey[] = ["growth_engine"];

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
  // Prendidos por omisión: solo si la base respondió (global no nulo) y no trae fila para ellos.
  if (global) for (const k of DEFAULT_ON) if (!global.some((r) => r?.key === k)) out[k] = p[k] !== false;
  if (!aiEnvEnabled || !aiConsent) { out.ai = false; out.ai_shadow = out.ai_shadow && aiEnvEnabled; }
  return out;
}

/**
 * Herramientas de prueba (adelantar el reloj, abrir episodios, reiniciar).
 *  - Preview y desarrollo: siempre visibles.
 *  - Producción: OCULTAS por defecto (rompen la ficción y el ritmo). Se ven solo si:
 *      · la cuenta es del equipo mêtis (metis.platform_admins), o
 *      · NEXT_PUBLIC_CEO_TEST_TOOLS = "visible" (interruptor global para volver a mostrarlas).
 *    ?prueba=1 ya no basta por sí solo en producción: cualquiera podía activarlo.
 */
export function testToolsVisible(env: AppEnv, setting: string | undefined | null, staff: boolean): boolean {
  if (env !== "production") return true;
  const s = (setting ?? "").trim().toLowerCase();
  if (s === "visible") return true;
  return staff;
}

/**
 * Empresa emergente (Growth Engine). En producción, con el interruptor growth_engine (prendido salvo fila enabled = false).
 * En Preview y desarrollo se ve siempre, para revisarla antes de activarla.
 */
export const growthVisible = (env: AppEnv, flag: boolean): boolean => flag === true || env !== "production";

/**
 * World Events (acontecimientos reales). APAGADO por omisión en producción: se prende con la fila «world_events» de
 * ceo.flags (enabled = true para todos, o value.perPlayer = true para invitados con ceo.players.flags.world_events).
 * Además, cada jugador decide en Ajustes («Acontecimientos reales en mi carrera»). En Preview y desarrollo se ve siempre.
 */
export const worldVisible = (env: AppEnv, flag: boolean): boolean => flag === true || env !== "production";
/**
 * Apagado rápido por familia: value.off de la fila «world_events» (p. ej. {"off": ["clima"]}). Se aplica en ≤ 60 s.
 * Familias desconocidas se ignoran.
 */
export function worldFamiliesOff(global: GlobalFlagRow[] | null | undefined): ("clima" | "sismo" | "macro")[] {
  const row = (global ?? []).find((r) => r?.key === "world_events");
  const off = isObj(row?.value) && Array.isArray(row!.value.off) ? row!.value.off : [];
  return [...new Set(off.filter((f): f is "clima" | "sismo" | "macro" => f === "clima" || f === "sismo" || f === "macro"))];
}
