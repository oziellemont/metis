/**
 * mêtis CEO · banco de casos con economía real (reglas v10).
 *
 * Hechos con monto de cada arquetipo, por industria. Los montos salen de los renglones de datos de cada caso
 * (contexts*.ts): «Costo de un retiro total: $6 M» se vuelve un pago de $6 M. Donde el caso no trae el monto exacto de
 * una opción, la fracción está escrita aquí y explicada en el texto del hecho (se muestra al jugador).
 *
 * Reglas: cada movimiento de Caja o Margen cita un hecho; no conceder no es una ganancia; aplazar un pago no es un
 * ahorro (regresa cuando se paga); una concesión o inversión fuera de la autoridad del director, sin consejo, mueve el
 * Consejo (lo agrega el motor). Las reglas anteriores a v10 ignoran estos hechos y siguen leyendo `effects`.
 * Equipo, Clientes y Consejo siguen en `effects` del arquetipo.
 */
import type { Fact, FactKind } from "../types";
import type { ArchetypeId } from "./archetypes";

export type IndustryId = "alimentos_bebidas" | "autopartes" | "restaurantes" | "software_saas" | "retail" | "logistica_distribucion";
const IND: IndustryId[] = ["alimentos_bebidas", "autopartes", "restaurantes", "software_saas", "retail", "logistica_distribucion"];

export interface ArchFacts {
  options: [Fact[], Fact[], Fact[]];
  expired: Fact[];
  /** Opciones (índice original) que pasan por el consejo. */
  board?: number[];
  arrival?: { text: string; facts: Fact[] };
}
type Spec = (n: number, ind: IndustryId) => ArchFacts;

const f = (kind: FactKind, amount: number, text: string, extra: Partial<Fact> = {}): Fact => ({ kind, amount: Math.round(amount * 100) / 100, text, ...extra });
const gasto = (amount: number, text: string, extra: Partial<Fact> = {}) => f("pago", amount, text, { expense: true, ...extra });
/** Inversión con 70 % financiado por la línea del banco (interés de 12 % anual). */
const financiada = (amount: number, text: string): Fact[] => [f("inversion", -amount, text), f("financiamiento", 0.7 * amount, "70 % financiado con la línea del banco", { rate: 0.12 })];
/** Monto por industria, en el orden de IND. */
const per = (...xs: [number, number, number, number, number, number]) => (ind: IndustryId) => xs[IND.indexOf(ind)];

const SPECS: Record<ArchetypeId, { n: (ind: IndustryId) => number; spec: Spec }> = {
  // Costo del retiro total (renglón del caso). Software: créditos estimados por apagar la función.
  retiro: {
    n: per(6, 14, 1.8, 0.6, 9, 11),
    spec: (c) => ({
      options: [[gasto(-c, "Retiro total: producto, logística y merma")], [gasto(-0.3 * c, "Retiro solo donde hay reportes (≈ 30 % del total)")], []],
      expired: [gasto(-c, "Retiro forzado después de que el caso salió en medios")],
    }),
  },
  // Costo anual de lo que pide el cliente (renglón del caso).
  cliente: {
    n: per(4.5, 92, 11, 7, 12, 19),
    spec: (k) => ({
      options: [[f("precio", -0.25 * k, "Lo que cedes en la negociación (≈ 25 % de lo que pedía)")], [f("precio", -k, "Condiciones del cliente aceptadas completas")], [f("precio", -0.5 * k, "Volumen que el cliente mueve a otro proveedor", { external: true })]],
      expired: [f("precio", -k, "Condiciones aplicadas por default")],
    }),
  },
  // Devoluciones o garantías ligadas al esquema (cuando el caso las trae).
  incentivos: {
    n: per(3, 0, 0, 0, 30, 0),
    spec: (x, ind) => ({
      options: [
        [gasto(-0.5, "Investigación y rediseño del esquema"), ...(ind === "alimentos_bebidas" ? [f("costo", 0.5 * x, "Menos devoluciones con la meta nueva", { days: 6 })] : []), ...(ind === "retail" ? [f("precio", -x / 3, "Garantías que ya no se fuerzan en caja")] : [])],
        [],
        [gasto(-1, "Auditoría externa")],
      ],
      expired: [],
    }),
  },
  // Rescate pedido (renglón del caso).
  ciberataque: {
    n: per(4, 9, 2.5, 6, 7, 8),
    spec: (r) => ({
      options: [[gasto(-0.75 * r, "Días en manual y reconstrucción desde respaldos")], [gasto(-r, "Rescate pagado"), gasto(-0.25 * r, "Limpieza y revisión de sistemas")], [gasto(-0.4 * r, "Equipo forense")]],
      expired: [gasto(-r, "Operación detenida y reconstrucción tardía")],
    }),
  },
  // Inversión total de la expansión (franquicias: manuales y equipo).
  expansion: {
    n: per(38, 420, 6, 35, 95, 70),
    spec: (i) => ({
      options: [[f("inversion", -0.15 * i, "Piloto de tres meses en un frente")], financiada(i, "Expansión completa"), []],
      expired: [],
      // La propuesta viene del consejo: piloto y expansión completa se deciden con él.
      board: [0, 1],
    }),
  },
  // Golpe anual del alza de costos sobre el margen (renglones de margen o costo del caso).
  precio: {
    n: per(7, 23, 49, 21, 96, 45),
    spec: (s) => ({
      arrival: { text: "El costo ya subió antes de que decidas: lo resientes elijas lo que elijas.", facts: [f("costo", -s, "Alza de costos del periodo")] },
      options: [
        [f("precio", 0.8 * s, "Aumento en dos etapas (la primera recupera ≈ 80 %)", { days: 4 })],
        [f("precio", s, "Aumento completo de una vez"), f("precio", -0.2 * s, "Clientes que se van por el aumento sin aviso", { external: true })],
        [f("costo", 0.3 * s, "Ahorros internos encontrados", { days: 6 })],
      ],
      expired: [],
    }),
  },
  // Ahorro anual necesario (o costo de mantener a todos).
  recorte: {
    n: per(9, 48, 22, 18, 28, 34),
    spec: (a) => ({
      options: [
        [f("costo", a, "Ajuste de plantilla suficiente", { days: 3 }), gasto(-0.4 * a, "Liquidaciones arriba de la ley y apoyo")],
        [f("costo", 0.3 * a, "Ajustes chicos este mes"), gasto(-0.1 * a, "Liquidaciones del mes")],
        [f("costo", 0.15 * a, "Congelar contrataciones y bajar sueldos directivos")],
      ],
      expired: [],
    }),
  },
  // Monto de referencia del proveedor caído (pedido, penalización o venta en riesgo).
  proveedor: {
    n: per(1, 5, 2, 1, 6, 3),
    spec: (x) => ({
      options: [
        [f("capital_trabajo", -1.5 * x, "Anticipo al proveedor"), gasto(-0.3 * x, "Ingeniería de apoyo y calificar otra fuente")],
        [gasto(-1.5 * x, "Sobreprecio de la compra de emergencia")],
        [gasto(-2 * x, "Venta y penalizaciones por el retraso")],
      ],
      expired: [gasto(-3 * x, "Operación detenida por falta de insumo")],
    }),
  },
  // Inversión mínima de la apuesta.
  apuesta: {
    n: per(8, 120, 3, 9, 15, 30),
    spec: (i) => ({
      options: [[f("inversion", -0.5 * i, "Presupuesto del primer año de la unidad aparte")], [gasto(-0.15 * i, "Prueba dentro del área actual")], []],
      expired: [],
      board: [0],
    }),
  },
  // Costo de reparar el error (renglón del caso).
  error: {
    n: per(1.2, 2.4, 0.4, 0.8, 6, 0.9),
    spec: (e) => ({
      options: [[gasto(-e, "Reparar el daño al afectado")], [gasto(-0.5 * e, "Arreglo en silencio")], [gasto(-e, "Reparar el daño al afectado"), gasto(-0.1 * e, "Liquidación")]],
      expired: [gasto(-e, "Compensación que el afectado exige después")],
    }),
  },
  // Costo anual de igualar el precio en todo (renglón del caso).
  guerra: {
    n: per(12, 22, 8, 20, 30, 18),
    spec: (g) => ({
      options: [[f("precio", -0.15 * g, "Igualar solo donde atacan (≈ 15 % de igualar en todo)")], [f("precio", -g, "Igualar el precio en toda la línea")], [f("precio", -0.25 * g, "Clientes que se van con el competidor", { external: true })]],
      expired: [f("precio", -0.5 * g, "Descuentos dispersos sin estrategia")],
    }),
  },
  verde: { n: per(0, 0, 0, 0, 0, 0), spec: () => ({ options: [[], [], []], expired: [] }) },
  // Mantenimiento o remodelación aplazable + capacitación (renglones del caso).
  trimestre: {
    n: per(4.7, 7.5, 4.6, 11, 15, 6),
    spec: (m) => ({
      options: [
        [],
        [f("capital_trabajo", m, "Mantenimiento y capacitación aplazados (se pagan después)"), gasto(-0.6 * m, "Fallas por el mantenimiento aplazado", { days: 6 })],
        [f("capital_trabajo", 0.5 * m, "La mitad aplazada (se paga después)"), gasto(-0.3 * m, "Fallas por lo aplazado", { days: 6 })],
      ],
      expired: [f("capital_trabajo", m, "El consejo aplazó mantenimiento y capacitación"), gasto(-0.6 * m, "Fallas por el mantenimiento aplazado", { days: 6 })],
    }),
  },
  // Costo de capacitar o revisar (renglón del caso).
  incidente: {
    n: per(0.8, 1.1, 1.5, 0.5, 6, 1.4),
    spec: (i) => ({
      options: [[gasto(-i, "Capacitación y revisión de la regla")], [gasto(-0.3 * i, "Liquidación de la persona")], []],
      expired: [],
    }),
  },
  // Costo de subir el piso salarial al año (renglón del caso).
  salarios: {
    n: per(9, 14, 5, 11, 16, 12),
    spec: (w) => ({
      options: [[f("costo", -w / 4, "Primera etapa del piso salarial, en parte pagada con bonos directivos")], [f("costo", -w, "Mismo sueldo mínimo para todos")], [gasto(-0.15 * w, "Bono de permanencia a los mejores")]],
      expired: [],
    }),
  },
  // Lo que cuesta detener el atajo (pedido que se cobra después, penalización o venta que se retrasa).
  meta: {
    n: per(7, 1, 0, 1, 0, 0.5),
    spec: (x, ind) => ({
      options: [
        x ? [ind === "alimentos_bebidas" ? f("capital_trabajo", -x, "La mitad del pedido inicial se cobra después") : gasto(-x, "Penalización o venta que se retrasa")] : [],
        [],
        [gasto(-0.5, "Revisión externa independiente")],
      ],
      expired: [],
    }),
  },
  // Margen que se recupera al quitar lo que pierde dinero.
  foco: {
    n: per(4, 15, 5, 3, 12, 8),
    spec: (x) => ({
      options: [[f("costo", x, "Quitar lo que no gana ni distingue", { days: 5 }), gasto(-0.2 * x, "Reubicar a la gente")], [], [f("costo", 0.5 * x, "Quitar solo lo que pierde dinero", { days: 5 })]],
      expired: [],
    }),
  },
  adaptativo: { n: per(0, 0, 0, 0, 0, 0), spec: () => ({ options: [[], [], [gasto(-1.5, "Consultoría externa")]], expired: [] }) },
  mando: { n: per(0, 0, 0, 0, 0, 0), spec: () => ({ options: [[gasto(-0.2, "Mentor y acompañamiento")], [f("costo", -0.4, "Jefe de fuera (+35 % sobre el puesto)")], []], expired: [] }) },
  sucesor: { n: per(0, 0, 0, 0, 0, 0), spec: () => ({ options: [[gasto(-0.5, "Programa de relevo")], [], []], expired: [] }) },
  // Inversión completa y fase uno (renglones del caso). Se presenta al consejo.
  inversion: {
    n: per(48, 72, 22, 30, 26, 56),
    spec: (full, ind) => {
      const fase = { alimentos_bebidas: 26, autopartes: 39, restaurantes: 12, software_saas: 16, retail: 14, logistica_distribucion: 24 }[ind];
      return {
        options: [financiada(fase, "Primera fase"), financiada(full, "Inversión completa"), [f("costo", -0.05 * full, "Horas extra para exprimir la capacidad")]],
        expired: [],
        board: [0, 1],
      };
    },
  },
  // El dinero para crecer llega con su propio calendario: este mes solo se pagan asesores y comisiones.
  capital: { n: per(0, 0, 0, 0, 0, 0), spec: () => ({ options: [[], [gasto(-1.5, "Asesores de la transacción")], [gasto(-1, "Comisión de apertura del crédito")]], expired: [] }) },
  // Costo de abrir cinco sitios (software: equipo de cinco al año).
  region: {
    n: per(40, 110, 35, 18, 45, 50),
    spec: (c, ind) => ({
      options: [
        [ind === "software_saas" ? f("costo", -c / 6, "Un líder y un vendedor en la región") : f("inversion", -c / 5, "Un solo sitio")],
        ind === "software_saas" ? [f("costo", -c, "Equipo de cinco en la región")] : financiada(c, "Cinco sitios a la vez"),
        [],
      ],
      expired: [],
    }),
  },
  alianza: { n: per(0, 0, 0, 0, 0, 0), spec: () => ({ options: [[gasto(-0.3, "Negociación y contrato")], [], []], expired: [] }) },
  // Precio pedido (renglón del caso). Se presenta al consejo.
  adquisicion: {
    n: per(300, 350, 70, 120, 160, 140),
    spec: (p) => ({
      options: [[gasto(-0.01 * p, "Revisión de cuentas y clientes")], [gasto(-0.03 * p, "Costos de cierre e integración sin revisión")], []],
      expired: [],
      board: [0, 1, 2],
    }),
  },
  // Multa posible (renglón del caso).
  regulador: {
    n: per(1.8, 2.4, 0.6, 3, 1.5, 2),
    spec: (m) => ({
      options: [[gasto(-0.5 * m, "Multa reducida por admitir"), gasto(-m, "Corrección calendarizada y revisión")], [gasto(-0.5, "Abogados")], [gasto(-m, "Multa pagada"), gasto(-0.3 * m, "Corrección de lo señalado")]],
      expired: [gasto(-1.2 * m, "Multa completa con recargo")],
    }),
  },
  prensa: { n: per(0, 0, 0, 0, 0, 0), spec: () => ({ options: [[], [gasto(-0.3, "Revisión legal")], [gasto(-0.5, "Agencia de comunicación")]], expired: [] }) },
  // Saldo del crédito y valor del activo sin uso (renglones del caso).
  deuda: {
    n: per(180, 240, 60, 50, 110, 170),
    spec: (s, ind) => {
      const asset = { alimentos_bebidas: 25, autopartes: 18, restaurantes: 6, software_saas: 5, retail: 14, logistica_distribucion: 20 }[ind];
      const delay = { alimentos_bebidas: 13, autopartes: 70, restaurantes: 31, software_saas: 10, retail: 80, logistica_distribucion: 68 }[ind];
      return {
        options: [
          [f("pago", -0.05 * s, "Pago anticipado de parte del crédito")],
          [f("capital_trabajo", delay, "Pagos a proveedores retrasados dos semanas"), f("capital_trabajo", -delay, "Se pagan las facturas retrasadas", { days: 4 })],
          [f("cobro", 0.8 * asset, "Venta del activo por debajo de su valor")],
        ],
        expired: [f("costo", -0.01 * s, "El banco sube la tasa un punto")],
      };
    },
  },
};

/** Hechos de un arquetipo en una industria (o undefined si no hay contexto para esa industria). */
export function archetypeFacts(id: ArchetypeId, industry: string): ArchFacts | undefined {
  const s = SPECS[id];
  if (!s || !IND.includes(industry as IndustryId)) return undefined;
  const ind = industry as IndustryId;
  return s.spec(s.n(ind), ind);
}
