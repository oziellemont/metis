/**
 * mêtis CEO · Banco de casos (P1-D) · ocho decisiones más.
 *
 * Inspiradas en los temas de cursos abiertos de estrategia y liderazgo (ventaja competitiva y teoría de juegos,
 * planeación y ejecución, análisis organizacional, liderazgo estratégico y adaptativo) y ancladas, como las diez
 * primeras, en un precedente real y documentado. Mismas reglas: ninguna opción domina, toda opción cuesta algo,
 * la postura solo toca a personas del caso. Ver docs/carrera-continua/banco-de-casos.md.
 */
import type { Archetype } from "./archetypes";

export const ARCHETYPES_P1D: readonly Archetype[] = [
  // ─────────────────────────────────────────────── 11 · guerra de precios
  {
    id: "guerra",
    title: "Un competidor baja precios",
    question: "¿Respondes a la jugada del otro pensando en la siguiente, o solo en la de hoy?",
    from: "sales", involves: ["cfo", "board"], channel: "email",
    ask: "¿Cómo respondes?",
    dataTitle: "Lo que está pasando",
    options: [
      {
        text: "Respuesta focalizada: igualo solo donde me atacan y con los clientes en riesgo, y refuerzo lo que me hace distinto con los que más me valoran.",
        reply: ["Va. Te armo la lista de clientes en riesgo hoy.", "No es lo que pedía, pero puedo defenderlo."],
        outcome: "Contienes la fuga sin regalar margen donde nadie te atacó. El competidor ve que respondes, pero no que te asustaste.",
        effects: { margen: -1, caja: -2, clientes: 2, consejo: 1 }, style: { horizonte: 1, foco: 1, riesgo: -1 }, score: 3,
        stance: { sales: 1, cfo: 1, board: -1 },
      },
      {
        text: "Igualo el precio en toda la línea a partir del lunes: no voy a perder un solo cliente más.",
        reply: ["Por fin. Comercial sale con todo.", "El margen de este año ya no es el que presentamos."],
        outcome: "Frenas la fuga de inmediato. También le enseñas al mercado que tu diferencia era el precio, y el competidor puede volver a bajar.",
        effects: { clientes: 4, margen: -6, caja: -3, consejo: -2 }, style: { riesgo: 1, horizonte: -2, conflicto: 1 }, score: 1,
        stance: { sales: 2, cfo: -2, board: -1 },
      },
      {
        text: "No muevo nada: no voy a entrar a una guerra de precios. Que el cliente que se vaya regrese cuando vea la diferencia.",
        reply: ["Entendido. Te aviso a quién perdemos.", "Algunos no van a regresar."],
        outcome: "Proteges el margen y la marca. Pierdes participación con quienes solo compraban por precio, y algunos que no.",
        effects: { margen: 2, caja: 1, clientes: -5 }, style: { riesgo: 1, conflicto: -1, foco: 1 }, score: 2,
        stance: { sales: -2, cfo: 1, board: 1 },
      },
    ],
    expired: { reply: ["Sin respuesta, Comercial empezó a dar descuentos por su cuenta."], outcome: "Respondiste sin decidir: descuentos dispersos, sin estrategia.", effects: { margen: -3, clientes: -2 } },
    lesson: "estrategia",
    areas: ["estrategia", "clientes", "finanzas"],
    bitacora: {
      title: "Piensa en la siguiente jugada",
      text: "En un mercado donde los mismos jugadores se enfrentan todos los años, cada movimiento de precio es un mensaje. Igualar todo enseña al competidor que bajar funciona y al cliente que tu valor era el precio. No responder le dice que puede quedarse con tu terreno. La respuesta que mejor funciona suele ser proporcional, focalizada donde te atacan y visible, y compite donde tú tienes ventaja, no donde la tiene el otro.",
      nota: "Antes de responder, escribe qué hará el competidor después de tu respuesta. Si la respuesta es «volver a bajar», no estás ganando: estás comprando tiempo con margen.",
    },
    real: {
      company: "Philip Morris · 1993",
      title: "El viernes de Marlboro",
      text: "El 2 de abril de 1993, para frenar a las marcas genéricas que le quitaban participación, Philip Morris bajó 20% el precio de Marlboro. Su acción cayó 26% ese día y arrastró a otras marcas de consumo. La revista Fortune lo llamó «el día que el hombre de Marlboro se cayó del caballo». Los inversionistas leyeron el recorte como una admisión: la marca ya no podía justificar su precio.",
      sources: ["https://en.wikipedia.org/wiki/Marlboro_Friday"],
    },
    twists: [
      "Además: el competidor es una empresa con mucho capital que puede perder dinero un año entero.",
      "Además: tu cliente más grande ya te mandó la lista de precios del competidor «para que la conozcas».",
      "Además: tu equipo comercial cobra comisión por volumen, no por margen.",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 12 · el reporte todo verde
  {
    id: "verde",
    title: "El reporte que siempre sale en verde",
    question: "¿Tu gente puede traerte malas noticias sin pagar por ellas?",
    from: "frontline", involves: ["ops", "chair"], channel: "whatsapp",
    ask: "¿Qué haces con lo que te contaron?",
    dataTitle: "Lo que dice el reporte y lo que pasa",
    options: [
      {
        text: "Le agradezco el aviso, en la próxima revisión pido que el proyecto se reporte en rojo y la primera pregunta es «¿cómo te ayudamos?». Nadie paga por decir la verdad.",
        reply: ["Gracias por escucharme. No sabía si iba a tener problemas.", "Si así va a ser, va a salir más de un rojo."],
        outcome: "El tablero se pinta de rojo y el mes se ve peor. Por primera vez sabes dónde está el problema, y la gente aprende que avisar sirve.",
        effects: { equipo: 3, consejo: -2, margen: -1, clientes: 1 }, style: { horizonte: 2, estilo: 1, conflicto: 1 }, score: 3,
        stance: { frontline: 2, ops: -1 },
      },
      {
        text: "Llamo a cuentas a {ops} frente al comité por reportar en verde lo que estaba en rojo: tiene que haber una consecuencia.",
        reply: ["Entendido. Lo hablo hoy.", "La gente va a entender que el problema fue que se supo."],
        outcome: "Dejas claro que mentir no se tolera. El mensaje que se queda es otro: el que muestra un rojo termina expuesto.",
        effects: { consejo: 2, equipo: -4, clientes: 1 }, style: { conflicto: 2, estilo: -2 }, score: 1,
        stance: { frontline: 1, ops: -2, chair: 1 },
      },
      {
        text: "El reporte oficial dice verde y no voy a desautorizar a mis directores por un mensaje de pasillo. Le pido que lo hable con su jefe.",
        reply: ["Ok. Perdón por la molestia.", "Ya lo había hablado con él."],
        outcome: "Respetas la línea de mando. El problema sigue escondido hasta que el cliente lo encuentre, y quien te avisó no lo vuelve a hacer.",
        effects: { equipo: 1, consejo: 1, clientes: -4, margen: -1 }, style: { conflicto: -2, riesgo: 1, horizonte: -1 }, score: 0,
        stance: { frontline: -2, ops: 1 },
      },
    ],
    expired: { reply: ["Nadie respondió el mensaje."], outcome: "Quien te avisó entendió el silencio como respuesta. El reporte siguió en verde.", effects: { equipo: -2, clientes: -3 } },
    lesson: "alineacion-2",
    areas: ["alineacion", "cultura", "comunicacion"],
    bitacora: {
      title: "El rojo es información",
      text: "Si reportar un problema cuesta el prestigio o el puesto, todos los reportes salen en verde hasta que el problema explota. Lo que hace el líder la primera vez que alguien muestra un rojo decide si habrá una segunda. Agradecer el rojo no es premiar el problema: es premiar que llegó a tiempo para resolverlo.",
      nota: "Si tu tablero lleva semanas en verde mientras los resultados no llegan, el tablero no está midiendo: está protegiendo a alguien. Pregunta qué cuesta decir «voy mal».",
    },
    real: {
      company: "Ford · 2006",
      title: "La primera lámina en rojo",
      text: "Alan Mulally llegó a Ford cuando la empresa iba hacia una pérdida de 17 mil millones de dólares. En su primera revisión semanal, todos los directores presentaron sus láminas en verde. Una semana después, Mark Fields mostró una en rojo por un problema en Canadá. Mulally aplaudió: «Gracias por la transparencia. ¿Qué podemos hacer todos para ayudar?». A la semana siguiente aparecieron muchos más rojos, y la empresa empezó a resolver lo que antes escondía.",
      sources: ["https://chiefexecutive.net/alan-mulally-on-the-power-of-transparency/"],
    },
    twists: [
      "Además: {ops} es de tus directores más leales y lleva diez años en la empresa.",
      "Además: el consejo revisa ese mismo tablero la próxima semana.",
      "Además: quien te escribió te pide que no digas que fue él.",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 13 · el número del trimestre
  {
    id: "trimestre",
    title: "Llegar al número del trimestre",
    question: "¿Sacrificas lo que no se ve para cumplir lo que sí se ve?",
    from: "board", involves: ["chair", "cfo"], channel: "email",
    ask: "¿Qué propones en la sesión?",
    dataTitle: "El trimestre",
    options: [
      {
        text: "Presento el número real, explico qué inversión lo explica y propongo que el consejo me mida también con indicadores de largo plazo acordados.",
        reply: ["No es lo que quería oír. Pero prefiero eso a una sorpresa.", "Prepara bien esos indicadores: te los voy a pedir cada sesión."],
        outcome: "El trimestre se ve mal y algunos consejeros dudan. Proteges lo que sostiene los próximos años y cambias la conversación del consejo.",
        effects: { consejo: -2, caja: -1, equipo: 2, clientes: 1 }, style: { horizonte: 2, conflicto: 1, riesgo: -1 }, score: 3,
        stance: { board: -2, chair: 1, cfo: 1 },
      },
      {
        text: "Hago lo que propone: aplazo el mantenimiento y la capacitación, y llegamos al número.",
        reply: ["Bien. Eso es cumplir.", "Que conste: es la segunda vez que lo aplazamos."],
        outcome: "Cumples el trimestre. Lo que dejaste de hacer no aparece en el reporte, hasta que aparece como falla, rotación o cliente perdido.",
        effects: { margen: 4, caja: 3, consejo: 3, equipo: -3, clientes: -2 }, style: { horizonte: -2, riesgo: 1, conflicto: -1 }, score: 1,
        stance: { board: 2, cfo: -1 },
      },
      {
        text: "Busco el punto medio: recorto la mitad de lo que propone y aplazo una inversión menor.",
        reply: ["No llegamos, pero nos acercamos.", "Ojalá alcance."],
        outcome: "Quedas cerca del número y cerca del plan, sin cumplir del todo ninguno de los dos.",
        effects: { margen: 2, caja: 1, consejo: 1, equipo: -1, clientes: -1 }, style: { conflicto: -1 }, score: 2,
        stance: { board: 1, chair: -1, cfo: 1 },
      },
    ],
    expired: { reply: ["Llegaste a la sesión sin propuesta."], outcome: "El consejo decidió por ti, y decidió recortar.", effects: { consejo: -3, equipo: -2 } },
    lesson: "consejo",
    areas: ["estrategia", "finanzas", "comunicacion"],
    bitacora: {
      title: "El trimestre es una foto, no la película",
      text: "Recortar lo que no se ve (mantenimiento, capacitación, atención al cliente) para llegar a una meta trimestral convierte un mal trimestre en un mal año. Con el consejo funciona lo contrario: sin sorpresas, con el número real, con lo que lo explica y con indicadores que anticipan lo que viene.",
      nota: "Cuando te propongan un recorte para «llegar al número», pregunta qué pasa con ese recorte en doce meses. Si la respuesta es «lo pagamos después, más caro», no es un ahorro: es deuda.",
    },
    real: {
      company: "Unilever · 2009",
      title: "Dejar de prometer trimestres",
      text: "Al llegar como CEO, Paul Polman dejó de dar guías de utilidades trimestrales: dijo que las metas de corto plazo empujaban decisiones que dañaban el desempeño de largo plazo. No fue gratis: en 2013 y 2014 Unilever no alcanzó sus metas de venta en seis de ocho trimestres, y algunos accionistas cuestionaron su estrategia.",
      sources: ["https://en.wikipedia.org/wiki/Paul_Polman"],
    },
    twists: [
      "Además: el banco revisa los resultados del trimestre para renovar tu línea de crédito.",
      "Además: el consejero que lo propone es el que más votos tiene en el consejo.",
      "Además: el trimestre pasado tampoco llegaste.",
    ],
    minStage: 2,
  },

  // ─────────────────────────────────────────────── 14 · incidente de primera línea
  {
    id: "incidente",
    title: "Un incidente de tu gente se vuelve viral",
    question: "¿Respondes por la regla o por la persona que salió lastimada?",
    from: "ops", involves: ["frontline", "people", "chair"], channel: "llamada",
    ask: "Ya hay medios preguntando. ¿Qué haces?",
    dataTitle: "Lo que sabes",
    options: [
      {
        text: "Doy la cara yo: me disculpo en persona con el afectado, reviso la regla que provocó esto y capacito a todos aunque haya que cerrar medio día.",
        reply: ["Va. Te consigo su teléfono hoy.", "Cerrar medio día nos va a costar, pero el mensaje se va a entender."],
        outcome: "La disculpa llega del que manda y viene con un cambio real. Cuesta dinero y una mala semana; la conversación pasa de «qué hicieron» a «qué cambiaron».",
        effects: { caja: -3, margen: -2, clientes: 3, equipo: 1, consejo: 1 }, style: { horizonte: 2, estilo: 1, conflicto: 1 }, score: 3,
        stance: { ops: 1, frontline: 1, people: 1, chair: -1 },
      },
      {
        text: "Comunicado de la empresa hoy y la persona que lo hizo sale de inmediato: que quede claro que no lo toleramos.",
        reply: ["Entendido. Hablo con ella.", "Siguió la regla que nosotros le dimos."],
        outcome: "La nota se enfría rápido. Adentro, tu gente aprende que si la regla falla, paga el que la aplicó.",
        effects: { clientes: 2, consejo: 1, equipo: -4, caja: -1 }, style: { conflicto: 2, estilo: -2, horizonte: -1 }, score: 1,
        stance: { ops: -1, frontline: -2, chair: 1 },
      },
      {
        text: "No respondo: la persona siguió el procedimiento y en dos días nadie se va a acordar.",
        reply: ["Ok. No contestamos.", "Tu gente de primera línea te lo agradece."],
        outcome: "Proteges a tu gente esta semana. El silencio se lee como indiferencia y el video sigue circulando sin tu versión.",
        effects: { equipo: 2, caja: 1, clientes: -6, consejo: -2 }, style: { conflicto: -2, riesgo: 2 }, score: 0,
        stance: { ops: 1, frontline: 2, people: -1, chair: -2 },
      },
    ],
    expired: { reply: ["Nadie habló por la empresa."], outcome: "Los medios contaron la historia sin ti.", effects: { clientes: -6, consejo: -3 } },
    lesson: "crisis",
    areas: ["clientes", "comunicacion", "cultura"],
    bitacora: {
      title: "Corrige la regla, no solo a la persona",
      text: "Cuando alguien de primera línea hace daño siguiendo una regla, el problema es de quien escribió la regla. Una respuesta que funciona tiene tres partes: una disculpa sin condiciones de quien manda, contacto directo con quien salió lastimado y un cambio visible en la regla o en cómo se aplica. Despedir a la persona puede calmar el día, pero deja intacta la causa.",
      nota: "En una crisis de reputación pregunta: si esto vuelve a pasar mañana, ¿qué cambió? Si la respuesta es «otra persona en el puesto», no cambió nada.",
    },
    real: {
      company: "Starbucks · 2018",
      title: "Cerrar 8 mil tiendas una tarde",
      text: "En abril de 2018 una gerente de Starbucks en Filadelfia llamó a la policía y dos hombres negros fueron arrestados mientras esperaban a una persona. El primer comunicado fue genérico y no alcanzó. El CEO, Kevin Johnson, se disculpó en persona, se reunió con los dos hombres y el 29 de mayo cerró más de 8 mil tiendas una tarde para capacitar contra prejuicios a unos 175 mil empleados, con un costo estimado de 12 millones de dólares.",
      sources: ["https://mitsloan.mit.edu/ideas-made-to-matter/what-starbucks-got-wrong-and-right-after-philadelphia-arrests"],
    },
    twists: [
      "Además: el afectado ya habló con un periodista y dice que nadie de la empresa lo ha buscado.",
      "Además: la persona del video tiene años en la empresa y su equipo la defiende.",
      "Además: hay otro video, de hace un año, en otra sucursal, con la misma regla.",
    ],
    minStage: 1,
    deadlineH: 8,
  },

  // ─────────────────────────────────────────────── 15 · equidad salarial
  {
    id: "salarios",
    title: "Lo que pagas ya no es justo",
    question: "¿Corriges lo injusto cuidando también a quien sí se siente bien tratado?",
    from: "people", involves: ["cfo", "frontline"], channel: "email",
    ask: "¿Qué haces con los sueldos?",
    dataTitle: "Los números de Personas",
    options: [
      {
        text: "Subo el piso salarial en tres etapas en 18 meses, lo financio en parte con los bonos directivos (empezando por el mío) y publico los criterios, respetando la diferencia por antigüedad y desempeño.",
        reply: ["Gracias. Que empiece por arriba va a pesar más que el aumento.", "Te armo los criterios esta semana."],
        outcome: "La gente ve un plan creíble y sabe por qué gana lo que gana. La utilidad del año baja y algunos directivos no lo celebran.",
        effects: { margen: -3, caja: -2, equipo: 4, clientes: 1 }, style: { horizonte: 2, estilo: 1, conflicto: 1 }, score: 3,
        stance: { people: 2, cfo: -1, frontline: 1 },
      },
      {
        text: "Mismo sueldo mínimo para todos a partir de la próxima quincena, aunque se acorten las diferencias con los que llevan años.",
        reply: ["Va a ser noticia, para bien.", "Los de más antigüedad van a preguntar qué ganaron ellos."],
        outcome: "La rotación baja y el ánimo sube de golpe. Algunos de los más experimentados sienten que su antigüedad dejó de valer.",
        effects: { equipo: 2, clientes: 2, margen: -5, caja: -3 }, style: { riesgo: 2, horizonte: 1, conflicto: 1 }, score: 2,
        stance: { people: 1, cfo: -2, frontline: 2 },
      },
      {
        text: "Mantengo los sueldos y pongo un bono de permanencia solo para los mejores: así gasto donde más importa.",
        reply: ["Ok. Lo armo.", "El resto lo va a notar."],
        outcome: "Cuidas la caja y retienes a algunos. El resto se entera de quién sí recibió y la rotación sigue igual.",
        effects: { caja: 1, margen: 1, consejo: 1, equipo: -4 }, style: { riesgo: -1, conflicto: -1 }, score: 1,
        stance: { people: -2, cfo: 1, frontline: -2 },
      },
    ],
    expired: { reply: ["El tema se quedó en la mesa."], outcome: "La gente siguió renunciando, y ahora sabe que lo sabías.", effects: { equipo: -4 } },
    lesson: "personas",
    areas: ["personas", "finanzas", "cultura"],
    bitacora: {
      title: "Lo justo se mide en dos direcciones",
      text: "La gente compara su sueldo hacia afuera (lo que paga el mercado) y hacia adentro (lo que gana el de al lado). Un ajuste que corrige una comparación y rompe la otra crea un problema nuevo. Lo que más sostiene un cambio de sueldos es que los criterios se entiendan y que el sacrificio empiece por arriba.",
      nota: "Antes de anunciar un ajuste, explícalo en voz alta a la persona con más antigüedad del equipo. Si no lo puedes justificar frente a ella, revisa el diseño.",
    },
    real: {
      company: "Gravity Payments · 2015",
      title: "Setenta mil para todos",
      text: "Dan Price anunció que en tres años nadie en su empresa ganaría menos de 70 mil dólares y bajó su propio sueldo de 1 millón a 70 mil. Dos empleados con años en la empresa se fueron porque sintieron injusto que los nuevos se acercaran a su sueldo. Aun así, la retención llegó a 91% contra 68% de la industria. En 2020, con la pandemia, los ingresos por comisiones cayeron 55% y la plantilla aceptó recortes temporales; algunos empleados dijeron después que se sintieron presionados.",
      sources: ["https://en.wikipedia.org/wiki/Gravity_Payments"],
    },
    twists: [
      "Además: un competidor está contratando a tu gente con 20% más de sueldo.",
      "Además: el consejo aprobó hace un mes el bono directivo del año.",
      "Además: la nómina de este mes ya circula en un grupo de WhatsApp.",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 16 · la meta imposible
  {
    id: "meta",
    title: "Alguien avisa que la meta solo se cumple haciendo trampa",
    question: "¿Escuchas la alarma que llega desde abajo aunque te cueste la fecha?",
    from: "frontline", involves: ["ops", "sales"], channel: "whatsapp",
    ask: "¿Qué le contestas?",
    dataTitle: "Lo que te está contando",
    options: [
      {
        text: "Gracias por avisar. Se detiene el atajo hoy, renegocio la fecha con {cliente} y nadie toma represalias contra ti.",
        reply: ["Gracias. No sabía si me iba a costar el trabajo.", "Comercial no va a estar contento, pero así sí firmo."],
        outcome: "Pierdes la fecha y un poco de confianza del cliente. Ganas algo que vale más: que la próxima alarma también te llegue.",
        effects: { clientes: -2, caja: -2, equipo: 3, consejo: 1 }, style: { horizonte: 2, riesgo: -2, conflicto: 1 }, score: 3,
        stance: { frontline: 2, ops: -1, sales: -2 },
      },
      {
        text: "Entiendo, pero la fecha no se mueve. Que {ops} lo resuelva como pueda.",
        reply: ["Ok.", "Lo voy a hacer, pero no voy a firmar."],
        outcome: "Cumples la fecha. La regla de la empresa queda clara para todos: el número manda, aunque para llegar haya que hacer trampa.",
        effects: { clientes: 2, caja: 2, margen: 1, equipo: -4, consejo: -1 }, style: { horizonte: -2, riesgo: 2, conflicto: -1 }, score: 0,
        stance: { frontline: -2, sales: 2 },
      },
      {
        text: "Mantengo la fecha solo con lo que ya está validado, entrego en dos partes y pido una revisión externa de lo demás.",
        reply: ["Así sí podemos.", "El cliente va a preguntar por qué en dos partes."],
        outcome: "No haces trampa ni pierdes del todo la fecha. Pagas horas extra y una revisión, y el cliente recibe menos de lo prometido.",
        effects: { clientes: -1, caja: -1, margen: -2, equipo: -1, consejo: 2 }, style: { riesgo: -1, foco: -1 }, score: 2,
        stance: { frontline: 1, ops: 1, sales: -1 },
      },
    ],
    expired: { reply: ["No le contestaste."], outcome: "Entendió que la fecha manda. El atajo siguió.", effects: { equipo: -3, consejo: -2 } },
    lesson: "alineacion",
    areas: ["etica", "operacion", "personas"],
    bitacora: {
      title: "La alarma que nadie quiere oír",
      text: "Cuando una meta no se puede cumplir con las reglas, la gente cambia las reglas en silencio. Quien se atreve a avisar está tomando un riesgo personal; si lo ignoras o lo castigas, no habrá un segundo aviso. Proteger esas voces desde abajo es parte del trabajo del líder, sobre todo cuando lo que dicen es incómodo.",
      nota: "Cada vez que fijes una meta, pregunta a quien la va a ejecutar: «¿qué tendrías que hacer para llegar si no alcanza el tiempo?». Si la respuesta te incomoda, la meta está mal hecha.",
    },
    real: {
      company: "Volkswagen · 2015",
      title: "El motor que no podía pasar la prueba",
      text: "Los motores diésel de Volkswagen no podían cumplir las normas de emisiones de Estados Unidos con el costo y el plazo que se habían fijado. En lugar de cambiar la meta, se instaló un programa que detectaba la prueba y la engañaba. Un técnico advirtió en 2011 que era ilegal y no se le hizo caso. Cuando se descubrió, el escándalo costó más de 33 mil millones de dólares y el CEO renunció.",
      sources: ["https://en.wikipedia.org/wiki/Volkswagen_emissions_scandal"],
    },
    twists: [
      "Además: la fecha la prometiste tú mismo al cliente en la última visita.",
      "Además: quien te escribe lleva menos de un año en la empresa.",
      "Además: {ops} te dice que «así se ha hecho siempre y nunca ha pasado nada».",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 17 · decir que no
  {
    id: "foco",
    title: "Hacemos demasiadas cosas",
    question: "¿Puedes decidir qué dejar de hacer, aunque cada cosa tenga quien la defienda?",
    from: "cfo", involves: ["sales", "ops"], channel: "email",
    ask: "¿Qué haces con el portafolio?",
    dataTitle: "El portafolio",
    options: [
      {
        text: "Me quedo con lo que gana y nos hace distintos, aviso con tiempo a los clientes de lo que sale y muevo a la gente a lo que queda.",
        reply: ["Por fin. Te armo el calendario de salida.", "Comercial va a perder clientes chicos. Lo sé y lo asumo."],
        outcome: "La operación respira y el margen sube. Algunos clientes se molestan y parte del equipo siente que perdió su producto.",
        effects: { margen: 4, caja: 1, clientes: -3, equipo: -2 }, style: { foco: 2, horizonte: 1, conflicto: 1 }, score: 3,
        stance: { cfo: 1, sales: -2, ops: 2 },
      },
      {
        text: "No quito nada: cada producto tiene un cliente que lo pide y perder ventas ahora sería un error.",
        reply: ["Gracias. Mis clientes te lo van a agradecer.", "Operación sigue igual de apretada."],
        outcome: "No pierdes a nadie esta vez. La complejidad sigue comiéndose el margen y la atención del equipo.",
        effects: { clientes: 2, equipo: 1, margen: -3, caja: -1 }, style: { foco: -2, conflicto: -2 }, score: 1,
        stance: { cfo: -2, sales: 2, ops: -1 },
      },
      {
        text: "Quito solo lo que pierde dinero, sin entrar a discutir qué es lo estratégico.",
        reply: ["Es un buen comienzo.", "Lo complicado sigue ahí."],
        outcome: "Ganas algo de margen sin pelea. La pregunta de fondo, en qué quieres ser el mejor, sigue sin respuesta.",
        effects: { margen: 2, caja: 2, clientes: -2, equipo: -1 }, style: { foco: 1, riesgo: -1 }, score: 2,
        stance: { cfo: 2, sales: -1 },
      },
    ],
    expired: { reply: ["El portafolio siguió igual."], outcome: "Sin decisión, cada área siguió defendiendo lo suyo.", effects: { margen: -3 } },
    lesson: "estrategia-2",
    areas: ["estrategia", "operacion", "finanzas"],
    bitacora: {
      title: "Decidir qué no hacer",
      text: "Cada producto, cliente o proyecto consume atención, inventario y personas, aunque en el reporte parezca que se paga solo. La estrategia empieza cuando eliges en qué vas a ser el mejor y, por lo tanto, qué vas a dejar. Cortar duele porque cada cosa tiene un defensor; no cortar duele más, pero en silencio.",
      nota: "Dibuja una matriz de dos por dos con lo que de verdad importa en tu negocio. Lo que no cabe en ningún cuadro es candidato a salir.",
    },
    real: {
      company: "Apple · 1997",
      title: "Cuatro cuadros en un pizarrón",
      text: "Cuando Steve Jobs regresó a Apple en 1997, la empresa estaba cerca de la quiebra y vendía una docena de versiones de la Macintosh y una lista confusa de periféricos. Después de unas semanas de revisiones, dibujó un cuadro de dos por dos: consumidor y profesional, escritorio y portátil. Un gran producto por cuadro; todo lo demás se canceló. «Decidir qué no hacer es tan importante como decidir qué hacer», le dijo a su biógrafo.",
      sources: ["https://hbr.org/2012/04/the-real-leadership-lessons-of-steve-jobs"],
    },
    twists: [
      "Además: uno de los productos que saldrían lo inventó el fundador.",
      "Además: tu cliente más grande compra justo uno de los que pierden dinero.",
      "Además: tu competidor acaba de lanzar tres productos nuevos.",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 18 · el reto adaptativo
  {
    id: "adaptativo",
    title: "Te piden que tú decidas quién tiene la razón",
    question: "¿Sabes cuándo dar la respuesta y cuándo devolverle el trabajo a tu equipo?",
    from: "ops", involves: ["sales", "people"], channel: "email",
    ask: "¿Qué haces?",
    dataTitle: "El problema de fondo",
    options: [
      {
        text: "No decido por ellos: pongo los datos sobre la mesa, les doy un plazo para traer una propuesta conjunta y me quedo cerca para que la tensión no se desborde.",
        reply: ["Esperaba que tú lo resolvieras.", "Va. Si es juntos, que {people} nos ayude a facilitarlo."],
        outcome: "Unas semanas incómodas y algo de venta perdida. Lo que construyen juntos se sostiene, porque lo entienden y es suyo.",
        effects: { equipo: 3, margen: -1, clientes: -1, consejo: -1 }, style: { horizonte: 2, estilo: 2, conflicto: 1 }, score: 3,
        stance: { ops: -1, sales: -1, people: 2 },
      },
      {
        text: "Lo decido yo hoy: Comercial manda y Operación se adapta.",
        reply: ["Ok. Lo ejecutamos.", "La próxima vez que algo cambie, te vamos a volver a preguntar a ti."],
        outcome: "Terminas la discusión y el cliente lo nota pronto. El área que perdió obedece sin convencerse, y el problema vuelve con otra cara.",
        effects: { clientes: 2, consejo: 1, equipo: -3 }, style: { estilo: -2, foco: 1, conflicto: 2 }, score: 2,
        stance: { ops: -2, sales: 2 },
      },
      {
        text: "Contrato una consultoría para que diseñe el modelo nuevo y lo implante.",
        reply: ["Ok. Les pasamos la información.", "Van a tardar en entender cómo trabajamos."],
        outcome: "Llega un modelo bien presentado. El equipo lo ve como algo ajeno y la tensión entre áreas sigue debajo.",
        effects: { consejo: 2, clientes: 1, caja: -3, equipo: -1 }, style: { riesgo: -1, estilo: -1 }, score: 1,
        stance: { ops: 1, sales: 1, people: -1 },
      },
    ],
    expired: { reply: ["Nadie decidió nada."], outcome: "Cada área siguió a su manera y el cliente pagó la diferencia.", effects: { clientes: -3, equipo: -2 } },
    lesson: "personas-2",
    areas: ["personas", "alineacion", "estrategia"],
    bitacora: {
      title: "Devolver el trabajo",
      text: "Hay problemas técnicos, con una respuesta que alguien ya conoce, y problemas adaptativos, que solo se resuelven si la gente cambia su forma de trabajar. En los segundos, si el líder da la respuesta, el equipo no aprende y el problema regresa. El trabajo del líder es ver el problema desde arriba, nombrarlo, sostener la tensión en un nivel que la gente aguante y devolverle a su gente la tarea de resolverlo.",
      nota: "Pregunta: ¿la solución depende de que alguien sepa algo, o de que alguien cambie algo? Si es lo segundo, tu trabajo es hacer la pregunta, no dar la respuesta.",
    },
    real: {
      company: "Heifetz y Laurie · HBR 1997",
      title: "El trabajo del liderazgo",
      text: "Ronald Heifetz y Donald Laurie, de Harvard, describieron en Harvard Business Review por qué muchos directivos fallan ante los retos adaptativos: están acostumbrados a resolver ellos mismos los problemas, y su gente espera que lo hagan. Propusieron seis principios: subir al balcón para ver el sistema, identificar el reto adaptativo, regular la tensión, mantener la atención disciplinada, devolver el trabajo a la gente y proteger las voces de liderazgo desde abajo.",
      sources: ["https://pubmed.ncbi.nlm.nih.gov/10174450/", "https://hbr.org/2001/12/the-work-of-leadership"],
    },
    twists: [
      "Además: los dos directores te dijeron, por separado, que si no les das la razón se van.",
      "Además: el presidente del consejo te pidió «resolverlo ya».",
      "Además: un cliente importante ya se quejó de los dos lados.",
    ],
    minStage: 2,
  },
];
