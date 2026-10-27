/**
 * mêtis CEO · reproductor de acciones.
 *
 * Una partida es una lista ordenada de acciones con su hora. Aplicarlas en orden sobre `newState()`
 * reconstruye exactamente el mismo estado que vio el jugador. Esto sirve para:
 *  - las «partidas doradas» (pruebas que garantizan que ningún cambio altera resultados), y
 *  - más adelante, que el servidor valide las decisiones que llegan del navegador (F0-9).
 *
 * Cada acción replica, una a una, lo que hacen las acciones de `CeoProvider`.
 */
import type { CeoState, CastId, LeverId, Settings } from "./types";
import { advance, aliasOf, answerDilemma, decide, newState, pinArrived, switchCompany } from "./engine";
import { closeChange, playLever, startChange } from "./relations";

export type GameAction =
  | { type: "start"; at: number; name: string; company: string; settings?: Partial<Settings> }
  | { type: "decide"; at: number; item: string; option: string }
  | { type: "dilemma"; at: number; id: string; option: number }
  | { type: "lesson"; at: number; id: string }
  | { type: "settings"; at: number; patch: Partial<Settings> }
  | { type: "changeStart"; at: number }
  | { type: "lever"; at: number; lever: LeverId; targets: CastId[] }
  | { type: "changeClose"; at: number }
  | { type: "advance"; at: number }
  | { type: "switch"; at: number; company: string };

/**
 * Aplica una acción. Devuelve el mismo objeto si la acción no procede (igual que el motor),
 * así quien reproduce puede saber si una acción fue ilegal (`applied === false`).
 */
export function applyAction(s: CeoState, a: GameAction): { state: CeoState; applied: boolean } {
  let n: CeoState = s;
  switch (a.type) {
    case "start": {
      const base = newState();
      n = { ...base, company: a.company || base.company, name: a.name.trim(), alias: aliasOf(a.name), startedAt: a.at, lastActiveAt: a.at, savedAt: a.at, settings: { ...s.settings, ...a.settings } };
      break;
    }
    case "decide": n = decide(s, a.item, a.option, a.at); break;
    case "dilemma": n = answerDilemma(s, a.id, a.option, a.at); break;
    case "lesson": n = s.lessons[a.id] ? s : { ...s, lessons: { ...s.lessons, [a.id]: a.at }, lastActiveAt: a.at }; break;
    case "settings": { const q = pinArrived(s, a.at); n = { ...q, settings: { ...q.settings, ...a.patch } }; break; }
    case "changeStart": n = startChange(s, a.at); break;
    case "lever": n = playLever(s, a.lever, a.targets, a.at); break;
    case "changeClose": n = closeChange(s, a.at); break;
    case "advance": n = advance(s, a.at); break;
    case "switch": n = switchCompany(s, a.company, a.at); break;
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
