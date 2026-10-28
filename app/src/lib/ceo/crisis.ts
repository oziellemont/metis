/**
 * Boardroom Crisis: sesión extraordinaria del consejo.
 *
 * A mitad de temporada, el cliente que más te debe entra en concurso mercantil y la caja se
 * desploma. El consejo te cita el mismo día. Son tres decisiones encadenadas, cada una con reloj:
 * si se acaba el tiempo, el consejo decide por ti. A diferencia de la Junta ante el Consejo (que
 * califica tu criterio para un nombramiento), aquí se mueven los cinco indicadores de una crisis y
 * se parte de cómo está tu empresa hoy: llegar con la caja débil la hace más difícil.
 *
 * Lógica pura y determinista (sin reloj, sin azar). No toca los KPI de la temporada ni las partidas
 * doradas: el resultado se guarda aparte (`s.crises`) y solo suma XP.
 */
import { CRISIS_XP, KPI_KEYS, rulesVersionOf, seasonDay, seasonDoneOf, nowOf } from "./engine";
import type { CeoState, CrisisRating, KpiKey, Kpis } from "./types";

/** Día de la temporada a partir del cual el consejo puede convocar. */
export const CRISIS_DAY = 3;
/** Segundos para cada decisión (tiempo real, no de juego). */
export const STEP_SECONDS = 90;
/** Id de la «opción» que se aplica cuando se acaba el tiempo. */
export const TIMEOUT = "tiempo";
export { CRISIS_XP };
export const CONTAINED_MIN = 45;
export const CONTAINED_BOARD = 60;
export const OVERRUN_BELOW = 30;

export interface CrisisOption {
  id: string;
  label: string;
  reaction: string;
  effects: Partial<Kpis>;
}
export interface CrisisStep {
  id: string;
  title: string;
  speaker: "chair" | "board";
  /** `{chair}` y `{board}` se sustituyen por los nombres de la empresa actual. */
  prompt: string;
  options: CrisisOption[];
  /** Lo que pasa si se acaba el tiempo. */
  timeout: CrisisOption;
  nota: string;
}

/** El golpe inicial. Sube con la exigencia de la empresa. */
export function shockOf(tier: number): Partial<Kpis> {
  const t = Math.max(0, tier);
  return { caja: -18 - 2 * t, clientes: -6, consejo: -4 - t };
}

export const STEPS: CrisisStep[] = [
  {
    id: "llamada",
    title: "La llamada de las 7:40",
    speaker: "chair",
    prompt: "{chair} te llama antes de que llegues a la oficina: «Me habló el banco. Tu segundo cliente más grande entró en concurso mercantil y nos debe seis semanas de ventas. ¿Por qué me entero por ellos?».",
    options: [
      { id: "convocar", label: "Convocar hoy a sesión extraordinaria con lo que sabes, lo que todavía no sabes y la hora en que tendrás el número completo.", reaction: "{chair} acepta. A las 5 de la tarde el consejo está completo en la sala.", effects: { consejo: 8 } },
      { id: "numero", label: "Pedir 48 horas para llegar con el número exacto y un plan completo.", reaction: "{chair} acepta de mala gana. Esa misma tarde, el banco pide hablar con el consejo directamente.", effects: { consejo: -6 } },
      { id: "minimizar", label: "Decirle que está controlado y que Finanzas ya lo está manejando.", reaction: "{chair} cuelga sin despedirse. Dos horas después convoca él a la sesión.", effects: { consejo: -10 } },
    ],
    timeout: { id: TIMEOUT, label: "Se acabó el tiempo", reaction: "No contestaste a tiempo. {chair} convoca la sesión por su cuenta y avisa al banco que el consejo toma el tema.", effects: { consejo: -12 } },
    nota: "En una crisis, el consejo no espera el número perfecto. Espera enterarse por ti.",
  },
  {
    id: "caja",
    title: "Seis semanas de caja",
    speaker: "board",
    prompt: "Ya en la sesión, {board} va al grano: «Con este hueco, ¿cuántas semanas de caja nos quedan y qué vas a hacer esta semana?». Te quedan seis.",
    options: [
      { id: "puente", label: "Negociar plazos con los diez proveedores principales, pedir una línea puente al banco y congelar las inversiones que no son críticas.", reaction: "{board} pide ver la lista de inversiones congeladas antes del viernes. El banco agenda una reunión para mañana.", effects: { caja: 12, margen: -3, equipo: -2, consejo: 4 } },
      { id: "recorte", label: "Recortar 15% de la plantilla esta misma semana.", reaction: "La caja respira. {board} pregunta si el recorte toca a la gente que sostiene a los clientes clave. No tienes la respuesta.", effects: { caja: 14, margen: 4, equipo: -22, clientes: -2 } },
      { id: "remate", label: "Vender inventario con 30% de descuento para hacer caja rápido.", reaction: "Entra dinero en días. {chair} advierte que el canal se va a acostumbrar al precio.", effects: { caja: 12, margen: -10, clientes: -4 } },
    ],
    timeout: { id: TIMEOUT, label: "Se acabó el tiempo", reaction: "Sin una propuesta tuya, el consejo vota congelar todo gasto y contrataciones hasta nuevo aviso.", effects: { caja: 6, equipo: -6, consejo: -8 } },
    nota: "Recortar es rápido. Comprar tiempo con proveedores y banco cuesta más trabajo, y casi siempre sale más barato.",
  },
  {
    id: "voz",
    title: "Lo que vas a decir",
    speaker: "chair",
    prompt: "Antes de cerrar, {chair}: «El rumor ya llegó a la planta y a dos clientes. Mañana todos van a preguntar lo mismo. ¿Qué vas a decir?».",
    options: [
      { id: "verdad", label: "Hablar hoy con el equipo y llamar a los clientes clave: qué pasó, qué estás haciendo y qué no va a cambiar.", reaction: "Esa noche llamas a seis clientes. Dos te agradecen que no se enteraran por otro lado.", effects: { equipo: 10, clientes: 8, consejo: 3 } },
      { id: "silencio", label: "No decir nada hasta que todo esté resuelto, para no alarmar.", reaction: "El rumor crece solo. Para el jueves circula una versión peor que la real.", effects: { equipo: -12, clientes: -10 } },
      { id: "optimista", label: "Mandar un comunicado diciendo que la empresa está sólida y que no hay de qué preocuparse.", reaction: "Un cliente responde con una pregunta concreta sobre sus entregas. El comunicado no la contesta.", effects: { equipo: -8, clientes: -4, consejo: -5 } },
    ],
    timeout: { id: TIMEOUT, label: "Se acabó el tiempo", reaction: "La sesión termina sin acuerdo de comunicación. Cada área dice algo distinto.", effects: { equipo: -10, clientes: -10, consejo: -4 } },
    nota: "En una crisis, el silencio se interpreta como culpa. Di lo que sabes, lo que haces y cuándo vuelves a hablar.",
  },
];

/** Consecuencias encadenadas: lo que decidiste antes cambia lo que pasa ahora. */
interface Chain { when: [string, string]; at: string; text: string; effects: Partial<Kpis> }
export const CHAINS: Chain[] = [
  { when: ["llamada", "convocar"], at: "caja", text: "El banco sabe que el consejo está al tanto desde el primer día. Ofrece revisar una línea puente.", effects: { caja: 3, consejo: 3 } },
  { when: ["llamada", "numero"], at: "caja", text: "{board} comenta que el banco ya le pidió una reunión a ella mientras esperaban tu número.", effects: { consejo: -3 } },
  { when: ["llamada", "minimizar"], at: "caja", text: "{board} abre diciendo que el banco le habló a ella antes que tú. La sala te escucha con otra cara.", effects: { consejo: -8 } },
  { when: ["llamada", TIMEOUT], at: "caja", text: "{chair} preside la sesión que tú debías convocar.", effects: { consejo: -4 } },
  { when: ["caja", "recorte"], at: "voz", text: "La noticia del recorte llegó antes que tú: en la planta preguntan si viene otra ronda.", effects: { equipo: -6 } },
  { when: ["caja", "puente"], at: "voz", text: "Dos proveedores aceptaron el nuevo plazo con una condición: que les digas lo mismo que al consejo.", effects: { clientes: 2 } },
  { when: ["caja", "remate"], at: "voz", text: "Una cadena vio tus precios de remate y pide que el descuento sea permanente.", effects: { margen: -4, clientes: -2 } },
];

export type CrisisPicks = Partial<Record<string, string>>;

export function chainsAt(stepId: string, picks: CrisisPicks): Chain[] {
  return CHAINS.filter((c) => c.at === stepId && picks[c.when[0]] === c.when[1]);
}

export function optionOf(step: CrisisStep, id: string | undefined): CrisisOption | undefined {
  if (!id) return undefined;
  return id === TIMEOUT ? step.timeout : step.options.find((o) => o.id === id);
}

/** Tablero al arrancar: tus indicadores de hoy menos el golpe. */
export function startBoard(kpis: Kpis, tier: number): Kpis {
  return applyFx({ ...kpis }, shockOf(tier));
}

export interface CrisisResult {
  start: Kpis;
  kpis: Kpis;
  rating: CrisisRating;
  complete: boolean;
  /** Decisiones que se fueron por tiempo. */
  timeouts: number;
  /** Indicador más golpeado al final. */
  weakest: KpiKey;
}

/** Tablero después de lo elegido hasta ahora (en el orden de los pasos). */
export function playCrisis(kpis: Kpis, tier: number, picks: CrisisPicks): CrisisResult {
  const start = startBoard(kpis, tier);
  const k = { ...start };
  let complete = true, timeouts = 0;
  for (const st of STEPS) {
    for (const c of chainsAt(st.id, picks)) applyFx(k, c.effects);
    const o = optionOf(st, picks[st.id]);
    if (!o) { complete = false; continue; }
    if (o.id === TIMEOUT) timeouts++;
    applyFx(k, o.effects);
  }
  const min = Math.min(...KPI_KEYS.map((x) => k[x]));
  const rating: CrisisRating = min >= CONTAINED_MIN && k.consejo >= CONTAINED_BOARD ? "contenida" : min < OVERRUN_BELOW ? "rebaso" : "danos";
  const weakest = KPI_KEYS.reduce((a, b) => (k[b] < k[a] ? b : a));
  return { start, kpis: k, rating, complete, timeouts, weakest };
}

export const RATING_TEXT: Record<CrisisRating, { title: string; text: string }> = {
  contenida: { title: "Crisis contenida", text: "La empresa sale golpeada, pero entera. El consejo confía en que puedes dirigir con presión." },
  danos: { title: "Contenida, con daños", text: "Sobreviviste a la semana, pero un frente quedó débil y el consejo lo va a vigilar." },
  rebaso: { title: "La crisis te rebasó", text: "Un indicador quedó en zona roja. El consejo tomó decisiones que te tocaban a ti." },
};

export type CrisisAccess = { open: true } | { open: false; reason: "early" | "done" | "closed" };
/** Una vez por empresa, desde el día CRISIS_DAY y antes de que cierre la temporada. */
export function crisisAccess(s: CeoState, now = nowOf(s)): CrisisAccess {
  if (!s.startedAt) return { open: false, reason: "early" };
  if (crisisOfRun(s)) return { open: false, reason: "done" };
  if (seasonDoneOf(s, now)) return { open: false, reason: "closed" };
  if (seasonDay(s, now) < CRISIS_DAY) return { open: false, reason: "early" };
  return { open: true };
}

/** La crisis ya jugada en la empresa actual (si la hay). */
export function crisisOfRun(s: CeoState) {
  return (s.crises ?? []).find((c) => c.company === s.company && c.startedAt === s.startedAt);
}

/** Guarda el resultado. Solo una vez por empresa; repetirlo no cambia nada. */
export function recordCrisis(s: CeoState, r: { rating: CrisisRating; picks: CrisisPicks }, now = nowOf(s)): CeoState {
  if (!s.startedAt || crisisOfRun(s)) return s;
  const picks: Record<string, string> = {};
  for (const [k, v] of Object.entries(r.picks)) if (typeof v === "string") picks[k] = v;
  return { ...s, crises: [...(s.crises ?? []), { company: s.company, startedAt: s.startedAt, tier: s.tier, rulesVersion: rulesVersionOf(s), at: now, rating: r.rating, picks }] };
}

/** Sustituye {chair} y {board}. */
export const fillNames = (t: string, n: { chair: string; board: string }) => t.replace(/\{chair\}/g, n.chair).replace(/\{board\}/g, n.board);

function applyFx(k: Kpis, fx: Partial<Kpis>): Kpis {
  for (const [key, v] of Object.entries(fx) as [KpiKey, number][]) k[key] = Math.max(0, Math.min(100, Math.round(k[key] + v)));
  return k;
}
