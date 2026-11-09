/**
 * Acería v2 · 26 casos propios de la industria, selector adaptable y bitácora de auditoría.
 *
 * Reglas:
 *  - Cada opción se traduce SOLO en comandos del motor (`SteelCommand`). Los montos salen del estado (volúmenes, precios,
 *    nómina, caja). La IA puede elegir cuál caso elegible llega y redactar la historia, pero no puede crear efectos.
 *  - Riesgos graves de seguridad tienen límites claros: la opción insegura aparece para que se entienda por qué no se
 *    puede tomar, pero está bloqueada con su razón (no se puede elegir y no da puntos).
 *  - Continuidad: `after` encadena casos según lo que el jugador decidió antes; algunos efectos llegan días después
 *    (comando `later`) con el mismo motor.
 */
import { applySteel, advanceSteel, cashOf, capacity, prices, scrapPerBillet, headcountOf, liquidityOptions, overdueTotal, bankQuote, fmt, type SteelCommand, type SteelState } from "./engine";
import { STEEL as K, TEMPLATES_V2 } from "./params";

export type Area = "operacion" | "chatarra" | "clientes" | "calidad" | "energia" | "seguridad" | "capacidad" | "estrategia";
export const AREA_LABEL: Readonly<Record<Area, string>> = Object.freeze({ operacion: "Operación", chatarra: "Proveedores y chatarra", clientes: "Clientes", calidad: "Calidad", energia: "Energía", seguridad: "Seguridad y ambiente", capacidad: "Capacidad", estrategia: "Estrategia" });

export interface Check { ok: boolean; reason?: string }
export interface SOption {
  id: string; label: string;
  detail: (s: SteelState) => string;
  commands: (s: SteelState, key: string) => SteelCommand[];
  available?: (s: SteelState) => Check;
  /** Límite de seguridad: la opción se muestra bloqueada con esta razón y nunca se puede elegir. */
  blocked?: string;
  /** Postura de la decisión (para el selector adaptable): prudente, equilibrada o arriesgada. */
  stance: "prudente" | "equilibrada" | "arriesgada";
}
export interface SCase {
  id: string; area: Area; from: string; subject: string;
  body: (s: SteelState) => string[];
  data?: (s: SteelState) => [string, string][];
  lesson: string;
  requires: (s: SteelState, log: readonly LogEntry[]) => Check;
  after?: { case: string; options: string[] };
  options: SOption[];
  safety?: boolean;
  /** Días de espera mínimos desde el caso anterior del mismo encadenamiento. */
  minDay: number;
}
export interface LogEntry { day: number; caseId: string; optionId: string; commands: string[]; source: "motor" | "ia"; ok: boolean; reason?: string }

// ───────────────────────────────────────────────────────── utilidades
const big = (s: SteelState) => TEMPLATES_V2[s.templateId].kind === "integrada";
const sz = <T,>(s: SteelState, compacta: T, integrada: T): T => (big(s) ? integrada : compacta);
const who = (s: SteelState, role: string) => TEMPLATES_V2[s.templateId].people[role] ?? role;
const mx = (pesos: number) => `$${Math.round(pesos).toLocaleString("en-US")}`;
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
const ok: Check = { ok: true };
const no = (reason: string): Check => ({ ok: false, reason });
/** El banco evalúa el crédito con el mismo criterio que el motor: si lo rechazaría, la opción no se ofrece. */
const credit = (s: SteelState, amount: number): Check => {
  const q = bankQuote(s, amount, TEMPLATES_V2[s.templateId].bankRate, 60);
  return q.ok ? ok : no(q.reason ?? "El banco no aprueba el crédito.");
};
const decided = (log: readonly LogEntry[], id: string, opts?: string[]) => log.some((e) => e.ok && e.caseId === id && (!opts || opts.includes(e.optionId)));
const contract = (s: SteelState, id: string) => s.contracts.find((k) => k.id === id);
const biggest = (s: SteelState) => [...s.contracts].sort((a, b) => b.tpd * b.price - a.tpd * a.price)[0];
/** Toneladas de palanquilla al día que pide la cartera actual. */
const billetDaily = (s: SteelState) => s.contracts.reduce((a, k) => a + (k.product === "palanquilla" ? k.tpd : k.tpd / K.yieldRoll.value), 0);
const scrapDaily = (s: SteelState) => billetDaily(s) * scrapPerBillet(prices(s).yieldMelt);
const payrollMonth = (s: SteelState) => Object.values(s.crews).reduce((a, cr) => a + cr.n * cr.gross, 0) / 100;
const lastUtil = (s: SteelState) => s.months.slice(-2).reduce((a, m) => a + m.utilization, 0) / Math.max(1, s.months.slice(-2).length);
const monthEbitda = (s: SteelState) => { const ms = s.months.slice(-3); return ms.length ? ms.reduce((a, m) => a + m.ebitda, 0) / ms.length / 100 : 0; };

// ───────────────────────────────────────────────────────── los 26 casos
export const STEEL_CASES: readonly SCase[] = [
  // ── Operación (3)
  {
    id: "op_refractario", area: "operacion", from: "maestro", subject: "El crisol del horno 1 está al final de su campaña", minDay: 20, safety: true,
    body: (s) => [
      `${who(s, "maestro")} midió el espesor del refractario del horno 1: le quedan unas diez coladas dentro del margen del fabricante.`,
      "Relinear toma dos días de paro en ese horno. Estirar la campaña ahorra el paro ahora, pero cada colada extra adelgaza la pared y el riesgo de que el metal llegue a la bobina crece rápido.",
      "Una perforación del crisol con metal líquido es de los accidentes más graves de una acería de inducción: explosión de vapor si toca el agua de enfriamiento.",
    ],
    data: (s) => [["Costo del relineado", mx(sz(s, 180_000, 620_000))], ["Producción de un día de horno", `${Math.round(capacity(s).melt / s.plant.furnaces)} t`]],
    lesson: "En una acería, el mantenimiento que evita accidentes graves no se negocia contra el volumen del mes: se programa.",
    requires: () => ok,
    options: [
      { id: "relinear", stance: "prudente", label: "Relinear este fin de semana", detail: (s) => `Dos días con un horno menos y ${mx(sz(s, 180_000, 620_000))} de refractario y mano de obra. El maestro respira tranquilo.`, commands: (s, k) => [{ type: "modify", id: `${k}:paro`, key: "availability", mult: 1 - 0.5 / s.plant.furnaces, days: 2 }, { type: "one_off", id: `${k}:costo`, label: "Relineado del crisol del horno 1", amount: sz(s, 180_000, 620_000), payInDays: 30 }, { type: "safety", id: `${k}:seg`, delta: 0.03 }] },
      { id: "medir", stance: "equilibrada", label: "Llegar al límite del fabricante con medición en cada colada", detail: () => "Se aprovechan las diez coladas que quedan con medición de espesor y termografía en cada una; si una medición sale mal se para de inmediato. Cuesta horas del metalurgista y algo de ritmo.", commands: (s, k) => [{ type: "modify", id: `${k}:ritmo`, key: "availability", mult: 0.98, days: 12 }, { type: "later", id: `${k}:relin`, inDays: 12, cmd: { type: "one_off", id: `${k}:costo`, label: "Relineado del crisol del horno 1", amount: sz(s, 180_000, 620_000), payInDays: 30 } }, { type: "later", id: `${k}:paro`, inDays: 12, cmd: { type: "modify", id: `${k}:paro2`, key: "availability", mult: 1 - 0.5 / s.plant.furnaces, days: 2 } }] },
      { id: "estirar", stance: "arriesgada", label: "Seguir fundiendo más allá del límite del fabricante", blocked: "Operar un crisol por debajo del espesor mínimo del fabricante expone a una perforación con metal líquido. No es una decisión de negocio: el límite lo pone la seguridad de la gente.", detail: () => "", commands: () => [] },
    ],
  },
  {
    id: "op_predictivo", area: "operacion", from: "mantenimiento", subject: "Mantenimiento predictivo o seguir apagando fuegos", minDay: 60,
    body: (s) => [
      `${who(s, "mantenimiento")} propone un programa de mantenimiento predictivo: análisis de vibraciones en la colada, termografía de bobinas y tableros, y análisis del agua de enfriamiento.`,
      "Los paros no programados de los últimos meses se fueron casi todos a fallas que avisan con semanas de anticipación.",
    ],
    data: (s) => [["Costo mensual del programa", mx(sz(s, 45_000, 160_000))], ["Paros no programados actuales", "cerca de 2 % del tiempo"]],
    lesson: "El predictivo paga cuando la planta vende todo lo que produce: cada hora de paro evitada es margen. Con la planta ociosa, rinde menos.",
    requires: () => ok,
    options: [
      { id: "programa", stance: "equilibrada", label: "Contratar el programa completo", detail: (s) => `${mx(sz(s, 45_000, 160_000))} al mes. En dos meses los paros no programados bajan cerca de la mitad.`, commands: (s, k) => [{ type: "add_fixed", id: `${k}:fijo`, label: "Mantenimiento predictivo", amount: sz(s, 45_000, 160_000) }, { type: "modify", id: `${k}:disp`, key: "availability", mult: 1.012, inDays: 60, days: 900 }] },
      { id: "piloto", stance: "prudente", label: "Piloto solo en la colada continua", detail: (s) => `${mx(sz(s, 18_000, 60_000))} al mes durante seis meses; si funciona se amplía.`, commands: (s, k) => [{ type: "add_fixed", id: `${k}:fijo`, label: "Piloto de predictivo en colada", amount: sz(s, 18_000, 60_000) }, { type: "modify", id: `${k}:disp`, key: "availability", mult: 1.005, inDays: 45, days: 180 }, { type: "later", id: `${k}:fin`, inDays: 180, cmd: { type: "remove_fixed", id: `${k}:quita`, fixedId: `${k}:fijo` } }] },
      { id: "no", stance: "arriesgada", label: "Seguir con mantenimiento correctivo", detail: () => "Sin gasto adicional. Los paros siguen como están.", commands: () => [] },
    ],
  },
  {
    id: "op_rendimiento", area: "operacion", from: "metalurgista", subject: "Se pierde metal en la escoria", minDay: 90,
    body: (s) => [
      `${who(s, "metalurgista")} revisó los balances: de cada tonelada de chatarra se recupera ${pct(prices(s).yieldMelt)} de acero líquido. Plantas parecidas llegan a 91.5 % con mejor clasificación de la chatarra y práctica de escoria.`,
      "Cada punto de rendimiento es chatarra que se paga y se tira como escoria.",
    ],
    data: (s) => [["Chatarra al día", `${Math.round(scrapDaily(s))} t`], ["Valor de un punto de rendimiento al mes", mx(scrapDaily(s) * 0.01 * prices(s).scrap * 26)]],
    lesson: "El rendimiento metálico es el margen escondido de una acería: no aparece en el precio, aparece en la chatarra que no se convierte en acero.",
    requires: () => ok,
    options: [
      { id: "practica", stance: "equilibrada", label: "Capacitar y cambiar la práctica de carga y escoria", detail: (s) => `${mx(sz(s, 120_000, 380_000))} en capacitación y un consultor. En un mes el rendimiento sube cerca de 0.8 puntos.`, commands: (s, k) => [{ type: "one_off", id: `${k}:capac`, label: "Capacitación en práctica de fusión", amount: sz(s, 120_000, 380_000), payInDays: 30 }, { type: "modify", id: `${k}:rend`, key: "yieldMelt", add: 0.008, inDays: 30, days: 900 }] },
      { id: "preparada", stance: "prudente", label: "Comprar chatarra mejor preparada", detail: () => "La chatarra cortada y limpia cuesta 2.5 % más, pero rinde 1.2 puntos más desde el primer día.", commands: (_s, k) => [{ type: "modify", id: `${k}:precio`, key: "scrapPrice", mult: 1.025, days: 900 }, { type: "modify", id: `${k}:rend`, key: "yieldMelt", add: 0.012, days: 900 }] },
      { id: "nada", stance: "arriesgada", label: "Dejarlo así por ahora", detail: () => "Sin gasto. El rendimiento sigue igual.", commands: () => [] },
    ],
  },

  // ── Proveedores y chatarra (4)
  {
    id: "ch_alza", area: "chatarra", from: "chatarrero", subject: "La chatarra va a subir", minDay: 120,
    body: (s) => [
      `${who(s, "chatarrero")} avisa que los exportadores están pagando más por la chatarra en la frontera. Calcula que el precio sube cerca de 10 % en los próximos dos meses.`,
      "Comprar adelantado protege el costo, pero inmoviliza caja y patio.",
    ],
    data: (s) => [["Consumo de chatarra al día", `${Math.round(scrapDaily(s))} t`], ["Precio actual", `${mx(prices(s).scrap)} por t`], ["Caja", mx(cashOf(s) / 100)]],
    lesson: "Comprar inventario adelantado es una apuesta de precio financiada con tu caja: tiene sentido si la caja aguanta y si el patio y la merma lo permiten.",
    requires: (s) => (s.day >= 120 && s.day <= 200 ? ok : no("El aviso llega en el quinto mes.")),
    options: [
      { id: "adelantar", stance: "arriesgada", label: "Comprar 20 días de consumo al precio de hoy", detail: (s) => `Unas ${Math.round(scrapDaily(s) * 20).toLocaleString("en-US")} t por ${mx(scrapDaily(s) * 20 * prices(s).scrap)}, a pagar en siete días.`, commands: (s, k) => [{ type: "buy_scrap", id: `${k}:compra`, tons: Math.round(scrapDaily(s) * 20) }], available: (s) => (s.supply.scrapStopped ? no("Los chatarreros tienen suspendidas las entregas.") : ok) },
      { id: "diez", stance: "equilibrada", label: "Comprar 10 días y negociar un precio escalonado", detail: (s) => `Unas ${Math.round(scrapDaily(s) * 10).toLocaleString("en-US")} t ahora; el resto del alza se reparte en tres meses.`, commands: (s, k) => [{ type: "buy_scrap", id: `${k}:compra`, tons: Math.round(scrapDaily(s) * 10) }, { type: "modify", id: `${k}:escalon`, key: "scrapPrice", mult: 0.985, inDays: 60, days: 90 }], available: (s) => (s.supply.scrapStopped ? no("Los chatarreros tienen suspendidas las entregas.") : ok) },
      { id: "esperar", stance: "prudente", label: "No adelantar compras", detail: () => "La caja queda libre; la chatarra se paga al precio de cada semana.", commands: () => [] },
    ],
  },
  {
    id: "ch_humeda", area: "chatarra", from: "patio", subject: "Llegó un lote de chatarra mojada y con tanques cerrados", minDay: 30, safety: true,
    body: (s) => [
      `${who(s, "patio")} detuvo en báscula dos camiones: la chatarra viene mojada por la lluvia y trae tanques y cilindros sin cortar.`,
      "El horno espera carga y el patio está bajo.",
    ],
    data: (s) => [["Toneladas del lote", `${Math.round(scrapDaily(s) * 0.8)} t`], ["Días de chatarra en patio", `${(s.inv.scrapT / Math.max(1, scrapDaily(s))).toFixed(1)}`]],
    lesson: "Humedad o recipientes cerrados dentro de un horno con metal líquido provocan explosiones. La clasificación en patio es la primera barrera de seguridad de una acería.",
    requires: () => ok,
    options: [
      { id: "rechazar", stance: "prudente", label: "Rechazar el lote y exigir reposición", detail: () => "El proveedor repone en tres días. Mientras, el horno trabaja más lento y la relación se tensa.", commands: (_s, k) => [{ type: "modify", id: `${k}:lento`, key: "availability", mult: 0.92, days: 3 }, { type: "relation", id: `${k}:rel`, key: "suppliers", delta: -0.04 }, { type: "safety", id: `${k}:seg`, delta: 0.02 }] },
      { id: "secar", stance: "equilibrada", label: "Secar, cortar y clasificar en el patio", detail: (s) => `${mx(sz(s, 45_000, 120_000))} en horas extra y oxicorte; el lote se usa en cinco días.`, commands: (s, k) => [{ type: "one_off", id: `${k}:costo`, label: "Secado y corte de chatarra", amount: sz(s, 45_000, 120_000), payInDays: 15 }, { type: "modify", id: `${k}:lento`, key: "availability", mult: 0.97, days: 5 }, { type: "safety", id: `${k}:seg`, delta: 0.02 }] },
      { id: "cargar", stance: "arriesgada", label: "Cargarlo así al horno", blocked: "Cargar chatarra húmeda o con recipientes cerrados a un horno con metal líquido puede causar una explosión de vapor. Está fuera de cualquier procedimiento seguro.", detail: () => "", commands: () => [] },
    ],
  },
  {
    id: "ch_credito", area: "chatarra", from: "chatarrero", subject: "Más plazo a cambio de exclusividad", minDay: 75,
    body: (s) => [
      `${who(s, "chatarrero")} ofrece pasar de 7 a 15 días de plazo si le compras toda la chatarra a él durante tres meses, con un sobreprecio de 1.1 %.`,
      "Ocho días más de plazo liberan caja de inmediato; la exclusividad te quita poder de negociación.",
    ],
    data: (s) => [["Caja que se libera", mx(scrapDaily(s) * (1 - s.plant.ownScrapShare) * prices(s).scrap * 8)], ["Costo del sobreprecio en tres meses", mx(scrapDaily(s) * (1 - s.plant.ownScrapShare) * prices(s).scrap * 0.011 * 78)]],
    lesson: "El plazo de proveedores es financiamiento: compara su costo implícito contra lo que te cobra el banco.",
    requires: (s) => (overdueTotal(s, "chatarra") ? no("Hay saldo vencido con los chatarreros.") : s.supply.scrapExtraDays ? no("Ya hay un convenio de plazo.") : ok),
    options: [
      { id: "aceptar", stance: "equilibrada", label: "Aceptar 15 días con exclusividad", detail: () => "Ocho días más de plazo por tres meses; el precio sube 1.1 %.", commands: (_s, k) => [{ type: "supplier_terms", id: `${k}:plazo`, extraDays: 8 }] },
      { id: "rechazar", stance: "prudente", label: "Mantener 7 días y libertad de compra", detail: () => "Sin cambio de precio ni de caja.", commands: () => [] },
    ],
  },
  {
    id: "ch_patio", area: "chatarra", from: "patio", subject: "Comprar chatarra directo a recolectores", minDay: 100,
    body: (s) => big(s)
      ? [`${who(s, "patio")} propone ampliar el patio de Saltillo con una prensa-cizalla y báscula para comprar directo a recolectores.`, "La chatarra de recolector es más barata, pero viene sucia: el rendimiento de fusión baja un poco y hay que pagar la operación del patio."]
      : [`${who(s, "patio")} propone abrir un patio pequeño para comprar directo a recolectores de la zona.`, "Hoy toda la chatarra llega preparada por Chatarras del Norte."],
    data: (s) => [["Chatarra propia hoy", pct(s.plant.ownScrapShare)], ["Inversión", mx(sz(s, 2_500_000, 12_000_000))], ["Caja", mx(cashOf(s) / 100)]],
    lesson: "Integrarse hacia atrás baja el costo por tonelada solo si el volumen paga la inversión y la merma; mide el ahorro neto de rendimiento.",
    requires: () => ok,
    options: [
      { id: "invertir", stance: "arriesgada", label: "Invertir en el patio", detail: (s) => `${mx(sz(s, 2_500_000, 12_000_000))}: mitad ahora y mitad en dos meses. La chatarra propia sube a ${sz(s, "25 %", "55 %")} de la carga.`, commands: (s, k) => [{ type: "expand_yard", id: `${k}:patio`, capex: sz(s, 2_500_000, 12_000_000), share: sz(s, 0.25, 0.55), crew: sz(s, 3, 8) }] },
      { id: "acuerdo", stance: "equilibrada", label: "Acuerdo con dos recolectores sin invertir", detail: () => "Se compra chatarra de recolector ya cortada: precio 2 % menor en la mezcla, con medio punto menos de rendimiento.", commands: (_s, k) => [{ type: "modify", id: `${k}:precio`, key: "scrapPrice", mult: 0.98, days: 900 }, { type: "modify", id: `${k}:rend`, key: "yieldMelt", add: -0.005, days: 900 }] },
      { id: "no", stance: "prudente", label: "Seguir comprando chatarra preparada", detail: () => "Sin inversión ni cambio de calidad.", commands: () => [] },
    ],
  },

  // ── Clientes (4)
  {
    id: "cl_60dias", area: "clientes", from: "admin", subject: "Un cliente nuevo de varilla pide 60 días", minDay: 40,
    body: (s) => [
      `${who(s, "admin")} trae a Desarrollos Industriales del Bajío: quiere ${sz(s, 8, 30)} t diarias de varilla a ${mx(14_600)} por tonelada, con pago a 60 días.`,
      "Es volumen que la planta puede producir, pero el dinero llega dos meses después de cada entrega.",
    ],
    data: (s) => { const tpd = sz(s, 8, 30); const wc = tpd * 14_600 * 60 * 26 / 30; return [["Venta mensual", mx(tpd * 14_600 * 26)], ["Capital de trabajo que inmoviliza", mx(wc)], ["Caja", mx(cashOf(s) / 100)]]; },
    lesson: "Crecer en ventas a crédito consume caja antes de producirla. Antes de aceptar, mide cuánto capital de trabajo inmoviliza y con qué lo vas a financiar.",
    requires: () => ok,
    options: [
      { id: "aceptar", stance: "arriesgada", label: "Aceptar a 60 días", detail: (s) => `Se surte desde dentro de 30 días. La caja baja unos ${mx(sz(s, 8, 30) * 14_600 * 52)} en los primeros dos meses.`, commands: (s, k) => [{ type: "add_contract", id: `${k}:k`, client: "Desarrollos Industriales del Bajío", product: "varilla", tpd: sz(s, 8, 30), price: 14_600, dso: 60, startInDays: 30, beta: 1.3 }] },
      { id: "contraoferta", stance: "equilibrada", label: "Contraoferta: 45 días con 1.5 % de descuento", detail: () => "El cliente acepta. Menos precio, quince días menos de caja inmovilizada.", commands: (s, k) => [{ type: "add_contract", id: `${k}:k`, client: "Desarrollos Industriales del Bajío", product: "varilla", tpd: sz(s, 8, 30), price: Math.round(14_600 * 0.985), dso: 45, startInDays: 30, beta: 1.3 }] },
      { id: "declinar", stance: "prudente", label: "Declinar", detail: () => "Sin volumen nuevo; la caja queda como está.", commands: () => [] },
    ],
  },
  {
    id: "cl_descuento", area: "clientes", from: "admin", subject: "El cliente más grande pide descuento", minDay: 150,
    body: (s) => { const k = biggest(s); return [`${k.client} pide 3 % de descuento a cambio de 20 % más volumen. Dice que la varilla y la palanquilla importadas llegan más baratas.`, "Si no hay acuerdo, es probable que reparta parte de sus compras con un importador."]; },
    data: (s) => { const k = biggest(s); return [["Volumen actual", `${k.tpd} t diarias`], ["Precio actual", mx(k.price / 100)], ["Utilización de la planta", pct(lastUtil(s))]]; },
    lesson: "Un descuento por volumen solo conviene si el volumen extra cabe en la planta y su margen cubre lo que se regala en todo el volumen anterior.",
    requires: (s) => (s.contracts.length ? ok : no("No hay contratos.")),
    options: [
      { id: "aceptar", stance: "arriesgada", label: "Aceptar 3 % por 20 % más volumen", detail: () => "El precio baja en todo el contrato desde hoy; el volumen sube desde la próxima semana.", commands: (s, k) => { const c = biggest(s); return [{ type: "change_contract", id: `${k}:c`, contractId: c.id, price: Math.round((c.price / 100) * 0.97), tpd: Math.round(c.tpd * 1.2) }]; } },
      { id: "medio", stance: "equilibrada", label: "Contraoferta: 1.5 % por 10 % más", detail: () => "El cliente acepta a regañadientes.", commands: (s, k) => { const c = biggest(s); return [{ type: "change_contract", id: `${k}:c`, contractId: c.id, price: Math.round((c.price / 100) * 0.985), tpd: Math.round(c.tpd * 1.1) }, { type: "relation", id: `${k}:r`, key: "clients", delta: -0.02 }]; } },
      { id: "no", stance: "prudente", label: "Sostener el precio", detail: () => "El precio se mantiene. En dos meses el cliente pasa 25 % de su volumen a un importador; seis meses después, con la calidad del importador a prueba, regresa la mitad de lo perdido.", commands: (s, k) => { const c = biggest(s); return [{ type: "relation", id: `${k}:r`, key: "clients", delta: -0.05 }, { type: "later", id: `${k}:baja`, inDays: 60, cmd: { type: "change_contract", id: `${k}:c`, contractId: c.id, tpd: Math.round(c.tpd * 0.75) } }, { type: "later", id: `${k}:regresa`, inDays: 240, cmd: { type: "change_contract", id: `${k}:c2`, contractId: c.id, tpd: Math.round(c.tpd * 0.88) } }]; } },
    ],
  },
  {
    id: "cl_atraso", area: "clientes", from: "admin", subject: "Constructora Cumbres paga cada vez más tarde", minDay: 180,
    body: (s) => [`${who(s, "admin")} reporta que Constructora Cumbres del Norte ya paga con 20 días de atraso y pide formalizar 30 días más de plazo porque una obra de gobierno no le ha pagado.`, "Es un cliente de años y su volumen pesa."],
    data: (s) => { const k = contract(s, "k_cumbres"); const owed = s.sched.filter((x) => x.dir === "in" && x.ref === "k_cumbres").reduce((a, x) => a + x.amount, 0); return [["Saldo por cobrar a Cumbres", mx(owed / 100)], ["Plazo actual", `${k ? k.dso + k.payDelay : 0} días`]]; },
    lesson: "Un cliente que paga tarde te usa como banco. Fijar condiciones a tiempo cuesta menos que descubrir una cuenta incobrable.",
    requires: (s) => (contract(s, "k_cumbres") ? ok : no("Cumbres ya no es cliente.")),
    options: [
      { id: "plazo", stance: "arriesgada", label: "Darle los 30 días adicionales", detail: () => "El cliente se queda; tu caja financia su obra un mes más.", commands: (s, k) => { const c = contract(s, "k_cumbres")!; return [{ type: "change_contract", id: `${k}:c`, contractId: c.id, payDelay: c.payDelay + 30 }, { type: "relation", id: `${k}:r`, key: "clients", delta: 0.03 }]; } },
      { id: "garantia", stance: "equilibrada", label: "Plazo de 15 días más contra pagaré y tope de crédito", detail: () => "Firma pagaré; si se pasa del tope, se le surte de contado. Recorta su volumen 20 %.", commands: (s, k) => { const c = contract(s, "k_cumbres")!; return [{ type: "change_contract", id: `${k}:c`, contractId: c.id, payDelay: c.payDelay + 10, tpd: Math.round(c.tpd * 0.8) }]; } },
      { id: "suspender", stance: "prudente", label: "Suspender entregas hasta que se ponga al corriente", detail: () => "Deja de surtirse un mes. La relación se daña; cuando regresa compra 15 % menos y paga a tiempo.", commands: (s, k) => { const c = contract(s, "k_cumbres")!; return [{ type: "change_contract", id: `${k}:pausa`, contractId: c.id, tpd: 0, payDelay: 0 }, { type: "later", id: `${k}:vuelve`, inDays: 30, cmd: { type: "change_contract", id: `${k}:vuelve`, contractId: c.id, tpd: Math.round(c.tpd * 0.85), payDelay: 0 } }, { type: "relation", id: `${k}:r`, key: "clients", delta: -0.06 }]; } },
    ],
  },
  {
    id: "cl_licitacion", area: "clientes", from: "admin", subject: "Licitación de obra pública: varilla para seis meses", minDay: 200,
    body: (s) => [`El gobierno del estado licita varilla para un distribuidor vial: ${sz(s, 10, 50)} t diarias durante seis meses a ${mx(15_200)} por tonelada.`, "Paga a 90 días y exige fianza de cumplimiento. Con certificado de producto, la propuesta califica completa."],
    data: (s) => [["Venta total", mx(sz(s, 10, 50) * 15_200 * 26 * 6)], ["Caja inmovilizada en el pico", mx(sz(s, 10, 50) * 15_200 * 90 * 26 / 30)], ["Certificado de producto", s.flags.certificado ? "sí" : "no"]],
    lesson: "Los contratos de gobierno pagan buen precio y tarde. Solo convienen si tienes con qué financiar 90 días y si la planta tiene capacidad libre.",
    requires: () => ok,
    options: [
      { id: "completa", stance: "arriesgada", label: "Ofertar el volumen completo", available: (s) => (s.flags.certificado ? ok : no("Sin certificado de producto la propuesta completa no califica.")), detail: (s) => `${sz(s, 10, 50)} t diarias por seis meses, fianza de ${mx(sz(s, 10, 50) * 15_200 * 26 * 6 * 0.01)}.`, commands: (s, k) => [{ type: "add_contract", id: `${k}:k`, client: "Gobierno del estado (obra vial)", product: "varilla", tpd: sz(s, 10, 50), price: 15_200, dso: 90, startInDays: 20 }, { type: "one_off", id: `${k}:fianza`, label: "Fianza de cumplimiento", amount: Math.round(sz(s, 10, 50) * 15_200 * 26 * 6 * 0.01), payInDays: 5 }, { type: "later", id: `${k}:fin`, inDays: 200, cmd: { type: "drop_contract", id: `${k}:fin`, contractId: `${k}:k` } }] },
      { id: "mitad", stance: "equilibrada", label: "Ofertar la mitad como subcontratista de un distribuidor", detail: (s) => `${Math.round(sz(s, 10, 50) / 2)} t diarias a ${mx(14_900)}, pago a 60 días; el distribuidor pone la fianza.`, commands: (s, k) => [{ type: "add_contract", id: `${k}:k`, client: "Distribuidor de la obra vial", product: "varilla", tpd: Math.round(sz(s, 10, 50) / 2), price: 14_900, dso: 60, startInDays: 20 }, { type: "later", id: `${k}:fin`, inDays: 200, cmd: { type: "drop_contract", id: `${k}:fin`, contractId: `${k}:k` } }] },
      { id: "no", stance: "prudente", label: "No participar", detail: () => "Sin volumen ni riesgo adicional.", commands: () => [] },
    ],
  },

  // ── Calidad (3)
  {
    id: "ca_reclamo", area: "calidad", from: "metalurgista", subject: "Reclamo: varilla que falla en doblado", minDay: 110,
    body: (s) => [`Un cliente reporta que un lote de ${sz(s, 60, 200)} t de varilla agrietó en la prueba de doblado en obra.`, `${who(s, "metalurgista")} revisó: el certificado del lote está en norma, pero el cobre residual quedó en el límite por una chatarra con mucho cable.`],
    data: (s) => [["Valor del lote", mx(sz(s, 60, 200) * 14_800)]],
    lesson: "En acero de refuerzo, una falla en obra es un problema de seguridad estructural para tu cliente. Cómo respondes define si sigue comprándote.",
    requires: (s) => (s.contracts.some((k) => k.product === "varilla") ? ok : no("No hay contratos de varilla.")),
    options: [
      { id: "reponer", stance: "prudente", label: "Reponer el lote y revisar la chatarra de entrada", detail: (s) => `El lote se recoge y se refunde: ${mx(sz(s, 60, 200) * 14_800 * 0.35)} entre flete, merma y reproceso. El cliente lo agradece.`, commands: (s, k) => [{ type: "one_off", id: `${k}:costo`, label: "Reposición de lote reclamado", amount: Math.round(sz(s, 60, 200) * 14_800 * 0.35), payInDays: 20 }, { type: "relation", id: `${k}:r`, key: "clients", delta: 0.05 }] },
      { id: "descuento", stance: "equilibrada", label: "Ofrecer 10 % de descuento sobre el lote", detail: (s) => `${mx(sz(s, 60, 200) * 14_800 * 0.1)} de nota de crédito. El cliente acepta, molesto.`, commands: (s, k) => [{ type: "one_off", id: `${k}:nota`, label: "Nota de crédito por reclamo de calidad", amount: Math.round(sz(s, 60, 200) * 14_800 * 0.1), payInDays: 5 }, { type: "relation", id: `${k}:r`, key: "clients", delta: -0.03 }] },
      { id: "rechazar", stance: "arriesgada", label: "Rechazar el reclamo con el certificado en mano", detail: () => "Legalmente estás cubierto. El cliente reduce sus pedidos 30 % en el siguiente trimestre.", commands: (s, k) => { const c = s.contracts.filter((x) => x.product === "varilla").sort((a, b) => b.tpd - a.tpd)[0]; return [{ type: "relation", id: `${k}:r`, key: "clients", delta: -0.08 }, { type: "change_contract", id: `${k}:c`, contractId: c.id, tpd: Math.round(c.tpd * 0.7) }, { type: "later", id: `${k}:vuelve`, inDays: 90, cmd: { type: "change_contract", id: `${k}:v`, contractId: c.id, tpd: c.tpd } }]; } },
    ],
  },
  {
    id: "ca_certificacion", area: "calidad", from: "metalurgista", subject: "Certificar la varilla", minDay: 80,
    body: (s) => [`${who(s, "metalurgista")} propone certificar la varilla con un organismo acreditado. Las constructoras grandes y las obras públicas lo piden.`, "Implica auditorías, más pruebas por colada y un sistema de calidad documentado."],
    data: (s) => [["Costo inicial", mx(sz(s, 380_000, 950_000))], ["Costo mensual", mx(sz(s, 25_000, 70_000))]],
    lesson: "Una certificación es una llave de mercado: vale lo que valen los clientes que te abre.",
    requires: (s) => (s.flags.certificado ? no("Ya está certificada.") : ok),
    options: [
      { id: "certificar", stance: "equilibrada", label: "Certificar", detail: (s) => `${mx(sz(s, 380_000, 950_000))} ahora y ${mx(sz(s, 25_000, 70_000))} al mes. Queda lista en cuatro meses.`, commands: (s, k) => [{ type: "one_off", id: `${k}:ini`, label: "Certificación de producto", amount: sz(s, 380_000, 950_000), payInDays: 30 }, { type: "add_fixed", id: `${k}:fijo`, label: "Sistema de calidad y auditorías", amount: sz(s, 25_000, 70_000) }, { type: "later", id: `${k}:listo`, inDays: 120, cmd: { type: "flag", id: `${k}:flag`, key: "certificado", value: true } }] },
      { id: "despues", stance: "prudente", label: "Dejarlo para el próximo año", detail: () => "Sin gasto. Algunas licitaciones y clientes quedan fuera.", commands: () => [] },
    ],
  },
  {
    id: "ca_residuales", area: "calidad", from: "metalurgista", subject: "Suben el cobre y el estaño en el acero", minDay: 250,
    body: (s) => [`${who(s, "metalurgista")} ve que los residuales de cobre y estaño suben colada tras colada: la chatarra barata trae motores y cable.`, "Si siguen subiendo, parte de la producción no pasa como grado 42."],
    lesson: "La calidad del acero empieza en el patio: los residuales no se refinan en un horno de inducción, solo se diluyen.",
    requires: () => ok,
    options: [
      { id: "mezcla", stance: "prudente", label: "Mejorar la mezcla con chatarra de primera", detail: () => "La mezcla cuesta 2 % más, el problema desaparece y el rendimiento mejora medio punto.", commands: (_s, k) => [{ type: "modify", id: `${k}:precio`, key: "scrapPrice", mult: 1.02, days: 360 }, { type: "modify", id: `${k}:rend`, key: "yieldMelt", add: 0.005, days: 360 }] },
      { id: "diluir", stance: "equilibrada", label: "Diluir con hierro de reducción directa", detail: () => "Los consumibles suben 10 %; se controla el problema sin tocar la chatarra.", commands: (_s, k) => [{ type: "modify", id: `${k}:cons`, key: "consumables", mult: 1.1, days: 360 }] },
      { id: "aceptar", stance: "arriesgada", label: "Seguir y vender lo que salga fuera de grado como segunda", detail: () => "Sin costo directo. Algunos clientes rechazan material: la demanda baja 4 % por seis meses.", commands: (_s, k) => [{ type: "modify", id: `${k}:dem`, key: "demand", mult: 0.96, days: 180 }, { type: "relation", id: `${k}:r`, key: "clients", delta: -0.04 }] },
    ],
  },

  // ── Energía (3)
  {
    id: "en_punta", area: "energia", from: "supervisor", subject: "Fundir fuera del horario punta", minDay: 50,
    body: (s) => [`${who(s, "supervisor")} revisó el recibo de CFE: casi un tercio del costo de energía se paga en horario punta, cuando la tarifa es varias veces más cara.`, "Mover la fusión fuera de punta baja el costo, pero quita horas de horno."],
    data: (s) => [["Energía al mes", mx(s.months.slice(-1)[0]?.services ? (capacity(s).billet * 26 * K.kwhPerLiquidTon.value * prices(s).kwh) : 0)], ["Utilización", pct(lastUtil(s))]],
    lesson: "La energía es el segundo costo de una acería de inducción. Moverla en el tiempo es gratis solo si la planta tiene horas libres.",
    requires: () => ok,
    options: [
      { id: "mover", stance: "equilibrada", label: "Parar hornos en punta", detail: () => "La energía baja cerca de 7 %; la capacidad de fusión baja 4 %.", commands: (_s, k) => [{ type: "modify", id: `${k}:en`, key: "energy", mult: 0.93, days: 900 }, { type: "modify", id: `${k}:cap`, key: "availability", mult: 0.96, days: 900 }] },
      { id: "parcial", stance: "prudente", label: "Solo reducir potencia en punta", detail: () => "La energía baja 3 %; la capacidad, 1.5 %.", commands: (_s, k) => [{ type: "modify", id: `${k}:en`, key: "energy", mult: 0.97, days: 900 }, { type: "modify", id: `${k}:cap`, key: "availability", mult: 0.985, days: 900 }] },
      { id: "no", stance: "arriesgada", label: "Seguir igual", detail: () => "Toda la capacidad, a la tarifa actual.", commands: () => [] },
    ],
  },
  {
    id: "en_capacitores", area: "energia", from: "mantenimiento", subject: "CFE cobra cargo por bajo factor de potencia", minDay: 140,
    body: (s) => [`El recibo de CFE trae un cargo por bajo factor de potencia. ${who(s, "mantenimiento")} cotizó un banco de capacitores y filtros de armónicas.`],
    data: (s) => [["Inversión", mx(sz(s, 900_000, 3_200_000))], ["Cargo actual estimado", "cerca de 3 % del recibo"]],
    lesson: "Las inversiones que bajan un costo recurrente se evalúan por su recuperación: cuántos meses de ahorro pagan la inversión.",
    requires: () => ok,
    options: [
      { id: "instalar", stance: "equilibrada", label: "Instalar el banco de capacitores", detail: (s) => `${mx(sz(s, 900_000, 3_200_000))} en dos pagos. El recibo baja 3.5 % desde el segundo mes.`, commands: (s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Banco de capacitores y filtros", amount: sz(s, 900_000, 3_200_000), capex: true, payInDays: 30 }, { type: "modify", id: `${k}:en`, key: "energy", mult: 0.965, inDays: 45, days: 900 }] },
      { id: "renta", stance: "prudente", label: "Rentar el equipo", detail: (s) => `${mx(sz(s, 28_000, 95_000))} al mes; el recibo baja 3.5 % en un mes.`, commands: (s, k) => [{ type: "add_fixed", id: `${k}:renta`, label: "Renta de banco de capacitores", amount: sz(s, 28_000, 95_000) }, { type: "modify", id: `${k}:en`, key: "energy", mult: 0.965, inDays: 30, days: 900 }] },
      { id: "pagar", stance: "arriesgada", label: "Seguir pagando el cargo", detail: () => "Sin inversión; el cargo sigue y sube 1 % más con la planta cargada.", commands: (_s, k) => [{ type: "modify", id: `${k}:en`, key: "energy", mult: 1.01, days: 900 }] },
    ],
  },
  {
    id: "en_suministrador", area: "energia", from: "admin", subject: "Contrato de energía con un suministrador calificado", minDay: 220,
    body: (s) => [`Un suministrador calificado ofrece energía 9 % más barata que CFE durante tres años, con un consumo mínimo garantizado: si la planta consume menos, se paga igual.`, `${who(s, "admin")} advierte que con el mercado del acero a la baja, el mínimo puede pesar.`],
    data: (s) => [["Consumo mínimo", `${Math.round(capacity(s).billet * 0.85)} t de acero al día equivalentes`], ["Cargo fijo por el mínimo", mx(sz(s, 140_000, 600_000))]],
    lesson: "Un contrato con mínimo garantizado convierte un costo variable en fijo: baja el costo cuando produces mucho y lo sube cuando produces poco.",
    requires: () => ok,
    options: [
      { id: "firmar", stance: "arriesgada", label: "Firmar por tres años", detail: () => "La energía baja 9 %; se agrega un cargo fijo mensual que se paga aunque la planta pare.", commands: (s, k) => [{ type: "modify", id: `${k}:en`, key: "energy", mult: 0.91, inDays: 30, days: 1095 }, { type: "add_fixed", id: `${k}:fijo`, label: "Cargo fijo del suministrador calificado", amount: sz(s, 140_000, 600_000) }] },
      { id: "mitad", stance: "equilibrada", label: "Contratar la mitad del consumo", detail: () => "La energía baja 4.5 % con medio cargo fijo.", commands: (s, k) => [{ type: "modify", id: `${k}:en`, key: "energy", mult: 0.955, inDays: 30, days: 1095 }, { type: "add_fixed", id: `${k}:fijo`, label: "Cargo fijo del suministrador calificado", amount: sz(s, 70_000, 300_000) }] },
      { id: "cfe", stance: "prudente", label: "Seguir con CFE", detail: () => "Costo variable, sin mínimos.", commands: () => [] },
    ],
  },

  // ── Seguridad y ambiente (3)
  {
    id: "se_radiactiva", area: "seguridad", from: "patio", subject: "Alarma de radiación en la báscula", minDay: 160, safety: true,
    body: (s) => [`El portal de radiación de la báscula se disparó con un camión de chatarra. ${who(s, "patio")} aisló el camión en la zona de cuarentena.`, "Puede ser una fuente médica o industrial perdida. Si se funde, contamina el horno, la escoria, el producto y a la gente."],
    lesson: "Una fuente radiactiva en la chatarra se reporta y se retira con especialistas. La regla protege a tu gente y a cualquiera que toque ese material después.",
    requires: () => ok,
    options: [
      { id: "reportar", stance: "prudente", label: "Reportar a la autoridad nuclear y esperar su protocolo", detail: (s) => `Un día de patio detenido y ${mx(sz(s, 60_000, 120_000))} en resguardo y trámites.`, commands: (s, k) => [{ type: "modify", id: `${k}:paro`, key: "availability", mult: 0.9, days: 1 }, { type: "one_off", id: `${k}:costo`, label: "Resguardo y trámite de fuente radiactiva", amount: sz(s, 60_000, 120_000), payInDays: 15 }, { type: "safety", id: `${k}:seg`, delta: 0.03 }] },
      { id: "especialista", stance: "equilibrada", label: "Reportar y contratar una empresa especializada para el retiro", detail: (s) => `${mx(sz(s, 180_000, 260_000))}; el patio sigue operando y la fuente sale en 48 horas.`, commands: (s, k) => [{ type: "one_off", id: `${k}:costo`, label: "Retiro especializado de fuente radiactiva", amount: sz(s, 180_000, 260_000), payInDays: 15 }, { type: "safety", id: `${k}:seg`, delta: 0.03 }] },
      { id: "devolver", stance: "arriesgada", label: "Devolver el camión al chatarrero sin avisar", blocked: "Es ilegal y traslada el peligro a otras personas. Una fuente detectada se reporta a la autoridad nuclear.", detail: () => "", commands: () => [] },
    ],
  },
  {
    id: "se_casi", area: "seguridad", from: "supervisor", subject: "Casi accidente en la colada", minDay: 70, safety: true,
    body: (s) => [`${who(s, "supervisor")} reporta que una salpicadura de metal líquido alcanzó a un operador en la colada; el equipo aluminizado evitó la lesión.`, "La causa: una barrera que se retiró para un mantenimiento y no se repuso, y un procedimiento que no se sigue en el turno de noche."],
    lesson: "Un casi accidente es un aviso gratuito. Las plantas seguras lo tratan como si hubiera ocurrido.",
    requires: () => ok,
    options: [
      { id: "parar", stance: "prudente", label: "Parar un turno, reponer barreras y reentrenar a todos", detail: (s) => `Un turno sin colada y ${mx(sz(s, 90_000, 280_000))} en barreras, equipo y capacitación.`, commands: (s, k) => [{ type: "modify", id: `${k}:paro`, key: "availability", mult: 1 - 1 / (s.plant.shifts * 1), days: 1 }, { type: "one_off", id: `${k}:costo`, label: "Barreras, EPP y reentrenamiento", amount: sz(s, 90_000, 280_000), payInDays: 20 }, { type: "safety", id: `${k}:seg`, delta: 0.08 }, { type: "relation", id: `${k}:r`, key: "staff", delta: 0.04 }] },
      { id: "sin_paro", stance: "equilibrada", label: "Reponer barreras hoy y reentrenar por turnos sin parar", detail: (s) => `${mx(sz(s, 70_000, 220_000))}; la capacitación toma dos semanas.`, commands: (s, k) => [{ type: "one_off", id: `${k}:costo`, label: "Barreras y reentrenamiento por turnos", amount: sz(s, 70_000, 220_000), payInDays: 20 }, { type: "safety", id: `${k}:seg`, delta: 0.05 }] },
      { id: "nada", stance: "arriesgada", label: "Registrar el reporte y seguir", blocked: "Un casi accidente con metal líquido exige corregir la causa de inmediato. Seguir igual deja expuesta a la gente.", detail: () => "", commands: () => [] },
    ],
  },
  {
    id: "se_ambiental", area: "seguridad", from: "supervisor", subject: "La autoridad ambiental detecta polvo fuera de norma", minDay: 260,
    body: (s) => [`Una visita de la autoridad ambiental midió emisiones de polvo por encima de la norma en el colector de humos. Da 30 días para presentar un plan.`, `${who(s, "mantenimiento")} dice que las mangas del colector están vencidas y que el ventilador ya no da el tiro.`],
    data: (s) => [["Reemplazo completo", mx(sz(s, 900_000, 3_500_000))], ["Reparación temporal", mx(sz(s, 150_000, 450_000))]],
    lesson: "Con la autoridad ambiental, un plan creíble a tiempo cuesta menos que una clausura. Diferir la inversión no la elimina.",
    requires: () => ok,
    options: [
      { id: "reemplazar", stance: "prudente", label: "Reemplazar mangas y ventilador ya", detail: (s) => `${mx(sz(s, 900_000, 3_500_000))} en dos pagos; el caso se cierra.`, commands: (s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Colector de humos: mangas y ventilador", amount: sz(s, 900_000, 3_500_000), capex: true, payInDays: 30 }] },
      { id: "plan", stance: "equilibrada", label: "Reparación temporal y plan de inversión a cuatro meses", detail: (s) => `${mx(sz(s, 150_000, 450_000))} ahora; el reemplazo queda comprometido para dentro de cuatro meses.`, commands: (s, k) => [{ type: "one_off", id: `${k}:temp`, label: "Reparación temporal del colector", amount: sz(s, 150_000, 450_000), payInDays: 15 }, { type: "later", id: `${k}:inv`, inDays: 120, cmd: { type: "one_off", id: `${k}:capex`, label: "Colector de humos: mangas y ventilador", amount: sz(s, 900_000, 3_500_000), capex: true, payInDays: 30 } }] },
      { id: "impugnar", stance: "arriesgada", label: "Impugnar la medición", detail: (s) => `${mx(sz(s, 220_000, 450_000))} en abogados y un estudio propio. La autoridad no acepta: clausura parcial de siete días y el reemplazo de todos modos.`, commands: (s, k) => [{ type: "one_off", id: `${k}:legal`, label: "Defensa legal ambiental", amount: sz(s, 220_000, 450_000), payInDays: 30 }, { type: "later", id: `${k}:clausura`, inDays: 45, cmd: { type: "downtime", id: `${k}:clausura`, days: 7 } }, { type: "later", id: `${k}:inv`, inDays: 50, cmd: { type: "one_off", id: `${k}:capex`, label: "Colector de humos: mangas y ventilador", amount: sz(s, 900_000, 3_500_000), capex: true, payInDays: 30 } }] },
    ],
  },

  // ── Capacidad (3)
  {
    id: "cap_pedidos", area: "capacidad", from: "supervisor", subject: "Llegan más pedidos de los que caben", minDay: 120,
    body: (s) => big(s)
      ? [`La planta opera a tres turnos y el laminador va al límite. Los clientes piden ${Math.round(s.contracts.reduce((a, k) => a + k.tpd, 0) * 0.1)} t diarias más.`]
      : [`La planta opera a dos turnos y los clientes piden más. ${who(s, "supervisor")} propone un tercer turno; ${who(s, "maestro")} prefiere horas extra los sábados.`],
    data: (s) => [["Utilización", pct(lastUtil(s))], ["Personal", `${headcountOf(s)}`], ["Nómina mensual", mx(payrollMonth(s))]],
    lesson: "Un turno adicional es un costo fijo nuevo: solo paga si el volumen extra es estable. Las horas extra son caras por tonelada pero reversibles.",
    requires: (s) => (big(s) || s.plant.shifts < 3 ? ok : no("Ya opera a tres turnos.")),
    options: [
      { id: "turno", stance: "arriesgada", label: "Más capacidad: tercer turno o domingos", detail: (s) => big(s) ? "Se opera también los domingos con horas extra: 8 % más capacidad con nómina 12 % mayor." : "Se contratan cuadrillas completas para el tercer turno. Más capacidad, más nómina y más mantenimiento.", commands: (s, k) => big(s) ? [{ type: "modify", id: `${k}:dom`, key: "availability", mult: 1.08, days: 900 }, { type: "add_fixed", id: `${k}:extra`, label: "Horas extra de domingo", amount: Math.round(payrollMonth(s) * 0.12) }, { type: "add_contract", id: `${k}:k`, client: "Distribuidora del Golfo", product: "varilla", tpd: 15, price: 14_500, dso: 45, startInDays: 20, beta: 1.6 }] : [{ type: "set_shifts", id: `${k}:t`, shifts: 3 }, { type: "add_contract", id: `${k}:k`, client: "Aceros del Bajío (relaminadora)", product: "palanquilla", tpd: 14, price: 11_900, dso: 30, startInDays: 20, beta: 1.8 }] },
      { id: "extra", stance: "equilibrada", label: "Horas extra los sábados y aceptar solo una parte", detail: (s) => `Capacidad 6 % mayor con ${mx(payrollMonth(s) * 0.08)} al mes de horas extra.`, commands: (s, k) => [{ type: "modify", id: `${k}:sab`, key: "availability", mult: 1.06, days: 900 }, { type: "add_fixed", id: `${k}:extra`, label: "Horas extra de sábado", amount: Math.round(payrollMonth(s) * 0.08) }, { type: "add_contract", id: `${k}:k`, client: big(s) ? "Distribuidora del Golfo" : "Aceros del Bajío (relaminadora)", product: big(s) ? "varilla" : "palanquilla", tpd: big(s) ? 8 : 4, price: big(s) ? 14_500 : 11_900, dso: 30, startInDays: 20, beta: 1.6 }] },
      { id: "no", stance: "prudente", label: "Atender solo lo que cabe", detail: () => "Sin costo nuevo; los pedidos extra se van a otro proveedor.", commands: () => [] },
    ],
  },
  {
    id: "cap_laminacion", area: "capacidad", from: "supervisor", subject: "Laminación: el cuello de botella", minDay: 240,
    body: (s) => big(s)
      ? [`El laminador corre al límite. Ampliarlo 40 t diarias (cajas de laminación y horno de recalentamiento) toma seis meses.`, "La alternativa es mandar el excedente a maquila con la Laminadora de Apodaca."]
      : [`La maquila de varilla cuesta ${mx(K.maquilaFee.value)} por tonelada más fletes. Hay un laminador usado de 80 t diarias a la venta en Apodaca.`, "Comprarlo integra la empresa; también la endeuda."],
    data: (s) => [["Caja", mx(cashOf(s) / 100)], ["EBITDA mensual reciente", mx(monthEbitda(s))]],
    lesson: "Integrar un proceso propio baja el costo variable pero sube el fijo y la deuda. Conviene cuando el volumen está asegurado.",
    requires: () => ok,
    options: [
      { id: "invertir", stance: "arriesgada", label: "Invertir", detail: (s) => big(s) ? `${mx(18_000_000)}: 40 % ahora y el resto al arrancar en seis meses.` : `${mx(32_000_000)} con crédito de ${mx(22_000_000)} a cinco años; arranca en seis meses.`, available: (s) => big(s) ? (cashOf(s) >= 18_000_000 * 100 * 0.4 ? ok : no("La caja no alcanza para el anticipo.")) : credit(s, 22_000_000), commands: (s, k) => big(s) ? [{ type: "expand_rolling", id: `${k}:lam`, capex: 18_000_000, tpd: 40, crew: 10, leadDays: 180 }] : [{ type: "buy_rolling_mill", id: `${k}:lam`, capex: 32_000_000, tpd: 80, crew: 18, leadDays: 180, financed: 22_000_000, rate: TEMPLATES_V2[s.templateId].bankRate, months: 60, utilities: 380_000 }] },
      { id: "maquila", stance: "equilibrada", label: "Contrato de maquila de largo plazo", detail: () => "Se firma maquila a dos años con tarifa 8 % menor a cambio de un volumen mínimo.", commands: (s, k) => [{ type: "modify", id: `${k}:tarifa`, key: "maquilaFee", mult: 0.92, days: 720 }, { type: "maquila_capacity", id: `${k}:cap`, tpd: Math.max(s.plant.maquilaTpd, sz(s, 25, 30)) }, { type: "add_fixed", id: `${k}:min`, label: "Mínimo garantizado de maquila", amount: sz(s, 40_000, 90_000) }] },
      { id: "no", stance: "prudente", label: "Seguir como está", detail: () => "Sin inversión ni compromisos.", commands: () => [] },
    ],
  },
  {
    id: "cap_horno", area: "capacidad", from: "maestro", subject: "Un horno más", minDay: 300,
    body: (s) => [`${who(s, "maestro")} trae la cotización de un horno de inducción de ${sz(s, 13.5, 38)} t por turno. Llega en seis meses e incluye subestación y colector.`, "Más capacidad de fusión sirve solo si la colada, la laminación y los clientes la absorben."],
    data: (s) => [["Inversión", mx(sz(s, 14_000_000, 75_000_000))], ["Crédito disponible", mx(sz(s, 9_000_000, 50_000_000))], ["Utilización", pct(lastUtil(s))], ["EBITDA mensual reciente", mx(monthEbitda(s))]],
    lesson: "La capacidad de una acería la fija su proceso más lento. Invertir en el horno sin colada, laminación y clientes es comprar capacidad ociosa.",
    requires: () => ok,
    options: [
      { id: "comprar", stance: "arriesgada", label: "Comprar el horno con crédito", detail: (s) => `${mx(sz(s, 14_000_000, 75_000_000))} con ${mx(sz(s, 9_000_000, 50_000_000))} financiados a cinco años. Se firma un distribuidor para el volumen extra.`, available: (s) => credit(s, sz(s, 9_000_000, 50_000_000)), commands: (s, k) => [{ type: "add_furnace", id: `${k}:h`, cost: sz(s, 14_000_000, 75_000_000), leadDays: 180, financed: sz(s, 9_000_000, 50_000_000), rate: TEMPLATES_V2[s.templateId].bankRate, months: 60, utilities: sz(s, 120_000, 550_000) }, { type: "add_contract", id: `${k}:k`, client: "Vivienda del Norte (distribuidor)", product: "varilla", tpd: sz(s, 10, 50), price: 14_100, dso: 60, payDelay: 10, startInDays: 200, beta: 2 }] },
      { id: "esperar", stance: "prudente", label: "Esperar a que la utilización se sostenga arriba de 95 %", detail: () => "Sin inversión; se revisa en seis meses.", commands: () => [] },
    ],
  },

  // ── Estrategia (3)
  {
    id: "es_caja", area: "estrategia", from: "dueno", subject: "Qué hacer con la caja", minDay: 330,
    body: (s) => [`${who(s, "dueno")} ve la caja en ${mx(cashOf(s) / 100)} y pregunta qué hacer: repartir dividendos, prepagar deuda o guardarla para lo que venga.`],
    data: (s) => [["Caja", mx(cashOf(s) / 100)], ["Deuda", mx(s.loans.reduce((a, l) => a + l.balance, 0) / 100)], ["Dos nóminas", mx(payrollMonth(s) * 2)]],
    lesson: "La caja que sobra tiene dueño: si no rinde más que su costo dentro de la empresa, se devuelve o se usa para bajar deuda cara.",
    requires: (s) => (cashOf(s) > sz(s, 8_000_000, 60_000_000) * 100 ? ok : no("La caja no está holgada.")),
    options: [
      { id: "dividendo", stance: "arriesgada", label: "Repartir un tercio como dividendo", detail: (s) => `${mx(cashOf(s) / 300)} a los accionistas.`, commands: (s, k) => [{ type: "dividend", id: `${k}:d`, amount: Math.round(cashOf(s) / 300) }] },
      { id: "prepago", stance: "equilibrada", label: "Prepagar deuda con un tercio", detail: (s) => `${mx(Math.min(cashOf(s) / 300, s.loans.reduce((a, l) => a + l.balance, 0) / 100))} al crédito más caro.`, available: (s) => (s.loans.some((l) => l.balance > 0) ? ok : no("No hay deuda.")), commands: (s, k) => [{ type: "prepay_debt", id: `${k}:p`, amount: Math.round(cashOf(s) / 300) }] },
      { id: "guardar", stance: "prudente", label: "Guardarla", detail: () => "Rinde lo que paga el banco a la vista y protege contra un mal ciclo.", commands: () => [] },
    ],
  },
  {
    id: "es_largo_plazo", area: "estrategia", from: "admin", subject: "Contrato de suministro a dos años", minDay: 280,
    body: (s) => { const k = biggest(s); return [`${k.client} ofrece fijar precio y volumen por dos años: 2 % abajo del precio actual a cambio de 15 % más volumen garantizado.`, "Protege si el mercado cae; deja dinero en la mesa si sube."]; },
    lesson: "Fijar precio es cambiar riesgo por certidumbre. Conviene cuando tu caja o tu deuda no aguantan un mal ciclo.",
    requires: (s) => (s.contracts.length ? ok : no("Sin contratos.")),
    options: [
      { id: "firmar", stance: "prudente", label: "Firmar a precio fijo", detail: () => "El precio queda fijo dos años (no sigue al mercado) con 15 % más volumen.", commands: (s, k) => { const c = biggest(s); return [{ type: "change_contract", id: `${k}:c`, contractId: c.id, price: Math.round((c.price / 100) * 0.98), tpd: Math.round(c.tpd * 1.15), beta: 0 }]; } },
      { id: "spot", stance: "arriesgada", label: "Seguir a precio de mercado", detail: () => "El precio sigue al mercado, para bien y para mal.", commands: () => [] },
    ],
  },
  {
    id: "es_ciclo", area: "estrategia", from: "admin", subject: "El precio del acero empieza a caer", minDay: 360,
    body: (s) => [`La varilla importada llega más barata y los distribuidores bajan precios. ${who(s, "admin")} estima seis meses de mercado débil.`, "Las opciones: recortar producción, sostenerla buscando mercados nuevos o seguir igual."],
    data: (s) => [["EBITDA mensual reciente", mx(monthEbitda(s))], ["Personal", `${headcountOf(s)}`], ["Caja", mx(cashOf(s) / 100)]],
    lesson: "En la baja del ciclo, el costo de despedir y recontratar compite con el costo de producir con margen bajo. La caja decide cuánto puedes esperar.",
    requires: (s) => (s.day >= 360 && s.day <= 480 ? ok : no("La baja llega en el mes trece.")),
    options: [
      { id: "recortar", stance: "prudente", label: "Recortar producción un turno", detail: (s) => `${big(s) ? "Se baja la colada a dos turnos" : "Se baja a un turno"}: salen cuadrillas con indemnización, baja la nómina y la energía. Se acuerda con los clientes surtir ${Math.round((100 * (s.plant.shifts - 1)) / s.plant.shifts)} % de su volumen durante seis meses; después se recontrata y se vuelve al volumen normal.`, available: (s) => (s.plant.shifts > 1 ? ok : no("Ya opera a un turno.")), commands: (s, k) => { const r = (s.plant.shifts - 1) / s.plant.shifts; const live = s.contracts.filter((c) => c.startDay <= s.day && c.tpd > 0); return [{ type: "set_shifts", id: `${k}:t`, shifts: s.plant.shifts - 1 }, ...live.map((c): SteelCommand => ({ type: "change_contract", id: `${k}:v:${c.id}`, contractId: c.id, tpd: Math.max(1, Math.round(c.tpd * r)) })), { type: "later", id: `${k}:vuelve`, inDays: 180, cmd: { type: "set_shifts", id: `${k}:t2`, shifts: s.plant.shifts } }, ...live.map((c): SteelCommand => ({ type: "later", id: `${k}:r:${c.id}`, inDays: 181, cmd: { type: "change_contract", id: `${k}:r:${c.id}`, contractId: c.id, tpd: c.tpd } }))]; } },
      { id: "exportar", stance: "arriesgada", label: "Buscar exportación a Texas", detail: (s) => `Un comprador de Houston toma ${sz(s, 8, 30)} t diarias de palanquilla a ${mx(11_400)} puesta en frontera, a 30 días.`, commands: (s, k) => [{ type: "add_contract", id: `${k}:k`, client: "Comprador de Houston (exportación)", product: "palanquilla", tpd: sz(s, 8, 30), price: 11_400, dso: 30, startInDays: 15 }, { type: "later", id: `${k}:fin`, inDays: 195, cmd: { type: "drop_contract", id: `${k}:fin`, contractId: `${k}:k` } }] },
      { id: "sostener", stance: "equilibrada", label: "Sostener producción y empleo", detail: () => "Se conserva a la gente para la recuperación; el margen baja mientras dura el ciclo.", commands: (_s, k) => [{ type: "relation", id: `${k}:r`, key: "staff", delta: 0.05 }] },
    ],
  },
];

// ───────────────────────────────────────────────────────── caso de liquidez (estructural, repetible)
/** Caso que arma el motor cuando la liquidez entra en alerta o crisis: las opciones son las alternativas de gestión. */
export function liquidityCase(s: SteelState): SCase | null {
  if (s.liquidity === "sana") return null;
  const opts = liquidityOptions(s, "caso");
  return {
    id: `liq@${s.day}`, area: "estrategia", from: "admin", minDay: 0,
    subject: s.liquidity === "crisis" ? "Hay pagos vencidos" : "La caja no alcanza para los próximos 30 días",
    body: () => [s.liquidity === "crisis" ? `Hay ${mx(overdueTotal(s) / 100)} vencidos. Cada acreedor reacciona distinto: chatarreros, CFE, IMSS y SAT, banco y personal.` : "Lo que vence en 30 días no cabe en la caja más lo que se cobra en ese plazo. Hay tiempo para actuar."],
    lesson: "En una crisis de caja, primero lo que detiene la planta (energía, chatarra, nómina) y lo que genera recargos; después lo que solo cuesta intereses.",
    requires: () => ok,
    options: opts.map((o) => ({ id: o.id, label: o.label, stance: "equilibrada" as const, detail: () => `Libera ${mx(o.cash / 100)} en ${o.inDays} días. Costo: ${o.cost}.`, available: () => (o.available ? ok : no(o.reason ?? "No disponible.")), commands: () => [o.cmd] })),
  };
}

// ───────────────────────────────────────────────────────── selección adaptable y decisión
export const caseById = (id: string) => STEEL_CASES.find((c) => c.id === id);

export function eligible(s: SteelState, log: readonly LogEntry[]): SCase[] {
  return STEEL_CASES.filter((c) => s.day >= c.minDay && !decided(log, c.id) && (!c.after || decided(log, c.after.case, c.after.options)) && c.requires(s, log).ok);
}

/**
 * Selector determinista y adaptable. Da prioridad a lo que el estado pide (seguridad baja → seguridad; planta llena →
 * capacidad; caja holgada → estrategia) y a temas que pongan a prueba la postura habitual del jugador (si suele
 * arriesgar, llegan más casos de riesgo y ciclo; si es prudente, más casos de crecimiento).
 */
export function rank(s: SteelState, log: readonly LogEntry[]): { c: SCase; score: number; why: string }[] {
  const stances = log.filter((e) => e.ok).map((e) => caseById(e.caseId)?.options.find((o) => o.id === e.optionId)?.stance).filter(Boolean);
  const risky = stances.filter((x) => x === "arriesgada").length, careful = stances.filter((x) => x === "prudente").length;
  const util = lastUtil(s);
  return eligible(s, log).map((c) => {
    let score = 1, why = "turno normal";
    if (c.safety && s.safety < 0.75) { score += 2; why = "la cultura de seguridad viene bajando"; }
    if (c.area === "capacidad" && util > 0.93) { score += 1.5; why = "la planta va llena"; }
    if (c.area === "estrategia" && s.liquidity === "sana" && cashOf(s) > sz(s, 8_000_000, 60_000_000) * 100) { score += 1; why = "la caja está holgada"; }
    if (risky > careful + 1 && ["es_ciclo", "es_largo_plazo", "cl_atraso", "en_suministrador"].includes(c.id)) { score += 1.2; why = "tus decisiones recientes tomaron riesgo: este caso lo pone a prueba"; }
    if (careful > risky + 1 && ["cl_60dias", "cl_licitacion", "cap_pedidos", "ch_patio"].includes(c.id)) { score += 1.2; why = "tus decisiones recientes fueron prudentes: este caso ofrece crecer"; }
    if (c.area === "calidad" && s.relations.clients < 0.7) { score += 0.8; why = "la relación con clientes está tensa"; }
    score += hash(`${s.seed}|${c.id}|${Math.floor(s.day / 30)}`) * 0.5;
    return { c, score, why };
  }).sort((a, b) => b.score - a.score);
}
function hash(k: string) { let h = 0x811c9dc5; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h / 0x100000000; }

/**
 * El motor propone el caso; la IA puede sugerir otro de la lista de elegibles (`aiPick`). Si la sugerencia no es
 * elegible, se ignora y queda registrado. Devuelve el caso elegido y la razón (para la bitácora).
 */
export function nextCase(s: SteelState, log: readonly LogEntry[], aiPick?: string): { c: SCase; source: "motor" | "ia"; why: string } | null {
  const liq = liquidityCase(s);
  if (liq && s.liquidity === "crisis") return { c: liq, source: "motor", why: "hay pagos vencidos" };
  const r = rank(s, log);
  if (aiPick) { const hit = r.find((x) => x.c.id === aiPick); if (hit) return { c: hit.c, source: "ia", why: "elegido por la IA entre los casos elegibles" }; }
  if (liq) return { c: liq, source: "motor", why: "la liquidez está en alerta" };
  return r.length ? { c: r[0].c, source: "motor", why: r[0].why } : null;
}

export function optionCheck(s: SteelState, o: SOption): Check {
  if (o.blocked) return no(o.blocked);
  return o.available ? o.available(s) : ok;
}

/** Aplica una opción: solo comandos del motor. Registra en la bitácora lo que se aplicó (o por qué no). */
export function decideSteel(s: SteelState, c: SCase, optionId: string, log: LogEntry[], source: "motor" | "ia" = "motor"): { ok: boolean; reason?: string } {
  const o = c.options.find((x) => x.id === optionId);
  if (!o) return { ok: false, reason: "Opción desconocida." };
  const chk = optionCheck(s, o);
  if (!chk.ok) { log.push({ day: s.day, caseId: c.id, optionId, commands: [], source, ok: false, reason: chk.reason }); return chk; }
  const key = `${c.id}@${s.day}`;
  const cmds = o.commands(s, key);
  const done: string[] = [];
  for (const cmd of cmds) {
    const r = applySteel(s, cmd);
    if (!r.ok) { log.push({ day: s.day, caseId: c.id, optionId, commands: done, source, ok: false, reason: r.reason }); return { ok: false, reason: r.reason }; }
    done.push(`${cmd.type}:${cmd.id}`);
  }
  log.push({ day: s.day, caseId: c.id, optionId, commands: done, source, ok: true });
  return { ok: true };
}

/** Vista previa calculada por el motor: diferencia a N días contra no hacer nada (EBITDA, utilidad y caja). */
export function previewOption(s: SteelState, c: SCase, optionId: string, days = 120): { ebitda: number; net: number; cash: number; text: string } | null {
  const o = c.options.find((x) => x.id === optionId);
  if (!o || !optionCheck(s, o).ok) return null;
  const base = advanceSteel(s, days);
  const t = advanceSteel(s, 0);
  for (const cmd of o.commands(t, `prev:${c.id}`)) if (!applySteel(t, cmd).ok) return null;
  const after = advanceSteel(t, days);
  const sum = (x: SteelState, k: "ebitda" | "net") => x.months.slice(s.months.length).reduce((a, m) => a + m[k], 0);
  const r = { ebitda: sum(after, "ebitda") - sum(base, "ebitda"), net: sum(after, "net") - sum(base, "net"), cash: cashOf(after) - cashOf(base) };
  const sign = (x: number) => `${x >= 0 ? "+" : "−"}$${fmt(Math.abs(x))}`;
  return { ...r, text: `En ${Math.round(days / 30)} meses, contra no hacer nada: EBITDA ${sign(r.ebitda)}, utilidad ${sign(r.net)}, caja ${sign(r.cash)}.` };
}
