/**
 * Registro de empresas de mêtis CEO. Cada empresa es un «paquete» (elenco, red de relaciones,
 * glosario, tablero e historias). Todos los nombres son ficticios.
 */
import type { CompanyPack } from "../types";
import { CUMBRE } from "./cumbre";
import { FORJA } from "./forja";
import { BRASA } from "./brasa";
import { KUBIT } from "./kubit";
import { withBank } from "../cases/bank";

/** Empresas jugables (el orden es el del mapa de carrera). */
export const COMPANIES: CompanyPack[] = [CUMBRE, FORJA, BRASA, KUBIT];
export const FIRST_COMPANY = CUMBRE.id;
/**
 * Rotación del modo por temporadas (legacy): las tres empresas fundacionales, fija.
 * Las empresas nuevas entran por la carrera continua (el jugador elige su industria);
 * así las partidas grabadas se reproducen igual y ningún resultado histórico cambia.
 */
export const LEGACY_ROTATION: CompanyPack[] = [CUMBRE, FORJA, BRASA];

/** Lo que viene ya no vive aquí: ver el catálogo editorial en ../catalog.ts (estados available / coming_soon / retired). */

const BY_ID: Record<string, CompanyPack> = Object.fromEntries(COMPANIES.map((c) => [c.id, c]));
export const companyById = (id: string | undefined): CompanyPack => BY_ID[id ?? ""] ?? CUMBRE;
export const isCompany = (id: string) => !!BY_ID[id];

/** Busca un asunto en cualquier empresa (para validar rutas). */
export function findItem(id: string) {
  for (const c of COMPANIES.map(withBank)) {
    const it = c.items.find((i) => i.id === id);
    if (it) return { company: c, item: it };
  }
  return null;
}
