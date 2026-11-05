/**
 * Caso largo · Capítulos «Escalar» a «Gobernar» · Brasa · «La sucesión de Don Ignacio».
 *
 * Don Ignacio, fundador y presidente del consejo, anuncia que se retira en un año y quiere que su sobrino Toño,
 * gerente regional, sea el siguiente director de operaciones con derecho a sucederte. Se decide cómo responder,
 * cómo se elige al sucesor, qué hacer cuando Lourdes se opone y cómo queda el gobierno de la empresa. Cuatro
 * decisiones, incluida la comunicación a los gerentes.
 *
 * Modelo (todo declarado):
 *  - Consejo: +3 si se acuerda un proceso con criterios y la consejera independiente; −2 si se impone al sobrino
 *    sin proceso; −2 si se enfrenta al fundador sin propuesta; +1 si queda un protocolo familiar por escrito.
 *  - Equipo: +2 si el proceso es abierto a candidatos internos; −2 si el puesto se da por apellido.
 *  - Clientes / margen: no se mueven (es un caso de gobierno).
 *  - Caja: −1 por el proceso con firma externa.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesSucesion(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const proceso = has(run, "proceso");
  const impone = has(run, "impone");
  const headline = proceso && has(run, "protocolo")
    ? "La sucesión quedó en un proceso con criterios y un protocolo familiar por escrito. Toño compite como uno más."
    : proceso ? "La sucesión quedó en un proceso con criterios, aunque la familia no firmó reglas para lo que sigue."
      : impone ? "Toño entró como sucesor por decisión del fundador. El equipo entendió cómo se sube en Brasa."
        : "Enfrentaste a Don Ignacio sin una propuesta: la sucesión quedó en pausa y la relación, rota.";
  const agreement: [string, string][] = [
    ["Cómo se elige", proceso ? "Proceso con criterios y consejera independiente" : impone ? "Designación del fundador" : "Sin acuerdo"],
    ["Candidatos", proceso ? "Internos y externos, Toño incluido" : impone ? "Solo Toño" : "—"],
    ["Protocolo familiar", has(run, "protocolo") ? "Firmado" : "No"],
    ["Comunicación a gerentes", has(run, "explica") ? "Reunión de frente" : "Circular"],
  ];
  const economics: [string, string][] = [["Costo del proceso", proceso ? "$1.2 M (firma externa)" : "$0"]];
  const kpi: RulesResult["kpi"] = [];
  let c = 0;
  const w: string[] = [];
  if (proceso) { c += 3; w.push("+3 por un proceso con criterios y la consejera independiente"); }
  if (impone) { c -= 2; w.push("−2 por designar sucesor sin proceso"); }
  if (has(run, "choque")) { c -= 2; w.push("−2 por enfrentar al fundador sin propuesta"); }
  if (has(run, "protocolo")) { c += 1; w.push("+1 por el protocolo familiar por escrito"); }
  if (c) kpi.push({ key: "consejo", delta: c, why: `Regla: ${w.join(", ")}.` });
  let e = 0;
  const we: string[] = [];
  if (proceso) { e += 2; we.push("+2 porque los gerentes ven que el siguiente puesto se gana con resultados"); }
  if (impone) { e -= 2; we.push("−2 porque los gerentes entienden que el puesto se da por apellido"); }
  if (has(run, "explica")) { e += 1; we.push("+1 por explicarles la decisión de frente"); }
  if (has(run, "circular")) { e -= 1; we.push("−1 porque el rumor llenó lo que la circular no dijo"); }
  if (e) kpi.push({ key: "equipo", delta: e, why: `Regla: ${we.join(", ")}.` });
  if (proceso) kpi.push({ key: "caja", delta: -1, why: "La firma externa que acompaña el proceso cuesta $1.2 M." });
  const risks = [
    ...(impone ? [{ id: "su-gerentes", text: "Dos gerentes regionales con mejores números podrían irse.", owner: "vero" as const }] : []),
    ...(!has(run, "protocolo") ? [{ id: "su-familia", text: "No hay reglas escritas para la siguiente vez que un familiar quiera entrar.", owner: "beatriz" as const }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { proceso: proceso ? 1 : 0 } };
}

export const SUCESION: EpisodeSpec = {
  contract: 1, id: "sucesion", version: "1.0.0", approval: "aprobado",
  company: "brasa", industry: "Restaurantes", title: "La sucesión de Don Ignacio", subject: "Don Ignacio se retira y propone a su sobrino",
  from: "ignacio", counterpart: "ignacio", channel: "junta", areas: ["personas", "estrategia", "etica"], cast: ["ignacio", "lourdes", "beatriz", "vero", "fer"],
  lesson: "consejo", minutes: 6,
  concept: {
    title: "En una empresa familiar, la sucesión se gana con un proceso, no con un apellido",
    text: "Cuando el fundador elige a un familiar, el equipo lee qué se premia en la empresa. Un proceso con criterios claros, candidatos internos y externos, y alguien independiente en la mesa protege a la familia y a la empresa: si el familiar es el mejor, gana con legitimidad; si no, nadie pierde la cara.",
    nota: "No digas que no a la persona: di que sí a un proceso.",
  },
  briefing: {
    message: [
      "Don Ignacio Arce te cita a desayunar · 8:00",
      "«Me retiro en un año. Quiero que Toño, mi sobrino, sea director de operaciones y después te suceda.»",
      "«Lo digo en el consejo del jueves. Quiero saber que cuento contigo.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Toño Arce", "Gerente regional · 6 años en Brasa"], ["Consejo", "Don Ignacio, Lourdes y Beatriz (independiente)"], ["Sesión", "Jueves"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "tono", label: "¿Cómo le ha ido a Toño?", keywords: ["tono", "resultados", "region", "desempeno", "como le va"], source: "fer",
        answer: "Fer: la región de Toño creció 4% el año pasado. Las otras dos regiones crecieron 9% y 11%." },
      { id: "gerentes", label: "¿Qué piensa el equipo?", keywords: ["gerentes", "equipo", "piensan", "otros candidatos", "regionales"], source: "vero",
        answer: "Vero: los otros dos gerentes regionales esperaban competir por ese puesto. Uno ya recibió una oferta de otra cadena." },
      { id: "lourdes", label: "¿Qué piensa Lourdes?", keywords: ["lourdes", "cofundadora", "opina", "familia"], source: "beatriz",
        answer: "Beatriz: Lourdes quiere que sus hijos también tengan oportunidad algún día. No le gusta que se decida en un desayuno." },
      { id: "estatutos", label: "¿Qué dicen los estatutos?", keywords: ["estatutos", "reglas", "quien nombra", "consejo decide", "protocolo"], source: "beatriz",
        answer: "Beatriz: el consejo nombra a los directores por mayoría. No hay protocolo familiar escrito." },
    ],
    unknowns: [
      { id: "futuro", keywords: ["que va a pasar", "seguro", "garantia"], answer: "Eso no lo sabe nadie: depende de lo que decida el consejo." },
    ],
  },
  advisors: [
    { id: "beatriz", role: "Consejera independiente", personality: "Serena, ha visto muchas sucesiones.", interests: "Que la empresa sobreviva a la familia.", relations: "Respetada por Don Ignacio y Lourdes.", knows: ["lourdes", "estatutos"],
      view: [{ text: ["Las sucesiones que salen mal casi nunca son por la persona; son por cómo se decidió.", "Don Ignacio quiere dejar todo en orden. Ayúdale a que lo esté."] }] },
    { id: "vero", role: "Directora de Personas", personality: "Directa.", interests: "No perder a los mejores gerentes.", relations: "Habla con los tres regionales.", knows: ["gerentes"],
      view: [{ text: ["Toño es buena persona. Pero si se lo dan así, los otros dos se van.", "La gente está viendo esto."] }] },
    { id: "fer", role: "Directora de Finanzas", personality: "Habla con números.", interests: "Que las decisiones se sostengan con resultados.", relations: "Lleva los números de cada región.", knows: ["tono"],
      view: [{ text: ["No tengo nada contra Toño. Solo digo que hay que comparar con los mismos números.", "Si gana con datos, nadie le discute."] }] },
  ],
  terms: {},
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "El desayuno", who: "ignacio", channel: "junta",
      say: [{ text: ["Don Ignacio espera tu respuesta con el café en la mano.", "«Llevo 30 años construyendo esto. Toño es de la familia.»"] }],
      ask: "¿Qué le respondes?", freeText: true,
      strategies: [
        { id: "proceso", text: "Decirle que Toño merece la oportunidad y proponer que la elija el consejo con un proceso: criterios, candidatos internos y externos, y Beatriz al frente.", cues: ["proceso", "criterios", "candidatos", "beatriz", "consejo", "oportunidad"], flags: ["proceso"], trust: 1,
          reply: [{ text: ["«No esperaba eso… Pero si Toño es bueno, va a ganar. Lo pensaré antes del jueves.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "alternativas", level: 3, basis: "Convirtió una designación en un proceso sin rechazar a la persona." },
            { dim: "informacion", level: 3, basis: "Consultó resultados, equipo o estatutos antes de responder.", when: { any: ["q:tono", "q:gerentes", "q:estatutos", "q:lourdes", "a:beatriz", "a:vero", "a:fer"] } },
          ] },
        { id: "impone", text: "Decirle que cuenta contigo: es su empresa y su decisión, y Toño conoce la operación.", cues: ["cuenta conmigo", "su decision", "su empresa", "apoyo", "de acuerdo"], flags: ["impone"], trust: 1,
          reply: [{ text: ["«Sabía que podía contar contigo. El jueves lo anunciamos.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 0, basis: "Aceptó la designación sin medir el efecto en el equipo ni en el consejo." }] },
        { id: "choque", text: "Decirle que no estás de acuerdo: Toño no tiene los resultados y no lo vas a respaldar.", cues: ["no estoy de acuerdo", "no tiene", "no lo respaldo", "no", "resultados"], flags: ["choque"], trust: -2,
          reply: [{ text: ["«Pensé que entendías lo que es esta familia.» Don Ignacio pide la cuenta."] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "Dijo lo que pensaba, pero sin una propuesta que le diera al fundador una salida." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Lourdes se opone", who: "lourdes", channel: "llamada",
      say: [
        { when: { all: ["impone"] }, text: ["Lourdes te llama la noche del miércoles.", "«Me enteré de que apoyas a Toño. ¿Y mis hijos? Esto se decidió en un desayuno.»"] },
        { when: { all: ["choque"] }, text: ["Lourdes te llama.", "«Ignacio está furioso contigo. Yo tampoco quiero a Toño, pero así no se iba a resolver.»"] },
        { text: ["Lourdes te llama.", "«Ignacio me contó lo del proceso. Me parece bien, pero quiero saber que mis hijos también podrán competir algún día.»"] },
      ],
      ask: "¿Qué le respondes a Lourdes?", freeText: true,
      strategies: [
        { id: "protocolo", text: "Proponer que la familia firme un protocolo: cómo entra un familiar, qué experiencia necesita y cómo se evalúa, igual para todos.", cues: ["protocolo", "reglas", "familia", "igual para todos", "por escrito"], flags: ["protocolo"], trust: 1,
          reply: [{ text: ["«Eso es lo que siempre nos faltó. Si Beatriz lo coordina, firmo.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Resolvió el caso de hoy y dejó reglas para los siguientes." }] },
        { id: "esperar", text: "Pedirle que espere a ver cómo sale lo de Toño antes de hablar de sus hijos.", cues: ["esperar", "despues", "ver como sale", "luego"], flags: ["espera"],
          reply: [{ text: ["«Siempre es después.» Lourdes cuelga."] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Pospuso el tema que iba a volver en la siguiente sucesión." }] },
      ],
    },
    a3: {
      id: "a3", stage: "El consejo", who: "beatriz", channel: "junta",
      say: [
        { when: { all: ["proceso"] }, text: ["Jueves. Don Ignacio abre la sesión: «Propongo que la sucesión la lleve Beatriz con un proceso.»"] },
        { when: { all: ["impone"] }, text: ["Jueves. Don Ignacio anuncia a Toño. Lourdes pide la palabra: «Quiero votar en contra.» Beatriz te mira."] },
        { text: ["Jueves. Don Ignacio no te mira. Beatriz: «Necesitamos una propuesta antes de votar nada.»"] },
      ],
      ask: "¿Qué propones en el consejo?", freeText: true,
      strategies: [
        { id: "formaliza", text: "Pedir que el consejo apruebe un comité de sucesión con Beatriz, criterios publicados y una fecha de decisión en seis meses.", cues: ["comite", "criterios", "seis meses", "fecha", "beatriz"], flags: ["proceso"],
          reply: [{ text: ["Beatriz: «Lo coordino. Toño entra como candidato, igual que los demás.»", "Don Ignacio asiente."] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Llevó el tema al órgano que debía decidirlo, con reglas claras." }],
          commitments: [{ id: "su-comite", text: "Comité de sucesión con decisión en seis meses.", owner: "beatriz" }] },
        { id: "votar", text: "Pedir que se vote hoy la propuesta de Don Ignacio tal como viene.", cues: ["votar hoy", "tal como viene", "ya", "propuesta de don ignacio"], flags: ["impone"],
          reply: [{ text: ["Se aprueba dos a uno. Lourdes vota en contra y pide que conste en el acta."] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Forzó una votación dividida en un tema de familia." }] },
      ],
    },
    a4: {
      id: "a4", stage: "Los gerentes", who: "vero", channel: "junta",
      say: [
        { when: { all: ["impone"] }, text: ["Viernes. Vero te detiene en el pasillo.", "«Los gerentes regionales ya se enteraron por los meseros. Quieren saber qué pasa con ellos.»"] },
        { text: ["Viernes. Vero te detiene en el pasillo.", "«Los gerentes regionales escucharon rumores del consejo. Quieren saber cómo les afecta.»"] },
      ],
      ask: "¿Cómo les comunicas lo que se decidió?", freeText: true,
      strategies: [
        { id: "explica", text: "Reunir a los gerentes esa misma tarde, explicarles qué se decidió, por qué y qué significa para su carrera, y contestar sus preguntas.", cues: ["reunir", "explicar", "gerentes", "carrera", "preguntas", "por que"], flags: ["explica"], trust: 1,
          reply: [{ when: { all: ["impone"] }, text: ["Hay preguntas incómodas, pero nadie se entera por pasillos.", "Vero: «Al menos saben a qué atenerse.»"] }, { text: ["Dos gerentes preguntan si pueden postularse. Les dices que sí.", "Vero: «Eso cambió el ánimo.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Comunicó la decisión de frente a quienes más les afectaba." }] },
        { id: "circular", text: "Enviar una circular breve con el acuerdo del consejo y no abrir el tema hasta que haya más definiciones.", cues: ["circular", "correo", "breve", "despues", "no abrir"], flags: ["circular"],
          reply: [{ text: ["La circular sale a las 6 de la tarde. Para el lunes, cada región tiene su propia versión de lo que pasó."] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Dejó que el rumor llenara lo que la circular no explicaba." }] },
      ],
    },
  },
  followUps: [
    { id: "su-candidatos", when: { all: ["proceso"] }, afterDays: 30, from: "beatriz", subject: "Candidatos para la sucesión",
      text: [{ text: ["Tenemos cuatro candidatos: Toño, los dos regionales y uno externo. Presentan su plan en tres meses."] }] },
    { id: "su-salida", when: { all: ["impone"] }, afterDays: 25, from: "vero", subject: "Renunció el gerente de la región Bajío",
      text: [{ text: ["El gerente de la región Bajío aceptó la oferta de la otra cadena. Me dijo que ya sabía que aquí no iba a subir."] }] },
    { id: "su-protocolo", when: { all: ["protocolo"] }, afterDays: 45, from: "lourdes", subject: "Protocolo familiar",
      text: [{ text: ["Ya firmamos el protocolo. Mis hijos saben qué tienen que hacer si quieren entrar algún día."] }] },
    { id: "su-rumor", when: { all: ["circular"] }, afterDays: 10, from: "vero", subject: "Lo que se dice en las regiones",
      text: [{ text: ["En dos regiones creen que habrá recorte de gerentes. Me toca desmentirlo sucursal por sucursal."] }] },
  ],
  rules: "sucesion-v1",
};

registerRules("sucesion-v1", rulesSucesion);
