import { describe, it, expect } from "vitest";
import { createSteel, runSteel, balanceSheet, reconcile, cashOf, type SteelState } from "./engine";
import { TEMPLATES_V2 } from "./params";
import { STEEL_CASES, AREA_LABEL, decideSteel, eligible, nextCase, optionCheck, previewOption, rank, liquidityCase, type LogEntry, type SCase } from "./cases";

const IDS = Object.keys(TEMPLATES_V2);
const BANNED = [/de cero a ceo|\blibro\b/i, /próximamente/i, /en preparación/i, /más adelante:/i];
const balanced = (s: SteelState) => { const b = balanceSheet(s); expect(b.ledgerSum).toBe(0); expect(b.diff).toBe(0); for (const [k, v] of Object.entries(reconcile(s))) expect([k, v + 0]).toEqual([k, 0]); };

describe("acería v2 · 26 casos", () => {
  it("hay 26 casos repartidos por área como se acordó", () => {
    expect(STEEL_CASES).toHaveLength(26);
    expect(new Set(STEEL_CASES.map((c) => c.id)).size).toBe(26);
    const n = (a: string) => STEEL_CASES.filter((c) => c.area === a).length;
    expect({ operacion: n("operacion"), chatarra: n("chatarra"), clientes: n("clientes"), calidad: n("calidad"), energia: n("energia"), seguridad: n("seguridad"), capacidad: n("capacidad"), estrategia: n("estrategia") })
      .toEqual({ operacion: 3, chatarra: 4, clientes: 4, calidad: 3, energia: 3, seguridad: 3, capacidad: 3, estrategia: 3 });
    expect(Object.keys(AREA_LABEL)).toHaveLength(8);
  });

  it("cada caso tiene al menos dos alternativas elegibles y una lección", () => {
    for (const c of STEEL_CASES) {
      expect(c.options.filter((o) => !o.blocked).length, c.id).toBeGreaterThanOrEqual(2);
      expect(c.lesson.length, c.id).toBeGreaterThan(40);
      expect(new Set(c.options.map((o) => o.id)).size, c.id).toBe(c.options.length);
    }
  });

  it("los riesgos graves de seguridad tienen límite claro: la opción insegura está bloqueada con su razón", () => {
    const safety = STEEL_CASES.filter((c) => c.safety);
    expect(safety.length).toBeGreaterThanOrEqual(4);
    for (const c of safety) {
      const blocked = c.options.filter((o) => o.blocked);
      expect(blocked.length, c.id).toBeGreaterThanOrEqual(1);
      for (const o of blocked) {
        expect(o.blocked!.length).toBeGreaterThan(40);
        expect(o.commands(createSteel("aceria_compacta_v2"), "x")).toEqual([]);
      }
    }
    // No se puede elegir: la decisión se rechaza y queda en la bitácora.
    const s = runSteel(createSteel("aceria_compacta_v2"), 40);
    const log: LogEntry[] = [];
    const c = STEEL_CASES.find((x) => x.id === "ch_humeda")!;
    const r = decideSteel(s, c, "cargar", log);
    expect(r.ok).toBe(false);
    expect(log[0]).toMatchObject({ ok: false, caseId: "ch_humeda", optionId: "cargar", commands: [] });
  });

  it("los textos no usan expresiones prohibidas", () => {
    for (const id of IDS) {
      const s = runSteel(createSteel(id), 120);
      for (const c of STEEL_CASES) {
        const text = [c.subject, c.lesson, ...c.body(s), ...(c.data?.(s) ?? []).flat(), ...c.options.flatMap((o) => [o.label, o.blocked ?? "", o.blocked ? "" : o.detail(s)])].join(" ");
        for (const re of BANNED) expect(re.test(text), `${c.id}: ${re}`).toBe(false);
      }
    }
  });

  for (const id of IDS) {
    it(`${id}: cada opción elegible se aplica con comandos del motor y deja la contabilidad cuadrada`, () => {
      let applied = 0;
      const base = createSteel(id);
      const at: Record<number, SteelState> = {};
      for (const c of STEEL_CASES) {
        const day = Math.max(c.minDay, c.id === "es_ciclo" ? 365 : c.id === "ch_alza" ? 125 : 0);
        at[day] ??= runSteel(createSteel(id), day);
        for (const o of c.options) {
          if (o.blocked) continue;
          const s = JSON.parse(JSON.stringify(at[day])) as SteelState;
          if (!c.requires(s, []).ok || !optionCheck(s, o).ok) continue;
          const log: LogEntry[] = [];
          const r = decideSteel(s, c, o.id, log);
          expect(r, `${c.id}/${o.id}: ${r.reason}`).toEqual({ ok: true });
          runSteel(s, 200);
          balanced(s);
          expect(cashOf(s)).toBeGreaterThanOrEqual(0);
          applied++;
        }
      }
      void base;
      expect(applied).toBeGreaterThan(55);
    }, 120_000);
  }

  it("la vista previa la calcula el motor y no modifica el estado", () => {
    const s = runSteel(createSteel("miniaceria_integrada_v2"), 60);
    const before = JSON.stringify(s);
    const c = STEEL_CASES.find((x) => x.id === "cl_60dias")!;
    const p = previewOption(s, c, "aceptar", 150)!;
    expect(JSON.stringify(s)).toBe(before);
    expect(p.ebitda).toBeGreaterThan(0);
    expect(p.cash).toBeLessThan(p.net);
    expect(p.text).toMatch(/contra no hacer nada/);
  });
});

describe("acería v2 · selector adaptable y bitácora", () => {
  it("es determinista y cambia según las decisiones previas", () => {
    const s = runSteel(createSteel("aceria_compacta_v2"), 200);
    expect(rank(s, []).map((x) => x.c.id)).toEqual(rank(s, []).map((x) => x.c.id));
    const risky: LogEntry[] = ["op_predictivo", "op_rendimiento", "en_punta"].map((caseId) => ({ day: 100, caseId, optionId: STEEL_CASES.find((c) => c.id === caseId)!.options.find((o) => o.stance === "arriesgada")!.id, commands: [], source: "motor", ok: true }));
    const careful: LogEntry[] = ["op_predictivo", "op_rendimiento", "en_punta"].map((caseId) => ({ day: 100, caseId, optionId: STEEL_CASES.find((c) => c.id === caseId)!.options.find((o) => o.stance === "prudente")!.id, commands: [], source: "motor", ok: true }));
    const r = rank(s, risky), p = rank(s, careful);
    expect(r.map((x) => x.c.id)).not.toEqual(p.map((x) => x.c.id));
    expect(r.find((x) => x.c.id === "cl_atraso")!.why).toMatch(/riesgo/);
    expect(p.find((x) => x.c.id === "cl_60dias")!.why).toMatch(/prudentes/);
  });

  it("la IA solo puede elegir entre casos elegibles; una sugerencia inválida se ignora", () => {
    const s = runSteel(createSteel("aceria_compacta_v2"), 200);
    const el = eligible(s, []).map((c) => c.id);
    const pick = el[el.length - 1];
    expect(nextCase(s, [], pick)).toMatchObject({ source: "ia" });
    expect(nextCase(s, [], pick)!.c.id).toBe(pick);
    expect(nextCase(s, [], "caso_inventado")!.source).toBe("motor");
    expect(nextCase(s, [], "es_ciclo")!.c.id).not.toBe("es_ciclo"); // no elegible el día 200
  });

  it("con pagos vencidos el caso de liquidez tiene prioridad y sus opciones son las del motor", () => {
    const s = createSteel("aceria_compacta_v2");
    for (const x of s.sched) if (x.dir === "in") x.day += 90;
    runSteel(s, 60);
    expect(s.liquidity).toBe("crisis");
    const n = nextCase(s, [])!;
    expect(n.c.id.startsWith("liq@")).toBe(true);
    expect(n.c.options.map((o) => o.id)).toContain("factoraje");
    const log: LogEntry[] = [];
    const opt = n.c.options.find((o) => optionCheck(s, o).ok)!;
    expect(decideSteel(s, n.c, opt.id, log).ok).toBe(true);
    expect(log[0].commands.length).toBe(1);
    expect(liquidityCase(runSteel(createSteel("aceria_compacta_v2"), 30))).toBeNull();
  });
});

// ───────────────────────────────────────────────────────── recorrido completo
type Policy = "prudente" | "equilibrada" | "arriesgada";
export function playthrough(id: string, policy: Policy, days = 720) {
  const s = createSteel(id);
  const log: LogEntry[] = [];
  const seen: SCase[] = [];
  let minCash = cashOf(s);
  for (let d = 0; d < days; d++) {
    if (d % 12 === 0) {
      const n = nextCase(s, log);
      if (n) {
        const order: Policy[] = policy === "prudente" ? ["prudente", "equilibrada", "arriesgada"] : policy === "arriesgada" ? ["arriesgada", "equilibrada", "prudente"] : ["equilibrada", "prudente", "arriesgada"];
        const o = order.map((st) => n.c.options.find((x) => x.stance === st && optionCheck(s, x).ok)).find(Boolean) ?? n.c.options.find((x) => optionCheck(s, x).ok);
        if (o) { decideSteel(s, n.c, o.id, log, n.source); seen.push(n.c); }
      }
    }
    runSteel(s, 1);
    minCash = Math.min(minCash, cashOf(s));
  }
  return { s, log, seen, minCash };
}

describe("acería v2 · recorrido completo de 24 meses", () => {
  for (const id of IDS) for (const policy of ["prudente", "equilibrada", "arriesgada"] as const) {
    it(`${id} · director ${policy}`, () => {
      const { s, log, seen, minCash } = playthrough(id, policy);
      balanced(s);
      expect(minCash).toBeGreaterThanOrEqual(0);
      expect(s.months).toHaveLength(24);
      const story = new Set(log.filter((e) => e.ok && !e.caseId.startsWith("liq@")).map((e) => e.caseId));
      expect(story.size).toBeGreaterThanOrEqual(18);
      expect(new Set(seen.filter((c) => !c.id.startsWith("liq@")).map((c) => c.area)).size).toBe(8);
      // Bitácora completa: cada decisión registra sus comandos del motor.
      for (const e of log.filter((x) => x.ok)) expect(e.commands.length + (e.optionId.match(/^(no|nada|esperar|declinar|guardar|spot|rechazar|cfe|despues|sostener)$/) ? 1 : 0)).toBeGreaterThan(0);
      const y = (a: number, b: number, k: "revenue" | "ebitda" | "net") => s.months.slice(a, b).reduce((x, m) => x + m[k], 0);
      console.log(`RECORRIDO ${id} ${policy}: casos ${story.size}, ventas ${(y(0, 24, "revenue") / 1e8).toFixed(1)} M, EBITDA ${(y(0, 24, "ebitda") / 1e8).toFixed(1)} M (${((100 * y(0, 24, "ebitda")) / y(0, 24, "revenue")).toFixed(1)} %), utilidad ${(y(0, 24, "net") / 1e8).toFixed(1)} M, caja final ${(cashOf(s) / 1e8).toFixed(1)} M, caja mínima ${(minCash / 1e8).toFixed(1)} M, crisis ${log.filter((e) => e.caseId.startsWith("liq@")).length}, incidentes ${Number(s.flags.incidentes ?? 0)}, seguridad ${s.safety.toFixed(2)}`);
    }, 120_000);
  }
});
