/**
 * MÊTIS 2.0 · entrega 1.3 · registro de evidencias.
 *
 * Lo que estas pruebas aseguran:
 *  - cada evidencia guarda los siete grupos de datos de la adenda;
 *  - la teoría no puede dejar evidencia;
 *  - el registro solo crece: no hay forma de reescribir ni de borrar; anular conserva el original;
 *  - lo guardado se puede volver a leer, y lo dañado se cuenta en lugar de romper la lectura.
 */
import { describe, expect, it } from "vitest";
import * as mod from "./evidencias";
import { EVIDENCE_VERSION, academiesOf, activeEvidence, annulEvidence, appendEvidence, checkEvidence, emptyLog, newEvidence, readLog, type Evidence, type EvidenceInput } from "./evidencias";
import { FORMATS } from "./academias";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 5, 15);

const input = (over: Partial<EvidenceInput> = {}): EvidenceInput => ({
  id: "ev-1",
  at: T0,
  source: "practica",
  activity: { id: "act-1", version: "1", format: "aplicado" },
  skills: ["fin.flujo", "fin.capital_trabajo"],
  level: 2,
  context: "restaurante",
  observable: "Eligió cobrar anticipo antes de producir.",
  seconds: 40,
  result: 0.8,
  reasoning: 0.7,
  feedback: { ref: "act-1/b", version: "1" },
  rubric: "r1",
  ...over,
});

describe("evidencia · qué guarda", () => {
  it("guarda los siete grupos de datos que pide la adenda", () => {
    const e = newEvidence(input({ transfer: true, confidence: 0.8 }));
    // 1. habilidad principal y secundarias
    expect(e.skills).toEqual(["fin.flujo", "fin.capital_trabajo"]);
    // 2. dificultad
    expect(e.level).toBe(2);
    // 3. evidencia observable
    expect(e.observable).toMatch(/anticipo/);
    expect(e.seconds).toBe(40);
    // 4. calidad del razonamiento
    expect(e.reasoning).toBe(0.7);
    // 5. transferencia a otros contextos
    expect(e.context).toBe("restaurante");
    expect(e.transfer).toBe(true);
    // 6. resultado y retroalimentación
    expect(e.result).toBe(0.8);
    expect(e.feedback).toEqual({ ref: "act-1/b", version: "1" });
    // 7. fecha, versión de rúbrica y confianza
    expect(e.at).toBe(T0);
    expect(e.rubric).toBe("r1");
    expect(e.confidence).toBe(0.8);
  });

  it("no tiene campos de puntos, racha ni conteo de actividades", () => {
    const e = newEvidence(input());
    expect(Object.keys(e).sort()).toEqual(["activity", "aided", "at", "confidence", "context", "feedback", "id", "level", "observable", "reasoning", "result", "rubric", "seconds", "skills", "source", "transfer", "v"]);
    expect(Object.keys(e.activity).sort()).toEqual(["attempt", "format", "group", "id", "version"]);
  });

  it("pone valores por omisión prudentes", () => {
    const e = newEvidence(input());
    expect(e.v).toBe(EVIDENCE_VERSION);
    expect(e.activity.group).toBe("act-1");
    expect(e.activity.attempt).toBe(1);
    expect(e.transfer).toBe(false);
    expect(e.aided).toBe(false);
    expect(e.confidence).toBe(1);
  });

  it("acepta que el razonamiento quede sin evaluar y que no se haya medido el tiempo", () => {
    const { seconds: _s, ...rest } = input({ reasoning: null });
    const e = newEvidence(rest);
    expect(e.reasoning).toBeNull();
    expect("seconds" in e).toBe(false);
  });

  it("reconoce las academias que toca; la primera es la de la habilidad principal", () => {
    expect(academiesOf(newEvidence(input()))).toEqual(["finanzas"]);
    expect(academiesOf(newEvidence(input({ skills: ["lid.feedback", "fin.flujo", "lid.delegacion"] })))).toEqual(["liderazgo", "finanzas"]);
  });
});

describe("evidencia · qué se rechaza", () => {
  const bad = (over: Partial<EvidenceInput>) => () => newEvidence(input(over));

  it("la teoría no puede dejar evidencia", () => {
    expect(bad({ activity: { id: "lec-1", version: "1", format: "leccion" } })).toThrow(/teoría/);
    const theory = FORMATS.filter((f) => !f.evidence).map((f) => f.id);
    expect(theory).toEqual(["leccion"]);
  });

  it("todos los formatos evaluables sí pueden dejarla", () => {
    for (const f of FORMATS.filter((x) => x.evidence)) {
      expect(() => newEvidence(input({ activity: { id: "a", version: "1", format: f.id } }))).not.toThrow();
    }
  });

  it("exige de una a tres habilidades del catálogo, sin repetir", () => {
    expect(bad({ skills: [] })).toThrow(/una a tres/);
    expect(bad({ skills: ["fin.flujo", "fin.balance", "fin.resultados", "fin.lenguaje"] })).toThrow(/una a tres/);
    expect(bad({ skills: ["fin.flujo", "fin.flujo"] })).toThrow(/repetidas/);
    expect(bad({ skills: ["finanzas"] })).toThrow(/desconocida/);
    expect(bad({ skills: ["fin.no_existe"] })).toThrow(/desconocida/);
  });

  it("exige valores dentro de rango", () => {
    expect(bad({ result: 1.2 })).toThrow(/resultado/i);
    expect(bad({ result: -0.1 })).toThrow(/resultado/i);
    expect(bad({ result: Number.NaN })).toThrow(/resultado/i);
    expect(bad({ reasoning: 2 })).toThrow(/razonamiento/);
    expect(bad({ confidence: 1.5 })).toThrow(/confianza/);
    expect(bad({ level: 7 as never })).toThrow(/dificultad/);
    expect(bad({ level: 0 as never })).toThrow(/dificultad/);
    expect(bad({ seconds: -3 })).toThrow(/segundos/);
    expect(bad({ at: 0 })).toThrow(/fecha/);
  });

  it("exige lo que hace auditable la calificación", () => {
    expect(bad({ observable: "  " })).toThrow(/observable/);
    expect(bad({ rubric: "" })).toThrow(/rúbrica/);
    expect(bad({ feedback: { ref: "", version: "1" } })).toThrow(/retroalimentación/);
    expect(bad({ feedback: { ref: "x", version: "" } })).toThrow(/retroalimentación/);
    expect(bad({ context: "" })).toThrow(/contexto/);
    expect(bad({ id: "" })).toThrow(/identificador/);
    expect(bad({ source: "regalo" as never })).toThrow(/Origen/);
    expect(bad({ activity: { id: "a", version: "", format: "aplicado" } })).toThrow(/versión del contenido/);
    expect(bad({ activity: { id: "a", version: "1", format: "aplicado", attempt: 0 } })).toThrow(/intento/);
    expect(bad({ activity: { id: "a", version: "1", format: "magia" as never } })).toThrow(/Formato/);
  });

  it("checkEvidence explica todos los problemas a la vez y no falla con basura", () => {
    expect(checkEvidence(null)).toHaveLength(1);
    expect(checkEvidence("texto")).toHaveLength(1);
    expect(checkEvidence([])).toHaveLength(1);
    expect(checkEvidence({}).length).toBeGreaterThan(8);
    expect(checkEvidence(newEvidence(input()))).toEqual([]);
  });
});

describe("registro · solo crece", () => {
  it("agregar devuelve un registro nuevo y deja intacto el anterior", () => {
    const a = emptyLog();
    const b = appendEvidence(a, newEvidence(input()));
    const c = appendEvidence(b, newEvidence(input({ id: "ev-2", at: T0 + DAY })));
    expect(a.items).toHaveLength(0);
    expect(b.items).toHaveLength(1);
    expect(c.items.map((e) => e.id)).toEqual(["ev-1", "ev-2"]);
    expect(c.items[0]).toBe(b.items[0]);
  });

  it("no acepta dos evidencias con el mismo identificador", () => {
    const log = appendEvidence(emptyLog(), newEvidence(input()));
    expect(() => appendEvidence(log, newEvidence(input({ result: 1 })))).toThrow(/Ya existe/);
  });

  it("lo guardado queda cerrado a cambios", () => {
    const original = { ...newEvidence(input()), skills: ["fin.flujo"], activity: { id: "act-1", version: "1", format: "aplicado" as const, group: "act-1", attempt: 1 }, feedback: { ref: "x", version: "1" } };
    const log = appendEvidence(emptyLog(), original as Evidence);
    const saved = log.items[0];
    expect(() => { (saved as { result: number }).result = 1; }).toThrow(TypeError);
    expect(() => { (saved.skills as string[]).push("fin.balance"); }).toThrow(TypeError);
    expect(() => { (saved.activity as { attempt: number }).attempt = 9; }).toThrow(TypeError);
    expect(() => { (saved.feedback as { ref: string }).ref = "otro"; }).toThrow(TypeError);
    expect(() => { (log.items as Evidence[]).push(saved); }).toThrow(TypeError);
    expect(() => { (log.items as Evidence[]).pop(); }).toThrow(TypeError);
    expect(() => { (log as { items: unknown }).items = []; }).toThrow(TypeError);
    // Cambiar el objeto con el que se creó tampoco altera lo guardado.
    original.result = 0;
    original.skills.push("fin.balance");
    expect(saved.result).toBe(0.8);
    expect(saved.skills).toEqual(["fin.flujo"]);
  });

  it("el módulo no ofrece ninguna operación para borrar ni para editar", () => {
    const names = Object.keys(mod);
    expect(names.filter((n) => /remove|delete|update|edit|replace|clear|reset|borrar|editar|quitar/i.test(n))).toEqual([]);
    expect(names.sort()).toEqual(["EVIDENCE_SOURCES", "EVIDENCE_VERSION", "academiesOf", "activeEvidence", "annulEvidence", "appendEvidence", "checkEvidence", "emptyLog", "newEvidence", "readLog"]);
  });

  it("rechaza agregar una evidencia inválida aunque no venga de newEvidence", () => {
    const forged = { ...newEvidence(input()), activity: { id: "lec", version: "1", format: "leccion", group: "lec", attempt: 1 } } as unknown as Evidence;
    expect(() => appendEvidence(emptyLog(), forged)).toThrow(/teoría/);
  });
});

describe("registro · anular sin borrar", () => {
  const base = () => {
    let log = emptyLog();
    log = appendEvidence(log, newEvidence(input({ id: "b", at: T0 + DAY })));
    log = appendEvidence(log, newEvidence(input({ id: "a", at: T0 })));
    log = appendEvidence(log, newEvidence(input({ id: "c", at: T0 + DAY })));
    return log;
  };

  it("las evidencias vigentes salen por fecha, y a igual fecha por identificador", () => {
    expect(activeEvidence(base()).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("anular quita el efecto y conserva la evidencia con su razón", () => {
    const log = base();
    const after = annulEvidence(log, { id: "b", at: T0 + 2 * DAY, reason: "La rúbrica r1 calificaba mal esta opción." });
    expect(activeEvidence(after).map((e) => e.id)).toEqual(["a", "c"]);
    expect(after.items.map((e) => e.id)).toEqual(["b", "a", "c"]);
    expect(after.annulled).toEqual([{ id: "b", at: T0 + 2 * DAY, reason: "La rúbrica r1 calificaba mal esta opción." }]);
    expect(activeEvidence(log)).toHaveLength(3);
    expect(() => { (after.annulled as unknown[]).pop(); }).toThrow(TypeError);
  });

  it("anular exige razón, que la evidencia exista y que no esté ya anulada", () => {
    const log = base();
    expect(() => annulEvidence(log, { id: "b", at: T0, reason: " " })).toThrow(/razón/);
    expect(() => annulEvidence(log, { id: "zz", at: T0, reason: "x" })).toThrow(/No existe/);
    const once = annulEvidence(log, { id: "b", at: T0, reason: "x" });
    expect(() => annulEvidence(once, { id: "b", at: T0, reason: "x" })).toThrow(/ya estaba anulada/);
  });
});

describe("registro · volver a leer lo guardado", () => {
  it("lo que se guarda como texto se recupera igual", () => {
    let log = emptyLog();
    log = appendEvidence(log, newEvidence(input()));
    log = appendEvidence(log, newEvidence(input({ id: "ev-2", at: T0 + DAY, reasoning: null, aided: true })));
    log = annulEvidence(log, { id: "ev-1", at: T0 + DAY, reason: "prueba" });
    const { log: back, dropped } = readLog(JSON.parse(JSON.stringify(log)));
    expect(dropped).toBe(0);
    expect(back).toEqual(log);
    expect(Object.isFrozen(back.items[0])).toBe(true);
  });

  it("deja fuera lo dañado y avisa cuántas piezas fueron", () => {
    const good = newEvidence(input());
    const raw = {
      v: 1,
      items: [good, { ...good, id: "x", result: 7 }, "basura", { ...good }, { ...good, id: "lec", activity: { ...good.activity, format: "leccion" } }],
      annulled: [{ id: "no-existe", at: T0, reason: "x" }],
    };
    const { log, dropped } = readLog(raw);
    expect(log.items.map((e) => e.id)).toEqual(["ev-1"]);
    expect(dropped).toBe(5);
  });

  it("con algo que no es un registro devuelve uno vacío", () => {
    for (const raw of [null, undefined, 3, "x", [], {}]) {
      expect(readLog(raw)).toEqual({ log: emptyLog(), dropped: 0 });
    }
  });
});
