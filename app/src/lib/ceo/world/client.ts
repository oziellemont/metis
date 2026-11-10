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
import { exposureOf } from "./exposure";
import { tradeMatch } from "./macro";
import type { Facts, Family, WorldCandidate, WorldEpisode } from "./types";

export type ExerciseKind = "ciclon" | "sismo" | "inundacion" | "tipo_cambio" | "tasa" | "arancel" | "arancel_eeuu";

/** Acontecimientos con episodio abierto que hay que seguir consultando (para cerrarlos con lo observado). */
export function trackedOf(s: CeoState): string[] {
  return (s.growth?.world ?? []).filter((e) => e.src === "gdacs" && e.status === "pronostico" && !e.end).map((e) => e.ev).slice(-5);
}

export function inputOf(c: WorldCandidate): WorldOpenInput | null {
  return cleanWorldInput({ src: c.src, ev: c.ev, rev: c.rev, family: c.family, kind: c.kind, mode: "real", name: c.name, status: c.status, severity: c.severity, source: c.source, ...(c.also ? { also: c.also } : {}), observedAt: c.observedAt, sites: c.sites, ...(c.facts ? { facts: c.facts } : {}) });
}

/** Jugadas a intentar con los candidatos de hoy (la partida rechaza lo que no proceda). */
export function worldActions(s: CeoState, candidates: readonly WorldCandidate[], at: number, off: readonly Family[] = []): GameAction[] {
  if (!s.growth || !isContinuous(s) || s.settings.worldEvents !== true) return [];
  const mute = new Set<Family>([...off, ...(s.settings.worldMute ?? [])]);
  const world: readonly WorldEpisode[] = s.growth.world ?? [];
  const out: GameAction[] = [];
  for (const c of candidates) {
    const ep = world.find((e) => e.src === c.src && e.ev === c.ev);
    if (ep) {
      if (c.ended && ep.status === "pronostico" && !ep.end) out.push({ type: "worldEnd", at, id: ep.id, sites: c.observed });
      else if (!c.ended && c.rev > ep.rev && !mute.has(c.family)) { const inp = inputOf(c); if (inp) out.push({ type: "world", at, ep: inp }); }
      continue;
    }
    // Clima y sismo: sede en zona naranja o roja (rev ≥ 2). Datos económicos y aranceles: movimiento material (rev ≥ 1).
    if (c.rev < (c.facts ? 1 : 2) || mute.has(c.family)) continue;
    const inp = inputOf(c);
    if (inp) out.push({ type: "world", at, ep: inp });
  }
  return out;
}

/** Ejercicio hipotético (solo herramientas de prueba): huracán guionado sobre las sedes de Monterrey en 3 días. */
export function exerciseInput(templateId: string, at: number, kind: ExerciseKind = "ciclon"): WorldOpenInput | null {
  if (kind === "tipo_cambio" || kind === "tasa" || kind === "arancel" || kind === "arancel_eeuu") return econExercise(templateId, at, kind);
  if (kind === "inundacion") {
    // Alerta de inundación confirmada (hipotética). En la miniacería integrada cae sobre la planta de Campeche.
    const z = exposureOf(templateId)?.sites.some((x) => x.id === "campeche") ? { campeche: "roja" } : templateId.startsWith("conveniencia") ? { mty: "roja", cedis: "naranja" } : { planta: "roja" };
    const where = "campeche" in z ? " en Campeche" : "";
    return cleanWorldInput({ src: "ejercicio", ev: `fl${Math.floor(at / 1000) % 1_000_000}`, rev: 3, family: "clima", kind: "inundacion", mode: "ejercicio", name: `Inundación de ejercicio${where}`, status: "pronostico", severity: "Lluvias intensas: desbordamiento esperado en 48 horas (hipotético)", source: { name: "Ejercicio de mêtis", url: "https://www.gdacs.org/" }, observedAt: at, sites: z, script: { inDays: 2, sites: z } });
  }
  const mty = templateId.startsWith("conveniencia") ? { mty: "roja", cedis: "naranja" } : templateId.includes("integrada") ? { planta: "roja", patio: "naranja" } : { planta: "roja" };
  if (kind === "sismo") return cleanWorldInput({ src: "ejercicio", ev: `eq${Math.floor(at / 1000) % 1_000_000}`, rev: 3, family: "sismo", kind: "sismo", mode: "ejercicio", name: "Sismo de ejercicio", status: "observado", severity: "Magnitud 6.4 (hipotética)", source: { name: "Ejercicio de mêtis", url: "https://www.gdacs.org/" }, observedAt: at, sites: mty, script: { inDays: 1, sites: mty } });
  return cleanWorldInput({ src: "ejercicio", ev: `tc${Math.floor(at / 1000) % 1_000_000}`, rev: 3, family: "clima", kind: "ciclon", mode: "ejercicio", name: "Huracán de ejercicio", status: "pronostico", severity: "Categoría 2 (hipotética)", source: { name: "Ejercicio de mêtis", url: "https://www.gdacs.org/" }, observedAt: at, sites: mty, script: { inDays: 3, sites: mty } });
}

/**
 * Ejercicio económico hipotético (solo herramientas de prueba). Datos inventados y etiquetados como tales:
 * el dólar sube 6 %, la TIIE baja ½ punto, o el arancel de lo que vende la empresa sube de 35 % a 50 %.
 * Si la empresa no tiene esa exposición (p. ej. tipo de cambio en las tiendas), no hay ejercicio.
 */
function econExercise(templateId: string, at: number, kind: "tipo_cambio" | "tasa" | "arancel" | "arancel_eeuu"): WorldOpenInput | null {
  const x = exposureOf(templateId);
  if (!x) return null;
  const until = new Date(at).toISOString().slice(0, 10), since = new Date(at - 28 * 86_400_000).toISOString().slice(0, 10);
  const id = Math.floor(at / 1000) % 1_000_000;
  const source = { name: "Ejercicio de mêtis", url: "https://www.dof.gob.mx/indicadores.php" };
  const common = { src: "ejercicio", rev: 2, mode: "ejercicio", status: "observado", observedAt: at, sites: {} };
  if (kind === "tipo_cambio") {
    const facts: Facts = { t: "fx", from: 18, to: 19.08, since, until };
    return cleanWorldInput({ ...common, ev: `fx${id}`, family: "macro", kind, name: "El dólar sube 6 % (ejercicio)", severity: "FIX 18.0000 → 19.0800 (hipotético)", source, facts });
  }
  if (kind === "tasa") {
    const facts: Facts = { t: "tasa", from: 7, to: 6.5, since, until };
    return cleanWorldInput({ ...common, ev: `ta${id}`, family: "macro", kind, name: "Baja la tasa de interés ½ punto (ejercicio)", severity: "TIIE de fondeo 7.00 % → 6.50 % (hipotética)", source, facts });
  }
  if (kind === "arancel_eeuu") {
    // EE. UU. sube de 50 % a 60 % el arancel al acero (hipotético). Solo llega si la partida exporta hoy.
    const k = x.profile.exportContracts;
    if (!k || k.destination !== "EE. UU.") return null;
    const facts: Facts = { t: "arancel", from: 0.5, to: 0.6, since: until, until, effective: until, rule: "us_232_acero", hs: k.hs };
    return cleanWorldInput({ ...common, ev: `us${id}`, family: "comercio", kind: "arancel", name: "EE. UU. sube el arancel al acero (ejercicio)", severity: "Arancel de EE. UU. 50 % → 60 % (hipotético)", source: { ...source, url: "https://www.federalregister.gov/" }, facts });
  }
  const hs = x.products?.find((p) => p.market === "México")?.hs;
  const m = hs ? tradeMatch(templateId, hs) : null;
  if (!hs || !m) return null;
  const facts: Facts = { t: "arancel", from: 0.35, to: 0.5, since: until, until, effective: until, rule: m.rule, hs };
  return cleanWorldInput({ ...common, ev: `ar${id}`, family: "comercio", kind, name: `Sube el arancel de importación (ejercicio)`, severity: "Arancel 35 % → 50 % (hipotético)", source: { ...source, url: "https://www.dof.gob.mx/" }, facts });
}
