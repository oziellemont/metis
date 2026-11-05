/**
 * Caso largo · Capítulo «Gobernar» · Kúbit · «Serie C o rentabilidad».
 *
 * Quedan 11 meses de caja. Un fondo ofrece la Serie C con una cláusula de preferencia de 2x; la alternativa es llegar
 * a la rentabilidad en tres trimestres recortando gasto. Se decide el camino, se negocian los términos o el recorte,
 * se resuelve qué pasa con Emilio y el equipo, y se lleva la decisión al consejo. Cuatro decisiones.
 *
 * Modelo (todo declarado):
 *  - Caja: +4 si entra la ronda; +2 si se llega a rentabilidad con recorte ordenado; +1 con ronda puente.
 *  - Consejo: +2 si se negocia la preferencia a 1x; −2 si se acepta 2x sin negociar; +1 si se presentan los dos
 *    caminos con números; −1 si se presenta una sola opción.
 *  - Equipo: +2 si se protege ingeniería y se explica el plan; −2 si se recorta parejo; −1 si se ignora a Emilio.
 *  - Margen: +2 si se llega a rentabilidad; −1 si la ronda empuja a crecer sin cuidar el margen.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesSeriec(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const ronda = has(run, "ronda");
  const rent = has(run, "rentable");
  const puente = has(run, "puente");
  const headline = ronda && has(run, "negocia")
    ? "Cerraste la Serie C con la preferencia negociada a 1x: hay caja para crecer sin hipotecar a los fundadores."
    : ronda ? "Cerraste la Serie C con preferencia de 2x: hay caja, pero una venta modesta deja casi nada para fundadores y equipo."
      : rent && has(run, "protege")
        ? "Elegiste la rentabilidad: recortaste gasto sin tocar ingeniería y Kúbit llega al punto de equilibrio en tres trimestres."
        : rent ? "Elegiste la rentabilidad con un recorte parejo: llegas al equilibrio, pero ingeniería perdió gente clave."
          : "Tomaste una ronda puente con los fondos actuales: compraste seis meses, pero la decisión de fondo sigue pendiente.";
  const agreement: [string, string][] = [
    ["Camino", ronda ? "Serie C" : rent ? "Rentabilidad en tres trimestres" : "Ronda puente de los fondos actuales"],
    ["Preferencia de liquidación", ronda ? (has(run, "negocia") ? "1x" : "2x") : "Sin cambios"],
    ["Recorte", rent ? (has(run, "protege") ? "Gasto externo y oficinas, sin tocar ingeniería" : "15% parejo") : "No"],
  ];
  const meses = ronda ? 30 : rent ? 18 : 17;
  const economics: [string, string][] = [
    ["Meses de caja", `${meses} (antes 11)`],
    ["Dilución de fundadores", ronda ? "22%" : puente ? "8%" : "0%"],
  ];
  const kpi: RulesResult["kpi"] = [];
  if (ronda) kpi.push({ key: "caja", delta: 4, why: "Entran $600 M de la Serie C: 30 meses de caja." });
  else if (rent) kpi.push({ key: "caja", delta: 2, why: "El recorte baja el gasto mensual y alarga la caja a 18 meses." });
  else if (puente) kpi.push({ key: "caja", delta: 1, why: "La ronda puente agrega seis meses de caja." });
  let c = 0;
  const wc: string[] = [];
  if (has(run, "negocia")) { c += 2; wc.push("+2 por negociar la preferencia a 1x"); }
  if (has(run, "acepta")) { c -= 2; wc.push("−2 por aceptar 2x sin negociar"); }
  if (has(run, "dos_caminos")) { c += 1; wc.push("+1 por presentar los dos caminos con números"); }
  if (has(run, "una_opcion")) { c -= 1; wc.push("−1 por llevar una sola opción"); }
  if (c) kpi.push({ key: "consejo", delta: c, why: `Regla: ${wc.join(", ")}.` });
  let e = 0;
  const we: string[] = [];
  if (has(run, "protege")) { e += 2; we.push("+2 por proteger ingeniería"); }
  if (has(run, "parejo")) { e -= 2; we.push("−2 por un recorte parejo"); }
  if (has(run, "explica")) { e += 1; we.push("+1 por explicar el plan con Emilio al frente"); }
  if (has(run, "sin_emilio")) { e -= 1; we.push("−1 por decidir sin Emilio"); }
  if (e) kpi.push({ key: "equipo", delta: e, why: `Regla: ${we.join(", ")}.` });
  if (rent) kpi.push({ key: "margen", delta: 2, why: "El margen operativo llega a cero en tres trimestres." });
  if (ronda) kpi.push({ key: "margen", delta: -1, why: "La ronda viene con metas de crecimiento que empujan gasto comercial." });
  const risks = [
    ...(has(run, "acepta") ? [{ id: "sc-preferencia", text: "Con 2x de preferencia, una venta por debajo de $1,200 M deja casi nada a fundadores y equipo.", owner: "andrea" as const }] : []),
    ...(puente ? [{ id: "sc-puente", text: "En seis meses hay que volver a decidir, con menos caja y menos opciones.", owner: "ibarra" as const }] : []),
    ...(has(run, "sin_emilio") ? [{ id: "sc-emilio", text: "Emilio se enteró por el consejo; su compromiso con el plan es dudoso.", owner: "carmen" as const }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { meses } };
}

export const SERIEC: EpisodeSpec = {
  contract: 1, id: "seriec", version: "1.0.0", approval: "aprobado",
  company: "kubit", industry: "Software", title: "Serie C o rentabilidad", subject: "Quedan 11 meses de caja y hay una oferta de ronda",
  from: "ibarra", counterpart: "ibarra", channel: "email", areas: ["finanzas", "estrategia", "negociacion"], cast: ["ibarra", "valeria", "andrea", "emilio", "carmen", "joel"],
  lesson: "consejo", minutes: 6,
  concept: {
    title: "El dinero que entra también decide qué empresa eres",
    text: "Una ronda no es solo caja: sus términos definen quién gana en cada escenario de salida y qué ritmo de crecimiento te van a exigir. Antes de firmar, compara contra el camino sin ronda, negocia lo que más pesa (la preferencia de liquidación) y lleva al consejo las dos opciones con números. Lo que decidas con el cofundador fuera de la sala se nota en el equipo.",
    nota: "Compara siempre contra el camino sin dinero nuevo.",
  },
  briefing: {
    message: [
      "Correo de Rodrigo Ibarra, presidente del consejo · 7:30",
      "«Norte Capital ofrece $600 M por la Serie C. Piden preferencia de liquidación de 2x.»",
      "«Nos quedan 11 meses de caja. Quiero tu recomendación en el consejo del día 20.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Caja", "11 meses"], ["Oferta", "$600 M · preferencia 2x"], ["Consejo", "Día 20"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "preferencia", label: "¿Qué significa la preferencia de 2x?", keywords: ["preferencia", "2x", "liquidacion", "que significa", "clausula"], source: "andrea",
        answer: "Andrea: si se vende Kúbit, Norte Capital cobra primero el doble de lo que metió: $1,200 M. Solo lo que sobre se reparte entre los demás." },
      { id: "rentable", label: "¿Podemos llegar a rentabilidad?", keywords: ["rentabilidad", "equilibrio", "recortar", "sin ronda", "gasto"], source: "andrea",
        answer: "Andrea: recortando consultores, oficinas y marketing pagado llegamos al punto de equilibrio en tres trimestres, sin tocar ingeniería." },
      { id: "emilio", label: "¿Qué piensa Emilio?", keywords: ["emilio", "cofundador", "piensa", "opina"], source: "carmen",
        answer: "Carmen: Emilio teme que la ronda lo obligue a crecer a costa del producto, y que un recorte le quite ingenieros. Nadie le ha preguntado." },
      { id: "mercado", label: "¿Hay otros fondos?", keywords: ["otros fondos", "mercado", "alternativas", "competencia de fondos", "otra oferta"], source: "valeria",
        answer: "Valeria: el mercado de rondas está difícil. Un segundo fondo mostró interés, pero tardaría tres meses en hacer oferta." },
    ],
    unknowns: [
      { id: "salida", keywords: ["cuanto vale al vender", "precio de venta", "quien compra"], answer: "Ese dato no lo tienes: nadie sabe a qué precio se vendería Kúbit ni cuándo." },
    ],
  },
  advisors: [
    { id: "andrea", role: "Directora de Finanzas", personality: "Precisa.", interests: "Que la caja aguante un trimestre malo.", relations: "Lleva el modelo con el consejo.", knows: ["preferencia", "rentable"],
      view: [{ text: ["La ronda resuelve la caja, pero la cláusula de 2x es cara. Hay que negociarla o tener plan B.", "Sin ronda, se puede; duele, pero se puede."] }] },
    { id: "carmen", role: "Directora de Personas", personality: "Observadora.", interests: "Detener la fuga de ingenieros.", relations: "Habla con Emilio a diario.", knows: ["emilio"],
      view: [{ text: ["Lo que decidas, Emilio tiene que estar dentro antes del consejo.", "Si ingeniería siente que la sacrificaron, se va."] }] },
    { id: "valeria", role: "Consejera · Andes Ventures", personality: "Fría con los números.", interests: "Que el crecimiento justifique la siguiente ronda.", relations: "Conoce a Norte Capital.", knows: ["mercado"],
      view: [{ text: ["Norte Capital tiene margen para negociar. No firmes la primera hoja.", "Pero no creas que hay fila de fondos esperando."] }] },
  ],
  terms: { preferencia: { label: "Preferencia de liquidación", unit: "x", initial: 2 } },
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "El camino", who: "ibarra", channel: "llamada",
      say: [{ text: ["Ibarra te llama antes de la sesión.", "«¿Qué vas a recomendar?»"] }],
      ask: "¿Qué camino recomiendas?", freeText: true,
      strategies: [
        { id: "ronda", text: "Seguir con la Serie C, pero negociar los términos antes de firmar y tener listo el plan de rentabilidad como alternativa.", cues: ["serie c", "negociar", "terminos", "alternativa", "plan b", "ronda"], flags: ["ronda"], trust: 1,
          reply: [{ text: ["Ibarra: «Bien. Valeria conoce a su socio; te ayuda con la negociación.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "alternativas", level: 3, basis: "Negoció la ronda con una alternativa real en la mano." },
            { dim: "informacion", level: 3, basis: "Preguntó por la cláusula, la rentabilidad, Emilio o el mercado de fondos.", when: { any: ["q:preferencia", "q:rentable", "q:emilio", "q:mercado", "a:andrea", "a:carmen", "a:valeria"] } },
          ] },
        { id: "rentable", text: "Rechazar la ronda y llegar a la rentabilidad en tres trimestres recortando gasto.", cues: ["rechazar", "rentabilidad", "tres trimestres", "recortar", "sin ronda"], flags: ["rentable"],
          reply: [{ text: ["Ibarra: «Es valiente. Valeria va a preguntar qué pasa con el crecimiento.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "consecuencias", level: 2, basis: "Eligió control y disciplina sobre crecimiento financiado." }] },
        { id: "puente", text: "Pedir a los fondos actuales una ronda puente de seis meses para esperar una mejor oferta.", cues: ["puente", "seis meses", "fondos actuales", "esperar", "mejor oferta"], flags: ["puente"],
          reply: [{ text: ["Ibarra: «Podemos, pero en seis meses vas a tener menos caja para negociar.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Pospuso la decisión de fondo con menos margen para la siguiente." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Los términos", who: "andrea", channel: "junta",
      say: [
        { when: { all: ["rentable"] }, text: ["Andrea trae el presupuesto abierto.", "«Para llegar a equilibrio hay que bajar $9 M al mes. ¿De dónde?»"] },
        { text: ["Andrea y Valeria en tu oficina.", "«Norte Capital nos dio hasta el viernes. ¿Qué les contestamos sobre el 2x?»"] },
      ],
      ask: "¿Qué decides?", freeText: true,
      strategies: [
        { id: "negocia", text: "Proponer preferencia de 1x a cambio de un asiento más en el consejo para Norte Capital.", cues: ["1x", "asiento", "a cambio", "consejo", "contrapropuesta"], requires: { all: ["ronda"] }, flags: ["negocia"], set: { preferencia: 1 }, trust: 1,
          reply: [{ text: ["Valeria, al día siguiente: «Aceptaron 1x con el asiento. Buena jugada.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "negociacion", level: 3, basis: "Cambió lo que más pesaba por algo que al fondo le importaba más." }] },
        { id: "acepta", text: "Aceptar el 2x: lo importante es asegurar la caja antes de que cambie el mercado.", cues: ["aceptar", "2x", "asegurar", "caja", "firmar ya"], requires: { all: ["ronda"] }, flags: ["acepta"],
          reply: [{ text: ["Andrea: «Firmo el viernes. Que conste que una venta modesta nos deja casi en cero.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "negociacion", level: 0, basis: "Aceptó la primera hoja sin negociar la cláusula más cara." }] },
        { id: "protege", text: "Recortar consultores, oficinas y marketing pagado, sin tocar ingeniería ni soporte.", cues: ["consultores", "oficinas", "marketing", "sin tocar ingenieria", "soporte"], requires: { all: ["rentable"] }, flags: ["protege"], trust: 1,
          reply: [{ text: ["Andrea: «Con eso llegamos. Bruno va a reclamar por marketing.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Recortó donde menos dañaba lo que hace valiosa a la empresa." }] },
        { id: "parejo", text: "Recortar 15% parejo en todas las áreas: así nadie siente que lo eligieron.", cues: ["15%", "parejo", "todas las areas", "igual para todos"], requires: { all: ["rentable"] }, flags: ["parejo"], trust: -1,
          reply: [{ text: ["Andrea: «Ingeniería pierde cuatro puestos. Emilio no lo va a tomar bien.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "problema", level: 1, basis: "Trató igual áreas que aportan distinto." }] },
      ],
    },
    a3: {
      id: "a3", stage: "Emilio", who: "emilio", channel: "junta",
      say: [
        { when: { all: ["parejo"] }, text: ["Emilio entra sin tocar.", "«¿Cuatro ingenieros? ¿Y la hoja de ruta?»"] },
        { text: ["Emilio te busca al final del día.", "«Me enteré por Andrea. ¿Cuándo pensabas decirme?»"] },
      ],
      ask: "¿Qué haces con Emilio y el equipo?", freeText: true,
      strategies: [
        { id: "explica", text: "Sentarte con Emilio, explicarle el plan completo, ajustar con él lo que toca a producto y que él lo presente a ingeniería.", cues: ["sentarte", "explicar", "ajustar con el", "que el lo presente", "ingenieria"], flags: ["explica"], trust: 2,
          reply: [{ text: ["Emilio: «Debí estar desde el principio. Pero así lo puedo defender con el equipo.»", "Joel, más tarde: «Emilio nos explicó. Estamos dentro.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Hizo dueño del plan a quien tiene que sostenerlo con el equipo." }] },
        { id: "sin_emilio", text: "Decirle que la decisión es del consejo y del director general, y que el lunes la comunicas tú a toda la empresa.", cues: ["decision del consejo", "director general", "el lunes", "comunico yo", "toda la empresa"], flags: ["sin_emilio"], trust: -2,
          reply: [{ text: ["Emilio: «Entendido.» Sale sin decir más.", "Joel publica en el chat: «¿Alguien sabe qué está pasando?»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Dejó fuera al cofundador en una decisión que cambia su área." }] },
      ],
    },
    a4: {
      id: "a4", stage: "El consejo", who: "valeria", channel: "junta",
      say: [{ text: ["Sesión del día 20. Valeria: «Explícanos tu recomendación.»"] }],
      ask: "¿Cómo presentas la decisión al consejo?", freeText: true,
      strategies: [
        { id: "dos_caminos", text: "Presentar los dos caminos con caja, dilución y riesgo de cada uno, y tu recomendación con las razones.", cues: ["dos caminos", "dilucion", "riesgo", "recomendacion", "razones", "comparar"], flags: ["dos_caminos"],
          reply: [{ text: ["Ibarra: «Así se decide un consejo. Votamos tu recomendación.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Dio al consejo lo necesario para decidir, no solo para aprobar." }],
          commitments: [{ id: "sc-seguimiento", text: "Seguimiento trimestral de caja y meses de vida.", owner: "andrea" }] },
        { id: "una_opcion", text: "Presentar solo tu recomendación, para no confundir al consejo con alternativas.", cues: ["solo", "mi recomendacion", "no confundir", "una opcion"], flags: ["una_opcion"],
          reply: [{ text: ["Valeria: «¿Y contra qué la comparo? Necesito ver la otra opción.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 1, basis: "Pidió aprobación sin mostrar la alternativa." }] },
      ],
    },
  },
  followUps: [
    { id: "sc-cierre", when: { all: ["negocia"] }, afterDays: 30, from: "andrea", subject: "Entró la Serie C",
      text: [{ text: ["Ya entraron los $600 M con preferencia de 1x. Tenemos 30 meses de caja."] }] },
    { id: "sc-equilibrio", when: { all: ["protege"] }, afterDays: 45, from: "andrea", subject: "Primer mes en equilibrio operativo",
      text: [{ text: ["Este mes el gasto bajó $9 M. Vamos adelantados contra el plan de tres trimestres."] }] },
    { id: "sc-fuga", when: { all: ["parejo"] }, afterDays: 30, from: "carmen", subject: "Renuncias en ingeniería",
      text: [{ text: ["Además de los cuatro puestos recortados, renunciaron dos ingenieros senior. Uno era de los que más sabía de la plataforma."] }] },
    { id: "sc-emilio", when: { all: ["sin_emilio"] }, afterDays: 20, from: "carmen", subject: "Emilio está pensando en irse",
      text: [{ text: ["Emilio me pidió revisar su contrato. No lo ha dicho, pero creo que está pensando en irse."] }] },
  ],
  rules: "seriec-v1",
};

registerRules("seriec-v1", rulesSeriec);
