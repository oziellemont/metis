/**
 * Acería v2 · integración con la partida: empresas nuevas usan la v2, las partidas existentes no cambian,
 * el registro se guarda y se reconstruye igual, los indicadores salen del motor y la IA no puede saltarse el selector.
 */
import { describe, expect, it } from "vitest";
import { DAY, H, KPI_KEYS, decideGrowthCase, growthDayOf, kpis, migrate, newState, packOf, setupCompany, casesDoneOf } from "../../engine";
import { CONTINUOUS_RULES_VERSION } from "../../rules";
import { replay, type GameAction } from "../../replay";
import { sanitizeAction } from "../../journal";
import { growthFactsOf, growthSummaryOf } from "../../career/setup";
import { growthTemplateFor, GROWTH_ARCHETYPE } from "../combos";
import { growthAt, growthDelta, isSteelLog, newGrowthLog, sanitizeGrowthLog, steelOf, steelPendingOf } from "../session";
import { STEEL_CADENCE, steelBridge, steelDecide, steelEligibleIds, steelPending } from "./session";
import { STEEL_V2_ENABLED } from "./params";
import type { CeoState } from "../../types";

const CID = "7a1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const T0 = new Date("2026-03-02T15:00:00Z").getTime();
const STEEL = { companyId: CID, sectorId: "manufactura", industryId: "metalica_basica", archetype: GROWTH_ARCHETYPE, displayName: "Aceros del Cerro", growth: true };
const started = (): CeoState => ({ ...newState(), name: "Ana", alias: "Ana", startedAt: T0, lastActiveAt: T0, savedAt: T0 });
const own = (archetype: string = GROWTH_ARCHETYPE) => setupCompany(started(), { ...STEEL, archetype }, T0, CONTINUOUS_RULES_VERSION);
/** Primer momento de la partida en que el motor de la acería entrega un caso (los casos tienen día mínimo). */
const firstCase = (s: CeoState) => {
  for (let t = T0; t < T0 + 40 * DAY; t += H) {
    const day = growthDayOf(s, t);
    const p = steelPendingOf(s.growth!, day);
    if (p) return { t, day, p };
  }
  throw new Error("No llegó ningún caso.");
};
const firstDay = (tpl: string, seed: string) => {
  for (let d = 0; d < 120; d++) if (steelPending(tpl, seed, [], d)) return d;
  throw new Error("Sin casos.");
};

describe("acería v2 · activación", () => {
  it("las acerías nuevas usan la v2 (StartUp = compacta, consolidada = integrada)", () => {
    expect(STEEL_V2_ENABLED).toBe(true);
    expect(growthTemplateFor("manufactura", "metalica_basica", "pyme")).toBe("aceria_compacta_v2");
    expect(growthTemplateFor("manufactura", "metalica_basica", "establecida")).toBe("miniaceria_integrada_v2");
    const s = own();
    expect(s.growth?.templateId).toBe("aceria_compacta_v2");
    expect(isSteelLog(s.growth)).toBe(true);
    expect(own("establecida").growth?.templateId).toBe("miniaceria_integrada_v2");
  });
  it("la carta de nombramiento usa datos de la plantilla v2", () => {
    const sel = { growth: true, archetype: GROWTH_ARCHETYPE, sectorId: "manufactura", industryId: "metalica_basica" };
    expect(growthSummaryOf(sel)).toMatch(/acería compacta/);
    expect(Object.fromEntries(growthFactsOf(sel)!)).toMatchObject({ Personas: "36", "Caja al llegar": "$3,500,000" });
  });
  it("una partida existente de acería v1 sigue con su motor y su registro intacto", () => {
    const v1 = newGrowthLog("aceria_emergente", "x")!;
    expect(sanitizeGrowthLog(JSON.parse(JSON.stringify(v1)))).toEqual(v1);
    expect(isSteelLog(v1)).toBe(false);
    expect(growthAt(v1, 40).state.templateId).toBe("aceria_emergente");
  });
});

describe("acería v2 · dentro de la partida", () => {
  it("el primer caso llega en el primer mes; decidir guarda solo la decisión y se reconstruye igual", () => {
    const s = own();
    expect(steelPendingOf(s.growth!, 0)).toBeNull();
    const { t, day, p } = firstCase(s);
    expect(day).toBeLessThan(30);
    const opt = p.options.find((o) => o.ok)!;
    const n = decideGrowthCase(s, p.c.id, opt.id, t);
    expect(n.growth!.decisions).toEqual([{ caseId: p.c.id, key: `${p.c.id}@${day}`, optionId: opt.id, day }]);
    const a = steelOf(n.growth!, day + 40).state, b = steelOf(JSON.parse(JSON.stringify(n.growth!)), day + 40).state;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    // No llega otro caso hasta el siguiente turno.
    expect(steelPendingOf(n.growth!, day + STEEL_CADENCE - 1)).toBeNull();
    // Repetir el mismo caso no cambia nada.
    expect(decideGrowthCase(n, p.c.id, opt.id, t + H)).toBe(n);
  });
  it("una opción bloqueada por seguridad no se puede decidir", () => {
    // Avanza con decisiones prudentes hasta que llegue un caso con opción bloqueada.
    let ds: { caseId: string; key: string; optionId: string; day: number }[] = [];
    for (let d = 0; d < 400; d++) {
      const p = steelPending("aceria_compacta_v2", "seg", ds, d);
      if (!p) continue;
      const blocked = p.options.find((o) => o.blocked);
      if (blocked) {
        const r = steelDecide("aceria_compacta_v2", "seg", ds, d, p.c.id, blocked.id);
        expect(r.ok).toBe(false);
        expect(r.decisions).toEqual(ds);
        return;
      }
      ds = steelDecide("aceria_compacta_v2", "seg", ds, d, p.c.id, p.options.find((o) => o.ok)!.id).decisions;
    }
    throw new Error("No llegó ningún caso de seguridad en 400 días.");
  });
  it("migrate conserva el registro v2 y descarta casos inventados", () => {
    const s = own();
    const { t, p } = firstCase(s);
    const n = decideGrowthCase(s, p.c.id, p.options.find((o) => o.ok)!.id, t);
    expect(n.growth!.decisions.length).toBe(1);
    expect(migrate(JSON.parse(JSON.stringify(n))).growth).toEqual(n.growth);
    expect(sanitizeGrowthLog({ templateId: "aceria_compacta_v2", seed: "x", decisions: [{ caseId: "inventado", key: "i", optionId: "a", day: 0 }, { caseId: "liq@30", key: "liq@30@30", optionId: "factoraje", day: 30 }] })!.decisions.map((d) => d.caseId)).toEqual(["liq@30"]);
  });
  it("el diario de jugadas reproduce la acería igual", () => {
    const s = own();
    const { t, p } = firstCase(s);
    const opt = p.options.find((o) => o.ok)!.id;
    const actions: GameAction[] = [
      { type: "start", at: T0, name: "Ana", company: "brasa", settings: {}, rulesVersion: CONTINUOUS_RULES_VERSION },
      sanitizeAction({ type: "setupCompany", at: T0, ...STEEL, rulesVersion: CONTINUOUS_RULES_VERSION }) as GameAction,
      sanitizeAction({ type: "growth", at: t, caseId: p.c.id, optionId: opt }) as GameAction,
    ];
    const r = replay(actions);
    expect(r.rejected).toEqual([]);
    expect(r.state.growth?.templateId).toBe("aceria_compacta_v2");
    expect(r.state.growth?.decisions.map((d) => d.optionId)).toEqual([opt]);
  });
  it("los indicadores salen del motor de la acería y el mes no cierra con un caso pendiente", () => {
    const s = own();
    const { t: tc } = firstCase(s);
    expect(casesDoneOf(s, tc)).toBe(false);
    const t = T0 + 3 * DAY;
    const d = growthDayOf(s, t);
    expect(kpis(s, t)).toEqual(Object.fromEntries(KPI_KEYS.map((k) => [k, Math.max(0, Math.min(100, packOf(s).kpiStart[k] + growthDelta(s.growth!, d)[k]))])));
    expect(growthDelta(s.growth!, d)).toEqual(steelBridge(steelOf(s.growth!, d).state).delta);
  });
  it("la IA solo puede elegir entre los casos elegibles", () => {
    let d = 0;
    while (steelEligibleIds("miniaceria_integrada_v2", "ia", [], d).length < 2) d++;
    const ids = steelEligibleIds("miniaceria_integrada_v2", "ia", [], d);
    const pick = ids[ids.length - 1];
    expect(steelPending("miniaceria_integrada_v2", "ia", [], d, pick)!.c.id).toBe(pick);
    expect(steelPending("miniaceria_integrada_v2", "ia", [], d, "se_radiactiva_inventado")!.c.id).toBe(ids[0]);
    expect(firstDay("miniaceria_integrada_v2", "ia")).toBeLessThanOrEqual(d);
  });
});
