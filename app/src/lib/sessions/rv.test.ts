import { describe, expect, it } from "vitest";
import type { Session } from "../domain/types";
import { googleCalendarUrl, localParts, planRvs, rvIcs, rvPairs, rvStage, rvWhenLabel, zonedDate } from "./rv";
import { rvInviteEmail, rvReminderEmail } from "./rv-email";
import { commitmentsToReview, involves, previousSession, sessionTitle } from "./logic";
import { RV_GUIDE } from "./guide";
import { MODULES } from "../academy/content";

const TZ = "America/Monterrey";
const users = [
  { id: "ceo", managerId: null },
  { id: "jefa", managerId: "ceo" },
  { id: "a", managerId: "jefa" },
  { id: "b", managerId: "jefa" },
  { id: "solo", managerId: "fuera" }, // su jefe no está en la empresa
];
// jueves 8 oct 2026, 9:00 Monterrey
const now = zonedDate(2026, 10, 8, 9, 0, TZ);
type S = Pick<Session, "kind" | "leaderId" | "participantId" | "status" | "scheduledAt" | "closedAt">;
const rv = (leaderId: string, participantId: string, at: Date, p: Partial<S> = {}): S => ({ kind: "rv", leaderId, participantId, status: "closed", scheduledAt: at.toISOString(), closedAt: at.toISOString(), ...p });

describe("zona horaria", () => {
  it("convierte hora de Monterrey a UTC y de regreso", () => {
    const d = zonedDate(2026, 10, 13, 10, 30, TZ);
    expect(d.toISOString()).toBe("2026-10-13T16:30:00.000Z"); // Monterrey = UTC-6 todo el año
    const p = localParts(d, TZ);
    expect([p.y, p.m, p.d, p.h, p.min, p.dow]).toEqual([2026, 10, 13, 10, 30, 2]);
    expect(rvWhenLabel(d, TZ)).toBe("martes 13 de octubre · 10:30");
  });
});

describe("parejas jefe → reporte", () => {
  it("cada jefe con cada reporte directo, sin gente cuyo jefe no está", () => {
    expect(rvPairs(users)).toEqual([
      { leaderId: "ceo", participantId: "jefa" },
      { leaderId: "jefa", participantId: "a" },
      { leaderId: "jefa", participantId: "b" },
    ]);
  });
});

describe("agenda automática", () => {
  it("primera vez: mar–jue 10:00–12:30, al menos 4 días después y sin choques", () => {
    const plan = planRvs({ users, sessions: [], now, cadenceWeeks: 6, tz: TZ });
    expect(plan).toHaveLength(3);
    for (const p of plan) {
      const l = localParts(p.at, TZ);
      expect([2, 3, 4]).toContain(l.dow);
      expect(l.h * 60 + l.min).toBeGreaterThanOrEqual(600);
      expect(l.h * 60 + l.min).toBeLessThanOrEqual(750);
      expect(p.at.getTime() - now.getTime()).toBeGreaterThan(3 * 86_400_000);
      expect(p.first).toBe(true);
    }
    // la jefa está en 3 RV (con su jefe y con sus 2 reportes): ninguna a la misma hora
    const jefa = plan.filter((p) => p.leaderId === "jefa" || p.participantId === "jefa").map((p) => p.at.getTime());
    expect(new Set(jefa).size).toBe(3);
    // la primera cae el martes 13 a las 10:00
    expect(rvWhenLabel(plan[0].at, TZ)).toBe("martes 13 de octubre · 10:00");
  });

  it("6 semanas después de la última cerrada (u 8 si es bimestral)", () => {
    const last = zonedDate(2026, 9, 22, 10, 0, TZ); // mar 22 sep
    const s = [rv("jefa", "a", last)];
    const six = planRvs({ users, sessions: s, now, cadenceWeeks: 6, tz: TZ }).find((p) => p.participantId === "a")!;
    expect(rvWhenLabel(six.at, TZ)).toBe("martes 3 de noviembre · 10:00");
    expect(six.first).toBe(false);
    const eight = planRvs({ users, sessions: s, now, cadenceWeeks: 8, tz: TZ }).find((p) => p.participantId === "a")!;
    expect(rvWhenLabel(eight.at, TZ)).toBe("martes 17 de noviembre · 10:00");
  });

  it("si ya se pasó la fecha que tocaba, la agenda pronto (no en el pasado)", () => {
    const s = [rv("jefa", "a", zonedDate(2026, 6, 1, 10, 0, TZ))];
    const p = planRvs({ users, sessions: s, now, cadenceWeeks: 6, tz: TZ }).find((x) => x.participantId === "a")!;
    expect(p.at.getTime()).toBeGreaterThan(now.getTime());
  });

  it("no duplica: si la pareja ya tiene una RV abierta, no agenda otra", () => {
    const s = [rv("jefa", "a", zonedDate(2026, 10, 20, 10, 0, TZ), { status: "scheduled", closedAt: undefined })];
    const plan = planRvs({ users, sessions: s, now, cadenceWeeks: 6, tz: TZ });
    expect(plan.find((p) => p.participantId === "a")).toBeUndefined();
    // y respeta ese horario ocupado de la jefa
    expect(plan.every((p) => p.at.getTime() !== new Date(s[0].scheduledAt).getTime() || (p.leaderId !== "jefa" && p.participantId !== "jefa"))).toBe(true);
  });

  it("evita chocar con otras sesiones de mêtis (WTW) de cualquiera de los dos", () => {
    const wtw: S = { kind: "wtw", leaderId: "jefa", status: "scheduled", scheduledAt: zonedDate(2026, 10, 13, 10, 0, TZ).toISOString() };
    const plan = planRvs({ users: users.slice(0, 3), sessions: [wtw], now, cadenceWeeks: 6, tz: TZ });
    const a = plan.find((p) => p.participantId === "a")!;
    expect(rvWhenLabel(a.at, TZ)).not.toBe("martes 13 de octubre · 10:00");
  });

  it("cadencia inválida → 6 semanas", () => {
    const s = [rv("jefa", "a", zonedDate(2026, 9, 22, 10, 0, TZ))];
    const p = planRvs({ users, sessions: s, now, cadenceWeeks: 3, tz: TZ }).find((x) => x.participantId === "a")!;
    expect(rvWhenLabel(p.at, TZ)).toBe("martes 3 de noviembre · 10:00");
  });
});

describe("recordatorios", () => {
  const ses = zonedDate(2026, 10, 15, 10, 0, TZ); // jueves 15 oct
  const at = (d: number, h = 9) => zonedDate(2026, 10, d, h, 0, TZ);
  it("3 días antes, 1 día antes y el mismo día", () => {
    expect(rvStage(ses, at(11), TZ)).toBeNull();
    expect(rvStage(ses, at(12), TZ)?.stage).toBe("d3");
    expect(rvStage(ses, at(13), TZ)).toBeNull();
    expect(rvStage(ses, at(14), TZ)?.stage).toBe("d1");
    expect(rvStage(ses, at(15), TZ)?.stage).toBe("d0");
  });
  it("después de la fecha: diario en días hábiles hasta que se cierre", () => {
    expect(rvStage(ses, at(16), TZ)).toEqual({ stage: "late", daysLate: 1 });
    expect(rvStage(ses, at(17), TZ)).toBeNull(); // sábado
    expect(rvStage(ses, at(18), TZ)).toBeNull(); // domingo
    expect(rvStage(ses, at(19), TZ)).toEqual({ stage: "late", daysLate: 4 });
  });
  it("si el aviso cae en fin de semana, se manda el día hábil anterior", () => {
    const tue = zonedDate(2026, 10, 13, 10, 0, TZ); // martes: −3 = sábado → viernes 9; −1 = lunes 12
    expect(rvStage(tue, at(9), TZ)?.stage).toBe("d3");
    expect(rvStage(tue, at(10), TZ)).toBeNull();
    expect(rvStage(tue, at(12), TZ)?.stage).toBe("d1");
  });
});

describe("invitación de calendario", () => {
  const start = zonedDate(2026, 10, 13, 10, 30, TZ);
  const inv = { sessionId: "s1", start, title: "Revisión Vertical · Mariana y Diego", description: "Guía, paso 1; paso 2", url: "https://www.metisalign.mx/sesiones/s1", organizer: { name: "Mariana", email: "m@x.mx" }, attendees: [{ name: "Mariana", email: "m@x.mx" }, { name: "Diego", email: "d@x.mx" }], sequence: 7 };
  it("es un .ics válido para Outlook y Google", () => {
    const ics = rvIcs(inv);
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("UID:rv-s1@metisalign.mx");
    expect(ics).toContain("DTSTART:20261013T163000Z");
    expect(ics).toContain("DTEND:20261013T170000Z");
    expect(ics).toContain("ATTENDEE;CN=Diego");
    expect(ics).toContain("SEQUENCE:7");
    expect(ics).toContain("Guía\\, paso 1\\; paso 2");
    expect(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
  it("liga de respaldo a Google Calendar", () => {
    const u = googleCalendarUrl(inv);
    expect(u).toContain("calendar.google.com");
    expect(u).toContain("20261013T163000Z%2F20261013T170000Z");
  });
});

describe("correos", () => {
  const base = { tenantName: "Grupo Andes", appUrl: "https://www.metisalign.mx/", sessionId: "s1", whenLabel: "martes 13 de octubre · 10:30", leader: { name: "Mariana Torres" }, participant: { name: "Diego Pérez" } };
  it("al jefe: la guía de 5 pasos y el scorecard del colaborador", () => {
    const m = rvReminderEmail({ ...base, to: "leader", stage: "d3", attainment: 92.5, kpis: [{ name: "OTIF", scope: "Saltillo", value: "91%", target: "95%", traffic: "below" }], openCommitments: [{ title: "Indicador de causa", late: true }] });
    expect(m.subject).toBe("En 3 días: tu 1 a 1 con Diego");
    for (const g of RV_GUIDE) expect(m.html).toContain(g.label);
    expect(m.html).toContain("Scorecard de Diego");
    expect(m.html).toContain("92.5%");
    expect(m.html).toContain("OTIF");
    expect(m.html).toContain("https://www.metisalign.mx/sesiones/s1");
    expect(m.text).toContain("1. Conecta (3 min)");
  });
  it("al colaborador: cómo prepararse, sin la guía del jefe", () => {
    const m = rvReminderEmail({ ...base, to: "participant", stage: "d1" });
    expect(m.subject).toBe("Mañana: tu 1 a 1 con Mariana");
    expect(m.html).toContain("Para prepararte");
    expect(m.html).not.toContain("Guía para tu 1 a 1");
  });
  it("vencida: le pide al jefe cerrarla y dice que seguirá recordando", () => {
    const m = rvReminderEmail({ ...base, to: "leader", stage: "late", daysLate: 2 });
    expect(m.subject).toBe("Pendiente: cierra en mêtis tu 1 a 1 con Diego");
    expect(m.html).toContain("hace 2 días");
    expect(m.html).toContain("cada día hábil hasta que la sesión se cierre");
  });
  it("invitación y reagenda", () => {
    expect(rvInviteEmail({ ...base, to: "participant", googleUrl: "g" }).subject).toBe("Revisión Vertical con Mariana · martes 13 de octubre · 10:30");
    expect(rvInviteEmail({ ...base, to: "leader", googleUrl: "g", rescheduled: true }).subject).toContain("Cambió tu Revisión Vertical con Diego");
  });
});

describe("la RV dentro de las sesiones", () => {
  const mk = (id: string, kind: Session["kind"], at: string, participantId?: string): Session => ({ id, kind, leaderId: "jefa", participantId, scheduledAt: at, status: "closed" });
  const all = [mk("w1", "wtw", "2026-09-01"), mk("rva1", "rv", "2026-09-02", "a"), mk("rvb1", "rv", "2026-09-03", "b"), mk("w2", "wtw", "2026-09-08"), mk("rva2", "rv", "2026-10-14", "a")];
  it("la RV anterior es la de la misma pareja; la WTW no ve las RV", () => {
    expect(previousSession(all, all[4])?.id).toBe("rva1");
    expect(previousSession(all, all[3])?.id).toBe("w1");
  });
  it("los compromisos del 1 a 1 se revisan en el siguiente 1 a 1", () => {
    const c = [
      { id: "x", kind: "commitment" as const, sessionId: "rva1", ownerId: "a", title: "x", status: "open" as const, approved: true, createdAt: "2026-09-01" },
      { id: "y", kind: "commitment" as const, sessionId: "w1", ownerId: "a", title: "y", status: "open" as const, approved: true, createdAt: "2026-09-01" },
    ];
    expect(commitmentsToReview(all, c, all[4]).map((x) => x.id)).toEqual(["x"]);
    expect(commitmentsToReview(all, c, all[3]).map((x) => x.id)).toEqual(["y"]);
  });
  it("participan solo el jefe y el colaborador", () => {
    expect(involves(all[1], { id: "a", managerId: "jefa" })).toBe(true);
    expect(involves(all[1], { id: "b", managerId: "jefa" })).toBe(false);
    expect(involves(all[0], { id: "b", managerId: "jefa" })).toBe(true);
  });
  it("título con el nombre del colaborador", () => {
    expect(sessionTitle(all[1], "Diego Pérez")).toBe("Revisión Vertical · Diego");
  });
  it("la Academy usa la misma guía", () => {
    const flow = MODULES.find((m) => m.id === "revisiones")!.blocks.find((b) => b.kind === "flow" && b.eyebrow === "Guía · 1 a 1");
    expect(flow && flow.kind === "flow" && flow.steps[0].label).toBe("Conecta (3 min)");
  });
});
