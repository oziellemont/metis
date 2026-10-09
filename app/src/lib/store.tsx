"use client";
/**
 * Store del modo demo: los datos de Grupo Andes viven en memoria y se persisten en localStorage
 * para que la demo "recuerde" cargas y cambios. Cuando se conecte Supabase, este mismo contrato
 * (`MetisStore`) se implementa con consultas al servidor sin tocar las pantallas.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoData, CURRENT_MONTH, YEAR, type DemoData } from "./demo/seed";
import type { Result, Scorecard, ScorecardItem, Invitation, Tenant, User } from "./domain/types";
import { MetisCtx, deriveHelpers, newId, useMetis, type MetisStore } from "./store-core";
import { approveDrafts } from "./sessions/logic";
import { applyDeletion, scopeTypeUsage } from "./domain/deletion";
import { hasSupabase } from "./supabase/client";
import { SupabaseMetisProvider } from "./store-supabase";

export { useMetis, newId };
export type { MetisStore };

const KEY = "metis-demo-v1";

type Persisted = Pick<DemoData, "results" | "scorecards" | "scorecardItems" | "elements" | "scopes" | "scopeTypes" | "elementScopes" | "units" | "invitations" | "tenant" | "users" | "objectives" | "laes" | "sessions" | "commitments">;
const initial = (): Persisted => ({
  results: demoData.results, scorecards: demoData.scorecards, scorecardItems: demoData.scorecardItems,
  elements: demoData.elements, scopes: demoData.scopes, scopeTypes: demoData.scopeTypes, elementScopes: demoData.elementScopes,
  units: demoData.units, invitations: demoData.invitations, tenant: demoData.tenant,
  users: demoData.users, objectives: demoData.objectives, laes: demoData.laes,
  sessions: demoData.sessions, commitments: demoData.commitments,
});
const PERSIST_VERSION = 4;
export function makeJoinCode(prefix: string) {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = ""; for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)];
  return `${prefix.replace(/[^A-Za-z]/g, "").slice(0, 5).toUpperCase() || "METIS"}-${c}`;
}

/** Elige el proveedor: datos reales (Supabase) si hay credenciales; si no, demo local. */
export function MetisProvider({ children }: { children: ReactNode }) {
  return hasSupabase ? <SupabaseMetisProvider>{children}</SupabaseMetisProvider> : <DemoMetisProvider>{children}</DemoMetisProvider>;
}

function DemoMetisProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(initial);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [currentUserId, setCurrentUser] = useState("u-mt");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        // datos guardados por una versión anterior del demo: se completan con los nuevos catálogos
        if (p.data) setData({ ...initial(), ...p.data, ...(p.version !== PERSIST_VERSION ? { units: demoData.units, invitations: demoData.invitations, tenant: demoData.tenant, users: demoData.users, objectives: demoData.objectives, laes: demoData.laes, sessions: demoData.sessions, commitments: demoData.commitments } : {}) });
        if (p.currentUserId) setCurrentUser(p.currentUserId);
        if (p.month) setMonth(p.month);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify({ version: PERSIST_VERSION, data, currentUserId, month }));
  }, [data, currentUserId, month, hydrated]);

  const saveResult: MetisStore["saveResult"] = useCallback((esId, m, value, log) => {
    let affected: ScorecardItem[] = [];
    setData((d) => {
      const idx = d.results.findIndex((r) => r.elementScopeId === esId && r.year === YEAR && r.month === m);
      const next: Result = {
        id: idx >= 0 ? d.results[idx].id : newId(), elementScopeId: esId, year: YEAR, month: m,
        value, log, loadedBy: currentUserId, loadedAt: new Date().toISOString(),
      };
      const results = idx >= 0 ? d.results.map((r, i) => (i === idx ? next : r)) : [...d.results, next];
      affected = d.scorecardItems.filter((i) => i.elementScopeId === esId);
      return { ...d, results };
    });
    return { affected: data.scorecardItems.filter((i) => i.elementScopeId === esId) };
  }, [currentUserId, data.scorecardItems]);

  const transition: MetisStore["transition"] = useCallback((id, action, by, note) => {
    setData((d) => ({
      ...d,
      scorecards: d.scorecards.map((s): Scorecard => s.id === id
        ? { ...s, status: action, history: [...s.history, { at: new Date().toISOString(), by, action, note }] }
        : s),
    }));
  }, []);

  const updateItem: MetisStore["updateItem"] = useCallback((item) => {
    setData((d) => ({ ...d, scorecardItems: d.scorecardItems.map((i) => (i.id === item.id ? item : i)) }));
  }, []);
  const addItem: MetisStore["addItem"] = useCallback((item) => {
    setData((d) => ({ ...d, scorecardItems: [...d.scorecardItems, item] }));
  }, []);
  const removeItem: MetisStore["removeItem"] = useCallback((itemId) => {
    setData((d) => ({ ...d, scorecardItems: d.scorecardItems.filter((i) => i.id !== itemId) }));
  }, []);
  const upsertElement: MetisStore["upsertElement"] = useCallback((el) => {
    setData((d) => {
      const exists = d.elements.some((e) => e.id === el.id);
      return { ...d, elements: exists ? d.elements.map((e) => (e.id === el.id ? el : e)) : [...d.elements, el] };
    });
  }, []);
  const addScope: MetisStore["addScope"] = useCallback((s) => setData((d) => ({ ...d, scopes: [...d.scopes, s] })), []);
  const addScopeType: MetisStore["addScopeType"] = useCallback((t) => setData((d) => ({ ...d, scopeTypes: [...d.scopeTypes, t] })), []);
  const removeCatalog: MetisStore["removeCatalog"] = useCallback((t) => setData((d) => applyDeletion(d, t)), []);
  const removeScopeType: MetisStore["removeScopeType"] = useCallback((typeId) => {
    const n = scopeTypeUsage(data.scopes, typeId);
    if (n > 0) return { ok: false, reason: `Lo usan ${n} alcance(s). Bórralos o cámbialos primero.` };
    setData((d) => ({ ...d, scopeTypes: d.scopeTypes.filter((t) => t.id !== typeId), elements: d.elements.map((e) => ({ ...e, allowedScopeTypeIds: e.allowedScopeTypeIds.filter((x) => x !== typeId) })) }));
    return { ok: true };
  }, [data.scopes]);
  const upsertUnit: MetisStore["upsertUnit"] = useCallback((u) => {
    setData((d) => {
      const exists = d.units.some((x) => x.id === u.id);
      const units = exists ? d.units.map((x) => (x.id === u.id ? u : x)) : [...d.units, u];
      // mantener el símbolo denormalizado en los elementos que usan la unidad
      const elements = d.elements.map((e) => (e.unitId === u.id ? { ...e, unit: u.symbol } : e));
      return { ...d, units, elements };
    });
  }, []);
  const removeUnit: MetisStore["removeUnit"] = useCallback((unitId) => {
    const inUse = data.elements.filter((e) => e.unitId === unitId).length;
    if (inUse > 0) return { ok: false, reason: `La usan ${inUse} elemento(s) del catálogo. Cambia su unidad primero.` };
    setData((d) => ({ ...d, units: d.units.filter((u) => u.id !== unitId) }));
    return { ok: true };
  }, [data.elements]);
  const invite: MetisStore["invite"] = useCallback((inv) => {
    const full: Invitation = { ...inv, id: newId(), status: "pending", createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, invitations: [full, ...d.invitations.filter((i) => i.email.toLowerCase() !== inv.email.toLowerCase())] }));
    return full;
  }, []);
  const importOrg: MetisStore["importOrg"] = useCallback(async (rows) => {
    const invited: { email: string; invitationId: string }[] = [];
    let updated = 0;
    {
      const d = data;
      const byEmail = new Map(d.users.filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u]));
      const uiRole = (r: string) => (r === "admin" ? "admin" : r === "manager" ? "manager" : "collaborator") as User["role"];
      let users = d.users;
      let invitations = d.invitations;
      rows.forEach((r) => {
        const mgr = r.manager_email ? byEmail.get(r.manager_email) : undefined;
        const u = byEmail.get(r.email);
        if (u) {
          updated++;
          users = users.map((x) => x.id === u.id ? { ...x, title: r.title ?? x.title, area: r.area ?? x.area, employeeNumber: r.employee_number ?? x.employeeNumber, role: x.id === currentUserId ? x.role : uiRole(r.role), managerId: r.manager_email ? mgr?.id ?? null : x.managerId, pendingManagerEmail: r.manager_email && !mgr ? r.manager_email : undefined } : x);
        } else {
          const inv: Invitation = { id: newId(), email: r.email, role: uiRole(r.role), managerId: mgr?.id ?? null, title: r.title ?? undefined, status: "pending", createdAt: new Date().toISOString(), name: r.name ?? undefined, employeeNumber: r.employee_number ?? undefined, area: r.area ?? undefined, managerEmail: r.manager_email ?? undefined };
          invitations = [inv, ...invitations.filter((i) => i.email.toLowerCase() !== r.email)];
          invited.push({ email: r.email, invitationId: inv.id });
        }
      });
      setData({ ...d, users, invitations });
    }
    return { ok: true, invited, updated };
  }, [currentUserId, data]);
  const revokeInvitation: MetisStore["revokeInvitation"] = useCallback((id) => {
    setData((d) => ({ ...d, invitations: d.invitations.map((i) => (i.id === id ? { ...i, status: "revoked" } : i)) }));
  }, []);
  const regenerateJoinCode: MetisStore["regenerateJoinCode"] = useCallback(async () => {
    const code = makeJoinCode(data.tenant.name);
    setData((d) => ({ ...d, tenant: { ...d.tenant, joinCode: code } as Tenant }));
    return code;
  }, [data.tenant.name]);
  const createScorecard: MetisStore["createScorecard"] = useCallback((userId) => {
    setData((d) => {
      if (d.scorecards.some((s) => s.userId === userId && s.year === YEAR)) return d;
      const approver = d.users.find((u) => u.id === userId)?.managerId ?? "";
      const sc: Scorecard = { id: newId(), userId, year: YEAR, status: "draft", approverId: approver ?? "", history: [{ at: new Date().toISOString(), by: currentUserId, action: "draft" }] };
      return { ...d, scorecards: [...d.scorecards, sc] };
    });
  }, [currentUserId]);
  const upsertElementScope: MetisStore["upsertElementScope"] = useCallback((es) => {
    setData((d) => ({ ...d, elementScopes: d.elementScopes.some((x) => x.id === es.id) ? d.elementScopes.map((x) => (x.id === es.id ? es : x)) : [...d.elementScopes, es] }));
  }, []);
  const upsertObjective: MetisStore["upsertObjective"] = useCallback((o) => {
    setData((d) => ({ ...d, objectives: d.objectives.some((x) => x.id === o.id) ? d.objectives.map((x) => (x.id === o.id ? o : x)) : [...d.objectives, o] }));
  }, []);
  const upsertLae: MetisStore["upsertLae"] = useCallback((l) => {
    setData((d) => ({ ...d, laes: d.laes.some((x) => x.id === l.id) ? d.laes.map((x) => (x.id === l.id ? l : x)) : [...d.laes, l] }));
  }, []);
  const updateMember: MetisStore["updateMember"] = useCallback((userId, patch) => {
    setData((d) => ({ ...d, users: d.users.map((u) => u.id === userId ? { ...u, ...patch, managerId: patch.managerId !== undefined ? patch.managerId : u.managerId } : u) }));
  }, []);
  const updateReminders: MetisStore["updateReminders"] = useCallback((r) => {
    setData((d) => ({ ...d, tenant: { ...d.tenant, reminders: r } }));
  }, []);
  const upsertSession: MetisStore["upsertSession"] = useCallback((x) => {
    setData((d) => ({ ...d, sessions: d.sessions.some((s) => s.id === x.id) ? d.sessions.map((s) => (s.id === x.id ? x : s)) : [...d.sessions, x] }));
  }, []);
  const removeSession: MetisStore["removeSession"] = useCallback((id) => {
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id), commitments: d.commitments.filter((c) => !(c.sessionId === id && !c.approved)).map((c) => (c.sessionId === id ? { ...c, sessionId: null } : c)) }));
  }, []);
  const upsertCommitment: MetisStore["upsertCommitment"] = useCallback((x) => {
    setData((d) => ({ ...d, commitments: d.commitments.some((c) => c.id === x.id) ? d.commitments.map((c) => (c.id === x.id ? x : c)) : [...d.commitments, x] }));
  }, []);
  const removeCommitment: MetisStore["removeCommitment"] = useCallback((id) => {
    setData((d) => ({ ...d, commitments: d.commitments.filter((c) => c.id !== id) }));
  }, []);
  const approveSession: MetisStore["approveSession"] = useCallback((id, summary) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) => (s.id === id ? { ...s, status: "closed", closedAt: new Date().toISOString(), ...(summary !== undefined ? { summary } : {}) } : s)),
      commitments: approveDrafts(d.commitments, id),
    }));
  }, []);
  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setData(initial());
    setMonth(CURRENT_MONTH); setCurrentUser("u-mt");
  }, []);

  const value = useMemo<MetisStore>(() => ({
    ...demoData, ...data, ...deriveHelpers(data, YEAR, month),
    mode: "demo", tenants: [{ id: data.tenant.id, name: data.tenant.name, role: "admin" }], switchTenant: () => {}, isPlatformAdmin: false,
    syncError: null, clearSyncError: () => {}, saving: false,
    year: YEAR, month, currentUserId, setMonth, setCurrentUser,
    saveResult, transition, createScorecard, updateItem, addItem, removeItem, upsertElement, upsertElementScope, addScope, addScopeType, removeCatalog, removeScopeType,
    upsertObjective, upsertLae, upsertUnit, removeUnit, invite, importOrg, revokeInvitation, regenerateJoinCode, updateMember, updateReminders, reset,
    upsertSession, removeSession, upsertCommitment, removeCommitment, approveSession,
  }), [data, month, currentUserId, saveResult, transition, createScorecard, updateItem, addItem, removeItem, upsertElement, upsertElementScope, addScope, addScopeType, removeCatalog, removeScopeType,
    upsertObjective, upsertLae, upsertUnit, removeUnit, invite, importOrg, revokeInvitation, regenerateJoinCode, updateMember, updateReminders, reset,
    upsertSession, removeSession, upsertCommitment, removeCommitment, approveSession]);

  return <MetisCtx.Provider value={value}>{children}</MetisCtx.Provider>;
}
