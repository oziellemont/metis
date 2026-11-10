/**
 * Prueba completa World Events v2 (simulación etiquetada). Corre solo con PRUEBA_WORLD=1 y escribe
 * docs/golive/world-events/prueba_v2.json. Todas las cifras salen del motor (nada a mano).
 *   PRUEBA_WORLD=1 npx vitest run scripts/prueba-world-v2.test.ts
 */
import { writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { exerciseInput } from "@/lib/ceo/world/client";
import { steelImpact, steelWorldCase } from "@/lib/ceo/world/cases";
import { advanceSteel, applySteel, balanceSheet, cashOf, createSteel, type SteelState } from "@/lib/ceo/growth/steel/engine";
import { decideGrowth, externalOf, growthDelta, newGrowthLog, openWorldLog, steelOf, steelPendingOf } from "@/lib/ceo/growth/session";
import type { WorldEpisode } from "@/lib/ceo/world/types";

const BIG = "miniaceria_integrada_v2";
const SEED = "prueba-campeche";
const AT = Date.parse("2026-11-10T15:00:00Z");
const pesos = (centavos: number) => Math.round(centavos / 100);
const run = process.env.PRUEBA_WORLD === "1" ? describe : describe.skip;

function snap(s: SteelState) {
  const b = balanceSheet(s);
  const ventas = s.months.reduce((a, x) => a + x.revenue, 0);
  return { caja: pesos(cashOf(s)), capital: pesos(b.equity), ventasAcum: pesos(ventas), seguridad: Math.round(s.safety * 1000) / 1000, personal: Math.round(s.relations.staff * 1000) / 1000, clientes: Math.round(s.relations.clients * 1000) / 1000 };
}

run("prueba completa World Events v2", () => {
  it("inundación en Campeche y arancel de EE. UU.", () => {
    const out: Record<string, unknown> = { generado: new Date().toISOString(), etiqueta: "SIMULACIÓN (ejercicio hipotético). No es un acontecimiento real." };

    // ── 1. Inundación de ejercicio sobre la planta de Campeche (Miniacería integrada) ──────────────────────────
    const inp = exerciseInput(BIG, AT, "inundacion")!;
    const opened = openWorldLog(newGrowthLog(BIG, SEED)!, inp, 5, AT, {})!;
    const p = steelPendingOf(opened, 5)!;
    const ep = opened.world![0];
    const base = newGrowthLog(BIG, SEED)!;
    const b60 = snap(steelOf(base, 60).state), b120 = snap(steelOf(base, 120).state);
    const opciones = p.options.map((o) => {
      const r: Record<string, unknown> = { id: o.id, etiqueta: o.label, detalle: o.detail, postura: o.stance, bloqueada: o.blocked, razon: o.reason };
      if (o.blocked) return r;
      const log = decideGrowth(opened, 5, `w:${ep.id}`, o.id).log;
      const st60 = steelOf(log, 60), st120 = steelOf(log, 120);
      const hit = st120.external[0];
      const s60 = snap(st60.state), s120 = snap(st120.state);
      return { ...r,
        impacto: hit?.text, desglose: hit?.parts,
        vsSinEvento: { caja60: s60.caja - b60.caja, caja120: s120.caja - b120.caja, capital120: s120.capital - b120.capital, seguridad: Math.round((s120.seguridad - b120.seguridad) * 1000) / 1000, personal: Math.round((s120.personal - b120.personal) * 1000) / 1000, clientes: Math.round((s120.clientes - b120.clientes) * 1000) / 1000 },
        indicadoresJugador120: growthDelta(log, 120), externoInevitable120: externalOf(log, 120), indicadoresSinEvento120: growthDelta(base, 120) };
    });
    out.inundacion = { empresa: "Miniacería integrada (plantilla miniaceria_integrada_v2)", sede: "Planta de corte y doblado de Campeche (12 % de las entregas, inventario de $9,000,000)", episodio: { nombre: ep.name, estado: ep.status, severidad: ep.severity, zonas: ep.sites, reglas: ep.rv, fuente: ep.source.name, desenlaceGuionado: ep.script }, caso: { asunto: p.subject, cuerpo: p.body, datos: p.data, leccion: p.lesson }, sinEvento: { d60: b60, d120: b120 }, opciones };

    // ── 2. Arancel de EE. UU. (ejercicio: 50 % → 60 %) con un contrato DAP a Houston ───────────────────────────────
    const s0 = createSteel(BIG, SEED);
    applySteel(s0, { type: "add_contract", id: "exp", client: "Comprador de Houston (exportación)", product: "palanquilla", tpd: 12, price: 11_400, dso: 30, startInDays: 0 });
    const s5 = advanceSteel(s0, 5);
    const usInp = exerciseInput(BIG, AT, "arancel_eeuu")!;
    const usEp = { ...usInp, id: "xus", day: 5, at: AT, rv: 2 } as WorldEpisode;
    const c = steelWorldCase(s5, usEp);
    const clone = (s: SteelState) => JSON.parse(JSON.stringify(s)) as SteelState;
    const none = snap(advanceSteel(clone(s5), 150));
    const us = c.options.map((o) => {
      const s = clone(s5);
      for (const cmd of o.commands(s, `w:xus:${o.id}`)) applySteel(s, cmd);
      const imp = steelImpact(s, usEp, o.id);
      for (const cmd of imp.commands) applySteel(s, cmd);
      const e = snap(advanceSteel(s, 150));
      return { id: o.id, etiqueta: o.label, detalle: o.detail(s5), impacto: imp.text, desglose: imp.parts, vsSinMedida150: { caja: e.caja - none.caja, capital: e.capital - none.capital, clientes: Math.round((e.clientes - none.clientes) * 1000) / 1000 } };
    });
    out.arancel = { empresa: "Miniacería integrada con contrato de exportación DAP a Houston (12 t diarias de palanquilla a $11,400, dentro de la capacidad libre de la planta)", episodio: { nombre: usInp.name, severidad: usInp.severity, hechos: usInp.facts }, caso: { asunto: c.subject, cuerpo: c.body(s5), datos: c.data(s5) }, opciones: us };
    writeFileSync("../docs/golive/world-events/prueba_v2.json", JSON.stringify(out, null, 2));
  });
});
