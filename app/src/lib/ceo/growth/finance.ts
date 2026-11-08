/**
 * mêtis CEO · Growth Engine · liquidez: consecuencias de los atrasos y decisiones financieras (fase 2).
 *
 * Principios (decisión de Oziel, fase 2):
 *  - Un déficit de caja no es «caja negativa»: es un conjunto de obligaciones vencidas con acreedores concretos.
 *  - No hay préstamo automático ni fin de partida arbitrario: la crisis abre decisiones de gestión reales.
 *  - Cada salida tiene condiciones, costo y consecuencias; el banco, los proveedores o el dueño pueden decir que no.
 *  - Aceptar o rechazar es determinista (semilla + decisión + estado). Las cifras las calcula el motor, nunca la IA.
 *
 * Supuestos de simulación (no son datos de mercado) declarados en FIN_PARAMS con su base.
 */
import { CREDITOR_LABEL, MONTH, cashMove, clamp, debtTotal, hash01, monthOf, oldestOverdueDays, overdueTotal, pay, post, schedule } from "./core";
import { laborOf } from "./labor";
import { TEMPLATES } from "./families";
import type { Command, GrowthState, Loan } from "./types";

export interface ApplyResult { ok: boolean; reason?: string; refused?: boolean }

export const FIN_PARAMS = Object.freeze({
  /** Pago mensual máximo de deuda como fracción del EBITDA mensual promedio (cobertura mínima 1.6×). */
  maxDebtService: { value: 0.6, basis: "Supuesto: los bancos piden cobertura del servicio de deuda de 1.5–2.0× para crédito PyME." },
  openingFee: { value: 0.02, basis: "Supuesto: comisión de apertura de 2 % del monto." },
  loanDisburseDays: { value: 10, basis: "Supuesto: análisis y dispersión en unos 10 días hábiles." },
  loanMinHistoryMonths: { value: 2, basis: "Supuesto: el banco pide al menos dos meses de estados financieros bajo tu gestión (o los históricos de la empresa)." },
  supplierPriceUpPer15: { value: 0.012, basis: "Supuesto: el proveedor sube 1.2 % el precio por cada 15 días adicionales de crédito mientras dure el convenio." },
  supplierDealDays: { value: 90, basis: "Supuesto: el convenio de plazo dura 90 días." },
  factorRate: { value: 0.22, basis: "Supuesto: tasa anual de factoraje para clientes medianos + 1 % de comisión." },
  factorFee: { value: 0.01, basis: "Supuesto: comisión de 1 % por operación de factoraje." },
  collectShare: { value: 0.35, basis: "Supuesto: una gestión de cobranza logra adelantar alrededor de un tercio de lo que vence en más de 15 días." },
  ownerArriveDays: { value: 5, basis: "Supuesto: la aportación del dueño llega en unos 5 días tras la sesión de consejo." },
  deferPenalty: { value: 0.03, basis: "Supuesto: el contratista cobra 3 % de lo pendiente por suspender la obra." },
  cancelRentMonths: { value: 2, basis: "Supuesto: penalidad de dos meses de renta por rescindir el contrato del local, más el depósito." },
  rentLateRate: { value: 0.03, basis: "Supuesto: moratorios de 3 % mensual sobre la renta vencida (cláusula común en contratos de arrendamiento)." },
  cutShare: { value: 0.5, basis: "Supuesto: el recorte reduce la línea a la mitad desde el mes siguiente." },
});

/** Líneas fijas que se pueden recortar y la consecuencia diferida de cada una. La dirección y los seguros no se recortan aquí. */
export const CUTTABLE: Readonly<Record<string, string>> = Object.freeze({
  marketing: "Menos publicidad: la demanda se enfría poco a poco (hasta −8 % en tres meses).",
  mantenimiento: "Menos mantenimiento: a partir del segundo mes aumentan las fallas y baja la capacidad útil.",
  sistemas: "Menos sistemas: se pierden reportes e inventarios; el control se vuelve manual.",
  seguridad: "Menos seguridad industrial: sube el riesgo de accidentes e incidentes.",
});

// ───────────────────────────────────────────────── consecuencias diarias de los adeudos
/** Se llama una vez por día simulado, después de operar. Aplica recargos, moratorios y reacciones de cada acreedor. */
export function dailyConsequences(s: GrowthState) {
  const L = laborOf(s.laborVersion);
  const R = s.relations;
  const fisco = overdueTotal(s, "fisco"), rent = overdueTotal(s, "arrendador"), sup = overdueTotal(s, "proveedores"), staff = overdueTotal(s, "personal"), bank = overdueTotal(s, "banco");
  // Fisco: recargos por mora (mensual, prorrateado por día) que se suman al adeudo.
  if (fisco) {
    const r = Math.round((fisco * L.lateRate.value) / MONTH);
    post(s, "devengo", "recargos", -r, "Recargos por cuotas y nómina estatal pagadas tarde");
    addOverdue(s, "recargos", "fisco", r, "Recargos por pago extemporáneo");
    if (oldestOverdueDays(s, "fisco") === 45) s.events.push({ day: s.day, kind: "vencido", text: "El IMSS emite un requerimiento de pago. Si no se regulariza, puede embargar cuentas y la opinión de cumplimiento sale negativa (el banco la pide)." });
  }
  // Arrendador: moratorios y, tras 60 días, aviso de rescisión.
  if (rent) {
    const r = Math.round((rent * FIN_PARAMS.rentLateRate.value) / MONTH);
    post(s, "devengo", "moratorios", -r, "Intereses moratorios de renta");
    addOverdue(s, "moratorios", "arrendador", r, "Moratorios de renta");
    R.landlord = clamp(R.landlord - 0.004, 0, 1);
    if (oldestOverdueDays(s, "arrendador") === 60) s.events.push({ day: s.day, kind: "vencido", text: "El arrendador envía aviso de rescisión por rentas vencidas. Hay que negociar un calendario o regularizar." });
  }
  // Proveedores: al primer atraso pasan a «solo de contado»; con más de 15 días de atraso suspenden el surtido.
  const T = s.supplierTerms;
  if (sup) {
    if (!T.cashOnly) { T.cashOnly = true; s.events.push({ day: s.day, kind: "proveedor", text: "Los proveedores cambian a pago de contado mientras haya saldo vencido: la caja pierde el plazo que financiaba la operación." }); }
    T.cashOnlyUntil = s.day + 60;
    R.suppliers = clamp(R.suppliers - 0.004, 0, 1);
    const wasSusp = T.suspended;
    T.suspended = oldestOverdueDays(s, "proveedores") > 15;
    if (T.suspended && !wasSusp) s.events.push({ day: s.day, kind: "proveedor", text: "Un proveedor clave suspende el surtido por adeudo de más de 15 días: la operación trabaja con faltantes." });
  } else {
    T.suspended = false;
    if (T.cashOnly && s.day >= T.cashOnlyUntil) { T.cashOnly = false; s.events.push({ day: s.day, kind: "proveedor", text: "Tras dos meses al corriente, los proveedores restablecen el crédito." }); }
    R.suppliers = clamp(R.suppliers + 0.001, 0, 1);
  }
  if (T.extraDays && s.day >= T.extraUntil) { T.extraDays = 0; T.priceUp = 0; }
  // Personal: sueldos atrasados golpean la confianza y la rotación (la rotación la lee el motor desde relations.staff).
  if (staff) {
    R.staff = clamp(R.staff - 0.02, 0, 1);
    if (oldestOverdueDays(s, "personal") === 3) s.events.push({ day: s.day, kind: "vencido", text: "La quincena no se pagó completa. El equipo lo sabe; si se repite, las renuncias se aceleran y puede haber demandas laborales." });
  } else R.staff = clamp(R.staff + 0.002, 0, 1);
  if (bank) { R.bank = clamp(R.bank - 0.01, 0, 1); post(s, "devengo", "intereses", -Math.round((bank * 0.5) / 12 / MONTH), "Intereses moratorios del crédito"); }
  else if (!fisco) R.bank = clamp(R.bank + 0.0005, 0, 1);
  if (!rent) R.landlord = clamp(R.landlord + 0.001, 0, 1);
  // Recortes con efectos diferidos.
  for (const [id, day] of Object.entries(s.cuts)) {
    const age = s.day - day;
    if (id === "marketing" && age > 0) for (const site of s.sites) site.demandFactor = Math.max(site.demandFactor * (1 - 0.0009), 0.4);
    if (id === "marketing" && age === 90) delete s.cuts[id];
  }
}

function addOverdue(s: GrowthState, account: string, creditor: GrowthState["overdue"][number]["creditor"], amount: number, text: string) {
  if (!amount) return;
  const hit = s.overdue.find((o) => o.account === account);
  if (hit) hit.amount += amount; else s.overdue.push({ id: `o${s.nextId++}`, account, creditor, amount, since: s.day, text });
}

/** Multiplicador de rotación por clima laboral (sueldos atrasados): 1 normal, hasta 5 con la confianza rota. */
export const attritionMultiplier = (s: GrowthState) => 1 + 4 * (1 - s.relations.staff) + (overdueTotal(s, "personal") ? 2 : 0);
/** Multiplicador de capacidad por faltantes de proveedor, fallas por recorte de mantenimiento y desmotivación. */
export function capacityFactor(s: GrowthState): number {
  let k = 1;
  if (s.supplierTerms.suspended) k *= 0.6;
  if (s.cuts.mantenimiento !== undefined && s.day - s.cuts.mantenimiento > 60) k *= 0.93;
  if (overdueTotal(s, "personal")) k *= 0.9;
  return k;
}

// ───────────────────────────────────────────────── pagos del crédito
export function serviceLoans(s: GrowthState) {
  for (const l of s.loans) {
    if (l.balance <= 0 || s.day <= l.startDay || (s.day - l.startDay) % MONTH !== 0) continue;
    const interest = Math.round((l.balance * l.rate) / 12);
    const principal = Math.min(l.balance, l.payment - interest);
    post(s, "devengo", "intereses", -interest, `Intereses del crédito con ${l.lender}`, l.id);
    pay(s, "prestamo", interest + principal, `Pago mensual del crédito con ${l.lender}`, l.id);
    l.balance -= principal;
  }
}

// ───────────────────────────────────────────────── cotizaciones (lo que cada salida ofrece HOY, calculado por el motor)
export interface Quote { available: boolean; reason?: string; amount: number; cost: number; arrivesInDays: number; detail: string }

const avgEbitda = (s: GrowthState, n = 3) => {
  const xs = s.months.slice(-n);
  return xs.length ? xs.reduce((a, m) => a + m.ebitda, 0) / xs.length : 0;
};
const annuity = (P: number, rate: number, n: number) => { const r = rate / 12; return Math.round((P * r) / (1 - Math.pow(1 + r, -n))); };
const tpl = (s: GrowthState) => TEMPLATES[s.templateId];

export function quoteLoan(s: GrowthState, months = 12): Quote {
  const rate = tpl(s).bankRate;
  const e = avgEbitda(s);
  const existing = s.loans.reduce((a, l) => a + (l.balance > 0 ? l.payment : 0), 0);
  const room = Math.max(0, e * FIN_PARAMS.maxDebtService.value - existing);
  const r = rate / 12;
  const amount = Math.floor((room * (1 - Math.pow(1 + r, -months))) / r / 1000_00) * 1000_00;
  const no = (reason: string): Quote => ({ available: false, reason, amount: 0, cost: 0, arrivesInDays: 0, detail: "" });
  if (s.months.length < FIN_PARAMS.loanMinHistoryMonths.value) return no("El banco pide al menos dos meses de estados financieros bajo tu gestión.");
  if (oldestOverdueDays(s, "fisco") > 30) return no("Con cuotas del IMSS vencidas por más de un mes, la opinión de cumplimiento sale negativa y el banco no puede prestar.");
  if (s.relations.bank < 0.5) return no("El historial reciente de pagos con el banco impide un crédito nuevo.");
  if (e <= 0) return no("Con resultado operativo negativo en los últimos meses, la empresa no tiene capacidad de pago demostrable.");
  if (amount < 50_000_00) return no("La capacidad de pago alcanza para muy poco: el banco no abre una línea por ese monto.");
  const pmt = annuity(amount, rate, months);
  const cost = pmt * months - amount + Math.round(amount * FIN_PARAMS.openingFee.value);
  return { available: true, amount, cost, arrivesInDays: FIN_PARAMS.loanDisburseDays.value, detail: `Hasta $${fmt(amount)} a ${months} meses, tasa ${Math.round(rate * 100)} % anual: pago mensual de $${fmt(pmt)}. Comisión de apertura de ${FIN_PARAMS.openingFee.value * 100} %.` };
}

export function quoteSuppliers(s: GrowthState, extraDays = 15): Quote {
  const no = (reason: string): Quote => ({ available: false, reason, amount: 0, cost: 0, arrivesInDays: 0, detail: "" });
  if (oldestOverdueDays(s, "proveedores") > 30) return no("Con saldo vencido de más de 30 días, los proveedores no negocian plazo: primero piden ponerse al corriente.");
  if (s.relations.suppliers < 0.5) return no("La relación con los proveedores está demasiado desgastada para pedir más plazo.");
  if (s.supplierTerms.extraDays) return no("Ya hay un convenio de plazo vigente.");
  const window = s.scheduled.filter((x) => x.account === "proveedores" && x.day >= s.day && x.day < s.day + extraDays);
  const amount = -window.reduce((a, x) => a + x.amount, 0);
  const monthlyCogs = s.months.at(-1)?.cogs ?? 0;
  const cost = Math.round(((monthlyCogs * FIN_PARAMS.supplierDealDays.value) / MONTH) * FIN_PARAMS.supplierPriceUpPer15.value * (extraDays / 15));
  return { available: amount > 0, reason: amount > 0 ? undefined : "No hay pagos a proveedores próximos que recorrer.", amount, cost, arrivesInDays: 0, detail: `Recorrer ${extraDays} días los pagos a proveedores libera unos $${fmt(amount)} en las próximas semanas, a cambio de un sobreprecio de ${(FIN_PARAMS.supplierPriceUpPer15.value * (extraDays / 15) * 100).toFixed(1)} % durante ${FIN_PARAMS.supplierDealDays.value} días (≈ $${fmt(cost)}).` };
}

export function quoteCollect(s: GrowthState, mode: "cobranza" | "factoraje"): Quote {
  const no = (reason: string): Quote => ({ available: false, reason, amount: 0, cost: 0, arrivesInDays: 0, detail: "" });
  const rec = s.scheduled.filter((x) => x.account === "cobro" && x.amount > 0 && x.day > s.day);
  if (!rec.length) return no("La empresa cobra de contado: no hay cuentas por cobrar que adelantar.");
  if (mode === "cobranza") {
    const far = rec.filter((x) => x.day > s.day + 15);
    const amount = Math.round(far.reduce((a, x) => a + x.amount, 0) * FIN_PARAMS.collectShare.value);
    return { available: amount > 0, reason: amount > 0 ? undefined : "Lo que se debe vence pronto; no hay mucho que adelantar.", amount, cost: 0, arrivesInDays: 7, detail: `Una gestión de cobranza puede adelantar unos $${fmt(amount)} en una semana. No cuesta intereses, pero presiona la relación con los clientes.` };
  }
  if (s.relations.bank < 0.4) return no("La financiera revisa el buró de la empresa y no opera con atrasos bancarios.");
  const near = rec.filter((x) => x.day <= s.day + 60);
  const face = near.reduce((a, x) => a + x.amount, 0);
  const cost = Math.round(near.reduce((a, x) => a + x.amount * (FIN_PARAMS.factorRate.value * (x.day - s.day)) / 360, 0) + face * FIN_PARAMS.factorFee.value);
  return { available: face > 0, amount: face - cost, cost, arrivesInDays: 3, detail: `Ceder a una financiera las facturas que vencen en los próximos 60 días ($${fmt(face)}) trae $${fmt(face - cost)} en tres días; el descuento es de $${fmt(cost)}.` };
}

export function quoteOwner(s: GrowthState, amount: number): Quote {
  const cap = Math.max(0, tpl(s).ownerCapacity * 100 - s.equity);
  const no = (reason: string): Quote => ({ available: false, reason, amount: 0, cost: 0, arrivesInDays: 0, detail: "" });
  if (cap <= 0) return no("El dueño ya aportó lo que estaba dispuesto a poner.");
  if (s.relations.owner < 0.4) return no("La confianza del dueño en la gestión está demasiado baja para pedirle más dinero.");
  const x = Math.min(amount, cap);
  return { available: true, amount: x, cost: 0, arrivesInDays: FIN_PARAMS.ownerArriveDays.value, detail: `El dueño podría aportar hasta $${fmt(cap)}. No genera intereses, pero cada aportación se discute en consejo y pesa en su confianza.` };
}

export const fmt = (cents: number) => Math.round(cents / 100).toLocaleString("en-US");

// ───────────────────────────────────────────────── decisiones
const refuse = (s: GrowthState, cmd: Command, who: string, why: string): ApplyResult => {
  s.events.push({ day: s.day, kind: "rechazo", text: `${who} dice que no: ${why}`, ref: cmd.id });
  s.applied.push(cmd.id);
  return { ok: false, refused: true, reason: why };
};

/** Decisiones financieras. Devuelve null si el comando no es financiero. */
export function applyFinance(s: GrowthState, cmd: Command): ApplyResult | null {
  const R = s.relations;
  const roll = (k: string) => hash01(`${s.seed}|${cmd.id}|${k}`);
  switch (cmd.type) {
    case "bank_loan": {
      const q = quoteLoan(s, cmd.months);
      if (!q.available) return refuse(s, cmd, "El banco", q.reason!);
      const want = pesosC(cmd.amount);
      if (want > q.amount) return refuse(s, cmd, "El banco", `con el resultado actual la capacidad de pago alcanza para unos $${fmt(q.amount)}, no para $${fmt(want)}.`);
      // Comité de crédito: entre más cerca del límite, más probable el rechazo.
      const risk = 0.1 + 0.5 * (want / q.amount) + (s.overdue.length ? 0.15 : 0);
      if (roll("comite") < risk - 0.25) return refuse(s, cmd, "El comité de crédito", "considera que la empresa está demasiado apretada y pide volver en dos meses con mejores números.");
      const rate = tpl(s).bankRate;
      const loan: Loan = { id: `l${s.nextId++}`, lender: "Banco Regional del Norte", principal: want, balance: want, rate, months: cmd.months, payment: annuity(want, rate, cmd.months), startDay: s.day + FIN_PARAMS.loanDisburseDays.value, ref: cmd.id };
      s.loans.push(loan);
      schedule(s, loan.startDay, "prestamo", want, "Dispersión del crédito bancario", cmd.id);
      const fee = Math.round(want * FIN_PARAMS.openingFee.value);
      post(s, "devengo", "comisiones", -fee, "Comisión de apertura del crédito", cmd.id);
      schedule(s, loan.startDay, "comisiones", -fee, "Comisión de apertura del crédito", cmd.id);
      s.events.push({ day: s.day, kind: "decision_financiera", text: `El banco aprueba $${fmt(want)} a ${cmd.months} meses. El dinero llega en unos ${FIN_PARAMS.loanDisburseDays.value} días; el pago mensual será de $${fmt(loan.payment)}.`, ref: cmd.id });
      break;
    }
    case "negotiate_suppliers": {
      const q = quoteSuppliers(s, cmd.extraDays);
      if (!q.available) return refuse(s, cmd, "Los proveedores", q.reason!);
      if (roll("prov") < (cmd.extraDays > 15 ? 0.45 : 0.15) + (1 - R.suppliers) * 0.5) return refuse(s, cmd, "El proveedor principal", `acepta esperar, pero no ${cmd.extraDays} días: su propio flujo no se lo permite.`);
      for (const x of s.scheduled) if (x.account === "proveedores" && x.day >= s.day) x.day += cmd.extraDays;
      s.supplierTerms.extraDays = cmd.extraDays;
      s.supplierTerms.extraUntil = s.day + FIN_PARAMS.supplierDealDays.value;
      s.supplierTerms.priceUp = FIN_PARAMS.supplierPriceUpPer15.value * (cmd.extraDays / 15);
      R.suppliers = clamp(R.suppliers - 0.08, 0, 1);
      s.events.push({ day: s.day, kind: "decision_financiera", text: `Los proveedores aceptan ${cmd.extraDays} días más de plazo durante tres meses, con un sobreprecio de ${(s.supplierTerms.priceUp * 100).toFixed(1)} % en lo que se compre.`, ref: cmd.id });
      break;
    }
    case "collect_receivables": {
      const q = quoteCollect(s, cmd.mode);
      if (!q.available) return refuse(s, cmd, cmd.mode === "factoraje" ? "La financiera" : "Los clientes", q.reason!);
      if (cmd.mode === "cobranza") {
        let left = q.amount;
        const got = [...s.scheduled].filter((x) => x.account === "cobro" && x.day > s.day + 15).sort((a, b) => a.day - b.day);
        for (const x of got) { if (left <= 0) break; const take = Math.min(left, x.amount); x.amount -= take; left -= take; }
        s.scheduled = s.scheduled.filter((x) => x.amount !== 0);
        schedule(s, s.day + 7, "cobro", q.amount, "Cobranza adelantada", cmd.id);
        R.clients = clamp(R.clients - 0.06, 0, 1);
      } else {
        s.scheduled = s.scheduled.filter((x) => !(x.account === "cobro" && x.amount > 0 && x.day > s.day && x.day <= s.day + 60));
        schedule(s, s.day + 3, "cobro", q.amount, "Factoraje: anticipo de facturas", cmd.id);
        post(s, "devengo", "factoraje", -q.cost, "Descuento por factoraje", cmd.id);
      }
      s.events.push({ day: s.day, kind: "decision_financiera", text: cmd.mode === "cobranza" ? `Se adelanta cobranza por unos $${fmt(q.amount)}. Algún cliente lo resiente.` : `Se ceden facturas: entran $${fmt(q.amount)} en tres días con un costo de $${fmt(q.cost)}.`, ref: cmd.id });
      break;
    }
    case "owner_equity": {
      const q = quoteOwner(s, pesosC(cmd.amount));
      if (!q.available) return refuse(s, cmd, "El dueño", q.reason!);
      const asks = s.events.filter((e) => e.kind === "decision_financiera" && e.text.startsWith("El dueño aporta")).length;
      if (roll("dueno") < 0.15 + 0.3 * asks + (overdueTotal(s, "fisco") ? 0.15 : 0)) return refuse(s, cmd, "El dueño", "no quiere poner más dinero sin ver antes un plan de ajuste. Pide recortes y un calendario de recuperación.");
      s.equity += q.amount;
      schedule(s, s.day + q.arrivesInDays, "aportacion", q.amount, "Aportación de capital del dueño", cmd.id);
      R.owner = clamp(R.owner - 0.15 - (s.overdue.length ? 0.1 : 0), 0, 1);
      s.events.push({ day: s.day, kind: "decision_financiera", text: `El dueño aporta $${fmt(q.amount)}. Llega en unos ${q.arrivesInDays} días. En la próxima sesión querrá ver cómo se evita repetirlo.`, ref: cmd.id });
      break;
    }
    case "defer_site": {
      const site = s.sites.find((x) => x.id === cmd.siteId);
      if (!site || site.status !== "en_obra") return { ok: false, reason: "Solo se puede posponer una sucursal que sigue en obra." };
      const pend = -s.scheduled.filter((x) => x.ref === site.ref && x.amount < 0).reduce((a, x) => a + x.amount, 0);
      for (const x of s.scheduled) if (x.ref === site.ref) x.day += cmd.days;
      for (const v of s.vacancies) if (v.siteId === site.id) v.fillDay += cmd.days;
      for (const a of s.assets) if (a.ref === site.ref && !a.active) a.activeDay += cmd.days;
      site.buildDoneDay = (site.buildDoneDay ?? s.day) + cmd.days;
      const fee = Math.round(pend * FIN_PARAMS.deferPenalty.value);
      post(s, "devengo", "preapertura", -fee, `Penalidad por suspender la obra de ${site.name}`, site.ref);
      pay(s, "preapertura", fee, `Penalidad por suspender la obra de ${site.name}`, site.ref);
      s.events.push({ day: s.day, kind: "decision_financiera", text: `Se pospone ${cmd.days} días la obra de ${site.name}: se recorren $${fmt(pend)} de pagos. La renta del local sigue corriendo y el contratista cobra $${fmt(fee)} por la suspensión.`, siteId: site.id, ref: cmd.id });
      break;
    }
    case "cancel_site": {
      const site = s.sites.find((x) => x.id === cmd.siteId);
      if (!site || (site.status !== "en_obra" && site.status !== "preapertura")) return { ok: false, reason: "Solo se puede cancelar una sucursal que todavía no abre." };
      const penalty = site.rent * FIN_PARAMS.cancelRentMonths.value;
      s.scheduled = s.scheduled.filter((x) => x.ref !== site.ref);
      s.vacancies = s.vacancies.filter((v) => v.siteId !== site.id);
      const sunk = s.assets.filter((a) => a.ref === site.ref).reduce((a, x) => a + x.cost, 0);
      s.assets = s.assets.filter((a) => a.ref !== site.ref);
      site.status = "cerrada";
      post(s, "devengo", "perdida_inversion", -sunk, `Baja de la inversión en ${site.name}`, site.ref);
      post(s, "devengo", "preapertura", -penalty, `Penalidad por rescindir el local de ${site.name}`, site.ref);
      pay(s, "renta", penalty, `Penalidad por rescindir el local de ${site.name}`, site.ref);
      s.events.push({ day: s.day, kind: "decision_financiera", text: `Se cancela ${site.name}: se pierde el depósito y lo invertido en obra, y se pagan $${fmt(penalty)} de penalidad. Las personas ya contratadas para esa sucursal siguen en la plantilla.`, siteId: site.id, ref: cmd.id });
      break;
    }
    case "cut_costs": {
      const bad = cmd.lines.filter((id) => !CUTTABLE[id] || !s.fixedLines.some((f) => f.id === id));
      if (bad.length) return { ok: false, reason: bad.includes("direccion") ? "Tu sueldo lo fija el consejo; no se recorta como gasto operativo." : "Esa línea no existe o no se puede recortar." };
      let saved = 0;
      for (const id of cmd.lines) {
        const f = s.fixedLines.find((x) => x.id === id)!;
        const cut = Math.round(f.amount * FIN_PARAMS.cutShare.value);
        f.amount -= cut; saved += cut;
        s.cuts[id] = s.day;
      }
      s.events.push({ day: s.day, kind: "recorte", text: `Recorte de gastos: se ahorran $${fmt(saved)} al mes. ${cmd.lines.map((id) => CUTTABLE[id]).join(" ")}`, ref: cmd.id });
      break;
    }
    default:
      return null;
  }
  s.applied.push(cmd.id);
  return { ok: true };
}

const pesosC = (p: number) => Math.round(p * 100);
export { CREDITOR_LABEL, debtTotal, monthOf, cashMove };
