/**
 * Diagnóstico V6 → V7 (bajo demanda): por qué reprueba «segunda mejor», por qué «solo números» aprobaba, y si
 * «personas primero» tiene caminos viables. Por causa de reprobación, por competencia (área del asunto) y por indicador.
 *   DIAG_REPORT=1 npx vitest run src/lib/ceo/diagnostico.test.ts
 * Escribe docs/editorial/diagnostico-v6.json. Semillas: la de calibración (`${empresa}|${estrategia}|0`) y dos
 * prefijos nuevos que nunca se usaron para calibrar (`nov26-a|…`, `nov26-b|…`).
 */
import { it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COMPANIES } from "./companies";
import { DAY, H, KPI_KEYS, entries, mandateOf, packOf, rulesFor, rulesVersionOf, scaled, effectOf, verdictOf } from "./engine";
import { isRedLine } from "./editorial";
import { authoredFromScore, judge, prioritizes, type ContextOption } from "./judgment";
import { SIM_T0, playCareer } from "./season-sim";
import type { CeoState, KpiKey } from "./types";

const MONTHS = 5;
// Las semillas nuevas además mueven la hora de inicio: el azar de las consecuencias inciertas sale del periodo, así que
// solo cambiando la hora se obtiene otra muestra de consecuencias (las estrategias deterministas no usan la semilla).
const SEEDS = [
  { id: "calibracion", t0: SIM_T0, seed: (c: string, n: string) => `${c}|${n}|0` },
  { id: "nueva_a", t0: SIM_T0 + 9 * DAY + 7 * H, seed: (c: string, n: string) => `nov26-a|${c}|${n}` },
  { id: "nueva_b", t0: SIM_T0 + 23 * DAY + 13 * H, seed: (c: string, n: string) => `nov26-b|${c}|${n}` },
];
const NAMES = ["criterio_y_tablero", "cuida_caja", "mejor_efecto", "numeros_con_piso", "etica_flexible", "segunda_mejor", "personas_primero", "personas_con_piso", "azar"];

/** Asuntos cerrados del mes con su juicio contextual (igual que judgmentShareOf). */
function judged(s: CeoState, now: number) {
  const k = { ...packOf(s).kpiStart };
  const line = rulesFor(s).passLine, v = rulesVersionOf(s), m = mandateOf(s);
  const out: { id: string; areas: string[]; score: number; good: boolean; level: number; prioriza: number; red: boolean; unethical0: boolean }[] = [];
  for (const e of entries(s, now)) {
    if (e.status !== "decidido" && e.status !== "vencido") continue;
    let good = false, level = 0, prioriza = 0, score = -1;
    if (e.status === "decidido" && e.option) {
      const os: ContextOption[] = e.item.options.map((o) => ({ id: o.id, score: o.score, effects: scaled(o.effects, s.tier, v) }));
      const me = os.find((o) => o.id === e.option!.id)!;
      const p = prioritizes(me, os, k, line, m.kpis, m.margin);
      const j = judge(authoredFromScore(me.score), p);
      good = j.level >= 2; level = j.level; prioriza = p; score = me.score;
    }
    const red = !!(e.decision && isRedLine(e.item.id, e.decision.option, v));
    out.push({ id: e.item.id, areas: e.item.areas, score, good, level, prioriza, red, unethical0: score === 0 && e.item.areas.includes("etica") });
    const eff = effectOf(s, e);
    for (const key of Object.keys(eff) as KpiKey[]) k[key] = Math.max(0, Math.min(100, k[key] + (eff[key] ?? 0)));
  }
  return out;
}

it.runIf(process.env.DIAG_REPORT === "1")("genera el diagnóstico V6/V7", () => {
  const res: Record<string, unknown> = {};
  for (const v of [6, 7]) {
    const byV: Record<string, unknown> = {};
    for (const n of NAMES) {
      const reasons: Record<string, number> = {}, failAreas: Record<string, number> = {}, scorePicks: Record<string, number> = {}, prioriza: Record<string, number> = {};
      const kSum: Record<string, number> = Object.fromEntries(KPI_KEYS.map((x) => [x, 0]));
      const objMiss: Record<string, number> = {}, redPicks: Record<string, number> = {}, unethical: Record<string, number> = {};
      const bySeed: Record<string, { ok: number; n: number }> = {}, byCo: Record<string, { ok: number; n: number }> = {};
      let ok = 0, months = 0, judgedN = 0, judgedGood = 0;
      const reps = n === "azar" ? 3 : 1;
      for (const sd of SEEDS) for (const p of COMPANIES) for (let r = 0; r < reps; r++) {
        const seed = sd.seed(p.id, n) + (r ? `|${r}` : "");
        for (const m of playCareer(p.id, n, MONTHS, seed, v, sd.t0).months) {
          const vv = verdictOf(m.state, m.at);
          months++; if (m.passed) ok++;
          (bySeed[sd.id] ??= { ok: 0, n: 0 }).n++; if (m.passed) bySeed[sd.id].ok++;
          (byCo[p.id] ??= { ok: 0, n: 0 }).n++; if (m.passed) byCo[p.id].ok++;
          for (const x of vv.v5?.reasons ?? []) reasons[x] = (reasons[x] ?? 0) + 1;
          for (const o of vv.v5?.objectives ?? []) if (!o.ok) objMiss[`${p.id}:${o.kpi}`] = (objMiss[`${p.id}:${o.kpi}`] ?? 0) + 1;
          for (const x of KPI_KEYS) kSum[x] += vv.kpis[x];
          for (const j of judged(m.state, m.at)) {
            judgedN++; if (j.good) judgedGood++;
            scorePicks[String(j.score)] = (scorePicks[String(j.score)] ?? 0) + 1;
            if (j.score >= 0) prioriza[`s${j.score}p${j.prioriza}`] = (prioriza[`s${j.score}p${j.prioriza}`] ?? 0) + 1;
            if (!j.good) for (const a of j.areas) failAreas[a] = (failAreas[a] ?? 0) + 1;
            if (j.red) redPicks[j.id] = (redPicks[j.id] ?? 0) + 1;
            if (j.unethical0 && !j.red) unethical[j.id] = (unethical[j.id] ?? 0) + 1;
          }
        }
      }
      const pct = (a: number, b: number) => Math.round((1000 * a) / Math.max(1, b)) / 10;
      byV[n] = {
        aprobados: pct(ok, months), meses: months,
        porSemilla: Object.fromEntries(Object.entries(bySeed).map(([k, x]) => [k, pct(x.ok, x.n)])),
        porEmpresa: Object.fromEntries(Object.entries(byCo).map(([k, x]) => [k, pct(x.ok, x.n)])),
        causas: reasons, objetivosFallados: objMiss,
        criterio: { bienRazonados: pct(judgedGood, judgedN), asuntos: judgedN, eleccionesPorScore: scorePicks, scoreYPrioriza: prioriza },
        competenciasNoRazonadas: failAreas,
        indicadoresPromedio: Object.fromEntries(KPI_KEYS.map((x) => [x, Math.round(kSum[x] / months)])),
        lineasRojasCruzadas: redPicks, eticaScore0SinLineaRoja: unethical,
      };
    }
    res[`v${v}`] = byV;
  }
  const dir = join(process.cwd(), "..", "docs", "editorial");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "diagnostico-v6.json"), JSON.stringify({ generado: "Diagnóstico V6/V7 · 6 empresas × 5 meses × 3 semillas (1 de calibración + 2 nuevas)", semillas: SEEDS.map((s) => s.id), estrategias: NAMES, resultados: res }, null, 1));
}, 3_600_000);
