/**
 * MÊTIS 2.0 · Repositorio Académico · lote 03 (paquete 1.2) · EDIT-N1-015 · Liderazgo
 * «Ese correo necesita una decisión, no más palabras»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir. Las cifras son las del paquete, sin cambios.
 */
import type { Experiencia } from "./tipos";

export const N1_LIDERAZGO_CORREO_DECISION: Experiencia = {
  id: "exp.n1.lid.ese-correo-necesita-una-decision",
  editorialId: "EDIT-N1-015",
  slug: "ese-correo-necesita-una-decision",
  version: 1,
  packageVersion: "1.2",
  title: "Ese correo necesita una decisión, no más palabras",
  academy: "liderazgo",
  skills: { primary: "lid.comunicacion", secondary: ["lid.fundamentos"] },
  level: 1,
  sourceIds: ["INSEAD_CORE", "STAN_CORE"],
  provenance: "creacion_original",
  minutes: [5, 7],
  objectives: [
    "Identificar la idea principal de un mensaje.",
    "Separar los hechos de las hipótesis.",
    "Formular una solicitud accionable, con responsable y plazo.",
    "No juzgar un mensaje por su cantidad de palabras ni imponer una plantilla única.",
  ],
  characters: [
    { id: "alejandra", name: "Alejandra", role: "Coordinadora de una empresa de mensajería" },
    { id: "gerente", name: "El gerente", role: "Recibe el correo de Alejandra" },
  ],
  docs: [
    {
      id: "A", letter: "A", title: "Registro de pedidos al miércoles 18:00", unit: "Pedidos de esta semana", cols: ["Dato", "Registro confirmado"], layout: "ficha",
      rows: [
        { id: "A.prometidos", label: "Pedidos con fecha prometida esta semana", cells: ["48"] },
        { id: "A.atiempo", label: "Entregados dentro de la fecha prometida", cells: ["39"] },
        { id: "A.tarde", label: "Entregados fuera de la fecha prometida", cells: ["9"], nota: { origen: "adaptado", text: "39 + 9 = 48 pedidos con fecha prometida." } },
        { id: "A.causa", label: "Causa principal de los retrasos", cells: ["No confirmada"], nota: { origen: "fuente", text: "No se conoce aún si los retrasos se deben a rutas, personal, tráfico u otros factores. Conviene evitar afirmar causas o prometer fecha de solución." } },
        { id: "A.avisados", label: "Clientes ya avisados", cells: ["4 de los 9 afectados"], nota: { origen: "adaptado", text: "4 + 5 = 9: quedan cinco clientes afectados sin avisar." } },
        { id: "A.corte", label: "Próximo corte disponible", cells: ["Jueves 16:00"], nota: { origen: "conversion", text: "Es el siguiente momento en que habrá datos nuevos para revisar las causas." } },
      ],
    },
    {
      id: "B", letter: "B", title: "Correo inicial de Alejandra", unit: "Borrador, frase por frase",
      rows: [
        { id: "B.asunto", label: "Asunto: Tema de las entregas y algunas cosas que necesitamos ver.", nota: { origen: "conversion", text: "El asunto no dice qué pasó ni qué se necesita." } },
        { id: "B.movido", label: "Hola, como sabes, estos días todo ha estado muy movido, hemos tenido reuniones y algunos pendientes con varios equipos.", nota: { origen: "conversion", text: "Contexto general: no trae ningún dato de las entregas." } },
        { id: "B.preocupa", label: "Quería comentarte que hay algunas cosas que me preocupan, aunque sé que estamos haciendo nuestro esfuerzo.", nota: { origen: "conversion", text: "Dice que hay una preocupación, pero todavía no dice cuál." } },
        { id: "B.rutas", label: "A lo mejor tiene que ver con las rutas o con lo que hablamos ayer, pero todavía no tengo todos los datos.", nota: { origen: "adaptado", text: "Es una suposición: el registro dice que la causa no está confirmada." } },
        { id: "B.nueve", label: "Hubo nueve pedidos que quedaron tarde de los cuarenta y ocho y solo hemos avisado a cuatro clientes.", nota: { origen: "adaptado", text: "Aquí están los hechos del registro: nueve de 48 y cuatro clientes avisados. Llegan hasta la quinta frase." } },
        { id: "B.algo", label: "Creo que deberíamos hacer algo y revisar con todos.", nota: { origen: "conversion", text: "No dice qué hacer, quién lo hace ni para cuándo." } },
        { id: "B.comentarios", label: "También agradecería tus comentarios cuando puedas, porque hay mucho trabajo. Saludos.", nota: { origen: "conversion", text: "Pide comentarios, no una decisión, y sin plazo." } },
      ],
    },
  ],
  moments: ["La bandeja", "Los documentos", "Hechos y suposiciones", "El orden", "El borrador", "La petición", "Dato nuevo", "La versión final", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "alejandra", channel: "Mensaje",
      text: "Necesito avisarle al gerente que nueve entregas quedaron fuera de la fecha prometida. Escribí un correo larguísimo y temo que no se entienda qué necesito. ¿Me ayudas a convertirlo en una comunicación clara?",
      role: "Ayudas a Alejandra a convertir su borrador en un mensaje que el gerente pueda entender a la primera y contestar con una decisión.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "El registro de pedidos y el correo de Alejandra",
      prompt: "Toca cada renglón del registro y cada frase del correo. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "hechos",
    },
    {
      id: "hechos", kind: "clasificar", moment: 2, origen: "adaptado", from: null,
      text: "El correo mezcla lo que el registro confirma con lo que Alejandra supone.",
      prompt: "Separa los hechos de las suposiciones.",
      docs: ["A", "B"],
      groups: [{ id: "hecho", label: "Hecho del registro" }, { id: "suposicion", label: "Suposición" }],
      items: [
        { id: "rutas", text: "A lo mejor tiene que ver con las rutas", group: "suposicion", why: "El registro dice que la causa principal no está confirmada." },
        { id: "nueve", text: "Nueve de los 48 pedidos se entregaron fuera de la fecha prometida", group: "hecho", why: "Está en el registro: 9 entregados fuera de fecha, de 48." },
        { id: "ayer", text: "Tiene que ver con lo que hablamos ayer", group: "suposicion", why: "Nada en el registro lo respalda; todavía no hay datos de la causa." },
        { id: "avisados", text: "Solo cuatro de los nueve clientes afectados han sido avisados", group: "hecho", why: "Está en el registro: 4 de los 9 afectados." },
        { id: "corte", text: "El próximo corte de datos es el jueves a las 16:00", group: "hecho", why: "Está en el registro como próximo corte disponible." },
      ],
      right: "Hechos: nueve de 48 entregas tarde, cuatro clientes avisados y el corte del jueves a las 16:00. Lo de las rutas y lo de ayer son suposiciones: la causa no está confirmada.",
      next: "orden",
    },
    {
      id: "orden", kind: "ordenar", moment: 3, origen: "fuente", from: "alejandra",
      text: "Tengo tres piezas para el mensaje. ¿En qué orden las pongo?",
      prompt: "Acomoda las tres tarjetas como abrirías el mensaje. No hay un único orden válido.",
      cards: [
        { id: "plazo", text: "Plazo: revisamos causas con el corte del jueves a las 16:00." },
        { id: "situacion", text: "Situación e impacto: nueve de 48 entregas llegaron tarde y solo cuatro clientes han sido notificados." },
        { id: "solicitud", text: "Solicitud concreta: contactar hoy a los cinco clientes restantes." },
      ],
      order: ["situacion", "solicitud", "plazo"], strict: false, hints: [],
      right: "Un orden claro empieza por lo que pasa y a quién afecta, sigue con lo que se pide y cierra con el plazo. Otros órdenes también funcionan si el mensaje se entiende a la primera.",
      fallback: "Piensa qué necesita saber primero quien lo lee para poder actuar.",
      next: "borrador",
    },
    {
      id: "borrador", kind: "decision", moment: 4, origen: "adaptado", from: "alejandra", text: "Armé cuatro versiones cortas. ¿Cuál le mando al gerente?",
      options: [
        {
          id: "rutas", tipo: "concepto_erroneo", origen: "adaptado", next: "peticion",
          text: "Nueve de 48 entregas llegaron tarde por culpa de las rutas y solo cuatro clientes están avisados. Hay que corregir las rutas hoy mismo.",
          consequence: [{ who: "gerente", text: "¿Tenemos ese dato verificado?" }, { who: null, text: "Alejandra revisa el registro: la causa sigue sin confirmar. Quita esa frase antes de continuar." }],
          feedback: "Atribuye una causa que los documentos todavía no confirman. Si una causa no se ha investigado, es mejor decirlo que presentar una sospecha como hecho.",
        },
        {
          id: "claro", tipo: "defendible", origen: "fuente", next: "peticion",
          text: "Nueve de 48 entregas llegaron tarde; solo cuatro clientes han sido notificados. Falta contactar a los otros cinco hoy y revisar causas el jueves.",
          consequence: [{ who: "gerente", text: "Entendido: nueve de 48, cinco clientes sin avisar y la causa pendiente hasta el jueves. Lo reviso ahora." }],
          feedback: "El destinatario puede actuar y distinguir lo confirmado de lo pendiente: el dato va al inicio, la causa queda como pendiente y hay una acción con fecha.",
        },
        {
          id: "corto", tipo: "riesgosa", origen: "adaptado", next: "peticion",
          text: "Nueve de 48 entregas llegaron tarde y solo cuatro clientes están avisados. Te lo comento para que estés al tanto de cómo va la semana.",
          consequence: [{ who: "gerente", text: "Enterado. No me queda claro si esperas algo de mí o si solo me estás informando." }],
          feedback: "Es breve, pero no aclara qué decisión o coordinación se requiere. Un mensaje corto no es por eso un mensaje claro.",
        },
        {
          id: "promesa", tipo: "concepto_erroneo", origen: "adaptado", next: "peticion",
          text: "Nueve de 48 entregas llegaron tarde y solo cuatro clientes están avisados. Mañana quedará todo entregado y resuelto, sin falta alguna.",
          consequence: [{ who: "gerente", text: "¿Quién confirmó que es posible?" }, { who: null, text: "Nadie lo ha confirmado. Alejandra retira la promesa antes de continuar." }],
          feedback: "Confunde intención con compromiso confirmado: promete una solución sin responsable ni plazo verificable.",
        },
      ],
    },
    {
      id: "peticion", kind: "decision", moment: 5, origen: "fuente", from: "gerente", text: "¿Qué necesitas de mí exactamente?",
      options: [
        {
          id: "concreta", tipo: "defendible", origen: "fuente", next: "contacto",
          text: "Confirmar quién contacta hoy a los cinco clientes restantes y autorizar revisar causas tras el corte del jueves.",
          consequence: [{ who: "gerente", text: "De acuerdo. Hoy los contactas tú con apoyo de atención a clientes, y el jueves, con el corte, revisamos causas." }],
          feedback: "Una petición ejecutiva clara reduce la ambigüedad: dice qué se decide, sobre quiénes y para cuándo. No significa que todo deba pedirse a un superior.",
        },
        {
          id: "apoyo", tipo: "riesgosa", origen: "adaptado", next: "contacto",
          text: "Tu apoyo en lo que sea necesario para salir de esto, lo que tú veas que haga falta de aquí al jueves.",
          consequence: [{ who: "gerente", text: "Cuenta con él, pero no sé por dónde empezar. ¿Quieres que avise yo a alguien o que autorice algo?" }, { who: null, text: "Alejandra precisa: hace falta definir quién contacta hoy a los cinco clientes sin avisar." }],
          feedback: "«Apoyo en lo que sea» deja al gerente adivinando. La disposición a ayudar existe; lo que falta es decir qué se necesita.",
        },
        {
          id: "todos", tipo: "concepto_erroneo", origen: "adaptado", next: "contacto",
          text: "Que lo resuelvan todos: que cada equipo vea su parte y entre todos saquen lo que quedó pendiente.",
          consequence: [{ who: "gerente", text: "¿Quiénes son todos y qué hace cada quien? Si nadie tiene nombre, mañana seguimos igual." }, { who: null, text: "Alejandra precisa: hace falta un responsable de contactar hoy a los cinco clientes sin avisar." }],
          feedback: "Una petición dirigida a «todos» no tiene responsable. Sin quién ni para cuándo, nadie sabe qué le toca.",
        },
      ],
    },
    {
      id: "contacto", kind: "dato", moment: 6, origen: "fuente", title: "Llegan los datos de contacto de los cinco clientes pendientes",
      items: ["Uno de los cinco pide que le llamen por teléfono.", "Los otros cuatro aceptan que se les avise por correo."],
      calc: "1 + 4 = 5 clientes por avisar.",
      next: "ajuste",
    },
    {
      id: "ajuste", kind: "decision", moment: 6, origen: "adaptado", from: "alejandra", text: "Con esto, ¿cambio lo que pedí?",
      options: [
        {
          id: "rehacer", tipo: "riesgosa", origen: "conversion", next: "final",
          text: "Rehacer el mensaje completo desde el principio para explicar todo otra vez con este dato nuevo.",
          consequence: [{ who: "alejandra", text: "Me llevaría otra hora y los hechos son los mismos. Mientras tanto, los cinco clientes siguen sin aviso." }],
          feedback: "El dato nuevo cambia el canal de contacto, no los hechos ni la petición. Rehacer todo retrasa el aviso sin mejorar el mensaje.",
        },
        {
          id: "igual", tipo: "concepto_erroneo", origen: "conversion", next: "final",
          text: "Dejarlo como estaba: avisar a los cinco por correo, que es más rápido y el canal no importa.",
          consequence: [{ who: "alejandra", text: "Uno pidió llamada. Si le mando correo, además del retraso va a sentir que no lo escuchamos." }],
          feedback: "El canal cambia según la urgencia y la persona que recibe el mensaje. Ignorar lo que pidió un cliente le resta precisión al pedido.",
        },
        {
          id: "ajustar", tipo: "defendible", origen: "adaptado", next: "final",
          text: "Ajustar solo el pedido: hoy una llamada al cliente que la pidió y correo a los otros cuatro.",
          consequence: [{ who: "alejandra", text: "Cambio una línea y listo: una llamada y cuatro correos, hoy. Lo demás se queda igual." }],
          feedback: "Ajustaste el pedido sin rehacer todo el mensaje: precisión y capacidad de adaptación son cosas distintas, y aquí usaste las dos.",
        },
      ],
    },
    {
      id: "final", kind: "redactar", moment: 7, origen: "fuente", from: "alejandra",
      ask: "Escríbeme la versión final, de dos a cuatro oraciones.",
      prompt: "Redacta el mensaje para el gerente con tus palabras.",
      reference: "Nueve de 48 entregas de esta semana llegaron fuera de la fecha prometida y solo cuatro clientes han sido avisados. Todavía no conocemos la causa. Necesito que confirmes quién contacta hoy a los cinco restantes: uno pidió llamada y cuatro aceptan correo. Revisamos causas con el corte del jueves a las 16:00.",
      ideas: ["El dato va al inicio y es correcto: nueve de 48, cuatro avisados.", "La incertidumbre se ve: la causa no está confirmada.", "Hay una solicitud con responsable y plazo.", "Frente al borrador original cambió esto: dato al inicio, incertidumbre explícita, solicitud, responsable y plazo.", "Ser breve no es ser brusco: un tono agresivo no mejora el mensaje."],
      next: "cierre",
    },
    { id: "cierre", kind: "cierre", moment: 8, origen: "conversion", text: "Terminaste la práctica con Alejandra. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.lid.comunicacion-ejecutiva", title: "Una comunicación ejecutiva útil", origen: "fuente",
    text: "Una comunicación ejecutiva útil permite que otra persona entienda qué sucede, por qué importa y qué se necesita hacer. Puede comenzar por la conclusión, acompañarla de hechos verificables y cerrar con una acción concreta: quién hará qué y para cuándo. Un mensaje no necesita usar palabras complicadas para ser profesional. Si una causa aún no se ha investigado, es mejor decirlo que presentar una sospecha como hecho. La claridad no debe sacrificar respeto ni ocultar información incómoda. El canal y el tono cambian según la urgencia y la persona que recibirá el mensaje.",
  },
  calculations: [
    "39 + 9 = 48 (pedidos con fecha prometida esta semana)",
    "4 + 5 = 9 (clientes afectados: avisados y por avisar)",
  ],
  variant: {
    id: "exp.n1.lid.ese-correo-necesita-una-decision.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "El equipo de un centro de eventos prepara un fin de semana. La directora necesita información para decidir cuántas mesas preparar. Nadie te explica los datos: lee y responde.",
    question: "¿Qué le escribes a la directora, en cuatro oraciones como máximo?",
    intro: "Otro lugar y otras cifras. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Una parte se comprueba sola; lo que escribas queda en espera de revisión de una persona.",
    docs: [
      {
        id: "V", letter: "V", title: "Reservas del fin de semana", unit: "Datos del centro de eventos", cols: ["Dato", "Registro"], layout: "ficha",
        rows: [
          { id: "V.reservas", label: "Reservas para el fin de semana", cells: ["24"] },
          { id: "V.confirmadas", label: "Reservas confirmadas", cells: ["19"] },
          { id: "V.pendientes", label: "Las demás reservas", cells: ["Esperan respuesta del cliente; no se sabe si cancelarán"] },
          { id: "V.pide", label: "Qué pide la directora", cells: ["Lista de confirmadas, pendientes y responsable de seguimiento"] },
          { id: "V.plazo", label: "Para cuándo", cells: ["Jueves a las 11:00"] },
        ],
      },
      {
        id: "W", letter: "W", title: "Borrador que recibiste", unit: "Frase por frase",
        rows: [
          { id: "W.saludo", label: "Hola, te escribo por lo del fin de semana, que ha estado complicado con tantas llamadas." },
          { id: "W.cancelan", label: "Las que no han contestado seguro cancelan, como pasa siempre con las de última hora." },
          { id: "W.reservas", label: "Tenemos 24 reservas y 19 ya confirmaron." },
          { id: "W.mesas", label: "Así que con preparar mesas para las 19 confirmadas quedamos bien." },
          { id: "W.lista", label: "Luego te paso la lista cuando la tenga, a ver quién les llama." },
        ],
      },
    ],
    tasks: [
      { id: "pendientes", kind: "cifra", unit: "", criterion: "Mensaje principal y datos correctos: datos", weight: 15, origen: "adaptado", prompt: "¿Cuántas reservas siguen esperando respuesta del cliente?", answer: 5, calc: "24 − 19 = 5 reservas pendientes." },
      {
        id: "apertura", kind: "texto", criterion: "Mensaje principal y datos correctos: mensaje", weight: 15, origen: "adaptado",
        prompt: "Escribe la oración que abre el mensaje: qué pasa, con sus cifras.",
        reference: "De las 24 reservas del fin de semana, 19 están confirmadas y 5 siguen esperando respuesta del cliente.",
        ideas: ["Empieza por la situación, no por el contexto.", "Las cifras son las del registro.", "Se entiende por qué importa: de eso depende cuántas mesas preparar."],
      },
      {
        id: "peticion", kind: "texto", criterion: "Petición, responsable y plazo", weight: 35, origen: "fuente",
        prompt: "Completa lo que el mensaje pide o compromete.",
        fields: [{ id: "que", label: "Qué se entrega o se pide" }, { id: "quien", label: "Quién da seguimiento a las pendientes" }, { id: "cuando", label: "Para cuándo" }],
        reference: "Se entrega la lista de confirmadas y pendientes. Una persona con nombre da seguimiento a las cinco pendientes. La directora la tiene el jueves a las 11:00.",
        ideas: ["Dice qué recibirá la directora.", "Nombra a un responsable del seguimiento.", "Da el plazo: jueves a las 11:00.", "No hace falta un formato fijo de correo."],
      },
      {
        id: "supuestos", kind: "senalar", criterion: "No atribuir resultados no confirmados", weight: 20, origen: "adaptado",
        prompt: "Toca las frases del borrador que dan por hecho algo que nadie ha confirmado.",
        doc: "W", correct: ["W.cancelan", "W.mesas"],
        calc: "No se sabe si las pendientes cancelarán. Darlo por seguro, y preparar mesas solo para las confirmadas, trata una suposición como un hecho.",
      },
      {
        id: "cautela", kind: "texto", criterion: "Claridad y respeto", weight: 15, origen: "adaptado",
        prompt: "Escribe cómo dirías lo de las reservas pendientes, con claridad y sin culpar a nadie.",
        reference: "Todavía no sabemos si las cinco pendientes vendrán; conviene decidir las mesas cuando tengamos su respuesta o prever ambos casos.",
        ideas: ["Dice con claridad lo que no se sabe.", "No culpa a los clientes ni al equipo.", "No promete un resultado."],
      },
    ],
    passAt: 70,
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "El paquete pide resaltar frases que sean hechos o suposiciones; aquí son cinco tarjetas que se asignan tocando. Las dos suposiciones salen del correo de Alejandra y los tres hechos, del registro.",
    "Ordenar las tres tarjetas no se califica de forma estricta, como indica el paquete: se acepta cualquier orden y se muestra uno de referencia. Se ordena con botones, no arrastrando.",
    "El paquete permite «elaborar un mensaje o escoger entre borradores razonables». Aquí primero se escoge entre cuatro borradores, redactados a partir de las cuatro rutas del paquete, y la redacción propia queda para la versión final.",
    "El gerente no tiene nombre en el paquete; aquí aparece como «El gerente». Sus respuestas «¿Tenemos ese dato verificado?» y «¿Quién confirmó que es posible?» son del paquete; las demás son nuevas.",
    "Las respuestas «apoyo en lo que sea» y «que lo resuelvan todos» se alargaron para que las tres opciones tengan un largo parecido.",
    "El ajuste por el dato nuevo (una llamada y cuatro correos) es una decisión con tres rutas; las rutas «rehacer todo» y «dejarlo como estaba» son nuevas.",
    "Las explicaciones al tocar cada frase del correo son nuevas.",
    "Variante: el registro no muestra el número de reservas pendientes; se calcula (24 − 19 = 5) y se escribe. El paquete lo da como dato.",
    "Variante: el paquete describe «un borrador confuso» sin texto; las cinco frases del borrador se redactaron al convertir.",
    "Variante: el paquete pide un solo mensaje de hasta cuatro oraciones evaluado con cuatro criterios. Aquí el mensaje se escribe en tres partes (apertura, petición y cautela), una por criterio, para que cada una se pueda revisar por separado. Suman 65 puntos que no se califican de forma automática: quedan en espera de revisión de una persona.",
    "La regla para pasar la variante (70 de 100) es provisional.",
  ],
};
