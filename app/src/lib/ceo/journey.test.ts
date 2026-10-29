import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { replay } from "./replay";
import { migrate, newState, xpOf } from "./engine";
import { COMPANIES } from "./companies";
import { LESSONS, TRACKS, trackOf } from "./lessons";
import { THEMES } from "./dilemmas";
import type { Area, CeoState } from "./types";
import { AREA_TO, COMPETENCY_IDS, THEME_TO, TRACK_TO, competenciesOfItem, masteryLevelOf, masteryOf } from "./mastery";
import { LEGACY_FLOOR, STAGES, STAGE_RULES, appoint, enrollJourney, journeyOf, recordBoard, requirementsFor, stageOf } from "./journey";
import type { Golden } from "./golden/play";

const DIR = join(__dirname, "golden", "data");
const golden = (id: string) => {
  const g: Golden = JSON.parse(readFileSync(join(DIR, `${id}.json`), "utf8"));
  return { state: replay(g.actions).state, at: g.checkpoints[g.checkpoints.length - 1].at };
};
const ALL = readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
const T0 = Date.UTC(2026, 0, 5, 15);
const withLessons = (s: CeoState, ids: string[], at = T0) => ({ ...s, lessons: Object.fromEntries(ids.map((id) => [id, at])) });
/** Inscribe como jugador nuevo (sin historia) y después le «pega» la carrera de una partida dorada. */
const freshWith = (s: CeoState): CeoState => ({ ...s, journey: { stage: 0, enrolledAt: T0, appointments: [] } });

describe("Mastery Engine", () => {
  it("las 8 competencias y los 6 niveles con sus umbrales aprobados", () => {
    expect(COMPETENCY_IDS).toHaveLength(8);
    expect([0, 19, 20, 39, 40, 54, 55, 69, 70, 84, 85, 100].map((v) => masteryLevelOf(v).name)).toEqual(
      ["Novice", "Novice", "Developing", "Developing", "Competent", "Competent", "Solid", "Solid", "Advanced", "Advanced", "Expert", "Expert"]);
  });

  it("todo el contenido apunta a alguna competencia (áreas, temas de Academy, dilemas y cada asunto)", () => {
    const areas: Area[] = ["personas", "estrategia", "finanzas", "clientes", "operacion", "cultura", "etica", "comunicacion", "negociacion", "alineacion"];
    for (const a of areas) expect(AREA_TO[a]?.length, a).toBeGreaterThan(0);
    for (const t of TRACKS) expect(TRACK_TO[t.id]?.length, t.id).toBeGreaterThan(0);
    for (const l of LESSONS) expect(TRACK_TO[trackOf(l).track]?.length, l.id).toBeGreaterThan(0);
    for (const th of Object.keys(THEMES)) expect(THEME_TO[th as keyof typeof THEME_TO]?.length, th).toBeGreaterThan(0);
    for (const p of COMPANIES) for (const it of p.items) expect(competenciesOfItem(it).length, `${p.id}/${it.id}`).toBeGreaterThan(0);
    // y cada competencia tiene asuntos reales que la miden
    const covered = new Set(COMPANIES.flatMap((p) => p.items.flatMap(competenciesOfItem)));
    for (const c of COMPETENCY_IDS) expect(covered.has(c), c).toBe(true);
  });

  it("jugador nuevo: todo en 0 (Novice)", () => {
    const m = masteryOf(newState(), T0);
    for (const c of COMPETENCY_IDS) { expect(m[c].value).toBe(0); expect(m[c].level.name).toBe("Novice"); }
  });

  it("leer no basta: todas las lecciones juntas dan como máximo 10 por competencia", () => {
    const m = masteryOf(withLessons(newState(), LESSONS.map((l) => l.id)), T0);
    for (const c of COMPETENCY_IDS) expect(m[c].value).toBeLessThanOrEqual(10);
    expect(m.personas.value).toBe(10);
  });

  it("decidir bien da más dominio que decidir mal, en cada competencia con evidencia", () => {
    const best = golden("cumbre-mejor"), worst = golden("cumbre-peor");
    const mb = masteryOf(best.state, best.at), mw = masteryOf(worst.state, worst.at);
    for (const c of COMPETENCY_IDS) if (mb[c].n >= 2 && mw[c].n >= 2) expect(mb[c].value, c).toBeGreaterThan(mw[c].value);
  });

  it("dejar vencer asuntos cuenta como evidencia de calidad 0", () => {
    const g = golden("cumbre-vencidos");
    const m = masteryOf(g.state, g.at);
    expect(Object.values(m).some((c) => c.quality !== null && c.quality < 0.5)).toBe(true);
  });

  it("el XP no compra dominio: un jugador con miles de XP en lecciones sigue en Novice", () => {
    const s = withLessons({ ...newState(), rulesVersion: 1 }, LESSONS.map((l) => l.id));
    expect(xpOf(s, T0)).toBeGreaterThanOrEqual(700);
    for (const c of COMPETENCY_IDS) expect(masteryOf(s, T0)[c].level.name).toBe("Novice");
  });

  it("evidencia futura (IA, prácticas) suma pero nunca pasa de 100", () => {
    const g = golden("carrera-legendaria");
    const base = masteryOf(g.state, g.at);
    const up = masteryOf(g.state, g.at, { personas: 500, finanzas: 5 });
    expect(up.personas.value).toBe(100);
    expect(up.finanzas.value).toBe(Math.min(100, base.finanzas.value + 5));
    expect(up.estrategia.value).toBe(base.estrategia.value);
  });

  it.each(ALL)("%s: valores enteros 0–100, deterministas y sin modificar el estado", (id) => {
    const g = golden(id);
    const before = JSON.stringify(g.state);
    const a = masteryOf(g.state, g.at), b = masteryOf(g.state, g.at);
    expect(a).toEqual(b);
    for (const c of COMPETENCY_IDS) { expect(Number.isInteger(a[c].value)).toBe(true); expect(a[c].value).toBeGreaterThanOrEqual(0); expect(a[c].value).toBeLessThanOrEqual(100); }
    expect(JSON.stringify(g.state)).toBe(before);
  });
});

describe("Executive Journey", () => {
  it("6 etapas en inglés, en orden, con XP mínimo creciente", () => {
    expect(STAGES.map((s) => s.name)).toEqual(["Emerging Leader", "Functional Manager", "Business Unit Director", "Chief Operating Officer", "Chief Executive Officer", "Global CEO"]);
    const xp = STAGE_RULES.slice(1).map((r) => r.xp!);
    expect(xp).toEqual([...xp].sort((a, b) => a - b));
  });

  it("un jugador nuevo empieza como Emerging Leader y sin distinción fundadora", () => {
    const s = enrollJourney(newState(), T0);
    expect(stageOf(s)).toBe(0);
    expect(s.journey!.founder).toBeUndefined();
    expect(journeyOf(s, T0).name).toBe("Emerging Leader");
    expect(enrollJourney(s, T0 + 1)).toBe(s); // solo se inscribe una vez
  });

  it("usuarios actuales: nadie baja de su rango anterior y queda la distinción fundadora", () => {
    for (const id of ALL) {
      const g = golden(id);
      const xp = xpOf(g.state, g.at);
      const e = enrollJourney(g.state, g.at);
      const rank = e.journey!.founder?.rank ?? 0;
      expect(stageOf(e), id).toBe(LEGACY_FLOOR[rank]);
      expect(xpOf(e, g.at), id).toBe(xp); // el XP se conserva
      expect(e.career, id).toBe(g.state.career); // el historial se conserva
    }
    const ceo = enrollJourney(golden("cumbre-mejor").state, golden("cumbre-mejor").at);
    expect(ceo.journey!.founder!.name).toBe("CEO de consejo");
    expect(journeyOf(ceo, T0).name).toBe("Chief Executive Officer");
  });

  it("el piso fundador se respeta aunque la etapa guardada venga más baja", () => {
    const g = golden("brasa-mejor");
    const e = enrollJourney(g.state, g.at);
    expect(stageOf({ ...e, journey: { ...e.journey!, stage: 0 } })).toBe(stageOf(e));
  });

  it("el XP por sí solo nunca asciende", () => {
    const s = withLessons(enrollJourney({ ...newState(), rulesVersion: 1 }, T0), LESSONS.map((l) => l.id), T0 + 1000);
    expect(xpOf(s, T0)).toBeGreaterThanOrEqual(STAGE_RULES[1].xp!);
    const v = journeyOf(s, T0);
    expect(v.ready).toBe(false);
    expect(v.requirements.find((r) => r.id === "xp")!.ok).toBe(true);
    expect(appoint(s, T0)).toBe(s);
  });

  it("nombramiento: con todos los requisitos se asciende UNA etapa, y queda registrado", () => {
    const g = golden("forja-mejor");
    const s = freshWith(g.state);
    const v = journeyOf(s, g.at);
    expect(v.ready).toBe(true);
    const a = appoint(s, g.at);
    expect(stageOf(a)).toBe(1);
    expect(a.journey!.appointments).toEqual([{ stage: 1, at: g.at }]);
    expect(appoint(a, g.at)).toBe(a); // la etapa 3 pide 2 empresas y un reto de cambio
  });

  it("requisitos de Functional Manager: lo que falta se explica con la competencia más débil", () => {
    const g = golden("brasa-mejor");
    const v = journeyOf(freshWith(g.state), g.at);
    expect(v.next!.name).toBe("Functional Manager");
    expect(v.requirements.map((r) => r.id)).toEqual(["passed", "atLeast-40", "xp"]);
    const comp = v.requirements.find((r) => r.id === "atLeast-40")!;
    expect(comp.ok).toBe(false);
    expect(comp.missing).toHaveLength(2);
    expect(v.focus).not.toBeNull();
  });

  it("Chief Executive Officer exige la junta ante el Consejo; registrarla la cumple", () => {
    const g = golden("carrera-legendaria");
    const s = freshWith(g.state);
    const req = () => requirementsFor(4, s2, g.at).find((r) => r.id === "board")!;
    let s2 = s;
    expect(req().ok).toBe(false);
    expect(req().href).toBe("/ceo/junta");
    s2 = recordBoard(s, true, g.at);
    expect(req().ok).toBe(true);
  });

  it("Global CEO es la última etapa y abre The Executive Arena", () => {
    const s: CeoState = { ...newState(), journey: { stage: 5, enrolledAt: T0, appointments: [] } };
    const v = journeyOf(s, T0);
    expect(v.name).toBe("Global CEO");
    expect(v.next).toBeNull();
    expect(v.arena).toBe(true);
    expect(appoint(s, T0)).toBe(s);
  });

  it("guardar y leer conserva el Journey; si viene dañado se descarta sin romper nada", () => {
    const e = enrollJourney(golden("forja-mejor").state, T0);
    expect(migrate(JSON.parse(JSON.stringify(e))).journey).toEqual(e.journey);
    expect(migrate({ ...e, journey: { stage: "x" } }).journey).toBeUndefined();
    expect(migrate({ ...e, journey: null }).journey).toBeUndefined();
  });
});
