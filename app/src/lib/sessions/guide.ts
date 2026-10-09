/**
 * Guía de la conversación 1 a 1 (Revisión Vertical). Un solo lugar:
 * la usan la Academy (módulo 4), la pantalla de la RV y el correo de recordatorio al jefe.
 */
export interface GuideStep { label: string; minutes: number; example: string }

export const RV_GUIDE: GuideStep[] = [
  { label: "Conecta", minutes: 3, example: "Pregunta cómo está y qué quiere tratar. Su agenda va primero: es su espacio, no el tuyo." },
  { label: "Revisa su scorecard", minutes: 10, example: "Abran juntos METIS. Reconoce los verdes con hechos concretos y explora los rojos: «¿qué está pasando?, ¿qué causa lo explica?»." },
  { label: "Destraba", minutes: 7, example: "Pregunta qué lo frena y qué necesita de ti. Ofrece apoyo concreto, no discursos." },
  { label: "Desarrollo y feedback", minutes: 7, example: "Un tema de crecimiento y, si aplica, feedback SCI. Pide también feedback para ti." },
  { label: "Cierra con compromisos", minutes: 3, example: "Que la persona diga sus 1–3 compromisos con fecha. Tú también anota los tuyos. Se revisan en el próximo 1 a 1." },
];
export const RV_GUIDE_NOTE = "Si solo hablaste de números, fue una revisión de reporte, no de desarrollo. Cuida que el paso 4 nunca se pierda.";

/** Lo que el colaborador prepara antes de su 1 a 1. */
export const RV_PREP: string[] = [
  "Actualiza tus resultados en mêtis para que el scorecard esté al día.",
  "Revisa tus compromisos abiertos: cuáles cumpliste y cuáles no, y por qué.",
  "Trae 1 o 2 bloqueos donde necesitas apoyo de tu jefe.",
  "Piensa en un tema de desarrollo que quieras platicar.",
];
