/**
 * MÊTIS 2.0 · Repositorio Académico · motor de experiencias inmersivas.
 *
 * Funciones puras: validar una experiencia, avanzar un recorrido y calificar la variante.
 * No guarda nada, no llama a ningún servicio y no conoce el registro de evidencias ni el cálculo de dominio.
 *
 * El recorrido funciona con la experiencia pública (sin claves de la comprobación). La calificación necesita la
 * experiencia completa y solo se ejecuta en el servidor: el navegador recibe el resultado ya calculado.
 */
import { skillById } from "../academias";
import { FUENTES } from "./fuentes";
import type { Accion, Documento, Experiencia, ExperienciaPublica, Nodo, NodoDecision, NodoSenalar, Opcion, Origen, Paso, Recorrido, Respuesta, ResultadoVariante, TareaPublica, Variante } from "./tipos";

export const MAX_REPLY = 400;
/** Largo máximo de cada campo cuando la respuesta escrita se divide en campos cortos. */
export const MAX_FIELD = 220;
/** Después de este número de revisiones sin acertar se puede pedir ver la solución. */
export const REVEAL_AFTER = 2;
/** El contrato editorial pide ganchos de 15 a 35 palabras; más de HOOK_MAX impide publicar. */
export const HOOK_MAX = 45;
/** Las opciones de una decisión deben tener largo parecido: la más larga no pasa de este múltiplo de la más corta. */
export const OPTION_LENGTH_RATIO = 1.35;

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const list = (v: string | string[]) => (Array.isArray(v) ? v : [v]);
const same = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const isObj = (v: unknown): v is Record<string, string> => !!v && typeof v === "object" && !Array.isArray(v);

export const correctOf = (n: NodoSenalar) => list(n.correct);
/** ¿La tarjeta quedó en un grupo aceptado? */
export const groupOk = (group: string | string[], given: string | undefined) => !!given && list(group).includes(given);
export const orderOk = (given: string[] | undefined, order: string[], accept?: string[][]) => !!given && [order, ...(accept ?? [])].some((o) => same(given, o));

export const nodeOf = (x: ExperienciaPublica, id: string): Nodo | undefined => x.nodes.find((n) => n.id === id);
export const rowsOf = (docs: Documento[]) => docs.flatMap((d) => d.rows);
export const money = (n: number) => (n < 0 ? "−" : "") + "$" + Math.abs(n).toLocaleString("en-US");

/**
 * Calculadora aritmética neutra: suma, resta, multiplica, divide y paréntesis. Devuelve null si la expresión no es válida.
 * No explica conceptos; es la misma en la práctica y en la variante.
 */
export function calc(expr: string): number | null {
  const t = expr.replace(/[−–]/g, "-").replace(/[×x]/gi, "*").replace(/[÷:]/g, "/").replace(/[$,\s]/g, "").match(/\d+(?:\.\d+)?|[-+*/()]/g);
  if (!t || t.join("") !== expr.replace(/[−–]/g, "-").replace(/[×x]/gi, "*").replace(/[÷:]/g, "/").replace(/[$,\s]/g, "")) return null;
  let i = 0;
  const atom = (): number => {
    const k = t[i++];
    if (k === "(") { const v = sum(); if (t[i++] !== ")") throw new Error("paréntesis"); return v; }
    if (k === "-") return -atom();
    if (k === undefined || !/^\d/.test(k)) throw new Error("cifra");
    return Number(k);
  };
  const prod = (): number => { let v = atom(); while (t[i] === "*" || t[i] === "/") { const op = t[i++]; const r = atom(); v = op === "*" ? v * r : v / r; } return v; };
  const sum = (): number => { let v = prod(); while (t[i] === "+" || t[i] === "-") { const op = t[i++]; const r = prod(); v = op === "+" ? v + r : v - r; } return v; };
  try { const v = sum(); return i === t.length && Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : null; } catch { return null; }
}

/** Recalcula el total de un renglón a partir de los renglones que lo forman. */
export function recompute(doc: Documento, rowId: string): number | null {
  const r = doc.rows.find((x) => x.id === rowId);
  if (!r?.suma) return null;
  return r.suma.ids.reduce((s, id, i) => s + r.suma!.signs[i] * Math.abs(doc.rows.find((x) => x.id === id)?.amount ?? NaN), 0);
}

const bigNums = (t: string) => (t.match(/\d{1,3}(?:,\d{3})+/g) ?? []).map((v) => Number(v.replace(/,/g, "")));
const allNums = (t: string) => (t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((v) => Number(v.replace(/,/g, "")));
/** Todas las cifras a la vista en unos documentos (importes y números escritos en rótulos y columnas). */
export function shownNumbers(docs: Documento[], pick: (t: string) => number[] = allNums): Set<number> {
  const out = new Set<number>();
  for (const r of rowsOf(docs)) { if (typeof r.amount === "number") out.add(Math.abs(r.amount)); [r.label, ...(r.cells ?? [])].forEach((c) => pick(c).forEach((v) => out.add(v))); }
  return out;
}

const nextIds = (n: Nodo): string[] => (n.kind === "decision" ? n.options.map((o) => o.next) : n.kind === "cierre" ? [] : [n.next]);

/** Cifras que aparecen en la práctica y se repiten en la variante (riesgo de responder de memoria). */
export function sharedAmounts(x: Experiencia): number[] {
  const big = (docs: Documento[]) => new Set([...shownNumbers(docs, bigNums)].filter((v) => v >= 1000));
  const practice = big(x.docs);
  x.nodes.forEach((n) => { if (n.kind === "dato") n.items.forEach((i) => bigNums(i).forEach((v) => practice.add(v))); if (n.kind === "calcular") n.fields.forEach((f) => { if (f.answer >= 1000) practice.add(f.answer); }); });
  const variant = new Set([...big(x.variant.docs), ...x.variant.tasks.flatMap((t) => (t.kind === "cifra" && t.answer >= 1000 ? [t.answer] : []))]);
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

/** Decisiones con exactamente una ruta defendible. */
export const sharpDecisions = (x: Experiencia): NodoDecision[] => x.nodes.filter((n): n is NodoDecision => n.kind === "decision" && n.options.filter((o) => o.tipo === "defendible").length === 1);

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
      if (w < 15 || w > HOOK_MAX) errors.push(`el gancho tiene ${w} palabras (debe tener de 15 a 35)`);
      else if (w > 35) warnings.push(`el gancho tiene ${w} palabras; el contrato editorial pide de 15 a 35 y se dejó el texto del paquete`);
      for (const a of n.attachments) if (!docIds.has(a)) errors.push(`${n.id} adjunta un documento que no existe`);
    }
    if (n.kind === "explorar" && !n.title) errors.push(`${n.id} no tiene título`);
    if (n.kind === "explorar" || n.kind === "senalar" || n.kind === "clasificar" || n.kind === "calcular") for (const a of n.docs) if (!docIds.has(a)) errors.push(`${n.id} usa un documento que no existe`);
    if (n.kind === "senalar") {
      const inDocs = new Set(rowsOf(x.docs.filter((d) => n.docs.includes(d.id))).map((r) => r.id));
      for (const c of correctOf(n)) if (!inDocs.has(c)) errors.push(`${n.id} señala un renglón que no existe`);
      for (const k of Object.keys(n.wrong)) if (!rowIds.has(k) || correctOf(n).includes(k)) errors.push(`${n.id} explica un renglón que no corresponde (${k})`);
    }
    if (n.kind === "clasificar") {
      const g = new Set(n.groups.map((q) => q.id));
      if (g.size < 2 || g.size !== n.groups.length || n.items.length < 3) errors.push(`${n.id} necesita al menos dos grupos y tres tarjetas`);
      if (new Set(n.items.map((i) => i.id)).size !== n.items.length) errors.push(`${n.id} repite ids de tarjeta`);
      for (const i of n.items) if (!list(i.group).length || list(i.group).some((q) => !g.has(q)) || !i.why) errors.push(`${n.id}/${i.id} no tiene grupo válido o explicación`);
    }
    if (n.kind === "ordenar") {
      const c = n.cards.map((q) => q.id);
      for (const o of [n.order, ...(n.accept ?? [])]) if (!same([...o].sort(), [...c].sort())) errors.push(`${n.id}: el orden de referencia no usa las mismas tarjetas`);
      if (n.cards.length < 3) errors.push(`${n.id} necesita al menos tres tarjetas`);
      if (orderOk(c, n.order, n.accept)) errors.push(`${n.id} presenta las tarjetas ya en orden`);
      for (const h of n.hints) if (!c.includes(h.first) || !c.includes(h.then)) errors.push(`${n.id} tiene una pista sobre una tarjeta que no existe`);
    }
    if (n.kind === "calcular") {
      if (!n.fields.length || new Set(n.fields.map((f) => f.id)).size !== n.fields.length) errors.push(`${n.id} no tiene campos o los repite`);
      for (const f of n.fields) if (!f.hint || !f.calc) errors.push(`${n.id}/${f.id} no tiene pista o cálculo`);
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
    if (n.kind === "redactar" && n.fields && (n.fields.length < 2 || new Set(n.fields.map((f) => f.id)).size !== n.fields.length)) errors.push(`${n.id}: los campos de la respuesta no son válidos`);
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
  // Cuentan las decisiones con una sola ruta defendible: donde varias lo son, el largo no revela nada.
  const sharp = sharpDecisions(x);
  const pick = (cmp: (a: Opcion, b: Opcion) => number) => sharp.every((d) => [...d.options].sort(cmp)[0].tipo === "defendible");
  if (sharp.length && pick((a, b) => b.text.length - a.text.length)) errors.push("la opción más larga es siempre la defendible");
  if (sharp.length && pick((a, b) => a.text.length - b.text.length)) errors.push("la opción más corta es siempre la defendible");
  for (const d of [...x.docs, ...x.variant.docs]) for (const r of d.rows) if ((r.cells?.length ?? 0) !== (d.cols ? d.cols.length - 1 : 0)) errors.push(`el renglón «${r.label}» no coincide con las columnas del documento ${d.letter}`);

  const tw = words(x.theory.text);
  if (tw < 80 || tw > 180) errors.push(`la microteoría tiene ${tw} palabras (debe tener de 80 a 180)`);

  const v = x.variant;
  if (v.tasks.reduce((s, t) => s + t.weight, 0) !== 100) errors.push("los pesos de la rúbrica de la variante no suman 100");
  if (v.docs.length < 1 || v.tasks.length < 2 || !v.intro) errors.push("la variante necesita documentos, presentación y al menos dos tareas");
  if (new Set(v.tasks.map((t) => t.id)).size !== v.tasks.length) errors.push("la variante repite ids de tarea");
  if (!v.tasks.some((t) => t.kind !== "texto")) errors.push("la variante no tiene ninguna tarea que se pueda comprobar sin una persona");
  const shown = shownNumbers(v.docs);
  const vRows = new Set(rowsOf(v.docs).map((r) => r.id));
  for (const t of v.tasks) {
    if (t.kind === "cifra" && shown.has(t.answer)) errors.push(`la respuesta de «${t.criterion}» está a la vista en la variante`);
    if (t.kind === "clasificar") {
      const g = new Set(t.groups.map((q) => q.id));
      if (g.size < 2 || t.items.length < 2 || t.items.some((i) => list(i.group).some((q) => !g.has(q)))) errors.push(`la tarea «${t.criterion}» no tiene grupos o tarjetas válidos`);
    }
    if (t.kind === "ordenar") {
      const c = t.cards.map((q) => q.id);
      if (!same([...t.order].sort(), [...c].sort()) || orderOk(c, t.order, t.accept)) errors.push(`la tarea «${t.criterion}» presenta las tarjetas en orden o con tarjetas distintas`);
    }
    if (t.kind === "senalar" && (!t.correct.length || t.correct.some((r) => !vRows.has(r)) || !v.docs.some((d) => d.id === t.doc))) errors.push(`la tarea «${t.criterion}» señala renglones que no existen`);
    if (t.kind === "texto" && (!t.reference || !t.ideas.length)) errors.push(`la tarea «${t.criterion}» no trae referencia para comparar`);
  }
  const vText = [v.setting, v.question, ...v.tasks.map((t) => t.prompt), ...rowsOf(v.docs).flatMap((r) => [r.label, ...(r.cells ?? [])])].join(" ");
  for (const c of x.characters) if (new RegExp(`\\b${c.name}\\b`).test(vText)) errors.push("la variante reutiliza personajes de la práctica");
  const pending = v.tasks.filter((t) => t.kind === "texto").reduce((s, t) => s + t.weight, 0);
  if (pending) warnings.push(`${pending} de 100 puntos de la variante son respuestas escritas: no se califican solas y esperan revisión de una persona`);
  const shared = sharedAmounts(x);
  if (shared.length) warnings.push(`la variante repite cifras de la práctica: ${shared.map(money).join(", ")}`);
  const o = originCount(x);
  if (o.adaptado + o.conversion) warnings.push(`${o.adaptado} piezas adaptadas y ${o.conversion} añadidas en la conversión esperan revisión editorial`);
  if (!x.qa.editorialReviewedAt) warnings.push("sin revisión editorial humana");
  return { errors, warnings };
}

// ───────────────────────────────────────────── recorrido

export const newRun = (x: ExperienciaPublica): Recorrido => ({ v: 2, exp: x.id, ver: x.version, phase: "aprender", at: x.start, trail: [{ node: x.start }], opened: [], theory: 0, replies: {}, answers: {}, result: null, sello: null });

export const stepOf = (run: Recorrido): Paso => run.trail[run.trail.length - 1];

/** A dónde sigue el nodo actual, o null si todavía falta algo por hacer en él. */
export function nextOf(x: ExperienciaPublica, run: Recorrido): string | null {
  const n = nodeOf(x, run.at);
  const s = stepOf(run);
  if (!n || run.phase !== "aprender") return null;
  if (n.kind === "decision") return n.options.find((o) => o.id === s.choice)?.next ?? null;
  if (n.kind === "senalar" || n.kind === "clasificar" || n.kind === "ordenar" || n.kind === "calcular") return s.solved ? n.next : null;
  if (n.kind === "redactar") return n.id in run.replies ? n.next : null;
  if (n.kind === "cierre") return null;
  return n.next;
}

/** ¿La tarea ya tiene lo mínimo para entregarse? Lo escrito puede quedar en blanco. */
export function taskReady(t: TareaPublica, a: Respuesta | undefined): boolean {
  if (t.kind === "cifra") return typeof a === "number";
  if (t.kind === "clasificar") return isObj(a) && t.items.every((i) => !!a[i.id]);
  if (t.kind === "senalar") return Array.isArray(a) && a.length > 0;
  return true;
}

const written = (a: Respuesta | undefined) => isObj(a) && Object.values(a).some((v) => v.trim().length > 0);

/**
 * Califica lo que se puede calificar solo. SOLO EN EL SERVIDOR: necesita las claves de la variante. Clasificar da crédito por tarjeta; cifra, orden y señalar, todo o nada.
 * Lo escrito no suma ni resta: su peso queda en `pending`, en espera de que lo revise una persona.
 */
export function scoreVariant(v: Variante, answers: Record<string, Respuesta>): ResultadoVariante {
  const items = v.tasks.map((t) => {
    const a = answers[t.id];
    let got = 0;
    let auto = true;
    if (t.kind === "cifra") got = a === t.answer ? t.weight : 0;
    else if (t.kind === "clasificar") got = Math.round((t.weight * t.items.filter((i) => groupOk(i.group, isObj(a) ? a[i.id] : undefined)).length) / t.items.length);
    else if (t.kind === "ordenar") got = orderOk(Array.isArray(a) ? a : t.cards.map((c) => c.id), t.order, t.accept) ? t.weight : 0;
    else if (t.kind === "senalar") got = Array.isArray(a) && same([...a].sort(), [...t.correct].sort()) ? t.weight : 0;
    else auto = !written(a);
    return { id: t.id, criterion: t.criterion, auto, ok: auto && got === t.weight, got, weight: t.weight, given: a ?? null };
  });
  const score = items.reduce((s, i) => s + i.got, 0);
  const pending = items.filter((i) => !i.auto).reduce((s, i) => s + i.weight, 0);
  return { items, score, auto: 100 - pending, pending, pass: null };
}

/** Avanza el recorrido. Una acción que no aplica en el nodo actual deja todo igual. */
export function advance(x: ExperienciaPublica, run: Recorrido, a: Accion): Recorrido {
  const n = nodeOf(x, run.at);
  const s = stepOf(run);
  const patch = (p: Partial<Paso>): Recorrido => ({ ...run, trail: [...run.trail.slice(0, -1), { ...s, ...p }] });

  if (a.t === "abrir") return run.phase === "aprender" && !run.opened.includes(a.row) && rowsOf(x.docs).some((r) => r.id === a.row) ? { ...run, opened: [...run.opened, a.row] } : run;
  if (a.t === "teoria") return run.phase === "aprender" ? { ...run, theory: run.theory + 1 } : run;

  if (run.phase === "aprender" && n) {
    if (a.t === "elegir" && n.kind === "decision" && !s.choice && n.options.some((o) => o.id === a.option)) return patch({ choice: a.option });
    if (a.t === "senalar" && n.kind === "senalar" && !s.solved && rowsOf(x.docs.filter((d) => n.docs.includes(d.id))).some((r) => r.id === a.row)) {
      const all = correctOf(n);
      const found = s.found ?? [];
      if (all.includes(a.row)) return found.includes(a.row) ? run : patch({ found: [...found, a.row], solved: found.length + 1 === all.length });
      return (s.misses ?? []).includes(a.row) ? run : patch({ misses: [...(s.misses ?? []), a.row] });
    }
    if (a.t === "asignar" && n.kind === "clasificar" && !s.solved && n.items.some((i) => i.id === a.item) && n.groups.some((g) => g.id === a.group)) {
      return patch({ assign: { ...(s.assign ?? {}), [a.item]: a.group }, misses: (s.misses ?? []).filter((m) => m !== a.item) });
    }
    if (a.t === "mover" && n.kind === "ordenar" && !s.solved) {
      const order = [...(s.order ?? n.cards.map((c) => c.id))];
      const i = order.indexOf(a.card);
      const j = i + a.dir;
      if (i < 0 || j < 0 || j >= order.length) return run;
      [order[i], order[j]] = [order[j], order[i]];
      return patch({ order, misses: [] });
    }
    if (a.t === "cifra" && n.kind === "calcular" && !s.solved && n.fields.some((f) => f.id === a.field)) {
      return patch({ values: { ...(s.values ?? {}), [a.field]: a.value }, misses: (s.misses ?? []).filter((m) => m !== a.field) });
    }
    if (a.t === "revisar" && !s.solved) {
      const fail = (misses: string[]) => patch({ checks: (s.checks ?? 0) + 1, misses });
      if (n.kind === "clasificar") {
        if (!n.items.every((i) => !!s.assign?.[i.id])) return run;
        const wrong = n.items.filter((i) => !groupOk(i.group, s.assign?.[i.id])).map((i) => i.id);
        return wrong.length ? fail(wrong) : patch({ solved: true, misses: [] });
      }
      if (n.kind === "ordenar") {
        const order = s.order ?? n.cards.map((c) => c.id);
        if (!n.strict || orderOk(order, n.order, n.accept)) return patch({ order, solved: true, misses: [] });
        const h = n.hints.findIndex((q) => order.indexOf(q.first) > order.indexOf(q.then));
        return fail([String(h)]);
      }
      if (n.kind === "calcular") {
        if (!n.fields.every((f) => typeof s.values?.[f.id] === "number")) return run;
        const wrong = n.fields.filter((f) => s.values?.[f.id] !== f.answer).map((f) => f.id);
        return wrong.length ? fail(wrong) : patch({ solved: true, misses: [] });
      }
    }
    if (a.t === "revelar" && !s.solved && (s.checks ?? 0) >= REVEAL_AFTER) {
      if (n.kind === "clasificar") return patch({ assign: Object.fromEntries(n.items.map((i) => [i.id, list(i.group)[0]])), solved: true, revealed: true, misses: [] });
      if (n.kind === "ordenar") return patch({ order: [...n.order], solved: true, revealed: true, misses: [] });
      if (n.kind === "calcular") return patch({ values: Object.fromEntries(n.fields.map((f) => [f.id, f.answer])), solved: true, revealed: true, misses: [] });
    }
    if (a.t === "redactar" && n.kind === "redactar" && !(n.id in run.replies)) {
      let reply: Record<string, string> | null = null;
      if (a.text !== null) {
        const raw = n.fields ? n.fields.map((f) => [f.id, (a.fields?.[f.id] ?? "").trim().slice(0, MAX_FIELD)] as const) : [["texto", a.text.trim().slice(0, MAX_REPLY)] as const];
        if (raw.some(([, v]) => v)) reply = Object.fromEntries(raw);
      }
      return { ...run, replies: { ...run.replies, [n.id]: reply } };
    }
    if (a.t === "avanzar") {
      const nx = nextOf(x, run);
      return nx ? { ...run, at: nx, trail: [...run.trail, { node: nx }] } : run;
    }
    if (a.t === "comprobar" && n.kind === "cierre") return { ...run, phase: "demostrar" };
  }
  if (run.phase === "demostrar") {
    if (a.t === "responder" && x.variant.tasks.some((t) => t.id === a.task)) return { ...run, answers: { ...run.answers, [a.task]: a.value } };
    // El resultado lo calcula el servidor; aquí solo se acepta si corresponde, tarea por tarea, a esta comprobación.
    if (a.t === "entregado" && variantReady(x, run) && !!a.sello && same(a.result.items.map((i) => i.id), x.variant.tasks.map((t) => t.id))) return { ...run, phase: "fin", result: a.result, sello: a.sello };
  }
  return run;
}

export const variantReady = (x: ExperienciaPublica, run: Recorrido) => x.variant.tasks.every((t) => taskReady(t, run.answers[t.id]));

/** Decisiones tomadas, en orden, con su ruta. Para el cierre y para el historial. */
export function routeOf(x: ExperienciaPublica, run: Recorrido): { node: NodoDecision; option: Opcion }[] {
  return run.trail.flatMap((p) => {
    const n = nodeOf(x, p.node);
    const o = n?.kind === "decision" ? n.options.find((q) => q.id === p.choice) : undefined;
    return n?.kind === "decision" && o ? [{ node: n, option: o }] : [];
  });
}

/**
 * Lee un recorrido guardado. Si no corresponde a esta versión de la experiencia, se empieza de nuevo.
 * El resultado guardado nunca se usa: si la comprobación ya se entregó, la pantalla se lo vuelve a pedir al servidor
 * con el sello. Sin sello, la comprobación vuelve a quedar abierta con lo que se había respondido.
 */
export function readRun(x: ExperienciaPublica, raw: unknown): Recorrido {
  const r = raw as (Partial<Recorrido> & { reply?: string | null }) | null;
  const ok = !!r && ((r.v as number) === 1 || r.v === 2) && r.exp === x.id && r.ver === x.version && typeof r.at === "string" && !!nodeOf(x, r.at)
    && Array.isArray(r.trail) && r.trail.length > 0 && r.trail.every((p) => !!p && !!nodeOf(x, p.node)) && r.trail[r.trail.length - 1].node === r.at
    && Array.isArray(r.opened) && (r.phase === "aprender" || r.phase === "demostrar" || r.phase === "fin") && !!r.answers && typeof r.answers === "object";
  if (!ok) return newRun(x);
  // Los recorridos guardados con el formato anterior traían una sola respuesta escrita.
  let replies = r.replies && typeof r.replies === "object" ? r.replies : {};
  if ((r.v as number) === 1 && r.reply !== undefined) {
    const w = x.nodes.find((n) => n.kind === "redactar");
    if (w) replies = { [w.id]: r.reply === null ? null : { texto: String(r.reply) } };
  }
  const { reply: _old, ...rest } = r;
  void _old;
  const run = { ...rest, v: 2, replies } as Recorrido;
  const sello = typeof run.sello === "string" && run.sello ? run.sello : null;
  const phase = run.phase === "fin" && !sello ? "demostrar" : run.phase;
  return { ...run, phase, theory: Number(run.theory) || 0, result: null, sello: phase === "fin" ? sello : null };
}
