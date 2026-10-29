/**
 * Piloto P0-C · Personas · «La conversación con Diego» (Botanas Cumbre).
 *
 * Conversación abierta con un colaborador: Diego (gerente de marca, hijo del fundador) se brinca a su jefe y
 * lleva propuestas directo a Don Ramiro. Una de ellas, un cambio de precio, ya se aplicó sin aprobación.
 * El jugador prepara la conversación, la abre, maneja la reacción, cierra un acuerdo y, según cómo fue,
 * atiende la llamada de Don Ramiro. Entre 4 y 5 decisiones. Casi todas aceptan respuesta con tus palabras.
 *
 * Borrador para aprobación de Oziel. Datos nuevos (marcados en docs/episodios/p0c.md): 3 propuestas en 6 semanas
 * sin pasar por Héctor, el cambio de precio en 30 tiendas (−2 pts de margen ahí), y el 360 de su equipo.
 *
 * Modelo (todo declarado):
 *  - La relación con Diego es la confianza del caso (−3…+3).
 *  - El acuerdo vale si tiene conducta concreta, seguimiento con fecha y Diego lo acepta (confianza ≥ 0).
 *  - Equipo: +2 con acuerdo claro, +1 si además la relación queda en ≥ 2; −2 sin acuerdo; −1 si lo exhibiste.
 *  - Consejo: depende de cómo quedó Don Ramiro (enterado por ti, por Diego o por terceros).
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

/** Términos derivados: si hay acuerdo válido (1) o no (0). */
export function deriveDiego(run: Pick<EpisodeRun, "flags" | "terms" | "trust">): Record<string, number> {
  const concreto = has(run, "acuerdo_claro") || has(run, "acuerdo_plan");
  const acuerdo = concreto && run.trust >= 0 && !has(run, "sin_acuerdo") ? 1 : 0;
  return { acuerdo };
}

export function rulesDiego(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const t = { ...run.terms, ...deriveDiego(run) };
  const ok = t.acuerdo === 1;
  const sem = t.seguimiento ?? 0;
  const ramiroBien = has(run, "ramiro_primero") || has(run, "ramiro_sostener");
  const ramiroMal = has(run, "ramiro_cede");
  const headline = ok
    ? run.trust >= 2
      ? `Diego acepta el acuerdo y sale de la conversación con ganas de demostrarlo: propuestas por Héctor y seguimiento contigo ${sem ? `cada semana durante ${sem} semanas` : "con fecha"}.`
      : "Hay acuerdo con Diego, aunque la relación quedó tensa. El seguimiento va a decidir si se sostiene."
    : has(run, "advertencia")
      ? "Diego recibe una advertencia formal. Cumple lo mínimo y se aleja de ti."
      : "La conversación no terminó en un acuerdo concreto. El patrón puede repetirse.";

  const agreement: [string, string][] = ok
    ? [
        ["Propuestas", "Pasan por Héctor antes de llegar a Don Ramiro o al comité"],
        ["Cambio de precio", "Se revierte en las 30 tiendas y se presenta formalmente con datos"],
        ...(sem ? [["Seguimiento", `1 a 1 contigo cada semana, ${sem} semanas`] as [string, string]] : []),
        ...(has(run, "acuerdo_plan") ? [["Desarrollo", "Diego presenta el piloto premium al comité con Héctor"] as [string, string]] : []),
      ]
    : [["Acuerdo", has(run, "advertencia") ? "Advertencia formal por escrito" : "Ninguno por escrito"]];

  const kpi: RulesResult["kpi"] = [];
  if (ok) kpi.push({ key: "equipo", delta: 2 + (run.trust >= 2 ? 1 : 0), why: `Acuerdo con conducta concreta y seguimiento${run.trust >= 2 ? "; la relación con Diego sale fortalecida" : ""}. El equipo de Diego ve que las reglas valen para todos.` });
  else kpi.push({ key: "equipo", delta: -2, why: "Sin acuerdo, el equipo de Diego sigue viendo que él se brinca a su jefe." });
  if (has(run, "exhibir")) kpi.push({ key: "equipo", delta: -1, why: "Lo corregiste frente a otros: la gente aprende a esconder errores." });
  if (ramiroBien) kpi.push({ key: "consejo", delta: 1, why: "Don Ramiro escuchó de ti el porqué antes que de nadie más." });
  else if (ramiroMal) kpi.push({ key: "consejo", delta: -2, why: "Retrocediste ante Don Ramiro: el consejo aprende que tus acuerdos se negocian por fuera." });
  else if (has(run, "ramiro_evita")) kpi.push({ key: "consejo", delta: -1, why: "Don Ramiro se quedó con la versión de Diego." });
  const kpiMerged = Object.values(kpi.reduce<Record<string, RulesResult["kpi"][number]>>((acc, k) => {
    const prev = acc[k.key];
    acc[k.key] = prev ? { key: k.key, delta: prev.delta + k.delta, why: `${prev.why} ${k.why}` } : k;
    return acc;
  }, {}));

  const commitments = ok ? [{ id: "dg-propuestas", text: "Diego pasa sus propuestas por Héctor.", owner: "diego" }, { id: "dg-precio", text: "Revertir el cambio de precio en las 30 tiendas.", owner: "diego" }] : [];
  const risks = [
    ...(!ok ? [{ id: "dg-patron", text: "Diego puede volver a llevar propuestas directo a Don Ramiro.", owner: "ceo" }] : []),
    ...(ok && sem === 0 ? [{ id: "dg-sin-fecha", text: "El acuerdo no tiene fecha de seguimiento: nadie va a notar si se rompe.", owner: "ceo" }] : []),
    ...(has(run, "delegado_hector") && run.trust < 1 ? [{ id: "dg-hector", text: "La relación entre Héctor y Diego quedó más tensa.", owner: "hector" }] : []),
  ];
  const luck = has(run, "ramiro_enterado")
    ? "Fuera de tu control: alguien del equipo ya le había contado a Don Ramiro antes de tu conversación. Por eso te llamó, aunque la plática hubiera salido bien."
    : null;
  return { headline, agreement, economics: [], kpi: kpiMerged, commitments, risks, luck, data: { acuerdo: t.acuerdo, trust: run.trust, seguimiento: sem } };
}

registerRules("diego-v1", rulesDiego, deriveDiego);

export const DIEGO: EpisodeSpec = {
  contract: 1, id: "diego", version: "0.1.0", approval: "borrador",
  company: "cumbre", industry: "Alimentos y botanas", title: "La conversación con Diego", subject: "Diego se está brincando a Héctor",
  from: "mariana", counterpart: "diego", channel: "email", areas: ["personas", "comunicacion", "cultura"], cast: ["mariana", "diego", "hector", "paty", "ramiro"],
  lesson: "conversaciones-2", minutes: 7,
  concept: {
    title: "Conversación difícil: hechos, impacto y un acuerdo que se puede revisar",
    text: "Diego no era «el problema»: era una conducta concreta (tres propuestas sin pasar por Héctor, un precio cambiado sin aprobación) con un impacto medible. Cuando describes hechos en lugar de juzgar la actitud, el otro puede escuchar sin defenderse. Y una conversación solo termina bien si deja un acuerdo concreto con fecha para revisarlo.",
    nota: "Describe lo que pasó, di qué impacto tuvo, escucha su versión y cierra con un acuerdo que ambos puedan revisar.",
  },
  briefing: {
    message: [
      "Director:",
      "Te escribo porque esto ya no puede esperar. Diego llevó otra propuesta directo a Don Ramiro sin pasar por Héctor. Es la tercera en seis semanas.",
      "La anterior fue un cambio de precio de la línea premium y ya se aplicó en 30 tiendas. Héctor se enteró por un cliente.",
      "Héctor está furioso y dos personas del equipo de Diego me pidieron cambio de área. Creo que necesitas hablar con él tú.",
      "Mariana Villarreal · Directora de Personas",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Diego", "Gerente de Marca, reporta a Héctor, hijo de Don Ramiro"], ["Lo que pasó", "3 propuestas sin pasar por su jefe en 6 semanas"], ["Lo más delicado", "Un cambio de precio aplicado sin aprobación"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "patron", label: "¿Qué pasó exactamente con las tres propuestas?", keywords: ["que paso", "propuestas", "tres", "exactamente", "hechos", "brinco", "brinca"], source: "hector",
        answer: "Héctor: en seis semanas Diego llevó tres propuestas directo a Don Ramiro: una campaña, un empaque y un cambio de precio de la línea premium. El precio se aplicó en 30 tiendas sin pasar por mí ni por Finanzas." },
      { id: "piloto", label: "¿Cómo va el piloto premium y qué hizo el cambio de precio?", keywords: ["piloto", "premium", "precio", "margen", "rota", "rotacion", "numeros"], source: "datos",
        answer: "Datos del piloto: la línea premium rota 1.3 veces contra una meta de 1.5. El cambio de precio bajó 2 puntos el margen en esas 30 tiendas." },
      { id: "equipo", label: "¿Cómo lo ve su equipo?", keywords: ["equipo", "360", "cambio de area", "gente", "colaboradores", "clima"], source: "mariana",
        answer: "Mariana: en el 360, su equipo lo describe como «brillante, pero no escucha». Dos de sus cuatro colaboradores pidieron cambio de área." },
      { id: "motivos", label: "¿Qué quiere Diego realmente?", keywords: ["quiere", "motivo", "por que", "siente", "hijo", "merito", "interes"], source: "paty",
        answer: "Paty: en los pasillos dice que nadie lo toma en serio por ser «el hijo del dueño» y que Héctor le bloquea todo. Quiere que su papá vea que algo salió por mérito suyo." },
      { id: "politica", label: "¿Qué dice la política de aprobaciones?", keywords: ["politica", "aprobacion", "aprobaciones", "regla", "proceso", "autoriza"], source: "mariana",
        answer: "Mariana: cualquier cambio de precio requiere la aprobación del Director Comercial y de Finanzas. Aplica para todos, sin excepción." },
    ],
    unknowns: [
      { id: "sucesion", keywords: ["sucesion", "sucesor", "heredar", "director general", "plan de don ramiro", "futuro de diego"], answer: "Ese dato no existe en el caso: nadie sabe si Don Ramiro piensa en Diego como sucesor. Decidir como si lo supieras sería especular." },
    ],
  },
  advisors: [
    { id: "mariana", role: "Directora de Personas", personality: "Empática, firme con las reglas.", interests: "Bajar la rotación y que la cultura cambie de verdad.", relations: "Lleva el 360 del equipo de Diego.", knows: ["equipo", "politica"],
      view: [{ text: [
        "Mi recomendación es que sea pronto y en privado. Cuanto más tarde, más se va a sentir como emboscada.",
        "Y por favor que sea sobre lo que hizo, no sobre quién es. Si siente que lo juzgas por ser el hijo, se cierra.",
      ] }] },
    { id: "hector", role: "Director Comercial", personality: "Orgulloso, directo, 22 años en Cumbre.", interests: "Que se respete la línea de mando y su cuenta.", relations: "Es el jefe de Diego. Se siente brincado.", knows: ["patron"],
      view: [
        { when: { all: ["comio"] }, text: [
          "Te lo digo como te lo dije en la comida: no quiero que lo corran. Es bueno. Pero necesito que entienda que el precio no se toca sin Finanzas.",
          "Si quieres, estoy en la conversación. Pero creo que le va a pegar más si viene de ti.",
        ] },
        { text: [
          "Si fuera cualquier otro gerente, ya estaría fuera. Un precio no se cambia sin Finanzas.",
          "Tú decides. Pero si esto no se arregla, yo no puedo dirigir a alguien que se brinca mi oficina.",
        ] },
      ] },
    { id: "paty", role: "Tu asistente ejecutiva", personality: "Discreta, conoce a todos.", interests: "Que no se te caiga nada.", relations: "Se lleva bien con Diego desde niño.", knows: ["motivos"],
      view: [{ text: [
        "Diego no es mal muchacho. Siente que todos lo ven como «el hijo» y por eso corre con su papá: es el único que lo escucha.",
        "Si le pides cuentas sin darle un camino para demostrar lo que vale, va a volver a hacerlo.",
      ] }] },
  ],
  history: [{ flag: "comio", item: "d1-hector", options: ["a"] }],
  chance: [{ flag: "ramiro_enterado", p: 0.4, label: "Alguien ya le contó a Don Ramiro" }],
  terms: {
    seguimiento: { label: "Seguimiento", unit: "semanas", initial: 0 },
    acuerdo: { label: "Acuerdo", unit: "", initial: 0 },
  },
  start: "p1",
  nodes: {
    p1: {
      id: "p1", stage: "Preparar", who: "mariana", channel: "email",
      say: [{ text: ["Mariana espera tu respuesta. Héctor también."] }],
      ask: "¿Cómo vas a atender esto?", freeText: true,
      strategies: [
        { id: "pronto", text: "Hablar con Diego esta semana, en privado y en persona, con los hechos en la mano.", flags: ["pronto"],
          reply: [{ text: ["Mariana: Perfecto. Le aparto 45 minutos el jueves en tu oficina.", "Te mando el resumen del 360 para que lo tengas, pero no se lo enseñes completo."] }],
          next: [{ to: "p2" }],
          evidence: [
            { dim: "problema", level: 3, basis: "Atendió una conducta que se repetía, pronto y en privado." },
            { dim: "informacion", level: 3, basis: "Llegó con los hechos verificados.", when: { any: ["q:patron", "q:piloto", "a:hector"] } },
            { dim: "informacion", level: 1, basis: "Fue a la conversación sin verificar qué pasó exactamente.", when: { none: ["q:patron", "q:piloto", "a:hector"] } },
          ] },
        { id: "ramiro_primero", text: "Antes de hablar con Diego, avisarle a Don Ramiro en persona que voy a tener esta conversación y por qué.", flags: ["ramiro_primero", "pronto"],
          reply: [{ text: ["Mariana: Buena idea. Así no se entera por Diego.", "Don Ramiro te ve mañana a las 9. Después de eso, el jueves con Diego."] }],
          next: [{ to: "p2" }],
          evidence: [
            { dim: "riesgos", level: 3, basis: "Anticipó que Don Ramiro se enteraría por otro lado y lo habló primero, sin pedirle permiso." },
            { dim: "informacion", level: 2, basis: "Preparó el terreno, aunque con poca información de primera mano.", when: { none: ["q:patron", "q:piloto", "a:hector"] } },
          ] },
        { id: "esperar", text: "Esperar a la evaluación de desempeño del trimestre para tratarlo con calma.", flags: ["espera"], trust: -1,
          reply: [{ text: ["Mariana: Faltan siete semanas para la evaluación.", "Te advierto que Héctor no va a aguantar tanto. Y Diego va a seguir igual mientras nadie le diga nada."] }],
          next: [{ to: "p2" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Pospuso una conversación necesaria: mientras tanto, el patrón sigue y el equipo lo ve." }],
          risks: [{ id: "dg-tarde", text: "La conversación llega tarde: el equipo ya se acostumbró a que Diego se brinque reglas.", owner: "ceo" }] },
        { id: "pedir_hector", text: "Que lo resuelva Héctor; es su jefe directo. Yo no me meto.", flags: ["delegado_hector"], trust: -1,
          reply: [{ text: ["Mariana: Ok… Héctor habló con él hoy. Salió mal: le dijo que «si no le gusta, que le pida chamba a su papá».", "Diego pidió verte. Está en tu puerta."] }],
          next: [{ to: "p2" }],
          evidence: [{ dim: "ejecucion", level: 1, basis: "Delegó una conversación que involucraba al dueño y a un jefe en conflicto; termina regresándole peor." }] },
      ],
    },
    p2: {
      id: "p2", stage: "Apertura", who: "diego", channel: "junta",
      say: [
        { when: { all: ["delegado_hector"] }, text: ["Diego entra sin tocar, con la cara roja.", "«Héctor me acaba de decir que me vaya con mi papá. ¿Eso es lo que piensas tú también?»"] },
        { when: { all: ["espera"] }, text: ["Siete semanas después. Diego llega a su evaluación con una carpeta de logros.", "«Gracias por el espacio. Traigo los números del piloto. ¿Empiezo yo?»"] },
        { text: ["Jueves, 16:00. Diego llega puntual, con su laptop.", "«Mariana me dijo que querías verme. ¿Es por el piloto premium? Traigo los números.»"] },
      ],
      ask: "¿Cómo abres la conversación?", freeText: true,
      strategies: [
        { id: "hechos", text: "Describir los hechos y su impacto, sin juicios: tres propuestas sin pasar por Héctor y un precio cambiado sin aprobación, que bajó 2 puntos de margen en 30 tiendas. Y preguntarle cómo lo ve.", flags: ["hechos"], trust: 1,
          reply: [
            { when: { any: ["q:piloto", "q:patron"] }, text: ["Diego se queda callado unos segundos.", "«No sabía lo del margen… Pensé que el precio iba a subir la rotación. Pero sí, no lo pasé por nadie.»"] },
            { text: ["«¿Dos puntos? ¿De dónde sacas eso?»", "«Bueno… sí, no lo pasé por Héctor. Pero tengo mis razones.»"] },
          ],
          next: [{ to: "p3" }],
          evidence: [
            { dim: "coherencia", level: 3, basis: "Separó la conducta de la persona y mostró el impacto con un dato verificado.", when: { any: ["q:piloto", "q:patron", "a:hector"] } },
            { dim: "coherencia", level: 2, basis: "Habló de conducta e impacto, aunque sin cifras verificadas.", when: { none: ["q:piloto", "q:patron", "a:hector"] } },
          ] },
        { id: "preguntar", text: "Empezar preguntando: «¿Cómo ves tus últimas seis semanas? ¿Qué te ha funcionado y qué no?»", flags: ["pregunta_abierta"], trust: 1,
          reply: [{ text: ["«La verdad, frustrado. Siento que todo lo que propongo se queda en el escritorio de Héctor.»", "«Por eso a veces se lo enseño a mi papá. Él sí me escucha.»"] }],
          next: [{ to: "p3" }],
          evidence: [{ dim: "informacion", level: 3, basis: "Dejó que Diego pusiera su versión primero; así apareció el motivo real (sentirse bloqueado)." }] },
        { id: "sandwich", text: "Empezar con elogios a su creatividad, mencionar «algunos temas de proceso» y cerrar con otro elogio.", flags: ["sandwich"],
          reply: [{ text: ["«¡Gracias! Sí, creo que el piloto va muy bien.»", "«¿Temas de proceso? Bueno, lo vemos con Héctor.»"] }],
          next: [{ to: "p3" }],
          evidence: [{ dim: "coherencia", level: 1, basis: "El mensaje importante quedó escondido entre elogios: Diego no entendió que había un problema." }] },
        { id: "juicio", text: "Decirle directo: «Diego, tienes un problema de actitud. No respetas a tu jefe.»", flags: ["juicio"], trust: -2,
          reply: [{ text: ["Diego cierra la laptop.", "«¿Actitud? Llevo seis semanas sacando ese piloto solo, porque Héctor no me hace caso.»"] }],
          next: [{ to: "p3" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Juzgó la actitud en lugar de describir conductas: el otro solo puede defenderse." }] },
      ],
    },
    p3: {
      id: "p3", stage: "Reacción", who: "diego", channel: "junta",
      say: [
        { when: { all: ["juicio"] }, text: ["«Todos aquí me ven como el hijo del dueño. Hasta tú.»", "«Si Héctor me escuchara, no tendría que ir con mi papá.»"] },
        { when: { all: ["sandwich"] }, text: ["Mariana te escribe por WhatsApp a la salida: «Diego le dijo a su equipo que la junta contigo salió increíble». Al día siguiente lleva otra propuesta a Don Ramiro.", "Tienes que volver a hablar con él."] },
        { text: ["«Mira, sé que no fue la forma. Pero Héctor bloquea todo lo nuevo. Mi papá me dijo que le enseñara las ideas directamente.»", "«¿Qué querías que hiciera?»"] },
      ],
      ask: "Diego se defiende. ¿Qué haces?", freeText: true,
      strategies: [
        { id: "validar", text: "Reconocer su frustración sin darle la razón en todo: «Entiendo que te sientas bloqueado; eso lo vamos a resolver. Y aun así, el precio no se cambia sin Finanzas. Las dos cosas son ciertas.»", flags: ["validar"], trust: 1,
          reply: [{ text: ["Diego respira.", "«Ok. Es justo. Lo del precio estuvo mal. Pero necesito un camino para que mis ideas lleguen a algún lado.»"] }],
          next: [{ to: "p4" }],
          evidence: [
            { dim: "negociacion", level: 3, basis: "Separó el interés de Diego (ser escuchado) de la regla que no se negocia." },
            { dim: "adaptacion", level: 2, basis: "Reencauzó la conversación después de la defensa.", when: { any: ["juicio", "sandwich"] } },
          ] },
        { id: "darle_razon", text: "Darle la razón: Héctor es parte del problema. Que me traiga sus ideas a mí directamente.", flags: ["bypass_ceo"], trust: 2,
          reply: [{ text: ["«¡Gracias! Sabía que tú sí lo ibas a entender.»", "(Héctor se entera esa misma tarde.)"] }],
          next: [{ to: "p4" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Cambió un atajo por otro: ahora Diego se brinca a Héctor para llegar a ti." }],
          risks: [{ id: "dg-bypass", text: "Diego ahora se brinca a Héctor para llegar a ti; Héctor pierde autoridad con su equipo.", owner: "hector" }] },
        { id: "confrontar_padre", text: "Decirle que deje de esconderse detrás de su papá.", flags: ["confronta_padre"], trust: -2,
          reply: [{ text: ["«No me escondo de nadie.»", "Diego se levanta. «Si eso es todo, tengo trabajo.»"] }],
          next: [{ to: "p4" }],
          evidence: [{ dim: "riesgos", level: 0, basis: "Llevó la conversación al terreno personal y familiar, donde no hay acuerdo posible." }] },
        { id: "exhibir", text: "Llamar a Héctor y a Mariana a la oficina para aclararlo ahí mismo, los cuatro.", flags: ["exhibir"], trust: -1,
          reply: [{ text: ["Héctor llega cruzado de brazos. Diego no vuelve a hablar en toda la junta.", "Mariana te mira: esto se volvió un juicio."] }],
          next: [{ to: "p4" }],
          evidence: [{ dim: "problema", level: 1, basis: "Convirtió una conversación privada en una confrontación con público." }] },
      ],
    },
    p4: {
      id: "p4", stage: "Acuerdo", who: "diego", channel: "junta",
      say: [
        { when: { all: ["trust>=1"] }, text: ["«Ok. ¿Qué necesitas de mí?»"] },
        { when: { all: ["trust<=-2"] }, text: ["Diego está a la defensiva. Contesta con monosílabos.", "Antes de que se vaya, tienes que cerrar algo."] },
        { text: ["Diego espera. La conversación necesita un cierre."] },
      ],
      ask: "¿Con qué acuerdo cierras?", freeText: true,
      strategies: [
        { id: "acuerdo_claro", text: "Un acuerdo concreto: sus propuestas pasan por Héctor; el precio se revierte y se presenta con datos; y nos vemos 1 a 1 cada semana un tiempo para revisarlo.", flags: ["acuerdo_claro"],
          params: [{ key: "seguimiento", label: "Seguimiento semanal contigo", min: 2, max: 8, step: 2, default: 4, unit: "semanas", hint: "Lo suficiente para ver si el cambio se sostiene" }],
          reply: [
            { when: { all: ["acuerdo=1"] }, text: ["«Va. Lo paso por Héctor. Y lo del precio lo revierto mañana.»", "«Nos vemos el lunes.»"] },
            { text: ["«…Como digas.»", "Diego firma el acuerdo sin mirarte."] },
          ],
          next: [{ when: { any: ["ramiro_enterado", "trust<=0", "confronta_padre"], none: ["ramiro_primero"] }, to: "p5" }, { to: "close" }],
          evidence: [
            { dim: "ejecucion", level: 3, basis: "Conducta concreta, responsable y fecha de revisión.", when: { all: ["seguimiento>=4"] } },
            { dim: "ejecucion", level: 2, basis: "Acuerdo concreto, aunque con un seguimiento corto para ver si se sostiene.", when: { all: ["seguimiento<4"] } },
          ],
          commitments: [{ id: "dg-1a1", text: "1 a 1 semanal con Diego para revisar el acuerdo.", owner: "ceo" }] },
        { id: "acuerdo_plan", text: "Un acuerdo con camino: sus propuestas pasan por Héctor, y a cambio presenta él mismo el piloto premium al comité, con Héctor, en cuatro semanas.", flags: ["acuerdo_plan"], set: { seguimiento: 4 }, trust: 1,
          reply: [
            { when: { all: ["acuerdo=1"] }, text: ["Diego sonríe por primera vez.", "«¿Lo presento yo? Va. Le pido a Héctor que lo revisemos juntos el martes.»"] },
            { text: ["«No sé si Héctor va a querer, pero lo intento.»"] },
          ],
          next: [{ when: { any: ["ramiro_enterado", "trust<=0", "confronta_padre"], none: ["ramiro_primero"] }, to: "p5" }, { to: "close" }],
          evidence: [
            { dim: "negociacion", level: 3, basis: "La regla se mantiene y Diego obtiene un camino legítimo para que lo vean por su trabajo." },
            { dim: "ejecucion", level: 3, basis: "Acuerdo con responsable, fecha y un entregable visible." },
          ],
          commitments: [{ id: "dg-comite", text: "Diego y Héctor presentan el piloto premium al comité en cuatro semanas.", owner: "diego" }] },
        { id: "advertencia", text: "Una advertencia formal por escrito: si vuelve a pasar, hay consecuencias.", flags: ["advertencia"], trust: -1,
          reply: [{ text: ["Diego firma la advertencia.", "«Entendido.» No dice nada más."] }],
          next: [{ when: { none: ["ramiro_primero"] }, to: "p5" }, { to: "close" }],
          evidence: [{ dim: "ejecucion", level: 1, basis: "Dejó constancia, pero sin un acuerdo de conducta ni seguimiento: solo una amenaza." }] },
        { id: "sin_acuerdo", text: "Dejarlo así: ya le quedó claro el mensaje.", flags: ["sin_acuerdo"],
          reply: [{ text: ["«Ok. Gracias.»", "Diego se va. Nadie sabe qué cambió."] }],
          next: [{ when: { any: ["ramiro_enterado", "confronta_padre"], none: ["ramiro_primero"] }, to: "p5" }, { to: "close" }],
          evidence: [{ dim: "ejecucion", level: 0, basis: "La conversación terminó sin acuerdo ni fecha: no hay forma de saber si algo cambia." }] },
      ],
    },
    p5: {
      id: "p5", stage: "Don Ramiro", who: "ramiro", channel: "llamada",
      say: [
        { when: { all: ["ramiro_enterado"], none: ["juicio", "confronta_padre"] }, text: ["Don Ramiro te llama esa noche.", "«Ya me contaron que hablaste con Diego. No me gusta enterarme por otros. ¿Qué pasó?»"] },
        { text: ["Don Ramiro te llama esa noche.", "«Diego llegó a la casa muy molesto. Dice que lo regañaste. ¿Qué pasó con mi hijo?»"] },
      ],
      ask: "El fundador quiere saber qué pasó. ¿Qué le dices?", freeText: true,
      strategies: [
        { id: "sostener", text: "Explicarle los hechos con calma (el precio, el margen, la política que aplica para todos) y el acuerdo, sin pedirle permiso.", flags: ["ramiro_sostener"],
          reply: [{ text: ["Silencio largo.", "«…El precio no lo sabía. Está bien. Pero cuídamelo, ¿eh? Es buen muchacho.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Sostuvo la decisión ante el dueño con hechos, sin pedir permiso ni culpar a Diego." }] },
        { id: "ceder", text: "Disculparme y decirle que voy a suavizar el acuerdo con Diego.", flags: ["ramiro_cede"],
          reply: [{ text: ["«Te lo agradezco. Sabía que eras razonable.»", "(Diego se entera al día siguiente.)"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Deshizo el acuerdo por presión del dueño: la regla dejó de aplicar para todos." }],
          risks: [{ id: "dg-ramiro", text: "Diego aprende que su papá puede deshacer tus acuerdos.", owner: "ceo" }] },
        { id: "evitar", text: "Decirle que es un tema interno de la operación y que mejor lo hable con Diego.", flags: ["ramiro_evita"],
          reply: [{ text: ["«¿Interno? Es mi empresa y es mi hijo.»", "Cuelga."] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Evitó la conversación con el dueño: su única versión es la de Diego." }] },
      ],
    },
  },
  followUps: [
    { id: "dg-comite", when: { all: ["acuerdo_plan", "acuerdo=1"] }, afterDays: 28, from: "hector", subject: "Diego presenta el piloto premium",
      text: [{ text: ["Diego presentó ayer en el comité. Lo revisamos juntos antes. Te lo digo: lo hizo bien.", "Lucía pidió dos ajustes al precio, esta vez por la vía correcta."] }] },
    { id: "dg-1a1", when: { all: ["acuerdo=1", "seguimiento>0"] }, afterDays: 7, from: "paty", subject: "Primer 1 a 1 con Diego",
      text: [{ text: ["Te aparté el primer 1 a 1 con Diego el lunes a las 8. Él mismo lo confirmó."] }] },
    { id: "dg-repite", when: { any: ["sin_acuerdo", "ramiro_cede", "bypass_ceo"] }, afterDays: 14, from: "mariana", subject: "Diego volvió a hacerlo",
      text: [{ text: ["Diego llevó otra propuesta sin pasar por Héctor. Héctor me pidió una cita para hablar de su futuro en Cumbre."] }] },
  ],
  rules: "diego-v1",
};
