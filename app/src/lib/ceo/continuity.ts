/**
 * mêtis CEO · Continuidad de la empresa: «lo que viene de antes» en cada asunto.
 *
 * Función PURA y de solo lectura. Recuerda decisiones anteriores SIN inventar consecuencias: cada frase sale de
 * datos que ya existen en la partida y que el motor ya aplicó:
 *  - el detonador (si este asunto llegó por lo que elegiste antes) y el resultado que ese camino ya tenía escrito;
 *  - lo que tus decisiones anteriores le hicieron a las personas de este asunto (postura −2…+2 de la opción que
 *    elegiste, o haber dejado vencer su asunto) y cómo está hoy esa relación (mapa de relaciones del motor);
 *  - cuánto movieron tus decisiones anteriores los indicadores que este asunto pone en juego (efecto real, ya
 *    ajustado a tu nivel, el mismo que suma `kpis()`).
 * No cambia indicadores, XP ni veredicto.
 */
import { KPI_KEYS, effectOf, entries, packOf } from "./engine";
import { firstName } from "./cast";
import { REL_START, entryRipples, moodOf, stanceOf } from "./relations";
import type { CastId, CeoState, Entry, KpiKey } from "./types";

export interface ContinuityLink {
  kind: "detonador" | "persona" | "indicador";
  /** Asunto anterior al que se refiere (siempre resuelto antes de que llegara este). */
  from: string;
  fromSubject: string;
  text: string;
  /** Persona o indicador al que se refiere (si aplica). */
  who?: CastId;
  kpi?: KpiKey;
  /** Valores reales en que se basa la frase (para auditar que no se inventa nada). */
  facts: Record<string, number | string>;
}
export interface Continuity {
  links: ContinuityLink[];
  /** Relación actual (0–100) con quien te escribe, si hubo historia con esa persona. */
  sender?: { who: CastId; value: number; mood: string };
}

const MAX_PEOPLE = 1;
const MAX_KPIS = 1;
const STANCE_TEXT: Record<string, string> = { "2": "le cayó muy bien", "1": "le cayó bien", "-1": "no le gustó", "-2": "le cayó muy mal" };

/** Entradas resueltas antes de que llegara `e` (decididas o vencidas), en orden. */
function earlier(all: Entry[], e: Entry): Entry[] {
  return all.filter((x) => x.item.id !== e.item.id && (x.status === "decidido" || x.status === "vencido") && (x.decision ? x.decision.at : x.deadline) <= e.arrivesAt);
}

export function continuityOf(s: CeoState, itemId: string, now: number): Continuity {
  const pack = packOf(s);
  const all = entries(s, now);
  const e = all.find((x) => x.item.id === itemId);
  if (!e || e.status === "futuro") return { links: [] };
  const prev = earlier(all, e);
  const links: ContinuityLink[] = [];
  const name = (id: CastId) => pack.cast[id]?.name ?? id;

  // 1 · detonador: este asunto existe por lo que hiciste antes.
  if (e.item.trigger) {
    const t = prev.find((x) => x.item.id === e.item.trigger!.item);
    if (t) {
      const text = t.status === "vencido"
        ? `Este asunto llega porque dejaste vencer «${t.item.subject}». Lo que pasó entonces: ${t.item.expired.outcome}`
        : `Este asunto llega por lo que decidiste en «${t.item.subject}»: ${t.option!.text} Lo que pasó entonces: ${t.option!.outcome}`;
      links.push({ kind: "detonador", from: t.item.id, fromSubject: t.item.subject, text, facts: { option: t.decision?.option ?? "__expired" } });
    }
  }
  const used = new Set(links.map((l) => l.from));

  // 2 · personas: quien te escribe y los involucrados, con lo que tus decisiones anteriores les hicieron.
  const people = [e.item.from, ...(e.item.involves ?? []), ...(e.item.lines ?? []).map((l) => l.who)].filter((id, i, a) => a.indexOf(id) === i && pack.cast[id]);
  // Relación al momento en que llegó este asunto (solo lo resuelto antes; igual que el mapa de relaciones del motor).
  const rel: Record<CastId, number> = Object.fromEntries(Object.keys(pack.cast).map((id) => [id, REL_START]));
  for (const x of prev) for (const rp of entryRipples(pack, x)) rel[rp.id] = Math.max(0, Math.min(100, Math.round((rel[rp.id] ?? REL_START) + rp.delta)));
  let added = 0;
  for (const who of people) {
    if (added >= MAX_PEOPLE) break;
    // la decisión anterior más reciente con efecto directo en esta persona
    const hit = [...prev].reverse().find((x) => !used.has(x.item.id) && ((x.status === "decidido" && x.option && (stanceOf(x.option)[who] ?? 0) !== 0) || (x.status === "vencido" && x.item.from === who)));
    if (!hit) continue;
    const st = hit.status === "vencido" ? -1 : stanceOf(hit.option!)[who];
    const how = hit.status === "vencido" ? `dejaste vencer su asunto «${hit.item.subject}»` : `en «${hit.item.subject}» elegiste: ${hit.option!.text} A ${firstName(pack, who)} ${STANCE_TEXT[String(st)]}`;
    const mood = moodOf(rel[who]);
    links.push({ kind: "persona", from: hit.item.id, fromSubject: hit.item.subject, who, text: `${name(who)}: ${how}. Cuando llegó este asunto, la relación estaba: ${mood.label.toLowerCase()}.`, facts: { stance: st, relation: rel[who] } });
    used.add(hit.item.id);
    added++;
  }

  // 3 · indicadores: lo que tus decisiones anteriores ya hicieron con lo que este asunto pone en juego.
  const atStake = KPI_KEYS.filter((k) => e.item.options.some((o) => (o.effects[k] ?? 0) !== 0));
  const kpiLinks: ContinuityLink[] = [];
  for (const k of atStake) {
    let best: { x: Entry; d: number } | null = null;
    for (const x of prev) {
      if (used.has(x.item.id)) continue;
      const d = effectOf(s, x)[k] ?? 0;
      if (Math.abs(d) >= 4 && (!best || Math.abs(d) > Math.abs(best.d))) best = { x, d };
    }
    if (!best) continue;
    const label = pack.kpiLabel[k];
    const what = best.x.status === "vencido" ? `dejar vencer «${best.x.item.subject}»` : `tu decisión en «${best.x.item.subject}»`;
    kpiLinks.push({ kind: "indicador", from: best.x.item.id, fromSubject: best.x.item.subject, kpi: k, text: `${label} ${best.d > 0 ? "+" : "−"}${Math.abs(best.d)} por ${what}. Este asunto vuelve a mover ${label.toLowerCase()}.`, facts: { delta: best.d } });
  }
  kpiLinks.sort((a, b) => Math.abs(Number(b.facts.delta)) - Math.abs(Number(a.facts.delta)));
  for (const l of kpiLinks) {
    if (links.filter((x) => x.kind === "indicador").length >= MAX_KPIS) break;
    if (used.has(l.from)) continue;
    links.push(l);
    used.add(l.from);
  }

  const from = e.item.from;
  const touched = prev.some((x) => (x.status === "decidido" && x.option && (stanceOf(x.option)[from] ?? 0) !== 0) || (x.status === "vencido" && x.item.from === from));
  return { links, ...(touched && pack.cast[from] ? { sender: { who: from, value: rel[from], mood: moodOf(rel[from]).label } } : {}) };
}
