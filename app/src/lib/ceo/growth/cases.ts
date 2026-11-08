/**
 * mêtis CEO · Growth Engine · casos con precondiciones estructurales y cadenas piloto (fase 2).
 *
 * Reglas (condiciones de Oziel):
 *  - Cada caso declara `requires`: solo llega si la empresa REAL cumple (plantilla, puestos, sucursales, activos,
 *    producción propia, contratos, liquidez). El evaluador es puro y se prueba.
 *  - Cada opción se traduce a comandos del motor. Los montos (salarios, rentas, cotizaciones del banco) salen del
 *    catálogo, de la plantilla o de las cotizaciones del motor; la IA puede reescribir el texto, nunca las cifras.
 *  - Una opción que no es compatible con el estado (no hay caja para el depósito, el banco no presta) se muestra
 *    deshabilitada con la razón calculada por el motor, nunca se inventa una alternativa.
 *  - Encadenamiento: `after` exige que un caso anterior se haya decidido con ciertas opciones.
 *  - Equipo, Clientes y Consejo pueden llevar un efecto editorial pequeño (`effects`); Caja y Margen NUNCA: salen del motor.
 */
import { roleById } from "./catalog";
import { activePeople, capacityNow, headcount } from "./engine";
import { fmt, quoteCollect, quoteLoan, quoteOwner, quoteSuppliers } from "./finance";
import { overdueTotal } from "./core";
import { regionOf, regionalSalary } from "./labor";
import type { Command, Family, GrowthState } from "./types";
import { lineIdOf, profileOf, type LineId } from "./models";
import type { Area } from "../types";
import { OPS_CASES } from "./opscases";
import type { KpiKey } from "../types";

// ───────────────────────────────────────────────── precondiciones
export interface Requires {
  family?: Family;
  /** Línea de negocio dentro de la familia (estampado, acería…): un caso de troqueles no llega a una acería. */
  line?: LineId;
  minHeadcount?: number;
  maxHeadcount?: number;
  /** Sucursales o plantas operando. */
  minSites?: number;
  maxSites?: number;
  /** Puestos que deben existir (al menos uno activo) o no existir. */
  roles?: string[];
  noRoles?: string[];
  /** Activo mínimo en la sede principal (mesas, prensa). */
  asset?: { resource: string; min: number };
  /** Produce con su propia planta (manufactura). */
  ownProduction?: boolean;
  /** La demanda o los contratos superan la capacidad en el último mes (pedidos perdidos o atrasos). */
  capacityPressure?: boolean;
  liquidity?: ("sana" | "alerta" | "crisis")[];
  /** Caja mínima disponible (pesos). */
  minCash?: number;
  /** Día simulado mínimo. */
  minDay?: number;
  /** Debe existir (no cerrada) una sede creada por la decisión de este caso. */
  siteFromCase?: string;
  /** Día simulado máximo (ofertas con vigencia). */
  maxDay?: number;
  /** Condición calculada por el motor (p. ej. «hay una sede saturada»). La etiqueta se reporta si no se cumple. */
  when?: { label: string; test: (g: GrowthState) => boolean };
}

export interface Check { ok: boolean; failed: string[] }

export function requiresMet(g: GrowthState, r: Requires): Check {
  const failed: string[] = [];
  const hc = headcount(g);
  const sites = g.sites.filter((x) => x.status === "operando").length;
  const has = (id: string) => activePeople(g).some((p) => p.roleId === id);
  const last = g.months.at(-1);
  if ((r.family && g.family !== r.family) || (r.line && lineIdOf(g) !== r.line)) failed.push("industria");
  if (r.minHeadcount !== undefined && hc < r.minHeadcount) failed.push(`plantilla ≥ ${r.minHeadcount}`);
  if (r.maxHeadcount !== undefined && hc > r.maxHeadcount) failed.push(`plantilla ≤ ${r.maxHeadcount}`);
  if (r.minSites !== undefined && sites < r.minSites) failed.push(`sedes ≥ ${r.minSites}`);
  if (r.maxSites !== undefined && sites > r.maxSites) failed.push(`sedes ≤ ${r.maxSites}`);
  for (const id of r.roles ?? []) if (!has(id)) failed.push(`puesto ${id}`);
  for (const id of r.noRoles ?? []) if (has(id)) failed.push(`sin puesto ${id}`);
  if (r.asset) { const main = g.sites.find((x) => x.status === "operando"); if (!main || (main.assets[r.asset.resource] ?? 0) < r.asset.min) failed.push(`${r.asset.resource} ≥ ${r.asset.min}`); }
  if (r.ownProduction && profileOf(g).mode !== "contratos") failed.push("producción propia");
  if (r.capacityPressure && !(last && last.lost + Math.max(0, last.demand - last.served) > 0.02 * Math.max(1, last.demand))) failed.push("presión de capacidad");
  if (r.liquidity && !r.liquidity.includes(g.liquidity.status)) failed.push(`liquidez ${r.liquidity.join("/")}`);
  if (r.minCash !== undefined && g.cash < r.minCash * 100) failed.push(`caja ≥ ${r.minCash}`);
  if (r.minDay !== undefined && g.day < r.minDay) failed.push(`día ≥ ${r.minDay}`);
  if (r.maxDay !== undefined && g.day > r.maxDay) failed.push(`día ≤ ${r.maxDay}`);
  if (r.when && !r.when.test(g)) failed.push(r.when.label);
  if (r.siteFromCase && !g.sites.some((x) => x.status !== "cerrada" && x.ref?.startsWith(`${r.siteFromCase}:`))) failed.push(`sede de ${r.siteFromCase}`);
  return { ok: failed.length === 0, failed };
}

// ───────────────────────────────────────────────── casos
export interface GOption {
  id: string;
  text: string;
  /** Texto calculado con el estado (p. ej. el puesto o la zona). Si existe, reemplaza a `text` en pantalla. */
  textOf?: (g: GrowthState) => string;
  /** Etiqueta corta para la tarjeta minimalista (2–4 palabras). */
  short?: string | ((g: GrowthState) => string);
  /** Cómo se presenta: una llamada con el banco o una opción normal. */
  via?: "banco";
  /** Lo que cambia, en una línea (texto; las cifras se insertan desde el motor). */
  outcome: (g: GrowthState) => string;
  commands: (g: GrowthState, caseId: string) => Command[];
  /** Disponibilidad calculada por el motor (caja, cotizaciones, requisitos del puesto). */
  available?: (g: GrowthState) => { ok: boolean; reason?: string };
  /** Solo Equipo, Clientes y Consejo, pequeño (±1–3). Caja y Margen salen del motor. */
  effects?: Partial<Record<Exclude<KpiKey, "caja" | "margen">, number>>;
  score: 0 | 1 | 2 | 3;
}
/** Función directiva que ejerce quien decide el caso. */
export type Funcion = "direccion_general" | "finanzas" | "operaciones" | "personas" | "comercial";
/**
 * Etiquetas del caso (decisión de Oziel): industria, función directiva y competencias que pone a prueba.
 * La industria se deduce de la familia y la línea del caso (`industryTagOf`); función y competencias se declaran.
 */
export interface CaseTags { funcion: Funcion; competencias: readonly Area[] }

export interface GCase {
  id: string;
  tags: CaseTags;
  /** Principio que enseña el caso: lo que un director con oficio sabe de este tipo de decisión (una o dos frases). */
  lesson: string;
  family: Family | "ambas";
  chain: "A" | "B" | "C" | "liquidez" | "finanzas" | "operacion";
  step: number;
  from: string;
  subject: string;
  /** Una línea para la tarjeta minimalista; el cuerpo completo queda en «Ver detalle». */
  lead?: (g: GrowthState) => string;
  /** Asunto calculado con el estado (sede, puesto). */
  subjectOf?: (g: GrowthState) => string;
  /** Remitente calculado con el estado. */
  fromOf?: (g: GrowthState) => string;
  body: (g: GrowthState) => string[];
  data?: (g: GrowthState) => [string, string][];
  requires: Requires;
  after?: { case: string; options: string[] };
  options: GOption[];
  /** Días simulados que pasan después de decidir, antes de que se vea el resultado. */
  waitDays: number;
  /** Puede repetirse (crisis de liquidez): se identifica por el día en que llega. */
  repeatable?: boolean;
  /** No llega el mismo día que alguno de estos casos (para no duplicar la misma decisión). */
  notWith?: string[];
}

const sal = (g: GrowthState, roleId: string) => regionalSalary(roleById(roleId)!.salary.mid, regionOf(g.region));
const site0 = (g: GrowthState) => g.sites.find((x) => x.status === "operando")!;
const lastM = (g: GrowthState) => g.months.at(-1);
const cashOk = (need: number) => (g: GrowthState) => g.cash >= need * 100 ? { ok: true } : { ok: false, reason: `Requiere $${need.toLocaleString("en-US")} disponibles hoy; la caja tiene $${fmt(g.cash)}.` };

type SiteOffer = Omit<Extract<Command, { type: "open_site" }>, "type" | "id">;
/** Sucursal Cumbres (cadena A): cifras de la propuesta del arrendador y del contratista, fijas en el caso. */
export const CUMBRES: Readonly<SiteOffer> = Object.freeze({ name: "Sucursal Cumbres", zone: "cumbres", rent: 52000, utilities: 22000, deposit: 104000, capex: 260000, years: 8, buildDays: 45, assets: { mesas: 14 }, demandBase: 95, maturityDays: 150, preopening: 55000 });
const cumbres = (caseId: string, extra: Partial<SiteOffer> = {}): Command => ({ type: "open_site", id: `${caseId}:site`, ...CUMBRES, ...extra });
const upfront = CUMBRES.deposit + CUMBRES.capex;
/** Marcador: la sede que crea la misma decisión (el runner lo resuelve después de aplicar `open_site`). */
export const NEW_SITE = "@sede_nueva";

export const CHAIN_A: readonly GCase[] = [
  {
    id: "ga1_cocina", tags: { funcion: "operaciones", competencias: ["operacion","personas"] }, lesson: "Antes de agregar estructura, resuelve el cuello de botella con la pieza más barata que lo destraba. Un mando nuevo ordena, pero no cocina más rápido.", family: "restaurante", chain: "A", step: 1, from: "Mariana Treviño · Gerente de sucursal", waitDays: 30,
    subject: "Los viernes la cocina no da",
    body: (g) => {
      const m = lastM(g); const c = capacityNow(g)[0];
      return [
        "Los viernes y sábados la gente espera más de 40 minutos y algunos se van antes de ordenar. La cocina saca lo que puede; el cuello de botella es la línea caliente.",
        m ? `El mes pasado se dejaron de atender unos ${m.lost.toLocaleString("en-US")} pedidos (${Math.round((100 * m.lost) / Math.max(1, m.demand))} % de la demanda).` : "Todavía no cierra el primer mes, pero el patrón ya se ve.",
        c ? `Hoy la cocina alcanza para unos ${c.cap.cocina} pedidos al día y el servicio para ${c.cap.servicio}.` : "",
      ].filter(Boolean);
    },
    data: (g) => [["Cocinero de línea (Monterrey)", `$${fmt(sal(g, "cocinero"))} brutos al mes`], ["Jefe de cocina", `$${fmt(sal(g, "jefe_cocina"))} brutos al mes`], ["Plantilla actual", `${headcount(g)} personas`]],
    requires: { family: "restaurante", maxSites: 1, maxHeadcount: 14, noRoles: ["jefe_cocina"] },
    options: [
      { id: "cocinero", text: "Contratar un cocinero de línea más", score: 3, effects: { equipo: 1 },
        outcome: (g) => `Se abre la vacante: unas dos semanas para cubrirla y tres más para que rinda. Costo: $${fmt(sal(g, "cocinero"))} brutos al mes más carga social.`,
        commands: (_g, c) => [{ type: "hire", id: `${c}:h1`, roleId: "cocinero", siteId: "centro" }] },
      { id: "jefe", text: "Contratar un jefe de cocina que ordene la línea", score: 1, effects: { equipo: 1 },
        outcome: (g) => `Mando en cocina y algo más de capacidad, pero tarda casi un mes en llegar y cuesta $${fmt(sal(g, "jefe_cocina"))} al mes: más caro que un cocinero para resolver el mismo cuello de botella.`,
        commands: (_g, c) => [{ type: "hire", id: `${c}:h1`, roleId: "jefe_cocina", siteId: "centro" }] },
      { id: "esperar", text: "Aguantar con el equipo actual y medir un mes más", score: 1, effects: { clientes: -1 },
        outcome: () => "No se gasta más, pero se siguen perdiendo pedidos en las horas pico y la reputación lo resiente poco a poco.",
        commands: () => [] },
    ],
  },
  {
    id: "ga2_sucursal", tags: { funcion: "direccion_general", competencias: ["estrategia","finanzas","negociacion"] }, lesson: "Una sede nueva cuesta desde la firma y vende meses después. Negociar el tiempo (gracia de renta) vale tanto como negociar el precio.", family: "restaurante", chain: "A", step: 2, from: "Don Ignacio · Dueño", waitDays: 14,
    subject: "Un local en Cumbres",
    after: { case: "ga1_cocina", options: ["cocinero", "jefe", "esperar"] },
    body: (g) => [
      "Me ofrecen un local en Cumbres, cerca de dos escuelas y una plaza nueva. El arrendador quiere firmar este mes.",
      `Pide dos meses de depósito y la obra cuesta unos $${CUMBRES.capex.toLocaleString("en-US")}. Tardaría unas seis semanas y la renta corre desde la firma.`,
      `Hoy tenemos $${fmt(g.cash)} en caja. Tú decides si es el momento.`,
    ],
    data: () => [["Renta mensual", `$${CUMBRES.rent.toLocaleString("en-US")}`], ["Depósito + obra", `$${upfront.toLocaleString("en-US")}`], ["Preapertura (capacitación, insumos, lanzamiento)", `$${CUMBRES.preopening.toLocaleString("en-US")}`], ["Demanda madura estimada", `${CUMBRES.demandBase} pedidos al día en unos 5 meses`]],
    requires: { family: "restaurante", maxSites: 1, minHeadcount: 9 },
    options: [
      { id: "abrir", text: "Firmar ya y abrir la vacante del gerente al mismo tiempo", score: 2, available: cashOk(upfront),
        outcome: () => "Se firma hoy. La sucursal no podrá abrir sin gerente ni equipo: hay que contratar a tiempo para que la renta no corra en vacío.",
        commands: (_g, c) => [cumbres(c), { type: "hire", id: `${c}:gerente`, roleId: "gerente_sucursal", siteId: NEW_SITE }] },
      { id: "gerente_primero", text: "Negociar dos meses sin renta durante la obra y reclutar ya al gerente", score: 3, effects: { consejo: 1 },
        available: cashOk(upfront + CUMBRES.rent),
        outcome: () => `El arrendador acepta 60 días sin renta mientras se acondiciona, a cambio de un mes más de depósito ($${CUMBRES.rent.toLocaleString("en-US")}). La vacante del gerente se abre hoy.`,
        commands: (_g, c) => [cumbres(c, { deposit: CUMBRES.deposit + CUMBRES.rent, rentFreeDays: 60 }), { type: "hire", id: `${c}:gerente`, roleId: "gerente_sucursal", siteId: NEW_SITE }] },
      { id: "no", text: "Dejar pasar el local: primero estabilizar Centro", score: 2, effects: { consejo: -1 },
        outcome: () => "No se compromete caja. Don Ignacio lo acepta, aunque deja claro que la oportunidad no regresará.",
        commands: () => [] },
    ],
  },
  {
    id: "ga3_equipo", tags: { funcion: "personas", competencias: ["personas","operacion"] }, lesson: "Abrir con lo mínimo ahorra nómina pero satura desde el primer fin de semana. El equipo de apertura se dimensiona para la demanda que viene, no para la de hoy.", family: "restaurante", chain: "A", step: 3, from: "Mariana Treviño · Gerente de sucursal", waitDays: 45,
    subject: "¿Con quién abrimos Cumbres?",
    after: { case: "ga2_sucursal", options: ["abrir", "gerente_primero"] },
    body: (g) => {
      const s = g.sites.find((x) => x.ref?.startsWith("ga2_sucursal"));
      return [
        `${s?.name ?? "La sucursal"} va a necesitar cocina, servicio y loza desde el primer día. Sin ese mínimo no puede abrir.`,
        "Podemos contratar todo el equipo nuevo o mandar a dos de mis mejores cocineros y cubrir Centro con gente nueva. Lo segundo abre mejor, pero Centro se resiente unas semanas.",
      ];
    },
    data: (g) => [["Cocinero", `$${fmt(sal(g, "cocinero"))}`], ["Mesero", `$${fmt(sal(g, "mesero"))}`], ["Lavaloza", `$${fmt(sal(g, "lavaloza"))}`]],
    requires: { family: "restaurante", siteFromCase: "ga2_sucursal" },
    options: [
      { id: "completo", text: "Contratar el equipo completo para la nueva sucursal (3 cocina, 2 servicio, loza)", score: 3, effects: { equipo: 1 },
        outcome: (g) => `Seis vacantes: la nómina sube unos $${fmt(3 * sal(g, "cocinero") + 2 * sal(g, "mesero") + sal(g, "lavaloza"))} brutos al mes desde que llegan, antes de vender.`,
        commands: (g, c) => { const sid = g.sites.find((x) => x.ref?.startsWith("ga2_sucursal"))!.id; return [...["cocinero", "cocinero", "cocinero", "mesero", "mesero", "lavaloza"].map((roleId, i) => ({ type: "hire" as const, id: `${c}:h${i}`, roleId, siteId: sid }))]; } },
      { id: "minimo", text: "Abrir con lo mínimo (2 cocina, 1 servicio, loza) y crecer según la demanda", score: 2,
        outcome: () => "Menos nómina mientras madura la demanda, pero en los fines de semana la nueva sucursal se va a saturar pronto.",
        commands: (g, c) => { const sid = g.sites.find((x) => x.ref?.startsWith("ga2_sucursal"))!.id; return ["cocinero", "cocinero", "mesero", "lavaloza"].map((roleId, i) => ({ type: "hire" as const, id: `${c}:h${i}`, roleId, siteId: sid })); } },
      { id: "posponer", text: "Posponer 60 días la obra para cuidar la caja", score: 1, effects: { consejo: -1 },
        available: (g) => { const s = g.sites.find((x) => x.ref?.startsWith("ga2_sucursal")); return s?.status === "en_obra" ? { ok: true } : { ok: false, reason: "La obra ya terminó: ya no se puede posponer." }; },
        outcome: () => "Se recorren los pagos de la obra y la preapertura, con penalidad del contratista. La renta sigue corriendo.",
        commands: (g, c) => [{ type: "defer_site", id: `${c}:d`, siteId: g.sites.find((x) => x.ref?.startsWith("ga2_sucursal"))!.id, days: 60 }] },
    ],
  },
];

/** Cliente nuevo de la cadena B: volumen y precio de la cotización que pidió el cliente (fijos en el caso). */
export const NUEVO_CLIENTE = Object.freeze({ client: "Ensambladora Saltillo", unitsPerDay: 2600, price: 9.6, startInDays: 30 });

export const CHAIN_B: readonly GCase[] = [
  {
    id: "gb1_cliente", tags: { funcion: "comercial", competencias: ["clientes","estrategia","operacion"] }, lesson: "Un pedido vale lo que la planta puede cumplir. Aceptar todo solo es buen negocio si la capacidad llega antes que la primera entrega.", family: "manufactura", chain: "B", step: 1, from: "Claudia Mier · Administración", waitDays: 20,
    subject: "Un cliente nuevo quiere 2,600 piezas al día",
    body: (g) => {
      const c = capacityNow(g)[0];
      const daily = g.contracts.reduce((a, x) => a + x.unitsPerDay, 0);
      return [
        `${NUEVO_CLIENTE.client} pide cotización para ${NUEVO_CLIENTE.unitsPerDay.toLocaleString("en-US")} piezas diarias a $${NUEVO_CLIENTE.price} cada una, a partir del próximo mes, con pago a 45 días.`,
        `Hoy entregamos ${daily.toLocaleString("en-US")} piezas al día y la planta da para unas ${c?.perDay.toLocaleString("en-US") ?? "—"} con un turno. El cuello de botella es ${c?.bottleneck === "prensa" ? "el tiempo de prensa" : "la gente en línea"}.`,
        "Si aceptamos y no cumplimos, la multa es perder el cliente y la reputación con la armadora.",
      ];
    },
    data: (g) => { const c = capacityNow(g)[0]; return [["Capacidad actual (1 turno)", `${c?.perDay.toLocaleString("en-US")} piezas/día`], ["Pedido nuevo", `${NUEVO_CLIENTE.unitsPerDay.toLocaleString("en-US")} piezas/día`], ["Precio", `$${NUEVO_CLIENTE.price} por pieza`], ["Cobro", "45 días"]]; },
    requires: { family: "manufactura", line: "estampado", ownProduction: true, minSites: 1, maxHeadcount: 30 },
    options: [
      { id: "aceptar", text: "Aceptar todo el volumen", score: 3, effects: { clientes: 1 },
        outcome: () => "Se firma desde dentro de 30 días. Es el mejor negocio solo si la capacidad llega a tiempo: sin ella habrá atrasos, penalizaciones y riesgo de cancelación.",
        commands: (_g, c) => [{ type: "add_contract", id: `${c}:k`, ...NUEVO_CLIENTE }] },
      { id: "parcial", text: "Aceptar 1,200 piezas al día y crecer después", score: 2,
        outcome: () => "El cliente acepta empezar con menos. La planta lo absorbe con el turno actual y deja margen para crecer.",
        commands: (_g, c) => [{ type: "add_contract", id: `${c}:k`, ...NUEVO_CLIENTE, unitsPerDay: 1200 }] },
      { id: "declinar", text: "Declinar: no hay capacidad", score: 1, effects: { clientes: -1, consejo: -1 },
        outcome: () => "No hay riesgo operativo, pero el consejo pregunta por qué no se preparó la planta para crecer.",
        commands: () => [] },
    ],
  },
  {
    id: "gb2_capacidad", tags: { funcion: "operaciones", competencias: ["operacion","finanzas"] }, lesson: "Cuando el límite es la gente y no la máquina, un turno más rinde más que un activo nuevo y no compromete la caja.", family: "manufactura", chain: "B", step: 2, from: "Arturo Elizondo · Supervisor de producción", waitDays: 45,
    subject: "La planta no da con un solo turno",
    after: { case: "gb1_cliente", options: ["aceptar", "parcial"] },
    body: (g) => {
      const m = lastM(g); const c = capacityNow(g)[0];
      return [
        `Producimos ${c?.perDay.toLocaleString("en-US")} piezas al día y nos piden ${g.contracts.filter((x) => x.startDay <= g.day + 30).reduce((a, x) => a + x.unitsPerDay, 0).toLocaleString("en-US")}.`,
        m && m.lost ? `El mes pasado se perdieron ${m.lost.toLocaleString("en-US")} piezas por falta de capacidad.` : "Todavía no se pierden piezas, pero en cuanto arranque el contrato nuevo no vamos a alcanzar.",
        "Un segundo turno necesita su propio supervisor y operadores. Una prensa más tarda mes y medio y no sirve sin gente.",
      ];
    },
    data: (g) => [["Supervisor", `$${fmt(sal(g, "supervisor_produccion"))}`], ["Operador", `$${fmt(sal(g, "operador"))}`], ["Prensa de 200 t", "$900,000 (entrega 45 días)"]],
    requires: { family: "manufactura", line: "estampado", ownProduction: true },
    options: [
      { id: "turno", text: "Abrir segundo turno: un supervisor y cuatro operadores", score: 3, effects: { equipo: 1 },
        outcome: (g) => `Cinco vacantes; la nómina sube unos $${fmt(sal(g, "supervisor_produccion") + 4 * sal(g, "operador"))} brutos al mes. Los operadores nuevos generan más desperdicio mientras aprenden.`,
        commands: (_g, c) => [{ type: "set_shifts", id: `${c}:t`, siteId: "planta", shifts: 2 }, { type: "hire", id: `${c}:s`, roleId: "supervisor_produccion", siteId: "planta" }, ...[0, 1, 2, 3].map((i) => ({ type: "hire" as const, id: `${c}:o${i}`, roleId: "operador", siteId: "planta" }))] },
      { id: "prensa", text: "Comprar una prensa más y contratar dos operadores", score: 1, available: cashOk(900000),
        outcome: () => "La prensa consume $900,000 de caja hoy. Sin segundo turno, la gente sigue siendo el límite.",
        commands: (_g, c) => [{ type: "add_asset", id: `${c}:p`, siteId: "planta", label: "Prensa de 200 t", resource: "prensa", units: 1, cost: 900000, years: 10, leadDays: 45 }, { type: "hire", id: `${c}:o0`, roleId: "operador", siteId: "planta" }, { type: "hire", id: `${c}:o1`, roleId: "operador", siteId: "planta" }] },
      { id: "nada", text: "Sacar lo que se pueda con el turno actual", score: 0, effects: { clientes: -2, equipo: -1 },
        outcome: () => "Se acumulan atrasos y piezas perdidas; el cliente nuevo empieza a cuestionar el contrato.",
        commands: () => [] },
    ],
  },
  {
    id: "gb3_calidad", tags: { funcion: "operaciones", competencias: ["operacion","personas"] }, lesson: "El desperdicio de la gente nueva se paga en material. Un especialista que enseña en piso reduce la curva; un inspector más solo la mide.", family: "manufactura", chain: "B", step: 3, from: "Karla Benavides · Calidad", waitDays: 30,
    subject: "El desperdicio subió con la gente nueva",
    after: { case: "gb2_capacidad", options: ["turno", "prensa"] },
    body: (g) => { const m = lastM(g); return [m ? `El mes pasado se desperdiciaron ${m.scrap.toLocaleString("en-US")} piezas (${((100 * m.scrap) / Math.max(1, m.served + m.scrap)).toFixed(1)} % de lo producido).` : "El desperdicio está subiendo.", "Los operadores nuevos todavía no dominan los troqueles. Puedo entrenarlos en piso, pero sola no alcanzo a cubrir dos turnos."]; },
    requires: { family: "manufactura", line: "estampado", minHeadcount: 17 },
    options: [
      { id: "inspector", text: "Contratar un segundo inspector de calidad", score: 1, outcome: (g) => `Un inspector más cuesta $${fmt(sal(g, "inspector_calidad"))} al mes y llega en unas tres semanas.`, commands: (_g, c) => [{ type: "hire", id: `${c}:i`, roleId: "inspector_calidad", siteId: "planta" }] },
      { id: "cnc", text: "Contratar un ajustador de troqueles con experiencia", score: 3, effects: { equipo: 1 }, outcome: (g) => `Sube la capacidad y baja el desperdicio cuando termina su curva; cuesta $${fmt(sal(g, "operador_cnc"))} al mes.`, commands: (_g, c) => [{ type: "hire", id: `${c}:c`, roleId: "operador_cnc", siteId: "planta" }] },
      { id: "esperar", text: "Esperar a que la curva de aprendizaje haga su trabajo", score: 2, outcome: () => "El desperdicio baja solo conforme aprenden, pero el material perdido se paga mientras tanto.", commands: () => [] },
    ],
  },
];

/** Cliente nuevo de la cadena C (acería): volumen y precio de la cotización, fijos en el caso. */
export const NUEVO_CLIENTE_ACERO = Object.freeze({ client: "Desarrollos Industriales del Bajío", unitsPerDay: 8, price: 15500, startInDays: 30 });
/** Horno de inducción adicional (cotización del proveedor, fija en el caso). */
export const HORNO = Object.freeze({ label: "Horno de inducción de 8 t", cost: 4200000, years: 15, leadDays: 75 });
const tons = (n: number) => `${n.toLocaleString("en-US")} t`;

export const CHAIN_C: readonly GCase[] = [
  {
    id: "gc1_cliente", tags: { funcion: "comercial", competencias: ["clientes", "estrategia", "operacion"] }, lesson: "En acero el margen por tonelada es corto: un pedido grande a precio bajo solo conviene si llena capacidad que ya pagas. Si obliga a invertir, el precio tiene que cubrir esa inversión.",
    family: "manufactura", chain: "C", step: 1, from: "Lucía Sáenz · Administración", waitDays: 20,
    subject: "Una constructora pide 8 toneladas más al día",
    body: (g) => {
      const c = capacityNow(g)[0];
      const daily = g.contracts.reduce((a, x) => a + x.unitsPerDay, 0);
      return [
        `${NUEVO_CLIENTE_ACERO.client} pide varilla: ${NUEVO_CLIENTE_ACERO.unitsPerDay} toneladas diarias a $${NUEVO_CLIENTE_ACERO.price.toLocaleString("en-US")} cada una, desde el próximo mes y con pago a 45 días. Es un precio más bajo que el de nuestros clientes actuales.`,
        `Hoy entregamos ${tons(daily)} al día y la planta da para unas ${c ? tons(c.perDay) : "—"} con un turno. El límite es ${c?.bottleneck === "horno" ? "el tiempo de horno" : "la gente en piso de colada"}.`,
        "La chatarra se paga casi de contado y el cliente paga a 45 días: crecer en toneladas también pide caja.",
      ];
    },
    data: (g) => { const c = capacityNow(g)[0]; return [["Capacidad actual (1 turno)", `${c ? tons(c.perDay) : "—"}/día`], ["Pedido nuevo", `${tons(NUEVO_CLIENTE_ACERO.unitsPerDay)}/día`], ["Precio", `$${NUEVO_CLIENTE_ACERO.price.toLocaleString("en-US")} por tonelada`], ["Chatarra y aleaciones", "$9,700 por tonelada colada"]]; },
    requires: { family: "manufactura", line: "aceria", ownProduction: true, minSites: 1, maxHeadcount: 30 },
    options: [
      { id: "aceptar", text: "Aceptar las 8 toneladas", short: "Aceptar todo", score: 3, effects: { clientes: 1 },
        outcome: () => "Se firma desde dentro de 30 días. Con un turno no alcanza: o se abre otro turno a tiempo o habrá atrasos y penalizaciones.",
        commands: (_g, c) => [{ type: "add_contract", id: `${c}:k`, ...NUEVO_CLIENTE_ACERO }] },
      { id: "parcial", text: "Aceptar 3 toneladas al día por ahora", short: "Aceptar 3 t", score: 2,
        outcome: () => "El cliente acepta empezar con menos. Los hornos lo absorben con el turno actual, sin invertir.",
        commands: (_g, c) => [{ type: "add_contract", id: `${c}:k`, ...NUEVO_CLIENTE_ACERO, unitsPerDay: 3 }] },
      { id: "declinar", text: "Declinar: el precio no deja margen", short: "Declinar", score: 1, effects: { clientes: -1 },
        outcome: () => "No hay riesgo operativo ni de caja, pero la planta se queda con la capacidad ociosa que ya paga.",
        commands: () => [] },
    ],
  },
  {
    id: "gc2_capacidad", tags: { funcion: "operaciones", competencias: ["operacion", "finanzas"] }, lesson: "Un horno es caro y tarda meses en llegar; un turno más usa los hornos que ya tienes. Primero se exprime el activo, después se compra otro.",
    family: "manufactura", chain: "C", step: 2, from: "Rogelio Cantú · Supervisor de producción", waitDays: 45,
    subject: "Los hornos no dan con un solo turno",
    after: { case: "gc1_cliente", options: ["aceptar", "parcial"] },
    body: (g) => {
      const m = lastM(g); const c = capacityNow(g)[0];
      return [
        `Colamos unas ${c ? tons(c.perDay) : "—"} al día y nos piden ${tons(g.contracts.filter((x) => x.startDay <= g.day + 30).reduce((a, x) => a + x.unitsPerDay, 0))}.`,
        m && m.lost ? `El mes pasado se dejaron de entregar ${tons(m.lost)} por falta de capacidad.` : "Todavía no se pierden entregas, pero con el contrato nuevo no vamos a alcanzar.",
        "Un segundo turno necesita su propio supervisor y operadores de horno. Un horno nuevo tarda dos meses y medio y cuesta más de cuatro millones.",
      ];
    },
    data: (g) => [["Supervisor", `$${fmt(sal(g, "supervisor_produccion"))}`], ["Operador de horno", `$${fmt(sal(g, "operador_aceria"))}`], [HORNO.label, `$${HORNO.cost.toLocaleString("en-US")} (entrega ${HORNO.leadDays} días)`]],
    requires: { family: "manufactura", line: "aceria", ownProduction: true },
    options: [
      { id: "turno", text: "Abrir segundo turno: un supervisor y cuatro operadores de horno", short: "Segundo turno", score: 3, effects: { equipo: 1 },
        outcome: (g) => `Cinco vacantes; la nómina sube unos $${fmt(sal(g, "supervisor_produccion") + 4 * sal(g, "operador_aceria"))} brutos al mes. Los operadores nuevos sacan más coladas fuera de norma mientras aprenden.`,
        commands: (_g, c) => [{ type: "set_shifts", id: `${c}:t`, siteId: "planta", shifts: 2 }, { type: "hire", id: `${c}:s`, roleId: "supervisor_produccion", siteId: "planta" }, ...[0, 1, 2, 3].map((i) => ({ type: "hire" as const, id: `${c}:o${i}`, roleId: "operador_aceria", siteId: "planta" }))] },
      { id: "horno", text: "Comprar otro horno y contratar dos operadores", short: "Otro horno", score: 1, available: cashOk(HORNO.cost),
        outcome: () => `El horno consume $${HORNO.cost.toLocaleString("en-US")} de caja hoy y llega en ${HORNO.leadDays} días. Sin segundo turno, la gente sigue siendo el límite.`,
        commands: (_g, c) => [{ type: "add_asset", id: `${c}:h`, siteId: "planta", label: HORNO.label, resource: "horno", units: 1, cost: HORNO.cost, years: HORNO.years, leadDays: HORNO.leadDays }, { type: "hire", id: `${c}:o0`, roleId: "operador_aceria", siteId: "planta" }, { type: "hire", id: `${c}:o1`, roleId: "operador_aceria", siteId: "planta" }] },
      { id: "nada", text: "Sacar lo que se pueda con el turno actual", short: "Aguantar", score: 0, effects: { clientes: -2, equipo: -1 },
        outcome: () => "Se acumulan atrasos; los clientes cobran penalizaciones y el más reciente puede cancelar.",
        commands: () => [] },
    ],
  },
  {
    id: "gc3_calidad", tags: { funcion: "operaciones", competencias: ["operacion", "personas"] }, lesson: "En una acería la calidad la hace quien funde, no quien inspecciona: un maestro fundidor en piso baja el metal fuera de norma y además cuela más.",
    family: "manufactura", chain: "C", step: 3, from: "Ing. Paula Treviño · Metalurgia", waitDays: 30,
    subject: "Suben las coladas fuera de norma",
    after: { case: "gc2_capacidad", options: ["turno", "horno"] },
    body: (g) => { const m = lastM(g); return [m ? `El mes pasado se perdieron ${tons(m.scrap)} entre pérdida metálica y coladas fuera de norma (${((100 * m.scrap) / Math.max(1, m.served + m.scrap)).toFixed(1)} % de lo colado).` : "El metal fuera de norma está subiendo.", "Los operadores nuevos todavía no leen bien el baño. Puedo analizar cada colada, pero sola no alcanzo a cubrir dos turnos."]; },
    data: (g) => [["Metalurgista", `$${fmt(sal(g, "metalurgista"))}`], ["Maestro fundidor", `$${fmt(sal(g, "maestro_fundidor"))}`]],
    requires: { family: "manufactura", line: "aceria", minHeadcount: 18 },
    options: [
      { id: "metalurgista", text: "Contratar un segundo metalurgista", short: "Otro metalurgista", score: 1, outcome: (g) => `Un metalurgista más cuesta $${fmt(sal(g, "metalurgista"))} al mes: mide mejor, pero no cuela más.`, commands: (_g, c) => [{ type: "hire", id: `${c}:m`, roleId: "metalurgista", siteId: "planta" }] },
      { id: "fundidor", text: "Contratar un maestro fundidor con experiencia", short: "Maestro fundidor", score: 3, effects: { equipo: 1 }, outcome: (g) => `Sube la capacidad y enseña en piso; cuesta $${fmt(sal(g, "maestro_fundidor"))} al mes y tarda unas seis semanas en llegar.`, commands: (_g, c) => [{ type: "hire", id: `${c}:f`, roleId: "maestro_fundidor", siteId: "planta" }] },
      { id: "esperar", text: "Esperar a que la curva de aprendizaje haga su trabajo", short: "Esperar", score: 2, outcome: () => "La pérdida baja sola conforme aprenden, pero la chatarra perdida se paga mientras tanto.", commands: () => [] },
    ],
  },
];

/** Crisis de liquidez: las opciones salen de las cotizaciones del motor; las que no proceden aparecen con su razón. */
export const LIQUIDITY_CASE: GCase = {
  id: "gl_liquidez", tags: { funcion: "finanzas", competencias: ["finanzas","negociacion"] }, lesson: "En una crisis de caja se ordena por costo y por relación: primero lo que menos cuesta y menos daña (proveedores, cobranza), al final lo que compromete la confianza del dueño.", family: "ambas", chain: "liquidez", step: 1, from: "Contraloría", waitDays: 14, repeatable: true,
  subject: "La caja no alcanza para lo que viene",
  body: (g) => {
    const od = overdueTotal(g);
    return [
      od > 0 ? `Hay $${fmt(od)} de pagos vencidos. Cada día de atraso tiene un costo: recargos, moratorios, proveedores que cobran de contado y un equipo que se inquieta.` : `La proyección de 13 semanas muestra que en unas ${g.liquidity.shortWeek} semanas no alcanzará para pagar lo que vence: faltarían unos $${fmt(g.liquidity.gap)}.`,
      "No hay un préstamo automático. Estas son las salidas que hoy son viables, con su costo y sus condiciones.",
    ];
  },
  data: (g) => [["Caja disponible", `$${fmt(g.cash)}`], ["Pagos vencidos", `$${fmt(overdueTotal(g))}`], ["Faltante proyectado", `$${fmt(g.liquidity.gap)}`]],
  requires: { liquidity: ["alerta", "crisis"] },
  options: [
    { id: "banco", text: "Pedir un crédito al banco", score: 2,
      available: (g) => { const q = quoteLoan(g); return q.available ? { ok: true } : { ok: false, reason: q.reason }; },
      outcome: (g) => quoteLoan(g).detail || "",
      commands: (g, c) => { const q = quoteLoan(g); return [{ type: "bank_loan", id: `${c}:b`, amount: Math.min(q.amount, Math.max(g.liquidity.gap * 1.3, 50_000_00)) / 100, months: 12 }]; } },
    { id: "proveedores", text: "Negociar 15 días más con proveedores", score: 2,
      available: (g) => { const q = quoteSuppliers(g, 15); return q.available ? { ok: true } : { ok: false, reason: q.reason }; },
      outcome: (g) => quoteSuppliers(g, 15).detail,
      commands: (_g, c) => [{ type: "negotiate_suppliers", id: `${c}:n`, extraDays: 15 }] },
    { id: "factoraje", text: "Adelantar cobranza con factoraje", score: 2,
      available: (g) => { const q = quoteCollect(g, "factoraje"); return q.available ? { ok: true } : { ok: false, reason: q.reason }; },
      outcome: (g) => quoteCollect(g, "factoraje").detail,
      commands: (_g, c) => [{ type: "collect_receivables", id: `${c}:f`, mode: "factoraje" }] },
    { id: "dueno", text: "Pedir una aportación al dueño", score: 1, effects: { consejo: -2 },
      available: (g) => { const q = quoteOwner(g, g.liquidity.gap * 1.3); return q.available ? { ok: true } : { ok: false, reason: q.reason }; },
      outcome: (g) => quoteOwner(g, g.liquidity.gap * 1.3).detail,
      commands: (g, c) => [{ type: "owner_equity", id: `${c}:e`, amount: Math.max(g.liquidity.gap * 1.3, 50_000_00) / 100 }] },
    { id: "recortar", text: "Recortar publicidad y mantenimiento a la mitad", score: 1, effects: { equipo: -1 },
      available: (g) => (["marketing", "mantenimiento"].some((id) => g.fixedLines.some((f) => f.id === id) && g.cuts[id] === undefined) ? { ok: true } : { ok: false, reason: "Ya se recortó lo recortable." }),
      outcome: () => "Ahorro inmediato en gastos fijos; la demanda se enfría y aumentan las fallas a partir del segundo mes.",
      commands: (g, c) => [{ type: "cut_costs", id: `${c}:c`, lines: ["marketing", "mantenimiento"].filter((id) => g.fixedLines.some((f) => f.id === id) && g.cuts[id] === undefined) }] },
  ],
};

export const GROWTH_CASES: readonly GCase[] = [OPS_CASES[0], ...CHAIN_A, ...CHAIN_B, ...CHAIN_C, LIQUIDITY_CASE, ...OPS_CASES.slice(1)];
export const caseById = (id: string) => GROWTH_CASES.find((c) => c.id === id);

/** Etiqueta de industria de un caso: la línea que exige, la familia, o «todas» si sirve a cualquier empresa del motor. */
export function industryTagOf(c: GCase): string {
  if (c.requires.line) return c.requires.line;
  return c.family === "ambas" ? "todas" : c.family;
}
/** Etiquetas completas de un caso (industria, función directiva, competencias). */
export const tagsOf = (c: GCase) => ({ industria: industryTagOf(c), funcion: c.tags.funcion, competencias: [...c.tags.competencias] });
