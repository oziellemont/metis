/**
 * Piloto P0-C · Crisis operativa y ética · «Lote L-2291» (Botanas Cumbre).
 *
 * Un proveedor de sazonador avisa que un lote pudo contaminarse con cacahuate, un alérgeno que la etiqueta de
 * «Picositas» no declara. El producto ya está en anaquel. Hay tres obligaciones no negociables (retirar el
 * producto, avisar a la autoridad sanitaria y advertir a las personas alérgicas). No son opciones: el cierre
 * dice si se cumplieron y las reglas cargan la consecuencia. Lo que sí se decide es CÓMO cumplirlas y qué
 * más hacer: contener, avisar, comunicar, pagar y corregir la causa. Entre 4 y 5 decisiones.
 *
 * Borrador para aprobación de Oziel. Datos nuevos (marcados en docs/episodios/p0c.md): lote de 18,000 bolsas
 * en 140 tiendas, costo del retiro $1.6 M, 3 quejas, laboratorio en 48 h y probabilidad de reacción (25%).
 *
 * Modelo (todo declarado):
 *  - Retiro total: $1.6 M (producto + logística). Parcial: $0.4 M. Si se reclama al proveedor, recupera la mitad.
 *  - Caja: 1 punto por cada $0.5 M que paga Cumbre.
 *  - Consejo: −3 por cada obligación incumplida. Clientes: +2 si se cumplen las tres; −2 por cada una incumplida.
 *  - Reacción alérgica (azar reproducible, 25%): solo ocurre si el producto siguió en anaquel; sube las sanciones.
 */
import type { EpisodeRun, EpisodeSpec } from "./contracts";
import { holds } from "./engine";
import { registerRules, type RulesResult } from "./rules";

export const AL = { lote: 18000, tiendas: 140, retiroTotal: 1.6, retiroParcial: 0.4, recupera: 0.5 } as const;
const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);
const money = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(n).toFixed(1)} M`;

/** Si el producto siguió en anaquel tras la primera hora (abre la puerta a la reacción alérgica). */
const expuesto = (run: Pick<EpisodeRun, "flags">) => !has(run, "retiro_inmediato");
/** La reacción solo cuenta si hubo exposición. */
export const reaccionOcurre = (run: Pick<EpisodeRun, "flags">) => has(run, "reaccion") && expuesto(run);

export function deriveAlergeno(run: Pick<EpisodeRun, "flags" | "terms" | "trust">): Record<string, number> {
  const ob = ALERGENO.obligations!.filter((o) => holds(run, o.met)).length;
  return { cumplidas: ob, expuesto: expuesto(run) ? 1 : 0 };
}

export function economicsAlergeno(run: Pick<EpisodeRun, "flags">) {
  const total = has(run, "retiro") && !has(run, "recorta");
  const costo = total ? AL.retiroTotal : has(run, "parcial") || has(run, "recorta") ? AL.retiroParcial : 0;
  const recuperado = has(run, "reclamo") ? Math.round(costo * AL.recupera * 10) / 10 : 0;
  const neto = Math.round((costo - recuperado) * 10) / 10;
  return { total, costo, recuperado, neto };
}

export function rulesAlergeno(spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const obs = (spec.obligations ?? []).map((o) => ({ ...o, ok: holds(run, o.met) }));
  const fallas = obs.filter((o) => !o.ok).length;
  const x = economicsAlergeno(run);
  const reac = reaccionOcurre(run);
  const headline = fallas === 0
    ? reac ? "Cumpliste las tres obligaciones, pero una persona alérgica alcanzó a consumir el producto. Está estable."
      : "Cumpliste las tres obligaciones: el producto salió del anaquel, la autoridad lo supo a tiempo y las personas alérgicas fueron advertidas."
    : fallas === 1 ? `Una obligación no se cumplió: ${obs.find((o) => !o.ok)!.text.toLowerCase()}`
      : `${fallas} de las 3 obligaciones no se cumplieron. La crisis deja de ser del producto y pasa a ser de la empresa.`;

  const agreement: [string, string][] = [
    ["Contención", has(run, "retiro_inmediato") ? (has(run, "recorta") ? "Retiro total el primer día, recortado después a 12 tiendas" : "Retiro total el primer día") : has(run, "retiro_tarde") ? "Retiro total, un día tarde" : has(run, "parcial") ? "Retiro en 12 tiendas" : "Producto en anaquel esperando al laboratorio"],
    ["Autoridad", has(run, "aviso") ? "Avisada el primer día" : has(run, "aviso_tarde") ? "Avisada con el resultado del laboratorio" : "Sin aviso"],
    ["Comunicación", has(run, "alerta_publica") ? "Alerta pública con el alérgeno y reembolso" : has(run, "minimiza") ? "«Retiro preventivo por calidad», sin mencionar el alérgeno" : "Solo a las cadenas"],
  ];
  const economics: [string, string][] = [
    ["Costo del retiro", x.costo ? money(-x.costo) : "Sin retiro"],
    ...(x.recuperado ? [["Recuperado del proveedor (50%)", money(x.recuperado)] as [string, string]] : []),
    ["Lo que paga Cumbre", money(-x.neto)],
  ];
  const kpi: RulesResult["kpi"] = [];
  if (x.neto > 0) kpi.push({ key: "caja", delta: -Math.max(1, Math.round(x.neto / 0.5)), why: `El retiro le cuesta a Cumbre ${money(-x.neto)}. Regla: 1 punto por cada $0.5 M.` });
  if (fallas === 0) kpi.push({ key: "clientes", delta: 2, why: "Cadenas y consumidores ven a una empresa que avisó primero y retiró todo." });
  else kpi.push({ key: "clientes", delta: -2 * fallas - (reac ? 2 : 0), why: `${fallas === 1 ? "Una obligación incumplida" : `${fallas} obligaciones incumplidas`}${reac ? " y una reacción alérgica con producto que seguía en anaquel" : ""}. Regla: −2 por cada una.` });
  if (fallas > 0) kpi.push({ key: "consejo", delta: -3 * fallas, why: `El consejo responde por las obligaciones de seguridad y ley. Regla: −3 por cada obligación incumplida.` });
  if (has(run, "auditoria")) kpi.push({ key: "equipo", delta: 1, why: "La planta ve que se corrige la causa, no que se busca culpable." });
  if (has(run, "culpar")) kpi.push({ key: "equipo", delta: -2, why: "Se culpó en público a una persona: la próxima vez nadie va a reportar a tiempo." });

  const commitments = [
    ...(has(run, "alerta_publica") ? [{ id: "al-linea", text: "Línea de atención y reembolso para quien compró el lote L-2291.", owner: "hector" }] : []),
    ...(has(run, "reclamo") ? [{ id: "al-reclamo", text: "Reclamo formal al proveedor de sazonador por el 50% del costo.", owner: "lucia" }] : []),
  ];
  const risks = [
    ...(!obs[1].ok ? [{ id: "al-autoridad", text: "La autoridad sanitaria puede suspender la línea al enterarse por terceros.", owner: "ceo" }] : []),
    ...(has(run, "minimiza") ? [{ id: "al-confianza", text: "Si se sabe que el aviso ocultó el alérgeno, el daño a la marca es mayor que el retiro.", owner: "ceo" }] : []),
    ...(has(run, "cambio_proveedor") ? [{ id: "al-abasto", text: "Cambiar de proveedor de golpe deja la línea sin sazonador dos semanas.", owner: "javier" }] : []),
  ];
  const luck = reac
    ? "Fuera de tu control: una persona alérgica compró el producto en esas horas. Que ocurriera fue mala suerte; que el producto siguiera en anaquel, no."
    : has(run, "reaccion") ? "Una persona alérgica compró el producto, pero ya no estaba en anaquel. Retirar desde la primera hora evitó la reacción."
      : null;
  return { headline, agreement, economics, kpi, commitments, risks, luck, data: { fallas, neto: x.neto, reaccion: reac ? 1 : 0 } };
}

export const ALERGENO: EpisodeSpec = {
  contract: 1, id: "alergeno", version: "0.1.0", approval: "borrador",
  company: "cumbre", industry: "Alimentos y botanas", title: "Lote L-2291", subject: "Posible alérgeno no declarado en Picositas",
  from: "javier", counterpart: "sofia", channel: "llamada", areas: ["etica", "operacion", "comunicacion"], cast: ["javier", "lucia", "sofia", "carla", "mariana"],
  lesson: "crisis", minutes: 7,
  concept: {
    title: "En una crisis, las obligaciones no se negocian: se cumplen primero y se decide el resto",
    text: "Retirar el producto, avisar a la autoridad y advertir a las personas alérgicas no eran opciones a comparar: eran el piso. Esperar a tener certeza parece prudente, pero en seguridad alimentaria la duda ya es razón para actuar. Lo que sí era tuyo decidir era cómo hacerlo: qué tan rápido, con qué voz, quién paga y cómo evitar que se repita.",
    nota: "Personas primero, hechos después y una sola voz. Lo que es de seguridad o de ley no se pone en la balanza contra el costo.",
  },
  obligations: [
    { id: "retiro", text: "Retirar del anaquel todo el lote que puede tener el alérgeno", met: { all: ["retiro"], none: ["recorta"] } },
    { id: "autoridad", text: "Avisar a la autoridad sanitaria en cuanto se conoce el riesgo", met: { all: ["aviso"] } },
    { id: "alergicos", text: "Advertir con claridad a las personas alérgicas: qué lote, qué riesgo y qué hacer", met: { all: ["alerta_publica"] } },
  ],
  briefing: {
    message: [
      "Mensaje de voz · 0:52",
      "«Jefe, perdón la hora. Nos habló el proveedor del sazonador de chile: el lote que nos mandó el 3 se procesó en una línea donde también mueven cacahuate, y no limpiaron bien. Puede traer trazas.»",
      "«Con ese sazonador hicimos el lote L-2291 de Picositas. Ya está en las tiendas. La etiqueta no dice cacahuate. Ya tenemos tres quejas de clientes que dicen que les supo raro.»",
      "«El laboratorio tarda 48 horas en confirmar. Usted dígame qué hacemos.»",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["Producto", "Picositas, lote L-2291"], ["Riesgo", "Trazas de cacahuate no declaradas"], ["Confirmación de laboratorio", "48 horas"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "obligacion", label: "Obligación legal", keywords: [], source: "datos", critical: true,
        answer: "Un alérgeno no declarado en la etiqueta obliga a retirar el producto, avisar a la autoridad sanitaria y advertir a los consumidores, aunque el laboratorio no haya confirmado." },
      { id: "riesgo", label: "Riesgo para la salud", keywords: [], source: "datos", critical: true,
        answer: "En una persona alérgica al cacahuate, unas trazas pueden causar una reacción grave en minutos." },
      { id: "alcance", label: "¿Dónde está el lote y cuánto es?", keywords: ["donde", "cuanto", "lote", "tiendas", "bolsas", "alcance", "distribucion"], source: "javier",
        answer: "Javier: son 18,000 bolsas. 70% ya está en las 140 tiendas de SuperNorte y el resto en nuestra bodega y en tránsito." },
      { id: "costo", label: "¿Cuánto cuesta retirarlo?", keywords: ["costo", "cuesta", "retirar", "retiro", "dinero", "caja", "pagar"], source: "lucia",
        answer: "Lucía: retirar todo el lote cuesta unos $1.6 M entre producto y logística. Retirarlo solo de las 12 tiendas con quejas, unos $0.4 M." },
      { id: "quejas", label: "¿Qué dicen las quejas?", keywords: ["quejas", "clientes", "dicen", "supo", "reaccion", "alergia", "enfermo"], source: "javier",
        answer: "Javier: tres quejas por sabor raro, de 3 tiendas distintas. Ninguna habla de una reacción alérgica, por ahora." },
      { id: "proveedor", label: "¿Qué sabemos del proveedor?", keywords: ["proveedor", "sazonador", "contrato", "historial", "culpa", "reclamo"], source: "lucia",
        answer: "Lucía: es proveedor desde hace 6 años, sin incidentes previos. El contrato le permite a Cumbre reclamar los costos de un retiro causado por su materia prima." },
    ],
    unknowns: [
      { id: "resultado", keywords: ["resultado", "laboratorio dice", "confirmado", "si tiene", "positivo", "negativo", "es seguro que", "seguro que tiene", "con certeza si", "ya encontro", "ya salio", "ya hay resultado", "ya confirmo", "laboratorio ya", "cuando sabremos", "cuando sale el", "cuando llega el resultado", "ya se sabe si"], answer: "Ese dato todavía no existe: el laboratorio tarda 48 horas. Cualquier decisión de hoy se toma sin saberlo." },
    ],
  },
  advisors: [
    { id: "lucia", role: "Directora de Finanzas", personality: "Precisa, cuida la caja.", interests: "Que el costo sea el mínimo necesario y se recupere lo posible.", relations: "Revisa el contrato del proveedor.", knows: ["costo", "proveedor"],
      view: [{ text: [
        "Te digo el número: el retiro completo son $1.6 M. Duele, pero se puede.",
        "Lo que no podemos pagar es que esto salga en las noticias y que se sepa que lo supimos antes. Y el contrato nos deja reclamarle al proveedor.",
      ] }] },
    { id: "javier", role: "Gerente de Planta", personality: "Práctico, de pocas palabras.", interests: "Que nadie salga lastimado y que la planta no pague los platos rotos.", relations: "Habló con el proveedor.", knows: ["alcance", "quejas"],
      view: [{ text: [
        "Lo que está en bodega y en tránsito lo detengo en una hora. Lo de las tiendas depende de SuperNorte.",
        "Y jefe: no fue la gente de la línea. El sazonador llegó así.",
      ] }] },
    { id: "carla", role: "Consejera independiente", personality: "Rigurosa, conoce de gobierno corporativo.", interests: "Que la empresa cumpla y que el consejo se entere por ti.", relations: "Preside el comité de riesgos.", knows: ["alcance"],
      view: [{ text: [
        "En estos casos el consejo no te va a juzgar por el costo del retiro. Te va a juzgar por cuánto tardaste y si dijiste la verdad.",
        "Mándame una nota hoy, aunque sea de tres líneas.",
      ] }] },
  ],
  chance: [{ flag: "reaccion", p: 0.25, label: "Una persona alérgica compra el producto en las primeras horas" }],
  terms: {
    cumplidas: { label: "Obligaciones cumplidas", unit: "de 3", initial: 0 },
    expuesto: { label: "Producto en anaquel", unit: "", initial: 1 },
  },
  start: "a1",
  nodes: {
    a1: {
      id: "a1", stage: "Contener", who: "javier", channel: "llamada",
      say: [{ text: ["Javier espera en la línea. Son las 23:40."] }],
      ask: "¿Qué haces con el producto en la primera hora?", freeText: true,
      strategies: [
        { id: "retiro_total", text: "Retirar todo el lote L-2291 hoy mismo: detener bodega y tránsito, y pedir a SuperNorte que lo saque de las 140 tiendas.", cues: ["todo el", "todo lo", "toda la", "todas las", "todos los", "complet*", "entero", "entera", "140", "total*", "sin excepcion", "de inmediato todo"], flags: ["retiro", "retiro_inmediato"],
          reply: [{ text: ["«Va, jefe. Detengo bodega y tránsito ahorita.»", "«Para las tiendas necesito que alguien hable con SuperNorte. A esta hora solo contesta Sofía.»"] }],
          next: [{ to: "a2" }],
          evidence: [
            { dim: "riesgos", level: 3, basis: "Actuó con la duda: en seguridad alimentaria, el riesgo posible ya obliga a retirar." },
            { dim: "informacion", level: 3, basis: "Dimensionó el lote antes de ordenar el retiro.", when: { any: ["q:alcance", "a:javier"] } },
          ] },
        { id: "parcial", text: "Retirar solo de las 12 tiendas con quejas mientras llega el laboratorio; si sale positivo, retirar el resto.", cues: ["solo", "12", "queja*", "afectad*", "reportaron", "reclamos", "donde hubo", "el resto", "lo demas"], flags: ["parcial"],
          reply: [{ text: ["«Ok, jefe. Las 12 tiendas mañana temprano.»", "«El resto sigue en anaquel hasta el resultado.»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Contuvo una parte, pero dejó en anaquel producto que podía tener el alérgeno." }] },
        { id: "esperar_lab", text: "Esperar las 48 horas del laboratorio: no quiero alarmar a nadie sin certeza.", flags: ["espera_lab"],
          reply: [{ text: ["«Como diga, jefe.»", "Javier se queda callado. «Nomás que si alguien es alérgico…»"] }],
          next: [{ to: "a2" }],
          evidence: [{ dim: "riesgos", level: 0, basis: "Puso la certeza por encima de la seguridad: el producto siguió en anaquel 48 horas." }] },
      ],
    },
    a2: {
      id: "a2", stage: "Autoridad", who: "carla", channel: "llamada",
      say: [
        { when: { all: ["reaccion"], none: ["retiro_inmediato"] }, text: ["7:10. Carla te llama.", "«Me escribió un conocido: su hija tuvo una reacción alérgica después de comer Picositas. Está estable en el hospital. ¿Ya avisaron a la autoridad sanitaria?»"] },
        { text: ["7:30. Carla te llama.", "«Javier me contó del lote. ¿Ya avisaron a la autoridad sanitaria?»"] },
      ],
      ask: "La consejera pregunta por la autoridad. ¿Qué haces?", freeText: true,
      strategies: [
        { id: "avisar_hoy", text: "Avisar hoy a la autoridad sanitaria con lo que sabemos: el riesgo, el lote, lo que ya retiramos y cuándo llega el laboratorio.", flags: ["aviso"],
          reply: [{ text: ["«Bien. Mándame copia.»", "«Y prepárate: te van a pedir el plan de retiro por escrito.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Informó a la autoridad con la duda, sin esperar a tener todas las respuestas." }] },
        { id: "avisar_lab", text: "Avisar cuando tengamos el resultado del laboratorio, para no reportar algo que tal vez no es.", flags: ["aviso_tarde"],
          reply: [{ text: ["«No estoy de acuerdo, y lo voy a decir en el consejo.»", "«Si se enteran por otro lado, la pregunta va a ser por qué esperamos.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Condicionó una obligación legal a tener certeza." }] },
        { id: "no_avisar", text: "Si retiramos rápido, no hace falta avisar. Lo resolvemos sin hacer ruido.", flags: ["sin_aviso"], requires: { all: ["retiro"] },
          reply: [{ text: ["Silencio.", "«Eso no lo voy a respaldar. Lo dejo asentado.»"] }],
          next: [{ to: "a3" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Trató una obligación legal como opcional porque el retiro iba bien." }] },
      ],
    },
    a3: {
      id: "a3", stage: "Comunicar", who: "sofia", channel: "email",
      say: [
        { when: { all: ["retiro_inmediato"] }, text: ["Sofía: «Director, ya estamos sacando el producto de las 140 tiendas. Gracias por avisar de inmediato.»", "«¿Qué le decimos a los clientes que pregunten o que ya lo compraron?»"] },
        { text: ["Sofía: «Director, me enteré por una tienda de que hay un problema con Picositas. ¿Por qué no me avisaron?»", "«¿Qué le decimos a los clientes?»"] },
      ],
      ask: "¿Qué comunican y a quién?", freeText: true,
      strategies: [
        { id: "alerta", text: "Una alerta pública clara: el lote, que puede tener cacahuate, que no lo consuman las personas alérgicas, y reembolso con una línea de atención.", cues: ["public*", "consumidor*", "comunicado abierto", "medios", "prensa", "redes", "alergic*", "la gente", "clientes finales", "reembolso"], flags: ["alerta_publica"], trust: 1,
          reply: [{ text: ["«Lo pongo en anaquel y en redes de SuperNorte hoy.»", "«Así sí puedo dar la cara con los clientes.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "coherencia", level: 3, basis: "Una sola voz, clara y útil para quien está en riesgo." }] },
        { id: "privado", text: "Avisar solo a las cadenas para que retiren el producto, sin comunicado público.", cues: ["cadena*", "privad*", "comercial*", "sin comunicado", "nada hacia", "nada al publico", "al publico no", "no le decimos", "nada en medios", "discret*", "sin aviso publico", "sin hacerlo publico"], flags: ["aviso_privado"],
          reply: [{ text: ["«Ok, lo retiramos.»", "«Pero si un cliente ya lo tiene en su casa, no se va a enterar.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Sacó el producto de la tienda, pero no advirtió a quien ya lo tenía en casa." }] },
        { id: "minimizar", text: "Un aviso de «retiro preventivo por calidad», sin mencionar el cacahuate, para no asustar.", flags: ["minimiza"], trust: -1,
          reply: [{ text: ["«¿Por calidad? Director, si es un alérgeno, mis abogados me van a pedir que lo diga.»"] }],
          next: [{ to: "a4" }],
          evidence: [{ dim: "coherencia", level: 0, basis: "Escondió el riesgo real en el mensaje: quien es alérgico no puede protegerse." }] },
      ],
    },
    a4: {
      id: "a4", stage: "Costo", who: "lucia", channel: "whatsapp",
      say: [
        { when: { all: ["retiro"] }, text: ["Lucía: «El retiro va en $1.6 M. Sofía también pide que absorbamos la reposición en tiendas.»", "«¿Cómo lo manejamos?»"] },
        { text: ["Lucía: «El laboratorio todavía no responde. Tenemos producto del lote en anaquel en 128 tiendas.»", "«¿Qué hacemos?»"] },
      ],
      ask: "¿Qué decides sobre el retiro y su costo?", freeText: true,
      strategies: [
        { id: "absorber", text: "Absorber todo el costo y reponer el producto sin cargo a SuperNorte.", cues: ["todo", "complet*", "integr*", "100", "cien por ciento", "sin reclamar", "no reclamamos", "no le reclamamos", "no le cobramos al proveedor", "nada al proveedor"], requires: { all: ["retiro"] }, trust: 1,
          reply: [{ text: ["«Ok. Va contra el resultado del trimestre.»"] }],
          next: [{ to: "a5" }],
          evidence: [{ dim: "consecuencias", level: 2, basis: "Pagó el costo completo sin buscar recuperarlo de quien lo causó." }] },
        { id: "reclamar", text: "Absorber el costo frente a SuperNorte y reclamar al proveedor según el contrato.", cues: ["proveedor*", "contrato", "sazonador"], requires: { all: ["retiro"] }, flags: ["reclamo"], trust: 1,
          reply: [{ text: ["«Perfecto. El contrato lo permite; armo el reclamo con la evidencia de Javier.»"] }],
          next: [{ to: "a5" }],
          evidence: [{ dim: "alternativas", level: 3, basis: "Protegió la relación con el cliente y trasladó el costo a quien lo causó, por la vía del contrato.", when: { any: ["q:proveedor", "a:lucia"] } },
            { dim: "alternativas", level: 2, basis: "Buscó recuperar el costo, aunque sin revisar el contrato antes.", when: { none: ["q:proveedor", "a:lucia"] } }] },
        { id: "recortar", text: "Limitar el retiro a las tiendas con quejas para bajar el costo a $0.4 M.", requires: { all: ["retiro"] }, flags: ["recorta"],
          reply: [{ text: ["«Bajamos el costo, sí.»", "«Pero el producto del lote sigue en 128 tiendas.»"] }],
          next: [{ to: "a5" }],
          evidence: [{ dim: "consecuencias", level: 0, basis: "Puso el costo por encima de una obligación de seguridad." }] },
        { id: "ampliar", text: "Retirar ya todo el lote de las 140 tiendas, aunque sea tarde, y reclamar al proveedor.", requires: { none: ["retiro"] }, flags: ["retiro", "retiro_tarde", "reclamo"],
          reply: [{ text: ["«Va. Coordino con Sofía y armo el reclamo.»", "«Llevamos un día de retraso, pero lo sacamos hoy.»"] }],
          next: [{ to: "a5" }],
          evidence: [{ dim: "adaptacion", level: 2, basis: "Corrigió el rumbo y retiró todo, aunque con un día de retraso." }] },
        { id: "seguir_esperando", text: "Seguir esperando al laboratorio: faltan menos de 24 horas.", requires: { none: ["retiro"] }, flags: ["sigue_espera"],
          reply: [{ text: ["«Es tu decisión.»", "«Yo dejaría constancia de que lo sabíamos desde anoche.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "riesgos", level: 0, basis: "Mantuvo producto con un posible alérgeno en anaquel durante dos días." }] },
      ],
    },
    a5: {
      id: "a5", stage: "Causa", who: "javier", channel: "junta",
      say: [
        { when: { all: ["reaccion", "expuesto=1"] }, text: ["Junta de comité. Javier trae el reporte.", "«El laboratorio confirmó: sí había trazas. La niña ya salió del hospital. ¿Qué cambiamos para que no vuelva a pasar?»"] },
        { text: ["Junta de comité. Javier trae el reporte.", "«El laboratorio confirmó: sí había trazas. ¿Qué cambiamos para que no vuelva a pasar?»"] },
      ],
      ask: "¿Cómo atacas la causa?", freeText: true,
      strategies: [
        { id: "auditoria", text: "Auditar al proveedor, pedir certificado de alérgenos por lote y una prueba rápida en recepción antes de usar cualquier sazonador.", flags: ["auditoria"],
          reply: [{ text: ["«Eso sí lo podemos hacer en planta. La prueba rápida cuesta poco.»", "«Le pido a Mariana que lo meta en la capacitación del turno.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Corrigió el proceso (control por lote), no solo el incidente." }],
          commitments: [{ id: "al-control", text: "Certificado de alérgenos por lote y prueba rápida en recepción.", owner: "javier" }] },
        { id: "cambiar", text: "Cambiar de proveedor de sazonador esta misma semana.", flags: ["cambio_proveedor"],
          reply: [{ text: ["«Se puede, pero un proveedor nuevo tarda dos semanas en surtir.»", "«Y el problema de no revisar en recepción sigue.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 1, basis: "Cambió al culpable visible, pero el proceso que lo dejó pasar sigue igual." }] },
        { id: "culpar", text: "Señalar al operador que recibió el lote sin revisar y sancionarlo frente al turno.", flags: ["culpar"],
          reply: [{ text: ["Javier baja la mirada.", "«El operador siguió el procedimiento. No existía una revisión de alérgenos.»"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "problema", level: 0, basis: "Buscó un culpable en lugar de la causa: el procedimiento no pedía la revisión." }] },
      ],
    },
  },
  followUps: [
    { id: "al-autoridad", when: { none: ["aviso"] }, afterDays: 5, from: "carla", subject: "La autoridad sanitaria pide explicaciones",
      text: [{ text: ["La autoridad se enteró por un hospital. Pide explicar por qué no se le avisó cuando lo supimos. El comité de riesgos sesiona el jueves."] }] },
    { id: "al-reclamo", when: { all: ["reclamo"] }, afterDays: 21, from: "lucia", subject: "Respuesta del proveedor al reclamo",
      text: [{ text: ["El proveedor aceptó cubrir el 50% del retiro. Pide a cambio seguir como proveedor con la auditoría."] }] },
    { id: "al-control", when: { all: ["auditoria"] }, afterDays: 30, from: "javier", subject: "Primer mes con prueba de alérgenos",
      text: [{ text: ["Primer mes con la prueba en recepción: detectamos un lote dudoso de otro proveedor y lo regresamos antes de usarlo."] }] },
  ],
  rules: "alergeno-v1",
};

registerRules("alergeno-v1", rulesAlergeno, deriveAlergeno);
