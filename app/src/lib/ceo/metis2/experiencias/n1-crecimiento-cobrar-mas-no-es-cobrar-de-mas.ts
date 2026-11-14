/**
 * MÊTIS 2.0 · Repositorio Académico · lote 03 (paquete 1.2) · EDIT-N1-017 · Crecimiento
 * «Cobrar más no siempre significa cobrar de más»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir. Las cifras son las del paquete, sin cambios.
 */
import type { Experiencia } from "./tipos";

export const N1_CRECIMIENTO_COBRAR_MAS: Experiencia = {
  id: "exp.n1.cre.cobrar-mas-no-es-cobrar-de-mas",
  editorialId: "EDIT-N1-017",
  slug: "cobrar-mas-no-es-cobrar-de-mas",
  version: 1,
  packageVersion: "1.2",
  title: "Cobrar más no siempre significa cobrar de más",
  academy: "crecimiento",
  skills: { primary: "cre.precios", secondary: ["cre.cliente"] },
  level: 1,
  sourceIds: ["INSEAD_CORE", "STAN_CORE"],
  provenance: "creacion_original",
  minutes: [6, 8],
  objectives: [
    "Distinguir precio, costo directo y valor percibido.",
    "Calcular la diferencia simple entre precio y costo directo sin llamarla utilidad neta.",
    "Comprender que el cliente compara beneficios y condiciones, no solo números.",
  ],
  characters: [{ id: "lucia", name: "Lucía", role: "Responsable de un taller de impresión de planos" }],
  docs: [
    {
      id: "A", letter: "A", title: "Comparación de ofertas", unit: "Paquete estándar de planos · datos ficticios", cols: ["Característica", "Taller de Lucía", "Competidor"], layout: "ficha",
      rows: [
        { id: "A.precio", label: "Precio por paquete estándar", cells: ["$190", "$170"], nota: { origen: "fuente", text: "Precio: lo que el cliente paga." } },
        { id: "A.costo", label: "Costo directo", cells: ["$120", "No disponible"], nota: { origen: "fuente", text: "Costo directo: recursos directamente asociados a producir el paquete." } },
        { id: "A.entrega", label: "Entrega ofrecida", cells: ["El mismo día antes de las 18:00", "Dentro de 48 horas"], nota: { origen: "adaptado", text: "Una condición de la oferta. Distintas personas pueden valorar distinto la rapidez." } },
        { id: "A.revision", label: "Comprobación de archivos", cells: ["Revisión básica antes de impresión", "No especificada"], nota: { origen: "conversion", text: "Otra condición de la oferta. «No especificada» no significa que el competidor no la haga." } },
        { id: "A.fijos", label: "Gastos fijos (renta, administración)", cells: ["No incluidos en los $120", "No disponible"], nota: { origen: "adaptado", text: "Por eso lo que queda entre el precio y el costo directo todavía no es utilidad neta." } },
      ],
    },
    {
      id: "B", letter: "B", title: "Tres frases de clientes", unit: "Ilustrativas; no son una encuesta representativa",
      rows: [
        { id: "B.c1", label: "«Necesito los planos hoy para presentar un proyecto mañana; que lleguen a tiempo vale mucho para mí».", nota: { origen: "conversion", text: "Para este cliente, la entrega el mismo día es un beneficio importante." } },
        { id: "B.c2", label: "«No tengo urgencia, puedo esperar dos días si pago menos».", nota: { origen: "conversion", text: "Para este cliente, la rapidez no es una razón para pagar más." } },
        { id: "B.c3", label: "«Me importa que revisen si mis archivos están listos para imprimir antes de que los entreguen».", nota: { origen: "conversion", text: "Para este cliente, la revisión de archivos es un beneficio." } },
      ],
    },
  ],
  moments: ["El chat", "Los documentos", "La diferencia", "Las etiquetas", "El primer cliente", "Otro cliente", "Para no confundirlo", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "lucia", channel: "Chat",
      text: "Nos reclaman que cobramos $190 por imprimir un paquete que otra tienda ofrece en $170. Yo sé que imprimirlo cuesta $120. ¿Bajamos el precio o explicamos por qué algunos clientes nos eligen?",
      role: "Ayudas a Lucía a separar tres cosas que se confunden con facilidad: lo que cobra, lo que le cuesta y lo que el cliente aprecia.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "Las dos ofertas y lo que dicen tres clientes",
      prompt: "Toca cada renglón para ver qué es. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "diferencia",
    },
    {
      id: "diferencia", kind: "calcular", moment: 2, origen: "fuente", from: "lucia",
      text: "Primero quiero saber cuánto queda por paquete, antes de renta y administración.",
      prompt: "Escribe las dos cifras. Puedes usar la calculadora.",
      docs: ["A"],
      fields: [
        { id: "actual", label: "Lo que queda por paquete al precio actual", answer: 70, unit: "$", hint: "Precio del taller menos su costo directo.", calc: "190 − 120 = 70" },
        { id: "rebajado", label: "Lo que quedaría por paquete si cobrara lo que cobra el competidor", answer: 50, unit: "$", hint: "Precio del competidor menos el costo directo del taller.", calc: "170 − 120 = 50" },
      ],
      right: "A $190 quedan $70 por paquete antes de gastos fijos. A $170 quedarían $50. Ninguna de las dos cifras es utilidad neta: faltan la renta y la administración.",
      next: "etiquetas",
    },
    {
      id: "etiquetas", kind: "clasificar", moment: 3, origen: "fuente", from: null,
      text: "Cada cosa por su nombre.",
      prompt: "Ponle a cada tarjeta la etiqueta que le corresponde.",
      docs: ["A"],
      groups: [{ id: "precio", label: "Precio" }, { id: "costo", label: "Costo directo" }, { id: "valor", label: "Puede aportar valor al cliente" }, { id: "diferencia", label: "Diferencia antes de gastos fijos" }, { id: "neta", label: "Utilidad neta" }],
      items: [
        { id: "c120", text: "$120 por imprimir cada paquete", group: "costo", why: "Son los recursos directamente asociados a producir el paquete." },
        { id: "entrega", text: "Entrega el mismo día antes de las 18:00", group: "valor", why: "Es un atributo que podría aportar valor: depende de la necesidad de cada cliente." },
        { id: "c70", text: "$70 por paquete", group: "diferencia", why: "Es lo que queda entre el precio y el costo directo. Faltan costos no incluidos, como administración y renta: no es utilidad neta." },
        { id: "c190", text: "$190 por paquete", group: "precio", why: "Es lo que el cliente paga." },
        { id: "revision", text: "Revisión básica de archivos antes de imprimir", group: "valor", why: "Es un atributo que podría aportar valor a quien le preocupa que sus archivos estén listos." },
      ],
      right: "$190 es el precio y $120, el costo directo. La entrega el mismo día y la revisión de archivos pueden aportar valor. Los $70 son una diferencia antes de gastos fijos, no la utilidad neta.",
      next: "cliente1",
    },
    {
      id: "cliente1", kind: "decision", moment: 4, origen: "fuente", from: "lucia", text: "El cliente que necesita los planos hoy me pregunta por qué cuesta $20 más. ¿Qué le contesto?",
      options: [
        {
          id: "bajar", tipo: "riesgosa", origen: "adaptado", next: "cliente2",
          text: "Que se lo dejamos en $170 para igualar a la otra tienda, sin revisar antes qué implica.",
          consequence: [{ who: null, text: "El cliente acepta. Iba a pedir los planos de todos modos: los necesita hoy." }, { who: "lucia", text: "Le bajé $20 sin que lo pidiera y sin saber si con eso vendemos más." }],
          feedback: "Podría ser una prueba comercial, pero reduce de $70 a $50 la diferencia por paquete antes de gastos fijos; desconocemos si compensa por volumen.",
        },
        {
          id: "valor", tipo: "defendible", origen: "adaptado", next: "cliente2",
          text: "Que incluye entrega hoy antes de las 18:00 y una revisión básica de sus archivos antes de imprimir.",
          consequence: [{ who: null, text: "El cliente contesta que los necesita hoy para presentar mañana y que, si llegan antes de las 18:00, los pide." }],
          feedback: "Comunicaste las condiciones relevantes para ese cliente, el plazo y la verificación, sin prometer una calidad superior que no está probada.",
        },
        {
          id: "malo", tipo: "concepto_erroneo", origen: "adaptado", next: "cliente2",
          text: "Que la otra tienda cobra menos porque trabaja mal y sus impresiones suelen salir con errores.",
          consequence: [{ who: null, text: "El cliente pregunta cómo lo saben. Lucía no tiene con qué responder." }],
          feedback: "La rapidez está documentada; que el competidor sea malo no está demostrado. Es una afirmación injustificada que no explica qué recibe el cliente.",
        },
      ],
    },
    {
      id: "cliente2", kind: "dato", moment: 5, origen: "fuente", title: "Llega un segundo cliente",
      items: ["No tiene urgencia y solo busca precio: puede esperar dos días si paga menos.", "Para él, la entrega el mismo día no es una razón para pagar $190. La propuesta actual puede no encajarle."],
      next: "todos",
    },
    {
      id: "todos", kind: "decision", moment: 5, origen: "fuente", from: "lucia", text: "¿Cómo decido si bajamos el precio para todos?",
      options: [
        {
          id: "evidencia", tipo: "defendible", origen: "adaptado", next: "frases",
          text: "Con datos: cuántos clientes se van por precio, cuánto cuesta atenderlos y qué capacidad hay.",
          consequence: [{ who: "lucia", text: "Empiezo por anotar un mes cuántos piden hoy mismo y cuántos se van al oír el precio. Con eso decidimos." }],
          feedback: "Pediste evidencia de sensibilidad al precio, costos y capacidad antes de concluir. No hace falta subir o bajar el precio a todos para atender a dos clientes distintos.",
        },
        {
          id: "barato", tipo: "concepto_erroneo", origen: "adaptado", next: "frases",
          text: "Bajándolo ya: más barato siempre vende más y con eso se compensa lo que se deja de cobrar por paquete.",
          consequence: [{ who: "lucia", text: "Dejaría de recibir $20 por cada paquete, también de quienes hoy pagan $190 sin problema. Y no sé cuántos más llegarían." }],
          feedback: "No hay datos para afirmar que más barato siempre venderá más. Lo seguro es que la diferencia por paquete bajaría de $70 a $50 antes de gastos fijos.",
        },
        {
          id: "rapido", tipo: "concepto_erroneo", origen: "adaptado", next: "frases",
          text: "No hace falta: quien entrega el mismo día puede cobrar lo que quiera y el cliente lo paga.",
          consequence: [{ who: "lucia", text: "El segundo cliente acaba de decir que prefiere esperar dos días y pagar menos. No todos pagan por la rapidez." }],
          feedback: "La entrega rápida no asegura poder cobrar cualquier importe: que todos pagarán $190 no está demostrado. Cada cliente valora cosas distintas.",
        },
      ],
    },
    {
      id: "frases", kind: "redactar", moment: 6, origen: "fuente", from: "lucia",
      ask: "Déjamelo escrito, para no volver a confundirlo.",
      prompt: "Completa las tres frases con tus palabras.",
      fields: [{ id: "precio", label: "El precio es..." }, { id: "costo", label: "El costo directo es..." }, { id: "valor", label: "El valor que aprecia el cliente con urgencia es..." }],
      reference: "El precio es $190 por paquete: lo que paga el cliente. El costo directo es $120: lo que cuesta imprimirlo, sin renta ni administración. El valor que aprecia el cliente con urgencia es tener sus planos hoy y con los archivos revisados; el cliente sin urgencia no valora eso igual.",
      ideas: ["No confunde el precio con el costo.", "No llama utilidad neta a los $70.", "Liga el valor con la necesidad de un cliente concreto.", "No supone que todos los clientes pagarían lo mismo."],
      next: "cierre",
    },
    { id: "cierre", kind: "cierre", moment: 7, origen: "conversion", text: "Terminaste la práctica con Lucía. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.cre.precio-costo-valor", title: "Precio, costo y valor percibido", origen: "fuente",
    text: "El precio es el dinero que el cliente entrega por una oferta. El costo representa recursos que el negocio utiliza para producirla; algunos son directos y otros, como la renta, no dependen de cada unidad. La diferencia entre precio y costo directo no es necesariamente la utilidad neta, porque faltan otros gastos. El valor percibido es el beneficio que cada cliente cree recibir: rapidez, confianza, comodidad, calidad o ahorro de tiempo. Dos ofertas con precios distintos no son idénticas si sus beneficios y condiciones cambian. Para fijar un precio de manera responsable hay que considerar costos, alternativas, disposición a pagar y capacidad de cumplir lo prometido.",
  },
  calculations: [
    "190 − 120 = 70 (lo que queda por paquete antes de gastos fijos)",
    "170 − 120 = 50 (lo que quedaría si se vendiera a 170)",
    "190 − 170 = 20 (lo que separa los dos precios)",
  ],
  variant: {
    id: "exp.n1.cre.cobrar-mas-no-es-cobrar-de-mas.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Un servicio de mantenimiento de jardines ofrece una visita rápida y la compara con la alternativa del mercado. Nadie te explica los datos: lee, calcula y responde.",
    question: "¿Qué cobra, qué le cuesta y quién aprecia la rapidez?",
    intro: "Otro negocio y otras cifras. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Hay calculadora. Una parte se comprueba sola; lo que escribas queda en espera de revisión de una persona.",
    calculator: true,
    docs: [
      {
        id: "V", letter: "V", title: "Mantenimiento de jardines · dos ofertas", unit: "Por servicio", cols: ["Característica", "Servicio rápido", "Alternativa del mercado"], layout: "ficha",
        rows: [
          { id: "V.precio", label: "Precio", cells: ["$1,200", "$1,050"] },
          { id: "V.costos", label: "Costos directos", cells: ["$800", "No disponible"] },
          { id: "V.visita", label: "Visita", cells: ["Garantizada en el día", "Cita disponible en cinco días"] },
          { id: "V.fijos", label: "Gastos fijos", cells: ["No incluidos en los costos directos", "No disponible"] },
        ],
      },
      {
        id: "W", letter: "W", title: "Dos clientes", unit: "Lo que se sabe de cada uno",
        rows: [
          { id: "W.evento", label: "Un cliente tiene un evento en su jardín al día siguiente." },
          { id: "W.calma", label: "Otro cliente no necesita urgencia." },
        ],
      },
    ],
    tasks: [
      {
        id: "conceptos", kind: "clasificar", criterion: "Conceptos y clasificación", weight: 35, origen: "adaptado",
        prompt: "Ponle a cada tarjeta la etiqueta que le corresponde.",
        groups: [{ id: "precio", label: "Precio" }, { id: "costo", label: "Costo directo" }, { id: "valor", label: "Puede aportar valor al cliente" }],
        items: [
          { id: "visita", text: "Visita garantizada en el día", group: "valor" },
          { id: "p1200", text: "$1,200 del servicio rápido", group: "precio" },
          { id: "c800", text: "$800 que cuesta prestar cada servicio rápido", group: "costo" },
          { id: "listo", text: "Tener el jardín listo antes de un evento", group: "valor" },
          { id: "p1050", text: "$1,050 de la alternativa del mercado", group: "precio" },
        ],
        calc: "$1,200 y $1,050 son precios. $800 es el costo directo. La visita en el día y tener el jardín listo a tiempo pueden aportar valor, según el cliente.",
      },
      { id: "diferencia", kind: "cifra", unit: "$", criterion: "Cálculo y distinción de utilidad neta: diferencia", weight: 15, origen: "fuente", prompt: "¿Cuánto queda de cada servicio rápido antes de gastos fijos?", answer: 400, calc: "1,200 − 800 = 400" },
      {
        id: "lectura", kind: "clasificar", criterion: "Cálculo y distinción de utilidad neta: lectura", weight: 10, origen: "adaptado",
        prompt: "Con estos datos, ¿qué se puede afirmar de lo que queda por servicio?",
        groups: [{ id: "si", label: "Se puede afirmar" }, { id: "no", label: "No se puede afirmar" }],
        items: [
          { id: "neta", text: "Lo que queda por servicio es la utilidad neta del negocio", group: "no" },
          { id: "antes", text: "Lo que queda por servicio es una diferencia antes de gastos fijos", group: "si" },
          { id: "rentable", text: "El servicio rápido es rentable en total", group: "no" },
          { id: "faltan", text: "Faltan los gastos fijos para conocer la utilidad", group: "si" },
        ],
        calc: "Lo que queda entre el precio y los costos directos es una diferencia antes de gastos fijos. No es utilidad neta ni alcanza para decir que el servicio es rentable en total.",
      },
      {
        id: "perfil", kind: "texto", criterion: "Identificación de valor por cliente", weight: 30, origen: "fuente",
        prompt: "Explica qué cliente apreciaría más el servicio rápido y por qué. Di también qué pasa con el otro.",
        reference: "El cliente con un evento al día siguiente aprecia la visita garantizada en el día: para él, tener el jardín listo a tiempo vale la diferencia de precio. El cliente sin urgencia puede esperar cinco días y pagar $1,050; para él la rapidez aporta poco.",
        ideas: ["Liga la rapidez con la necesidad del cliente que tiene el evento.", "Reconoce que al otro cliente la propuesta puede no encajarle.", "No iguala precio con beneficio."],
      },
      {
        id: "cautela", kind: "texto", criterion: "Cautela sobre conclusiones de demanda", weight: 10, origen: "fuente",
        prompt: "¿Qué se puede decir, y qué no, sobre cuántos clientes pagarían el servicio rápido?",
        reference: "Solo se sabe de dos clientes: uno valora la rapidez y otro no. Con eso no se puede afirmar que todos pagarían la diferencia ni cuántos lo harían.",
        ideas: ["No afirma que todos pagarían por la rapidez.", "Reconoce que dos clientes no son una muestra.", "Puede proponer qué dato haría falta."],
      },
    ],
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "El paquete da los $70 y los $50 como «cálculo ilustrativo»; aquí se calculan y se escriben antes de etiquetar, con pista y calculadora.",
    "Al etiquetar se añadió la tarjeta de la revisión de archivos y la etiqueta «utilidad neta», que no corresponde a ninguna tarjeta: está para que confundir los $70 con ganancia neta sea un error posible, como prevé el paquete.",
    "El paquete usa «margen de contribución unitario simplificado»; en pantalla se dice «diferencia antes de gastos fijos», porque el propio paquete indica que el término no se evalúa en este nivel.",
    "La conversación con el primer cliente es una decisión con las tres rutas del paquete. El cliente no es un personaje con nombre: sus respuestas aparecen narradas y son nuevas.",
    "La llegada del segundo cliente se muestra como dato nuevo; lo que cada cliente valora se recoge en la respuesta escrita final.",
    "«¿Cómo decido si bajamos el precio para todos?» es una decisión con tres rutas: pedir evidencia y las dos conclusiones firmes que el paquete pide rechazar.",
    "Las explicaciones al tocar las frases de los clientes y dos renglones de la comparación son nuevas.",
    "Variante: se añadió el renglón «gastos fijos: no incluidos en los costos directos», que el paquete da por entendido al hablar de «diferencia antes de gastos fijos».",
    "Variante: la distinción de utilidad neta (10 puntos) se comprueba clasificando cuatro afirmaciones; el paquete no dice cómo comprobarla.",
    "Variante: el valor por cliente (30 puntos) y la cautela sobre la demanda (10 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.",
    "No hay regla para pasar la variante: la regla provisional se retiró y el puntaje se muestra sin veredicto.",
  ],
};
