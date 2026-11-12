/**
 * MÊTIS 2.0 · entrega 1.4 · cálculo de dominio.
 *
 * Lo que estas pruebas aseguran:
 *  - una habilidad solo se demuestra con evidencia suficiente; nunca por leer teoría, por puntos o por completar actividades;
 *  - repetir, responder sin leer o responder con ayuda no cuenta;
 *  - pesan la calidad del razonamiento, la dificultad, la transferencia, la consistencia y las respuestas sin ayuda;
 *  - un tropiezo no borra lo demostrado y una pausa no envejece nada;
 *  - la barra general no es un promedio: exige cobertura en las seis academias, evidencia suficiente y reto integrador;
 *  - el nivel sube de uno en uno, nunca baja y no tiene etapa final;
 *  - lo declarado nunca sube el dominio.
 *
 * Para regenerar el documento de reglas:
 *   DOMINIO_DOC=1 npx vitest run src/lib/ceo/metis2/dominio.test.ts
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ACADEMY_IDS, SKILLS, skillById, type Demand, type FormatId } from "./academias";
import { annulEvidence, appendEvidence, emptyLog, newEvidence, readLog, type Evidence, type EvidenceLog } from "./evidencias";
import {
  ACADEMY_LABEL_TEXT, MASTERY_RULES_VERSION, RULES, SKILL_STATUS_TEXT, activeDays, allStandings, confidenceLabel, estimateSkill, integratorFor, isPass,
  levelProgress, nextLevelState, screen, skillStanding, type LevelState,
} from "./dominio";
import { masteryMarkdown } from "./dominio-doc";

const DOC = join(__dirname, "../../../../../docs/metis2/04-dominio.md");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2026, 0, 5, 15);

interface Opt {
  skills: string[]; id?: string; at?: number; level?: Demand; format?: FormatId; group?: string; context?: string;
  result?: number; reasoning?: number | null; aided?: boolean; transfer?: boolean; seconds?: number | null; confidence?: number;
}
let seq = 0;
/** Una evidencia de prueba. Por omisión: acierto sin ayuda, nivel 1, situación propia, tiempo de lectura suficiente. */
function ev(o: Opt): Evidence {
  seq++;
  return newEvidence({
    id: o.id ?? `e${String(seq).padStart(5, "0")}`,
    at: o.at ?? T0,
    source: "practica",
    activity: { id: `a${seq}`, version: "1", format: o.format ?? "aplicado", ...(o.group ? { group: o.group } : {}) },
    skills: o.skills,
    level: o.level ?? 1,
    context: o.context ?? "restaurante",
    observable: "Respuesta de prueba.",
    ...(o.seconds === null ? {} : { seconds: o.seconds ?? 120 }),
    result: o.result ?? 1,
    reasoning: o.reasoning === undefined ? null : o.reasoning,
    aided: o.aided ?? false,
    transfer: o.transfer ?? false,
    feedback: { ref: "f", version: "1" },
    rubric: "r1",
    confidence: o.confidence ?? 1,
  });
}
const logOf = (list: Evidence[], from: EvidenceLog = emptyLog()) => list.reduce((log, e) => appendEvidence(log, e), from);
const fail = (o: Opt) => ev({ ...o, result: 0.2 });

/** Tres aciertos sin ayuda, en tres situaciones, con la habilidad como principal: lo mínimo para «Demostrado». */
const demonstrate = (skill: string, level: Demand = 1, at = T0, extra: Partial<Opt> = {}) =>
  [0, 1, 2].map((i) => ev({ skills: [skill], level, at: at + i * HOUR, reasoning: level >= 3 ? 0.8 : null, ...extra }));
const levelSkills = (level: Demand) => SKILLS.filter((s) => s.from <= level).map((s) => s.id);
const demonstrateAll = (level: Demand, at = T0, skip: string[] = []) => levelSkills(level).filter((s) => !skip.includes(s)).flatMap((s) => demonstrate(s, level, at));
const integrator = (level: Demand, at = T0 + DAY, extra: Partial<Opt> = {}) => ev({ skills: ["est.priorizacion", "lid.delegacion"], format: "integrador", level, at, seconds: 400, reasoning: 0.8, ...extra });

const est = (list: Evidence[], skill: string, level: Demand = 1, now = T0 + 2 * DAY) => estimateSkill(screen(logOf(list)).counted, skill, level, { now });
const L1: LevelState = { level: 1, since: T0 };
const NOW = T0 + 3 * DAY;

describe("reglas", () => {
  it("tienen versión y no se pueden cambiar en marcha", () => {
    expect(MASTERY_RULES_VERSION).toBe(1);
    expect(Object.isFrozen(RULES)).toBe(true);
    expect(Object.isFrozen(RULES.level)).toBe(true);
    expect(() => { (RULES as { pass: number }).pass = 0; }).toThrow(TypeError);
    expect(() => { (RULES.demonstrated as { passes: number }).passes = 1; }).toThrow(TypeError);
  });

  it("los pesos de la barra general suman 1 y los plazos de repaso crecen con el grado", () => {
    const w = RULES.level.weights;
    expect(w.cobertura + w.evidencia + w.integrador).toBeCloseTo(1, 10);
    for (let i = 1; i < RULES.reviewDays.length; i++) expect(RULES.reviewDays[i]).toBeGreaterThanOrEqual(RULES.reviewDays[i - 1]);
  });

  it("un acierto pide resultado suficiente y, si se evaluó, razonamiento suficiente", () => {
    expect(isPass({ result: 0.7, reasoning: null })).toBe(true);
    expect(isPass({ result: 0.69, reasoning: null })).toBe(false);
    expect(isPass({ result: 1, reasoning: 0.5 })).toBe(true);
    expect(isPass({ result: 1, reasoning: 0.49 })).toBe(false);
    expect(isPass({ result: 0.4, reasoning: 1 })).toBe(false);
  });
});

describe("lo que no demuestra nada", () => {
  it("leer teoría no deja evidencia y, sin evidencia, no hay dominio ni avance", () => {
    expect(() => ev({ skills: ["fin.flujo"], format: "leccion" })).toThrow(/teoría/);
    const p = levelProgress(emptyLog(), L1, { now: NOW });
    expect(p.skills.every((s) => s.stage === 0 && s.confidence === 0 && s.freshness === "sin_evidencia")).toBe(true);
    expect(p.academies.every((a) => a.bar === 0 && a.label === "sin_evidencia")).toBe(true);
    expect(p.bar).toBe(0);
    expect(p.ready).toBe(false);
    expect(p.criteria.map((c) => c.met)).toEqual([false, false, false]);
    expect(p.criteria.every((c) => c.missing.length > 0)).toBe(true);
  });

  it("puntos, racha y actividades completadas no son entradas del cálculo", () => {
    const log = logOf(demonstrate("fin.flujo"));
    const plain = levelProgress(log, L1, { now: NOW });
    const inflated = levelProgress(log, { ...L1, xp: 999_999, streak: 400, completed: 5_000, minutes: 90_000 } as LevelState, { now: NOW, xp: 999_999, streak: 400 } as { now: number });
    expect(inflated).toEqual(plain);
  });

  it("completar muchas actividades sin acertar no mueve ninguna barra", () => {
    const many = levelSkills(1).flatMap((s) => Array.from({ length: 10 }, (_, i) => fail({ skills: [s], at: T0 + i * HOUR })));
    expect(many.length).toBe(240);
    const p = levelProgress(logOf(many), L1, { now: NOW });
    expect(p.skills.every((s) => s.stage === 1)).toBe(true);
    expect(p.academies.every((a) => a.bar === 0 && a.demonstrated === 0)).toBe(true);
    expect(p.bar).toBe(0);
    expect(nextLevelState(logOf(many), L1, { now: NOW })).toBe(L1);
  });

  it("responder con ayuda queda registrado pero no cuenta como acierto", () => {
    const aided = Array.from({ length: 8 }, (_, i) => ev({ skills: ["fin.flujo"], aided: true, at: T0 + i * HOUR }));
    const e = est(aided, "fin.flujo");
    expect(e.coverage.any).toBe(8);
    expect(e.coverage.passes).toBe(0);
    expect(e.stage).toBe(1);
    expect(e.missing).toEqual(["Falta un primer acierto sin ayuda en la exigencia de este nivel."]);
  });

  it("acertar la opción con un razonamiento pobre no es un acierto", () => {
    const poor = [0, 1, 2].map((i) => ev({ skills: ["fin.flujo"], reasoning: 0.3, at: T0 + i * HOUR }));
    expect(est(poor, "fin.flujo").stage).toBe(1);
  });
});

describe("protección contra repeticiones y atajos", () => {
  it("repetir la misma situación antes de siete días no cuenta", () => {
    const a = ev({ skills: ["fin.flujo"], group: "caja-1", at: T0 });
    const b = ev({ skills: ["fin.flujo"], group: "caja-1", at: T0 + HOUR });
    const c = ev({ skills: ["fin.flujo"], group: "caja-1", at: T0 + 2 * DAY });
    const s = screen(logOf([a, b, c]));
    expect(s.counted.map((e) => e.id)).toEqual([a.id]);
    expect(s.ignored).toEqual([{ id: b.id, why: "repetida" }, { id: c.id, why: "repetida" }]);
    expect(est([a, b, c], "fin.flujo").coverage.passes).toBe(1);
  });

  it("dos redacciones de la misma situación son la misma situación", () => {
    const v1 = ev({ skills: ["lid.feedback"], group: "feedback-dificil", at: T0 });
    const v2 = ev({ skills: ["lid.feedback"], group: "feedback-dificil", at: T0 + DAY });
    expect(v1.activity.id).not.toBe(v2.activity.id);
    expect(screen(logOf([v1, v2])).ignored).toEqual([{ id: v2.id, why: "repetida" }]);
  });

  it("pasados siete días sin verla, vuelve a contar; verla de nuevo reinicia la espera", () => {
    const a = ev({ skills: ["fin.flujo"], group: "caja-1", at: T0 });
    const b = ev({ skills: ["fin.flujo"], group: "caja-1", at: T0 + 5 * DAY });
    const c = ev({ skills: ["fin.flujo"], group: "caja-1", at: T0 + 9 * DAY });
    const d = ev({ skills: ["fin.flujo"], group: "caja-1", at: T0 + 16 * DAY });
    const s = screen(logOf([a, b, c, d]));
    expect(s.counted.map((e) => e.id)).toEqual([a.id, d.id]);
    expect(s.ignored.map((x) => x.why)).toEqual(["repetida", "repetida"]);
  });

  it("repetir una misma situación, aun espaciada, no basta para demostrar: hacen falta situaciones distintas", () => {
    const same = [0, 8, 16, 24].map((d) => ev({ skills: ["fin.flujo"], group: "caja-1", at: T0 + d * DAY }));
    const e = est(same, "fin.flujo", 1, T0 + 25 * DAY);
    expect(e.coverage.passes).toBe(4);
    expect(e.coverage.situations).toBe(1);
    expect(e.stage).toBe(2);
    expect(e.missing).toEqual(["Faltan 2 situaciones distintas."]);
  });

  it("una respuesta más rápida que la lectura mínima no cuenta; si no se midió el tiempo, sí", () => {
    const fast = ev({ skills: ["fin.flujo"], format: "aplicado", seconds: RULES.minSeconds.aplicado - 1 });
    const edge = ev({ skills: ["fin.flujo"], format: "aplicado", seconds: RULES.minSeconds.aplicado });
    const unmeasured = ev({ skills: ["fin.flujo"], seconds: null });
    const s = screen(logOf([fast, edge, unmeasured]));
    expect(s.ignored).toEqual([{ id: fast.id, why: "sin_lectura" }]);
    expect(s.counted).toHaveLength(2);
  });

  it("responder al vuelo y luego repetir con calma tampoco cuenta", () => {
    const fast = ev({ skills: ["fin.flujo"], group: "caja-1", seconds: 1, at: T0 });
    const again = ev({ skills: ["fin.flujo"], group: "caja-1", seconds: 90, at: T0 + HOUR });
    expect(screen(logOf([fast, again])).ignored.map((x) => x.why)).toEqual(["sin_lectura", "repetida"]);
  });

  it("una calificación poco confiable no cuenta ni a favor ni en contra", () => {
    const good = demonstrate("fin.flujo");
    const shakyPass = ev({ skills: ["fin.flujo"], confidence: 0.3, at: T0 + 5 * HOUR });
    const shakyFails = [6, 7, 8].map((h) => fail({ skills: ["fin.flujo"], confidence: 0.3, at: T0 + h * HOUR }));
    const s = screen(logOf([...good, shakyPass, ...shakyFails]));
    expect(s.ignored.map((x) => x.why)).toEqual(["calificacion_dudosa", "calificacion_dudosa", "calificacion_dudosa", "calificacion_dudosa"]);
    expect(est([...good, shakyPass, ...shakyFails], "fin.flujo").stage).toBe(3);
    expect(est([good[0], good[1], shakyPass], "fin.flujo").stage).toBe(2);
  });

  it("lo que no contó queda visible con su razón en el progreso", () => {
    const a = ev({ skills: ["fin.flujo"], group: "g", at: T0 });
    const b = ev({ skills: ["fin.flujo"], group: "g", at: T0 + HOUR });
    expect(levelProgress(logOf([a, b]), L1, { now: NOW }).ignored).toEqual([{ id: b.id, why: "repetida" }]);
  });
});

describe("grados de dominio de una habilidad", () => {
  it("0 sin respuestas, 1 sin aciertos, 2 con el primer acierto", () => {
    expect(est([], "fin.flujo").stage).toBe(0);
    expect(est([fail({ skills: ["fin.flujo"] })], "fin.flujo").stage).toBe(1);
    const two = est([ev({ skills: ["fin.flujo"] })], "fin.flujo");
    expect(two.stage).toBe(2);
    expect(two.missing).toEqual(["Faltan 2 aciertos sin ayuda en la exigencia de este nivel.", "Faltan 2 situaciones distintas.", "Falta 1 acierto en actividades donde esta sea la habilidad principal."]);
  });

  it("3 · Demostrado: tres aciertos sin ayuda en tres situaciones, dos como habilidad principal", () => {
    const two = demonstrate("fin.flujo").slice(0, 2);
    expect(est(two, "fin.flujo").stage).toBe(2);
    const e = est(demonstrate("fin.flujo"), "fin.flujo");
    expect(e.stage).toBe(3);
    expect(e.coverage).toMatchObject({ passes: 3, situations: 3, mainPasses: 3, contexts: 1, recentRate: 1 });
  });

  it("no se demuestra una habilidad que solo aparece como secundaria", () => {
    const secondary = [0, 1, 2, 3].map((i) => ev({ skills: ["lid.feedback", "fin.flujo"], at: T0 + i * HOUR }));
    const e = est(secondary, "fin.flujo");
    expect(e.coverage.passes).toBe(4);
    expect(e.coverage.mainPasses).toBe(0);
    expect(e.stage).toBe(2);
    expect(est(secondary, "lid.feedback").stage).toBe(3);
  });

  it("la dificultad cuenta: lo fácil no demuestra el nivel siguiente; lo difícil sí demuestra los anteriores", () => {
    const easy = demonstrate("fin.flujo", 1);
    expect(est(easy, "fin.flujo", 1).stage).toBe(3);
    const harder = est(easy, "fin.flujo", 2);
    expect(harder.stage).toBe(1);
    expect(harder.coverage).toMatchObject({ any: 3, atLevel: 0, passes: 0 });
    const hard = demonstrate("fin.flujo", 3);
    expect(est(hard, "fin.flujo", 2).stage).toBe(3);
    expect(est(hard, "fin.flujo", 1).stage).toBe(3);
  });

  it("desde el nivel 3 hace falta que se haya evaluado el razonamiento", () => {
    const noReasoning = [0, 1, 2].map((i) => ev({ skills: ["fin.flujo"], level: 3, reasoning: null, at: T0 + i * HOUR }));
    const e = est(noReasoning, "fin.flujo", 3);
    expect(e.stage).toBe(2);
    expect(e.missing).toEqual(["Falta al menos un acierto en el que se haya evaluado el razonamiento."]);
    const justEnough = [0, 1, 2].map((i) => ev({ skills: ["fin.flujo"], level: 3, reasoning: 0.55, at: T0 + i * HOUR }));
    expect(est(justEnough, "fin.flujo", 3).stage).toBe(2);
    const reasoned = [...noReasoning.slice(0, 2), ev({ skills: ["fin.flujo"], level: 3, reasoning: 0.6, at: T0 + 2 * HOUR })];
    expect(est(reasoned, "fin.flujo", 3).stage).toBe(3);
    // En los niveles 1 y 2 no se exige.
    expect(est(demonstrate("fin.flujo", 2), "fin.flujo", 2).stage).toBe(3);
  });

  it("4 · Consistente: se sostiene al menos siete días y en dos contextos", () => {
    const sameWeek = [ev({ skills: ["fin.flujo"], at: T0 }), ev({ skills: ["fin.flujo"], at: T0 + DAY }), ev({ skills: ["fin.flujo"], at: T0 + 2 * DAY, context: "software" })];
    const a = est(sameWeek, "fin.flujo", 1, T0 + 3 * DAY);
    expect(a.stage).toBe(3);
    expect(a.missing).toEqual(["Falta sostenerlo en el tiempo: aciertos separados por al menos 7 días."]);

    const oneContext = [ev({ skills: ["fin.flujo"], at: T0 }), ev({ skills: ["fin.flujo"], at: T0 + DAY }), ev({ skills: ["fin.flujo"], at: T0 + 8 * DAY })];
    const b = est(oneContext, "fin.flujo", 1, T0 + 9 * DAY);
    expect(b.stage).toBe(3);
    expect(b.missing).toEqual(["Falta un acierto en otro contexto o industria."]);

    const both = [ev({ skills: ["fin.flujo"], at: T0 }), ev({ skills: ["fin.flujo"], at: T0 + DAY }), ev({ skills: ["fin.flujo"], at: T0 + 8 * DAY, context: "software" })];
    const c = est(both, "fin.flujo", 1, T0 + 9 * DAY);
    expect(c.stage).toBe(4);
    expect(c.missing).toHaveLength(3);
  });

  it("5 · Transferible: tres contextos, una prueba de transferencia y una actividad que cruce academias", () => {
    const base = [ev({ skills: ["fin.flujo"], at: T0 }), ev({ skills: ["fin.flujo"], at: T0 + DAY }), ev({ skills: ["fin.flujo"], at: T0 + 8 * DAY, context: "software" })];
    const third = ev({ skills: ["fin.flujo"], at: T0 + 9 * DAY, context: "clinica" });
    expect(est([...base, third], "fin.flujo", 1, T0 + 12 * DAY).missing).toEqual(["Falta un acierto en una prueba de transferencia.", "Falta un acierto dentro de una actividad que cruce academias."]);
    const transfer = ev({ skills: ["fin.flujo"], at: T0 + 10 * DAY, context: "logistica", transfer: true });
    const four = est([...base, third, transfer], "fin.flujo", 1, T0 + 12 * DAY);
    expect(four.stage).toBe(4);
    expect(four.missing).toEqual(["Falta un acierto dentro de una actividad que cruce academias."]);
    const cross = ev({ skills: ["fin.flujo", "ope.capacidad"], at: T0 + 11 * DAY, context: "logistica" });
    const five = est([...base, third, transfer, cross], "fin.flujo", 1, T0 + 12 * DAY);
    expect(five.stage).toBe(5);
    expect(five.missing).toEqual([]);
    expect(five.coverage).toMatchObject({ contexts: 4, transfer: 1 });
  });

  it("la confianza crece con la evidencia; lo secundario y lo ayudado pesan la mitad", () => {
    const one = est([ev({ skills: ["fin.flujo"] })], "fin.flujo");
    const three = est(demonstrate("fin.flujo"), "fin.flujo");
    const six = est([...demonstrate("fin.flujo"), ...demonstrate("fin.flujo", 1, T0 + 5 * HOUR)], "fin.flujo");
    expect(one.confidence).toBeCloseTo(0.17, 2);
    expect(three.confidence).toBe(0.5);
    expect(six.confidence).toBe(1);
    expect([one.confidenceLabel, three.confidenceLabel, six.confidenceLabel]).toEqual(["baja", "media", "alta"]);
    expect(est([ev({ skills: ["lid.feedback", "fin.flujo"] })], "fin.flujo").confidence).toBeCloseTo(0.08, 2);
    expect(est([ev({ skills: ["fin.flujo"], aided: true })], "fin.flujo").confidence).toBeCloseTo(0.08, 2);
    expect([confidenceLabel(0), confidenceLabel(0.34), confidenceLabel(0.67)]).toEqual(["baja", "media", "alta"]);
  });
});

describe("un tropiezo no borra lo demostrado", () => {
  const later = (n: number) => Array.from({ length: n }, (_, i) => fail({ skills: ["fin.flujo"], at: T0 + DAY + i * HOUR }));

  it("una o dos respuestas fallidas no bajan una habilidad demostrada; un patrón de fallos sí", () => {
    const base = demonstrate("fin.flujo");
    expect(est([...base, ...later(1)], "fin.flujo").stage).toBe(3);
    expect(est([...base, ...later(2)], "fin.flujo").stage).toBe(3);
    const dropped = est([...base, ...later(3)], "fin.flujo");
    expect(dropped.stage).toBe(2);
    expect(dropped.missing).toEqual(["Las respuestas recientes todavía no son consistentes."]);
  });

  it("se recupera con aciertos nuevos: tras tres fallos seguidos hacen falta tres aciertos", () => {
    const recovery = (n: number) => Array.from({ length: n }, (_, i) => ev({ skills: ["fin.flujo"], at: T0 + 3 * DAY + i * HOUR }));
    const after = (n: number) => est([...demonstrate("fin.flujo"), ...later(3), ...recovery(n)], "fin.flujo", 1, T0 + 4 * DAY).stage;
    expect([after(1), after(2), after(3)]).toEqual([2, 2, 3]);
  });

  it("«Consistente» tolera un fallo reciente, no dos", () => {
    const base = [ev({ skills: ["fin.flujo"], at: T0 }), ev({ skills: ["fin.flujo"], at: T0 + DAY }), ev({ skills: ["fin.flujo"], at: T0 + 8 * DAY, context: "software" })];
    const f = (n: number) => Array.from({ length: n }, (_, i) => fail({ skills: ["fin.flujo"], at: T0 + 9 * DAY + i * HOUR }));
    expect(est([...base, ...f(1)], "fin.flujo", 1, T0 + 10 * DAY).stage).toBe(4);
    expect(est([...base, ...f(2)], "fin.flujo", 1, T0 + 10 * DAY).stage).toBe(3);
  });

  it("fallar un reto más difícil que el nivel no cuenta en contra de lo demostrado en el nivel", () => {
    const hardFails = Array.from({ length: 4 }, (_, i) => fail({ skills: ["fin.flujo"], level: 3, at: T0 + DAY + i * HOUR }));
    const e = est([...demonstrate("fin.flujo", 1), ...hardFails], "fin.flujo", 1);
    expect(e.stage).toBe(3);
    expect(est([...demonstrate("fin.flujo", 1), ...hardFails], "fin.flujo", 3).stage).toBe(1);
  });

  it("un fallo no baja el nivel ni borra la cobertura de la academia", () => {
    const log = logOf(demonstrateAll(1));
    const before = levelProgress(log, L1, { now: NOW });
    const after = levelProgress(logOf(levelSkills(1).map((s) => fail({ skills: [s], at: T0 + DAY })), log), L1, { now: NOW });
    expect(after.academies.map((a) => a.demonstrated)).toEqual(before.academies.map((a) => a.demonstrated));
    expect(after.bar).toBe(before.bar);
  });
});

describe("tiempo, repaso y pausas", () => {
  it("cuenta los días sin los periodos de pausa", () => {
    expect(activeDays(T0, T0 + 10 * DAY)).toBe(10);
    expect(activeDays(T0, T0 + 10 * DAY, [{ from: T0 + 2 * DAY, to: T0 + 6 * DAY }])).toBe(6);
    expect(activeDays(T0, T0 + 10 * DAY, [{ from: T0 - 5 * DAY, to: T0 + 3 * DAY }, { from: T0 + 8 * DAY, to: T0 + 50 * DAY }])).toBe(5);
    expect(activeDays(T0, T0 + 10 * DAY, [{ from: T0 + 20 * DAY, to: T0 + 30 * DAY }])).toBe(10);
    expect(activeDays(T0 + DAY, T0)).toBe(0);
  });

  it("el paso del tiempo sugiere repaso y luego revalidar, pero no baja el grado", () => {
    const counted = screen(logOf(demonstrate("fin.flujo"))).counted;
    const at = (days: number) => estimateSkill(counted, "fin.flujo", 1, { now: T0 + days * DAY });
    expect(at(10)).toMatchObject({ stage: 3, freshness: "vigente", confidence: 0.5 });
    expect(at(45)).toMatchObject({ stage: 3, freshness: "repaso" });
    expect(at(100)).toMatchObject({ stage: 3, freshness: "revalidar", confidence: 0.3 });
    expect(at(45).confidence).toBeLessThan(at(10).confidence);
  });

  it("una pausa no envejece nada", () => {
    const counted = screen(logOf(demonstrate("fin.flujo"))).counted;
    const now = T0 + 100 * DAY;
    const paused = estimateSkill(counted, "fin.flujo", 1, { now, pauses: [{ from: T0 + 5 * DAY, to: T0 + 95 * DAY }] });
    expect(paused).toMatchObject({ stage: 3, freshness: "vigente", confidence: 0.5 });
    expect(paused.days).toBeCloseTo(10, 0);
  });

  it("la ausencia, con o sin pausa, no cambia las barras ni quita el nivel", () => {
    const log = logOf([...demonstrateAll(1), integrator(1)]);
    const soon = levelProgress(log, L1, { now: NOW });
    const late = levelProgress(log, L1, { now: NOW + 400 * DAY });
    expect(late.bar).toBe(soon.bar);
    expect(late.academies.map((a) => a.bar)).toEqual(soon.academies.map((a) => a.bar));
    expect(late.skills.map((s) => s.stage)).toEqual(soon.skills.map((s) => s.stage));
    expect(late.academies.every((a) => a.review)).toBe(true);
    expect(soon.academies.some((a) => a.review)).toBe(false);
    const state: LevelState = { level: 4, since: T0 };
    expect(nextLevelState(emptyLog(), state, { now: NOW + 900 * DAY })).toBe(state);
  });
});

describe("barras de academia y barra general", () => {
  it("cada academia muestra cuánto falta y su etiqueta", () => {
    const log = logOf([...demonstrate("fin.flujo"), ...demonstrate("fin.balance"), ev({ skills: ["fin.resultados"] }), fail({ skills: ["fin.lenguaje"] })]);
    const p = levelProgress(log, L1, { now: NOW });
    const fin = p.academies.find((a) => a.academy === "finanzas")!;
    expect(fin).toMatchObject({ skills: 5, demonstrated: 2, developing: 1, pending: 2, needed: 3, covered: false, label: "parcial", bar: 0.5 });
    expect(ACADEMY_LABEL_TEXT[fin.label]).toBe("Evidencia parcial");
    expect(p.academies.filter((a) => a.academy !== "finanzas").every((a) => a.label === "sin_evidencia")).toBe(true);
    expect(ACADEMY_LABEL_TEXT.sin_evidencia).toBe("Sin evidencia suficiente");
  });

  it("no es un promedio: una academia al máximo no compensa a las demás", () => {
    const finance = levelSkills(1).filter((s) => skillById(s)!.academy === "finanzas").flatMap((s) => demonstrate(s));
    const p = levelProgress(logOf(finance), L1, { now: NOW });
    expect(p.academies.find((a) => a.academy === "finanzas")).toMatchObject({ bar: 1, covered: true, label: "suficiente" });
    expect(p.ready).toBe(false);
    expect(p.bar).toBeLessThan(0.2);
    const cobertura = p.criteria.find((c) => c.id === "cobertura")!;
    expect(cobertura.met).toBe(false);
    for (const name of ["Estrategia", "Liderazgo", "Operaciones", "Crecimiento", "Riesgo y gobierno"]) expect(cobertura.missing).toContain(name);
    expect(cobertura.missing).not.toContain("Finanzas");
  });

  it("cinco academias completas y una vacía no alcanzan, aunque el promedio sea alto", () => {
    const five = levelSkills(1).filter((s) => skillById(s)!.academy !== "riesgo").flatMap((s) => demonstrate(s));
    const log = logOf([...five, integrator(1)]);
    const p = levelProgress(log, L1, { now: NOW });
    const average = p.academies.reduce((n, a) => n + a.bar, 0) / p.academies.length;
    expect(average).toBeGreaterThan(0.8);
    expect(p.ready).toBe(false);
    expect(p.bar).toBeLessThan(1);
    expect(p.criteria.find((c) => c.id === "cobertura")!.missing).toBe("Falta cobertura en Riesgo y gobierno (0 de 2).");
    expect(nextLevelState(log, L1, { now: NOW })).toBe(L1);
  });

  it("con cobertura en una academia por debajo del mínimo no se pasa de nivel", () => {
    const rest = demonstrateAll(1, T0, ["rie.etica", "rie.cumplimiento"]);
    const log = logOf([...rest, ev({ skills: ["rie.etica"] }), ev({ skills: ["rie.cumplimiento"] }), integrator(1)]);
    const p = levelProgress(log, L1, { now: NOW });
    expect(p.criteria.map((c) => [c.id, c.met])).toEqual([["cobertura", false], ["evidencia", true], ["integrador", true]]);
    expect(p.ready).toBe(false);
    expect(p.bar).toBeLessThan(1);
  });

  it("sin reto integrador la barra no se llena, aunque todo lo demás esté demostrado", () => {
    const log = logOf(demonstrateAll(1));
    const p = levelProgress(log, L1, { now: NOW });
    expect(p.criteria.map((c) => [c.id, c.met])).toEqual([["cobertura", true], ["evidencia", true], ["integrador", false]]);
    expect(p.bar).toBe(0.8);
    expect(p.ready).toBe(false);
    expect(p.criteria[2].missing).toBe("Falta resolver sin ayuda un reto integrador de este nivel.");
    expect(nextLevelState(log, L1, { now: NOW })).toBe(L1);
  });

  it("si queda una habilidad sin un solo acierto, falta evidencia", () => {
    const log = logOf([...demonstrateAll(1, T0, ["fin.balance"]), fail({ skills: ["fin.balance"] }), integrator(1)]);
    const p = levelProgress(log, L1, { now: NOW });
    expect(p.criteria.map((c) => [c.id, c.met])).toEqual([["cobertura", true], ["evidencia", false], ["integrador", true]]);
    expect(p.criteria[1].missing).toBe("1 habilidad todavía no tiene un acierto sin ayuda en este nivel.");
    expect(p.bar).toBe(0.99);
    expect(p.ready).toBe(false);
  });

  it("el reto integrador debe ser del nivel, cruzar academias, resolverse sin ayuda y acertarse", () => {
    const counted = (e: Evidence) => screen(logOf([e])).counted;
    expect(integratorFor(counted(integrator(2)), 2)).toBeDefined();
    expect(integratorFor(counted(integrator(3)), 2)).toBeDefined();
    expect(integratorFor(counted(integrator(1)), 2)).toBeUndefined();
    expect(integratorFor(counted(integrator(2, T0, { aided: true })), 2)).toBeUndefined();
    expect(integratorFor(counted(integrator(2, T0, { result: 0.5 })), 2)).toBeUndefined();
    expect(integratorFor(counted(integrator(2, T0, { skills: ["est.priorizacion", "est.ventaja"] })), 2)).toBeUndefined();
    expect(integratorFor(counted(integrator(2, T0, { format: "encadenado" })), 2)).toBeUndefined();
    expect(integratorFor(counted(integrator(2, T0)), 2, T0 + DAY)).toBeUndefined();
  });

  it("con los tres criterios cumplidos la barra se llena y se pasa al nivel siguiente", () => {
    const log = logOf([...demonstrateAll(1), integrator(1)]);
    const p = levelProgress(log, L1, { now: NOW });
    expect(p.criteria.every((c) => c.met && c.missing === "" && c.progress === 1)).toBe(true);
    expect(p).toMatchObject({ level: 1, demand: 1, bar: 1, ready: true, rules: MASTERY_RULES_VERSION });
    expect(p.academies.map((a) => a.academy)).toEqual(ACADEMY_IDS);
    expect(nextLevelState(log, L1, { now: NOW })).toEqual({ level: 2, since: NOW });
  });

  it("al llegar a un nivel nuevo las barras se miden contra la exigencia de ese nivel", () => {
    const log = logOf([...demonstrateAll(1), integrator(1)]);
    const p = levelProgress(log, { level: 2, since: NOW }, { now: NOW });
    expect(p.demand).toBe(2);
    expect(p.skills).toHaveLength(levelSkills(2).length);
    expect(p.skills.every((s) => s.stage <= 1)).toBe(true);
    expect(p.bar).toBe(0);
    expect(p.academies.every((a) => a.label === "sin_evidencia")).toBe(true);
  });

  it("los criterios se muestran con el mismo texto para todas las personas", () => {
    const a = levelProgress(emptyLog(), L1, { now: NOW }).criteria.map((c) => c.text);
    const b = levelProgress(logOf([...demonstrateAll(1), integrator(1)]), L1, { now: NOW }).criteria.map((c) => c.text);
    expect(a).toEqual(b);
    expect(a[0]).toContain("60 %");
  });
});

describe("nivel general: continuo, de uno en uno y sin retroceso", () => {
  const full6 = () => logOf([...demonstrateAll(6), integrator(6)]);

  it("sube un nivel a la vez aunque la evidencia alcance para más", () => {
    const log = full6();
    let state: LevelState = { level: 1, since: T0 };
    const seen: number[] = [];
    for (let i = 0; i < 9; i++) {
      const next = nextLevelState(log, state, { now: NOW + i * DAY });
      expect(next.level - state.level).toBeLessThanOrEqual(1);
      state = next;
      seen.push(state.level);
    }
    expect(seen).toEqual([2, 3, 4, 5, 6, 7, 7, 7, 7]);
  });

  it("no tiene etapa final: del nivel 7 en adelante pide evidencia nueva en la exigencia más alta", () => {
    const old = full6();
    const at7: LevelState = { level: 7, since: NOW };
    const stale = levelProgress(old, at7, { now: NOW + DAY });
    expect(stale).toMatchObject({ level: 7, demand: 6, bar: 0, ready: false });

    const fresh = logOf([...demonstrateAll(6, NOW + DAY), integrator(6, NOW + 2 * DAY)], old);
    const p = levelProgress(fresh, at7, { now: NOW + 3 * DAY });
    expect(p.ready).toBe(true);
    const at8 = nextLevelState(fresh, at7, { now: NOW + 3 * DAY });
    expect(at8).toEqual({ level: 8, since: NOW + 3 * DAY });
    expect(nextLevelState(fresh, at8, { now: NOW + 4 * DAY })).toBe(at8);
    expect(levelProgress(fresh, { level: 40, since: NOW }, { now: NOW + 3 * DAY })).toMatchObject({ level: 40, demand: 6, ready: true });
  });

  it("nunca baja: ni por ausencia, ni por fallos, ni por anulaciones", () => {
    const state: LevelState = { level: 3, since: T0 };
    const fails = logOf(levelSkills(3).flatMap((s) => [0, 1, 2, 3].map((i) => fail({ skills: [s], level: 3, at: T0 + i * HOUR }))));
    expect(nextLevelState(fails, state, { now: NOW })).toBe(state);
    expect(nextLevelState(emptyLog(), state, { now: NOW + 2_000 * DAY })).toBe(state);

    // Anular después todas las evidencias con las que se subió tampoco quita el nivel alcanzado.
    const list = [...demonstrateAll(1), integrator(1)];
    const log = logOf(list);
    const reached = nextLevelState(log, L1, { now: NOW });
    expect(reached.level).toBe(2);
    const annulled = list.reduce((l, e) => annulEvidence(l, { id: e.id, at: NOW, reason: "Rúbrica con error." }), log);
    expect(screen(annulled).counted).toHaveLength(0);
    expect(nextLevelState(annulled, reached, { now: NOW + DAY })).toBe(reached);
    expect(levelProgress(annulled, reached, { now: NOW + DAY })).toMatchObject({ level: 2, bar: 0 });
  });

  it("un nivel guardado con un valor raro se lee como nivel válido", () => {
    expect(levelProgress(emptyLog(), { level: 0, since: T0 }, { now: NOW }).level).toBe(1);
    expect(levelProgress(emptyLog(), { level: -4, since: T0 }, { now: NOW }).level).toBe(1);
    expect(levelProgress(emptyLog(), { level: 2.9, since: T0 }, { now: NOW })).toMatchObject({ level: 2, demand: 2 });
  });
});

describe("declarado, en desarrollo y respaldado por evaluaciones", () => {
  const opts = { now: NOW };

  it("sin evaluaciones, lo declarado se muestra como declarado y no sube el dominio", () => {
    const s = skillStanding(emptyLog(), "fin.valor", { ...opts, declared: ["fin.valor"] });
    expect(s).toMatchObject({ status: "declarado", declared: true });
    expect(s.estimate.stage).toBe(0);
    expect(s.provenLevel).toBeUndefined();
    expect(skillStanding(emptyLog(), "fin.valor", opts)).toMatchObject({ status: "sin_evidencia", declared: false });
  });

  it("declarar todas las habilidades no cambia ninguna estimación", () => {
    const log = logOf([...demonstrate("fin.flujo"), ev({ skills: ["lid.feedback"] })]);
    const all = SKILLS.map((s) => s.id);
    const plain = allStandings(log, opts);
    const declared = allStandings(log, { ...opts, declared: all });
    expect(plain).toHaveLength(SKILLS.length);
    expect(declared.map((s) => s.estimate)).toEqual(plain.map((s) => s.estimate));
    expect(declared.map((s) => s.provenLevel)).toEqual(plain.map((s) => s.provenLevel));
    expect(declared.filter((s) => s.status === "respaldado").map((s) => s.skill)).toEqual(["fin.flujo"]);
    expect(declared.filter((s) => s.status === "en_desarrollo").map((s) => s.skill)).toEqual(["lid.feedback"]);
    expect(declared.filter((s) => s.status === "declarado")).toHaveLength(SKILLS.length - 2);
    expect(plain.filter((s) => s.status === "sin_evidencia")).toHaveLength(SKILLS.length - 2);
  });

  it("con evaluaciones insuficientes queda en desarrollo; con suficientes, respaldado, con el nivel más alto demostrado", () => {
    expect(skillStanding(logOf([fail({ skills: ["fin.flujo"] })]), "fin.flujo", { ...opts, declared: ["fin.flujo"] }).status).toBe("en_desarrollo");
    const s = skillStanding(logOf([...demonstrate("fin.flujo", 1), ...demonstrate("fin.flujo", 3, T0 + DAY)]), "fin.flujo", opts);
    expect(s).toMatchObject({ status: "respaldado", provenLevel: 3 });
    expect(s.estimate.stage).toBe(3);
    expect(SKILL_STATUS_TEXT[s.status]).toBe("Respaldado por evaluaciones");
    expect(() => skillStanding(emptyLog(), "fin.no_existe", opts)).toThrow(/desconocida/);
  });
});

describe("anulaciones, orden y repetibilidad", () => {
  it("anular una evidencia quita su efecto y la conserva en el registro", () => {
    const three = demonstrate("fin.flujo");
    const log = logOf(three);
    expect(estimateSkill(screen(log).counted, "fin.flujo", 1, { now: NOW }).stage).toBe(3);
    const after = annulEvidence(log, { id: three[1].id, at: NOW, reason: "Rúbrica con error." });
    expect(estimateSkill(screen(after).counted, "fin.flujo", 1, { now: NOW }).stage).toBe(2);
    expect(after.items).toHaveLength(3);
  });

  it("el mismo registro da siempre el mismo resultado, sin importar el orden en que se guardó", () => {
    const list = [...demonstrateAll(2), integrator(2), ...levelSkills(2).slice(0, 9).map((s, i) => fail({ skills: [s], level: 2, at: T0 + 2 * DAY + i * HOUR }))];
    const forward = logOf(list);
    const backward = logOf([...list].reverse());
    const state: LevelState = { level: 2, since: T0 };
    const a = levelProgress(forward, state, { now: NOW });
    expect(levelProgress(forward, state, { now: NOW })).toEqual(a);
    expect(levelProgress(backward, state, { now: NOW })).toEqual(a);
    expect(levelProgress(readLog(JSON.parse(JSON.stringify(forward))).log, state, { now: NOW })).toEqual(a);
  });

  it("calcular no modifica el registro", () => {
    const log = logOf([...demonstrateAll(1), integrator(1)]);
    const before = JSON.stringify(log);
    levelProgress(log, L1, { now: NOW });
    nextLevelState(log, L1, { now: NOW });
    allStandings(log, { now: NOW });
    expect(JSON.stringify(log)).toBe(before);
  });

  it("en registros variados se sostienen las garantías básicas", () => {
    let seed = 20260105;
    const rnd = () => { seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648; return seed / 2_147_483_648; };
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];
    const formats: FormatId[] = ["ejercicio", "flash", "aplicado", "inmersivo", "encadenado", "integrador", "repaso"];
    for (let round = 0; round < 25; round++) {
      const level = (1 + Math.floor(rnd() * 4)) as Demand;
      const pool = levelSkills(level);
      const list = Array.from({ length: 30 + Math.floor(rnd() * 120) }, (_, i) => {
        const main = pick(pool);
        const second = pick(pool);
        return ev({
          skills: second === main || rnd() < 0.6 ? [main] : [main, second], level: (1 + Math.floor(rnd() * 5)) as Demand, format: pick(formats),
          at: T0 + i * HOUR, group: rnd() < 0.2 ? `g${Math.floor(rnd() * 6)}` : undefined, context: pick(["restaurante", "software", "clinica"]),
          result: rnd(), reasoning: rnd() < 0.5 ? null : rnd(), aided: rnd() < 0.2, transfer: rnd() < 0.2, seconds: rnd() < 0.1 ? 1 : 200, confidence: rnd() < 0.1 ? 0.3 : 1,
        });
      });
      const log = logOf(list);
      const state: LevelState = { level, since: T0 };
      const now = T0 + 30 * DAY;
      const p = levelProgress(log, state, { now });

      expect(p.bar).toBeGreaterThanOrEqual(0);
      expect(p.bar).toBeLessThanOrEqual(1);
      expect(p.bar === 1).toBe(p.ready);
      expect(p.ready).toBe(p.criteria.every((c) => c.met));
      expect(p.ignored.length + screen(log).counted.length).toBe(list.length);
      for (const s of p.skills) {
        expect(s.stage).toBeGreaterThanOrEqual(0);
        expect(s.stage).toBeLessThanOrEqual(5);
        expect(s.confidence).toBeGreaterThanOrEqual(0);
        expect(s.confidence).toBeLessThanOrEqual(1);
        expect(s.missing.length === 0).toBe(s.stage === 5);
        if (s.stage >= 3) expect(s.coverage.passes).toBeGreaterThanOrEqual(RULES.demonstrated.passes);
        if (s.stage >= 2) expect(s.coverage.passes).toBeGreaterThanOrEqual(1);
      }
      for (const a of p.academies) expect(a.demonstrated + a.developing + a.pending).toBe(a.skills);
      expect(nextLevelState(log, state, { now }).level - level).toBe(p.ready ? 1 : 0);

      // El paso del tiempo no cambia grados ni barras.
      const later = levelProgress(log, state, { now: now + 500 * DAY });
      expect(later.bar).toBe(p.bar);
      expect(later.skills.map((s) => s.stage)).toEqual(p.skills.map((s) => s.stage));

      // Responder mal o con ayuda nunca sube una barra ni un grado por encima de «Inicial».
      const target = pick(pool);
      for (const extra of [fail({ skills: [target], level, at: T0 + 20 * DAY }), ev({ skills: [target], level, aided: true, at: T0 + 20 * DAY })]) {
        const q = levelProgress(appendEvidence(log, extra), state, { now });
        expect(q.bar).toBeLessThanOrEqual(p.bar);
        q.skills.forEach((s, i) => expect(s.stage).toBeLessThanOrEqual(Math.max(p.skills[i].stage, 1)));
        q.academies.forEach((a, i) => expect(a.bar).toBeLessThanOrEqual(p.academies[i].bar));
      }
    }
  });
});

describe("documento de reglas", () => {
  const md = masteryMarkdown();

  it("explica los criterios públicos con los mismos números del cálculo", () => {
    expect(md).toContain(`Reglas versión ${MASTERY_RULES_VERSION}`);
    expect(md).toContain(`${RULES.demonstrated.passes} aciertos sin ayuda, en ${RULES.demonstrated.situations} situaciones distintas`);
    expect(md).toContain(`al menos ${Math.round(RULES.level.academyShare * 100)} % de sus habilidades del nivel demostradas`);
    expect(md).toContain(`Solo vuelve a contar si pasaron ${RULES.spacingDays} días sin verla`);
    for (const h of ["## Qué entra al cálculo y qué no", "## Respuestas que no cuentan", "## Grados de dominio de una habilidad", "## Barra general: paso al siguiente nivel", "## Tres estados para el perfil", "## Límites de esta versión"]) expect(md).toContain(h);
  });

  it("no usa textos vetados ni símbolos decorativos", () => {
    expect(md).not.toMatch(/de cero a ceo|\blibro\b/i);
    expect(md).not.toMatch(/pr[oó]ximamente|en preparaci[oó]n|pr[oó]xima versi[oó]n|llegan? pronto|coming soon/i);
    expect(md).not.toMatch(/[\p{Extended_Pictographic}\u2605\u2606\u2713\u2717]/u);
  });

  it.runIf(!!process.env.DOMINIO_DOC)("escribe docs/metis2/04-dominio.md", () => {
    writeFileSync(DOC, md);
  });

  it.runIf(!process.env.DOMINIO_DOC)("docs/metis2/04-dominio.md está al día", () => {
    expect(existsSync(DOC)).toBe(true);
    expect(readFileSync(DOC, "utf8")).toBe(md);
  });
});
