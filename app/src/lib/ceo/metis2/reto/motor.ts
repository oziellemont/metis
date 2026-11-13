/**
 * MÊTIS 2.0 · Executive Challenge · motor del reto integrador.
 *
 * Funciones puras: validar un reto, avanzar un intento y armar el informe.
 * No guarda nada, no llama a ningún servicio y no conoce el registro de evidencias, el dominio ni la partida.
 * No hay veredicto: no existe regla de aprobación ni umbrales en el reto.
 */
import { skillById, skillsAt } from "../academias";
import type { AccionReto, Cond, Escena, EstadoSalvaguarda, Informe, Intento, Observacion, PasoReto, RespuestaReto, Reto, Texto } from "./tipos";

export const MAX_ESCRITO = 300;
/** Las opciones de una decisión deben tener largo parecido (igual que en las experiencias). */
export const RATIO_OPCIONES = 1.35;

const isObj = (v: unknown): v is Record<string, string> => !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every((x) => typeof x === "string");
const same = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const digits = (t: string) => (/^\d{1,9}$/.test(t) ? Number(t) : null);

export const holds = (c: Cond | undefined, flags: Record<string, string>) => !c || flags[c.flag] === c.is;
export const textOf = (t: Texto, flags: Record<string, string>) => t.alt?.find((a) => holds(a.when, flags))?.text ?? t.text;

/** Todos los pasos, en el orden de la historia, con su escena. */
export const allSteps = (r: Reto): { scene: Escena; step: PasoReto }[] => r.scenes.flatMap((scene) => scene.steps.map((step) => ({ scene, step })));
export const stepById = (r: Reto, id: string) => allSteps(r).find((s) => s.step.id === id);
/** El camino visible con las marcas actuales: los pasos condicionados aparecen solo si su marca se cumple. */
export const pathOf = (r: Reto, flags: Record<string, string>) => allSteps(r).filter((s) => holds(s.step.when, flags));

/** Marcas que dejan las decisiones respondidas, recorriendo la historia en orden. */
export function flagsOf(r: Reto, answers: Record<string, RespuestaReto>): Record<string, string> {
  const flags: Record<string, string> = {};
  for (const { step } of allSteps(r)) {
    if (!holds(step.when, flags) || step.kind !== "decision") continue;
    const o = step.options.find((q) => q.id === answers[step.id]);
    if (o?.sets) Object.assign(flags, o.sets);
  }
  return flags;
}

/** ¿La respuesta tiene la forma que pide el paso? Lo escrito puede quedar vacío. */
export function validAnswer(p: PasoReto, v: RespuestaReto | undefined): boolean {
  if (v === undefined) return false;
  switch (p.kind) {
    case "decision": return typeof v === "string" && p.options.some((o) => o.id === v);
    case "ordenar": return Array.isArray(v) && same([...v].sort(), p.cards.map((c) => c.id).sort());
    case "cifras": return isObj(v) && p.fields.every((f) => digits(v[f.id] ?? "") !== null);
    case "clasificar": return isObj(v) && p.items.every((i) => p.groups.some((g) => g.id === v[i.id]));
    case "armar": return isObj(v) && p.slots.every((s) => s.choices.some((c) => c.id === v[s.id]));
    case "escribir": return isObj(v) && Object.keys(v).every((k) => p.fields.some((f) => f.id === k));
    case "dato": return false;
  }
}

/** Puntos de un paso. `auto: false` = escrito con texto, en espera de revisión de una persona. */
export function scoreStep(p: PasoReto, v: RespuestaReto | undefined): { got: number; auto: boolean } {
  if (!validAnswer(p, v)) return { got: 0, auto: p.kind !== "escribir" };
  const a = v as Record<string, string>;
  switch (p.kind) {
    case "decision": return { got: p.options.find((o) => o.id === v)!.score, auto: true };
    case "ordenar": return { got: same(v as string[], p.order) ? p.points : 0, auto: true };
    case "cifras": return { got: p.fields.reduce((s, f) => s + (digits(a[f.id]) === f.answer ? f.points : 0), 0), auto: true };
    case "clasificar": return { got: Math.floor((p.points * p.items.filter((i) => a[i.id] === i.group).length) / p.items.length), auto: true };
    case "armar": return { got: Math.floor((p.points * p.slots.filter((s) => a[s.id] === s.answer).length) / p.slots.length), auto: true };
    case "escribir": return Object.values(a).some((t) => t.trim()) ? { got: 0, auto: false } : { got: 0, auto: true };
    default: return { got: 0, auto: true };
  }
}

export const newIntento = (r: Reto): Intento => ({ v: 1, reto: r.id, ver: r.version, phase: "inicio", at: null, answers: {}, flags: {}, opened: [], assisted: false, resumes: 0, startedAt: null, endedAt: null });

/** ¿Ya se puede pasar del paso actual? */
export function stepDone(r: Reto, i: Intento): boolean {
  const s = i.at ? stepById(r, i.at) : undefined;
  return !!s && (s.step.kind === "dato" || i.at! in i.answers);
}
/** Paso siguiente en el camino visible, o null si el actual es el último. */
export function nextStep(r: Reto, i: Intento): string | null {
  const path = pathOf(r, i.flags);
  const k = path.findIndex((s) => s.step.id === i.at);
  return k >= 0 && k + 1 < path.length ? path[k + 1].step.id : null;
}

/** Avanza el intento. Una acción que no aplica deja todo igual. Lo respondido no se cambia. */
export function advanceReto(r: Reto, i: Intento, a: AccionReto): Intento {
  if (a.t === "empezar") return i.phase === "inicio" ? { ...i, phase: "reto", at: pathOf(r, {})[0].step.id, startedAt: a.now } : i;
  if (i.phase !== "reto") return i;
  if (a.t === "retomar") return { ...i, resumes: i.resumes + 1 };
  if (a.t === "abrir") return r.docs.some((d) => d.id === a.doc) && !i.opened.includes(a.doc) ? { ...i, opened: [...i.opened, a.doc] } : i;
  if (a.t === "ayuda") return i.assisted ? i : { ...i, assisted: true };
  if (a.t === "responder") {
    const s = stepById(r, a.step);
    if (!s || a.step !== i.at || a.step in i.answers || !validAnswer(s.step, a.value)) return i;
    const value = s.step.kind === "escribir" ? Object.fromEntries(Object.entries(a.value as Record<string, string>).map(([k, t]) => [k, t.trim().slice(0, MAX_ESCRITO)])) : a.value;
    const answers = { ...i.answers, [a.step]: value };
    return { ...i, answers, flags: flagsOf(r, answers) };
  }
  if (a.t === "avanzar") {
    const nx = stepDone(r, i) ? nextStep(r, i) : null;
    return nx ? { ...i, at: nx } : i;
  }
  if (a.t === "terminar") return stepDone(r, i) && !nextStep(r, i) ? { ...i, phase: "fin", endedAt: a.now } : i;
  return i;
}

/** Acto y escena del paso actual, y cuántos pasos del acto van respondidos. */
export function progressOf(r: Reto, i: Intento): { act: number; scene: Escena | null; done: number; total: number } {
  const s = i.at ? stepById(r, i.at) : undefined;
  if (!s) return { act: i.phase === "fin" ? r.acts.length : 0, scene: null, done: 0, total: 0 };
  const inAct = pathOf(r, i.flags).filter((q) => q.scene.act === s.scene.act);
  return { act: s.scene.act, scene: s.scene, done: inAct.filter((q) => q.step.kind === "dato" ? inAct.indexOf(q) < inAct.findIndex((z) => z.step.id === i.at) : q.step.id in i.answers).length, total: inAct.length };
}

/** Máximo por habilidad, contando solo pasos que siempre aparecen. */
export function maxBySkill(r: Reto): Record<string, number> {
  const out: Record<string, number> = {};
  for (const { step } of allSteps(r)) if (step.skill && !step.when) out[step.skill] = (out[step.skill] ?? 0) + step.points;
  return out;
}

/** Opción elegida en una decisión, si el paso está en el camino y respondido. */
const chosen = (p: PasoReto | undefined, i: Intento) => (p?.kind === "decision" && holds(p.when, i.flags) ? p.options.find((q) => q.id === i.answers[p.id]) : undefined);

/**
 * Estado de cada salvaguarda. La primera respuesta manda: si no fue crítica, está cumplida.
 * Si fue crítica, se mira el paso de rectificación: corregida solo si ahí se eligió la ruta defendible.
 */
export function safeguardsOf(r: Reto, i: Intento): Informe["safeguards"] {
  const steps = allSteps(r).map((s) => s.step);
  return steps.flatMap((step) => {
    if (!step.salvaguarda) return [];
    const first = chosen(step, i);
    const fix = chosen(steps.find((q) => q.rectifica === step.id), i);
    const state: EstadoSalvaguarda = !first ? "sin_respuesta" : !first.critica ? "cumplida" : fix?.tipo === "defendible" ? "corregida" : fix ? "no_corregida" : "sin_respuesta";
    return [{ kind: step.salvaguarda, step: step.id, state, first: first?.id ?? null, fix: fix?.id ?? null }];
  });
}

/** Síntesis: se acepta cualquier secuencia defendible si su fundamento también lo es. */
export function synthesisOf(r: Reto, i: Intento): Informe["synthesis"] {
  const steps = allSteps(r).map((s) => s.step);
  const seqStep = steps.find((q) => q.sintesis === "secuencia");
  if (!seqStep) return null;
  const seq = chosen(seqStep, i);
  const reason = steps.filter((q) => q.sintesis === "fundamento").map((q) => chosen(q, i)).find(Boolean);
  const sequenceOk = seq?.tipo === "defendible";
  const reasonOk = reason?.tipo === "defendible";
  return { sequence: seq?.id ?? null, sequenceOk, reason: reason?.id ?? null, reasonOk, accepted: sequenceOk && reasonOk };
}

/** Informe del intento: 24 observaciones, por academia, salvaguardas y síntesis. Nunca da veredicto. */
export function informeOf(r: Reto, i: Intento): Informe {
  const max = maxBySkill(r);
  const path = pathOf(r, i.flags);
  const observations: Observacion[] = Object.keys(max).map((skill) => {
    const from = path.filter((s) => s.step.skill === skill).map(({ step }) => { const sc = scoreStep(step, i.answers[step.id]); return { step: step.id, got: sc.got, points: step.points, auto: sc.auto }; });
    const pending = from.filter((f) => !f.auto).reduce((s, f) => s + f.points, 0);
    return { skill, academy: skillById(skill)!.academy, got: from.reduce((s, f) => s + f.got, 0), auto: max[skill] - pending, pending, max: max[skill], from };
  });
  const academies = [...new Set(observations.map((o) => o.academy))];
  const sum = (xs: Observacion[], k: "got" | "auto" | "pending" | "max") => xs.reduce((s, o) => s + o[k], 0);
  const byAcademy = academies.map((academy) => { const xs = observations.filter((o) => o.academy === academy); return { academy, got: sum(xs, "got"), auto: sum(xs, "auto"), pending: sum(xs, "pending"), max: sum(xs, "max") }; });
  const safeguards = safeguardsOf(r, i);
  return { observations, byAcademy, got: sum(observations, "got"), auto: sum(observations, "auto"), pending: sum(observations, "pending"), max: sum(observations, "max"), safeguards, blocked: safeguards.some((s) => s.state === "no_corregida"), synthesis: synthesisOf(r, i), verdict: null, assisted: i.assisted };
}

/** Lee un intento guardado. Si no corresponde a esta versión del reto o está roto, se empieza de nuevo. Las marcas se recalculan. */
export function readIntento(r: Reto, raw: unknown): Intento {
  const x = raw as Partial<Intento> | null;
  const fresh = newIntento(r);
  if (!x || typeof x !== "object" || x.v !== 1 || x.reto !== r.id || x.ver !== r.version) return fresh;
  if (x.phase !== "inicio" && x.phase !== "reto" && x.phase !== "fin") return fresh;
  if (!x.answers || typeof x.answers !== "object" || Array.isArray(x.answers) || !Array.isArray(x.opened)) return fresh;
  const answers = x.answers as Record<string, RespuestaReto>;
  const flags = flagsOf(r, answers);
  const path = pathOf(r, flags);
  for (const [k, v] of Object.entries(answers)) { const s = path.find((q) => q.step.id === k); if (!s || !validAnswer(s.step, v)) return fresh; }
  if (x.phase === "inicio") return Object.keys(answers).length ? fresh : fresh;
  const at = path.findIndex((q) => q.step.id === x.at);
  if (at < 0) return fresh;
  // Todo lo anterior al paso actual tiene que estar respondido, y nada posterior.
  if (path.some((q, k) => q.step.kind !== "dato" && (k < at ? !(q.step.id in answers) : k > at && q.step.id in answers))) return fresh;
  const it: Intento = { ...fresh, phase: x.phase, at: x.at!, answers, flags, opened: x.opened.filter((d): d is string => typeof d === "string" && r.docs.some((q) => q.id === d)), assisted: x.assisted === true, resumes: Number(x.resumes) || 0, startedAt: typeof x.startedAt === "string" ? x.startedAt : null, endedAt: typeof x.endedAt === "string" ? x.endedAt : null };
  if (it.phase === "fin" && (!stepDone(r, it) || nextStep(r, it))) return fresh;
  return it;
}

// ───────────────────────────────────────────── validación

export interface RevisionReto { errors: string[]; warnings: string[] }

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const numbersIn = (t: string) => (t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((v) => Number(v.replace(/,/g, "")));

/** Cifras a la vista en la sala de documentos. */
export function shownInDocs(r: Reto): Set<number> {
  const out = new Set<number>();
  for (const d of r.docs) for (const row of d.rows) { if (typeof row.amount === "number") out.add(Math.abs(row.amount)); [row.label, ...(row.cells ?? [])].forEach((c) => numbersIn(c).forEach((n) => out.add(n))); }
  return out;
}

export function checkReto(r: Reto): RevisionReto {
  const errors: string[] = [];
  const warnings: string[] = [];
  const n1 = skillsAt(1).map((s) => s.id);
  const steps = allSteps(r);
  const ids = steps.map((s) => s.step.id);
  if (new Set(ids).size !== ids.length) errors.push("hay pasos con el mismo id");
  if (new Set(r.scenes.map((s) => s.id)).size !== r.scenes.length) errors.push("hay escenas con el mismo id");
  if (r.evidencePolicy !== "no_registra") errors.push("el reto no puede registrar evidencia");
  if (r.thresholds.enabled !== false) errors.push("los umbrales no pueden estar habilitados");
  if (r.thresholds.candidates.length) errors.push("no hay umbral aprobado: el reto no guarda candidatos");
  if (r.acts.length !== 3) errors.push("el reto tiene tres actos");
  for (const s of r.scenes) if (s.act < 0 || s.act >= r.acts.length) errors.push(`${s.id} no pertenece a ningún acto`);
  for (let k = 1; k < r.scenes.length; k++) if (r.scenes[k].act < r.scenes[k - 1].act) errors.push("las escenas no siguen el orden de los actos");

  // Las 24 habilidades de nivel 1, cada una en una sola escena, con 4 puntos.
  const sceneSkills = r.scenes.flatMap((s) => s.skills);
  if (new Set(sceneSkills).size !== sceneSkills.length) errors.push("una habilidad aparece en más de una escena");
  if ([...sceneSkills].sort().join() !== [...n1].sort().join()) errors.push("las escenas no cubren exactamente las habilidades de nivel 1");
  const max = maxBySkill(r);
  for (const s of n1) if (max[s] !== r.scale.max) errors.push(`la habilidad ${s} no suma ${r.scale.max} puntos`);
  for (const s of r.scenes) if (s.skills.some((k) => !s.steps.some((p) => p.skill === k && !p.when))) errors.push(`${s.id} no observa todas sus habilidades`);

  const docIds = new Set(r.docs.map((d) => d.id));
  const shown = shownInDocs(r);
  const setters = new Map<string, Set<string>>();
  const declared = (c: Cond) => setters.get(c.flag)?.has(c.is);
  const checkText = (t: Texto, where: string) => { for (const a of t.alt ?? []) if (!declared(a.when)) errors.push(`${where} depende de una marca que nadie deja antes (${a.when.flag}=${a.when.is})`); };
  const people = new Set(r.characters.map((c) => c.id));
  const coincide: string[] = [];
  for (const s of r.scenes) {
    for (const d of s.docs) if (!docIds.has(d)) errors.push(`${s.id} usa un documento que no existe`);
    for (const p of s.people) if (!people.has(p)) errors.push(`${s.id} trae a alguien que no está en el caso`);
    checkText(s.intro, s.id);
    for (const p of s.steps) {
      if (p.from && !people.has(p.from)) errors.push(`${p.id} lo dice alguien que no está en el caso`);
      if (p.when && !declared(p.when)) errors.push(`${p.id} depende de una marca que nadie deja antes`);
      if (p.when && (p.skill || p.points)) errors.push(`${p.id} es condicional y no puede dar puntos`);
      if (p.skill && !s.skills.includes(p.skill)) errors.push(`${p.id} observa una habilidad que no es de su escena`);
      if (!p.skill && p.points) errors.push(`${p.id} da puntos sin habilidad`);
      checkText(p.text, p.id);
      if (p.kind === "decision") {
        if (p.options.length < 3) errors.push(`${p.id} necesita al menos tres rutas`);
        if (!p.options.some((o) => o.tipo === "defendible")) errors.push(`${p.id} no tiene ruta defendible`);
        const len = p.options.map((o) => o.text.length);
        if (Math.max(...len) / Math.min(...len) > RATIO_OPCIONES) errors.push(`${p.id}: las opciones no tienen largo parecido`);
        for (const o of p.options) {
          if (o.score < 0 || o.score > p.points) errors.push(`${p.id}/${o.id} da puntos fuera de rango`);
          if (o.tipo === "defendible" && p.points && o.score === 0) errors.push(`${p.id}/${o.id} es defendible y no da puntos`);
          if (o.tipo !== "defendible" && p.points && o.score === p.points) errors.push(`${p.id}/${o.id} no es defendible y da todos los puntos`);
          if (!o.reply.length || !o.nota) errors.push(`${p.id}/${o.id} no tiene respuesta de los personajes o nota para el informe`);
          for (const l of o.reply) if (l.who && !people.has(l.who)) errors.push(`${p.id}/${o.id} responde alguien que no está en el caso`);
          for (const [f, v] of Object.entries(o.sets ?? {})) { if (!setters.has(f)) setters.set(f, new Set()); setters.get(f)!.add(v); }
        }
        if (p.salvaguarda && p.options.filter((o) => o.tipo === "defendible").length < 1) errors.push(`${p.id}: la salvaguarda necesita una ruta segura`);
        if (!p.salvaguarda && p.options.some((o) => o.critica)) errors.push(`${p.id} marca una ruta crítica sin ser salvaguarda`);
        if (p.options.some((o) => o.critica && (o.tipo === "defendible" || o.score === p.points))) errors.push(`${p.id}: una ruta crítica no puede ser defendible ni dar todos los puntos`);
      }
      if ((p.salvaguarda || p.rectifica || p.sintesis) && p.kind !== "decision") errors.push(`${p.id}: salvaguardas, rectificaciones y síntesis son decisiones`);
      if (p.kind === "cifras") {
        if (p.fields.reduce((s, f) => s + f.points, 0) !== p.points) errors.push(`${p.id}: los puntos de las cifras no suman los del paso`);
        for (const f of p.fields) {
          if (!f.calc) errors.push(`${p.id}/${f.id} no trae el cálculo`);
          if (shown.has(f.answer) && !f.lee) coincide.push(`${p.id}/${f.id} (${f.answer.toLocaleString("en-US")})`);
        }
      }
      if (p.kind === "clasificar") {
        const g = new Set(p.groups.map((q) => q.id));
        if (g.size < 2 || p.items.length < 3 || p.items.some((i) => !g.has(i.group) || !i.why)) errors.push(`${p.id} necesita grupos, tres tarjetas y su explicación`);
      }
      if (p.kind === "ordenar") {
        if (!same([...p.order].sort(), p.cards.map((c) => c.id).sort()) || same(p.cards.map((c) => c.id), p.order)) errors.push(`${p.id}: las tarjetas vienen en orden o no coinciden`);
      }
      if (p.kind === "armar") for (const sl of p.slots) if (sl.choices.length < 3 || !sl.choices.some((c) => c.id === sl.answer) || !sl.why) errors.push(`${p.id}/${sl.id} necesita tres piezas, una de referencia y su explicación`);
      if (p.kind === "escribir" && (!p.reference || !p.ideas.length || !p.fields.length)) errors.push(`${p.id} no trae referencia para comparar`);
    }
  }
  // Salvaguardas: cada una tiene rutas críticas y un paso de rectificación que aparece solo tras una ruta crítica.
  for (const { scene, step } of steps) {
    if (!step.salvaguarda || step.kind !== "decision") continue;
    const crit = step.options.filter((o) => o.critica);
    if (!crit.length) errors.push(`${step.id}: la salvaguarda no dice qué rutas son críticas`);
    const fixes = steps.filter((s) => s.step.rectifica === step.id);
    if (fixes.length !== 1) { errors.push(`${step.id}: la salvaguarda necesita un paso de rectificación`); continue; }
    const fix = fixes[0];
    const w = fix.step.when;
    if (fix.scene.id !== scene.id || scene.steps.indexOf(fix.step) <= scene.steps.indexOf(step)) errors.push(`${fix.step.id}: la rectificación va después de su salvaguarda, en la misma escena`);
    if (!w || fix.step.kind !== "decision") { errors.push(`${fix.step.id}: la rectificación es una decisión condicionada`); continue; }
    for (const o of step.options) if ((o.sets?.[w.flag] === w.is) !== !!o.critica) errors.push(`${step.id}/${o.id}: la rectificación debe aparecer solo tras una ruta crítica`);
    if (fix.step.options.filter((o) => o.tipo === "defendible").length !== 1) errors.push(`${fix.step.id}: la rectificación tiene una sola ruta que corrige`);
    if (fix.step.options.some((o) => o.sets?.[w.flag] === w.is)) errors.push(`${fix.step.id}: la rectificación no puede volver a abrirse`);
  }
  for (const { step } of steps) if (step.rectifica && !steps.some((s) => s.step.id === step.rectifica && s.step.salvaguarda)) errors.push(`${step.id} rectifica algo que no es salvaguarda`);
  // Síntesis: toda secuencia defendible lleva a un paso de fundamento; ninguno da puntos.
  const seqs = steps.filter((s) => s.step.sintesis === "secuencia");
  if (seqs.length > 1) errors.push("hay más de una síntesis");
  for (const { step } of seqs) {
    if (step.kind !== "decision") continue;
    if (step.skill || step.points) errors.push(`${step.id}: la síntesis no da puntos`);
    const reasons = steps.filter((s) => s.step.sintesis === "fundamento").map((s) => s.step);
    for (const o of step.options.filter((q) => q.tipo === "defendible")) {
      const mine = reasons.filter((q) => q.when && o.sets?.[q.when.flag] === q.when.is);
      if (mine.length !== 1) errors.push(`${step.id}/${o.id}: la secuencia defendible necesita su paso de fundamento`);
      for (const q of mine) if (q.kind === "decision" && q.options.filter((x) => x.tipo === "defendible").length !== 1) errors.push(`${q.id}: el fundamento tiene una sola razón defendible`);
    }
    if (step.options.filter((q) => q.tipo === "defendible").length < 2) warnings.push(`${step.id}: la síntesis acepta una sola secuencia`);
  }

  // La opción más larga (o la más corta) no puede ser siempre la defendible.
  const sharp = steps.flatMap(({ step }) => (step.kind === "decision" && step.options.filter((o) => o.tipo === "defendible").length === 1 ? [step] : []));
  const always = (cmp: (a: number, b: number) => number) => sharp.every((d) => [...d.options].sort((a, b) => cmp(a.text.length, b.text.length))[0].tipo === "defendible");
  if (sharp.length && always((a, b) => b - a)) errors.push("la opción más larga es siempre la defendible");
  if (sharp.length && always((a, b) => a - b)) errors.push("la opción más corta es siempre la defendible");
  // Y tampoco casi siempre: a lo más la mitad de las decisiones con una sola ruta defendible.
  const longest = sharp.filter((d) => { const l = d.options.map((o) => o.text.length); const top = Math.max(...l); const def = d.options.find((o) => o.tipo === "defendible")!; return def.text.length === top && l.filter((x) => x === top).length === 1; }).length;
  if (longest * 2 > sharp.length) errors.push(`la opción defendible es la más larga en ${longest} de ${sharp.length} decisiones`);
  if (words(r.invitation) < 30) errors.push("falta el correo de entrada");
  for (const s of n1) if (!r.criteria[s]) errors.push(`falta el criterio del paquete para ${s}`);

  if (coincide.length) warnings.push(`cifras por calcular que coinciden con otra cifra a la vista en los documentos: ${coincide.join(", ")}`);
  const pending = steps.filter((s) => s.step.kind === "escribir" && s.step.points).reduce((a, s) => a + s.step.points, 0);
  if (pending) warnings.push(`${pending} de ${r.scale.max * n1.length} puntos son respuestas escritas: no se califican solas y esperan revisión de una persona`);
  warnings.push("sin regla de aprobación: ningún umbral está aprobado ni guardado en el reto");
  if (!r.qa.editorialReviewedAt) warnings.push("sin revisión editorial humana");
  return { errors, warnings };
}

/**
 * Orden en que se muestran las opciones de una decisión. En los datos la defendible suele ir primero;
 * en pantalla se barajan con una semilla fija por paso (siempre el mismo orden para el mismo paso).
 */
export function ordenOpciones<T extends { id: string }>(stepId: string, options: T[]): T[] {
  let h = 2166136261;
  for (const ch of stepId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const out = [...options];
  for (let k = out.length - 1; k > 0; k--) { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; const j = h % (k + 1); [out[k], out[j]] = [out[j], out[k]]; }
  return out;
}
