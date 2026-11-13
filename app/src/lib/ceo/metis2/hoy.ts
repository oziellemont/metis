/**
 * MÊTIS 2.0 · Hoy sin el simulador de empresas (pantalla intermedia, antes de la entrega 3.3).
 *
 * Con «Mostrar el simulador de empresas» apagado, Hoy deja de mostrar el tablero de la empresa (indicadores, misión
 * del consejo, mandato y etapa) y propone una sola cosa para practicar. Aquí vive la regla de qué se propone y los
 * textos que la acompañan. Lógica pura, sin React ni navegador, para poder probarla.
 *
 * Esta pantalla no mide dominio: las barras de criterio son de la entrega 3.3 y dependen de reglas sin validar.
 */
export type MisionKind = "caso" | "caso_ejecutivo" | "leccion" | "academy";

export interface Mision {
  kind: MisionKind;
  title: string;
  text: string;
  href: string;
  cta: string;
}

export interface MisionInput {
  /** Primer caso que espera decisión. */
  caso?: { id: string; subject: string; who: string; due: string } | null;
  /** Primer caso ejecutivo (varios pasos, una sola sentada). */
  episodio?: { id: string; subject: string; minutes: number; started: boolean } | null;
  /** Siguiente lección abierta sin terminar. */
  leccion?: { id: string; title: string; minutes: number } | null;
}

/** Una sola propuesta para hoy: primero el caso que espera, luego el caso ejecutivo, luego la lección. */
export function misionDelDia(x: MisionInput): Mision {
  if (x.caso) return { kind: "caso", title: x.caso.subject, text: `${x.caso.who} espera tu decisión. Vence en ${x.caso.due}.`, href: `/ceo/caso/${x.caso.id}`, cta: "Resolver el caso" };
  if (x.episodio) return { kind: "caso_ejecutivo", title: x.episodio.subject, text: `Caso ejecutivo de unos ${x.episodio.minutes} minutos, para resolver en una sola sentada.`, href: `/ceo/episodio/${x.episodio.id}`, cta: x.episodio.started ? "Continuar el caso" : "Abrir el caso" };
  if (x.leccion) return { kind: "leccion", title: x.leccion.title, text: `Lección de ${x.leccion.minutes} minutos en Academy. Ahora no hay casos esperando tu decisión.`, href: `/ceo/academy/${x.leccion.id}`, cta: "Abrir la lección" };
  return { kind: "academy", title: "Hoy no hay casos esperando", text: "Durante el día llegan más. Mientras tanto puedes repasar la teoría en Academy.", href: "/ceo/academy", cta: "Ir a Academy" };
}

/** Casos que esperan además del que ya se propone arriba. */
export function otrosCasosText(n: number): string {
  if (n <= 0) return "";
  return n === 1 ? "Otro caso espera tu decisión" : `Otros ${n} casos esperan tu decisión`;
}

/**
 * Lo que el simulador tiene pendiente y esta pantalla no muestra (cierres de mes, sesiones especiales, decisiones de
 * una empresa emergente, cierre del periodo). Se avisa con un conteo, sin cifras de la empresa, y con un enlace
 * directo al primero: nada queda escondido ni bloqueado por tener el simulador apagado.
 */
export interface AvisoSimulador { text: string; href: string; cta: string }
export function avisoSimulador(x: { asuntos: readonly string[]; periodoCerrado: boolean }): AvisoSimulador | null {
  const n = x.asuntos.length;
  if (n <= 0 && !x.periodoCerrado) return null;
  const partes: string[] = [];
  if (n > 0) partes.push(n === 1 ? "El simulador de empresas tiene un asunto propio esperando." : `El simulador de empresas tiene ${n} asuntos propios esperando.`);
  if (x.periodoCerrado) partes.push("La empresa de tus casos cerró su periodo: para recibir casos nuevos hay que revisar el cierre.");
  partes.push("Esta pantalla los muestra completos al encender el simulador en Ajustes.");
  return n > 0 ? { text: partes.join(" "), href: x.asuntos[0], cta: n === 1 ? "Abrirlo" : "Abrir el primero" } : { text: partes.join(" "), href: "/ceo/carrera", cta: "Ver el cierre" };
}

/** Aviso fijo bajo las seis academias: lo que se ve es un conteo de actividad, no una medición. */
export const AVANCE_PROVISIONAL = "Avance provisional. Cuenta actividad: lecciones que terminaste y decisiones que tomaste. No mide dominio, no sube niveles y no acredita nada.";

/** Texto del acceso a las experiencias en revisión. Solo lo ven las cuentas del equipo mêtis. */
export const ACCESO_REVISION = { title: "Solo para revisión", text: "Experiencias del Repositorio Académico y Executive Challenge en revisión. No cuentan para el avance, el nivel ni el perfil de nadie.", href: "/ceo/piloto", cta: "Abrir las experiencias en revisión" } as const;
