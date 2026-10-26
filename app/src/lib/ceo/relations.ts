/**
 * Relaciones: cómo le cae cada decisión a cada persona de la empresa.
 * - Cada opción trae `stance` (−2 … +2) para las personas del caso.
 * - El efecto se propaga por el mapa: a los aliados les llega parte; a quien está en tensión, al revés;
 *   y a quien alguien influye, le llega lo que piensa su referente.
 * - Si dejas vencer un asunto, a quien te escribió le cae mal.
 * La relación arranca en 50 (0 = rota, 100 = aliado incondicional).
 */
import type { CastId, CeoState, CompanyPack, Entry, Option } from "./types";
import { entries, nowOf, packOf } from "./engine";

export const REL_START = 50;
/** Puntos por cada unidad de `stance`. */
export const REL_UNIT = 8;
const SPILL = { alianza: 0.4, influye: 0.5, tension: -0.3 } as const;

export interface Ripple { id: CastId; delta: number; via?: CastId; kind: "directo" | "alianza" | "influye" | "tension" }

/** Quién se movió y por qué, a partir de una postura directa. */
export function ripplesOf(pack: CompanyPack, stance: Record<CastId, number>): Ripple[] {
  const direct: Ripple[] = Object.entries(stance).filter(([id, v]) => v && pack.cast[id]).map(([id, v]) => ({ id, delta: v * REL_UNIT, kind: "directo" as const }));
  const touched = new Set(direct.map((r) => r.id));
  const spill = new Map<CastId, Ripple>();
  for (const d of direct) {
    for (const t of pack.ties) {
      let other: CastId | null = null;
      if (t.kind === "influye") { if (t.a === d.id) other = t.b; }
      else if (t.a === d.id) other = t.b; else if (t.b === d.id) other = t.a;
      if (!other || touched.has(other)) continue;
      const delta = Math.round(d.delta * SPILL[t.kind]);
      if (!delta) continue;
      const prev = spill.get(other);
      if (!prev || Math.abs(delta) > Math.abs(prev.delta)) spill.set(other, { id: other, delta, via: d.id, kind: t.kind });
    }
  }
  return [...direct, ...spill.values()];
}

/** Efecto en personas de lo que pasó en un asunto. */
export function entryRipples(pack: CompanyPack, e: Pick<Entry, "status" | "item" | "option">): Ripple[] {
  if (e.status === "decidido" && e.option) return ripplesOf(pack, stanceOf(e.option));
  if (e.status === "vencido") return ripplesOf(pack, { [e.item.from]: -1 });
  return [];
}
export const stanceOf = (o: Option) => o.stance ?? {};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Relación actual con cada persona (0–100). */
export function relationsOf(s: CeoState, now = nowOf(s)): Record<CastId, number> {
  const pack = packOf(s);
  const r: Record<CastId, number> = Object.fromEntries(Object.keys(pack.cast).map((id) => [id, REL_START]));
  for (const e of entries(s, now)) for (const x of entryRipples(pack, e)) r[x.id] = clamp((r[x.id] ?? REL_START) + x.delta);
  return r;
}

export function moodOf(v: number): { label: string; tone: "aliado" | "bien" | "neutral" | "frio" | "roto" } {
  if (v >= 75) return { label: "Aliado", tone: "aliado" };
  if (v >= 60) return { label: "Bien", tone: "bien" };
  if (v > 40) return { label: "Neutral", tone: "neutral" };
  if (v > 25) return { label: "Distante", tone: "frio" };
  return { label: "Relación rota", tone: "roto" };
}

// ───────────────────────────── acciones del proyecto de cambio
import { canUse, simulate, weeksFor } from "./change";
import type { LeverId } from "./types";
import { changeOpen } from "./engine";

/** Arranca el proyecto: congela cómo están tus relaciones hoy (lo que decidiste antes ya cuenta). */
export function startChange(s: CeoState, now = nowOf(s)): CeoState {
  if (!changeOpen(s, now) || (s.change && s.change.company === s.company)) return s;
  return { ...s, change: { company: s.company, rel0: relationsOf(s, now), moves: [], weeks: weeksFor(s.tier) }, lastActiveAt: now };
}
/** Usa una palanca (consume semanas). */
export function playLever(s: CeoState, lever: LeverId, targets: CastId[], now = nowOf(s)): CeoState {
  const ch = s.change;
  if (!ch || ch.company !== s.company || ch.closedAt) return s;
  const pack = packOf(s);
  const sim = simulate(pack.change, pack, ch);
  if (!canUse(sim, lever, targets)) return s;
  return { ...s, change: { ...ch, moves: [...ch.moves, { lever, targets, at: now }] }, lastActiveAt: now };
}
/** Presenta el resultado al consejo (cierra el proyecto). */
export function closeChange(s: CeoState, now = nowOf(s)): CeoState {
  const ch = s.change;
  if (!ch || ch.company !== s.company || ch.closedAt) return s;
  return { ...s, change: { ...ch, closedAt: now }, lastActiveAt: now };
}
