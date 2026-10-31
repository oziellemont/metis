/**
 * Catálogo de Executive Decision Episodes y su calendario en la temporada.
 * Con reglas v3+ los casos aprobados llegan a la temporada de su empresa (SEASON_EPISODES) y cuentan para
 * indicadores y XP. Con reglas anteriores solo se abren desde las herramientas de prueba (práctica).
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { applyEpisode, startEpisode, type EpisodeAction } from "./engine";
import { SUPERNORTE } from "./supernorte";
import { DIEGO } from "./diego";
import { ALERGENO } from "./alergeno";
import type { CeoState } from "../types";

export const EPISODES: Record<string, EpisodeSpec> = {
  [SUPERNORTE.id]: SUPERNORTE,
  [DIEGO.id]: DIEGO,
  [ALERGENO.id]: ALERGENO,
};
export const episodeSpec = (id: string): EpisodeSpec | undefined => EPISODES[id];

/** Cuándo llega un caso ejecutivo en la temporada de su empresa. `replaces`: asunto de una decisión que sustituye. */
export interface SeasonEpisode { episode: string; day: number; slot: number; replaces?: string }
export const SEASON_EPISODES: Record<string, SeasonEpisode[]> = {
  cumbre: [
    { episode: SUPERNORTE.id, day: 2, slot: 1, replaces: "d2-supernorte" },
    { episode: DIEGO.id, day: 4, slot: 2 },
    { episode: ALERGENO.id, day: 6, slot: 2 },
  ],
};

/** Abre (o reabre) un episodio en el estado del jugador. Si ya existe una partida abierta, no hace nada. */
export function openEpisode(s: CeoState, id: string, at: number, mode?: "estandar" | "flexible"): CeoState {
  const spec = EPISODES[id];
  if (!spec) return s;
  const cur = s.episodes?.[id];
  // Ya abierto o cerrado en esta temporada: no se reabre (el resultado ya cuenta). Uno de una temporada
  // anterior no bloquea: la temporada nueva empieza el caso desde cero.
  if (cur && cur.startedAt >= (s.startedAt ?? 0)) return s;
  const run = startEpisode(spec, at, { decisions: s.decisions, mode });
  return { ...s, episodes: { ...(s.episodes ?? {}), [id]: run }, lastActiveAt: at };
}

/** Modo prueba: reemplaza la partida por una nueva (otra semilla, otro inicio). Al sincronizar gana la nueva. */
export function restartEpisode(s: CeoState, id: string, at: number): CeoState {
  const spec = EPISODES[id];
  if (!spec || !s.episodes?.[id]) return s;
  const run = startEpisode(spec, at, { decisions: s.decisions, runId: `${id}:${at}` });
  return { ...s, episodes: { ...s.episodes, [id]: run } };
}

/** Aplica una acción dentro de un episodio. Devuelve el mismo estado si no procede, más el mensaje. */
export function actEpisode(s: CeoState, id: string, a: EpisodeAction): { state: CeoState; error?: string } {
  const spec = EPISODES[id];
  const run = s.episodes?.[id];
  if (!spec || !run) return { state: s, error: "Este caso no está abierto." };
  const r = applyEpisode(spec, run, a);
  if (r.error) return { state: s, error: r.error };
  return { state: { ...s, episodes: { ...(s.episodes ?? {}), [id]: r.run }, lastActiveAt: a.at } };
}
