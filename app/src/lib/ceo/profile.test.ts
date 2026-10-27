import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { migrate, newState, rand01, xpOf } from "./engine";
import { masteryOf, COMPETENCY_IDS, TRACK_TO, type Mastery } from "./mastery";
import { TRACKS } from "./lessons";
import { EVENT_NAMES, sanitizeEvent } from "./events";
import { careerFacts, journeyOf } from "./journey";
import { replay } from "./replay";
import { snapshotOf, type Golden } from "./golden/play";
import {
  DIAGNOSTIC, EXP_AREAS, EXPLORE_EVERY, GOALS, INDUSTRIES, NUDGE_AFTER_MS, NUDGE_SNOOZE_MS, QUESTIONS, READING_FADE_N, ROLES, YEARS,
  NUDGE_QUIET_MS, OFFERED_TIER, nudgeQuiet, personalized, trackHints, aiContext, companyForIndustry, declaredCompetencies, finalizeProfile, diagnosticOffered, helpBand, initialReading, recommendOrder, sanitizeDiagnostic, sanitizeProfile,
  shouldNudge, snoozeNudge, suggestTier, type InitialDiagnostic, type ProfessionalProfile,
} from "./profile";
import { buildMessages, writtenEligible } from "./written";
import { companyById } from "./companies";

const DIR = join(__dirname, "golden", "data");
const GOLDENS: Golden[] = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));

const pick = <T,>(list: readonly T[], r: number) => list[Math.floor(r * list.length) % list.length];
function randomProfile(seed: string): ProfessionalProfile {
  const r = (k: string) => rand01(seed + k);
  const areas = EXP_AREAS.filter((_, i) => r("a" + i) < 0.3).map((a) => a.id);
  return { v: 1, role: pick(ROLES, r("r")).id, areas, years: pick(YEARS, r("y")).id, industry: pick(INDUSTRIES, r("i")).id, goal: pick(GOALS, r("g")).id, skipped: [], source: "onboarding", answeredAt: 1, updatedAt: 1 };
}
function randomDiagnostic(seed: string): InitialDiagnostic {
  return { v: 1, set: "d1", answers: DIAGNOSTIC.map((d, i) => ({ id: d.id, option: pick(d.options, rand01(seed + i)).id, at: 1 })), finishedAt: 1 };
}
const emptyMastery = (): Mastery => masteryOf(newState());

const VETERANO: ProfessionalProfile = { v: 1, role: "director", areas: ["operaciones", "suministro", "personas"], years: "15+", industry: "manufactura", goal: "ascenso", skipped: [], source: "onboarding", answeredAt: 1, updatedAt: 1 };
const EGRESADO: ProfessionalProfile = { v: 1, role: "estudiante", areas: ["finanzas"], years: "<2", industry: "financieros", goal: "negocio", skipped: [], source: "onboarding", answeredAt: 1, updatedAt: 1 };

describe("perfil profesional · catálogos", () => {
  it("5 preguntas y catálogos con ids únicos", () => {
    expect(QUESTIONS).toHaveLength(5);
    for (const list of [ROLES, EXP_AREAS, YEARS, INDUSTRIES, GOALS]) expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
  });
  it("cada área declarada apunta a competencias reales", () => {
    for (const a of EXP_AREAS) for (const c of a.to) expect(COMPETENCY_IDS).toContain(c);
  });
  it("el diagnóstico tiene 3 decisiones, cada una con una mejor opción clara y sin empates arriba", () => {
    expect(DIAGNOSTIC).toHaveLength(3);
    for (const d of DIAGNOSTIC) expect(d.options.filter((o) => o.score === 3)).toHaveLength(1);
    expect(new Set(DIAGNOSTIC.flatMap((d) => d.competencies)).size).toBe(6);
  });
});

describe("P-04 / P-05 · lo declarado y el diagnóstico nunca cambian dominio, etapa, XP ni la partida", () => {
  it.each(GOLDENS.map((g) => [g.id, g] as const))("%s con 6 perfiles y diagnósticos al azar", (_id, g) => {
    const { state } = replay(g.actions);
    const t = g.checkpoints[g.checkpoints.length - 1].at;
    const base = { m: masteryOf(state, t), j: journeyOf(state, t), xp: xpOf(state, t), snap: snapshotOf(state, t) };
    for (let k = 0; k < 6; k++) {
      const s2 = { ...state, profile: randomProfile(g.id + k), diagnostic: k % 2 ? randomDiagnostic(g.id + k) : undefined };
      expect(masteryOf(s2, t)).toEqual(base.m);
      expect(journeyOf(s2, t)).toEqual(base.j);
      expect(xpOf(s2, t)).toBe(base.xp);
      expect(snapshotOf(s2, t)).toEqual(base.snap);
    }
  });
});

describe("P-06 · lectura inicial", () => {
  it("se separa del dominio y desaparece con 5 decisiones reales", () => {
    const d: InitialDiagnostic = { v: 1, set: "d1", answers: [{ id: "d1-politica", option: "b", at: 1 }, { id: "d1-credito", option: "a", at: 1 }], finishedAt: 1 };
    const m = emptyMastery();
    const r0 = initialReading(d, m);
    expect(r0.personas).toEqual({ signal: "alta", weight: 1 });
    expect(r0.finanzas.signal).toBe("reforzar");
    expect(r0.estrategia.signal).toBe("sin");
    for (const n of [1, 2, 3, 4]) {
      const mm = { ...m, personas: { ...m.personas, n } };
      expect(initialReading(d, mm).personas.weight).toBeCloseTo(1 - n / READING_FADE_N, 3);
    }
    const done = { ...m, personas: { ...m.personas, n: 5 } };
    expect(initialReading(d, done).personas).toEqual({ signal: "sin", weight: 0 });
  });
  it("solo se ofrece con menos de 10 decisiones y si no se ha hecho", () => {
    expect(diagnosticOffered(0)).toBe(true);
    expect(diagnosticOffered(9)).toBe(true);
    expect(diagnosticOffered(10)).toBe(false);
    expect(diagnosticOffered(0, { v: 1, set: "d1", answers: [], finishedAt: 5 })).toBe(false);
  });
});

describe("P-07 / P-08 · recomendaciones", () => {
  it("al menos 1 de cada 3 recomendaciones queda fuera de lo declarado (100 perfiles al azar)", () => {
    const m = emptyMastery();
    for (let i = 0; i < 100; i++) {
      const p = randomProfile("x" + i);
      const rec = recommendOrder(p, m, i % 3 ? randomDiagnostic("d" + i) : undefined);
      expect(rec).toHaveLength(8);
      expect(new Set(rec.map((r) => r.competency)).size).toBe(8); // nunca oculta nada
      const declared = declaredCompetencies(p);
      if (!declared.size || declared.size === 8) continue;
      const outsideTotal = 8 - declared.size;
      for (let b = 0; b + EXPLORE_EVERY <= 8; b += EXPLORE_EVERY) {
        const block = rec.slice(b, b + EXPLORE_EVERY);
        const usedOutside = rec.slice(0, b).filter((r) => r.outside).length;
        if (usedOutside < outsideTotal) expect(block.some((r) => r.outside), `perfil ${i}, bloque ${b}`).toBe(true);
      }
    }
  });
  it("veterano de operaciones y recién egresado de Finanzas reciben orden, ayuda y exigencia distintos", () => {
    const m = emptyMastery();
    const a = recommendOrder(VETERANO, m), b = recommendOrder(EGRESADO, m);
    expect(a.map((x) => x.competency)).not.toEqual(b.map((x) => x.competency));
    expect(a[0].competency).not.toBe("ejecucion");
    expect(b[0].competency).not.toBe("finanzas");
    expect(a.find((x) => x.competency === "ejecucion")!.review).toBe(true);
    expect(helpBand(VETERANO)).toBe("breve");
    expect(helpBand(EGRESADO)).toBe("completa");
    expect(suggestTier(VETERANO)).toBeGreaterThan(0);
    expect(suggestTier(EGRESADO)).toBe(0);
  });
  it("la evidencia real manda sobre lo declarado", () => {
    const m = emptyMastery();
    const weakOps = { ...m, ejecucion: { ...m.ejecucion, n: 8, value: 5 } };
    for (const c of COMPETENCY_IDS) if (c !== "ejecucion") weakOps[c] = { ...m[c], n: 8, value: 60 };
    expect(recommendOrder(VETERANO, weakOps)[0].competency).toBe("ejecucion");
  });
  it("sin perfil: orden por dominio, ayuda completa, exigencia normal", () => {
    const rec = recommendOrder(undefined, emptyMastery());
    expect(rec.map((r) => r.competency)).toEqual(COMPETENCY_IDS);
    expect(helpBand(undefined)).toBe("completa");
    expect(suggestTier(undefined)).toBe(0);
  });
});

describe("P-09 · usuarios actuales y datos", () => {
  it("migrate acepta partidas sin perfil y no cambia nada", () => {
    for (const g of GOLDENS) {
      const { state } = replay(g.actions);
      const t = g.checkpoints[g.checkpoints.length - 1].at;
      const m = migrate(JSON.parse(JSON.stringify(state)));
      expect(m.profile).toBeUndefined();
      expect(snapshotOf(m, t)).toEqual(snapshotOf(state, t));
    }
  });
  it("migrate limpia perfiles dañados sin romper la partida", () => {
    const s = migrate({ ...newState(), profile: { role: "rey", areas: ["finanzas", "hackeo", "finanzas"], years: 30, industry: "manufactura", skipped: ["goal", "x"], answeredAt: 5 }, diagnostic: { answers: [{ id: "d1-credito", option: "c", at: 1 }, { id: "nada", option: "a" }] }, profileNudge: "x" });
    expect(s.profile).toEqual({ v: 1, areas: ["finanzas"], industry: "manufactura", skipped: ["goal"], source: "onboarding", answeredAt: 5, updatedAt: 0 });
    expect(s.diagnostic!.answers).toEqual([{ id: "d1-credito", option: "c", at: 1 }]);
    expect(s.profileNudge).toBeUndefined();
    expect(migrate({ ...newState(), profile: "basura" }).profile).toBeUndefined();
  });
  it("sanitize es idempotente", () => {
    const p = sanitizeProfile(VETERANO)!;
    expect(sanitizeProfile(p)).toEqual(p);
    const d = sanitizeDiagnostic(randomDiagnostic("z"))!;
    expect(sanitizeDiagnostic(d)).toEqual(d);
  });
  it("aviso: desde el segundo día, se pospone 7 días y se rinde tras 2 veces", () => {
    const t0 = 1_800_000_000_000;
    const s = { startedAt: t0, journey: undefined, profile: undefined, profileNudge: undefined };
    expect(shouldNudge(s, t0 + 1000)).toBe(false);
    expect(shouldNudge(s, t0 + NUDGE_AFTER_MS)).toBe(true);
    const n1 = snoozeNudge(undefined, t0 + NUDGE_AFTER_MS);
    expect(shouldNudge({ ...s, profileNudge: n1 }, t0 + NUDGE_AFTER_MS + 1000)).toBe(false);
    expect(shouldNudge({ ...s, profileNudge: n1 }, t0 + NUDGE_AFTER_MS + NUDGE_SNOOZE_MS)).toBe(true);
    const n2 = snoozeNudge(n1, t0 + NUDGE_AFTER_MS + NUDGE_SNOOZE_MS);
    expect(shouldNudge({ ...s, profileNudge: n2 }, t0 + 100 * NUDGE_SNOOZE_MS)).toBe(false);
    expect(shouldNudge({ ...s, profile: VETERANO }, t0 + 10 * NUDGE_AFTER_MS)).toBe(false);
  });
});

describe("P-10 · contexto para la IA", () => {
  it("una línea solo con catálogo, sin datos personales", () => {
    const line = aiContext({ ...VETERANO, name: "Oziel", email: "o@x.com" } as unknown as ProfessionalProfile)!;
    expect(line).toBe("Director; experiencia en operaciones, cadena de suministro, personas y rh; más de 15 años de experiencia; industria: manufactura; objetivo: prepararme para un ascenso");
    expect(line).not.toMatch(/Oziel|@/);
    expect(aiContext(undefined)).toBeNull();
    expect(aiContext({ v: 1, skipped: [...QUESTIONS], source: "onboarding", answeredAt: 1, updatedAt: 1 })).toBeNull();
  });
  it("el mensaje a la IA incluye el contexto solo si se pasa, y pide evaluar la respuesta, no el currículum", () => {
    const item = companyById("cumbre").items.find((i) => writtenEligible(i))!;
    const base = { item, fromName: "X", fromRole: "Y", company: "Z", text: "Respuesta de prueba suficientemente larga para el caso." };
    const sin = buildMessages(base);
    expect(sin[1].content).not.toContain("Experiencia declarada");
    const con = buildMessages({ ...base, profile: aiContext(VETERANO)! });
    expect(con[1].content).toContain("Experiencia declarada del jugador: Director");
    expect(con[0].content).toContain("no por su experiencia declarada");
  });
});

describe("F1-P2 · onboarding y edición en Perfil", () => {
  const IDS = ["cumbre", "forja", "brasa"];
  it("preselecciona la empresa de la misma industria y nada si no hay", () => {
    expect(companyForIndustry("manufactura", IDS)).toBe("forja");
    expect(companyForIndustry("consumo", IDS)).toBe("cumbre");
    expect(companyForIndustry("restaurantes", IDS)).toBe("brasa");
    expect(companyForIndustry("salud", IDS)).toBeUndefined();
    expect(companyForIndustry(undefined, IDS)).toBeUndefined();
    expect(companyForIndustry("manufactura", ["cumbre"])).toBeUndefined();
  });
  it("toda empresa sugerida por industria existe en el simulador", () => {
    for (const i of INDUSTRIES) if ("company" in i) expect(companyById(i.company).id).toBe(i.company);
  });
  it("finalizeProfile recalcula lo omitido, conserva la primera fecha y queda válido", () => {
    const edited = finalizeProfile({ ...VETERANO, areas: [], goal: undefined, answeredAt: 5 }, "perfil", 99);
    expect(edited.skipped.sort()).toEqual(["areas", "goal"]);
    expect(edited.areas).toBeUndefined();
    expect(edited.answeredAt).toBe(5);
    expect(edited.updatedAt).toBe(99);
    expect(sanitizeProfile(edited)).toEqual(sanitizeProfile(JSON.parse(JSON.stringify(edited))));
    const blank = finalizeProfile({ v: 1, skipped: [], source: "onboarding", answeredAt: 0, updatedAt: 0 }, "perfil", 7);
    expect(blank.skipped).toEqual([...QUESTIONS]);
    expect(blank.answeredAt).toBe(7);
  });
  it("P-03 · lo editado sobrevive a guardar y recargar (migrate)", () => {
    const s = { ...newState(), startedAt: 1, profile: finalizeProfile({ ...EGRESADO, role: "gerente" }, "perfil", 50) };
    const back = migrate(JSON.parse(JSON.stringify(s)));
    expect(back.profile?.role).toBe("gerente");
    expect(back.profile?.updatedAt).toBe(50);
  });
  it("empezar con exigencia elegida no cuenta como Legendario; un ascenso posterior a mayor exigencia sí", () => {
    const run = (tier: number, passed = true) => ({ company: "cumbre", tier, startedAt: 0, endedAt: 1, kpis: {} as never, health: 80, answered: 100, passed, xp: 0, decisions: {} });
    const base = { ...newState(), startedAt: 1, career: [run(OFFERED_TIER)] };
    expect(careerFacts({ ...base, startTier: OFFERED_TIER }).legendary).toBe(0);
    expect(careerFacts(base).legendary).toBe(1);
    expect(careerFacts({ ...base, startTier: OFFERED_TIER, career: [run(OFFERED_TIER), run(3)] }).legendary).toBe(1);
  });
  it("migrate descarta un startTier fuera de rango", () => {
    expect(migrate({ ...newState(), startTier: 7 } as never).startTier).toBeUndefined();
    expect(migrate({ ...newState(), startTier: 1 }).startTier).toBe(1);
  });
});

describe("F1-P3 · diagnóstico y punto de partida", () => {
  const conDiag = (opt: (d: (typeof DIAGNOSTIC)[number]) => string): InitialDiagnostic => ({ v: 1, set: "d1", answers: DIAGNOSTIC.map((d) => ({ id: d.id, option: opt(d), at: 1 })), finishedAt: 1 });
  const worst = conDiag((d) => d.options.slice().sort((a, b) => a.score - b.score)[0].id);
  it("un área declarada que el diagnóstico marca «por reforzar» no se ofrece como repaso opcional", () => {
    const m = emptyMastery();
    const rec = recommendOrder(VETERANO, m, worst);
    const ej = rec.find((r) => r.competency === "ejecucion")!;
    expect(initialReading(worst, m).ejecucion.signal).toBe("reforzar");
    expect(ej.review).toBe(false);
    expect(rec.find((r) => r.competency === "personas")!.review).toBe(false);
    const sinDiag = recommendOrder(VETERANO, m);
    expect(sinDiag.find((r) => r.competency === "ejecucion")!.review).toBe(true);
  });
  it("diagnóstico omitido: se guarda, no vuelve a ofrecerse como pendiente de lectura y no da señales", () => {
    const skipped = sanitizeDiagnostic({ v: 1, set: "d1", answers: [], skippedAt: 9 })!;
    expect(skipped.skippedAt).toBe(9);
    expect(Object.values(initialReading(skipped, emptyMastery())).every((r) => r.signal === "sin")).toBe(true);
  });
  it("diagnóstico terminado ya no se ofrece; con 10 decisiones o más tampoco", () => {
    expect(diagnosticOffered(0, worst)).toBe(false);
    expect(diagnosticOffered(9)).toBe(true);
    expect(diagnosticOffered(10)).toBe(false);
  });
  it("la exigencia solo se ofrece a 11+ años o cargo de dirección y nunca pasa de OFFERED_TIER", () => {
    for (let i = 0; i < 200; i++) {
      const p = randomProfile("t" + i);
      const t = suggestTier(p);
      expect([0, OFFERED_TIER]).toContain(t);
      const senior = p.years === "11-15" || p.years === "15+" || p.role === "director" || p.role === "direccion";
      expect(t > 0).toBe(senior);
    }
  });
});

describe("F1-P4 · Academy, ayuda, aviso y eventos", () => {
  const IDS = TRACKS.map((t) => t.id);
  it("trackHints nunca quita ni duplica rutas", () => {
    for (let i = 0; i < 60; i++) {
      const h = trackHints(randomProfile("h" + i), emptyMastery(), i % 2 ? randomDiagnostic("h" + i) : undefined, TRACK_TO, IDS);
      expect(h.map((x) => x.track).sort()).toEqual([...IDS].sort());
    }
  });
  it("en las 3 primeras rutas recomendadas hay al menos una fuera de lo declarado", () => {
    for (let i = 0; i < 100; i++) {
      const p = randomProfile("x" + i);
      if (!p.areas?.length) continue;
      const declared = declaredCompetencies(p);
      if (COMPETENCY_IDS.every((c) => declared.has(c))) continue;
      const top = trackHints(p, emptyMastery(), undefined, TRACK_TO, IDS).slice(0, 3);
      expect(top.some((h) => h.outside)).toBe(true);
    }
  });
  it("el veterano en operaciones ve Crisis (ejecución) como repaso opcional; el egresado no", () => {
    const vet = trackHints(VETERANO, emptyMastery(), undefined, TRACK_TO, IDS);
    expect(vet.find((h) => h.track === "crisis")!.review).toBe(false); // crisis también entrena comunicación (no declarada)
    expect(vet.find((h) => h.track === "personas")!.review).toBe(true);
    const egr = trackHints(EGRESADO, emptyMastery(), undefined, TRACK_TO, IDS);
    expect(egr.find((h) => h.track === "personas")!.review).toBe(false);
  });
  it("sin perfil ni diagnóstico no hay personalización visible", () => {
    expect(personalized(newState())).toBe(false);
    expect(personalized({ profile: VETERANO })).toBe(true);
    expect(personalized({ diagnostic: { v: 1, set: "d1", answers: [], skippedAt: 1 } })).toBe(false);
  });
  it("el aviso no compite con un asunto por vencer", () => {
    const now = 1_000_000_000;
    expect(nudgeQuiet([], now)).toBe(false);
    expect(nudgeQuiet([{ deadline: now + NUDGE_QUIET_MS + 1 }], now)).toBe(false);
    expect(nudgeQuiet([{ deadline: now + 60_000 }], now)).toBe(true);
  });
  it("eventos: solo nombres y propiedades de la lista; sin texto libre ni datos personales", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    expect(sanitizeEvent({ event_id: id, name: "hackeo" })).toBeNull();
    expect(sanitizeEvent({ event_id: "x", name: "perfil_respondido" })).toBeNull();
    const ev = sanitizeEvent({ event_id: id, name: "perfil_respondido", props: { secs: 41.4, omitidas: 1, fuente: "onboarding", email: "a@b.com", nombre: "Oziel", fuente2: "x" }, client_at: "2026-01-01T00:00:00Z" })!;
    expect(ev.props).toEqual({ secs: 41, omitidas: 1, fuente: "onboarding" });
    expect(sanitizeEvent({ event_id: id, name: "perfil_editado", props: { fuente: "Hola Mundo con espacios" } })!.props).toEqual({});
    expect(EVENT_NAMES.length).toBe(new Set(EVENT_NAMES).size);
  });
});
