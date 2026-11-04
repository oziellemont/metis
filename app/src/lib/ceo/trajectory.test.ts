/**
 * Trayectoria (rediseño de progresión): una sola fuente para Hoy, Carrera y Perfil.
 * Verifica que el capítulo es el mismo que usa el motor, que no lee XP ni racha ni el antiguo Executive Journey,
 * que un mes no aprobado no degrada ni reinicia, y que es determinista.
 */
import { describe, expect, it } from "vitest";
import { playCareer } from "./season-sim";
import { companyStageOf, packOf } from "./engine";
import { COMPANY_STAGES } from "./career/identity";
import { headlineOf, momentOf, trajectoryOf } from "./trajectory";

const CAREERS = [
  ["cumbre", "criterio_y_tablero"], ["forja", "azar"], ["kubit", "peor_score"], ["brasa", "contesta_la_mitad"],
].map(([c, st]) => ({ c, st, r: playCareer(c, st, 5, `${c}|${st}|tray`) }));

describe("trayectoria del mandato", () => {
  it("el capítulo es exactamente el del motor y el nombramiento es Director General de la empresa", () => {
    for (const { r } of CAREERS) {
      const at = r.months.at(-1)!.at;
      const t = trajectoryOf(r.state, at);
      expect(t.active).toBe(true);
      const st = companyStageOf(r.state);
      expect(t.chapter.idx).toBe(st.idx);
      expect(t.chapter.months).toBe(st.months);
      expect(t.chapter.label).toBe(COMPANY_STAGES[st.idx].label);
      expect(t.appointment.title).toBe(`Director General de ${packOf(r.state).name}`);
      expect(t.reviews.length).toBe(t.month - 1);
      expect(t.evolution.length).toBe(t.reviews.length);
    }
  }, 120_000);

  it("es determinista y no depende de XP, racha, lecciones ni del antiguo Executive Journey", () => {
    for (const { r } of CAREERS) {
      const at = r.months.at(-1)!.at;
      const a = trajectoryOf(r.state, at);
      const noisy = {
        ...r.state, xp: 99_999, streak: { ...(r.state as any).streak, count: 365, best: 365 },
        lessons: {}, journey: { stage: 5, enrolledAt: 1, appointments: [] },
      } as unknown as typeof r.state;
      expect(trajectoryOf(r.state, at)).toEqual(a);
      expect(trajectoryOf(noisy, at)).toEqual(a);
    }
  }, 120_000);

  it("un mes no aprobado nunca baja de capítulo; un mes aprobado después es un hito de recuperación", () => {
    let fails = 0;
    for (const { r } of CAREERS) {
      const t = trajectoryOf(r.state, r.months.at(-1)!.at);
      let prev = -1;
      t.reviews.forEach((rv, i) => {
        const idx = COMPANY_STAGES.findIndex((x) => x.label === rv.chapter);
        expect(idx).toBeGreaterThanOrEqual(prev);
        prev = idx;
        if (!rv.passed) {
          fails++;
          expect(rv.opened === undefined || i === 0).toBe(true);
          expect(t.milestones.some((m) => m.kind === "revision" && m.title.startsWith(`Mes ${rv.period}:`))).toBe(true);
          const nx = t.reviews[i + 1];
          if (nx?.passed) expect(t.milestones.some((m) => m.kind === "recuperacion" && m.title.startsWith(`Mes ${nx.period}:`))).toBe(true);
        }
      });
      for (let i = 1; i < t.milestones.length; i++) expect(t.milestones[i].at).toBeGreaterThanOrEqual(t.milestones[i - 1].at);
      expect(t.milestones[0].kind).toBe("nombramiento");
    }
    expect(fails).toBeGreaterThan(0);
  }, 120_000);

  it("el momento de la empresa es texto, sin porcentaje global ni rango", () => {
    for (const h of [90, 70, 60, 50, 20]) {
      const m = momentOf(h);
      expect(m.text).not.toMatch(/%|\d/);
      expect(m.text).not.toMatch(/ascen|nombramiento|nivel/i);
    }
    expect(momentOf(70).tone).toBe("solida");
    expect(momentOf(44).tone).toBe("riesgo");
  });

  it("decisiones que marcaron y compromisos abiertos salen de la partida real", () => {
    for (const { r } of CAREERS) {
      const t = trajectoryOf(r.state, r.months.at(-1)!.at);
      expect(t.marked.length).toBeLessThanOrEqual(5);
      for (let i = 1; i < t.marked.length; i++) expect(t.marked[i].weight).toBeLessThanOrEqual(t.marked[i - 1].weight);
      const h = headlineOf(t);
      expect(h).not.toBeNull();
    }
  }, 120_000);

  it("los textos de capítulo no prometen ascensos ni hablan de rangos personales", () => {
    for (const { r } of CAREERS) {
      const t = trajectoryOf(r.state, r.months.at(-1)!.at);
      const all = [t.chapter.focus, t.chapter.next?.text ?? "", ...t.milestones.map((m) => m.title + m.text)].join(" ");
      expect(all).not.toMatch(/ascen|Emerging|Global CEO|Executive Journey|nombramiento siguiente|próximamente/i);
    }
  }, 120_000);
});
