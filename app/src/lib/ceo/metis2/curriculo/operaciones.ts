import type { ActivityExample, SkillPlan } from "./tipos";

export const PLAN_OPERACIONES: SkillPlan[] = [
  {
    skill: "ope.procesos",
    basics: {
      terms: ["proceso", "entrada y salida", "paso", "responsable", "tiempo de ciclo", "retrabajo"],
      documents: ["diagrama de flujo", "procedimiento escrito"],
      indicators: ["tiempo de ciclo"],
    },
    steps: {
      1: "Reconoce los pasos, entradas, salidas y responsables de un proceso sencillo.",
      2: "Dibuja el flujo de un proceso descrito en texto y marca dónde se espera o se repite trabajo.",
      3: "Analiza dónde se pierde tiempo en un proceso y cuál paso no agrega valor para el cliente.",
      4: "Rediseña un proceso que cruza ventas, operación y cobranza sin pasarle el problema a otra área.",
      5: "Mapea un proceso de un tipo de negocio distinto, como uno de servicio si conoce manufactura.",
      6: "Decide qué procesos se estandarizan y cuáles se dejan flexibles cuando la empresa crece rápido.",
    },
  },
  {
    skill: "ope.indicadores",
    basics: {
      terms: ["indicador", "meta", "tendencia", "promedio", "línea base", "indicador de resultado y de avance"],
      documents: ["tablero de operación", "reporte diario de producción"],
      indicators: ["entregas a tiempo", "productividad por persona", "defectos por cada cien"],
    },
    steps: {
      1: "Lee un indicador: qué mide, en qué unidad y si conviene que suba o baje.",
      2: "Calcula un indicador con datos dados y lo compara contra su meta.",
      3: "Detecta un indicador que mejora mientras el resultado real empeora, y explica por qué.",
      4: "Elige los pocos indicadores que conectan la operación con el resultado financiero y con el cliente.",
      5: "Propone indicadores para una operación que no conoce a partir de qué valora su cliente.",
      6: "Cambia los indicadores de una organización que aprendió a cumplirlos sin mejorar.",
    },
  },
  {
    skill: "ope.calidad",
    basics: {
      terms: ["calidad", "especificación", "defecto", "costo de la mala calidad", "causa raíz", "inspección y prevención"],
      documents: ["reporte de quejas", "hoja de inspección"],
      indicators: ["defectos por cada cien", "devoluciones", "reclamaciones"],
    },
    steps: {
      1: "Reconoce qué espera el cliente y qué cuenta como defecto en un producto o servicio.",
      2: "Calcula cuánto cuestan las devoluciones y los retrabajos con datos dados.",
      3: "Busca la causa raíz de un defecto que se repite, más allá de la persona que lo cometió.",
      4: "Decide cuánto invertir en prevenir pesando costo, precio y reputación.",
      5: "Define calidad en un servicio, donde el defecto no se ve hasta que el cliente se queja.",
      6: "Decide un retiro de producto o una suspensión de servicio con datos incompletos.",
    },
  },
  {
    skill: "ope.capacidad",
    basics: {
      terms: ["capacidad", "demanda", "cuello de botella", "utilización", "tiempo ocioso", "turno"],
      documents: ["plan de producción", "rol de turnos"],
      indicators: ["utilización de capacidad"],
    },
    steps: {
      1: "Reconoce qué es la capacidad de un proceso y qué es un cuello de botella.",
      2: "Calcula la capacidad por hora de cada paso y encuentra el más lento.",
      3: "Analiza si conviene agregar turno, máquina o gente, con costos y demanda dados.",
      4: "Decide una ampliación de capacidad pesando inversión, caja, demanda incierta y contratación.",
      5: "Calcula capacidad en un negocio de servicios, donde la gente es el recurso que limita.",
      6: "Maneja una demanda que rebasa la capacidad: a quién se atiende primero y qué se le dice al resto.",
    },
  },
  {
    skill: "ope.productividad",
    steps: {
      2: "Calcula productividad y merma con los datos de una semana.",
      3: "Explica por qué dos turnos o dos sucursales con los mismos recursos producen distinto.",
      4: "Mejora la productividad sin dañar calidad, seguridad ni clima laboral.",
      5: "Mide productividad en trabajo de oficina o creativo, donde no hay piezas que contar.",
      6: "Decide una automatización que cambia puestos de trabajo y conduce sus consecuencias.",
    },
  },
  {
    skill: "ope.suministro",
    steps: {
      2: "Calcula días de inventario y punto de reorden con consumo y tiempo de entrega dados.",
      3: "Analiza el equilibrio entre tener de más y quedarse sin producto, con sus costos.",
      4: "Elige proveedores pesando precio, plazo, confiabilidad y dependencia.",
      5: "Diseña el abasto de un negocio con producto perecedero o de moda, distinto al que conoce.",
      6: "Rearma la cadena de suministro tras la caída de un proveedor clave o un cierre de frontera.",
    },
  },
  {
    skill: "ope.ejecucion",
    steps: {
      2: "Convierte un plan en compromisos con responsable y fecha, y arma la agenda de revisión.",
      3: "Analiza por qué un proyecto se atrasa y distingue problemas de plan, de recursos y de seguimiento.",
      4: "Coordina un lanzamiento que depende de cuatro áreas con prioridades distintas.",
      5: "Monta el ritmo de seguimiento en un equipo con otra forma de trabajar, como uno de tecnología.",
      6: "Recupera un proyecto crítico que va tarde, con el cliente presionando y el equipo agotado.",
    },
  },
  {
    skill: "ope.mejora",
    steps: {
      3: "Plantea un ciclo de mejora: problema medible, causa, prueba en pequeño y verificación.",
      4: "Prioriza mejoras por su efecto en costo, servicio y gente, y consigue que se adopten.",
      5: "Lleva una práctica de mejora de la fábrica a un área administrativa o comercial.",
      6: "Conduce una transformación de la operación mientras el negocio sigue funcionando.",
    },
  },
];

export const EJEMPLOS_OPERACIONES: ActivityExample[] = [
  {
    id: "ej.ope.1", academy: "operaciones", level: 1, format: "ejercicio", skills: ["ope.indicadores"],
    title: "Leer el tablero de la mañana",
    situation: "Es tu primer lunes como coordinador en una empresa de mensajería. En la pared hay un tablero con cinco indicadores de la semana pasada: entregas a tiempo, paquetes por repartidor, quejas, paquetes dañados y horas extra.",
    ask: "Di qué mide cada indicador, en cuáles conviene que el número suba y cuál de los cinco pide atención hoy.",
    evidence: "Interpreta bien los cinco y elige el que se alejó más de su meta.",
    contexts: ["mensajería"],
  },
  {
    id: "ej.ope.2", academy: "operaciones", level: 2, format: "aplicado", skills: ["ope.capacidad", "ope.procesos"],
    title: "Dónde se atora la cocina",
    situation: "Un restaurante de comida corrida tarda demasiado entre la una y las tres de la tarde. La encargada, Irene, te da los tiempos de cada estación: toma de orden, preparación, plancha, emplatado y cobro.",
    ask: "Calcula cuántos platos por hora puede sacar cada estación y señala el cuello de botella.",
    evidence: "Los cálculos son correctos e identifica la estación que limita al resto.",
    contexts: ["restaurante"],
  },
  {
    id: "ej.ope.3", academy: "operaciones", level: 3, format: "aplicado", skills: ["ope.calidad", "ope.mejora"],
    title: "El defecto que siempre vuelve",
    situation: "En una fábrica de muebles, una de cada doce puertas de clóset regresa por descuadre. El supervisor culpa al turno de noche. Tienes las devoluciones por turno, por lote de madera y por máquina.",
    ask: "Encuentra la causa más probable con los datos y propone una prueba pequeña para confirmarla.",
    evidence: "Usa los cruces de datos, descarta la explicación fácil y propone una prueba verificable.",
    contexts: ["fabricación de muebles"],
  },
  {
    id: "ej.ope.4", academy: "operaciones", level: 4, format: "inmersivo", skills: ["ope.capacidad", "fin.inversion", "cre.canales"],
    title: "Ampliar la planta o decir que no",
    situation: "Una embotelladora regional recibe la propuesta de una cadena de supermercados que duplicaría su volumen. La planta está al 85 % de su capacidad. Ventas quiere firmar hoy, finanzas teme la deuda y el jefe de planta dice que un tercer turno no es sostenible.",
    ask: "Decide si aceptas, con qué condiciones, y cómo cubrirías la capacidad. Puedes consultar a cada área.",
    evidence: "Cruza capacidad, inversión y dependencia de un solo cliente, y pone condiciones concretas.",
    contexts: ["embotelladora"],
  },
  {
    id: "ej.ope.5", academy: "operaciones", level: 5, format: "repaso", skills: ["ope.capacidad"],
    title: "El cuello de botella en una clínica",
    situation: "Encontraste el cuello de botella en la cocina de un restaurante. Ahora ves una clínica de consulta externa con salas llenas: recepción, toma de signos, consulta, laboratorio y caja, cada una con sus tiempos.",
    ask: "Encuentra el paso que limita la atención y explica qué cambia cuando lo que espera es una persona enferma y no un plato.",
    evidence: "Aplica el mismo método y reconoce una restricción propia del servicio de salud.",
    contexts: ["restaurante", "clínica"],
  },
  {
    id: "ej.ope.6", academy: "operaciones", level: 6, format: "integrador", skills: ["ope.suministro", "rie.crisis", "fin.flujo"],
    title: "El proveedor único cerró",
    situation: "El único proveedor de un componente de una ensambladora de electrodomésticos suspendió operaciones por un incendio. Hay inventario para once días, tres clientes con penalización por retraso y dos proveedores alternos más caros que nunca se han probado.",
    ask: "Decide cómo se abastece la planta, qué clientes se atienden primero y qué se les comunica.",
    evidence: "Prioriza con datos incompletos, calcula el efecto en caja y comunica a cada cliente con claridad.",
    contexts: ["ensamble de electrodomésticos"],
  },
];
