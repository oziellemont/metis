/**
 * World Events v2: inundaciones (GDACS FL), sede de Campeche, aranceles de EE. UU. con incidencia (quién paga) y
 * consecuencias con parte inevitable. Todo sin red real.
 */
import { describe, expect, it } from "vitest";
import { parseFlGeometry, parseGdacsList, GDACS_LIST } from "./connectors";
import { candidateFor, PREFILTER_KM } from "./match";
import { US_MEASURES, usIncidence, usSteelRateAt, factsExposed, usExportLine } from "./macro";
import { EXPOSURE, exposureOf } from "./exposure";
import { econCandidatesFor, type EconFeed } from "./econfeed";
import { exportContractOf } from "./econ";
import { steelImpact, steelWorldCase, retailWorldCase } from "./cases";
import { OPTION_FRONTS, FRONTS } from "./climate2";
import { exerciseInput } from "./client";
import { cleanWorldInput, openWorld, type WorldOpenInput } from "./episodes";
import { worldJobs } from "./notify";
import { createSteel, applySteel, balanceSheet } from "../growth/steel/engine";
import { createRetail } from "../growth/retail/engine";
import { newGrowthLog, openWorldLog, steelOf, steelPendingOf, decideGrowth, endWorldLog } from "../growth/session";
import type { Geometry } from "./geo";
import type { WorldEpisode } from "./types";

const RETAIL = "conveniencia_regional_v2", STEEL = "aceria_compacta_v2", BIG = "miniaceria_integrada_v2";
const CAMPECHE = { lat: 19.8301, lon: -90.5349 };
const ON = { worldEvents: true };
const square = (c: { lat: number; lon: number }, km: number): Geometry => {
  const d = km / 111;
  return { type: "Polygon", coordinates: [[[c.lon - d, c.lat - d], [c.lon + d, c.lat - d], [c.lon + d, c.lat + d], [c.lon - d, c.lat + d], [c.lon - d, c.lat - d]]] };
};
const flList = (alert: string) => ({ features: [{ properties: { eventtype: "FL", eventid: 1200001, episodeid: 1, eventname: "", name: "Flood in Mexico", alertlevel: alert, iscurrent: "true", country: "Mexico", fromdate: "2026-10-01T00:00:00", todate: "2026-10-05T00:00:00", datemodified: "2026-10-05T01:00:00", severitydata: { severitytext: "Magnitude 2" }, url: { report: "https://www.gdacs.org/r", geometry: "https://www.gdacs.org/g" } }, geometry: { type: "Point", coordinates: [-90.6, 19.9] } }] });
const flGeo = (alert: string, at = CAMPECHE) => ({ type: "FeatureCollection", features: [
  { type: "Feature", properties: { Class: "Point_Centroid", alertlevel: alert }, geometry: { type: "Point", coordinates: [at.lon, at.lat] } },
  { type: "Feature", properties: { Class: "Poly_Affected", alertlevel: alert, todate: "2026-10-05T00:00:00" }, geometry: square(at, 30) },
  { type: "Feature", properties: { Class: "Poly_Global", alertlevel: alert }, geometry: square(at, 600) },
] });

describe("inundaciones (GDACS FL)", () => {
  it("la lista pide ciclones, sismos e inundaciones, y lee los eventos FL", () => {
    expect(GDACS_LIST("2026-10-01")).toContain("eventlist=TC;EQ;FL");
    const ev = parseGdacsList(flList("Red"));
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ type: "FL", eventId: 1200001, alert: "Red" });
    expect(PREFILTER_KM.FL).toBeGreaterThan(0);
  });
  it("solo cuenta el área afectada; la cuenca completa y el centroide se ignoran", () => {
    const layers = parseFlGeometry(flGeo("Orange"));
    expect(layers).toHaveLength(1);
    expect(layers[0]).toMatchObject({ zone: "naranja", forecast: false });
    expect(parseFlGeometry(flGeo("Red"))[0].zone).toBe("roja");
    expect(parseFlGeometry({})).toEqual([]);
  });
  it("una inundación roja sobre Campeche llega solo a la empresa con sede en Campeche", () => {
    const ev = parseGdacsList(flList("Red"))[0];
    const layers = parseFlGeometry(flGeo("Red"));
    const c = candidateFor(BIG, ev, layers);
    expect(c).toMatchObject({ ev: "fl1200001", kind: "inundacion", family: "clima", status: "observado", sites: { campeche: "roja" }, name: "Inundación en Mexico" });
    expect(candidateFor(STEEL, ev, layers)).toBeNull(); // la acería compacta no tiene sede en Campeche
    expect(candidateFor(RETAIL, ev, layers)).toBeNull(); // las tiendas están en el noreste
    expect(cleanWorldInput({ ...c!, mode: "real" })).not.toBeNull();
  });
  it("lejos de las sedes (la inundación de Tabasco y Chiapas de 2020) no llega", () => {
    const ev = parseGdacsList(flList("Orange"))[0];
    expect(candidateFor(BIG, ev, parseFlGeometry(flGeo("Orange", { lat: 17.99, lon: -92.93 })))).toBeNull();
  });
});

describe("perfil comercial por empresa", () => {
  it("cada plantilla registra importación, exportación, orígenes, destinos, categorías y quién importa", () => {
    for (const [id, x] of Object.entries(EXPOSURE)) {
      expect(x.profile.importShare, id).toBeGreaterThanOrEqual(0);
      expect(x.profile.exportShare, id).toBeGreaterThanOrEqual(0);
      expect(x.profile.categories.length, id).toBeGreaterThan(0);
      for (const l of x.profile.lines) { expect(l.origin && l.destination && l.incoterm, id).toBeTruthy(); expect(typeof l.importerOfRecord).toBe("boolean"); }
    }
    expect(exposureOf(BIG)!.sites.find((s) => s.id === "campeche")).toMatchObject({ kind: "bodega", salesShare: 0.12 });
  });
});

describe("arancel de EE. UU. al acero (Sección 232) · quién paga", () => {
  it("la tabla verificada da 25 % en marzo de 2025 y 50 % desde junio de 2025", () => {
    expect(usSteelRateAt("2025-03-01").rate).toBe(0);
    expect(usSteelRateAt("2025-03-12").rate).toBe(0.25);
    expect(usSteelRateAt("2025-06-04").rate).toBe(0.5);
    expect(usSteelRateAt("2026-11-01").rate).toBe(0.5);
    for (const m of US_MEASURES) expect(m.url).toMatch(/^https:\/\/www\.federalregister\.gov\/documents\//);
  });
  it("DAP (el comprador importa): nada directo para la empresa; DDP: el cargo es suyo", () => {
    expect(usIncidence(false, 0.25)).toMatchObject({ payer: "comprador", direct: 0 });
    expect(usIncidence(true, 0.25)).toMatchObject({ payer: "empresa", direct: 0.25 });
    expect(usIncidence(false, 0.25).inevitableVol).toBeGreaterThan(0);
  });
  it("sin exportación registrada a EE. UU. no hay exposición (cadena de tiendas)", () => {
    const f = { t: "arancel" as const, from: 0.25, to: 0.5, since: "2025-06-03", until: "2025-06-04", effective: "2025-06-04", rule: "us_232_acero", hs: ["7207"] };
    expect(usExportLine(RETAIL, ["7207"])).toBeNull();
    expect(factsExposed(RETAIL, "arancel", f)).toBe(false);
    expect(factsExposed(STEEL, "arancel", f)).toBe(true);
  });
  it("el tablero emite solo cambios de tasa recientes y vigentes; lo que ya regía es entorno, no caso", () => {
    const feed: EconFeed = { at: 0, ok: true, fx: [], rate: [], moves: [], tariffs: [], radar: [], sources: { dof: true, fr: true, gdelt: false } };
    const jun = Date.parse("2025-06-20T12:00:00Z");
    const c = econCandidatesFor(feed, STEEL, { now: jun });
    expect(c.map((x) => x.ev)).toEqual(["fr202510524"]); // la de marzo (25 %) ya tiene más de 120 días: es entorno
    expect(c[0]).toMatchObject({ src: "fr", kind: "arancel", facts: { from: 0.25, to: 0.5, rule: "us_232_acero" } });
    expect(econCandidatesFor(feed, RETAIL, { now: jun })).toEqual([]);
    expect(econCandidatesFor(feed, STEEL, { now: Date.parse("2026-11-10T12:00:00Z") })).toEqual([]); // 11021 y 11032 no cambian la tasa
    expect(econCandidatesFor(feed, STEEL, { now: jun, off: ["comercio"] })).toEqual([]);
  });
  const usEp = (): WorldEpisode => ({ ...exerciseInput(BIG, Date.parse("2026-11-10T12:00:00Z"), "arancel_eeuu")!, id: "xus1", day: 0, at: 1, rv: 2 } as WorldEpisode);
  const exporting = () => {
    const s = createSteel(BIG, "x");
    expect(applySteel(s, { type: "add_contract", id: "k1", client: "Comprador de Houston (exportación)", product: "palanquilla", tpd: 30, price: 11_400, dso: 30, startInDays: 0 }).ok).toBe(true);
    return s;
  };
  it("sin contrato de exportación vigente la partida no recibe el caso", () => {
    const log = newGrowthLog(BIG, "u1")!;
    expect(exportContractOf(steelOf(log, 10).state)).toBeNull();
    expect(openWorldLog(log, exerciseInput(BIG, Date.parse("2026-11-10T12:00:00Z"), "arancel_eeuu")!, 10, 1, ON)).toBeNull();
    expect(exerciseInput(RETAIL, 1, "arancel_eeuu")).toBeNull();
  });
  it("con contrato DAP: opciones con quién paga; compartir y redirigir pierden menos volumen que no hacer nada; DDP sostiene volumen pero paga el arancel", () => {
    const s = exporting();
    const ep = usEp();
    const c = steelWorldCase(s, ep);
    expect(c.options.map((o) => o.id)).toEqual(["base", "compartir", "redirigir", "ddp"]);
    expect(c.body(s).join(" ")).toMatch(/importador de registro/);
    const tpdOf = (o: string | null) => (steelImpact(s, ep, o).commands.find((x) => x.type === "change_contract") as { tpd: number } | undefined)?.tpd ?? 30;
    expect(tpdOf("base")).toBeLessThan(tpdOf("compartir"));
    expect(tpdOf("ddp")).toBe(30);
    const inev = steelImpact(s, { ...ep, only: "inevitable" } as WorldEpisode, null);
    expect((inev.commands[0] as { tpd: number }).tpd).toBe(tpdOf("compartir")); // lo inevitable es lo mismo para todos
    expect(steelImpact(s, ep, "base").parts?.evitable.length).toBeGreaterThan(0);
    const ddp = c.options.find((o) => o.id === "ddp")!.commands(s, "k");
    expect(ddp.some((x) => x.type === "change_contract" && (x as { price: number }).price < 11_400)).toBe(true);
  });
});

describe("clima v2 · seis frentes y parte inevitable", () => {
  it("las opciones de preparación cubren frentes explícitos; la integral cubre los seis", () => {
    expect([...OPTION_FRONTS.integral].sort()).toEqual([...FRONTS].sort());
    expect(OPTION_FRONTS.monitorear).toEqual([]);
  });
  it("Campeche: el caso habla de personal, continuidad, inventario, proveedores, clientes y caja", () => {
    const log = openWorldLog(newGrowthLog(BIG, "c1")!, exerciseInput(BIG, 1_000, "inundacion")!, 5, 1, {})!;
    expect(log.world![0]).toMatchObject({ kind: "inundacion", mode: "ejercicio", sites: { campeche: "roja" }, rv: 2 });
    const p = steelPendingOf(log, 5)!;
    const txt = [...p.body, ...p.options.map((o) => `${o.label} ${o.detail}`)].join(" ").toLowerCase();
    for (const w of ["personal", "inventario", "proveedor", "cliente", "seguro"]) expect(txt, w).toContain(w);
    expect(p.world?.mode).toBe("ejercicio");
  });
  it("inundación en la bodega de Campeche: integral pierde menos que protocolo y protocolo menos que monitorear; nunca cero", () => {
    // Capital contable a 120 días (resultado económico; la caja se mueve con plazos de cobro y del seguro).
    const base = balanceSheet(steelOf(newGrowthLog(BIG, "c1")!, 120).state).equity;
    const run = (o: string) => {
      let log = openWorldLog(newGrowthLog(BIG, "c1")!, exerciseInput(BIG, 1_000, "inundacion")!, 5, 1, {})!;
      log = decideGrowth(log, 5, `w:${log.world![0].id}`, o).log;
      return balanceSheet(steelOf(log, 120).state).equity;
    };
    const [i, p, m] = [run("integral"), run("protocolo"), run("monitorear")];
    expect(i).toBeLessThan(base);
    expect(p).toBeLessThan(i);
    expect(m).toBeLessThan(p);
  });
  it("el ejercicio de inundación en la cadena de tiendas usa Monterrey (no tiene Campeche)", () => {
    const e = exerciseInput(RETAIL, 1_000, "inundacion")!;
    expect(e.sites).toEqual({ mty: "roja", cedis: "naranja" });
    const s = createRetail(RETAIL, "x");
    expect(retailWorldCase(s, { ...e, id: "x1", day: 0, at: 1, rv: 2 } as WorldEpisode).options.length).toBeGreaterThan(2);
  });
});

describe("sin duplicados ni avisos equivocados", () => {
  const real = (over: Partial<WorldOpenInput> = {}): WorldOpenInput => ({ src: "gdacs", ev: "fl1200001", rev: 3, family: "clima", kind: "inundacion", mode: "real", name: "Inundación en Mexico", status: "observado", severity: "", source: { name: "GDACS (ONU y Comisión Europea)", url: "https://www.gdacs.org/r" }, observedAt: 1, sites: { campeche: "roja" }, ...over });
  it("el mismo acontecimiento abre una sola vez; la misma revisión no vuelve a abrir", () => {
    const log = newGrowthLog(BIG, "d1")!;
    const w1 = openWorld(log, real(), 5, 1, ON)!;
    expect(w1).toHaveLength(1);
    expect(openWorld({ ...log, world: w1 }, real(), 6, 2, ON)).toBeNull();
    expect(openWorld({ ...log, world: w1 }, real({ rev: 2, sites: { campeche: "naranja" } }), 6, 2, ON)).toBeNull();
  });
  it("sin preferencia o con clima silenciado, nada real llega", () => {
    const log = newGrowthLog(BIG, "d1")!;
    expect(openWorld(log, real(), 5, 1, {})).toBeNull();
    expect(openWorld(log, real(), 5, 1, { worldEvents: true, worldMute: ["clima"] })).toBeNull();
  });
  it("aviso: clave única por acontecimiento y revisión; los ejercicios nunca avisan", () => {
    const at = Date.parse("2026-03-02T15:00:00Z");
    const mk = (ep: WorldOpenInput) => {
      const log = openWorldLog(newGrowthLog(BIG, "d1")!, ep, 0, at, ON)!;
      return { settings: { worldEvents: true }, growth: log, startedAt: at, lastActiveAt: at, savedAt: at } as unknown as Parameters<typeof worldJobs>[0];
    };
    const ex = mk(exerciseInput(BIG, at, "inundacion")!);
    expect(worldJobs(ex, {}, at + 1)).toEqual([]);
  });
  it("una partida con un episodio guardado antes de v2 (sin rv) conserva las reglas viejas", () => {
    let log = openWorldLog(newGrowthLog(STEEL, "v1")!, { src: "gdacs", ev: "tc9", rev: 3, family: "clima", kind: "ciclon", mode: "real", name: "Ciclón tropical X", status: "pronostico", severity: "", source: { name: "GDACS", url: "https://www.gdacs.org/" }, observedAt: 1, sites: { planta: "roja" } }, 5, 1, ON)!;
    log = { ...log, world: log.world!.map(({ rv: _rv, ...e }) => e) };
    const p = steelPendingOf(log, 5)!;
    expect(p.options.map((o) => o.id)).toContain("preventivo"); // opciones v1
    const done = endWorldLog(decideGrowth(log, 5, "w:tc9", "preventivo").log, "tc9", { planta: "roja" }, 8, 2)!;
    expect(steelOf(done, 20).external[0].parts).toBeUndefined();
  });
});
