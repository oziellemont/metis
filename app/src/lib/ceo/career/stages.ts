/**
 * mêtis CEO · etapas de la empresa en la carrera continua (P1-B). Lógica pura.
 *
 * La empresa avanza por etapas (doc P0 §4): tomar el mando → estabilizar → construir capacidad → acelerar →
 * escalar → gobernar. La etapa se deriva SOLO de los meses cerrados de tu empresa (determinista y reproducible
 * desde el diario):
 *  - «Tomar el mando» dura el primer mes, apruebes o no: es tu llegada.
 *  - De ahí en adelante, pasas a la siguiente etapa cuando llevas los meses mínimos en la etapa Y el consejo
 *    aprueba el cierre del último mes. Si no lo aprueba, sigues en la misma etapa: no hay despido ni game over.
 */
import { COMPANY_STAGES, type CompanyStage } from "./identity";

/** Meses mínimos en cada etapa antes de pasar a la siguiente (índice = etapa actual). */
export const STAGE_MONTHS = [1, 2, 3, 3, 4] as const;
/** ¿Hace falta que el consejo apruebe el mes para salir de esa etapa? */
export const STAGE_NEEDS_PASS = [false, true, true, true, true] as const;
export const LAST_COMPANY_STAGE = COMPANY_STAGES.length - 1;

export const stageIndex = (id: string | undefined): number => Math.max(0, COMPANY_STAGES.findIndex((x) => x.id === id));
export const stageLabel = (id: string | undefined): string => COMPANY_STAGES[stageIndex(id)].label;

/** Recorre los meses cerrados en orden y dice en qué etapa queda la empresa y cuántos meses lleva en ella. */
export function stageTrack(runs: readonly { passed: boolean }[]): { idx: number; months: number } {
  let idx = 0, months = 0;
  for (const r of runs) {
    months++;
    if (idx < LAST_COMPANY_STAGE && months >= STAGE_MONTHS[idx] && (!STAGE_NEEDS_PASS[idx] || r.passed)) { idx++; months = 0; }
  }
  return { idx, months };
}
export const stageIdOf = (idx: number): CompanyStage => COMPANY_STAGES[Math.max(0, Math.min(idx, LAST_COMPANY_STAGE))].id;

/** ¿Cerrar el mes en curso (con este resultado) pasa a la siguiente etapa? */
export function closesStage(idx: number, monthsBefore: number, passed: boolean): boolean {
  if (idx >= LAST_COMPANY_STAGE) return false;
  return monthsBefore + 1 >= STAGE_MONTHS[idx] && (!STAGE_NEEDS_PASS[idx] || passed);
}
