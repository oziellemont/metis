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
  { item: "Ruta de seis etapas", state: "hoy", note: "Cambia solo con un nombramiento" },
  { item: "The Executive Arena", state: "hoy", note: "Después de Global CEO: empresas con exigencia Legendaria (engine tier + legendary)" },
  { item: "Ranking", state: "hoy", note: "Con alias" },
  { item: "Perfil profesional y orden «Para ti»", state: "hoy", note: "V33" },
  { item: "Avisos por correo", state: "hoy", note: "Si conectas tu correo y lo activas" },
  { item: "Respuestas escritas con retroalimentación", state: "preparacion", note: "Vista previa apagada por defecto" },
  { item: "Junta ante el Consejo", state: "hoy", note: "Tres momentos encadenados; requisito para Chief Executive Officer (/ceo/junta)" },
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
  stage: "Etapa",
  stagesLabel: "Etapas de la carrera",
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
  title: "Practica cómo dirigir una empresa.",
  body: "mêtis CEO es un simulador para practicar cómo dirigir una empresa. Te llegan situaciones de negocio como en la vida real: un correo, un WhatsApp, una llamada. Revisas el contexto, decides y ves qué pasa con los resultados y con las personas. Después entiendes por qué, en un minuto.",
  motto: "Dirigir se aprende decidiendo.",
  note: "Sin tarjeta.",
};

/* ---------------- El caso del primer bloque (SuperNorte, día 2 de Botanas Cumbre) ---------------- */
/** Copia fiel de lib/ceo/companies/cumbre-items.ts (d2-supernorte); las pruebas revisan que coincida. */
export interface CaseOption { id: string; text: string; reply: string[]; outcome: string; effects: [string, number][] }
export const CASE = {
  label: "Un caso del simulador",
  steps: ["El caso", "Contexto", "Decides", "Resultado", "Aprendes"],
  stepOf: "Paso {n} de {t}",
  received: "Te llegó un asunto",
  from: { name: "Sofía Leal", initials: "SL", role: "Compradora de categoría · SuperNorte", tone: "#171A3A", time: "9:14" },
  channel: "Correo",
  subject: "Condiciones comerciales 2027 · Botanas Cumbre",
  to: "Para: Director General <direccion@botanascumbre.mx>",
  body: [
    "Estimado Director:",
    "Primero, bienvenido. Nos dio gusto saber del relevo en Cumbre.",
    "Como cada año, revisamos condiciones con nuestros proveedores estratégicos. Para mantener sus dos frentes de anaquel en las 140 tiendas, necesitamos 4 puntos adicionales de descuento y pasar el plazo de pago de 60 a 90 días a partir de enero.",
    "Sabemos que es un ajuste importante. También le comento que una marca regional nos ofreció condiciones muy competitivas por ese espacio.",
    "Quedo atenta a su respuesta antes del viernes.",
    "Saludos cordiales,\nSofía Leal · Compradora de categoría Botanas",
  ],
  context: {
    eyebrow: "Antes de decidir",
    title: "Lo que necesitas saber",
    text: "Los datos del asunto y quién está en juego. Tómate tu tiempo.",
    data: {
      title: "Lucía (Finanzas) te armó esto en 20 minutos",
      rows: [["Ventas a SuperNorte", "$127 M al año"], ["Margen de la cuenta hoy", "7.1%"], ["Si damos 4 pts", "Margen 3.1% · −$5.1 M al año"], ["Si pasamos a 90 días", "Necesitamos ≈ $10 M más de capital de trabajo"], ["Rotación de Cumbre en sus tiendas", "1.4× la de la marca regional"]] as [string, string][],
      note: "Nota de Lucía: «Ojo, nuestras papas rotan mejor que las de ellos. SuperNorte también pierde si nos saca.»",
    },
  },
  decide: { eyebrow: "Tu decisión", ask: "¿Cómo respondes a SuperNorte?", cta: "Tomar la decisión" },
  options: [
    { id: "a", text: "Aceptar. Es el 31% de las ventas y no puedo arriesgarme en mi primer mes.", reply: ["Excelente, Director. Le agradecemos mucho la disposición.", "Le hago llegar el anexo para firma esta semana."], outcome: "Conservas el anaquel, pero pierdes $5 M de margen al año y necesitas $10 M de caja. Y SuperNorte aprendió que contigo basta con apretar.", effects: [["Clientes", 4], ["Margen", -8], ["Caja", -6]] },
    { id: "b", text: "Pedir una reunión con datos: nuestra rotación es 1.4× la de la competencia. Propongo invertir 1.5 puntos en promociones conjuntas atadas a volumen y mantener 60 días.", reply: ["Interesante. No tenía el dato de rotación por tienda.", "Lo reviso con mi gerente. Si el plan de promociones viene con metas por tienda, lo podemos considerar.", "¿Le parece el jueves a las 10?"], outcome: "Cambiaste la conversación de «cuánto me das» a «cómo crecemos los dos». Si te funciona, creas valor antes de pelearlo.", effects: [["Clientes", 2], ["Consejo", 3], ["Margen", -2], ["Caja", -1]] },
    { id: "c", text: "Responder firme: si nos aprietan, sacamos producto y apostamos por tiendas de conveniencia. No vamos a regalar margen.", reply: ["Entiendo su postura, Director.", "Lo comentaré internamente."], outcome: "Defendiste el margen con tu poder. Pero tu alternativa (las tiendas de conveniencia) todavía no existe: estás alardeando.", effects: [["Margen", 3], ["Clientes", -8], ["Consejo", -2]] },
  ] as CaseOption[],
  result: { decided: "Decidiste", what: "Qué pasó en Botanas Cumbre" },
  learn: {
    eyebrow: "Bitácora del CEO",
    title: "MAPAN: el poder está en tus alternativas",
    text: "Tu fuerza no dependía de sonar duro, sino de tu mejor alternativa y de entender la de SuperNorte: perder un producto que rota 1.4× también les cuesta. Antes de pelear la rebanada, pregúntate si la mesa puede crecer.",
    notaLabel: "Nota CEO:",
    nota: "La mejor forma de negociar con fuerza no es sonar fuerte; es construir alternativas antes de necesitarlas.",
    lessonLabel: "Aprende la teoría:",
    lesson: "Negociar como CEO · 5 min",
  },
  nav: { back: "Atrás", next: ["Ver el contexto", "Decidir", "", "Lo que aprendes"], again: "Elegir otra respuesta" },
  note: "Caso del día 2 en Botanas Cumbre, tal cual aparece en el simulador. Esta muestra no guarda nada.",
};

/* ---------------- Cómo funciona: tres pasos y una secuencia de tres pantallas ---------------- */
export interface TodayItem { initials: string; tone: string; name: string; channel: "email" | "whatsapp" | "reporte"; text: string; due: string }
export const HOW = {
  title: "Practica con casos que evolucionan.",
  body: "Practica desde cualquier dispositivo, dentro del horario que eliges y a tu propio ritmo.",
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

/* ---------------- La experiencia: una empresa que recuerda (casos reales de Botanas Cumbre) ---------------- */
/** Una decisión de un día y lo que regresa días después. Todo sale de Botanas Cumbre (lib/ceo/companies/cumbre-items.ts). */
export interface Echo {
  t: string;
  context: string;
  decide: { day: string; text: string };
  back: { day: string; who: string; initials: string; text: string };
  tone: "riesgo" | "bien";
}
/** Cada cuánto avanza el carrusel de historias (se detiene con foco, mouse, interacción o movimiento reducido). */
export const MEMORY_INTERVAL_MS = 7000;
export const DIFF = {
  eyebrow: "Una empresa que recuerda",
  title: "Tus decisiones siguen teniendo consecuencias.",
  body: "Las personas recuerdan cómo las trataste y algunos problemas de hoy se sembraron días antes. Lo que regresa depende de lo que decidas.",
  decideLabel: "Decides",
  backLabel: "Regresa",
  carousel: { region: "Historias de Botanas Cumbre", role: "carrusel", item: "historia", of: "de", prev: "Historia anterior", next: "Historia siguiente", pick: "Elegir historia", story: "Historia", pause: "Pausar el carrusel", play: "Reproducir el carrusel" },
  items: [
    {
      t: "Alguien recuerda lo que hiciste",
      context: "Héctor, Director Comercial con 22 años en la empresa, esperaba tu puesto. El primer día te escribe preocupado por las comisiones de su equipo.",
      decide: { day: "Día 1", text: "No le contestas y le pides a Personas que lo atienda." },
      back: { day: "Día 3", who: "Mariana · Personas", initials: "MV", text: "Héctor presentó su renuncia. En la salida me dijo: «El nuevo ni me contestó»." },
      tone: "riesgo",
    },
    {
      t: "Un colaborador deja de confiar en ti",
      context: "Ana, analista de planeación, se desveló para entregarte un pronóstico de 22 láminas. La idea clave está enterrada en la lámina 19.",
      decide: { day: "Día 2", text: "Le respondes: «Esto no sirve para un consejo. Para mañana»." },
      back: { day: "Día 6", who: "Mariana · Personas", initials: "MV", text: "Ana aceptó otra oferta. Dijo: «Nunca supe si mi trabajo servía. Allá me ofrecen un mentor»." },
      tone: "riesgo",
    },
    {
      t: "Una crisis que empezó antes",
      context: "Javier, gerente de planta, te avisa que el tostador de la línea 2 falla y que casi lastima a un operador.",
      decide: { day: "Día 3", text: "Decides seguir operando hasta el lunes para no retrasar un pedido." },
      back: { day: "Día 5", who: "Javier · Planta", initials: "JO", text: "Jefe, pasó lo que temíamos en la línea 2. Toño está en el Seguro y mañana viene un inspector." },
      tone: "riesgo",
    },
    {
      t: "Y la empresa crece contigo",
      context: "Con la misma Ana, otra decisión cambia la historia.",
      decide: { day: "Día 2", text: "Te sientas 20 minutos con ella y le enseñas a empezar por la recomendación." },
      back: { day: "Día 5", who: "Carla · Consejo", initials: "CM", text: "Después de su presentación: «¿Quién es Ana? Esa muchacha tiene futuro»." },
      tone: "bien",
    },
  ] as Echo[],
};

/* ---------------- Camino profesional (ruta visual) ---------------- */
export type StageState = "inicio" | "siguiente" | "bloqueada";
export const PATH = {
  eyebrow: "Tu carrera",
  title: "Una carrera que crece contigo.",
  body: "Empiezas dirigiendo una empresa en la industria que elijas. Cada caso te deja un aprendizaje: entiendes por qué pasó lo que pasó y refuerzas la teoría en mêtis Academy. Al resolver retos, asumes responsabilidades mayores y otras industrias te llaman a dirigir.",
  stateLabel: { inicio: "Aquí empiezas", siguiente: "Siguiente objetivo", bloqueada: "Por desbloquear" } as Record<StageState, string>,
  stages: [
    { n: "01", name: "Emerging Leader", learn: "Equipos y prioridades", state: "inicio" },
    { n: "02", name: "Functional Manager", learn: "Presupuestos y ejecución", state: "siguiente" },
    { n: "03", name: "Business Unit Director", learn: "Estrategia y rentabilidad", state: "bloqueada" },
    { n: "04", name: "Chief Operating Officer", learn: "Operaciones y organización", state: "bloqueada" },
    { n: "05", name: "Chief Executive Officer", learn: "Crecimiento y riesgo", state: "bloqueada" },
    { n: "06", name: "Global CEO", learn: "Mercados y gobernanza", state: "bloqueada" },
  ] as { n: string; name: string; learn: string; state: StageState }[],
  beyond: { t: "The Executive Arena", d: "Después de Global CEO, nuevos desafíos ponen a prueba tu criterio. Siempre habrá algo más que aprender." },
};

/* ---------------- Filosofía ---------------- */
export const PHILOSOPHY = {
  title: "Dirigir es una responsabilidad. Y vale la pena prepararse para ella.",
  body: "Detrás de cada decisión hay personas, recursos y consecuencias. El criterio de un líder puede desarrollarse antes de que llegue el momento de ponerlo a prueba.",
  who: "Para quienes aspiran a dirigir, para quienes ya lideran y para quienes creen que siempre hay algo más que aprender.",
  author: "Oziel Leal Montemayor",
  authorRole: "Creador de MÊTIS",
};

/* ---------------- FAQ ---------------- */
export const FAQ: { q: string; a: string }[] = [
  { q: "¿Necesito experiencia en dirección?", a: "No. Al empezar te preguntamos por tu experiencia para ajustar la ayuda y el orden de los casos." },
  { q: "¿Cuánto tiempo necesito al día?", a: "Unos minutos. Tú eliges el horario en que llegan los asuntos." },
  { q: "¿En qué se diferencia de un curso?", a: "No hay respuestas que memorizar. Decides, la empresa responde y después entiendes por qué." },
  { q: "¿Tengo que crear una cuenta o instalar algo?", a: "No instalas nada: funciona en el navegador. Para dirigir tu empresa creas una cuenta con Google o con tu correo, y tu avance te sigue a cualquier dispositivo." },
  { q: "¿Qué industrias hay?", a: "Consumo masivo, autopartes y restaurantes. Eliges con cuál empezar." },
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
export const ES = { lang: "es" as Lang, SEO, NAV, CTA, UI, HERO, CASE, HOW, DIFF, PATH, PHILOSOPHY, FAQ, CLOSE, FOOTER };
export type Copy = typeof ES;

/** Frases que no queremos en la landing (tono). Se revisan en las pruebas. */
export const BANNED = ["revoluciona", "desbloquea tu", "transforma tu", "potencia tus", "siguiente nivel", "definitiva", "disruptiv", "game changer", "vanguardia", "powered by", "cancela cuando quieras", "prueba gratis", "próximamente", "en preparación", "más adelante", "muy pronto"];
