/**
 * MÊTIS 2.0 · Repositorio Académico · lote 03 (paquete 1.2) · EDIT-N1-016 · Operaciones
 * «El tablero está en verde, pero los clientes esperan»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir. Las cifras son las del paquete, sin cambios.
 */
import type { Experiencia } from "./tipos";

export const N1_OPERACIONES_TABLERO_EN_VERDE: Experiencia = {
  id: "exp.n1.ope.el-tablero-esta-en-verde",
  editorialId: "EDIT-N1-016",
  slug: "el-tablero-esta-en-verde",
  version: 1,
  packageVersion: "1.2",
  title: "El tablero está en verde, pero los clientes esperan",
  academy: "operaciones",
  skills: { primary: "ope.indicadores", secondary: ["ope.procesos"] },
  level: 1,
  sourceIds: ["INSEAD_CORE", "STAN_CORE"],
  provenance: "creacion_original",
  minutes: [6, 8],
  objectives: [
    "Identificar qué mide un indicador y en qué unidad.",
    "Distinguir un volumen de una tasa.",
    "Relacionar una meta de servicio con el indicador apropiado.",
    "Reconocer que un indicador favorable no implica que todos mejoraron.",
  ],
  characters: [{ id: "isabel", name: "Isabel", role: "Supervisora de un servicio de lunch corporativo" }],
  docs: [
    {
      id: "A", letter: "A", title: "Tablero de dos semanas", unit: "Servicio de lunch corporativo", cols: ["Indicador", "Semana 1", "Semana 2", "Objetivo"], layout: "ficha",
      rows: [
        { id: "A.entregados", label: "Pedidos entregados", cells: ["80", "100", "Informativo, sin meta de volumen"], nota: { origen: "conversion", text: "Es un volumen: cuántos pedidos salieron. No dice cuántos llegaron a la hora comprometida." } },
        { id: "A.atiempo", label: "Pedidos a tiempo", cells: ["72", "85", "Al menos 90 % de los pedidos del periodo"], nota: { origen: "adaptado", text: "La meta es un porcentaje. Para compararla hay que dividir los pedidos a tiempo entre los pedidos entregados de esa misma semana." } },
        { id: "A.defecto", label: "Pedidos con defecto reportado", cells: ["4", "3", "Máximo 4 % del total"], nota: { origen: "conversion", text: "También tiene meta en porcentaje: se lee como proporción de los pedidos de la semana." } },
        { id: "A.horas", label: "Horas de trabajo del equipo", cells: ["40", "50", "Informativo"], nota: { origen: "conversion", text: "Con los pedidos entregados da una productividad simple: pedidos por hora de trabajo." } },
      ],
    },
    {
      id: "B", letter: "B", title: "Objetivo de la empresa y alerta de un cliente", unit: "Lo que se comunicó y lo que se recibió", cols: ["Pieza", "Texto"], layout: "ficha",
      rows: [
        { id: "B.objetivo", label: "Objetivo de servicio", cells: ["Que al menos 9 de cada 10 pedidos lleguen en la fecha y hora comprometida."], nota: { origen: "conversion", text: "El objetivo habla de proporción (9 de cada 10), no de cuántos pedidos se entregan." } },
        { id: "B.comentario", label: "Comentario de un cliente", cells: ["Me avisaron que habían terminado todos los pedidos del día, pero el mío llegó después del horario acordado."], nota: { origen: "conversion", text: "Terminar todos los pedidos es volumen. Al cliente le importó la hora." } },
      ],
    },
  ],
  moments: ["La sala", "El tablero", "Las tasas", "Qué cambió", "El indicador", "La evidencia", "Dato nuevo", "La nota", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "isabel", channel: "Sala de operaciones",
      text: "Nuestro tablero está más verde que la semana pasada: entregamos más pedidos. Pero los clientes se quejan de que llegan tarde. ¿Cuál número debo observar para saber si realmente mejoró el servicio?",
      role: "Acompañas a Isabel frente al tablero. Antes de opinar, hay que saber qué mide cada número y con qué meta se compara.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "El tablero y el objetivo de servicio",
      prompt: "Toca cada indicador para ver qué mide. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "tasas",
    },
    {
      id: "tasas", kind: "calcular", moment: 2, origen: "adaptado", from: "isabel",
      text: "El tablero trae cantidades, y las metas están en porcentaje. Saquemos las tasas de cada semana.",
      prompt: "Escribe cada resultado. Puedes usar la calculadora.",
      docs: ["A"],
      fields: [
        { id: "punt1", label: "Puntualidad, semana 1", answer: 90, unit: "%", hint: "Pedidos a tiempo de la semana 1 entre pedidos entregados de la semana 1, por cien.", calc: "72 ÷ 80 × 100 = 90" },
        { id: "punt2", label: "Puntualidad, semana 2", answer: 85, unit: "%", hint: "Pedidos a tiempo de la semana 2 entre pedidos entregados de la semana 2, por cien.", calc: "85 ÷ 100 × 100 = 85" },
        { id: "def1", label: "Pedidos con defecto, semana 1", answer: 5, unit: "%", hint: "Pedidos con defecto de la semana 1 entre pedidos entregados de la semana 1, por cien.", calc: "4 ÷ 80 × 100 = 5" },
        { id: "def2", label: "Pedidos con defecto, semana 2", answer: 3, unit: "%", hint: "Pedidos con defecto de la semana 2 entre pedidos entregados de la semana 2, por cien.", calc: "3 ÷ 100 × 100 = 3" },
        { id: "hora1", label: "Pedidos por hora, semana 1", answer: 2, unit: "", hint: "Pedidos entregados de la semana 1 entre horas de trabajo de la semana 1.", calc: "80 ÷ 40 = 2" },
        { id: "hora2", label: "Pedidos por hora, semana 2", answer: 2, unit: "", hint: "Pedidos entregados de la semana 2 entre horas de trabajo de la semana 2.", calc: "100 ÷ 50 = 2" },
      ],
      right: "El 85 % de la semana 2 significa que 85 de 100 entregas cumplieron el horario. Es puntualidad, no productividad: la productividad simple fue de 2 pedidos por hora en las dos semanas.",
      next: "comparar",
    },
    {
      id: "comparar", kind: "clasificar", moment: 3, origen: "fuente", from: "isabel",
      text: "De la semana 1 a la semana 2, ¿qué subió, qué bajó y qué no cambió?",
      prompt: "Pon cada resultado en su lugar.",
      docs: ["A"],
      groups: [{ id: "subio", label: "Subió" }, { id: "bajo", label: "Bajó" }, { id: "igual", label: "No cambió" }],
      items: [
        { id: "puntualidad", text: "Puntualidad: porcentaje de pedidos a tiempo", group: "bajo", why: "Pasó de 90 % a 85 %, aunque los pedidos a tiempo subieron de 72 a 85." },
        { id: "volumen", text: "Volumen: pedidos entregados", group: "subio", why: "Pasó de 80 a 100 pedidos." },
        { id: "ritmo", text: "Pedidos por hora de trabajo", group: "igual", why: "Fueron 2 pedidos por hora en las dos semanas." },
        { id: "defectos", text: "Tasa de defectos: porcentaje de pedidos con defecto", group: "bajo", why: "Pasó de 5 % a 3 %. En esta señal, bajar es mejorar." },
      ],
      right: "Subió el volumen, bajó la puntualidad, bajó la tasa de defectos y los pedidos por hora no cambiaron. Un número absoluto puede subir mientras la tasa empeora.",
      next: "indicador",
    },
    {
      id: "indicador", kind: "decision", moment: 4, origen: "fuente", from: "isabel", text: "Entonces, ¿con cuál número sigo el objetivo de servicio?",
      options: [
        {
          id: "volumen", tipo: "concepto_erroneo", origen: "adaptado", next: "evidencia",
          text: "Con la cantidad total de pedidos entregados: si salen más pedidos, el servicio mejora.",
          consequence: [{ who: "isabel", text: "Eso es lo que marca el tablero en verde. Pero el cliente que se quejó recibió su pedido, solo que tarde." }],
          feedback: "Hay más volumen, pero 85 % está debajo de 90 %. Volumen y puntualidad son medidas distintas: entregar más no prueba que mejoró la entrega puntual.",
        },
        {
          id: "puntualidad", tipo: "defendible", origen: "fuente", next: "evidencia",
          text: "Con la puntualidad: el porcentaje de entregas que llegan a tiempo, comparado con la meta.",
          consequence: [{ who: "isabel", text: "Entonces la semana 2 no fue mejor: 85 % contra una meta de 90 %. Eso no se veía en el tablero." }],
          feedback: "Comparaste tasas, no solamente cantidades, y usaste la meta correcta. La puntualidad es lo único del tablero que mide directamente el objetivo comunicado.",
        },
        {
          id: "horas", tipo: "concepto_erroneo", origen: "adaptado", next: "evidencia",
          text: "Con las horas de trabajo del equipo: si se trabaja más tiempo, los pedidos llegan a su hora.",
          consequence: [{ who: "isabel", text: "Trabajamos 50 horas en vez de 40 y aun así llegaron más pedidos tarde. Las horas no me lo explican." }],
          feedback: "Las horas sirven para otros fines, como calcular pedidos por hora, pero no dicen si un pedido llegó en el horario comprometido.",
        },
      ],
    },
    {
      id: "evidencia", kind: "decision", moment: 5, origen: "adaptado", from: "isabel", text: "Antes de decir por qué pasó, ¿qué pido?",
      options: [
        {
          id: "horario", tipo: "defendible", origen: "fuente", next: "tarde",
          text: "La lista de las entregas tardías de la semana 2, con el horario y la ruta de cada una.",
          consequence: [{ who: "isabel", text: "La pido ahora. Con eso vemos dónde se juntan los retrasos antes de suponer nada." }],
          feedback: "El registro por horario y ruta se liga directamente al indicador: dice dónde están los pedidos tardíos sin suponer todavía una causa.",
        },
        {
          id: "personal", tipo: "concepto_erroneo", origen: "adaptado", next: "tarde",
          text: "El detalle del personal de la semana 2, para confirmar que con tanto volumen faltó gente.",
          consequence: [{ who: "isabel", text: "Puede servir, pero ya vas con una causa en mente. Primero pido la lista de tardíos, para ver dónde ocurren." }],
          feedback: "Del volumen no se puede afirmar que faltó personal. Pedir datos para confirmar una causa ya elegida es distinto de pedir datos para encontrarla.",
        },
        {
          id: "comentarios", tipo: "riesgosa", origen: "adaptado", next: "tarde",
          text: "Los comentarios de clientes de la semana 2, para saber quiénes se quejaron y de qué.",
          consequence: [{ who: "isabel", text: "Dan contexto, pero no todos los que recibieron tarde escriben. Pido también la lista de tardíos por horario." }],
          feedback: "Los comentarios aportan contexto, pero solo de quienes escribieron. El registro de entregas tardías cubre todos los casos que cuenta el indicador.",
        },
      ],
    },
    {
      id: "tarde", kind: "dato", moment: 6, origen: "fuente", title: "Llega la lista de entregas tardías de la semana 2",
      items: ["11 de los 15 pedidos tardíos de la semana 2 salieron en el horario de la tarde.", "Todavía no se sabe por qué."],
      calc: "100 − 85 = 15 pedidos tardíos; 11 + 4 = 15.",
      next: "lectura",
    },
    {
      id: "lectura", kind: "decision", moment: 6, origen: "adaptado", from: "isabel", text: "Once de quince, en la tarde. ¿Qué le digo al equipo?",
      options: [
        {
          id: "conductor", tipo: "concepto_erroneo", origen: "adaptado", next: "nota",
          text: "Que la causa está en el reparto de la tarde y hay que cambiar a quien conduce ese turno.",
          consequence: [{ who: "isabel", text: "No tengo nada que diga que fue el conductor. Podría ser la cocina, el tránsito u otra cosa." }],
          feedback: "El tablero no permite atribuir el problema a una persona o estación; necesitamos investigar. El dato dice cuándo ocurre, no por qué.",
        },
        {
          id: "esperar", tipo: "riesgosa", origen: "conversion", next: "nota",
          text: "Que once de quince no prueba nada y es mejor esperar otra semana antes de mirar algo.",
          consequence: [{ who: "isabel", text: "Otra semana son más clientes esperando. El dato no da la causa, pero sí me dice dónde empezar a mirar." }],
          feedback: "Es cierto que el dato no prueba el motivo, pero un indicador sirve para detectar dónde investigar. Esperar sin revisar deja pasar esa señal.",
        },
        {
          id: "concentra", tipo: "defendible", origen: "fuente", next: "nota",
          text: "Que el problema se concentra en la tarde y aún no conocemos la causa: toca revisar ese horario.",
          consequence: [{ who: "isabel", text: "Así lo digo: se concentra en la tarde y falta saber por qué. Mañana revisamos ese horario paso por paso." }],
          feedback: "Dijiste lo que el dato muestra y lo que falta saber. Distinguir la observación de la causa evita señalar a alguien sin evidencia.",
        },
      ],
    },
    {
      id: "nota", kind: "redactar", moment: 7, origen: "fuente", from: "isabel",
      ask: "Mándame una nota breve con lo que vimos, para compartirla.",
      prompt: "Escribe la nota para Isabel con tus palabras.",
      reference: "Subió el volumen a 100, pero la puntualidad cayó de 90 % a 85 %, por debajo de nuestra meta. Conviene revisar las tardes antes de atribuir una causa.",
      ideas: ["Nombra el indicador que responde al objetivo: la puntualidad.", "Da la unidad y la tendencia: de 90 % a 85 %.", "La compara con la meta de 90 %.", "Dice dónde revisar sin atribuir una causa."],
      next: "cierre",
    },
    { id: "cierre", kind: "cierre", moment: 8, origen: "conversion", text: "Terminaste la práctica con Isabel. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.ope.leer-un-indicador", title: "Cómo se lee un indicador", origen: "fuente",
    text: "Un indicador resume algo que un negocio quiere observar: volumen, calidad, productividad, plazo o satisfacción. Para interpretarlo conviene saber qué mide, en qué unidad, cuál es la meta y contra qué periodo se compara. Un número absoluto puede subir mientras la tasa empeora. Por ejemplo, entregar más pedidos no garantiza entregar una mayor proporción a tiempo. Un tablero puede tener varias señales positivas y, aun así, incumplir el resultado que más le importa al cliente. El indicador sirve para detectar dónde investigar; rara vez prueba por sí solo cuál es la causa del problema.",
  },
  calculations: [
    "72 ÷ 80 = 0.9 (90 % de puntualidad en la semana 1)",
    "85 ÷ 100 = 0.85 (85 % de puntualidad en la semana 2)",
    "4 ÷ 80 = 0.05 (5 % de pedidos con defecto en la semana 1)",
    "3 ÷ 100 = 0.03 (3 % de pedidos con defecto en la semana 2)",
    "80 ÷ 40 = 2; 100 ÷ 50 = 2 (pedidos por hora en cada semana)",
    "100 − 85 = 15; 11 + 4 = 15 (pedidos tardíos de la semana 2)",
  ],
  variant: {
    id: "exp.n1.ope.el-tablero-esta-en-verde.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Una clínica veterinaria atiende citas programadas y compara dos semanas. Nadie te explica los datos: lee, calcula y responde.",
    question: "¿El servicio mejoró o empeoró al atender más citas, y qué falta saber?",
    intro: "Otro lugar y otras cifras. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Hay calculadora. Una parte se comprueba sola; lo que escribas queda en espera de revisión de una persona.",
    calculator: true,
    docs: [
      {
        id: "V", letter: "V", title: "Citas programadas · dos semanas", unit: "Datos de la clínica", cols: ["Dato", "Semana A", "Semana B"],
        rows: [
          { id: "V.citas", label: "Citas de la semana", cells: ["40", "50"] },
          { id: "V.atiempo", label: "Citas atendidas a tiempo", cells: ["36", "41"] },
          { id: "V.errores", label: "Formularios con error", cells: ["2", "3"] },
        ],
      },
      {
        id: "W", letter: "W", title: "Metas de la clínica", unit: "Vigentes en las dos semanas",
        rows: [
          { id: "W.puntualidad", label: "Puntualidad: al menos 90 % de las citas atendidas a tiempo." },
          { id: "W.errores", label: "Errores: máximo 5 % de las citas con error en el formulario." },
        ],
      },
    ],
    tasks: [
      {
        id: "definicion", kind: "clasificar", criterion: "Definición y unidad del indicador", weight: 25, origen: "adaptado",
        prompt: "Di qué es cada número: una cantidad o la tasa que responde a una meta.",
        groups: [{ id: "cantidad", label: "Cantidad: sola no responde a una meta" }, { id: "puntualidad", label: "Tasa que responde a la meta de puntualidad" }, { id: "errores", label: "Tasa que responde a la meta de errores" }],
        items: [
          { id: "citas", text: "Citas de la semana", group: "cantidad" },
          { id: "tasa_tiempo", text: "Citas atendidas a tiempo entre citas de la semana, en porcentaje", group: "puntualidad" },
          { id: "atendidas", text: "Citas atendidas a tiempo", group: "cantidad" },
          { id: "tasa_error", text: "Formularios con error entre citas de la semana, en porcentaje", group: "errores" },
          { id: "formularios", text: "Formularios con error", group: "cantidad" },
        ],
        calc: "Las citas, las citas a tiempo y los formularios con error son cantidades. Las metas están en porcentaje: se responden con las tasas sobre las citas de la semana.",
      },
      { id: "punt_b", kind: "cifra", unit: "%", criterion: "Cálculo y comparación de puntualidad: semana B", weight: 20, origen: "fuente", prompt: "¿Cuál fue la puntualidad de la semana B, en porcentaje?", answer: 82, calc: "41 ÷ 50 × 100 = 82" },
      {
        id: "comparacion", kind: "clasificar", criterion: "Cálculo y comparación de puntualidad: comparación", weight: 15, origen: "adaptado",
        prompt: "De la semana A a la semana B, ¿qué pasó con cada resultado?",
        groups: [{ id: "subio", label: "Subió" }, { id: "bajo", label: "Bajó" }, { id: "igual", label: "No cambió" }],
        items: [
          { id: "puntualidad", text: "Puntualidad, en porcentaje", group: "bajo" },
          { id: "citas", text: "Citas de la semana", group: "subio" },
          { id: "atendidas", text: "Citas atendidas a tiempo", group: "subio" },
        ],
        calc: "Las citas subieron de 40 a 50 y las atendidas a tiempo, de 36 a 41. La puntualidad bajó: 36 ÷ 40 × 100 = 90 y 41 ÷ 50 × 100 = 82.",
      },
      { id: "err_b", kind: "cifra", unit: "%", criterion: "Lectura de la meta de errores: semana B", weight: 10, origen: "fuente", prompt: "¿Qué porcentaje de las citas de la semana B tuvo error en el formulario?", answer: 6, calc: "3 ÷ 50 × 100 = 6" },
      {
        id: "metas", kind: "clasificar", criterion: "Lectura de la meta de errores: metas", weight: 15, origen: "adaptado",
        prompt: "Compara cada resultado con su meta.",
        groups: [{ id: "cumple", label: "Cumple la meta" }, { id: "no_cumple", label: "No cumple la meta" }],
        items: [
          { id: "err_b", text: "Errores de la semana B", group: "no_cumple" },
          { id: "err_a", text: "Errores de la semana A", group: "cumple" },
          { id: "punt_b", text: "Puntualidad de la semana B", group: "no_cumple" },
          { id: "punt_a", text: "Puntualidad de la semana A", group: "cumple" },
        ],
        calc: "Semana A: errores 2 ÷ 40 × 100 = 5, justo en el máximo, y puntualidad de 90 %, justo en la meta. Semana B: errores de 6 %, arriba del máximo, y puntualidad de 82 %, debajo de la meta.",
      },
      {
        id: "dato", kind: "texto", criterion: "Distinguir observación de hipótesis causal", weight: 15, origen: "fuente",
        prompt: "¿Qué dato pedirías antes de explicar por qué bajó la puntualidad? Di también qué no se puede afirmar todavía.",
        reference: "Pediría el registro de las citas atendidas fuera de tiempo en la semana B, con su horario y quién las atendió. Los datos muestran que la puntualidad bajó; no dicen por qué.",
        ideas: ["Pide un dato ligado al indicador, como el detalle de las citas atendidas tarde.", "Separa lo que se observa de la causa.", "No atribuye el resultado a una persona ni al mayor número de citas."],
      },
    ],
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "El paquete da las tasas como «cifras derivadas» y pide no dar la respuesta antes de interactuar. Aquí las seis se calculan y se escriben, con pista y calculadora, antes de comparar.",
    "La pregunta «¿qué representa el 85 %?» no es una actividad aparte: la respuesta del paquete se muestra al terminar el cálculo.",
    "Subió, bajó o no cambió se asigna tocando, no arrastrando etiquetas.",
    "En la decisión del indicador solo la puntualidad es defendible, como pide el paquete: no se añadió una segunda ruta correcta.",
    "En la evidencia a pedir, el paquete dice que las tres pueden aportar contexto. Aquí la lista por horario y ruta es la defendible, los comentarios de clientes quedan como ruta con riesgo y el detalle de personal, pedido para confirmar que faltó gente, como concepto erróneo.",
    "La lectura del dato nuevo (11 de 15 por la tarde) se convirtió en una decisión con tres rutas; la ruta «esperar otra semana» es nueva.",
    "Las explicaciones al tocar cada renglón son nuevas.",
    "Variante: no se pide la puntualidad de la semana A ni los errores de la semana A como cifra, porque 90 y 5 están a la vista en las metas. Se piden las de la semana B (82 % y 6 %) y las de la semana A se usan al comparar.",
    "Variante: «definición y unidad» y la comparación con las metas se comprueban clasificando; el dato adicional que conviene pedir (15 puntos) es una respuesta escrita que queda en espera de revisión de una persona.",
    "No hay regla para pasar la variante: la regla provisional se retiró y el puntaje se muestra sin veredicto.",
  ],
};
