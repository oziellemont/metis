import { describe, expect, it } from "vitest";
import { advance, apply, capacityNow, createCompany } from "./engine";
import { availableCases, whyNot, type Decision } from "./chains";
import { CHAIN_C, GROWTH_CASES, caseById, tagsOf } from "./cases";
import { LINES, lineIdOf, profileOf } from "./models";
import { adaptiveOrder, coachLine, competencyProfile, growthLesson, playerLevel } from "./learning";
import { impactOf } from "./ops";
import { growthTemplateFor } from "./combos";
import { isPlayableCombo, searchIndustries } from "../career/taxonomy";
import type { GrowthState } from "./types";

const FORBIDDEN = /de cero a ceo|\blibro\b|próximamente|en preparación|más adelante:/i;

describe("motor multimodelo · líneas de negocio", () => {
  it("cada familia tiene una línea por defecto y las partidas viejas (sin línea) siguen igual", () => {
    const r = createCompany("restaurante_emergente", "a");
    const m = createCompany("manufactura_emergente", "a");
    expect(lineIdOf(r)).toBe("restaurante");
    expect(lineIdOf(m)).toBe("estampado");
    const old = { ...m, line: undefined } as GrowthState;
    expect(profileOf(old).id).toBe("estampado");
    expect(Object.keys(LINES).sort()).toEqual(["aceria", "estampado", "restaurante"]);
  });

  it("acería: la plantilla arranca como manufactura, línea acería, con hornos y toneladas", () => {
    const s = createCompany("aceria_emergente", "a");
    expect(s.family).toBe("manufactura");
    expect(s.line).toBe("aceria");
    expect(profileOf(s).mode).toBe("contratos");
    expect(profileOf(s).asset?.resource).toBe("horno");
    const cap = capacityNow(s);
    expect(JSON.stringify(cap)).toMatch(/\d/);
  });

  it("las dos acerías no quiebran en un año sin decisiones", () => {
    for (const tpl of ["aceria_emergente", "aceria_consolidada"]) for (const seed of ["a", "b"]) {
      const s = advance(createCompany(tpl, seed), 360);
      expect(Math.min(...s.months.map((m) => m.cashEnd)), `${tpl}/${seed}`).toBeGreaterThan(0);
      expect(s.months.slice(-3).reduce((a, m) => a + m.operating, 0)).toBeGreaterThan(0);
    }
  }, 60_000);

  it("la acería recibe sus propios casos y no los de estampado", () => {
    const s = createCompany("aceria_emergente", "a");
    const ids = availableCases(s, []).map((c) => c.id);
    expect(ids).toContain("gc1_cliente");
    expect(ids.some((id) => id.startsWith("gb"))).toBe(false);
    expect(whyNot(s, "gb1_cliente", []).join(" ")).toMatch(/industria/);
    const m = createCompany("manufactura_emergente", "a");
    expect(availableCases(m, []).some((c) => c.id.startsWith("gc"))).toBe(false);
  });

  it("no se puede contratar un puesto de otra línea (operador de prensa en una acería)", () => {
    const s = createCompany("aceria_emergente", "a");
    const site = s.sites[0].id;
    expect(apply(s, { type: "hire", id: "x1", roleId: "operador", siteId: site }).ok).toBe(false);
    expect(apply(s, { type: "hire", id: "x2", roleId: "operador_aceria", siteId: site }).ok).toBe(true);
  });
});

describe("casos etiquetados y aprendizaje", () => {
  it("todo caso tiene función, competencias, lección e industria", () => {
    for (const c of GROWTH_CASES) {
      const t = tagsOf(c);
      expect(t.funcion, c.id).toBeTruthy();
      expect(t.competencias.length, c.id).toBeGreaterThan(0);
      expect(c.lesson.length, c.id).toBeGreaterThan(20);
      expect(t.industria, c.id).toBeTruthy();
    }
  });

  it("la cadena de acería no trae textos prohibidos y es toda de acería", () => {
    const s = createCompany("aceria_emergente", "a");
    for (const c of CHAIN_C) {
      expect(c.requires.line).toBe("aceria");
      const txt = [c.subject, c.from, c.lesson, ...c.body(s), ...c.options.map((o) => `${o.text} ${o.outcome(s)}`)].join(" ");
      expect(txt).not.toMatch(FORBIDDEN);
    }
  });

  it("growthLesson explica qué ganaste, qué sacrificaste y el principio", () => {
    const s = createCompany("aceria_emergente", "a");
    const c = caseById("gc1_cliente")!;
    for (const o of c.options) {
      const L = growthLesson(s, c, o.id, (id) => impactOf(s, c.id, id, []))!;
      expect(L).not.toBeNull();
      expect(["solida", "aceptable", "riesgosa"]).toContain(L.verdict);
      expect(L.gained.length).toBeGreaterThan(0);
      expect(L.principle).toBe(c.lesson);
      expect(L.tags.industria).toMatch(/acería/);
      expect([...L.gained, ...L.sacrificed, L.otherPath ?? "", L.principle].join(" ")).not.toMatch(FORBIDDEN);
      if (o.score < 3) expect(L.otherPath).toBeTruthy();
    }
  });

  it("orden adaptativo: determinista, liquidez primero y sin cambios para el jugador nuevo", () => {
    const cases = [...GROWTH_CASES].reverse();
    expect(adaptiveOrder(cases, []).map((c) => c.id)).toEqual(adaptiveOrder(cases, []).map((c) => c.id));
    expect(adaptiveOrder(cases, [])[0].chain).toBe("liquidez");
    expect(adaptiveOrder(cases, []).length).toBe(cases.length);
    const ops = GROWTH_CASES.filter((c) => c.chain === "operacion");
    expect(adaptiveOrder(ops, []).map((c) => c.id)).toEqual(ops.map((c) => c.id));
    expect(playerLevel([])).toBe("nuevo");
    expect(coachLine([])).toBeNull();
  });

  it("con decisiones flojas aparece qué entrenar; con decisiones sólidas, presión", () => {
    const pick = (score: number): Decision[] => GROWTH_CASES.filter((c) => c.chain === "A" || c.chain === "B").slice(0, 4)
      .map((c, i) => ({ caseId: c.id, key: c.id, optionId: (c.options.find((o) => o.score === score) ?? c.options[0]).id, day: i }));
    const weak = pick(0).length ? pick(0) : pick(1);
    expect(competencyProfile(weak).length).toBeGreaterThan(0);
    expect(["aprendiendo", "solido", "experto"]).toContain(playerLevel(weak));
    expect(coachLine(weak)).toBeTruthy();
    expect(playerLevel(pick(3))).toBe("experto");
  });
});

describe("Manufactura como industria completa", () => {
  it("Metálica básica (acería) es jugable en StartUp y Consolidada", () => {
    expect(growthTemplateFor("manufactura", "metalica_basica", "pyme")).toBe("aceria_compacta_v2");
    expect(growthTemplateFor("manufactura", "metalica_basica", "establecida")).toBe("miniaceria_integrada_v2");
    expect(isPlayableCombo("manufactura", "metalica_basica", "establecida")).toBe(true);
    expect(searchIndustries("acería")[0]?.industryId).toBe("metalica_basica");
    expect(searchIndustries("acero")[0]?.industryId).toBe("metalica_basica");
    expect(searchIndustries("autopartes")[0]?.industryId).toBe("autopartes");
  });
});
