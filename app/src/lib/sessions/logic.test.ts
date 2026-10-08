import { describe, expect, it } from "vitest";
import type { Commitment, Session } from "../domain/types";
import {
  approveDrafts, bucketOf, commitmentState, commitmentsToReview, compliance, defaultDue, dueLabel, isoWeek, mondayOf,
  previousSession, sessionTitle, suggestDate, tasksOf, teamOf, withStatus, wtmPeriod,
} from "./logic";
import { demoSessions, demoCommitments } from "./demo";
import { users } from "../demo/seed";

const today = new Date(2026, 9, 8, 10); // jue 8 oct 2026
const c = (p: Partial<Commitment>): Commitment => ({
  id: Math.random().toString(36), kind: "commitment", ownerId: "u-dp", title: "x", status: "open", approved: true, createdAt: "2026-10-01T00:00:00Z", ...p,
});
const s = (id: string, at: string, p: Partial<Session> = {}): Session => ({ id, kind: "wtw", leaderId: "u-mt", scheduledAt: at, status: "closed", ...p });

describe("fechas", () => {
  it("lunes de la semana y semana ISO", () => {
    expect(mondayOf(today).getDate()).toBe(5);
    expect(isoWeek(new Date(2026, 9, 5))).toBe(41);
  });
  it("sugiere la próxima WTW en lunes y la WTM en día hábil", () => {
    const w = suggestDate("wtw", today);
    expect(w.getDay()).toBe(1);
    expect(w.getDate()).toBe(12);
    const m = suggestDate("wtm", today); // 1 nov 2026 es domingo → lunes 2
    expect(m.getMonth()).toBe(10);
    expect(m.getDate()).toBe(2);
  });
  it("vencimiento sugerido: el viernes (o el siguiente si ya pasó)", () => {
    expect(defaultDue(today)).toBe("2026-10-09");
    expect(defaultDue(new Date(2026, 9, 10))).toBe("2026-10-16");
  });
  it("la WTM de los primeros días cierra el mes anterior", () => {
    expect(wtmPeriod(new Date(2026, 9, 2, 9).toISOString())).toEqual({ year: 2026, month: 9 });
    expect(wtmPeriod(new Date(2026, 9, 28, 9).toISOString())).toEqual({ year: 2026, month: 10 });
    expect(sessionTitle({ kind: "wtm", scheduledAt: new Date(2026, 9, 2, 9).toISOString() })).toBe("WTM · Cierre de septiembre");
  });
  it("etiquetas de vencimiento", () => {
    expect(dueLabel("2026-10-08", today)).toBe("Hoy");
    expect(dueLabel("2026-10-09", today)).toBe("Mañana");
    expect(dueLabel("2026-10-05", today)).toBe("Hace 3 días");
    expect(dueLabel(null, today)).toBe("Sin fecha");
  });
});

describe("estado de un compromiso", () => {
  it("abierto con fecha pasada = vencido", () => {
    expect(commitmentState(c({ dueDate: "2026-10-07" }), today)).toBe("late");
    expect(commitmentState(c({ dueDate: "2026-10-08" }), today)).toBe("open");
    expect(commitmentState(c({ dueDate: "2026-10-07", status: "done" }), today)).toBe("done");
  });
  it("cajas de la lista de tareas", () => {
    expect(bucketOf(c({ dueDate: "2026-10-01" }), today)).toBe("late");
    expect(bucketOf(c({ dueDate: "2026-10-08" }), today)).toBe("today");
    expect(bucketOf(c({ dueDate: "2026-10-11" }), today)).toBe("week");
    expect(bucketOf(c({ dueDate: "2026-10-12" }), today)).toBe("later");
    expect(bucketOf(c({}), today)).toBe("nodate");
  });
  it("marcar cumplido guarda la fecha y reabrir la limpia", () => {
    const d = withStatus(c({}), "done", today);
    expect(d.doneAt).toBeTruthy();
    expect(withStatus(d, "open").doneAt).toBeNull();
  });
});

describe("sesiones", () => {
  const s1 = s("s1", "2026-09-28T15:00:00Z"), s2 = s("s2", "2026-10-05T15:00:00Z"), s3 = s("s3", "2026-10-12T15:00:00Z", { status: "scheduled" });
  const other = s("o1", "2026-10-06T15:00:00Z", { leaderId: "u-js" });
  const all = [s3, other, s1, s2];

  it("encuentra la sesión anterior del mismo líder", () => {
    expect(previousSession(all, s3)?.id).toBe("s2");
    expect(previousSession(all, s1)).toBeUndefined();
  });
  it("revisa abiertos de sesiones anteriores y lo cerrado desde la última", () => {
    const list = [
      c({ id: "a", sessionId: "s1", status: "open" }),
      c({ id: "b", sessionId: "s1", status: "done", doneAt: "2026-10-01T00:00:00Z" }), // se cerró antes de s2 → ya se revisó
      c({ id: "d", sessionId: "s2", status: "done", doneAt: "2026-10-07T00:00:00Z" }),
      c({ id: "e", sessionId: "s2", status: "open", approved: false }), // borrador: no se revisa
      c({ id: "f", sessionId: "o1", status: "open" }), // otro líder
      c({ id: "g", sessionId: "s3", status: "open" }), // de la misma sesión
    ];
    expect(commitmentsToReview(all, list, s3).map((x) => x.id).sort()).toEqual(["a", "d"]);
  });
  it("aprobar convierte los borradores de esa sesión en tareas", () => {
    const list = approveDrafts([c({ id: "x", sessionId: "s2", approved: false }), c({ id: "y", sessionId: "s1", approved: false })], "s2");
    expect(list.find((x) => x.id === "x")?.approved).toBe(true);
    expect(list.find((x) => x.id === "y")?.approved).toBe(false);
    expect(tasksOf(list, "u-dp").map((x) => x.id)).toEqual(["x"]);
  });
});

describe("cumplimiento", () => {
  it("cuenta cumplidos contra no cumplidos y vencidos; ignora apoyos, cancelados y borradores", () => {
    const list = [
      c({ dueDate: "2026-10-02", status: "done" }),
      c({ dueDate: "2026-10-02", status: "missed" }),
      c({ dueDate: "2026-10-06" }), // vencido
      c({ dueDate: "2026-10-09" }), // aún a tiempo
      c({ dueDate: "2026-10-02", status: "cancelled" }),
      c({ dueDate: "2026-10-02", kind: "support", status: "done" }),
      c({ dueDate: "2026-10-02", status: "done", approved: false }),
    ];
    const r = compliance(list, { from: new Date(2026, 8, 1), to: today, today });
    expect(r).toEqual({ done: 1, missed: 2, total: 3, pct: 33 });
    expect(compliance([], { from: today, to: today, today }).pct).toBeNull();
  });
});

describe("datos demo", () => {
  it("el equipo de Mariana son Diego y Karla", () => {
    expect(teamOf(users, "u-mt").map((u) => u.id).sort()).toEqual(["u-dp", "u-km"]);
  });
  it("los compromisos demo apuntan a sesiones y personas que existen", () => {
    const ses = demoSessions(today), com = demoCommitments(today);
    const ids = new Set(users.map((u) => u.id));
    expect(ses.every((x) => ids.has(x.leaderId))).toBe(true);
    expect(com.every((x) => ids.has(x.ownerId) && (!x.sessionId || ses.some((y) => y.id === x.sessionId)))).toBe(true);
    const next = ses.find((x) => x.leaderId === "u-mt" && x.status === "scheduled")!;
    expect(commitmentsToReview(ses, com, next).length).toBeGreaterThan(2);
  });
});

import { commitmentReminderEmail, isWorkday } from "./email";
describe("correo de compromisos", () => {
  it("asunto según vencidos y escapa HTML", () => {
    const m = commitmentReminderEmail({ name: "Diego Pérez", tenantName: "Grupo Andes", appUrl: "https://x.mx/", items: [
      { title: "Rentar <2> unidades", dueDate: "2026-10-05", late: true, support: false },
      { title: "Ventana Ramos", dueDate: "2026-10-08", late: false, support: false },
    ] });
    expect(m.subject).toBe("Diego, tienes 1 compromiso vencido");
    expect(m.html).toContain("Rentar &" + "lt;2&" + "gt; unidades");
    expect(m.html).not.toContain("<2>");
    expect(m.html).toContain("https://x.mx/compromisos");
    expect(commitmentReminderEmail({ name: "Ana", tenantName: "X", appUrl: "https://x.mx", items: [{ title: "a", dueDate: "2026-10-08", late: false, support: false }] }).subject).toBe("Ana, hoy vence 1 compromiso");
  });
  it("solo de lunes a viernes", () => {
    expect(isWorkday(new Date("2026-10-08T15:00:00Z"))).toBe(true); // jueves
    expect(isWorkday(new Date("2026-10-10T15:00:00Z"))).toBe(false); // sábado
  });
});
