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
  description: "Entrena tu criterio como líder con MÊTIS CEO. Dirige empresas simuladas, enfrenta decisiones difíciles y aprende de sus consecuencias, unos minutos al día.",
};

/* ---------------- Navegación ---------------- */
export const NAV = [
  { href: "#como", label: "Cómo funciona" },
  { href: "#experiencia", label: "La experiencia" },
  { href: "#camino", label: "Tu camino" },
] as const;
export const LOGIN_HREF = "/entrar";
export const START_HREF = "/ceo/empezar";

/* ---------------- Hero ---------------- */
export const HERO = {
  eyebrow: "MÊTIS CEO · Simulador de decisiones ejecutivas",
  title: "Dirigir se aprende decidiendo.",
  body: "Enfrenta los retos de una empresa, toma decisiones difíciles y descubre cómo afectan al negocio y a las personas. Aprende a pensar como líder, unos minutos al día.",
  primary: "Probar una decisión",
  secondary: "Cómo funciona",
  note: "Sin registro. Tarda un minuto.",
  who: "Para quienes aspiran a dirigir, para quienes ya lideran y para quienes creen que siempre hay algo más que aprender.",
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
  body: "Lo que hoy protege tus ventas puede presionar tus márgenes. Lo que cuida el presupuesto puede afectar a tu equipo. Pruébalo con el primer caso del simulador.",
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
  close: "Eso fue una decisión. Imagina dirigir la empresa durante semanas.",
  cta: "Empezar mi historia",
  retry: "Volver a decidir",
};

/* ---------------- Cómo funciona (incluye el ritmo diario) ---------------- */
export const HOW = {
  title: "Tu siguiente reto puede llegar en cualquier momento.",
  body: "Como en una empresa real, las decisiones no siempre esperan a que estés listo. Unos minutos al día bastan.",
  steps: [
    { n: "01", t: "Recibes una situación", d: "Un cliente reclama, tu equipo necesita una respuesta o el presupuesto no alcanza." },
    { n: "02", t: "Tomas una decisión", d: "Revisas el contexto, eliges un camino y asumes sus consecuencias. No siempre tendrás toda la información." },
    { n: "03", t: "Aprendes de lo que ocurre", d: "Ves cómo reaccionan las personas, qué cambia en el negocio y qué podrías considerar la próxima vez." },
  ],
  rhythm: [
    { t: "Tu horario", d: "Eliges desde qué hora y hasta qué hora te escribe tu equipo. Si prefieres, recibes todo el día de una vez." },
    { t: "En el celular o la computadora", d: "Funciona en el navegador. Con tu cuenta, tu avance te sigue a cualquier dispositivo." },
    { t: "Una racha que ayuda", d: "Sirve para crear el hábito, no para presionarte. Si un día no entras, algunos asuntos vencen, como en cualquier empresa." },
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
export const DIFF = {
  eyebrow: "Una empresa que recuerda tus decisiones",
  title: "No estás respondiendo un examen. Estás dirigiendo.",
  body: "En MÊTIS las personas recuerdan cómo las trataste, la confianza se gana o se pierde y algunos problemas de hoy se sembraron hace días. Tu empresa está viva.",
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
  source: "Situaciones de Botanas Cumbre, la primera empresa del simulador. Lo que regresa depende de lo que decidas.",
  after: {
    title: "Al cerrar cada caso",
    items: [
      "Ves qué pasó, por qué y qué otra lectura era posible",
      "Una Nota CEO y lecciones breves en mêtis Academy",
      "Los siguientes casos se ordenan según lo que te conviene reforzar",
    ],
  },
};

/* ---------------- Tu desarrollo ejecutivo (ejemplo conceptual: cifras ilustrativas) ---------------- */
export const GROWTH = {
  eyebrow: "Tu desarrollo ejecutivo",
  title: "Tu criterio está evolucionando",
  tag: "Ejemplo conceptual",
  bars: [
    { name: "Pensamiento estratégico", pct: 76 },
    { name: "Gestión financiera", pct: 59 },
    { name: "Liderazgo de personas", pct: 84 },
    { name: "Manejo de crisis", pct: 38 },
  ],
  nextLabel: "Próximo reto",
  next: "Practicar decisiones financieras bajo presión.",
  disclaimer: "Porcentajes ilustrativos. En el simulador, tu perfil se construye con tus propias decisiones.",
};

/* ---------------- Camino profesional (ruta visual) ---------------- */
export type StageState = "inicio" | "siguiente" | "bloqueada";
export const PATH = {
  title: "Una carrera que crece contigo.",
  body: "No empiezas decidiendo adquisiciones internacionales. Primero aprendes a dirigir personas, recursos y resultados. Después, el alcance de tus decisiones crece.",
  stateLabel: { inicio: "Aquí empiezas", siguiente: "Siguiente objetivo", bloqueada: "Por desbloquear" } as Record<StageState, string>,
  stages: [
    { n: "01", name: "Emerging Leader", learn: "Equipos y prioridades", state: "inicio" },
    { n: "02", name: "Functional Manager", learn: "Presupuestos y ejecución", state: "siguiente" },
    { n: "03", name: "Business Unit Director", learn: "Estrategia y rentabilidad", state: "bloqueada" },
    { n: "04", name: "Chief Operating Officer", learn: "Operaciones y organización", state: "bloqueada" },
    { n: "05", name: "Chief Executive Officer", learn: "Crecimiento y riesgo", state: "bloqueada" },
    { n: "06", name: "Global CEO", learn: "Mercados y gobernanza", state: "bloqueada" },
  ] as { n: string; name: string; learn: string; state: StageState }[],
  how: "Cada ascenso es un nombramiento: lo ganas aprobando empresas, demostrando dominio en tus competencias y manteniendo la constancia. En la simulación diriges una empresa desde el primer día; tu etapa refleja el criterio que has demostrado.",
  beyond: { t: "Después de Global CEO: The Executive Arena", d: "La meta no es terminar. En The Executive Arena sigues dirigiendo empresas, con golpes más duros y una línea de aprobación más alta." },
};

/* ---------------- Filosofía ---------------- */
export const PHILOSOPHY = {
  title: "Dirigir es una responsabilidad. Y vale la pena prepararse para ella.",
  body: "Detrás de cada decisión hay personas, recursos y consecuencias. MÊTIS nace de una idea sencilla: el criterio de un líder puede desarrollarse antes de que llegue el momento de ponerlo a prueba.",
  eyebrow: "Por qué creamos MÊTIS",
  quote: "Las personas no son el problema. Las personas son la solución.",
  story: "El trabajo de un director general no es tener todas las respuestas. Es cuidar cómo se relacionan las personas para que cada colaborador llegue a su máximo potencial. Por eso en MÊTIS casi todas las decisiones pasan por alguien: un vendedor que esperaba tu puesto, una analista que quiere crecer, un operador que necesita que lo escuches. Aquí practicas ese criterio antes de que tu equipo dependa de él.",
  author: "Oziel Leal Montemayor",
  authorRole: "Creador de MÊTIS",
};

/* ---------------- FAQ ---------------- */
export const FAQ: { q: string; a: string }[] = [
  { q: "¿Necesito experiencia en dirección?", a: "No. Al empezar te preguntamos por tu experiencia para ajustar la ayuda y el orden de los casos. Si ya diriges, puedes empezar con más exigencia." },
  { q: "¿Cuánto tiempo necesito al día?", a: "Unos minutos. Cada asunto se lee y se decide en poco tiempo, y tú eliges el horario en que llegan." },
  { q: "¿En qué se diferencia de un curso?", a: "No hay respuestas correctas que memorizar. Decides, la empresa responde y después entiendes por qué. Las lecciones llegan cuando ya viviste el caso." },
  { q: "¿Tengo que crear una cuenta o instalar algo?", a: "No instalas nada: funciona en el navegador del celular o la computadora. Para probar una decisión no necesitas cuenta. Para dirigir tu empresa creas una con Google o con tu correo, y tu avance te sigue a cualquier dispositivo." },
  { q: "¿Tiene costo?", a: "Puedes empezar hoy, sin tarjeta." },
];

/* ---------------- Cierre y pie ---------------- */
/* Cierre con el acceso (no hay cobro operativo: no se publica precio). */
export const CLOSE = {
  title: "La próxima decisión es tuya.",
  body: "Empieza hoy, sin tarjeta, y desarrolla el criterio para enfrentarla.",
  points: ["Sin tarjeta ni formulario largo", "Tres empresas que se abren conforme avanzas", "Lecciones de mêtis Academy", "Avisos por correo, si los activas"],
  cta: "Comenzar en MÊTIS",
};
export const FOOTER = { tagline: "Simulador de decisiones ejecutivas. Dirigir se aprende decidiendo.", place: "Monterrey, N.L., México" };

/** Frases que no queremos en la landing (tono). Se revisan en las pruebas. */
export const BANNED = ["revoluciona", "desbloquea tu", "transforma tu", "potencia tus", "siguiente nivel", "definitiva", "disruptiv", "game changer", "vanguardia", "powered by", "cancela cuando quieras", "prueba gratis", "próximamente", "en preparación", "más adelante", "muy pronto"];
