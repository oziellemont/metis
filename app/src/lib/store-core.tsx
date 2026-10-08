"use client";
/**
 * Contrato común del store de METIS. Lo implementan dos proveedores:
 *  - DemoProvider (store.tsx): datos ficticios en memoria + localStorage.
 *  - SupabaseProvider (store-supabase.tsx): datos reales de la empresa activa,
 *    aislados por RLS en Supabase. Lo que guarda un usuario lo ven sus compañeros.
 * Las pantallas sólo conocen `useMetis()`, así que no cambian entre modos.
 */
import { createContext, useContext } from "react";
import type { DemoData } from "./demo/seed";
import type {
  Commitment, Session, Element, ElementScope, Invitation, LAE, ReminderSettings, Result, Scope, ScopeType, Scorecard, ScorecardItem,
  ScorecardStatus, StrategicObjective, Tenant, Unit, User,
} from "./domain/types";
import { attainment, findResult, traffic, weightFor, weightedAttainment, type ItemEvaluation } from "./domain/scoring";
import { fmtWithUnit } from "./labels";

export type StoreData = DemoData;

export interface TenantOption { id: string; name: string; role: string; logoUrl?: string | null; brandColor?: string | null }

export interface MetisStore extends StoreData {
  mode: "demo" | "supabase";
  /** Empresas a las que pertenece el usuario (portal activo = tenant). */
  tenants: TenantOption[];
  switchTenant: (tenantId: string) => void;
  isPlatformAdmin: boolean;
  /** Último error al guardar (se muestra en un aviso). */
  syncError: string | null;
  clearSyncError: () => void;
  saving: boolean;

  year: number;
  month: number;
  currentUserId: string;
  setMonth: (m: number) => void;
  setCurrentUser: (id: string) => void;
  /** Guarda o actualiza el dato real de un elemento-alcance (lo hace el Owner). */
  saveResult: (elementScopeId: string, month: number, value: number, log?: string) => { affected: ScorecardItem[] };
  /** Cambia el estado de un scorecard registrando historial. */
  transition: (scorecardId: string, action: ScorecardStatus, byUserId: string, note?: string) => void;
  createScorecard: (userId: string) => void;
  updateItem: (item: ScorecardItem) => void;
  addItem: (item: ScorecardItem) => void;
  removeItem: (itemId: string) => void;
  upsertElement: (el: Element) => void;
  /** Medir un elemento en un alcance con su Owner. */
  upsertElementScope: (es: ElementScope) => void;
  addScope: (s: Scope) => void;
  addScopeType: (t: ScopeType) => void;
  upsertObjective: (o: StrategicObjective) => void;
  upsertLae: (l: LAE) => void;
  /** Catálogo de unidades (editable por el cliente). */
  upsertUnit: (u: Unit) => void;
  removeUnit: (unitId: string) => { ok: boolean; reason?: string };
  unitOf: (el: Element) => Unit | undefined;
  /** Formatea un valor con la unidad del elemento (símbolo, posición y decimales del catálogo). */
  fmt: (v: number | null | undefined, el: Element) => string;
  /** Usuario por id; si no existe devuelve un marcador "Sin asignar" (nunca undefined). */
  userOf: (id: string | null | undefined) => User;
  /** Búsquedas seguras: nunca devuelven undefined (marcador si el registro ya no existe). */
  esOf: (id: string | null | undefined) => ElementScope;
  elementOf: (id: string | null | undefined) => Element;
  scopeOf: (id: string | null | undefined) => Scope;
  laeOf: (id: string | null | undefined) => LAE;
  scorecardOf: (id: string | null | undefined) => Scorecard;
  /** Acceso al círculo de la empresa. */
  invite: (inv: Omit<Invitation, "id" | "status" | "createdAt">) => Invitation;
  revokeInvitation: (id: string) => void;
  regenerateJoinCode: () => Promise<string>;
  updateMember: (userId: string, patch: { role?: User["role"]; managerId?: string | null; title?: string }) => void;
  updateReminders: (r: ReminderSettings) => void;
  /** Sesiones WTW/WTM: crear o actualizar (agenda, estado, notas, resumen, focos). */
  upsertSession: (s: Session) => void;
  removeSession: (sessionId: string) => void;
  /** Compromisos y solicitudes de apoyo. */
  upsertCommitment: (c: Commitment) => void;
  removeCommitment: (id: string) => void;
  /** El líder aprueba la sesión: queda cerrada y sus borradores se vuelven tareas. */
  approveSession: (sessionId: string, summary?: string) => void;
  reset: () => void;
  // helpers derivados
  evaluate: (item: ScorecardItem, month?: number) => ItemEvaluation;
  scorecardAttainment: (scorecardId: string, month?: number) => ReturnType<typeof weightedAttainment>;
}

export const MetisCtx = createContext<MetisStore | null>(null);

export function useMetis(): MetisStore {
  const s = useContext(MetisCtx);
  if (!s) throw new Error("useMetis debe usarse dentro de <MetisProvider>");
  return s;
}

/** Identificador único para registros nuevos (válido como uuid en Postgres). */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] ?? "")).toUpperCase();
}

export const UNKNOWN_USER: User = { id: "", name: "Sin asignar", title: "", initials: "?", role: "collaborator" };
export const MISSING_ES: ElementScope = { id: "", elementId: "", scopeId: "", ownerUserId: "" };
export const MISSING_ELEMENT: Element = { id: "", type: "kpi", name: "(elemento eliminado)", formula: "", unit: "", direction: "up", laeId: "", allowedScopeTypeIds: [] };
export const MISSING_SCOPE: Scope = { id: "", typeId: "", name: "—" };
export const MISSING_LAE: LAE = { id: "", objectiveId: "", name: "Sin LAE", color: "#94A3B8" };
export const MISSING_SCORECARD: Scorecard = { id: "", userId: "", year: 0, status: "draft", approverId: "", history: [] };

/** Helpers derivados que no dependen de dónde vienen los datos. */
export function deriveHelpers(data: Pick<StoreData, "elementScopes" | "elements" | "results" | "scorecardItems" | "units" | "users" | "scopes" | "laes" | "scorecards">, year: number, month: number) {
  const elementOf = (esId: string): Element | undefined => {
    const es = data.elementScopes.find((x) => x.id === esId);
    return es ? data.elements.find((e) => e.id === es.elementId) : undefined;
  };
  const evaluate = (item: ScorecardItem, m = month): ItemEvaluation => {
    const el = elementOf(item.elementScopeId);
    const r = findResult(data.results, item.elementScopeId, year, m);
    const v = r?.value ?? null;
    const dir = el?.direction ?? "up";
    return { item, value: v, traffic: traffic(v, item.targets, dir), attainment: attainment(v, item.targets, dir), weight: weightFor(item, m) };
  };
  const scorecardAttainment = (scId: string, m = month) =>
    weightedAttainment(data.scorecardItems.filter((i) => i.scorecardId === scId).map((i) => evaluate(i, m)));
  const unitOf = (el: Element) => data.units.find((u) => u.id === el.unitId) ?? data.units.find((u) => u.symbol === el.unit);
  const fmt = (v: number | null | undefined, el: Element) => fmtWithUnit(v, unitOf(el), el.unit);
  const userOf = (id: string | null | undefined): User => (id && data.users.find((u) => u.id === id)) || UNKNOWN_USER;
  const esOf = (id: string | null | undefined) => (id && data.elementScopes.find((x) => x.id === id)) || MISSING_ES;
  const elementById = (id: string | null | undefined) => (id && data.elements.find((x) => x.id === id)) || MISSING_ELEMENT;
  const scopeOf = (id: string | null | undefined) => (id && data.scopes.find((x) => x.id === id)) || MISSING_SCOPE;
  const laeOf = (id: string | null | undefined) => (id && data.laes.find((x) => x.id === id)) || MISSING_LAE;
  const scorecardOf = (id: string | null | undefined) => (id && data.scorecards.find((x) => x.id === id)) || MISSING_SCORECARD;
  return { evaluate, scorecardAttainment, unitOf, fmt, userOf, esOf, elementOf: elementById, scopeOf, laeOf, scorecardOf };
}

export type { Tenant, Result, Scorecard };
