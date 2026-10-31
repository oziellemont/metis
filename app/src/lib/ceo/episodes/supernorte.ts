/**
 * Piloto P0-B · Executive Decision Episode · Negociación SuperNorte (Botanas Cumbre).
 *
 * Borrador para aprobación de Oziel (adenda v3.3 §6). Usa los hechos del caso d2-supernorte y agrega, como
 * contenido editorial nuevo, el margen de contribución (19%), la capacidad de planta (72%) y la línea de crédito
 * ($14 M al 12%). Esos tres datos están marcados en docs/episodios/supernorte.md para su revisión.
 *
 * Rutas: abrir (explorar / datos / firme / aceptar) → propuesta → objeción → defensa interna → cierre → plan.
 * Entre 4 y 6 decisiones según la ruta. Las ramas se reúnen en la objeción y en el cierre, cada quien con sus términos.
 *
 * Modelo económico (todo declarado, sin azar oculto):
 *  - 1 punto de descuento o de promoción = $1.27 M al año (1% de $127 M).
 *  - Cada día extra de plazo = $127 M / 365 ≈ $0.35 M de capital de trabajo; financiarlo cuesta 12% anual.
 *  - Volumen adicional aporta 19% de contribución (la planta tiene capacidad ociosa).
 *  - Perder un frente: en 40 tiendas ≈ $10.9 M de ventas; en las 140 ≈ $38 M.
 *  - ¿Acepta SuperNorte? Compara lo que ella necesita (4 pts, menos 1.5 si le demostraste la rotación de 1.4×,
 *    más 1 si la regional sí tiene capacidad —azar reproducible—, más 1 si la amenazaste…) con el valor de tu oferta.
 */
import type { EpisodeRun, EpisodeSpec, Strategy } from "./contracts";
import { registerRules, type RulesResult } from "./rules";

export const SN = { ventas: 127, rate: 1.27, cm: 0.19, wcPerDay: 127 / 365, financing: 0.12, margin0: 7.1, frente40: 10.9, frente140: 38 } as const;
const r1 = (n: number) => Math.round(n * 10) / 10;
const has = (run: Pick<EpisodeRun, "flags">, f: string) => run.flags.includes(f);

/** Términos derivados: lo que necesita Sofía, el valor de tu oferta para ella, la brecha y el estado (0 rechaza · 1 parcial · 2 acepta). */
export function deriveSuperNorte(run: Pick<EpisodeRun, "flags" | "terms" | "trust">): Record<string, number> {
  const t = run.terms;
  const g = (k: string) => t[k] ?? 0;
  // Si conoces su interés real (margen por metro), la promoción ligada a sell-out vale más para ella.
  const promoValue = has(run, "explorar") || has(run, "a:hector") || has(run, "q:metas") ? 1 : 0.75;
  let need = 4;
  if (has(run, "rotacion")) need -= 1.5;
  if (has(run, "regional_capaz")) need += 1;
  if (has(run, "firme")) need += 1;
  if (has(run, "se_planta")) need += 0.5;
  if (run.trust >= 2) need -= 0.5;
  if (has(run, "comio") && has(run, "delegado")) need -= 0.5;
  const valor = g("descuento") + g("promo") * promoValue + ((g("plazo") - 60) / 30) * 1.5 + g("cuota") / SN.rate - (g("volumen") / 10) * 0.5 + (has(run, "piloto") ? 0.5 : 0) + (g("revision") > 0 ? 0.25 : 0);
  const brecha = r1(need - valor);
  const estado = has(run, "no_firma") ? 0 : brecha <= 0 ? 2 : brecha <= 1.5 ? 1 : 0;
  return { need: r1(need), valor: r1(valor), brecha, estado, margen_final: r1(SN.margin0 - g("descuento") - g("promo")), wc: r1(Math.max(0, g("plazo") - 60) * SN.wcPerDay) };
}

/** Números del cierre (puros, con pruebas). */
export function economicsSuperNorte(run: Pick<EpisodeRun, "flags" | "terms" | "trust">) {
  const t = { ...run.terms, ...deriveSuperNorte(run) };
  const e = t.estado;
  const deal = e > 0;
  const lostSales = e === 2 ? 0 : e === 1 ? SN.frente40 : SN.frente140;
  const keep = (SN.ventas - lostSales) / SN.ventas;
  const costoDesc = deal ? t.descuento * SN.rate * keep : 0;
  const costoPromo = deal ? t.promo * SN.rate * keep : 0;
  const cuota = deal ? t.cuota : 0;
  const volGain = deal ? SN.ventas * (t.volumen / 100) * SN.cm : 0;
  const lostContribution = lostSales * SN.cm;
  const wc = deal ? Math.max(0, t.plazo - 60) * SN.wcPerDay : 0;
  const financing = wc * SN.financing;
  const net = -costoDesc - costoPromo - cuota + volGain - lostContribution - financing;
  return { estado: e, deal, lostSales, costoDesc: r1(costoDesc), costoPromo: r1(costoPromo), cuota: r1(cuota), volGain: r1(volGain), lostContribution: r1(lostContribution), wc: r1(wc), financing: r1(financing), net: r1(net), marginAfter: deal ? t.margen_final : SN.margin0 };
}

const money = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(n).toFixed(1)} M`;
const pts = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} pts`;

export function rulesSuperNorte(_spec: EpisodeSpec, run: EpisodeRun): RulesResult {
  const x = economicsSuperNorte(run);
  const t = { ...run.terms, ...deriveSuperNorte(run) };
  const terms: string[] = [];
  if (t.descuento > 0) terms.push(`${pts(t.descuento)} de descuento`);
  if (t.promo > 0) terms.push(`${pts(t.promo)} en promoción ligada a sell-out`);
  terms.push(`pago a ${t.plazo} días`);
  if (t.volumen > 0) terms.push(`+${t.volumen}% de volumen comprometido`);
  if (t.cuota > 0) terms.push(`cuota de exhibición de $${t.cuota.toFixed(1)} M`);
  const headline = x.estado === 2 ? `Acuerdo con SuperNorte: ${terms.join(", ")}.`
    : x.estado === 1 ? `Acuerdo parcial: SuperNorte acepta (${terms.join(", ")}), pero retira un frente en 40 tiendas hasta ver resultados.`
    : has(run, "no_firma") ? "No firmaste. SuperNorte reasigna un frente de anaquel en las 140 tiendas a la marca regional."
    : "Sin acuerdo: SuperNorte reasigna un frente de anaquel en las 140 tiendas a la marca regional.";

  const agreement: [string, string][] = x.deal ? [
    ["Descuento permanente", t.descuento > 0 ? pts(t.descuento) : "Sin cambio"],
    ["Inversión promocional", t.promo > 0 ? `${pts(t.promo)}, ligada a sell-out por tienda` : "Ninguna"],
    ["Plazo de pago", `${t.plazo} días (antes 60)`],
    ...(t.volumen > 0 ? [["Volumen comprometido", `+${t.volumen}%`] as [string, string]] : []),
    ...(t.cuota > 0 ? [["Cuota de exhibición", `$${t.cuota.toFixed(1)} M al año`] as [string, string]] : []),
    ...(t.revision > 0 ? [["Revisión", `A los ${t.revision} meses, con datos de sell-out`] as [string, string]] : []),
    ["Anaquel", x.estado === 2 ? "Dos frentes en 140 tiendas" : "Dos frentes en 100 tiendas, uno en 40"],
  ] : [["Anaquel", "Un frente en 140 tiendas (antes dos)"], ["Condiciones", "Sin cambios: 60 días, sin descuento adicional"]];

  const economics: [string, string][] = [
    ...(x.costoDesc ? [["Costo anual del descuento", money(-x.costoDesc)] as [string, string]] : []),
    ...(x.costoPromo ? [["Costo anual de la promoción", money(-x.costoPromo)] as [string, string]] : []),
    ...(x.cuota ? [["Cuota de exhibición", money(-x.cuota)] as [string, string]] : []),
    ...(x.volGain ? [["Contribución del volumen adicional (19%)", money(x.volGain)] as [string, string]] : []),
    ...(x.lostSales ? [["Ventas que se pierden", `$${x.lostSales.toFixed(1)} M al año`] as [string, string], ["Contribución perdida (19%)", money(-x.lostContribution)] as [string, string]] : []),
    ...(x.wc ? [["Capital de trabajo adicional", `$${x.wc.toFixed(1)} M de la línea de $14 M`] as [string, string], ["Costo financiero (12%)", money(-x.financing)] as [string, string]] : []),
    ["Efecto neto anual estimado", money(x.net)],
    ["Margen de la cuenta", `${SN.margin0}% → ${x.marginAfter.toFixed(1)}%`],
  ];

  const kpi: RulesResult["kpi"] = [];
  const parts = [x.costoDesc && `descuento ${money(-x.costoDesc)}`, x.costoPromo && `promoción ${money(-x.costoPromo)}`, x.cuota && `cuota ${money(-x.cuota)}`, x.volGain && `volumen ${money(x.volGain)}`, x.lostContribution && `anaquel perdido ${money(-x.lostContribution)}`, x.financing && `financiamiento ${money(-x.financing)}`].filter(Boolean).join(", ");
  if (Math.round(x.net) !== 0) kpi.push({ key: "margen", delta: Math.round(x.net), why: `Efecto neto anual ${money(x.net)} (${parts}). Regla: 1 punto por cada $1 M.` });
  if (x.wc > 0 || x.cuota > 0) kpi.push({ key: "caja", delta: -Math.round(x.wc / 1.5) - (x.cuota > 0 ? 1 : 0), why: `${x.wc ? `$${x.wc.toFixed(1)} M más de capital de trabajo por pasar a ${t.plazo} días` : ""}${x.wc && x.cuota ? " y " : ""}${x.cuota ? "cuota de exhibición pagada por adelantado" : ""}. Regla: 1 punto por cada $1.5 M de caja comprometida.` });
  kpi.push(x.estado === 2 ? { key: "clientes", delta: 2 + (run.trust >= 2 ? 1 : 0), why: `Conservas los dos frentes${run.trust >= 2 ? " y la relación con Sofía sale fortalecida" : ""}.` }
    : x.estado === 1 ? { key: "clientes", delta: -2, why: "Pierdes un frente en 40 tiendas mientras SuperNorte ve resultados." }
    : { key: "clientes", delta: -6, why: "Pierdes un frente en las 140 tiendas de tu cliente más grande (31% de ventas)." });
  if (x.estado === 0) kpi.push({ key: "equipo", delta: -2, why: "El equipo comercial pierde comisiones sobre $38 M de ventas." });
  if (x.deal && x.marginAfter < 4) kpi.push({ key: "consejo", delta: -2, why: `La cuenta queda en ${x.marginAfter.toFixed(1)}%, debajo del 4% que pidió vigilar el consejo.` });

  const commitments = x.deal ? [{ id: "sn-anaquel", text: x.estado === 2 ? "SuperNorte mantiene dos frentes en las 140 tiendas." : "SuperNorte mantiene dos frentes en 100 tiendas y revisa las 40 restantes con resultados.", owner: "sofia" }] : [];
  const risks = [
    ...(x.deal && t.plazo >= 90 && !has(run, "recorte") ? [{ id: "sn-linea", text: `La línea de crédito queda con $${(14 - x.wc).toFixed(1)} M libres; cualquier otro cliente que se atrase te deja sin colchón.`, owner: "lucia" }] : []),
    ...(x.deal && t.descuento >= 3 ? [{ id: "sn-precedente", text: "Otras cadenas pueden pedir el mismo descuento.", owner: "hector" }] : []),
    ...(!x.deal && !has(run, "q:alternativas") ? [{ id: "sn-sin-alternativa", text: "No hay un canal alternativo firmado para recuperar las ventas perdidas.", owner: "hector" }] : []),
  ];

  const luck = has(run, "regional_capaz")
    ? "Fuera de tu control: la marca regional sí tenía capacidad para surtir 90 tiendas desde marzo. Eso endureció a Sofía; con la misma propuesta, en otro momento habrías necesitado ceder menos."
    : x.estado === 0 && !has(run, "no_firma")
      ? "La marca regional no tenía capacidad confirmada. Perder el frente fue resultado de la negociación, no del mercado."
      : null;

  return { headline, agreement, economics, kpi, commitments, risks, luck, data: { estado: x.estado, net: x.net, descuento: t.descuento, promo: t.promo, plazo: t.plazo } };
}

registerRules("supernorte-v1", rulesSuperNorte, deriveSuperNorte);

// ───────────────────────────────────────────── contenido
const TERMS_PARAMS = {
  descuento: { key: "descuento", label: "Descuento permanente", min: 0, max: 4, step: 0.5, default: 1, unit: "pts", hint: "Cada punto ≈ $1.27 M al año" },
  promo: { key: "promo", label: "Promoción ligada a sell-out", min: 0, max: 3, step: 0.5, default: 1.5, unit: "pts", hint: "Solo se paga con metas por tienda" },
  plazo: { key: "plazo", label: "Plazo de pago", min: 60, max: 90, step: 15, default: 60, unit: "días", hint: "Cada 30 días ≈ $10.4 M de caja" },
};

const firmar: Strategy = {
  id: "formalizar", text: "Formalizar por escrito: términos, metas por tienda, responsable de cada lado y fecha de revisión.",
  requires: { all: ["estado>=1"] }, trust: 1,
  reply: [
    { when: { all: ["estado=2"] }, text: ["De acuerdo, Director. Le mando el anexo con lo que acordamos: {t:descuento} de descuento, {t:promo} en promoción y pago a {t:plazo}.", "Me ayuda mucho que venga con metas por tienda. Así lo defiendo con mi gerente."] },
    { text: ["Va. Lo firmamos así, con un frente menos en 40 tiendas mientras vemos resultados.", "Si en la revisión la promoción rota, regresamos el frente."] },
  ],
  next: [{ when: { none: ["delegado"] }, to: "d6" }, { to: "close" }],
  evidence: [{ dim: "ejecucion", level: 2, basis: "Dejó por escrito términos, metas, responsables y revisión." }],
};

const noFirmar: Strategy = {
  id: "no_firmar", text: "No firmar: prefiero perder un frente que aceptar condiciones que no se pagan solas.",
  cues: ["no firm*", "no voy a firmar", "me levanto", "no es rentable", "perder un frente", "perder anaquel", "perder parte", "antes que firmar", "no se paga*", "no se sostiene"],
  flags: ["no_firma"], trust: -1,
  reply: [{ text: ["Entiendo, Director. Lamento no haber encontrado un punto medio.", "Le aviso que a partir del día 1 reasignamos uno de sus frentes."] }],
  next: [{ to: "close" }],
  evidence: [
    { dim: "consecuencias", level: 3, basis: "Rechazó un acuerdo que destruía margen: con esos términos la cuenta quedaba por debajo del 4%.", when: { all: ["margen_final<4"] } },
    { dim: "consecuencias", level: 1, basis: "Dejó ir un acuerdo que todavía era rentable; perder el frente cuesta $7.2 M de contribución.", when: { all: ["margen_final>=4"] } },
  ],
};

export const SUPERNORTE: EpisodeSpec = {
  contract: 1, id: "supernorte", version: "0.1.0", approval: "borrador",
  company: "cumbre", industry: "Alimentos y botanas", title: "Negociación SuperNorte", subject: "Condiciones comerciales 2027 · Botanas Cumbre",
  from: "sofia", channel: "email", areas: ["negociacion", "clientes", "finanzas"], cast: ["sofia", "hector", "lucia", "javier", "ana"],
  lesson: "negociacion", minutes: 8,
  concept: {
    title: "MAPAN: tu fuerza está en las alternativas, las tuyas y las del otro",
    text: "Sofía pidió 4 puntos, pero su interés real era el margen por metro de anaquel, y sacar un producto que rota 1.4 veces más también le costaba a ella. Cada concesión tiene un precio que se puede calcular: un punto son $1.27 M al año y 30 días de plazo son $10.4 M de caja. Negociar bien no es ceder poco ni ceder mucho: es saber cuánto vale lo que das, pedir algo a cambio y no amenazar con una alternativa que no existe.",
    nota: "Antes de pelear por la rebanada, pregunta qué necesita el otro y calcula cuánto vale cada cosa que pones sobre la mesa.",
  },
  briefing: {
    message: [
      "Estimado Director:",
      "Como cada año, revisamos condiciones con nuestros proveedores estratégicos. Para mantener sus dos frentes de anaquel en las 140 tiendas, necesitamos 4 puntos adicionales de descuento y pasar el plazo de pago de 60 a 90 días a partir de enero.",
      "Le comento que una marca regional nos ofreció condiciones muy competitivas por ese espacio.",
      "Quedo atenta a su respuesta antes del viernes.",
      "Sofía Leal · Compradora de categoría Botanas · SuperNorte",
    ],
    context: { title: "Lo que sabes al abrir", rows: [["SuperNorte", "31% de las ventas de Cumbre ($127 M al año)"], ["Lo que pide", "+4 pts de descuento y pago a 90 días"], ["Fecha límite", "Viernes"]] },
  },
  facts: {
    version: 1,
    missing: "No hay un dato del caso que responda eso. Prueba con otra pregunta (no se gastó tu consulta).",
    facts: [
      { id: "margen", label: "¿Cuánto ganamos hoy con SuperNorte y cuánto cuesta cada punto?", keywords: ["margen", "ganamos", "rentabilidad", "utilidad", "punto", "puntos", "descuento cuesta", "cuanto cuesta"], source: "lucia",
        answer: "Lucía: el margen de la cuenta hoy es 7.1% ($9.0 M al año). Cada punto de descuento cuesta ≈ $1.27 M al año; los 4 puntos dejarían la cuenta en 3.1%. El consejo pidió no tener cuentas grandes por debajo de 4%." },
      { id: "contribucion", label: "¿Qué aporta vender más volumen?", keywords: ["contribucion", "volumen", "capacidad", "planta", "fijos", "vender mas"], source: "lucia",
        answer: "Lucía: el margen de contribución de la cuenta (antes de gastos fijos) es 19%. La planta está al 72% de su capacidad, así que el volumen adicional absorbe costos fijos." },
      { id: "rotacion", label: "¿Cómo rota Cumbre frente a la marca regional?", keywords: ["rotacion", "rotan", "rota", "sell out", "sellout", "desplazamiento", "competencia", "venden"], source: "datos",
        answer: "Datos de sell-out (12 meses): Cumbre rota 1.4 veces lo que rota la marca regional en las tiendas de SuperNorte. Si SuperNorte nos saca, también pierde ventas por metro." },
      { id: "plazo", label: "¿Cuánto nos cuesta pasar a 90 días?", keywords: ["plazo", "90", "dias", "caja", "capital de trabajo", "credito", "liquidez", "financiar", "banco"], source: "lucia",
        answer: "Lucía: pasar de 60 a 90 días requiere ≈ $10.4 M más de capital de trabajo. La línea de crédito disponible es de $14 M, al 12% anual." },
      { id: "metas", label: "¿Qué le importa realmente a Sofía?", keywords: ["sofia", "le importa", "meta", "metas", "gerente", "interes", "necesita", "evalua", "kpi"], source: "hector",
        answer: "Héctor: a Sofía su cadena la evalúa por margen por metro de anaquel de la categoría. Este trimestre tiene meta de subir 2 puntos de margen de categoría." },
      { id: "historia", label: "¿Qué pasó la última vez que pidieron descuento?", keywords: ["historia", "ultima vez", "antes", "pasado", "hace dos anos", "precedente"], source: "hector",
        answer: "Héctor: hace dos años SuperNorte pidió 3 puntos. Cumbre dio 2 a cambio de un exhibidor en cabecera y las ventas crecieron 6% ese año." },
      { id: "alternativas", label: "¿Tenemos otros canales si perdemos anaquel?", keywords: ["alternativa", "alternativas", "conveniencia", "otro canal", "otros canales", "otra cadena", "mapan", "batna", "plan b"], source: "hector",
        answer: "Héctor: no hay contratos firmados con tiendas de conveniencia. Hay una plática preliminar con una cadena regional de 300 tiendas, sin fecha." },
    ],
    unknowns: [
      { id: "oferta_regional", keywords: ["regional ofrecio", "que ofrecio", "oferta de la regional", "precio de la regional", "cuanto ofrecio", "capacidad de la regional", "regional puede", "regional tiene", "entro la regional", "regional entro", "regional les dio", "regional le dio", "regional esta dando", "regional ofrece", "le ofrecieron", "les ofrecieron", "puede surtir", "pueden surtir", "condiciones de la regional", "descuento de la regional", "otra marca ofrecio", "otra marca le ofrecio", "le ofrecio exactamente", "le puso la regional", "esta dando la marca regional", "precio esta dando"], answer: "Ese dato no existe todavía: Sofía no ha compartido qué ofreció exactamente la marca regional, y nadie ha verificado si puede surtir 140 tiendas." },
    ],
  },
  advisors: [
    { id: "lucia", role: "Directora de Finanzas", personality: "Directa, precisa, desconfía de los descuentos.", interests: "Recuperar el margen y no rebasar los límites del banco.", relations: "En tensión con Héctor: culpa a los descuentos del margen perdido. Aliada de Carla en el consejo.", knows: ["margen", "contribucion", "plazo"],
      view: [{ text: [
        "Mi preocupación es la caja. Cada 30 días extra de plazo son unos $10 M que tendríamos que financiar al 12%, y la línea es de $14 M. Y cada punto de descuento son $1.27 M al año.",
        "No te digo que no cedas. Te digo que lo que cedas tenga algo a cambio que yo pueda medir. Si no, el consejo me va a preguntar por qué la cuenta más grande quedó debajo del 4%.",
      ] }] },
    { id: "hector", role: "Director Comercial", personality: "Cálido con los clientes, orgulloso, 22 años en Cumbre.", interests: "Conservar la cuenta, a su gente y sus comisiones. Esperaba tu puesto.", relations: "Conoce a Sofía desde que era practicante. En tensión con Lucía.", knows: ["metas", "historia", "alternativas", "rotacion"],
      view: [
        { when: { all: ["comio"] }, text: [
          "Gracias por la comida del otro día; te lo digo directo. A Sofía la miden por margen por metro de anaquel, no por el descuento en sí. Si le das algo que mejore su margen por metro, tiene con qué defenderse con su gerente.",
          "Lo que nunca le funciona es que la amenacen: tiene memoria. Y si quieres, te acompaño; sé hasta dónde puede ceder ella.",
        ] },
        { text: [
          "Si quieres mi opinión: Sofía no es la enemiga. Su gerente la mide por margen por metro, no por el descuento en sí.",
          "Tú decides. Yo nomás llevo 22 años con esa cuenta.",
        ] },
      ] },
    { id: "javier", role: "Gerente de Planta", personality: "Práctico, de pocas palabras.", interests: "Seguridad, equipo nuevo y que alguien de arriba pise la planta.", relations: "Aliado de Roberto (sindicato).", knows: ["contribucion"],
      view: [{ text: [
        "Estamos al 72% de capacidad. Si SuperNorte compromete más volumen, lo surtimos sin turno extra hasta un 15% más.",
        "Más que eso necesito un tercer turno, y eso no se arma en un mes.",
      ] }] },
  ],
  history: [{ flag: "comio", item: "d1-hector", options: ["a"] }],
  preview: [{ key: "margen_final", label: "Margen de la cuenta" }, { key: "wc", label: "Caja adicional" }],
  chance: [{ flag: "regional_capaz", p: 0.35, label: "La marca regional sí tiene capacidad para surtir" }],
  terms: {
    descuento: { label: "Descuento", unit: "pts", initial: 0 },
    promo: { label: "Promoción", unit: "pts", initial: 0 },
    plazo: { label: "Plazo", unit: "días", initial: 60 },
    volumen: { label: "Volumen", unit: "%", initial: 0 },
    cuota: { label: "Cuota", unit: "M", initial: 0, decimals: 1 },
    revision: { label: "Revisión", unit: "meses", initial: 0 },
    margen_final: { label: "Margen", unit: "%", initial: 7.1, decimals: 1 },
    wc: { label: "Capital de trabajo", unit: "M", initial: 0, decimals: 1 },
  },
  start: "d1",
  nodes: {
    d1: {
      id: "d1", stage: "Postura", who: "sofia", channel: "email",
      say: [{ text: ["Sofía espera tu respuesta antes del viernes."] }],
      ask: "¿Cómo abres la negociación?", freeText: true,
      strategies: [
        { id: "explorar", text: "Pedir una reunión para entender qué necesita SuperNorte (su meta, qué le ofrece la regional) antes de hablar de números.", flags: ["explorar"], trust: 1,
          reply: [{ text: ["Claro, Director. ¿Le parece el jueves a las 10?", "Le adelanto algo: no es solo el descuento. Mi gerente me mide por margen de la categoría."] }],
          next: [{ to: "d2" }],
          evidence: [{ dim: "problema", level: 3, basis: "Buscó el interés detrás de la posición antes de negociar cifras." }] },
        { id: "datos", text: "Responder con datos: nuestra rotación es 1.4 veces la de la regional, así que SuperNorte también pierde si nos saca. Pedir reunión.", flags: ["rotacion"],
          reply: [{ text: ["No tenía el dato de rotación por tienda. Tráigalo el jueves con el detalle.", "Igual necesito algo que llevarle a mi gerente."] }],
          next: [{ to: "d2" }],
          evidence: [
            { dim: "informacion", level: 3, basis: "Usó el dato de rotación que verificó en el briefing.", when: { all: ["q:rotacion"] } },
            { dim: "informacion", level: 1, basis: "Argumentó con la rotación sin haberla verificado.", when: { none: ["q:rotacion"] } },
            { dim: "negociacion", level: 2, basis: "Mostró que la alternativa del otro lado también le cuesta." },
          ] },
        { id: "firme", text: "Responder firme: no damos más descuento. Si insisten, movemos el producto a otros canales.", flags: ["firme"], trust: -2,
          reply: [{ text: ["Entiendo su postura, Director.", "Le recuerdo que tengo otra oferta sobre la mesa. Si tiene algo que proponer, lo veo el jueves; si no, lo damos por cerrado."] }],
          next: [{ to: "d2" }],
          evidence: [
            { dim: "alternativas", level: 0, basis: "Amenazó con una alternativa que sabía que no existe (0 contratos firmados).", when: { all: ["q:alternativas"] } },
            { dim: "alternativas", level: 1, basis: "Amenazó con otros canales sin verificar si existen.", when: { none: ["q:alternativas"] } },
            { dim: "riesgos", level: 1, basis: "Defendió el margen, pero puso en riesgo el 31% de las ventas en el primer mensaje." },
          ] },
        { id: "aceptar", text: "Aceptar las condiciones: es el 31% de las ventas y no quiero arriesgarlo en mi primer mes.", set: { descuento: 4, plazo: 90 }, flags: ["acepto"], trust: 1,
          reply: [{ text: ["Excelente, Director. Le agradecemos mucho la disposición.", "Le hago llegar el anexo para firma esta semana."] }],
          next: [{ to: "d2b" }],
          evidence: [
            { dim: "problema", level: 1, basis: "Reconoció el riesgo de perder la cuenta, pero no cuantificó lo que cedía." },
            { dim: "negociacion", level: 0, basis: "Cedió todo lo pedido sin pedir nada a cambio." },
          ] },
      ],
    },
    d2: {
      id: "d2", stage: "Propuesta", who: "sofia", channel: "junta",
      say: [
        { when: { all: ["firme"] }, text: ["Jueves, 10:00. Sofía llega con su gerente, seria.", "«Director, vengo porque Héctor me lo pidió. Tengo la oferta de la regional en la mesa. ¿Qué propone?»"] },
        { when: { all: ["explorar"] }, text: ["Jueves, 10:00, oficinas de SuperNorte.", "«Le soy franca: necesito subir 2 puntos de margen de la categoría este trimestre. La regional me ofrece 5 puntos, pero no sé si puede surtir todo. ¿Qué me propone?»"] },
        { text: ["Jueves, 10:00, oficinas de SuperNorte.", "«Revisé su dato de rotación. Es bueno. Aun así, necesito mejorar el margen de la categoría. ¿Qué me propone?»"] },
      ],
      reveal: [{ when: { all: ["explorar"] }, title: "Lo que Sofía compartió", rows: [["Su meta", "+2 pts de margen de categoría este trimestre"], ["Oferta de la regional", "5 pts, sin capacidad confirmada"]] }],
      ask: "¿Qué propones?", freeText: true,
      strategies: [
        { id: "paquete", text: "Propuesta integral: ajustar descuento, inversión promocional ligada a sell-out y plazo.", cues: ["paquete", "integral", "combin*", "todo junto", "tres palancas", "tres piezas", "plazo", "dias", "credito", "condiciones de pago"], flags: ["paquete"], params: [TERMS_PARAMS.descuento, TERMS_PARAMS.promo, TERMS_PARAMS.plazo],
          reply: [
            { when: { all: ["estado=2"] }, text: ["Mmm. {t:descuento} de descuento, {t:promo} en promoción con metas y pago a {t:plazo}.", "Eso sí lo puedo llevar. Pero antes de cerrar, déjeme plantearle algo."] },
            { text: ["{t:descuento} de descuento, {t:promo} en promoción y pago a {t:plazo}…", "Me falta camino. Déjeme decirle por qué."] },
          ],
          next: [{ to: "d3" }],
          evidence: [
            { dim: "alternativas", level: 3, basis: "Combinó variables (descuento, promoción, plazo) en lugar de discutir una sola." },
            { dim: "consecuencias", level: 3, basis: "Cedió plazo después de revisar su costo de caja.", when: { all: ["plazo>60", "q:plazo"] } },
            { dim: "consecuencias", level: 1, basis: "Cedió plazo sin revisar cuánto cuesta en caja.", when: { all: ["plazo>60"], none: ["q:plazo", "a:lucia"] } },
            { dim: "negociacion", level: 1, basis: "La oferta inicial ya concede 3 puntos o más: deja poco margen para negociar.", when: { all: ["descuento>=3"] } },
          ] },
        { id: "volumen", text: "Descuento a cambio de volumen: los puntos que des, solo si SuperNorte compromete más volumen y un exhibidor.", cues: ["volumen", "caja", "cajas", "exhibidor", "exhibicion", "cabecera", "compr*", "anaquel"], flags: ["volumen_ofrecido"], params: [{ ...TERMS_PARAMS.descuento, default: 2 }, { key: "volumen", label: "Volumen comprometido", min: 0, max: 20, step: 5, default: 10, unit: "%", hint: "La planta surte hasta +15% sin turno extra" }],
          reply: [{ text: ["¿{t:descuento} a cambio de {t:volumen} más de volumen?", "Interesante, pero el volumen lo pone el consumidor, no yo. Le explico mi problema."] }],
          next: [{ to: "d3" }],
          evidence: [
            { dim: "alternativas", level: 2, basis: "Ató la concesión a una contrapartida medible." },
            { dim: "riesgos", level: 3, basis: "Pidió un volumen que la planta puede surtir.", when: { all: ["volumen<=15"] } },
            { dim: "riesgos", level: 1, basis: "Pidió más volumen del que la planta surte sin tercer turno.", when: { all: ["volumen>15"] } },
          ] },
        { id: "piloto", text: "Proponer un piloto de 8 semanas en 40 tiendas: promoción conjunta pagada por Cumbre (1 pt) y decidir condiciones con datos.", set: { promo: 1 }, flags: ["piloto"],
          reply: [{ text: ["Un piloto es sensato…", "Pero ocho semanas no me resuelven el trimestre."] }],
          next: [{ to: "d3" }],
          evidence: [
            { dim: "riesgos", level: 3, basis: "Redujo la incertidumbre antes de comprometer términos permanentes." },
            { dim: "negociacion", level: 2, basis: "Ofreció algo concreto sin regalar margen permanente." },
          ] },
        { id: "nada", text: "Mantener las condiciones actuales y ofrecer mejor servicio (entregas y surtido).", flags: ["sin_concesion"], trust: -1,
          reply: [{ text: ["Agradezco el servicio, pero eso ya lo esperamos de todos.", "Con eso no tengo nada que llevarle a mi gerente."] }],
          next: [{ to: "d3" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "No ofreció nada que atendiera el interés del otro lado." }] },
      ],
    },
    d2b: {
      id: "d2b", stage: "Liquidez", who: "lucia", channel: "whatsapp",
      say: [{ text: ["Acabo de ver el anexo de SuperNorte.", "Con 90 días usamos $10.4 M de los $14 M de la línea. Y la cuenta queda en 3.1%: el consejo pidió no bajar de 4%.", "¿Qué hacemos?"] }],
      ask: "Lucía te alerta sobre la caja. ¿Qué decides?", freeText: true,
      strategies: [
        { id: "linea", text: "Financiarlo con la línea de crédito y seguir.", cues: ["linea", "banco", "bancari*", "credito", "deuda", "prestamo", "prestado", "revolvente"], flags: ["linea"],
          reply: [{ text: ["Ok. Lo dejo documentado.", "Si otro cliente se atrasa, no tenemos colchón."] }], next: [{ to: "d3b" }],
          evidence: [{ dim: "riesgos", level: 1, basis: "Aceptó dejar la empresa sin colchón de liquidez." }],
          risks: [{ id: "sn-linea", text: "La línea de crédito queda casi agotada.", owner: "lucia" }] },
        { id: "reabrir", text: "Regresar con Sofía a renegociar el plazo a 75 días.", cues: ["sofia", "75", "renegoci*", "volver a hablar", "vuelvo a negociar", "dias de pago", "bajar el plazo"], set: { plazo: 75 }, flags: ["reabrir"], trust: -1,
          reply: [{ text: ["Me parece. Que se note que lo pedimos con datos, no por arrepentimiento."] }], next: [{ to: "d3b" }],
          evidence: [{ dim: "adaptacion", level: 2, basis: "Corrigió al recibir información nueva, aunque reabrir algo aceptado cuesta credibilidad." }] },
        { id: "recorte", text: "Compensar recortando gasto en otra área este año.", cues: ["recort*", "gasto*", "presupuesto", "apret*", "compens*"], flags: ["recorte"],
          reply: [{ text: ["Puedo proponer recortes en mercadotecnia.", "Diego no va a estar contento con su línea premium."] }], next: [{ to: "d3b" }],
          evidence: [{ dim: "consecuencias", level: 2, basis: "Buscó cómo pagar la concesión, aunque traslada el costo a otro proyecto." }],
          risks: [{ id: "sn-recorte", text: "El recorte frena el proyecto premium de Diego.", owner: "diego" }] },
      ],
    },
    d3: {
      id: "d3", stage: "Objeción", who: "sofia", channel: "junta",
      say: [
        { when: { all: ["volumen_ofrecido"] }, text: ["«No puedo comprometer volumen: si la promoción no rota, me quedo con inventario. ¿Quién absorbe ese riesgo?»"] },
        { when: { all: ["piloto"] }, text: ["«Un piloto de 8 semanas me deja sin cumplir mi meta este trimestre. Necesito algo que cuente ya.»"] },
        { when: { all: ["sin_concesion"] }, text: ["«Con mejor servicio no le gano a una oferta de 5 puntos. ¿Es su última palabra?»"] },
        { when: { all: ["paquete", "plazo=60"] }, text: ["«Su paquete tiene sentido, pero mi director de finanzas me exige más plazo. Sin eso no lo puedo subir.»"] },
        { text: ["«Me acerca, pero la regional sigue ofreciendo 5 puntos. ¿Qué más puede hacer?»"] },
      ],
      ask: "Sofía objeta. ¿Cómo respondes?", freeText: true,
      strategies: [
        { id: "ajustar", text: "Ajustar los términos de la propuesta.", flags: ["ajuste"], params: [TERMS_PARAMS.descuento, TERMS_PARAMS.promo, TERMS_PARAMS.plazo],
          reply: [{ when: { all: ["estado=2"] }, text: ["Con {t:descuento}, {t:promo} y {t:plazo}, ya nos estamos entendiendo."] }, { text: ["Con {t:descuento}, {t:promo} y {t:plazo}… sigue faltando."] }],
          next: [{ to: "d4" }],
          evidence: [{ dim: "adaptacion", level: 2, basis: "Ajustó términos en respuesta a la objeción." }] },
        { id: "contrapartida", text: "Dar 75 días de plazo, pero solo a cambio de datos de sell-out por tienda y metas para la promoción.", cues: ["a cambio", "sell out", "tienda por tienda", "por tienda", "solo si", "siempre que", "nada gratis", "si a cambio", "metas"], set: { plazo: 75 }, flags: ["contrapartida"],
          reply: [{ text: ["75 días con metas por tienda… Eso lo puedo presentar.", "Y los datos de sell-out se los comparto; a mí también me sirven."] }],
          next: [{ to: "d4" }],
          evidence: [{ dim: "negociacion", level: 3, basis: "Cada concesión con una contrapartida que le sirve a ambos." }] },
        { id: "sostener", text: "Sostener la propuesta y explicar por qué le conviene: con la rotación de 1.4 veces, su margen por metro sube con Cumbre, no con la regional.", flags: ["rotacion", "sostener"],
          reply: [
            { when: { all: ["firme"] }, text: ["Sus números son buenos, Director. Lástima que empezamos con amenazas.", "Lo voy a considerar."] },
            { text: ["Ese argumento sí lo puedo llevar a mi gerente: margen por metro.", "Déjeme ver qué tanto me muevo."] },
          ],
          next: [{ to: "d4" }],
          evidence: [
            { dim: "coherencia", level: 3, basis: "Defendió la propuesta con el interés de ella y un dato verificado.", when: { any: ["q:rotacion", "q:metas", "a:hector"] } },
            { dim: "coherencia", level: 2, basis: "Defendió la propuesta con un argumento sólido, sin haber verificado su interés." , when: { none: ["q:rotacion", "q:metas", "a:hector"] } },
          ] },
        { id: "preguntar", text: "Preguntar qué ofreció exactamente la regional y si de verdad puede surtir 140 tiendas.", flags: ["pregunta_regional"],
          reply: [
            { when: { all: ["regional_capaz"] }, text: ["Le soy honesta: pueden surtir 90 tiendas a partir de marzo.", "No las 140, pero sí una buena parte."] },
            { text: ["Honestamente, todavía no me confirman capacidad.", "Es una oferta en papel."] },
          ],
          next: [{ to: "d4" }],
          evidence: [{ dim: "informacion", level: 3, basis: "Verificó la alternativa del otro lado (su MAPAN) antes de ceder." }] },
      ],
    },
    d3b: {
      id: "d3b", stage: "Objeción", who: "sofia", channel: "email",
      say: [
        { when: { all: ["reabrir"] }, text: ["Director, me sorprende que reabra lo que ya habíamos acordado.", "Si quiere 75 días, necesito a cambio una cuota de exhibición de $1.5 M al año para el segundo frente."] },
        { text: ["Director, ya que estamos con el anexo: para el segundo frente necesitamos una cuota de exhibición de $1.5 M al año.", "Las demás marcas ya la pagan."] },
      ],
      ask: "SuperNorte pide una cuota adicional. ¿Qué haces?", freeText: true,
      strategies: [
        { id: "pagar", text: "Pagar la cuota.", set: { cuota: 1.5 },
          reply: [{ text: ["Perfecto. La incluyo en el anexo."] }], next: [{ to: "d5" }],
          evidence: [{ dim: "negociacion", level: 0, basis: "Volvió a ceder sin pedir nada a cambio: el otro lado aprendió que basta con pedir." }] },
        { id: "plantarse", text: "Negarse: ya cedimos 4 puntos y 90 días.", flags: ["se_planta"], trust: -1,
          reply: [{ text: ["Entiendo. Lo consulto con mi gerente.", "No le prometo nada."] }], next: [{ to: "d5" }],
          evidence: [{ dim: "negociacion", level: 2, basis: "Puso un límite, aunque tarde: lo que ya cedió no tuvo contrapartida." }] },
        { id: "cuota_datos", text: "Aceptar la cuota solo a cambio de datos de sell-out por tienda y metas para el exhibidor.", cues: ["solo si", "a cambio", "siempre que", "siempre y cuando", "condicion*", "por tienda", "sell out", "metas", "si me dan", "si nos"], set: { cuota: 1.5 }, flags: ["contrapartida"],
          reply: [{ text: ["Me parece justo. Le comparto el sell-out semanal."] }], next: [{ to: "d5" }],
          evidence: [{ dim: "adaptacion", level: 3, basis: "Aprendió del error: esta concesión sí trae contrapartida." }] },
      ],
    },
    d4: {
      id: "d4", stage: "Defensa", who: "lucia", channel: "whatsapp",
      say: [
        { when: { any: ["firme", "sin_concesion"], all: ["estado=0"] }, text: ["Héctor: «Si perdemos el anaquel, mi equipo pierde comisiones sobre $38 M. ¿De verdad lo vamos a arriesgar?»", "Lucía: «Yo prefiero perder un frente que regalar margen. Pero que sea una decisión, no un accidente.»"] },
        { when: { all: ["margen_final<4"] }, text: ["Lucía: «Con estos términos la cuenta queda en {t:margen_final}. ¿Cómo lo justifico ante el consejo?»"] },
        { when: { all: ["plazo>=90"] }, text: ["Lucía: «A {t:plazo} usamos ${t:wc} de la línea de $14 M. ¿Lo sostienes?»"] },
        { text: ["Héctor: «Sofía me llamó. Le gustó, pero su gerente quiere ver algo más antes de firmar.»", "Lucía: «Con lo que llevamos, la cuenta queda en {t:margen_final}. Yo no daría más sin algo a cambio.»"] },
      ],
      reveal: [{ title: "Modelo rápido de Lucía", rows: [["Margen de la cuenta con estos términos", "{t:margen_final}"], ["Capital de trabajo adicional", "${t:wc}"]] }],
      ask: "Tu equipo cuestiona el planteamiento. ¿Qué haces?", freeText: true,
      strategies: [
        { id: "defender", text: "Mantener y explicar: cuánto cuesta, qué ganamos y cuál es mi límite.",
          reply: [{ text: ["Lucía: «Ok. Si el límite está claro, te respaldo.»", "Héctor: «Va. Yo se lo explico a Sofía así.»"] }],
          next: [{ to: "d5" }],
          evidence: [
            { dim: "consecuencias", level: 3, basis: "Defendió la decisión con su costo y su límite claros.", when: { any: ["q:margen", "q:plazo", "a:lucia"] } },
            { dim: "consecuencias", level: 2, basis: "Defendió la decisión sin haber revisado los números de Finanzas.", when: { none: ["q:margen", "q:plazo", "a:lucia"] } },
          ] },
        { id: "revision", text: "Agregar una cláusula: revisión a los 6 meses con datos de sell-out; si la promoción no rota, se ajusta.", set: { revision: 6 }, flags: ["revision"],
          reply: [{ text: ["Lucía: «Eso me deja dormir. Si no funciona, hay salida.»"] }],
          next: [{ to: "d5" }],
          evidence: [{ dim: "riesgos", level: 3, basis: "Agregó un punto de revisión con datos para corregir a tiempo." }] },
        { id: "delegar", text: "Pedir a Héctor que cierre con Sofía y a Lucía que modele el impacto; yo reviso antes de firmar.", flags: ["delegado"], trust: 1,
          reply: [
            { when: { all: ["comio"] }, text: ["Héctor: «Déjamelo. A Sofía la conozco desde que era practicante.»", "Lucía: «Te mando el modelo hoy en la noche.»"] },
            { text: ["Héctor: «Ok… lo intento.»", "Lucía: «Te mando el modelo hoy en la noche.»"] },
          ],
          next: [{ to: "d5" }],
          evidence: [
            { dim: "ejecucion", level: 3, basis: "Delegó en quien tiene la relación y mantuvo la revisión final.", when: { all: ["comio"] } },
            { dim: "ejecucion", level: 2, basis: "Delegó con revisión final, aunque Héctor todavía no está de tu lado.", when: { none: ["comio"] } },
          ],
          commitments: [{ id: "sn-hector-cierra", text: "Héctor cierra con Sofía; tú revisas antes de firmar.", owner: "hector" }, { id: "sn-lucia-modelo", text: "Lucía modela el impacto en margen y caja.", owner: "lucia" }] },
        { id: "ceder", text: "Ceder más descuento para no perder la cuenta.", requires: { all: ["brecha>0"] }, params: [{ ...TERMS_PARAMS.descuento, default: 3 }],
          reply: [{ text: ["Lucía: «Es tu decisión. Que conste que no me gusta.»"] }],
          next: [{ to: "d5" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "Cedió bajo presión interna, sin información nueva." }] },
      ],
    },
    d5: {
      id: "d5", stage: "Cierre", who: "sofia", channel: "llamada",
      say: [
        { when: { all: ["estado=2"] }, text: ["Sofía: «Con esto lo puedo subir con mi gerente. ¿Cómo lo formalizamos?»"] },
        { when: { all: ["estado=1"] }, text: ["Sofía: «Puedo aceptar, pero les retiro un frente en 40 tiendas hasta ver resultados. Es lo máximo que puedo hacer.»"] },
        { text: ["Sofía: «No me alcanza, Director. Si no hay más, asigno un frente a la regional a partir del día 1.»"] },
      ],
      ask: "Momento de cerrar. ¿Qué decides?", freeText: true,
      strategies: [
        firmar,
        { id: "ultima", text: "Una última concesión para cerrar ya.", cues: ["ultim*", "concesion", "un poquito mas", "un punto", "cedo", "para que firmen", "empujon"], requires: { all: ["brecha>0"] }, params: [{ ...TERMS_PARAMS.descuento, default: 3 }],
          reply: [{ when: { all: ["estado=2"] }, text: ["Trato hecho, Director. Con {t:descuento} lo firmo."] }, { when: { all: ["estado=1"] }, text: ["Con {t:descuento} acepto, con un frente menos en 40 tiendas."] }, { text: ["Lo siento, Director. Aun así no me alcanza."] }],
          next: [{ when: { all: ["estado>=1"], none: ["delegado"] }, to: "d6" }, { to: "close" }],
          evidence: [{ dim: "negociacion", level: 1, basis: "Cerró cediendo al final, sin contrapartida." }] },
        { id: "alternativa", text: "Aceptar perder un frente en parte de las tiendas y activar la plática con la cadena regional de 300 tiendas.", requires: { all: ["estado<=1"] }, flags: ["alternativa"],
          reply: [{ text: ["Entiendo, Director. Sin rencores; el anaquel se puede recuperar con resultados."] }],
          next: [{ to: "close" }],
          evidence: [
            { dim: "alternativas", level: 3, basis: "Activó una alternativa real que conocía, sin alardear.", when: { all: ["q:alternativas"] } },
            { dim: "alternativas", level: 1, basis: "Apostó por una alternativa sin saber qué tan avanzada está.", when: { none: ["q:alternativas"] } },
          ],
          commitments: [{ id: "sn-canal", text: "Héctor activa la plática con la cadena regional de 300 tiendas.", owner: "hector" }],
          risks: [{ id: "sn-canal-incierto", text: "La cadena regional no tiene fecha: recuperar las ventas puede tardar meses.", owner: "hector" }] },
        noFirmar,
      ],
    },
    d6: {
      id: "d6", stage: "Plan", who: "hector", channel: "whatsapp",
      say: [{ text: ["Héctor: «Ya está el acuerdo. ¿Cómo le damos seguimiento? Sofía va a preguntar por resultados en un mes.»"] }],
      ask: "¿Cómo aseguras que el acuerdo se cumpla?", freeText: true,
      strategies: [
        { id: "tablero", text: "Ana arma un tablero semanal de sell-out por tienda; Héctor responde ante Sofía y lo revisamos cada mes en comité.", cues: ["tablero", "indicador*", "semana*", "comite", "reporte*", "medimos", "medir", "metrica*", "kpi*", "con datos", "mensual*", "cada mes"], flags: ["tablero"],
          reply: [{ text: ["Va. Ana ya tiene medio armado algo parecido para Diego.", "Lo presentamos en el comité del mes."] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 3, basis: "Dueño claro, métrica semanal y revisión periódica." }],
          commitments: [{ id: "sn-tablero", text: "Ana entrega el tablero semanal de sell-out por tienda.", owner: "ana" }, { id: "sn-responsable", text: "Héctor responde ante Sofía por las metas por tienda.", owner: "hector" }] },
        { id: "como_siempre", text: "Que Héctor lo lleve como siempre; él conoce la cuenta.", cues: ["hector", "como siempre", "igual", "como lo ha hecho", "como se ha hecho"], flags: ["sin_metrica"],
          reply: [{ text: ["Ok. Yo me encargo."] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 1, basis: "Hay un responsable, pero sin métrica ni revisión." }],
          risks: [{ id: "sn-sin-metrica", text: "Nadie mide la promoción por tienda: no sabrás si funciona hasta que sea tarde.", owner: "hector" }] },
        { id: "yo", text: "Lo llevo yo personalmente con Sofía.", cues: ["yo", "personalmente", "en persona", "me encargo"], flags: ["ceo_lleva"],
          reply: [{ text: ["…Ok. Como veas.", "(Héctor no vuelve a mencionar la cuenta en el comité.)"] }],
          next: [{ to: "close" }],
          evidence: [{ dim: "ejecucion", level: 1, basis: "Centralizó en el Director General un seguimiento que corresponde a Comercial." }],
          risks: [{ id: "sn-cuello", text: "El seguimiento depende de tu agenda y Héctor se siente desplazado.", owner: "ceo" }] },
      ],
    },
  },
  followUps: [
    { id: "sn-anaquel", when: { all: ["estado=0"] }, afterDays: 4, from: "sofia", subject: "Reasignación de espacio en anaquel",
      text: [{ text: ["Director: le informo que a partir del día 1 reasignamos uno de sus dos frentes en las 140 tiendas.", "Lamentamos no haber encontrado un punto de acuerdo."] }] },
    { id: "sn-sellout", when: { all: ["estado>=1"], any: ["promo>0", "volumen>0"] }, afterDays: 21, from: "lucia", subject: "Primer corte de la promoción con SuperNorte",
      text: [
        { when: { all: ["tablero"] }, text: ["Ana ya tiene el tablero por tienda: la promoción rota 9% arriba en 31 de 40 tiendas. Sofía pidió la misma mecánica para otra categoría."] },
        { text: ["Sofía pregunta cómo va la promoción y no tenemos el dato por tienda. Nadie lo está midiendo."] },
      ] },
    { id: "sn-caja", when: { all: ["estado>=1", "plazo>60"] }, afterDays: 30, from: "lucia", subject: "El plazo de SuperNorte ya pega en caja",
      text: [{ text: ["Primer mes a {t:plazo}: usamos ${t:wc} de la línea. Si Mercados del Valle se atrasa, no tenemos colchón."] }] },
    { id: "sn-precedente", when: { all: ["estado>=1", "descuento>=3"] }, afterDays: 14, from: "hector", subject: "Otras cadenas se enteraron",
      text: [{ text: ["Mercados del Valle se enteró de los {t:descuento} de SuperNorte y pide lo mismo. Te paso su correo."] }] },
    { id: "sn-revision", when: { all: ["revision>0", "estado>=1"] }, afterDays: 180, from: "hector", subject: "Revisión semestral con SuperNorte",
      text: [{ text: ["Toca la revisión que pactamos a los {t:revision}. Llevo el sell-out por tienda."] }] },
    { id: "sn-canal", when: { all: ["alternativa"] }, afterDays: 30, from: "hector", subject: "La cadena regional de 300 tiendas",
      text: [{ when: { all: ["q:alternativas"] }, text: ["Tuvimos la primera junta. Quieren un piloto en 50 tiendas para el siguiente trimestre."] }, { text: ["La cadena regional todavía no da fecha. Seguimos insistiendo."] }] },
  ],
  rules: "supernorte-v1",
};
