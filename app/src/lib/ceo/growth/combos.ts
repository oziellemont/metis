/**
 * mêtis CEO · Growth Engine · industrias con motor de crecimiento (piloto: Monterrey).
 * Sin dependencias: lo leen la taxonomía del onboarding y el motor de la partida.
 * Cada industria piloto tiene dos tamaños: StartUp (pequeña, para crecerla desde abajo) y Empresa consolidada
 * (el mismo motor con muchas más personas, varias sedes y estructura formal).
 */
/** sector/industria → plantilla del motor, por tamaño. */
export const GROWTH_COMBOS: Readonly<Record<string, { startup: string; consolidada: string }>> = Object.freeze({
  "restaurantes_alimentos/restaurantes": { startup: "restaurante_emergente", consolidada: "restaurante_consolidada" },
  "manufactura/autopartes": { startup: "manufactura_emergente", consolidada: "manufactura_consolidada" },
  "manufactura/metalica_basica": { startup: "aceria_emergente", consolidada: "aceria_consolidada" },
});
export type GrowthSize = "startup" | "consolidada";
/** Tipo interno con el que se guarda una StartUp del motor (el texto visible es «StartUp»). */
export const GROWTH_ARCHETYPE = "pyme" as const;
/** Tamaño según el tipo interno: «establecida» es la empresa consolidada; cualquier otro, la StartUp. */
export const sizeOfArchetype = (archetype?: string): GrowthSize => (archetype === "establecida" ? "consolidada" : "startup");
export const growthTemplateFor = (sectorId?: string, industryId?: string, archetype?: string): string | null => GROWTH_COMBOS[`${sectorId}/${industryId}`]?.[sizeOfArchetype(archetype)] ?? null;
/** Tipos internos que pueden llevar el motor: StartUp (pyme) y consolidada (establecida). */
export const GROWTH_ARCHETYPES: readonly string[] = [GROWTH_ARCHETYPE, "establecida"];
