/**
 * mêtis CEO · perfil de onboarding v3.2 (adenda §4).
 *
 * Contrato de los campos que se guardan por persona (`ceo.players`, migración 0016) y su validación.
 * La experiencia declarada nunca entra a dominio, etapa, XP ni ranking (igual que profile.ts).
 * Lógica pura: sin React ni navegador. El servidor usa `sanitizeOnboarding` antes de guardar.
 */
import { EXP_AREAS, GOALS, ROLES, YEARS } from "./profile";
import { catalogCompanyById, validateHome } from "./catalog";
import type { CeoState } from "./types";

export const ONBOARDING_VERSION = 1;

/** Meta diaria flexible de decisiones (no es un deber: no castiga si no se cumple). */
export const DAILY_GOALS = [
  { value: 1, id: "tranquilo", label: "Tranquilo", hint: "1 decisión al día" },
  { value: 2, id: "constante", label: "Constante", hint: "2 decisiones al día", recommended: true },
  { value: 3, id: "intensivo", label: "Intensivo", hint: "3 decisiones al día" },
] as const;
export type DailyDecisionGoal = (typeof DAILY_GOALS)[number]["value"];
export const DEFAULT_DAILY_GOAL: DailyDecisionGoal = 2;

/** Presupuesto aproximado de tiempo por sesión (separado de la meta de decisiones). */
export const SESSION_MINUTES = [3, 5, 8, 12] as const;
export type SessionMinutes = (typeof SESSION_MINUTES)[number];
export const DEFAULT_SESSION_MINUTES: SessionMinutes = 5;

/** Proyección de la primera semana: 7, 14 o 21. */
export const weeklyProjection = (goal: DailyDecisionGoal): number => goal * 7;
export const weeklyProjectionText = (goal: DailyDecisionGoal): string =>
  `¡Eso son ${weeklyProjection(goal)} decisiones como meta para tu primera semana!`;

export interface NotificationWindow { start: number; end: number }

export interface OnboardingProfile {
  onboardingVersion: number;
  professionalLevel: string | null;
  functionalArea: string | null;
  experienceBand: string | null;
  learningGoal: string | null;
  homeIndustryId: string;
  homeCompanyVariantId: string;
  dailyDecisionGoal: DailyDecisionGoal;
  preferredSessionMinutes: SessionMinutes;
  preferredNotificationWindow: NotificationWindow;
  timeZone: string;
  /** ms epoch; null mientras no termina. */
  onboardingCompletedAt: number | null;
}

const pick = <T extends string>(v: unknown, allowed: readonly { id: T }[]): T | null =>
  typeof v === "string" && allowed.some((a) => a.id === v) ? (v as T) : null;

const hour = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23 ? v : null);

/** Zona horaria IANA válida (la reconoce Intl). */
export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length < 3 || tz.length > 64) return false;
  try { new Intl.DateTimeFormat("es-MX", { timeZone: tz }); return true; } catch { return false; }
}

export type OnboardingCheck = { ok: true; profile: OnboardingProfile } | { ok: false; error: string };

/**
 * Limpia y valida lo que manda el navegador. Campos opcionales desconocidos → null (no se rechaza al usuario por ellos).
 * La industria y la empresa de casa SÍ son obligatorias y se validan contra el catálogo jugable.
 */
export function sanitizeOnboarding(raw: unknown, now: number): OnboardingCheck {
  if (!raw || typeof raw !== "object") return { ok: false, error: "datos_invalidos" };
  const r = raw as Record<string, unknown>;
  const home = validateHome(r.homeIndustryId as string, r.homeCompanyVariantId as string);
  if (!home.ok) return { ok: false, error: home.reason };
  const goal = DAILY_GOALS.find((g) => g.value === r.dailyDecisionGoal)?.value ?? null;
  if (goal === null) return { ok: false, error: "meta_invalida" };
  const minutes = (SESSION_MINUTES as readonly number[]).includes(r.preferredSessionMinutes as number) ? (r.preferredSessionMinutes as SessionMinutes) : DEFAULT_SESSION_MINUTES;
  const w = (r.preferredNotificationWindow ?? {}) as Record<string, unknown>;
  const start = hour(w.start) ?? 8;
  const end = hour(w.end) ?? 20;
  if (start === end) return { ok: false, error: "ventana_invalida" };
  const tz = isValidTimeZone(r.timeZone) ? r.timeZone : "America/Monterrey";
  return {
    ok: true,
    profile: {
      onboardingVersion: ONBOARDING_VERSION,
      professionalLevel: pick(r.professionalLevel, ROLES),
      functionalArea: pick(r.functionalArea, EXP_AREAS),
      experienceBand: pick(r.experienceBand, YEARS),
      learningGoal: pick(r.learningGoal, GOALS),
      homeIndustryId: r.homeIndustryId as string,
      homeCompanyVariantId: r.homeCompanyVariantId as string,
      dailyDecisionGoal: goal,
      preferredSessionMinutes: minutes,
      preferredNotificationWindow: { start, end },
      timeZone: tz,
      onboardingCompletedAt: typeof r.onboardingCompletedAt === "number" && Number.isFinite(r.onboardingCompletedAt) && r.onboardingCompletedAt > 0 && r.onboardingCompletedAt <= now ? Math.round(r.onboardingCompletedAt) : now,
    },
  };
}

/** Columnas de `ceo.players` (snake_case) para guardar el perfil. */
export function onboardingToRow(p: OnboardingProfile): Record<string, unknown> {
  return {
    onboarding_version: p.onboardingVersion,
    professional_level: p.professionalLevel,
    functional_area: p.functionalArea,
    experience_band: p.experienceBand,
    learning_goal: p.learningGoal,
    home_industry_id: p.homeIndustryId,
    home_company_variant_id: p.homeCompanyVariantId,
    daily_decision_goal: p.dailyDecisionGoal,
    preferred_session_minutes: p.preferredSessionMinutes,
    notify_window_start: p.preferredNotificationWindow.start,
    notify_window_end: p.preferredNotificationWindow.end,
    tz: p.timeZone,
    onboarding_completed_at: p.onboardingCompletedAt ? new Date(p.onboardingCompletedAt).toISOString() : null,
  };
}

/** Frase de apoyo de la pantalla de proyección (adenda §4). */
export const PROJECTION_SUBTITLE = "Comenzarás a practicar cómo evaluar riesgos, priorizar y tomar decisiones con consecuencias.";
export const GOAL_TITLE = "¿Cuántas decisiones quieres practicar cada día?";
export const GOAL_SUBTITLE = "Empieza con un ritmo que puedas sostener. Puedes cambiarlo cuando quieras.";

export const isDailyGoal = (v: unknown): v is DailyDecisionGoal => v === 1 || v === 2 || v === 3;
export const isSessionMinutes = (v: unknown): v is SessionMinutes => (SESSION_MINUTES as readonly unknown[]).includes(v);

/**
 * Arma lo que se manda a POST /api/ceo/perfil a partir de la partida guardada.
 * Devuelve null si la persona no pasó por la meta diaria (empezó antes de 1.0) o si su empresa no está en el catálogo.
 * Lo declarado en el perfil profesional se reutiliza tal cual: no se vuelve a preguntar.
 */
export function onboardingFromState(s: CeoState): Record<string, unknown> | null {
  const goal = s.settings.dailyGoal;
  if (!s.startedAt || !isDailyGoal(goal)) return null;
  const co = catalogCompanyById(s.company);
  if (!co) return null;
  const p = s.profile;
  return {
    professionalLevel: p?.role ?? null,
    functionalArea: p?.areas?.[0] ?? null,
    experienceBand: p?.years ?? null,
    learningGoal: p?.goal ?? null,
    homeIndustryId: co.industryId,
    homeCompanyVariantId: co.id,
    dailyDecisionGoal: goal,
    preferredSessionMinutes: isSessionMinutes(s.settings.sessionMinutes) ? s.settings.sessionMinutes : DEFAULT_SESSION_MINUTES,
    preferredNotificationWindow: { start: s.settings.windowStart, end: s.settings.windowEnd },
    timeZone: s.settings.tz,
    onboardingCompletedAt: s.startedAt,
  };
}

/** Firma de lo enviado: si cambia (por ejemplo, la meta en Ajustes), se vuelve a guardar en el servidor. */
export function onboardingSignature(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const w = payload.preferredNotificationWindow as NotificationWindow;
  return [ONBOARDING_VERSION, payload.homeCompanyVariantId, payload.dailyDecisionGoal, payload.preferredSessionMinutes, w.start, w.end, payload.timeZone, payload.professionalLevel, payload.functionalArea, payload.experienceBand, payload.learningGoal].join("|");
}
