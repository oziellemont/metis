/**
 * mêtis CEO · reproductor de acciones.
 *
 * Una partida es una lista ordenada de acciones con su hora. Aplicarlas en orden sobre `newState()`
 * reconstruye exactamente el mismo estado que vio el jugador. Esto sirve para:
 *  - las «partidas doradas» (pruebas que garantizan que ningún cambio altera resultados), y
 *  - más adelante, que el servidor valide las decisiones que llegan del navegador (F0-9).
 *
 * Reglas versionadas (0.4): `start` y `advance` pueden decir con qué versión de reglas empieza la
 * temporada. Si no lo dicen, es una partida legacy y se reproduce con las reglas v1, aunque la app
 * ya use otra versión para las temporadas nuevas.
 *
 * Cada acción replica, una a una, lo que hacen las acciones de `CeoProvider`.
 */
import type { CeoState, CastId, LeverId, Settings, Written } from "./types";
import { H, LEGACY_RULES_VERSION, advance, aliasOf, answerDilemma, decide, kpis, newState, openSeasonEpisode, pinArrived, switchCompany } from "./engine";
import { closeChange, playLever, startChange } from "./relations";
import { crisisAccess, playCrisis, recordCrisis } from "./crisis";
import { appoint, recordBoard } from "./journey";
import { OFFERED_TIER } from "./profile";
import { pauseCareer, resumeCareer, startQuietDay } from "./cadence";
import { onVacation } from "./pausetime";
import { actEpisode } from "./episodes/catalog";
import type { EpisodeAction } from "./episodes/engine";

export type GameAction =
  | { type: "start"; at: number; name: string; company: string; settings?: Partial<Settings>; rulesVersion?: number; tier?: number; journey?: boolean }
  | { type: "decide"; at: number; item: string; option: string; written?: Written }
  | { type: "dilemma"; at: number; id: string; option: number }
  | { type: "lesson"; at: number; id: string }
  | { type: "settings"; at: number; patch: Partial<Settings>; name?: string; alias?: string }
  | { type: "changeStart"; at: number }
  | { type: "lever"; at: number; lever: LeverId; targets: CastId[] }
  | { type: "changeClose"; at: number }
  | { type: "advance"; at: number; rulesVersion?: number }
  | { type: "switch"; at: number; company: string }
  /** Boardroom Crisis: `from` = cuándo empezó la sesión (de ahí sale el tablero). El resultado lo calcula el motor. */
  | { type: "crisis"; at: number; from: number; picks: Record<string, string>; rating?: string }
  | { type: "appoint"; at: number }
  /** Junta ante el Consejo (resultado declarado por el dispositivo). */
  | { type: "board"; at: number; passed: boolean }
  /** Ritmo (1.2): vacaciones con fecha prevista de regreso (o null), reanudar, día tranquilo hasta `until`. */
  | { type: "pause"; at: number; until: number | null }
  | { type: "resume"; at: number }
  | { type: "quiet"; at: number; until: number }
  /** Executive Decision Episodes (adenda v3.3): abrir un episodio y cada paso dentro de él. */
  | { type: "episodeOpen"; at: number; id: string; mode?: "estandar" | "flexible" }
  | { type: "episode"; at: number; id: string; act: EpisodeAction };

/** Lo único que se puede hacer de vacaciones: reanudar o cambiar ajustes. El resto se rechaza. */
const ALLOWED_ON_VACATION = new Set<GameAction["type"]>(["resume", "pause", "settings"]);
/** ¿Esta acción queda bloqueada porque el jugador está de vacaciones? */
export const blockedOnVacation = (s: CeoState, a: GameAction) => onVacation(s, a.at) && !ALLOWED_ON_VACATION.has(a.type);

/**
 * Aplica una acción. Devuelve el mismo objeto si la acción no procede (igual que el motor),
 * así quien reproduce puede saber si una acción fue ilegal (`applied === false`).
 */
export function applyAction(s: CeoState, a: GameAction): { state: CeoState; applied: boolean } {
  let n: CeoState = s;
  if (blockedOnVacation(s, a)) return { state: s, applied: false };
  switch (a.type) {
    case "start": {
      const base = newState();
      n = { ...base, rulesVersion: a.rulesVersion ?? LEGACY_RULES_VERSION, company: a.company || base.company, name: a.name.trim(), alias: aliasOf(a.name), startedAt: a.at, lastActiveAt: a.at, savedAt: a.at, settings: { ...s.settings, ...a.settings } };
      if (typeof a.tier === "number") { const t = Math.max(0, Math.min(OFFERED_TIER, Math.round(a.tier))); n = { ...n, tier: t, startTier: t }; }
      if (a.journey) n = { ...n, journey: { stage: 0, enrolledAt: a.at, appointments: [] } };
      break;
    }
    case "decide": n = decide(s, a.item, a.option, a.at, a.written); break;
    case "dilemma": n = answerDilemma(s, a.id, a.option, a.at); break;
    case "lesson": n = s.lessons[a.id] ? s : { ...s, lessons: { ...s.lessons, [a.id]: a.at }, lastActiveAt: a.at }; break;
    case "settings": { const q = pinArrived(s, a.at); n = { ...q, name: a.name ?? q.name, alias: a.alias ?? q.alias, settings: { ...q.settings, ...a.patch } }; break; }
    case "changeStart": n = startChange(s, a.at); break;
    case "lever": n = playLever(s, a.lever, a.targets, a.at); break;
    case "changeClose": n = closeChange(s, a.at); break;
    case "advance": n = advance(s, a.at, a.rulesVersion ?? LEGACY_RULES_VERSION); break;
    case "switch": n = switchCompany(s, a.company, a.at); break;
    case "crisis": {
      if (!(a.from <= a.at && a.at - a.from <= 2 * H) || !a.picks || typeof a.picks !== "object") break;
      if (!crisisAccess(s, a.from).open) break;
      const r = playCrisis(kpis(s, a.from), s.tier, a.picks);
      if (r.complete) n = recordCrisis(s, { rating: r.rating, picks: a.picks }, a.at);
      break;
    }
    case "appoint": n = appoint(s, a.at); break;
    case "board": n = recordBoard(s, a.passed === true, a.at); break;
    case "pause": n = pauseCareer(s, a.at, a.until ?? null); break;
    case "resume": n = resumeCareer(s, a.at); break;
    case "quiet": n = startQuietDay(s, a.at, a.until); break;
    case "episodeOpen": n = openSeasonEpisode(s, a.id, a.at, a.mode); break;
    case "episode": n = a.act && a.act.at === a.at ? actEpisode(s, a.id, a.act).state : s; break;
  }
  if (n === s) return { state: s, applied: false };
  return { state: { ...n, savedAt: a.at }, applied: true };
}

/** Reproduce una partida completa. `rejected` lista los índices de acciones que el motor no aceptó. */
export function replay(actions: GameAction[], from: CeoState = newState()): { state: CeoState; rejected: number[] } {
  let s = from;
  const rejected: number[] = [];
  actions.forEach((a, i) => {
    const r = applyAction(s, a);
    if (!r.applied) rejected.push(i);
    s = r.state;
  });
  return { state: s, rejected };
}
