/**
 * MÊTIS 2.0 · Lo que de una experiencia puede llegar al navegador.
 *
 * La práctica guiada viaja completa: ahí cada decisión y cada intento traen su explicación, porque es donde se aprende.
 * La comprobación (la variante independiente) viaja sin claves: sin cifras correctas, grupos, órdenes ni renglones
 * de referencia, sin cálculos y sin respuestas de referencia. Las notas de conversión tampoco viajan antes de entregar.
 * Quien califica es el servidor (piloto/acciones.ts), y solo después de entregar devuelve la variante completa.
 */
import type { Experiencia, ExperienciaPublica, Tarea, TareaPublica, VariantePublica } from "./tipos";

export function tareaPublica(t: Tarea): TareaPublica {
  const base = { id: t.id, criterion: t.criterion, prompt: t.prompt, weight: t.weight, origen: t.origen };
  switch (t.kind) {
    case "cifra": return { ...base, kind: "cifra", ...(t.unit !== undefined ? { unit: t.unit } : {}) };
    case "clasificar": return { ...base, kind: "clasificar", groups: t.groups.map((g) => ({ ...g })), items: t.items.map((i) => ({ id: i.id, text: i.text })) };
    case "ordenar": return { ...base, kind: "ordenar", cards: t.cards.map((c) => ({ ...c })) };
    case "senalar": return { ...base, kind: "senalar", doc: t.doc };
    case "texto": return { ...base, kind: "texto", ...(t.fields ? { fields: t.fields.map((f) => ({ ...f })) } : {}) };
  }
}

export function experienciaPublica(x: Experiencia): ExperienciaPublica {
  const { variant: v, conversionNotes: _notes, ...rest } = x;
  void _notes;
  const variant: VariantePublica = { id: v.id, title: v.title, setting: v.setting, question: v.question, intro: v.intro, docs: v.docs, tasks: v.tasks.map(tareaPublica), ...(v.calculator ? { calculator: true } : {}) };
  return { ...rest, variant };
}
