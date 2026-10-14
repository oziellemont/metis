/**
 * Cobro de la plataforma: se paga por colaborador ACTIVO CON SCORECARD (no por plantilla total).
 * Única fuente de los precios: la landing (#precios) y la Consola usan esta tabla.
 * El conteo real lo hace Supabase (metis.billable_count, migración 0012) y se factura el pico del mes.
 */
export interface PriceTier { id: string; name: string; from: number; to: number | null; price: number | null; setup: string; hot?: boolean }

export const MIN_SEATS = 15;

export const PRICE_TIERS: PriceTier[] = [
  { id: "arranca", name: "Arranque", from: 15, to: 60, price: 189, setup: "$35,000" },
  { id: "crece", name: "Crecimiento", from: 61, to: 300, price: 159, setup: "$75,000", hot: true },
  { id: "escala", name: "Escala", from: 301, to: 1500, price: 129, setup: "$150,000" },
  { id: "corporativo", name: "Corporativo", from: 1501, to: null, price: null, setup: "Cotización" },
];

/** Escalón que corresponde a N colaboradores con scorecard (con el mínimo aplicado). */
export function tierFor(seats: number): PriceTier {
  const n = Math.max(seats, MIN_SEATS);
  return PRICE_TIERS.find((t) => n >= t.from && (t.to === null || n <= t.to)) ?? PRICE_TIERS[PRICE_TIERS.length - 1];
}

/** Estimado mensual en MXN antes de IVA (null = a la medida). */
export function monthlyEstimate(seats: number, discountPct = 0): { seats: number; charged: number; tier: PriceTier; amount: number | null } {
  const tier = tierFor(seats);
  const charged = Math.max(seats, MIN_SEATS);
  const amount = tier.price === null ? null : Math.round(charged * tier.price * (1 - discountPct / 100));
  return { seats, charged, tier, amount };
}

export const mxn = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
