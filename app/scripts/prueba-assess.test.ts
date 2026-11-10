/** Genera el ejemplo del tablero de Assess (perfiles simulados, sin personas reales). Corre solo con PRUEBA_ASSESS=1. */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { caseOutcomes, INDUSTRIES, COMPETENCIES, type Industry } from "../src/lib/assess/catalog";
import { scoreCandidate, optionScore, BAND_LABEL, type Answer } from "../src/lib/assess/model";

const stanceOf = (ind: Industry, prefer: string[]): Answer[] => caseOutcomes(ind).map((c) => {
  const live = c.options.filter((o) => o.available);
  const o = prefer.map((p) => live.find((x) => x.stance === p)).find(Boolean) ?? live[0];
  return { caseId: c.caseId, optionId: o.optionId, reasoning: "Perfil simulado para la prueba.", ms: 60_000 };
});
const sumOf = (c: ReturnType<typeof caseOutcomes>[number], id: string) => c.measures.reduce((a, k) => a + (optionScore(c, id, k) ?? 0), 0);
const balanced = (ind: Industry): Answer[] => caseOutcomes(ind).map((c) => {
  const live = c.options.filter((o) => o.available);
  const o = live.reduce((x, y) => (sumOf(c, y.optionId) > sumOf(c, x.optionId) ? y : x));
  return { caseId: c.caseId, optionId: o.optionId, reasoning: "Perfil simulado para la prueba.", ms: 60_000 };
});

it.skipIf(!process.env.PRUEBA_ASSESS)("ejemplo del tablero", () => {
  const out: string[] = ["# MÊTIS Assess v1 · ejemplo del tablero con perfiles simulados", "", "Perfiles SIMULADOS (no son personas). Sirven para comprobar que el criterio distingue estilos de decisión de forma consistente. Generado por `scripts/prueba-assess.test.ts` con `PRUEBA_ASSESS=1`.", ""];
  for (const ind of ["retail", "acero"] as Industry[]) {
    const def = INDUSTRIES[ind];
    const w = ind === "retail" ? { finanzas: 2, liquidez: 1, personas: 3, estrategia: 2 } as const : { finanzas: 2, liquidez: 1, personas: 3, relaciones: 1, estrategia: 2 } as const;
    out.push(`## ${def.label} · ${def.company}`, "", `Casos: ${caseOutcomes(ind).map((c) => c.subject).join("; ")}.`, "", `Pesos de la vacante de ejemplo: ${Object.entries(w).map(([k, v]) => `${COMPETENCIES[k as keyof typeof COMPETENCIES].label} ×${v}`).join(", ")}.`, "");
    const rows = [
      ["Equilibrado (mejor suma por caso)", balanced(ind)],
      ["Siempre prudente", stanceOf(ind, ["prudente", "equilibrada"])],
      ["Siempre arriesgado", stanceOf(ind, ["arriesgada", "equilibrada"])],
    ] as const;
    const reps = rows.map(([n, a]) => [n, scoreCandidate(ind, w, a)] as const);
    out.push(`| Perfil | ${reps[0][1].comps.map((c) => c.label).join(" | ")} | Global | Lectura |`, `|---|${reps[0][1].comps.map(() => "---").join("|")}|---|---|`);
    for (const [n, r] of reps) out.push(`| ${n} | ${r.comps.map((c) => c.score ?? "—").join(" | ")} | ${r.overall ?? "—"} | ${BAND_LABEL[r.band]} |`);
    out.push("");
    const probe = reps[2][1].probe[0];
    if (probe) out.push(`Ejemplo de pregunta sugerida para la entrevista (perfil arriesgado): ${probe}`, "");
  }
  writeFileSync("docs/assess/ejemplo_tablero.md", out.join("\n") + "\n");
}, 120_000);
