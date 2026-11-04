/**
 * mêtis CEO · Cumbre · primer episodio de consecuencias diferidas reales: «La envasadora de la línea 1».
 *
 * Una sola decisión del día 2 (cuándo darle mantenimiento mayor a la envasadora) abre caminos distintos que llegan
 * semanas después. Cada camino trae un problema DISTINTO, no el mismo castigo con otra cara:
 *
 *  - Hacerlo ahora (a)            → día 4: recuperar los 4 días de producción sin quemar a la gente (personas).
 *  - Posponerlo (b) o no decidir  → día 4, incierto: o la máquina se rompe (4 de cada 10) o solo pierde rendimiento.
 *        si se rompe y se parcha  → día 5, incierto: SuperNorte reclama (7 de cada 10: la soldadura no aguanta).
 *        tras el reclamo          → día 6: inversión correctiva, mucho más cara que el mantenimiento que se ahorró.
 *  - Arreglo parcial (c)          → día 5, incierto: lo que no se revisó (el dosificador) falla (35 de cada 100).
 *
 * Las probabilidades se dicen en el caso desde el día 2 («entre 3 y 4 de cada 10 equipos así fallan»): la
 * incertidumbre es parte de la decisión, no una trampa. El azar es estable por periodo (ver `rollOf` en engine.ts).
 * Solo llega en periodos con reglas v6 o posteriores (`since: 6`): lo que ya se jugó no cambia.
 */
import type { Item } from "../types";

const V = 6;

export const MANTENIMIENTO: Item[] = [
  // ─────────────────────────────────────────────── DÍA 2 · la decisión
  {
    id: "d2-mantenimiento", day: 2, slot: 3, channel: "reporte", from: "javier", since: V,
    involves: ["lucia", "sofia"],
    real: { company: "Envasadora del Bajío (ficticia)", title: "El ahorro que salió caro", text: "Una envasadora pospuso el mantenimiento mayor de su línea principal para no parar en temporada alta. Seis semanas después la máquina se rompió, el cliente principal multó a la empresa por entregas incompletas y la reparación costó casi tres veces lo que se había ahorrado." },
    subject: "Mantenimiento mayor de la envasadora de la línea 1",
    preview: "Ya le toca su mantenimiento mayor y entramos a temporada alta. Necesito que usted decida cuándo…",
    body: [
      "Jefe, le mando el reporte que me pidió. La envasadora de la línea 1 ya cumplió sus horas: el fabricante pide mantenimiento mayor cada 6,000 horas y vamos en 6,400.",
      "Hacerlo bien es parar la línea 4 días. Pero entramos a temporada alta y el pedido de SuperNorte crece 20 % las próximas 8 semanas. Lucía dice que la caja está justa.",
      "No le voy a decir que va a fallar, porque no lo sé. Le digo lo que dice el técnico: si esperamos a enero, lo más probable es que baje el rendimiento, y hay una probabilidad real de que se rompa en plena temporada.",
    ],
    data: {
      title: "Lo que sabes",
      rows: [
        ["Mantenimiento mayor completo", "4 días de paro · $1.8 M"],
        ["Cambiar solo las mordazas de sellado", "1 fin de semana · $600 mil"],
        ["Si se pospone a enero (estimación del técnico)", "El rendimiento baja de 82 % a cerca de 72 %; entre 3 y 4 de cada 10 equipos así fallan antes"],
        ["Un paro no programado típico", "2 a 4 días y refacción importada"],
      ],
      note: "Son estimaciones del técnico, no certezas. Cifras ficticias de este caso, no estadísticas reales.",
    },
    ask: "¿Qué hacemos con la envasadora?",
    options: [
      { id: "a", stance: { javier: 2, lucia: -1 }, text: "Hacer el mantenimiento mayor ahora: parar la línea 1 cuatro días y recuperar el volumen con sábados antes del pico de SuperNorte.", reply: ["Gracias, jefe. Así sí duermo tranquilo.", "Le armo el calendario de sábados con Mariana."], outcome: "Pagas hoy la parada y la caja lo resiente. La máquina queda lista para la temporada; recuperar los cuatro días va a exigir horas extra.", effects: { caja: -3, margen: -1, equipo: 2 }, style: { horizonte: 2, riesgo: -2 }, score: 3 },
      { id: "b", stance: { javier: -1, lucia: 1 }, text: "Posponerlo a enero, después de la temporada alta. Mientras, que mantenimiento revise la máquina cada turno y avise al primer síntoma.", reply: ["Como usted diga, jefe.", "Le pongo revisión cada turno, pero la máquina no se arregla viéndola."], outcome: "Cuidas la caja y el pedido de esta temporada. El desgaste sigue ahí y nadie sabe si va a aguantar.", effects: { caja: 2, clientes: 1, equipo: -1 }, style: { horizonte: -2, riesgo: 2 }, score: 1 },
      { id: "c", stance: { javier: 1, lucia: 1 }, text: "Cambiar solo las mordazas de sellado este fin de semana, que causan la mayoría de los paros, y dejar el mantenimiento mayor para enero.", reply: ["Es un punto medio razonable, jefe.", "Nomás le advierto: el dosificador no lo vamos a tocar."], outcome: "Atiendes la causa más común por la tercera parte del costo y sin parar entre semana. El resto del desgaste queda pendiente.", effects: { caja: -1, clientes: 1 }, style: { horizonte: 1, riesgo: 1 }, score: 2 },
    ],
    expired: { reply: ["Jefe, no tuve respuesta. Seguimos operando y lo vemos en enero."], outcome: "Sin decisión, la envasadora siguió sin mantenimiento: lo mismo que posponerlo, pero sin la revisión extra.", effects: { equipo: -2 } },
    lesson: "finanzas",
    bitacora: { title: "El mantenimiento que no se ve", text: "Posponer el mantenimiento mejora la caja de este trimestre y pasa la cuenta después. La pregunta no es si la máquina va a fallar, sino cuánto riesgo estás dispuesto a comprar y quién lo va a pagar.", nota: "Un ahorro que solo cambia de fecha un gasto más caro no es un ahorro: es una deuda que no aparece en el balance." },
    areas: ["operacion", "finanzas", "estrategia"],
  },

  // ─────────────────────────────────────────────── DÍA 4 · camino «hacerlo ahora»: el costo es la gente
  {
    id: "c-mant-sabados", day: 4, slot: 3, channel: "whatsapp", from: "javier", since: V,
    involves: ["roberto", "mariana", "lucia"],
    trigger: { item: "d2-mantenimiento", options: ["a"] },
    subject: "Javier Ortiz", preview: "Jefe, la envasadora quedó como nueva. El problema ahora es recuperar los 4 días…",
    body: [
      "Jefe, la envasadora quedó como nueva: 84 % de rendimiento, mejor que antes de pararla.",
      "El problema es que para recuperar los 4 días necesitamos 3 sábados seguidos. Roberto dice que la gente ya está cansada y que, si son obligatorios, lo lleva a la comisión mixta.",
      "Y SuperNorte no espera: si no llegamos, son entregas incompletas.",
    ],
    data: { title: "Lo que sabes", rows: [["Rendimiento de la línea 1 tras el mantenimiento", "84 % (antes 82 %)"], ["Volumen por recuperar", "4 días de producción"], ["Tres sábados con horas extra", "$450 mil"], ["Maquila en otra planta", "$900 mil · calidad sin probar"]] },
    ask: "¿Cómo recuperas el volumen?",
    options: [
      { id: "a", stance: { roberto: 2, javier: 1 }, text: "Sábados voluntarios con pago doble y comida, rotando para que nadie trabaje los tres. Se lo platico yo a Roberto antes de anunciarlo.", reply: ["Así sí, jefe. Roberto va a ver que esta vez se le preguntó.", "Armo hoy el rol de sábados."], outcome: "Pagas más por hora, pero la gente llega por su voluntad. La relación con el sindicato queda intacta; quizá algún pedido salga un día tarde.", effects: { equipo: 2, caja: -2, clientes: -1 }, style: { conflicto: 1, horizonte: 1 }, score: 3 },
      { id: "b", stance: { roberto: -2, javier: -1 }, text: "Tres sábados obligatorios para todo el turno: es temporada alta y el contrato lo permite. Se paga lo que marca la ley.", reply: ["Entendido.", "(Roberto, por WhatsApp) Director, los sábados obligatorios los vamos a llevar a la comisión mixta."], outcome: "Recuperas todo el volumen a tiempo. La planta lo vive como el costo de una decisión que tomó otro, y el sindicato lo anota.", effects: { clientes: 3, caja: -1, equipo: -3 }, style: { conflicto: 2, foco: 1 }, score: 1 },
      { id: "c", stance: { javier: -1, lucia: -1 }, text: "Maquilar en otra planta la mitad de lo que falta y cubrir el resto con un solo sábado voluntario, sin cansar al turno.", reply: ["Se puede, jefe, aunque me preocupa la calidad de esa planta.", "Le pido a Calidad que revise los primeros lotes."], outcome: "Pagas la maquila, que es más cara, y arriesgas calidad en una planta ajena a cambio de no cansar al turno.", effects: { caja: -3, clientes: 1, equipo: 1 }, style: { riesgo: 1, horizonte: 1 }, score: 2 },
    ],
    expired: { reply: ["Jefe, sin indicaciones solo trabajamos un sábado."], outcome: "Sin decisión, se recuperó la mitad del volumen y SuperNorte recibió entregas incompletas.", effects: { clientes: -3 } },
    lesson: "personas",
    bitacora: { title: "Lo correcto también tiene costo, y se gestiona", text: "Hacer el mantenimiento a tiempo evitó el riesgo grande, pero trajo un costo chico y seguro: recuperar la producción. Cómo pagas ese costo con la gente decide si la próxima vez te van a apoyar.", nota: "Una buena decisión no termina cuando la tomas: termina cuando pagaste bien su costo." },
    areas: ["operacion", "personas", "negociacion"],
  },

  // ─────────────────────────────────────────────── DÍA 4 · camino «posponer»: dos futuros posibles
  {
    id: "c-mant-falla", day: 4, slot: 3, channel: "llamada", from: "javier", since: V,
    involves: ["sofia", "lucia"],
    trigger: { item: "d2-mantenimiento", options: ["b", "__expired"], roll: [0, 0.4] },
    subject: "Llamada perdida · Javier Ortiz (Planta)", preview: "Jefe, se nos paró la envasadora de la línea 1. La refacción viene de Italia…",
    body: [
      "Mensaje de voz · 0:44",
      "«Jefe, se nos paró la envasadora de la línea 1. Se rompió el eje de las mordazas, justo lo que temía el técnico. La refacción viene de Italia.»",
      "«Tenemos tres caminos y ninguno es barato. Usted dígame.»",
    ],
    data: { title: "Lo que sabes", rows: [["Refacción por avión", "$1.1 M · llega en 3 días"], ["Refacción por barco", "$350 mil · llega en 3 semanas"], ["Mientras tanto", "Línea 1 detenida (40 % de la capacidad)"], ["Pedido de SuperNorte esta semana", "$6 M"]] },
    ask: "La envasadora falló. ¿Qué haces?",
    options: [
      { id: "a", stance: { javier: 2, sofia: 1, lucia: -1 }, text: "Traer la refacción por avión, hacer de una vez el mantenimiento mayor completo y llamar yo a SuperNorte para avisar del retraso.", reply: ["Gracias, jefe. Ahora sí la dejamos bien.", "(Sofía) Le agradezco que me avise usted. Ajusto lo que pueda."], outcome: "Pagas el flete urgente y el mantenimiento que habías pospuesto, todo junto y en temporada alta. La máquina queda bien y el cliente se enteró por ti.", effects: { caja: -4, clientes: -1, equipo: 2 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { javier: -1, lucia: 1 }, text: "Soldar el eje en el taller para arrancar mañana y pedir la refacción por barco. Que la línea 2 cubra lo más urgente de SuperNorte.", reply: ["Se puede soldar, jefe, pero no le garantizo cuánto aguante.", "Lo arrancamos mañana temprano."], outcome: "Arrancas mañana y gastas poco. Una soldadura en un eje de sellado puede aguantar semanas o días: nadie lo sabe.", effects: { caja: 1, clientes: -1, equipo: -2 }, style: { horizonte: -2, riesgo: 2 }, score: 1 },
      { id: "c", stance: { javier: 1, lucia: -1 }, text: "Pedir la refacción por avión sin el mantenimiento completo, y mover el pedido a la línea 2 con turnos extra para no fallarle a SuperNorte.", reply: ["Va, jefe. La línea 2 le aguanta unos días.", "El mantenimiento mayor sigue pendiente, eso sí."], outcome: "Cumples el pedido y arreglas lo roto, a costa de un flete caro y de cansar al turno de la línea 2. El resto del desgaste sigue ahí.", effects: { caja: -3, clientes: 1, equipo: -2 }, style: { foco: 1, riesgo: 1 }, score: 2 },
    ],
    expired: { reply: ["Jefe, no lo localicé. Soldamos el eje para arrancar."], outcome: "Sin decisión, la planta parchó el eje y siguió.", effects: { clientes: -2, equipo: -2 } },
    lesson: "finanzas",
    bitacora: { title: "La deuda de mantenimiento se cobra con intereses", text: "Lo que ahorraste al posponer ya se pagó, más caro y en el peor momento. Ahora la decisión es otra: arreglar de fondo o volver a comprar tiempo.", nota: "Cuando el riesgo que aceptaste se materializa, no decidas para recuperar lo perdido: decide con lo que sabes hoy." },
    areas: ["operacion", "finanzas", "clientes"],
  },
  {
    id: "c-mant-rendimiento", day: 4, slot: 3, channel: "reporte", from: "javier", since: V,
    involves: ["sofia", "lucia"],
    trigger: { item: "d2-mantenimiento", options: ["b", "__expired"], roll: [0.4, 1] },
    subject: "La línea 1 está perdiendo rendimiento", preview: "Jefe, la envasadora no se ha parado, pero cada semana trabaja peor…",
    body: [
      "Jefe, la envasadora no se ha parado, pero cada semana trabaja peor.",
      "El rendimiento bajó de 82 % a 74 % y la merma de empaque se duplicó. Para cumplirle a SuperNorte estamos metiendo horas extra entre semana.",
      "El técnico no puede decir si va a fallar. Dice que cada semana que pasa la probabilidad sube.",
    ],
    data: { title: "Lo que sabes", rows: [["Rendimiento de la línea 1", "74 % (antes 82 %)"], ["Merma de empaque", "4.5 % (antes 2 %)"], ["Horas extra este mes", "$380 mil"], ["Mantenimiento mayor ahora", "4 días de paro · $1.8 M · entregas parciales"]] },
    ask: "¿Qué haces con la línea 1?",
    options: [
      { id: "a", stance: { javier: 2, sofia: -1 }, text: "Hacer ya el mantenimiento mayor aunque sea temporada alta, y negociar con SuperNorte entregas parciales durante esos cuatro días.", reply: ["Gracias, jefe. Ya me estaba quitando el sueño.", "(Sofía) Entiendo. Pero le pido que no se repita en esta temporada."], outcome: "Pagas el mantenimiento en el peor momento y SuperNorte recibe menos cuatro días. Cortas el riesgo antes de que se vuelva una falla.", effects: { caja: -3, clientes: -2, equipo: 2 }, style: { horizonte: 2, riesgo: -2 }, score: 3 },
      { id: "b", stance: { javier: -1, sofia: 1 }, text: "Aguantar hasta enero con horas extra y que Calidad revise cada lote, para no fallarle a SuperNorte en su temporada más fuerte.", reply: ["Como usted diga, jefe, aunque la gente ya viene cansada.", "Calidad empieza a revisar cada lote desde hoy."], outcome: "SuperNorte recibe completo. La merma y las horas extra se comen el margen semana a semana, y el riesgo de falla sigue subiendo.", effects: { clientes: 1, margen: -2, equipo: -2 }, style: { horizonte: -2, riesgo: 2 }, score: 1 },
      { id: "c", stance: { javier: 1 }, text: "Cambiar las mordazas de sellado este fin de semana para frenar la merma, y dejar el mantenimiento mayor completo para enero.", reply: ["Eso ayuda bastante, jefe.", "No resuelve todo, pero baja la merma y nos da aire."], outcome: "Frenas la parte más cara del problema sin parar entre semana. Compras tiempo, no certeza.", effects: { caja: -1, margen: 1, equipo: -1 }, style: { horizonte: 1, riesgo: 1 }, score: 2 },
    ],
    expired: { reply: ["Jefe, sin respuesta. Seguimos con horas extra."], outcome: "Sin decisión, la línea siguió perdiendo rendimiento y la merma siguió creciendo.", effects: { margen: -2, equipo: -2 } },
    lesson: "finanzas",
    bitacora: { title: "No fallar no es lo mismo que estar bien", text: "La máquina no se rompió, pero el costo de posponer ya llegó en otra forma: merma, horas extra y gente cansada. Es menos visible que una falla, y por eso es fácil seguir pagándolo.", nota: "Un riesgo que no se materializa todavía no es un riesgo resuelto." },
    areas: ["operacion", "finanzas", "estrategia"],
  },

  // ─────────────────────────────────────────────── DÍA 5 · el parche no siempre aguanta: el cliente reclama
  {
    id: "c-mant-queja", day: 5, slot: 3, channel: "email", from: "sofia", since: V,
    involves: ["hector", "lucia"],
    trigger: { item: "c-mant-falla", options: ["b", "__expired"], roll: [0, 0.7] },
    subject: "Incumplimiento de nivel de servicio", preview: "Desde la falla de la envasadora su nivel de servicio bajó a 86 % y encontramos empaques mal sellados…",
    body: [
      "Director:",
      "Desde la falla de la envasadora su nivel de servicio bajó a 86 % y en 12 tiendas encontramos empaques mal sellados en anaquel. Tuvimos que retirarlos.",
      "Nuestra política es clara: penalización de 3 % sobre lo facturado del periodo y revisión del espacio en anaquel para el siguiente trimestre.",
      "Necesito saber hoy qué va a hacer para que no vuelva a pasar.",
      "Sofía Leal",
    ],
    data: { title: "Lo que sabes", rows: [["Nivel de servicio acordado", "95 %"], ["Nivel de servicio real (desde la falla)", "86 %"], ["Penalización", "$1.4 M"], ["Planta", "La soldadura del eje cedió dos veces"]] },
    ask: "SuperNorte reclama. ¿Qué le respondes?",
    options: [
      { id: "a", stance: { sofia: 2, lucia: -1 }, text: "Aceptar la penalización, explicarle a Sofía la falla de la envasadora con datos y comprometer la reparación de fondo con un reporte semanal.", reply: ["Le agradezco la claridad, Director.", "Mándeme el primer reporte el lunes y lo comparto con mi gerente."], outcome: "Pagas la penalización completa. SuperNorte ve un proveedor que reconoce el problema y lo está resolviendo, y eso pesa en la revisión del anaquel.", effects: { caja: -3, clientes: 2, consejo: 1 }, style: { conflicto: 1, horizonte: 2 }, score: 3 },
      { id: "b", stance: { sofia: 1, hector: 1, lucia: -1 }, text: "Pedirle que condone la penalización a cambio de una promoción pagada por nosotros en sus tiendas durante el próximo mes.", reply: ["Lo puedo revisar con mi gerente.", "Si la promoción va en las tiendas donde retiramos producto, tiene más posibilidades."], outcome: "Cambias una multa por un descuento que sale del margen. SuperNorte gana una promoción; tú ganas tiempo, no confianza.", effects: { margen: -2, clientes: 2 }, style: { conflicto: -1, riesgo: 1 }, score: 2 },
      { id: "c", stance: { sofia: -2, hector: -1 }, text: "Disputar la penalización: el sellado pasó nuestras pruebas, y el daño pudo ocurrir en su centro de distribución.", reply: ["Director, tenemos fotos de los empaques en anaquel con su lote.", "Lo voy a escalar con mi gerente."], outcome: "Te ahorras la multa por ahora y conviertes un problema de planta en un pleito con tu cliente más grande.", effects: { caja: 2, clientes: -4 }, style: { conflicto: 2, horizonte: -2 }, score: 1 },
    ],
    expired: { reply: ["(SuperNorte) Se aplica la penalización y se revisa el espacio en anaquel."], outcome: "Sin respuesta, SuperNorte aplicó la penalización y anotó al proveedor como riesgo.", effects: { caja: -3, clientes: -3 } },
    lesson: "negociacion",
    bitacora: { title: "El problema de planta llega al cliente", text: "Lo que empezó como una decisión de mantenimiento ya es un tema comercial. Con un cliente con el que vas a negociar muchas veces, cómo respondes hoy pesa en la siguiente negociación.", nota: "La reputación con un cliente se construye en los reclamos, no en las juntas de ventas." },
    areas: ["clientes", "negociacion", "operacion"],
  },

  // ─────────────────────────────────────────────── DÍA 6 · la inversión correctiva, más cara
  {
    id: "c-mant-inversion", day: 6, slot: 3, channel: "reporte", from: "lucia", since: V,
    involves: ["javier", "carla"],
    trigger: { item: "c-mant-queja", options: ["a", "b", "c", "__expired"] },
    subject: "La envasadora: reconstruir o reemplazar", preview: "El mantenimiento mayor que costaba $1.8 M ya no alcanza. Te paso los caminos…",
    body: [
      "Te paso el diagnóstico del fabricante sobre la envasadora de la línea 1. La soldadura dañó la flecha y el desgaste llegó a la estructura: el mantenimiento mayor que costaba $1.8 M ya no alcanza.",
      "Hay dos caminos serios y uno para comprar tiempo. Cualquiera sale más caro que lo que nos ahorramos al posponer. Te lo digo sin reproche: es la cuenta.",
      "Para el consejo necesito tu decisión y cómo la vas a explicar.",
    ],
    data: { title: "Lo que sabes (Lucía)", rows: [["Reconstrucción por el fabricante", "$5.2 M · 10 días de paro"], ["Envasadora nueva", "$12 M · 4 meses de entrega"], ["Rentar una envasadora mientras", "$300 mil al mes"], ["Lo que se ahorró al posponer", "$1.8 M"]] },
    ask: "¿Qué propones al consejo?",
    options: [
      { id: "a", stance: { lucia: 2, carla: 2, javier: 1 }, text: "Reconstruirla con el fabricante, contarle al consejo que posponer el mantenimiento fue mi error y proponer un programa preventivo para las tres líneas.", reply: ["Eso es lo que el consejo necesita oír.", "(Carla) Gracias por no maquillarlo. Así sí se puede defender."], outcome: "La reparación de fondo cuesta casi tres veces lo que te ahorraste. Reconocerlo frente al consejo te cuesta orgullo y te gana credibilidad.", effects: { caja: -5, consejo: 2 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { javier: 2, lucia: -2, carla: -1 }, text: "Comprar la envasadora nueva con crédito y rentar una mientras llega: dejamos de parchar de una vez y ganamos capacidad para crecer.", reply: ["Es mucho dinero para el momento en que estamos.", "Lo armo, pero el banco va a pedir garantías y el consejo va a preguntar por qué ahora."], outcome: "Resuelves de raíz y ganas capacidad, con deuda nueva y cuatro meses de renta. Es una apuesta de crecimiento disfrazada de reparación.", effects: { caja: -3, margen: -2, clientes: 2 }, style: { riesgo: 2, horizonte: 1 }, score: 2 },
      { id: "c", stance: { lucia: 1, javier: -1 }, text: "Rentar una envasadora tres meses y decidir la inversión en enero, con los números del año cerrado y otra cotización en la mano.", reply: ["Es prudente para la caja.", "(Javier) Jefe, rentada o no, la nuestra se sigue deteriorando."], outcome: "Cuidas la caja este trimestre y decides con más información. Pagas renta y vuelves a posponer, ahora con el consejo mirando.", effects: { caja: 1, margen: -2, consejo: -1 }, style: { horizonte: -1, riesgo: -1 }, score: 1 },
    ],
    expired: { reply: ["(Lucía) Sin tu decisión, rento una envasadora para no parar."], outcome: "Sin decisión, Finanzas rentó una envasadora y el consejo preguntó quién decidía.", effects: { margen: -2, consejo: -3 } },
    lesson: "finanzas",
    bitacora: { title: "La cuenta completa de un ahorro", text: "El ahorro de posponer se veía en la caja del trimestre. El costo llegó repartido: flete urgente, penalización, reclamo del cliente y una reparación mayor. Ninguno de esos números estaba en el reporte del día en que decidiste.", nota: "Las consecuencias de una decisión operativa casi nunca llegan juntas ni con el mismo nombre: por eso cuesta verlas." },
    areas: ["finanzas", "estrategia", "operacion"],
  },

  // ─────────────────────────────────────────────── DÍA 5 · camino «arreglo parcial»: lo que no se revisó
  {
    id: "c-mant-dosificador", day: 5, slot: 3, channel: "whatsapp", from: "javier", since: V,
    involves: ["sofia", "lucia"],
    trigger: { item: "d2-mantenimiento", options: ["c"], roll: [0, 0.35] },
    subject: "Javier Ortiz", preview: "Jefe, las mordazas nuevas jalan perfecto. Pero salió otra cosa: el dosificador…",
    body: [
      "Jefe, las mordazas nuevas jalan perfecto: no se nos ha vuelto a parar la línea.",
      "Pero salió otra cosa. El dosificador, que no tocamos, está llenando disparejo. En la auditoría de hoy, 1 de cada 20 empaques traía menos contenido del que dice la etiqueta.",
      "Ya separé el lote. Lo que no sé es cuánto salió así desde que cambiamos las mordazas.",
    ],
    data: { title: "Lo que sabes", rows: [["Empaques con menos contenido", "5 % del lote auditado"], ["Producto enviado desde el cambio de mordazas", "Cerca de $3 M"], ["Calibrar el dosificador", "1 día de paro · $150 mil"], ["Si lo detecta la autoridad", "Multa e inmovilización de producto"]] },
    ask: "¿Qué haces con lo que ya salió?",
    options: [
      { id: "a", stance: { javier: 2, sofia: 1, lucia: -1 }, text: "Calibrar hoy, avisarle a SuperNorte qué lotes pueden venir bajos y reponerles sin costo todo lo enviado desde el cambio de mordazas.", reply: ["Va, jefe. Le paso hoy los números de lote.", "(Sofía) Le agradezco que nos avise antes de que lo encontremos nosotros."], outcome: "Pagas la reposición y un día de paro. SuperNorte se entera por ti y no por un cliente o por la autoridad.", effects: { caja: -3, clientes: 2, consejo: 1 }, style: { horizonte: 2, conflicto: 1 }, score: 3 },
      { id: "b", stance: { lucia: 1, javier: -1 }, text: "Calibrar hoy, reforzar el muestreo y no decirle nada a SuperNorte de lo que ya salió: el promedio queda dentro de tolerancia y nadie se ha quejado.", reply: ["Como usted diga, jefe, pero yo no voy a firmar que todo salió bien.", "Reforzamos el muestreo desde el siguiente turno."], outcome: "No pagas reposición. Pero ya sabes que hay empaques con menos de lo que dice la etiqueta en el anaquel de tu cliente y decidiste callarlo: si aparece, ya no es una falla de la máquina, es una decisión tuya. Eso es una línea roja.", effects: { caja: 1, clientes: -2, equipo: -1 }, style: { horizonte: -2, riesgo: 2 }, score: 1 },
      { id: "c", stance: { javier: 1, lucia: 1, sofia: 1 }, text: "Calibrar hoy, avisarle ya a SuperNorte que esos lotes están en revisión y que Calidad mida una muestra grande; en 48 horas le digo cuánto se repone.", reply: ["Me parece, jefe. Mañana tengo la muestra.", "(Sofía) Gracias por avisar. Espero el número el jueves; si es grande, lo retiramos juntos."], outcome: "El cliente sabe desde hoy lo que tú sabes y decides la reposición con el tamaño real del problema. Pagas el muestreo y dos días de incertidumbre con tu cliente más grande.", effects: { caja: -1, clientes: -1, equipo: 1 }, style: { horizonte: 1, riesgo: 1 }, score: 2 },
    ],
    expired: { reply: ["Jefe, sin respuesta. Calibramos y seguimos."], outcome: "Sin decisión, se calibró la máquina y nadie le avisó al cliente.", effects: { clientes: -2, equipo: -1 } },
    lesson: "cultura",
    bitacora: { title: "El arreglo parcial deja puntos ciegos", text: "Cambiar solo las mordazas resolvió lo que se veía. El dosificador no se revisó y el problema apareció por otro lado. Un arreglo parcial puede ser buena decisión, siempre que sepas qué dejaste sin revisar. Lo que no es negociable es avisar: corregir hacia adelante sin decirle al cliente lo que ya recibió convierte una falla de máquina en un engaño.", nota: "Lo que no revisas no desaparece: solo deja de estar en tu reporte." },
    areas: ["etica", "operacion", "clientes"],
  },
];
