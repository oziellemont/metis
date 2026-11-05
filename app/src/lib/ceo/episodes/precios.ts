/**
 * Caso largo · Capítulo «Estabilizar» · Kúbit · «Subir precios».
 *
 * El precio de Kúbit no se mueve desde hace tres años y la nube subió 30%. Andrea propone subir precios a los
 * 1,200 clientes. Se decide cómo diseñar el aumento, cómo comunicarlo, qué hacer cuando los clientes grandes
 * reclaman y cómo se presenta al consejo. Entre 3 y 4 decisiones.
 *
 * Modelo (todo declarado):
 *  - Margen: +1 por cada 5 puntos de aumento (redondeado hacia abajo); −1 si se congela el aumento a quien reclame;
 *    +1 por recortar gasto de nube y consultores si no se sube.
 *  - Clientes: −3 si el aumento es parejo; −1 si es por segmento; −2 si el aviso llega por sorpresa; +1 si se avisa
 *    con 90 días y explicación; −2 si se mantiene sin excepciones ante los grandes; +1 con contratos multianuales.
 *  - Caja: +2 por contratos multianuales pagados por adelantado.
 *  - Equipo: −2 si se congelan contrataciones de ingeniería.
 *  - Consejo: +1 con datos de cancelación e ingreso neto; −1 si solo se muestra el ingreso.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

export function rulesPrecios(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const sube = !has(run, "nosube");
  const aum = run.terms.aumento ?? 0;
  const headline = !sube
    ? has(run, "congela") ? "No subiste precios: el margen se sostuvo congelando contrataciones de ingeniería." : "No subiste precios: recortaste gasto de nube y consultores para cuidar el margen."
    : has(run, "multianual") ? `Subiste ${aum}% y convertiste el reclamo de los grandes en contratos de varios años.`
      : has(run, "excepcion") ? `Subiste ${aum}%, pero congelaste el aumento a quien reclamó: el que más se quejó pagó menos.`
        : has(run, "firme") ? `Subiste ${aum}% sin excepciones. El ingreso subió y algunos clientes grandes se fueron.`
          : `Subiste ${aum}% a la base.`;
  const agreement: [string, string][] = sube
    ? [["Aumento", `${aum}%`], ["A quién", has(run, "segmenta") ? "Planes viejos con más uso" : "Todos los clientes"], ["Aviso", has(run, "aviso") ? "90 días con explicación" : "Al día siguiente"]]
    : [["Aumento", "0%"], ["Cómo se cuida el margen", has(run, "congela") ? "Congelar contrataciones" : "Recorte de nube y consultores"]];
  const economics: [string, string][] = [
    ["Ingreso mensual", sube ? `$${(42 * (1 + aum / 100)).toFixed(1)} M (antes $42 M)` : "$42 M"],
    ["Clientes que pagan el aumento", sube ? (has(run, "segmenta") ? "≈ 480 de 1,200" : "1,200") : "Ninguno"],
  ];
  const kpi: RulesResult["kpi"] = [];
  const m = Math.floor(aum / 5) - (has(run, "excepcion") ? 1 : 0) + (has(run, "recorte") ? 1 : 0) + (has(run, "congela") ? 1 : 0);
  if (m) kpi.push({ key: "margen", delta: m, why: sube ? `Regla: +1 por cada 5 puntos de aumento (${aum}%)${has(run, "excepcion") ? ", −1 por congelar el aumento a quien reclamó" : ""}.` : "Regla: +1 por recortar gasto para compensar el alza de la nube." });
  let cl = 0;
  const w: string[] = [];
  if (has(run, "parejo")) { cl -= 3; w.push("−3 por un aumento parejo a todos"); }
  if (has(run, "segmenta")) { cl -= 1; w.push("−1 por el aumento a un segmento"); }
  if (has(run, "sorpresa")) { cl -= 2; w.push("−2 por avisar de un día para otro"); }
  if (has(run, "aviso")) { cl += 1; w.push("+1 por avisar con 90 días y explicar qué mejora"); }
  if (has(run, "firme")) { cl -= 2; w.push("−2 por no escuchar a los clientes grandes"); }
  if (has(run, "multianual")) { cl += 1; w.push("+1 por cerrar contratos multianuales"); }
  if (cl) kpi.push({ key: "clientes", delta: cl, why: `Regla: ${w.join(", ")}.` });
  if (has(run, "multianual")) kpi.push({ key: "caja", delta: 2, why: "Los contratos de varios años se pagan por adelantado." });
  if (has(run, "congela")) kpi.push({ key: "equipo", delta: -2, why: "Ingeniería se queda sin las contrataciones prometidas y carga más trabajo." });
  if (has(run, "plan")) kpi.push({ key: "consejo", delta: 1, why: "El consejo ve el ingreso neto después de cancelaciones, no solo el aumento." });
  if (has(run, "optimista")) kpi.push({ key: "consejo", delta: -1, why: "El consejo pide las cancelaciones que no venían en la presentación." });
  const risks = [
    ...(has(run, "excepcion") ? [{ id: "pr-precedente", text: "Los clientes aprendieron que reclamar baja el precio.", owner: "bruno" as const }] : []),
    ...(has(run, "parejo") && !has(run, "multianual") ? [{ id: "pr-pequenos", text: "Los clientes pequeños, que casi no usan la plataforma, son los que más cancelan.", owner: "renata" as const }] : []),
  ];
  return { headline, agreement, economics, kpi, risks, data: { aumento: aum } };
}

export const PRECIOS: EpisodeSpec = {
  contract: 1, id: "precios", version: "1.0.0", approval: "aprobado",
  company: "kubit", industry: "Software", title: "Subir precios", subject: "Aumento de precio a la base de clientes",
  from: "andrea", counterpart: "renata", channel: "email", areas: ["finanzas", "clientes", "estrategia"], cast: ["andrea", "renata", "bruno", "emilio", "ibarra", "valeria"],
  lesson: "finanzas", minutes: 6,
  concept: {
    title: "Subir precios es una decisión de valor, no solo de números",
    text: "Un aumento de precio cambia lo que cada cliente piensa de lo que recibe. Si lo diseñas por segmento, lo avisas con tiempo y explicas qué mejora, la mayoría se queda. Si llega parejo y por sorpresa, se van primero los que menos valor reciben, y el consejo ve más ingreso que el que de verdad entra.",
    nota: "Mide el ingreso neto después de cancelaciones, no el aumento en el papel.",
  },
  briefing: {
    message: [
      "Correo de Andrea Quiroga, Finanzas · 9:30",
      "«El precio no se mueve desde hace tres años y la nube subió 30%. Si no hacemos algo, el margen baja dos puntos este año.»",
      "«Propongo subir precios. Necesito tu decisión antes del cierre de mes.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Clientes", "1,200"], ["Ingreso mensual", "$42 M"], ["Último aumento", "Hace 3 años"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "segmentos", label: "¿Quién usa más la plataforma?", keywords: ["segmento", "quien usa", "uso", "planes", "clientes grandes"], source: "andrea",
        answer: "Andrea: 480 clientes en planes viejos usan el triple que el resto y pagan lo mismo. Los 40 más grandes son 30% del ingreso." },
      { id: "cancelacion", label: "¿Cuántos se irían?", keywords: ["cancel*", "se irian", "irse", "perder clientes", "churn"], source: "renata",
        answer: "Renata: en el último aumento de un competidor, 8% de sus clientes se fue en tres meses; casi todos eran pequeños que casi no usaban el sistema." },
      { id: "competencia", label: "¿Cuánto cobra la competencia?", keywords: ["competencia", "cobra", "mercado", "precio de otros"], source: "bruno",
        answer: "Bruno: los dos competidores principales cobran entre 15% y 25% más por un plan parecido." },
      { id: "producto", label: "¿Qué mejoró el producto?", keywords: ["mejoro", "producto", "funciones", "nuevo", "valor"], source: "emilio",
        answer: "Emilio: en tres años agregamos timbrado automático, la app móvil y la conexión con cinco bancos. Nadie lo ha comunicado como mejora." },
    ],
    unknowns: [
      { id: "reaccion", keywords: ["que van a decir", "como reaccionan", "reaccion exacta"], answer: "Ese dato no lo tienes: nadie sabe cómo va a reaccionar cada cliente hasta que se avise." },
    ],
  },
  advisors: [
    { id: "andrea", role: "Directora de Finanzas", personality: "Precisa, piensa en el margen del año.", interests: "Recuperar los dos puntos que se llevó la nube.", relations: "Lleva el modelo de ingresos.", knows: ["segmentos"],
      view: [{ text: ["No tenemos que subirle a todos igual. Hay clientes que pagan muy poco por lo que usan.", "Lo que no podemos es dejar pasar otro año."] }] },
    { id: "renata", role: "Directora de Éxito del Cliente", personality: "Protege a los clientes como propios.", interests: "Que nadie se vaya por algo que se pudo explicar.", relations: "Habla con los clientes grandes cada mes.", knows: ["cancelacion", "producto"],
      view: [{ text: ["Los clientes aguantan un aumento; lo que no aguantan es enterarse de un día para otro.", "Si les explicamos lo que ya reciben, la conversación cambia."] }] },
    { id: "bruno", role: "Director Comercial", personality: "Mide todo en ventas.", interests: "Que el aumento no le complique las ventas nuevas.", relations: "Conoce los precios del mercado.", knows: ["competencia"],
      view: [{ text: ["Estamos baratos contra el mercado. El riesgo no es el precio, es cómo lo digamos.", "Y los grandes van a querer negociar, eso seguro."] }] },
  ],
  terms: { aumento: { label: "Aumento", unit: "%", initial: 0 } },
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "El diseño", who: "andrea", channel: "email",
      say: [{ text: ["Andrea trae el modelo abierto en la pantalla.", "«Puedo correr el número que me digas. ¿Cómo lo hacemos?»"] }],
      ask: "¿Cómo diseñas el aumento?", freeText: true,
      strategies: [
        { id: "segmentar", text: "Subir 12% solo a los planes viejos que más usan la plataforma, y dejar igual a los clientes pequeños.", cues: ["segment*", "12%", "planes viejos", "mas usan", "pequenos igual"], flags: ["segmenta"], set: { aumento: 12 },
          reply: [{ text: ["«Me gusta: cobra a quien recibe más. Recupera el margen casi completo.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "alternativas", level: 3, basis: "Diseñó el aumento según el valor que recibe cada cliente." },
            { dim: "informacion", level: 3, basis: "Usó datos de uso, cancelación o competencia antes de fijar el número.", when: { any: ["q:segmentos", "q:cancelacion", "q:competencia", "a:andrea", "a:renata", "a:bruno"] } },
          ] },
        { id: "parejo", text: "Subir 15% a todos los clientes por igual: es más simple de explicar y recupera el margen de una vez.", cues: ["15%", "todos", "por igual", "parejo", "simple"], flags: ["parejo"], set: { aumento: 15 },
          reply: [{ text: ["«Recupera el margen, sí. Renata me pregunta si los pequeños lo van a aguantar.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Buscó simplicidad sin medir quién se iría con un aumento igual para todos." }] },
        { id: "nosubir", text: "No subir precios este año y compensar el alza de la nube con recortes de gasto interno.", cues: ["no subir", "recortes", "gasto interno", "compensar", "este ano no"], flags: ["nosube"],
          reply: [{ text: ["«Se puede, pero los recortes tienen que salir de algún lado. ¿De dónde?»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "alternativas", level: 1, basis: "Evitó el conflicto con clientes y trasladó el costo a la operación." }] },
      ],
    },
    a2: {
      id: "a2", stage: "El aviso", who: "renata", channel: "junta",
      say: [
        { when: { all: ["nosube"] }, text: ["Andrea y Emilio en tu oficina.", "«Si no subimos, hay que recortar. Las dos opciones duelen.»"] },
        { text: ["Renata pide cinco minutos.", "«Antes de mandar nada, ¿cómo se lo vamos a decir a los clientes?»"] },
      ],
      ask: "¿Qué sigue?", freeText: true,
      strategies: [
        { id: "aviso", text: "Avisar con 90 días, explicar qué mejoró el producto en tres años y ofrecer contrato anual al precio actual a quien lo firme antes.", cues: ["90 dias", "explicar", "mejoro", "contrato anual", "aviso"], requires: { none: ["nosube"] }, flags: ["aviso"], trust: 1,
          reply: [{ text: ["Renata: «Así sí. Mi equipo llama a los 40 grandes antes de que llegue el correo.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Planeó el aviso con tiempo, explicación y una salida para el cliente." }] },
        { id: "sorpresa", text: "Mandar un correo general mañana con el nuevo precio, efectivo desde el siguiente cobro.", cues: ["correo", "manana", "siguiente cobro", "efectivo", "general"], requires: { none: ["nosube"] }, flags: ["sorpresa"], trust: -1,
          reply: [{ text: ["Renata: «Va a llover. Prepara al equipo de soporte.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Cambió el precio sin tiempo para que el cliente lo procesara." }] },
        { id: "recorte", text: "Recortar consultores externos y renegociar el contrato de nube a tres años.", cues: ["consultores", "nube", "renegociar", "tres anos", "proveedor"], requires: { all: ["nosube"] }, flags: ["recorte"],
          reply: [{ text: ["Emilio: «Los consultores ayudaban con la integración de Ferrán, pero se puede.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "alternativas", level: 2, basis: "Recortó gasto que no tocaba al equipo central." }] },
        { id: "congela", text: "Congelar las contrataciones de ingeniería del semestre.", cues: ["congelar", "contrataciones", "ingenieria", "semestre", "no contratar"], requires: { all: ["nosube"] }, flags: ["congela"],
          reply: [{ text: ["Emilio: «Entonces la hoja de ruta se mueve seis meses. Se lo digo al equipo.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "consecuencias", level: 1, basis: "Cuidó el margen con el equipo que ya estaba cargado." }] },
      ],
    },
    a3: {
      id: "a3", stage: "Los grandes reclaman", who: "bruno", channel: "llamada",
      say: [
        { when: { all: ["sorpresa"] }, text: ["Bruno te llama alterado.", "«Doce de los 40 grandes amenazan con irse. Se enteraron por correo y están furiosos.»"] },
        { text: ["Bruno te llama.", "«Seis de los 40 grandes quieren negociar. Dicen que el aumento no les cuadra en su presupuesto.»"] },
      ],
      ask: "Los clientes grandes reclaman. ¿Qué haces?", freeText: true,
      strategies: [
        { id: "multianual", text: "Negociar caso por caso: mantener el aumento, pero con un descuento si firman contrato de dos o tres años pagado por adelantado.", cues: ["caso por caso", "dos o tres anos", "multianual", "por adelantado", "descuento si firman"], flags: ["multianual"], trust: 1,
          reply: [{ text: ["«Cuatro ya firmaron a tres años. Los otros lo están pensando.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "negociacion", level: 3, basis: "Cambió descuento por compromiso: el cliente paga menos y se queda más tiempo." }] },
        { id: "excepcion", text: "Congelar el aumento para todos los que reclamen, para no perder a ningún cliente grande.", cues: ["congelar", "los que reclamen", "excepcion", "no perder", "todos"], flags: ["excepcion"],
          reply: [{ text: ["«Ya se corrió la voz. Ahora hay 60 clientes pidiendo la misma excepción.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Premió al que reclamó y castigó al que pagó sin decir nada." }] },
        { id: "firme", text: "Mantener el precio sin excepciones: si un cliente se va por 12%, no valoraba el producto.", cues: ["sin excepciones", "mantener", "firme", "si se va", "no valoraba"], flags: ["firme"], trust: -1,
          reply: [{ text: ["«Dos de los grandes ya pidieron sus datos para migrar.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "Sostuvo el precio, pero no exploró qué le servía a cada cliente." }] },
      ],
    },
    a4: {
      id: "a4", stage: "El consejo", who: "ibarra", channel: "junta",
      say: [{ text: ["Sesión de consejo. Rodrigo Ibarra: «¿Cómo nos fue con el precio?»"] }],
      ask: "¿Cómo lo presentas al consejo?", freeText: true,
      strategies: [
        { id: "plan", text: "Presentar el ingreso neto después de cancelaciones, quién se fue y por qué, y qué haremos el próximo trimestre.", cues: ["ingreso neto", "cancelaciones", "quien se fue", "por que", "proximo trimestre"], flags: ["plan"],
          reply: [{ text: ["Ibarra: «Así me sirve. Prefiero el número real que el bonito.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Reportó el resultado completo, incluidas las pérdidas." }],
          commitments: [{ id: "pr-seguimiento", text: "Reporte trimestral de ingreso neto y cancelaciones.", owner: "andrea" }] },
        { id: "optimista", text: "Presentar el aumento de ingreso mensual y dejar las cancelaciones para el siguiente reporte.", cues: ["aumento de ingreso", "dejar", "siguiente reporte", "solo ingreso"], flags: ["optimista"],
          reply: [{ text: ["Valeria: «¿Y cuántos clientes perdimos? Eso también es parte del número.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "coherencia", level: 1, basis: "Mostró solo la parte buena del resultado." }] },
      ],
    },
  },
  followUps: [
    { id: "pr-firmas", when: { all: ["multianual"] }, afterDays: 30, from: "andrea", subject: "Contratos multianuales firmados",
      text: [{ text: ["Nueve clientes grandes firmaron a dos o tres años. Entraron $11 M por adelantado."] }] },
    { id: "pr-excepciones", when: { all: ["excepcion"] }, afterDays: 20, from: "bruno", subject: "Más clientes piden excepción",
      text: [{ text: ["Ya son 85 clientes pidiendo que les congelemos el precio. Dicen que a otros sí se los hicimos."] }] },
    { id: "pr-salidas", when: { all: ["firme"] }, afterDays: 25, from: "renata", subject: "Dos clientes grandes migraron",
      text: [{ text: ["Dos de los 40 grandes ya migraron con la competencia. Juntos eran $1.6 M al mes."] }] },
    { id: "pr-ruta", when: { all: ["congela"] }, afterDays: 30, from: "emilio", subject: "La hoja de ruta se movió",
      text: [{ text: ["Sin las contrataciones, la integración con Ferrán se va al siguiente semestre. Bruno ya lo sabe."] }] },
  ],
  rules: "precios-v1",
};

registerRules("precios-v1", rulesPrecios);
