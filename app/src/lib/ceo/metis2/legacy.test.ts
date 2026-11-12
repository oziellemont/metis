/**
 * MÊTIS 2.0 · red de seguridad del contenido del simulador de empresas.
 *
 * `legacy-ids.json` es la lista de identificadores que existían al empezar el rediseño. Las partidas guardadas y el
 * historial apuntan a ellos, así que ninguno puede desaparecer ni cambiar de nombre. Agregar contenido sí se permite.
 * Para volver a grabar la lista después de AGREGAR contenido: INVENTARIO=grabar npx vitest run scripts/inventario-metis2.test.ts
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { legacyInventory, missingFrom, type LegacyInventory, type LegacyKind } from "./legacy";

const BEFORE = JSON.parse(readFileSync(join(__dirname, "legacy-ids.json"), "utf8")) as LegacyInventory;
const NOW = legacyInventory();

/** Conteos al empezar el rediseño (12 de noviembre de 2026). Son un piso: el contenido puede crecer, no encogerse. */
const FLOOR: Record<LegacyKind, number> = {
  rutas: 13, lecciones: 25, conceptos: 51, dilemas: 98, empresas: 6, casos: 144, arquetipos: 28, contextos: 7,
  episodios: 17, crecimiento: 14, crisis: 3, palancas: 9, diagnostico: 3, competencias: 8,
};

describe("contenido del simulador de empresas (se conserva)", () => {
  it("la lista grabada cubre todos los tipos de contenido y coincide con los conteos del inicio", () => {
    expect(Object.keys(BEFORE).sort()).toEqual(Object.keys(FLOOR).sort());
    for (const k of Object.keys(FLOOR) as LegacyKind[]) expect(BEFORE[k].length, k).toBeGreaterThanOrEqual(FLOOR[k]);
  });

  it("ningún identificador grabado desapareció ni cambió de nombre", () => {
    expect(missingFrom(BEFORE, NOW)).toEqual({});
  });

  it("no hay identificadores repetidos dentro de un mismo tipo", () => {
    for (const k of Object.keys(NOW) as LegacyKind[]) expect(new Set(NOW[k]).size, k).toBe(NOW[k].length);
  });

  it("las 13 rutas de Academy siguen siendo las mismas", () => {
    expect(NOW.rutas).toEqual(["alineacion", "comunicacion", "consejo", "conversaciones", "crisis", "cultura", "equipos", "estrategia", "finanzas", "innovacion", "mentalidad", "negociacion", "personas"]);
  });

  it("missingFrom detecta lo que falta y no se queja de lo que se agrega", () => {
    const now = { ...NOW, rutas: [...NOW.rutas.filter((r) => r !== "finanzas"), "nueva"] };
    expect(missingFrom(BEFORE, now)).toEqual({ rutas: ["finanzas"] });
    expect(missingFrom({ rutas: ["finanzas"] }, NOW)).toEqual({});
  });
});
