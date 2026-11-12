/**
 * MÊTIS 2.0 · Cobertura del contenido existente (entrega 1.2).
 *
 * Junta cada pieza del simulador con su etiqueta (`clasificacion.ts`) y mide cuánto del programa nuevo queda cubierto:
 * por academia y nivel, por habilidad y por casilla del currículo (habilidad en un nivel).
 *
 * Carga todo el contenido del simulador, así que solo se usa en pruebas y para generar el documento
 * `docs/metis2/03-clasificacion.md`. Las pantallas usan `clasificacion.ts`, que no carga nada.
 */
import { LESSONS } from "../lessons";
import { CONCEPTS } from "../concepts";
import { ALL_DILEMMAS } from "../dilemmas";
import { COMPANIES } from "../companies";
import { ARCHETYPES } from "../cases/archetypes";
import { CONTEXTS } from "../cases/contexts";
import { EPISODES } from "../episodes/catalog";
import { GROWTH_CASES } from "../growth/cases";
import { STEPS as CRISIS_STEPS } from "../crisis";
import { LEVERS } from "../change";
import { DIAGNOSTIC } from "../profile";
import { ACADEMIES, DEMANDS, SKILLS, TRAMOS, academyById, formatById, skillById, skillsOf, type AcademyId, type Demand } from "./academias";
import { CLASSIFICATION_VERSION, CONTENT_KINDS, givesEvidence, kindById, tagOf, type ContentKind, type Tag } from "./clasificacion";

/** Una pieza del simulador con su etiqueta. `tag` falta solo si alguien agregó contenido sin clasificarlo. */
export interface Piece { kind: ContentKind; id: string; title: string; tag?: Tag }

/** Identificador de la única pieza que representa al simulador de cambio (sus nueve palancas van juntas). */
export const CHANGE_EXERCISE_ID = "cambio";

/** Todas las piezas que se clasifican, en el orden de `CONTENT_KINDS`. Los dilemas van una vez por situación. */
export function pieces(): Piece[] {
  const out: Piece[] = [];
  const add = (kind: ContentKind, id: string, title: string) => out.push({ kind, id, title, tag: tagOf(kind, id) });
  for (const l of LESSONS) add("leccion", l.id, l.title);
  for (const c of Object.values(CONCEPTS)) add("concepto", c.id, c.name);
  for (const d of DIAGNOSTIC) add("diagnostico", d.id, d.title);
  for (const d of ALL_DILEMMAS) if (!d.replaces) add("dilema", d.id, d.who);
  for (const c of COMPANIES) for (const i of c.items) add("caso", `${c.id}:${i.id}`, `${c.name} · ${i.bitacora.title}`);
  for (const a of ARCHETYPES) add("banco", a.id, a.title);
  for (const e of Object.values(EPISODES)) add("episodio", e.id, e.title);
  add("palanca", CHANGE_EXERCISE_ID, `Simulador de cambio (${LEVERS.length} palancas)`);
  for (const g of GROWTH_CASES) add("crecimiento", g.id, g.subject);
  for (const s of CRISIS_STEPS) add("crisis", s.id, s.title);
  return out;
}

type Grid = Record<AcademyId, Record<Demand, number>>;
const emptyGrid = (): Grid => Object.fromEntries(ACADEMIES.map((a) => [a.id, Object.fromEntries(DEMANDS.map((d) => [d, 0]))])) as Grid;

export interface SkillCoverage {
  /** Actividades evaluables donde es la habilidad principal. */
  main: number;
  /** Actividades evaluables donde aparece, como principal o no. */
  any: number;
  /** Lecciones y conceptos que la explican. */
  theory: number;
  /** Niveles en los que hay al menos una actividad evaluable que la trabaja. */
  levels: Demand[];
}

export interface Coverage {
  /** Piezas por tipo y cuántas tienen etiqueta. */
  kinds: { kind: ContentKind; total: number; tagged: number }[];
  /** Actividades evaluables por academia principal y nivel. */
  evaluable: Grid;
  /** Lecciones y conceptos por academia principal y nivel. */
  theory: Grid;
  skills: Record<string, SkillCoverage>;
  /** Casillas del currículo (una habilidad en un nivel en el que se exige) y cuántas tienen al menos una actividad. */
  cells: Record<Demand, { total: number; covered: number }>;
  totals: { evaluable: number; theory: number; cells: number; covered: number };
}

export function coverage(all: Piece[] = pieces()): Coverage {
  const evaluable = emptyGrid();
  const theory = emptyGrid();
  const skills: Record<string, SkillCoverage> = Object.fromEntries(SKILLS.map((s) => [s.id, { main: 0, any: 0, theory: 0, levels: [] }]));
  let nEval = 0;
  let nTheory = 0;
  for (const p of all) {
    if (!p.tag) continue;
    const { tag } = p;
    if (givesEvidence(p.kind)) {
      nEval++;
      evaluable[tag.academy][tag.level]++;
      skills[tag.skills[0]].main++;
      for (const s of tag.skills) {
        skills[s].any++;
        if (!skills[s].levels.includes(tag.level)) skills[s].levels.push(tag.level);
      }
    } else {
      nTheory++;
      theory[tag.academy][tag.level]++;
      for (const s of tag.skills) skills[s].theory++;
    }
  }
  for (const s of Object.values(skills)) s.levels.sort((a, b) => a - b);
  const cells = Object.fromEntries(DEMANDS.map((d) => [d, { total: 0, covered: 0 }])) as Coverage["cells"];
  for (const s of SKILLS) for (const d of DEMANDS) {
    if (d < s.from) continue;
    cells[d].total++;
    if (skills[s.id].levels.includes(d)) cells[d].covered++;
  }
  const kinds = CONTENT_KINDS.map((k) => {
    const mine = all.filter((p) => p.kind === k.id);
    return { kind: k.id, total: mine.length, tagged: mine.filter((p) => p.tag).length };
  });
  return {
    kinds, evaluable, theory, skills, cells,
    totals: { evaluable: nEval, theory: nTheory, cells: DEMANDS.reduce((n, d) => n + cells[d].total, 0), covered: DEMANDS.reduce((n, d) => n + cells[d].covered, 0) },
  };
}

// ───────────────────────────────────────────── documento

const cell = (s: string) => s.replace(/\|/g, "/");
const levelName = (d: Demand) => `${d === 6 ? "6 y siguientes" : d} · ${TRAMOS[d - 1].name}`;
const names = (ids: string[]) => ids.map((id) => skillById(id)!.name);

/** Documento de clasificación y cobertura en Markdown, generado del contenido real. */
export function classificationMarkdown(): string {
  const all = pieces();
  const c = coverage(all);
  const o: string[] = [];
  const industries = Object.keys(CONTEXTS).length;

  o.push("# MÊTIS 2.0 · Clasificación del contenido existente y cobertura", "");
  o.push(`Versión de la clasificación: ${CLASSIFICATION_VERSION}`, "");
  o.push("Este documento se genera del contenido real de la aplicación y de su clasificación (`app/src/lib/ceo/metis2`). No se edita a mano: una prueba automática falla si deja de coincidir.", "");

  o.push("## Qué se hizo", "");
  o.push("Cada pieza del simulador de empresas recibió una etiqueta con el catálogo nuevo: una academia principal, hasta dos academias secundarias, de una a tres habilidades y el nivel de exigencia con el que está escrita. Los identificadores no cambian y nada se borra.", "");
  o.push("El nivel de una pieza es la exigencia que tiene tal como está escrita hoy. No es una decisión de dónde va a quedar en la ruta: eso se define al construir cada nivel.", "");
  o.push("Las lecciones y los conceptos son teoría. Quedan clasificados para saber qué explican, pero no cuentan como evidencia de dominio.", "");

  o.push("## Cómo se clasificó y qué límites tiene", "");
  o.push("La etiqueta de cada pieza se asignó a partir de su título, la pregunta que hace, la lección con la que está ligada y las áreas con las que se escribió. Es un criterio editorial: una prueba automática comprueba que cada etiqueta sea válida y compatible con las áreas originales, pero no puede comprobar que sea la mejor. Conviene revisar una muestra por academia antes de usar estas etiquetas para calcular dominio.", "");
  o.push("Los casos de Kúbit, Punto Madero y Vértice comparten estructura con los de Forja Norte (la misma situación en otra industria), por eso muchas de sus etiquetas coinciden.", "");

  o.push("## Resumen por tipo de pieza", "");
  o.push("| Tipo | Piezas | Clasificadas | Formato en el programa nuevo | Cuenta como evidencia |", "|---|---|---|---|---|");
  for (const k of c.kinds) {
    const def = kindById(k.kind);
    o.push(`| ${def.name} | ${k.total} | ${k.tagged} | ${formatById(def.format).name} | ${givesEvidence(k.kind) ? "Sí" : "No"} |`);
  }
  o.push("", `Total: ${c.totals.evaluable} actividades evaluables y ${c.totals.theory} piezas de teoría.`, "");
  o.push(`Notas: los dilemas se cuentan una vez por situación (cada uno tiene dos redacciones guardadas). Las ${LEVERS.length} palancas forman un solo ejercicio. Cada situación del banco de decisiones está escrita para ${industries} industrias con tres variantes.`, "");

  o.push("## Actividades evaluables por academia y nivel", "");
  o.push("Cada actividad se cuenta en su academia principal.", "");
  o.push(`| Academia | ${DEMANDS.map((d) => `Nivel ${d === 6 ? "6+" : d}`).join(" | ")} | Total |`, `|---|${DEMANDS.map(() => "---").join("|")}|---|`);
  for (const a of ACADEMIES) o.push(`| ${a.name} | ${DEMANDS.map((d) => c.evaluable[a.id][d]).join(" | ")} | ${DEMANDS.reduce((n, d) => n + c.evaluable[a.id][d], 0)} |`);
  o.push(`| **Total** | ${DEMANDS.map((d) => ACADEMIES.reduce((n, a) => n + c.evaluable[a.id][d], 0)).join(" | ")} | ${c.totals.evaluable} |`, "");

  o.push("## Teoría por academia y nivel", "");
  o.push(`| Academia | ${DEMANDS.map((d) => `Nivel ${d === 6 ? "6+" : d}`).join(" | ")} | Total |`, `|---|${DEMANDS.map(() => "---").join("|")}|---|`);
  for (const a of ACADEMIES) o.push(`| ${a.name} | ${DEMANDS.map((d) => c.theory[a.id][d]).join(" | ")} | ${DEMANDS.reduce((n, d) => n + c.theory[a.id][d], 0)} |`);
  o.push(`| **Total** | ${DEMANDS.map((d) => ACADEMIES.reduce((n, a) => n + c.theory[a.id][d], 0)).join(" | ")} | ${c.totals.theory} |`, "");

  o.push("## Cuánto del programa queda cubierto", "");
  o.push(`El currículo tiene ${c.totals.cells} casillas: cada habilidad en cada nivel donde se exige. Una casilla se cuenta como cubierta si existe al menos una actividad evaluable de ese nivel que trabaje esa habilidad. Es una medida mínima: una sola actividad no alcanza para demostrar dominio.`, "");
  o.push("| Nivel | Casillas | Con al menos una actividad | Sin actividad |", "|---|---|---|---|");
  for (const d of DEMANDS) o.push(`| ${levelName(d)} | ${c.cells[d].total} | ${c.cells[d].covered} | ${c.cells[d].total - c.cells[d].covered} |`);
  o.push(`| **Total** | ${c.totals.cells} | ${c.totals.covered} | ${c.totals.cells - c.totals.covered} |`, "");

  const noEval = SKILLS.filter((s) => c.skills[s.id].any === 0).map((s) => s.id);
  const noTheory = SKILLS.filter((s) => c.skills[s.id].theory === 0).map((s) => s.id);
  o.push("## Habilidades por academia", "");
  for (const a of ACADEMIES) {
    o.push(`### ${a.name}`, "");
    o.push("| Habilidad | Se exige desde | Actividades como principal | Actividades donde aparece | Niveles con actividad | Teoría |", "|---|---|---|---|---|---|");
    for (const s of skillsOf(a.id)) {
      const k = c.skills[s.id];
      o.push(`| ${s.name} | Nivel ${s.from} | ${k.main} | ${k.any} | ${k.levels.length ? k.levels.join(", ") : "Ninguno"} | ${k.theory} |`);
    }
    o.push("");
  }
  o.push(`Habilidades sin ninguna actividad evaluable (${noEval.length}): ${noEval.length ? names(noEval).join("; ") : "ninguna"}.`, "");
  o.push(`Habilidades sin teoría (${noTheory.length}): ${noTheory.length ? names(noTheory).join("; ") : "ninguna"}.`, "");

  const perLevel = (d: Demand) => ACADEMIES.reduce((n, a) => n + c.evaluable[a.id][d], 0);
  const perAcademy = ACADEMIES.map((a) => ({ a, n: DEMANDS.reduce((n, d) => n + c.evaluable[a.id][d], 0) })).sort((x, y) => y.n - x.n);
  o.push("## Qué significa", "");
  o.push(`1. El contenido existente vive en los niveles 2, 3 y 4. Hay ${perLevel(1)} actividades de Nivel 1, ${perLevel(5)} de Nivel 5 y ${perLevel(6)} de Nivel 6. Los casos actuales piden decidir con criterio, no reconocer conceptos, y ninguno fue escrito como prueba de transferencia.`);
  o.push(`2. El reparto entre academias es desigual: ${perAcademy.map((x) => `${x.a.name} ${x.n}`).join(", ")}.`);
  o.push(`3. De las ${c.totals.cells} casillas del currículo, ${c.totals.covered} tienen al menos una actividad y ${c.totals.cells - c.totals.covered} no tienen ninguna.`);
  o.push("4. Por eso el programa no se obtiene reclasificando. Hay que construir: las lecciones y ejercicios de fundamentos del Nivel 1 en las seis academias, las actividades de las habilidades que hoy no tienen ninguna, los repasos de transferencia del Nivel 5 y los retos integradores del Nivel 6.");
  o.push(`5. Lo que sí se aprovecha: los casos existentes sirven para los niveles 2 a 4, y el banco de decisiones ya está escrito para ${industries} industrias, lo que da material para los repasos de transferencia sin partir de cero.`, "");

  o.push("## Detalle por tipo", "");
  for (const k of CONTENT_KINDS) {
    const mine = all.filter((p) => p.kind === k.id);
    o.push(`### ${k.name}`, "", k.what, "");
    o.push("| Identificador | Pieza | Academia | Habilidad principal | También trabaja | Nivel |", "|---|---|---|---|---|---|");
    for (const p of mine) {
      if (!p.tag) { o.push(`| \`${p.id}\` | ${cell(p.title)} | Sin clasificar | | | |`); continue; }
      const [first, ...rest] = p.tag.skills;
      const others = rest.map((id) => { const s = skillById(id)!; return s.academy === p.tag!.academy ? s.name : `${s.name} (${academyById(s.academy).short})`; });
      o.push(`| \`${p.id}\` | ${cell(p.title)} | ${academyById(p.tag.academy).short} | ${skillById(first)!.name} | ${others.join("; ")} | ${p.tag.level} |`);
    }
    o.push("");
  }
  return o.join("\n");
}
