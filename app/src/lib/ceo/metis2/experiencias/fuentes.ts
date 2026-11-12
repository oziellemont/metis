/**
 * MÊTIS 2.0 · Repositorio Académico · fuentes y correspondencia de identificadores.
 *
 * FUENTES: las doce referencias del paquete v1.0, con lo que se comprobó al abrir cada dirección.
 * ATLAS: identificador editorial → identificador estable del catálogo → fuentes citadas en el Atlas.
 * Los identificadores editoriales son temporales; los que se guardan son los del catálogo.
 */
export const PACKAGE_VERSION = "1.0";
export const SOURCES_CHECKED_AT = "2026-11-12";

export interface Fuente { institution: string; component: string; url: string; seen: string }

export const FUENTES: Record<string, Fuente> = {
  HBS_CORE: { institution: "Harvard Business School", component: "Required Curriculum", url: "https://www.hbs.edu/mba/academic-experience/curriculum", seen: "Página del plan obligatorio del MBA. Responde y lista los cursos del primer año." },
  HBS_STRAT: { institution: "Harvard Business School", component: "Strategy — MBA Required Curriculum", url: "https://www.hbs.edu/faculty/units/strategy/Pages/curriculum.aspx", seen: "Describe el curso obligatorio Strategy: entorno de la empresa, ventaja competitiva y valor para el cliente." },
  HBS_FIN: { institution: "Harvard Business School", component: "Finance I / Finance II", url: "https://www.hbs.edu/faculty/units/finance/Pages/curriculum.aspx", seen: "Describe Finance I y Finance II: finanzas corporativas, mercados de capital, presupuesto de capital, valuación y política financiera. No trata vocabulario contable, estado de resultados ni flujo de efectivo." },
  HBS_MKT: { institution: "Harvard Business School", component: "Marketing — MBA Required Curriculum", url: "https://www.hbs.edu/faculty/units/marketing/Pages/curriculum.aspx", seen: "Describe el curso obligatorio Marketing: comportamiento del comprador y mezcla de producto, canales, comunicación y precio." },
  HBS_GOV: { institution: "Harvard Business School", component: "Leadership and Corporate Accountability", url: "https://www.hbs.edu/faculty/units/gm/Pages/curriculum.aspx", seen: "Describe Leadership and Corporate Accountability: responsabilidades legales, éticas y económicas, y sistemas de gobierno. No menciona riesgo, crisis ni incertidumbre." },
  HBS_CASE: { institution: "Harvard Business School", component: "The Case Method", url: "https://www.hbs.edu/mba/academic-experience/the-case-method", seen: "Explica el método del caso. Sirve como respaldo del diseño, no de una habilidad." },
  MIT_CORE: { institution: "MIT Sloan", component: "MBA Curriculum / First-Semester Core", url: "https://mitsloan.mit.edu/mba/explore-program/mba-curriculum", seen: "Lista el núcleo del primer semestre y las optativas de núcleo; Operaciones aparece como optativa de núcleo." },
  MIT_DESC: { institution: "MIT Sloan", component: "MBA Course Descriptions", url: "https://mitsloan.mit.edu/mba/mba-course-descriptions", seen: "Describe los cursos del núcleo y las optativas de núcleo, entre ellos Financial Accounting e Intro to Operations Management." },
  STAN_CORE: { institution: "Stanford GSB", component: "First-Year Curriculum", url: "https://www.gsb.stanford.edu/programs/mba/academic-experience/curriculum/first-year", seen: "Describe los cursos del primer año, entre ellos Financial Accounting, Finance, Operations, Strategy, Marketing, Leadership Laboratory y Managing Groups and Teams." },
  STAN_LAB: { institution: "Stanford GSB", component: "Leadership Labs", url: "https://www.gsb.stanford.edu/experience/learning/leadership/labs", seen: "Describe Leadership Labs: curso obligatorio con ejercicios y simulaciones en equipo, con acompañamiento. No menciona retroalimentación de forma expresa." },
  WH_CORE: { institution: "Wharton", component: "Core Curriculum", url: "https://mba-inside.wharton.upenn.edu/core-curriculum/", seen: "Lista los cursos del núcleo fijo y flexible por clave y nombre, sin describir su contenido." },
  INSEAD: { institution: "INSEAD", component: "MBA Curriculum / Capstone", url: "https://www.insead.edu/master-programmes/master-business-administration/curriculum", seen: "Lista los 14 cursos obligatorios por periodo y el proyecto final. La página no abre con una consulta automática simple; se leyó con el lector de páginas." },
};

/** [id editorial, id del catálogo, fuentes citadas en el Atlas] */
export const ATLAS: [string, string, string[]][] = [
  ["EST-01", "est.fundamentos", ["HBS_STRAT", "STAN_CORE"]],
  ["EST-02", "est.diagnostico", ["HBS_STRAT", "STAN_CORE"]],
  ["EST-03", "est.ventaja", ["HBS_STRAT", "STAN_CORE"]],
  ["EST-04", "est.priorizacion", ["HBS_STRAT", "STAN_CORE"]],
  ["EST-05", "est.alineacion", ["HBS_STRAT", "STAN_CORE"]],
  ["EST-06", "est.recursos", ["HBS_STRAT", "STAN_CORE"]],
  ["EST-07", "est.escenarios", ["MIT_DESC", "STAN_CORE"]],
  ["EST-08", "est.portafolio", ["HBS_STRAT", "STAN_CORE"]],
  ["FIN-01", "fin.lenguaje", ["STAN_CORE", "HBS_FIN"]],
  ["FIN-02", "fin.resultados", ["STAN_CORE", "HBS_FIN"]],
  ["FIN-03", "fin.balance", ["STAN_CORE", "HBS_FIN"]],
  ["FIN-04", "fin.flujo", ["STAN_CORE", "HBS_FIN"]],
  ["FIN-05", "fin.presupuesto", ["WH_CORE", "HBS_FIN"]],
  ["FIN-06", "fin.costos", ["STAN_CORE", "HBS_FIN"]],
  ["FIN-07", "fin.capital_trabajo", ["STAN_CORE", "HBS_FIN"]],
  ["FIN-08", "fin.inversion", ["STAN_CORE", "HBS_FIN"]],
  ["FIN-09", "fin.financiamiento", ["STAN_CORE", "HBS_FIN"]],
  ["FIN-10", "fin.valor", ["HBS_FIN"]],
  ["LID-01", "lid.fundamentos", ["STAN_CORE", "STAN_LAB"]],
  ["LID-02", "lid.comunicacion", ["MIT_CORE", "STAN_LAB"]],
  ["LID-03", "lid.feedback", ["STAN_CORE", "STAN_LAB"]],
  ["LID-04", "lid.delegacion", ["STAN_CORE", "STAN_LAB"]],
  ["LID-05", "lid.talento", ["STAN_CORE", "STAN_LAB"]],
  ["LID-06", "lid.equipos", ["STAN_CORE", "STAN_LAB"]],
  ["LID-07", "lid.negociacion", ["STAN_CORE", "STAN_LAB"]],
  ["LID-08", "lid.influencia", ["STAN_CORE", "STAN_LAB"]],
  ["LID-09", "lid.cultura", ["STAN_CORE", "STAN_LAB"]],
  ["OPE-01", "ope.procesos", ["STAN_CORE", "WH_CORE"]],
  ["OPE-02", "ope.indicadores", ["STAN_CORE", "WH_CORE"]],
  ["OPE-03", "ope.calidad", ["WH_CORE"]],
  ["OPE-04", "ope.capacidad", ["STAN_CORE", "WH_CORE"]],
  ["OPE-05", "ope.productividad", ["STAN_CORE", "WH_CORE"]],
  ["OPE-06", "ope.suministro", ["STAN_CORE", "WH_CORE"]],
  ["OPE-07", "ope.ejecucion", ["STAN_CORE", "WH_CORE"]],
  ["OPE-08", "ope.mejora", ["STAN_CORE", "WH_CORE"]],
  ["CRE-01", "cre.cliente", ["HBS_MKT", "STAN_CORE"]],
  ["CRE-02", "cre.segmentacion", ["HBS_MKT", "STAN_CORE"]],
  ["CRE-03", "cre.precios", ["HBS_MKT", "STAN_CORE"]],
  ["CRE-04", "cre.canales", ["HBS_MKT", "STAN_CORE"]],
  ["CRE-05", "cre.marketing", ["HBS_MKT", "STAN_CORE"]],
  ["CRE-06", "cre.retencion", ["HBS_MKT", "STAN_CORE"]],
  ["CRE-07", "cre.producto", ["HBS_MKT", "STAN_CORE"]],
  ["CRE-08", "cre.modelo", ["MIT_DESC", "STAN_CORE"]],
  ["CRE-09", "cre.expansion", ["HBS_MKT", "STAN_CORE"]],
  ["RIE-01", "rie.fundamentos", ["HBS_GOV", "WH_CORE"]],
  ["RIE-02", "rie.etica", ["HBS_GOV", "WH_CORE"]],
  ["RIE-03", "rie.cumplimiento", ["HBS_GOV", "WH_CORE"]],
  ["RIE-04", "rie.incertidumbre", ["HBS_GOV", "WH_CORE"]],
  ["RIE-05", "rie.entorno", ["INSEAD", "WH_CORE"]],
  ["RIE-06", "rie.stakeholders", ["HBS_GOV", "WH_CORE"]],
  ["RIE-07", "rie.crisis", ["HBS_GOV", "WH_CORE"]],
  ["RIE-08", "rie.gobierno", ["HBS_GOV", "WH_CORE"]],
];

export const skillOfEditorial = (editorialId: string): string | undefined => ATLAS.find((a) => a[0] === editorialId)?.[1];
export const editorialOfSkill = (skillId: string): string | undefined => ATLAS.find((a) => a[1] === skillId)?.[0];
export const atlasSources = (skillId: string): string[] => ATLAS.find((a) => a[1] === skillId)?.[2] ?? [];

/** Las seis experiencias del lote piloto, como vienen en el paquete: habilidades y fuentes que cita cada una. */
export interface LoteItem { editorialId: string; title: string; primary: string; secondary: string[]; sources: string[]; manifestSource: string; variant: string; rubric: string }

export const LOTE_N1: LoteItem[] = [
  { editorialId: "EDIT-N1-001", title: "¿Nueve tareas o una estrategia?", primary: "est.fundamentos", secondary: ["est.priorizacion", "est.alineacion"], sources: ["HBS_STRAT", "STAN_CORE"], manifestSource: "HBS_STRAT", variant: "Lavandería", rubric: "50 / 30 / 20" },
  { editorialId: "EDIT-N1-002", title: "Hay utilidad; ¿por qué no hay efectivo?", primary: "fin.lenguaje", secondary: ["fin.resultados", "fin.flujo"], sources: ["STAN_CORE", "WH_CORE"], manifestSource: "STAN_CORE", variant: "Estudio de diseño", rubric: "35 / 30 / 35" },
  { editorialId: "EDIT-N1-003", title: "Ese correo puede empeorarlo", primary: "lid.feedback", secondary: ["lid.comunicacion", "lid.fundamentos"], sources: ["STAN_LAB", "STAN_CORE", "MIT_CORE"], manifestSource: "STAN_LAB", variant: "Almacén", rubric: "40 / 20 / 20 / 20" },
  { editorialId: "EDIT-N1-004", title: "Todos trabajan; el pedido sigue tarde", primary: "ope.capacidad", secondary: ["ope.procesos", "ope.indicadores"], sources: ["STAN_CORE", "WH_CORE", "MIT_CORE"], manifestSource: "STAN_CORE", variant: "Restaurante", rubric: "50 / 25 / 25" },
  { editorialId: "EDIT-N1-005", title: "¿Quién es realmente el cliente?", primary: "cre.cliente", secondary: ["cre.segmentacion", "cre.canales"], sources: ["HBS_MKT", "STAN_CORE", "WH_CORE"], manifestSource: "HBS_MKT", variant: "Software de citas médicas", rubric: "45 / 30 / 25" },
  { editorialId: "EDIT-N1-006", title: "Dos riesgos, una sola prioridad", primary: "rie.fundamentos", secondary: ["rie.cumplimiento", "rie.etica"], sources: ["HBS_GOV", "WH_CORE", "INSEAD"], manifestSource: "HBS_GOV", variant: "Centro de distribución", rubric: "35 / 25 / 40" },
];

/** Archivos del paquete v1.0 tal como se recibieron (primeros 16 caracteres de su huella SHA-256). */
export const PAQUETE_ARCHIVOS: [string, string][] = [
  ["README_PARA_SUPERNINJA.md", "eb619f982cddacd2"],
  ["ESTANDAR_EDITORIAL_Y_EVALUACION.md", "bb6f17f01abc2740"],
  ["ATLAS_52_HABILIDADES.md", "c392c188d32b12e7"],
  ["ATLAS_52_HABILIDADES.csv", "cdd8fdbd4f3ecf83"],
  ["FUENTES_VERIFICADAS.json", "ab58f6887f7f6968"],
  ["MANIFIESTO_CONTENIDO.json", "1854e782f0f7d0b7"],
  ["BACKLOG_24_HABILIDADES_N1.csv", "e84af484e7fbcf52"],
  ["EXPERIENCIAS_N1.md", "f66be87d82045c8e"],
  ["EXECUTIVE_CHALLENGE_N1.md", "7f591d374b44ff45"],
  ["PLAN_PRODUCCION_N1.md", "466b183f831f974f"],
];
