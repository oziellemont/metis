/**
 * MÊTIS 2.0 · Repositorio Académico · experiencias inmersivas convertidas.
 *
 * Estado del lote v1.0: una experiencia piloto, en revisión. Ninguna registra evidencia.
 */
import type { Experiencia } from "./tipos";
import { N1_FINANZAS_UTILIDAD_CAJA } from "./n1-finanzas-utilidad-caja";

export const EXPERIENCIAS: Experiencia[] = [N1_FINANZAS_UTILIDAD_CAJA];

export const experienciaBySlug = (slug: string): Experiencia | undefined => EXPERIENCIAS.find((x) => x.slug === slug);
export const experienciaByEditorial = (editorialId: string): Experiencia | undefined => EXPERIENCIAS.find((x) => x.editorialId === editorialId);

export * from "./tipos";
export * from "./motor";
export { ATLAS, FUENTES, LOTE_N1, PAQUETE_ARCHIVOS, PACKAGE_VERSION, SOURCES_CHECKED_AT, atlasSources, editorialOfSkill, skillOfEditorial } from "./fuentes";
