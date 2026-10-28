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
