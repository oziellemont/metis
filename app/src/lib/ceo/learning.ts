/**
 * mêtis CEO · Lo que deja cada decisión (sistema de aprendizaje).
 *
 * Función PURA y de solo lectura: explica una decisión ya tomada, no la califica ni cambia nada.
 *  - Lo que ganaste: indicadores que subieron y personas que lo valoraron.
 *  - Lo que sacrificaste: indicadores que pagaron y relaciones que se resintieron.
 *  - Riesgo que queda: el tablero de ese momento (cerca o debajo de la línea, puntos que no contaron).
 *  - Principio: la nota de dirección del caso.
 *  - La próxima vez: otra salida defendible y qué habría cambiado (sin decir «la correcta»).
 *
 * Los efectos oficiales siguen saliendo de las reglas del motor (`effectOf`); aquí solo se leen.
 */
import { KPI_KEYS, nowOf, rulesFor, rulesVersionOf, scaled } from "./engine";
import { displayOptions } from "./option-order";
import { timeline } from "./season-report";
import type { CeoState, CompanyPack, Entry, KpiKey, Kpis, Option } from "./types";

export interface DecisionLesson {
  gained: string[];
  sacrificed: string[];
  risks: string[];
  principle: string;
  nextTime: string | null;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const listEs = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);

/** Diferencia mínima (en puntos) para decir que una alternativa «habría cuidado» o «habría costado» algo. */
const DIFF = 2;

export function decisionLesson(s: CeoState, e: Entry, pack: CompanyPack, now: number = nowOf(s)): DecisionLesson | null {
  if (e.status !== "decidido" && e.status !== "vencido") return null;
  const it = e.item;
  const ev = timeline(s, now).events.find((x) => (x.kind === "decision" || x.kind === "vencido") && x.id === it.id);
  if (!ev) return null;
  const line = rulesFor(s).passLine;
  const label = (k: KpiKey) => pack.kpiLabel[k];
  const name = (id: string) => pack.cast[id]?.name.split(" ")[0] ?? id;
  const before: Kpis = ev.before;
  const eff = ev.eff;
  const o = e.status === "decidido" ? e.option : undefined;

  const gained: string[] = [];
  const sacrificed: string[] = [];
  const risks: string[] = [];
  for (const k of KPI_KEYS) {
    const d = eff[k] ?? 0;
    if (!d) continue;
    const after = clamp(before[k] + d);
    if (d > 0) {
      gained.push(`${label(k)} +${d} (de ${before[k]} a ${after}).`);
      const lost = before[k] + d - after;
      if (lost > 0) risks.push(`${label(k)} ya estaba en ${before[k]}: ${lost} de esos puntos no contaron. Ese indicador no necesitaba más.`);
    } else {
      sacrificed.push(`${label(k)} ${d} (de ${before[k]} a ${after}).`);
      if (after < line) risks.push(`${label(k)} quedó en ${after}, debajo de la línea de ${line}. Habrá que recuperarlo en las próximas decisiones.`);
      else if (after < line + 5) risks.push(`${label(k)} quedó en ${after}, a ${after - line} puntos de la línea. Poco margen para otra decisión que lo use.`);
    }
  }
  for (const [who, v] of Object.entries(o?.stance ?? {})) {
    if (!pack.cast[who] || !v) continue;
    if (v >= 1) gained.push(`La confianza de ${name(who)}${v >= 2 ? ", que lo valoró mucho" : ""}.`);
    else {
      sacrificed.push(`La relación con ${name(who)}${v <= -2 ? ", que lo resintió" : ""}.`);
      if (v <= -2) risks.push(`${name(who)} lo tomó mal; puede cobrártelo en un asunto posterior.`);
    }
  }
  if (e.status === "vencido") {
    sacrificed.push(`La iniciativa: otros decidieron por ti y ${name(it.from)} se quedó sin respuesta.`);
  }

  return { gained, sacrificed, risks, principle: it.bitacora.nota, nextTime: nextTimeOf(s, e, eff, before, line, label) };
}

/**
 * Otra salida defendible y su intercambio. Se elige entre las opciones razonables distintas a la tuya,
 * prefiriendo la que más protegía el indicador que tu decisión dejó más expuesto. Nunca se presenta como «la correcta».
 */
function nextTimeOf(s: CeoState, e: Entry, eff: Partial<Kpis>, before: Kpis, line: number, label: (k: KpiKey) => string): string | null {
  const v = rulesVersionOf(s);
  const chosen = e.status === "decidido" ? e.option?.id : undefined;
  const pool = displayOptions(e.item).filter((x) => x.id !== chosen && x.score >= 2);
  if (!pool.length) return null;
  const effOf = (x: Option) => scaled(x.effects, s.tier, v);
  // El indicador más expuesto tras tu decisión (menor valor resultante entre los que pagaron).
  const paid = KPI_KEYS.filter((k) => (eff[k] ?? 0) < 0).sort((a, b) => (before[a] + (eff[a] ?? 0)) - (before[b] + (eff[b] ?? 0)));
  const exposed = paid[0];
  const diffs = (x: Option) => {
    const a = effOf(x);
    const better: KpiKey[] = []; const worse: KpiKey[] = [];
    for (const k of KPI_KEYS) {
      const d = (a[k] ?? 0) - (eff[k] ?? 0);
      if (d >= DIFF) better.push(k); else if (d <= -DIFF) worse.push(k);
    }
    return { better, worse, a };
  };
  const ranked = pool
    .map((x, i) => ({ x, i, ...diffs(x) }))
    .filter((r) => r.better.length || r.worse.length)
    .sort((p, q) => {
      if (exposed) {
        const dp = (p.a[exposed] ?? 0) - (q.a[exposed] ?? 0);
        if (dp) return -dp;
      }
      return q.better.length - p.better.length || p.i - q.i;
    });
  const r = ranked[0];
  if (!r) return null;
  const t = r.x.text.trim();
  const quote = t.startsWith("«") ? t : `«${t}»`;
  const better = listEs(r.better.map((k) => label(k).toLowerCase()));
  const worse = listEs(r.worse.map((k) => label(k).toLowerCase()));
  const tight = exposed && before[exposed] + (eff[exposed] ?? 0) < line + 5 ? ` Con ${label(exposed).toLowerCase()} tan cerca de la línea, ese cambio pesaba.` : "";
  if (better && worse) return `Otra salida defendible era ${quote}. Habría favorecido ${better}, a costa de ${worse}.${tight} No hay una sola respuesta: la pregunta es qué podías pagar en ese momento.`;
  if (better) return `Otra salida defendible era ${quote}. Habría favorecido ${better} sin costarte más en otro indicador.${tight} Pregúntate qué te llevó a descartarla y si esa razón sigue en pie.`;
  return `Otra salida defendible era ${quote}. Habría costado más ${worse}; tu decisión protegió eso. Revisa si lo que ganaste valía lo que pagaste.`;
}
