/**
 * Capa de datos del portal real: lee la empresa activa de Supabase y convierte filas ↔ tipos de la UI.
 * Sin React, para poder probarla contra una base real (ver portal.it.test.ts).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_REMINDERS } from "./domain/reminders";
import type {
  Element, ElementScope, Invitation, LAE, Period, ReminderSettings, Result, Scope, ScopeType, Scorecard, ScorecardItem,
  ScorecardStatus, StrategicObjective, Tenant, Unit, User,
} from "./domain/types";
import { initialsOf, type StoreData, type TenantOption } from "./store-core";

export const REALTIME_TABLES = [
  "tenants", "memberships", "objectives", "laes", "scope_types", "scopes", "units", "elements",
  "element_allowed_scope_types", "element_scopes", "scorecards", "scorecard_items", "scorecard_events", "results", "invitations",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export const EMPTY: StoreData = {
  tenant: { id: "", name: "", plan: "crece" }, units: [], users: [], objectives: [], laes: [], scopeTypes: [], scopes: [],
  elements: [], elementScopes: [], scorecards: [], scorecardItems: [], results: [], invitations: [],
};

// ---------------------------------------------------------------- mapeos DB ↔ UI
const uiRole = (r: string): User["role"] => (r === "owner" || r === "admin" ? "admin" : r === "manager" ? "manager" : "collaborator");
export const dbRoleFor = (r: User["role"], prev?: string) => (r === "admin" ? (prev === "owner" ? "owner" : "admin") : r === "manager" ? "manager" : "member");
const PERIODS: Period[] = ["monthly", "bimonthly", "quarterly", "annual"];
const uiPeriod = (p: string): Period => (PERIODS.includes(p as Period) ? (p as Period) : "monthly");
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function weightsToArray(item: ScorecardItem): number[] | null {
  const mw = item.monthlyWeights;
  if (!mw || Object.keys(mw).length === 0) return null;
  return Array.from({ length: 12 }, (_, i) => Number(mw[i + 1] ?? item.weight));
}
function weightsFromArray(arr: unknown, base: number): ScorecardItem["monthlyWeights"] {
  if (!Array.isArray(arr) || arr.length !== 12) return undefined;
  const out: Record<number, number> = {};
  arr.forEach((v, i) => { if (v !== null && Number(v) !== base) out[i + 1] = Number(v); });
  return Object.keys(out).length ? out : undefined;
}
export function randomToken() {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}
export function friendlyDbError(msg: string): string {
  if (/cross_tenant/i.test(msg)) return "Ese dato pertenece a otra empresa y no se puede mezclar con este portal.";
  if (/row-level security|permission denied|42501/i.test(msg)) return "No tienes permiso para hacer este cambio en esta empresa.";
  if (/duplicate key/i.test(msg)) return "Ya existe un registro con ese nombre o código.";
  if (/violates foreign key|restrict/i.test(msg)) return "No se puede borrar: otros registros dependen de éste.";
  return msg;
}

/** Conversión UI → fila de la base (la usan el proveedor y las pruebas de integración). */
export const toDb = {
  result: (T: string, r: Result) => ({ id: r.id, tenant_id: T, element_scope_id: r.elementScopeId, year: r.year, month: r.month, value: r.value, log: r.log ?? null, loaded_by: r.loadedBy ?? null, loaded_at: r.loadedAt ?? new Date().toISOString() }),
  scorecard: (T: string, sc: Scorecard) => ({ id: sc.id, tenant_id: T, user_id: sc.userId, year: sc.year, status: sc.status, approver_id: sc.approverId || null }),
  event: (T: string, scorecardId: string, actor: string, from: ScorecardStatus | null, to: ScorecardStatus, note?: string) => ({ tenant_id: T, scorecard_id: scorecardId, actor_id: actor, from_status: from, to_status: to, comment: note ?? null }),
  item: (T: string, i: ScorecardItem) => ({
    id: i.id, tenant_id: T, scorecard_id: i.scorecardId, element_scope_id: i.elementScopeId, responsibility: i.responsibility,
    weight: i.weight, monthly_weights: weightsToArray(i), target_min: i.targets.min, target_sat: i.targets.sat, target_out: i.targets.out, period: i.period,
  }),
  element: (T: string, el: Element) => ({ id: el.id, tenant_id: T, lae_id: el.laeId, type: el.type, name: el.name, formula: el.formula || null, unit_id: el.unitId ?? null, unit: el.unit || "%", direction: el.direction }),
  elementScope: (T: string, es: ElementScope) => ({ id: es.id, tenant_id: T, element_id: es.elementId, scope_id: es.scopeId, owner_user_id: es.ownerUserId || null }),
  scope: (T: string, sc: Scope) => ({ id: sc.id, tenant_id: T, scope_type_id: sc.typeId, parent_id: sc.parentId ?? null, name: sc.name }),
  scopeType: (T: string, t: ScopeType, level: number) => ({ id: t.id, tenant_id: T, name: t.name, level }),
  objective: (T: string, o: StrategicObjective) => { const h = o.horizon ? parseInt(o.horizon, 10) : NaN; return { id: o.id, tenant_id: T, name: o.name, description: o.description ?? null, horizon: Number.isFinite(h) ? h : null }; },
  lae: (T: string, l: LAE) => ({ id: l.id, tenant_id: T, objective_id: l.objectiveId, name: l.name, color: l.color ?? null }),
  unit: (T: string, u: Unit) => ({ id: u.id, tenant_id: T, symbol: u.symbol, name: u.name, decimals: u.decimals, position: u.position, is_system: !!u.system }),
  invitation: (T: string, inv: Invitation, invitedBy: string) => ({ id: inv.id, tenant_id: T, email: inv.email.toLowerCase(), role: dbRoleFor(inv.role), title: inv.title ?? null, manager_id: inv.managerId ?? null, token: inv.token, invited_by: invitedBy }),
};

export async function loadTenant(sb: SupabaseClient, tenantId: string): Promise<StoreData> {
  const db = sb.schema("metis");
  const q = (t: string, cols = "*") => db.from(t).select(cols).eq("tenant_id", tenantId);
  const [tenantR, memR, unitsR, objR, laeR, stR, scR, elR, esR, scdR, itR, evR, resR, invR] = await Promise.all([
    db.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
    q("memberships"),
    q("units"),
    q("objectives").order("sort_order").order("created_at"),
    q("laes").order("sort_order").order("created_at"),
    q("scope_types").order("level").order("name"),
    q("scopes").order("name"),
    q("elements").order("created_at"),
    q("element_scopes"),
    q("scorecards"),
    q("scorecard_items").order("sort_order"),
    q("scorecard_events").order("created_at"),
    q("results"),
    q("invitations").order("created_at", { ascending: false }),
  ]);
  const firstErr = [tenantR, memR, unitsR, objR, laeR, stR, scR, elR, esR, scdR, itR, evR, resR].find((r) => r.error)?.error;
  if (firstErr) throw new Error(firstErr.message);
  if (!tenantR.data) throw new Error("No tienes acceso a esta empresa.");

  const elementIds = (elR.data ?? []).map((e: Row) => e.id);
  const eastR = elementIds.length
    ? await db.from("element_allowed_scope_types").select("element_id, scope_type_id").in("element_id", elementIds)
    : { data: [] as Row[], error: null };
  const memberIds = (memR.data ?? []).map((m: Row) => m.user_id);
  const profR = memberIds.length
    ? await db.from("profiles").select("id, full_name, email").in("id", memberIds)
    : { data: [] as Row[], error: null };

  const t = tenantR.data as Row;
  const settings = (t.settings ?? {}) as Record<string, unknown>;
  const tenant: Tenant = {
    id: t.id, name: t.name, plan: t.plan, slug: t.slug, logoUrl: t.logo_url ?? null, brandColor: t.brand_color ?? null,
    joinCode: t.join_code ?? undefined, settings, fiscalYear: t.fiscal_year ?? undefined,
    reminders: { ...DEFAULT_REMINDERS, ...((settings.reminders as Partial<ReminderSettings>) ?? {}) },
  };

  const profiles = new Map<string, Row>((profR.data ?? []).map((p: Row) => [p.id, p]));
  const users: User[] = (memR.data ?? []).filter((m: Row) => m.active !== false).map((m: Row) => {
    const p = profiles.get(m.user_id);
    const name = p?.full_name || p?.email?.split("@")[0] || "Colaborador";
    return {
      id: m.user_id, name, email: p?.email, title: m.title ?? "", initials: initialsOf(name),
      managerId: m.manager_id ?? null, role: uiRole(m.role), dbRole: m.role,
    };
  });

  const allowed = new Map<string, string[]>();
  (eastR.data ?? []).forEach((r: Row) => allowed.set(r.element_id, [...(allowed.get(r.element_id) ?? []), r.scope_type_id]));

  const events = new Map<string, Scorecard["history"]>();
  (evR.data ?? []).forEach((e: Row) => {
    events.set(e.scorecard_id, [...(events.get(e.scorecard_id) ?? []), { at: e.created_at, by: e.actor_id ?? "", action: e.to_status, note: e.comment ?? undefined }]);
  });

  return {
    tenant,
    users,
    units: (unitsR.data ?? []).map((u: Row): Unit => ({ id: u.id, symbol: u.symbol, name: u.name, decimals: u.decimals, position: u.position ?? "suffix", system: !!u.is_system })),
    objectives: (objR.data ?? []).map((o: Row): StrategicObjective => ({ id: o.id, name: o.name, description: o.description ?? undefined, horizon: o.horizon ? String(o.horizon) : undefined })),
    laes: (laeR.data ?? []).map((l: Row): LAE => ({ id: l.id, objectiveId: l.objective_id, name: l.name, color: l.color ?? undefined })),
    scopeTypes: (stR.data ?? []).map((s: Row): ScopeType => ({ id: s.id, name: s.name })),
    scopes: (scR.data ?? []).map((s: Row): Scope => ({ id: s.id, typeId: s.scope_type_id, name: s.name, parentId: s.parent_id ?? null })),
    elements: (elR.data ?? []).filter((e: Row) => e.active !== false).map((e: Row): Element => ({
      id: e.id, type: e.type === "project" ? "project" : "kpi", name: e.name, formula: e.formula ?? "", unit: e.unit ?? "",
      unitId: e.unit_id ?? undefined, direction: e.direction, laeId: e.lae_id, allowedScopeTypeIds: allowed.get(e.id) ?? [],
    })),
    elementScopes: (esR.data ?? []).filter((x: Row) => x.active !== false).map((x: Row): ElementScope => ({ id: x.id, elementId: x.element_id, scopeId: x.scope_id, ownerUserId: x.owner_user_id ?? "" })),
    scorecards: (scdR.data ?? []).map((s: Row): Scorecard => ({ id: s.id, userId: s.user_id, year: s.year, status: s.status, approverId: s.approver_id ?? "", history: events.get(s.id) ?? [] })),
    scorecardItems: (itR.data ?? []).map((i: Row): ScorecardItem => {
      const weight = Number(i.weight);
      return {
        id: i.id, scorecardId: i.scorecard_id, elementScopeId: i.element_scope_id, responsibility: i.responsibility, weight,
        monthlyWeights: weightsFromArray(i.monthly_weights, weight),
        targets: { min: Number(i.target_min), sat: Number(i.target_sat), out: Number(i.target_out) }, period: uiPeriod(i.period),
      };
    }),
    results: (resR.data ?? []).map((r: Row): Result => ({
      id: r.id, elementScopeId: r.element_scope_id, year: r.year, month: r.month, value: num(r.value), log: r.log ?? undefined,
      evidenceUrl: r.evidence_url ?? undefined, loadedBy: r.loaded_by ?? undefined, loadedAt: r.loaded_at ?? undefined,
    })),
    invitations: (invR.data ?? []).map((i: Row): Invitation => ({
      id: i.id, email: i.email, role: uiRole(i.role), managerId: i.manager_id ?? null, title: i.title ?? undefined,
      status: i.status === "pending" && new Date(i.expires_at) < new Date() ? "revoked" : i.status === "accepted" ? "accepted" : i.status === "pending" ? "pending" : "revoked",
      createdAt: i.created_at, token: i.token,
    })),
  } as StoreData;
}

export async function loadTenantList(sb: SupabaseClient, userId: string): Promise<TenantOption[]> {
  const db = sb.schema("metis");
  const r = await db.rpc("my_tenants");
  if (!r.error && Array.isArray(r.data)) {
    return (r.data as Row[]).map((t) => ({ id: t.tenant_id, name: t.name, role: t.role, logoUrl: t.logo_url, brandColor: t.brand_color }));
  }
  // Respaldo si aún no corre la migración 0005.
  const m = await db.from("memberships").select("tenant_id, role, tenants:tenants(name)").eq("user_id", userId).eq("active", true);
  return (m.data ?? []).map((x: Row) => {
    const t = Array.isArray(x.tenants) ? x.tenants[0] : x.tenants;
    return { id: x.tenant_id, name: t?.name ?? "Empresa", role: x.role };
  });
}

