/**
 * MÊTIS 2.0 · Repositorio Académico · lote 02 (paquete 1.1) · EDIT-N1-009 · Liderazgo
 * «Ser responsable no es hacerlo todo»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir.
 */
import type { Experiencia } from "./tipos";

export const N1_LIDERAZGO_RESPONSABLE: Experiencia = {
  id: "exp.n1.lid.responsable-no-es-hacerlo-todo",
  editorialId: "EDIT-N1-009",
  slug: "responsable-no-es-hacerlo-todo",
  version: 1,
  packageVersion: "1.1",
  title: "Ser responsable no es hacerlo todo",
  academy: "liderazgo",
  skills: { primary: "lid.fundamentos", secondary: ["lid.delegacion", "lid.comunicacion"] },
  level: 1,
  sourceIds: ["STAN_CORE", "INSEAD_CORE"],
  provenance: "creacion_original",
  minutes: [5, 7],
  objectives: [
    "Distinguir ejecutar una tarea, coordinar varias tareas y responder por el resultado del equipo.",
    "Reconocer que delegar no elimina la responsabilidad de dar seguimiento, y que dar órdenes sin aclarar resultados no equivale a dirigir.",
  ],
  characters: [{ id: "nora", name: "Nora", role: "Supervisora recién ascendida en una organización de eventos" }],
  docs: [
    {
      id: "A", letter: "A", title: "Agenda del evento", unit: "A tres días de la feria", cols: ["Actividad", "Responsable de ejecutarla", "Estado"], layout: "ficha",
      rows: [
        { id: "A.mobiliario", label: "Confirmar mobiliario", cells: ["Leo", "Proveedor respondió; falta confirmación final"], nota: { origen: "conversion", text: "La tarea tiene responsable. Lo que falta es una confirmación que Leo no puede dar solo." } },
        { id: "A.senaletica", label: "Preparar señalética", cells: ["Ana", "Material listo; falta enviar a impresión"], nota: { origen: "conversion", text: "El trabajo de Ana está hecho. Está detenido en el paso siguiente." } },
        { id: "A.recinto", label: "Revisar acceso al recinto", cells: ["Omar", "Sin horario de inspección"], nota: { origen: "conversion", text: "Nadie ha fijado la visita. Omar tiene la tarea, pero no la fecha." } },
      ],
    },
    {
      id: "B", letter: "B", title: "Mensajes cruzados", unit: "Chat del equipo",
      rows: [
        { id: "B.leo", label: "Leo: «Esperaba que Nora aprobara el presupuesto antes de confirmar».", nota: { origen: "conversion", text: "Leo espera una decisión de Nora. No es falta de esfuerzo." } },
        { id: "B.ana", label: "Ana: «No sé quién tiene autorización para mandar a imprimir».", nota: { origen: "conversion", text: "Nadie le ha dicho a Ana quién decide." } },
        { id: "B.omar", label: "Omar: «Creí que otra persona coordinaba la visita al recinto».", nota: { origen: "conversion", text: "Nadie tiene claro quién conecta esta tarea con las demás." } },
      ],
    },
  ],
  moments: ["La nota de voz", "Los documentos", "Hacer, coordinar, dirigir", "La conversación", "Dato nuevo", "Primera acción", "Tu mensaje", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "nora", channel: "Nota de voz transcrita",
      text: "La feria empieza en tres días. Ayer pasé toda la tarde armando cajas porque nadie parecía avanzar. Si quiero que todo salga bien, ¿tengo que hacerlo yo?",
      role: "Nora te pide consejo como colega invitado. No diriges al equipo: la ayudas a ver qué le toca a ella.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "Tres tareas con responsable y tres mensajes",
      prompt: "Toca cada actividad y cada mensaje para ver qué la tiene detenida. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "mapa",
    },
    {
      id: "mapa", kind: "clasificar", moment: 2, origen: "fuente", from: null,
      text: "Una misma persona puede hacer, coordinar y dirigir. Lo que importa es saber cuál de las tres cosas es cada acción.",
      prompt: "Asigna cada acción a hacer, coordinar o dirigir.",
      docs: [],
      groups: [{ id: "hacer", label: "Hacer" }, { id: "coordinar", label: "Coordinar" }, { id: "dirigir", label: "Dirigir" }],
      items: [
        { id: "cajas", text: "Preparar cajas", group: "hacer", why: "Es ejecutar una tarea concreta." },
        { id: "orden", text: "Definir el orden y las dependencias entre tareas", group: "coordinar", why: "Es conectar varias tareas para que avancen juntas." },
        { id: "meta", text: "Aclarar la meta y responder por el resultado del evento", group: "dirigir", why: "Es responder por lo que logra el equipo, no por una tarea." },
        { id: "imprenta", text: "Enviar la señalética a la imprenta", group: "hacer", why: "Es ejecutar una tarea concreta." },
        { id: "aprueba", text: "Decidir quién aprueba el presupuesto del mobiliario", group: ["dirigir", "coordinar"], why: "Asignar quién decide es parte de dirigir; también se acepta como coordinación, porque destraba una dependencia." },
      ],
      right: "Preparar cajas y enviar a imprenta es hacer. Definir orden y dependencias es coordinar. Aclarar la meta, asignar quién decide y responder por el resultado es dirigir. Dirigir no depende de la jerarquía: depende de por qué se responde.",
      next: "conversacion",
    },
    {
      id: "conversacion", kind: "decision", moment: 3, origen: "adaptado", from: "nora", text: "Hoy pensaba seguir con las cajas, que es lo que se ve atrasado. ¿Qué me dirías?",
      options: [
        {
          id: "quien", tipo: "defendible", origen: "fuente", next: "dato",
          text: "Antes de seguir: ¿quién decide cada cosa que está detenida?",
          consequence: [{ who: "nora", text: "El presupuesto lo apruebo yo, y no lo he hecho. La impresión... nadie lo sabe. Y la visita al recinto no la coordina nadie." }],
          feedback: "La pregunta descubrió tres bloqueos distintos, y ninguno era falta de esfuerzo: una aprobación pendiente, una autorización sin dueño y una visita sin coordinar.",
        },
        {
          id: "cajas", tipo: "riesgosa", origen: "adaptado", next: "dato",
          text: "Sigue con las cajas hoy; mañana revisas lo demás con calma.",
          consequence: [{ who: "nora", text: "Terminé las cajas. Leo sigue esperando mi aprobación, y Ana todavía no sabe quién autoriza la impresión." }],
          feedback: "Ayudar en una tarea puede servir en una urgencia. Pero mientras toda la atención está en las cajas, las autorizaciones que solo Nora puede destrabar siguen detenidas.",
        },
        {
          id: "resultado", tipo: "defendible", origen: "fuente", next: "dato",
          text: "Antes de seguir: ¿qué resultado esperas lograr el día de la feria?",
          consequence: [{ who: "nora", text: "Que el recinto abra a tiempo, con mobiliario y señalética puestos. Visto así, las cajas no son lo que lo impide." }],
          feedback: "Aclarar el resultado cambió el foco: de la tarea que se ve atrasada a lo que de verdad impide que el evento salga.",
        },
      ],
    },
    {
      id: "dato", kind: "dato", moment: 4, origen: "conversion", title: "Faltan dos días",
      items: ["La imprenta necesita el archivo de la señalética hoy para entregar a tiempo.", "El recinto solo hace inspecciones con cita."],
      next: "accion",
    },
    {
      id: "accion", kind: "decision", moment: 5, origen: "fuente", from: "nora", text: "Con dos días, ¿cuál sería mi primera acción?",
      options: [
        {
          id: "esfuerzo", tipo: "concepto_erroneo", origen: "adaptado", next: "mensaje_final",
          text: "Reúne al equipo y pídeles que se esfuercen más: quedan dos días.",
          consequence: [{ who: "nora", text: "Les pedí más esfuerzo. Ana me contestó: «Con gusto, pero sigo sin saber quién autoriza la impresión»." }],
          feedback: "Pedir más esfuerzo no aclara quién decide ni qué entregable falta. Lo que destraba es definir qué se entrega, quién aprueba y cuándo se revisa.",
        },
        {
          id: "definir", tipo: "defendible", origen: "fuente", next: "mensaje_final",
          text: "Define hoy qué entrega cada uno, quién aprueba y una revisión breve.",
          consequence: [{ who: "nora", text: "Aprobé el presupuesto de Leo, le dije a Ana que ella autoriza la impresión y Omar pidió la cita. Nos vemos diez minutos cada mañana." }],
          feedback: "Atendiste los tres bloqueos con lo que solo Nora podía dar: una decisión, una autorización y un seguimiento proporcional al tiempo que queda.",
        },
        {
          id: "asumir", tipo: "defendible", origen: "fuente", next: "mensaje_final",
          text: "Envía tú la señalética hoy y fija cuándo retomas las decisiones.",
          consequence: [{ who: "nora", text: "Mandé el archivo a la imprenta antes del cierre. A las cuatro me siento con Leo y Omar para lo suyo." }],
          feedback: "Asumir una tarea urgente es defendible si se dice cuándo se retoman la revisión y las decisiones. La imprenta cerraba hoy; lo demás quedó con hora.",
        },
      ],
    },
    {
      id: "mensaje_final", kind: "redactar", moment: 6, origen: "fuente", from: "nora",
      ask: "Escríbemelo para tenerlo presente estos dos días.",
      prompt: "Completa el mensaje para Nora.",
      fields: [{ id: "resp", label: "Tu responsabilidad es..." }, { id: "tarea", label: "...aunque la tarea específica de..." }, { id: "quien", label: "...corresponda a..." }],
      reference: "Tu responsabilidad es que el evento salga a tiempo y que cada quien sepa qué entrega y quién aprueba, aunque la tarea específica de preparar la señalética corresponda a Ana.",
      ideas: ["Separa responder por el resultado de ejecutar una tarea.", "Nombra una tarea concreta y a quien la ejecuta.", "No dice que dirigir sea hacerlo todo ni desentenderse."],
      next: "cierre",
    },
    { id: "cierre", kind: "cierre", moment: 7, origen: "conversion", text: "Terminaste la práctica con Nora. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.lid.hacer-coordinar-dirigir", title: "Hacer, coordinar y dirigir", origen: "fuente",
    text: "Un profesional puede hacer una tarea concreta, coordinar que varias tareas se conecten y dirigir para que un equipo alcance un resultado. Al dirigir se necesita aclarar el objetivo, asignar responsabilidades y crear un seguimiento proporcional al riesgo. Delegar significa dar a otra persona una tarea y suficiente autonomía para realizarla; no es desentenderse del resultado. A veces un líder también ejecuta tareas urgentes, pero si toda su atención se dedica a hacer el trabajo, nadie asegura que el conjunto avance. El liderazgo también exige escuchar por qué las personas no pueden cumplir.",
  },
  calculations: [],
  variant: {
    id: "exp.n1.lid.responsable-no-es-hacerlo-todo.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Una biblioteca municipal prepara una exposición. Tres encargados tienen tareas asignadas, pero nadie confirmó permisos ni horarios. Nadie te lo explica: lee y responde.",
    question: "¿Qué es ejecutar, qué es coordinar y quién responde por el resultado?",
    intro: "Otro equipo y otra situación. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Una parte se comprueba sola; lo que escribas queda en espera de revisión de una persona.",
    docs: [
      {
        id: "V", letter: "V", title: "Exposición de la biblioteca · pendientes", unit: "A una semana de abrir", cols: ["Pendiente", "Encargado", "Estado"], layout: "ficha",
        rows: [
          { id: "V.vitrinas", label: "Montar las vitrinas", cells: ["Elsa", "Vitrinas en bodega; no sabe qué día puede entrar a la sala"] },
          { id: "V.cedulas", label: "Imprimir las cédulas de cada pieza", cells: ["Iván", "Textos listos; espera saber cuántas piezas se exhiben"] },
          { id: "V.piezas", label: "Seleccionar las piezas", cells: ["Rut", "Lista hecha; nadie la ha revisado"] },
          { id: "V.permiso", label: "Permiso de uso de la sala", cells: ["Sin asignar", "Sin solicitar"] },
          { id: "V.horario", label: "Horario de montaje", cells: ["Sin asignar", "Sin confirmar"] },
        ],
      },
    ],
    tasks: [
      {
        id: "papeles", kind: "clasificar", criterion: "Distingue los tres papeles", weight: 45, origen: "adaptado",
        prompt: "Asigna cada acción al papel que le corresponde.",
        groups: [{ id: "ejecutar", label: "Ejecutar una tarea" }, { id: "coordinar", label: "Coordinar tareas" }, { id: "responder", label: "Responder por el resultado" }],
        items: [
          { id: "montar", text: "Montar las vitrinas en la sala", group: "ejecutar" },
          { id: "secuencia", text: "Acordar en qué orden entran piezas, vitrinas y cédulas", group: "coordinar" },
          { id: "abrir", text: "Asegurar que la exposición abra en la fecha anunciada", group: "responder" },
          { id: "imprimir", text: "Imprimir las cédulas", group: "ejecutar" },
          { id: "asignar", text: "Decidir quién solicita el permiso de la sala", group: ["responder", "coordinar"] },
        ],
        calc: "Montar e imprimir es ejecutar. Acordar el orden es coordinar. Asegurar la apertura y decidir quién solicita el permiso es responder por el resultado; lo segundo también se acepta como coordinación.",
      },
      {
        id: "vacio", kind: "texto", criterion: "Identifica el vacío de responsabilidad", weight: 30, origen: "adaptado",
        prompt: "¿Qué quedó sin responsable y por qué detiene a los demás?",
        reference: "Nadie tiene asignado el permiso de la sala ni el horario de montaje. Sin eso, quien monta las vitrinas no sabe cuándo puede entrar, aunque su tarea esté lista.",
        ideas: ["Nombra el permiso, el horario o ambos.", "Explica que las tareas asignadas dependen de eso.", "No culpa a los tres encargados."],
      },
      {
        id: "seguimiento", kind: "texto", criterion: "Propone seguimiento concreto", weight: 25, origen: "adaptado",
        prompt: "Redacta la primera acción de quien coordina la exposición.",
        fields: [{ id: "resultado", label: "Resultado que se busca" }, { id: "responsables", label: "Quién hace qué" }, { id: "fecha", label: "Para cuándo y cuándo se revisa" }],
        reference: "Resultado: sala autorizada y horario de montaje confirmado. Una persona solicita el permiso y otra acuerda el horario con la sala. Para el miércoles, con una revisión breve ese mismo día.",
        ideas: ["Tiene resultado, responsables y fecha.", "Atiende lo que no tenía dueño.", "Incluye un momento para revisar."],
      },
    ],
    passAt: 70,
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "El mapa de responsabilidades añade dos tarjetas a las tres del paquete: «enviar la señalética a la imprenta» (hacer) y «decidir quién aprueba el presupuesto» (dirigir, y también se acepta coordinar, por los solapamientos que el paquete permite).",
    "La conversación con Nora se convirtió en una decisión con las dos preguntas del paquete y la ruta de seguir con las cajas.",
    "El dato nuevo («faltan dos días»: la imprenta necesita el archivo hoy y el recinto solo inspecciona con cita) no está en el paquete. Se añadió para dar la restricción de tiempo que hace defendible asumir la señalética.",
    "Las respuestas de Nora después de cada decisión son nuevas.",
    "Variante: los nombres de los encargados, las tareas y los estados se redactaron al convertir; el paquete solo describe la situación.",
    "Variante: «vacío de responsabilidad» (30 puntos) y «seguimiento concreto» (25 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.",
    "La regla para pasar la variante (70 de 100) es provisional.",
  ],
};
