/**
 * MÊTIS 2.0 · Catálogo de aprendizaje (entrega 1.1).
 *
 * Aquí viven las piezas fijas del programa: las seis academias, los niveles visibles de la ruta,
 * la escala interna de dominio, las habilidades con sus prerrequisitos, los temas que la persona
 * elige como prioridad y los formatos de actividad.
 *
 * Tres cosas distintas que no se mezclan:
 *  1. Nivel general (visible): en qué tramo de la ruta va la persona. 1, 2, 3… sin final.
 *  2. Dominio de cada habilidad (interno, 0 a 5): qué tan demostrada está, según sus evidencias.
 *  3. Progreso hacia el siguiente nivel: cuánto falta de los criterios públicos para subir.
 * El cálculo de 2 y 3 vive en el motor de dominio (entrega 1.4). Puntos y rachas no participan.
 *
 * Los identificadores de este archivo quedan guardados en las evidencias de cada persona.
 * No se renombran ni se borran: `academias-ids.json` y su prueba lo impiden. Para retirar algo
 * se marca como retirado en una versión nueva del catálogo.
 *
 * Lógica pura: sin React ni navegador.
 */

export const CATALOG_VERSION = 1;

// ───────────────────────────────────────────── academias

export type AcademyId = "estrategia" | "finanzas" | "liderazgo" | "operaciones" | "crecimiento" | "riesgo";

export interface Academy { id: AcademyId; name: string; short: string; blurb: string }

export const ACADEMIES: Academy[] = [
  { id: "estrategia", name: "Estrategia", short: "Estrategia", blurb: "Entender dónde está el negocio, elegir a qué apostar y a qué renunciar." },
  { id: "finanzas", name: "Finanzas", short: "Finanzas", blurb: "Leer los números de un negocio y decidir con ellos: resultados, caja, inversión y financiamiento." },
  { id: "liderazgo", name: "Liderazgo", short: "Liderazgo", blurb: "Conseguir resultados con otras personas: conversar, delegar, negociar e influir." },
  { id: "operaciones", name: "Operaciones", short: "Operaciones", blurb: "Hacer que el trabajo salga bien, a tiempo y a un costo razonable." },
  { id: "crecimiento", name: "Crecimiento", short: "Crecimiento", blurb: "Clientes, precios, ventas y productos: de dónde viene el siguiente peso de ingreso." },
  { id: "riesgo", name: "Riesgo y gobierno", short: "Riesgo", blurb: "Decidir con incertidumbre, cuidar la ética y la reputación, y rendir cuentas." },
];
export const ACADEMY_IDS = ACADEMIES.map((a) => a.id);
export const academyById = (id: AcademyId) => ACADEMIES.find((a) => a.id === id)!;

// ───────────────────────────────────────────── niveles visibles de la ruta

/** Tramo: lo que exige el nivel. Del 6 en adelante el tramo es el mismo y la exigencia es evidencia nueva. */
export interface Tramo { n: 1 | 2 | 3 | 4 | 5 | 6; name: string; can: string; demand: string }

export const TRAMOS: Tramo[] = [
  { n: 1, name: "Reconocer", can: "Entiendes el vocabulario y reconoces los documentos, indicadores, actores y conceptos básicos de un negocio.", demand: "Identificar y explicar con tus palabras." },
  { n: 2, name: "Aplicar", can: "Lees información sencilla y usas un concepto para resolver una tarea concreta.", demand: "Usar un concepto con datos dados." },
  { n: 3, name: "Analizar", can: "Explicas causas, interpretas indicadores y comparas alternativas con restricciones.", demand: "Diagnosticar y comparar opciones." },
  { n: 4, name: "Integrar", can: "Conectas varias áreas del negocio y defiendes una decisión con sus costos y escenarios.", demand: "Decidir cruzando áreas y defenderlo." },
  { n: 5, name: "Transferir", can: "Resuelves con un principio conocido en una industria o situación que no habías visto.", demand: "Aplicar lo aprendido en un contexto nuevo." },
  { n: 6, name: "Dirigir y profundizar", can: "Decides con ambigüedad, datos incompletos, varias partes interesadas y crisis encadenadas.", demand: "Dirigir con información incompleta y sostenerlo ante otros." },
];

/** El nivel general no tiene tope: 7, 8, 9… siguen en el tramo «Dirigir y profundizar». */
export const FIRST_LEVEL = 1;
export const OPEN_TRAMO = 6;

export function tramoOf(level: number): Tramo {
  const n = Math.min(OPEN_TRAMO, Math.max(FIRST_LEVEL, Math.floor(level)));
  return TRAMOS[n - 1];
}
export function levelLabel(level: number): string {
  const l = Math.max(FIRST_LEVEL, Math.floor(level));
  return `Nivel ${l} · ${tramoOf(l).name}`;
}
/** Exigencia de una actividad: siempre uno de los seis tramos. */
export type Demand = Tramo["n"];
export const DEMANDS: Demand[] = [1, 2, 3, 4, 5, 6];

// ───────────────────────────────────────────── escala interna de dominio (0 a 5)

/**
 * Qué tan demostrada está una habilidad. Es interna: en pantalla se muestran barras y textos, no este número.
 * Los nombres son propuesta propia; el documento de origen solo pide conservar una escala de 0 a 5.
 */
export type MasteryStage = 0 | 1 | 2 | 3 | 4 | 5;
export const MASTERY_STAGES: { n: MasteryStage; name: string; means: string }[] = [
  { n: 0, name: "Sin evidencia", means: "No hay respuestas evaluadas de esta habilidad." },
  { n: 1, name: "Inicial", means: "Hay alguna respuesta, pero pocas, con ayuda o de calidad baja." },
  { n: 2, name: "En desarrollo", means: "Hay respuestas correctas, todavía insuficientes en cantidad, variedad o sin ayuda." },
  { n: 3, name: "Demostrado", means: "Evidencia suficiente y sin ayuda en la exigencia del nivel." },
  { n: 4, name: "Consistente", means: "Se sostiene en el tiempo y en más de un contexto." },
  { n: 5, name: "Transferible", means: "Se sostiene en industrias y situaciones nuevas, y dentro de retos que cruzan áreas." },
];

// ───────────────────────────────────────────── habilidades

export interface Skill {
  /** `academia.habilidad`. Estable: queda guardado en las evidencias. */
  id: string;
  academy: AcademyId;
  name: string;
  /** Qué sabe hacer quien la domina. */
  what: string;
  /** Primer tramo en que aparece. De ahí en adelante sigue presente, con más exigencia. */
  from: Demand;
  /** Habilidades que conviene tener demostradas antes. Pueden ser de otra academia. */
  pre: string[];
}

const S = (id: string, name: string, from: Demand, pre: string[], what: string): Skill => ({ id, academy: ACADEMY_OF_PREFIX[id.split(".")[0]], name, what, from, pre });

const ACADEMY_OF_PREFIX: Record<string, AcademyId> = { est: "estrategia", fin: "finanzas", lid: "liderazgo", ope: "operaciones", cre: "crecimiento", rie: "riesgo" };

export const SKILLS: Skill[] = [
  // Estrategia
  S("est.fundamentos", "Lenguaje de la estrategia", 1, [], "Distingue objetivo, prioridad, propuesta de valor, competidor y ventaja."),
  S("est.diagnostico", "Diagnóstico de la situación", 2, ["est.fundamentos"], "Separa síntomas de causas y describe el entorno, la industria y la posición del negocio."),
  S("est.ventaja", "Ventaja competitiva y posicionamiento", 1, ["est.fundamentos"], "Explica por qué un cliente elige a este negocio y qué tan fácil es copiarlo."),
  S("est.priorizacion", "Priorización y renuncias", 1, ["est.fundamentos"], "Elige pocas prioridades y dice con claridad a qué se renuncia."),
  S("est.alineacion", "De la estrategia a metas e indicadores", 1, ["est.fundamentos", "ope.indicadores"], "Baja una prioridad a metas, responsables e indicadores que se pueden revisar."),
  S("est.recursos", "Asignación de recursos", 3, ["est.priorizacion", "fin.presupuesto"], "Reparte dinero, gente y atención entre iniciativas según lo que más mueve el resultado."),
  S("est.escenarios", "Escenarios y efectos de segundo orden", 3, ["est.diagnostico"], "Anticipa cómo reaccionan competidores, clientes y equipo, y prepara más de un futuro posible."),
  S("est.portafolio", "Portafolio, disrupción y decisiones irreversibles", 4, ["est.recursos", "est.escenarios"], "Decide en qué negocios estar, cuándo salir y cómo tratar una apuesta muy difícil de revertir."),

  // Finanzas
  S("fin.lenguaje", "Vocabulario financiero", 1, [], "Distingue ingreso, costo, gasto, utilidad, caja, activo, deuda y capital."),
  S("fin.resultados", "Estado de resultados y márgenes", 1, ["fin.lenguaje"], "Lee un estado de resultados y explica de dónde sale y a dónde se va la utilidad."),
  S("fin.balance", "Balance general", 1, ["fin.lenguaje"], "Lee qué tiene, qué debe y cuánto vale un negocio en una fecha."),
  S("fin.flujo", "Flujo de efectivo", 1, ["fin.lenguaje"], "Explica por qué utilidad y caja no son lo mismo y de dónde entra y sale el dinero."),
  S("fin.presupuesto", "Presupuesto y variaciones", 1, ["fin.lenguaje"], "Arma y lee un presupuesto, y explica por qué lo real se desvió de lo planeado."),
  S("fin.costos", "Costos, contribución y punto de equilibrio", 2, ["fin.resultados"], "Separa costos fijos y variables y calcula cuánto hay que vender para no perder."),
  S("fin.capital_trabajo", "Capital de trabajo", 2, ["fin.balance", "fin.flujo"], "Maneja cobranza, pagos e inventario para que el crecimiento no deje al negocio sin caja."),
  S("fin.inversion", "Valor del dinero y evaluación de inversiones", 3, ["fin.flujo"], "Compara inversiones por lo que devuelven, cuándo y con qué riesgo."),
  S("fin.financiamiento", "Deuda, capital y financiamiento", 3, ["fin.balance", "fin.flujo"], "Elige cómo financiar el negocio y entiende el costo y las condiciones de cada fuente."),
  S("fin.valor", "Asignación de capital y valuación", 4, ["fin.inversion", "fin.financiamiento"], "Decide dónde poner el capital del negocio y estima cuánto vale una empresa o un proyecto."),

  // Liderazgo
  S("lid.fundamentos", "El papel de quien dirige", 1, [], "Distingue hacer, coordinar y dirigir, y se hace cargo del resultado de su equipo."),
  S("lid.comunicacion", "Comunicación ejecutiva", 1, [], "Dice lo importante primero, con claridad, y sabe dar una mala noticia."),
  S("lid.feedback", "Retroalimentación y conversaciones difíciles", 1, ["lid.fundamentos"], "Dice lo que hay que decir con hechos y respeto, y escucha la respuesta."),
  S("lid.delegacion", "Delegación y seguimiento", 1, ["lid.fundamentos"], "Encarga un resultado con claridad, da el margen adecuado y revisa sin asfixiar."),
  S("lid.talento", "Motivación, desarrollo de personas y sucesión", 2, ["lid.feedback"], "Entiende qué mueve a cada persona, la hace crecer y prepara relevos."),
  S("lid.equipos", "Equipos, conflicto y convivencia", 2, ["lid.feedback"], "Construye confianza, usa el desacuerdo a favor y logra compromisos que se cumplen."),
  S("lid.negociacion", "Negociación", 2, ["lid.comunicacion"], "Prepara intereses, alternativas y límites, y cierra acuerdos que duran."),
  S("lid.influencia", "Influencia y coaliciones", 3, ["lid.comunicacion", "lid.negociacion"], "Consigue apoyo de quien no le reporta y arma las alianzas que una decisión necesita."),
  S("lid.cultura", "Cultura y cambio", 3, ["lid.equipos"], "Lee la cultura real de una organización y conduce un cambio sin romperla."),

  // Operaciones
  S("ope.procesos", "Procesos", 1, [], "Describe cómo fluye el trabajo: pasos, entradas, salidas y responsables."),
  S("ope.indicadores", "Indicadores operativos", 1, [], "Sabe qué mide un indicador, cómo se lee y cuándo engaña."),
  S("ope.calidad", "Calidad", 1, ["ope.procesos"], "Define qué es hacerlo bien para el cliente y cuánto cuesta hacerlo mal."),
  S("ope.capacidad", "Capacidad y cuellos de botella", 1, ["ope.procesos"], "Calcula cuánto puede producir o atender un proceso y encuentra dónde se atora."),
  S("ope.productividad", "Productividad y merma", 2, ["ope.indicadores"], "Mide cuánto se obtiene por cada recurso y dónde se desperdicia."),
  S("ope.suministro", "Inventarios y cadena de suministro", 2, ["ope.procesos"], "Decide cuánto tener, a quién comprar y cómo equilibrar servicio y costo."),
  S("ope.ejecucion", "Ejecución y seguimiento", 2, ["ope.indicadores"], "Convierte un plan en compromisos con responsable, fecha y ritmo de revisión."),
  S("ope.mejora", "Mejora continua y transformación", 3, ["ope.calidad", "ope.productividad"], "Encuentra la causa raíz, prueba un cambio en pequeño y lo vuelve la forma normal de trabajar."),

  // Crecimiento
  S("cre.cliente", "Cliente y propuesta de valor", 1, [], "Explica quién compra, qué problema resuelve y por qué pagaría."),
  S("cre.segmentacion", "Segmentación y mercado objetivo", 1, ["cre.cliente"], "Divide el mercado en grupos con necesidades distintas y elige a cuáles servir."),
  S("cre.precios", "Precios y valor percibido", 1, ["cre.cliente"], "Fija y defiende un precio según el valor para el cliente, el costo y la competencia."),
  S("cre.canales", "Canales y ventas", 1, [], "Elige por dónde llegar al cliente y cómo se gestiona un proceso de venta."),
  S("cre.marketing", "Marketing y adquisición de clientes", 2, ["cre.segmentacion", "cre.canales"], "Lee un embudo, calcula cuánto cuesta ganar un cliente y decide dónde invertir."),
  S("cre.retencion", "Retención y valor del cliente", 2, ["cre.cliente"], "Mide cuántos clientes se van, por qué, y cuánto vale conservarlos."),
  S("cre.producto", "Producto e innovación", 2, ["cre.cliente"], "Prueba ideas en pequeño, aprende rápido y decide qué lanzar, qué mejorar y qué retirar."),
  S("cre.modelo", "Modelo de negocio y economía unitaria", 3, ["cre.precios", "fin.costos"], "Explica cómo gana dinero un negocio por cada cliente o unidad y qué lo vuelve rentable al crecer."),
  S("cre.expansion", "Expansión", 4, ["cre.modelo", "est.recursos"], "Decide cuándo y cómo entrar a nuevos mercados, líneas o regiones sin perder margen."),

  // Riesgo y gobierno
  S("rie.fundamentos", "Lenguaje del riesgo", 1, [], "Distingue probabilidad, impacto y exposición, y ordena riesgos por importancia."),
  S("rie.etica", "Ética y dilemas", 1, [], "Reconoce un dilema ético, a quién afecta y qué líneas no se cruzan."),
  S("rie.cumplimiento", "Cumplimiento y controles", 1, ["rie.fundamentos"], "Entiende para qué sirve una regla o un control y qué pasa cuando falta."),
  S("rie.incertidumbre", "Decidir con incertidumbre", 2, ["rie.fundamentos"], "Decide con información incompleta, cuida sus sesgos y deja abiertas las opciones que convienen."),
  S("rie.entorno", "Entorno económico y político", 2, ["rie.fundamentos"], "Lee cómo inflación, tasas, tipo de cambio, regulación y política afectan a un negocio."),
  S("rie.stakeholders", "Partes interesadas", 2, [], "Identifica quién gana, quién pierde y quién puede frenar una decisión."),
  S("rie.crisis", "Crisis y reputación", 3, ["rie.fundamentos", "lid.comunicacion"], "Ordena las primeras horas de una crisis: hechos, responsables, mensajes y prioridades."),
  S("rie.gobierno", "Gobierno corporativo", 3, ["rie.stakeholders"], "Entiende el papel del consejo, los accionistas y la dirección, y rinde cuentas ante ellos."),
];

export const SKILL_IDS = SKILLS.map((s) => s.id);
const SKILL_MAP: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const skillById = (id: string): Skill | undefined => SKILL_MAP[id];
export const skillsOf = (academy: AcademyId): Skill[] => SKILLS.filter((s) => s.academy === academy);
/** Habilidades presentes en un nivel: las que ya aparecieron en ese tramo o antes. */
export const skillsAt = (level: number, academy?: AcademyId): Skill[] =>
  SKILLS.filter((s) => s.from <= tramoOf(level).n && (!academy || s.academy === academy));

/** Todos los prerrequisitos de una habilidad, directos e indirectos, sin repetir. */
export function allPrereqs(id: string): string[] {
  const out: string[] = [];
  const walk = (x: string) => {
    for (const p of skillById(x)?.pre ?? []) if (!out.includes(p)) { out.push(p); walk(p); }
  };
  walk(id);
  return out;
}

// ───────────────────────────────────────────── temas prioritarios

/**
 * Temas que la persona elige al entrar (mínimo cinco). Están en lenguaje de uso diario y no son las academias:
 * cada tema apunta a una o más habilidades. Sirven para ordenar la ruta, nunca para asignar dominio.
 */
export interface Topic { id: string; name: string; skills: string[] }
export const MIN_PRIORITY_TOPICS = 5;

const T = (id: string, name: string, ...skills: string[]): Topic => ({ id, name, skills });

export const TOPICS: Topic[] = [
  // Estrategia
  T("estrategia-competitiva", "Estrategia competitiva", "est.ventaja", "est.diagnostico"),
  T("entender-el-negocio", "Entender un negocio desde cero", "est.fundamentos", "fin.lenguaje", "cre.cliente"),
  T("priorizar", "Priorizar y decir que no", "est.priorizacion"),
  T("objetivos-e-indicadores", "Objetivos, metas e indicadores", "est.alineacion", "ope.indicadores"),
  T("asignar-recursos", "Asignar presupuesto y gente", "est.recursos"),
  T("escenarios", "Pensar en escenarios", "est.escenarios", "rie.incertidumbre"),
  T("portafolio", "Portafolio de negocios y disrupción", "est.portafolio"),
  // Finanzas
  T("leer-estados-financieros", "Leer estados financieros", "fin.resultados", "fin.balance", "fin.lenguaje"),
  T("flujo-de-caja", "Flujo de caja", "fin.flujo", "fin.capital_trabajo"),
  T("presupuestos", "Presupuestos", "fin.presupuesto"),
  T("costos-y-rentabilidad", "Costos y rentabilidad", "fin.costos", "fin.resultados"),
  T("evaluar-inversiones", "Evaluar inversiones", "fin.inversion"),
  T("deuda-y-financiamiento", "Deuda y financiamiento", "fin.financiamiento"),
  T("valuacion", "Valuación y asignación de capital", "fin.valor"),
  // Liderazgo
  T("liderar-equipos", "Liderar equipos", "lid.equipos", "lid.fundamentos"),
  T("conversaciones-dificiles", "Conversaciones difíciles y retroalimentación", "lid.feedback"),
  T("delegar", "Delegar", "lid.delegacion"),
  T("comunicacion-ejecutiva", "Comunicación ejecutiva", "lid.comunicacion"),
  T("negociacion", "Negociación", "lid.negociacion"),
  T("influencia", "Influir sin autoridad", "lid.influencia"),
  T("desarrollar-talento", "Desarrollar talento", "lid.talento"),
  T("cultura-y-cambio", "Cultura y gestión del cambio", "lid.cultura"),
  // Operaciones
  T("procesos-y-capacidad", "Procesos y capacidad", "ope.procesos", "ope.capacidad"),
  T("calidad", "Calidad", "ope.calidad"),
  T("productividad", "Productividad", "ope.productividad"),
  T("inventarios-y-proveedores", "Inventarios y proveedores", "ope.suministro"),
  T("ejecucion", "Ejecución y seguimiento", "ope.ejecucion"),
  T("mejora-continua", "Mejora continua", "ope.mejora"),
  // Crecimiento
  T("clientes", "Entender al cliente", "cre.cliente", "cre.segmentacion"),
  T("pricing", "Precios", "cre.precios"),
  T("ventas", "Ventas y canales", "cre.canales"),
  T("marketing", "Marketing y adquisición", "cre.marketing"),
  T("retencion", "Retención de clientes", "cre.retencion"),
  T("producto-e-innovacion", "Producto e innovación", "cre.producto"),
  T("modelo-de-negocio", "Modelos de negocio", "cre.modelo"),
  T("expansion", "Expansión a nuevos mercados", "cre.expansion"),
  // Riesgo y gobierno
  T("riesgos", "Gestión de riesgos", "rie.fundamentos", "rie.incertidumbre"),
  T("etica-y-cumplimiento", "Ética y cumplimiento", "rie.etica", "rie.cumplimiento"),
  T("crisis", "Manejo de crisis y reputación", "rie.crisis"),
  T("gobierno-corporativo", "Consejo y gobierno corporativo", "rie.gobierno", "rie.stakeholders"),
  T("entorno-economico", "Entorno económico y político", "rie.entorno"),
];
export const TOPIC_IDS = TOPICS.map((t) => t.id);
export const topicById = (id: string): Topic | undefined => TOPICS.find((t) => t.id === id);
/** Academia a la que un tema pertenece para mostrarlo agrupado: la de su primera habilidad. */
export const topicAcademy = (t: Topic): AcademyId => skillById(t.skills[0])!.academy;

/** Valida una selección de temas: existen, no se repiten y son al menos cinco. */
export function checkTopics(ids: string[]): { ok: boolean; valid: string[]; missing: number } {
  const valid = [...new Set(ids)].filter((id) => !!topicById(id));
  return { ok: valid.length >= MIN_PRIORITY_TOPICS, valid, missing: Math.max(0, MIN_PRIORITY_TOPICS - valid.length) };
}

// ───────────────────────────────────────────── formatos de actividad

export type FormatId = "leccion" | "ejercicio" | "flash" | "aplicado" | "inmersivo" | "encadenado" | "integrador" | "repaso";

export interface Format {
  id: FormatId;
  name: string;
  minutes: [number, number];
  goal: string;
  /** Si su resultado puede contar como evidencia de dominio. Leer teoría no cuenta. */
  evidence: boolean;
}

export const FORMATS: Format[] = [
  { id: "leccion", name: "Lección", minutes: [2, 4], goal: "Entender un concepto con un ejemplo.", evidence: false },
  { id: "ejercicio", name: "Ejercicio", minutes: [1, 2], goal: "Comprobar que el concepto se entendió.", evidence: true },
  { id: "flash", name: "Caso breve", minutes: [1, 2], goal: "Identificar un concepto o criterio puntual en una situación.", evidence: true },
  { id: "aplicado", name: "Caso aplicado", minutes: [3, 6], goal: "Resolver un problema con datos.", evidence: true },
  { id: "inmersivo", name: "Interacción inmersiva", minutes: [4, 8], goal: "Consultar datos, conversar, negociar y justificar.", evidence: true },
  { id: "encadenado", name: "Caso encadenado", minutes: [6, 12], goal: "Ver los efectos de una decisión a lo largo de dos a cuatro situaciones.", evidence: true },
  { id: "integrador", name: "Reto integrador", minutes: [10, 15], goal: "Decidir cruzando de dos a cuatro academias con incertidumbre.", evidence: true },
  { id: "repaso", name: "Repaso y transferencia", minutes: [2, 5], goal: "Comprobar que lo aprendido se conserva y sirve en otro contexto.", evidence: true },
];
export const formatById = (id: FormatId) => FORMATS.find((f) => f.id === id)!;
