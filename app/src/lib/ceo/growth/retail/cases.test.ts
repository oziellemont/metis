import { describe, it, expect } from "vitest";
import { createRetail, runRetail, balanceSheet, reconcile, cashOf, type RetailState } from "./engine";
import { RETAIL_CASES, AREA_LABEL, decideRetail, eligible, nextCase, optionCheck, previewOption, rank, liquidityCase, type LogEntry } from "./cases";

const ID = "conveniencia_regional_v2";
const BANNED = [/de cero a ceo|\blibro\b/i, /próximamente/i, /en preparación/i, /más adelante:/i, /ferreter/i];
const balanced = (s: RetailState) => { const b = balanceSheet(s); expect(b.ledgerSum).toBe(0); expect(b.diff).toBe(0); for (const [k, v] of Object.entries(reconcile(s))) expect([k, v + 0]).toEqual([k, 0]); };
const clone = (s: RetailState) => JSON.parse(JSON.stringify(s)) as RetailState;

describe("retail v2 · 26 casos", () => {
  it("hay 26 casos repartidos por área", () => {
    expect(RETAIL_CASES).toHaveLength(26);
    expect(new Set(RETAIL_CASES.map((c) => c.id)).size).toBe(26);
    const n = (a: string) => RETAIL_CASES.filter((c) => c.area === a).length;
    expect({ operacion: n("operacion"), abasto: n("abasto"), personal: n("personal"), seguridad: n("seguridad"), comercial: n("comercial"), expansion: n("expansion"), finanzas: n("finanzas"), estrategia: n("estrategia") })
      .toEqual({ operacion: 3, abasto: 4, personal: 3, seguridad: 3, comercial: 4, expansion: 3, finanzas: 3, estrategia: 3 });
    expect(Object.keys(AREA_LABEL)).toHaveLength(8);
  });

  it("cada caso tiene al menos dos alternativas elegibles y una lección", () => {
    for (const c of RETAIL_CASES) {
      expect(c.options.filter((o) => !o.blocked).length, c.id).toBeGreaterThanOrEqual(2);
      expect(c.lesson.length, c.id).toBeGreaterThan(40);
      expect(new Set(c.options.map((o) => o.id)).size, c.id).toBe(c.options.length);
    }
  });

  it("los riesgos graves de seguridad tienen límite claro: la opción insegura está bloqueada con su razón", () => {
    const safety = RETAIL_CASES.filter((c) => c.safety);
    expect(safety.length).toBeGreaterThanOrEqual(4);
    const s0 = runRetail(createRetail(ID), 60);
    for (const c of safety) {
      const blocked = c.options.filter((o) => o.blocked);
      expect(blocked.length, c.id).toBeGreaterThanOrEqual(1);
      for (const o of blocked) { expect(o.blocked!.length).toBeGreaterThan(40); expect(o.commands(s0, "x")).toEqual([]); }
    }
    // Una persona sola de noche: no se puede elegir y queda en la bitácora.
    const s = clone(s0);
    const log: LogEntry[] = [];
    const c = RETAIL_CASES.find((x) => x.id === "se_noche")!;
    expect(decideRetail(s, c, "solo", log).ok).toBe(false);
    expect(log[0]).toMatchObject({ ok: false, caseId: "se_noche", optionId: "solo", commands: [] });
  });

  it("los textos no usan expresiones prohibidas", () => {
    const s = runRetail(createRetail(ID), 120);
    for (const c of RETAIL_CASES) {
      const text = [c.subject, c.lesson, ...c.body(s), ...(c.data?.(s) ?? []).flat(), ...c.options.flatMap((o) => [o.label, o.blocked ?? "", o.blocked ? "" : o.detail(s)])].join(" ");
      for (const re of BANNED) expect(re.test(text), `${c.id}: ${re}`).toBe(false);
    }
  });

  it("cada opción elegible se aplica con comandos del motor y deja la contabilidad cuadrada", () => {
    const s0 = runRetail(createRetail(ID), 300);
    let applied = 0;
    for (const c of RETAIL_CASES) for (const o of c.options) {
      if (o.blocked) continue;
      const s = clone(s0);
      if (!optionCheck(s, o).ok) continue;
      const r = decideRetail(s, c, o.id, []);
      expect(r, `${c.id}/${o.id}: ${r.reason}`).toEqual({ ok: true });
      runRetail(s, 200);
      balanced(s);
      expect(cashOf(s)).toBeGreaterThanOrEqual(0);
      applied++;
    }
    expect(applied).toBeGreaterThan(65);
  }, 120_000);

  it("la vista previa la calcula el motor y no modifica el estado", () => {
    const s = runRetail(createRetail(ID), 90);
    const before = JSON.stringify(s);
    const c = RETAIL_CASES.find((x) => x.id === "ex_rezagadas")!;
    const p = previewOption(s, c, "cerrar", 150)!;
    expect(JSON.stringify(s)).toBe(before);
    expect(p.text).toMatch(/contra no hacer nada/);
    // Cerrar las tiendas de bajo tráfico cuesta al principio (liquidaciones y rentas) pero quita una pérdida mensual.
    const later = previewOption(s, c, "cerrar", 360)!;
    expect(later.ebitda).toBeGreaterThan(p.ebitda);
  });
});

describe("retail v2 · selector adaptable y bitácora", () => {
  it("es determinista y cambia según las decisiones previas", () => {
    const s = runRetail(createRetail(ID), 200);
    expect(rank(s, []).map((x) => x.c.id)).toEqual(rank(s, []).map((x) => x.c.id));
    const pickBy = (stance: string): LogEntry[] => ["ab_refresquera", "op_frio", "pe_rotacion"].map((caseId) => ({ day: 100, caseId, optionId: RETAIL_CASES.find((c) => c.id === caseId)!.options.find((o) => o.stance === stance)!.id, commands: [], source: "motor", ok: true }));
    const r = rank(s, pickBy("arriesgada")), p = rank(s, pickBy("prudente"));
    expect(r.map((x) => x.c.id)).not.toEqual(p.map((x) => x.c.id));
    expect(r.find((x) => x.c.id === "es_competidor")!.why).toMatch(/riesgo/);
    expect(p.find((x) => x.c.id === "ex_aperturas")!.why).toMatch(/prudentes/);
  });

  it("las continuaciones solo llegan después de la decisión que las abre", () => {
    const s = runRetail(createRetail(ID), 200);
    expect(eligible(s, []).some((c) => c.id === "co_comida2")).toBe(false);
    const log: LogEntry[] = [{ day: 60, caseId: "co_comida", optionId: "piloto", commands: [], source: "motor", ok: true }];
    expect(eligible(s, log).some((c) => c.id === "co_comida2")).toBe(true);
  });

  it("la IA solo puede elegir entre casos elegibles; una sugerencia inválida se ignora", () => {
    const s = runRetail(createRetail(ID), 200);
    const el = eligible(s, []).map((c) => c.id);
    const pick = el[el.length - 1];
    expect(nextCase(s, [], pick)).toMatchObject({ source: "ia" });
    expect(nextCase(s, [], pick)!.c.id).toBe(pick);
    expect(nextCase(s, [], "caso_inventado")!.source).toBe("motor");
    expect(nextCase(s, [], "co_comida2")!.c.id).not.toBe("co_comida2");
  });

  it("con pagos vencidos el caso de liquidez tiene prioridad y sus opciones son las del motor", () => {
    const s = runRetail(createRetail(ID), 30);
    s.acc.caja -= 400_000_000_00; s.acc.capital = (s.acc.capital ?? 0) + 400_000_000_00;
    runRetail(s, 30);
    expect(s.liquidity).toBe("crisis");
    const n = nextCase(s, [])!;
    expect(n.c.id.startsWith("liq@")).toBe(true);
    expect(n.c.options.map((o) => o.id)).toEqual(expect.arrayContaining(["plazo", "convenio", "inventario", "credito", "capex", "aportacion"]));
    expect(liquidityCase(runRetail(createRetail(ID), 30))).toBeNull();
  });
});
