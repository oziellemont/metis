/**
 * Caso largo · Capítulos «Construir capacidad» y «Acelerar» · Grupo Brasa · «Un socio quiere 10 franquicias».
 *
 * Un empresario de Monterrey ofrece abrir 10 sucursales con la marca en dos años. Lourdes quiere firmar ya; Don
 * Ignacio teme que la comida deje de saber igual. Se decide si y cómo franquiciar, qué controles poner, cómo
 * llevarlo al consejo familiar y qué hacer cuando la primera sucursal falla una auditoría. Entre 3 y 4 decisiones.
 *
 * Modelo (todo declarado):
 *  - Caja: +3 con la cuota de entrada si se firma; +1 con un piloto de 2 sucursales.
 *  - Clientes: +2 si se franquicia con manual y auditorías; −3 si se firma sin controles; −1 si una sucursal mala
 *    sigue abierta.
 *  - Consejo: +2 si la familia aprueba con datos; −2 si se impone sobre el fundador.
 *  - Margen: +1 por regalías si se firma.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesFranquicia(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const firma = has(run, "firma") || has(run, "piloto");
  const control = has(run, "manual");
  const headline = !firma
    ? "No se franquicia por ahora. La marca sigue creciendo solo con sucursales propias."
    : has(run, "piloto") ? "Arranca un piloto de 2 franquicias con manual y auditorías. Si cumplen, vienen las otras 8."
      : control ? "Se firman las 10 franquicias con manual, auditorías y derecho a cerrar la que no cumpla."
        : "Se firman las 10 franquicias sin manual ni auditorías. Crecer fue rápido; cuidar la marca, no tanto.";
  const agreement: [string, string][] = [
    ["Franquicias", !firma ? "Ninguna" : has(run, "piloto") ? "2 de piloto, 8 condicionadas" : "10 en dos años"],
    ["Controles", control ? "Manual de operación, auditoría mensual y cláusula de cierre" : firma ? "Ninguno por escrito" : "—"],
    ["Consejo familiar", has(run, "familia_ok") ? "Aprobó con datos" : has(run, "impone") ? "Se impuso sobre el fundador" : "Sin votación"],
  ];
  const economics: [string, string][] = [
    ["Cuota de entrada", !firma ? "$0" : has(run, "piloto") ? "$3 M (2 sucursales)" : "$15 M (10 sucursales)"],
    ["Regalías", firma ? "6% de la venta de cada franquicia" : "—"],
  ];
  const kpi: RulesResult["kpi"] = [];
  if (has(run, "firma")) kpi.push({ key: "caja", delta: 3, why: "Entra la cuota de 10 franquicias: $15 M." });
  else if (has(run, "piloto")) kpi.push({ key: "caja", delta: 1, why: "Entra la cuota del piloto: $3 M." });
  if (firma) kpi.push({ key: "margen", delta: 1, why: "Las regalías (6%) suman venta sin costo de operación." });
  if (firma && control) kpi.push({ key: "clientes", delta: 2, why: "La marca llega a otra ciudad con la misma receta y servicio." });
  if (firma && !control) kpi.push({ key: "clientes", delta: -3, why: "Sin manual ni auditoría, las reseñas de las franquicias bajan la calificación de toda la marca." });
  if (has(run, "tolera")) kpi.push({ key: "clientes", delta: -1, why: "Una sucursal que falla la auditoría sigue abierta con la marca." });
  if (has(run, "familia_ok")) kpi.push({ key: "consejo", delta: 2, why: "El fundador y la cofundadora votan juntos, con datos." });
  if (has(run, "impone")) kpi.push({ key: "consejo", delta: -2, why: "Se decidió por encima del fundador: el consejo queda dividido." });
  if (!firma && !has(run, "impone")) kpi.push({ key: "consejo", delta: -1, why: "La cofundadora pierde una oportunidad que defendía, sin alternativa." });
  return { headline, agreement, economics, kpi, risks: firma && !control ? [{ id: "fr-marca", text: "Una franquicia mal operada puede dañar la reputación de todas las sucursales.", owner: "andres" }] : [], data: { firma: firma ? 1 : 0 } };
}

export const FRANQUICIA: EpisodeSpec = {
  contract: 1, id: "franquicia", version: "1.0.0", approval: "aprobado",
  company: "brasa", industry: "Restaurantes", title: "10 franquicias en Monterrey", subject: "Un empresario quiere franquiciar la marca",
  from: "lourdes", counterpart: "ignacio", channel: "junta", areas: ["estrategia", "alineacion", "operacion"], cast: ["lourdes", "ignacio", "andres", "fer", "beatriz"],
  lesson: "estrategia", minutes: 7,
  concept: {
    title: "Crecer con socios multiplica lo bueno y lo malo: primero el sistema, luego la escala",
    text: "Franquiciar parece crecer con dinero de otros, pero lo que en realidad se presta es la marca. Si la receta, el servicio y los controles no están escritos y medidos, cada sucursal nueva la interpreta a su manera. Por eso se prueba en pequeño, se fija qué es innegociable y se acuerda con quien cuida la marca desde el inicio.",
    nota: "Escribe el sistema antes de multiplicarlo, prueba en pequeño y construye la decisión con quien cuida la identidad.",
  },
  briefing: {
    message: [
      "Lourdes, cofundadora, te detiene en el pasillo · 12:40",
      "«Un empresario de Monterrey quiere abrir 10 sucursales con nuestra marca en dos años. Paga $1.5 M por cada una y 6% de regalías.»",
      "«Mi papá dice que no, que la comida va a dejar de saber igual. Yo digo que es ahora o nunca. Tú decides cómo lo llevamos.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Oferta", "10 sucursales en 2 años"], ["Cuota", "$1.5 M por sucursal + 6%"], ["Consejo", "Dividido"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "manual", label: "¿Tenemos manual de operación?", keywords: ["manual", "receta", "estandar", "procesos", "escrito"], source: "andres",
        answer: "Chef Andrés: la receta está en mi cabeza y en la de tres jefes de cocina. No hay manual escrito que otro pueda seguir." },
      { id: "socio", label: "¿Quién es el empresario?", keywords: ["quien", "empresario", "socio", "experiencia", "historial"], source: "fer",
        answer: "Fer: tiene 6 franquicias de cafeterías, todas abiertas hace más de 3 años. Nunca ha operado cocina de carnes." },
      { id: "numeros", label: "¿Qué tan rentable es una sucursal?", keywords: ["rentable", "numeros", "venta", "utilidad", "margen", "sucursal"], source: "fer",
        answer: "Fer: una sucursal promedio vende $18 M al año y deja 11%. La regalía de 6% sería $1.1 M por sucursal al año." },
      { id: "resenas", label: "¿Cómo nos califican?", keywords: ["resenas", "calificacion", "clientes", "estrellas", "opinion"], source: "beatriz",
        answer: "Beatriz: 4.6 estrellas en promedio. Las dos sucursales con menos de 4.3 son las que abrimos sin el chef los primeros meses." },
    ],
    unknowns: [
      { id: "monterrey", keywords: ["cuanto venderia en monterrey", "funciona en monterrey", "le gusta a monterrey", "mercado de monterrey"], answer: "Ese dato no existe todavía: la marca nunca ha operado fuera de Jalisco." },
    ],
  },
  advisors: [
    { id: "andres", role: "Director de Cocina", personality: "Orgulloso de su receta.", interests: "Que la comida sepa igual en cualquier sucursal.", relations: "Don Ignacio confía en él.", knows: ["manual"],
      view: [{ text: [
        "Puedo escribir el manual, pero tardo tres meses. Y alguien tiene que ir a revisar que lo sigan.",
        "Las sucursales que abrimos sin mí son las que peor califican. Eso dice todo.",
      ] }] },
    { id: "fer", role: "Directora de Finanzas", personality: "Cuidadosa con los números.", interests: "Crecer sin poner caja propia.", relations: "Revisó la propuesta.", knows: ["socio", "numeros"],
      view: [{ text: [
        "El dinero es bueno: $15 M de entrada y regalías sin poner un peso.",
        "Pero el socio nunca ha hecho cocina de carnes. Eso no lo resuelve el contrato.",
      ] }] },
    { id: "beatriz", role: "Consejera independiente", personality: "Pide datos antes de opinar.", interests: "Que el consejo decida con datos y no con apellidos.", relations: "Media entre padre e hija.", knows: ["resenas"],
      view: [{ text: [
        "Don Ignacio no está en contra de crecer; está en contra de perder el sabor. Dale eso por escrito.",
        "Y Lourdes necesita sentir que no se pierde la oportunidad.",
      ] }] },
  ],
  terms: {},
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "La oferta", who: "lourdes", channel: "junta",
      say: [{ text: ["Lourdes espera tu respuesta. El empresario pide una señal esta semana."] }],
      ask: "¿Qué propones?", freeText: true,
      strategies: [
        { id: "piloto", text: "Proponer un piloto de 2 franquicias con manual de operación, auditoría mensual y cláusula para cerrar la que no cumpla; las otras 8 si el piloto pasa.", cues: ["piloto", "2 franquicias", "manual", "auditoria", "clausula", "si pasa"], flags: ["piloto", "manual"],
          reply: [{ text: ["«Mmm. Es menos de lo que quería, pero lo puedo vender. Y a mi papá le va a gustar lo del manual.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Probó en pequeño con controles en lugar de elegir entre todo o nada." },
            { dim: "informacion", level: 3, basis: "Usó lo que se sabía del manual, del socio o de las reseñas para diseñar el piloto.", when: { any: ["q:manual", "q:socio", "q:resenas", "a:andres", "a:fer", "a:beatriz"] } }] },
        { id: "todas", text: "Firmar las 10 de una vez: es ahora o nunca y el dinero entra ya.", cues: ["10", "de una vez", "ahora o nunca", "firmar", "dinero"], flags: ["firma"],
          reply: [{ text: ["«¡Eso! Le aviso hoy.»", "Andrés, al enterarse: «¿Y quién les va a enseñar a cocinar?»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Firmó la escala completa sin un sistema escrito que la sostenga." }] },
        { id: "no", text: "Decir que no: la marca no está lista para franquiciar.", cues: ["no", "no esta lista", "rechazar", "todavia no"], flags: ["rechaza"],
          reply: [{ text: ["«Entonces se va con otra marca. Que conste que yo dije que sí.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "alternativas", level: 1, basis: "Vio un riesgo real, pero no buscó una forma de reducirlo." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Controles", who: "andres", channel: "junta",
      say: [
        { when: { all: ["rechaza"] }, text: ["Al día siguiente, Andrés pasa a tu oficina.", "«Hiciste bien en frenar. Pero si algún día queremos crecer fuera de Jalisco, nos va a pasar lo mismo. ¿Qué hacemos con eso?»"] },
        { when: { all: ["manual"] }, text: ["Andrés: «El manual lo tengo en tres meses. ¿Quién audita y qué es innegociable?»"] },
        { text: ["Andrés, molesto: «Firmaste 10 sucursales y no hay manual. ¿Qué hacemos?»"] },
      ],
      ask: "¿Cómo cuidas la marca?", freeText: true,
      strategies: [
        { id: "sistema", requires: { none: ["rechaza"] }, text: "Andrés escribe el manual con tres cosas innegociables (carne, salsas y tiempos), y un auditor de cocina visita cada franquicia cada mes.", cues: ["manual", "innegociable", "auditor", "cada mes", "carne", "salsas"], flags: ["manual"],
          reply: [{ text: ["«Así sí. Lo que no está en el manual, que lo decida el franquiciatario.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Definió qué es innegociable y cómo se mide." }],
          commitments: [{ id: "fr-manual", text: "Manual de operación con tres innegociables y auditoría mensual.", owner: "andres" }] },
        { id: "confiar", requires: { none: ["rechaza"] }, text: "Confiar en la experiencia del socio: ya opera franquicias, sabrá hacerlo.", cues: ["confiar", "experiencia", "ya opera", "sabra"],
          reply: [{ text: ["«Ya opera cafeterías, no carnes. Bueno, tú sabes.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "riesgos", level: 0, basis: "Dejó la marca en manos de un socio sin experiencia en esa cocina y sin controles." }] },
        { id: "preparar", requires: { all: ["rechaza"] }, text: "Pedirle que escriba el manual de todas formas en los próximos tres meses, para que la marca esté lista cuando se decida crecer.", cues: ["manual", "tres meses", "lista", "preparar", "de todas formas"], flags: ["prepara"],
          reply: [{ text: ["«Me gusta. Así la próxima vez no dependemos de mi cabeza.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Convirtió el no en un plan: el sistema primero, la escala después." }],
          commitments: [{ id: "fr-manual", text: "Manual de operación escrito en tres meses.", owner: "andres" }] },
        { id: "olvidar", requires: { all: ["rechaza"] }, text: "Dejar el tema: por ahora la marca crece solo en Jalisco.", cues: ["dejar", "olvidar", "jalisco", "por ahora"],
          reply: [{ text: ["«Como digas, jefe.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "problema", level: 1, basis: "Frenó el riesgo, pero dejó sin resolver lo que impedía crecer." }] },
      ],
    },
    a3: {
      id: "a3", stage: "El consejo familiar", who: "ignacio", channel: "junta",
      say: [
        { when: { all: ["rechaza"] }, text: ["Don Ignacio te busca.", "«Me dijo Lourdes que dijiste que no. Gracias. Pero mi hija está muy molesta. ¿Cómo arreglamos esto?»"] },
        { text: ["Sesión del consejo. Don Ignacio cruza los brazos.", "«Explícame por qué esto no va a arruinar lo que construí.»"] },
      ],
      ask: "¿Cómo lo llevas con Don Ignacio?", freeText: true,
      strategies: [
        { id: "datos", text: "Mostrarle las reseñas de las sucursales sin chef, el manual y la cláusula de cierre, y pedir que él firme los innegociables.", cues: ["resenas", "manual", "clausula", "firme", "innegociables", "datos"], requires: { none: ["rechaza"] }, flags: ["familia_ok"],
          reply: [{ text: ["Don Ignacio lee despacio.", "«Si yo firmo lo que no se toca, voto a favor.»"] }],
          next: [{ when: { all: ["piloto"] }, to: "a4" }, { to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Respondió al miedo real del fundador con datos y le dio un papel en la decisión." }] },
        { id: "imponer", text: "Recordarle que la decisión operativa es del director y votarlo con la mayoría.", cues: ["director", "decision", "mayoria", "votar"], requires: { none: ["rechaza"] }, flags: ["impone"],
          reply: [{ text: ["«Gana la votación. Pero esto no se me va a olvidar.»"] }],
          next: [{ when: { all: ["piloto"] }, to: "a4" }, { to: "close" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Ganó la votación a costa de la confianza del fundador." }] },
        { id: "alternativa", text: "Proponer a Lourdes abrir 2 sucursales propias en Monterrey para probar el mercado, con Don Ignacio a cargo del sabor.", cues: ["sucursales propias", "monterrey", "probar", "mercado", "sabor"], requires: { all: ["rechaza"] }, flags: ["familia_ok"],
          reply: [{ text: ["Lourdes: «Es más lento, pero es nuestro.» Don Ignacio asiente."] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Convirtió un no en otra forma de crecer que la familia apoya." }] },
        { id: "nada_mas", text: "Dejarlo así: la decisión ya está tomada.", cues: ["dejarlo", "ya esta", "tomada"], requires: { all: ["rechaza"] },
          reply: [{ text: ["«Como quieras. Lourdes no va a votar contigo un buen rato.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Cerró la oportunidad sin atender a quien la defendía." }] },
      ],
    },
    a4: {
      id: "a4", stage: "Primera auditoría", who: "andres", channel: "reporte",
      say: [{ text: ["Tres meses después. Andrés trae la primera auditoría.", "«Una de las dos franquicias del piloto sacó 58 de 100. Cambiaron la salsa por una comprada.»"] }],
      ask: "¿Qué haces con la franquicia que no cumple?", freeText: true,
      strategies: [
        { id: "corregir", text: "Darle 30 días para corregir con un chef de apoyo; si no llega a 85, aplicar la cláusula y cerrar.", cues: ["30 dias", "corregir", "chef", "85", "clausula", "cerrar"],
          reply: [{ text: ["«A los 30 días sacan 91. Volvieron a la salsa de la casa.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Aplicó el sistema: plazo claro, ayuda y consecuencia." }] },
        { id: "tolerar", text: "Dejarlo pasar: es el piloto y no queremos asustar al socio.", cues: ["dejarlo pasar", "piloto", "no asustar"], flags: ["tolera"],
          reply: [{ text: ["«Ok. Pero si la primera no cumple y no pasa nada, las otras 8 tampoco van a cumplir.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Un control que no se aplica no es un control." }] },
      ],
    },
  },
  followUps: [
    { id: "fr-piloto", when: { all: ["piloto"], none: ["tolera"] }, afterDays: 45, from: "lourdes", subject: "El piloto de Monterrey va bien",
      text: [{ text: ["Las dos franquicias del piloto ya pasan de 85 en auditoría. El socio pide arrancar las siguientes 4."] }] },
    { id: "fr-resenas", when: { all: ["firma"], none: ["manual"] }, afterDays: 30, from: "beatriz", subject: "Bajan las reseñas de la marca",
      text: [{ text: ["Las primeras franquicias tienen 3.8 estrellas. Ya hay reseñas que dicen «no es lo mismo que en Guadalajara»."] }] },
    { id: "fr-propias", when: { all: ["rechaza", "familia_ok"] }, afterDays: 40, from: "fer", subject: "Local para Monterrey",
      text: [{ text: ["Encontramos local para la primera sucursal propia en Monterrey. Don Ignacio quiere ir a la inauguración."] }] },
  ],
  rules: "franquicia-v1",
};

registerRules("franquicia-v1", rulesFranquicia);
