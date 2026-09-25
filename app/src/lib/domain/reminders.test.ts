import { describe, expect, it } from "vitest";
import { buildReminders, pendingFor, periodFor, shouldSendToday, DEFAULT_REMINDERS } from "./reminders";
import { demoData } from "../demo/seed";

const scopeName = (id: string) => demoData.scopes.find((s) => s.id === id)?.name ?? id;

describe("periodFor", () => {
  it("del 1 al 15 recuerda el mes anterior (cierre)", () => {
    expect(periodFor(new Date(2026, 9, 3))).toEqual({ year: 2026, month: 9, phase: "cierre" });
    expect(periodFor(new Date(2027, 0, 2))).toEqual({ year: 2026, month: 12, phase: "cierre" });
  });
  it("del 16 en adelante preavisa el mes en curso", () => {
    expect(periodFor(new Date(2026, 9, 25))).toEqual({ year: 2026, month: 10, phase: "preaviso" });
  });
});

describe("shouldSendToday", () => {
  it("respeta días, hora y bandera enabled", () => {
    const s = { ...DEFAULT_REMINDERS, days: [25], hour: 9, timezone: "UTC" };
    expect(shouldSendToday(s, new Date(Date.UTC(2026, 9, 25, 9, 5)))).toBe(true);
    expect(shouldSendToday(s, new Date(Date.UTC(2026, 9, 25, 10, 5)))).toBe(false);
    expect(shouldSendToday(s, new Date(Date.UTC(2026, 9, 24, 9, 5)))).toBe(false);
    expect(shouldSendToday({ ...s, enabled: false }, new Date(Date.UTC(2026, 9, 25, 9, 5)))).toBe(false);
  });
});

describe("pendingFor / buildReminders con datos de Grupo Andes", () => {
  it("Karla (u-km) no cargó rotación nacional de septiembre → 1 pendiente", () => {
    const p = pendingFor("u-km", { year: 2026, month: 9 }, demoData.elementScopes, demoData.elements, demoData.results, scopeName);
    expect(p).toHaveLength(1);
    expect(p[0].elementName).toMatch(/Rotación/);
  });
  it("Mariana (u-mt) ya cargó todo septiembre → 0 pendientes", () => {
    expect(pendingFor("u-mt", { year: 2026, month: 9 }, demoData.elementScopes, demoData.elements, demoData.results, scopeName)).toHaveLength(0);
  });
  it("arma correos para DR con pendientes y resumen para su jefe", () => {
    const msgs = buildReminders({
      tenantName: "Grupo Andes", appUrl: "https://app.metis.mx", settings: DEFAULT_REMINDERS,
      users: demoData.users, elementScopes: demoData.elementScopes, elements: demoData.elements, results: demoData.results,
      scopeName, now: new Date(2026, 9, 3),
    });
    const owners = msgs.filter((m) => m.kind === "owner");
    const managers = msgs.filter((m) => m.kind === "manager");
    expect(owners.map((m) => m.to.userId)).toContain("u-km");
    expect(owners.find((m) => m.to.userId === "u-km")!.subject).toMatch(/septiembre 2026/);
    // el jefe de Karla es Mariana
    expect(managers.map((m) => m.to.userId)).toContain("u-mt");
    expect(managers.find((m) => m.to.userId === "u-mt")!.team!.some((t) => t.userId === "u-km")).toBe(true);
    for (const m of msgs) { expect(m.html).toContain("/carga"); expect(m.text.length).toBeGreaterThan(20); }
  });
  it("sin escalamiento no manda correos a jefes", () => {
    const msgs = buildReminders({
      tenantName: "Grupo Andes", appUrl: "https://app.metis.mx", settings: { ...DEFAULT_REMINDERS, escalateToManager: false },
      users: demoData.users, elementScopes: demoData.elementScopes, elements: demoData.elements, results: demoData.results,
      scopeName, now: new Date(2026, 9, 3),
    });
    expect(msgs.every((m) => m.kind === "owner")).toBe(true);
  });
});
