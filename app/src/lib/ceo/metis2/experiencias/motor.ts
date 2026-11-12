/**
 * MÊTIS 2.0 · Repositorio Académico · motor de experiencias inmersivas.
 *
 * Funciones puras: validar una experiencia, avanzar un recorrido y calificar la variante.
 * No guarda nada, no llama a ningún servicio y no conoce el registro de evidencias ni el cálculo de dominio.
 */
import { skillById } from "../academias";
import { FUENTES } from "./fuentes";
import type { Accion, Documento, Experiencia, Nodo, NodoDecision, Opcion, Origen, Paso, Recorrido, ResultadoVariante, Variante } from "./tipos";

export const MAX_REPLY = 400;
/** Las opciones de una decisión deben tener largo parecido: la más larga no pasa de este múltiplo de la más corta. */
export const OPTION_LENGTH_RATIO = 1.35;

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export const nodeOf = (x: Experiencia, id: string): Nodo | undefined => x.nodes.find((n) => n.id === id);
export const rowsOf = (docs: Documento[]) => docs.flatMap((d) => d.rows);
export const money = (n: number) => (n < 0 ? "−" : "") + "$" + Math.abs(n).toLocaleString("en-US");

/** Recalcula el total de un renglón a partir de los renglones que lo forman. */
export function recompute(doc: Documento, rowId: string): number | null {
  const r = doc.rows.find((x) => x.id === rowId);
  if (!r?.suma) return null;
  return r.suma.ids.reduce((s, id, i) => s + r.suma!.signs[i] * Math.abs(doc.rows.find((x) => x.id === id)?.amount ?? NaN), 0);
}

const nextIds = (n: Nodo): string[] => (n.kind === "decision" ? n.options.map((o) => o.next) : n.kind === "cierre" ? [] : [n.next]);

/** Cifras que aparecen en la práctica y se repiten en la variante (riesgo de responder de memoria). */
export function sharedAmounts(x: Experiencia): number[] {
  const abs = (docs: Documento[]) => new Set(rowsOf(docs).map((r) => Math.abs(r.amount)));
  const practice = abs(x.docs);
  const nums = (t: string) => (t.match(/\d{1,3}(?:,\d{3})+/g) ?? []).map((s) => Number(s.replace(/,/g, "")));
  x.nodes.forEach((n) => { if (n.kind === "dato") n.items.forEach((i) => nums(i).forEach((v) => practice.add(v))); });
  const variant = new Set([...abs(x.variant.docs), ...x.variant.tasks.map((t) => t.answer)]);
  return [...variant].filter((v) => practice.has(v)).sort((a, b) => a - b);
}

/** Cuántas piezas vienen tal cual del paquete, cuántas se adaptaron y cuántas se añadieron al convertir. */
export function originCount(x: Experiencia): Record<Origen, number> {
  const all: Origen[] = [
    ...x.nodes.map((n) => n.origen),
    ...x.nodes.flatMap((n) => (n.kind === "decision" ? n.options.map((o) => o.origen) : [])),
    ...rowsOf(x.docs).flatMap((r) => (r.nota ? [r.nota.origen] : [])),
    x.theory.origen,
    ...x.variant.tasks.map((t) => t.origen),
  ];
  return { fuente: all.filter((o) => o === "fuente").length, adaptado: all.filter((o) => o === "adaptado").length, conversion: all.filter((o) => o === "conversion").length };
}

export interface Revision { errors: string[]; warnings: string[] }

/** Revisa que una experiencia cumpla el contrato. `errors` impide publicarla; `warnings` va a revisión editorial. */
export function checkExperiencia(x: Experiencia): Revision {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = x.nodes.map((n) => n.id);
  if (new Set(ids).size !== ids.length) errors.push("hay nodos con el mismo id");
  if (!nodeOf(x, x.start)) errors.push("el nodo inicial no existe");

  for (const s of [x.skills.primary, ...x.skills.secondary]) {
    const sk = skillById(s);
    if (!sk) errors.push(`la habilidad ${s} no está en el catálogo`);
    else if (s === x.skills.primary && (sk.academy !== x.academy || sk.from !== x.level)) errors.push("la habilidad principal no es de esta academia o de este nivel");
  }
  if (x.skills.secondary.length > 2) errors.push("máximo dos habilidades secundarias");
  for (const f of x.sourceIds) if (!FUENTES[f]) errors.push(`la fuente ${f} no está en el registro`);
  if (!x.sourceIds.length) errors.push("falta al menos una fuente");
  if (x.evidencePolicy !== "no_registra") errors.push("este lote no puede registrar evidencia");

  if (x.docs.length < 2) errors.push("se necesitan al menos dos piezas consultables");
  const docIds = new Set(x.docs.map((d) => d.id));
  const rowIds = new Set(rowsOf(x.docs).map((r) => r.id));
  if (rowIds.size !== rowsOf(x.docs).length) errors.push("hay renglones con el mismo id");
  for (const d of [...x.docs, ...x.variant.docs]) for (const r of d.rows) if (r.suma && recompute(d, r.id) !== r.amount) errors.push(`el total «${r.label}» no sale de sus renglones`);
  for (const d of x.variant.docs) for (const r of d.rows) if (r.nota) errors.push("la variante no puede traer explicaciones");

  for (const n of x.nodes) {
    for (const nx of nextIds(n)) if (!nodeOf(x, nx)) errors.push(`${n.id} lleva a un nodo que no existe (${nx})`);
    if (n.moment < 0 || n.moment >= x.moments.length) errors.push(`${n.id} no pertenece a ningún momento`);
    if (n.kind === "mensaje") {
      const w = words(n.text);
      if (w < 15 || w > 35) errors.push(`el gancho tiene ${w} palabras (debe tener de 15 a 35)`);
      for (const a of n.attachments) if (!docIds.has(a)) errors.push(`${n.id} adjunta un documento que no existe`);
    }
    if (n.kind === "explorar" || n.kind === "senalar") for (const a of n.docs) if (!docIds.has(a)) errors.push(`${n.id} usa un documento que no existe`);
    if (n.kind === "senalar") {
      if (!rowIds.has(n.correct)) errors.push(`${n.id} señala un renglón que no existe`);
      for (const k of Object.keys(n.wrong)) if (!rowIds.has(k) || k === n.correct) errors.push(`${n.id} explica un renglón que no corresponde (${k})`);
    }
    if (n.kind === "decision") {
      if (n.options.length < 3) errors.push(`${n.id} necesita al menos tres rutas`);
      if (new Set(n.options.map((o) => o.id)).size !== n.options.length) errors.push(`${n.id} repite ids de opción`);
      if (n.options.filter((o) => o.tipo === "defendible").length < 1) errors.push(`${n.id} no tiene ninguna ruta defendible`);
      const len = n.options.map((o) => o.text.length);
      if (Math.max(...len) / Math.min(...len) > OPTION_LENGTH_RATIO) errors.push(`${n.id}: las opciones no tienen largo parecido`);
      for (const o of n.options) if (!o.consequence.length || !o.feedback) errors.push(`${n.id}/${o.id} no tiene consecuencia o retroalimentación`);
    }
    if (n.kind === "redactar" && !n.reference) errors.push(`${n.id} no trae respuesta de referencia`);
  }

  // Todo nodo se alcanza desde el inicio y todo camino termina en un cierre.
  const seen = new Set<string>();
  const walk = (id: string) => { if (seen.has(id)) return; seen.add(id); const n = nodeOf(x, id); if (n) nextIds(n).forEach(walk); };
  walk(x.start);
  for (const id of ids) if (!seen.has(id)) errors.push(`el nodo ${id} no se alcanza`);
  if (!x.nodes.some((n) => n.kind === "cierre")) errors.push("falta el nodo de cierre");
  const decisions = x.nodes.filter((n): n is NodoDecision => n.kind === "decision");
  if (decisions.length < 2) errors.push("se necesitan al menos dos decisiones conectadas");
  // La opción más larga (o la más corta) no puede ser siempre la defendible.
  const pick = (cmp: (a: Opcion, b: Opcion) => number) => decisions.every((d) => [...d.options].sort(cmp)[0].tipo === "defendible");
  if (decisions.length > 1 && pick((a, b) => b.text.length - a.text.length)) errors.push("la opción más larga es siempre la defendible");
  if (decisions.length > 1 && pick((a, b) => a.text.length - b.text.length)) errors.push("la opción más corta es siempre la defendible");

  const tw = words(x.theory.text);
  if (tw < 80 || tw > 180) errors.push(`la microteoría tiene ${tw} palabras (debe tener de 80 a 180)`);

  const v = x.variant;
  if (v.tasks.reduce((s, t) => s + t.weight, 0) !== 100) errors.push("los pesos de la rúbrica de la variante no suman 100");
  if (v.docs.length < 1 || v.tasks.length < 2) errors.push("la variante necesita documentos y al menos dos tareas");
  const shown = new Set(rowsOf(v.docs).map((r) => Math.abs(r.amount)));
  for (const t of v.tasks) if (shown.has(t.answer)) errors.push(`la respuesta de «${t.criterion}» está a la vista en la variante`);
  for (const c of x.characters) if (new RegExp(`\\b${c.name}\\b`).test(v.setting + v.question + v.tasks.map((t) => t.prompt).join(" "))) errors.push("la variante reutiliza personajes de la práctica");
  const shared = sharedAmounts(x);
  if (shared.length) warnings.push(`la variante repite cifras de la práctica: ${shared.map(money).join(", ")}`);
  const o = originCount(x);
  if (o.adaptado + o.conversion) warnings.push(`${o.adaptado} piezas adaptadas y ${o.conversion} añadidas en la conversión esperan revisión editorial`);
  if (!x.qa.editorialReviewedAt) warnings.push("sin revisión editorial humana");
  return { errors, warnings };
}

// ───────────────────────────────────────────── recorrido

export const newRun = (x: Experiencia): Recorrido => ({ v: 1, exp: x.id, ver: x.version, phase: "aprender", at: x.start, trail: [{ node: x.start }], opened: [], theory: 0, answers: {}, result: null });

export const stepOf = (run: Recorrido): Paso => run.trail[run.trail.length - 1];

/** A dónde sigue el nodo actual, o null si todavía falta algo por hacer en él. */
export function nextOf(x: Experiencia, run: Recorrido): string | null {
  const n = nodeOf(x, run.at);
  const s = stepOf(run);
  if (!n || run.phase !== "aprender") return null;
  if (n.kind === "decision") return n.options.find((o) => o.id === s.choice)?.next ?? null;
  if (n.kind === "senalar") return s.solved ? n.next : null;
  if (n.kind === "redactar") return run.reply === undefined ? null : n.next;
  if (n.kind === "cierre") return null;
  return n.next;
}

export function scoreVariant(v: Variante, answers: Record<string, number | null>): ResultadoVariante {
  const items = v.tasks.map((t) => ({ id: t.id, criterion: t.criterion, ok: answers[t.id] === t.answer, weight: t.weight, given: answers[t.id] ?? null }));
  const score = items.reduce((s, i) => s + (i.ok ? i.weight : 0), 0);
  return { items, score, pass: score >= v.passAt };
}

/** Avanza el recorrido. Una acción que no aplica en el nodo actual deja todo igual. */
export function advance(x: Experiencia, run: Recorrido, a: Accion): Recorrido {
  const n = nodeOf(x, run.at);
  const s = stepOf(run);
  const patch = (p: Partial<Paso>): Recorrido => ({ ...run, trail: [...run.trail.slice(0, -1), { ...s, ...p }] });

  if (a.t === "abrir") return run.phase === "aprender" && !run.opened.includes(a.row) && rowsOf(x.docs).some((r) => r.id === a.row) ? { ...run, opened: [...run.opened, a.row] } : run;
  if (a.t === "teoria") return run.phase === "aprender" ? { ...run, theory: run.theory + 1 } : run;

  if (run.phase === "aprender" && n) {
    if (a.t === "elegir" && n.kind === "decision" && !s.choice && n.options.some((o) => o.id === a.option)) return patch({ choice: a.option });
    if (a.t === "senalar" && n.kind === "senalar" && !s.solved && rowsOf(x.docs.filter((d) => n.docs.includes(d.id))).some((r) => r.id === a.row)) {
      return a.row === n.correct ? patch({ solved: true }) : patch({ misses: [...(s.misses ?? []), a.row] });
    }
    if (a.t === "redactar" && n.kind === "redactar" && run.reply === undefined) {
      const text = a.text === null ? null : a.text.trim().slice(0, MAX_REPLY);
      return { ...run, reply: text ? text : null };
    }
    if (a.t === "avanzar") {
      const nx = nextOf(x, run);
      return nx ? { ...run, at: nx, trail: [...run.trail, { node: nx }] } : run;
    }
    if (a.t === "comprobar" && n.kind === "cierre") return { ...run, phase: "demostrar" };
  }
  if (run.phase === "demostrar") {
    if (a.t === "responder" && x.variant.tasks.some((t) => t.id === a.task)) return { ...run, answers: { ...run.answers, [a.task]: a.value } };
    if (a.t === "entregar" && x.variant.tasks.every((t) => typeof run.answers[t.id] === "number")) return { ...run, phase: "fin", result: scoreVariant(x.variant, run.answers) };
  }
  return run;
}

/** Decisiones tomadas, en orden, con su ruta. Para el cierre y para el historial. */
export function routeOf(x: Experiencia, run: Recorrido): { node: NodoDecision; option: Opcion }[] {
  return run.trail.flatMap((p) => {
    const n = nodeOf(x, p.node);
    const o = n?.kind === "decision" ? n.options.find((q) => q.id === p.choice) : undefined;
    return n?.kind === "decision" && o ? [{ node: n, option: o }] : [];
  });
}

/** Lee un recorrido guardado. Si no corresponde a esta versión de la experiencia, se empieza de nuevo. */
export function readRun(x: Experiencia, raw: unknown): Recorrido {
  const r = raw as Partial<Recorrido> | null;
  const ok = !!r && r.v === 1 && r.exp === x.id && r.ver === x.version && typeof r.at === "string" && !!nodeOf(x, r.at)
    && Array.isArray(r.trail) && r.trail.length > 0 && r.trail.every((p) => !!p && !!nodeOf(x, p.node)) && r.trail[r.trail.length - 1].node === r.at
    && Array.isArray(r.opened) && (r.phase === "aprender" || r.phase === "demostrar" || r.phase === "fin") && !!r.answers && typeof r.answers === "object";
  if (!ok) return newRun(x);
  const run = r as Recorrido;
  return { ...run, theory: Number(run.theory) || 0, result: run.phase === "fin" ? scoreVariant(x.variant, run.answers) : null };
}
