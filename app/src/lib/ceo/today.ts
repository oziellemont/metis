/**
 * Página «Hoy»: reglas simples y puras de lo que aparece.
 *  - El dilema del día sale como ventana cada vez que entras a Hoy, hasta que lo contestes.
 *    «Recordar más tarde» lo pospone DILEMMA_SNOOZE (reloj de juego).
 *  - El reto final y la junta no tienen tarjeta propia: aparecen como un asunto más en «Esperando tu decisión».
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
export interface SpecialTask { id: "cambio" | "junta"; href: string; subject: string; label: string }
export function specialTasks(x: { changeOpen: boolean; changeStarted: boolean; changeDone: boolean; changeTitle: string; boardOpen: boolean }): SpecialTask[] {
  const out: SpecialTask[] = [];
  if (x.changeOpen && !x.changeDone) out.push({ id: "cambio", href: "/ceo/cambio", subject: `Reto final · ${x.changeTitle}`, label: x.changeStarted ? "En curso" : "El consejo espera tu plan" });
  if (x.boardOpen) out.push({ id: "junta", href: "/ceo/junta", subject: "Junta ante el Consejo", label: "Requisito para tu nombramiento" });
  return out;
}
