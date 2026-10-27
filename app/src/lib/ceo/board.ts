/**
 * Junta ante el Consejo: requisito para el nombramiento de Chief Executive Officer.
 *
 * Una sesión de consejo con tres momentos encadenados. Lo que decides en un momento cambia el
 * siguiente: si escondes un dato en el primero, la consejera lo encuentra en el segundo; si
 * comprometes una fecha, el presidente te la recuerda en el tercero.
 *
 * El consejo califica cuatro criterios (rendición de cuentas, criterio, gobierno y visión) y lleva
 * una confianza que arranca según tu relación con el presidente y la consejera. Para superar la
 * junta necesitas confianza de PASS_TRUST o más y ningún criterio debajo de PASS_CRITERION.
 *
 * Lógica pura y determinista (sin reloj, sin azar). No toca KPI, decisiones ni partidas doradas:
 * solo produce un resultado que se guarda con `recordBoard` (journey.ts).
 */
import { DAY } from "./engine";
import type { CeoState } from "./types";

export const BOARD_STAGE = 4; // la junta es requisito para llegar a esta etapa
export const PASS_TRUST = 60;
export const PASS_CRITERION = 55;
/** Si no la superas, el consejo vuelve a sesionar después de este tiempo (reloj de juego). */
export const RETRY_AFTER = DAY;

export type Criterion = "rendicion" | "criterio" | "gobierno" | "vision";
export const CRITERIA: { id: Criterion; name: string; what: string }[] = [
  { id: "rendicion", name: "Rendición de cuentas", what: "Dices lo que pasó, también lo que salió mal, y quién responde." },
  { id: "criterio", name: "Criterio", what: "Separas lo urgente de lo importante y decides con datos." },
  { id: "gobierno", name: "Gobierno", what: "Respetas el papel del consejo y pones límites claros a los riesgos." },
  { id: "vision", name: "Visión", what: "Conectas la decisión de hoy con la empresa de dentro de tres años." },
];
export type Scores = Record<Criterion, number>;

export interface BoardOption {
  id: string;
  label: string;
  /** Lo que pasa en la sala justo después. */
  reaction: string;
  effects: Partial<Scores>;
  trust: number;
}
export interface BoardStep {
  id: string;
  title: string;
  /** Quién habla: el presidente o la consejera independiente. */
  speaker: "chair" | "board";
  /** Planteamiento base. `{chair}` y `{board}` se sustituyen por los nombres de la empresa actual. */
  prompt: string;
  options: BoardOption[];
  nota: string;
}

export const STEPS: BoardStep[] = [
  {
    id: "numeros",
    title: "Los números del trimestre",
    speaker: "chair",
    prompt: "{chair} abre la sesión: «Antes de hablar de tu nombramiento, cuéntanos cómo cerró el trimestre». Dos rubros superaron el plan. Uno quedó 8 puntos abajo y todavía no tienes la causa completa.",
    options: [
      { id: "todo", label: "Presentar todo, empezando por el rubro que quedó abajo, con lo que sabes y lo que te falta saber.", reaction: "Silencio breve. {board} toma nota y asiente. Nadie te interrumpe.", effects: { rendicion: 25, criterio: 10 }, trust: 10 },
      { id: "anexo", label: "Abrir con los dos rubros buenos y dejar el que quedó abajo en el anexo.", reaction: "La presentación fluye. {board} pasa directo a las últimas páginas.", effects: { rendicion: -20, vision: 5 }, trust: -5 },
      { id: "mercado", label: "Explicar que el rubro bajo se debe al mercado y que toda la industria cayó.", reaction: "{chair} pregunta si la competencia también cayó 8 puntos. No tienes el dato.", effects: { rendicion: -10, criterio: -10 }, trust: -10 },
    ],
    nota: "Al consejo no se le presenta lo que salió bien. Se le presenta lo que pasó.",
  },
  {
    id: "riesgo",
    title: "La pregunta incómoda",
    speaker: "board",
    prompt: "{board} toma la palabra: «Un solo cliente ya representa casi una cuarta parte de las ventas, y quien lleva esa cuenta también aprueba sus descuentos. ¿Quién vigila eso?».",
    options: [
      { id: "limite", label: "Reconocer el riesgo y proponer un límite de concentración y que los descuentos grandes los firme alguien más.", reaction: "{board}: «Eso es lo que quería escuchar». Lo anota como acuerdo de la sesión.", effects: { gobierno: 25, criterio: 10 }, trust: 10 },
      { id: "defender", label: "Defender al equipo: esa persona lleva años en la empresa y nunca ha fallado.", reaction: "{board} responde que no está hablando de la persona, sino del control. El tono de la sala cambia.", effects: { gobierno: -20, rendicion: -5 }, trust: -10 },
      { id: "fecha", label: "Pedir dos semanas para revisarlo con Finanzas y comprometer una propuesta en la siguiente sesión.", reaction: "{board} acepta, con una condición: que quede por escrito en el acta.", effects: { gobierno: 10, criterio: 5 }, trust: 0 },
    ],
    nota: "Un consejero independiente no desconfía de las personas. Pregunta por los controles.",
  },
  {
    id: "apuesta",
    title: "La apuesta de tres años",
    speaker: "chair",
    prompt: "Al final, {chair} saca su proyecto: abrir una segunda planta en otra región. «Llevo años queriendo hacerlo. Si vas a dirigir esta empresa, quiero saber si me acompañas».",
    options: [
      { id: "acompanar", label: "Acompañarlo: es el fundador, conoce el negocio mejor que nadie y el consejo necesita unidad.", reaction: "{chair} sonríe. {board} pregunta en voz alta quién analizó el caso de negocio.", effects: { vision: 5, gobierno: -15, criterio: -20 }, trust: -5 },
      { id: "etapas", label: "Proponer hacerlo por etapas: un caso de negocio en 90 días, con métricas y condiciones claras para frenar.", reaction: "{chair} tarda en contestar, pero acepta. {board} pide ver las condiciones antes de votar.", effects: { vision: 20, criterio: 15, gobierno: 5 }, trust: 10 },
      { id: "rechazar", label: "Rechazarla: con el margen actual no es el momento, y lo dices así.", reaction: "La sala se enfría. {chair} pregunta si tienes alguna idea para crecer.", effects: { criterio: 5, vision: -20 }, trust: -10 },
    ],
    nota: "Decirle que sí a todo al presidente no es lealtad. Ponerle condiciones a su sueño, sí.",
  },
];

/** Consecuencias encadenadas: lo que hiciste antes cambia cómo pesa lo de ahora. */
interface Chain { when: [string, string]; at: string; text: string; effects: Partial<Scores>; trust: number }
export const CHAINS: Chain[] = [
  { when: ["numeros", "anexo"], at: "riesgo", text: "Antes de su pregunta, {board} comenta que encontró el rubro bajo en la página 31 del anexo.", effects: { rendicion: -10 }, trust: -10 },
  { when: ["numeros", "todo"], at: "riesgo", text: "{board} dice que agradece que abrieras con lo que salió mal, y que por eso va a ser directa.", effects: {}, trust: 5 },
  { when: ["riesgo", "fecha"], at: "apuesta", text: "{chair} te recuerda que ya comprometiste una propuesta en dos semanas, y pregunta si te alcanza para otra.", effects: { criterio: 5 }, trust: 5 },
  { when: ["riesgo", "defender"], at: "apuesta", text: "{board} pide que conste en el acta que el tema de los controles quedó abierto.", effects: { gobierno: -5 }, trust: -5 },
];

export type Picks = Partial<Record<string, string>>;

/** Confianza inicial: parte de 50 y se mueve con tu relación con el presidente y la consejera (0 a 100). */
export function startTrust(chairRel: number, boardRel: number): number {
  const avg = (clamp(chairRel) + clamp(boardRel)) / 2;
  return Math.round(50 + (avg - 50) * 0.3);
}

/** Las consecuencias que aparecen al llegar a un momento, según lo que ya elegiste. */
export function chainsAt(stepId: string, picks: Picks): Chain[] {
  return CHAINS.filter((c) => c.at === stepId && picks[c.when[0]] === c.when[1]);
}

export interface BoardResult {
  scores: Scores;
  trust: number;
  passed: boolean;
  /** Criterio más bajo (para orientar la siguiente sesión). */
  weakest: Criterion;
  complete: boolean;
}

export function scoreBoard(picks: Picks, trust0 = 50): BoardResult {
  const scores: Scores = { rendicion: 50, criterio: 50, gobierno: 50, vision: 50 };
  let trust = trust0;
  const add = (e: Partial<Scores>, t: number) => {
    for (const [k, v] of Object.entries(e) as [Criterion, number][]) scores[k] += v;
    trust += t;
  };
  let complete = true;
  for (const st of STEPS) {
    for (const c of chainsAt(st.id, picks)) add(c.effects, c.trust);
    const o = st.options.find((x) => x.id === picks[st.id]);
    if (!o) { complete = false; continue; }
    add(o.effects, o.trust);
  }
  for (const k of Object.keys(scores) as Criterion[]) scores[k] = clamp(scores[k]);
  trust = clamp(trust);
  const weakest = (Object.keys(scores) as Criterion[]).reduce((a, b) => (scores[b] < scores[a] ? b : a));
  const passed = complete && trust >= PASS_TRUST && Object.values(scores).every((v) => v >= PASS_CRITERION);
  return { scores, trust, passed, weakest, complete };
}

/** Sustituye {chair} y {board} por los nombres de la empresa actual. */
export const fill = (t: string, names: { chair: string; board: string }) => t.replace(/\{chair\}/g, names.chair).replace(/\{board\}/g, names.board);

export type BoardAccess = { open: true } | { open: false; reason: "stage" | "passed" | "past" | "wait"; until?: number };
/** Se abre cuando tu siguiente nombramiento es Chief Executive Officer. Si no la superas, vuelve a sesionar al día siguiente. */
export function boardAccess(s: CeoState, now: number): BoardAccess {
  const stage = s.journey?.stage ?? 0;
  const b = s.journey?.board;
  if (b?.passed) return { open: false, reason: "passed" };
  if (stage < BOARD_STAGE - 1) return { open: false, reason: "stage" };
  if (stage >= BOARD_STAGE) return { open: false, reason: "past" };
  if (b && now - b.at < RETRY_AFTER) return { open: false, reason: "wait", until: b.at + RETRY_AFTER };
  return { open: true };
}

function clamp(v: number) { return Math.max(0, Math.min(100, Math.round(Number.isFinite(v) ? v : 50))); }
