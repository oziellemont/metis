import { describe, expect, it } from "vitest";
import { COMPANIES } from "./companies";
import type { CompanyPack } from "./types";

/**
 * Coherencia de efectos: una decisión sobre personas o comunicación
 * (enseñar a presentar, dar la bienvenida, reconocer a alguien) no mueve
 * el margen ni la caja si la historia no involucra dinero.
 *
 * Lista explícita de opciones revisadas. Si alguien vuelve a ponerles
 * margen o caja, la prueba falla y obliga a justificarlo en el texto.
 */
const SIN_DINERO: Record<string, string[]> = {
  cumbre: [
    "d1-bienvenida/b",
    "d2-ana/a", "d2-ana/b",
    "c-ana-brilla/a", "c-ana-brilla/b",
    "c-ana-renuncia/a", "c-ana-renuncia/b",
    "c-hector-aliado/b",
    "c-hector-renuncia/c",
    "d5-consejo/b",
    "d6-gastos/c",
  ],
  forja: [
    "fn-c-kaizen/b",
    "fn-d7-sindicato/c",
    // fn-d6-denuncia/c conserva caja −3: despedir sin investigar implica liquidación y riesgo de demanda.
  ],
  brasa: [
    "gb-d7-consejo/c",
  ],
};

const packs: Record<string, CompanyPack> = Object.fromEntries(COMPANIES.map((c) => [c.id, c]));

describe("efectos coherentes con la historia", () => {
  for (const [company, refs] of Object.entries(SIN_DINERO)) {
    it(`${company}: decisiones de personas y comunicación no mueven margen ni caja`, () => {
      const pack = packs[company];
      expect(pack, company).toBeTruthy();
      const bad: string[] = [];
      for (const ref of refs) {
        const [itemId, optId] = ref.split("/");
        const item = pack.items.find((x) => x.id === itemId);
        const opt = item?.options.find((o) => o.id === optId);
        if (!opt) { bad.push(`${ref} no existe`); continue; }
        if (opt.effects.margen !== undefined) bad.push(`${ref} mueve margen`);
        if (opt.effects.caja !== undefined) bad.push(`${ref} mueve caja`);
      }
      expect(bad).toEqual([]);
    });
  }

  it("si una opción cuesta o ahorra caja sin hablar de dinero, el resultado lo explica", () => {
    // Las opciones de la lista que sí mueven caja por un costo concreto lo dicen en el texto.
    const conCosto: [string, string, string][] = [
      ["cumbre", "d6-clima", "a"],
      ["cumbre", "d7-sucesion", "a"],
    ];
    const money = /(cuesta|costo|dinero|sueldo|\$)/i;
    const bad: string[] = [];
    for (const [company, itemId, optId] of conCosto) {
      const opt = packs[company].items.find((x) => x.id === itemId)?.options.find((o) => o.id === optId);
      if (!opt) { bad.push(`${company}/${itemId}/${optId} no existe`); continue; }
      if (opt.effects.margen !== undefined) bad.push(`${itemId}/${optId} mueve margen`);
      if (!money.test(`${opt.text} ${opt.outcome}`)) bad.push(`${itemId}/${optId} no explica el costo`);
    }
    expect(bad).toEqual([]);
  });
});
