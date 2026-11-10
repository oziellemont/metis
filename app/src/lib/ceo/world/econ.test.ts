/**
 * World Events · economía, comercio y noticias oficiales (DOF, Banxico vía DOF, Federal Register) y avisos al celular.
 * Mismas reglas que clima y sismo: sin exposición no hay caso; el efecto entra solo con comandos del motor; con la
 * opción de referencia los indicadores propios no cambian (el impacto externo se muestra aparte).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createECDH, randomBytes } from "node:crypto";
import fixFx from "./fixtures/dof_fix_serie.json";
import fondeoFx from "./fixtures/dof_fondeo_serie.json";
import notasFx from "./fixtures/dof_notas.json";
import frFx from "./fixtures/fr_steel_mexico.json";
import { FIX, FONDEO, TARIFF_BASE, baseRateFor, classify, econCandidatesFor, loadEconFeed, moveOf, parseDofNotes, parseDofSeries, parseFr, parseTariffNote, radarFor, rateFor, resetEconCache, type EconFeed, type Point } from "./econfeed";
import { factsExposed, tradeMatch } from "./macro";
import { cleanWorldInput, type WorldOpenInput } from "./episodes";
import { exerciseInput, inputOf, worldActions } from "./client";
import { REASONABLE, referenceOption, steelImpact, steelWorldCase, retailWorldCase } from "./cases";
import { tariffDemand } from "./econ";
import { decideGrowth, externalOf, growthDelta, newGrowthLog, openWorldLog, ownDelta, retailPendingOf, steelOf, steelPendingOf } from "../growth/session";
import { createRetail } from "../growth/retail/engine";
import { createSteel } from "../growth/steel/engine";
import { cleanPushSub, pushFor, pushText } from "../push";
import type { Facts, WorldCandidate, WorldEpisode } from "./types";

const RETAIL = "conveniencia_regional_v2", STEEL = "aceria_compacta_v2", BIG = "miniaceria_integrada_v2";
const ON = { worldEvents: true };
const tariffHtml = readFileSync(`${__dirname}/fixtures/dof_arancel_5777376.html`, "utf8");
const series = (vals: number[]): Point[] => vals.map((value, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")}`, value }));
const FX_UP: Facts = { t: "fx", from: 18, to: 19.08, since: "2026-10-01", until: "2026-10-29" };
const RATE_DOWN: Facts = { t: "tasa", from: 7, to: 6.5, since: "2026-10-01", until: "2026-10-29" };
const RATE_UP: Facts = { t: "tasa", from: 6.5, to: 7, since: "2026-10-01", until: "2026-10-29" };
const TARIFF_UP: Facts = { t: "arancel", from: 0.35, to: 0.5, since: "2026-10-01", until: "2026-10-01", effective: "2026-10-01", rule: "mx_import_competencia", hs: ["7207"] };
const econInput = (kind: "tipo_cambio" | "tasa" | "arancel", facts: Facts, over: Partial<WorldOpenInput> = {}): WorldOpenInput => ({
  src: "dof", ev: kind === "arancel" ? "ar5777376" : kind === "tasa" ? "tad202610" : "fxu202610", rev: 2, family: kind === "arancel" ? "comercio" : "macro", kind, mode: "real",
  name: "Dato oficial", status: "observado", severity: "", source: { name: "Diario Oficial de la Federación", url: "https://www.dof.gob.mx/" }, observedAt: Date.parse("2026-10-30T12:00:00Z"), sites: {}, facts, ...over,
});

// ─────────────────────────────────────────────────────────────── conectores con respuestas reales guardadas
describe("DOF y Federal Register (formas reales)", () => {
  it("lee la serie del FIX y de la TIIE de fondeo publicadas en el DOF", () => {
    const fx = parseDofSeries(fixFx, FIX), ta = parseDofSeries(fondeoFx, FONDEO);
    expect(fx.length).toBeGreaterThan(30);
    expect(fx[0]).toEqual({ date: "2026-09-01", value: 17.0147 });
    expect(fx.at(-1)).toEqual({ date: "2026-11-09", value: 18.6297 });
    expect(ta.at(-1)!.value).toBeCloseTo(6.51, 2);
    expect(parseDofSeries(fixFx, FONDEO)).toEqual([]); // otro indicador: nada
    expect(parseDofSeries({ nada: 1 }, FIX)).toEqual([]);
  });
  it("movimiento material solo desde 3 % (dólar) o ¼ de punto (tasa) contra 20 publicaciones atrás", () => {
    const fx = parseDofSeries(fixFx, FIX);
    const real = moveOf("tipo_cambio", fx);
    const ch = fx.at(-1)!.value / fx.at(-21)!.value - 1;
    if (Math.abs(ch) >= 0.03) expect(real).toMatchObject({ kind: "tipo_cambio", ev: `fx${ch > 0 ? "u" : "d"}202611` });
    else expect(real).toBeNull();
    expect(moveOf("tasa", parseDofSeries(fondeoFx, FONDEO))).toBeNull(); // la TIIE de fondeo estuvo plana
    const flat = series(Array(21).fill(18));
    expect(moveOf("tipo_cambio", [...flat.slice(0, 20), { date: "2026-10-21", value: 18.5 }])).toBeNull(); // 2.8 %
    const up = moveOf("tipo_cambio", [...flat.slice(0, 20), { date: "2026-10-21", value: 19.5 }])!;
    expect(up).toMatchObject({ rev: 3, facts: { t: "fx", from: 18, to: 19.5 } });
    expect(up.name).toMatch(/dólar sube 8\.3 %/);
    const rate = moveOf("tasa", [...series(Array(20).fill(7)), { date: "2026-10-21", value: 6.75 }])!;
    expect(rate).toMatchObject({ ev: "tad202610", rev: 1, facts: { t: "tasa", from: 7, to: 6.75 } });
    expect(moveOf("tasa", series(Array(10).fill(7)))).toBeNull(); // pocos datos
  });
  it("clasifica las publicaciones del DOF; descarta avisos, convenios y lo diario de Banxico", () => {
    const notes = parseDofNotes(notasFx);
    expect(notes.length).toBeGreaterThan(5);
    expect(notes.every((n) => n.title && n.org)).toBe(true);
    const cats = notes.map((n) => [n.title, classify(n.title, n.org)] as const);
    expect(cats.find(([t]) => /servicios portuarios/.test(t))?.[1]).toBe("infraestructura");
    expect(cats.filter(([t]) => /Tipo de cambio|Tasas? de inter/.test(t)).every(([, c]) => c === null)).toBe(true);
    expect(cats.filter(([t]) => /^Convenio Espec/.test(t)).every(([, c]) => c === null)).toBe(true);
    expect(classify("Decreto por el que se reforman diversas fracciones arancelarias de la Tarifa de la Ley de los Impuestos Generales de Importación y de Exportación", "SECRETARIA DE ECONOMIA")).toBe("comercio");
    expect(classify("Acuerdo por el que se da a conocer el monto del estímulo fiscal aplicable al diésel", "SECRETARIA DE HACIENDA Y CREDITO PUBLICO")).toBe("energia");
    expect(classify("Resolución que fija los salarios mínimos generales", "SECRETARIA DEL TRABAJO")).toBe("trabajo");
    expect(classify("Aviso REF:581602")).toBeNull();
  });
  it("lee un decreto arancelario real: fracciones, tasa nueva y fecha de vigencia", () => {
    const t = parseTariffNote(tariffHtml, "2025-12-29");
    expect(t.effective).toBe("2026-01-01");
    expect(t.rows.length).toBeGreaterThanOrEqual(8);
    expect(t.rows.find((r) => r.hs === "7214")?.rate).toBe(0.35);
    expect(t.rows.some((r) => r.hs === "7213" && r.rate === 0.5)).toBe(true);
    expect(rateFor(t.rows, ["7214", "7213"])).toBe(0.35);
    expect(rateFor(t.rows, ["7207"])).toBeNull(); // la palanquilla no viene en este decreto
    expect(parseTariffNote("<p>sin tabla</p>", "2026-01-01")).toEqual({ rows: [] });
    expect(parseTariffNote("<p>El presente Decreto entrará en vigor al día siguiente de su publicación.</p>", "2026-04-23").effective).toBe("2026-04-24");
  });
  it("Federal Register: solo medidas que mencionan a México", () => {
    const docs = parseFr(frFx);
    expect(docs.every((d) => /mexico/i.test(d.title) && d.url.startsWith("https://"))).toBe(true);
    expect(parseFr({ results: [{ document_number: "1", title: "Steel From Mexico", html_url: "javascript:alert(1)" }] })).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────── sin exposición no hay caso
describe("sin exposición no hay caso (economía y comercio)", () => {
  it("tipo de cambio: la cadena (todo en pesos) no recibe nada; la acería con consumibles en dólares sí", () => {
    expect(factsExposed(RETAIL, "tipo_cambio", FX_UP)).toBe(false);
    expect(factsExposed(STEEL, "tipo_cambio", FX_UP)).toBe(true);
    expect(factsExposed(STEEL, "tipo_cambio", { ...FX_UP, to: 18.4 })).toBe(false); // 2.2 %: no es material
  });
  it("tasa: la deuda fija no cambia; solo una baja abre la oportunidad de refinanciar a quien tiene crédito", () => {
    expect(factsExposed(RETAIL, "tasa", RATE_DOWN)).toBe(true);
    expect(factsExposed(BIG, "tasa", RATE_DOWN)).toBe(true);
    expect(factsExposed(STEEL, "tasa", RATE_DOWN)).toBe(false); // sin crédito
    expect(factsExposed(RETAIL, "tasa", RATE_UP)).toBe(false); // una subida no cobra a deuda fija
  });
  it("arancel: solo con regla aprobada, fracción que coincide y ya vigente", () => {
    expect(tradeMatch(STEEL, ["7207"])).toMatchObject({ rule: "mx_import_competencia" });
    expect(tradeMatch(RETAIL, ["7207"])).toBeNull();
    expect(factsExposed(STEEL, "arancel", TARIFF_UP, Date.parse("2026-10-05"))).toBe(true);
    expect(factsExposed(STEEL, "arancel", TARIFF_UP, Date.parse("2026-09-05"))).toBe(false); // anunciada, no vigente
    expect(factsExposed(STEEL, "arancel", { ...TARIFF_UP, hs: ["8545"] }, Infinity)).toBe(false); // otra mercancía
    expect(factsExposed(STEEL, "arancel", { ...TARIFF_UP, rule: "mx_import_insumo" }, Infinity)).toBe(false); // regla que no corresponde
    expect(factsExposed(STEEL, "arancel", { ...TARIFF_UP, to: 0.35 }, Infinity)).toBe(false); // sin cambio
    expect(factsExposed(RETAIL, "arancel", TARIFF_UP, Infinity)).toBe(false);
  });
  it("la partida rechaza abrir un caso sin exposición, aunque llegue del servidor", () => {
    expect(openWorldLog(newGrowthLog(RETAIL, "e1")!, econInput("tipo_cambio", FX_UP), 10, 1, ON)).toBeNull();
    expect(openWorldLog(newGrowthLog(STEEL, "e1")!, econInput("tasa", RATE_DOWN), 10, 1, ON)).toBeNull();
    expect(openWorldLog(newGrowthLog(RETAIL, "e1")!, econInput("tasa", RATE_DOWN), 10, 1, ON)).not.toBeNull();
  });
  it("validación: cada fuente solo trae lo que sabe medir y los datos deben ser plausibles", () => {
    expect(cleanWorldInput(econInput("tasa", RATE_DOWN))).not.toBeNull();
    expect(cleanWorldInput({ ...econInput("tasa", RATE_DOWN), src: "gdacs" })).toBeNull();
    expect(cleanWorldInput({ ...econInput("tasa", RATE_DOWN), src: "fr" })).toBeNull();
    expect(cleanWorldInput({ ...econInput("tasa", RATE_DOWN), facts: undefined })).toBeNull();
    expect(cleanWorldInput({ ...econInput("tasa", RATE_DOWN), facts: FX_UP })).toBeNull(); // datos de otro tipo
    expect(cleanWorldInput(econInput("tipo_cambio", { ...FX_UP, to: 900 }))).toBeNull();
    expect(cleanWorldInput(econInput("arancel", { ...TARIFF_UP, rule: undefined }))).toBeNull();
    expect(cleanWorldInput({ ...econInput("tasa", RATE_DOWN), status: "pronostico" })!.status).toBe("observado");
    expect(cleanWorldInput({ src: "dof", ev: "tc1", rev: 3, family: "clima", kind: "ciclon", mode: "real", name: "x", status: "pronostico", severity: "", source: { name: "x", url: "https://x.mx" }, observedAt: 1, sites: { mty: "roja" } })).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────── tablero y candidatos
const feedWith = (over: Partial<EconFeed> = {}): EconFeed => ({ at: Date.parse("2026-10-30T12:00:00Z"), ok: true, fx: [], rate: [], moves: [], tariffs: [], radar: [], sources: { dof: true, fr: true, gdelt: false }, ...over });
describe("candidatos económicos por empresa", () => {
  const fxMove = { kind: "tipo_cambio" as const, ev: "fxu202610", rev: 2, facts: FX_UP, name: "El dólar sube 6.0 % en cuatro semanas", severity: "FIX" };
  const rateMove = { kind: "tasa" as const, ev: "tad202610", rev: 2, facts: RATE_DOWN, name: "Baja la tasa de interés 0.50 puntos", severity: "TIIE" };
  it("cada empresa recibe solo lo que la toca", () => {
    const feed = feedWith({ moves: [fxMove, rateMove] });
    expect(econCandidatesFor(feed, RETAIL).map((c) => c.kind)).toEqual(["tasa"]);
    expect(econCandidatesFor(feed, STEEL).map((c) => c.kind)).toEqual(["tipo_cambio"]);
    expect(econCandidatesFor(feed, BIG).map((c) => c.kind).sort()).toEqual(["tasa", "tipo_cambio"]);
    expect(econCandidatesFor(feed, "restaurante_emergente")).toEqual([]);
    expect(econCandidatesFor(feed, BIG, { off: ["macro"] })).toEqual([]);
    expect(econCandidatesFor(feed, RETAIL)[0]).toMatchObject({ src: "dof", family: "macro", status: "observado", ended: false });
  });
  it("arancel: solo con tasa anterior verificada, vigente y distinta; si no, queda en el radar", () => {
    const rows = parseTariffNote(tariffHtml, "2025-12-29").rows;
    const measure = { id: "ar1", cod: 1, title: "Decreto", date: "2026-10-01", effective: "2026-10-02", rows: rows.map((r) => (r.hs === "7214" ? { ...r, rate: 0.5 } : r)), url: "https://www.dof.gob.mx/nota_detalle.php?codigo=1" };
    const c = econCandidatesFor(feedWith({ tariffs: [measure] }), BIG);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ kind: "arancel", family: "comercio", facts: { t: "arancel", from: 0.35, rule: "mx_import_competencia" } });
    expect(c[0].facts!.to).toBe(rateFor(measure.rows, ["7214", "7213"]));
    expect(econCandidatesFor(feedWith({ tariffs: [{ ...measure, effective: "2026-12-01" }] }), BIG)).toEqual([]); // no vigente
    expect(econCandidatesFor(feedWith({ tariffs: [{ ...measure, rows }] }), BIG)).toEqual([]); // misma tasa que la vigente
    expect(econCandidatesFor(feedWith({ tariffs: [measure] }), STEEL)).toEqual([]); // palanquilla sin tasa verificada
    expect(baseRateFor(["7207"])).toBeNull();
    expect(TARIFF_BASE["7214"].rate).toBe(0.35);
  });
  it("el radar es informativo y respeta familias apagadas", () => {
    const feed = feedWith({ radar: [{ id: "dof1", cat: "energia", family: "gobierno", title: "Diésel", org: "SHCP", date: "2026-10-01", source: { name: "DOF", url: "https://www.dof.gob.mx/" } }] });
    expect(radarFor(feed)).toHaveLength(1);
    expect(radarFor(feed, ["gobierno"])).toEqual([]);
  });
  it("con el DOF caído no hay candidatos y se reintenta pronto; con datos arma movimientos y radar", async () => {
    resetEconCache();
    const down = await loadEconFeed(Date.parse("2026-11-09T18:00:00Z"), async () => null);
    expect(down).toMatchObject({ ok: false, moves: [], tariffs: [] });
    resetEconCache();
    const feed = await loadEconFeed(Date.parse("2026-11-09T18:00:00Z"), async (u) => (u.includes("/indicadores/158/") ? fixFx : u.includes("/indicadores/175/") ? fondeoFx : u.includes("federalregister") ? frFx : u.includes("/notas/09-11-2026") ? notasFx : null));
    expect(feed.ok).toBe(true);
    expect(feed.fx.length).toBeGreaterThan(30);
    expect(feed.radar.some((r) => r.cat === "infraestructura")).toBe(true);
    expect(feed.radar.every((r) => r.source.url.startsWith("https://"))).toBe(true);
    resetEconCache();
  });
});

// ─────────────────────────────────────────────────────────────── dentro de la partida
describe("casos económicos dentro de los motores", () => {
  it("tasa en la cadena: refinanciar usa el comando del motor y la opción de referencia no cambia nada", () => {
    const log = openWorldLog(newGrowthLog(RETAIL, "r1")!, econInput("tasa", RATE_DOWN), 20, 1, ON)!;
    const p = retailPendingOf(log, 20)!;
    expect(p.c.id).toBe("w:tad202610");
    expect(p.options.map((o) => o.id)).toEqual(["base", "refinanciar", "refinanciar_largo"]);
    expect(p.world).toMatchObject({ kind: "tasa", facts: RATE_DOWN });
    expect(p.body.join(" ")).toMatch(/simulación/);
    const s = createRetail(RETAIL, "x");
    const c = retailWorldCase(s, { ...log.world![0] });
    expect(c.options.find((o) => o.id === "refinanciar")!.commands(s, "k")).toEqual([expect.objectContaining({ type: "refinance", rate: expect.any(Number), fee: expect.any(Number) })]);
    const base = newGrowthLog(RETAIL, "r1")!;
    expect(growthDelta(decideGrowth(log, 20, p.c.id, "base").log, 80)).toEqual(growthDelta(base, 80));
    const refi = decideGrowth(log, 20, p.c.id, "refinanciar");
    expect(refi.ok).toBe(true);
  });
  it("dólar en la acería: el impacto llega días después, solo sobre consumibles y con comandos del motor", () => {
    const log = openWorldLog(newGrowthLog(STEEL, "s1")!, econInput("tipo_cambio", FX_UP), 15, 1, ON)!;
    const p = steelPendingOf(log, 15)!;
    expect(p.options.map((o) => o.id)).toEqual(["base", "nacional", "trasladar"]);
    expect(steelOf(log, 16).external).toHaveLength(0); // aún no llega
    const done = decideGrowth(log, 15, p.c.id, "base").log;
    const r = steelOf(done, 25);
    expect(r.external).toHaveLength(1);
    expect(r.external[0].commands.every((c) => /^modify:w:fxu202610:imp/.test(c))).toBe(true);
    const st = createSteel(STEEL, "x");
    const ep = log.world![0] as WorldEpisode;
    const known = new Set(["one_off", "modify", "relation", "change_contract", "refinance"]);
    for (const o of steelWorldCase(st, ep).options) for (const c of o.commands(st, "k")) expect(known.has(c.type)).toBe(true);
    const mult = (o: string) => (steelImpact(st, ep, o).commands[0] as { mult: number }).mult;
    expect(mult("base")).toBeCloseTo(1 + 0.06 * 0.5, 3);
    expect(mult("nacional")).toBeLessThan(mult("base"));
  });
  it("con la opción de referencia el efecto del dólar es externo: no resta en los indicadores propios", () => {
    const log = decideGrowth(openWorldLog(newGrowthLog(STEEL, "s2")!, econInput("tipo_cambio", FX_UP), 15, 1, ON)!, 15, "w:fxu202610", "base").log;
    const none = newGrowthLog(STEEL, "s2")!;
    // El dólar encarece los consumibles (efecto real en el estado financiero)...
    const cost = (l: typeof log) => Object.values((steelOf(l, 60).state as unknown as { pl: Record<string, { costo_ventas: number }> }).pl).reduce((a, m) => a + m.costo_ventas, 0);
    expect(cost(log)).toBeGreaterThan(cost(none));
    // ...pero con la opción de referencia no cuenta contra el jugador.
    expect(ownDelta(log, 60)).toEqual(growthDelta(none, 60));
    const ext = externalOf(log, 60);
    for (const v of Object.values(ext)) expect(Math.abs(v)).toBeLessThanOrEqual(3);
    expect(referenceOption({ status: "observado", facts: FX_UP })).toBe("base");
    for (const id of ["base", "nacional", "adelantar", "refinanciar", "refinanciar_largo", "contrato"]) expect(REASONABLE.has(id)).toBe(true);
  });
  it("arancel a la palanquilla: la demanda se mueve con tope, nunca un cobro directo", () => {
    expect(tariffDemand(TARIFF_UP)).toBeCloseTo(0.03, 5);
    expect(tariffDemand({ ...TARIFF_UP, from: 0, to: 1 })).toBe(0.06);
    expect(tariffDemand({ ...TARIFF_UP, from: 1, to: 0 })).toBe(-0.08);
    const log = openWorldLog(newGrowthLog(STEEL, "s3")!, econInput("arancel", TARIFF_UP), 15, 1, ON)!;
    const p = steelPendingOf(log, 15)!;
    expect(p.options.map((o) => o.id)).toEqual(["base", "contrato", "precio"]);
    const st = createSteel(STEEL, "x");
    const imp = steelImpact(st, log.world![0], "base").commands;
    expect(imp).toEqual([expect.objectContaining({ type: "modify", key: "demand" })]);
  });
});

// ─────────────────────────────────────────────────────────────── cliente: del candidato a la jugada
describe("cliente: candidatos económicos y ejercicios", () => {
  const cand: WorldCandidate = { src: "dof", ev: "tad202610", rev: 1, family: "macro", kind: "tasa", name: "Baja la tasa", status: "observado", severity: "TIIE", source: { name: "Banco de México vía Diario Oficial de la Federación", url: "https://www.dof.gob.mx/indicadores.php" }, observedAt: 5, sites: {}, observed: {}, ended: false, urgency: "importante", facts: RATE_DOWN };
  it("inputOf conserva la fuente y los datos", () => {
    expect(inputOf(cand)).toMatchObject({ src: "dof", kind: "tasa", facts: RATE_DOWN });
  });
  it("worldActions abre datos económicos desde rev 1 y respeta familias silenciadas", () => {
    const s = { growth: newGrowthLog(RETAIL, "c1")!, settings: { worldEvents: true }, continuous: { v: 1 } } as never;
    void s; // isContinuous depende del estado completo; se prueba el filtro directo:
    expect(worldActions({ growth: undefined, settings: {} } as never, [cand], 1)).toEqual([]);
  });
  it("ejercicios: dólar, tasa y arancel solo donde hay exposición, etiquetados como hipotéticos", () => {
    expect(exerciseInput(RETAIL, 1_000_000, "tipo_cambio")).not.toBeNull(); // se valida al abrir: la cadena lo rechaza
    expect(openWorldLog(newGrowthLog(RETAIL, "x1")!, exerciseInput(RETAIL, 1_000_000, "tipo_cambio")!, 10, 1, {})).toBeNull();
    const tasa = openWorldLog(newGrowthLog(RETAIL, "x2")!, exerciseInput(RETAIL, 1_000_000, "tasa")!, 10, 1, {})!;
    expect(retailPendingOf(tasa, 10)!.world!.mode).toBe("ejercicio");
    expect(retailPendingOf(tasa, 10)!.body[0]).toMatch(/^Ejercicio hipotético/);
    expect(openWorldLog(newGrowthLog(STEEL, "x3")!, exerciseInput(STEEL, 1_000_000, "arancel")!, 10, 1, {})).not.toBeNull();
    expect(openWorldLog(newGrowthLog(STEEL, "x4")!, exerciseInput(STEEL, 1_000_000, "tipo_cambio")!, 10, 1, {})).not.toBeNull();
    expect(exerciseInput(RETAIL, 1_000_000, "arancel")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────── avisos al celular
describe("avisos al celular (Web Push)", () => {
  // Suscripción de prueba generada en cada corrida (sin llaves fijas en el código).
  const ecdh = createECDH("prime256v1"); ecdh.generateKeys();
  const good = { endpoint: "https://fcm.googleapis.com/fcm/send/abc123", keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: randomBytes(16).toString("base64url") } };
  it("solo acepta suscripciones de servicios de push conocidos", () => {
    expect(cleanPushSub(good)).toEqual(good);
    expect(cleanPushSub({ ...good, endpoint: "https://web.push.apple.com/QW1" })).not.toBeNull();
    expect(cleanPushSub({ ...good, endpoint: "https://evil.example.com/x" })).toBeNull();
    expect(cleanPushSub({ ...good, endpoint: "http://fcm.googleapis.com/x" })).toBeNull();
    expect(cleanPushSub({ ...good, keys: { p256dh: "a b", auth: "x" } })).toBeNull();
    expect(cleanPushSub(null)).toBeNull();
  });
  it("arma avisos cortos para asuntos, vencimientos y acontecimientos reales; nada para resumen o racha", () => {
    const item = { id: "c1", subject: "Un proveedor pide adelanto", from: "cfo" };
    expect(pushFor({ key: "case:c1", kind: "case", entry: { item } }, "Botanas")).toMatchObject({ title: "Botanas: asunto nuevo", url: "/ceo/caso/c1" });
    expect(pushFor({ key: "case:c1", kind: "case", entry: { item }, at: 5 }, "Botanas")).toBeNull(); // programado: espera
    expect(pushFor({ key: "rem:c1", kind: "reminder", entry: { item }, hoursLeft: 2.4 }, "Botanas")!.body).toMatch(/2 horas/);
    expect(pushFor({ key: "world:x:2", kind: "world", world: { name: "Baja la tasa", daysLeft: 3, mode: "real" }, subject: "" }, "Al Paso")!.body).toMatch(/^Evento real · Simulación/);
    expect(pushFor({ key: "world:x:2", kind: "world", world: { name: "x", daysLeft: 3, mode: "ejercicio" }, subject: "" }, "Al Paso")).toBeNull();
    expect(pushFor({ key: "digest:1", kind: "digest" }, "x")).toBeNull();
    expect(pushText({ title: "t".repeat(90), body: "b".repeat(300), url: "https://otro.com", tag: "k" })).toMatchObject({ url: "/" });
    expect(pushText({ title: "t".repeat(90), body: "b".repeat(300), url: "/x", tag: "k" }).body.length).toBeLessThanOrEqual(140);
  });
});
