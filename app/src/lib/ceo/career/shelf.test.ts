/**
 * Empresas guardadas (lanzamiento piloto del Growth Engine).
 * Abrir una empresa emergente NUNCA borra la empresa actual: se guarda completa, con el reloj detenido,
 * y se puede volver a ella. XP, lecciones, dilemas, carrera y racha siguen siendo de la persona.
 */
import { describe, expect, it } from "vitest";
import { DAY, H, canOpenEmergente, decide, entries, migrate, newState, parkAndOpen, resolution, resumeShelved, setupCompany, shelfIdOf, streakOf, xpOf } from "../engine";
import { CONTINUOUS_RULES_VERSION } from "../rules";
import { applyAction, replay, type GameAction } from "../replay";
import { careerStartOf, checkBase, sanitizeAction } from "../journal";
import { canPause, pauseCareer } from "../cadence";
import { GROWTH_ARCHETYPE } from "../growth/combos";
import type { CeoState } from "../types";

const T0 = new Date("2026-03-02T15:00:00Z").getTime();
const OLD = "11111111-2222-4333-8444-555555555555";
const NEW = "3f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const EMERGENTE = { companyId: NEW, sectorId: "restaurantes_alimentos", industryId: "restaurantes", archetype: GROWTH_ARCHETYPE, displayName: "Fogón Regio", growth: true };
const started = (): CeoState => ({ ...newState(), name: "Ana", alias: "Ana", startedAt: T0, lastActiveAt: T0, savedAt: T0, lessons: { l1: T0 + H } });

/** Empresa propia consolidada con dos decisiones tomadas y un asunto que aún espera. */
function current(): { s: CeoState; t: number } {
  let s = setupCompany(started(), { companyId: OLD, sectorId: "restaurantes_alimentos", industryId: "restaurantes", archetype: "establecida", displayName: "Casa Norte" }, T0, CONTINUOUS_RULES_VERSION);
  expect(s.companyProfile?.companyId).toBe(OLD);
  let t = T0 + 2 * DAY;
  for (let i = 0; i < 2; i++) {
    const e = entries(s, t).find((x) => x.status === "pendiente");
    if (!e) break;
    s = decide(s, e.item.id, e.item.options[0].id, t);
    t += H;
  }
  expect(Object.keys(s.decisions).length).toBeGreaterThan(0);
  return { s, t };
}

describe("abrir una empresa emergente sin perder la actual", () => {
  it("guarda la empresa actual completa y abre la emergente", () => {
    const { s, t } = current();
    const xp = xpOf(s, t);
    const n = parkAndOpen(s, EMERGENTE, t, CONTINUOUS_RULES_VERSION);
    expect(n).not.toBe(s);
    expect(n.growth?.templateId).toBe("restaurante_emergente");
    expect(n.companyProfile?.companyId).toBe(NEW);
    expect(Object.keys(n.decisions)).toHaveLength(0);
    expect(n.shelf).toHaveLength(1);
    const saved = n.shelf![0];
    expect(saved.id).toBe(OLD);
    expect(saved.name).toBe("Casa Norte");
    expect(saved.state.decisions).toEqual(s.decisions);
    expect(saved.state.companyProfile).toEqual(s.companyProfile);
    expect(saved.state.startedAt).toBe(s.startedAt);
    // Lo de la persona se queda.
    expect(n.lessons).toEqual(s.lessons);
    expect(n.name).toBe("Ana");
    // Tu XP no baja al abrir la nueva empresa.
    expect(xpOf(n, t)).toBeGreaterThanOrEqual(xp);
    // La identidad del diario no cambia (misma carrera en el servidor).
    expect(careerStartOf(n)).toBe(careerStartOf(s));
  });

  it("no procede si ya estás en una emergente, de vacaciones, o sin la opción emergente", () => {
    const { s, t } = current();
    const n = parkAndOpen(s, EMERGENTE, t, CONTINUOUS_RULES_VERSION);
    expect(canOpenEmergente(n, t)).toBe(false);
    expect(parkAndOpen(n, { ...EMERGENTE, companyId: "4f1c2a4b-5d6e-4f70-8a9b-0c1d2e3f4a5b" }, t + H)).toBe(n);
    expect(parkAndOpen(s, { ...EMERGENTE, growth: false }, t)).toBe(s);
    const away = pauseCareer(s, t, null);
    expect(parkAndOpen(away, EMERGENTE, t + H)).toBe(away);
    expect(parkAndOpen(newState(), EMERGENTE, t)).toEqual(newState());
  });

  it("volver a la empresa guardada: todo como estaba y nada venció mientras estuvo guardada", () => {
    const { s, t } = current();
    const waiting = entries(s, t).filter((e) => e.status === "pendiente").map((e) => e.item.id);
    const n = parkAndOpen(s, EMERGENTE, t, CONTINUOUS_RULES_VERSION);
    const later = t + 20 * DAY;
    const back = resumeShelved(n, OLD, later);
    expect(back.companyProfile?.companyId).toBe(OLD);
    expect(back.growth).toBeUndefined();
    expect(back.decisions).toEqual(s.decisions);
    // La emergente queda guardada, con sus datos.
    expect(back.shelf?.map((e) => e.id)).toEqual([NEW]);
    expect(back.shelf?.[0].state.growth?.templateId).toBe("restaurante_emergente");
    // Lo que esperaba sigue esperando (no venció en los 20 días).
    for (const id of waiting) expect(resolution(back, id, later + H)).toBeNull();
    // El lapso guardado no cuenta en el límite de vacaciones.
    expect(canPause(back, later + H).ok).toBe(true);
    // Y se puede volver a la emergente.
    const again = resumeShelved(back, NEW, later + 2 * H);
    expect(again.growth?.templateId).toBe("restaurante_emergente");
    expect(again.shelf?.map((e) => e.id)).toEqual([OLD]);
  });

  it("la racha y el XP cuentan lo jugado en la empresa guardada", () => {
    const { s, t } = current();
    const n = parkAndOpen(s, EMERGENTE, t, CONTINUOUS_RULES_VERSION);
    expect(streakOf(n, t).best).toBeGreaterThanOrEqual(streakOf(s, t).best);
    expect(n.shelf![0].xp).toBeGreaterThan(0);
  });

  it("empresa de temporadas (sin empresa propia) también se guarda", () => {
    let s = started();
    const e = entries(s, T0 + DAY).find((x) => x.status === "pendiente")!;
    s = decide(s, e.item.id, e.item.options[0].id, T0 + DAY);
    const n = parkAndOpen(s, EMERGENTE, T0 + DAY + H, CONTINUOUS_RULES_VERSION);
    expect(n.growth).toBeDefined();
    expect(n.shelf?.[0].id).toBe(shelfIdOf(s));
    expect(n.shelf?.[0].state.company).toBe(s.company);
    expect(n.shelf?.[0].state.decisions).toEqual(s.decisions);
  });
});

describe("persistencia, diario y reproducción", () => {
  it("migrate conserva las empresas guardadas y descarta las dañadas", () => {
    const { s, t } = current();
    const n = parkAndOpen(s, EMERGENTE, t, CONTINUOUS_RULES_VERSION);
    const m = migrate(JSON.parse(JSON.stringify(n)));
    expect(m.shelf).toEqual(n.shelf);
    expect(m.careerStart).toBe(n.careerStart);
    const bad = migrate({ ...JSON.parse(JSON.stringify(n)), shelf: [{ id: 3 }, null, { ...n.shelf![0], state: null }], careerStart: "x" });
    expect(bad.shelf).toBeUndefined();
    expect(bad.careerStart).toBeUndefined();
    // Una partida sin empresas guardadas no cambia.
    expect(migrate(JSON.parse(JSON.stringify(s))).shelf).toBeUndefined();
  });

  it("las acciones viajan por el diario y la reproducción da el mismo estado", () => {
    const { s, t } = current();
    const open: GameAction = { type: "parkOpen", at: t, companyId: NEW, sectorId: EMERGENTE.sectorId, industryId: EMERGENTE.industryId, archetype: EMERGENTE.archetype, displayName: EMERGENTE.displayName, rulesVersion: CONTINUOUS_RULES_VERSION };
    const back: GameAction = { type: "resumeShelved", at: t + 5 * DAY, id: OLD };
    expect(sanitizeAction(open)).toEqual(open);
    expect(sanitizeAction(back)).toEqual(back);
    expect(sanitizeAction({ ...open, companyId: "no" })).toBeNull();
    expect(sanitizeAction({ type: "resumeShelved", at: t })).toBeNull();
    const direct = resumeShelved(parkAndOpen(s, EMERGENTE, t, CONTINUOUS_RULES_VERSION), OLD, t + 5 * DAY);
    const r = replay([open, back], s);
    expect(r.rejected).toEqual([]);
    expect({ ...r.state, savedAt: 0 }).toEqual({ ...direct, savedAt: 0 });
    // Volver a una empresa que no existe no procede.
    expect(applyAction(s, { type: "resumeShelved", at: t, id: "nada" }).applied).toBe(false);
  });

  it("el servidor acepta la partida con empresas guardadas como punto de partida", () => {
    const { s, t } = current();
    const n = parkAndOpen(s, EMERGENTE, t, CONTINUOUS_RULES_VERSION);
    const b = checkBase(JSON.parse(JSON.stringify(n)), careerStartOf(s)!, t);
    expect(b.ok).toBe(true);
    if (b.ok) expect(b.xp).toBe(xpOf(n, Math.max(t, n.lastActiveAt, n.savedAt)));
  });
});
