/**
 * mêtis CEO · validación editorial de un episodio (puro).
 *
 * Recorre TODAS las rutas posibles (cada estrategia; cada parámetro en su mínimo, valor por defecto y máximo;
 * cada combinación de memoria previa y de factores fuera de control) y revisa que el grafo cumpla la adenda:
 * 3 a 6 decisiones en cualquier ruta, nodos y hechos que existen, sin ciclos y con un cierre siempre alcanzable.
 */
import { MAX_DECISIONS, MIN_DECISIONS, type EpisodeRun, type EpisodeSpec } from "./contracts";
import { applyEpisode, startEpisode, strategiesFor, type EpisodeAction } from "./engine";

export interface PathEnd { length: number; run: EpisodeRun; actions: EpisodeAction[] }

/** Combinaciones de banderas iniciales (historia de la temporada × azar). */
function startFlagSets(spec: EpisodeSpec): string[][] {
  const opt = [...(spec.history ?? []).map((h) => h.flag), ...(spec.chance ?? []).map((c) => c.flag)];
  const out: string[][] = [];
  for (let m = 0; m < 1 << opt.length; m++) out.push(opt.filter((_, i) => m & (1 << i)));
  return out;
}

/** Todas las rutas completas: longitud y partida cerrada. Corta si una ruta pasa de 12 decisiones (ciclo). */
export function allEnds(spec: EpisodeSpec, limit = 20000, used?: Set<string>): PathEnd[] {
  const ends: PathEnd[] = [];
  for (const fs of startFlagSets(spec)) {
    const base = startEpisode(spec, 0, { runId: "validar" });
    const r0 = applyEpisode(spec, { ...base, flags: [...new Set([...base.flags.filter((f) => !(spec.chance ?? []).some((c) => c.flag === f)), ...fs])] }, { type: "begin", at: 1 }).run;
    const stack: { run: EpisodeRun; actions: EpisodeAction[] }[] = [{ run: r0, actions: [{ type: "begin", at: 1 }] }];
    const seen = new Set<string>();
    while (stack.length && ends.length < limit) {
      const { run, actions } = stack.pop()!;
      // Dos rutas que llegan al mismo estado (nodo, banderas, términos, confianza y nº de decisiones) se comportan igual
      // desde ahí: basta explorar una. Las rutas cerradas sí se guardan todas porque su desenlace puede diferir.
      if (run.phase !== "closed") {
        const key = `${run.node}|${[...run.flags].sort().join(",")}|${JSON.stringify(Object.entries(run.terms).sort())}|${run.trust}|${run.turns.length}`;
        if (seen.has(key)) continue;
        seen.add(key);
      }
      if (run.phase === "closed") {
        // Un cierre por secuencia de decisiones + banderas basta para validar longitudes y desenlaces.
        const k = `END|${run.turns.map((t) => `${t.node}:${t.strategy}`).join(">")}|${[...run.flags].sort().join(",")}`;
        if (seen.has(k)) continue;
        seen.add(k);
        ends.push({ length: run.turns.length, run, actions }); continue; }
      if (run.turns.length > 12) { ends.push({ length: run.turns.length, run, actions }); continue; }
      for (const st of strategiesFor(spec, run)) {
        const combos: Record<string, number>[] = [{}];
        for (const p of st.params ?? []) {
          const vals = [...new Set([p.min, p.default, p.max])];
          const next: Record<string, number>[] = [];
          for (const c of combos) for (const v of vals) next.push({ ...c, [p.key]: v });
          combos.splice(0, combos.length, ...next);
        }
        for (const params of combos) {
          const a: EpisodeAction = { type: "decide", at: 2 + run.turns.length, strategy: st.id, ...(st.params?.length ? { params } : {}) };
          const r = applyEpisode(spec, run, a);
          if (!r.error) used?.add(`${run.node}.${st.id}`);
          if (!r.error) stack.push({ run: r.run, actions: [...actions, a] });
        }
      }
    }
  }
  return ends;
}
export const allPaths = (spec: EpisodeSpec) => allEnds(spec).map((e) => e.run.turns.map((t) => `${t.node}:${t.strategy}`));

/** Problemas editoriales del episodio (lista vacía = válido). */
export function lintEpisode(spec: EpisodeSpec): string[] {
  const bad: string[] = [];
  const ids = new Set(Object.keys(spec.nodes));
  const factIds = new Set(spec.facts.facts.map((f) => f.id));
  if (!ids.has(spec.start)) bad.push(`inicio inexistente: ${spec.start}`);
  for (const n of Object.values(spec.nodes)) {
    if (!n.strategies.length) bad.push(`${n.id}: sin estrategias`);
    if (n.strategies.length < 2 && !n.strategies[0]?.params?.length) bad.push(`${n.id}: una sola estrategia no es una decisión`);
    for (const s of n.strategies) {
      for (const b of s.next) if (b.to !== "close" && !ids.has(b.to)) bad.push(`${n.id}.${s.id}: rama a nodo inexistente ${b.to}`);
      if (!s.next.some((b) => !b.when)) bad.push(`${n.id}.${s.id}: falta una rama por defecto`);
      if (!s.reply.some((v) => !v.when)) bad.push(`${n.id}.${s.id}: falta una respuesta por defecto`);
      for (const p of s.params ?? []) if (!(p.min <= p.default && p.default <= p.max) || p.step <= 0) bad.push(`${n.id}.${s.id}: parámetro ${p.key} mal acotado`);
      for (const p of s.params ?? []) if (!spec.terms[p.key]) bad.push(`${n.id}.${s.id}: término desconocido ${p.key}`);
    }
    if (!n.say.some((v) => !v.when)) bad.push(`${n.id}: falta un mensaje por defecto`);
  }
  for (const a of spec.advisors) {
    for (const k of a.knows) if (!factIds.has(k)) bad.push(`colaborador ${a.id}: conoce un hecho inexistente ${k}`);
    if (!a.view.some((v) => !v.when)) bad.push(`colaborador ${a.id}: falta una opinión por defecto`);
  }
  const used = new Set<string>();
  const ends = allEnds(spec, 20000, used);
  if (ends.length >= 20000) bad.push("demasiadas rutas para validar (simplifica el grafo)");
  const lens = ends.map((e) => e.length);
  if (!ends.length) bad.push("ninguna ruta llega al cierre");
  if (lens.some((l) => l < MIN_DECISIONS)) bad.push(`hay rutas con menos de ${MIN_DECISIONS} decisiones`);
  if (lens.some((l) => l > MAX_DECISIONS)) bad.push(`hay rutas con más de ${MAX_DECISIONS} decisiones`);
  if (ends.some((e) => e.run.phase !== "closed")) bad.push("hay rutas que no cierran (ciclo)");
  for (const n of Object.values(spec.nodes)) {
    if (!n.strategies.some((s) => used.has(`${n.id}.${s.id}`))) bad.push(`${n.id}: nodo inalcanzable`);
    for (const s of n.strategies) if (!used.has(`${n.id}.${s.id}`)) bad.push(`${n.id}.${s.id}: estrategia que nunca se puede elegir`);
  }
  return bad;
}
