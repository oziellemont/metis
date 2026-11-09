/**
 * Retail v2 · integración con la partida. Con el interruptor apagado, Retail sigue igual que siempre; la plantilla
 * de conveniencia ya funciona de punta a punta (registro, reconstrucción, indicadores, IA acotada) para encenderla.
 */
import { describe, expect, it } from "vitest";
import { growthTemplateFor, GROWTH_COMBOS, RETAIL_COMBO } from "../combos";
import { decideGrowth, growthDelta, growthPendingCount, isRetailLog, isSteelLog, newGrowthLog, pendingGrowth, retailOf, retailPendingOf, sanitizeGrowthLog } from "../session";
import { growthFactsOf, growthSummaryOf } from "../../career/setup";
import { RETAIL_CADENCE, retailBridge, retailDecide, retailEligibleIds, retailPending, type RetailDecision } from "./session";
import { RETAIL_V2_ENABLED } from "./params";

const ID = "conveniencia_regional_v2";
const firstDay = (seed: string) => { for (let d = 0; d < 120; d++) if (retailPending(ID, seed, [], d)) return d; throw new Error("Sin casos."); };

describe("retail v2 · interruptor", () => {
  it("apagado: Retail no cambia para nadie", () => {
    expect(RETAIL_V2_ENABLED).toBe(false);
    expect(GROWTH_COMBOS["comercio/retail"]).toBeUndefined();
    expect(growthTemplateFor("comercio", "retail", "establecida")).toBeNull();
  });
  it("al encenderlo: solo empresa consolidada (cadena de conveniencia), sin StartUp", () => {
    expect(RETAIL_COMBO).toEqual({ startup: null, consolidada: ID });
  });
});

describe("retail v2 · registro de la partida", () => {
  it("se crea, se guarda y se sanea como las demás plantillas; descarta casos inventados", () => {
    const log = newGrowthLog(ID, "Tiendas Al Paso")!;
    expect(isRetailLog(log)).toBe(true);
    expect(isSteelLog(log)).toBe(false);
    expect(sanitizeGrowthLog(JSON.parse(JSON.stringify(log)))).toEqual(log);
    expect(sanitizeGrowthLog({ templateId: ID, seed: "x", decisions: [{ caseId: "inventado", key: "i", optionId: "a", day: 0 }, { caseId: "liq@30", key: "liq@30@30", optionId: "plazo", day: 30 }, { caseId: "se_noche", key: "se_noche@40", optionId: "cajas", day: 40, source: "ia" }] })!.decisions.map((d) => [d.caseId, d.source])).toEqual([["liq@30", undefined], ["se_noche", "ia"]]);
    expect(pendingGrowth(log, 40)).toEqual([]);
  });

  it("el primer caso llega en el primer mes; decidir guarda solo la decisión y se reconstruye igual", () => {
    let log = newGrowthLog(ID, "seed-a")!;
    const day = firstDay("seed-a");
    expect(day).toBeLessThan(30);
    const p = retailPendingOf(log, day)!;
    expect(growthPendingCount(log, day)).toBe(1);
    const opt = p.options.find((o) => o.ok)!;
    const r = decideGrowth(log, day, p.c.id, opt.id);
    expect(r.ok).toBe(true);
    log = r.log;
    expect(log.decisions).toEqual([{ caseId: p.c.id, key: `${p.c.id}@${day}`, optionId: opt.id, day }]);
    const a = retailOf(log, day + 40).state, b = retailOf(JSON.parse(JSON.stringify(log)), day + 40).state;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(retailPendingOf(log, day + RETAIL_CADENCE - 1)).toBeNull();
    expect(decideGrowth(log, day, p.c.id, opt.id).ok).toBe(false);
  });

  it("una opción bloqueada por seguridad no se puede decidir", () => {
    let ds: RetailDecision[] = [];
    for (let d = 0; d < 400; d++) {
      const p = retailPending(ID, "seg", ds, d);
      if (!p) continue;
      const blocked = p.options.find((o) => o.blocked);
      if (blocked) {
        const r = retailDecide(ID, "seg", ds, d, p.c.id, blocked.id);
        expect(r.ok).toBe(false);
        expect(r.decisions).toEqual(ds);
        return;
      }
      ds = retailDecide(ID, "seg", ds, d, p.c.id, p.options.find((o) => o.ok)!.id).decisions;
    }
    throw new Error("No llegó ningún caso de seguridad en 400 días.");
  });

  it("los indicadores salen del motor de la cadena", () => {
    const log = newGrowthLog(ID, "kpi")!;
    expect(growthDelta(log, 90)).toEqual(retailBridge(retailOf(log, 90).state).delta);
    for (const v of Object.values(growthDelta(log, 90))) expect(Math.abs(v)).toBeLessThanOrEqual(30);
  });

  it("la IA solo puede elegir entre los casos elegibles", () => {
    let d = 0;
    while (retailEligibleIds(ID, "ia", [], d).length < 2) d++;
    const ids = retailEligibleIds(ID, "ia", [], d);
    const pick = ids[ids.length - 1];
    expect(retailPending(ID, "ia", [], d, pick)!.c.id).toBe(pick);
    expect(retailPending(ID, "ia", [], d, "caso_inventado")!.c.id).toBe(ids[0]);
  });

  it("la carta de nombramiento usaría datos de la plantilla (cuando se encienda)", () => {
    // Con el interruptor apagado, la selección de Retail no trae plantilla del motor.
    const sel = { growth: true, archetype: "establecida" as const, sectorId: "comercio", industryId: "retail" };
    expect(growthSummaryOf(sel)).toBeNull();
    expect(growthFactsOf(sel)).toBeNull();
  });

  it("recorrido de dos años con decisiones equilibradas: cuadra, sin vencidos crónicos", () => {
    let ds: RetailDecision[] = [];
    for (let d = 0; d <= 720; d++) {
      const p = retailPending(ID, "tour", ds, d);
      if (!p) continue;
      const opts = p.options.filter((o) => o.ok);
      const o = opts.find((x) => x.stance === "equilibrada") ?? opts[0];
      if (o) ds = retailDecide(ID, "tour", ds, d, p.c.id, o.id).decisions;
    }
    const s = retailOf({ v: 1, templateId: ID, seed: "tour", decisions: ds }, 720).state;
    expect(ds.length).toBeGreaterThanOrEqual(20);
    expect(s.months.slice(-6).every((m) => m.overdue === 0)).toBe(true);
    expect(s.months.at(-1)!.ebitda).toBeGreaterThan(0);
  }, 120_000);
});
