/**
 * World Events · pruebas de aceptación (estrategia B9) y conexiones de punta a punta.
 *  1. Idempotencia y deduplicación         6. Reproducción idéntica (diario de jugadas)
 *  2. Sin exposición no hay caso           7. Un pronóstico que cambia no castiga la prevención razonable
 *  3. Arancel sin datos completos = 0      8. Sin «delta libre»: el impacto entra solo con comandos del motor
 *  4. Deuda fija no cambia con la tasa     9. Apagado por familia y preferencia del jugador
 *  5. Tipo de cambio solo sobre moneda extranjera neta y sin la parte cubierta
 */
import { describe, expect, it } from "vitest";
import listFx from "./fixtures/gdacs_list.json";
import tcFx from "./fixtures/gdacs_tc_geometry.json";
import eqFx from "./fixtures/gdacs_eq_geometry.json";
import { nhcFor, parseEqGeometry, parseGdacsList, parseNhc, parseTcGeometry, parseUsgs, usgsFor, type GdacsEvent, type ZoneLayer } from "./connectors";
import { candidateFor, revOf, zonesFor } from "./match";
import { fxImpact, rateShock, tariffCharge } from "./macro";
import { EXPOSURE, exposureOf } from "./exposure";
import { caseIdOf, cleanWorldInput, deadlineOf, endWorld, openEpisode, openWorld, sanitizeWorld, timeline, type WorldOpenInput } from "./episodes";
import { WORLD_LABEL, retailImpact, retailWorldCase, steelImpact, steelWorldCase } from "./cases";
import { candidatesFor, nearAnySite, loadFeed, resetFeedCache, type Feed } from "./feed";
import { exerciseInput, worldActions } from "./client";
import { worldJobs } from "./notify";
import { offset, siteTouches } from "./geo";
import { decideGrowth, endWorldLog, externalOf, growthDelta, newGrowthLog, openWorldLog, retailOf, retailPendingOf, sanitizeGrowthLog, steelOf, steelPendingOf, type GrowthLog } from "../growth/session";
import { createRetail } from "../growth/retail/engine";
import { createSteel } from "../growth/steel/engine";
import { RETAIL_CADENCE } from "../growth/retail/session";
import { ALL_OFF, FLAG_KEYS, resolveFlags, worldFamiliesOff, worldVisible } from "../flags";
import { DAY, newState, packOf, setupCompany, growthDayOf } from "../engine";
import { CONTINUOUS_RULES_VERSION } from "../rules";
import { applyAction, replay, type GameAction } from "../replay";
import { sanitizeAction } from "../journal";
import type { CeoState } from "../types";
import type { Geometry } from "./geo";
import type { WorldCandidate } from "./types";

const RETAIL = "conveniencia_regional_v2", STEEL = "aceria_compacta_v2", BIG = "miniaceria_integrada_v2";
const MTY = { lat: 25.6866, lon: -100.3161 };
const SALTILLO = { lat: 25.4383, lon: -100.9737 };
/** Polígono cuadrado de `km` de lado alrededor de un punto. */
const square = (c: { lat: number; lon: number }, km: number): Geometry => {
  const n = offset(c.lat, c.lon, km / 2, 0).lat, s = offset(c.lat, c.lon, km / 2, 180).lat, e = offset(c.lat, c.lon, km / 2, 90).lon, w = offset(c.lat, c.lon, km / 2, 270).lon;
  return { type: "Polygon", coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] };
};
const layer = (zone: ZoneLayer["zone"], g: Geometry, forecast = true): ZoneLayer => ({ zone, forecast, date: "", geometry: g });
const tcEvent = (over: Partial<GdacsEvent> = {}): GdacsEvent => ({ type: "TC", eventId: 1001400, episodeId: 3, name: "ALBERTO-26", alert: "Red", current: true, country: "Mexico", from: "2026-09-01T00:00:00", to: "2026-09-03T00:00:00", modified: "2026-09-03T01:00:00", lat: 24.5, lon: -97.5, severity: "Huracán 150 km/h", report: "https://www.gdacs.org/report.aspx?eventid=1001400", geometryUrl: "https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype=TC&eventid=1001400&episodeid=3", ...over });
const input = (over: Partial<WorldOpenInput> = {}): WorldOpenInput => ({ src: "gdacs", ev: "tc1001400", rev: 3, family: "clima", kind: "ciclon", mode: "real", name: "Ciclón tropical ALBERTO-26", status: "pronostico", severity: "Huracán", source: { name: "GDACS (ONU y Comisión Europea)", url: "https://www.gdacs.org/" }, observedAt: 1, sites: { mty: "roja", cedis: "naranja" }, ...over });
const ON = { worldEvents: true };

// ───────────────────────────────────────────────────────── fuentes y cruce con la exposición
describe("fuentes oficiales (formas reales de GDACS, NHC y USGS)", () => {
  it("lee la lista de GDACS: ciclones y sismos con coordenadas, alerta y enlaces", () => {
    const evs = parseGdacsList(listFx);
    expect(evs.length).toBeGreaterThan(2);
    const tc = evs.find((e) => e.name === "MURASU-26")!;
    expect(tc).toMatchObject({ type: "TC", eventId: 1001346, alert: "Red", current: false, country: "India" });
    expect(tc.geometryUrl).toMatch(/^https:\/\/www\.gdacs\.org\/gdacsapi\/api\/polygons\/getgeometry/);
    expect(evs.some((e) => e.type === "EQ")).toBe(true);
    expect(parseGdacsList({ nada: 1 })).toEqual([]);
  });
  it("geometría de ciclón: zonas de viento sí, cono de incertidumbre no; la traza completa cuenta como pronóstico", () => {
    const layers = parseTcGeometry(tcFx, "2026-11-03T06:00:00");
    expect(layers.length).toBeGreaterThan(0);
    expect(new Set(layers.map((l) => l.zone))).toEqual(new Set(["verde", "naranja", "roja"]));
    expect(layers.filter((l) => !l.forecast).every((l) => l.date <= "2026-11-03T06:00:00")).toBe(true);
    expect(layers.some((l) => l.forecast)).toBe(true);
  });
  it("geometría de sismo: intensidad 7+ roja, 6 naranja, 5 verde; menos de 5 no cuenta", () => {
    const layers = parseEqGeometry(eqFx);
    expect(layers.length).toBeGreaterThan(0);
    expect(layers.every((l) => !l.forecast)).toBe(true);
    expect(layers.some((l) => l.zone === "roja") && layers.some((l) => l.zone === "naranja") && layers.some((l) => l.zone === "verde")).toBe(true);
  });
  it("corrobora con NHC (mismo nombre o cercanía) y USGS (±3 min y < 100 km)", () => {
    const storms = parseNhc({ activeStorms: [{ id: "ep202601", name: "Alberto", classification: "HU", latitudeNumeric: 24.6, longitudeNumeric: -97.4, publicAdvisory: { url: "https://www.nhc.noaa.gov/text/MIATCPAT1.shtml" }, lastUpdate: "2026-09-03T01:00:00Z" }] });
    expect(nhcFor(tcEvent(), storms)?.advisory).toMatch(/nhc\.noaa\.gov/);
    const quakes = parseUsgs({ features: [{ id: "us7000abcd", properties: { mag: 6.8, place: "Oaxaca", time: Date.parse("2026-09-03T00:00:30Z"), url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd" }, geometry: { coordinates: [-97.5, 24.5, 10] } }] });
    expect(usgsFor({ ...tcEvent(), type: "EQ", from: "2026-09-03T00:00:00" }, quakes)?.mag).toBe(6.8);
    expect(usgsFor({ ...tcEvent(), type: "EQ", from: "2026-09-03T01:00:00" }, quakes)).toBeNull();
  });
  it("prefiltro: un ciclón en la India no pide geometría; uno frente a Tamaulipas sí", () => {
    expect(nearAnySite(parseGdacsList(listFx).find((e) => e.name === "MURASU-26")!)).toBe(false);
    expect(nearAnySite(tcEvent())).toBe(true);
  });
});

describe("B9.2 · sin exposición no hay caso", () => {
  it("un aviso en Campeche no llega a una empresa de Monterrey", () => {
    const campeche = [layer("roja", square({ lat: 19.83, lon: -90.53 }, 200))];
    expect(revOf(zonesFor(RETAIL, campeche).sites)).toBe(0);
    expect(candidateFor(RETAIL, tcEvent({ lat: 19.83, lon: -90.53 }), campeche)).toBeNull();
    expect(candidateFor(STEEL, tcEvent({ lat: 19.83, lon: -90.53 }), campeche)).toBeNull();
  });
  it("zona verde (vientos de 60 km/h) es informativa: no abre caso", () => {
    expect(candidateFor(RETAIL, tcEvent(), [layer("verde", square(MTY, 80))])).toBeNull();
  });
  it("zona roja sobre Monterrey: candidato con las sedes tocadas y Saltillo fuera", () => {
    const c = candidateFor(RETAIL, tcEvent(), [layer("roja", square(MTY, 40)), layer("naranja", square(MTY, 70))])!;
    expect(c).toMatchObject({ ev: "tc1001400", rev: 3, family: "clima", status: "pronostico", urgency: "urgente" });
    expect(c.sites.mty).toBe("roja");
    expect(c.sites.saltillo).toBe("ninguna");
    expect(c.observed.mty).toBe("ninguna"); // todo era pronóstico
  });
  it("la acería de Santa Catarina solo se toca si el polígono llega a su radio", () => {
    expect(siteTouches({ lat: 25.6733, lon: -100.4583, radiusKm: 3 }, square({ lat: 25.6733, lon: -100.42 }, 4))).toBe(true);
    expect(siteTouches({ lat: 25.6733, lon: -100.4583, radiusKm: 3 }, square({ lat: 25.6733, lon: -100.3 }, 4))).toBe(false);
  });
  it("una plantilla sin sedes registradas nunca recibe nada", () => {
    expect(exposureOf("restaurante_emergente")).toBeNull();
    expect(openWorld({ templateId: "restaurante_emergente", decisions: [] }, input(), 10, 1, ON)).toBeNull();
  });
});

// ───────────────────────────────────────────────────────── reglas macro y de comercio
describe("B9.3–5 · reglas macro", () => {
  it("arancel: sin vigencia, HS, origen y destino, o si el importador es otro, no se cobra", () => {
    const line = { what: "Electrodos", hs: "8545", origin: "CN", destination: "MX", importerOfRecord: true };
    expect(tariffCharge({ rate: 0.25 }, line, 1_000_000, "2026-10-01").charge).toBe(0);
    expect(tariffCharge({ rate: 0.25, effectiveDate: "2026-12-01", hs: "8545", origin: "CN", destination: "MX" }, line, 1_000_000, "2026-10-01").charge).toBe(0);
    expect(tariffCharge({ rate: 0.25, effectiveDate: "2026-09-01", hs: "8545", origin: "CN", destination: "MX" }, { ...line, importerOfRecord: false }, 1_000_000, "2026-10-01").charge).toBe(0);
    expect(tariffCharge({ rate: 0.25, effectiveDate: "2026-09-01", hs: "7208", origin: "CN", destination: "MX" }, line, 1_000_000, "2026-10-01").charge).toBe(0);
    expect(tariffCharge({ rate: 0.25, effectiveDate: "2026-09-01", hs: "8545", origin: "CN", destination: "MX" }, line, 1_000_000, "2026-10-01").charge).toBe(250_000);
  });
  it("tasa: la deuda fija no cambia; solo la variable ligada al mismo índice", () => {
    const loans = [{ ref: "a", balance: 12_000_000, rate: 0.11 }, { ref: "b", balance: 12_000_000, rate: 0.12 }];
    expect(rateShock(loans, [{ ref: "a", kind: "fija", currency: "MXN" }], "TIIE", 0.01)).toEqual({ monthly: 0, affected: [] });
    expect(rateShock(loans, [{ ref: "a", kind: "fija", currency: "MXN" }, { ref: "b", kind: "variable", currency: "MXN", index: "TIIE" }], "TIIE", 0.01)).toEqual({ monthly: 10_000, affected: ["b"] });
    expect(rateShock(loans, [{ ref: "b", kind: "variable", currency: "MXN", index: "SOFR" }], "TIIE", 0.01).monthly).toBe(0);
    // Las plantillas actuales tienen deuda fija o ninguna: una subida de tasa no las mueve.
    for (const x of Object.values(EXPOSURE)) expect(x.debt.every((d) => d.kind === "fija")).toBe(true);
  });
  it("tipo de cambio: solo lo que está en dólares, neto de ventas en dólares y sin la parte cubierta", () => {
    const base = { buys: 1_000_000, sells: 2_000_000 };
    expect(fxImpact([{ what: "insumos", currency: "MXN", share: 1, hedged: 0 }], [], base, 17, 19).net).toBe(0);
    expect(fxImpact([{ what: "electrodos", currency: "USD", share: 0.1, hedged: 0 }], [], base, 20, 22).cost).toBe(10_000);
    expect(fxImpact([{ what: "electrodos", currency: "USD", share: 0.1, hedged: 0.5 }], [], base, 20, 22).cost).toBe(5_000);
    expect(fxImpact([{ what: "electrodos", currency: "USD", share: 0.1, hedged: 0 }], [{ what: "exportación", currency: "USD", share: 0.05, hedged: 0 }], base, 20, 22).net).toBe(0);
  });
});

// ───────────────────────────────────────────────────────── episodios
describe("B9.1 · idempotencia y deduplicación", () => {
  const log = (): GrowthLog => newGrowthLog(RETAIL, "s1")!;
  it("el mismo acontecimiento y revisión no abre dos veces; una revisión mayor actualiza antes de decidir", () => {
    const l = log();
    const w1 = openWorld(l, input({ rev: 2, sites: { mty: "naranja" } }), 10, 1, ON)!;
    expect(w1).toHaveLength(1);
    expect(openWorld({ ...l, world: w1 }, input({ rev: 2, sites: { mty: "naranja" } }), 11, 2, ON)).toBeNull();
    const w2 = openWorld({ ...l, world: w1 }, input(), 11, 2, ON)!;
    expect(w2).toHaveLength(1);
    expect(w2[0]).toMatchObject({ id: "tc1001400", rev: 3, day: 10, sites: { mty: "roja", cedis: "naranja" } });
  });
  it("ya decidido: una revisión nueva no lo reabre", () => {
    const w1 = openWorld(log(), input({ rev: 2, sites: { mty: "naranja" } }), 10, 1, ON)!;
    const decided = { ...log(), world: w1, decisions: [{ caseId: caseIdOf(w1[0]), key: "k", optionId: "protocolo", day: 10 }] };
    expect(openWorld(decided, input(), 11, 2, ON)).toBeNull();
  });
  it("máximo un episodio externo sin resolver a la vez", () => {
    const w1 = openWorld(log(), input(), 10, 1, ON)!;
    expect(openWorld({ ...log(), world: w1 }, input({ ev: "eq99", family: "sismo", kind: "sismo", status: "observado" }), 11, 2, ON)).toBeNull();
  });
  it("nunca reescribe el pasado: el episodio cae en el día del periodo abierto (o después de la última decisión)", () => {
    const l = { ...log(), decisions: [{ caseId: "se_noche", key: "x", optionId: "cajas", day: 40 }] };
    expect(openWorld(l, input(), 12, 1, ON)![0].day).toBe(40);
  });
  it("el cierre se registra una sola vez y dentro del plazo", () => {
    const w = openWorld(log(), input(), 10, 1, ON)!;
    const e1 = endWorld({ ...log(), world: w }, "tc1001400", { mty: "naranja" }, 13, 5)!;
    expect(e1[0].end).toEqual({ day: 13, at: 5, sites: { mty: "naranja" } });
    expect(endWorld({ ...log(), world: e1 }, "tc1001400", { mty: "roja" }, 14, 6)).toBeNull();
    expect(endWorld({ ...log(), world: w }, "tc1001400", { mty: "roja" }, 50, 6)).toBeNull();
  });
  it("lo que llega del navegador se valida (sin URLs raras, sin sedes inventadas, ejercicio con guion)", () => {
    expect(cleanWorldInput({ ...input(), source: { name: "x", url: "javascript:alert(1)" } })).toBeNull();
    expect(cleanWorldInput({ ...input(), ev: "TC 1" })).toBeNull();
    expect(cleanWorldInput({ ...input(), src: "ejercicio", mode: "ejercicio" })).toBeNull();
    expect(cleanWorldInput({ ...input(), mode: "ejercicio" })).toBeNull();
    const w = sanitizeWorld([{ ...input(), id: "tc1001400", day: 5, at: 1, sites: { mty: "roja", luna: "roja" } }, { basura: true }], RETAIL)!;
    expect(w).toHaveLength(1);
    expect(w[0].sites).toEqual({ mty: "roja" });
  });
});

describe("B9.9 · apagado por familia y preferencia del jugador", () => {
  it("sin «Acontecimientos reales en mi carrera» no se abre nada real; el ejercicio sí (modo prueba)", () => {
    const l = newGrowthLog(RETAIL, "s1")!;
    expect(openWorld(l, input(), 10, 1, {})).toBeNull();
    expect(openWorld(l, input(), 10, 1, { worldEvents: false })).toBeNull();
    expect(openWorld(l, exerciseInput(RETAIL, 1000)!, 10, 1, {})).toHaveLength(1);
  });
  it("una familia silenciada por el jugador no llega", () => {
    expect(openWorld(newGrowthLog(RETAIL, "s1")!, input(), 10, 1, { worldEvents: true, worldMute: ["clima"] })).toBeNull();
    expect(openWorld(newGrowthLog(RETAIL, "s1")!, input(), 10, 1, { worldEvents: true, worldMute: ["sismo"] })).toHaveLength(1);
  });
  it("interruptor world_events: apagado por omisión, invitados con perPlayer, apagado por familia con value.off", () => {
    expect(FLAG_KEYS).toContain("world_events");
    expect(ALL_OFF.world_events).toBe(false);
    expect(resolveFlags({ global: [] }).world_events).toBe(false);
    expect(resolveFlags({ global: [{ key: "world_events", enabled: false, value: { perPlayer: true } }], player: { world_events: true } }).world_events).toBe(true);
    expect(resolveFlags({ global: [{ key: "world_events", enabled: false, value: { perPlayer: true } }], player: {} }).world_events).toBe(false);
    expect(worldFamiliesOff([{ key: "world_events", enabled: true, value: { off: ["clima", "otra", "clima"] } }])).toEqual(["clima"]);
    expect(worldFamiliesOff(null)).toEqual([]);
    expect(worldVisible("production", false)).toBe(false);
    expect(worldVisible("preview", false)).toBe(true);
  });
  it("el servidor filtra las familias apagadas", () => {
    const feed: Feed = { at: 0, ok: true, sources: { gdacs: true, nhc: false, usgs: false }, events: [{ ev: tcEvent(), layers: [layer("roja", square(MTY, 40))] }] };
    expect(candidatesFor(feed, RETAIL)).toHaveLength(1);
    expect(candidatesFor(feed, RETAIL, { off: ["clima"] })).toHaveLength(0);
    expect(candidatesFor(feed, "restaurante_emergente")).toHaveLength(0);
  });
});

// ───────────────────────────────────────────────────────── casos e impacto en los motores
const openedRetail = (inp: WorldOpenInput, day: number, seed = "w1"): GrowthLog => openWorldLog(newGrowthLog(RETAIL, seed)!, inp, day, 1, ON)!;

describe("caso externo dentro del motor (cadena de conveniencia)", () => {
  it("llega primero, con la etiqueta obligatoria, la fuente y el plazo; la opción insegura aparece bloqueada", () => {
    const log = openedRetail(input(), 20);
    const p = retailPendingOf(log, 20)!;
    expect(p.c.id).toBe("w:tc1001400");
    expect(p.world).toMatchObject({ mode: "real", label: WORLD_LABEL.real, status: "pronostico", daysLeft: 8 });
    expect(p.world!.assets.join(" ")).toMatch(/Monterrey/);
    expect(p.options.find((o) => o.id === "abrir_roja")).toMatchObject({ blocked: true, ok: false });
    expect(p.options.filter((o) => o.ok && !o.blocked).length).toBeGreaterThanOrEqual(2);
    expect(p.body.join(" ")).toMatch(/simulación/);
  });
  it("decidir el caso externo no consume el turno de casos normales", () => {
    const log = openedRetail(input(), 20);
    const r = decideGrowth(log, 20, "w:tc1001400", "protocolo");
    expect(r.ok).toBe(true);
    const next = retailPendingOf(r.log, 20);
    // Sin decisiones previas, el ritmo normal sigue (no espera 12 días por culpa del caso externo).
    expect(next === null || !next.c.id.startsWith("w:")).toBe(true);
    if (next) expect(next.world).toBeUndefined();
  });
  it("el ejercicio hipotético se etiqueta como tal y aplica su desenlace guionado", () => {
    const ex = exerciseInput(RETAIL, 1000)!;
    const log = openWorldLog(newGrowthLog(RETAIL, "w2")!, ex, 20, 1, {})!;
    const p = retailPendingOf(log, 20)!;
    expect(p.world!.label).toBe(WORLD_LABEL.ejercicio);
    const r = decideGrowth(log, 20, p.c.id, "preventivo");
    const after = retailOf(r.log, 24);
    expect(after.external).toHaveLength(1);
    expect(after.external[0].text).toMatch(/^Ejercicio hipotético/);
    expect(after.state.events.some((e) => e.kind === "mundo")).toBe(true);
  });
  it("sismo observado: el impacto llega el mismo día, antes de decidir; reabrir sin revisión está bloqueado en zona roja", () => {
    const log = openedRetail(input({ ev: "eq555", family: "sismo", kind: "sismo", status: "observado", sites: { mty: "roja" } }), 20);
    expect(retailOf(log, 20).external).toHaveLength(1);
    const p = retailPendingOf(log, 20)!;
    expect(p.options.find((o) => o.id === "reabrir")).toMatchObject({ blocked: true, ok: false });
    expect(deadlineOf(log.world![0])).toBe(25);
    expect(retailPendingOf(log, 25)?.c.id.startsWith("w:") ?? false).toBe(false);
  });
});

describe("B9.8 · sin «delta libre»: todo entra con comandos del motor", () => {
  it("los casos y el impacto usan solo tipos de comando conocidos y montos finitos", () => {
    const known = new Set(["one_off", "modify", "safety", "relation", "downtime"]);
    const s = createRetail(RETAIL, "x");
    const ep = { ...input(), id: "tc1", at: 1, day: 0, end: { day: 3, at: 2, sites: { mty: "roja" as const, cedis: "roja" as const } } };
    for (const o of retailWorldCase(s, ep).options) for (const c of o.commands(s, "k")) { expect(known.has(c.type)).toBe(true); if ("amount" in c) expect(Number.isFinite(c.amount)).toBe(true); }
    for (const m of [null, "monitorear", "protocolo", "preventivo"]) for (const c of retailImpact(s, ep, m).commands) expect(known.has(c.type)).toBe(true);
    const st = createSteel(BIG, "x");
    const sep = { ...ep, sites: { planta: "roja" as const, patio: "naranja" as const }, end: { day: 3, at: 2, sites: { planta: "roja" as const, patio: "naranja" as const } } };
    for (const o of steelWorldCase(st, sep).options) for (const c of o.commands(st, "k")) expect(known.has(c.type)).toBe(true);
    for (const c of steelImpact(st, sep, "monitorear").commands) expect(known.has(c.type)).toBe(true);
  });
  it("la caja solo se mueve por lo que el motor registró (no hay ajustes al indicador por fuera)", () => {
    const log = openedRetail(input({ ev: "eq556", family: "sismo", kind: "sismo", status: "observado", sites: { mty: "roja" } }), 20);
    const r = retailOf(log, 21);
    expect(r.external[0].commands.length).toBeGreaterThan(0);
    expect(r.external[0].commands.every((c) => /^(one_off|modify|safety|relation|downtime):w:eq556:imp/.test(c))).toBe(true);
  });
});

describe("B9.7 · un pronóstico que cambia no castiga la prevención razonable", () => {
  const forecastLog = (option: string, observed: Record<string, "roja" | "naranja" | "ninguna">) => {
    let log = openedRetail(input(), 20, "fair");
    log = decideGrowth(log, 20, "w:tc1001400", option).log;
    return endWorldLog(log, "tc1001400", observed, 23, 5)!;
  };
  it("si el huracán se desvía, no hay impacto: solo el costo de la preparación elegida", () => {
    const miss = forecastLog("preventivo", { mty: "ninguna", cedis: "ninguna" });
    expect(retailOf(miss, 40).external).toHaveLength(0);
  });
  it("con preparación razonable, los indicadores quedan igual que sin acontecimiento (ni castigo ni premio por la exposición)", () => {
    const base = newGrowthLog(RETAIL, "fair")!;
    for (const opt of ["protocolo", "preventivo"]) {
      for (const obs of [{ mty: "roja", cedis: "roja" }, { mty: "ninguna", cedis: "ninguna" }] as const) {
        const l = forecastLog(opt, { ...obs });
        expect(growthDelta(l, 60)).toEqual(growthDelta(base, 60));
      }
    }
  });
  it("monitorear (arriesgado) ante un golpe fuerte sí cuenta: la diferencia contra el protocolo es de la decisión", () => {
    const risky = forecastLog("monitorear", { mty: "roja", cedis: "roja" });
    const base = newGrowthLog(RETAIL, "fair")!;
    const d = growthDelta(risky, 60), b = growthDelta(base, 60);
    expect(Object.keys(d).some((k) => d[k as keyof typeof d] < b[k as keyof typeof b])).toBe(true);
    // El impacto externo (lo que le habría pasado a cualquiera con el protocolo) se calcula aparte.
    const ext = externalOf(risky, 60);
    expect(Object.values(ext).some((v) => v !== 0)).toBe(true);
  });
  it("el impacto real es menor con más preparación (monitorear > protocolo > preventivo en pérdidas)", () => {
    const s = createRetail(RETAIL, "x");
    const ep = { ...input(), id: "tc1", at: 1, day: 0, end: { day: 3, at: 2, sites: { mty: "roja" as const } } };
    const cost = (m: string) => retailImpact(s, ep, m).commands.reduce((a, c) => a + (c.type === "one_off" ? c.amount : 0), 0);
    expect(cost("monitorear")).toBeGreaterThan(cost("protocolo"));
    expect(cost("protocolo")).toBeGreaterThan(cost("preventivo"));
  });
});

describe("acería: mismo flujo con paro, reparaciones y chatarra", () => {
  it("planta en zona roja: caso con «seguir fundiendo» bloqueado; el golpe sin preparación para más días", () => {
    const log = openWorldLog(newGrowthLog(STEEL, "a1")!, input({ sites: { planta: "roja" } }), 15, 1, ON)!;
    const p = steelPendingOf(log, 15)!;
    expect(p.c.id).toBe("w:tc1001400");
    expect(p.options.find((o) => o.id === "fundir")).toMatchObject({ blocked: true, ok: false });
    const st = createSteel(STEEL, "x");
    const ep = { ...log.world![0], end: { day: 18, at: 2, sites: { planta: "roja" as const } } };
    const days = (m: string) => steelImpact(st, ep, m).commands.find((c) => c.type === "downtime");
    expect((days("monitorear") as { days: number }).days).toBeGreaterThan((days("preventivo") as { days: number }).days);
    const done = endWorldLog(decideGrowth(log, 15, "w:tc1001400", "protocolo").log, "tc1001400", { planta: "roja" }, 18, 3)!;
    expect(steelOf(done, 30).external).toHaveLength(1);
  });
});

// ───────────────────────────────────────────────────────── partida, diario y reproducción
const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const T0 = new Date("2026-03-02T15:00:00Z").getTime();
const started = (settings: Partial<CeoState["settings"]> = {}): CeoState => ({ ...newState(), name: "Ana", alias: "Ana", startedAt: T0, lastActiveAt: T0, savedAt: T0, settings: { ...newState().settings, ...settings } });
const retailGame = (settings: Partial<CeoState["settings"]> = {}) => setupCompany(started(settings), { companyId: CID, sectorId: "comercio", industryId: "retail", archetype: "establecida", displayName: "Tiendas Al Paso", growth: true }, T0, CONTINUOUS_RULES_VERSION);

describe("B9.6 · partida y diario: reproducción idéntica", () => {
  it("la jugada «world» se valida en el diario y respeta la preferencia del jugador", () => {
    const off = retailGame();
    expect(off.growth?.templateId).toBe(RETAIL);
    const a: GameAction = { type: "world", at: T0 + DAY, ep: input() };
    expect(applyAction(off, a).applied).toBe(false);
    const on = retailGame({ worldEvents: true });
    expect(applyAction(on, a).applied).toBe(true);
    expect(sanitizeAction({ ...a, ep: { ...input(), source: { name: "x", url: "http://inseguro" } } })).toBeNull();
    expect(sanitizeAction(a)).toEqual(a);
    expect(sanitizeAction({ type: "worldEnd", at: 5, id: "tc1001400", sites: { mty: "roja", "<x>": "roja" } })).toEqual({ type: "worldEnd", at: 5, id: "tc1001400", sites: { mty: "roja" } });
    expect(sanitizeAction({ type: "settings", at: 5, patch: { worldEvents: true, worldMute: ["clima", "nada"] } })).toMatchObject({ patch: { worldEvents: true, worldMute: ["clima"] } });
  });
  it("abrir, decidir y cerrar se reproduce igual desde el diario y desde la partida guardada", () => {
    const s0 = retailGame({ worldEvents: true });
    const t1 = T0 + DAY, t2 = T0 + DAY + 3_600_000, t3 = T0 + 3 * DAY;
    const acts: GameAction[] = [{ type: "world", at: t1, ep: input() }, { type: "growth", at: t2, caseId: "w:tc1001400", optionId: "preventivo" }, { type: "worldEnd", at: t3, id: "tc1001400", sites: { mty: "roja", cedis: "naranja" } }];
    let s = s0;
    for (const a of acts) { const r = applyAction(s, a); expect(r.applied).toBe(true); s = r.state; }
    const r = replay(acts, s0);
    expect(r.rejected).toEqual([]);
    expect(JSON.stringify(r.state.growth)).toBe(JSON.stringify(s.growth));
    expect(sanitizeGrowthLog(JSON.parse(JSON.stringify(s.growth)))).toEqual(s.growth);
    const day = growthDayOf(s, T0 + 20 * DAY);
    expect(JSON.stringify(retailOf(s.growth!, day).state)).toBe(JSON.stringify(retailOf(sanitizeGrowthLog(JSON.parse(JSON.stringify(s.growth)))!, day).state));
  });
  it("del candidato del servidor a la jugada: abrir, actualizar con revisión mayor y cerrar al terminar", () => {
    const s0 = retailGame({ worldEvents: true });
    const cand = candidateFor(RETAIL, tcEvent(), [layer("naranja", square(MTY, 40))])!;
    const a1 = worldActions(s0, [cand], T0 + DAY);
    expect(a1.map((a) => a.type)).toEqual(["world"]);
    const s1 = applyAction(s0, a1[0]).state;
    expect(worldActions(s1, [cand], T0 + DAY + 1)).toEqual([]); // misma revisión: nada
    const red: WorldCandidate = { ...cand, rev: 3, sites: { ...cand.sites, mty: "roja" } };
    const a2 = worldActions(s1, [red], T0 + DAY + 2);
    expect(applyAction(s1, a2[0]).state.growth!.world![0].rev).toBe(3);
    const ended: WorldCandidate = { ...red, ended: true, observed: { mty: "naranja" } };
    expect(worldActions(s1, [ended], T0 + 2 * DAY).map((a) => a.type)).toEqual(["worldEnd"]);
    expect(worldActions(retailGame(), [cand], T0 + DAY)).toEqual([]); // sin preferencia: nada
  });
  it("aviso por correo: una vez por acontecimiento y revisión, solo con el caso abierto y la preferencia activa", () => {
    const s0 = retailGame({ worldEvents: true });
    const s1 = applyAction(s0, { type: "world", at: T0 + DAY, ep: input() }).state;
    const jobs = worldJobs(s1, {}, T0 + DAY + 1);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].key).toBe("world:tc1001400:3");
    expect(worldJobs(s1, { [jobs[0].key]: 1 }, T0 + DAY + 1)).toEqual([]);
    expect(worldJobs({ ...s1, settings: { ...s1.settings, worldEvents: false } }, {}, T0 + DAY + 1)).toEqual([]);
    const ex = applyAction(retailGame(), { type: "world", at: T0 + DAY, ep: exerciseInput(RETAIL, T0)! }).state;
    expect(worldJobs({ ...ex, settings: { ...ex.settings, worldEvents: true } }, {}, T0 + DAY + 1)).toEqual([]); // ejercicios no avisan
  });
  it("sin acontecimientos, la partida es idéntica a la de antes (mismo registro y mismos indicadores)", () => {
    const s = retailGame({ worldEvents: true });
    expect(s.growth!.world).toBeUndefined();
    expect(sanitizeGrowthLog(JSON.parse(JSON.stringify(s.growth)))).toEqual(s.growth);
    expect(packOf(s)).toBeTruthy();
  });
});

describe("tablero del servidor (sin red real)", () => {
  it("con GDACS caído devuelve vacío y reintenta pronto; con datos arma candidatos corroborados", async () => {
    resetFeedCache();
    const down = await loadFeed(1_000, async () => null);
    expect(down).toMatchObject({ ok: false, events: [] });
    resetFeedCache();
    const geo = { type: "FeatureCollection", features: [{ type: "Feature", properties: { Class: "Poly_Red", polygonlabel: "120 km/h", polygondate: "2026-09-03T00:00:00" }, geometry: square(MTY, 40) }] };
    const list = { features: [{ properties: { eventtype: "TC", eventid: 1001400, episodeid: 3, eventname: "ALBERTO-26", alertlevel: "Red", iscurrent: "true", country: "Mexico", fromdate: "2026-09-01T00:00:00", todate: "2026-09-03T00:00:00", datemodified: "2026-09-03T01:00:00", severitydata: { severitytext: "Huracán" }, url: { report: "https://www.gdacs.org/r", geometry: "https://www.gdacs.org/g" } }, geometry: { type: "Point", coordinates: [-97.5, 24.5] } }] };
    const nhc = { activeStorms: [{ id: "al01", name: "Alberto", classification: "HU", latitudeNumeric: 24.5, longitudeNumeric: -97.5, publicAdvisory: { url: "https://www.nhc.noaa.gov/a" }, lastUpdate: "x" }] };
    const feed = await loadFeed(2_000, async (u) => (u.includes("geteventlist") ? list : u.includes("nhc") ? nhc : u === "https://www.gdacs.org/g" ? geo : null));
    expect(feed.ok).toBe(true);
    const c = candidatesFor(feed, RETAIL);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ ev: "tc1001400", rev: 3, also: { name: "Centro Nacional de Huracanes (NOAA)" } });
    expect(candidatesFor(feed, "restaurante_emergente")).toEqual([]);
    resetFeedCache();
  });
});

describe("textos", () => {
  it("nunca afirma daño real y siempre lleva la etiqueta", () => {
    const s = createRetail(RETAIL, "x");
    const ep = { ...input(), id: "tc1", at: 1, day: 0 };
    const c = retailWorldCase(s, ep);
    const txt = [c.subject, ...c.body(s), c.lesson, ...c.options.map((o) => o.label)].join(" ");
    expect(txt).toMatch(/simulación/);
    expect(txt).not.toMatch(/próximamente|en preparación|más adelante:/i);
    expect(WORLD_LABEL.real).toBe("Evento real · Simulación de impacto en tu empresa");
    expect(retailImpact(s, { ...ep, end: { day: 2, at: 1, sites: { mty: "roja" } } }, "protocolo").text).toMatch(/^Evento real, impacto simulado/);
  });
  it("timeline: lo observado llega antes de decidir; el desenlace de un pronóstico, después", () => {
    const obs = { ...input({ status: "observado", kind: "sismo", family: "sismo" }), id: "a", at: 1, day: 5 };
    const fc = { ...input(), id: "b", at: 1, day: 5, end: { day: 5, at: 2, sites: { mty: "roja" as const } } };
    const t = timeline([{ day: 5, caseId: "x" }], [obs, fc], 10);
    expect(t.map((x) => (x.ep ? x.ep.id : "d"))).toEqual(["a", "d", "b"]);
    expect(openEpisode([fc], [], 5)).toBeNull(); // se resolvió el mismo día: ya no hay nada que decidir
    expect(openEpisode([{ ...fc, end: undefined }], [], 5)?.id).toBe("b");
  });
});

void RETAIL_CADENCE; void SALTILLO;
