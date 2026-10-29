import { describe, expect, it } from "vitest";
import { DAILY_GOALS, ONBOARDING_VERSION, isValidTimeZone, onboardingToRow, sanitizeOnboarding, weeklyProjection, weeklyProjectionText } from "./onboarding";

const base = { homeIndustryId: "consumo", homeCompanyVariantId: "cumbre", dailyDecisionGoal: 2, preferredSessionMinutes: 5, preferredNotificationWindow: { start: 9, end: 19 }, timeZone: "America/Mexico_City", professionalLevel: "gerente", functionalArea: "finanzas", experienceBand: "6-10", learningGoal: "ascenso" };

describe("meta diaria y proyección", () => {
  it("Tranquilo 1, Constante 2 (recomendado), Intensivo 3", () => {
    expect(DAILY_GOALS.map((g) => [g.label, g.value])).toEqual([["Tranquilo", 1], ["Constante", 2], ["Intensivo", 3]]);
    expect(DAILY_GOALS.filter((g) => "recommended" in g && g.recommended).map((g) => g.value)).toEqual([2]);
  });
  it("7, 14 o 21 decisiones la primera semana", () => {
    expect([1, 2, 3].map((g) => weeklyProjection(g as 1 | 2 | 3))).toEqual([7, 14, 21]);
    expect(weeklyProjectionText(2)).toBe("¡Eso son 14 decisiones como meta para tu primera semana!");
  });
});

describe("sanitizeOnboarding", () => {
  it("acepta un perfil completo y lo versiona", () => {
    const r = sanitizeOnboarding(base, 1000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.profile).toMatchObject({ onboardingVersion: ONBOARDING_VERSION, homeCompanyVariantId: "cumbre", dailyDecisionGoal: 2, preferredSessionMinutes: 5, timeZone: "America/Mexico_City", onboardingCompletedAt: 1000, professionalLevel: "gerente" });
  });
  it("rechaza empresas no jugables o de otra industria", () => {
    expect(sanitizeOnboarding({ ...base, homeCompanyVariantId: "sierraysal" }, 1)).toEqual({ ok: false, error: "no_jugable" });
    expect(sanitizeOnboarding({ ...base, homeCompanyVariantId: "brasa" }, 1)).toEqual({ ok: false, error: "no_pertenece" });
    expect(sanitizeOnboarding(null, 1).ok).toBe(false);
  });
  it("la meta diaria es obligatoria y solo 1, 2 o 3", () => {
    expect(sanitizeOnboarding({ ...base, dailyDecisionGoal: 4 }, 1)).toEqual({ ok: false, error: "meta_invalida" });
    expect(sanitizeOnboarding({ ...base, dailyDecisionGoal: "2" }, 1)).toEqual({ ok: false, error: "meta_invalida" });
  });
  it("campos opcionales desconocidos quedan en null; minutos y zona horaria tienen valor seguro", () => {
    const r = sanitizeOnboarding({ ...base, professionalLevel: "astronauta", functionalArea: 5, preferredSessionMinutes: 7, timeZone: "Marte/Olympus" }, 1);
    expect(r.ok && r.profile.professionalLevel).toBeNull();
    expect(r.ok && r.profile.functionalArea).toBeNull();
    expect(r.ok && r.profile.preferredSessionMinutes).toBe(5);
    expect(r.ok && r.profile.timeZone).toBe("America/Monterrey");
  });
  it("la ventana de avisos usa horas válidas y no puede empezar y terminar igual", () => {
    expect(sanitizeOnboarding({ ...base, preferredNotificationWindow: { start: 9, end: 9 } }, 1)).toEqual({ ok: false, error: "ventana_invalida" });
    const r = sanitizeOnboarding({ ...base, preferredNotificationWindow: { start: 30, end: -1 } }, 1);
    expect(r.ok && r.profile.preferredNotificationWindow).toEqual({ start: 8, end: 20 });
  });
  it("la meta de decisiones y los minutos son independientes", () => {
    const r = sanitizeOnboarding({ ...base, dailyDecisionGoal: 1, preferredSessionMinutes: 12 }, 1);
    expect(r.ok && [r.profile.dailyDecisionGoal, r.profile.preferredSessionMinutes]).toEqual([1, 12]);
  });
  it("zonas horarias", () => {
    expect(isValidTimeZone("America/Monterrey")).toBe(true);
    expect(isValidTimeZone("nada")).toBe(false);
    expect(isValidTimeZone(5)).toBe(false);
  });
  it("se guarda con los nombres de columna de la migración 0016", () => {
    const r = sanitizeOnboarding(base, Date.UTC(2026, 9, 28));
    if (!r.ok) throw new Error("debió aceptar");
    const row = onboardingToRow(r.profile);
    expect(Object.keys(row).sort()).toEqual(["daily_decision_goal", "experience_band", "functional_area", "home_company_variant_id", "home_industry_id", "learning_goal", "notify_window_end", "notify_window_start", "onboarding_completed_at", "onboarding_version", "preferred_session_minutes", "professional_level", "tz"]);
    expect(row.onboarding_completed_at).toBe("2026-10-28T00:00:00.000Z");
  });
});

import { onboardingFromState, onboardingSignature, GOAL_TITLE, GOAL_SUBTITLE, PROJECTION_SUBTITLE } from "./onboarding";
import { newState } from "./engine";
import { sanitizeAction } from "./journal";
import { applyAction } from "./replay";
import type { CeoState } from "./types";

const T = Date.UTC(2026, 9, 1, 15);
const started = (patch: Partial<CeoState["settings"]> = {}, extra: Partial<CeoState> = {}): CeoState => {
  const s: CeoState = newState();
  return { ...s, ...extra, name: "Ana", startedAt: T, company: extra.company ?? "forja", settings: { ...s.settings, windowStart: 9, windowEnd: 18, tz: "America/Monterrey", ...patch } };
};

describe("pantallas nuevas del onboarding (1.0)", () => {
  it("textos de la adenda §4", () => {
    expect(GOAL_TITLE).toBe("¿Cuántas decisiones quieres practicar cada día?");
    expect(GOAL_SUBTITLE).toContain("Puedes cambiarlo cuando quieras");
    expect(PROJECTION_SUBTITLE).toContain("evaluar riesgos, priorizar y tomar decisiones con consecuencias");
  });
  it("cambiar la meta recalcula la proyección", () => {
    expect(weeklyProjectionText(1)).toContain("7 decisiones");
    expect(weeklyProjectionText(3)).toContain("21 decisiones");
  });
});

describe("onboardingFromState: lo que se guarda en el servidor", () => {
  it("quien empezó antes de 1.0 (sin meta diaria) no manda nada", () => {
    expect(onboardingFromState(started())).toBeNull();
    expect(onboardingFromState({ ...started({ dailyGoal: 2 }), startedAt: null })).toBeNull();
    expect(onboardingSignature(null)).toBeNull();
  });
  it("arma un perfil válido con la empresa de casa y la industria del catálogo", () => {
    const s = started({ dailyGoal: 3, sessionMinutes: 8 }, { profile: { v: 1, role: "gerente", areas: ["finanzas"], years: "6-10", goal: "ascenso", skipped: [], source: "onboarding", answeredAt: T, updatedAt: T } });
    const ob = onboardingFromState(s)!;
    expect(ob).toMatchObject({ homeIndustryId: "manufactura", homeCompanyVariantId: "forja", dailyDecisionGoal: 3, preferredSessionMinutes: 8, preferredNotificationWindow: { start: 9, end: 18 }, professionalLevel: "gerente", functionalArea: "finanzas", onboardingCompletedAt: T });
    const r = sanitizeOnboarding(ob, T + 1000);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.profile.onboardingCompletedAt).toBe(T);
      expect(onboardingToRow(r.profile)).toMatchObject({ daily_decision_goal: 3, home_company_variant_id: "forja", home_industry_id: "manufactura", preferred_session_minutes: 8 });
    }
  });
  it("sin minutos elegidos usa 5; cada empresa jugable pasa la validación", () => {
    for (const company of ["cumbre", "forja", "brasa"]) {
      const ob = onboardingFromState(started({ dailyGoal: 1 }, { company }))!;
      expect(ob.preferredSessionMinutes).toBe(5);
      expect(sanitizeOnboarding(ob, T).ok).toBe(true);
    }
  });
  it("la firma cambia si cambia la meta (se vuelve a guardar) y no si no cambia", () => {
    const a = onboardingSignature(onboardingFromState(started({ dailyGoal: 2 })));
    expect(onboardingSignature(onboardingFromState(started({ dailyGoal: 2 })))).toBe(a);
    expect(onboardingSignature(onboardingFromState(started({ dailyGoal: 3 })))).not.toBe(a);
  });
  it("la fecha de término no puede venir del futuro", () => {
    const r = sanitizeOnboarding({ ...base, onboardingCompletedAt: T + 10_000 }, T);
    expect(r.ok && r.profile.onboardingCompletedAt).toBe(T);
  });
});

describe("la meta viaja en el diario de la partida", () => {
  it("start y ajustes conservan dailyGoal y sessionMinutes válidos y descartan los inválidos", () => {
    const a = sanitizeAction({ type: "start", at: T, name: "Ana", company: "forja", settings: { dailyGoal: 2, sessionMinutes: 8, email: "x@y.com" } });
    expect(a && a.type === "start" && a.settings).toEqual({ dailyGoal: 2, sessionMinutes: 8 });
    const b = sanitizeAction({ type: "start", at: T, name: "Ana", company: "forja", settings: { dailyGoal: 7, sessionMinutes: 4 } });
    expect(b && b.type === "start" && b.settings).toEqual({});
  });
  it("la reproducción aplica la meta y su cambio en Ajustes", () => {
    let s = applyAction(newState(), { type: "start", at: T, name: "Ana", company: "forja", settings: { dailyGoal: 1 } }).state;
    expect(s.settings.dailyGoal).toBe(1);
    s = applyAction(s, { type: "settings", at: T + 1000, patch: { dailyGoal: 3 } }).state;
    expect(s.settings.dailyGoal).toBe(3);
  });
});
