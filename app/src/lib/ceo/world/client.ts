/**
 * World Events · del candidato del servidor a la jugada del diario (puro, sin red).
 *
 *  - Candidato nuevo con sedes en zona naranja o roja → jugada «world» (abrir). La partida decide si procede
 *    (preferencia del jugador, familia silenciada, uno sin resolver a la vez, deduplicación por revisión).
 *  - Mismo acontecimiento con revisión mayor y aún sin decidir → jugada «world» (actualizar).
 *  - Pronóstico seguido que la fuente ya da por terminado → jugada «worldEnd» con lo observado.
 */
import type { GameAction } from "../replay";
import type { CeoState } from "../types";
import { isContinuous } from "../engine";
import { cleanWorldInput, type WorldOpenInput } from "./episodes";
import type { Family, WorldCandidate, WorldEpisode } from "./types";

/** Acontecimientos con episodio abierto que hay que seguir consultando (para cerrarlos con lo observado). */
export function trackedOf(s: CeoState): string[] {
  return (s.growth?.world ?? []).filter((e) => e.src === "gdacs" && e.status === "pronostico" && !e.end).map((e) => e.ev).slice(-5);
}

export function inputOf(c: WorldCandidate): WorldOpenInput | null {
  return cleanWorldInput({ src: "gdacs", ev: c.ev, rev: c.rev, family: c.family, kind: c.kind, mode: "real", name: c.name, status: c.status, severity: c.severity, source: c.source, ...(c.also ? { also: c.also } : {}), observedAt: c.observedAt, sites: c.sites });
}

/** Jugadas a intentar con los candidatos de hoy (la partida rechaza lo que no proceda). */
export function worldActions(s: CeoState, candidates: readonly WorldCandidate[], at: number, off: readonly Family[] = []): GameAction[] {
  if (!s.growth || !isContinuous(s) || s.settings.worldEvents !== true) return [];
  const mute = new Set<Family>([...off, ...(s.settings.worldMute ?? [])]);
  const world: readonly WorldEpisode[] = s.growth.world ?? [];
  const out: GameAction[] = [];
  for (const c of candidates) {
    const ep = world.find((e) => e.src === "gdacs" && e.ev === c.ev);
    if (ep) {
      if (c.ended && ep.status === "pronostico" && !ep.end) out.push({ type: "worldEnd", at, id: ep.id, sites: c.observed });
      else if (!c.ended && c.rev > ep.rev && !mute.has(c.family)) { const inp = inputOf(c); if (inp) out.push({ type: "world", at, ep: inp }); }
      continue;
    }
    if (c.rev < 2 || mute.has(c.family)) continue;
    const inp = inputOf(c);
    if (inp) out.push({ type: "world", at, ep: inp });
  }
  return out;
}

/** Ejercicio hipotético (solo herramientas de prueba): huracán guionado sobre las sedes de Monterrey en 3 días. */
export function exerciseInput(templateId: string, at: number, kind: "ciclon" | "sismo" = "ciclon"): WorldOpenInput | null {
  const mty = templateId.startsWith("conveniencia") ? { mty: "roja", cedis: "naranja" } : templateId.includes("integrada") ? { planta: "roja", patio: "naranja" } : { planta: "roja" };
  if (kind === "sismo") return cleanWorldInput({ src: "ejercicio", ev: `eq${Math.floor(at / 1000) % 1_000_000}`, rev: 3, family: "sismo", kind: "sismo", mode: "ejercicio", name: "Sismo de ejercicio", status: "observado", severity: "Magnitud 6.4 (hipotética)", source: { name: "Ejercicio de mêtis", url: "https://www.gdacs.org/" }, observedAt: at, sites: mty, script: { inDays: 1, sites: mty } });
  return cleanWorldInput({ src: "ejercicio", ev: `tc${Math.floor(at / 1000) % 1_000_000}`, rev: 3, family: "clima", kind: "ciclon", mode: "ejercicio", name: "Huracán de ejercicio", status: "pronostico", severity: "Categoría 2 (hipotética)", source: { name: "Ejercicio de mêtis", url: "https://www.gdacs.org/" }, observedAt: at, sites: mty, script: { inDays: 3, sites: mty } });
}
