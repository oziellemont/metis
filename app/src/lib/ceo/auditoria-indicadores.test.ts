/**
 * Auditoría de indicadores · fase A. Reportes generados por código (no cambian partidas, XP ni veredicto):
 *  - docs/editorial/simulacion-v9.{json,md}: v8 (vigente) frente a v9 (propuesta, no activa) en las seis empresas.
 *  - docs/editorial/inventario-efectos.{csv,md}: cada opción de cada asunto con sus efectos y alertas de causalidad.
 * Se generan con `AUD_REPORT=1 npx vitest run src/lib/ceo/auditoria-indicadores.test.ts`.
 */
import { it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COMPANIES } from "./companies";
import { bankItems } from "./cases/bank";
import { itemAtVersion } from "./versioned";
import { KPI_KEYS } from "./engine";
import { playCareer, STRATEGIES, HOLDOUT } from "./season-sim";
import { timeline } from "./season-report";
import type { Item, Kpis, Option } from "./types";

const DIR = join(process.cwd(), "..", "docs", "editorial");
const RUN = process.env.AUD_REPORT === "1";
const MONTHS = 3;
const PICK = ["director_equilibrado", "criterio_y_tablero", "criterio_contextual", "mejor_score", "mejor_efecto", "azar", "cuida_caja", "personas_primero", "numeros_con_piso", "criterio_con_errores", "criterio_ocupado", "etica_flexible", "no_contesta"];
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);

it.runIf(RUN)("simulación v8 vs v9 en las seis empresas", () => {
  type Cell = { pass: number; health: number; caja: number; minKpi: number; flow: number };
  const out: Record<string, Record<string, Record<number, Cell>>> = {};
  for (const name of PICK) {
    out[name] = {};
    const reps = Math.min(STRATEGIES[name].reps, 4);
    for (const co of COMPANIES) {
      out[name][co.id] = {} as Record<number, Cell>;
      for (const v of [8, 9]) {
        const pass: number[] = [], health: number[] = [], caja: number[] = [], minKpi: number[] = [], flow: number[] = [];
        for (let r = 0; r < reps; r++) {
          const c = playCareer(co.id, name, MONTHS, `aud|${r}`, v);
          for (const m of c.months) {
            pass.push(m.passed ? 100 : 0); health.push(m.health); caja.push(m.kpis.caja); minKpi.push(m.min);
            flow.push(timeline(m.state, m.at).events.filter((e) => e.kind === "flujo").reduce((a, e) => a + (e.after.caja - e.before.caja), 0));
          }
        }
        out[name][co.id][v] = { pass: avg(pass), health: avg(health), caja: avg(caja), minKpi: avg(minKpi), flow: avg(flow) };
      }
    }
  }
  mkdirSync(DIR, { recursive: true });
  writeFileSync(join(DIR, "simulacion-v9.json"), JSON.stringify({ months: MONTHS, strategies: PICK, out }, null, 1));
  const L: string[] = [];
  L.push("# Simulación · reglas v8 (vigentes) frente a v9 (propuesta, no activa)", "");
  L.push("Generado con `AUD_REPORT=1 npx vitest run src/lib/ceo/auditoria-indicadores.test.ts`. Semillas fijas: reproducible.", "");
  L.push(`Carrera continua, ${MONTHS} meses por empresa, mismas decisiones en ambas versiones. v9 quita dos cosas: el multiplicador de exigencia por etapa y la caja que se fabricaba desde el índice de margen al cierre. No cambia umbrales, rúbrica ni líneas rojas. Las estrategias marcadas «control» no se usaron para calibrar.`, "");
  L.push("## 1 · % de meses aprobados (v8 → v9)", "");
  L.push("| Estrategia | Control | " + COMPANIES.map((c) => c.id).join(" | ") + " | Promedio v8 | Promedio v9 |");
  L.push("|---|---|" + COMPANIES.map(() => "---").join("|") + "|---|---|");
  for (const name of PICK) {
    const row = COMPANIES.map((c) => `${out[name][c.id][8].pass} → ${out[name][c.id][9].pass}`);
    L.push(`| ${STRATEGIES[name].label} | ${(HOLDOUT as readonly string[]).includes(name) ? "sí" : ""} | ${row.join(" | ")} | ${avg(COMPANIES.map((c) => out[name][c.id][8].pass))} | ${avg(COMPANIES.map((c) => out[name][c.id][9].pass))} |`);
  }
  L.push("", "## 2 · Caja al cierre y caja fabricada desde el margen (promedio por mes)", "");
  L.push("| Estrategia | Caja v8 | Caja v9 | Caja que v8 sumaba desde el margen | Salud v8 | Salud v9 |");
  L.push("|---|---|---|---|---|---|");
  for (const name of PICK) {
    const g = (v: number, k: keyof Cell) => avg(COMPANIES.map((c) => out[name][c.id][v][k]));
    L.push(`| ${STRATEGIES[name].label} | ${g(8, "caja")} | ${g(9, "caja")} | ${g(8, "flow")} | ${g(8, "health")} | ${g(9, "health")} |`);
  }
  L.push("", "## 3 · Lectura", "");
  const d = (name: string) => avg(COMPANIES.map((c) => out[name][c.id][9].pass)) - avg(COMPANIES.map((c) => out[name][c.id][8].pass));
  const good = ["director_equilibrado", "criterio_y_tablero", "cuida_caja"].map((n) => `${STRATEGIES[n].label}: ${d(n) >= 0 ? "+" : ""}${Math.round(d(n) * 10) / 10} pts`).join("; ");
  const bad = ["mejor_efecto", "azar", "no_contesta"].map((n) => `${STRATEGIES[n].label}: ${d(n) >= 0 ? "+" : ""}${Math.round(d(n) * 10) / 10} pts`).join("; ");
  L.push(`Cambio en la tasa de aprobación al pasar a v9. Estrategias con buen criterio: ${good}. Estrategias sin criterio: ${bad}.`, "");
  L.push("Sin la caja «regalada» por el margen, la caja al cierre baja en todas las estrategias. Por eso v9 no se activa sola: hay que decidir con el fundador si se recalibra la caja inicial o los umbrales del consejo (fase de recalibración) antes de publicarla para periodos nuevos. Los periodos v8 nunca se recalifican.", "");
  writeFileSync(join(DIR, "simulacion-v9.md"), L.join("\n") + "\n");
}, 1_800_000);

// ───────────────────────────────────────────── inventario de efectos con alertas de causalidad
const MONEY = /(\$|peso|dinero|cost|pag|cobr|gast|invers|precio|presupuesto|factur|descuent|ahorr|sueldo|bono|nómina|crédito|deuda|préstamo|multa|penaliz|liquidaci|indemniz|compra|venta|vend|contrat|flete|merma|insumo|inventario|capital|ronda|caja|margen|rentab|reembols|garant|fianza|honorario|tarifa|cotiza|licencia|seguro|renta)/i;
const BOARD = /(consejo|consejer|accionist|inversionist|board|junta|socio|presidente del consejo|comité|auditor|reporte trimestral|serie [abc]|fondo)/i;
const textOf = (it: Item, o?: Option) => [it.subject, it.preview, ...(it.body ?? []), it.ask, o?.text, o?.outcome, ...(o?.reply ?? []), o?.pending?.what, o?.pending?.yes.text, o?.pending?.no.text].filter(Boolean).join(" ");

interface Flag { code: string; text: string }
function flagsOf(it: Item, eff: Partial<Kpis>, o: Option | null, where: "opcion" | "vencido"): Flag[] {
  const f: Flag[] = [];
  const txt = textOf(it, o ?? undefined) + (where === "vencido" ? " " + (it.expired?.outcome ?? "") + " " + (it.expired?.reply ?? []).join(" ") : "");
  const ks = KPI_KEYS.filter((k) => (eff[k] ?? 0) !== 0);
  if ((eff.consejo ?? 0) !== 0 && !BOARD.test(txt)) f.push({ code: "consejo_sin_evento", text: "Mueve Consejo sin que el consejo o los inversionistas aparezcan en el caso." });
  if (((eff.caja ?? 0) !== 0 || (eff.margen ?? 0) !== 0) && !MONEY.test(txt)) f.push({ code: "dinero_sin_hecho", text: "Mueve Caja o Margen sin un hecho económico en el texto (pago, cobro, costo, venta)." });
  if (o?.pending && ((o.effects.margen ?? 0) > 0 || (o.effects.caja ?? 0) > 0)) f.push({ code: "promesa_cobrada", text: "Suma Caja o Margen al decidir aunque el beneficio depende de una respuesta pendiente." });
  if (ks.length >= 4) f.push({ code: "impacto_multiple", text: `Mueve ${ks.length} indicadores a la vez: cada uno necesita su propia razón.` });
  const big = ks.filter((k) => Math.abs(eff[k] ?? 0) >= 8);
  if (big.length) f.push({ code: "golpe_grande", text: `Movimiento de 8 o más puntos en ${big.join(", ")}: revisar materialidad.` });
  if ((eff.caja ?? 0) !== 0 && (eff.margen ?? 0) !== 0 && Math.sign(eff.caja!) === Math.sign(eff.margen!) && Math.abs(eff.caja!) + Math.abs(eff.margen!) >= 6) f.push({ code: "doble_conteo", text: "Caja y Margen se mueven en el mismo sentido por el mismo hecho: posible doble conteo." });
  if (where === "vencido" && (eff.consejo ?? 0) < 0 && !BOARD.test(txt)) f.push({ code: "vencido_castiga_consejo", text: "Dejar vencer resta Consejo aunque el consejo no se entera en la historia." });
  return f;
}

it.runIf(RUN)("inventario de efectos de todos los asuntos con alertas de causalidad", () => {
  type Row = { company: string; item: string; origin: "fijo" | "banco"; option: string; score: number | ""; effects: Partial<Kpis>; net: number; flags: Flag[] };
  const rows: Row[] = [];
  for (const co of COMPANIES) {
    const items: [Item, "fijo" | "banco"][] = [...co.items.map((x) => [x, "fijo"] as [Item, "fijo"]), ...bankItems(co).map((x) => [x, "banco"] as [Item, "banco"])];
    for (const [raw, origin] of items) {
      const it = itemAtVersion(raw, 8);
      for (const o of it.options) rows.push({ company: co.id, item: it.id, origin, option: o.id, score: o.score, effects: o.effects, net: KPI_KEYS.reduce((a, k) => a + (o.effects[k] ?? 0), 0), flags: flagsOf(it, o.effects, o, "opcion") });
      if (it.expired) rows.push({ company: co.id, item: it.id, origin, option: "(vencido)", score: "", effects: it.expired.effects, net: KPI_KEYS.reduce((a, k) => a + (it.expired.effects[k] ?? 0), 0), flags: flagsOf(it, it.expired.effects, null, "vencido") });
    }
  }
  mkdirSync(DIR, { recursive: true });
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const csv = ["empresa,asunto,origen,opcion,score," + KPI_KEYS.join(",") + ",neto,alertas"];
  for (const r of rows) csv.push([r.company, r.item, r.origin, r.option, r.score, ...KPI_KEYS.map((k) => r.effects[k] ?? 0), r.net, esc(r.flags.map((f) => f.code).join(" "))].join(","));
  writeFileSync(join(DIR, "inventario-efectos.csv"), csv.join("\n") + "\n");

  const codes = ["consejo_sin_evento", "dinero_sin_hecho", "promesa_cobrada", "impacto_multiple", "golpe_grande", "doble_conteo", "vencido_castiga_consejo"];
  const desc: Record<string, string> = {};
  for (const r of rows) for (const f of r.flags) desc[f.code] = f.text.replace(/ en [a-z, ]+: revisar/, ": revisar").replace(/Mueve \d+ indicadores/, "Mueve 4 o más indicadores");
  const L: string[] = [];
  L.push("# Inventario de efectos · alertas de causalidad (fase A)", "");
  L.push("Generado por código con `AUD_REPORT=1 npx vitest run src/lib/ceo/auditoria-indicadores.test.ts`. Lee el contenido en reglas v8 (asuntos fijos y banco de casos). No cambia ningún efecto: marca dónde revisar.", "");
  L.push(`Total de caminos revisados: **${rows.length}** (${rows.filter((r) => r.option !== "(vencido)").length} opciones y ${rows.filter((r) => r.option === "(vencido)").length} vencimientos) en ${COMPANIES.length} empresas. Con al menos una alerta: **${rows.filter((r) => r.flags.length).length}**.`, "");
  L.push("Las alertas son heurísticas (buscan palabras en el texto del caso). Una alerta no significa que el efecto esté mal; significa que el texto no muestra la causa y conviene revisarlo en la reescritura editorial.", "");
  L.push("## 1 · Alertas por tipo y empresa", "");
  L.push("| Alerta | Qué revisa | " + COMPANIES.map((c) => c.id).join(" | ") + " | Total |");
  L.push("|---|---|" + COMPANIES.map(() => "---:").join("|") + "|---:|");
  for (const code of codes) {
    const n = (co?: string) => rows.filter((r) => (!co || r.company === co) && r.flags.some((f) => f.code === code)).length;
    L.push(`| \`${code}\` | ${desc[code] ?? ""} | ${COMPANIES.map((c) => n(c.id)).join(" | ")} | ${n()} |`);
  }
  L.push("", "## 2 · Detalle (asuntos fijos)", "");
  for (const co of COMPANIES) {
    const rs = rows.filter((r) => r.company === co.id && r.origin === "fijo" && r.flags.length);
    if (!rs.length) continue;
    L.push(`### ${co.name}`, "", "| Asunto / opción | Efectos | Alertas |", "|---|---|---|");
    for (const r of rs) L.push(`| ${r.item} / ${r.option} | ${KPI_KEYS.filter((k) => r.effects[k]).map((k) => `${k} ${(r.effects[k] ?? 0) > 0 ? "+" : ""}${r.effects[k]}`).join(", ")} | ${r.flags.map((f) => f.code).join(", ")} |`);
    L.push("");
  }
  const bank = rows.filter((r) => r.origin === "banco" && r.flags.length);
  L.push("## 3 · Banco de casos", "", `${bank.length} caminos del banco con alerta. El detalle completo está en \`inventario-efectos.csv\`.`, "");
  writeFileSync(join(DIR, "inventario-efectos.md"), L.join("\n") + "\n");
}, 600_000);

