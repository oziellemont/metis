/**
 * MÊTIS 2.0 · Repositorio Académico · lote 02 (paquete 1.1) · EDIT-N1-010 · Operaciones
 * «El pedido desapareció entre áreas»
 *
 * «fuente»: texto tal cual del paquete. «adaptado»: el paquete lo describe y aquí se redactó.
 * «conversion»: pieza añadida al convertir.
 */
import type { Experiencia } from "./tipos";

export const N1_OPERACIONES_PEDIDO_ENTRE_AREAS: Experiencia = {
  id: "exp.n1.ope.pedido-entre-areas",
  editorialId: "EDIT-N1-010",
  slug: "pedido-entre-areas",
  version: 1,
  packageVersion: "1.1",
  title: "El pedido desapareció entre áreas",
  academy: "operaciones",
  skills: { primary: "ope.procesos", secondary: ["ope.indicadores", "ope.calidad"] },
  level: 1,
  sourceIds: ["HBS_TOM", "INSEAD_CORE"],
  provenance: "creacion_original",
  minutes: [5, 7],
  objectives: [
    "Reconocer entrada, actividad, traspaso, responsable y salida dentro de un proceso básico.",
    "Construir la secuencia del proceso sin confundir una lista de personas con el flujo real del trabajo.",
  ],
  characters: [{ id: "bruno", name: "Bruno", role: "Encargado de una librería en línea" }],
  docs: [
    {
      id: "A", letter: "A", title: "Registro del pedido #481", unit: "Eventos anotados por el sistema", cols: ["Marca de tiempo", "Evento"],
      rows: [
        { id: "A.compra", label: "Lun 09:05", cells: ["Cliente confirma compra y domicilio"], nota: { origen: "conversion", text: "Aquí entra la orden, con los datos del cliente." } },
        { id: "A.pago", label: "Lun 09:07", cells: ["Sistema registra pago aprobado"], nota: { origen: "conversion", text: "El pago está aprobado. Eso no dice que el paquete haya salido." } },
        { id: "A.buzon", label: "Lun 09:09", cells: ["Orden enviada al buzón de almacén"], nota: { origen: "conversion", text: "Un traspaso: la orden pasa de un área a otra." } },
        { id: "A.pendiente", label: "Lun 10:20", cells: ["Almacén marca «pendiente: falta código de anaquel»"], nota: { origen: "conversion", text: "Almacén sí recibió la orden. Le falta un dato para poder empezar." } },
        { id: "A.pregunta", label: "Mié 11:00", cells: ["Cliente pregunta por el envío; aún no existe guía"], nota: { origen: "conversion", text: "Sin guía, el paquete no se ha entregado al transportista." } },
      ],
    },
    {
      id: "B", letter: "B", title: "Procedimiento actual", unit: "Tarjetas fuera de orden",
      rows: [
        { id: "B.a", label: "A. Confirmar al cliente la entrega y cerrar el pedido." },
        { id: "B.b", label: "B. Registrar el pedido validado." },
        { id: "B.c", label: "C. Preparar y empacar los libros." },
        { id: "B.d", label: "D. Generar guía y entregar el paquete al transportista." },
        { id: "B.e", label: "E. Verificar dirección y existencia del producto." },
      ],
    },
  ],
  moments: ["El chat", "Los documentos", "¿Salió o no?", "El flujo", "Entrada y salida", "El traspaso", "La propuesta", "Cierre"],
  start: "mensaje",
  nodes: [
    {
      id: "mensaje", kind: "mensaje", moment: 0, origen: "fuente", from: "bruno", channel: "Chat",
      text: "Un cliente pagó hace tres días. El almacén dice que no recibió el pedido y atención al cliente dice que sí salió. ¿Puedes ayudarnos a dibujar qué debe pasar desde que entra la orden?",
      role: "Bruno te pide ayuda como analista invitado. No diriges la librería: lo ayudas a ver cómo fluye el trabajo.",
      attachments: ["A", "B"], next: "explorar",
    },
    {
      id: "explorar", kind: "explorar", moment: 1, origen: "adaptado", title: "Lo que pasó y lo que debería pasar",
      prompt: "Toca cada evento del registro para ver qué dice y qué no dice. Puedes volver a estos documentos en cualquier momento.",
      docs: ["A", "B"], next: "salio",
    },
    {
      id: "salio", kind: "decision", moment: 2, origen: "conversion", from: "bruno", text: "Almacén dice una cosa y atención al cliente otra. ¿El pedido salió o no?",
      options: [
        {
          id: "pago", tipo: "concepto_erroneo", origen: "conversion", next: "flujo",
          text: "Sí salió: el sistema registró el pago aprobado el lunes.",
          consequence: [{ who: "bruno", text: "Busqué la guía para dársela al cliente y no existe. Pagado sí está; enviado, no." }],
          feedback: "Pago aprobado y paquete enviado son eventos distintos. En el registro no hay guía ni entrega al transportista: el pedido no ha salido.",
        },
        {
          id: "registro", tipo: "defendible", origen: "conversion", next: "flujo",
          text: "No ha salido: el registro no tiene guía ni entrega.",
          consequence: [{ who: "bruno", text: "Cierto. Lo último que hay es la nota de almacén del lunes y la pregunta del cliente." }],
          feedback: "Leíste el registro en vez de las versiones: sin guía no hubo entrega al transportista. Falta ver en qué paso se detuvo y por qué.",
        },
        {
          id: "culpa", tipo: "riesgosa", origen: "conversion", next: "flujo",
          text: "No salió: alguien de almacén no hizo su trabajo.",
          consequence: [{ who: "bruno", text: "Hablé con almacén. Me enseñaron su nota del lunes: «pendiente: falta código de anaquel». Sí la vieron; no podían empezar." }],
          feedback: "El pedido no salió, pero el registro no dice que almacén no trabajó: dice que le faltaba un dato para empezar. Conviene mirar el flujo antes de señalar a alguien.",
        },
      ],
    },
    {
      id: "flujo", kind: "ordenar", moment: 3, origen: "fuente", from: "bruno",
      text: "Estas son las tarjetas del procedimiento, como las tenemos pegadas en la pared.",
      prompt: "Ordena las tarjetas como debe fluir un pedido, de la primera a la última.",
      cards: [
        { id: "a", text: "A. Confirmar al cliente la entrega y cerrar el pedido." },
        { id: "b", text: "B. Registrar el pedido validado." },
        { id: "c", text: "C. Preparar y empacar los libros." },
        { id: "d", text: "D. Generar guía y entregar el paquete al transportista." },
        { id: "e", text: "E. Verificar dirección y existencia del producto." },
      ],
      order: ["b", "e", "c", "d", "a"], strict: true,
      hints: [
        { first: "d", then: "a", text: "Si se confirma la entrega antes de entregar el paquete al transportista, el cliente recibe un aviso de un paquete que todavía no sale." },
        { first: "b", then: "e", text: "Primero se registra el pedido; después se verifican su dirección y la existencia del producto." },
        { first: "e", then: "c", text: "Antes de empacar hay que verificar que el producto existe y que la dirección está completa." },
        { first: "c", then: "d", text: "La guía se genera para un paquete que ya está empacado." },
      ],
      right: "Registrar, verificar, empacar, enviar y confirmar: B, E, C, D, A. Cada paso recibe algo del anterior y entrega algo al siguiente.",
      fallback: "Revisa qué necesita cada paso para poder empezar.",
      next: "entrada_salida",
    },
    {
      id: "entrada_salida", kind: "clasificar", moment: 4, origen: "adaptado", from: null,
      text: "Un proceso transforma una entrada en una salida mediante actividades.",
      prompt: "¿Qué es la entrada de este proceso, qué es una actividad y qué es la salida?",
      docs: ["B"],
      groups: [{ id: "entrada", label: "Entrada" }, { id: "actividad", label: "Actividad" }, { id: "salida", label: "Salida" }],
      items: [
        { id: "orden", text: "Pedido pagado y validado, con sus datos", group: "entrada", why: "El proceso descrito empieza cuando entra la orden." },
        { id: "empacar", text: "Preparar y empacar los libros", group: "actividad", why: "Es un paso que transforma: de libros en anaquel a paquete listo." },
        { id: "guia", text: "Generar la guía de envío", group: "actividad", why: "La guía es un paso, no el final: el proceso descrito termina cuando el cliente recibe el paquete y se le informa." },
        { id: "entregado", text: "Paquete entregado y cliente informado", group: "salida", why: "Es el resultado que el proceso debe producir, según el alcance descrito." },
      ],
      right: "Entrada: el pedido pagado y validado con sus datos. Salida: el paquete entregado y el cliente informado. Los libros también entran a la preparación, pero el proceso descrito comienza con la orden.",
      next: "traspaso",
    },
    {
      id: "traspaso", kind: "senalar", moment: 5, origen: "adaptado", from: null,
      text: "La orden pasó de un área a otra. En algún punto, a quien la recibió le faltó algo para empezar.",
      prompt: "Toca el evento del registro donde se ve que faltaba información para empezar.",
      docs: ["A"], correct: "A.pendiente",
      right: "La orden llegó al almacén, pero faltaba el código de anaquel. Almacén la recibió y no pudo empezar: el problema está en lo que viaja con la orden en el traspaso.",
      wrong: {
        "A.buzon": "Aquí la orden se traspasa a almacén, y sí llega. Busca dónde se ve que algo faltaba.",
        "A.pregunta": "Esa es la consecuencia: el cliente pregunta y no hay guía. Busca dónde se detuvo.",
        "A.pago": "El pago se aprobó sin problema. Busca más adelante en el registro.",
      },
      fallback: "En ese evento todo siguió su curso. Busca dónde alguien anotó que faltaba algo.",
      next: "propuesta",
    },
    {
      id: "propuesta", kind: "decision", moment: 6, origen: "fuente", from: "bruno", text: "Para que no se repita, pensaba contratar a otro empacador. ¿Qué opinas?",
      options: [
        {
          id: "informacion", tipo: "defendible", origen: "fuente", next: "cierre",
          text: "Antes, revisa qué datos debe llevar la orden al pasar a almacén.",
          consequence: [{ who: "bruno", text: "Revisé diez órdenes. En cuatro faltaba el código de anaquel; por eso se quedaban en «pendiente»." }],
          feedback: "Fuiste al punto que el registro señala: la información que viaja con la orden. Una buena mejora empieza por confirmar dónde aparece el problema.",
        },
        {
          id: "contratar", tipo: "riesgosa", origen: "fuente", next: "cierre",
          text: "Sí, contrátalo: con más manos el almacén saca más pedidos.",
          consequence: [{ who: "bruno", text: "Llegó el nuevo empacador. El primer día recibió tres órdenes sin código de anaquel y tampoco pudo empezar." }],
          feedback: "El registro dice «falta código de anaquel», no «falta capacidad para empacar». Contratar puede ayudar a otros problemas, pero no atiende el faltante documentado.",
        },
        {
          id: "lista", tipo: "defendible", origen: "fuente", next: "cierre",
          text: "Antes, prueba una lista de verificación al enviar cada orden.",
          consequence: [{ who: "bruno", text: "Puse la lista: dirección, existencia y código de anaquel. Esta semana ninguna orden se quedó en «pendiente» por falta de datos." }],
          feedback: "Una lista de verificación en el traspaso atiende el faltante documentado. Es una prueba: conviene seguir mirando el registro para confirmar que funciona.",
        },
      ],
    },
    { id: "cierre", kind: "cierre", moment: 7, origen: "conversion", text: "Terminaste la práctica con Bruno. Aquí queda lo que decidiste y el concepto, para consultarlo cuando quieras." },
  ],
  theory: {
    id: "teoria.ope.proceso", title: "Qué es un proceso", origen: "fuente",
    text: "Un proceso transforma una entrada en una salida mediante actividades conectadas. No basta con saber quién trabaja: importa conocer qué recibe cada persona, qué entrega y en qué orden. Los traspasos entre equipos son puntos donde puede perderse información. Al dibujar un proceso conviene indicar actividades, responsables y decisiones que permiten avanzar o detenerse. Si una actividad recibe información incompleta, agregar personas al siguiente paso no necesariamente resuelve el atraso. Una buena mejora empieza por observar el flujo y confirmar dónde aparece el problema.",
  },
  calculations: [],
  variant: {
    id: "exp.n1.ope.pedido-entre-areas.variante-b",
    title: "Otra situación, sin apoyo",
    setting: "Una clínica veterinaria pidió reparar un equipo y lleva días esperando. Nadie te explica el registro: ordena, ubica y señala.",
    question: "¿Cómo debe fluir la reparación y dónde está detenida?",
    intro: "Otro lugar y otro proceso. Sin explicaciones, sin los documentos de la práctica y sin el concepto a la mano. Son tres tareas y las tres se comprueban solas.",
    docs: [
      {
        id: "V", letter: "V", title: "Solicitud de reparación · registro", unit: "Eventos anotados", cols: ["Marca de tiempo", "Evento"],
        rows: [
          { id: "V.solicitud", label: "Lun 08:30", cells: ["Recepción registra la solicitud: la báscula no enciende"] },
          { id: "V.diagnostico", label: "Lun 11:00", cells: ["El técnico entrega el diagnóstico con el costo estimado"] },
          { id: "V.pide", label: "Lun 11:10", cells: ["Se envía el costo a administración"] },
          { id: "V.espera", label: "Mié 16:00", cells: ["Autorización del costo: sin respuesta"] },
          { id: "V.pregunta", label: "Jue 09:00", cells: ["Recepción pregunta por la báscula; la reparación no ha empezado"] },
        ],
      },
    ],
    tasks: [
      {
        id: "orden", kind: "ordenar", criterion: "Orden causal", weight: 40, origen: "fuente",
        prompt: "Ordena los pasos como debe fluir una reparación, del primero al último.",
        cards: [
          { id: "prueba", text: "Prueba del equipo" },
          { id: "autorizacion", text: "Autorización de costo" },
          { id: "solicitud", text: "Solicitud registrada" },
          { id: "entrega", text: "Entrega al solicitante" },
          { id: "diagnostico", text: "Diagnóstico" },
          { id: "reparacion", text: "Reparación" },
        ],
        order: ["solicitud", "diagnostico", "autorizacion", "reparacion", "prueba", "entrega"],
        calc: "Solicitud registrada, diagnóstico, autorización de costo, reparación, prueba y entrega al solicitante.",
      },
      {
        id: "entrada_salida", kind: "clasificar", criterion: "Entrada y salida", weight: 25, origen: "adaptado",
        prompt: "¿Qué es la entrada del proceso, qué es una actividad y qué es la salida?",
        groups: [{ id: "entrada", label: "Entrada" }, { id: "actividad", label: "Actividad" }, { id: "salida", label: "Salida" }],
        items: [
          { id: "probado", text: "Equipo probado y entregado a quien lo pidió", group: "salida" },
          { id: "diagnosticar", text: "Diagnosticar la falla", group: "actividad" },
          { id: "solicitud", text: "Solicitud de reparación registrada", group: "entrada" },
          { id: "autorizar", text: "Autorizar el costo", group: "actividad" },
        ],
        calc: "Entrada: la solicitud registrada. Salida: el equipo probado y entregado. Diagnosticar y autorizar son actividades.",
      },
      {
        id: "bloqueo", kind: "senalar", criterion: "Identificación del traspaso o ausencia", weight: 35, origen: "adaptado",
        prompt: "Toca el renglón del registro que muestra qué falta para poder reparar.",
        doc: "V", correct: ["V.espera"],
        calc: "Falta la autorización del costo: se pidió el lunes y el miércoles seguía sin respuesta. Sin ella, la reparación no puede empezar.",
      },
    ],
    passAt: 70,
  },
  evidencePolicy: "no_registra",
  qa: { estado: "probado", importedAt: "2026-11-13", editorialReviewedAt: null, publishedAt: null },
  conversionNotes: [
    "La primera decisión («¿el pedido salió o no?») no está en el paquete. Se añadió a partir de su control de calidad, que pide que ninguna rama declare entregado un pedido sin evento de entrega.",
    "Ordenar el flujo se hace con botones de subir y bajar, no arrastrando. Si el orden no es B, E, C, D, A, se explica la primera dependencia que no se cumple y se vuelve a intentar.",
    "En «entrada y salida» se añadieron dos tarjetas de actividad (empacar y generar la guía) para tratar la confusión entre guía generada y salida del proceso.",
    "El paquete no pide una respuesta escrita en esta experiencia; no se añadió.",
    "Variante: el equipo a reparar (una báscula), las marcas de tiempo y los eventos del registro se redactaron al convertir. No se presupone ningún requisito de salud.",
    "Variante: las tres tareas se comprueban solas (ordenar, clasificar y señalar el renglón). El orden vale todo o nada.",
    "La regla para pasar la variante (70 de 100) es provisional.",
  ],
};
