/**
 * Retail v2 (cadena de conveniencia) · 26 casos propios, selector adaptable y bitácora de auditoría.
 *
 * Reglas (las mismas de la acería):
 *  - Cada opción se traduce SOLO en comandos del motor (`RetailCommand`). Los montos salen del estado (tiendas abiertas,
 *    venta, nómina, caja). La IA puede elegir cuál caso elegible llega, pero no puede crear efectos.
 *  - Riesgos graves de seguridad tienen límite claro: la opción insegura aparece bloqueada con su razón.
 *  - Continuidad: `after` encadena casos según lo decidido antes; algunos efectos llegan días después (`later`).
 */
import { applyRetail, advanceRetail, cashOf, calOf, storesOpen, headcountOf, liquidityOptions, overdueTotal, bankQuote, fmt, type RetailCommand, type RetailState } from "./engine";
import { TEMPLATES_RETAIL } from "./params";

export type Area = "operacion" | "abasto" | "personal" | "seguridad" | "comercial" | "expansion" | "finanzas" | "estrategia";
export const AREA_LABEL: Readonly<Record<Area, string>> = Object.freeze({ operacion: "Operación de tiendas", abasto: "Abasto y proveedores", personal: "Personal", seguridad: "Seguridad", comercial: "Comercial", expansion: "Expansión", finanzas: "Finanzas", estrategia: "Estrategia" });

export interface Check { ok: boolean; reason?: string }
export interface ROption {
  id: string; label: string;
  detail: (s: RetailState) => string;
  commands: (s: RetailState, key: string) => RetailCommand[];
  available?: (s: RetailState) => Check;
  /** Límite de seguridad: la opción se muestra bloqueada con esta razón y nunca se puede elegir. */
  blocked?: string;
  stance: "prudente" | "equilibrada" | "arriesgada";
}
export interface RCase {
  id: string; area: Area; from: string; subject: string;
  body: (s: RetailState) => string[];
  data?: (s: RetailState) => [string, string][];
  lesson: string;
  requires: (s: RetailState, log: readonly LogEntry[]) => Check;
  after?: { case: string; options: string[] };
  options: ROption[];
  safety?: boolean;
  minDay: number;
}
export interface LogEntry { day: number; caseId: string; optionId: string; commands: string[]; source: "motor" | "ia"; ok: boolean; reason?: string }

// ───────────────────────────────────────────────────────── utilidades
const FOREVER = 100_000;
const who = (s: RetailState, role: string) => TEMPLATES_RETAIL[s.templateId].people[role] ?? role;
const mx = (pesos: number) => `$${Math.round(pesos).toLocaleString("en-US")}`;
const ok: Check = { ok: true };
const no = (reason: string): Check => ({ ok: false, reason });
const decided = (log: readonly LogEntry[], id: string, opts?: string[]) => log.some((e) => e.ok && e.caseId === id && (!opts || opts.includes(e.optionId)));
const group = (s: RetailState, id: string) => s.groups.find((g) => g.id === id);
const openIn = (s: RetailState, id: string) => { const g = group(s, id); return g ? storesOpen(s, g) : 0; };
/** Venta mensual reciente en pesos (o estimada si aún no cierra el primer mes). */
const monthSales = (s: RetailState) => { const ms = s.months.slice(-3); return ms.length ? ms.reduce((a, m) => a + m.revenue, 0) / ms.length / 100 : s.cur.sales / 100 / Math.max(1, (s.day % 30) + 1) * 30; };
const monthEbitda = (s: RetailState) => { const ms = s.months.slice(-3); return ms.length ? ms.reduce((a, m) => a + m.ebitda, 0) / ms.length / 100 : 0; };
const cash = (s: RetailState) => cashOf(s) / 100;
/** La caja debe cubrir el anticipo de la inversión y dejar un colchón de un mes de nómina. */
const affordable = (s: RetailState, pesos: number): Check => (cash(s) - pesos >= 25_000_000 ? ok : no(`La caja (${mx(cash(s))}) no alcanza para ${mx(pesos)} y dejar el colchón mínimo de operación.`));
const credit = (s: RetailState, amount: number): Check => { const q = bankQuote(s, amount, TEMPLATES_RETAIL[s.templateId].bankRate, 60); return q.ok ? ok : no(q.reason ?? "El banco no aprueba el crédito."); };
const both = (...xs: Check[]): Check => xs.find((x) => !x.ok) ?? ok;
const lastFill = (s: RetailState) => s.months.at(-1)?.fill ?? 1;
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;

// ───────────────────────────────────────────────────────── los 26 casos
export const RETAIL_CASES: readonly RCase[] = [
  // ── Operación de tiendas (3)
  {
    id: "op_frio", area: "operacion", from: "operaciones", subject: "Falla la refrigeración en varias tiendas por el calor", minDay: 30, safety: true,
    body: (s) => [
      `${who(s, "operaciones")} reporta que en 18 tiendas los refrigeradores de lácteos y comida preparada no bajaron de 8 °C durante la madrugada.`,
      "El producto sigue viéndose bien. Tirarlo cuesta; venderlo es arriesgar una intoxicación en un cliente y una clausura de COFEPRIS.",
      "El técnico dice que los equipos tienen años sin mantenimiento preventivo y que con el calor va a volver a pasar.",
    ],
    data: () => [["Producto en riesgo", mx(410_000)], ["Tiendas afectadas", "18"]],
    lesson: "En comida, la cadena de frío no se negocia: el costo de tirar producto es pequeño frente al de enfermar a un cliente. El mantenimiento preventivo es más barato que la emergencia.",
    requires: () => ok,
    options: [
      { id: "tirar", stance: "prudente", label: "Retirar el producto y reparar los equipos", detail: () => `Se tiran ${mx(410_000)} de producto y se reparan los equipos (${mx(380_000)}). Las tiendas reponen en dos días.`, commands: (_s, k) => [{ type: "one_off", id: `${k}:merma`, label: "Producto retirado por cadena de frío rota", amount: 410_000, payInDays: 1 }, { type: "one_off", id: `${k}:rep`, label: "Reparación de refrigeración", amount: 380_000, payInDays: 20 }, { type: "safety", id: `${k}:s`, delta: 0.02 }] },
      { id: "preventivo", stance: "equilibrada", label: "Retirar, reparar y contratar mantenimiento preventivo", detail: (s) => `Además de retirar y reparar, un contrato de mantenimiento preventivo de ${mx(Math.round(storesOpen(s) * 1_300))} al mes: menos fallas, menos merma de comida y equipos que gastan menos luz.`, commands: (s, k) => [{ type: "one_off", id: `${k}:merma`, label: "Producto retirado por cadena de frío rota", amount: 410_000, payInDays: 1 }, { type: "one_off", id: `${k}:rep`, label: "Reparación de refrigeración", amount: 380_000, payInDays: 20 }, { type: "add_fixed", id: `${k}:contrato`, label: "Mantenimiento preventivo de refrigeración", amount: Math.round(storesOpen(s) * 1_300) }, { type: "modify", id: `${k}:merma2`, key: "shrink", cat: "comida", mult: 0.85, days: FOREVER, inDays: 30 }, { type: "modify", id: `${k}:luz`, key: "energy", mult: 0.97, days: FOREVER, inDays: 30 }, { type: "safety", id: `${k}:s`, delta: 0.03 }] },
      { id: "vender", stance: "arriesgada", label: "Vender el producto: se ve bien", blocked: "Vender lácteos y comida que estuvieron arriba de 8 °C pone en riesgo la salud de los clientes y expone a la cadena a una clausura sanitaria. No es una decisión de negocio disponible.", detail: () => "", commands: () => [] },
    ],
  },
  {
    id: "op_horario", area: "operacion", from: "operaciones", subject: "¿Vale la pena abrir de noche las tiendas de bajo tráfico?", minDay: 60,
    body: (s) => [
      `De medianoche a 6 de la mañana, las ${openIn(s, "rezagadas")} tiendas de bajo tráfico venden poco y concentran asaltos.`,
      "Cerrarlas de noche ahorra el turno nocturno y su prima, pero se pierde cerca de 17 % de su venta y algunos clientes de día se van con la competencia que sí abre.",
      "Una ventanilla nocturna mantiene la venta con menos riesgo, pero hay que invertir en cada tienda.",
    ],
    data: (s) => [["Tiendas", `${openIn(s, "rezagadas")}`], ["Ventanilla por tienda", mx(85_000)]],
    lesson: "El horario es una decisión de margen y de seguridad a la vez: la venta de la noche paga el turno solo si hay tráfico.",
    requires: (s) => (openIn(s, "rezagadas") > 0 && group(s, "rezagadas")!.nightShift ? ok : no("No hay tiendas de bajo tráfico abiertas de noche.")),
    options: [
      { id: "cerrar_noche", stance: "prudente", label: "Cerrar de noche las tiendas de bajo tráfico", detail: () => "Se quitan dos personas del turno nocturno en cada tienda; la venta baja y el riesgo de asalto también.", commands: (_s, k) => [{ type: "night_shift", id: `${k}:n`, group: "rezagadas", on: false }, { type: "safety", id: `${k}:s`, delta: 0.01 }] },
      { id: "ventanilla", stance: "equilibrada", label: "Instalar ventanilla nocturna", detail: (s) => `${mx(openIn(s, "rezagadas") * 85_000)} de inversión. De noche se atiende por ventanilla: la venta se mantiene y los asaltos bajan a la mitad en esas tiendas.`, available: (s) => affordable(s, openIn(s, "rezagadas") * 85_000), commands: (s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Ventanillas nocturnas", amount: openIn(s, "rezagadas") * 85_000, capex: true, payInDays: 30 }, { type: "modify", id: `${k}:rob`, key: "robbery", group: "rezagadas", mult: 0.5, days: FOREVER, inDays: 30 }, { type: "modify", id: `${k}:v`, key: "demand", group: "rezagadas", mult: 0.98, days: FOREVER, inDays: 30 }] },
      { id: "igual", stance: "arriesgada", label: "Mantener las 24 horas como están", detail: () => "Sin inversión ni cambio de venta.", commands: () => [] },
    ],
  },
  {
    id: "op_energia", area: "operacion", from: "finanzas", subject: "El recibo de luz ya es la tercera línea de gasto de las tiendas", minDay: 90,
    body: (s) => [`${who(s, "finanzas")} trae dos propuestas para bajar el gasto de energía, que sube cada verano con el aire acondicionado y los refrigeradores.`, "Iluminación LED y puertas en los refrigeradores abiertos se pagan en menos de dos años. Paneles solares en los techos ahorran más, pero la inversión es cuatro veces mayor."],
    data: (s) => [["Tiendas", `${storesOpen(s)}`], ["LED y puertas por tienda", mx(45_000)], ["Paneles por tienda", mx(180_000)]],
    lesson: "Un ahorro recurrente vale lo que ahorra al año contra lo que cuesta hoy: compara el periodo de recuperación con la vida del equipo y con lo que la caja necesita para otras cosas.",
    requires: () => ok,
    options: [
      { id: "led", stance: "prudente", label: "LED y puertas en refrigeradores", detail: (s) => `${mx(storesOpen(s) * 45_000)} de inversión; el consumo de las tiendas baja 12 % en dos meses.`, available: (s) => affordable(s, storesOpen(s) * 45_000), commands: (s, k) => [{ type: "one_off", id: `${k}:capex`, label: "LED y puertas en refrigeradores", amount: storesOpen(s) * 45_000, capex: true, payInDays: 45 }, { type: "modify", id: `${k}:e`, key: "energy", mult: 0.88, days: FOREVER, inDays: 60 }] },
      { id: "solar", stance: "arriesgada", label: "Paneles solares en las tiendas propias y en techos rentados", detail: (s) => `${mx(storesOpen(s) * 180_000)} de inversión; el consumo de CFE baja 30 % en cuatro meses.`, available: (s) => affordable(s, storesOpen(s) * 180_000), commands: (s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Paneles solares", amount: storesOpen(s) * 180_000, capex: true, payInDays: 60 }, { type: "modify", id: `${k}:e`, key: "energy", mult: 0.7, days: FOREVER, inDays: 120 }] },
      { id: "nada", stance: "equilibrada", label: "No invertir por ahora", detail: () => "La caja queda para otras prioridades.", commands: () => [] },
    ],
  },

  // ── Abasto y proveedores (4)
  {
    id: "ab_refresquera", area: "abasto", from: "compras", subject: "La embotelladora ofrece más dinero a cambio de exclusividad de anaquel", minDay: 20,
    body: (s) => [`${who(s, "refresquera")} propone subir su apoyo comercial (exhibidores, enfriadores y bonos por volumen) si sus marcas ocupan todo el refrigerador de refrescos.`, `${who(s, "compras")} advierte que algunos clientes buscan otras marcas, y que la exclusividad amarra la negociación de los próximos años.`],
    data: (s) => [["Venta mensual", mx(monthSales(s))], ["Bebidas en la venta", "38 %"]],
    lesson: "Los ingresos comerciales de proveedores son una parte grande de la utilidad de una cadena de conveniencia; el precio es la libertad de surtido y la fuerza para negociar después.",
    requires: () => ok,
    options: [
      { id: "exclusiva", stance: "arriesgada", label: "Aceptar la exclusividad", detail: () => "El apoyo comercial sube 0.4 % de la venta. Se pierde algo de venta de bebidas de otras marcas y algunos clientes lo notan.", commands: (_s, k) => [{ type: "modify", id: `${k}:ci`, key: "commercial", add: 0.004, days: FOREVER }, { type: "modify", id: `${k}:sh`, key: "share", cat: "bebidas", mult: 0.97, days: FOREVER }, { type: "relation", id: `${k}:cl`, key: "clients", delta: -0.02 }] },
      { id: "negociar", stance: "equilibrada", label: "Negociar 70 % del espacio sin exclusividad", detail: () => "El apoyo comercial sube 0.15 % de la venta y se conserva el surtido.", commands: (_s, k) => [{ type: "modify", id: `${k}:ci`, key: "commercial", add: 0.0015, days: FOREVER }, { type: "relation", id: `${k}:sup`, key: "suppliers", delta: 0.02 }] },
      { id: "rechazar", stance: "prudente", label: "Rechazar y mantener el surtido actual", detail: () => "Sin cambios en ingresos ni surtido.", commands: () => [] },
    ],
  },
  {
    id: "ab_cerveza", area: "abasto", from: "compras", subject: "La cervecera quiere ser la única marca a cambio de refrigeradores y descuento", minDay: 45,
    body: (s) => [`${who(s, "cervecera")} ofrece un pago inicial, mejor precio y refrigeradores nuevos si deja de venderse la marca de la competencia.`, "En el norte, la cerveza es una de las razones principales de visita de noche y fin de semana; hay clientes fieles a cada marca."],
    data: (s) => [["Pago inicial", mx(storesOpen(s) * 24_000)], ["Cerveza en la venta", "14 %"]],
    lesson: "La exclusividad con un proveedor dominante mejora el margen hoy, pero cambia lo que el cliente encuentra en tu tienda. Hay que estimar cuántos clientes se van y cuánto compraban además de la cerveza.",
    requires: () => ok,
    options: [
      { id: "aceptar", stance: "arriesgada", label: "Aceptar la exclusividad", detail: (s) => `Pago inicial de ${mx(storesOpen(s) * 24_000)} y 2 puntos más de margen en cerveza; la venta de cerveza baja 6 % por los clientes de la otra marca.`, commands: (s, k) => [{ type: "one_off", id: `${k}:pago`, label: "Pago inicial por exclusividad de cerveza", amount: storesOpen(s) * 24_000, payInDays: 30, account: "otros_ingresos" }, { type: "modify", id: `${k}:m`, key: "margin", cat: "cerveza", add: 0.02, days: FOREVER }, { type: "modify", id: `${k}:sh`, key: "share", cat: "cerveza", mult: 0.94, days: FOREVER }, { type: "modify", id: `${k}:d`, key: "demand", mult: 0.995, days: FOREVER }] },
      { id: "dos_marcas", stance: "prudente", label: "Mantener las dos marcas", detail: () => "Sin pago ni cambio de margen; se conserva el surtido.", commands: () => [] },
      { id: "espacio", stance: "equilibrada", label: "Darle más espacio sin exclusividad", detail: () => "1 punto más de margen en cerveza a cambio de 60 % del refrigerador.", commands: (_s, k) => [{ type: "modify", id: `${k}:m`, key: "margin", cat: "cerveza", add: 0.01, days: FOREVER }] },
    ],
  },
  {
    id: "ab_marca_propia", area: "abasto", from: "compras", subject: "Lanzar marca propia en abarrotes", minDay: 120,
    body: (s) => [`${who(s, "compras")} tiene cotizaciones para agua, botanas, galletas y básicos de limpieza con la marca de la cadena.`, "El margen es mucho mayor que el de las marcas líderes, pero hay que invertir en diseño, registros y la primera producción, y los proveedores grandes reducen su apoyo comercial cuando pierden anaquel."],
    data: () => [["Desarrollo y primera producción", mx(6_500_000)]],
    lesson: "La marca propia cambia margen por riesgo de surtido y por la relación con los proveedores que pagan apoyo comercial.",
    requires: () => ok,
    options: [
      { id: "amplia", stance: "arriesgada", label: "Lanzar 60 productos", detail: () => `${mx(6_500_000)} de inversión. El margen de abarrotes sube 3.5 puntos en cuatro meses; el apoyo comercial de proveedores baja 8 %.`, available: (s) => affordable(s, 6_500_000), commands: (_s, k) => [{ type: "one_off", id: `${k}:dev`, label: "Desarrollo de marca propia", amount: 6_500_000, payInDays: 30 }, { type: "modify", id: `${k}:m`, key: "margin", cat: "abarrotes", add: 0.035, days: FOREVER, inDays: 120 }, { type: "modify", id: `${k}:ci`, key: "commercial", mult: 0.92, days: FOREVER, inDays: 90 }, { type: "modify", id: `${k}:inv`, key: "invDays", cat: "abarrotes", mult: 1.2, days: FOREVER, inDays: 90 }] },
      { id: "piloto", stance: "equilibrada", label: "Lanzar 15 productos de alta rotación", detail: () => `${mx(1_800_000)}. El margen de abarrotes sube 1 punto; casi no afecta el apoyo de proveedores.`, commands: (_s, k) => [{ type: "one_off", id: `${k}:dev`, label: "Desarrollo de marca propia (piloto)", amount: 1_800_000, payInDays: 30 }, { type: "modify", id: `${k}:m`, key: "margin", cat: "abarrotes", add: 0.01, days: FOREVER, inDays: 90 }, { type: "modify", id: `${k}:ci`, key: "commercial", mult: 0.98, days: FOREVER, inDays: 90 }] },
      { id: "no", stance: "prudente", label: "No por ahora", detail: () => "Sin inversión ni cambios.", commands: () => [] },
    ],
  },
  {
    id: "ab_cedis", area: "abasto", from: "cedis", subject: "El CEDIS ya no da abasto en los días pico", minDay: 150,
    body: (s) => [`${who(s, "cedis")} reporta que los viernes y en quincena el surtido sale tarde y las tiendas reciben incompleto.`, `El CEDIS está pensado para ${s.cedis.capacityStores} tiendas y hoy surte a ${storesOpen(s)}. Cuando se pasa de su capacidad, los fletes y las horas extra se disparan.`],
    data: (s) => [["Tiendas abiertas", `${storesOpen(s)}`], ["Capacidad del CEDIS", `${s.cedis.capacityStores}`], ["Venta surtida el último mes", pct(lastFill(s))]],
    lesson: "La logística es la columna de una cadena: crecer tiendas sin crecer el CEDIS sube el costo por entrega y vacía anaqueles.",
    requires: (s) => (storesOpen(s) >= s.cedis.capacityStores * 0.88 || lastFill(s) < 0.97 ? ok : no("El CEDIS todavía tiene holgura.")),
    options: [
      { id: "turno", stance: "prudente", label: "Turno nocturno en el CEDIS y diez camiones más", detail: () => `30 personas más en el CEDIS y 10 operadores; capacidad para 40 tiendas más. Camiones por ${mx(14_000_000)}.`, available: (s) => affordable(s, 14_000_000), commands: (s, k) => [{ type: "hire", id: `${k}:cedis`, crew: "cedis", n: 30 }, { type: "hire", id: `${k}:fl`, crew: "flotilla", n: 10 }, { type: "one_off", id: `${k}:cam`, label: "Camiones de reparto", amount: 14_000_000, capex: true, payInDays: 45 }, { type: "cedis_capacity", id: `${k}:cap`, stores: s.cedis.capacityStores + 40 }] },
      { id: "satelite", stance: "equilibrada", label: "Rentar una bodega satélite en Saltillo", detail: () => `Renta de ${mx(420_000)} al mes y luz de ${mx(90_000)}; capacidad para 70 tiendas más y menos kilómetros a Saltillo.`, commands: (s, k) => [{ type: "cedis_capacity", id: `${k}:cap`, stores: s.cedis.capacityStores + 70, rent: 420_000, energy: 90_000 }, { type: "hire", id: `${k}:cedis`, crew: "cedis", n: 25 }, { type: "modify", id: `${k}:fl`, key: "logistics", mult: 0.97, days: FOREVER, inDays: 30 }] },
      { id: "directo", stance: "arriesgada", label: "Que los proveedores entreguen directo en tienda", detail: () => "Baja el volumen del CEDIS y sus fletes, pero los proveedores cobran el servicio: 1.5 puntos menos de margen en abarrotes.", commands: (_s, k) => [{ type: "modify", id: `${k}:fl`, key: "logistics", mult: 0.85, days: FOREVER }, { type: "modify", id: `${k}:m`, key: "margin", cat: "abarrotes", add: -0.015, days: FOREVER }, { type: "cedis_capacity", id: `${k}:cap`, stores: 460 }] },
    ],
  },

  // ── Personal (3)
  {
    id: "pe_rotacion", area: "personal", from: "personas", subject: "La rotación en tiendas no baja", minDay: 25,
    body: (s) => [`${who(s, "personas")} calcula que cada mes se va cerca de una de cada doce personas de tienda. Cada salida cuesta reclutamiento, capacitación y semanas con tiendas incompletas.`, "Las encuestas de salida dicen lo mismo: sueldo, horarios que cambian cada semana y miedo al turno de noche."],
    data: (s) => [["Personal de tienda", `${headcountOf(s)}`], ["Puestos cubiertos", pct(s.staffing)]],
    lesson: "En conveniencia, la rotación es un costo invisible: la tienda sin personal completo vende menos, roba más y atiende peor.",
    requires: () => ok,
    options: [
      { id: "prima", stance: "equilibrada", label: "Bono de permanencia de 4 % sobre el sueldo", detail: () => "Sube la nómina de tienda 4 %; la rotación baja cerca de 20 %.", commands: (s, k) => [{ type: "pay_premium", id: `${k}:p`, premium: Math.max(0.04, s.index.payPremium + 0.02) }] },
      { id: "horarios", stance: "prudente", label: "Horarios fijos y plan de carrera a encargado", detail: (s) => `Programa de ${mx(Math.round(storesOpen(s) * 1_800))} al mes (más supervisores de personal y capacitación). La rotación baja 15 % en tres meses.`, commands: (s, k) => [{ type: "add_fixed", id: `${k}:prog`, label: "Programa de horarios fijos y carrera", amount: Math.round(storesOpen(s) * 1_800) }, { type: "modify", id: `${k}:t`, key: "turnover", mult: 0.85, days: FOREVER, inDays: 90 }, { type: "relation", id: `${k}:r`, key: "staff", delta: 0.04 }] },
      { id: "nada", stance: "arriesgada", label: "Aceptar la rotación como parte del negocio", detail: () => "Sin costo adicional; el clima laboral no mejora.", commands: (_s, k) => [{ type: "relation", id: `${k}:r`, key: "staff", delta: -0.02 }] },
    ],
  },
  {
    id: "pe_salario", area: "personal", from: "personas", subject: "Sube el salario mínimo en enero", minDay: 200,
    body: (s) => [`El salario mínimo sube cerca de 10 % en enero. ${who(s, "personas")} explica que casi todo el personal de tienda gana cerca del mínimo y que la competencia ya anunció que pagará un poco más.`, "Hay que decidir si la cadena solo cumple, paga por encima del mercado o ajusta la plantilla."],
    data: (s) => [["Nómina de tienda", `${headcountOf(s)} personas`]],
    lesson: "Cuando sube el mínimo, el sueldo relativo contra la competencia decide quién se queda con la mejor gente. Recortar plantilla ahorra, pero la tienda lo resiente en venta.",
    requires: (s) => ([11, 12, 1].includes(calOf(s, s.day).month) ? ok : no("Se decide entre noviembre y enero.")),
    options: [
      { id: "arriba", stance: "equilibrada", label: "Pagar 2 % arriba del mercado", detail: () => "La nómina de tienda sube 2 % adicional; mejora el clima y baja la rotación.", commands: (s, k) => [{ type: "pay_premium", id: `${k}:p`, premium: s.index.payPremium + 0.02 }] },
      { id: "cumplir", stance: "prudente", label: "Cumplir con el mínimo", detail: () => "Sin costo extra. En febrero, parte del personal se va con la competencia.", commands: (_s, k) => [{ type: "later", id: `${k}:feb`, inDays: 45, cmd: { type: "relation", id: `${k}:feb:r`, key: "staff", delta: -0.05 } }] },
      { id: "plantilla", stance: "arriesgada", label: "Quitar una persona del turno de tarde en carretera", detail: (s) => `${openIn(s, "carretera")} tiendas de carretera con una persona menos: baja la nómina y la atención; la venta de esas tiendas cae 3 %.`, available: (s) => (group(s, "carretera") && group(s, "carretera")!.staff > 4 ? ok : no("Esas tiendas ya operan con plantilla mínima.")), commands: (_s, k) => [{ type: "group_staff", id: `${k}:g`, group: "carretera", staff: 4 }, { type: "modify", id: `${k}:d`, key: "demand", group: "carretera", mult: 0.97, days: FOREVER }, { type: "relation", id: `${k}:r`, key: "staff", delta: -0.02 }] },
    ],
  },
  {
    id: "pe_supervision", area: "personal", from: "supervisor", subject: "Cada supervisor cubre demasiadas tiendas", minDay: 70,
    body: (s) => [`${who(s, "supervisor")} visita cada tienda una vez cada dos semanas. En las tiendas con menos visitas, la merma y los faltantes son mayores.`, `Hay ${s.crews.supervision?.n ?? 0} supervisores para ${storesOpen(s)} tiendas.`],
    data: (s) => [["Tiendas por supervisor", `${Math.round(storesOpen(s) / Math.max(1, s.crews.supervision?.n ?? 1))}`]],
    lesson: "La supervisión de campo es lo que convierte el estándar en realidad: merma, limpieza y anaquel lleno dependen de que alguien vaya.",
    requires: () => ok,
    options: [
      { id: "contratar", stance: "equilibrada", label: "Contratar ocho supervisores", detail: () => "Más nómina de oficina; la merma baja 12 % en dos meses y mejora el surtido.", commands: (_s, k) => [{ type: "hire", id: `${k}:h`, crew: "supervision", n: 8 }, { type: "modify", id: `${k}:m`, key: "shrink", mult: 0.88, days: FOREVER, inDays: 60 }] },
      { id: "camaras", stance: "prudente", label: "Auditoría remota por cámaras", detail: (s) => `Servicio de ${mx(Math.round(storesOpen(s) * 900))} al mes; la merma baja 6 %.`, commands: (s, k) => [{ type: "add_fixed", id: `${k}:c`, label: "Auditoría remota de tiendas", amount: Math.round(storesOpen(s) * 900) }, { type: "modify", id: `${k}:m`, key: "shrink", mult: 0.94, days: FOREVER, inDays: 30 }] },
      { id: "nada", stance: "arriesgada", label: "Mantener la estructura", detail: () => "Sin costo adicional.", commands: () => [] },
    ],
  },

  // ── Seguridad (3)
  {
    id: "se_noche", area: "seguridad", from: "seguridad", subject: "Suben los asaltos nocturnos en Monterrey", minDay: 40, safety: true,
    body: (s) => [`${who(s, "seguridad")} reporta más asaltos entre la 1 y las 4 de la mañana, casi siempre en tiendas con mucho efectivo en caja.`, "Algunos encargados proponen dejar a una sola persona de noche para ahorrar. El personal pide lo contrario."],
    data: (s) => [["Asaltos el último mes", `${s.months.at(-1)?.robberies ?? 0}`], ["Tiendas en Monterrey", `${openIn(s, "mty")}`]],
    lesson: "La seguridad del personal es un límite, no una variable de ahorro. Lo que sí se decide es cómo bajar el riesgo: menos efectivo, más protección o menos horas expuestas.",
    requires: () => ok,
    options: [
      { id: "cajas", stance: "prudente", label: "Cajas fuertes con retardo y botón de pánico en todas las tiendas", detail: (s) => `${mx(storesOpen(s) * 28_000)} de inversión; los asaltos bajan 40 % y mejora la confianza del personal.`, available: (s) => affordable(s, storesOpen(s) * 28_000), commands: (s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Cajas fuertes y botones de pánico", amount: storesOpen(s) * 28_000, capex: true, payInDays: 30 }, { type: "modify", id: `${k}:r`, key: "robbery", mult: 0.6, days: FOREVER, inDays: 20 }, { type: "safety", id: `${k}:s`, delta: 0.06 }, { type: "relation", id: `${k}:st`, key: "staff", delta: 0.03 }] },
      { id: "cerrar", stance: "equilibrada", label: "Cerrar de noche las 40 tiendas más expuestas", detail: () => "40 tiendas de Monterrey cierran de medianoche a 6: pierden venta nocturna y ya no se exponen.", available: (s) => (openIn(s, "mty") >= 40 && group(s, "mty")!.nightShift ? ok : no("No hay 40 tiendas de Monterrey abiertas de noche.")), commands: (_s, k) => [{ type: "night_shift", id: `${k}:n`, group: "mty", on: false, stores: 40 }, { type: "safety", id: `${k}:s`, delta: 0.03 }] },
      { id: "solo", stance: "arriesgada", label: "Dejar a una sola persona de noche", blocked: "Una persona sola en una tienda abierta toda la noche queda expuesta a asaltos y agresiones sin que nadie pueda pedir ayuda. Es un riesgo grave para su integridad: no se puede tomar.", detail: () => "", commands: () => [] },
    ],
  },
  {
    id: "se_valores", area: "seguridad", from: "seguridad", subject: "El traslado de valores sube su tarifa", minDay: 100, safety: true,
    body: (s) => [`La empresa de traslado de valores sube 20 % su tarifa. ${who(s, "finanzas")} pregunta si hay alternativas.`, "Un encargado sugiere que cada tienda deposite el efectivo en el banco más cercano con su propio coche."],
    data: () => [["Gasto mensual actual de traslado", mx(1_750_000)]],
    lesson: "Mover efectivo es de las tareas más riesgosas del comercio. La forma de bajar su costo es tener menos efectivo, no exponer a la gente.",
    requires: () => ok,
    options: [
      { id: "pagar", stance: "prudente", label: "Aceptar la tarifa nueva", detail: () => `${mx(350_000)} más al mes.`, commands: (_s, k) => [{ type: "add_fixed", id: `${k}:t`, label: "Aumento del traslado de valores", amount: 350_000 }] },
      { id: "digital", stance: "equilibrada", label: "Negociar y empujar el pago digital", detail: () => `Se negocia un aumento de ${mx(150_000)} y una campaña de pago con tarjeta y celular (${mx(2_000_000)}): menos efectivo en tienda y menos asaltos.`, commands: (_s, k) => [{ type: "add_fixed", id: `${k}:t`, label: "Aumento negociado del traslado de valores", amount: 150_000 }, { type: "one_off", id: `${k}:c`, label: "Campaña de pago digital", amount: 2_000_000, payInDays: 30 }, { type: "modify", id: `${k}:r`, key: "robbery", mult: 0.85, days: FOREVER, inDays: 60 }] },
      { id: "coche", stance: "arriesgada", label: "Que los encargados depositen el efectivo en su coche", blocked: "Pedir a un empleado que transporte efectivo de la tienda en su propio vehículo lo convierte en blanco de asaltos, sin protección ni seguro. Es un riesgo grave para su vida: no se puede tomar.", detail: () => "", commands: () => [] },
    ],
  },
  {
    id: "se_agresion", area: "seguridad", from: "personas", subject: "Una cajera fue agredida en un asalto", minDay: 160, safety: true,
    body: (s) => [`${who(s, "personas")} informa que una cajera resultó herida en un asalto. Está estable. En la zona, el personal pide protocolos claros y apoyo.`, "Alguien sugiere no levantar denuncia para no afectar la imagen de la tienda."],
    lesson: "Cómo responde la empresa después de un incidente define si la gente confía en ella. Esconderlo no baja el riesgo: lo repite.",
    requires: (s) => (Number(s.flags.lesionados ?? 0) > 0 || s.day >= 300 ? ok : no("Solo llega si hubo un incidente o después del décimo mes.")),
    options: [
      { id: "protocolo", stance: "prudente", label: "Apoyo completo, denuncia y protocolo de seguridad para toda la red", detail: (s) => `Atención médica, apoyo a la familia y capacitación en todas las tiendas: ${mx(storesOpen(s) * 6_000)}.`, commands: (s, k) => [{ type: "one_off", id: `${k}:c`, label: "Apoyo a la colaboradora y protocolo de seguridad", amount: storesOpen(s) * 6_000, payInDays: 15 }, { type: "safety", id: `${k}:s`, delta: 0.08 }, { type: "relation", id: `${k}:r`, key: "staff", delta: 0.05 }, { type: "modify", id: `${k}:rob`, key: "robbery", mult: 0.9, days: FOREVER, inDays: 30 }] },
      { id: "apoyo", stance: "equilibrada", label: "Apoyo a la colaboradora y denuncia, sin programa general", detail: () => `${mx(450_000)} de apoyo y gastos legales.`, commands: (_s, k) => [{ type: "one_off", id: `${k}:c`, label: "Apoyo a la colaboradora", amount: 450_000, payInDays: 15 }, { type: "safety", id: `${k}:s`, delta: 0.02 }, { type: "relation", id: `${k}:r`, key: "staff", delta: 0.01 }] },
      { id: "callar", stance: "arriesgada", label: "No denunciar para cuidar la imagen", blocked: "No denunciar una agresión deja sin protección a la colaboradora y al resto del personal, y oculta información que la autoridad necesita. No es una opción aceptable.", detail: () => "", commands: () => [] },
    ],
  },

  // ── Comercial (4)
  {
    id: "co_comida", area: "comercial", from: "clientes", subject: "Crecer la comida preparada", minDay: 50,
    body: (s) => [`${who(s, "clientes")} muestra que la comida preparada (café, hot dogs, tortas y burritos) es la categoría de mayor margen y la que más trae clientes en la mañana.`, "Ampliarla requiere hornos, cafeteras y capacitación; la merma de comida es la más alta de la tienda."],
    data: () => [["Margen de comida", "50 %"], ["Equipo por tienda", mx(120_000)]],
    lesson: "La comida es el margen alto de la conveniencia, pero solo si la merma está controlada. Un piloto mide antes de invertir en toda la red.",
    requires: () => ok,
    options: [
      { id: "red", stance: "arriesgada", label: "Equipar 150 tiendas", detail: () => `${mx(150 * 120_000)} de inversión. La comida pasa de 12 % a cerca de 15 % de la venta y sube el ticket; la merma de comida sube.`, available: (s) => affordable(s, 150 * 120_000), commands: (_s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Equipo de comida preparada (150 tiendas)", amount: 150 * 120_000, capex: true, payInDays: 45 }, { type: "modify", id: `${k}:sh`, key: "share", cat: "comida", add: 0.03, days: FOREVER, inDays: 60 }, { type: "modify", id: `${k}:t`, key: "ticket", mult: 1.015, days: FOREVER, inDays: 60 }, { type: "modify", id: `${k}:m`, key: "shrink", cat: "comida", mult: 1.12, days: FOREVER, inDays: 60 }] },
      { id: "piloto", stance: "equilibrada", label: "Piloto en 30 tiendas", detail: () => `${mx(30 * 120_000)}; en tres meses se sabe si funciona.`, commands: (_s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Equipo de comida preparada (piloto)", amount: 30 * 120_000, capex: true, payInDays: 45 }, { type: "modify", id: `${k}:sh`, key: "share", cat: "comida", add: 0.006, days: FOREVER, inDays: 60 }] },
      { id: "no", stance: "prudente", label: "Mantener la oferta actual", detail: () => "Sin inversión.", commands: () => [] },
    ],
  },
  {
    id: "co_comida2", area: "comercial", from: "clientes", subject: "El piloto de comida preparada dio resultados", minDay: 140, after: { case: "co_comida", options: ["piloto"] },
    body: (s) => [`${who(s, "clientes")} trae los números del piloto: las tiendas con comida venden más en la mañana y su ticket sube. La merma fue mayor al principio y luego bajó.`, "Ahora se puede extender con lo aprendido."],
    lesson: "Un piloto bien medido reduce el riesgo de la inversión grande: se escala lo que funcionó y se corrige lo que no.",
    requires: () => ok,
    options: [
      { id: "extender", stance: "equilibrada", label: "Extender a 150 tiendas más", detail: () => `${mx(150 * 110_000)}; con lo aprendido, la merma de comida no sube.`, available: (s) => affordable(s, 150 * 110_000), commands: (_s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Equipo de comida preparada (extensión)", amount: 150 * 110_000, capex: true, payInDays: 45 }, { type: "modify", id: `${k}:sh`, key: "share", cat: "comida", add: 0.025, days: FOREVER, inDays: 60 }, { type: "modify", id: `${k}:t`, key: "ticket", mult: 1.012, days: FOREVER, inDays: 60 }] },
      { id: "quedarse", stance: "prudente", label: "Quedarse con el piloto", detail: () => "Sin más inversión.", commands: () => [] },
    ],
  },
  {
    id: "co_lealtad", area: "comercial", from: "clientes", subject: "Programa de lealtad", minDay: 80,
    body: (s) => [`${who(s, "clientes")} propone una aplicación de puntos: el cliente acumula en cada compra y canjea en bebidas y café.`, "Las cadenas nacionales ya tienen la suya. Un banco ofrece pagar parte a cambio de promover su tarjeta."],
    data: (s) => [["Costo mensual del programa", mx(Math.round(storesOpen(s) * 2_600))]],
    lesson: "Un programa de lealtad cuesta descuentos y operación todos los meses; se paga solo si cambia la frecuencia de visita.",
    requires: () => ok,
    options: [
      { id: "propio", stance: "arriesgada", label: "Lanzar programa propio", detail: (s) => `${mx(Math.round(storesOpen(s) * 2_600))} al mes y descuentos en bebidas; la frecuencia de visita sube 2.5 %.`, commands: (s, k) => [{ type: "add_fixed", id: `${k}:p`, label: "Programa de lealtad", amount: Math.round(storesOpen(s) * 2_600) }, { type: "modify", id: `${k}:d`, key: "demand", mult: 1.025, days: FOREVER, inDays: 60 }, { type: "modify", id: `${k}:m`, key: "margin", cat: "bebidas", add: -0.006, days: FOREVER, inDays: 60 }] },
      { id: "banco", stance: "equilibrada", label: "Alianza con el banco", detail: () => `El banco paga ${mx(3_000_000)} y la operación; la frecuencia sube 1 %.`, commands: (_s, k) => [{ type: "one_off", id: `${k}:pago`, label: "Pago del banco por la alianza de lealtad", amount: 3_000_000, payInDays: 30, account: "otros_ingresos" }, { type: "modify", id: `${k}:d`, key: "demand", mult: 1.01, days: FOREVER, inDays: 60 }] },
      { id: "no", stance: "prudente", label: "No lanzar programa", detail: () => "Sin costo.", commands: () => [] },
    ],
  },
  {
    id: "co_servicios", area: "comercial", from: "finanzas", subject: "Un banco quiere usar las tiendas como corresponsal", minDay: 60,
    body: (s) => [`Un banco ofrece comisión por cada depósito, retiro y pago de crédito en caja. ${who(s, "finanzas")} recuerda que los servicios traen tráfico, pero también más efectivo en tienda.`],
    data: () => [["Comisión por operación", "$9"]],
    lesson: "Los servicios financieros en tienda generan ingreso y visitas, pero aumentan el efectivo en caja: el riesgo de seguridad también es parte del precio.",
    requires: () => ok,
    options: [
      { id: "aceptar", stance: "arriesgada", label: "Aceptar depósitos y retiros", detail: () => "Las operaciones de servicios suben 35 % y el tráfico 1 %; más efectivo en tienda sube los asaltos 10 %.", commands: (_s, k) => [{ type: "modify", id: `${k}:sv`, key: "services", mult: 1.35, days: FOREVER, inDays: 45 }, { type: "modify", id: `${k}:d`, key: "demand", mult: 1.01, days: FOREVER, inDays: 45 }, { type: "modify", id: `${k}:r`, key: "robbery", mult: 1.1, days: FOREVER, inDays: 45 }] },
      { id: "pagos", stance: "equilibrada", label: "Solo pagos de crédito y servicios", detail: () => "Las operaciones suben 15 % sin aumentar el efectivo que sale de caja.", commands: (_s, k) => [{ type: "modify", id: `${k}:sv`, key: "services", mult: 1.15, days: FOREVER, inDays: 45 }] },
      { id: "no", stance: "prudente", label: "No", detail: () => "Sin cambios.", commands: () => [] },
    ],
  },

  // ── Expansión (3)
  {
    id: "ex_aperturas", area: "expansion", from: "expansion", subject: "Expansión tiene 25 ubicaciones en colonias nuevas de Monterrey", minDay: 35,
    body: (s) => [`${who(s, "expansion")} trae 25 locales en fraccionamientos nuevos de García, Escobedo y Juárez. Cada tienda cuesta ${mx(3_200_000)} y arranca vendiendo poco más de la mitad de una tienda madura; tarda cerca de año y medio en llegar.`, "Si no se toman, la competencia lo hará."],
    data: (s) => [["Inversión por tienda", mx(3_200_000)], ["Caja", mx(cash(s))], ["EBITDA mensual", mx(monthEbitda(s))]],
    lesson: "Una tienda nueva consume caja durante su maduración. Abrir más rápido gana ubicaciones, pero la red debe aguantar el periodo en que las tiendas todavía no se pagan.",
    requires: () => ok,
    options: [
      { id: "todas", stance: "arriesgada", label: "Abrir las 25", detail: () => `${mx(25 * 3_200_000)} de inversión; abren en cuatro meses.`, available: (s) => affordable(s, 25 * 3_200_000 * 0.4), commands: (_s, k) => [{ type: "open_stores", id: `${k}:o`, group: "mty", n: 25, capexPerStore: 3_200_000, leadDays: 120, rent: 30_000, ticketsMult: 0.97 }] },
      { id: "doce", stance: "equilibrada", label: "Abrir las 12 mejores", detail: () => `${mx(12 * 3_200_000)} de inversión en las ubicaciones con más tráfico.`, available: (s) => affordable(s, 12 * 3_200_000 * 0.4), commands: (_s, k) => [{ type: "open_stores", id: `${k}:o`, group: "mty", n: 12, capexPerStore: 3_200_000, leadDays: 120, rent: 30_000 }] },
      { id: "esperar", stance: "prudente", label: "Esperar", detail: () => "Sin inversión; las ubicaciones se pierden.", commands: () => [] },
    ],
  },
  {
    id: "ex_carretera", area: "expansion", from: "expansion", subject: "Una cadena de gasolineras ofrece 15 locales en carretera", minDay: 120,
    body: (s) => [`Una gasolinera regional ofrece 15 locales en la carretera a Laredo y a Reynosa. ${who(s, "expansion")} explica que el ticket en carretera es más alto, pero el tráfico depende del flujo de camiones.`, "El banco ofrece financiar la mitad."],
    data: () => [["Inversión por tienda", mx(3_800_000)], ["Ticket en carretera", "$82"]],
    lesson: "Financiar una expansión acelera el crecimiento pero compromete flujo futuro: el pago del crédito llega aunque las tiendas tarden en madurar.",
    requires: () => ok,
    options: [
      { id: "quince", stance: "arriesgada", label: "Tomar las 15 con crédito", detail: () => `${mx(15 * 3_800_000)} de inversión, la mitad financiada a 5 años.`, available: (s) => both(credit(s, 28_000_000), affordable(s, 15 * 3_800_000 * 0.2)), commands: (_s, k) => [{ type: "open_stores", id: `${k}:o`, group: "carretera", n: 15, capexPerStore: 3_800_000, leadDays: 150, financed: 28_000_000, months: 60, rent: 32_000 }] },
      { id: "seis", stance: "equilibrada", label: "Tomar 6 con caja propia", detail: () => `${mx(6 * 3_800_000)} en las de más tráfico.`, available: (s) => affordable(s, 6 * 3_800_000 * 0.4), commands: (_s, k) => [{ type: "open_stores", id: `${k}:o`, group: "carretera", n: 6, capexPerStore: 3_800_000, leadDays: 150, rent: 32_000 }] },
      { id: "no", stance: "prudente", label: "No entrar", detail: () => "Sin inversión.", commands: () => [] },
    ],
  },
  {
    id: "ex_rezagadas", area: "expansion", from: "finanzas", subject: "Las tiendas de bajo tráfico no se pagan", minDay: 75,
    body: (s) => [`${who(s, "finanzas")} muestra que las ${openIn(s, "rezagadas")} tiendas de bajo tráfico apenas cubren su nómina, renta y luz, y no aportan para el CEDIS ni el corporativo.`, "Cerrar tiene costo: liquidaciones, penalizaciones de renta y dar de baja la inversión. Remodelar puede rescatar algunas."],
    data: (s) => [["Tiendas", `${openIn(s, "rezagadas")}`], ["Tickets diarios por tienda", "≈ 215"]],
    lesson: "Cerrar una tienda que pierde no es fracasar: el costo de salida se paga una vez; la pérdida se paga cada mes. Lo que hay que comparar es el flujo futuro de cada camino.",
    requires: (s) => (openIn(s, "rezagadas") > 0 ? ok : no("Ya no hay tiendas de bajo tráfico.")),
    options: [
      { id: "cerrar", stance: "prudente", label: "Cerrar todas", detail: (s) => `Liquidaciones y cuatro meses de renta de penalización por ${openIn(s, "rezagadas")} tiendas.`, commands: (s, k) => [{ type: "close_stores", id: `${k}:c`, group: "rezagadas", n: openIn(s, "rezagadas"), leaseMonths: 4 }] },
      { id: "remodelar", stance: "arriesgada", label: "Remodelar y relanzar", detail: (s) => `${mx(openIn(s, "rezagadas") * 600_000)} de inversión; el tráfico de esas tiendas sube 22 % en tres meses.`, available: (s) => affordable(s, openIn(s, "rezagadas") * 600_000), commands: (s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Remodelación de tiendas de bajo tráfico", amount: openIn(s, "rezagadas") * 600_000, capex: true, payInDays: 45 }, { type: "modify", id: `${k}:d`, key: "demand", group: "rezagadas", mult: 1.22, days: FOREVER, inDays: 90 }] },
      { id: "ajustar", stance: "equilibrada", label: "Cerrar de noche y operar con plantilla reducida", detail: () => "Sin turno nocturno y con una persona menos de día: baja el costo y algo de venta.", commands: (_s, k) => [{ type: "night_shift", id: `${k}:n`, group: "rezagadas", on: false }, { type: "group_staff", id: `${k}:g`, group: "rezagadas", staff: 4 }] },
    ],
  },

  // ── Finanzas (3)
  {
    id: "fi_refinancia", area: "finanzas", from: "banco", subject: "El banco ofrece refinanciar el crédito", minDay: 90,
    body: (s) => [`${who(s, "banco")} ofrece bajar la tasa del crédito actual de 12.5 % a 11 % y alargar el plazo a cinco años, con una comisión.`, `${who(s, "finanzas")} pregunta si conviene más prepagar con la caja que se ha juntado.`],
    data: (s) => [["Caja", mx(cash(s))], ["Deuda", mx(s.loans.reduce((a, l) => a + l.balance, 0) / 100)]],
    lesson: "Refinanciar libera flujo mensual; prepagar baja el costo total. La caja que se usa para prepagar ya no está para crecer ni para una emergencia.",
    requires: (s) => (s.loans.some((l) => l.ref === "plantilla" && l.balance > 0) ? ok : no("No hay crédito original vigente.")),
    options: [
      { id: "refinanciar", stance: "equilibrada", label: "Refinanciar a 11 % y 60 meses", detail: () => `Comisión de ${mx(1_800_000)}; el pago mensual baja.`, available: (s) => (s.overdue.length ? no("Con atrasos el banco no refinancia.") : ok), commands: (_s, k) => [{ type: "refinance", id: `${k}:r`, rate: 0.11, months: 60, fee: 1_800_000 }] },
      { id: "prepagar", stance: "prudente", label: "Prepagar 60 millones", detail: () => "Baja la deuda y los intereses; la caja baja en la misma cantidad.", available: (s) => affordable(s, 60_000_000), commands: (_s, k) => [{ type: "prepay_debt", id: `${k}:p`, amount: 60_000_000 }] },
      { id: "igual", stance: "arriesgada", label: "Dejar el crédito como está", detail: () => "La caja queda disponible.", commands: () => [] },
    ],
  },
  {
    id: "fi_dividendo", area: "finanzas", from: "consejo", subject: "El consejo pregunta por dividendos", minDay: 180,
    body: (s) => [`${who(s, "consejo")} recuerda que el fondo de ${who(s, "fondo")} espera rendimiento. La caja ha crecido.`, "Repartir premia a los accionistas; retener deja caja para crecer o para un mal año."],
    data: (s) => [["Caja", mx(cash(s))], ["EBITDA mensual", mx(monthEbitda(s))]],
    lesson: "El dividendo es la prueba de que el negocio genera efectivo; repartir lo que se necesita para operar es la forma más rápida de una crisis de caja.",
    requires: (s) => (cash(s) > 180_000_000 ? ok : no("La caja todavía no lo permite.")),
    options: [
      { id: "grande", stance: "arriesgada", label: "Repartir 100 millones", detail: () => "Sube la confianza del consejo; la caja baja en la misma cantidad.", commands: (_s, k) => [{ type: "dividend", id: `${k}:d`, amount: 100_000_000 }] },
      { id: "medio", stance: "equilibrada", label: "Repartir 40 millones", detail: () => "Un dividendo moderado.", commands: (_s, k) => [{ type: "dividend", id: `${k}:d`, amount: 40_000_000 }] },
      { id: "retener", stance: "prudente", label: "Retener para crecer", detail: () => "El consejo acepta, con menos entusiasmo.", commands: (_s, k) => [{ type: "relation", id: `${k}:r`, key: "owner", delta: -0.04 }] },
    ],
  },
  {
    id: "fi_inventario", area: "finanzas", from: "finanzas", subject: "Bajar el inventario de abarrotes", minDay: 110,
    body: (s) => [`${who(s, "finanzas")} calcula que hay más de tres semanas de abarrotes entre tiendas y CEDIS. Bajarlo libera caja, pero aumenta el riesgo de faltantes.`],
    data: (s) => [["Inventario de abarrotes", mx(s.inv.abarrotes / 100)]],
    lesson: "El inventario es caja detenida. Bajarlo libera efectivo una vez, pero si el anaquel se vacía se pierde venta todos los días.",
    requires: () => ok,
    options: [
      { id: "veinte", stance: "arriesgada", label: "Bajar 25 %", detail: (s) => `Libera cerca de ${mx(s.inv.abarrotes * 0.25 / 100)}; los faltantes suben y la venta baja 1 %.`, commands: (_s, k) => [{ type: "modify", id: `${k}:i`, key: "invDays", cat: "abarrotes", mult: 0.75, days: FOREVER }, { type: "modify", id: `${k}:d`, key: "demand", mult: 0.99, days: FOREVER }] },
      { id: "diez", stance: "equilibrada", label: "Bajar 10 % con mejor pronóstico", detail: (s) => `Libera cerca de ${mx(s.inv.abarrotes * 0.1 / 100)} sin afectar la venta; el sistema de pronóstico cuesta ${mx(180_000)} al mes.`, commands: (_s, k) => [{ type: "modify", id: `${k}:i`, key: "invDays", cat: "abarrotes", mult: 0.9, days: FOREVER }, { type: "add_fixed", id: `${k}:f`, label: "Sistema de pronóstico de demanda", amount: 180_000 }] },
      { id: "igual", stance: "prudente", label: "Mantener", detail: () => "Sin cambios.", commands: () => [] },
    ],
  },

  // ── Estrategia (3)
  {
    id: "es_competidor", area: "estrategia", from: "clientes", subject: "Una cadena nacional abrirá 30 tiendas frente a las tuyas", minDay: 150,
    body: (s) => [`${who(s, "clientes")} confirma que una cadena nacional abrirá 30 tiendas en Monterrey en los próximos dos meses, varias a una cuadra de las tuyas.`, "La venta de esas zonas va a bajar. Lo que se decide es cómo responder."],
    data: (s) => [["Tiendas en Monterrey", `${openIn(s, "mty")}`]],
    lesson: "Frente a un competidor más grande, la guerra de precios suele perderla el que tiene menos escala. Diferenciarse cuesta, pero defiende el margen.",
    requires: () => ok,
    options: [
      { id: "remodelar", stance: "equilibrada", label: "Remodelar las 60 tiendas más expuestas", detail: () => `${mx(60 * 450_000)} de inversión; recupera más de la mitad de la venta que se perdería.`, available: (s) => affordable(s, 60 * 450_000), commands: (_s, k) => [{ type: "modify", id: `${k}:hit`, key: "demand", group: "mty", mult: 0.93, days: FOREVER, inDays: 60 }, { type: "one_off", id: `${k}:capex`, label: "Remodelación de tiendas expuestas a la competencia", amount: 60 * 450_000, capex: true, payInDays: 45 }, { type: "modify", id: `${k}:d`, key: "demand", group: "mty", mult: 1.04, days: FOREVER, inDays: 75 }] },
      { id: "precios", stance: "arriesgada", label: "Bajar precios de bebidas seis meses", detail: () => "3 puntos menos de margen en bebidas; la venta se defiende mientras dura.", commands: (_s, k) => [{ type: "modify", id: `${k}:hit`, key: "demand", group: "mty", mult: 0.93, days: FOREVER, inDays: 60 }, { type: "modify", id: `${k}:m`, key: "margin", cat: "bebidas", add: -0.03, days: 180, inDays: 50 }, { type: "modify", id: `${k}:d`, key: "demand", group: "mty", mult: 1.06, days: 180, inDays: 50 }] },
      { id: "aguantar", stance: "prudente", label: "No responder y cuidar el margen", detail: () => "Se acepta la pérdida de venta en esas zonas.", commands: (_s, k) => [{ type: "modify", id: `${k}:hit`, key: "demand", group: "mty", mult: 0.93, days: FOREVER, inDays: 60 }] },
    ],
  },
  {
    id: "es_tabaco", area: "estrategia", from: "compras", subject: "Sube el impuesto a los cigarros", minDay: 200,
    body: (s) => [`El impuesto especial a los cigarros sube en enero. ${who(s, "compras")} explica que el cigarro deja poco margen, pero trae visitas diarias que compran otras cosas.`],
    data: () => [["Tabaco en la venta", "10 %"], ["Margen del tabaco", "9 %"]],
    lesson: "Un producto de margen bajo puede ser valioso por el tráfico que trae. Antes de sacrificarlo, mide lo que compra el cliente además.",
    requires: (s) => ([11, 12, 1].includes(calOf(s, s.day).month) ? ok : no("Se decide alrededor de enero.")),
    options: [
      { id: "trasladar", stance: "prudente", label: "Trasladar todo el aumento al precio", detail: () => "Se conserva el margen; la venta de cigarros baja 10 % y el tráfico un poco.", commands: (_s, k) => [{ type: "modify", id: `${k}:sh`, key: "share", cat: "tabaco", mult: 0.9, days: FOREVER }, { type: "modify", id: `${k}:d`, key: "demand", mult: 0.997, days: FOREVER }] },
      { id: "absorber", stance: "arriesgada", label: "Absorber la mitad", detail: () => "El margen del tabaco baja 2 puntos; se conserva el tráfico.", commands: (_s, k) => [{ type: "modify", id: `${k}:m`, key: "margin", cat: "tabaco", add: -0.02, days: FOREVER }] },
      { id: "espacio", stance: "equilibrada", label: "Trasladar y usar el espacio para comida y café", detail: () => `${mx(1_500_000)} en mobiliario; menos cigarros y un poco más de comida.`, commands: (_s, k) => [{ type: "modify", id: `${k}:sh`, key: "share", cat: "tabaco", mult: 0.88, days: FOREVER }, { type: "modify", id: `${k}:c`, key: "share", cat: "comida", add: 0.008, days: FOREVER, inDays: 30 }, { type: "one_off", id: `${k}:mob`, label: "Mobiliario para comida y café", amount: 1_500_000, capex: true, payInDays: 30 }] },
    ],
  },
  {
    id: "es_cedis2", area: "estrategia", from: "cedis", subject: "¿Ampliar el CEDIS para la siguiente etapa?", minDay: 240,
    body: (s) => [`${who(s, "cedis")} propone ampliar el CEDIS de Apodaca: racks, andenes y una cámara de refrigeración. Con eso se podrían surtir 520 tiendas.`, `Hoy hay ${storesOpen(s)} tiendas. Ampliar antes de crecer es gastar sin uso; ampliar tarde es operar saturado.`],
    data: (s) => [["Tiendas", `${storesOpen(s)}`], ["Capacidad", `${s.cedis.capacityStores}`]],
    lesson: "La capacidad se compra por escalones: el momento correcto depende del plan de aperturas, no solo de las tiendas de hoy.",
    requires: (s) => (storesOpen(s) >= 345 ? ok : no("La red todavía no necesita más capacidad.")),
    options: [
      { id: "ampliar", stance: "arriesgada", label: "Ampliar el CEDIS", detail: () => `${mx(45_000_000)}; la capacidad llega en cinco meses.`, available: (s) => affordable(s, 45_000_000), commands: (_s, k) => [{ type: "one_off", id: `${k}:capex`, label: "Ampliación del CEDIS", amount: 45_000_000, capex: true, payInDays: 60 }, { type: "later", id: `${k}:on`, inDays: 150, cmd: { type: "cedis_capacity", id: `${k}:cap`, stores: 520, rent: 250_000, energy: 150_000 } }] },
      { id: "satelite", stance: "equilibrada", label: "Rentar bodega satélite temporal", detail: () => `Renta de ${mx(400_000)} al mes; capacidad para 60 tiendas más, con fletes un poco más caros.`, commands: (s, k) => [{ type: "cedis_capacity", id: `${k}:cap`, stores: s.cedis.capacityStores + 60, rent: 400_000, energy: 80_000 }, { type: "modify", id: `${k}:fl`, key: "logistics", mult: 1.03, days: FOREVER }] },
      { id: "esperar", stance: "prudente", label: "Esperar", detail: () => "Sin inversión.", commands: () => [] },
    ],
  },
];

// ───────────────────────────────────────────────────────── caso de liquidez (estructural, repetible)
export function liquidityCase(s: RetailState): RCase | null {
  if (s.liquidity === "sana") return null;
  const opts = liquidityOptions(s, "caso");
  return {
    id: `liq@${s.day}`, area: "finanzas", from: "finanzas", minDay: 0,
    subject: s.liquidity === "crisis" ? "Hay pagos vencidos" : "La caja no alcanza para los próximos 30 días",
    body: () => [s.liquidity === "crisis" ? `Hay ${mx(overdueTotal(s) / 100)} vencidos. Cada acreedor reacciona distinto: proveedores de mercancía, CFE, IMSS y SAT, banco, rentas y personal.` : "Lo que vence en 30 días no cabe en la caja más lo que se espera vender en ese plazo. Hay tiempo para actuar."],
    lesson: "En una crisis de caja, primero lo que vacía los anaqueles o apaga las tiendas (proveedores, CFE, nómina) y lo que genera recargos; después lo que solo cuesta intereses.",
    requires: () => ok,
    options: opts.map((o) => ({ id: o.id, label: o.label, stance: "equilibrada" as const, detail: () => `Libera ${mx(o.cash / 100)} en ${o.inDays} días. Costo: ${o.cost}.`, available: () => (o.available ? ok : no(o.reason ?? "No disponible.")), commands: () => [o.cmd] })),
  };
}

// ───────────────────────────────────────────────────────── selección adaptable y decisión
export const caseById = (id: string) => RETAIL_CASES.find((c) => c.id === id);

export function eligible(s: RetailState, log: readonly LogEntry[]): RCase[] {
  return RETAIL_CASES.filter((c) => s.day >= c.minDay && !decided(log, c.id) && (!c.after || decided(log, c.after.case, c.after.options)) && c.requires(s, log).ok);
}

/**
 * Selector determinista y adaptable: prioriza lo que el estado pide (seguridad baja → seguridad; rotación → personal;
 * anaqueles incompletos → abasto; caja holgada → expansión) y pone a prueba la postura habitual del jugador.
 */
export function rank(s: RetailState, log: readonly LogEntry[]): { c: RCase; score: number; why: string }[] {
  const stances = log.filter((e) => e.ok).map((e) => caseById(e.caseId)?.options.find((o) => o.id === e.optionId)?.stance).filter(Boolean);
  const risky = stances.filter((x) => x === "arriesgada").length, careful = stances.filter((x) => x === "prudente").length;
  const robberies = s.months.at(-1)?.robberies ?? 0;
  return eligible(s, log).map((c) => {
    let score = 1, why = "semana normal";
    if (c.safety && (s.safety < 0.75 || robberies > storesOpen(s) * 0.02)) { score += 2; why = "la seguridad en tiendas viene empeorando"; }
    if (c.area === "personal" && s.staffing < 0.93) { score += 1.5; why = "hay muchos puestos vacantes en tiendas"; }
    if (c.area === "abasto" && lastFill(s) < 0.97) { score += 1.5; why = "faltó mercancía en anaquel"; }
    if (c.id === "ab_cedis" && storesOpen(s) > s.cedis.capacityStores) { score += 2; why = "el CEDIS ya opera arriba de su capacidad"; }
    if ((c.area === "expansion" || c.area === "estrategia") && s.liquidity === "sana" && cash(s) > 150_000_000) { score += 1; why = "la caja está holgada"; }
    if (risky > careful + 1 && ["es_competidor", "fi_inventario", "se_valores", "ex_rezagadas"].includes(c.id)) { score += 1.2; why = "tus decisiones recientes tomaron riesgo: este caso lo pone a prueba"; }
    if (careful > risky + 1 && ["ex_aperturas", "ex_carretera", "co_comida", "ab_marca_propia"].includes(c.id)) { score += 1.2; why = "tus decisiones recientes fueron prudentes: este caso ofrece crecer"; }
    if (c.area === "comercial" && s.relations.clients < 0.7) { score += 0.8; why = "la relación con los clientes está tensa"; }
    if (c.after) { score += 0.6; why = "continúa una decisión anterior"; }
    score += hash(`${s.seed}|${c.id}|${Math.floor(s.day / 30)}`) * 0.5;
    return { c, score, why };
  }).sort((a, b) => b.score - a.score);
}
function hash(k: string) { let h = 0x811c9dc5; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h / 0x100000000; }

/** El motor propone el caso; la IA puede sugerir otro de la lista de elegibles. Si no es elegible, se ignora. */
export function nextCase(s: RetailState, log: readonly LogEntry[], aiPick?: string): { c: RCase; source: "motor" | "ia"; why: string } | null {
  const liq = liquidityCase(s);
  if (liq && s.liquidity === "crisis") return { c: liq, source: "motor", why: "hay pagos vencidos" };
  const r = rank(s, log);
  if (aiPick) { const hit = r.find((x) => x.c.id === aiPick); if (hit) return { c: hit.c, source: "ia", why: "elegido por la IA entre los casos elegibles" }; }
  if (liq) return { c: liq, source: "motor", why: "la liquidez está en alerta" };
  return r.length ? { c: r[0].c, source: "motor", why: r[0].why } : null;
}

export function optionCheck(s: RetailState, o: ROption): Check {
  if (o.blocked) return no(o.blocked);
  return o.available ? o.available(s) : ok;
}

/** Aplica una opción: solo comandos del motor. Registra en la bitácora lo aplicado (o por qué no). */
export function decideRetail(s: RetailState, c: RCase, optionId: string, log: LogEntry[], source: "motor" | "ia" = "motor"): { ok: boolean; reason?: string } {
  const o = c.options.find((x) => x.id === optionId);
  if (!o) return { ok: false, reason: "Opción desconocida." };
  const chk = optionCheck(s, o);
  if (!chk.ok) { log.push({ day: s.day, caseId: c.id, optionId, commands: [], source, ok: false, reason: chk.reason }); return chk; }
  const key = `${c.id}@${s.day}`;
  const done: string[] = [];
  for (const cmd of o.commands(s, key)) {
    const r = applyRetail(s, cmd);
    if (!r.ok) { log.push({ day: s.day, caseId: c.id, optionId, commands: done, source, ok: false, reason: r.reason }); return { ok: false, reason: r.reason }; }
    done.push(`${cmd.type}:${cmd.id}`);
  }
  log.push({ day: s.day, caseId: c.id, optionId, commands: done, source, ok: true });
  return { ok: true };
}

/** Vista previa calculada por el motor: diferencia a N días contra no hacer nada (EBITDA, utilidad y caja). */
export function previewOption(s: RetailState, c: RCase, optionId: string, days = 120): { ebitda: number; net: number; cash: number; text: string } | null {
  const o = c.options.find((x) => x.id === optionId);
  if (!o || !optionCheck(s, o).ok) return null;
  const base = advanceRetail(s, days);
  const t = advanceRetail(s, 0);
  for (const cmd of o.commands(t, `prev:${c.id}`)) if (!applyRetail(t, cmd).ok) return null;
  const after = advanceRetail(t, days);
  const sum = (x: RetailState, k: "ebitda" | "net") => x.months.slice(s.months.length).reduce((a, m) => a + m[k], 0);
  const r = { ebitda: sum(after, "ebitda") - sum(base, "ebitda"), net: sum(after, "net") - sum(base, "net"), cash: cashOf(after) - cashOf(base) };
  const sign = (x: number) => `${x >= 0 ? "+" : "−"}$${fmt(Math.abs(x))}`;
  return { ...r, text: `En ${Math.round(days / 30)} meses, contra no hacer nada: EBITDA ${sign(r.ebitda)}, utilidad ${sign(r.net)}, caja ${sign(r.cash)}.` };
}
