/**
 * Caso largo · Capítulos «Acelerar» a «Gobernar» · Forja Norte · «El programa eléctrico».
 *
 * Aurora ofrece a Forja las charolas de batería de su primer vehículo eléctrico: venta de $300 M al año desde
 * 2028, pero exige una línea nueva de $420 M. Decisiones: cómo evaluar la oferta, cómo pagar la línea, qué hacer
 * cuando Aurora retrasa el arranque y cómo se presenta al consejo. Entre 3 y 4 decisiones.
 *
 * Modelo (todo declarado):
 *  - Caja: −5 por invertir la línea completa; +3 si Aurora paga el herramental por adelantado; +2 si se frena la
 *    segunda fase al llegar el retraso; +2 si el contrato tenía volumen mínimo y se cobra la compensación;
 *    +3 si el fondo aporta capital. Celda piloto: −1. No entrar: 0.
 *  - Clientes: +3 si se entra al programa y la relación queda bien (confianza ≥ 0); +1 si queda tensa;
 *    −1 con celda piloto; −3 si Forja se queda fuera.
 *  - Margen: −2 si se absorbe el retraso sin decir nada; −1 si se compra equipo antes de tener especificación.
 *  - Consejo: +2 si se presenta con escenarios y plan de salida; −2 si solo se muestra el mejor escenario;
 *    −2 si el fondo tiene que poner más dinero (su plan era vender en 4 años).
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesElectrico(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const fuera = has(run, "cerrado");
  const piloto = has(run, "piloto");
  const entra = !fuera && !piloto;
  const cobra = has(run, "compensa") && has(run, "escenarios");
  const inv = run.terms.inversion ?? 0;
  const anticipo = run.terms.anticipo ?? 0;
  const headline = fuera
    ? "Forja se quedó fuera del eléctrico. La planta sigue llena de piezas de combustión, pero Aurora asignó las charolas a otro proveedor."
    : piloto ? "Forja entró con una celda piloto: aprende a soldar aluminio sin apostar la planta, aunque Aurora no le da el volumen grande."
      : cobra ? "Entraste al programa y, cuando Aurora se retrasó, el contrato cubrió el volumen que no llegó."
        : has(run, "absorbe") ? "Entraste al programa y absorbiste el retraso de Aurora: la relación quedó bien, el margen no."
          : has(run, "pausa") ? "Entraste al programa y frenaste la segunda fase cuando Aurora se retrasó: la línea no se quedó parada."
            : "Entraste al programa eléctrico, pero el retraso de Aurora llegó sin protección en el contrato.";
  const agreement: [string, string][] = fuera
    ? [["Programa eléctrico", "Fuera"], ["Planta", "Solo combustión"]]
    : [
        ["Inversión", `$${inv} M`],
        ["Herramental pagado por Aurora", anticipo ? `${anticipo}%` : "No"],
        ["Cómo se pagó", has(run, "fondo") ? "Aportación del fondo" : has(run, "deuda") ? "Crédito a 7 años" : has(run, "anticipo") ? "Anticipo y fases" : "Caja propia"],
        ...(entra ? [["Volumen mínimo en contrato", has(run, "escenarios") ? "Sí, por escrito" : "No"] as [string, string]] : []),
      ];
  const economics: [string, string][] = [
    ["Venta anual esperada", fuera ? "$0 M" : piloto ? "$40 M" : "$300 M desde 2028"],
    ["Inversión de Forja", fuera ? "$0 M" : `$${Math.round(inv * (1 - anticipo / 100))} M`],
  ];
  const kpi: RulesResult["kpi"] = [];
  let caja = 0;
  const cajaWhy: string[] = [];
  if (entra) { caja -= 5; cajaWhy.push("−5 por la línea nueva"); }
  if (piloto) { caja -= 1; cajaWhy.push("−1 por la celda piloto"); }
  if (has(run, "anticipo")) { caja += 3; cajaWhy.push("+3 porque Aurora paga el herramental por adelantado"); }
  if (has(run, "fondo")) { caja += 3; cajaWhy.push("+3 por la aportación del fondo"); }
  if (has(run, "pausa")) { caja += 2; cajaWhy.push("+2 por frenar la segunda fase"); }
  if (cobra) { caja += 2; cajaWhy.push("+2 por la compensación de volumen"); }
  if (caja) kpi.push({ key: "caja", delta: caja, why: `Regla: ${cajaWhy.join(", ")}.` });
  if (entra) kpi.push(run.trust >= 0
    ? { key: "clientes", delta: 3, why: "Forja entra al programa eléctrico de su cliente más grande y la relación queda firme." }
    : { key: "clientes", delta: 1, why: "Forja entra al programa, pero la relación con Aurora quedó tensa en la negociación." });
  if (piloto) kpi.push({ key: "clientes", delta: -1, why: "Aurora asigna el volumen grande a otro; Forja se queda con una parte chica." });
  if (fuera) kpi.push({ key: "clientes", delta: -3, why: "Aurora asigna el programa eléctrico a otro proveedor: Forja pierde lugar en la siguiente generación." });
  const m = (has(run, "absorbe") ? -2 : 0) + (has(run, "prisa") && entra ? -1 : 0);
  if (m) kpi.push({ key: "margen", delta: m, why: `Regla:${has(run, "absorbe") ? " −2 por absorber el retraso sin compensación" : ""}${has(run, "prisa") && entra ? " −1 por comprar equipo antes de tener la especificación" : ""}.` });
  let consejo = 0;
  const cWhy: string[] = [];
  if (has(run, "plan")) { consejo += 2; cWhy.push("+2 por presentar escenarios y plan de salida"); }
  if (has(run, "optimista")) { consejo -= 2; cWhy.push("−2 por mostrar solo el mejor escenario"); }
  if (has(run, "fondo")) { consejo -= 2; cWhy.push("−2 porque el fondo tuvo que poner más dinero"); }
  if (consejo) kpi.push({ key: "consejo", delta: consejo, why: `Regla: ${cWhy.join(", ")}.` });
  const risks = [
    ...(entra && !has(run, "escenarios") ? [{ id: "el-volumen", text: "El contrato no garantiza volumen: si Aurora vende menos eléctricos, la línea queda a medias.", owner: "daniela" as const }] : []),
    ...(has(run, "deuda") && !cobra && !has(run, "pausa") ? [{ id: "el-credito", text: "El crédito se paga desde ya y el volumen llega nueve meses tarde.", owner: "marcos" as const }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { inversion: inv, anticipo, fuera: fuera ? 1 : 0 } };
}

export const ELECTRICO: EpisodeSpec = {
  contract: 1, id: "electrico", version: "1.0.0", approval: "aprobado",
  company: "forja", industry: "Autopartes", title: "El programa eléctrico", subject: "Charolas de batería para el eléctrico de Aurora",
  from: "greg", counterpart: "greg", channel: "email", areas: ["estrategia", "finanzas", "clientes"], cast: ["greg", "marcos", "daniela", "ramon", "laura", "zertuche", "regina"],
  lesson: "finanzas", minutes: 7,
  concept: {
    title: "Una inversión grande se decide con escenarios, no con el mejor caso",
    text: "Cuando un cliente te pide invertir para crecer con él, el riesgo no es solo cuánto cuesta: es qué pasa si el volumen llega tarde o no llega. Pedir compromisos por escrito, invertir por fases y saber de antemano cómo te sales protege a la empresa sin dejar ir la oportunidad.",
    nota: "Antes de invertir, pregunta: ¿qué pasa si el cliente vende la mitad? ¿Y si arranca un año tarde? Si no tienes respuesta, todavía no estás listo para firmar.",
  },
  briefing: {
    message: [
      "Correo de Greg Holloway, Aurora Motors · 8:05",
      "«Queremos que Forja haga las charolas de batería de nuestro primer eléctrico. Venta estimada: $300 M al año desde 2028.»",
      "«Necesitamos su respuesta en tres semanas. Implica una línea nueva de soldadura de aluminio.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Venta anual estimada", "$300 M desde 2028"], ["Línea nueva", "≈ $420 M"], ["Plazo para responder", "3 semanas"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "volumen", label: "¿Qué tan seguro es el volumen?", keywords: ["volumen", "seguro", "garantiza", "compromiso", "demanda", "cuantos"], source: "daniela",
        answer: "Daniela: el volumen es un estimado de Aurora, no un compromiso. En otros programas eléctricos de la industria, el primer año se vendió entre 40% y 70% de lo estimado." },
      { id: "caja", label: "¿Podemos pagar la línea?", keywords: ["caja", "pagar", "credito", "deuda", "dinero", "financiar"], source: "marcos",
        answer: "Marcos: con caja propia no. Con crédito, la deuda pasa de 1.8 a 3.1 veces el EBITDA, arriba del límite que pide el banco (3.0)." },
      { id: "capacidad", label: "¿Sabemos hacer esa pieza?", keywords: ["sabemos", "capacidad", "aluminio", "soldadura", "tecnologia", "experiencia"], source: "ramon",
        answer: "Ramón: soldamos acero desde hace 25 años; aluminio nunca. Hay que entrenar a 40 personas y certificar el proceso, unos 8 meses." },
      { id: "herramental", label: "¿Quién paga el herramental?", keywords: ["herramental", "moldes", "quien paga", "anticipo", "adelantado"], source: "laura",
        answer: "Laura: en la industria es común que la armadora pague el herramental específico de su pieza. En nuestro contrato actual con Aurora lo pagamos nosotros." },
    ],
    unknowns: [
      { id: "rival", keywords: ["quien mas", "competencia", "otro proveedor", "otros invitados", "rival"], answer: "Ese dato no lo tienes: Aurora no dice a quién más le ofreció el programa." },
    ],
  },
  advisors: [
    { id: "marcos", role: "Director de Finanzas", personality: "Directo, cuida que los números aguanten un año malo.", interests: "No romper el límite de deuda con el banco.", relations: "Lleva la relación con el banco y el fondo.", knows: ["caja", "herramental"],
      view: [{ text: [
        "No me asusta invertir; me asusta invertir todo de golpe sobre un estimado.",
        "Si el volumen llega tarde, los intereses no esperan.",
      ] }] },
    { id: "daniela", role: "Directora Comercial", personality: "Conoce a Aurora por dentro.", interests: "No quedarse fuera de la siguiente generación de vehículos.", relations: "Habla con Greg cada semana.", knows: ["volumen"],
      view: [{ text: [
        "Si decimos que no, otro proveedor entra a Aurora por la puerta del eléctrico y después va por lo demás.",
        "Pero Greg también necesita que alguien le diga qué puede prometer de verdad.",
      ] }] },
    { id: "ramon", role: "Director de Operaciones", personality: "Práctico, conoce cada máquina.", interests: "Que la planta no cargue una línea que no sabe operar.", relations: "Tendría que entrenar a la gente.", knows: ["capacidad"],
      view: [{ text: [
        "El aluminio se comporta distinto. Si aprendemos con prisa, los primeros meses vamos a tirar mucha pieza.",
        "Se puede, pero no en tres semanas.",
      ] }] },
  ],
  terms: {
    inversion: { label: "Inversión", unit: "$M", initial: 0 },
    anticipo: { label: "Herramental pagado por Aurora", unit: "%", initial: 0 },
  },
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "La oferta", who: "greg", channel: "email",
      say: [{ text: [
        "Daniela te reenvía el correo de Greg con una línea: «Esto define dónde estamos en cinco años.»",
        "Marcos agrega abajo: «Y cuánto debemos.»",
      ] }],
      ask: "¿Cómo respondes a la oferta de Aurora?", freeText: true,
      strategies: [
        { id: "escenarios", text: "Interesarnos, pero pedir a Aurora el volumen mínimo por escrito y armar tres escenarios de demanda antes de comprometer la inversión.", cues: ["escenarios", "por escrito", "volumen minimo", "antes de", "compromiso"], flags: ["escenarios"],
          reply: [{ text: ["«Me parece serio. Le consigo un volumen mínimo firmado; no será el estimado completo, pero sí un piso.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "riesgos", level: 3, basis: "Convirtió un estimado en un compromiso y midió qué pasa si la demanda no llega." },
            { dim: "informacion", level: 3, basis: "Buscó datos de volumen, caja o capacidad antes de decidir.", when: { any: ["q:volumen", "q:caja", "q:capacidad", "a:daniela", "a:marcos", "a:ramon"] } },
          ] },
        { id: "firmar", text: "Decir que sí de inmediato y empezar a cotizar el equipo esta semana para no perder el lugar frente a otros proveedores.", cues: ["si de inmediato", "de inmediato", "cotizar", "equipo", "no perder", "rapido"], flags: ["prisa"], set: { inversion: 420 }, trust: 1,
          reply: [{ text: ["«Excelente, eso quería oír. Le mando la especificación final en un mes.»", "Ramón te escribe: «¿Vamos a comprar equipo sin la especificación?»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Aseguró el lugar, pero se comprometió antes de saber cuánto volumen y con qué especificación." }] },
        { id: "declinar", text: "Declinar con respeto: Forja no tiene la caja para una línea así y el mercado eléctrico todavía es incierto.", cues: ["declinar", "no tenemos", "incierto", "no entramos", "rechaz*"], flags: ["declina"], trust: -1,
          reply: [{ text: ["«Lo lamento. Le confieso que esperaba otra respuesta de ustedes.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "alternativas", level: 1, basis: "Cuidó la caja, pero cerró la puerta sin explorar formas más pequeñas de entrar." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Cómo se paga", who: "marcos", channel: "junta",
      say: [
        { when: { all: ["declina"] }, text: ["Marcos entra a tu oficina con Daniela.", "«Ya dijimos que no a la línea completa. ¿Hacemos algo o cerramos el tema?»"] },
        { when: { all: ["prisa"] }, text: ["Marcos trae tres cotizaciones de equipo.", "«Ya le dijimos que sí. Ahora hay que ver de dónde salen $420 M.»"] },
        { text: ["Greg mandó el volumen mínimo firmado: 60% del estimado.", "Marcos: «Con ese piso ya puedo armar el financiamiento. ¿Cómo lo pagamos?»"] },
      ],
      ask: "¿Cómo se paga la línea?", freeText: true,
      strategies: [
        { id: "anticipo", text: "Pedir que Aurora pague por adelantado el 30% del herramental y comprar el equipo en dos fases, la segunda solo si el volumen real llega.", cues: ["adelantado", "30%", "herramental", "dos fases", "fases", "volumen real"], requires: { none: ["declina"] }, set: { inversion: 420, anticipo: 30 }, flags: ["anticipo", "fases"],
          reply: [{ text: ["Greg: «El herramental lo podemos pagar nosotros, es lo normal. Las fases me preocupan un poco, pero lo entiendo.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Repartió el riesgo con el cliente y ligó la inversión al volumen real." }] },
        { id: "deuda", text: "Financiar toda la línea con un crédito bancario a siete años y comprar el equipo completo de una vez.", cues: ["credito", "banco", "siete anos", "7 anos", "de una vez", "deuda"], requires: { none: ["declina"] }, set: { inversion: 420 }, flags: ["deuda"],
          reply: [{ text: ["Marcos: «El banco lo aprueba, pero quedamos en 3.1 veces EBITDA. Un trimestre malo y nos llaman.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Consiguió el dinero, pero puso a la empresa al borde del límite de deuda sobre un volumen incierto." }] },
        { id: "fondo", text: "Pedir a Capital Sierra que aporte el capital de la línea, aunque eso aumente su participación y mueva su plan de venta.", cues: ["capital sierra", "fondo", "aporte", "aportacion", "participacion"], requires: { none: ["declina"] }, set: { inversion: 420 }, flags: ["fondo"],
          reply: [{ text: ["Regina: «Podemos, pero entonces la venta de la empresa se mueve dos años. Eso hay que explicarlo a nuestros inversionistas.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 2, basis: "Evitó la deuda, pero cargó el riesgo en el plan del accionista sin medir su costo." }] },
        { id: "piloto", text: "Ofrecer a Aurora una celda piloto de $60 M para aprender a soldar aluminio y crecer si el programa despega.", cues: ["piloto", "celda", "60", "aprender", "pequeno"], requires: { all: ["declina"] }, set: { inversion: 60 }, flags: ["piloto"], trust: 1,
          reply: [{ text: ["Greg: «No es lo que buscaba, pero me sirve tener un segundo proveedor que aprenda. Le doy una parte chica.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Encontró una forma pequeña de entrar sin apostar la empresa." }] },
        { id: "cerrar", text: "Cerrar el tema y enfocar la planta en las piezas de combustión, que hoy dejan margen.", cues: ["cerrar", "combustion", "enfocar", "olvidar", "no hacemos nada"], requires: { all: ["declina"] }, flags: ["cerrado"],
          reply: [{ text: ["Daniela: «Entendido. Solo te digo que el otro proveedor va a entrar a Aurora por aquí.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Protegió el margen de hoy y renunció a la siguiente generación sin un plan B." }] },
      ],
    },
    a3: {
      id: "a3", stage: "El retraso", who: "greg", channel: "llamada",
      say: [
        { when: { all: ["escenarios"] }, text: ["Greg llama un viernes en la tarde.", "«Malas noticias: el eléctrico arranca nueve meses tarde. El contrato tiene el volumen mínimo; sé que eso nos obliga a algo.»"] },
        { text: ["Greg llama un viernes en la tarde.", "«Malas noticias: el eléctrico arranca nueve meses tarde y el primer año va a ser 40% menos.»"] },
      ],
      ask: "Aurora retrasa el arranque nueve meses. ¿Qué haces?", freeText: true,
      strategies: [
        { id: "compensa", text: "Pedir la compensación por el volumen que no se tomará y que Aurora extienda el periodo para pagar su parte del herramental.", cues: ["compensacion", "volumen", "extender", "contrato", "clausula"], flags: ["compensa"], trust: -1,
          reply: [
            { when: { all: ["escenarios"] }, text: ["«El contrato es claro. Lo pagamos; no me gusta, pero es justo.»"] },
            { text: ["«No hay ninguna cláusula de volumen mínimo en lo que firmamos. No puedo pagar algo que no está escrito.»"] },
          ],
          next: [{ to: "a4" }],
          evidence: [
            { dim: "negociacion", level: 3, basis: "Hizo valer lo que se había firmado sin romper la relación.", when: { all: ["escenarios"] } },
            { dim: "negociacion", level: 1, basis: "Pidió una compensación que el contrato no respaldaba." },
          ] },
        { id: "pausa", text: "Frenar la segunda compra de equipo y usar la línea nueva para piezas de acero mientras llega el volumen del eléctrico.", cues: ["frenar", "segunda", "pausa", "usar la linea", "acero", "mientras"], flags: ["pausa"],
          reply: [{ text: ["Ramón: «La línea puede soldar acero con un ajuste. No es lo ideal, pero no se queda parada.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "adaptacion", level: 3, basis: "Ajustó el plan al cambio en lugar de esperar con la línea vacía." }] },
        { id: "absorber", text: "Absorber el retraso sin pedir nada para cuidar la relación con el cliente más grande.", cues: ["absorber", "sin pedir", "cuidar la relacion", "esperar", "no decir nada"], flags: ["absorbe"], trust: 1,
          reply: [{ text: ["«Se lo agradezco mucho. No lo voy a olvidar.»", "Marcos: «Los intereses tampoco lo van a olvidar.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Cargó todo el costo del retraso a Forja sin negociarlo." }] },
      ],
    },
    a4: {
      id: "a4", stage: "El consejo", who: "zertuche", channel: "junta",
      say: [
        { when: { any: ["cerrado", "piloto"] }, text: ["Sesión de consejo. Zertuche: «Me dicen que no entramos de lleno al eléctrico. Explíquenos por qué.»"] },
        { text: ["Sesión de consejo. Zertuche: «Es la inversión más grande en la historia de Forja. ¿Cómo la vamos a seguir?»"] },
      ],
      ask: "¿Cómo lo presentas al consejo?", freeText: true,
      strategies: [
        { id: "plan", text: "Presentar la decisión con los escenarios, el punto de equilibrio y qué haremos si el volumen o el mercado cambian.", cues: ["escenarios", "equilibrio", "si cambia", "plan de salida", "que haremos"], flags: ["plan"],
          reply: [{ text: ["Zertuche: «Así sí puedo defenderlo con los inversionistas. Revisemos los escenarios cada trimestre.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Dio al consejo el panorama completo, incluido lo que podría salir mal." }],
          commitments: [{ id: "el-revision", text: "Revisión trimestral de escenarios del programa eléctrico.", owner: "marcos" }] },
        { id: "optimista", text: "Presentar solo el mejor escenario para conseguir el respaldo rápido y no abrir dudas en la mesa.", cues: ["mejor escenario", "rapido", "respaldo", "no abrir dudas", "optimista"], flags: ["optimista"],
          reply: [{ text: ["Regina: «¿Y si no sale así? Prefiero saberlo hoy y no en seis meses.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 1, basis: "Escondió el riesgo para ganar tiempo; el consejo lo notó." }] },
      ],
    },
  },
  followUps: [
    { id: "el-herramental", when: { all: ["anticipo"] }, afterDays: 30, from: "marcos", subject: "Aurora pagó su parte del herramental",
      text: [{ text: ["Llegó el pago de Aurora por el 30% del herramental. La primera fase de equipo ya está cubierta sin tocar la línea de crédito."] }] },
    { id: "el-credito", when: { all: ["deuda"], none: ["pausa"] }, afterDays: 45, from: "marcos", subject: "Primer pago del crédito sin volumen",
      text: [{ text: ["Pagamos la primera mensualidad del crédito de la línea nueva. Todavía no sale una sola charola."] }] },
    { id: "el-fuera", when: { all: ["cerrado"] }, afterDays: 30, from: "daniela", subject: "Aurora asignó las charolas",
      text: [{ text: ["Aurora le dio las charolas de batería a otro proveedor. Ya los vi en la junta de proveedores."] }] },
    { id: "el-piloto", when: { all: ["piloto"] }, afterDays: 40, from: "ramon", subject: "Primeras piezas de aluminio",
      text: [{ text: ["La celda piloto sacó las primeras 200 charolas. Tiramos 12%, pero ya sabemos dónde."] }] },
  ],
  rules: "electrico-v1",
};

registerRules("electrico-v1", rulesElectrico);
