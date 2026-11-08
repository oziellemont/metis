/**
 * mêtis CEO · Growth Engine · núcleo contable compartido (libro, programación de pagos y obligaciones vencidas).
 *
 * Regla de liquidez (fase 2): la caja NUNCA queda negativa en silencio. Un pago que llega a su fecha se cubre con lo que
 * haya; lo que falta se convierte en una obligación vencida (`Overdue`) con su acreedor. Cada acreedor reacciona distinto
 * (personal, fisco, arrendador, proveedores, banco) y esas reacciones son las consecuencias que el director debe administrar.
 */
import type { Creditor, EntryType, GrowthState } from "./types";

export const MONTH = 30;
export function hash01(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h / 0x100000000;
}
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const monthOf = (day: number) => Math.floor(day / MONTH);
export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function post(s: GrowthState, type: EntryType, account: string, amount: number, text: string, ref?: string, day = s.day) {
  if (!amount) return;
  const month = monthOf(day);
  const hit = s.ledger.find((e) => e.type === type && e.account === account && e.month === month && e.ref === ref);
  if (hit) { hit.amount += amount; return; }
  s.ledger.push({ id: `e${s.nextId++}`, type, account, month, amount, ref, text });
}
/** Movimiento de caja directo. Solo para entradas o para salidas ya validadas contra el saldo. */
export const cashMove = (s: GrowthState, account: string, amount: number, text: string, ref?: string) => { s.cash += amount; post(s, "caja", account, amount, text, ref); };

export function schedule(s: GrowthState, day: number, account: string, amount: number, text: string, ref?: string) {
  if (!amount) return;
  const hit = s.scheduled.find((x) => x.day === day && x.account === account && x.ref === ref);
  if (hit) { hit.amount += amount; return; }
  s.scheduled.push({ id: `s${s.nextId++}`, day, account, amount, ref, text });
}

const CREDITOR: Record<string, Creditor> = {
  nomina: "personal", cobertura: "personal", finiquito: "personal", indemnizacion: "personal", aguinaldo: "personal",
  cuotas: "fisco", isn: "fisco", recargos: "fisco",
  renta: "arrendador", moratorios: "arrendador",
  proveedores: "proveedores", variables: "proveedores", servicios: "proveedores", preapertura: "proveedores", contratacion: "proveedores", compras: "proveedores", convenio: "proveedores",
  prestamo: "banco", comisiones: "banco",
};
export const creditorOf = (account: string): Creditor => CREDITOR[account] ?? "otros";
export const CREDITOR_LABEL: Record<Creditor, string> = {
  personal: "sueldos y prestaciones del personal", fisco: "cuotas del IMSS e impuesto sobre nómina", arrendador: "renta del local",
  proveedores: "proveedores", banco: "pagos del crédito bancario", otros: "gastos fijos de la empresa",
};
/** Orden en que se liquidan los adeudos cuando entra dinero: primero la gente, luego el fisco, luego el resto. */
export const PAY_PRIORITY: readonly Creditor[] = ["personal", "fisco", "banco", "arrendador", "proveedores", "otros"];

/**
 * Paga `amount` (centavos, positivo) con la caja disponible. Lo que no alcanza queda como obligación vencida.
 * Devuelve lo que sí se pagó.
 */
export function pay(s: GrowthState, account: string, amount: number, text: string, ref?: string): number {
  if (amount <= 0) return 0;
  const paid = Math.min(amount, Math.max(0, s.cash));
  if (paid) cashMove(s, account, -paid, text, ref);
  const left = amount - paid;
  if (left > 0) {
    const creditor = creditorOf(account);
    const hit = s.overdue.find((o) => o.account === account && o.since === s.day && o.ref === ref);
    if (hit) hit.amount += left;
    else s.overdue.push({ id: `o${s.nextId++}`, account, creditor, amount: left, since: s.day, text, ref });
  }
  return paid;
}

/** Liquida adeudos vencidos con la caja disponible, por prioridad y antigüedad. */
export function payDownOverdue(s: GrowthState) {
  if (s.cash <= 0 || !s.overdue.length) return;
  const order = [...s.overdue].sort((a, b) => PAY_PRIORITY.indexOf(a.creditor) - PAY_PRIORITY.indexOf(b.creditor) || a.since - b.since);
  for (const o of order) {
    if (s.cash <= 0) break;
    const x = Math.min(o.amount, s.cash);
    cashMove(s, o.account, -x, `Pago de adeudo vencido: ${o.text}`, o.ref);
    o.amount -= x;
  }
  s.overdue = s.overdue.filter((o) => o.amount > 0);
}

export const overdueTotal = (s: GrowthState, c?: Creditor) => s.overdue.filter((o) => !c || o.creditor === c).reduce((a, o) => a + o.amount, 0);
export const oldestOverdueDays = (s: GrowthState, c: Creditor) => {
  const xs = s.overdue.filter((o) => o.creditor === c);
  return xs.length ? s.day - Math.min(...xs.map((o) => o.since)) : 0;
};
export const debtTotal = (s: GrowthState) => s.loans.reduce((a, l) => a + l.balance, 0);
