/**
 * mêtis CEO · Growth Engine · parámetros por familia y empresas emergentes de arranque (v1).
 * Montos en pesos (se convierten a centavos al instanciar). Todos los nombres son ficticios.
 * Las cifras de operación son supuestos de simulación calibrados para que la empresa de llegada sea viable y
 * tenga un cuello de botella visible; no son datos de mercado.
 */
import type { FamilyParams, FixedLine } from "./types";

export const FAMILIES: Readonly<Record<string, FamilyParams>> = Object.freeze({
  restaurante: {
    family: "restaurante",
    resources: ["cocina", "servicio", "loza", "mesas"],
    unit: { one: "pedido", many: "pedidos" },
    // Ticket promedio por pedido con IVA (menú publicado). La venta neta es 260 / 1.16 ≈ $224.
    price: 260,
    vatInPrice: 0.16,
    // Insumos de cocina sobre la venta neta (food cost típico de parrilla casual 30–34 %).
    cogsPct: 0.32,
    variableLines: [
      { id: "merma", label: "Merma y producto descartado", pctOfSales: 0.015, basis: "Supuesto: 1.5 % de la venta (porciones fuera de estándar, caducidad)." },
      { id: "terminal", label: "Comisión de terminal bancaria", pctOfSales: 0.0158, basis: "Supuesto: 70 % de la venta con tarjeta × 2.25 % de comisión con IVA." },
      { id: "reparto", label: "Comisión de plataformas de reparto", pctOfSales: 0.0264, basis: "Supuesto: 12 % de los pedidos por plataforma × 22 % de comisión." },
      { id: "gas", label: "Gas LP de cocina", perUnit: 7.5, basis: "Supuesto: $7.50 por pedido (parrilla y freidoras)." },
      { id: "desechables", label: "Empaques y desechables", perUnit: 3, basis: "Supuesto: $3 por pedido promedio (empaque de reparto y servilletas)." },
      { id: "limpieza", label: "Limpieza y reposición menor", pctOfSales: 0.008, basis: "Supuesto: 0.8 % de la venta (químicos, utensilios, loza rota)." },
    ],
    // Se abre 7 días y cada persona operativa descansa uno (1/6 de su jornada pagada) más vacaciones (~4 %):
    // esas jornadas se cubren con eventuales o tiempo extra.
    restCoverage: 0.2,
    dso: 0,
    supplierDays: 15,
    leadRole: "gerente_sucursal",
    baseSpan: 10,
    backlogDays: 0,
  },
  manufactura: {
    family: "manufactura",
    resources: ["prensa", "operacion"],
    unit: { one: "pieza", many: "piezas" },
    price: 10,
    materialPerUnit: 4.2,
    variableLines: [
      { id: "energia", label: "Energía de prensas", perUnit: 0.22, basis: "Supuesto: $0.22 por pieza buena (tarifa industrial GDMTH promedio)." },
      { id: "herramental", label: "Afilado y consumibles de troquel", perUnit: 0.12, basis: "Supuesto: $0.12 por pieza." },
      { id: "fletes", label: "Fletes a clientes", pctOfSales: 0.015, basis: "Supuesto: 1.5 % de la venta (entregas locales en el área metropolitana)." },
    ],
    // Se trabaja de lunes a sábado: solo se cubren vacaciones e incapacidades.
    restCoverage: 0.03,
    dso: 45,
    supplierDays: 30,
    scrap: 0.03,
    leadRole: "supervisor_produccion",
    shiftRole: "supervisor_produccion",
    baseSpan: 10,
    perShift: { prensa: 1800 },
    backlogDays: 5,
  },
  /**
   * Acería de hornos de inducción (metálica básica): funde chatarra y vende palanquilla y varilla por tonelada.
   * Supuestos de simulación (no son datos de mercado): precio neto de $15,800 por tonelada; chatarra y aleaciones
   * por $9,700 por tonelada colada (rendimiento metálico incluido); 4 % de pérdida metálica y fuera de norma.
   */
  aceria: {
    family: "manufactura",
    resources: ["horno", "operacion"],
    unit: { one: "tonelada", many: "toneladas" },
    price: 15800,
    materialPerUnit: 9700,
    variableLines: [
      { id: "energia", label: "Energía eléctrica de hornos", perUnit: 1850, basis: "Supuesto: unos 650 kWh por tonelada a tarifa industrial en media tensión." },
      { id: "refractarios", label: "Refractarios, oxígeno y consumibles", perUnit: 450, basis: "Supuesto: $450 por tonelada buena." },
      { id: "fletes", label: "Fletes a clientes", pctOfSales: 0.02, basis: "Supuesto: 2 % de la venta (entregas en el área metropolitana y Saltillo)." },
    ],
    restCoverage: 0.03,
    dso: 45,
    // La chatarra se paga casi de contado: los centros de acopio dan poco crédito.
    supplierDays: 15,
    scrap: 0.04,
    leadRole: "supervisor_produccion",
    shiftRole: "supervisor_produccion",
    baseSpan: 10,
    perShift: { horno: 14 },
    backlogDays: 3,
  },
});

/** Rotaciones de mesa por día (comida y cena). */
export const TABLE_TURNS = 8;
/** Demanda por día de la semana (lunes…domingo); promedio 1. */
export const WEEKDAY: readonly number[] = [0.8, 0.85, 0.9, 1.0, 1.15, 1.3, 1.0];
/** Manufactura trabaja de lunes a sábado. */
export const WORKDAY: readonly boolean[] = [true, true, true, true, true, true, false];

/**
 * Gastos fijos explícitos de cada empresa (pesos al mes). Reemplazan al antiguo «companyFixed» de una sola cifra:
 * el margen sale de sumar líneas defendibles, no de ajustar un porcentaje final.
 * La dirección general es tu sueldo como director designado (bruto + carga); el dueño no cobra sueldo en operación.
 */
const BRASA_FIXED: FixedLine[] = [
  { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 42000, basis: "Supuesto: $32,000 brutos + 30 % de carga; empresa de una sucursal." },
  { id: "contador", label: "Contador externo y nómina", amount: 7500, basis: "Supuesto: despacho local, contabilidad electrónica y timbrado de nómina." },
  { id: "sistemas", label: "Punto de venta, inventarios y software", amount: 3200, basis: "Supuesto: licencias mensuales." },
  { id: "seguros", label: "Seguro del local y responsabilidad civil", amount: 2800, basis: "Supuesto: prima anual prorrateada." },
  { id: "mantenimiento", label: "Mantenimiento preventivo de cocina", amount: 6500, basis: "Supuesto: campanas, refrigeración, fumigación." },
  { id: "marketing", label: "Publicidad local y redes", amount: 9000, basis: "Supuesto: pauta digital y material del local." },
  { id: "permisos", label: "Licencias, protección civil y derechos", amount: 1800, basis: "Supuesto: prorrateo anual." },
];
const FORJA_FIXED: FixedLine[] = [
  { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 58000, basis: "Supuesto: $45,000 brutos + 30 % de carga; taller de 16 personas." },
  { id: "contador", label: "Contador externo y auditoría fiscal", amount: 9000, basis: "Supuesto: despacho local." },
  { id: "sistemas", label: "ERP, CAD y comunicaciones", amount: 6000, basis: "Supuesto: licencias mensuales." },
  { id: "seguros", label: "Seguro de planta, equipo y mercancía", amount: 9500, basis: "Supuesto: prima anual prorrateada." },
  { id: "mantenimiento", label: "Refacciones y mantenimiento mayor de prensas", amount: 18000, basis: "Supuesto: programa anual prorrateado." },
  { id: "seguridad", label: "Vigilancia, EPP y seguridad industrial", amount: 8500, basis: "Supuesto: guardia nocturna y equipo de protección." },
];

const HUASTECA_FIXED: FixedLine[] = [
  { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 75000, basis: "Supuesto: $58,000 brutos + 30 % de carga; acería de dos hornos y dieciséis personas." },
  { id: "contador", label: "Contador externo y auditoría fiscal", amount: 12000, basis: "Supuesto: despacho local." },
  { id: "sistemas", label: "ERP, básculas y comunicaciones", amount: 8000, basis: "Supuesto: licencias mensuales." },
  { id: "seguros", label: "Seguro de planta, hornos y mercancía", amount: 25000, basis: "Supuesto: prima anual prorrateada." },
  { id: "mantenimiento", label: "Bobinas, revestimiento de hornos y mantenimiento mayor", amount: 45000, basis: "Supuesto: programa anual prorrateado." },
  { id: "seguridad", label: "Seguridad industrial, EPP y cumplimiento ambiental", amount: 30000, basis: "Supuesto: equipo aluminizado, monitoreo de emisiones y guardia." },
];
const HUASTECA_GRUPO_FIXED: FixedLine[] = [
  { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 150000, basis: "Supuesto: $115,000 brutos + 30 % de carga; dos plantas y más de cincuenta personas." },
  { id: "contador", label: "Auditoría externa y asesoría fiscal", amount: 22000, basis: "Supuesto: despacho regional." },
  { id: "sistemas", label: "ERP, básculas y comunicaciones de dos plantas", amount: 18000, basis: "Supuesto: licencias mensuales." },
  { id: "seguros", label: "Seguros de plantas, hornos y mercancía", amount: 60000, basis: "Supuesto: prima anual prorrateada." },
  { id: "mantenimiento", label: "Bobinas, revestimiento de hornos y mantenimiento mayor", amount: 120000, basis: "Supuesto: programa anual prorrateado de cinco hornos." },
  { id: "seguridad", label: "Seguridad industrial, EPP y cumplimiento ambiental", amount: 75000, basis: "Supuesto: dos plantas, monitoreo de emisiones y guardias." },
];

const PARRILLA_FIXED: FixedLine[] = [
  { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 95000, basis: "Supuesto: $73,000 brutos + 30 % de carga; grupo de cinco sucursales." },
  { id: "contador", label: "Auditoría externa y timbrado de nómina", amount: 9000, basis: "Supuesto: la contabilidad la lleva el contador interno; el despacho audita y timbra." },
  { id: "sistemas", label: "Punto de venta, inventarios y software de las sucursales", amount: 12000, basis: "Supuesto: licencias mensuales por sucursal." },
  { id: "seguros", label: "Seguros de los locales y responsabilidad civil", amount: 11000, basis: "Supuesto: prima anual prorrateada." },
  { id: "mantenimiento", label: "Mantenimiento preventivo de cocinas", amount: 28000, basis: "Supuesto: campanas, refrigeración y fumigación de cinco cocinas." },
  { id: "marketing", label: "Publicidad de la marca y redes", amount: 38000, basis: "Supuesto: pauta digital, material y promociones del grupo." },
  { id: "permisos", label: "Licencias, protección civil y derechos", amount: 7000, basis: "Supuesto: prorrateo anual de cinco locales." },
];
const FORJA_GRUPO_FIXED: FixedLine[] = [
  { id: "direccion", label: "Dirección general (tu sueldo con carga social)", amount: 130000, basis: "Supuesto: $100,000 brutos + 30 % de carga; dos plantas y más de cuarenta personas." },
  { id: "contador", label: "Auditoría externa y asesoría fiscal", amount: 18000, basis: "Supuesto: despacho regional." },
  { id: "sistemas", label: "ERP, CAD y comunicaciones de dos plantas", amount: 16000, basis: "Supuesto: licencias mensuales." },
  { id: "seguros", label: "Seguros de plantas, equipo y mercancía", amount: 24000, basis: "Supuesto: prima anual prorrateada." },
  { id: "mantenimiento", label: "Refacciones y mantenimiento mayor de prensas", amount: 42000, basis: "Supuesto: programa anual prorrateado de ocho prensas." },
  { id: "seguridad", label: "Vigilancia, EPP y seguridad industrial", amount: 26000, basis: "Supuesto: guardias en dos plantas y equipo de protección." },
];

export interface StaffSeed { roleId: string; name: string; siteId: string | null; salary?: number; yearsBefore?: number }
export interface Template {
  id: string;
  family: "restaurante" | "manufactura";
  /** Línea de negocio dentro de la familia (models.ts). Sin dato: la de siempre (restaurante o estampado). */
  line?: import("./models").LineId;
  name: string;
  /** Región de `REGIONS` (labor.ts). Los salarios del catálogo se ajustan con su índice. */
  region: string;
  /** Mes calendario del día 0 (1–12): define cuándo se paga el aguinaldo. */
  startMonth: number;
  cash: number;
  fixedLines: FixedLine[];
  /**
   * Cuánto podría aportar el dueño en una emergencia (pesos), si la relación lo permite. Supuesto de la historia:
   * no es un cheque en blanco; aportar tiene condiciones y deja huella en la relación con el consejo.
   */
  ownerCapacity: number;
  /** Tasa anual de un crédito PyME para esta empresa (supuesto referencial, con comisión de apertura). */
  bankRate: number;
  /**
   * Crédito de arranque que el banco preaprueba al llegar (pesos): el tope de la oferta más grande. Supuesto de
   * simulación: con aval del dueño y garantía de la operación, sin pedir meses de historia bajo tu gestión.
   */
  startCredit: number;
  /** Tamaño de la empresa: «startup» (pequeña, para crecerla) o «consolidada» (estructura formal y varias sedes). */
  size: "startup" | "consolidada";
  sites: { id: string; name: string; zone: string; rent: number; utilities: number; assets: Record<string, number>; shifts: number; demandBase: number }[];
  staff: StaffSeed[];
  contracts?: { id: string; client: string; unitsPerDay: number; price: number; siteId?: string }[];
  summary: string;
}

/** Equipo de una sucursal: gerente, cocina, servicio y loza (los nombres son ficticios). `senior` = años del gerente. */
function branch(siteId: string, names: string[], senior: number): StaffSeed[] {
  const roles = ["gerente_sucursal", "cocinero", "cocinero", "cocinero", "ayudante_cocina", "mesero", "mesero", "mesero", "lavaloza", "cocinero"];
  return names.map((name, i) => ({ roleId: roles[i], name, siteId, ...(i === 0 ? { yearsBefore: senior } : i < 3 ? { yearsBefore: 1 } : {}) }));
}

/** Nombres ficticios para plantillas grandes (deterministas: siempre la misma lista). */
const FIRST = ["Juan", "Rocío", "Luis", "Marisol", "Pedro", "Ana", "Hugo", "Lety", "Chuy", "Karina", "Polo", "Vero", "Neto", "Liz", "Moy", "Sandra", "Beto", "Cris", "Efrén", "Mayra", "Ciro", "Yesenia", "Gil", "Tere", "Lupe", "Ramiro", "Nora", "Iván", "Diana", "Toño"];
const LAST = ["Garza", "Treviño", "Cantú", "Salinas", "Elizondo", "Cavazos", "Villarreal", "Leal", "Rangel", "Tamez", "Zúñiga", "Ibarra", "Sáenz", "Ochoa", "Lozano", "Mata", "Rivas", "Ayala"];
const crew = (roleId: string, siteId: string, n: number, from: number): StaffSeed[] =>
  Array.from({ length: n }, (_, i) => ({ roleId, siteId, name: `${FIRST[(from + i) % FIRST.length]} ${LAST[(from * 7 + i * 5) % LAST.length]}` }));

export const TEMPLATES: Readonly<Record<string, Template>> = Object.freeze({
  restaurante_emergente: {
    id: "restaurante_emergente",
    family: "restaurante",
    name: "Grupo Brasa",
    region: "MTY",
    startMonth: 3,
    cash: 420000,
    fixedLines: BRASA_FIXED,
    ownerCapacity: 500000,
    bankRate: 0.24,
    startCredit: 600000,
    size: "startup",
    // Servicios del local: luz (incluye refrigeración y campanas), agua y drenaje, internet y teléfono. El gas va por pedido.
    sites: [{ id: "centro", name: "Sucursal Centro", zone: "centro", rent: 45000, utilities: 24000, assets: { mesas: 14 }, shifts: 1, demandBase: 100 }],
    staff: [
      { roleId: "gerente_sucursal", name: "Mariana Treviño", siteId: "centro", yearsBefore: 3 },
      { roleId: "cocinero", name: "Raúl Garza", siteId: "centro", yearsBefore: 2 },
      { roleId: "cocinero", name: "Lupita Ochoa", siteId: "centro", yearsBefore: 1 },
      { roleId: "cocinero", name: "Iván Salinas", siteId: "centro" },
      { roleId: "ayudante_cocina", name: "Diego Cantú", siteId: "centro" },
      { roleId: "mesero", name: "Paola Rdz.", siteId: "centro", yearsBefore: 1 },
      { roleId: "mesero", name: "Kevin Leal", siteId: "centro" },
      { roleId: "mesero", name: "Sofía Montes", siteId: "centro" },
      { roleId: "lavaloza", name: "Don Chuy Villarreal", siteId: "centro", yearsBefore: 4 },
    ],
    summary: "Un restaurante con una sucursal, nueve personas y unos 85 pedidos al día. La demanda en horas pico ya supera lo que la cocina puede sacar.",
  },
  manufactura_emergente: {
    id: "manufactura_emergente",
    family: "manufactura",
    name: "Troqueles Forja",
    region: "MTY",
    startMonth: 3,
    cash: 1300000,
    fixedLines: FORJA_FIXED,
    ownerCapacity: 1500000,
    bankRate: 0.2,
    startCredit: 2000000,
    size: "startup",
    sites: [{ id: "planta", name: "Planta Apodaca", zone: "apodaca", rent: 60000, utilities: 90000, assets: { prensa: 3 }, shifts: 1, demandBase: 0 }],
    staff: [
      { roleId: "supervisor_produccion", name: "Arturo Elizondo", siteId: "planta", yearsBefore: 5 },
      ...["Juan Pérez", "Rocío Saldaña", "Luis Ibarra", "Marisol Cavazos", "Pedro Tamez", "Ana Zúñiga", "Hugo Garza", "Lety Rangel"].map((name) => ({ roleId: "operador", name, siteId: "planta" })),
      { roleId: "operador_cnc", name: "Nacho Villarreal", siteId: "planta", yearsBefore: 4 },
      { roleId: "operador_cnc", name: "Brenda Sáenz", siteId: "planta", yearsBefore: 2 },
      { roleId: "tecnico_mantenimiento", name: "Memo Leal", siteId: "planta", yearsBefore: 3 },
      { roleId: "inspector_calidad", name: "Karla Benavides", siteId: "planta", yearsBefore: 1 },
      { roleId: "almacenista", name: "Toño Guajardo", siteId: "planta" },
      { roleId: "auxiliar_administrativo", name: "Claudia Mier", siteId: null, yearsBefore: 2 },
    ],
    contracts: [
      { id: "c_aceros", client: "Ensambles del Norte", unitsPerDay: 3000, price: 10 },
      { id: "c_frenos", client: "Frenos Apodaca", unitsPerDay: 1800, price: 10 },
    ],
    summary: "Un taller de estampado con quince personas, tres prensas y un turno. Dos clientes compran unas 4,800 piezas al día.",
  },
  restaurante_consolidada: {
    id: "restaurante_consolidada",
    family: "restaurante",
    name: "Parrilla Regia",
    region: "MTY",
    startMonth: 3,
    cash: 1800000,
    fixedLines: PARRILLA_FIXED,
    ownerCapacity: 2500000,
    bankRate: 0.21,
    startCredit: 3000000,
    size: "consolidada",
    sites: [
      { id: "centro", name: "Sucursal Centro", zone: "centro", rent: 48000, utilities: 25000, assets: { mesas: 16 }, shifts: 1, demandBase: 115 },
      { id: "san_pedro", name: "Sucursal San Pedro", zone: "san_pedro", rent: 72000, utilities: 27000, assets: { mesas: 16 }, shifts: 1, demandBase: 120 },
      { id: "cumbres", name: "Sucursal Cumbres", zone: "cumbres", rent: 52000, utilities: 23000, assets: { mesas: 14 }, shifts: 1, demandBase: 100 },
      { id: "guadalupe", name: "Sucursal Guadalupe", zone: "guadalupe", rent: 40000, utilities: 22000, assets: { mesas: 14 }, shifts: 1, demandBase: 70 },
      { id: "san_nicolas", name: "Sucursal San Nicolás", zone: "san_nicolas", rent: 42000, utilities: 22000, assets: { mesas: 14 }, shifts: 1, demandBase: 100 },
    ],
    staff: [
      ...branch("centro", ["Mariana Treviño", "Raúl Garza", "Lupita Ochoa", "Iván Salinas", "Diego Cantú", "Paola Rdz.", "Kevin Leal", "Sofía Montes", "Don Chuy Villarreal", "Rosa Elizondo"], 4),
      ...branch("san_pedro", ["Andrés Sada", "Carmen Lozano", "Beto Garza", "Nancy Rocha", "Martín Ayala", "Fer Treviño", "Ximena Cruz", "Lalo Zambrano", "Doña Mary Salazar", "Toño Medina"], 3),
      ...branch("cumbres", ["Gaby Martínez", "Rubén Cavazos", "Pepe Ibarra", "Laura Peña", "Saúl Rangel", "Daniela Ríos", "Óscar Leal", "Juanita Flores", "Manuel Torres"], 2),
      ...branch("guadalupe", ["Héctor Villarreal", "Silvia Garza", "Alan Tamez", "Rocío Saldaña", "Marco Ruiz", "Itzel Mora", "Ramiro Solís", "Cuca Hernández", "Jaime Castro"], 2),
      ...branch("san_nicolas", ["Patricia Leal", "Gerardo Benavides", "Toñita Sáenz", "Emilio Cantú", "Abril Garza", "Rodrigo Pérez", "Brenda Lara", "Don Pancho Ríos", "Luis Nava"], 1),
      { roleId: "gerente_operaciones", name: "Ricardo Garza Sada", siteId: null, yearsBefore: 5 },
      { roleId: "contador", name: "Elsa Montemayor", siteId: null, yearsBefore: 4 },
      { roleId: "rh_generalista", name: "Lorena Villarreal", siteId: null, yearsBefore: 2 },
    ],
    summary: "Un grupo de cinco restaurantes con unas cincuenta personas, gerente de operaciones, contabilidad y recursos humanos. Vende cerca de 480 pedidos al día y las sucursales no rinden igual: unas se saturan y otra tiene gente de más.",
  },
  manufactura_consolidada: {
    id: "manufactura_consolidada",
    family: "manufactura",
    name: "Grupo Forja",
    region: "MTY",
    startMonth: 3,
    cash: 4200000,
    fixedLines: FORJA_GRUPO_FIXED,
    ownerCapacity: 5000000,
    bankRate: 0.18,
    startCredit: 8000000,
    size: "consolidada",
    sites: [
      { id: "planta", name: "Planta Apodaca", zone: "apodaca", rent: 115000, utilities: 170000, assets: { prensa: 5 }, shifts: 2, demandBase: 0 },
      { id: "saltillo", name: "Planta Saltillo", zone: "saltillo", rent: 70000, utilities: 85000, assets: { prensa: 3 }, shifts: 1, demandBase: 0 },
    ],
    staff: [
      { roleId: "gerente_planta", name: "Alejandro Treviño", siteId: "planta", yearsBefore: 8 },
      { roleId: "supervisor_produccion", name: "Arturo Elizondo", siteId: "planta", yearsBefore: 5 },
      { roleId: "supervisor_produccion", name: "Norma Cantú", siteId: "planta", yearsBefore: 3 },
      ...["Juan Pérez", "Rocío Saldaña", "Luis Ibarra", "Marisol Cavazos", "Pedro Tamez", "Ana Zúñiga", "Hugo Garza", "Lety Rangel", "Chuy Medina", "Karina Salas", "Polo Ramírez", "Vero Mata", "Neto Lozano", "Liz Ochoa", "Moy Treviño", "Sandra Rivas", "Beto Ayala", "Cris Peña"].map((name) => ({ roleId: "operador", name, siteId: "planta" })),
      { roleId: "operador_cnc", name: "Nacho Villarreal", siteId: "planta", yearsBefore: 4 },
      { roleId: "operador_cnc", name: "Brenda Sáenz", siteId: "planta", yearsBefore: 2 },
      { roleId: "operador_cnc", name: "Jorge Salinas", siteId: "planta", yearsBefore: 3 },
      { roleId: "tecnico_mantenimiento", name: "Memo Leal", siteId: "planta", yearsBefore: 3 },
      { roleId: "tecnico_mantenimiento", name: "Raúl Benítez", siteId: "planta", yearsBefore: 1 },
      { roleId: "inspector_calidad", name: "Karla Benavides", siteId: "planta", yearsBefore: 1 },
      { roleId: "almacenista", name: "Toño Guajardo", siteId: "planta" },
      { roleId: "almacenista", name: "Pily Torres", siteId: "planta" },
      { roleId: "ingeniero_procesos", name: "Diana Garza", siteId: "planta", yearsBefore: 2 },
      { roleId: "supervisor_produccion", name: "Samuel Aguirre", siteId: "saltillo", yearsBefore: 4 },
      ...["Efrén Dávila", "Mayra Aguirre", "Ciro Valdés", "Yesenia Flores", "Gil Morales", "Tere Galindo", "Lupe Arizpe"].map((name) => ({ roleId: "operador", name, siteId: "saltillo" })),
      { roleId: "operador_cnc", name: "Fabián Ramos", siteId: "saltillo", yearsBefore: 2 },
      { roleId: "tecnico_mantenimiento", name: "Chema Cárdenas", siteId: "saltillo", yearsBefore: 2 },
      { roleId: "inspector_calidad", name: "Olga Narro", siteId: "saltillo", yearsBefore: 1 },
      { roleId: "almacenista", name: "Rafa Siller", siteId: "saltillo" },
      { roleId: "auxiliar_administrativo", name: "Claudia Mier", siteId: null, yearsBefore: 2 },
      { roleId: "auxiliar_administrativo", name: "Mónica Rdz.", siteId: null, yearsBefore: 1 },
      { roleId: "ejecutivo_comercial", name: "Federico Lozano", siteId: null, yearsBefore: 3 },
    ],
    contracts: [
      { id: "c_aceros", client: "Ensambles del Norte", unitsPerDay: 6000, price: 10, siteId: "planta" },
      { id: "c_frenos", client: "Frenos Apodaca", unitsPerDay: 3200, price: 10, siteId: "planta" },
      { id: "c_sistemas", client: "Sistemas Automotrices Regios", unitsPerDay: 2000, price: 10.4, siteId: "planta" },
      { id: "c_carrocerias", client: "Carrocerías Ramos Arizpe", unitsPerDay: 4600, price: 9.8, siteId: "saltillo" },
    ],
    summary: "Un grupo de estampado con dos plantas (Apodaca a dos turnos y Saltillo a uno), más de cuarenta personas, ocho prensas y cuatro clientes que compran unas 15,800 piezas al día.",
  },
  aceria_emergente: {
    id: "aceria_emergente",
    family: "manufactura",
    line: "aceria",
    name: "Aceros Huasteca",
    region: "MTY",
    startMonth: 3,
    cash: 3500000,
    fixedLines: HUASTECA_FIXED,
    ownerCapacity: 4000000,
    bankRate: 0.19,
    startCredit: 6000000,
    size: "startup",
    sites: [{ id: "planta", name: "Planta Santa Catarina", zone: "santa_catarina", rent: 110000, utilities: 260000, assets: { horno: 2 }, shifts: 1, demandBase: 0 }],
    staff: [
      { roleId: "supervisor_produccion", name: "Rogelio Cantú", siteId: "planta", yearsBefore: 6 },
      { roleId: "maestro_fundidor", name: "Don Fermín Elizondo", siteId: "planta", yearsBefore: 12 },
      ...["Javier Rangel", "Óscar Tamez", "Lalo Ibarra", "Neto Garza", "Pancho Salinas", "Rubén Ochoa", "Toño Mata", "Gerardo Rivas", "Chava Leal", "Memo Zúñiga"].map((name) => ({ roleId: "operador_aceria", name, siteId: "planta" })),
      { roleId: "tecnico_mantenimiento", name: "Ramiro Benítez", siteId: "planta", yearsBefore: 4 },
      { roleId: "metalurgista", name: "Ing. Paula Treviño", siteId: "planta", yearsBefore: 2 },
      { roleId: "almacenista", name: "Beto Cavazos", siteId: "planta" },
      { roleId: "auxiliar_administrativo", name: "Lucía Sáenz", siteId: null, yearsBefore: 3 },
    ],
    contracts: [
      { id: "c_varilla", client: "Constructora Cumbres del Norte", unitsPerDay: 14, price: 15900 },
      { id: "c_palanquilla", client: "Laminados Regios", unitsPerDay: 10, price: 15660 },
    ],
    summary: "Una acería pequeña con dieciséis personas, dos hornos de inducción y un turno. Dos clientes compran unas 24 toneladas al día de varilla y palanquilla; los hornos dan para poco más.",
  },
  aceria_consolidada: {
    id: "aceria_consolidada",
    family: "manufactura",
    line: "aceria",
    name: "Grupo Acerero Huasteca",
    region: "MTY",
    startMonth: 3,
    cash: 9000000,
    fixedLines: HUASTECA_GRUPO_FIXED,
    ownerCapacity: 10000000,
    bankRate: 0.17,
    startCredit: 15000000,
    size: "consolidada",
    sites: [
      { id: "planta", name: "Planta Santa Catarina", zone: "santa_catarina", rent: 190000, utilities: 470000, assets: { horno: 3 }, shifts: 2, demandBase: 0 },
      { id: "saltillo", name: "Planta Saltillo", zone: "saltillo", rent: 90000, utilities: 250000, assets: { horno: 2 }, shifts: 1, demandBase: 0 },
    ],
    staff: [
      { roleId: "gerente_planta", name: "Ing. Alfonso Garza", siteId: "planta", yearsBefore: 9 },
      { roleId: "supervisor_produccion", name: "Rogelio Cantú", siteId: "planta", yearsBefore: 6 },
      { roleId: "supervisor_produccion", name: "Imelda Rocha", siteId: "planta", yearsBefore: 3 },
      { roleId: "maestro_fundidor", name: "Don Fermín Elizondo", siteId: "planta", yearsBefore: 12 },
      { roleId: "maestro_fundidor", name: "Saúl Villarreal", siteId: "planta", yearsBefore: 7 },
      { roleId: "maestro_fundidor", name: "Nacho Treviño", siteId: "planta", yearsBefore: 5 },
      ...crew("operador_aceria", "planta", 28, 0),
      { roleId: "tecnico_mantenimiento", name: "Ramiro Benítez", siteId: "planta", yearsBefore: 4 },
      { roleId: "tecnico_mantenimiento", name: "Julio Cárdenas", siteId: "planta", yearsBefore: 2 },
      { roleId: "metalurgista", name: "Ing. Paula Treviño", siteId: "planta", yearsBefore: 2 },
      { roleId: "almacenista", name: "Beto Cavazos", siteId: "planta" },
      { roleId: "almacenista", name: "Pily Rangel", siteId: "planta" },
      { roleId: "ingeniero_procesos", name: "Ing. Sofía Lozano", siteId: "planta", yearsBefore: 3 },
      { roleId: "supervisor_produccion", name: "Arnulfo Aguirre", siteId: "saltillo", yearsBefore: 5 },
      { roleId: "maestro_fundidor", name: "Efraín Dávila", siteId: "saltillo", yearsBefore: 8 },
      ...crew("operador_aceria", "saltillo", 9, 13),
      { roleId: "tecnico_mantenimiento", name: "Chema Arizpe", siteId: "saltillo", yearsBefore: 2 },
      { roleId: "metalurgista", name: "Ing. Olga Narro", siteId: "saltillo", yearsBefore: 1 },
      { roleId: "almacenista", name: "Rafa Siller", siteId: "saltillo" },
      { roleId: "auxiliar_administrativo", name: "Lucía Sáenz", siteId: null, yearsBefore: 3 },
      { roleId: "auxiliar_administrativo", name: "Mónica Galindo", siteId: null, yearsBefore: 1 },
      { roleId: "ejecutivo_comercial", name: "Federico Morales", siteId: null, yearsBefore: 4 },
    ],
    contracts: [
      { id: "c_varilla", client: "Constructora Cumbres del Norte", unitsPerDay: 30, price: 15900, siteId: "planta" },
      { id: "c_palanquilla", client: "Laminados Regios", unitsPerDay: 24, price: 15660, siteId: "planta" },
      { id: "c_estructuras", client: "Estructuras Metálicas del Golfo", unitsPerDay: 18, price: 16100, siteId: "planta" },
      { id: "c_saltillo", client: "Perfiles de Ramos Arizpe", unitsPerDay: 22, price: 15750, siteId: "saltillo" },
    ],
    summary: "Un grupo acerero con dos plantas (Santa Catarina a dos turnos y Saltillo a uno), más de sesenta personas, cinco hornos de inducción y cuatro clientes que compran unas 94 toneladas al día.",
  },
});
