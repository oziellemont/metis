import { describe, expect, it } from "vitest";
import {
  CHAINS, CRISIS_DAY, CRISIS_XP, STEPS, TIMEOUT, chainsAt, crisisAccess, crisisOfRun, fillNames, playCrisis, recordCrisis, shockOf, startBoard, type CrisisPicks,
} from "./crisis";
import { DAY, KPI_KEYS, KPI_START, kpis, migrate, newState, xpOf } from "./engine";
import type { CeoState, Kpis } from "./types";

const T0 = Date.UTC(2026, 0, 5, 15);
const playing = (extra: Partial<CeoState> = {}): CeoState => ({ ...newState(), name: "Prueba", startedAt: T0, lastActiveAt: T0, ...extra });

/** Las 64 combinaciones posibles (3 opciones + tiempo agotado por paso). */
const IDS = STEPS.map((s) => [...s.options.map((o) => o.id), TIMEOUT]);
const ALL: CrisisPicks[] = IDS[0].flatMap((a) => IDS[1].flatMap((b) => IDS[2].map((c) => ({ [STEPS[0].id]: a, [STEPS[1].id]: b, [STEPS[2].id]: c }))));
const BEST: CrisisPicks = { llamada: "convocar", caja: "puente", voz: "verdad" };
const WEAK: Kpis = { caja: 45, margen: 48, equipo: 50, clientes: 55, consejo: 52 };

describe("Boardroom Crisis", () => {
  it("son 3 decisiones encadenadas, con 3 opciones y un desenlace si se acaba el tiempo", () => {
    expect(STEPS).toHaveLength(3);
    for (const s of STEPS) {
      expect(s.options).toHaveLength(3);
      expect(s.timeout.id).toBe(TIMEOUT);
      expect(s.nota.length).toBeGreaterThan(20);
    }
    for (const c of CHAINS) {
      const from = STEPS.findIndex((s) => s.id === c.when[0]), to = STEPS.findIndex((s) => s.id === c.at);
      expect(from).toBeGreaterThanOrEqual(0);
      expect(to).toBeGreaterThan(from); // solo hacia adelante
    }
  });

  it("es determinista", () => {
    for (const p of ALL) expect(playCrisis(KPI_START, 0, p)).toEqual(playCrisis({ ...KPI_START }, 0, { ...p }));
  });

  it("arranca desde tus indicadores de hoy, con el golpe más fuerte a mayor exigencia", () => {
    const s0 = startBoard(KPI_START, 0), s2 = startBoard(KPI_START, 2);
    expect(s0.caja).toBe(KPI_START.caja + shockOf(0).caja!);
    expect(s2.caja).toBeLessThan(s0.caja);
    expect(s2.consejo).toBeLessThan(s0.consejo);
    expect(s0.margen).toBe(KPI_START.margen);
  });

  it("se puede contener, pero la mayoría de los caminos no la contiene", () => {
    const ok = ALL.filter((p) => playCrisis(KPI_START, 0, p).rating === "contenida");
    expect(ok.length).toBeGreaterThanOrEqual(1);
    expect(ok.length).toBeLessThanOrEqual(6);
    expect(playCrisis(KPI_START, 0, BEST).rating).toBe("contenida");
  });

  it("llegar con la empresa débil la hace más difícil", () => {
    const strong = ALL.filter((p) => playCrisis(KPI_START, 0, p).rating === "contenida").length;
    const weak = ALL.filter((p) => playCrisis(WEAK, 0, p).rating === "contenida").length;
    expect(weak).toBeLessThan(strong);
    expect(playCrisis(WEAK, 0, BEST).rating).not.toBe("rebaso");
  });

  it("dejar que se acabe el tiempo nunca es mejor que decidir bien", () => {
    const all = playCrisis(KPI_START, 0, { llamada: TIMEOUT, caja: TIMEOUT, voz: TIMEOUT });
    expect(all.timeouts).toBe(3);
    expect(all.rating).not.toBe("contenida");
    for (const st of STEPS) {
      const timed = playCrisis(KPI_START, 0, { ...BEST, [st.id]: TIMEOUT });
      const best = playCrisis(KPI_START, 0, BEST);
      expect(KPI_KEYS.reduce((a, k) => a + timed.kpis[k], 0)).toBeLessThan(KPI_KEYS.reduce((a, k) => a + best.kpis[k], 0));
    }
  });

  it("recortar plantilla salva la caja pero hunde al equipo", () => {
    const r = playCrisis(KPI_START, 0, { ...BEST, caja: "recorte" });
    const b = playCrisis(KPI_START, 0, BEST);
    expect(r.kpis.caja).toBeGreaterThanOrEqual(b.kpis.caja);
    expect(r.kpis.equipo).toBeLessThan(b.kpis.equipo - 15);
    expect(r.rating).not.toBe("contenida");
  });

  it("lo que haces antes cambia lo que pasa después", () => {
    expect(chainsAt("caja", { llamada: "minimizar" })).toHaveLength(1);
    expect(chainsAt("caja", { llamada: "convocar" })[0].effects.caja).toBeGreaterThan(0);
    expect(chainsAt("voz", { caja: "recorte" })[0].effects.equipo).toBeLessThan(0);
    expect(chainsAt("llamada", BEST)).toHaveLength(0);
  });

  it("un recorrido incompleto no es definitivo y los indicadores quedan entre 0 y 100", () => {
    expect(playCrisis(KPI_START, 0, { llamada: "convocar" }).complete).toBe(false);
    const low: Kpis = { caja: 5, margen: 5, equipo: 5, clientes: 5, consejo: 5 };
    for (const p of ALL.slice(0, 20)) for (const k of KPI_KEYS) {
      const v = playCrisis(low, 4, p).kpis[k];
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("usa los nombres de la empresa actual", () => {
    const t = fillNames(STEPS[0].prompt, { chair: "Don Ramiro Garza", board: "Carla Méndez" });
    expect(t).toContain("Don Ramiro Garza");
    expect(t).not.toMatch(/\{chair\}|\{board\}/);
  });
});

describe("cuándo se abre y cómo se guarda", () => {
  it("se abre desde el día de la convocatoria y una sola vez por empresa", () => {
    expect(crisisAccess(newState(), T0)).toEqual({ open: false, reason: "early" });
    const s = playing();
    expect(crisisAccess(s, T0)).toEqual({ open: false, reason: "early" });
    const day = T0 + (CRISIS_DAY - 1) * DAY + 60_000;
    expect(crisisAccess(s, day)).toEqual({ open: true });
    const done = recordCrisis(s, { rating: "danos", picks: BEST }, day);
    expect(crisisAccess(done, day)).toEqual({ open: false, reason: "done" });
    expect(recordCrisis(done, { rating: "contenida", picks: BEST }, day)).toBe(done); // no se repite
    // otra empresa (otra temporada) vuelve a tener su crisis
    const next = { ...done, company: "forja", startedAt: day + DAY };
    expect(crisisOfRun(next)).toBeUndefined();
  });

  it("suma XP y no toca los indicadores de la temporada", () => {
    const day = T0 + (CRISIS_DAY - 1) * DAY + 60_000;
    const s = playing();
    const after = recordCrisis(s, { rating: "contenida", picks: BEST }, day);
    expect(xpOf(after, day) - xpOf(s, day)).toBe(CRISIS_XP.contenida);
    expect(kpis(after, day)).toEqual(kpis(s, day));
    expect(after.crises![0]).toMatchObject({ company: s.company, startedAt: T0, rating: "contenida", picks: BEST });
  });

  it("la migración conserva crisis válidas y descarta las dañadas", () => {
    const ok = { ...playing(), crises: [{ company: "cumbre", startedAt: T0, tier: 0, at: T0, rating: "danos", picks: {} }] };
    expect(migrate(JSON.parse(JSON.stringify(ok))).crises).toHaveLength(1);
    expect(migrate({ ...ok, crises: [{ company: "cumbre", rating: "otra" }] }).crises).toBeUndefined();
    expect(migrate({ ...ok, crises: "x" }).crises).toBeUndefined();
    expect(migrate(playing()).crises).toBeUndefined();
  });
});
