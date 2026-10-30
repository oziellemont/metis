/**
 * mêtis CEO · motor de Executive Decision Episodes (puro: sin red, sin reloj, sin React).
 *
 * Máquina de estados de un episodio:
 *   briefing (consultas, colaborador, ventana de 180 s pausable) → deciding (3–6 decisiones conectadas) → closed.
 *
 * Reglas que este archivo garantiza (y prueba episodes.test.ts):
 *  - Las consultas de hechos solo responden con textos del FactBank (la IA, si existe, solo elige cuál).
 *  - Un fallo del sistema o una pregunta que no corresponde a ningún dato no consume consulta.
 *  - Al vencer la ventana se bloquean las consultas, nunca la decisión, y no se elige nada por ti.
 *  - Pausar detiene el reloj del briefing; en modo flexible no hay reloj.
 *  - Ninguna decisión mueve KPI: el cierre los calcula una sola vez con reglas económicas declaradas.
 *  - El XP del episodio se fija una sola vez al cerrar (reaplicar acciones no lo duplica).
 */
import {
  BRIEFING_MS, EPISODE_CONTRACT_VERSION, MAX_ADVISOR_CONSULTS, MAX_FACT_QUERIES,
  type AdvisorBrief, type Cond, type DecisionTurn, type EpisodeNode, type EpisodeRun, type EpisodeSpec, type Fact, type ParamSpec, type RevealBlock, type Strategy, type Variant,
} from "./contracts";
import { closeOutcome, deriveTerms } from "./rules";

export const EPISODE_XP = { decision: 20, close: 40 } as const;
export const TRUST_MIN = -3;
export const TRUST_MAX = 3;

// ───────────────────────────────────────────── utilidades
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

/** Número pseudoaleatorio estable en [0,1) a partir de un texto (factores fuera de control, reproducibles). */
export function seeded(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

const CMP = /^([a-z_]+)\s*(>=|<=|!=|>|<|=)\s*(-?\d+(?:\.\d+)?)$/;
function atom(run: Pick<EpisodeRun, "flags" | "terms" | "trust">, a: string): boolean {
  const m = a.match(CMP);
  if (!m) return run.flags.includes(a);
  const v = m[1] === "trust" ? run.trust : run.terms[m[1]] ?? 0;
  const n = Number(m[3]);
  switch (m[2]) {
    case ">=": return v >= n;
    case "<=": return v <= n;
    case ">": return v > n;
    case "<": return v < n;
    case "=": return Math.abs(v - n) < 1e-9;
    default: return Math.abs(v - n) >= 1e-9;
  }
}
export function holds(run: Pick<EpisodeRun, "flags" | "terms" | "trust">, c?: Cond): boolean {
  if (!c) return true;
  if (c.all && !c.all.every((a) => atom(run, a))) return false;
  if (c.any && !c.any.some((a) => atom(run, a))) return false;
  if (c.none && c.none.some((a) => atom(run, a))) return false;
  return true;
}

export function fmtTerm(spec: EpisodeSpec, key: string, v: number): string {
  const t = spec.terms[key];
  if (!t) return String(v);
  const d = t.decimals ?? (Number.isInteger(v) ? 0 : 1);
  const n = v.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
  return t.unit ? `${n} ${t.unit}` : n;
}

/** Elige la variante que aplica y sustituye `{t:clave}` por lo acordado. */
export function render(spec: EpisodeSpec, run: Pick<EpisodeRun, "flags" | "terms" | "trust">, vs: Variant[]): string[] {
  const v = vs.find((x) => holds(run, x.when)) ?? vs[vs.length - 1];
  if (!v) return [];
  return v.text.map((p) => p.replace(/\{t:([a-z_]+)\}/g, (_, k: string) => fmtTerm(spec, k, run.terms[k] ?? spec.terms[k]?.initial ?? 0)));
}

// ───────────────────────────────────────────── inicio
export interface StartContext {
  /** Decisiones de la temporada (item → opción), para la memoria previa (p. ej. si comiste con Héctor). */
  decisions?: Record<string, { option: string }>;
  mode?: "estandar" | "flexible";
  runId?: string;
}

export function startEpisode(spec: EpisodeSpec, at: number, ctx: StartContext = {}): EpisodeRun {
  const runId = ctx.runId ?? `${spec.id}:${at}`;
  const flags: string[] = [];
  for (const h of spec.history ?? []) if (h.options.includes(ctx.decisions?.[h.item]?.option ?? "")) flags.push(h.flag);
  for (const ch of spec.chance ?? []) if (seeded(`${runId}:${ch.flag}`) < ch.p) flags.push(ch.flag);
  const terms0 = Object.fromEntries(Object.entries(spec.terms).map(([k, t]) => [k, t.initial]));
  const terms = deriveTerms(spec, { flags, terms: terms0, trust: 0 });
  return {
    contract: EPISODE_CONTRACT_VERSION, episode: spec.id, version: spec.version, runId,
    startedAt: at, updatedAt: at, phase: "briefing", paused: false, node: null,
    flags, terms, trust: 0,
    briefing: { mode: ctx.mode ?? "estandar", activeMs: 0, resumedAt: at, endedAt: null },
    queries: [], advisor: null, turns: [], closedAt: null, outcome: null, xp: null,
  };
}

// ───────────────────────────────────────────── briefing
/** Milisegundos usados de la ventana de preparación. */
export function briefingUsedMs(run: EpisodeRun, now: number): number {
  const b = run.briefing;
  return b.activeMs + (b.resumedAt !== null && run.phase === "briefing" && !run.paused ? Math.max(0, now - b.resumedAt) : 0);
}
/** Tiempo restante (Infinity en modo flexible). */
export function briefingLeftMs(run: EpisodeRun, now: number): number {
  if (run.briefing.mode === "flexible") return Infinity;
  return Math.max(0, BRIEFING_MS - briefingUsedMs(run, now));
}
export const briefingOpen = (run: EpisodeRun, now: number) => run.phase === "briefing" && !run.paused && briefingLeftMs(run, now) > 0;
export const queriesLeft = (run: EpisodeRun) => MAX_FACT_QUERIES - run.queries.filter((q) => q.factId !== null).length;
export const advisorLeft = (run: EpisodeRun) => MAX_ADVISOR_CONSULTS - (run.advisor ? 1 : 0);
export const criticalFacts = (spec: EpisodeSpec) => spec.facts.facts.filter((f) => f.critical);

export type FactMatch = { kind: "fact"; fact: Fact } | { kind: "unknown"; id: string; answer: string } | null;

/** Busca en el FactBank por palabras clave. Sin coincidencia → null (no consume consulta). */
export function matchFact(spec: EpisodeSpec, text: string): FactMatch {
  const t = ` ${norm(text)} `;
  const score = (kws: string[]) => kws.reduce((n, k) => n + (t.includes(norm(k)) ? 1 : 0), 0);
  let best: FactMatch = null, bestN = 0;
  for (const f of spec.facts.facts) { if (f.critical) continue; const n = score(f.keywords); if (n > bestN) { best = { kind: "fact", fact: f }; bestN = n; } }
  for (const u of spec.facts.unknowns) { const n = score(u.keywords); if (n > bestN) { best = { kind: "unknown", id: u.id, answer: u.answer }; bestN = n; } }
  return best;
}

export function advisorAnswer(spec: EpisodeSpec, run: EpisodeRun, a: AdvisorBrief): string {
  return render(spec, run, a.view).join("\n");
}

// ───────────────────────────────────────────── decisiones
export const nodeOf = (spec: EpisodeSpec, run: EpisodeRun): EpisodeNode | null => (run.node ? spec.nodes[run.node] ?? null : null);
export const strategiesFor = (spec: EpisodeSpec, run: EpisodeRun): Strategy[] => (nodeOf(spec, run)?.strategies ?? []).filter((s) => holds(run, s.requires));

/** Ajusta un parámetro a sus límites y a su paso. */
export function clampParam(p: ParamSpec, v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : p.default;
  const stepped = Math.round((n - p.min) / p.step) * p.step + p.min;
  return Math.round(Math.max(p.min, Math.min(p.max, stepped)) * 1000) / 1000;
}

/** Bloques de datos que se revelan en el nodo actual, con `{t:}` sustituido. */
export function revealOf(spec: EpisodeSpec, run: EpisodeRun): RevealBlock[] {
  const n = nodeOf(spec, run);
  const sub = (x: string) => render(spec, run, [{ text: [x] }])[0] ?? x;
  return (n?.reveal ?? []).filter((b) => holds(run, b.when)).map((b) => ({ title: b.title, rows: b.rows.map(([k, v]) => [sub(k), sub(v)] as [string, string]), ...(b.note ? { note: sub(b.note) } : {}) }));
}

/** Lo que dice el interlocutor en el nodo actual (con memoria). */
export function sayOf(spec: EpisodeSpec, run: EpisodeRun): string[] {
  const n = nodeOf(spec, run);
  return n ? render(spec, run, n.say) : [];
}

// ───────────────────────────────────────────── acciones
export type EpisodeAction =
  | { type: "fact"; at: number; factId?: string; unknownId?: string; text?: string; via?: "sugerida" | "libre" | "ia" }
  | { type: "advisor"; at: number; id: string; question?: string; answer?: string }
  | { type: "begin"; at: number }
  | { type: "pause"; at: number }
  | { type: "resume"; at: number }
  | { type: "flexible"; at: number }
  | { type: "decide"; at: number; strategy: string; params?: Record<string, number>; text?: string; interpretation?: DecideInterpretation };

/** Lo que la IA entendió del texto libre (ya validado en servidor). El motor vuelve a acotar todo. */
export interface DecideInterpretation {
  quality: 0 | 1 | 2 | 3;
  feedback: string;
  status?: "clara" | "parcial";
  extras?: string;
  /** Tono hacia el interlocutor: mueve la confianza ±1 (y con ello lo que pasa después). */
  tone?: -1 | 0 | 1;
  /** Reacción del personaje adaptada a sus palabras, y la respuesta del autor de la que salió. Se usa solo si esa base
   *  sigue siendo la respuesta del autor después de aplicar el tono (si el tono cambió el desenlace, manda el autor)
   *  y si no trae cifras ajenas. */
  reply?: string[];
  basis?: string;
}

const nums = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
const STOPW = new Set("porque cuando sobre entre hasta desde donde quiero tenemos vamos hacer todos todas nuestro nuestra antes despues tambien ademas mismo misma ahora quiere puede pueden seguir solo eso esto esta este estas estos pero como para".split(" "));
/** Palabras con contenido (5+ letras), comparadas por su raíz de 5 letras para tolerar conjugaciones. */
const roots = (s: string) => new Set(norm(s).split(/[^a-z0-9ñ]+/).filter((w) => w.length >= 5 && !STOPW.has(w)).map((w) => w.slice(0, 5)));
/**
 * Reacción adaptada a las palabras del jugador: se acepta solo si es fiel a la respuesta del autor.
 *  - cifras: solo las que ya están en la respuesta del autor, en lo que le dijeron o en sus términos; y conserva todas las del autor;
 *  - no hace preguntas nuevas (si el autor no pregunta, ella tampoco);
 *  - conserva el contenido: al menos la mitad de las palabras clave del autor y un tercio de las de cada línea.
 * Si no cumple, se usa la respuesta del autor. La usan el servidor (al validar) y el motor (otra vez, al decidir).
 */
export function adaptationOk(reply: unknown, authored: string[], said: string[], terms: Record<string, number>): string[] | null {
  if (!Array.isArray(reply)) return null;
  const parts = reply.filter((x): x is string => typeof x === "string").map((x) => x.replace(/\s+/g, " ").trim().slice(0, 400)).filter(Boolean).slice(0, 4);
  const all = parts.join(" ");
  if (!parts.length || all.length < 15 || all.length > 700) return null;
  const base = authored.join(" ");
  // Ronda 6: restos de formato (JSON o bloques de código que el modelo coló en una línea).
  if (/```|\]\s*\}|\{\s*"|"\s*:\s*[\[{"]|\bjson\b/i.test(all) && !/```|\{"/.test(base)) return null;
  // Moralejas que el autor no escribió («es fundamental que…», «la clave es…»).
  const MORAL = /\b(es (fundamental|crucial|clave|importante|esencial|vital) (que|para|tener|mantener|actuar)|la clave (es|esta)|lo importante es|a veces las decisiones)\b/;
  if (MORAL.test(norm(all)) && !MORAL.test(norm(base))) return null;
  // Una línea del autor copiada dos veces (la reacción repitió el texto de otra línea).
  const flat = (x: string) => norm(x).replace(/[^a-z0-9ñ]+/g, " ").trim();
  for (const line of authored) {
    const k = flat(line);
    if (k.length >= 12 && parts.filter((p) => flat(p).includes(k)).length > 1) return null;
  }
  const allowed = new Set([...nums(base), ...nums(said.join(" ")), ...Object.values(terms).map(String)]);
  const got = new Set(nums(all));
  if ([...got].some((n) => !allowed.has(n))) return null;
  if (nums(base).some((n) => !got.has(n))) return null;
  if (!/[?¿]/.test(base) && /[?¿]/.test(all)) return null;
  const have = roots(all);
  const need = roots(base);
  if (need.size && [...need].filter((w) => have.has(w)).length / need.size < 0.5) return null;
  for (const line of authored) {
    const k = roots(line);
    if (k.size >= 2 && [...k].filter((w) => have.has(w)).length / k.size < 1 / 3) return null;
  }
  return parts;
}

export interface ActResult { run: EpisodeRun; error?: string }

const addFlag = (fs: string[], f: string) => (fs.includes(f) ? fs : [...fs, f]);
const fail = (run: EpisodeRun, error: string): ActResult => ({ run, error });

export function applyEpisode(spec: EpisodeSpec, run: EpisodeRun, a: EpisodeAction): ActResult {
  if (run.episode !== spec.id) return fail(run, "Este episodio no corresponde.");
  if (run.phase === "closed") return fail(run, "El caso ya está cerrado.");
  const at = a.at;
  switch (a.type) {
    case "pause": {
      if (run.paused) return fail(run, "Ya está en pausa.");
      const b = run.briefing;
      const activeMs = run.phase === "briefing" && b.resumedAt !== null ? b.activeMs + Math.max(0, at - b.resumedAt) : b.activeMs;
      return { run: { ...run, paused: true, updatedAt: at, briefing: { ...b, activeMs, resumedAt: null } } };
    }
    case "resume": {
      if (!run.paused) return fail(run, "No está en pausa.");
      return { run: { ...run, paused: false, updatedAt: at, briefing: { ...run.briefing, resumedAt: run.phase === "briefing" ? at : null } } };
    }
    case "flexible": {
      if (run.phase !== "briefing") return fail(run, "La preparación ya terminó.");
      return { run: { ...run, updatedAt: at, briefing: { ...run.briefing, mode: "flexible" } } };
    }
    case "fact": {
      if (run.phase !== "briefing") return fail(run, "La preparación ya terminó.");
      if (run.paused) return fail(run, "Reanuda el caso para consultar.");
      if (briefingLeftMs(run, at) <= 0) return fail(run, "La ventana de preparación terminó. Puedes seguir pensando y decidir sin penalización.");
      if (queriesLeft(run) <= 0) return fail(run, "Ya usaste tus dos consultas de hechos.");
      let fact: Fact | undefined, unknown: { id: string; answer: string } | undefined;
      if (a.factId) fact = spec.facts.facts.find((f) => f.id === a.factId && !f.critical);
      else if (a.unknownId) unknown = spec.facts.unknowns.find((u) => u.id === a.unknownId);
      else if (a.text) { const m = matchFact(spec, a.text); if (m?.kind === "fact") fact = m.fact; else if (m?.kind === "unknown") unknown = m; }
      if (!fact && !unknown) return fail(run, spec.facts.missing);
      const key = fact ? fact.id : `?${unknown!.id}`;
      if (run.queries.some((q) => q.factId === key)) return fail(run, "Ya consultaste ese dato. Pregunta otra cosa.");
      const q = { at, text: a.text?.trim().slice(0, 240) || fact?.label || "", factId: key, answer: fact ? fact.answer : unknown!.answer, via: a.via ?? (a.text ? "libre" : "sugerida") } as const;
      return { run: { ...run, updatedAt: at, queries: [...run.queries, q], flags: addFlag(run.flags, `q:${key.replace(/^\?/, "")}`) } };
    }
    case "advisor": {
      if (run.phase !== "briefing") return fail(run, "La preparación ya terminó.");
      if (run.paused) return fail(run, "Reanuda el caso para consultar.");
      if (briefingLeftMs(run, at) <= 0) return fail(run, "La ventana de preparación terminó. Puedes seguir pensando y decidir sin penalización.");
      if (advisorLeft(run) <= 0) return fail(run, "Ya consultaste a tu equipo en este caso.");
      const adv = spec.advisors.find((x) => x.id === a.id);
      if (!adv) return fail(run, "Esa persona no participa en este caso.");
      const ai = typeof a.answer === "string" && a.answer.trim().length > 0;
      const answer = ai ? a.answer!.trim().slice(0, 900) : advisorAnswer(spec, run, adv);
      return { run: { ...run, updatedAt: at, flags: addFlag(run.flags, `a:${adv.id}`), advisor: { at, id: adv.id, ...(a.question ? { question: a.question.trim().slice(0, 240) } : {}), answer, via: ai ? "ia" : "autor" } } };
    }
    case "begin": {
      if (run.phase !== "briefing") return fail(run, "Ya empezaste a decidir.");
      const b = run.briefing;
      const activeMs = b.resumedAt !== null && !run.paused ? b.activeMs + Math.max(0, at - b.resumedAt) : b.activeMs;
      return { run: { ...run, phase: "deciding", paused: false, node: spec.start, updatedAt: at, briefing: { ...b, activeMs, resumedAt: null, endedAt: at } } };
    }
    case "decide": {
      if (run.phase !== "deciding") return fail(run, run.phase === "briefing" ? "Primero empieza a decidir." : "El caso ya está cerrado.");
      if (run.paused) return fail(run, "Reanuda el caso para decidir.");
      const node = nodeOf(spec, run);
      if (!node) return fail(run, "No hay decisión pendiente.");
      const st = strategiesFor(spec, run).find((s) => s.id === a.strategy);
      if (!st) return fail(run, "Esa opción no está disponible en este punto.");
      const terms = { ...run.terms, ...(st.set ?? {}) };
      const chosen: Record<string, number> = {};
      for (const p of st.params ?? []) { terms[p.key] = clampParam(p, a.params?.[p.key]); chosen[p.key] = terms[p.key]; }
      const flags = [...run.flags, ...(st.flags ?? []).filter((f) => !run.flags.includes(f))];
      const text = a.text?.trim().slice(0, 1200);
      const it = text ? a.interpretation : undefined;
      const tone = it?.tone === 1 || it?.tone === -1 ? it.tone : 0;
      const trust = Math.max(TRUST_MIN, Math.min(TRUST_MAX, run.trust + (st.trust ?? 0) + tone));
      const mid = { ...run, terms: deriveTerms(spec, { ...run, terms, flags, trust }), flags, trust };
      const authored = render(spec, mid, st.reply);
      const said = render(spec, run, node.say);
      const adapted = it && it.basis === authored.join("\n") ? adaptationOk(it.reply, authored, said, mid.terms) : null;
      const reply = adapted ?? authored;
      const next = st.next.find((b) => holds(mid, b.when))?.to ?? "close";
      const turn: DecisionTurn = {
        at, node: node.id, stage: node.stage, said,
        input: text ? { kind: "texto", text } : st.params?.length ? { kind: "terminos" } : { kind: "opcion" },
        strategy: st.id, ...(st.params?.length ? { terms: chosen } : {}),
        ...(it ? { interpretation: {
          quality: it.quality, feedback: String(it.feedback ?? "").slice(0, 280),
          ...(it.status ? { status: it.status } : {}),
          ...(it.status === "parcial" && it.extras ? { extras: String(it.extras).slice(0, 140) } : {}),
          ...(tone ? { tone } : {}),
          ...(adapted ? { adapted: true, authored } : {}),
        } } : {}),
        reply,
      };
      let out: EpisodeRun = { ...mid, turns: [...run.turns, turn], updatedAt: at, node: next === "close" ? null : next };
      if (next === "close" || !spec.nodes[next]) {
        const outcome = closeOutcome(spec, out, at);
        out = { ...out, node: null, phase: "closed", closedAt: at, outcome, xp: run.xp ?? episodeXp(out) };
      }
      return { run: out };
    }
  }
}

/** XP de participación del episodio (una sola vez por partida del episodio). */
export const episodeXp = (run: Pick<EpisodeRun, "turns">) => run.turns.length * EPISODE_XP.decision + EPISODE_XP.close;

/** Reproduce una lista de acciones (para validar en servidor o en pruebas). */
export function replayEpisode(spec: EpisodeSpec, start: EpisodeRun, actions: EpisodeAction[]): { run: EpisodeRun; rejected: number[] } {
  let run = start;
  const rejected: number[] = [];
  actions.forEach((a, i) => { const r = applyEpisode(spec, run, a); if (r.error) rejected.push(i); run = r.run; });
  return { run, rejected };
}

/** Sanea una partida guardada (si viene dañada, se descarta y el jugador puede reiniciar el episodio). */
export function sanitizeRun(raw: unknown): EpisodeRun | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<EpisodeRun>;
  if (r.contract !== EPISODE_CONTRACT_VERSION || typeof r.episode !== "string" || typeof r.runId !== "string" || typeof r.startedAt !== "number") return null;
  if (!["briefing", "deciding", "closed"].includes(r.phase as string)) return null;
  if (!Array.isArray(r.flags) || !Array.isArray(r.queries) || !Array.isArray(r.turns) || !r.terms || typeof r.terms !== "object" || !r.briefing) return null;
  return r as EpisodeRun;
}

/** Cuál de dos copias del mismo episodio conservar al sincronizar: la de más progreso (nunca se pierde avance). */
export function pickRun(a: EpisodeRun | undefined, b: EpisodeRun | undefined): EpisodeRun | undefined {
  if (!a) return b;
  if (!b) return a;
  // Partidas distintas del mismo episodio (se reinició en modo prueba): vale la que empezó después.
  if (a.runId !== b.runId) return b.startedAt > a.startedAt ? b : a;
  const rank = (r: EpisodeRun) => (r.phase === "closed" ? 1e6 : 0) + r.turns.length * 1000 + (r.phase === "deciding" ? 500 : 0) + r.queries.length * 10 + (r.advisor ? 5 : 0);
  const ra = rank(a), rb = rank(b);
  if (ra !== rb) return ra > rb ? a : b;
  return (b.updatedAt || 0) > (a.updatedAt || 0) ? b : a;
}

/** Limpia `episodes` al leer un estado guardado: descarta partidas dañadas o de episodios que ya no existen. */
export function sanitizeEpisodes(raw: unknown): Record<string, EpisodeRun> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, EpisodeRun> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const r = sanitizeRun(v);
    if (r && r.episode === k) out[k] = r;
  }
  return Object.keys(out).length ? out : undefined;
}
