import type { ActivityExample, SkillPlan } from "./tipos";

export const PLAN_LIDERAZGO: SkillPlan[] = [
  {
    skill: "lid.fundamentos",
    basics: {
      terms: ["responsabilidad", "autoridad", "rendición de cuentas", "rol", "expectativa", "resultado del equipo"],
      documents: ["organigrama", "descripción de puesto"],
      indicators: ["rotación de personal", "clima laboral"],
    },
    steps: {
      1: "Distingue hacer el trabajo, coordinarlo y dirigirlo, y reconoce de quién es la responsabilidad de un resultado.",
      2: "Aclara por escrito qué espera de una persona de su equipo y cómo sabrán ambos que se cumplió.",
      3: "Analiza por qué un equipo no entrega y separa problemas de claridad, de capacidad y de voluntad.",
      4: "Ajusta su forma de dirigir a un área con presión de resultados sin perder a la gente clave.",
      5: "Dirige un equipo de una especialidad que no domina y explica cómo agrega valor.",
      6: "Asume una organización en crisis de confianza y ordena sus primeras semanas.",
    },
  },
  {
    skill: "lid.comunicacion",
    basics: {
      terms: ["mensaje principal", "audiencia", "conclusión primero", "resumen ejecutivo", "escucha activa"],
      documents: ["correo ejecutivo", "minuta de acuerdos"],
    },
    steps: {
      1: "Reconoce un mensaje que empieza por la conclusión y uno que la esconde.",
      2: "Reescribe un correo largo en tres líneas: qué pasa, qué propone y qué necesita.",
      3: "Adapta el mismo mensaje para el consejo, para el equipo y para un cliente, y explica qué cambia.",
      4: "Comunica una mala noticia con consecuencias financieras y humanas sin maquillarla.",
      5: "Comunica en una cultura o un medio que no conoce y evita los malentendidos previsibles.",
      6: "Da la cara ante empleados, prensa y accionistas con hechos todavía incompletos.",
    },
  },
  {
    skill: "lid.feedback",
    basics: {
      terms: ["hecho observable", "juicio", "efecto", "petición", "acuerdo de seguimiento"],
      documents: ["evaluación de desempeño"],
    },
    steps: {
      1: "Distingue un hecho observable de un juicio sobre la persona.",
      2: "Prepara una retroalimentación con hecho, efecto y petición para un caso dado.",
      3: "Conduce una conversación en la que la otra persona se defiende o se cierra, y elige cómo seguir.",
      4: "Corrige a alguien muy valioso para el resultado cuya conducta daña al equipo.",
      5: "Da retroalimentación hacia arriba, a un jefe o a un consejero, con el mismo rigor.",
      6: "Conduce la salida de un directivo cercano cuidando a la persona, al equipo y a la empresa.",
    },
  },
  {
    skill: "lid.delegacion",
    basics: {
      terms: ["delegar", "nivel de autonomía", "punto de control", "microgestión", "abdicar"],
      indicators: ["compromisos cumplidos a tiempo"],
    },
    steps: {
      1: "Reconoce la diferencia entre delegar, abdicar y microgestionar.",
      2: "Encarga una tarea definiendo resultado, plazo, margen de decisión y puntos de revisión.",
      3: "Decide cuánto margen dar según la experiencia de la persona y el riesgo del encargo.",
      4: "Delega un proyecto que cruza áreas y resuelve quién decide qué.",
      5: "Delega a un equipo remoto o de otra especialidad, donde no puede revisar el trabajo a simple vista.",
      6: "Suelta decisiones que siempre tomó para que la organización crezca, y maneja los errores que vendrán.",
    },
  },
  {
    skill: "lid.talento",
    steps: {
      2: "Identifica qué motiva a tres personas distintas con la información de un caso.",
      3: "Analiza por qué se va la gente de un área y propone qué cambiar primero.",
      4: "Decide a quién promover pesando desempeño, potencial y el mensaje que manda al resto.",
      5: "Diseña el desarrollo de alguien en una función que no conoce bien.",
      6: "Prepara su propia sucesión y la de un puesto crítico con candidatos imperfectos.",
    },
  },
  {
    skill: "lid.equipos",
    steps: {
      2: "Reconoce en un caso las señales de un equipo sin confianza o que evita el conflicto.",
      3: "Interviene en un conflicto entre dos personas separando el problema de las posiciones.",
      4: "Alinea a un equipo directivo cuyas metas de área chocan entre sí.",
      5: "Integra equipos de dos empresas o dos generaciones con formas de trabajar opuestas.",
      6: "Reconstruye un equipo directivo roto en medio de una crisis del negocio.",
    },
  },
  {
    skill: "lid.negociacion",
    steps: {
      2: "Prepara una negociación: intereses de cada parte, mejor alternativa y límite.",
      3: "Analiza una negociación trabada y encuentra un intercambio que crea valor para ambos.",
      4: "Negocia un contrato grande cuidando precio, plazo, caja y relación a largo plazo.",
      5: "Negocia en un terreno desconocido: sindicato, gobierno o un socio de otra cultura.",
      6: "Negocia con varias partes a la vez, bajo presión de tiempo, sabiendo que no todas saldrán contentas.",
    },
  },
  {
    skill: "lid.influencia",
    steps: {
      3: "Hace el mapa de quién apoya, quién duda y quién se opone a una propuesta, y por qué.",
      4: "Consigue el apoyo de áreas que no le reportan para una iniciativa que les cuesta.",
      5: "Gana apoyo en una organización nueva donde aún no tiene historial.",
      6: "Arma una coalición en el consejo para una decisión que divide a los accionistas.",
    },
  },
  {
    skill: "lid.cultura",
    steps: {
      3: "Describe la cultura real de una empresa a partir de lo que se premia, se tolera y se castiga.",
      4: "Diseña los primeros pasos de un cambio que toca procesos, incentivos y costumbres.",
      5: "Conduce un cambio en una organización con historia y reglas distintas a las que conoce.",
      6: "Sostiene un cambio cultural cuando los resultados tardan y los escépticos ganan terreno.",
    },
  },
];

export const EJEMPLOS_LIDERAZGO: ActivityExample[] = [
  {
    id: "ej.lid.1", academy: "liderazgo", level: 1, format: "ejercicio", skills: ["lid.feedback"],
    title: "Hecho o juicio",
    situation: "Daniel, supervisor de un centro de atención telefónica, escribió seis frases para hablar con una agente que llega tarde. Algunas describen lo que pasó; otras opinan sobre ella.",
    ask: "Marca cuáles frases son hechos observables y cuáles son juicios, y reescribe un juicio como hecho.",
    evidence: "Distingue bien las seis y la frase reescrita describe una conducta concreta.",
    contexts: ["centro de atención telefónica"],
  },
  {
    id: "ej.lid.2", academy: "liderazgo", level: 2, format: "aplicado", skills: ["lid.delegacion"],
    title: "Encargar el inventario anual",
    situation: "Eres gerente de una ferretería grande. Vas a encargarle el inventario anual a Paola, que lleva ocho meses en la tienda y nunca lo ha coordinado. Ella te pregunta: «¿Qué necesitas exactamente y para cuándo?».",
    ask: "Redacta el encargo: resultado esperado, fecha, qué puede decidir sola y cuándo revisan avances.",
    evidence: "El encargo incluye los cuatro elementos y el margen de decisión corresponde a su experiencia.",
    contexts: ["ferretería"],
  },
  {
    id: "ej.lid.3", academy: "liderazgo", level: 3, format: "inmersivo", skills: ["lid.feedback", "lid.equipos"],
    title: "La conversación que se cierra",
    situation: "Hablas con Sergio, jefe de turno en una planta de alimentos. Sus compañeros se quejan de su trato. En cuanto mencionas el tema responde: «Yo soy el único que saca la producción, y lo sabes».",
    ask: "Continúa la conversación. Decide qué dices, qué preguntas y qué acuerdo buscas.",
    evidence: "Mantiene el hecho sobre la mesa, escucha su versión y cierra con un compromiso concreto y revisable.",
    contexts: ["planta de alimentos"],
  },
  {
    id: "ej.lid.4", academy: "liderazgo", level: 4, format: "encadenado", skills: ["lid.equipos", "est.alineacion", "fin.presupuesto"],
    title: "Tres directores, tres metas",
    situation: "En una empresa de seguros, ventas cobra por pólizas nuevas, operaciones por costo por trámite y riesgos por siniestralidad. Cada decisión de uno arruina el bono del otro, y las juntas se volvieron una pelea.",
    ask: "A lo largo de tres situaciones, rediseña metas e incentivos y conduce la conversación con los tres directores.",
    evidence: "Cada paso considera el efecto en las otras áreas y el acuerdo final se sostiene con números.",
    contexts: ["seguros"],
  },
  {
    id: "ej.lid.5", academy: "liderazgo", level: 5, format: "repaso", skills: ["lid.negociacion"],
    title: "Negociar en otro terreno",
    situation: "Preparaste la negociación de precios con un proveedor de empaques. Ahora te toca la revisión del contrato colectivo con el sindicato de un hotel, con el delegado sentado enfrente y temporada alta en tres semanas.",
    ask: "Prepara intereses, alternativas y límites, y explica qué cambia frente a negociar con un proveedor.",
    evidence: "Usa la misma preparación y reconoce al menos dos diferencias de fondo: relación permanente y terceros afectados.",
    contexts: ["manufactura de empaques", "hotelería"],
  },
  {
    id: "ej.lid.6", academy: "liderazgo", level: 6, format: "integrador", skills: ["lid.influencia", "lid.comunicacion", "rie.crisis", "rie.gobierno"],
    title: "El consejo dividido",
    situation: "Tras una falla grave de servicio en una empresa de telecomunicaciones, dos consejeros piden la salida del director de tecnología y otros dos lo defienden. Los empleados ya se enteraron por un mensaje filtrado y la presidenta del consejo te llama esta noche.",
    ask: "Decide qué propones, a quién buscas primero y qué comunicas mañana al equipo.",
    evidence: "Ordena prioridades con hechos incompletos, arma apoyos y comunica sin prometer lo que no sabe.",
    contexts: ["telecomunicaciones"],
  },
];
