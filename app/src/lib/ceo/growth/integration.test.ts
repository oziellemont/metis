/**
 * Growth Engine · pruebas de integración con la partida (fase 2).
 * Interruptor, onboarding de «Empresa emergente», puente a los 5 indicadores, persistencia por registro,
 * diario de jugadas, pausas y una sola fuente económica.
 */
import { describe, expect, it } from "vitest";
import { ALL_OFF, FLAG_KEYS } from "../flags";
import { DAY, H, KPI_KEYS, decideGrowthCase, growthDayOf, kpis, migrate, newState, packOf, reportDueOf, setupCompany, casesDoneOf } from "../engine";
import { businessOf } from "../business";
import { ruleSet, CONTINUOUS_RULES_VERSION } from "../rules";
import { applyAction, replay, type GameAction } from "../replay";
import { sanitizeAction } from "../journal";
import { OFFERED_ARCHETYPES } from "../career/setup";
import { isPlayableCombo } from "../career/taxonomy";
import { newCompanyProfile } from "../career/identity";
import { pauseCareer, resumeCareer } from "../cadence";
import { BRIDGE, baselineOf, kpiBridge } from "./bridge";
import { editorialOf, growthAt, growthBridge, newGrowthLog, pendingGrowth, sanitizeGrowthLog, type GrowthLog } from "./session";
import { GROWTH_ARCHETYPE, growthTemplateFor } from "./combos";
import { advance, createCompany, headcount } from "./engine";
import { play, untilCase, type Decision } from "./chains";
import type { CeoState } from "../types";

const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const T0 = new Date("2026-03-02T15:00:00Z").getTime();
const REST = { companyId: CID, sectorId: "restaurantes_alimentos", industryId: "restaurantes", archetype: GROWTH_ARCHETYPE, displayName: "Fogón Regio", growth: true };
const MANU = { ...REST, sectorId: "manufactura", industryId: "autopartes", displayName: "Troqueles del Valle" };
const started = (): CeoState => ({ ...newState(), name: "Ana", alias: "Ana", startedAt: T0, lastActiveAt: T0, savedAt: T0 });
const own = (x = REST) => setupCompany(started(), x, T0, CONTINUOUS_RULES_VERSION);
/** Momento de la partida en que el motor va en el día `d` del periodo en curso (7 días de periodo → 30 del motor). */
const atDay = (s: CeoState, d: number) => T0 + Math.ceil((d * packOf(s).season.days) / 30) * DAY;

describe("interruptor y onboarding", () => {
  it("growth_engine existe y queda apagado si la base no responde", () => {
    expect(FLAG_KEYS).toContain("growth_engine");
    expect(ALL_OFF.growth_engine).toBe(false);
  });
  it("sin el interruptor nada cambia: los tipos ofrecidos y las combinaciones jugables siguen iguales", () => {
    expect(OFFERED_ARCHETYPES).toEqual(["startup", "establecida"]);
    expect(isPlayableCombo("restaurantes_alimentos", "restaurantes", "pyme")).toBe(false);
    expect(newCompanyProfile({ ...REST, growth: undefined, at: T0 }, 2)).toBeNull();
  });
  it("Empresa emergente: solo las dos industrias piloto, con tipo interno pyme", () => {
    expect(growthTemplateFor("restaurantes_alimentos", "restaurantes")).toBe("restaurante_emergente");
    expect(growthTemplateFor("manufactura", "autopartes")).toBe("manufactura_emergente");
    expect(growthTemplateFor("comercio", "retail")).toBeNull();
    expect(newCompanyProfile({ ...REST, at: T0 }, 2)?.archetype).toBe("pyme");
    expect(newCompanyProfile({ ...REST, sectorId: "comercio", industryId: "retail", at: T0 }, 2)).toBeNull();
    expect(newCompanyProfile({ ...REST, archetype: "establecida", at: T0 }, 2)).toBeNull();
  });
  it("crear la empresa emergente guarda solo el registro del motor (plantilla y semilla)", () => {
    const s = own();
    expect(s.careerMode).toBe("continua");
    expect(s.growth).toEqual({ v: 1, templateId: "restaurante_emergente", seed: CID, decisions: [] });
    expect(own(MANU).growth?.templateId).toBe("manufactura_emergente");
    // La empresa consolidada no trae motor.
    expect(setupCompany(started(), { ...REST, archetype: "establecida", growth: undefined }, T0, CONTINUOUS_RULES_VERSION).growth).toBeUndefined();
  });
});

describe("puente a los 5 indicadores (una sola fuente económica)", () => {
  it("usa las constantes de la economía v10", () => {
    expect(BRIDGE.cashPct).toBe(ruleSet(10).economy!.cashPct);
    expect(BRIDGE.marginPct).toBe(ruleSet(10).economy!.marginPct);
  });
  it("al llegar, los indicadores son los de arranque del paquete", () => {
    const s = own();
    expect(kpis(s, T0)).toEqual(packOf(s).kpiStart);
    expect(kpiBridge(createCompany("restaurante_emergente", "x")).delta).toEqual({ caja: 0, margen: 0, equipo: 0, clientes: 0, consejo: 0 });
  });
  it("cada punto trae su causa con cifras del motor", () => {
    const b = kpiBridge(advance(createCompany("manufactura_emergente", "x"), 120));
    expect(b.causes.length).toBeGreaterThan(0);
    for (const c of b.causes) { expect(KPI_KEYS).toContain(c.kpi); expect(c.text.length).toBeGreaterThan(10); }
    expect(b.causes.find((c) => c.kpi === "caja")!.text).toMatch(/\$[\d,]+/);
  });
  it("la empresa emergente no usa la simulación P0-C ni su reporte mensual (no hay dos fuentes)", () => {
    const s = own();
    expect(businessOf(s, T0)).toBeNull();
    expect(reportDueOf({ ...s, career: [{ company: s.company, startedAt: T0 + 1, endedAt: T0 + 2, kpis: kpis(s, T0) } as never] })).toBeNull();
  });
  it("caja y margen solo los mueve el motor: los efectos editoriales nunca traen caja ni margen", () => {
    const log: GrowthLog = { v: 1, templateId: "restaurante_emergente", seed: "x", decisions: [{ caseId: "ga1_cocina", key: "ga1_cocina", optionId: "cocinero", day: 0 }] };
    const e = editorialOf(log);
    expect(e.caja).toBeUndefined();
    expect(e.margen).toBeUndefined();
  });
  it("una crisis de liquidez baja Caja, Consejo y Equipo; el crecimiento sano los sube", () => {
    const run = (path: [string, string][]) => {
      let g = createCompany("restaurante_emergente", "metis"); const dec: Decision[] = [];
      for (const [c, o] of path) { const u = untilCase(g, [c], dec, 400); g = u.state; const r = play(g, c, o, dec); g = r.state; dec.push(r.decision!); }
      return kpiBridge(advance(g, Math.max(0, 330 - g.day))).delta;
    };
    const good = run([["ga1_cocina", "cocinero"], ["ga2_sucursal", "gerente_primero"], ["ga3_equipo", "completo"]]);
    const bad = run([["ga1_cocina", "cocinero"], ["ga2_sucursal", "abrir"], ["ga3_equipo", "posponer"]]);
    expect(good.caja).toBeGreaterThan(bad.caja);
    expect(good.margen).toBeGreaterThan(bad.margen);
    expect(good.consejo).toBeGreaterThan(bad.consejo);
    expect(good.equipo).toBeGreaterThan(bad.equipo);
    for (const k of KPI_KEYS) expect(Math.abs(bad[k])).toBeLessThanOrEqual(BRIDGE.cap);
  });
});

describe("tiempo de la partida y persistencia", () => {
  it("el motor avanza con el periodo: 30 días por mes, proporcional dentro del periodo", () => {
    const s = own();
    expect(growthDayOf(s, T0)).toBe(0);
    const later = growthDayOf(s, T0 + 3 * DAY);
    expect(later).toBeGreaterThan(0);
    expect(later).toBeLessThan(30);
    // Más allá del periodo no corre: hay que cerrar el mes.
    expect(growthDayOf(s, T0 + 60 * DAY)).toBe(growthDayOf(s, T0 + 30 * DAY));
  });
  it("en vacaciones el motor no avanza", () => {
    const s0 = own();
    const t = T0 + 2 * DAY;
    const paused = pauseCareer(s0, t, null);
    expect(paused).not.toBe(s0);
    expect(growthDayOf(paused, t + 4 * DAY)).toBe(growthDayOf(s0, t));
    const back = resumeCareer(paused, t + 4 * DAY);
    expect(growthDayOf(back, t + 5 * DAY)).toBe(growthDayOf(s0, t + DAY));
  });
  it("decidir guarda solo la decisión; el estado se reconstruye igual (determinista)", () => {
    const s = own();
    expect(pendingGrowth(s.growth!, 0).map((x) => x.case.id)).toContain("ga1_cocina");
    const n = decideGrowthCase(s, "ga1_cocina", "cocinero", T0 + H);
    expect(n.growth!.decisions).toEqual([{ caseId: "ga1_cocina", key: "ga1_cocina", optionId: "cocinero", day: 0 }]);
    const a = growthAt(n.growth!, 20).state, b = growthAt(JSON.parse(JSON.stringify(n.growth!)), 20).state;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.vacancies.length + headcount(a)).toBeGreaterThan(9);
    // Una opción que no existe o un caso que no procede no cambian nada.
    expect(decideGrowthCase(n, "ga1_cocina", "cocinero", T0 + 2 * H)).toBe(n);
    expect(decideGrowthCase(n, "gb1_cliente", "aceptar", T0 + 2 * H)).toBe(n);
  });
  it("un caso de crecimiento pendiente se atiende antes de cerrar el mes", () => {
    const s = own();
    expect(pendingGrowth(s.growth!, growthDayOf(s, T0)).length).toBeGreaterThan(0);
    expect(casesDoneOf(s, T0)).toBe(false);
    expect(casesDoneOf(decideGrowthCase(s, "ga1_cocina", "esperar", T0 + H), T0 + H)).toBe(true);
    // El siguiente eslabón no llega el mismo día: espera a que se vea la consecuencia.
    expect(pendingGrowth(decideGrowthCase(s, "ga1_cocina", "esperar", T0 + H).growth!, 0)).toEqual([]);
  });
  it("migrate conserva un registro válido y descarta uno dañado o sin empresa propia", () => {
    const n = decideGrowthCase(own(), "ga1_cocina", "cocinero", T0 + H);
    const back = migrate(JSON.parse(JSON.stringify(n)));
    expect(back.growth).toEqual(n.growth);
    expect(migrate({ ...JSON.parse(JSON.stringify(n)), growth: { templateId: "inventada", seed: "x" } }).growth).toBeUndefined();
    expect(migrate({ ...JSON.parse(JSON.stringify(started())), growth: n.growth }).growth).toBeUndefined();
    expect(sanitizeGrowthLog({ templateId: "restaurante_emergente", seed: "x", decisions: [{ caseId: "nope", key: "nope", optionId: "a", day: 0 }, { caseId: "ga1_cocina", key: "ga1_cocina", optionId: "cocinero", day: -1 }] })!.decisions).toEqual([]);
    expect(newGrowthLog("inventada", "x")).toBeNull();
  });
  it("diario de jugadas: crear y decidir se reproducen igual (la acción se limpia)", () => {
    const actions: GameAction[] = [
      { type: "start", at: T0, name: "Ana", company: "brasa", settings: {}, rulesVersion: CONTINUOUS_RULES_VERSION },
      sanitizeAction({ type: "setupCompany", at: T0, ...REST, rulesVersion: CONTINUOUS_RULES_VERSION }) as GameAction,
      sanitizeAction({ type: "growth", at: T0 + H, caseId: "ga1_cocina", optionId: "cocinero", extra: 1 }) as GameAction,
    ];
    expect(actions[1]).toMatchObject({ growth: true });
    expect(actions[2]).toEqual({ type: "growth", at: T0 + H, caseId: "ga1_cocina", optionId: "cocinero" });
    const r = replay(actions);
    expect(r.rejected).toEqual([]);
    expect(r.state.growth?.decisions.map((d) => d.optionId)).toEqual(["cocinero"]);
    expect(applyAction(r.state, actions[2]).applied).toBe(false);
    expect(sanitizeAction({ type: "growth", at: 1, caseId: 3 })).toBeNull();
  });
  it("los indicadores de la partida cambian con la decisión y salen del motor", () => {
    const s = own(MANU);
    const n = decideGrowthCase(s, "gb1_cliente", "aceptar", T0 + H);
    const t = atDay(n, 29);
    const d = growthDayOf(n, t);
    expect(kpis(n, t)).toEqual(Object.fromEntries(KPI_KEYS.map((k) => [k, Math.max(0, Math.min(100, packOf(n).kpiStart[k] + growthBridge(n.growth!, d).delta[k]))])));
    expect(baselineOf("manufactura_emergente").headcount).toBe(15);
  });
});

describe("onboarding con dos tarjetas (lógica pura)", async () => {
  const S = await import("../career/setup");
  it("emergente: tipo interno pyme, solo industrias piloto; consolidada: la establecida de siempre", () => {
    const e = S.changeChoice({}, "emergente");
    expect(e).toEqual({ archetype: "pyme", growth: true });
    expect(S.canContinue("tipo", e)).toBe(true);
    expect(S.growthIndustries().map((i) => i.id).sort()).toEqual(["autopartes", "restaurantes"]);
    expect(S.sectorsForSel(e).flatMap((s) => s.industries.map((i) => i.id)).sort()).toEqual(["autopartes", "restaurantes"]);
    const c = S.changeChoice(e, "consolidada");
    expect(c.growth).toBeUndefined();
    expect(c.archetype).toBe("establecida");
    expect(S.choiceOf(c)).toBe("consolidada");
  });
  it("cambiar de tarjeta conserva la industria si existe en ambas", () => {
    const sel = { archetype: "establecida" as const, sectorId: "restaurantes_alimentos", industryId: "restaurantes" };
    expect(S.changeChoice(sel, "emergente")).toMatchObject({ sectorId: "restaurantes_alimentos", industryId: "restaurantes", growth: true });
    expect(S.changeChoice({ archetype: "establecida", sectorId: "comercio", industryId: "retail" }, "emergente").industryId).toBeUndefined();
  });
  it("buildSetup manda growth y crea la empresa emergente con su motor", () => {
    const sel = { ...S.changeChoice({}, "emergente"), sectorId: "manufactura", industryId: "autopartes", displayName: "Troqueles del Valle" };
    const setup = S.buildSetup(sel, CID)!;
    expect(setup).toMatchObject({ archetype: "pyme", growth: true });
    expect(setupCompany(started(), setup, T0, CONTINUOUS_RULES_VERSION).growth?.templateId).toBe("manufactura_emergente");
    expect(S.growthFactsOf(sel)?.[0]).toEqual(["Personas", "15"]);
    expect(S.growthSummaryOf(sel)).toMatch(/quince personas/);
  });
});
