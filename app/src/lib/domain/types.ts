/**
 * Tipos del dominio METIS.
 * Los valores internos están en inglés (estables para la base de datos);
 * las etiquetas visibles al usuario viven en `lib/labels.ts`.
 */

export type ElementType = "kpi" | "project";
export type Direction = "up" | "down"; // up = incremental (↑ más es mejor), down = decremental (↓ menos es mejor)
export type Period = "monthly" | "bimonthly" | "quarterly" | "annual";
/** owner = DR (Dueño del Resultado) · contributor = CV (Contribuidor Vinculado) */
export type Responsibility = "owner" | "contributor";
export type ScorecardStatus = "draft" | "submitted" | "approved" | "changes_requested" | "rejected";
export type Traffic = "outstanding" | "satisfactory" | "minimum" | "below" | "pending";

export interface StrategicObjective {
  id: string;
  name: string;
  description?: string;
  horizon?: string; // ej. "2028"
}

/** LAE · Línea de Acción Estratégica */
export interface LAE {
  id: string;
  objectiveId: string;
  name: string;
  color?: string;
}

export interface ScopeType {
  id: string;
  name: string; // Nacional, Región, Ciudad, Planta, CEDIS, Unidad de negocio, Canal
}

export interface Scope {
  id: string;
  typeId: string;
  name: string;
  parentId?: string | null;
}

/** Elemento del catálogo: un KPI o un proyecto */
export interface Element {
  id: string;
  type: ElementType;
  name: string;
  formula: string;
  unit: string; // %, $, días, # ...
  direction: Direction;
  laeId: string;
  allowedScopeTypeIds: string[];
}

/** Un elemento medido en un alcance concreto, con su dueño (DR) */
export interface ElementScope {
  id: string;
  elementId: string;
  scopeId: string;
  ownerUserId: string; // DR
}

export interface Targets {
  min: number;
  sat: number;
  out: number; // sobresaliente
}

export interface ScorecardItem {
  id: string;
  scorecardId: string;
  elementScopeId: string;
  responsibility: Responsibility;
  weight: number; // ponderación base (%), puede sobreescribirse por mes
  monthlyWeights?: Partial<Record<number, number>>; // mes 1..12 → peso
  targets: Targets;
  period: Period;
}

export interface Scorecard {
  id: string;
  userId: string;
  year: number;
  status: ScorecardStatus;
  approverId: string;
  history: { at: string; by: string; action: ScorecardStatus; note?: string }[];
}

export interface Result {
  id: string;
  elementScopeId: string;
  year: number;
  month: number; // 1..12
  value: number | null;
  log?: string; // bitácora
  evidenceUrl?: string;
  loadedBy?: string;
  loadedAt?: string;
}

export interface User {
  id: string;
  name: string;
  title: string;
  initials: string;
  managerId?: string | null;
  role: "admin" | "manager" | "collaborator";
  teamName?: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: "arranque" | "crecimiento" | "escala" | "corporativo";
}
