/**
 * mêtis CEO · paso de las partidas existentes a la economía real (reglas v10).
 *
 * Qué hace, una sola vez por partida, al cargarla (`migrate()` en engine.ts):
 *  - Solo a la carrera continua con un periodo en curso jugado con reglas v6 a v9 (las anteriores a v10 con veredicto).
 *  - Guarda un respaldo completo de la partida tal como estaba (`econMigration.backup`).
 *  - Cambia la versión de reglas del periodo en curso a v10. Nada más: las decisiones, su hora, los acuerdos, las
 *    lecciones, la racha, el XP ganado, los meses cerrados, el elenco y las relaciones quedan idénticos. Los
 *    indicadores del periodo se vuelven a calcular con v10 a partir de esas mismas decisiones. Los pendientes salen
 *    de las decisiones, así que no se duplican.
 *  - Los meses ya cerrados conservan sus indicadores y su veredicto: se evaluaron con sus reglas y no se recalifican.
 *  - Deja la marca: no se vuelve a aplicar, ni en otro dispositivo, ni en el servidor.
 *
 * Reversión (dos niveles):
 *  - `revertV10(s)`: el periodo vuelve a su versión anterior conservando lo que decidiste después del cambio.
 *    Se aplica sola a todas las partidas si `ECON_ROLLBACK` es true (un cambio de una línea y publicar).
 *  - `restoreBackupV10(s)`: devuelve la partida exactamente al respaldo (pierde lo jugado después del cambio).
 *
 * Funciones puras.
 */
import type { CeoState } from "./types";
import { ECONOMY_RULES_VERSION } from "./rules";

/** Interruptor de reversión: true regresa los periodos pasados a v10 a su versión anterior al cargar la partida. */
export const ECON_ROLLBACK = false;
/** Versiones que se pasan: las de veredicto V5 de la carrera continua anteriores a la economía real. */
const FROM_MIN = 6;

/** ¿Esta partida tiene un periodo en curso que debe pasar a v10? */
export function needsEconMigration(s: CeoState): boolean {
  if (s.econMigration) return false;
  if (s.careerMode !== "continua" || !s.companyProfile || !s.startedAt) return false;
  const v = s.rulesVersion ?? 1;
  return v >= FROM_MIN && v < ECONOMY_RULES_VERSION;
}

/** Paso a v10 con respaldo completo (idempotente: una partida con marca no cambia). */
export function applyEconMigration(s: CeoState, now = Date.now()): CeoState {
  if (!needsEconMigration(s)) return s;
  const { econMigration: _old, ...plain } = s;
  return {
    ...s,
    rulesVersion: ECONOMY_RULES_VERSION,
    econMigration: { at: now, from: s.rulesVersion ?? 1, startedAt: s.startedAt!, backup: JSON.stringify(plain) },
  };
}

/** Revierte el periodo pasado a v10 a su versión anterior, conservando lo jugado después. Sin efecto si ya cerró. */
export function revertV10(s: CeoState, now = Date.now()): CeoState {
  const m = s.econMigration;
  if (!m || m.reverted || s.startedAt !== m.startedAt || s.rulesVersion !== ECONOMY_RULES_VERSION) return s;
  return { ...s, rulesVersion: m.from, econMigration: { ...m, reverted: now } };
}

/** Devuelve la partida exactamente al respaldo (con la marca de revertida, para que no se vuelva a pasar). */
export function restoreBackupV10(s: CeoState, now = Date.now()): CeoState | null {
  const m = s.econMigration;
  if (!m?.backup) return null;
  try {
    const b = JSON.parse(m.backup) as CeoState;
    return { ...b, econMigration: { ...m, reverted: now } };
  } catch { return null; }
}

/** Limpia el registro que viene de fuera (navegador, nube, importación). */
export function sanitizeEconMigration(x: unknown): CeoState["econMigration"] | undefined {
  if (!x || typeof x !== "object" || Array.isArray(x)) return undefined;
  const r = x as Record<string, unknown>;
  const n = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  if (!n(r.at) || !n(r.from) || !n(r.startedAt)) return undefined;
  return {
    at: r.at as number, from: r.from as number, startedAt: r.startedAt as number,
    ...(typeof r.backup === "string" && r.backup.length <= 2_000_000 ? { backup: r.backup } : {}),
    ...(n(r.reverted) ? { reverted: r.reverted as number } : {}),
  };
}
