/**
 * MÊTIS 2.0 · Executive Challenge · lo que puede llegar al navegador.
 *
 * El reto completo (puntos por opción, rutas defendibles, notas, marcas críticas, cifras correctas, grupos,
 * órdenes y piezas de referencia, criterios, marcas que cambian la historia) se queda en el servidor.
 * El navegador recibe una vista: la escena actual, el paso actual sin clave y, si ya respondió, la consecuencia
 * que dan los personajes. Solo al terminar recibe el informe y el detalle de los pasos que recorrió.
 */
import { holds, informeOf, nextStep, ordenOpciones, pathOf, progressOf, stepById, stepDone, textOf } from "./motor";
import type { Campo, Documento, Grupo, Informe, Intento, Linea, PasoReto, RespuestaReto, Reto } from "./tipos";

interface PasoPublicoBase { id: string; skill: string | null; from: string | null; text: string }
export type PasoPublico =
  | (PasoPublicoBase & { kind: "decision"; options: { id: string; text: string }[] })
  | (PasoPublicoBase & { kind: "cifras"; fields: { id: string; label: string; unit: "$" | "%" | "" }[] })
  | (PasoPublicoBase & { kind: "clasificar"; groups: Grupo[]; items: { id: string; text: string }[] })
  | (PasoPublicoBase & { kind: "ordenar"; cards: { id: string; text: string }[] })
  | (PasoPublicoBase & { kind: "armar"; slots: { id: string; label: string; choices: { id: string; text: string }[] }[] })
  | (PasoPublicoBase & { kind: "escribir"; fields: Campo[] })
  | (PasoPublicoBase & { kind: "dato"; items: string[] });

/** Lo único que el navegador puede pedir. La hora, el orden y los puntos los pone el servidor. */
export type AccionCliente =
  | { t: "empezar" } | { t: "abrir"; doc: string } | { t: "ayuda" } | { t: "avanzar" } | { t: "terminar" }
  | { t: "responder"; step: string; value: unknown };

/** La portada del reto: lo que se ve antes de empezar. Sin escenas ni pasos. */
export interface RetoPublico {
  id: string; editorialId: string; slug: string; version: number; packageVersion: string; title: string;
  invitation: string; role: string; company: string;
  characters: Reto["characters"]; acts: Reto["acts"];
  scaleMax: number; scenes: number; observedScenes: number;
  qa: Reto["qa"];
}

export interface VistaReto {
  phase: Intento["phase"];
  assisted: boolean;
  /** Documentos que ya están en la sala (los posteriores llegan con su escena). */
  docs: Documento[];
  opened: string[];
  scene: { id: string; act: number; index: number; title: string; intro: string; docs: string[]; first: boolean } | null;
  step: PasoPublico | null;
  /** Lo respondido en el paso actual, y lo que contestan los personajes si fue una decisión. */
  given: RespuestaReto | null;
  chosen: string | null;
  reply: Linea[];
  progress: { act: number; done: number; total: number };
  canNext: boolean;
  last: boolean;
  /** Solo al terminar: el informe calculado en el servidor y el reto con los pasos que se recorrieron. */
  final: { informe: Informe; reto: Reto; intento: Intento } | null;
  /** Notas de conversión: llegan al terminar. */
  notes: string[];
}

export function retoPublico(r: Reto): RetoPublico {
  return {
    id: r.id, editorialId: r.editorialId, slug: r.slug, version: r.version, packageVersion: r.packageVersion, title: r.title,
    invitation: r.invitation, role: r.role, company: r.company, characters: r.characters, acts: r.acts,
    scaleMax: r.scale.max, scenes: r.scenes.length, observedScenes: r.scenes.filter((s) => s.skills.length).length, qa: r.qa,
  };
}

export function pasoPublico(p: PasoReto, flags: Record<string, string>): PasoPublico {
  const base = { id: p.id, skill: p.skill, from: p.from, text: textOf(p.text, flags) };
  switch (p.kind) {
    case "decision": return { ...base, kind: "decision", options: ordenOpciones(p.id, p.options).map((o) => ({ id: o.id, text: o.text })) };
    case "cifras": return { ...base, kind: "cifras", fields: p.fields.map((f) => ({ id: f.id, label: f.label, unit: f.unit })) };
    case "clasificar": return { ...base, kind: "clasificar", groups: p.groups.map((g) => ({ ...g })), items: p.items.map((i) => ({ id: i.id, text: i.text })) };
    case "ordenar": return { ...base, kind: "ordenar", cards: p.cards.map((c) => ({ ...c })) };
    case "armar": return { ...base, kind: "armar", slots: p.slots.map((s) => ({ id: s.id, label: s.label, choices: s.choices.map((c) => ({ ...c })) })) };
    case "escribir": return { ...base, kind: "escribir", fields: p.fields.map((f) => ({ ...f })) };
    case "dato": return { ...base, kind: "dato", items: [...p.items] };
  }
}

/** Mismo criterio que validAnswer del motor, con lo que el navegador sí tiene: para habilitar el botón. */
export function respuestaValida(p: PasoPublico, v: RespuestaReto | undefined): boolean {
  if (v === undefined) return false;
  const obj = !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every((x) => typeof x === "string");
  const a = v as Record<string, string>;
  switch (p.kind) {
    case "decision": return typeof v === "string" && p.options.some((o) => o.id === v);
    case "ordenar": return Array.isArray(v) && v.length === p.cards.length && [...v].sort().every((id, k) => id === p.cards.map((c) => c.id).sort()[k]);
    case "cifras": return obj && p.fields.every((f) => /^\d{1,9}$/.test(a[f.id] ?? ""));
    case "clasificar": return obj && p.items.every((i) => p.groups.some((g) => g.id === a[i.id]));
    case "armar": return obj && p.slots.every((s) => s.choices.some((c) => c.id === a[s.id]));
    case "escribir": return obj && Object.keys(a).every((k) => p.fields.some((f) => f.id === k));
    case "dato": return false;
  }
}

/** El reto con solo los pasos que aparecieron en el camino de este intento (para el informe final). */
export function retoRecorrido(r: Reto, i: Intento): Reto {
  return { ...r, scenes: r.scenes.map((s) => ({ ...s, steps: s.steps.filter((p) => holds(p.when, i.flags)) })) };
}

export function vistaReto(r: Reto, i: Intento): VistaReto {
  const cur = i.at ? stepById(r, i.at) : undefined;
  const sceneIdx = cur ? r.scenes.indexOf(cur.scene) : i.phase === "fin" ? r.scenes.length : -1;
  const docs = i.phase === "inicio" ? [] : r.docs.filter((d) => !d.from || r.scenes.findIndex((s) => s.id === d.from) <= sceneIdx).map(({ from: _f, ...d }) => { void _f; return d; });
  const prog = progressOf(r, i);
  const live = i.phase === "reto" && cur;
  const given = live && cur.step.id in i.answers ? i.answers[cur.step.id] : null;
  const opt = live && cur.step.kind === "decision" && typeof given === "string" ? cur.step.options.find((o) => o.id === given) : undefined;
  return {
    phase: i.phase,
    assisted: i.assisted,
    docs,
    opened: i.opened.filter((d) => docs.some((q) => q.id === d)),
    scene: live ? {
      id: cur.scene.id, act: cur.scene.act, index: sceneIdx, title: cur.scene.title, intro: textOf(cur.scene.intro, i.flags),
      docs: cur.scene.docs.filter((d) => docs.some((q) => q.id === d)),
      first: pathOf(r, i.flags).find((s) => s.scene.id === cur.scene.id)?.step.id === cur.step.id,
    } : null,
    step: live ? pasoPublico(cur.step, i.flags) : null,
    given,
    chosen: opt?.id ?? null,
    reply: opt ? opt.reply : [],
    progress: { act: prog.act, done: prog.done, total: prog.total },
    canNext: !!live && stepDone(r, i),
    last: !!live && !nextStep(r, i),
    final: i.phase === "fin" ? { informe: informeOf(r, i), reto: retoRecorrido(r, i), intento: i } : null,
    notes: i.phase === "fin" ? r.conversionNotes : [],
  };
}
