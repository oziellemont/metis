/**
 * MÊTIS 2.0 · Repositorio Académico · lote 02 (paquete 1.1) · EDIT-N1-011 · Crecimiento
 * «No todos compran por la misma razón»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir. Las cifras son las del paquete, sin cambios.
 */
import type { Experiencia } from "./tipos";

export const N1_CRECIMIENTO_NO_TODOS_COMPRAN_IGUAL: Experiencia = {
  id: "exp.n1.cre.no-todos-compran-igual",
  editorialId: "EDIT-N1-011",
  slug: "no-todos-compran-igual",
  version: 1,
  packageVersion: "1.1",
  title: "No todos compran por la misma razón",
  academy: "crecimiento",
  skills: { primary: "cre.segmentacion", secondary: ["cre.cliente", "cre.precios"] },
  level: 1,
  sourceIds: ["HBS_MKT", "INSEAD_CORE"],
  provenance: "creacion_original",
  minutes: [6, 8],
  objectives: [
    "Reconocer que los compradores pueden agruparse por necesidades y comportamiento relevante.",
    "Explicar un criterio de segmentación.",
    "Evitar elegir a todos como público prioritario sin evaluar diferencias.",
  ],
  characters: [{ id: "sara", name: "Sara", role: "Gerente de una tienda de alimentos preparados" }],
  docs: [
    {
      id: "A", letter: "A", title: "Entrevistas de descubrimiento", unit: "Muestra de conveniencia ficticia; no son estimaciones de mercado",
      cols: ["Personas entrevistadas", "Necesidad mencionada con frecuencia", "Horario mencionado", "Fricción principal"], layout: "ficha",
      rows: [
        { id: "A.oficinas", label: "18 empleados de oficinas", cells: ["Comida rápida y predecible", "Lunes a viernes, mediodía", "Poco tiempo para esperar"], nota: { origen: "conversion", text: "Lo que los une no es dónde trabajan, sino que comen con el tiempo contado y quieren saber qué van a recibir." } },
        { id: "A.familias", label: "14 familias", cells: ["Porciones para compartir", "Sábados y domingos", "Dificultad para planear para varios"], nota: { origen: "conversion", text: "Compran para varios a la vez y en fin de semana: otra necesidad y otro momento." } },
        { id: "A.deportistas", label: "12 deportistas recreativos", cells: ["Ingredientes visibles y flexibilidad", "Tardes y noches", "Incertidumbre sobre ingredientes"], nota: { origen: "conversion", text: "Quieren saber con exactitud qué comen y poder ajustarlo." } },
      ],
      foot: "Son 44 entrevistas a quien se pudo entrevistar. Sirven para formular hipótesis; no dicen cuánta gente hay en cada grupo.",
    },
    {
      id: "B", letter: "B", title: "Tres mensajes sin etiqueta", unit: "Recibidos por redes",
      rows: [
        { id: "B.uno", label: "«Entre reuniones solo tengo 20 minutos para comer».", nota: { origen: "conversion", text: "Habla de tiempo: cuánto tiene y cuándo." } },
        { id: "B.dos", label: "«Cuando nos juntamos somos cinco y no queremos cocinar».", nota: { origen: "conversion", text: "Habla de cantidad y de una ocasión: comer en grupo." } },
        { id: "B.tres", label: "«Necesito ver exactamente qué incluye el plato».", nota: { origen: "conversion", text: "Habla de información: saber qué lleva lo que compra." } },
      ],
    },
  ],
  moments: ["El mensaje", "Las entrevistas", "Las voces", "El criterio", "El piloto", "Dato nuevo", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "sara", channel: "Audio transcrito",
      text: "Tenemos poco presupuesto para lanzar un servicio de pedidos programados. Todos en redes nos dicen que son clientes potenciales. ¿Cómo decidimos a quién hablarle primero?",
      role: "Sara te pide ayuda como asesor invitado. No diriges la tienda: la ayudas a ver en qué se diferencian quienes le escriben.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "A quién entrevistaron y qué les escriben",
      prompt: "Toca cada renglón y cada mensaje para ver qué dice. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "voces",
    },
    {
      id: "voces", kind: "clasificar", moment: 2, origen: "adaptado", from: null,
      text: "Los tres mensajes llegaron sin decir quién los escribe. Fíjate en lo que cada persona necesita, no en cómo te la imaginas.",
      prompt: "Asigna cada mensaje a la necesidad que expresa.",
      docs: ["A", "B"],
      groups: [{ id: "rapida", label: "Comida rápida y predecible" }, { id: "compartir", label: "Porciones para compartir" }, { id: "ingredientes", label: "Ingredientes visibles y flexibilidad" }],
      items: [
        { id: "uno", text: "«Entre reuniones solo tengo 20 minutos para comer».", group: "rapida", why: "Habla de poco tiempo entre reuniones: necesita que la comida llegue rápido y sin sorpresas." },
        { id: "dos", text: "«Cuando nos juntamos somos cinco y no queremos cocinar».", group: "compartir", why: "Habla de comer en grupo: necesita porciones para varios." },
        { id: "tres", text: "«Necesito ver exactamente qué incluye el plato».", group: "ingredientes", why: "Habla de saber qué lleva el plato: necesita ingredientes a la vista." },
      ],
      right: "Cada mensaje expresa una necesidad distinta y un momento de uso distinto. Los agrupaste por lo que necesitan, sin suponer su edad ni cuánto ganan.",
      next: "criterio",
    },
    {
      id: "criterio", kind: "decision", moment: 3, origen: "fuente", from: "sara", text: "Entonces, ¿con qué criterio separo a quienes nos escriben?",
      options: [
        {
          id: "momento", tipo: "defendible", origen: "adaptado", next: "piloto",
          text: "Por el momento en que compran: mediodía, fin de semana o tarde.",
          consequence: [{ who: "sara", text: "Eso lo puedo ver en las entrevistas: unos piden entre semana al mediodía y otros en sábado y domingo." }],
          feedback: "El momento de compra es un criterio útil aquí: cambia qué ofrecer y cuándo entregarlo. No es la única manera de segmentar.",
        },
        {
          id: "beneficio", tipo: "defendible", origen: "adaptado", next: "piloto",
          text: "Por el beneficio que buscan: rapidez, compartir o ingredientes.",
          consequence: [{ who: "sara", text: "Claro: a unos les hablo de rapidez, a otros de porciones y a otros de qué lleva cada plato." }],
          feedback: "El beneficio buscado es un criterio útil aquí: cada grupo necesitaría una oferta y un mensaje distintos. No es la única manera de segmentar.",
        },
        {
          id: "ropa", tipo: "concepto_erroneo", origen: "adaptado", next: "piloto",
          text: "Por el color de ropa que llevan cuando pasan por la tienda.",
          consequence: [{ who: "sara", text: "Podría anotarlo, pero no veo qué haría distinto para quien viste de azul que para quien viste de verde." }],
          feedback: "Un criterio sirve cuando ayuda a anticipar la compra. ¿Qué dato de las entrevistas te diría qué ofrecer y cuándo? El momento de compra o el beneficio buscado sí lo hacen.",
        },
      ],
    },
    {
      id: "piloto", kind: "decision", moment: 4, origen: "fuente", from: "sara", text: "Tengo presupuesto para un solo piloto. ¿Con quién empiezo?",
      options: [
        {
          id: "oficinas", tipo: "defendible", origen: "adaptado", next: "capacidad",
          text: "Con oficinas: prueba entregas puntuales al mediodía entre semana.",
          consequence: [{ who: "sara", text: "Va. La hipótesis sería que pagan por recibirlo a tiempo. Tendría que medir cuántos repiten." }],
          feedback: "Es una hipótesis que se puede probar. Dieciocho entrevistas no dicen que este grupo sea el más grande ni el más rentable: no hay costos, tamaño de mercado ni datos de conversión.",
        },
        {
          id: "familias", tipo: "defendible", origen: "adaptado", next: "capacidad",
          text: "Con familias: prueba paquetes para compartir en fin de semana.",
          consequence: [{ who: "sara", text: "Va. La hipótesis sería que pagan por no cocinar para cinco. Tendría que ver si puedo entregar en sábado." }],
          feedback: "Es una hipótesis que se puede probar. Catorce entrevistas no dicen que este grupo sea el más grande ni el más rentable: no hay costos, tamaño de mercado ni datos de conversión.",
        },
        {
          id: "deportistas", tipo: "defendible", origen: "adaptado", next: "capacidad",
          text: "Con deportistas: prueba platos con ingredientes a la vista.",
          consequence: [{ who: "sara", text: "Puede ser. ¿Y cómo los atendería por la tarde y la noche? Hoy no tengo quién entregue a esa hora." }],
          feedback: "Se puede defender si explicas cómo los atenderías en su horario y con la flexibilidad que piden. Doce entrevistas tampoco dicen cuántos son ni cuánto pagarían.",
        },
        {
          id: "todos", tipo: "concepto_erroneo", origen: "adaptado", next: "capacidad",
          text: "Con todos a la vez: los tres grupos dijeron estar interesados.",
          consequence: [{ who: "sara", text: "¿Un solo servicio para el mediodía, el fin de semana y la noche? No sé qué prometería ni a qué hora." }],
          feedback: "El problema es concreto: un servicio único tendría que servir a tres momentos de uso diferentes. Priorizar un grupo permite diseñar la oferta, el mensaje y el horario para alguien.",
        },
      ],
    },
    {
      id: "capacidad", kind: "dato", moment: 5, origen: "fuente", title: "Sara revisa qué puede hacer la tienda",
      items: ["Durante la primera prueba, la tienda solo puede entregar entre 12:00 y 15:00, de lunes a viernes.", "No hay entregas por la tarde, por la noche ni en fin de semana."],
      next: "ajuste",
    },
    {
      id: "ajuste", kind: "decision", moment: 5, origen: "adaptado", from: "sara", text: "Con ese horario, ¿qué hago con el piloto?",
      options: [
        {
          id: "rentable", tipo: "concepto_erroneo", origen: "conversion", next: "cierre",
          text: "Oficinas, porque con 18 entrevistas es el grupo más rentable.",
          consequence: [{ who: "sara", text: "¿Rentable? Todavía no sé cuánto pagarían ni cuánto me cuesta llevarles la comida." }],
          feedback: "El número de entrevistas no mide rentabilidad ni tamaño de mercado: es una muestra de conveniencia. Lo que sí sabes es que su horario coincide con lo que la tienda puede entregar hoy.",
        },
        {
          id: "alineado", tipo: "defendible", origen: "adaptado", next: "cierre",
          text: "Oficinas, porque su horario coincide con lo que puedes entregar hoy.",
          consequence: [{ who: "sara", text: "Me sirve: empiezo donde sí puedo cumplir y anoto qué me falta saber de los otros grupos." }],
          feedback: "Decisión defendible para el piloto: el grupo de oficinas está mejor alineado con la capacidad actual. Su potencial total sigue sin medirse, y eso no lo vuelve el más atractivo a largo plazo.",
        },
        {
          id: "igual", tipo: "riesgosa", origen: "conversion", next: "cierre",
          text: "Familias de todos modos: ya resolverás cómo entregar en sábado y domingo.",
          consequence: [{ who: "sara", text: "Podría prometerlo, pero hoy no tengo cómo entregar en fin de semana. Sería empezar quedando mal." }],
          feedback: "El grupo puede ser interesante, pero la primera prueba no puede atenderlo: la tienda no entrega en fin de semana. Probar donde no puedes cumplir dice poco sobre el cliente.",
        },
      ],
    },
    { id: "cierre", kind: "cierre", moment: 6, origen: "conversion", text: "Terminaste la práctica con Sara. Aquí queda lo que decidiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.cre.segmentacion", title: "Segmentación y mercado objetivo", origen: "fuente",
    text: "La segmentación consiste en dividir a los clientes potenciales en grupos que comparten necesidades o comportamientos relevantes para una decisión comercial. Un segmento útil permite pensar qué oferta, mensaje o canal serviría mejor a ese grupo. Un mercado objetivo es el grupo al que se decide priorizar. La elección no depende solo de cuántos entrevistados opinaron algo: también importan el tamaño real del grupo, lo que está dispuesto a pagar, los costos de atenderlo y las capacidades del negocio. Una muestra pequeña de entrevistas ayuda a formular hipótesis, pero no representa automáticamente a todo el mercado.",
  },
  calculations: ["18 + 14 + 12 = 44 (entrevistas de conveniencia; no son porcentajes de la población)"],
  variant: {
    id: "exp.n1.cre.no-todos-compran-igual.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Una biblioteca digital de cursos cortos entrevistó a algunas personas que la usan. Nadie te explica los datos: lee y responde.",
    question: "¿Qué grupos hay según lo que necesitan y qué falta saber antes de elegir a quién priorizar?",
    intro: "Otro negocio y otras voces. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Una parte se comprueba sola; lo que escribas queda en espera de revisión de una persona.",
    docs: [
      {
        id: "V", letter: "V", title: "Lo que dijeron en las entrevistas", unit: "Muestra de conveniencia ficticia; no son estimaciones de mercado",
        rows: [
          { id: "V.uno", label: "«Tengo la prueba el viernes y quiero repasar justo los temas que entran»." },
          { id: "V.dos", label: "«Mi jefa me pidió una tabla dinámica para mañana y no sé hacerla»." },
          { id: "V.tres", label: "«Me gusta abrir un curso al azar los domingos, a ver qué encuentro»." },
          { id: "V.cuatro", label: "«Necesito ejercicios parecidos a los de la evaluación final»." },
          { id: "V.cinco", label: "«Busco un video de diez minutos que me saque de un apuro en la oficina»." },
          { id: "V.seis", label: "«No tengo prisa: veo un tema nuevo cuando algo me da curiosidad»." },
        ],
      },
    ],
    tasks: [
      {
        id: "necesidades", kind: "clasificar", criterion: "Identificación de necesidades", weight: 45, origen: "adaptado",
        prompt: "Asigna cada voz a la necesidad que expresa.",
        groups: [{ id: "examen", label: "Prepararse para un examen" }, { id: "tarea", label: "Resolver una tarea puntual" }, { id: "curiosidad", label: "Explorar por curiosidad" }],
        items: [
          { id: "uno", text: "«Tengo la prueba el viernes y quiero repasar justo los temas que entran».", group: "examen" },
          { id: "dos", text: "«Mi jefa me pidió una tabla dinámica para mañana y no sé hacerla».", group: "tarea" },
          { id: "tres", text: "«Me gusta abrir un curso al azar los domingos, a ver qué encuentro».", group: "curiosidad" },
          { id: "cuatro", text: "«Necesito ejercicios parecidos a los de la evaluación final».", group: "examen" },
          { id: "cinco", text: "«Busco un video de diez minutos que me saque de un apuro en la oficina».", group: "tarea" },
          { id: "seis", text: "«No tengo prisa: veo un tema nuevo cuando algo me da curiosidad».", group: "curiosidad" },
        ],
        calc: "Las voces 1 y 4 hablan de una prueba o evaluación; la 2 y la 5, de un encargo que hay que resolver ya; la 3 y la 6, de explorar sin prisa.",
      },
      {
        id: "criterio", kind: "texto", criterion: "Criterio coherente", weight: 30, origen: "adaptado",
        prompt: "Di con qué criterio separaste los grupos y por qué sirve para decidir qué ofrecer.",
        reference: "Los separé por lo que cada persona necesita lograr: aprobar un examen, resolver un encargo o explorar. Sirve porque a cada grupo le convendría un contenido y un mensaje distintos.",
        ideas: ["Nombra un criterio ligado a la necesidad o al momento de uso.", "Explica qué cambiaría en la oferta o el mensaje para cada grupo.", "No usa estereotipos de edad ni de ingreso."],
      },
      {
        id: "hipotesis", kind: "texto", criterion: "Hipótesis y dato pendiente", weight: 25, origen: "adaptado",
        prompt: "Elige un grupo, propón un mensaje de valor para él y nombra un dato que falta antes de escogerlo como mercado objetivo.",
        fields: [{ id: "mensaje", label: "Mensaje de valor para ese grupo" }, { id: "dato", label: "Dato que falta conocer" }],
        reference: "Para quien tiene un encargo urgente: «Resuelve tu tarea de hoy en diez minutos». Falta saber cuántas personas hay en ese grupo y cuánto pagarían.",
        ideas: ["El mensaje responde a la necesidad del grupo elegido.", "Nombra un dato que no está en las entrevistas: tamaño, disposición a pagar, costo de atenderlo o conversión.", "No afirma que el grupo sea el más grande ni el más rentable."],
      },
    ],
    passAt: 70,
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "El paquete describe la nueva evidencia (el horario de entrega) y su lectura, pero no la plantea como decisión. Se redactó la decisión «Con ese horario, ¿qué hago con el piloto?» con tres rutas; dos de ellas (inferir rentabilidad por el número de entrevistas e insistir con familias) son nuevas.",
    "En «¿Con quién empiezo?» se añadió la ruta «con todos a la vez», tomada de la retroalimentación del paquete («dice que todos son objetivo»). Oficinas, familias y deportistas quedan como defendibles, como indica el paquete; a deportistas se le pide justificar cómo los atendería.",
    "La clasificación de voces usa como grupos las tres necesidades de la tabla de entrevistas; no se añadieron tarjetas.",
    "Las explicaciones al tocar cada renglón y cada mensaje, y la nota al pie con la suma de 44 entrevistas, son nuevas.",
    "Esta experiencia no tiene respuesta escrita en la práctica: el paquete no la pide.",
    "Variante: las seis voces de la biblioteca digital se redactaron aquí; el paquete solo nombra los tres tipos de persona.",
    "Variante: «criterio coherente» (30 puntos) e «hipótesis y dato pendiente» (25 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.",
    "La regla para pasar la variante (70 de 100) es provisional.",
  ],
};
