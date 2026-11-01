/**
 * mêtis CEO · Banco de casos (P1-C) · arquetipos de decisión.
 *
 * Un arquetipo es una DECISIÓN que se repite en todas las industrias: retirar un producto dudoso, plantarse ante el
 * cliente que aprieta, corregir una meta que empuja a hacer trampa… Lo que cambia entre industrias son los hechos
 * (quién escribe, qué producto, qué cifras), y eso vive en contexts.ts. Aquí vive lo que se aprende:
 *  - las opciones con sus efectos, su estilo y su puntaje (iguales en todas las industrias: la misma decisión pesa
 *    lo mismo, sea una botana, una pieza automotriz o una suscripción);
 *  - la postura de cada rol del caso ante cada opción;
 *  - la bitácora con la herramienta de decisión (premortem, puerta de un solo sentido, mejor alternativa…);
 *  - el precedente real, público y documentado (ver docs/carrera-continua/banco-de-casos.md, con las fuentes).
 *
 * Reglas (las prueba bank.test.ts): ninguna opción domina a otra, toda opción tiene costo y beneficio, la postura
 * solo toca a personas del caso, y ningún texto promete cosas a futuro.
 * Las llaves {cliente}, {clientes}, {producto}, {lote}, {sitio} y {afectado} las llena cada industria.
 */
import type { Area, Axis, Channel, Kpis } from "../types";
import { ARCHETYPES_P1D } from "./archetypes-p1d";

/** Roles del caso. Cada paquete los asigna a su elenco (Cumbre: Finanzas = Lucía; Forja: Finanzas = Marcos…). */
export type Role = "chair" | "board" | "cfo" | "ops" | "sales" | "people" | "assistant" | "frontline" | "client";
export const ROLES: readonly Role[] = ["chair", "board", "cfo", "ops", "sales", "people", "assistant", "frontline", "client"];

export type ArchetypeId =
  | "retiro" | "cliente" | "incentivos" | "ciberataque" | "expansion"
  | "precio" | "recorte" | "proveedor" | "apuesta" | "error"
  // P1-D (archetypes-p1d.ts)
  | "guerra" | "verde" | "trimestre" | "incidente" | "salarios" | "meta" | "foco" | "adaptativo";

export interface ArchOption {
  text: string;
  reply: string[];
  outcome: string;
  effects: Partial<Kpis>;
  style: Partial<Record<Axis, number>>;
  score: 0 | 1 | 2 | 3;
  stance: Partial<Record<Role, number>>;
}

export interface Precedent {
  company: string;
  title: string;
  text: string;
  /** Fuentes públicas (no se muestran en el juego; sirven para la revisión editorial). */
  sources: string[];
}

export interface Archetype {
  id: ArchetypeId;
  /** Nombre de la decisión (para el reporte editorial y el documento del banco). */
  title: string;
  /** Pregunta de fondo que entrena. */
  question: string;
  from: Role;
  involves: Role[];
  channel: Channel;
  ask: string;
  dataTitle: string;
  options: [ArchOption, ArchOption, ArchOption];
  expired: { reply: string[]; outcome: string; effects: Partial<Kpis> };
  lesson: string;
  areas: Area[];
  bitacora: { title: string; text: string; nota: string };
  real: Precedent;
  /** Tres giros: el mismo dilema con otra presión. Permiten volver a un arquetipo sin repetir el caso. */
  twists: [string, string, string];
  /** Etapa mínima de la empresa (índice de COMPANY_STAGES) para que llegue. */
  minStage: number;
  deadlineH?: number;
}

const ARCHETYPES_P1C: readonly Archetype[] = [
  // ─────────────────────────────────────────────── 1 · retirar sin certeza
  {
    id: "retiro",
    title: "Retirar del mercado sin tener certeza",
    question: "¿Actúas con información incompleta cuando el daño posible es irreversible?",
    from: "ops", involves: ["cfo", "sales", "chair"], channel: "llamada",
    ask: "Todavía no hay certeza. ¿Qué decides hoy?",
    dataTitle: "Lo que sabes hoy",
    options: [
      {
        text: "Retiro preventivo de {lote} hoy mismo, con aviso público y a {clientes}, aunque la confirmación todavía no llegue.",
        reply: ["Va. Arranco hoy y te paso el costo en la noche.", "Va a doler, pero nadie podrá decir que escondimos algo."],
        outcome: "Asumes el costo antes de tener certeza. Los clientes y el consejo ven a alguien que pone la seguridad primero.",
        effects: { caja: -6, margen: -3, clientes: 5, consejo: 3 }, style: { horizonte: 2, riesgo: -2, conflicto: 1 }, score: 3,
        stance: { ops: 1, cfo: -1, sales: -1, chair: 1 },
      },
      {
        text: "Retiro dirigido: solo donde hay reportes, aviso discreto a {clientes} y una segunda prueba en 48 horas para decidir lo demás.",
        reply: ["Lo dirigido lo arrancamos hoy.", "Si la segunda prueba sale mal, perdimos dos días. Lo dejo anotado."],
        outcome: "Contienes lo más probable sin parar todo. Si el problema era más grande, llegaste dos días tarde.",
        effects: { caja: -2, clientes: 2, consejo: -1 }, style: { riesgo: -1, foco: -1 }, score: 2,
        stance: { ops: 1, cfo: 1, sales: 1, chair: -1 },
      },
      {
        text: "Esperar la confirmación antes de mover nada: retirar sin certeza asusta a {clientes} y nos puede costar el año.",
        reply: ["Entendido. Esperamos.", "Que conste que yo lo hubiera sacado hoy."],
        outcome: "Cuidas la caja mientras llega el dato. Si el problema era real, quedará claro que lo sabías.",
        effects: { caja: 2, margen: 1, clientes: -5, consejo: -3 }, style: { riesgo: 2, horizonte: -2, conflicto: -1 }, score: 1,
        stance: { ops: -2, cfo: 1, sales: 2, chair: -1 },
      },
    ],
    expired: { reply: ["Nadie decidió y el problema siguió en manos de los clientes."], outcome: "El caso se volvió noticia antes de que tú hablaras.", effects: { clientes: -6, consejo: -5 } },
    lesson: "crisis",
    areas: ["etica", "clientes", "operacion"],
    bitacora: {
      title: "Puertas de un solo sentido",
      text: "Hay decisiones que se pueden revertir (perder dinero, ajustar un plan) y otras que no (que alguien salga lastimado por algo que tú sabías). Cuando el daño posible es irreversible, esperar la certeza también es una decisión, y suele ser la más cara.",
      nota: "Antes de decidir, pregunta: si me equivoco, ¿esto se puede deshacer? Si no se puede, protege primero a las personas y luego a la caja.",
    },
    real: {
      company: "Johnson & Johnson · 1982",
      title: "Retirar antes de que te lo pidan",
      text: "Siete personas murieron en Chicago por cápsulas de Tylenol envenenadas después de salir de fábrica. Sin que la autoridad se lo exigiera, la empresa retiró unos 31 millones de frascos, con un costo cercano a 100 millones de dólares, y regresó con un empaque a prueba de manipulación. Recuperó buena parte de su participación en cerca de un año. En 2015, Blue Bell tardó en retirar helados con listeria; terminó retirando todo, cerrando plantas y despidiendo a más de la tercera parte de su gente.",
      sources: ["https://en.wikipedia.org/wiki/Chicago_Tylenol_murders", "https://www.cdc.gov/listeria/outbreaks/ice-cream-03-15/index.html", "https://www.foodsafetynews.com/2015/05/blue-bell-lays-off-37-percent-of-workforce/"],
    },
    twists: [
      "Además: ya circula en redes una foto del problema y una reportera local pidió una postura antes de las 6.",
      "Además: el presidente del consejo te pidió no anunciar nada hasta la sesión del jueves.",
      "Además: Calidad sospecha que la falla viene de un proveedor, no de tu proceso. Nadie quiere cargar con el costo.",
    ],
    minStage: 1,
    deadlineH: 10,
  },

  // ─────────────────────────────────────────────── 2 · el cliente que aprieta
  {
    id: "cliente",
    title: "El cliente más grande aprieta",
    question: "¿Negocias desde tu mejor alternativa o desde el miedo a perder?",
    from: "client", involves: ["sales", "cfo"], channel: "email",
    ask: "¿Qué le respondes a {cliente}?",
    dataTitle: "Finanzas te armó esto",
    options: [
      {
        text: "Negociar con datos: le muestro lo que gana conmigo, ofrezco algo que a mí me cuesta poco y a él le vale mucho, y llevo listo mi plan B por si se va.",
        reply: ["Recibido. Revisemos su propuesta el jueves.", "Le adelanto que mis metas no cambian, pero los datos de rotación son interesantes."],
        outcome: "Cedes en lo barato, defiendes lo importante y el cliente ve que tienes alternativas.",
        effects: { margen: 2, consejo: 2, clientes: -1, caja: -1 }, style: { conflicto: 1, horizonte: 1 }, score: 3,
        stance: { client: -1, sales: 1, cfo: 1 },
      },
      {
        text: "Aceptar lo que pide: su volumen sostiene la operación y no es momento de arriesgarlo.",
        reply: ["Excelente decisión. Así se construyen las relaciones de largo plazo.", "Le mando el anexo para firma."],
        outcome: "Conservas el volumen, pero el cliente aprendió que presionar funciona. El margen lo pagas tú.",
        effects: { clientes: 5, margen: -4, caja: -2 }, style: { riesgo: -2, conflicto: -2 }, score: 1,
        stance: { client: 2, sales: 1, cfo: -2 },
      },
      {
        text: "Plantarme: o mantiene las condiciones o nos vamos, y aceleramos otros clientes para depender menos de él.",
        reply: ["Lamento que lo vea así.", "Tomaremos nuestras decisiones."],
        outcome: "Defiendes el margen y la dignidad del equipo, pero apuestas una parte grande de la venta.",
        effects: { margen: 2, equipo: 2, clientes: -6, consejo: -1 }, style: { riesgo: 2, conflicto: 2, horizonte: 1 }, score: 1,
        stance: { client: -2, sales: -1, cfo: 1 },
      },
    ],
    expired: { reply: ["Al no tener respuesta, aplicaremos las nuevas condiciones."], outcome: "El silencio se leyó como un sí.", effects: { margen: -4, consejo: -2 } },
    lesson: "negociacion-2",
    areas: ["negociacion", "clientes", "finanzas"],
    bitacora: {
      title: "Tu poder es tu alternativa",
      text: "En una negociación no gana quien grita más, sino quien tiene la mejor alternativa si no hay acuerdo (la MAAN de Fisher y Ury). Un cliente que pesa una tercera parte de tus ventas te pone en desventaja hasta el día en que construyes otra salida.",
      nota: "Antes de sentarte, escribe tu mejor alternativa sin acuerdo. Si no tienes una, tu tarea de este mes es construirla.",
    },
    real: {
      company: "Rubbermaid y Walmart · 1994-1998",
      title: "Cuando el cliente dice que no al aumento",
      text: "La resina, su principal insumo, subió con fuerza. Rubbermaid quiso trasladar el aumento a Walmart, su cliente más grande; Walmart le redujo espacio y favoreció a competidores más baratos. Las ventas y la reputación cayeron y en 1998 aceptó ser comprada por Newell. Su error no fue el precio: fue depender tanto de un cliente sin otra salida.",
      sources: ["https://www.nytimes.com/1998/10/22/business/newell-buying-rubbermaid-in-5.8-billion-deal.html", "https://www.pon.harvard.edu/daily/batna/translate-your-batna-to-the-current-deal/"],
    },
    twists: [
      "Además: la propuesta vence el viernes y ya pidió cotización a un competidor.",
      "Además: tu equipo comercial ya le dijo de palabra que «seguro sí se puede».",
      "Además: el consejo te preguntó hace un mes qué tan dependiente es la empresa de este cliente y no tuviste respuesta.",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 3 · metas que corrompen
  {
    id: "incentivos",
    title: "La meta que empuja a hacer trampa",
    question: "¿Corriges el sistema o solo castigas a las personas?",
    from: "people", involves: ["sales", "cfo"], channel: "email",
    ask: "¿Qué haces con el esquema y con lo que ya pasó?",
    dataTitle: "Lo que se sabe",
    options: [
      {
        text: "Investigo a fondo, rediseño la meta para que premie también calidad y permanencia, y lo explico yo mismo a todo el equipo.",
        reply: ["Gracias. Esto es lo que la gente necesitaba oír de ti.", "Te armo el calendario de sesiones esta semana."],
        outcome: "La meta deja de premiar el atajo. El trimestre se ve peor, pero el número vuelve a decir la verdad.",
        effects: { margen: -3, caja: -1, consejo: 3, clientes: 3 }, style: { horizonte: 2, conflicto: 1, estilo: 1 }, score: 3,
        stance: { people: 2, sales: -1, cfo: -1 },
      },
      {
        text: "Despido a los responsables directos y dejo el esquema como está: funciona para vender.",
        reply: ["Procedo.", "Te advierto: si la meta sigue igual, en seis meses vamos a estar aquí otra vez."],
        outcome: "Hay culpables, pero el incentivo que los empujó sigue intacto. El equipo aprende a esconderlo mejor.",
        effects: { margen: 2, consejo: 1, equipo: -4, clientes: -2 }, style: { conflicto: 2, estilo: -2, horizonte: -1 }, score: 0,
        stance: { people: -1, sales: 1, cfo: 1 },
      },
      {
        text: "Pido una auditoría externa y congelo los bonos mientras tanto, sin anunciar nada hasta tener el reporte.",
        reply: ["Contrato a la firma hoy.", "Los bonos congelados van a sacar ruido. Prepárate."],
        outcome: "Tienes hechos independientes, pero el silencio y los bonos congelados generan rumores.",
        effects: { caja: -2, equipo: -3, consejo: 2, clientes: 1 }, style: { riesgo: -2, conflicto: -1, foco: -1 }, score: 2,
        stance: { people: 1, sales: -2, cfo: -1 },
      },
    ],
    expired: { reply: ["Nadie respondió. El esquema siguió igual otro mes."], outcome: "El problema creció mientras decidías.", effects: { clientes: -4, consejo: -4 } },
    lesson: "cultura-2",
    areas: ["etica", "personas", "cultura"],
    bitacora: {
      title: "Lo que mides es lo que obtienes",
      text: "Cuando una meta se vuelve el objetivo, deja de ser una buena medida (ley de Goodhart). Si el bono pesa la mitad del ingreso y la meta es inalcanzable por la vía honesta, el sistema está diseñando la trampa. Castigar sin cambiar el sistema solo cambia los nombres.",
      nota: "Antes de fijar una meta, pregunta: ¿qué haría alguien desesperado por cumplirla? Si la respuesta te asusta, cambia la meta.",
    },
    real: {
      company: "Wells Fargo · 2016",
      title: "Las cuentas que nadie pidió",
      text: "Con metas agresivas de venta cruzada, empleados del banco abrieron alrededor de dos millones de cuentas y tarjetas sin permiso de los clientes. El banco pagó una multa de 185 millones de dólares, despidió a unas 5,300 personas y su director renunció. Los reguladores señalaron que el origen estaba en las metas, no solo en quienes las cumplieron mal.",
      sources: ["https://www.npr.org/sections/thetwo-way/2016/09/08/493130449/bank-fined-185-million-for-opening-accounts-without-customers-permission", "https://ethicsunwrapped.utexas.edu/case-study/wells-fargo-and-moral-emotions"],
    },
    twists: [
      "Además: uno de los involucrados es la persona con mejores resultados del año.",
      "Además: el cierre del trimestre es en diez días y el consejo espera el número de siempre.",
      "Además: quien denunció pidió que no se sepa su nombre; teme represalias.",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 4 · ciberataque
  {
    id: "ciberataque",
    title: "Ciberataque y rescate",
    question: "¿Qué dices, a quién y cuándo, cuando todavía no sabes todo?",
    from: "ops", involves: ["cfo", "client", "board"], channel: "llamada",
    ask: "Piden un rescate. ¿Qué decides en las próximas horas?",
    dataTitle: "Estado a esta hora",
    options: [
      {
        text: "No pago. Activo la contingencia, operamos en manual, aviso a {clientes} lo que sé y lo que no sé, y reconstruimos desde respaldos.",
        reply: ["De acuerdo. Armo turnos para operar en papel.", "Te paso un mensaje para clientes en una hora: qué pasó, qué no sabemos y cuándo volvemos a escribir."],
        outcome: "Varios días caros y lentos, pero los clientes se enteran por ti y nadie te puede chantajear otra vez.",
        effects: { caja: -4, margen: -2, clientes: 2, consejo: 2 }, style: { horizonte: 2, riesgo: -1, conflicto: 1 }, score: 3,
        stance: { ops: 1, cfo: -1, client: 1, board: 1 },
      },
      {
        text: "Pago el rescate para recuperar todo en horas y comunico solo cuando ya esté funcionando.",
        reply: ["Ok. Consigo la forma de pago.", "Nadie nos garantiza que nos entreguen la llave ni que no vuelvan."],
        outcome: "Vuelves rápido, si cumplen. El consejo se entera después y queda la duda legal y de si volverán.",
        effects: { caja: -5, clientes: 3, consejo: -4 }, style: { riesgo: 2, horizonte: -2, conflicto: -1 }, score: 1,
        stance: { ops: 1, cfo: -2, client: 1, board: -2 },
      },
      {
        text: "Contrato un equipo forense y no digo nada hacia afuera hasta conocer el alcance; adentro, silencio total.",
        reply: ["Entendido. Nadie habla.", "Los clientes ya están llamando. ¿Qué les decimos?"],
        outcome: "Ganas control técnico, pero los clientes y tu gente llenan el silencio con lo peor.",
        effects: { caja: -2, consejo: 2, clientes: -4, equipo: -2 }, style: { riesgo: -2, conflicto: -2, estilo: -1 }, score: 1,
        stance: { ops: -1, cfo: 1, client: -2, board: 1 },
      },
    ],
    expired: { reply: ["Las horas pasaron sin una decisión."], outcome: "La operación se detuvo y los clientes se enteraron por otros.", effects: { clientes: -5, caja: -4 } },
    lesson: "comunicacion-2",
    areas: ["operacion", "comunicacion", "finanzas"],
    bitacora: {
      title: "Lo que sé, lo que no sé y cuándo vuelvo a hablar",
      text: "En una crisis, la información llega a pedazos. El error más común es esperar a tenerla completa para comunicar: para entonces, otros ya contaron la historia. Una buena comunicación de crisis dice qué pasó, qué no se sabe todavía, qué se está haciendo y a qué hora habrá otra actualización.",
      nota: "El silencio en una crisis no es neutral: lo llenan otros, y casi siempre con lo peor.",
    },
    real: {
      company: "Maersk · 2017",
      title: "Reconstruir en diez días",
      text: "El virus NotPetya cifró los sistemas de la naviera más grande del mundo. Maersk no pagó: operó puertos con procesos manuales, informó a clientes y mercados desde el primer día y reinstaló su red en unos diez días. El ataque le costó alrededor de 300 millones de dólares, pero su manejo abierto se volvió un ejemplo para la industria.",
      sources: ["https://www.cnbc.com/2017/08/16/maersk-says-notpetya-cyberattack-could-cost-300-million.html"],
    },
    twists: [
      "Además: los atacantes dicen que también se llevaron datos de clientes y amenazan con publicarlos.",
      "Además: es fin de mes y hoy se cobra la mayor parte de la facturación.",
      "Además: la última prueba de respaldos se hizo hace más de un año.",
    ],
    minStage: 1,
    deadlineH: 8,
  },

  // ─────────────────────────────────────────────── 5 · crecer de golpe
  {
    id: "expansion",
    title: "La expansión que no puede esperar",
    question: "¿Escalas antes de saber que funciona?",
    from: "board", involves: ["cfo", "ops", "chair"], channel: "email",
    ask: "¿Cómo respondes a la propuesta de crecer?",
    dataTitle: "Los números de la propuesta",
    options: [
      {
        text: "Piloto primero: un solo frente durante tres meses, con métricas de éxito acordadas antes de empezar. Si funciona, escalo.",
        reply: ["Me parece prudente, aunque temo que la ventana se cierre.", "Dime qué métricas y te digo si el consejo las compra."],
        outcome: "Arriesgas poco y aprendes rápido. Algunos en el consejo sienten que perdiste impulso.",
        effects: { caja: -2, consejo: -2, margen: 1, equipo: 2 }, style: { riesgo: -1, horizonte: 1, estilo: 1 }, score: 3,
        stance: { board: -1, cfo: 1, ops: 1, chair: 1 },
      },
      {
        text: "Vamos con todo: la ventana es ahora. Lanzamos completo con financiamiento.",
        reply: ["¡Eso! Así se crece.", "Finanzas ya me escribió preocupada por la deuda. Te la dejo a ti."],
        outcome: "Si sale, das un salto. Si los datos o la operación fallan, lo vas a descubrir con todo el dinero ya puesto.",
        effects: { caja: -7, clientes: 5, consejo: 3, equipo: -3 }, style: { riesgo: 2, horizonte: 1, conflicto: 1 }, score: 1,
        stance: { board: 2, cfo: -2, ops: -1, chair: -1 },
      },
      {
        text: "No ahora: primero arreglo la operación de hoy. Lo reevaluamos cuando cumplamos el plan del año.",
        reply: ["Entiendo, aunque no lo comparto.", "Que conste que la oportunidad no va a esperar."],
        outcome: "Proteges la caja y el foco. Quizá dejes pasar la oportunidad del año.",
        effects: { caja: 2, margen: 2, consejo: -3, clientes: -2 }, style: { riesgo: -2, foco: -1, horizonte: -1 }, score: 2,
        stance: { board: -2, cfo: 2, ops: 1, chair: 1 },
      },
    ],
    expired: { reply: ["Sin respuesta, la oportunidad se la llevó otro."], outcome: "No decidir también fue decidir.", effects: { consejo: -4, clientes: -2 } },
    lesson: "innovacion-2",
    areas: ["estrategia", "finanzas", "operacion"],
    bitacora: {
      title: "El premortem",
      text: "Gary Klein propone imaginar que ya pasó un año y el proyecto fracasó, y pedirle a cada persona que escriba por qué. Esa simple inversión destapa riesgos que nadie se atreve a decir en una junta entusiasta. Un piloto bien diseñado responde esas preguntas con poco dinero.",
      nota: "Antes de una apuesta grande, haz el premortem: «ya fracasó, ¿por qué?». Lo que salga es tu lista de cosas por probar primero.",
    },
    real: {
      company: "Target en Canadá · 2013-2015",
      title: "Abrir todo de golpe",
      text: "Target abrió más de 120 tiendas en Canadá en menos de un año. Los datos de inventario del sistema nuevo tenían errores, los anaqueles quedaron vacíos y los precios no eran los que el cliente esperaba. En 2015 cerró las 133 tiendas, con unos 17,600 empleos perdidos y pérdidas de miles de millones de dólares.",
      sources: ["https://en.wikipedia.org/wiki/Target_Canada", "https://www.panorama-consulting.com/target-canada-erp-failure/"],
    },
    twists: [
      "Además: el que propone la expansión es el accionista que más pesa en el consejo.",
      "Además: tu Director de Operaciones te dijo en privado que el equipo no aguanta otro frente.",
      "Además: un competidor anunció ayer algo parecido.",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 6 · subir precio
  {
    id: "precio",
    title: "Subir precios sin romper la confianza",
    question: "¿Piensas en cómo lo va a vivir quien paga, no solo en el número?",
    from: "cfo", involves: ["sales", "board"], channel: "email",
    ask: "¿Cómo haces el ajuste?",
    dataTitle: "El tamaño del problema",
    options: [
      {
        text: "Subo lo necesario, escalonado, lo anuncio con anticipación y explico por qué; a los clientes clave se los digo en persona.",
        reply: ["Me parece bien. Te armo el escalonado.", "Comercial va a necesitar un argumento claro. Lo preparamos juntos."],
        outcome: "Recuperas margen sin sorpresas. Algunos clientes se quejan, pero casi ninguno se siente engañado.",
        effects: { margen: 4, caja: 1, clientes: -2, equipo: -1 }, style: { horizonte: 1, conflicto: 1, estilo: 1 }, score: 3,
        stance: { cfo: 1, sales: 1, board: -1 },
      },
      {
        text: "Subo todo de un golpe el lunes, sin aviso: la gente se acostumbra.",
        reply: ["Rápido y limpio en los números.", "Comercial va a recibir las llamadas. Yo no."],
        outcome: "El margen sube de inmediato y la confianza baja igual de rápido. Los clientes se enteran por la factura.",
        effects: { margen: 6, caja: 2, clientes: -7, consejo: -1 }, style: { riesgo: 2, conflicto: 2, estilo: -2, horizonte: -1 }, score: 0,
        stance: { cfo: 2, sales: -2, board: 1 },
      },
      {
        text: "No subo: absorbo el costo este trimestre y busco ahorros internos.",
        reply: ["Lo intento, pero los ahorros no alcanzan para todo.", "El margen de este trimestre se va a ver mal."],
        outcome: "Cuidas a los clientes, pero el problema solo se aplaza y el margen paga la factura.",
        effects: { clientes: 3, margen: -4, consejo: -2 }, style: { riesgo: -1, conflicto: -2, foco: 1 }, score: 1,
        stance: { cfo: -2, sales: 2, board: -1 },
      },
    ],
    expired: { reply: ["Sin decisión, la lista de precios quedó igual."], outcome: "El costo siguió subiendo y el margen lo absorbió sin plan.", effects: { margen: -4 } },
    lesson: "comunicacion",
    areas: ["clientes", "comunicacion", "finanzas"],
    bitacora: {
      title: "La forma también es el precio",
      text: "Un aumento justificado puede destruir confianza si llega por sorpresa, y uno difícil puede aceptarse si se explica con anticipación y respeto. El cliente no solo paga el número: paga la sensación de que lo tratas como socio o como cartera.",
      nota: "Antes de un cambio que afecta a clientes, escribe el mensaje que ellos van a leer. Si no lo puedes defender en voz alta, el plan no está listo.",
    },
    real: {
      company: "Netflix · 2011",
      title: "Qwikster",
      text: "Netflix subió hasta 60% el precio a quienes tenían DVD y streaming, y semanas después anunció que separaría el negocio de DVD con otra marca. En un trimestre perdió unos 800 mil suscriptores. Reed Hastings se disculpó públicamente y canceló la separación en menos de un mes. La estrategia era razonable; la forma de comunicarla, no.",
      sources: ["https://www.cnet.com/tech/services-and-software/netflixs-lost-year-the-inside-story-of-the-price-hike-train-wreck/"],
    },
    twists: [
      "Además: un competidor no ha subido y lo está anunciando.",
      "Además: tu cliente más grande renueva contrato este mes.",
      "Además: el año pasado ya subiste dos veces.",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 7 · recortar
  {
    id: "recorte",
    title: "Crecimos de más: hay que ajustar",
    question: "¿Cómo haces lo difícil sin destruir la confianza de los que se quedan?",
    from: "cfo", involves: ["people", "frontline"], channel: "email",
    ask: "¿Cómo ajustas la plantilla?",
    dataTitle: "La situación",
    options: [
      {
        text: "Un solo ajuste, suficiente y bien hecho: lo anuncio yo, con razones y cifras, liquidación por encima de la ley y apoyo para recolocarse.",
        reply: ["Es lo más duro y lo más limpio.", "Te preparo los números de liquidación y el plan de apoyo."],
        outcome: "Duele una vez y se explica. Los que se quedan ven cómo trataste a los que se fueron.",
        effects: { margen: 3, consejo: 2, caja: -2, equipo: -3 }, style: { horizonte: 2, conflicto: 2 }, score: 3,
        stance: { cfo: 1, people: 1, frontline: -1 },
      },
      {
        text: "Ajustes pequeños cada mes, sin anunciarlos, para no alarmar a nadie.",
        reply: ["Se puede hacer.", "Te aviso que la gente ya cuenta las sillas vacías."],
        outcome: "Nadie sabe cuándo le toca. El miedo se queda y los mejores son los primeros en irse.",
        effects: { caja: 2, margen: 1, equipo: -6 }, style: { conflicto: -2, riesgo: -1, horizonte: -1 }, score: 0,
        stance: { cfo: 1, people: -2, frontline: -2 },
      },
      {
        text: "No recorto: congelo contrataciones, bajo los sueldos directivos empezando por el mío y apuesto a que la venta crezca.",
        reply: ["Es un gesto que la gente va a valorar.", "Los números no cierran solo con eso. Te doy tres meses antes de volver a hablar."],
        outcome: "Ganas confianza y tiempo, pero si la venta no llega, el ajuste será más grande.",
        effects: { equipo: 4, caja: -3, consejo: -3 }, style: { riesgo: 1, conflicto: -1, foco: 2 }, score: 2,
        stance: { cfo: -2, people: 1, frontline: 2 },
      },
    ],
    expired: { reply: ["La decisión se pospuso otro mes."], outcome: "La caja siguió bajando y el rumor creció.", effects: { caja: -4, equipo: -3 } },
    lesson: "conversaciones-2",
    areas: ["personas", "finanzas", "comunicacion"],
    bitacora: {
      title: "Cortar una vez, explicar siempre",
      text: "Los ajustes en goteo son los más dañinos: cada mes la gente se pregunta si sigue, y los mejores, que tienen opciones, se van. Un ajuste único, suficiente y explicado con respeto permite que la organización vuelva a enfocarse. Cómo tratas a quien se va es el mensaje más fuerte para quien se queda.",
      nota: "Si tienes que hacer algo doloroso, hazlo una vez, con la cifra completa, y en persona.",
    },
    real: {
      company: "Airbnb · 2020",
      title: "La carta de Brian Chesky",
      text: "Con los viajes detenidos por la pandemia, Airbnb despidió a cerca de 1,900 personas, una cuarta parte de la empresa. Su director explicó las razones con cifras en una carta abierta, dio al menos 14 semanas de sueldo, dejó que se quedaran con su computadora y armó un equipo para ayudarles a encontrar trabajo. Antes, Buffer había despedido al 11% de su equipo tras contratar de más y lo explicó públicamente.",
      sources: ["https://news.airbnb.com/a-message-from-co-founder-and-ceo-brian-chesky/", "https://buffer.com/resources/layoffs-and-moving-forward/"],
    },
    twists: [
      "Además: el rumor ya corre y dos de tus mejores personas tienen ofertas afuera.",
      "Además: el banco revisa tus razones financieras en seis semanas.",
      "Además: entre los puestos que sobran hay personas con muchos años en la empresa.",
    ],
    minStage: 1,
  },

  // ─────────────────────────────────────────────── 8 · proveedor único
  {
    id: "proveedor",
    title: "Se cayó tu proveedor único",
    question: "¿Resuelves la urgencia sin dejar la misma fragilidad?",
    from: "ops", involves: ["cfo", "client"], channel: "whatsapp",
    ask: "Te quedan pocos días. ¿Qué haces?",
    dataTitle: "Inventario y opciones",
    options: [
      {
        text: "Ayudo al proveedor a recuperarse (ingeniería, gente y un anticipo) y en paralelo califico una segunda fuente para lo crítico.",
        reply: ["Mando a dos ingenieros hoy.", "La segunda fuente tarda, pero ya era hora."],
        outcome: "Cuesta caja hoy, pero el proveedor vuelve antes y dejas de depender de uno solo.",
        effects: { caja: -4, margen: -1, clientes: 2, equipo: 1 }, style: { horizonte: 2, estilo: 1, riesgo: -1 }, score: 3,
        stance: { ops: 1, cfo: -1, client: 1 },
      },
      {
        text: "Compro de emergencia a quien tenga, al precio que sea, para no fallarle a {cliente}.",
        reply: ["Consigo lo que haya.", "Va a salir caro y la calidad no la conozco."],
        outcome: "Cumples a tiempo y pagas el sobreprecio. Cuando pase la urgencia, la fragilidad sigue igual.",
        effects: { margen: -5, caja: -2, clientes: 4 }, style: { horizonte: -2, riesgo: 1, conflicto: 1 }, score: 2,
        stance: { ops: -1, cfo: -2, client: 2 },
      },
      {
        text: "Aviso a {cliente} que habrá retraso y aprovecho para renegociar con un proveedor más barato.",
        reply: ["Ok, le escribo al cliente.", "Ojo: el cliente no va a olvidar este retraso."],
        outcome: "Cuidas el margen, pero le fallas al cliente justo cuando más te necesitaba.",
        effects: { margen: 3, caja: 1, clientes: -6, consejo: -1 }, style: { riesgo: 1, conflicto: -1, horizonte: -1 }, score: 1,
        stance: { ops: 1, cfo: 2, client: -2 },
      },
    ],
    expired: { reply: ["Sin decisión, el inventario se terminó."], outcome: "La operación se detuvo y el cliente se enteró por los retrasos.", effects: { clientes: -6, caja: -2 } },
    lesson: "estrategia-2",
    areas: ["operacion", "negociacion", "finanzas"],
    bitacora: {
      title: "La eficiencia que te vuelve frágil",
      text: "Un solo proveedor, el más barato, es eficiente hasta el día que falla. Las cadenas que mejor resisten no son las que nunca fallan, sino las que tienen relaciones de confianza para recuperarse rápido y una segunda opción para lo que no puede faltar.",
      nota: "Haz una lista de lo que no puede faltar y pregunta: si mañana desaparece quien me lo da, ¿cuántos días aguanto?",
    },
    real: {
      company: "Toyota y Aisin · 1997",
      title: "El incendio de las válvulas",
      text: "Un incendio destruyó la planta de Aisin que fabricaba casi todas las válvulas de frenos de Toyota. Las plantas de Toyota pararon, pero decenas de empresas de su red, muchas sin experiencia en esa pieza, improvisaron la producción con los planos de Aisin. En cerca de una semana Toyota volvió a producir. La confianza construida durante años fue la verdadera reserva.",
      sources: ["https://sloanreview.mit.edu/article/the-toyota-group-and-the-aisin-fire/", "https://www.supplychaindive.com/news/toyota-supply-chain-lessons-2011-tohoku-earthquake/"],
    },
    twists: [
      "Además: el proveedor es una empresa familiar con la que trabajas hace veinte años.",
      "Además: la segunda fuente que existe es de un competidor directo de tu cliente.",
      "Además: Compras te recuerda que el ahorro por tener un solo proveedor fue parte del bono del año pasado.",
    ],
    minStage: 1,
    deadlineH: 12,
  },

  // ─────────────────────────────────────────────── 9 · canibalizar
  {
    id: "apuesta",
    title: "Lo nuevo amenaza a lo que hoy da de comer",
    question: "¿Proteges el negocio de hoy o construyes el de mañana aunque compitan?",
    from: "board", involves: ["chair", "cfo"], channel: "email",
    ask: "¿Qué haces con la apuesta?",
    dataTitle: "El mercado",
    options: [
      {
        text: "La lanzo como unidad aparte, con presupuesto limitado, su propio equipo y permiso para competir contra lo actual.",
        reply: ["Por fin. Te propongo quién la puede llevar.", "Va a haber fricción con el negocio actual; hay que protegerla."],
        outcome: "Arriesgas margen de hoy para no quedarte fuera mañana. El negocio actual se siente amenazado.",
        effects: { caja: -4, margen: -2, clientes: 3, consejo: 1 }, style: { horizonte: 2, riesgo: 1 }, score: 3,
        stance: { board: 2, chair: -1, cfo: -1 },
      },
      {
        text: "La pruebo dentro del área actual, sin estructura propia, para no distraer al negocio que paga las cuentas.",
        reply: ["Es algo.", "Aunque te advierto: dentro del área actual, lo nuevo siempre pierde contra lo urgente."],
        outcome: "Gastas poco y aprendes poco. Lo urgente le gana a lo nuevo casi siempre.",
        effects: { caja: -1, margen: 1, clientes: 1, equipo: -2 }, style: { riesgo: -1, foco: -1 }, score: 2,
        stance: { board: -1, chair: 1, cfo: 1 },
      },
      {
        text: "La descarto por ahora: protejo el margen del negocio actual y la reviso dentro de un año.",
        reply: ["Muy bien. Lo que funciona no se toca.", "Un año es mucho tiempo en este mercado."],
        outcome: "El trimestre se ve bien. Si el mercado cambia rápido, llegarás tarde.",
        effects: { margen: 3, caja: 2, clientes: -3, consejo: -2 }, style: { horizonte: -2, riesgo: -2 }, score: 1,
        stance: { board: -2, chair: 2, cfo: 1 },
      },
    ],
    expired: { reply: ["Nadie decidió; la propuesta se quedó en un cajón."], outcome: "Otros sí se movieron.", effects: { consejo: -3, clientes: -2 } },
    lesson: "innovacion",
    areas: ["estrategia", "finanzas", "clientes"],
    bitacora: {
      title: "El dilema del innovador",
      text: "Clayton Christensen mostró que las empresas exitosas no fracasan por tontas, sino por hacer bien lo que les pide su mejor cliente de hoy. Lo nuevo empieza pequeño, con peor margen, y por eso pierde siempre contra lo actual en la misma junta. Por eso suele necesitar su propio espacio, presupuesto y métricas.",
      nota: "Pregunta: si un competidor nuevo lanzara esto mañana, ¿me preocuparía? Si la respuesta es sí, mejor que lo lance yo.",
    },
    real: {
      company: "Kodak e Intel · 1975 y 1985",
      title: "Inventarlo y no usarlo",
      text: "En 1975 un ingeniero de Kodak, Steve Sasson, construyó la primera cámara digital. La empresa la vio como amenaza a su negocio de película, que dejaba mucho margen, y en 2012 se declaró en quiebra. En 1985, Intel tomó la decisión contraria: Andy Grove y Gordon Moore se preguntaron qué haría un director nuevo, salieron de las memorias que habían fundado la empresa y apostaron todo a los microprocesadores.",
      sources: ["https://quartr.com/insights/edge/the-dilemma-that-brought-down-kodak", "https://commoncog.com/c/cases/intel-transition-memories-processors"],
    },
    twists: [
      "Además: el fundador construyó el negocio actual con sus manos y lo siente como un ataque.",
      "Además: un equipo joven ya lo está probando por su cuenta, fuera de horario.",
      "Además: el negocio actual tuvo su mejor año, lo que hace más difícil explicar por qué cambiar.",
    ],
    minStage: 2,
  },

  // ─────────────────────────────────────────────── 10 · el error propio
  {
    id: "error",
    title: "Un error nuestro le pegó a alguien",
    question: "¿Buscas al culpable o arreglas el sistema que permitió el error?",
    from: "ops", involves: ["people", "client"], channel: "whatsapp",
    ask: "La persona que se equivocó está deshecha. ¿Qué haces?",
    dataTitle: "Lo que pasó",
    options: [
      {
        text: "Lo reconozco ante {afectado} sin rodeos, reparo el daño y hago una revisión sin culpables para arreglar el proceso que permitió el error.",
        reply: ["Gracias. Esto va a hacer que la gente avise antes, no que esconda.", "Te armo la revisión para el lunes."],
        outcome: "Pagas el daño y das la cara. El equipo aprende que avisar a tiempo es lo correcto.",
        effects: { caja: -3, consejo: -1, equipo: 3, clientes: 2 }, style: { horizonte: 2, estilo: 1, conflicto: 1 }, score: 3,
        stance: { ops: 1, people: 2, client: 1 },
      },
      {
        text: "Lo arreglo en silencio y digo que fue una falla externa; adentro, sanción a la persona.",
        reply: ["Se hace.", "Te digo lo que va a pasar: la próxima vez nadie nos va a avisar."],
        outcome: "Hoy no pasa nada. Mañana la gente esconde los errores, y una mentira descubierta cuesta más que el error.",
        effects: { caja: -1, clientes: 1, equipo: -5 }, style: { conflicto: -2, estilo: -2 }, score: 0,
        stance: { ops: -1, people: -2, client: 1 },
      },
      {
        text: "Lo reconozco ante {afectado}, pero la persona sale de la empresa: tiene que haber una consecuencia visible.",
        reply: ["Entendido. Hablo con ella hoy.", "El equipo lo va a resentir: fue un error, no una falta."],
        outcome: "El afectado ve una consecuencia; tu gente aprende que equivocarse cuesta el trabajo.",
        effects: { clientes: 3, consejo: 2, equipo: -4, caja: -2 }, style: { conflicto: 2, estilo: -1, horizonte: -1 }, score: 1,
        stance: { ops: -2, people: -1, client: 2 },
      },
    ],
    expired: { reply: ["Nadie respondió y el afectado se enteró por su cuenta."], outcome: "El error se volvió desconfianza.", effects: { clientes: -5, equipo: -2 } },
    lesson: "cultura",
    areas: ["cultura", "operacion", "clientes"],
    bitacora: {
      title: "Revisión sin culpables",
      text: "Las organizaciones que aprenden de sus errores separan dos preguntas: qué pasó y quién tiene la culpa. Si la segunda manda, la gente esconde los errores y el sistema que los permitió sigue igual. Una revisión sin culpables busca el hueco del proceso; la responsabilidad del líder es dar la cara afuera y proteger el aprendizaje adentro.",
      nota: "Pregunta «¿qué permitió que esto pasara?» antes que «¿quién fue?». Si la respuesta es «una persona cansada sin un control», el problema es tuyo.",
    },
    real: {
      company: "GitLab · 2017",
      title: "Borrar producción y contarlo en vivo",
      text: "Un ingeniero borró por error una base de datos de producción y la empresa perdió unas seis horas de datos. GitLab transmitió la recuperación en vivo, publicó una revisión detallada sin señalar a la persona y corrigió los respaldos que no funcionaban. En contraste, en 2012 Knight Capital perdió 440 millones de dólares en 45 minutos por un despliegue sin controles: el error humano encontró un proceso sin red.",
      sources: ["https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/", "https://www.prmia.org/common/Uploaded%20files/Knight%20Capital%20Case%20Study.pdf"],
    },
    twists: [
      "Además: la persona que se equivocó tiene años en la empresa y una hoja impecable.",
      "Además: el afectado todavía no se ha dado cuenta.",
      "Además: es la segunda vez en el año que pasa algo parecido en el mismo punto del proceso.",
    ],
    minStage: 1,
  },
];

/** Las diez decisiones de P1-C y las ocho de P1-D (mismas reglas, mismo generador). */
export const ARCHETYPES: readonly Archetype[] = [...ARCHETYPES_P1C, ...ARCHETYPES_P1D];

export const archetypeById = (id: string): Archetype | undefined => ARCHETYPES.find((a) => a.id === id);
