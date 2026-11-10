/**
 * Página «Hoy»: reglas simples y puras de lo que aparece.
 *  - El dilema del día sale como ventana cada vez que entras a Hoy, hasta que lo contestes.
 *    «Recordar más tarde» lo pospone DILEMMA_SNOOZE (reloj de juego).
 *  - La crisis, el reto final y la junta no tienen tarjeta propia: aparecen como un asunto más en «Esperando tu decisión».
 */
export const DILEMMA_SNOOZE = 2 * 60 * 60 * 1000;

/** ¿Hay que mostrar la ventana del dilema? */
export function dilemmaPromptDue(answered: boolean, snoozedUntil: number | null | undefined, now: number): boolean {
  if (answered) return false;
  return !snoozedUntil || now >= snoozedUntil;
}

/** Clave local del «recordar más tarde» (una por dilema: el de mañana no hereda la espera). */
export const snoozeKey = (dilemmaId: string) => `metis-ceo-v1:dilema-luego:${dilemmaId}`;

/** Asuntos especiales que se listan junto a los demás en «Esperando tu decisión». */
export interface SpecialTask { id: "crisis" | "cambio" | "junta"; href: string; subject: string; label: string }
export function specialTasks(x: { changeOpen: boolean; changeStarted: boolean; changeDone: boolean; changeTitle: string; boardOpen: boolean; crisisOpen?: boolean }): SpecialTask[] {
  const out: SpecialTask[] = [];
  if (x.crisisOpen) out.push({ id: "crisis", href: "/ceo/crisis", subject: "Sesión extraordinaria · Boardroom Crisis", label: "Urgente: el consejo te cita hoy" });
  if (x.changeOpen && !x.changeDone) out.push({ id: "cambio", href: "/ceo/cambio", subject: `Reto final · ${x.changeTitle}`, label: x.changeStarted ? "En curso" : "El consejo espera tu plan" });
  if (x.boardOpen) out.push({ id: "junta", href: "/ceo/junta", subject: "Junta ante el Consejo", label: "Sesión extraordinaria del consejo" });
  return out;
}

/**
 * Resumen del día en Hoy: a lo mucho cuatro líneas cortas con lo que ya pasó hoy (tus decisiones,
 * lo que se venció) y lo que viene (lo más urgente, el mundo, lo siguiente que llega, un aviso).
 * Puro: recibe los datos ya calculados y devuelve el texto.
 */
export type BriefKind = "hecho" | "vencido" | "mundo" | "viene" | "ojo";
export interface BriefLine { kind: BriefKind; text: string }
export interface BriefInput {
  now: number;
  /** Inicio del día de hoy (medianoche en la zona del usuario). */
  dayStart: number;
  decided: { subject: string; at: number }[];
  expired: { subject: string; deadline: number }[];
  pending: { subject: string; who: string; deadline: number }[];
  world?: { name: string; label: string; daysLeft: number } | null;
  /** Mes cuyo cierre espera firma, si lo hay. */
  report?: number | null;
  nextArrival: number | null;
  quiet?: boolean;
  alert?: string | null;
}
export const BRIEF_MAX = 4;

const q = (s: string, max = 70) => `«${s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s}»`;
function inTime(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${Math.max(1, m)} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? "día" : "días"}`;
}
const firstSentence = (s: string) => (s.match(/^[^.]*\.(?=\s|$)/)?.[0] ?? s).trim();

export function dayBriefOf(x: BriefInput): BriefLine[] {
  const today = x.decided.filter((d) => d.at >= x.dayStart && d.at <= x.now).sort((a, b) => b.at - a.at);
  const lost = x.expired.filter((d) => d.deadline >= x.dayStart && d.deadline <= x.now);
  const lines: (BriefLine & { p: number })[] = [];

  if (today.length === 1) lines.push({ p: 1, kind: "hecho", text: `Hoy decidiste ${q(today[0].subject)}.` });
  else if (today.length > 1) lines.push({ p: 1, kind: "hecho", text: `Hoy decidiste ${today.length} asuntos; el último, ${q(today[0].subject, 55)}.` });
  if (lost.length) lines.push({ p: 3, kind: "vencido", text: lost.length === 1 ? `Se venció sin respuesta ${q(lost[0].subject)}.` : `Se vencieron ${lost.length} asuntos sin respuesta.` });

  if (x.world) lines.push({ p: 2, kind: "mundo", text: `En el mundo: ${x.world.name} (${x.world.label.toLowerCase()}). Tienes ${x.world.daysLeft === 0 ? "hasta hoy" : x.world.daysLeft === 1 ? "1 día" : `${x.world.daysLeft} días`} para decidir.` });

  const urgent = [...x.pending].sort((a, b) => a.deadline - b.deadline)[0];
  let next: string;
  if (x.report != null) next = `Toca revisar y firmar el cierre del mes ${x.report}.`;
  else if (urgent) next = `Lo más urgente: ${q(urgent.subject, 55)}, de ${urgent.who}; vence en ${inTime(urgent.deadline - x.now)}.`;
  else if (x.quiet) next = "Hoy es día tranquilo: no llegan asuntos nuevos.";
  else if (x.nextArrival != null && x.nextArrival > x.now) next = x.nextArrival - x.dayStart < 86_400_000 ? `El siguiente asunto llega en ${inTime(x.nextArrival - x.now)}.` : "Por hoy no llegan más asuntos; el siguiente llega mañana o después.";
  else next = "Por hoy no llegan más asuntos.";
  lines.push({ p: 0, kind: "viene", text: next });

  if (x.alert) lines.push({ p: 4, kind: "ojo", text: `Ojo: ${firstSentence(x.alert)}` });

  const keep = new Set([...lines].sort((a, b) => a.p - b.p).slice(0, BRIEF_MAX));
  return lines.filter((l) => keep.has(l)).map(({ kind, text }) => ({ kind, text }));
}

/** Medianoche de hoy en una zona horaria (sin librerías). */
export function dayStartOf(now: number, tz = "America/Monterrey"): number {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(now)).map((x) => [x.type, x.value]));
    const h = Number(p.hour) % 24, m = Number(p.minute), s = Number(p.second);
    return now - ((h * 60 + m) * 60 + s) * 1000 - (now % 1000);
  } catch {
    const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime();
  }
}
