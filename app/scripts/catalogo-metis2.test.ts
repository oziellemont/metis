/**
 * Catálogo de aprendizaje de MÊTIS 2.0.
 * Uso: CATALOGO=1 npx vitest run scripts/catalogo-metis2.test.ts
 *  - Imprime los conteos por academia y por nivel.
 *  - Con CATALOGO=grabar, además reescribe src/lib/ceo/metis2/academias-ids.json (la lista de identificadores
 *    que la prueba academias.test.ts exige conservar). Solo se graba después de AGREGAR, nunca para quitar.
 */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ACADEMIES, ACADEMY_IDS, FORMATS, SKILLS, SKILL_IDS, TOPICS, TOPIC_IDS, skillsAt, skillsOf, topicAcademy } from "../src/lib/ceo/metis2/academias";

it.runIf(!!process.env.CATALOGO)("catálogo de aprendizaje", () => {
  const rows = ACADEMIES.map((a) => ({
    academia: a.name,
    habilidades: skillsOf(a.id).length,
    temas: TOPICS.filter((t) => topicAcademy(t) === a.id).length,
    ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((l) => [`N${l}`, skillsAt(l, a.id).length])),
  }));
  console.table(rows);
  console.log(JSON.stringify({ habilidades: SKILLS.length, temas: TOPICS.length, formatos: FORMATS.length }));
  if (process.env.CATALOGO === "grabar") {
    const ids = { academias: ACADEMY_IDS, habilidades: SKILL_IDS, temas: TOPIC_IDS, formatos: FORMATS.map((f) => f.id) };
    writeFileSync(join(__dirname, "../src/lib/ceo/metis2/academias-ids.json"), JSON.stringify(ids, null, 1) + "\n");
    console.log("grabado");
  }
});
