/**
 * MÊTIS 2.0 · Repositorio Académico · pruebas de las experiencias convertidas.
 *
 * Qué se comprueba, para cada experiencia:
 *  - que cumple el contrato y coincide con la ficha de su lote (habilidades, fuentes, título, pesos de la rúbrica);
 *  - tres recorridos (quien sabe, quien empieza, quien responde al azar) y todas las combinaciones de rutas;
 *  - que las igualdades a la vista se pueden recalcular, y las identidades que cada paquete lista en sus notas de QA;
 *  - que la variante no da pistas, no se resuelve al azar y deja lo escrito en espera de revisión de una persona;
 *  - que un recorrido guardado en cualquier paso se retoma donde iba;
 *  - que nada de esto registra evidencia ni toca la partida.
 *
 * Para regenerar el documento:
 *   REPOSITORIO_DOC=1 npx vitest run src/lib/ceo/metis2/experiencias/experiencias.test.ts
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ACADEMY_IDS, SKILLS, skillById, skillsAt } from "../academias";
import {
  ALIAS_FUENTES, ATLAS, EXPERIENCIAS, FUENTES, LOTES, LOTE_N1, MAX_FIELD, MAX_REPLY, OPTION_LENGTH_RATIO, REVEAL_AFTER, advance, atlasSources, calc, checkExperiencia, correctOf,
  editorialOfSkill, experienciaByEditorial, experienciaBySlug, itemOf, loteOf, newRun, nextOf, nodeOf, originCount, readRun, recompute, routeOf, rowsOf, scoreVariant, sharedAmounts,
  sharpDecisions, shownNumbers, skillOfEditorial, stepOf, variantReady,
  type Accion, type Experiencia, type NodoDecision, type Opcion, type Recorrido, type Respuesta, type Tarea,
} from "./index";
import { repositorioMarkdown } from "./repositorio-doc";

const DIR = "src/lib/ceo/metis2/experiencias";
const DOC = join(process.cwd(), "..", "docs", "metis2", "06-repositorio-academico.md");
const CADA = EXPERIENCIAS.map((x) => [x.editorialId, x] as const);
const by = (editorialId: string) => experienciaByEditorial(editorialId)!;
const PILOTO = by("EDIT-N1-002");

/** Generador con semilla, para que «al azar» sea repetible. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const list = (v: string | string[]) => (Array.isArray(v) ? v : [v]);
const pick = <T,>(xs: T[], r: () => number) => xs[Math.floor(r() * xs.length)];
function shuffle<T>(xs: T[], r: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
const strings = (v: unknown): string[] => (typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === "object" ? Object.values(v).flatMap(strings) : []);

type Elige = (d: NodoDecision) => Opcion;
/** «sabe» resuelve cada actividad a la primera; «falla» se equivoca hasta que le muestran la solución; «azar» tantea. */
interface Politica { elige: Elige; modo: "sabe" | "falla" | "azar"; r?: () => number; escribe?: string | null }

/** Recorre la práctica completa. Si se pasa `log`, guarda el recorrido después de cada acción. */
function play(x: Experiencia, p: Politica, log?: Recorrido[]): Recorrido {
  let run = newRun(x);
  const r = p.r ?? (() => 0);
  const act = (a: Accion, must = true) => {
    const after = advance(x, run, a);
    if (must) expect(after, `${x.editorialId}: la acción ${a.t} no cambió nada en ${run.at}`).not.toBe(run);
    run = after;
    log?.push(run);
  };
  const solve = () => {
    for (let k = 0; k < 6 && !stepOf(run).solved; k++) act({ t: (stepOf(run).checks ?? 0) >= REVEAL_AFTER ? "revelar" : "revisar" });
    expect(stepOf(run).solved, `${x.editorialId}: ${run.at} no se resolvió`).toBe(true);
  };
  for (let i = 0; i < 80; i++) {
    const n = nodeOf(x, run.at)!;
    if (n.kind === "cierre") return run;
    if (n.kind === "decision") act({ t: "elegir", option: p.elige(n).id });
    else if (n.kind === "senalar") {
      const rows = rowsOf(x.docs.filter((d) => n.docs.includes(d.id))).map((q) => q.id);
      const good = correctOf(n);
      const order = p.modo === "sabe" ? good : p.modo === "falla" ? [...rows.filter((k) => !good.includes(k)), ...good] : shuffle(rows, r);
      for (const row of order) { if (stepOf(run).solved) break; act({ t: "senalar", row }); }
      expect(stepOf(run).solved).toBe(true);
    } else if (n.kind === "clasificar") {
      for (const it of n.items) {
        const wrong = n.groups.find((g) => !list(it.group).includes(g.id))?.id ?? list(it.group)[0];
        act({ t: "asignar", item: it.id, group: p.modo === "sabe" ? list(it.group)[0] : p.modo === "falla" ? wrong : pick(n.groups, r).id });
      }
      solve();
    } else if (n.kind === "ordenar") {
      if (p.modo === "sabe") {
        n.order.forEach((card, at) => {
          const cur = stepOf(run).order ?? n.cards.map((c) => c.id);
          for (let j = cur.indexOf(card); j > at; j--) act({ t: "mover", card, dir: -1 });
        });
      } else if (p.modo === "azar") for (let k = 0; k < 5; k++) act({ t: "mover", card: pick(n.cards, r).id, dir: r() < 0.5 ? -1 : 1 }, false);
      solve();
    } else if (n.kind === "calcular") {
      for (const f of n.fields) act({ t: "cifra", field: f.id, value: p.modo === "sabe" || (p.modo === "azar" && r() < 0.5) ? f.answer : f.answer + 1 });
      solve();
    } else if (n.kind === "redactar") {
      const text = p.escribe === undefined ? "Texto de prueba." : p.escribe;
      act({ t: "redactar", text, fields: n.fields && text !== null ? Object.fromEntries(n.fields.map((f) => [f.id, text])) : undefined });
    }
    act({ t: "avanzar" });
  }
  throw new Error(`${x.editorialId}: el recorrido no termina`);
}

const defendible: Elige = (d) => d.options.find((o) => o.tipo === "defendible")!;
const confundido: Elige = (d) => d.options.find((o) => o.tipo === "concepto_erroneo") ?? d.options.find((o) => o.tipo === "riesgosa") ?? d.options[0];
const masLarga: Elige = (d) => [...d.options].sort((a, b) => b.text.length - a.text.length)[0];
const masCorta: Elige = (d) => [...d.options].sort((a, b) => a.text.length - b.text.length)[0];
const EXPERTO: Politica = { elige: defendible, modo: "sabe" };
const NOVATO: Politica = { elige: confundido, modo: "falla" };

const decisions = (x: Experiencia) => x.nodes.filter((n): n is NodoDecision => n.kind === "decision");
const allDefendible = (x: Experiencia, run: Recorrido) => routeOf(x, run).every((q) => q.option.tipo === "defendible");
const textWeight = (x: Experiencia) => x.variant.tasks.filter((t) => t.kind === "texto").reduce((s, t) => s + t.weight, 0);
const vRows = (x: Experiencia, doc: string) => x.variant.docs.find((d) => d.id === doc)!.rows.map((q) => q.id);

function answerOf(x: Experiencia, t: Tarea, how: "bien" | "mal", text?: string): Respuesta | undefined {
  if (t.kind === "cifra") return how === "bien" ? t.answer : t.answer + 1;
  if (t.kind === "clasificar") return Object.fromEntries(t.items.map((i) => [i.id, how === "bien" ? list(i.group)[0] : t.groups.find((g) => !list(i.group).includes(g.id))?.id ?? list(i.group)[0]]));
  if (t.kind === "ordenar") return how === "bien" ? [...t.order] : t.cards.map((c) => c.id);
  if (t.kind === "senalar") return how === "bien" ? [...t.correct] : [vRows(x, t.doc).find((k) => !t.correct.includes(k))!];
  return text === undefined ? undefined : t.fields ? Object.fromEntries(t.fields.map((f) => [f.id, text])) : { texto: text };
}
const answers = (x: Experiencia, how: "bien" | "mal", text?: string): Record<string, Respuesta> =>
  Object.fromEntries(x.variant.tasks.flatMap((t) => { const a = answerOf(x, t, how, text); return a === undefined ? [] : [[t.id, a] as const]; }));

function deliver(x: Experiencia, run: Recorrido, ans: Record<string, Respuesta>): Recorrido {
  let r = advance(x, run, { t: "comprobar" });
  for (const [task, value] of Object.entries(ans)) r = advance(x, r, { t: "responder", task, value });
  return advance(x, r, { t: "entregar" });
}

/** Responde la variante sin leer: cifras del documento o inventadas, tarjetas a cualquier grupo, orden barajado, renglones sueltos. */
function azar(x: Experiencia, r: () => number): Record<string, Respuesta> {
  const shown = [...shownNumbers(x.variant.docs)];
  return Object.fromEntries(x.variant.tasks.flatMap((t): [string, Respuesta][] => {
    if (t.kind === "cifra") return [[t.id, r() < 0.5 && shown.length ? pick(shown, r) : Math.round(r() * 200) * 500]];
    if (t.kind === "clasificar") return [[t.id, Object.fromEntries(t.items.map((i) => [i.id, pick(t.groups, r).id]))]];
    if (t.kind === "ordenar") return [[t.id, shuffle(t.cards.map((c) => c.id), r)]];
    if (t.kind === "senalar") { const rows = vRows(x, t.doc); const some = rows.filter(() => r() < 0.3); return [[t.id, some.length ? some : [pick(rows, r)]]]; }
    return [];
  }));
}
/** Proporción de entregas al azar que obtienen todos los puntos comprobables, y promedio de puntos. */
function azarStats(x: Experiencia, n = 4000): { full: number; mean: number } {
  const top = 100 - textWeight(x);
  let full = 0;
  let sum = 0;
  for (let i = 0; i < n; i++) { const s = scoreVariant(x.variant, azar(x, rng(i + 7))).score; sum += s; if (s === top) full++; }
  return { full: full / n, mean: sum / n };
}

// Igualdades escritas en un texto: «a − b = c». Se recalculan con la misma calculadora que usa la pantalla.
const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
const CHAIN = new RegExp(`((?:${NUM}\\s*[−+×÷]\\s*)+${NUM})\\s*=\\s*(−?${NUM})`, "g");
const num = (t: string) => Number(t.replace(/−/g, "-").replace(/,/g, ""));
function equalities(text: string): { seg: string; value: number | null; result: number }[] {
  const out: { seg: string; value: number | null; result: number }[] = [];
  for (const seg of text.split(";")) {
    if (!seg.includes("=")) continue;
    const found = [...seg.matchAll(CHAIN)];
    if (found.length) { for (const m of found) out.push({ seg, value: calc(m[1]), result: num(m[2]) }); continue; }
    // Las cifras pueden venir entre palabras: «Nómina de 12,000 − saldo de 5,000 = faltan 7,000».
    const parts = seg.split("=");
    const expr = parts[parts.length - 2];
    const nums = expr.match(new RegExp(NUM, "g")) ?? [];
    const ops = expr.match(/[−+×÷]/g) ?? [];
    const res = parts[parts.length - 1].match(new RegExp(`−?${NUM}`));
    out.push({ seg, value: nums.length > 1 && ops.length === nums.length - 1 && res ? calc(nums.map((v, i) => (i ? ops[i - 1] : "") + v).join(" ")) : null, result: res ? num(res[0]) : NaN });
  }
  return out;
}
const cell = (x: Experiencia, row: string, col = 0) => num(rowsOf(x.docs).find((q) => q.id === row)!.cells![col].replace(/[$%\s]/g, ""));

// ───────────────────────────────────────────── identificadores y fuentes

describe("correspondencia de identificadores (Atlas ↔ catálogo)", () => {
  it("los 52 identificadores editoriales corresponden, uno a uno, a las 52 habilidades del catálogo", () => {
    expect(ATLAS).toHaveLength(52);
    expect(new Set(ATLAS.map((a) => a[0])).size).toBe(52);
    expect(ATLAS.map((a) => a[1])).toEqual(SKILLS.map((s) => s.id));
  });

  it("el prefijo editorial coincide con la academia y el número con el orden dentro de ella", () => {
    const PREFIX: Record<string, string> = { EST: "estrategia", FIN: "finanzas", LID: "liderazgo", OPE: "operaciones", CRE: "crecimiento", RIE: "riesgo" };
    for (const id of ACADEMY_IDS) {
      const rows = ATLAS.filter((a) => skillById(a[1])!.academy === id);
      rows.forEach((a, i) => {
        expect(PREFIX[a[0].split("-")[0]]).toBe(id);
        expect(Number(a[0].split("-")[1])).toBe(i + 1);
      });
    }
  });

  it("ida y vuelta: editorial → catálogo → editorial", () => {
    for (const [e, s] of ATLAS) { expect(skillOfEditorial(e)).toBe(s); expect(editorialOfSkill(s)).toBe(e); }
    expect(skillOfEditorial("FIN-01")).toBe("fin.lenguaje");
    expect(skillOfEditorial("XXX-99")).toBeUndefined();
  });

  it("toda fuente citada existe en el registro y tiene dirección", () => {
    expect(Object.keys(FUENTES)).toHaveLength(16);
    for (const [, , src] of ATLAS) for (const f of src) expect(FUENTES[f], f).toBeDefined();
    for (const f of Object.values(FUENTES)) { expect(f.url).toMatch(/^https:\/\//); expect(f.seen.length).toBeGreaterThan(20); }
    for (const f of Object.values(ALIAS_FUENTES)) expect(FUENTES[f], f).toBeDefined();
  });

  it("tres lotes de seis experiencias, una por academia, con dieciocho habilidades distintas de nivel 1", () => {
    expect(LOTES.map((l) => l.items.length)).toEqual([6, 6, 6]);
    const n1 = skillsAt(1).map((s) => s.id);
    expect(n1).toHaveLength(24);
    const items = LOTES.flatMap((l) => l.items);
    expect(new Set(items.map((i) => i.primary)).size).toBe(18);
    expect(new Set(items.map((i) => i.editorialId)).size).toBe(18);
    for (const lote of LOTES) {
      expect(new Set(lote.items.map((l) => skillById(l.primary)!.academy)).size).toBe(6);
      expect(lote.files.length).toBeGreaterThan(0);
      for (const l of lote.items) {
        expect(n1, l.editorialId).toContain(l.primary);
        expect(loteOf(l.editorialId)).toBe(lote);
        expect(itemOf(l.editorialId)).toBe(l);
        for (const s of l.secondary) expect(skillById(s), s).toBeDefined();
        for (const f of [...l.sources, ...l.manifest]) expect(FUENTES[f], f).toBeDefined();
        expect(l.rubric.split("/").reduce((a, b) => a + Number(b), 0)).toBe(100);
      }
    }
    // El lote 02 llegó sin manifiesto.
    expect(LOTES[1].items.every((l) => l.manifest.length === 0)).toBe(true);
  });

  it("deja a la vista dónde el Atlas y la experiencia no citan las mismas fuentes", () => {
    const differ = LOTE_N1.filter((l) => [...l.sources].sort().join() !== [...atlasSources(l.primary)].sort().join()).map((l) => l.editorialId);
    expect(differ).toEqual(["EDIT-N1-002", "EDIT-N1-003", "EDIT-N1-004", "EDIT-N1-005", "EDIT-N1-006"]);
  });
});

// ───────────────────────────────────────────── contrato

describe("registro de experiencias convertidas", () => {
  it("identificadores, direcciones y piezas editoriales no se repiten", () => {
    for (const key of ["id", "slug", "editorialId"] as const) expect(new Set(EXPERIENCIAS.map((x) => x[key])).size).toBe(EXPERIENCIAS.length);
    expect(new Set(EXPERIENCIAS.map((x) => x.variant.id)).size).toBe(EXPERIENCIAS.length);
    for (const x of EXPERIENCIAS) { expect(experienciaBySlug(x.slug)).toBe(x); expect(x.slug).toMatch(/^[a-z0-9-]+$/); }
  });

  it("el lote 02 está completo: seis experiencias, una por academia", () => {
    const l2 = LOTES[1].items.map((i) => by(i.editorialId));
    expect(l2.every(Boolean)).toBe(true);
    expect(new Set(l2.map((x) => x.academy)).size).toBe(6);
  });

  it("del lote 03 hay cinco convertidas, en el orden editorial; EDIT-N1-014 sigue sin convertir y no se muestra", () => {
    const ids = LOTES[2].items.map((i) => i.editorialId);
    expect(ids).toHaveLength(6);
    const hechas = ids.filter((id) => EXPERIENCIAS.some((x) => x.editorialId === id));
    expect(hechas).toEqual(["EDIT-N1-013", "EDIT-N1-015", "EDIT-N1-016", "EDIT-N1-017", "EDIT-N1-018"]);
    expect(new Set(hechas.map((id) => by(id).academy)).size).toBe(5);
    expect(EXPERIENCIAS.map((x) => x.editorialId)).toEqual([...EXPERIENCIAS.map((x) => x.editorialId)].sort());
    expect(EXPERIENCIAS).toHaveLength(12);
  });
});

describe.each(CADA)("%s cumple el contrato", (_id, x) => {
  it("pasa la revisión sin errores y deja avisos para la revisión editorial", () => {
    const r = checkExperiencia(x);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toContain("sin revisión editorial humana");
  });

  it("coincide con la ficha de su lote: habilidades, fuentes, título, versión y pesos de la rúbrica", () => {
    const item = itemOf(x.editorialId)!;
    expect(x.skills.primary).toBe(item.primary);
    expect(x.skills.secondary).toEqual(item.secondary);
    expect(x.sourceIds).toEqual(item.sources);
    expect(x.title).toBe(item.title);
    expect(x.packageVersion).toBe(loteOf(x.editorialId)!.packageVersion);
    expect(skillById(x.skills.primary)!.academy).toBe(x.academy);
    // Un criterio del paquete puede repartirse en varias tareas («Criterio: parte»); la suma por criterio es la del paquete.
    const weights: [string, number][] = [];
    for (const t of x.variant.tasks) { const c = t.criterion.split(":")[0]; const last = weights[weights.length - 1]; if (last && last[0] === c) last[1] += t.weight; else weights.push([c, t.weight]); }
    expect(weights.map((w) => w[1])).toEqual(item.rubric.split("/").map(Number));
  });

  it("no es un cuestionario: situación, documentos, decisiones con consecuencias propias, actividades y cierre", () => {
    const kinds = new Set(x.nodes.map((n) => n.kind));
    for (const k of ["mensaje", "explorar", "decision", "cierre"] as const) expect(kinds.has(k), k).toBe(true);
    expect(decisions(x).length).toBeGreaterThanOrEqual(2);
    // Además de decidir, hay que hacer algo con los documentos: señalar, clasificar, ordenar, calcular o redactar.
    expect((["senalar", "clasificar", "ordenar", "calcular", "redactar"] as const).filter((k) => kinds.has(k)).length).toBeGreaterThanOrEqual(1);
    for (const d of decisions(x)) {
      expect(new Set(d.options.map((o) => o.feedback)).size).toBe(d.options.length);
      expect(new Set(d.options.map((o) => o.consequence.map((l) => l.text).join())).size).toBe(d.options.length);
    }
    // La variante no tiene opciones para elegir: se calcula, se clasifica, se ordena, se señala o se escribe.
    for (const t of x.variant.tasks) {
      expect(["cifra", "clasificar", "ordenar", "senalar", "texto"]).toContain(t.kind);
      expect(Object.keys(t)).not.toContain("options");
      if (t.kind === "cifra") expect(Number.isInteger(t.answer)).toBe(true);
      if (t.kind === "clasificar") expect(t.items.length).toBeGreaterThanOrEqual(3);
      if (t.kind === "senalar") expect(vRows(x, t.doc).length).toBeGreaterThan(t.correct.length + 1);
    }
  });

  it("toda igualdad escrita, en cualquier texto, da lo que dice", () => {
    const eqs = strings(x).flatMap(equalities);
    for (const e of eqs) expect(e.value, e.seg).toBe(e.result);
    for (const d of [...x.docs, ...x.variant.docs]) for (const r of d.rows) if (r.suma) expect(recompute(d, r.id), r.label).toBe(r.amount);
    for (const n of x.nodes) if (n.kind === "calcular") for (const f of n.fields) expect(equalities(f.calc).some((e) => e.result === f.answer), f.id).toBe(true);
    for (const t of x.variant.tasks) if (t.kind === "cifra") expect(equalities(t.calc).some((e) => e.result === t.answer), t.id).toBe(true);
  });

  it("las opciones tienen largo parecido y el largo no delata la ruta defendible", () => {
    for (const d of decisions(x)) {
      const len = d.options.map((o) => o.text.length);
      expect(Math.max(...len) / Math.min(...len), d.id).toBeLessThanOrEqual(OPTION_LENGTH_RATIO);
    }
    const sharp = sharpDecisions(x);
    if (sharp.length) {
      expect(sharp.every((d) => masLarga(d).tipo === "defendible")).toBe(false);
      expect(sharp.every((d) => masCorta(d).tipo === "defendible")).toBe(false);
    }
  });

  it("sabe qué viene del paquete y qué se redactó al convertir", () => {
    const o = originCount(x);
    expect(o.fuente).toBeGreaterThan(0);
    expect(o.adaptado + o.conversion).toBeGreaterThan(0);
    expect(x.conversionNotes.length).toBeGreaterThanOrEqual(3);
  });
});

describe("la revisión detecta una experiencia mal armada", () => {
  const copy = (x: Experiencia): Experiencia => JSON.parse(JSON.stringify(x));
  const errors = (x: Experiencia) => checkExperiencia(x).errors.join(" | ");

  it("totales, pesos, habilidades, política de evidencia y largo de opciones", () => {
    const bad = copy(PILOTO);
    bad.docs[0].rows[3].amount = 16000;
    bad.variant.tasks[0].weight = 30;
    bad.skills.primary = "fin.no_existe";
    (bad as { evidencePolicy: string }).evidencePolicy = "registra";
    (bad.nodes[2] as NodoDecision).options[0].text += " Además conviene revisar con calma cada uno de los renglones de los dos documentos.";
    const e = errors(bad);
    for (const m of ["no sale de sus renglones", "no suman 100", "no está en el catálogo", "no puede registrar evidencia", "largo parecido"]) expect(e).toContain(m);
  });

  it("respuesta a la vista, variante solo escrita y personajes repetidos", () => {
    const a = copy(by("EDIT-N1-008"));
    const cifra = a.variant.tasks.find((t) => t.kind === "cifra")!;
    if (cifra.kind === "cifra") cifra.answer = 72000;
    expect(errors(a)).toContain("está a la vista en la variante");

    const b = copy(by("EDIT-N1-007"));
    b.variant.tasks = b.variant.tasks.filter((t) => t.kind === "texto");
    expect(errors(b)).toContain("ninguna tarea que se pueda comprobar sin una persona");

    const c = copy(by("EDIT-N1-012"));
    c.variant.setting += " Camila preside el comité.";
    expect(errors(c)).toContain("reutiliza personajes");
  });

  it("actividades mal armadas: tarjetas ya en orden, grupo que no existe, gancho largo, nodo suelto", () => {
    const a = copy(by("EDIT-N1-010"));
    const flujo = a.nodes.find((n) => n.kind === "ordenar")!;
    if (flujo.kind === "ordenar") flujo.cards = flujo.order.map((id) => flujo.cards.find((c) => c.id === id)!);
    expect(errors(a)).toContain("presenta las tarjetas ya en orden");

    const b = copy(by("EDIT-N1-011"));
    const voces = b.nodes.find((n) => n.kind === "clasificar")!;
    if (voces.kind === "clasificar") voces.items[0].group = "no_existe";
    expect(errors(b)).toContain("no tiene grupo válido");

    const c = copy(by("EDIT-N1-009"));
    const hook = c.nodes.find((n) => n.kind === "mensaje")!;
    if (hook.kind === "mensaje") hook.text += " palabra".repeat(40);
    expect(errors(c)).toContain("el gancho tiene");

    const d = copy(by("EDIT-N1-012"));
    d.nodes.push({ id: "suelto", kind: "dato", moment: 0, origen: "conversion", title: "x", items: ["x"], next: "cierre" });
    expect(errors(d)).toContain("el nodo suelto no se alcanza");
  });
});

// ───────────────────────────────────────────── recorridos

describe.each(CADA)("%s · recorridos de la práctica", (_id, x) => {
  it("quien sabe: solo rutas defendibles, actividades resueltas a la primera", () => {
    const run = play(x, EXPERTO);
    expect(nodeOf(x, run.at)!.kind).toBe("cierre");
    expect(routeOf(x, run).length).toBeGreaterThanOrEqual(2);
    expect(allDefendible(x, run)).toBe(true);
    for (const p of run.trail) { expect(p.revealed ?? false).toBe(false); expect(p.checks ?? 0).toBe(0); expect(p.misses ?? []).toEqual([]); }
  });

  it("quien empieza: cae en las confusiones, falla las actividades, ve la solución y termina", () => {
    const run = play(x, NOVATO);
    expect(nodeOf(x, run.at)!.kind).toBe("cierre");
    for (const q of routeOf(x, run)) if (q.node.options.some((o) => o.tipo !== "defendible")) expect(q.option.tipo, q.node.id).not.toBe("defendible");
    for (const p of run.trail) {
      const n = nodeOf(x, p.node)!;
      if (n.kind === "clasificar" || n.kind === "calcular" || (n.kind === "ordenar" && n.strict)) { expect(p.checks, n.id).toBe(REVEAL_AFTER); expect(p.revealed, n.id).toBe(true); expect(p.solved).toBe(true); }
      if (n.kind === "senalar") {
        expect(p.solved).toBe(true);
        expect((p.misses ?? []).length).toBeGreaterThan(0);
        // Cada error al señalar tiene su explicación.
        for (const m of p.misses!) expect((n.wrong[m] ?? n.fallback).length).toBeGreaterThan(20);
      }
    }
  });

  it("al azar: siempre termina, y acertar todas las decisiones no es lo habitual", () => {
    let all = 0;
    const N = 300;
    for (let i = 0; i < N; i++) {
      const r = rng(i + 1);
      const run = play(x, { elige: (d) => pick(d.options, r), modo: "azar", r });
      expect(nodeOf(x, run.at)!.kind).toBe("cierre");
      if (allDefendible(x, run)) all++;
    }
    // Varias decisiones de los paquetes admiten más de una ruta defendible; aun así, tantear no las acierta todas la mayoría de las veces.
    expect(all / N).toBeLessThan(0.6);
  });

  it("todas las combinaciones de rutas llegan al cierre y, entre todas, pasan por todos los nodos", () => {
    const ds = decisions(x);
    const seen = new Set<string>();
    let combos: Record<string, Opcion>[] = [{}];
    for (const d of ds) combos = combos.flatMap((c) => d.options.map((o) => ({ ...c, [d.id]: o })));
    expect(combos.length).toBe(ds.reduce((s, d) => s * d.options.length, 1));
    for (const c of combos) {
      const run = play(x, { elige: (d) => c[d.id], modo: "sabe" });
      expect(nodeOf(x, run.at)!.kind).toBe("cierre");
      run.trail.forEach((p) => seen.add(p.node));
    }
    expect([...seen].sort()).toEqual(x.nodes.map((n) => n.id).sort());
  });

  it("elegir siempre la opción más larga, o siempre la más corta, no lleva solo por rutas defendibles", () => {
    if (!sharpDecisions(x).length) return;
    expect(allDefendible(x, play(x, { elige: masLarga, modo: "sabe" }))).toBe(false);
    expect(allDefendible(x, play(x, { elige: masCorta, modo: "sabe" }))).toBe(false);
  });

  it("no se avanza sin decidir ni sin resolver la actividad, y lo decidido no se cambia", () => {
    const log: Recorrido[] = [];
    play(x, EXPERTO, log);
    const checked = new Set<string>();
    for (const run of [newRun(x), ...log]) {
      const n = nodeOf(x, run.at)!;
      const s = stepOf(run);
      if (n.kind === "decision" && !s.choice) {
        expect(nextOf(x, run)).toBeNull();
        expect(advance(x, run, { t: "avanzar" })).toBe(run);
        expect(advance(x, run, { t: "elegir", option: "no_existe" })).toBe(run);
        const chosen = advance(x, run, { t: "elegir", option: n.options[0].id });
        expect(advance(x, chosen, { t: "elegir", option: n.options[1].id })).toBe(chosen);
        expect(nextOf(x, chosen)).toBe(n.options[0].next);
        checked.add(n.id);
      }
      if ((n.kind === "senalar" || n.kind === "clasificar" || n.kind === "ordenar" || n.kind === "calcular") && !s.solved) {
        expect(advance(x, run, { t: "avanzar" })).toBe(run);
        // Ver la solución solo se ofrece después de intentarlo.
        if ((s.checks ?? 0) < REVEAL_AFTER) expect(advance(x, run, { t: "revelar" })).toBe(run);
        checked.add(n.id);
      }
      if (n.kind === "redactar" && !(n.id in run.replies)) { expect(advance(x, run, { t: "avanzar" })).toBe(run); checked.add(n.id); }
    }
    expect(checked.size).toBeGreaterThanOrEqual(3);
  });

  it("lo escrito es opcional, se guarda recortado y no cambia nada más", () => {
    const writers = x.nodes.filter((n) => n.kind === "redactar");
    const corta = play(x, { ...EXPERTO, escribe: "No es lo mismo." });
    const larga = play(x, { ...EXPERTO, escribe: "x".repeat(2000) });
    const sin = play(x, { ...EXPERTO, escribe: null });
    const vacia = play(x, { ...EXPERTO, escribe: "   " });
    for (const n of writers) {
      if (n.kind !== "redactar") continue;
      expect(sin.replies[n.id]).toBeNull();
      expect(vacia.replies[n.id]).toBeNull();
      const short = corta.replies[n.id]!;
      const long = larga.replies[n.id]!;
      if (n.fields) { for (const f of n.fields) { expect(short[f.id]).toBe("No es lo mismo."); expect(long[f.id]).toHaveLength(MAX_FIELD); } }
      else { expect(short).toEqual({ texto: "No es lo mismo." }); expect(long.texto).toHaveLength(MAX_REPLY); }
    }
    // El camino y el resultado de la variante son los mismos, se escriba mucho, poco o nada.
    for (const r of [larga, sin, vacia]) expect(r.trail.map((p) => p.node)).toEqual(corta.trail.map((p) => p.node));
    const scores = [corta, larga, sin].map((r) => deliver(x, r, answers(x, "bien")).result!.score);
    expect(new Set(scores).size).toBe(1);
  });

  it("consultar documentos y abrir el concepto queda anotado, sin cambiar el recorrido", () => {
    const row = rowsOf(x.docs)[0].id;
    let run = newRun(x);
    run = advance(x, run, { t: "abrir", row });
    run = advance(x, run, { t: "abrir", row });
    run = advance(x, run, { t: "abrir", row: "no.existe" });
    run = advance(x, run, { t: "teoria" });
    expect(run.opened).toEqual([row]);
    expect(run.theory).toBe(1);
    expect(run.at).toBe(x.start);
    expect(run.trail).toHaveLength(1);
  });
});

describe("EDIT-N1-002 · caminos propios del piloto", () => {
  const X = PILOTO;

  it("quien sabe no pasa por la comprobación extra; quien se confunde, sí", () => {
    expect(play(X, EXPERTO).trail.map((p) => p.node)).toEqual(["mensaje", "explorar", "diagnostico", "dato", "promesa", "respuesta", "cierre"]);
    const [d1, d2] = decisions(X);
    for (const a of d1.options) for (const b of d2.options) {
      const nodes = play(X, { elige: (d) => (d.id === d1.id ? a : b), modo: "falla" }).trail.map((p) => p.node);
      expect(nodes).toContain("dato");
      expect(nodes).toContain("respuesta");
      expect(nodes.includes("comprobar")).toBe(a.tipo !== "defendible");
    }
  });

  it("al azar acierta las dos decisiones cerca de una de cada nueve veces", () => {
    let both = 0;
    for (let i = 0; i < 600; i++) { const r = rng(i + 1); if (allDefendible(X, play(X, { elige: (d) => pick(d.options, r), modo: "azar", r }))) both++; }
    expect(both / 600).toBeLessThan(0.2);
    expect(both).toBeGreaterThan(0);
  });
});

// ───────────────────────────────────────────── variante

describe.each(CADA)("%s · variante independiente (otra situación, sin apoyo)", (_id, x) => {
  const v = x.variant;
  const done = play(x, EXPERTO);
  const pend = textWeight(x);

  it("es otra situación: sin personajes de la práctica, sin explicaciones y sin la respuesta a la vista", () => {
    const text = [v.title, v.setting, v.question, v.intro, ...v.docs.flatMap((d) => [d.title, d.foot ?? "", ...d.rows.flatMap((r) => [r.label, ...(r.cells ?? [])])]), ...v.tasks.map((t) => t.prompt)].join(" ");
    for (const c of x.characters) expect(text).not.toMatch(new RegExp(`\\b${c.name}\\b`));
    expect(v.docs.flatMap((d) => d.rows).every((r) => !r.nota)).toBe(true);
    const shown = shownNumbers(v.docs);
    for (const t of v.tasks) {
      if (t.kind !== "cifra") continue;
      expect(shown.has(t.answer), t.id).toBe(false);
      // Ninguna pregunta dice cómo se calcula.
      expect(t.prompt).not.toMatch(/[−+=×÷]|menos|rest[ae]|sum[ae]|divid|multipl/i);
    }
    expect(v.id).not.toBe(x.id);
    expect(v.passAt).toBe(70);
  });

  it("quien responde bien obtiene todos los puntos que se comprueban solos; lo escrito queda en espera y no hay veredicto", () => {
    const escrito = deliver(x, done, answers(x, "bien", "Una respuesta escrita.")).result!;
    expect(escrito.pending).toBe(pend);
    expect(escrito.auto).toBe(100 - pend);
    expect(escrito.score).toBe(100 - pend);
    expect(escrito.pass).toBe(pend ? null : true);
    for (const it of escrito.items) {
      const t = v.tasks.find((q) => q.id === it.id)!;
      expect(it.weight).toBe(t.weight);
      expect(it.auto).toBe(t.kind !== "texto");
      expect(it.ok).toBe(t.kind !== "texto");
      expect(it.got).toBe(t.kind === "texto" ? 0 : t.weight);
    }
    // Escribir mucho o poco no mueve los puntos.
    expect(scoreVariant(v, answers(x, "bien", "x".repeat(900))).score).toBe(escrito.score);
    expect(scoreVariant(v, answers(x, "bien", "x")).score).toBe(escrito.score);
    // Sin escribir nada no queda nada en espera: esos puntos simplemente no se obtienen.
    const blanco = deliver(x, done, answers(x, "bien")).result!;
    expect(blanco.pending).toBe(0);
    expect(blanco.auto).toBe(100);
    expect(blanco.score).toBe(100 - pend);
    expect(blanco.pass).toBe(100 - pend >= v.passAt);
  });

  it("quien responde mal no obtiene puntos, y el crédito parcial solo existe al clasificar", () => {
    const mal = deliver(x, done, answers(x, "mal")).result!;
    expect(mal.score).toBe(0);
    expect(mal.pass).toBe(false);
    for (const t of v.tasks) {
      if (t.kind === "texto") continue;
      const one = scoreVariant(v, { ...answers(x, "bien"), [t.id]: answerOf(x, t, "mal")! });
      expect(one.items.find((i) => i.id === t.id)!.got).toBe(0);
      expect(one.score).toBe(100 - pend - t.weight);
      if (t.kind === "clasificar") {
        const good = answerOf(x, t, "bien") as Record<string, string>;
        const bad = answerOf(x, t, "mal") as Record<string, string>;
        const part = scoreVariant(v, { ...answers(x, "bien"), [t.id]: { ...good, [t.items[0].id]: bad[t.items[0].id] } }).items.find((i) => i.id === t.id)!;
        expect(part.got).toBe(Math.round((t.weight * (t.items.length - 1)) / t.items.length));
        expect(part.ok).toBe(false);
      }
    }
  });

  it("responder al azar muy rara vez obtiene todos los puntos comprobables", () => {
    const s = azarStats(x);
    expect(s.full).toBeLessThan(0.02);
    expect(s.mean).toBeLessThan(0.55 * (100 - pend));
  });

  it("no se entrega a medias y no se entra a la variante antes del cierre", () => {
    expect(advance(x, newRun(x), { t: "comprobar" }).phase).toBe("aprender");
    const before = advance(x, done, { t: "comprobar" });
    expect(before.phase).toBe("demostrar");
    // En la variante ya no se abren notas ni el concepto.
    expect(advance(x, before, { t: "teoria" })).toBe(before);
    expect(advance(x, before, { t: "abrir", row: rowsOf(x.docs)[0].id })).toBe(before);
    expect(advance(x, before, { t: "responder", task: "no_existe", value: 1 })).toBe(before);
    const needs = v.tasks.filter((t) => t.kind === "cifra" || t.kind === "clasificar" || t.kind === "senalar");
    expect(needs.length).toBeGreaterThan(0);
    expect(variantReady(x, before)).toBe(false);
    expect(advance(x, before, { t: "entregar" })).toBe(before);
    // Falta una sola tarea: tampoco.
    let r = before;
    for (const [task, value] of Object.entries(answers(x, "bien"))) if (task !== needs[0].id) r = advance(x, r, { t: "responder", task, value });
    expect(advance(x, r, { t: "entregar" })).toBe(r);
    const fin = deliver(x, done, answers(x, "bien"));
    expect(fin.phase).toBe("fin");
    // Entregado, ya no se cambia.
    expect(advance(x, fin, { t: "responder", task: v.tasks[0].id, value: 1 })).toBe(fin);
  });
});

describe("EDIT-N1-002 · variante del piloto", () => {
  const X = PILOTO;

  it("cada criterio pesa lo que dice la rúbrica del paquete (35 / 30 / 35)", () => {
    const right = answers(X, "bien");
    expect(right).toEqual({ por_cobrar: 45000, utilidad: 17000, saldo: 5000 });
    expect(scoreVariant(X.variant, right).pass).toBe(true);
    expect(scoreVariant(X.variant, { ...right, utilidad: 1 }).score).toBe(70);
    expect(scoreVariant(X.variant, { ...right, saldo: 1 }).score).toBe(65);
    expect(scoreVariant(X.variant, { ...right, saldo: 1 }).pass).toBe(false);
  });

  it("quien confunde utilidad con caja no pasa; quien repite de memoria las cifras de la práctica acierta dos de tres", () => {
    // Cree que el saldo es la utilidad, y que la utilidad es lo cobrado menos lo pagado.
    const r = scoreVariant(X.variant, { por_cobrar: 80000, utilidad: 35000 - 30000 - 25000 + 25000, saldo: 17000 });
    expect(r.score).toBe(0);
    expect(r.pass).toBe(false);
    const memoria = scoreVariant(X.variant, { por_cobrar: 45000, utilidad: 15000, saldo: 5000 });
    expect(memoria.score).toBe(70);
    // Aviso para la revisión editorial: con la regla provisional de 70, eso alcanza para pasar.
    expect(memoria.pass).toBe(true);
    expect(sharedAmounts(X)).toEqual([5000, 25000, 45000]);
  });
});

// ───────────────────────────────────────────── identidades de QA de los paquetes

describe("identidades que los paquetes listan en sus notas de QA", () => {
  it("EDIT-N1-002: utilidad 15,000; flujo −20,000; saldo 5,000; faltan 7,000 (la tabla, no el texto del sobregiro)", () => {
    const X = PILOTO;
    const [a, b] = X.docs;
    expect(recompute(a, "A.utilidad")).toBe(15000);
    expect(100000 - 60000 - 25000).toBe(15000);
    expect(recompute(b, "B.final")).toBe(5000);
    expect(55000 - 50000 - 25000).toBe(-20000);
    expect(25000 - 20000).toBe(5000);
    expect(12000 - 5000).toBe(7000);
    expect(100000 - 55000).toBe(45000);
    // Lo que ve quien juega no menciona el sobregiro (las notas para la revisión editorial sí lo explican).
    const { conversionNotes: _n, ...jugable } = X;
    void _n;
    expect(JSON.stringify(jugable)).not.toMatch(/sobregiro/i);
    const v = Object.fromEntries(X.variant.docs[0].rows.map((r) => [r.id, r.amount!]));
    const ans = answers(X, "bien") as Record<string, number>;
    expect(v["V.ingresos"] - v["V.costos"] - v["V.gastos"]).toBe(ans.utilidad);
    expect(v["V.inicial"] + v["V.cobros"] - v["V.pagos_costos"] - v["V.pagos_gastos"]).toBe(ans.saldo);
    expect(v["V.ingresos"] - v["V.cobros"]).toBe(ans.por_cobrar);
  });

  it("EDIT-N1-007: 118 − 92 = 26; 15 de 20 es 75 % en la muestra, sin hablar de una tasa general", () => {
    const X = by("EDIT-N1-007");
    expect(cell(X, "A.precio", 0) - cell(X, "A.precio", 1)).toBe(26);
    expect(15 / 20).toBe(0.75);
    const dato = X.nodes.find((n) => n.id === "registro")!;
    expect(dato.kind).toBe("dato");
    if (dato.kind === "dato") { expect(dato.items.join(" ")).toMatch(/20 entregas.*15/); expect(dato.calc).toMatch(/75 %/); expect(dato.calc).toMatch(/no permiten hablar de una tasa general/); }
  });

  it("EDIT-N1-008: septiembre 80 − 48 − 22 = 10; octubre 90 − 60 − 23 = 7; cambios +10, +12, −2, +1, −3 (miles)", () => {
    const X = by("EDIT-N1-008");
    const c = (row: string) => [cell(X, row, 0), cell(X, row, 1)];
    const [ventas, costo, bruta, gastos, operativo] = ["A.ventas", "A.costo", "A.bruta", "A.gastos", "A.operativo"].map(c);
    for (const m of [0, 1]) { expect(ventas[m] - costo[m]).toBe(bruta[m]); expect(bruta[m] - gastos[m]).toBe(operativo[m]); }
    expect(operativo).toEqual([10000, 7000]);
    const cambios = [ventas[1] - ventas[0], costo[1] - costo[0], bruta[0] - bruta[1], gastos[1] - gastos[0], operativo[0] - operativo[1]];
    expect(cambios).toEqual([10000, 12000, 2000, 1000, 3000]);
    const campos = X.nodes.find((n) => n.kind === "calcular")!;
    if (campos.kind === "calcular") expect(campos.fields.map((f) => [f.id, f.answer])).toEqual([["ventas", cambios[0]], ["costo", cambios[1]], ["bruta", cambios[2]], ["gastos", cambios[3]], ["operativo", cambios[4]]]);
    // No mezclar utilidad neta con resultado operativo.
    expect(JSON.stringify(X)).not.toMatch(/utilidad neta/i);
    const v = Object.fromEntries(X.variant.docs.flatMap((d) => d.rows).map((r) => [r.id, r.amount!]));
    const ans = answers(X, "bien") as Record<string, number>;
    expect(v["V.servicios"] - v["V.directos"]).toBe(ans.bruta);
    expect(ans.bruta - v["V.adm"]).toBe(ans.operativo);
    expect([ans.bruta, ans.operativo]).toEqual([48000, 18000]);
  });

  it("EDIT-N1-010: ninguna ruta defendible declara enviado un pedido sin evento de entrega", () => {
    const X = by("EDIT-N1-010");
    const d = decisions(X).find((n) => n.id === "salio")!;
    expect(d.options.filter((o) => o.tipo === "defendible").map((o) => o.id)).toEqual(["registro"]);
    for (const o of decisions(X).flatMap((n) => n.options)) if (/^S[ií] sali[oó]/.test(o.text)) expect(o.tipo).toBe("concepto_erroneo");
    // El registro del pedido no trae guía ni entrega al transportista.
    expect(X.docs[0].rows.some((r) => /gu[ií]a generada|entregado al transportista/i.test(r.label + (r.cells ?? []).join(" ")))).toBe(false);
  });

  it("EDIT-N1-011: 18 + 14 + 12 = 44 entrevistas, nunca expresadas como porcentaje", () => {
    const X = by("EDIT-N1-011");
    const n = ["A.oficinas", "A.familias", "A.deportistas"].map((id) => Number(rowsOf(X.docs).find((r) => r.id === id)!.label.match(/^\d+/)![0]));
    expect(n).toEqual([18, 14, 12]);
    expect(n.reduce((a, b) => a + b, 0)).toBe(44);
    expect(JSON.stringify(X)).not.toMatch(/\d\s?%|por ciento/);
  });

  it("EDIT-N1-012: 40 + 35 + 25 = 100; ocultar la relación nunca es defendible y hay más de una vía responsable", () => {
    const X = by("EDIT-N1-012");
    expect(cell(X, "A.precio") + cell(X, "A.plazo") + cell(X, "A.calidad")).toBe(100);
    const inicial = decisions(X).find((n) => n.id === "inicial")!;
    expect(inicial.options.find((o) => o.id === "callar")!.tipo).toBe("concepto_erroneo");
    expect(inicial.options.filter((o) => o.tipo === "defendible").length).toBeGreaterThanOrEqual(2);
    // La política es ficticia: los documentos, los mensajes, las rutas y el concepto no hablan de leyes ni de delitos.
    // (Los objetivos y la referencia de la variante sí piden, con esas palabras, no suponer ilegalidad.)
    expect(JSON.stringify([X.docs, X.nodes, X.theory, X.variant.docs, X.variant.setting, X.variant.question])).not.toMatch(/delito|ilegal|la ley\b/i);
  });

  // ─── Lote 03: identidades que lista QA_Y_PRUEBAS.md del paquete 1.2.

  it("EDIT-N1-013: 40 − 28 = 12; 5 + 4 + 3 = 12; 35 de 40 es 87.5 %; ninguna pareja cabe en $30,000 y las tres propuestas son defendibles", () => {
    const X = by("EDIT-N1-013");
    expect(cell(X, "A.terminadas") - cell(X, "A.puntuales")).toBe(cell(X, "A.tarde"));
    expect(cell(X, "A.tarde")).toBe(12);
    expect(5 + 4 + 3).toBe(12);
    expect((35 / 40) * 100).toBe(87.5);
    const costo = ["B.a", "B.b", "B.c"].map((id) => cell(X, id));
    expect(costo).toEqual([18000, 24000, 23000]);
    for (const c of costo) expect(c).toBeLessThanOrEqual(30000);
    expect([costo[0] + costo[1], costo[0] + costo[2], costo[1] + costo[2]]).toEqual([42000, 41000, 47000]);
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(costo[i] + costo[j]).toBeGreaterThan(30000);
    const prioridad = decisions(X).find((n) => n.id === "prioridad")!;
    expect(prioridad.options.filter((o) => o.tipo === "defendible").map((o) => o.id)).toEqual(["a", "b", "c"]);
    expect(prioridad.options.find((o) => o.id === "repartir")!.tipo).toBe("concepto_erroneo");
    // Quien elige las herramientas no recibe la pregunta de Luis por las herramientas.
    expect(prioridad.options.find((o) => o.id === "c")!.next).toBe("renuncia_c");
    // Variante: 8 + 6 + 4 = 18 faltas con causa; la pareja más barata (7,000 + 9,000) no cabe en 12,000.
    const v = (id: string) => num(X.variant.docs.flatMap((d) => d.rows).find((r) => r.id === id)!.cells![0].replace("$", ""));
    expect(v("V.avisos") + v("V.transporte") + v("V.instructor")).toBe(v("V.faltaron"));
    expect(v("W.recordatorios") + v("W.reemplazos")).toBe((answers(X, "bien") as Record<string, number>).pareja);
    expect(v("W.recordatorios") + v("W.reemplazos")).toBeGreaterThan(12000);
  });

  it("EDIT-N1-015: 39 + 9 = 48 y 4 + 5 = 9; la causa sigue sin confirmar y ninguna ruta defendible la afirma", () => {
    const X = by("EDIT-N1-015");
    expect(cell(X, "A.atiempo") + cell(X, "A.tarde")).toBe(cell(X, "A.prometidos"));
    expect(cell(X, "A.prometidos")).toBe(48);
    expect(4 + 5).toBe(9);
    expect(rowsOf(X.docs).find((r) => r.id === "A.causa")!.cells![0]).toBe("No confirmada");
    for (const o of decisions(X).flatMap((n) => n.options)) if (/por culpa de|la causa está en/i.test(o.text)) expect(o.tipo).toBe("concepto_erroneo");
    // Ordenar las tres tarjetas no se califica de forma estricta.
    const orden = X.nodes.find((n) => n.kind === "ordenar")!;
    if (orden.kind === "ordenar") expect(orden.strict).toBe(false);
    // Variante: 24 − 19 = 5, y el registro no muestra el 5.
    const v = (id: string) => Number(X.variant.docs[0].rows.find((r) => r.id === id)!.cells![0]);
    expect(v("V.reservas") - v("V.confirmadas")).toBe((answers(X, "bien") as Record<string, number>).pendientes);
    expect(19 + 5).toBe(24);
  });

  it("EDIT-N1-016: 72/80 = 90 %, 85/100 = 85 %, 4/80 = 5 %, 3/100 = 3 %, 2 pedidos por hora, 100 − 85 = 15 = 11 + 4; solo la puntualidad es defendible", () => {
    const X = by("EDIT-N1-016");
    const c = (row: string) => [cell(X, row, 0), cell(X, row, 1)];
    const [entregados, atiempo, defecto, horas] = ["A.entregados", "A.atiempo", "A.defecto", "A.horas"].map(c);
    const pct = (a: number, b: number) => Math.round((a / b) * 1e6) / 1e4;
    expect([pct(atiempo[0], entregados[0]), pct(atiempo[1], entregados[1])]).toEqual([90, 85]);
    expect([pct(defecto[0], entregados[0]), pct(defecto[1], entregados[1])]).toEqual([5, 3]);
    expect([entregados[0] / horas[0], entregados[1] / horas[1]]).toEqual([2, 2]);
    expect(entregados[1] - atiempo[1]).toBe(15);
    expect(11 + 4).toBe(15);
    const campos = X.nodes.find((n) => n.kind === "calcular")!;
    if (campos.kind === "calcular") expect(campos.fields.map((f) => f.answer)).toEqual([90, 85, 5, 3, 2, 2]);
    const indicador = decisions(X).find((n) => n.id === "indicador")!;
    expect(indicador.options.filter((o) => o.tipo === "defendible").map((o) => o.id)).toEqual(["puntualidad"]);
    // 11 de 15 por la tarde no prueba el motivo: atribuirlo a alguien nunca es defendible.
    expect(decisions(X).find((n) => n.id === "lectura")!.options.find((o) => o.id === "conductor")!.tipo).toBe("concepto_erroneo");
    // Variante: 36/40 = 90 %, 41/50 = 82 %, 2/40 = 5 %, 3/50 = 6 %.
    const v = (id: string) => X.variant.docs[0].rows.find((r) => r.id === id)!.cells!.map(Number);
    const [citas, tiempo, errores] = ["V.citas", "V.atiempo", "V.errores"].map(v);
    expect([pct(tiempo[0], citas[0]), pct(tiempo[1], citas[1])]).toEqual([90, 82]);
    expect([pct(errores[0], citas[0]), pct(errores[1], citas[1])]).toEqual([5, 6]);
    const ans = answers(X, "bien") as Record<string, number>;
    expect([ans.punt_b, ans.err_b]).toEqual([82, 6]);
  });

  it("EDIT-N1-017: 190 − 120 = 70 y 170 − 120 = 50; variante 1,200 − 800 = 400; la diferencia nunca se presenta como utilidad neta", () => {
    const X = by("EDIT-N1-017");
    const precio = [cell(X, "A.precio", 0), cell(X, "A.precio", 1)];
    const costo = cell(X, "A.costo", 0);
    expect([precio[0] - costo, precio[1] - costo, precio[0] - precio[1]]).toEqual([70, 50, 20]);
    const campos = X.nodes.find((n) => n.kind === "calcular")!;
    if (campos.kind === "calcular") expect(campos.fields.map((f) => f.answer)).toEqual([70, 50]);
    const etiquetas = X.nodes.find((n) => n.id === "etiquetas")!;
    if (etiquetas.kind === "clasificar") {
      expect(etiquetas.items.find((i) => i.id === "c70")!.group).toBe("diferencia");
      expect(etiquetas.items.some((i) => list(i.group).includes("neta"))).toBe(false);
    }
    // Hablar mal del competidor sin evidencia nunca es defendible.
    expect(decisions(X).find((n) => n.id === "cliente1")!.options.find((o) => o.id === "malo")!.tipo).toBe("concepto_erroneo");
    const v = (id: string, col: number) => num(X.variant.docs[0].rows.find((r) => r.id === id)!.cells![col].replace("$", ""));
    expect(v("V.precio", 0) - v("V.costos", 0)).toBe((answers(X, "bien") as Record<string, number>).diferencia);
    expect(v("V.precio", 0) - v("V.costos", 0)).toBe(400);
    expect(v("V.precio", 0) - v("V.precio", 1)).toBe(150);
  });

  it("EDIT-N1-018: la factura L-208 por $3,600 solo ilustra; nada afirma que hubo perjuicio ni mala intención, y acusar nunca es defendible", () => {
    const X = by("EDIT-N1-018");
    expect(rowsOf(X.docs).find((r) => r.id === "B.factura")!.cells![0]).toBe("L-208 · $3,600");
    const l208 = decisions(X).find((n) => n.id === "l208")!;
    expect(l208.options.filter((o) => o.tipo === "defendible").map((o) => o.id)).toEqual(["verificar"]);
    expect(decisions(X).find((n) => n.id === "entrega")!.options.find((o) => o.id === "acusar")!.tipo).toBe("concepto_erroneo");
    // «Control» no significa un programa caro ni un auditor permanente.
    const controles = X.nodes.find((n) => n.id === "controles")!;
    if (controles.kind === "clasificar") expect(controles.items.filter((i) => i.group === "innecesario").map((i) => i.id).sort()).toEqual(["auditor", "sistema"]);
    // Los documentos, los mensajes, las rutas defendibles y la variante no hablan de fraude, robo ni delito, ni citan leyes concretas.
    const visible = JSON.stringify([X.docs, X.nodes.filter((n) => n.kind !== "decision"), decisions(X).flatMap((n) => n.options.filter((o) => o.tipo === "defendible")), X.variant.docs, X.variant.setting, X.variant.question]);
    // «corroborado» contiene «robo»: por eso la palabra se busca completa.
    expect(visible).not.toMatch(/fraude|(?<![a-záéíóúñ])rob[oó](?![a-záéíóúñ])|delito|ilegal|falsa|deshonest|mala intenci[oó]n/i);
    expect(JSON.stringify(X)).not.toMatch(/fraude|delito|ilegal|fiscal/i);
    expect(JSON.stringify(X)).not.toMatch(/\bSAT\b/);
    // En la variante, afirmar que el encargado tomó dinero se clasifica como acusación sin evidencia.
    const riesgo = X.variant.tasks.find((t) => t.id === "riesgo")!;
    if (riesgo.kind === "clasificar") expect(riesgo.items.filter((i) => i.group === "acusa").map((i) => i.id).sort()).toEqual(["quedo", "seguro"]);
  });
});

// ───────────────────────────────────────────── guardar y continuar

describe.each(CADA)("%s · guardar y continuar", (_id, x) => {
  it("un recorrido guardado en cualquier paso, de quien sabe o de quien empieza, se retoma donde iba", () => {
    for (const p of [EXPERTO, NOVATO]) {
      const log: Recorrido[] = [];
      const done = play(x, p, log);
      expect(log.length).toBeGreaterThan(x.nodes.length - 3);
      let r = advance(x, done, { t: "comprobar" });
      log.push(r);
      for (const [task, value] of Object.entries(answers(x, "bien", "Texto."))) { r = advance(x, r, { t: "responder", task, value }); log.push(r); }
      log.push(advance(x, r, { t: "entregar" }));
      expect(log[log.length - 1].phase).toBe("fin");
      for (const run of log) expect(readRun(x, JSON.parse(JSON.stringify(run)))).toEqual(run);
    }
  });

  it("el resultado guardado se vuelve a calcular: no se puede alterar a mano", () => {
    const fin = deliver(x, play(x, EXPERTO), answers(x, "mal"));
    expect(fin.result!.score).toBe(0);
    const raw = JSON.parse(JSON.stringify(fin));
    raw.result = { items: [], score: 100, auto: 100, pending: 0, pass: true };
    const back = readRun(x, raw).result!;
    expect(back.score).toBe(0);
    expect(back.pass).toBe(false);
  });

  it("algo guardado que no corresponde (otra versión, otra experiencia, datos rotos) empieza de nuevo", () => {
    const fresh = newRun(x);
    const other = EXPERIENCIAS.find((y) => y !== x)!;
    for (const raw of [null, 7, "x", {}, { ...fresh, ver: 99 }, { ...fresh, exp: "otra" }, newRun(other), { ...fresh, v: 3 }, { ...fresh, at: "no_existe" }, { ...fresh, trail: [] }, { ...fresh, trail: [{ node: "cierre" }] }, { ...fresh, phase: "x" }]) {
      expect(readRun(x, raw)).toEqual(fresh);
    }
  });
});

describe("recorridos guardados con el formato anterior", () => {
  it("se conservan: la respuesta escrita única pasa a su nodo", () => {
    const X = PILOTO;
    const done = play(X, { ...EXPERTO, escribe: "La utilidad cuenta lo entregado." });
    const { replies: _r, ...rest } = done;
    void _r;
    const v1 = (reply?: string | null) => JSON.parse(JSON.stringify({ ...rest, v: 1, ...(reply === undefined ? {} : { reply }) }));
    const back = readRun(X, v1("La utilidad cuenta lo entregado."));
    expect(back.v).toBe(2);
    expect(back.replies).toEqual({ respuesta: { texto: "La utilidad cuenta lo entregado." } });
    expect(back).toEqual(done);
    expect("reply" in back).toBe(false);
    expect(readRun(X, v1(null)).replies).toEqual({ respuesta: null });
    expect(readRun(X, v1()).replies).toEqual({});
  });
});

// ───────────────────────────────────────────── no acredita

describe("las experiencias no acreditan ni tocan la partida", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
  const imports = (p: string) => [...read(p).matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
  const SCREENS = ["src/components/ceo/ExperienciaPiloto.tsx", "src/app/ceo/piloto/page.tsx", "src/app/ceo/piloto/[slug]/page.tsx"];

  it("la política de evidencia es «no registra» y ninguna está publicada ni revisada", () => {
    for (const x of EXPERIENCIAS) { expect(x.evidencePolicy).toBe("no_registra"); expect(x.qa.publishedAt).toBeNull(); expect(x.qa.editorialReviewedAt).toBeNull(); expect(x.provenance).toBe("creacion_original"); }
  });

  it("el motor y el contenido no conocen el registro de evidencias ni el cálculo de dominio", () => {
    const files = readdirSync(join(process.cwd(), DIR)).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    expect(files.filter((f) => f.startsWith("n1-"))).toHaveLength(EXPERIENCIAS.length);
    for (const f of files) for (const i of imports(`${DIR}/${f}`)) expect(i, `${f} importa ${i}`).not.toMatch(/evidencias|dominio|clasificacion|engine|mastery|store|supabase/);
  });

  it("las pantallas no usan la partida, no llaman a ningún servicio y no mandan eventos", () => {
    for (const p of SCREENS) {
      for (const i of imports(p)) expect(i, `${p} importa ${i}`).not.toMatch(/CeoProvider|evidencias|dominio|events|engine|mastery|supabase/);
      expect(read(p)).not.toMatch(/useCeo|fetch\(|track\(|sendBeacon|XMLHttpRequest/);
    }
    const src = read(SCREENS[0]);
    // Lo único que guarda es el recorrido, en este navegador, con su propia clave.
    expect(src.match(/localStorage\.(setItem|getItem)/g)).toHaveLength(2);
    expect(src).toContain("metis:piloto:");
    expect(src).toContain("No cuenta para tu avance, tu nivel ni tu perfil.");
    expect(read(SCREENS[1])).not.toMatch(/localStorage/);
  });

  it("no están en el menú y los buscadores no las indexan", () => {
    const shell = read("src/components/ceo/CeoShell.tsx");
    const nav = shell.slice(shell.indexOf("const NAV"), shell.indexOf("export function CeoShell"));
    expect(nav).not.toContain("piloto");
    for (const p of SCREENS.slice(1)) expect(read(p)).toMatch(/index:\s*false/);
  });
});

// ───────────────────────────────────────────── documento

describe("documento 06 · Repositorio Académico", () => {
  const md = repositorioMarkdown();

  it("trae la correspondencia completa, las fuentes, cada experiencia y el estado por separado", () => {
    for (const [e, s] of ATLAS) { expect(md).toContain(`| ${e} |`); expect(md).toContain(`\`${s}\``); }
    for (const k of Object.keys(FUENTES)) expect(md).toContain(k);
    for (const i of LOTES.flatMap((l) => l.items)) expect(md).toContain(i.editorialId);
    for (const x of EXPERIENCIAS) expect(md).toContain(x.title);
    for (const h of ["Importado", "Probado", "Revisado por una persona", "Publicado", "Validado con usuarios"]) expect(md).toContain(h);
  });

  it("no usa frases prohibidas ni símbolos", () => {
    expect(md).not.toMatch(/de cero a ceo|\blibro\b/i);
    expect(md).not.toMatch(/pr[oó]ximamente|en preparaci[oó]n|pr[oó]xima versi[oó]n|llegan? pronto|m[aá]s adelante:|todav[ií]a no est[aá] disponible|coming soon/i);
    expect(md).not.toMatch(/[\p{Extended_Pictographic}\u2605\u2606\u2713\u2717]/u);
  });

  it.runIf(!!process.env.REPOSITORIO_DOC)("escribe docs/metis2/06-repositorio-academico.md", () => {
    writeFileSync(DOC, md);
  });

  it.runIf(!process.env.REPOSITORIO_DOC)("docs/metis2/06-repositorio-academico.md está al día", () => {
    expect(existsSync(DOC)).toBe(true);
    expect(readFileSync(DOC, "utf8")).toBe(md);
  });
});
