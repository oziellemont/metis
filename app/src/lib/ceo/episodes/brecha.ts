/**
 * Caso largo · Capítulos «Construir capacidad» a «Escalar» · Kúbit · «Acceso indebido a datos de clientes».
 *
 * Ingeniería detecta que una llave de acceso expuesta permitió leer datos de nómina de 3 clientes durante 9 días.
 * Hay dos obligaciones (avisar a los clientes afectados y a la autoridad de datos personales en plazo). Se decide
 * cómo contener, a quién avisar y cómo, qué decir a la prensa y cómo corregir la causa. Entre 3 y 5 decisiones.
 *
 * Modelo (todo declarado):
 *  - Clientes: +2 si se avisa a los clientes en 24 h con plan; −2 por cada obligación incumplida; −2 si la prensa
 *    se entera antes que los clientes.
 *  - Consejo: −3 por cada obligación incumplida; +1 si se le informa el mismo día.
 *  - Equipo: +1 si se corrige el proceso sin buscar culpables; −2 si se despide al ingeniero.
 *  - Caja: −2 por la auditoría externa y créditos a clientes; −1 si solo se rota la llave.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { holds } from "./engine";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesBrecha(spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const obs = (spec.obligations ?? []).map((o) => ({ ...o, ok: holds(run, o.met) }));
  const fallas = obs.filter((o) => !o.ok).length;
  const prensa = has(run, "filtracion") && !has(run, "aviso_clientes");
  const headline = fallas === 0
    ? has(run, "proceso") ? "Contuviste el acceso, avisaste a tiempo y corregiste la causa. Los tres clientes siguen contigo."
      : "Contuviste el acceso y avisaste a tiempo. La causa quedó a medias."
    : fallas === 1 ? `Una obligación no se cumplió: ${obs.find((o) => !o.ok)!.text.toLowerCase()}.`
      : "Ninguna de las dos obligaciones se cumplió: el problema dejó de ser técnico y pasó a ser de confianza.";
  const agreement: [string, string][] = [
    ["Contención", has(run, "contiene_todo") ? "Llaves rotadas y acceso revisado en toda la plataforma" : "Solo se rotó la llave expuesta"],
    ["Clientes", has(run, "aviso_clientes") ? "Avisados en 24 horas con lo que se sabe" : has(run, "aviso_tarde") ? "Avisados al terminar la investigación" : "Sin aviso"],
    ["Autoridad", has(run, "aviso_autoridad") ? "Notificada en plazo" : "Sin notificar"],
  ];
  const economics: [string, string][] = [
    ["Auditoría externa y créditos", has(run, "auditoria") ? "$1.2 M" : "—"],
    ["Clientes en riesgo", fallas ? "3 cuentas, $9 M de venta anual" : "Ninguno se fue"],
  ];
  const kpi: RulesResult["kpi"] = [];
  if (fallas === 0) kpi.push({ key: "clientes", delta: 2, why: "Los clientes supieron por ti, rápido y con un plan." });
  else kpi.push({ key: "clientes", delta: -2 * fallas - (prensa ? 2 : 0), why: `${fallas === 1 ? "Una obligación incumplida" : "Dos obligaciones incumplidas"}${prensa ? " y la prensa se enteró antes que los clientes" : ""}. Regla: −2 por cada una.` });
  if (fallas) kpi.push({ key: "consejo", delta: -3 * fallas, why: "El consejo responde por el cumplimiento de la ley de datos. Regla: −3 por cada obligación incumplida." });
  if (has(run, "consejo_hoy")) kpi.push({ key: "consejo", delta: 1, why: "El consejo se enteró por ti el mismo día." });
  if (has(run, "proceso")) kpi.push({ key: "equipo", delta: 1, why: "Ingeniería ve que se arregla el proceso, no que se busca a quién culpar." });
  if (has(run, "despide")) kpi.push({ key: "equipo", delta: -2, why: "Se despidió al ingeniero: la próxima vez nadie va a reportar un error a tiempo." });
  if (has(run, "auditoria")) kpi.push({ key: "caja", delta: -2, why: "Auditoría externa y créditos a los clientes afectados: $1.2 M." });
  if (!has(run, "contiene_todo")) kpi.push({ key: "caja", delta: -1, why: "Sin revisar el resto de las llaves, se paga una segunda revisión el mes siguiente." });
  return {
    headline, agreement, economics, kpi,
    risks: [...(!has(run, "contiene_todo") ? [{ id: "br-otras", text: "Puede haber otras llaves expuestas que nadie revisó.", owner: "emilio" }] : [])],
    data: { fallas },
  };
}

export const BRECHA: EpisodeSpec = {
  contract: 1, id: "brecha", version: "1.0.0", approval: "aprobado",
  company: "kubit", industry: "Software y SaaS", title: "Acceso indebido a datos", subject: "Una llave expuesta dejó ver datos de nómina de 3 clientes",
  from: "emilio", counterpart: "renata", channel: "llamada", areas: ["etica", "operacion", "comunicacion"], cast: ["emilio", "renata", "andrea", "ibarra", "joel"],
  lesson: "crisis", minutes: 7,
  concept: {
    title: "Con datos de otros, el plazo para avisar no es tuyo",
    text: "Cuando se exponen datos personales de los clientes, avisarles y notificar a la autoridad no es una cortesía: es una obligación con plazo. Esperar a tener toda la investigación parece prudente, pero el cliente necesita saberlo para protegerse. Lo que sí decides es cómo contener, cómo explicar y cómo cambiar el proceso para que no se repita.",
    nota: "Contén primero, avisa con lo que sabes, explica qué haces y arregla el proceso sin buscar culpables.",
  },
  obligations: [
    { id: "clientes", text: "Avisar a los clientes afectados con lo que se sabe y qué deben hacer", met: { any: ["aviso_clientes", "aviso_tarde"] } },
    { id: "autoridad", text: "Notificar a la autoridad de datos personales dentro del plazo", met: { all: ["aviso_autoridad"] } },
  ],
  briefing: {
    message: [
      "Llamada de Emilio, Producto e Ingeniería · 22:15",
      "«Encontramos una llave de acceso que quedó publicada en un repositorio. Con ella se podían leer datos de nómina de tres clientes.»",
      "«Estuvo expuesta nueve días. No sabemos todavía si alguien la usó. ¿Qué hacemos?»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Clientes afectados", "3"], ["Datos", "Nómina de sus empleados"], ["Tiempo expuesta", "9 días"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "ley", label: "Obligación legal", keywords: [], source: "datos", critical: true,
        answer: "Si se vulneran datos personales, hay que informar a las personas o empresas afectadas y a la autoridad de datos sin demora, con lo que se sabe y lo que deben hacer." },
      { id: "alcance", label: "¿Cuántas personas y qué datos?", keywords: ["cuantas", "personas", "datos", "alcance", "registros", "empleados"], source: "emilio",
        answer: "Emilio: 4,200 empleados de los tres clientes. Nombre, RFC, sueldo y cuenta bancaria." },
      { id: "uso", label: "¿Hay señales de que la usaron?", keywords: ["uso", "usaron", "accesos", "senales", "bitacora", "logs"], source: "joel",
        answer: "Joel: la bitácora muestra 3 accesos desde una IP que no es nuestra, el día 6. Todavía no sabemos qué se llevó." },
      { id: "clientes", label: "¿Quiénes son los clientes?", keywords: ["quienes", "clientes", "cuentas", "contrato"], source: "renata",
        answer: "Renata: son tres cuentas medianas, $9 M de venta al año entre las tres. Una está a punto de renovar." },
      { id: "causa", label: "¿Cómo pasó?", keywords: ["como paso", "causa", "repositorio", "error", "quien", "llave"], source: "joel",
        answer: "Joel: un ingeniero subió una configuración de prueba con la llave real. No hay revisión automática que lo detecte." },
    ],
    unknowns: [
      { id: "que_llevaron", keywords: ["que se llevaron", "descargaron", "copiaron", "que robaron", "cuantos datos salieron"], answer: "Ese dato todavía no existe: la investigación forense tarda una semana." },
    ],
  },
  advisors: [
    { id: "renata", role: "Directora de Éxito del Cliente", personality: "Cercana a las cuentas.", interests: "Que ningún cliente se entere por otro lado.", relations: "Conoce a los tres clientes.", knows: ["clientes"],
      view: [{ text: [
        "Si fuera mi nómina, querría saberlo hoy, no en una semana.",
        "Lo que más enoja a un cliente no es el error: es enterarse tarde.",
      ] }] },
    { id: "emilio", role: "Cofundador · Producto e Ingeniería", personality: "Técnico, se siente responsable.", interests: "Cerrar el hueco y que no se repita.", relations: "Lidera al equipo que encontró la llave.", knows: ["alcance", "causa"],
      view: [{ text: [
        "Ya rotamos esa llave. Lo que me preocupa es que no sabemos si hay otras.",
        "Y el ingeniero que la subió fue el que la reportó.",
      ] }] },
    { id: "joel", role: "Ingeniero senior", personality: "Franco, vocero informal del equipo.", interests: "Que no se busque un culpable.", relations: "Revisó la bitácora.", knows: ["uso", "causa"],
      view: [{ text: [
        "Hay tres accesos raros el día 6. Eso ya no es teoría.",
        "Si castigan al que la reportó, nadie va a volver a reportar nada.",
      ] }] },
  ],
  terms: {},
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "Contener", who: "emilio", channel: "llamada",
      say: [{ text: ["Emilio sigue en la línea. Se oye el teclado de fondo."] }],
      ask: "¿Qué haces esta noche?", freeText: true,
      strategies: [
        { id: "todo", text: "Rotar todas las llaves de la plataforma esta noche y revisar en la bitácora cada acceso de los últimos 30 días.", cues: ["todas las llaves", "rotar", "bitacora", "30 dias", "esta noche", "revisar"], flags: ["contiene_todo"],
          reply: [{ text: ["«Va. Nos vamos a desvelar, pero mañana sabemos si hay otras.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 3, basis: "Contuvo el problema completo, no solo la llave que se encontró." },
            { dim: "informacion", level: 3, basis: "Usó lo que sabía de accesos o alcance para dimensionar la contención.", when: { any: ["q:uso", "q:alcance", "a:joel", "a:emilio"] } }] },
        { id: "una", text: "Rotar solo la llave expuesta y seguir mañana con calma.", cues: ["solo", "esa llave", "manana", "calma"],
          reply: [{ text: ["«Ya está rotada. Mañana revisamos lo demás.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Cerró el hueco visible, sin revisar si había otros." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Avisar", who: "renata", channel: "junta",
      say: [{ text: ["8:00. Renata entra a tu oficina.", "«Emilio me contó. ¿Qué les decimos a los tres clientes?»"] }],
      ask: "¿Cómo y cuándo avisas a los clientes?", freeText: true,
      strategies: [
        { id: "hoy", text: "Llamarles hoy, tú en persona: qué pasó, qué datos, qué hicimos y qué deben decirle a sus empleados. Y notificar a la autoridad hoy mismo.", cues: ["hoy", "llamar", "en persona", "que paso", "que datos", "autoridad"], flags: ["aviso_clientes", "aviso_autoridad"], trust: 1,
          reply: [{ text: ["«Les agendo a las 10. Me duele, pero es lo correcto.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Avisó con la duda y en persona, cumpliendo las dos obligaciones." }] },
        { id: "esperar", text: "Esperar la investigación forense (una semana) para avisar con información completa.", cues: ["esperar", "forense", "semana", "informacion completa", "investigacion"], flags: ["aviso_tarde"],
          reply: [{ text: ["«Una semana es mucho. Si uno de ellos se entera antes…»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Condicionó el aviso a tener certeza, con datos de terceros expuestos." }] },
        { id: "callar", text: "No avisar: si no hay prueba de que se llevaron algo, no hay que alarmar.", cues: ["no avisar", "no hay prueba", "alarmar", "silencio"], flags: ["calla"], trust: -1,
          reply: [{ text: ["Renata se queda callada.", "«No voy a poder ver a esos clientes a la cara.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Trató una obligación legal como opcional porque no había prueba." }] },
      ],
    },
    a3: {
      id: "a3", stage: "Prensa", who: "renata", channel: "whatsapp",
      say: [
        { when: { none: ["aviso_clientes"] }, text: ["Renata: «Un periodista de tecnología escribió preguntando por una filtración de datos de nómina en Kúbit. Dice que un cliente se lo contó.»"] },
        { text: ["Renata: «Un periodista de tecnología escribió preguntando por el incidente. Los clientes ya lo saben por nosotros.»"] },
      ],
      ask: "¿Qué le respondes al periodista?", freeText: true,
      strategies: [
        { id: "transparente", text: "Responder con los hechos: qué pasó, a cuántos afectó, qué hicimos y que la autoridad ya está notificada.", cues: ["hechos", "que paso", "cuantos", "que hicimos", "autoridad"], flags: ["prensa_ok"],
          reply: [
            { when: { none: ["aviso_clientes"] }, text: ["La nota sale: «Kúbit confirma filtración; clientes dicen que se enteraron por la prensa».", "Ahora sí hay que avisar a la autoridad."] },
            { text: ["La nota sale corta: «Kúbit detecta y contiene acceso indebido; avisó a clientes el mismo día»."] },
          ],
          next: [{ when: { none: ["aviso_autoridad"] }, to: "a4" }, { to: "a5" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Dijo los hechos con una sola voz." }] },
        { id: "sin_comentarios", text: "No hacer comentarios.", cues: ["sin comentarios", "no comentar", "no responder", "ignorar"], flags: ["filtracion"],
          reply: [{ text: ["La nota sale con la versión del cliente: «Kúbit guarda silencio».", "Ibarra te escribe: «¿Qué está pasando?»"] }],
          next: [{ when: { none: ["aviso_autoridad"] }, to: "a4" }, { to: "a5" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "El silencio dejó que otros contaran la historia." }] },
      ],
    },
    a4: {
      id: "a4", stage: "Corregir el rumbo", who: "ibarra", channel: "llamada",
      say: [{ text: ["Ibarra, presidente del consejo, te llama.", "«¿Ya se notificó a la autoridad? Si no, tenemos un problema legal además del de reputación.»"] }],
      ask: "La autoridad no ha sido notificada. ¿Qué haces?", freeText: true,
      strategies: [
        { id: "notificar", text: "Notificar hoy a la autoridad y avisar a los tres clientes, aunque sea tarde, y contarle todo al consejo.", cues: ["notificar", "hoy", "autoridad", "aunque sea tarde", "consejo"], flags: ["aviso_autoridad", "aviso_clientes", "consejo_hoy"],
          reply: [{ text: ["«Bien. Tarde, pero bien. Mándame la nota que les envíes.»"] }],
          next: [{ to: "a5" }],
          evidence: [{ dim: "adaptacion", level: 2, basis: "Corrigió el rumbo y cumplió, aunque tarde." }] },
        { id: "sostener", text: "Sostener que no hace falta notificar hasta tener la investigación.", cues: ["sostener", "no hace falta", "investigacion", "esperar"],
          reply: [{ text: ["«No estoy de acuerdo y lo voy a dejar en el acta.»"] }],
          next: [{ to: "a5" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Mantuvo una obligación legal sin cumplir con el consejo advirtiendo." }] },
      ],
    },
    a5: {
      id: "a5", stage: "La causa", who: "joel", channel: "junta",
      say: [{ text: ["Retrospectiva con ingeniería. Joel habla primero.", "«El que subió la llave fue quien la reportó. ¿Qué cambiamos?»"] }],
      ask: "¿Cómo atacas la causa?", freeText: true,
      strategies: [
        { id: "proceso", text: "Revisión automática que bloquee llaves en el código, auditoría externa y crédito de un mes a los clientes afectados. Sin castigar a quien reportó.", cues: ["revision automatica", "bloquee", "auditoria", "credito", "sin castigar"], flags: ["proceso", "auditoria"],
          reply: [{ text: ["«Eso sí cambia las cosas. Y el equipo va a seguir reportando.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Corrigió el proceso, reparó a los clientes y protegió a quien reportó." }],
          commitments: [{ id: "br-control", text: "Revisión automática de llaves en cada cambio de código.", owner: "emilio" }] },
        { id: "despedir", text: "Despedir al ingeniero que subió la llave para que quede claro que esto no se tolera.", cues: ["despedir", "ingeniero", "no se tolera", "castigo"], flags: ["despide"],
          reply: [{ text: ["Silencio en la sala.", "Joel: «Él fue quien lo encontró y lo reportó.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "problema", level: 0, basis: "Buscó un culpable en lugar de la causa: no había ningún control que lo detectara." }] },
      ],
    },
  },
  followUps: [
    { id: "br-autoridad", when: { none: ["aviso_autoridad"] }, afterDays: 10, from: "andrea", subject: "La autoridad de datos abrió un procedimiento",
      text: [{ text: ["La autoridad de datos personales abrió un procedimiento por no notificar el incidente. Hay que responder en 15 días."] }] },
    { id: "br-renueva", when: { all: ["aviso_clientes", "proceso"] }, afterDays: 30, from: "renata", subject: "El cliente que iba a renovar, renovó",
      text: [{ text: ["El cliente que estaba por renovar firmó. Dijo que lo convenció cómo manejamos el incidente."] }] },
    { id: "br-fuga", when: { all: ["despide"] }, afterDays: 20, from: "joel", subject: "Dos ingenieros más se van",
      text: [{ text: ["Dos ingenieros del equipo renunciaron. Dicen que no quieren trabajar donde reportar un error te cuesta el empleo."] }] },
  ],
  rules: "brecha-v1",
};

registerRules("brecha-v1", rulesBrecha);
