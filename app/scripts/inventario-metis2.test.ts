/**
 * Inventario del contenido existente (MÊTIS 2.0 · Fase 0).
 * Uso: INVENTARIO=1 npx vitest run scripts/inventario-metis2.test.ts
 *  - Imprime los conteos.
 *  - Con INVENTARIO=grabar, además reescribe src/lib/ceo/metis2/legacy-ids.json (la lista de identificadores
 *    que la prueba legacy.test.ts exige conservar).
 */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { legacyInventory } from "../src/lib/ceo/metis2/legacy";

it.runIf(!!process.env.INVENTARIO)("inventario del contenido existente", () => {
  const inv = legacyInventory();
  const counts = Object.fromEntries(Object.entries(inv).map(([k, v]) => [k, v.length]));
  console.log(JSON.stringify(counts, null, 2));
  if (process.env.INVENTARIO === "grabar") {
    writeFileSync(join(__dirname, "../src/lib/ceo/metis2/legacy-ids.json"), JSON.stringify(inv, null, 1) + "\n");
    console.log("grabado");
  }
});
