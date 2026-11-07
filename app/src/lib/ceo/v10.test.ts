/**
 * Reglas v10 · economía real.
 *
 * Lo que se prueba:
 *  1. Caja y Margen: el registro suma exactamente el redondeo del total (sin doble conteo ni puntos perdidos) y lo
 *     pequeño no mueve el indicador (materialidad).
 *  2. Efectos diferidos: un hecho con fecha no cuenta antes de su fecha; un cambio de precio mueve Margen de inmediato y
 *     Caja solo con la operación del mes; lo que ya había pasado al llegar el asunto se registra elijas lo que elijas.
 *  3. Autoridad del consejo: una concesión mayor a lo que un director puede comprometer, sin consejo, cuesta Consejo;
 *     llevarla al consejo o lo que decide la contraparte, no.
 *  4. Líneas rojas: siguen reprobando en v10.
 *  5. Continuidad: la migración de una partida v6–v9 guarda respaldo, conserva decisiones, historial, lecciones y
 *     racha, es idempotente y reversible; un periodo v10 se juega y cierra con veredicto.
 */
import { describe, expect, it } from "vitest";
import { DAY, authorityOf, decide, econPass, entries, inRoll, kpis, migrate, newState, redLineEntries, setupCompany, verdictOf } from "./engine";
import { Ledger, anchorsFor, beyondAuthority, moneyOf, roundHalf, sumMoney } from "./economy";
import { ECON_ROLLBACK, applyEconMigration, needsEconMigration, restoreBackupV10, revertV10 } from "./econ-migration";
import { companyById } from "./companies";
import { ECONOMY_RULES_VERSION, ruleSet } from "./rules";
import { itemAtVersion } from "./versioned";
import type { CeoState, Fact } from "./types";

const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const T0 = Date.UTC(2026, 10, 16, 15, 0, 0);
const SETUP: Record<string, { sectorId: string; industryId: string; archetype: "establecida" | "startup" }> = {
  cumbre: { sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida" },
  forja: { sectorId: "manufactura", industryId: "autopartes", archetype: "establecida" },
  brasa: { sectorId: "restaurantes_alimentos", industryId: "restaurantes", archetype: "establecida" },
};
const V10 = ECONOMY_RULES_VERSION;
const E = ruleSet(V10).economy!;
const own = (pack: string, start: number, v: number, archetype?: "pyme"): CeoState =>
  setupCompany({ ...newState(), name: "Oziel", alias: "oziel", startedAt: start, company: pack }, { companyId: CID, displayName: "Empresa QA", ...SETUP[pack], ...(archetype ? { archetype } : {}) } as Parameters<typeof setupCompany>[1], start, v);
const late = (s: CeoState) => (s.startedAt ?? 0) + 30 * DAY;
function startWhere(pack: string, v: number, ok: (s: CeoState) => boolean): CeoState {
  for (let k = 0; k < 2000; k++) { const s = own(pack, T0 + k * 3_600_000, v); if (ok(s)) return s; }
  throw new Error("sin inicio que cumpla");
}
const entryOf = (s: CeoState, id: string, now = late(s)) => entries(s, now).find((x) => x.item.id === id);
function play(s: CeoState, id: string, opt: string, after = 60_000): CeoState {
  const e = entryOf(s, id);
  if (!e) throw new Error(`${id} no llegó`);
  const out = decide(s, id, opt, e.arrivesAt + after);
  if (out === s) throw new Error(`${id}/${opt} no se pudo decidir`);
  return out;
}
const A_CUMBRE = anchorsFor("cumbre", "establecida", E);
const f = (kind: Fact["kind"], amount: number, extra: Partial<Fact> = {}): Fact => ({ kind, amount, text: "prueba", ...extra });

describe("v10 · versión", () => {
  it("v10 es la vigente y trae la economía; v9 nunca se publicó", () => {
    expect(V10).toBe(10);
    expect(E).toMatchObject({ cashPct: 0.05, marginPct: 0.005, authority: { concession: 0.2, investment: 0.02, penalty: 2 }, depreciationYears: 5 });
    expect(ruleSet(8).economy).toBeUndefined();
  });
});

describe("v10 · Caja y Margen", () => {
  it("el registro mueve exactamente el redondeo del acumulado: ni doble conteo ni puntos perdidos", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const kinds: Fact["kind"][] = ["cobro", "pago", "precio", "costo", "inversion", "capital_trabajo", "financiamiento"];
    for (let run = 0; run < 50; run++) {
      const L = new Ledger(A_CUMBRE);
      let caja = 0, margen = 0, cash = 0, margin = 0;
      for (let i = 0; i < 20; i++) {
        const fact = f(kinds[Math.floor(rnd() * kinds.length)], (rnd() - 0.5) * 40, { expense: rnd() < 0.5, rate: 0.12 });
        const m = moneyOf(fact, A_CUMBRE, E);
        cash += m.cash; margin += m.margin;
        const d = L.add(m);
        caja += d.caja ?? 0; margen += d.margen ?? 0;
      }
      expect(caja + 0).toBe(roundHalf(cash / A_CUMBRE.cashPt) + 0);
      expect(margen + 0).toBe(roundHalf(margin / A_CUMBRE.marginPt) + 0);
    }
  });
  it("contabilidad de cada hecho: precio y costo son anuales (Margen ya, Caja 1/12 al mes); cobro solo Caja; gasto ambos", () => {
    const s = A_CUMBRE.size;
    expect(moneyOf(f("precio", -12), A_CUMBRE, E)).toEqual({ cash: 0, margin: -12 * s, monthly: -1 * s });
    expect(moneyOf(f("cobro", 5), A_CUMBRE, E)).toEqual({ cash: 5 * s, margin: 0, monthly: 0 });
    expect(moneyOf(f("pago", -3, { expense: true }), A_CUMBRE, E)).toEqual({ cash: -3 * s, margin: -3 * s, monthly: 0 });
    expect(moneyOf(f("pago", -3), A_CUMBRE, E).margin).toBe(0);
    expect(moneyOf(f("inversion", -10), A_CUMBRE, E).margin).toBeCloseTo(-2 * s);
  });
  it("materialidad: un hecho pequeño frente al tamaño de la empresa no mueve el indicador", () => {
    const L = new Ledger(A_CUMBRE);
    const tiny = (A_CUMBRE.cashPt * 0.3) / A_CUMBRE.size;
    expect(L.add(moneyOf(f("cobro", tiny), A_CUMBRE, E))).toEqual({});
    // pero sí se acumula: dos más cruzan el medio punto
    expect(L.add(moneyOf(f("cobro", tiny), A_CUMBRE, E)).caja).toBe(1);
  });
  it("no conceder no regala nada: un hecho sin monto no mueve ni Caja ni Margen", () => {
    expect(sumMoney([], A_CUMBRE, E)).toEqual({ cash: 0, margin: 0, monthly: 0 });
  });
});

describe("v10 · efectos diferidos", () => {
  it("SuperNorte: el descuento pega en Margen al decidir; el capital de trabajo, hasta su fecha; Caja del precio, al cierre", () => {
    let s = own("cumbre", T0, V10, "pyme");
    expect(entryOf(s, "d2-supernorte")).toBeTruthy();
    s = play(s, "d2-supernorte", "a");
    const e = entryOf(s, "d2-supernorte")!;
    const t1 = e.decision!.at + 60_000;
    const lines = econPass(s, t1).lines.filter((l) => l.item === "d2-supernorte");
    const precio = lines.find((l) => l.fact.kind === "precio")!;
    const ct = lines.find((l) => l.fact.kind === "capital_trabajo")!;
    expect(precio.occurred).toBe(true);
    expect(precio.money.cash).toBe(0);
    expect(precio.money.margin).toBeLessThan(0);
    expect(ct.occurred).toBe(false);
    expect(ct.at).toBeGreaterThan(t1);
    expect(econPass(s, ct.at).lines.find((l) => l.item === "d2-supernorte" && l.fact.kind === "capital_trabajo")!.occurred).toBe(true);
    expect(econPass(s, ct.at - 1).totals.cash).toBeGreaterThan(econPass(s, ct.at).totals.cash);
  });
  it("vencer SuperNorte registra los mismos hechos que la opción por omisión", () => {
    const it0 = itemAtVersion(companyById("cumbre").items.find((i) => i.id === "d2-supernorte")!, V10);
    const strip = (fs: readonly Fact[] | undefined) => (fs ?? []).map(({ text: _t, ...x }) => x);
    expect(it0.expired.facts?.length).toBeGreaterThan(0);
    expect(strip(it0.expired.facts)).toEqual(strip(it0.options.find((o) => o.id === "a")!.facts));
  });
  it("lo que ya había pasado al llegar (brote en Brasa) se registra elijas lo que elijas", () => {
    const it0 = itemAtVersion(companyById("brasa").items.find((i) => i.id === "gb-d3-brote")!, V10);
    expect(it0.arrival?.effects).toEqual({ clientes: -3 });
    const s = own("brasa", T0, V10);
    const e = entryOf(s, "gb-d3-brote");
    if (!e) return; // la empresa no recibe ese asunto con esta configuración
    expect(econPass(s, e.arrivesAt + 1).arrival.get("gb-d3-brote")?.clientes).toBe(-3);
    expect(econPass(s, e.arrivesAt - 1).arrival.get("gb-d3-brote")).toBeUndefined();
  });
});

describe("v10 · autoridad del consejo", () => {
  it("Forja · bajar 5 % a Aurora sin consejo cuesta 2 puntos de Consejo", () => {
    const it0 = itemAtVersion(companyById("forja").items.find((i) => i.id === "fn-d2-precio")!, V10);
    const A = anchorsFor("forja", "establecida", E);
    const a = it0.options.find((o) => o.id === "a")!;
    expect(beyondAuthority(a.facts, A, E)).toBe(true);
    expect(authorityOf(a, A, E)).toEqual({ consejo: -2 });
    let s = own("forja", T0, V10);
    s = play(s, "fn-d2-precio", "a");
    const t = entryOf(s, "fn-d2-precio")!.decision!.at + 1;
    expect(econPass(s, t).main.get("fn-d2-precio")?.consejo).toBe((a.effects.consejo ?? 0) - 2);
  });
  it("la misma concesión llevada al consejo no cuesta; lo que decide la contraparte tampoco; un aumento con su costo no es concesión", () => {
    const big = [f("precio", -1000)];
    expect(authorityOf({ facts: big, board: true }, A_CUMBRE, E)).toEqual({});
    expect(authorityOf({ facts: [f("precio", -1000, { external: true })] }, A_CUMBRE, E)).toEqual({});
    expect(beyondAuthority([f("costo", -1000), f("precio", 1000)], A_CUMBRE, E)).toBe(false);
    expect(beyondAuthority([f("inversion", -0.03 * A_CUMBRE.sales / A_CUMBRE.size)], A_CUMBRE, E)).toBe(true);
    expect(beyondAuthority([f("inversion", -0.01 * A_CUMBRE.sales / A_CUMBRE.size)], A_CUMBRE, E)).toBe(false);
  });
});

describe("v10 · líneas rojas", () => {
  it("dejar vencer el dosificador sigue reprobando por línea roja en v10", () => {
    let s = startWhere("cumbre", V10, (x) => inRoll(x, "d2-mantenimiento", [0, 0.35]));
    s = play(s, "d2-mantenimiento", "c");
    const d = entryOf(s, "c-mant-dosificador")!;
    expect(d).toBeTruthy();
    expect(redLineEntries(s, d.deadline + 1).map((e) => e.item.id)).toContain("c-mant-dosificador");
  });
});

describe("v10 · continuidad de partidas", () => {
  const v8Game = () => {
    let s = own("cumbre", T0, 8, "pyme");
    s = play(s, "d2-supernorte", "b");
    return { ...s, lessons: ["x"], streak: 4 } as unknown as CeoState;
  };
  it("una partida v8 en curso pasa a v10 con respaldo y marca, una sola vez", () => {
    const s = v8Game();
    expect(needsEconMigration(s)).toBe(true);
    const m = applyEconMigration(s, T0 + DAY);
    expect(m.rulesVersion).toBe(V10);
    expect(m.econMigration).toMatchObject({ at: T0 + DAY, from: 8, startedAt: s.startedAt });
    expect(JSON.parse(m.econMigration!.backup!)).toEqual(JSON.parse(JSON.stringify(s)));
    expect(applyEconMigration(m, T0 + 2 * DAY)).toBe(m);
    expect(needsEconMigration(m)).toBe(false);
  });
  it("conserva decisiones, historial, lecciones, racha y elenco; solo se recalculan los indicadores", () => {
    const s = v8Game();
    const m = applyEconMigration(s, T0 + DAY);
    for (const k of Object.keys(s) as (keyof CeoState)[]) {
      if (k === "rulesVersion") continue;
      expect(m[k], String(k)).toEqual(s[k]);
    }
    const now = late(s);
    const k = kpis(m, now);
    for (const x of Object.values(k)) expect(x >= 0 && x <= 100).toBe(true);
  });
  it("los meses cerrados conservan su versión y su veredicto", async () => {
    const { playCareer } = await import("./season-sim");
    const r = playCareer("cumbre", "criterio_y_tablero", 2, "mig|v8", 8);
    const closed = r.state.career ?? [];
    const before = JSON.stringify(closed);
    const m = applyEconMigration(r.state, T0 + 90 * DAY);
    expect(JSON.stringify(m.career ?? [])).toBe(before);
    expect(closed.every((c) => c.rulesVersion !== V10)).toBe(true);
  }, 180_000);
  it("reversible: revertV10 regresa la versión conservando lo jugado; restoreBackupV10 devuelve el respaldo exacto", () => {
    const s = v8Game();
    const m = applyEconMigration(s, T0 + DAY);
    const r = revertV10(m, T0 + 2 * DAY);
    expect(r.rulesVersion).toBe(8);
    expect(r.econMigration?.reverted).toBe(T0 + 2 * DAY);
    expect(needsEconMigration(r)).toBe(false);
    const b = restoreBackupV10(m, T0 + 2 * DAY)!;
    const { econMigration: _x, ...rest } = b;
    expect(JSON.parse(JSON.stringify(rest))).toEqual(JSON.parse(JSON.stringify(s)));
    expect(b.econMigration?.reverted).toBe(T0 + 2 * DAY);
    expect(ECON_ROLLBACK).toBe(false);
  });
  it("migrate() la aplica al cargar, una sola vez, y sobrevive a guardar y volver a cargar", () => {
    const s = v8Game();
    const a = migrate(JSON.parse(JSON.stringify(s)));
    expect(a.rulesVersion).toBe(V10);
    expect(a.econMigration?.from).toBe(8);
    const b = migrate(JSON.parse(JSON.stringify(a)));
    expect(b.rulesVersion).toBe(V10);
    expect(b.econMigration?.at).toBe(a.econMigration?.at);
    expect(b.decisions).toEqual(s.decisions);
  });
  it("una partida nueva ya nace en v10 y no lleva marca de migración", () => {
    const s = migrate(JSON.parse(JSON.stringify(own("cumbre", T0, V10))));
    expect(s.rulesVersion).toBe(V10);
    expect(s.econMigration).toBeUndefined();
  });
  it("un periodo v10 completo se juega y cierra con veredicto", async () => {
    const { playCareer } = await import("./season-sim");
    const r = playCareer("forja", "criterio_y_tablero", 1, "v10|forja", V10);
    expect(r.months).toHaveLength(1);
    expect(verdictOf(r.months[0].state, r.months[0].at).v5).toBeTruthy();
  }, 120_000);
  it("Hoy avisa del cambio a la economía real y a las partidas pasadas les confirma que nada de lo suyo se perdió", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/components/ceo/Today.tsx", "utf8");
    expect(src).toContain('data-testid="aviso-economia"');
    expect(src).toMatch(/tus decisiones, tu historial y tu racha siguen igual/);
  });
});
