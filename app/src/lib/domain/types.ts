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
  unit: string; // símbolo de la unidad (denormalizado para lectura rápida)
  unitId?: string; // referencia al catálogo de unidades
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
  email?: string;
  title: string;
  initials: string;
  managerId?: string | null;
  role: "admin" | "manager" | "collaborator";
  /** Rol en la base de datos (owner/admin/manager/member/viewer). Sólo en modo real. */
  dbRole?: string;
  teamName?: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  slug?: string;
  /** Año del ejercicio que se está midiendo. */
  fiscalYear?: number;
  logoUrl?: string | null;
  brandColor?: string | null;
  /** Ajustes crudos (jsonb) para no perder llaves al guardar. */
  settings?: Record<string, unknown>;
  /** Código de acceso con el que un colaborador se une al círculo de la empresa. */
  joinCode?: string;
  /** Configuración de recordatorios de cierre de mes. */
  reminders?: ReminderSettings;
}

/** Unidad de medida del catálogo editable por el cliente ($, %, ton, pzas, días…). */
export interface Unit {
  id: string;
  symbol: string;      // lo que se ve junto al número
  name: string;        // nombre largo
  decimals: number;    // decimales por defecto al mostrar
  position: "prefix" | "suffix"; // $1,200  vs  95.0 %
  system?: boolean;    // unidades base que trae METIS (se pueden editar, no borrar si están en uso)
}

export interface ReminderSettings {
  enabled: boolean;
  /** Días del mes en que se envía el aviso (ej. [25, 1, 3]). 1..28 */
  days: number[];
  /** Hora local (0–23) del envío */
  hour: number;
  timezone: string;
  /** Avisar también al jefe cuando su equipo trae pendientes */
  escalateToManager: boolean;
  channels: { email: boolean; whatsapp: boolean };
}

export interface Invitation {
  id: string;
  email: string;
  role: User["role"];
  managerId?: string | null;
  title?: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
  /** Token secreto del enlace de invitación (modo real). */
  token?: string;
}
