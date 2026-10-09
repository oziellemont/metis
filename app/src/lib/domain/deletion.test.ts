import { describe, expect, it } from "vitest";
import { applyDeletion, deletionImpact, scopeTypeUsage, type DeletionData } from "./deletion";

const base = (): DeletionData => ({
  elements: [
    { id: "e1", type: "kpi", name: "OTIF", formula: "", unit: "%", direction: "up", laeId: "l", allowedScopeTypeIds: [] },
    { id: "e2", type: "project", name: "ERP", formula: "", unit: "%", direction: "up", laeId: "l", allowedScopeTypeIds: [] },
  ],
  scopes: [
    { id: "s1", typeId: "t1", name: "México", parentId: null },
    { id: "s2", typeId: "t2", name: "Norte", parentId: "s1" },
    { id: "s3", typeId: "t3", name: "Planta MTY", parentId: "s2" },
  ],
  elementScopes: [
    { id: "es1", elementId: "e1", scopeId: "s1", ownerUserId: "u1" },
    { id: "es2", elementId: "e1", scopeId: "s2", ownerUserId: "u2" },
    { id: "es3", elementId: "e2", scopeId: "s2", ownerUserId: "u2" },
  ],
  scorecards: [
    { id: "sc1", userId: "u1", year: 2026, status: "approved", approverId: "", history: [] },
    { id: "sc2", userId: "u2", year: 2026, status: "draft", approverId: "", history: [] },
  ],
  scorecardItems: [
    { id: "i1", scorecardId: "sc1", elementScopeId: "es1", responsibility: "owner", weight: 50, targets: { min: 1, sat: 2, out: 3 }, period: "monthly" },
    { id: "i2", scorecardId: "sc2", elementScopeId: "es2", responsibility: "owner", weight: 50, targets: { min: 1, sat: 2, out: 3 }, period: "monthly" },
    { id: "i3", scorecardId: "sc2", elementScopeId: "es3", responsibility: "owner", weight: 50, targets: { min: 1, sat: 2, out: 3 }, period: "monthly" },
  ],
  results: [
    { id: "r1", elementScopeId: "es1", year: 2026, month: 1, value: 90 },
    { id: "r2", elementScopeId: "es2", year: 2026, month: 1, value: 80 },
    { id: "r3", elementScopeId: "es3", year: 2026, month: 1, value: 70 },
  ],
  commitments: [
    { id: "c1", kind: "commitment", ownerId: "u2", title: "Subir OTIF", status: "open", elementScopeId: "es2", approved: true, createdAt: "" },
  ],
} as DeletionData);

describe("borrar elemento del catálogo", () => {
  it("avisa qué se afecta", () => {
    const imp = deletionImpact(base(), { kind: "element", id: "e1" });
    expect(imp.elementScopeIds).toEqual(["es1", "es2"]);
    expect(imp.items.map((i) => i.id)).toEqual(["i1", "i2"]);
    expect(imp.scorecardUserIds.sort()).toEqual(["u1", "u2"]);
    expect(imp.results).toBe(2);
    expect(imp.commitments).toBe(1);
  });
  it("quita el elemento, sus alcances, renglones y datos; conserva el compromiso sin liga", () => {
    const d = applyDeletion(base(), { kind: "element", id: "e1" });
    expect(d.elements.map((e) => e.id)).toEqual(["e2"]);
    expect(d.elementScopes.map((x) => x.id)).toEqual(["es3"]);
    expect(d.scorecardItems.map((i) => i.id)).toEqual(["i3"]);
    expect(d.results.map((r) => r.id)).toEqual(["r3"]);
    expect(d.commitments[0]).toMatchObject({ id: "c1", elementScopeId: null });
  });
});

describe("dejar de medir en un alcance", () => {
  it("sólo quita ese elemento × alcance", () => {
    const d = applyDeletion(base(), { kind: "elementScope", id: "es1" });
    expect(d.elements).toHaveLength(2);
    expect(d.elementScopes.map((x) => x.id)).toEqual(["es2", "es3"]);
    expect(d.scorecardItems.map((i) => i.id)).toEqual(["i2", "i3"]);
  });
});

describe("borrar alcance", () => {
  it("los hijos suben un nivel y se quita lo medido en ese alcance", () => {
    const imp = deletionImpact(base(), { kind: "scope", id: "s2" });
    expect(imp.childScopes.map((s) => s.id)).toEqual(["s3"]);
    expect(imp.newParentId).toBe("s1");
    const d = applyDeletion(base(), { kind: "scope", id: "s2" });
    expect(d.scopes.find((s) => s.id === "s3")?.parentId).toBe("s1");
    expect(d.scopes.some((s) => s.id === "s2")).toBe(false);
    expect(d.elementScopes.map((x) => x.id)).toEqual(["es1"]);
    expect(d.elements).toHaveLength(2); // el catálogo no se toca
  });
  it("si era de primer nivel, los hijos quedan en primer nivel", () => {
    const d = applyDeletion(base(), { kind: "scope", id: "s1" });
    expect(d.scopes.find((s) => s.id === "s2")?.parentId).toBeNull();
  });
  it("un tipo en uso se cuenta", () => {
    expect(scopeTypeUsage(base().scopes, "t2")).toBe(1);
    expect(scopeTypeUsage(base().scopes, "t9")).toBe(0);
  });
});
