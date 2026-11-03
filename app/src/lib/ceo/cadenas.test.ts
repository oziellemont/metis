/**
 * Cadenas piloto de consecuencias (v7): una por empresa (Forja, Brasa, Kúbit, Punto Madero, Vértice).
 *
 * Lo que se prueba, empresa por empresa (antes de multiplicar el formato):
 *  1. Solo llegan en periodos v7: los periodos v6, v4 y las temporadas no cambian.
 *  2. Causalidad: cada consecuencia llega después de su detonador y la pantalla lo conecta con esa decisión.
 *  3. Caminos distintos, problemas distintos: a, b y c llevan a asuntos distintos; dos de ellos son inciertos.
 *  4. La incertidumbre es honesta: la frecuencia real coincide con la que el caso le dice al jugador.
 *  5. Cada opción tiene costo y beneficio; ninguna domina; el score no coincide con «la que más paga».
 *  6. Hechos y personajes consistentes: todos los personajes existen en el elenco de la empresa.
 */
import { describe, expect, it } from "vitest";
import { DAY, decide, entries, inRoll, newState, seasonItems, setupCompany } from "./engine";
import { continuityOf } from "./continuity";
import { companyById } from "./companies";
import { CADENA_FORJA } from "./companies/forja-cadena";
import { CADENA_BRASA } from "./companies/brasa-cadena";
import { CADENA_KUBIT } from "./companies/kubit-cadena";
import { CADENA_PUNTOMADERO } from "./companies/puntomadero-cadena";
import { CADENA_VERTICE } from "./companies/vertice-cadena";
import { auditItem } from "./editorial";
import { LEGACY_CONTINUOUS_RULES_VERSION } from "./rules";
import type { CompanyArchetype } from "./career/taxonomy";
import type { CeoState, Item } from "./types";

const CID = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const T0 = Date.UTC(2026, 10, 9, 15, 0, 0);
const KEYS = ["caja", "margen", "clientes", "equipo", "consejo"] as const;

interface Pilot { pack: string; chain: Item[]; sectorId: string; industryId: string; archetype: CompanyArchetype; stated: [string, string, number][] }
const PILOTS: Pilot[] = [
  { pack: "forja", chain: CADENA_FORJA, sectorId: "manufactura", industryId: "autopartes", archetype: "establecida", stated: [["b", "fn-c-inv-faltante", 0.45], ["c", "fn-c-inv-factoraje", 0.4]] },
  { pack: "brasa", chain: CADENA_BRASA, sectorId: "restaurantes_alimentos", industryId: "restaurantes", archetype: "establecida", stated: [["b", "gb-c-prov-resenas", 0.5], ["c", "gb-c-prov-contrato", 0.4]] },
  { pack: "kubit", chain: CADENA_KUBIT, sectorId: "tecnologia_informacion", industryId: "software_saas", archetype: "startup", stated: [["b", "kb-c-nube-caida", 0.45], ["c", "kb-c-nube-compromiso", 0.4]] },
  { pack: "puntomadero", chain: CADENA_PUNTOMADERO, sectorId: "comercio", industryId: "retail", archetype: "establecida", stated: [["b", "pm-c-temp-guerra", 0.5], ["c", "pm-c-temp-bodega", 0.4]] },
  { pack: "vertice", chain: CADENA_VERTICE, sectorId: "transporte_almacenamiento", industryId: "logistica_distribucion", archetype: "establecida", stated: [["b", "vl-c-diesel-licitacion", 0.5], ["c", "vl-c-diesel-telemetria", 0.4]] },
];

const own = (p: Pilot, start: number, rulesVersion?: number): CeoState =>
  setupCompany({ ...newState(), name: "Oziel", alias: "oziel", startedAt: start, company: p.pack }, { companyId: CID, sectorId: p.sectorId, industryId: p.industryId, archetype: p.archetype, displayName: "Empresa QA" }, start, rulesVersion);
const late = (s: CeoState) => (s.startedAt ?? 0) + 30 * DAY;
function startWhere(p: Pilot, ok: (s: CeoState) => boolean): CeoState {
  for (let k = 0; k < 500; k++) { const s = own(p, T0 + k * 3_600_000); if (ok(s)) return s; }
  throw new Error("sin inicio que cumpla");
}
function play(s: CeoState, id: string, opt: string): CeoState {
  const e = entries(s, late(s)).find((x) => x.item.id === id);
  if (!e) throw new Error(`${id} no llegó`);
  return decide(s, id, opt, e.arrivesAt + 60_000);
}

for (const p of PILOTS) {
  const root = p.chain.find((i) => !i.trigger)!;
  const ids = p.chain.map((i) => i.id);
  const chainOf = (s: CeoState) => entries(s, late(s)).filter((e) => ids.includes(e.item.id)).map((e) => e.item.id).sort();
  const consequenceOf = (opt: string) => p.chain.find((i) => i.trigger?.options.includes(opt))!;

  describe(`Cadena piloto · ${p.pack}`, () => {
    it("una decisión raíz y tres consecuencias, una por camino; todas con reglas v7", () => {
      expect(p.chain).toHaveLength(4);
      expect(p.chain.every((i) => i.since === 7)).toBe(true);
      expect(new Set(p.chain.filter((i) => i.trigger).map((i) => i.trigger!.options.join()))).toEqual(new Set(["a", "b", "c"]));
      for (const c of p.chain) if (c.trigger) { expect(c.trigger.item).toBe(root.id); expect(c.day, c.id).toBeGreaterThan(root.day); }
    });

    it("llega en periodos v7 y no en v6, v4 ni en temporadas (el historial no cambia)", () => {
      expect(seasonItems(own(p, T0)).some((i) => i.id === root.id)).toBe(true);
      expect(seasonItems(own(p, T0, 6)).some((i) => ids.includes(i.id))).toBe(false);
      expect(seasonItems(own(p, T0, LEGACY_CONTINUOUS_RULES_VERSION)).some((i) => ids.includes(i.id))).toBe(false);
      const season: CeoState = { ...newState(), name: "Oziel", alias: "oziel", company: p.pack, startedAt: T0, rulesVersion: 5 };
      expect(seasonItems(season).some((i) => ids.includes(i.id))).toBe(false);
    });

    it("camino a: su consecuencia llega siempre (no es incierta) y es distinta a las otras", () => {
      const a = consequenceOf("a");
      expect(a.trigger!.roll).toBeUndefined();
      const s = play(own(p, T0), root.id, "a");
      expect(chainOf(s)).toEqual([a.id, root.id].sort());
    });

    for (const [opt, cid, prob] of p.stated) {
      it(`camino ${opt}: incierto (${Math.round(prob * 100)} de cada 100); si no ocurre, la cadena se detiene`, () => {
        const hit = play(startWhere(p, (x) => inRoll(x, root.id, [0, prob])), root.id, opt);
        expect(chainOf(hit)).toEqual([cid, root.id].sort());
        const miss = play(startWhere(p, (x) => inRoll(x, root.id, [prob, 1])), root.id, opt);
        expect(chainOf(miss)).toEqual([root.id]);
      });
      it(`camino ${opt}: la frecuencia real coincide con la que el caso le dice al jugador`, () => {
        const N = 400;
        let n = 0;
        for (let k = 0; k < N; k++) if (inRoll({ startedAt: T0 + k * 7_919_000 }, root.id, [0, prob])) n++;
        expect(Math.abs(n / N - prob)).toBeLessThan(0.08);
        const told = JSON.stringify(root.data);
        const tenths = Math.round(prob * 10);
        expect(told, `${root.id} debe decir la probabilidad`).toMatch(new RegExp(`(${Math.floor(prob * 10)} o ${Math.ceil(prob * 10)}|${tenths}|1) de cada (10|2)`));
      });
    }

    it("la consecuencia llega después de la decisión y la pantalla la conecta con ella", () => {
      const s0 = own(p, T0);
      const d = entries(s0, late(s0)).find((x) => x.item.id === root.id)!;
      const s = decide(s0, root.id, "a", d.arrivesAt + 60_000);
      const c = entries(s, late(s)).find((x) => x.item.id === consequenceOf("a").id)!;
      expect(c.arrivesAt).toBeGreaterThan(d.arrivesAt + 60_000);
      const links = continuityOf(s, c.item.id, c.arrivesAt + 60_000).links;
      expect(links[0].kind).toBe("detonador");
    });

    it("cada opción tiene costo y beneficio; ninguna domina ni la de mejor score es la que más paga", () => {
      const pack = companyById(p.pack);
      for (const it of p.chain) {
        for (const o of it.options) {
          const v = KEYS.map((k) => o.effects[k] ?? 0);
          expect(v.some((x) => x > 0), `${it.id}/${o.id} sin beneficio`).toBe(true);
          expect(v.some((x) => x < 0), `${it.id}/${o.id} sin costo`).toBe(true);
        }
        const f = auditItem(pack, it).findings;
        expect(f, it.id).not.toContain("dominante");
        expect(f, it.id).not.toContain("score_paga");
        expect(f, it.id).not.toContain("obvia");
      }
    });

    it("todos los personajes existen en el elenco de la empresa (hechos y personajes consistentes)", () => {
      const cast = companyById(p.pack).cast as Record<string, unknown>;
      for (const it of p.chain) {
        expect(cast[it.from], `${it.id} from ${it.from}`).toBeTruthy();
        for (const w of it.involves ?? []) expect(cast[w], `${it.id} involves ${w}`).toBeTruthy();
        for (const o of it.options) for (const w of Object.keys(o.stance ?? {})) expect(cast[w], `${it.id}/${o.id} stance ${w}`).toBeTruthy();
      }
    });
  });
}
