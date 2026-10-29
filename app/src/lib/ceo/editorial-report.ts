/**
 * mêtis CEO · 0.6 Reporte editorial revisable (Markdown y CSV).
 * Solo lee contenido y reproduce partidas automáticas; no escribe nada en producción.
 */
import { COMPANIES } from "./companies";
import { record, type ChangePlan, type Strategy } from "./golden/play";
import { replay } from "./replay";
import {
  EDITORIAL_STATUSES, EDITORIAL_THRESHOLDS, EDITORIAL_VERSION, FINDING_TEXT, RED_LINES, countBy, inventory, scoreAudit,
  type EditorialStatus, type Finding, type ItemAudit,
} from "./editorial";
import { SEASON_OBJECTIVES, SHADOW_RULES, SHADOW_VERDICT_VERSION, compare, shadowVerdictOf, type ShadowComparison, type ShadowVerdict } from "./shadow-verdict";

export interface PopulationGame { company: string; strategy: Strategy; change: ChangePlan; seed: string; verdict: ShadowVerdict }
export const POP_STRATEGIES: Strategy[] = ["best", "score", "mixed", "random", "lazy", "worst"];
export const POP_CHANGES: ChangePlan[] = ["smart", "partial", "skip"];

/** Partidas reproducibles (semilla fija): empresa × estrategia × plan de cambio × semillas. */
export function population(seeds = 2, companies = COMPANIES.map((c) => c.id)): PopulationGame[] {
  const out: PopulationGame[] = [];
  const T0 = Date.UTC(2026, 9, 5, 15, 0, 0);
  for (const company of companies) for (const strategy of POP_STRATEGIES) for (const change of POP_CHANGES) for (let i = 0; i < seeds; i++) {
    const seed = `pob|${company}|${strategy}|${change}|${i}`;
    const g = record({ id: seed, description: "", start: T0 + i * 3_600_000, name: `Jugador ${i}`, company, settings: { tz: "America/Monterrey" }, seed, seasons: [{ strategy, change, advance: false }] });
    const { state } = replay(g.actions);
    const at = g.checkpoints[g.checkpoints.length - 1].at;
    out.push({ company, strategy, change, seed, verdict: shadowVerdictOf(state, at) });
  }
  return out;
}

const STATUS_ES: Record<EditorialStatus, string> = {
  approved: "approved (propuesta, falta firma humana)",
  legacy: "legacy (se conserva como histórico)",
  needsRewrite: "needsRewrite (reescribir)",
  restrictedEthics: "restrictedEthics (obligación ética o de seguridad)",
};
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)} %` : "0 %");
const esc = (s: string) => s.replace(/\|/g, "/").replace(/\n/g, " ");

export function itemsCsv(audits: ItemAudit[] = inventory()): string {
  const head = ["empresa", "asunto", "dia", "consecuencia", "titulo", "estado", "sugerido", "revisado", "opciones(score:neto)", "vencer_neto", "ventaja_score_alto", "dominante", "defendibles", "hallazgos", "motivo"];
  const q = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = audits.map((a) => [a.company, a.id, a.day, a.consequence ? "si" : "no", a.subject, a.status, a.suggested, a.reviewed ? "si" : "no",
    a.options.map((o) => `${o.id}:${o.score}:${o.net}${o.redLine ? "!" : ""}`).join(" "), a.expiredNet, a.topScoreGap, a.dominantOption ?? "", a.defensible, a.findings.join(" "), a.reason].map(q).join(","));
  return [head.join(","), ...rows].join("\n") + "\n";
}

export function reportMarkdown(pop: PopulationGame[], audits: ItemAudit[] = inventory()): string {
  const L: string[] = [];
  const counts = countBy(audits);
  const total = audits.length;
  L.push(`# mêtis CEO · Inventario editorial de los ${total} asuntos y veredicto sombra`);
  L.push("");
  L.push(`Clasificador editorial v${EDITORIAL_VERSION} · Veredicto sombra v${SHADOW_VERDICT_VERSION}. Reporte generado por código a partir del contenido actual; no cambia ningún resultado de partidas, XP ni veredicto en producción.`);
  L.push("");
  L.push("## 1. Resumen");
  L.push("");
  L.push(`De los ${total} asuntos (${audits.filter((a) => !a.consequence).length} base y ${audits.filter((a) => a.consequence).length} consecuencias), el clasificador propone:`);
  L.push("");
  L.push("| Estado | Asuntos | % |");
  L.push("|---|---:|---:|");
  for (const s of EDITORIAL_STATUSES) L.push(`| ${STATUS_ES[s]} | ${counts[s]} | ${pct(counts[s], total)} |`);
  L.push("");
  L.push("Ningún asunto queda aprobado de forma definitiva: «approved» es una propuesta automática que requiere la firma de dos revisores humanos (tabla `EDITORIAL_REVIEW` en `editorial.ts`).");
  L.push("");
  L.push("| Empresa | approved | legacy | needsRewrite | restrictedEthics |");
  L.push("|---|---:|---:|---:|---:|");
  for (const c of COMPANIES) { const k = countBy(audits.filter((a) => a.company === c.id)); L.push(`| ${c.name} | ${k.approved} | ${k.legacy} | ${k.needsRewrite} | ${k.restrictedEthics} |`); }
  L.push("");

  L.push("## 2. Auditoría de `score` frente a efectos");
  L.push("");
  L.push("Balance neto promedio (suma de los cinco indicadores, sin multiplicadores de nivel) de las opciones según el score que les puso el autor. Si el score alto también es el más rentable, el jugador aprende a adivinar la preferencia del autor en lugar de analizar el caso.");
  L.push("");
  L.push("| Empresa | score 0 | score 1 | score 2 | score 3 | Correlación score–balance |");
  L.push("|---|---:|---:|---:|---:|---:|");
  for (const s of scoreAudit()) {
    const cell = (n: number) => s.byScore[n].n ? `${s.byScore[n].meanNet > 0 ? "+" : ""}${s.byScore[n].meanNet.toFixed(2)} (${s.byScore[n].n})` : "–";
    L.push(`| ${COMPANIES.find((c) => c.id === s.company)!.name} | ${cell(0)} | ${cell(1)} | ${cell(2)} | ${cell(3)} | ${s.correlation.toFixed(2)} |`);
  }
  L.push("");
  const fc = (f: Finding) => audits.filter((a) => a.findings.includes(f)).length;
  L.push("Hallazgos por asunto (un asunto puede tener varios):");
  L.push("");
  L.push("| Hallazgo | Asuntos |");
  L.push("|---|---:|");
  for (const f of Object.keys(FINDING_TEXT) as Finding[]) L.push(`| ${FINDING_TEXT[f]} | ${fc(f)} |`);
  L.push("");
  L.push(`Umbrales: ventaja «obvia» ≥ ${EDITORIAL_THRESHOLDS.obviousGap} puntos netos; una opción es «defendible» si queda a ${EDITORIAL_THRESHOLDS.defensibleBand} puntos o menos de la mejor.`);
  L.push("");

  L.push("## 3. Líneas rojas");
  L.push("");
  L.push("Opciones que se analizan como consecuencia y nunca deben presentarse como alternativa legítima. Lista editorial a confirmar por revisión humana.");
  L.push("");
  L.push("| Asunto | Opción | Por qué |");
  L.push("|---|---|---|");
  for (const [id, rs] of Object.entries(RED_LINES)) for (const r of rs) L.push(`| ${id} | ${r.option} | ${esc(r.why)} |`);
  L.push("");

  L.push("## 4. Inventario asunto por asunto");
  L.push("");
  L.push("Opciones como `id:score:balance`. Un `!` marca una línea roja. «Vencer» es el balance de no responder.");
  for (const c of COMPANIES) {
    L.push("");
    L.push(`### ${c.name}`);
    L.push("");
    L.push("| Día | Asunto | Tipo | Opciones | Vencer | Estado propuesto | Motivo |");
    L.push("|---:|---|---|---|---:|---|---|");
    for (const a of audits.filter((x) => x.company === c.id)) {
      L.push(`| ${a.day} | \`${a.id}\` ${esc(a.subject)} | ${a.consequence ? "consecuencia" : "base"} | ${a.options.map((o) => `${o.id}:${o.score}:${o.net > 0 ? "+" : ""}${o.net}${o.redLine ? "!" : ""}`).join(" ")} | ${a.expiredNet} | ${a.status}${a.reviewed ? " (revisado)" : ""} | ${esc(a.reason)} |`);
    }
  }
  L.push("");

  const cmp: ShadowComparison = compare(pop.map((p) => p.verdict));
  L.push("## 5. Veredicto sombra");
  L.push("");
  L.push("El veredicto actual exige los cinco indicadores sobre la línea del nivel y 80 % de asuntos respondidos. El veredicto sombra (propuesta v0, no validada) corre en paralelo, nadie lo ve y no se guarda en la carrera:");
  L.push("");
  L.push(`1. Límites críticos no compensables: caja < ${SHADOW_RULES.insolvency} (insolvencia), consejo < ${SHADOW_RULES.boardLost} (el consejo ya no te sostiene) o haber elegido una opción de línea roja.`);
  L.push("2. Objetivos de temporada por empresa: " + Object.entries(SEASON_OBJECTIVES).map(([id, o]) => `${COMPANIES.find((c) => c.id === id)?.name}: ${o.kpis.join(" y ")} sobre la línea («${o.text}»)`).join("; ") + ".");
  L.push("3. Desempeño integral: salud promedio sobre la línea, en lugar de exigir cada indicador por separado.");
  L.push(`4. Dejar vencer asuntos no reprueba por sí solo: con menos de ${Math.round(SHADOW_RULES.minEvidence * 100)} % respondido el resultado es «sin evidencia suficiente».`);
  L.push("");
  L.push(`Población: ${cmp.games} partidas reproducibles (semilla fija) en las tres empresas, nivel 0, con seis estilos de juego (cuidadoso, preferido por el autor, mixto, azar, deja vencer, peor balance) y tres planes de cambio.`);
  L.push("");
  L.push("| | Sombra: aprobado | Sombra: reprobado | Sombra: sin evidencia | Total |");
  L.push("|---|---:|---:|---:|---:|");
  for (const row of ["aprobo", "reprobo"] as const) {
    const m = cmp.matrix[row];
    L.push(`| Actual: ${row === "aprobo" ? "aprobó" : "reprobó"} | ${m.aprobado} | ${m.reprobado} | ${m.sin_evidencia} | ${m.aprobado + m.reprobado + m.sin_evidencia} |`);
  }
  L.push("");
  L.push(`Coinciden en ${pct(Math.round(cmp.agreement * cmp.games), cmp.games)} de las partidas. Aprobación actual: ${pct(cmp.current.passed, cmp.games)}; sombra: ${pct(cmp.shadow.aprobado, cmp.games)}.`);
  L.push("");
  L.push("Motivos de reprobación en sombra (una partida puede tener varios):");
  L.push("");
  L.push("| Motivo | Partidas |");
  L.push("|---|---:|");
  const RS: Record<string, string> = { insolvencia: "Insolvencia (caja)", consejo_perdido: "Consejo perdido", linea_roja: "Eligió una línea roja", objetivo: "No cumplió un objetivo de temporada", salud: "Salud integral bajo la línea" };
  for (const [r, n] of Object.entries(cmp.reasons)) L.push(`| ${RS[r]} | ${n} |`);
  L.push("");
  L.push("Por empresa y estilo de juego (aprobadas actual / sombra, de cada grupo):");
  L.push("");
  L.push("| Empresa | " + POP_STRATEGIES.join(" | ") + " |");
  L.push("|---|" + POP_STRATEGIES.map(() => "---:").join("|") + "|");
  for (const c of COMPANIES) {
    const cells = POP_STRATEGIES.map((st) => {
      const g = pop.filter((p) => p.company === c.id && p.strategy === st);
      return g.length ? `${g.filter((p) => p.verdict.current.passed).length} / ${g.filter((p) => p.verdict.passed).length} de ${g.length}` : "–";
    });
    L.push(`| ${c.name} | ${cells.join(" | ")} |`);
  }
  L.push("");
  L.push("Estilos: best = cuidadoso (cuida la línea en cada decisión); score = siempre la opción preferida por el autor; mixed = la preferida 60 % de las veces y al azar el resto; random = al azar; lazy = deja vencer cerca del 40 %; worst = siempre la de peor balance.");
  L.push("");
  L.push("## 6. Qué decidir en la revisión editorial");
  L.push("");
  L.push("Confirmar o corregir la lista de líneas rojas; firmar (dos revisores) los asuntos que queden en approved; decidir el orden de reescritura de los needsRewrite empezando por SuperNorte; y aprobar o ajustar los umbrales y objetivos del veredicto sombra antes de usarlo con jugadores reales. Ningún cambio de contenido o de veredicto entra en una temporada en curso.");
  L.push("");
  return L.join("\n");
}
