import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DIAS_REPASO, LECCIONES_RUTA, RUTA_VERSION, caminoDelDia, ordenLecciones, repasoRecomendado, rutaCompleta, ultimaCompletada, type LeccionRuta } from "./ruta";
import { LESSONS } from "../lessons";

const L = (id: string, academy: LeccionRuta["academy"], skills: string[], level = 1, order = 0): LeccionRuta => ({ id, title: id, minutes: 5, academy, skills, level, order });

describe("MÊTIS 2.0 · regla del camino (2.3, versión 1)", () => {
  it("toma las lecciones publicadas y clasificadas, sin experiencias en revisión", () => {
    expect(RUTA_VERSION).toBe(1);
    expect(LECCIONES_RUTA.length).toBe(LESSONS.length);
    const src = readFileSync("src/lib/ceo/metis2/ruta.ts", "utf8");
    expect(src).not.toMatch(/from "\.\/experiencias|testTools|rankOf|rankFor|\.xp\b/);
  });

  it("primero lo que se puede retomar, luego casos por plazo, luego casos ejecutivos nuevos, luego lecciones", () => {
    const r = rutaCompleta({
      casos: [{ id: "c1", subject: "Caso 1", due: "3 h" }],
      episodios: [{ id: "e1", subject: "Nuevo", minutes: 10, started: false }, { id: "e2", subject: "A medias", minutes: 12, started: true }],
      hechas: {},
      lecciones: [L("a", "finanzas", ["fin.lenguaje"])],
    });
    expect(r.map((p) => p.key)).toEqual(["episodio:e2", "caso:c1", "episodio:e1", "leccion:a"]);
    expect(r[0].cta).toBe("Continuar");
    expect(r[1].cta).toBe("Empezar");
    expect(r[1].href).toBe("/ceo/caso/c1");
    expect(r[3].href).toBe("/ceo/academy/a");
  });

  it("muestra el paso actual y hasta dos siguientes; con menos piezas muestra menos y sin relleno", () => {
    const ls = [L("a", "finanzas", ["fin.lenguaje"], 1, 0), L("b", "liderazgo", ["lid.comunicacion"], 1, 1), L("c", "riesgo", ["rie.etica"], 1, 2), L("d", "operaciones", ["ope.procesos"], 1, 3)];
    const x = caminoDelDia({ hechas: {}, lecciones: ls });
    expect(x.actual?.id).toBe("a");
    expect(x.siguientes.map((p) => p.id)).toEqual(["b", "c"]);
    expect(caminoDelDia({ hechas: { a: 1, b: 1, c: 1 }, lecciones: ls }).siguientes).toEqual([]);
    expect(caminoDelDia({ hechas: { a: 1, b: 1, c: 1, d: 1 }, lecciones: ls }).actual).toBeNull();
  });

  it("un prerrequisito pendiente ordena y se nombra, pero no bloquea nada", () => {
    // fin.resultados pide fin.lenguaje.
    const ls = [L("resultados", "finanzas", ["fin.resultados"], 1, 0), L("lenguaje", "finanzas", ["fin.lenguaje"], 1, 1)];
    const o = ordenLecciones({ hechas: {}, lecciones: ls });
    expect(o.map((x) => x.leccion.id)).toEqual(["lenguaje", "resultados"]);
    expect(o[1].conviene).toBeUndefined(); // al simular que termina «lenguaje», ya no falta nada
    const solo = ordenLecciones({ hechas: {}, lecciones: [ls[0]] });
    // Si el prerrequisito no se enseña en ninguna lección, no se pide.
    expect(solo[0].conviene).toBeUndefined();
    const r = rutaCompleta({ hechas: {}, lecciones: ls });
    expect(r.every((p) => p.href.startsWith("/ceo/academy/"))).toBe(true);
  });

  it("los temas elegidos van primero y se alternan academias; el desempate es estable", () => {
    const ls = [L("f1", "finanzas", ["fin.lenguaje"], 1, 0), L("f2", "finanzas", ["fin.flujo"], 2, 1), L("l1", "liderazgo", ["lid.comunicacion"], 1, 2), L("r1", "riesgo", ["rie.etica"], 1, 3)];
    expect(ordenLecciones({ hechas: {}, lecciones: ls, intereses: ["liderazgo"] })[0].leccion.id).toBe("l1");
    expect(ordenLecciones({ hechas: {}, lecciones: ls }).map((x) => x.leccion.id)).toEqual(["f1", "l1", "r1", "f2"]);
    const a = JSON.stringify(caminoDelDia({ hechas: { f1: 5 }, lecciones: ls }));
    expect(JSON.stringify(caminoDelDia({ hechas: { f1: 5 }, lecciones: ls }))).toBe(a);
  });

  it("no repite piezas y no marca nada como hecho al simular", () => {
    const hechas: Record<string, number> = {};
    const r = rutaCompleta({ casos: [{ id: "c1", subject: "x", due: "1 h" }, { id: "c1", subject: "x", due: "1 h" }], hechas });
    expect(new Set(r.map((p) => p.key)).size).toBe(r.length);
    expect(hechas).toEqual({});
  });

  it("lo último completado es lo más reciente; el repaso sale solo de lecciones terminadas hace días", () => {
    expect(ultimaCompletada([{ at: 3, t: "a" }, { at: 9, t: "b" }, { at: 0, t: "c" }])?.t).toBe("b");
    expect(ultimaCompletada([])).toBeNull();
    const ls = [L("a", "finanzas", ["fin.lenguaje"], 1, 0), L("b", "riesgo", ["rie.etica"], 1, 1)];
    const day = 86_400_000, now = 100 * day;
    expect(repasoRecomendado({}, now, ls)).toBeNull();
    expect(repasoRecomendado({ a: now - day }, now, ls)).toBeNull();
    expect(repasoRecomendado({ a: now - DIAS_REPASO * day, b: now - 10 * day }, now, ls)?.id).toBe("b");
  });
});
