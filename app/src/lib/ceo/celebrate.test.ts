import { describe, expect, it } from "vitest";
import { BRAND_COLORS, INTENSITY, burstOf, chimeNotes, rng, stepParticle } from "./celebrate";

describe("celebración", () => {
  it("el confeti usa solo colores de la marca y respeta la intensidad de cada logro", () => {
    for (const k of Object.keys(INTENSITY) as (keyof typeof INTENSITY)[]) {
      const ps = burstOf(k, 1200, 800, rng(7));
      expect(ps).toHaveLength(INTENSITY[k].count);
      expect(ps.every((p) => (BRAND_COLORS as readonly string[]).includes(p.color))).toBe(true);
    }
    expect(INTENSITY.appointment.count).toBeGreaterThan(INTENSITY.lesson.count);
  });

  it("es sobrio: pocas partículas y dura poco", () => {
    for (const v of Object.values(INTENSITY)) {
      expect(v.count).toBeLessThanOrEqual(100);
      expect(v.duration).toBeLessThanOrEqual(2500);
    }
  });

  it("sale hacia arriba y luego cae por la gravedad", () => {
    const ps = burstOf("company", 1000, 800, rng(1));
    expect(ps.every((p) => p.vy < 0.5)).toBe(true);
    let p = ps[0];
    for (let i = 0; i < 200; i++) p = stepParticle(p);
    expect(p.vy).toBeGreaterThan(0);
    expect(p.y).toBeGreaterThan(ps[0].y);
  });

  it("es determinista con la misma semilla", () => {
    expect(burstOf("lesson", 800, 600, rng(42))).toEqual(burstOf("lesson", 800, 600, rng(42)));
  });

  it("el tono son dos notas que suben, cortas y a volumen bajo", () => {
    const n = chimeNotes("company");
    expect(n).toHaveLength(2);
    expect(n[1].f).toBeGreaterThan(n[0].f);
    expect(n[1].at).toBeGreaterThan(n[0].at);
    expect(Math.max(...n.map((x) => x.at + x.dur))).toBeLessThan(1);
    expect(Math.max(...n.map((x) => x.gain))).toBeLessThanOrEqual(0.12);
    expect(chimeNotes("lesson")[0].gain).toBeLessThan(n[0].gain);
  });
});
