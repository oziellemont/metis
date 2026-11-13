/**
 * MÊTIS 2.0 · Repositorio Académico · experiencias inmersivas convertidas.
 *
 * El orden es el de los identificadores editoriales. Ninguna registra evidencia.
 */
import type { Experiencia } from "./tipos";
import { N1_FINANZAS_UTILIDAD_CAJA } from "./n1-finanzas-utilidad-caja";
import { N1_ESTRATEGIA_POR_QUE_NOS_ELIGEN } from "./n1-estrategia-por-que-nos-eligen";
import { N1_FINANZAS_VENTAS_NO_SON_UTILIDAD } from "./n1-finanzas-ventas-no-son-utilidad";
import { N1_LIDERAZGO_RESPONSABLE } from "./n1-liderazgo-responsable-no-es-hacerlo-todo";
import { N1_OPERACIONES_PEDIDO_ENTRE_AREAS } from "./n1-operaciones-pedido-entre-areas";
import { N1_CRECIMIENTO_NO_TODOS_COMPRAN_IGUAL } from "./n1-crecimiento-no-todos-compran-igual";
import { N1_RIESGO_EL_PROVEEDOR_ES_FAMILIA } from "./n1-riesgo-el-proveedor-es-familia";
import { N1_ESTRATEGIA_TRES_PROPUESTAS } from "./n1-estrategia-tres-propuestas-un-presupuesto";
import { N1_LIDERAZGO_CORREO_DECISION } from "./n1-liderazgo-ese-correo-necesita-una-decision";
import { N1_OPERACIONES_TABLERO_EN_VERDE } from "./n1-operaciones-el-tablero-esta-en-verde";
import { N1_CRECIMIENTO_COBRAR_MAS } from "./n1-crecimiento-cobrar-mas-no-es-cobrar-de-mas";
import { N1_RIESGO_MISMA_PERSONA } from "./n1-riesgo-la-misma-persona-hace-todo-el-pago";

export const EXPERIENCIAS: Experiencia[] = [
  N1_FINANZAS_UTILIDAD_CAJA,
  N1_ESTRATEGIA_POR_QUE_NOS_ELIGEN,
  N1_FINANZAS_VENTAS_NO_SON_UTILIDAD,
  N1_LIDERAZGO_RESPONSABLE,
  N1_OPERACIONES_PEDIDO_ENTRE_AREAS,
  N1_CRECIMIENTO_NO_TODOS_COMPRAN_IGUAL,
  N1_RIESGO_EL_PROVEEDOR_ES_FAMILIA,
  N1_ESTRATEGIA_TRES_PROPUESTAS,
  N1_LIDERAZGO_CORREO_DECISION,
  N1_OPERACIONES_TABLERO_EN_VERDE,
  N1_CRECIMIENTO_COBRAR_MAS,
  N1_RIESGO_MISMA_PERSONA,
];

export const experienciaBySlug = (slug: string): Experiencia | undefined => EXPERIENCIAS.find((x) => x.slug === slug);
export const experienciaByEditorial = (editorialId: string): Experiencia | undefined => EXPERIENCIAS.find((x) => x.editorialId === editorialId);

export * from "./tipos";
export * from "./motor";
export { ALIAS_FUENTES, ATLAS, FUENTES, LOTE_N1, LOTE_02, LOTE_03, LOTES, PAQUETE_ARCHIVOS, PACKAGE_VERSION, SOURCES_CHECKED_AT, atlasSources, editorialOfSkill, itemOf, loteOf, skillOfEditorial } from "./fuentes";
