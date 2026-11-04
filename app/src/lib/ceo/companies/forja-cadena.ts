/**
 * mêtis CEO · Forja · cadena piloto de consecuencias (v7): «La caja que está en el almacén».
 *
 * Decisión del día 2: cómo liberar la caja atrapada en 41 días de inventario (el encargo de Forja pide caja).
 *  - Con los equipos de cada línea (a)   → día 4: la mejora funciona y choca con el bono por piezas (positiva).
 *  - Congelar compras de golpe (b)        → día 4, incierto (45 de cada 100): Aurora adelanta su programa y falta
 *                                           materia prima para una pieza crítica (negativa).
 *  - Factoraje sobre facturas de Aurora (c) → día 5, incierto (40 de cada 100): Aurora ve el aviso de cesión y pide
 *                                           estados financieros antes de la plataforma 2028.
 * La probabilidad se dice desde el día 2. Solo llega en periodos con reglas v7 o posteriores (`since: 7`).
 */
import type { Item } from "../types";

const V = 7;

export const CADENA_FORJA: Item[] = [
  {
    id: "fn-d2-inventario", day: 2, slot: 2, channel: "reporte", from: "marcos", since: V,
    involves: ["ramon", "chuy", "greg"],
    subject: "41 días de inventario: la caja está en el almacén",
    preview: "Vendemos más y la caja no sube. Son cerca de $190 M parados en inventario…",
    body: [
      "Director: cerramos el mes con 41 días de inventario; la meta del fondo es 25. Son cerca de $190 M parados en materia prima, piezas en proceso y producto terminado. Zertuche preguntó en el comité por qué la caja no sube si vendemos más.",
      "Ramón dice que el colchón existe porque Aurora cambia su programa cada semana y nadie quiere ser el proveedor que le para la línea. Las dos cosas son ciertas.",
      "Te pongo tres caminos. Ninguno es gratis.",
    ],
    data: {
      title: "Lo que sabes",
      rows: [
        ["Días de inventario hoy", "41 (meta del fondo: 25)"],
        ["Liberar 10 días de inventario", "≈ $45 M de caja"],
        ["Factoraje sobre facturas de Aurora", "1.1 % mensual · en 4 de cada 10 casos el cliente ve el aviso de cesión y pide explicaciones"],
        ["Ramón: si se congelan compras de golpe", "En 4 o 5 de cada 10 meses Aurora mueve su programa lo suficiente para dejarnos cortos"],
        ["Cargo de Aurora por paro de línea", "Hasta $2 M por hora"],
      ],
      note: "Estimaciones de Marcos y de Ramón con el cierre del mes. Cifras ficticias de este caso, no estadísticas reales.",
    },
    ask: "¿Cómo liberas la caja atrapada en inventario?",
    options: [
      { id: "a", stance: { chuy: 2, ramon: 1, marcos: -1 }, text: "Bajar a 30 días en ocho semanas con los equipos de cada línea; Calidad cuida las piezas críticas de Aurora.", reply: ["Es más lento de lo que el fondo quiere, pero es más sólido.", "(Chuy) En la línea 3 sabemos dónde está el exceso. En una semana lo tenemos mapeado."], outcome: "Liberas caja poco a poco y sin arriesgar la entrega. Le cuesta horas a la planta y el fondo verá el resultado hasta el siguiente cierre.", effects: { caja: 2, equipo: 2, margen: -1, consejo: -1 }, style: { horizonte: 2, estilo: 1 }, score: 3 },
      { id: "b", stance: { marcos: 1, ramon: -2 }, text: "Congelar compras de materia prima tres semanas y producir con lo que hay, para que el fondo vea la caja este mes.", reply: ["Se libera rápido, eso sí.", "(Ramón) Director, si Aurora mueve su programa nos quedamos sin piezas. Yo no firmo eso."], outcome: "La caja sube este mismo mes. Te quedas sin colchón justo con el cliente que cobra por hora de paro.", effects: { caja: 4, consejo: 1, clientes: -2, equipo: -1 }, style: { horizonte: -2, riesgo: 2 }, score: 1 },
      { id: "c", stance: { marcos: 1, ramon: 1, greg: -1 }, text: "Adelantar caja con factoraje de las facturas de Aurora y bajar el inventario despacio, sin mover la producción.", reply: ["Lo puedo cerrar con el banco esta semana.", "Ojo: cuesta, y Aurora va a recibir el aviso de cesión de sus facturas."], outcome: "Tienes la caja sin tocar la operación. Pagas intereses cada mes y el inventario sigue ahí.", effects: { caja: 3, equipo: 1, margen: -2 }, style: { riesgo: 1, foco: 1 }, score: 2 },
    ],
    expired: { reply: ["Sin indicación, Compras sigue igual."], outcome: "Sin decisión, el inventario siguió en 41 días y el fondo volvió a preguntar.", effects: { caja: -1, consejo: -2 } },
    lesson: "finanzas",
    bitacora: { title: "La caja que está en el almacén", text: "Una empresa que vende más puede tener menos caja si el inventario crece más rápido que las ventas. Liberarlo es dinero real, pero el colchón existe por algo: la pregunta es quién decide qué se recorta y con qué riesgo.", nota: "El inventario es caja con otra forma: cuesta mantenerlo y cuesta quedarse sin él." },
    areas: ["finanzas", "operacion", "personas"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «con los equipos»: funciona y choca con el bono
  {
    id: "fn-c-inv-lineas", day: 4, slot: 3, channel: "whatsapp", from: "chuy", since: V,
    involves: ["ramon", "teresa"],
    trigger: { item: "fn-d2-inventario", options: ["a"] },
    subject: "Chuy Morales", preview: "Director, en la línea 3 bajamos de 41 a 31 días sin un solo faltante…",
    body: [
      "Director, buenas noticias de la línea 3: desde que lo arrancamos bajamos de 41 a 31 días de inventario sin un solo faltante.",
      "Encontramos $12 M en piezas de un modelo que Aurora ya no pide. Y la gente propone hacerlo en las otras cuatro líneas.",
      "Nomás una cosa: el bono de Ramón y de los supervisores se paga por piezas producidas, no por inventario. Así nadie va a querer producir menos.",
    ],
    data: { title: "Lo que sabes", rows: [["Inventario de la línea 3", "31 días (antes 41)"], ["Caja liberada en la línea 3", "$11 M"], ["Piezas de un modelo descontinuado", "$12 M en libros · se venden en $2 M"], ["Bono de supervisores", "100 % por piezas producidas"]] },
    ask: "¿Cómo sigues?",
    options: [
      { id: "a", stance: { chuy: 2, teresa: 1, ramon: -1 }, text: "Llevarlo a las cinco líneas y cambiar el bono: mitad por entregas a tiempo y mitad por días de inventario.", reply: ["¡Eso, Director! Así sí se va a mover la planta.", "(Ramón) Lo del bono lo tengo que platicar con mis supervisores. No les va a gustar a todos."], outcome: "La mejora se vuelve sistema y el bono deja de empujar al exceso. Ramón y algunos supervisores sienten que les cambiaste las reglas a medio año.", effects: { caja: 3, consejo: 1, equipo: -2, margen: -1 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { chuy: 1, ramon: 1, teresa: -1 }, text: "Llevarlo a las cinco líneas sin tocar el bono todavía, y revisar los incentivos con Teresa en enero.", reply: ["Va, Director. Aunque sin el bono va a costar más trabajo.", "(Teresa) Si esperamos a enero, que quede en la agenda desde hoy."], outcome: "Avanzas sin pelear el bono. La planta sigue cobrando por producir más, así que el avance dependerá de quién lo empuje.", effects: { caja: 2, equipo: 1, margen: -1 }, style: { conflicto: -1, horizonte: 1 }, score: 2 },
      { id: "c", stance: { chuy: -2, ramon: 1 }, text: "Dejar la línea 3 como ejemplo y usar los $11 M liberados para adelantar el pago al fondo este trimestre.", reply: ["Ah, bueno. Pensé que íbamos por las demás líneas.", "La gente estaba entusiasmada, Director."], outcome: "El fondo recibe una buena noticia este trimestre. La planta aprende que su idea sirvió para el reporte, no para cambiar cómo se trabaja.", effects: { consejo: 3, caja: 1, equipo: -2 }, style: { horizonte: -1, foco: 1 }, score: 1 },
    ],
    expired: { reply: ["(Chuy) Sin respuesta, seguimos solo en la línea 3."], outcome: "Sin decisión, la mejora se quedó en una línea y el entusiasmo se enfrió.", effects: { equipo: -2 } },
    lesson: "cultura",
    bitacora: { title: "Una buena idea necesita un incentivo que no la contradiga", text: "Lo que la línea 3 logró se puede repetir, pero no mientras el bono premie producir de más. Escalar una mejora casi siempre obliga a revisar cómo se paga.", nota: "La gente hace lo que se mide y se paga, no lo que se pide en una junta." },
    areas: ["cultura", "personas", "operacion"],
  },

  // ───────────────────────────────────────────── DÍA 4 · camino «congelar compras»: a veces falta la pieza
  {
    id: "fn-c-inv-faltante", day: 4, slot: 3, channel: "llamada", from: "ramon", since: V,
    involves: ["greg", "marcos", "fermin"],
    trigger: { item: "fn-d2-inventario", options: ["b"], roll: [0, 0.45] },
    subject: "Llamada perdida · Ing. Ramón Villarreal", preview: "Director, Aurora adelantó dos días el programa y nos falta materia prima…",
    body: [
      "Mensaje de voz · 0:51",
      "«Director, Aurora adelantó dos días el programa de la SUV y nos falta materia prima para una pieza crítica. El proveedor la puede traer, pero no antes del jueves. Si no surtimos el miércoles, les paramos la línea.»",
      "«Necesito que usted decida ya.»",
    ],
    data: { title: "Lo que sabes", rows: [["Faltante", "1 pieza crítica · 2 turnos de producción"], ["Flete aéreo urgente de la materia prima", "$3.5 M · llega mañana"], ["Cargo de Aurora por paro de línea", "Hasta $2 M por hora"], ["Compras congeladas", "Desde tu decisión de bajar inventario"]] },
    ask: "Aurora puede quedarse sin piezas. ¿Qué haces?",
    options: [
      { id: "a", stance: { ramon: 2, greg: 1, marcos: -1 }, text: "Pagar el flete aéreo, descongelar las compras críticas y llamarle yo a Greg hoy para avisarle del riesgo.", reply: ["Gracias, Director. Con eso llegamos.", "(Greg) Appreciate the heads-up. Mándeme el plan por escrito."], outcome: "Pagas caro el flete y pierdes parte de la caja que habías liberado. Aurora no para y se entera por ti.", effects: { caja: -3, clientes: 1, equipo: 1 }, style: { horizonte: 1, conflicto: 1 }, score: 3 },
      { id: "b", stance: { ramon: 1, greg: -1 }, text: "Pedirle a Aurora mover dos días su programa y ofrecer pagar nosotros sus horas extra si hacen falta.", reply: ["Puede funcionar si Greg tiene margen.", "(Greg) I'll check. No le prometo nada y esto va a su scorecard."], outcome: "Si Aurora acepta, te ahorras el flete. Tu scorecard registra que pediste ajustar su programa por un problema tuyo.", effects: { clientes: -2, caja: 1 }, style: { conflicto: -1, riesgo: 1 }, score: 2 },
      { id: "c", stance: { marcos: 1, ramon: -1, fermin: -1 }, text: "Surtir parcial el miércoles con lo que haya y meter tres turnos extra el fin de semana para completar.", reply: ["Se puede, pero la gente ya viene de dos fines de semana.", "(Fermín) Director, la base ya está cansada de pagar las prisas."], outcome: "No pagas flete. Aurora recibe incompleto y la planta vuelve a pagar con fines de semana una decisión de compras.", effects: { caja: 2, clientes: -1, equipo: -2 }, style: { foco: 1, riesgo: 1 }, score: 1 },
    ],
    expired: { reply: ["(Greg) Su planta no surtió. Se aplica el cargo por paro de línea."], outcome: "Sin decisión, Aurora paró su línea dos horas y aplicó el cargo.", effects: { caja: -4, clientes: -4 } },
    lesson: "finanzas",
    bitacora: { title: "El colchón que se quitó de golpe", text: "Bajar el inventario liberó caja, pero quitarlo sin revisar qué piezas eran críticas dejó a la planta expuesta al primer cambio de programa de Aurora. El costo llegó en otra forma: fletes, cargos o fines de semana.", nota: "Un riesgo que aceptaste para mejorar la caja se paga con caja cuando aparece." },
    areas: ["operacion", "clientes", "finanzas"],
  },

  // ───────────────────────────────────────────── DÍA 5 · camino «factoraje»: a veces el cliente lo nota
  {
    id: "fn-c-inv-factoraje", day: 5, slot: 3, channel: "email", from: "greg", since: V,
    involves: ["marcos", "daniela"],
    trigger: { item: "fn-d2-inventario", options: ["c"], roll: [0, 0.4] },
    subject: "Aurora Motors · Supplier financial review", preview: "Tesorería recibió el aviso de cesión de sus facturas. Necesitamos sus estados financieros…",
    body: [
      "Estimado Director:",
      "Nuestro departamento de Tesorería recibió el aviso de cesión de sus facturas a un banco. Es la primera vez que Forja Norte lo hace en ocho años.",
      "Para la evaluación de proveedores de la plataforma 2028 necesitamos sus estados financieros del trimestre y una explicación de su situación de liquidez antes del viernes.",
      "Greg Holloway\nPurchasing Manager · Aurora Motors México",
    ],
    data: { title: "Lo que sabes", rows: [["Factoraje vigente", "$40 M adelantados · 1.1 % mensual"], ["Lo que pide Aurora", "Estados financieros y explicación de liquidez"], ["Plataforma 2028", "Evaluación de proveedores en 3 semanas"], ["Inventario", "Sin cambio: el factoraje no lo tocó"]] },
    ask: "Aurora pregunta por tu liquidez. ¿Qué le respondes?",
    options: [
      { id: "a", stance: { greg: 1, daniela: 1, marcos: -1 }, text: "Mandar los estados financieros y explicar que el factoraje es temporal mientras bajamos inventario.", reply: ["Thank you. Eso es lo que necesitaba ver.", "(Marcos) Les estamos enseñando todo, Director. Espero que sirva."], outcome: "Expones tus números a tu cliente más grande. Aurora entiende la situación, aunque te anota como proveedor a vigilar.", effects: { clientes: 1, consejo: 1, caja: -1, margen: -1 }, style: { conflicto: 1, horizonte: 1 }, score: 3 },
      { id: "b", stance: { daniela: 1, marcos: -2 }, text: "Cancelar el factoraje este mes para que no lleguen más avisos y cubrir el hueco con el crédito del banco.", reply: ["Noted.", "Igual necesito los estados financieros antes del viernes."], outcome: "El aviso deja de llegar a Aurora. Cambias un costo financiero por otro y la pregunta de liquidez sigue sin respuesta.", effects: { clientes: 1, margen: 1, consejo: -1, caja: -1 }, style: { riesgo: 1, foco: 1 }, score: 2 },
      { id: "c", stance: { marcos: 1, greg: -2 }, text: "Responder que es práctica normal de tesorería y no mandar estados financieros hasta que lo pida el contrato.", reply: ["Director, no es una solicitud opcional si quiere participar en 2028.", "Lo dejo anotado."], outcome: "Proteges tu información, pero ante tu cliente principal la falta de respuesta se lee como problema.", effects: { caja: 1, margen: 1, clientes: -2 }, style: { conflicto: 2, horizonte: -1 }, score: 1 },
    ],
    expired: { reply: ["(Greg) Sin respuesta, lo marcamos como riesgo financiero."], outcome: "Sin respuesta, Aurora anotó a Forja como riesgo financiero para 2028.", effects: { clientes: -3, consejo: -1 } },
    lesson: "negociacion",
    bitacora: { title: "Cuando la caja se nota afuera", text: "El factoraje resolvió la caja sin tocar la operación, pero le avisó al cliente principal que algo pasaba. Con un cliente que concentra la venta, cómo financias tu operación también es parte de la relación.", nota: "Cada decisión financiera manda una señal; elige si la explicas tú o la interpreta otro." },
    areas: ["clientes", "finanzas", "comunicacion"],
  },
];
