/**
 * MÊTIS 2.0 · Matriz curricular (entrega 1.6).
 *
 * Une el plan de las seis academias: qué se pide en cada tramo por habilidad, qué fundamentos se enseñan en el
 * Nivel 1 y los ejemplos de actividad que sirven de modelo. De aquí sale el documento `docs/metis2/01-curriculo.md`.
 */
import { ACADEMIES, CATALOG_VERSION, DEMANDS, FORMATS, MASTERY_STAGES, SKILLS, TOPICS, TRAMOS, academyById, formatById, skillById, skillsOf, topicAcademy, type AcademyId, type Demand } from "../academias";
import type { ActivityExample, SkillPlan } from "./tipos";
import { EJEMPLOS_ESTRATEGIA, PLAN_ESTRATEGIA } from "./estrategia";
import { EJEMPLOS_FINANZAS, PLAN_FINANZAS } from "./finanzas";
import { EJEMPLOS_LIDERAZGO, PLAN_LIDERAZGO } from "./liderazgo";
import { EJEMPLOS_OPERACIONES, PLAN_OPERACIONES } from "./operaciones";
import { EJEMPLOS_CRECIMIENTO, PLAN_CRECIMIENTO } from "./crecimiento";
import { EJEMPLOS_RIESGO, PLAN_RIESGO } from "./riesgo";

export type { ActivityExample, Basics, SkillPlan } from "./tipos";

export const CURRICULUM_VERSION = 1;

export const PLANS: SkillPlan[] = [...PLAN_ESTRATEGIA, ...PLAN_FINANZAS, ...PLAN_LIDERAZGO, ...PLAN_OPERACIONES, ...PLAN_CRECIMIENTO, ...PLAN_RIESGO];
export const EXAMPLES: ActivityExample[] = [...EJEMPLOS_ESTRATEGIA, ...EJEMPLOS_FINANZAS, ...EJEMPLOS_LIDERAZGO, ...EJEMPLOS_OPERACIONES, ...EJEMPLOS_CRECIMIENTO, ...EJEMPLOS_RIESGO];

const PLAN_MAP: Record<string, SkillPlan> = Object.fromEntries(PLANS.map((p) => [p.skill, p]));
export const planOf = (skill: string): SkillPlan | undefined => PLAN_MAP[skill];
/** Qué se pide de una habilidad en un nivel. Del 6 en adelante aplica lo escrito para «Dirigir y profundizar». */
export const stepOf = (skill: string, level: number): string | undefined => planOf(skill)?.steps[Math.min(6, Math.max(1, Math.floor(level))) as Demand];
export const examplesOf = (academy: AcademyId): ActivityExample[] => EXAMPLES.filter((e) => e.academy === academy).sort((a, b) => a.level - b.level);

// ───────────────────────────────────────────── documento

const cell = (s: string) => s.replace(/\|/g, "/");

/** Documento de currículo en Markdown, generado del catálogo y la matriz. */
export function curriculumMarkdown(): string {
  const o: string[] = [];
  o.push("# MÊTIS 2.0 · Currículo de las seis academias", "");
  o.push(`Versión del catálogo: ${CATALOG_VERSION} · Versión de la matriz: ${CURRICULUM_VERSION}`, "");
  o.push("Este documento se genera del catálogo y la matriz que usa la aplicación (`app/src/lib/ceo/metis2`). No se edita a mano: una prueba automática falla si deja de coincidir con ellos.", "");

  o.push("## Cómo leerlo", "");
  o.push("MÊTIS separa tres cosas que no se mezclan:", "");
  o.push("1. **Nivel general.** En qué tramo de la ruta va la persona. Es continuo: 1, 2, 3, 4, 5, 6 y los que siguen. No hay una etapa final.");
  o.push("2. **Dominio de cada habilidad.** Qué tan demostrada está cada habilidad, según las evidencias que la persona ha dejado. Es interno y va de 0 a 5.");
  o.push("3. **Progreso hacia el siguiente nivel.** Cuánto falta de los criterios para subir. No es el promedio de las barras.", "");
  o.push("Leer teoría, acumular puntos o completar actividades no sube el dominio. Solo cuentan las respuestas evaluadas.", "");
  o.push("El programa toma de los MBA su orden: primero fundamentos comunes, luego aplicación, luego integración entre áreas y al final profundización según el interés de cada persona. No reproduce sus materiales ni equivale a un MBA.", "");

  o.push("## Niveles de la ruta", "");
  o.push("| Nivel | Nombre | Qué sabe hacer la persona | Qué se le pide |", "|---|---|---|---|");
  for (const t of TRAMOS) o.push(`| ${t.n === 6 ? "6 y siguientes" : t.n} | ${t.name} | ${cell(t.can)} | ${cell(t.demand)} |`);
  o.push("", "Del Nivel 6 en adelante la ruta sigue numerada (7, 8, 9…). La exigencia es la de «Dirigir y profundizar» y cada nivel nuevo pide evidencia nueva: otros temas, otras industrias y retos que cruzan más áreas. No se abren niveles sin contenido que los respalde.", "");

  o.push("## Dominio de cada habilidad (escala interna)", "");
  o.push("| Grado | Nombre | Qué significa |", "|---|---|---|");
  for (const m of MASTERY_STAGES) o.push(`| ${m.n} | ${m.name} | ${cell(m.means)} |`);
  o.push("", "Los nombres de esta escala son una propuesta; el documento de origen solo pide conservar una escala de 0 a 5 distinta de los niveles visibles. Las reglas exactas para pasar de un grado a otro se definen en el cálculo de dominio (entrega 1.4).", "");

  o.push("## Formatos de actividad", "");
  o.push("| Formato | Minutos | Para qué sirve | Cuenta como evidencia |", "|---|---|---|---|");
  for (const f of FORMATS) o.push(`| ${f.name} | ${f.minutes[0]} a ${f.minutes[1]} | ${cell(f.goal)} | ${f.evidence ? "Sí" : "No"} |`);
  o.push("", "Unidad de aprendizaje: lección breve, ejercicio, caso en contexto, retroalimentación, repaso espaciado y transferencia a otra industria. La teoría queda disponible siempre.", "");

  o.push("## Habilidades por academia y nivel", "");
  o.push("| Academia | Habilidades | Desde N1 | Desde N2 | Desde N3 | Desde N4 |", "|---|---|---|---|---|---|");
  for (const a of ACADEMIES) {
    const sk = skillsOf(a.id);
    o.push(`| ${a.name} | ${sk.length} | ${[1, 2, 3, 4].map((n) => sk.filter((s) => s.from === n).length).join(" | ")} |`);
  }
  o.push(`| **Total** | ${SKILLS.length} | ${[1, 2, 3, 4].map((n) => SKILLS.filter((s) => s.from === n).length).join(" | ")} |`, "");
  o.push("Las seis academias están presentes en todos los niveles. Una habilidad que aparece en un nivel sigue presente en los siguientes, con más exigencia.", "");

  for (const a of ACADEMIES) {
    o.push(`## ${a.name}`, "", a.blurb, "");
    o.push("### Habilidades y prerrequisitos", "");
    o.push("| Habilidad | Qué sabe hacer quien la domina | Aparece en | Conviene tener antes |", "|---|---|---|---|");
    for (const s of skillsOf(a.id)) {
      const pre = s.pre.map((p) => { const x = skillById(p)!; return x.academy === a.id ? x.name : `${x.name} (${academyById(x.academy).name})`; }).join("; ") || "Ninguna";
      o.push(`| ${s.name} | ${cell(s.what)} | Nivel ${s.from} | ${pre} |`);
    }
    o.push("");

    o.push("### Fundamentos del Nivel 1", "");
    o.push("| Habilidad | Vocabulario | Documentos | Indicadores |", "|---|---|---|---|");
    for (const s of skillsOf(a.id).filter((x) => x.from === 1)) {
      const b = planOf(s.id)!.basics!;
      o.push(`| ${s.name} | ${b.terms.join(", ")} | ${b.documents?.join(", ") ?? "No aplica"} | ${b.indicators?.join(", ") ?? "No aplica"} |`);
    }
    o.push("");

    o.push("### Qué se pide en cada nivel", "");
    for (const s of skillsOf(a.id)) {
      o.push(`**${s.name}**`, "");
      for (const d of DEMANDS) {
        const step = planOf(s.id)!.steps[d];
        if (step) o.push(`- Nivel ${d === 6 ? "6 y siguientes" : d} · ${TRAMOS[d - 1].name}: ${step}`);
      }
      o.push("");
    }

    o.push("### Ejemplos de actividad", "");
    for (const e of examplesOf(a.id)) {
      const others = e.skills.slice(1).map((x) => { const k = skillById(x)!; return `${k.name} (${academyById(k.academy).name})`; });
      o.push(`**Nivel ${e.level === 6 ? "6 y siguientes" : e.level} · ${TRAMOS[e.level - 1].name} · ${formatById(e.format).name}: ${e.title}**`, "");
      o.push(`- Habilidad principal: ${skillById(e.skills[0])!.name}.${others.length ? ` También evalúa: ${others.join("; ")}.` : ""}`);
      o.push(`- Situación: ${e.situation}`);
      o.push(`- Qué se pide: ${e.ask}`);
      o.push(`- Qué cuenta como evidencia: ${e.evidence}`);
      o.push(`- Contexto: ${e.contexts.join(" y ")}.`, "");
    }
  }

  o.push("## Temas que la persona puede elegir como prioridad", "");
  o.push("Al entrar se eligen al menos cinco. Los temas ordenan la ruta; no asignan dominio.", "");
  o.push("| Academia | Temas |", "|---|---|");
  for (const a of ACADEMIES) o.push(`| ${a.name} | ${TOPICS.filter((t) => topicAcademy(t) === a.id).map((t) => t.name).join("; ")} |`);
  o.push("", `Total: ${TOPICS.length} temas.`, "");

  o.push("## Qué falta por construir", "");
  o.push("Esta matriz dice qué se enseña y qué se exige. El contenido que la llena se construye por etapas:", "");
  o.push("- El contenido que ya existe está clasificado y medido en `03-clasificacion.md`: cubre parte de los niveles 2 a 4 y nada de los niveles 1, 5 y 6.");
  o.push("- Las lecciones y ejercicios de fundamentos del Nivel 1 y los casos de los niveles donde falte cobertura (entregas 3.1, 3.5 y 5.1).");
  o.push("- Los ejemplos de este documento son modelos de redacción. Todavía no son actividades jugables.", "");
  return o.join("\n");
}
