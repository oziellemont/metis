/**
 * Documentos para revisión editorial, generados del contenido real (bajo demanda):
 *   CASOS_DOC=1 npx vitest run src/lib/ceo/casos-doc.test.ts
 * Escribe docs/editorial/casos-mantenimiento.md (los 7 de Cumbre) y docs/editorial/cadenas-piloto.md (las 5 cadenas v7).
 * Fuera de ese modo verifica que los documentos publicados estén al día con el contenido.
 */
import { expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { companyById } from "./companies";
import { MANTENIMIENTO } from "./companies/cumbre-mantenimiento";
import { CADENA_FORJA } from "./companies/forja-cadena";
import { CADENA_BRASA } from "./companies/brasa-cadena";
import { CADENA_KUBIT } from "./companies/kubit-cadena";
import { CADENA_PUNTOMADERO } from "./companies/puntomadero-cadena";
import { CADENA_VERTICE } from "./companies/vertice-cadena";
import { CASE_CONCEPTS, CONCEPTS } from "./concepts";
import { isRedLine } from "./editorial";
import type { CompanyPack, Item, Kpis } from "./types";

const DIR = join(__dirname, "../../../../docs/editorial");
const KPI: Record<keyof Kpis, string> = { caja: "Caja", margen: "Margen", clientes: "Clientes", equipo: "Equipo", consejo: "Consejo" };
const fx = (e: Partial<Kpis>) => (Object.keys(e) as (keyof Kpis)[]).filter((k) => e[k]).map((k) => `${KPI[k]} ${e[k]! > 0 ? "+" : ""}${e[k]}`).join(", ") || "sin efecto";
const who = (pk: CompanyPack, id: string) => { const p = pk.cast[id]; return p ? `${p.name} (${p.role})` : id; };

function itemMd(pk: CompanyPack, it: Item, all: Item[]): string {
  const out: string[] = [];
  out.push(`### ${it.subject}`, "");
  out.push(`\`${it.id}\` · día ${it.day} · ${it.channel} · de ${who(pk, it.from)}${it.involves?.length ? ` · involucra a ${it.involves.map((x) => who(pk, x)).join(", ")}` : ""}`, "");
  if (it.trigger) {
    const t = all.find((x) => x.id === it.trigger!.item);
    const opts = it.trigger.options.map((o) => o === "__expired" ? "no responder" : `«${t?.options.find((x) => x.id === o)?.text ?? o}»`).join(" o ");
    out.push(`**Cuándo llega (condición causal verificable):** solo si en «${t?.subject ?? it.trigger.item}» elegiste ${opts}${it.trigger.roll ? ` y el azar del periodo cae en ${Math.round((it.trigger.roll[1] - it.trigger.roll[0]) * 100)} de cada 100 casos (estable: la misma partida da siempre el mismo resultado)` : " (siempre)"}.`, "");
  }
  out.push("**Contexto**", "", ...it.body.map((b) => `> ${b}`), "");
  if (it.data) { out.push(`**${it.data.title}**`, "", "| Dato | Valor |", "|---|---|", ...it.data.rows.map((r) => `| ${r[0]} | ${r[1]} |`), ""); }
  out.push(`**Pregunta:** ${it.ask}`, "");
  out.push("| Opción | Costo y efecto inmediato | Score | Línea roja (v7) |", "|---|---|---|---|");
  for (const o of it.options) out.push(`| **${o.id}.** ${o.text} | ${fx(o.effects)} | ${o.score} | ${isRedLine(it.id, o.id, 7) ? "sí" : "—"} |`);
  out.push(`| *(no responder)* | ${fx(it.expired.effects)} | — | — |`, "");
  out.push("**Qué pasa después de cada opción**", "");
  for (const o of it.options) {
    const next = all.filter((x) => x.trigger?.item === it.id && x.trigger.options.includes(o.id));
    const fut = next.length ? next.map((x) => `llega «${x.subject}»${x.trigger!.roll ? ` (en ${Math.round((x.trigger!.roll[1] - x.trigger!.roll[0]) * 100)} de cada 100)` : ""}`).join("; ") : "no abre otro asunto en esta cadena";
    out.push(`- **${o.id}.** ${o.outcome} *Respuesta:* ${o.reply.join(" / ")} *Consecuencia futura:* ${fut}.`);
  }
  out.push(`- **sin respuesta.** ${it.expired.outcome}`, "");
  const cc = CASE_CONCEPTS[it.id];
  out.push(`**Aprendizaje:** ${it.bitacora.title}. ${it.bitacora.text} *${it.bitacora.nota}*`, "");
  if (cc) out.push(`**Concepto:** ${CONCEPTS[cc.concept]?.name ?? cc.concept}. ${cc.applied}`, "");
  return out.join("\n");
}

function mantenimiento(): string {
  const pk = companyById("cumbre");
  const root = pk.items.find((i) => i.id === "d2-mantenimiento")!;
  const all = MANTENIMIENTO;
  return [
    "# Cadena de mantenimiento de Cumbre: los 7 asuntos completos",
    "",
    "Generado del contenido real (`npx vitest run src/lib/ceo/casos-doc.test.ts` con `CASOS_DOC=1`). Los efectos son los de la empresa establecida antes de escalar por tamaño.",
    "",
    "Decisión raíz: «" + root.subject + "» (día " + root.day + "). Llega en periodos v6 o posteriores. Los 7 asuntos de abajo son esa decisión raíz y sus 6 consecuencias posibles.",
    "",
    "Cambio de este ciclo en el dosificador: ocultar el incumplimiento (opción b) ahora es línea roja desde v7, con score 1 y consecuencias propias; ya no equivale a avisar. La opción transparente con revisión de Sofía (c) tiene score 2.",
    "",
    ...MANTENIMIENTO.map((it) => itemMd(pk, it, all)),
  ].join("\n");
}

function cadenas(): string {
  const sets: [string, Item[]][] = [["forja", CADENA_FORJA], ["brasa", CADENA_BRASA], ["kubit", CADENA_KUBIT], ["puntomadero", CADENA_PUNTOMADERO], ["vertice", CADENA_VERTICE]];
  const out = [
    "# Cadenas piloto de consecuencias (v7): una por empresa",
    "",
    "Generado del contenido real. Cada cadena es una decisión del día 2 con tres caminos: uno con consecuencia segura (día 4) y dos inciertos (días 4 y 5) cuya probabilidad se le dice al jugador desde el día 2. Solo llegan en periodos v7; los periodos v6, v4 y las temporadas no cambian.",
    "",
    "Validación automática por cadena (`cadenas.test.ts`): versión, causalidad (nada llega antes de su detonador y la pantalla lo conecta), caminos distintos, frecuencia real igual a la anunciada, costo y beneficio en cada opción, ninguna dominante, el score no coincide con la que más paga, personajes del elenco de la empresa.",
    "",
  ];
  for (const [id, chain] of sets) {
    const pk = companyById(id);
    out.push(`## ${pk.name}`, "", ...chain.map((it) => itemMd(pk, it, chain)));
  }
  return out.join("\n");
}

const DOCS: [string, () => string][] = [["casos-mantenimiento.md", mantenimiento], ["cadenas-piloto.md", cadenas]];

it("los documentos de casos están al día con el contenido", () => {
  for (const [f, make] of DOCS) {
    const md = make();
    if (process.env.CASOS_DOC === "1") { writeFileSync(join(DIR, f), md + "\n"); continue; }
    const p = join(DIR, f);
    expect(existsSync(p), f).toBe(true);
    expect(readFileSync(p, "utf8"), `${f} desactualizado: correr con CASOS_DOC=1`).toBe(md + "\n");
  }
});
