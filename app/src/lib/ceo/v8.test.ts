/**
 * Reglas v8 · ronda de coherencia (activa: los periodos continuos nuevos nacen en v8; los v4–v7 no se recalifican).
 *
 * Lo que se prueba:
 *  1. Nada se recalifica: un periodo v7 ve cada asunto exactamente como antes (mismas opciones, mismos efectos, sin
 *     acuerdos, sin cadena nueva) y su veredicto no cambia.
 *  2. Causalidad: lo que depende de que otro acepte no cuenta antes de su respuesta; después suma lo que corresponda.
 *     La respuesta es determinista (mismo periodo, misma respuesta) y su frecuencia coincide con la que dice el caso.
 *  3. Cadena profunda de Forja: llega en orden, nunca antes de resolver el paso anterior, y lo que decidiste antes
 *     cambia la información y las opciones del siguiente. Lo ya llegado no cambia por decisiones posteriores.
 *  4. Omisión: dejar vencer un asunto donde vencer equivale a la línea roja reprueba en v8 y no en v7.
 *  5. Rúbrica: una opción de score 2 defendible llega a «bien razonado» en v8; una no defendible, no.
 *  6. Ninguna opción domina (con efectos esperados) en los asuntos revisados ni en las variantes de la cadena.
 */
import { describe, expect, it } from "vitest";
import { DAY, H, authoredFor, decide, effectOf, entries, inRoll, kpis, newState, redLineEntries, rollOf, seasonItems, setupCompany, verdictOf } from "./engine";
import { judge } from "./judgment";
import { COMPANIES, companyById } from "./companies";
import { CADENA_FORJA_V8, revisionsV8 } from "./companies/v8";
import { dominates, expectedEffects, isDefensibleOption, isOmissionRedLine, isRedLine, netOf } from "./editorial";
import { CONTINUOUS_RULES_VERSION, COHERENCE_RULES_VERSION, ruleSet } from "./rules";
import { itemAtVersion } from "./versioned";
import type { CeoState, Item } from "./types";

const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const T0 = Date.UTC(2026, 10, 16, 15, 0, 0);
const SETUP: Record<string, { sectorId: string; industryId: string; archetype: "establecida" | "startup" }> = {
  cumbre: { sectorId: "manufactura", industryId: "alimentos_bebidas", archetype: "establecida" },
  forja: { sectorId: "manufactura", industryId: "autopartes", archetype: "establecida" },
  brasa: { sectorId: "restaurantes_alimentos", industryId: "restaurantes", archetype: "establecida" },
  kubit: { sectorId: "tecnologia_informacion", industryId: "software_saas", archetype: "startup" },
  vertice: { sectorId: "transporte_almacenamiento", industryId: "logistica_distribucion", archetype: "establecida" },
};
const own = (pack: string, start: number, v: number): CeoState =>
  setupCompany({ ...newState(), name: "Oziel", alias: "oziel", startedAt: start, company: pack }, { companyId: CID, displayName: "Empresa QA", ...SETUP[pack] }, start, v);
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
const V7 = 7, V8 = COHERENCE_RULES_VERSION;
const REVISED = COMPANIES.flatMap((p) => p.items.filter((i) => i.revisions?.some((r) => r.since === V8)).map((i) => ({ pack: p.id, item: i })));

describe("v8 · versión", () => {
  it("v8 existe con los mismos números de v7 más la rúbrica de score 2 defendible; los periodos continuos nuevos ya nacen en v10", () => {
    expect(V8).toBe(8);
    expect(CONTINUOUS_RULES_VERSION).toBe(10);
    const { version: _a, judgment: j, ...r8 } = ruleSet(8) as unknown as Record<string, unknown>;
    const { version: _b, ...r7 } = ruleSet(7) as unknown as Record<string, unknown>;
    expect(r8).toEqual(r7);
    expect(j).toEqual({ defensibleScore2: true });
  });
  it("revisa los ocho asuntos de causalidad y el dosificador; ninguno cambia de id, día ni detonador", () => {
    expect(REVISED.map((x) => x.item.id).sort()).toEqual(["c-mant-dosificador", "fn-c-inv-faltante", "gb-c-prov-contrato", "gb-d2-proveedor", "kb-c-nube-compromiso", "kb-c-nube-consumo", "vl-c-diesel-licitacion", "vl-d2-diesel"]);
    for (const { item } of REVISED) {
      const r = itemAtVersion(item, V8);
      expect([r.id, r.day, r.slot, r.trigger]).toEqual([item.id, item.day, item.slot, item.trigger]);
      expect(r.options.map((o) => o.id)).toEqual(item.options.map((o) => o.id));
    }
  });
});

describe("v8 · nada se recalifica", () => {
  it("un periodo v7 ve cada asunto exactamente como antes: sin revisiones, sin acuerdos y sin la cadena nueva", () => {
    for (const p of COMPANIES) {
      if (!SETUP[p.id]) continue;
      const s = own(p.id, T0, V7);
      const items = seasonItems(s);
      // Mismo contenido que ya está en producción (v6, mismo personalizado por empresa): v8 no toca nada de v7.
      const prev = new Map(seasonItems({ ...s, rulesVersion: 6 }).map((i) => [i.id, i]));
      for (const itm of items) {
        const before = prev.get(itm.id);
        if (before) expect(itm.options, itm.id).toEqual(before.options);
        expect(itm.options.some((o) => o.pending), itm.id).toBe(false);
        if (before) expect(itm.expired.outcome, itm.id).toBe(before.expired.outcome);
      }
      expect(items.some((i) => i.since === V8), p.id).toBe(false);
      for (const { item } of REVISED.filter((x) => x.pack === p.id)) {
        const v7 = items.find((i) => i.id === item.id);
        const v8 = itemAtVersion(item, V8);
        if (v7) expect(JSON.stringify(v7.options) === JSON.stringify(v8.options), item.id).toBe(false);
      }
    }
  });
  it("la misma partida v7 da los mismos indicadores y el mismo veredicto que el contenido sin revisiones", () => {
    let s = startWhere("forja", V7, (x) => inRoll(x, "fn-d2-inventario", [0, 0.45]));
    s = play(s, "fn-d2-inventario", "b");
    s = play(s, "fn-c-inv-faltante", "b");
    const e = entryOf(s, "fn-c-inv-faltante")!;
    expect(e.agreement).toBeUndefined();
    expect(effectOf(s, e)).toEqual({ clientes: -2, caja: 1 });
    expect(entryOf(s, "fn-c8-greg")).toBeUndefined();
  });
  it("las líneas rojas por omisión no cuentan en v7", () => {
    for (const id of ["d3-planta", "fn-d3-ppap", "c-mant-dosificador", "kb-d3-demo"]) {
      expect(isOmissionRedLine(id, V7), id).toBe(false);
      expect(isOmissionRedLine(id, V8), id).toBe(true);
    }
  });
});

describe("v8 · causalidad: ningún beneficio antes de que la contraparte acepte", () => {
  it("cada opción con acuerdo dice quién responde, con probabilidad visible en el caso y efectos inmediatos sin el beneficio", () => {
    for (const { item } of REVISED) {
      const r = itemAtVersion(item, V8);
      for (const o of r.options.filter((x) => x.pending)) {
        const p = o.pending!;
        expect(p.p, `${item.id}/${o.id}`).toBeGreaterThan(0);
        expect(p.p, `${item.id}/${o.id}`).toBeLessThan(1);
        expect(p.who.length && p.what.length && p.yes.text.length && p.no.text.length, `${item.id}/${o.id}`).toBeTruthy();
        expect(netOf(p.yes.effects), `${item.id}/${o.id}`).toBeGreaterThan(netOf(p.no.effects));
        expect(r.data?.note ?? "", `${item.id}: la probabilidad se dice como estimación ficticia`).toMatch(/no estadísticas reales/);
      }
    }
  });
  it("Forja: pedirle a Aurora mover su programa no suma caja hasta que Greg responde; después suma según su respuesta", () => {
    for (const accepted of [true, false]) {
      let s = startWhere("forja", V8, (x) => inRoll(x, "fn-d2-inventario", [0, 0.45]) && (rollOf(x, "fn-c-inv-faltante") >= 0.5) === accepted);
      s = play(s, "fn-d2-inventario", "b");
      s = play(s, "fn-c-inv-faltante", "b");
      const at = s.decisions["fn-c-inv-faltante"].at;
      const before = entryOf(s, "fn-c-inv-faltante", at + 60_000)!;
      expect(before.agreement?.resolved).toBe(false);
      expect(effectOf(s, before)).toEqual({ clientes: -1, equipo: 1 });
      const after = entryOf(s, "fn-c-inv-faltante", before.agreement!.respondsAt + 1)!;
      expect(after.agreement?.resolved).toBe(true);
      expect(after.agreement?.accepted).toBe(accepted);
      expect(effectOf(s, after)).toEqual(accepted ? { clientes: -1, equipo: 1, caja: 2 } : { clientes: -2, equipo: 1, caja: -2 });
      // Los indicadores también: la caja no se mueve antes de la respuesta.
      expect(kpis(s, at + 60_000).caja).toBe(kpis(s, at - 60_000 + 120_000).caja);
    }
  });
  it("la respuesta es determinista y su frecuencia coincide con la probabilidad que dice el caso", () => {
    const N = 400;
    let yes = 0;
    for (let k = 0; k < N; k++) if (rollOf({ startedAt: T0 + k * 3_600_000 }, "fn-c-inv-faltante") >= 1 - 0.5) yes++;
    expect(Math.abs(yes / N - 0.5)).toBeLessThan(0.08);
    const s = startWhere("forja", V8, (x) => inRoll(x, "fn-d2-inventario", [0, 0.45]));
    const a = play(play(s, "fn-d2-inventario", "b"), "fn-c-inv-faltante", "b");
    const b = play(play(s, "fn-d2-inventario", "b"), "fn-c-inv-faltante", "b", 5 * 60_000);
    expect(entryOf(a, "fn-c-inv-faltante")!.agreement!.accepted).toBe(entryOf(b, "fn-c-inv-faltante")!.agreement!.accepted);
  });
  it("la respuesta llega a más tardar al empezar el último día: nunca queda pendiente al cierre", () => {
    const s0 = startWhere("forja", V8, (x) => inRoll(x, "fn-d2-inventario", [0, 0.45]));
    const s = play(play(s0, "fn-d2-inventario", "b"), "fn-c-inv-faltante", "b", 20 * H);
    const a = entryOf(s, "fn-c-inv-faltante")!.agreement!;
    expect(a.respondsAt).toBeLessThanOrEqual((s.startedAt ?? 0) + 7 * DAY);
    expect(a.respondsAt).toBeGreaterThanOrEqual(s.decisions["fn-c-inv-faltante"].at);
  });
});

describe("v8 · cadena profunda de Forja (inventario → faltante → reclamo de Aurora → consejo)", () => {
  const ids = ["fn-d2-inventario", "fn-c-inv-faltante", "fn-c8-greg", "fn-c8-consejo"];
  const base = (accepted?: boolean) => startWhere("forja", V8, (x) => inRoll(x, "fn-d2-inventario", [0, 0.45]) && (accepted === undefined || (rollOf(x, "fn-c-inv-faltante") >= 0.5) === accepted));

  it("cuatro decisiones encadenadas: cada una llega después de resolver la anterior (y de la respuesta de su acuerdo)", () => {
    let s = play(base(true), "fn-d2-inventario", "b");
    expect(entryOf(s, "fn-c8-greg", s.decisions["fn-d2-inventario"].at + 60_000)).toBeUndefined();
    s = play(s, "fn-c-inv-faltante", "b");
    const fal = entryOf(s, "fn-c-inv-faltante")!;
    const greg = entryOf(s, "fn-c8-greg")!;
    expect(greg).toBeTruthy();
    expect(greg.arrivesAt).toBeGreaterThan(fal.decision!.at);
    expect(greg.arrivesAt).toBeGreaterThan(fal.agreement!.respondsAt);
    expect(entryOf(s, "fn-c8-consejo", fal.decision!.at + 60_000)).toBeUndefined();
    s = play(s, "fn-c8-greg", "a");
    const cons = entryOf(s, "fn-c8-consejo")!;
    expect(cons.arrivesAt).toBeGreaterThan(s.decisions["fn-c8-greg"].at);
    s = play(s, "fn-c8-consejo", "a");
    const order = entries(s, late(s)).filter((e) => ids.includes(e.item.id)).map((e) => e.item.id);
    expect(order).toEqual(ids);
  });
  it("mientras un eslabón está en camino, el periodo no se da por cerrado", async () => {
    const { casesDoneOf } = await import("./engine");
    let s = play(base(true), "fn-d2-inventario", "b");
    s = play(s, "fn-c-inv-faltante", "b");
    const now = s.decisions["fn-c-inv-faltante"].at + 60_000;
    const greg = entryOf(s, "fn-c8-greg", now)!;
    expect(greg.status).toBe("futuro");
    expect(casesDoneOf(s, greg.arrivesAt - 1)).toBe(false);
  });
  it("lo que decidiste antes cambia la información y las opciones del siguiente paso", () => {
    const s1 = play(play(base(true), "fn-d2-inventario", "b"), "fn-c-inv-faltante", "b");
    const s2 = play(play(base(false), "fn-d2-inventario", "b"), "fn-c-inv-faltante", "b");
    const s3 = play(play(base(), "fn-d2-inventario", "b"), "fn-c-inv-faltante", "c");
    const s4 = play(play(base(), "fn-d2-inventario", "b"), "fn-c-inv-faltante", "a");
    const g = (s: CeoState) => entryOf(s, "fn-c8-greg")!.item;
    const bodies = [s1, s2, s3, s4].map((s) => g(s).body.join(" "));
    expect(new Set(bodies).size).toBe(4);
    expect(bodies[0]).toMatch(/Movimos dos días/);
    expect(bodies[1]).toMatch(/No pudimos mover/);
    expect(bodies[2]).toMatch(/incompleta/);
    // Surtir parcial cambia los efectos de dos opciones: la gente ya cubrió el fin de semana.
    expect(g(s3).options.find((o) => o.id === "a")!.effects).not.toEqual(g(s4).options.find((o) => o.id === "a")!.effects);
    // El consejo cita las dos decisiones anteriores.
    const c = (s: CeoState, opt: string) => entryOf(play(s, "fn-c8-greg", opt), "fn-c8-consejo")!.item;
    const ca = c(s4, "a"), cc = c(s4, "c");
    expect(ca.data!.rows.some(([k]) => k === "Faltante con Aurora")).toBe(true);
    expect(ca.data!.rows.some(([k, v]) => k === "Lo que le dijiste a Aurora" && /Causa raíz propia/.test(v))).toBe(true);
    expect(cc.data!.rows.some(([k, v]) => k === "Lo que le dijiste a Aurora" && /su cambio de programa/.test(v))).toBe(true);
    expect(ca.options.find((o) => o.id === "c")!.text).not.toBe(cc.options.find((o) => o.id === "c")!.text);
  });
  it("si dejaste vencer el faltante, el reclamo cuenta el paro y una opción cambia (no hay forma de deshacerlo)", () => {
    let s = play(base(), "fn-d2-inventario", "b");
    const fal = entryOf(s, "fn-c-inv-faltante")!;
    s = { ...s };
    const g = entryOf(s, "fn-c8-greg", fal.deadline + 3 * DAY)!;
    expect(g.item.subject).toMatch(/Paro de línea/);
    expect(g.item.options.find((o) => o.id === "b")!.text).toMatch(/Disputar el cargo/);
    expect(g.arrivesAt).toBeGreaterThan(fal.deadline);
  });
  it("una variante solo usa decisiones resueltas antes de que el asunto llegara", () => {
    const s = play(play(base(true), "fn-d2-inventario", "b"), "fn-c-inv-faltante", "b");
    const g1 = entryOf(s, "fn-c8-greg")!;
    // Visto desde cualquier momento posterior, el asunto ya llegado se lee igual.
    const g2 = entryOf(s, "fn-c8-greg", late(s) + 10 * DAY)!;
    expect(g2.item).toEqual(g1.item);
    expect(g1.arrivesAt).toBe(g2.arrivesAt);
  });
  it("la cadena nueva solo existe en el camino del faltante (los otros caminos no cambian)", () => {
    for (const opt of ["a", "c"]) {
      const s = play(base(), "fn-d2-inventario", opt);
      expect(entryOf(s, "fn-c8-greg"), opt).toBeUndefined();
    }
    for (const itm of CADENA_FORJA_V8) expect(itm.since).toBe(V8);
  });
});

describe("v8 · omisión equivalente a la línea roja", () => {
  it("dejar vencer el dosificador reprueba por línea roja en v8; en v7 no cuenta", () => {
    for (const v of [V7, V8]) {
      let s = startWhere("cumbre", v, (x) => inRoll(x, "d2-mantenimiento", [0, 0.35]));
      s = play(s, "d2-mantenimiento", "c");
      const d = entryOf(s, "c-mant-dosificador")!;
      expect(d, `v${v}`).toBeTruthy();
      const red = redLineEntries(s, d.deadline + 1).map((e) => e.item.id);
      expect(red.includes("c-mant-dosificador"), `v${v}`).toBe(v === V8);
    }
  });
  it("el vencimiento lo dice con todas sus letras en v8 y es más caro que cualquier opción legítima", () => {
    let s = startWhere("cumbre", V8, (x) => inRoll(x, "d2-mantenimiento", [0, 0.35]));
    s = play(s, "d2-mantenimiento", "c");
    const itm = entryOf(s, "c-mant-dosificador")!.item;
    expect(itm.expired.outcome).toMatch(/misma conducta que ocultarlo/);
    expect(itm.expired.outcome).toMatch(/cuenta como si lo hubieras decidido tú/);
    const legit = itm.options.filter((o) => !isRedLine(itm.id, o.id, V8)).map((o) => netOf(expectedEffects(o)));
    expect(netOf(itm.expired.effects)).toBeLessThan(Math.min(...legit));
  });
  it("en todos los asuntos con omisión, vencer es peor que la opción legítima más barata", () => {
    for (const p of COMPANIES) for (const raw of p.items) {
      if (!isOmissionRedLine(raw.id, V8)) continue;
      const itm = itemAtVersion(raw, V8);
      const legit = itm.options.filter((o) => !isRedLine(itm.id, o.id, V8)).map((o) => netOf(expectedEffects(o)));
      expect(netOf(itm.expired.effects), itm.id).toBeLessThan(Math.min(...legit));
    }
  });
});

describe("v8 · dosificador: informar no se negocia; el remedio, sí", () => {
  const itm = itemAtVersion(companyById("cumbre").items.find((i) => i.id === "c-mant-dosificador")!, V8);
  it("reponer todo (a) y avisar + apartar + medir (c) son defendibles y ambas con el score más alto; ocultar (b) sigue siendo línea roja", () => {
    expect(isDefensibleOption(itm, "a", V8)).toBe(true);
    expect(isDefensibleOption(itm, "c", V8)).toBe(true);
    expect([itm.options.find((o) => o.id === "a")!.score, itm.options.find((o) => o.id === "c")!.score]).toEqual([3, 3]);
    expect(isRedLine(itm.id, "b", V8)).toBe(true);
  });
  it("el aprendizaje separa el deber de informar de la proporcionalidad del remedio", () => {
    expect(itm.bitacora.text).toMatch(/dos preguntas distintas/);
    expect(itm.bitacora.text).toMatch(/Las dos son defendibles/);
    expect(itm.bitacora.nota).toMatch(/Primero se informa/);
  });
});

describe("v8 · rúbrica: score 2 defendible", () => {
  it("una opción de score 2 defendible llega a nivel 2 si no gasta lo que está en riesgo; una no defendible, no", () => {
    const item = itemAtVersion(companyById("kubit").items.find((i) => i.id === "kb-c-nube-compromiso")!, V8);
    expect(isDefensibleOption(item, "b", V8)).toBe(true);
    expect(judge(authoredFor(item, "b", V8), 1).level).toBe(2);
    expect(judge(authoredFor(item, "b", V7), 1).level).toBe(1);
    expect(judge(authoredFor(item, "b", V8), 0).level).toBe(1);
    const fake: Pick<Item, "id" | "options"> = { id: "x", options: [
      { id: "a", text: "", reply: [], outcome: "", effects: { caja: 3, equipo: -1 }, style: {}, score: 3 },
      { id: "b", text: "", reply: [], outcome: "", effects: { caja: 1, equipo: -2 }, style: {}, score: 2 },
    ] };
    expect(isDefensibleOption(fake, "b", V8)).toBe(false);
    expect(judge(authoredFor(fake, "b", V8), 1).level).toBe(1);
  });
  it("el score 3 y el score 0-1 no cambian entre v7 y v8", () => {
    const item = itemAtVersion(companyById("forja").items.find((i) => i.id === "fn-c-inv-faltante")!, V8);
    for (const id of ["a", "c"]) expect(authoredFor(item, id, V8)).toEqual(authoredFor(item, id, V7));
  });
});

describe("v8 · ninguna opción domina (con efectos esperados)", () => {
  const views = (itm: Item): [string, Item][] => [["base", itm], ...(itm.variants ?? []).filter((v) => v.patch.options).map((v, i) => [`variante ${i}`, { ...itm, ...v.patch } as Item] as [string, Item])];
  it("en los asuntos revisados y en cada variante de la cadena nueva", () => {
    const all = [...REVISED.map((x) => itemAtVersion(x.item, V8)), ...CADENA_FORJA_V8];
    for (const it0 of all) for (const [tag, itm] of views(it0)) {
      for (const o of itm.options) for (const p of itm.options) if (o !== p) expect(dominates(expectedEffects(o), expectedEffects(p)), `${itm.id} ${tag}: ${o.id} domina a ${p.id}`).toBe(false);
      for (const o of itm.options) {
        const e = expectedEffects(o);
        expect(Object.values(e).some((x) => (x ?? 0) > 0) && Object.values(e).some((x) => (x ?? 0) < 0), `${itm.id} ${tag}/${o.id}: costo y beneficio`).toBe(true);
      }
    }
  });
  it("las revisiones v8 se aplican a todos los paquetes que las tienen (nada queda fuera por error)", () => {
    for (const p of COMPANIES) for (const itm of p.items) {
      const r = revisionsV8({ ...itm, revisions: undefined });
      if (r) expect(itm.revisions?.some((x) => x.since === V8), itm.id).toBe(true);
    }
  });
});

describe("v8 · un periodo v8 completo se puede jugar y cerrar", () => {
  it("Forja v8 por el camino de la cadena profunda cierra con veredicto", async () => {
    const { playCareer } = await import("./season-sim");
    const r = playCareer("forja", "criterio_y_tablero", 1, "v8|forja", V8);
    expect(r.months).toHaveLength(1);
    expect(verdictOf(r.months[0].state, r.months[0].at).v5).toBeTruthy();
  }, 120_000);
});

describe("v8 · activación", () => {
  it("una empresa nueva y el siguiente mes de una carrera v7 nacen en la vigente; los meses v7 cerrados conservan su versión", async () => {
    const { playCareer } = await import("./season-sim");
    expect(own("cumbre", T0, CONTINUOUS_RULES_VERSION).rulesVersion).toBe(CONTINUOUS_RULES_VERSION);
    // Carrera que empezó en v7: al cerrar el mes con la app vigente, el mes nuevo es v8 y el cerrado sigue en v7.
    const r7 = playCareer("cumbre", "criterio_y_tablero", 1, "act|v7", 7);
    const closed = r7.months[0];
    expect(closed.state.rulesVersion).toBe(7);
    const before = verdictOf(closed.state, closed.at);
    const { advance } = await import("./engine");
    const next = advance(closed.state, closed.at, CONTINUOUS_RULES_VERSION);
    if (next !== closed.state) {
      expect(next.rulesVersion).toBe(CONTINUOUS_RULES_VERSION);
      expect(next.career?.at(-1)?.rulesVersion).toBe(7);
    }
    // El veredicto del mes v7 no cambia por existir v8.
    expect(verdictOf(closed.state, closed.at)).toEqual(before);
  }, 120_000);
  it("Hoy avisa una sola vez del cambio a v8, al pasar de un mes v6/v7 a uno v8", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/components/ceo/Today.tsx", "utf8");
    expect(src).toContain("curV >= COHERENCE_RULES_VERSION && prevV >= 6 && prevV < COHERENCE_RULES_VERSION");
    expect(src).toContain('data-testid="aviso-coherencia"');
    expect(src).toMatch(/Tus meses anteriores conservan su evaluación/);
  });
  it("cruzar una línea roja nunca cuenta como bien razonado en v8 (aunque ayude al tablero)", () => {
    const item = seasonItems(own("cumbre", T0, V8)).find((x) => x.id === "c-mant-dosificador") ?? COMPANIES.flatMap((c) => c.items ?? []).find((x: Item) => x.id === "c-mant-dosificador");
    expect(item).toBeTruthy();
    expect(isRedLine("c-mant-dosificador", "b", V8)).toBe(true);
    expect(judge(authoredFor(item!, "b", V8), 2).level).toBeLessThan(2);
    // En v7 la regla no existía: no se recalifica.
    expect(authoredFor(item!, "b", 7)).toEqual({ analiza: 1, consulta: 1, anticipa: 1, negocia: 1, ejecuta: 1 });
  });
  it("el caso avisa antes de vencer cuando dejarlo vencer cuenta como línea roja", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/components/ceo/CaseView.tsx", "utf8");
    expect(src).toContain("isOmissionRedLine(it.id, rulesVersionOf(c.s))");
    expect(src).toContain('data-testid="aviso-omision"');
  });
});
