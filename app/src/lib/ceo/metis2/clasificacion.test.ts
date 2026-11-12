/**
 * MÊTIS 2.0 · entrega 1.2 · clasificación del contenido existente y cobertura.
 *
 * Para regenerar el documento después de cambiar la clasificación o el contenido:
 *   CLASIFICACION_DOC=1 npx vitest run src/lib/ceo/metis2/clasificacion.test.ts
 * Fuera de ese modo, la prueba verifica que `docs/metis2/03-clasificacion.md` esté al día.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ACADEMY_IDS, DEMANDS, SKILLS, skillById } from "./academias";
import { CONTENT_KINDS, OLD_COMPETENCY_IDS, TRACK_IDS, academyOfCompetency, classifiedIds, dilemmaBase, givesEvidence, parseTag, skillsOfTrack, tagOf, tagOfItem, type ContentKind } from "./clasificacion";
import { CASOS } from "./clasificacion-datos";
import { classificationMarkdown, coverage, pieces } from "./cobertura";
import { legacyInventory } from "./legacy";
import { ALL_DILEMMAS } from "../dilemmas";
import { COMPANIES } from "../companies";
import { bankItemId } from "../cases/bank";
import type { Area } from "../types";

const DOC = join(__dirname, "../../../../../docs/metis2/03-clasificacion.md");
const inv = legacyInventory();
const all = pieces();
const cov = coverage(all);

/** Tipo de pieza y la lista del inventario de la Fase 0 que le corresponde. */
const KIND_TO_LEGACY: [Exclude<ContentKind, "palanca" | "dilema">, keyof typeof inv][] = [
  ["leccion", "lecciones"], ["concepto", "conceptos"], ["caso", "casos"], ["banco", "arquetipos"],
  ["episodio", "episodios"], ["crecimiento", "crecimiento"], ["crisis", "crisis"], ["diagnostico", "diagnostico"],
];

describe("clasificación · todo el contenido tiene etiqueta", () => {
  it.each(KIND_TO_LEGACY)("%s: cada identificador del inventario está clasificado y no sobra ninguno", (kind, legacy) => {
    expect(classifiedIds(kind).slice().sort()).toEqual(inv[legacy]);
  });

  it("dilemas: cada situación está clasificada y la segunda redacción usa la misma etiqueta", () => {
    const bases = [...new Set(inv.dilemas.map(dilemmaBase))].sort();
    expect(classifiedIds("dilema").slice().sort()).toEqual(bases);
    for (const d of ALL_DILEMMAS) {
      expect(tagOf("dilema", d.id), d.id).toBeDefined();
      if (d.replaces) {
        expect(dilemmaBase(d.id), d.id).toBe(d.replaces);
        expect(tagOf("dilema", d.id)).toEqual(tagOf("dilema", d.replaces));
      }
    }
  });

  it("palancas: todas pertenecen al mismo ejercicio", () => {
    for (const id of inv.palancas) expect(tagOf("palanca", id)?.academy).toBe("liderazgo");
  });

  it("ninguna pieza queda sin etiqueta", () => {
    expect(all.filter((p) => !p.tag).map((p) => `${p.kind}:${p.id}`)).toEqual([]);
    for (const k of cov.kinds) expect(k.tagged, k.kind).toBe(k.total);
  });

  it("un identificador que no existe no tiene etiqueta", () => {
    expect(tagOf("caso", "cumbre:no-existe")).toBeUndefined();
    expect(tagOf("leccion", "no-existe")).toBeUndefined();
  });
});

describe("clasificación · reglas de cada etiqueta", () => {
  it("una academia principal, hasta dos secundarias y de una a tres habilidades sin repetir", () => {
    for (const p of all) {
      const t = p.tag!;
      expect(t.skills.length, p.id).toBeGreaterThanOrEqual(1);
      expect(t.skills.length, p.id).toBeLessThanOrEqual(3);
      expect(new Set(t.skills).size, p.id).toBe(t.skills.length);
      expect(t.academy, p.id).toBe(skillById(t.skills[0])!.academy);
      expect(t.secondary.length, p.id).toBeLessThanOrEqual(2);
      expect(t.secondary, p.id).not.toContain(t.academy);
      for (const a of [t.academy, ...t.secondary]) expect(ACADEMY_IDS, p.id).toContain(a);
    }
  });

  it("el nivel de la pieza no es menor que el nivel desde el que se exige cada una de sus habilidades", () => {
    for (const p of all) for (const s of p.tag!.skills) expect(p.tag!.level, `${p.id} · ${s}`).toBeGreaterThanOrEqual(skillById(s)!.from);
  });

  it("un renglón mal escrito se rechaza con un mensaje claro", () => {
    expect(() => parseTag("fin.flujo")).toThrow(/mal escrita/);
    expect(() => parseTag("fin.flujo @7")).toThrow(/mal escrita/);
    expect(() => parseTag("fin.flujo fin.balance fin.costos fin.valor @3")).toThrow(/mal escrita/);
    expect(() => parseTag("fin.noexiste @2")).toThrow(/desconocida/);
    expect(parseTag("fin.flujo lid.negociacion @3")).toEqual({ skills: ["fin.flujo", "lid.negociacion"], academy: "finanzas", secondary: ["liderazgo"], level: 3 });
  });

  it("las lecciones y los conceptos no dan evidencia; lo demás sí", () => {
    expect(givesEvidence("leccion")).toBe(false);
    expect(givesEvidence("concepto")).toBe(false);
    for (const k of CONTENT_KINDS) if (k.id !== "leccion" && k.id !== "concepto") expect(givesEvidence(k.id), k.id).toBe(true);
  });

  it("la etiqueta de cada caso de empresa es compatible con las áreas con las que se escribió", () => {
    // Las diez áreas de antes no tenían una para innovación ni para expansión: esos casos se escribieron como
    // «estrategia». En el catálogo nuevo, producto y expansión están en Crecimiento; por eso «estrategia» admite ambas.
    const AREA: Record<Area, string[]> = {
      personas: ["liderazgo"], estrategia: ["estrategia", "crecimiento"], finanzas: ["finanzas"], clientes: ["crecimiento"], operacion: ["operaciones"],
      cultura: ["liderazgo", "riesgo"], etica: ["riesgo"], comunicacion: ["liderazgo", "riesgo"], negociacion: ["liderazgo"], alineacion: ["estrategia", "liderazgo"],
    };
    for (const c of COMPANIES) for (const i of c.items) {
      const t = tagOf("caso", `${c.id}:${i.id}`)!;
      const allowed = new Set(i.areas.flatMap((a) => AREA[a]));
      expect([t.academy, ...t.secondary].some((a) => allowed.has(a)), `${c.id}:${i.id}`).toBe(true);
    }
  });
});

describe("clasificación · búsquedas que usan las pantallas", () => {
  it("un asunto de una partida encuentra su etiqueta, sea de la empresa o del banco", () => {
    expect(tagOfItem("cumbre", "d2-supernorte")).toEqual(tagOf("caso", "cumbre:d2-supernorte"));
    expect(tagOfItem("forja", bankItemId("forja", "retiro", 1))).toEqual(tagOf("banco", "retiro"));
    expect(tagOfItem("cumbre", "no-existe")).toBeUndefined();
    for (const key of Object.keys(CASOS)) {
      const [company, item] = key.split(":");
      expect(tagOfItem(company, item), key).toBeDefined();
    }
  });

  it("los trece temas de Academy de antes llevan a habilidades del catálogo nuevo", () => {
    expect(TRACK_IDS.slice().sort()).toEqual(inv.rutas);
    for (const t of TRACK_IDS) {
      expect(skillsOfTrack(t).length, t).toBeGreaterThan(0);
      for (const s of skillsOfTrack(t)) expect(skillById(s), `${t} · ${s}`).toBeDefined();
    }
    expect(skillsOfTrack("no-existe")).toEqual([]);
  });

  it("las ocho competencias del cálculo anterior caen en una academia", () => {
    expect(OLD_COMPETENCY_IDS.slice().sort()).toEqual(inv.competencias);
    for (const c of OLD_COMPETENCY_IDS) expect(ACADEMY_IDS, c).toContain(academyOfCompetency(c));
    expect(academyOfCompetency("no-existe")).toBeUndefined();
  });
});

describe("cobertura · la medición cuadra", () => {
  it("las tablas suman lo mismo que las piezas", () => {
    const sum = (g: typeof cov.evaluable) => ACADEMY_IDS.reduce((n, a) => n + DEMANDS.reduce((m, d) => m + g[a][d], 0), 0);
    expect(sum(cov.evaluable)).toBe(cov.totals.evaluable);
    expect(sum(cov.theory)).toBe(cov.totals.theory);
    expect(cov.totals.evaluable + cov.totals.theory).toBe(all.length);
    expect(SKILLS.reduce((n, s) => n + cov.skills[s.id].main, 0)).toBe(cov.totals.evaluable);
  });

  it("las casillas del currículo son una por habilidad y nivel en que se exige", () => {
    expect(cov.totals.cells).toBe(SKILLS.reduce((n, s) => n + (6 - s.from + 1), 0));
    for (const d of DEMANDS) {
      expect(cov.cells[d].total).toBe(SKILLS.filter((s) => s.from <= d).length);
      expect(cov.cells[d].covered).toBeLessThanOrEqual(cov.cells[d].total);
    }
  });

  it("las seis academias tienen actividades evaluables", () => {
    for (const a of ACADEMY_IDS) expect(DEMANDS.reduce((n, d) => n + cov.evaluable[a][d], 0), a).toBeGreaterThan(0);
  });
});

describe("clasificación · documento", () => {
  const md = classificationMarkdown();

  it("lista todas las piezas y no deja ninguna sin clasificar", () => {
    for (const p of all) expect(md, p.id).toContain(`\`${p.id}\``);
    expect(md).not.toContain("Sin clasificar");
  });

  it("no usa textos vetados ni símbolos decorativos", () => {
    expect(md).not.toMatch(/de cero a ceo|\blibro\b/i);
    expect(md).not.toMatch(/pr[oó]ximamente|coming soon/i);
    expect(md).not.toMatch(/[\p{Extended_Pictographic}\u2605\u2606\u2713\u2717]/u);
  });

  it.runIf(!!process.env.CLASIFICACION_DOC)("escribe docs/metis2/03-clasificacion.md", () => {
    writeFileSync(DOC, md);
  });

  it.runIf(!process.env.CLASIFICACION_DOC)("docs/metis2/03-clasificacion.md está al día", () => {
    expect(existsSync(DOC)).toBe(true);
    expect(readFileSync(DOC, "utf8")).toBe(md);
  });
});
