/**
 * Utilidades de la evaluación (P0-D): llevar una partida a cualquier nodo y medir resultados.
 * Puro, sin red. Lo usan la evaluación gratuita del respaldo y la evaluación con IA (con permiso de gasto).
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { applyEpisode, startEpisode, strategiesFor } from "./engine";
import type { EvalItem } from "./eval-set";

/** Una partida parada en `node` (fase de decisión), alcanzada por la primera ruta válida que pasa por ahí. */
const cache = new Map<string, EpisodeRun | null>();
/** Si se pide `need`, la partida debe tener esa estrategia disponible (algunas dependen de la ruta). */
export function runAt(spec: EpisodeSpec, node: string, need?: string | string[]): EpisodeRun | null {
  const k = `${spec.id}@${spec.version}/${node}/${[need ?? ""].flat().join("+")}`;
  if (!cache.has(k)) cache.set(k, findRunAt(spec, node, need));
  return cache.get(k)!;
}
/** Búsqueda a lo ancho (la ruta más corta) con términos por defecto; prueba sin azar/memoria y luego con cada bandera. */
function findRunAt(spec: EpisodeSpec, node: string, need0?: string | string[]): EpisodeRun | null {
  const need = need0 === undefined ? [] : [need0].flat();
  const extra = [[], ...(spec.chance ?? []).map((c) => [c.flag]), ...(spec.history ?? []).map((h) => [h.flag])];
  for (const flags of extra) {
    let r0 = { ...startEpisode(spec, 0, { runId: "eval" }), flags: [...flags] };
    r0 = applyEpisode(spec, r0, { type: "begin", at: 1 }).run;
    const queue: EpisodeRun[] = [r0];
    const seen = new Set<string>();
    while (queue.length) {
      const r = queue.shift()!;
      if (r.node === node && r.phase === "deciding" && need.every((n) => strategiesFor(spec, r).some((x) => x.id === n))) return r;
      if (r.phase !== "deciding" || r.turns.length > 8) continue;
      const key = `${r.node}|${[...r.flags].sort().join(",")}|${r.trust}`;
      if (seen.has(key)) continue;
      seen.add(key);
      for (const st of strategiesFor(spec, r)) {
        const out = applyEpisode(spec, r, { type: "decide", strategy: st.id, at: 2 + r.turns.length });
        if (!out.error) queue.push(out.run);
      }
    }
  }
  return null;
}

export interface EvalScore { total: number; hit: number; chose: number; byNode: Record<string, { total: number; hit: number }> }

/** Mide acierto: `hit` = eligió la esperada; `chose` = eligió algo (no se quedó sin respuesta). */
export function score(items: EvalItem[], pick: (it: EvalItem) => string | null): EvalScore {
  const s: EvalScore = { total: 0, hit: 0, chose: 0, byNode: {} };
  for (const it of items) {
    const k = `${it.ep}/${it.node}`;
    const n = (s.byNode[k] ??= { total: 0, hit: 0 });
    const got = pick(it);
    s.total++; n.total++;
    if (got) s.chose++;
    if (got === it.expect) { s.hit++; n.hit++; }
  }
  return s;
}

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
