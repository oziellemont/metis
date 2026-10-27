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
export const LOGIN_HREF = "/login?next=/ceo";
export const START_HREF = "/ceo/empezar";

/* ---------------- Hero ---------------- */
export const HERO = {
  eyebrow: "MÊTIS CEO · Simulador de decisiones ejecutivas",
  title: "Dirigir se aprende decidiendo.",
  body: "Enfrenta los retos de una empresa, toma decisiones difíciles y descubre cómo afectan al negocio y a las personas. Aprende a pensar como líder, unos minutos al día.",
  primary: "Probar una decisión",
  secondary: "Cómo funciona",
  note: "Sin registro. Tarda un minuto.",
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

export interface DemoOption {
  id: string;
  label: string;
  detail: string;
  now: string;
  later: string;
  tradeoff: string;
  effects: Effects;
}

export const DEMO = {
  label: "Tu primera decisión",
  from: { name: "Héctor Salinas", initials: "HS", role: "Director Comercial · Botanas Cumbre", channel: "WhatsApp", time: "9:14" },
  message: [
    "Nuestro cliente más grande está pidiendo otro 12% de descuento.",
    "Dice que, si no aceptamos hoy, cambia de proveedor. Representa casi una cuarta parte de las ventas.",
  ],
  facts: [
    ["Ventas con este cliente", "24% del total"],
    ["Margen de la cuenta hoy", "11%"],
    ["Con 12% de descuento", "La cuenta deja de ganar (≈ −1%)"],
    ["Lo que también sabes", "Otra cadena pidió cotización la semana pasada"],
  ] as [string, string][],
  ask: "¿Qué harías?",
  options: [
    {
      id: "aceptar",
      label: "Aceptar el descuento",
      detail: "Proteges la cuenta y el volumen de la planta.",
      now: "Firmas hoy. El cliente se queda y la planta mantiene su ritmo.",
      later: "La cuenta deja de ser rentable. Finanzas te pide recortar en otra parte, y el cliente aprendió que presionar funciona.",
      tradeoff: "Compraste tranquilidad con margen. La próxima negociación empieza desde un precio más bajo.",
      effects: { finanzas: -2, personas: 0, clientes: 1, operacion: 1, confianza: -1 },
    },
    {
      id: "negociar",
      label: "Negociar condiciones",
      detail: "Ofreces menos descuento a cambio de volumen y plazo.",
      now: "Propones 5% atado a un año de volumen mínimo. El cliente no firma hoy: pide una semana.",
      later: "Héctor queda en medio y necesita tu respaldo. Si el acuerdo sale, proteges margen y planeas producción con más certeza.",
      tradeoff: "Cambiaste la certeza de hoy por un mejor acuerdo, con el riesgo de que no llegue.",
      effects: { finanzas: 1, personas: -1, clientes: -1, operacion: 1, confianza: 1 },
    },
    {
      id: "mantener",
      label: "Mantener el precio",
      detail: "Defiendes el valor de tu producto y aceptas el riesgo.",
      now: "Proteges el margen y das una señal clara: el precio no se mueve por presión.",
      later: "El cliente reduce pedidos el próximo mes mientras prueba a otro proveedor. La planta queda con capacidad ociosa y Héctor siente que lo dejaste solo.",
      tradeoff: "Apostaste a que tu producto vale más para ellos de lo que dicen. Si te equivocas, el costo llega en volumen.",
      effects: { finanzas: 1, personas: -1, clientes: -2, operacion: -1, confianza: 1 },
    },
  ] as DemoOption[],
  disclaimer: "Ejemplo ilustrativo, no conectado a tu cuenta. En el simulador, el resultado también depende de lo que decidiste antes y de cómo está tu empresa.",
  close: "Eso fue una decisión. Imagina dirigir la empresa durante semanas.",
  cta: "Empezar mi historia",
  retry: "Volver a decidir",
};

/* ---------------- Efectos cruzados ---------------- */
export interface RippleOption { id: string; label: string; now: Effects; later: Effects; nowText: string; laterText: string }
export const RIPPLE = {
  title: "Una decisión nunca afecta una sola cosa.",
  body: "Lo que hoy mejora tus ventas puede presionar tus márgenes. Lo que protege el presupuesto puede afectar a tu equipo. Aprender a dirigir es entender esas conexiones.",
  note: "Simulación de ejemplo. Los efectos muestran dirección, no cifras reales.",
  phases: ["Esta semana", "Un mes después"] as const,
  options: [
    {
      id: "promo",
      label: "Lanzar una promoción 2x1",
      now: { finanzas: 0, personas: 0, clientes: 2, operacion: -1, confianza: 0 },
      later: { finanzas: -2, personas: -1, clientes: 0, operacion: -1, confianza: -1 },
      nowText: "Las ventas suben y los clientes responden. La planta trabaja con más presión.",
      laterText: "El margen se comió la promoción y los clientes ya esperan la siguiente. Ventas creció; la utilidad no.",
    },
    {
      id: "congelar",
      label: "Congelar contrataciones",
      now: { finanzas: 2, personas: -1, clientes: 0, operacion: 0, confianza: 1 },
      later: { finanzas: 1, personas: -2, clientes: -1, operacion: -2, confianza: 0 },
      nowText: "El presupuesto respira y el consejo lo nota. El equipo absorbe el trabajo pendiente.",
      laterText: "Las horas extra se acumulan, se va alguien clave y los tiempos de entrega empiezan a fallar.",
    },
    {
      id: "pedido",
      label: "Aceptar un pedido urgente con horas extra",
      now: { finanzas: 1, personas: -1, clientes: 2, operacion: -1, confianza: 0 },
      later: { finanzas: 1, personas: 0, clientes: 2, operacion: 1, confianza: 1 },
      nowText: "Cumples a un cliente importante. El turno de noche se carga y mantenimiento se pospone.",
      laterText: "El cliente amplía su contrato y el equipo ya sabe trabajar con picos. Funcionó porque fue una excepción.",
    },
  ] as RippleOption[],
};

/* ---------------- Cómo funciona ---------------- */
export const HOW = {
  title: "Tu siguiente reto puede llegar en cualquier momento.",
  body: "Como en una empresa real, las decisiones no siempre esperan a que estés listo.",
  steps: [
    { n: "01", t: "Recibes una situación", d: "Un cliente reclama. Tu equipo necesita una respuesta. El presupuesto no alcanza. Algo está pasando en tu empresa." },
    { n: "02", t: "Tomas una decisión", d: "Revisas el contexto, eliges un camino y asumes sus consecuencias. No siempre tendrás toda la información." },
    { n: "03", t: "Aprendes de lo que ocurre", d: "Ves cómo reaccionan las personas, qué cambia en el negocio y qué podrías considerar la próxima vez." },
  ],
  footnote: "Los asuntos llegan dentro del horario que tú eliges. Si prefieres, puedes recibir todo el día de una vez.",
};

/* ---------------- Diferenciación (fragmentos reales de Botanas Cumbre) ---------------- */
export const DIFF = {
  title: "No estás respondiendo un examen. Estás dirigiendo.",
  body: "En MÊTIS no todas las decisiones tienen una respuesta perfecta. Lo importante es aprender a evaluar riesgos, anticipar consecuencias y entender a las personas.",
  source: "Fragmentos de Botanas Cumbre, la primera empresa del simulador.",
  items: [
    {
      t: "Decisiones con contexto",
      d: "El problema casi nunca viene acompañado de toda la información.",
      frag: { kind: "data" as const, title: "Lucía (Finanzas) te armó esto en 20 minutos", rows: [["Ventas a SuperNorte", "$127 M al año"], ["Margen de la cuenta hoy", "7.1%"], ["Si damos 4 pts", "Margen 3.1%"], ["Si pasamos a 90 días", "≈ $10 M más de capital de trabajo"]] as [string, string][] },
    },
    {
      t: "Consecuencias que continúan",
      d: "Algunas decisiones resuelven el día. Otras cambian lo que ocurre después.",
      frag: { kind: "outcome" as const, title: "Lo que pasó", text: "Conservas el anaquel, pero pierdes $5 M de margen al año y necesitas $10 M de caja. Y SuperNorte aprendió que contigo basta con apretar." },
    },
    {
      t: "Personas que recuerdan",
      d: "Cómo respondes a tu equipo influye en la confianza que construyes.",
      frag: { kind: "message" as const, title: "Héctor Salinas", text: "Me enteré de lo de SuperNorte. A Sofía la conozco desde que era practicante…" },
    },
  ],
};

/* ---------------- Aprendizaje continuo ---------------- */
export const LEARN = {
  title: "Cada decisión te enseña algo. La siguiente te exige un poco más.",
  body: "A medida que avanzas, los retos cambian. Pasas de resolver problemas de equipo a tomar decisiones que afectan operaciones, resultados, estrategia y crecimiento.",
  pillars: [
    { t: "Práctica", d: "Decisiones aplicadas dentro de empresas simuladas, con personas, números y tiempos que importan." },
    { t: "Reflexión", d: "Al cerrar cada caso ves qué pasó, por qué y qué otra lectura era posible. Sin una sola respuesta correcta." },
    { t: "Progresión", d: "Los casos se ordenan según tu experiencia y lo que te conviene reforzar. Las empresas siguientes exigen más." },
  ],
  today: [
    "Explicación al cerrar cada caso, con una Nota CEO",
    "Lecciones breves en mêtis Academy",
    "Orden de casos ajustado a tu perfil, si lo completas",
  ],
};

/* ---------------- Camino profesional ---------------- */
export const PATH = {
  title: "Una carrera que crece contigo.",
  body: "No empiezas tomando decisiones sobre adquisiciones internacionales. Primero aprendes a dirigir personas, recursos y resultados. Después, el alcance de tus decisiones crece.",
  roleNote: "En la simulación diriges una empresa desde el primer día. Tu etapa es otra cosa: refleja el criterio que has demostrado, empieza en Emerging Leader y solo cambia con un nombramiento.",
  stages: [
    { n: "I", name: "Emerging Leader", es: "Líder emergente", learn: "Equipos, prioridades y comunicación" },
    { n: "II", name: "Functional Manager", es: "Gerente funcional", learn: "Presupuestos, indicadores y ejecución" },
    { n: "III", name: "Business Unit Director", es: "Director de unidad de negocio", learn: "Rentabilidad, estrategia y talento" },
    { n: "IV", name: "Chief Operating Officer", es: "Director de operaciones", learn: "Integración de operaciones y áreas" },
    { n: "V", name: "Chief Executive Officer", es: "Director General", learn: "Capital, cultura, crecimiento y riesgo" },
    { n: "VI", name: "Global CEO", es: "CEO global", learn: "Mercados internacionales, adquisiciones y gobierno corporativo" },
  ],
  beyond: "La meta no es terminar las lecciones. Es seguir desarrollando criterio.",
  beyondNote: "Cada etapa trae empresas más exigentes, juntas de consejo y crisis que ponen a prueba lo que aprendiste.",
};

/* ---------------- Ritmo ---------------- */
export const RHYTHM = {
  title: "Unos minutos al día pueden cambiar cómo piensas.",
  body: "No necesitas apartar una hora para estudiar. Entra, revisa qué está pasando en tu empresa y toma una decisión. Lo importante es volver, reflexionar y seguir practicando.",
  items: [
    { t: "Tu horario", d: "Eliges desde qué hora y hasta qué hora te escribe tu equipo." },
    { t: "En el celular o la computadora", d: "Funciona en el navegador. Si conectas tu correo, tu avance te sigue." },
    { t: "Una racha que ayuda", d: "Sirve para crear el hábito, no para presionarte. Si un día no entras, algunos asuntos vencen, como en cualquier empresa, y mañana sigues." },
  ],
};

/* ---------------- Para quién ---------------- */
export const WHO = {
  title: "No necesitas ser CEO para empezar.",
  body: "Solo necesitas curiosidad por entender cómo se toman las decisiones que mueven una empresa.",
  profiles: [
    { t: "Si estás construyendo tu carrera", d: "Empieza a desarrollar una perspectiva más amplia que la de tu puesto actual." },
    { t: "Si ya diriges un equipo o un área", d: "Practica decisiones que conectan personas, operación y resultados." },
    { t: "Si emprendes o diriges un negocio", d: "Enfrenta situaciones que te ayuden a cuestionar cómo decides." },
  ],
};

/* ---------------- Filosofía ---------------- */
export const PHILOSOPHY = {
  title: "Dirigir es una responsabilidad. Y vale la pena prepararse para ella.",
  body: "Detrás de cada decisión hay personas, recursos y consecuencias. MÊTIS nace de una idea sencilla: el criterio de un líder puede desarrollarse antes de que llegue el momento de ponerlo a prueba.",
  author: "Oziel Leal Montemayor",
  authorRole: "Creador de MÊTIS",
};

/* ---------------- Acceso (no hay cobro operativo: no se publica precio) ---------------- */
export const ACCESS = {
  title: "Empieza hoy, sin tarjeta.",
  body: "No necesitas cuenta para empezar. Tu avance se guarda en este navegador; si conectas tu correo, lo llevas a cualquier dispositivo y apareces en el ranking.",
  points: ["Sin tarjeta y sin formulario largo", "Tres empresas, que se abren conforme avanzas", "Lecciones de mêtis Academy", "Avisos por correo, si los activas"],
  cta: "Comenzar en MÊTIS",
};

/* ---------------- FAQ ---------------- */
export const FAQ: { q: string; a: string }[] = [
  { q: "¿Necesito experiencia en dirección para usar MÊTIS?", a: "No. Al empezar te preguntamos por tu experiencia para ajustar la ayuda y el orden de los casos. Puedes saltarte esas preguntas." },
  { q: "¿Cuánto tiempo necesito al día?", a: "Unos minutos. Cada asunto se lee y se decide en poco tiempo, y tú eliges el horario en que llegan." },
  { q: "¿Qué tipo de decisiones voy a tomar?", a: "De personas, clientes, finanzas, operación, estrategia y ética. Casi ninguna tiene una respuesta perfecta: cada opción tiene un costo." },
  { q: "¿Las decisiones afectan lo que sucede después?", a: "Sí. Mueven los indicadores de tu empresa y cambian cómo te responde cada persona en los casos siguientes." },
  { q: "¿Puedo usar MÊTIS desde mi celular?", a: "Sí, desde el navegador. No necesitas instalar nada. Si conectas tu correo, continúas en cualquier dispositivo." },
  { q: "¿Tiene costo?", a: "Puedes empezar hoy sin tarjeta." },
];

/* ---------------- Cierre y pie ---------------- */
export const CLOSE = { title: "La próxima decisión es tuya.", body: "Empieza a desarrollar el criterio para enfrentarla.", cta: "Comenzar en MÊTIS" };
export const FOOTER = { tagline: "Simulador de decisiones ejecutivas. Dirigir se aprende decidiendo.", place: "Monterrey, N.L., México" };

/** Frases que no queremos en la landing (tono). Se revisan en las pruebas. */
export const BANNED = ["revoluciona", "desbloquea", "transforma tu", "potencia tus", "siguiente nivel", "definitiva", "disruptiv", "game changer", "vanguardia", "powered by", "cancela cuando quieras", "prueba gratis", "próximamente", "en preparación", "más adelante", "muy pronto"];
