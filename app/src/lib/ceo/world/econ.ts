/**
 * World Events · casos e impactos de datos económicos reales y medidas comerciales (tipo de cambio, tasa, aranceles).
 *
 * Mismas reglas que los casos de clima y sismo:
 *  - Solo con exposición (macro.ts · factsExposed). Sin moneda extranjera, sin deuda o sin producto afectado no llega caso.
 *  - Cada opción se traduce SOLO en comandos del motor. La IA no produce efectos.
 *  - El impacto externo llega MACRO_WINDOW días después de abrir el episodio (con las siguientes compras o pagos) y
 *    depende de lo decidido. Sin decisión, cuenta la opción de referencia («base»).
 *  - Hipótesis versionadas (ECON_RULES_VERSION):
 *      H1 · Consumibles importados: CONSUMABLES_USD de ferroaleaciones y refractarios se paga en dólares; el nuevo tipo
 *           de cambio se refleja en las compras de los siguientes FX_DAYS días.
 *      H2 · Tasa: la deuda fija no cambia. Una baja abre la OPORTUNIDAD de refinanciar: la nueva tasa fija baja lo mismo
 *           que la TIIE de fondeo, con comisión REFI_FEE del saldo.
 *      H3 · Arancel de importación mexicano a un producto que la empresa vende en México: el producto importado que
 *           compite cambia de precio; la demanda de la empresa se mueve TARIFF_ELASTICITY × cambio del arancel (con tope).
 */
import { cashOf as retailCash, type RetailCommand, type RetailState } from "../growth/retail/engine";
import type { RCase, ROption } from "../growth/retail/cases";
import { cashOf as steelCash, type SteelCommand, type SteelState } from "../growth/steel/engine";
import type { SCase, SOption } from "../growth/steel/cases";
import { caseIdOf, deadlineOf, exposedLinesOf } from "./episodes";
import { exposureOf } from "./exposure";
import { usIncidence, US_INEVITABLE_VOL, US_PASS, US_VOL_KEEP } from "./macro";
import type { Facts, WorldEpisode } from "./types";

export const ECON_RULES_VERSION = 2;
/** H4 · Arancel de EE. UU. a lo que la empresa exporta: días que dura el efecto en volumen y días para redirigir. */
export const US_DAYS = 120;
export const REDIRECT_DISCOUNT = 0.04;
export const CONSUMABLES_USD = 0.5;
export const FX_DAYS = 60;
export const REFI_FEE = 0.0075;
export const TARIFF_ELASTICITY = 0.2;
export const TARIFF_DAYS = 90;
/** Opciones defendibles (no se castigan después). «base» es la de referencia. */
export const ECON_REASONABLE = ["base", "nacional", "adelantar", "refinanciar", "refinanciar_largo", "contrato"] as const;

const mx = (p: number) => `$${Math.round(p).toLocaleString("en-US")}`;
const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)} %`;
const ok = { ok: true };
const fxCh = (f: Facts) => (f.from > 0 ? f.to / f.from - 1 : 0);
const dmy = (iso: string) => iso.split("-").reverse().join("/");
export const tariffDemand = (f: Facts) => Math.max(-0.08, Math.min(0.06, TARIFF_ELASTICITY * (f.to - f.from)));

function head(ep: WorldEpisode, s: { day: number }, templateId: string): string[] {
  const f = ep.facts!;
  const left = Math.max(0, deadlineOf(ep) - s.day);
  const what = f.t === "fx"
    ? `El tipo de cambio FIX que publica el Banco de México en el Diario Oficial pasó de ${f.from.toFixed(4)} pesos por dólar (${dmy(f.since)}) a ${f.to.toFixed(4)} (${dmy(f.until)}): ${fxCh(f) > 0 ? "el peso se debilitó" : "el peso se fortaleció"} ${pct(Math.abs(fxCh(f)))}.`
    : f.t === "tasa"
      ? `La TIIE de fondeo que publica el Banco de México en el Diario Oficial pasó de ${f.from.toFixed(2)} % (${dmy(f.since)}) a ${f.to.toFixed(2)} % (${dmy(f.until)}).`
      : `${ep.source.name} publicó: ${ep.name}. Arancel de ${pct(f.from, 0)} a ${pct(f.to, 0)}${f.effective ? `, vigente desde el ${dmy(f.effective)}` : ""}.`;
  const lines = exposedLinesOf(templateId, ep.kind, f.rule);
  return [
    ep.mode === "ejercicio" ? `Ejercicio hipotético: imagina este dato. ${what} No es un dato real.` : what,
    lines.length ? `Lo que toca de tu empresa: ${lines.join("; ")}.` : "",
    `Lo que pase en tu empresa es una simulación: depende de tus contratos y de lo que decidas. Plazo para decidir: ${left === 0 ? "hoy" : left === 1 ? "1 día" : `${left} días`}.`,
  ].filter(Boolean);
}
const sourceRow = (ep: WorldEpisode): [string, string] => ["Fuente", ep.source.name];

// ───────────────────────────────────────────────────────────── tasa (las dos plantillas con crédito)
interface LoanLike { ref: string; balance: number; rate: number; monthsLeft: number }
function rateParts(loans: readonly LoanLike[], f: Facts) {
  const loan = loans.find((l) => l.ref === "plantilla" && l.balance > 0);
  const drop = (f.from - f.to) / 100;
  const bal = loan ? loan.balance / 100 : 0;
  const newRate = loan ? Math.max(0.04, Math.round((loan.rate - drop) * 10_000) / 10_000) : 0;
  return { loan, drop, bal, newRate, fee: Math.round(bal * REFI_FEE), saving: Math.round((bal * drop) / 12) };
}
const rateLesson = "Una baja de tasas no cambia un crédito a tasa fija: lo que se decide es si conviene refinanciar. Se compara el ahorro mensual contra la comisión y el plazo; refinanciar por refinanciar no siempre paga.";

function rateOptions<S extends { loans: LoanLike[] }, C>(s: S, f: Facts, refi: (k: string, rate: number, months: number, fee: number) => C[]): { id: string; stance: "prudente" | "equilibrada" | "arriesgada"; label: string; detail: () => string; commands: (_s: S, k: string) => C[]; available?: () => { ok: boolean; reason?: string } }[] {
  const r = rateParts(s.loans, f);
  const months = r.loan?.monthsLeft ?? 0;
  const avail = () => (r.loan ? ok : { ok: false, reason: "No hay crédito que refinanciar." });
  return [
    { id: "base", stance: "equilibrada", label: "Mantener el crédito como está", detail: () => `Sin comisión. El crédito sigue a ${pct(r.loan?.rate ?? 0)} fijo; la baja no cambia tus pagos.`, commands: () => [] },
    { id: "refinanciar", stance: "prudente", label: `Refinanciar a ${pct(r.newRate)} fijo, mismo plazo`, detail: () => `Ahorro de cerca de ${mx(r.saving)} al mes en intereses; comisión de ${mx(r.fee)} (${pct(REFI_FEE, 2)} del saldo). El banco revisa tu historial.`, available: avail,
      commands: (_s, k) => refi(`${k}:refi`, r.newRate, months, r.fee) },
    { id: "refinanciar_largo", stance: "prudente", label: `Refinanciar a ${pct(r.newRate)} y alargar el plazo un año`, detail: () => `Baja el pago mensual (más intereses en total). Comisión de ${mx(r.fee)}. Libera caja si la operación la necesita.`, available: avail,
      commands: (_s, k) => refi(`${k}:refi`, r.newRate, months + 12, r.fee) },
  ];
}

// ───────────────────────────────────────────────────────────── cadena de conveniencia
export function econRetailCase(s: RetailState, ep: WorldEpisode): RCase {
  const f = ep.facts!;
  const base: Omit<RCase, "options"> = {
    id: caseIdOf(ep), area: "finanzas", from: "finanzas", minDay: 0,
    subject: f.t === "tasa" ? `Bajaron las tasas: ¿refinanciar el crédito de la cadena?` : `${ep.name}: decisión de finanzas`,
    body: () => head(ep, s, s.templateId),
    data: () => { const r = rateParts(s.loans, f); return [sourceRow(ep), ["Saldo del crédito", mx(r.bal)], ["Tasa actual", pct(r.loan?.rate ?? 0)], ["Caja", mx(retailCash(s) / 100)]]; },
    lesson: rateLesson,
    requires: () => ok,
  };
  // Solo la tasa tiene exposición en la cadena (compras y ventas en pesos, sin comercio exterior).
  const options = rateOptions<RetailState, RetailCommand>(s, f, (id, rate, months, fee) => [{ type: "refinance", id, rate, months, fee }]) as ROption[];
  return { ...base, options };
}
export function econRetailImpact(_s: RetailState, ep: WorldEpisode, optionId: string | null): { commands: RetailCommand[]; text: string } {
  const lbl = ep.mode === "ejercicio" ? "Ejercicio hipotético" : "Dato real, impacto simulado";
  const refi = optionId === "refinanciar" || optionId === "refinanciar_largo";
  return { commands: [], text: `${lbl}: ${ep.name}. ${refi ? "El crédito ya quedó refinanciado a la nueva tasa." : "El crédito es a tasa fija: tus pagos no cambian."}` };
}

// ───────────────────────────────────────────────────────────── acería
const contractsOf = (s: SteelState) => s.contracts.filter((k) => k.startDay <= s.day);

export function econSteelCase(s: SteelState, ep: WorldEpisode): SCase {
  const f = ep.facts!;
  const data = (): [string, string][] => [sourceRow(ep), ["Caja", mx(steelCash(s) / 100)]];
  if (f.t === "tasa") {
    return {
      id: caseIdOf(ep), area: "estrategia", from: "admin", minDay: 0,
      subject: "Bajaron las tasas: ¿refinanciar el crédito del laminador?",
      body: () => head(ep, s, s.templateId),
      data: () => { const r = rateParts(s.loans, f); return [sourceRow(ep), ["Saldo del crédito", mx(r.bal)], ["Tasa actual", pct(r.loan?.rate ?? 0)]]; },
      lesson: rateLesson, requires: () => ok,
      options: rateOptions<SteelState, SteelCommand>(s, f, (id, rate, months, fee) => [{ type: "refinance", id, rate, months, fee }]) as SOption[],
    };
  }
  if (f.t === "fx") {
    const ch = fxCh(f);
    const up = ch > 0;
    const cut = (x: number) => Math.round(x * 1000) / 1000;
    const options: SOption[] = up
      ? [
        { id: "base", stance: "equilibrada", label: "Absorber el nuevo precio de los consumibles importados", detail: () => `Ferroaleaciones y refractarios importados suben cerca de ${pct(ch * CONSUMABLES_USD)} en las compras de los próximos ${FX_DAYS} días. Sin otro gasto.`, commands: () => [] },
        { id: "nacional", stance: "prudente", label: "Pasar la mitad de lo importado a proveedores nacionales", detail: () => "La mitad del efecto del dólar desaparece. Homologar al proveedor cuesta $60,000 y el refractario nacional dura un poco menos (rendimiento del horno −0.2 % por dos meses).",
          commands: (_s, k) => [{ type: "one_off", id: `${k}:homol`, label: "Homologación de proveedor nacional de refractarios", amount: 60_000, payInDays: 15 }, { type: "modify", id: `${k}:rend`, key: "yieldMelt", add: -0.002, days: FX_DAYS }] },
        { id: "trasladar", stance: "arriesgada", label: "Subir 1 % el precio a todos los contratos", detail: () => "Recupera más que el efecto del dólar, pero los clientes lo resienten: algunos compran menos mientras comparan.",
          commands: (st, k) => [...contractsOf(st).map((c): SteelCommand => ({ type: "change_contract", id: `${k}:p:${c.id}`, contractId: c.id, price: Math.round((c.price / 100) * 1.01) })), { type: "relation", id: `${k}:cl`, key: "clients", delta: -0.04 }, { type: "modify", id: `${k}:dem`, key: "demand", mult: 0.98, days: FX_DAYS }] },
      ]
      : [
        { id: "base", stance: "equilibrada", label: "Aprovechar el ahorro en las compras normales", detail: () => `Ferroaleaciones y refractarios importados bajan cerca de ${pct(-ch * CONSUMABLES_USD)} durante ${FX_DAYS} días.`, commands: () => [] },
        { id: "adelantar", stance: "prudente", label: "Adelantar cuatro meses de consumibles importados", detail: () => "El ahorro dura el doble, pero inmoviliza caja: el costo financiero del inventario adelantado es de $45,000.",
          commands: (_s, k) => [{ type: "one_off", id: `${k}:inv`, label: "Costo financiero de consumibles adelantados", amount: 45_000, payInDays: 30 }] },
        { id: "bajar_precio", stance: "arriesgada", label: "Bajar 0.5 % el precio a todos los contratos", detail: () => "Comparte el ahorro con los clientes para ganar volumen; el ahorro del dólar es pequeño frente a la venta.",
          commands: (st, k) => [...contractsOf(st).map((c): SteelCommand => ({ type: "change_contract", id: `${k}:p:${c.id}`, contractId: c.id, price: Math.round((c.price / 100) * 0.995) })), { type: "relation", id: `${k}:cl`, key: "clients", delta: 0.02 }, { type: "modify", id: `${k}:dem`, key: "demand", mult: cut(1.01), days: FX_DAYS }] },
      ];
    return {
      id: caseIdOf(ep), area: "chatarra", from: "admin", minDay: 0,
      subject: up ? `El dólar subió ${pct(ch)}: consumibles importados más caros` : `El peso se fortaleció ${pct(-ch)}: consumibles importados más baratos`,
      body: () => head(ep, s, s.templateId), data,
      lesson: "El tipo de cambio solo mueve lo que de verdad está en dólares. Aquí es una parte pequeña de las compras: la decisión es si vale la pena cambiar de proveedor o de precio por un efecto acotado.",
      requires: () => ok, options,
    };
  }
  if (f.rule === "us_232_acero") return usSteelCase(s, ep);
  // arancel (H3)
  const d = tariffDemand(f);
  const up = f.to > f.from;
  const options: SOption[] = up
    ? [
      { id: "base", stance: "equilibrada", label: "Mantener precios y tomar el volumen que deja la importación", detail: () => `La varilla y la palanquilla importadas que compiten cuestan más: la demanda de tus clientes sube cerca de ${pct(d)} por ${TARIFF_DAYS} días.`, commands: () => [] },
      { id: "contrato", stance: "prudente", label: "Amarrar volumen con contratos de seis meses al precio actual", detail: () => "Los clientes agradecen la certidumbre; el volumen extra se queda más tiempo.", commands: (_s, k) => [{ type: "relation", id: `${k}:cl`, key: "clients", delta: 0.03 }] },
      { id: "precio", stance: "arriesgada", label: "Subir 3 % el precio aprovechando el arancel", detail: () => "Más margen por tonelada; los clientes lo notan y algunos buscan otra acería nacional.",
        commands: (st, k) => [...contractsOf(st).map((c): SteelCommand => ({ type: "change_contract", id: `${k}:p:${c.id}`, contractId: c.id, price: Math.round((c.price / 100) * 1.03) })), { type: "relation", id: `${k}:cl`, key: "clients", delta: -0.05 }] },
    ]
    : [
      { id: "base", stance: "equilibrada", label: "Mantener precios", detail: () => `Llega más producto importado más barato: la demanda de tus clientes baja cerca de ${pct(-d)} por ${TARIFF_DAYS} días.`, commands: () => [] },
      { id: "contrato", stance: "prudente", label: "Amarrar volumen con contratos de seis meses con 1 % de descuento", detail: () => "Cuesta 1 % de precio, pero protege la mitad del volumen que se iría a la importación.",
        commands: (st, k) => [...contractsOf(st).map((c): SteelCommand => ({ type: "change_contract", id: `${k}:p:${c.id}`, contractId: c.id, price: Math.round((c.price / 100) * 0.99) })), { type: "relation", id: `${k}:cl`, key: "clients", delta: 0.03 }] },
      { id: "precio", stance: "arriesgada", label: "Bajar 3 % el precio para competir con la importación", detail: () => "Defiende casi todo el volumen, pero cuesta margen en cada tonelada.",
        commands: (st, k) => contractsOf(st).map((c): SteelCommand => ({ type: "change_contract", id: `${k}:p:${c.id}`, contractId: c.id, price: Math.round((c.price / 100) * 0.97) })) },
    ];
  return {
    id: caseIdOf(ep), area: "clientes", from: "admin", minDay: 0,
    subject: `${up ? "Sube" : "Baja"} el arancel a la importación de acero: ¿qué haces con tus precios?`,
    body: () => head(ep, s, s.templateId), data,
    lesson: "Un arancel lo paga quien importa. A una acería nacional le llega de forma indirecta: cambia el precio del producto importado que compite. Por eso el efecto es sobre volumen y precio, no un cobro.",
    requires: () => ok, options,
  };
}

export function econSteelImpact(s: SteelState, ep: WorldEpisode, optionId: string | null, inevitableOnly = false): { commands: SteelCommand[]; text: string; parts?: { inevitable: string[]; evitable: string[]; future: string[] } } {
  const f = ep.facts!;
  if (f.rule === "us_232_acero") return usSteelImpact(s, ep, optionId, inevitableOnly);
  const k = `w:${ep.id}:imp`;
  const lbl = ep.mode === "ejercicio" ? "Ejercicio hipotético" : "Dato real, impacto simulado";
  const o = optionId ?? "base";
  if (f.t === "tasa") return { commands: [], text: `${lbl}: ${ep.name}. ${o.startsWith("refinanciar") ? "El crédito ya quedó refinanciado a la nueva tasa." : "El crédito es a tasa fija: tus pagos no cambian."}` };
  if (f.t === "fx") {
    const ch = fxCh(f);
    const share = CONSUMABLES_USD * (o === "nacional" ? 0.5 : 1);
    const days = o === "adelantar" ? FX_DAYS * 2 : FX_DAYS;
    const mult = Math.round((1 + ch * share) * 10_000) / 10_000;
    return { commands: [{ type: "modify", id: `${k}:cons`, key: "consumables", mult, days }], text: `${lbl}: con el dólar a ${f.to.toFixed(2)}, ferroaleaciones y refractarios ${ch > 0 ? "suben" : "bajan"} ${pct(Math.abs(mult - 1))} durante ${days} días${o === "nacional" ? " (la mitad ya con proveedor nacional)" : ""}.` };
  }
  const d = tariffDemand(f);
  const eff = o === "precio" ? (d > 0 ? d * 0.4 : d * 0.1) : o === "contrato" ? (d > 0 ? d : d * 0.5) : d;
  const days = o === "contrato" ? TARIFF_DAYS * 2 : TARIFF_DAYS;
  const mult = Math.round((1 + eff) * 10_000) / 10_000;
  return { commands: [{ type: "modify", id: `${k}:dem`, key: "demand", mult, days }], text: `${lbl}: con el arancel ${f.to > f.from ? "más alto" : "más bajo"}, la demanda de tus clientes se mueve ${pct(mult - 1)} durante ${days} días.` };
}

// ─────────────────────────────────────────────────────────────── H4 · arancel de EE. UU. a la exportación de acero
/** Contrato de exportación vigente (lo abre una decisión del jugador; la plantilla inicial no exporta). */
export const exportContractOf = (s: SteelState) => {
  const tag = exposureOf(s.templateId)?.profile.exportContracts?.clientTag;
  return tag ? s.contracts.find((k) => k.startDay <= s.day && k.tpd > 0 && k.client.includes(tag)) ?? null : null;
};
const usTerms = (s: SteelState) => exposureOf(s.templateId)?.profile.exportContracts ?? null;

function usSteelCase(s: SteelState, ep: WorldEpisode): SCase {
  const f = ep.facts!;
  const k0 = exportContractOf(s);
  const t = usTerms(s);
  const delta = f.to - f.from;
  const inc = usIncidence(!!t?.importerOfRecord, delta);
  const price = k0 ? k0.price / 100 : 0, tpd = k0?.tpd ?? 0;
  const monthly = Math.round(price * tpd * 30);
  const options: SOption[] = [
    { id: "base", stance: "equilibrada", label: "Mantener el precio pactado y dejar que el comprador absorba el arancel",
      detail: () => `Con entrega ${t?.incoterm ?? "DAP"} el arancel lo paga el comprador al importar. Sin descuento, compra cerca de ${pct(inc.inevitableVol + inc.keepVol, 0)} menos durante ${US_DAYS} días.`, commands: () => [] },
    { id: "compartir", stance: "prudente", label: `Compartir el golpe: ${pct(inc.shareDiscount, 0)} de descuento por ${US_DAYS} días`,
      detail: () => `El comprador sigue pagando el arancel, pero con el descuento solo recorta lo inevitable (cerca de ${pct(inc.inevitableVol, 0)} del volumen). Cuesta ${mx(Math.round(monthly * inc.shareDiscount))} al mes en precio.`,
      commands: (st, k) => { const c = exportContractOf(st); return c ? [{ type: "change_contract", id: `${k}:desc`, contractId: c.id, price: Math.round((c.price / 100) * (1 - inc.shareDiscount)) }, { type: "later", id: `${k}:fin`, inDays: US_DAYS, cmd: { type: "change_contract", id: `${k}:fin`, contractId: c.id, price: Math.round(c.price / 100) } }] : []; } },
    { id: "redirigir", stance: "prudente", label: "Redirigir la mitad del volumen al mercado nacional",
      detail: () => `La mitad de las toneladas de exportación pasa a relaminadoras nacionales con ${pct(REDIRECT_DISCOUNT, 0)} de descuento sobre el precio de exportación, a partir de 20 días. Menos dependencia del arancel; el cliente de Houston lo resiente.`,
      commands: (st, k) => { const c = exportContractOf(st); if (!c) return []; const half = Math.max(1, Math.round(c.tpd / 2)); return [{ type: "change_contract", id: `${k}:mitad`, contractId: c.id, tpd: c.tpd - half }, { type: "add_contract", id: `${k}:nac`, client: "Relaminadora nacional (volumen redirigido)", product: c.product, tpd: half, price: Math.round((c.price / 100) * (1 - REDIRECT_DISCOUNT)), dso: 30, startInDays: 20 }, { type: "relation", id: `${k}:cl`, key: "clients", delta: -0.01 }]; } },
    { id: "ddp", stance: "arriesgada", label: "Ofrecer entrega DDP: tu empresa importa y paga el arancel",
      detail: () => `El comprador no ve el arancel y no recorta por precio, pero tu empresa pasa a ser importadora de registro en EE. UU.: el ${pct(f.to, 0)} sale de tu precio (cerca de ${mx(Math.round(monthly * delta))} al mes por el aumento) más el despacho.`,
      commands: (st, k) => { const c = exportContractOf(st); return c ? [{ type: "change_contract", id: `${k}:ddp`, contractId: c.id, price: Math.round((c.price / 100) * (1 - delta)) }, { type: "add_fixed", id: `${k}:agente`, label: "Agente aduanal y fianza de importación en EE. UU.", amount: 35_000 }] : []; } },
  ];
  return {
    id: caseIdOf(ep), area: "clientes", from: "admin", minDay: 0,
    subject: `${ep.name}: ¿qué haces con tu exportación a Texas?`,
    body: () => [...head(ep, s, s.templateId), `Quién paga: con entrega ${t?.incoterm ?? "DAP"} el importador de registro es ${t?.counterpart ?? "el comprador"}. A tu empresa no le cobran el arancel; le llega por precio y volumen. Solo si vendes DDP lo pagas tú.`],
    data: () => [sourceRow(ep), ["Contrato de exportación", k0 ? `${tpd} t diarias a ${mx(price)}` : "Sin contrato vigente"], ["Venta mensual expuesta", mx(monthly)], ["Quién paga el arancel", inc.payer === "empresa" ? "Tu empresa (DDP)" : "El comprador (importador de registro)"], ["Caja", mx(steelCash(s) / 100)]],
    lesson: "Un arancel lo paga quien importa. Al exportador le llega de forma indirecta: el comprador pide descuento o compra menos. Una parte no se evita (el producto mexicano se encarece para todos en ese mercado); lo que se decide es cuánto volumen defender, a qué precio y con qué dependencia de un solo mercado.",
    requires: () => ok, options,
  };
}

function usSteelImpact(s: SteelState, ep: WorldEpisode, optionId: string | null, inevitableOnly: boolean): { commands: SteelCommand[]; text: string; parts: { inevitable: string[]; evitable: string[]; future: string[] } } {
  const f = ep.facts!;
  const k = `w:${ep.id}:imp`;
  const lbl = ep.mode === "ejercicio" ? "Ejercicio hipotético" : "Dato real, impacto simulado";
  const c = exportContractOf(s);
  const t = usTerms(s);
  const inc = usIncidence(!!t?.importerOfRecord, f.to - f.from);
  const o = inevitableOnly ? "inevitable" : optionId ?? "base";
  const parts = { inevitable: [] as string[], evitable: [] as string[], future: [] as string[] };
  if (!c) return { commands: [], text: `${lbl}: ${ep.name}. Ya no hay contrato de exportación vigente: sin efecto.`, parts };
  const loss = o === "ddp" ? 0 : o === "base" ? inc.inevitableVol + inc.keepVol : inc.inevitableVol;
  const tpd = Math.max(0, Math.round(c.tpd * (1 - Math.min(0.9, loss)) * 10) / 10); // décimas de tonelada: 4 % de 12 t sí cuenta
  const cmds: SteelCommand[] = [];
  if (tpd !== c.tpd) cmds.push({ type: "change_contract", id: `${k}:vol`, contractId: c.id, tpd }, { type: "later", id: `${k}:vuelve`, inDays: US_DAYS, cmd: { type: "change_contract", id: `${k}:vuelve`, contractId: c.id, tpd: c.tpd } });
  parts.inevitable.push(`El acero mexicano se encarece en EE. UU. para todos: el comprador recorta cerca de ${pct(inc.inevitableVol, 0)} del volumen por ${US_DAYS} días, se decida lo que se decida (hipótesis H4: ${US_INEVITABLE_VOL} × el aumento).`);
  if (o === "base") parts.evitable.push(`Sin compartir el golpe, el comprador recorta otro ${pct(inc.keepVol, 0)} (H4: ${US_VOL_KEEP} × el aumento).`);
  if (o === "compartir") parts.future.push(`El descuento de ${pct(inc.shareDiscount, 0)} (H4: ${US_PASS} × el aumento) vence a los ${US_DAYS} días.`);
  if (o === "ddp") parts.future.push("Tu empresa queda como importadora de registro: el arancel completo sale de tu precio mientras siga la medida.");
  if (o === "ddp") parts.inevitable.splice(0, 1, "Con DDP el comprador no ve el arancel: el volumen se sostiene, pero el arancel lo pagas tú.");
  const text = `${lbl}: ${ep.name}. El contrato de exportación pasa de ${c.tpd.toLocaleString("es-MX")} a ${tpd.toLocaleString("es-MX")} t diarias por ${US_DAYS} días${o === "ddp" ? " (DDP: el arancel lo pagas tú)" : " (el arancel lo paga el comprador)"}.`;
  return { commands: cmds, text, parts };
}
