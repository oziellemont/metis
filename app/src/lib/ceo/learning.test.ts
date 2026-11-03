import { describe, expect, it } from "vitest";
import { effectOf, entries, packOf } from "./engine";
import { playSeason, classicStart } from "./season-sim";
import { decisionLesson } from "./learning";
import { ARCHETYPE_CONCEPTS, CASE_CONCEPTS, CONCEPTS, CONCEPT_LESSON, caseConceptOf } from "./concepts";
import { LESSONS, lessonById } from "./lessons";
import { COMPANIES } from "./companies";
import { bankItems } from "./cases/bank";
import type { KpiKey } from "./types";

const BANNED = /\b(correcta|incorrecta|equivocad[oa]|la mejor opción|la respuesta buena|libro)\b/i;
const GENERIC = /un buen líder debe|es importante considerar|siempre hay que/i;
const COMPANY_IDS = ["cumbre", "forja", "brasa", "kubit", "puntomadero", "vertice"];

describe("lo que deja cada decisión (aprendizaje V2)", () => {
  for (const c of COMPANY_IDS) {
    it(`${c}: cada asunto cerrado explica ganancias, costos, riesgo, concepto y otro camino sin calificar`, () => {
      for (const strat of ["azar", "mejor_score", "peor_score", "contesta_la_mitad"]) {
        const r = playSeason(classicStart(c), strat, `${c}|aprende|${strat}`);
        const pack = packOf(r.state);
        const closed = entries(r.state, r.at).filter((e) => e.status === "decidido" || e.status === "vencido");
        expect(closed.length).toBeGreaterThan(0);
        for (const e of closed) {
          const l = decisionLesson(r.state, e, pack, r.at)!;
          expect(l).not.toBeNull();
          expect(l.principle).toBe(e.item.bitacora.nota);
          // Lo ganado y lo sacrificado coinciden con el efecto oficial del motor.
          const eff = effectOf(r.state, e);
          const g = l.gained.map((x) => x.text), sc = l.sacrificed.map((x) => x.text);
          for (const k of Object.keys(eff) as KpiKey[]) {
            const d = eff[k] ?? 0;
            if (d > 0) expect(g).toContain(`${pack.kpiLabel[k]} +${d}`);
            if (d < 0) expect(sc).toContain(`${pack.kpiLabel[k]} ${d}`);
          }
          // Piezas cortas: la tarjeta se lee de un vistazo.
          for (const t of [...g, ...sc]) expect(t.length).toBeLessThanOrEqual(42);
          // Siempre hay concepto concreto con nombre (todos los casos lo tienen asignado).
          expect(l.learned.name).toBeTruthy();
          // Siempre hay otro camino (cualquier otra opción, no solo las recomendadas), distinto al elegido.
          expect(l.otherPath).not.toBeNull();
          if (e.option) expect(l.otherPath!.option).not.toBe(e.option.text.trim());
          const all = [...g, ...sc, ...l.risks, l.otherPath!.tradeoff, l.otherPath!.whenSense ?? "", l.learned.applied].join(" ");
          expect(all).not.toMatch(BANNED);
          if (e.status === "vencido") expect(sc.join(" ")).toMatch(/iniciativa/);
        }
      }
    });
  }
});

describe("conceptos de dirección por caso", () => {
  it("los 103 casos propios y todos los arquetipos del banco enseñan un concepto concreto", () => {
    const missing: string[] = [];
    for (const p of COMPANIES) {
      for (const it of [...p.items, ...bankItems(p)]) if (!caseConceptOf(it.id)) missing.push(it.id);
    }
    expect(missing).toEqual([]);
  });
  it("cada concepto asignado existe, tiene definición y la aplicación no es genérica", () => {
    for (const cc of [...Object.values(CASE_CONCEPTS), ...Object.values(ARCHETYPE_CONCEPTS)]) {
      const c = CONCEPTS[cc.concept];
      expect(c, cc.concept).toBeTruthy();
      expect(c.definition.length).toBeGreaterThan(80);
      expect(cc.applied.length).toBeGreaterThan(80);
      expect(cc.applied).not.toMatch(GENERIC);
      expect(`${c.definition} ${cc.applied}`).not.toMatch(BANNED);
    }
  });
  it("no hay casos asignados que no existan (evita conceptos huérfanos)", () => {
    const ids = new Set(COMPANIES.flatMap((p) => p.items.map((i) => i.id)));
    for (const id of Object.keys(CASE_CONCEPTS)) expect(ids.has(id), id).toBe(true);
  });
  it("hay variedad: el catálogo cubre finanzas, estrategia, negociación y personas", () => {
    const used = new Set([...Object.values(CASE_CONCEPTS), ...Object.values(ARCHETYPE_CONCEPTS)].map((x) => x.concept));
    for (const k of ["costo_oportunidad", "liquidez", "apalancamiento", "batna", "piramide", "goodhart", "piloto", "hundidos"]) expect(used.has(k), k).toBe(true);
    expect(used.size).toBeGreaterThanOrEqual(40);
  });
});

it("un asunto que no se ha cerrado no tiene lección", () => {
  const s = classicStart("cumbre")();
  const e = entries(s, s.startedAt ?? Date.now())[0];
  if (e) expect(decisionLesson(s, { ...e, status: "pendiente" }, packOf(s))).toBeNull();
});

describe("cada concepto lleva a su lección de Academy", () => {
  it("todos los conceptos tienen una lección que existe, y no sobran entradas", () => {
    for (const id of Object.keys(CONCEPTS)) expect(lessonById(CONCEPT_LESSON[id] ?? ""), id).toBeTruthy();
    for (const id of Object.keys(CONCEPT_LESSON)) expect(CONCEPTS[id], id).toBeTruthy();
  });
  it("los conceptos se reparten en muchas lecciones (no todo apunta a una sola)", () => {
    const used = new Set(Object.values(CONCEPT_LESSON));
    expect(used.size).toBeGreaterThanOrEqual(18);
    expect(used.size / LESSONS.length).toBeGreaterThan(0.7);
  });
  it("conceptos clave van a la lección que los explica", () => {
    expect(CONCEPT_LESSON.liquidez).toBe("finanzas-2");
    expect(CONCEPT_LESSON.apalancamiento).toBe("finanzas");
    expect(CONCEPT_LESSON.hundidos).toBe("innovacion-2");
    expect(CONCEPT_LESSON.batna).toBe("negociacion");
    expect(CONCEPT_LESSON.goodhart).toBe("alineacion-2");
    expect(CONCEPT_LESSON.piramide).toBe("comunicacion");
    expect(CONCEPT_LESSON.crisis_com).toBe("crisis");
  });
  it("la tarjeta de cada decisión trae su lección", () => {
    for (const c of COMPANY_IDS) {
      const r = playSeason(classicStart(c), "azar", `${c}|academy`);
      const pack = packOf(r.state);
      const closed = entries(r.state, r.at).filter((e) => e.status === "decidido" || e.status === "vencido");
      for (const e of closed) expect(lessonById(decisionLesson(r.state, e, pack, r.at)!.learned.lesson ?? ""), e.item.id).toBeTruthy();
    }
  });
});
