/**
 * Borrado de elementos del catálogo (KPIs/proyectos), de un «medir aquí» (elemento × alcance)
 * y de alcances. Calcula primero el impacto (para avisar al usuario) y después aplica el borrado
 * en memoria con las mismas reglas que la base de datos:
 *  - Se quitan los renglones de scorecard que lo usan y los datos capturados.
 *  - Los compromisos ligados al indicador se conservan, sólo pierden la liga.
 *  - Al borrar un alcance, sus alcances hijos suben un nivel (no se borran).
 */
import type { Commitment, Element, ElementScope, Result, Scope, Scorecard, ScorecardItem } from "./types";

export type DeletionTarget =
  | { kind: "element"; id: string }
  | { kind: "elementScope"; id: string }
  | { kind: "scope"; id: string };

export interface DeletionData {
  elements: Element[];
  elementScopes: ElementScope[];
  scopes: Scope[];
  scorecards: Scorecard[];
  scorecardItems: ScorecardItem[];
  results: Result[];
  commitments: Commitment[];
}

export interface DeletionImpact {
  elementScopeIds: string[];
  items: ScorecardItem[];
  /** Personas (userId) cuyo scorecard pierde renglones. */
  scorecardUserIds: string[];
  results: number;
  commitments: number;
  /** Alcances hijos directos que suben de nivel. */
  childScopes: Scope[];
  /** Nuevo padre de los hijos (null = primer nivel). */
  newParentId: string | null;
}

export function deletionImpact(d: DeletionData, t: DeletionTarget): DeletionImpact {
  const esIds =
    t.kind === "element" ? d.elementScopes.filter((x) => x.elementId === t.id).map((x) => x.id)
    : t.kind === "elementScope" ? d.elementScopes.filter((x) => x.id === t.id).map((x) => x.id)
    : d.elementScopes.filter((x) => x.scopeId === t.id).map((x) => x.id);
  const set = new Set(esIds);
  const items = d.scorecardItems.filter((i) => set.has(i.elementScopeId));
  const scIds = new Set(items.map((i) => i.scorecardId));
  const scorecardUserIds = Array.from(new Set(d.scorecards.filter((s) => scIds.has(s.id)).map((s) => s.userId)));
  const scope = t.kind === "scope" ? d.scopes.find((s) => s.id === t.id) : undefined;
  return {
    elementScopeIds: esIds,
    items,
    scorecardUserIds,
    results: d.results.filter((r) => set.has(r.elementScopeId)).length,
    commitments: d.commitments.filter((c) => c.elementScopeId && set.has(c.elementScopeId)).length,
    childScopes: t.kind === "scope" ? d.scopes.filter((s) => (s.parentId ?? null) === t.id) : [],
    newParentId: scope?.parentId ?? null,
  };
}

/** Aplica el borrado sobre los datos en memoria (no muta: devuelve una copia). */
export function applyDeletion<T extends DeletionData>(d: T, t: DeletionTarget): T {
  const imp = deletionImpact(d, t);
  const es = new Set(imp.elementScopeIds);
  const items = new Set(imp.items.map((i) => i.id));
  return {
    ...d,
    elements: t.kind === "element" ? d.elements.filter((e) => e.id !== t.id) : d.elements,
    elementScopes: d.elementScopes.filter((x) => !es.has(x.id)),
    scorecardItems: d.scorecardItems.filter((i) => !items.has(i.id)),
    results: d.results.filter((r) => !es.has(r.elementScopeId)),
    commitments: d.commitments.map((c) => (c.elementScopeId && es.has(c.elementScopeId) ? { ...c, elementScopeId: null } : c)),
    scopes: t.kind === "scope"
      ? d.scopes.filter((s) => s.id !== t.id).map((s) => ((s.parentId ?? null) === t.id ? { ...s, parentId: imp.newParentId } : s))
      : d.scopes,
  };
}

/** ¿Cuántos alcances usan este tipo? (un tipo en uso no se puede borrar). */
export function scopeTypeUsage(scopes: Scope[], typeId: string): number {
  return scopes.filter((s) => s.typeId === typeId).length;
}
