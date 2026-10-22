import { describe, expect, it } from "vitest";
import { ITEMS } from "./cases";
import { LESSONS } from "./lessons";
import { CAST } from "./cast";
import { DAY, H, arrivalOf, decide, entries, kpis, levelOf, localMidnight, newState, pinArrived, profileOf, skipToNext, streakOf, xpOf, KPI_START } from "./engine";
import type { CeoState } from "./types";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0); // 5-oct-2026 09:00 en Monterrey (UTC−6)
const started = (over: Partial<CeoState> = {}): CeoState => ({ ...newState(), name: "Oziel", alias: "oziel", startedAt: T0, ...over });

describe("contenido", () => {
  it("cada mensaje tiene ids únicos, remitente válido, 2–4 opciones y lección existente", () => {
    const ids = new Set<string>();
    for (const it of ITEMS) {
      expect(ids.has(it.id)).toBe(false); ids.add(it.id);
      expect(CAST[it.from]).toBeTruthy();
      expect(it.options.length).toBeGreaterThanOrEqual(2);
      expect(it.options.length).toBeLessThanOrEqual(4);
      if (it.lesson) expect(LESSONS.some((l) => l.id === it.lesson)).toBe(true);
      if (it.trigger) {
        const src = ITEMS.find((x) => x.id === it.trigger!.item)!;
        expect(src).toBeTruthy();
        for (const o of it.trigger.options) expect(o === "__expired" || src.options.some((x) => x.id === o)).toBe(true);
      }
    }
  });
});

describe("llegadas", () => {
  it("el primer mensaje llega casi de inmediato y los del día 2 dentro de la ventana", () => {
    const s = started();
    const first = ITEMS.find((i) => i.day === 1 && i.slot === 1)!;
    expect(arrivalOf(s, first) - T0).toBeLessThan(60_000);
    const mid2 = localMidnight(T0, s.settings.tz) + DAY;
    for (const it of ITEMS.filter((i) => i.day === 2 && !i.trigger)) {
      const a = arrivalOf(s, it);
      expect(a).toBeGreaterThanOrEqual(mid2 + 8 * H);
      expect(a).toBeLessThan(mid2 + 19 * H);
    }
  });
  it("cambiar el horario no mueve lo que ya llegó", () => {
    let s = started();
    const it = ITEMS[0];
    s = pinArrived(s, T0 + 5 * 60_000);
    const before = arrivalOf(s, it);
    s = { ...s, settings: { ...s.settings, windowStart: 12 } };
    expect(arrivalOf(s, it)).toBe(before);
  });
});

describe("decisiones y consecuencias", () => {
  it("decidir mueve los indicadores y da XP", () => {
    let s = started();
    const now = T0 + 60_000;
    s = decide(s, "d1-bienvenida", "a", now);
    const k = kpis(s, now);
    expect(k.equipo).toBe(KPI_START.equipo + 6);
    expect(xpOf(s, now)).toBeGreaterThan(0);
  });
  it("no se puede decidir algo que no ha llegado", () => {
    const s = started();
    expect(decide(s, "d7-sucesion", "a", T0 + 1000)).toBe(s);
  });
  it("una consecuencia sólo aparece si se eligió la opción que la detona", () => {
    const now = T0 + 3 * H;
    let good = started(); good = decide(good, "d1-hector", "a", now);
    let bad = started(); bad = decide(bad, "d1-hector", "c", now);
    const later = T0 + 3 * DAY;
    expect(entries(good, later).some((e) => e.item.id === "c-hector-aliado")).toBe(true);
    expect(entries(good, later).some((e) => e.item.id === "c-hector-renuncia")).toBe(false);
    expect(entries(bad, later).some((e) => e.item.id === "c-hector-renuncia")).toBe(true);
  });
  it("si no respondes a tiempo, vence y detona la consecuencia de «no respondiste»", () => {
    const s = started();
    const later = T0 + 3 * DAY;
    const e = entries(s, later).find((x) => x.item.id === "d1-hector")!;
    expect(e.status).toBe("vencido");
    expect(entries(s, later).some((x) => x.item.id === "c-hector-renuncia")).toBe(true);
  });
});

describe("racha, nivel y perfil", () => {
  it("cuenta días seguidos y avisa si está en riesgo", () => {
    const s = started({ lessons: { a: T0, b: T0 + DAY, c: T0 + 2 * DAY } });
    expect(streakOf(s, T0 + 2 * DAY + H).days).toBe(3);
    const r = streakOf(s, T0 + 3 * DAY + H);
    expect(r.days).toBe(3);
    expect(r.atRisk).toBe(true);
    expect(streakOf(s, T0 + 5 * DAY).days).toBe(0);
  });
  it("niveles", () => {
    expect(levelOf(0).name).toBe("Gerente");
    expect(levelOf(400).name).toBe("Director General");
    expect(levelOf(5000).pct).toBe(100);
  });
  it("el perfil refleja el estilo de las decisiones", () => {
    let s = started();
    s = decide(s, "d1-bienvenida", "a", T0 + 60_000);
    const p = profileOf(s, T0 + 60_000);
    expect(p.axes.find((a) => a.key === "estilo")!.value).toBeGreaterThan(0);
  });
  it("modo prueba: adelantar el reloj trae el siguiente mensaje", () => {
    let s = started();
    s = decide(s, "d1-bienvenida", "a", T0 + 60_000);
    s = skipToNext(s, T0 + 60_000);
    expect(s.clockOffset).toBeGreaterThan(0);
  });
});
