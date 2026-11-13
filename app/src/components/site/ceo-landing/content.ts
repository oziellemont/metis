/**
 * Landing de MÊTIS CEO (www.metis.ceo) · todo el copy en español y los datos de las demos en un solo lugar.
 * La versión en inglés vive en content-en.ts con la misma forma (tipo Copy); la página elige con copyFor().
 *
 * Regla: aquí solo va lo que el producto hace hoy. Nada de «próximamente» ni de promesas a futuro:
 * lo que no existe, no se menciona (ver AVAILABILITY, solo para auditoría interna). La demo es ilustrativa: no toca el motor, la partida ni la cuenta del visitante.
 */

/* ---------------- Estado real del producto (auditoría jul-2026) ---------------- */
export type Availability = "hoy" | "preparacion" | "futuro";
export const AVAILABILITY: { item: string; state: Availability; note: string }[] = [
  { item: "Empresas simuladas", state: "hoy", note: "Botanas Cumbre, Forja del Norte y Brasa" },
  { item: "Asuntos diarios", state: "hoy", note: "Llegan dentro del horario que eliges; modo intensivo opcional" },
  { item: "Decisiones que persisten", state: "hoy", note: "Indicadores, relaciones y estilo se acumulan durante la temporada" },
  { item: "Personajes que recuerdan", state: "hoy", note: "Postura de cada persona según lo que decidiste antes" },
  { item: "Bitácora y Nota CEO", state: "hoy", note: "Explicación al cerrar cada caso" },
  { item: "mêtis Academy", state: "hoy", note: "Lecciones breves" },
  { item: "Seis capítulos de la empresa", state: "hoy", note: "Describen el momento de la empresa (career/stages.ts); no son rangos del jugador. Empiezas como Director General" },
  { item: "Trayectoria del mandato", state: "hoy", note: "Revisiones del consejo, hitos, decisiones que marcaron y compromisos abiertos (trajectory.ts)" },
  { item: "Ranking", state: "preparacion", note: "Oculto en la app; la página existe pero no se enlaza ni se menciona" },
  { item: "Perfil profesional y orden «Para ti»", state: "hoy", note: "V33" },
  { item: "Avisos por correo", state: "hoy", note: "Si conectas tu correo y lo activas" },
  { item: "Respuestas escritas con retroalimentación", state: "preparacion", note: "Vista previa apagada por defecto" },
  { item: "Junta ante el Consejo", state: "hoy", note: "Tres momentos encadenados; sesión extraordinaria del consejo (/ceo/junta)" },
  { item: "Boardroom Crisis", state: "hoy", note: "Sesión extraordinaria con 3 decisiones con reloj, una por empresa desde el día 3 (/ceo/crisis)" },
  { item: "Conversaciones abiertas con personajes", state: "futuro", note: "No construido" },
  { item: "Escenarios generados", state: "futuro", note: "No construido" },
  { item: "Retos entre jugadores", state: "futuro", note: "No construido; no se menciona" },
  { item: "Suscripción y cobro", state: "futuro", note: "No hay checkout ni cancelación; el precio no se publica" },
];

/* ---------------- SEO ---------------- */
export const SEO = {
  title: "MÊTIS CEO | Aprende a dirigir tomando decisiones",
  description: "Practica cómo dirigir una empresa. Resuelve situaciones de negocio, toma decisiones y descubre cómo afectan a los resultados y a las personas, unos minutos al día.",
  ogAlt: "MÊTIS CEO. Dirigir se aprende decidiendo.",
  locale: "es_MX",
};

/* ---------------- Navegación ---------------- */
export const NAV: { href: string; label: string }[] = [
  { href: "#como", label: "Cómo funciona" },
  { href: "#academy", label: "Academy" },
  { href: "#camino", label: "Tu carrera" },
];
export const LOGIN_HREF = "/entrar";
export const START_HREF = "/ceo/empezar";
/** La única acción principal de la landing: el mismo texto y el mismo destino en encabezado, primer bloque y cierre. */
export const CTA = "Comenzar gratis";
/** Rutas de cada idioma (en metis.ceo, «/» es la landing en español y «/en» la versión en inglés). */
export const LANG_HREF = { es: "/", en: "/en" } as const;
export type Lang = keyof typeof LANG_HREF;

/** Textos de la interfaz que no son titulares (accesibilidad, menú, pie). */
export const UI = {
  skip: "Saltar al contenido",
  home: "MÊTIS CEO, inicio",
  mainNav: "Principal",
  login: "Iniciar sesión",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  /** Selector de idioma: lleva a la otra versión. */
  switchLabel: "Read in English",
  switchShort: "EN",
  howEyebrow: "Cómo funciona",
  stage: "Capítulo",
  stagesLabel: "Capítulos de la empresa",
  faqTitle: "Preguntas frecuentes",
  haveAccount: "¿Ya tienes cuenta?",
  signIn: "Inicia sesión",
  footerNav: "Pie de página",
  privacy: "Aviso de privacidad",
  terms: "Términos",
  playing: "Seguir mi carrera",
};

/* ---------------- Primer bloque: qué es mêtis, con un caso real al lado ---------------- */
export const HERO = {
  eyebrow: "Simulador de dirección",
  title: "Piensa y decide como CEO. Unos minutos al día.",
  body: "Vive los retos de un CEO: recibe mensajes de tu equipo, resuelve situaciones de negocio y aprende de sus consecuencias para desarrollar tu criterio como líder.",
  motto: "Dirigir se aprende decidiendo.",
  note: "Sin tarjeta.",
};

/* ---------------- El caso del primer bloque (Ana, día 2 de Botanas Cumbre) ---------------- */
/** Copia fiel de lib/ceo/companies/cumbre-items.ts (d2-ana); las pruebas revisan que coincida. Es de los casos más cortos del juego. */
export interface CaseOption { id: string; text: string; reply: string[]; outcome: string; effects: [string, number][] }
export const CASE = {
  label: "Un caso del simulador",
  steps: ["El caso", "Contexto", "Decides", "Resultado", "Aprendes"],
  stepOf: "Paso {n} de {t}",
  received: "Te llegó un asunto",
  from: { name: "Ana Martínez", initials: "AM", role: "Analista de Planeación Comercial", tone: "#5B4BE8", time: "8:40" },
  kind: "reporte" as "correo" | "reporte",
  channel: "Reporte",
  subject: "Pronóstico Q1 · versión final (22 láminas)",
  to: "Para: Director General <direccion@botanascumbre.mx>",
  body: [
    "Buen día, Director:",
    "Le comparto el pronóstico de ventas del Q1 que me pidió para la junta con el consejo. Incluí todo el detalle por SKU, canal, región y mes, y 6 escenarios de precio.",
    "Me desvelé un poco, pero quería que tuviera toda la información.",
    "Quedo atenta a sus comentarios.\nAna",
  ],
  context: {
    eyebrow: "Antes de decidir",
    title: "Lo que necesitas saber",
    text: "Los datos del asunto y quién está en juego. Tómate tu tiempo.",
    data: {
      title: "Lo que ves al abrir el archivo",
      rows: [["Láminas", "22"], ["Tablas", "17 (letra de 8 puntos)"], ["Conclusión o recomendación", "— ninguna —"], ["Lámina 19 de 22", "«Las papas premium crecen 28% y la línea tradicional cae 6%» (enterrado en una tabla)"]] as [string, string][],
      note: "La junta con el consejo es en 9 días.",
    },
  },
  decide: { eyebrow: "Tu decisión", ask: "Ana trabajó mucho, pero no te sirve así. ¿Qué haces?", cta: "Tomar la decisión" },
  options: [
    { id: "a", text: "Responderle rápido y claro: «Ana, así no sirve para un consejo. Necesito 3 láminas con conclusión. Para mañana.»", reply: ["Entendido, Director.", "Disculpe."], outcome: "Mañana tendrás 3 láminas. También tendrás a una analista que ya no se va a desvelar por ti.", effects: [["Consejo", 3], ["Equipo", -4]] },
    { id: "b", text: "Sentarme 20 minutos con ella: enseñarle a empezar por el final, por lo que el consejo debe decidir, y pedirle una página.", reply: ["Muchas gracias por el tiempo, Director. Nunca nadie me había explicado lo de «empezar por el final».", "Ya vi que lo importante estaba en la lámina 19. Le mando una página el jueves. ¿Puedo proponer qué hacer con la línea tradicional?"], outcome: "Inviertes 20 minutos y ganas a alguien que el próximo trimestre ya no te va a necesitar para esto. La versión para el consejo llega hasta el jueves.", effects: [["Equipo", 5], ["Consejo", -1]] },
    { id: "c", text: "Agradecerle y armar yo mismo la presentación esta noche. Es más rápido y el consejo no puede esperar otra versión.", reply: ["¡Qué bueno que le sirvió!"], outcome: "La presentación queda bien. Ana nunca se entera de lo que faltaba y tú acabas de comprarte trabajo para cada trimestre.", effects: [["Consejo", 2], ["Equipo", -1]] },
  ] as CaseOption[],
  result: { decided: "Decidiste", what: "Qué pasó en Botanas Cumbre" },
  learn: {
    eyebrow: "Bitácora del CEO",
    title: "Empieza con el final",
    text: "Ana tenía la gran idea (premium +28%, tradicional −6%) en la lámina 19. Las presentaciones ejecutivas empiezan con el big picture y una recomendación. Y enseñar eso es más valioso que corregirlo.",
    notaLabel: "Nota CEO:",
    nota: "Una presentación no debe demostrar que trabajaste mucho; debe hacer que la audiencia entienda rápido y actúe mejor.",
    lessonLabel: "Aprende la teoría:",
    lesson: "Comunicación ejecutiva · 5 min",
  },
  nav: { back: "Atrás", next: ["Ver el contexto", "Decidir", "", "Lo que aprendes"], again: "Elegir otra respuesta" },
  note: "Caso del día 2 en Botanas Cumbre, tal cual aparece en el simulador. Esta muestra no guarda nada.",
};

/* ---------------- Cómo funciona: tres pasos y una secuencia de tres pantallas ---------------- */
export interface TodayItem { initials: string; tone: string; name: string; channel: "email" | "whatsapp" | "reporte"; text: string; due: string }
export const HOW = {
  title: "¿Y si aprender a dirigir se sintiera como dirigir de verdad?",
  body: "En MÊTIS te sumerges en una empresa que cobra vida con cada correo, WhatsApp o llamada. Toma decisiones, descubre sus consecuencias, gana experiencia y desbloquea nuevos retos mientras desarrollas tu criterio como líder. ¡Todo en unos minutos al día!",
  steps: [
    { n: "01", t: "Recibes una situación", d: "Un cliente reclama, tu equipo necesita una respuesta o el presupuesto no alcanza. Te puede llegar en cualquier momento del día." },
    { n: "02", t: "Tomas una decisión", d: "Revisas el contexto, eliges un camino y asumes sus consecuencias. No siempre tendrás toda la información." },
    { n: "03", t: "Aprendes de lo que ocurre", d: "Ves cómo reaccionan las personas, qué cambia en el negocio y qué podrías considerar la próxima vez." },
  ],
  slides: {
    label: "Así llega y así se resuelve un asunto",
    tabs: ["Llega el correo", "Lo ves en Hoy", "Ya decidiste"],
    channel: { email: "Correo", whatsapp: "WhatsApp", reporte: "Reporte" },
    inbox: {
      app: "Recibidos",
      fromLine: "Sofía Leal · Botanas Cumbre",
      time: "9:14",
      preview: "Para mantener sus dos frentes de anaquel necesitamos 4 puntos adicionales de descuento y pasar a 90 días…",
      decision: "Tu decisión",
      button: "Responder",
      deadline: "Responde en las próximas 24 h",
    },
    today: {
      top: "Hoy · Día 2 en Botanas Cumbre",
      title: "Esperando tu decisión",
      inbox: "Bandeja",
      items: [
        { initials: "SL", tone: "#171A3A", name: "Sofía Leal", channel: "email", text: "Condiciones comerciales 2027 · Botanas Cumbre", due: "Vence en 23 h" },
        { initials: "AM", tone: "#5B4BE8", name: "Ana Martínez", channel: "reporte", text: "Pronóstico Q1 · versión final (22 láminas)", due: "Vence en 23 h" },
        { initials: "HS", tone: "#3A2DB8", name: "Héctor Salinas", channel: "whatsapp", text: "Me enteré de lo de SuperNorte. A Sofía la conozco desde que era practicante…", due: "Vence en 11 h" },
      ] as TodayItem[],
    },
    done: {
      status: "Asunto resuelto",
      option: "b",
      left: "Te quedan 2 asuntos por hoy.",
    },
    pause: "Pausar la secuencia",
    play: "Reproducir la secuencia",
    caption: "Ejemplo con el caso SuperNorte de Botanas Cumbre.",
  },
};

/** Las tres pantallas de «Practica con casos que evolucionan» cambian cada 7 s. */
export const HOW_INTERVAL_MS = 7000;

/* ---------------- mêtis Academy: los módulos (copia de TRACKS en lib/ceo/lessons.ts; las pruebas lo revisan) ---------------- */
export type AcademyIcon = "compass" | "users" | "flag" | "message" | "handshake" | "coins" | "flame" | "rocket" | "target" | "layers";
export const ACADEMY = {
  eyebrow: "mêtis Academy",
  title: "Aprende la teoría detrás de cada decisión.",
  body: "Cada caso te deja un aprendizaje y lo refuerzas con lecciones cortas e interactivas: 13 módulos y 25 lecciones de 4 a 5 minutos. Los casos y marcos se inspiran en programas MBA, escuelas de negocio y libros de dirección.",
  listLabel: "Módulos de mêtis Academy",
  link: { t: "De cada caso a su lección", d: "Al terminar un caso, la bitácora te dice qué aprendiste y te lleva a la lección que explica por qué pasó lo que pasó." },
  lesson: "lección",
  lessons: "lecciones",
  modules: [
    { id: "mentalidad", title: "Mentalidad del CEO", icon: "flag", blurb: "Cómo piensa quien carga la responsabilidad.", n: 2 },
    { id: "personas", title: "Liderar personas", icon: "users", blurb: "Cada persona necesita algo distinto de ti.", n: 3 },
    { id: "conversaciones", title: "Conversaciones", icon: "message", blurb: "Decir lo difícil para que se escuche.", n: 2 },
    { id: "equipos", title: "Equipos", icon: "layers", blurb: "Confianza, conflicto útil y compromiso.", n: 2 },
    { id: "alineacion", title: "Alineación", icon: "compass", blurb: "De la estrategia a lo que cada quien hace el lunes.", n: 2 },
    { id: "negociacion", title: "Negociación", icon: "handshake", blurb: "Intereses, alternativas y relaciones que duran.", n: 2 },
    { id: "comunicacion", title: "Comunicación", icon: "message", blurb: "Empezar por el final y dar malas noticias.", n: 2 },
    { id: "cultura", title: "Cultura y ética", icon: "flame", blurb: "Lo que toleras es tu verdadero código.", n: 2 },
    { id: "finanzas", title: "Finanzas", icon: "coins", blurb: "Asignar capital y no quedarte sin caja.", n: 2 },
    { id: "innovacion", title: "Innovación", icon: "rocket", blurb: "Apostar barato, aprender rápido, cerrar a tiempo.", n: 2 },
    { id: "estrategia", title: "Estrategia", icon: "target", blurb: "Elegir, y tener el carácter de decir que no.", n: 2 },
    { id: "crisis", title: "Crisis", icon: "flame", blurb: "Personas primero, hechos después, una sola voz.", n: 1 },
    { id: "consejo", title: "Gobierno y consejo", icon: "compass", blurb: "Sin sorpresas, con opciones.", n: 1 },
  ] as { id: string; title: string; icon: AcademyIcon; blurb: string; n: number }[],
};

/* ---------------- Camino profesional (ruta visual) ---------------- */
/** «inicio» marca dónde arranca toda empresa; el resto son capítulos posibles, sin candados ni rangos. */
export type StageState = "inicio" | "capitulo";
export const PATH = {
  eyebrow: "Tu carrera",
  title: "Una carrera que crece contigo.",
  body: "Desde el primer día eres el Director General de una empresa que ya existe, con su historia, su equipo y su consejo. Cada caso te deja un aprendizaje: entiendes por qué pasó lo que pasó y refuerzas la teoría en mêtis Academy. Lo que cambia es la empresa: según lo que decides, se estabiliza, construye capacidad, acelera o atraviesa una crisis y se recupera.",
  stateLabel: { inicio: "Aquí empiezas", capitulo: "Capítulo posible" } as Record<StageState, string>,
  stages: [
    { n: "01", name: "Tomar el mando", learn: "Entender lo que heredas y priorizar", state: "inicio" },
    { n: "02", name: "Estabilizar", learn: "Caja, servicio, costos y ejecución", state: "capitulo" },
    { n: "03", name: "Construir capacidad", learn: "Mandos, procesos y talento", state: "capitulo" },
    { n: "04", name: "Acelerar con criterio", learn: "Dónde invertir y dónde no", state: "capitulo" },
    { n: "05", name: "Escalar", learn: "Varias áreas, regiones o alianzas", state: "capitulo" },
    { n: "06", name: "Gobernar la complejidad", learn: "Más exposición y riesgos de mayor alcance", state: "capitulo" },
  ] as { n: string; name: string; learn: string; state: StageState }[],
};

/* ---------------- FAQ ---------------- */
export const FAQ: { q: string; a: string }[] = [
  { q: "¿Necesito experiencia en dirección?", a: "No. Al empezar te preguntamos por tu experiencia para ajustar la ayuda y el orden de los casos." },
  { q: "¿Cuánto tiempo necesito al día?", a: "Unos minutos. Tú eliges el horario en que llegan los asuntos." },
  { q: "¿En qué se diferencia de un curso?", a: "No hay respuestas que memorizar. Decides, la empresa responde y después entiendes por qué." },
  { q: "¿Tengo que crear una cuenta o instalar algo?", a: "No instalas nada: funciona en el navegador. Creas una cuenta con Google o con tu correo, y tu avance te sigue a cualquier dispositivo." },
  { q: "¿Qué industrias hay?", a: "Consumo masivo, autopartes, restaurantes, software, retail, logística y distribución. Tus primeros casos ocurren en una empresa de la industria que nos cuentas al registrarte, si está entre estas; si no, en una de consumo masivo." },
  { q: "¿Tiene costo?", a: "Empezar es gratis y no pide tarjeta." },
];

/* ---------------- Cierre y pie ---------------- */
/* Cierre: la misma acción principal (no hay cobro operativo: no se publica precio). */
export const CLOSE = {
  title: "Empieza a decidir como líder.",
  body: "Practica cómo dirigir una empresa y desarrolla tu criterio, un caso a la vez.",
};
export const FOOTER = { tagline: "Simulador de decisiones ejecutivas. Dirigir se aprende decidiendo.", place: "Monterrey, N.L., México" };

/** Todo el copy visible de un idioma. content-en.ts exporta EN con esta misma forma. */
export const ES = { lang: "es" as Lang, SEO, NAV, CTA, UI, HERO, CASE, HOW, ACADEMY, PATH, FAQ, CLOSE, FOOTER };
export type Copy = typeof ES;

/** Frases que no queremos en la landing (tono). Se revisan en las pruebas. */
export const BANNED = ["revoluciona", "desbloquea tu", "transforma tu", "potencia tus", "siguiente nivel", "definitiva", "disruptiv", "game changer", "vanguardia", "powered by", "cancela cuando quieras", "prueba gratis", "próximamente", "en preparación", "más adelante", "muy pronto"];
