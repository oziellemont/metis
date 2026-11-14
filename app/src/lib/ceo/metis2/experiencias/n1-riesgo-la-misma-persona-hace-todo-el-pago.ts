/**
 * MÊTIS 2.0 · Repositorio Académico · lote 03 (paquete 1.2) · EDIT-N1-018 · Riesgo y gobierno
 * «La misma persona hace todo el pago»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir. Las cifras son las del paquete, sin cambios.
 *
 * Límite editorial del paquete: nada aquí concluye que la factura sea falsa ni que alguien actuó con mala intención.
 */
import type { Experiencia } from "./tipos";

export const N1_RIESGO_MISMA_PERSONA: Experiencia = {
  id: "exp.n1.rie.la-misma-persona-hace-todo-el-pago",
  editorialId: "EDIT-N1-018",
  slug: "la-misma-persona-hace-todo-el-pago",
  version: 1,
  packageVersion: "1.2",
  title: "La misma persona hace todo el pago",
  academy: "riesgo",
  skills: { primary: "rie.cumplimiento", secondary: ["rie.etica", "ope.procesos"] },
  level: 1,
  sourceIds: ["HBS_GOV", "INSEAD_CORE"],
  provenance: "creacion_original",
  minutes: [6, 8],
  objectives: [
    "Identificar qué es un control, qué riesgo atiende y qué evidencia deja.",
    "Reconocer la vulnerabilidad cuando una sola persona puede registrar y autorizar una operación sin revisión independiente.",
    "Distinguir un riesgo de error o abuso de una acusación de que ya ocurrió.",
  ],
  characters: [{ id: "rocio", name: "Rocío", role: "Coordinadora de una librería de barrio" }],
  docs: [
    {
      id: "A", letter: "A", title: "Procedimiento vigente de pagos", unit: "Librería de barrio · empresa ficticia",
      rows: [
        { id: "A.p1", label: "1. Se recibe una factura.", nota: { origen: "conversion", text: "Es el inicio del proceso. Todavía no interviene nadie más." } },
        { id: "A.p2", label: "2. La auxiliar administrativa registra un nuevo proveedor y su cuenta bancaria si es necesario.", nota: { origen: "adaptado", text: "Quién registra: la auxiliar. Nadie verifica con el proveedor los datos bancarios que se anotan o se cambian." } },
        { id: "A.p3", label: "3. La misma auxiliar marca la factura como autorizada.", nota: { origen: "adaptado", text: "Quién autoriza: la misma persona que registró. No hay revisión independiente." } },
        { id: "A.p4", label: "4. La misma auxiliar envía la transferencia.", nota: { origen: "adaptado", text: "Quién paga: la misma persona que registró y autorizó." } },
        { id: "A.p5", label: "5. Al final del mes se revisa únicamente el saldo de la cuenta, sin cotejo de factura, recepción y autorización.", nota: { origen: "conversion", text: "La única revisión llega cuando el dinero ya salió y no compara cada pago con su factura." } },
      ],
    },
    {
      id: "B", letter: "B", title: "Factura L-208 y evidencia disponible", unit: "La operación por la que pregunta el proveedor", cols: ["Elemento", "Dato"], layout: "ficha",
      rows: [
        { id: "B.factura", label: "Factura recibida", cells: ["L-208 · $3,600"] },
        { id: "B.proveedor", label: "Nombre de proveedor", cells: ["Papelería La Cima (ficticio)"] },
        { id: "B.pedido", label: "Pedido aprobado previamente", cells: ["Sí, por correo; compra de materiales"], nota: { origen: "conversion", text: "La compra sí estaba aprobada. Eso no dice si el material llegó ni a qué cuenta se paga." } },
        { id: "B.entrega", label: "Entrega de materiales", cells: ["Pendiente de confirmación por quien recibe"], nota: { origen: "conversion", text: "Falta que quien recibe confirme que el material llegó." } },
        { id: "B.cuenta", label: "Cuenta bancaria del proveedor", cells: ["Fue actualizada ayer en el registro"], nota: { origen: "adaptado", text: "Un cambio de cuenta no indica por sí mismo que algo esté mal. Sí amerita comprobarse antes de enviar dinero." } },
        { id: "B.validacion", label: "Evidencia de validación del cambio de cuenta", cells: ["No aparece en el registro"], nota: { origen: "conversion", text: "Nadie dejó constancia de haber confirmado el cambio con el proveedor." } },
      ],
    },
  ],
  moments: ["El mensaje", "Los documentos", "Los puntos débiles", "La factura", "Dato nuevo", "Los controles", "La propuesta", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "rocio", channel: "Mensaje",
      text: "Un proveedor pregunta por una factura. Me enteré de que una sola persona puede cargar sus datos, aprobar el pago y hacer la transferencia. Nadie ha denunciado nada, pero ¿eso es normal o conviene revisar el proceso?",
      role: "Ayudas a Rocío a mirar el procedimiento, no a las personas: qué puede fallar, qué lo evitaría y qué constancia quedaría.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "El procedimiento de pagos y la factura L-208",
      prompt: "Toca cada paso para ver quién registra, quién autoriza y quién paga. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "puntos",
    },
    {
      id: "puntos", kind: "senalar", moment: 2, origen: "fuente", from: null,
      text: "Segregación de funciones: repartir entre personas distintas las tareas que no conviene juntar o, si el equipo es pequeño, añadir una revisión que lo compense.",
      prompt: "Toca los dos pasos del procedimiento donde falta que alguien más compruebe antes de que salga el dinero.",
      docs: ["A"], correct: ["A.p2", "A.p3"],
      right: "Los dos puntos vulnerables: nadie verifica los cambios de cuenta bancaria y nadie más revisa la autorización. Eso no significa que toda actualización bancaria sea un problema.",
      wrong: {
        "A.p1": "Recibir la factura es el inicio normal del proceso. Ahí todavía no hay nada que otra persona deba comprobar.",
        "A.p4": "Aquí se ejecuta el pago. Si otra persona ya revisó la autorización y la cuenta, que la auxiliar envíe la transferencia deja de ser el punto débil. Busca los pasos anteriores.",
        "A.p5": "Esta revisión llega al final del mes, cuando el dinero ya salió, y solo mira el saldo. Busca los pasos anteriores al pago.",
      },
      fallback: "Busca dónde se anotan los datos bancarios y dónde se autoriza la factura.",
      next: "l208",
    },
    {
      id: "l208", kind: "decision", moment: 3, origen: "fuente", from: "rocio", text: "¿Qué hacemos con la factura L-208?",
      options: [
        {
          id: "retener", tipo: "riesgosa", origen: "adaptado", next: "llegaron",
          text: "Retener por tiempo indefinido todos los pagos a proveedores hasta rehacer el procedimiento completo.",
          consequence: [{ who: "rocio", text: "Hay otros proveedores con facturas en regla. Si dejo de pagarles a todos, la librería se queda sin surtido." }, { who: null, text: "Rocío decide revisar solo la L-208: pide confirmar la entrega y verificar la cuenta." }],
          feedback: "Reduce la exposición a pagos, pero puede interrumpir la operación sin necesidad. Conviene una verificación proporcional al riesgo concreto.",
        },
        {
          id: "verificar", tipo: "defendible", origen: "fuente", next: "llegaron",
          text: "Confirmar la recepción y verificar por un canal conocido el cambio de cuenta antes de pagar la factura.",
          consequence: [{ who: "rocio", text: "Le pregunto a quien recibe si llegó el material y llamo a la papelería al teléfono que ya teníamos." }],
          feedback: "Atiende el riesgo concreto con una verificación proporcional y protege antes de transferir. Separaste un riesgo de una prueba de incumplimiento.",
        },
        {
          id: "pagar", tipo: "concepto_erroneo", origen: "adaptado", next: "llegaron",
          text: "Pagar hoy porque es un proveedor conocido y comprobar después la entrega y el cambio de cuenta.",
          consequence: [{ who: "rocio", text: "Si la cuenta nueva tiene un error, el dinero ya se habría ido. Prefiero detener esta transferencia un día." }, { who: null, text: "Rocío detiene la transferencia y pide confirmar la entrega y verificar la cuenta." }],
          feedback: "Verificar después puede descubrir el error, pero el dinero podría ser difícil de recuperar. Que el proveedor sea conocido no comprueba la cuenta nueva.",
        },
      ],
    },
    {
      id: "llegaron", kind: "dato", moment: 4, origen: "fuente", title: "Responde quien recibe los materiales",
      items: ["Confirma que los materiales de la factura L-208 sí llegaron.", "El cambio de cuenta bancaria aún no fue corroborado con el proveedor."],
      next: "entrega",
    },
    {
      id: "entrega", kind: "decision", moment: 4, origen: "adaptado", from: "rocio", text: "Los materiales sí llegaron. ¿Ya podemos pagar?",
      options: [
        {
          id: "falta", tipo: "defendible", origen: "adaptado", next: "controles",
          text: "Aún no: la entrega está confirmada, pero falta verificar la cuenta con un contacto conocido.",
          consequence: [{ who: "rocio", text: "Llamo hoy a la papelería. Si confirman la cuenta, anoto con quién hablé y sale el pago." }],
          feedback: "Recepción correcta y cuenta bancaria verificada son comprobaciones distintas. Con la primera resuelta, queda la segunda antes de transferir.",
        },
        {
          id: "listo", tipo: "concepto_erroneo", origen: "adaptado", next: "controles",
          text: "Sí: si los materiales llegaron, todo está bien y no hace falta comprobar nada más del pago.",
          consequence: [{ who: "rocio", text: "Llegaron, sí. Pero la cuenta cambió ayer y nadie anotó haberlo confirmado. Eso sigue pendiente." }],
          feedback: "Concluir que todo está bien a partir de la entrega es insuficiente: que el material llegó no dice nada de la cuenta a la que se enviará el dinero.",
        },
        {
          id: "acusar", tipo: "concepto_erroneo", origen: "adaptado", next: "controles",
          text: "No: un cambio de cuenta sin validar demuestra que la auxiliar actuó mal y hay que señalarla hoy.",
          consequence: [{ who: "rocio", text: "No tengo nada contra ella: siguió el procedimiento tal como está escrito. Lo que falla es el procedimiento." }],
          feedback: "Encontrar una debilidad del procedimiento no demuestra intención ni falta de alguien. La situación muestra falta de control, no culpabilidad personal.",
        },
      ],
    },
    {
      id: "controles", kind: "clasificar", moment: 5, origen: "fuente", from: "rocio",
      text: "Somos pocas personas. ¿Qué controles sí nos sirven?",
      prompt: "Di qué debilidad atiende cada propuesta, o si no hace falta en un equipo pequeño.",
      docs: ["A"],
      groups: [{ id: "autorizacion", label: "Atiende: nadie más revisa la autorización" }, { id: "cuenta", label: "Atiende: nadie verifica el cambio de cuenta" }, { id: "innecesario", label: "No hace falta en este equipo" }],
      items: [
        { id: "auditor", text: "Contratar a un auditor permanente que revise cada pago", group: "innecesario", why: "No se necesita un auditor permanente: en equipos pequeños basta un control compensatorio, como la revisión del dueño." },
        { id: "segunda", text: "Aprobación o revisión de una segunda persona antes de liberar el pago", group: "autorizacion", why: "Hace que quien registra no sea la única persona que autoriza." },
        { id: "contacto", text: "Verificación del nuevo número de cuenta por contacto conocido, dejando registro", group: "cuenta", why: "Confirma el cambio con el proveedor antes de pagar y deja constancia." },
        { id: "lotes", text: "El propietario aprueba los pagos por lotes y revisa la conciliación semanal", group: "autorizacion", why: "Es un control compensatorio para un equipo de dos personas: una revisión independiente sin contratar a nadie." },
        { id: "sistema", text: "Comprar un sistema costoso de pagos antes de volver a pagar", group: "innecesario", why: "Un control no es lo mismo que un programa caro. Lo que falta aquí es una segunda revisión y una verificación." },
      ],
      right: "Dos controles bastan para empezar: una segunda aprobación antes de liberar el pago y la verificación de la cuenta nueva por un contacto conocido, con registro. En un equipo de dos, el propietario puede aprobar por lotes.",
      next: "propuesta",
    },
    {
      id: "propuesta", kind: "redactar", moment: 6, origen: "fuente", from: "rocio",
      ask: "Escríbemelo para presentarlo: riesgo, control y evidencia.",
      prompt: "Completa los tres campos con tus palabras.",
      fields: [{ id: "riesgo", label: "Riesgo identificado" }, { id: "control", label: "Control propuesto" }, { id: "evidencia", label: "Evidencia que deja" }],
      reference: "Riesgo identificado: una sola persona registra al proveedor, autoriza y paga, y nadie verifica los cambios de cuenta; un error podría pasar inadvertido. Control propuesto: una segunda persona aprueba antes de liberar el pago y la cuenta nueva se verifica con un contacto conocido. Evidencia que deja: la aprobación registrada con fecha y la nota de con quién se verificó la cuenta.",
      ideas: ["Describe el riesgo del procedimiento, sin acusar a una persona.", "El control dice quién lo hace y cuándo.", "La evidencia es algo que se puede revisar después.", "Encontrar una debilidad del procedimiento no demuestra intención ni falta de alguien."],
      next: "cierre",
    },
    { id: "cierre", kind: "cierre", moment: 7, origen: "conversion", text: "Terminaste la práctica con Rocío. Aquí queda lo que decidiste, lo que escribiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.rie.control-interno", title: "Control interno y segregación de funciones", origen: "fuente",
    text: "Un control interno es una medida diseñada para reducir la probabilidad o el impacto de errores, pérdidas o conductas indebidas. Por ejemplo, comprobar una entrega, autorizar un pago o verificar cambios en datos bancarios. La segregación de funciones busca que una sola persona no pueda iniciar, aprobar y ejecutar una transacción importante sin revisión: no porque sea deshonesta, sino porque todos los procesos necesitan barreras contra errores y abuso. En equipos pequeños se pueden aplicar controles compensatorios, como revisión del dueño, autorización independiente o conciliación periódica. Un control útil identifica quién lo hace, cuándo y qué evidencia queda. Cumplir el proceso no equivale automáticamente a cumplir todas las leyes que puedan aplicar.",
  },
  calculations: [],
  variant: {
    id: "exp.n1.rie.la-misma-persona-hace-todo-el-pago.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Una escuela privada pequeña recibe pagos por talleres. La dirección pide un control que pueda aplicar con dos personas. Nadie te explica los datos: lee y responde.",
    question: "¿Qué riesgo hay, qué control cabe y qué evidencia deja?",
    intro: "Otro lugar y otra operación. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Una parte se comprueba sola; lo que escribas queda en espera de revisión de una persona.",
    docs: [
      {
        id: "V", letter: "V", title: "Cobro de talleres · cómo se hace hoy", unit: "Escuela ficticia",
        rows: [
          { id: "V.cobra", label: "El encargado cobra los talleres en efectivo." },
          { id: "V.registra", label: "La misma persona registra los ingresos en el registro contable." },
          { id: "V.concilia", label: "La misma persona concilia el registro contable con el banco." },
          { id: "V.revision", label: "Nadie más revisa los cobros, el registro contable ni la conciliación." },
          { id: "V.faltantes", label: "No hay faltantes confirmados." },
          { id: "V.equipo", label: "La dirección cuenta con dos personas para aplicar un control." },
        ],
      },
    ],
    tasks: [
      {
        id: "riesgo", kind: "clasificar", criterion: "Identificación de riesgo real sin imputación", weight: 30, origen: "adaptado",
        prompt: "Separa lo que describe el riesgo de lo que acusa sin evidencia y de lo que es un hecho del caso.",
        groups: [{ id: "riesgo", label: "Describe el riesgo del procedimiento" }, { id: "acusa", label: "Acusa sin evidencia" }, { id: "hecho", label: "Hecho del caso" }],
        items: [
          { id: "inadvertido", text: "Un error al cobrar o al registrar podría pasar inadvertido", group: "riesgo" },
          { id: "quedo", text: "El encargado se ha quedado con dinero de los talleres", group: "acusa" },
          { id: "sin_faltantes", text: "No hay faltantes confirmados", group: "hecho" },
          { id: "nadie", text: "Como nadie más revisa, una diferencia entre lo cobrado y lo registrado no se detectaría", group: "riesgo" },
          { id: "seguro", text: "Seguro hay faltantes que el encargado ha ocultado", group: "acusa" },
        ],
        calc: "El riesgo es que errores de cobro o de registro pasen inadvertidos porque nadie más revisa. No hay faltantes confirmados: afirmar que el encargado tomó dinero es acusar sin evidencia.",
      },
      {
        id: "control", kind: "texto", criterion: "Control proporcional y preventivo o detectivo", weight: 35, origen: "fuente",
        prompt: "Propón un control que la escuela pueda aplicar con dos personas.",
        fields: [{ id: "control", label: "Control propuesto" }, { id: "quien", label: "Quién lo hace y cada cuándo" }],
        reference: "Una segunda persona revisa los recibos contra el registro contable y hace la conciliación con el banco, de forma periódica e independiente de quien cobra. Por ejemplo, cada semana.",
        ideas: ["Añade una revisión de alguien distinto de quien cobra.", "Cabe con dos personas: no pide contratar ni comprar nada costoso.", "Dice quién lo hace y con qué frecuencia."],
      },
      {
        id: "evidencia", kind: "clasificar", criterion: "Evidencia verificable de la revisión", weight: 25, origen: "adaptado",
        prompt: "¿Qué deja una evidencia que otra persona puede comprobar después?",
        groups: [{ id: "si", label: "Deja evidencia verificable" }, { id: "no", label: "No deja evidencia" }],
        items: [
          { id: "verbal", text: "Un aviso verbal de que todo cuadra", group: "no" },
          { id: "recibos", text: "Recibos numerados", group: "si" },
          { id: "conciliacion", text: "Conciliación fechada", group: "si" },
          { id: "confianza", text: "La confianza que la dirección tiene en el encargado", group: "no" },
          { id: "firma", text: "Firma o revisión digital de quien revisó", group: "si" },
          { id: "memoria", text: "Un repaso de memoria al terminar el mes", group: "no" },
        ],
        calc: "Recibos numerados, conciliación fechada y firma o revisión digital se pueden comprobar después. Un aviso verbal, la confianza o un repaso de memoria no dejan constancia.",
      },
      {
        id: "mensaje", kind: "texto", criterion: "Comunicación respetuosa y precisa", weight: 10, origen: "adaptado",
        prompt: "Escribe en una o dos oraciones cómo le explicarías el cambio al encargado.",
        reference: "No hay ningún faltante ni duda sobre tu trabajo. Vamos a añadir una segunda revisión porque hoy una sola persona hace todo el cobro, y eso deja a la escuela y a ti sin respaldo si aparece un error.",
        ideas: ["No acusa ni insinúa una falta.", "Explica el motivo: es el procedimiento, no la persona.", "Es preciso sobre qué cambia."],
      },
    ],
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "Los dos puntos vulnerables se señalan sobre el procedimiento: el paso 2 (se registra la cuenta bancaria sin verificación) y el paso 3 (la misma persona autoriza). Los pasos 4 y 5 también muestran debilidades; conviene revisar si se aceptan como respuesta. Las explicaciones al tocar un paso distinto son nuevas.",
    "La definición de segregación de funciones, que el paquete da como tarjeta contextual, se muestra como texto de la actividad de señalar.",
    "Quien elige retener todos los pagos o pagar primero ve su consecuencia y después Rocío revisa solo la L-208, para que el dato nuevo (los materiales sí llegaron) tenga sentido en las tres rutas.",
    "El dato nuevo se convirtió en una decisión con tres rutas. La ruta que señala a la auxiliar se redactó a partir de la retroalimentación del paquete para quien acusa sin pruebas.",
    "Colocar dos tarjetas de control sobre el diagrama se convirtió en clasificar cinco propuestas según la debilidad que atienden. Se añadieron la aprobación por lotes del propietario (del propio paquete), el auditor permanente y el sistema costoso (de las notas de QA) como propuestas que no hacen falta.",
    "Las explicaciones al tocar cada paso del procedimiento y cuatro renglones de la factura son nuevas.",
    "El tercer objetivo del paquete habla de distinguir el riesgo de una acusación; aquí se redactó como «riesgo de error o abuso», con las palabras de la microteoría.",
    "Variante: el cuaderno donde la escuela anota sus ingresos aparece como «registro contable».",
    "Ni los documentos, ni las rutas, ni la variante afirman que la factura sea falsa o que alguien actuó con mala intención; la única ruta que lo insinúa está marcada como concepto erróneo.",
    "Variante: la identificación del riesgo sin imputación y la evidencia verificable se comprueban clasificando; las afirmaciones se redactaron al convertir.",
    "Variante: el control propuesto (35 puntos) y la comunicación respetuosa (10 puntos) son respuestas escritas. No se califican de forma automática: quedan en espera de revisión de una persona.",
    "No hay regla para pasar la variante: la regla provisional se retiró y el puntaje se muestra sin veredicto.",
  ],
};
