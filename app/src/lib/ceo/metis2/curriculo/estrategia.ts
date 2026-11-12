import type { ActivityExample, SkillPlan } from "./tipos";

export const PLAN_ESTRATEGIA: SkillPlan[] = [
  {
    skill: "est.fundamentos",
    basics: {
      terms: ["objetivo", "prioridad", "propuesta de valor", "competidor", "ventaja competitiva", "misión y visión"],
      documents: ["plan estratégico de una página"],
      indicators: ["participación de mercado"],
    },
    steps: {
      1: "Distingue un objetivo de una actividad y reconoce la propuesta de valor de un negocio conocido.",
      2: "Redacta en una frase a quién sirve un negocio, con qué y por qué lo eligen.",
      3: "Detecta cuándo una estrategia es solo una lista de deseos y explica qué le falta.",
      4: "Explica cómo la estrategia elegida condiciona las finanzas, la operación y la gente.",
      5: "Describe la estrategia de un negocio de una industria que no conoce a partir de sus datos.",
      6: "Formula una estrategia con información incompleta y la sostiene ante un consejo que la cuestiona.",
    },
  },
  {
    skill: "est.diagnostico",
    steps: {
      2: "Ordena los hechos de un caso en síntomas y causas probables.",
      3: "Usa un marco de análisis (fuerzas de la industria, fortalezas y debilidades) para explicar por qué cae el resultado.",
      4: "Cruza datos de clientes, costos y gente para llegar a un solo diagnóstico.",
      5: "Diagnostica un negocio de otra industria y señala qué supuestos de la suya no aplican.",
      6: "Diagnostica con datos contradictorios y dice qué información pediría y cuál no puede esperar.",
    },
  },
  {
    skill: "est.ventaja",
    basics: {
      terms: ["ventaja competitiva", "diferenciación", "liderazgo en costos", "nicho", "barrera de entrada"],
      indicators: ["participación de mercado", "precio frente a la competencia"],
    },
    steps: {
      1: "Reconoce si un negocio compite por precio, por diferenciación o por nicho.",
      2: "Identifica qué hace distinto a un negocio frente a dos competidores, con datos dados.",
      3: "Evalúa qué tan fácil es copiar una ventaja y cuánto puede durar.",
      4: "Decide una inversión para sostener la ventaja pesando su costo y su efecto en el margen.",
      5: "Identifica la fuente de ventaja en una industria con reglas distintas, como plataformas o servicios regulados.",
      6: "Decide si defender una ventaja que se erosiona o abandonarla, con el equipo dividido.",
    },
  },
  {
    skill: "est.priorizacion",
    basics: {
      terms: ["prioridad", "costo de oportunidad", "urgente e importante", "foco", "renuncia"],
      documents: ["lista de iniciativas del año"],
    },
    steps: {
      1: "Distingue lo urgente de lo importante y reconoce el costo de oportunidad de elegir.",
      2: "Ordena cinco iniciativas con un criterio explícito de impacto y esfuerzo.",
      3: "Compara dos prioridades que compiten por el mismo recurso y justifica la renuncia.",
      4: "Recorta un plan con finanzas y operaciones en desacuerdo, y explica a cada uno lo que pierde.",
      5: "Prioriza en un negocio ajeno, donde lo valioso se mide de otra manera.",
      6: "Sostiene una renuncia impopular ante el consejo y el equipo cuando aparecen presiones nuevas.",
    },
  },
  {
    skill: "est.alineacion",
    basics: {
      terms: ["meta", "indicador", "responsable", "cascada de objetivos", "tablero de indicadores"],
      documents: ["tablero de indicadores (scorecard)"],
      indicators: ["avance contra meta"],
    },
    steps: {
      1: "Reconoce una meta bien escrita: qué, cuánto, para cuándo y quién responde.",
      2: "Convierte una prioridad en dos o tres metas con indicador y responsable.",
      3: "Detecta metas de área que se contradicen entre sí o con la estrategia.",
      4: "Rediseña el tablero para que ventas, operación y finanzas empujen hacia lo mismo.",
      5: "Arma la cascada de objetivos de un negocio de otro tipo: servicio, manufactura o digital.",
      6: "Corrige el rumbo a mitad de año cuando los indicadores van bien y el negocio va mal.",
    },
  },
  {
    skill: "est.recursos",
    steps: {
      3: "Reparte un presupuesto limitado entre iniciativas y explica el criterio.",
      4: "Mueve gente y dinero de un área rentable hoy a una apuesta de futuro, y maneja la resistencia.",
      5: "Asigna recursos en un negocio con ciclos e inversiones muy distintos a los que conoce.",
      6: "Reasigna en plena crisis de caja, con compromisos ya hechos con clientes y equipo.",
    },
  },
  {
    skill: "est.escenarios",
    steps: {
      3: "Construye dos o tres escenarios a partir de las incertidumbres clave y sus señales.",
      4: "Diseña una decisión que funcione razonablemente en varios escenarios y calcula su costo.",
      5: "Anticipa reacciones de competidores y reguladores en un mercado que no conoce.",
      6: "Decide cuando los escenarios cambian a media ejecución y explica qué mantiene y qué suelta.",
    },
  },
  {
    skill: "est.portafolio",
    steps: {
      4: "Clasifica las líneas de negocio por atractivo y posición, y propone dónde invertir, mantener o salir.",
      5: "Evalúa la entrada de un competidor disruptivo en otra industria y traduce la lección a la suya.",
      6: "Decide una apuesta muy difícil de revertir, como vender una unidad o fusionarse, con información parcial.",
    },
  },
];

export const EJEMPLOS_ESTRATEGIA: ActivityExample[] = [
  {
    id: "ej.est.1", academy: "estrategia", level: 1, format: "ejercicio", skills: ["est.fundamentos"],
    title: "Objetivo o actividad",
    situation: "Laura tiene tres cafeterías y te enseña su plan del año: nueve frases escritas en una hoja. Algunas dicen a dónde quiere llegar, otras solo describen tareas.",
    ask: "Separa cuáles son objetivos, cuáles son actividades y cuál describe su propuesta de valor.",
    evidence: "Clasifica bien al menos siete de nueve y explica una con sus propias palabras.",
    contexts: ["cafeterías"],
  },
  {
    id: "ej.est.2", academy: "estrategia", level: 2, format: "aplicado", skills: ["est.priorizacion"],
    title: "Cinco iniciativas, presupuesto para dos",
    situation: "En una distribuidora de materiales de construcción, el gerente comercial y la gerente de logística defienden iniciativas distintas. Tienes una tabla con el impacto esperado y el esfuerzo de cada una.",
    ask: "Ordena las cinco iniciativas con un criterio explícito y di cuáles dos se hacen este año.",
    evidence: "El orden es coherente con el criterio declarado y nombra a qué se renuncia.",
    contexts: ["distribución de materiales"],
  },
  {
    id: "ej.est.3", academy: "estrategia", level: 3, format: "aplicado", skills: ["est.diagnostico", "est.ventaja", "fin.resultados"],
    title: "Vendemos más y ganamos menos",
    situation: "Una cadena de gimnasios creció en afiliados, pero su utilidad bajó. Abrió un competidor de bajo costo a dos cuadras de sus sucursales principales. Tienes afiliaciones, precio promedio y bajas por sucursal.",
    ask: "Explica la causa principal de la caída y descarta, con datos, una explicación que suena razonable pero no se sostiene.",
    evidence: "Separa síntoma de causa, usa los datos por sucursal y descarta al menos una hipótesis.",
    contexts: ["gimnasios"],
  },
  {
    id: "ej.est.4", academy: "estrategia", level: 4, format: "inmersivo", skills: ["est.recursos", "fin.presupuesto", "lid.negociacion"],
    title: "El presupuesto no alcanza para todo",
    situation: "Junta de presupuesto en una fábrica de empaques. El director de finanzas pide cuidar la caja, el de operaciones exige la línea nueva y recursos humanos advierte que sin ajuste salarial se va gente clave. Puedes preguntarle a cada uno antes de decidir.",
    ask: "Reparte el presupuesto, defiende el reparto y dile a cada director qué pierde y por qué.",
    evidence: "La decisión cruza las tres áreas, cuantifica lo que se sacrifica y anticipa la reacción de quien pierde.",
    contexts: ["manufactura de empaques"],
  },
  {
    id: "ej.est.5", academy: "estrategia", level: 5, format: "repaso", skills: ["est.ventaja"],
    title: "La misma pregunta en otro negocio",
    situation: "Ya analizaste por qué los clientes prefieren a una cadena de farmacias de barrio. Ahora recibes los datos de una empresa de software de nómina por suscripción que pierde clientes frente a un rival más barato.",
    ask: "Identifica de dónde viene la ventaja del software y qué de lo que aprendiste con las farmacias no aplica aquí.",
    evidence: "Aplica el mismo principio en el contexto nuevo y señala una diferencia real entre las dos industrias.",
    contexts: ["farmacias", "software por suscripción"],
  },
  {
    id: "ej.est.6", academy: "estrategia", level: 6, format: "integrador", skills: ["est.portafolio", "fin.valor", "rie.gobierno"],
    title: "La oferta por la división más antigua",
    situation: "Un grupo familiar recibe una oferta de compra por su división más antigua, la que le dio nombre. Los números que tienes son parciales, dos hermanos accionistas están en desacuerdo y el banco pide una respuesta sobre la deuda en diez días.",
    ask: "Recomienda vender, conservar o buscar otra salida, y prepara cómo lo presentarás al consejo familiar.",
    evidence: "Decide con lo que hay, dice qué no sabe, pesa valor, gobierno y personas, y deja una ruta defendible aunque el resultado sea incierto.",
    contexts: ["grupo familiar diversificado"],
  },
];
