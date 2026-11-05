/**
 * mêtis CEO · Banco de casos · decisiones propias de cada capítulo de la empresa.
 *
 * Las primeras 18 decisiones del banco son de estabilizar y ordenar. Estas diez son las que aparecen cuando la empresa
 * ya está estable y el trabajo del director cambia:
 *  - Construir capacidad: mandos y sucesión (mando, sucesor).
 *  - Acelerar con criterio: inversión y financiamiento del crecimiento (inversion, capital).
 *  - Escalar: otra región, alianzas y adquisiciones (region, alianza, adquisicion).
 *  - Gobernar la complejidad: regulador, prensa y deuda (regulador, prensa, deuda).
 * Mismas reglas que las demás: ninguna opción domina, toda opción cuesta algo, la postura solo toca a personas del
 * caso y cada una se ancla en un precedente real y documentado.
 */
import type { Archetype } from "./archetypes";

export const ARCHETYPES_CAP: readonly Archetype[] = [
  // ───────────────────────────────────────────────── capacidad · el mejor técnico como jefe
  {
    id: "mando",
    title: "Ascender al mejor técnico o traer un jefe de fuera",
    question: "¿Eliges a tus mandos por lo que saben hacer o por cómo hacen crecer a otros?",
    from: "people", involves: ["ops", "frontline"], channel: "email",
    ask: "¿Quién se queda con el puesto y cómo?",
    dataTitle: "El puesto y los candidatos",
    options: [
      {
        text: "Ascender a {frontline} con seis meses de acompañamiento, un mentor de otra área y metas de mando, no solo técnicas.",
        reply: ["Me parece bien, aunque me toca a mí sostener el acompañamiento.", "Le voy a pedir a {ops} que no lo jale a resolver fallas cada hora."],
        outcome: "El equipo ve que se puede crecer desde dentro. Los primeros meses cuestan: {frontline} aprende a dirigir y no a apagar fuegos.",
        effects: { equipo: 3, margen: -1, caja: -1 }, style: { horizonte: 2, estilo: 1 }, score: 3,
        stance: { frontline: 2, people: -1 },
      },
      {
        text: "Contratar a un jefe con experiencia de fuera y pedirle a {frontline} que lo apoye con su conocimiento técnico.",
        reply: ["Va, abro la búsqueda esta semana.", "{frontline} no dijo nada en la junta, pero se le notó."],
        outcome: "Llega alguien que ya sabe dirigir. El equipo lee que para mandar hay que venir de fuera, y {frontline} empieza a contestar llamadas de la competencia.",
        effects: { margen: 1, consejo: 1, equipo: -4 }, style: { riesgo: -1, horizonte: -1 }, score: 1,
        stance: { people: 2, frontline: -2 },
      },
      {
        text: "Ascenderlo hoy sin más apoyo: es el que más sabe, el equipo lo respeta y aprender a dirigir se aprende dirigiendo.",
        reply: ["Gracias, jefe. No le voy a fallar.", "Nomás que todavía me buscan para cada falla de la línea."],
        outcome: "El equipo celebra el ascenso. Sin formación, {frontline} hace el trabajo de todos, la operación depende de él y nadie más aprende.",
        effects: { equipo: 2, caja: 1, margen: -3 }, style: { riesgo: 1, horizonte: -1 }, score: 1,
        stance: { frontline: 1, ops: 2 },
      },
    ],
    expired: { reply: ["Sin decisión, {ops} dejó a {frontline} como encargado «mientras tanto»."], outcome: "Nadie sabe quién manda en el turno y la presión cae en el mejor técnico, sin título ni apoyo.", effects: { equipo: -3, margen: -1 } },
    lesson: "equipos-2",
    areas: ["personas", "cultura"],
    bitacora: {
      title: "El mejor técnico no siempre es el mejor jefe",
      text: "Ascender a quien mejor hace el trabajo es la decisión más común y la que más falla cuando no se acompaña: pierdes a tu mejor técnico y ganas a un jefe sin herramientas. Traer a alguien de fuera resuelve el puesto, pero le dice a todo el equipo que crecer aquí no es posible. Lo que construye capacidad es elegir por potencial para hacer crecer a otros y dar tiempo, formación y un mentor para el cambio de papel.",
      nota: "Antes de ascender, pregunta: ¿quién de su equipo ha mejorado gracias a esta persona? Si nadie, todavía no está lista para dirigir, aunque sea la que más sabe.",
    },
    real: {
      company: "Google · 2008",
      title: "El proyecto que demostró que los jefes sí importan",
      text: "Google creía que los jefes estorbaban a sus ingenieros y llegó a probar quitarlos. Su estudio interno (Project Oxygen) encontró lo contrario: los equipos con buenos jefes rendían más y tenían menos rotación. Lo que hacía bueno a un jefe no era su destreza técnica, que quedó al final de la lista, sino acompañar, no microgestionar y ayudar a crecer. Google empezó a formar a sus mandos con esas conductas.",
      sources: ["https://hbr.org/2013/12/how-google-sold-its-engineers-on-management"],
    },
    twists: [
      "Además: {frontline} ya dijo en confianza que, si el puesto es para alguien de fuera, se va.",
      "Además: el candidato externo viene de un competidor y pide 30% más que el puesto actual.",
      "Además: dos personas del equipo de {frontline} tienen más antigüedad y esperaban el puesto.",
    ],
    minStage: 2,
    maxStage: 3,
  },

  // ───────────────────────────────────────────────── capacidad · el relevo
  {
    id: "sucesor",
    title: "Quién sigue si mañana falta alguien clave",
    question: "¿Tu empresa depende de personas o de un sistema que forma a las siguientes?",
    from: "chair", involves: ["board", "people"], channel: "email",
    ask: "¿Qué propones al consejo sobre el relevo?",
    dataTitle: "Los puestos clave hoy",
    options: [
      {
        text: "Armar un relevo para los cinco puestos clave, con dos candidatos por puesto y su avance revisado en cada consejo.",
        reply: ["Es más trabajo del que pensaba pedirte.", "Pero así sí puedo defenderlo con la familia."],
        outcome: "El consejo tiene por primera vez un mapa de quién puede seguir a quién. Cuesta horas de dirección y unos meses de formación.",
        effects: { consejo: 3, equipo: 1, caja: -2, margen: -1 }, style: { horizonte: 2, estilo: 1 }, score: 3,
        stance: { board: 1, people: 2, chair: -1 },
      },
      {
        text: "Nombrar ya al candidato favorito del presidente como director adjunto: es capaz y tiene la confianza del consejo.",
        reply: ["Me da gusto. Es justo lo que te iba a sugerir.", "En el comité ya preguntan por qué él y no otro."],
        outcome: "El relevo queda resuelto en una tarde. El resto del comité entiende que el puesto se decidió por cercanía y dos directores bajan el ritmo.",
        effects: { consejo: 2, equipo: -3, margen: 1 }, style: { riesgo: 1, horizonte: -1 }, score: 1,
        stance: { chair: 2, people: -1 },
      },
      {
        text: "Dejar el tema para después: la empresa apenas se ordena y hablar de relevos ahora pondría nervioso a todo el comité.",
        reply: ["Entiendo, aunque no es lo que el consejo pidió.", "Lo vamos a volver a preguntar en la siguiente sesión."],
        outcome: "El comité trabaja tranquilo. El consejo anota que el riesgo de depender de dos o tres personas sigue sin atender.",
        effects: { equipo: 2, caja: 1, consejo: -4 }, style: { conflicto: -1, horizonte: -1 }, score: 0,
        stance: { board: -2, chair: -1 },
      },
    ],
    expired: { reply: ["El consejo no recibió propuesta y armó la suya."], outcome: "El relevo lo decide el consejo sin tu opinión: llega un nombre que tú no elegiste.", effects: { consejo: -3, equipo: -1 } },
    lesson: "consejo",
    areas: ["personas", "estrategia", "alineacion"],
    bitacora: {
      title: "El relevo se prepara cuando no hace falta",
      text: "Las empresas suelen pensar en la sucesión cuando alguien clave renuncia o se enferma, y entonces eligen al que está más cerca, no al mejor. Nombrar a un favorito resuelve rápido pero desmotiva al resto; posponer deja a la empresa colgada de pocas personas. Un relevo sano tiene más de un candidato por puesto, metas de desarrollo y una revisión periódica frente al consejo.",
      nota: "Escribe hoy los nombres de quién podría ocupar mañana cada puesto clave. Si en alguno no hay nombre, ese es tu riesgo más grande, aunque no aparezca en el estado de resultados.",
    },
    real: {
      company: "Disney · 2020-2022",
      title: "Un sucesor elegido sin transición",
      text: "En 2020 Disney nombró a Bob Chapek como director general en relevo de Bob Iger, con una transición corta y con Iger todavía en la empresa. Las tensiones internas y una caída fuerte de la acción llevaron al consejo a despedirlo en noviembre de 2022 y a traer de regreso a Iger, con el encargo explícito de preparar un sucesor con un proceso más ordenado.",
      sources: ["https://en.wikipedia.org/wiki/Bob_Chapek"],
    },
    twists: [
      "Además: el director de operaciones tuvo un susto de salud el mes pasado y nadie más conoce los contratos.",
      "Además: el fondo que es socio pide el plan por escrito antes de aprobar el presupuesto.",
      "Además: el candidato favorito es sobrino de un consejero.",
    ],
    minStage: 2,
    maxStage: 3,
  },

  // ───────────────────────────────────────────────── acelerar · una inversión grande
  {
    id: "inversion",
    title: "Una inversión grande de una sola vez",
    question: "¿Apuestas todo de golpe o compras información antes de comprometer el resto?",
    from: "ops", involves: ["cfo", "board"], channel: "email",
    ask: "¿Qué apruebas?",
    dataTitle: "La inversión propuesta",
    options: [
      {
        text: "Aprobar la primera fase con metas de arranque claras y liberar el resto solo si la fase uno cumple lo prometido.",
        reply: ["No es lo que pedí, pero lo puedo defender.", "Perdemos el descuento por comprar todo junto, eso sí."],
        outcome: "Arranca una parte con riesgo acotado. Pagas un poco más por no comprar todo junto y {ops} siente que le cortaste las alas.",
        effects: { margen: 2, caja: -2, equipo: -1 }, style: { riesgo: -1, horizonte: 1 }, score: 3,
        stance: { cfo: 2, ops: -1 },
      },
      {
        text: "Aprobar la inversión completa de una vez: comprarla junta sale 12% más barato y la competencia no nos va a esperar.",
        reply: ["Excelente. Hoy mismo firmo la orden.", "Le aviso a {cfo} que vamos a usar casi toda la línea de crédito."],
        outcome: "La capacidad crece de golpe. Si el arranque se complica, toda la caja quedó amarrada en un solo proyecto.",
        effects: { margen: 4, caja: -6, consejo: -1, clientes: 1 }, style: { riesgo: 2, horizonte: 1 }, score: 1,
        stance: { ops: 2, cfo: -2, board: -1 },
      },
      {
        text: "No invertir este año: cuidar la caja, exprimir la capacidad actual con horas extra y revisar el proyecto en un año.",
        reply: ["Entendido. Le aviso al equipo.", "Con las horas extra que traemos, la gente ya está cansada."],
        outcome: "La caja queda intacta. La operación sigue al límite, con horas extra y pedidos que se rechazan.",
        effects: { caja: 3, equipo: -3, clientes: -2 }, style: { riesgo: -2, horizonte: -1 }, score: 1,
        stance: { cfo: 1, ops: -2, board: 1 },
      },
    ],
    expired: { reply: ["Sin respuesta, el proveedor liberó la fecha de entrega a otro cliente."], outcome: "Ni inviertes ni ahorras: el proyecto se retrasa seis meses y el precio sube.", effects: { margen: -2, equipo: -1 } },
    lesson: "finanzas-2",
    areas: ["finanzas", "estrategia", "operacion"],
    bitacora: {
      title: "Compra información antes de comprar todo",
      text: "Las inversiones grandes fallan menos por la idea que por el arranque: la tecnología no se comporta como en la cotización, la gente tarda en aprender y la demanda llega más lenta. Invertir por fases cuesta algo más, pero cada fase te dice si la siguiente vale la pena. Invertir todo de golpe solo tiene sentido cuando ya hiciste algo parecido y sabes cómo se comporta.",
      nota: "Define antes de aprobar qué número tendría que dar la primera fase para liberar la segunda. Si no puedes escribirlo, todavía no sabes qué estás comprando.",
    },
    real: {
      company: "Tesla · 2018",
      title: "Demasiada automatización de una sola vez",
      text: "Para fabricar el Model 3, Tesla automatizó casi toda la línea desde el principio. La producción se atoró durante meses muy por debajo de la meta, y la empresa tuvo que quitar robots y montar una línea adicional bajo una carpa. Elon Musk lo reconoció en público: la automatización excesiva fue un error y los humanos estaban subestimados.",
      sources: ["https://en.wikipedia.org/wiki/Tesla_Model_3"],
    },
    twists: [
      "Además: el proveedor ofrece un 5% adicional si se firma este mes.",
      "Además: es una tecnología que nadie en la empresa ha operado antes.",
      "Además: el cliente que justificaba la capacidad todavía no firma el contrato de volumen.",
    ],
    minStage: 3,
    maxStage: 4,
  },

  // ───────────────────────────────────────────────── acelerar · con qué dinero crecer
  {
    id: "capital",
    title: "Con qué dinero crecer",
    question: "¿Cuánto control y cuánto riesgo estás dispuesto a dar a cambio de velocidad?",
    from: "cfo", involves: ["chair", "board"], channel: "email",
    ask: "¿Cómo financias el crecimiento?",
    dataTitle: "Las tres formas de financiarlo",
    options: [
      {
        text: "Crecer con la caja propia y una línea bancaria chica, y abrir capital solo cuando los números del año lo justifiquen.",
        reply: ["Me parece lo prudente. Te armo el flujo con ese ritmo.", "El presidente quería ir más rápido, te aviso."],
        outcome: "Creces a un ritmo que la caja aguanta y sin ceder control. Un competidor con más dinero te gana algunas plazas.",
        effects: { margen: 2, consejo: -1, clientes: -2 }, style: { riesgo: -1, horizonte: 1 }, score: 3,
        stance: { cfo: 2, chair: -1 },
      },
      {
        text: "Aceptar la oferta del fondo por una parte minoritaria: con ese dinero triplicamos el tamaño en dos años.",
        reply: ["Les aviso hoy, aunque me preocupa lo que piden a cambio.", "Nada más que van a pedir dos lugares en el consejo y metas trimestrales."],
        outcome: "Entra dinero de sobra para crecer. Con él llegan metas agresivas, dos consejeros nuevos y presión para gastar rápido.",
        effects: { clientes: 3, caja: 4, margen: -3, equipo: -2 }, style: { riesgo: 2, horizonte: -1 }, score: 1,
        stance: { chair: 2, cfo: -1, board: 1 },
      },
      {
        text: "Tomar un crédito grande a cinco años para crecer rápido sin ceder participación: la familia conserva el control.",
        reply: ["Se puede, el banco ya lo ofreció.", "Pero con ese crédito, un año malo nos deja sin margen para respirar."],
        outcome: "Creces rápido y la familia sigue siendo dueña. Los pagos fijos del crédito quitan margen de maniobra si un año sale mal.",
        effects: { clientes: 3, caja: 2, margen: -2, consejo: -3 }, style: { riesgo: 2, horizonte: 1 }, score: 1,
        stance: { chair: 1, board: -2, cfo: -1 },
      },
    ],
    expired: { reply: ["El fondo retiró la oferta y el banco congeló la línea mientras decides."], outcome: "Sin decisión, el crecimiento se detiene un trimestre por falta de dinero.", effects: { clientes: -2, consejo: -1 } },
    lesson: "finanzas",
    areas: ["finanzas", "estrategia"],
    bitacora: {
      title: "El dinero para crecer no es gratis en ninguna forma",
      text: "El capital de un fondo no se paga cada mes, pero se paga con control y con metas de crecimiento que empujan a gastar. La deuda conserva el control, pero sus pagos fijos convierten un año malo en una crisis. Crecer con caja propia es lento, pero te deja aprender en cada paso. La pregunta no es cuál es más barata, sino qué riesgo puede aguantar tu empresa si el plan sale peor de lo esperado.",
      nota: "Prueba tu plan con el peor año de los últimos diez. Si con ese año no puedes pagar ni cumplir las metas del socio, el dinero que estás tomando es demasiado o es del tipo equivocado.",
    },
    real: {
      company: "WeWork · 2019",
      title: "Crecer más rápido de lo que el negocio aguantaba",
      text: "WeWork recibió miles de millones de dólares de inversionistas, sobre todo de SoftBank, y abrió oficinas a una velocidad que sus ingresos no justificaban. Cuando intentó salir a bolsa en 2019, sus números y su gobierno corporativo espantaron al mercado: retiró la oferta, su fundador dejó la dirección y la valuación cayó de 47 mil millones a una fracción.",
      sources: ["https://en.wikipedia.org/wiki/WeWork"],
    },
    twists: [
      "Además: el fondo pide derecho de veto sobre el presupuesto anual.",
      "Además: las tasas de interés subieron dos puntos en el último año.",
      "Además: dos competidores acaban de recibir dinero de fondos y están abriendo en tus plazas.",
    ],
    minStage: 3,
    maxStage: 4,
  },

  // ───────────────────────────────────────────────── escalar · otra región
  {
    id: "region",
    title: "Abrir otra región",
    question: "¿Lo que funciona en casa funciona igual en otro lugar, o hay que aprenderlo de nuevo?",
    from: "sales", involves: ["ops", "cfo"], channel: "email",
    ask: "¿Cómo entras a la nueva región?",
    dataTitle: "La región que se abre",
    options: [
      {
        text: "Entrar con un solo sitio, un líder que conozca la región y el modelo adaptado a lo que piden ahí, antes de abrir más.",
        reply: ["Más lento de lo que quería, pero lo entiendo.", "Necesito que me dejen elegir al líder local."],
        outcome: "La región arranca chica. En unos meses sabes qué del modelo funciona allá y qué no, con poco dinero en riesgo.",
        effects: { clientes: 2, margen: -1, caja: -2 }, style: { riesgo: -1, horizonte: 2 }, score: 3,
        stance: { sales: -1, ops: 1, cfo: 1 },
      },
      {
        text: "Abrir cinco sitios a la vez con el mismo modelo de casa: lo que funciona aquí funciona allá, y la escala baja costos.",
        reply: ["¡Eso! Arranco con los cinco equipos.", "{cfo} ya me preguntó de dónde sale la caja para los cinco."],
        outcome: "Llegas con fuerza y presencia. Si la región se comporta distinto, el error se repite cinco veces al mismo tiempo.",
        effects: { clientes: 4, margen: -2, caja: -5, equipo: -1 }, style: { riesgo: 2, horizonte: -1 }, score: 1,
        stance: { sales: 2, cfo: -2 },
      },
      {
        text: "Entrar con un distribuidor local que ya tiene la red, cediendo margen y el trato directo con el cliente final.",
        reply: ["Es rápido, eso sí.", "Pero los clientes van a ser del distribuidor, no nuestros."],
        outcome: "Vendes en la región en semanas sin abrir sitios. El margen es menor y no aprendes cómo es el cliente de allá.",
        effects: { clientes: 2, caja: 1, margen: -3 }, style: { riesgo: -1, horizonte: -1 }, score: 2,
        stance: { sales: 1, ops: -1, cfo: 2 },
      },
    ],
    expired: { reply: ["Sin respuesta, el local que habíamos apartado se rentó a otro."], outcome: "La oportunidad de entrar se enfría y un competidor llega primero.", effects: { clientes: -2, equipo: -1 } },
    lesson: "estrategia-2",
    areas: ["estrategia", "operacion", "finanzas"],
    bitacora: {
      title: "Escalar es copiar lo que funciona y aprender lo que no",
      text: "Al abrir otra región, la tentación es copiar el modelo de casa a gran escala: si funcionó aquí, funcionará allá. Pero el cliente, la competencia, los costos y las costumbres cambian. Entrar con un primer sitio y un líder local cuesta tiempo y te enseña qué adaptar antes de multiplicar el error. Un distribuidor da velocidad, pero el aprendizaje se queda con él.",
      nota: "Antes de abrir el segundo sitio, escribe tres cosas que el primero te enseñó y que no sabías. Si no hay ninguna, no estás mirando con atención.",
    },
    real: {
      company: "Walmart en Alemania · 1997-2006",
      title: "El mismo modelo en otro país",
      text: "Walmart entró a Alemania comprando dos cadenas y llevó su modelo estadounidense casi sin cambios: saludadores en la puerta, empacadores, sonrisas obligatorias y horarios que no encajaban con la ley local. Los clientes y los empleados lo rechazaron, los competidores de descuento eran más baratos y en 2006 vendió sus 85 tiendas con pérdidas de alrededor de mil millones de dólares.",
      sources: ["https://en.wikipedia.org/wiki/History_of_Walmart"],
    },
    twists: [
      "Además: un competidor local ya está bajando precios en la región para recibirte.",
      "Además: el mejor candidato a líder local trabaja hoy para la competencia.",
      "Además: el gobierno de la región ofrece incentivos si abres al menos tres sitios este año.",
    ],
    minStage: 4,
    maxStage: 5,
  },

  // ───────────────────────────────────────────────── escalar · alianza con exclusividad
  {
    id: "alianza",
    title: "Una alianza que pide exclusividad",
    question: "¿Ganas alcance sin entregar tu libertad para elegir después?",
    from: "sales", involves: ["chair", "cfo"], channel: "email",
    ask: "¿Qué contestas a la propuesta de alianza?",
    dataTitle: "La propuesta del socio",
    options: [
      {
        text: "Firmar la alianza por dos años, sin exclusividad total, con metas para ambos y una salida clara si no se cumplen.",
        reply: ["Lo planteo así. No les va a encantar.", "Puede que ofrezcan menos volumen a cambio."],
        outcome: "El socio acepta con menos volumen del que ofrecía. Ganas alcance y conservas la puerta abierta a otros.",
        effects: { clientes: 2, caja: -1, margen: 1 }, style: { riesgo: -1, horizonte: 2, conflicto: 1 }, score: 3,
        stance: { sales: -1, cfo: 2, chair: 1 },
      },
      {
        text: "Firmar como la proponen, con exclusividad por cinco años: su red nos duplica las ventas y nadie más nos la ofrece.",
        reply: ["¡Hecho! Mañana les confirmo.", "Ojo: durante cinco años no podemos vender con nadie más en su canal."],
        outcome: "Las ventas crecen rápido. En cinco años, el socio será tu canal más grande y el que pone las condiciones.",
        effects: { clientes: 5, margen: -3, consejo: -1 }, style: { riesgo: 1, horizonte: -2 }, score: 1,
        stance: { sales: 2, cfo: -2 },
      },
      {
        text: "Rechazarla y seguir solos: una exclusividad así nos ata, y preferimos crecer más lento pero dueños del canal.",
        reply: ["Entendido. Les aviso con cuidado.", "Ellos van a ir con nuestro competidor, seguro."],
        outcome: "Conservas el control del canal. El socio firma con tu competidor y pierdes el alcance que ofrecía.",
        effects: { margen: 1, consejo: 1, clientes: -3 }, style: { riesgo: -1, conflicto: 1 }, score: 1,
        stance: { sales: -2, chair: -1 },
      },
    ],
    expired: { reply: ["El socio dio por hecho que no había interés."], outcome: "La propuesta se va con tu competidor sin que la negociaras.", effects: { clientes: -3 } },
    lesson: "negociacion-2",
    areas: ["negociacion", "estrategia", "clientes"],
    bitacora: {
      title: "La exclusividad es una puerta que se cierra",
      text: "Una alianza con alguien grande puede multiplicar tu alcance de un día para otro. La exclusividad larga es el precio escondido: te vuelve dependiente de un solo canal y le quita a tu empresa la opción de cambiar cuando el mercado cambie. Negociar plazos cortos, metas para ambos y una salida clara conserva el beneficio sin entregar tu libertad.",
      nota: "Antes de firmar, imagina el tercer año: el socio es tu canal más grande y te pide bajar precio. ¿Qué alternativa tendrías? Si la respuesta es ninguna, negocia la salida hoy.",
    },
    real: {
      company: "Nokia y Microsoft · 2011",
      title: "Atarse a un solo sistema",
      text: "En 2011 Nokia firmó una alianza para usar exclusivamente el sistema operativo Windows Phone de Microsoft en sus teléfonos inteligentes, a cambio de pagos y apoyo de mercadotecnia. Al cerrar la puerta a Android, quedó ligada a una plataforma que no despegó. Su participación de mercado se desplomó y en 2013 vendió su negocio de teléfonos a la propia Microsoft.",
      sources: ["https://en.wikipedia.org/wiki/Nokia"],
    },
    twists: [
      "Además: el socio pide además ver tus costos para «planear juntos».",
      "Además: tu competidor más fuerte ya está en pláticas con el mismo socio.",
      "Además: el socio ofrece un anticipo que resolvería la caja de este año.",
    ],
    minStage: 4,
    maxStage: 5,
  },

  // ───────────────────────────────────────────────── escalar · comprar a un competidor
  {
    id: "adquisicion",
    title: "Comprar a un competidor",
    question: "¿Compras porque suma o porque te emociona la oportunidad?",
    from: "chair", involves: ["cfo", "board"], channel: "email",
    ask: "¿Qué propones sobre la compra?",
    dataTitle: "La empresa en venta",
    options: [
      {
        text: "Ofrecer un precio con tope, revisar a fondo sus cuentas y clientes, y nombrar desde ya quién dirige la integración.",
        reply: ["Está bien, aunque temo que otro ofrezca más rápido.", "Te pido que la revisión no pase de seis semanas."],
        outcome: "La revisión encuentra dos clientes que se van y baja el precio. Si otro paga más, la pierdes sin haber pagado de más.",
        effects: { clientes: 2, caja: -3, consejo: 1 }, style: { riesgo: -1, horizonte: 2 }, score: 3,
        stance: { cfo: 2, chair: -1, board: 1 },
      },
      {
        text: "Pagar lo que piden y cerrar este mes: si no la compramos nosotros, la compra otro y perdemos la oportunidad.",
        reply: ["¡Así me gusta! Le aviso al dueño hoy.", "{cfo} quiere hablar contigo antes de que firmes."],
        outcome: "Cierras rápido y creces de golpe. Lo que no se revisó aparece después: contratos, deudas y clientes que ya se iban.",
        effects: { clientes: 4, caja: -6, consejo: 2, equipo: -1 }, style: { riesgo: 2, horizonte: -2 }, score: 1,
        stance: { chair: 2, cfo: -2 },
      },
      {
        text: "No comprar: integrar otra empresa nos distrae justo cuando la nuestra empieza a funcionar bien.",
        reply: ["No es lo que esperaba oír.", "Si la compra otro, quiero que quede claro que fue tu decisión."],
        outcome: "Tu equipo sigue enfocado y la caja intacta. Un competidor la compra y crece en tu mercado.",
        effects: { caja: 2, equipo: 1, clientes: -2, consejo: -2 }, style: { riesgo: -2, foco: 1 }, score: 2,
        stance: { chair: -2, board: -1 },
      },
    ],
    expired: { reply: ["El dueño firmó una carta de intención con otro comprador."], outcome: "La oportunidad se va sin que la evaluaras.", effects: { consejo: -2, clientes: -1 } },
    lesson: "estrategia",
    areas: ["estrategia", "finanzas", "negociacion"],
    bitacora: {
      title: "En una compra, la prisa la paga el comprador",
      text: "Comprar a un competidor promete crecer de golpe, pero la mayoría de las adquisiciones no crea el valor prometido: se paga de más por la emoción, se revisa poco por la prisa y nadie es responsable de la integración. Fijar un precio tope antes de negociar, revisar clientes y contratos a fondo y nombrar al responsable de integrar desde el primer día separan una buena compra de una costosa.",
      nota: "Escribe tu precio máximo antes de la primera reunión y no lo cambies sin un dato nuevo. Si el vendedor te apura, es una razón más para revisar.",
    },
    real: {
      company: "Quaker Oats y Snapple · 1994-1997",
      title: "Pagar de más por una marca que no se entendía",
      text: "Quaker Oats compró Snapple en 1994 por 1,700 millones de dólares, convencida de que podría manejarla como su bebida Gatorade. La distribución y la marca funcionaban distinto, la integración fracasó y las ventas cayeron. Tres años después vendió Snapple por unos 300 millones, y la operación terminó costando también el puesto a su director general.",
      sources: ["https://en.wikipedia.org/wiki/Snapple"],
    },
    twists: [
      "Además: el dueño pide quedarse tres años como director de la empresa comprada.",
      "Además: la mitad de su venta está en un solo cliente que también es tuyo.",
      "Además: el banco ofrece financiar el 80% de la compra con garantía de tu empresa.",
    ],
    minStage: 4,
    maxStage: 5,
  },

  // ───────────────────────────────────────────────── gobernar · el regulador
  {
    id: "regulador",
    title: "La autoridad encuentra una falla",
    question: "¿Tratas al regulador como un rival de una vez o como alguien con quien vas a convivir años?",
    from: "ops", involves: ["board", "cfo"], channel: "email",
    ask: "¿Cómo respondes a la autoridad?",
    dataTitle: "La observación de la autoridad",
    options: [
      {
        text: "Admitir la falla, entregar la corrección calendarizada y revisar por nuestra cuenta si hay más casos parecidos.",
        reply: ["Va. Armo el calendario con Jurídico.", "Si revisamos de más, puede salir algo que nadie pidió."],
        outcome: "La autoridad baja la multa por la cooperación y te pide un informe al cerrar. La revisión interna encuentra otra falla menor que corriges antes de que nadie la vea.",
        effects: { consejo: 2, clientes: 1, caja: -3, margen: -1 }, style: { horizonte: 2, riesgo: -1 }, score: 3,
        stance: { ops: 1, board: 1, cfo: -1 },
      },
      {
        text: "Impugnar la observación con los abogados: el criterio es discutible y aceptar la falla abre la puerta a más multas.",
        reply: ["Los abogados dicen que hay argumentos.", "El proceso puede tardar un año y la autoridad no lo olvida."],
        outcome: "Ganas tiempo y no pagas por ahora. La relación con la autoridad se vuelve de pleito y la próxima inspección llega antes.",
        effects: { caja: 1, margen: 1, consejo: -2, clientes: -2 }, style: { conflicto: 2, horizonte: -1 }, score: 1,
        stance: { cfo: 1, board: -2 },
      },
      {
        text: "Corregir solo lo que señaló la inspección, pagar la multa rápido y no abrir otros temas con la autoridad.",
        reply: ["Rápido y sin ruido, entendido.", "Lo que no revisemos sigue igual, eso sí."],
        outcome: "El tema se cierra en semanas. Si hay otras fallas parecidas, siguen ahí esperando la siguiente inspección.",
        effects: { caja: -1, consejo: 1, margen: 1, equipo: -1 }, style: { riesgo: 1, horizonte: -1 }, score: 1,
        stance: { ops: -1, cfo: 2 },
      },
    ],
    expired: { reply: ["Venció el plazo para responder a la autoridad."], outcome: "La autoridad resolvió sin tu respuesta: multa completa y una visita de seguimiento.", effects: { caja: -3, consejo: -2 } },
    lesson: "crisis",
    areas: ["etica", "operacion", "comunicacion"],
    bitacora: {
      title: "Con el regulador, el juego se repite",
      text: "La autoridad no es un rival de una sola vez: la vas a ver en cada inspección durante años. Pelear cada observación puede ganar una batalla y perder la relación; corregir lo mínimo cierra el tema pero deja vivas las fallas parecidas. Reconocer, corregir con calendario y revisar por tu cuenta construye la reputación que hace que la siguiente visita sea más corta.",
      nota: "Pregúntate: si la autoridad revisara mañana todo lo demás, ¿qué encontraría? Lo que encuentres tú primero cuesta mucho menos que lo que encuentre ella.",
    },
    real: {
      company: "Boeing · 2019",
      title: "Lo que no se le dijo al regulador",
      text: "Tras dos accidentes del 737 MAX en 2018 y 2019, las investigaciones revelaron que Boeing no había explicado bien al regulador ni a los pilotos un sistema automático de control. Los aviones quedaron en tierra en todo el mundo durante casi dos años, Boeing pagó más de 2,500 millones de dólares en un acuerdo con el gobierno de Estados Unidos y la confianza en su relación con la autoridad quedó dañada.",
      sources: ["https://en.wikipedia.org/wiki/Boeing_737_MAX_groundings"],
    },
    twists: [
      "Además: un consejero conoce al titular de la autoridad y ofrece «arreglarlo con una llamada».",
      "Además: la falla ya había salido en una auditoría interna hace un año y no se corrigió.",
      "Además: un cliente grande pide ver la respuesta antes de renovar su contrato.",
    ],
    minStage: 5,
    maxStage: 5,
  },

  // ───────────────────────────────────────────────── gobernar · el reportaje
  {
    id: "prensa",
    title: "Un reportaje que te deja mal",
    question: "¿Das la cara cuando la historia no te favorece del todo?",
    from: "people", involves: ["chair", "frontline"], channel: "email",
    ask: "¿Qué le contestas al periodista?",
    dataTitle: "Lo que va a publicar",
    options: [
      {
        text: "Dar la cara: contestar con las cifras que tenemos, admitir lo que sí falló y decir qué cambia, aunque no todo nos favorezca.",
        reply: ["Va. Te preparo la respuesta y la revisamos juntos.", "Al presidente no le va a gustar que admitamos algo."],
        outcome: "La nota sale con tu versión y lo que ya corregiste. Duele un día; la siguiente pregunta del medio te llega a ti primero.",
        effects: { clientes: 2, equipo: 2, consejo: -2, margen: -1 }, style: { conflicto: 1, horizonte: 2 }, score: 3,
        stance: { people: 1, chair: -1, frontline: 1 },
      },
      {
        text: "No dar declaraciones y que los abogados revisen la nota: cualquier cosa que digamos se puede usar en contra.",
        reply: ["Entendido. Le contesto que no hay comentarios.", "La gente del piso va a leer la nota sin nuestra versión."],
        outcome: "La nota sale solo con la versión de quienes se quejan. El equipo la lee y nadie de la dirección dijo nada.",
        effects: { caja: 1, consejo: 1, equipo: -2, clientes: -3 }, style: { conflicto: -1, riesgo: -1 }, score: 1,
        stance: { chair: 1, frontline: -2 },
      },
      {
        text: "Pedir a una agencia una respuesta cuidada que destaque lo positivo de la empresa sin entrar en lo que falló.",
        reply: ["La agencia la tiene mañana.", "El periodista ya preguntó por lo concreto, no por lo positivo."],
        outcome: "La respuesta se publica y suena a comunicado. Los lectores notan que no contesta lo que se preguntó.",
        effects: { clientes: 1, consejo: 1, equipo: -2, caja: -1 }, style: { conflicto: -1 }, score: 1,
        stance: { people: -1, chair: 2 },
      },
    ],
    expired: { reply: ["El reportaje salió con la frase «la empresa no respondió»."], outcome: "La nota sale sin tu versión y circula en redes.", effects: { clientes: -3, equipo: -1 } },
    lesson: "comunicacion-2",
    areas: ["comunicacion", "etica", "clientes"],
    bitacora: {
      title: "Si no cuentas tu historia, la cuenta otro",
      text: "Cuando un medio va a publicar algo que te deja mal, el silencio no evita la nota: solo asegura que salga sin tu versión. Una respuesta de agencia que no contesta lo que se preguntó suena a que escondes algo. Dar la cara con cifras, admitir lo que falló y decir qué cambia no hace que la nota sea buena, pero hace que la siguiente sea más justa y que tu gente vea a una dirección que no se esconde.",
      nota: "Escribe tu respuesta como si la fuera a leer la persona de tu empresa más afectada por el tema. Si a ella le suena falsa, al lector también.",
    },
    real: {
      company: "United Airlines · 2017",
      title: "La primera respuesta empeoró la crisis",
      text: "En abril de 2017 un pasajero fue sacado a la fuerza de un vuelo de United y el video se volvió viral. La primera declaración del director general habló de «reacomodar» a pasajeros y defendió a los empleados, lo que encendió aún más la indignación. Días después pidió perdón sin reservas, pero la acción ya había perdido valor y el caso se volvió ejemplo de mala comunicación de crisis.",
      sources: ["https://en.wikipedia.org/wiki/United_Express_Flight_3411_incident"],
    },
    twists: [
      "Además: el periodista tiene un audio de un supervisor que confirma parte de la historia.",
      "Además: un consejero pide que se llame al dueño del medio para frenar la nota.",
      "Además: la nota sale el mismo día que presentas resultados al consejo.",
    ],
    minStage: 5,
    maxStage: 5,
  },

  // ───────────────────────────────────────────────── gobernar · la deuda
  {
    id: "deuda",
    title: "El crédito está por romper una condición",
    question: "¿Le dices al banco la verdad antes de que la vea solo?",
    from: "cfo", involves: ["board", "chair"], channel: "email",
    ask: "¿Qué haces con el banco?",
    dataTitle: "El crédito y sus condiciones",
    options: [
      {
        text: "Llamar hoy al banco, mostrarle el número real y negociar una dispensa a cambio de pagar antes una parte del crédito.",
        reply: ["Va, lo llamo hoy. No va a ser una llamada cómoda.", "Lo que paguemos antes sale de la caja del trimestre."],
        outcome: "El banco agradece el aviso y concede la dispensa con una comisión y un pago anticipado. La caja queda más apretada pero la relación intacta.",
        effects: { consejo: 2, caja: -2, margen: -1 }, style: { horizonte: 2, conflicto: 1 }, score: 3,
        stance: { cfo: 1, board: 1, chair: -1 },
      },
      {
        text: "Retrasar pagos a proveedores dos semanas para que la caja se vea mejor al corte y no despertar al banco.",
        reply: ["Se puede hacer, técnicamente.", "Los proveedores grandes ya notaron los retrasos del mes pasado."],
        outcome: "El corte pasa sin alarma. Los proveedores empiezan a pedir pago anticipado y el problema regresa el siguiente trimestre, más grande.",
        effects: { caja: 3, clientes: -1, consejo: -2, equipo: -1 }, style: { riesgo: 2, horizonte: -2 }, score: 0,
        stance: { chair: 1, cfo: -2 },
      },
      {
        text: "Vender rápido un terreno o equipo que no usamos para bajar la deuda, aunque sea por debajo de su valor.",
        reply: ["Hay un comprador para el terreno, pero ofrece 25% menos.", "Con eso pasamos el corte con holgura."],
        outcome: "La deuda baja y el corte pasa. Vendiste barato un activo que no tenía prisa y el problema de fondo sigue.",
        effects: { caja: 2, margen: -2, consejo: 1 }, style: { riesgo: -1, horizonte: -1 }, score: 2,
        stance: { cfo: 2, board: -1 },
      },
    ],
    expired: { reply: ["El banco detectó el incumplimiento en el reporte trimestral."], outcome: "El banco se entera por su cuenta: sube la tasa y pide garantías adicionales.", effects: { caja: -3, consejo: -3 } },
    lesson: "finanzas-2",
    areas: ["finanzas", "etica", "negociacion"],
    bitacora: {
      title: "Al banco le preocupa más la sorpresa que el número",
      text: "Un crédito trae condiciones: cuánta deuda puedes tener frente a lo que generas, cuánta caja mínima, qué no puedes vender. Romper una condición no es el fin si avisas antes: el banco prefiere renegociar con quien le dice la verdad que descubrir un problema escondido. Maquillar el corte con pagos atrasados traslada el problema a tus proveedores y lo agranda.",
      nota: "Ten a la mano, cada mes, qué tan cerca estás de cada condición de tus créditos. Si te acercas a una, llama tú primero.",
    },
    real: {
      company: "Toys \"R\" Us · 2005-2018",
      title: "Una deuda que no dejó invertir",
      text: "En 2005, tres fondos compraron Toys \"R\" Us con una compra apalancada que le dejó a la empresa alrededor de 5,000 millones de dólares de deuda. Durante años, cientos de millones al año se fueron a intereses en lugar de tiendas y comercio electrónico. En 2017 se declaró en quiebra y en 2018 cerró sus tiendas en Estados Unidos.",
      sources: ["https://en.wikipedia.org/wiki/Toys_%22R%22_Us"],
    },
    twists: [
      "Además: el presidente pide no avisar al banco hasta después de la asamblea de accionistas.",
      "Además: otro banco ofrece refinanciar todo a una tasa más alta pero sin condiciones.",
      "Además: el auditor externo ya preguntó por la condición en su revisión preliminar.",
    ],
    minStage: 5,
    maxStage: 5,
  },
];
