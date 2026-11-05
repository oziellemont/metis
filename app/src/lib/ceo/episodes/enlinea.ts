/**
 * Caso largo · Capítulo «Construir capacidad» · Punto Madero · «La tienda en línea promete de más».
 *
 * La tienda en línea promete entrega en 24 horas y uno de cada cinco pedidos falla porque el inventario del sistema
 * no coincide con el anaquel. Se decide qué hacer con la promesa, cómo se alinea a tiendas con la tienda en línea,
 * cómo se atiende a los clientes afectados y qué se le dice al consejo. Cuatro decisiones.
 *
 * Modelo (todo declarado):
 *  - Clientes: +2 si se ajusta la promesa a lo que se puede cumplir; −2 si se mantiene sin corregir; +1 si se llama
 *    a cada cliente afectado; −1 si solo se manda un cupón general.
 *  - Margen: −1 por el cupón general.
 *  - Equipo: +2 si tiendas y tienda en línea comparten la meta; −2 si se culpa a las tiendas en público.
 *  - Caja: −1 por el conteo de inventario con personal extra.
 *  - Consejo: +1 si se presenta la tasa de pedidos cumplidos; −1 si se presenta solo la venta en línea.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesEnlinea(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const ajusta = has(run, "ajusta");
  const mantiene = has(run, "mantiene");
  const culpa = has(run, "culpa");
  const cumplidos = ajusta ? (has(run, "meta_comun") ? 97 : 93) : mantiene ? 80 : has(run, "meta_comun") ? 88 : 82;
  const headline = ajusta && has(run, "meta_comun")
    ? "Ajustaste la promesa a lo que el anaquel puede cumplir y tiendas y tienda en línea comparten la meta. 97 de cada 100 pedidos llegan a tiempo."
    : ajusta ? "Ajustaste la promesa a lo que se puede cumplir, aunque tiendas y tienda en línea siguen con metas separadas."
      : culpa ? "Culpaste a las tiendas en público: el inventario sigue sin cuadrar y la gente de piso dejó de avisar los faltantes."
        : "Mantuviste la promesa de 24 horas sin corregir el inventario. Uno de cada cinco pedidos sigue fallando.";
  const agreement: [string, string][] = [
    ["Promesa de entrega", ajusta ? "24 h solo con existencia confirmada; 48 h en el resto" : "24 h en todo"],
    ["Inventario", ajusta ? "Conteo de los 500 productos más pedidos" : "Sin cambios"],
    ["Metas", has(run, "meta_comun") ? "Compartida entre tiendas y tienda en línea" : "Separadas"],
    ["Clientes afectados", has(run, "llama") ? "Llamada uno por uno" : "Cupón general de 10%"],
  ];
  const economics: [string, string][] = [
    ["Pedidos cumplidos a tiempo", `${cumplidos} de cada 100 (antes 80)`],
    ["Costo del conteo", ajusta ? "$0.4 M" : "$0"],
  ];
  const kpi: RulesResult["kpi"] = [];
  let cl = 0;
  const wl: string[] = [];
  if (ajusta) { cl += 2; wl.push("+2 por prometer solo lo que se puede cumplir"); }
  if (mantiene || culpa) { cl -= 2; wl.push("−2 por mantener una promesa que falla uno de cada cinco pedidos"); }
  if (has(run, "llama")) { cl += 1; wl.push("+1 por llamar a cada cliente afectado"); }
  if (has(run, "cupon")) { cl -= 1; wl.push("−1 porque un cupón general no resuelve el pedido que no llegó"); }
  if (cl) kpi.push({ key: "clientes", delta: cl, why: `Regla: ${wl.join(", ")}.` });
  if (has(run, "cupon")) kpi.push({ key: "margen", delta: -1, why: "El cupón de 10% se usa también en compras que no tuvieron problema." });
  let e = 0;
  const we: string[] = [];
  if (has(run, "meta_comun")) { e += 2; we.push("+2 porque tiendas y tienda en línea ganan con la misma meta"); }
  if (culpa) { e -= 2; we.push("−2 por culpar a las tiendas en público"); }
  if (e) kpi.push({ key: "equipo", delta: e, why: `Regla: ${we.join(", ")}.` });
  if (ajusta) kpi.push({ key: "caja", delta: -1, why: "El conteo de inventario con personal extra cuesta $0.4 M." });
  if (has(run, "cumplimiento")) kpi.push({ key: "consejo", delta: 1, why: "El consejo ve cuántos pedidos se cumplen, no solo cuántos se venden." });
  if (has(run, "solo_venta")) kpi.push({ key: "consejo", delta: -1, why: "Don Esteban se enteró de las quejas por un amigo, no por el reporte." });
  const risks = [
    ...(!ajusta ? [{ id: "el-quejas", text: "Las quejas en redes por pedidos que no llegan siguen creciendo.", owner: "monica" as const }] : []),
    ...(!has(run, "meta_comun") ? [{ id: "el-metas", text: "Las tiendas siguen sin ganar nada cuando surten un pedido en línea.", owner: "octavio" as const }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { cumplidos } };
}

export const ENLINEA: EpisodeSpec = {
  contract: 1, id: "enlinea", version: "1.0.0", approval: "aprobado",
  company: "puntomadero", industry: "Retail", title: "La tienda en línea promete de más", subject: "Uno de cada cinco pedidos en línea falla",
  from: "monica", counterpart: "monica", channel: "email", areas: ["clientes", "operacion", "comunicacion"], cast: ["monica", "octavio", "karla", "beto", "chuy", "garza", "claudia"],
  lesson: "alineacion", minutes: 6,
  concept: {
    title: "Una promesa al cliente es tan buena como el proceso que la cumple",
    text: "Prometer entrega rápida vende, pero si el inventario del sistema no coincide con el anaquel, cada pedido fallido cuesta más que el que no se vendió. Antes de crecer un canal, ajusta la promesa a lo que el proceso puede cumplir y haz que las áreas que lo cumplen ganen con la misma meta. Si cada área gana por su lado, el cliente queda en medio.",
    nota: "Promete lo que el anaquel confirma.",
  },
  briefing: {
    message: [
      "Correo de Mónica Saldívar, Experiencia del Cliente · 9:10",
      "«La tienda en línea creció 40% en el trimestre, pero uno de cada cinco pedidos no llega en las 24 horas que prometemos.»",
      "«Karla tiene 600 quejas abiertas. Necesito tu decisión esta semana.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Pedidos en línea al mes", "8,000"], ["Pedidos que fallan", "1 de cada 5"], ["Quejas abiertas", "600"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "causa", label: "¿Por qué fallan los pedidos?", keywords: ["por que fallan", "causa", "inventario", "sistema", "anaquel"], source: "monica",
        answer: "Mónica: en 7 de cada 10 pedidos fallidos, el sistema decía que había existencia y en el anaquel no estaba." },
      { id: "tiendas", label: "¿Qué dicen las tiendas?", keywords: ["tiendas", "piso", "surtir", "que dicen", "asesores"], source: "beto",
        answer: "Beto: a la gente de piso nadie le paga por surtir un pedido en línea. Si hay cliente en el mostrador, el pedido espera." },
      { id: "bono", label: "¿Cómo se mide a las tiendas?", keywords: ["bono", "meta", "como se mide", "venta de tienda", "incentivo"], source: "octavio",
        answer: "Octavio: la venta en línea no cuenta para la meta de la tienda. Para los gerentes, surtirla es trabajo extra." },
      { id: "quejas", label: "¿Qué piden los clientes?", keywords: ["quejas", "clientes", "piden", "que quieren", "reclaman"], source: "karla",
        answer: "Karla: la mayoría no pide descuento; quiere saber cuándo llega su pedido. Los que reciben una llamada casi siempre vuelven a comprar." },
    ],
    unknowns: [
      { id: "competencia", keywords: ["mundo casa en linea", "competencia en linea", "cuanto promete mundo casa"], answer: "Ese dato no lo tienes: nadie ha medido qué tanto cumple la competencia." },
    ],
  },
  advisors: [
    { id: "monica", role: "Directora de Experiencia del Cliente y Tienda en Línea", personality: "Exigente con la promesa.", interests: "Que ningún cliente reciba una promesa que no se cumple.", relations: "Choca seguido con Octavio.", knows: ["causa"],
      view: [{ text: ["Prefiero prometer 48 horas y cumplir, que prometer 24 y quedar mal.", "El problema empieza en el inventario."] }] },
    { id: "octavio", role: "Director de Operaciones y Tiendas", personality: "Veterano, defiende a sus tiendas.", interests: "Que las tiendas vendan.", relations: "Treinta años en la empresa.", knows: ["bono"],
      view: [{ text: ["A mis gerentes se les mide por la venta de la tienda. El pedido en línea no les suma.", "No los culpen por hacer lo que les pedimos."] }] },
    { id: "karla", role: "Gerente del centro de atención", personality: "Paciente.", interests: "Responder cada queja el mismo día.", relations: "Habla con los clientes todo el día.", knows: ["quejas", "tiendas"],
      view: [{ text: ["Los clientes no quieren un cupón. Quieren que alguien les diga la verdad.", "Con una llamada recupero a casi todos."] }] },
  ],
  terms: {},
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "La promesa", who: "monica", channel: "junta",
      say: [{ text: ["Mónica pone en la pantalla los pedidos fallidos del mes.", "«¿Qué hacemos con la promesa de 24 horas?»"] }],
      ask: "¿Qué haces con la promesa de entrega?", freeText: true,
      strategies: [
        { id: "ajusta", text: "Prometer 24 horas solo cuando la tienda confirme la existencia, 48 en el resto, y contar esta semana los 500 productos más pedidos.", cues: ["confirme", "48 horas", "contar", "500", "existencia", "ajustar"], flags: ["ajusta"], trust: 1,
          reply: [{ text: ["Mónica: «Vamos a vender un poco menos rápido, pero vamos a cumplir. Hoy cambio la página.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "problema", level: 3, basis: "Identificó que la falla estaba en el inventario y ajustó la promesa a lo que se puede cumplir." },
            { dim: "informacion", level: 3, basis: "Preguntó la causa, la visión de las tiendas, cómo se mide o qué piden los clientes.", when: { any: ["q:causa", "q:tiendas", "q:bono", "q:quejas", "a:monica", "a:octavio", "a:karla"] } },
          ] },
        { id: "mantiene", text: "Mantener las 24 horas: es nuestra ventaja contra Mundo Casa y la tienda en línea está creciendo.", cues: ["mantener", "24 horas", "ventaja", "creciendo", "no cambiar"], flags: ["mantiene"],
          reply: [{ text: ["Mónica: «Entonces el problema sigue. Karla va a seguir recibiendo quejas.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Protegió el crecimiento sin atender la causa de las fallas." }] },
        { id: "culpa", text: "Mandar un comunicado a los gerentes: los pedidos fallan porque las tiendas no surten, y quien falle tendrá llamada de atención.", cues: ["comunicado", "las tiendas no surten", "llamada de atencion", "culpa", "gerentes"], flags: ["culpa"], trust: -2,
          reply: [{ text: ["Octavio, molesto: «Mis gerentes van a leer eso en el chat en cinco minutos.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Buscó culpables antes de entender la causa." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Tiendas contra tienda en línea", who: "octavio", channel: "junta",
      say: [
        { when: { all: ["culpa"] }, text: ["Octavio llega con Beto.", "«Desde el comunicado, los gerentes ya no avisan cuando falta algo. ¿Ahora qué?»"] },
        { text: ["Octavio llega con Beto.", "«Mis gerentes surten los pedidos en línea cuando pueden. No les cuenta para nada.»"] },
      ],
      ask: "¿Cómo alineas a tiendas y tienda en línea?", freeText: true,
      strategies: [
        { id: "meta_comun", text: "Que la venta en línea que surte cada tienda cuente para su meta y su bono, y medir a las dos áreas por pedidos cumplidos a tiempo.", cues: ["cuente", "meta", "bono", "pedidos cumplidos", "las dos areas", "compartida"], flags: ["meta_comun"], trust: 1,
          reply: [{ when: { all: ["culpa"] }, text: ["Beto: «Eso ayuda. Pero alguien tiene que retirar el comunicado.»"] }, { text: ["Beto: «Así sí lo surten primero. Les conviene a todos.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Hizo que las dos áreas ganen con el mismo resultado para el cliente." }] },
        { id: "separadas", text: "Dejar las metas como están y crear un equipo aparte que surta los pedidos en línea dentro de cada tienda.", cues: ["equipo aparte", "como estan", "separado", "dentro de cada tienda", "nuevo equipo"], flags: ["separadas"],
          reply: [{ text: ["Octavio: «Más gente en mi piso que no me reporta. Bueno.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "alternativas", level: 1, basis: "Agregó estructura sin resolver por qué las áreas no colaboran." }] },
      ],
    },
    a3: {
      id: "a3", stage: "Los clientes afectados", who: "karla", channel: "llamada",
      say: [
        { when: { all: ["mantiene"] }, text: ["Karla te llama.", "«Ya son 800 quejas. Y siguen llegando porque la promesa no cambió.»"] },
        { text: ["Karla te llama.", "«Tengo 600 clientes esperando respuesta. ¿Qué les ofrezco?»"] },
      ],
      ask: "¿Qué haces con los clientes afectados?", freeText: true,
      strategies: [
        { id: "llama", text: "Llamar a cada cliente afectado: decirle qué pasó, cuándo llega su pedido y entregarle sin costo de envío.", cues: ["llamar", "cada cliente", "que paso", "cuando llega", "sin costo de envio"], flags: ["llama"], trust: 1,
          reply: [{ text: ["Karla: «Mi equipo empieza hoy. Con 15 llamadas por persona al día, terminamos el viernes.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Atendió lo que el cliente realmente pedía, uno por uno." }] },
        { id: "cupon", text: "Mandar a todos un correo con disculpa y un cupón de 10% en la siguiente compra.", cues: ["cupon", "10%", "correo", "disculpa", "siguiente compra"], flags: ["cupon"],
          reply: [{ text: ["Karla: «Sale hoy. Aunque varios me van a contestar preguntando dónde está su pedido.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "problema", level: 1, basis: "Ofreció compensación general sin resolver el pedido de cada cliente." }] },
      ],
    },
    a4: {
      id: "a4", stage: "El consejo", who: "garza", channel: "junta",
      say: [{ text: ["Sesión de consejo. Don Esteban Garza: «Me dicen que la tienda en línea va muy bien. ¿Es cierto?»"] }],
      ask: "¿Qué le presentas al consejo?", freeText: true,
      strategies: [
        { id: "cumplimiento", text: "Presentar la venta en línea junto con cuántos pedidos se cumplen a tiempo, qué se corrigió y la meta para el siguiente trimestre.", cues: ["pedidos cumplidos", "a tiempo", "que se corrigio", "meta", "trimestre"], flags: ["cumplimiento"],
          reply: [{ text: ["Don Esteban: «Prefiero que me digan esto a enterarme por un amigo. Bien.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Reportó crecimiento y fallas con la misma claridad." }],
          commitments: [{ id: "el-indicador", text: "Pedidos cumplidos a tiempo en el reporte mensual.", owner: "monica" }] },
        { id: "solo_venta", text: "Presentar el crecimiento de 40% de la venta en línea; las quejas son un tema operativo.", cues: ["40%", "crecimiento", "tema operativo", "solo venta"], flags: ["solo_venta"],
          reply: [{ text: ["Don Esteban: «Un amigo me dijo que su pedido nunca llegó. ¿Eso dónde está?»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 1, basis: "Presentó solo la parte buena del resultado." }] },
      ],
    },
  },
  followUps: [
    { id: "el-cumple", when: { all: ["ajusta"] }, afterDays: 30, from: "monica", subject: "Pedidos a tiempo",
      text: [{ text: ["Este mes cumplimos a tiempo 95 de cada 100 pedidos. Las quejas bajaron a la cuarta parte."] }] },
    { id: "el-silencio", when: { all: ["culpa"] }, afterDays: 14, from: "beto", subject: "Nadie avisa los faltantes",
      text: [{ text: ["Desde el comunicado, en piso nadie reporta faltantes. Prefieren que el pedido falle a que los regañen."] }] },
    { id: "el-recompra", when: { all: ["llama"] }, afterDays: 21, from: "karla", subject: "Clientes que volvieron",
      text: [{ text: ["De los 600 que llamamos, 410 ya volvieron a comprar en línea."] }] },
    { id: "el-cupones", when: { all: ["cupon"] }, afterDays: 21, from: "claudia", subject: "Uso del cupón",
      text: [{ text: ["El cupón se usó 2,300 veces, casi todas en compras que no tuvieron problema. Costó $0.6 M de margen."] }] },
  ],
  rules: "enlinea-v1",
};

registerRules("enlinea-v1", rulesEnlinea);
