/**
 * World Events · aviso por correo (cron). Un solo correo por acontecimiento y revisión mayor («world:<id>:<rev>»),
 * solo a quien activó «Acontecimientos reales en mi carrera» y tiene el caso abierto hoy. Los ejercicios no avisan.
 */
import { growthDayOf } from "../engine";
import { isRetailLog, isSteelLog, retailPendingOf, steelPendingOf } from "../growth/session";
import type { CeoState } from "../types";
import type { WorldView } from "./episodes";

export interface WorldJob { key: string; world: WorldView; subject: string }

export function worldJobs(s: CeoState, sent: Record<string, unknown>, now: number): WorldJob[] {
  if (!s.growth || s.settings.worldEvents !== true || !s.growth.world?.length) return [];
  const day = growthDayOf(s, now);
  const p = isRetailLog(s.growth) ? retailPendingOf(s.growth, day) : isSteelLog(s.growth) ? steelPendingOf(s.growth, day) : null;
  const w = p?.world;
  if (!w || w.mode !== "real") return [];
  const ep = s.growth.world.find((e) => e.id === w.id);
  const key = `world:${w.id}:${ep?.rev ?? 0}`;
  return sent[key] ? [] : [{ key, world: w, subject: p!.subject }];
}
