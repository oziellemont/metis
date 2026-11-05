/**
 * Caso largo · Capítulo «Estabilizar» · Forja Norte · «Aurora pide 4% menos».
 *
 * Aurora Motors, el cliente más grande, pide bajar 4% el precio de la plataforma actual para renovarla, o abre
 * licitación. Es una negociación en varias rondas: postura, propuesta, una cotización rival y cómo se cierra
 * hacia dentro (consejo y planta). Entre 3 y 4 decisiones.
 *
 * Modelo (todo declarado):
 *  - Margen: −1 punto por cada punto de descuento; +1 si el precio queda ligado al acero; +1 con el programa
 *    conjunto de ahorro. Si se suelta la plataforma, el margen sube 1 (se deja la pieza menos rentable).
 *  - Clientes: +2 si se renueva con confianza ≥ 0; 0 si se renueva con confianza negativa; −4 si se pierde.
 *  - Caja: −3 si se pierde la plataforma (planta parada en esa línea); +1 con contrato de 3 años.
 *  - Consejo: +1 si se lleva el acuerdo con su efecto y un plan; −1 si solo se informa el resultado.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesAurora(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const pierde = has(run, "suelta");
  const desc = run.terms.descuento ?? 0;
  const plazo = run.terms.plazo ?? 1;
  const headline = pierde
    ? "Aurora se fue con el otro proveedor. La línea 3 se queda sin su pieza principal mientras llega otro cliente."
    : desc >= 6 ? `Retuviste la plataforma, pero a ${desc}% menos: el precio ya no cubre lo que cuesta hacerla.`
      : has(run, "ingenieria") ? `Renovaste con ${desc}% de descuento y un programa conjunto de ahorro: el precio baja porque baja el costo.`
        : has(run, "indexa") ? `Renovaste con ${desc}% de descuento, ${plazo} años de contrato y el precio ligado al acero.`
          : desc > 0 ? `Renovaste con ${desc}% de descuento por ${plazo} ${plazo === 1 ? "año" : "años"}.`
            : "Renovaste sin bajar el precio. Aurora aceptó, aunque la relación quedó tensa.";
  const agreement: [string, string][] = pierde
    ? [["Plataforma", "Perdida"], ["Motivo", has(run, "verifica") ? "Se comparó el costo total y no convenía igualar" : "No se revisó qué incluía la cotización rival"]]
    : [["Descuento", `${desc}%`], ["Contrato", `${plazo} ${plazo === 1 ? "año" : "años"}`], ["Precio del acero", has(run, "indexa") ? "Ajuste automático" : "Fijo: el riesgo es de Forja"]];
  const economics: [string, string][] = [
    ["Venta anual con Aurora", pierde ? "$0 M (antes $380 M)" : `$${Math.round(380 * (1 - desc / 100))} M`],
    ["Efecto en margen", pierde ? "Se deja la pieza menos rentable" : `${desc ? `−${desc}` : "0"} puntos de precio`],
  ];
  const kpi: RulesResult["kpi"] = [];
  const m = pierde ? 1 : -desc + (has(run, "indexa") ? 1 : 0) + (has(run, "ingenieria") ? 1 : 0);
  if (m) kpi.push({ key: "margen", delta: m, why: pierde ? "Sin la pieza de Aurora, la mezcla queda con lo más rentable." : `Regla: −1 por cada punto de descuento (${desc}%)${has(run, "indexa") ? ", +1 por ligar el precio al acero" : ""}${has(run, "ingenieria") ? ", +1 por el programa conjunto de ahorro" : ""}.` });
  if (pierde) {
    kpi.push({ key: "clientes", delta: -4, why: "Perder al cliente más grande pesa en la cartera y en la reputación con otras armadoras." });
    kpi.push({ key: "caja", delta: -3, why: "La línea 3 queda parada mientras se consigue otro cliente." });
  } else {
    if (run.trust >= 0) kpi.push({ key: "clientes", delta: 2, why: "Aurora renueva y sale de la mesa con confianza en Forja." });
    if (plazo >= 3) kpi.push({ key: "caja", delta: 1, why: "Un contrato de 3 años da volumen asegurado para planear la planta." });
  }
  if (has(run, "plan")) kpi.push({ key: "consejo", delta: 1, why: "El consejo recibe el acuerdo con su efecto en margen y un plan con responsables." });
  if (has(run, "solo_resultado")) kpi.push({ key: "consejo", delta: -1, why: "El consejo se entera después del efecto en margen: lo ve como información incompleta." });
  const risks = [
    ...(desc >= 6 ? [{ id: "au-precio", text: "Con este precio la pieza pierde dinero si el acero sube.", owner: "marcos" }] : []),
    ...(!pierde && !has(run, "indexa") ? [{ id: "au-acero", text: "El precio quedó fijo: un alza del acero la paga Forja.", owner: "marcos" }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { descuento: desc, plazo, pierde: pierde ? 1 : 0 } };
}

export const AURORA: EpisodeSpec = {
  contract: 1, id: "aurora", version: "1.0.0", approval: "aprobado",
  company: "forja", industry: "Autopartes", title: "Aurora pide 4% menos", subject: "Renovación de la plataforma con Aurora Motors",
  from: "greg", counterpart: "greg", channel: "email", areas: ["negociacion", "finanzas", "clientes"], cast: ["greg", "marcos", "daniela", "ramon", "zertuche"],
  lesson: "negociacion", minutes: 7,
  concept: {
    title: "Antes de ceder precio, cambia la conversación al costo total",
    text: "Un cliente grande que pide descuento casi nunca quiere solo el número: quiere bajar su costo por vehículo y no arriesgar el lanzamiento. Si llevas datos, puedes cambiar precio por algo que a ti te da valor: plazo, ajuste por materia prima o ahorros de ingeniería que bajen el costo de los dos.",
    nota: "Separa lo que pide de lo que necesita. Cada concesión, a cambio de algo. Y compara costos totales, no cotizaciones sueltas.",
  },
  briefing: {
    message: [
      "Correo de Greg Holloway, Aurora Motors · 7:12",
      "«La plataforma que nos surten vence en 60 días. Para renovarla necesitamos 4% menos en el precio de todas las piezas.»",
      "«Si no es posible, abrimos licitación la próxima semana. Ya tenemos interesados.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Cliente", "Aurora Motors, 31% de la venta"], ["Venta anual de la plataforma", "$380 M"], ["Vencimiento", "60 días"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "margen", label: "¿Cuánto ganamos con esa plataforma?", keywords: ["margen", "ganamos", "rentable", "utilidad", "gana"], source: "marcos",
        answer: "Marcos: el margen de la plataforma es 9%. Con 4% menos quedaría en 5%, y si el acero sube 10% llegaría a cero." },
      { id: "acero", label: "¿Cómo se ha movido el acero?", keywords: ["acero", "materia prima", "lamina", "precio del"], source: "marcos",
        answer: "Marcos: el acero subió 12% en el año. El contrato actual tiene precio fijo: el alza la absorbimos nosotros." },
      { id: "cambio", label: "¿Qué tan fácil es para Aurora cambiar de proveedor?", keywords: ["cambiar", "proveedor", "licitacion", "costo de cambio", "ppap", "herramental"], source: "ramon",
        answer: "Ramón: cambiar les toma de 8 a 10 meses: herramentales nuevos, validar piezas (PPAP) y riesgo en el lanzamiento. No es imposible, pero no es gratis." },
      { id: "relacion", label: "¿Cómo está la relación con Greg?", keywords: ["greg", "relacion", "historial", "confianza", "quejas", "calidad"], source: "daniela",
        answer: "Daniela: Greg tiene meta de bajar 3% el costo por vehículo este año. Con nosotros no hay quejas de calidad desde hace 14 meses." },
    ],
    unknowns: [
      { id: "rival", keywords: ["quien es el otro", "quienes son", "nombre del", "que proveedor", "cuanto cotizo", "cotizacion de"], answer: "Ese dato no lo tienes: Aurora no ha dicho quién más cotiza ni a qué precio." },
    ],
  },
  advisors: [
    { id: "marcos", role: "Director de Finanzas", personality: "Directo, piensa en el año completo.", interests: "Que el precio cubra el costo aunque el acero se mueva.", relations: "Lleva el costeo por pieza.", knows: ["margen", "acero"],
      view: [{ text: [
        "Mi miedo no es el 4%: es firmar precio fijo otra vez. El acero ya nos comió medio margen este año.",
        "Si vamos a dar algo, que sea a cambio de algo que podamos medir.",
      ] }] },
    { id: "daniela", role: "Directora Comercial", personality: "Conoce a Greg desde hace años.", interests: "No perder la plataforma ni la de 2028.", relations: "Habla con Greg cada semana.", knows: ["relacion", "cambio"],
      view: [{ text: [
        "Greg tiene una meta de costo, no un pleito con nosotros. Si le ayudamos a cumplirla sin que todo salga de nuestro precio, se queda.",
        "Lo que no aguanta es sentir que lo ignoramos.",
      ] }] },
    { id: "ramon", role: "Director de Operaciones", personality: "Práctico, 25 años en la planta.", interests: "Que la línea 3 tenga carga.", relations: "Conoce los herramentales de Aurora.", knows: ["cambio"],
      view: [{ text: [
        "Hay ahorros que nadie ha pedido: cambiar el empaque, juntar dos soldaduras. Nunca nos preguntaron.",
        "Y para ellos cambiarnos no es cosa de una semana.",
      ] }] },
  ],
  terms: {
    descuento: { label: "Descuento", unit: "%", initial: 0 },
    plazo: { label: "Plazo del contrato", unit: "años", initial: 1 },
  },
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "Postura", who: "greg", channel: "email",
      say: [{ text: ["Greg espera respuesta hoy. Daniela ya te reenvió el correo con un «¿cómo le contestamos?»."] }],
      ask: "¿Cómo respondes al primer correo de Aurora?", freeText: true,
      strategies: [
        { id: "datos", text: "Pedir una reunión con los números en la mesa: costo del acero, productividad de la línea y lo que cuesta cambiar de proveedor, antes de hablar de precio.", cues: ["reunion", "numeros", "datos", "costo del acero", "antes de hablar"], flags: ["datos"], trust: 1,
          reply: [{ text: ["«De acuerdo, el jueves. Pero llego con la meta de 4%.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "negociacion", level: 3, basis: "Cambió la conversación de precio a costo total antes de conceder nada." },
            { dim: "informacion", level: 3, basis: "Llegó a la mesa con margen, acero o costo de cambio a la mano.", when: { any: ["q:margen", "q:acero", "q:cambio", "a:marcos", "a:ramon"] } },
          ] },
        { id: "ceder", text: "Aceptar el 4% de una vez para asegurar la renovación y no arriesgar la relación.", cues: ["acept*", "4%", "de una vez", "asegurar", "no arriesgar"], flags: ["cede"], set: { descuento: 4 },
          reply: [{ text: ["«Excelente. Le paso la noticia a mi director.»", "Daniela te escribe aparte: «¿Y no pedimos nada a cambio?»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "negociacion", level: 0, basis: "Concedió todo lo pedido en el primer correo, sin pedir nada a cambio." }] },
        { id: "duro", text: "Contestar que no hay descuento posible: si Aurora quiere licitar, que licite.", cues: ["no hay", "que licite", "no damos", "ningun descuento", "rechaz*"], flags: ["duro"], trust: -1,
          reply: [{ text: ["«Entendido. Entonces la licitación sale el lunes.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "Defendió el margen, pero cerró la conversación sin explorar qué necesitaba el cliente." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Propuesta", who: "greg", channel: "junta",
      say: [
        { when: { all: ["cede"] }, text: ["Junta de firma. Greg trae el contrato con el 4%.", "«Solo falta definir el plazo. Lo normal es un año.»"] },
        { when: { all: ["duro"] }, text: ["Greg llama antes de publicar la licitación.", "«Le doy una última oportunidad. ¿Qué me puede ofrecer?»"] },
        { text: ["Jueves. Greg revisa tus números en silencio.", "«Entiendo lo del acero. Pero mi meta sigue siendo 3% de costo por vehículo. ¿Qué propone?»"] },
      ],
      ask: "¿Qué pones sobre la mesa?", freeText: true,
      strategies: [
        { id: "intercambio", text: "Ofrecer 2% a cambio de un contrato de tres años y un ajuste automático del precio cuando el acero suba o baje.", cues: ["2%", "tres anos", "3 anos", "ajuste", "indexa*", "acero"], requires: { none: ["cede"] }, set: { descuento: 2, plazo: 3 }, flags: ["indexa"], trust: 1,
          reply: [{ text: ["«Tres años me sirven para el lanzamiento. El ajuste por acero lo tengo que vender adentro, pero es justo.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Cambió descuento por plazo y protección contra la materia prima: cada concesión con contrapartida." }] },
        { id: "ingenieria", text: "Proponer un programa conjunto de ingeniería para bajar el costo de la pieza y repartir el ahorro mitad y mitad, con 1% de entrada.", cues: ["ingenieria", "programa", "conjunto", "ahorro", "mitad", "costo de la pieza"], requires: { none: ["cede"] }, set: { descuento: 1, plazo: 2 }, flags: ["ingenieria"], trust: 1,
          reply: [{ text: ["«Eso nadie me lo había ofrecido. Si el ahorro es real, mi director lo firma.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Atacó el costo de los dos en lugar de repartirse un margen que ya era chico." },
            { dim: "informacion", level: 3, basis: "Usó lo que la planta sabía de ahorros posibles.", when: { any: ["a:ramon", "q:cambio"] } }] },
        { id: "sostener", text: "Sostener el precio y compensar con servicio: entregas más frecuentes y soporte en planta sin costo.", cues: ["sostener", "servicio", "entregas", "soporte", "sin costo", "mismo precio"], requires: { none: ["cede"] }, flags: ["sostener"], trust: -1,
          reply: [{ text: ["«El servicio ya lo pago en el precio. No me ayuda con mi meta.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "Ofreció algo que el cliente no valoraba: su problema era el costo, no el servicio." }] },
        { id: "pide_plazo", text: "Ya cedimos el 4%: pedir a cambio un contrato de tres años por escrito.", cues: ["a cambio", "tres anos", "3 anos", "por escrito", "plazo"], requires: { all: ["cede"] }, set: { plazo: 3 },
          reply: [{ text: ["«Tres años con ese precio, sí. Lo firmo.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "negociacion", level: 2, basis: "Recuperó algo de valor después de conceder, aunque tarde." }] },
        { id: "firmar_ya", text: "Firmar el 4% a un año, como viene.", cues: ["firmar", "como viene", "un ano", "sin cambios"], requires: { all: ["cede"] },
          reply: [{ text: ["«Perfecto. Nos vemos el próximo año.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Aceptó un precio más bajo sin plazo: el próximo año la conversación empieza desde ahí." }] },
      ],
    },
    a3: {
      id: "a3", stage: "Cotización rival", who: "greg", channel: "llamada",
      say: [
        { when: { all: ["ingenieria"] }, text: ["Greg te llama dos días después.", "«Mi director pide comparar. Llegó una cotización 7% abajo de su precio. ¿Qué me dice?»"] },
        { text: ["Greg te llama dos días después.", "«Tengo otra cotización 7% abajo de su precio actual. Ayúdeme a defenderlo a usted adentro.»"] },
      ],
      ask: "Aparece una cotización 7% más barata. ¿Qué haces?", freeText: true,
      strategies: [
        { id: "verificar", text: "Pedir que comparemos el costo total: herramentales nuevos, validación de piezas, flete y el riesgo de 8 a 10 meses de cambio en pleno lanzamiento.", cues: ["costo total", "herramental*", "validacion", "flete", "riesgo", "comparar"], flags: ["verifica"], trust: 1,
          reply: [{ text: ["«Con el costo de cambio sumado, la otra cotización ya no es 7%, es 1%. Eso sí lo puedo defender.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "riesgos", level: 3, basis: "Hizo visible el costo y el riesgo de cambiar de proveedor, que la cotización no incluía." }] },
        { id: "igualar", text: "Igualar la cotización y bajar hasta 6% para no perder la plataforma.", cues: ["igualar", "6%", "bajar", "no perder", "lo que sea"], set: { descuento: 6 }, flags: ["iguala"],
          reply: [{ text: ["«Con eso cierro hoy.»", "Marcos te escribe: «Con 6% esa pieza ya no deja nada.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Igualó un precio sin saber qué incluía, por debajo del costo de la pieza." }] },
        { id: "soltar", text: "Dejar que Aurora se vaya con el otro proveedor y enfocar la línea en clientes más rentables.", cues: ["que se vaya", "soltar", "dejarlos", "otros clientes", "rentables"], flags: ["suelta"], trust: -1,
          reply: [{ text: ["«Lo lamento. Les aviso del cambio esta semana.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Cuidó el margen, pero soltó al cliente más grande sin un reemplazo a la vista." }] },
      ],
    },
    a4: {
      id: "a4", stage: "Hacia dentro", who: "zertuche", channel: "junta",
      say: [
        { when: { any: ["iguala", "cede"] }, text: ["Zertuche pide un minuto antes del consejo.", "«Vi el acuerdo con Aurora. ¿Cómo lo vas a presentar? El margen va a bajar.»"] },
        { text: ["Zertuche pide un minuto antes del consejo.", "«Me dicen que cerraste con Aurora. ¿Cómo lo presentamos?»"] },
      ],
      ask: "¿Cómo cierras hacia dentro?", freeText: true,
      strategies: [
        { id: "plan", text: "Presentar el acuerdo con su efecto en margen y un plan de ahorro en planta con responsables y fechas.", cues: ["efecto", "margen", "plan", "responsables", "fechas", "ahorro"], flags: ["plan"],
          reply: [{ text: ["«Así sí. Que Ramón presente el plan de ahorro en la próxima sesión.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Convirtió el acuerdo en un plan con dueños y fechas, y dijo el costo completo." }],
          commitments: [{ id: "au-ahorro", text: "Plan de ahorro de la línea 3 con responsables y fechas.", owner: "ramon" }] },
        { id: "solo_resultado", text: "Informar que la plataforma quedó renovada y dejar los detalles para el reporte trimestral.", cues: ["renovada", "detalles", "trimestral", "despues", "solo informar"], flags: ["solo_resultado"],
          reply: [{ text: ["«Mmm. El consejo va a preguntar por el margen igual.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 1, basis: "Dio la buena noticia y guardó el costo para después." }] },
      ],
    },
  },
  followUps: [
    { id: "au-ahorro", when: { all: ["ingenieria"] }, afterDays: 30, from: "ramon", subject: "Primer ahorro del programa con Aurora",
      text: [{ text: ["Juntamos dos soldaduras en la pieza principal. Ahorro de 2.1% por pieza, la mitad para cada lado. Greg ya lo presentó a su director."] }] },
    { id: "au-acero", when: { all: ["indexa"] }, afterDays: 45, from: "marcos", subject: "Primer ajuste por acero",
      text: [{ text: ["El acero subió 4% este mes. Por primera vez el ajuste lo cubre el contrato y no nuestro margen."] }] },
    { id: "au-perdida", when: { all: ["suelta"] }, afterDays: 20, from: "daniela", subject: "Aurora confirmó el cambio",
      text: [{ text: ["Aurora confirmó que se va con el otro proveedor en 9 meses. Estoy buscando quién llene la línea 3."] }] },
    { id: "au-precio", when: { all: ["iguala"] }, afterDays: 30, from: "marcos", subject: "La pieza de Aurora pierde dinero",
      text: [{ text: ["Con el 6% y el acero de este mes, cada pieza para Aurora nos cuesta más de lo que cobramos."] }] },
  ],
  rules: "aurora-v1",
};

registerRules("aurora-v1", rulesAurora);
