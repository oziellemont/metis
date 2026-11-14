/**
 * MÊTIS 2.0 · Integridad del piloto (directiva 2, P0).
 *
 * Qué se comprueba:
 *  - acceso: en producción solo el equipo; en Preview y desarrollo, abierto (para revisar);
 *  - sello: no se puede leer ni alterar; no vale para otra cuenta, otra pieza u otra versión;
 *  - experiencias: lo que llega al navegador no trae claves; el servidor califica; el navegador no decide puntos;
 *  - Executive Challenge: cada vista trae solo la escena y el paso actuales, sin puntos, rutas, notas ni marcas;
 *    el orden lo impone el servidor; lo respondido no se cambia; repetir una acción no suma dos veces;
 *  - las pantallas y las rutas del piloto comprueban al equipo en el servidor antes de responder.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { decideEquipo } from "../equipo";
import { EXPERIENCIAS } from "./experiencias";
import { experienciaPublica } from "./experiencias/publica";
import type { Experiencia, Respuesta, Tarea } from "./experiencias/tipos";
import { accionReto, entregarExperiencia, iniciarReto, reabrirExperiencia, type AccionCliente, type PasoServidor } from "./piloto-servidor";
import { EC_N1_002_A as R, allSteps, stepById } from "./reto";
import { retoPublico, type VistaReto } from "./reto/publica";
import type { PasoReto, Reto } from "./reto/tipos";
import { abrir, sellar } from "./sello";

const SECRET = "llave-de-prueba";
const OTRA = "otra-llave";
const NOW = "2026-11-14T10:00:00.000Z";
const list = (g: string | string[]) => (Array.isArray(g) ? g : [g]);

/** Claves que no deben aparecer en nada que llegue al navegador antes de entregar. */
const LLAVES_VARIANTE = ["answer", "calc", "group", "order", "accept", "correct", "reference", "ideas", "conversionNotes"];
const LLAVES_RETO = ["score", "nota", "critica", "tipo", "sets", "answer", "calc", "group", "order", "why", "reference", "ideas", "criteria", "points", "salvaguarda", "rectifica", "sintesis", "when", "flags", "result", "conversionNotes", "thresholds"];

function keysOf(v: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(v)) v.forEach((x) => keysOf(x, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { out.add(k); keysOf(x, out); }
  return out;
}

function bien(t: Tarea): Respuesta {
  if (t.kind === "cifra") return t.answer;
  if (t.kind === "clasificar") return Object.fromEntries(t.items.map((i) => [i.id, list(i.group)[0]]));
  if (t.kind === "ordenar") return [...t.order];
  if (t.kind === "senalar") return [...t.correct];
  return t.fields ? Object.fromEntries(t.fields.map((f) => [f.id, "Mi respuesta."])) : { texto: "Mi respuesta." };
}
const todoBien = (x: Experiencia) => Object.fromEntries(x.variant.tasks.map((t) => [t.id, bien(t)]));

// ───────────────────────────────────────────── acceso

describe("acceso al piloto", () => {
  it("en producción solo entra el equipo; sin sesión o sin ser del equipo, no", () => {
    expect(decideEquipo("production", null, false).ok).toBe(false);
    expect(decideEquipo("production", "u1", false).ok).toBe(false);
    expect(decideEquipo("production", null, true).ok).toBe(false);
    expect(decideEquipo("production", "u1", true)).toEqual({ ok: true, user: "u1" });
  });

  it("en Preview y desarrollo queda abierto para revisar", () => {
    expect(decideEquipo("preview", null, false)).toEqual({ ok: true, user: "local" });
    expect(decideEquipo("development", "u2", false)).toEqual({ ok: true, user: "u2" });
  });

  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it("cada página del piloto se arma en el servidor en cada visita y pregunta antes si quien entra es del equipo", () => {
    for (const p of ["src/app/ceo/piloto/page.tsx", "src/app/ceo/piloto/[slug]/page.tsx", "src/app/ceo/piloto/reto/[slug]/page.tsx"]) {
      const s = read(p);
      expect(s, p).toMatch(/export const dynamic = "force-dynamic"/);
      expect(s, p).toMatch(/if \(!\(await equipoServidor\(\)\)\.ok\) notFound\(\);/);
      expect(s, p).not.toMatch(/generateStaticParams/);
    }
    // Las pantallas reciben solo la versión pública.
    expect(read("src/app/ceo/piloto/[slug]/page.tsx")).toMatch(/experienciaPublica\(/);
    expect(read("src/app/ceo/piloto/reto/[slug]/page.tsx")).toMatch(/retoPublico\(/);
  });

  it("cada acción de servidor comprueba al equipo antes de hacer cualquier otra cosa", () => {
    const s = read("src/app/ceo/piloto/acciones.ts");
    expect(s.startsWith('"use server";')).toBe(true);
    const fns = [...s.matchAll(/export async function (\w+)\(.*\n([^\n]*)\n([^\n]*)/g)];
    expect(fns.map((m) => m[1]).sort()).toEqual(["abrirReto", "entregarComprobacion", "moverReto", "verEntrega"]);
    for (const m of fns) { expect(m[2].trim(), m[1]).toBe("const eq = await equipoServidor();"); expect(m[3].trim(), m[1]).toBe("if (!eq.ok) return NO;"); }
    expect(read("src/lib/ceo/equipo-servidor.ts")).toMatch(/^import "server-only";/m);
  });

  it("las pantallas no importan el contenido completo ni la lógica que califica", () => {
    for (const p of ["src/components/ceo/ExperienciaPiloto.tsx", "src/components/ceo/RetoPiloto.tsx"]) {
      const s = read(p);
      expect(s, p).not.toMatch(/from "@\/lib\/ceo\/metis2\/experiencias"|from "@\/lib\/ceo\/metis2\/reto"|ec-n1-002-a|\/n1-|piloto-servidor"|\/sello"/);
      expect(s, p).not.toMatch(/scoreVariant\(|informeOf\(|advanceReto\(/);
    }
  });
});

// ───────────────────────────────────────────── sello

describe("sello", () => {
  it("abre con la misma llave y no con otra", () => {
    const s = sellar({ a: 1 }, SECRET);
    expect(abrir(s, SECRET)).toEqual({ a: 1 });
    expect(abrir(s, OTRA)).toBeNull();
  });

  it("no se puede leer: el contenido no aparece en el texto del sello", () => {
    const s = sellar({ secreto: "respuesta-correcta-123" }, SECRET);
    expect(s).not.toContain("respuesta");
    expect(Buffer.from(s.split(".")[2], "base64url").toString("utf8")).not.toContain("respuesta");
  });

  it("cambiar una sola letra lo invalida", () => {
    const s = sellar({ score: 0 }, SECRET);
    const parts = s.split(".");
    for (const k of [1, 2, 3]) {
      const p = parts[k];
      const flip = (p.startsWith("A") ? "B" : "A") + p.slice(1);
      expect(abrir([...parts.slice(0, k), flip, ...parts.slice(k + 1)].join("."), SECRET)).toBeNull();
    }
    for (const bad of [null, 1, "", "s1", "s2.a.b.c", "s1.a.b", {}, "x".repeat(300_000)]) expect(abrir(bad, SECRET)).toBeNull();
  });
});

// ───────────────────────────────────────────── experiencias

describe.each(EXPERIENCIAS.map((x) => [x.editorialId, x] as const))("%s · comprobación calificada en el servidor", (_id, x) => {
  const pub = experienciaPublica(x);

  it("la comprobación que llega al navegador no trae claves, referencias ni notas de conversión", () => {
    const keys = keysOf(pub.variant);
    for (const k of LLAVES_VARIANTE) expect(keys.has(k), `${x.editorialId} trae «${k}»`).toBe(false);
    expect("conversionNotes" in pub).toBe(false);
    const json = JSON.stringify(pub);
    for (const t of x.variant.tasks) {
      if (t.kind === "texto") { expect(json).not.toContain(t.reference); for (const i of t.ideas) expect(json).not.toContain(i); }
      if (t.kind === "cifra" && t.calc) expect(json).not.toContain(t.calc);
    }
    for (const n of x.conversionNotes) expect(json).not.toContain(n);
    // La práctica sí viaja completa: es donde se aprende.
    expect(pub.nodes).toEqual(x.nodes);
    expect(pub.variant.tasks.map((t) => t.id)).toEqual(x.variant.tasks.map((t) => t.id));
  });

  it("el servidor califica, sella con la identidad y no acepta entregas a medias", () => {
    const ans = todoBien(x);
    const e = entregarExperiencia(x, "u1", ans, SECRET, NOW);
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.result.pass).toBeNull();
    expect(e.result.auto + e.result.pending).toBe(100);
    expect(e.variant).toEqual(x.variant);
    expect(e.notes).toEqual(x.conversionNotes);
    const s = abrir<{ user: string; exp: string; ver: number }>(e.sello, SECRET)!;
    expect([s.user, s.exp, s.ver]).toEqual(["u1", x.id, x.version]);
    const needs = x.variant.tasks.find((t) => t.kind === "cifra" || t.kind === "clasificar" || t.kind === "senalar")!;
    const { [needs.id]: _gone, ...half } = ans;
    void _gone;
    expect(entregarExperiencia(x, "u1", half, SECRET, NOW).ok).toBe(false);
    expect(entregarExperiencia(x, "u1", null, SECRET, NOW).ok).toBe(false);
  });

  it("lo que manda el navegador no decide nada: puntajes, campos extra y formas raras se ignoran", () => {
    const raw = { ...todoBien(x), score: 100, pass: true, result: { score: 100 }, __proto__x: 1 };
    const e = entregarExperiencia(x, "u1", raw, SECRET, NOW);
    expect(e.ok).toBe(true);
    if (e.ok) expect(e.result.items.map((i) => i.id)).toEqual(x.variant.tasks.map((t) => t.id));
    const t = x.variant.tasks.find((q) => q.kind === "cifra");
    if (t) {
      for (const v of ["5000", 1.5, -1, 1e12, { a: 1 }]) {
        const r = entregarExperiencia(x, "u1", { ...todoBien(x), [t.id]: v }, SECRET, NOW);
        expect(r.ok, String(v)).toBe(false);
      }
    }
  });

  it("al volver, el resultado se recalcula desde el sello; otra cuenta, otra pieza u otra versión no lo abren", () => {
    const e = entregarExperiencia(x, "u1", todoBien(x), SECRET, NOW);
    if (!e.ok) throw new Error(e.error);
    const back = reabrirExperiencia(x, "u1", e.sello, SECRET);
    expect(back.ok && back.result).toEqual(e.result);
    expect(reabrirExperiencia(x, "u2", e.sello, SECRET).ok).toBe(false);
    expect(reabrirExperiencia({ ...x, version: x.version + 1 }, "u1", e.sello, SECRET).ok).toBe(false);
    const otra = EXPERIENCIAS.find((y) => y.id !== x.id)!;
    expect(reabrirExperiencia(otra, "u1", e.sello, SECRET).ok).toBe(false);
    expect(reabrirExperiencia(x, "u1", e.sello, OTRA).ok).toBe(false);
    expect(reabrirExperiencia(x, "u1", e.sello.replace(/^(s1\.[^.]+\.)(.)/, (_m, pre: string, c: string) => pre + (c === "A" ? "B" : "A")), SECRET).ok).toBe(false);
  });
});

// ───────────────────────────────────────────── Executive Challenge

function mejor(p: PasoReto): unknown {
  switch (p.kind) {
    case "decision": return [...p.options].sort((a, b) => b.score - a.score)[0].id;
    case "cifras": return Object.fromEntries(p.fields.map((f) => [f.id, String(f.answer)]));
    case "clasificar": return Object.fromEntries(p.items.map((i) => [i.id, i.group]));
    case "armar": return Object.fromEntries(p.slots.map((s) => [s.id, s.answer]));
    case "ordenar": return p.order;
    case "escribir": return Object.fromEntries(p.fields.map((f) => [f.id, "Mi respuesta."]));
    case "dato": return undefined;
  }
}
function peor(p: PasoReto): unknown {
  if (p.kind === "decision") return [...p.options].sort((a, b) => a.score - b.score)[0].id;
  if (p.kind === "ordenar") return [...p.order].reverse();
  return mejor(p);
}

function ok(s: PasoServidor): { vista: VistaReto; sello: string } {
  if (!s.ok) throw new Error(s.error);
  return s;
}

/** Juega el reto completo por las acciones de servidor. Devuelve todas las vistas. */
function jugar(r: Reto, user: string, how: (p: PasoReto) => unknown) {
  const vistas: VistaReto[] = [];
  let cur = ok(iniciarReto(r, user, null, SECRET, "int-1"));
  vistas.push(cur.vista);
  const go = (a: AccionCliente) => { cur = ok(accionReto(r, user, cur.sello, a, SECRET, NOW)); vistas.push(cur.vista); };
  go({ t: "empezar" });
  for (let guard = 0; guard < 200 && cur.vista.phase === "reto"; guard++) {
    const p = stepById(r, cur.vista.step!.id)!.step;
    const v = how(p);
    if (v !== undefined) go({ t: "responder", step: p.id, value: v });
    if (cur.vista.last) go({ t: "terminar" });
    else go({ t: "avanzar" });
  }
  return { vistas, cur };
}

describe("EC-N1-002-A · el reto vive en el servidor", () => {
  it("la portada no trae escenas, pasos, criterios ni umbrales", () => {
    const pub = retoPublico(R);
    const keys = keysOf(pub);
    for (const k of [...LLAVES_RETO, "steps", "docs"]) expect(keys.has(k), k).toBe(false);
    expect(pub.scenes).toBe(R.scenes.length);
  });

  for (const [modo, how] of [["quien sabe", mejor], ["quien empieza", peor]] as const) {
    it(`${modo}: ninguna vista antes del cierre trae puntos, rutas, notas, marcas ni respuestas correctas`, () => {
      const { vistas, cur } = jugar(R, "u1", how);
      expect(cur.vista.phase).toBe("fin");
      const notas = allSteps(R).flatMap(({ step }) => (step.kind === "decision" ? step.options.map((o) => o.nota) : []));
      const why = allSteps(R).flatMap(({ step }) => (step.kind === "clasificar" ? step.items.map((i) => i.why) : step.kind === "ordenar" ? [step.why] : step.kind === "armar" ? step.slots.map((s) => s.why) : []));
      const refs = allSteps(R).flatMap(({ step }) => (step.kind === "escribir" ? [step.reference, ...step.ideas] : []));
      // Lo que ya está escrito en un documento de la sala no es una clave aunque una explicación lo repita.
      const enDocs = JSON.stringify(R.docs);
      const vivas = vistas.filter((v) => v.phase !== "fin");
      expect(vivas.length).toBeGreaterThan(30);
      for (const v of vivas) {
        expect(v.final).toBeNull();
        expect(v.notes).toEqual([]);
        const keys = keysOf(v);
        for (const k of LLAVES_RETO) expect(keys.has(k), `la vista de ${v.step?.id} trae «${k}»`).toBe(false);
        const json = JSON.stringify(v);
        for (const n of [...notas, ...why, ...refs].filter((t) => !enDocs.includes(t))) expect(json, v.step?.id).not.toContain(n);
        for (const c of Object.values(R.criteria)) expect(json).not.toContain(c);
        // Solo la escena actual: ningún paso de otra escena viaja.
        if (v.step) {
          const here = stepById(R, v.step.id)!.scene;
          for (const { scene, step } of allSteps(R)) if (scene.id !== here.id) expect(json.includes(`"id":"${step.id}"`), step.id).toBe(false);
        }
        // Las cifras correctas del paso actual no viajan antes de responder.
        if (v.step?.kind === "cifras" && v.given === null) {
          const p = stepById(R, v.step.id)!.step;
          if (p.kind === "cifras") for (const f of p.fields) expect(keysOf(v.step).has("answer")).toBe(false);
        }
      }
      // Al cerrar llega el informe, calculado en el servidor.
      expect(cur.vista.final!.informe).toBeTruthy();
      expect(cur.vista.notes).toEqual(R.conversionNotes);
    });
  }

  it("el orden lo impone el servidor: no se responde un paso que no es el actual ni se salta adelante", () => {
    const a = ok(iniciarReto(R, "u1", null, SECRET, "i"));
    const b = ok(accionReto(R, "u1", a.sello, { t: "empezar" }, SECRET, NOW));
    const steps = allSteps(R);
    const futuro = [...steps].reverse().find(({ step }) => step.kind !== "dato")!.step;
    const c = ok(accionReto(R, "u1", b.sello, { t: "responder", step: futuro.id, value: mejor(futuro) }, SECRET, NOW));
    expect(c.vista.step!.id).toBe(b.vista.step!.id);
    expect(c.vista.given).toBeNull();
    // Avanzar sin responder no avanza; terminar antes de tiempo no termina.
    if (!b.vista.canNext) expect(ok(accionReto(R, "u1", b.sello, { t: "avanzar" }, SECRET, NOW)).vista.step!.id).toBe(b.vista.step!.id);
    expect(ok(accionReto(R, "u1", b.sello, { t: "terminar" }, SECRET, NOW)).vista.phase).toBe("reto");
  });

  it("lo respondido no se cambia y repetir una acción no la cuenta dos veces", () => {
    const a = ok(iniciarReto(R, "u1", null, SECRET, "i"));
    const b = ok(accionReto(R, "u1", a.sello, { t: "empezar" }, SECRET, NOW));
    const p = stepById(R, b.vista.step!.id)!.step;
    if (p.kind !== "decision") throw new Error("el primer paso es una decisión");
    const [x1, x2] = p.options;
    const c = ok(accionReto(R, "u1", b.sello, { t: "responder", step: p.id, value: x1.id }, SECRET, NOW));
    expect(c.vista.given).toBe(x1.id);
    // Cambiar la respuesta con el sello nuevo: no.
    expect(ok(accionReto(R, "u1", c.sello, { t: "responder", step: p.id, value: x2.id }, SECRET, NOW)).vista.given).toBe(x1.id);
    // Doble envío con el sello viejo: el servidor responde lo mismo, no suma nada distinto.
    const d1 = ok(accionReto(R, "u1", b.sello, { t: "responder", step: p.id, value: x1.id }, SECRET, NOW));
    expect(d1.vista).toEqual(c.vista);
    // Pedir ayuda dos veces marca una sola vez.
    const h1 = ok(accionReto(R, "u1", c.sello, { t: "ayuda" }, SECRET, NOW));
    const h2 = ok(accionReto(R, "u1", h1.sello, { t: "ayuda" }, SECRET, NOW));
    expect(h1.vista.assisted).toBe(true);
    expect(h2.vista).toEqual(h1.vista);
  });

  it("un sello de otra cuenta, otra versión, otra llave o alterado no se acepta; al retomar se continúa donde iba", () => {
    const a = ok(iniciarReto(R, "u1", null, SECRET, "i"));
    const b = ok(accionReto(R, "u1", a.sello, { t: "empezar" }, SECRET, NOW));
    expect(accionReto(R, "u2", b.sello, { t: "avanzar" }, SECRET, NOW).ok).toBe(false);
    expect(accionReto({ ...R, version: R.version + 1 }, "u1", b.sello, { t: "avanzar" }, SECRET, NOW).ok).toBe(false);
    expect(accionReto(R, "u1", b.sello, { t: "avanzar" }, OTRA, NOW).ok).toBe(false);
    expect(accionReto(R, "u1", b.sello.replace(/^(s1\.[^.]+\.)(.)/, (_m, pre: string, c: string) => pre + (c === "A" ? "B" : "A")), { t: "avanzar" }, SECRET, NOW).ok).toBe(false);
    for (const bad of [null, { t: "x" }, { t: "responder" }, { t: "abrir" }, { t: "responder", step: "S01", value: "x".repeat(30_000) }]) {
      expect(accionReto(R, "u1", b.sello, bad as AccionCliente, SECRET, NOW).ok).toBe(false);
    }
    // Retomar con el sello propio sigue en el mismo paso; con uno ajeno empieza de nuevo.
    const back = ok(iniciarReto(R, "u1", b.sello, SECRET, "otro"));
    expect(back.vista.phase).toBe("reto");
    expect(back.vista.step!.id).toBe(b.vista.step!.id);
    expect(abrir<{ id: string }>(back.sello, SECRET)!.id).toBe("i");
    const ajeno = ok(iniciarReto(R, "u2", b.sello, SECRET, "nuevo"));
    expect(ajeno.vista.phase).toBe("inicio");
    expect(abrir<{ id: string; user: string }>(ajeno.sello, SECRET)).toMatchObject({ id: "nuevo", user: "u2" });
  });

  it("la hora la pone el servidor, no el navegador", () => {
    const a = ok(iniciarReto(R, "u1", null, SECRET, "i"));
    const b = ok(accionReto(R, "u1", a.sello, { t: "empezar", now: "1999-01-01" } as AccionCliente, SECRET, NOW));
    expect(abrir<{ intento: { startedAt: string } }>(b.sello, SECRET)!.intento.startedAt).toBe(NOW);
  });
});
