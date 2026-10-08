"use client";
/**
 * Store REAL de METIS: lee y escribe en Supabase (schema `metis`) para la EMPRESA ACTIVA.
 *
 * Aislamiento por cliente ("portal"):
 *  - Cada fila de la base trae `tenant_id`. RLS en Postgres sólo deja leer/escribir filas de las
 *    empresas a las que pertenece el usuario; además hay candados (triggers) que impiden mezclar
 *    referencias entre empresas. La pantalla filtra por la empresa activa, pero la seguridad vive en la base.
 *  - Si alguien pertenece a varias empresas (p. ej. el consultor METIS), elige el portal en el selector.
 *
 * Colaboración: todo cambio se guarda en la base y se replica a los compañeros con Supabase Realtime
 * (cada navegador conectado al mismo portal recarga los datos al recibir el aviso).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabaseBrowser } from "./supabase/client";
import type { Invitation, Result, Scorecard, ScorecardItem } from "./domain/types";
import { MetisCtx, deriveHelpers, newId, type MetisStore, type StoreData, type TenantOption } from "./store-core";
import { EMPTY, REALTIME_TABLES, dbRoleFor, friendlyDbError, loadTenant, loadTenantList, randomToken, toDb } from "./portal-data";
import { ACTIVE_TENANT_KEY as ACTIVE_KEY } from "./auth";
import { approveDrafts } from "./sessions/logic";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

// ---------------------------------------------------------------- proveedor
export function SupabaseMetisProvider({ children }: { children: ReactNode }) {
  const sb = useMemo(() => supabaseBrowser()!, []);
  const db = useMemo(() => sb.schema("metis"), [sb]);
  const now = new Date();
  const [data, setData] = useState<StoreData>(EMPTY);
  const [me, setMe] = useState<string>("");
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isPlatformAdmin, setPlatformAdmin] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "no-tenant" | "error">("loading");
  const [loadError, setLoadError] = useState<string>("");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const dataRef = useRef(data);
  dataRef.current = data;

  // 1 · sesión + lista de empresas
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await sb.auth.getUser();
      if (!alive) return;
      if (!u.user) { window.location.href = "/login"; return; }
      setMe(u.user.id);
      const [list, adm] = await Promise.all([loadTenantList(sb, u.user.id), db.rpc("is_platform_admin")]);
      if (!alive) return;
      setTenants(list);
      setPlatformAdmin(!adm.error && adm.data === true);
      if (!list.length) { setStatus("no-tenant"); return; }
      const url = new URLSearchParams(window.location.search).get("empresa");
      const saved = url || localStorage.getItem(ACTIVE_KEY);
      setActiveId(list.find((t) => t.id === saved)?.id ?? list[0].id);
    })().catch((e) => { setLoadError(String(e?.message ?? e)); setStatus("error"); });
    return () => { alive = false; };
  }, [sb, db]);

  // 2 · datos de la empresa activa
  const reload = useCallback(async (tenantId: string) => {
    try {
      const d = await loadTenant(sb, tenantId);
      setData(d);
      setStatus("ready");
    } catch (e: any) {
      // Si ya teníamos el portal abierto (refresco en segundo plano) no tiramos la pantalla: sólo avisamos.
      if (dataRef.current.tenant.id === tenantId) { setSyncError(`No se pudo actualizar: ${String(e?.message ?? e)}`); return; }
      setLoadError(String(e?.message ?? e));
      setStatus("error");
    }
  }, [sb]);

  useEffect(() => {
    if (!activeId) return;
    localStorage.setItem(ACTIVE_KEY, activeId);
    setStatus("loading");
    reload(activeId);
  }, [activeId, reload]);

  // 3 · tiempo real: cualquier cambio de un compañero en ESTA empresa refresca la vista
  useEffect(() => {
    if (!activeId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const bump = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => reload(activeId), 600); };
    const ch = sb.channel(`metis-${activeId}`);
    REALTIME_TABLES.forEach((table) => {
      const filter = table === "tenants" ? `id=eq.${activeId}` : table === "element_allowed_scope_types" ? undefined : `tenant_id=eq.${activeId}`;
      ch.on("postgres_changes" as any, { event: "*", schema: "metis", table, ...(filter ? { filter } : {}) }, bump);
    });
    ch.subscribe();
    const onFocus = () => bump();
    window.addEventListener("focus", onFocus);
    return () => { if (timer) clearTimeout(timer); window.removeEventListener("focus", onFocus); sb.removeChannel(ch); };
  }, [activeId, sb, reload]);

  // Ejecuta una escritura; si falla, avisa y recarga para deshacer el cambio optimista.
  const run = useCallback((label: string, fn: () => PromiseLike<{ error: { message: string } | null } | void>) => {
    setPending((p) => p + 1);
    Promise.resolve(fn())
      .then((r) => { if (r && r.error) throw new Error(r.error.message); })
      .catch((e: any) => { setSyncError(`${label}: ${friendlyDbError(String(e?.message ?? e))}`); if (activeId) reload(activeId); })
      .finally(() => setPending((p) => p - 1));
  }, [activeId, reload]);

  const T = activeId;
  const year = data.tenant.fiscalYear ?? now.getFullYear();

  // ------------------------------------------------------------- mutaciones
  const saveResult: MetisStore["saveResult"] = useCallback((esId, m, value, log) => {
    const prev = dataRef.current.results.find((r) => r.elementScopeId === esId && r.year === year && r.month === m);
    const row: Result = { id: prev?.id ?? newId(), elementScopeId: esId, year, month: m, value, log, loadedBy: me, loadedAt: new Date().toISOString() };
    setData((d) => ({ ...d, results: prev ? d.results.map((r) => (r.id === prev.id ? row : r)) : [...d.results, row] }));
    run("No se guardó el dato", () => db.from("results").upsert(toDb.result(T, row), { onConflict: "element_scope_id,year,month" }));
    return { affected: dataRef.current.scorecardItems.filter((i) => i.elementScopeId === esId) };
  }, [db, T, me, year, run]);

  const transition: MetisStore["transition"] = useCallback((id, action, _by, note) => {
    const sc = dataRef.current.scorecards.find((s) => s.id === id);
    setData((d) => ({ ...d, scorecards: d.scorecards.map((s) => s.id === id ? { ...s, status: action, history: [...s.history, { at: new Date().toISOString(), by: me, action, note }] } : s) }));
    run("No se cambió el estado", async () => {
      const u = await db.from("scorecards").update({ status: action }).eq("id", id);
      if (u.error) return u;
      return db.from("scorecard_events").insert(toDb.event(T, id, me, sc?.status ?? null, action, note));
    });
  }, [db, T, me, run]);

  const createScorecard: MetisStore["createScorecard"] = useCallback((userId) => {
    if (dataRef.current.scorecards.some((s) => s.userId === userId && s.year === year)) return;
    const approver = dataRef.current.users.find((u) => u.id === userId)?.managerId ?? null;
    const sc: Scorecard = { id: newId(), userId, year, status: "draft", approverId: approver ?? "", history: [{ at: new Date().toISOString(), by: me, action: "draft" }] };
    setData((d) => ({ ...d, scorecards: [...d.scorecards, sc] }));
    run("No se creó el scorecard", async () => {
      const r = await db.from("scorecards").insert(toDb.scorecard(T, sc));
      if (r.error) return r;
      return db.from("scorecard_events").insert(toDb.event(T, sc.id, me, null, "draft"));
    });
  }, [db, T, me, year, run]);

  const itemRow = useCallback((i: ScorecardItem) => toDb.item(T, i), [T]);
  const updateItem: MetisStore["updateItem"] = useCallback((item) => {
    setData((d) => ({ ...d, scorecardItems: d.scorecardItems.map((i) => (i.id === item.id ? item : i)) }));
    run("No se guardó el elemento del scorecard", () => db.from("scorecard_items").update(itemRow(item)).eq("id", item.id));
  }, [db, itemRow, run]);
  const addItem: MetisStore["addItem"] = useCallback((item) => {
    setData((d) => ({ ...d, scorecardItems: [...d.scorecardItems, item] }));
    run("No se agregó al scorecard", () => db.from("scorecard_items").insert(itemRow(item)));
  }, [db, itemRow, run]);
  const removeItem: MetisStore["removeItem"] = useCallback((itemId) => {
    setData((d) => ({ ...d, scorecardItems: d.scorecardItems.filter((i) => i.id !== itemId) }));
    run("No se quitó del scorecard", () => db.from("scorecard_items").delete().eq("id", itemId));
  }, [db, run]);

  const upsertElement: MetisStore["upsertElement"] = useCallback((el) => {
    setData((d) => ({ ...d, elements: d.elements.some((e) => e.id === el.id) ? d.elements.map((e) => (e.id === el.id ? el : e)) : [...d.elements, el] }));
    run("No se guardó el elemento", async () => {
      const r = await db.from("elements").upsert(toDb.element(T, el));
      if (r.error) return r;
      const del = await db.from("element_allowed_scope_types").delete().eq("element_id", el.id);
      if (del.error) return del;
      if (!el.allowedScopeTypeIds.length) return;
      return db.from("element_allowed_scope_types").insert(el.allowedScopeTypeIds.map((st) => ({ element_id: el.id, scope_type_id: st })));
    });
  }, [db, T, run]);

  const upsertElementScope: MetisStore["upsertElementScope"] = useCallback((es) => {
    setData((d) => ({ ...d, elementScopes: d.elementScopes.some((x) => x.id === es.id) ? d.elementScopes.map((x) => (x.id === es.id ? es : x)) : [...d.elementScopes, es] }));
    run("No se asignó el alcance", () => db.from("element_scopes").upsert(toDb.elementScope(T, es)));
  }, [db, T, run]);

  const addScope: MetisStore["addScope"] = useCallback((s) => {
    setData((d) => ({ ...d, scopes: [...d.scopes, s] }));
    run("No se agregó el alcance", () => db.from("scopes").insert(toDb.scope(T, s)));
  }, [db, T, run]);
  const addScopeType: MetisStore["addScopeType"] = useCallback((t) => {
    setData((d) => ({ ...d, scopeTypes: [...d.scopeTypes, t] }));
    run("No se agregó el tipo de alcance", () => db.from("scope_types").insert(toDb.scopeType(T, t, dataRef.current.scopeTypes.length)));
  }, [db, T, run]);

  const upsertObjective: MetisStore["upsertObjective"] = useCallback((o) => {
    setData((d) => ({ ...d, objectives: d.objectives.some((x) => x.id === o.id) ? d.objectives.map((x) => (x.id === o.id ? o : x)) : [...d.objectives, o] }));
    run("No se guardó el objetivo", () => db.from("objectives").upsert(toDb.objective(T, o)));
  }, [db, T, run]);
  const upsertLae: MetisStore["upsertLae"] = useCallback((l) => {
    setData((d) => ({ ...d, laes: d.laes.some((x) => x.id === l.id) ? d.laes.map((x) => (x.id === l.id ? l : x)) : [...d.laes, l] }));
    run("No se guardó la LAE", () => db.from("laes").upsert(toDb.lae(T, l)));
  }, [db, T, run]);

  const upsertUnit: MetisStore["upsertUnit"] = useCallback((u) => {
    setData((d) => ({
      ...d, units: d.units.some((x) => x.id === u.id) ? d.units.map((x) => (x.id === u.id ? u : x)) : [...d.units, u],
      elements: d.elements.map((e) => (e.unitId === u.id ? { ...e, unit: u.symbol } : e)),
    }));
    run("No se guardó la unidad", () => db.from("units").upsert(toDb.unit(T, u)));
  }, [db, T, run]);
  const removeUnit: MetisStore["removeUnit"] = useCallback((unitId) => {
    const inUse = dataRef.current.elements.filter((e) => e.unitId === unitId).length;
    if (inUse > 0) return { ok: false, reason: `La usan ${inUse} elemento(s) del catálogo. Cambia su unidad primero.` };
    setData((d) => ({ ...d, units: d.units.filter((u) => u.id !== unitId) }));
    run("No se borró la unidad", () => db.from("units").delete().eq("id", unitId));
    return { ok: true };
  }, [db, run]);

  const invite: MetisStore["invite"] = useCallback((inv) => {
    const full: Invitation = { ...inv, id: newId(), token: randomToken(), status: "pending", createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, invitations: [full, ...d.invitations.filter((i) => !(i.email.toLowerCase() === inv.email.toLowerCase() && i.status === "pending"))] }));
    run("No se guardó la invitación", async () => {
      const old = await db.from("invitations").update({ status: "revoked" }).eq("tenant_id", T).eq("status", "pending").ilike("email", inv.email);
      if (old.error) return old;
      return db.from("invitations").insert(toDb.invitation(T, full, me));
    });
    return full;
  }, [db, T, me, run]);
  const revokeInvitation: MetisStore["revokeInvitation"] = useCallback((id) => {
    setData((d) => ({ ...d, invitations: d.invitations.map((i) => (i.id === id ? { ...i, status: "revoked" } : i)) }));
    run("No se revocó la invitación", () => db.from("invitations").update({ status: "revoked" }).eq("id", id));
  }, [db, run]);
  const regenerateJoinCode: MetisStore["regenerateJoinCode"] = useCallback(async () => {
    const r = await db.rpc("regenerate_join_code", { p_tenant: T });
    if (r.error) { setSyncError(`No se regeneró el código: ${friendlyDbError(r.error.message)}`); return dataRef.current.tenant.joinCode ?? ""; }
    const code = String(r.data);
    setData((d) => ({ ...d, tenant: { ...d.tenant, joinCode: code } }));
    return code;
  }, [db, T]);

  const updateMember: MetisStore["updateMember"] = useCallback((userId, patch) => {
    const prev = dataRef.current.users.find((u) => u.id === userId);
    const dbRole = patch.role ? dbRoleFor(patch.role, prev?.dbRole) : undefined;
    setData((d) => ({ ...d, users: d.users.map((u) => u.id === userId ? { ...u, ...(patch.role ? { role: patch.role, dbRole } : {}), ...(patch.managerId !== undefined ? { managerId: patch.managerId } : {}), ...(patch.title !== undefined ? { title: patch.title } : {}) } : u) }));
    const row: Row = {};
    if (dbRole) row.role = dbRole;
    if (patch.managerId !== undefined) row.manager_id = patch.managerId || null;
    if (patch.title !== undefined) row.title = patch.title || null;
    run("No se actualizó la persona", () => db.from("memberships").update(row).eq("tenant_id", T).eq("user_id", userId));
  }, [db, T, run]);

  const updateReminders: MetisStore["updateReminders"] = useCallback((r) => {
    const settings = { ...(dataRef.current.tenant.settings ?? {}), reminders: r };
    setData((d) => ({ ...d, tenant: { ...d.tenant, reminders: r, settings } }));
    run("No se guardaron los recordatorios", () => db.from("tenants").update({ settings }).eq("id", T));
  }, [db, T, run]);

  const upsertSession: MetisStore["upsertSession"] = useCallback((x) => {
    setData((d) => ({ ...d, sessions: d.sessions.some((s) => s.id === x.id) ? d.sessions.map((s) => (s.id === x.id ? x : s)) : [...d.sessions, x] }));
    run("No se guardó la sesión", () => db.from("sessions").upsert(toDb.session(T, x)));
  }, [db, T, run]);
  const removeSession: MetisStore["removeSession"] = useCallback((id) => {
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id), commitments: d.commitments.filter((c) => !(c.sessionId === id && !c.approved)).map((c) => (c.sessionId === id ? { ...c, sessionId: null } : c)) }));
    run("No se borró la sesión", async () => {
      const del = await db.from("commitments").delete().eq("session_id", id).eq("approved", false);
      if (del.error) return del;
      return db.from("sessions").delete().eq("id", id);
    });
  }, [db, run]);
  const upsertCommitment: MetisStore["upsertCommitment"] = useCallback((x) => {
    setData((d) => ({ ...d, commitments: d.commitments.some((c) => c.id === x.id) ? d.commitments.map((c) => (c.id === x.id ? x : c)) : [...d.commitments, x] }));
    run("No se guardó el compromiso", () => db.from("commitments").upsert(toDb.commitment(T, x)));
  }, [db, T, run]);
  const removeCommitment: MetisStore["removeCommitment"] = useCallback((id) => {
    setData((d) => ({ ...d, commitments: d.commitments.filter((c) => c.id !== id) }));
    run("No se borró el compromiso", () => db.from("commitments").delete().eq("id", id));
  }, [db, run]);
  const approveSession: MetisStore["approveSession"] = useCallback((id, summary) => {
    const closedAt = new Date().toISOString();
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) => (s.id === id ? { ...s, status: "closed", closedAt, ...(summary !== undefined ? { summary } : {}) } : s)),
      commitments: approveDrafts(d.commitments, id),
    }));
    run("No se aprobó la sesión", async () => {
      const u = await db.from("sessions").update({ status: "closed", closed_at: closedAt, ...(summary !== undefined ? { summary } : {}) }).eq("id", id);
      if (u.error) return u;
      return db.from("commitments").update({ approved: true }).eq("session_id", id).eq("approved", false);
    });
  }, [db, run]);

  const reset = useCallback(() => { if (activeId) reload(activeId); }, [activeId, reload]);
  const switchTenant = useCallback((id: string) => { if (id !== activeId) setActiveId(id); }, [activeId]);
  const clearSyncError = useCallback(() => setSyncError(null), []);
  const noop = useCallback(() => {}, []);

  const value = useMemo<MetisStore>(() => ({
    ...data, ...deriveHelpers(data, year, month),
    mode: "supabase", tenants, switchTenant, isPlatformAdmin, syncError, clearSyncError, saving: pending > 0,
    year, month, currentUserId: me, setMonth, setCurrentUser: noop,
    saveResult, transition, createScorecard, updateItem, addItem, removeItem, upsertElement, upsertElementScope, addScope, addScopeType,
    upsertObjective, upsertLae, upsertUnit, removeUnit, invite, revokeInvitation, regenerateJoinCode, updateMember, updateReminders, reset,
    upsertSession, removeSession, upsertCommitment, removeCommitment, approveSession,
  }), [data, year, month, tenants, switchTenant, isPlatformAdmin, syncError, clearSyncError, pending, me, noop, saveResult, transition, createScorecard,
    updateItem, addItem, removeItem, upsertElement, upsertElementScope, addScope, addScopeType, upsertObjective, upsertLae, upsertUnit, removeUnit,
    invite, revokeInvitation, regenerateJoinCode, updateMember, updateReminders, reset,
    upsertSession, removeSession, upsertCommitment, removeCommitment, approveSession]);

  if (status === "no-tenant") {
    return <Gate title="Aún no perteneces a ninguna empresa" body="Captura el código de tu empresa o abre la invitación que te enviaron." href="/unirme" cta="Unirme a mi empresa" extra={isPlatformAdmin ? { href: "/consola", cta: "Ir a la consola METIS" } : undefined} />;
  }
  if (status === "error") {
    return <Gate title="No pudimos abrir el portal" body={loadError} href="/inicio" cta="Reintentar" onClick={() => window.location.reload()} />;
  }
  if (status === "loading" || !data.tenant.id) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-slate-500">
        <div className="flex items-center gap-3"><span className="h-4 w-4 rounded-full border-2 border-indigo border-t-transparent animate-spin" /> Abriendo el portal de tu empresa…</div>
      </div>
    );
  }
  return <MetisCtx.Provider value={value}>{children}</MetisCtx.Provider>;
}

function Gate({ title, body, href, cta, onClick, extra }: { title: string; body: string; href: string; cta: string; onClick?: () => void; extra?: { href: string; cta: string } }) {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="card p-8 max-w-md text-center">
        <div className="text-lg font-semibold">{title}</div>
        <p className="text-sm text-slate-500 mt-2 break-words">{body}</p>
        <div className="mt-6 flex justify-center gap-2">
          {onClick ? <button className="btn-primary" onClick={onClick}>{cta}</button> : <a className="btn-primary" href={href}>{cta}</a>}
          {extra && <a className="btn-ghost" href={extra.href}>{extra.cta}</a>}
        </div>
      </div>
    </div>
  );
}
