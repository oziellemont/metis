/**
 * Caso largo · Capítulos «Escalar» y «Gobernar» · Vértice Logística · «Comprar a Transportes del Bajío».
 *
 * Un competidor regional con 140 unidades está en venta. Comprarlo daría la región Bajío de un golpe. Se decide
 * cómo revisarlo, qué precio ofrecer, qué hacer con lo que aparece en la revisión y cómo integrar a su gente.
 * Entre 3 y 4 decisiones.
 *
 * Modelo (todo declarado):
 *  - Caja: −2 por la compra; −2 más si se paga el precio completo sin ajustar por lo que apareció; +1 si se
 *    pacta un pago diferido ligado a resultados.
 *  - Clientes: +3 si se compra y se integra con cuidado; +1 si se integra de golpe; −1 si no se compra.
 *  - Equipo: +2 si se retiene a los operadores con un plan; −2 si se integra de golpe.
 *  - Consejo: +1 si se lleva con revisión completa; −2 si se compró sin revisar.
 *  - Margen: −2 si se heredan las multas sin ajustar el precio.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesTransbajio(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const compra = has(run, "compra");
  const ajusta = has(run, "ajusta") || has(run, "diferido");
  const headline = !compra
    ? has(run, "revisa") ? "No compraste: la revisión mostró más riesgo que valor. El Bajío se crece por otra vía."
      : "No compraste. Otro operador se quedó con Transportes del Bajío y ahora compite en tu región."
    : has(run, "integra_cuidado") ? "Compraste Transportes del Bajío y la integración va por etapas: los clientes y los operadores se quedaron."
      : has(run, "integra_golpe") ? "Compraste y cambiaste todo el primer mes. Los procesos son uno solo, pero se fueron operadores y dos clientes."
        : "Compraste Transportes del Bajío.";
  const agreement: [string, string][] = [
    ["Compra", compra ? (has(run, "diferido") ? "$180 M: $140 M hoy y $40 M según resultados" : ajusta ? "$160 M, ajustado por las multas" : "$180 M, precio pedido") : "No se hizo"],
    ["Revisión", has(run, "revisa") ? "Completa: fiscal, flota, contratos y gente" : "Solo estados financieros"],
    ["Integración", has(run, "integra_cuidado") ? "Por etapas, con su gente" : has(run, "integra_golpe") ? "Todo en un mes" : "—"],
  ];
  const economics: [string, string][] = [
    ["Pago inicial", compra ? (has(run, "diferido") ? "$140 M" : ajusta ? "$160 M" : "$180 M") : "$0"],
    ["Multas heredadas", compra ? (ajusta ? "Descontadas del precio" : "$20 M a cargo de Vértice") : "—"],
  ];
  const kpi: RulesResult["kpi"] = [];
  if (compra) {
    kpi.push({ key: "caja", delta: has(run, "diferido") ? -1 : ajusta ? -2 : -4, why: has(run, "diferido") ? "Parte del precio se paga solo si el negocio cumple: sale menos caja hoy." : ajusta ? "Se paga la compra con el precio ajustado." : "Se paga el precio completo, sin descontar lo que apareció en la revisión." });
    if (!ajusta) kpi.push({ key: "margen", delta: -2, why: "Las multas de tránsito y fiscales heredadas salen del resultado." });
    if (has(run, "integra_cuidado")) kpi.push({ key: "clientes", delta: 3, why: "Los clientes del Bajío siguen con la misma gente y ganan cobertura nacional." });
    if (has(run, "integra_golpe")) kpi.push(has(run, "recupera")
      ? { key: "clientes", delta: 1, why: "La cobertura crece; se recuperaron dos de los cuatro clientes grandes tras el cambio brusco." }
      : { key: "clientes", delta: -2, why: "Los clientes grandes del Bajío se fueron con su exgerente." });
    if (has(run, "retiene")) kpi.push({ key: "equipo", delta: 2, why: "Los operadores del Bajío se quedan con un plan claro de sueldo y rutas." });
    if (has(run, "integra_golpe")) kpi.push({ key: "equipo", delta: -2, why: "Uno de cada cinco operadores del Bajío se fue en el primer mes." });
  } else kpi.push({ key: "clientes", delta: -1, why: has(run, "revisa") ? "El Bajío sigue sin cobertura propia por ahora." : "Un competidor se quedó con la región." });
  if (has(run, "revisa")) kpi.push({ key: "consejo", delta: 1, why: "El consejo ve una decisión con revisión completa, compre o no." });
  if (has(run, "sin_revision") && compra) kpi.push({ key: "consejo", delta: -2, why: "Se ofreció comprar una empresa sin revisar sus contingencias." });
  const risks = [
    ...(compra && !ajusta ? [{ id: "tb-multas", text: "Pueden aparecer más multas de la época del dueño anterior.", owner: "patricio" }] : []),
    ...(has(run, "integra_golpe") ? [{ id: "tb-fuga", text: "Más operadores del Bajío pueden irse si no ven un plan.", owner: "rocio" }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { compra: compra ? 1 : 0 } };
}

export const TRANSBAJIO: EpisodeSpec = {
  contract: 1, id: "transbajio", version: "1.0.0", approval: "aprobado",
  company: "vertice", industry: "Logística y distribución", title: "Comprar a Transportes del Bajío", subject: "Un competidor regional está en venta",
  from: "mauricio", counterpart: "elena", channel: "email", areas: ["estrategia", "finanzas", "personas"], cast: ["mauricio", "patricio", "rocio", "elena", "antonio"],
  lesson: "estrategia", minutes: 7,
  concept: {
    title: "En una adquisición, el precio se decide en la revisión y el valor en la integración",
    text: "Comprar una empresa parece una decisión de precio, pero casi todo se juega antes y después. Antes, en revisar lo que no aparece en los estados financieros: multas, contratos, estado de la flota. Después, en cómo se integra a su gente y a sus clientes: lo que compras no son camiones, es la relación que tienen.",
    nota: "Revisa antes de pagar, ajusta el precio por lo que encuentres y cuida a la gente que hace que los clientes se queden.",
  },
  briefing: {
    message: [
      "Correo de Mauricio, Comercial · 8:20",
      "«Transportes del Bajío está en venta. 140 unidades, 30 clientes en León, Querétaro y Aguascalientes. El dueño pide $180 M.»",
      "«Si no nos movemos, Avante lo compra. Dicen que tiene hasta fin de mes.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Empresa", "Transportes del Bajío"], ["Precio pedido", "$180 M"], ["Plazo", "Fin de mes"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "flota", label: "¿En qué estado está la flota?", keywords: ["flota", "unidades", "camiones", "estado", "edad", "mantenimiento"], source: "antonio",
        answer: "Antonio: la flota tiene 7 años en promedio. Una tercera parte necesita motor o llantas en el primer año." },
      { id: "clientes", label: "¿Qué tan atados están sus clientes?", keywords: ["clientes", "contratos", "atados", "relacion", "cartera"], source: "mauricio",
        answer: "Mauricio: la mitad de la venta son 4 clientes, y los atiende el mismo gerente desde hace 12 años. No tienen contrato largo." },
      { id: "caja", label: "¿Nos alcanza la caja?", keywords: ["caja", "alcanza", "dinero", "pagar", "financiar", "credito"], source: "patricio",
        answer: "Patricio: podemos pagar $140 M sin apretarnos. Arriba de eso, necesitamos crédito o pagar una parte después." },
      { id: "gente", label: "¿Y su gente?", keywords: ["gente", "operadores", "sueldo", "sindicato", "personal", "gerente"], source: "rocio",
        answer: "Rocío: 160 operadores con sueldos 8% abajo de los nuestros. Si los igualamos, se quedan; si no, el mercado se los lleva." },
    ],
    unknowns: [
      { id: "avante", keywords: ["avante ofrecio", "cuanto ofrece avante", "oferta de avante", "avante ya"], answer: "No sabes si Avante ya hizo una oferta ni de cuánto. Es lo que dice el mercado." },
    ],
  },
  advisors: [
    { id: "patricio", role: "Director de Finanzas", personality: "Prudente, desconfía de las prisas.", interests: "No pagar de más ni heredar sorpresas.", relations: "Revisó sus estados financieros.", knows: ["caja"],
      view: [{ text: [
        "Sus números se ven bien, pero son números del dueño. Nadie ha revisado multas ni impuestos.",
        "Y el plazo de fin de mes lo puso él, no Avante.",
      ] }] },
    { id: "rocio", role: "Directora de Personas", personality: "Cercana a los operadores.", interests: "Que la gente no se vaya en la transición.", relations: "Conoce a su gerente.", knows: ["gente"],
      view: [{ text: [
        "Lo que vale de esa empresa es su gerente y sus operadores. Si se van, compramos camiones viejos.",
        "Ellos tienen miedo de que los cambiemos a todos.",
      ] }] },
    { id: "antonio", role: "Director de Operaciones", personality: "Directo, conoce cada ruta.", interests: "Que la flota que entre no truene.", relations: "Vio sus patios.", knows: ["flota"],
      view: [{ text: [
        "Los camiones están cansados. Hay que contar eso en el precio.",
        "Las rutas sí son buenas: complementan las nuestras.",
      ] }] },
  ],
  terms: {},
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "Revisar", who: "mauricio", channel: "junta",
      say: [{ text: ["Mauricio está emocionado. Patricio, no tanto.", "«Si vamos, hay que decirle al dueño esta semana.»"] }],
      ask: "¿Cómo arrancas?", freeText: true,
      strategies: [
        { id: "revisar", text: "Pedir tres semanas de revisión completa (impuestos, multas, flota, contratos y gente) antes de hablar de precio.", cues: ["revision", "tres semanas", "impuestos", "multas", "contratos", "antes de"], flags: ["revisa"],
          reply: [{ text: ["«El dueño acepta, a regañadientes. Dice que si Avante ofrece antes, se va con ellos.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 3, basis: "Revisó lo que no está en los estados financieros antes de comprometerse." },
            { dim: "informacion", level: 3, basis: "Usó lo que sabían finanzas, operaciones o personas para decidir qué revisar.", when: { any: ["q:flota", "q:clientes", "q:caja", "q:gente", "a:patricio", "a:antonio", "a:rocio"] } }] },
        { id: "rapido", text: "Ofrecer hoy los $180 M con revisión mínima para ganarle a Avante.", cues: ["hoy", "180", "ganarle", "rapido", "avante", "sin revision"], flags: ["sin_revision"],
          reply: [{ text: ["«¡Acepta en principio! Su abogado manda el contrato.»", "Patricio: «¿Y las multas? ¿Y los impuestos?»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 0, basis: "Compró con prisa una empresa sin revisar sus contingencias." }] },
        { id: "pasar", text: "No entrar: crecer en el Bajío abriendo rutas propias, sin comprar.", cues: ["no entrar", "rutas propias", "sin comprar", "organico", "abrir"], flags: ["pasa"],
          reply: [{ text: ["«Va a tardar más. Avante lo va a comprar.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "alternativas", level: 2, basis: "Consideró crecer por su cuenta, aunque más lento y sin revisar la oportunidad." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Lo que apareció", who: "patricio", channel: "reporte",
      say: [
        { when: { all: ["sin_revision"] }, text: ["Un día antes de firmar, Patricio revisa por su cuenta lo básico.", "«Hay $20 M en multas de tránsito y un adeudo fiscal que el dueño no mencionó. Todavía no firmamos. ¿Qué hacemos?»"] },
        { when: { all: ["pasa"] }, text: ["Dos semanas después, Patricio te manda una nota.", "«Avante está revisando la compra. Si la cierra, nos compite en León con 140 unidades. ¿Lo reconsideramos?»"] },
        { text: ["Patricio trae el reporte de la revisión.", "«Hay $20 M en multas de tránsito y un adeudo fiscal que el dueño no mencionó. Y un tercio de la flota necesita motor.»"] },
      ],
      ask: "¿Qué haces con lo que apareció?", freeText: true,
      strategies: [
        { id: "ajustar", text: "Ofrecer $160 M, descontando las multas y el adeudo, con una cláusula para que el dueño responda por lo que aparezca después.", cues: ["160", "descontar", "multas", "clausula", "responda", "ajustar"], requires: { none: ["pasa"] }, flags: ["compra", "ajusta"],
          reply: [{ text: ["«El dueño se enoja, pero acepta: sabe que nadie más pagaría completo con esto encima.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "negociacion", level: 3, basis: "Usó lo que encontró la revisión para ajustar el precio y protegerse de lo que falta." }] },
        { id: "diferido", text: "Mantener los $180 M, pero pagar $140 M hoy y $40 M en dos años si los clientes se quedan.", cues: ["diferido", "140", "40", "dos anos", "si los clientes", "despues"], requires: { none: ["pasa"] }, flags: ["compra", "diferido"],
          reply: [{ text: ["«Acepta. Le conviene: confía en que sus clientes se quedan.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Ligó parte del precio a que el negocio cumpla: el riesgo lo comparte el vendedor." }] },
        { id: "retirarse", text: "Retirarse de la compra: hay más riesgo del que vale la región.", cues: ["retirar*", "no compramos", "riesgo", "no vale"], requires: { none: ["pasa"] },
          reply: [{ text: ["«Le aviso al dueño. Ya sabíamos lo que no nos dijo.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 2, basis: "Se retiró a tiempo con información, aunque dejó la región abierta." }] },
        { id: "firmar_igual", text: "Firmar los $180 M como se acordó para no perder la compra frente a Avante.", cues: ["firmar", "como se acordo", "180", "no perder"], requires: { all: ["sin_revision"] }, flags: ["compra"],
          reply: [{ text: ["«Firmado. Las multas quedan de nuestro lado.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Pagó el precio completo sabiendo que heredaba multas y adeudos." }] },
        { id: "reconsiderar", text: "Volver a la mesa con una revisión completa antes de que Avante cierre.", cues: ["volver", "reconsider*", "revision", "antes de que"], requires: { all: ["pasa"] }, flags: ["revisa", "compra", "ajusta"],
          reply: [{ text: ["«El dueño prefiere tratar con nosotros. Con lo que apareció, el precio baja a $160 M.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "adaptacion", level: 3, basis: "Cambió de postura cuando cambiaron los hechos." }] },
        { id: "seguir_organico", text: "Seguir con el plan de rutas propias aunque Avante compre.", cues: ["seguir", "rutas propias", "plan", "aunque"], requires: { all: ["pasa"] },
          reply: [{ text: ["«Entendido. Vamos a necesitar más vendedores en León.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Sostuvo el plan sin pesar lo que cambia si el competidor crece." }] },
      ],
    },
    a3: {
      id: "a3", stage: "Integrar", who: "rocio", channel: "junta",
      say: [
                { text: ["Firmado. Rocío reúne al comité.", "«Su gerente y sus 160 operadores esperan saber qué va a pasar. ¿Cómo integramos?»"] },
      ],
      ask: "¿Cómo integras a Transportes del Bajío?", freeText: true,
      strategies: [
        { id: "cuidado", text: "Integrar por etapas: su gerente se queda al frente del Bajío, igualamos sueldos en seis meses y unificamos sistemas al final.", cues: ["etapas", "gerente", "se queda", "igualar", "sueldos", "seis meses"], flags: ["integra_cuidado", "retiene"],
          reply: [{ text: ["«El gerente se queda. Sus clientes ni notaron el cambio.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Protegió lo que hacía valiosa la compra: la relación con los clientes y su gente." }],
          commitments: [{ id: "tb-sueldos", text: "Igualar sueldos de los operadores del Bajío en seis meses.", owner: "rocio" }] },
        { id: "golpe", text: "Integrar todo el primer mes: nuestros procesos, nuestros sistemas y nuestro gerente.", cues: ["primer mes", "todo", "nuestros procesos", "nuestro gerente", "de golpe"], flags: ["integra_golpe"],
          reply: [{ text: ["«Va. Aviso que su gerente sale el viernes.»", "Mauricio: «Ojo, sus 4 clientes grandes lo siguen a él.»"] }],
          next: [{ to: "a5" }],
          evidence: [{ dim: "ejecucion", level: 1, basis: "Unificó rápido, pero sacó a la persona que sostenía a los clientes." }] },
      ],
    },
    a5: {
      id: "a5", stage: "Clientes en riesgo", who: "mauricio", channel: "llamada",
      say: [{ text: ["Dos semanas después, Mauricio te llama.", "«El exgerente del Bajío está ofreciendo llevarse a sus clientes a Avante. Dos ya le dijeron que sí.»"] }],
      ask: "¿Qué haces con los clientes en riesgo?", freeText: true,
      strategies: [
        { id: "recuperar", text: "Visitar a los cuatro clientes grandes con su operador de siempre y ofrecerles rutas nacionales al mismo precio por un año.", cues: ["visitar", "clientes grandes", "operador", "rutas nacionales", "mismo precio"], flags: ["recupera"],
          reply: [{ text: ["«Dos se quedan. Los otros dos ya firmaron con Avante.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "adaptacion", level: 3, basis: "Reconoció el error de integración y fue directo a cuidar a los clientes." }] },
        { id: "dejar", text: "Dejarlos ir: los clientes que se queden ya trabajarán a nuestra manera.", cues: ["dejarlos", "ir", "nuestra manera", "que se vayan"],
          reply: [{ text: ["«Entendido. Ajusto el pronóstico del Bajío a la baja.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Dejó ir el valor que justificaba la compra." }] },
      ],
    },
    a4: {
      id: "a4", stage: "El consejo", who: "elena", channel: "llamada",
      say: [{ text: ["Elena te llama.", "«Me enteré de que no compraron. ¿Cómo vamos a crecer en el Bajío entonces?»"] }],
      ask: "¿Qué le respondes a la consejera?", freeText: true,
      strategies: [
        { id: "plan_bajio", text: "Presentarle un plan de rutas propias con metas trimestrales y lo que encontró la revisión.", cues: ["plan", "metas", "trimestral*", "revision", "rutas"],
          reply: [{ text: ["«Me parece serio. Llévalo a la sesión.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Explicó por qué no y qué sigue, con metas medibles." }] },
        { id: "despues", text: "Decirle que el Bajío puede esperar un año.", cues: ["esperar", "un ano", "despues", "no es prioridad"],
          reply: [{ text: ["«No es lo que el consejo aprobó como prioridad. Lo vamos a discutir.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 1, basis: "Pospuso una prioridad del consejo sin una alternativa." }] },
      ],
    },
  },
  followUps: [
    { id: "tb-gerente", when: { all: ["integra_cuidado"] }, afterDays: 30, from: "mauricio", subject: "El Bajío, primer mes",
      text: [{ text: ["Primer mes con el Bajío: los 4 clientes grandes renovaron y uno ya pidió rutas a Monterrey."] }] },
    { id: "tb-fuga", when: { all: ["integra_golpe"] }, afterDays: 21, from: "rocio", subject: "Se van operadores del Bajío",
      text: [{ text: ["Se fueron 32 operadores del Bajío en tres semanas, varios con Avante. Su exgerente se llevó a dos clientes."] }] },
    { id: "tb-multas", when: { all: ["compra"], none: ["ajusta", "diferido"] }, afterDays: 14, from: "patricio", subject: "Apareció otra multa del Bajío",
      text: [{ text: ["Llegó otra multa fiscal de cuando la empresa era del dueño anterior. Sin cláusula, la pagamos nosotros."] }] },
    { id: "tb-avante", when: { none: ["compra"] }, afterDays: 30, from: "mauricio", subject: "Avante compró Transportes del Bajío",
      text: [{ text: ["Avante cerró la compra. Ya está ofreciendo tarifas más bajas a nuestros clientes en León."] }] },
  ],
  rules: "transbajio-v1",
};

registerRules("transbajio-v1", rulesTransbajio);
