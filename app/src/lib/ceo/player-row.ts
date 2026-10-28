/** Renglón de ceo.players a partir del estado (mismo cálculo en el navegador y en el servidor). */
import type { CeoState } from "./types";
import { aliasOf, healthOf, kpis, nowOf, streakOf, xpOf } from "./engine";
import { STAGES } from "./journey";

export function playerRow(userId: string, s: CeoState, accountEmail: string, real = Date.now()) {
  const t = nowOf(s, real);
  const st = streakOf(s, t);
  return {
    user_id: userId, alias: s.alias || aliasOf(s.name), name: s.name, state: s,
    xp: xpOf(s, t), level: STAGES[s.journey?.stage ?? 0].name, streak: st.days, best_streak: st.best, health: healthOf(kpis(s, t)),
    decisions: Object.keys(s.decisions).length, email: s.settings.email || accountEmail, phone: s.settings.phone,
    notify_email: s.settings.notifyEmail, notify_whatsapp: s.settings.notifyWhatsapp, tz: s.settings.tz,
    updated_at: new Date(real).toISOString(),
  };
}
