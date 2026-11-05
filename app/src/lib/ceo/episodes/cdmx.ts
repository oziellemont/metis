/**
 * Caso largo · Capítulo «Estabilizar» · Brasa · «CDMX pierde dinero».
 *
 * Las tres sucursales de la Ciudad de México pierden dinero desde hace ocho meses. Se decide qué hacer con ellas,
 * qué pasa con la gente, cómo se arregla la operación que queda y qué se le dice al consejo cuando Lourdes pide
 * acelerar. Cuatro decisiones.
 *
 * Modelo (todo declarado):
 *  - Caja: +3 si se cierra la sucursal que más pierde; +4 si se cierran las tres; −2 si se sostienen todas con más
 *    publicidad; −1 si se liquida sin reubicar (indemnizaciones).
 *  - Margen: +2 si se estandariza porción y merma; +1 si se sube el precio del menú; +1 si se recortan turnos.
 *  - Equipo: +2 si se reubica a la gente; −2 si se liquida; −2 si se recortan turnos sin hablar con los gerentes.
 *  - Clientes: −2 si se sube el precio del menú; −1 si se cierran las tres (la marca sale de la ciudad).
 *  - Consejo: +1 si se pide esperar 90 días de datos; −1 si se promete crecer en CDMX sin números.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesCdmx(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const una = has(run, "cierra_una");
  const todas = has(run, "cierra_todas");
  const sostiene = has(run, "sostiene");
  const abiertas = todas ? 0 : una ? 2 : 3;
  const headline = todas
    ? "Cerraste las tres sucursales de CDMX: la pérdida se detuvo y la marca salió de la ciudad."
    : una && has(run, "porcion")
      ? "Cerraste la sucursal que más perdía y las otras dos tienen 90 días para llegar al punto de equilibrio con porción estándar."
      : una ? "Cerraste la sucursal que más perdía; las otras dos siguen abiertas con un plan de ajuste."
        : has(run, "porcion")
          ? "Sostuviste las tres sucursales con más publicidad y porción estándar. La pérdida baja, pero no se detiene."
          : "Sostuviste las tres sucursales con más publicidad. CDMX sigue perdiendo dinero.";
  const agreement: [string, string][] = [
    ["Sucursales en CDMX", `${abiertas} de 3 abiertas`],
    ["La gente", has(run, "reubica") ? "Reubicada en otras sucursales" : has(run, "liquida") ? "Liquidada" : "Sin cambios"],
    ["Ajuste de operación", has(run, "porcion") ? "Porción y merma estándar" : has(run, "precio") ? "Precio del menú +8%" : has(run, "turnos") ? "Recorte de turnos flojos" : "—"],
  ];
  const perdida = todas ? 0 : una ? 0.6 : sostiene ? 1.9 : 1.4;
  const economics: [string, string][] = [
    ["Pérdida mensual en CDMX", `$${perdida.toFixed(1)} M (antes $1.4 M)`],
    ["Indemnizaciones", has(run, "liquida") ? (todas ? "$4.8 M" : "$1.6 M") : "$0"],
  ];
  const kpi: RulesResult["kpi"] = [];
  let c = 0;
  const wc: string[] = [];
  if (una) { c += 3; wc.push("+3 por cerrar la sucursal que más pierde"); }
  if (todas) { c += 4; wc.push("+4 por cerrar las tres"); }
  if (sostiene) { c -= 2; wc.push("−2 por sostener las tres con más publicidad"); }
  if (has(run, "liquida")) { c -= 1; wc.push("−1 por indemnizaciones"); }
  if (c) kpi.push({ key: "caja", delta: c, why: `Regla: ${wc.join(", ")}.` });
  let m = 0;
  const wm: string[] = [];
  if (has(run, "porcion")) { m += 2; wm.push("+2 por estandarizar porción y merma"); }
  if (has(run, "precio")) { m += 1; wm.push("+1 por subir el precio del menú"); }
  if (has(run, "turnos")) { m += 1; wm.push("+1 por recortar turnos flojos"); }
  if (m) kpi.push({ key: "margen", delta: m, why: `Regla: ${wm.join(", ")}.` });
  let e = 0;
  const we: string[] = [];
  if (has(run, "reubica")) { e += 2; we.push("+2 por reubicar a la gente"); }
  if (has(run, "liquida")) { e -= 2; we.push("−2 por liquidar sin ofrecer otra sucursal"); }
  if (has(run, "turnos")) { e -= 2; we.push("−2 por recortar turnos sin hablar con los gerentes"); }
  if (e) kpi.push({ key: "equipo", delta: e, why: `Regla: ${we.join(", ")}.` });
  let cl = 0;
  const wl: string[] = [];
  if (has(run, "precio")) { cl -= 2; wl.push("−2 por subir el precio del menú en plena pérdida de clientes"); }
  if (todas) { cl -= 1; wl.push("−1 porque la marca sale de la ciudad"); }
  if (cl) kpi.push({ key: "clientes", delta: cl, why: `Regla: ${wl.join(", ")}.` });
  if (has(run, "datos")) kpi.push({ key: "consejo", delta: 1, why: "El consejo recibe un plan con fecha y números para decidir." });
  if (has(run, "acelera")) kpi.push({ key: "consejo", delta: -1, why: "Se prometió crecer en CDMX sin números que lo sostengan." });
  const risks = [
    ...(sostiene ? [{ id: "cd-perdida", text: "La pérdida en CDMX sigue y consume la caja que necesita Guadalajara.", owner: "fer" as const }] : []),
    ...(has(run, "acelera") ? [{ id: "cd-promesa", text: "Lourdes cuenta con abrir en CDMX y los números no lo respaldan.", owner: "beatriz" as const }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { abiertas } };
}

export const CDMX: EpisodeSpec = {
  contract: 1, id: "cdmx", version: "1.0.0", approval: "aprobado",
  company: "brasa", industry: "Restaurantes", title: "CDMX pierde dinero", subject: "Tres sucursales con pérdida desde hace ocho meses",
  from: "fer", counterpart: "fer", channel: "email", areas: ["finanzas", "operacion", "personas"], cast: ["fer", "vero", "andres", "maru", "lourdes", "beatriz", "sara"],
  lesson: "finanzas", minutes: 6,
  concept: {
    title: "Antes de cerrar o sostener, separa lo que se arregla de lo que no",
    text: "Una unidad que pierde dinero puede tener un problema de ubicación, que no se arregla, o de operación, que sí. Si miras cada sucursal por separado, cierras la que no tiene remedio, le das un plazo con metas a las demás y cuidas a la gente en el camino. Cerrar todo o sostener todo evita la decisión difícil, pero cuesta más.",
    nota: "Una sucursal, un número, una fecha.",
  },
  briefing: {
    message: [
      "Correo de Fer Ruvalcaba, Finanzas · 7:50",
      "«Las tres sucursales de CDMX llevan ocho meses perdiendo dinero: $1.4 M al mes entre las tres.»",
      "«Necesito saber qué hacemos antes del cierre de mes. Así no llegamos a fin de año.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Sucursales en CDMX", "3 de 14"], ["Pérdida mensual", "$1.4 M"], ["Empleados en CDMX", "96"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "porsucursal", label: "¿Cuánto pierde cada una?", keywords: ["cada una", "por sucursal", "cual pierde", "polanco", "roma", "satelite"], source: "fer",
        answer: "Fer: Satélite pierde $0.8 M al mes; Roma, $0.4 M; Polanco, $0.2 M. Satélite tiene la renta más alta y la mitad de afluencia." },
      { id: "merma", label: "¿Qué pasa en la cocina?", keywords: ["cocina", "merma", "porcion", "prime cost", "desperdicio"], source: "andres",
        answer: "Chef Andrés: en CDMX se sirve 15% más carne por plato que en Guadalajara. Nadie pesa la porción." },
      { id: "gente", label: "¿Qué pasa con la gente?", keywords: ["gente", "empleados", "reubicar", "personal", "meseros", "rotacion"], source: "vero",
        answer: "Vero: de los 96, unos 30 de Satélite podrían moverse a Roma y Polanco, que andan cortos de personal." },
      { id: "delivery", label: "¿Cómo van las ventas a domicilio?", keywords: ["domicilio", "delivery", "rappido", "apps", "pedidos"], source: "sara",
        answer: "Sara: Roma y Polanco venden 35% por aplicaciones. Satélite casi no tiene pedidos a domicilio." },
    ],
    unknowns: [
      { id: "futuro", keywords: ["cuando se recupera", "seguro", "garantia"], answer: "Ese dato no lo tienes: nadie sabe si CDMX se recupera sin probar un ajuste." },
    ],
  },
  advisors: [
    { id: "fer", role: "Directora de Finanzas", personality: "Directa, vive en la hoja de cálculo.", interests: "Detener la pérdida antes de fin de año.", relations: "Lleva los números de cada sucursal.", knows: ["porsucursal"],
      view: [{ text: ["No todas pierden igual. Si las tratamos como un bloque, vamos a decidir mal.", "Lo que no puedo es seguir financiando la pérdida con Guadalajara."] }] },
    { id: "andres", role: "Director de Cocina", personality: "Orgulloso de la receta.", interests: "Que el plato sea igual en todas las sucursales.", relations: "Respetado por los cocineros.", knows: ["merma"],
      view: [{ text: ["En CDMX cada cocinero sirve a su manera. Eso cuesta.", "Si me dejas capacitarlos, el plato sale igual y más barato."] }] },
    { id: "vero", role: "Directora de Personas", personality: "Práctica.", interests: "No perder gente buena por una decisión de escritorio.", relations: "Conoce a los gerentes de CDMX.", knows: ["gente", "delivery"],
      view: [{ text: ["Si cerramos algo, que la gente se entere por nosotros y con opciones.", "Roma y Polanco necesitan meseros; no tiremos a los que ya tenemos."] }] },
  ],
  terms: {},
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "La decisión", who: "fer", channel: "junta",
      say: [{ text: ["Fer pone las tres sucursales en la pantalla.", "«Tú dime: ¿qué hacemos con CDMX?»"] }],
      ask: "¿Qué decides con las sucursales de CDMX?", freeText: true,
      strategies: [
        { id: "una", text: "Revisar sucursal por sucursal: cerrar Satélite, que pierde más de la mitad, y darle a Roma y Polanco 90 días con metas claras.", cues: ["satelite", "por sucursal", "90 dias", "metas", "cerrar una", "la que mas pierde"], flags: ["cierra_una"], trust: 1,
          reply: [{ text: ["Fer: «Así sí puedo trabajar. Satélite era la que más nos dolía.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "problema", level: 3, basis: "Separó la sucursal sin remedio de las que podían ajustarse." },
            { dim: "informacion", level: 3, basis: "Consultó números, cocina, gente o pedidos antes de decidir.", when: { any: ["q:porsucursal", "q:merma", "q:gente", "q:delivery", "a:fer", "a:andres", "a:vero"] } },
          ] },
        { id: "todas", text: "Cerrar las tres sucursales de CDMX y concentrar todo en Guadalajara, donde la marca sí gana.", cues: ["cerrar las tres", "todas", "salir de cdmx", "concentrar", "guadalajara"], flags: ["cierra_todas"],
          reply: [{ text: ["Fer: «Se detiene la pérdida, eso sí. Lourdes no va a estar contenta.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "alternativas", level: 1, basis: "Cortó la pérdida sin revisar si alguna sucursal tenía arreglo." }] },
        { id: "sostiene", text: "Mantener las tres abiertas y aumentar la publicidad en CDMX para traer más clientes.", cues: ["mantener", "publicidad", "mas clientes", "las tres abiertas", "invertir"], flags: ["sostiene"], trust: -1,
          reply: [{ text: ["Fer: «Eso es más gasto sobre una pérdida. ¿De dónde sale?»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 0, basis: "Agregó gasto sin saber por qué se perdía dinero." }] },
      ],
    },
    a2: {
      id: "a2", stage: "La gente", who: "vero", channel: "junta",
      say: [
        { when: { all: ["sostiene"] }, text: ["Vero entra con Sara.", "«Si vamos a meter publicidad, ¿qué hacemos para que la gente atienda bien a los que lleguen?»"] },
        { when: { all: ["cierra_todas"] }, text: ["Vero entra con la lista de 96 nombres.", "«¿Qué le decimos a esta gente?»"] },
        { text: ["Vero entra con la lista de Satélite.", "«Son 32 personas. ¿Qué les decimos?»"] },
      ],
      ask: "¿Qué haces con la gente?", freeText: true,
      strategies: [
        { id: "reubica", text: "Ofrecerles lugar en las sucursales que andan cortas, con el mismo sueldo, y liquidar conforme a la ley solo a quien no quiera moverse.", cues: ["reubicar", "ofrecer", "mismo sueldo", "moverse", "otras sucursales"], requires: { none: ["sostiene"] }, flags: ["reubica"], trust: 1,
          reply: [{ when: { all: ["cierra_todas"] }, text: ["Vero: «En Guadalajara caben unos 20. Los demás tendrán su liquidación completa.»"] }, { text: ["Vero: «Veinticuatro aceptan moverse a Roma y Polanco. Justo lo que faltaba.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Cuidó a la gente y aprovechó su experiencia donde hacía falta." }] },
        { id: "liquida", text: "Liquidar a todos conforme a la ley y cerrar rápido, sin abrir negociaciones de reubicación.", cues: ["liquidar", "conforme a la ley", "rapido", "sin reubicar"], requires: { none: ["sostiene"] }, flags: ["liquida"], trust: -1,
          reply: [{ text: ["Vero: «Es legal. Pero los de Roma y Polanco van a pensar que siguen ellos.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Cerró rápido sin medir el mensaje que recibe el resto del equipo." }] },
        { id: "capacita", text: "Capacitar a los gerentes en servicio y medir cada semana la calificación en reseñas.", cues: ["capacitar", "servicio", "resenas", "cada semana", "gerentes"], requires: { all: ["sostiene"] }, flags: ["capacita_srv"],
          reply: [{ text: ["Sara: «Las reseñas se mueven rápido si el servicio mejora. Lo mido yo.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "ejecucion", level: 2, basis: "Acompañó la publicidad con algo que la gente puede mejorar." }] },
        { id: "nada", text: "Dejar al equipo como está: la publicidad trae clientes y el resto se acomoda solo.", cues: ["como esta", "se acomoda", "no cambiar", "dejar igual"], requires: { all: ["sostiene"] }, flags: ["sin_ajuste"],
          reply: [{ text: ["Vero: «Bien. Nada más que los meseros ya andan cortos.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Supuso que más clientes resuelven solos un problema de operación." }] },
      ],
    },
    a3: {
      id: "a3", stage: "La operación", who: "andres", channel: "junta",
      say: [
        { when: { all: ["cierra_todas"] }, text: ["Chef Andrés te busca.", "«Sin CDMX, Guadalajara tiene que absorber la caída. ¿Qué ajustamos en las 11 que quedan?»"] },
        { text: ["Chef Andrés y Maru te esperan en la cocina de Roma.", "«Aquí está el problema que nadie ve. ¿Qué hacemos?»"] },
      ],
      ask: "¿Qué ajustas en la operación?", freeText: true,
      strategies: [
        { id: "porcion", text: "Estandarizar la porción y medir la merma cada semana: Andrés capacita a los cocineros y Maru hace de sucursal modelo.", cues: ["porcion", "merma", "estandar", "capacita", "sucursal modelo", "pesar"], flags: ["porcion"], trust: 1,
          reply: [{ text: ["Andrés: «En un mes el plato sale igual en todas.»", "Maru: «Andares ya pesa la porción. Que vengan a verla.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Atacó la causa en la cocina con la gente que la conoce." }] },
        { id: "precio", text: "Subir 8% el precio del menú en todas las sucursales para cubrir la diferencia.", cues: ["subir precio", "8%", "menu", "cubrir"], flags: ["precio"],
          reply: [{ text: ["Andrés: «El cliente paga más por el mismo plato que le servimos mal.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "problema", level: 1, basis: "Pasó el costo al cliente sin corregir la causa." }] },
        { id: "turnos", text: "Recortar personal en los turnos con menos venta, empezando esta semana.", cues: ["recortar", "turnos", "menos venta", "esta semana", "personal"], flags: ["turnos"], trust: -1,
          reply: [{ text: ["Maru: «Nadie me preguntó qué turnos. El martes en la noche se llena por el futbol.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "informacion", level: 1, basis: "Recortó sin preguntar a quien conoce la operación." }] },
      ],
    },
    a4: {
      id: "a4", stage: "El consejo", who: "lourdes", channel: "junta",
      say: [
        { when: { all: ["cierra_todas"] }, text: ["Lourdes, en el consejo: «¿Salimos de la capital? Yo quería franquiciar ahí.»"] },
        { text: ["Lourdes, en el consejo: «CDMX es donde está el dinero. Quiero abrir dos más el año que entra.»"] },
      ],
      ask: "¿Qué le respondes al consejo?", freeText: true,
      strategies: [
        { id: "datos", text: "Pedir 90 días: presentar cada mes la pérdida por sucursal y decidir con esos números si CDMX tiene futuro.", cues: ["90 dias", "cada mes", "por sucursal", "numeros", "decidir con datos"], flags: ["datos"],
          reply: [{ text: ["Beatriz: «Me parece lo correcto. Lourdes, en 90 días tenemos datos.»", "Lourdes asiente, a regañadientes."] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Ató la siguiente decisión a datos y a una fecha." }],
          commitments: [{ id: "cd-reporte", text: "Reporte mensual de pérdida por sucursal durante 90 días.", owner: "fer" }] },
        { id: "acelera", text: "Decirle que sí: con los ajustes, CDMX se recupera y el año que entra abrimos dos más.", cues: ["si", "abrimos dos", "se recupera", "crecer", "ano que entra"], flags: ["acelera"],
          reply: [{ text: ["Lourdes sonríe. Fer anota algo y no dice nada.", "Beatriz: «¿Con qué números?»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Prometió crecer donde todavía se pierde dinero." }] },
      ],
    },
  },
  followUps: [
    { id: "cd-roma", when: { all: ["porcion"] }, afterDays: 30, from: "fer", subject: "Roma en punto de equilibrio",
      text: [{ text: ["Con la porción estándar, Roma llegó al punto de equilibrio este mes. Polanco va en camino."] }] },
    { id: "cd-rumor", when: { all: ["liquida"] }, afterDays: 15, from: "vero", subject: "Renuncias en Guadalajara",
      text: [{ text: ["Tres meseros de Guadalajara renunciaron esta semana. Dicen que no quieren esperar a que les toque."] }] },
    { id: "cd-perdida", when: { all: ["sostiene"] }, afterDays: 30, from: "fer", subject: "La publicidad no alcanzó",
      text: [{ text: ["Gastamos $0.5 M en publicidad. La afluencia subió 6% y la pérdida siguió: ahora es $1.9 M al mes."] }] },
    { id: "cd-turnos", when: { all: ["turnos"] }, afterDays: 20, from: "maru", subject: "Faltó gente el martes",
      text: [{ text: ["El martes del partido se fueron 40 clientes sin mesa. Faltaban dos meseros del turno que recortamos."] }] },
  ],
  rules: "cdmx-v1",
};

registerRules("cdmx-v1", rulesCdmx);
