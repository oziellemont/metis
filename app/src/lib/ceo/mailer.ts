/**
 * mêtis CEO · une las reglas (schedule) con las plantillas (emails): de un "job" a un correo listo.
 */
import { streakOf } from "./engine";
import type { Job } from "./schedule";
import { caseEmail, digestEmail, nudgeEmail, reminderEmail, seasonEmail, streakEmail, welcomeEmail, type Mailable } from "./emails";
import type { CeoState } from "./types";

export function renderJob(job: Job, s: CeoState, name: string, appUrl: string, real: number): Mailable {
  const now = real + (s.clockOffset || 0);
  switch (job.kind) {
    case "welcome": return welcomeEmail({ name, appUrl, windowStart: s.settings.windowStart, windowEnd: s.settings.windowEnd });
    case "case": return caseEmail({ name, appUrl, entry: job.entry, streak: streakOf(s, now).days, tz: s.settings.tz });
    case "reminder": return reminderEmail({ name, appUrl, entry: job.entry, hoursLeft: job.hoursLeft });
    case "digest": return digestEmail({ name, appUrl, ...job.data });
    case "streak": return streakEmail({ name, appUrl, streak: job.streak, pending: job.pending, lessonId: job.lessonId, lessonTitle: job.lessonTitle });
    case "nudge": return nudgeEmail({ name, appUrl, days: job.days, pending: job.pending });
    case "season": return seasonEmail({ name, appUrl, health: job.health, xp: job.xp, level: job.level, archetype: job.archetype, archetypeText: job.archetypeText, decisions: job.decisions, bestStreak: job.bestStreak });
  }
}
