/**
 * Proyecto de cambio: tienes N semanas para que la organización adopte un cambio.
 * Mueves a las personas con palancas de cambio.
 * Inspirado en la mecánica de los simuladores de gestión del cambio (fases de adopción, palancas con costo
 * en semanas, credibilidad y masa crítica). La historia, las personas y los números son de mêtis.
 *
 * Todo es determinista y puro (sin reloj, sin azar) para poder probarlo.
 */
import type { CastId, ChangeDef, ChangeMove, ChangeState, CompanyPack, Kpis, LeverId, Stakeholder } from "./types";

export const WEEKS = 24;
/** Semanas disponibles según la exigencia (cada ascenso te da menos tiempo). */
export const weeksFor = (tier: number) => Math.max(18, WEEKS - 2 * tier);
/** % de personas que deben adoptar para lograr el cambio. */
export const GOAL = 0.7;
export const ADOPT = 75;

export interface Lever {
  id: LeverId;
  name: string;
  /** Semanas que consume. */
  weeks: number;
  /** A cuántas personas se dirige (0 = toda la organización). */
  targets: number;
  /** Para qué sirve (tarjeta). */
  short: string;
  /** Cuándo conviene (pista visible). */
  when: string;
  /** Nota CEO de la palanca. */
  nota: string;
}

export const LEVERS: Lever[] = [
  { id: "entrevista", name: "Entrevista privada", weeks: 1, targets: 1, short: "Una conversación 1 a 1 para entender qué le preocupa.", when: "Siempre. Te revela qué palancas le mueven.", nota: "Las entrevistas privadas descubren resistencias antes de que se vuelvan públicas." },
  { id: "ejemplo", name: "Walk the talk", weeks: 2, targets: 0, short: "Tú vives el cambio primero, a la vista de todos.", when: "Al inicio. Repetirlo rinde menos.", nota: "La gente escucha el discurso, pero cree en la conducta." },
  { id: "townhall", name: "Town hall", weeks: 2, targets: 0, short: "Explicas a todos el porqué del cambio y abres preguntas.", when: "Cuando casi nadie sabe del cambio.", nota: "Si el líder no comunica con claridad, la organización inventa su propia versión." },
  { id: "capacitacion", name: "Capacitación", weeks: 3, targets: 3, short: "Les das las herramientas para hacerlo.", when: "Con quien ya quiere, pero no sabe cómo.", nota: "No todos se resisten porque no quieren; algunos no saben cómo." },
  { id: "piloto", name: "Piloto", weeks: 4, targets: 2, short: "Lo prueban en pequeño y generan evidencia.", when: "Con quien ya está interesado. Forzarlo con escépticos sale mal.", nota: "Un piloto no sirve para demostrar que tenías razón; sirve para aprender." },
  { id: "avance", name: "Reporte de avance", weeks: 1, targets: 0, short: "Publicas resultados y quién ya lo adoptó.", when: "Cuando ya hay resultados que mostrar.", nota: "Si se mide, se publica y se conversa, empieza a ocupar espacio mental." },
  { id: "coalicion", name: "Coalición", weeks: 3, targets: 3, short: "Formas un grupo con poder e influencia para empujar.", when: "Con personas que ya están de tu lado.", nota: "Una transformación que solo defiende el CEO es una intención con dueño único." },
  { id: "reconocer", name: "Reconocer adoptadores", weeks: 1, targets: 2, short: "Reconoces en público a quien ya lo vive.", when: "Solo con quien ya lo adoptó.", nota: "Reconocer adoptadores manda una señal poderosa." },
  { id: "incentivos", name: "Revisar incentivos", weeks: 4, targets: 0, short: "Cambias bonos y metas para premiar lo nuevo.", when: "Para que se quede, cuando ya hay masa crítica.", nota: "Si los incentivos no cambian, la cultura difícilmente cambia." },
];
export const leverById = (id: LeverId) => LEVERS.find((l) => l.id === id)!;

export const PHASES = [
  { min: 0, name: "Resiste" },
  { min: 25, name: "Escucha" },
  { min: 50, name: "Prueba" },
  { min: ADOPT, name: "Adopta" },
] as const;
export const phaseOf = (v: number) => [...PHASES].reverse().find((p) => v >= p.min)!.name;

export const ORG_PHASES = ["Despertar", "Prueba", "Arraigo"] as const;
export type OrgPhase = (typeof ORG_PHASES)[number];

export interface ChangeSim {
  values: Record<CastId, number>;
  credibility: number;
  weeksUsed: number;
  weeksTotal: number;
  weeksLeft: number;
  interviewed: Set<CastId>;
  adopted: number;
  total: number;
  share: number;
  orgPhase: OrgPhase;
  done: boolean;
  ok: boolean;
  /** Bitácora de cada movimiento, para mostrar qué pasó. */
  log: { move: ChangeMove; gains: Record<CastId, number>; cred: number; text: string }[];
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Disposición inicial: la del caso + cómo está tu relación con esa persona por las decisiones que ya tomaste. */
export function startValue(st: Stakeholder, rel: number | undefined) {
  return clamp(st.start + ((rel ?? 50) - 50) * 0.45, 0, 60);
}

function orgPhaseOf(values: number[]): OrgPhase {
  const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  return avg < 38 ? "Despertar" : avg < 60 ? "Prueba" : "Arraigo";
}

/** Ganancia base de una palanca para una persona en su situación actual. */
function baseGain(lever: LeverId, v: number, ctx: { org: OrgPhase; anyAdopter: boolean; repeats: number; share: number }): number {
  const fade = 1 / (1 + ctx.repeats * 1.5); // lo masivo cansa: cada repetición rinde menos
  switch (lever) {
    case "entrevista": return v < 25 ? 11 : 7; // a quien resiste, sentirse escuchado le mueve más
    case "ejemplo": return 5 * fade;
    case "townhall": return (ctx.org === "Despertar" ? 6 : 1) * fade;
    case "capacitacion": return v >= 40 ? 13 : 4;
    case "piloto": return v >= 45 ? 20 : 3;
    case "avance": return (ctx.anyAdopter ? 1 + 8 * ctx.share : 0) * fade;
    case "coalicion": return v >= 50 ? 12 : 3;
    case "reconocer": return v >= ADOPT ? 4 : 0;
    case "incentivos": return (ctx.org === "Arraigo" ? 9 : ctx.org === "Prueba" ? 3 : 0) * fade;
  }
}

/** Cambio de credibilidad por usar una palanca en buen o mal momento. */
function credDelta(lever: LeverId, targets: number[], ctx: { org: OrgPhase; anyAdopter: boolean; repeats: number; share: number }): number {
  switch (lever) {
    case "ejemplo": return ctx.repeats ? 0 : 8;
    case "townhall": return ctx.org === "Despertar" && !ctx.repeats ? 2 : -4;
    case "piloto": return targets.some((v) => v < 45) ? -6 : 3;
    case "avance": return !ctx.anyAdopter ? -6 : ctx.repeats > 2 ? -2 : 2;
    case "coalicion": return targets.some((v) => v < 50) ? -4 : 4;
    case "reconocer": return targets.some((v) => v < ADOPT) ? -8 : 3;
    case "incentivos": return ctx.org === "Arraigo" ? 4 : ctx.org === "Prueba" ? -2 : -8;
    default: return 0;
  }
}

/** Corre el proyecto desde el inicio con los movimientos hechos. */
export function simulate(def: ChangeDef, pack: CompanyPack, st: Pick<ChangeState, "rel0" | "moves" | "closedAt" | "weeks">): ChangeSim {
  const total = st.weeks ?? WEEKS;
  const people = def.stakeholders;
  const byId = new Map(people.map((p) => [p.id, p]));
  const values: Record<CastId, number> = Object.fromEntries(people.map((p) => [p.id, startValue(p, st.rel0[p.id])]));
  let credibility = clamp(55 + ((st.rel0[pack.roles.board] ?? 50) - 50) * 0.4, 20, 80);
  let weeksUsed = 0;
  const interviewed = new Set<CastId>();
  const used: Partial<Record<LeverId, number>> = {};
  const log: ChangeSim["log"] = [];

  for (const move of st.moves) {
    const lv = leverById(move.lever);
    if (weeksUsed + lv.weeks > total) break;
    weeksUsed += lv.weeks;
    const vals = people.map((p) => values[p.id]);
    const ctx = { org: orgPhaseOf(vals), anyAdopter: vals.some((v) => v >= ADOPT), repeats: used[move.lever] ?? 0, share: vals.filter((v) => v >= ADOPT).length / Math.max(1, vals.length) };
    used[move.lever] = ctx.repeats + 1;
    const who = lv.targets === 0 ? people.map((p) => p.id) : move.targets.filter((t) => byId.has(t)).slice(0, lv.targets);
    const mult = 0.55 + credibility / 110;
    const gains: Record<CastId, number> = {};
    const add = (id: CastId, g: number) => { if (!byId.has(id) || !g) return; gains[id] = (gains[id] ?? 0) + g; };

    for (const id of who) {
      const p = byId.get(id)!;
      let g = baseGain(move.lever, values[id], ctx);
      if (p.likes.includes(move.lever)) g = g * 1.6 + 2;
      if (p.dislikes?.includes(move.lever)) g = -Math.max(3, g * 0.5);
      add(id, g * mult);
    }
    if (move.lever === "entrevista") who.forEach((id) => interviewed.add(id));
    // Reconocer: el efecto real es en quienes ven al reconocido (aliados e influidos).
    // Coalición y piloto: los participantes arrastran a su red.
    const spreaders = move.lever === "reconocer" ? who.filter((id) => values[id] >= ADOPT) : move.lever === "coalicion" || move.lever === "piloto" ? who.filter((id) => values[id] + (gains[id] ?? 0) >= 50) : [];
    const spreadPower = move.lever === "reconocer" ? 10 : move.lever === "coalicion" ? 6 : 4;
    for (const id of spreaders) {
      const lead = byId.get(id)?.leader ? 1.5 : 1;
      for (const t of pack.ties) {
        const other = t.a === id ? t.b : t.kind !== "influye" && t.b === id ? t.a : null;
        if (!other || who.includes(other)) continue;
        add(other, (t.kind === "tension" ? -0.4 : t.kind === "influye" ? 1 : 0.7) * spreadPower * lead * mult);
      }
    }
    // Formadores de opinión: cuando suben, arrastran a quienes influyen.
    for (const id of Object.keys(gains)) {
      const p = byId.get(id);
      if (!p?.leader || gains[id] <= 0) continue;
      for (const t of pack.ties) if (t.kind === "influye" && t.a === id && t.b !== id) add(t.b, gains[id] * 0.35);
    }
    for (const [id, g] of Object.entries(gains)) values[id] = clamp(values[id] + g);
    const cd = credDelta(move.lever, who.map((id) => values[id] - (gains[id] ?? 0)), ctx);
    credibility = clamp(credibility + cd, 5, 95);
    log.push({ move, gains, cred: cd, text: lv.name });
  }

  const adopted = people.filter((p) => values[p.id] >= ADOPT).length;
  const share = people.length ? adopted / people.length : 0;
  const done = !!st.closedAt || total - weeksUsed < Math.min(...LEVERS.map((l) => l.weeks));
  return {
    values, credibility, weeksUsed, weeksTotal: total, weeksLeft: total - weeksUsed, interviewed, adopted, total: people.length, share,
    orgPhase: orgPhaseOf(people.map((p) => values[p.id])), done, ok: share >= GOAL, log,
  };
}

/** ¿Se puede usar esta palanca ahora? */
export function canUse(sim: ChangeSim, lever: LeverId, targets: CastId[]): boolean {
  const lv = leverById(lever);
  if (sim.done || lv.weeks > sim.weeksLeft) return false;
  if (lv.targets === 0) return true;
  return targets.length >= 1 && targets.length <= lv.targets;
}

/** Lo que el proyecto le suma a tus indicadores al cerrarlo. */
export function changeEffect(sim: Pick<ChangeSim, "share" | "ok">): Partial<Kpis> {
  if (sim.ok) return { equipo: 6, consejo: 5, caja: -2 };
  if (sim.share >= 0.4) return { equipo: 1, consejo: -2, caja: -2 };
  return { equipo: -3, consejo: -5, caja: -2 };
}
