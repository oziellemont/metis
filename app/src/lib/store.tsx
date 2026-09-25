"use client";
/**
 * Store del modo demo: los datos de Grupo Andes viven en memoria y se persisten en localStorage
 * para que la demo "recuerde" cargas y cambios. Cuando se conecte Supabase, este mismo contrato
 * (`MetisStore`) se implementa con consultas al servidor sin tocar las pantallas.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoData, CURRENT_MONTH, YEAR, type DemoData } from "./demo/seed";
import type { Result, Scorecard, ScorecardItem, ScorecardStatus, Element, Scope, ScopeType } from "./domain/types";
import { attainment, findResult, traffic, weightFor, weightedAttainment, type ItemEvaluation } from "./domain/scoring";

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
  reset: () => void;
  // helpers derivados
  evaluate: (item: ScorecardItem, month?: number) => ItemEvaluation;
  scorecardAttainment: (scorecardId: string, month?: number) => ReturnType<typeof weightedAttainment>;
}

const Ctx = createContext<MetisStore | null>(null);

type Persisted = Pick<DemoData, "results" | "scorecards" | "scorecardItems" | "elements" | "scopes" | "scopeTypes" | "elementScopes">;

export function MetisProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(() => ({
    results: demoData.results, scorecards: demoData.scorecards, scorecardItems: demoData.scorecardItems,
    elements: demoData.elements, scopes: demoData.scopes, scopeTypes: demoData.scopeTypes, elementScopes: demoData.elementScopes,
  }));
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [currentUserId, setCurrentUser] = useState("u-mt");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.data) setData(p.data);
        if (p.currentUserId) setCurrentUser(p.currentUserId);
        if (p.month) setMonth(p.month);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify({ data, currentUserId, month }));
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
  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setData({ results: demoData.results, scorecards: demoData.scorecards, scorecardItems: demoData.scorecardItems, elements: demoData.elements, scopes: demoData.scopes, scopeTypes: demoData.scopeTypes, elementScopes: demoData.elementScopes });
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
    return {
      ...demoData, ...data, year: YEAR, month, currentUserId, setMonth, setCurrentUser,
      saveResult, transition, updateItem, addItem, removeItem, upsertElement, addScope, addScopeType, reset,
      evaluate, scorecardAttainment,
    };
  }, [data, month, currentUserId, saveResult, transition, updateItem, addItem, removeItem, upsertElement, addScope, addScopeType, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMetis(): MetisStore {
  const s = useContext(Ctx);
  if (!s) throw new Error("useMetis debe usarse dentro de <MetisProvider>");
  return s;
}
