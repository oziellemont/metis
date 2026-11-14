/**
 * MÊTIS 2.0 · Piloto del Repositorio Académico · lo que decide el servidor.
 *
 * Funciones puras (reciben la identidad y la llave; no leen cookies ni la base), para poder probarlas.
 * Las acciones de servidor (app/ceo/piloto/acciones.ts) comprueban antes que quien llama es del equipo.
 *
 * Reglas:
 *   - El navegador nunca califica, nunca decide puntos ni resultados y nunca recibe una clave antes de tiempo.
 *   - Cada intento queda sellado con la identidad de quien responde, la pieza y su versión.
 *     Un sello de otra persona, de otra pieza o de otra versión no se acepta.
 *   - En el Executive Challenge el intento completo vive en el sello: el orden de las escenas, lo respondido
 *     (que no se cambia), la ayuda pedida y el cierre los aplica el servidor con el motor de siempre.
 */
import { abrir, sellar } from "./sello";
import { scoreVariant, taskReady } from "./experiencias/motor";
import type { Entrega, Experiencia, Respuesta } from "./experiencias/tipos";
import { advanceReto, newIntento, readIntento } from "./reto/motor";
import { vistaReto, type AccionCliente, type VistaReto } from "./reto/publica";
import type { AccionReto, Intento, Reto } from "./reto/tipos";

export type Fallo = { ok: false; error: string };
const fallo = (error: string): Fallo => ({ ok: false, error });

// ───────────────────────────────────────────── experiencias

interface SelloExp { k: "exp"; exp: string; ver: number; user: string; answers: Record<string, Respuesta>; at: string }

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Deja solo respuestas con la forma que pide cada tarea. Lo que no corresponde se descarta. */
export function limpiarRespuestas(x: Experiencia, raw: unknown): Record<string, Respuesta> | null {
  if (!isObj(raw)) return null;
  const out: Record<string, Respuesta> = {};
  for (const t of x.variant.tasks) {
    const a = raw[t.id];
    if (a === undefined || a === null) continue;
    if (t.kind === "cifra") { if (typeof a === "number" && Number.isInteger(a) && a >= 0 && a < 1e9) out[t.id] = a; continue; }
    if (t.kind === "ordenar" || t.kind === "senalar") {
      if (!Array.isArray(a) || a.length > 40 || !a.every((v) => typeof v === "string" && v.length < 80)) continue;
      out[t.id] = [...new Set(a as string[])];
      continue;
    }
    if (!isObj(a) || Object.keys(a).length > 40 || !Object.values(a).every((v) => typeof v === "string" && v.length <= 2000)) continue;
    out[t.id] = Object.fromEntries(Object.entries(a as Record<string, string>).map(([k, v]) => [k, t.kind === "texto" ? v.trim().slice(0, 2000) : v]));
  }
  return out;
}

const entrega = (x: Experiencia, answers: Record<string, Respuesta>, sello: string): Entrega => ({ result: scoreVariant(x.variant, answers), variant: x.variant, notes: x.conversionNotes, sello });

/** Califica una comprobación entregada. Si falta algo por responder, no se califica. */
export function entregarExperiencia(x: Experiencia, user: string, raw: unknown, secret: string, now: string): ({ ok: true } & Entrega) | Fallo {
  const answers = limpiarRespuestas(x, raw);
  if (!answers) return fallo("La entrega no tiene respuestas.");
  if (!x.variant.tasks.every((t) => taskReady(t, answers[t.id]))) return fallo("Falta responder alguna parte de la comprobación.");
  const s: SelloExp = { k: "exp", exp: x.id, ver: x.version, user, answers, at: now };
  return { ok: true, ...entrega(x, answers, sellar(s, secret)) };
}

/** Vuelve a mostrar una comprobación ya entregada a partir de su sello. Se califica de nuevo, nunca se lee un puntaje. */
export function reabrirExperiencia(x: Experiencia, user: string, sello: unknown, secret: string): ({ ok: true } & Entrega) | Fallo {
  const s = abrir<SelloExp>(sello, secret);
  if (!s || s.k !== "exp" || s.exp !== x.id) return fallo("No reconozco esa entrega.");
  if (s.user !== user) return fallo("Esa entrega es de otra cuenta.");
  if (s.ver !== x.version) return fallo("La experiencia cambió de versión: esa entrega ya no corresponde.");
  const answers = limpiarRespuestas(x, s.answers) ?? {};
  return { ok: true, ...entrega(x, answers, sello as string) };
}

// ───────────────────────────────────────────── Executive Challenge

interface SelloReto { k: "reto"; reto: string; ver: number; user: string; id: string; intento: Intento }
export type PasoServidor = { ok: true; vista: VistaReto; sello: string } | Fallo;

const sellarReto = (r: Reto, user: string, id: string, i: Intento, secret: string): PasoServidor =>
  ({ ok: true, vista: vistaReto(r, i), sello: sellar({ k: "reto", reto: r.id, ver: r.version, user, id, intento: i } satisfies SelloReto, secret) });

function abrirReto(r: Reto, user: string, sello: unknown, secret: string): { id: string; intento: Intento } | Fallo {
  const s = abrir<SelloReto>(sello, secret);
  if (!s || s.k !== "reto" || s.reto !== r.id) return fallo("No reconozco ese intento.");
  if (s.user !== user) return fallo("Ese intento es de otra cuenta.");
  if (s.ver !== r.version) return fallo("El reto cambió de versión: ese intento ya no corresponde.");
  // readIntento vuelve a validar todo: orden, respuestas y marcas se recalculan con el reto del servidor.
  return { id: s.id, intento: readIntento(r, s.intento) };
}

/** Abre el reto: retoma el intento sellado si es de esta persona, pieza y versión; si no, uno nuevo. */
export function iniciarReto(r: Reto, user: string, sello: unknown, secret: string, newId: string): PasoServidor & { resumed?: boolean } {
  const back = sello ? abrirReto(r, user, sello, secret) : null;
  if (back && !("ok" in back)) {
    const i = back.intento.phase === "reto" ? advanceReto(r, back.intento, { t: "retomar" }) : back.intento;
    return { ...sellarReto(r, user, back.id, i, secret), resumed: true };
  }
  return sellarReto(r, user, newId, newIntento(r), secret);
}

export type { AccionCliente };

/** Aplica una acción al intento sellado. La hora la pone el servidor. Una acción que no aplica deja todo igual. */
export function accionReto(r: Reto, user: string, sello: unknown, a: AccionCliente, secret: string, now: string): PasoServidor {
  const back = abrirReto(r, user, sello, secret);
  if ("ok" in back) return back;
  let act: AccionReto | null = null;
  if (a?.t === "empezar" || a?.t === "terminar") act = { t: a.t, now };
  else if (a?.t === "ayuda" || a?.t === "avanzar") act = { t: a.t };
  else if (a?.t === "abrir" && typeof a.doc === "string") act = { t: "abrir", doc: a.doc };
  else if (a?.t === "responder" && typeof a.step === "string" && a.value !== undefined && JSON.stringify(a.value).length < 20_000) act = { t: "responder", step: a.step, value: a.value as never };
  if (!act) return fallo("No entendí esa acción.");
  return sellarReto(r, user, back.id, advanceReto(r, back.intento, act), secret);
}
