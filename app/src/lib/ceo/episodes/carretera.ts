/**
 * Caso largo · Capítulos «Estabilizar» a «Construir capacidad» · Vértice · «Accidente en la carretera».
 *
 * Un tractocamión de Vértice se accidenta en la carretera a Saltillo. El operador va al hospital con heridas
 * serias; la carga de Almena se pierde. La telemetría muestra que llevaba 14 horas manejando. Se decide qué
 * hacer primero, qué se dice al cliente, cómo se atiende la causa y cómo se presenta al consejo. Entre 3 y 4
 * decisiones.
 *
 * Modelo (todo declarado):
 *  - Equipo: +3 si lo primero es el operador y su familia; −3 si lo primero es la carga; +2 si se corrige la
 *    programación de rutas; −3 si se culpa al operador.
 *  - Clientes: +2 si a Almena se le dice la verdad con plan; −2 si se le dice que fue un caso aislado y después
 *    sale la causa; +1 si se repone la carga en 24 h.
 *  - Caja: −2 por pagar la carga y apoyo a la familia; −2 por contratar operadores de relevo.
 *  - Consejo: +2 si se presenta la causa real y el cambio; −3 si se oculta el dato de las 14 horas.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesCarretera(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const oculta = has(run, "oculta");
  const culpa = has(run, "culpa");
  const headline = oculta
    ? "El dato de las 14 horas salió después. Ya no se habla del accidente, sino de lo que no se dijo."
    : culpa ? "El operador cargó con la culpa. La programación que lo hizo manejar 14 horas sigue igual."
      : has(run, "rutas") && has(run, "operador") ? "Atendiste primero al operador, dijiste la verdad y cambiaste cómo se programan las rutas."
        : has(run, "rutas") ? "Cambiaste cómo se programan las rutas, aunque la primera reacción fue por la carga."
          : "Atendiste el accidente, pero la causa de fondo quedó a medias.";
  const agreement: [string, string][] = [
    ["Primero", has(run, "operador") ? "El operador y su familia" : has(run, "carga") ? "La carga del cliente" : "Investigar"],
    ["Causa reconocida", culpa ? "Error del operador" : oculta ? "No se dijo" : "Programación de rutas (14 horas al volante)"],
    ["Cambio", has(run, "rutas") ? "Tope de horas en el sistema y relevos" : has(run, "capacita") ? "Curso de manejo defensivo" : "Ninguno"],
  ];
  const economics: [string, string][] = [
    ["Carga perdida de Almena", "$3.8 M"],
    ["Relevos para respetar horas", has(run, "rutas") ? "12 operadores · $1.1 M al mes" : "No"],
  ];
  const kpi: RulesResult["kpi"] = [];
  let eq = 0;
  const ew: string[] = [];
  if (has(run, "operador")) { eq += 3; ew.push("+3 porque lo primero fue el operador y su familia"); }
  if (has(run, "carga")) { eq -= 3; ew.push("−3 porque lo primero fue la carga"); }
  if (has(run, "rutas")) { eq += 2; ew.push("+2 por corregir la programación que causó la fatiga"); }
  if (culpa) { eq -= 3; ew.push("−3 por culpar al operador de algo que la empresa programó"); }
  if (eq) kpi.push({ key: "equipo", delta: eq, why: `Regla: ${ew.join(", ")}.` });
  let cl = 0;
  const cw: string[] = [];
  if (has(run, "verdad")) { cl += 2; cw.push("+2 por decirle a Almena qué pasó y qué cambia"); }
  if (has(run, "aislado")) { cl -= 2; cw.push("−2 porque Almena supo después que no era un caso aislado"); }
  if (has(run, "repone")) { cl += 1; cw.push("+1 por reponer la carga en 24 horas"); }
  if (cl) kpi.push({ key: "clientes", delta: cl, why: `Regla: ${cw.join(", ")}.` });
  const caja = -2 + (has(run, "rutas") ? -2 : 0);
  kpi.push({ key: "caja", delta: caja, why: `Regla: −2 por la carga y el apoyo a la familia${has(run, "rutas") ? ", −2 por los operadores de relevo" : ""}.` });
  if (has(run, "plan")) kpi.push({ key: "consejo", delta: 2, why: "El consejo recibe la causa real, el costo y el cambio con fechas." });
  if (oculta) kpi.push({ key: "consejo", delta: -3, why: "El consejo se entera por otro lado de las 14 horas: pierde confianza en lo que le reportan." });
  const risks = [
    ...(!has(run, "rutas") ? [{ id: "ca-fatiga", text: "La programación de rutas sigue permitiendo jornadas de 14 horas.", owner: "antonio" as const }] : []),
    ...(has(run, "aislado") ? [{ id: "ca-almena", text: "Almena revisa si sigue confiando su carga a Vértice.", owner: "gaby" as const }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { culpa: culpa ? 1 : 0, oculta: oculta ? 1 : 0 } };
}

export const CARRETERA: EpisodeSpec = {
  contract: 1, id: "carretera", version: "1.0.0", approval: "aprobado",
  company: "vertice", industry: "Logística", title: "Accidente en la carretera", subject: "Un tractocamión se accidentó en la carretera a Saltillo",
  from: "antonio", counterpart: "hinojosa", channel: "llamada", areas: ["personas", "operacion", "clientes"], cast: ["antonio", "gaby", "rocio", "patricio", "pepe", "hinojosa", "rodrigo", "elena"],
  lesson: "crisis", minutes: 6,
  concept: {
    title: "En un accidente, la causa casi nunca es solo la persona",
    text: "Cuando algo grave pasa, es tentador buscar a quién culpar o cuidar primero la relación con el cliente. Pero lo primero es la gente, y lo segundo es entender qué del sistema permitió que pasara: horarios, metas, presión. Si solo cambias a la persona, el siguiente accidente ya está programado.",
    nota: "Pregunta qué hizo posible el error, no solo quién lo cometió.",
  },
  briefing: {
    message: [
      "Llamada de Antonio Leija, Operaciones · 5:40",
      "«La unidad 214 se salió del camino en la carretera a Saltillo. Ramiro, el operador, va al hospital con fractura de cadera.»",
      "«La carga de Almena se perdió completa. Hinojosa ya está llamando.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Operador", "Ramiro Castillo, 11 años en Vértice"], ["Carga", "Almena · $3.8 M"], ["Hora del accidente", "4:55"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "horas", label: "¿Cuántas horas llevaba manejando?", keywords: ["horas", "manejando", "fatiga", "cansado", "telemetria", "jornada"], source: "antonio", critical: true,
        answer: "Antonio: la telemetría dice 14 horas seguidas. La ruta se programó así porque el sistema no tiene tope de horas." },
      { id: "otros", label: "¿Pasa con otros operadores?", keywords: ["otros", "pasa seguido", "frecuente", "cuantos", "mas operadores"], source: "pepe",
        answer: "Pepe: varios manejamos 13 o 14 horas en temporada alta. Si no, la carga no llega a tiempo y nos descuentan el bono." },
      { id: "familia", label: "¿Cómo está la familia?", keywords: ["familia", "esposa", "hijos", "hospital", "ramiro"], source: "rocio",
        answer: "Rocío: su esposa está en el hospital en Saltillo, sin transporte. Tienen tres hijos." },
      { id: "almena", label: "¿Qué necesita Almena?", keywords: ["almena", "hinojosa", "cliente", "carga", "reponer"], source: "gaby",
        answer: "Gaby: Almena necesita la mercancía en sus tiendas en 48 horas. Podemos reponerla con otra unidad en 24." },
    ],
    unknowns: [
      { id: "peritaje", keywords: ["perito", "dictamen", "culpable legal", "ministerio"], answer: "Ese dato no lo tienes todavía: el dictamen oficial tarda semanas." },
    ],
  },
  advisors: [
    { id: "antonio", role: "Director de Operaciones y Flota", personality: "Duro, conoce cada ruta.", interests: "Que la flota siga moviéndose.", relations: "Arma la programación de rutas.", knows: ["horas"],
      view: [{ text: ["La ruta estaba apretada, sí. Pero así salen todas en temporada alta.", "Si ponemos tope de horas, necesito más operadores."] }] },
    { id: "rocio", role: "Directora de Personas", personality: "Cercana a los operadores.", interests: "Que la gente sepa que la empresa responde.", relations: "Conoce a la familia de Ramiro.", knows: ["familia"],
      view: [{ text: ["Lo que hagamos hoy con Ramiro lo van a ver los 300 operadores.", "No es momento de buscar culpables."] }] },
    { id: "gaby", role: "Directora de Servicio a Clientes y CEDIS", personality: "Resuelve rápido.", interests: "Que Almena no se vaya.", relations: "Habla con Hinojosa a diario.", knows: ["almena"],
      view: [{ text: ["Hinojosa va a preguntar qué pasó. Si le decimos algo a medias, se va a enterar igual.", "La carga la podemos reponer."] }] },
  ],
  terms: {},
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "Las primeras horas", who: "antonio", channel: "llamada",
      say: [{ text: ["Son las 5:45. Tu teléfono tiene tres llamadas perdidas de Hinojosa y un mensaje de Rocío: «¿Voy al hospital?»"] }],
      ask: "¿Qué haces primero?", freeText: true,
      strategies: [
        { id: "operador", text: "Mandar a Rocío al hospital con la familia de Ramiro, cubrir los gastos médicos y pedir a Gaby que reponga la carga de Almena.", cues: ["hospital", "familia", "ramiro", "gastos", "rocio", "primero el operador"], flags: ["operador", "repone"],
          reply: [{ text: ["Rocío: «Voy para allá. Le aviso a su esposa que la empresa se hace cargo.»", "Gaby: «La carga sale a las 8:00.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "problema", level: 3, basis: "Puso primero a la persona herida sin descuidar al cliente." },
            { dim: "informacion", level: 3, basis: "Preguntó por las horas, la familia o el cliente antes de decidir.", when: { any: ["q:horas", "q:familia", "q:almena", "q:otros", "a:rocio", "a:gaby", "a:antonio"] } },
          ] },
        { id: "carga", text: "Llamar primero a Hinojosa para calmar a Almena y asegurar que no cancele el contrato; lo del operador lo atiende Personas.", cues: ["hinojosa", "almena", "calmar", "contrato", "primero el cliente"], flags: ["carga"],
          reply: [{ text: ["Hinojosa: «Agradezco la llamada. ¿Cuándo llega mi mercancía?»", "Rocío te escribe: «La esposa de Ramiro preguntó si alguien de la empresa iba a venir.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "problema", level: 1, basis: "Atendió el contrato antes que a la persona herida." }] },
        { id: "investigar", text: "Pedir a Antonio el reporte completo de la unidad y de la ruta antes de hablar con nadie.", cues: ["reporte", "investigar", "antes de hablar", "unidad", "datos primero"], flags: ["investiga"],
          reply: [{ text: ["Antonio: «Te lo mando en una hora. Hinojosa sigue llamando.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "informacion", level: 2, basis: "Buscó los hechos, pero dejó esperando a la familia y al cliente." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Lo que se le dice a Almena", who: "hinojosa", channel: "llamada",
      say: [
        { when: { all: ["carga"] }, text: ["Hinojosa vuelve a llamar a mediodía.", "«Ya llegó la reposición, gracias. Mi director quiere saber qué pasó exactamente.»"] },
        { text: ["Hinojosa: «Gracias por reponer rápido. Mi director pregunta qué pasó y si puede volver a pasar.»"] },
      ],
      ask: "¿Qué le dices a Almena?", freeText: true,
      strategies: [
        { id: "verdad", text: "Decirle que el operador llevaba 14 horas manejando por cómo se programó la ruta, y que en dos semanas le presentamos el cambio.", cues: ["14 horas", "programo", "verdad", "dos semanas", "cambio"], flags: ["verdad"], trust: 1,
          reply: [{ text: ["«No es fácil decir eso. Prefiero un proveedor que lo reconoce a uno que lo esconde.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Dijo la causa real al cliente con un compromiso concreto." }] },
        { id: "aislado", text: "Decirle que fue un caso aislado de un operador y que ya se está atendiendo.", cues: ["aislado", "un operador", "ya se atiende", "no volvera"], flags: ["aislado"], trust: -1,
          reply: [{ text: ["«Bien. Confío en que no se repita.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Presentó como aislado un problema que sabía que era de sistema." }] },
      ],
    },
    a3: {
      id: "a3", stage: "La causa", who: "antonio", channel: "junta",
      say: [
        { when: { all: ["investiga"] }, text: ["Antonio trae el reporte.", "«No es solo Ramiro. 40 operadores pasaron de 13 horas el mes pasado.»"] },
        { text: ["Junta con Antonio, Rocío y Pepe.", "Pepe: «Si no manejamos 14 horas, no llega la carga y nos quitan el bono. Ramiro no hizo nada distinto a los demás.»"] },
      ],
      ask: "¿Qué cambias?", freeText: true,
      strategies: [
        { id: "rutas", text: "Poner un tope de 10 horas en el sistema de rutas, contratar 12 operadores de relevo y quitar el descuento al bono por retraso cuando sea por respetar el tope.", cues: ["tope", "10 horas", "sistema", "relevo", "bono", "contratar"], flags: ["rutas"],
          reply: [{ text: ["Pepe: «Eso nunca lo habíamos visto. Se lo digo a los compañeros hoy.»", "Antonio: «Necesito dos semanas para ajustar las rutas.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Cambió el sistema que causó el accidente, no solo a la persona." }] },
        { id: "capacita", text: "Dar a todos los operadores un curso de manejo defensivo y descanso, sin tocar la programación de rutas.", cues: ["curso", "manejo defensivo", "descanso", "capacitacion", "sin tocar"], flags: ["capacita"],
          reply: [{ text: ["Pepe: «El curso está bien. Pero el problema no es que no sepamos manejar.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Atendió un síntoma y dejó intacta la causa." }] },
        { id: "culpa", text: "Dejar el expediente como error del operador y recordar a todos que es su responsabilidad descansar.", cues: ["error del operador", "su responsabilidad", "expediente", "recordar", "culpa"], flags: ["culpa"],
          reply: [{ text: ["Pepe: «Entonces el próximo puede ser cualquiera de nosotros.»", "Rocío se queda callada."] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Culpó a una persona de algo que la empresa programó." }] },
      ],
    },
    a4: {
      id: "a4", stage: "El consejo", who: "rodrigo", channel: "junta",
      say: [{ text: ["Sesión de consejo. Rodrigo Salinas: «Supe del accidente de la 214. ¿Qué pasó y qué estamos haciendo?»"] }],
      ask: "¿Cómo lo presentas al consejo?", freeText: true,
      strategies: [
        { id: "plan", text: "Presentar las 14 horas, cuántos operadores estaban en la misma situación, el costo del cambio y las fechas.", cues: ["14 horas", "cuantos operadores", "costo", "fechas", "causa real"], flags: ["plan"],
          reply: [{ text: ["Elena: «Es caro, pero es más caro el siguiente accidente. Apruebo.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Dio al consejo la causa, el alcance y el costo del cambio." }],
          commitments: [{ id: "ca-tope", text: "Reporte mensual de horas al volante por operador.", owner: "antonio" }] },
        { id: "oculta", text: "Informar el accidente y el costo de la carga, sin entrar en el detalle de las horas.", cues: ["sin detalle", "costo de la carga", "solo el accidente", "no entrar"], flags: ["oculta"],
          reply: [{ text: ["Rodrigo: «Está bien.»", "Tres semanas después, Elena recibe el peritaje con las 14 horas."] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Ocultó al consejo el dato que explicaba el accidente." }] },
      ],
    },
  },
  followUps: [
    { id: "ca-relevos", when: { all: ["rutas"] }, afterDays: 30, from: "antonio", subject: "Primer mes con tope de horas",
      text: [{ text: ["Primer mes con tope de 10 horas. Ningún operador pasó de 11. Llegamos tarde dos veces, ninguna fue a Almena."] }] },
    { id: "ca-ramiro", when: { all: ["operador"] }, afterDays: 40, from: "rocio", subject: "Ramiro salió del hospital",
      text: [{ text: ["Ramiro ya está en casa. Su esposa mandó una carta para agradecer que alguien de la empresa estuvo ahí desde el primer día."] }] },
    { id: "ca-otro", when: { any: ["culpa", "capacita"] }, afterDays: 35, from: "antonio", subject: "Otro incidente por fatiga",
      text: [{ text: ["La unidad 187 se salió del carril en Matehuala. El operador llevaba 13 horas. Sin heridos, esta vez."] }] },
    { id: "ca-peritaje", when: { all: ["oculta"] }, afterDays: 21, from: "elena", subject: "El peritaje de la 214",
      text: [{ text: ["Recibí el peritaje: 14 horas al volante. ¿Por qué no lo supimos en la sesión?"] }] },
  ],
  rules: "carretera-v1",
};

registerRules("carretera-v1", rulesCarretera);
