/**
 * MÊTIS 2.0 · pruebas de la matriz curricular y del documento de currículo.
 *
 * Para volver a escribir el documento después de cambiar el catálogo o la matriz:
 *   CURRICULO_DOC=1 npx vitest run src/lib/ceo/metis2/curriculo/curriculo.test.ts
 * Fuera de ese modo, la prueba verifica que `docs/metis2/01-curriculo.md` esté al día.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ACADEMY_IDS, DEMANDS, SKILLS, formatById, skillById, skillsOf } from "../academias";
import { EXAMPLES, PLANS, curriculumMarkdown, examplesOf, planOf, stepOf } from "./index";

const DOC = join(__dirname, "../../../../../../docs/metis2/01-curriculo.md");
const words = (s: string) => s.trim().split(/\s+/).length;

describe("matriz curricular: cobertura", () => {
  it("cada habilidad del catálogo tiene su plan, y no hay planes de habilidades que no existen", () => {
    expect(PLANS.map((p) => p.skill).sort()).toEqual(SKILLS.map((s) => s.id).sort());
    expect(new Set(PLANS.map((p) => p.skill)).size).toBe(PLANS.length);
  });

  it("cada habilidad dice qué se pide en todos los tramos desde que aparece, y en ninguno anterior", () => {
    for (const s of SKILLS) {
      const steps = planOf(s.id)!.steps;
      for (const d of DEMANDS) {
        if (d >= s.from) expect(steps[d], `${s.id} nivel ${d}`).toBeTruthy();
        else expect(steps[d], `${s.id} nivel ${d}`).toBeUndefined();
      }
    }
  });

  it("cada paso es una frase con contenido y no se repite dentro de la habilidad", () => {
    for (const p of PLANS) {
      const list = Object.values(p.steps) as string[];
      for (const t of list) {
        expect(words(t), `${p.skill}: ${t}`).toBeGreaterThanOrEqual(8);
        expect(t.endsWith("."), `${p.skill}: ${t}`).toBe(true);
      }
      expect(new Set(list).size, p.skill).toBe(list.length);
    }
  });

  it("del Nivel 6 en adelante se pide lo de «Dirigir y profundizar»", () => {
    expect(stepOf("fin.flujo", 9)).toBe(stepOf("fin.flujo", 6));
    expect(stepOf("fin.valor", 2)).toBeUndefined();
    expect(stepOf("no.existe", 1)).toBeUndefined();
  });
});

describe("matriz curricular: fundamentos del Nivel 1", () => {
  it("toda habilidad de Nivel 1 enseña vocabulario; las demás no llevan fundamentos", () => {
    for (const s of SKILLS) {
      const b = planOf(s.id)!.basics;
      if (s.from === 1) expect(b?.terms.length ?? 0, s.id).toBeGreaterThanOrEqual(4);
      else expect(b, s.id).toBeUndefined();
    }
  });

  it("en el Nivel 1 cada academia enseña vocabulario, documentos e indicadores", () => {
    for (const a of ACADEMY_IDS) {
      const basics = skillsOf(a).filter((s) => s.from === 1).map((s) => planOf(s.id)!.basics!);
      expect(basics.flatMap((b) => b.terms).length, `${a} vocabulario`).toBeGreaterThanOrEqual(15);
      expect(basics.flatMap((b) => b.documents ?? []).length, `${a} documentos`).toBeGreaterThanOrEqual(2);
      expect(basics.flatMap((b) => b.indicators ?? []).length, `${a} indicadores`).toBeGreaterThanOrEqual(1);
    }
  });

  it("Finanzas en Nivel 1 cubre los tres estados financieros y el presupuesto", () => {
    const docs = skillsOf("finanzas").filter((s) => s.from === 1).flatMap((s) => planOf(s.id)!.basics!.documents ?? []);
    for (const d of ["estado de resultados", "balance general", "flujo de efectivo", "presupuesto anual"]) expect(docs).toContain(d);
  });
});

describe("matriz curricular: ejemplos de actividad", () => {
  it("cada academia tiene un ejemplo por tramo, del 1 al 6", () => {
    for (const a of ACADEMY_IDS) expect(examplesOf(a).map((e) => e.level), a).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(EXAMPLES.map((e) => e.id)).size).toBe(EXAMPLES.length);
  });

  it("la habilidad principal es de la academia del ejemplo y todas existen y están presentes en ese nivel", () => {
    for (const e of EXAMPLES) {
      expect(skillById(e.skills[0])?.academy, e.id).toBe(e.academy);
      for (const s of e.skills) {
        const k = skillById(s);
        expect(k, `${e.id} -> ${s}`).toBeDefined();
        expect(k!.from, `${e.id}: ${s} aún no aparece en el nivel ${e.level}`).toBeLessThanOrEqual(e.level);
      }
      expect(new Set(e.skills).size, e.id).toBe(e.skills.length);
    }
  });

  it("una actividad tiene una academia principal y hasta dos secundarias", () => {
    for (const e of EXAMPLES) {
      const others = new Set(e.skills.map((s) => skillById(s)!.academy).filter((a) => a !== e.academy));
      expect(others.size, e.id).toBeLessThanOrEqual(2);
    }
  });

  it("la exigencia sube con el nivel: fundamentos solos al inicio, cruce de áreas desde «Integrar»", () => {
    for (const e of EXAMPLES) {
      const academies = new Set(e.skills.map((s) => skillById(s)!.academy));
      if (e.level === 1) expect(["ejercicio", "flash"], e.id).toContain(e.format);
      if (e.level === 4 || e.level === 6) expect(academies.size, e.id).toBeGreaterThanOrEqual(2);
      if (e.level === 5) expect(e.contexts.length, `${e.id}: transferir pide dos contextos`).toBeGreaterThanOrEqual(2);
      if (e.level === 6) expect(e.format, e.id).toBe("integrador");
      expect(formatById(e.format).evidence, e.id).toBe(true);
    }
  });

  it("cada ejemplo es una situación concreta, con petición y criterio de evidencia", () => {
    for (const e of EXAMPLES) {
      expect(words(e.situation), `${e.id} situación`).toBeGreaterThanOrEqual(20);
      expect(words(e.ask), `${e.id} petición`).toBeGreaterThanOrEqual(8);
      expect(words(e.evidence), `${e.id} evidencia`).toBeGreaterThanOrEqual(8);
      expect(e.contexts.length, e.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("los ejemplos recorren industrias variadas", () => {
    expect(new Set(EXAMPLES.flatMap((e) => e.contexts)).size).toBeGreaterThanOrEqual(25);
  });
});

describe("documento de currículo", () => {
  const md = curriculumMarkdown();

  it("incluye las seis academias, todas las habilidades y todos los ejemplos", () => {
    for (const s of SKILLS) expect(md, s.id).toContain(s.name);
    for (const e of EXAMPLES) expect(md, e.id).toContain(e.title);
    expect(md).toContain("6 y siguientes");
  });

  it("no usa textos vetados ni símbolos decorativos", () => {
    expect(md).not.toMatch(/de cero a ceo|\blibro\b/i);
    expect(md).not.toMatch(/pr[oó]ximamente|coming soon/i);
    expect(md).not.toMatch(/[\p{Extended_Pictographic}\u2605\u2606\u2713\u2717]/u);
  });

  it.runIf(!!process.env.CURRICULO_DOC)("escribe docs/metis2/01-curriculo.md", () => {
    writeFileSync(DOC, md);
  });

  it.runIf(!process.env.CURRICULO_DOC)("docs/metis2/01-curriculo.md está al día", () => {
    expect(existsSync(DOC)).toBe(true);
    expect(readFileSync(DOC, "utf8")).toBe(md);
  });
});
