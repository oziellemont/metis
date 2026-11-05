/**
 * Caso largo · Capítulo «Estabilizar» · Punto Madero · «Mundo Casa abre enfrente».
 *
 * La cadena rival abre una tienda a 800 metros de la tienda principal con precios 15% más bajos en 200 productos de
 * alta rotación. Se decide cómo responder, qué hacer cuando el cliente constructor más grande pide condiciones solo
 * para él, cómo se alinea a los asesores y qué se le presenta al consejo. Cuatro decisiones.
 *
 * Modelo (todo declarado):
 *  - Margen: −3 si se igualan precios en todo; −1 si se igualan solo los 40 productos que el cliente compara;
 *    −1 si se le da crédito a 90 días al constructor; +1 si el bono premia margen y asesoría.
 *  - Clientes: +2 si se compite con asesoría y entrega; −2 si no se responde; +1 si se cierra el acuerdo con el
 *    constructor con condiciones de volumen.
 *  - Caja: −2 por crédito a 90 días al constructor.
 *  - Equipo: +2 si el bono premia asesoría; −1 si se sube la meta de ventas sin cambiar el bono.
 *  - Consejo: +1 si se presenta margen y participación; −1 si solo se presenta venta.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesMundocasa(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const difer = has(run, "diferencia");
  const iguala = has(run, "iguala");
  const ignora = has(run, "ignora");
  const headline = difer && has(run, "bono_asesoria")
    ? "Respondiste con asesoría y entrega, no con precio, y los asesores cobran por vender bien. La tienda principal retuvo a sus clientes."
    : difer ? "Respondiste con asesoría y entrega en los productos que se comparan, aunque los asesores siguen persiguiendo volumen."
      : iguala ? "Igualaste precios en todo: retuviste tráfico, pero el margen de la tienda principal se fue con la guerra de precios."
        : "No respondiste a Mundo Casa: la tienda principal perdió clientes en los productos que todos comparan.";
  const agreement: [string, string][] = [
    ["Respuesta a Mundo Casa", difer ? "Igualar 40 productos clave, asesoría y entrega al día siguiente" : iguala ? "Igualar los 200 productos" : "Sin cambios"],
    ["Constructora Peñasco", has(run, "volumen") ? "Precio por volumen, crédito a 30 días" : has(run, "credito90") ? "Crédito a 90 días" : "Sin acuerdo especial"],
    ["Bono de asesores", has(run, "bono_asesoria") ? "Margen y calificación de asesoría" : "Meta de venta más alta"],
  ];
  const economics: [string, string][] = [
    ["Margen bruto de la tienda", iguala ? "24% (antes 31%)" : difer ? "29% (antes 31%)" : "31%"],
    ["Venta mensual de la tienda", ignora ? "$11.2 M (antes $14 M)" : "$13.6 M (antes $14 M)"],
  ];
  const kpi: RulesResult["kpi"] = [];
  let m = 0;
  const wm: string[] = [];
  if (iguala) { m -= 3; wm.push("−3 por igualar precios en los 200 productos"); }
  if (difer) { m -= 1; wm.push("−1 por igualar solo los 40 productos que el cliente compara"); }
  if (has(run, "credito90")) { m -= 1; wm.push("−1 por el descuento implícito del crédito largo"); }
  if (has(run, "bono_asesoria")) { m += 1; wm.push("+1 porque el bono premia margen y asesoría"); }
  if (m) kpi.push({ key: "margen", delta: m, why: `Regla: ${wm.join(", ")}.` });
  let cl = 0;
  const wl: string[] = [];
  if (difer) { cl += 2; wl.push("+2 por competir con asesoría y entrega"); }
  if (ignora) { cl -= 2; wl.push("−2 por no responder en los productos que todos comparan"); }
  if (has(run, "volumen")) { cl += 1; wl.push("+1 por cerrar al constructor con condiciones de volumen"); }
  if (cl) kpi.push({ key: "clientes", delta: cl, why: `Regla: ${wl.join(", ")}.` });
  if (has(run, "credito90")) kpi.push({ key: "caja", delta: -2, why: "Constructora Peñasco paga a 90 días: $6 M de cuentas por cobrar más." });
  if (has(run, "bono_asesoria")) kpi.push({ key: "equipo", delta: 2, why: "Los asesores cobran por asesorar bien, no solo por vender más." });
  if (has(run, "meta")) kpi.push({ key: "equipo", delta: -1, why: "Se subió la meta de venta sin cambiar cómo se paga." });
  if (has(run, "tablero")) kpi.push({ key: "consejo", delta: 1, why: "El consejo ve margen, participación y clientes retenidos." });
  if (has(run, "solo_venta")) kpi.push({ key: "consejo", delta: -1, why: "Inés pidió el margen que no venía en la presentación." });
  const risks = [
    ...(iguala ? [{ id: "mc-guerra", text: "Mundo Casa puede bajar otra vez y arrastrar el margen de toda la cadena.", owner: "diego" as const }] : []),
    ...(has(run, "credito90") ? [{ id: "mc-precedente", text: "Otros constructores van a pedir el mismo crédito a 90 días.", owner: "claudia" as const }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { margen: iguala ? 24 : difer ? 29 : 31 } };
}

export const MUNDOCASA: EpisodeSpec = {
  contract: 1, id: "mundocasa", version: "1.0.0", approval: "aprobado",
  company: "puntomadero", industry: "Retail", title: "Mundo Casa abre enfrente", subject: "La competencia abre a 800 metros con precios más bajos",
  from: "diego", counterpart: "diego", channel: "email", areas: ["clientes", "estrategia", "negociacion"], cast: ["diego", "octavio", "claudia", "chuy", "beto", "ramos", "ines"],
  lesson: "estrategia", minutes: 6,
  concept: {
    title: "No pelees en el terreno donde el otro es más fuerte",
    text: "Cuando un competidor llega con precios más bajos, igualarlo en todo convierte tu ventaja en su ventaja: gana el que aguanta más tiempo perdiendo margen. Conviene igualar solo lo que el cliente compara y competir en lo que el otro no ofrece, como asesoría, entrega o crédito ordenado. Y cuidar que el equipo cobre por hacer justo eso.",
    nota: "Iguala lo que se compara; diferénciate en lo que no.",
  },
  briefing: {
    message: [
      "Correo de Diego Villarreal, Comercial · 8:15",
      "«Mundo Casa abre el sábado a 800 metros de la tienda principal. Tiene 200 productos 15% más baratos que nosotros.»",
      "«Necesito saber cómo respondemos antes del viernes.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Tienda principal", "$14 M al mes · margen 31%"], ["Productos más baratos en Mundo Casa", "200"], ["Apertura", "Sábado"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "comparan", label: "¿Qué compara el cliente?", keywords: ["compara", "productos clave", "cuales", "mas vendidos", "canasta"], source: "diego",
        answer: "Diego: de los 200, solo 40 los compara el cliente: cemento, pintura blanca, tubería y focos. Los demás casi nadie los revisa." },
      { id: "asesoria", label: "¿Por qué nos compran?", keywords: ["por que compran", "asesoria", "servicio", "entrega", "ventaja"], source: "chuy",
        answer: "Chuy: la mitad de nuestros clientes son maestros de obra. Vienen porque el asesor les dice cuánto material llevar y se los entregamos." },
      { id: "bono", label: "¿Cómo se paga a los asesores?", keywords: ["bono", "comision", "asesores", "como se paga", "incentivo"], source: "octavio",
        answer: "Octavio: el bono es por venta total. Al asesor le da lo mismo vender con margen o con descuento." },
      { id: "caja", label: "¿Cuánto aguanta la caja?", keywords: ["caja", "aguanta", "credito", "efectivo", "flujo"], source: "claudia",
        answer: "Claudia: la caja aguanta una temporada mala, no dos. Cada punto de margen en la tienda principal son $140 mil al mes." },
    ],
    unknowns: [
      { id: "mundo", keywords: ["cuanto aguanta mundo casa", "precio de mundo casa despues", "que hara mundo casa"], answer: "Ese dato no lo tienes: nadie sabe cuánto tiempo sostendrá Mundo Casa esos precios." },
    ],
  },
  advisors: [
    { id: "diego", role: "Director Comercial y de Compras", personality: "Competitivo.", interests: "Ganarle la temporada a Mundo Casa.", relations: "Conoce a los proveedores de los dos.", knows: ["comparan"],
      view: [{ text: ["No tenemos que igualar los 200. El cliente se fija en 40.", "Si igualamos todo, ellos bajan otra vez y perdemos los dos."] }] },
    { id: "chuy", role: "Gerente de la tienda principal", personality: "De piso, habla claro.", interests: "Que su tienda no se vacíe.", relations: "Conoce a los maestros de obra por nombre.", knows: ["asesoria"],
      view: [{ text: ["A mis clientes no los conquistas con el precio del foco. Los conquistas cuando les resuelves la obra.", "Eso Mundo Casa no lo tiene."] }] },
    { id: "octavio", role: "Director de Operaciones y Tiendas", personality: "Veterano.", interests: "Que las tiendas vendan.", relations: "Treinta años en la empresa.", knows: ["bono", "caja"],
      view: [{ text: ["Mis asesores van a hacer lo que les pague el bono.", "Si quieres que vendan asesoría, págales por eso."] }] },
  ],
  terms: {},
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "La respuesta", who: "diego", channel: "junta",
      say: [{ text: ["Diego trae la lista de precios de Mundo Casa.", "«¿Cómo respondemos?»"] }],
      ask: "¿Cómo respondes a Mundo Casa?", freeText: true,
      strategies: [
        { id: "diferencia", text: "Igualar solo los 40 productos que el cliente compara y competir en el resto con asesoría en obra y entrega al día siguiente.", cues: ["40", "los que compara", "asesoria", "entrega", "diferenciar", "solo algunos"], flags: ["diferencia"], trust: 1,
          reply: [{ text: ["Diego: «Así cuidamos el margen donde nadie compara. Mañana tengo la lista.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "alternativas", level: 3, basis: "Compitió donde el rival es débil y solo igualó lo que el cliente compara." },
            { dim: "informacion", level: 3, basis: "Preguntó qué compara el cliente, por qué compra o cómo se paga al equipo.", when: { any: ["q:comparan", "q:asesoria", "q:bono", "q:caja", "a:diego", "a:chuy", "a:octavio"] } },
          ] },
        { id: "iguala", text: "Igualar los precios de Mundo Casa en los 200 productos desde el sábado para no perder a nadie.", cues: ["200", "igualar todo", "todos", "desde el sabado", "no perder"], flags: ["iguala"],
          reply: [{ text: ["Diego: «Se puede. Claudia ya me preguntó cuánto margen nos cuesta.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Entró a una guerra de precios sin medir cuánto aguanta cada lado." }] },
        { id: "ignora", text: "No cambiar nada: nuestros clientes son leales y Mundo Casa no conoce el mercado.", cues: ["no cambiar", "leales", "no conoce", "nada", "esperar"], flags: ["ignora"], trust: -1,
          reply: [{ text: ["Diego: «Ojalá. Yo no apostaría la temporada a eso.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "problema", level: 0, basis: "Subestimó a un competidor que ataca los productos que todos comparan." }] },
      ],
    },
    a2: {
      id: "a2", stage: "El constructor", who: "ramos", channel: "llamada",
      say: [
        { when: { all: ["ignora"] }, text: ["Federico Ramos, de Constructora Peñasco, te llama.", "«Mundo Casa me ofreció 15% menos y crédito a 90 días. Ustedes ni se movieron. ¿Qué me ofreces?»"] },
        { text: ["Federico Ramos, de Constructora Peñasco, te llama.", "«Vi que se están moviendo. Mundo Casa me ofrece crédito a 90 días. ¿Ustedes qué?»"] },
      ],
      ask: "¿Qué le ofreces a Constructora Peñasco?", freeText: true,
      strategies: [
        { id: "volumen", text: "Ofrecerle precio por volumen si compra todo el material de sus tres obras con nosotros, con crédito a 30 días como a los demás.", cues: ["volumen", "tres obras", "30 dias", "como a los demas", "todo el material"], flags: ["volumen"], trust: 1,
          reply: [{ text: ["Ramos: «Treinta días es poco… pero si me entregan en obra, lo firmo.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "negociacion", level: 3, basis: "Cambió precio por volumen sin romper la política de crédito." }] },
        { id: "credito90", text: "Igualar el crédito a 90 días que le ofrece Mundo Casa para no perderlo.", cues: ["90 dias", "igualar credito", "no perderlo", "credito largo"], flags: ["credito90"],
          reply: [{ text: ["Ramos: «Así sí. Le diré a mis colegas que ustedes sí entienden.»", "Claudia levanta la ceja."] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Concedió condiciones que otros clientes van a pedir." }] },
      ],
    },
    a3: {
      id: "a3", stage: "Los asesores", who: "octavio", channel: "junta",
      say: [
        { when: { all: ["iguala"] }, text: ["Octavio y Beto en tu oficina.", "«Con los precios iguales, los asesores venden más piezas pero el bono no les sube. ¿Qué les decimos?»"] },
        { text: ["Octavio y Beto en tu oficina.", "«Si vamos a competir con asesoría, ¿cómo se le va a pagar a la gente de piso?»"] },
      ],
      ask: "¿Cómo alineas a los asesores?", freeText: true,
      strategies: [
        { id: "bono_asesoria", text: "Cambiar el bono: la mitad por margen de la venta y la mitad por la calificación del cliente a la asesoría.", cues: ["bono", "margen", "calificacion", "asesoria", "la mitad"], flags: ["bono_asesoria"], trust: 1,
          reply: [{ text: ["Beto: «Por fin nos pagan por lo que de verdad hacemos. Yo se lo explico a los muchachos.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Alineó lo que se paga con la estrategia que se eligió." }] },
        { id: "meta", text: "Subir 20% la meta de venta del mes con el mismo bono para recuperar lo que se lleve Mundo Casa.", cues: ["meta", "20%", "mismo bono", "recuperar", "vender mas"], flags: ["meta"], trust: -1,
          reply: [{ text: ["Beto: «Más meta con el mismo bono. Ya sé qué me van a preguntar en el piso.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "ejecucion", level: 1, basis: "Pidió más resultado sin cambiar lo que mueve al equipo." }] },
      ],
    },
    a4: {
      id: "a4", stage: "El consejo", who: "ines", channel: "junta",
      say: [{ text: ["Sesión de consejo. Inés Treviño: «¿Cómo nos fue contra Mundo Casa?»"] }],
      ask: "¿Qué presentas al consejo?", freeText: true,
      strategies: [
        { id: "tablero", text: "Presentar venta, margen y clientes retenidos de la tienda principal contra el mes anterior, y qué haremos si Mundo Casa baja otra vez.", cues: ["margen", "clientes retenidos", "venta", "si bajan otra vez", "tablero"], flags: ["tablero"],
          reply: [{ text: ["Inés: «Esto es lo que necesito ver. Tráelo cada mes.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Reportó el efecto completo, incluido lo que costó responder." }],
          commitments: [{ id: "mc-tablero", text: "Tablero mensual de venta, margen y clientes de la tienda principal.", owner: "claudia" }] },
        { id: "solo_venta", text: "Presentar la venta del mes y dejar el margen para la siguiente sesión, cuando esté más claro.", cues: ["venta", "siguiente sesion", "dejar el margen", "mas claro"], flags: ["solo_venta"],
          reply: [{ text: ["Inés: «¿Y el margen? Sin eso no sé si ganamos o solo vendimos más barato.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 1, basis: "Mostró la venta y escondió lo que costó." }] },
      ],
    },
  },
  followUps: [
    { id: "mc-maestros", when: { all: ["diferencia"] }, afterDays: 30, from: "chuy", subject: "Los maestros de obra se quedaron",
      text: [{ text: ["Los maestros de obra siguen viniendo. Dicen que en Mundo Casa nadie les sabe decir cuánto material llevar."] }] },
    { id: "mc-baja", when: { all: ["iguala"] }, afterDays: 21, from: "diego", subject: "Mundo Casa bajó otra vez",
      text: [{ text: ["Mundo Casa bajó otro 5% en los mismos 200 productos. Si igualamos de nuevo, el margen de la tienda queda en 21%."] }] },
    { id: "mc-perdida", when: { all: ["ignora"] }, afterDays: 30, from: "claudia", subject: "La venta de la tienda principal cayó",
      text: [{ text: ["La tienda principal vendió 20% menos este mes. El cemento y la pintura se fueron casi completos a Mundo Casa."] }] },
    { id: "mc-credito", when: { all: ["credito90"] }, afterDays: 25, from: "claudia", subject: "Más constructores piden 90 días",
      text: [{ text: ["Tres constructores más piden crédito a 90 días. Dicen que Ramos les contó."] }] },
  ],
  rules: "mundocasa-v1",
};

registerRules("mundocasa-v1", rulesMundocasa);
