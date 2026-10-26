import { describe, expect, it } from "vitest";
import { LESSONS } from "./lessons";
import { COMPANIES } from "./companies";
import { CUMBRE } from "./companies/cumbre";
import { DAY, H, KPI_KEYS, advance, arrivalOf, decide, dominates, entries, kpis, levelOf, localMidnight, migrate, newState, nextCompanyOf, pinArrived, profileOf, rulesOf, scaled, seasonDoneOf, skipToNext, streakOf, verdictOf, xpOf, KPI_START } from "./engine";
import type { CeoState } from "./types";

const T0 = Date.UTC(2026, 9, 5, 15, 0, 0); // 5-oct-2026 09:00 en Monterrey (UTC−6)
const started = (over: Partial<CeoState> = {}): CeoState => ({ ...newState(), name: "Oziel", alias: "oziel", startedAt: T0, ...over });

const ITEMS = CUMBRE.items;

describe.each(COMPANIES.map((c) => [c.name, c] as const))("contenido · %s", (_n, pack) => {
  it("ids únicos, remitente e involucrados en el elenco, 2–4 opciones, lección existente y detonadores válidos", () => {
    const ids = new Set<string>();
    const ITEMS = pack.items;
    for (const it of ITEMS) {
      expect(ids.has(it.id), it.id).toBe(false); ids.add(it.id);
      expect(pack.cast[it.from], `${it.id} from ${it.from}`).toBeTruthy();
      for (const w of it.involves ?? []) expect(pack.cast[w], `${it.id} involves ${w}`).toBeTruthy();
      for (const l of it.lines ?? []) expect(pack.cast[l.who], `${it.id} line ${l.who}`).toBeTruthy();
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
  it("elenco, relaciones y roles coherentes", () => {
    for (const [id, p] of Object.entries(pack.cast)) {
      expect(p.id).toBe(id);
      if (p.reportsTo && p.reportsTo !== "ceo") expect(pack.cast[p.reportsTo], `${id} reporta a ${p.reportsTo}`).toBeTruthy();
    }
    for (const t of pack.ties) { expect(pack.cast[t.a], t.a).toBeTruthy(); expect(pack.cast[t.b], t.b).toBeTruthy(); }
    for (const r of Object.values(pack.roles)) expect(pack.cast[r], r).toBeTruthy();
    expect(pack.glossary.length).toBeGreaterThanOrEqual(5);
  });
  it("ninguna opción es obviamente mejor: ninguna domina a otra en todos los rubros", () => {
    const bad: string[] = [];
    for (const it of pack.items) for (const a of it.options) for (const b of it.options) if (a !== b && dominates(a.effects, b.effects)) bad.push(`${it.id}: ${a.id} domina a ${b.id}`);
    expect(bad).toEqual([]);
  });
  it("cada opción tiene costo y beneficio (nada es gratis)", () => {
    const bad: string[] = [];
    for (const it of pack.items) for (const o of it.options) {
      const v = Object.values(o.effects);
      if (!(v.some((x) => (x ?? 0) > 0) && v.some((x) => (x ?? 0) < 0))) bad.push(`${it.id}/${o.id}`);
    }
    expect(bad).toEqual([]);
  });
  it("una temporada se siente como días reales de CEO: 2–3 decisiones base por día", () => {
    for (let d = 1; d <= pack.season.days; d++) {
      const n = pack.items.filter((i) => i.day === d && !i.trigger).length;
      expect(n, `día ${d}`).toBeGreaterThanOrEqual(1);
      expect(n, `día ${d}`).toBeLessThanOrEqual(4);
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
    expect(k.equipo).toBe(CUMBRE.kpiStart.equipo + 5);
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

describe("carrera multiempresa", () => {
  it("migra un avance v1 sin perder nada (queda en Botanas Cumbre, nivel 0)", () => {
    const v1 = { v: 1, name: "Oziel", alias: "oziel", startedAt: T0, decisions: { "d1-bienvenida": { option: "a", at: T0 + 1000 } }, pinned: {}, read: {}, lessons: { x: T0 }, settings: { tz: "America/Monterrey" }, lastActiveAt: T0, clockOffset: 0, savedAt: T0 };
    const s = migrate(v1);
    expect(s.v).toBe(2);
    expect(s.company).toBe("cumbre");
    expect(s.tier).toBe(0);
    expect(s.career).toEqual([]);
    expect(s.decisions["d1-bienvenida"].option).toBe("a");
    expect(s.settings.windowStart).toBe(8);
  });
  it("la exigencia sube con cada nivel", () => {
    expect(rulesOf(0).passLine).toBeLessThan(rulesOf(2).passLine);
    expect(rulesOf(3).deadline).toBeLessThan(rulesOf(0).deadline);
    expect(scaled({ caja: -10, equipo: 10 }, 0)).toEqual({ caja: -10, equipo: 10 });
    const s3 = scaled({ caja: -10, equipo: 10 }, 3);
    expect(s3.caja!).toBeLessThan(-10);
    expect(s3.equipo!).toBeLessThan(10);
  });
  type Picker = (os: { id: string; effects: Record<string, number | undefined> }[], s: CeoState, t: number, itemId: string) => string;
  const finish = (s0: CeoState, pick: Picker) => {
    let s = s0;
    let t = T0;
    for (let i = 0; i < 400 && !seasonDoneOf(s, t); i++) {
      const p = entries(s, t).find((e) => e.status === "pendiente");
      if (p) { s = decide(s, p.item.id, pick(p.item.options as never, s, t, p.item.id), t); t += 60_000; continue; }
      const nx = entries(s, t).find((e) => e.status === "futuro");
      t = nx ? nx.arrivesAt + 1000 : t + H;
    }
    return { s, t };
  };
  // jugador cuidadoso: elige la opción que deja mejor su rubro más débil
  const careful = (s: CeoState, t: number, itemId: string, ids: string[]) => {
    const line = rulesOf(s.tier).passLine;
    let pick = ids[0], bv = -1e9;
    for (const o of ids) { const k = kpis(decide(s, itemId, o, t), t); const v = Math.min(...KPI_KEYS.map((x) => k[x] - line)) * 10 + KPI_KEYS.reduce((a, x) => a + k[x], 0) / 50; if (v > bv) { bv = v; pick = o; } }
    return pick;
  };
  const best: Picker = (os, s, t, itemId) => careful(s, t, itemId, os.map((o) => o.id));
  const worst: Picker = (os) => os.slice().sort((a, b) => sum(a.effects) - sum(b.effects))[0].id;
  const sum = (e: Record<string, number | undefined>) => Object.values(e).reduce<number>((a, x) => a + (x ?? 0), 0);

  it.each(COMPANIES.map((c) => [c.id] as const))("%s: se puede aprobar con buenas decisiones y reprobar con malas", (id) => {
    const good = finish(started({ company: id }), best);
    expect(rulesOf(0).passLine).toBe(50);
    expect(seasonDoneOf(good.s, good.t)).toBe(true);
    const vg = verdictOf(good.s, good.t);
    expect(vg.passed, JSON.stringify(vg.kpis)).toBe(true);
    const bad = finish(started({ company: id }), worst);
    expect(verdictOf(bad.s, bad.t).passed).toBe(false);
  });
  it("al aprobar asciende a otra empresa (de otro giro) y sube la exigencia; al reprobar repite", () => {
    const good = finish(started({ company: "cumbre" }), best);
    const up = advance(good.s, good.t);
    expect(up.company).not.toBe("cumbre");
    expect(up.tier).toBe(1);
    expect(up.career).toHaveLength(1);
    expect(up.career[0].passed).toBe(true);
    expect(Object.keys(up.decisions)).toHaveLength(0);
    expect(xpOf(up, good.t)).toBeGreaterThanOrEqual(xpOf(good.s, good.t) - 1);
    const bad = finish(started({ company: "cumbre" }), worst);
    const again = advance(bad.s, bad.t);
    expect(again.company).toBe("cumbre");
    expect(again.tier).toBe(0);
    expect(again.career[0].passed).toBe(false);
  });
  it("no se puede ascender a media temporada", () => {
    const s = started();
    expect(advance(s, T0 + H)).toBe(s);
  });
  it("después de aprobar todo, sigue el modo Legendario", () => {
    const s = started({ company: "brasa", career: COMPANIES.filter((c) => c.id === "cumbre").map((c) => ({ company: c.id, tier: 0, startedAt: T0, endedAt: T0, kpis: { ...KPI_START }, health: 70, answered: 100, passed: true, xp: 0, decisions: {} })) });
    expect(nextCompanyOf(s).legendary).toBe(false);
    const all = { ...s, career: COMPANIES.filter((c) => c.id !== "brasa").map((c) => ({ ...s.career[0], company: c.id })) };
    expect(nextCompanyOf(all).legendary).toBe(true);
    expect(KPI_KEYS.length).toBe(5);
  });
});
