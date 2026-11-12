/**
 * MÊTIS 2.0 · Repositorio Académico · pruebas del piloto.
 *
 * Qué se comprueba:
 *  - la correspondencia de identificadores editoriales con el catálogo (52 de 52);
 *  - que la experiencia cumple el contrato (no es un cuestionario, cifras recalculables, opciones de largo parecido);
 *  - tres recorridos (quien empieza, quien sabe, quien responde al azar), más quien elige siempre la opción más larga o la más corta;
 *  - que la variante no da pistas y que nadie la pasa sin calcular;
 *  - que nada de esto registra evidencia ni toca la partida.
 *
 * Para regenerar el documento:
 *   REPOSITORIO_DOC=1 npx vitest run src/lib/ceo/metis2/experiencias/experiencias.test.ts
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ACADEMY_IDS, SKILLS, skillById, skillsAt } from "../academias";
import {
  ATLAS, EXPERIENCIAS, FUENTES, LOTE_N1, MAX_REPLY, OPTION_LENGTH_RATIO, advance, atlasSources, checkExperiencia, editorialOfSkill, experienciaBySlug,
  newRun, nextOf, nodeOf, originCount, readRun, recompute, routeOf, rowsOf, scoreVariant, sharedAmounts, skillOfEditorial, stepOf,
  type Accion, type Experiencia, type NodoDecision, type Opcion, type Recorrido,
} from "./index";
import { repositorioMarkdown } from "./repositorio-doc";

const X = EXPERIENCIAS[0];
const DIR = "src/lib/ceo/metis2/experiencias";
const DOC = join(process.cwd(), "..", "docs", "metis2", "06-repositorio-academico.md");

/** Generador con semilla, para que «al azar» sea repetible. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

type Elige = (d: NodoDecision) => Opcion;
type Senala = (rows: string[], correct: string, tried: string[]) => string;

/** Recorre la práctica completa con una política de decisión y otra para señalar. */
function play(x: Experiencia, elige: Elige, senala: Senala, reply: string | null = "La utilidad cuenta lo entregado; el efectivo, lo cobrado."): Recorrido {
  let run = newRun(x);
  for (let i = 0; i < 60; i++) {
    const n = nodeOf(x, run.at)!;
    const s = stepOf(run);
    let a: Accion = { t: "avanzar" };
    if (n.kind === "cierre") return run;
    if (n.kind === "decision" && !s.choice) a = { t: "elegir", option: elige(n).id };
    else if (n.kind === "senalar" && !s.solved) a = { t: "senalar", row: senala(rowsOf(x.docs.filter((d) => n.docs.includes(d.id))).map((r) => r.id), n.correct, s.misses ?? []) };
    else if (n.kind === "redactar" && run.reply === undefined) a = { t: "redactar", text: reply };
    const after = advance(x, run, a);
    expect(after, `la acción ${a.t} no avanzó en ${n.id}`).not.toBe(run);
    run = after;
  }
  throw new Error("el recorrido no termina");
}

const experto: Elige = (d) => d.options.find((o) => o.tipo === "defendible")!;
const novato: Elige = (d) => d.options.find((o) => o.tipo === "concepto_erroneo") ?? d.options[0];
const masLarga: Elige = (d) => [...d.options].sort((a, b) => b.text.length - a.text.length)[0];
const masCorta: Elige = (d) => [...d.options].sort((a, b) => a.text.length - b.text.length)[0];
const sabe: Senala = (_r, correct) => correct;
const tantea: Senala = (rows, _c, tried) => rows.find((r) => !tried.includes(r))!;

const decisions = (x: Experiencia) => x.nodes.filter((n): n is NodoDecision => n.kind === "decision");
const defendibles = (x: Experiencia, run: Recorrido) => routeOf(x, run).filter((r) => r.option.tipo === "defendible").length;

function variant(x: Experiencia, run: Recorrido, answers: Record<string, number>): Recorrido {
  let r = advance(x, run, { t: "comprobar" });
  for (const [task, value] of Object.entries(answers)) r = advance(x, r, { t: "responder", task, value });
  return advance(x, r, { t: "entregar" });
}
const right = (x: Experiencia) => Object.fromEntries(x.variant.tasks.map((t) => [t.id, t.answer]));

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
    expect(Object.keys(FUENTES)).toHaveLength(12);
    for (const [, , src] of ATLAS) for (const f of src) expect(FUENTES[f], f).toBeDefined();
    for (const f of Object.values(FUENTES)) { expect(f.url).toMatch(/^https:\/\//); expect(f.seen.length).toBeGreaterThan(20); }
  });

  it("el lote piloto: seis experiencias, una por academia, con habilidades de nivel 1 del catálogo", () => {
    expect(LOTE_N1).toHaveLength(6);
    expect(new Set(LOTE_N1.map((l) => skillById(l.primary)!.academy)).size).toBe(6);
    const n1 = skillsAt(1).map((s) => s.id);
    expect(n1).toHaveLength(24);
    for (const l of LOTE_N1) {
      expect(n1).toContain(l.primary);
      for (const s of l.secondary) expect(skillById(s), s).toBeDefined();
      for (const f of [...l.sources, l.manifestSource]) expect(FUENTES[f], f).toBeDefined();
      expect(l.rubric.split("/").reduce((a, b) => a + Number(b), 0)).toBe(100);
    }
  });

  it("deja a la vista dónde el Atlas y la experiencia no citan las mismas fuentes", () => {
    const differ = LOTE_N1.filter((l) => [...l.sources].sort().join() !== [...atlasSources(l.primary)].sort().join()).map((l) => l.editorialId);
    expect(differ).toEqual(["EDIT-N1-002", "EDIT-N1-003", "EDIT-N1-004", "EDIT-N1-005", "EDIT-N1-006"]);
  });
});

// ───────────────────────────────────────────── contrato

describe("la experiencia piloto cumple el contrato", () => {
  it("pasa la revisión sin errores y deja avisos para la revisión editorial", () => {
    const r = checkExperiencia(X);
    expect(r.errors).toEqual([]);
    expect(r.warnings.some((w) => w.includes("repite cifras"))).toBe(true);
    expect(r.warnings).toContain("sin revisión editorial humana");
  });

  it("corresponde a EDIT-N1-002 y a las habilidades del catálogo", () => {
    expect(X.editorialId).toBe("EDIT-N1-002");
    const lote = LOTE_N1.find((l) => l.editorialId === X.editorialId)!;
    expect(X.skills.primary).toBe(lote.primary);
    expect(X.skills.secondary).toEqual(lote.secondary);
    expect(X.sourceIds).toEqual(lote.sources);
    expect(X.title).toBe(lote.title);
    expect(experienciaBySlug(X.slug)).toBe(X);
  });

  it("no es un cuestionario: mensaje, documentos, dos decisiones con ramas, señalar, dato nuevo, respuesta escrita y cierre", () => {
    const kinds = new Set(X.nodes.map((n) => n.kind));
    for (const k of ["mensaje", "explorar", "decision", "senalar", "dato", "redactar", "cierre"]) expect(kinds.has(k as never), k).toBe(true);
    expect(decisions(X)).toHaveLength(2);
    // Hay rama: la primera decisión no lleva siempre al mismo lugar.
    expect(new Set(decisions(X)[0].options.map((o) => o.next)).size).toBeGreaterThan(1);
    // Cada ruta tiene su propia consecuencia y su propia retroalimentación.
    for (const d of decisions(X)) {
      expect(new Set(d.options.map((o) => o.feedback)).size).toBe(d.options.length);
      expect(new Set(d.options.map((o) => o.consequence.map((l) => l.text).join())).size).toBe(d.options.length);
    }
    // La variante no tiene opciones: se calcula y se escribe.
    expect(X.variant.tasks.every((t) => Number.isInteger(t.answer))).toBe(true);
  });

  it("todas las cifras se pueden recalcular", () => {
    const [a, b] = X.docs;
    expect(recompute(a, "A.utilidad")).toBe(15000);
    expect(100000 - 60000 - 25000).toBe(15000);
    expect(recompute(b, "B.final")).toBe(5000);
    expect(55000 - 50000 - 25000).toBe(-20000);
    expect(25000 - 20000).toBe(5000);
    expect(12000 - 5000).toBe(7000);
    // Lo vendido y no cobrado es justo lo que el dato nuevo dice que se cobra después.
    expect(100000 - 55000).toBe(45000);
    // Variante
    const v = Object.fromEntries(X.variant.docs[0].rows.map((r) => [r.id, r.amount]));
    const ans = Object.fromEntries(X.variant.tasks.map((t) => [t.id, t.answer]));
    expect(v["V.ingresos"] - v["V.costos"] - v["V.gastos"]).toBe(ans.utilidad);
    expect(v["V.inicial"] + v["V.cobros"] - v["V.pagos_costos"] - v["V.pagos_gastos"]).toBe(ans.saldo);
    expect(v["V.ingresos"] - v["V.cobros"]).toBe(ans.por_cobrar);
    expect(ans).toEqual({ por_cobrar: 45000, utilidad: 17000, saldo: 5000 });
  });

  it("los cálculos que se muestran dan lo que dicen", () => {
    const lines = [...X.calculations, ...X.variant.tasks.map((t) => t.calc), ...rowsOf(X.docs).flatMap((r) => (r.nota && r.nota.text.includes("=") ? [r.nota.text] : []))];
    expect(lines.length).toBeGreaterThanOrEqual(9);
    for (const l of lines) {
      // Se toma la última igualdad: «a − b − c = resultado». Las cifras pueden venir entre palabras.
      const parts = l.split("=");
      const expr = parts[parts.length - 2].replace(/,/g, "");
      const nums = expr.match(/\d+/g)!.map(Number);
      const signs = expr.match(/[−+]/g) ?? [];
      expect(signs.length, l).toBe(nums.length - 1);
      const value = nums.reduce((s, n, i) => (i === 0 ? n : s + (signs[i - 1] === "−" ? -n : n)), 0);
      const result = Number(parts[parts.length - 1].replace(/−/g, "-").replace(/,/g, "").match(/-?\d+/)![0]);
      expect(value, l).toBe(result);
    }
  });

  it("las opciones tienen largo parecido y la más larga no es la defendible", () => {
    for (const d of decisions(X)) {
      const len = d.options.map((o) => o.text.length);
      expect(Math.max(...len) / Math.min(...len)).toBeLessThanOrEqual(OPTION_LENGTH_RATIO);
      expect(masLarga(d).tipo).not.toBe("defendible");
    }
    // La ruta defendible no está siempre en la misma posición.
    expect(new Set(decisions(X).map((d) => d.options.findIndex((o) => o.tipo === "defendible"))).size).toBe(2);
  });

  it("la revisión detecta una experiencia mal armada", () => {
    const bad: Experiencia = JSON.parse(JSON.stringify(X));
    bad.docs[0].rows[3].amount = 16000;
    bad.variant.tasks[0].weight = 30;
    bad.skills.primary = "fin.no_existe";
    (bad as { evidencePolicy: string }).evidencePolicy = "registra";
    (bad.nodes[2] as NodoDecision).options[0].text += " Además conviene revisar con calma cada uno de los renglones de los dos documentos.";
    const e = checkExperiencia(bad).errors.join(" | ");
    expect(e).toContain("no sale de sus renglones");
    expect(e).toContain("no suman 100");
    expect(e).toContain("no está en el catálogo");
    expect(e).toContain("no puede registrar evidencia");
    expect(e).toContain("largo parecido");
  });

  it("sabe qué viene del paquete y qué se redactó al convertir", () => {
    const o = originCount(X);
    expect(o.fuente).toBeGreaterThanOrEqual(6);
    expect(o.adaptado).toBeGreaterThan(0);
    expect(o.conversion).toBeGreaterThan(0);
    expect(X.conversionNotes.length).toBeGreaterThanOrEqual(5);
  });
});

// ───────────────────────────────────────────── recorridos

describe("recorridos de la práctica", () => {
  it("quien sabe: dos rutas defendibles, sin comprobación extra", () => {
    const run = play(X, experto, sabe);
    expect(run.trail.map((p) => p.node)).toEqual(["mensaje", "explorar", "diagnostico", "dato", "promesa", "respuesta", "cierre"]);
    expect(defendibles(X, run)).toBe(2);
  });

  it("quien empieza: cae en la confusión, pasa por la comprobación sobre los documentos y termina", () => {
    const run = play(X, novato, tantea);
    const nodes = run.trail.map((p) => p.node);
    expect(nodes).toContain("comprobar");
    expect(nodes[nodes.length - 1]).toBe("cierre");
    expect(defendibles(X, run)).toBe(0);
    const check = run.trail.find((p) => p.node === "comprobar")!;
    expect(check.solved).toBe(true);
    expect((check.misses ?? []).length).toBeGreaterThan(0);
    // Cada error al señalar tiene su explicación.
    const n = nodeOf(X, "comprobar")!;
    if (n.kind === "senalar") for (const m of check.misses!) expect((n.wrong[m] ?? n.fallback).length).toBeGreaterThan(20);
  });

  it("al azar: siempre termina, y elegir al azar no acierta las dos decisiones de forma sistemática", () => {
    let both = 0;
    const N = 600;
    for (let i = 0; i < N; i++) {
      const r = rng(i + 1);
      const run = play(X, (d) => d.options[Math.floor(r() * d.options.length)], (rows, _c, tried) => { const left = rows.filter((k) => !tried.includes(k)); return left[Math.floor(r() * left.length)]; });
      expect(nodeOf(X, run.at)!.kind).toBe("cierre");
      if (defendibles(X, run) === 2) both++;
    }
    // Con tres rutas por decisión se espera cerca de 1 de cada 9.
    expect(both / N).toBeLessThan(0.2);
    expect(both).toBeGreaterThan(0);
  });

  it("elegir siempre la opción más larga, o siempre la más corta, no lleva por las rutas defendibles", () => {
    expect(defendibles(X, play(X, masLarga, tantea))).toBe(0);
    expect(defendibles(X, play(X, masCorta, tantea))).toBeLessThan(2);
  });

  it("todas las combinaciones de rutas (3 × 3) llegan al cierre y pasan por el dato nuevo", () => {
    const [d1, d2] = decisions(X);
    for (const a of d1.options) for (const b of d2.options) {
      const run = play(X, (d) => (d.id === d1.id ? a : b), tantea);
      const nodes = run.trail.map((p) => p.node);
      expect(nodes).toContain("dato");
      expect(nodes).toContain("respuesta");
      expect(nodes.includes("comprobar")).toBe(a.tipo !== "defendible");
    }
  });

  it("no se avanza sin decidir, y la decisión no se cambia", () => {
    let run = advance(X, advance(X, newRun(X), { t: "avanzar" }), { t: "avanzar" });
    expect(run.at).toBe("diagnostico");
    expect(nextOf(X, run)).toBeNull();
    expect(advance(X, run, { t: "avanzar" })).toBe(run);
    expect(advance(X, run, { t: "elegir", option: "no_existe" })).toBe(run);
    run = advance(X, run, { t: "elegir", option: "contador" });
    expect(advance(X, run, { t: "elegir", option: "cobranza" })).toBe(run);
    expect(nextOf(X, run)).toBe("comprobar");
  });

  it("la respuesta escrita es opcional, se guarda y no premia el largo", () => {
    const corta = play(X, experto, sabe, "No es lo mismo.");
    const larga = play(X, experto, sabe, "x".repeat(2000));
    const sin = play(X, experto, sabe, null);
    const vacia = play(X, experto, sabe, "   ");
    expect(corta.reply).toBe("No es lo mismo.");
    expect(larga.reply).toHaveLength(MAX_REPLY);
    expect(sin.reply).toBeNull();
    expect(vacia.reply).toBeNull();
    // El recorrido y el resultado de la variante son los mismos, se escriba mucho, poco o nada.
    for (const r of [corta, larga, sin]) expect(variant(X, r, right(X)).result!.score).toBe(100);
  });

  it("consultar documentos y abrir el concepto queda anotado, sin cambiar el recorrido", () => {
    let run = newRun(X);
    run = advance(X, run, { t: "abrir", row: "A.ventas" });
    run = advance(X, run, { t: "abrir", row: "A.ventas" });
    run = advance(X, run, { t: "abrir", row: "no.existe" });
    run = advance(X, run, { t: "teoria" });
    expect(run.opened).toEqual(["A.ventas"]);
    expect(run.theory).toBe(1);
    expect(run.at).toBe("mensaje");
  });
});

// ───────────────────────────────────────────── variante

describe("variante independiente (otra situación, sin apoyo)", () => {
  const done = play(X, experto, sabe);

  it("es otra empresa, sin explicaciones, sin opciones y sin la respuesta a la vista", () => {
    const v = X.variant;
    const text = [v.title, v.setting, v.question, ...v.docs.flatMap((d) => [d.title, ...d.rows.map((r) => r.label)]), ...v.tasks.map((t) => t.prompt)].join(" ");
    expect(text).not.toMatch(/Marta|imprenta|nómina|contador/i);
    expect(v.docs.flatMap((d) => d.rows).every((r) => !r.nota && !r.suma)).toBe(true);
    const shown = v.docs.flatMap((d) => d.rows).map((r) => r.amount);
    for (const t of v.tasks) expect(shown).not.toContain(t.answer);
    // Ninguna pregunta dice cómo se calcula.
    for (const t of v.tasks) expect(t.prompt).not.toMatch(/[−+=]|menos|rest[ae]|sum[ae]/i);
  });

  it("quien calcula bien obtiene 100; cada criterio pesa lo que dice la rúbrica del paquete (35 / 30 / 35)", () => {
    const r = variant(X, done, right(X)).result!;
    expect(r.score).toBe(100);
    expect(r.pass).toBe(true);
    expect(X.variant.tasks.map((t) => t.weight)).toEqual([35, 30, 35]);
    expect(scoreVariant(X.variant, { ...right(X), utilidad: 1 }).score).toBe(70);
    expect(scoreVariant(X.variant, { ...right(X), saldo: 1 }).score).toBe(65);
    expect(scoreVariant(X.variant, { ...right(X), saldo: 1 }).pass).toBe(false);
  });

  it("quien confunde utilidad con caja no pasa", () => {
    // Cree que el saldo es la utilidad, y que la utilidad es lo cobrado menos lo pagado.
    const confundido = { por_cobrar: 80000, utilidad: 35000 - 30000 - 25000 + 25000, saldo: 17000 };
    const r = variant(X, done, confundido).result!;
    expect(r.score).toBe(0);
    expect(r.pass).toBe(false);
  });

  it("nadie pasa sin calcular: ni al azar, ni copiando cifras del documento, ni repitiendo las de la práctica", () => {
    const shown = X.variant.docs.flatMap((d) => d.rows).map((r) => r.amount);
    let pass = 0;
    for (let i = 0; i < 2000; i++) {
      const r = rng(i + 7);
      const ans = Object.fromEntries(X.variant.tasks.map((t) => [t.id, i % 2 ? shown[Math.floor(r() * shown.length)] : Math.round(r() * 100) * 1000]));
      if (scoreVariant(X.variant, ans).pass) pass++;
    }
    expect(pass / 2000).toBeLessThan(0.01);
    // Repetir las cifras de la práctica (utilidad 15,000; saldo 5,000; por cobrar 45,000) acierta dos de tres, pero no la utilidad.
    const memoria = scoreVariant(X.variant, { por_cobrar: 45000, utilidad: 15000, saldo: 5000 });
    expect(memoria.score).toBe(70);
    // Aviso para la revisión editorial: con la regla provisional de 70, eso alcanza para pasar.
    expect(memoria.pass).toBe(true);
    expect(sharedAmounts(X)).toEqual([5000, 25000, 45000]);
  });

  it("no se entrega con respuestas en blanco y no se entra a la variante antes del cierre", () => {
    let r = advance(X, done, { t: "comprobar" });
    expect(r.phase).toBe("demostrar");
    r = advance(X, r, { t: "responder", task: "utilidad", value: 17000 });
    expect(advance(X, r, { t: "entregar" })).toBe(r);
    r = advance(X, r, { t: "responder", task: "saldo", value: null });
    expect(advance(X, r, { t: "entregar" })).toBe(r);
    expect(advance(X, newRun(X), { t: "comprobar" }).phase).toBe("aprender");
    // En la variante ya no se abren notas ni el concepto.
    const before = advance(X, done, { t: "comprobar" });
    expect(advance(X, before, { t: "teoria" })).toBe(before);
    expect(advance(X, before, { t: "abrir", row: "A.utilidad" })).toBe(before);
  });
});

// ───────────────────────────────────────────── guardar y continuar

describe("guardar y continuar", () => {
  it("un recorrido guardado a la mitad se retoma donde iba", () => {
    let run = newRun(X);
    for (const a of [{ t: "avanzar" }, { t: "avanzar" }, { t: "elegir", option: "aplazar" }, { t: "avanzar" }] as Accion[]) run = advance(X, run, a);
    const back = readRun(X, JSON.parse(JSON.stringify(run)));
    expect(back).toEqual(run);
    expect(back.at).toBe("comprobar");
  });

  it("el resultado guardado se vuelve a calcular: no se puede alterar a mano", () => {
    const fin = variant(X, play(X, experto, sabe), { por_cobrar: 1, utilidad: 1, saldo: 1 });
    const raw = JSON.parse(JSON.stringify(fin));
    raw.result = { items: [], score: 100, pass: true };
    expect(readRun(X, raw).result!.score).toBe(0);
  });

  it("algo guardado que no corresponde (otra versión, datos rotos) empieza de nuevo", () => {
    const fresh = newRun(X);
    for (const raw of [null, 7, "x", {}, { ...fresh, ver: 99 }, { ...fresh, exp: "otra" }, { ...fresh, at: "no_existe" }, { ...fresh, trail: [] }, { ...fresh, trail: [{ node: "cierre" }] }, { ...fresh, phase: "x" }]) {
      expect(readRun(X, raw)).toEqual(fresh);
    }
  });
});

// ───────────────────────────────────────────── no acredita

describe("el piloto no acredita ni toca la partida", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
  const imports = (p: string) => [...read(p).matchAll(/from "([^"]+)"/g)].map((m) => m[1]);

  it("la política de evidencia es «no registra»", () => {
    for (const x of EXPERIENCIAS) { expect(x.evidencePolicy).toBe("no_registra"); expect(x.qa.publishedAt).toBeNull(); expect(x.qa.editorialReviewedAt).toBeNull(); }
  });

  it("el motor y el contenido no conocen el registro de evidencias ni el cálculo de dominio", () => {
    for (const f of ["motor.ts", "tipos.ts", "fuentes.ts", "index.ts", "n1-finanzas-utilidad-caja.ts"]) {
      for (const i of imports(`${DIR}/${f}`)) expect(i, `${f} importa ${i}`).not.toMatch(/evidencias|dominio|clasificacion|engine|mastery|store|supabase/);
    }
  });

  it("la pantalla no usa la partida, no llama a ningún servicio y no manda eventos", () => {
    const src = read("src/components/ceo/ExperienciaPiloto.tsx");
    for (const i of imports("src/components/ceo/ExperienciaPiloto.tsx")) expect(i).not.toMatch(/CeoProvider|evidencias|dominio|events|engine|mastery|supabase/);
    expect(src).not.toMatch(/useCeo|fetch\(|track\(|sendBeacon|XMLHttpRequest/);
    // Lo único que guarda es el recorrido, en este navegador, con su propia clave.
    expect(src.match(/localStorage\.(setItem|getItem)/g)).toHaveLength(2);
    expect(src).toContain("metis:piloto:");
  });

  it("no está en el menú", () => {
    const shell = read("src/components/ceo/CeoShell.tsx");
    const nav = shell.slice(shell.indexOf("const NAV"), shell.indexOf("export function CeoShell"));
    expect(nav).not.toContain("piloto");
  });
});

// ───────────────────────────────────────────── documento

describe("documento 06 · Repositorio Académico", () => {
  const md = repositorioMarkdown();

  it("trae la correspondencia completa, las fuentes y el estado por separado", () => {
    for (const [e, s] of ATLAS) { expect(md).toContain(`| ${e} |`); expect(md).toContain(`\`${s}\``); }
    for (const k of Object.keys(FUENTES)) expect(md).toContain(k);
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
