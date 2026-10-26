/**
 * Registro de empresas de mêtis CEO. Cada empresa es un «paquete» (elenco, red de relaciones,
 * glosario, tablero e historias). Todos los nombres son ficticios.
 */
import type { CompanyPack } from "../types";
import { CUMBRE } from "./cumbre";
import { FORJA } from "./forja";
import { BRASA } from "./brasa";

/** Empresas jugables (el orden es el del mapa de carrera). */
export const COMPANIES: CompanyPack[] = [CUMBRE, FORJA, BRASA];
export const FIRST_COMPANY = CUMBRE.id;

/** Lo que viene (se muestra en el mapa como «próximamente»). */
export const UPCOMING: { id: string; name: string; industry: string; emoji: string; tagline: string }[] = [
  { id: "alba", name: "Tiendas Alba", industry: "Tiendas de conveniencia", emoji: "🏪", tagline: "2,000 tiendas, una guerra de esquinas y un franquiciatario furioso." },
  { id: "sanrafael", name: "Hospital San Rafael", industry: "Salud privada", emoji: "🏥", tagline: "Aseguradoras que aprietan, médicos que son dueños y una inflación médica de dos dígitos." },
  { id: "kubit", name: "Kúbit", industry: "Startup de software", emoji: "💻", tagline: "8 meses de runway, un inversionista nervioso y un cliente que vale el 40% del MRR." },
  { id: "roca", name: "Grupo Roca", industry: "Materiales de construcción", emoji: "🧱", tagline: "Cemento, autoconstrucción y una crisis de demanda en el peor momento." },
  { id: "verde", name: "Verde Michoacán", industry: "Agroexportación", emoji: "🥑", tagline: "Aguacate de exportación, una inspección en frontera y presiones que no salen en el balance." },
];

const BY_ID: Record<string, CompanyPack> = Object.fromEntries(COMPANIES.map((c) => [c.id, c]));
export const companyById = (id: string | undefined): CompanyPack => BY_ID[id ?? ""] ?? CUMBRE;
export const isCompany = (id: string) => !!BY_ID[id];

/** Busca un asunto en cualquier empresa (para validar rutas). */
export function findItem(id: string) {
  for (const c of COMPANIES) {
    const it = c.items.find((i) => i.id === id);
    if (it) return { company: c, item: it };
  }
  return null;
}
