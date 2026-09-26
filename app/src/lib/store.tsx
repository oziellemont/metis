"use client";
/**
 * Store del modo demo: los datos de Grupo Andes viven en memoria y se persisten en localStorage
 * para que la demo "recuerde" cargas y cambios. Cuando se conecte Supabase, este mismo contrato
 * (`MetisStore`) se implementa con consultas al servidor sin tocar las pantallas.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoData, CURRENT_MONTH, YEAR, type DemoData } from "./demo/seed";
import type { Result, Scorecard, ScorecardItem, ScorecardStatus, Element, Scope, ScopeType, Unit, Invitation, ReminderSettings, Tenant } from "./domain/types";
import { attainment, findResult, traffic, weightFor, weightedAttainment, type ItemEvaluation } from "./domain/scoring";
import { fmtWithUnit } from "./labels";

const KEY = "metis-demo-v1";

export interface MetisStore extends DemoData {
  year: number;
  month: number;
  currentUserId: string;
  setMonth: (m: number) => void;
  setCurrentUser: (id: string) => void;
  /** Guarda o actualiza el dato real de un elemento-alcance (lo hace el DR). */
  saveResult: (elementScopeId: string, month: number, value: number, log?: string) => { affected: ScorecardItem[] };
  /** Cambia el estado de un scorecard registrando historial. */
  transition: (scorecardId: string, action: ScorecardStatus, byUserId: string, note?: string) => void;
  updateItem: (item: ScorecardItem) => void;
  addItem: (item: ScorecardItem) => void;
  removeItem: (itemId: string) => void;
  upsertElement: (el: Element) => void;
  addScope: (s: Scope) => void;
  addScopeType: (t: ScopeType) => void;
  /** Catálogo de unidades (editable por el cliente). */
  upsertUnit: (u: Unit) => void;
  removeUnit: (unitId: string) => { ok: boolean; reason?: string };
  unitOf: (el: Element) => Unit | undefined;
  /** Formatea un valor con la unidad del elemento (símbolo, posición y decimales del catálogo). */
  fmt: (v: number | null | undefined, el: Element) => string;
  /** Acceso al círculo de la empresa. */
  invite: (inv: Omit<Invitation, "id" | "status" | "createdAt">) => Invitation;
  revokeInvitation: (id: string) => void;
  regenerateJoinCode: () => string;
  updateReminders: (r: ReminderSettings) => void;
  reset: () => void;
  // helpers derivados
  evaluate: (item: ScorecardItem, month?: number) => ItemEvaluation;
  scorecardAttainment: (scorecardId: string, month?: number) => ReturnType<typeof weightedAttainment>;
}

const Ctx = createContext<MetisStore | null>(null);

type Persisted = Pick<DemoData, "results" | "scorecards" | "scorecardItems" | "elements" | "scopes" | "scopeTypes" | "elementScopes" | "units" | "invitations" | "tenant">;
const initial = (): Persisted => ({
  results: demoData.results, scorecards: demoData.scorecards, scorecardItems: demoData.scorecardItems,
  elements: demoData.elements, scopes: demoData.scopes, scopeTypes: demoData.scopeTypes, elementScopes: demoData.elementScopes,
  units: demoData.units, invitations: demoData.invitations, tenant: demoData.tenant,
});
const PERSIST_VERSION = 2;
export function makeJoinCode(prefix: string) {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = ""; for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)];
  return `${prefix.replace(/[^A-Za-z]/g, "").slice(0, 5).toUpperCase() || "METIS"}-${c}`;
}

export function MetisProvider({ children }: { children: ReactNode }) {
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
        if (p.data) setData({ ...initial(), ...p.data, ...(p.version !== PERSIST_VERSION ? { units: demoData.units, invitations: demoData.invitations, tenant: demoData.tenant } : {}) });
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
        id: idx >= 0 ? d.results[idx].id : `${esId}-${m}-${Date.now()}`, elementScopeId: esId, year: YEAR, month: m,
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
    const full: Invitation = { ...inv, id: `inv-${Date.now()}`, status: "pending", createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, invitations: [full, ...d.invitations.filter((i) => i.email.toLowerCase() !== inv.email.toLowerCase())] }));
    return full;
  }, []);
  const revokeInvitation: MetisStore["revokeInvitation"] = useCallback((id) => {
    setData((d) => ({ ...d, invitations: d.invitations.map((i) => (i.id === id ? { ...i, status: "revoked" } : i)) }));
  }, []);
  const regenerateJoinCode: MetisStore["regenerateJoinCode"] = useCallback(() => {
    const code = makeJoinCode(data.tenant.name);
    setData((d) => ({ ...d, tenant: { ...d.tenant, joinCode: code } as Tenant }));
    return code;
  }, [data.tenant.name]);
  const updateReminders: MetisStore["updateReminders"] = useCallback((r) => {
    setData((d) => ({ ...d, tenant: { ...d.tenant, reminders: r } }));
  }, []);
  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setData(initial());
    setMonth(CURRENT_MONTH); setCurrentUser("u-mt");
  }, []);

  const value = useMemo<MetisStore>(() => {
    const elementOf = (esId: string) => {
      const es = data.elementScopes.find((x) => x.id === esId)!;
      return data.elements.find((e) => e.id === es.elementId)!;
    };
    const evaluate = (item: ScorecardItem, m = month): ItemEvaluation => {
      const el = elementOf(item.elementScopeId);
      const r = findResult(data.results, item.elementScopeId, YEAR, m);
      const v = r?.value ?? null;
      return { item, value: v, traffic: traffic(v, item.targets, el.direction), attainment: attainment(v, item.targets, el.direction), weight: weightFor(item, m) };
    };
    const scorecardAttainment = (scId: string, m = month) =>
      weightedAttainment(data.scorecardItems.filter((i) => i.scorecardId === scId).map((i) => evaluate(i, m)));
    const unitOf = (el: Element) => data.units.find((u) => u.id === el.unitId) ?? data.units.find((u) => u.symbol === el.unit);
    const fmt = (v: number | null | undefined, el: Element) => fmtWithUnit(v, unitOf(el), el.unit);
    return {
      ...demoData, ...data, year: YEAR, month, currentUserId, setMonth, setCurrentUser,
      saveResult, transition, updateItem, addItem, removeItem, upsertElement, addScope, addScopeType,
      upsertUnit, removeUnit, unitOf, fmt, invite, revokeInvitation, regenerateJoinCode, updateReminders, reset,
      evaluate, scorecardAttainment,
    };
  }, [data, month, currentUserId, saveResult, transition, updateItem, addItem, removeItem, upsertElement, addScope, addScopeType, upsertUnit, removeUnit, invite, revokeInvitation, regenerateJoinCode, updateReminders, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMetis(): MetisStore {
  const s = useContext(Ctx);
  if (!s) throw new Error("useMetis debe usarse dentro de <MetisProvider>");
  return s;
}
