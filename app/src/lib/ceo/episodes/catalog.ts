/**
 * Catálogo de Executive Decision Episodes disponibles. Mientras el flag `episodes` esté apagado,
 * solo se abren desde las herramientas de prueba (vista previa); nada se publica a jugadores.
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

/** Abre (o reabre) un episodio en el estado del jugador. Si ya existe una partida abierta, no hace nada. */
export function openEpisode(s: CeoState, id: string, at: number, mode?: "estandar" | "flexible"): CeoState {
  const spec = EPISODES[id];
  if (!spec) return s;
  const cur = s.episodes?.[id];
  if (cur && cur.phase !== "closed") return s;
  if (cur) return s; // cerrado: el XP ya se registró; volver a jugarlo será práctica (fase posterior)
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
