/**
 * mêtis CEO · Growth Engine · ejecutor de cadenas (fase 2).
 *
 * Puro y determinista: recibe el estado del motor y el registro de decisiones, y devuelve un estado nuevo.
 *  - `availableCases`: casos que hoy pueden llegar (precondiciones estructurales + encadenamiento + no decididos).
 *  - `optionsOf`: opciones con su disponibilidad calculada por el motor (nunca se inventa una alternativa).
 *  - `decide`: aplica los comandos de la opción de forma atómica (si uno falla, no se aplica ninguno).
 *  - `play`: decide y deja correr los `waitDays` del caso para que se vea la consecuencia.
 */
import { advance, apply } from "./engine";
import { clone } from "./core";
import { GROWTH_CASES, NEW_SITE, caseById, requiresMet, type GCase } from "./cases";
import type { Command, GrowthState } from "./types";
import type { KpiKey } from "../types";

export interface Decision {
  caseId: string;
  /** Identidad de la instancia: el id del caso, o `id@día` si el caso es repetible. */
  key: string;
  optionId: string;
  day: number;
}

export interface OptionView {
  id: string;
  text: string;
  outcome: string;
  ok: boolean;
  reason?: string;
  score: number;
  effects: Partial<Record<KpiKey, number>>;
}

export const keyOf = (c: GCase, day: number) => (c.repeatable ? `${c.id}@${day}` : c.id);

function chainOpen(c: GCase, decisions: readonly Decision[]): boolean {
  if (!c.after) return true;
  const prev = decisions.find((d) => d.caseId === c.after!.case);
  return !!prev && c.after.options.includes(prev.optionId);
}

function notDecided(c: GCase, g: GrowthState, decisions: readonly Decision[]): boolean {
  const mine = decisions.filter((d) => d.caseId === c.id);
  if (!c.repeatable) return mine.length === 0;
  const last = mine.at(-1);
  // Un caso repetible (crisis de liquidez) vuelve a llegar solo cuando pasó su espera.
  return !last || g.day - last.day >= c.waitDays;
}

/** Casos que hoy pueden llegar, en orden de cadena. */
export function availableCases(g: GrowthState, decisions: readonly Decision[]): GCase[] {
  return GROWTH_CASES.filter((c) => (c.family === "ambas" || c.family === g.family) && notDecided(c, g, decisions) && chainOpen(c, decisions) && requiresMet(g, c.requires).ok);
}

/** Por qué un caso no llega hoy (para pruebas y para el panel de diagnóstico). */
export function whyNot(g: GrowthState, caseId: string, decisions: readonly Decision[]): string[] {
  const c = caseById(caseId);
  if (!c) return ["caso desconocido"];
  const out: string[] = [];
  if (c.family !== "ambas" && c.family !== g.family) out.push("industria");
  if (!notDecided(c, g, decisions)) out.push("ya decidido");
  if (!chainOpen(c, decisions)) out.push(`espera a ${c.after!.case}`);
  out.push(...requiresMet(g, c.requires).failed);
  return out;
}

export function optionsOf(g: GrowthState, c: GCase): OptionView[] {
  return c.options.map((o) => {
    const av = o.available ? o.available(g) : { ok: true };
    return { id: o.id, text: o.text, outcome: o.outcome(g), ok: av.ok, reason: av.ok ? undefined : av.reason, score: o.score, effects: { ...(o.effects ?? {}) } };
  });
}

export interface DecideResult {
  ok: boolean;
  reason?: string;
  state: GrowthState;
  decision?: Decision;
  /** Efectos editoriales (solo Equipo, Clientes, Consejo). Caja y Margen salen del motor. */
  effects: Partial<Record<KpiKey, number>>;
  /** Comandos aplicados (con la sede nueva ya resuelta), para el registro y la reconstrucción. */
  commands: Command[];
}

/** Aplica una decisión de forma atómica sobre una copia. */
export function decide(g0: GrowthState, caseId: string, optionId: string, decisions: readonly Decision[] = []): DecideResult {
  const c = caseById(caseId);
  const fail = (reason: string): DecideResult => ({ ok: false, reason, state: g0, effects: {}, commands: [] });
  if (!c) return fail("Caso desconocido.");
  if (!availableCases(g0, decisions).includes(c)) return fail(`El caso no procede hoy: ${whyNot(g0, caseId, decisions).join(", ")}.`);
  const o = c.options.find((x) => x.id === optionId);
  if (!o) return fail("Opción desconocida.");
  const av = o.available ? o.available(g0) : { ok: true };
  if (!av.ok) return fail(av.reason ?? "Opción no disponible.");
  const key = keyOf(c, g0.day);
  const g = clone(g0);
  const cmds = o.commands(g, key);
  const done: Command[] = [];
  for (const raw of cmds) {
    let cmd = raw;
    if (cmd.type === "hire" && cmd.siteId === NEW_SITE) {
      const site = g.sites.find((x) => x.ref === `${key}:site`);
      if (!site) return fail("La sede nueva no se creó.");
      cmd = { ...cmd, siteId: site.id };
    }
    const r = apply(g, cmd);
    // El rechazo del banco o de un proveedor es una respuesta válida del mundo: la decisión queda tomada.
    if (!r.ok && !r.refused) return fail(r.reason ?? "No se pudo aplicar.");
    done.push(cmd);
  }
  const decision: Decision = { caseId: c.id, key, optionId, day: g0.day };
  return { ok: true, state: g, decision, effects: { ...(o.effects ?? {}) }, commands: done };
}

/** Decide y deja correr la espera del caso. */
export function play(g0: GrowthState, caseId: string, optionId: string, decisions: readonly Decision[] = []): DecideResult {
  const r = decide(g0, caseId, optionId, decisions);
  if (!r.ok) return r;
  return { ...r, state: advance(r.state, caseById(caseId)!.waitDays) };
}

/**
 * Avanza día por día hasta que llegue alguno de los casos indicados (o se agote el plazo).
 * Devuelve el estado en el día de llegada.
 */
export function untilCase(g0: GrowthState, caseIds: string[], decisions: readonly Decision[], maxDays = 365): { state: GrowthState; caseId: string | null } {
  let g = g0;
  for (let i = 0; i <= maxDays; i++) {
    const hit = availableCases(g, decisions).find((c) => caseIds.includes(c.id));
    if (hit) return { state: g, caseId: hit.id };
    g = advance(g, 1);
  }
  return { state: g, caseId: null };
}
