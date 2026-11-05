/**
 * Caso largo · Capítulos «Acelerar» a «Gobernar» · Punto Madero · «El crédito vence en 90 días».
 *
 * Un crédito de $60 M vence en 90 días y el banco pide condiciones nuevas: más garantías y un límite de deuda.
 * Las ventas de la temporada fueron flojas. Se decide cómo preparar la renegociación, qué aceptar, cómo cuidar la
 * caja mientras tanto y cómo informar al consejo. Entre 3 y 4 decisiones.
 *
 * Modelo (todo declarado):
 *  - Caja: +3 si se refinancia a plazo largo; +1 con el crédito puente de otro banco; −2 si se pagan comisiones
 *    por prisa; +1 si se libera inventario lento.
 *  - Margen: −1 por tasa más alta; −2 si se rematan tiendas buenas.
 *  - Consejo: +2 si se informa temprano con plan; −2 si se entera al final.
 *  - Equipo: −2 si se recorta personal de tienda para pagar.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesRefinanciar(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const headline = has(run, "largo")
    ? "Refinanciaste a 5 años con dos bancos compitiendo: la caja respira y el límite de deuda es manejable."
    : has(run, "acepta_todo") ? "Renovaste con el mismo banco aceptando todas sus condiciones: tasa más alta y tus tiendas como garantía."
      : has(run, "puente") ? "Un crédito puente de otro banco te dio tiempo; la renegociación de fondo queda para el próximo trimestre."
        : "Pagaste parte del crédito con caja propia y recortes. Se evitó la deuda, pero la operación quedó apretada.";
  const agreement: [string, string][] = [
    ["Crédito", has(run, "largo") ? "$60 M a 5 años" : has(run, "acepta_todo") ? "$60 M a 2 años, tasa +2 puntos" : has(run, "puente") ? "Puente de $40 M a 1 año" : "$20 M pagados con caja"],
    ["Garantías", has(run, "acepta_todo") ? "Las tiendas propias" : "Inventario y cuentas por cobrar"],
    ["Consejo", has(run, "consejo_temprano") ? "Informado desde el inicio" : "Informado al final"],
  ];
  const economics: [string, string][] = [
    ["Intereses al año", has(run, "largo") ? "$6.0 M" : has(run, "acepta_todo") ? "$7.2 M" : has(run, "puente") ? "$4.4 M" : "$4.0 M"],
    ["Inventario liberado", has(run, "inventario") ? "$12 M" : "—"],
  ];
  const kpi: RulesResult["kpi"] = [];
  if (has(run, "largo")) kpi.push({ key: "caja", delta: 3, why: "A 5 años, el pago mensual baja y la caja deja de estar contra la pared." });
  if (has(run, "puente")) kpi.push({ key: "caja", delta: 1, why: "El puente da un año de aire, con otra renegociación pendiente." });
  if (has(run, "prisa")) kpi.push({ key: "caja", delta: -2, why: "Negociar en la última semana costó comisiones y penalidades." });
  if (has(run, "inventario")) kpi.push({ key: "caja", delta: 1, why: "Liquidar inventario lento liberó $12 M." });
  if (has(run, "acepta_todo")) kpi.push({ key: "margen", delta: -1, why: "Dos puntos más de tasa pesan en el resultado." });
  if (has(run, "remata")) kpi.push({ key: "margen", delta: -2, why: "Se cerró una tienda rentable para pagar: se pierde su utilidad." });
  if (has(run, "recorta")) kpi.push({ key: "equipo", delta: -2, why: "Recortar asesores de tienda para pagar deuda se siente como castigo a quien vende." });
  if (has(run, "consejo_temprano")) kpi.push({ key: "consejo", delta: 2, why: "El consejo supo del vencimiento con tiempo y con un plan." });
  if (has(run, "consejo_tarde")) kpi.push({ key: "consejo", delta: -2, why: "El consejo se enteró del vencimiento cuando ya estaba encima." });
  return { headline, agreement, economics, kpi, risks: has(run, "acepta_todo") ? [{ id: "rf-garantia", text: "Con las tiendas en garantía, un mal año pone en riesgo los inmuebles.", owner: "claudia" }] : [], data: {} };
}

export const REFINANCIAR: EpisodeSpec = {
  contract: 1, id: "refinanciar", version: "1.0.0", approval: "aprobado",
  company: "puntomadero", industry: "Retail", title: "El crédito vence en 90 días", subject: "El banco pide condiciones nuevas para renovar",
  from: "claudia", counterpart: "ines", channel: "email", areas: ["finanzas", "negociacion", "alineacion"], cast: ["claudia", "ines", "garza", "octavio"],
  lesson: "finanzas", minutes: 7,
  concept: {
    title: "La deuda se negocia antes de necesitarla",
    text: "Un vencimiento no es una sorpresa: tiene fecha. Quien llega a la mesa con tiempo, con números y con otra opción, negocia. Quien llega en la última semana, acepta. Mientras tanto, la caja se cuida con lo que no daña la operación (inventario lento) antes que con lo que sí (tiendas buenas o la gente que vende).",
    nota: "Empieza temprano, trae competencia a la mesa, cuida la caja sin romper lo que genera venta y que el consejo lo sepa por ti.",
  },
  briefing: {
    message: [
      "Correo de Claudia, Finanzas · 8:40",
      "«El crédito de $60 M vence en 90 días. El banco pide para renovar: tasa 2 puntos más alta, las tiendas propias como garantía y un límite de deuda.»",
      "«La temporada fue floja. ¿Cómo lo enfrentamos?»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Crédito", "$60 M"], ["Vence en", "90 días"], ["Lo que pide el banco", "Tasa +2, tiendas en garantía"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "caja", label: "¿Cuánta caja tenemos?", keywords: ["caja", "efectivo", "dinero", "alcanza", "pagar"], source: "claudia",
        answer: "Claudia: $28 M en caja. Con eso operamos 2 meses sin vender nada. No alcanza para pagar el crédito." },
      { id: "inventario", label: "¿Hay inventario que no se mueve?", keywords: ["inventario", "lento", "bodega", "mercancia", "rotacion"], source: "octavio",
        answer: "Octavio: hay $12 M en inventario de más de 6 meses, sobre todo de herramienta eléctrica. Rematado, sale a 70% de su costo." },
      { id: "bancos", label: "¿Otros bancos nos prestarían?", keywords: ["otros bancos", "otro banco", "competencia", "alternativa", "puente"], source: "claudia",
        answer: "Claudia: dos bancos nos han buscado. Necesitan 6 semanas para aprobar y estados financieros auditados." },
      { id: "tiendas", label: "¿Cómo van las tiendas?", keywords: ["tiendas", "sucursales", "rentables", "perdida", "cuales"], source: "octavio",
        answer: "Octavio: 14 de 16 tiendas ganan dinero. Las 2 que pierden están en plazas que se vaciaron." },
    ],
    unknowns: [
      { id: "tasa", keywords: ["que tasa daria", "cuanto cobraria el otro", "tasa del otro banco"], answer: "Ese dato no existe todavía: los otros bancos cotizan hasta revisar los estados auditados." },
    ],
  },
  advisors: [
    { id: "claudia", role: "Directora de Finanzas", personality: "Ordenada, no le gustan las sorpresas.", interests: "No perder el control de las garantías.", relations: "Trata con el banco desde hace 8 años.", knows: ["caja", "bancos"],
      view: [{ text: [
        "Lo que más me preocupa es dar las tiendas en garantía. Eso es el patrimonio.",
        "Si empezamos hoy, llegamos con otra oferta en la mano. Si esperamos, no.",
      ] }] },
    { id: "octavio", role: "Director de Operaciones y Tiendas", personality: "Defiende sus tiendas.", interests: "Que no se cierren tiendas buenas ni se recorte a los asesores.", relations: "Conoce cada sucursal.", knows: ["inventario", "tiendas"],
      view: [{ text: [
        "Antes de tocar una tienda que vende, saquemos lo que está muerto en bodega.",
        "Y si recortan asesores en temporada baja, la siguiente temporada vendemos menos.",
      ] }] },
    { id: "ines", role: "Consejera · Capital Norte", personality: "Exigente con los números.", interests: "Que el margen se recupere y saber las cosas a tiempo.", relations: "Representa al fondo.", knows: ["bancos"],
      view: [{ text: [
        "Lo que no perdono es enterarme al final. Si hay un vencimiento, quiero el plan con tiempo.",
        "Y conozco gente en los otros bancos, si hace falta.",
      ] }] },
  ],
  terms: {},
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "Preparar", who: "claudia", channel: "junta",
      say: [{ text: ["Claudia trae la carta del banco.", "«Quedan 90 días. ¿Por dónde empezamos?»"] }],
      ask: "¿Cómo preparas la renegociación?", freeText: true,
      strategies: [
        { id: "competencia", text: "Empezar hoy: auditar estados financieros, pedir cotización a los otros dos bancos y avisar al consejo con el plan.", cues: ["hoy", "auditar", "otros bancos", "cotizacion", "consejo", "plan"], flags: ["competencia", "consejo_temprano"],
          reply: [{ text: ["«Perfecto. En 6 semanas tenemos ofertas para comparar.»", "Inés responde a tu correo: «Gracias por avisar con tiempo. Te paso dos contactos.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "negociacion", level: 3, basis: "Se preparó con tiempo y con alternativas para negociar desde una posición fuerte." },
            { dim: "informacion", level: 3, basis: "Usó la caja, los bancos o el inventario para armar el plan.", when: { any: ["q:caja", "q:bancos", "q:inventario", "a:claudia", "a:ines"] } }] },
        { id: "mismo_banco", text: "Negociar solo con el banco actual: nos conoce y es más rápido.", cues: ["solo", "banco actual", "nos conoce", "rapido"],
          reply: [{ text: ["«Va. Pero sin otra oferta, no van a bajar mucho.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "Negoció sin alternativa: el banco sabe que no hay otra opción." }] },
        { id: "esperar", text: "Esperar a ver cómo cierra el siguiente mes de ventas antes de mover nada.", cues: ["esperar", "siguiente mes", "ventas", "antes de mover"], flags: ["prisa"],
          reply: [{ text: ["«Ok. Pero cada semana que esperamos es una semana menos para buscar otro banco.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Dejó correr un vencimiento con fecha conocida." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Caja", who: "octavio", channel: "junta",
      say: [{ text: ["Octavio llega con la lista de tiendas e inventario.", "«Claudia dice que hay que juntar caja por si acaso. ¿De dónde la sacamos?»"] }],
      ask: "¿Cómo cuidas la caja mientras negocias?", freeText: true,
      strategies: [
        { id: "inventario", text: "Liquidar los $12 M de inventario lento y cerrar las 2 tiendas que pierden dinero.", cues: ["inventario", "lento", "liquidar", "2 tiendas", "pierden"], flags: ["inventario"],
          reply: [{ text: ["«Eso sí. Las 2 tiendas ya no tenían remedio.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Sacó caja de lo que no genera venta antes de tocar lo que sí." }] },
        { id: "recortar", text: "Recortar 15% de asesores en todas las tiendas.", cues: ["recortar", "asesores", "15%", "personal"], flags: ["recorta"],
          reply: [{ text: ["«Lo hago. Pero en la próxima temporada no vamos a tener quién venda.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Ahorró caja recortando a quien genera la venta." }] },
        { id: "rematar", text: "Vender la tienda más rentable a un competidor que la quiere: entra caja de golpe.", cues: ["vender", "tienda", "rentable", "competidor", "de golpe"], flags: ["remata"],
          reply: [{ text: ["«¿La de Saltillo centro? Es la que más deja…»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Vendió lo que más utilidad genera para resolver un problema de plazo." }] },
      ],
    },
    a3: {
      id: "a3", stage: "La mesa", who: "claudia", channel: "llamada",
      say: [
        { when: { all: ["competencia"] }, text: ["Claudia: «Llegaron las dos ofertas: 5 años, garantía sobre inventario y cuentas por cobrar, tasa igual a la actual. El banco actual dice que lo iguala si nos quedamos.»"] },
        { when: { all: ["prisa"] }, text: ["Quedan 10 días. Claudia: «El banco sabe que no tenemos otra opción. Sostiene todo lo que pidió.»"] },
        { text: ["Claudia: «El banco bajó un poco: tasa +1.5 y siguen pidiendo las tiendas en garantía.»"] },
      ],
      ask: "¿Qué aceptas?", freeText: true,
      strategies: [
        { id: "cinco", text: "Firmar a 5 años con quien dé mejores condiciones, sin las tiendas en garantía.", cues: ["5 anos", "cinco anos", "mejores condiciones", "sin las tiendas"], requires: { all: ["competencia"] }, flags: ["largo"],
          reply: [{ text: ["«El banco actual iguala. Nos quedamos con ellos, a 5 años y sin las tiendas.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "negociacion", level: 3, basis: "Usó la competencia para conseguir plazo y conservar las garantías." }] },
        { id: "aceptar", text: "Aceptar lo que pide el banco: tiendas en garantía y tasa más alta.", cues: ["aceptar", "garantia", "tasa", "lo que pide"], requires: { none: ["competencia"] }, flags: ["acepta_todo"],
          reply: [{ text: ["«Firmado. Hay que avisar al consejo que las tiendas quedaron en garantía.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "Aceptó las condiciones porque no tenía otra opción." }] },
        { id: "puente", text: "Pedir a Inés el contacto de otro banco y tomar un crédito puente a un año por $40 M.", cues: ["ines", "puente", "otro banco", "un ano", "40"], requires: { none: ["competencia"] }, flags: ["puente"],
          reply: [{ text: ["«Inés lo consigue en tres semanas. Nos da tiempo, pero el año que entra volvemos a esto.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "adaptacion", level: 2, basis: "Buscó una salida a tiempo, aunque solo compra un año." }] },
      ],
    },
    a4: {
      id: "a4", stage: "El consejo", who: "garza", channel: "junta",
      say: [{ text: ["Sesión de consejo. Esteban Garza abre la carpeta.", "«¿Por qué nos enteramos hasta ahora de cómo quedó el crédito?»"] }],
      ask: "¿Cómo respondes al consejo?", freeText: true,
      strategies: [
        { id: "asumir", text: "Asumir que debió informarse antes, presentar el acuerdo con su costo y un plan para no llegar así al próximo vencimiento.", cues: ["asumir", "antes", "costo", "plan", "proximo vencimiento"], flags: ["consejo_tarde"],
          reply: [{ text: ["«Gracias por decirlo así. Que el plan venga con fechas.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 2, basis: "Reconoció el error y propuso cómo no repetirlo." }] },
        { id: "justificar", text: "Explicar que no había tiempo y que era lo único posible.", cues: ["no habia tiempo", "unico posible", "no habia opcion"], flags: ["consejo_tarde"],
          reply: [{ text: ["Inés: «Había 90 días. Tiempo sí había.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Justificó una decisión tardía con una falta de tiempo que no existía." }] },
      ],
    },
  },
  followUps: [
    { id: "rf-largo", when: { all: ["largo"] }, afterDays: 30, from: "claudia", subject: "Primer mes con el crédito nuevo",
      text: [{ text: ["El pago mensual bajó 35%. Por primera vez en un año, la caja cierra el mes arriba de $30 M."] }] },
    { id: "rf-puente", when: { all: ["puente"] }, afterDays: 60, from: "claudia", subject: "El puente vence en 10 meses",
      text: [{ text: ["Recordatorio: el crédito puente vence en 10 meses. Ya pedí la auditoría para no llegar igual que la vez pasada."] }] },
    { id: "rf-asesores", when: { all: ["recorta"] }, afterDays: 30, from: "octavio", subject: "Faltan asesores para la temporada",
      text: [{ text: ["Arranca la temporada de obras y nos faltan asesores en 9 tiendas. Ya se nota en la venta."] }] },
  ],
  rules: "refinanciar-v1",
};

registerRules("refinanciar-v1", rulesRefinanciar);
