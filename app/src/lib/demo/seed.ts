/**
 * Datos demo · Grupo Andes (empresa ficticia del brochure).
 * Sirven para el modo demo sin Supabase y como base del seed SQL.
 */
import type {
  Element, ElementScope, Invitation, LAE, Result, Scope, ScopeType, Scorecard, ScorecardItem, StrategicObjective, Tenant, Unit, User,
} from "../domain/types";

export const YEAR = 2026;
export const CURRENT_MONTH = 9; // septiembre

export const tenant: Tenant = {
  id: "t-andes", name: "Grupo Andes", plan: "crecimiento",
  joinCode: "ANDES-2026",
  reminders: { enabled: true, days: [25, 1, 3], hour: 9, timezone: "America/Monterrey", escalateToManager: true, channels: { email: true, whatsapp: false } },
};

/** Catálogo de unidades. Las marcadas `system` vienen con METIS; el cliente puede agregar/editar/quitar las suyas. */
export const units: Unit[] = [
  { id: "un-pct", symbol: "%", name: "Porcentaje", decimals: 1, position: "suffix", system: true },
  { id: "un-mxn", symbol: "$", name: "Pesos mexicanos", decimals: 0, position: "prefix", system: true },
  { id: "un-usd", symbol: "USD", name: "Dólares", decimals: 0, position: "prefix", system: true },
  { id: "un-num", symbol: "#", name: "Cantidad", decimals: 0, position: "suffix", system: true },
  { id: "un-pts", symbol: "pts", name: "Puntos", decimals: 0, position: "suffix", system: true },
  { id: "un-days", symbol: "días", name: "Días", decimals: 1, position: "suffix", system: true },
  { id: "un-hrs", symbol: "hrs", name: "Horas", decimals: 1, position: "suffix", system: true },
  { id: "un-adv", symbol: "% avance", name: "Avance de proyecto", decimals: 0, position: "suffix", system: true },
  { id: "un-ton", symbol: "ton", name: "Toneladas", decimals: 1, position: "suffix" },
  { id: "un-pzas", symbol: "pzas", name: "Piezas", decimals: 0, position: "suffix" },
];

export const users: User[] = [
  { id: "u-ceo", name: "Patricia Elizondo", email: "patricia.elizondo@grupoandes.demo", title: "Directora General", initials: "PE", managerId: null, role: "admin", teamName: "Dirección General" },
  { id: "u-js", name: "Jorge Salinas", email: "jorge.salinas@grupoandes.demo", title: "Director de Operaciones", initials: "JS", managerId: "u-ceo", role: "manager", teamName: "Operaciones" },
  { id: "u-ag", name: "Ana Garza", email: "ana.garza@grupoandes.demo", title: "Directora Comercial", initials: "AG", managerId: "u-ceo", role: "manager", teamName: "Comercial" },
  { id: "u-mt", name: "Mariana Torres", email: "mariana.torres@grupoandes.demo", title: "Gerente de Operaciones · Región Norte", initials: "MT", managerId: "u-js", role: "manager", teamName: "Operaciones Región Norte" },
  { id: "u-lr", name: "Luis Ramírez", email: "luis.ramirez@grupoandes.demo", title: "Gerente de Logística · BU Consumo", initials: "LR", managerId: "u-js", role: "manager", teamName: "Logística" },
  { id: "u-dp", name: "Diego Pérez", email: "diego.perez@grupoandes.demo", title: "Jefe de CEDIS Saltillo", initials: "DP", managerId: "u-mt", role: "collaborator", teamName: "Operaciones Región Norte" },
  { id: "u-km", name: "Karla Mendoza", email: "karla.mendoza@grupoandes.demo", title: "Gerente de Capital Humano · Región Norte", initials: "KM", managerId: "u-mt", role: "collaborator", teamName: "Operaciones Región Norte" },
  { id: "u-rv", name: "Raúl Villarreal", email: "raul.villarreal@grupoandes.demo", title: "Líder de Proyectos TI", initials: "RV", managerId: "u-js", role: "collaborator", teamName: "TI" },
];

export const objectives: StrategicObjective[] = [
  { id: "o-1", name: "Crecer EBITDA 40% a 2028", horizon: "2028", description: "Pasar de $180M a $252M de EBITDA con crecimiento rentable y excelencia operativa." },
  { id: "o-2", name: "Ser el proveedor preferido en el norte del país", horizon: "2028", description: "Cuota de mercado #1 en Región Norte con el mejor nivel de servicio." },
  { id: "o-3", name: "Equipo que crece con la empresa", horizon: "2028", description: "Rotación operativa menor a 3% y sucesión lista para cada puesto clave." },
];

export const laes: LAE[] = [
  { id: "l-1", objectiveId: "o-1", name: "Excelencia operativa", color: "#4F3FE0" },
  { id: "l-2", objectiveId: "o-1", name: "Crecimiento rentable", color: "#14C98E" },
  { id: "l-3", objectiveId: "o-2", name: "Transformación digital", color: "#2FA7F5" },
  { id: "l-4", objectiveId: "o-2", name: "Experiencia de cliente", color: "#F5A524" },
  { id: "l-5", objectiveId: "o-3", name: "Talento y cultura", color: "#F2545B" },
];

export const scopeTypes: ScopeType[] = [
  { id: "st-nac", name: "Nacional" },
  { id: "st-reg", name: "Región" },
  { id: "st-city", name: "Ciudad" },
  { id: "st-plant", name: "Planta" },
  { id: "st-cedis", name: "CEDIS" },
  { id: "st-bu", name: "Unidad de negocio" },
  { id: "st-ch", name: "Canal" },
];

export const scopes: Scope[] = [
  { id: "s-nac", typeId: "st-nac", name: "Nacional", parentId: null },
  { id: "s-norte", typeId: "st-reg", name: "Región Norte", parentId: "s-nac" },
  { id: "s-centro", typeId: "st-reg", name: "Región Centro", parentId: "s-nac" },
  { id: "s-mty", typeId: "st-city", name: "Monterrey", parentId: "s-norte" },
  { id: "s-sal", typeId: "st-city", name: "Saltillo", parentId: "s-norte" },
  { id: "s-chi", typeId: "st-city", name: "Chihuahua", parentId: "s-norte" },
  { id: "s-tor", typeId: "st-city", name: "Torreón", parentId: "s-norte" },
  { id: "s-pl-mty", typeId: "st-plant", name: "Planta Monterrey", parentId: "s-mty" },
  { id: "s-cd-sal", typeId: "st-cedis", name: "CEDIS Saltillo", parentId: "s-sal" },
  { id: "s-bu-con", typeId: "st-bu", name: "BU Consumo", parentId: "s-nac" },
  { id: "s-bu-ind", typeId: "st-bu", name: "BU Industrial", parentId: "s-nac" },
];

export const elements: Element[] = [
  { id: "e-otif", type: "kpi", name: "Cumplimiento de entregas OTIF", formula: "Pedidos a tiempo y completos / Pedidos totales", unit: "%", unitId: "un-pct", direction: "up", laeId: "l-1", allowedScopeTypeIds: ["st-nac", "st-reg", "st-cedis"] },
  { id: "e-costlog", type: "kpi", name: "Costo logístico / Venta", formula: "Costo de distribución / Venta neta", unit: "%", unitId: "un-pct", direction: "down", laeId: "l-2", allowedScopeTypeIds: ["st-bu", "st-reg"] },
  { id: "e-newacc", type: "kpi", name: "Venta a nuevas cuentas", formula: "Venta neta de clientes con antigüedad < 12 meses", unit: "$", unitId: "un-mxn", direction: "up", laeId: "l-2", allowedScopeTypeIds: ["st-nac", "st-reg"] },
  { id: "e-rot", type: "kpi", name: "Rotación de personal operativo", formula: "Bajas del mes / Plantilla promedio", unit: "%", unitId: "un-pct", direction: "down", laeId: "l-5", allowedScopeTypeIds: ["st-plant", "st-reg", "st-nac"] },
  { id: "e-nps", type: "kpi", name: "NPS de clientes", formula: "% promotores − % detractores", unit: "pts", unitId: "un-pts", direction: "up", laeId: "l-4", allowedScopeTypeIds: ["st-nac", "st-reg"] },
  { id: "e-ebitda", type: "kpi", name: "Margen EBITDA", formula: "EBITDA / Venta neta", unit: "%", unitId: "un-pct", direction: "up", laeId: "l-2", allowedScopeTypeIds: ["st-nac", "st-bu"] },
  { id: "e-wms", type: "project", name: "Implementación WMS", formula: "Hitos completados / Hitos plan", unit: "% avance", unitId: "un-adv", direction: "up", laeId: "l-3", allowedScopeTypeIds: ["st-plant", "st-cedis"] },
  { id: "e-portal", type: "project", name: "Portal de clientes", formula: "Hitos completados / Hitos plan", unit: "% avance", unitId: "un-adv", direction: "up", laeId: "l-3", allowedScopeTypeIds: ["st-nac"] },
];

export const elementScopes: ElementScope[] = [
  { id: "es-otif-norte", elementId: "e-otif", scopeId: "s-norte", ownerUserId: "u-mt" },
  { id: "es-otif-sal", elementId: "e-otif", scopeId: "s-cd-sal", ownerUserId: "u-dp" },
  { id: "es-otif-nac", elementId: "e-otif", scopeId: "s-nac", ownerUserId: "u-js" },
  { id: "es-costlog-con", elementId: "e-costlog", scopeId: "s-bu-con", ownerUserId: "u-lr" },
  { id: "es-newacc-nac", elementId: "e-newacc", scopeId: "s-nac", ownerUserId: "u-ag" },
  { id: "es-rot-norte", elementId: "e-rot", scopeId: "s-norte", ownerUserId: "u-mt" },
  { id: "es-rot-nac", elementId: "e-rot", scopeId: "s-nac", ownerUserId: "u-km" },
  { id: "es-nps-nac", elementId: "e-nps", scopeId: "s-nac", ownerUserId: "u-ag" },
  { id: "es-ebitda-nac", elementId: "e-ebitda", scopeId: "s-nac", ownerUserId: "u-ceo" },
  { id: "es-wms-mty", elementId: "e-wms", scopeId: "s-pl-mty", ownerUserId: "u-mt" },
  { id: "es-portal-nac", elementId: "e-portal", scopeId: "s-nac", ownerUserId: "u-rv" },
];

const ts = (d: string) => new Date(d).toISOString();

export const scorecards: Scorecard[] = [
  {
    id: "sc-mt", userId: "u-mt", year: YEAR, status: "approved", approverId: "u-js",
    history: [
      { at: ts("2026-01-12T10:00:00"), by: "u-mt", action: "draft" },
      { at: ts("2026-01-14T17:20:00"), by: "u-mt", action: "submitted" },
      { at: ts("2026-01-15T09:05:00"), by: "u-js", action: "changes_requested", note: "Sube el peso de OTIF a 25% y baja rotación a 15%." },
      { at: ts("2026-01-15T11:40:00"), by: "u-mt", action: "submitted" },
      { at: ts("2026-01-16T08:30:00"), by: "u-js", action: "approved" },
    ],
  },
  { id: "sc-lr", userId: "u-lr", year: YEAR, status: "approved", approverId: "u-js", history: [{ at: ts("2026-01-18T10:00:00"), by: "u-js", action: "approved" }] },
  { id: "sc-dp", userId: "u-dp", year: YEAR, status: "approved", approverId: "u-mt", history: [{ at: ts("2026-01-20T10:00:00"), by: "u-mt", action: "approved" }] },
  { id: "sc-km", userId: "u-km", year: YEAR, status: "submitted", approverId: "u-mt", history: [{ at: ts("2026-09-02T10:00:00"), by: "u-km", action: "submitted" }] },
  { id: "sc-rv", userId: "u-rv", year: YEAR, status: "draft", approverId: "u-js", history: [{ at: ts("2026-09-10T10:00:00"), by: "u-rv", action: "draft" }] },
  { id: "sc-js", userId: "u-js", year: YEAR, status: "approved", approverId: "u-ceo", history: [{ at: ts("2026-01-10T10:00:00"), by: "u-ceo", action: "approved" }] },
  { id: "sc-ag", userId: "u-ag", year: YEAR, status: "approved", approverId: "u-ceo", history: [{ at: ts("2026-01-10T10:00:00"), by: "u-ceo", action: "approved" }] },
];

export const scorecardItems: ScorecardItem[] = [
  // Mariana Torres · el scorecard del brochure
  { id: "i-mt-1", scorecardId: "sc-mt", elementScopeId: "es-otif-norte", responsibility: "owner", weight: 25, targets: { min: 92, sat: 95, out: 98 }, period: "monthly" },
  { id: "i-mt-2", scorecardId: "sc-mt", elementScopeId: "es-costlog-con", responsibility: "contributor", weight: 20, targets: { min: 6.2, sat: 5.8, out: 5.4 }, period: "monthly" },
  { id: "i-mt-3", scorecardId: "sc-mt", elementScopeId: "es-newacc-nac", responsibility: "contributor", weight: 20, targets: { min: 4_000_000, sat: 4_500_000, out: 5_200_000 }, period: "monthly" },
  { id: "i-mt-4", scorecardId: "sc-mt", elementScopeId: "es-wms-mty", responsibility: "owner", weight: 20, monthlyWeights: { 11: 25, 12: 25 }, targets: { min: 80, sat: 90, out: 100 }, period: "monthly" },
  { id: "i-mt-5", scorecardId: "sc-mt", elementScopeId: "es-rot-norte", responsibility: "owner", weight: 15, monthlyWeights: { 11: 10, 12: 10 }, targets: { min: 4, sat: 3.5, out: 3 }, period: "monthly" },
  // Luis Ramírez
  { id: "i-lr-1", scorecardId: "sc-lr", elementScopeId: "es-costlog-con", responsibility: "owner", weight: 50, targets: { min: 6.2, sat: 5.8, out: 5.4 }, period: "monthly" },
  { id: "i-lr-2", scorecardId: "sc-lr", elementScopeId: "es-otif-norte", responsibility: "contributor", weight: 30, targets: { min: 92, sat: 95, out: 98 }, period: "monthly" },
  { id: "i-lr-3", scorecardId: "sc-lr", elementScopeId: "es-wms-mty", responsibility: "contributor", weight: 20, targets: { min: 80, sat: 90, out: 100 }, period: "monthly" },
  // Diego Pérez
  { id: "i-dp-1", scorecardId: "sc-dp", elementScopeId: "es-otif-sal", responsibility: "owner", weight: 60, targets: { min: 92, sat: 95, out: 98 }, period: "monthly" },
  { id: "i-dp-2", scorecardId: "sc-dp", elementScopeId: "es-otif-norte", responsibility: "contributor", weight: 20, targets: { min: 92, sat: 95, out: 98 }, period: "monthly" },
  { id: "i-dp-3", scorecardId: "sc-dp", elementScopeId: "es-rot-norte", responsibility: "contributor", weight: 20, targets: { min: 4, sat: 3.5, out: 3 }, period: "monthly" },
  // Karla Mendoza (enviado)
  { id: "i-km-1", scorecardId: "sc-km", elementScopeId: "es-rot-nac", responsibility: "owner", weight: 60, targets: { min: 4.5, sat: 4, out: 3.5 }, period: "monthly" },
  { id: "i-km-2", scorecardId: "sc-km", elementScopeId: "es-rot-norte", responsibility: "contributor", weight: 40, targets: { min: 4, sat: 3.5, out: 3 }, period: "monthly" },
  // Raúl (borrador, no suma 100 a propósito)
  { id: "i-rv-1", scorecardId: "sc-rv", elementScopeId: "es-portal-nac", responsibility: "owner", weight: 60, targets: { min: 75, sat: 85, out: 100 }, period: "monthly" },
  { id: "i-rv-2", scorecardId: "sc-rv", elementScopeId: "es-wms-mty", responsibility: "contributor", weight: 30, targets: { min: 80, sat: 90, out: 100 }, period: "monthly" },
  // Jorge Salinas
  { id: "i-js-1", scorecardId: "sc-js", elementScopeId: "es-otif-nac", responsibility: "owner", weight: 40, targets: { min: 92, sat: 95, out: 98 }, period: "monthly" },
  { id: "i-js-2", scorecardId: "sc-js", elementScopeId: "es-costlog-con", responsibility: "contributor", weight: 30, targets: { min: 6.2, sat: 5.8, out: 5.4 }, period: "monthly" },
  { id: "i-js-3", scorecardId: "sc-js", elementScopeId: "es-ebitda-nac", responsibility: "contributor", weight: 30, targets: { min: 14, sat: 15, out: 16.5 }, period: "monthly" },
  // Ana Garza
  { id: "i-ag-1", scorecardId: "sc-ag", elementScopeId: "es-newacc-nac", responsibility: "owner", weight: 50, targets: { min: 4_000_000, sat: 4_500_000, out: 5_200_000 }, period: "monthly" },
  { id: "i-ag-2", scorecardId: "sc-ag", elementScopeId: "es-nps-nac", responsibility: "owner", weight: 30, targets: { min: 40, sat: 50, out: 60 }, period: "quarterly" },
  { id: "i-ag-3", scorecardId: "sc-ag", elementScopeId: "es-ebitda-nac", responsibility: "contributor", weight: 20, targets: { min: 14, sat: 15, out: 16.5 }, period: "monthly" },
];

function series(esId: string, values: (number | null)[], by: string, logs: Record<number, string> = {}): Result[] {
  return values.map((v, i) => ({
    id: `${esId}-${i + 1}`, elementScopeId: esId, year: YEAR, month: i + 1, value: v, loadedBy: by,
    loadedAt: v === null ? undefined : ts(`2026-${String(i + 2).padStart(2, "0")}-03T12:00:00`), log: logs[i + 1],
  }));
}

export const results: Result[] = [
  ...series("es-otif-norte", [93.2, 94.1, 94.8, 95.5, 95.0, 96.3, 95.8, 95.1, 96.1, null, null, null], "u-mt", { 9: "Mejoró el ruteo de la semana 3; pendiente cliente Ramos por horario de recibo." }),
  ...series("es-otif-sal", [91.0, 92.5, 93.8, 94.2, 95.6, 96.0, 95.2, 94.0, 93.4, null, null, null], "u-dp", { 9: "Dos unidades en taller la semana 2; reemplazo el viernes." }),
  ...series("es-otif-nac", [92.8, 93.5, 94.2, 94.9, 95.1, 95.7, 95.4, 94.9, 95.3, null, null, null], "u-js"),
  ...series("es-costlog-con", [6.4, 6.3, 6.1, 6.0, 5.9, 5.8, 5.9, 6.0, 5.9, null, null, null], "u-lr", { 9: "Tarifa de flete subió 4%; compensamos con consolidación de rutas." }),
  ...series("es-newacc-nac", [3.6e6, 3.9e6, 4.2e6, 4.4e6, 4.6e6, 4.8e6, 4.5e6, 4.7e6, 4.9e6, null, null, null], "u-ag"),
  ...series("es-rot-norte", [4.2, 3.9, 3.8, 3.6, 3.4, 3.2, 3.1, 3.0, 2.9, null, null, null], "u-mt", { 9: "Programa de bono por permanencia funcionando en Saltillo." }),
  ...series("es-rot-nac", [4.8, 4.6, 4.5, 4.3, 4.2, 4.1, 4.0, 4.1, null, null, null, null], "u-km"),
  ...series("es-nps-nac", [null, null, 44, null, null, 49, null, null, 52, null, null, null], "u-ag"),
  ...series("es-ebitda-nac", [13.8, 14.1, 14.5, 14.9, 15.0, 15.3, 15.1, 15.2, 15.4, null, null, null], "u-ceo"),
  ...series("es-wms-mty", [10, 18, 27, 38, 47, 55, 62, 68, 72, null, null, null], "u-mt", { 9: "Se retrasa por integración con el ERP. Pido apoyo de TI para liberar la interfaz antes del 10 de octubre." }),
  ...series("es-portal-nac", [15, 25, 40, 52, 63, 71, 78, 84, 88, null, null, null], "u-rv"),
];

export const invitations: Invitation[] = [
  { id: "inv-1", email: "sofia.trevino@grupoandes.demo", role: "collaborator", managerId: "u-ag", title: "Gerente de Ventas · Región Norte", status: "pending", createdAt: ts("2026-09-20T10:00:00") },
  { id: "inv-2", email: "hector.lozano@grupoandes.demo", role: "collaborator", managerId: "u-lr", title: "Jefe de Transporte", status: "accepted", createdAt: ts("2026-08-12T16:30:00") },
];

export const demoData = { tenant, units, users, objectives, laes, scopeTypes, scopes, elements, elementScopes, scorecards, scorecardItems, results, invitations };
export type DemoData = typeof demoData;
