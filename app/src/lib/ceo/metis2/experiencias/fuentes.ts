/**
 * MÊTIS 2.0 · Repositorio Académico · fuentes y correspondencia de identificadores.
 *
 * FUENTES: las doce referencias del paquete v1.0 y las cuatro que añaden los lotes 02 y 03, con lo que se comprobó al abrir cada dirección.
 * ATLAS: identificador editorial → identificador estable del catálogo → fuentes citadas en el Atlas.
 * Los identificadores editoriales son temporales; los que se guardan son los del catálogo.
 */
export const PACKAGE_VERSION = "1.0";
export const SOURCES_CHECKED_AT = "2026-11-13";

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
  HBS_ISC: { institution: "Harvard Business School", component: "Institute for Strategy and Competitiveness — Creating a Successful Strategy", url: "https://www.isc.hbs.edu/strategy/creating-a-successful-strategy/Pages/default.aspx", seen: "Presenta los elementos de una estrategia; nombra de forma expresa la propuesta de valor («Value Proposition») y las renuncias («Making Strategic Trade-offs»). Añadida por el lote 02." },
  HBS_AM: { institution: "Harvard Business School", component: "Accounting and Management — Financial Reporting and Control", url: "https://www.hbs.edu/faculty/units/am/Pages/curriculum.aspx", seen: "Describe el curso obligatorio Financial Reporting and Control; habla del vocabulario de los estados financieros y los informes contables. Añadida por el lote 02." },
  HBS_TOM: { institution: "Harvard Business School", component: "Technology and Operations Management — MBA Required Curriculum", url: "https://www.hbs.edu/faculty/units/tom/Pages/curriculum.aspx", seen: "Describe el curso obligatorio de operaciones; menciona el análisis de procesos («Process analysis»). Añadida por el lote 02." },
  INSEAD_CORE: { institution: "INSEAD", component: "MBA Core Courses", url: "https://www.insead.edu/master-programmes/master-business-administration/core-courses", seen: "Lista y describe los cursos obligatorios; aparecen todos los que citan los lotes 02 y 03: Financial Accounting, Organisational Behaviour, Managing Customer Value, Managerial Accounting, Process and Operations Management, Leadership Communication Foundations y Business and Society. La página rechaza las consultas automáticas simples; se leyó con el lector de páginas. Añadida por el lote 02." },
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
/** `manifest`: fuentes que el manifiesto del paquete guarda para la experiencia (el lote 02 llegó sin manifiesto). */
export interface LoteItem { editorialId: string; title: string; primary: string; secondary: string[]; sources: string[]; manifest: string[]; variant: string; rubric: string }

export const LOTE_N1: LoteItem[] = [
  { editorialId: "EDIT-N1-001", title: "¿Nueve tareas o una estrategia?", primary: "est.fundamentos", secondary: ["est.priorizacion", "est.alineacion"], sources: ["HBS_STRAT", "STAN_CORE"], manifest: ["HBS_STRAT"], variant: "Lavandería", rubric: "50 / 30 / 20" },
  { editorialId: "EDIT-N1-002", title: "Hay utilidad; ¿por qué no hay efectivo?", primary: "fin.lenguaje", secondary: ["fin.resultados", "fin.flujo"], sources: ["STAN_CORE", "WH_CORE"], manifest: ["STAN_CORE"], variant: "Estudio de diseño", rubric: "35 / 30 / 35" },
  { editorialId: "EDIT-N1-003", title: "Ese correo puede empeorarlo", primary: "lid.feedback", secondary: ["lid.comunicacion", "lid.fundamentos"], sources: ["STAN_LAB", "STAN_CORE", "MIT_CORE"], manifest: ["STAN_LAB"], variant: "Almacén", rubric: "40 / 20 / 20 / 20" },
  { editorialId: "EDIT-N1-004", title: "Todos trabajan; el pedido sigue tarde", primary: "ope.capacidad", secondary: ["ope.procesos", "ope.indicadores"], sources: ["STAN_CORE", "WH_CORE", "MIT_CORE"], manifest: ["STAN_CORE"], variant: "Restaurante", rubric: "50 / 25 / 25" },
  { editorialId: "EDIT-N1-005", title: "¿Quién es realmente el cliente?", primary: "cre.cliente", secondary: ["cre.segmentacion", "cre.canales"], sources: ["HBS_MKT", "STAN_CORE", "WH_CORE"], manifest: ["HBS_MKT"], variant: "Software de citas médicas", rubric: "45 / 30 / 25" },
  { editorialId: "EDIT-N1-006", title: "Dos riesgos, una sola prioridad", primary: "rie.fundamentos", secondary: ["rie.cumplimiento", "rie.etica"], sources: ["HBS_GOV", "WH_CORE", "INSEAD"], manifest: ["HBS_GOV"], variant: "Centro de distribución", rubric: "35 / 25 / 40" },
];

/** Lote 02 (paquete 1.1): un solo documento, sin manifiesto ni archivo de rúbricas. */
export const LOTE_02: LoteItem[] = [
  { editorialId: "EDIT-N1-007", title: "¿Por qué nos eligen si no somos los más baratos?", primary: "est.ventaja", secondary: ["est.fundamentos", "cre.cliente"], sources: ["HBS_STRAT", "HBS_ISC"], manifest: [], variant: "Taller de bicicletas", rubric: "40 / 35 / 25" },
  { editorialId: "EDIT-N1-008", title: "Las ventas no son la utilidad", primary: "fin.resultados", secondary: ["fin.lenguaje", "fin.presupuesto"], sources: ["HBS_AM", "STAN_CORE"], manifest: [], variant: "Hotel pequeño", rubric: "40 / 40 / 20" },
  { editorialId: "EDIT-N1-009", title: "Ser responsable no es hacerlo todo", primary: "lid.fundamentos", secondary: ["lid.delegacion", "lid.comunicacion"], sources: ["STAN_CORE", "INSEAD_CORE"], manifest: [], variant: "Biblioteca municipal", rubric: "45 / 30 / 25" },
  { editorialId: "EDIT-N1-010", title: "El pedido desapareció entre áreas", primary: "ope.procesos", secondary: ["ope.indicadores", "ope.calidad"], sources: ["HBS_TOM", "INSEAD_CORE"], manifest: [], variant: "Clínica veterinaria", rubric: "40 / 25 / 35" },
  { editorialId: "EDIT-N1-011", title: "No todos compran por la misma razón", primary: "cre.segmentacion", secondary: ["cre.cliente", "cre.precios"], sources: ["HBS_MKT", "INSEAD_CORE"], manifest: [], variant: "Cursos cortos en línea", rubric: "45 / 30 / 25" },
  { editorialId: "EDIT-N1-012", title: "El proveedor es familia", primary: "rie.etica", secondary: ["rie.cumplimiento", "rie.stakeholders"], sources: ["HBS_GOV", "STAN_CORE"], manifest: [], variant: "Comité de contratación", rubric: "40 / 35 / 25" },
];

/** Lote 03 (paquete 1.2). El manifiesto usa otros nombres para las mismas fuentes; aquí van con los del registro. */
export const LOTE_03: LoteItem[] = [
  { editorialId: "EDIT-N1-013", title: "Tres propuestas, un presupuesto", primary: "est.priorizacion", secondary: ["est.fundamentos", "ope.indicadores"], sources: ["HBS_STRAT", "STAN_CORE"], manifest: ["HBS_STRAT", "STAN_CORE"], variant: "Centro cultural", rubric: "25 / 30 / 30 / 15" },
  { editorialId: "EDIT-N1-014", title: "¿La tienda tiene más de lo que debe?", primary: "fin.balance", secondary: ["fin.lenguaje"], sources: ["STAN_CORE", "INSEAD_CORE"], manifest: ["STAN_CORE", "INSEAD_CORE"], variant: "Floristería", rubric: "40 / 25 / 20 / 15" },
  { editorialId: "EDIT-N1-015", title: "Ese correo necesita una decisión, no más palabras", primary: "lid.comunicacion", secondary: ["lid.fundamentos"], sources: ["INSEAD_CORE", "STAN_CORE"], manifest: ["INSEAD_CORE", "STAN_CORE"], variant: "Centro de eventos", rubric: "30 / 35 / 20 / 15" },
  { editorialId: "EDIT-N1-016", title: "El tablero está en verde, pero los clientes esperan", primary: "ope.indicadores", secondary: ["ope.procesos"], sources: ["INSEAD_CORE", "STAN_CORE"], manifest: ["INSEAD_CORE", "STAN_CORE"], variant: "Clínica veterinaria", rubric: "25 / 35 / 25 / 15" },
  { editorialId: "EDIT-N1-017", title: "Cobrar más no siempre significa cobrar de más", primary: "cre.precios", secondary: ["cre.cliente"], sources: ["INSEAD_CORE", "STAN_CORE"], manifest: ["INSEAD_CORE", "STAN_CORE"], variant: "Mantenimiento de jardines", rubric: "35 / 25 / 30 / 10" },
  { editorialId: "EDIT-N1-018", title: "La misma persona hace todo el pago", primary: "rie.cumplimiento", secondary: ["rie.etica", "ope.procesos"], sources: ["HBS_GOV", "INSEAD_CORE"], manifest: ["HBS_GOV", "INSEAD_CORE"], variant: "Escuela de talleres", rubric: "30 / 35 / 25 / 10" },
];

/**
 * Lote 04 (paquete 1.3). Llegaron dos archivos: las seis experiencias y el Executive Challenge ampliado.
 * No trae fuentes por experiencia ni manifiesto: se anotan las fuentes del Atlas para la habilidad principal.
 */
export const LOTE_04: LoteItem[] = [
  { editorialId: "EDIT-N1-019", title: "La meta de todos no es la misma", primary: "est.alineacion", secondary: ["ope.indicadores", "est.priorizacion"], sources: ["HBS_STRAT", "STAN_CORE"], manifest: [], variant: "Mantenimiento de elevadores", rubric: "30 / 30 / 25 / 15" },
  { editorialId: "EDIT-N1-020", title: "El dinero entra el jueves", primary: "fin.flujo", secondary: ["fin.lenguaje"], sources: ["STAN_CORE", "HBS_FIN"], manifest: [], variant: "Clínica veterinaria", rubric: "40 / 25 / 20 / 15" },
  { editorialId: "EDIT-N1-021", title: "¿Por qué este gasto se salió del plan?", primary: "fin.presupuesto", secondary: ["fin.resultados", "lid.comunicacion"], sources: ["WH_CORE", "HBS_FIN"], manifest: [], variant: "Peluquería canina", rubric: "40 / 30 / 20 / 10" },
  { editorialId: "EDIT-N1-022", title: "Te lo encargo, ¿pero hasta dónde puedes decidir?", primary: "lid.delegacion", secondary: ["lid.fundamentos"], sources: ["STAN_CORE", "STAN_LAB"], manifest: [], variant: "Centro de eventos", rubric: "30 / 30 / 25 / 15" },
  { editorialId: "EDIT-N1-023", title: "La devolución que no cabía en la estadística", primary: "ope.calidad", secondary: ["ope.procesos", "rie.cumplimiento"], sources: ["WH_CORE"], manifest: [], variant: "Materiales escolares", rubric: "30 / 35 / 25 / 10" },
  { editorialId: "EDIT-N1-024", title: "¿Por dónde compran realmente?", primary: "cre.canales", secondary: ["cre.cliente", "cre.segmentacion"], sources: ["HBS_MKT", "STAN_CORE"], manifest: [], variant: "Renta de equipos", rubric: "25 / 35 / 20 / 20" },
];

/**
 * Executive Challenge de Nivel 1. Son dos borradores distintos y ninguno sustituye al otro.
 * EC-N1-001-A (paquete 1.0): seis decisiones, leído y sin convertir. EC-N1-002-A (paquete 1.3): tres actos, trece escenas y síntesis.
 */
export interface RetoEditorial { editorialId: string; title: string; packageVersion: string; scenes: number; skills: number; estado: "leido" | "demostracion" }
export const RETOS: RetoEditorial[] = [
  { editorialId: "EC-N1-001-A", title: "La semana en que casi todo parecía urgente", packageVersion: "1.0", scenes: 6, skills: 0, estado: "leido" },
  { editorialId: "EC-N1-002-A", title: "El viernes que nadie quería prometer", packageVersion: "1.3", scenes: 14, skills: 24, estado: "demostracion" },
];

/** Nombres que usa el manifiesto del lote 03 para fuentes que ya estaban en el registro. */
export const ALIAS_FUENTES: Record<string, string> = { HBS_STRATEGY: "HBS_STRAT", STAN_FIRST_YEAR: "STAN_CORE", HBS_LCA: "HBS_GOV", INSEAD_CORE: "INSEAD_CORE" };

export interface Lote { id: string; name: string; packageVersion: string; items: LoteItem[]; files: [string, string][] }

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

export const LOTES: Lote[] = [
  { id: "lote-01", name: "Lote 01", packageVersion: "1.0", items: LOTE_N1, files: PAQUETE_ARCHIVOS },
  { id: "lote-02", name: "Lote 02", packageVersion: "1.1", items: LOTE_02, files: [["EXPERIENCIAS_N1_LOTE_02.md", "58b0b42735551d3e"]] },
  {
    id: "lote-03", name: "Lote 03", packageVersion: "1.2", items: LOTE_03,
    files: [
      ["README_PARA_SN.md", "27336077f276368d"], ["EXPERIENCIAS_N1_LOTE_03.md", "f22631caebd9b8c6"], ["MANIFIESTO_LOTE_03.json", "8a4eb1bb7f96112d"], ["RUBRICAS_LOTE_03.json", "ff7012150558a469"],
      ["TRAZABILIDAD_ACADEMICA.md", "d5f386d4822193b9"], ["QA_Y_PRUEBAS.md", "00a39ffbc1c53b82"], ["PLAN_LOTE_04.md", "d0332c8416e43f45"], ["VALIDACION_LOCAL.txt", "11f7a12b4f94f04b"],
    ],
  },
  {
    id: "lote-04", name: "Lote 04", packageVersion: "1.3", items: LOTE_04,
    files: [["EXPERIENCIAS_N1_LOTE_04.md", "f7f50075b39b408e"], ["EXECUTIVE_CHALLENGE_N1_V2.md", "fdb978067df15689"]],
  },
];
export const loteOf = (editorialId: string): Lote | undefined => LOTES.find((l) => l.items.some((i) => i.editorialId === editorialId));
export const itemOf = (editorialId: string): LoteItem | undefined => LOTES.flatMap((l) => l.items).find((i) => i.editorialId === editorialId);
