import { describe, expect, it } from "vitest";
import { DAY, H, decide, entries, newState } from "./engine";
import { jobsFor, type Sent } from "./schedule";
import { renderJob } from "./mailer";
import type { CeoState } from "./types";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0); // lunes 5-oct-2026 09:00 Monterrey
const started = (over: Partial<CeoState> = {}): CeoState => ({ ...newState(), name: "Oziel Leal", alias: "oziel", startedAt: T0, lastActiveAt: T0, ...over });
const APP = "https://metisalign.app";

/** Simula el cron cada 15 min durante `days` días; devuelve todo lo enviado. */
function simulate(s: CeoState, days: number, act?: (s: CeoState, t: number) => CeoState) {
  const sent: Sent = {};
  const log: { t: number; key: string; kind: string }[] = [];
  for (let t = T0; t < T0 + days * DAY; t += 15 * 60_000) {
    if (act) s = act(s, t);
    for (const j of jobsFor(s, sent, t)) { sent[j.key] = t; log.push({ t, key: j.key, kind: j.kind }); }
  }
  return { log, sent, s };
}

describe("reglas de correo", { timeout: 30000 }, () => {
  it("bienvenida y primer asunto salen al empezar, una sola vez", () => {
    const s = started();
    const jobs = jobsFor(s, {}, T0 + 60_000);
    expect(jobs.some((j) => j.kind === "welcome")).toBe(true);
    expect(jobs.some((j) => j.kind === "case")).toBe(true);
    const sent = Object.fromEntries(jobs.map((j) => [j.key, T0]));
    expect(jobsFor(s, sent, T0 + 120_000).filter((j) => j.kind === "welcome" || j.key === jobs.find((x) => x.kind === "case")!.key)).toHaveLength(0);
  });

  it("nada se repite durante la temporada y cada asunto avisa una vez", () => {
    const { log } = simulate(started(), 8);
    const keys = log.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(log.filter((l) => l.kind === "case").length).toBeGreaterThan(5);
    expect(log.some((l) => l.kind === "digest")).toBe(true);
  });

  it("el resumen de la mañana sale antes de las 10 am locales y no el primer día", () => {
    const { log } = simulate(started(), 4);
    const digests = log.filter((l) => l.kind === "digest");
    expect(digests.length).toBeGreaterThanOrEqual(3);
    for (const d of digests) {
      const hourLocal = new Date(d.t - 6 * H).getUTCHours();
      expect(hourLocal).toBeGreaterThanOrEqual(7);
      expect(hourLocal).toBeLessThan(12);
      expect(d.t).toBeGreaterThan(T0 + 12 * H);
    }
  });

  it("los recordatorios caen antes de que venza el asunto y dentro del horario", () => {
    const { log, s } = simulate(started(), 4);
    for (const r of log.filter((l) => l.kind === "reminder")) {
      const e = entries(s, r.t).find((x) => `rem:${x.item.id}` === r.key)!;
      expect(r.t).toBeLessThan(e.deadline);
      const hourLocal = (new Date(r.t - 6 * H).getUTCHours());
      expect(hourLocal).toBeGreaterThanOrEqual(8);
      expect(hourLocal).toBeLessThanOrEqual(20);
    }
  });

  it("si decides todo a tiempo no hay recordatorios ni avisos de inactividad", () => {
    const act = (s: CeoState, t: number) => {
      for (const e of entries(s, t)) if (e.status === "pendiente") s = decide(s, e.item.id, e.item.options[0].id, t);
      return { ...s, lastActiveAt: t };
    };
    const { log } = simulate(started(), 3, act);
    expect(log.some((l) => l.kind === "reminder" || l.kind === "nudge")).toBe(false);
  });

  it("2+ días sin entrar → máximo 3 «preguntan por ti», separados", () => {
    const { log } = simulate(started(), 14);
    const n = log.filter((l) => l.kind === "nudge");
    expect(n.length).toBeGreaterThanOrEqual(1);
    expect(n.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < n.length; i++) expect(n[i].t - n[i - 1].t).toBeGreaterThanOrEqual(3 * DAY);
  });

  it("la corrida diaria programa los asuntos de las próximas 24 h a su hora", () => {
    const s = started();
    const t = T0 + DAY - 3 * H; // martes 6 am
    const jobs = jobsFor(s, {}, t, { plan: true });
    const planned = jobs.filter((j) => j.kind === "case" && j.at);
    expect(planned.length).toBeGreaterThan(0);
    for (const j of planned) if (j.kind === "case") { expect(j.at!).toBeGreaterThan(t); expect(j.at!).toBeLessThanOrEqual(t + DAY); }
    expect(jobs.some((j) => j.kind === "digest")).toBe(true);
  });

  it("todas las plantillas se generan con asunto, remitente y enlace a la app", () => {
    const { log, s } = simulate(started(), 8);
    const kinds = new Set<string>();
    const sent: Sent = {};
    for (let t = T0; t < T0 + 8 * DAY; t += 15 * 60_000) {
      for (const j of jobsFor(s, sent, t)) {
        sent[j.key] = t;
        if (kinds.has(j.kind)) continue;
        kinds.add(j.kind);
        const m = renderJob(j, s, "Oziel Leal", APP, t);
        expect(m.subject.length).toBeGreaterThan(5);
        expect(m.fromName.length).toBeGreaterThan(3);
        expect(m.html).toContain(APP);
        expect(m.text).toContain(APP);
        expect(m.html).not.toContain("undefined");
        expect(m.html).not.toContain("NaN");
      }
    }
    expect(log.length).toBeGreaterThan(0);
    expect([...kinds]).toEqual(expect.arrayContaining(["welcome", "case", "digest", "reminder", "nudge"]));
  });
});
