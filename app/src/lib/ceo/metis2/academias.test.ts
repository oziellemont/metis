/**
 * MÊTIS 2.0 · pruebas del catálogo de aprendizaje.
 *
 * `academias-ids.json` guarda los identificadores publicados. Las evidencias de cada persona apuntan a ellos,
 * así que ninguno puede desaparecer ni cambiar de nombre. Agregar sí se permite.
 * Para volver a grabar la lista después de AGREGAR: CATALOGO=grabar npx vitest run scripts/catalogo-metis2.test.ts
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACADEMIES, ACADEMY_IDS, CATALOG_VERSION, DEMANDS, FORMATS, MASTERY_STAGES, MIN_PRIORITY_TOPICS, SKILLS, SKILL_IDS, TOPICS, TOPIC_IDS, TRAMOS,
  allPrereqs, checkTopics, formatById, levelLabel, skillById, skillsAt, skillsOf, topicAcademy, tramoOf,
} from "./academias";

const SAVED = JSON.parse(readFileSync(join(__dirname, "academias-ids.json"), "utf8")) as { academias: string[]; habilidades: string[]; temas: string[]; formatos: string[] };

describe("catálogo: academias", () => {
  it("son exactamente seis, con los nombres acordados", () => {
    expect(ACADEMIES.map((a) => a.name)).toEqual(["Estrategia", "Finanzas", "Liderazgo", "Operaciones", "Crecimiento", "Riesgo y gobierno"]);
    expect(new Set(ACADEMY_IDS).size).toBe(6);
  });

  it("la versión del catálogo es un entero positivo", () => {
    expect(Number.isInteger(CATALOG_VERSION) && CATALOG_VERSION >= 1).toBe(true);
  });
});

describe("catálogo: niveles visibles", () => {
  it("los seis tramos llevan los nombres del documento, en orden", () => {
    expect(TRAMOS.map((t) => `${t.n} ${t.name}`)).toEqual(["1 Reconocer", "2 Aplicar", "3 Analizar", "4 Integrar", "5 Transferir", "6 Dirigir y profundizar"]);
    expect(DEMANDS).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("el nivel general no tiene final: 7, 12 o 40 siguen en el último tramo y conservan su número", () => {
    for (const l of [6, 7, 12, 40]) expect(tramoOf(l).name).toBe("Dirigir y profundizar");
    expect(levelLabel(7)).toBe("Nivel 7 · Dirigir y profundizar");
    expect(levelLabel(40)).toBe("Nivel 40 · Dirigir y profundizar");
    expect(levelLabel(3)).toBe("Nivel 3 · Analizar");
  });

  it("un nivel fuera de rango por abajo se trata como Nivel 1", () => {
    expect(levelLabel(0)).toBe("Nivel 1 · Reconocer");
    expect(levelLabel(-4)).toBe("Nivel 1 · Reconocer");
    expect(tramoOf(2.9).n).toBe(2);
  });

  it("la escala interna de dominio va de 0 a 5 y es distinta de los niveles visibles", () => {
    expect(MASTERY_STAGES.map((m) => m.n)).toEqual([0, 1, 2, 3, 4, 5]);
    const tramoNames = TRAMOS.map((t) => t.name);
    for (const m of MASTERY_STAGES) expect(tramoNames).not.toContain(m.name);
  });
});

describe("catálogo: habilidades", () => {
  it("los identificadores son únicos y llevan el prefijo de su academia", () => {
    expect(new Set(SKILL_IDS).size).toBe(SKILL_IDS.length);
    const prefix: Record<string, string> = { estrategia: "est", finanzas: "fin", liderazgo: "lid", operaciones: "ope", crecimiento: "cre", riesgo: "rie" };
    for (const s of SKILLS) {
      expect(s.id, s.id).toMatch(/^[a-z]{3}\.[a-z_]+$/);
      expect(s.id.split(".")[0], s.id).toBe(prefix[s.academy]);
      expect(s.name.length, s.id).toBeGreaterThan(3);
      expect(s.what.length, s.id).toBeGreaterThan(20);
    }
  });

  it("cada academia tiene entre 8 y 10 habilidades", () => {
    for (const a of ACADEMY_IDS) {
      const n = skillsOf(a).length;
      expect(n, a).toBeGreaterThanOrEqual(8);
      expect(n, a).toBeLessThanOrEqual(10);
    }
  });

  it("las seis academias están presentes en todos los niveles, desde el 1", () => {
    for (const level of [1, 2, 3, 4, 5, 6, 9]) {
      for (const a of ACADEMY_IDS) expect(skillsAt(level, a).length, `${a} nivel ${level}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("al subir de nivel nunca desaparece una habilidad", () => {
    for (let l = 1; l < 8; l++) {
      const now = skillsAt(l).map((s) => s.id);
      const next = skillsAt(l + 1).map((s) => s.id);
      for (const id of now) expect(next, `${id} de nivel ${l} a ${l + 1}`).toContain(id);
    }
    expect(skillsAt(6).length).toBe(SKILLS.length);
  });

  it("los prerrequisitos existen, no se apuntan a sí mismos y no aparecen después que la habilidad", () => {
    for (const s of SKILLS) {
      for (const p of s.pre) {
        const pre = skillById(p);
        expect(pre, `${s.id} pide ${p}`).toBeDefined();
        expect(p, s.id).not.toBe(s.id);
        expect(pre!.from, `${p} aparece después que ${s.id}`).toBeLessThanOrEqual(s.from);
      }
      expect(new Set(s.pre).size, s.id).toBe(s.pre.length);
    }
  });

  it("no hay ciclos de prerrequisitos", () => {
    for (const s of SKILLS) expect(allPrereqs(s.id), s.id).not.toContain(s.id);
  });

  it("en el Nivel 1 todo lo que se pide como prerrequisito también es de Nivel 1", () => {
    for (const s of skillsAt(1)) for (const p of allPrereqs(s.id)) expect(skillById(p)!.from, `${s.id} -> ${p}`).toBe(1);
  });

  it("allPrereqs devuelve directos e indirectos sin repetir", () => {
    expect(allPrereqs("fin.valor").sort()).toEqual(["fin.balance", "fin.financiamiento", "fin.flujo", "fin.inversion", "fin.lenguaje"]);
    expect(allPrereqs("est.fundamentos")).toEqual([]);
    expect(allPrereqs("no.existe")).toEqual([]);
  });
});

describe("catálogo: temas prioritarios", () => {
  it("los identificadores son únicos y cada tema apunta a habilidades que existen", () => {
    expect(new Set(TOPIC_IDS).size).toBe(TOPIC_IDS.length);
    expect(new Set(TOPICS.map((t) => t.name)).size).toBe(TOPICS.length);
    for (const t of TOPICS) {
      expect(t.id, t.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(t.skills.length, t.id).toBeGreaterThanOrEqual(1);
      for (const s of t.skills) expect(skillById(s), `${t.id} -> ${s}`).toBeDefined();
    }
  });

  it("los temas no son las academias: hay muchos más y ninguno se llama igual", () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(30);
    const names = ACADEMIES.map((a) => a.name.toLowerCase());
    for (const t of TOPICS) expect(names).not.toContain(t.name.toLowerCase());
  });

  it("cada academia tiene al menos cinco temas y toda habilidad se alcanza desde algún tema", () => {
    for (const a of ACADEMY_IDS) expect(TOPICS.filter((t) => topicAcademy(t) === a).length, a).toBeGreaterThanOrEqual(5);
    const reached = new Set(TOPICS.flatMap((t) => t.skills));
    expect(SKILL_IDS.filter((id) => !reached.has(id))).toEqual([]);
  });

  it("la selección exige al menos cinco temas válidos y distintos", () => {
    expect(MIN_PRIORITY_TOPICS).toBe(5);
    const five = ["flujo-de-caja", "negociacion", "pricing", "liderar-equipos", "estrategia-competitiva"];
    expect(checkTopics(five)).toEqual({ ok: true, valid: five, missing: 0 });
    expect(checkTopics(five.slice(0, 4))).toMatchObject({ ok: false, missing: 1 });
    expect(checkTopics([...five.slice(0, 4), "pricing"])).toMatchObject({ ok: false, missing: 1 });
    expect(checkTopics([...five.slice(0, 4), "no-existe"])).toMatchObject({ ok: false, missing: 1 });
    expect(checkTopics([])).toEqual({ ok: false, valid: [], missing: 5 });
  });
});

describe("catálogo: formatos de actividad", () => {
  it("leer una lección no produce evidencia; los demás formatos sí", () => {
    expect(formatById("leccion").evidence).toBe(false);
    for (const f of FORMATS.filter((x) => x.id !== "leccion")) expect(f.evidence, f.id).toBe(true);
  });

  it("los minutos son un rango válido", () => {
    for (const f of FORMATS) {
      expect(f.minutes[0], f.id).toBeGreaterThan(0);
      expect(f.minutes[1], f.id).toBeGreaterThanOrEqual(f.minutes[0]);
    }
    expect(new Set(FORMATS.map((f) => f.id)).size).toBe(FORMATS.length);
  });
});

describe("catálogo: identificadores publicados (se conservan)", () => {
  const now = { academias: ACADEMY_IDS as string[], habilidades: SKILL_IDS, temas: TOPIC_IDS, formatos: FORMATS.map((f) => f.id as string) };

  it("ninguno desapareció ni cambió de nombre", () => {
    for (const k of Object.keys(SAVED) as (keyof typeof SAVED)[]) {
      expect(SAVED[k].filter((id) => !now[k].includes(id)), k).toEqual([]);
    }
  });

  it("la lista grabada está al día con el catálogo", () => {
    for (const k of Object.keys(now) as (keyof typeof now)[]) expect([...SAVED[k]].sort(), k).toEqual([...now[k]].sort());
  });
});
