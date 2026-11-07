/**
 * Auditoría del sistema de efectos (fase C · diagnóstico). Solo genera reportes; no cambia partidas, XP ni veredicto.
 *
 *  AUD_SIM=1    → docs/auditoria-efectos/simulacion-4-variantes.{json,md}
 *  AUD_REUSE=1  → docs/auditoria-efectos/reutilizacion.{json,md}
 *  AUD_PRIO=1   → docs/auditoria-efectos/prioridades.{csv,md}
 *
 * Las variantes intermedias (V8 sin etapa, V8 sin caja desde margen) se registran SOLO dentro de esta prueba con
 * números de versión altos (97, 98) y se borran al terminar: nunca existen en la app.
 */
import { afterAll, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COMPANIES } from "./companies";
import { bankItems } from "./cases/bank";
import { ARCHETYPES } from "./cases/archetypes";
import { itemAtVersion } from "./versioned";
import { KPI_KEYS, verdictOf } from "./engine";
import { RULESETS, type RuleSet } from "./rules";
import { playCareer, STRATEGIES, HOLDOUT } from "./season-sim";
import { timeline } from "./season-report";
import { SEASON_OBJECTIVES } from "./objectives";
import { isRedLine } from "./editorial";
import type { Item, KpiKey, Kpis, Option } from "./types";

const DIR = join(process.cwd(), "..", "docs", "auditoria-efectos");
const V8 = RULESETS[8];
const NO_TIER = 97, NO_CASHFLOW = 98;
const VARIANTS: { v: number; id: string; label: string }[] = [
  { v: 8, id: "v8", label: "V8 original" },
  { v: NO_TIER, id: "v8_sin_etapa", label: "V8 sin multiplicador por etapa" },
  { v: NO_CASHFLOW, id: "v8_sin_caja_margen", label: "V8 sin caja derivada del margen" },
  { v: 9, id: "v9", label: "V9 (ambos cambios)" },
];
function register() {
  RULESETS[NO_TIER] = Object.freeze({ ...V8, version: NO_TIER, tier: Object.freeze({ ...V8.tier, hitPerTier: 0, gainPerTier: 0 }) }) as RuleSet;
  RULESETS[NO_CASHFLOW] = Object.freeze({ ...V8, version: NO_CASHFLOW, v5: Object.freeze({ ...V8.v5!, cashFlow: Object.freeze({ perPoints: 2, min: 0, max: 0, base: 0 }) }) }) as RuleSet;
}
afterAll(() => { delete RULESETS[NO_TIER]; delete RULESETS[NO_CASHFLOW]; });

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
const vec = (e: Partial<Kpis>) => KPI_KEYS.map((k) => e[k] ?? 0).join(",");
const net = (e: Partial<Kpis>) => KPI_KEYS.reduce((a, k) => a + (e[k] ?? 0), 0);
const nz = (e: Partial<Kpis>) => KPI_KEYS.filter((k) => (e[k] ?? 0) !== 0);
const fmtEff = (e: Partial<Kpis>) => nz(e).map((k) => `${k} ${(e[k] ?? 0) > 0 ? "+" : ""}${e[k]}`).join(", ") || "sin efecto";

// ───────────────────────────────────────────── 1 · simulación de cuatro variantes
const MONTHS = 5;
const STRATS = ["director_equilibrado", "criterio_y_tablero", "criterio_contextual", "mejor_score", "mejor_efecto", "azar", "cuida_caja", "personas_primero", "criterio_con_errores", "criterio_ocupado", "etica_flexible"];

interface MonthRec {
  variant: string; company: string; strategy: string; rep: number; month: number; tier: number; passed: boolean;
  reasons: string[]; kpis: Kpis; health: number; judgment: number; cashFlow: number;
  /** Indicadores debajo de su umbral en ese cierre (para atribuir la causa al indicador). */
  failedKpis: KpiKey[];
}

it.runIf(process.env.AUD_SIM === "1")("simulación de cuatro variantes con causas exactas de reprobación", () => {
  register();
  const recs: MonthRec[] = [];
  for (const { v, id } of VARIANTS) for (const co of COMPANIES) for (const name of STRATS) {
    const reps = Math.min(STRATEGIES[name].reps, 3);
    for (let r = 0; r < reps; r++) {
      const c = playCareer(co.id, name, MONTHS, `audC|${r}`, v);
      c.months.forEach((m, i) => {
        const vd = verdictOf(m.state, m.at);
        const v5 = vd.v5!;
        const line = vd.passLine;
        const failed = new Set<KpiKey>();
        if (v5.reasons.includes("insolvencia")) failed.add("caja");
        if (v5.reasons.includes("consejo_perdido")) failed.add("consejo");
        for (const o of v5.objectives) if (!o.ok) failed.add(o.kpi);
        for (const k of KPI_KEYS) if (vd.kpis[k] < v5.floor) failed.add(k);
        const cf = timeline(m.state, m.at).events.filter((e) => e.kind === "flujo").reduce((a, e) => a + (e.after.caja - e.before.caja), 0);
        recs.push({ variant: id, company: co.id, strategy: name, rep: r, month: i + 1, tier: m.state.tier, passed: vd.passed, reasons: v5.reasons, kpis: vd.kpis, health: vd.health, judgment: Math.round(v5.judgment.ratio * 100), cashFlow: cf, failedKpis: [...failed] });
        void line;
      });
    }
  }
  mkdirSync(DIR, { recursive: true });
  writeFileSync(join(DIR, "simulacion-4-variantes.json"), JSON.stringify({ months: MONTHS, strategies: STRATS, variants: VARIANTS, recs }, null, 0));

  const by = (f: (r: MonthRec) => boolean) => recs.filter(f);
  const passRate = (rs: MonthRec[]) => pct(rs.filter((r) => r.passed).length, rs.length);
  const L: string[] = [];
  const REASON: Record<string, string> = { insolvencia: "Insolvencia (caja < 40)", consejo_perdido: "Consejo perdido (< 40)", linea_roja: "Línea roja", objetivo: "Objetivo del consejo bajo la línea", piso: "Indicador bajo el piso (40)", salud: "Salud < 58", criterio: "Criterio < 60 %" };
  L.push("# Simulación de cuatro variantes · causas exactas de reprobación", "");
  L.push(`Generado con \`AUD_SIM=1 npx vitest run src/lib/ceo/auditoria-efectos.test.ts\`. Carrera continua de ${MONTHS} meses por empresa, ${STRATS.length} estrategias, semillas fijas. Las mismas decisiones se juegan en las cuatro variantes. Ninguna variante está activa en la app.`, "");
  L.push("Variantes: " + VARIANTS.map((x) => `**${x.label}**`).join(" · ") + ".", "");
  L.push(`Meses simulados por variante: ${by((r) => r.variant === "v8").length}.`, "");

  L.push("## 1 · % de meses aprobados por variante y empresa (todas las estrategias)", "");
  L.push("| Variante | " + COMPANIES.map((c) => c.id).join(" | ") + " | Total |");
  L.push("|---|" + COMPANIES.map(() => "---:").join("|") + "|---:|");
  for (const x of VARIANTS) L.push(`| ${x.label} | ${COMPANIES.map((c) => passRate(by((r) => r.variant === x.id && r.company === c.id))).join(" | ")} | ${passRate(by((r) => r.variant === x.id))} |`);

  L.push("", "## 2 · % de meses aprobados por estrategia", "");
  L.push("| Estrategia | Control | " + VARIANTS.map((x) => x.label).join(" | ") + " |");
  L.push("|---|---|" + VARIANTS.map(() => "---:").join("|") + "|");
  for (const s of STRATS) L.push(`| ${STRATEGIES[s].label} | ${(HOLDOUT as readonly string[]).includes(s) ? "sí" : ""} | ${VARIANTS.map((x) => passRate(by((r) => r.variant === x.id && r.strategy === s))).join(" | ")} |`);

  L.push("", "## 3 · Causas de reprobación (un mes puede tener varias) · % de meses reprobados que la presentan", "");
  L.push("| Causa | " + VARIANTS.map((x) => x.label).join(" | ") + " |");
  L.push("|---|" + VARIANTS.map(() => "---:").join("|") + "|");
  for (const reason of Object.keys(REASON)) L.push(`| ${REASON[reason]} | ${VARIANTS.map((x) => { const f = by((r) => r.variant === x.id && !r.passed); return `${pct(f.filter((r) => r.reasons.includes(reason)).length, f.length)} (${f.filter((r) => r.reasons.includes(reason)).length})`; }).join(" | ")} |`);

  L.push("", "## 4 · Indicador que provoca la reprobación (meses reprobados por negocio)", "");
  L.push("Atribución: caja bajo 40, consejo bajo 40, objetivo del consejo bajo la línea o cualquier indicador bajo el piso. Si un mes reprueba solo por salud o criterio, no se atribuye a un indicador.", "");
  L.push("| Variante | " + KPI_KEYS.join(" | ") + " | Solo salud/criterio |");
  L.push("|---|" + KPI_KEYS.map(() => "---:").join("|") + "|---:|");
  for (const x of VARIANTS) { const f = by((r) => r.variant === x.id && !r.passed); L.push(`| ${x.label} | ${KPI_KEYS.map((k) => f.filter((r) => r.failedKpis.includes(k)).length).join(" | ")} | ${f.filter((r) => !r.failedKpis.length).length} |`); }

  L.push("", "## 5 · Por empresa y mes · % aprobado (V8 → V8 sin etapa → V8 sin caja-margen → V9)", "");
  L.push("| Empresa | " + Array.from({ length: MONTHS }, (_, i) => `Mes ${i + 1}`).join(" | ") + " |");
  L.push("|---|" + Array.from({ length: MONTHS }, () => "---").join("|") + "|");
  for (const c of COMPANIES) L.push(`| ${c.id} | ${Array.from({ length: MONTHS }, (_, i) => VARIANTS.map((x) => passRate(by((r) => r.variant === x.id && r.company === c.id && r.month === i + 1))).join(" / ")).join(" | ")} |`);

  L.push("", "## 6 · Causa principal por empresa y variante (meses reprobados)", "");
  L.push("| Empresa | " + VARIANTS.map((x) => x.label).join(" | ") + " |");
  L.push("|---|" + VARIANTS.map(() => "---").join("|") + "|");
  for (const c of COMPANIES) L.push(`| ${c.id} | ${VARIANTS.map((x) => { const f = by((r) => r.variant === x.id && r.company === c.id && !r.passed); if (!f.length) return "—"; const cnt = Object.keys(REASON).map((k) => [k, f.filter((r) => r.reasons.includes(k)).length] as const).filter(([, n]) => n).sort((a, b) => b[1] - a[1]).slice(0, 2); return cnt.map(([k, n]) => `${REASON[k]} ${pct(n, f.length)} %`).join("; "); }).join(" | ")} |`);

  L.push("", "## 7 · Efecto aislado de cada cambio (mismas decisiones, mismo mes)", "");
  L.push("Para cada mes que aprueba en V8 y reprueba en otra variante (o al revés), qué causa nueva aparece.", "");
  const key = (r: MonthRec) => `${r.company}|${r.strategy}|${r.rep}|${r.month}`;
  const base = new Map(by((r) => r.variant === "v8").map((r) => [key(r), r]));
  L.push("| Variante | Meses que pierde | Meses que gana | Causas nuevas en los que pierde |", "|---|---:|---:|---|");
  for (const x of VARIANTS.slice(1)) {
    const rs = by((r) => r.variant === x.id);
    const lost = rs.filter((r) => base.get(key(r))?.passed && !r.passed);
    const won = rs.filter((r) => base.get(key(r)) && !base.get(key(r))!.passed && r.passed);
    const causes = Object.keys(REASON).map((k) => [k, lost.filter((r) => r.reasons.includes(k)).length] as const).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
    L.push(`| ${x.label} | ${lost.length} | ${won.length} | ${causes.map(([k, n]) => `${REASON[k]} (${n})`).join("; ") || "—"} |`);
  }
  L.push("", "Nota: a partir del mes 2 las trayectorias pueden separarse (si un mes reprueba, la empresa no cambia de etapa y la exigencia del mes siguiente es otra). Por eso la tabla 7 compara mes a mes y la tabla 5 muestra la evolución.", "");

  L.push("## 8 · Caja y salud promedio al cierre", "", "| Variante | Caja | Margen | Salud | Caja que sumó el margen al cierre | Etapa promedio |", "|---|---:|---:|---:|---:|---:|");
  for (const x of VARIANTS) { const rs = by((r) => r.variant === x.id); L.push(`| ${x.label} | ${avg(rs.map((r) => r.kpis.caja))} | ${avg(rs.map((r) => r.kpis.margen))} | ${avg(rs.map((r) => r.health))} | ${avg(rs.map((r) => r.cashFlow))} | ${avg(rs.map((r) => r.tier))} |`); }

  L.push("", "## 9 · Detalle de los meses reprobados con buen criterio (V9)", "", "Estrategias con criterio ≥ 60 % que reprueban en V9: dónde exactamente.", "", "| Empresa | Estrategia | Mes | Etapa | Causas | Caja | Margen | Equipo | Clientes | Consejo |", "|---|---|---:|---:|---|---:|---:|---:|---:|---:|");
  for (const r of by((r) => r.variant === "v9" && !r.passed && r.judgment >= 60 && r.rep === 0).slice(0, 60)) L.push(`| ${r.company} | ${r.strategy} | ${r.month} | ${r.tier} | ${r.reasons.map((k) => REASON[k]).join("; ")} | ${KPI_KEYS.map((k) => r.kpis[k]).join(" | ")} |`);
  writeFileSync(join(DIR, "simulacion-4-variantes.md"), L.join("\n") + "\n");
}, 3_000_000);

// ───────────────────────────────────────────── 2 · reutilización de vectores entre industrias
it.runIf(process.env.AUD_REUSE === "1")("reutilización de impactos entre industrias", () => {
  const P = Object.fromEntries(COMPANIES.map((c) => [c.id, c]));
  const L: string[] = [];
  L.push("# Reutilización de impactos entre industrias", "");
  L.push("Generado con `AUD_REUSE=1 npx vitest run src/lib/ceo/auditoria-efectos.test.ts`.", "");

  // A. asuntos fijos: mismo vector en varias empresas
  const fixed: { co: string; item: Item; o: Option }[] = [];
  for (const co of COMPANIES) for (const raw of co.items) { const it = itemAtVersion(raw, 8); for (const o of it.options) fixed.push({ co: co.id, item: it, o }); }
  const groups = new Map<string, typeof fixed>();
  for (const f of fixed) { const k = vec(f.o.effects); if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(f); }
  const shared = [...groups].filter(([k, g]) => k !== "0,0,0,0,0" && new Set(g.map((x) => x.co)).size >= 2);
  const sharedOpts = shared.reduce((a, [, g]) => a + g.length, 0);
  const four = shared.filter(([, g]) => ["forja", "kubit", "puntomadero", "vertice"].every((c) => g.some((x) => x.co === c)));
  L.push("## 1 · Asuntos fijos de cada empresa", "");
  L.push(`Opciones revisadas: **${fixed.length}**. Vectores distintos: **${groups.size}**. Vectores que aparecen idénticos en dos o más empresas: **${shared.length}**, que cubren **${sharedOpts}** opciones (${pct(sharedOpts, fixed.length)} %).`, "");
  L.push(`Vectores idénticos en Forja, Kúbit, Punto Madero y Vértice a la vez: **${four.length}**.`, "");
  L.push("| Empresa | Opciones | Con vector compartido con otra empresa | % |", "|---|---:|---:|---:|");
  for (const co of COMPANIES) { const mine = fixed.filter((f) => f.co === co.id); const s = mine.filter((f) => new Set(groups.get(vec(f.o.effects))!.map((x) => x.co)).size >= 2 && vec(f.o.effects) !== "0,0,0,0,0"); L.push(`| ${co.name} | ${mine.length} | ${s.length} | ${pct(s.length, mine.length)} |`); }

  // misma posición en la plantilla
  L.push("", "### Plantilla común", "");
  L.push("Forja, Kúbit, Punto Madero y Vértice comparten la misma estructura de semana (carta del consejo, cliente grande que pide condiciones, fuga de talento, demanda, denuncia, consejo de cierre…). En la misma posición de la semana, la opción equivalente tiene el mismo vector en esta proporción:", "");
  L.push("| Empresa | Opciones en posición equivalente a Forja | Mismo vector | % |", "|---|---:|---:|---:|");
  const sig = (it: Item) => `${it.day}|${it.slot}|${!!it.trigger}`;
  for (const id of ["kubit", "puntomadero", "vertice", "brasa", "cumbre"]) {
    let tot = 0, same = 0;
    for (const raw of P[id].items) { const it = itemAtVersion(raw, 8); const r0 = P.forja.items.find((x) => sig(x) === sig(it)); if (!r0) continue; const r = itemAtVersion(r0, 8); it.options.forEach((o) => { tot++; if (r.options.some((ro) => ro.text.split(" ")[0] === o.text.split(" ")[0] && vec(ro.effects) === vec(o.effects))) same++; }); }
    L.push(`| ${P[id].name} | ${tot} | ${same} | ${pct(same, tot)} |`);
  }

  L.push("", "### Los vectores más repetidos y si encajan con la economía de cada industria", "");
  for (const [k, g] of four.slice(0, 8)) {
    L.push(`#### Vector caja/margen/equipo/clientes/consejo = (${k})`, "");
    L.push("| Empresa | Asunto | Opción | Resultado que ve el jugador |", "|---|---|---|---|");
    for (const x of g.filter((x) => ["forja", "kubit", "puntomadero", "vertice", "brasa", "cumbre"].includes(x.co)).slice(0, 6)) L.push(`| ${x.co} | ${x.item.subject.replace(/\|/g, "/")} | ${x.o.text.replace(/\|/g, "/").slice(0, 110)} | ${x.o.outcome.replace(/\|/g, "/").slice(0, 160)} |`);
    L.push("");
  }

  // B. banco: por construcción, el arquetipo fija el vector
  L.push("## 2 · Banco de casos (84 por empresa)", "");
  const totalBank = COMPANIES.reduce((a, c) => a + bankItems(c).length, 0);
  L.push(`El banco arma ${ARCHETYPES.length} arquetipos × 3 giros = 84 casos por empresa (${totalBank} en total). El texto cambia por industria (cliente, lote, afectado, cifras de la tabla), pero **los efectos salen del arquetipo** (\`effects: { ...o.effects }\` en \`buildCase\`): el mismo arquetipo tiene exactamente los mismos números en las seis industrias y en sus tres giros.`, "");
  let sameAll = 0;
  for (const a of ARCHETYPES) { const per = COMPANIES.map((c) => bankItems(c).filter((i) => i.id.includes(`-${a.id}-`)).map((i) => i.options.map((o) => vec(o.effects)).sort().join(";")).join("|")); if (new Set(per).size === 1) sameAll++; }
  L.push(`Arquetipos con efectos idénticos en las seis industrias: **${sameAll} de ${ARCHETYPES.length}**.`, "");
  L.push("Esto significa que, por ejemplo, un retiro de producto cuesta lo mismo en caja a una botanera, a un software, a una tienda de materiales y a un transportista; y un mismo giro del caso (que en la historia puede cambiar mucho la gravedad) no cambia los números.", "");
  L.push("### Ejemplo: un mismo arquetipo en las seis industrias", "");
  const a0 = ARCHETYPES[0];
  L.push(`Arquetipo \`${a0.id}\`, giro 1:`, "", "| Empresa | Asunto | Dato clave de la tabla | Opción A (efectos) |", "|---|---|---|---|");
  for (const c of COMPANIES) { const it = bankItems(c).find((i) => i.id.endsWith(`-${a0.id}-1`)); if (!it) continue; const o = it.options.find((x) => x.id === "a")!; L.push(`| ${c.id} | ${it.subject.replace(/\|/g, "/")} | ${(it.data?.rows?.[0] ?? []).join(": ").replace(/\|/g, "/")} | ${fmtEff(o.effects)} |`); }

  L.push("", "## 3 · Conclusión", "");
  L.push("El reuso no es en sí un error: dos empresas pueden enfrentar el mismo tipo de decisión. El problema es que el número no depende de los hechos de cada industria (tamaño del cliente, margen típico, capital de trabajo, ciclo de cobro). Un descuento de 5 % a tu cliente principal no pesa lo mismo en un SaaS con 80 % de margen bruto que en una autopartera con 18 %. La propuesta del modelo económico resuelve esto calculando el impacto desde hechos con unidades y anclas por industria, en lugar de un vector fijo por plantilla.", "");
  mkdirSync(DIR, { recursive: true });
  writeFileSync(join(DIR, "reutilizacion.md"), L.join("\n") + "\n");
  writeFileSync(join(DIR, "reutilizacion.json"), JSON.stringify({ fixedOptions: fixed.length, distinct: groups.size, shared: shared.length, sharedOptions: sharedOpts, fourWay: four.length, archetypes: ARCHETYPES.length, archetypesIdenticalAcrossIndustries: sameAll }, null, 1));
});

// ───────────────────────────────────────────── 3 · prioridades de la auditoría editorial
const MONEY = /(\$|peso|dinero|cost|pag|cobr|gast|invers|precio|presupuesto|factur|descuent|ahorr|sueldo|bono|nómina|crédito|deuda|préstamo|multa|penaliz|liquidaci|indemniz|compra|venta|vend|contrat|flete|merma|insumo|inventario|capital|ronda|caja|margen|rentab|reembols|garant|fianza|honorario|tarifa|cotiza|licencia|seguro|renta|\bM\b)/i;
const BOARD = /(consejo|consejer|accionist|inversionist|board|junta|socio|comité|auditor|serie [abc]|fondo|chairman|presidenta del consejo|presidente del consejo)/i;

it.runIf(process.env.AUD_PRIO === "1")("prioridades de la auditoría editorial", () => {
  type Row = { company: string; item: string; origin: string; option: string; text: string; outcome: string; effects: Partial<Kpis>; score: number | ""; pending: boolean; red: boolean; points: number; why: string[]; tier: "P1" | "P2" | "P3" | "OK" };
  const rows: Row[] = [];
  const seenBank = new Set<string>();
  for (const co of COMPANIES) {
    const list: [Item, string][] = [...co.items.map((x) => [x, "fijo"] as [Item, string]), ...bankItems(co).map((x) => [x, "banco"] as [Item, string])];
    for (const [raw, origin] of list) {
      const it = itemAtVersion(raw, 8);
      const ctx = [it.subject, it.preview, ...(it.body ?? []), it.ask, ...(it.data?.rows ?? []).flat()].join(" ");
      const paths: { id: string; text: string; outcome: string; eff: Partial<Kpis>; o?: Option }[] = [
        ...it.options.map((o) => ({ id: o.id, text: o.text, outcome: o.outcome, eff: o.effects, o })),
        { id: "(vencido)", text: "Dejar vencer", outcome: it.expired.outcome + " " + it.expired.reply.join(" "), eff: it.expired.effects },
      ];
      for (const p of paths) {
        const all = `${ctx} ${p.text} ${p.outcome} ${(p.o?.reply ?? []).join(" ")}`;
        const own = `${p.text} ${p.outcome} ${(p.o?.reply ?? []).join(" ")}`;
        const ks = nz(p.eff);
        const why: string[] = [];
        let pts = 0;
        if (ks.length >= 4) { why.push(`${ks.length} indicadores a la vez`); pts += ks.length === 5 ? 3 : 2; }
        if ((p.eff.consejo ?? 0) !== 0 && !BOARD.test(all)) { why.push("Consejo sin evento de gobernanza en el caso"); pts += 3; }
        else if ((p.eff.consejo ?? 0) !== 0 && !BOARD.test(own)) { why.push("Consejo: el caso lo menciona pero esta opción no le informa ni le afecta"); pts += 1; }
        if (p.id === "(vencido)" && (p.eff.consejo ?? 0) < 0 && !BOARD.test(own)) { why.push("Vencimiento castiga Consejo sin que el consejo se entere"); pts += 2; }
        if (p.id === "(vencido)" && net(p.eff) <= -10) { why.push(`Vencimiento muy severo (neto ${net(p.eff)})`); pts += 1; }
        if (((p.eff.caja ?? 0) !== 0 || (p.eff.margen ?? 0) !== 0) && !MONEY.test(all)) { why.push("Caja/Margen sin hecho económico en el caso"); pts += 3; }
        else if (((p.eff.caja ?? 0) !== 0 || (p.eff.margen ?? 0) !== 0) && !MONEY.test(own)) { why.push("Caja/Margen: hay contexto económico, pero la opción no dice qué se paga o cobra"); pts += 1; }
        if ((p.eff.caja ?? 0) !== 0 && (p.eff.margen ?? 0) !== 0 && Math.sign(p.eff.caja!) === Math.sign(p.eff.margen!)) { why.push("Caja y Margen en el mismo sentido: confirmar que son dos hechos"); pts += 1; }
        if (p.o?.pending && ((p.o.effects.margen ?? 0) > 0 || (p.o.effects.caja ?? 0) > 0)) { why.push("Cobra al decidir un beneficio que depende de respuesta"); pts += 3; }
        if (ks.some((k) => Math.abs(p.eff[k] ?? 0) >= 8)) { why.push("Movimiento ≥ 8 puntos: revisar materialidad"); pts += 1; }
        if (/promet|propon|ofrec|plan |anunci|explor|evaluar|analiz/i.test(p.text) && ((p.eff.margen ?? 0) > 0 || (p.eff.caja ?? 0) > 0) && !p.o?.pending) { why.push("Promesa o plan que suma dinero de inmediato"); pts += 2; }
        const tier = pts >= 5 ? "P1" : pts >= 3 ? "P2" : pts >= 1 ? "P3" : "OK";
        rows.push({ company: co.id, item: it.id, origin, option: p.id, text: p.text, outcome: p.outcome, effects: p.eff, score: p.o?.score ?? "", pending: !!p.o?.pending, red: !!p.o && isRedLine(it.id, p.o.id, 8), points: pts, why, tier });
      }
      if (origin === "banco") seenBank.add(it.id);
    }
  }
  mkdirSync(DIR, { recursive: true });
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const csv = ["prioridad,puntos,empresa,asunto,origen,opcion,score,linea_roja," + KPI_KEYS.join(",") + ",motivos,texto,resultado"];
  for (const r of [...rows].sort((a, b) => b.points - a.points)) csv.push([r.tier, r.points, r.company, r.item, r.origin, r.option, r.score, r.red ? "si" : "", ...KPI_KEYS.map((k) => r.effects[k] ?? 0), esc(r.why.join(" · ")), esc(r.text), esc(r.outcome)].join(","));
  writeFileSync(join(DIR, "prioridades.csv"), csv.join("\n") + "\n");

  const L: string[] = [];
  const n = (f: (r: Row) => boolean) => rows.filter(f).length;
  L.push("# Prioridades de la auditoría editorial de efectos", "");
  L.push("Generado con `AUD_PRIO=1 npx vitest run src/lib/ceo/auditoria-efectos.test.ts`. **No elimina ni cambia ningún efecto.** Ordena los caminos para que la revisión editorial empiece por los más problemáticos. Cada camino se valida a mano antes de proponer cambios.", "");
  L.push(`Caminos: **${rows.length}** (${n((r) => r.option !== "(vencido)")} opciones y ${n((r) => r.option === "(vencido)")} vencimientos). Fijos: ${n((r) => r.origin === "fijo")}; banco: ${n((r) => r.origin === "banco")}.`, "");
  L.push("Puntaje: 5 indicadores = 3, 4 indicadores = 2, Consejo sin evento = 3, Caja/Margen sin hecho = 3, beneficio pendiente cobrado = 3, vencimiento que castiga Consejo sin que se entere = 2, promesa que suma dinero = 2; señales menores = 1. **P1 ≥ 5**, **P2 3–4**, **P3 1–2**.", "");
  L.push("| Prioridad | " + COMPANIES.map((c) => c.id).join(" | ") + " | Total | Fijos | Banco |", "|---|" + COMPANIES.map(() => "---:").join("|") + "|---:|---:|---:|");
  for (const t of ["P1", "P2", "P3", "OK"] as const) L.push(`| ${t} | ${COMPANIES.map((c) => n((r) => r.tier === t && r.company === c.id)).join(" | ")} | ${n((r) => r.tier === t)} | ${n((r) => r.tier === t && r.origin === "fijo")} | ${n((r) => r.tier === t && r.origin === "banco")} |`);
  L.push("", "Como el banco reutiliza el mismo arquetipo en las seis industrias, corregir un arquetipo corrige 18 caminos a la vez (6 industrias × 3 giros). Por eso el banco se revisa por arquetipo, no caso por caso:", "");
  const arch = new Map<string, Row[]>();
  for (const r of rows.filter((r) => r.origin === "banco")) { const a = ARCHETYPES.find((x) => r.item.includes(`-${x.id}-`))?.id ?? "?"; if (!arch.has(a)) arch.set(a, []); arch.get(a)!.push(r); }
  L.push("| Arquetipo | Caminos | P1 | P2 | Motivo más frecuente |", "|---|---:|---:|---:|---|");
  for (const [a, rs] of [...arch].sort((x, y) => y[1].filter((r) => r.tier === "P1").length - x[1].filter((r) => r.tier === "P1").length)) {
    const reasons = new Map<string, number>(); for (const r of rs) for (const w of r.why) reasons.set(w.replace(/\d+ indicadores/, "N indicadores").replace(/neto -?\d+/, "neto"), (reasons.get(w) ?? 0) + 1);
    const top = [...reasons].sort((x, y) => y[1] - x[1])[0];
    L.push(`| ${a} | ${rs.length} | ${rs.filter((r) => r.tier === "P1").length} | ${rs.filter((r) => r.tier === "P2").length} | ${top ? `${top[0]} (${top[1]})` : "—"} |`);
  }
  L.push("", "## Motivos (todas las empresas)", "", "| Motivo | Caminos |", "|---|---:|");
  const reasons = new Map<string, number>(); for (const r of rows) for (const w of r.why) { const k = w.replace(/\d+ indicadores/, "N indicadores").replace(/\(neto -?\d+\)/, ""); reasons.set(k, (reasons.get(k) ?? 0) + 1); }
  for (const [k, v] of [...reasons].sort((a, b) => b[1] - a[1])) L.push(`| ${k} | ${v} |`);
  L.push("", "## P1 de asuntos fijos por empresa (los diez de más puntaje)", "");
  for (const c of COMPANIES) {
    const rs = rows.filter((r) => r.company === c.id && r.origin === "fijo" && r.tier === "P1").sort((a, b) => b.points - a.points).slice(0, 10);
    L.push(`### ${c.name} (${rows.filter((r) => r.company === c.id && r.origin === "fijo" && r.tier === "P1").length} P1 fijos)`, "", "| Asunto / camino | Efectos | Motivos |", "|---|---|---|");
    for (const r of rs) L.push(`| ${r.item} / ${r.option} | ${fmtEff(r.effects)} | ${r.why.join(" · ")} |`);
    L.push("");
  }
  writeFileSync(join(DIR, "prioridades.md"), L.join("\n") + "\n");
  void SEASON_OBJECTIVES; void seenBank;
}, 600_000);
