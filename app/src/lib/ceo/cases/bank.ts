/**
 * mêtis CEO · Banco de casos (P1-C) · generador.
 *
 * Arma casos jugables (Item) a partir de un arquetipo de decisión (archetypes.ts), los hechos de una industria
 * (contexts.ts) y el elenco de la empresa. Todo es puro y determinista: el mismo jugador, el mismo mes, ve los
 * mismos casos (se puede reproducir desde el diario y validar en el servidor).
 *
 * Cómo se renueva solo (el ciclo que se retroalimenta):
 *  1. Cada mes de la carrera continua, desde «Estabilizar», llegan casos nuevos del banco.
 *  2. Se eligen primero los arquetipos que el jugador todavía no ha vivido, y entre ellos, los de las áreas donde
 *     sus decisiones han sido más flojas (lo que decidió en los meses cerrados). Así practica lo que más necesita.
 *  3. Cuando ya vivió un arquetipo, vuelve con otro giro (la misma decisión con otra presión). Con 18 arquetipos y
 *     3 giros hay 54 casos por industria antes de repetir, y luego el ciclo vuelve a empezar por lo más flojo.
 * Agregar un arquetipo o una industria es agregar datos: el generador, las pruebas y el motor no cambian.
 */
import type { Area, CastId, CompanyPack, Item, Option } from "../types";
import { ARCHETYPES, type Archetype, type Role } from "./archetypes";
import { CONTEXTS, type IndustryContext } from "./contexts";

export const BANK_PREFIX = "bk-";
const LETTERS = ["a", "b", "c"] as const;

/** Industria de cada paquete jugable (la prueba la compara con taxonomy.ts). */
export const PACK_CONTEXT: Readonly<Record<string, string>> = Object.freeze({ cumbre: "alimentos_bebidas", forja: "autopartes", brasa: "restaurantes" });

/** Quién ocupa cada rol en cada paquete. */
export const PACK_ROLES: Readonly<Record<string, Record<Role, CastId>>> = Object.freeze({
  cumbre: { chair: "ramiro", board: "carla", cfo: "lucia", ops: "javier", sales: "hector", people: "mariana", assistant: "paty", frontline: "roberto", client: "sofia" },
  forja: { chair: "zertuche", board: "regina", cfo: "marcos", ops: "ramon", sales: "daniela", people: "teresa", assistant: "paty", frontline: "fermin", client: "greg" },
  brasa: { chair: "ignacio", board: "lourdes", cfo: "fer", ops: "andres", sales: "sara", people: "vero", assistant: "paty", frontline: "maru", client: "nico" },
});

export const bankItemId = (packId: string, archetype: string, twist: number) => `${BANK_PREFIX}${packId}-${archetype}-${twist + 1}`;
export const isBankId = (id: string) => id.startsWith(BANK_PREFIX);
/** Arquetipo de un id del banco (o undefined). */
export function bankArchetypeOf(id: string): string | undefined {
  if (!isBankId(id)) return undefined;
  const parts = id.slice(BANK_PREFIX.length).split("-");
  return parts.length === 3 ? parts[1] : undefined;
}

/** Pseudo-aleatorio estable 0…1 (FNV-1a), igual que el del motor. */
function rand01(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return ((h >>> 0) % 100000) / 100000;
}

/** Nombre corto con que se habla de alguien en el texto: «Don Ramiro Garza» → Ramiro, «Fernanda «Fer» Ruvalcaba» → Fer. */
export function callName(full: string): string {
  const nick = full.match(/«([^»]+)»/);
  if (nick) return nick[1];
  const words = full.split(/\s+/).filter((w) => !/^(Don|Doña|Ing\.|Lic\.|Dr\.|Dra\.|Chef)$/.test(w));
  return words[0] ?? full;
}

/**
 * Construye un caso del banco. `cast` resuelve cada rol a una persona; `short` es el nombre corto de la empresa
 * (el cambio al nombre que eligió el jugador lo hace después brandPack, igual que con el resto del paquete).
 */
export function buildCase(a: Archetype, ctx: IndustryContext, twist: number, packId: string, roles: Record<Role, CastId>, names: Record<CastId, string>, short: string): Item {
  const id = bankItemId(packId, a.id, twist);
  const who = (r: Role) => roles[r];
  const fill = (t: string) =>
    t.replace(/\{(chair|board|cfo|ops|sales|people|assistant|frontline|client)\}/g, (_m, r: Role) => callName(names[who(r)] ?? r))
      .replace(/\{cliente\}/g, ctx.vars.cliente).replace(/\{clientes\}/g, ctx.vars.clientes).replace(/\{lote\}/g, ctx.vars.lote).replace(/\{afectado\}/g, ctx.vars.afectado)
      .replace(/\{company_short\}/g, short);
  const facts = ctx.cases[a.id];
  const said = [...facts.body.map(fill), fill(a.twists[twist])];
  // La llamada perdida empieza con la duración del mensaje de voz (la pantalla la usa como etiqueta del audio).
  const body = a.channel === "llamada" ? [`Mensaje de voz · 0:${String(35 + Math.floor(rand01(id) * 20))}`, ...said] : said;
  const from = who(a.from);
  const involves = [...new Set(a.involves.map(who))].filter((x) => x !== from);
  const options: Option[] = a.options.map((o, i) => ({
    id: LETTERS[i], text: fill(o.text), reply: o.reply.map(fill), outcome: fill(o.outcome), effects: { ...o.effects }, style: { ...o.style }, score: o.score,
    stance: Object.fromEntries(Object.entries(o.stance).map(([r, v]) => [who(r as Role), v as number])),
  }));
  // El orden de las opciones cambia con el giro: la mejor nunca está siempre en el mismo lugar.
  const order = [0, 1, 2].sort((x, y) => rand01(`${id}|${x}`) - rand01(`${id}|${y}`));
  // Vista previa: el primer párrafo que no es saludo («Estimado Director:», «Hola:»).
  const first = said.find((p) => !/:\s*$/.test(p) && p.length > 20) ?? said[0];
  return {
    id, day: 2, slot: 1, channel: a.channel, from, involves,
    // En WhatsApp el asunto es el nombre de quien escribe (como en el resto del paquete).
    subject: a.channel === "whatsapp" ? names[from] ?? fill(facts.subject) : fill(facts.subject),
    preview: first.length > 110 ? `${first.slice(0, 107).trimEnd()}…` : first,
    body,
    data: { title: a.dataTitle, rows: facts.rows.map(([k, v]) => [fill(k), fill(v)] as [string, string]) },
    ask: fill(a.ask),
    options: order.map((i) => options[i]),
    expired: { reply: a.expired.reply.map(fill), outcome: fill(a.expired.outcome), effects: { ...a.expired.effects } },
    lesson: a.lesson,
    bitacora: { ...a.bitacora },
    areas: [...a.areas],
    real: { company: a.real.company, title: a.real.title, text: a.real.text },
    ...(a.deadlineH ? { deadlineH: a.deadlineH } : {}),
  };
}

// ───────────────────────────────────────────── banco por paquete
const BANKS = new WeakMap<CompanyPack, Item[]>();
/** Todos los casos posibles del banco para una empresa (arquetipos × giros). Vacío si la industria no tiene contexto o elenco. */
export function bankItems(pack: CompanyPack): Item[] {
  const hit = BANKS.get(pack);
  if (hit) return hit;
  const ctx = CONTEXTS[PACK_CONTEXT[pack.id] ?? ""];
  const roles = PACK_ROLES[pack.id];
  const names = Object.fromEntries(Object.values(pack.cast).map((p) => [p.id, p.name]));
  const items = ctx && roles ? ARCHETYPES.flatMap((a) => a.twists.map((_t, i) => buildCase(a, ctx, i, pack.id, roles, names, pack.short))) : [];
  BANKS.set(pack, items);
  return items;
}
const WITH = new WeakMap<CompanyPack, CompanyPack>();
/**
 * El paquete con sus asuntos de siempre MÁS todos los casos del banco. Es estable (misma referencia para el mismo
 * paquete), así que sizedPack y brandPack lo escalan y le ponen tu nombre con su memoria de siempre, y toda búsqueda
 * por id (decisiones de meses anteriores, importar, responder por escrito) encuentra los casos del banco.
 * Qué casos llegan cada mes lo decide bankMonth; este paquete solo es el catálogo.
 */
export function withBank(pack: CompanyPack): CompanyPack {
  const hit = WITH.get(pack);
  if (hit) return hit;
  const out: CompanyPack = { ...pack, items: [...pack.items, ...bankItems(pack)] };
  WITH.set(pack, out);
  return out;
}

// ───────────────────────────────────────────── selección del mes
export interface BankHistory {
  /** Ids del banco que ya llegaron en meses cerrados (en orden). */
  seen: readonly string[];
  /** Ids del banco del último mes cerrado (no se repite su arquetipo de inmediato). */
  last: readonly string[];
  /** Calidad de tus decisiones por área en meses cerrados (suma de puntaje/3 y número de decisiones). */
  quality: Partial<Record<Area, { sum: number; n: number }>>;
}

/** Qué tan floja es un área para ti (0 = dominada, 1 = muy floja). Sin evidencia cuenta como media: hay que explorarla. */
export function weaknessOf(q: BankHistory["quality"], areas: readonly Area[]): number {
  const vals = areas.map((a) => { const x = q[a]; return x && x.n ? 1 - x.sum / x.n : 0.5; });
  return vals.reduce((s, v) => s + v, 0) / Math.max(1, vals.length);
}

export interface BankPick { id: string; archetype: string; twist: number; reason: "nuevo" | "giro" }

/**
 * Casos del banco para el mes. Determinista: depende solo del historial (meses cerrados), la etapa y la semilla.
 * Prioridad: arquetipo nunca visto > con giros pendientes > reciclado; dentro de cada grupo, el área más floja.
 */
export function pickBank(packId: string, stage: number, h: BankHistory, seed: string, n: number): BankPick[] {
  const seen = new Set(h.seen);
  const lastArch = new Set(h.last.map(bankArchetypeOf));
  const count = (a: string) => h.seen.filter((x) => bankArchetypeOf(x) === a).length;
  const cands = ARCHETYPES.filter((a) => a.minStage <= stage).map((a) => {
    const c = count(a.id);
    // Primer giro que no has visto; si ya viste los tres, el ciclo vuelve a empezar.
    let twist = a.twists.findIndex((_t, i) => !seen.has(bankItemId(packId, a.id, i)));
    const fresh = twist >= 0;
    if (!fresh) twist = c % a.twists.length;
    const group = c === 0 ? 0 : fresh ? 1 : 2;
    const score = group * 10 + (lastArch.has(a.id) ? 5 : 0) - weaknessOf(h.quality, a.areas) * 2 + rand01(`${seed}|${a.id}`) * 0.5;
    return { a, twist, score, reason: (c === 0 ? "nuevo" : "giro") as BankPick["reason"] };
  });
  cands.sort((x, y) => x.score - y.score || x.a.id.localeCompare(y.a.id));
  return cands.slice(0, n).map((c) => ({ id: bankItemId(packId, c.a.id, c.twist), archetype: c.a.id, twist: c.twist, reason: c.reason }));
}

/** Cuántos casos del banco llegan en un mes según la etapa (ninguno al tomar el mando). */
export const bankSizeFor = (stage: number): number => (stage <= 0 ? 0 : stage === 1 ? 3 : 4);
/** Días del mes en que llegan (el primer día ya no trae llegada desde «Estabilizar»). */
export const BANK_DAYS = [2, 4, 6, 3] as const;

// ───────────────────────────────────────────── plan de la carrera (se reconstruye desde los meses cerrados)
/** Lo mínimo de un mes cerrado que usa el plan. */
export interface BankRun { passed: boolean; decisions: Record<string, { option: string }> }
export interface BankMonth {
  /** Casos del banco que llegan este mes (ids). */
  picks: BankPick[];
  /** Asuntos del paquete que ya decidiste dos veces o más: se retiran este mes y su lugar lo toma un caso del banco. */
  stale: string[];
}
/** A partir de «Construir capacidad», lo que ya viviste dos veces cede su lugar a casos nuevos. */
export const STALE_FROM_STAGE = 2;
export const STALE_AFTER = 2;
const MAX_BANK = ARCHETYPES.length;

/**
 * Casos del banco del mes `runs.length` (el que está en curso). Recorre los meses cerrados en orden, reconstruyendo
 * lo que llegó en cada uno: así un caso que dejaste vencer también cuenta como visto y no vuelve igual.
 * `stageAt(k)` es la etapa al empezar el mes k; `items` es el paquete con su banco (withBank).
 */
export function bankMonth(packId: string, runs: readonly BankRun[], stageAt: (k: number) => number, items: readonly Item[], seed: string): BankMonth {
  const base = new Map(items.map((i) => [i.id, i]));
  const seen: string[] = [];
  let last: string[] = [];
  const quality: BankHistory["quality"] = {};
  const decidedTimes = new Map<string, number>();
  let month: BankMonth = { picks: [], stale: [] };
  for (let k = 0; k <= runs.length; k++) {
    const stage = stageAt(k);
    const stale = stage >= STALE_FROM_STAGE ? [...decidedTimes].filter(([id, n]) => n >= STALE_AFTER && !isBankId(id) && base.has(id) && !base.get(id)!.trigger).map(([id]) => id).sort() : [];
    const n = Math.min(MAX_BANK, bankSizeFor(stage) + stale.length);
    const picks = pickBank(packId, stage, { seen, last, quality }, `${seed}|${k}`, n);
    // Solo se retiran tantos asuntos como casos nuevos alcancen a cubrir.
    month = { picks, stale: stale.slice(0, Math.max(0, picks.length - bankSizeFor(stage))) };
    if (k === runs.length) break;
    const r = runs[k];
    for (const p of picks) seen.push(p.id);
    last = picks.map((p) => p.id);
    for (const [id, d] of Object.entries(r.decisions ?? {})) {
      const it = base.get(id);
      const o = it?.options.find((x) => x.id === d.option);
      if (!it || !o) continue;
      if (!isBankId(id)) decidedTimes.set(id, (decidedTimes.get(id) ?? 0) + 1);
      for (const a of it.areas) { const q = (quality[a] ??= { sum: 0, n: 0 }); q.sum += o.score / 3; q.n++; }
    }
  }
  return month;
}
