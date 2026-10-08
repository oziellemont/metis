/**
 * Sesiones y compromisos de ejemplo (Grupo Andes) · relativos a la fecha de hoy para que la demo
 * siempre se vea «viva»: hubo WTW el lunes, hay pendientes vencidos y la próxima WTW es el lunes que viene.
 */
import type { Commitment, Session } from "../domain/types";
import { isoDate, mondayOf, suggestDate } from "./logic";

const DAY = 86_400_000;
const at = (base: Date, days: number, hour = 9) => { const d = new Date(base.getTime() + days * DAY); d.setHours(hour, 0, 0, 0); return d; };

function firstBusinessDay(y: number, m: number, hour: number) {
  const d = new Date(y, m, 1, hour);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

export function demoSessions(now: Date = new Date()): Session[] {
  const M = mondayOf(now);
  let wtm = firstBusinessDay(now.getFullYear(), now.getMonth(), 11);
  if (wtm > now) wtm = firstBusinessDay(now.getFullYear(), now.getMonth() - 1, 11);
  const closedMonth = new Date(wtm.getFullYear(), wtm.getMonth() - 1, 1);
  return [
    { id: "ses-mt-1", kind: "wtw", leaderId: "u-mt", scheduledAt: at(M, -14).toISOString(), status: "closed", location: "Sala Saltillo + Teams", createdBy: "u-mt", closedAt: at(M, -14, 10).toISOString(),
      summary: "Semana estable. OTIF arriba de meta en Monterrey; Saltillo con presión por unidades en taller." },
    { id: "ses-mt-2", kind: "wtw", leaderId: "u-mt", scheduledAt: at(M, -7).toISOString(), status: "closed", location: "Teams", createdBy: "u-mt", closedAt: at(M, -7, 10).toISOString(),
      summary: "Se cerró el plan de ruteo zona sur. Quedó pendiente la capacitación de seguridad del turno nocturno." },
    { id: "ses-mt-wtm", kind: "wtm", leaderId: "u-mt", scheduledAt: wtm.toISOString(), status: "closed", location: "Sala de Dirección Norte", createdBy: "u-mt", closedAt: new Date(wtm.getTime() + 2 * 3600_000).toISOString(),
      periodYear: closedMonth.getFullYear(), periodMonth: closedMonth.getMonth() + 1,
      summary: "Cerramos el mes con OTIF en verde y rotación a la baja. El WMS sigue en rojo por la integración con el ERP.",
      focus: ["Recuperar OTIF de Saltillo arriba de 95%", "Liberar la interfaz WMS–ERP antes del día 10", "Mantener la rotación por debajo de 3%"] },
    { id: "ses-mt-3", kind: "wtw", leaderId: "u-mt", scheduledAt: at(M, 0).toISOString(), status: "closed", location: "Sala Saltillo + Teams", createdBy: "u-mt", closedAt: at(M, 0, 10).toISOString(),
      summary: "Diego trae 2 unidades en taller; se acordó renta temporal. Karla presenta el bono de permanencia a Dirección. Mariana escala con TI la interfaz del WMS." },
    { id: "ses-mt-4", kind: "wtw", leaderId: "u-mt", scheduledAt: suggestDate("wtw", now).toISOString(), status: "scheduled", location: "Sala Saltillo + Teams", createdBy: "u-mt" },
    { id: "ses-mt-5", kind: "wtm", leaderId: "u-mt", scheduledAt: suggestDate("wtm", now, 11).toISOString(), status: "scheduled", location: "Sala de Dirección Norte", createdBy: "u-mt" },
    { id: "ses-js-1", kind: "wtw", leaderId: "u-js", scheduledAt: at(M, 0, 11).toISOString(), status: "closed", location: "Google Meet", createdBy: "u-js", closedAt: at(M, 0, 12).toISOString(),
      summary: "Operaciones: OTIF nacional en verde. Riesgo en costo logístico por tarifa de flete." },
    { id: "ses-js-2", kind: "wtw", leaderId: "u-js", scheduledAt: suggestDate("wtw", now, 11).toISOString(), status: "scheduled", location: "Google Meet", createdBy: "u-js" },
  ];
}

export function demoCommitments(now: Date = new Date()): Commitment[] {
  const M = mondayOf(now);
  const d = (days: number) => isoDate(new Date(M.getTime() + days * DAY));
  const t = (days: number, hour = 12) => at(M, days, hour).toISOString();
  const base = { approved: true, kind: "commitment" as const };
  return [
    // WTW hace dos semanas
    { ...base, id: "cm-1", sessionId: "ses-mt-1", ownerId: "u-km", title: "Entrevistas de salida a las 5 bajas de septiembre", dueDate: d(-10), status: "done", doneAt: t(-10), createdBy: "u-mt", createdAt: t(-14, 10) },
    { ...base, id: "cm-2", sessionId: "ses-mt-1", ownerId: "u-dp", title: "Inventario cíclico del CEDIS Saltillo", dueDate: d(-10), status: "done", doneAt: t(-11), createdBy: "u-mt", createdAt: t(-14, 10) },
    // WTW de la semana pasada
    { ...base, id: "cm-3", sessionId: "ses-mt-2", ownerId: "u-dp", title: "Cerrar el plan de ruteo de la zona sur", dueDate: d(-3), status: "done", doneAt: t(-3), elementScopeId: "es-otif-sal", createdBy: "u-mt", createdAt: t(-7, 10) },
    { ...base, id: "cm-4", sessionId: "ses-mt-2", ownerId: "u-dp", title: "Capacitación de seguridad al turno nocturno", dueDate: d(-3), status: "missed", doneAt: t(-3, 18), note: "Se movió por falta de instructor certificado.", createdBy: "u-mt", createdAt: t(-7, 10) },
    { ...base, id: "cm-5", sessionId: "ses-mt-2", ownerId: "u-km", title: "Actualizar el tablero de rotación con los datos del mes", dueDate: d(-3), status: "open", elementScopeId: "es-rot-norte", createdBy: "u-mt", createdAt: t(-7, 10) },
    // WTW de este lunes
    { ...base, id: "cm-6", sessionId: "ses-mt-3", ownerId: "u-dp", title: "Rentar 2 unidades mientras salen las del taller", dueDate: d(4), status: "open", elementScopeId: "es-otif-sal", createdBy: "u-mt", createdAt: t(0, 10) },
    { ...base, id: "cm-7", sessionId: "ses-mt-3", ownerId: "u-dp", title: "Acordar con el cliente Ramos una nueva ventana de recibo", dueDate: d(2), status: "done", doneAt: t(2), createdBy: "u-mt", createdAt: t(0, 10) },
    { ...base, id: "cm-8", sessionId: "ses-mt-3", ownerId: "u-km", title: "Presentar resultados del bono de permanencia a Dirección", dueDate: d(3), status: "open", createdBy: "u-mt", createdAt: t(0, 10) },
    { ...base, id: "cm-9", sessionId: "ses-mt-3", ownerId: "u-mt", title: "Escalar con TI la interfaz WMS–ERP", dueDate: d(1), status: "done", doneAt: t(1), elementScopeId: "es-wms-mty", createdBy: "u-mt", createdAt: t(0, 10) },
    { ...base, id: "cm-10", kind: "support", sessionId: "ses-mt-3", ownerId: "u-mt", requestedBy: "u-km", title: "Autorizar 2 vacantes de montacarguista para Saltillo", dueDate: d(4), status: "open", approved: true, createdBy: "u-mt", createdAt: t(0, 10) },
    // WTW de Jorge (Mariana es parte de su equipo)
    { ...base, id: "cm-11", sessionId: "ses-js-1", ownerId: "u-mt", title: "Enviar plan de recuperación de OTIF Saltillo", dueDate: d(4), status: "open", elementScopeId: "es-otif-norte", createdBy: "u-js", createdAt: t(0, 12) },
    { ...base, id: "cm-12", kind: "support", sessionId: "ses-js-1", ownerId: "u-rv", requestedBy: "u-mt", title: "Asignar un desarrollador a la interfaz del WMS", dueDate: d(3), status: "open", createdBy: "u-js", createdAt: t(0, 12) },
    { ...base, id: "cm-13", sessionId: "ses-js-1", ownerId: "u-lr", title: "Cotizar 2 transportistas alternos", dueDate: d(4), status: "open", elementScopeId: "es-costlog-con", createdBy: "u-js", createdAt: t(0, 12) },
  ];
}
