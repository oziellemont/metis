/**
 * Caso largo · Capítulos «Acelerar» y «Escalar» · Botanas Cumbre · «Un fondo quiere entrar».
 *
 * Un fondo ofrece $120 M por 30% de la empresa para construir una segunda planta. Don Ramiro duda: es la empresa
 * de su familia. Se decide cómo valorar la oferta, qué negociar, cómo llevarlo al fundador y qué hacer si el fondo
 * pide control. Entre 3 y 4 decisiones.
 *
 * Modelo (todo declarado):
 *  - Caja: +4 si entra el capital; +2 si se financia con deuda; 0 si no se crece.
 *  - Consejo: +2 si el fundador apoya la decisión; −3 si se le presenta como hecho consumado; −1 si se pierde la
 *    segunda planta por no decidir.
 *  - Equipo: +1 con un plan de transición que cuide a la planta actual.
 *  - Margen: −1 con deuda (intereses); −1 si se cede control operativo.
 *  - Clientes: +2 si la segunda planta se construye (abasto para crecer); −1 si no se crece.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesSocio(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const entra = has(run, "acepta") && !has(run, "rechaza");
  const deuda = has(run, "deuda");
  const crece = entra || deuda;
  const pct = run.terms.participacion ?? 30;
  const headline = entra
    ? has(run, "control") ? `El fondo entra con ${pct}% y un asiento con veto sobre la operación: hay dinero para la planta, pero ya no decides solo.`
      : `El fondo entra con ${pct}% y dos asientos en el consejo. La segunda planta arranca con el respaldo de la familia.`
    : deuda ? "Se construye la segunda planta con un crédito: la familia conserva el 100%, a cambio de pagar intereses."
      : "No entra el fondo y no se construye la segunda planta. La empresa sigue como estaba, con la capacidad al tope.";
  const agreement: [string, string][] = [
    ["Capital", entra ? `${pct}% al fondo por $120 M` : deuda ? "Crédito de $90 M a 7 años" : "Sin socio ni crédito"],
    ["Gobierno", entra ? (has(run, "control") ? "Veto del fondo sobre la operación" : "Dos asientos; decisiones clave por mayoría calificada") : "Sin cambios"],
    ["Fundador", has(run, "ramiro_apoya") ? "Apoya la decisión" : has(run, "consumado") ? "Se enteró con la decisión tomada" : "Con dudas"],
  ];
  const economics: [string, string][] = [
    ["Dinero para la planta", entra ? "$120 M de capital" : deuda ? "$90 M de crédito" : "$0"],
    ["Costo", entra ? `${pct}% de las utilidades futuras` : deuda ? "Intereses de $9 M al año" : "Capacidad al tope"],
  ];
  const kpi: RulesResult["kpi"] = [];
  if (entra) kpi.push({ key: "caja", delta: 4, why: "Entra capital para la segunda planta sin deuda." });
  if (deuda) kpi.push({ key: "caja", delta: 2, why: "El crédito paga la planta, pero hay que servirlo cada mes." });
  if (deuda) kpi.push({ key: "margen", delta: -1, why: "Los intereses del crédito ($9 M al año) bajan el margen." });
  if (has(run, "control")) kpi.push({ key: "margen", delta: -1, why: "Con veto del fondo, cada decisión operativa tarda más y cuesta más." });
  if (crece) kpi.push({ key: "clientes", delta: 2, why: "Con la segunda planta hay abasto para los pedidos que hoy se rechazan." });
  else kpi.push({ key: "clientes", delta: -1, why: "Sin capacidad nueva, se siguen rechazando pedidos." });
  if (has(run, "ramiro_apoya")) kpi.push({ key: "consejo", delta: 2, why: "El fundador apoya la decisión y el consejo vota unido." });
  if (has(run, "consumado")) kpi.push({ key: "consejo", delta: -3, why: "El fundador se enteró con la decisión tomada: el consejo lo ve como una falta de respeto al dueño." });
  if (!crece && !has(run, "consumado")) kpi.push({ key: "consejo", delta: -1, why: "La oportunidad de crecer se fue sin una alternativa." });
  if (has(run, "transicion")) kpi.push({ key: "equipo", delta: 1, why: "La planta actual sabe qué cambia y qué no con el socio nuevo." });
  const risks = [
    ...(has(run, "control") ? [{ id: "so-veto", text: "El veto del fondo puede frenar decisiones de operación en los próximos años.", owner: "ceo" }] : []),
    ...(deuda ? [{ id: "so-deuda", text: "Si las ventas bajan, el crédito aprieta la caja.", owner: "lucia" }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { entra: entra ? 1 : 0, deuda: deuda ? 1 : 0, participacion: pct } };
}

export const SOCIO: EpisodeSpec = {
  contract: 1, id: "socio", version: "1.0.0", approval: "aprobado",
  company: "cumbre", industry: "Alimentos y botanas", title: "Un fondo quiere entrar", subject: "Oferta de capital para la segunda planta",
  from: "lucia", counterpart: "ramiro", channel: "email", areas: ["finanzas", "estrategia", "alineacion"], cast: ["lucia", "ramiro", "carla", "javier"],
  lesson: "consejo", minutes: 7,
  concept: {
    title: "El dinero de un socio se paga con algo más que acciones: con gobierno",
    text: "Una oferta de capital no se evalúa solo por el precio. Importa qué derechos trae, quién decide qué y cómo lo vive el dueño. Hay alternativas (deuda, crecer más lento) y cada una tiene un costo distinto. Y en una empresa familiar, el fundador no se entera al final: se construye la decisión con él.",
    nota: "Compara alternativas con su costo real, negocia derechos y no solo precio, y nunca presentes al dueño un hecho consumado.",
  },
  briefing: {
    message: [
      "Correo de Lucía, Finanzas · 9:05",
      "«Nos llegó una carta de intención de un fondo: $120 M por el 30% de la empresa, para construir la segunda planta.»",
      "«Quieren respuesta en tres semanas. Don Ramiro todavía no sabe. ¿Cómo lo manejamos?»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Oferta", "$120 M por 30%"], ["Para qué", "Segunda planta"], ["Plazo", "3 semanas"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "capacidad", label: "¿Qué tan llena está la planta?", keywords: ["capacidad", "planta", "llena", "pedidos", "rechaz", "tope"], source: "javier",
        answer: "Javier: estamos al 94%. El trimestre pasado rechazamos pedidos por $40 M porque no alcanzaba la línea." },
      { id: "deuda", label: "¿Podríamos pedir un crédito?", keywords: ["credito", "deuda", "banco", "prestamo", "financiar"], source: "lucia",
        answer: "Lucía: el banco nos presta hasta $90 M a 7 años, con intereses de unos $9 M al año. Alcanza para una planta más chica." },
      { id: "terminos", label: "¿Qué piden además del 30%?", keywords: ["terminos", "piden", "derechos", "veto", "asientos", "condiciones", "control"], source: "lucia",
        answer: "Lucía: dos asientos en el consejo y veto sobre presupuesto, deuda y venta de la empresa. Lo del veto es negociable, según su carta." },
      { id: "valor", label: "¿Es buen precio?", keywords: ["precio", "valor", "valuacion", "vale", "multiplo", "barato", "caro"], source: "carla",
        answer: "Carla: equivale a 7 veces la utilidad de operación. Para el sector es un precio razonable, no regalado." },
    ],
    unknowns: [
      { id: "otros", keywords: ["otro fondo", "otros fondos", "otra oferta", "mas ofertas", "competencia"], answer: "No hay otra oferta sobre la mesa. Buscarla tomaría meses." },
    ],
  },
  advisors: [
    { id: "carla", role: "Consejera independiente", personality: "Rigurosa, conoce de gobierno corporativo.", interests: "Que la empresa crezca sin romper a la familia.", relations: "Don Ramiro la escucha.", knows: ["valor", "terminos"],
      view: [{ text: [
        "El precio está bien. Lo delicado es el veto: con veto sobre presupuesto, ya no diriges solo.",
        "Y a Don Ramiro no lo sorprendas. Si se entera por otro lado, se acaba la conversación.",
      ] }] },
    { id: "lucia", role: "Directora de Finanzas", personality: "Precisa, cuida la caja.", interests: "Crecer sin poner en riesgo la caja.", relations: "Recibió la carta.", knows: ["deuda", "terminos"],
      view: [{ text: [
        "Hay otra vía: el banco presta $90 M. Alcanza para una planta más chica y la familia conserva todo.",
        "Pero cada mes hay que pagar, venda o no venda.",
      ] }] },
    { id: "javier", role: "Gerente de Planta", personality: "Práctico, de pocas palabras.", interests: "Que la planta actual no se descuide.", relations: "Lleva la capacidad.", knows: ["capacidad"],
      view: [{ text: [
        "Lo que sé es que ya no cabemos. Cada semana digo que no a un pedido.",
        "Lo que me preocupa es que la gente piense que la planta vieja se va a cerrar.",
      ] }] },
  ],
  terms: {
    participacion: { label: "Participación del fondo", unit: "%", initial: 30 },
  },
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "Valorar", who: "lucia", channel: "junta",
      say: [{ text: ["Lucía trae la carta impresa y la pone sobre la mesa.", "«Antes de hablar con nadie, ¿qué hacemos con esto?»"] }],
      ask: "¿Cómo valoras la oferta?", freeText: true,
      strategies: [
        { id: "comparar", text: "Comparar tres caminos con su costo real: el fondo, un crédito del banco y crecer más lento sin dinero de fuera.", cues: ["comparar", "tres caminos", "credito", "banco", "alternativ*", "costo real"], flags: ["compara"],
          reply: [{ text: ["«Lo armo para el lunes: lo que cuesta cada camino en caja, en control y en tiempo.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Puso la oferta al lado de sus alternativas antes de decidir." },
            { dim: "informacion", level: 3, basis: "Usó la capacidad, el crédito o los términos para comparar.", when: { any: ["q:capacidad", "q:deuda", "q:terminos", "a:lucia", "a:javier"] } }] },
        { id: "aceptar_ya", text: "Aceptar la carta de intención esta semana: es buen precio y la planta ya no alcanza.", cues: ["aceptar", "esta semana", "buen precio", "firmar"], flags: ["acepta", "prisa"],
          reply: [{ text: ["«Puedo avisarles. Pero Don Ramiro todavía no sabe nada.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "alternativas", level: 1, basis: "Tomó la primera opción por el precio, sin compararla con otras." }] },
        { id: "rechazar", text: "Rechazar la oferta: la empresa es de la familia y no necesita socios.", cues: ["rechaz*", "no necesita", "familia", "no queremos socios"], flags: ["rechaza"],
          reply: [{ text: ["«Entendido. Les contesto. Sigue el problema de la capacidad.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "problema", level: 1, basis: "Cerró la puerta sin resolver el problema de fondo: la planta ya no alcanza." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Negociar", who: "lucia", channel: "llamada",
      say: [
        { when: { all: ["prisa"] }, text: ["El fondo contesta en un día: «Encantados. Antes de firmar, ¿qué ajustes quieren a los términos?»"] },
        { when: { all: ["rechaza"] }, text: ["Una semana después, Javier rechaza otro pedido grande.", "Lucía: «¿Revisamos lo del banco?»"] },
        { text: ["Lucía tiene la comparación lista.", "«El fondo trae más dinero; el banco, menos control perdido. El veto del fondo es lo que más pesa.»"] },
      ],
      ask: "¿Qué negocias?", freeText: true,
      strategies: [
        { id: "derechos", text: "Aceptar el capital, pero negociar los derechos: dos asientos sí, veto solo sobre la venta de la empresa y nueva deuda grande, no sobre la operación.", cues: ["derechos", "veto", "asientos", "operacion", "solo sobre"], requires: { none: ["rechaza"] }, flags: ["acepta", "negocia"],
          reply: [{ text: ["«El fondo acepta quitar el veto sobre el presupuesto si se queda con el de la venta. Es un buen acuerdo.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "negociacion", level: 3, basis: "Negoció los derechos que importaban, no solo el precio." }] },
        { id: "credito", text: "Ir por el crédito del banco: una planta más chica, pero la familia conserva el 100%.", cues: ["credito", "banco", "deuda", "100%", "mas chica"], requires: { none: ["prisa"] }, flags: ["deuda"],
          reply: [{ text: ["«Lo puedo tener firmado en un mes. Hay que cuidar la caja los primeros dos años.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "alternativas", level: 2, basis: "Eligió una vía que conserva el control, aceptando crecer menos y pagar intereses." }] },
        { id: "mas_dinero", text: "Pedir más dinero por el mismo 30% y aceptar el veto completo que piden.", cues: ["mas dinero", "mismo 30", "veto completo", "subir el precio"], requires: { none: ["rechaza"] }, flags: ["acepta", "control"],
          reply: [{ text: ["«Suben a $126 M con el veto completo. Ojo: con eso ya no decides el presupuesto solo.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "Negoció el precio y entregó el control, que valía más." }] },
        { id: "nada", text: "No hacer nada por ahora: esperar a que la planta de verdad ya no aguante.", cues: ["nada", "esperar", "por ahora", "despues"], requires: { all: ["rechaza"] }, flags: ["espera"],
          reply: [{ text: ["«Como digas. Javier va a seguir rechazando pedidos.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Dejó correr un problema de capacidad que ya costaba ventas." }] },
      ],
    },
    a3: {
      id: "a3", stage: "El fundador", who: "ramiro", channel: "junta",
      say: [
        { when: { all: ["prisa"] }, text: ["Don Ramiro llega a tu oficina con la carta en la mano.", "«Me la enseñó el banco. ¿Desde cuándo vendemos la empresa sin preguntarme?»"] },
        { when: { all: ["espera"] }, text: ["Don Ramiro te invita a comer.", "«Me contaron que nos ofrecieron dinero y dijimos que no. ¿Y la planta, qué?»"] },
        { text: ["Don Ramiro te recibe en su oficina.", "«Lucía me dijo que querías hablar de algo importante.»"] },
      ],
      ask: "¿Cómo lo hablas con Don Ramiro?", freeText: true,
      strategies: [
        { id: "construir", text: "Explicarle los tres caminos con sus números, escuchar qué le preocupa y decidir juntos qué se lleva al consejo.", cues: ["explicar", "tres caminos", "escuchar", "preocupa", "juntos", "numeros"], flags: ["ramiro_apoya"],
          reply: [
            { when: { all: ["prisa"] }, text: ["Don Ramiro escucha, todavía molesto.", "«Debí saberlo antes. Pero los números tienen sentido. Lo apoyo, con una condición: que la planta vieja no se toque.»"] },
            { text: ["«Me hubiera gustado que mi papá viera esto.»", "«Lo apoyo. Que la planta vieja se quede como está.»"] },
          ],
          next: [{ when: { all: ["control"] }, to: "a4" }, { to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Construyó la decisión con el dueño, con datos y escuchando lo que le importaba." }] },
        { id: "consumado", text: "Decirle que ya está decidido y que es lo mejor para la empresa.", cues: ["ya esta decidido", "lo mejor", "decidido", "no hay vuelta"], flags: ["consumado"],
          reply: [{ text: ["Don Ramiro se levanta.", "«Esto lo vamos a hablar en el consejo.»"] }],
          next: [{ when: { all: ["control"] }, to: "a4" }, { to: "close" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Trató al dueño como alguien a quien se informa, no con quien se decide." }] },
        { id: "carla_primero", text: "Pedirle a Carla que esté en la conversación y llevarle la propuesta con su opinión independiente.", cues: ["carla", "consejera", "independiente", "acompan*"], flags: ["ramiro_apoya", "con_carla"],
          reply: [{ text: ["Carla explica los términos con calma. Don Ramiro asiente.", "«Si Carla dice que está bien cuidado, lo apoyo.»"] }],
          next: [{ when: { all: ["control"] }, to: "a4" }, { to: "close" }],
          evidence: [{ dim: "coherencia", level: 2, basis: "Se apoyó en una voz de confianza para el dueño, aunque sin escuchar primero qué le preocupaba." }] },
      ],
    },
    a4: {
      id: "a4", stage: "Control", who: "carla", channel: "llamada",
      say: [{ text: ["Carla te llama después de leer el contrato final.", "«Con el veto completo, el fondo puede frenar el presupuesto del año. ¿Lo firmas así?»"] }],
      ask: "El contrato trae veto sobre la operación. ¿Qué haces?", freeText: true,
      strategies: [
        { id: "renegociar", text: "Volver a negociar antes de firmar: devolver los $6 M extra a cambio de quitar el veto sobre el presupuesto.", cues: ["renegoci*", "devolver", "quitar el veto", "antes de firmar"], set: { participacion: 30 },
          reply: [{ text: ["«El fondo acepta. Mejor $6 M menos que tres años de pelear cada presupuesto.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "adaptacion", level: 3, basis: "Corrigió un mal acuerdo antes de firmarlo, cambiando dinero por control." }] },
        { id: "firmar", text: "Firmar así: el dinero extra lo vale.", cues: ["firmar", "asi", "lo vale"], flags: ["firma_veto"],
          reply: [{ text: ["«Es tu decisión. Lo dejo asentado en el acta.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Aceptó perder el control del presupuesto por un precio un poco mayor." }] },
      ],
    },
  },
  followUps: [
    { id: "so-planta", when: { any: ["acepta", "deuda"], none: ["rechaza"] }, afterDays: 30, from: "javier", subject: "Arranca la obra de la segunda planta",
      text: [{ text: ["Ya hay terreno y contratista. La gente de la planta actual preguntó si se va a cerrar; les dije que no."] }] },
    { id: "so-consejo", when: { all: ["consumado"] }, afterDays: 7, from: "carla", subject: "Don Ramiro pidió una sesión extraordinaria",
      text: [{ text: ["Don Ramiro pidió una sesión del consejo para revisar cómo se tomó la decisión del fondo. Prepárate."] }] },
    { id: "so-espera", when: { all: ["espera"] }, afterDays: 21, from: "javier", subject: "Otro pedido que no pudimos tomar",
      text: [{ text: ["SuperNorte pidió 20% más para la temporada. Le dijimos que no: no hay línea."] }] },
  ],
  rules: "socio-v1",
};

registerRules("socio-v1", rulesSocio);
