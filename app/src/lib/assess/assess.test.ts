import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { COMPETENCY_IDS, INDUSTRIES, INDUSTRY_IDS, caseViews, caseOutcomes, measurable, PILOT_NOTICE, ASSESS_VALIDATED, type Industry } from "./catalog";
import { BAND_LABEL, cleanAnswer, cleanCandidate, cleanVacancy, compare, newToken, isTokenShape, optionScore, scoreCandidate, tokenHash, type Answer } from "./model";

const BANNED = [/de cero a ceo|\blibro\b/i, /próximamente/i, /en preparación/i, /más adelante:/i];
const pick = (ind: Industry, how: "best" | "worst", k?: (typeof COMPETENCY_IDS)[number]): Answer[] => caseOutcomes(ind).map((c) => {
  const live = c.options.filter((o) => o.available && o.metrics);
  const val = (o: (typeof live)[number]) => { const ks = k ? [k] : c.measures; return ks.reduce((a, kk) => a + (optionScore(c, o.optionId, kk) ?? 0), 0); };
  const o = live.reduce((x, y) => ((how === "best" ? val(y) > val(x) : val(y) < val(x)) ? y : x));
  return { caseId: c.caseId, optionId: o.optionId, reasoning: "Lo elijo porque protege la operación y la caja en los próximos meses.", ms: 60_000 };
});

describe("Assess v1 · catálogo", () => {
  it("solo dos industrias, ocho casos cada una, todos existentes y con al menos dos opciones elegibles", () => {
    expect(INDUSTRY_IDS).toEqual(["retail", "acero"]);
    for (const ind of INDUSTRY_IDS) {
      const outs = caseOutcomes(ind);
      expect(outs).toHaveLength(8);
      for (const c of outs) expect(c.options.filter((o) => o.available).length, c.caseId).toBeGreaterThanOrEqual(2);
    }
  });

  it("criterio consistente: misma regla por área en ambas industrias; solo se ofrecen competencias con 2+ casos que las midan", () => {
    expect(measurable("acero")).toEqual(["finanzas", "liquidez", "personas", "relaciones", "estrategia"]);
    expect(measurable("retail")).toEqual(["finanzas", "liquidez", "personas", "estrategia"]);
    for (const ind of INDUSTRY_IDS) for (const k of measurable(ind)) expect(caseOutcomes(ind).filter((c) => c.measures.includes(k)).length).toBeGreaterThanOrEqual(2);
    // Una vacante de retail no puede pedir lo que el catálogo de retail no mide con suficiente evidencia.
    expect(cleanVacancy({ title: "Gerente", industry: "retail", weights: { finanzas: 2, relaciones: 3 } }).ok).toBe(false);
    // Los casos de seguridad siempre miden personas.
    for (const ind of INDUSTRY_IDS) for (const c of caseOutcomes(ind)) if (["op_frio", "se_noche", "op_refractario", "se_casi"].includes(c.caseId)) expect(c.measures, c.caseId).toContain("personas");
  });

  it("las opciones peligrosas siguen bloqueadas y no se pueden elegir", () => {
    const blocked = caseViews("acero").flatMap((c) => c.options.filter((o) => o.blocked).map((o) => [c.id, o.id] as const));
    expect(blocked.length).toBeGreaterThanOrEqual(2);
    for (const [caseId, optionId] of blocked) expect(cleanAnswer("acero", { caseId, optionId, reasoning: "porque sí, me parece bien", ms: 1 }).ok).toBe(false);
  });

  it("todos ven exactamente lo mismo: catálogo determinista (misma empresa, mismo día, mismo orden)", () => {
    for (const ind of INDUSTRY_IDS) {
      const a = JSON.stringify(caseViews(ind));
      expect(a.length).toBeGreaterThan(1000);
      expect(JSON.stringify(caseViews(ind))).toBe(a);
    }
  });

  it("la vista del candidato no revela postura, puntaje ni consecuencias", () => {
    const txt = JSON.stringify(caseViews("retail")) + JSON.stringify(caseViews("acero"));
    expect(txt).not.toMatch(/stance|prudente|arriesgada|equity|metrics|measures/);
  });

  it("textos sin cadenas prohibidas", () => {
    const txt = JSON.stringify([caseViews("retail"), caseViews("acero"), INDUSTRIES, PILOT_NOTICE]);
    for (const b of BANNED) expect(txt).not.toMatch(b);
  });
});

describe("Assess v1 · puntaje", () => {
  const w = { finanzas: 2, liquidez: 1, personas: 3, relaciones: 1, estrategia: 2 } as const; // en retail «relaciones» queda sin puntaje y se avisa
  it("quien elige lo mejor en cada caso saca más que quien elige lo peor, en ambas industrias", () => {
    for (const ind of INDUSTRY_IDS) {
      const good = scoreCandidate(ind, w, pick(ind, "best"));
      const bad = scoreCandidate(ind, w, pick(ind, "worst"));
      expect(good.complete).toBe(true);
      expect(good.overall!).toBeGreaterThan(bad.overall!);
      expect(good.overall!).toBeGreaterThanOrEqual(60);
      expect(bad.overall!).toBeLessThanOrEqual(40);
    }
  });

  it("el razonamiento y el tiempo no cambian el puntaje; solo generan alertas para revisión", () => {
    const a = pick("retail", "best");
    const fast = a.map((x) => ({ ...x, reasoning: "rápido", ms: 3_000 }));
    const r1 = scoreCandidate("retail", w, a), r2 = scoreCandidate("retail", w, fast);
    expect(r2.overall).toBe(r1.overall);
    expect(r2.flags.map((f) => f.kind)).toEqual(expect.arrayContaining(["rapido", "breve"]));
    expect(r1.flags.filter((f) => f.kind === "rapido" || f.kind === "breve")).toHaveLength(0);
  });

  it("incompleto: sin puntaje global y marcado", () => {
    const r = scoreCandidate("acero", w, pick("acero", "best").slice(0, 5));
    expect(r.complete).toBe(false);
    expect(r.overall).toBeNull();
    expect(r.band).toBe("insuficiente");
    expect(r.flags[0].kind).toBe("incompleto");
  });

  it("los pesos de la vacante importan: optimizar finanzas vs personas cambia el resultado según la vacante", () => {
    const fin = pick("retail", "best", "finanzas");
    const ppl = pick("retail", "best", "personas");
    const byFin = scoreCandidate("retail", { finanzas: 3, personas: 1 }, fin).overall! - scoreCandidate("retail", { finanzas: 3, personas: 1 }, ppl).overall!;
    const byPpl = scoreCandidate("retail", { finanzas: 1, personas: 3 }, fin).overall! - scoreCandidate("retail", { finanzas: 1, personas: 3 }, ppl).overall!;
    expect(byFin).toBeGreaterThan(byPpl);
  });

  it("las recomendaciones son para revisión humana: preguntas de entrevista, nunca contratar o descartar", () => {
    const r = scoreCandidate("acero", w, pick("acero", "worst"));
    expect(r.pilot).toBe(true);
    expect(r.validated).toBe(ASSESS_VALIDATED);
    expect(ASSESS_VALIDATED).toBe(false);
    expect(r.probe.length).toBeGreaterThan(0);
    // Solo el texto que genera Assess (los casos del motor sí pueden hablar de contratos con clientes).
    // Se excluye lo citado entre «» (nombres de casos y opciones del motor, p. ej. «Rechazar el reclamo»).
    const txt = JSON.stringify([r.strengths, r.probe, r.flags, BAND_LABEL]).replace(/«[^»]*»/g, "«»");
    expect(txt).not.toMatch(/contrat|descart|rechaz|\bapto\b|recomendamos/i);
    for (const e of r.evidence) expect(e.reasoning.length).toBeGreaterThan(0);
  });

  it("comparativo: los completos primero, por puntaje", () => {
    const rows = compare([
      { id: "a", report: scoreCandidate("retail", w, pick("retail", "worst")) },
      { id: "b", report: scoreCandidate("retail", w, pick("retail", "best").slice(0, 3)) },
      { id: "c", report: scoreCandidate("retail", w, pick("retail", "best")) },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["c", "a", "b"]);
  });
});

describe("Assess v1 · entradas", () => {
  it("vacante: nombre, industria válida y al menos dos competencias", () => {
    expect(cleanVacancy({ title: "Gerente regional", industry: "retail", weights: { finanzas: 2, personas: 3 } }).ok).toBe(true);
    expect(cleanVacancy({ title: "Gerente", industry: "restaurante", weights: { finanzas: 2, personas: 3 } }).ok).toBe(false);
    expect(cleanVacancy({ title: "Gerente", industry: "acero", weights: { finanzas: 2 } }).ok).toBe(false);
    expect(cleanVacancy({ title: "Gerente", industry: "acero", weights: { finanzas: 9, otra: 2, personas: 1 } }).ok).toBe(false);
  });
  it("candidato y respuesta", () => {
    expect(cleanCandidate({ label: "Candidato A", email: "x@y.mx" }).ok).toBe(true);
    expect(cleanCandidate({ label: "A", email: "" }).ok).toBe(false);
    expect(cleanCandidate({ label: "Ana", email: "no-es-correo" }).ok).toBe(false);
    const c = caseOutcomes("retail")[0];
    const o = c.options.find((x) => x.available)!;
    expect(cleanAnswer("retail", { caseId: c.caseId, optionId: o.optionId, reasoning: "corto", ms: 1 }).ok).toBe(false);
    expect(cleanAnswer("retail", { caseId: "op_refractario", optionId: "relinear", reasoning: "de otra industria", ms: 1 }).ok).toBe(false);
  });
  it("enlace del candidato: aleatorio, con forma fija; en la base solo va la huella", () => {
    const a = newToken(), b = newToken();
    expect(a.token).not.toBe(b.token);
    expect(isTokenShape(a.token)).toBe(true);
    expect(isTokenShape("../../etc")).toBe(false);
    expect(a.hash).toBe(tokenHash(a.token));
    expect(a.hash).not.toContain(a.token);
  });
});

describe("Assess v1 · separado de CEO", () => {
  it("no importa nada que escriba en partidas, jugadores ni avisos", () => {
    for (const f of ["catalog.ts", "model.ts", "server.ts"]) {
      const src = readFileSync(new URL(`./${f}`, import.meta.url), "utf8");
      expect(src, f).not.toMatch(/growth\/session|ceo\/journal|ceo\/push|ceo\/notify|ceo\/sync|from\("players"\)|schema\("ceo"\)|supabaseCeoAdmin/);
    }
  });
});
