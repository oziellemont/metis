/**
 * mêtis CEO · Growth Engine · catálogo de puestos por familia de industria (v1).
 *
 * Ontología reusable: función × nivel × rol específico. Cada rol declara qué capacidad aporta (unidades por día a
 * productividad plena), a cuántas personas puede supervisar, cuánto tarda en cubrirse y en rendir, su rotación anual y
 * desde qué tamaño de empresa tiene sentido (no hay director de operaciones en un taller de 15 personas).
 *
 * Salarios: rangos BRUTOS mensuales en pesos, Monterrey (NL), 2026. Confianza «supuesto»: son rangos de simulación
 * construidos con referencias públicas (Observatorio Laboral STPS/ENOE-INEGI por ocupación y vacantes publicadas) y
 * todavía NO están homologados contra una fuente única. Ninguno queda debajo del salario mínimo 2026. La IA no los
 * recalcula; para cambiarlos se agrega una versión.
 */
import type { Family, RoleDef } from "./types";

const SAL_SRC = "Rango de simulación v1 (NL, 2026), con referencias del Observatorio Laboral STPS (ENOE-INEGI) y vacantes publicadas; pendiente de homologar.";

const R = (r: Omit<RoleDef, "salarySource" | "confidence">): RoleDef => ({ ...r, salarySource: SAL_SRC, confidence: "supuesto" });

export const ROLES_V1: readonly RoleDef[] = Object.freeze([
  // ─────────────────────────────── restaurante
  R({ id: "cocinero", family: "restaurante", title: "Cocinero de línea", func: "produccion", level: "operativo", salary: { min: 11000, mid: 12500, max: 14500 }, hireCost: 3500, fillDays: 12, rampDays: 21, rampStart: 0.6, provides: { cocina: 30 }, attrition: 0.6 }),
  R({ id: "ayudante_cocina", family: "restaurante", title: "Ayudante de cocina", func: "produccion", level: "operativo", salary: { min: 9600, mid: 10000, max: 11000 }, hireCost: 2500, fillDays: 8, rampDays: 14, rampStart: 0.6, provides: { cocina: 16 }, attrition: 0.8 }),
  R({ id: "mesero", family: "restaurante", title: "Mesero", func: "servicio", level: "operativo", salary: { min: 9500, mid: 9600, max: 10500 }, hireCost: 2500, fillDays: 8, rampDays: 10, rampStart: 0.7, provides: { servicio: 42 }, attrition: 0.8 }),
  R({ id: "lavaloza", family: "restaurante", title: "Lavaloza", func: "operaciones", level: "operativo", salary: { min: 9500, mid: 9500, max: 10000 }, hireCost: 1500, fillDays: 6, rampDays: 5, rampStart: 0.8, provides: { loza: 140 }, attrition: 1.0 }),
  R({ id: "cajero", family: "restaurante", title: "Cajero", func: "finanzas", level: "operativo", salary: { min: 9800, mid: 10000, max: 11000 }, hireCost: 2000, fillDays: 8, rampDays: 7, rampStart: 0.8, provides: { caja: 220 }, attrition: 0.5 }),
  R({ id: "jefe_cocina", family: "restaurante", title: "Jefe de cocina", func: "produccion", level: "supervisor", salary: { min: 17000, mid: 19500, max: 23000 }, hireCost: 7000, fillDays: 25, rampDays: 30, rampStart: 0.7, provides: { cocina: 18 }, span: 8, attrition: 0.25 }),
  R({ id: "gerente_sucursal", family: "restaurante", title: "Gerente de sucursal", func: "operaciones", level: "gerente", salary: { min: 20000, mid: 23000, max: 28000 }, hireCost: 12000, fillDays: 35, rampDays: 45, rampStart: 0.6, span: 12, attrition: 0.2 }),
  R({ id: "gerente_operaciones", family: "restaurante", title: "Gerente de operaciones", func: "operaciones", level: "gerente", salary: { min: 35000, mid: 40000, max: 48000 }, hireCost: 30000, fillDays: 50, rampDays: 60, rampStart: 0.6, span: 6, attrition: 0.12, minHeadcount: 25, companyLevel: true }),
  R({ id: "contador", family: "restaurante", title: "Contador interno", func: "finanzas", level: "especialista", salary: { min: 16000, mid: 18000, max: 22000 }, hireCost: 8000, fillDays: 30, rampDays: 30, rampStart: 0.7, attrition: 0.15, minHeadcount: 20, companyLevel: true }),
  R({ id: "rh_generalista", family: "restaurante", title: "Generalista de recursos humanos", func: "rh", level: "especialista", salary: { min: 16000, mid: 18000, max: 21000 }, hireCost: 8000, fillDays: 30, rampDays: 30, rampStart: 0.7, attrition: 0.15, minHeadcount: 35, companyLevel: true }),

  // ─────────────────────────────── manufactura (estampado / autopartes)
  R({ id: "operador", family: "manufactura", title: "Operador de producción", func: "produccion", level: "operativo", salary: { min: 10500, mid: 11000, max: 12500 }, hireCost: 4000, fillDays: 14, rampDays: 30, rampStart: 0.5, provides: { operacion: 600 }, attrition: 0.4, rampScrap: 0.06 }),
  R({ id: "operador_cnc", family: "manufactura", title: "Operador CNC / ajustador de troqueles", func: "produccion", level: "especialista", salary: { min: 14000, mid: 15500, max: 17500 }, hireCost: 7000, fillDays: 30, rampDays: 45, rampStart: 0.5, provides: { operacion: 750 }, attrition: 0.25, rampScrap: 0.05 }),
  R({ id: "supervisor_produccion", family: "manufactura", title: "Supervisor de producción", func: "produccion", level: "supervisor", salary: { min: 21000, mid: 24000, max: 28000 }, hireCost: 10000, fillDays: 30, rampDays: 30, rampStart: 0.7, span: 12, attrition: 0.15 }),
  R({ id: "tecnico_mantenimiento", family: "manufactura", title: "Técnico de mantenimiento", func: "mantenimiento", level: "especialista", salary: { min: 16000, mid: 17500, max: 19500 }, hireCost: 7000, fillDays: 25, rampDays: 30, rampStart: 0.7, attrition: 0.2 }),
  R({ id: "inspector_calidad", family: "manufactura", title: "Inspector de calidad", func: "calidad", level: "especialista", salary: { min: 14500, mid: 16000, max: 18000 }, hireCost: 6000, fillDays: 20, rampDays: 21, rampStart: 0.7, attrition: 0.2 }),
  R({ id: "almacenista", family: "manufactura", title: "Almacenista", func: "logistica", level: "operativo", salary: { min: 10500, mid: 11000, max: 12000 }, hireCost: 3000, fillDays: 12, rampDays: 14, rampStart: 0.7, attrition: 0.3 }),
  R({ id: "ejecutivo_comercial", family: "manufactura", title: "Ejecutivo comercial", func: "ventas", level: "especialista", salary: { min: 22000, mid: 24000, max: 30000 }, hireCost: 12000, fillDays: 40, rampDays: 90, rampStart: 0.3, attrition: 0.2, companyLevel: true }),
  R({ id: "auxiliar_administrativo", family: "manufactura", title: "Auxiliar administrativo y contable", func: "finanzas", level: "especialista", salary: { min: 13000, mid: 14000, max: 16000 }, hireCost: 5000, fillDays: 20, rampDays: 30, rampStart: 0.7, attrition: 0.2, companyLevel: true }),
  R({ id: "ingeniero_procesos", family: "manufactura", title: "Ingeniero de procesos", func: "produccion", level: "especialista", salary: { min: 26000, mid: 29000, max: 34000 }, hireCost: 15000, fillDays: 40, rampDays: 60, rampStart: 0.5, attrition: 0.18, minHeadcount: 25 }),
  R({ id: "gerente_planta", family: "manufactura", title: "Gerente de planta", func: "operaciones", level: "gerente", salary: { min: 50000, mid: 56000, max: 65000 }, hireCost: 45000, fillDays: 60, rampDays: 60, rampStart: 0.6, span: 8, attrition: 0.12, minHeadcount: 40 }),
  R({ id: "director_operaciones", family: "manufactura", title: "Director de operaciones", func: "direccion", level: "director", salary: { min: 90000, mid: 110000, max: 130000 }, hireCost: 110000, fillDays: 90, rampDays: 90, rampStart: 0.5, span: 6, attrition: 0.1, minHeadcount: 120, companyLevel: true }),
]);

const BY_ID = new Map(ROLES_V1.map((r) => [r.id, r]));
export const roleById = (id: string): RoleDef | undefined => BY_ID.get(id);
export const rolesOf = (f: Family): RoleDef[] => ROLES_V1.filter((r) => r.family === f);
