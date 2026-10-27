/**
 * Regenera los archivos de partidas doradas. NO corre en la suite normal.
 * Uso (solo cuando un cambio de reglas es intencional y aprobado):
 *   GOLDEN_RECORD=1 npx vitest run src/lib/ceo/golden/record.test.ts
 */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { SPECS, record } from "./play";

it.runIf(process.env.GOLDEN_RECORD === "1")("graba partidas doradas", () => {
  for (const spec of SPECS) {
    const g = record(spec);
    writeFileSync(join(__dirname, "data", `${spec.id}.json`), JSON.stringify(g, null, 1) + "\n");
  }
}, 120_000);
