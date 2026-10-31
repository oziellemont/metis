/**
 * mêtis CEO · negocio de la empresa del jugador (P0-C).
 *
 * `businessOf(state)` reconstruye los números de la empresa desde lo que ya está guardado:
 *  - mes 0 = tu llegada (línea base del perfil × tipo de empresa);
 *  - un mes por cada periodo cerrado de la carrera continua (`career`, solo los de esta empresa);
 *  - el mes en curso, con lo que llevas decidido (se marca «en curso»: es una proyección, no un cierre).
 * Cada mes usa el cambio de los 5 índices durante ese periodo. Los índices nunca se suman al dinero: lo mueven
 * con los coeficientes de los supuestos (model.ts).
 *
 * El tiempo del negocio avanza por cierre de periodo, no por reloj: las vacaciones no mueven nada.
 */
import { companyById } from "../companies";
import { KPI_KEYS, closedRunsOf, isContinuous, kpis, nowOf, packOf } from "../engine";
import type { CeoState, Kpis } from "../types";
import { profileFor, type BusinessProfile } from "./profiles";
import { simulate, type PeriodInput, type PeriodState } from "./model";

export * from "./model";
export * from "./profiles";

export interface Business {
  profile: BusinessProfile;
  periods: PeriodState[];
  /** Último mes cerrado (o tu llegada si aún no cierras ninguno). */
  closed: PeriodState;
  /** Mes en curso (proyección con lo decidido hasta hoy). */
  now: PeriodState;
}

const delta = (end: Kpis, start: Kpis): Partial<Kpis> => {
  const d: Partial<Kpis> = {};
  for (const k of KPI_KEYS) { const v = end[k] - start[k]; if (v) d[k] = v; }
  return d;
};

export { closedRunsOf, reportDueOf } from "../engine";

/** Números de la empresa. Null fuera de la carrera continua (las temporadas no tienen negocio). */
export function businessOf(s: CeoState, now = nowOf(s)): Business | null {
  if (!isContinuous(s)) return null;
  const p = s.companyProfile!;
  const base = companyById(p.contentPackId).kpiStart;
  const profile = profileFor(p.metricProfileId, p.contentPackId);
  const inputs: PeriodInput[] = [
    ...closedRunsOf(s).map((r) => ({ kpiDelta: delta(r.kpis, base), status: "cerrado" as const })),
    { kpiDelta: delta(kpis(s, now), packOf(s).kpiStart), status: "en_curso" as const },
  ];
  const log = s.business;
  const periods = simulate(profile, inputs, { seed: p.companyId, archetype: p.archetype, assumptionsVersion: log?.assumptionsVersion, allocations: log?.allocations });
  return { profile, periods, closed: periods[periods.length - 2], now: periods[periods.length - 1] };
}
