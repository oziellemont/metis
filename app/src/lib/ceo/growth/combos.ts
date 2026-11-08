/**
 * mêtis CEO · Growth Engine · industrias con empresa emergente jugable (piloto: Monterrey).
 * Sin dependencias: lo leen la taxonomía del onboarding y el motor de la partida.
 */
/** sector/industria → plantilla del motor. */
export const GROWTH_COMBOS: Readonly<Record<string, string>> = Object.freeze({
  "restaurantes_alimentos/restaurantes": "restaurante_emergente",
  "manufactura/autopartes": "manufactura_emergente",
});
export const growthTemplateFor = (sectorId?: string, industryId?: string): string | null => GROWTH_COMBOS[`${sectorId}/${industryId}`] ?? null;
/** Tipo interno con el que se guarda una empresa emergente (el texto visible es «Empresa emergente»). */
export const GROWTH_ARCHETYPE = "pyme" as const;
