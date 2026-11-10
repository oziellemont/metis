/**
 * World Events · protección de partidas existentes.
 *
 * Los episodios que ya están guardados en partidas (reglas v1, sin `rv`) deben reconstruirse EXACTAMENTE igual después
 * de cualquier cambio de reglas: misma caja, mismos indicadores, mismos impactos. La foto `fixtures/legacy_v1.json` se
 * tomó con el código de la v1 antes de introducir las reglas v2; si alguien cambia una regla v1, esta prueba falla.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decideGrowth, growthDelta, newGrowthLog, openWorldLog, retailOf, retailPendingOf, steelOf, steelPendingOf, type GrowthLog } from "../growth/session";
import { cashOf as retailCash } from "../growth/retail/engine";
import { cashOf as steelCash } from "../growth/steel/engine";
import { exerciseInput, type ExerciseKind } from "./client";
import type { WorldOpenInput } from "./episodes";

const FILE = `${__dirname}/fixtures/legacy_v1.json`;
const TEMPLATES = ["conveniencia_regional_v2", "aceria_compacta_v2", "miniaceria_integrada_v2"];
const KINDS: ExerciseKind[] = ["ciclon", "sismo", "tipo_cambio", "tasa", "arancel"];
const AT = Date.parse("2026-10-30T12:00:00Z");

/** Quita la marca de versión para simular un episodio guardado con las reglas v1. */
const asV1 = (log: GrowthLog): GrowthLog => ({ ...log, world: log.world?.map((e) => { const { rv: _rv, ...rest } = e as typeof e & { rv?: number }; return rest; }) });

function snapshot(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const t of TEMPLATES) for (const k of KINDS) {
    const inp = exerciseInput(t, AT, k) as WorldOpenInput | null;
    if (!inp) continue;
    const opened = openWorldLog(newGrowthLog(t, "legado")!, inp, 15, AT, { worldEvents: true });
    if (!opened) continue;
    const log0 = asV1(opened);
    const retail = t.startsWith("conveniencia");
    const p = retail ? retailPendingOf(log0, 15) : steelPendingOf(log0, 15);
    for (const o of p?.options ?? []) {
      if (o.blocked || !o.ok) continue;
      const r = decideGrowth(log0, 15, p!.c.id, o.id);
      if (!r.ok) continue;
      const log = asV1(r.log);
      const st = retail ? retailOf(log, 90) : steelOf(log, 90);
      out[`${t}|${k}|${o.id}`] = {
        cash: retail ? retailCash(st.state as never) : steelCash(st.state as never),
        kpis: Object.fromEntries(Object.entries(growthDelta(log, 90)).map(([k, v]) => [k, v + 0])),
        external: st.external.map((h) => ({ day: h.day, commands: h.commands })),
      };
    }
  }
  return out;
}

describe("partidas existentes (reglas v1) no cambian", () => {
  it("cada episodio v1 se reconstruye idéntico a la foto tomada antes de las reglas v2", () => {
    const now = snapshot();
    if (!existsSync(FILE)) writeFileSync(FILE, JSON.stringify(now, null, 1));
    const before = JSON.parse(readFileSync(FILE, "utf8"));
    expect(Object.keys(now).length).toBeGreaterThan(20);
    expect(now).toEqual(before);
  });
});
