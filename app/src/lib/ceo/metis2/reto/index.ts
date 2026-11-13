/**
 * MÊTIS 2.0 · Executive Challenge: retos integradores en demostración (no acreditan).
 */
import { EC_N1_002_A } from "./ec-n1-002-a";
import type { Reto } from "./tipos";

export * from "./tipos";
export * from "./motor";
export { EC_N1_002_A };

/** Retos convertidos. EC-N1-001-A (v1.0) sigue solo en el catálogo editorial: no se sobrescribe. */
export const RETOS_DEMO: Reto[] = [EC_N1_002_A];
export const retoBySlug = (slug: string) => RETOS_DEMO.find((r) => r.slug === slug);
