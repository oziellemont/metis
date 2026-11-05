/**
 * mêtis CEO · Seguimientos de capítulo (carrera continua).
 *
 * En el segundo capítulo ya no llegan los asuntos de tu llegada; en su lugar regresan las decisiones que tomaste
 * el mes anterior. Cada seguimiento solo llega si la última vez que decidiste el asunto de origen elegiste una de
 * las opciones de `recall`, y solo en los capítulos de `stages` (Estabilizar a Acelerar).
 */
import type { Item } from "../types";

const S: [number, number] = [1, 3];

// ───────────────────────────────────────────────── Forja · Aurora Motors
export const SEGUIMIENTOS_FORJA: Item[] = [
  {
    id: "fn-s-precio-mas", day: 3, slot: 3, channel: "email", from: "greg", stages: S,
    recall: { item: "fn-d2-precio", options: ["a"] },
    involves: ["marcos", "daniela"],
    subject: "Aurora Motors · Productividad para la plataforma 2028",
    preview: "Agradecemos el 5%. Para la plataforma 2028 necesitamos 3% de productividad cada año durante cinco años…",
    body: [
      "Estimado Director:",
      "Agradecemos la disposición del mes pasado con el 5%. Como sabe, estamos por asignar la plataforma SUV 2028.",
      "Para considerar a su empresa necesitamos un compromiso de 3% de productividad cada año durante los cinco años del programa.",
      "Greg Holloway\nPurchasing Manager · Aurora Motors México",
    ],
    data: { title: "Marcos (Finanzas) te armó esto", rows: [["Margen de la cuenta después del 5%", "3.4%"], ["Con 3% anual por cinco años", "Margen negativo desde el tercer año"], ["Ahorro que ha dado un rediseño en otras piezas", "2% a 4% por pieza"], ["Plataforma 2028 asignada", "Todavía no"]], note: "Nota de Marcos: «Lo que dimos el mes pasado no compró nada. Ahora piden más por lo mismo.»" },
    ask: "¿Qué le respondes a Greg?",
    options: [
      { id: "a", stance: { greg: -1, marcos: 1, daniela: 1 }, text: "Mostrarle el costo real por pieza y ofrecer el 3% solo si sale de un rediseño hecho con sus ingenieros; sin ahorro, no.", reply: ["Entiendo. Lo llevo al comité, aunque no es lo que esperábamos.", "Mándeme el costo por pieza esta semana."], outcome: "Dejas de regalar margen y conviertes el descuento en trabajo conjunto. Greg no queda contento, pero tiene algo que defender.", effects: { margen: 3, clientes: -2, consejo: 2 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { greg: 2, marcos: -2 }, text: "Aceptar también el 3% anual para asegurar la plataforma; el volumen de 2028 compensará el margen que estamos perdiendo hoy.", reply: ["Excelente, Director. Lo anoto en su evaluación.", "Le haré llegar el anexo del programa."], outcome: "Greg te pone bien en la lista. Firmas cinco años de margen que baja cada año por una plataforma que nadie te prometió.", effects: { clientes: 4, margen: -7, consejo: -3 }, style: { riesgo: 1, conflicto: -2 }, score: 0 },
      { id: "c", stance: { greg: -2, daniela: -1, marcos: 1 }, text: "Decirle que ya dimos suficiente y que, si insiste, dejamos de cotizar la plataforma 2028 y buscamos otra armadora.", reply: ["Tomo nota de su postura, Director.", "Le informo que otros proveedores sí están participando."], outcome: "Proteges el margen de hoy, pero la amenaza no tiene respaldo: no hay otra armadora lista. Daniela siente que le cerraste la puerta.", effects: { margen: 2, clientes: -6, consejo: -1, caja: 1 }, style: { conflicto: 2, riesgo: 1 }, score: 1 },
    ],
    expired: { reply: ["(Daniela) Greg anotó que no respondimos. Nos bajó en la lista de la plataforma."], outcome: "Sin respuesta, Aurora decide sin tu propuesta.", effects: { clientes: -4, consejo: -2 } },
    lesson: "negociacion",
    bitacora: { title: "Lo que concedes enseña a pedir", text: "Cuando cedes todo para ganar algo que no está prometido, la otra parte aprende que presionar funciona y regresa por más. Lo que corta el ciclo es ligar cualquier concesión a valor que se pueda demostrar.", nota: "Un descuento sin contrapartida no compra lealtad: compra la siguiente petición." },
    areas: ["clientes", "negociacion", "finanzas"],
  },
  {
    id: "fn-s-precio-rfq", day: 3, slot: 3, channel: "email", from: "greg", stages: S,
    recall: { item: "fn-d2-precio", options: ["b", "c"] },
    involves: ["marcos", "daniela", "ramon"],
    subject: "Aurora Motors · Solicitud de cotización plataforma SUV 2028",
    preview: "Les invitamos a cotizar. El precio objetivo por pieza está 6% abajo de su precio actual…",
    body: [
      "Estimado Director:",
      "Les invitamos a cotizar los soportes de la plataforma SUV 2028. El precio objetivo por pieza está 6% abajo de su precio actual.",
      "Valoramos la propuesta del mes pasado. Las cotizaciones se reciben en tres semanas.",
      "Greg Holloway\nPurchasing Manager · Aurora Motors México",
    ],
    data: { title: "Daniela (Comercial) te armó esto", rows: [["Venta de la plataforma", "$900 M en cinco años"], ["Precio objetivo", "−6% vs. hoy"], ["Ahorro posible con celdas nuevas", "≈ 4%"], ["Competidores invitados", "3"]], note: "Nota de Daniela: «Si cotizamos al objetivo sin cambiar el proceso, ganamos el programa y perdemos dinero.»" },
    ask: "¿Cómo cotizas la plataforma?",
    options: [
      { id: "a", stance: { greg: 1, daniela: 1, marcos: -1 }, text: "Cotizar 3% abajo con el ahorro de las celdas nuevas y proponer a Aurora un rediseño de dos piezas para cerrar la brecha.", reply: ["Es una propuesta seria. La comparo con las demás.", "El rediseño me interesa; tráigame a sus ingenieros."], outcome: "Compites con lo que sí puedes sostener. No es el precio más bajo, pero es el que Aurora puede creer.", effects: { clientes: 2, margen: -1, caja: -2, consejo: 2 }, style: { horizonte: 2, estilo: 1 }, score: 3 },
      { id: "b", stance: { greg: 2, marcos: -2, ramon: -1 }, text: "Cotizar justo al precio objetivo para asegurar el programa y buscar después, ya con el contrato firmado, cómo bajar costos.", reply: ["Perfecto, Director, aunque revisaremos que el número sea sostenible.", "Lo vemos en la evaluación."], outcome: "Ganas puntos para el programa, pero firmas cinco años a un precio que tu planta hoy no puede producir con margen.", effects: { clientes: 4, margen: -6, consejo: -2 }, style: { riesgo: 2, horizonte: -1 }, score: 1 },
      { id: "c", stance: { greg: -2, marcos: 1, daniela: -1 }, text: "Cotizar a nuestro precio actual con el índice de acero y explicar que bajar 6% no es posible con los costos de este año.", reply: ["Entendido.", "Le comento que los otros tres cotizaron abajo del objetivo."], outcome: "Defiendes el margen, pero quedas fuera de rango. Aurora te ve como el proveedor caro de la plataforma.", effects: { margen: 2, clientes: -5, consejo: -1 }, style: { conflicto: 2, riesgo: -1 }, score: 0 },
    ],
    expired: { reply: ["(Daniela) Se cerró la recepción de cotizaciones sin la nuestra."], outcome: "No cotizar es quedar fuera de la plataforma.", effects: { clientes: -6, consejo: -3 } },
    lesson: "negociacion",
    bitacora: { title: "Cotizar lo que puedes sostener", text: "En una licitación, el precio que gana y el que puedes producir no siempre coinciden. Cotizar con el ahorro que ya tienes y proponer cómo cerrar la brecha compite sin hipotecar los años del contrato.", nota: "Un contrato ganado con pérdida es una deuda con fecha." },
    areas: ["clientes", "negociacion", "finanzas"],
  },
];

// ───────────────────────────────────────────────── Kúbit · Grupo Altamar
export const SEGUIMIENTOS_KUBIT: Item[] = [
  {
    id: "kb-s-altamar-mas", day: 3, slot: 3, channel: "email", from: "hernan", stages: S,
    recall: { item: "kb-d2-altamar", options: ["a"] },
    involves: ["andrea", "emilio"],
    subject: "Grupo Altamar · Desarrollos para las empresas del grupo",
    preview: "Gracias por los desarrollos. Las otras empresas del grupo piden lo mismo, también sin costo…",
    body: [
      "Estimado Director:",
      "Gracias por aceptar las condiciones del mes pasado. Varias empresas del grupo vieron los desarrollos y piden lo mismo para cada una, también sin costo.",
      "Necesitamos su respuesta antes de decidir la plataforma del grupo.",
      "Hernán Villaseñor\nDirector de Finanzas · Grupo Altamar",
    ],
    data: { title: "Andrea (Finanzas) te armó esto", rows: [["Empresas que piden desarrollos", "5"], ["Ingenieros necesarios", "9 durante 6 meses"], ["Atraso del producto si los hacemos", "Un trimestre"], ["Plataforma del grupo asignada", "Todavía no"]], note: "Nota de Andrea: «Ya estamos trabajando gratis para Altamar. Esto nos come el producto de todos los demás.»" },
    ask: "¿Qué le respondes a Hernán?",
    options: [
      { id: "a", stance: { hernan: -1, andrea: 1, emilio: 1 }, text: "Ofrecer meter al producto lo que sirva a todos, con fecha, y cotizar aparte lo que sea solo de una empresa del grupo.", reply: ["No es lo que pedimos, pero lo puedo explicar.", "Mándeme la fecha por escrito."], outcome: "Cortas el ciclo de regalar trabajo. Hernán no queda contento, pero tiene algo que puede defender ante el grupo.", effects: { margen: 3, clientes: -2, equipo: 2 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { hernan: 2, andrea: -2, emilio: -1 }, text: "Aceptar los desarrollos para las cinco empresas: si ganamos la plataforma del grupo, el volumen paga de sobra este esfuerzo.", reply: ["Excelente, Director. Lo comento con el comité.", "Le paso los requerimientos de cada empresa."], outcome: "Altamar queda encantado. Tu equipo pasa medio año haciendo desarrollos a la medida y el producto se atrasa para todos.", effects: { clientes: 4, equipo: -5, margen: -4 }, style: { riesgo: 1, conflicto: -2 }, score: 0 },
      { id: "c", stance: { hernan: -2, emilio: 1, andrea: 1 }, text: "Decirle que ya dimos suficiente y que, si quieren más desarrollos, el contrato completo regresa a precio de lista.", reply: ["Tomo nota, Director.", "Le comento que otro proveedor nos ofreció integrarse sin costo."], outcome: "Defiendes al equipo, pero el tono pone en riesgo la cuenta más grande justo antes de que decida.", effects: { margen: 2, clientes: -6, equipo: 3 }, style: { conflicto: 2 }, score: 1 },
    ],
    expired: { reply: ["(Bruno) Hernán nos dijo que sin respuesta lo toma como un no."], outcome: "El silencio también negoció.", effects: { clientes: -4, consejo: -1 } },
    lesson: "negociacion",
    bitacora: { title: "Lo que concedes enseña a pedir", text: "Ceder todo para ganar algo que no está prometido enseña a la otra parte que presionar funciona. Separar lo que sirve a todos de lo que es a la medida pone un precio claro a cada cosa.", nota: "Lo que se regala una vez se vuelve la base de la siguiente petición." },
    areas: ["clientes", "negociacion", "finanzas"],
  },
  {
    id: "kb-s-altamar-grupo", day: 3, slot: 3, channel: "email", from: "hernan", stages: S,
    recall: { item: "kb-d2-altamar", options: ["b", "c"] },
    involves: ["andrea", "bruno", "emilio"],
    subject: "Grupo Altamar · Plataforma para todo el grupo",
    preview: "Vamos a decidir la plataforma de las 14 empresas. Pedimos un precio por usuario 20% abajo de lista…",
    body: [
      "Estimado Director:",
      "Vamos a decidir la plataforma para las 14 empresas del grupo. Para ustedes pedimos un precio por usuario 20% abajo de lista y arranque en tres meses.",
      "Valoramos la propuesta del mes pasado. Decidimos en dos semanas.",
      "Hernán Villaseñor\nDirector de Finanzas · Grupo Altamar",
    ],
    data: { title: "Bruno (Comercial) te armó esto", rows: [["Ingreso adicional del grupo", "$140 M al año"], ["Precio pedido", "−20% vs. lista"], ["Capacidad de implementación", "4 empresas por trimestre"], ["Competidores invitados", "2"]], note: "Nota de Bruno: «Catorce empresas en tres meses no las implementamos bien ni con el doble de gente.»" },
    ask: "¿Qué le propones a Altamar?",
    options: [
      { id: "a", stance: { hernan: 1, bruno: 1, andrea: -1 }, text: "Ofrecer 10% abajo por volumen y arrancar en cuatro empresas por trimestre, con metas de adopción revisadas en cada etapa.", reply: ["Es una propuesta seria. La comparo con las otras.", "El calendario por etapas me da tranquilidad."], outcome: "Compites con lo que puedes cumplir. No es la oferta más barata, pero es la que Altamar puede creer.", effects: { clientes: 3, margen: -1, equipo: -1, consejo: 2 }, style: { horizonte: 2, estilo: 1 }, score: 3 },
      { id: "b", stance: { hernan: 2, andrea: -2, emilio: -1 }, text: "Aceptar el 20% y las 14 empresas en tres meses, contratando a la carrera para no dejar ir la cuenta más grande del año.", reply: ["Perfecto, Director, aunque vamos a vigilar de cerca las fechas.", "Le mando el calendario."], outcome: "Ganas el grupo y te comprometes a algo que tu equipo no puede entregar bien. Las primeras implementaciones salen mal.", effects: { clientes: 4, equipo: -5, margen: -3 }, style: { riesgo: 2, horizonte: -1 }, score: 1 },
      { id: "c", stance: { hernan: -2, bruno: -1, andrea: 1 }, text: "Mantener precio de lista y calendario propio: si nos eligen, es por el producto, no por un descuento que luego no se recupera.", reply: ["Entendido.", "Le comento que la otra propuesta está 25% abajo."], outcome: "Defiendes el precio, pero quedas lejos de las otras ofertas y el grupo te ve como la opción cara.", effects: { margen: 2, clientes: -5, consejo: -1 }, style: { conflicto: 2, riesgo: -1 }, score: 0 },
    ],
    expired: { reply: ["(Bruno) Altamar decidió sin nuestra propuesta."], outcome: "No responder es quedar fuera.", effects: { clientes: -6, consejo: -2 } },
    lesson: "negociacion",
    bitacora: { title: "Prometer lo que puedes entregar", text: "Un contrato grande con un calendario imposible se convierte en una cadena de implementaciones fallidas. Ofrecer por etapas, con metas visibles, compite con credibilidad.", nota: "El cliente recuerda la fecha que no cumpliste más que el descuento que diste." },
    areas: ["clientes", "negociacion", "operacion"],
  },
];

// ───────────────────────────────────────────────── Punto Madero · Constructora Peñasco
export const SEGUIMIENTOS_PUNTOMADERO: Item[] = [
  {
    id: "pm-s-penasco-mas", day: 3, slot: 3, channel: "email", from: "ramos", stages: S,
    recall: { item: "pm-d2-penasco", options: ["a"] },
    involves: ["claudia", "diego"],
    subject: "Constructora Peñasco · Crédito para los desarrollos nuevos",
    preview: "Gracias por las condiciones. Para los nueve desarrollos necesitamos crédito a 120 días…",
    body: [
      "Estimado Director:",
      "Gracias por las condiciones del mes pasado. Para arrancar los nueve desarrollos necesitamos ampliar el crédito a 120 días y entrega en obra los fines de semana.",
      "Con eso los consideramos como proveedor principal.",
      "Federico Ramos\nDirector de Compras · Constructora Peñasco",
    ],
    data: { title: "Claudia (Finanzas) te armó esto", rows: [["Caja atrapada a 90 días", "$70 M"], ["Si pasamos a 120 días", "$100 M"], ["Línea de crédito disponible", "$40 M"], ["Desarrollos asignados", "Ninguno todavía"]], note: "Nota de Claudia: «Ya financiamos a Peñasco con nuestra caja. Si damos 120 días, el banco nos va a llamar.»" },
    ask: "¿Qué le respondes a Federico?",
    options: [
      { id: "a", stance: { ramos: -1, claudia: 1, diego: 1 }, text: "Ofrecer 120 días solo en los desarrollos que nos asigne por escrito, con pagos parciales por avance de obra.", reply: ["No es lo que pedí, pero lo puedo revisar.", "Mándeme el esquema de pagos."], outcome: "Atas el crédito a algo concreto. Federico no queda contento, pero la caja deja de financiar promesas.", effects: { caja: 3, clientes: -2, consejo: 2 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { ramos: 2, claudia: -2 }, text: "Aceptar los 120 días y la entrega en fin de semana: si nos quedamos con los nueve desarrollos, la venta compensa el esfuerzo.", reply: ["Excelente, Director. Así sí podemos trabajar.", "Le paso el calendario de obra."], outcome: "Federico queda encantado. Tu caja financia a tu cliente y el banco empieza a preguntar.", effects: { clientes: 4, caja: -7, consejo: -3 }, style: { riesgo: 1, conflicto: -2 }, score: 0 },
      { id: "c", stance: { ramos: -2, diego: -1, claudia: 1 }, text: "Decirle que ya dimos suficiente y que, si insiste, regresamos el crédito a 30 días para todas sus compras.", reply: ["Tomo nota, Director.", "Le comento que Mundo Casa nos ofrece 90 días."], outcome: "Proteges la caja, pero el tono pone en riesgo al cliente más grande justo cuando decide.", effects: { caja: 2, clientes: -6, consejo: -1, margen: 1 }, style: { conflicto: 2 }, score: 1 },
    ],
    expired: { reply: ["(Diego) Federico pidió propuesta a Mundo Casa."], outcome: "El silencio también negoció.", effects: { clientes: -4, consejo: -1 } },
    lesson: "negociacion",
    bitacora: { title: "Lo que concedes enseña a pedir", text: "Ceder todo para ganar algo que no está prometido enseña a la otra parte que presionar funciona. Atar cada concesión a un compromiso concreto corta el ciclo.", nota: "El crédito que no está ligado a un pedido financia la siguiente petición." },
    areas: ["clientes", "negociacion", "finanzas"],
  },
  {
    id: "pm-s-penasco-obras", day: 3, slot: 3, channel: "email", from: "ramos", stages: S,
    recall: { item: "pm-d2-penasco", options: ["b", "c"] },
    involves: ["claudia", "diego", "octavio"],
    subject: "Constructora Peñasco · Proveedor de los nueve desarrollos",
    preview: "Vamos a asignar el proveedor de los nueve desarrollos. Pedimos exclusividad de precio por dos años…",
    body: [
      "Estimado Director:",
      "Vamos a asignar el proveedor de los nueve desarrollos. Pedimos precio fijo por dos años y entrega programada en cada obra.",
      "Valoramos la propuesta del mes pasado. Decidimos en dos semanas.",
      "Federico Ramos\nDirector de Compras · Constructora Peñasco",
    ],
    data: { title: "Diego (Comercial) te armó esto", rows: [["Venta de los nueve desarrollos", "$520 M en dos años"], ["Precio fijo pedido", "2 años"], ["Inflación de materiales este año", "+7%"], ["Competidores invitados", "2"]], note: "Nota de Diego: «Con precio fijo dos años, si el acero y el cemento suben, perdemos dinero en cada entrega.»" },
    ask: "¿Qué le propones a Peñasco?",
    options: [
      { id: "a", stance: { ramos: 1, diego: 1, claudia: -1 }, text: "Ofrecer precio fijo seis meses, luego ajuste por un índice público de materiales, y entregas en tres obras.", reply: ["Es una propuesta seria. La comparo con las otras.", "El índice público me da algo que defender."], outcome: "Compites con algo que puedes sostener. Peñasco tiene certeza y tú no cargas solo con la inflación.", effects: { clientes: 3, margen: -1, caja: -1, consejo: 2 }, style: { horizonte: 2, estilo: 1 }, score: 3 },
      { id: "b", stance: { ramos: 2, claudia: -2 }, text: "Aceptar precio fijo dos años en los nueve desarrollos para quedarnos con todo y cubrir la inflación con volumen.", reply: ["Perfecto, Director, aunque le pediré que lo firme su finanzas.", "Le paso el calendario."], outcome: "Ganas los nueve desarrollos y firmas dos años de margen que se encoge con cada aumento de materiales.", effects: { clientes: 4, margen: -6, consejo: -2 }, style: { riesgo: 2, horizonte: -1 }, score: 1 },
      { id: "c", stance: { ramos: -2, diego: -1, claudia: 1 }, text: "Mantener precio de lista con ajuste mensual: con esta inflación, fijar precio es regalarle a Peñasco nuestra utilidad.", reply: ["Entendido.", "Le comento que los otros ofrecieron precio fijo un año."], outcome: "Defiendes el margen, pero quedas lejos de las otras ofertas y Peñasco te ve como el proveedor caro.", effects: { margen: 2, clientes: -5, consejo: -1 }, style: { conflicto: 2, riesgo: -1 }, score: 0 },
    ],
    expired: { reply: ["(Diego) Peñasco asignó sin nuestra propuesta."], outcome: "No responder es quedar fuera.", effects: { clientes: -6, consejo: -2 } },
    lesson: "negociacion",
    bitacora: { title: "Repartir el riesgo con reglas", text: "Un precio fijo largo pone todo el riesgo de la inflación de un solo lado. Un índice público y verificable reparte ese riesgo con reglas que ambos pueden revisar.", nota: "Cuando el costo es incierto, negocia la fórmula, no el número." },
    areas: ["clientes", "negociacion", "finanzas"],
  },
];

// ───────────────────────────────────────────────── Vértice · Supermercados Almena
export const SEGUIMIENTOS_VERTICE: Item[] = [
  {
    id: "vl-s-almena-mas", day: 3, slot: 3, channel: "email", from: "hinojosa", stages: S,
    recall: { item: "vl-d2-almena", options: ["a"] },
    involves: ["patricio", "mauricio"],
    subject: "Supermercados Almena · Los CEDIS nuevos",
    preview: "Gracias por las condiciones. Asignamos un CEDIS a su empresa; para los otros dos pedimos 5% más…",
    body: [
      "Estimado Director:",
      "Gracias por las condiciones del mes pasado. Asignamos uno de los tres CEDIS nuevos a su empresa.",
      "Para los otros dos necesitamos 5% adicional de descuento y que absorban el costo de las unidades nuevas.",
      "Ricardo Hinojosa\nDirector de Logística · Supermercados Almena",
    ],
    data: { title: "Patricio (Finanzas) te armó esto", rows: [["Margen de la cuenta después del 10%", "2.8%"], ["Con 5% adicional", "Negativo"], ["Unidades nuevas que piden", "15 · $60 M"], ["CEDIS asignados a Avante", "Ninguno todavía"]], note: "Nota de Patricio: «Lo que dimos el mes pasado compró un CEDIS. Los otros dos los quieren gratis.»" },
    ask: "¿Qué le respondes a Ricardo?",
    options: [
      { id: "a", stance: { hinojosa: -1, patricio: 1, mauricio: 1 }, text: "Ofrecer los dos CEDIS con un bono por cumplir arriba de 97% en vez de descuento, y unidades en arrendamiento.", reply: ["No es lo que pedí, pero lo puedo revisar.", "Mándeme el esquema del bono."], outcome: "Cambias descuento por desempeño. Ricardo no queda contento, pero tiene algo que puede defender.", effects: { margen: 3, clientes: -2, consejo: 2 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { hinojosa: 2, patricio: -2 }, text: "Aceptar el 5% adicional y comprar las 15 unidades: con los tres CEDIS somos su operador principal por años.", reply: ["Excelente, Director. Así sí podemos crecer juntos.", "Le paso el calendario de arranque."], outcome: "Ricardo queda encantado. Operas tres CEDIS con margen negativo y con unidades que pagas tú.", effects: { clientes: 4, margen: -7, caja: -2, consejo: -3 }, style: { riesgo: 1, conflicto: -2 }, score: 0 },
      { id: "c", stance: { hinojosa: -2, mauricio: -1, patricio: 1 }, text: "Decirle que ya dimos suficiente y que, si insiste, renunciamos al CEDIS asignado y regresamos a la tarifa anterior.", reply: ["Tomo nota, Director.", "Le comento que Avante está listo para operar los tres."], outcome: "Proteges el margen, pero la amenaza pone en riesgo la cuenta más grande cuando apenas se asentaba.", effects: { margen: 2, clientes: -6, consejo: -1, caja: 1 }, style: { conflicto: 2 }, score: 1 },
    ],
    expired: { reply: ["(Mauricio) Ricardo pidió propuesta a Avante para los dos CEDIS."], outcome: "El silencio también negoció.", effects: { clientes: -4, consejo: -1 } },
    lesson: "negociacion",
    bitacora: { title: "Lo que concedes enseña a pedir", text: "Ceder todo para ganar algo que no está prometido enseña a la otra parte que presionar funciona. Cambiar descuento por desempeño pone el precio donde está el valor.", nota: "Un descuento sin contrapartida compra la siguiente petición." },
    areas: ["clientes", "negociacion", "finanzas"],
  },
  {
    id: "vl-s-almena-cedis", day: 3, slot: 3, channel: "email", from: "hinojosa", stages: S,
    recall: { item: "vl-d2-almena", options: ["b", "c"] },
    involves: ["patricio", "mauricio", "antonio"],
    subject: "Supermercados Almena · Operador de los CEDIS nuevos",
    preview: "Vamos a asignar los tres CEDIS nuevos. El operador elegido debe arrancar con 15 unidades propias…",
    body: [
      "Estimado Director:",
      "Vamos a asignar los tres CEDIS nuevos. El operador elegido debe arrancar en dos meses con 15 unidades propias.",
      "Valoramos la propuesta del mes pasado. Decidimos en dos semanas.",
      "Ricardo Hinojosa\nDirector de Logística · Supermercados Almena",
    ],
    data: { title: "Antonio (Flota) te armó esto", rows: [["Venta de los tres CEDIS", "$210 M al año"], ["Costo de 15 unidades", "$60 M"], ["Operadores disponibles para contratar", "≈ 25"], ["Competidores invitados", "2"]], note: "Nota de Antonio: «Tres CEDIS en dos meses con gente nueva es la receta para fallar entregas.»" },
    ask: "¿Qué le propones a Almena?",
    options: [
      { id: "a", stance: { hinojosa: 1, mauricio: 1, patricio: -1 }, text: "Ofrecer un CEDIS en dos meses y los otros dos a los cinco, con unidades por fases y metas revisadas en cada etapa.", reply: ["Es una propuesta seria. La comparo con las otras.", "El calendario por etapas me da tranquilidad."], outcome: "Compites con lo que puedes cumplir. No es la oferta más rápida, pero es la que Almena puede creer.", effects: { clientes: 3, caja: -2, equipo: -1, consejo: 2 }, style: { horizonte: 2, estilo: 1 }, score: 3 },
      { id: "b", stance: { hinojosa: 2, patricio: -2, antonio: -1 }, text: "Aceptar los tres CEDIS en dos meses y comprar las 15 unidades de una vez para no dejar ir la cuenta más grande del año.", reply: ["Perfecto, Director, aunque vamos a vigilar de cerca el arranque.", "Le mando el calendario."], outcome: "Ganas los tres CEDIS y te comprometes a algo que tu operación no puede entregar bien. El arranque sale con fallas.", effects: { clientes: 4, caja: -6, equipo: -3 }, style: { riesgo: 2, horizonte: -1 }, score: 1 },
      { id: "c", stance: { hinojosa: -2, mauricio: -1, patricio: 1 }, text: "Ofrecer solo un CEDIS con nuestras unidades actuales: crecer tres veces en dos meses pone en riesgo a todos los clientes.", reply: ["Entendido.", "Le comento que Avante ofreció los tres."], outcome: "Cuidas la operación, pero Almena entrega dos CEDIS a tu competidor y ahora lo tiene adentro.", effects: { caja: 2, clientes: -5, consejo: -1 }, style: { riesgo: -2 }, score: 0 },
    ],
    expired: { reply: ["(Mauricio) Almena asignó sin nuestra propuesta."], outcome: "No responder es quedar fuera.", effects: { clientes: -6, consejo: -2 } },
    lesson: "negociacion",
    bitacora: { title: "Prometer lo que puedes entregar", text: "Un contrato grande con un arranque imposible se convierte en entregas fallidas que el cliente recuerda. Ofrecer por etapas, con metas visibles, compite con credibilidad.", nota: "El cliente recuerda la fecha que no cumpliste más que el descuento que diste." },
    areas: ["clientes", "negociacion", "operacion"],
  },
];

// ───────────────────────────────────────────────── Brasa · Rappido
export const SEGUIMIENTOS_BRASA: Item[] = [
  {
    id: "gb-s-app-renueva", day: 3, slot: 4, channel: "email", from: "nico", stages: S,
    recall: { item: "gb-d1-app", options: ["a"] },
    involves: ["fer", "sara"],
    subject: "Rappido · Revisión del programa Socio Preferente",
    preview: "Los pedidos crecieron. Para seguir en los primeros lugares la comisión pasa a 32%…",
    body: [
      "Hola, Director:",
      "Buenas noticias: sus pedidos en la app crecieron 28%. Para mantener los primeros lugares en la siguiente revisión, la comisión pasa de 30% a 32%.",
      "La exclusividad sigue igual.",
      "Nico Salcido\nKey Account Manager · Rappido",
    ],
    data: { title: "Fer (Finanzas) te armó esto", rows: [["Pedidos por app", "+28%"], ["Margen por pedido con 30%", "≈ 1%"], ["Con 32%", "Negativo"], ["Pedidos por la página propia", "Casi cero desde la exclusividad"]], note: "Nota de Fer: «Crecimos en pedidos y perdimos dinero en cada uno. Y ya no tenemos canal propio.»" },
    ask: "¿Qué le respondes a Nico?",
    options: [
      { id: "a", stance: { nico: -1, fer: 1, sara: 1 }, text: "Quedarnos en 30% sin subir y preparar ya el canal propio para no depender de la app cuando venza.", reply: ["Lo subo con mi gerente, aunque no le prometo nada.", "Le aviso en una semana."], outcome: "No aceptas perder dinero por pedido y empiezas a construir la salida. Nico no queda contento.", effects: { margen: 3, clientes: -2, caja: -1 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { nico: 2, fer: -2 }, text: "Aceptar el 32% para no perder los primeros lugares: la app ya es la mitad de los pedidos y salir sería peor.", reply: ["¡Excelente! Siguen en el banner principal.", "Le mando el anexo hoy."], outcome: "Mantienes el lugar en la app y pierdes dinero en cada pedido. Dependes más de Rappido que antes.", effects: { clientes: 3, margen: -7, consejo: -2 }, style: { riesgo: 1, conflicto: -2 }, score: 0 },
      { id: "c", stance: { nico: -2, sara: -1, fer: 1 }, text: "Decirle que si sube la comisión rompemos la exclusividad ahora, aunque el contrato nos cobre una penalización.", reply: ["Entiendo, Director.", "Le recuerdo que la penalización es de tres meses de comisión."], outcome: "Cortas el problema de raíz, pero pagas la penalización y sin canal propio listo los pedidos caen.", effects: { margen: 1, caja: -4, clientes: -3, consejo: 1 }, style: { conflicto: 2, riesgo: 1 }, score: 1 },
    ],
    expired: { reply: ["(Sara) Rappido aplicó el 32% al no recibir respuesta."], outcome: "No contestar es aceptar.", effects: { margen: -5, consejo: -1 } },
    lesson: "negociacion",
    bitacora: { title: "La plataforma que te da los clientes también fija el precio", text: "Una exclusividad con una plataforma trae pedidos y te quita la alternativa. Sin canal propio, cada revisión de comisión la decide la otra parte.", nota: "Tu poder en la siguiente negociación se construye antes de que llegue." },
    areas: ["clientes", "negociacion", "finanzas"],
  },
  {
    id: "gb-s-app-oferta", day: 3, slot: 4, channel: "email", from: "nico", stages: S,
    recall: { item: "gb-d1-app", options: ["b", "c"] },
    involves: ["fer", "sara"],
    subject: "Rappido · Nueva propuesta para Brasa",
    preview: "Vimos que crecieron en pedidos directos. Les ofrecemos comisión de 28% sin exclusividad y promociones compartidas…",
    body: [
      "Hola, Director:",
      "Vimos que sus pedidos directos crecieron. Les ofrecemos comisión de 28% sin exclusividad, a cambio de dos promociones al mes pagadas mitad y mitad.",
      "Nico Salcido\nKey Account Manager · Rappido",
    ],
    data: { title: "Fer (Finanzas) te armó esto", rows: [["Pedidos directos", "+40% en dos meses"], ["Margen de un pedido directo", "≈ 17%"], ["Margen por app con 28%", "≈ 3%"], ["Costo de dos promociones al mes", "$0.8 M"]], note: "Nota de Fer: «La app vuelve a buscarnos porque ya tenemos alternativa.»" },
    ask: "¿Qué le respondes a Nico?",
    options: [
      { id: "a", stance: { nico: 1, fer: 1, sara: -1 }, text: "Aceptar el 28% sin exclusividad con una promoción al mes, y medir cuántos pedidos se vuelven directos.", reply: ["Me parece justo. Lo preparo.", "Una promoción al mes la puedo defender."], outcome: "Usas la app para atraer clientes nuevos sin depender de ella. Sara tiene que cuidar que el canal propio no se canibalice.", effects: { clientes: 3, margen: 1, equipo: -1 }, style: { horizonte: 2, estilo: 1 }, score: 3 },
      { id: "b", stance: { nico: 2, fer: -1, sara: -1 }, text: "Aceptar todo como viene, con las dos promociones al mes: más pedidos por la app son más ventas para las sucursales.", reply: ["¡Excelente! Arrancamos el lunes.", "Le mando el calendario de promociones."], outcome: "Los pedidos suben, pero las promociones se comen el margen y parte de tus clientes directos regresan a la app.", effects: { clientes: 4, margen: -4, caja: -1 }, style: { riesgo: 1, conflicto: -2 }, score: 1 },
      { id: "c", stance: { nico: -2, sara: 1, fer: 1 }, text: "Rechazar la propuesta y salir de Rappido: con el canal propio creciendo, la app solo nos quita margen en cada pedido.", reply: ["Entendido.", "Le comento que su competencia directa sí aceptó."], outcome: "Cuidas el margen, pero pierdes a los clientes que solo piden por la app y que nunca llegarían a tu página.", effects: { margen: 2, clientes: -5, caja: 1 }, style: { conflicto: 2, riesgo: 1 }, score: 0 },
    ],
    expired: { reply: ["(Sara) Nico le dio la promoción a la competencia."], outcome: "No contestar también es una respuesta.", effects: { clientes: -3 } },
    lesson: "negociacion",
    bitacora: { title: "Negociar con alternativa", text: "Cuando tienes un canal propio que funciona, la plataforma deja de dictar las condiciones. Usarla para atraer y no para depender es la diferencia entre un socio y un dueño.", nota: "La mejor carta en una negociación es la alternativa que ya funciona." },
    areas: ["clientes", "negociacion", "estrategia"],
  },
];

// ───────────────────────────────────────────────── Cumbre · Sindicato
export const SEGUIMIENTOS_CUMBRE: Item[] = [
  {
    id: "c-s-merma", day: 3, slot: 4, channel: "junta", from: "roberto", stages: S,
    recall: { item: "d4-sindicato", options: ["a"] },
    involves: ["lucia", "mariana", "javier"],
    subject: "Junta · El bono por merma del trimestre",
    preview: "La merma bajó de 4.8% a 3.4%, no a 3%. Roberto pide el bono completo…",
    body: ["Sala de juntas de la planta. Roberto Cantú viene con dos delegados a revisar el bono que acordaron."],
    lines: [
      { who: "roberto", text: "Director, cumplimos: la merma bajó de 4.8% a 3.4%. La gente quiere su bono completo." },
      { who: "lucia", text: "(en voz baja) El acuerdo era bono completo con 3%. Con 3.4% toca 70%." },
      { who: "javier", text: "(en voz baja) Bajó mucho. Lo que falta es una llenadora vieja que no depende de ellos." },
    ],
    data: { title: "Contexto", rows: [["Merma al empezar", "4.8%"], ["Merma hoy", "3.4%"], ["Meta del bono completo", "3%"], ["Ahorro por la merma que bajó", "$4.5 M al trimestre"]] },
    ask: "Roberto espera tu respuesta.",
    options: [
      { id: "a", stance: { roberto: 1, javier: 1, lucia: -1 }, text: "«Pagamos el 70% acordado y cambiamos la llenadora; si con eso llegan al 3%, el bono completo regresa.»", reply: ["Esperábamos más, pero se ve que va en serio.", "Lo llevo a la asamblea."], outcome: "Cumples lo pactado y quitas la causa que no era de ellos. La gente ve que el acuerdo tiene reglas.", effects: { equipo: 3, caja: -2, margen: 2 }, style: { horizonte: 2, estilo: 1 }, score: 3 },
      { id: "b", stance: { roberto: 2, lucia: -2 }, text: "«Pagamos el bono completo: la merma bajó muchísimo y no quiero que la gente sienta que le regateamos lo que se ganó.»", reply: ["Así se habla, Director.", "(Lucía te escribe:) Ahora cada meta se va a negociar."], outcome: "La gente queda contenta y aprende que la meta se puede mover. Lucía teme que el siguiente bono ya no tenga piso.", effects: { equipo: 5, caja: -4, consejo: -2 }, style: { conflicto: -2 }, score: 1 },
      { id: "c", stance: { roberto: -2, javier: -1, lucia: 1 }, text: "«El acuerdo decía 3%. No llegaron, así que este trimestre no hay bono y lo volvemos a medir el siguiente.»", reply: ["Pues así lo vamos a llevar a la asamblea, Director.", "La gente no va a volver a creer en un bono."], outcome: "Aplicas la letra del acuerdo y matas el incentivo: la gente bajó la merma y no ve nada a cambio.", effects: { caja: 2, equipo: -6, margen: -1 }, style: { conflicto: 2 }, score: 0 },
    ],
    expired: { reply: ["(Roberto) Director, sin respuesta la base lo toma como que no hay bono."], outcome: "El silencio rompió la confianza en el acuerdo.", effects: { equipo: -5, consejo: -1 } },
    lesson: "negociacion",
    bitacora: { title: "Un acuerdo vale lo que se cumple", text: "Un bono ligado a una meta funciona mientras las dos partes cumplen lo pactado. Pagar de más enseña que la meta se negocia; no pagar nada enseña que el esfuerzo no cuenta.", nota: "La segunda negociación empieza con lo que hiciste en la primera." },
    areas: ["personas", "negociacion", "cultura"],
  },
  {
    id: "c-s-revision", day: 3, slot: 4, channel: "junta", from: "roberto", stages: S,
    recall: { item: "d4-sindicato", options: ["b", "c"] },
    involves: ["lucia", "mariana", "javier"],
    subject: "Junta · Revisión de medio año con el sindicato",
    preview: "Roberto vuelve a la mesa. La rotación sigue alta y la base pide revisar prestaciones…",
    body: ["Sala de juntas de la planta. Roberto Cantú pidió revisar prestaciones a medio año."],
    lines: [
      { who: "roberto", text: "Director, la base pide vales de despensa y transporte. Se acuerda de cómo terminó la última revisión." },
      { who: "lucia", text: "(en voz baja) Lo que piden cuesta $5 M al año. No está en el presupuesto." },
      { who: "mariana", text: "(en voz baja) La rotación sigue en 30%. El transporte es la queja número uno." },
    ],
    data: { title: "Contexto", rows: [["Costo de lo que piden", "$5 M al año"], ["Rotación en planta", "30%"], ["Costo de reemplazar a un operador", "≈ $40 mil"], ["Merma de producto", "4.5%"]] },
    ask: "Roberto espera tu respuesta.",
    options: [
      { id: "a", stance: { roberto: 1, mariana: 1, lucia: -1 }, text: "«Transporte en los turnos de noche desde ya, y vales ligados a bajar rotación y merma, con un tablero.»", reply: ["Eso no nos lo habían ofrecido así.", "La gente va a querer ver el tablero."], outcome: "Atiendes la queja principal y ligas el resto a lo que le importa a la empresa. La relación empieza a cambiar.", effects: { equipo: 4, caja: -2, margen: 1 }, style: { horizonte: 2, estilo: 1 }, score: 3 },
      { id: "b", stance: { roberto: 2, lucia: -2 }, text: "«Les damos vales y transporte completos: la gente lo necesita y no quiero otra revisión que termine en conflicto.»", reply: ["Así se habla, Director.", "(Lucía te escribe:) Eso no está en el presupuesto."], outcome: "La base queda contenta. El costo no está en el presupuesto y nada cambia en la merma.", effects: { equipo: 5, caja: -5, consejo: -2 }, style: { conflicto: -2 }, score: 1 },
      { id: "c", stance: { roberto: -2, mariana: -1, lucia: 1 }, text: "«Las prestaciones se revisan una vez al año en el contrato colectivo. Lo vemos en la siguiente revisión.»", reply: ["Pues así se lo digo a la base, Director.", "Luego no se extrañe si se le van más."], outcome: "Cuidas el presupuesto, pero la rotación sigue y la base confirma que solo se les escucha una vez al año.", effects: { caja: 2, equipo: -5, margen: -1 }, style: { conflicto: 2 }, score: 0 },
    ],
    expired: { reply: ["(Roberto) Director, nos levantamos de la mesa."], outcome: "Sin respuesta, la base se siente ignorada otra vez.", effects: { equipo: -5, consejo: -1 } },
    lesson: "negociacion",
    bitacora: { title: "La relación es un juego repetido", text: "Con un sindicato negocias cada año con las mismas personas. Cada revisión enseña cómo vas a reaccionar en la siguiente; ligar beneficios a resultados compartidos cambia el juego.", nota: "Lo que concedes y lo que niegas hoy es el punto de partida de la próxima mesa." },
    areas: ["personas", "negociacion", "cultura"],
  },
];
