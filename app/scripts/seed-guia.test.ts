/**
 * Genera datos de prueba para revisar la guía en los otros tipos de empresa. Uso: SEED=1 npx vitest run scripts/seed-guia.test.ts
 *  - /tmp/seed-temporadas.json: empresa por temporadas con el proyecto de cambio ya arrancado (sin palancas usadas).
 *  - /tmp/seed-crecimiento.json: empresa de crecimiento recién creada.
 */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { classicStart, playSeason, SIM_T0 } from "../src/lib/ceo/season-sim";
import { setupCompany } from "../src/lib/ceo/engine";
import { GROWTH_ARCHETYPE } from "../src/lib/ceo/growth/combos";

it.runIf(process.env.SEED === "1")("seed guía", () => {
  const r = playSeason(classicStart("cumbre"), "mejor_score", "seed|guia");
  const s = { ...r.state, name: "Oziel Leal", alias: "oziel" } as typeof r.state & { clockOffset?: number };
  if (s.change) s.change = { company: s.change.company, rel0: s.change.rel0, moves: [], weeks: s.change.weeks };
  s.clockOffset = r.at - Date.now();
  writeFileSync("/tmp/seed-temporadas.json", JSON.stringify(s));

  const t0 = SIM_T0;
  const g = setupCompany(classicStart("brasa")(), { companyId: "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b", displayName: "Empresa QA", sectorId: "restaurantes_alimentos", industryId: "restaurantes", archetype: GROWTH_ARCHETYPE, growth: true }, t0) as typeof r.state & { clockOffset?: number };
  g.name = "Oziel Leal"; g.alias = "oziel";
  g.clockOffset = t0 + 3 * 3_600_000 - Date.now();
  writeFileSync("/tmp/seed-crecimiento.json", JSON.stringify(g));
  console.log("temporadas: cambio", !!s.change, "continua", s.careerMode, "| crecimiento:", !!g.growth, g.careerMode);
});
