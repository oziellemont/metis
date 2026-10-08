/**
 * Metis Academy · reglas de progreso (lógica pura, probada con Vitest).
 */
import { MODULES, PASS_PCT, type Question } from "./content";

export interface ModuleProgress {
  moduleId: string;
  bestScore: number; // 0..100
  attempts: number;
  passedAt: string | null;
}
export type ProgressMap = Record<string, ModuleProgress>;

/** Calificación de un intento: respuestas = índice elegido (sobre las opciones ORIGINALES) por pregunta. */
export function gradeQuiz(quiz: Question[], answers: number[]): { correct: number; total: number; pct: number; passed: boolean } {
  const total = quiz.length;
  const correct = quiz.reduce((a, q, i) => a + (q.options[answers[i]]?.correct ? 1 : 0), 0);
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return { correct, total, pct, passed: pct >= PASS_PCT };
}

export const isPassed = (p: ProgressMap, id: string) => Boolean(p[id]?.passedAt);
export const completedCount = (p: ProgressMap) => MODULES.filter((m) => isPassed(p, m.id)).length;
export const allDone = (p: ProgressMap) => completedCount(p) === MODULES.length;

/** Los módulos se abren en orden: el primero siempre; los demás al aprobar el anterior. */
export function isUnlocked(p: ProgressMap, id: string): boolean {
  const i = MODULES.findIndex((m) => m.id === id);
  if (i <= 0) return i === 0;
  return isPassed(p, MODULES[i - 1].id);
}

export const nextModule = (p: ProgressMap) => MODULES.find((m) => !isPassed(p, m.id)) ?? null;

/** Registra un intento conservando la mejor calificación y la primera fecha de aprobación. */
export function recordAttempt(prev: ModuleProgress | undefined, moduleId: string, pct: number, passed: boolean, now = new Date()): ModuleProgress {
  return {
    moduleId,
    bestScore: Math.max(prev?.bestScore ?? 0, pct),
    attempts: (prev?.attempts ?? 0) + 1,
    passedAt: prev?.passedAt ?? (passed ? now.toISOString() : null),
  };
}

/** Orden de opciones barajado pero estable por intento (para que reintentar no sea memorizar la posición). */
export function shuffledOrder(n: number, seed: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  let s = (seed * 9301 + 49297) % 233280 || 1;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/**
 * ¿Toca recordarle hoy? Cada 2 días desde que entró, hasta que termine.
 * `lastSentAt` = último recordatorio de academia enviado (o null).
 */
export function shouldRemindAcademy(done: boolean, lastSentAt: Date | null, now: Date, everyDays = 2): boolean {
  if (done) return false;
  if (!lastSentAt) return true;
  const hours = (now.getTime() - lastSentAt.getTime()) / 36e5;
  return hours >= everyDays * 24 - 2; // margen de 2 h por variaciones del cron
}
