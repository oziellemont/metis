/**
 * Landing de MÊTIS CEO (www.metis.ceo) · todo el copy y los datos de las demos en un solo lugar.
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
};

/* ---------------- Navegación ---------------- */
export const NAV = [
  { href: "#como", label: "Cómo funciona" },
  { href: "#camino", label: "Tu carrera" },
] as const;
export const LOGIN_HREF = "/entrar";
export const START_HREF = "/ceo/empezar";
/** La única acción principal de la landing: el mismo texto y el mismo destino en encabezado, hero, demo y cierre. */
export const CTA = "Comenzar gratis";

/* ---------------- Hero ---------------- */
export const HERO = {
  eyebrow: "Simulador de dirección",
  title: "Practica cómo dirigir una empresa.",
  body: "Resuelve situaciones de negocio, toma decisiones y descubre cómo afectan a los resultados y a las personas. Desarrolla tu criterio de liderazgo en unos minutos al día.",
  motto: "Dirigir se aprende decidiendo.",
  note: "Sin tarjeta.",
};

/* ---------------- Cuadro del hero: el ciclo en 4 escenas ---------------- */
export const STORY = {
  label: "Así se vive MÊTIS, en cuatro escenas",
  ring: "Tu camino a CEO",
  scenes: [
    { key: "caso", tab: "El caso", title: "Cada día te llega un problema real", pct: 24 },
    { key: "decide", tab: "Decides", title: "Tú decides. La empresa responde.", pct: 41 },
    { key: "aprende", tab: "Aprendes", title: "Entiendes por qué, en un minuto", pct: 63 },
    { key: "sube", tab: "Avanzas", title: "Día a día, tu carrera avanza", pct: 86 },
  ] as const,
  caso: {
    from: "Héctor Salinas", role: "Director Comercial", channel: "WhatsApp",
    msg: "SuperNorte nos pide 4 puntos más de descuento y pagar a 90 días. ¿Cómo lo manejamos?",
    facts: [["Ventas con SuperNorte", "31% del total"], ["Responde en", "3 h 40 min"]] as [string, string][],
    foot: "Llega a tu celular, como en una empresa de verdad.",
  },
  decide: {
    options: ["Aceptar el descuento", "Negociar condiciones", "Mantener el precio"],
    pick: 1,
    kpis: [["Margen", 54, 60], ["Clientes", 64, 59], ["Equipo", 57, 55]] as [string, number, number][],
    foot: "Héctor esperaba otra cosa. Lo vas a notar la próxima semana.",
  },
  aprende: {
    eyebrow: "Nota CEO",
    note: "Cuando un cliente pesa tanto, no regales precio: ofrece algo que también le sirva a él.",
    source: "Bitácora · Negociación",
    ask: "¿Qué protegiste con tu decisión?",
    chips: ["El margen", "La relación", "Las ventas"],
    xp: "+30 XP", xpNote: "Buen criterio",
  },
  sube: {
    streak: "días de racha",
    stage: "Emerging Leader", next: "Functional Manager",
    appoint: "Nombramiento: Functional Manager", appointNote: "Más alcance, decisiones más grandes.",
  },
};

/* ---------------- Demo «Tu primera decisión» ---------------- */
export type Dim = "finanzas" | "personas" | "clientes" | "operacion" | "confianza";
export const DIMS: { key: Dim; label: string }[] = [
  { key: "finanzas", label: "Finanzas" },
  { key: "personas", label: "Personas" },
  { key: "clientes", label: "Clientes" },
  { key: "operacion", label: "Operación" },
  { key: "confianza", label: "Confianza" },
];
/** −2 … +2: dirección y fuerza del efecto. 0 = sin cambio visible. */
export type Effects = Record<Dim, -2 | -1 | 0 | 1 | 2>;

/** Un momento de la consecuencia: qué se mueve y con qué palabras se describe cada dimensión. */
export interface DemoPhase { text: string; effects: Effects; words: Record<Dim, string> }
export interface DemoOption {
  id: string;
  label: string;
  detail: string;
  now: DemoPhase;
  later: DemoPhase;
  tradeoff: string;
}

export const DEMO = {
  label: "Tu primera decisión",
  title: "Una decisión nunca afecta una sola cosa.",
  body: "Una muestra breve del primer caso del simulador. Elige qué le respondes a Héctor y mira qué cambia hoy y un mes después.",
  steps: ["Recibes el problema", "Tomas una decisión", "Ves qué cambia hoy y un mes después"],
  from: { name: "Héctor Salinas", initials: "HS", role: "Director Comercial · Botanas Cumbre", channel: "WhatsApp", time: "9:14" },
  message: [
    "Necesito que revisemos algo urgente.",
    "Sofía Leal, la compradora de SuperNorte, nos pide 4 puntos más de descuento y pagar a 90 días. Dice que una marca regional les ofreció mejores condiciones.",
    "Es casi un tercio de nuestras ventas.",
    "¿Cómo lo manejamos?",
  ],
  facts: [
    ["Ventas con SuperNorte", "31% del total"],
    ["Margen de la cuenta hoy", "7.1%"],
    ["Si das los 4 puntos", "Margen 3.1%"],
    ["Si se va", "La planta pierde casi un tercio de su volumen"],
  ] as [string, string][],
  ask: "¿Qué le respondes a Héctor?",
  picked: "Tu decisión",
  watch: "Observa cómo cambia tu empresa.",
  phases: ["Hoy", "Un mes después"] as const,
  seeLater: "Ver un mes después",
  options: [
    {
      id: "aceptar",
      label: "Aceptar el descuento",
      detail: "Conservas casi un tercio de las ventas y la planta sigue llena. Ese volumen ayuda a pagar los costos fijos.",
      now: {
        text: "Firmas hoy. Héctor respira, los turnos de la planta no se tocan y nadie tiene que explicar por qué se fue el cliente más grande.",
        effects: { finanzas: -1, personas: 1, clientes: 1, operacion: 1, confianza: 0 },
        words: { finanzas: "Margen a 3.1%", personas: "Alivio", clientes: "Cuenta asegurada", operacion: "Planta llena", confianza: "Sin cambios" },
      },
      later: {
        text: "La cuenta casi no deja margen y Finanzas te pide recortar en otra parte. SuperNorte aprendió que presionar funciona.",
        effects: { finanzas: -2, personas: 1, clientes: 1, operacion: 1, confianza: -1 },
        words: { finanzas: "Recortes en otra parte", personas: "Turnos intactos", clientes: "Cuenta conservada", operacion: "Capacidad usada", confianza: "Precedente débil" },
      },
      tradeoff: "Compraste estabilidad para la planta y el equipo con margen. La próxima negociación empieza desde un precio más bajo.",
    },
    {
      id: "negociar",
      label: "Negociar condiciones",
      detail: "Llevas datos: tus papas rotan 1.4 veces más que las de la marca regional. Ofreces 1.5 puntos en promociones atadas a volumen. Ganas tiempo, no certeza.",
      now: {
        text: "SuperNorte no firma hoy: pide una semana. Héctor tiene que volver con una contrapropuesta y sostenerla frente a su compradora.",
        effects: { finanzas: 0, personas: -1, clientes: -1, operacion: 0, confianza: 1 },
        words: { finanzas: "Estable", personas: "Héctor presionado", clientes: "En negociación", operacion: "Sin cambios", confianza: "Postura clara" },
      },
      later: {
        text: "SuperNorte acepta las promociones con metas por tienda, pero retira dos productos del anaquel. Proteges margen; Héctor quedó desgastado.",
        effects: { finanzas: 1, personas: -1, clientes: -1, operacion: 0, confianza: 1 },
        words: { finanzas: "Margen protegido", personas: "Héctor desgastado", clientes: "Menos anaquel", operacion: "Sin cambios", confianza: "Acuerdo cumplido" },
      },
      tradeoff: "Cambiaste la certeza de hoy por un mejor acuerdo. Esta vez salió; en el simulador, no siempre sale.",
    },
    {
      id: "mantener",
      label: "Mantener el precio",
      detail: "Otra cadena pidió cotización la semana pasada. Apuestas a que tu producto vale lo que cobras.",
      now: {
        text: "Proteges el margen completo y das una señal clara: el precio no se mueve por presión.",
        effects: { finanzas: 2, personas: -1, clientes: -1, operacion: 0, confianza: 1 },
        words: { finanzas: "Margen intacto", personas: "Héctor inquieto", clientes: "Relación tensa", operacion: "Sin cambios", confianza: "Señal firme" },
      },
      later: {
        text: "SuperNorte reduce pedidos mientras prueba a otro proveedor. La planta queda con capacidad ociosa y Héctor siente que lo dejaste solo.",
        effects: { finanzas: 2, personas: -1, clientes: -2, operacion: -1, confianza: 1 },
        words: { finanzas: "Margen intacto", personas: "Héctor se siente solo", clientes: "Pedidos a la baja", operacion: "Capacidad ociosa", confianza: "Precio respetado" },
      },
      tradeoff: "Apostaste a que tu producto vale más para ellos de lo que dicen. Si te equivocas, el costo llega en volumen y en tu equipo.",
    },
  ] as DemoOption[],
  disclaimer: "Ejemplo ilustrativo, no conectado a tu cuenta. En el simulador, el resultado también depende de lo que decidiste antes y de cómo está tu empresa.",
  close: "Eso fue una decisión. En el simulador, cada una se conecta con las siguientes durante semanas.",
  retry: "Volver a decidir",
};

/* ---------------- Cómo funciona (incluye el ritmo diario) ---------------- */
export const HOW = {
  title: "Practica con casos que evolucionan.",
  body: "Practica desde cualquier dispositivo, dentro del horario que eliges y a tu propio ritmo.",
  steps: [
    { n: "01", t: "Abre un caso", d: "Una situación de negocio pone a prueba tu criterio." },
    { n: "02", t: "Toma decisiones", d: "Revisa el contexto y define cómo actuar; tus decisiones cambian lo que ocurre después." },
    { n: "03", t: "Aprende de las consecuencias", d: "Comprende los resultados y refuerza conceptos en mêtis Academy." },
  ],
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
  title: "Una carrera que crece contigo.",
  body: "Empiezas dirigiendo una empresa en la industria que elijas. Al resolver retos, asumes responsabilidades mayores y otras industrias te llaman a dirigir.",
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

/** Frases que no queremos en la landing (tono). Se revisan en las pruebas. */
export const BANNED = ["revoluciona", "desbloquea tu", "transforma tu", "potencia tus", "siguiente nivel", "definitiva", "disruptiv", "game changer", "vanguardia", "powered by", "cancela cuando quieras", "prueba gratis", "próximamente", "en preparación", "más adelante", "muy pronto"];
